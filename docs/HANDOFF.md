# Heartside: handoff manual

Written 7 October 2026 by the Claude Code session that built the site, so that anyone (a person, Cowork, ChatGPT, another Claude) can pick the business up with nothing but this repo and Krish's logins. It replaces the 4 October hand-off, which described the v1 store (sling, tag, 30% off) and is now in `docs/archive/HANDOFF-2026-10-04.md`.

Read sections 1 to 3 before touching anything. Section 4 is the work left, in order. Section 5 is how to do each kind of job. Sections 6 to 9 are reference.

---

## 1. What this is and why it matters

**Heartside** (heartside.io) sells personalised gifts "written by your dog", to US customers, made to order by Printful. The joke: the dog is Head of Household at "Heartside Household Inc." and has written your annual performance review. The hero product is **The Annual Review**, a 12×18 poster printed with the customer's dog photo, their names and HR-style lines the customer picks ("Areas for improvement: Leaving. Please stop leaving."). It ends "Contract renewed. For life." and carries an APPROVED stamp.

**Dates and the goal.** The site is live now. Launch (ads and posting) is **20 October 2026**. Krish's target is **$10,000 in sales by Christmas**, roughly 180 to 250 orders depending on the mix. The last order date for Christmas delivery is about **10 December** (Printful's US cutoff is 11 December; confirm per product in the Printful dashboard before publishing any date).

**The feeling every page, post and ad must create, in this order:** a laugh in the first two seconds, then "that is exactly my dog", then a tender turn ("Contract renewed. For life."), then the urge to send it to someone. The comedy is the delivery system and the tenderness is the payload. The full voice guide (the "comedy bible") is `docs/V2-FROM-THE-DOG.md` section 2. Read it before writing a word of copy.

**How Krish works (he is the owner and decides everything material).**
- He moves fast and decides by reacting to something concrete. Bring him finished options with your recommendation, never open questions he has to answer from a blank page.
- Fewer round trips per decision. Each message should leave him something he can say yes or no to in one pass.
- Plain declarative writing. No "it's not X, it's Y", no staccato false binaries, no hype words.
- Push back once, clearly, if a request has a weaker path baked in, then do what he decides.
- He is frustrated by UI that looks amateur (misaligned text, overlaps, things off the edge). Check every visual change at desktop, phone and Instagram in-app sizes on the real store before showing him (section 5c).

## 2. Hard rules (these have been broken before; don't)

1. **Deploy theme code only through the GitHub workflow** (section 5b). Never edit theme code in Shopify's code editor or settings in the theme editor without writing them back to the repo; the next deploy would overwrite them.
2. **Never publish or unpublish a theme, place an order, or spend money.** Ask Krish first before spending (ads, apps, Higgsfield top-ups), deleting anything, installing an app, or changing checkout, payments, markets, taxes, domains or DNS. Carts are fine for testing; empty them afterwards.
3. **Honesty.** No invented reviews, ratings, customer counts, "sold out", fake countdowns or strike-through "was" prices. Every product claim must be true of the real Printful product. Dates go on the site only once confirmed.
4. **The product on screen is always the real design.** AI can make dogs and rooms; it never draws the poster, ornament or pillow (image models garble text). Composite the real print files (section 5d).
5. **Contact details.** Customer-facing email is **krish@heartside.io**, site is **heartside.io**. Krish's personal email never appears on anything customers, partners or platforms see.
6. **Copy style.** US spelling. No em dashes. No exclamation marks in body copy. No jokes about a dog dying, ageing, illness or abandonment, and none that mock the customer.
7. **Secrets.** The theme deploy token lives only in the GitHub repository secret `SHOPIFY_CLI_THEME_TOKEN`. Never paste credentials into the repo, a doc or a chat.
8. **Payments stay on Shopify Payments.**
9. **Every order is checked by a human before it prints.** Printful is set to manual confirm; the site promises "A human checks it before anything prints". Keep that true.

## 3. Where things stand (verified 6 to 7 October)

### Systems

| What | Where | Notes |
|---|---|---|
| Code and docs | GitHub `krishanraja/heartside`, branch `main` | Everything referenced here is in the repo except the people-only items in section 4 |
| Store | Shopify store `bnf1em-ge` (admin.shopify.com/store/bnf1em-ge), theme **Helio** | Live theme is **"Heartside launch"**, ID **197492998526** (published by Krish on 5 Oct) |
| Personaliser | **Teeinblue** app ($49/month) | Builds the live preview and print file, sends the order to Printful |
| Printing | **Printful** app | Manual confirm is ON: each order waits as a draft until someone confirms it |
| Products | The Annual Review $39 (`/products/the-annual-review`), The Annual Review Framed $89 (`/products/the-annual-review-framed`), Tiny Me For The Tree ornament $24 (`/products/tiny-me-for-the-tree`), The Body Double 16″ pillow $59 (`/products/the-body-double`) | Free US shipping on all. Margins: `docs/V2-FROM-THE-DOG.md` section 4. Break-even ad cost per poster sale is about $21 |
| Meta | Facebook Page "Heartside: From Your Dog", Instagram @yourdoghasnotes, an ad account, the Facebook & Instagram Shopify channel | See open items: pixel, payment method, Instagram link, catalog |
| TikTok | Not verified by Claude | Krish says a TikTok page exists |
| Video tools | **Higgsfield** (Ultra plan, 2,319 credits on 6 Oct, none spent on Heartside yet); Runway not set up | Krish's own "video engine" repo (`krishanraja/content-engine`) is built for Mindmake and is not used here |
| Email | krish@heartside.io | |

### The site, as live

- **Homepage** (`shopify/templates/index.json`): hero ("HEARTSIDE HOUSEHOLD / All-Access Pass"), the review builder (the visitor types names and picks lines, and a live poster updates), the ornament, benefits, FAQ, the "leak" story cards, sign-off, sticky bar. Title, meta description and share image were rewritten on 6 Oct and are live.
- **Product pages** use `product.review.json` (both posters, with the live poster) and `product.heartside.json` (ornament, pillow). Teeinblue's form sits inside our buy box, restyled to the brand (no Teeinblue blue, no sticky button bar). The ad landing page is any product with `?view=landing`.
- **Fixed 6 Oct and verified on the live site:**
  - Product pages no longer scroll themselves to the footer on phones.
  - Content clears the header.
  - **After Add To Cart, Helio's cart drawer opens on Check out and the cart count updates.** Before this, Teeinblue's Add To Cart told the theme nothing.
  - **On a gift list, the photo carries to the next gift.**
  - Proof: the purchase path passed every step in emulated Instagram, Facebook and TikTok browsers, from photo upload to a real Shopify checkout. Screenshots are in `docs/evidence/inapp-2026-10-06/`.
- **Hidden preview, waiting for Krish's verdict:** a shop-first redesign at **heartside.io/?view=shop**. It shows a grid of all four gifts with tick boxes, a running total and "Personalize them", then walks the shopper through each gift in turn with a "Next: ..." bar. Templates: `index.shop.json`, `product.shop.json` (posters), `product.shopgift.json` (ornament, pillow). It came from Krish's 6 Oct ask: "one menu of things I can just add to cart". How to ship it is in section 4, item 3.

### Known gaps right now

- **Teeinblue field labels** still say "Employee name (you)" and "Who is your manager? (Your dog's name)". They show in the form, the cart drawer and the order. They should be "Your name" and "Your dog's name".
- **Product descriptions** are Printful's stock text, and Meta's catalog shows the same text in ads.
- **Meta:**
  - The pixel isn't connected to the ad account.
  - The ad account has no payment method.
  - Instagram isn't linked to the Page.
  - Only 2 of 4 products are in the catalog (the ornament and pillow are missing).
- **Old store leftovers:** a "Dropshipper-AI Shipping" profile still holds 31 old products.
- **No real order has gone through yet.** Emulation can't prove the phone's photo picker, HEIC photos, Apple Pay, or that Teeinblue makes the print file for a paid order. One Teeinblue request (`PUT .../customization/<id>/cart-token`) is cut off in every test run; it is probably harmless, and only a real order will tell.
- **Order-by dates** show as placeholders (`[DATE]`) in the closure section settings, and the memo bar hides its date line until a date is set. The memo bar also has a "free video offer" window (default ends 1 Nov). The per-order video process (`docs/V2-FROM-THE-DOG.md` section 5) is **not built**. Check the live site and don't promise a video nobody is set up to make.
- **Funnel pixel** `shopify/pixels/hs2-funnel.js`: install status not verified. Installation steps are in `shopify/README.md`, under "Funnel pixel".

## 4. The work left, in order

Owner in brackets. "Krish" means only he can do it (his logins, his money, his taste).

**Before launch (20 October)**

1. **A real sample order from inside Instagram** (Krish). DM himself `heartside.io/products/the-annual-review`, open it inside Instagram, and order with a real dog photo. Then, in Printful > Orders, check the draft's print file (crop, names, spelling) and confirm it. This is the only proof that the whole chain works (Shopify > Teeinblue print file > Printful > shipping), and it is the physical sample the content needs. Note anything awkward on the phone; each one is a bug.
2. **Run `docs/COWORK-PROMPT-2026-10-07.md` in a browser session with Krish** (Cowork or any browser agent; Krish logs in). It covers:
   - Teeinblue labels and product descriptions (via the 6 Oct prompt).
   - Meta: catalog 4/4, pixel connected to the ad account, Instagram linked. Krish adds the card himself.
   - The shipping profiles.
   - Asking Krish about the test order and a bundle discount.

   Teeinblue's "Update" button overwrites Shopify's description, images, title and tags unless all four are unticked, every time.
3. **Ship or reject the shop-first redesign** (Krish decides, then anyone deploys). If "ship it":
   1. Rename the current homepage template to `index.classic.json`, so rollback is one rename, and make `index.json` the contents of `index.shop.json`.
   2. In Shopify admin, set the posters' theme template to `shop` and the ornament's and pillow's to `shopgift`. The alternative is to copy those settings into `product.review.json` and `product.heartside.json`.
   3. Run the checks, deploy and verify (section 5).
   4. The grid shows a total for several gifts but **no bundle discount exists**. Add one only if Krish names it.
4. **Confirm the Christmas last-order date** in the Printful dashboard for each product. Then set it in the theme (memo bar and closure section settings, in the repo's templates) and deploy.
5. **Card on the Meta ad account** (Krish).
6. **Content ready to post from 13 October** (section 4, content).

**Content (the plan Krish agreed on 6 October, with an open question on style)**

- Volume: 2 posts a day from 13 Oct, each cut posted to Instagram Reels, TikTok and Facebook Reels. 15 ad versions ready by 20 Oct.
- Five series:
  1. **Line of the day:** one real poster line over a dog shot. The daily volume.
  2. **POV: your dog filed your review:** the hero ad.
  3. **Every Christmas:** the emotional angle.
  4. **60 seconds to make yours:** a real screen recording of the site on a phone. Do it after the Teeinblue labels are fixed.
  5. **The reveal:** a real person opening the real poster. It needs the sample from item 1.
- **Status: 7 videos exist** (`content/v1-2026-10-06/`, with a README). **Krish is "not sure about the visual style at all".** Treat them as a working proof of the pipeline, not an approved look.
- **The next person's first content job is to find a style Krish likes before making volume.** Show him two or three clearly different directions as single frames or 3-second clips, take his pick, then produce.
- Keep in any style: real print on screen, sound-off readable captions inside the safe zone, the dog's flat corporate voice.
- Free to change: everything about the look, pacing, type, cards, and whether a voice or real dog motion leads. `docs/V2-FROM-THE-DOG.md` section 6 holds the original ad ideas (Biscuit as a recurring character with one consistent voice).
- Label AI-generated video with each platform's AI label.

**Paid (only on Krish's yes, and only after the card, pixel and catalog are fixed)**

- Start a Meta test at about $30 a day from launch. Put money only behind the posts with the best share and save rates from organic.
- Send ads to the product page or `?view=landing` with UTM tags; the links are in `shopify/README.md` under "The ad landing page".
- Kill anything with click-through under about 0.8% after 1,000 impressions, or with cost per purchase well above the $21 poster break-even. Scale the winners until the last order date.
- TikTok ads come after organic shows which hooks work.
- Before spending, re-read the Printful base and shipping costs, especially the pillow's, which is still marked "re-check" in `docs/V2-FROM-THE-DOG.md` section 4.

**Later**
- US sales tax (Krish's accountant).
- Delete the 31 old products (only on Krish's yes).
- The paused products (Uniform, Socks) return when Teeinblue background removal is set up.

## 5. How to do each kind of job

Tools needed locally: git, Node 20+, Python 3 with Pillow and NumPy, ffmpeg. Then run `cd tools/preview && npm install` once. The tests use Playwright's Chromium.

### 5a. Change the site

1. Edit files under `shopify/` (sections, snippets, templates, `assets/hs2.js`, `assets/hs2.css`). `shopify/README.md` explains every section and setting.
2. Run the checks from `tools/preview`. All must pass:
   - `node render.mjs`: renders every template locally with stubbed Shopify data. It fails on schema mistakes Shopify would reject (no `"default": ""`, select option labels of 50 characters or fewer).
   - `node theme-check.mjs`: Shopify Theme Check on our files.
   - `node minify-check.mjs`: **Shopify minifies theme JavaScript on its CDN.** This minifies `hs2.js` the same way and fails on anything that only works unminified. On 6 Oct the minifier turned a dynamic `import()` into a `require()` that broke the live site, while every unminified test passed. Never use `import()` in `hs2.js`.
   - `node shots.mjs`: screenshots of the local render, if you want to look before deploying.
3. Commit and push to `main`.

### 5b. Deploy to the live theme

GitHub > Actions > **"Push homepage to a Shopify theme"** > Run workflow, on `main`, with:
- `theme_id` **197492998526**
- `theme_name` **Heartside launch**
- tick **allow_live_theme**

The workflow backs up the theme's templates first (as a run artifact), pushes only Heartside files (`--nodelete`, so Helio's own files stay), and never pushes `pixels/`. If it stops on its **editor-edit guard** (someone changed a template in the theme editor), work out whether that edit should be kept. If so, copy it into the repo first. Otherwise rerun with `overwrite_editor_edits` ticked; the backup is still taken.

Check that the run's commit is the one you pushed. A live check that the new code is being served: load a product page and look for a string you just added in the served `hs2.js`.

### 5c. Verify on the real store (do this before showing Krish anything)

From `tools/preview`:
- `node live-gate.mjs`: loads the real store at desktop 1440, iPhone 390×844 and Instagram in-app 390×664, and fails on:
  - content under the header
  - sideways overflow or text off the edge
  - text on text
  - any of Teeinblue's blue
  - a sticky Teeinblue button bar
  - a page that scrolls itself

  Use `--query view=shop` for the preview, and `--pages`/`--views` for a subset. Screenshots go to `out/gate/`.
- `node inapp/flow.mjs ig product` (or `fb`, `tt`, `iga`; `shop` for the gift grid): the full purchase path in an emulated in-app browser, up to Shopify's payment form, then it empties the cart. Add `--swap` to test your local `hs2.js`, minified, before deploying it.
- Cloudflare in front of heartside.io blocks plain headless browsers; the scripts carry the flags that get through. Shopify starts answering 429 (Too Many Requests) after a dozen runs in a row. **Wait ten minutes before trusting a failure that follows a burst of runs.**

### 5d. Make videos

`python3 tools/content/reel.py tools/content/specs/<spec>.json` writes a 9:16 1080×1920 MP4 with sound to `content/out/` (not committed; copy approved finals into a dated `content/` folder).
- A spec is a list of scenes:
  - `photo`: a library photo with a slow push-in, a hook card and a form card whose poster line types itself out.
  - `poster`: the real poster, composed from the print layers, with the stamp slamming on.
  - `end`: a staged scene holding the reel's own poster, plus the end card.
- Every line is read from `shopify/snippets/hs2-lines.liquid`, the same source the site and the print use, so a video can only show a line that really prints. The header of `reel.py` documents every option.
- Real-print scenes: `tools/preview/mockups.py` places the real print on the blank surfaces in `assets/v2/scenes/` (hands holding a sheet, frames on walls, an ornament on a tree, a pillow on a sofa).
- Higgsfield (if used) is for dog and room motion only, never for the product. Get Krish's yes on the style before spending credits at volume.

### 5e. Admin work in Shopify, Teeinblue, Printful or Meta

This needs a browser session with Krish logged in. Write a prompt in the style of `docs/COWORK-PROMPT-2026-10-07.md`:
- the context
- the hard rules
- numbered tasks with exact clicks
- a report format to paste back

Browser lessons from earlier sessions are in `docs/archive/HANDOFF-2026-10-04.md`, under "Browser-automation lessons".

## 6. Technical traps learned the hard way

- **Shopify minifies `hs2.js`** (see 5a). Test the minified build (`minify-check.mjs`, `inapp/flow.mjs --swap`).
- **Helio scrolls inside `.page-wrapper` on desktop**, not the window, and smooth-scrolls. Its predictive search focuses its own hidden input on every reset, which once dragged phones to the footer. `hs2.js` guards that (`guardSearchFocus`), and undoes scripted scroll jumps for a moment after the bridge clicks Teeinblue's options (`holdScroll`).
- **Helio's header is transparent and overlays the first section**; `hs2.js` pads our first section down by the overlap (`clearHeader`).
- **Teeinblue's Add To Cart doesn't tell the theme.** `hs2.js` watches `/cart/add` and dispatches Shopify's `shopify:cart:lines-update` event, built by hand to match `standard-events.js`. That event updates Helio's count and drawer. It uses action `add` for a single gift (the drawer opens) and `update` on a gift list (the drawer stays shut; the next-gift bar leads). If the theme can't hear it, a fallback bar offers checkout.
- **Teeinblue draws its photo field a beat before it listens to it.** Handing it a photo too early is ignored, so `doHandoff` checks for the crop dialog and retries up to 4 times.
- **Photo memory:** a photo picked in the review box or in Teeinblue's own field is saved in IndexedDB for 3 days (`savePhoto`), so later gifts can use it. Names live in sessionStorage.
- **Teeinblue "Update" overwrites Shopify** description, images, title and tags unless unticked.
- **Teeinblue classes** we restyle: `.tee-form-actions`, `.tee-btn--atc`, `.tee-btn--preview`, `.tee-field--photo`, `.tee-radio`, `.tee-btn-wrapper--personalize`, the cropper `.vm--container`. All styling is scoped under `#buy` in `hs2.css`.
- **Shopify schema rules that fail a deploy halfway:** no `"default": ""`, and select option labels of 50 characters or fewer. `render.mjs` guards both.
- **Alternate templates** (`?view=name`) work on the live theme without being assigned, which is how previews are shown before Krish approves.

## 7. Which docs are current

| File | Status |
|---|---|
| `docs/HANDOFF.md` (this) | **Current. Start here.** |
| `docs/V2-FROM-THE-DOG.md` | **Current** plan: positioning, voice, range, prices, margins, fulfilment, ad ideas. Its "launch offer" and "order bump" ideas are not all built; check the live site |
| `docs/BRIEF.md` | Guardrails section still applies (honesty, claims). The product content is v1 |
| `shopify/README.md` | **Current** reference for every theme section, the Teeinblue bridge, the ad landing links and the funnel pixel |
| `docs/COWORK-PROMPT-2026-10-07.md` | **Current** browser-session prompt (open admin work) |
| `docs/COWORK-PROMPT-2026-10-06.md` | **Current** spec for the Teeinblue tasks the 7 Oct prompt points at |
| `docs/TEEINBLUE-SETUP.md` | Reference for how the Teeinblue templates were set up |
| `content/v1-2026-10-06/README.md` | The first 7 videos and their status |
| `assets/IMAGE-BRIEF.md`, `assets/README.md` | Reference for the photo library |
| `docs/COWORK-PROMPT.md` | History (the v1 ornament plan). It stays in place because the deploy workflow's setup note links to it |
| `docs/archive/*` | History: the 4 Oct hand-off and store state, the v1 ad brief, prompts already run, the Teeinblue setup log. See `docs/archive/README.md`. Do not act on these |

## 8. Asset index

| Asset | Where |
|---|---|
| Logo, favicon, watercolour heart | `assets/heartside-logo.png`, `assets/favicon-512.png`, `assets/heartside-heart-watercolor.png` |
| Dog and room photo library (licensed, confirmed by Krish on 5 Oct) | `assets/v2/` (Biscuit the dachshund is `biscuit-headshot.jpg`) |
| Blank staged scenes for real-print compositing | `assets/v2/scenes/` |
| Real-print product photos | `design/mockups/` (built by `tools/preview/mockups.py`) |
| Poster print template (what Teeinblue prints) | `design/poster-template/`: background, stamp, 15 line images, `layers.json` with every layer's position |
| Ornament artwork | `ornament/` |
| Approved design canvas source | `design/Main.dc.html` (landing copy, approved word for word), `design/Poster.dc.html` |
| Redesign preview screenshots | `design/redesign-2026-10-06/` |
| Social share image (live) | `design/share-image/heartside-share-1200x630.jpg` |
| Fonts | `shopify/assets/*.woff2` (site), `tools/fonts/` and `tools/content/fonts/` (TTF for images and video); all OFL |
| First videos | `content/v1-2026-10-06/` |
| In-app purchase proof | `docs/evidence/inapp-2026-10-06/` |
| Video specs | `tools/content/specs/` |

## 9. Recent decisions and why

- **Poster first, ornament second, pillow third; framed is an upsell on the poster page** (5 Oct). The $39 poster is the funny thing people send; an $89 framed joke is a big ask from a stranger. The ornament has the thinnest margin, so it rides along.
- **No 30% off on the new range.** At 30% off the poster's contribution falls to about $9. Free US shipping is priced in.
- **The cart drawer opens after a single gift is added** (6 Oct). The test found ad shoppers left with no next step. On a gift list the drawer stays shut, so the next-gift bar can lead.
- **The shop-first redesign is a hidden preview, not live,** because Krish approves material visual changes first.
- **Product strategy is closed for now** (6 Oct, Krish). A fur-keepsake product seen in a Facebook reel was looked at and not pursued; the range stays as in section 3.
- **Krish's video engine is not used for Heartside.** It is set up for Mindmake, never publishes, and only starts from a new chat whose first message is exactly "Video engine".

### Open questions for Krish (carry these forward)

1. Verdict on heartside.io/?view=shop.
2. Which content style, after seeing two or three directions.
3. A bundle discount: yes or no, and what (for example 15% off two or more).
4. His timezone, for scheduled check-ins.
