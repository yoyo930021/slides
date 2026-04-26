# slides

Personal Slidev decks + landing page, deployed to GitHub Pages.

## Quickstart

```sh
pnpm install
pnpm dev:landing                    # work on landing page
pnpm dev <slug>                     # work on talks/<slug>/slides.md
pnpm build                          # full production build into dist/
pnpm preview                        # serve dist/ locally
```

## Adding a talk

1. Create `talks/<YYYY-MM-slug>/slides.md`.
2. Fill frontmatter (see [spec](docs/superpowers/specs/2026-04-26-personal-slides-project-design.md#frontmatter-慣例)).
3. `pnpm dev <YYYY-MM-slug>` to author.
4. Commit. CI deploys on push to `main`.
