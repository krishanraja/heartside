// The gates and the handle trap (28 Oct): a Teeinblue campaign Update renamed the portrait's
// handle, Shopify answered the clean address with a 301 to the draft one, and live-gate printed
// "ok", because Playwright follows the redirect and the draft page had the same title and price.
// Here the real live-gate.mjs runs against a stand-in store on 127.0.0.1 (node:http): a
// redirected product address fails and names both paths, a chat config that lost the portrait
// fails, a Cloudflare challenge is inconclusive (exit 2, never "all clear"), and Krish's Edge
// phone (360x640) fails when "Start with your dog" ends below the first screen, and the rendered
// blanket page passes at the desk size, where its title cannot avoid "Blanket" alone. Also the shared
// launcher: certificate pins are read at launch from the CA bundle, never written into a gate.
// Nothing leaves 127.0.0.1: the stand-in pages load nothing else.
//
//   node --test tools/preview/live-gate-handles.test.mjs
import {test, describe, after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import tls from 'node:tls';
import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {interceptionPins, launchArgs, bundlePath, spkiPin, EDGE} from './browser.mjs';
import {CORE, landed} from './catalog.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const gate = path.join(here, 'live-gate.mjs');
const PORTRAIT = '/products/your-dogs-portrait', DRAFT = '/products/heartside-city-screenprint-draft-2026-10-23';

// a stand-in store per test: site(path) => {status, headers, body}
const seen = [];
async function gateOn(site, ...args) {
  const server = http.createServer((req, res) => {
    seen.push(req.headers.host);
    const r = site(new URL(req.url, 'http://x').pathname);
    res.writeHead(r.status, {'content-type': 'text/html; charset=utf-8', ...(r.headers || {})});
    res.end(r.body || '');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    // async, so the stand-in server keeps answering while the gate runs
    return await new Promise((resolve) => execFile(process.execPath, [gate, '--base', base, '--settle', '250', ...args], {timeout: 120000}, (err, stdout, stderr) => resolve({code: err ? err.code : 0, out: stdout + stderr})));
  } finally { server.close(); }
}
after(() => { assert.ok(seen.length > 0 && seen.every((h) => h.startsWith('127.0.0.1:')), 'only the stand-in stores were asked'); });

const page = (body, title = 'Heartside') => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body>${body}</body></html>`;
const portraitPage = (marked = true) => page(`<main><div class="hs2"><div id="buy"${marked ? ' data-hs2-artwork-kind="print" data-hs2-purchase-enabled="true"' : ''}><h1>Your Dog's Portrait</h1><span data-hs2-price>$119.00</span></div></div></main>`, "Your Dog's Portrait");
const gifts = (over = {}) => Object.fromEntries(CORE.map((c) => [c.chat, over[c.chat] || {url: c.path, handle: c.handle, title: c.title, price: c.min / 100}]));
const menu = (paths = CORE.map((c) => c.path)) => `<template data-hs-menu><nav class="hs-menu"><a class="hs-menu__start" href="/">Make a gift with Buddy</a><ul>${paths.map((p) => `<li><a href="${p}">Gift</a></li>`).join('')}</ul></nav></template>`;
const home = ({config = {gifts: gifts()}, hero = 300, links} = {}) => page(`<main><section class="hs3"><script type="application/json" data-hs3-config>${JSON.stringify(config)}</script><div style="height:${hero}px"></div><button type="button" class="hs3-btn" data-hs3-start>Start with your dog</button></section></main>${menu(links)}`);

describe('live-gate against a stand-in store', {concurrency: 3}, () => {
  test('a product address that 301s to the draft handle fails and names both paths', async () => {
    const r = await gateOn((p) => (p === PORTRAIT ? {status: 301, headers: {location: DRAFT}} : p === DRAFT ? {status: 200, body: portraitPage()} : {status: 404}), '--pages', 'portrait', '--views', 'desk');
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /your-dogs-portrait.*heartside-city-screenprint-draft-2026-10-23/);
    assert.doesNotMatch(r.out, /127\.0\.0\.1/, 'paths only, never the host');
  });

  test('control: the clean address answering itself passes', async () => {
    const r = await gateOn((p) => (p === PORTRAIT ? {status: 200, body: portraitPage()} : {status: 404}), '--pages', 'portrait', '--views', 'desk');
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /all clear/);
  });

  test("a product page that lost its native template's mark fails", async () => {
    const r = await gateOn((p) => (p === PORTRAIT ? {status: 200, body: portraitPage(false)} : {status: 404}), '--pages', 'portrait', '--views', 'desk');
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /not on its native template/);
  });

  test('the home chat config with the portrait gone (what a renamed handle renders) fails', async () => {
    const r = await gateOn((p) => (p === '/' ? {status: 200, body: home({config: {gifts: gifts({print: {url: null, handle: null, price: null}})}})} : {status: 404}), '--pages', 'home', '--views', 'phone');
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /the chat has no portrait/);
  });

  test('the home chat and phone menu at the clean addresses pass', async () => {
    const r = await gateOn((p) => (p === '/' ? {status: 200, body: home()} : {status: 404}), '--pages', 'home', '--views', 'phone');
    assert.equal(r.code, 0, r.out);
  });

  test('a phone menu without the blanket fails', async () => {
    const r = await gateOn((p) => (p === '/' ? {status: 200, body: home({links: CORE.filter((c) => c.key !== 'blanket').map((c) => c.path)})} : {status: 404}), '--pages', 'home', '--views', 'phone');
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /phone menu has no link to \/products\/your-dogs-personality-blanket/);
  });

  test('a Cloudflare challenge is inconclusive: exit 2, never all clear', async () => {
    const r = await gateOn(() => ({status: 403, headers: {'cf-mitigated': 'challenge'}, body: page('Checking your browser', 'Just a moment...')}), '--pages', 'portrait', '--views', 'desk');
    assert.equal(r.code, 2, r.out);
    assert.doesNotMatch(r.out, /all clear/);
    assert.match(r.out, /inconclusive/);
  });

  test("Krish's Edge phone: Start with your dog below a 640px first screen fails", async () => {
    const r = await gateOn((p) => (p === '/' ? {status: 200, body: home({hero: 700})} : {status: 404}), '--pages', 'home', '--views', 'edge');
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /below the first screen: "Start with your dog" ends at \d+px in a 640px window/);
  });

  test("Krish's Edge phone: the button inside the first screen passes", async () => {
    const r = await gateOn((p) => (p === '/' ? {status: 200, body: home({hero: 400})} : {status: 404}), '--pages', 'home', '--views', 'edge');
    assert.equal(r.code, 0, r.out);
  });

  test("Teeinblue's Add To Cart in Title Case fails; sentence case passes", async () => {
    const buyPage = (label) => page(`<main><div class="hs2"><div id="buy" data-hs2-artwork-kind="print" data-hs2-purchase-enabled="true"><h1>Your Dog's Portrait</h1><span data-hs2-price>$119.00</span><div class="tee-form-actions"><div class="tee-form-action"><button type="button" class="tee-btn tee-btn--atc" id="teeAtcButton">${label}</button></div></div></div></div></main>`, "Your Dog's Portrait");
    const title = await gateOn((p) => (p === PORTRAIT ? {status: 200, body: buyPage('Add To Cart')} : {status: 404}), '--pages', 'portrait', '--views', 'desk');
    assert.equal(title.code, 1, title.out);
    assert.match(title.out, /not sentence case: Teeinblue's button reads "Add To Cart"/);
    const plain = await gateOn((p) => (p === PORTRAIT ? {status: 200, body: buyPage('Add to cart')} : {status: 404}), '--pages', 'portrait', '--views', 'desk');
    assert.equal(plain.code, 0, plain.out);
  });

  test('a heading that leaves one word alone on its last line fails', async () => {
    // monospace 32px is about 19px a character, so 200px holds "Your dog / loves you / too.";
    // at 16px the whole line fits
    const h = (width, size) => home({hero: 100}).replace('<div style="height:100px"></div>', `<h1 class="hs3-hero__h" style="width:${width}px;font:${size}px/1.2 monospace;margin:0">Your dog loves you too.</h1>`);
    const alone = await gateOn((p) => (p === '/' ? {status: 200, body: h(200, 32)} : {status: 404}), '--pages', 'home', '--views', 'phone');
    assert.equal(alone.code, 1, alone.out);
    assert.match(alone.out, /one word alone: "too\." on the last line of h1\.hs3-hero__h/);
    const one = await gateOn((p) => (p === '/' ? {status: 200, body: h(360, 16)} : {status: 404}), '--pages', 'home', '--views', 'phone');
    assert.equal(one.code, 0, one.out);
  });

  // review of #65: at the desk size the blanket's title reads "Your Dog's / Personality / Blanket",
  // because "Personality Blanket" is wider than its column, so no wrap can keep "Blanket" company.
  // The title is Shopify's: that passes. A title whose last word could have shared the line above
  // still fails, and our own heading fails on a lone word either way. At 300px "Personality
  // Blanket" (19 characters, about 365px) cannot share a line; at 450px "Illustrated Mug" can.
  test("a product title's lone last word fails only when it could have shared the line above", async () => {
    const [mug, , blanket] = CORE;
    const titled = (item, width) => page(`<main><div class="hs2"><div id="buy"${Object.entries(item.marker).map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${v}"`)).join('')}><h1 style="width:${width}px;font:32px/1.2 monospace;margin:0">${item.title}</h1><span data-hs2-price>${item.price}</span></div></div></main>`, item.title);
    const forced = await gateOn((p) => (p === blanket.path ? {status: 200, body: titled(blanket, 300)} : {status: 404}), '--pages', 'blanket', '--views', 'desk');
    assert.equal(forced.code, 0, forced.out);
    assert.match(forced.out, /all clear/);
    const avoidable = await gateOn((p) => (p === mug.path ? {status: 200, body: titled(mug, 450)} : {status: 404}), '--pages', 'mug', '--views', 'desk');
    assert.equal(avoidable.code, 1, avoidable.out);
    assert.match(avoidable.out, /one word alone: "Mug" on the last line of h1 "Your Dog's Illustrated Mug"/);
    const ours = home({hero: 100}).replace('<div style="height:100px"></div>', '<h1 class="hs3-hero__h" style="width:300px;font:32px/1.2 monospace;margin:0">Make a personality blanket</h1>');
    const own = await gateOn((p) => (p === '/' ? {status: 200, body: ours} : {status: 404}), '--pages', 'home', '--views', 'desk');
    assert.equal(own.code, 1, own.out);
    assert.match(own.out, /one word alone: "blanket" on the last line of h1\.hs3-hero__h/);
  });

  test("Teeinblue's Personalize bar fixed over the page fails", async () => {
    const bar = '<div class="tee-btn-wrapper--personalize" style="position:fixed;left:0;right:0;bottom:0;height:64px;background:#fbf6f1"><button type="button" class="tee-btn tee-btn--personalize">Personalize</button></div>';
    const r = await gateOn((p) => (p === PORTRAIT ? {status: 200, body: portraitPage().replace('</h1>', '</h1><div style="height:780px"></div><p>Free US shipping on every order.</p>').replace('</main>', `</main>${bar}`)} : {status: 404}), '--pages', 'portrait', '--views', 'desk');
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /covered: div\.tee-btn-wrapper--personalize "Personalize" is fixed over p "Free US shipping on every order\."/);
  });

  test("on a copy (--query preview_theme_id=...) Shopify's preview bar is hidden, so it covers nothing", async () => {
    const bar = '<div id="PBarNextFrameWrapper" style="position:fixed;left:0;right:0;bottom:0;height:120px;background:#333"></div>';
    // the button sits at about 758 to 780px of an 844px phone screen, under a 120px bar
    const site = (p) => (p === '/' ? {status: 200, body: home({hero: 750}).replace('</main>', `</main>${bar}`)} : {status: 404});
    const copy = await gateOn(site, '--pages', 'home', '--views', 'phone', '--query', 'preview_theme_id=123456');
    assert.equal(copy.code, 0, copy.out);
    assert.doesNotMatch(copy.out, /123456/, 'never the theme id');
    const shown = await gateOn(site, '--pages', 'home', '--views', 'phone');
    assert.equal(shown.code, 1, shown.out);
    assert.match(shown.out, /covered: div "" is fixed over button\.hs3-btn "Start with your dog"/);
  });

  test('an unknown view is refused, not skipped into all clear', async () => {
    const r = await gateOn(() => ({status: 404}), '--pages', 'home', '--views', 'nope');
    assert.equal(r.code, 1, r.out);
    assert.doesNotMatch(r.out, /all clear/);
  });
});

// preview-acceptance.mjs, the CoWork gate, against the same kind of stand-in store
const acceptance = path.join(here, 'preview-acceptance.mjs');
async function acceptanceOn(site, ...args) {
  const server = http.createServer((req, res) => {
    seen.push(req.headers.host);
    const r = site(new URL(req.url, 'http://x').pathname);
    res.writeHead(r.status, {'content-type': 'text/html; charset=utf-8', ...(r.headers || {})});
    res.end(r.body || '');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    return await new Promise((resolve) => execFile(process.execPath, [acceptance, '--base', `http://127.0.0.1:${server.address().port}`, '--settle', '200', ...args], {timeout: 180000}, (err, stdout, stderr) => resolve({code: err ? err.code : 0, out: stdout + stderr})));
  } finally { server.close(); }
}
// a product page with a main photo and Teeinblue's photo input, so the gate never waits for them
const bare = (item) => page(`<main><div id="buy"><h1>${item.title}</h1><img data-hs2-main alt="Example design" width="10" height="10" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="><input type="file" id="tee-photo-1"></div></main>`, item.title);

describe('preview-acceptance against a stand-in store', {concurrency: 3}, () => {
  test('a product address that 301s to the draft handle fails, and the other products are still checked', async () => {
    const site = (p) => {
      if (p === PORTRAIT) return {status: 301, headers: {location: DRAFT}};
      if (p === DRAFT) return {status: 200, body: bare(CORE[1])};
      const item = CORE.find((c) => c.path === p);
      return item ? {status: 200, body: bare(item)} : {status: 404};
    };
    const r = await acceptanceOn(site, '--parts', 'products', '--views', 'desk');
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL desk  portrait: \/products\/your-dogs-portrait answers at its own address: moved: \/products\/your-dogs-portrait now lands on \/products\/heartside-city-screenprint-draft-2026-10-23/);
    assert.match(r.out, /ok   desk  mug: \/products\/your-dogs-illustrated-mug answers at its own address/);
    assert.match(r.out, /ok   desk  blanket: \/products\/your-dogs-personality-blanket answers at its own address/, 'a broken portrait does not hide the blanket');
    assert.doesNotMatch(r.out, /127\.0\.0\.1/);
  });

  test('a Cloudflare challenge is inconclusive: exit 2, never all clear', async () => {
    const r = await acceptanceOn(() => ({status: 403, headers: {'cf-mitigated': 'challenge'}, body: page('Checking your browser', 'Just a moment...')}), '--views', 'desk');
    assert.equal(r.code, 2, r.out);
    assert.match(r.out, /inconclusive/);
    assert.doesNotMatch(r.out, /all clear/);
  });

  test("Krish's Edge phone: Start with your dog must end inside the first screen", async () => {
    const low = await acceptanceOn((p) => (p === '/' ? {status: 200, body: home({hero: 700})} : {status: 404}), '--parts', 'home', '--views', 'edge');
    assert.match(low.out, /FAIL edge  home: Start with your dog ends inside the first screen: ends at \d+px in a 640px window/);
    const high = await acceptanceOn((p) => (p === '/' ? {status: 200, body: home({hero: 400})} : {status: 404}), '--parts', 'home', '--views', 'edge');
    assert.match(high.out, /ok   edge  home: Start with your dog ends inside the first screen/);
  });
});

test('landed(): another path or host fails, a query or cookie hop does not', () => {
  assert.equal(landed('https://s.test/products/a', 'https://s.test/products/a?preview_theme_id=1', true), '');
  assert.equal(landed('/products/a', 'https://s.test/products/a/'), '');
  assert.match(landed('https://s.test/products/a', 'https://s.test/products/b', true), /^moved: \/products\/a now lands on \/products\/b/);
  assert.equal(landed('https://s.test/products/a', 'https://other.test/products/a'), 'moved: /products/a now lands on another host');
});

test('the Edge view is 360x640 with an Android Edge user agent', () => {
  assert.deepEqual([EDGE.width, EDGE.height, EDGE.mobile], [360, 640, true]);
  assert.match(EDGE.ua, /Android/); assert.match(EDGE.ua, /EdgA\//);
});

// a throwaway CA made for this test (public certificate only), standing in for a proxy's CA
const TEST_CA = `-----BEGIN CERTIFICATE-----
MIIB3TCCAYOgAwIBAgIUamX8RHWCyXVCYqnTiAq6lRsI1PUwCgYIKoZIzj0EAwIw
QzEnMCUGA1UEAwweSGVhcnRzaWRlIHRlc3QgaW50ZXJjZXB0aW9uIENBMRgwFgYD
VQQKDA9IZWFydHNpZGUgdGVzdHMwIBcNMjYxMDI4MTYzNzQ3WhgPMjEyNjEwMDQx
NjM3NDdaMEMxJzAlBgNVBAMMHkhlYXJ0c2lkZSB0ZXN0IGludGVyY2VwdGlvbiBD
QTEYMBYGA1UECgwPSGVhcnRzaWRlIHRlc3RzMFkwEwYHKoZIzj0CAQYIKoZIzj0D
AQcDQgAEh+KRav2ujqamXmybIXjM0AwL5GVZhp/ybZcj6bSO4vmv2WQRrn8556dJ
Y8dm3Pk1NadF8XurL5l3xyXoeY6TOKNTMFEwHQYDVR0OBBYEFJrhVlCchH4Hq8el
ZF8/1G1KoJbTMB8GA1UdIwQYMBaAFJrhVlCchH4Hq8elZF8/1G1KoJbTMA8GA1Ud
EwEB/wQFMAMBAf8wCgYIKoZIzj0EAwIDSAAwRQIgSNUGHOUgyekXufMKjZ3Jj8/7
NTK4L4boRcX8fzrYy6wCIQDx8P3dM0CMLrpYlx6b/AOdV5W69/yQZRYI2Rf0WLKu
og==
-----END CERTIFICATE-----`;
// and a leaf certificate, which is never a CA to pin
const TEST_LEAF = `-----BEGIN CERTIFICATE-----
MIIBkDCCATagAwIBAgIUFsDiiBDlSjsBNO/kMYjDFmr50bwwCgYIKoZIzj0EAwIw
HjEcMBoGA1UEAwwTSGVhcnRzaWRlIHRlc3QgbGVhZjAgFw0yNjEwMjgxNjM3NDda
GA8yMTI2MTAwNDE2Mzc0N1owHjEcMBoGA1UEAwwTSGVhcnRzaWRlIHRlc3QgbGVh
ZjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABKmTdrrWjWIxDDbxpTkWLa3e9igM
8ZZhmdXMCR+Ex1UIakmCJRkRD6VIbvR8jecfc1PxIxHpk5TrR0dPzDwzuqqjUDBO
MB0GA1UdDgQWBBQbV7F+ohYeKUE198UQqqWBntZ69zAfBgNVHSMEGDAWgBQbV7F+
ohYeKUE198UQqqWBntZ69zAMBgNVHRMBAf8EAjAAMAoGCCqGSM49BAMCA0gAMEUC
IGIn5FQv0v63R2T3bbEXSXJYuRts6v4NLZZftKJ1SjgSAiEAhf2KuDTP9jANoqFy
TFWKhcIcaZQjHOSWMJIujZWl0jI=
-----END CERTIFICATE-----`;

test('certificate pins come from the CA bundle at launch: its own CAs only, never a public root or a leaf', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-pins-'));
  try {
    const mixed = path.join(dir, 'mixed.crt'), roots = path.join(dir, 'roots.crt');
    fs.writeFileSync(mixed, [tls.rootCertificates[0], TEST_CA, TEST_LEAF, TEST_CA].join('\n'));
    fs.writeFileSync(roots, tls.rootCertificates.slice(0, 3).join('\n'));
    assert.deepEqual(interceptionPins(mixed), [spkiPin(TEST_CA)], 'the bundle CA, once');
    assert.deepEqual(interceptionPins(roots), [], 'public roots are not pinned');
    assert.deepEqual(interceptionPins(''), []);
    assert.equal(bundlePath({NODE_EXTRA_CA_CERTS: mixed}), mixed);
    const args = launchArgs(interceptionPins(mixed));
    assert.ok(args.includes('--ignore-certificate-errors-spki-list=' + spkiPin(TEST_CA)));
    assert.ok(args.includes('--disable-blink-features=AutomationControlled'));
    assert.ok(!launchArgs([]).some((a) => a.startsWith('--ignore-certificate-errors-spki-list')), 'no bundle CA, no flag');
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

// live-gate's Title Case and fixed-bar checks are written against what the live product pages
// draw; local previews (render.mjs, which CI now runs with chat.mjs) must draw the same, or the
// theme's fixes for them could never be seen before a push
test("render.mjs runs, and its Teeinblue stand-in draws the live page's Preview, Add To Cart and Personalize bar", async () => {
  const r = await new Promise((resolve) => execFile(process.execPath, [path.join(here, 'render.mjs')], {timeout: 120000}, (err, stdout, stderr) => resolve({code: err ? err.code : 0, out: stdout + stderr})));
  assert.equal(r.code, 0, r.out);
  for (const name of ['product-mug-native.html', 'product-portrait-native.html', 'product-blanket-native.html']) {
    const html = fs.readFileSync(path.join(here, 'out', name), 'utf8');
    assert.match(html, /<button type="button" class="tee-btn tee-btn--atc" id="teeAtcButton">Add To Cart<\/button>/, name);
    assert.match(html, /<button type="button" class="tee-btn tee-btn--preview">Preview<\/button>/, name);
    assert.match(html, /<div class="tee-btn-wrapper--personalize"><button type="button" class="tee-btn tee-btn--personalize"[^>]*>Personalize<\/button><\/div>/, name);
    assert.match(html, /@media \(max-width:749px\)\{\.tee-btn-wrapper--personalize\{display:block;position:fixed/, `${name}: fixed to the bottom of a phone screen`);
  }
});

// review of #65: the gate's default run (the desk view) failed the healthy blanket page on its
// title, so CoWork's gates could never be all clear. Here the page render.mjs draws, with the
// theme's own hs2.css and Fraunces, is served at the blanket's clean address, from a copy taken
// first, since other test files render into out/ at the same time.
test('the rendered blanket page is all clear at the desk size, its title broken before "Blanket" as it must be', async () => {
  const out = path.join(here, 'out'), blanket = CORE.find((c) => c.key === 'blanket');
  if (!fs.existsSync(path.join(out, 'product-blanket-native.html'))) await new Promise((resolve) => execFile(process.execPath, [path.join(here, 'render.mjs')], {timeout: 120000}, resolve));
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-blanket-'));
  try {
    fs.copyFileSync(path.join(out, 'product-blanket-native.html'), path.join(copy, 'page.html'));
    fs.cpSync(path.join(out, 'assets'), path.join(copy, 'assets'), {recursive: true});
    const types = {'.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2'};
    const r = await gateOn((p) => {
      if (p === blanket.path) return {status: 200, body: fs.readFileSync(path.join(copy, 'page.html'))};
      const file = p.includes('/assets/') ? path.join(copy, p.slice(p.indexOf('/assets/') + 1)) : '';
      return file && fs.existsSync(file) ? {status: 200, headers: {'content-type': types[path.extname(file)] || 'application/octet-stream'}, body: fs.readFileSync(file)} : {status: 404};
    }, '--pages', 'blanket', '--views', 'desk');
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /ok {3}desk blanket/);
    assert.match(r.out, /all clear/);
  } finally { fs.rmSync(copy, {recursive: true, force: true}); }
});

test('neither gate carries its own pinned certificate list: both launch through browser.mjs', () => {
  for (const f of ['live-gate.mjs', 'preview-acceptance.mjs']) {
    const src = fs.readFileSync(path.join(here, f), 'utf8');
    assert.doesNotMatch(src, /ignore-certificate-errors-spki-list=/, f);
    assert.doesNotMatch(src, /[A-Za-z0-9+/]{43}=/, `${f}: no hard-coded SPKI hash`);
    assert.match(src, /from '\.\/browser\.mjs'/, f);
    assert.match(src, /from '\.\/catalog\.mjs'/, f);
    assert.match(src, /edge: EDGE/, `${f}: Krish's Edge view`);
  }
});

// The add-on label can span DOM lines; only that exact label exempts $29.
test('Artist touch price split over lines passes but a retired $29 gift price fails', async () => {
  const withCopy = (copy) => portraitPage().replace('</main>', copy + '</main>');
  const addon = await gateOn((p) => p === PORTRAIT ? {status: 200, body: withCopy('<p>Artist’s touch,<br>$29.00</p>')} : {status: 404}, '--pages', 'portrait', '--views', 'desk');
  assert.equal(addon.code, 0, addon.out);
  const retired = await gateOn((p) => p === PORTRAIT ? {status: 200, body: withCopy('<p>Your gift: $29.00</p>')} : {status: 404}, '--pages', 'portrait', '--views', 'desk');
  assert.equal(retired.code, 1, retired.out);
});
