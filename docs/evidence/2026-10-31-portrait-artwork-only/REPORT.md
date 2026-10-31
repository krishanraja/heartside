# CoWork portrait artwork-only: report, 31 October 2026

This run followed `COWORK-PORTRAIT-ARTWORK-ONLY.md` from `main` at 29f3555. Krish approved steps 2, 3 and 5 in chat. No orders were placed, confirmed or cancelled, and nothing went into a cart. Printful and n8n were not touched. This report contains no ids, credentials or personal details.

| Step | Result | Verified by readback |
|---|---|---|
| 1. Read the layers | Done | Yes |
| 2. Remove the strip and the words | **Done** | Yes |
| 3. Update the live campaign only | **Done.** The Update renamed the product's handle; it was restored within about 3 minutes | Yes |
| 4. Test painting | **Done.** It fills the print, with no strip and no text | Yes |
| 5. Retire "Your Dog's Portrait" | **Not done. It needs a fresh yes** (see below) | Current state read |
| 6. Final readback | live-gate **all clear**, handle-check **all clear (18)**, 390 px page clean | Yes |

## Step 1: layers, before
The live campaign is "Heartside City Screenprint - DRAFT 2026-10-23", which uses the artwork "Heartside City Screenprint - DRAFT v1" on the 12″×18″ print area (3600×5400).

| Layer | Kind | Buyer fills it? | Where it sat | Printed? |
|---|---|---|---|---|
| Photo ("Your dog's photo") | AI photo | Yes | 0,0, 3600×5400 (full print) | Yes |
| Note paper and decorative paw | Static image (the paw is part of it) | No | 0,4660, 3600×740 (bottom strip) | Yes |
| Line 1, Line 2, Line 3 | Paragraph | No | Off the canvas | No |
| Line 4 ("Your note") | Text | Yes | 3320,4905 | Yes |
| Signed ("Love, Milo") | Text | No | 3140,5115 | Yes |
| Dog's name | Text | Yes | Off the canvas | No |
| City | Text, optional | Yes | Off the canvas | No |

The groups were "Dog and city" and "Small handwritten note". The prompt-feeder fields were Artwork style, Artwork tone, Personality, Tone direction, Style direction and Energy.

**City:** it doesn't print, because it sits off the canvas, and the Photo prompt doesn't reference it. It stays as an optional buyer field ("Optional city or neighborhood"). Whether to drop it is a theme and design call for the Claude Code session.

## Step 2: layers, after
- **Deleted:** Dog's name, Signed, Line 4, Line 3, Line 2, Line 1, and "Note paper and decorative paw". The "Small handwritten note" group is now empty.
- **Untouched:** Photo, City, all the prompt feeders, and the Photo prompt.
- The Photo layer was already full-print (3600×5400), so the painting now fills the whole 12×18.
- Saved with Save & Close. Before and after screenshots were taken.
- **Rollback:** Teeinblue's artwork History.
- **Note:** "Your Dog's Portrait" shares this artwork, so it changed too. That campaign isn't Updated, so its draft product is unaffected.

## Step 3: Update
**What I pressed:** Update on "Heartside City Screenprint - DRAFT 2026-10-23" only, with every sync box unticked (including all four Variants sub-boxes and Price) and Clear cache on. Teeinblue showed no error.

**Side effect, fixed:** the Update renamed the live product's handle to the campaign title, `heartside-city-screenprint-draft-2026-10-23`, and handle-check reported 5 of 17 checks broken.
- I set the handle back to `your-dogs-portrait` through the Admin API.
- I recreated the redirect from the old title handle to `/products/your-dogs-portrait`.
- handle-check went back to all clear. The address was down for about 2 to 3 minutes.
- Title, ACTIVE status and prices didn't change.
- **Lesson for the Claude Code session:** any Update of this campaign renames the handle again. Plan the handle restore into every future Update, or find the campaign's Edit URL setting.

**Readback after the Update:**
- **Live portrait:** "Your Dog's Portrait", handle `your-dogs-portrait`, ACTIVE. Framed is $119 (Black, Red Oak, White) and Unframed is $59.
- **Live personaliser:** I read it with `hs2.js` blocked so Teeinblue's raw fields show. It has the style and tone choices, three "For example…" toy and accessory fields, "Optional city or neighborhood", the photo, Qty and Search. **There is no note, signature or name field.**
- **Bear is the default:** the black dog in the red bandana fills the whole framed preview, with no strip. I checked this in Teeinblue's design-test preview and on the live page at 390 px.
- **Blanket:** "Your Dog's Personality Blanket", $129, ACTIVE.

## Step 4: test painting (file `portrait-artwork-only-test.jpg`)
This used one Teeinblue credit, through Design testing. No order was made.

**Inputs:**
- Campaign: "Heartside City Screenprint - DRAFT 2026-10-23", Framed.
- Photo: `assets/photos/golden-puppy-asleep.jpg`.
- Style: Vintage screenprint. Tone: Warm with a wink.
- The Style, Tone and Energy text was the v17 engine's own composition for screenprint, warm and portrait.

**Result:**
- **It fills the print.** The painting runs edge to edge across the full 3600×5400 file.
- **No strip, empty patch or text.** The top and bottom both carry the scene (a cream wall and window at the top, a green rug at the bottom).
- **No unnamed object.** The dog, a golden retriever puppy, walks towards the viewer in a living room with a sofa, a cushion, a plant and a side table. There's no toy, clothing or prop. The likeness reads as golden and warm, and the screenprint medium is right.
- **One small finding:** the file has a **7 px transparent column on the left and right edges** (0.2% of the width each side), so the painting is 3586 px wide inside 3600.
  - The likely cause is the Photo layer's "Base on layer's ratio" rounding.
  - A frame's lip probably hides it. On the Unframed print it may show as a hairline white edge.
  - The fix would be to widen the Photo layer slightly past the canvas edges. I haven't changed it; it's yours or the Claude Code session's call.

## Step 5: retiring "Your Dog's Portrait": stopped, needs a fresh yes
- **What it's tied to:** the old draft product "Your Dog's Portrait", handle `portrait-reference-draft-2026-10`, DRAFT, Poster. Buyers can't see it already.
- **Why I stopped:** Teeinblue only retires a published campaign in two ways (support article, linked below). Both delete a Shopify product.
  1. **Unpublish:** campaign info, then "Unlink product from Shopify". This "will remove the correspondent product from Shopify", meaning the old draft product.
  2. **Delete campaign, then Archive:** the article recommends unpublishing first, and it's unclear what happens to the product if you don't.

  The list menu offers no plain archive for a published campaign, only Delete. A deletion needs your explicit yes right before it, so I left everything as it was.
- **What to approve, if you want it gone:** "Unlink product from Shopify" on "Your Dog's Portrait", which deletes the old draft product. Then "Mark as archive". The live portrait isn't linked to this campaign and wouldn't change.
- **One thing to know:** on my way to campaign info I opened the live campaign's editor by mistake. I left it without saving or pressing anything, and the readbacks above were taken afterwards.

## Step 6: final readback
- **live-gate:** all clear.
- **handle-check `--warn-media`:** all clear (18 checks). The old title handle `/products/heartside-city-screenprint-draft-2026-10-23` returns 301 to `/products/your-dogs-portrait`.
- **Portrait page at 390 px** (`portrait-390-after.png`): Bear fills the framed print, with no strip. "Your Dog's Portrait", $119, "Unframed $59 · Framed $119".
- **Wording on the page:** the only "Your note" text is the description line "Your note comes in the box, and on a free digital card", which is correct. Neither "Love, …" nor a "Dog's name" field appears.

## Verified, and not verified
**Verified:**
- The layers are gone.
- The live personaliser has no note, signature or name field.
- The painting fills the print in a real test design.
- Handle, prices and status are intact.
- Both gates are all clear.

**Not verified:**
- A real order's print file from the live store. Krish's live order proves this.
- How the 7 px edge looks on the Unframed print.
- Retiring the stray campaign, which needs a yes.

## For the Claude Code session
1. **Every Update renames the handle.** Any future Update of the live portrait campaign renames its handle to the campaign title. Build the restore and redirect into the procedure.
2. **The 7 px edge.** Widen the Photo layer slightly past the canvas, then run one more test design.
3. **The mug.** The mug's Tone direction still reserves note space (see the release report). The portrait is now clean.
4. **City.** It is an optional buyer field that neither prints nor feeds the prompt. Keep it or drop it.

Source: [Teeinblue, How to archive or delete a campaign](https://support.teeinblue.com/en/article/how-to-archive-or-delete-a-campaign-1emfijs/)

## Claude Code review (31 October 2026)

Checked independently after the run:
- **Shopify:** "Your Dog's Portrait" is at `your-dogs-portrait`, ACTIVE, with Framed $119 in three frames and Unframed $59. The $12 card is ACTIVE.
- **The address:** `/products/your-dogs-portrait` returns 200, and the old title handle returns 301 to it.
- **handle-check `--warn-media`:** all clear, 18 checks.

The report's item 3 (the mug's note space) was already fixed before this run: painter v16 is live.

**Standing rule from this run:** every Teeinblue Update of "Heartside City Screenprint - DRAFT 2026-10-23" renames the live portrait's handle to the campaign title. After any such Update, set the handle back to `your-dogs-portrait`, keep the 301 from the title handle, and run `handle-check --warn-media` before calling it done.
