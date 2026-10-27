# Claude CoWork: Heartside acceptance after the 27 October redesign

Status: ASSIGNMENT, not a result. The redesign went live on 27 October ([go-live note](../evidence/2026-10-27-go-live.md)). Part A's checks were automated in `tools/preview/preview-acceptance.mjs` and passed on the unpublished copy and then on production, at phone and desktop sizes; a person still owns the items marked **(person)**. This prompt has three parts: **A** the first-look review (rerun it on any unpublished copy before a future publish), **B** production, which is now due, and **C** operator tasks that run only when Krish says so, in his session. Recheck every dynamic fact in its native system; later live readback beats this document.

## Governing facts and order

Read [`../../NOW.md`](../../NOW.md) first (current state, the one next action), then [`../SCOPE.md`](../SCOPE.md) (approved scope, amended 27 October), [`../ECONOMICS.md`](../ECONOMICS.md) and [`../evidence/2026-10-27-journey-redesign.md`](../evidence/2026-10-27-journey-redesign.md) (what changed and what is not yet proved). Anything under `docs/history/` is provenance only.

Expected core: illustrated mug $45 (inside black, dark blue, dark green, pink or red), word-free 50×60 sherpa blanket $129, 12×18 portrait $59 unframed or $119 framed (black, white or red oak). Buddy, a chestnut dachshund, hosts; the customer's dog has its own name. "Free US shipping on every order." is the one shipping line. The bundle saving (15% off two gifts, 20% off three, automatic, gifts only) and the $29 Artist's touch add-on are live. The choose screen offers one Christmas reminder by email.

## Boundaries for every part

Use only the authorized browser session; do not take over the desktop or open a system file picker. Allowed: navigation, screenshots, ordinary form input with synthetic names, option and style selection, reload, Back and Forward, and reversible changes to an isolated QA cart you created. Preserve any existing customer cart and accepted artwork.

Not authorized by Parts A or B: photo upload, any image or text AI generation or regeneration, typed answers to Buddy (they call the AI; use chips), order submission, payment, supplier confirmation or fulfillment, theme, product, discount, workflow or configuration changes, publication, deletion, or messages to vendors. Do not click Create artwork, Paint it, Generate, Retry, Pay now, Place order, Confirm order or anything equivalent. If a step would spend, stop and record it as not run. Keep customer data, order numbers, admin URLs, store handles, theme ids, workflow addresses and campaign ids out of the public report; neutral filenames for private evidence.

## Part A: the preview theme (before publishing)

The release owner supplies the preview link of the unpublished copy and confirms it carries the branch's head commit. Test at about 390×844 and 1280×900, with a clean session.

Run `cd tools/preview && node preview-acceptance.mjs --theme <id>` first; it covers items 1 to 7 and the empty cart. Then:

1. **One Heartside.** Every page (home, three products, cart, cart drawer, 404 at a made-up path, a retired link such as `/products/<any core handle>?view=gift`) shows the 32 px night strip saying "Free US shipping on every order.", the cream header with the cart and account, Heartside's footer (Buddy, the policies, Contact, Answers), and no Helio menu, search, grey cart or "Powered by Shopify". The retired `?view=` link lands on the same page without `view` and keeps any `utm_` parameters. The 404 is Buddy's. The favicon is the pink watercolor heart with a white paw. Record whether Shopify Inbox's chat bubble still appears beside Buddy and whether it covers a primary button on a phone; it is an app setting, so report it for Krish rather than treating it as a theme defect.
2. **Back and Forward.** Walk the chat with chips only: Start, a synthetic dog name, a person, the home question and its follow-up, spot, together, meaning, "Show me". After each step the address shows `?step=...`. Use the browser's Back at every step: it lands on the previous step with the chosen chip pressed and nothing erased; Forward returns. Reload on three different steps: the same step paints, never the first screen first. The in-app Back behaves the same. The logo shows the first screen with "Welcome back" and "Pick up where you left off". Nothing jumps, zooms or locks the page.
3. **No paid call on navigation.** With the browser's network panel open, confirm that Back, Forward, reload, tabs and "Show me" a second time send nothing to the note service. Only the first "Show me" (and an explicit "Update note") may.
4. **The real range.** First screen: three real product photos labelled Example with Shopify prices (Portrait "From $59", Mug $45, Blanket $129), the three story beats, and "Try the slider", which swaps one example note between three tones. The reveal shows the product photo, a "Your photo" circle, the one line that prints with "Love, <dog>", and "What I'll paint" from the chips. Choose takes several gifts and says "Give two, save 15%. Give three, save 20%."; the reminder offer sits below it. **(person)** Judge whether the reveal sells the slider and whether Buddy reads as one character from first screen to cart.
5. **Product pages as the last step.** After the chat, each product page opens with Buddy's "Last step. Let's make <dog>'s <gift>." and a card of what carried over, each with a Change link; follow one and confirm "Back to your <gift>" returns. A direct visit in a fresh session shows Buddy's offer instead and no stranger's names. The portrait says "Unframed $59 · Framed $119" and its option reads "Framed or unframed". Under the price: "Free US shipping on every order."
6. **Gallery.** Click every thumbnail on all three pages, phone and desktop: the main picture never goes blank, the box never changes height, and the blanket never shows the blank grey reference. "Your design" returns to the live preview.
7. **Teeinblue still matches.** Read-only DOM check on each product page: a file input exists under `.tee-field--photo` or with an id starting `tee-photo`. The on-device photo check and the location-metadata stripping both rely on it. If neither exists, report it as blocking.
8. **Photo check (owner-assisted, optional).** Only if Krish chooses to, he picks a deliberately unusable photo (a tiny screenshot, or a very dark or blurred one) on a product page. Expected: a plain reason ("This photo is too blurry for me to see your dog clearly...") and no request to Teeinblue in the network panel. Never pick a usable photo in this part.
9. **Cart.** With an existing accepted-artwork QA session if the owner supplies one: the line shows the real design, "Format: Framed" or "Unframed" for a portrait, "Not quite right? Make another version." once, and the Artist's touch offer at $29 once per gift. Quantity 1→2→1 reads back from the cart each time. The empty cart shows Buddy and "Nothing in here yet. I checked twice." with "Start with your dog".
10. **Copy.** No exclamation marks, no em dashes, no retired names (Morning Mug, Couch Blanket, Framed Print, Tree Ornament, Annual Review, Body Double, Uniform) or prices ($29, $89, $24, $39) anywhere a buyer can reach, and no "calculated at checkout".

Conclude Part A with **ready for Krish to publish**, **hold for the listed defects**, or **insufficient evidence at the named boundary**.

## Part B: production (after Krish publishes)

1. **Production is the surface.** Open https://heartside.io/, the three product pages (`/products/your-dogs-illustrated-mug`, `/products/your-dogs-personality-blanket`, `/products/your-dogs-portrait`) and `/cart` with no preview parameter, at both sizes, and record the final URL, time and whether a password wall appears.
2. **Repeat Part A, items 1 to 7 and 10, on production.** Report any difference from the preview.
3. **Prices and shipping.** Every variant's price equals Shopify's. In hosted checkout, as far as the shipping line only and never submitting, using only an approved QA recipient supplied privately (or the existing quote, stated as such): record item subtotal, shipping charge, shipping discount, tax and total separately. Check the free-shipping discount's coverage against the 50 states, DC and Puerto Rico; report regions you could not verify.
4. **Personalization state.** Synthetic names only, chips only. "Me" changes the label to "Your first name" and survives Back, Forward and reload. Saved names, the printed line and the signature carry to all three products, escaped correctly (no `&#39;`). The no-photo state blocks purchase with useful wording; product cards, search, quick-add and accelerated checkout offer no bypass.
5. **Cart and checkout with retained artwork only.** As in the release review: the actual accepted design is the cart and checkout image; quantity 1→2→1 reads back (blanket $129→$258→$129, with the bundle's 15% applied at quantity 2); removal only of your own QA line; a mixed cart only if the retained session already holds two accepted designs. In hosted checkout, as far as the shipping line only: the bundle saving and free shipping appear together.
6. **Backend, read-only.** Shopify Payments live with test mode off; the three pre-existing $49 market prices unchanged; Teeinblue and Printful keep orders as drafts with manual review and automatic confirmation off; the typed and compose workflows are the published versions; no checkout-image diagnostic surface. Never click a confirmation or fulfillment control.

Conclude Part B with **safe for the owner to begin their real sample checkout**, **hold for listed defects**, or **insufficient evidence at the named boundary**, and state separately that physical print quality and a real paid fulfillment still wait for Krish's own sample.

## Part C: operator tasks (only on Krish's word, in his session)

Each runs only after Krish says yes to that task in the session that does it, with the cap stated, and ends with a readback.

1. **Teeinblue prompts.** Apply `tools/print-art/teeinblue/PROMPT-SPEC-2026-10-27.md` to the mug, portrait and blanket campaigns, including the hidden Energy text field (default `none`); read each prompt back and compare its SHA-256 with the spec. The prompts are about 9,100 characters; report any length limit.
2. **Toy reference test (optional).** Switch on the campaign reference image for one test only, if Krish wants to try a favorite-toy reference; switch it off again afterwards.
3. **Example batch.** Run `docs/evidence/2026-10-27-example-batch-spec.md`: three Drive dogs × Sentimental and Hilarious × three products, 18 generations, cap 20, about $2.50; results to Drive `02_Imagery/Examples-2026-10-27`, every image labelled Example, reviewed by a person before use.
4. **Christmas cut-offs.** When Printful publishes its 2026 US holiday cut-offs, put the earliest one that covers all three products into the memo strip's "Last order date for Christmas" on the theme Krish names, and read the strip back.

Report each task as done with readback, not run, or blocked, with the reason.
