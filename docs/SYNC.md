# Repo and Drive: what lives where

Last synced: **15 October 2026**, by a Cowork session (V3 only, at Krish's request). Before that: 13 October 2026 ("everything in sync").

## The rule

**This GitHub repo (`krishanraja/heartside`) is canonical** for every document, the theme code, the design source and every asset it holds. The Google Drive folder **Heartside** ([link](https://drive.google.com/drive/folders/1QInHx-RNx9fXYdc0KSvTYRcuGTZHxcVh)) mirrors the brand kit for people and for Canva. It also holds a few working files that only exist in Drive (listed below).

Why one canonical side: two editable copies drift, and a session that reads the stale one undoes Krish's decisions.

**When something changes:**

1. Change it in the repo first.
2. Copy it to the Drive location in the table.
3. Drive can't overwrite a file in place through the API. Upload the new copy, then move the old one into `00_Brand-Assets/05_Historical-and-Source/Superseded-<date>/`. Never delete.
4. Update the "Last synced" line here and in Drive `START-HERE.txt`.

A file that is changed only in Drive is not real yet. Bring it into the repo the same day.

## Mirrored: repo is the source, Drive is the copy

| Repo path | Drive location (under `Heartside/`) |
|---|---|
| `docs/V3-GIFTS-FROM-YOUR-DOG.md` | `V3-GIFTS-FROM-YOUR-DOG.md` |
| `docs/POSITIONING.md` | `POSITIONING.md` |
| `docs/SYNC.md` (this file) | `SYNC.md` |
| `design/BRAND-SYSTEM.md` | `00_Brand-Assets/01_Identity/Brand-system.md` and `00_Brand-Assets/06_Claude-Design-System/Heartside-Brand-system.md` |
| `design/CANVA-SOURCES.md` | `00_Brand-Assets/CANVA-SOURCES.md` |
| `assets/heartside-logo.png`, `assets/favicon-512.png`, `assets/heartside-heart-watercolor.png` | `00_Brand-Assets/01_Identity/` |
| `tools/fonts/*.ttf` and `OFL-*.txt` | `00_Brand-Assets/01_Identity/Fonts/` |
| `assets/photos/*` | `00_Brand-Assets/02_Imagery/Photos/` |
| `assets/v2/*.jpg` (Biscuit and the lifestyle library) | `00_Brand-Assets/02_Imagery/Product-scenes/` |
| `assets/v2/scenes/*` | `00_Brand-Assets/02_Imagery/Product-scenes/scenes/` |
| `assets/hero-dachshund.png` | `00_Brand-Assets/02_Imagery/hero-dachshund.png` |
| `design/mockups/*` | `00_Brand-Assets/03_Social-and-Ads/Product-mockups/` |
| `design/poster-template/*` | `00_Brand-Assets/03_Social-and-Ads/Poster-template/` |
| `assets/social-share-1200x628.png` | `00_Brand-Assets/03_Social-and-Ads/social-share-1200x628.png` and `Annual-Review/heartside-annual-review-social-share-1200x628.png` |
| `design/share-image/heartside-share-1200x630.jpg` (live share image, v2 of 6 Oct) | `00_Brand-Assets/03_Social-and-Ads/Annual-Review/heartside-share-1200x630.jpg` |
| `assets/heartside-avatar-biscuit-1080.jpg`, `assets/heartside-fb-cover-1640x624.jpg` | `00_Brand-Assets/03_Social-and-Ads/Profiles/` |
| `ornament/*.png` (front, back, masks, sample) | `00_Brand-Assets/03_Social-and-Ads/Ornament-artwork/` |

## Drive-only working files (not copied into the repo)

These are binary working files, edited in PowerPoint, Canva or claude.ai rather than in code. The repo records where they are instead of holding copies.

| Drive location | What it is | Canonical home |
|---|---|---|
| `00_Brand-Assets/03_Social-and-Ads/Ad-template-editable.pptx`, `Social-post-template-editable.pptx` | Editable PowerPoint starters | Drive |
| `00_Brand-Assets/04_Decks/Deck-starter-editable.pptx` | Editable deck starter | Drive |
| `00_Brand-Assets/02_Imagery/founder-heart-gesture-wide.png` | Founder image | Drive |
| `00_Brand-Assets/03_Social-and-Ads/Annual-Review/heartside-share-1200x628.jpg` | Earlier share image variant | Drive (reference only; the live one is the repo's 1200x630) |
| The claude.ai Design canvas "Heartside: gifts from your dog" | The approved v3 phone prototype | The claude.ai artifact https://claude.ai/artifact/68cvd4wN9xLGFzkFJSughX; its source is mirrored in the repo at `design/prototype-v3/` |
| `00_Brand-Assets/06_Claude-Design-System/` (two zips, `MIGRATE.md`, `heartside.tokens.json`) | Export of the claude.ai Design System artifact (tokens, components, previews) | The claude.ai artifact https://claude.ai/artifact/WjHjEeVf8xJCBgYzYjNcBM. Its hero sample text still reads "Now it's in writing."; update it when the site hero changes |
| Canva folder https://www.canva.com/folder/FAHXUgmLxDM | Logo exploration and the share-graphic draft | Canva (links in `design/CANVA-SOURCES.md`) |

## Repo-only (not mirrored to Drive)

The rest of `docs/` (HANDOFF, V2, BRIEF, browser prompts, archive), `shopify/` theme code, `tools/`, `content/` videos (style not yet approved), `design/*.dc.html` canvas source, redesign screenshots and `docs/evidence/`. Drive points here for these.

## Not covered by either

Live platform settings (Shopify, Teeinblue, Printful, Meta, TikTok) live in those platforms. `POSITIONING.md` section 5 records the profile wording and what still needs changing (rewritten 21 Oct), and `HANDOFF.md` section 3 records the store state.
