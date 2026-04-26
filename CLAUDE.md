# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal Slidev presentations + landing page, deployed as a single static site to GitHub Pages. One repo, one `package.json`, one `dist/`. See `README.md` for develop instructions and the add-a-talk quickstart; this file captures the architectural picture that needs reading multiple files to understand.

## Architecture

The site is a fusion of two static builds glued together by a generated registry:

1. **Registry pipeline.** Each `talks/<slug>/slides.md` has YAML frontmatter under a `talk:` namespace. `scripts/scan-talks.mjs` globs every deck via `fast-glob`, runs `scripts/lib/parse-talk.mjs` (validation, Date-vs-string normalization), then `scripts/lib/build-registry.mjs` (dedupe by slug, filter drafts, sort by date desc, prefix URLs with `BASE_PATH`). Output: `landing/src/data/talks.generated.json` — gitignored. The landing's `TalkList.vue` imports this JSON directly. Adding a talk = drop a folder; no list edit anywhere.

2. **Build orchestration.** `scripts/build-all.mjs` executes in this order: `scan` → `vite build landing` → `slidev build` per talk → `slidev export` per talk. **Order matters**: `landing/vite.config.ts` has `emptyOutDir: true`, which would wipe `dist/talks/*` if landing built second. Don't reorder without flipping `emptyOutDir`.

3. **`BASE_PATH` propagation.** Env var `BASE_PATH` (default `/`, CI sets `/${{ repo.name }}/`) is read by scan-talks (baked into the JSON URLs), Vite (`base` config), and Slidev (`--base` arg). Same code, different bases — switch via env without retagging. Note: BASE_PATH is read at script startup, not per-request; `BASE_PATH=/x/ pnpm preview` is needed to mirror prod after building with that prefix, and the JSON registry is regenerated whenever scan runs.

4. **Single-package layout.** No pnpm workspace. All deps (Slidev, Vite, Vue, UnoCSS, Playwright) live in one root `package.json`. Every talk shares the same Slidev and theme versions; upgrading is a single bump.

5. **`@/` alias.** Maps to `landing/src/` in both `landing/vite.config.ts` (runtime) and `landing/tsconfig.json` `paths` (typecheck). Both must stay in sync.

## Required talk frontmatter

```yaml
title: <required>
talk:
  date: 2026-04-15 # required, ISO YYYY-MM-DD; quoted or unquoted both work
  event: <required>
  description: <required>
  location: <optional>
  tags: [t1, t2] # optional, default []
  draft: false # optional; true = skip from registry, build, and PDF
  exportPdf: true # optional; false = skip PDF export
  slug: <optional> # default: folder name
```

`parse-talk.mjs` aggregates all validation errors before throwing — a single bad frontmatter prints every missing field at once.

## Key commands (annotated; see README for the full table)

- `pnpm dev:landing` — runs scan once, then a chokidar directory watcher (chokidar v5 dropped glob string support, so `dev-landing.mjs` watches `talks/` and filters `slides.md` paths in user code) plus Vite dev. Editing any talk's frontmatter triggers re-scan → HMR.
- `pnpm dev <slug>` — slidev presenter on `talks/<slug>/slides.md`.
- `pnpm build` — full prod build into `dist/`. Slidev export needs Playwright Chromium binary; `playwright install chromium` is a one-time setup.
- `pnpm test` — vitest only on `scripts/lib/*.test.mjs` (lib unit tests). Components and orchestrators are not unit-tested by design — CI's full build is the integration test.
- `pnpm lint` — flat-config ESLint (`@antfu/eslint-config`). `talks/**` is ignored: Slidev's `---`-separated multi-H1 layout intrinsically violates `markdown/no-multiple-h1`. Don't try to lint talks.

## Deployment

`.github/workflows/deploy.yml` deploys on push to `main` and `workflow_dispatch`. Uses `actions/configure-pages@v5` + `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`. First-time setup: in `Settings → Pages → Build and deployment → Source`, choose "GitHub Actions".

## Known footguns

- **`playwright-chromium` is required, not just `playwright`.** Slidev's `importPlaywright()` resolves `playwright-chromium` specifically. Both are devDeps: `playwright` provides the CLI used by CI's `playwright install --with-deps chromium` step; `playwright-chromium` is the runtime that Slidev imports. Don't drop either.
- **gray-matter parses unquoted YAML dates as `Date` objects.** `parse-talk.mjs:normalizeDate` handles both `Date` (via `toISOString().slice(0, 10)`) and string. Don't refactor that branch out — you'd reintroduce the cryptic-error footgun for talk authors.
- **TypeScript 6 + vue-tsc 3 stack.** Works today but is bleeding-edge. Slidev itself ships pinned `typescript@5.9.3` internally — that copy is already in the lockfile, so a downgrade to `~5.9` is one `pnpm add` away if `vue-tsc --noEmit` ever blows up.
- **Vite 8 in our `package.json` vs Vite 7 inside Slidev.** Slidev pins its own internal Vite. Plugins or configs that target Vite 8 won't necessarily affect Slidev-driven builds.

## Spec & plan

- [Design spec](docs/superpowers/specs/2026-04-26-personal-slides-project-design.md)
- [Implementation plan](docs/superpowers/plans/2026-04-26-personal-slides-project.md)
