# Teeinblue setup for the v2 range

Run this from a Claude session that has the **teeinblue** connector, which is installed in Claude Desktop as a local connector. The cloud Claude Code session that built the theme can't reach a local connector, so it prepared this instead. Read `docs/V2-FROM-THE-DOG.md` sections 1 to 5 first: the comedy is the point, and the prices below come from section 4.

## Rules for this job

- **Spending and installing.** Don't spend money, install apps, or change checkout, payments, markets or domains without asking Krish. Teeinblue and Printful are already installed and approved.
- **Orders go to Printful as drafts only.** Every order reaches Printful as a draft that waits for a person to confirm it. Nothing is auto-confirmed. Set it in both places:
  1. **Teeinblue:** in its Printful fulfilment settings, turn off any automatic or confirmed order push. Choose "send as draft" or "on hold" (the wording varies), never auto-confirm.
  2. **Printful:** Dashboard > Settings > Store settings > **Orders** > turn on **"Manually confirm all imported orders"**. Teeinblue's own Printful guide recommends exactly this. It's the safety net if a Teeinblue setting ever flips.

  This is the "a human checks every order" promise on the site, and it must stay true.
- **Prices.** "Price is the price": no compare-at or strike-through prices on any of these products.
- **Product templates.** Assign each product's theme template in Shopify: **review** for the two Annual Review products, **heartside** for the rest. Both templates already exist in the "Heartside launch" theme.
- **Teeinblue's block.** Add Teeinblue's app block to both product templates in the theme editor, between "Homepage answers" and "Add to cart".

## Before creating any product: the 30% discount

The automatic "30% off" discount covers the **All gifts** collection, and that collection matches every product priced above $0.01. Every new product below would get 30% off automatically: the poster would sell for $27.30.

**Krish decided on 4 October to end it for now.** If it's still active when you get here, end it: Shopify admin > **Discounts** > the 30% automatic discount > **Deactivate**. Free US shipping stays, because it's priced into every product (section 4). The theme's header no longer advertises the 30%: the workflow's `header_memo_bar` option swaps the v1 offer bar for the memo bar.

## Shared settings for every template

- **Fonts.** Upload these from `tools/fonts/` in the repo: `CourierPrime-Regular.ttf`, `CourierPrime-Bold.ttf` and `Fraunces[opsz,wght].ttf` (all SIL Open Font License).
- **Colors.** Ink `#121010`, paper `#FFFDF9`, stamp red `#A8284E`, chestnut `#8A4A2B`.
- **Field labels.** Use the homepage's own words, so the page and the personalizer read as one form. **Keep them.** The theme copies the shopper's homepage answers into these fields by reading their labels (see "The theme fills these fields" below).

| Field | Label | Limit |
|---|---|---|
| Dog's name | Who is your manager? (Your dog's name) | 14 characters, required |
| Your name | Employee name (you) | 14 characters, required |
| Treat cupboard | Times you opened the treat cupboard | 6 characters, default `1,412` |
| Improvement | Area for improvement | dropdown, 5 options below |
| Incident | Open incident report | dropdown, 5 options below |
| Enemy | Known enemy of the company | dropdown, 5 options below |
| Photo | Attach [Dog]'s headshot | image upload, with a "send it later" option (section 5) |

- **Dropdowns.** Use Teeinblue's dropdown display (a select) or buttons; the theme can fill both. Each option shows the short label to the shopper and prints the full line. These are approved copy; keep them word for word. (They also live in `shopify/snippets/hs2-lines.liquid`.)

| Area for improvement | Prints |
|---|---|
| Leaving | Leaving. Please stop leaving. |
| The vacuum | Continues to bring the vacuum into the building. We have discussed this. |
| Bath time | Scheduled a bath without consulting me. Bold. |
| Sharing food | Ate an entire sandwich in front of me. Shared none of it. |
| Your phone | Looked at a rectangle for six hours instead of me. |

| Open incident report | Prints |
|---|---|
| The sock | The sock. I would do it again. Case closed. |
| The sandwich | The sandwich was unattended. Legally, it was mine. |
| The remote | The remote was asking for it. |
| Rolled in it | I rolled in something. You will never know what. |
| The couch | The couch had a weakness. I found it. |

| Known enemy of the company | Prints |
|---|---|
| The mailman | The mailman. Comes every day. Clearly planning something. |
| Squirrels | Squirrels. They know what they did. |
| The vacuum | The vacuum. Loud. Hungry. Unemployable. |
| The cat | The cat next door. Under investigation. |
| My reflection | The other dog in the mirror. Copies everything I do. |

If Teeinblue can't map a dropdown label to different printed text, use the full line as the option itself. The theme matches either the short label or the full line.

## The theme fills these fields (nobody types twice)

Shoppers answer the HR-26 questions on the homepage before they reach a product. On the product page, the theme's script (`shopify/assets/hs2.js`, "Teeinblue bridge") copies those answers into Teeinblue's fields. It also shows a "Use [Dog]'s headshot" button that hands the photo they attached on the homepage to Teeinblue's upload, which opens Teeinblue's cropper. It was built against Teeinblue's storefront code and tested on Teeinblue's demo store on 4 October 2026.

For it to work:
- **Labels.** Each field heading must contain one of these words:
  - "manager" or "dog's name"
  - "employee" or "your name"
  - "cupboard"
  - "improvement"
  - "incident"
  - "enemy"

  The labels above already do.
- **Photo field.** The photo must be an image upload field (Teeinblue's standard one).
- **Where Teeinblue draws.** The product templates ask Teeinblue to draw its live preview at the top of the media column and to use the theme's form. If Teeinblue's preview shows up somewhere odd, set these in Teeinblue's theme or storefront settings:
  - gallery selector: `[data-hs2-tib-gallery]`
  - form selector: `#hs2-product-form`

**Test it once a template exists:**
1. On the Heartside launch preview, answer the homepage questions with a name like "Gerald" and attach a photo.
2. Click "Approve Gerald's review".
3. On the product page, the answers card should say "Copied into the personalizer below". Teeinblue's fields should hold Gerald and the chosen lines.
4. "Use Gerald's headshot" should open Teeinblue's cropper.

## The six products

### 1. The Annual Review: $39 (hero)

- **Printful product:** #1 Enhanced Matte Paper Poster, **12×18** only.
- **Print file:** 3600 × 5400 px (12 × 18 in at 300 dpi). Built from `design/Poster.dc.html`; everything is in `design/poster-template/`.
  - Bottom layer: `poster-background.png`, the full canvas with every fixed element. The personalised parts are blank.
  - Top layer: `poster-stamp.png`, the APPROVED stamp on a transparent full-size canvas. Keep it above the text, as in the design.
  - Reference: `poster-sample.png`, the finished poster with Biscuit and Sarah.
- **Personalised layers.** Positions are print pixels from the top-left. The exact values are in `layers.json`.

| Layer | x | y | w | h | Type and style |
|---|---|---|---|---|---|
| Photo | 252 | 522 | 1020 | 1020 | Image, cover-crop, 24 px corner radius |
| Employee name | 1968 | 725 | auto | 108 | Courier Prime Regular, 96 px, `#121010`, left |
| Reviewer (dog's name) | 1968 | 1056 | auto | 108 | Courier Prime Regular, 96 px, `#121010`, left |
| Key achievement | 252 | 2498 | 3096 | 269 | Courier Prime Regular, 96 px, `#121010`, wraps. Text: `Opened the treat cupboard {cupboard} times. Strong numbers.` |
| Improvement line | 252 | 3039 | 3096 | 134 | As above, wraps to 2 lines |
| Incident line | 252 | 3446 | 3096 | 134 | As above, wraps to 2 lines |
| Threat line | 252 | 3853 | 3096 | 269 | As above, wraps to 2 lines |
| Signature (dog's name) | 2970 | 5094 | 378 | 102 | Courier Prime Regular, 90 px, `#8A4A2B`, centred under the paw |

- **If Teeinblue can't put fixed text around a field** (the Key achievement line), let the whole sentence be the layer, with the cupboard number as its only variable part.
- **One addition to `Poster.dc.html`:** a THREAT ASSESSMENT block. The homepage asks for the "known enemy" and shows it on the live preview, so the print has to show it too. If Krish wants the print exactly as the canvas, delete the block and the enemy dropdown together.

### 2. The Annual Review, framed: $89

Printful #2 Enhanced Matte Paper Framed Poster, 12×18, frames black / white / red oak. It uses the same template as the poster.

### 3. The Body Double: $59

- **Printful product:** #743 Custom Shaped Pillow, **16″**.
- **Other sizes:** section 3 also mentions 10″ and 22″, but section 4 prices only 16″. Recommendation: launch 16″ only, and add the other sizes once Krish sets their prices.
- **Template:** the dog's photo with **background removal on**. The pillow is cut to the cutout's outline, so keep the whole dog, ears included, inside the safe area.
- **No text** on the pillow.
- **Sample:** this is one of the two products the v2 doc recommends sampling.

### 4. Mandatory Company Uniform: $129 set, $89 sweatshirt only

- **Printful products:** #1418 All-Over Print Unisex Cotton Sweatshirt (XS to 3XL) and #902 Pet Bandana Collar (S to XL).
- **Design:** an ugly Christmas sweatshirt printed all over with the dog's face (background removed). The bandana gets the same face pattern.
- **Decided (Krish, 4 October): how to sell the set.** A Shopify variant normally maps to one Printful product, so the $129 set needs a bundle:
  - The sweatshirt as its own product at $89.
  - The bandana as its own product at $40 ($129 minus $89).
  - The set as a bundle of the two at $129, made with **Shopify Bundles**, Shopify's own free app.

  Installing Shopify Bundles is the one step to confirm with Krish when you get there.
- **Last order date:** it stays `[DATE]` until Printful confirms the all-over-print facility's cutoff (section 5).
- **Sample:** this is the other recommended sample.

### 5. Surveillance Socks: $24

- **Printful product:** #882 Sublimation Socks, S / M / L.
- **Design:** the dog's face (background removed) tiled all over.
- **Add-on price:** $19 when added to another order. That needs a cart or checkout upsell, which is an app decision for Krish.

### 6. Tiny Me, For The Tree: $24

- **Printful product:** #900 Ceramic Ornament, 2-side print, **circle**.
- **Front:** the dog's photo, cut out, with their name in Fraunces.
- **Back:** "the dog's verdict on your year". To stay inside approved copy, use the hero's verdict and the poster's outcome: `Overall rating: exceeds expectations.` / `Contract renewed. For life.` / paw / `{dog}`.
- **Add-on price:** $19, the same upsell question as the socks.

## Not covered by Teeinblue (bring to Krish)

- **"The Full Review" bundle** (framed review, socks and ornament at $119) needs the same bundle mechanism as the Uniform set.
- **The read-aloud video** ($12, free with any order until 1 November per section 4). The homepage copy says "+$12" word for word.
  - The product pages pass the shopper's choice to the order as a hidden "_Read-aloud video: Yes" line property. That covers the free launch period.
  - A paid $12 add-on needs a product and an upsell.
- **Order bumps** at checkout: an upsell app.

## Done when

- [ ] All six products exist in Shopify with Printful variants, the prices above and no compare-at prices.
- [ ] Each has its Teeinblue template, and its live preview matches `poster-sample.png` for the poster.
- [ ] Teeinblue sends orders to Printful as drafts, and Printful's "Manually confirm all imported orders" is on.
- [ ] One test order (Krish approves the spend) arrives in Printful as a draft, with a correct print file.
- [ ] Theme templates are assigned: **review** for the two Annual Review products, **heartside** for the rest.
- [ ] The product pickers in the "Heartside launch" theme are set: the review builder's and the leak section's poster product, and the four benefits cards.
- [ ] The bridge test above passes on at least the poster and the Body Double.
