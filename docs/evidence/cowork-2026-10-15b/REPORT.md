# Cowork, 15 October (evening): launch prep and the five asks

Read with `docs/COWORK-HANDOVER-2026-10-15.md`. Nothing here was published, spent, deleted or changed in a live system.

## 1. Sunday go-live: ready, with one blocker

**State checked in Shopify admin (read-only, 15 Oct):** the four gifts are Draft with one channel each; The Annual Review, The Annual Review Framed, The Body Double and Tiny Me, For The Tree are Active; the only order is #1001 (refunded, unfulfilled, the old ornament). The mug's two real-photo images are on the product.

**Blocker for Part C's QC check.** The scheduled task "Heartside order QC" has no connectors attached, and this account's Shopify connector asks to sign in again. As things stand, the next run stops with "Order QC couldn't run" and Krish's order would get no `qc-pass` tag. Fix before Sunday (only Krish can do this):

1. Reconnect Shopify at https://claude.ai/customize/connectors.
2. Open the scheduled task "Heartside order QC" and add Shopify to it.

The runs are at 07:56 and 16:56 London. #1001 is an ornament only, so the QC lists it as "not checked" and tags nothing.

**Run order on Krish's "go live"** (Part B of `docs/COWORK-PROMPT-2026-10-14-V3.md`, each step on its own yes):

| # | Step | Who | Check that proves it |
|---|---|---|---|
| 1 | Set the four gifts Active on the Online Store | Cowork, on Krish's yes | Products list shows Active; `/products/the-morning-mug` opens on heartside.io |
| 2 | **Mug check A, Line 1 rows.** On the Active mug page, fill Line 1 with "Waits at the door for you, weekends too." through the chat | Cowork | Teeinblue preview shows two rows, "Waits at the door for" / "you, weekends too." If it shows one long wrapped row, the Line fields are one-line boxes: tell Claude Code (the bridge then sends the line unbroken and Teeinblue wraps it) |
| 3 | **Mug check B, photo handoff.** From the chat to the mug page, tap the photo field | Cowork | Teeinblue's Reposition popup opens on the real mug with the chat's photo already in it, and Save closes it with the dog cut out on the preview |
| 4 | Homepage swap | Claude Code, on Krish's go | Claude Code says the deploy finished; heartside.io opens on the chat |
| 5 | Set the four old products to Draft | Cowork, on Krish's yes | They no longer open on heartside.io; reviews still in admin |
| 6 | Cart test: Mug + Ornament shows the ornament at $19; Ornament alone $24; line titles clean; empty the cart | Cowork | Screenshot of each cart |
| 7 | Chat to two product pages; fields hold the lines, "Love, [dog]" and the name | Cowork | Screenshot of each Teeinblue form |
| 8 | Real phones: Instagram app on iPhone, Facebook app on Android | Krish | His screenshots |

**Part C, Krish's order:** at least two gifts, one the ornament. Then check `_hs_answers`, `_hs_lines` and `_hs_ship_to` on the order, the order in Teeinblue, and a Printful **draft** (not confirmed). The next QC run should tag it `qc-pass` with one note line; read the order back to confirm.

**Part D, launch week:** daily, the share of "Heartside AI calls" rows with `source` = fallback or `slow` = true (tell Claude Code above 1 in 10, with times, `step` and `model`); Gemini spend once mid-week. Teeinblue's trial ends 19 Oct on the Blue plan ($49 a month).

## 2. Biscuit draws the moment: the bake-off

**The idea in one sentence:** when the chat ends, Biscuit draws the buyer's dog in the moment they described, from their own photo, and that drawing goes on the gift.

**Cost, before anything runs.** One illustration style (soft gouache, cream ground, only the dog), five dogs, each drawn in its own moment from a real chip answer, two tries per engine:

| Engine | Where | Price per image | 10 images |
|---|---|---|---|
| Google's Nano Banana Pro (Gemini 3 Pro Image) | Higgsfield | 2 credits (preflighted) | 20 credits |
| OpenAI GPT Image 2.5 | Higgsfield | 0.25 credits (preflighted) | 2.5 credits |
| Gemini's newer image model on Krish's own key, for the live build | n8n | about $0.05 at 2K (Google's price page) | about $0.50 |

Total: about 22.5 of Krish's 2,275 Higgsfield credits, plus about 50 cents of Gemini if run on the n8n key. Runway is held back: its tool has no price preflight, and Higgsfield already covers Google's and OpenAI's models. It comes in only if both fail.

**What the bake-off needs from Krish:** five real dogs whose owners would know them anywhere (his own, friends', family's), three phone photos each, and for each the answer they'd give to one chat question (for example "Steals your side of the bed"). Stock dogs can't be judged on "is that my dog?".

**What Krish will see:** each drawing on the mug (both faces) and the ornament on Printful's photos, at phone size, one board per dog, with the photos beside it. Pass if four of five get "that's my dog".

## 3. Biscuit's mug reasons, one per "together" answer

For `reasonFor('mug')` in `shopify/assets/hs3.js`. `{dog}` and `{rec}` are `n.dog` and `n.rec`. Each one only repeats what the buyer picked; none claims coffee, walks or a morning routine they didn't choose. The longest, with 14-character names, is 121 characters (spec limit 140). A typed "together" answer uses `skip` unless compose returned its own reason.

| `S.together` | Reason |
|---|---|
| `walk` | {dog} lives for the morning walk. Good dog. The mug keeps {dog} with {rec} for the rest of the morning. |
| `coffee` | {dog} already keeps {rec} company over coffee. Now {dog} gets to be on the cup too. |
| `movie` | {dog} has movie night covered. The mug is for mornings, so {rec} gets {dog} with every cup. |
| `naps` | {dog} naps best with {rec} around. The mug keeps {dog} close for the awake parts. |
| `car` | {dog} would ride anywhere with {rec}. With the mug, {dog} comes along to every morning cup too. |
| `skip` | {dog} goes on one side, the note on the other. So {rec} starts every morning with both. |

## 4. The two Shopify mug images: re-rendered with the new curve, ready to replace on Krish's yes

Re-rendered with `tools/realphoto/shopify_mug_images.py` as merged in 2583034 (each row's rise at the edge grows from 19.8 px at the top of the print to 57.2 px at the bottom). The print file is a rebuilt copy of the approved one: Biscuit's sample cut-out, the three lines and "Love, Biscuit"; it passes `tools/qc/mug_qc.py` at 1.00 on every check. Boards: `mug-images-before-after-phone.jpg` (both faces at 390 px, live above, new below) and `row-compare.jpg` (the note face close up). The lower rows now bow with the mug's base, as on Printful's photo.

Replacing them is a Shopify change: on Krish's yes, upload the two new images, make the dog face the featured and variant image, then delete the two old ones (MediaImage 71718546637182 and 71718546669950). Untick Images on any Teeinblue Update.

Note for the next run: Printful's CDN is blocked from the cloud session, so the shaded mockup bases were rebuilt from the committed Teeinblue mockup files (`mk-*-base.png` plus `mk-*-shade.png`).

## 5. Breed gaps

Rows added to `breeds-corpus/us_lookup_additions.csv` (13) and `us_display_names.csv` (7). **Claude Code:** run `node build.mjs`, and change the count in `test.mjs` ("every query in us_lookup_additions.csv") from 31 to 44. With that change all 10 tests passed in a local run.

- Now found: Bloodhound, Great Pyrenees (also "pyrenees", "great pyr", "pyr", "pyrenean mountain dog"), Saint Bernard ("st bernard", "St. Bernard"), Samoyed ("sammy"), Dalmatian, Portuguese Water Dog ("pwd"). Papillon now shows "Papillon".
- Left on purpose to fall back to "we don't know" (`exact: false`): Miniature American Shepherd, American Bully, "bully", Catahoula, Plott Hound, Treeing Walker Coonhound, Black Mouth Cur, Mountain Cur, "doodle". The corpus has no row for any of them, and pointing them at a near breed would show the buyer the wrong name.
- **"pit" on its own:** recommend adding it to Krish's Pit Bull call in `build.mjs` (`KRISH_CALLS`), beside "pit bull", "pitbull" and "pittie". Krish's call to extend.

## 6. V3 mirrored to Drive

See SYNC.md "Last synced".
