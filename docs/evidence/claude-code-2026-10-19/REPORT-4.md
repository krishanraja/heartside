# Claude Code, 19 October (fourth session): a desktop layout for the homepage

North Star part: "Heartside is the gift US dog owners reach for first". A desktop visitor who lands on a blank screen, or on a phone strip in the middle of a wide screen, never gets to the gifts. Krish, 19 Oct: "the desktop experience is awful. There is no desktop experience. In fact, the page loads blank, and then when I scroll down, it's a mobile UI."

## The resent 15 Oct list: already done

Every item in the 15 Oct prompt was done that day, with commit links in `docs/COWORK-HANDOVER-2026-10-15.md` section 5. Nothing was redone:
- The breed lookup: 68c67d3.
- Mug tab, even breaks, paws and typed lines: 7f51d53, live since PR #8.
- The V3 decisions and Fraunces: 5cc02fe.
- The handover update: 9b85b23.

The branch `cowork-handover-2026-10-15` no longer exists; its doc is on main.

## What was wrong

- **No desktop layout.** The 13 Oct build was phone-first by spec: on a wide screen the whole journey sat in a 480 px column (`hs3.css`). Before: `before-1440.jpg`.
- **The blank first screen.** Not reproduced in headless Chromium at Krish's 1896x762. There the chat starts 119 px down, under the header. The likely cause is `hs2.js` `clearHeader()`. It pads the chat section by however far any header element reaches down, and its only visibility test misses menus, drawers and popovers that are clipped or open on hover. One of those counted on Krish's browser would push the whole first screen down a screen, which matches both screenshots.

## What changed (`hs3.css` and `hs2.js` only)

- **First screen, 1000 px and wider:**
  - the words and the button on the left, the turning mug up to 560 px on the right, the ribbon full width;
  - the headline at 56 to 84 px;
  - all of it in one screen, with the button's bottom edge between 626 and 692 px at 1024x768, 1280x720, 1440x900 and 1896x762.
- **The chat, 1000 px and wider:** the note the dog is writing on the left (it stays in view as the page moves), and Biscuit, the answers and the input on the right. The panel fills the screen, and the chat no longer scrolls under the sticky header.
- **Reveal, choose and share:** a 600 px panel (it was 480).
- **`clearHeader()`:** skips closed or hover menus, drawers, popovers and dialogs, and never pads more than 200 px. The real need is about 110 px.
- **Phones:** unchanged. Every new rule is behind `min-width: 1000px`. At 390 px the page is the same, and `chat.mjs` passes.

## Evidence

- Live site with the two changed files served in their place by the test browser (nothing deployed):
  - `desktop/after-1896-home.jpg`, `after-1440-home.jpg` and `after-1024-home.jpg`;
  - `after-1440-chat-step1.jpg` and `after-1440-chat-step3.jpg`;
  - `after-390-phone-unchanged.jpg`.
- No sideways scroll at any size.
- `tools/preview`: chat, minify-check, mug-bridge, reveal, mockup-gate and theme-check all pass.

## Not done

- Not deployed. The theme push needs Krish's yes.
- The reveal, choose and share screens are a wider single column, not a full desktop redesign. They are the next step if Krish wants them two-column too.
