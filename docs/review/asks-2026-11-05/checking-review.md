# Skeptic review

They found the right screen, but their explanation of why it lasts is wrong and the design needs rework before anyone codes it. Repo is clean; I edited nothing. I made GET requests to heartside.io only, with no photo and no ?journey=1. All Playwright runs were local, with every outside request blocked.

**The screen: right.** It is the gift page easel before hs2's painting card. On a phone it shows the empty wash, then the faded oval photo, with "The painter is getting ready." The oval crop of the photo looks a lot like the 4 Nov "Checking the photo" screen Krish called horrible. Live serves the same markers as the repo: the easel copy, STUDIO_MS=6e3 and STUDIO_MIN=2500.

**The cause: overstated.** I re-ran their exact photo (4032x2669, 390x844) with no screenshots. Script: /tmp/claude-0/-home-user-heartside/2e077d0e-1ec9-5845-8fab-a9e6b1438927/scratchpad/review2/handover.cjs; logs in /tmp/claude-0/-home-user-heartside/2e077d0e-1ec9-5845-8fab-a9e6b1438927/scratchpad/review2/run/c1/log.json and /tmp/claude-0/-home-user-heartside/2e077d0e-1ec9-5845-8fab-a9e6b1438927/scratchpad/review2/run/c4/log.json.
- The card appeared before the re-encode finished: card at 1056 ms vs encode done at 1284 ms (1x); card at 1827 ms vs encode done at 2919 ms (4x).
- The part of `toBlob` that blocks the page took 12 ms (1x) and 57 ms (4x).
- No main-thread task ran longer than 446 ms (1x) or 221 ms (4x).
- Their 1.4 s and 1.85 s freezes, and the 2.31 s table row, fall in gaps of 1.0 to 7.3 s where their screenshot calls blocked. They are most likely caused by the screenshots and profiling. On live, the easel lasts as long as it does mostly because hs2 waits for Teeinblue's photo field, then for a 600 ms poll, then for a 150 ms delayed status update. That live split is inferred.
- The studio is a fixed 6 s from page start by design (`hs-journey-choose.js:26`, `:451-452`). So the fixes change what those 6 s look like, not when the questions come.

**What to keep:**
- Part 1, the painting look from the first frame, is the right core.
- Part 3 is the safest and cheapest change, and maybe the largest. I confirmed the gift page requests `tf.min.js` for the journey's own photo, which this page never checks.

**What to rework:**
- Part 1 as written still changes size and text at the handover. The speech bubble grows from 84 to 108 px, the speaker label changes, and the card's text retypes from empty.
- Its copy says painting has started before it has. That breaks the 5 Nov honesty rule and an existing test.
- It misses a hidden status message that screen readers announce, and two cheap delays in `hs2.js`.

**What to defer or replace:**
- Defer Part 2 (the worker) until a real iPhone measurement shows a long freeze in prepare.
- Replace Part 4's bounce back from the style screen with the existing "ask at Start painting" pattern.

**Live facts I settled:**
- The product page CSP is only `block-all-mixed-content; frame-ancestors 'none'; upgrade-insecure-requests`. Theme assets are same-origin, so CSP does not block a worker.
- HTML is `cache-control: private, max-age=0, must-revalidate`.

## Flaws

- **major.** Root cause step 5: the painting card cannot show until hs2.js has re-encoded the full-size photo; one frozen frame of 1.85 s (4x) and 1.4 s (1x); table row '+2.8 s, 2.31 s, the same easel'.
  - Problem: The card's show condition is the upload lock. `artStage` (`hs2.js:561-563`) reads `blanketUploadPending()` (`hs2.js:91-97`). `beginBlanketUpload` writes that lock at `hs2.js:2684`, before prepare starts at `hs2.js:2697`. Their own sentence 'artStage keeps the card hidden until the lock exists' contradicts step 5. In clean runs with a long-task observer and no screenshots:
- the card painted at 1056 ms (1x) and 1827 ms (4x) after navigation, before `toBlob` finished (1284 ms and 2919 ms);
- the part of `toBlob` that blocks the page was 12 ms and 57 ms;
- the longest main-thread task was 446 ms (1x) and 221 ms (4x).
Their logs log screenshot calls that took 1.0 to 5.8 s, exactly in the handover window. For example, stub-lte-4x logs 'screenshot took 2791 ms', and stub-1x shows the card at pt 1070 before a 1920 ms long task. So the freezes most likely come from `page.screenshot` and CPU profiling under throttle, which starve Chromium's background encoder. This is inferred, but the clean runs do not reproduce the freezes.
  - Fix: Restate the cause: the easel is a placeholder that reads as a pre-check, shown while hs2 waits for Teeinblue's photo field, then for the 600 ms poll, then for the 150 ms delayed status update. Measure timelines with a long-task observer and DOM state sampled every frame, and take screenshots in a separate pass. Do not cite the 1.85 s freeze as evidence.
- **major.** Part 1: write the same text paint() will write so nothing flips; 'Nothing changes size. The easel and the card share the --hs-art-ratio box, and both get the bar row'; give the bubble the hs-wait opening line and 'mark it as used'.
  - Problem: Measured at 390x844: the canvas (top 198, height 374) and the dock (660) stay put, but four things change at the handover.
- **Bubble height:** it grows from 84 px (easel, auto height) to 108 px (card). The card's height comes from `--hs-wait-h`, set by `fitTalk` (`hs-wait.js:176-199`) to fit the tallest of every line.
- **Speaker label:** it changes from 'Live from the studio' (`hs-journey-choose.js:81`) to 'your dog, live from the studio' (`hs-wait.js:162`).
- **Text:** the card's bubble starts empty and types a random opener. `hs-wait.js:275` picks beat 1 with `Math.random`, not `pick()`/`used`, so 'mark it as used' has nothing to hook into.
- **Icons:** the floating ball, heart and paw icons pop in.
This breaks Krish's 4 Nov rule 'Nothing on this page must randomly change size'.
  - Fix: Use one speech bubble for the whole studio. When the card sits in `[data-hs-jm-paint]`, `buildTalk` in `hs-wait.js` should either adopt the easel's `.hs-jm__talk` node or copy its exact label and text, skip typing for beat 1, and set `lastSay` to now. Use one label formula in both places. Hold the easel's bubble at the card's height, either by running the same measurement through `window.__hsWait` at init or with a fixed height on `.hs-jm__paint .hs-wait__bubble`. Add a test that fails today: the bubble rectangle, label, text and bar are identical in the last easel frame and the first card frame (today 84 vs 108 px, and the labels differ).
- **major.** Copy: 'A few quick questions while it paints.' and 'I'm at the painter's. I've been asked to sit very still, which is a big ask.' Neither claims the photo has gone, which keeps the 5 Nov honesty rule.
  - Problem: Both lines say painting has started. Both show from first paint, before anything is sent. On the nophoto, stuck and refused paths they never become true. An existing test enforces the rule: `tools/preview/journey-product.browser.test.mjs:555-564`, named 'nothing said before it is true', asserts the server text 'The painter is getting ready.' The proposal breaks that test and does not list it in its keep-green list. Separately, today's 'Your photo is with the painter' already shows early: hs2 sets the 'sent' state at `hs2.js:402`, before prepare and before the photo goes to Teeinblue.
  - Fix: Give Krish the trade-off with a line that is true at first paint, for example the sub-line 'A few quick questions while your painting starts.' and a dog line that does not say it is at the painter's. Update `journey-product.browser.test.mjs:555-564` to the approved copy and run `copy-lint`. Optionally make the 'with the painter' wording wait for the lock's 'sent' stage, not `journeyAutoSend.state`.
- **major.** The journey frame hides the 'checking' words (hs-journey-choose.css:42), so only the freeze still shows; T1 records [data-hs-jm-sub] and [data-hs-jm-say] and asserts none says getting ready or checking.
  - Problem: Verified locally (/tmp/claude-0/-home-user-heartside/2e077d0e-1ec9-5845-8fab-a9e6b1438927/scratchpad/review2/run/ax/log.json): during the handover, a status message that screen readers announce (`[data-hs2-photo-inline]`, created by `photoNote` at `hs2.js:213-217` from the prepare note at `:2692`) sits inside `#buy`. It is hidden only by opacity 0 and height 0 (`hs-journey-choose.css:15-18`), so it stays readable, and it says "Getting your dog's photo ready and removing its location data." VoiceOver users hear the checking screen. T1 never looks at it.
  - Fix: In journey mode, put `aria-hidden="true"` on `#buy > :not(.hs-jm)`, set from the inline script and from `hs-journey-choose.js` init. Use neither `inert` nor `display:none`, so Teeinblue keeps working. Or make `photoNote` stay silent while `journey()` is on, except for a refusal. Add a check on the page's accessibility tree during the studio for `/checking|getting .*ready|location data/i`; it fails today.
- **major.** hs2.js does not change (Part 2: it already awaits prepare()).
  - Problem: Two hs2 delays sit right in the easel's time and the design leaves them out.
1. `journeyAutoSend` (`hs2.js:390-404`) makes its first attempt one full 600 ms tick after the photo is restored, even when Teeinblue's fields are already there.
2. The card appears only on the next delayed status update (`hs2.js:2867`, 150 ms) after the lock. In clean runs the card came 100 to 320 ms after the lock or the 'sent' state.
  - Fix: Move the tick body into an `attempt()` function. Call it once at once and again on `teeinblue-event-component-injected`, and keep the interval. Keep the sessionStorage sent-key check first in `attempt()` so it can still paint only once. Call `updateBlanketPurchaseStatus()` right after `beginBlanketUpload()` succeeds (`hs2.js:2684-2690`), and start `HSArtworkPhoto.prepare` after one `requestAnimationFrame`, so the card paints before any encode work. Test: with Teeinblue ready at once in the stand-in, the time from `[data-hs-jm]` shown to the card's painting state drops by about 0.6 s, and `__painted` stays 1.
- **major.** Part 2: move the re-encode to a Worker with OffscreenCanvas; needs a live check that the storefront allows a same-origin worker; make sure render.mjs copies the new file.
  - Problem: Its need is unproven (see the first flaw). It is the riskiest change on the paid path:
- a new asset;
- a second JPEG encoder whose bytes Teeinblue must accept;
- different behavior before iOS 16.4.
Two of its open questions are already settled. The live product page CSP has no `script-src` or `worker-src`, and theme assets are same-origin, so CSP does not block a worker. `render.mjs:540` already copies every theme asset. The browser that matters, iOS Safari, was never measured; there is no WebKit in this container. WebKit's `toBlob` may encode while blocking the page, but that is inferred.
  - Fix: Defer Part 2. Run a free real-device check first. On an iPhone, open any live product page without `?journey=1`. In Safari Web Inspector, run `HSArtworkPhoto.prepare(file)` on a 12 MP photo picked through a temporary file input. This function only works on the phone and uploads nothing. Build the worker only if the Timeline shows a main-thread task over about 200 ms.
- **major.** Part 4: save the photo at once, go('look') after 250 ms, and on a late reject clear S.hasPhoto, go('photo') and showRefused; a Start painting tap waits for a running check.
  - Problem: Three problems.
1. **It overwrites a good photo.** `savePhoto` (`hs-journey.js:268-273`) overwrites the IndexedDB headshot and sets `S.hasPhoto` and `S.photoT` before the check answers. A rejected photo then replaces a previously accepted one.
2. **It adds jank.** The check's pixel work and the detector run on the main thread (`hs-photo-quality.js:254-271`, `338-362`) while the style screen fades in. Their own real-warm-1x log has a 759 ms long task right after the pick. That adds jank to Krish's 'juttery transitions' ask.
3. **It interrupts twice.** Pulling the buyer back from style, tone or gifts is a worse interruption. Waiting at Start painting brings a checking wait back just before the painting.
A tested pattern already exists: the late two-dog check asks at Start painting through `dogsSheet` (`journey-flow.browser.test.mjs:421-441`).
  - Fix: On the photo step, always run the blocking check with `detect:false` (measured at about 0.15 s), save only after it passes, and advance at once. Run the dog detector afterwards through `lateDogs`, extended to record an overridable no-dog result keyed by `S.photoT`. Show that result at Start painting the way `dogsSheet` does: "I couldn't find a dog in this photo", with "It's my dog. Paint it." and "Choose another photo". This keeps the two-dog check and needs Krish's yes.
- **minor.** Screenshots about every 150 ms; per-screen durations in the table; first question at +6.1 s.
  - Problem: The median gap is 150 ms, but every run has 2 to 3 gaps of 1.0 to 7.3 s inside the handover window (stub-lte-4x up to 2791 ms, real-warm-1x 7267 ms). So durations after about +2.2 s cannot be read from frames. The +6.1 s is set by design: `STUDIO_MS=6000` from `performance.timeOrigin`. The report does not say so, which implies that speeding up hs2 would bring the questions earlier.
  - Fix: Say that the studio is a fixed 6 s by Krish's 4 Nov ruling, and that the easel shows for about 1 to 2 s of it (1.0 to 1.9 s locally). Take durations from sampled DOM state, not from frame names.
- **minor.** On the card's first entry, a 250 ms opacity crossfade.
  - Problem: `easel()` hides the easel the moment `cardOn()` is true (`hs-journey-choose.js:68-69`). The easel and the card are siblings in a flex row (`hs-journey-choose.css:40`). Showing both for 250 ms without stacking doubles the height, which is a size change.
  - Fix: Stack both in one grid cell (`.hs-jm__paint{display:grid} .hs-jm__paint>*{grid-area:1/1}`), keep the easel for 250 ms after `cardOn()` with an opacity transition, and turn it off under reduced motion. Or drop the crossfade once the two frames are identical.
- **minor.** Add the card's bar row to the easel.
  - Problem: Copied as is, the easel's bar sweeps (`hs2.css:1325`). The card's bar under `has-wait` is a static 4% fill (`hs-wait.css:48`), so the bar still changes at the handover. A copy with its attributes also adds a second progressbar for screen readers.
  - Fix: Style the easel's bar like `.hs-art.has-wait .hs-art__bar span{width:4%;animation:none;transform:none}` and mark it `aria-hidden="true"`.
- **minor.** keepThumb after go('look') is off the critical path; a 900 px JPEG data URL in sessionStorage.
  - Problem: Drawing down from a 12 MP bitmap and `toDataURL` both block the main thread, and they would run during the style screen's 280 ms fade-in. It also keeps a second copy of the dog photo in sessionStorage, against the same quota as hs2-review. If the IndexedDB photo is later missing, the easel would show the photo and then say "photo didn't come with you".
  - Fix: Make it with `createImageBitmap(f,{resizeWidth/resizeHeight})` and an async `toBlob`, scheduled after the transition. Alternatively, store the thumbnail Blob in the same IndexedDB record and read it asynchronously in the inline script; compare the first-paint timing in a test before choosing. Add `decoding="sync"` to `[data-hs-jm-photo]`, and hide the thumbnail on the nophoto path.
- **minor.** Part 3: SwiftShader exaggerates the WebGL cost; on a phone it is likely shorter.
  - Problem: This undersells the most valuable safe change. I verified the gift page requests `tf.min.js` for the journey's own photo, which this page never checks (`hs2.js:470-473`). iOS Safari lacks parallel shader compilation, so the compile likely blocks there too (inferred). If the model is not already cached on the phone, it is a 19 MB download that competes with the photo upload to Teeinblue over cellular (inferred). The proposed guard works with the current listener order: the capture listener at `hs2.js:290` runs before `keepTibPhoto`'s, and `__hs2CheckedPhoto` is set before dispatch.
  - Fix: Ship Part 3 first, with T3 as proposed. Note that the real-warm-1x run had a 9,046 ms long task that pushed the first question to 12.7 s; the report left it out.
- **minor.** T1 to T3 fail today and pass after; keep green the full journey-flow suite.
  - Problem: 
- **T2 tests the mechanism, not the buyer's view.** It counts `toBlob` calls.
- **T1 is too short and too narrow.** It runs the inline state for only about 300 ms locally, unlike live, and checks only two selectors.
- **T1 does not test the size rule.** Nothing checks the bubble height, the label or the text at the handover.
- **The keep-green list is incomplete.** It omits `journey-product.browser.test.mjs:555-564`, which the copy change breaks.
- **Two references are slightly off.** `hs-wait.js:46` is actually line 41, and the `render.mjs` copy step already exists.
  - Fix: Delay `hs-journey-choose.js` and `hs2.js` by about 2.5 s in T1 with `page.route`, and sample `frame.innerText` plus the accessibility tree. Replace T2 with the handover-identity test and the screen-reader test above. Add `journey-product.browser.test.mjs` and `wait-room.browser.test.mjs` to the keep-green list.

## Missing

- **Gift page fades in from blank.** Its frame plays the `.hsj__screen--step` entrance (`hs-journey.css:320`) from opacity 0 at first paint: I measured opacity 0 at 127 ms and about 1 at 428 ms. So the buyer sees blank cream, then a fade, before the easel. Consider a cross-document View Transition (`@view-transition { navigation: auto }`, Chrome 126+ and Safari 18.2+) to carry the gifts screen into the easel, off under reduced motion. Or skip that entrance when the page opens from the journey.
- **Possible store-header flash, not verified.** On live, the inline journey check and `hs-journey-choose.css` sit at about 71 to 73% of the 230 KB product HTML, after about 50 KB of body that includes the store header. On a slow connection the header could paint before `html.hs-jm-on` hides it. The local preview does not reproduce it. Moving the class check and a few hide rules into the head would remove the risk.
- **Never prerender the gift page.** Speculation Rules prerender must never be used to hide the navigation. A prerendered `?journey=1` page runs hs2.js `journeyAutoSend` and would start a paid painting before the tap. Only HTML prefetch is safe, Safari ignores it, and live HTML is `private, max-age=0, must-revalidate`.
- **Teeinblue's own upload UI was not checked.** Any toast or overlay it adds outside `#buy` during the upload was never looked at; only `.vm--container` is hidden (`hs-journey-choose.css:21`). Checking needs a recorded live run, which is a paid painting and needs Krish's OK, or a read of Teeinblue's script.
- **iOS Safari, the main buyer browser, was never measured.** Use the free Web Inspector check of `HSArtworkPhoto.prepare` on a live product page without `?journey=1`; it uploads nothing.
- **`fitTalk` costs a frame at the handover.** In `hs-wait.js` it forces one layout per line (about 30) at the card's first frame: 298 ms self time at 4x in their profile. Measuring every line in one layout pass would remove that hitch.
- **Untested states.** No screenshots or measurements of the new easel under reduced motion, at 320x568 or 1280x800, for later gifts ('Now the <gift>'), or for the repaint 'wait' phase.
- **For Krish:**
- A 10-second phone recording from the Start painting tap to confirm the screen.
- Approval of copy that is true at first paint.
- A yes or no to moving the late refusals to the Start painting question instead of bouncing back from the style screen.
