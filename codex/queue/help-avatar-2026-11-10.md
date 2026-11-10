---
card: help-avatar-2026-11-10
title: Three avatar options for the heartside.io help chat, a friendly regular guy in a call-center headset, as SVG
spend_id: 5d04e37a-211e-4faf-9d71-712be2424dcd
max_minutes: 40
max_calls: 40
write_allow: [design/help-avatar-2026-11-10/*, tools/print-art/help_avatar_sheet.py]
---
## Goal
The help chat in the bottom-right corner of heartside.io (`shopify/assets/hs-help.js`, `n8n/HELP-CHAT.md`) needs its
face. Krish, 10 Nov 2026: "super friendly, reassuring, and have a humanoid emoji/bitmoji-style emoji of a regular guy
with a call center headset." The one point it must land: a warm, approachable person who is clearly there to help, so a
worried buyer relaxes. The current face is a quick placeholder, `shopify/assets/hs-help-agent.svg`. Read it for the
size and framing, but do not copy its drawing.

Make three different options, each a hand-written SVG (no raster images, no fonts, no scripts, no external
references), viewBox 0 0 96 96, under 6 KB:
- `design/help-avatar-2026-11-10/option-a.svg`
- `design/help-avatar-2026-11-10/option-b.svg`
- `design/help-avatar-2026-11-10/option-c.svg`

Each one:
- **Framing:** a head-and-shoulders portrait inside a full circle background, cropped to that circle. It is shown at
  40 to 44 px, so it must read at that size: a big friendly face, simple shapes, no fine lines under 2 px, no tiny
  detail.
- **Style:** bitmoji or emoji: flat colours, soft shapes, a warm open smile and kind eyes, a regular everyday guy
  (casual top, not a suit). Give the three a little variety in looks, such as hair, skin tone and facial hair, while
  keeping all three friendly and relatable.
- **Headset:** a call-center headset, with a band over the head, one or two ear cups and a mic boom to the mouth,
  clearly readable at 44 px.
- **Palette:** Heartside's brand colours for the background and clothes: blush #F0C0C0 or cream #FBF6F1 for the
  background circle, chestnut #8A4A2B or ink #121010 for the top, and ink #121010 for the headset. Skin and hair should
  be natural tones.
- **Accessibility:** add `role="img"` and `aria-label="Heartside help"` on the svg element.

Also write `tools/print-art/help_avatar_sheet.py` (Python 3; cairosvg or rsvg-convert if available, otherwise Pillow
with a note) that renders `design/help-avatar-2026-11-10/sheet.png`:
- the three options side by side at 44 px, 96 px and 256 px;
- each one also on a dark ink #121010 pill (as on the launcher) and on cream;
- labelled A, B and C.

Krish picks one from the sheet, and the chosen file then replaces `shopify/assets/hs-help-agent.svg` (not in this
card).

## Acceptance
python3 tools/print-art/help_avatar_sheet.py --check design/help-avatar-2026-11-10

`--check` exits non-zero unless all three SVGs exist, each is under 6144 bytes with viewBox "0 0 96 96", none contains
`<image`, `<script`, `href="http` or `@import`, and `sheet.png` exists.

## Return
The three SVGs, the sheet and the script, committed on the card's branch, and a note of anything it could not do.
