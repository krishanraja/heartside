# v3 launch: Cowork report for Claude Code (14 Oct 2026)

## Part A: the four gifts

All four are DONE. Each is Draft on Shopify, with template `gift`, Krish's approved description, tag `gifts-v3`, vendor Heartside, and every variant in the General profile. None is on the Online Store.

| Title | Handle | Price | Teeinblue campaign | Shopify product id |
|---|---|---|---|---|
| The Morning Mug | `the-morning-mug` | $29 (Pink / 11 oz) | 1043122 | 16132766630270 |
| The Couch Blanket | `the-couch-blanket` | $89 (Tan / 50x60) | 1043153 | 16132987552126 |
| The Framed Print | `the-framed-print` | $89 (12x18; Black, Red Oak, White) | 1043167 | 16132988535166 |
| The Tree Ornament | `the-tree-ornament` | $24 (Circle) | 1043174 | 16132989059454 |

- **Launch publishes.** Teeinblue has no publish-as-draft option, so Launch creates the Shopify product as Active on the Online Store. Each was set to Draft straight after:
  - Mug: live about one minute (created 11:06:52 UTC)
  - Blanket: 22 s (13:01:20 to 13:01:42)
  - Print: 13 s (13:02:03 to 13:02:16)
  - Ornament: 25 s (13:02:43 to 13:03:08)
- **To publish on Sunday:** set the four to Active. Remember that Teeinblue's Update pushes Description, Images, Title and Tags unless all four are unticked.
- **Variant titles** carry Printful's base names, e.g. "Sublimated Sherpa Blanket / Tan / 50″×60″". This is cosmetic, but visible if the theme prints the variant title in the cart.
- **Field labels, exactly as Teeinblue shows them, in form order:**
  - Mug: `Line 1`, `Line 2`, `Line 3`, `Signed`, `Your dog's photo`
  - Blanket and Print: `Line 1`, `Signed`, `Your dog's photo`, `Dog's name`, `Line 2`, `Line 3`, `Line 4`
  - Ornament: `Line 1`, `Signed`, `Your dog's photo`, `Dog's name`
  - The photo field is titled "Your dog's photo", not "Photo". hs2.js finds the photo by `.tee-field--photo`, not by label, and that title matches none of the TIB_RULES regexes, so the bridge isn't affected.
  - Blanket, Print and Ornament forms are out of spec order. Teeinblue's drag-to-reorder didn't respond to automation. The bridge fills by label, so it still works; the order only affects how the form looks. Krish can drag them in the artwork editor.
  - Every field is required. Limits: lines 45, Signed 20, Dog's name 14.
- **Type:** Courier Prime for the lines, Fraunces SemiBold for the name, Fraunces Italic #8A4A2B for Signed. The two Fraunces fonts are static instances (opsz 48, wght 650 and 420) uploaded as HS-Fraunces-SemiBold and HS-Fraunces-Italic. The name is in normal case, not uppercase.
- **Ornament:** circle only. Printful #900 prints the same design on both sides, so there is one face: photo, name, Line 1, Signed, paw. The heart is offered by Printful but was left out for launch.
- **Fit test: 8 of 8 pass.** These are Teeinblue "Generate test design" files at full print size, made with the longest and shortest cases. For the 4-line gifts the short case used "Yours, always." on every line, because all lines are required. Nothing clips; the 45-character line wraps cleanly on the mug and the ornament. The files are in `heartside-print-tests/` in the session outputs:
  - Mug: `mug-long.png`, `mug-short.png` (2700x1050)
  - Blanket: `blanket-long.png`, `blanket-short.png` (15900x18900)
  - Print: `print-long.png`, `print-short.png` (3600x5400)
  - Ornament: `ornament-long.png`, `ornament-short.png` (954x954)
  - `fit-test-contact-sheet.jpg`
- **Shipping:** there is no separate free profile. Free US shipping is the automatic discount "Free shipping" (US only, combines with product discounts), and its end date is now removed. All four products sit in the General profile.
- **Mockups** are my own illustrations: a pink mug and a sherpa blanket. The framed print uses the base's frame photos; I added a print area to the hand-held frame photo. Images per product: mug 1, blanket 1, print 4, ornament 2.

## Part B: AI stability

- **Gemini:** the Heartside key sits in Krish's "Default Gemini Project" in Google AI Studio, on paid **Tier 3** (key and project id left out of this public repo). Limits for gemini-3.1-flash-lite: 30K RPM, 30M TPM, unlimited RPD. Price: $0.25 per million input tokens and $1.50 per million output tokens.
- **Billing and budget:** billing is already on. Krish is setting the budget himself, so I created none. The existing $100 "Gemini Budget Alert" covers only the Mindmaker AI project, not this one. Project spend this month is $11.42; the heartside key accounts for about $0.01 of it.
- **Key restriction:** already restricted to the Gemini API. No change made.
- **n8n:**
  - Typed-answer workflow `ryyzdxv8SBm5HTjP`: the last 20 runs (#46244 to #46301) all succeeded, from 41 ms (warm-up) to 4.745 s (a test run), median about 1.2 s.
  - Compose workflow `28WZgPmgTaY33KY3`: all 5 runs succeeded, in 1.1 to 1.72 s.
  - In today's chat test, both typed answers came back with a fitting follow-up within the 5 s I waited.

## Part C: $19 ornament

DONE, on Krish's yes. The discount is `gid://shopify/DiscountAutomaticNode/2438364365182`. Its exact settings:

- Automatic Buy X get Y, titled "Ornament with another gift", for all customers
- Customer buys: at least 1 of The Morning Mug, The Couch Blanket or The Framed Print (any variant)
- Customer gets: 1 The Tree Ornament at $5.00 off ($24 to $19)
- Uses per order: 1
- Starts 2026-10-14 13:10 UTC, no end date
- Combines with shipping discounts only, not other product or order discounts

**Test.** The products are still drafts, so a storefront cart can't hold them. I used Shopify's `draftOrderCalculate`, which prices a cart without creating anything. Afterwards I checked: no draft orders exist, and no new orders.

| Cart | Result |
|---|---|
| Mug + Ornament | Ornament $19 (discount line-level $5) |
| Ornament alone | $24, no discount |
| Mug + 2 Ornaments | $43 for the two (one at $19, one at $24) |
| Blanket + Ornament, US address, Standard shipping | Ornament $19, and shipping goes from $5.99 to $0 via "Free shipping". Both stack; total discount $10.99. |

On Sunday, re-test with a real cart once the products are Active, and empty the cart afterwards.

## Part D: privacy policy

DONE, on Krish's yes. The privacy policy's "Use automated policy" is now off, so Shopify no longer auto-updates that one policy. Turning it back on would drop this paragraph. The paragraph sits right after the "Personal Information We Collect or Process" list, and "Last updated" reads October 14, 2026. I checked the public policy page against the original text: only the date and this paragraph changed. Final wording:

> **Answers you type to Biscuit.** When you type your own answer in the chat on our site, we send that text, your dog's first name and the first name of the person the gift is for to Google's Gemini AI service, through our automation provider n8n, to write the words for your gift. We don't send your email, address or payment details. Answers you pick from the buttons aren't sent anywhere. The words you choose are saved with your order so a person can check it before it prints.

## Part E: checks

**Christmas.** All four ship from US facilities. Printful's 2026 cutoff for US-made home goods is Dec 11 (standard) and Dec 16 (express). The site's "Order by Dec 10" is safe.

**Costs (Printful base + US first-item shipping):**

| Gift | Cost | vs spec |
|---|---|---|
| Mug | $8.11 + $6.69 = $14.80 | matches |
| Blanket | $35.76 + $13.99 = $49.75 | matches |
| Framed print | $32.77 + $10.89 = $43.66 | spec assumed $14.49 shipping (medium rate); printful.com/shipping lists the 12x18 under the $10.89 small framed rate |
| Ornament | $7.73 + $5.89 = $13.62, +$0.70 each extra | matches |

Teeinblue's base-cost column shows different numbers: mug $9.75; framed $34.50 for Black and White, $32.77 for Red Oak. Printful bills its own prices; Teeinblue's column is display only.

**Funnel pixel:** DONE. "Heartside funnel" (id 331481470) is connected, with permission "Required: Marketing". Its code is now the repo's `shopify/pixels/hs2-funnel.js`, identical by SHA-256 (d12a5639...) except that the existing Meta and TikTok IDs are kept. It was saved and re-read after reload.

**The chat (heartside.io/?view=gifts).** Run 1 was chips only (Kuku for Sam); run 2 used "Something else" twice plus "Not sure" (Biscotti for Linda). Both reach the gift picker. "Not in the shop yet" there is expected until the handles are set. Screenshots are in `heartside-chat-check/`. Things that look wrong, all in theme code (I didn't touch it):

1. **Desktop header overlap.** The page eyebrow and the "Kuku's gift for Sam" title sit under the Home / Catalog / Contact menu and overlap it (`1-eyebrow-overlaps-menu.png`).
2. **Print reveal:**
   - It shows the name in uppercase ("KUKU"), but the real print uses normal case ("Kuku").
   - The "Love, Kuku" signature spills below the frame (`2-...`).
3. **Blanket reveal:**
   - It has no dog's-name line, but the real blanket prints the name.
   - Its layout is photo-left and words-right; the real blanket is centered: photo, name, lines, signature (`3-...`).
4. **Ornament reveal** has no "Love, [dog]" signature, but the real ornament prints one (`4-...`). The mug reveal also lacks the paw that the real mug has next to the signature.
5. **Wrong "you" from the AI.**
   - After a typed answer, the follow-up asked "Does he howl the whole time until you sit?", but the person is Linda, not the buyer. One of its chips is "Until I pat the sofa" (`5-...`).
   - The reveal explainer said "Biscotti prefers naps and sitting with you". It should say Linda (`6-...`).
   - The gift lines themselves ("Howls for you for a minute until you sit.") correctly speak to the recipient.
6. **"Change a word" is capped at 44 characters**, but the approved chip line "Will ride anywhere, as long as it's with you." is 45 and Teeinblue allows 45. Editing that line drops its last character.
7. **Photo is required in Teeinblue.** The chat says "No photo handy? Add it later, on the gift". That's still true, because the shopper must add it on the product page before Add to cart.

## Unsure or skipped

- The **heart ornament** is skipped for launch.
- **Form order** on three gifts is as listed in Part A, not the spec order.
- The **brief live windows at launch** (mug about a minute, the others under 30 s), described in Part A.
- **Part F** is untouched. Old products are still live, and Tiny Me, For The Tree is still published: hide it on go-live with the others, if Krish agrees.
- The **Teeinblue trial** ends Oct 19.
- While copying the pixel, the TikTok pixel ID was printed once in my own tool log. It's a public ID that is already in the site's page source, not a secret.
