# Heartside v2 theme sections: "Your dog has notes"

The homepage and product templates, rebuilt from the approved canvas `design/Main.dc.html` as Online Store 2.0 sections for the Helio theme. The canvas copy is used word for word, checked by script against the source. They deploy through GitHub Actions into the unpublished **Heartside launch** theme (#197492998526) and nowhere else. Krish publishes.

| Phone | Desktop |
|---|---|
| ![Phone](preview/phone-first-screen.jpg) | ![Desktop](preview/desktop-first-screen.jpg) |

More in `preview/`:
- `phone-home-full.jpg` and `desktop-home-full.jpg`: the whole homepage.
- `review-builder-gerald.jpg`: the live poster and evidence photos after typing "Gerald".
- `leak-studio-gerald.jpg` and `story-cards.jpg`: the share section and its four free story cards.
- `product-annual-review.jpg`, `product-body-double-phone.jpg` and `product-teeinblue-bridge.jpg`: product pages, the last one showing answers copied into a stand-in Teeinblue form.
- `live-store-phone-sections.jpg` and `live-store-desktop-sections.jpg`: every section, one screen each, as the live preview renders them on 4 October (430 × 932 and 1440 × 900).
- `live-store-phone.jpg`, `live-store-desktop.jpg` and `live-store-leak.jpg`: as Shopify renders the Heartside launch preview (4 October, after the memo bar swap).

## How the page works

One shared state drives the whole page. The dog's name typed in the hero rewrites every mention: headline, stamp, ID badge, poster, memo, story cards, product copy and sticky button. The HR-26 answers drive the live poster, the evidence photos and the story cards. Everything is stored in `sessionStorage` for the visit and passed to product pages in the link.

- **Copy tokens.** In the theme editor, `{dog}`, `{DOG}`, `{dogs}` and `{person}` in any text setting become the shopper's dog and name. The page renders with Biscuit and Sarah until they type.
- **Joke lines.** The chip lines (improvement, incident, enemy) live in one place, `snippets/hs2-lines.liquid`, word for word from the canvas.
- **Evidence on file.** Under the live poster, three photos (Exhibit A, B, C) change with the chips: "The vacuum" shows the vacuum standoff, "Sharing food" the pug, "Your phone" the spaniel asleep on the laptop.
- **"Attach [Dog]'s headshot".** The photo goes onto the poster, the story cards and the phone preview at once. It stays on the shopper's device (IndexedDB, cleared after 3 days) until they use it on a product page.
- **Leak the review.** Four story cards, all drawn in the browser from the shopper's answers and photo at 1080 × 1920: the rating, the incident, the threat and the memo (the tender one). The phone preview is the exact card that downloads. Shoppers can save or share it, copy a caption, or send a link that opens the homepage on their dog's review (tagged `utm_source=leak`, with the card type as the campaign). Nothing is uploaded.
- **Answers carried to the product page.** "Approve [Dog]'s review", the leak section's poster button and the benefit links open the product with the answers in the link. The product page shows them in a "FORM HR-26 · ON FILE" card and adds them to the order as hidden line properties (`_Manager`, `_Employee`, `_Treat cupboard`, `_Improvement`, `_Incident`, `_Enemy`, `_Read-aloud video`).
- **Nobody types twice (the Teeinblue bridge).** On a product page, `hs2.js` copies the answers into Teeinblue's personalizer and offers a one-tap "Use [Dog]'s headshot". Details in **The Teeinblue bridge** below.

## One screen per section, motion, and honest urgency (4 October)

- **Fit.**
  - Every homepage section is exactly one screen tall, from 667px-tall phones to 1920 × 1080 desktops. This was measured at 360×740, 375×667, 390×844, 430×932, 768×1024, 1280×720, 1366×768, 1440×900 and 1920×1080.
  - Sections use `svh` units and type that scales with screen height. On phones the layouts change shape:
    - The review is five steps, one question per screen, with the poster scaled to fit and "Read it full size".
    - The benefits become a swipe carousel.
    - The FAQ shows as many tickets as fit, then "N more tickets".
  - Only phones 640px tall or less run 12px over, in two sections.
  - Helio pins its header row while the page scrolls (60px on phones, 66px on desktop). `hs2.js` measures it, so every section after the hero fits the room under it, and anchors stop below it.
- **Motion.**
  - The hero rises in, the stamp lands and the ID badge swings on its lanyard.
  - Sections reveal as they scroll in, and the management memo lands one paragraph at a time.
  - The policy and FAQ stamps land, and the closure and memo photos drift slowly.
  - The story cards play like a story until the shopper touches them.
  - Approve stamps APPROVED onto the poster before moving on, and the dog's name gets a marker swipe when it changes.
  - Everything stops for `prefers-reduced-motion`. Without JavaScript nothing hides.
- **Urgency, all from real dates.**
  - A countdown to Christmas morning shows in the memo ticker, the hero, the sticky bar, step 5, the sign-off and product pages, with a live clock over the Christmas room.
  - **HS memo bar > Last order date** (YYYY-MM-DD) switches every countdown to "N days left to order for Christmas" and labels each deadline row "N days left". Set it only once Printful confirms the date.
  - The free read-aloud video (V2 doc section 4) shows only from 20 October to 1 November. Both dates are memo bar settings. Preview another day with `?hs2_now=2026-10-25`.
  - Nothing invents stock or resets.
- **Plain words.** Each screen now says what you are buying:
  - The hero has a plain "what it is" line, which replaces the second joke line on phones.
  - Buttons read "Make my poster", "Approve and order [Dog]'s poster" and "Make [Dog]'s poster · $39".
  - Each benefits card has a product tag, and the leak section is labelled "FREE · FOR YOUR INSTAGRAM OR TIKTOK STORY".
- **Funnel events.** The theme publishes Shopify customer events for the funnel. Subscribe to them in Settings > Customer events (a custom pixel) to send them to GA4, Meta or TikTok:
  - `hs2_name_entered`, `hs2_review_step`, `hs2_approve_clicked`
  - `hs2_photo_attached`, `hs2_story_card`, `hs2_caption_copied`, `hs2_link_shared`
  - `hs2_faq_open`

## The ad landing page (Instagram and TikTok)

Paid traffic should land on the poster's product page in the `landing` layout rather than the homepage. The page has:
- No store menu.
- The hero and the five-step review.
- The buy box with Teeinblue on the same page.
- Proof, the memo, the deadlines and the FAQ.
- A sticky "Order [Dog]'s poster · $39".

Approve stamps the poster and scrolls to the buy box. Nothing opens a new page or a pop-up, so it converts inside Instagram's and TikTok's in-app browsers. There, the story card opens full size to press and hold, because those browsers can't download files.

The template is `templates/product.landing.json`. It needs no assigning: any product opens in it with `?view=landing`. Once the poster product exists, use these ad links (check the macro names in each ads manager):

- **Instagram / Facebook:** `https://heartside.io/products/<poster-handle>?view=landing&utm_source=instagram&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`
- **TikTok:** `https://heartside.io/products/<poster-handle>?view=landing&utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__`

Add Teeinblue's app block to the landing template too (`docs/SHOPIFY-BROWSER-PROMPT.md` task 5).

## The Teeinblue bridge

Teeinblue has no documented prefill feature, so this was built against its storefront code, read and tested on Teeinblue's own demo store on 4 October 2026.

- **What it does.**
  - It finds each Teeinblue field by its heading and fills it the way typing does. Dropdowns are matched by the chip label or the full printed line.
  - It then checks Teeinblue's own record (`window.teeinblue.getCurrentCustomization()`).
  - If a value didn't take, it writes Teeinblue's saved customization and asks it to reload (`refillCustomizationData`), which is Teeinblue's own restore path.
- **The headshot.** One tap on "Use [Dog]'s headshot" hands the homepage photo to Teeinblue's upload field. Teeinblue then opens its cropper and uploads as if the shopper had picked the file. It needs the tap, so nothing uploads without the shopper.
- **Respecting the shopper.**
  - It never overwrites a field the shopper has edited.
  - On a reload with the same answers, it leaves alone what Teeinblue restored.
  - Edits made in Teeinblue flow back into the answers card and the order's hidden properties.
- **Proof.**
  - On Teeinblue's live demo store, the bridge filled the name field, Teeinblue's record and preview updated, and the hand-off opened Teeinblue's cropper and uploaded the photo.
  - `tools/preview/shots.mjs` repeats the whole flow against a stand-in built with Teeinblue's markup and the six field labels.
- **What it depends on.**
  - **The field labels** in `docs/TEEINBLUE-SETUP.md`. A heading must contain "manager" or "dog's name", "employee" or "your name", "cupboard", "improvement", "incident" and "enemy".
  - **Teeinblue's markup:** `.tee-field`, `.tee-field__heading`, and `input[type=file]` for photos.
  - If Teeinblue changes either, the answers card still shows the answers, and the order still carries them as hidden properties.
- **Where Teeinblue draws.** The product section tells Teeinblue to put its live preview at the top of the media column (`[data-hs2-tib-gallery]`) and to use the theme's form (`#hs2-product-form`). Its add to cart then carries the hidden answers too. When Teeinblue's preview appears, the theme's own live poster hides, so there is one preview.
- **Check once templates exist.** Open a product from the homepage after answering, and confirm that the fields fill, the headshot button works, and Teeinblue's preview sits in the media column. If the preview lands somewhere else, set the gallery selector to `[data-hs2-tib-gallery]` in Teeinblue's theme settings.

## Files

| Section | Canvas part |
|---|---|
| `hs2-memo` | Memo bar. It belongs in the **header group**, above Helio's header. |
| `hs2-hero` | "[Dog] has completed your annual review.", name card, ID badge, status pill, the manager photo |
| `hs2-review` | Form HR-26 builder with chips, the live poster, evidence photos, price box and read-aloud toggle |
| `hs2-management` | "A word from management", the tender memo, with the dog asleep under a hand |
| `hs2-benefits` | Benefits package cards, with item codes and `[… SHOT]` placeholders |
| `hs2-closure` | Notice of holiday office closure (`[DATE]` placeholders), over the Christmas living room |
| `hs2-policy` | Company policy, three promises |
| `hs2-leak` | "Leak [Dog]'s review.": the phone preview, four story cards, caption, link and the poster button |
| `hs2-faq` | The HR help desk: "HR is in a meeting (asleep)", nine tickets, the contact email, a closing button, and FAQ structured data |
| `hs2-signoff` | "Heartside · Keep them close · heartside.io", set as a signed lockup |
| `hs2-sticky` | "Read [Dog]'s review · $39" pill, shown once the hero has scrolled away |
| `hs2-product` | Product page: gallery or live poster, stamp, title, price, description, answers on file with the headshot button, Teeinblue app block slot, add to cart, policy lines |

- **Templates:**
  - `index.json` (the homepage).
  - `product.review.json` for the two Annual Review products; it shows the live poster.
  - `product.heartside.json` for the pillow, uniform, socks and ornament.
- **Snippets:**
  - `hs2-head`: fonts, CSS and JS.
  - `hs2-t`: tokens.
  - `hs2-lines`: joke lines.
  - `hs2-poster`: the live poster.
  - `hs2-photos`: photo addresses for the script.
  - `hs2-paw`.
- **Assets:**
  - `hs2.css` and `hs2.js`.
  - Fraunces, DM Sans and Courier Prime, self-hosted and subset (about 160 KB in total).
  - The photos from `assets/v2/`, as WebP at two sizes, built by `tools/build_shopify_assets.py`.

## New copy for Krish to approve

Added on 4 October to make the page read like a shop:
- **Hero:** "A personalized 12 × 18 inch poster of your dog's review of you, with their photo and your name. $39, free US shipping." The button reads "Make my poster".
- **Review:** "FORM HR-26 · 5 QUICK QUESTIONS · TAKES A MINUTE". The steps add "STEP 1 OF 5", "PRINTS AS", "Back" and "Next", and the button reads "Approve and order [Dog]'s poster".
- **Benefits:** "More gifts made from your dog's photo. Free US shipping on every one." The product tags are "Custom dog-shaped pillow · 16 in", "Sweatshirt + matching dog bandana", "Socks printed with your dog's face" and "Two-sided ceramic photo ornament".
- **Leak:** the eyebrow reads "FREE · FOR YOUR INSTAGRAM OR TIKTOK STORY".
- **Buttons:** the sticky bar, sign-off and FAQ buttons read "Make [Dog]'s poster · $39" ("Order [Dog]'s poster · $39" on the ad landing page).
- **Countdowns:** "Christmas morning in N days", or "N days left to order for Christmas" once a date is set. The offer line reads "Free until November 1".

Earlier additions:

The canvas copy is untouched. These lines are new, written to the comedy bible (`docs/V2-FROM-THE-DOG.md` section 2). Each is a theme-editor setting, so any of them can be changed or deleted there.

- **Leak section:**
  - "FOR INTERNAL DISTRIBUTION ONLY" and "Pick the leak".
  - The card names: The rating, The incident, The threat, The memo.
  - The buttons "Copy the caption" and "Send the link".
  - "The card uses a stand-in dog until you attach [Dog]'s headshot. Attach it in the review"
  - "The full review, on paper." and "$39 poster · $89 framed · Free US shipping".
  - The story cards reuse canvas lines only.
- **HR help desk:**
  - "HR is in a meeting (asleep)" and "SELF-SERVICE DESK".
  - "HR is asleep, so the answers are filed here. Anything [Dog] can't answer goes to a person."
  - "Still deciding? [Dog] has already decided."
- **Five new FAQ tickets** after the canvas's four:
  - "When will it arrive?"
  - "Can I see it before it prints?"
  - "What if it arrives damaged or misprinted?"
  - "What happens to my dog's photo?"
  - "Who do I complain to?" ("[Dog]. Response times vary. …")
- **Product page:**
  - "Use [Dog]'s headshot"
  - The status lines "Copied into the personalizer below. Change anything you like there." and "Headshot sent to the personalizer. Crop it there."
- **Evidence labels:** "EVIDENCE ON FILE" and "EXHIBIT A/B/C".

## Deploy

On github.com/krishanraja/heartside: **Actions > Push homepage to a Shopify theme > Run workflow**, branch `main`, `theme_id` **197492998526**. The workflow refuses the live theme and any theme not named "Heartside launch".

- **Files.** It only adds and updates files (`--nodelete`). The v1 ornament sections and snippets therefore stay in the theme, unused. Delete them in the code editor if they clutter the "Add section" list.
- **Backup.** Before every push it saves the theme's templates and section groups as a run artifact (`theme-backup-…`, kept 30 days). The log says whether each template had theme-editor changes, because pushing `templates/*.json` replaces them. Once product pickers or images are set in the editor, copy those settings into `shopify/templates/` before the next push, or restore them from the backup.
- **Header.** Tick **header_memo_bar** to put the HS memo bar at the top of the header group and remove the v1 offer bar ("30% off and free US shipping until November 1."). Any other announcement bar is hidden, not deleted. The script is `.github/scripts/header-memo.mjs`.

## After deploying, in the theme editor (Heartside launch > Customize)

1. **Header layout:** Helio lays its header over the hero on the homepage. `hs2.js` pads the hero by the overlap, so nothing collides. The cleaner fix is to turn off the transparent or overlay header in Helio's header settings, which gives the logo its own row (`docs/V2-FROM-THE-DOG.md` section 7). Point the main menu at `#review` "Your review", `#benefits` "Benefits package" and `#closure` "Christmas deadlines".
2. **Product pickers:**
   - In the review builder and the leak section, choose the Annual Review product.
   - In each benefits card, choose its product.
   - Assign the product templates (Products > each product > Theme template): **review** for the poster and framed poster, **heartside** for the rest.
   - Add Teeinblue's app block to both product templates, between "Homepage answers" and "Add to cart".
3. **Placeholders:** replace `[DATE]` and `[… SHOT]` only when the real date or image exists (see below).

## Placeholders left in place

| Where | Placeholder | Replace with |
|---|---|---|
| HS memo bar | `[DATE]` | The poster's Christmas order date, once confirmed in Printful |
| HS holiday closure | `[DATE]` × 4 | Uniform, Body Double, framed review, and poster/socks/ornament, each confirmed in Printful's dashboard |
| HS benefits package | `[PILLOW SHOT]`, `[SWEATER SHOT]`, `[SOCKS SHOT]`, `[ORNAMENT SHOT]` | Printful mockups (`assets/IMAGE-BRIEF.md` items 12 to 15): pick the image, then clear the tag. Until then each card shows a photo from the Canva set |
| HS product (both templates) | `[PRODUCT SHOT]` | Shows only when a product has no images; disappears once Printful mockups are on the product |

## Checks run

- **Shopify Theme Check:** 0 offenses across all sections, snippets and templates.
- **Rendered locally** with liquidjs and screenshotted in Chromium at 390 px and 1440 px. No horizontal overflow and no script errors.
- **Interaction test (`tools/preview/shots.mjs`):**
  - Typing a name rewrites the headline, stamp, badge, poster, memo and buttons.
  - The chips change the poster lines and the evidence photos, and the read-aloud toggle relabels.
  - An attached headshot reaches the poster and hides the stand-in note.
  - All four story cards download. The phone tap zones cycle the cards, and the caption and link copy to the clipboard.
  - The approve link carries every answer, and the product page shows them and fills the order properties.
  - On the stand-in Teeinblue form, all six fields fill, the headshot reaches Teeinblue's upload, and an edit in Teeinblue updates the order property.
  - The sticky pill hides over the builder and the help desk's closing button. The variant picker updates the price.
- **Teeinblue's real code:** the bridge and the headshot hand-off ran against Teeinblue's live demo store (see above).
- **Copy:** every visible string in `design/Main.dc.html` is present word for word. The only changes are the alt texts of the old stand-in photos, which now describe the real photos.
- **On the real store:** after each deploy the Heartside launch preview (`?preview_theme_id=197492998526`) is loaded in Chromium at 390 px and 1440 px.
- **Shopify's Liquid tokenizer:** Shopify ends an output tag at the first closing brace, which the local tools don't. `tools/preview/render.mjs` fails on that pattern before anything ships, and the workflow fails if Shopify rejects any file.

Rebuild and recheck: `python3 tools/build_shopify_assets.py`, then `cd tools/preview && npm install && node render.mjs && node shots.mjs`. Print files: `node print.mjs`.
