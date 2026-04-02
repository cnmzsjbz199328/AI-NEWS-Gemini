/**
 * Storage adapter — three-tier selection:
 *   1. KV_REST_API_URL + KV_REST_API_TOKEN present → try Upstash Redis
 *      If first connection fails (fetch failed / ECONNREFUSED) → fall back to (3)
 *   2. Explicit USE_MEMORY_STORE=true → in-memory immediately
 *   3. No credentials → in-memory (local dev, no Redis required)
 *
 * Implements only the Upstash Redis API subset used by TaskStorageService.
 */

import { Redis } from '@upstash/redis'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface StorageAdapter {
  hset(key: string, data: Record<string, unknown>): Promise<unknown>
  hgetall<T>(key: string): Promise<T | null>
  expire(key: string, seconds: number): Promise<unknown>
  hincrby(key: string, field: string, increment: number): Promise<number>
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown>
  get<T>(key: string): Promise<T | null>
  exists(key: string): Promise<number>
  keys(pattern: string): Promise<string[]>
  pipeline(): PipelineAdapter
}

export interface PipelineAdapter {
  hset(key: string, data: Record<string, unknown>): this
  expire(key: string, seconds: number): this
  set(key: string, value: unknown, opts?: { ex?: number }): this
  exec(): Promise<unknown[]>
}

// ─── In-memory adapter ────────────────────────────────────────────────────────

class MemoryPipeline implements PipelineAdapter {
  private ops: Array<() => void> = []
  constructor(private store: Map<string, { value: unknown; expiresAt?: number }>) {}

  hset(key: string, data: Record<string, unknown>): this {
    this.ops.push(() => {
      const existing = (this.store.get(key)?.value as Record<string, unknown>) ?? {}
      this.store.set(key, { value: { ...existing, ...data } })
    })
    return this
  }

  expire(key: string, seconds: number): this {
    this.ops.push(() => {
      const entry = this.store.get(key)
      if (entry) this.store.set(key, { ...entry, expiresAt: Date.now() + seconds * 1000 })
    })
    return this
  }

  set(key: string, value: unknown, opts?: { ex?: number }): this {
    this.ops.push(() => {
      const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : undefined
      this.store.set(key, { value, expiresAt })
    })
    return this
  }

  async exec(): Promise<unknown[]> {
    this.ops.forEach(op => op())
    return this.ops.map(() => null)
  }
}

class MemoryAdapter implements StorageAdapter {
  private store = new Map<string, { value: unknown; expiresAt?: number }>()

  private alive(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return false
    }
    return true
  }

  async hset(key: string, data: Record<string, unknown>): Promise<number> {
    const existing = this.alive(key) ? (this.store.get(key)!.value as Record<string, unknown>) : {}
    this.store.set(key, { value: { ...existing, ...data } })
    return Object.keys(data).length
  }

  async hgetall<T>(key: string): Promise<T | null> {
    return this.alive(key) ? (this.store.get(key)!.value as T) : null
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key)
    if (!entry) return 0
    this.store.set(key, { ...entry, expiresAt: Date.now() + seconds * 1000 })
    return 1
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    const existing = (this.alive(key)
      ? (this.store.get(key)!.value as Record<string, unknown>)
      : {}) as Record<string, number>
    const newVal = (existing[field] ?? 0) + increment
    existing[field] = newVal
    this.store.set(key, { value: existing })
    return newVal
  }

  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<string> {
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : undefined
    this.store.set(key, { value, expiresAt })
    return 'OK'
  }

  async get<T>(key: string): Promise<T | null> {
    return this.alive(key) ? (this.store.get(key)!.value as T) : null
  }

  async exists(key: string): Promise<number> {
    return this.alive(key) ? 1 : 0
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    )
    return Array.from(this.store.keys()).filter(k => this.alive(k) && regex.test(k))
  }

  pipeline(): PipelineAdapter {
    return new MemoryPipeline(this.store)
  }
}

// ─── Resilient Redis adapter — auto-falls-back on connection failure ──────────

const NETWORK_ERRORS = ['fetch failed', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT']

class ResilientAdapter implements StorageAdapter {
  private memory = new MemoryAdapter()
  private dead = false

  constructor(private redis: Redis) {}

  private async run<T>(redisOp: () => Promise<T>, memOp: () => Promise<T>): Promise<T> {
    if (this.dead) return memOp()
    try {
      return await redisOp()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (NETWORK_ERRORS.some(e => msg.includes(e))) {
        console.warn('[Storage] Redis unreachable — switching to in-memory store for this session')
        this.dead = true
        return memOp()
      }
      throw err
    }
  }

  hset(k: string, d: Record<string, unknown>) {
    return this.run(() => this.redis.hset(k, d) as Promise<unknown>, () => this.memory.hset(k, d))
  }
  hgetall<T>(k: string) {
    return this.run(() => this.redis.hgetall(k) as Promise<T | null>, () => this.memory.hgetall<T>(k))
  }
  expire(k: string, s: number) {
    return this.run(() => this.redis.expire(k, s) as Promise<unknown>, () => this.memory.expire(k, s))
  }
  hincrby(k: string, f: string, n: number) {
    return this.run(() => this.redis.hincrby(k, f, n), () => this.memory.hincrby(k, f, n))
  }
  set(k: string, v: unknown, opts?: { ex?: number }) {
    const redisOpts = opts?.ex != null ? { ex: opts.ex } : undefined
    return this.run(() => this.redis.set(k, v, redisOpts) as Promise<unknown>, () => this.memory.set(k, v, opts))
  }
  get<T>(k: string) {
    return this.run(() => this.redis.get<T>(k), () => this.memory.get<T>(k))
  }
  exists(k: string) {
    return this.run(() => this.redis.exists(k) as Promise<number>, () => this.memory.exists(k))
  }
  keys(pattern: string) {
    return this.run(() => this.redis.keys(pattern), () => this.memory.keys(pattern))
  }
  pipeline(): PipelineAdapter {
    // Pipeline goes directly to memory if dead; otherwise use memory pipeline
    // (Upstash pipeline is fire-and-forget; using memory pipeline is safe for local dev)
    if (this.dead) return this.memory.pipeline()
    // Wrap: try redis pipeline, fall back to memory pipeline on exec error
    const memPipeline = this.memory.pipeline()
    const redisPipeline = this.redis.pipeline()
    return {
      hset: (k, d) => { redisPipeline.hset(k, d); memPipeline.hset(k, d); return memPipeline as PipelineAdapter },
      expire: (k, s) => { redisPipeline.expire(k, s); memPipeline.expire(k, s); return memPipeline as PipelineAdapter },
      set: (k, v, o) => { const ro = o?.ex != null ? { ex: o.ex } : undefined; redisPipeline.set(k, v, ro); memPipeline.set(k, v, o); return memPipeline as PipelineAdapter },
      exec: async () => {
        try {
          const result = await redisPipeline.exec()
          return result as unknown[]
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          if (NETWORK_ERRORS.some(e => msg.includes(e))) {
            console.warn('[Storage] Redis pipeline failed — using in-memory fallback')
            this.dead = true
            return memPipeline.exec()
          }
          throw err
        }
      },
    }
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────
// Use globalThis so the singleton is shared across all Next.js route module
// contexts within the same Node.js process (critical for in-memory store).

declare global {
  // eslint-disable-next-line no-var
  var __storageClient: StorageAdapter | undefined
}

export function getStorageClient(): StorageAdapter {
  if (globalThis.__storageClient) return globalThis.__storageClient

  let client: StorageAdapter

  if (process.env.USE_MEMORY_STORE === 'true') {
    console.warn('[Storage] USE_MEMORY_STORE=true — using in-memory store')
    client = new MemoryAdapter()
  } else {
    const url = process.env.KV_REST_API_URL
    const token = process.env.KV_REST_API_TOKEN

    if (url && token) {
      client = new ResilientAdapter(new Redis({ url, token }))
    } else {
      console.warn('[Storage] KV credentials not set — using in-memory store (local dev)')
      client = new MemoryAdapter()
    }
  }

  globalThis.__storageClient = client
  return client
}
