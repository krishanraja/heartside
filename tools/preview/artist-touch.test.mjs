// Artist's touch (27 Oct): offered on a personalised cart line only once the add-on product exists,
// never twice for one design; it needs the buyer's notes and goes in as its own line linked by
// _hs_addon_for, with tagged photos as file properties.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const A = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
function box() {
  const files = [{name: 'toy.jpg'}], notes = {value: ''}, status = {textContent: ''}, button = {disabled: false, handlers: {}, addEventListener(n, fn) { this.click = fn.bind(this); }};
  const photos = [0, 1, 2].map(i => ({querySelector: s => s === '[data-hs2-artist-file]' ? {files: i === 0 ? files : []} : {value: 'Favorite toy'}}));
  return {className: '', attrs: {}, innerHTML: '', setAttribute(k, v) { this.attrs[k] = v; }, notes, status, button,
    querySelector(s) { return s === '[data-hs2-artist-add]' ? button : s === '[data-hs2-artist-notes]' ? notes : s === '[data-hs2-artist-status]' ? status : null; },
    querySelectorAll: () => photos};
}
function row(props, personal) {
  const host = {children: [], appendChild(n) { this.children.push(n); }};
  return {host, getAttribute: k => k === 'data-hs2-cart-line' ? JSON.stringify({quantity: 1, properties: props, item_components: personal ? [{properties: {_customization_id: A}}] : []}) : k === 'data-hs2-quantity-key' ? (personal ? 'k' : '') : null,
    querySelector: s => s.startsWith('a[') ? {closest: () => host} : null};
}
for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: the artist's touch is offered once per design and sends notes and tagged photos`, async () => {
  const posts = [], made = [];
  let memo = null;
  const ctx = {location: {pathname: '/cart', reload() {}}, FormData, track() {}, shopRoot: () => '/', fetch: (url, o) => { posts.push([url, o.body]); return Promise.resolve({ok: true, json: async () => ({})}); },
    document: {querySelector: s => s === '[data-hs-artist-variant]' ? memo : null, createElement: () => { const b = box(); made.push(b); return b; }}};
  vm.runInNewContext(['cartLineFacts', 'artistTouch'].map(section).map(c => minified ? transformSync(c, {minify: true}).code : c).join('\n').replace('var ADDON_TAGS', 'var ADDON_TAGS'), Object.assign(ctx, {ADDON_TAGS: ['Favorite toy']}));
  const gift = row({}, true);
  ctx.artistTouch([gift]); assert.equal(gift.host.children.length, 0, 'hidden until the add-on product exists');
  memo = {getAttribute: k => k === 'data-hs-artist-variant' ? '777' : '$29'};
  ctx.artistTouch([gift, row({}, false)]);
  assert.equal(gift.host.children.length, 1); assert.match(made[0].innerHTML, /Artist's touch, \$29\. Adds 5 days\./); assert.doesNotMatch(made[0].innerHTML, /Krish/);
  made[0].button.click(); assert.equal(posts.length, 0, 'notes come first'); assert.match(made[0].status.textContent, /what to change/);
  made[0].notes.value = 'Make the ears floppier.'; made[0].button.click(); await new Promise(r => setImmediate(r));
  const [url, body] = posts[0];
  assert.equal(url, '/cart/add.js'); assert.equal(body.get('id'), '777'); assert.equal(body.get('properties[_hs_addon_for]'), A);
  assert.equal(body.get('properties[What to change]'), 'Make the ears floppier.'); assert.ok(body.has('properties[Photo 1: Favorite toy]'));
  const withAddon = row({}, true), addon = row({_hs_addon_for: A}, false); ctx.artistTouch([withAddon, addon]);
  assert.equal(withAddon.host.children.length, 0, 'never twice for one design');
  assert.equal(addon.host.children.length, 0, 'an add-on beside its gift says nothing');
  const orphan = row({_hs_addon_for: A}, false); ctx.artistTouch([orphan]);
  assert.equal(orphan.host.children.length, 1, "an add-on whose gift left the cart says so");
  assert.match(made.at(-1).textContent, /no longer in your cart/);
});
