// Their toy or collar on the product page (Krish, 28 Oct: "I cant seem to upload any images of
// accessories"). The words become the chat's own toy and accessory facts, so they reach the
// painting; words the chat already has show as one line with Change, not as the question again,
// and the painter's copy is tidied while the chat keeps them as typed. The Artist's touch is a
// choice made in so many words (the 28 Oct recordings: one tap on a sentence added it, with no way
// off): "Add our artist's touch", then "Added. Remove". When on, its line goes in right after the
// gift, linked to its design, with the 5 days it adds and the tagged photos, around the
// checkout-image wrap, and the drawer hears once, after both (announceAdd waits on it). While its photos
// upload, its words show beside Add to cart and the next add is held (28 Oct review: nothing said the
// gift went in, and a second tap added the gift and the touch again).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {Liquid} from 'liquidjs';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
// arrays made inside the vm context have its prototypes; compare their contents
const plain = x => JSON.parse(JSON.stringify(x));
const ID = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const el = (attrs = {}) => Object.assign({hidden: false, value: '', textContent: '', handlers: {}, attrs: {}, focused: 0,
  addEventListener(n, f) { this.handlers[n] = f; }, focus() { this.focused++; },
  setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }}, attrs);

function page({memo = true, toy = 'A squeaky duck', tidy = null, announcer = true} = {}) {
  const extraToy = el({attrs: {'data-hs-extra': 'toy'}}), accessory = el({attrs: {'data-hs-extra': 'accessory'}});
  const notes = el(), status = el(), price = el(), offer = el(), on = el({hidden: true}), add = el(), remove = el();
  const summary = el({hidden: true}), said = el(), ask = el(), change = el();
  const photos = [{name: 'duck.jpg'}, null, {name: 'collar.jpg'}].map((f, i) => {
    const text = el({textContent: 'Choose photo ' + (i + 1), attrs: {'data-hs-file-empty': 'Choose photo ' + (i + 1)}});
    const file = el({files: f ? [f] : [], value: f ? 'C:\\fakepath\\x.jpg' : '', parentNode: {querySelector: s => (s === '[data-hs-file-text]' ? text : null)}});
    const tag = el({value: ['Favorite toy', 'Collar or accessory', 'Another photo of my dog'][i]});
    return {file, tag, text, querySelector(s) { return s === '[data-hs-extras-file]' ? this.file : s === '[data-hs-extras-tag]' ? this.tag : null; }};
  });
  const parts = {'[data-hs-extras-price]': price, '[data-hs-extras-notes]': notes, '[data-hs-extras-status]': status, '[data-hs-extras-offer]': offer, '[data-hs-extras-on]': on, '[data-hs-extras-add]': add, '[data-hs-extras-remove]': remove};
  const artist = el({hidden: true, attrs: {'data-hs-extras-state': 'off'}, querySelector: s => parts[s] || null, querySelectorAll: s => (s === '.hs-extras__photo' ? photos : s === '[data-hs-extras-file]' ? photos.map(p => p.file) : [])});
  const bits = {'[data-hs-extras-artist]': artist, '[data-hs-extras-summary]': summary, '[data-hs-extras-said]': said, '[data-hs-extras-ask]': ask, '[data-hs-extras-change]': change};
  const box = el({hidden: true, querySelectorAll: () => [extraToy, accessory], querySelector: s => bits[s] || null});
  const memoEl = memo ? el({attrs: {'data-hs-artist-variant': '777', 'data-hs-artist-price': '$29'}}) : null;
  const store = {'hs3-gift': JSON.stringify({dog: 'Pip', toy})};
  const calls = [], posts = [], announced = [], tracked = [], lines = [], listeners = {};
  const facts = [{source: 'home', text: 'Waits at the door.'}].concat(toy ? [{source: 'toy', text: toy}] : []);
  const state = {hs3_art_profile: {version: 1, facts}};
  const ctx = {state, FormData, URLSearchParams, confirmAdds: {done: announcer},
    window: {HSArtworkProfile: tidy ? {tidy} : {}, sessionStorage: {getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }}},
    document: {querySelector: s => (s === '[data-hs-extras]' ? box : s === '[data-hs-artist-variant]' ? memoEl : s === '[data-hs-extras-artist]' ? artist : null),
      addEventListener(name, fn, capture) { listeners[name] = {fn, capture}; }},
    checkoutImageStatus: message => lines.push(message),
    nativeArtworkPurchase: () => true, artworkFacts: () => JSON.stringify(state.hs3_art_profile), save() { calls.push('save'); }, invalidateBlanketReview() { calls.push('invalidate'); },
    artworkChoicesChanged() { calls.push('choices'); }, journeyCard() { calls.push('journey'); }, updateBlanketPurchaseStatus() { calls.push('status'); }, track(name) { tracked.push(name); }, shopRoot: () => '/',
    announceAdd: items => announced.push(items), onCartAdd: f => { ctx.added = f; }};
  ctx.onCartAdd.fetch0 = function (url, o) { posts.push([url, o.body, this]); return Promise.resolve({ok: true, json: async () => ({id: 1, variant_id: 777})}); };
  ctx.window.fetch = () => { throw new Error('the wrapped fetch would send this through the checkout-image preparation'); };
  return {ctx, toy: extraToy, accessory, notes, status, price, artist, offer, on, add, remove, summary, said, ask, change, box, store, calls, posts, announced, tracked, photos, lines, listeners};
}
for (const minified of [false, true]) {
  const load = p => { const code = ['bindExtras', 'extrasAfterAdd'].map(section).join('\n'); vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, p.ctx); return p; };
  const mode = minified ? 'minified' : 'source';
  test(`${mode}: words the chat has show as one line; the words are the chat's facts, tidied for the painter`, () => {
    // a stand-in for HSArtworkProfile.tidy (another change adds the real one): a run of ! to a period, a capital
    const p = load(page({tidy: t => t.replace(/!+$/, '.').replace(/^./, c => c.toUpperCase())}));
    p.ctx.bindExtras();
    assert.equal(p.box.hidden, false); assert.equal(p.toy.value, 'A squeaky duck', 'what they told Buddy is already there'); assert.equal(p.accessory.value, '');
    assert.equal(p.summary.hidden, false, 'the chat already said it: one line'); assert.equal(p.ask.hidden, true, 'not the question again');
    assert.equal(p.said.textContent, 'A squeaky duck');
    p.change.handlers.click();
    assert.equal(p.summary.hidden, true); assert.equal(p.ask.hidden, false); assert.equal(p.toy.focused, 1, 'Change opens the fields');
    p.accessory.value = '  a red   bandana!! '; p.accessory.handlers.change();
    assert.deepEqual(plain(p.ctx.state.hs3_art_profile.facts.map(f => f.source + ':' + f.text)), ['home:Waits at the door.', 'toy:A squeaky duck', 'accessory:A red bandana.'], 'tidied for the painter');
    assert.equal(JSON.parse(p.store['hs3-gift']).accessory, 'a red bandana!!', 'Buddy keeps the words as typed');
    assert.equal(p.said.textContent, 'A squeaky duck · A red bandana.');
    assert.deepEqual(p.calls, ['save', 'invalidate', 'choices', 'journey', 'status']);
    p.toy.value = ''; p.toy.handlers.change();
    assert.deepEqual(plain(p.ctx.state.hs3_art_profile.facts.map(f => f.source)), ['home', 'accessory'], 'an emptied field drops its fact');
    p.toy.value = 'x'.repeat(200); p.toy.handlers.change();
    assert.equal(p.ctx.state.hs3_art_profile.facts.find(f => f.source === 'toy').text.length, 80);
    // nothing from the chat: the question, open
    const fresh = load(page({toy: ''})); fresh.ctx.bindExtras();
    assert.equal(fresh.summary.hidden, true); assert.equal(fresh.ask.hidden, false);
    const without = load(page({memo: false})); without.ctx.bindExtras();
    assert.equal(without.artist.hidden, true, 'no add-on product, no offer'); assert.equal(without.ctx.added, undefined);
  });
  test(`${mode}: the artist's touch is a choice with a way off, and goes in after the gift with its 5 days and tagged photos`, async () => {
    const p = load(page());
    p.ctx.bindExtras();
    assert.equal(p.artist.hidden, false); assert.equal(p.price.textContent, '$29');
    assert.equal(p.artist.getAttribute('data-hs-extras-state'), 'off'); assert.equal(p.offer.hidden, false); assert.equal(p.on.hidden, true);
    // off: nothing goes in, whatever is filled in
    p.notes.value = 'Her blue duck, in her mouth';
    p.ctx.added([{variant_id: 5, properties: {_customization_id: ID}}]);
    await new Promise(r => setImmediate(r));
    assert.equal(p.posts.length, 0, 'not chosen, not added');
    p.add.handlers.click();
    assert.equal(p.artist.getAttribute('data-hs-extras-state'), 'on'); assert.equal(p.offer.hidden, true); assert.equal(p.on.hidden, false, '"Added. Remove"');
    p.remove.handlers.click();
    assert.equal(p.artist.getAttribute('data-hs-extras-state'), 'off'); assert.equal(p.offer.hidden, false); assert.equal(p.on.hidden, true, 'Remove takes it off');
    assert.deepEqual(p.tracked, ['artist_touch_on', 'artist_touch_off']);
    p.add.handlers.click();
    p.photos[0].file.handlers.change();
    assert.equal(p.photos[0].text.textContent, 'duck.jpg', 'the picker names the photo');
    const pending = p.ctx.added([{variant_id: 5, properties: {_customization_id: ID}}]);
    assert.equal(p.ctx.extrasAfterAdd.pending, pending, 'announceAdd can wait for it');
    assert.equal(await pending, true);
    assert.equal(p.posts.length, 1);
    const [url, body] = p.posts[0];
    assert.equal(url, '/cart/add.js'); assert.equal(body.get('id'), '777'); assert.equal(body.get('properties[_hs_addon_for]'), ID);
    assert.equal(body.get('properties[What to change]'), 'Her blue duck, in her mouth');
    assert.equal(body.get('properties[Delivery]'), 'Adds 5 days');
    assert.deepEqual([...body.keys()].filter(k => /Photo/.test(k)), ['properties[Photo 1 (favorite toy)]', 'properties[Photo 2 (another photo of my dog)]']);
    assert.match(p.status.textContent, /^Added\./);
    assert.equal(p.announced.length, 0, 'the gift\'s own announcement waits for this one: the drawer hears once');
    assert.equal(p.notes.value, ''); assert.equal(p.photos[0].text.textContent, 'Choose photo 1');
    assert.equal(p.artist.getAttribute('data-hs-extras-state'), 'off', 'in the cart now: the next gift asks again');
    // chosen with only the chat's words: the artist paints those in
    const w = load(page()); w.ctx.bindExtras(); w.add.handlers.click(); w.photos.forEach(ph => { ph.file.files = []; });
    await w.ctx.added([{variant_id: 5, properties: {_customization_id: ID}}]);
    assert.equal(w.posts[0][1].get('properties[What to change]'), 'Paint in by hand: A squeaky duck.');
    // chosen with nothing to go on: not added, and said why
    const n = load(page({toy: ''})); n.ctx.bindExtras(); n.add.handlers.click(); n.photos.forEach(ph => { ph.file.files = []; });
    n.ctx.added([{variant_id: 5, properties: {_customization_id: ID}}]);
    assert.equal(n.posts.length, 0); assert.match(n.status.textContent, /Tell our artist what to change/);
    // a gift with no design id is not guessed at
    const q = load(page()); q.ctx.bindExtras(); q.add.handlers.click(); q.ctx.added([{variant_id: 5, properties: {}}]);
    assert.equal(q.posts.length, 0); assert.match(q.status.textContent, /from your cart page/);
    // a page with no gift announcement still tells the drawer
    const lone = load(page({announcer: false})); lone.ctx.bindExtras(); lone.add.handlers.click();
    await lone.ctx.added([{variant_id: 5, properties: {_customization_id: ID}}]);
    assert.equal(lone.announced.length, 1);
  });
  test(`${mode}: while the artist's touch uploads, its words are beside Add to cart and a second tap adds nothing twice`, async () => {
    const p = load(page());
    let land;
    p.ctx.onCartAdd.fetch0 = (url, o) => { p.posts.push([url, o.body]); return new Promise(resolve => { land = resolve; }); };
    p.ctx.bindExtras(); p.add.handlers.click();
    const tap = on => { const e = {target: {closest: s => (on && s.includes('#teeAtcButton') ? {} : null)}, held: 0, preventDefault() { this.held++; }, stopImmediatePropagation() { this.held++; }}; p.listeners.click.fn(e); return e.held > 0; };
    assert.equal(p.listeners.click.capture, true, 'before Teeinblue and our own add check hear the tap');
    assert.equal(tap(true), false, 'nothing on its way: Add to cart works');
    const sending = p.ctx.added([{variant_id: 5, properties: {_customization_id: ID}}]);
    assert.deepEqual(p.lines, ['Sending your photos to our artist.'], 'said beside the button, where the buyer is looking');
    assert.equal(p.status.textContent, 'Sending your photos to our artist.');
    assert.equal(tap(true), true, 'a second tap is held while the photos upload');
    assert.equal(p.lines.at(-1), "One moment. Adding our artist's touch.");
    assert.equal(tap(false), false, 'other taps are not');
    // a second add landing anyway does not send the touch again
    p.ctx.added([{variant_id: 5, properties: {_customization_id: ID}}]);
    assert.equal(p.posts.length, 1, 'one artist\'s touch');
    land({ok: true, json: async () => ({id: 1, variant_id: 777})});
    assert.equal(await sending, true);
    assert.equal(p.lines.at(-1), '', 'the drawer opens next and is the confirmation');
    assert.equal(tap(true), false, 'in the cart: Add to cart works again');
    // a failure is said beside the button too, and frees the button
    const f = load(page());
    f.ctx.onCartAdd.fetch0 = () => Promise.resolve({ok: false, status: 413});
    f.ctx.bindExtras(); f.add.handlers.click();
    assert.equal(await f.ctx.added([{variant_id: 5, properties: {_customization_id: ID}}]), false);
    assert.match(f.lines.at(-1), /^Your gift is in your cart, but the artist's touch did not go through\./);
    assert.equal(f.ctx.extrasAfterAdd.busy, false);
  });
}

test('the toy and collar box: examples read as examples, the photos start on different tags, and the touch is a button', async () => {
  const liquid = readFileSync(new URL('../../shopify/snippets/hs-native-artwork.liquid', import.meta.url), 'utf8');
  const start = liquid.indexOf('<div class="hs-extras" data-hs-extras hidden>'), end = liquid.indexOf('<p data-hs2-checkout-image-status');
  assert.ok(start > 0 && end > start);
  const html = await new Liquid().parseAndRender(liquid.slice(start, end), {});
  assert.deepEqual([...html.matchAll(/placeholder="([^"]*)"/g)].map(m => m[1]).filter(t => !/^For example, /.test(t)), [], 'every placeholder is an example');
  const picked = [...html.matchAll(/<select[\s\S]*?<\/select>/g)].map(m => (m[0].match(/<option selected>([^<]+)</) || [])[1]);
  assert.equal(picked.length, 3); assert.equal(new Set(picked).size, 3, 'no two photos start on the same tag');
  assert.match(html, /<button type="button" class="hs-extras__add" data-hs-extras-add>Add our artist's touch, <span data-hs-extras-price><\/span><\/button>/);
  assert.match(html, /<p class="hs-extras__sub">Adds 5&nbsp;days\. A person reworks your design by&nbsp;hand\.<\/p>/);
  assert.match(html, /Added\. <button type="button" class="hs-extras__remove" data-hs-extras-remove>Remove<\/button>/);
  assert.doesNotMatch(html, /<details|<input type="file" accept="image\/\*" aria-label="Photo \d" data-hs-extras-file>\s*<\/div>/, 'no sentence that adds it on a tap, no bare file input');
  assert.equal((html.match(/<label class="hs-file"><input type="file"/g) || []).length, 3);
});
