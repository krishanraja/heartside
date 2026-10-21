# Heartside: handoff manual

Status: current, rewritten 21 October 2026 for the v3 product and the dog's own voice on the gifts. It replaces the 7 October manual for the v2 poster store, which is in this file's git history; the 4 October v1 manual is in `docs/archive/HANDOFF-2026-10-04.md`.

This file lets anyone (a person, Cowork, another Claude) pick the business up with nothing but this repo and Krish's logins. It holds the systems, the hard rules, the state, the work left and how to do each job. Read in this order:

1. `NORTH_STAR.md`: the ambition, every session.
2. `V3-GIFTS-FROM-YOUR-DOG.md`: the product, the journey, the AI and the words on the gifts. It wins over this file on those.
3. `POSITIONING.md`: how the business describes itself.
4. This file.

What lives in this repo and what lives in Drive: [`SYNC.md`](SYNC.md). Acquisition, content and campaigns live in the growth repository, `krishanraja/growth-heartside`.

Read sections 1 to 3 before touching anything. Section 4 is the work left, in order. Section 5 is how to do each kind of job. Sections 6 to 9 are reference.

---

## 1. What this is and why it matters

**Heartside** (heartside.io) sells gifts given on behalf of a dog to the person it loves most, made to order by Printful for US customers. A buyer tells Biscuit about their dog in a minute-long chat. Biscuit is the brand's AI host, a chestnut miniature dachshund. The answers become a short message from the dog, in its own voice, printed on any of four gifts and signed "Love, [dog]" with a paw:

> I wait by the door. Weekends too. Obviously.
> I took your side of the bed. Not sorry.
> I'm your shadow. Where else would I be?

| Gift | Price | Notes |
|---|---|---|
| **The Morning Mug** | $29 | 11 oz; Black, Dark Blue, Dark Green, Red or Pink inside; the dog's photo on one face, three lines on the other |
| **The Couch Blanket** | $89 | 50 x 60 in sherpa; photo, name, four lines |
| **The Framed Print** | $89 | 12 x 18 in; photo, name, four lines |
| **The Tree Ornament** | $24, or $19 with another gift | Ceramic circle; photo, name, the meaning line |

All four ship free in the US. Positioning: "Your dog loves you too." (`POSITIONING.md`).

**The ambition** (`NORTH_STAR.md`, 18 Oct): by February 2027, Heartside is the gift US dog owners reach for first when they want something that sounds like their dog. $10,000 is an ordinary month, not a Christmas peak, and most orders come from people who saw someone else's. Christmas order-by dates must be confirmed per product in Printful before any is shown.

**How Krish works (he owns the business and decides everything material).**
- He moves fast and decides by reacting to something concrete. Bring him finished options with your recommendation, never open questions he has to answer from a blank page.
- Fewer round trips per decision. Each message should leave him something he can say yes or no to in one pass.
- Plain declarative writing. No "it's not X, it's Y", no staccato false binaries, no hype words.
- Push back once, clearly, if a request has a weaker path baked in, then do what he decides. Record his rulings in V3 section 13 in his words, with the date.
- He is frustrated by UI that looks amateur (misaligned text, overlaps, things off the edge, previews that don't match what prints). Check every visual change at desktop, phone and Instagram in-app sizes, on the real product photos, before showing him (section 5c).

## 2. Hard rules (these have been broken before; don't)

1. **Deploy theme code only through the GitHub workflow** (section 5b). Never edit theme code in Shopify's code editor, or settings in the theme editor, without writing them back to the repo; the next deploy would overwrite them.
2. **Never publish or unpublish a theme, place an order, or spend money without Krish's yes.** Ask Krish first before spending (ads, apps, AI generation credits, test orders), deleting anything, installing an app, publishing an n8n workflow, or changing checkout, payments, markets, taxes, domains or DNS. Carts are fine for testing; empty them afterwards.
3. **Honesty.** No invented reviews, ratings, customer counts, "sold out", fake countdowns or strike-through "was" prices. No AI "customers". Every product claim must be true of the real Printful product. Dates go on the site only once confirmed.
4. **The product on screen is always the real design.** AI can make dogs and rooms; it never draws the mug, blanket, print or ornament. Show the real print on the real product photo (section 5d).
5. **Contact details.** Customer-facing email is **krish@heartside.io**, site is **heartside.io**. Krish's personal email never appears on anything customers, partners or platforms see; use hello@krishraja.com where a personal contact is needed.
6. **Copy style.**
   - US spelling. No em dashes. No exclamation marks in body copy (Biscuit may use one per chat message).
   - No jokes about a dog dying, ageing, illness or abandonment, and none that mock the buyer or the recipient.
   - **Gift lines are the dog talking to the person it loves:** I is the dog, you is the person. Never he, she, the dog's name or the person's name in a line, no "Dear" (V3 2 and 13).
   - None of the retired headlines in `POSITIONING.md` section 3.
7. **Secrets.** Theme deploy, order QC and the AI key live only in GitHub repository secrets and in n8n's credential store. Never paste credentials into the repo, a doc or a chat.
8. **Payments stay on Shopify Payments.**
9. **Every order is checked by a person before it prints.**
   - Teeinblue's "Auto confirm order" stays off, so Printful holds each order as a draft until someone presses "Confirm & Send to fulfill" in Teeinblue.
   - The twice-daily order QC (section 3) only tags orders; it never confirms one.
   - The site promises "A real person checks every order before it prints." Keep that true.
10. **Teeinblue's Update / Push to store overwrites Shopify.** It replaces the product's images, description, title and tags unless each is unticked. Untick them every time.

## 3. Where things stand (21 October)

### Systems

| What | Where | Notes |
|---|---|---|
| Code and docs | GitHub `krishanraja/heartside`, branch `main` | Product, theme, AI source, QC and docs. Growth work is in `krishanraja/growth-heartside` |
| Store | Shopify `bnf1em-ge` (admin.shopify.com/store/bnf1em-ge), theme **Helio** | Live theme **"Heartside launch"**, ID **197492998526** |
| Personalizer | **Teeinblue** | One campaign per gift: Mug 1043122, Blanket 1043153, Print 1043167, Ornament 1043174. It builds the preview and the print file, and holds each order for a person to confirm |
| Printing | **Printful** | Product 403 (mug, five colors), 711 (blanket), 2 (framed print), 900 (ornament) |
| The AI | Krish's **n8n**, two webhooks running Google Gemini | "Heartside: typed answer" and "Heartside: compose gift lines"; source and rules in `n8n/` (`n8n/README.md`). The key stays in n8n. Every call is logged in the n8n data table "Heartside AI calls" |
| Order QC | GitHub Actions, `.github/workflows/order-qc.yml` | 07:56 and 16:56 London. Checks each mug's print file and color, tags `qc-pass` or `qc-hold`, and opens an issue for Krish on a hold (`tools/qc/`) |
| Breed lookup | `breeds-corpus/` | Turns a typed breed into a corpus row; its archetype is a light tone signal for the AI, never shown |
| Meta | Facebook Page "Heartside: Personalized Dog Gifts" (facebook.com/yourdoghasnotes), Instagram @yourdoghasnotes, an ad account, the Facebook & Instagram Shopify channel | Profile wording: `POSITIONING.md` section 5 |
| TikTok | @yourdoghasnotes, personal account | A clickable bio link comes at 1,000 followers |
| Email | krish@heartside.io | |

### The buyer's journey, as live

- **Home** (`shopify/sections/hs3-chat.liquid`, `shopify/assets/hs3.js`, live since 19 Oct): "Your dog *loves you too.*", the example mug, the four gifts as pills, "Start with your dog". The v2 homepage is kept as `index.classic.json` (`heartside.io/?view=classic`).
- **The chat** (V3 4.2), six short steps with chips, "Not sure" and "Something else":
  - The dog's name, She/He and an optional breed.
  - Who it loves most.
  - What it does when they come home.
  - Its spot.
  - What they do together.
  - What the dog is to them.

  Each answer inks a line in the dog's own voice.
- **The reveal:**
  - The AI's compose call rewrites the four lines as one message in that dog's personality; the scripted lines show first and are the fallback.
  - Biscuit picks a gift.
  - The mug is drawn on Printful's real photo, in the chosen color, with "Turn the mug".
  - "Change a word" allows 45 characters per line.
- **Choose gifts:** tick any of the four, then "Ship to: them / me". The ornament is $19 with another gift.
- **Product pages** (`product.gift.json`, `?view=gift`): title, price, Heartside's description, "Your Words", then Teeinblue. The bridge in `shopify/assets/hs2.js` fills Teeinblue's fields by label: "Dog's name", "Line 1" to "Line 4" and "Signed", plus the photo. It also adds the hidden properties `_hs_answers` and `_hs_lines` so the person checking the order sees what the buyer said.
- **The share card:** a 9:16 card, "Kuku got Sam something.", made on the phone for stories.

### Known gaps right now

- **The mug's Teeinblue Preview:** every color shows all ten slides, and the note face prints flat instead of curving with the mug. The fix is two Teeinblue settings (`evidence/claude-code-2026-10-19/COWORK-MUG-PREVIEW-FIX.md`).
- **No real order through the v3 journey yet.** Krish's test order is next. The launch checklist and the order steps are in `evidence/claude-code-2026-10-21/COWORK-LAUNCH-AND-TEST-ORDER.md`.
- **Christmas order-by dates** are not confirmed per product. The choose screen's December promise must be checked or gated before it's relied on.
- **Social bios** may still describe the retired range (`POSITIONING.md` section 5).
- **Funnel events:** `hs3_share_card` fires when the card is drawn, not when it is shared, and `hs3_add_to_cart` fires on the hand-off to the product page, not a confirmed add (`HANDOVER-2026-10-17.md`).

## 4. The work left, in order

Owner in brackets. "Krish" means only he can do it (his logins, his money, his taste).

1. **Run `evidence/claude-code-2026-10-21/COWORK-LAUNCH-AND-TEST-ORDER.md`** (Cowork, with Krish logged in). It replaces the 20 Oct prompt and covers:
   - fix the mug Preview (mockups per color, perspective on);
   - check the other three gifts take the dog-voice lines;
   - list product images with old wording;
   - run the real-phone journeys;
   - watch the AI fallback rate;
   - confirm the old Cowork order-QC task is off.
2. **The mock order** (Krish): one Black mug and one Couch Blanket in a single order, with a real dog photo, a typed breed and one typed answer. Then:
   - order QC should tag it `qc-pass` with "Color: Black (Printful 11051)";
   - check both print files;
   - press "Confirm & Send to fulfill" in Teeinblue.

   This is the proof that Shopify > Teeinblue > Printful works for the v3 range.
3. **Confirm the Christmas order-by date per product** in Printful, then set it in the theme and deploy.
4. **Fix the funnel events' meaning**, and document each event in `shopify/README.md` (`HANDOVER-2026-10-17.md`).
5. **Tighten Biscuit's reaction prompt** so it never leans on the breed archetype ("a very important tool for a manager"). It never reaches a gift.
6. **Phase two, only on Krish's yes:** an AI illustration of the dog from the buyer's answers (V3 section 10), gated by the five-dog likeness test.

Acquisition (creators, content, the comment loop, paid tests) is planned and drafted in `growth-heartside`, which reads this repo daily.

## 5. How to do each kind of job

Tools needed locally: git, Node 20+, Python 3 with Pillow and NumPy, ffmpeg. Then run `cd tools/preview && npm install` once. The tests use Playwright's Chromium (in cloud sessions, `executablePath: '/opt/pw-browsers/chromium'`).

### 5a. Change the site

1. Edit files under `shopify/`. The chat is `sections/hs3-chat.liquid` with `assets/hs3.js` and `hs3.css`. Product pages and the Teeinblue bridge are `sections/hs2-product.liquid` with `assets/hs2.js` and `hs2.css`. `shopify/README.md` explains every section and setting.
2. Run the checks from `tools/preview`. All must pass:
   - `node render.mjs`: renders every template locally with stubbed Shopify data. It fails on schema mistakes Shopify would reject (no `"default": ""`, select option labels of 50 characters or fewer). Run it first; the others use its output.
   - `node chat.mjs`: the whole chat with mocked AI. Covers chips only, a typed answer, AI failure, AI slow and all "Not sure", through to the product page hand-off.
   - `node reveal.mjs`: every gift tab, with and without a photo, at phone sizes; the mug's even line breaks and its drawn faces.
   - `node hs3-lines.mjs`: the mug's line breaks and the typed-line rule, run on the real `hs3.js`.
   - `node mug-bridge.mjs`: the mug's line breaks survive into Teeinblue's fields.
   - `node mockup-gate.mjs`: the chat's mug against Teeinblue's real print files wrapped by the approved method. Look at the boards in `out/gate-mug/` too. Krish called a preview that passed every other check "ridiculously poor" (15 Oct).
   - `node theme-check.mjs`: Shopify Theme Check on our files.
   - `node minify-check.mjs`: **Shopify minifies theme JavaScript on its CDN.** This minifies `hs2.js` and `hs3.js` the same way and fails on anything that only works unminified. Never use `import()` in them.
3. Commit on a branch, open a pull request, merge to `main`.

### 5b. Deploy to the live theme

GitHub > Actions > **"Push homepage to a Shopify theme"** > Run workflow, on `main`, with:
- `theme_id` **197492998526**
- `theme_name` **Heartside launch**
- tick **allow_live_theme** (only with Krish's yes for that change)

The workflow backs up the theme's templates first (as a run artifact), pushes only Heartside files (`--nodelete`, so Helio's own files stay), and never pushes `pixels/`. If it stops on its **editor-edit guard** (someone changed a template in the theme editor), work out whether that edit should be kept. If so, copy it into the repo first. Otherwise rerun with `overwrite_editor_edits` ticked; the backup is still taken.

Check that the run's commit is the one you merged. Then check the live site serves the new code: fetch heartside.io and look for a string you just added in the served `hs3.js` or `hs2.js`.

### 5c. Verify on the real store (do this before showing Krish anything)

From `tools/preview`:
- `node live-gate.mjs`: loads the real store at desktop 1440, iPhone 390x844 and Instagram in-app 390x664, and fails on:
  - content under the header;
  - sideways overflow or text off the edge;
  - text on text;
  - any of Teeinblue's blue;
  - a sticky Teeinblue button bar;
  - a page that scrolls itself.
- `node inapp/flow.mjs ig product` (or `fb`, `tt`, `iga`): the purchase path in an emulated in-app browser, up to Shopify's payment form, then it empties the cart. Add `--swap` to test your local `hs2.js`, minified, before deploying it.
- On the mug, also check:
  - each color's gallery and Teeinblue Preview;
  - the cart line (color, the three lines, "Love, [dog]", the whole mug as the thumbnail).
- Cloudflare in front of heartside.io blocks plain headless browsers; the scripts carry the flags that get through. Shopify starts answering 429 after a dozen runs in a row. **Wait ten minutes before trusting a failure that follows a burst of runs.**

### 5d. Change the AI

The source is `n8n/build.mjs` (prompts, guard, rules) and `n8n/shared.js`. Then:
1. Run `node build.mjs && node test-rules.mjs && node test-voice.mjs`.
2. Update the live workflows through the n8n connector (`update_workflow`, then `publish_workflow`) with Krish's yes. Note the previous version IDs for rollback.
3. Check each webhook with one real call (the curl in `n8n/README.md`).

The theme applies the same voice check to whatever the AI returns. Change both together.

### 5e. Product images and print files

- The approved mug images are rendered from Teeinblue's real print file wrapped onto Printful's photo (`tools/realphoto/`, `design/teeinblue/mug-v3/`). Colors are recolored from the pink base by hue (`tools/realphoto/recolor_mug.py`).
- New images replace approved ones only on Krish's yes. When uploading to Shopify, keep the alt text pattern "The Morning Mug, black inside: ..."; the product page groups the gallery by color from it.

### 5f. Admin work in Shopify, Teeinblue, Printful or Meta

This needs a browser session with Krish logged in. Write a prompt in the style of `evidence/claude-code-2026-10-20/COWORK-PROMPT.md`:
- the context;
- the hard rules;
- numbered tasks with exact clicks;
- a report format to paste back.

## 6. Technical traps learned the hard way

- **Shopify minifies theme JavaScript** (5a). Test the minified build.
- **Helio scrolls inside `.page-wrapper` on desktop**, not the window, and smooth-scrolls. Its predictive search focuses its own hidden input on every reset, which once dragged phones to the footer. `hs2.js` guards that (`guardSearchFocus`), and undoes scripted scroll jumps for a moment after the bridge clicks Teeinblue's options (`holdScroll`).
- **Helio's header is transparent and overlays the first section**; `hs2.js` pads our first section down by the overlap (`clearHeader`).
- **Teeinblue's Add To Cart doesn't tell the theme.** `hs2.js` watches `/cart/add` and dispatches Shopify's `shopify:cart:lines-update` event, so Helio's count and drawer update.
- **Teeinblue takes about 6.6 s to show it has the photo.** The bridge waits 10 s before resending the headshot, at most twice (an early retry sent it five times).
- **Teeinblue keeps a typed line break but wraps greedily.** The mug's lines carry `\n` at their most even break (measured with HS-Fraunces-Text's real widths), so one word never sits alone on a row.
- **Teeinblue only knows which Printful product to make for variants it created.** Add colors or sizes in Teeinblue and push them; never add variants by hand in Shopify.
- **n8n's code runner sleeps when the site is quiet.** The theme sends `{"warm":true}` as a chat starts and before compose, so the first real call isn't slow.
- **The webhooks ignore bots.** Test with a browser user agent and an allowed `Origin`.
- **Shopify schema rules that fail a deploy halfway:** no `"default": ""`, and select option labels of 50 characters or fewer. `render.mjs` guards both.
- **Alternate templates** (`?view=name`) work on the live theme without being assigned, which is how previews are shown before Krish approves.

## 7. Which docs are current

| File | Status |
|---|---|
| `docs/NORTH_STAR.md` | **Current.** The ambition. Only Krish changes it |
| `docs/V3-GIFTS-FROM-YOUR-DOG.md` | **Current. The product spec.** Product, journey, AI, words on the gifts, and the decision log (section 13) |
| `docs/POSITIONING.md` | **Current.** How the business describes itself, what's retired, where it's applied |
| `docs/HANDOFF.md` (this) | **Current.** Systems, hard rules, state, work left, how-tos |
| `docs/HANDOVER-2026-10-17.md` | **Current** product recommendations and acceptance criteria |
| `docs/COWORK-HANDOVER-2026-10-15.md` | **Current** record of the approved mug and the rejected directions |
| `docs/evidence/claude-code-2026-10-20/` | **Current.** The dog-voice change (`FOR-COWORK.md`) and the Cowork prompt before the mock order (`COWORK-PROMPT.md`) |
| `docs/SYNC.md` | **Current.** What lives in the repo and what lives in Drive |
| `shopify/README.md`, `n8n/README.md`, `tools/qc/README.md`, `breeds-corpus/lookup/README.md` | **Current** references for the theme, the AI, the order check and the breed lookup |
| `design/BRAND-SYSTEM.md` | Look and type current; its gift voice section is current; the poster voice is marked retired |
| `docs/V2-FROM-THE-DOG.md`, `docs/BRIEF.md`, `docs/TEEINBLUE-SETUP.md`, `docs/COWORK-PROMPT*.md` before 20 Oct | History of the v1 and v2 stores. The honesty guardrails in `BRIEF.md` still apply; everything else is superseded by V3 |
| `content/v1-2026-10-06/` | The first seven videos, for the retired HR poster. Don't post them |
| `docs/archive/*` | History. Do not act on these |

## 8. Asset index

| Asset | Where |
|---|---|
| Logo, favicon, watercolor heart | `assets/heartside-logo.png`, `assets/favicon-512.png`, `assets/heartside-heart-watercolor.png` |
| Dog and room photo library (licensed, confirmed by Krish on 5 Oct) | `assets/v2/` (Biscuit the dachshund is `biscuit-headshot.jpg`) |
| Biscuit, the illustrated host | In the theme (`hs3.js`) and `design/prototype-v3/` |
| The approved v3 prototype | `design/prototype-v3/Main.dc.html` (flow and Biscuit's lines; its gift lines are retired) |
| Mug v3: Teeinblue mockups, print file, approved Shopify images, colors | `design/teeinblue/mug-v3/` |
| Mug layers for the chat (five colors) | `shopify/assets/hs-mug-*.webp` |
| Ornament artwork | `ornament/` |
| Social profile images | `assets/heartside-avatar-biscuit-1080.jpg`, `assets/heartside-fb-cover-1640x624.jpg` (the cover shows the retired poster) |
| Brand system and Canva links | `design/BRAND-SYSTEM.md`, `design/CANVA-SOURCES.md` |
| Fonts | `shopify/assets/*.woff2` (site), `tools/fonts/` (print: Fraunces Text, Fraunces Italic, Courier Prime); all OFL |
| Evidence from earlier checks | `docs/evidence/` |

## 9. Recent decisions and why

The full log, in Krish's words, is V3 section 13. The ones that shape day-to-day work:

- **12 Oct: positioning.** "Heartside: Personalized Dog Gifts", "Your dog loves you too." Business headlines are never lame or dumb.
- **13 Oct: gifts from the dog.** The four everyday gifts replaced the HR poster range. The chat with Biscuit replaced the review builder. Live AI runs on Gemini through Krish's n8n.
- **15 Oct: mug v3 approved.** The dog as a large cut-out on one face, the note in Fraunces on the other, every preview on real product photos. "Every gift as a letter" rejected.
- **18 Oct: the North Star.** The gift US dog owners reach for first, with $10,000 an ordinary month by February 2027.
- **19 Oct: five mug colors** (Black, Dark Blue, Dark Green, Red, Pink), Black first. The chat became the homepage. Order QC moved to GitHub Actions.
- **20 Oct: the dog's own voice.** Gift lines are the dog talking to the person it loves. The AI writes all four lines for every buyer, and an optional breed shades the tone.
- **21 Oct: product images in the dog's voice** (Krish: "yes, re-render the product images in the dog's voice"). All four products' Shopify images now show the new lines (`design/shopify-images/gifts-2026-10-21/README.md`).

### Open questions for Krish (carry these forward)

1. Whether "Your dog has notes." survives as an end-card line on content.
2. The phase-two AI illustration: run the five-dog bake-off, and when.
3. A bundle discount beyond the $19 ornament: yes or no, and what.
