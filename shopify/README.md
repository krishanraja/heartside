# Heartside homepage: Shopify sections

The homepage, built as Online Store 2.0 sections that drop into a copy of the Helio theme. The "Their Person" ornament is the hero product. The page follows `docs/BRIEF.md` section 8, reworked around `ornament/SELL.md`.

| Phone | Desktop |
|---|---|
| ![Phone, first screen](preview/phone-first-screen.png) | ![Desktop, first screen](preview/desktop-first-screen.png) |

Full pages: `preview/phone-full-page.png`, `preview/desktop-full-page.png`. The name preview with "Gerald": `preview/name-preview-gerald.png`. The image the share button makes: `preview/shared-image.png`.

## The page, top to bottom

| # | Section file | What it does |
|---|---|---|
| 0 | `hs-announcement` | Offer bar with a countdown that ends with the real discount and hides itself afterwards. It goes in the **header group**, so it shows site-wide. |
| 1 | `hs-hero` | "Put the real *favorite* on the tree." Dachshund photo with the ornament hanging over it, the price with 30% off, "Make theirs" and "Try their name on it". |
| 2 | `hs-maker` | **Who's your person?** Shoppers type their dog's name, tap a face like theirs or add their own photo, and the ornament updates as they type. "Turn it over" shows the joke on the back. The buy button becomes "Make Gerald's ornament". "Send it to the group chat" makes a picture of their ornament to share, or saves it on desktop. Their photo never leaves the device. The name is remembered if they come back. |
| 3 | `hs-gallery` | "Curly, squashed, sleepy or *slightly* suspicious." Six sample ornaments, one per photo you supplied, labelled as samples with made-up names. |
| 4 | `hs-steps` | Three steps, plus the Christmas order-by date. The date stays hidden until you enter it. |
| 5 | `hs-feeling` | The sleeping golden puppy, full-bleed, under the original line "Some of the best moments of your day…". |
| 6 | `hs-gifts` | Product cards for the ornament, sling, tag and bottle, with sale prices that only show while the offer runs, and only for products in All gifts. |
| 7 | `hs-faq` | Eight questions as an accordion, with FAQ structured data for search results. |
| 8 | `hs-signup` | "Get the Christmas order-by date." A Shopify customer signup, tagged `newsletter, christmas-dates`. |
| 9 | `hs-sticky-cta` | A buy bar on phones only. It appears once the hero scrolls away and hides while the main buy button or the footer is on screen. |

Everything is scoped under a `.hs` class, so Helio's styles stay untouched and Helio's header and footer stay as they are.

## The offer lives in one file

`snippets/hs-offer.liquid` holds the discount (30%), the end time and the discounted collection's handle (`all-gifts`). Every price, the countdown, the gifts note and the offer bar read from it.

- **End time.** It's set to **1 November 2026, 23:59 London time** (the store's time zone), which matches the discount as it stands. For US shoppers that is 7:59 pm Eastern and 4:59 pm Pacific on 1 November. My recommendation is to move both automatic discounts to end at 11:59 pm Pacific on 1 November (that's 07:59 UTC on 2 November). Then "until November 1" holds for every US shopper. If you do, change `hs_ends` to `2026-11-02T07:59:00+00:00`.
- **Collection handle.** Check that the All gifts collection's handle is `all-gifts` (Products > Collections > All gifts > the URL handle in the search listing). If it differs, change `hs_collection`. If it's wrong, the page shows full prices and never shows a discount that checkout won't honour.

## Install

Work on a copy. The live theme stays as it is until you publish.

**From the browser (no terminal):** the repo has a GitHub Actions workflow, `.github/workflows/shopify-theme-push.yml`, that pushes this folder into a theme you name. It refuses the live theme. It needs the repository secret `SHOPIFY_CLI_THEME_TOKEN`, a password from Shopify's free Theme Access app. Then go to Actions > *Push homepage to a Shopify theme* > Run workflow, and enter the copy's theme ID. `docs/COWORK-PROMPT.md` walks through it step by step. Shopify's own GitHub connection doesn't fit here: it only builds a theme from a complete theme stored in the repo, and Helio's paid code must stay out of this public repo.

**From a terminal (about 15 minutes with the Shopify CLI):**

1. **Copy the theme.** Online Store > Themes > Helio > `…` > **Duplicate**. Note the copy's theme ID; it's the number in the Customize URL.
2. **Push these files into the copy.**
   ```
   npm install -g @shopify/cli
   cd heartside
   shopify theme push --store bnf1em-ge --theme <copy-theme-id> --path shopify --nodelete
   ```
   `--nodelete` adds and updates these files only, and leaves every Helio file in place. It replaces the copy's `templates/index.json`, so the copy's homepage becomes this one.
3. **Open the copy in the theme editor** (Customize) and:
   - **Header:** Add section > *Heartside offer bar*, drag it above the header, then hide Helio's own announcement bar.
   - **Products:** pick the ornament in *Heartside hero*, *Heartside name preview*, *Heartside ornament wall* and *Heartside phone buy bar*, then pick the four products in *Heartside gifts*. Until you pick them, the buttons go to `/collections/all` and the gift cards stay hidden.
   - **Order-by date:** fill it in *Heartside how it works* once the print provider confirms it.
4. **Check on a real phone** using the theme's Preview link, iPhone Safari especially. See the checklist below.
5. **Publish** when you're happy.

Without the CLI: Themes > the copy > `…` > **Edit code**. Upload the files in `assets/`. Create each file in `snippets/` and `sections/` with the same name and paste in its contents. Then replace `templates/index.json`. It takes about 40 minutes.

## Check on the real theme before publishing

These can only be confirmed inside Shopify:

- [ ] Helio's header and footer sit cleanly around the sections, with no Helio heading or button styles bleeding in.
- [ ] On iPhone, "Send it to the group chat" opens the share sheet with the picture. If Shopify's CDN blocks the drawing step, it falls back to sharing the link, which still works.
- [ ] The product page's Printify personaliser doesn't read the name from the homepage. The button adds `?name=Gerald` to the link, but shoppers type the name again on the product page. If that grates, it's a small product-page change later.
- [ ] Prices on the cards match checkout for each product, with the 30% applied.
- [ ] The signup lands in Customers with the `newsletter` tag and email marketing consent.

## Promises the page makes (keep them true)

- "A person checks every photo before it prints." Printify holds every personalised order for review anyway (see `ornament/README.md`).
- "If one won't print well, we email you before we make anything." This only holds if you, or whoever does reviews, actually send that email.
- "One email with the date to order by for Christmas, and one before the 30% ends. That's all we'll send until then." Hold to it.

## Editing and rebuilding

- **Words, products and dates:** change them in the theme editor. Every heading, line, button and FAQ answer is a setting.
- **Photos:** each image section has an image picker. Leave it empty to use the built-in photo.
- **Ornament artwork or sample dogs:** edit `tools/build_ornament.py` or the `DOGS` list in `tools/build_shopify_assets.py`, then run `python3 tools/build_ornament.py && cd tools && python3 build_shopify_assets.py`. Push again with the CLI.
- **Preview locally:** `cd tools/preview && npm install && node render.mjs && node shots.mjs`. Screenshots land in `tools/preview/out/shots/`. The preview stubs Shopify's own filters and uses mock products, so treat it as a layout check. Shopify does the real render.

## Checks run on this build

- **Shopify Theme Check** (`@shopify/theme-check-node`): 0 offenses across all sections, snippets and the template. It covers schema validity, unknown filters, missing snippets and JSON template structure. It was also shown to catch three planted errors.
- **Rendered with liquidjs, screenshotted with Chromium** at 390 × 844 and 1440 × 900: no horizontal overflow, no script errors. The 404 on phone is the favicon request.
- **Interaction tested in the browser:** typing a name, choosing a face, turning it over, a 13-character name, share-as-image (downloads a PNG on desktop), and the phone buy bar showing and hiding.
- **Copy:** no em dashes, no words from the banned list, US spelling throughout, active voice.
- **Weight:** 6 subset fonts (88 KB in total) and WebP images. The hero photo is 67 KB on phones and 217 KB on desktop, and everything below the first screen loads lazily.
