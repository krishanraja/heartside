# The painting card, the review, toy and collar, and a steady cart, 28 October 2026

Krish tested a real generation and cart on 28 October. In his words: "the loading experience is terrible, it looks broken, but its actually just generating the image. the customer should feel magic, not like its broken. And then the 'I have checked' tickbox appears above the image which I barely realized was there, another poor UX choice, not intuitive or clear at all. I cant seem to upload any images of accessories etc either. Then when I get to the cart, the thumbnail just glitches epileptically".

The CoWork production run (Part B) reported three defects the same night, before this work went live: a design at quantity 2 checked out as 4, the phone menu drawer showed product cards with the framed price and a blank picture, and the cart offers were squeezed into the picture column.

## What went live

[krishanraja/heartside#59](https://github.com/krishanraja/heartside/pull/59) was merged as `8aa421c` and pushed to the live theme through the guarded workflow. The same changes had first passed on the unpublished "Heartside redesign preview" copy.

| Problem | Cause | Change |
| --- | --- | --- |
| Cart thumbnail flicker | Three owners took turns at one picture: the server drew the product photo, `hs2.js` swapped in the design, and Teeinblue swapped that for its spinner widget. This happened again after every cart redraw. The bundle line also re-read `/cart.js` on every DOM change, and each read re-ran Teeinblue's cart pass. | `cart-products.liquid` draws the accepted design itself, inside Teeinblue's own leave-alone container. The cart is read once per change, and the observer only wakes for changes inside the cart. |
| Offers in the picture column | They were placed in the cell of the first product link, which is the picture. | Placed in the details cell. |
| The wait looked broken | Teeinblue's small loader, and on desktop an empty cream blanket in the gallery. | A painting card shows the buyer's photo as a sketch, with lines drawn from their own style and tone and a bar that eases toward the end without claiming it. The gallery carries the same wash. The design is revealed when it arrives. The blanket opens on its example until there is art. |
| Review above the picture | The tickbox sat in the snippet above Teeinblue's block. | "Yes, this is Pip." is a large confirmation directly under the finished design. A blocked Add to cart scrolls to it. |
| No toy or collar photos | Teeinblue's painter reads one photo, the dog's. | The product page takes their words, which reach the painting as the chat's toy and accessory facts. Photos go to our artist on an Artist's touch line added right after the gift. |

## Readback on production

- `preview-acceptance.mjs` (Part A, automated) on heartside.io: all clear at 390 × 844 and 1280 × 900.
- `live-gate.mjs`: all clear at desktop, phone and Instagram sizes. The gate first failed on the new "$29" beside "Artist's touch" (the retired-price rule). The acceptance prompt allows $29 for the add-on, so the rule now ignores the add-on's own price.
- Cart thumbnail, measured for 12 seconds per view on an isolated QA cart (synthetic design, cleared afterwards, no checkout), on /cart and in the drawer, at phone and desktop sizes. With a prepared design: 0 node swaps, 0 picture changes, 0 blank frames. With a Teeinblue image that 404s for 9 seconds: no spinner takeover; the picture loads on the second retry. Cart reads fell from 6 to 9 per 12 seconds to 2 to 3.
- Product page, with Teeinblue's upload overlay set the way an upload sets it: the painting card shows and scrolls into view, the gallery paints, the repeated "Your artwork" card is gone, and the toy and collar box shows the Artist's touch at the product's $29. No script errors.

## The quantity doubling (Part B defect 1)

The CoWork run's readings: at quantity 2 the cart was right (`/cart.js`: one parent line, $258). Opening hosted checkout showed "4 × Your Dog's Personality Blanket, $516.00", and the cart then read $516 with 4 in its box. Shopify's checkout merge, the cart transform that builds the bundle carrying the checkout picture, doubles any design line above one unit and writes that back to the cart. The merge is configured in a Shopify app, not in this repository.

The theme's fail-safe, on the follow-up branch: a personalised design is one unit everywhere.

- The gift page adds one whatever Teeinblue's quantity box says, and the box is hidden.
- In the cart, a design at one has no quantity control and reads "One per design".
- A line already above one can come down but never go up; the cart says "Each design is one gift, so it stays at one."

Two different designs are two lines at one each, which the merge handles correctly (Part B's quantity-1 checkout read back $129).

Not proved here: why the merge doubles, and whether the same design added twice would merge into one line of two. Shopify started rate-limiting this container's QA cart reads, so the direct cart-transform readback waits for the next run.

## Not proved

- A real generation through the new painting card, and a real Artist's touch from the product page with photos (each needs a real upload).
- The merge's own quantity rule (above), and the tax line: no tax appeared at a New York address in Part B. The cart now says "Any tax is shown at checkout", which is true either way.
