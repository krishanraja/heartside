# Cowork, 19 October: checks on what went live, and the order QC setup

Read with `docs/evidence/claude-code-2026-10-19/REPORT-2.md`. Nothing was added to a cart, ordered, published, deployed or changed in a live system. The only action taken in Shopify, GitHub or Teeinblue was reading.

**North Star:** "Heartside is the gift US dog owners reach for first when they want something that sounds like their dog."
- Part A moves the "sounds like their dog" part: it checks that a buyer sees their own dog's words on the gift before paying.
- Part B moves "$10,000 is an ordinary month": every mug order is checked before it prints, with no dependence on a Claude connector.

## Part A: what went live today

Method: a 390 x 844 phone browser (iPhone 13 profile) run from the cloud session against heartside.io, through the real chat as Biscuit (partner Sam, "Waits at the door", "Even weekends", "Sam's side of the bed", "Couch and a movie", "Sam's shadow"), one gift at a time. The desktop browser window here would not shrink, so this was the way to get a phone-size view. Not added to a cart.

### 1. Chat to the gift pages: pass for all three

| Gift | Gallery before touching anything | Preview button | Pictures |
|---|---|---|---|
| Ornament | "Biscuit / Your shadow, always. / Love, Biscuit" | same words | `A1-ornament-landing.jpg`, `A1-ornament-preview.jpg` |
| Blanket | "Biscuit", four lines (Waits at the door for you, weekends too. / Steals your side of the bed. / Saves you a seat for movie night. / Your shadow, always.), "Love, Biscuit" | same words | `A1-blanket-landing.jpg`, `A1-blanket-preview.jpg` |
| Mug | dog face on slide 1; note face on slide 2 shows "Waits at the door for / you, weekends too.", "Steals your side of the bed.", "Your shadow, always.", "Love, Biscuit" | same note face | `A1-mug-landing.jpg`, `A1-mug-note-face.jpg`, `A1-mug-preview.jpg` |

Teeinblue's fields hold the same words on each page (mug: Line 1 holds the break "Waits at the door for" / "you, weekends too.").

**One thing still visible to a buyer, for Claude Code to decide:** the small thumbnails inside Teeinblue's own gallery (the first row under the big picture) still show its sample, "Bartholomew Jr". On the mug the second thumbnail reads "Waits at the door for you, every single day ... Love, Bartholomew Jr". These are Teeinblue's mockups, not the buyer's preview, as REPORT-2 says. Seeing another dog's name under your own gift's picture is the kind of thing that makes a buyer doubt which one prints. Hiding those thumbnails when the chat has handed the words over would remove it.

### 2. The Morning Mug's images: pass

`/products/the-morning-mug.json` lists exactly two images, both 2048 x 2048: the dog face first (position 1, id 86434504933758) and the note face second (id 86434504966526). The featured image and the only variant's image are both id 86434504933758, the dog face. Picture: `A2-mug-images.jpg`. On the note face the rows sit with a slight bow; the bow is gentle at this size and I would not call it obvious at phone size.

### 3. The footer note: pass, with one position remark

"Heartside is a Mindmaker LLC company. Mindmaker Ltd in the UK." is on the homepage, a product page and `/policies/privacy-policy`. It is 11 px at 60% opacity on the black footer; the copyright line above it is 12 px. Pictures: `A3-footer-home.jpg`, `A3-footer-product.jpg`, `A3-footer-privacy.jpg`.

The remark: the note is the last item in the footer. On a phone it sits below the copyright, then "Terms and Policies", then the Instagram icon, so it is under the copyright line but not directly beneath it. If Krish wants it right under the copyright, that is a small change for Claude Code.

The privacy page also shows the contact email as krish@heartside.io.

### 4. For whoever presses Update in Teeinblue next

Not pressed. On the mug (artwork #1353995, campaign 1043122), Images must be unticked on any Update, or Teeinblue puts its own images back on the product and replaces the two new ones.

## Part B: order QC on GitHub Actions

Status: **waiting on Krish.** The repository secret `SHOPIFY_ORDERS_TOKEN` does not exist yet. The secrets page lists only `GOOGLE_AI_API_KEY` and `SHOPIFY_CLI_THEME_TOKEN`, so no dry run has been possible. Krish makes the Shopify custom app "Heartside order QC" with `read_orders` and `write_orders` only, then puts the token straight into the GitHub secret, following `tools/qc/ORDER-QC-SETUP.md`. I never see or handle the token.

Then, in this order and each on Krish's yes: (1) dry run from Actions > Order QC > Run workflow with dry run ticked; read its summary (checked, held, waiting, skipped) and whether API version `2026-07` worked; (2) a real run, then confirm `qc-pass` or `qc-hold` and one note line on the mug orders in Shopify admin, and a GitHub issue if anything held; (3) tell Claude Code to switch the schedule on; (4) turn off the Claude scheduled task "Heartside order QC".

## Part C: launch week watch

Not started: it needs orders. First blanket order, check the Printful facility. Every order, check the QC tag and card before anyone confirms it in Teeinblue, and never confirm a `qc-hold`. Daily, the share of "Heartside AI calls" rows with `source` = fallback or `slow` = true.

## For Claude Code

1. The Teeinblue sample thumbnails ("Bartholomew Jr") under the gift pictures (Part A, 1).
2. Optionally, move the footer note directly under the copyright line (Part A, 3).

## Desktop check and Order QC handover (19 Oct, later session)

North Star part: launch readiness. A desktop visitor has to reach the gifts, and every mug order has to get a QC verdict before anyone confirms it in Teeinblue.

**Desktop check: passes.** Run on the live site (heartside.io) in a clean desktop-size browser at 1440x900 and at 1896x762, the size of Krish's own screen. Nothing was bought or changed.

- First screen: the headline and the "Start with your dog" button on the left, the mug on the right. Not blank. The button's bottom edge is at 692 px (1440x900) and 672 px (1896x762), inside the screen. No sideways scroll.
- Chat step 3: the note ("For Sam", "Waits at the door for you.", "Love, Biscuit") on the left, Biscuit's reply and the answer chips on the right.
- Screenshots: `desktop-1896x762-first-screen.jpg`, `desktop-1896x762-chat-step3.jpg`, `desktop-1440x900-first-screen.jpg`, `desktop-1440x900-chat-step3.jpg`.
- Limit: this is a clean browser, so it cannot show a menu or search box left open in Krish's own session. If his own screen is still blank, open the page in a private window and screenshot it with the browser's width and height.
- For Claude Code (cosmetic): at 1896x762 the Biscuit mascot and its "Psst" bubble are cut off at the bottom edge of the first screen. The button is fully visible.

**Cowork task "Heartside order QC": paused** (Krish confirmed, 19 Oct). Order QC now runs only on GitHub Actions at 07:56 and 16:56 London, so the two cannot tag the same order. It is not visible from this session, so this is Krish's word, not something checked here.

**Still waiting:**
- The 07:56 London run on 20 Oct: confirm it ran on schedule, was green, and the summary line makes sense.
- The first Morning Mug order: confirm `qc-pass` or `qc-hold` and exactly one new note line with the buyer's note kept. On a hold, confirm a GitHub issue assigned to krishanraja. Never confirm a `qc-hold` order in Teeinblue until it is fixed.
- Watch items: untick Images on any Teeinblue Update for the mug; check the first blanket order's Printful facility (not in the US means an earlier Dec 10 date for the blanket); daily share of "Heartside AI calls" with fallback or slow, report above 1 in 10.

**Social names (same day):** Instagram @yourdoghasnotes display name changed to "Heartside: Personalized Dog Gifts" on Krish's yes (username unchanged). TikTok is locked until after 19 Oct and is pending Krish's yes on the name tomorrow. No phone-size Instagram screenshot: Instagram returned a blank page to the cloud browser.
