# Heartside order painting

This is an extension-only custom app for the Heartside store. It has no server, no access scopes and no data of its own.

On the order status page in customer accounts, Shopify draws each line's picture from the product variant. That picture is an example dog, kept for the ads (Ruling, Krish, 2026-11-05), and Shopify offers no setting to change it per order. This app adds "Your painting" under each painted line, with the buyer's own painting.

- **Target:** `customer-account.order-status.cart-line-item.render-after`. It is static, so it shows once the app is installed and needs no placing in the editor.
- **Picture:** the line's `_hs_checkout_image`, then `_customization_image`. A bundle line uses its components' attributes. Only https images on cdn.shopify.com or cdn.teeinblue.com are shown.
- **Logic:** `extensions/order-painting/src/painting.js`, tested by `tools/preview/order-painting.test.mjs`.
- **Deploy:** `docs/review/COWORK-ORDER-PAINTING.md`.

It is not yet proven that Shopify passes attributes starting with `_` to this extension. If the painting does not appear on #1013 after install, that is the first suspect. The fallback is reading the order's line attributes through the Customer Account API, which needs the `customer_read_orders` scope and protected customer data access.
