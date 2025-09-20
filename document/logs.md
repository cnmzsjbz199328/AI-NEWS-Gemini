import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: 'https://epic-heron-6492.upstash.io',
  token: 'ARjrASQ-ODZlZTQ5NWEtNDFlOC00YTgxLTlhZjQtMTA1MzViN2E5MWU2QVJsY0FBSW1jREpoT0RBME1XSTJOVEF5WVdRMFkySXpPV0ZoTWpWaE1qY3hZV1V5TldZMU5IQXlOalE1TWc=',
})

await redis.set('foo', 'bar');
const data = await redis.get('foo');