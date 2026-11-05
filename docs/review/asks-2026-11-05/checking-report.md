**Ask 2: the 2-second "checking" screen before the painting**

North Star: this moves the photo-first journey's conversion, which feeds the trailing-4-week net sales number. That number is at U5 ($69 against $658 this week). Nothing was edited, committed or pushed, and the repo is clean.

## The screen

The screen is the gift page's easel, before hs2's painting card appears. It has the headline "Painting your dog" and the line "The painter is getting ready." First it shows an empty pink wash and a brush, then the buyer's photo faded into an oval, and then it freezes for about 2 seconds while hs2.js prepares the photo. hs2.js calls that last phase `'checking'` itself. The painting card appears only after all of this, and it shows for about 1 second before the questions replace it.

**Measured on the phone profile** (390x844 headless Chromium, 4x CPU throttle, LTE 70 ms / 9 Mbps, theme assets cached, `stub-lte-4x`). Times are from the tap on Start painting:

| From | Lasts | What the buyer sees |
|---|---|---|
| 0 | 0.9 s | The gifts screen, "Start painting" with dots |
| +1.0 s | 1.16 s | The inline easel with no photo: "The painter is getting ready." and "Getting the paints out. Your photo goes on the easel first." |
| +2.2 s | 0.64 s | The easel with the faded oval photo: "The painter is getting ready. A few quick questions while it starts." |
| +2.8 s | 2.31 s | The same easel, "Your photo is with the painter", with one frozen frame of 1.85 s |
| +5.1 s | 1.10 s | The painting card: the whole photo, the strokes, the dog talking |
| +6.1 s | | The first question |

At 1x CPU the easel phase is about 2 to 2.5 s, which matches Krish's "2-second": 0.69 s of "getting ready", then 1.77 s that includes a 1.4 s freeze.

**Live store** (GET only, no photo, no `?journey=1`, POST and n8n requests aborted). The live minified assets carry the repo's current markers, so live behaves like main.
- At 1x CPU: first paint 0.75 s, hs2.js ready 1.06 s, Teeinblue's photo field 1.32 s.
- At 4x CPU: first paint 1.57 s, hs2.js ready 2.76 s, Teeinblue's photo field 3.89 s.

**Second candidate: the home photo step.** While `HSPhotoQuality.check` runs, the photo screen stays unchanged with dots on "Choose a photo" and the photo is not shown.
- Stubbed check: 0.01 to 0.06 s.
- Real check, detector not yet loaded: 0.15 s.
- Real check, detector loaded: 0.80 s at 1x and 1.56 s at 4x, mostly one frozen frame.

This was the "pre-painting" screen on 4 Nov, when the photo was the last step. Today the style screen follows it, so it is less likely to be what Krish meant, but the design below covers it too.

## Root cause

The painting card cannot show until hs2.js has done five things:
1. Loaded.
2. Read the photo back from IndexedDB.
3. Waited for Teeinblue's photo field and fields (`hs2.js:399`, `nativeBlanketInputsReady()` and `photoInput()`).
4. Taken the upload lock (`hs2.js:2684`).
5. Re-encoded the full-size photo on the main thread (`hs2.js:2692-2697`, which calls `hs-artwork-photo.js:116-118`, `draw()` then `canvas.toBlob`). The profile puts 1,791 ms on line 118 at 4x and 594 ms in `toBlob` at 1x.

`artStage` keeps the card hidden until the lock exists (`hs2.js:556-565`). `artPhase` names the preparing stage `'checking'` with the words "Checking your photo on this device and getting it ready." (`hs2.js:542,546`). The journey frame hides those words (`hs-journey-choose.css:42`), but the freeze still shows.

Until then the buyer sees the easel, which looks like a placeholder:
- Markup: `snippets/hs-journey-choose.liquid:31-46`. The photo image is hidden at line 39.
- Logic: `hs-journey-choose.js:65-84`.
- The faded oval photo: `hs2.css:1314`.
- "The painter is getting ready.": snippet line 28 and `hs-journey-choose.js:226`.
- "Getting the paints out...": snippet line 44 and `hs-journey-choose.js:83`.

There is also a second freeze. `hs2.js:287-303` (`warmPhotoCheck`) loads the 19 MB dog detector when the journey sends its own photo, even though that photo is never checked on this page (`hs2.js:472`). In the profile, 2,854 ms went to WebGL `getShaderParameter`, giving a 3.2 s frozen frame that delayed the first question. That figure is from SwiftShader, which exaggerates it; on a phone it is likely shorter (inferred).

On the home step, `hs-journey.js:821-836` keeps the button busy until the check answers, and `usePhoto` at 878-889 saves first and only then calls `go('look')`.

## The change

**1. The painting screen from the first frame** (snippet, `hs-journey.js`, `hs-journey-choose.js`, `hs-journey-choose.css`)
- **Thumbnail on the home page.** In `hs-journey.js`, add `keepThumb(f, t)`, called from `usePhoto` after `savePhoto` succeeds and after `go('look')`, so it is off the critical path. It decodes with `img.decode()` (or `createImageBitmap(f, {resizeWidth: 900})` where supported) and writes a JPEG of about 900 px on the long side, quality 0.82, as a data URL to `sessionStorage['hs-journey-thumb'] = {t: S.photoT, src}`. Wrap it in try/catch; if it fails, today's behavior stays. The canvas re-encode drops all EXIF. The photo stays on the device.
- **Inline script** (snippet lines 86-102). Inside `if (on && mine)`, and before `root.hidden = false`:
  - If `thumb.t === j.photoT` and `src` starts with `data:image/jpeg;base64,`, set `src` on `[data-hs-jm-photo]` and `[data-hs-jm-face]`, unhide both, hide the paw icon, and set `--hs-jm-photo` on the easel.
  - Write the same title, sub-line and bubble text that `paint()` will write, so nothing flips when `hs-journey-choose.js` takes over.
- **Copy** (Krish approves).
  - Sub-line: replace "The painter is getting ready." (line 28) and both branches at `hs-journey-choose.js:226` with one line that does not depend on `journeyStatus`. Proposed: "A few quick questions while it paints."
  - Bubble: replace "Getting the paints out..." (line 44 and `:83`) with the dog's opening line already in `hs-wait.js:46`: "I'm at the painter's. I've been asked to sit very still, which is a big ask." Mark it as used so hs-wait.js does not repeat it.
  - Later gifts keep "Now the <gift>" and "Painting <dog> for the <gift>..."
  - Neither proposed line claims the photo has gone, which keeps the 5 Nov honesty rule.
- **Visual: the easel looks like the card's first frame** (`hs-journey-choose.css`).
  - Photo: `.hs-jm__easel .hs-art__photo{top:0;left:0;width:100%;height:100%;border-radius:0;object-fit:contain;mix-blend-mode:normal;filter:grayscale(1);opacity:.55;animation:none}`.
  - Wash opacity .35, as in `hs-wait.css:4`.
  - A blurred copy behind: `.hs-jm__easel .hs-art__canvas::before{background:var(--hs-jm-photo) center/cover;filter:blur(14px);opacity:.35}`.
  - Add the card's bar row to the easel (`<div class="hs-art__bar"><span></span></div>`) so no box moves when the card takes its place.
  - On the card's first entry, a 250 ms opacity crossfade; none under reduced motion.

**2. No freeze while the photo is prepared** (`hs-artwork-photo.js`)
- In `clean()`, after `createImageBitmap(file)`, transfer the bitmap to a Worker built from a new same-origin theme asset, `hs-artwork-photo-worker.js`. The worker uses the same `fit`, halving `draw` and CAP 4096, then `OffscreenCanvas.convertToBlob({type:'image/jpeg', quality:0.92})`.
- `stripJPEG`, `checkJPEG` and `digest` stay on the main thread, unchanged.
- If Worker, OffscreenCanvas or `convertToBlob` is missing, or the worker errors, fall back to today's main-thread path exactly once.
- Pass the worker's URL from Liquid with `asset_url`. Make sure render.mjs copies the new file into `out/assets`.
- `hs2.js` does not change; it already awaits `prepare()`.

**3. No detector on the gift page for the journey's own photo** (`hs2.js:290-296`)
- In the `warmPhotoCheck` listener: `var f0 = inp.files && inp.files[0]; if (f0 && (f0 === inp.__hs2CheckedPhoto || f0 === inp.__hs2PreparedPhoto)) return;`.
- A photo the buyer picks in Teeinblue's own field (the no-photo or refused path) is still checked (`hs2.js:2630`) and still warms the detector.

**4. Home photo step: show the style at once, interrupt only for a refusal** (`hs-journey.js` `onChange` 810-837 and `usePhoto` 878-889; needs Krish's yes)
- Start `savePhoto(f)` at once, alongside the check.
- Call `go('look')` once the photo is saved and either the check has answered or 250 ms have passed. An instant refusal therefore still keeps the buyer on the photo step, as the existing test expects.
- A late `reject` while the buyer is on the style, tone or gifts screen: track it, clear `S.hasPhoto`, `go('photo')`, then `showRefused(f)` with Buddy's reason and the override button where `overridable`.
- A late `warn` for two dogs sets `S.photoDogs` and saves; `lateDogs`, `manyDogs` and `dogsSheet` do not change.
- A Start painting tap while a check is still running waits for it, with the button busy, up to the check's own 4 s cap.

## Tests that fail today and pass after
All in `tools/preview/journey-flow.browser.test.mjs`, reusing `open()` and `home()`.

- **T1, the photo from the first frame, nothing says getting ready.** An `addInitScript` MutationObserver records `[data-hs-jm-sub]`, `[data-hs-jm-say]`, whether the easel photo is shown with a `src`, and whether the card is shown. It records from the moment `[data-hs-jm]` is unhidden until `#ask=name`. Assert every state has the photo or the card, and none matches `/getting ready|getting the paints|checking/i`. Today the first state is the empty easel with "The painter is getting ready.", so both assertions fail.
- **T2, the photo is prepared off the main thread.** Count `HTMLCanvasElement.prototype.toBlob` calls on product pages until `#ask=name`. Today there is 1; after the change, 0 in Chromium. Add a unit test that the fallback path still produces a stripped JPEG within CAP when OffscreenCanvas is missing.
- **T3, no detector for the journey's own photo.** Count `page.on('request')` hits matching `/tfjs|coco-ssd|ssdlite_mobilenet/` after the gift page commits. Today there is at least 1 (aborted, but requested); after, 0.
- **T4, for part 4.**
  - The check resolves ok after 1500 ms; assert `step=look` within 600 ms. Today it takes about 1.5 s.
  - A late overridable refusal after 1000 ms; assert the style screen shows, then `step=photo` with the reason and `[data-hsj-override]` visible.
- **Keep green.** The full suite at all seven sizes, including `noScroll`, the `frameBox` dock check, one painting per gift, the two-dog tests (lines 339-466) and copy-lint.

## What must stay true, and the risks
- **One painting per gift.** `journeyAutoSend`, the upload lock and `journeySentKey` are untouched. A worker failure falls back once and never sends the photo a second time.
- **Nothing changes size.** The easel and the card share the `--hs-art-ratio` box, and both get the bar row.
- **Copy.** No exclamation marks, no em dashes, US spelling.
- **A refused photo is explained.** The gift page's `refused` phase is untouched, and the home step shows a late refusal with its reason.
- **The two-dog check stays intact.**
- **Risks:**
  - A full sessionStorage means no thumbnail, so today's behavior.
  - iOS Safari older than 16.4 has no OffscreenCanvas, so today's freeze stays there.
  - The worker-encoded JPEG must pass `checkJPEG` and Teeinblue.
  - The crossfade should run on the card's first entry only, not after a repaint.

## Needs Krish, or a live check
- **Krish:**
  - Confirm the screen. A 10-second phone recording from Start painting would settle it. If he meant the photo step, part 4 is the fix and parts 1 to 3 still help.
  - Approve the two copy lines.
  - Say yes or no to part 4's bounce-back from the style screen.
- **Live:**
  - A before and after recording on a draft theme, on iPhone Safari and on Android Chrome. Each run paints once, which is paid, so each needs Krish's OK.
  - Check that the storefront allows a same-origin worker from theme assets.
  - Check that Teeinblue accepts the worker-encoded JPEG.
- **Inferred, not verified:**
  - Real phone timings; I used CPU and network throttling in headless Chromium.
  - The white frames during navigation are a headless artifact; a phone most likely keeps showing the gifts screen.
  - SwiftShader exaggerates the WebGL cost.

## Screenshots
Everything is in `/tmp/claude-0/-home-user-heartside/2e077d0e-1ec9-5845-8fab-a9e6b1438927/scratchpad/asks/checking/`. Each run folder holds frames about every 150 ms (named by ms since the photo was chosen) and a `log.json` of what was on screen.

**Run folders:**
- `stub-1x` (36 frames)
- `real-warm-1x` (39)
- `stub-lte-4x` (42)
- `real-warm-lte-4x` (45)
- `stub-4g-4x` (73)
- `prof-lte-4x` (42, plus `profile-self.txt`)
- `prof-real-1x` (42, plus `profile-self.txt`)

**Key frames, in `key/`:**
- `1-home-photo-step-busy-during-check-1.6s.png`
- `2-home-gifts-start-painting-tap.png`
- `3-navigation-headless-white-frame.png`
- `4-gift-inline-easel-empty-getting-ready-1.2s.png`
- `5-gift-easel-faded-photo-getting-ready-0.6s.png`
- `6-gift-easel-with-the-painter-frozen-2.3s.png`
- `7-gift-painting-card-1.1s.png`
- `8-gift-first-question.png`

**Contact sheets:** `sheet-stub.png`, `sheet-real-warm.png`, `sheet-stub-lte.png`, `sheet-phone-profile.png`, `sheet-4g.png`.

**Scripts:**
- `capture.cjs`: the local flow and screenshots; n8n aborted, the detector served from `cdn-cache/`.
- `summarize.cjs`
- `detector-time.cjs`
- `live-timing.mjs`: GET only, no photo; results in `live-timing.json`, `live-timing-1x.json` and `live-timing-4x.json`.
- `phone-photo-4032.jpg`: the test photo at phone size.