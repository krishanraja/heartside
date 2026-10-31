# CoWork closeout: report, 31 October 2026

This run followed `docs/review/COWORK-CLOSEOUT.md` from `main` at bfdb531.

**Approvals.** Krish approved steps 1, 2, 3, 4, 7 and 8 in chat, right before they ran. On step 5 he asked what is wrong with the current key, so it wasn't done (see below).

**Ground rules held.** No orders were placed, confirmed or cancelled, and n8n was not touched. This report contains no ids, credentials or personal details. Before and after screenshots were taken for each change.

| Step | Result | Verified by readback |
|---|---|---|
| 1. Retire "Your Dog's Portrait" | **Done**, by a safer route (below) | Yes |
| 2. Live campaign keeps its own address | **Refused by Teeinblue.** Exact message below | Yes |
| 3. Edge, City, Update, test design | **Done.** The Update overwrote the live product; repaired within 4 minutes except the gallery (below) | Yes |
| 4. Retire "The Morning Mug" | **Done**, same safer route | Yes |
| 5. Replace the Printful key | **Not done.** Krish asked why first | n/a |
| 6. Delete the probe file | **Not possible here** (below) | Searched |
| 7. Uninstall Spocket | **Done** | Yes |
| 8. Delete two themes | **Done** | Yes |
| 9. Checkout warning (read only) | **Still shows** | Yes |
| 10. Final readback | live-gate all clear, handle-check all clear (18), prices right | Yes |

## Step 1: "Your Dog's Portrait" retired
**What it was linked to:**
- The campaign info page offered "Unlink product from platform". Its confirm box read "Are you sure to remove **your-dogs-portrait**?", naming the *live* portrait's address rather than the draft product.
- I checked Teeinblue's own record of the campaign. It links only the hidden draft product's single variant and none of the live portrait's four.
- Even so, I couldn't rule out a delete by address, so I cancelled that box.

**What I did instead:**
1. Deleted the draft product `portrait-reference-draft-2026-10` (DRAFT, not-for-sale) in Shopify by its exact product ID.
2. In Teeinblue, chose Delete campaign, then **Archive**, with "Remove artworks & product bases" **unticked**, because the artwork is shared with the live campaign.

**Readback:**
- Teeinblue: "Your campaign was marked as archive". The campaign shows Archived.
- The draft product's address returns 404.
- The live portrait is unchanged: handle, ACTIVE, $119 ×3, $59, and its last-updated time is the same.
- handle-check is all clear.

## Step 2: the Edit URL
- **Before:** the live campaign's Edit URL was `https://heartside.io/products/heartside-city-screenprint-draft-2026-10-23`.
- **What I tried:** setting it to `your-dogs-portrait`. Teeinblue refused with: **"Handle already in use in: Your Dog's Portrait"** and the toast "The SEO handle is already in use".
- **Why:** the archived campaign still holds that address, and an archived campaign's editor has no Edit URL control. Nothing was saved, so the live campaign's Edit URL is unchanged.
- **Fix, if wanted:** permanently remove the archived "Your Dog's Portrait" campaign (Delete campaign, then Remove, with "Remove artworks" unticked), then set the Edit URL. That is a new deletion and needs Krish's yes. Until then the handle rule covers every Update.

## Step 3: artwork, Update and test design
**Artwork "Heartside City Screenprint - DRAFT v1"** (saved with Save & Close):
- **Photo layer:** before 0, 0, 3600 × 5400. After: left −12, top −18, 3624 × 5436.
  - The ratio lock is on, so the height followed the width: 5436 rather than the brief's 5424.
  - That keeps the photo at exactly 2:3 and still runs past every edge (12 px on the sides, 18 px top and bottom).
  - Nothing else on the layer and no prompt changed.
- **City layer:** deleted. The personalisation form now has no City field.
- **Blanket after the save:** "Your Dog's Personality Blanket", $129, ACTIVE.

**The Update, and what went wrong:**
- **What I meant to do:** open the Update options arrow and untick every box.
- **What happened:** I clicked the Update button itself. Teeinblue had reset all seven sync boxes to ticked after the page reload:
  - Description
  - Images
  - Variants
  - Tags
  - Product type
  - Vendor
  - Title
- **What it wrote to the live portrait:**
  - title "Heartside City Screenprint - DRAFT 2026-10-23";
  - handle `heartside-city-screenprint-draft-2026-10-23`;
  - prices $89 framed and $39 unframed;
  - the old description that promises a printed note and signature;
  - six new Teeinblue mockups in place of the gallery.

**Repaired through the Admin API** (times in UTC):
- **20:52:** title "Your Dog's Portrait", handle `your-dogs-portrait`, and the prices back to $119 ×3 and $59.
- **20:53:** the description back to the approved 31 October text.
  - I left out the last sentence, "A city is optional.", because City no longer exists.
  - Everything else is word for word, as paragraphs and a list like the mug's.
- **20:55:** recreated the 301 from the title handle to `/products/your-dogs-portrait`.
- **Exposure:** the wrong price and title were live for about one minute. No order or checkout was created in that window (checked).

**Not repaired: the portrait gallery.**
- **What was lost:** on 30 October Claude Code had built a 14-picture gallery:
  - home, studio and hand pictures;
  - Bear in red oak, white and unframed;
  - five more breeds;
  - the set;
  - two hidden references.

  The Images sync replaced it with Teeinblue's six mockups, and the old files no longer appear in Shopify Files. Their source renders aren't in the repo (`tools/realphoto/src/` is ignored).
- **What shows now:** handle-check `--warn-media` is all clear, because every variant has its own picture. The page shows Bear in each frame and one blank held sheet.
- **Two problems with the new pictures:**
  - several alts still say "pug", though the pictures show Bear;
  - the lifestyle and breed pictures are gone.
- **Claude Code needs to:** rebuild and re-attach the portrait gallery from the approved set.

**Also changed by the sync:**
- Tags (`gifts-v3`), product type ("Framed Print") and vendor (Heartside) read back as above; "All gifts" still holds the portrait.
- The variant ids are unchanged.

**Readback:**
- The live personaliser, with `hs2.js` blocked, has **no City field**.
- Bear fills the preview.
- Handle and ACTIVE status are right, and the page says "Unframed $59 · Framed $119" (`closeout-portrait-390.png`).

**Test design** (one credit; Design testing, no order). File: `closeout-portrait-test.jpg`.
- **Inputs:** `golden-puppy-asleep.jpg`, Vintage screenprint, Warm with a wink, and the v17 text.
- **Edges:** the print file is 3600 × 5400 and **fully opaque**: 0 transparent pixels, against 75,600 last time. No edge row or column is white; I checked all four edges and corners.
- **Content:** no text, no strip and no unnamed object. A golden puppy walks towards the viewer in a living room with a plant, a sofa and a cushion.

## Step 4: "The Morning Mug" retired
1. Teeinblue's record linked only the archived product's five variants, not the live mug.
2. I deleted the ARCHIVED product `the-morning-mug` by its exact ID.
3. Then I chose Delete campaign, then Archive, with "Remove artworks" unticked.

**Readback:**
- The campaign shows Archived, and "Update required" now shows 0.
- `/products/the-morning-mug` returns **301** to `/products/your-dogs-illustrated-mug`. The redirect already existed.
- The live mug is unchanged: $45, five colours, ACTIVE.

## Step 5: the Printful key, not done
Krish asked "Just use the current key. What's wrong with it?". The answer is in the chat. Nothing changed.

## Step 6: the probe file
- I searched Printful's File library for "probe" and found nothing.
- Files added through the API as hidden don't show in the dashboard library. The only API route needs a token, which CoWork can't use.
- The file is attached to nothing and costs nothing. Claude Code can delete it with the n8n token if wanted.

## Step 7: Spocket
- Uninstalled from Settings, Apps, with the reason "Not using app now".
- **Readback:**
  - It no longer appears under Installed.
  - The upcoming bill lists only MetaShop (£7.67) and Teeinblue (£37.31); there is no Spocket charge.
- If Spocket has its own account at spocket.co, Krish can close it there.

**Noticed on the same pages:**
- "Printify: Print on Demand" is back in the installed list.
- "Dropshipper-ai" is installed.
- A billing notice says "Function Studio free trial ends in 1 day". That is the $69 a month Krish chose to keep through Christmas.

## Step 8: themes
- The Admin API refuses theme deletion by policy, so I used Online Store, Themes.
- **Deleted:** "Heartside 31 Oct artwork only" (it was no longer processing) and "Heartside 31 Oct showcase draft". Shopify confirmed each with "Theme removed".
- **Library now:**
  - live: "Heartside 31 Oct showcase";
  - unpublished: "Heartside audit fixes draft" (the rollback), "Heartside 28 Oct fixes", "Heartside redesign preview", "Copy of Heartside launch", "Heartside launch" and "Helio".

## Step 9: checkout warning (read only)
- Settings, Checkout still shows: "There were errors during checkout starting October 29, 2026. Some customers have abandoned checkout or were unable to submit orders."
- Nothing was changed.

## Step 10: final readback
- live-gate: **all clear**.
- handle-check `--warn-media`: **all clear (18)**. This includes:
  - `/products/the-morning-mug` returns 301;
  - the portrait title handle returns 301.
- Portrait: "Your Dog's Portrait", ACTIVE, $119 ×3 and $59.
- Blanket: $129, ACTIVE. Mug: $45 ×5. Christmas card: $12, ACTIVE.

## Verified, and not verified
**Verified by readback:**
- Both campaigns are archived and their old products deleted.
- The live products are intact.
- The City field is gone.
- The print file is opaque to every edge.
- Spocket is gone, with no charge.
- The two themes are deleted.
- Both gates are all clear.

**Not verified:**
- A real order's print file.
- That Teeinblue's archive action did nothing further on Shopify beyond what I read back.

## For Krish and the Claude Code session
1. **Rebuild the portrait gallery** from the approved set. It was replaced by the accidental full-sync Update. Fix the "pug" alts at the same time.
2. **The Update menu resets its boxes.** Teeinblue resets all sync boxes to ticked whenever the campaign editor reloads. Before any Update, open the arrow, press "Deselect all", check that every box is clear, and only then press Update. Never click the Update button first.
3. **To stop handle renames for good,** permanently remove the archived "Your Dog's Portrait" campaign (needs a yes), then set the live Edit URL to `your-dogs-portrait`.
4. **Printful key:** Krish's call, after reading the answer in the chat.
5. **The probe file:** Claude Code can delete it through the API, or leave it.

## Claude Code review and repair (31 October 2026)

**The portrait gallery is rebuilt.** It uses the approved 30 October renders, kept from that build:
1. Bear in the black, red oak and white frames, held in a hand;
2. Bear unframed on a wall;
3. the Bear set in one living room (the existing file);
4. Maple, Clover, Bao, Frank and Juno in frames.

Each variant opens on its own Bear picture. Teeinblue's six mockups, with their "pug" alts and a blank held sheet, are detached. The live portrait page shows the red oak picture for the Red Oak variant. handle-check `--warn-media` is all clear (18).

**Standing rules from this run:**
- **Teeinblue resets every sync box to ticked whenever the campaign editor reloads.** Before any Update, open the arrow, press "Deselect all", see every box clear, then press Update. Never click the Update button first. An Update with every box ticked overwrites the live product's title, handle, prices, description and gallery.
- **After any portrait Update,** restore the handle `your-dogs-portrait` and the 301 from the title handle, then run handle-check, until the archived "Your Dog's Portrait" campaign is removed for good and the live campaign's Edit URL is set to `your-dogs-portrait`.
