# CoWork audit follow-ups: report, 31 October 2026

Ran from `main` at 499e137 (PR #88 merged). Krish said "go through to 100%", which I took as his yes to steps 2, 3 and 4, with the rename option for step 4. No ids, store handle or credentials appear here.

## Summary
| Step | Result | Verified by readback |
|---|---|---|
| 1 Draft theme check | Done | Yes |
| 2 Publish draft theme | **Done, live** | Yes |
| 3 Note placeholder | Mug done and live. Portrait saved in Teeinblue but **not synced** (blocked by step 4) | Mug yes. Portrait: Teeinblue editor only |
| 4 Portrait handle conflict | Draft renamed. **Not resolved**: the Update still fails the same way. Bear default still not live | Yes, including the failure |
| 5 Teeinblue script on homepage | No setting exists; nothing changed | Yes |
| 6 The Morning Mug | Report only; nothing pressed | Yes |

## Step 1: draft theme check
- "Heartside audit fixes draft" already matched `main`. The last `shopify/` commit (e17dbd4) was pushed at 20:21, and the MD5 checksums of all four changed files match. No push was needed.
- `handle-check --theme <draft> --warn-media`: all clear (18 checks).
- `live-gate --query preview_theme_id=<draft>`: all clear (28 views ok).

## Step 2: publish. Done.
- Before: live theme "Heartside 28 Oct fixes". After: live theme "Heartside audit fixes draft". "Heartside 28 Oct fixes" is kept in the library as the rollback; nothing was deleted.
- Production afterwards: home HTTP 200, page reports the theme "Heartside audit fixes draft".
- `handle-check --warn-media`: **all clear (18 checks)**, exit 0. Before publishing it was also all clear (18).
- `live-gate`: **all clear**, 28 views ok (desk, phone, ig, edge × home, mug, portrait, blanket, catalog, cart, missing).
- Readback at 390 px and 1366 px: on every gift page the title and price sit above "Make one for my dog".
  - Phone: mug title 588, price 638, button 943. Portrait 588, 638, 968. Blanket 648, 729, 1035.
  - Desktop: mug title 139, price 205, button 502. Portrait 139, 205, 527. Blanket 139, 254, 550.
- The memo bar is one line ("Order by December 10 for Christmas delivery..."), 32 px tall.
- The showcase opens with "A set for one dog" (the sets row), then "From a photo to a gift".
- Rollback: Online Store, Themes, "Heartside 28 Oct fixes", Publish.

## Step 3: note placeholder
| Where | Before | After | State |
|---|---|---|---|
| Mug campaign, artwork "Heartside illustrated mug wrap", layer Line 1, Personalization, Placeholder paragraph | Your words from the chat with Buddy | Your note, a line or two | Saved and Update ran (every sync box and all four Variants sub-boxes unticked, Clear cache on). **Live.** |
| Portrait campaign, artwork "Heartside City Screenprint - DRAFT v1", group Small handwritten note, layer Line 4, Personalization, Placeholder text | Your words from the chat with Buddy | Your note, a line or two | Saved in Teeinblue. Update failed (see step 4), so the storefront still receives the old text |

- Readback with the theme's `hs2.js` blocked, so only Teeinblue's own text shows: the mug shows "Your note, a line or two"; the portrait still shows "Your words from the chat with Buddy".
- Readback as a buyer sees it: both pages show "Your note, a line or two", because `hs2.js` line 1652 rewrites any placeholder that mentions "chat" or "Buddy". So buyers already see the right words on both gifts.
- After the Teeinblue saves: the blanket reads "Your Dog's Personality Blanket" at $129, ACTIVE. The mug is $45 and the portrait $59 to $119, titles and handles unchanged. `handle-check --warn-media` all clear (18).
- Rollback: set each placeholder back to the "Before" text and Update with every box unticked.

## Step 4: portrait handle conflict
- Before: the live product "Your Dog's Portrait" has handle your-dogs-portrait, ACTIVE, 4 variants, $59 to $119. The draft "Your Dog's Portrait" had handle heartside-unframed-portrait-reference, DRAFT, never published, tagged not-for-sale.
- Change: the draft's handle is now `portrait-reference-draft-2026-10` (Admin API, no redirect created). Read back: DRAFT, new handle. The live product is untouched.
- The Bear default artwork was already saved in Teeinblue on 30 October (per that day's go-live report), so there was nothing to set again.
- **Portrait Update, every sync box unticked: failed again** with "Shopify errors: Handle 'your-dogs-portrait' already in use. Please provide a new handle."
- **What this means:** the brief's premise was wrong. The draft's handle was not what blocked the Update. Teeinblue is trying to give the handle `your-dogs-portrait` to a product other than the live one, almost certainly the draft that the campaign is linked to. Renaming the draft cannot fix that.
- The real fix is to link the campaign to the live product, or to stop it writing a handle at all. That is a Teeinblue linking decision for the Claude Code session or for Teeinblue support. I did not attempt it.
- After the failed Update, the live portrait is unchanged: title, handle, $59 to $119, ACTIVE. The blanket is at $129. Handle check all clear.
- Note: the live portrait's `updatedAt` is 31 Oct 00:45 UTC, which is between my sessions and not from me. Title, handle and prices all read back unchanged.
- Rollback for the rename: set the draft's handle back to heartside-unframed-portrait-reference.

## Step 5: Teeinblue script on the homepage
- The homepage requests `sdk.teeinblue.com/async.js` (async), on both the old and the new theme.
- Theme editor, App embeds, Teeinblue Personalizer: "This app embed doesn't have customizable settings." Nothing was changed.
- Shopify Sidekick opened on its own in the editor and began "Running code". I stopped and closed it. Save and Undo stayed greyed, and the themes' updatedAt values were unchanged.

## Step 6: "The Morning Mug" (nothing pressed)
- It is the only campaign under "Update required". Teeinblue shows no diff, only "Campaign's changed. Must update to platform."
- It links to /products/the-morning-mug, which is ARCHIVED at $29. The campaign holds $45, the White Ceramic Mug base, and the "The Morning Mug (11 oz, v3)" artwork.
- An Update with the default boxes ticked (Description, Images, Variants, Tags, Product type, Vendor, Title) would write those onto the archived product. Leave it alone, or archive the campaign on Krish's word.

## Open for the Claude Code session
1. Relink the portrait campaign to the live product, or otherwise fix the handle error. Once it is fixed, one Update with every box unticked puts the portrait placeholder and Bear live.
2. The portrait campaign shows $39 while the live product is $59 to $119. Never Update it with Variants or Price ticked.
3. The homepage Teeinblue script can only be avoided in theme code or by the app vendor.
4. Not re-verified this run: the Teeinblue prompt SHA-256 values. Only the placeholder fields were edited.

## Claude Code review (31 October)

Checked from this session, read-only:
- Shopify lists "Heartside audit fixes draft" as the live theme and "Heartside 28 Oct fixes" as unpublished.
- `handle-check --warn-media` is all clear (18 checks).
- The live portrait and the renamed draft read back as the report says.

Step 4 needs one correction. The campaign file the live portrait loads from Teeinblue is "Heartside City Screenprint - DRAFT 2026-10-23", and all four live variants are linked to it.

**What buyers see now:**
- The Photo layer's default is already Bear (the black Labrador in the truck), not the pug.
- Through `hs2.js`, the note reads "Your note, a line or two".

**What the handle error still blocks:**
- Teeinblue's own copy of the portrait placeholder.
- Any later change to the portrait campaign, such as the next painter prompt.

**Likely cause:** the campaign is also linked to the 27 October draft product (its Teeinblue version stamp matches the draft's creation time). Teeinblue pushes the campaign's handle to that product too, so renaming the draft could not help. `docs/review/COWORK-PORTRAIT-LINK.md` asks CoWork to unlink it.

**One finding not in the report:** on the live theme, a variant opened on its own picture (the pink mug, the red oak portrait) while the thumbnail row kept the first thumbnail marked. The mug's four colour thumbnails were also hidden by an older colour-pair rule. Both are fixed in the 31 October theme draft.
