# Runbook: the path to the cart

Krish, 6 November: "How do we make this pipeline completely antifragile so that even if there are issues, we can fix them immediately with a clear understanding of what went wrong?" This page is the answer for the part that earns money. It lists every step between a buyer's photo and a line in the cart, says which one may never fail, what a failure looks like, where to look and what fixes it.

**The rule:**
- The cart is the one thing that must work. Teeinblue's saved design is the only essential part of an add.
- Every other step is optional: the checkout picture, the AI note, the dog detector and the cart drawer.
- An optional step that fails is skipped, the skip is recorded, and the buyer carries on (Ruling, Krish, 2026-11-06).

## The steps

| Step | Essential? | What a failure looks like | Where to look | Fix |
|---|---|---|---|---|
| Teeinblue paints the design | Yes | "Still painting" past 3 minutes, or "The painting stopped" | Teeinblue's dashboard; the gift page repaints by itself once (`hs2.js` `journeyOrphan`) | Teeinblue's status; a reload paints again from the same photo |
| Teeinblue saves the design on Add to cart | Yes | Teeinblue marks a field to fix; nothing goes in | The field it marks on the gift page | The buyer fixes the field |
| The checkout picture (`/apps/heartside-artwork`, n8n "Heartside checkout image preparation") | No | The line goes in, but checkout shows the gift's own photo instead of the painting. The page records `checkout_image_skipped` | Shopify Files: the newest `heartside-checkout-*` file dates the last success. The n8n data table "Heartside checkout admission attempts" holds one row per request | See "The checkout picture" below |
| The AI note (n8n "compose gift lines") | No | The note falls back to written lines | n8n executions of the compose workflow (it saves them) | The published version and its prompt, `n8n/README.md` |
| The dog detector | No | No two-dog question; the photo goes as it is | The browser console (`photoLog`) | Nothing blocks on it |
| The cart drawer | No | No drawer; the cart works as it is | `hs-cart-more.js` | Nothing blocks on it |

## The checkout picture

**How it works:** `hs-checkout-image.js` asks the store's app proxy to register the design. The proxy calls the n8n workflow, which:
1. checks Shopify's signature and the rate gate;
2. gets a store token;
3. looks for an existing picture, and returns it if found (200, ready);
4. otherwise checks Teeinblue's copy, `cdn.teeinblue.com/customizations/<design>.jpg`, then creates the picture (202, pending), and the page asks again.

**What Shopify does with errors:** Shopify's app proxy replaces every 5xx from the workflow with its own page, "There was an error in the third-party application.", with a 500. So the workflow's 503 "preview not ready yet" reaches the page as a 500.

**Teeinblue's timing:** Teeinblue writes its copy only when Add to cart saves the design, a few seconds before the first ask.

**What the page does:** it treats 500, 502 and 504 as "not ready yet" and asks again, inside a 90-second, 12-request budget. Past the budget the design goes in without its picture (6 Nov). Asking again is safe, because the workflow looks before it creates.

**What a probe tells you:**
- Asked about a design it already made, the workflow answers 200 ready in about 3 s. That proves the proxy, the signature, the token, the lookup and the readback work.
- A made-up design with a real variant gets Shopify's 500 page. That is expected: Teeinblue has no copy, and the workflow answers 503.
- A made-up variant gets 400 `invalid_artwork_request` at once. That proves the workflow is up.

**Why it is blind:** the workflow saves no runs, because each run handles a Shopify token. A crash leaves nothing to read.

**Open for Krish:**
- The workflow could answer "not ready yet" with a 202 pending that Shopify passes through, instead of a 503. Then a probe could tell "waiting" from "broken". This edits a published n8n workflow.
- It could also write one row per failure (time, step, code, never the token) to a data table. That edits a published n8n workflow too.

## Watching it

- **Storefront guard** (`.github/workflows/storefront-guard.yml`, hourly): checks the product addresses. It opens one GitHub issue when something breaks.
- **Live gate** (`tools/preview/live-gate.mjs`): checks the presentation on four views. Run it after every live push.
- **Proposed:** add the checkout picture to the hourly guard, once the workflow answers "not ready yet" with a 202. The alternative is to keep one known finished design's id as a GitHub secret and ask about it every hour, expecting 200 ready.
