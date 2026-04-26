#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')
const DIST = path.join(ROOT, 'dist')
const REGISTRY = path.join(ROOT, 'landing/src/data/talks.generated.json')

const basePath = process.env.BASE_PATH ?? '/'
const baseNorm = basePath === '/' ? '/' : `${basePath.replace(/\/+$/, '')}/`

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...opts.env } })
    p.on('exit', (code) => {
      if (code === 0)
        resolve()
      else
        reject(new Error(`${cmd} ${args.join(' ')} → exit ${code}`))
    })
  })
}

async function loadRegistry() {
  if (!existsSync(REGISTRY))
    throw new Error(`registry missing — run scan first: ${REGISTRY}`)
  return JSON.parse(await readFile(REGISTRY, 'utf8'))
}

async function buildLanding() {
  console.log('\n=== build:landing ===')
  await run('pnpm', ['exec', 'vite', 'build', 'landing'], { env: { BASE_PATH: baseNorm } })
}

async function buildTalk(t) {
  console.log(`\n=== build:talk ${t.slug} ===`)
  const slides = path.join(ROOT, 'talks', t.slug, 'slides.md')
  const out = path.join(DIST, 'talks', t.slug)
  await mkdir(out, { recursive: true })
  await run('pnpm', [
    'exec',
    'slidev',
    'build',
    slides,
    '--base',
    `${baseNorm}talks/${t.slug}/`,
    '--out',
    out,
  ])
}

async function exportTalkPdf(t) {
  if (!t.pdfUrl)
    return
  console.log(`\n=== export:pdf ${t.slug} ===`)
  const slides = path.join(ROOT, 'talks', t.slug, 'slides.md')
  const out = path.join(DIST, 'talks', t.slug, 'slides-export.pdf')
  await run('pnpm', ['exec', 'slidev', 'export', slides, '--output', out])
}

async function main() {
  console.log(`[build] BASE_PATH=${baseNorm}`)
  await run(process.execPath, ['scripts/scan-talks.mjs'], { env: { BASE_PATH: baseNorm } })
  const registry = await loadRegistry()

  // Build landing FIRST so Vite's emptyOutDir cleanup doesn't wipe talk subdirs.
  await buildLanding()

  for (const t of registry)
    await buildTalk(t)

  for (const t of registry)
    await exportTalkPdf(t)

  console.log(`\n[build] done — ${registry.length} talks`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
