// The chat's own guards on what Buddy says and what the gift gets (28 Oct review of PR #65): a cross
// picked from the breed list keeps its parents and so its energy, a dog's name longer than the
// signature never gets past the first step (not even with the browser's Forward), the portrait's
// reason names no door the buyer never mentioned, an AI follow-up that names one is dropped, and an
// ellipsis prints as a sentence. The real hs3.js, hs-breeds.js and hs-artwork-engine.js; the AI is a
// fixture and nothing leaves localhost.
//
//   node --test tools/preview/chat-guards.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';

const asset = name => readFileSync(new URL('../../shopify/assets/' + name, import.meta.url), 'utf8');
const source = asset('hs3.js');
const breeds = asset('hs-breeds.js');
const engine = asset('hs-artwork-engine.js');
const instrumented = source.replace('// for tools/preview tests', `window.__guardTest = {
  reasonFor: function (g) { return reasonFor(g, names()); },
  invents: invents,
  configure: function (value) { cfg = value; }
}; // for tools/preview tests`);

// reply(body) is what the typed-answer webhook returns for one request
function fixture(code, reply = () => null) {
  const store = {};
  const window = {
    matchMedia: () => ({matches: false}), crypto: webcrypto,
    sessionStorage: {getItem: key => store[key] ?? null, setItem: (key, value) => { store[key] = value; }},
    fetch: async (url, options) => ({ok: true, json: async () => reply(JSON.parse(options.body))})
  };
  const document = {readyState: 'complete', querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, addEventListener() {}};
  const context = vm.createContext({window, document, URLSearchParams, TextEncoder, setTimeout: () => 1, clearTimeout() {}, console});
  vm.runInContext(breeds, context);
  vm.runInContext(engine, context);
  vm.runInContext(code, context);
  const api = window.__guardTest, hs3 = window.__hs3api, state = hs3.state();
  api.configure({ai: true, typedUrl: '/fixture-typed', artworkCandidates: true, corePurchase: true, gifts: {mug: {url: '/products/m', price: 45}, blanket: {url: '/products/b', price: 129}, print: {url: '/products/p', price: 59}}});
  Object.assign(state, {screen: 'chat', step: 2, dog: 'Pip', rec: 'Sam'});
  return {api, hs3, state, bridge: () => JSON.parse(store['hs2-review'] || '{}')};
}

for (const [mode, code] of [['source', instrumented], ['minified', transformSync(instrumented, {minify: true}).code]]) {
  // Ruling (Krish, 2026-10-28): a cross gets a breed energy only when both parents match; today
  // Maltipoo, Peekapoo and Pomsky
  test(mode + ': a cross picked from the breed list keeps its parents, so its energy matches the typed name', () => {
    const f = fixture(code);
    const energy = (breed, breedId) => { Object.assign(f.state, {breed, breedId}); f.hs3.route.act('rel', 'partner'); return f.bridge().hs3_energy; };
    for (const [name, id, want] of [['Maltipoo', 'maltipoo', 'devoted-close'], ['Peekapoo', 'peekapoo', 'devoted-close'], ['Pomsky', 'pomsky', 'cool-independent'], ['Labrador Retriever', 'labrador-retriever', 'eager-open'], ['Cavapoo', 'cavapoo', '']]) {
      assert.equal(energy(name, id), want, name + ' picked from the list');
      assert.equal(energy(name, ''), want, name + ' typed in full');
    }
  });

  test(mode + ': a dog name longer than the signature reaches no step after the first', () => {
    const f = fixture(code);
    Object.assign(f.state, {dog: 'Sir Reginald Barksworth', rec: 'Alex', home: 'door', follow: 'weekends', spot: 'bed', together: 'walk', meaning: 'best'});
    for (const r of ['person', 'home', 'spot', 'meaning', 'ready', 'choose']) assert.equal(f.hs3.route.clampRoute(r), 'dog', r);
    f.state.dog = 'Sir Reginald';
    assert.equal(f.hs3.route.clampRoute('person'), 'person'); assert.equal(f.hs3.route.clampRoute('ready'), 'ready');
    f.state.dog = "'";
    assert.equal(f.hs3.route.clampRoute('person'), 'dog', 'a stray apostrophe is no name');
  });

  test(mode + ': the portrait reason names no door, window or couch the buyer never mentioned', () => {
    const f = fixture(code);
    Object.assign(f.state, {dog: 'Pip', rec: 'Sam', rel: 'partner'});
    assert.equal(f.api.reasonFor('print'), 'For a wall at home, so Sam sees Pip every day.');
    assert.equal(f.api.invents(f.api.reasonFor('print'), 'Pip Sam'), false);
    f.state.rel = 'self';
    assert.equal(f.api.reasonFor('print'), 'For a wall at home, so you see Pip every day.');
  });

  test(mode + ': an AI follow-up whose question names something the buyer never said is no follow-up', async () => {
    const fu = (question, chips) => ({reaction: 'At the door every day, what a welcome.', line: 'I wait by the door for you every single day.', follow_up: {question, chips, lines: chips.map(() => null), replies: chips.map(() => null)}, flags: []});
    let f = fixture(code, () => fu("Does Honey hear Sam's car before the door opens?", ['Hears the car first', 'Only at the door', 'Every single time']));
    let r = await f.hs3.typedAnswer('home', 'What does Honey do when Sam comes home?', 'she waits by the door every single day', '');
    assert.equal(r.follow_up, null, 'a car the buyer never mentioned');
    f = fixture(code, () => fu('Does Honey grab a toy or a shoe for Sam?', ['Just waits', 'Every single time']));
    r = await f.hs3.typedAnswer('home', 'q', 'she waits by the door every single day', '');
    assert.equal(r.follow_up, null, 'a toy and a shoe the buyer never mentioned');
    f = fixture(code, () => fu('Is Honey at the door even on weekends?', ['Even weekends', 'Hears the car first', 'Every single time']));
    r = await f.hs3.typedAnswer('home', 'q', 'she waits by the door every single day', '');
    assert.equal(r.follow_up.question, 'Is Honey at the door even on weekends?', 'the door is the buyer\'s own');
    assert.deepEqual([...r.follow_up.chips], ['Even weekends', 'Every single time'], 'a chip naming the car goes, as in n8n');
  });

  test(mode + ': an ellipsis in an AI gift line prints as one period and a new sentence', async () => {
    const f = fixture(code, () => ({reaction: 'Window duty, the best kind.', line: 'I wait at the window... until your car pulls in.', follow_up: null, flags: []}));
    const r = await f.hs3.typedAnswer('home', 'q', 'waits at the window until my car pulls in', '');
    assert.equal(r.line, 'I wait at the window. Until your car pulls in.');
  });
}

// the first screen as hs3-chat.liquid draws it, reduced to what the script binds (as history-routing.test.mjs)
const config = {
  typedUrl: '', composeUrl: '', ai: false, artworkCandidates: true, blanketPurchase: false, corePurchase: true, ornamentBundle: false, bundleOffer: false,
  mug: {colors: [{name: 'Black', hex: '#050505', id: 11, left: '/m-left.png', right: '/m-right.png'}]},
  gifts: {
    mug: {url: '/products/fixture-mug', handle: 'fixture-mug', title: 'Mug', price: 45, priceMax: 45, images: [{src: '/m-right.png', alt: 'Example mug'}]},
    blanket: {url: '/products/fixture-blanket', handle: 'fixture-blanket', title: 'Blanket', price: 129, priceMax: 129, images: [{src: '/b.png', alt: 'Example blanket'}]},
    print: {url: '/products/fixture-portrait', handle: 'fixture-portrait', title: 'Portrait', price: 59, priceMax: 119, images: [{src: '/p.png', alt: 'Example portrait'}]},
    ornament: {url: null, handle: null, price: null}
  }
};
const page = js => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>
<div class="hs3" data-hs3><script type="application/json" data-hs3-config>${JSON.stringify(config)}</script>
<div class="hs3__frame" data-hs3-screen="hero"><div class="hs3-hero"><h1>Your dog loves you too.</h1>
<p data-hs3-resume hidden>Welcome back. <span data-hs3-resume-dog></span>'s answers are still here.</p>
<button type="button" data-hs3-start>Start with your dog</button>
<p data-hs3-resume hidden><button type="button" data-hs3-restart>Start over</button></p>
<p data-hs3-countdown hidden></p></div></div>
<p data-hs3-privacy hidden>Privacy note.</p></div>
<script src="/hs-breeds.js"></script><script src="/hs-artwork-engine.js"></script><script>${js}</script></body></html>`;
const step = tab => new URL(tab.url()).searchParams.get('step');
const stored = (tab, key) => tab.evaluate(k => JSON.parse(sessionStorage.getItem(k) || '{}'), key);

for (const minified of [false, true]) {
  test(`${minified ? 'minified' : 'source'}: the browser's Forward lands on the name, not past it, and a picked Maltipoo keeps its energy`, async () => {
    const browser = await chromium.launch();
    try {
      const tab = await (await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'})).newPage();
      const errors = [], offsite = [];
      tab.on('pageerror', e => errors.push(String(e)));
      const js = minified ? transformSync(source, {minify: true}).code : source;
      await tab.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname !== 'localhost') { offsite.push(url.href); return route.abort(); }
        if (url.pathname === '/') return route.fulfill({contentType: 'text/html', body: page(js)});
        if (url.pathname === '/hs-breeds.js') return route.fulfill({contentType: 'text/javascript; charset=utf-8', body: breeds});
        if (url.pathname === '/hs-artwork-engine.js') return route.fulfill({contentType: 'text/javascript; charset=utf-8', body: engine});
        return route.fulfill({status: 404, body: ''});
      });
      await tab.goto('http://localhost/');
      await tab.click('[data-hs3-start]');
      await tab.fill('#hs3-dog', 'Pip');
      // the type-ahead's main path: a few letters, then a tap on the cross
      await tab.fill('#hs3-breed', 'maltip');
      await tab.click('#hs3-breed-list [role=option]:has-text("Maltipoo")');
      assert.equal((await stored(tab, 'hs3-gift')).breedId, 'maltipoo');
      assert.equal((await stored(tab, 'hs2-review')).hs3_energy, 'devoted-close');
      await tab.click('[data-hs3="next"]');
      await tab.fill('#hs3-rec', 'Alex'); await tab.click('[data-hs3="next"]');
      assert.equal(step(tab), 'home');
      // the in-app Back twice, a name the signature cannot hold, then the browser's Forward
      await tab.click('[data-hs3="back"]'); await tab.waitForFunction(() => new URL(location.href).searchParams.get('step') === 'person');
      await tab.click('[data-hs3="back"]'); await tab.waitForFunction(() => new URL(location.href).searchParams.get('step') === 'dog');
      await tab.fill('#hs3-dog', 'Sir Reginald Barksworth');
      await tab.click('[data-hs3="next"]');
      assert.equal(step(tab), 'dog', 'Next waits');
      await tab.goForward(); await tab.waitForTimeout(250);
      assert.equal(step(tab), 'dog', 'Forward lands on the name');
      assert.equal(await tab.getAttribute('.hs3__frame', 'data-hs3-screen'), 'chat');
      assert.equal((await stored(tab, 'hs3-gift')).step, 1);
      assert.equal(await tab.isVisible('#hs3-dog'), true);
      assert.match(await tab.textContent('[data-hs3-name-hint="dog"]'), /is 23 letters\. 14 fit in "Love, …" on the gift\./);
      // a short form, and Next moves on with the name the gift will print
      await tab.click('[data-hs3="short"][data-v="Sir Reginald"]');
      await tab.click('[data-hs3="next"]');
      assert.equal(step(tab), 'person');
      assert.equal((await stored(tab, 'hs2-review')).dog, 'Sir Reginald');
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await browser.close(); }
  });
}
