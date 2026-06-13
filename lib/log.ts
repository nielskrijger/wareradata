import type { Logger } from 'pino'

import { getHeapStatistics } from 'node:v8'

import pino from 'pino'

/**
 * App-wide structured logger. Emits one JSON object per line to stdout, which
 * Railway parses into level + message + queryable attributes (filter with
 * `@field:value`). Use a child logger per area and pass fields as the first
 * arg: `const log = logger.child({ phase: 'scraper' })` then
 * `log.info({ users: n }, 'hydrated users')`.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // Drop pid/hostname; Railway tags the service/replica itself.
  base: undefined,
  // Railway matches string levels (debug/info/warn/error); Pino defaults to numeric.
  formatters: {
    level: label => ({ level: label }),
  },
  // Lets `log.error({ err }, 'msg')` serialize an Error to message + stack.
  serializers: {
    err: pino.stdSerializers.err,
  },
})

const MB = 1024 * 1024

/**
 * Process memory as rounded MB fields, plus `heapPct` (heapUsed ÷ the V8
 * old-space limit) — the OOM signal: it climbs toward 100 just before the
 * process aborts. Spread into a log call's fields (`@heapPct:>90` on Railway).
 */
export function memoryUsage(): {
  rssMb: number
  heapUsedMb: number
  heapLimitMb: number
  heapPct: number
  heapTotalMb: number
  externalMb: number
  arrayBuffersMb: number
} {
  const m = process.memoryUsage()
  const heapLimit = getHeapStatistics().heap_size_limit
  return {
    rssMb: Math.round(m.rss / MB),
    heapUsedMb: Math.round(m.heapUsed / MB),
    heapLimitMb: Math.round(heapLimit / MB),
    heapPct: Math.round((m.heapUsed / heapLimit) * 100),
    heapTotalMb: Math.round(m.heapTotal / MB),
    externalMb: Math.round(m.external / MB),
    arrayBuffersMb: Math.round(m.arrayBuffers / MB),
  }
}

/**
 * Logs a memory snapshot tagged with `label`, under the given child logger.
 */
export function logMemory(log: Logger, label: string): void {
  log.info({ label, ...memoryUsage() }, 'mem')
}

/**
 * Forces a full GC (only available under `node --expose-gc`) then logs memory,
 * so the number reflects what's actually retained rather than uncollected
 * garbage. Falls back to a plain reading without `--expose-gc`.
 */
export function logRetainedMemory(log: Logger, label: string): void {
  const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc
  if (gc) {
    gc()
  }
  logMemory(log, gc ? `${label} (post-gc)` : label)
}
