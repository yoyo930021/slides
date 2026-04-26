# Personal Slides Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap a single-package Slidev project hosting a Vite+Vue landing page plus multiple decks under `talks/<slug>/`, deployed to GitHub Pages by CI.

**Architecture:** One root `package.json` shares dependencies across landing and all decks. A `scripts/scan-talks.mjs` derives a `talks.generated.json` registry from each deck's frontmatter; landing renders from that JSON. `scripts/build-all.mjs` orchestrates `vite build` + per-deck `slidev build` + per-deck `slidev export`, all sharing a `BASE_PATH` env var so dev and GitHub Pages prod work the same way.

**Tech Stack:** pnpm · Node 22 · Vite 7 · Vue 3 · TypeScript · UnoCSS · @slidev/cli · zx · gray-matter · chokidar · Vitest · ESLint (`@antfu/eslint-config`) · GitHub Actions Pages

**Spec:** [`docs/superpowers/specs/2026-04-26-personal-slides-project-design.md`](../specs/2026-04-26-personal-slides-project-design.md)

---

## File Structure

| Path | Responsibility |
|---|---|
| `package.json` | Single dep manifest; pnpm scripts; engines |
| `pnpm-lock.yaml` | Lockfile |
| `tsconfig.json` | Root TS config; `references` to landing |
| `tsconfig.node.json` | TS config for scripts/ (Node target, ESM) |
| `eslint.config.js` | Flat-config ESLint, antfu preset |
| `vitest.config.ts` | Vitest root config (scripts tests only) |
| `.gitignore` | `dist/`, `node_modules/`, `*.generated.*`, `.vite/` |
| `.editorconfig` | LF, 2-space, utf-8 |
| `README.md` | Quickstart + add-a-talk instructions |
| `landing/index.html` | Vite entry HTML |
| `landing/vite.config.ts` | Vite config; reads `BASE_PATH`; UnoCSS plugin |
| `landing/tsconfig.json` | Extends root; DOM lib |
| `landing/uno.config.ts` | UnoCSS preset + tokens |
| `landing/src/main.ts` | App bootstrap |
| `landing/src/App.vue` | Layout shell, sections wired |
| `landing/src/components/Hero.vue` | Hero section |
| `landing/src/components/About.vue` | Bio section |
| `landing/src/components/TalkList.vue` | Talk cards from JSON |
| `landing/src/components/Socials.vue` | Footer socials |
| `landing/src/data/profile.ts` | Hand-edited personal info |
| `landing/src/data/talks.generated.json` | Auto-generated; gitignored |
| `landing/src/styles/global.css` | Resets + CSS variables for light/dark |
| `landing/public/.gitkeep` | Placeholder for static assets |
| `talks/2026-04-sample/slides.md` | First example deck (validates pipeline) |
| `scripts/lib/parse-talk.mjs` | Pure: parse + validate single slides.md frontmatter |
| `scripts/lib/build-registry.mjs` | Pure: array of parsed talks → registry JSON entries |
| `scripts/lib/parse-talk.test.mjs` | Vitest |
| `scripts/lib/build-registry.test.mjs` | Vitest |
| `scripts/lib/__fixtures__/` | Frontmatter fixtures for tests |
| `scripts/scan-talks.mjs` | I/O wrapper: glob + parse + write JSON |
| `scripts/dev-landing.mjs` | scan + chokidar watch + spawn vite dev |
| `scripts/dev-talk.mjs` | Resolve `<slug>` argv → spawn `slidev` |
| `scripts/build-all.mjs` | Full prod build orchestration |
| `.github/workflows/deploy.yml` | CI to Pages |

---

## Task 1: Initialize repo bones

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `README.md`

- [ ] **Step 1: Create `.gitignore`**

```gitignore
node_modules
dist
.vite
.DS_Store
*.log
*.generated.json
landing/.vite
```

- [ ] **Step 2: Create `.editorconfig`**

```ini
root = true

[*]
end_of_line = lf
charset = utf-8
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 3: Create root `package.json`**

```json
{
  "name": "slides",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22",
    "pnpm": ">=9"
  },
  "scripts": {
    "dev": "node scripts/dev-talk.mjs",
    "dev:landing": "node scripts/dev-landing.mjs",
    "build": "node scripts/build-all.mjs",
    "preview": "vite preview --root landing --outDir ../dist",
    "scan": "node scripts/scan-talks.mjs",
    "typecheck": "vue-tsc --noEmit -p tsconfig.node.json && vue-tsc --noEmit -p landing/tsconfig.json",
    "lint": "eslint .",
    "test": "vitest run"
  }
}
```

- [ ] **Step 4: Create root `tsconfig.json`**

```json
{
  "files": [],
  "references": [
    { "path": "./landing/tsconfig.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 5: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["scripts/**/*", "vite.config.*", "vitest.config.*", "landing/vite.config.ts", "landing/uno.config.ts"]
}
```

- [ ] **Step 6: Create `README.md`**

```markdown
# slides

Personal Slidev decks + landing page, deployed to GitHub Pages.

## Quickstart

\`\`\`sh
pnpm install
pnpm dev:landing                    # work on landing page
pnpm dev <slug>                     # work on talks/<slug>/slides.md
pnpm build                          # full production build into dist/
pnpm preview                        # serve dist/ locally
\`\`\`

## Adding a talk

1. Create `talks/<YYYY-MM-slug>/slides.md`.
2. Fill frontmatter (see [spec](docs/superpowers/specs/2026-04-26-personal-slides-project-design.md#frontmatter-慣例)).
3. `pnpm dev <YYYY-MM-slug>` to author.
4. Commit. CI deploys on push to `main`.
```

- [ ] **Step 7: Run `pnpm install`**

Run: `pnpm install`
Expected: creates `node_modules/` and empty `pnpm-lock.yaml`. No errors.

- [ ] **Step 8: Commit**

```sh
git add .gitignore .editorconfig package.json tsconfig.json tsconfig.node.json README.md pnpm-lock.yaml
git commit -m "chore: scaffold root package and TS configs"
```

---

## Task 2: Install runtime + tooling deps

**Files:**
- Modify: `package.json` (devDependencies)

- [ ] **Step 1: Install Slidev + Vite + Vue stack**

Run:
```sh
pnpm add -D @slidev/cli @slidev/theme-default playwright \
  vite @vitejs/plugin-vue vue typescript vue-tsc \
  unocss @unocss/preset-uno @unocss/preset-attributify @unocss/preset-icons \
  gray-matter chokidar zx fast-glob \
  vitest @vitest/ui \
  eslint @antfu/eslint-config \
  @types/node
```

`playwright` is required by `slidev export` for PDF generation. The browser binary is downloaded separately in the next step.

- [ ] **Step 1.5: Install Chromium browser binary**

Run: `pnpm exec playwright install chromium`
Expected: downloads Chromium to Playwright cache (`~/.cache/ms-playwright/`). Subsequent installs are no-ops.

Expected: `package.json` has all deps under `devDependencies`. Lockfile updated.

- [ ] **Step 2: Run `pnpm install --frozen-lockfile` to verify lockfile**

Run: `pnpm install --frozen-lockfile`
Expected: "Lockfile is up to date" — exits 0.

- [ ] **Step 3: Commit**

```sh
git add package.json pnpm-lock.yaml
git commit -m "chore: add Slidev, Vite, UnoCSS, and tooling deps"
```

---

## Task 3: ESLint flat config + Vitest config

**Files:**
- Create: `eslint.config.js`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create `eslint.config.js`**

```js
import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  formatters: true,
  ignores: ['dist', 'node_modules', '**/*.generated.*', 'landing/src/data/talks.generated.json'],
})
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['scripts/**/*.test.mjs'],
    environment: 'node',
  },
})
```

- [ ] **Step 3: Run `pnpm lint` to verify ESLint loads**

Run: `pnpm lint`
Expected: exits 0 (no source files yet to lint, or only README — passes).

- [ ] **Step 4: Run `pnpm test`**

Run: `pnpm test`
Expected: "No test files found" — Vitest exits 0 with that message.

- [ ] **Step 5: Commit**

```sh
git add eslint.config.js vitest.config.ts
git commit -m "chore: configure ESLint flat config and Vitest"
```

---

## Task 4: parse-talk lib (TDD)

**Files:**
- Create: `scripts/lib/__fixtures__/valid.md`
- Create: `scripts/lib/__fixtures__/missing-title.md`
- Create: `scripts/lib/__fixtures__/missing-talk-date.md`
- Create: `scripts/lib/__fixtures__/draft.md`
- Create: `scripts/lib/__fixtures__/slug-override.md`
- Create: `scripts/lib/__fixtures__/invalid-date.md`
- Create: `scripts/lib/parse-talk.test.mjs`
- Create: `scripts/lib/parse-talk.mjs`

- [ ] **Step 1: Create fixture `valid.md`**

```markdown
---
theme: default
title: Sample Talk
info: |
  Example talk for tests.
talk:
  date: 2026-04-15
  event: Test Meetup
  location: Taipei
  description: A sample talk used in tests.
  tags: [sample, test]
  draft: false
  exportPdf: true
---

# Slide 1
```

- [ ] **Step 2: Create fixture `missing-title.md`**

```markdown
---
theme: default
talk:
  date: 2026-04-15
  event: Test Meetup
  description: Missing title.
---

# Slide 1
```

- [ ] **Step 3: Create fixture `missing-talk-date.md`**

```markdown
---
title: No Date
talk:
  event: Test Meetup
  description: No date set.
---

# Slide 1
```

- [ ] **Step 4: Create fixture `draft.md`**

```markdown
---
title: Draft Talk
talk:
  date: 2026-05-01
  event: Future Meetup
  description: Should be skipped.
  draft: true
---

# Slide 1
```

- [ ] **Step 5: Create fixture `slug-override.md`**

```markdown
---
title: Custom Slug
talk:
  date: 2026-04-15
  event: Test Meetup
  description: Has explicit slug.
  slug: custom-slug
---

# Slide 1
```

- [ ] **Step 6: Create fixture `invalid-date.md`**

```markdown
---
title: Bad Date
talk:
  date: not-a-date
  event: Test Meetup
  description: Date is malformed.
---

# Slide 1
```

- [ ] **Step 7: Write the failing test file `scripts/lib/parse-talk.test.mjs`**

```js
import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseTalk } from './parse-talk.mjs'

const fixDir = fileURLToPath(new URL('./__fixtures__/', import.meta.url))
const fix = name => path.join(fixDir, name)

describe('parseTalk', () => {
  it('parses a valid talk and infers slug from folder name', async () => {
    const result = await parseTalk(fix('valid.md'), { folderSlug: '2026-04-sample' })
    expect(result).toMatchObject({
      slug: '2026-04-sample',
      title: 'Sample Talk',
      date: '2026-04-15',
      event: 'Test Meetup',
      location: 'Taipei',
      description: 'A sample talk used in tests.',
      tags: ['sample', 'test'],
      draft: false,
      exportPdf: true,
    })
  })

  it('uses talk.slug override when provided', async () => {
    const result = await parseTalk(fix('slug-override.md'), { folderSlug: 'ignored' })
    expect(result.slug).toBe('custom-slug')
  })

  it('marks draft talks via draft flag', async () => {
    const result = await parseTalk(fix('draft.md'), { folderSlug: 'draft' })
    expect(result.draft).toBe(true)
  })

  it('defaults exportPdf to true and tags to []', async () => {
    const result = await parseTalk(fix('slug-override.md'), { folderSlug: 'x' })
    expect(result.exportPdf).toBe(true)
    expect(result.tags).toEqual([])
  })

  it('throws when title is missing', async () => {
    await expect(parseTalk(fix('missing-title.md'), { folderSlug: 'x' }))
      .rejects.toThrow(/title/)
  })

  it('throws when talk.date is missing', async () => {
    await expect(parseTalk(fix('missing-talk-date.md'), { folderSlug: 'x' }))
      .rejects.toThrow(/talk\.date/)
  })

  it('throws when talk.date is not a valid ISO date', async () => {
    await expect(parseTalk(fix('invalid-date.md'), { folderSlug: 'x' }))
      .rejects.toThrow(/date/i)
  })
})
```

- [ ] **Step 8: Run tests to confirm failure**

Run: `pnpm test`
Expected: FAIL with `Cannot find module './parse-talk.mjs'` or similar.

- [ ] **Step 9: Implement `scripts/lib/parse-talk.mjs`**

```js
import { readFile } from 'node:fs/promises'
import matter from 'gray-matter'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const REQUIRED_TOP = ['title']
const REQUIRED_TALK = ['date', 'event', 'description']

export async function parseTalk(filePath, { folderSlug }) {
  const raw = await readFile(filePath, 'utf8')
  const { data } = matter(raw)
  const errors = []

  for (const key of REQUIRED_TOP) {
    if (!data[key])
      errors.push(`missing required field: ${key}`)
  }

  const talk = data.talk ?? {}
  for (const key of REQUIRED_TALK) {
    if (!talk[key])
      errors.push(`missing required field: talk.${key}`)
  }

  if (talk.date && !ISO_DATE_RE.test(String(talk.date))) {
    errors.push(`talk.date must be ISO date (YYYY-MM-DD), got: ${talk.date}`)
  }
  else if (talk.date && Number.isNaN(Date.parse(talk.date))) {
    errors.push(`talk.date is not a valid date: ${talk.date}`)
  }

  if (errors.length) {
    const msg = errors.map(e => `  - ${e}`).join('\n')
    throw new Error(`Invalid talk frontmatter in ${filePath}:\n${msg}`)
  }

  return {
    slug: talk.slug ?? folderSlug,
    title: data.title,
    date: talk.date,
    event: talk.event,
    location: talk.location ?? null,
    description: talk.description,
    tags: Array.isArray(talk.tags) ? talk.tags : [],
    draft: talk.draft === true,
    exportPdf: talk.exportPdf !== false,
  }
}
```

- [ ] **Step 10: Run tests to confirm pass**

Run: `pnpm test`
Expected: PASS, 7 tests green.

- [ ] **Step 11: Commit**

```sh
git add scripts/lib/parse-talk.mjs scripts/lib/parse-talk.test.mjs scripts/lib/__fixtures__
git commit -m "feat(scripts): parse-talk library with TDD"
```

---

## Task 5: build-registry lib (TDD)

**Files:**
- Create: `scripts/lib/build-registry.test.mjs`
- Create: `scripts/lib/build-registry.mjs`

- [ ] **Step 1: Write failing test `scripts/lib/build-registry.test.mjs`**

```js
import { describe, expect, it } from 'vitest'
import { buildRegistry } from './build-registry.mjs'

const sample = (over = {}) => ({
  slug: 'a',
  title: 'A',
  date: '2026-01-01',
  event: 'E',
  location: null,
  description: 'd',
  tags: [],
  draft: false,
  exportPdf: true,
  ...over,
})

describe('buildRegistry', () => {
  it('filters drafts out', () => {
    const out = buildRegistry([sample({ slug: 'a' }), sample({ slug: 'b', draft: true })], { basePath: '/' })
    expect(out.map(t => t.slug)).toEqual(['a'])
  })

  it('sorts by date descending', () => {
    const out = buildRegistry([
      sample({ slug: 'old', date: '2025-01-01' }),
      sample({ slug: 'new', date: '2026-06-01' }),
      sample({ slug: 'mid', date: '2026-01-01' }),
    ], { basePath: '/' })
    expect(out.map(t => t.slug)).toEqual(['new', 'mid', 'old'])
  })

  it('throws on duplicate slugs', () => {
    expect(() =>
      buildRegistry([sample({ slug: 'dup' }), sample({ slug: 'dup' })], { basePath: '/' }),
    ).toThrow(/duplicate slug.*dup/i)
  })

  it('builds url with base path', () => {
    const out = buildRegistry([sample({ slug: 'foo' })], { basePath: '/slides/' })
    expect(out[0].url).toBe('/slides/talks/foo/')
    expect(out[0].pdfUrl).toBe('/slides/talks/foo/slides-export.pdf')
  })

  it('sets pdfUrl to null when exportPdf is false', () => {
    const out = buildRegistry([sample({ slug: 'foo', exportPdf: false })], { basePath: '/' })
    expect(out[0].pdfUrl).toBeNull()
  })

  it('normalizes basePath without trailing slash', () => {
    const out = buildRegistry([sample({ slug: 'foo' })], { basePath: '/slides' })
    expect(out[0].url).toBe('/slides/talks/foo/')
  })
})
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `pnpm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `scripts/lib/build-registry.mjs`**

```js
function normalizeBase(basePath) {
  if (!basePath || basePath === '/')
    return '/'
  const stripped = basePath.replace(/\/+$/, '')
  return `${stripped}/`
}

export function buildRegistry(parsedTalks, { basePath }) {
  const base = normalizeBase(basePath)
  const seen = new Map()
  for (const t of parsedTalks) {
    if (seen.has(t.slug))
      throw new Error(`duplicate slug "${t.slug}" between ${seen.get(t.slug)} and ${t.title}`)
    seen.set(t.slug, t.title)
  }

  const visible = parsedTalks.filter(t => !t.draft)
  const sorted = [...visible].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return sorted.map(t => ({
    slug: t.slug,
    title: t.title,
    date: t.date,
    event: t.event,
    location: t.location,
    description: t.description,
    tags: t.tags,
    url: `${base}talks/${t.slug}/`,
    pdfUrl: t.exportPdf ? `${base}talks/${t.slug}/slides-export.pdf` : null,
  }))
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `pnpm test`
Expected: PASS, 13 tests total green.

- [ ] **Step 5: Commit**

```sh
git add scripts/lib/build-registry.mjs scripts/lib/build-registry.test.mjs
git commit -m "feat(scripts): build-registry library with TDD"
```

---

## Task 6: scan-talks orchestrator + sample talk

**Files:**
- Create: `scripts/scan-talks.mjs`
- Create: `talks/2026-04-sample/slides.md`
- Create: `landing/src/data/.gitkeep`

- [ ] **Step 1: Create `landing/src/data/.gitkeep`** (empty file)

```sh
mkdir -p landing/src/data && touch landing/src/data/.gitkeep
```

- [ ] **Step 2: Create `talks/2026-04-sample/slides.md`**

```markdown
---
theme: default
title: 範例演講
info: |
  Built to validate the slides project pipeline.
talk:
  date: 2026-04-26
  event: Local Dev Validation
  location: Taipei
  description: 用來驗證 build pipeline 的範例演講。
  tags: [sample, infra]
  draft: false
  exportPdf: true
---

# 範例演講

驗證 build pipeline 用。

---

# Hello

Slide 2.
```

- [ ] **Step 3: Create `scripts/scan-talks.mjs`**

```js
#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'
import { parseTalk } from './lib/parse-talk.mjs'
import { buildRegistry } from './lib/build-registry.mjs'

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
```

- [ ] **Step 4: Run scan once**

Run: `pnpm scan`
Expected: prints `[scan-talks] wrote 1 talks → landing/src/data/talks.generated.json (base=/)`. File exists with one entry whose `url` is `/talks/2026-04-sample/`.

- [ ] **Step 5: Verify output content**

Run: `cat landing/src/data/talks.generated.json`
Expected: a JSON array with one entry containing `slug: "2026-04-sample"`, `pdfUrl: "/talks/2026-04-sample/slides-export.pdf"`.

- [ ] **Step 6: Verify base path env**

Run: `BASE_PATH=/slides/ pnpm scan && cat landing/src/data/talks.generated.json | grep url`
Expected: `"url": "/slides/talks/2026-04-sample/"`.

- [ ] **Step 7: Reset to dev base**

Run: `pnpm scan`
Expected: file regenerated with `/talks/...` URL.

- [ ] **Step 8: Commit**

```sh
git add scripts/scan-talks.mjs talks/2026-04-sample/slides.md landing/src/data/.gitkeep
git commit -m "feat(scripts): scan-talks orchestrator + sample talk"
```

---

## Task 7: Landing — Vite + Vue + UnoCSS skeleton

**Files:**
- Create: `landing/index.html`
- Create: `landing/vite.config.ts`
- Create: `landing/tsconfig.json`
- Create: `landing/uno.config.ts`
- Create: `landing/src/main.ts`
- Create: `landing/src/App.vue`
- Create: `landing/src/styles/global.css`
- Create: `landing/public/.gitkeep`

- [ ] **Step 1: Create `landing/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src/**/*", "src/**/*.vue", "*.config.ts"]
}
```

- [ ] **Step 2: Create `landing/uno.config.ts`**

```ts
import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({ scale: 1.2 }),
  ],
  theme: {
    fontFamily: {
      sans: '"Inter", "Noto Sans TC", system-ui, sans-serif',
    },
  },
})
```

- [ ] **Step 3: Create `landing/vite.config.ts`**

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import unocss from 'unocss/vite'

const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [vue(), unocss()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
```

- [ ] **Step 4: Create `landing/index.html`**

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+TC:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
    <title>slides — yoyo930021</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `landing/src/styles/global.css`**

```css
:root {
  --bg: #fff;
  --fg: #18181b;
  --muted: #71717a;
  --accent: #6366f1;
  --card: #f4f4f5;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #09090b;
    --fg: #fafafa;
    --muted: #a1a1aa;
    --accent: #818cf8;
    --card: #18181b;
  }
}

html, body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: "Inter", "Noto Sans TC", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
```

- [ ] **Step 6: Create `landing/src/main.ts`**

```ts
import { createApp } from 'vue'
import 'virtual:uno.css'
import './styles/global.css'
import App from './App.vue'

createApp(App).mount('#app')
```

- [ ] **Step 7: Create temporary `landing/src/App.vue` placeholder**

```vue
<script setup lang="ts">
</script>

<template>
  <main class="mx-auto max-w-3xl px-6 py-16">
    <h1 class="text-4xl font-bold">slides</h1>
    <p class="mt-2 text-[var(--muted)]">coming soon</p>
  </main>
</template>
```

- [ ] **Step 8: `touch landing/public/.gitkeep`**

- [ ] **Step 9: Verify dev server starts**

Run: `pnpm exec vite landing` (one-shot test, uses the local vite). Open the printed URL.
Expected: page shows "slides" + "coming soon", no console errors.

Stop the server (Ctrl-C).

- [ ] **Step 10: Verify typecheck**

Run: `pnpm typecheck`
Expected: exits 0.

- [ ] **Step 11: Commit**

```sh
git add landing
git commit -m "feat(landing): scaffold Vite + Vue + UnoCSS shell"
```

---

## Task 8: Landing — profile data + components

**Files:**
- Create: `landing/src/data/profile.ts`
- Create: `landing/src/components/Hero.vue`
- Create: `landing/src/components/About.vue`
- Create: `landing/src/components/TalkList.vue`
- Create: `landing/src/components/Socials.vue`
- Modify: `landing/src/App.vue`

- [ ] **Step 1: Create `landing/src/data/profile.ts`**

```ts
export interface Social {
  type: 'github' | 'email' | 'twitter' | 'other'
  label: string
  url: string
}

export interface Profile {
  name: string
  tagline: string
  bio: string
  avatar: string
  socials: Social[]
}

export const profile: Profile = {
  name: 'yoyo930021',
  tagline: '個人演講與分享集中地',
  bio: '在這裡蒐集我做過的技術演講。歡迎自取講義；簡報使用 Slidev 製作。',
  avatar: '',
  socials: [
    { type: 'github', label: 'GitHub', url: 'https://github.com/yoyo930021' },
    { type: 'email', label: 'Email', url: 'mailto:space@yokikiyo.com' },
  ],
}
```

- [ ] **Step 2: Create `landing/src/components/Hero.vue`**

```vue
<script setup lang="ts">
import { profile } from '@/data/profile'
</script>

<template>
  <section class="px-6 py-20 md:py-28">
    <div class="mx-auto max-w-3xl">
      <h1 class="text-5xl font-bold tracking-tight md:text-6xl">
        {{ profile.name }}
      </h1>
      <p class="mt-4 text-xl text-[var(--muted)] md:text-2xl">
        {{ profile.tagline }}
      </p>
      <div class="mt-8 flex gap-3">
        <a href="#talks" class="rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
          看演講列表
        </a>
        <a
          v-for="s in profile.socials.filter(x => x.type === 'github')"
          :key="s.url"
          :href="s.url"
          class="rounded border border-[var(--muted)] px-5 py-2.5 text-sm font-medium hover:border-[var(--fg)]"
        >{{ s.label }}</a>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Create `landing/src/components/TalkList.vue`**

```vue
<script setup lang="ts">
import talks from '@/data/talks.generated.json'

interface Talk {
  slug: string
  title: string
  date: string
  event: string
  location: string | null
  description: string
  tags: string[]
  url: string
  pdfUrl: string | null
}

const list = talks as Talk[]

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <section id="talks" class="px-6 py-16">
    <div class="mx-auto max-w-3xl">
      <h2 class="text-2xl font-bold md:text-3xl">
        演講
      </h2>
      <p v-if="list.length === 0" class="mt-6 text-[var(--muted)]">
        尚無演講資料。
      </p>
      <ul v-else class="mt-8 grid gap-4">
        <li
          v-for="t in list"
          :key="t.slug"
          class="group rounded-lg bg-[var(--card)] p-5 transition hover:translate-y-[-2px]"
        >
          <div class="flex items-start justify-between gap-4">
            <a :href="t.url" class="block flex-1">
              <h3 class="text-lg font-semibold group-hover:text-[var(--accent)]">
                {{ t.title }}
              </h3>
              <p class="mt-1 text-sm text-[var(--muted)]">
                {{ formatDate(t.date) }} · {{ t.event }}<span v-if="t.location"> · {{ t.location }}</span>
              </p>
              <p class="mt-3 text-sm">
                {{ t.description }}
              </p>
              <div v-if="t.tags.length" class="mt-3 flex flex-wrap gap-1.5">
                <span
                  v-for="tag in t.tags"
                  :key="tag"
                  class="rounded bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--muted)]"
                >#{{ tag }}</span>
              </div>
            </a>
            <a
              v-if="t.pdfUrl"
              :href="t.pdfUrl"
              class="shrink-0 rounded border border-[var(--muted)] px-3 py-1 text-xs hover:border-[var(--fg)]"
            >PDF</a>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
```

- [ ] **Step 4: Create `landing/src/components/About.vue`**

```vue
<script setup lang="ts">
import { profile } from '@/data/profile'
</script>

<template>
  <section class="px-6 py-16">
    <div class="mx-auto max-w-3xl">
      <h2 class="text-2xl font-bold md:text-3xl">
        關於
      </h2>
      <p class="mt-6 leading-relaxed">
        {{ profile.bio }}
      </p>
    </div>
  </section>
</template>
```

- [ ] **Step 5: Create `landing/src/components/Socials.vue`**

```vue
<script setup lang="ts">
import { profile } from '@/data/profile'

const iconClass: Record<string, string> = {
  github: 'i-mdi-github',
  email: 'i-mdi-email-outline',
  twitter: 'i-mdi-twitter',
  other: 'i-mdi-link-variant',
}
</script>

<template>
  <footer class="px-6 py-12 text-sm text-[var(--muted)]">
    <div class="mx-auto flex max-w-3xl flex-col items-center gap-4">
      <ul class="flex gap-4">
        <li v-for="s in profile.socials" :key="s.url">
          <a :href="s.url" :title="s.label" class="inline-flex items-center gap-1.5 hover:text-[var(--fg)]">
            <span :class="iconClass[s.type] ?? iconClass.other" />
            <span>{{ s.label }}</span>
          </a>
        </li>
      </ul>
      <p>© {{ new Date().getFullYear() }} {{ profile.name }}</p>
    </div>
  </footer>
</template>
```

- [ ] **Step 6: Replace `landing/src/App.vue`**

```vue
<script setup lang="ts">
import Hero from '@/components/Hero.vue'
import TalkList from '@/components/TalkList.vue'
import About from '@/components/About.vue'
import Socials from '@/components/Socials.vue'
</script>

<template>
  <Hero />
  <TalkList />
  <About />
  <Socials />
</template>
```

- [ ] **Step 7: Install `@iconify-json/mdi` for the icon set**

Run: `pnpm add -D @iconify-json/mdi`
Expected: dep added.

- [ ] **Step 8: Run scan + dev server smoke test**

Run: `pnpm scan && pnpm exec vite landing`. Open the printed URL.
Expected: hero, the sample talk card with date/event/description/tags + PDF button, about section, footer with GitHub/Email links and icons. No console errors.

Stop the server.

- [ ] **Step 9: Run typecheck**

Run: `pnpm typecheck`
Expected: exits 0.

- [ ] **Step 10: Commit**

```sh
git add landing package.json pnpm-lock.yaml
git commit -m "feat(landing): hero, talk list, about, socials"
```

---

## Task 9: dev:landing watcher

**Files:**
- Create: `scripts/dev-landing.mjs`

- [ ] **Step 1: Create `scripts/dev-landing.mjs`**

```js
#!/usr/bin/env node
import { spawn } from 'node:child_process'
import path from 'node:path'
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
```

- [ ] **Step 2: Smoke test**

Run: `pnpm dev:landing`. Open the printed URL.
Expected: scan logs once, then Vite dev server starts and renders page.

In another terminal, edit `talks/2026-04-sample/slides.md` `talk.description` to "更新後的描述".
Expected: dev-landing log shows another `[scan-talks] wrote ...`. Browser HMR updates the card without full reload.

Revert change. Stop server.

- [ ] **Step 3: Commit**

```sh
git add scripts/dev-landing.mjs
git commit -m "feat(scripts): dev-landing with frontmatter watcher"
```

---

## Task 10: dev <slug> helper

**Files:**
- Create: `scripts/dev-talk.mjs`

- [ ] **Step 1: Create `scripts/dev-talk.mjs`**

```js
#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
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
```

- [ ] **Step 2: Smoke test**

Run: `pnpm dev 2026-04-sample`. Open the printed Slidev URL.
Expected: Slidev presenter renders the sample deck. Stop with Ctrl-C.

- [ ] **Step 3: Verify error path**

Run: `pnpm dev nonexistent`
Expected: "No talks/nonexistent/slides.md", exits 1.

- [ ] **Step 4: Commit**

```sh
git add scripts/dev-talk.mjs
git commit -m "feat(scripts): dev <slug> helper"
```

---

## Task 11: build-all orchestrator

**Files:**
- Create: `scripts/build-all.mjs`

- [ ] **Step 1: Create `scripts/build-all.mjs`**

```js
#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
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
    'exec', 'slidev', 'build', slides,
    '--base', `${baseNorm}talks/${t.slug}/`,
    '--out', out,
  ])
}

async function exportTalkPdf(t) {
  if (!t.pdfUrl)
    return
  console.log(`\n=== export:pdf ${t.slug} ===`)
  const slides = path.join(ROOT, 'talks', t.slug, 'slides.md')
  const out = path.join(DIST, 'talks', t.slug, 'slides-export.pdf')
  await run('pnpm', [
    'exec', 'slidev', 'export', slides,
    '--output', out,
  ])
}

async function main() {
  console.log(`[build] BASE_PATH=${baseNorm}`)
  await run(process.execPath, ['scripts/scan-talks.mjs'], { env: { BASE_PATH: baseNorm } })
  const registry = await loadRegistry()

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
```

- [ ] **Step 2: Build smoke test (dev base)**

Run: `pnpm build`
Expected: scan → vite build → slidev build for sample → slidev export PDF. Final log "[build] done — 1 talks". Files exist:
- `dist/index.html`
- `dist/talks/2026-04-sample/index.html`
- `dist/talks/2026-04-sample/slides-export.pdf`

Run: `ls dist dist/talks/2026-04-sample`
Expected: those three files visible.

- [ ] **Step 3: Preview smoke test (dev base)**

Run: `pnpm preview`
Expected: server starts (typically `http://localhost:4173/`). Open URL. Landing renders, sample talk card visible, link goes to `/talks/2026-04-sample/` and shows slides; PDF link downloads PDF.

Stop the server (Ctrl-C).

- [ ] **Step 4: Build smoke test (prod base)**

Run: `BASE_PATH=/slides/ pnpm build`
Expected: same outputs but assets prefixed with `/slides/`.

Run: `grep -o '/slides/[^"]*' dist/index.html | head -5`
Expected: at least one match showing `/slides/assets/...` or similar.

- [ ] **Step 5: Preview smoke test (prod base)**

Run: `BASE_PATH=/slides/ pnpm preview`
Expected: server starts. Open `http://localhost:4173/slides/` (note the prefix). Landing renders the same way; root `/` returns 404 (correct — that's how GH Pages would behave too).

Stop the server. Run `pnpm scan` once to reset the registry to dev base for subsequent tasks.

- [ ] **Step 6: Commit**

```sh
git add scripts/build-all.mjs
git commit -m "feat(scripts): build-all orchestrator with PDF export"
```

---

## Task 12: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Install Playwright Chromium with OS deps
        run: pnpm exec playwright install --with-deps chromium

      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test

      - name: Build site
        env:
          BASE_PATH: /${{ github.event.repository.name }}/
        run: pnpm build

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Lint workflow file**

Run: `pnpm dlx @action-validator/cli .github/workflows/deploy.yml` (best-effort; if not available skip)
Expected: no fatal schema errors.

- [ ] **Step 3: Commit**

```sh
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to GitHub Pages on push to main"
```

---

## Task 13: README docs pass

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` with full docs**

```markdown
# slides

Personal talks hosted on GitHub Pages. Each talk is a [Slidev](https://sli.dev/) deck under `talks/<slug>/`; the landing page is a Vite + Vue 3 + UnoCSS app that lists every talk via auto-discovered frontmatter.

## Develop

\`\`\`sh
pnpm install
pnpm exec playwright install chromium   # one-time, for PDF export

pnpm dev:landing                 # landing page; HMR on talks frontmatter changes
pnpm dev <slug>                  # author a talk in Slidev presenter mode
pnpm build                       # full production build into dist/
pnpm preview                     # serve dist/ locally (mirrors GitHub Pages)
pnpm typecheck                   # vue-tsc
pnpm lint                        # eslint
pnpm test                        # vitest (scan-talks lib)
\`\`\`

## Add a talk

1. `mkdir talks/<YYYY-MM-slug>` and create `slides.md`:

\`\`\`markdown
---
theme: default
title: <演講標題>
info: |
  <Slidev info>
talk:
  date: 2026-04-15
  event: <活動名稱>
  location: <選填>
  description: <簡短描述；landing 卡片用>
  tags: [t1, t2]            # 選填
  draft: false               # 選填，true 跳過
  exportPdf: true            # 選填，false 不出 PDF
  slug: <選填，預設取資料夾名>
---

# 第一張

內容…
\`\`\`

2. `pnpm dev <slug>` to author.
3. Commit. Push to `main` triggers CI to deploy.

Required frontmatter fields: `title`, `talk.date` (ISO `YYYY-MM-DD`), `talk.event`, `talk.description`. Build fails if any are missing.

## Personal info

Edit `landing/src/data/profile.ts` (name, tagline, bio, avatar, social links).

## How CI builds

`.github/workflows/deploy.yml` runs on push to `main`:
typecheck → lint → test → `BASE_PATH=/<repo>/ pnpm build` → upload `dist/` → deploy to Pages.

## Spec & plan

- [Design spec](docs/superpowers/specs/2026-04-26-personal-slides-project-design.md)
- [Implementation plan](docs/superpowers/plans/2026-04-26-personal-slides-project.md)
```

- [ ] **Step 2: Commit**

```sh
git add README.md
git commit -m "docs: full README with develop and add-a-talk guides"
```

---

## Task 14: Final validation pass

- [ ] **Step 1: Clean state check**

Run: `git status`
Expected: working tree clean (or only `dist/` and `*.generated.json` ignored). If anything else untracked, decide if it should be committed or ignored.

- [ ] **Step 2: Full local pipeline rehearsal**

Run:
```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
BASE_PATH=/slides/ pnpm build
pnpm preview
```

Expected: every step exits 0. Browser at preview URL shows landing page with sample talk, PDF download works, talk page opens. Stop preview.

- [ ] **Step 3: Reset registry to dev base**

Run: `pnpm scan`

- [ ] **Step 4: Ensure GitHub remote exists**

Run: `git remote -v`
Expected: at least one `origin` line.

If empty: create a GitHub repo and add it. Either via `gh`:
```sh
gh repo create slides --public --source=. --remote=origin
```
or manually create on github.com and `git remote add origin git@github.com:<user>/slides.git`.

- [ ] **Step 5: Push and watch CI**

```sh
git push -u origin main
```

In the repo's `Settings → Pages → Build and deployment → Source`, set "GitHub Actions" if not already (one-time, only needed for first deploy).

Run: `gh run watch` (or open the Actions tab).
Expected: workflow green; deploy step prints the page URL. Visit URL, verify landing renders and the sample talk loads at `/<repo>/talks/2026-04-sample/`.

- [ ] **Step 6: Mark plan complete**

If all above pass, the bootstrap is done. Subsequent talks are added by repeating the "Add a talk" flow from the README.
