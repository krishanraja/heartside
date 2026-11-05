North Star: this moves conversion. The paid traffic arrives on phones, and faster pages mean more buyers reach "Start painting" and see the painter start sooner, which feeds net sales (U5, $69 against $658). I have not measured the sales effect; the funnel test is under item 7.

# Speed on a throttled phone: measurements, root causes and ranked fixes for heartside.io

Nothing in the repository or on the store was changed. On the live store I only made GET requests. Every non-GET request and every `*.n8n.cloud` request was aborted. No gift page was loaded with a photo, and nothing was added to a cart.

**Profile:** Chromium at 390x844, DPR 3, touch, 4x CPU slowdown, Lighthouse "Fast 3G" (562.5 ms latency, about 184 KB/s down), cache off unless a row says otherwise. Each cold baseline is 3 runs.

## 1. Measured baseline (live)

| | Home `/` | Mug page (no journey) |
|---|---|---|
| TTFB | 0.35–0.42 s | 0.34–0.44 s |
| FCP | 2.40–2.49 s | 2.38–2.56 s |
| LCP | **20.55–20.60 s** | 3.8–6.7 s |
| LCP element | hero reel image (whichever set is on screen; run 0 recorded the doodle) | `mug-real-golden.jpg` at width 1200, 84–98 KB, fetchpriority high |
| DCL / load | 11.3 / 24.3 s | 14.9–15.3 / 19.6–24.5 s |
| CLS | 0.002 | 0.001–0.015 |
| Requests / bytes | 342 / 4.26 MB | 366 / 3.11 MB |
| Long tasks | 2.2–2.4 s | 4.6–5.5 s |

**Home by type:** images 2.0 MB, scripts 1.27 MB, prefetch "Other" 0.66 MB, fonts 278 KB, CSS 60 KB.
**Home by origin:** heartside.io 3.44 MB, googletagmanager 509 KB, connect.facebook.net 209 KB, cdn.shopify.com 200 KB.
**Bytes started before LCP on home:** 3.47 MB of the total.

**Render-blocking in the head:** `base.css` (6.8 KB), `accelerated-checkout-backwards-compat.css` (1.9 KB) and `compiled_assets/styles.css` (18.3 KB). There are no synchronous scripts; Helio's 36 head scripts are module or defer. Stylesheets in the body (`hs-brand.css`, `hs2.css` at 19 KB brotli / 106 KB decoded, `hs-journey.css`, `hs-showcase.css`) arrive by 2.2 s. FCP is the document plus about 1.3 s, so CSS is not what holds LCP back.

**Fonts:** all use `font-display: swap`.
- Preloaded: `hs-fraunces.woff2` (62 KB) and Helio's Anek Tamil (42 KB). Helio's Anek Tamil preload tag appears four times in the head.
- Also loaded: DM Sans (32 KB), Fraunces italic (78 KB, finishes at 14.4 s) and Shop's GTStandard (64 KB, platform).
- The `@font-face` block appears four times because `hs2-head` is rendered by four sections.

**Largest scripts and where they run (coverage on home, main-thread time at 4x):**
- gtag/js, loaded 3 times: 509 KB on the wire, about 1 s of main thread.
- Facebook: 209 KB, 0.42 s.
- Shopify web pixel manager (wpm): 84 KB, 0.35 s.
- `hs2.js`: 48 KB brotli / 181 KB decoded. On home only 10% of it is used (header, menu, memo countdown). It runs 4 times, but its guard stops the extra runs.
- `hs-artwork-engine.js`: 69 KB decoded, runs 4 times with no guard. Home only needs the style labels.
- `hs-breeds.js`: 48 KB decoded. Home never uses it; the breed question is gift mode only.
- Teeinblue on home: only `async.js` (1 KB).
- Dog detector on home: does not load on the first screen. On `?step=photo` it downloads **18.4 MB** about 0.8 s after the step opens, with no photo picked: `tf.min.js` 285 KB plus the `ssdlite_mobilenet_v2` model and shards, about 17.6 MB, with `max-age=3600`. At Fast 3G that is roughly 100 s (calculated).

**Images against displayed size:** sizes are right.
- Hero: 1080w in a 390 px slot at DPR 3.
- Flow slider: 720 px for a 230 px slot.
- Strip tone and scene cards: 540 px for 118 px cards, about 1.5 times what they need.
- Gift page main image: width 1200 for 1170 device pixels.

**Shopify checkout prefetch:** 63 `rel=prefetch` checkout files (617 KB), but only after `load`. This comes from the platform; the theme has no control over it.

**Gift page:**
- Teeinblue `app-v1.js` is 424 KB on the wire / 1.66 MB decoded, and 35% of it is used. Teeinblue's own 2 s fallback loader makes it execute twice. It finishes at 12.9–13.5 s.
- `plugins/image-placement.js` (96 KB) loads only after that, finishing around 20 s.
- In journey mode the hidden gallery images (144 KB) still download.

**What the journey gift page needs before its first useful paint.** Live probe: `?journey=1` with journey state in sessionStorage but no photo on the device, so nothing could paint.
- The frame (`hs-jm-on`) paints at 2.8–3.8 s.
- `hs2.js` and `hs-journey-choose.js` are ready at 13.8–15.2 s.
- Teeinblue's photo field appears at 15.4–16.0 s.
- 2.17 MB loads before Teeinblue is ready.
- With the home page already cached (the real journey order), these become: `hs2.js` ready at 9.5 s, Teeinblue field at 10.3 s.
- The buyer's photo reaches the easel only after `hs2.js` runs, so about 9.5 s warm and about 14 s cold. That is inferred from `hs2.js` restoring the photo right after it starts.

## 2. Root causes, with file and line

1. **The hero reel loads all six sets at once and turns before any picture has arrived.**
   - `snippets/hs-showcase-fig.liquid:12` gives every set its `src` and `srcset`. Sets 2 to 6 are `loading="lazy"`, but they sit stacked in the viewport (`hs-showcase.css:72` and `:136-138`), so lazy loading does nothing.
   - `hs-showcase.js:130` (`nx.loading='eager'`) does nothing for the same reason.
   - `restart()` at `hs-showcase.js:132` turns every 2.2 s from DCL (11 s), whether or not the next picture has loaded.
   - Result: the first set (fetchpriority high, requested at 1.1 s) shares bandwidth with 865 KB of other sets and lands at 19.2 s.
2. **Below-the-fold examples download early.** About 940 KB of examples (`sections/hs-showcase.liquid:27-45` and the flow figures at `hs-journey.liquid:154-156`) start at 2.6 s. Chrome's lazy-loading distance on slow networks reaches them, so they compete with the hero picture too.
3. **The gift page's critical scripts are gated by everything else.**
   - Deferred scripts run in document order after every earlier deferred or module script has downloaded: Helio's head modules, then `hs2-head`, then `hs-journey-choose`.
   - `hs2.js` only starts at `init()` (`hs2.js:4525`), and only then restores the photo.
   - The easel photo comes from `__hs2api.usePhoto.file` (`hs-journey-choose.js:59-64`).
   - The painter also waits for Teeinblue's 424 KB plus 96 KB.
4. **The photo step warms the 18.4 MB detector with no photo picked.** `hs-journey.js:630` calls `warmDetector()`, which runs at `hs-journey.js:789-795`; `hs-photo-quality.js:296-306` loads the model.
5. **Third-party pixels cost about 1.1 MB on home and roughly 1.8 s of main thread.** They start at 16 s, so after fix 1 they no longer affect LCP. They are set up in Shopify admin, not in the theme.

## 3. Fixes, ranked by measured gain

### 1. Home: one hero picture first, everything else after load. LCP 20.8 s to 7.9 s.

Measured with an A/B harness: the live server HTML is served from a saved copy and every other file comes from the live store. The control reproduced live (LCP 20.8 s against 20.6 s).

| Variant | LCP | DCL | Load | Bytes before LCP |
|---|---|---|---|---|
| Control | 20.79–20.82 s | 11.5 s | 24.4 s | 3.62 MB |
| 1a: sets 2 to 6 deferred | 13.86–13.90 s | | | 2.92 MB |
| 1a + 1b: below-fold also after load | 7.90–7.98 s | 6.9 s | 15.7 s | 1.32 MB |

**Changes:**
- `snippets/hs-showcase-fig.liquid`: add a `later` parameter.
  - It writes the picture's URLs as `data-hss-src` / `data-hss-srcset` with no `loading` attribute, keeping `width`, `height`, `sizes` and `alt`.
  - It also writes a `<noscript><img …real src/srcset…></noscript>`.
- `sections/hs-journey.liquid`:
  - Lines 124-128 (sets 2 to 6) and 154-156 (the flow figures) pass `later: true`.
  - Add `<noscript><style>.hss-fig img[data-hss-src]{display:none}</style></noscript>` once.
- `sections/hs-showcase.liquid:27-45`: the strip cards pass `later: true`.
- `assets/hs-showcase.css`: add `.hss-fig img[data-hss-src]{color:transparent}`. The aspect ratio and background (line 28) already fix the box size.
- `assets/hs-showcase.js`, reel section (lines 120-151):
  - Add `hydrate(img)`, which moves `data-hss-*` into `src`/`srcset`; `imgAt(k)`; `shown(img)`, which is true when the picture is complete and has a width; and a `loaded` flag set on window `load`.
  - `go(i)` hydrates the set it is about to show. It hydrates the next set only when `loaded && shown(current)`. This replaces line 130.
  - The `restart()` interval becomes "advance only if the next picture is shown, otherwise hydrate it and keep the current set on screen".
  - Swipes and arrow keys still go straight to the chosen set.
  - With reduced motion, or when the reel does not go live, hydrate every reel picture on `load`, because the swipe row shows them all.
  - Strip: on `load`, hydrate every `img[data-hss-src]`, both the originals and the loop copies (copies are made at DCL and carry the attributes). Hydrate earlier through an IntersectionObserver (bottom margin 50%) if the buyer scrolls there first.
  - Flow slider: hydrate when the first set's picture fires `load`. On desktop the flow is above the fold.

**Tests** (new `tools/preview/speed-home.browser.test.mjs` against `out/index.html`, plus the existing showcase and homepage tests). They fail today and pass after:
- With `hs-hero-golden-*` held back for 3 s, no other `hs-hero-*` or `hs-ex-*` image is requested before golden finishes.
- With `hs-hero-lab-*` held back for 6 s, the reel stays on set 0 until lab's image has loaded, then moves on.
- No `hs-ex-*` request starts before window `load` unless the strip is scrolled into view.

These must keep passing:
- Every slide's `getBoundingClientRect` is the same before and after hydration (nothing changes size).
- With reduced motion, all six sets have `src` after load.
- With JavaScript off, the `noscript` images are present.
- The existing checks still pass: the reel moves on by itself, a swipe skips, the strip drifts.

**Proof:** `exp-home.mjs` against the new theme's saved preview HTML against today's, 3 runs each, plus `measure.mjs` on live after the push. Target: LCP about 8 s and 1.3 MB before LCP.

### 2. Warm the first gift page from the gifts step. Painter ready 10.3 s to 3.7–3.9 s.

Measured with the HTTP cache on (a real phone): home page, then 30 s on it, then the gift page by `location.href`, as "Start painting" does.

| | Control (2 runs) | Warm (2 runs) |
|---|---|---|
| FCP | 1.47–1.69 s | 0.92–1.06 s |
| LCP | 4.84–4.97 s | 1.56–1.60 s |
| `hs2.js` ready | 9.50–9.55 s | 2.54–2.60 s |
| Teeinblue photo field | 10.31–10.33 s | 3.70–3.93 s |
| Gift page network | 1.82 MB | 1.06–1.36 MB |
| Document | network | from prefetch (TTFB 7–9 ms) |

The warm-up costs about **+0.6 MB** on the home page. When the navigation is done with `page.goto`, which the prefetched document does not serve, the subresource warm-up alone still brings the field to 4.2–5.9 s.

**Changes:**
- `sections/hs-journey.liquid`, config JSON (lines 59-106): add `"warm": [ … ]` with the `asset_url` of `hs-journey-choose.js`, `hs-journey-choose.css`, `hs-wait.js`, `hs-wait.css`, `hs-breed-facts.js` and `hs-breeds.js`.
- `assets/hs-journey.js`: new `warmGift()`, called from `render()` when the step is `gifts` (line 631) and after every gift or colour change (the `data-hsj-variant` and pick handlers around line 683).
  - It builds `giftURL()` for the first chosen gift and variant. This must be exactly the `queue[0].url` that `handOver` will produce.
  - It replaces one `<script type="speculationrules" data-hsj-warm>` containing `{"prefetch":[{"source":"list","urls":[url]}]}`. **It must never contain `prerender`.**
  - It adds `<link rel=prefetch as=script|style>` for each URL in `cfg.warm`.
  - It adds Teeinblue's `https://sdk.teeinblue.com/shopify/app-v1.js?token=…&shop=…` and `https://sdk.teeinblue.com/plugins/image-placement.js`. The token and shop are read at runtime from the page's own `sdk.teeinblue.com/async.js` script tag; I verified the built URL is identical to the one on the product page today. Check token against `^[A-Za-z0-9]+$` and shop against `^[a-z0-9-]+\.myshopify\.com$`, and never write them into theme source.
  - Skip everything when `navigator.connection.saveData` is on.
  - Feature-detect with `HTMLScriptElement.supports('speculationrules')`.
- `assets/hs-journey-choose.js`: on reveal, prefetch the document only for `nextGift().url`. Its scripts are already cached.
- **Required safety, in the same change:** in `hs2.js` `init()` (line 4525), when `document.prerendering` is true, wait for `prerenderingchange` before restoring the photo, starting Teeinblue and calling `journeyAutoSend()`. Then not even a future prerender (Shopify's own rules or a Chrome heuristic) can send a photo.

**Tests:**
- `journey-flow.browser.test.mjs`. Fails today:
  - On the gifts step there is exactly one speculation-rules script. Its JSON has a `prefetch` key and no `prerender` key, and lists exactly `queue[0].url` including the variant.
  - It updates when the colour changes.
  - Nothing is prefetched before the gifts step.
- `journey-product.browser.test.mjs`. Fails today:
  - With `document.prerendering` stubbed true, `__painted` stays 0 for 10 s.
  - After flipping it and firing `prerenderingchange`, `__painted` is exactly 1.

**Proof:** `exp-warm.mjs` with variant `c` against a new natural variant (no injected warm-up), `js` navigation, 3 runs each.

### 3. The buyer's photo on the easel at first paint. Local: 3.85 s to 2.26 s.

Measured locally on `tools/preview/out`, with gzip and the same throttling: `[data-hs-jm-photo]` showed the photo at 3.80–4.28 s today and 2.07–2.36 s with the change, about 0.1 s after the frame. `hs2.js` and `hs-journey-choose.js` still ran, with no errors.

On live the gap between the frame and `hs2.js` is 11 s cold (measured), so the inferred gain is about 6–11 s for arrivals the warm-up does not cover. That includes reloads, links in email, Back and Forward, and Safari, which supports neither speculation rules nor `rel=prefetch`.

**Changes:**
- `snippets/hs-journey-choose.liquid`, the inline script at lines 86-102, inside `if (on && mine)`:
  - Open IndexedDB `hs2` version 1, store `files`, key `headshot`, read-only.
  - Use the record only if `rec.t === hs2-review.hs3_photo_t` and it is less than 3 days old.
  - Set `window.__hsjmPhoto = URL.createObjectURL(rec.file)`, fill `[data-hs-jm-photo]` and `[data-hs-jm-face]` (only if they have no `src`), and hide the paw icon.
  - Wrap it in try/catch; `hs-journey-choose.js` still takes over.
- `hs-journey-choose.js` `ownPhoto()` (lines 59-64): reuse `window.__hsjmPhoto` first.

**Test** (`journey-product.browser.test.mjs`). Fails today: hold `assets/hs2.js` and `assets/hs-journey-choose.js` for 10 s. The easel photo must be complete with a width within 3 s of the response starting (`waitUntil: 'commit'`). Also:
- A photo whose `t` differs from `hs3_photo_t` is never shown.
- After the scripts are released, `__painted === 1` and the easel's box is unchanged.

**Proof:** `exp-easel.mjs` with `a` against `b`, then the live probe after the push (still with no photo).

### 4. Third-party pixels (Krish's decision, in Shopify admin)

On top of fix 1 they leave LCP unchanged (7.88–7.99 s), but they move load from 15.7 s to 8.7 s, cut about 1.1 MB and remove roughly 1.8 s of main thread at 4x. Three separate gtag loads (509 KB) suggest the Google tags can be merged into one; that is inferred. Meta and TikTok are worth keeping only if their ads run.

### 5. The detector on the photo step (Krish's decision)

It costs 18.4 MB measured. It would also starve fix 2's warm-up on slow phones.

Options:
- (a) Keep it as it is.
- (b) Load it only after a photo is picked, and only on `effectiveType '4g'` without `saveData`. Safari has no `navigator.connection`, so it needs its own rule.
- (c) Use a quantized, self-hosted model (inferred at about 4–5 MB), with a parity test on the multi-dog photos.

The 5 Nov judges asked for the multi-dog check, which is why this is his call.

### 6. Small, measured in bytes, gain under 0.5 s each

- Drop `hs-breeds.js` from home (`hs-journey.liquid:21`, 14 KB brotli). It stays on gift pages and is in the warm list.
- Helio's Anek Tamil (42 KB, a theme setting).
- Subset or instance the Fraunces italic (78 KB). This is a Codex card.
- Re-encode the hero webp images (inferred 30–40% smaller). Also a Codex card.
- Add a run-once guard to `hs-artwork-engine.js` (CPU hygiene only).

### Not worth doing (measured)

- **Preloading the LCP image:** the image is already requested at document arrival (1.08–1.14 s) with fetchpriority high.
- **CSS:** it is not on the LCP path.
- **TTFB:** it is Shopify's server time.
- **Helio's 52 module requests (97 KB):** they hold back the gift page's DCL. Fixing that means editing the layout through the guarded workflow; the gain is inferred and it ranks below fix 2.

## 4. What must stay true

- **One painting per gift:** a prefetch downloads bytes and runs nothing. The prerender guard and the `journeySentKey` lock both stay.
- **Nothing changes size:** placeholders keep `width`/`height` and the 4/5 aspect ratio. Tests compare boxes before and after.
- **Copy:** no copy changes are needed. Any new comment text uses no exclamation marks or em dashes and US spelling.
- **Reduced motion and no JavaScript:** every picture is still there.
- **Data cost:** the warm-up costs data only on the gifts step, never with `saveData`.
- **Private values:** no Teeinblue token, store handle, theme id or n8n address goes into source.

## 5. Needs Krish or a live check

- **Krish decides:** items 4 and 5.
- **Live checks:**
  - After the push, a GET of a product page confirms the built `app-v1.js` URL still matches.
  - On a real Android phone, Chrome serves the prefetched document.
  - An iPhone run (CoWork) shows no regression; no WebKit runs offline here.
  - One real journey on live with a photo confirms one painting per gift. That must be Krish or CoWork, never an agent.
- **Effect on sales:** Shopify's funnel before and after (sessions, then the gifts step, then "Start painting", then add to cart).

## 6. Measured against inferred

**Measured:** every number in sections 1 and 3, except the ones listed as inferred below.

**Inferred:**
- The live easel times and the live gain from fix 3.
- Safari's behavior.
- The quantized model's size, merging the Google tags, the re-encode savings.
- The Helio module gain.

**Caveats:**
- DevTools throttling shares bandwidth equally and ignores HTTP/2 priorities, so the contention gains are upper bounds. The direction holds.
- The emulated latency was not applied to the navigation request, so TTFB is roughly server time plus the sandbox proxy.
- Aborted analytics POSTs slightly understate bytes and main-thread work.
- The warm-up test used the plain gift page (same files as the journey page) and 30 s on the first screen, not on the steps.

All harness scripts and results are in `/tmp/claude-0/-home-user-heartside/2e077d0e-1ec9-5845-8fab-a9e6b1438927/scratchpad/perf/`. Run them with node from `tools/preview`.
- `measure.mjs`: cold live loads.
- `exp-home.mjs`: the home page A/B with saved HTML.
- `exp-warm.mjs`: the warm-up test with the cache on.
- `exp-easel.mjs`: the local easel test.
- `probe.mjs`: the live journey page with no photo.
- `tr.cjs`: main-thread time per script from a trace.
- The result `*.json` files.

`home.server.html` and `mug.server.html` in that folder contain the store handle, the theme id and the Teeinblue token. They are local working copies only; never commit or publish them.