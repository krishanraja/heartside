# Heartside

Heartside sells personalised gifts written by your dog: The Annual Review poster, its framed version, the Tiny Me ornament and The Body Double pillow, made to order by Printful for US customers at heartside.io. The brand sign-off is "Your dog has notes." and the tagline is "Keep them close." The site is live; launch (posting and ads) is 20 October 2026, and the goal is $10,000 in sales by Christmas.

**Picking this up? Start with [`docs/HANDOFF.md`](docs/HANDOFF.md).** It holds the state of everything, the hard rules, the work left in order, how to change and deploy the site, how to test the purchase path, how to make videos, and an index of every asset.

- `docs/`: the handoff manual, the current plan (`V2-FROM-THE-DOG.md`), the guardrails (`BRIEF.md`), the browser-session prompts, and `archive/` (history, don't act on it).
- `shopify/`: the theme code (our sections, snippets, templates, `hs2.js`, `hs2.css`), deployed by `.github/workflows/shopify-theme-push.yml`. `shopify/README.md` documents every section.
- `tools/preview/`: local render, Theme Check, the minify check, the live-store gate and the in-app purchase test.
- `tools/content/`: the video builder and its specs.
- `content/`: rendered videos kept for reference (the first set is in `content/v1-2026-10-06/`).
- `design/`, `assets/`, `ornament/`: design source, print templates, product photos, the photo library and brand files.
