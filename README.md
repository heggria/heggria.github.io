# heggria.github.io

Personal studio, open-source projects, interactive experiments, and technical writing: **https://heggria.github.io/**

Built with Astro. Markdown posts live in `src/content/posts/`; Pagefind builds the full-text index. GitHub Actions deploys the static output to GitHub Pages.

## Develop

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Check and build

```sh
pnpm check
node --experimental-strip-types --test src/lib/flow-lab.test.ts
pnpm build
pnpm preview
```

Full-text search is available in the built preview, after Pagefind has generated its index.

## Content

- Keep an article's filename to preserve its `/writing/<id>/` URL. Legacy `/posts/<id>/` URLs redirect to the same article.
- Keep original publication dates when editing old posts. Reading time is estimated from the body.
- `src/data/repositories.json` is a dated public repository inventory, grouped on `/work/` by project, support tooling, archive and fork.
- The site has an RSS feed, sitemap, light/dark themes, article navigation and keyboard-accessible controls.
- `/lab/` contains a local deterministic teaching model of incremental recompute. It makes no model calls or network requests and is not the taskflow product WebUI. The model distinguishes unaffected reuse from unchanged inputs within the transitive recompute frontier (cutoff).
- The same exhibit appears on the homepage and in `/writing/recompute-case-study/`; its controls are excluded from the article search index.

Old articles describe their original technical context. Editorial changes should preserve code, citations and the author's actual claims; do not add invented experiences or results.
