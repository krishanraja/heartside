# Claude CoWork: release the artwork-only gifts, the free digital card and the printed card

Status: ASSIGNMENT, not a result. Written 31 October 2026 for Krish to run in CoWork on his own computer. Work only from `main` of `krishanraja/heartside`. The plan is `docs/review/LAUNCH-READY-2026-10-31.md`.

## Why this exists, in Krish's terms

Krish ruled on 31 October that the mug and the portrait print the painting only. The dog's note now reaches the recipient three ways:
- on the packing slip in every box;
- on a free digital card linked from the order email;
- on an optional $12 printed Christmas card, until 3 December.

The theme and both n8n workflows are built and tested. This run makes the store match: the Teeinblue designs lose their words, the mug painter puts the dog at the front, and the card page, the email link and the card product go live. After it, Krish orders a mug and a blanket with the note as a real customer.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027.

## Rules that hold for the whole run

- Stop and ask Krish, in this chat, before each step marked **STOP**. A yes covers that one step only.
- For every change, record before and after with a screenshot, so Krish can put it back. After every change, read it back from the system you changed.
- Never put a credential, the store handle, a theme id, a Teeinblue campaign id, a Printful id, an order number, a customer's name or address, or Krish's personal email in the report or in any file you save. Use hello@krishraja.com where a contact is needed.
- **No orders.** Never place, pay for, confirm or cancel an order. Never touch Printful or n8n in this run.
- **Teeinblue Update: untick every sync box first**, including all four Variants sub-boxes. After any Teeinblue save:
  - read back the blanket on the storefront: title "Your Dog's Personality Blanket", price $129;
  - run `node tools/preview/handle-check.mjs --warn-media`.

  If anything is wrong, stop and tell Krish.
- The portrait campaign holds an old $39 price while the live portrait is $59 to $119: never Update it with Variants or Price ticked.

## Before you start

Pull `main`. Read `NOW.md` and this file. Run once: `cd tools/preview && npm ci && npx playwright install chromium`.

Check that Shopify admin, Online Store, Themes lists an unpublished theme named **"Heartside 31 Oct showcase"**. If it is missing, stop and tell Krish.

## Steps

1. **STOP: Krish publishes the theme.**
   - In Shopify admin, Online Store, Themes, Krish publishes "Heartside 31 Oct showcase" himself. The current live theme stays in the library as the way back.
   - Read back with `node tools/preview/live-gate.mjs` (all clear) and `handle-check --warn-media` (all clear).
   - On a phone-sized window, the mug page says "We paint them on this mug, and write a note in their voice that comes in the box."
   - The theme already works with the note layers still in place, so the next steps can follow at a normal pace.

2. **STOP: the mug design loses its words, and the dog moves to the front.** In Teeinblue, open the mug campaign.
   1. Report, word for word, the instructions the mug's painting (AI) layer is given, wherever Teeinblue shows them. Mark any words that keep part of the picture clear for text or place the dog to one side.
   2. Show Krish this change and ask: "Paint the scene across the whole mug. Place the dog at the front, about a fifth of the way in from the left edge of the image, which faces you when the handle is on the left. No empty space is kept for text." Use Krish's wording if he changes it.
   3. After his yes, make that change. Then remove the note layer ("Your note" or "Line 4") and the signature layer ("Signed"). Change no other layer.
   4. Update with every sync box unticked. Read back:
      - the live mug page's title, the price $45 and its five colours;
      - with the theme's `hs2.js` blocked, the mug personaliser shows no note or signature field;
      - one test painting with a test photo of a dog shows the dog toward the front. This uses one Teeinblue painting credit. Screenshot it, and do not add it to the cart.

3. **STOP: the portrait design loses its words.**
   1. In the portrait campaign, remove these, and change no other layer:
      - the note layer;
      - the signature layer that prints "Love, " and the dog's name;
      - the "Dog's name" field, which only feeds that signature.
   2. Update with every sync box unticked. **If the Update fails with "Handle 'your-dogs-portrait' already in use",** undo nothing, stop, and tell Krish. `docs/review/COWORK-PORTRAIT-LINK.md` fixes that first.
   3. Read back:
      - the live portrait's title, handle `your-dogs-portrait`, ACTIVE status and prices ($119 framed, $59 unframed);
      - the personaliser has no note, signature or name field;
      - Bear is still the default picture.

4. **The blanket:** no change. Read back only: title and $129.

5. **STOP: the card page.**
   1. In Shopify admin, Online Store, Pages, add a page:
      - title "A card from your dog";
      - handle `card`;
      - template `page.card`;
      - content empty;
      - visible.
   2. Read back: `https://heartside.io/pages/card` opens and says "This card link is incomplete. Open it from your order email." That is right with no card in the link.

6. **STOP: the free digital card in the order email.**
   1. In Shopify admin, Settings, Notifications, Customer notifications, Order confirmation, edit the email code.
   2. Paste the whole of `shopify/notifications/order-confirmation-digital-card.liquid` from `main`, right after the block that lists the order's items. Change nothing else.
   3. Save, then use "Preview" and "Send test email" to hello@krishraja.com. The test uses Shopify's sample order, which has no painting, so the card block should not appear and nothing else may change.
   4. Screenshot the before and after code around the paste. The real proof is Krish's live order: its email must show "Open the card", and the link must open his card.

7. **STOP: the printed card goes on sale.**
   1. In Shopify admin, Products, "A Christmas card from your dog" (`christmas-card-from-your-dog`, $12, now DRAFT): set it Active and available on the Online Store.
   2. In the theme editor for the published theme, open the memo bar section ("HS memo bar") and set "Printed Christmas card add-on" to that product. Save.
   3. Read back on a phone-sized window:
      - each gift page shows "Add a printed Christmas card, $12";
      - in the cart, under a gift, "Add a printed Christmas card, $12" appears;
      - nothing else on the page moved.

8. **STOP: the product descriptions.** Show Krish these three and ask. After his yes, set each product's description to exactly:
   - **Your Dog's Illustrated Mug:**

     > Your dog, painted from your photo, all the way around an 11 oz ceramic mug. Add a clear photo, choose a style and check the design before you order. Your note, in your dog's voice, comes in the box and on a free digital card.
     >
     > - 11 oz ceramic mug
     > - Colored rim, handle and inside
     > - Choose Black, Dark Blue, Dark Green, Pink or Red
     > - 3.79 inches high and 3.25 inches in diameter
     > - Made to order

   - **Your Dog's Portrait:**

     > Your dog's portrait, painted from your photo. Add a clear photo, choose a style and check the design before you order. Your note, in your dog's voice, comes in the box and on a free digital card. A city is optional.
     >
     > - 12 × 18 inch print on 189 gsm matte paper
     > - Choose unframed or a Black, White or Red Oak frame
     > - Framed options have an acrylic front and hanging hardware
     > - Unframed option does not include a frame
     > - Made to order

   - **Your Dog's Personality Blanket:**

     > Some dogs have a spot on the couch. This one gets a whole blanket, painted from your photo. Your note, in your dog's voice, comes in the box and on a free digital card. One tan sherpa blanket, 50 x 60 inches. The printed side is smooth and the reverse is soft sherpa. Made to order for US delivery.

   Read back each page's description on the storefront.

9. **Final readback (no changes):** `live-gate` and `handle-check --warn-media` all clear; the blanket at $129.

## Report

Return:
- each step's before and after, with screenshots;
- the mug painter's instructions before and after, word for word;
- the test painting;
- the test email;
- the readbacks;
- anything you skipped and why.

Say plainly which things are verified by readback and which are not.

Krish brings the report back to the Claude Code session. That session then runs both n8n workflows once against the live store, sets their `dryRun` to false and switches them on, and Krish places his order.
