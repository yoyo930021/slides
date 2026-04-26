#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')
const slug = process.argv[2]

if (!slug) {
  console.error('Usage: pnpm dev <slug>')
  console.error('Example: pnpm dev 2026-04-sample')
  process.exit(1)
}

const slidesPath = path.join(ROOT, 'talks', slug, 'slides.md')
if (!existsSync(slidesPath)) {
  console.error(`No talks/${slug}/slides.md`)
  process.exit(1)
}

const child = spawn('pnpm', ['exec', 'slidev', slidesPath], { cwd: ROOT, stdio: 'inherit' })
child.on('exit', code => process.exit(code ?? 0))
process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
