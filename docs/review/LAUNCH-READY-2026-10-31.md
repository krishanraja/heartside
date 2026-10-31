# Launch ready: artwork-only gifts, the dog's note in every box, a free digital card and an optional printed card

Status: PLAN, agreed with Krish on 31 October 2026. The Claude Code session builds it; CoWork does the steps that need Printful, Teeinblue, n8n or Shopify admin. Krish then orders a mug and a blanket as a real customer, with a real dog's photo, as a gift for someone he knows. Nothing is proved until that order arrives.

## What Krish ruled (31 October)

- **Artwork only.** The mug and the portrait print the painting only. The dog's note leaves the product.
- **The note is in every box.** It prints on Printful's packing slip, inside each gift's own parcel, written for that order.
- **A free digital card.** Every gift comes with one: the painting on the front and the note inside, on a page the buyer can forward, print or show on the day.
- **An optional printed card, $12.** It is a 4×6 folded card made in the US, with the painting on the front and the note inside. The page says plainly that it ships in its own envelope.
- **Sets arrive as a planned sequence.** A set is "three gifts, each in its own box", said before checkout.
- **Orders confirm themselves.** Once the note is on an order, the automation confirms it in Printful, and Printful charges for it. Krish can switch this back to manual at any time.
- **Backup facilities off.** Printful's backup facilities are switched off, so the slip message is never dropped.

## How an order flows after launch

1. The buyer makes the gift in the journey. The note they approve is saved on the line as a property (`Note from <dog>`), as it is today.
2. Teeinblue paints, then sends the order to Printful as a draft, as today.
3. **New:** every few minutes, an n8n workflow (private, never in the public repository) looks for Printful drafts. For each one it:
   - reads the Shopify order;
   - writes the note into the Printful order's gift message;
   - if the buyer bought the printed card, adds a 4×6 greeting card item, with the gift's painting on the front and the note set inside;
   - confirms the order.
   Anything it can't do safely (no note, no painting yet, an unknown product) it leaves as a draft, and it tells hello@krishraja.com.
4. The order confirmation email and the order status page link to the free digital card, a theme page built from the order's painting and note.

## Who does what

| Step | Owner |
|---|---|
| Painter and theme: words off on the mug and portrait, copy without "a note on the gift", the printed-card add-on, the digital card page, set copy, the homepage real-mug pictures | Claude Code session |
| The n8n workflow: draft order, then note, then optional card, then confirm (needs two credentials) | Claude Code session builds it; CoWork adds the credentials |
| Printful: backup facilities off; a private API token for the workflow | CoWork |
| Teeinblue: take the note layers off the mug and portrait campaigns, every sync box unticked, at release | CoWork |
| Shopify: the $12 card product (not synced to Printful) | Claude Code session, through the Shopify connector |
| Shopify: the order confirmation email links to the digital card | CoWork |
| Release: draft theme, gates, recordings, publish on Krish's word | Both |
| The live order | Krish, as a customer |

## Open items to settle while building

- **Printful API details:** the gift message's character limit, and adding a greeting card item to an order that Teeinblue created. These get settled against the live API with a draft order, which is never confirmed during the test.
- **The printed card's inside.** The note is set in the store's own type on a plain inside panel, rendered by the workflow and stored in Shopify Files. The back carries Printful's fixed QR code.
- **Christmas cut-off.** Printful's 2026 dates aren't published yet. The printed card takes the longest, so its add-on gets its own order-by line.
