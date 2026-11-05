# Claude CoWork: the Christmas date in the shipping policy, and the blanket's checkout picture

Status: ASSIGNMENT, not a result. Written 5 November 2026 for Krish to run in CoWork on his own computer, logged in to Shopify admin. Work only from `main` of `krishanraja/heartside`. Two small changes in Shopify admin, each read back. Nothing else.

Krish approved both changes up front by starting this run, so do not stop to ask him. If anything below does not match what you find, stop that part, change nothing, and say what you found.

## Why this exists, in Krish's terms

The photo-first journey went live on 5 November. Eleven test buyers found two things the theme cannot fix, because they live in Shopify admin:

1. **The shipping policy says there is no Christmas date yet.** The site says "Order by December 4 for Christmas delivery to a US address." The policy still says "We will publish a last order date for Christmas delivery on the site once our print partner confirms it", and calls the day "25 December" on a US store. A buyer who reads the policy first sees the two disagree. The connector Claude Code uses cannot write policies, so this is done in admin.
2. **Checkout shows another dog under a blanket order.** At checkout, each gift is one line with the buyer's own painting. Opened up, it has a smaller line underneath for the product itself. Shopify always draws that smaller line with the product's own catalog photo. For the blanket, that photo is our example blanket covered in black Labradors, so a buyer with a poodle sees someone else's dog under their order. The order still prints their own painting; only the picture is wrong. On 28 October we made dog-free "checkout tiles" for exactly this line (`design/checkout-tiles/`), but they went only on variants that showed a blank picture. The blanket's one variant shows the example dogs, so it never got its tile.

The mug and the portrait have the same smaller line (an example mug with Maple, an example frame with Bear). They are left as they are in this run, because on those two gifts the same variant photo is what the product page shows when a buyer picks a color or a frame. Changing it would stop that switch. That needs a theme change first.

## Part 1: the shipping policy

1. In Shopify admin, open Settings, then Policies, then Shipping policy.
2. Find the paragraph that starts with **Christmas.** It reads: "We will publish a last order date for Christmas delivery on the site once our print partner confirms it. Orders placed after that date may arrive after 25 December."
3. Replace that whole paragraph, keeping **Christmas.** in bold, with exactly:

   > **Christmas.** Order by December 4 for Christmas delivery to a US address. That is the last day on which the times above still deliver before Christmas Eve. Orders placed after December 4 may arrive after December 25.

4. Change nothing else in the policy. Save.
5. **Read back:** open `https://heartside.io/policies/shipping-policy` in a private window. The Christmas paragraph reads exactly as above, the paragraph before it still gives printing as 2 to 5 business days and delivery as 3 to 7, and the old "once our print partner confirms it" line is gone.

## Part 2: the blanket's checkout tile

The tile is `design/checkout-tiles/checkout-tile-blanket.png` in the repository. Its alt text must be exactly:

`Your blanket, painted from your dog. Heartside checkout tile.`

The live theme hides any photo whose alt text says "checkout tile" from the product page, so the tile shows only at checkout.

1. In Shopify admin, open Products, then **Your Dog's Personality Blanket**.
2. Before changing anything, note:
   - the product's first photo (its alt text starts "Example: a sherpa blanket printed with a scatter of small black Labradors, in a bright living room.");
   - the photo the one variant (Tan, 50″×60″) uses (its alt text starts "Example: a sherpa blanket printed with a scatter of small black Labradors, on a plain studio backdrop.").
3. Upload `checkout-tile-blanket.png` to the product's media, and set its alt text exactly as above.
4. Set the tile as the picture for the one variant (Tan, 50″×60″).
5. Leave the product's first photo where it is. Do not delete the studio photo; it stays in the product's media.
6. Save.
7. **Read back:**
   - In admin, the variant's picture is the tile, and the product's first photo is unchanged.
   - Open `https://heartside.io/products/your-dogs-personality-blanket.js` in a private window. The variant's `featured_image` alt text ends "Heartside checkout tile." and the product's first `media` item is still the living-room photo.
   - Open `https://heartside.io/products/your-dogs-personality-blanket` in a private window, on a phone-sized window and on desktop. The tile appears nowhere on the page. The first photo is the same as before.
   - In a terminal, from the repository: `cd tools/preview && node handle-check.mjs --warn-media`. Every `ok` line for the blanket still passes, including "no variant shows the blank base picture".

If any read-back fails, set the variant's picture back to the studio photo you noted in step 2, save, and report it.

## Never, in this run

- Change any other policy, product, photo, price, variant or setting, or the mug's or the portrait's pictures.
- Delete any photo.
- Place an order, use a real card, or touch a real customer's order.
- Send a message to a customer or a vendor.

## The report

Write it as plain sentences, and bring it back to the Claude Code session:
- **Part 1:** done or not, and the Christmas paragraph exactly as heartside.io shows it.
- **Part 2:** done or not, the variant's picture before and after (by alt text), what `products/your-dogs-personality-blanket.js` shows, and the `handle-check.mjs` lines for the blanket.
- **Anything that did not match this prompt**, and what you did instead.
