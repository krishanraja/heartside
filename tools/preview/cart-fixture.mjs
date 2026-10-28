// The cart for tests: snippets/cart-products.liquid rendered whole by liquidjs, with stand-ins for
// the Helio snippets, filters and tags it calls (the same stubs render.mjs uses), and cart lines
// shaped the way Shopify hands them to Liquid. Used by the cart-*.test.mjs files; not a test itself.
import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Liquid} from 'liquidjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const repo = path.resolve(here, '..', '..');
const snippets = path.join(repo, 'shopify', 'snippets');
export const asset = (name) => readFileSync(path.join(repo, 'shopify', 'assets', name), 'utf8');

// Helio's quantity selector, as its markup reaches the cart (names, refs and the disabled state)
const STUBS = {
  'quantity-selector': '<cart-quantity-selector-component class="quantity-selector {{ class }}" ref="quantitySelectors[]" data-variant-id="{{ variant.id }}"><button type="button" name="minus" aria-label="Decrease quantity"{% unless can_update_quantity %} disabled{% endunless %}>-</button><input type="number" name="updates[]" value="{{ in_cart_quantity }}" min="0" aria-label="Quantity"{% unless can_update_quantity %} disabled{% endunless %}><button type="button" name="plus" aria-label="Increase quantity"{% unless can_update_quantity %} disabled{% endunless %}>+</button></cart-quantity-selector-component>',
};
const partial = (file) => STUBS[path.basename(file, '.liquid')] ?? '';
const fs = {
  exists: async () => true,
  existsSync: () => true,
  readFile: async (f) => (existsSync(f) ? readFileSync(f, 'utf8') : partial(f)),
  readFileSync: (f) => (existsSync(f) ? readFileSync(f, 'utf8') : partial(f)),
  resolve: (dir, file, ext) => path.resolve(dir, file + (path.extname(file) ? '' : ext)),
  contains: () => true,
  sep: path.sep,
  dirname: path.dirname,
};
const T = {
  'content.cart_total': 'Cart total', 'content.product_image': 'Product image', 'content.product_information': 'Product information',
  'content.quantity': 'Quantity', 'content.product_total': 'Product total', 'content.price_sale': 'Sale price',
  'content.price_regular': 'Regular price', 'content.price': 'Price', 'accessibility.remove_item': 'Remove {title}',
  'accessibility.remove': 'Remove', 'accessibility.nested_product': '{product_title} of {parent_title}',
};
const money = (cents) => '$' + (Number(cents) / 100).toFixed(2);
export function cartEngine(dir = snippets) {
  const engine = new Liquid({root: [dir], partials: [dir], extname: '.liquid', fs});
  const kw = (args) => Object.fromEntries(args.filter(Array.isArray));
  engine.registerFilter('t', (k, ...args) => { const o = kw(args); return (T[k] || k).replace(/{(\w+)}/g, (_, n) => o[n] ?? ''); });
  engine.registerFilter('money', money);
  engine.registerFilter('money_with_currency', (c) => money(c) + ' USD');
  engine.registerFilter('image_url', (img) => (typeof img === 'string' ? img : (img && img.src) || ''));
  engine.registerFilter('image_tag', (src, ...args) => { const o = kw(args); return '<img src="' + src + '" class="' + (o.class || '') + '" style="' + (o.style || '') + '" alt="" width="250" height="250">'; });
  engine.registerFilter('inline_asset_content', () => '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor"/></svg>');
  engine.registerFilter('asset_url', (n) => '/assets/' + n);
  engine.registerFilter('json', (v) => JSON.stringify(v ?? null));
  const css = [];
  const block = (keep) => ({
    parse(token, remain) {
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain).on('tag:end' + token.name, () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error(token.name + ' not closed'); });
      stream.start();
    },
    // {% doc %} is never rendered: its @example renders this very snippet
    * render(ctx) { if (keep) css.push(yield this.liquid.renderer.renderTemplates(this.tpls, ctx)); },
  });
  engine.registerTag('doc', block(false));
  engine.registerTag('stylesheet', block(true));
  return {engine, css};
}

// Renders the cart rows; `css` is the snippet's own {% stylesheet %}, which Shopify serves separately.
export async function renderCart(items, {context = '', image_ratio = 'portrait', dir} = {}) {
  const {engine, css} = cartEngine(dir);
  const cart = {'empty?': false, items, item_count: items.reduce((s, i) => s + i.quantity, 0), total_price: items.reduce((s, i) => s + i.final_line_price, 0)};
  const html = await engine.renderFile('cart-products', {cart, context, block: {settings: {image_ratio, gap: 24, dividers: false}, shopify_attributes: ''}, settings: {cart_thumbnail_border_radius: 0}, routes: {cart_url: '/cart', root_url: '/'}, shop: {}});
  return {html: html.replace(/<script\b[^>]*>\s*<\/script>/g, ''), css: css.join('\n')};
}

export const ID = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
export const ID2 = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
export const prepared = (id) => 'https://cdn.shopify.com/s/files/1/1111/2222/3333/files/heartside-checkout-' + id + '.jpg?v=1';
const base = (index, key, product, variant, price) => ({
  index, key, quantity: 1, variant_id: variant.id, url: '/products/' + product.handle + '?variant=' + variant.id, title: product.title + ' - ' + variant.title,
  product, variant, image: {src: '/mock/' + product.handle + '.jpg', aspect_ratio: 1},
  options_with_values: variant.options, properties: {}, item_components: [], parent_relationship: {parent: null},
  original_price: price, final_price: price, original_line_price: price, final_line_price: price,
  line_level_discount_allocations: [], instructions: {can_update_quantity: true, can_remove: true},
});
const MUG = {handle: 'your-dogs-illustrated-mug', title: "Your Dog's Illustrated Mug", has_only_default_variant: false};
const ADDON = {handle: 'artists-touch', title: "Artist's touch", has_only_default_variant: true};
const SHIRT = {handle: 'gift-card', title: 'Gift card', has_only_default_variant: true};
// a personalized gift as the checkout merge leaves it: one native component of the same variant
export function gift(index, id = ID, {props = {}, componentProps = {}} = {}) {
  const variant = {id: 101 + index, title: 'Dark Green / 11 oz', options: [{name: 'Color', value: 'Dark Green'}, {name: 'Size', value: '11 oz'}], compare_at_price: null};
  const line = base(index, '101:merged-' + index, MUG, variant, 4500);
  line.properties = props;
  line.item_components = [{key: '101:native-' + index, variant_id: variant.id, quantity: 1, title: MUG.title + ' - ' + variant.title,
    properties: {_customization_id: id, _hs_checkout_image: prepared(id), 'Dog name': 'Pickle', ...componentProps}, instructions: {can_update_quantity: true, can_remove: true}}];
  return line;
}
export function addon(index, forId = ID, props = {}) {
  const line = base(index, '777:addon-' + index, ADDON, {id: 777, title: 'Default Title', options: [{name: 'Title', value: 'Default Title'}], compare_at_price: null}, 2900);
  line.properties = {_hs_addon_for: forId, 'What to change': 'Make the ears floppier.', ...props};
  return line;
}
export function ordinary(index) {
  return base(index, '456:plain-' + index, SHIRT, {id: 456, title: 'Default Title', options: [], compare_at_price: null}, 2500);
}
export const rowKeys = (html) => [...html.matchAll(/<tr\s+id="CartItem-([^"]+)"/g)].map((m) => m[1]);
export const rowOf = (html, key) => { const start = html.indexOf('<tr\n                id="CartItem-' + key + '"'); return start < 0 ? '' : html.slice(start, html.indexOf('</tr>', start)); };

// Helio's design tokens the cart grid reads; its theme stylesheet is not in this repo.
export const HELIO_TOKENS = `:root{--gap-md:16px;--gap-xs:8px;--gap-2xs:4px;--gap-xl:24px;--margin-lg:24px;--margin-xs:8px;--margin-2xs:4px;--margin-3xs:2px;--margin-md:16px;--padding-2xs:2px;--padding-lg:16px;--padding-4xl:32px;--minimum-touch-target:44px;--font-size--sm:14px;--font-size--xs:12px;--font-size--md:16px;--font-size--lg:18px;--font-size--xl:22px;--line-height:1.4;--opacity-70:0.7;--opacity-10-25:0.15;--color-foreground-rgb:18 16 16;--color-foreground:#121010;--icon-size-xs:14px;--button-size-md:40px;--animation-speed:0.1s;--animation-easing:ease;--drawer-animation-speed:0.1s}
body{margin:0;font:15px/1.5 system-ui,sans-serif}cart-quantity-selector-component{display:inline-flex;align-items:center;border:1px solid #ccc}cart-quantity-selector-component button{background:none;border:0}cart-quantity-selector-component input{width:44px;border:0;text-align:center;background:none;font:inherit}.hidden{display:none!important}.visually-hidden{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.list-unstyled{list-style:none;padding:0;margin:0}`;
