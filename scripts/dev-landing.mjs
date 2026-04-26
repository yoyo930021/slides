#!/usr/bin/env node
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import chokidar from 'chokidar'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')

function runScan() {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, ['scripts/scan-talks.mjs'], { cwd: ROOT, stdio: 'inherit' })
    p.on('exit', code => resolve(code ?? 0))
  })
}

const initial = await runScan()
if (initial !== 0) {
  console.error('[dev-landing] initial scan failed; aborting')
  process.exit(initial)
}

const watcher = chokidar.watch('talks/*/slides.md', {
  cwd: ROOT,
  ignoreInitial: true,
})

let pending = false
let running = false
async function debouncedScan() {
  if (running) {
    pending = true
    return
  }
  running = true
  await runScan()
  running = false
  if (pending) {
    pending = false
    debouncedScan()
  }
}

watcher.on('add', debouncedScan).on('change', debouncedScan).on('unlink', debouncedScan)

const vite = spawn('pnpm', ['exec', 'vite', 'landing'], { cwd: ROOT, stdio: 'inherit' })
vite.on('exit', (code) => {
  watcher.close()
  process.exit(code ?? 0)
})

process.on('SIGINT', () => vite.kill('SIGINT'))
process.on('SIGTERM', () => vite.kill('SIGTERM'))
