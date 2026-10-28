// Their toy or collar on the product page (Krish, 28 Oct: "I cant seem to upload any images of
// accessories"). The words become the chat's own toy and accessory facts, so they reach the
// painting; photos go to our artist on an Artist's touch line added right after the gift, linked
// to its design, sent around the checkout-image preparation every gift add goes through.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
// arrays made inside the vm context have its prototypes; compare their contents
const plain = x => JSON.parse(JSON.stringify(x));
const ID = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const el = (attrs = {}) => Object.assign({hidden: true, value: '', textContent: '', handlers: {}, addEventListener(n, f) { this.handlers[n] = f; }, getAttribute(k) { return (this.attrs || {})[k] ?? null; }}, attrs);

function page({memo = true} = {}) {
  const toy = el({attrs: {'data-hs-extra': 'toy'}}), accessory = el({attrs: {'data-hs-extra': 'accessory'}});
  const notes = el(), status = el(), price = el();
  const file = (f) => el({files: f ? [f] : [], value: f ? 'C:\\fakepath\\x.jpg' : ''});
  const photos = [file({name: 'duck.jpg'}), file(null), file({name: 'collar.jpg'})].map((f, i) => ({file: f, tag: el({value: i === 2 ? 'Collar or accessory' : 'Favorite toy'}),
    querySelector(s) { return s === '[data-hs-extras-file]' ? this.file : s === '[data-hs-extras-tag]' ? this.tag : null; }}));
  const artist = el({open: true, querySelector: s => ({'[data-hs-extras-price]': price, '[data-hs-extras-notes]': notes, '[data-hs-extras-status]': status})[s] || null, querySelectorAll: () => photos});
  const box = el({querySelectorAll: () => [toy, accessory], querySelector: s => (s === '[data-hs-extras-artist]' ? artist : null)});
  const memoEl = memo ? el({attrs: {'data-hs-artist-variant': '777', 'data-hs-artist-price': '$29'}}) : null;
  const store = {'hs3-gift': JSON.stringify({dog: 'Pip', toy: 'A squeaky duck'})};
  const calls = [], posts = [], announced = [];
  const state = {hs3_art_profile: {version: 1, facts: [{source: 'home', text: 'Waits at the door.'}, {source: 'toy', text: 'A squeaky duck'}]}};
  const ctx = {state, FormData, URLSearchParams,
    window: {HSArtworkProfile: {}, sessionStorage: {getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }}},
    document: {querySelector: s => (s === '[data-hs-extras]' ? box : s === '[data-hs-artist-variant]' ? memoEl : s === '[data-hs-extras-artist]' ? artist : null)},
    nativeArtworkPurchase: () => true, artworkFacts: () => JSON.stringify(state.hs3_art_profile), save() { calls.push('save'); }, invalidateBlanketReview() { calls.push('invalidate'); },
    artworkChoicesChanged() { calls.push('choices'); }, journeyCard() { calls.push('journey'); }, updateBlanketPurchaseStatus() { calls.push('status'); }, track() {}, shopRoot: () => '/',
    announceAdd: items => announced.push(items), onCartAdd: f => { ctx.added = f; }};
  ctx.onCartAdd.fetch0 = function (url, o) { posts.push([url, o.body, this]); return Promise.resolve({ok: true, json: async () => ({id: 1, variant_id: 777})}); };
  ctx.window.fetch = () => { throw new Error('the wrapped fetch would send this through the checkout-image preparation'); };
  return {ctx, toy, accessory, notes, status, price, artist, box, store, calls, posts, announced, photos};
}
for (const minified of [false, true]) {
  const load = p => { const code = ['bindExtras', 'extrasAfterAdd'].map(section).join('\n'); vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, p.ctx); return p; };
  test(`${minified ? 'minified' : 'source'}: the words are the chat's toy and accessory facts, and changing them asks for a new painting`, () => {
    const p = load(page());
    p.ctx.bindExtras();
    assert.equal(p.box.hidden, false); assert.equal(p.toy.value, 'A squeaky duck', 'what they told Buddy is already there'); assert.equal(p.accessory.value, '');
    assert.equal(p.artist.hidden, false); assert.equal(p.price.textContent, '$29');
    p.accessory.value = '  A red   bandana '; p.accessory.handlers.change();
    assert.deepEqual(plain(p.ctx.state.hs3_art_profile.facts.map(f => f.source + ':' + f.text)), ['home:Waits at the door.', 'toy:A squeaky duck', 'accessory:A red bandana']);
    assert.equal(JSON.parse(p.store['hs3-gift']).accessory, 'A red bandana', 'the chat keeps the same words');
    assert.deepEqual(p.calls, ['save', 'invalidate', 'choices', 'journey', 'status']);
    p.toy.value = ''; p.toy.handlers.change();
    assert.deepEqual(plain(p.ctx.state.hs3_art_profile.facts.map(f => f.source)), ['home', 'accessory'], 'an emptied field drops its fact');
    p.toy.value = 'x'.repeat(200); p.toy.handlers.change();
    assert.equal(p.ctx.state.hs3_art_profile.facts.find(f => f.source === 'toy').text.length, 80);
    const without = load(page({memo: false})); without.ctx.bindExtras();
    assert.equal(without.artist.hidden, true, 'no add-on product, no photo offer'); assert.equal(without.ctx.added, undefined);
  });
  test(`${minified ? 'minified' : 'source'}: photos ride to our artist on a linked add-on line, after the gift and around the checkout-image wrap`, async () => {
    const p = load(page());
    p.ctx.bindExtras();
    p.notes.value = 'Her blue duck, in her mouth';
    p.ctx.added([{variant_id: 5, properties: {_customization_id: ID}}]);
    await new Promise(r => setImmediate(r));
    assert.equal(p.posts.length, 1);
    const [url, body] = p.posts[0];
    assert.equal(url, '/cart/add.js'); assert.equal(body.get('id'), '777'); assert.equal(body.get('properties[_hs_addon_for]'), ID);
    assert.equal(body.get('properties[What to change]'), 'Her blue duck, in her mouth');
    assert.deepEqual([...body.keys()].filter(k => /Photo/.test(k)), ['properties[Photo 1: Favorite toy]', 'properties[Photo 2: Collar or accessory]']);
    assert.match(p.status.textContent, /^Added\./); assert.equal(p.announced.length, 1, 'the drawer hears about it');
    assert.equal(p.notes.value, ''); assert.equal(p.artist.open, false);
    // nothing filled in: no add-on
    p.photos.forEach(ph => { ph.file.files = []; });
    p.ctx.added([{variant_id: 5, properties: {_customization_id: ID}}]);
    await new Promise(r => setImmediate(r));
    assert.equal(p.posts.length, 1);
    // a gift with no design id is not guessed at
    const q = load(page()); q.ctx.bindExtras(); q.ctx.added([{variant_id: 5, properties: {}}]);
    assert.equal(q.posts.length, 0); assert.match(q.status.textContent, /from your cart page/);
  });
}
