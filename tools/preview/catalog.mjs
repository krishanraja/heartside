// The store's catalog as the guards expect it, in one place: the three gifts' clean addresses,
// titles and prices, the Artist's touch add-on, and the old addresses that must redirect to the
// clean ones. live-gate.mjs, preview-acceptance.mjs and handle-check.mjs read it; nothing here
// touches the network. Change it in the same reviewed diff as a change in Shopify admin.
//
// Why it exists (28 Oct): a Teeinblue campaign Update renamed two product handles to the campaign
// title, even with every sync flag off, and the gates still printed "ok", because Playwright
// follows a 301 and the draft page had the same title and price. Every guard now checks the
// address itself as well as what the page shows.

// The three gifts, as products/<handle>.js served them on 27 Oct 2026. `price` is what the
// product page shows first (the portrait opens on its first variant, Framed). min and max are in
// cents, as Shopify's product JSON gives them. `marker` is the native template's mark on #buy
// (product.mug-native.json, product.portrait-native.json, product.blanket-native.json): a page
// that lost its template suffix, or a product moved to another template, loses it.
export const CORE = [
  {
    key: 'mug', chat: 'mug', handle: 'your-dogs-illustrated-mug', path: '/products/your-dogs-illustrated-mug',
    title: "Your Dog's Illustrated Mug", price: '$45', min: 4500, max: 4500, variants: 5,
    marker: { 'data-hs2-artwork-kind': 'mug', 'data-hs2-purchase-enabled': 'true' },
  },
  {
    key: 'portrait', chat: 'print', handle: 'your-dogs-portrait', path: '/products/your-dogs-portrait',
    title: "Your Dog's Portrait", price: '$119', min: 5900, max: 11900, variants: 4,
    marker: { 'data-hs2-artwork-kind': 'print', 'data-hs2-purchase-enabled': 'true' },
  },
  {
    key: 'blanket', chat: 'blanket', handle: 'your-dogs-personality-blanket', path: '/products/your-dogs-personality-blanket',
    title: "Your Dog's Personality Blanket", price: '$129', min: 12900, max: 12900, variants: 1,
    marker: { 'data-hs2-blanket-purchase': '' },
  },
];

// The Artist's touch add-on (docs/evidence/2026-10-27-go-live.md step 8). Its price is read from
// Shopify everywhere it is shown; this is only what the guard expects to find.
export const ADDON = { key: 'artists-touch', handle: 'artists-touch', path: '/products/artists-touch', min: 2900 };

// Old addresses and where each must land, with a 301. The two draft handles are what the
// 28 Oct campaign Update renamed the blanket and the portrait to; Shopify keeps redirects from
// them to the clean handles CoWork restored. The legacy handles (the-morning-mug and the rest)
// are left out until CoWork reads Shopify's URL redirect list back, so that no target here is a
// guess.
export const REDIRECTS = {
  '/products/heartside-personality-blanket-draft-2026-10-23': '/products/your-dogs-personality-blanket',
  '/products/heartside-city-screenprint-draft-2026-10-23': '/products/your-dogs-portrait',
};

// Pictures that must never stand for a gift or the add-on. Checkout draws a gift's nested line
// with its variant's own catalog image, and on 27 Oct that image was the blank supplier base
// (docs/evidence/2026-10-27-blanket-checkout.md), so a buyer saw a blank white thumbnail.
//   BLANK_MEDIA_IDS   the blank references the theme already hides (hs-product-gallery.liquid)
//   BLANK_ALT         the alt text the theme already treats as a blank reference (hs2-product.liquid)
//   BLANK_FILES       file names, filled in by CoWork from Shopify admin when known
//   STANDIN_*         the pink heart CoWork attached to the Artist's touch on 28 Oct as a stand-in,
//                     as products/artists-touch.js served it that day: its media id, its alt text
//                     and its file, artists-touch.png. heartside-favicon-heart is the favicon's own
//                     file, should it be attached under that name. Our tile is artists-touch-tile.png.
// A file name matches only as a whole: Shopify's ?v= version and the suffixes it adds (a size such
// as _400x or _400x400@2x, _crop_center, or the _<uuid> of a second upload under the same name) are
// set aside, but artists-touch-tile.png is another file from artists-touch.png.
export const BLANK_MEDIA_IDS = ['71850515169662', '71856697049470'];
export const BLANK_ALT = /\bblank |shown in your cart/i;
export const BLANK_FILES = [];
export const STANDIN_MEDIA_IDS = ['71873863057790'];
export const STANDIN_ALT = /^artist['’]s touch by heartside$/i;
export const STANDIN_FILES = ['artists-touch.png', 'heartside-favicon-heart.png'];

// The CSS selector for a CORE item's template mark, e.g. #buy[data-hs2-artwork-kind="mug"]
export const markerSelector = (item) => '#buy' + Object.entries(item.marker).map(([k, v]) => (v === '' ? `[${k}]` : `[${k}="${v}"]`)).join('');

// Did a page land where it was asked for? '' when it did, else one line for the report, naming
// paths only (never a host). requested is the address asked for (a path or a full URL); finalUrl
// is where the browser ended. A redirect that keeps the host and the path (a query or cookie hop,
// as a theme preview can make) is not a move; one that changes either is. redirected is kept in
// the signature so callers can pass Playwright's redirectedFrom() without deciding for it.
export function landed(requested, finalUrl, redirected = false) {
  const parse = (u) => { try { return new URL(u, 'http://same.invalid'); } catch { return null; } };
  const a = parse(requested), b = parse(finalUrl);
  const trim = (p) => p.replace(/\/+$/, '') || '/';
  const from = a ? trim(a.pathname) : String(requested);
  if (!b) return `moved: ${from} ended on an address that could not be read`;
  const to = trim(b.pathname);
  if (to !== from) return `moved: ${from} now lands on ${to}${redirected ? ' (a redirect)' : ''}`;
  const absolute = (u) => /^[a-z]+:\/\//i.test(String(u));
  if (absolute(requested) && absolute(finalUrl) && a.host !== b.host) return `moved: ${from} now lands on another host`;
  return '';
}
