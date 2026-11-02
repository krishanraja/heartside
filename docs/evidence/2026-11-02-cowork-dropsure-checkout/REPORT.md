# CoWork report: DropSure, broken theme copy, checkout fonts, account domain

Status: RESULT. Run on 2 November 2026 in Claude CoWork (browser, Shopify admin, plus a read-only clone of `main` of `krishanraja/heartside`). Answers the assignment "uninstall DropSure, delete a broken theme copy, and give the checkout the brand's fonts" and Krish's follow-up to move customer accounts to heartside.io.

North Star: $50,000 Shopify net sales, trailing four weeks, by 22 February 2027.

## Summary

| Step | Result | Verified by readback |
|---|---|---|
| 1. Uninstall DropSure | Done, on Krish's yes | Yes |
| 2. Delete "Heartside 2 Nov gifts draft" | Done, on Krish's yes | Yes |
| 3. Report checkout fonts | Instrument Serif headings, Inter body | Yes (read only) |
| 4. Set checkout fonts | Fraunces headings, DM Sans body, saved | Yes, editor preview only |
| 5. `node tools/preview/live-gate.mjs` | All clear on the first run, exit 0 | Yes |
| Follow-up: customer accounts on heartside.io | account.heartside.io Connected; making it primary is waiting on Krish's click | Partly |

## 1. DropSure uninstalled

- Before: "DropSure - Dropshipping & POD" was installed with no charge listed. Every active product had vendor "Heartside" and was stocked only at the "USA" location. No "Dropsure Fulfillment" location was visible through the Admin API.
- The uninstall box showed no inventory warning, only Shopify's standard notice that the app's data is deleted and that a request goes to the developer to delete customer data. Reason given: "Not using app now".
- Readback:
  - DropSure is no longer listed under Installed apps.
  - The Settings, then Billing page contains no DropSure entry.
  - Active products are unchanged and still ACTIVE at their prices: mug $45 (5 colours), blanket $129, portrait $119 framed (3 frames) and $59 unframed, card $12. The "Artist's touch" add-on ($29) is also unchanged.

## 2. Broken theme copy deleted

- Before: exactly one theme was named "Heartside 2 Nov gifts draft". Its `layout/theme.liquid` was 48 bytes, against 7,137 bytes for "Heartside 2 Nov gifts (working draft)". Shopify's confirm box named exactly that theme.
- Readback from the Admin API theme list:
  - "Heartside 2 Nov gifts draft" is gone.
  - "Heartside 31 Oct showcase" is still MAIN, with an unchanged updated time.
  - "Heartside 2 Nov gifts (working draft)" and "Heartside audit fixes draft" are untouched.
- Seven themes remain: Helio, Heartside launch, Copy of Heartside launch, Heartside 2 Nov gifts (working draft), Heartside 28 Oct fixes, Heartside audit fixes draft, and Heartside 31 Oct showcase (live).

## 3 and 4. Checkout fonts

- Before: headings were Instrument Serif and body was Inter.
- The editor offers a dropdown of 262 fonts, with no upload. Fraunces and DM Sans are both offered by name. Courier Prime is not; the nearest is Courier New. `shopify/assets/hs-fraunces.woff2` and `hs-dmsans.woff2` were not needed.
- Change: headings set to Fraunces and body to DM Sans, then saved. Colours, logo, layout and every other setting were not touched.
- Readback:
  - After a reload, the editor shows Fraunces and DM Sans.
  - The editor's previews of the information step, the Thank you page and the Order status page all render in the new fonts.
  - The checkout configuration ("My Store configuration") is Active, so the change is live for new checkouts.
- Not verified: a real checkout in a shopper's browser. No test order was placed.
- Courier Prime for paperwork can't be set in checkout branding. It stays theme-only.

## 5. Live gate

- Ran `node tools/preview/live-gate.mjs` from a fresh clone of `main` in the CoWork cloud workspace, because Krish's computer was not linked.
- `playwright` was not installed in the clone, so `node_modules/playwright` was pointed at the copy already installed in the workspace. Nothing in the repo changed and nothing was committed.
- Result: every page passed in all four views (desk, phone, Instagram, Android Edge) for home, mug, portrait, blanket, catalog, cart and missing. It printed "all clear" and exited 0.
- The gate covers the storefront only, not checkout.

## Follow-up: preview banner and moving customer accounts to heartside.io

- **The preview banner was only in Krish's own browser.** It was stuck in an unpublished preview of "Copy of Heartside launch", an older draft. Clearing the preview in that browser fixed it. heartside.io now loads "Heartside 31 Oct showcase" (role main) with no preview bar. Customers were never affected. Nothing was published, and publishing that draft would have rolled the site back.
- **The storefront was already on heartside.io** as primary, with www, heart-side.org and www.heart-side.org redirecting.
- **Customer accounts** (sign-in, orders, order status) were on a shopify.com address.
  - Krish added `account.heartside.io` and set its DNS at Namecheap. Shopify now shows it as **Connected**: DNS points to Shopify, it's live in all regions, and the TLS certificate is issued.
  - **Pending:** making account.heartside.io the *primary* customer accounts domain. It is currently a redirecting domain. This session's safety check blocks domain changes, so the dialog was left open with "Primary domain" selected for Krish to confirm. Until he does, the customer accounts URL still shows the shopify.com address.
  - To verify after his click:
    - Settings, then Customer accounts, then URL shows `https://account.heartside.io`.
    - The Domains list marks it Primary under Customer Account.

## Also observed earlier in this session (read only, nothing changed)

- **Paid orders are waiting on a manual send.** In Teeinblue, the newest mug order and two blanket orders from 27 October sit at "Ready" ("Ready to send to fulfill") and have never been sent to Printful. There is no error.
  - Teeinblue's Printful connection shows Connected, but "Auto confirm order" is OFF, so even sent orders wait as drafts in Printful until someone confirms them.
  - The newest order had no fulfillment shipping method set.
  - Its artwork is named "... DRAFT six styles".
  - Sending, confirming and any settings change are Krish's call.
- **The Printful API key** was shown in plain text on Teeinblue's Printful settings page while it was read. It isn't repeated here. Rotating it is recommended, on Krish's say-so.
- **A Teeinblue support agent asked** whether Printful can pack a personalised message card in the same parcel as the product. Nobody has replied.

## What was not done

- No orders were placed, paid for, confirmed or cancelled. Nothing in Teeinblue, Printful or n8n was changed.
- No theme was published.
- No repo files were changed; there is no closeout note in `now-notes/`, because this run changed store settings, not the repo. Claude Code may want to record these store changes in NOW.md.

## Claude Code review (2 November 2026)

- **Steps 1 to 5 hold.** The theme readback in step 2 matches the Admin API theme list.
- **"Paid orders are waiting on a manual send" is out of date.** That was the state earlier on 2 November. Since 14:32 UTC the n8n workflow "Heartside: send paid orders to Printful" (`n8n/SEND-TO-PRINTFUL.md`) sends each paid order to Printful by itself, and the note workflow confirms it.
  - The newest mug order was sent and confirmed at 14:49 UTC, and its order status is pending (in production).
  - The two 27 October blanket orders are Shopify test orders. They are archived, tagged `do-not-fulfill`, and never sent.
  - "Auto confirm order" in Teeinblue stays OFF on purpose: the note workflow confirms after writing the note.
- **Printful API key:** on 31 October Krish chose to keep the current key.
- **Teeinblue support's question:** the answer is yes. The buyer's note goes on Printful's packing slip as the gift message, up to 200 characters.
- **Open:** making `account.heartside.io` the primary customer accounts domain waits on Krish's click in Settings, then Domains.
