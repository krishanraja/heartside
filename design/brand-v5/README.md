# Header icon and favicon for v5 (10 Nov 2026)

Ruling (Krish, 2026-11-10): the dachshund carrying a heart letter, on raspberry, is the top-left icon of the site and the browser favicon.

It replaces the brand-v4 watercolor heart with a paw as the favicon, and the "heartside" wordmark (`Black_and_White_Minimalist_Creative_Art_Design_Logo.png`) as the header logo. The brand-v4 files stay where they are, for history. The wordmark is still used by `assets/hs-logo.png` (the hero without a header, and the Organization logo in the structured data).

## Files

| File | Size | What it is |
| --- | --- | --- |
| `dachshund-letter-source.png` | 1254 px, opaque | The master, as Krish supplied it. |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | 16, 32, 48 px | Tab sizes: an area resample and a light sharpen (radius 1, 40%). |
| `favicon.ico` | 16, 32, 48 px | The tab sizes in one file. |
| `favicon-180.png` | 180 px | Apple touch icon. |
| `favicon-192.png`, `favicon-512.png` | 192, 512 px | Web app manifest sizes. |
| `icon-1024.png` | 1024 px | App icon and avatar. Uploaded to Shopify Files as `heartside-icon-dachshund.png` and set as the header logo. |
| `header-logo.png` | 256 px | The same tile for local previews; byte copy in `shopify/assets/hs-icon.png`. |

The raspberry ground fills the square, so no file is padded, redrawn or recolored. At 16 px the ears, eyes, nose and the white letter still read on light and dark tabs.

`shopify/assets/hs-favicon-*.png` are byte copies (checked by `tools/preview/head-heartside.test.mjs`).

## Rebuild

`python3 tools/build_icon_v5.py` writes every file above except the master and copies the theme assets. Two runs give the same bytes.

## Live

- Favicons: the theme push (the `hs-favicon-*.png` assets that `snippets/hs-head.liquid` links).
- Header logo: the push's `logo` input set to `heartside-icon-dachshund.png`, at 44 px (36 px on phones), with rounded corners from `hs-brand.css`.
