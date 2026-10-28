# Claude CoWork: payments back on, the platforms brought in line, the 28 October fixes released, then five recorded mock orders

Status: ASSIGNMENT, not a result. Issued 28 October 2026, after the acceptance fixes merged to main (PR #65). Krish runs it in CoWork on his own computer and screen-records Part 3. He brings the recording, the photo logs and your report back to the Claude Code session, which judges every order for UX and quality and fixes what it finds. The earlier version of this file, the one that found these defects, is kept in [`../history/COWORK-PROMPT-2026-10-28.md`](../history/COWORK-PROMPT-2026-10-28.md). Do not run that one.

Work in four parts, in this order:

0. **Payments.** Make sure real buyers can pay. Do this first: the store cannot take money while Shopify Payments is off.
1. **Platforms.** Bring Teeinblue, n8n and Shopify admin in line with the merged code.
2. **The theme release.** Push to a copy, run the gates, test the photo fix on Krish's own phones, push live, then put the checkout pictures on and run the gates on production.
3. **Five mock orders.** Run them with test payments, with every edge case below. Then restore payments and clean up.

The new one-screen journey (Track B) is not part of this run. Its mock-ups go to Krish first.

## Before you start

Pull `main` of `krishanraja/heartside` to a local folder you can read, then read these in order:

1. [`../../NOW.md`](../../NOW.md)
2. [`../SCOPE.md`](../SCOPE.md)
3. [`../evidence/2026-10-28-acceptance-fixes.md`](../evidence/2026-10-28-acceptance-fixes.md), which explains what changed and why.

Anything under `docs/history/` is provenance only. Later live readback beats this file; recheck every fact in its own system.

You will need Node 20. Before Part 2, run this once:

```
cd tools/preview && npm ci && npx playwright install chromium
```

### What the store should do once Part 2 is live

- **Products and prices.**
  - Illustrated mug $45, inside black, dark blue, dark green, pink or red.
  - Portrait 12×18, $59 unframed or $119 framed in black, white or red oak.
  - Word-free 50×60 sherpa blanket $129.
  - The Artist's touch add-on is $29.
  - "Free US shipping on every order." The bundle is automatic: 15% off two gifts and 20% off three or more. It applies to gifts only, never the add-on.
- **Words.** Buddy hosts; the customer's dog has its own name. No exclamation marks and no em dashes anywhere a buyer can read.
- **First screen.** "Start with your dog" is in view on a 360×640 Android phone in Edge, above the gifts.
- **The chat.**
  - Next stays above the keyboard.
  - From 11 letters a name shows a count. Over 14, Next waits and offers one-tap short forms ("Sir Biscuit", "Biscuit").
  - A name typed all in capitals or all in lowercase comes back as Pickle, Jo-Anne, O'Malley.
  - The breed box suggests breeds as you type, and "Mixed or not sure" is always last.
  - A hyphenated name never splits across two lines.
  - With no pronoun tapped, the chat says "they".
  - Buddy never names a food, toy, object or place you did not mention.
  - "Not sure" never becomes a fact.
  - Typed answers show tidied: "!!" becomes a period, and the first letter is a capital.
  - The tone you pick carries to the gift.
- **Buddy's pick and choosing.**
  - Three tabs, each with its price, and "Buddy's pick" said once.
  - Mug color is asked only on the choose screen.
  - The bundle button shows the price after the saving.
  - When the gift is for "Me", the copy speaks to you and there is no ship-to choice.
  - The portrait opens on Unframed $59.
- **The photo, on the product page.**
  - Buddy's card button "Add <dog>'s photo" opens the phone's picker in the same tap.
  - Whatever happens to the photo is said under that button and right after the photo field. Possible outcomes:
    - accepted;
    - "This photo is too blurry…";
    - "This photo is too small…";
    - "This photo is saved as HEIC, which I can't paint from. Choose a JPEG of your dog instead.";
    - "I couldn't spot a dog…", with "It's my dog. Use this photo.";
    - "This photo took too long to get ready. Choose it again, or try a different photo.", after 20 seconds of getting the photo ready.
  - A second photo picked while the first one is still painting gets "I'm still painting <dog> from the photo you sent. It takes about a minute, sometimes two."
  - The check on the phone takes at most 10 seconds in all, the dog check included, then the photo goes on. The Photo log's `check:` line shows `ms` of about 10000 at most.
  - Uploads are at most 4096 px on the long side.
  - A photo already given to Buddy shows as one card: "Use <dog>'s photo" or "Use a different photo".
- **Painting and confirming.**
  - The painting card says "About a minute, sometimes two. When it's done, check the framing, then Save."
  - Teeinblue's crop dialog stays inside the screen.
  - Under the finished design is one tick: "Yes, this is <dog>. I checked every face, marking and paw, and the note and signature, and I want this design on my gift. I'm responsible for the photo and words I chose." The blanket's version leaves out the words. That one tick also ticks Teeinblue's own agreement box, which is hidden.
  - The portrait shows "Signed on the print: Love, <dog>" under its name field.
- **Adding to cart.**
  - Progress words show right after Add to cart: "Saving <dog>'s design.", then "Getting <dog>'s picture ready for checkout.", then "Almost there."
  - A blocked add says why in the same place.
  - One confirmation per add. The cart drawer opens once, already showing the finished cart, and lies over the page instead of pushing it.
  - Teeinblue's green "added to cart" line, its fixed Personalize bar and its Preview button do not show.
  - "Add to cart" is in sentence case.
- **Cart.**
  - Each Artist's touch line sits directly under its gift and shows that gift's design with a brush mark.
  - "Add our artist's touch, $29" adds it, then reads "Added. Remove".
  - A design is one unit: its plus is disabled.
  - The add-on says "Adds 5 days", and an uploaded photo shows as "View photo" with a thumbnail.
- **Redo.**
  - "Not quite right? Make another version." ends with "Your new version is in your cart. Choose which one to keep."
  - Both designs are then in the cart. The first is tagged "First version" and says "You made a new version of this gift. Keep the new one?" with "Remove this version". The new one is tagged "New version".
- **Debug log.** `?hsdebug=photo` on any product page turns on a "Photo log" panel at the bottom of the screen, with Copy, Clear and Hide. It lasts for that tab and survives the phone's picker and reloads. `?hsdebug=off` turns it off and clears it. It holds stage names and file facts only, never pixels.

## Rules for every part

- **Approval.** Each step marked **[approval]** needs Krish's explicit yes immediately before it, for that named action and target only.
  - Ask in one plain line naming the action, the target and how to undo it, then wait for the answer.
  - A yes never carries to the next step.
  - Everything not marked is read only and runs without asking.
- **The Teeinblue rule.**
  - Never press Update or Sync in Teeinblue without its own [approval], even when another step there was approved.
  - Back up the campaign privately before any change.
  - The live portrait product belongs to the campaign **"Heartside City Screenprint - DRAFT 2026-10-23"**. The campaign called "Your Dog's Portrait" points at a draft reference product and errors on Update; leave it alone.
  - After every Teeinblue change, read back the three product handles in Shopify admin (`your-dogs-illustrated-mug`, `your-dogs-portrait`, `your-dogs-personality-blanket`), then run `node tools/preview/handle-check.mjs --warn-media`.
    - It ends "all clear" with exit 0 when every handle, price and address is intact.
    - Until the checkout tiles go on in Part 2.5, it also prints `warn` lines for the blank variant pictures and the Artist's touch stand-in. Those are expected there.
    - Exit 1 and a `FAIL` line mean a handle, price or address broke.
  - On 28 October a campaign Update renamed two handles to the campaign title, with every sync flag off. If a handle changed, restore it in Shopify admin on [approval], run the check again, then stop and report.
- **Never, in any part:**
  - confirm, release or pay for a Printful order, or press a fulfillment control;
  - use a real card, or send a message to a customer or a vendor;
  - change anything not named here, or delete anything without its own approval.
- **Browser.** Use only the authorized browser session. Never open the system file picker. Attach photos with the browser tool's file upload on the page's file input. If the tool cannot attach a file, ask Krish to pick the named file himself while recording. On his own phones, Krish picks every file himself.
- **Test details.**
  - Names: synthetic only.
  - Email: `hello@krishraja.com` on every order and form, or `hello+mock1@krishraja.com` through `hello+mock5@krishraja.com` if checkout accepts the plus form. Never Krish's personal address.
  - Phone, where required: `212-555-0100`.
  - Never tick "Email me with news and offers", and do not use the Christmas reminder box.
- **Private data.**
  - **Keep out of the report:** the store handle, any theme id, Teeinblue campaign ids, Printful product ids, order numbers, admin URLs, n8n workflow addresses, the Drive link, Krish's personal email and anything a real customer entered.
  - **Files:** keep screenshots and files in a private local folder with neutral names (`mock-1-cart.png`).
  - **Real customers:** if you meet a real customer's order or data, stop looking at it and do not record it.
- **Paintings cost money.** Teeinblue paints once per accepted photo and once per redo, about $0.13 each.
  - Count every painting in your log as it starts.
  - Stop at the cap Krish agrees in Part 2.3. It covers Parts 2 and 3 together.
  - A refused photo (blurry, too small, HEIC) never paints. If one does, that is a defect: count it and report it.
- **Recording.** Krish screen-records Part 2.3 and Part 3. Pause about three seconds on each checkpoint screen named below, and write the clock time at each checkpoint into your log.

## Part 0: payments first

1. Read Shopify admin, Settings, Payments.
   - On 28 October Shopify Payments was switched off for the test orders, with the Bogus Gateway on, at about 09:13. The repository's record then said it was accepting payments. Record what is true now.
   - **Read only:** also read the three pre-existing $49 market price overrides on **The Heartside Sling**, by market name. Record them privately (market, price, currency). Part 3.2 checks them again.
2. **If Shopify Payments is off [approval]:**
   - Ask: "Switch Shopify Payments back on and the Bogus Gateway off now, so real buyers can pay. Undo: switch them back."
   - On yes, do it, then read back: accepting payments, test mode off.
   - Open a fresh checkout on heartside.io and go as far as the payment step, never paying. It should offer the real payment methods.
   - Read the three Sling prices again. If one is missing, report it. Restore it only on its own [approval], with the value you recorded.
3. If Payments is already on, record that and move to Part 1.

## Part 1: bring the platforms in line

### 1.1 Teeinblue: the stated-toy prompt **[approval, once per campaign]**

Apply [`tools/print-art/teeinblue/PROMPT-SPEC-2026-10-28.md`](../../tools/print-art/teeinblue/PROMPT-SPEC-2026-10-28.md) to the mug campaign, then the portrait campaign ("Heartside City Screenprint - DRAFT 2026-10-23"), then the blanket campaign. The new prompt makes a toy or accessory the buyer typed always appear. Order 1 on 28 October left out a green hedgehog.

For each campaign:

1. **Back up first.** Save the template privately and record the current prompt's SHA-256. It should be the 27 October value:
   - mug `acab45c96f2f3f72f945616ffd88b9f767688a75a44e2e9001b799c1fdab2562`
   - portrait `d115d2dd20217fb7b25be5ae0b487f6fc6f96b8454d28f74a48625c6057ab370`
   - blanket `ed13162b2e772adad6a6da86f6e66d60718feda50429954d8fb336cf4ee42b6e`

   If it is not, stop and report.
2. **Replace and validate.** Replace the photo effect's prompt with that campaign's block from the spec. Change no other effect setting and no field. Validate: zero errors and zero warnings.
3. **Read back the hash.** The saved prompt's SHA-256 must be:
   - mug `d34640f824d5889ff6cb6c35e800900507eb1c7cce92c50a5173952b11186625`
   - portrait `2b5225613b396749db687005ab6b1afdc6085a45a5a214e2b6fa85185f023bac`
   - blanket `a1af6a85c10734a90d8fcab2fec532f22ab3a6f6aba9bf78b870be3616d3e865`
4. **Check the handles.** Apply the Teeinblue rule: read back the three handles and run `handle-check.mjs`.
5. **Sync [approval].** Sync only on its own yes, with the catalog and image flags off, then read back the handles again.

Stop and report if the editor rejects or shortens a prompt. Never trim one to fit.

**Rollback:** restore the backed-up prompt, validate, and read back its 27 October hash.

The check that the toy now appears is order 1 in Part 3.

### 1.2 Teeinblue: the crop dialog **[approval, once per campaign]**

After every painting, Teeinblue's placement editor opens by itself. On 28 October it first showed blank, buyers sat on it for 19 to 30 seconds, and it left a ghost after Save.

1. In each of the three campaigns, read the photo editor setting: what it is called, and what is on.
2. Propose turning the editor off, in one line per campaign. If turning it off would also remove the buyer's way to fix a badly framed painting, say so. Then Krish chooses.
3. **[approval]** Change it, applying the Teeinblue rule.
4. **Readback:** the setting is saved, and the three handles are unchanged.

The code already says "check the framing, then Save" before the dialog opens, so leaving it on is safe.

### 1.3 n8n: publish Buddy's rebuilt rules **[approval, once per workflow]**

The merge rebuilt two workflows. The first is "Heartside: typed answer (Buddy AI)", and the second is "Heartside: compose gift lines (Buddy AI)". Each changes in three places, and nothing else changes:

| Node | New value, from the repository |
| --- | --- |
| Guard (`jsCode`) | `n8n/guard-typed.js` or `n8n/guard-compose.js`. It keeps "they" when no pronoun was tapped. |
| Enforce rules (`jsCode`) | `n8n/enforce-typed.js` or `n8n/enforce-compose.js`. It rejects invented foods, toys, objects and places, in Buddy's follow-up question too, and a dog called Biscuit grounds no biscuit. It drops "Not sure" chips, never prints "!", and for a gift for "Me" speaks to you, never by name. |
| The backup model node (`options.systemMessage`) | The `typed` or `compose` entry in `n8n/prompts.json` |

For each workflow:

1. Record the active version, so it can be restored.
2. **[approval]** Paste the three values and publish.
3. Read back the active Guard code, Enforce rules code and system message, and compare each one character for character with the files. Report "match" or the first difference.
4. **Rollback:** restore the recorded version.

Order 1's typed answer in Part 3 is the live check.

### 1.4 Shopify: checkout look and the thank-you line **[approval for each]**

1. **Checkout branding.** In Settings, Checkout, Customize, change these:
   - colors: background cream `#FBF6F1`, main buttons ink `#121010` with cream text, accents stamp red `#A8284E`;
   - typography: the closest serif Shopify offers for headings and the closest clean sans for body;
   - logo: the Heartside logo.

   Before and after, take a screenshot of the checkout at 390×844 and 1280×900. Change nothing else.
2. **The thank-you line.**
   - Today checkout says "Thank you, <name>!". On 28 October it thanked the recipient, because their name was on the shipping address.
   - In the checkout language editor, change the thank-you heading to exactly "Thank you. Your order is in."
   - **Readback:** an order in Part 3 shows it.
3. **Rollback:** both can be reset in the same screens.

### 1.5 Function Studio: kept through Christmas **[approval only if a control is needed]**

Ruling (Krish, 28 October): keep the checkout-merge app through Christmas at $69 a month, then review it in January against measured conversion.

1. Read the app's plan, when the trial ends and the next billing date, and confirm nothing will cancel it on 1 November.
2. If keeping it needs an action, such as accepting a charge, ask first.
3. Read and record the active rule's status, and how it sets the output quantity. The store keeps every design at one unit, so it is not changed.

### 1.6 Read only, for the record

- **For `catalog.mjs`.** Record these for the Claude Code session, which adds them to `tools/preview/catalog.mjs`:
  - **Blank file names:** the file name of each blank supplier base picture, as shown in Shopify's Files.
  - **Redirects:** every URL redirect in Online Store, Navigation, URL redirects whose source starts with `/products/`, as from and to.
- **Discounts.** Record:
  - the automatic bundle discount (15% for two gifts, 20% for three or more, gifts only);
  - the free shipping discount and the regions it covers (Alaska, Hawaii and Puerto Rico included or not);
  - any other active discount.
- **Products.** All ten variants at the prices above, available on the Online Store. The Artist's touch is active, $29, available, and needs shipping or not (record which).
- **Markets and shipping.** Which countries checkout can ship to. The store promises US shipping only.
- **Tax.** The regions where Shopify collects tax.
- **Printful.** Record each setting, against what is expected:
  - "Manually confirm imported orders": on;
  - automatic confirmation: off;
  - "Import personalized orders as drafts": on;
  - "Automatically import orders with synced products" and "Use product alternatives": as they are.
- **Shopify Inbox.** At 390×844, does its chat bubble cover Add to cart, a chip or Buddy's button? If it does, propose a fix and change it only on [approval].

Close Part 1 with a table of each item: done with readback, not run, or blocked (with the reason).

## Part 2: release the theme

### 2.1 Push to a copy **[approval]**

1. **Duplicate the theme.** In Shopify admin, Online Store, Themes, duplicate the live theme and name the copy "Heartside 28 Oct fixes". Keep its theme id private.
2. **Run the guarded push.** In GitHub, run the action "Push homepage to a Shopify theme" (Actions, then Run workflow) with:
   - `theme_id`: the copy's id;
   - `theme_name`: "Heartside 28 Oct fixes", exactly;
   - `allow_live_theme`: unticked;
   - every other switch at its default: `bundle_offer` keep, `artist_touch_product` empty, the other boxes unticked.
3. **Read the run.**
   - Before the push, the handle check passed and the backup artifact was saved.
   - After the push, the handle check read the copy.
   - Report the run's result line.

### 2.2 The gates on the copy (read only)

From `tools/preview`, run:

```
node preview-acceptance.mjs --theme <copy id>
node live-gate.mjs --query "preview_theme_id=<copy id>"
node handle-check.mjs --theme <copy id> --warn-media
```

The live gate includes Krish's Android Edge size, 360×640. Each command ends with exit 0 and "all clear". The handle check may also print `warn` lines for the blank variant pictures and the Artist's touch stand-in: those are fixed in 2.5, after the live push, and are expected here.

- **Exit 2** means Cloudflare challenged a page. That is inconclusive, never a pass: wait a few minutes and run it again, or run it from another network.
- **Exit 1** means a failure. Stop and report it. Do not push live.

### 2.3 Krish's own phones, on the copy (Krish records) **[approval: the painting cap]**

**Agree the cap first.** Ask: "Paint up to 14 times across Parts 2 and 3, about $1.80 at $0.13 each." The plan:

| Where | Paintings |
| --- | --- |
| Android in Edge | 2 |
| Android in Chrome | 1 |
| iPhone in Safari | 1 |
| Orders 1, 2, 3 and 5 | 1 each, 4 in all |
| Order 4 (three gifts and one redo) | 4 |
| Spare | 2 |

**Open the copy on each phone.** Krish opens the copy's preview link on his Android phone. Then he opens a product page with `?hsdebug=photo` added to the address, for example `/products/your-dogs-illustrated-mug?hsdebug=photo`.

**Android in Edge:**

1. Start from the home page and walk the chat with chips, naming the dog Mochi. Then choose the mug.
2. Tap "Add Mochi's photo" in Buddy's card.
   - **Checkpoint:** the phone's picker opens in that same tap, with no scroll first.
3. Pick `reject-blurry.jpg` from `docs/review/mock-order-photos/`, copied to the phone.
   - **Checkpoint:** the blurry message shows under the button and right after the photo field, and nothing paints.
4. Pick `large-camera-original.jpg` (6000×4489).
   - **Checkpoint:** it is accepted. The log shows the size it was sent at, at most 4096 px on its long side. Painting 1.
5. If the phone has a photo saved as HEIC, pick it.
   - **Checkpoint:** the HEIC message, and nothing paints. If there is none, say so.
6. A real photo of a dog from Krish's own camera roll. Painting 2.
7. In the Photo log, press Copy and paste the log into your notes.

**Android in Chrome:** repeat steps 1, 2 and 6, which is painting 3. Copy that log too.

**Teeinblue's chrome, on both Android browsers:** its fixed Personalize bar never covers the page, and the photo field, the style and tone, and Add to cart are all reachable.

**iPhone in Safari:** the chat, then the portrait, with `?hsdebug=photo` on the product page, then one real photo from Krish's camera roll. Painting 4.
- **Checkpoint:** the photo adds in one tap, the log reaches `vendor`, and the painting starts. Safari writes its own photos differently from Chrome, and this is the only test of it, so a refusal here is a defect even when the page says why. "I couldn't get this photo ready in this browser." is that defect.
- The portrait page opens on Unframed $59 when it comes from the chat.
- Copy the log.

**Report for each browser:**
- "adds in one tap", or what it said instead, and where;
- the log's stage names in order (`picker`, `change`, `check`, `prepare`, `vendor` and the rest);
- any stage that stalls.

A photo that is picked but never adds, with no message, is the 28 October defect. A real dog photo that is refused is a defect too. Either one blocks the live push.

### 2.4 Push live **[approval]**

Only when 2.2 is all clear, and in 2.3 a real photo added and painted on all three browsers (Android in Edge, Android in Chrome, iPhone in Safari), and every refused test photo said why under the button:

1. Run the same action with the live theme's id and exact name, and `allow_live_theme` ticked. Leave every other switch at its default.
2. Read the run's result line, then go straight on to 2.5.

**Rollback:** the run saved the live theme's templates as a backup artifact. Krish can also publish the previous theme from Online Store, Themes.

### 2.5 Checkout tiles and the Artist's touch picture **[approval, once per product]**

Do this right after the live push. Only the theme pushed in 2.4 hides the tiles from the product pages, so a tile attached earlier would show to buyers as a product photo.

Shopify draws each gift's component line at checkout with its variant's own picture. For some variants that picture is still the blank supplier base, so buyers see a blank white thumbnail under their design. The Artist's touch shows a pink heart as a stand-in: it is stored as `artists-touch.png`, with the alt text "Artist's touch by Heartside".

The tiles are in [`design/checkout-tiles/`](../../design/checkout-tiles/README.md), with the exact alt text for each. The live theme now hides any photo whose alt text says "checkout tile".

1. Run `node tools/preview/handle-check.mjs --warn-media`. Its `warn` lines name each variant that shows the blank base, by gift and variant title, for example `portrait "Framed / Black / 12″×18″"`. A gift with one variant shows as `blanket variant 1 of 1`. The Artist's touch line reads `still shows the heart stand-in picture`.
2. For each gift with a blank variant, on **[approval]**:
   - upload that gift's tile to the product, with its alt text exactly as in the README;
   - set it as the picture for only the variants the check named;
   - leave the product's first photo, and every other variant's photo, as they are. The mug's colors keep their own photos.
3. For the Artist's touch, on **[approval]**:
   - upload `artists-touch-tile.png` with its alt text;
   - make it the product's first picture;
   - keep the heart stand-in, moved to a later position, unless Krish says to remove it.
4. **Read back:**
   - in Shopify admin, the Artist's touch's first picture is the new tile, and each gift's blank variants show their gift's tile;
   - each product page on heartside.io shows no tile in its gallery, including after choosing each variant;
   - the tile on a component line at checkout is checked in order 1 of Part 3, which paints. Do not paint for it here.
5. **Rollback:** point the variants back at their previous picture, and the Artist's touch back at the heart.

### 2.6 The gates on production (read only)

1. On heartside.io, with no preview parameter, run the three commands from 2.2 without `--theme`, `--query` or `--warn-media`. Each ends "all clear", and the handle check prints no `warn` line.
2. In GitHub Actions, run "Storefront guard" once by hand. All clear, with no new issue.
   - Since the merge, the hourly guard will have opened one issue, "Storefront guard: a storefront check failed", about the blank pictures and the stand-in.
   - Once a run is all clear, Krish closes that issue.

If a gate fails here, stop and report. The rollback is in 2.4.

### 2.7 Christmas cut-off **[approval]**

1. On Printful's own site, find the published 2026 US holiday order cut-offs, with standard shipping, for:
   - the 11 oz mug;
   - the 12×18 poster, unframed and framed;
   - the 50×60 sherpa blanket.

   Report each date with its link.
2. If all are published, propose the earliest. On approval:
   - set it as "Last order date for Christmas" (YYYY-MM-DD) in the HS memo section of the live theme's editor, and save;
   - read the strip back on heartside.io. It counts down to that date.

   If any date is missing, leave the setting empty and say so.

Do this after 2.6, so the push and the editor change never cross.

## Part 3: five mock orders on heartside.io (Krish records)

### 3.0 Set up

1. **Choose the test route.** Read Teeinblue's current help pages, "How to make a test order" and the pricing FAQ.
   - Use only the route they say is not billed, and quote that line in the report.
   - On 26 October that was Shopify's Bogus Gateway, which means switching Shopify Payments off for the window.
2. **Open the test window [approval].**
   - Ask: "Switch checkout to test payments (Bogus Gateway) for about 90 minutes for five mock orders, then switch back. Real buyers cannot pay during the window."
   - On yes, switch it, and read back that checkout offers only the test method.
   - Note the start time. Any order placed during the window that you did not place goes to Krish at once.
3. **Before each order,** say in one line which order is next and how many paintings it uses, and wait for Krish's go.
4. **Before you pay,** check the card is the test method's success card.

**Bogus Gateway cards:**

| Field | Value |
| --- | --- |
| Name on card | `Bogus Gateway` |
| Number for a successful payment | `1` |
| Number for a declined payment | `2` |
| Expiry | any future date |
| Security code | any three digits |

**Photos.**
- The dog photos are stock photos in `assets/photos/`.
- The test photos are in [`mock-order-photos/`](mock-order-photos/README.md): `reject-blurry.jpg`, `reject-too-small.jpg`, `large-camera-original.jpg` and `close-up.jpg`.

**Addresses.** Use public buildings, never a person's home:

- New York: 350 5th Ave, New York, NY 10118
- Anchorage: 632 W 6th Ave, Anchorage, AK 99501
- Honolulu: 530 S King St, Honolulu, HI 96813
- San Juan: 153 Calle San Francisco, San Juan, PR 00901
- Toronto, to test the block: 100 Queen St W, Toronto, ON M5H 2N2, Canada
- Chicago: 121 N LaSalle St, Chicago, IL 60602

### The five orders

| # | Gift | Where | Dog (photo) | Style, tone | Ship to | Paintings |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sherpa blanket | 390×844 | Honey, Golden Retriever, she (`golden-puppy-asleep.jpg`) | Cut-paper collage, Sentimental | New York | 1 |
| 2 | Portrait, framed red oak | 1280×900, a direct visit | Bo O'Malley, Pug, he (`pug-autumn-leaves.jpg`) | Comic book, Hilarious | Anchorage | 1 |
| 3 | Mug, dark green inside, plus the Artist's touch | 390×844 | RUBY, typed in capitals, Poodle (typed "toy poodle"), no pronoun tapped (`red-poodle-head-tilt.jpg`) | Painterly, Warm with a wink | Honolulu | 1 |
| 4 | Mug (red inside), unframed portrait and blanket, plus one redo | 1280×900 | Pickle, Cavapoo, he (`apricot-poodle-puppy.jpg`) | Vintage screenprint, Hilarious | San Juan, else Chicago | 4 |
| 5 | Mug, pink inside | Krish's Android phone in Edge, with `?hsdebug=photo` | Mochi, Maltipoo, she (bad photos first, then `maltipoo-on-deck.jpg`) | Fine ink drawing, Sentimental | Toronto, then Chicago | 1 |

**Order 1: a typed answer, the stated toy and one tick.**

- **Chat.** Start on the home page with a clean session. Use chips everywhere except the home question, where you type: "she waits by the door!! every single day". The recipient is a partner, "Sam". Then press "Show me".
  - If Buddy asks a follow-up, it names only the door, never a car or a toy.
  - **Checkpoint: the note,** on Buddy's pick screen, on the mug or portrait tab. While Buddy writes, the note says "Buddy is writing your note…". If the line changes after you have read it, the note says it changed. "What I'll paint" shows the typed words tidied: "Waits by the door. Every single day."
  - Tap the Blanket tab. Set its "Artwork tone" slider to Sentimental.
  - Press "Choose Honey's gifts", leave only the blanket selected, then press the Personalize button, which names the blanket and $129.
- **Product page.**
  - Buddy's card shows "Sentimental", the tone you chose.
  - Favorite toy: "Green squeaky hedgehog". Collar or accessory: "Red plaid bandana".
  - Upload the photo.
  - **Checkpoint: painting card.** The note reads "About a minute, sometimes two…".
  - **Checkpoint: reveal.** The design appears, with the one tick under it.
  - Click Add to cart before ticking. The reason shows right after Add to cart, and the page scrolls to the tick. Tick it, then add.
  - **Checkpoint:** the progress words appear, the drawer opens once on the finished cart, and no green Teeinblue line shows.
- **Cart and checkout.**
  - The picture stays the design. The total is $129 with free shipping, and the tile is on the component line.
  - Pay with card `1`.
  - **Checkpoint: thank-you page.** "Thank you. Your order is in."

**Order 2: a direct visit, a long name with an apostrophe, a note with an ampersand, and a declined card.**

- **Product page.**
  - In a fresh private window, go straight to `/products/your-dogs-portrait`. Buddy's offer shows, with no earlier names and no flash of another card.
  - Choose Framed, then red oak. The price is $119.
  - Type "Sir Biscuit O'Malley" into the dog's name field.
    - **Checkpoint: a long name.** The field stops at 14 characters, "Sir Biscuit O'". Under it: "Signed on the print: Love, Sir Biscuit O'" and "That's the most that fits. Up to 14 fit in the signature."
  - Clear the field and type "Bo O'Malley".
    - **Checkpoint:** the line under it reads "Signed on the print: Love, Bo O'Malley".
  - In the note field, type "For Pat & Jo, who saved me the good chair". Style Comic book, tone Hilarious.
  - Upload the photo, check the painting and the tick, then add.
  - Every place the names show (preview, cart, checkout, order) shows `Bo O'Malley` and `&`, never `&#39;` or `&amp;`.
- **Checkout.**
  - Pay with card `2`. The decline message is plain, and no order is placed.
  - Then pay with card `1`.
  - Record whether free shipping applied to Alaska.

**Order 3: capitals, no pronoun, "Me", and the Artist's touch.**

- **Chat.**
  - Dog's name "RUBY". The chat calls her Ruby.
  - Type "toy poodle" into the breed box. It offers "Poodle", the corpus name for toy poodles, with "Mixed or not sure" last. Pick Poodle.
  - Tap no pronoun. The chat says "they".
  - Choose "Me" as the recipient. The label reads "Your first name"; enter "Alex". The copy speaks to you, Buddy's reason and follow-up included, and never calls you Alex.
  - On three steps, press Back, then Forward, then reload. Nothing is erased, and no paid call repeats.
  - Choose the mug, dark green. The choose screen has no ship-to choice.
- **Product page.**
  - Favorite toy: "Blue rope ball".
  - Press "Add our artist's touch, $29". It reads "Added. Remove". Press Remove, then add it again.
  - Write: "Paint her dark brown collar, and her ears as fluffy as photo 1". Photo 1 is `mock-order-photos/close-up.jpg`, tagged "Another photo of my dog".
  - Upload the main photo, tick, and add.
    - **Checkpoint:** "Sending your photos to our artist." shows beside Add to cart while the photo uploads. Tap Add to cart once more: it says "One moment. Adding our artist's touch." and adds nothing twice.
- **Cart.**
  - The Artist's touch line sits under the mug, showing the mug's design with a brush mark.
  - It says "Adds 5 days" and "View photo" with a thumbnail, and its plus is disabled.
  - No bundle saving applies.
- **Checkout.** $74 in total, free shipping to Hawaii. Pay with card `1`.

**Order 4: three gifts from one chat, the bundle, and a redo that keeps both designs.**

- **Chat.**
  - One chat for a Cavapoo, he. The recipient is a friend, "Jo-anne".
  - For the dog's name, type "Pickle Fitzgerald" first.
    - **Checkpoint: a long name in the chat.** From 11 letters a count shows under the box. At 17 letters, Next waits and the hint reads `"Pickle Fitzgerald" is 17 letters. 14 fit in "Love, …" on the gift.`, with a "Pickle" chip. Tap it. The dog is Pickle from here on.
  - The name Jo-anne never splits across lines, in the heading, Buddy's bubble or the chips.
  - A Cavapoo is a cross whose parents do not match, so the hidden Energy field reads `none`. Read it in the browser's developer tools on the product page.
  - Pick all three gifts. The button shows the price after the saving.
- **Make the three gifts** from the product pages, in the order the app sends you, using the "Next" bar after each add: the mug (red inside), then the blanket, then the portrait, which opens on Unframed $59.
  - **Checkpoint:** after two gifts, the cart takes 15% off: $45 + $129 = $174, less $26.10, so $147.90.
  - **Checkpoint:** after three, it takes 20% off: $233, less $46.60, so $186.40.
  - Each add shows one confirmation, and "All 3 gifts are in your cart" appears only after the third add.
- **Redo the mug.**
  - In the cart, use "Not quite right? Make another version." on the mug and make a new version.
  - **Checkpoint:** "Your new version is in your cart. Choose which one to keep." The cart then holds both mug designs. The first is tagged "First version" and says "You made a new version of this gift. Keep the new one?", and the new one is tagged "New version".
  - Press "Remove this version" on the first.
  - **Checkpoint: cart.** Three gifts, each at one unit, with 20% applied ($186.40 again) and every picture steady.
- **Checkout.**
  - Ship to San Juan. If Puerto Rico cannot be shipped to, or is charged for shipping, record exactly what checkout says, then use Chicago.
  - The thank-you line names no one.
  - Pay with card `1`.

**Order 5: Krish's Android phone, bad photos, leaving mid-paint, raising quantity and a foreign address.**

Krish runs this on his Android phone in Edge, on heartside.io, with `?hsdebug=photo` on the product page. He picks every file himself.

- **Bad photos.**
  - `reject-blurry.jpg`: the blurry message under the button, and nothing paints.
  - `reject-too-small.jpg`: "This photo is too small for me to draw from…", and nothing paints.
  - A HEIC from the phone, if there is one.
  - Then `maltipoo-on-deck.jpg`.
- **Leaving mid-paint.** While it paints, press Back, then Forward, then reload. The painting card resumes without starting over, and no second painting starts. Count it if one does.
- **Quantity.** In the cart, try to raise the design to 2. The plus is disabled, and the quantity stays at 1.
- **Checkout.**
  - Enter the Toronto address and record exactly what checkout says. Expected: a clear refusal, because the store ships to the US only.
  - Change it to Chicago and pay with card `1`.
- **Photo log.** Copy the log for the report.

### 3.1 After each order, read back (read only)

- **Shopify order.**
  - Marked test, with the right variant at the right price, and the bundle and free shipping as expected.
  - Line properties: the dog's name escaped correctly, style, tone and photo, plus `_hs_answers` and the ship-to choice.
  - No visible "Tone direction", "Style direction" or "Energy" property in the cart, checkout or order email.
  - The order's picture is the design.
- **Teeinblue.**
  - The order reads Ready, with the design complete and no error.
  - Open the production file privately and check:
    - **Words.** The mug and portrait carry the exact note and signature. The blanket has no words.
    - **Style.** The style is the one chosen.
    - **Tone.** It reads at a glance: tender for Sentimental, a light wink for Warm, a clear comic premise for Hilarious.
    - **Likeness.** The dog looks like the photo.
    - **Toy and collar.** Order 1 shows a green hedgehog in at least two motifs, and a red plaid bandana. Order 3 shows a blue rope ball.
  - Save the design preview privately as `mock-<n>-design.png`.
- **Printful.** The order is a draft or was not imported, never confirmed. A draft's variant matches the order: the mug's inside color, the frame, the blanket size.

### 3.2 Restore payments **[approval]**

1. Ask, then switch Shopify Payments back on and the Bogus Gateway off.
2. Read back:
   - accepting payments, with test mode off;
   - the three $49 market prices on The Heartside Sling, exactly as recorded in Part 0. Restore a missing one only on its own [approval], with the recorded value;
   - a fresh checkout on heartside.io offering the real payment methods, going only as far as the payment step.
3. Report the window's end time. List every order placed during it by count only, and how many were yours.

### 3.3 Clean up **[approval, separately for each system]**

- **Shopify.** Cancel the four orders marked test on 28 October and the five from this run, with no customer notification. Read back canceled.
- **Printful.** Delete any draft those orders created, never confirming one. Read back gone.
- **Teeinblue.** Archive or cancel those orders if it has a control for it. Otherwise leave them and say so.

## The report

Write it for the Claude Code session, with nothing from the private list.

1. **Part 0.** The payment state as found, what changed, and the readbacks. The Sling prices go in as "three present at $49", or what differed.
2. **Part 1.** The table, plus:
   - the three new prompt hashes as read back;
   - the n8n comparison result for each workflow;
   - the blank file names and the product redirects, for `catalog.mjs`;
   - the Function Studio dates;
   - the Christmas dates with links.
3. **Part 2.**
   - The push runs' result lines.
   - The three gates on the copy and on production, each all clear or the failing lines.
   - The checkout tiles and the Artist's touch picture: what was attached to which variant, and the readback.
   - For each phone browser: "adds in one tap" or what happened, and the photo log.
   - The storefront guard's run.
4. **Part 3, for each order.**
   - Start and checkpoint times, and what was expected against what was seen at each checkpoint.
   - Totals: items, discount, shipping, tax and total.
   - The production-file checks.
   - Every defect, with what a buyer would feel, and whether it blocks.
5. **Counts.** Paintings used against the cap, note calls, orders placed, and the restore and clean-up readbacks.
6. **Close** with **ready to sell**, **hold for the listed defects**, or **insufficient evidence at the named boundary**. Say separately that physical print quality still waits for Krish's own sample order.

Krish names the recordings `phones-copy` and `mock-1` to `mock-5` (or one file, with the times from your log) and brings them back with this report.
