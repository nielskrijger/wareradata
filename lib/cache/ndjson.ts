import { once } from 'node:events'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, rename, unlink } from 'node:fs/promises'
import path from 'node:path'
import { createInterface } from 'node:readline'

import { tempPathFor } from './file-store'

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
 * Streams into a temp file and renames it over `filePath`, so a crashed write
 * leaves the previous file intact. `produce` gets a backpressure-aware `write`,
 * for producers that can't expose a plain iterable (the factory scrape).
 */
export async function writeFileAtomic(
  filePath: string,
  produce: (write: (chunk: string) => Promise<void>) => Promise<void>,
): Promise<void> {
  // The main scrape writes these before snapshot.json, so on a cold volume the
  // data dir may not exist yet.
  await mkdir(path.dirname(filePath), { recursive: true })

  const tmpPath = tempPathFor(filePath)
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
 * Writes one JSON line per record, atomically.
 */
export function writeNdjson<T>(filePath: string, records: Iterable<T>): Promise<void> {
  return writeFileAtomic(filePath, async (write) => {
    for (const record of records) {
      await write(`${JSON.stringify(record)}\n`)
    }
  })
}
