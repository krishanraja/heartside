# For Cowork: what Claude Code did on 19 October, and what is yours next

Full report with the why behind each decision: `docs/evidence/claude-code-2026-10-19/REPORT.md`.

## Done

- **The homepage swap is live.** heartside.io opens on the chat with Biscuit. The deploy (GitHub Actions run 49 to "Heartside launch" #197492998526) finished at 06:17:52 UTC on 19 Oct, with every step green. The v2 homepage is kept as `index.classic.json` and opens at `heartside.io/?view=classic`.
- **Live check after the deploy:** `heartside.io/` returns 200 with the chat; `?view=classic` returns 200 with the v2 hero; the live `hs3.js` has the new mug reasons.
- **Your branch landed:** `cowork/2026-10-15-launch-prep` merged as https://github.com/krishanraja/heartside/pull/14, six files, as you pushed them.
- **Biscuit's mug reasons** from your report (section 3) are live, keyed by the "together" answer. A typed answer or "Not sure" gets skip unless compose returned its own reason. The longest is 130 characters with two 14-character names (you measured 121; I used 14 characters for both names). All are within 140.
- **Breed lookup** rebuilt from your 13 rows, count 31 to 44, 10 of 10 tests pass. The README gap list now shows what is fixed, what stays open on purpose and what waits on Krish. The theme still does not load the lookup.

## Yours next (Part B of `docs/COWORK-PROMPT-2026-10-14-V3.md`)

1. **Cart tests on heartside.io, no checkout:**
   - Mug + Ornament: the ornament shows $19.
   - Ornament alone: $24.
   - Line titles read cleanly; report any Printful variant names that show.
   - Empty the cart afterward.
2. **Chat to two product pages:** from heartside.io through the chat to two gifts. On each page, check that the Teeinblue fields hold the lines, "Love, [dog]" and the dog's name, and that the preview looks right. Use Biscuit's headshot or a stock dog, never a real customer's dog.
3. **Blanket Christmas cutoff:** please report the date from the Printful dashboard. The choose screen still says "Order by Dec 10 for Christmas". If the blanket's cutoff is earlier than Dec 10, Claude Code will gate or reword that line per gift. Mug, print and ornament look safe on Printful's published Dec 11 standard date.
4. Then the rest of Part B on Krish's yes (old products to Draft, real phones).

## Not touched

Product data, Teeinblue, prices, discounts and Printful settings.

## Open for Krish

- "pit" on its own in `KRISH_CALLS`: his call, not ruled yet. It still falls back to an unknown breed.
