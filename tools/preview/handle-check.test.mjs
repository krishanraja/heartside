// handle-check.mjs, the browser-free storefront guard that runs before and after every guarded
// theme push and every hour (storefront-guard.yml). The real script runs against a stand-in
// store on 127.0.0.1 (node:http) for each way the 28 Oct handle trap, or anything like it, can
// show: a 301 to the draft handle, a 404, a wrong handle or the campaign's title in the product
// JSON, the chat config without the portrait, the blank base as a variant picture (each one named
// by its gift and title), the heart stand-in on the Artist's touch as it was served on 28 Oct, a
// redirect map that holds or breaks, and a Cloudflare challenge (inconclusive, exit 2, never "all
// clear"). Output names paths and variant titles only, never a host or an id.
//
//   node --test tools/preview/handle-check.test.mjs
import {test, describe, after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {CORE, ADDON, REDIRECTS, BLANK_MEDIA_IDS} from './catalog.mjs';
import {judge, blocked, buyAttributes, hasMarker, chatConfig, chatProblems, menuLinks, menuProblems, productProblems, isBlank, isStandin, fileStem, variantName} from './handle-check.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, 'handle-check.mjs');
const [MUG, PORTRAIT, BLANKET] = CORE;
const DRAFT = '/products/heartside-city-screenprint-draft-2026-10-23';

// ---------------------------------------------------------------- the stand-in store
const productJson = (item, over = {}) => ({
  handle: item.handle, title: item.title, price_min: item.min, price_max: item.max, available: true,
  variants: Array.from({length: item.variants}, (_, i) => ({id: i + 1, available: true,
    featured_image: {src: `//cdn.test/s/files/${item.key}-design-tile-${i}.jpg`, alt: 'Painted from your photo'},
    featured_media: {id: 9100 + i, alt: 'Painted from your photo', preview_image: {src: `//cdn.test/s/files/${item.key}-design-tile-${i}.jpg`}}})),
  ...over,
});
const buy = (item) => `<div class="hs2-wrap hs2-product" id="buy" data-hs2-checkout-image-enabled="true"${Object.entries(item.marker).map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${v}"`)).join('')} data-hs2-option-labels="{}">`;
const productPage = (item) => `<!doctype html><title>${item.title}</title><main>${buy(item)}<h1>${item.title}</h1></div></main>`;
const gifts = (over = {}) => Object.fromEntries(CORE.map((c) => [c.chat, over[c.chat] || {url: c.path, handle: c.handle, title: c.title, price: c.min / 100}]));
const homePage = ({config = {gifts: {...gifts(), ornament: {url: null, handle: null, price: null}}}, links = CORE.map((c) => c.path)} = {}) => `<!doctype html><title>Heartside</title><main><script type="application/json" data-hs3-config>
  ${JSON.stringify(config)}
  </script><button data-hs3-start>Start with your dog</button></main><template data-hs-menu><nav class="hs-menu"><a class="hs-menu__start" href="/">Make a gift with Buddy</a><ul>${links.map((p) => `<li><a href="${p}"><span>Gift</span></a></li>`).join('')}</ul></nav></template>`;
const json = (body, status = 200) => ({status, type: 'application/json', body: JSON.stringify(body)});
const html = (body, status = 200) => ({status, body});
const to = (location, status = 301) => ({status, headers: {location}});
// a clean store: every route as it should be; a test overrides the routes it breaks
function store(over = {}) {
  const routes = {};
  for (const item of CORE) { routes[item.path + '.js'] = json(productJson(item)); routes[item.path] = html(productPage(item)); }
  routes['/'] = html(homePage());
  routes[ADDON.path + '.js'] = json({handle: ADDON.handle, title: "Artist's touch", price_min: ADDON.min, price_max: ADDON.min, available: true, featured_image: '//cdn.test/s/files/artists-touch-tile.png', images: ['//cdn.test/s/files/artists-touch-tile.png'], variants: [{id: 1, available: true, featured_image: null}]});
  for (const [from, target] of Object.entries(REDIRECTS)) routes[from] = to(target);
  return {...routes, ...over};
}

const seen = [];
async function checkOn(routes, ...args) {
  const asked = [];
  const server = http.createServer((req, res) => {
    seen.push(req.headers.host); asked.push(req.url);
    const u = new URL(req.url, 'http://x');
    const r = (typeof routes === 'function' ? routes(u) : routes[u.pathname]) || {status: 404, body: 'Not found'};
    res.writeHead(r.status, {'content-type': r.type || 'text/html; charset=utf-8', ...(r.headers || {})});
    res.end(r.body || '');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  try {
    // async, so the stand-in server keeps answering while the check runs
    const r = await new Promise((resolve) => execFile(process.execPath, [script, '--base', `http://127.0.0.1:${port}`, ...args], {timeout: 60000}, (err, stdout, stderr) => resolve({code: err ? err.code : 0, out: stdout + stderr})));
    return {...r, asked, port};
  } finally { server.close(); }
}
after(() => { assert.ok(seen.length > 0 && seen.every((h) => h.startsWith('127.0.0.1:')), 'only the stand-in stores were asked'); });
const noHost = (r) => { assert.doesNotMatch(r.out, /127\.0\.0\.1|localhost/, 'paths only, never the host'); assert.doesNotMatch(r.out, new RegExp(String(r.port)), 'never the port'); };

describe('handle-check against a stand-in store', {concurrency: 4}, () => {
  test('a clean store, with both draft handles redirecting to the clean ones, is all clear', async () => {
    const r = await checkOn(store());
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /all clear/);
    for (const item of CORE) assert.match(r.out, new RegExp(`ok   ${item.path}\\.js`));
    for (const [from, target] of Object.entries(REDIRECTS)) assert.match(r.out, new RegExp(`ok   ${from}: 301 to ${target}`));
    noHost(r);
  });

  test('the portrait 301s to the draft handle (the 28 Oct trap): broken, naming your-dogs-portrait', async () => {
    const r = await checkOn(store({[PORTRAIT.path]: to(DRAFT), [PORTRAIT.path + '.js']: to(DRAFT + '.js'), [DRAFT]: html(productPage(PORTRAIT)), [DRAFT + '.js']: json(productJson(PORTRAIT))}));
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL \/products\/your-dogs-portrait\.js: moved: \/products\/your-dogs-portrait\.js now lands on \/products\/heartside-city-screenprint-draft-2026-10-23\.js \(HTTP 301\)/);
    assert.match(r.out, /FAIL \/products\/your-dogs-portrait: moved/);
    assert.doesNotMatch(r.out, /all clear/);
    noHost(r);
  });

  test('the blanket answers 404: broken', async () => {
    const r = await checkOn(store({[BLANKET.path]: html('Not found', 404), [BLANKET.path + '.js']: html('Not found', 404)}));
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL \/products\/your-dogs-personality-blanket\.js: answered HTTP 404, expected 200/);
  });

  test("the product JSON carries another product's handle: broken", async () => {
    const r = await checkOn(store({[MUG.path + '.js']: json(productJson(MUG, {handle: 'the-morning-mug'}))}));
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL \/products\/your-dogs-illustrated-mug\.js: its handle is "the-morning-mug"/);
  });

  test("the portrait's title became the campaign's title: broken", async () => {
    const r = await checkOn(store({[PORTRAIT.path + '.js']: json(productJson(PORTRAIT, {title: 'Heartside City Screenprint - DRAFT 2026-10-23'}))}));
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /its title is "Heartside City Screenprint - DRAFT 2026-10-23"/);
  });

  test('the home chat config with a null portrait (a renamed handle in the product setting): broken', async () => {
    const r = await checkOn(store({'/': html(homePage({config: {gifts: gifts({print: {url: null, handle: null, price: null}})}}))}));
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL \/: home: the chat has no portrait/);
  });

  test('the phone menu lost the mug link: broken', async () => {
    const r = await checkOn(store({'/': html(homePage({links: [PORTRAIT.path, BLANKET.path]}))}));
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /home: the phone menu has no link to \/products\/your-dogs-illustrated-mug/);
  });

  test('a product page off its native template: broken', async () => {
    const r = await checkOn(store({[MUG.path]: html(`<main><div id="buy" class="hs2-wrap"><h1>${MUG.title}</h1></div></main>`)}));
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL \/products\/your-dogs-illustrated-mug: not on its native template \(no #buy\[data-hs2-artwork-kind="mug"\]\[data-hs2-purchase-enabled="true"\]\)/);
  });

  test('a variant picture that is the blank base fails; --warn-media (the theme push) only warns', async () => {
    const blankBlanket = productJson(BLANKET);
    blankBlanket.variants[0].featured_media = {id: Number(BLANK_MEDIA_IDS[0]), alt: 'Blank tan sherpa blanket reference. Your personalized artwork is shown in your cart.'};
    blankBlanket.variants[0].featured_image = {src: '//cdn.test/s/files/blanket-base.png', alt: 'Blank tan sherpa blanket reference. Your personalized artwork is shown in your cart.'};
    const routes = store({[BLANKET.path + '.js']: json(blankBlanket)});
    const r = await checkOn(routes);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL \/products\/your-dogs-personality-blanket\.js: 1 of 1 variants show the blank base picture/);
    const w = await checkOn(routes, '--warn-media');
    assert.equal(w.code, 0, w.out);
    assert.match(w.out, /warn \/products\/your-dogs-personality-blanket\.js: 1 of 1 variants show the blank base picture/);
  });

  // review of #65: CoWork attaches a tile only to the variants the check names, so it names each
  // blank one by its gift and its title, as Shopify admin shows it, and never prints an id
  test('each blank variant is named by its gift and its title, never by an id', async () => {
    const portrait = productJson(PORTRAIT);
    const titles = ['Framed / Black / 12″×18″', 'Framed / Red Oak / 12″×18″', 'Framed / White / 12″×18″', 'Unframed / Default / 12″×18″'];
    portrait.variants.forEach((v, i) => { v.id = 47900000000 + i; v.title = titles[i]; });
    for (const i of [0, 3]) portrait.variants[i].featured_media = {id: Number(BLANK_MEDIA_IDS[0]), alt: 'Example frame', preview_image: {src: '//cdn.test/s/files/portrait-base.png'}};
    const r = await checkOn(store({[PORTRAIT.path + '.js']: json(portrait)}), '--warn-media');
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /^warn \/products\/your-dogs-portrait\.js: 2 of 4 variants show the blank base picture, which checkout draws on the gift's nested line: portrait "Framed \/ Black \/ 12″×18″", portrait "Unframed \/ Default \/ 12″×18″"$/m);
    assert.doesNotMatch(r.out, /4790000000\d|71850515169662/, 'never a variant or media id');
    noHost(r);
  });

  // review of #65: on 28 Oct products/artists-touch.js served the pink heart as artists-touch.png,
  // alt "Artist's touch by Heartside", and the check said "has its own picture". Our tile is
  // artists-touch-tile.png: as the first picture, with the heart behind it, it passes, also under
  // the name Shopify gives a second upload
  test("the Artist's touch as served on 28 Oct is the heart stand-in: broken; the tile in front of it passes", async () => {
    const HEART = '//cdn.test/s/files/artists-touch.png?v=1793181652', TILE = '//cdn.test/s/files/artists-touch-tile.png?v=1793190000';
    const addon = (pics) => json({handle: ADDON.handle, title: "Artist's touch", price_min: ADDON.min, price_max: ADDON.min, available: true, featured_image: pics[0].src, images: pics.map((x) => x.src),
      media: pics.map((x, i) => ({id: x.id, alt: x.alt, position: i + 1, media_type: 'image', src: x.src, preview_image: {src: x.src}})), variants: [{id: 1, available: true, featured_image: null}]});
    const heart = {id: 71873863057790, alt: "Artist's touch by Heartside", src: HEART};
    const live = await checkOn(store({[ADDON.path + '.js']: addon([heart])}));
    assert.equal(live.code, 1, live.out);
    assert.match(live.out, /FAIL \/products\/artists-touch\.js: still shows the heart stand-in picture/);
    assert.doesNotMatch(live.out, /71873863057790/, 'never the media id');
    for (const src of [TILE, '//cdn.test/s/files/artists-touch-tile_3f2c1a9e-1b2c-4d5e-8f90-a1b2c3d4e5f6.png?v=2']) {
      const tile = await checkOn(store({[ADDON.path + '.js']: addon([{id: 71900000000001, alt: "Our artist's touch: a person adds the details you send.", src}, heart])}));
      assert.equal(tile.code, 0, tile.out);
      assert.match(tile.out, /ok {3}\/products\/artists-touch\.js: has its own picture/);
    }
  });

  test("the Artist's touch still shows the heart stand-in, or no picture: broken", async () => {
    const heart = await checkOn(store({[ADDON.path + '.js']: json({handle: ADDON.handle, price_min: ADDON.min, featured_image: '//cdn.test/s/files/heartside-favicon-heart.png?v=1', images: ['//cdn.test/s/files/heartside-favicon-heart.png?v=1']})}));
    assert.equal(heart.code, 1, heart.out);
    assert.match(heart.out, /FAIL \/products\/artists-touch\.js: still shows the heart stand-in picture/);
    const none = await checkOn(store({[ADDON.path + '.js']: json({handle: ADDON.handle, price_min: ADDON.min, featured_image: null, images: []})}));
    assert.equal(none.code, 1, none.out);
    assert.match(none.out, /artists-touch\.js: has no picture/);
  });

  test('a draft handle that no longer redirects (404) is broken; one that 302s is too', async () => {
    const [from, target] = Object.entries(REDIRECTS)[0];
    const gone = await checkOn(store({[from]: html('Not found', 404)}));
    assert.equal(gone.code, 1, gone.out);
    assert.match(gone.out, new RegExp(`FAIL ${from}: answers HTTP 404, expected 301 to ${target}`));
    const temp = await checkOn(store({[from]: to(target, 302)}));
    assert.equal(temp.code, 1, temp.out);
  });

  test('a Cloudflare challenge on every request is inconclusive: exit 2, never all clear', async () => {
    const r = await checkOn(() => ({status: 403, headers: {'cf-mitigated': 'challenge'}, body: '<!doctype html><title>Just a moment...</title>'}));
    assert.equal(r.code, 2, r.out);
    assert.doesNotMatch(r.out, /all clear/);
    assert.match(r.out, /inconclusive/);
    assert.doesNotMatch(r.out, /^FAIL/m, 'blocked is not broken');
  });

  test('a challenge on some checks and a broken address elsewhere is broken (exit 1)', async () => {
    const routes = store({[BLANKET.path + '.js']: html('Not found', 404)});
    const r = await checkOn((u) => (u.pathname.startsWith('/products/your-dogs-portrait') ? {status: 403, body: '<title>Just a moment...</title>'} : routes[u.pathname]));
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /not checked/);
  });

  test('--theme reads the home page and product pages of that theme, and never prints its id', async () => {
    const r = await checkOn(store(), '--theme', '987654321');
    assert.equal(r.code, 0, r.out);
    assert.ok(r.asked.includes('/?preview_theme_id=987654321'), r.asked.join(' '));
    assert.ok(r.asked.includes(`${MUG.path}?preview_theme_id=987654321`));
    assert.ok(r.asked.includes(`${MUG.path}.js`), 'product JSON is store-wide: no preview id');
    assert.doesNotMatch(r.out, /987654321/);
    noHost(r);
    const bad = await checkOn(store(), '--theme', 'abc');
    assert.equal(bad.code, 3);
    assert.doesNotMatch(bad.out, /abc/);
  });

  test('a theme preview that hops with a cookie on the same path is followed, not counted as moved', async () => {
    const routes = store();
    const r = await checkOn((u) => (u.pathname === '/' && u.searchParams.has('preview_theme_id') && !u.searchParams.has('_fd') ? {status: 302, headers: {location: '/?_fd=0&preview_theme_id=5', 'set-cookie': 'preview_theme=5; path=/'}} : routes[u.pathname]), '--theme', '5');
    assert.equal(r.code, 0, r.out);
  });
});

// ------------------------------------------------------------------ the pure parts
test('judge(): broken beats inconclusive beats clear; --warn-media turns picture failures into warnings', () => {
  const ok = {path: '/a', state: 'ok', kind: 'address', detail: ''};
  const fail = {path: '/b', state: 'fail', kind: 'address', detail: 'moved'};
  const media = {path: '/c', state: 'fail', kind: 'media', detail: 'blank'};
  const unknown = {path: '/d', state: 'unknown', kind: 'address', detail: 'challenge'};
  assert.equal(judge([ok]).code, 0);
  assert.equal(judge([ok, unknown]).code, 2);
  assert.equal(judge([ok, unknown, fail]).code, 1);
  assert.equal(judge([ok, media]).code, 1);
  assert.equal(judge([ok, media], {warnMedia: true}).code, 0);
  assert.equal(judge([ok, media], {warnMedia: true}).warned.length, 1);
  assert.equal(judge([ok, media, unknown], {warnMedia: true}).code, 2);
  assert.equal(judge([]).code, 0);
});

test('blocked(): a Cloudflare challenge, a rate limit or a server error says nothing about the store', () => {
  assert.equal(blocked({status: 403, headers: {'cf-mitigated': 'challenge'}, text: ''}), 'a Cloudflare challenge');
  assert.equal(blocked({status: 403, headers: {}, text: '<title>Just a moment...</title>'}), 'a Cloudflare challenge');
  assert.equal(blocked({status: 200, headers: {}, text: '<title>Attention Required | Cloudflare</title>'}), 'a Cloudflare challenge');
  assert.match(blocked({status: 429, headers: {}, text: ''}), /rate limit/);
  assert.match(blocked({status: 503, headers: {}, text: ''}), /server error/);
  assert.equal(blocked({status: 404, headers: {}, text: 'Not found'}), '');
  assert.equal(blocked({status: 200, headers: {}, text: '<title>Heartside</title>'}), '');
});

test('the parts that read the server HTML', () => {
  assert.deepEqual(buyAttributes('<div class="a" id="buy" data-hs2-blanket-purchase data-x=\'1\'>'), {class: 'a', id: 'buy', 'data-hs2-blanket-purchase': '', 'data-x': '1'});
  assert.equal(buyAttributes('<div id="buyer">'), null);
  assert.ok(hasMarker(productPage(BLANKET), BLANKET));
  assert.ok(!hasMarker(productPage(BLANKET), MUG));
  assert.ok(!hasMarker('<div id="buy" data-hs2-artwork-kind="mug" data-hs2-purchase-enabled="false">', MUG), 'purchase switched off');
  assert.deepEqual(chatProblems(chatConfig(homePage())), []);
  assert.deepEqual(chatProblems(null), ['home: no chat config on the first screen']);
  assert.match(chatProblems({gifts: gifts({blanket: {url: '/products/heartside-personality-blanket-draft-2026-10-23', handle: 'heartside-personality-blanket-draft-2026-10-23'}})})[0], /the chat's blanket is \/products\/heartside-personality-blanket-draft-2026-10-23/);
  assert.deepEqual(menuProblems(menuLinks(homePage())), []);
  assert.deepEqual(menuProblems(null), ['home: the phone menu is missing']);
  assert.deepEqual(productProblems(MUG, productJson(MUG)), []);
  assert.deepEqual(productProblems(PORTRAIT, productJson(PORTRAIT, {price_min: 11900})), ['its prices are 11900..11900 cents, expected 5900..11900']);
  const off = productJson(MUG); off.variants[2].available = false;
  assert.deepEqual(productProblems(MUG, off), ['1 of 5 variants unavailable']);
  assert.ok(isBlank({featured_media: {id: Number(BLANK_MEDIA_IDS[1])}}));
  assert.ok(isBlank({featured_image: {src: 'x.png', alt: 'Blank white mug'}}));
  assert.ok(!isBlank({featured_image: {src: 'x.png', alt: 'Example mug with a pug'}}));
  assert.ok(!isBlank({featured_image: null, featured_media: null}));
});

test('fileStem() and isStandin(): the heart matches as itself under any Shopify suffix, and the tile never does', () => {
  for (const src of ['//cdn.shopify.com/s/files/1/0/files/artists-touch.png?v=1', 'artists-touch_400x.png', 'artists-touch_400x400@2x.png', 'artists-touch_x200_crop_center.png', 'artists-touch_small.png', 'ARTISTS-TOUCH_3f2c1a9e-1b2c-4d5e-8f90-a1b2c3d4e5f6.PNG']) assert.equal(fileStem(src), 'artists-touch', src);
  assert.equal(fileStem('//cdn.test/s/files/artists-touch-tile_1024x1024.png?v=3'), 'artists-touch-tile');
  // the heart by its file, its alt text or its media id
  assert.ok(isStandin({featured_image: '//cdn.test/s/files/artists-touch_1024x1024.png?v=1', images: []}));
  assert.ok(isStandin({featured_image: '//cdn.test/s/files/heartside-favicon-heart.png', images: []}));
  assert.ok(isStandin({featured_image: '//cdn.test/s/files/heart-2.png', media: [{id: 1, alt: 'Artist’s touch by Heartside', src: '//cdn.test/s/files/heart-2.png'}]}));
  assert.ok(isStandin({featured_image: '//cdn.test/s/files/heart-3.png', media: [{id: 71873863057790, alt: null}]}));
  // the tile, with the heart behind it
  assert.ok(!isStandin({featured_image: '//cdn.test/s/files/artists-touch-tile.png', media: [{id: 2, alt: "Our artist's touch: a person adds the details you send."}, {id: 71873863057790, alt: "Artist's touch by Heartside"}]}));
  assert.ok(!isStandin({featured_image: '//cdn.test/s/files/artists-touch-tile_3f2c1a9e-1b2c-4d5e-8f90-a1b2c3d4e5f6.png'}));
  assert.ok(!isStandin(null));
});

test('variantName(): the gift and the title Shopify gives, or the place in the list, never the id', () => {
  assert.equal(variantName(PORTRAIT, {id: 47900000003, title: 'Unframed / Default / 12″×18″'}, 3, 4), 'portrait "Unframed / Default / 12″×18″"');
  assert.equal(variantName(MUG, {id: 47900000004, options: ['White', '11 oz']}, 0, 5), 'mug "White / 11 oz"');
  assert.equal(variantName(BLANKET, {id: 47900000005, title: 'Default Title', options: ['Default Title']}, 0, 1), 'blanket variant 1 of 1');
  assert.equal(variantName(BLANKET, {id: 47900000005}, 0, 1), 'blanket variant 1 of 1');
});
