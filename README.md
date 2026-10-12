# Heartside

Heartside sells personalized dog gifts: The Annual Review poster, its framed version, the Tiny Me ornament and The Body Double pillow, made to order by Printful for US customers at heartside.io. The lead line is "Your dog loves you too." and the display name on every platform is "Heartside: Personalized Dog Gifts". The site is live; launch (posting and ads) is 20 October 2026, and the goal is $10,000 in sales by Christmas.

**Picking this up? Read [`docs/POSITIONING.md`](docs/POSITIONING.md) first (12 Oct 2026: the positioning, Krish's reasons, and the $10k social plan; it overrides older docs on headlines and brand copy). Then [`docs/HANDOFF.md`](docs/HANDOFF.md).** What lives here and what lives in Google Drive: [`docs/SYNC.md`](docs/SYNC.md) (this repo is canonical; Drive mirrors it). The handoff holds the state of everything, the hard rules, the work left in order, how to change and deploy the site, how to test the purchase path, how to make videos, and an index of every asset.

- `docs/`: the positioning (`POSITIONING.md`), the handoff manual, the earlier plan (`V2-FROM-THE-DOG.md`), the guardrails (`BRIEF.md`), the browser-session prompts, and `archive/` (history, don't act on it).
- `shopify/`: the theme code (our sections, snippets, templates, `hs2.js`, `hs2.css`), deployed by `.github/workflows/shopify-theme-push.yml`. `shopify/README.md` documents every section.
- `tools/preview/`: local render, Theme Check, the minify check, the live-store gate and the in-app purchase test.
- `tools/content/`: the video builder and its specs.
- `content/`: rendered videos kept for reference (the first set is in `content/v1-2026-10-06/`).
- `design/`, `assets/`, `ornament/`: design source, print templates, product photos, the photo library and brand files.
