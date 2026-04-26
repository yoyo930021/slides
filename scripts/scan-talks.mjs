#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'
import { buildRegistry } from './lib/build-registry.mjs'
import { parseTalk } from './lib/parse-talk.mjs'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')
const TALKS_GLOB = 'talks/*/slides.md'
const OUT = path.join(ROOT, 'landing/src/data/talks.generated.json')

const basePath = process.env.BASE_PATH ?? '/'

async function main() {
  const files = await fg(TALKS_GLOB, { cwd: ROOT, absolute: true })
  if (files.length === 0)
    console.warn('[scan-talks] no talks/*/slides.md found')

  const parsed = []
  for (const file of files) {
    const folderSlug = path.basename(path.dirname(file))
    try {
      const t = await parseTalk(file, { folderSlug })
      if (t.draft)
        console.log(`[skip] talks/${folderSlug} (draft)`)
      parsed.push(t)
    }
    catch (err) {
      console.error(err.message)
      process.exitCode = 1
    }
  }
  if (process.exitCode)
    process.exit(process.exitCode)

  const registry = buildRegistry(parsed, { basePath })
  await mkdir(path.dirname(OUT), { recursive: true })
  await writeFile(OUT, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
  console.log(`[scan-talks] wrote ${registry.length} talks → ${path.relative(ROOT, OUT)} (base=${basePath})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
