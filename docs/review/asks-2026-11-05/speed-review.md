# Skeptic review

Most of the measurements hold up, and the safety design is sound: a prefetch-only warm-up plus a document.prerendering guard keeps it to one painting per gift. The design is not ready to code as written, for four reasons.
(1) The gift page's main root cause is wrong. Teeinblue's app block puts app-v1.js (424 KB) in the head as a classic `defer` script, ahead of hs2.js. Deferred scripts run in document order, so hs2.js, hs-journey.js, hs-journey-choose.js and hs-wait.js all wait for it to download and run. Helio's modules are not the gate.
(2) The "ranked by measured gain" order rests on CDP throttling, which splits bandwidth equally and ignores fetchpriority and HTTP/2 priority. That inflates fix 1 the most and fix 3 the least.
(3) Fix 1's trigger, hydrating on window load, ties the hero reel to third-party pixels. Hydrating everything on load would also download about 1 to 2 MB of hidden pictures on routed `?step=` loads.
(4) Fix 2 only helps Chromium, and it was measured without the 18.9 MB detector download that the real journey starts once a photo is picked.

Recommended order: ship fix 3 first (every browser, the gain comes from script order), then fix 1 with the trigger changed, then fix 2 once the browser mix and the detector decision are known. Confirm each with field data from Shopify's Web performance report, not only the lab harness.

Checked and correct: the line numbers for hs-showcase.js, hs-showcase.css, hs-journey.js and the snippets. The stacked sets defeating lazy load (hs-showcase.css:72 and :136-138). hs2-head rendered 4 times on home (4 hs2.js tags) and 3 on the mug page. No speculation rules in the server HTML. The detector is 18.9 MB from storage.googleapis.com with max-age=3600. app-v1.js is defer in the head (live GET today).

## Flaws

- **major.** Root cause 3 and 'Not worth doing': the gift page's critical scripts are gated by Helio's head modules, then hs2-head, then hs-journey-choose, and Helio's 52 module requests hold back the gift page's DCL.
  - Problem: The gate is Teeinblue's https://sdk.teeinblue.com/shopify/app-v1.js. The Teeinblue app block emits it as a classic `defer` script in the head: in a live GET today it sits at about byte 85.7 K, before the first hs2.js tag at about 124 K in the body. Deferred and module scripts execute in document order, so no later theme script can run until app-v1.js has arrived and evaluated. The colleague's own files show this:
- probe-throttled.json: parsing finishes at 3.0 s (readyState interactive), app-v1.js finishes at 12.9 s, and hs2api, HSJourney, hsjm and tibLoaded are all marked at the same 13834 ms.
- Every exp-warm run marks hs2api and tibLoaded on the same 50 ms poll (9498/9498, 2539/2539, 4064/4064).
- mug-raw-trace.json: app-v1.js evaluates at 13.75 s (760 ms), hs2.js at 14.68 s, hs-journey-choose.js at 14.84 s, then app-v1.js a second time at 14.88 s (477 ms, the 2 s fallback copy).
Helio's modules had finished long before.
  - Fix: Rewrite root cause 3 around the Teeinblue defer gate and drop the Helio-module item. Re-rank: fix 3's gain comes from script order, not contention, so it survives real networks and every browser. Add as an inferred option: stop the second evaluation by defining window.TeeInBlue = {loaderTimeout: <ms>} in the layout head before the app block. The fallback reads window.TeeInBlue?.loaderTimeout when its inline script runs, and nothing in the server HTML assigns window.TeeInBlue. This needs the guarded layout workflow and a check that Teeinblue's loader still hides. It would save about 0.5 s of main thread at 4x. Proof: the same trace before and after shows a single app-v1.js EvaluateScript.
- **major.** Fixes ranked by measured gain; home LCP 20.55 to 20.60 s; fix 1 takes LCP from 20.8 s to 7.9 s.
  - Problem: All throttled numbers come from CDP Network.emulateNetworkConditions, which shares the emulated bandwidth equally across active requests and ignores fetchpriority and HTTP/2 priority. On a real network the High-priority hero, requested at 1.1 s, would be served ahead of the Low-priority stacked sets and the below-fold examples.
- Gains that come only from contention (fixes 1a and 1b) are the most inflated. Gains from bytes never fetched (fix 2) or from script order (fix 3) persist.
- The caveat appears in section 6, but the headline numbers and the ranking ignore it.
- With the cache disabled, some fetches happen twice per run: compiled_assets/styles.css and ten Helio modules, the second set fetched by es-module-shims.
- The sandbox proxy re-terminates TLS.
- exp-home serves the patched hs-showcase.js from Node after a fixed 700 ms, outside the throttle, while the control fetches the live file through it.
  - Fix: Label every lab figure as equal-share lab, and do not present 20.8 to 7.9 s to Krish as what a phone sees. Add field truth: Shopify admin, Online Store, Themes, Web performance (p75 mobile LCP from real visits via perf-kit), before and 7 to 14 days after each push. Add one priority-aware lab, either WebPageTest on a real Android device or Lighthouse with simulated throttling, for / and /products/your-dogs-illustrated-mug. Re-rank after that.
- **major.** Fix 1: hydrate the next set only when `loaded && shown(current)`, with `loaded` set on window load; strip and flow hydrate every img[data-hss-src] on window load.
  - Problem: Two problems.
(a) Window load on home waits for GTM, Meta, TikTok and the pixel sandboxes. It came at 15.7 s in the colleague's v2, and at 8.7 s only once pixels were blocked (v3). So on a slow phone the reel sits on set 0 for 16 s or more. exp-home-v3.json ends with onSlide 0 at load plus 5 s. That is a visible change to Krish's hero reel, and the report does not say so.
(b) 'Hydrate everything on load' also fires when the showcase is display:none. On routed loads, html.hsj-routed and hsj-focus hide .hss (hs-showcase.css:17), and today the lazy images in that subtree never load. Routed loads include the gift page's Back link (/?step=gifts, hs-journey-choose.liquid:21), a reload mid-step, and any ?step= entry. After the change, about 0.9 MB of strip pictures plus up to 0.9 MB of sets would download invisibly while the buyer is on photo, look or gifts, exactly when the detector and fix 2's warm-up need the bandwidth. The same happens after a tap on 'Make one for my dog' before load.
  - Fix: Hydrate set k+1 when set k's own img fires load (then requestIdleCallback, or 500 ms), one set at a time, not on window load. Hydrate the strip and the flow only through an IntersectionObserver (bottom rootMargin 50%), and never while html has hsj-focus or hsj-routed or the block has no layout box (offsetParent === null). Add tests to the proposed speed-home.browser.test.mjs:
- On /?step=gifts, no hs-hero-* other than golden and no strip hs-ex-* image is requested within 20 s.
- With golden served at 3 s and window load held back to 20 s (by holding one third-party script), the reel shows set 1 by about 6 s.
- The existing check that the reel advances still passes.
- **minor.** Fix 1: `<noscript>` copies keep every picture without JavaScript.
  - Problem: hs-showcase.js promises at lines 2 and 3: 'Without this file every picture is already on the page.' With JavaScript on but hs-showcase.js failing to load, or throwing in the flow block before the reel and strip code, sets 2 to 6, the strip and the flow stay empty boxes for good. noscript only covers JavaScript turned off.
  - Fix: Add a small inline fallback in sections/hs-journey.liquid and sections/hs-showcase.liquid. Three seconds after window load, if window.__hssHydrate (set by hs-showcase.js) is missing, it hydrates any img[data-hss-src] still waiting. Test: abort assets/hs-showcase.js; after load every .hss-fig img has a src.
- **minor.** Fix 1: with reduced motion, hydrate every reel picture on load, because the swipe row shows them all.
  - Problem: With reduced motion the hero is the swipe row with 82% columns (hs-showcase.css:61-62), so set 2 peeks onto the first screen. Under the change it stays an empty beige box until window load, which was 8 to 16 s on the test profile.
  - Fix: In calm mode, hydrate set 2 as soon as the script runs and give sets 3 to 6 native loading="lazy", which works in the horizontal scroller. Test with reducedMotion 'reduce': set 2 has a src by DCL, and the boxes of sets 1 and 2 do not change.
- **minor.** Fix 2: add Teeinblue's https://sdk.teeinblue.com/plugins/image-placement.js to the warm list.
  - Problem: The page actually requests https://sdk.teeinblue.com/plugins/image-placement.js?v=20261026 (mug-raw-trace.json). The harness hid this because measure.mjs's `full` field strips v= params. A prefetch without the query is a different cache key, so it downloads 96 KB on the home page for nothing. The version also changes whenever Teeinblue ships. exp-warm never checked per-URL reuse: its hs2Cached and tibCached flags read false even in the warm run, because they only test fromDiskCache.
  - Fix: Drop image-placement.js from the warm list; it loads after the photo field appears anyway. In exp-warm, assert that each warmed URL is served from prefetch or disk cache on the gift page (Network.responseReceived fromPrefetchCache or fromDiskCache, or requestServedFromCache) rather than inferring reuse from timing.
- **major.** Fix 2 measured: painter ready 10.3 s to 3.7 to 3.9 s.
  - Problem: The test waited 30 s on the first screen with no photo, so the dog detector never downloaded. In the real order, a picked photo triggers lateDogs (hs-journey.js:843-853) on top of warmDetector (hs-journey.js:630 and 789-795). That download is 18.9 MB, about 100 s at Fast 3G, and it overlaps the gifts step where the warm-up runs. The measured gain is the best case, yet fix 2 is ranked on it. Other gaps in the evidence:
- exp-warm-w.json holds 1 run, with 3 more in warm2.log, and those were page.goto runs with no document prefetch.
- The runs used the plain product URL, not the ?journey=1&variant= URL the journey opens.
  - Fix: Re-run exp-warm, 3 runs per arm, using the journey URL shape (?journey=1&variant=<id>, with no photo in IndexedDB so nothing can paint). In each run, call window.HSPhotoQuality.loadDetector() on home at t=5 s to mimic lateDogs; no photo is needed. Report the painter-ready time with and without that call. Decide fix 5 before or together with fix 2.
- **major.** Fix 2 ranks above fix 3 as the second-largest gain.
  - Problem: Speculation rules run only in Chromium browsers. As far as I know (inferred), Android WebView in-app browsers do not honor them. Nothing on iOS gets them: Safari, Chrome for iOS, and the Instagram, Facebook and TikTok in-app browsers. That is likely most US phone traffic and most paid-ad clicks. Fix 3 works in every browser. The report raises Safari only as a live check, not as a ranking input.
  - Fix: Before ranking, read sessions by browser, device and referrer from Shopify analytics (read-only). Ship fix 3 first. Keep fix 2's subresource rel=prefetch part separate from the document prefetch, because it may help more Chromium surfaces (inferred), and measure each on its own.
- **minor.** Fix 3: open IndexedDB 'hs2' version 1, store 'files', key 'headshot', read-only; use the record only if rec.t === hs2-review.hs3_photo_t.
  - Problem: indexedDB.open('hs2', 1) on a device with no such database creates it at version 1. Without an onupgradeneeded handler that creates 'files', as hs2.js:1131 and hs-journey.js do, hs2.js's later open at version 1 fires no upgrade, and every savePhoto and restorePhoto throws NotFoundError from then on. That state is reachable: Chrome can evict IndexedDB under storage pressure while sessionStorage still holds hs3_photo_t. The prototype (scratchpad perf/inline-check.js) has the handler; the written spec does not. The spec also accepts only hs3_photo_t, while hs2.js restorePhoto (hs2.js:1150) also accepts hs3_photo_next, and it never revokes its object URL.
  - Fix: Write into the spec:
- onupgradeneeded creates 'files' exactly as hs2.js does.
- Accept rec.t === hs3_photo_t || rec.t === hs3_photo_next.
- Revoke window.__hsjmPhoto once hs-journey-choose.js has its own URL.
Add to journey-product.browser.test.mjs: in a fresh profile with no hs2 database, and sessionStorage claiming a photo, the page shows the paw, and a later savePhoto then restorePhoto round-trips.
- **minor.** Fix 5: the detector is Krish's call because the 5 Nov judges asked for the multi-dog check; option (b) loads it only after a photo is picked.
  - Problem: The multi-dog check already runs late, out of sight (lateDogs, hs-journey.js:838-853), so option (b) keeps it. What (b) actually loses are the detector's pick-time 'nodog' and 'far' refusals (hs-photo-quality.js:204-210), which lateDogs does not record. The report also misses an earlier rule recorded in hs2.js:283-302 (28 Oct): load the detector only once a photo is picked, and skip it on saveData or 2g. The 4 Nov warmDetector reversed that and dropped the guard. The model files are max-age=3600, so a buyer who returns after an hour downloads the 18.9 MB again.
  - Fix: Give Krish the real trade-off: option (b) keeps the multi-dog sheet but drops the pick-time 'no dog' and 'too far' refusals unless lateDogs is extended to cover them. Separately, and inferred as needing no decision, add the same saveData/2g guard to warmDetector that hs2.js warmPhotoCheck already has. Cite both the 28 Oct and the 4 Nov records.
- **minor.** Third-party pixels cost about 1.8 s of main thread at 4x; they are set up in Shopify admin, not in the theme.
  - Problem: tr.cjs sums every thread. home-trace.json shows more than the gtag, Facebook and wpm-b figures quoted:
- five web-pixel sandboxes at 3.3 to 4.5 s of EvaluateScript each, on worker threads;
- the wpm 's' loader at 2.8 s;
- TikTok's pixel at 1.6 s.
Whatever thread they run on, they compete for a low-end phone's cores. Also, the Meta and TikTok forwarding is defined in this repository's own custom pixel source, shopify/pixels/hs2-funnel.js (pixel IDs are blank in the source; the copy pasted into admin may differ).
  - Fix: Split CPU by thread, main versus worker, in tr.cjs. Name the five pixel sandboxes by app. Point Krish at the specific Customer events entries and at hs2-funnel.js.
- **minor.** Fix 2: hs-journey-choose.js prefetches the document for nextGift().url on reveal.
  - Problem: The reveal comes before the tick and the add, so the prefetched HTML carries the pre-add cart (Helio's server-rendered cart drawer and count). Whether Chrome throws away a same-origin prefetch when Shopify's cart cookies change is unverified. The gain is small, because the next page's subresources are already cached by then.
  - Fix: Prefetch the next gift's document only after the add returns, or skip it. If it stays, add a test that after an add the next page's server-rendered cart count matches /cart.js.
- **minor.** Fix 2 test: on the gifts step there is exactly one speculation-rules script.
  - Problem: On live, something already injects <script type="speculationrules">{}</script> at runtime on both home and the mug page (measure.mjs `spec` returned ["{}"]; it is not in the server HTML). The assertion would fail in the live gates, and the injector is unknown. An unknown script managing speculation rules is also the future prerender risk the guard is meant for.
  - Fix: Assert on script[type=speculationrules][data-hsj-warm] only, and assert that no rule set on the page contains a 'prerender' key. Identify the script that injects the empty rule set.
- **minor.** Prerender guard goes in hs2.js init() (line 4525).
  - Problem: init() is defined at hs2.js:4508. Line 4525 is the DOMContentLoaded dispatch; the restorePhoto, teeinblue() and journeyAutoSend() call is at 4521-4522.
  - Fix: Cite 4508 to 4523 for the guard.

## Missing

- The gift page's questions and studio talk (hs-journey.js gift mode, hs-wait.js, hs-journey-choose.js) also wait behind app-v1.js on cold arrivals, so the questions appear at about 16 s even though parsing ends at about 3 s. Fix 3 only moves the photo. Option, inferred, needs tests: when on && mine, the inline journey check injects those three scripts as async, they start at readyState 'interactive', and answers are queued until window.__hs2api exists. The failing test: hold assets/hs2.js and Teeinblue for 10 s; the first question shows within 4 s, and the answers still reach journeyAnswers once hs2 runs.
- Desktop is not measured. On desktop the flow slider is above the fold and the reel sits beside it, so fix 1's deferral of the flow pictures changes what the desktop first screen shows.
- Interaction with the other asks. Ask 2 (the 2-second checking screen) depends on the detector timing in fix 5. If Ask 5 moves the questions before the painting, the gift page's critical path becomes the gift-mode questions, which are behind app-v1.js today.
- The journey gift page still downloads the hidden Helio gallery: mug-real-golden.jpg at 86 KB with fetchpriority high, plus six thumbnails. That competes with app-v1.js and no fix is offered. A lean alternate product template opened through ?view= is a possible structural option (inferred; each gift kind needs its own section settings and Teeinblue's app block; Krish's call).
- The eager golden hero (205 KB, fetchpriority high) still downloads on every routed ?step= load, where .hss is display:none, competing with that step's own images.
- Field proof per fix: Shopify's Web performance p75 mobile LCP and the funnel (sessions, gifts step, Start painting, add to cart), with dates, because the lab harness's model of the network is not a phone's.
- A real-prerender test in Chromium, not only a stubbed document.prerendering: a local page with a prerender rule pointing at the preview journey URL; no send happens until activation, then exactly one send.
