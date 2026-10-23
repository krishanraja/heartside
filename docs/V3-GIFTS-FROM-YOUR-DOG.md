# Heartside v3: gifts from your dog

**Status, 13 October 2026.** Decided by Krish in a Cowork session. This file is the source of truth for the product, the journey, the AI, the words on the page and the launch. Where it disagrees with `HANDOFF.md`, `POSITIONING.md`, `V2-FROM-THE-DOG.md`, `BRIEF.md` or `TEEINBLUE-SETUP.md` on any of those, this file wins. Facts in `HANDOFF.md` about systems, deploys and hard rules still stand.

- **Approved prototype:** the claude.ai Design canvas "Heartside: gifts from your dog" (https://claude.ai/artifact/68cvd4wN9xLGFzkFJSughX, version 7, approved by Krish on 13 Oct with "love it"). Its source is in this repo at `design/prototype-v3/Main.dc.html`. It is a reference for flow, layout and copy, not production code.
- **Who builds:** a Claude Code session builds the site and the AI. Cowork owns the vision, the copy, the gift range and the marketing.
- **Launch:** Sunday 18 October 2026, with Krish's explicit go-live approval on the day.

---

## 1. The north star (keep this intent)

Krish's words, 13 October:

- "Enable people to gift on behalf of their dog (to say their partner)."
- "The most incredible user flow, feels like it knows them."
- "The most incredible gifts that people will genuinely love to have around day to day or use functionally."
- "The product marketing for this needs to be EPIC."
- "The chatbot should also talk a bit like a dog too."
- On optionality: the buyer must know clearly that they can choose among gifts once the chat is done.

**The idea in one line:** your dog gets the person it loves a gift, and Heartside helps it say what only you two know.

**What the buyer should feel, in order:**
1. "Oh, that's fun" (Biscuit the dog greets them).
2. "It's actually listening" (Biscuit reacts to their real answers and asks one follow-up that proves it).
3. "That's exactly them" (the words on the gift are their dog and their person, nobody else's).
4. "I want all of these" (the same words on a mug, a blanket, a print or an ornament, their pick).
5. "I have to show someone" (the share card).

**What the recipient should feel:** a gift from the dog, in the dog's honour, that they use every morning, every night on the couch, every December on the tree.

**Lead line, unchanged:** "Your dog loves you too." It now reads literally: the gift tells the recipient the dog loves them.

**Campaign line for Christmas:** "This year, the dog's buying."

## 2. What Krish rejected, and the rules that follow

These were rejected on 12 and 13 October. Treat each as a hard rule.

| Rejected | Why (his words or reason) | Rule |
|---|---|---|
| The HR "annual review" builder ("Area for improvement", "Known enemy of the company") | "I don't think anyone will understand what the areas for improvement actually mean, nor how to answer them." "Zero actual empathy for how a user wants to use a website, or thinks about their dog." | Every question must be answerable instantly from lived experience, by any owner, including owners of shy, old, quiet or brand-new dogs. |
| Making the buyer do the comedy | "Why is that even funny? Why would I spend $40 on that?" | The buyer never has to be clever. Chips for everything. Humour comes from Biscuit and from the truth of their answers. |
| "Gifts written by your dog" as a headline | "Dogs can't write." | Gifts are FROM the dog (signed "Love, Kuku" with a paw). The words come from what the buyer told us. ~~Gift lines never use "I" in the dog's voice.~~ Superseded 20 Oct: the gift lines are the dog talking to the person (see section 13). |
| Lame or dumb business headlines | 12 Oct | Headlines stay plain, warm and true. |
| One gift, take it or leave it | 13 Oct | Show from the first screen that the words go on any of four gifts, and let them pick several. |

Unchanged rules: no invented reviews, ratings, customer counts, scarcity or countdowns; no AI "customers"; no strike-through prices; a person checks every order before it prints; no em dashes; no "it's not X, it's Y"; no "elevate", "unleash", "must-have", "game-changer", "fur baby".

## 3. The gift range (launch)

Same words, four gifts. Prices are Cowork's recommendation (Krish to confirm, section 12). Costs: Printful base prices from Printful's public catalog API and US first-item shipping from printful.com/shipping, both read 13 October 2026. Payment fee assumed at 2.9% + $0.30 (check the store's actual rate). Re-read both in the Printful dashboard before ads.

| Gift | Printful product | Price | Printful base + shipping | Contribution before Teeinblue and tax |
|---|---|---|---|---|
| **The Morning Mug** | #403 White Ceramic Mug with Color Inside, 11 oz, Pink inside | $29 | $8.11 + $6.69 = $14.80 | about $13.06 (45%) |
| **The Couch Blanket** | #711 Sublimated Sherpa Blanket, 50x60 in | $89 | $35.76 + $13.99 = $49.75 | about $36.37 (41%) |
| **The Framed Print** | #2 Enhanced Matte Paper Framed Poster, 12x18 in, black, white or red oak | $89 | $32.77 + $14.49 (medium framed rate, confirm) = $47.26 | about $38.86 (44%) |
| **The Tree Ornament** | #900 Ceramic Ornament, 2-side print (circle or heart) | $24, or $19 with another gift | alone $7.73 + $5.89 = $13.62; with another gift $7.73 + $0.70 | alone about $9.38; with another about $9.72 |

- Optional fifth: the unframed 12x18 print at $39 ($11.62 + $7.99 = $19.61, contribution about $17.96). Recommendation: keep it off the launch menu to keep the choice to four, and offer it only if buyers ask.
- **Retire from sale at launch:** The Annual Review poster (HR joke), its framed version, The Body Double pillow. Hide them; don't delete products or reviews. The paused Uniform and Socks stay paused.
- **Biscuit's pick** is a recommendation, not a default lock: the gift whose use matches what the dog and the recipient do together.
  - Morning walk or coffee: the mug.
  - Couch and a movie, or naps: the blanket.
  - Car rides, or anything else: the framed print.
  - The ornament is always offered for the tree, at $19 with another gift.

## 4. The journey (as approved in the prototype)

Phone first, inside the Instagram and Facebook in-app browsers. Six short steps, chips for every answer, under about 90 seconds.

### 4.1 Home (first screen)

- Ribbon: "This year, the dog's buying."
- Eyebrow: "Gifts from your dog"
- Headline: "Your dog *loves you too.*" (italic in stamp red)
- Line: "Tell Biscuit about your dog and the person they love most. We'll make something from your dog that they'll use every day."
- Visual: the real mug with an example dog and two example lines, labeled EXAMPLE. Biscuit peeks in: "Psst. Who does your dog love most?"
- The four gifts as pills (Mug, Blanket, Print, Ornament) and: "Chat for a minute, then put your words on any of these. Pick one, or a few."
- Button: "Start with your dog"

### 4.2 The chat

Layout: a paper note sits at the top ("What Kuku wants Sam to know" / "For Sam", the dog's photo, four lines in pencil that turn to ink as answers land, "Love, Kuku" with a paw). Under it: "At the end, put these words on any gift you like:" with the four gift pills. Biscuit's messages and the buyer's answers sit below; chips and buttons sit at the thumb.

Every question offers chips, a "Not sure" skip, and (to build, not in the prototype) **"Something else"**, which opens a short text field so the buyer can use their own words. The phone keyboard's microphone works there; don't rely on the browser's speech feature inside the Instagram app.

| Step | Biscuit says (reaction, then question) | Answer | Line it writes |
|---|---|---|---|
| 1 | "Hi! I'm Biscuit. I sniff out gifts from dogs to the people they love. Who's your dog?" | Dog's name (max 14), She/He, photo (allow "Add later") | name and photo |
| 2 | "Kuku! Great name. My tail is going. So who does Kuku love most?" | My partner / Mom / Dad / Our kid / A friend, then their first name (max 14) | "For Sam" |
| 3 | "Sam! Lucky human. What does Kuku do when Sam comes home?" | Waits at the door / Brings Sam a toy / Spins in circles / Plays it cool | a first draft line inks straight away ("I wait by the door. It's my whole job.") |
| 3b | One follow-up that proves it listened, e.g. "At the door! Every day? Even weekends? (I would.)" | Even weekends / Weekdays / Hears the car first | refined line ("I wait by the door. Weekends too. Obviously.") |
| 4 | "Weekends too. Now that's a good dog. Where's Kuku's spot when Sam's around?" | On Sam's feet / Sam's side of the bed / Next to Sam on the couch / Wherever Sam is | "I took your side of the bed. Not sorry." |
| 5 | "Their side of the bed? Bold. I'd do the same. What do Kuku and Sam do together, just the two of them?" | The morning walk / Coffee time / Couch and a movie / Naps / Car rides | "Our walks are the best part of my day." |
| 6 | "Walks! Best part of the day. Ask any dog. Last one. What is Kuku to Sam?" | Sam's shadow / Sam's best friend / There on the hard days / The boss of the house | "I'm your shadow. Where else would I be?" |
| End | "Oh. That one got me right in the ears. I've sniffed it out. I know what Kuku would get Sam." | Button: "Show me" | |

Biscuit's reactions are in `design/prototype-v3/Main.dc.html` (the step blocks); use them word for word. The gift lines for the chip answers were rewritten in the dog's own voice on 20 Oct (section 13) and live in `shopify/assets/hs3.js` (`H`, `BASE`, `SP`, `TG`, `ME`, `PLAIN`); the prototype's `lineFor` lines are retired. "Not sure" uses calm lines: "Best part of my day? You walking in.", "I'm never far from you.", "Any time with you is my favorite time.", "I'm yours. Always." A buyer who skips everything still gets a warm, true gift.

**The gift lines' voice (Krish, 20 Oct).** Every line is the dog talking to the person it loves: I, me and my are the dog; you is the person. Together the lines read as one warm message from the dog, signed "Love, [dog]": warm first, funny second, with a dog's logic and a straight face. Never he, she or the dog's name (that is writing about the dog from outside), never the person's name, no exclamation marks, no "Dear". Biscuit's own voice (4.6) is unchanged: he talks to the buyer.

### 4.3 The reveal

- "Biscuit's pick" eyebrow, "Kuku's gift for Sam".
- Four gift tabs (Mug, Blanket, Print, Ornament), the pick marked "Biscuit's pick". Tapping a tab shows the same words on that gift. Under the tabs: "Same words on any of them. Tap to see each one, then pick as many as you like."
- The gift mockup, with the lines inking in one by one (pencil to ink).
- Biscuit explains the pick, e.g. "The Morning Mug. Walks start with coffee. I would know. So Kuku gets a spot in Sam's mug every morning."
- "Written from your answers. Change any word."
- Buttons: "That's them. Choose gifts" and "Change a word" (inline edit with a character count).

### 4.4 Choose gifts

- "Kuku's gifts for Sam" / "Pick one or more. Your words go on each one."
- A strip with the photo, the first line and "Love, Kuku".
- Four tick boxes with name, one-line description and price. Biscuit's pick arrives ticked. The ornament shows $19 when another gift is ticked.
- "Ship to: Sam / Me".
- "Free US shipping. A real person checks every order before it prints. Misprints are remade free." A dated Christmas order-by promise stays off the live store until Printful publishes a verified 2026 cutoff for each route.
- Button: "Personalize gift · $29", or "Personalize 2 gifts · $48". It opens the first product's personalizer; Teeinblue's button adds each completed gift to the cart.
- After adding: "In your cart. Kuku's tail is going." and "Save Kuku's gift to your story".

### 4.5 The share card

A 9:16 card: "A gift from the dog", the photo, "Kuku got Sam something.", three lines, "Love, Kuku", "heartside.io". In-app browsers block downloads, so the instruction is "Press and hold the card to save it."

### 4.6 Biscuit's voice

Biscuit is the brand's host: an illustrated chestnut miniature dachshund with a greying muzzle (geometric, crafted, never a childish cartoon). He talks a bit like a dog.

- Dog things: sniffing things out, his tail going, ears, walks, treats, "Ask any dog.", "Good dog."
- At most one dog-ism per message. Short sentences. One exclamation mark per message is allowed in Biscuit's chat (it's a dog's excitement); nowhere else.
- Warm about every dog. Never makes the buyer or the recipient the joke.
- Never mentions death, illness, weight, age decline, rescue history or anything sad, even if the buyer does; he stays gentle and moves on.
- No emoji. No "woof" spam. No baby talk.

## 5. The AI

### 5.1 What it is for

The chips already produce good lines without AI. The AI makes it feel like it knows them:
1. **Typed answers** ("Something else"): turn the buyer's own words into a gift line and a Biscuit reaction.
2. **The follow-up** after a typed answer: one question that digs into the detail they gave (which, when, how many). Never why, never a joke request.
3. **Compose** at the reveal, only when any answer was typed: tidy the four lines to fit, keep the buyer's specifics word for word, write Biscuit's reason for the pick.

Chip-only paths use the scripted lines and reactions and make no AI call. That keeps the common path instant and free.

All three ship in version one, on Sunday.

### 5.2 Contract

**Typed answer call.** In: `{ step, question, typed_text, dog: {name, pronoun, breed?, tone?}, recipient: {name, relation} }` (breed and tone only for an exact match in the breed corpus; tone is a light signal, never shown). Out:

```json
{ "reaction": "≤ 70 chars, Biscuit's voice",
  "line": "≤ 60 chars (≤ 44 on step meaning), the dog talking to the recipient (I is the dog, you is the person)",
  "follow_up": { "question": "≤ 70 chars", "chips": ["≤ 24 chars", "...", "..."] },
  "flags": ["grief" | "profanity" | "person_described" | "unclear"] }
```

**Compose call.** Runs at every reveal (since 20 Oct, not only after a typed answer). In: dog (with breed and tone when known), recipient, every answer with its chip id or typed text, and the current lines as a draft. It rewrites the four lines as one message from the dog. Out:

```json
{ "lines": { "home": "≤ 60", "spot": "≤ 60", "together": "≤ 60", "meaning": "≤ 44" },
  "alternates": { "home": ["≤ 60"] },
  "recommended_gift": "mug" | "blanket" | "print" | "ornament",
  "reason": "≤ 140 chars, Biscuit's voice",
  "sources": { "home": ["answer ids"] },
  "flags": [] }
```

### 5.3 Rules the server enforces (never trust the model)

- Lengths as above. The gift templates must fit the longest allowed line.
- Every number, time, place and name in an output line must appear in the buyer's input; otherwise use the buyer's own trimmed words.
- Gift lines are the dog talking (20 Oct): I is allowed and means the dog; a line with he, she, his, her, the dog's name or the person's name is rejected, as is an exclamation mark; no em dashes; the banned word list in section 2. The theme applies the same voice check to every AI line it receives.
- A flag of grief, profanity or unclear: Biscuit says "I didn't quite catch that one. Try again, or pick one of these?" and shows the chips.
- Timeouts: typed answer 3 seconds, then a scripted "Tell me more?" and the buyer's own words as the line; compose 11 seconds (since 22 Oct: Claude Sonnet writes the note and n8n hands over to Gemini 3.5 Flash at 7.5 s; the scripted lines show at once and the AI's replace them when they land).
- Budget: at most 8 AI calls per visitor session. Rate-limit by IP.
- The model is never asked to draw. No per-visitor image generation in version one (see section 10).

### 5.4 Where it runs (decided 13 Oct)

- **Live AI ships in version one. The model is Google Gemini, with Krish's key.** Heartside stays a Shopify business: no new outside project.
- **Host: Krish's existing n8n.** The Gemini key is saved there as the credential **"Google Gemini(PaLM) - Heartside"** (n8n credential id `LtlmaVHoTQdTTngQ`, checked 13 Oct). Build two webhook workflows that use it, one per call in 5.2 (typed answer, compose), each returning exactly the JSON in 5.2. The theme calls those webhooks; the key never reaches the browser, the repo or a chat.
- Turning a webhook on makes it public, so activate the workflows only with Krish's OK.
- **Guard rails:** only heartside.io and the preview theme may call the webhooks (check the Origin header), a cap of 8 calls per session, and the scripted lines as the fallback whenever the AI is slow or fails.

## 6. Printing the words (Teeinblue and Printful)

- One new Teeinblue campaign per gift, each with the same hidden text fields, so the theme's bridge fills them by label: "Dog's name", "Line 1" to "Line 4", "Signed" ("Love, Kuku"), plus the photo.
  - Mug: photo, three lines (home, spot, meaning), signature.
  - Blanket and framed print: photo, dog's name, four lines, signature.
  - Ornament: front photo and dog's name; back the meaning line and "Love, Kuku".
- Type: the mug's lines are in Fraunces (HS-Fraunces-Text at 70 px, 16.8pt, since mug v3 was approved on 15 Oct; spec in `docs/evidence/cowork-2026-10-15/mug-v3-handoff-for-claude-code.md`). The blanket, print and ornament lines are in Courier Prime. Every gift has Fraunces italic in chestnut for the signature and Fraunces for the name (fonts in `tools/fonts/`).
- Every template must render a 60-character line (44 for the meaning line, which the ornament prints alone) without clipping or shrinking below a readable size at its real print size. Since 22 Oct the mug's lines are Fraunces at 58 px (about 14 pt), two rows each (Krish, option A; Cowork report `docs/evidence/cowork-2026-10-22/REPORT.md`). Test the longest and shortest cases (section 11).
- The bridge (`shopify/assets/hs2.js`, documented in `shopify/README.md`) already fills Teeinblue fields by label and hands over the photo with one tap. Reuse it. A multi-gift order goes through each gift's product page in turn; the hidden shop-first flow (`?view=shop`, `product.shopgift.json`) already walks a shopper through several gifts and is the starting point.
- Add the chat answers to each line item as hidden properties (`_hs_answers`, `_hs_lines`) so the person checking the order sees what the buyer said and what the AI wrote.
- Fulfilment: Teeinblue does not send orders to Printful by itself. Each order needs "Confirm & Send to fulfill" in Teeinblue, and Teeinblue's "Auto confirm order" is off, so Printful holds it as a draft until confirmed. That two-step check is the "a person checks every order" promise. Krish approved (13 Oct) a twice-daily batch check with an AI pre-check; Cowork sets it up separately.

## 7. Technical notes for the build

- Deploy theme code only through `.github/workflows/shopify-theme-push.yml`, to a preview theme first. Publishing to the live theme needs Krish's explicit approval on the day.
- The chat runs on the home page and on `?view=landing` for ad traffic. State persists in the browser for the session (answers and photo), so a reload or a jump to a product page loses nothing.
- Log a step event for each question shown, answered and skipped, plus reveal, gift tab taps, choose and add to cart, so the weakest question can be cut in week one.
- Respect `prefers-reduced-motion`. Touch targets at least 44 px. Text contrast 4.5:1.
- Privacy: say on the page that answers are processed by an AI service to write the words, and update the privacy policy to match. Don't send the buyer's email or address to the AI.

## 8. Marketing (EPIC)

- **The hook:** "This year, the dog's buying." Plenty of people already sign the dog's name on cards; Heartside makes that gift real.
- **Hero film (8 seconds):** a mug lands in Sam's hands on a cold morning; the words ink in; "Love, Kuku". End card: "Your dog loves you too. heartside.io".
- **Launch Reels (made with AI, never showing AI "customers"):**
  1. "My dog got me a gift" reveal: a partner unwraps the blanket and reads the lines aloud (creator version later with real people).
  2. Biscuit's interview, screen-recorded on a phone, sped up, with the lines inking in.
  3. "Which gift would your dog pick?" the four gifts with Biscuit's reasons.
- **Creators:** the 20 gifted US creators film their partner opening a gift from their dog. Disclose the gift in the post (FTC).
- **The share card** is the loop: every buyer gets a story-sized card that says "Kuku got Sam something."
- A/B test from `POSITIONING.md` continues: judge posts by sends per reach.

## 9. What's out of version one

- Per-visitor AI images, and Biscuit as a cartoon of the buyer's own dog.
- "A dog I miss" mode for dogs who have died (needs its own care and copy).
- The 2027 wall calendar (needs twelve photos).
- The HR review poster and the pillow.

## 10. Ordered artwork trial (updated by Krish, 23 Oct)

The 13 October idea of a phase-two drawing on the mug and ornament is superseded for product development. The approved first target is a framed city screenprint with the buyer's dog as the subject, a small handwritten note, a dog signature and a decorative illustrated paw. A buyer may give one meaningful city or neighborhood without adding a long questionnaire; an omitted place stays unidentified. The buyer's own photo is the identity reference. Runway and Higgsfield are primarily for lead-generation content and ads, not the ordered-product image route.

- Generate the dog scene after payment with ChatGPT Images. Render the four exact lines, signature and paw deterministically outside the image model. A person checks likeness and the complete print file before Teeinblue sends it to Printful. `tools/print-art/` is the dry-run production trial; it cannot confirm fulfillment.
- Keep the current framed print on sale until five varied owner-supplied dog photos pass likeness review, the 12 x 18 file passes print inspection and a physical sample, a real order's photo and words reach the replacement design, the buyer-facing preview describes what is actually delivered, and measured image cost and time preserve the margin.
- A blanket adaptation is a separate product test. Its much larger print area, fabric texture and viewing distance cannot inherit approval from the framed print. Mug and ornament scene art remain later options.

## 11. Done for Sunday (pass or fail)

1. On a real iPhone inside the Instagram app and a real Android phone inside the Facebook app, a new visitor completes the chat with chips only in under 90 seconds and reaches the cart with two gifts.
2. "Something else" with a typed answer returns a reaction and a line within 3 seconds, or falls back cleanly.
3. Each of the four gift templates prints the longest allowed lines (60 characters, 44 for the meaning line, 14-character names, apostrophes) without clipping, checked on Teeinblue's real print file at full size.
4. The all-"Not sure" path produces a warm, complete gift.
5. One real order with at least two gifts goes Shopify > Teeinblue > Printful draft with correct print files (Krish approves the spend). Krish will place it himself once the new page and products are live; it replaces sample order #1001, which he refunded.
6. No em dashes, banned words or HR copy on any page a buyer can reach; the old builder is gone from the live journey; retired products are hidden.
7. Step events arrive in analytics.
8. Krish approves go-live.

## 12. Decisions (made by Krish on 13 Oct)

1. **Prices approved:** Mug $29, Blanket $89, Framed Print $89, Ornament $24, or $19 with another gift.
2. **Approved:** hide the HR poster, its framed version and the pillow at launch (hidden, not deleted).
3. Unframed print at $39 stays off the launch menu (Cowork's recommendation; Krish can add it).
4. **AI:** live Gemini AI in version one, with Krish's key, running through his existing n8n (credential "Google Gemini(PaLM) - Heartside"). Heartside stays on Shopify with no new outside project. Section 5.4.
5. **Approved:** the fulfilment routine, a twice-daily batch check of every order's print file with an AI pre-check that flags problems first. Cowork sets this up; it is not part of the theme build.

Still open: Krish's go-live approval on Sunday, and any spend (test orders). The n8n webhooks were switched on by Krish on 13 Oct (section 13).

## 13. Decision log (append only)

- 2026-10-12: Positioning "Your dog loves you too." and display name "Heartside: Personalized Dog Gifts" (see `POSITIONING.md`).
- 2026-10-13: Krish rejected the HR-review builder and the "areas for improvement" questions; called for an empathetic, AI-powered journey with an animated host.
- 2026-10-13: Launch moved to Sunday 18 October ("aim for 5 days from now").
- 2026-10-13: Product direction: words in the owner's voice about their dog (Krish's pick), then reframed by Krish the same day to gifts given on behalf of the dog to someone it loves, everyday functional gifts.
- 2026-10-13: Concept process: three independent concepts (conversation, recognition deck, print-as-interface), two blind judges; the conversation with Biscuit won, with grafts from the other two. Trace in the Cowork session.
- 2026-10-13: Prototype approved ("I love it"), with two changes: make the choice of gifts obvious, and make Biscuit talk a bit like a dog. Both made in version 7; approved ("love it").
- 2026-10-13: AI drawings from answers deferred to phase two, as illustrations, gated by a five-dog likeness test.
- 2026-10-13: Krish approved the prices, hiding the HR poster, framed poster and pillow, and the twice-daily order check. Live AI stays in version one, as agreed, using Gemini with Krish's key. Krish: "This is a Shopify business": no new outside project. Where the key sits is his call (5.4).
- 2026-10-13: The Gemini key is in Krish's n8n as "Google Gemini(PaLM) - Heartside"; the AI runs through n8n webhooks. Sample order #1001 (the old HR-ring ornament) refunded by Krish; he reorders once the v3 page and products are live.

- 2026-10-13: Krish: "Build the two n8n webhooks and the site against section 11, switch everything on and merge everything to main." Built: the two webhooks are live in n8n (`n8n/README.md`), and the chat is in the theme as `hs3-chat` on hidden templates `?view=gifts` and `?view=landing` (`shopify/README.md`, v3). The live homepage is unchanged: the four gift products don't exist in Shopify yet, and section 7 keeps publishing for Sunday.
- 2026-10-14: Mug direction A chosen ("A"): the dog as a large cut-out on the outward face, the note on the drinker's face in Fraunces at 16pt or larger, and every preview on real product photos.
- 2026-10-15: Mug v3 approved; Shopify mug images replaced with two real-photo images ("yes to both").
- 2026-10-15: Cut-out and Fraunces redesign of the other three gifts judged "okay, pretty standard"; not built.
- 2026-10-15: Every-gift-as-a-letter rejected ("sounds shit").
- 2026-10-15: Krish asked for "10X personalized delight" from the first moment, using the AI edge and the breed corpus. Open.
- 2026-10-20: Krish, on a cart showing "Understands every word. Pretends he doesn't.": "It should be a message from your dog in their personality style... capture their demeanour, cross reference the corpus, and create literally a humanized warm message from the dog to the person with some humour and dog anthropomorphisms. Make sure all products create a warm message." So, on every gift: I, me and my are the dog, you is the person, never he, she or the dog's name, never the person's name, no exclamation marks, no "Dear" (the 15 Oct letter stays rejected; "Love, [dog]" is the only sign-off). Every scripted chip line was rewritten in that voice ("I took your side of the bed. Not sorry."). Compose now runs for every buyer, not only after a typed answer, so the AI writes all four lines as one message; the scripted lines show first and are the fallback. The chat has an optional "Breed, if you know it" field on step 1 (no new step); an exact corpus match sends its archetype to the AI as a light tone signal, never shown. This replaces the 13 Oct "no I" rule and the 15 Oct "no breed question yet".
- 2026-10-22: Krish on the AI's lines: "They all sound like Claude... Two-word sentences stacked against two- or three-word sentences are just a clear tell. It needs to feel heartfelt, real, humanized, but each dog's personality, based on the corpus, shines through in bringing all of the details the users put in into life. A border collie would sound different to a poodle if they were human." The prompt had taught the staccato; it now writes in three layers (who the dog is as a person, from the corpus archetype; what the owner said; one natural sentence per line), and code rejects stacked fragments and worn lines. A blind test of six models on held-out dogs, then a Border Collie, Poodle and Beagle with identical answers, showed the 44-character line left no room for personality. Krish approved: lines up to 60 characters (the meaning line stays at 44 for the ornament), Claude Sonnet writes the whole note, Gemini 3.5 Flash answers typed replies and backs Sonnet up, and the mug prints three lines at 58 px (option A). Cowork raised the Teeinblue Line fields to 61.
- 2026-10-21: Krish: "yes, re-render the product images in the dog's voice". Done the same day:
  - the mug's five note faces were re-rendered the approved way (the print file passes order QC's check);
  - the blanket, the four framed-print images and the two ornament images had only their lines replaced;
  - all are live in Shopify, with each variant on its own image.

- 2026-10-23: Krish moved the physical sample order to the end of the product revamp. The browser's saved photo must be tied to the current gift, and a gift with no customer photo must not add Teeinblue's sample dog to the cart. The choose button now says "Personalize" because it opens a product page; it does not add to the cart.
- 2026-10-23: Krish approved a framed-print visual target: a city screenprint with the customer's recognizable dog as the subject and a small handwritten dog-voice note and decorative paw mark at lower right. A city or meaningful place can be optional, but never inferred from shipping. A test-only full-size composition and a production route are in `tools/print-art/`; the pictured concept is not a live offer or a physically validated print.
- 2026-10-23: Krish approved the rendered three-stop note control on the reveal: Sentimental, Warm with a wink (default), and Hilarious. The model rewrites from the same answers while manual edits stay intact; its breed voice remains a separate signal. The theme, prompt, guard and local browser tests are prepared but the new compose workflow and theme are not yet published. Hilarious must stay affectionate and must not turn grief or a tender answer into a joke.
- 2026-10-23: Krish directed Runway and Higgsfield toward lead-generation content and ads rather than concept brainstorming. The product priority is a repeatable final-art route when orders arrive. Keep the current four-gift route until the generated print route passes identity, print, supplier and purchase checks. The physical sample order is last.

## 14. Next action

Finish the product revamp before the sample order: prove the approved print direction as a repeatable order-time route, validate the note control, product descriptions, photo identity and the US buying path, then seek exact approval for each live theme deployment. The physical sample and full Teeinblue-to-Printful order handoff come last.
