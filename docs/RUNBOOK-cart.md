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
| The checkout picture (`/apps/heartside-artwork`, n8n "Heartside checkout image preparation") | No | The line goes in, but checkout shows the gift's own photo instead of the painting. The page records `checkout_image_skipped` | The n8n data table "Heartside checkout failures": one row per failed answer (time, code, status). Shopify Files: the newest `heartside-checkout-*` file dates the last success. "Heartside checkout admission attempts": one row per request | See "The checkout picture" below |
| The AI note (n8n "compose gift lines") | No | The note falls back to written lines | n8n executions of the compose workflow (it saves them) | The published version and its prompt, `n8n/README.md` |
| The dog detector | No | No two-dog question; the photo goes as it is | The browser console (`photoLog`) | Nothing blocks on it |
| The cart drawer | No | No drawer; the cart works as it is | `hs-cart-more.js` | Nothing blocks on it |

## The checkout picture

**How it works:** `hs-checkout-image.js` asks the store's app proxy to register the design. The proxy calls the n8n workflow, which:
1. checks Shopify's signature and the rate gate;
2. gets a store token;
3. looks for an existing picture, and returns it if found (200, ready);
4. otherwise checks Teeinblue's copy, `cdn.teeinblue.com/customizations/<design>.jpg`, then creates the picture (202, pending), and the page asks again.

**What Shopify does with errors:** Shopify's app proxy replaces every 5xx from the workflow with its own page, "There was an error in the third-party application.", with a 500.

**Teeinblue's timing:** Teeinblue writes its copy only when Add to cart saves the design, a few seconds before the first ask.

**Not ready yet is a 202 (since 6 Nov, published by Krish's yes):** the workflow answers a design Teeinblue has not written yet with 202 pending, `preview_unavailable`. Shopify passes that through, and the page waits on it. Before, it answered 503, which Shopify turned into its error page, and the page gave up.

**What the page does:**
- It waits on 202 pending.
- It treats 500, 502 and 504 as "ask again", inside a 90-second, 12-request budget.
- Past the budget, the design goes in without its picture.
- Asking again is safe, because the workflow looks before it creates.

**The failure diary:** after it replies, the workflow writes one row for every answer of 403 or more to the n8n data table "Heartside checkout failures". The row holds the time, the code and the status, and never the token, the design or the buyer. The workflow still saves no runs, because each run handles a Shopify token.

| Code | Status | Means | Fix |
|---|---|---|---|
| `invalid_proxy_request`, `invalid_proxy_signature`, `expired_proxy_request`, `signed_request_mismatch` | 403 | Shopify's signature did not check out | The app's client secret in the n8n credential "Heartside checkout artwork HMAC" |
| `image_preparation_busy` | 429 | More than 30 requests in a minute | Wait; look for a loop in a browser |
| `shop_authentication_failed` | 503 | The store token was refused or lacks `write_files` | The dedicated app's install and scopes; the credential "Heartside checkout artwork token" |
| `image_lookup_failed`, `image_readback_failed` | 503 | Shopify's Admin API failed or answered oddly | Shopify's status; the API version in the HTTP nodes |
| `image_creation_failed` | 503 | `fileCreate` refused the picture | Files limit or permissions |
| `image_preparation_disabled` | 503 | The workflow's switch is off | `enabled` in the Proxy input node |

**What a probe tells you** (`node tools/preview/cart-path-check.mjs`):
- A made-up design must get 202 `preview_unavailable`. That proves the proxy, signature, rate gate, token, lookup and Teeinblue check.
- The `HS_CANARY_DESIGN_ID` design, one of the 5 November test buyers', must get 200 ready. That proves the readback.
- A made-up variant gets 400 `invalid_artwork_request` at once.

## Watching it

- **Storefront guard** (`.github/workflows/storefront-guard.yml`, hourly): checks the product addresses. It opens one GitHub issue when something breaks.
- **Live gate** (`tools/preview/live-gate.mjs`): checks the presentation on four views. Run it after every live push.
- **Real buyers, weekly** (`.github/workflows/real-buyer.yml`, Mondays, approved by Krish on 6 Nov at about $1.30 a week):
  - Six invented buyers go through Teeinblue's real painter on the live store, to the checkout page and never past it. Ten paintings at most.
  - The cases: three gifts in Roast, refused photos, double taps and a repaint, two dogs, a 4 MB original on slow data, and a reload mid-paint.
  - A buyer who does not reach checkout opens one issue labelled real-buyer. The screenshots are a run artifact.
  - To run one buyer by hand: `node tools/preview/real-buyer.cjs p04-bob`.
- **The cart path** (`tools/preview/cart-path-check.mjs`, in the same hourly guard since 6 Nov): asks the checkout-picture service about a made-up design and the `HS_CANARY_DESIGN_ID` design. A failure opens or updates the same one issue.
