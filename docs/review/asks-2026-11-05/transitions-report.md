**North Star:** this moves the journey's conversion to cart, and so Shopify net sales (U5, $69 against $658 this week). Nothing in the repo was edited, committed or pushed. HEAD moved from b13bb78 to 31dc9c2 during the run, but only a now-notes file changed. On the live store I made only plain GETs with curl: `/`, `/products/your-dogs-portrait`, its headers and `base.css`. No page was loaded in a browser, no photo was sent and nothing was POSTed. All browser work ran locally against copies of `tools/preview/out` (`render.mjs` was not run).

## Ask 3: why the journey jutters, and one motion system to fix it

**How I measured it.** I wrote a Playwright recorder at 390x844 (also 320x568 and 1440x900), run on a normal connection and throttled like a phone (150 ms RTT, 1.6 Mbps, 4x CPU). It captures every frame with CDP screencast and samples, each frame, the position, size and opacity of the bar, progress line, dock, button and headline, and notes when an element is destroyed and rebuilt. It also logs layout shifts, long tasks, long animation frames, slow events, resource timing and font loads. It covered 21 screen changes: the home steps, Back, the handoff to the gift page, the easel-to-card swap, the studio, the questions, the note, the wait, the reveal and the next gift.

All requests to other hosts, n8n included, were aborted. One thing you should know: the preview home page carries a `<link rel="preconnect">` to the note writer's host. Route-abort cannot stop a preconnect, so Chromium may have opened a bare connection in my first runs. No HTTP request or webhook call went out. Later runs removed the hint and made Chromium resolve `*.n8n.cloud` to nothing. The repo's browser tests have the same gap.

### Root causes, measured

1. **Every step blanks the whole screen, chrome included (verified, all 14 step changes).**
   - `hs-journey.js:628` rebuilds the bar, line, content and dock with `app.innerHTML` on every step.
   - `hs-journey.css:319` then fades the whole screen in from 0 over 0.24 s.
   - So about 53 ms after each tap there is one fully blank cream frame. The bar, the line and the black button then fade up from opacity 0 across 14 to 15 frames, so the dock blinks on every step.
   - Because the line is a new element each time, its transition (`hs-journey.css:36`) never plays and the line jumps rather than glides.
   - The painting badge's spinner (built at `hs-journey.js:367`, animated at `hs-journey.css:313`) restarts on every question.

2. **Gift-page phase changes blink or cut (verified).**
   - In `hs-journey-choose.js:146-151`, changing between the frame and the questions hides one and fades the other in from 0, leaving a blank frame (about 159 ms in on note to wait).
   - Inside the frame, phase changes (wait to reveal, reveal to added) cut instantly. Re-adding `.is-in` keeps the same animation name, `hsj-step` (`hs-journey-choose.css:24` and `hs-journey.css:319`), so the animation never restarts. The reveal, the emotional peak, is a hard cut.

3. **The button jumps 44 px between the studio and the questions (verified).**
   - The frame's dock (`hs-journey-choose.liquid:61-65`) has three rows: the tick, the button, then the line. It is 184 px tall; the question dock is 88 px.
   - At 390x844 the button sits at y 728 in the studio, wait and reveal, and at 772 in the questions. At 320x568 it is 456 against 500.
   - This happens on every studio-to-questions and note-to-wait change, against the ruling that the dock never moves.

4. **The progress line runs backwards after the note (verified).**
   - `hs-journey-choose.js:148-151` unhides the frame and forces a reflow while its line still holds the studio's 45%. `paint()` then sets 95%.
   - The line goes from 90% at the note down to 45%, then climbs to 95% (measured 351, 176, 185 ... 371 px).

5. **The handoff to the gift page shows the store header, then jumps (verified locally, inferred on live).**
   - The journey switch lives in the body: the `hs-jm-on` header-hiding CSS is in `hs-journey-choose.css:11-14`, linked at `hs-journey-choose.liquid:12`, and the inline class switch is at `:82-103`. The header group comes before both.
   - Locally the frames go: blank at 77 ms, then the memo strip and store header at 116 ms, then blank at 202 ms, then the whole frame fading in at 230 to 300 ms. Layout shift is 0.135, with `#MainContent` moving up 114 px; the throttled run counts it as CLS 0.1354.
   - Throttled with a cold cache the gift page is blank from 0.6 s, and its first contentful paint is at 3.9 s. That figure is pessimistic: the preview loads assets from `/products/assets/` on gift pages, so nothing is cached between the two pages. On live both pages use one CDN URL.
   - On live, the served HTML has the same order: header group at lines 1761 and 1787, the journey stylesheets at 2891 to 2905, the class switch at 2978. So the same flash is likely live; I did not see it there.
   - Separately, `hs2-head.liquid:10` (`@view-transition{navigation:none}`) switches off Helio's cross-page transitions on all our pages.

6. **The easel-to-card swap changes size (verified).**
   - `hs-journey-choose.js:68-69` swaps the easel for hs2's card instantly.
   - The card's bubble is sized by hs-wait.js, which measures every line the dog could say (`fitTalk`, about `hs-wait.js:174-202`). The easel's bubble is just `min-height: 76px` (`hs-wait.css:32`), and the easel has no 6 px bar.
   - Measured growth: 480 to 510 px (portrait at 390x844), 345 to 375 px (mug, which also re-centres 15 px, CLS 0.0077), and 247 to 313 px at 320x568 (+66 px).

7. **Pictures arrive after their screen (verified throttled).**
   - The style and gift images are `loading="lazy"` (`hs-journey.js:447`, `:458`, `:495`), and only start loading when their screen renders.
   - Throttled, the style cards stayed empty for up to 1.2 s and the gift photos for 0.84 s, popping in one by one.

8. **A stall before "See Pickles painted" moves anything (verified).**
   - Nothing moves for about 110 ms on desktop and about 250 ms at 4x CPU after the tap.
   - The main cost is the ResizeObserver at `hs-wait.js:198`. Going hidden (width 0) counts as a width change, so when the frame reappears it re-measures every line (a 54 ms long animation frame at 4x CPU). `sendAnswers` in the click adds a little.

9. **The italic font loads late (verified locally, small effect on live inferred).** `hs-fraunces-italic.woff2` is first requested at the note screen, about 239 ms after it shows. The italic dog's name in the headline and the signature can swap fonts.

I found no scroll jumps (scrollY stayed 0 throughout), no other font swaps, and no long tasks over 60 ms on the home steps.

### The design: one motion system

**Rule:** the bar, the progress line and the dock never move or blink. Only the content moves, 16 px in the direction of travel (forward slides left, Back slides right). The line glides forward and only forward. The chapter label fades through.

**Engine:** same-document View Transitions (`document.startViewTransition`). Without them the new content simply fades in, opacity only, because a slide in the fallback would let the page scroll. With reduced motion, swaps are instant.

**Tokens on `:root`:**
- Easing: `--hsj-ease-in: cubic-bezier(.2,.8,.2,1)` and `--hsj-ease-out: cubic-bezier(.4,0,1,1)`.
- Content: out 120 ms, in 240 ms after a 100 ms delay (a fade-through, about 340 ms total). The prototype used 140 / 260 / 60 ms, and its frames showed headlines overlapping mid-change, so I recommend the 120 / 240 / 100 version. That tweak is not separately measured.
- Shift 16 px; line 420 ms; label out 100 ms, in 160 ms; reveal rise 420 ms (scale 0.98 to 1); easel dissolve 400 ms; gift-page content fade on first paint 300 ms.

**View-transition names, set only while `html[data-hsj-vt]` is present:**
- `hsj-content` on `.hsj-content`. Its group has `animation: none` so it never morphs, and its old and new images use `height: auto`.
- `hsj-label` on `.hsj-bar__step`, with `object-fit: none` so the text never stretches.
- `hsj-line` on `.hsj-progress span`. The group animates over 420 ms, the old image is `display: none`, and the CSS transition is off while a transition runs.
- `hsj-paint` on the painting badge.
- The root gets `view-transition-name: none`, which matches Helio's own `base.css`. Entering from the first screen (`data-hsj-vt="enter"`) crossfades the whole page over 260 ms, which also hides the header leaving.
- `html[data-hsj-vt]::view-transition { pointer-events: none }`, as Helio does. Taps pass straight to the new screen, and the existing double-tap guard stays.

**Must never be named or animated:** the dock and its button, the tick and the status line, the back button, the dog's typing in the studio bubble, the note's own line-by-line arrival, and the painting card's internals.

### Changes by file

The prototype implements all of this as exact anchored edits in `/tmp/claude-0/-home-user-heartside/2e077d0e-1ec9-5845-8fab-a9e6b1438927/scratchpad/motion/patches.mjs`. Each anchor is asserted to occur exactly once, so it doubles as an edit list.

**`shopify/assets/hs-journey.js`**
- Split `render()` (615-628):
  - Add `moving(dir, update)`: if transitions are supported, not reduced and a direction exists, set `html[data-hsj-vt]`, call `startViewTransition(() => { update(); return settle(); })`, swallow its three promises (`quiet`), and remove the attribute on `finished`. Otherwise call `update()` directly.
  - Add `settle()`: wait for the new content's undecoded images, at most 150 ms.
  - Direction: back if the new step's index is lower, forward otherwise, `enter` from or to the hook.
  - `draw(step)` is the old body. It sets `render.shown`, then replaces line 628 with `keep(cur, html, step)` when a screen exists (innerHTML only for the first).
  - `keep()` parses the new screen and replaces the bar, moving the existing badge node into it so the spinner keeps turning. It keeps the existing line span and copies only its width and `aria-valuenow`. It replaces `.hsj-content` (adding `hsj-content--in` when there is no View Transition) and the dock, then updates `data-hsj-screen`.
  - Remove the two-dog sheet on every draw, as the innerHTML wipe did before.
- Preload: on `photo` preload `cfg.examples`; on `look` and `tone` preload `cfg.scenes` (`new Image()`).
- Change the three `loading="lazy"` to `decoding="async"`.
- Expose `window.HSJMotion = {moving, VT}`.
- Note: with a View Transition the DOM swap lands about a frame later. Same-step re-renders (breed "another breed" and "pick from the list") stay synchronous, and `chip()` re-runs on every 700 ms tick.

**`shopify/assets/hs-journey.css`**
- Drop the whole-screen `hsj-step` animation (319, and its line 321 entry).
- Add the motion block: tokens, names, `hsj-out` / `hsj-in` and their Back versions, `hsj-fade`, `hsj-rise`, the line transition `var(--hsj-t-line)`, and the reduced-motion rule.

**`shopify/assets/hs-journey-choose.js`**
- `go()` (134-152):
  - Set `phase` immediately and put the DOM work in `apply()`, which returns early if a later `go()` moved on.
  - When re-showing the frame, set the line's `transition: none`, unhide the frame, call `paint()`, force a reflow, then clear the transition. This fixes the backward line.
  - Run `apply` through `HSJMotion.moving('forward')`, except for the page's first phase and except for `reveal`, which must stay synchronous. In the prototype, deferring the reveal let hs2's half-changed card render for one frame (CLS 0.15).
  - Remove the `is-in` lines.
- `easel()` (68-69): when the card is on and the easel is still showing, add `is-leaving` and hide the easel after 420 ms; with reduced motion, hide it at once.

**`shopify/assets/hs-journey-choose.css`**
- Remove `.hs-jm__frame.is-in` (24 and 109).
- Phones: `.hs-jm__dock .hs-jm__line { order: 2 }` and `.hs-jm__dock .hsj-btn { order: 3 }`, so the button sits where it sits on every other screen.
- `.hs-jm__paint` (40) becomes `display: grid; grid-template-columns: minmax(0,1fr); justify-items: stretch`, with children in `grid-area: 1/1`. The column must be definite: an auto column collapsed the done card to 6 px in the prototype.
- `.hs-jm__easel`: `z-index: 1` and an opacity transition of 400 ms. Add `.hs-jm__easel::after`, a 6 px bar in #E2D4C8, matching the card's bar. Size the easel bubble with `height: var(--hs-jm-talk-h, 108px)`, or 137px under 360 px wide.
- `.hs-jm__reveal`: the 420 ms rise. The reveal heading and the frame's `.hsj-content` fade in over 300 ms.

**`shopify/assets/hs-wait.js`**
- Line 198: only re-fit when the new width is non-zero and different (`nw && nw !== w`). This removes the refit stall when the frame reappears.
- Expose `__hsWait.fit(bubbleEl)` using the same line list, so the easel's bubble gets exactly the card's `--hs-wait-h` instead of my measured 108 / 137 px defaults.

**`shopify/snippets/hs-head.liquid`** (product template only)
- This snippet is already rendered before `</head>` on the live layout by the theme push's `head_heartside` option; its favicons are in the served head.
- Add:
  - Critical CSS: cream background, and hide the header and footer groups under `html.hs-jm-on`.
  - `<link rel="expect" href="#hs-jm-ready" blocking="render" id="hs-jm-blocker">`.
  - An inline script that repeats the snippet's journey check (`hs-journey-choose.liquid:86-101`, using `product.handle` and `product.id`). On a journey load it adds `hs-jm-on` and removes the blocker after 1500 ms. Otherwise, or on any error, it removes the blocker at once.
  - A preload for `hs-fraunces-italic.woff2`.
- In Chrome and Edge the gifts screen, with its busy button, then stays on screen until the frame arrives. Safari ignores `rel=expect` and simply never paints the store header.
- Setting `hs-jm-on` earlier only affects hs2.js's header clearing (`hs2.js:3553`), which it skips.

**`shopify/snippets/hs-journey-choose.liquid`**
- Add `<span id="hs-jm-ready" hidden></span>` after line 66.
- Have the inline script also write the bar label "The painting · gift N of M". Today the label changes after the scripts load.
- Keep its own class switch as a fallback.

**`tools/preview/render.mjs`** (`writePage` head): render `hs-head`, so the preview sees the head switch.

**Phase 2, optional: a cross-page dissolve on the handoff.**
- Chrome and Edge 126+ and Safari 18.2+ support it. Helio's own script skips it in Android WebView, Instagram, Facebook and TikTok in-app browsers, on low-power devices and with reduced motion.
- Use Helio's own `pageswap` / `pagereveal` mechanism. On Start painting, set `data-view-transition-type="hsj-handoff"` and `data-view-transition-triggered` on the button, and switch off `hs2-head`'s `navigation:none` by marking it `data-hs-vt-off` and setting `media="not all"`. On the gift page, do the same when `hs-jm-on` is set.
- Scope the names to `:active-view-transition-type(hsj-handoff)`.
- Skip the transition on `pagereveal` if `#hs-jm-ready` has not been parsed yet (Safari).
- The prototype proved it in Chromium without Helio's script: the gifts content dissolves into the studio while the bar, line and button hold. It is not verified with Helio's handlers.

**Prefetch, optional:** `<link rel="prefetch">` the first gift's URL on the gifts screen (and again when the choice changes), and the next gift's URL at the reveal. Never use prerender: it would run `journeyAutoSend`, which means a paid painting. The live product HTML is `private, max-age=0, must-revalidate`, so whether Chrome reuses the prefetched page is inferred and needs a DevTools check.

### The test

Draft: `/tmp/claude-0/-home-user-heartside/2e077d0e-1ec9-5845-8fab-a9e6b1438927/scratchpad/motion/journey-motion.browser.test.mjs`, to become `tools/preview/journey-motion.browser.test.mjs`. It runs at 390x844 and 320x568, aborts n8n and every outside host, and samples every frame of each document from its first. It asserts:
- the bar, line and dock never drop below opacity 0.99;
- the dock's button has one top position across every phone screen on both pages;
- the line never shrinks within a gift-page change;
- the store header is never painted on gift-page arrival;
- the paint box is the same height before and after the card arrives.

| | Today's code | Prototype |
|---|---|---|
| New test | All 5 assertions fail on their own, at both sizes: chrome blinks; button 772 vs 728 (500 vs 456); line runs back; header paints; card 30 px (66 px) taller | Both sizes pass |
| journey-flow, 7 sizes (16 tests) | Pass | Pass |
| journey-product (30) and homepage-phone (10) | Pass | Pass |

The suite runs about 25% slower with the transitions. Most tests could run with `reducedMotion: 'reduce'`, plus one reduced-motion case that asserts no `::view-transition` animations.

### Measured before and after (prototype, local)

| | Before | After |
|---|---|---|
| Bar, line and dock opacity during a step | 0 | 1 |
| Phone button position | jumps 44 px | 772 everywhere at 390x844, 500 at 320x568 |
| Line | runs backwards | only moves forward |
| Gift-page arrival | blank, store header, blank, fade | first paint is the frame (188 to 212 ms, no shift) |
| Throttled arrival | white blank 0.6 to 3.9 s, then header | gifts screen held 1.7 s, then cream, no header |
| Easel to card | 30 to 66 px growth | identical footprint (510, 375 and 313 px) |
| Image pop-in after a screen shows | up to 1.2 s throttled | 0 frames |
| Reveal | hard cut | 420 ms rise |
| CLS | 0.135 (handoff), 0.0077 (mug) | about 0, the largest a 0.0009 shift inside the button label |

### What must stay true

- **One painting per gift.** Nothing in hs2's send path changes, the "it paints once" and repaint tests pass, and nothing is ever prerendered.
- **Nothing changes size.** The content group never morphs and the easel and card share one footprint.
- **The dock never moves** on phones.
- **No new copy.** The bar label reuses the existing strings, with no exclamation marks or em dashes.
- **Failure modes.** A duplicate transition name aborts the motion but not the update; the frame and the questions are never visible together. If `#hs-jm-ready` never arrives, the 1.5 s cap releases the page.
- **Desktop, still open.** The button moves before and after this change: the home card is content-height (y 636, 712, 744 across the home steps), and at 1440x900 the studio button is at (952, 720) against (992, 764) in the questions. That needs a design call.

### Needs Krish's decision or a live check

- **Decision:** the studio dock puts the status line above the button instead of under it. This is what lets the button stay put.
- **Decision:** approve the feel on his phone (16 px slide with the 340 ms fade-through).
- **Decision:** a fixed-height desktop home card.
- **Decision:** whether Phase 2 is worth it, given in-app browsers never get it (his in-app traffic share is unknown).
- **Live check, his own paid run on a draft theme:** how long the live handoff gap really is, whether Teeinblue's real mockups are ready when the reveal rises (inferred they may arrive after it), and how this interacts with Helio's transition script.
- **Live check:** that same-page View Transitions work inside the iOS Instagram and TikTok browsers (inferred). The fallback holds either way.

Evidence, all in `/tmp/claude-0/-home-user-heartside/2e077d0e-1ec9-5845-8fab-a9e6b1438927/scratchpad/motion/`:
- the recorder: `audit.mjs`;
- per-transition frames, `samples.json`, `report.json` and video in `out-fast/`, `out-slow/`, `out-fast-after/`, `out-slow-after/` and `out-fast-after-xdoc/`;
- filmstrips: `s04.png`, `s08.png`, `s18.png`, `s19.png` (before), `a04.png`, `a18.png`, `after-gift.png` (after), `slow-handoff.png`, `slow-after-handoff.png` and `x08.png` (cross-page prototype).