# Heartside

Heartside sells gifts written by your dog. The brand sign-off is "Your dog has notes." and the tagline is "Keep them close." The store runs on Shopify, sells to the US, and launches on 20 October 2026 at heartside.io.

Start with `docs/V2-FROM-THE-DOG.md`, the current plan: positioning, the comedy bible, range, prices and fulfilment. It replaces the ornament-led plan. `docs/BRIEF.md` still holds the guardrails (no invented reviews, scarcity or claims).

- `design/`: the approved canvas source. `Main.dc.html` is the landing page and its copy is approved word for word. `Poster.dc.html` is the printed poster. `poster-template/` holds the print files for Teeinblue.
- `shopify/`: the theme sections (homepage and two product templates) built from the canvas, with install notes and screenshots in its README. GitHub Actions deploys them into the unpublished "Heartside launch" theme (`.github/workflows/shopify-theme-push.yml`).
- `docs/TEEINBLUE-SETUP.md`: the six product templates and the drafts-only order setting, for the Claude Desktop session that has the Teeinblue connector.
- `assets/`: brand files, licensed dog photos, the image brief for Canva and Printful mockups, and the social sharing image.
- `tools/`: scripts that build the theme assets and print files, and a local preview that renders the Liquid and screenshots it.
- `ornament/`, `docs/COWORK-PROMPT.md`, `docs/HANDOFF.md`, `docs/STORE-STATE.md`: v1 history, kept for reference.
