// The first screen, the chat, Buddy's pick and the choice as they lay out (28 Oct acceptance:
// Krish's Edge phone at 360x640, then 390x844 and 1280x900). The real hs3-chat section rendered
// with liquidjs, the real hs-brand.css, hs2.css and hs3.css and the real hs3.js (source and
// minified) in Chromium. Helio's memo strip and sticky header are stand-ins at their live sizes
// (32px and 66px, the header drawn as an overlay), and hs2.js's own clearHeader and stickyHead
// place the page under them as on the store. Nothing leaves localhost and the AI is off.
//
//   node --test tools/preview/hs3-layout.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';
import {chromium} from 'playwright';
import {Liquid} from 'liquidjs';
import {transformSync} from 'esbuild';

const root = new URL('../../', import.meta.url);
const text = p => readFileSync(new URL(p, root), 'utf8');
const hs3 = text('shopify/assets/hs3.js');
const hs2 = text('shopify/assets/hs2.js');
const slice = (src, name) => { const i = src.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return src.slice(i, src.indexOf('\n  function ', i + 1)); };

// ------------------------------------------------------------- the section, as Shopify renders it
const SCHEMA = /{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/;
const source = text('shopify/sections/hs3-chat.liquid');
const schema = JSON.parse(source.match(SCHEMA)[1]);
const index = JSON.parse(text('shopify/templates/index.json').replace(/^\s*\/\*[\s\S]*?\*\//, ''));
const engine = new Liquid({strictFilters: true});
const money = c => '$' + (Number(c) / 100).toFixed(2);
const attr = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
for (const [name, fn] of Object.entries({
  asset_url: n => '/assets/' + n,
  image_url: m => (typeof m === 'string' ? m : m && m.src),
  image_tag: (src, ...args) => `<img src="${src}" ${args.filter(Array.isArray).map(([k, v]) => `${k}="${attr(v)}"`).join(' ')}>`,
  money,
  money_without_trailing_zeros: c => money(c).replace(/\.00$/, ''),
  stylesheet_tag: h => `<link rel="stylesheet" href="${h}">`,
  json: v => JSON.stringify(v ?? null),
  default_errors: e => String(e || ''),
})) engine.registerFilter(name, fn);
engine.registerTag('form', {
  parse(token, remain) {
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain).on('tag:endform', () => stream.stop()).on('template', t => this.tpls.push(t)).on('end', () => { throw new Error('form not closed'); });
    stream.start();
  },
  * render(ctx, emitter) {
    ctx.push({form: {posted_successfully: false, errors: false}});
    const html = yield this.liquid.renderer.renderTemplates(this.tpls, ctx);
    ctx.pop();
    emitter.write(`<form method="post" action="/contact" onsubmit="return false">${html}</form>`);
  },
});
// today's catalog (render.mjs): the mug in five colors with a handle-left and handle-right photo
// each, the portrait unframed or framed, the word-free blanket after its blank reference
let id = 1;
const media = (src, alt) => ({id: id++, media_type: 'image', alt, src});
const COLORS = ['Black', 'Dark Blue', 'Dark Green', 'Pink', 'Red'];
const tint = c => (c === 'Pink' ? '' : '-' + c.toLowerCase().replace(/ /g, '-'));
const mugAlt = (c, side) => `Illustrated mug, ${c.toLowerCase()} inside: ${side} view. Example only; your artwork appears in the live preview.`;
const portraitAlt = f => `Example illustrated pug portrait in ${f}. Your portrait uses your dog's photo.`;
const prints = '/repo/design/shopify-images/gifts-2026-10-21/the-framed-print-';
const products = {
  'your-dogs-illustrated-mug': {handle: 'your-dogs-illustrated-mug', title: "Your Dog's Illustrated Mug", url: '/products/your-dogs-illustrated-mug', price_min: 4500, price_max: 4500, price_varies: false,
    variants: COLORS.map(c => ({id: id++, options: ["Your Dog's Illustrated Mug", c, '11 oz']})),
    media: COLORS.flatMap(c => [media(`/assets/hs-mug-dog-base${tint(c)}.webp`, mugAlt(c, 'handle-left')), media(`/assets/hs-mug-note-base${tint(c)}.webp`, mugAlt(c, 'handle-right'))])},
  'your-dogs-portrait': {handle: 'your-dogs-portrait', title: "Your Dog's Portrait", url: '/products/your-dogs-portrait', price_min: 5900, price_max: 11900, price_varies: true,
    variants: [['Framed', 'Black'], ['Framed', 'Red Oak'], ['Framed', 'White'], ['Unframed', 'Default']].map(o => ({id: id++, options: [...o, '12″×18″']})),
    media: [media(prints + 'white.jpg', portraitAlt('a white frame')), media(prints + 'black.jpg', portraitAlt('a black frame')), media(prints + 'red-oak.jpg', portraitAlt('a red oak frame')), media('/repo/tools/preview/fixtures/mock-portrait-unframed.svg', "Example unframed illustrated pug portrait. Your portrait uses your dog's photo.")]},
  'your-dogs-personality-blanket': {handle: 'your-dogs-personality-blanket', title: "Your Dog's Personality Blanket", url: '/products/your-dogs-personality-blanket', price_min: 12900, price_max: 12900, price_varies: false,
    variants: [{id: id++, options: ['Heartside Personality Blanket', 'Tan', '50″×60″']}],
    media: [media('/repo/tools/preview/fixtures/mock-blanket-blank.svg', 'Blank tan sherpa blanket reference. Your personalized artwork is shown in your cart.'), media('/repo/design/blanket/approved-direction-v2.png', "Example blanket design with an illustrated pug pattern. Your blanket uses your own dog's photo.")]},
};
// the homepage's own settings (templates/index.json) over the schema's defaults, with the AI off
const settings = {...Object.fromEntries(schema.settings.filter(s => 'default' in s).map(s => [s.id, s.default])), ...index.sections.gift.settings, ai_on: false, typed_url: '', compose_url: ''};
for (const k of ['product_mug', 'product_blanket', 'product_print', 'product_ornament']) settings[k] = products[settings[k]] || null;
const shop = {privacy_policy: {url: '/policies/privacy-policy'}, terms_of_service: {url: '/policies/terms-of-service'}, shipping_policy: {url: '/policies/shipping-policy'}, refund_policy: {url: '/policies/refund-policy'}};
const sectionHTML = await engine.parseAndRender(source.replace(SCHEMA, '').replace(/{%-?\s*render 'hs2-head'\s*-?%}/, '').replace(/{%-?\s*render 'hs-schema'[^%]*%}/, ''), {section: {id: 'template--gift', settings, blocks: []}, shop, request: {design_mode: false}});
// the fonts and stylesheets every Heartside page loads (snippets/hs2-head), with only the scripts the
// chat uses: the artwork profile, engine and choices (hs2.js itself is the product pages' script)
const head = (await engine.parseAndRender(text('shopify/snippets/hs2-head.liquid'), {}))
  .replace(/<script>[^<]*hs2-js[^<]*<\/script>/, '')
  .replace(/<script src="\/assets\/(?!hs-artwork-profile\.js|hs-artwork-engine\.js|hs-artwork-choices\.js)[^"]+"[^>]*><\/script>/g, '');
// Helio's memo strip (it scrolls away) and its header, sticky and drawn as an overlay, so the section
// box starts under the memo and hs2.js pads it clear of the header, 12px more, as on the store
const chrome = `<style>body{margin:0}#header-group{display:contents}</style><div id="header-group">
<div class="shopify-section shopify-section-group-header-group"><div style="height:32px;background:#1E1714;color:#FBF6F1;font:12px/32px monospace;letter-spacing:.1em;text-align:center" data-memo>FREE US SHIPPING ON EVERY ORDER.</div></div>
<header class="header-section shopify-section shopify-section-group-header-group" style="position:sticky;top:0;z-index:30;height:0"><header-component data-header style="display:block;position:absolute;left:0;right:0;top:0;height:66px;background:#FBF6F1;border-bottom:1px solid #E2D4C8"></header-component></header></div>`;
const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head><body>${chrome}
<main id="MainContent"><section id="shopify-section-template--gift" class="shopify-section hs3-section">${sectionHTML}</section></main>
<script>(function () {${slice(hs2, 'clearHeader')}\n${slice(hs2, 'stickyHead')}\nclearHeader(); stickyHead(); })();</script></body></html>`;

const TYPES = {css: 'text/css', js: 'text/javascript', woff2: 'font/woff2', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml'};
const SCRIPT = {source: hs3, minified: transformSync(hs3, {minify: true}).code};
function asset(path, mode) {
  const type = TYPES[path.split('.').pop()];
  if (path === '/assets/hs3.js') return {contentType: type, body: SCRIPT[mode]};
  const file = path.startsWith('/assets/') ? 'shopify/assets/' + path.slice(8) : /^\/repo\/(design|tools\/preview\/fixtures)\//.test(path) ? path.slice(6) : '';
  if (!file || !type || file.includes('..') || !existsSync(new URL(file, root))) return null;
  return {contentType: type, body: readFileSync(new URL(file, root))};
}

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });
async function open(mode, width, height, {reduced = true, init} = {}) {
  const context = await browser.newContext({viewport: {width, height}, isMobile: width < 1000, hasTouch: width < 1000, reducedMotion: reduced ? 'reduce' : 'no-preference'});
  const tab = await context.newPage(), errors = [], offsite = [];
  tab.on('pageerror', e => errors.push(String(e)));
  if (init) await tab.addInitScript(init);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost') { offsite.push(url.href); return route.abort(); }
    if (url.pathname === '/') return route.fulfill({contentType: 'text/html', body: PAGE});
    if (url.pathname === '/__blank') return route.fulfill({contentType: 'text/html', body: '<!doctype html><title>blank</title>'});
    const a = asset(url.pathname, mode);
    return a ? route.fulfill(a) : route.fulfill({status: 404, body: ''});
  });
  return {context, tab, errors, offsite};
}
// open a step with saved answers, then wait for the fonts and for the script's last redraw (the
// stored photo is looked up after the first one)
async function go(tab, state, step) {
  await tab.goto('http://localhost/__blank');
  await tab.evaluate(s => { sessionStorage.clear(); sessionStorage.setItem('hs3-gift', JSON.stringify(s)); }, state);
  await tab.goto('http://localhost/' + (step ? '?step=' + step : ''));
  await tab.waitForFunction(() => !!window.__hs3api);
  await tab.evaluate(() => document.fonts.ready);
  await settle(tab);
}
const settle = tab => tab.evaluate(() => new Promise(resolve => {
  const f = document.querySelector('.hs3__frame');
  let t;
  const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(done, 200); });
  function done() { mo.disconnect(); requestAnimationFrame(() => requestAnimationFrame(resolve)); }
  mo.observe(f, {childList: true, subtree: true, attributes: true});
  t = setTimeout(done, 200);
}));
// geometry helpers, put on the page once per load
const HELPERS = () => {
  const r = el => el.getBoundingClientRect();
  // the lines of an element's text, each a list of its words
  window.__lines = el => {
    const words = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode());) for (const m of n.data.matchAll(/\S+/g)) {
      const range = document.createRange(); range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length);
      for (const x of range.getClientRects()) if (x.width) words.push({w: m[0], top: x.top, bottom: x.bottom});
    }
    // a word starts a new line when its top steps down; a text box can be taller than a tight line
    // height, so the boxes of two lines overlap and only the step between their tops tells them apart
    const lines = [];
    for (const w of words) { const last = lines[lines.length - 1]; if (last && Math.abs(w.top - last.top) < 6) last.push(w.w); else lines.push(Object.assign([w.w], {top: w.top})); }
    return lines.map(l => [...l]);
  };
  window.__lineCount = el => window.__lines(el).length;
  window.__overlap = (a, b) => { const p = r(a), q = r(b); return Math.max(0, Math.min(p.right, q.right) - Math.max(p.left, q.left)) * Math.max(0, Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top)); };
  window.__inside = (a, b, slack = 1) => { const p = r(a), q = r(b); return p.left >= q.left - slack && p.right <= q.right + slack && p.top >= q.top - slack && p.bottom <= q.bottom + slack; };
  // a box where layout put it, before any rotation
  window.__box = el => { let x = 0; for (let n = el; n; n = n.offsetParent) x += n.offsetLeft; return {left: x, right: x + el.offsetWidth}; };
  window.__visible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  window.__covered = el => { const p = r(el), hit = document.elementFromPoint((p.left + p.right) / 2, (p.top + p.bottom) / 2); return !(hit && (hit === el || el.contains(hit))); };
};
async function load(tab, state, step) { await go(tab, state, step); await tab.evaluate(HELPERS); }

const done = {dog: 'Bartholomew', rec: 'Maximiliana', pro: 'she', rel: 'partner', home: 'door', follow: 'weekends', spot: 'bed', together: 'walk', meaning: 'shadow'};
const blank = {home: null, follow: null, spot: null, together: null, meaning: null};
const PHONES = [[360, 640], [390, 844]];
const SIZES = [...PHONES, [1280, 900]];
const MODES = ['source', 'minified'];
// each test collects every problem it finds and fails once with the whole list
const checks = () => { const bad = []; return {bad, check: (ok, msg) => { if (!ok) bad.push(msg); }}; };

// ---------------------------------------------------------------- the keyboard (hs3.js keyboardRoom)
for (const mode of MODES) test(`${mode}: the page asks the browser to make room for the keyboard, once, and measures it where it can't`, () => {
  const code = mode === 'minified' ? transformSync(slice(hs3, 'keyboardRoom'), {minify: true}).code : slice(hs3, 'keyboardRoom');
  const on = {}, props = {};
  const meta = {content: 'width=device-width, initial-scale=1', getAttribute() { return this.content; }, setAttribute(n, v) { this.content = v; }};
  const vv = {height: 640, offsetTop: 0, scale: 1, addEventListener: (t, f) => { on[t] = f; }};
  const ctx = {document: {querySelector: s => (s === 'meta[name="viewport"]' ? meta : null), activeElement: null}, window: {innerHeight: 640, visualViewport: vv, addEventListener() {}}, root: {style: {setProperty: (k, v) => { props[k] = v; }}}, frame: {contains: () => false}};
  vm.runInNewContext(code + '\nkeyboardRoom();', ctx);
  assert.equal(meta.content, 'width=device-width, initial-scale=1, interactive-widget=resizes-content');
  vm.runInNewContext('keyboardRoom();', ctx);
  assert.equal(meta.content.match(/interactive-widget/g).length, 1, 'never written twice');
  vv.height = 340; on.resize();
  assert.equal(props['--hs3-kb'], '300px', 'a 300px keyboard over a page that did not shrink');
  vv.offsetTop = 120; on.scroll();
  assert.equal(props['--hs3-kb'], '180px', 'the visible part scrolled down: less of the page is covered');
  vv.scale = 2; on.resize();
  assert.equal(props['--hs3-kb'], '0px', 'pinch zoom is not a keyboard');
  // the field being typed in is brought into view, with the room CSS keeps under it for Next
  const field = {tagName: 'INPUT', scrollIntoView(o) { field.block = o && o.block; }};
  ctx.document.activeElement = field; ctx.frame.contains = () => true; vv.scale = 1; on.resize();
  assert.equal(field.block, 'nearest');
});

// ---------------------------------------------------------------- the first screen
for (const mode of MODES) test(`${mode}: the first screen: "Start with your dog" in view on every phone, before the gifts, with one line under it`, async () => {
  const {bad, check} = checks();
  // Krish's Edge phone shows about 631-647px, so the button must end by 560px at 360x640
  for (const [w, h, limit] of [[360, 640, 560], [390, 664, 664], [390, 844, 844], [1280, 900, 900]]) {
    const {context, tab, errors, offsite} = await open(mode, w, h);
    try {
      await load(tab, {}, '');
      const m = await tab.evaluate(() => {
        const start = document.querySelector('[data-hs3-start]'), fan = document.querySelector('.hs3-fan'), trust = document.querySelector('.hs3-hero .hs3-trust');
        const cd = document.querySelector('.hs3-hero [data-hs3-countdown]');
        return {bottom: start.getBoundingClientRect().bottom, covered: window.__covered(start), before: !!(start.compareDocumentPosition(fan) & Node.DOCUMENT_POSITION_FOLLOWING),
          trustUnder: trust.getBoundingClientRect().top - start.getBoundingClientRect().bottom, countdown: window.__visible(cd),
          heading: window.__lines(document.querySelector('.hs3-hero__h')), intro: window.__lines(document.querySelector('.hs3-hero__p')), wide: document.documentElement.scrollWidth - innerWidth};
      });
      check(m.bottom <= limit, `${w}x${h}: the button ends at ${Math.round(m.bottom)}px (by ${limit})`);
      check(m.covered === false, `${w}x${h}: nothing covers the button`);
      if (w < 1000) check(m.before, `${w}x${h}: the button is read before the gifts`);
      check(m.trustUnder >= 0 && m.trustUnder <= 16, `${w}x${h}: the trust line sits right under the button (${Math.round(m.trustUnder)}px)`);
      check(m.countdown === false, `${w}x${h}: one line under the button; the countdown is the memo strip's`);
      for (const [name, lines] of [['heading', m.heading], ['intro', m.intro]]) check(lines.length < 2 || lines.at(-1).length >= 2, `${w}x${h}: the ${name} ends on more than one word (${JSON.stringify(lines)})`);
      check(m.wide <= 0, `${w}x${h}: no sideways scroll`);
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await context.close(); }
  }
  assert.deepEqual(bad, []);
});

// ---------------------------------------------------------------- the chat
for (const mode of MODES) test(`${mode}: the chat opens on Buddy, with no peek or blank band before step 3 on a phone, and even rows of choices`, async () => {
  const {bad, check} = checks();
  for (const [w, h] of SIZES) {
    const {context, tab, errors, offsite} = await open(mode, w, h);
    try {
      for (const [name, st, step] of [['question 1', {}, 'dog'], ['question 2', {...done, ...blank}, 'person']]) {
        await load(tab, st, step);
        const m = await tab.evaluate(() => {
          const top = document.querySelector('.hs3-top'), says = document.querySelector('.hs3-says'), note = document.querySelector('.hs3-note-wrap');
          const next = document.querySelector('[data-hs3="next"]');
          const rows = {};
          for (const c of document.querySelectorAll('[data-hs3="rel"]')) { const t = Math.round(c.getBoundingClientRect().top); rows[t] = (rows[t] || 0) + 1; }
          return {note: window.__visible(note), gap: says.getBoundingClientRect().top - top.getBoundingClientRect().bottom, next: next.getBoundingClientRect().bottom, nextCovered: window.__covered(next),
            rows: Object.values(rows), chipLines: [...document.querySelectorAll('[data-hs3="rel"]')].map(c => window.__lineCount(c)),
            bubble: window.__lines(document.querySelector('.hs3-says .hs3-bubble')), wide: document.documentElement.scrollWidth - innerWidth};
        });
        if (w < 1000) {
          check(m.note === false, `${w}x${h} ${name}: no "What the dog is writing" peek yet`);
          check(m.gap <= 24, `${w}x${h} ${name}: Buddy is ${Math.round(m.gap)}px under the top bar (24 at most)`);
        } else check(m.note === true, `${w}x${h} ${name}: a wide screen keeps the note beside the chat`);
        check(m.next <= h && !m.nextCovered, `${w}x${h} ${name}: Next is in the first screen (ends at ${Math.round(m.next)}px)`);
        check(m.bubble.length < 2 || m.bubble.at(-1).length >= 2, `${w}x${h} ${name}: Buddy's line ends on more than one word (${JSON.stringify(m.bubble.at(-1))})`);
        if (name === 'question 2') {
          check(m.rows.length >= 1 && m.rows.every(n => n === m.rows[0] && n >= 2), `${w}x${h}: who the dog loves, in even rows (${m.rows.join(' + ')})`);
          check(m.chipLines.every(n => n === 1), `${w}x${h}: every choice on one line`);
        }
        check(m.wide <= 0, `${w}x${h} ${name}: no sideways scroll`);
      }
      // step 1 is the dog's name, then Next, then the optional breed and photo
      await load(tab, {}, 'dog');
      const order = await tab.evaluate(() => [...document.querySelectorAll('.hs3-dock > :not([data-hs3-name-hint])')].map(e => e.id || e.getAttribute('data-hs3') || e.className.split(' ')[0]).slice(0, 3));
      check(JSON.stringify(order) === JSON.stringify(['hs3-dog', 'next', 'hs3-breed']), `${w}x${h}: Next straight under the name field (${order.join(', ')})`);
      const hints = await tab.evaluate(() => [...document.querySelectorAll('#hs3-dog, #hs3-breed, #hs3-rec')].map(i => i.id + ':' + i.getAttribute('enterkeyhint')).join(' '));
      check(hints === 'hs3-dog:next hs3-breed:next', `${w}x${h}: the keyboard's Enter key says next (${hints})`);
      // the sticky Next's cream halo (a box-shadow spread) never reaches the fields beside it
      const edges = async sel => tab.evaluate(s => {
        const f = document.querySelector(s).getBoundingClientRect(), nx = document.querySelector('.hs3-dock > [data-hs3="next"]');
        const spread = Math.max(0, ...(getComputedStyle(nx).boxShadow.match(/-?[\d.]+px/g) || []).filter((_, i) => i % 4 === 3).map(parseFloat));
        const n = nx.getBoundingClientRect();
        return f.bottom <= n.top ? n.top - spread - f.bottom : f.top - (n.bottom + spread);
      }, sel);
      for (const sel of ['#hs3-dog', '#hs3-breed']) { const gap = await edges(sel); check(gap >= 0, `${w}x${h}: Next's halo stays off ${sel} (${gap.toFixed(1)}px clear)`); }
      // a short step fits under the header without scrolling, so the memo strip is never cut (the 12px clear)
      await load(tab, {dog: 'Honey', pro: 'she'}, 'person');
      { const gap = await edges('#hs3-rec'); check(gap >= 0, `${w}x${h}: Next's halo stays off #hs3-rec (${gap.toFixed(1)}px clear)`); }
      await load(tab, {...done, ...blank}, 'home');
      const page = await tab.evaluate(() => ({height: document.documentElement.scrollHeight, memo: document.querySelector('[data-memo]').getBoundingClientRect().top}));
      if (w < 1000) check(page.height <= h, `${w}x${h}: question 3 needs no scrolling (${page.height}px of ${h})`);
      check(page.memo === 0, `${w}x${h}: the memo strip shows whole`);
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await context.close(); }
  }
  assert.deepEqual(bad, []);
});

// Next stays above the keyboard. Android's Chrome and Edge resize the page (interactive-widget,
// set by hs3.js): a shorter window. Safari only shrinks the visual viewport: a stand-in for it.
const FAKE_VV = () => {
  const target = new EventTarget(), st = {height: null, offsetTop: 0, scale: 1};
  for (const k of Object.keys(st)) Object.defineProperty(target, k, {get: () => (k === 'height' && st.height == null ? window.innerHeight : st[k])});
  Object.defineProperty(window, 'visualViewport', {configurable: true, get: () => target});
  window.__keyboard = h => { st.height = h; target.dispatchEvent(new Event('resize')); };
};
for (const mode of MODES) test(`${mode}: the keyboard never covers Next, or the field being typed in`, async () => {
  const {bad, check} = checks();
  for (const [kind, step, field] of [['android', 'dog', '#hs3-dog'], ['android', 'person', '#hs3-rec'], ['safari', 'dog', '#hs3-dog'], ['safari', 'person', '#hs3-rec']]) {
    const {context, tab, errors, offsite} = await open(mode, 360, 640, {init: kind === 'safari' ? FAKE_VV : undefined});
    try {
      await load(tab, step === 'dog' ? {} : {...done, ...blank}, step);
      const meta = await tab.getAttribute('meta[name="viewport"]', 'content');
      check(/interactive-widget=resizes-content/.test(meta), `${kind} ${step}: the page asks for room for the keyboard (${meta})`);
      await tab.focus(field);
      if (kind === 'android') await tab.setViewportSize({width: 360, height: 340});
      else await tab.evaluate(() => window.__keyboard(340));
      await tab.waitForTimeout(150);
      const m = await tab.evaluate(sel => {
        const f = document.querySelector(sel).getBoundingClientRect(), n = document.querySelector('[data-hs3="next"]').getBoundingClientRect();
        return {focused: document.activeElement === document.querySelector(sel), field: [f.top, f.bottom], next: [n.top, n.bottom]};
      }, field);
      const visible = 340, header = 66;
      check(m.focused, `${kind} ${step}: the field keeps the focus`);
      check(m.next[1] <= visible + 0.5 && m.next[0] >= header, `${kind} ${step}: Next is above the keyboard (${m.next.map(Math.round).join('-')} of ${visible})`);
      check(m.field[0] >= header && m.field[1] <= m.next[0] + 0.5, `${kind} ${step}: the field shows whole, above Next (field ${m.field.map(Math.round).join('-')}, Next ${m.next.map(Math.round).join('-')})`);
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await context.close(); }
  }
  assert.deepEqual(bad, []);
});

// Buddy's words arrive at 0.6 opacity or more, never a pale ghost
for (const mode of MODES) test(`${mode}: Buddy's line never starts as a ghost`, async () => {
  const {bad, check} = checks();
  const {context, tab, errors} = await open(mode, 360, 640, {reduced: false});
  try {
    await load(tab, {}, '');
    await tab.click('[data-hs3-start]');
    const m = await tab.evaluate(() => {
      const b = document.querySelector('.hs3-says .hs3-bubble'), anims = b.getAnimations();
      for (const a of anims) { a.pause(); a.currentTime = 0; }
      return {count: anims.length, start: Number(getComputedStyle(b).opacity)};
    });
    check(m.count >= 1, 'the bubble still eases in');
    check(m.start >= 0.6, `the first frame is at ${m.start} opacity`);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
  assert.deepEqual(bad, []);
});

// A new step scrolls to the top of the page: the memo strip, the header, then Back
for (const mode of MODES) test(`${mode}: moving on from a scrolled screen lands at the top, never Back under the sticky header`, async () => {
  const {bad, check} = checks();
  for (const [w, h] of [[360, 640], [1280, 900]]) {
    const {context, tab, errors} = await open(mode, w, h);
    try {
      await load(tab, done, 'gift-mug');
      await tab.evaluate(() => window.scrollTo(0, 500));
      await tab.click('[data-hs3="them"]');
      await tab.waitForFunction(() => document.querySelector('.hs3__frame').getAttribute('data-hs3-screen') === 'choose');
      await tab.waitForTimeout(100);
      await tab.evaluate(HELPERS);
      const m = await tab.evaluate(() => ({y: scrollY, memo: document.querySelector('[data-memo]').getBoundingClientRect().top, back: window.__covered(document.querySelector('[data-hs3="back"]')), backTop: document.querySelector('[data-hs3="back"]').getBoundingClientRect().top}));
      check(m.back === false, `${w}x${h}: Back is clear of the header (its top at ${Math.round(m.backTop)}px)`);
      check(m.memo === 0, `${w}x${h}: the memo strip shows whole (scrolled ${m.y}px)`);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
  assert.deepEqual(bad, []);
});

// ---------------------------------------------------------------- Buddy's pick
for (const mode of MODES) test(`${mode}: Buddy's pick: three equal tabs, each with its price, the art's labels inside it, one gutter, Buddy's pick said once`, async () => {
  const {bad, check} = checks();
  for (const [w, h] of SIZES) {
    const {context, tab, errors, offsite} = await open(mode, w, h);
    try {
      for (const [gift, st] of [['mug', done], ['blanket', done], ['portrait', {...done, together: 'car'}]]) {
        await load(tab, st, 'gift-' + gift);
        const m = await tab.evaluate(() => {
          const q = s => document.querySelector(s), all = s => [...document.querySelectorAll(s)];
          const tabs = q('.hs3-tabs'), tr = tabs.getBoundingClientRect(), pad = parseFloat(getComputedStyle(tabs).paddingRight);
          const list = all('.hs3-tab'), widths = list.map(t => t.getBoundingClientRect().width);
          const picks = all('.hs3-tab__pick'), pick = picks[0], pickTab = pick && pick.closest('.hs3-tab');
          const img = q('.hs3-product__img'), stamp = q('.hs3-product > .hs3-example'), label = q('.hs3-inset__label');
          const note = q('.hs3-note--print'), turn = q('.hs3-turn');
          const contentLeft = el => el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft);
          const backText = (() => { const r = document.createRange(); r.selectNodeContents(q('[data-hs3="back"]')); return r.getBoundingClientRect().left; })();
          return {
            gap: tr.right - pad - list.at(-1).getBoundingClientRect().right, widths, tags: all('.hs3-tab__tag').map(t => [t.textContent, window.__lineCount(t)]),
            picks: picks.length, pickLines: pick && window.__lineCount(pick), pickInView: pick && pick.getBoundingClientRect().left >= 0 && pick.getBoundingClientRect().right <= innerWidth,
            pickClear: pick ? [...pickTab.querySelectorAll('span:not(.hs3-tab__pick), svg')].every(x => window.__overlap(pick, x) <= 1) : false,
            stampTabs: window.__overlap(stamp, tabs), stampIn: window.__inside(stamp, img, 6),
            labelIn: window.__inside(label, img, 2), labelNote: note ? window.__overlap(label, note) : 0, labelTurn: turn ? window.__overlap(label, turn) : 0,
            said: document.querySelector('.hs3__frame').innerText.split(/Buddy.s pick/i).length - 1,
            paint: window.__box(q('.hs3-paint')), note: note && window.__box(note),
            lefts: {back: backText, h2: contentLeft(q('.hs3-h2')), tabs: contentLeft(tabs), tone: q('.hs3-tone').getBoundingClientRect().left, dock: contentLeft(q('.hs3-dock'))},
            h2: window.__lines(q('.hs3-h2')), names: all('.hs3-h2 .hs3-nm').map(n => window.__lineCount(n)),
            wide: document.documentElement.scrollWidth - innerWidth,
          };
        });
        const at = `${w}x${h} ${gift}`;
        check(Math.abs(m.gap) <= 1, `${at}: the tabs fill the row (${m.gap.toFixed(1)}px short)`);
        check(Math.max(...m.widths) - Math.min(...m.widths) <= 1, `${at}: the tabs are equal (${m.widths.map(Math.round).join(', ')})`);
        check(m.tags.every(([t, n]) => /\$\d/.test(t) && n === 1), `${at}: every tab shows its price on one line (${JSON.stringify(m.tags)})`);
        check(m.picks === 1 && m.pickLines === 1 && m.pickInView && m.pickClear, `${at}: one Buddy's pick badge, on one line, clear of its tab's words`);
        check(m.stampTabs <= 1 && m.stampIn, `${at}: the Example stamp sits inside the art, off the tabs`);
        check(m.labelIn && m.labelNote <= 1 && m.labelTurn <= 1, `${at}: "Your photo" sits inside the art, clear of the note and Turn the mug`);
        check(m.said === 1, `${at}: Buddy's pick is said once, on its tab, not again in the top bar (${m.said})`);
        if (w < 1000) {
          check(m.paint.left >= 15 && m.paint.right <= w - 15, `${at}: What I'll paint keeps the gutter (${m.paint.left}-${m.paint.right})`);
          if (m.note) check(m.note.left >= 15 && m.note.right <= w - 15, `${at}: the note keeps the gutter (${m.note.left}-${m.note.right})`);
          const lefts = Object.values(m.lefts);
          check(Math.max(...lefts) - Math.min(...lefts) <= 1, `${at}: one left edge (${JSON.stringify(m.lefts)})`);
        }
        check(m.h2.length < 2 || m.h2.at(-1).length >= 2, `${at}: the heading ends on more than one word (${JSON.stringify(m.h2)})`);
        check(m.names.length === 2 && m.names.every(n => n === 1), `${at}: each name in the heading on one line`);
        check(m.wide <= 0, `${at}: no sideways scroll`);
      }
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await context.close(); }
  }
  assert.deepEqual(bad, []);
});

// ---------------------------------------------------------------- names in Buddy's words
for (const mode of MODES) test(`${mode}: chat: a hyphenated name stays whole in Buddy's question and on the chips`, async () => {
  const {bad, check} = checks();
  for (const [w, h] of SIZES) {
    const {context, tab, errors, offsite} = await open(mode, w, h);
    try {
      await load(tab, {...done, ...blank, dog: 'Honey', rec: 'Jo-anne'}, 'home');
      const m = await tab.evaluate(() => {
        const cut = el => { const out = []; const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n; (n = walk.nextNode());) { let at = -1; while ((at = n.data.indexOf('Jo-anne', at + 1)) !== -1) { const range = document.createRange(); range.setStart(n, at); range.setEnd(n, at + 7); out.push(new Set([...range.getClientRects()].filter(x => x.width).map(x => Math.round(x.top))).size); } }
          return out; };
        return {bubble: cut(document.querySelector('.hs3-bubble')), chips: [...document.querySelectorAll('[data-hs3="chip"]')].flatMap(cut), wide: document.documentElement.scrollWidth - innerWidth};
      });
      check(m.bubble.length >= 1 && m.bubble.every(n => n === 1), `${w}x${h}: "Jo-anne" is whole in the question (${JSON.stringify(m.bubble)})`);
      check(m.chips.every(n => n === 1), `${w}x${h}: "Jo-anne" is whole on every chip (${JSON.stringify(m.chips)})`);
      check(m.wide <= 0, `${w}x${h}: no sideways scroll`);
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await context.close(); }
  }
  assert.deepEqual(bad, []);
});

// ---------------------------------------------------------------- choosing
for (const mode of MODES) test(`${mode}: choosing: Buddy's pick over a name that never wraps, prices clear, the button in view at 360`, async () => {
  const {bad, check} = checks();
  // 375x812 is the size order 4 was recorded at, where the heading split "Jo-" / "anne"
  for (const [w, h] of [...SIZES, [375, 812]]) {
    const {context, tab, errors, offsite} = await open(mode, w, h);
    try {
      for (const [name, st] of [['mug pick', {...done, sel: {mug: true, blanket: true, print: true}}], ['portrait pick', {...done, dog: 'Pickle', rec: 'Jo-anne', together: 'car', sel: {print: true}}], ['hyphen', {...done, dog: 'PICKLE', rec: 'Jo-anne', sel: {mug: true}}]]) {
        await load(tab, st, 'choose');
        const m = await tab.evaluate(rec => {
          const all = s => [...document.querySelectorAll(s)], add = document.querySelector('[data-hs3="add"]'), r = add.getBoundingClientRect();
          // the person's name in the heading, wherever the markup puts it: on how many lines?
          const h2 = document.querySelector('.hs3-h2'), walk = document.createTreeWalker(h2, NodeFilter.SHOW_TEXT);
          let recLines = 0;
          for (let n; (n = walk.nextNode());) {
            const at = n.data.indexOf(rec);
            if (at === -1) continue;
            const range = document.createRange(); range.setStart(n, at); range.setEnd(n, at + rec.length);
            recLines = new Set([...range.getClientRects()].filter(x => x.width).map(x => Math.round(x.top))).size;
          }
          return {
            rows: all('.hs3-opt').map(o => {
              const nm = o.querySelector('.hs3-opt__name'), price = o.querySelector('.hs3-opt__price'), pick = o.querySelector('.hs3-opt__pick');
              return {name: nm.textContent, lines: window.__lineCount(nm), clear: nm.getBoundingClientRect().right <= price.getBoundingClientRect().left + 0.5,
                pick: pick ? {lines: window.__lineCount(pick), above: pick.getBoundingClientRect().bottom <= nm.getBoundingClientRect().top + 1, price: window.__overlap(pick, price)} : null};
            }),
            add: [r.top, r.bottom], covered: window.__covered(add), names: all('.hs3-h2 .hs3-nm').map(n => [n.textContent, window.__lineCount(n)]), h2: window.__lines(h2), recLines,
            mid: (() => { const a = document.querySelector('.hs3-top').getBoundingClientRect(), b = document.querySelector('.hs3-top > :nth-child(2)').getBoundingClientRect(); return (b.left + b.right) / 2 - (a.left + a.right) / 2; })(),
            wide: document.documentElement.scrollWidth - innerWidth,
          };
        }, st.rec);
        const at = `${w}x${h} ${name}`;
        for (const row of m.rows) {
          check(row.lines === 1, `${at}: "${row.name}" on one line`);
          check(row.clear, `${at}: "${row.name}" ends before its price`);
          if (row.pick) check(row.pick.lines === 1 && row.pick.above && row.pick.price <= 1, `${at}: Buddy's pick sits over "${row.name}", clear of the price`);
        }
        check(m.rows.filter(x => x.pick).length === 1, `${at}: one pick`);
        check(m.add[0] >= 66 && m.add[1] <= h && !m.covered, `${at}: the button is in the first screen and clear (${m.add.map(Math.round).join('-')})`);
        check(m.names.length === 2 && m.names.every(([, n]) => n === 1), `${at}: each name in the heading is kept whole (${JSON.stringify(m.names)})`);
        check(m.recLines === 1, `${at}: "${st.rec}" is on one line in the heading (${JSON.stringify(m.h2)})`);
        check(m.h2.length < 2 || m.h2.at(-1).length >= 2, `${at}: the heading ends on more than one word (${JSON.stringify(m.h2)})`);
        check(Math.abs(m.mid) <= 1, `${at}: the top bar is centered`);
        check(m.wide <= 0, `${at}: no sideways scroll`);
      }
      // scrolled to the end, the button settles in its place, above the fine print, with nothing over it
      await tab.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await tab.waitForTimeout(50);
      const end = await tab.evaluate(() => { const add = document.querySelector('[data-hs3="add"]'), promise = document.querySelector('.hs3-promise'); return {covered: window.__covered(add), overlap: window.__overlap(add, promise)}; });
      check(!end.covered && end.overlap <= 1, `${w}x${h}: at the end of the list the button sits clear of the shipping line`);
      // nor does its cream halo reach that line: every layer of its shadow, with its offset and blur (28 Oct review: a
      // fade above the button washed the line's last words out)
      const halo = await tab.evaluate(() => {
        const add = document.querySelector('[data-hs3="add"]'), a = add.getBoundingClientRect(), p = document.querySelector('.hs3-promise').getBoundingClientRect();
        const px = (getComputedStyle(add).boxShadow.match(/-?[\d.]+px/g) || []).map(parseFloat);
        let up = 0, down = 0;
        for (let i = 0; i + 3 < px.length; i += 4) { up = Math.max(up, px[i + 3] + px[i + 2] - px[i + 1]); down = Math.max(down, px[i + 3] + px[i + 2] + px[i + 1]); }
        return p.bottom <= a.top ? a.top - up - p.bottom : p.top - (a.bottom + down);
      });
      check(halo >= 0, `${w}x${h}: the button's halo stays off the shipping line (${halo.toFixed(1)}px clear)`);
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await context.close(); }
  }
  assert.deepEqual(bad, []);
});

// ---------------------------------------------------------------- the type floor
for (const mode of MODES) test(`${mode}: no words under 11px on these screens, apart from the printed mockups`, async () => {
  for (const [w, h] of [[360, 640], [1280, 900]]) {
    const {context, tab, errors} = await open(mode, w, h);
    try {
      const small = [];
      for (const [st, step] of [[{}, ''], [{}, 'dog'], [{...done, ...blank}, 'person'], [{...done, ...blank}, 'home'], [done, 'gift-mug'], [done, 'gift-blanket'], [{...done, together: 'car'}, 'gift-portrait'], [{...done, sel: {mug: true}}, 'choose']]) {
        await load(tab, st, step);
        small.push(...await tab.evaluate(where => [...document.querySelectorAll('.hs3 *')].filter(el =>
          [...el.childNodes].some(n => n.nodeType === 3 && n.data.trim()) && window.__visible(el) && !el.closest('.hs3-print, .hs3-blanket, .hs3-orn, .hs-art-choices') && parseFloat(getComputedStyle(el).fontSize) < 11)
          .map(el => `${where}: ${el.className || el.tagName} ${getComputedStyle(el).fontSize} "${el.textContent.trim().slice(0, 30)}"`), `${w}x${h} ${step || 'hero'}`));
      }
      assert.deepEqual(small, []);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});
