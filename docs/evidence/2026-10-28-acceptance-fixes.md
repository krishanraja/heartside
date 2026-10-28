# The 28 October acceptance fixes (Track A)

Date: 28 October 2026. Source of truth for the code: PR #65, merged to `main`. Nothing here is live until CoWork runs [the live acceptance prompt](../review/COWORK-LIVE-ACCEPTANCE.md) on Krish's computer. Merging does not deploy.

## What was found

On 28 October CoWork ran five mock orders through Shopify's test gateway.
- Four went through. The fifth, on Android, failed because the photo never added.
- Krish then recorded a narrated Android walkthrough (F01 to F12).
- His fix prompt listed 19 items as Track A, to fix and ship now, and the new one-screen journey as Track B, mock-ups first.

The evidence read for the fixes:
- Krish's labeled stills, all four order recordings frame by frame, and his source video at four frames a second around the photo failure.
- The test orders, read only.
- A read-only audit of the live store at 360×640 (Android Edge), 390×844, 1280×900 and 1620×889.
- Eight code investigations, each tied to file and line.

The causes, the ones that mattered most first:

| Item | Cause |
| --- | --- |
| Android photo never added | The journey button only scrolled. Teeinblue's field caught the pick, the store checked it, and any non-success cleared the field. The outcome was written into a box above Teeinblue's form, off screen. A designed refusal and a real failure both looked like nothing happened. Hardened at the same time: an uncapped full-size PNG re-encode, a 19 MB detector loaded on scroll, no decode timeout, a redrawn input dropped silently, and a stale upload lock after a tab discard. |
| Redo shipped the old design | The checkout picture's registration returned 503 just after painting, failing the add, and the words landed off screen. Also latent: `render()` turned an empty redo key into "undefined", the redo link carried every cart parameter, and a reload reset the paid painting. |
| Long names printed cut | The chat box stopped at 14 with no hint, a link allowed 40, and `possessive()` doubled a trailing apostrophe. |
| "hopefully some toast" | A hard-coded chip reaction and a prompt example list. The guards checked only numbers and capitalized words. |
| Typed answers raw, "Not sure" as a fact | Typed answers were stored and shown exactly as typed (27 Oct). The AI's own "Not sure" chip became a fact. |
| The hedgehog missing | The toy reached the prompt, but the Sentimental tone had no line saying to show a stated toy, and the negative leaned against props. |
| Two confirmations | Our "Yes, this is <dog>." never ticked Teeinblue's "responsible for my personalization" box. |
| Checkout blank thumbnail | Shopify on Basic draws a nested line with its variant's picture, set to the blank supplier base on 27 Oct. |

The recordings also showed:
- the note changing after the buyer read it, and the tone not carrying;
- a crop dialog opening by itself, and three confirmations at once;
- the cart drawer pushing the page, and the bundle price hidden;
- "Last step." while five steps remained, and the product page flashing the direct-visit card;
- the thank-you page thanking the recipient.

## What changed

Rulings (Krish, 28 October), also in the commit bodies:
- A cross gets a breed energy only when both parents match.
- Typed answers are tidied for display and the painter.
- Chat names in all caps or all lowercase are recased; direct-visit typing is left alone.
- The on-device photo check gets a 10-second limit, then the photo goes on; HEIC is refused with guidance.
- Heartside's one tick covers Teeinblue's agreement box.
- The checkout merge app is kept through Christmas.
- Track B paints Buddy's pick first, then more gifts.

**Photo**
- Every outcome shows under the button tapped and right after the photo field.
- Buddy's card opens the picker in one tap.
- Uploads are capped at 4096 px as JPEG 0.92, metadata removed.
- The detector loads only after a pick, and the whole check, the dog check included, fails open after 10 seconds.
- Getting a photo ready gives up after 20 seconds, says so in plain words and frees the upload.
- HEIC is refused with plain guidance.
- A redrawn input is re-resolved, and lock stages go `preparing`, then `sent`.
- A saved photo shows as one card.
- `?hsdebug=photo` gives an on-screen log.

**Add and redo**
- The 503 is retried inside the existing budget, polling only.
- Progress words show beside the button.
- The redo is confirmed from `/cart.js`, and both designs stay until the buyer chooses.
- Empty keys never become "undefined", and the redo link carries handle, variant and id only.
- "All 3 gifts" shows only from the add that finished the list.

**Names, breed, words**
- Names: a count from 11 letters, short forms over 14, `?dog=` clamped to 14, chat names recased.
- Breed: a type-ahead from the corpus. The cross rule gives Maltipoo, Peekapoo and Pomsky an energy and no other named cross.
- Typed answers are tidied (`tidy()`). Non-answer chips are dropped, and follow-up facts kept only when answered.
- Buddy cannot name a food, toy, object or place the buyer didn't, in n8n and in the browser, and his chat never uses "!".
- One tone state runs from the slider to the painter, and "they" is used until a pronoun is tapped.
- A new prompt spec (`tools/print-art/teeinblue/PROMPT-SPEC-2026-10-28.md`, recipes v6) makes a stated toy or accessory always appear.

**Layout**
- The first screen's button is in view at 360×640 Edge, and Next stays above the keyboard.
- The writing peek and the empty band are gone.
- Reveal: three-column tabs with prices, and "Buddy's pick" said once.
- Names never split, in headings, bubbles or chips.
- Choose: the badge is an eyebrow, and the price after the saving shows.
- Teeinblue's fixed Personalize bar, Preview, header, quota line and success line are hidden or relabeled. "Add to cart" is in sentence case.
- The crop modal is contained.
- The handoff card is drawn before first paint.
- A sticky Next's halo no longer clips the fields beside it.

**Cart**
- Add-ons sit under their gift and show its design with a brush mark. The plus is disabled.
- "Adds 5 days" and "View photo" show.
- The phone grid has its own gap, and the drawer is an overlay.
- One confirmation per add.
- "Add our artist's touch, $29", with Remove.
- `_hs_answers` and the ship-to choice reach native orders.

**Checkout tiles**
- `design/checkout-tiles/` holds a tile for each gift and the Artist's touch.
- The theme hides any photo whose alt text says "checkout tile".
- CoWork attaches them on Krish's yes.

**Guards**
- `tools/preview/catalog.mjs` holds the clean handles.
- `handle-check.mjs` reads the store without a browser: before and after every guarded push, and hourly (`storefront-guard.yml`, one issue on failure, paths only).
- Both gates fail on a redirected product page, and gain an Android Edge view.
- CI runs `render.mjs` and `chat.mjs` with layout checks.
- The n8n tests exit non-zero on failure.
- copy-lint covers US spelling and the cart script.
- The theme-push summary prints no store or theme id.

## The review before the merge

An independent review of the whole PR sent 35 findings to a second reviewer told to refute each one: 29 held and 6 were refuted. All 29 are fixed, each with a test that fails on the code before it, in four groups, and each group was re-read by a third checker. The checkers confirmed all 29 and found two follow-ups in the fixes themselves, both now fixed with tests: the Artist's touch hold below, and the halo under the choose screen's stuck button. They also found one test that could not fail, the cart redraw case, which now does.

- **Photo.**
  - Safari writes its own Exif and Photoshop blocks into every canvas JPEG, so every iPhone photo would have been refused as "metadata remains". Those blocks are now cut from the encoder's output before the metadata check, which still refuses anything from the source photo.
  - Getting a photo ready had no time limit. It now gives up after 20 seconds.
  - The 10-second limit covered only the decode. It now covers the whole check, the dog check included.
  - The message for a photo held behind a painting pointed at a link that was not on screen yet.
  - The Artist's touch could be added twice by a second tap while its photo uploaded. The hold that stops it now lifts after a minute if the upload never settles, and the touch is still sent once.
- **Chat and Buddy's rules.**
  - A cross picked from the breed list lost its parents, so a Maltipoo got no energy.
  - The browser's Forward button skipped the 14-letter name limit.
  - The portrait's fixed reason named a wall by the door.
  - Buddy's follow-up question was not checked for invented objects.
  - A gift for "Me" could call the buyer by their own name.
  - "..." became a period followed by a lowercase word.
  - A dog called Biscuit counted as the buyer mentioning a biscuit.
  - The prompts did not say to use "they" when no pronoun was tapped.
- **Cart and layout.**
  - Helio's quantity selector turned a design's disabled plus back on.
  - The "First version" tag was lost when the cart redrew.
  - The choose screen's button halo washed out the shipping line. Its fix first left 4px of the gift chips showing under the stuck button at 360×640; the halo now reaches the screen's edge below and stays 6px above.
- **Guards.**
  - The live gate's lone-last-word check failed the healthy blanket page, whose title cannot wrap any other way at desk size. A product title now fails only when its last word could have shared the line.
  - The handle check printed a count of blank variants; it now names each by gift and title.
  - The heart stand-in is stored as `artists-touch.png`, the same name as the new tile, so the check could not tell them apart. The tile is now `artists-touch-tile.png`, and the stand-in is matched by its whole file name, alt text or media id.
- **The CoWork prompt.**
  - It attached the checkout tiles in Part 1, before the theme that hides them was live. They now go on right after the live push.
  - Its handle checks before the tiles would have printed FAIL on the known pictures. They now warn only.
  - Order 4 made the gifts in an order the app does not offer, so its two-gift total was wrong.
  - Order 1 set the tone before "Show me", where there is no saved slider.
  - Order 2's dog did not fit the 14-letter signature.
  - The live push needed the photo to work on Android only. It now needs a real photo to add on the iPhone too.
  - The checkout readback in Part 1 needed a painting outside the agreed cap.

## How it was checked

- **Offline suite: 707 of 707.**
  - Every new test was run against the parent code and fails there.
  - The browser tests run on source and on minified code.
  - Also passing:
    - `render.mjs` and `chat.mjs` with their layout checks, the artwork profile and minify checks;
    - theme check and copy lint, both on their baselines;
    - the engine parity and example-batch checks;
    - the n8n tests and their staleness check, and the Python checks.
- **Rendered pass** over the chat, product pages and cart at 360×640 (Android Edge), 390×844, 1280×900 and 1620×889.
  - It found three more glitches, now fixed with tests: the doubled "Buddy's pick", "Jo-/anne" split in Buddy's bubble, and the sticky Next clipping field borders by 2 px.
  - Left to Track B: the reveal's button below the fold at 360×640, and the product page's length.
- **Photo check:** run in Chromium against the test photos. The blurry and too-small files are refused, and a 6000×4489 camera original is accepted and sent at 4096 px.

## Not proved here

- **Real devices.** Android in Edge and Chrome, and iPhone Safari. The fix is designed from the recording, and the device log in Part 2.3 of the CoWork prompt is the proof.
- **Safari's own JPEG blocks.** The test uses a header built from published Apple output. No WebKit runs here, so the iPhone photo in Part 2.3 is the first real check.
- **Helio's quantity selector.** Its source is not in the repository. The test copies the selector logic read from the live theme on 28 October.
- **Real Teeinblue and Shopify behavior.** The tests use liquidjs, stand-ins and Chromium. Not yet seen on the real store:
  - the hidden agreement box;
  - the crop dialog;
  - the 503 retry;
  - checkout with the tiles.
- **The stated toy in a real painting.** One painting in the CoWork run checks one case.
- **The desktop cart quantity box.** The preview draws it without Helio's own styles.
- **Physical print quality.** It still waits for Krish's own sample order.

## Found while doing this, not fixed here

- **The store handle is public.** It is on the never-publish list, and it has been in the public tree since early October: in two workflow files, in the n8n builder and its generated guards, and in archived prompts. It is not a credential. Moving it out needs a repository variable for the workflows and a private origin list for n8n. That is proposed as its own task.
