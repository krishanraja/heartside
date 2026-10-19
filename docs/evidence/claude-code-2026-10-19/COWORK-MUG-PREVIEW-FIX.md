# Cowork prompt: fix the mug's Teeinblue Preview (two settings)

Paste everything below into Claude Cowork.

---

You're working for Krish Raja on Heartside (heartside.io). The Morning Mug's five colors are live: Black, Dark Blue, Dark Green, Red and Pink. Teeinblue campaign 1043122. Two settings on the new mockups are wrong. Claude Code saw both on the live page on 19 Oct. Fix them in Teeinblue only. Change nothing in Shopify, and change no price, artwork or Printful setting.

Rules: no em dashes, no exclamation marks, US spelling. Never handle tokens or passwords.

## 1. Each mockup pair belongs to its own color only

**Now:** the Preview has 10 slides, the dog face and note face of all five colors, whatever color the buyer picked. A buyer who picks Black also sees blue, green, red and pink mugs.

**Fix:** in the campaign's mockups, assign each pair to its own color only:
- Black mockups to Black.
- Dark Blue mockups to Dark Blue.
- Dark Green mockups to Dark Green.
- Red mockups to Red.
- Pink mockups to Pink.

In each pair, Mockup 1 (the dog face) comes first.

**Check:** on heartside.io/products/the-morning-mug, pick each color and press Preview. There should be exactly two slides, the dog face and the note face, both in that color.

## 2. Perspective on, so the words curve with the mug

**Now:** on the note face, the lines and "Love, [dog]" print in straight, flat rows across the mug. The approved render curves them with the mug's surface: each row rises toward the edges. The pink slide is flat too, so check every mockup.

**Fix:** on every mockup (both faces, all five colors), turn the print area's **perspective on**. Keep the placement from `design/teeinblue/mug-v3/mk-geometry.json`: top 208, size 1372 x 593, dog face at left 283, note face at left -696. Those numbers are on the 1200 px image; multiply by 0.8 if Teeinblue asks in its 960-unit canvas.

**Check:** in the Preview's note face, the rows should bow with the mug like `design/teeinblue/mug-v3/shopify-images/colors/the-morning-mug-drinker-black.jpg`, and the words should stay inside the white band.

## Saving

If saving needs an Update to Shopify, **untick Images and Description**. Claude Code restored the approved images and Heartside's description after the last push overwrote them.

## Report back to Krish

- A screenshot of the Preview for each color: two slides each, with the note face curved.
- Anything Teeinblue wouldn't allow. For example, if it can't assign mockups to a single color, say what it offers instead and stop there.
