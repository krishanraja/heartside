> **Historical.** Archived 2026-10-27. Not current guidance.
> Replaced by: NOW.md, docs/SCOPE.md and docs/ECONOMICS.md.
> Reason: records a superseded product, price, execution plan or source state.

# Design reference: "Heartside: From the dog" canvas

These are the source files of the approved design canvas, exported so Claude Code can read them (the canvas itself is a private claude.ai page).

- `Main.dc.html` is the landing page. Its markup, inline styles, copy and the joke lines in `renderVals()` (improvement, incident and enemy lines, product copy) are the spec. Rebuild it as Shopify theme sections. Do not ship this file as-is: it is a design-tool format (`<x-dc>`, `{{holes}}`, `sc-for`).
- `Poster.dc.html` is the printed Annual Review poster layout (12×18 at 600×900 here). It becomes the Teeinblue template.
- `Ad1`–`Ad5` are the ad storyboards. `ads/AD-SCRIPTS.md` has the same ads in full.

Image URLs starting `/_blob/` only resolve inside the canvas. Replace them with the images listed in `assets/IMAGE-BRIEF.md`.

## Brand files (added 12 Oct 2026)

- `BRAND-SYSTEM.md`: the brand book (voice, colour, type, imagery), updated for the 12 Oct positioning. Mirrored in Drive at `00_Brand-Assets/01_Identity/Brand-system.md` and `06_Claude-Design-System/Heartside-Brand-system.md`.
- `CANVA-SOURCES.md`: links to the editable Canva sources.
- The full design system (tokens, components, previews) is the claude.ai Design System artifact; its export lives in Drive `06_Claude-Design-System`. See `docs/SYNC.md`.
