# Favicon and share card for v3 (drafts, 21 Oct 2026)

**Status: approved by Krish on 21 Oct ("yes to all four, put them live"), with one change to the share card: "we should have a picture of someones dog on the mug, with the message".**

- `favicon.svg`, `favicon-16/32/48/180/192/512.png` and `favicon.ico` show Biscuit's head (the chat's host, from `shopify/assets/hs3.js`) on a cream tile. It replaces the pale watercolor heart, which disappears at 16 px. `favicon-preview.png` shows it at 180, 64, 32 and 16 px, and in dark and light browser tabs.
- `heartside-share-1200x630.jpg` is the share card: "Your dog loves you too." with two real mug renders. The message mug is at the back; the front mug carries the sample dog's photo, the realistic dachshund cut-out the approved mug images use. Both faces are the approved wrap, never AI-drawn (HANDOFF 2.4). It's built by `tools/realphoto/share_card_mugs.py` and `share-card.html`. It replaces the v2 card, which still shows the retired HR poster ("Contract renewed. For life.").

**How they went live:**
- **Favicon:** upload `favicon-512.png` to Shopify Files, then run the theme push with `favicon` set to its file name. `.github/scripts/set-favicon.mjs` changes only that key in the settings the run has just backed up. Helio owns the page head.
- **Share card:** replace the Shopify file `heartside-share-1200x630.jpg` in place (Admin API `fileUpdate` with a new source). It keeps its URL, so the home page's `og:image` changes with no setting touched.
