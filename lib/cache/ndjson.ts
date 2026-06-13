import { once } from 'node:events'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, rename, unlink } from 'node:fs/promises'
import path from 'node:path'
import { createInterface } from 'node:readline'

/**
 * Streams a newline-delimited JSON file, invoking `onRecord` per parsed line.
 * Resolves silently when the file doesn't exist yet (no scrape has run). Skips
 * blank or unparseable lines (e.g. a torn final line from a crashed writer).
 *
 * The shared reader behind the per-user stores (users / equipment / factories);
 * each wraps this with its own path and record type.
 */
export async function streamNdjson<T>(filePath: string, onRecord: (record: T) => void): Promise<void> {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  try {
    for await (const line of rl) {
      if (!line.trim()) {
        continue
      }
      try {
        onRecord(JSON.parse(line) as T)
      } catch {
        // Skip a torn/partial line rather than failing the whole read.
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
}

/**
 * Atomically writes a file by streaming into a temp file beside `filePath`, then
 * renaming over the final path — so a crashed/partial write leaves the previous
 * file intact. Hands `produce` a backpressure-aware `write(chunk)`; on any error
 * the temp file is destroyed and removed. Creates the parent directory if needed.
 *
 * Used by {@link writeNdjson} for the simple iterable case, and directly by a
 * concurrent producer (the factory scrape) that can't expose a plain iterable
 * but wants the same atomic-rename guarantee.
 */
export async function writeFileAtomic(
  filePath: string,
  produce: (write: (chunk: string) => Promise<void>) => Promise<void>,
): Promise<void> {
  // The main scrape writes these before snapshot.json, so on a cold volume the
  // data dir may not exist yet.
  await mkdir(path.dirname(filePath), { recursive: true })

  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`
  const out = createWriteStream(tmpPath, { encoding: 'utf8' })

  async function write(chunk: string): Promise<void> {
    if (!out.write(chunk)) {
      await once(out, 'drain')
    }
  }

  try {
    await produce(write)
    out.end()
    await once(out, 'finish')
    await rename(tmpPath, filePath)
  } catch (err) {
    out.destroy()
    await unlink(tmpPath).catch(() => undefined)
    throw err
  }
}

/**
 * Atomically (re)writes a newline-delimited JSON file from `records`: streams one
 * JSON line per record (with backpressure) via {@link writeFileAtomic}, so the
 * whole blob is never held in a buffer and a crashed write leaves the previous
 * file intact.
 *
 * `records` is an iterable (accepts a generator), so the caller can yield records
 * lazily without first materializing a wrapper array.
 */
export function writeNdjson<T>(filePath: string, records: Iterable<T>): Promise<void> {
  return writeFileAtomic(filePath, async (write) => {
    for (const record of records) {
      await write(`${JSON.stringify(record)}\n`)
    }
  })
}
