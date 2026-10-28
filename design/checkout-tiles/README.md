# Checkout tiles (28 October 2026)

Shopify on the Basic plan draws a gift's nested checkout line with its variant's own catalog picture. On 27 October that picture was set to the blank supplier base, so that no example dog would stand in for the buyer's own dog, and since then buyers have seen a blank white thumbnail under their design. The Artist's touch add-on showed the heart favicon as a stand-in.

These tiles replace both. Each shows the gift's shape and Buddy's heart where the painting goes. They carry no example dog and make no claim beyond the gift itself.

| File | Goes on | Alt text, exactly |
| --- | --- | --- |
| `checkout-tile-mug.png` | Your Dog's Illustrated Mug | Your mug, painted from your dog. Heartside checkout tile. |
| `checkout-tile-portrait.png` | Your Dog's Portrait | Your portrait, painted from your dog. Heartside checkout tile. |
| `checkout-tile-blanket.png` | Your Dog's Personality Blanket | Your blanket, painted from your dog. Heartside checkout tile. |
| `artists-touch.png` | Artist's touch (the add-on's first picture) | Our artist's touch: a person adds the details you send. |

- **"checkout tile" in the alt text keeps a tile off the product page.** `snippets/hs-product-gallery.liquid`, the variant picture map in `sections/hs2-product.liquid`, Buddy's gift fan in `sections/hs3-chat.liquid` and `hs2.js` all hide any photo whose alt text says so.
- **Only blank variants change.** A gift's tile is attached only to the variants that `tools/preview/handle-check.mjs` reports as showing the blank base, and the product's first photo does not change.
- **The mug's color variants keep their own photos.** The product page swaps between them when the color changes.
- **The add-on's tile is not hidden.** It is that product's real picture.

Rebuild with `cd tools/preview && node ../build_checkout_tiles.mjs`. It renders the tiles in Chromium with the theme's own Fraunces and Courier Prime and Buddy's heart from `design/brand-v4/heart-paw-source.png`.
