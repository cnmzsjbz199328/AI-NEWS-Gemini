/**
 * Storage adapter — auto-selects backend at startup:
 *   Production  : Upstash Redis (KV_REST_API_URL + KV_REST_API_TOKEN present)
 *   Local dev   : In-memory store (no Redis required)
 *
 * Implements only the subset of the Upstash Redis API used by TaskStorageService.
 */

import { Redis } from '@upstash/redis'

// ─── Shared interface ─────────────────────────────────────────────────────────

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

// ─── In-memory adapter (local dev) ───────────────────────────────────────────

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
    const existing = (this.alive(key) ? (this.store.get(key)!.value as Record<string, unknown>) : {}) as Record<string, number>
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
    // Convert Redis glob pattern to regex (supports * and ?)
    const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
    return Array.from(this.store.keys()).filter(k => this.alive(k) && regex.test(k))
  }

  pipeline(): PipelineAdapter {
    return new MemoryPipeline(this.store)
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _client: StorageAdapter | null = null

export function getStorageClient(): StorageAdapter {
  if (_client) return _client

  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN

  if (url && token) {
    _client = new Redis({ url, token }) as unknown as StorageAdapter
  } else {
    console.warn('[Storage] KV_REST_API_URL/TOKEN not set — using in-memory store (local dev only)')
    _client = new MemoryAdapter()
  }

  return _client
}
