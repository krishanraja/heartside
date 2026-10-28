# Heartside repository and brand asset sync

Updated 28 October 2026. This replaces the 15 October map, which pointed Canva at retired products and an older design-system export.

## Current sources

- [`NOW.md`](../NOW.md) is the only current release-state, price-readback and next-action record. [`SCOPE.md`](SCOPE.md) holds approved scope; [`ECONOMICS.md`](ECONOMICS.md) holds the current economics procedure. Older project documentation is in [`history/`](history/README.md), and the independent review assignments are in [`review/`](review/).
- Live Shopify product records establish current prices, variants, descriptions and availability; the repo records the dated readback in `NOW.md`.
- The current storefront's brand tokens are in `shopify/assets/hs-brand.css` (`--hs-*`, from the 27 October brand book), loaded first on every page; the chat's own styles are in `shopify/assets/hs3.css`; font loading is in `shopify/snippets/hs2-head.liquid`.
- The favicon is the pink watercolor heart with a white paw (`design/brand-v4/`, built by `tools/build_favicon.py`); `heartside-favicon-heart.png` is the file for Shopify Files. The brand-v3 Buddy head stays as history.
- `design/checkout-tiles/` (28 October) holds the pictures Shopify shows for a gift's component line at checkout and for the Artist's touch add-on, with their exact alt text. They are uploaded to Shopify, not Drive or Canva, and only after the 28 October theme is live, since only that theme hides the gift tiles from the product pages (Part 2.5 of the [CoWork prompt](review/COWORK-LIVE-ACCEPTANCE.md)).
- `design/CANVA-SOURCES.md` is the current written Canva brand-kit handoff, except for its icon files: it predates the brand-v4 favicon, and the `favicon.svg` it names exists only in the retired brand-v3 set. Until it is updated, take icon files from `design/brand-v4/`. The matching Drive file is `00_Brand-Assets/01_Identity/CANVA-BRAND-KIT-GUIDE.md`.
- [`docs/history/BRAND-SYSTEM-PRE-REVAMP.md`](history/BRAND-SYSTEM-PRE-REVAMP.md) preserves the old October brand system. It is not the current product or social brief.

## Drive brand-assets layout

The existing private Drive `Heartside/00_Brand-Assets` root contains one `START-HERE.txt` and these five sections:

| Folder | Current use |
| --- | --- |
| `01_Identity` | Current Shopify logo, favicon formats, Fraunces / DM Sans / Courier Prime font files, and the Canva guide. |
| `02_Imagery/Current-Shopify-Product-Mockups` | Exact current product gallery examples, grouped into mug, blanket and portrait. The `90-Source-Records-Not-for-Social` child holds the blank blanket template and technical records. |
| `03_Social-and-Ads` | Existing working area. No finished social template in it is automatically approved for the current range. |
| `04_Decks` | Editable deck starter. |
| `05_Historical-and-Source` | Earlier identity, Biscuit avatar, Annual Review, ornament, source scenes, legacy fonts and previous documents. Preserve as reference; do not import into the current Canva kit. |

The current mockups are examples, not a customer's accepted design or a testimonial. The existing Canva Brand Kit named **Heartside** was found, but this sync only prepares Drive assets and guidance; it does not claim that Canva's kit or templates have been updated.

## Update rule

Change repository-owned text in the repo and mirror the final version to Drive. For stored raw Drive files, the connected Drive `update_file` action can replace content in place while preserving the file ID. Verify the resulting bytes/text and parent folder after any update. For current catalog facts, read Shopify again rather than copying a dated price from Drive. Keep obsolete material under `05_Historical-and-Source`; do not rename it into the active sections.

The older sync map, including previous folder names and mirroring instructions, remains in Git history for provenance.
