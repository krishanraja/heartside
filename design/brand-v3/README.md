# Favicon and share card for v3 (drafts, 21 Oct 2026)

**Status: waiting for Krish's approval. Not on the store.**

- `favicon.svg`, `favicon-16/32/48/180/192/512.png` and `favicon.ico` show Biscuit's head (the chat's host, from `shopify/assets/hs3.js`) on a cream tile. It replaces the pale watercolor heart, which disappears at 16 px. `favicon-preview.png` shows it at 180, 64, 32 and 16 px, and in dark and light browser tabs.
- `heartside-share-1200x630.jpg` is the share card: "Your dog loves you too." with the note-face mug in the dog's own voice. It replaces the v2 card, which still shows the retired HR poster ("Contract renewed. For life.").

**To put them live, after Krish's yes:**
- **Favicon:** upload `favicon-512.png` to Shopify Files, then set it in the theme's favicon setting. Helio owns the page head, so the theme push can't add it.
- **Share card:** replace the Shopify file `heartside-share-1200x630.jpg` in place (Admin API `fileUpdate` with a new source). It keeps its URL, so the home page's `og:image` changes with no setting touched.
