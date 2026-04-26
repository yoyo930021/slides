# slides

Personal talks hosted on GitHub Pages. Each talk is a [Slidev](https://sli.dev/) deck under `talks/<slug>/`; the landing page is a Vite + Vue 3 + UnoCSS app that lists every talk via auto-discovered frontmatter.

## Develop

```sh
pnpm install
pnpm exec playwright install chromium   # one-time, for PDF export

pnpm dev:landing                 # landing page; HMR on talks frontmatter changes
pnpm dev <slug>                  # author a talk in Slidev presenter mode
pnpm build                       # full production build into dist/
pnpm preview                     # serve dist/ locally (mirrors GitHub Pages)
pnpm typecheck                   # vue-tsc
pnpm lint                        # eslint
pnpm test                        # vitest (scan-talks lib)
```

Requires Node 22 LTS and pnpm 9 (enforced via `engines` in package.json).

## Add a talk

1. `mkdir talks/<YYYY-MM-slug>` and create `slides.md`:

```markdown
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
```

2. `pnpm dev <slug>` to author.
3. Commit. Push to `main` triggers CI to deploy.

Required frontmatter fields: `title`, `talk.date` (ISO `YYYY-MM-DD`, quoted or unquoted), `talk.event`, `talk.description`. Build fails if any are missing.

## Personal info

Edit `landing/src/data/profile.ts` (name, tagline, bio, avatar, social links).

## How CI builds

`.github/workflows/deploy.yml` runs on push to `main`:

```
typecheck → lint → test → BASE_PATH=/<repo>/ pnpm build → upload dist/ → deploy to Pages
```

## Spec & plan

- [Design spec](docs/superpowers/specs/2026-04-26-personal-slides-project-design.md)
- [Implementation plan](docs/superpowers/plans/2026-04-26-personal-slides-project.md)
