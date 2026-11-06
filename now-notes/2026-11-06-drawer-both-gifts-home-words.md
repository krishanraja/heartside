# 6 Nov: the cart drawer offers both gifts and can always come back; the home page's words and the Juno scene

Status: done in the repository; live once pushed to the live theme.

Changed:
- Cart drawer (`shopify/assets/hs-cart-more.js`, `.css`). Both gifts not in the cart sit side by side, each with its own Add to cart. The deal is the headline, with no eyebrow above it. The picture takes the height the screen leaves, so both buttons and the drawer's Check out fit one screen from 320x568 up. A pink tab on the left edge stays there whenever the drawer is closed and brings it back. A gift still goes in the cart only once Teeinblue has painted it: Add to cart takes the buyer to that painting, from the same photo with nothing asked, then back to the cart.
- Home page. The strip's deal line leads with "Fast, free US shipping". The button reads "Design yours in minutes". Under each dog's name the line is now "Their true self, made the perfect gift" (from Krish's line, shortened to one line on a phone), in place of "Mug · Blanket · Portrait".
- The Juno (German shepherd) carousel set had the real mug pasted twice. It is rebuilt from the same clean plate with one mug, with no new generation. `hero-sets.py --check` now fails any set with more than one mug.

Next: Krish to see the drawer and the home page on his phone after the push.

North Star check (2026-11-06): holds. The cart drawer is the second-gift path, and the home page is the first screen of every sale.
