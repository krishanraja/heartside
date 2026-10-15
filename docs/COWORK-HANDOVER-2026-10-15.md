# Cowork handover, 15 October 2026

Written by the Cowork session that ran 14 to 15 October, at Krish's request, to start a fresh session. It carries the north star, what Krish rejected and why, the exact state of the store, and what comes next. Read it with `docs/V3-GIFTS-FROM-YOUR-DOG.md`. V3 stays the source of truth for the product; this file adds what changed since and the open question it leaves.

## Start the next session with this prompt

> Read `docs/COWORK-HANDOVER-2026-10-15.md` in krishanraja/heartside, then `docs/V3-GIFTS-FROM-YOUR-DOG.md` sections 1, 2, 6 and 10. Then work through section 5 of the handover, in order. Bring me one idea at a time: say it in one sentence and show it on real product photos. Ask me before anything that publishes, spends, deletes, or changes prices, discounts, policies, checkout or permissions.

## 1. The north star

From V3 (13 Oct), unchanged: **your dog gets the person it loves a gift, and Heartside helps it say what only you two know.** The buyer should feel, in order:

1. "Oh, that's fun."
2. "It's actually listening."
3. "That's exactly them."
4. "I want all of these."
5. "I have to show someone."

What Krish added on 15 Oct, in his words:

> "I want this to feel as personal from the get go as possible. Some of it is Claude Code wiring in that data properly to the chatbot, but how can we enable 10X personalized delight knowing you and I have the AI edge over any other business doing similar things?"

He named the tools on hand: Canva, Higgsfield, Runway, ChatGPT and more, plus the breed corpus in `breeds-corpus/`.

What that asks for: from the first minute, a buyer sees their own dog and their own story turned into a gift that no template shop could have made. It has to feel like one idea, and every AI tool used must have a clear job in it.

This question is open. Nothing in this file answers it. Section 4 lists what is proven possible, so the next proposal starts from facts.

## 2. What Krish rejected in this session, and what follows

| What was proposed | Krish's words | Rule for the next session |
|---|---|---|
| The mug as first built: a flat drawn mockup, a 1.5 in circle photo, Courier at 12pt | "These screen grabs are terrible. They wouldn't look like that on a mug. The font is also ridiculously poor ... Can the mug not have a better picture than just a circular one?" | Every preview is shown on a real product photo, both faces where there are two, at phone size, before Krish sees it. Print files are tested at full size with the longest and shortest words. |
| The blanket, print and ornament redone like the mug: a bigger cut-out dog, Fraunces instead of Courier, same layout (`docs/evidence/cowork-2026-10-15/explored-not-approved/three-gifts-cutout-redesign.jpg`) | "They're okay, pretty standard." | Better type and a bigger photo are a quality fix. They don't make a gift personal. The next proposal must show something only this dog and this household could have. |
| A five-part plan: breed questions, a letter format, an in-chat cut-out, an animated video made with Higgsfield, and breed drawings | "This plan is all over the shop, so fragmented." "I can't understand why exactly you will need Higgsfield here?" | Bring one idea. Name a tool only where it does a job in that idea. |
| Every gift as a letter: "Dear Linda," with the lines in the dog's own voice (`letter-direction-REJECTED.jpg`) | "That sounds shit to me." | Don't revive it. It also broke V3 section 2: gift lines never use "I". |
| (A process failure, not a proposal) | Krish replied "1. yes" and in the same message asked "So your plan with AI is to make every gift a letter? Is that it?". Cowork took the "yes" as approval. Krish: "did I say I was ok with every gift being a letter? ... I was actually saying that in disgust" | When a reply pairs a yes with a challenge, treat it as a question and confirm before building. |

What Krish approved in this session:

- **"A"** (14 Oct): the mug design with the dog as a large cut-out on the outward face and the note on the drinker's face, in Fraunces at 16pt or larger, previewed on real product photos.
- **"yes to both"** (15 Oct):
  - the rebuilt mug as shown
  - replacing the mug's Shopify image with two real-photo images

How Krish wants proposals (from his saved preferences):

- a decided recommendation he can react to, not a list of open questions
- the bigger the change, the more it has to be shown visually
- plain sentences: no "not X, but Y" and no staccato either/or lines

## 3. State of play, 15 October

All four gift products are **Draft** in Shopify. They use the `gift` template, are tagged `gifts-v3`, and ship in the General profile.

| Gift | Shopify product | Price | Teeinblue campaign | Artwork | Design state |
|---|---|---|---|---|---|
| The Morning Mug | 16132766630270 | $29 | 1043122 | #1353995 | Rebuilt and approved (below) |
| The Couch Blanket | 16132987552126 | $89 | 1043153 | #1354037 | Round-one design |
| The Framed Print | 16132988535166 | $89 | 1043167 | #1354014 | Round-one design |
| The Tree Ornament | 16132989059454 | $24 ($19 with another gift) | 1043174 | #1354002 | Round-one design |

The round-one design is a circle photo, the dog's name in Fraunces SemiBold and the lines in Courier Prime, previewed on drawn mockups (Printful's frame photos for the print). It fits 45-character lines. Krish has not judged it.

**The mug as rebuilt** (full spec in `docs/evidence/cowork-2026-10-15/mug-v3-handoff-for-claude-code.md`):

- **Print file.** Two faces on the 2700x1050 file:
  - At x≈585, the outward face (seen with the handle on the left): the dog as a cut-out. The photo layer is 900x1000, uses Teeinblue's free "Remove background", and fits with Photo Reposition set to "Contain", so no dog is ever cropped. A 160 px soft fade sits at the bottom.
  - At x≈2115, the drinker's face: three lines in Fraunces Text at 70 px (16.8pt) and "Love, [dog]" in Fraunces Italic, chestnut, with the paw.
- **Shop preview.** Teeinblue shows two mockups built from Printful's photo of the actual mug, with real shading. The dog face loads first. The photo-position popup also shows the real mug. The artwork's sample photo is Biscuit as a cut-out.
- **Shopify images.** Image 1, the dog face (MediaImage 71718546637182), is featured and is the variant image. Image 2 is the note face (MediaImage 71718546669950). The old drawn image was deleted on Krish's yes.
- **Account-wide setting.** On 14 Oct, Cowork set Teeinblue's background remover to Teeinblue's built-in service (free, per Teeinblue's help article). Before that, no remover was selected and print files with the effect never rendered.

**Store settings done in rounds one and two** (details in `docs/evidence/cowork-2026-10-15/report-round1-2026-10-14.md` and `report-round2-...`):

- **Discounts:** the "Ornament with another gift" automatic discount ($5 off; DiscountAutomaticNode 2438364365182), and free US shipping with no end date.
- **Privacy policy:** the AI paragraph is live; automated policy is off.
- **Funnel pixel:** 331481470, matching `shopify/pixels/hs2-funnel.js`.
- **Teeinblue form:** fields in order, photo first.
- **Teeinblue plan:** Blue, $49 a month. The trial ends 19 Oct; first bill is due around launch day.
- **Chat:** checked on desktop and at phone size on 14 Oct; it passed.

**From `docs/COWORK-PROMPT-2026-10-14-V3.md`, still to do:**

- Part B: the Sunday go-live, only after Krish says "go live".
- Part C: Krish's real order.
- Part D: daily checks in launch week.

## 4. What is proven possible (facts for the next proposal)

- **The chat already learns more than the gifts print:**
  - the recipient's first name and relationship
  - the dog's name and pronoun
  - four answers about home, spot, together and meaning
  - typed answers through Gemini
  
  The approved prototype's paper note says "For Sam". No Teeinblue template prints the recipient's name today.
- **Breed is not asked at all yet.** The corpus can identify most US breeds once the additions in this commit are applied. It holds no owner-recognisable habits. See `breeds-corpus/AUDIT-2026-10-15.md`.
- **Teeinblue (tested this session):**
  - **Photos:** background removal (free, built in); "Contain" fit so the whole dog shows; soft-edged shape masks; any uploaded font.
  - **Words:** it keeps a typed line break.
  - **Previews:** mockups can have a perspective print area, a band mask and a shading layer on top.
  
  It cannot wrap a design around a cylinder in the preview; the flat version is within about 10% at the edges. Its "Gen AI Effect" and paid removers need a connected service and credits.
- **Higgsfield and Runway** already have one job written into V3 section 10: a phase-two AI illustration of the buyer's dog. It is gated by a five-dog "is that my dog?" bake-off on Krish's credits, and needs his OK before it runs.
- **The real-photo check is now repeatable:** `tools/realphoto/`. It wraps actual Teeinblue print files onto Printful's product photo of the same mug, and builds the Teeinblue mockup images and the Shopify images.

## 5. What's next, in order

1. **Agree with Krish what launches Sunday.** Cowork's recommendation: launch all four, with the mug as rebuilt and the other three as they are. They print correctly, and the Christmas order cutoff (Dec 10) rewards selling early. Then land the personal idea in launch week. Teeinblue design changes apply without republishing. Counterpoint: Krish called the improved versions "standard", so he may prefer to hold the three until they are better.
2. **Answer the north-star question with one idea** (section 1). Start from section 4. Show it on real product photos for at least two different dogs. Krish decides.
3. **Get the breed data where it needs to be:**
   - **Claude Code:** load `breeds-corpus/us_lookup_additions.csv` as an overlay. Use `us_display_names.csv` for every name a buyer sees. Follow the corpus readme's matching rules.
   - **Krish:** decide how "Pit Bull" maps.
   - **Cowork:** write any breed habit content only after step 2, so it serves the agreed idea.
4. **Claude Code, now (independent of step 2):**
   - **Even line breaks:** when a line won't fit one row, replace the space at the most even break with `\n`. That's about 24 to 26 characters per row at 70 px in an 860 px box; "Steals your side of the bed." (858 px) still fits one row.
   - **Mug preview tab:** make the chat's mug tab match the new mug: cut-out dog, Fraunces, paw left of the signature.
   - **Photo handoff:** re-check it on an Active mug. The photo field now opens Teeinblue's Reposition popup with a Save button.
   - **Two round-two notes:** where the paw sits, and typed lines that start "He ...".
   - **The breed overlay** (step 3).
5. **Rebuild the blanket, print and ornament to the agreed idea,** to the mug's standard. Test print files with the longest and shortest words and render them on Printful's photos. Ask before replacing any Shopify image.
6. **Sunday:** Parts B, C and D of `docs/COWORK-PROMPT-2026-10-14-V3.md`, starting only on Krish's "go live".
7. **Housekeeping:**
   - Add the dated decisions below to V3 section 13.
   - Update V3 section 6: the mug now uses Fraunces, not Courier.
   - Mirror V3 to Drive as `docs/SYNC.md` describes (upload the new copy, move the old one to Superseded, never delete).

Decisions to add to V3 section 13:

- 2026-10-14: Mug direction A chosen ("A"): the dog as a large cut-out on the outward face, the note on the drinker's face in Fraunces at 16pt or larger, and every preview on real product photos.
- 2026-10-15: Mug v3 approved; Shopify mug images replaced with two real-photo images ("yes to both").
- 2026-10-15: Cut-out and Fraunces redesign of the other three gifts judged "okay, pretty standard"; not built.
- 2026-10-15: Every-gift-as-a-letter rejected ("sounds shit").
- 2026-10-15: Krish asked for "10X personalized delight" from the first moment, using the AI edge and the breed corpus. Open.

## 6. Where everything is

- **This commit:**
  - this file
  - `breeds-corpus/AUDIT-2026-10-15.md`, `us_lookup_additions.csv`, `us_display_names.csv`
  - `docs/evidence/cowork-2026-10-15/`: the round reports, the mug spec, images of the mug as built, and the explored work Krish did not approve, labelled
  - `design/teeinblue/mug-v3/`: every file uploaded to Teeinblue for the mug
  - `tools/fonts/HS-Fraunces-*.ttf`: the static Fraunces cuts uploaded to Teeinblue
  - `tools/realphoto/`: the scripts
- **Live copies:**
  - Teeinblue holds the artworks, masks and mockups.
  - Shopify holds the product images.
  - Printful's own product photos are fetched by URL (see `tools/realphoto/README.md`).
- **Hard rules (unchanged):**
  - Teeinblue "Update" overwrites Shopify, so untick Description, Images, Title and Tags every time.
  - "Auto confirm order" stays off, and Printful stays on manual confirm.
  - No orders except Krish's own.
  - Don't edit the theme code or use the theme editor.
  - No em dashes, no exclamation marks in body copy, US spelling.
  - Customer email: krish@heartside.io.
