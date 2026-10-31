# CoWork launch ready, part 1: report, 31 October 2026

Ran from the brief `COWORK-LAUNCH-READY-1.md`. No orders were placed, confirmed or cancelled. Nothing was pressed in Teeinblue. No tokens were created, and none appear here.

| Step | Result | Verified by readback |
|---|---|---|
| 1. Backup facilities off | **Skipped on Krish's answer "Not yet".** The setting is still ON. Nothing was changed. | Yes: read live, still ON |
| 2. Printful private token | **Not done by CoWork.** Creating and copying an API token is a step Krish must do himself; CoWork can't type tokens into any form. Instructions below. | n/a |
| 3. Token into n8n | Not done, for the same reason. Krish does it. | n/a |
| 4. Shopify custom app and token into n8n | Not done, for the same reason. Krish does it. | n/a |
| 5. Read back | Done | Yes |

## Step 5: read back (live, 31 Oct)
- **Printful, Settings, Orders, Heartside:**
  - "Manually confirm imported orders": **ON** ("Automatically confirm orders to be fulfilled" is off)
  - "Import personalized orders as drafts": **ON**
  - "Fulfill my orders at a backup facility": **ON**, unchanged
  - Also unchanged: automatic stock update ON, automatically import orders with synced products ON, product alternatives ON
- **Teeinblue, Fulfillment Providers, Printful:** Connected, and "Auto confirm order" is **OFF**. Read without a screenshot, because that page shows the existing Printful key in plain text.

## What Krish needs to do for steps 2 to 4 (about 10 minutes)

**Printful token (step 2)**
1. Go to developers.printful.com, signed in as Heartside's account, and open the tokens page. Choose to create a **private token**.
2. Name: `Heartside n8n note and confirm`. Store: **Heartside**.
3. Scopes: orders (read and write) and files (read and write). Add only the product-read scope Printful insists on, if it asks for one.
4. Don't touch the key Teeinblue already uses.
5. Copy the token once, straight into n8n (next step). Don't paste it anywhere else.

**Printful token into n8n (step 3)**
1. In n8n, go to Credentials, then New, then Header Auth.
2. Name: `Printful - Heartside orders`. Header name: `Authorization`. Value: `Bearer ` followed by the token.
3. Save.

**Shopify read access (step 4)**
1. In Shopify admin, go to Settings, Apps and sales channels, Develop apps, Create an app. Name it `Heartside n8n orders`.
2. Under Admin API scopes, tick **only** `read_orders`. Install the app, then reveal the Admin API access token once.
3. In n8n, go to Credentials, then New, then Header Auth.
4. Name: `Shopify - Heartside orders (read)`. Header name: `X-Shopify-Access-Token`. Value: the token.
5. Save.

Once both are saved, CoWork can read back the two credential **names** in n8n, and the app's scope in Shopify, without opening the values.

## Follow-up on Krish's "do it all" (31 Oct, afternoon)
- **Step 1, backup facilities off:** attempted, and **blocked by the session's safety check**, because Krish's last answer on it was "Not yet". It is still ON and nothing changed. It needs a fresh, explicit yes.
- **Steps 2 to 4, tokens:** still Krish's. CoWork can't create or paste access tokens, even when asked.
- **Checkout errors, investigated read-only:**
  - The warning sits directly under the two active cart transforms: "Addon Price Cart Transform" (Teeinblue) and "Cart Transformer: Line Properties" (Function Studio). Shopify's docs say transforms from different apps all run on every cart, and line-update operations only work on Shopify Plus. **The store is on Basic, not Plus.**
  - Function Studio still shows "Free trial" in the app list. Opening its function page brings up a permission request ("View rollouts"), which was **cancelled, not approved**. Its run logs couldn't be read: this connection lacks `read_cart_transforms`.
  - **Orders:** the last ones are test orders on 29 October at 02:09 to 02:47 UTC, all refunded. The warning's start date matches them. There have been no real-customer checkouts since 28 October.
  - **Abandoned checkouts since then:** only one, today at 11:12 UTC: Artist's touch plus a mug tagged `_test`.
  - **Live probe:** a cart holding only the Artist's touch reaches checkout normally (HTTP 200, payment form shown). The gift lines that carry Teeinblue's properties weren't tested, because that needs a personalised design.
  - **Most likely reading** (inference, not proven): the errors come from gift lines going through the two cart transforms. The 29 October test checkouts tripped them. The Function Studio trial and permission state may be involved.
  - **Next step:** a full gift checkout test, run by the Claude Code session, plus Krish deciding on the Function Studio permission request and its $69/month plan (his 28 October ruling was to keep it through Christmas).

## Done after Krish's explicit yes (31 Oct)
- **Step 1, backup facilities: done.**
  - Before: "Fulfill my orders at a backup facility" was ON.
  - Change: unticked, saved, and Printful's "Opt out" prompt confirmed.
  - After: **OFF**, read back after a reload.
  - Unchanged on the same page: manual confirm ON, personalised orders as drafts ON, synced-product import ON, stock update ON, product alternatives ON.
  - Rollback: tick it again and press Save.
- **Function Studio permission "View rollouts": approved.**
  - The app now opens. Its plan shows **Advanced (current plan)**; the Shopify app list still says "Free trial".
  - Its Cart Transform tab shows one function, "Heartside personalized checkout images — candidate", status **Active**. The tab warns: "Shopify limits the maximum number of active cart transforms to 1 per store."
  - **The store has two active:** this one and Teeinblue's "Addon Price Cart Transform". Shopify's developer docs say instead that one is allowed per app, and that all of them run. The two sources disagree. Either way, two transforms acting on the same gift lines is the likeliest source of the checkout errors that started on 29 October.
  - The function's own page shows "Oops! An unexpected error occurred" even after the permission was approved.
  - Its Timeline shows edits on 27 October only (versions v1 to v12). It holds no run or error log.
- **Recommended next step for the Claude Code session:** one full gift checkout on the live store, from the personaliser through to the payment page without paying. Do it with both transforms active, and record any error. If it fails, decide which transform stays.

## n8n credentials, set up without their tokens (31 Oct)
- **Created in n8n (Personal):**
  - `Printful - Heartside orders`: Header Auth, header `Authorization`, value prefilled with `Bearer `. **No token yet.**
  - `Shopify - Heartside orders (read)`: Header Auth, header `X-Shopify-Access-Token`, value **empty**.
- **To finish:** Krish opens each credential, pastes the token (for Printful, after `Bearer `), and saves.
- **Printful token page:** opened at developers.printful.com, which asks Krish to sign in.
- **Shopify finding that changes step 4:**
  - Settings, Apps, App development no longer offers legacy custom apps. It shows only "Build apps in Dev Dashboard".
  - A Dev Dashboard app may not give a permanent Admin API access token the way the brief assumes.
  - The Claude Code session should confirm how the workflow gets Shopify read access. Options: a Dev Dashboard app installed on the store, or n8n's own Shopify credential types.

## Credentials, completed (31 Oct, afternoon)
- **Printful:** Krish pasted the token into `Printful - Heartside orders`. n8n shows it was last updated "just now". The value wasn't read.
- **Shopify app:**
  - Created in the Dev Dashboard as **"Heartside n8n orders"**.
  - Scopes: `read_orders` only. "Embed app in Shopify admin" is off, and the app URL is the placeholder.
  - Version `heartside-n8n-orders-1` was released and is Active.
  - **Installed on the Heartside store.** It now appears in Settings, Apps, Installed.
- **How Shopify access works now:**
  - A Dev Dashboard app gets no permanent token. It has a Client ID and a Client secret (in the app's Overview). The workflow swaps them for an Admin API token that lasts 24 hours, using the client credentials grant: POST `https://<store>.myshopify.com/admin/oauth/access_token` with `grant_type=client_credentials`.
  - So the static Header Auth credential `Shopify - Heartside orders (read)` **won't work as designed.**
  - The Claude Code session should add a token-exchange step to the workflow, and store the client ID and secret in an n8n credential. Krish pastes the secret himself.
  - That empty Header Auth credential can be deleted, or repurposed by the Claude Code session.
- **Noticed:** "Printify: Print on Demand" no longer appears in the installed apps list. It was there earlier today. This run didn't remove it.

## Still open from earlier today
- **Shopify checkout warning:** "There were errors during checkout starting October 29, 2026. Some customers have abandoned checkout or were unable to submit orders."
- **Teeinblue page shows the old Printful key:** Teeinblue's Printful connection page shows the existing Printful key in plain text. Rotating it is Krish's call. If he rotates it, Teeinblue's connection needs the new key.
- **Backup facilities and the slip note:** with backup facilities ON, any order Printful moves to a backup facility loses its packing-slip note. The plan's "note in every box" isn't guaranteed until this is switched off.
