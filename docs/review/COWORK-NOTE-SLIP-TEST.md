# Claude CoWork: prove the dog's note can ride inside every box

Status: ASSIGNMENT, not a result. Written 31 October 2026 for Krish to run in CoWork on his own computer. It follows the two discovery reports (`cowork-gift-note-discovery-report-2026-10-31.md` and its Part 2). Work only from `main` of `krishanraja/heartside`.

## Why this exists, in Krish's terms

Printful ships each gift (mug, portrait, blanket) in its own parcel, and no card can share a parcel with them. On 31 October Krish chose:

- **The note inside every box.** The dog's note prints on Printful's packing slip, which travels inside each gift's own parcel. It is free, and nobody packs anything.
- **The add-on is digital.** The paid add-on becomes a designed digital card. The Claude Code session builds that separately; nothing in this run touches it.
- **A set is a planned arrival.** A set arrives as several gifts, each in its own box, and each box carries the note.

Before anything is built, three things must be proved on the live platforms. Krish has said yes to exactly these three, and nothing more:

1. One ticket to a human at Printful.
2. Switching off Printful's backup facilities.
3. One real test order of all three gifts.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027. A gift that arrives feeling deliberate protects the prices that number depends on.

## Rules that hold for the whole run

- Do only the three approved actions below. Change no other setting, product, campaign or theme.
- Never put a credential, the store handle, a theme id, a Teeinblue campaign id, a Printful id, an order number, a customer's name or address, or Krish's personal email in the report or in any file you save to the repository. Use hello@krishraja.com where a contact is needed.
- **Never enter a card number yourself.** Krish pays for the test order himself (step 3).
- Stop and ask Krish, in this chat, before each step marked **STOP**. A yes covers that one step only.
- Record what you change: for the setting in step 2, note before and after with screenshots, so Krish can put it back.
- **Teeinblue Update rule** (only relevant if you open a campaign, which you should not need to): untick every sync box first, then read back the blanket's title and the $129 price.

## Before you start

Pull `main`. Read `NOW.md` and the two discovery reports. Run once: `cd tools/preview && npm ci && npx playwright install chromium`.

## Steps

1. **A human ticket to Printful (free).** Open a support ticket or email to a person, not the Sparky assistant, as Heartside. Ask exactly this:

   > "Our Shopify store is connected to Printful, and orders also come through Teeinblue. Orders import as drafts and we confirm them manually. (1) If we add a personalized gift message to an order (in the dashboard, or through the API `gift` field) and the order splits into several parcels, does the gift message print on the packing slip in every parcel, or only one? (2) Is there a character limit? (3) Can a Shopify order note or a line-item property reach the packing slip automatically, without the API? (4) Is there any way, at any plan level or price, for a mug, a 12x18 framed poster and a 50x60 sherpa blanket in one order to arrive in one parcel?"

   Record the time sent. Report the answer when it comes, word for word; it may arrive after this run.

2. **STOP: switch off backup facilities.**
   - Show Krish the setting: Printful, Settings, Orders, the Heartside store, "Fulfill my orders at a backup facility", currently ON. Ask for his yes.
   - After yes, switch it OFF and save. Read it back, and take a before and after screenshot.
   - Change nothing else on that page. "Manually confirm imported orders" and "Import personalized orders as drafts" stay ON.

3. **STOP: the test order.**
   - **Krish places it himself**, on his phone, through the live store as a buyer would:
     - make one mug, one portrait (framed is best, since that's the slowest parcel) and one blanket through "Make one for my dog", with a test photo of a dog;
     - pay with his own card, shipping to an address he can receive at.
   - Write down the clock time of each step, and anything that went wrong at checkout. Shopify warned of checkout errors from 29 October; this order is the live check.
   - Then, in Printful, find the imported draft order (or orders). Before confirming:
     - open each draft and use "Include a personalized message" (the gift message);
     - enter this exact text, so it can be recognised on the slip:

       > "A note from Maple: I picked this one myself. Thank you for every walk. Love, Maple (test order, 31 Oct)"

     - read back that the message is saved on every draft that will ship.
   - **STOP: ask Krish before pressing Confirm**, showing the total Printful will charge. After his yes, confirm each draft.
   - Report:
     - how many Printful orders and parcels Printful shows, and their facilities if shown;
     - the tracking numbers' carriers only, never the numbers;
     - whether the gift message shows on each order's packing-slip preview, if Printful offers one.
4. **When the parcels arrive** (Krish, later): photograph each packing slip and the outside of each box. Note the arrival date of each parcel, and whether every slip carries the note. Bring the photos back to the Claude Code session.

## Report

Return:
- the ticket question and the time it was sent;
- step 2's before and after, with screenshots;
- step 3: each clock time, the checkout result, the Printful orders and parcels, whether the message was saved on each, and what Printful charged;
- anything you skipped and why.

Say plainly which things are verified by readback and which are not. Leave step 4 open until the parcels arrive.

Krish brings the report back to the Claude Code session, which builds the automatic slip message and the digital card once the test shows the slip route works.
