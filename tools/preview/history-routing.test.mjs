// The chat as a real journey (27 Oct): every step has its own address, Back and Forward land on
// the step with its answer still there, a reload keeps the step, a stale link clamps to the
// furthest step the answers reach, and the first screen offers to pick up where the buyer left
// off. Real Chromium, the real hs3.js, a stand-in page; nothing leaves localhost and the AI is off.
//
//   node --test tools/preview/history-routing.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs3.js', import.meta.url), 'utf8');
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
// the first screen as hs3-chat.liquid draws it, reduced to what the script binds
const page = (js, pre = '') => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<script>if(/[?&]step=/.test(location.search)){document.documentElement.classList.add('hs3-routed');}</script>
<style>html.hs3-routed .hs3__frame[data-hs3-screen="hero"]{visibility:hidden}</style></head><body>
<header><a href="/" id="logo">Heartside</a></header>
<div class="hs3" data-hs3><script type="application/json" data-hs3-config>${JSON.stringify(config)}</script>
<div class="hs3__frame" data-hs3-screen="hero"><div class="hs3-hero"><h1>Your dog loves you too.</h1>
<p data-hs3-resume hidden>Welcome back. <span data-hs3-resume-dog></span>'s answers are still here.</p>
<button type="button" data-hs3-start>Start with your dog</button>
<p data-hs3-resume hidden><button type="button" data-hs3-restart>Start over</button></p>
<p data-hs3-countdown hidden></p></div></div>
<p data-hs3-privacy hidden>Privacy note.</p></div>
${pre ? `<script>${pre}</script>` : ''}<script>${js}</script></body></html>`;

async function open(minified, pre = '') {
  const browser = await chromium.launch();
  const context = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
  const tab = await context.newPage();
  const errors = [], offsite = [];
  tab.on('pageerror', e => errors.push(String(e)));
  const js = minified ? transformSync(source, {minify: true}).code : source;
  await tab.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost') { offsite.push(url.href); return route.abort(); }
    if (url.pathname === '/') return route.fulfill({contentType: 'text/html', body: page(js, pre)});
    return route.fulfill({status: 404, body: ''});
  });
  return {browser, tab, errors, offsite};
}
const step = tab => new URL(tab.url()).searchParams.get('step');
// history moves are same-document navigations; wait until the step they land on has drawn
async function move(tab, how, want) {
  await (how === 'back' ? tab.goBack() : tab.goForward());
  await tab.waitForFunction(w => new URL(location.href).searchParams.get('step') === w && document.querySelector('.hs3__frame').getAttribute('data-hs3-screen') === 'chat', want);
  await tab.waitForTimeout(30);
}
const screen = tab => tab.getAttribute('.hs3__frame', 'data-hs3-screen');
// the breed corpus as hs-breeds.js offers it (suggest returns at most n rows, "Mixed or not sure"
// last; lookup is exact), and the engine's energy rule, reduced to one breed
const BREEDS = `window.HSBreeds = {
  suggest: function (q, n) {
    var all = [{id: 'golden-retriever', name: 'Golden Retriever'}, {id: 'goldendoodle', name: 'Goldendoodle'}, {id: 'golden-mountain-dog', name: 'Golden Mountain Dog'}, {id: 'goldador', name: 'Goldador'}, {id: 'golden-cocker', name: 'Golden Cocker Retriever'}, {id: 'gordon-setter', name: 'Gordon Setter'}];
    q = String(q).toLowerCase().slice(0, 3);
    var out = all.filter(function (o) { return o.name.toLowerCase().indexOf(q) === 0; }).slice(0, n - 1);
    out.push({id: 'mixed-breed', name: 'Mixed or not sure'});
    return out;
  },
  lookup: function (t) {
    if (String(t).trim().toLowerCase() === 'golden retriever') return {id: 'golden-retriever', name: 'Golden Retriever', kind: 'breed', exact: true, tone: 'Retriever'};
    return {id: 'mixed-breed', name: 'Mixed Breed', kind: 'mixed', exact: false, tone: 'Parent Envelope'};
  }
};
window.HSArtworkEngine = {energyFor: function (r) { return r && r.exact === true && r.kind !== 'mixed' && r.id === 'golden-retriever' ? 'eager-open' : null; }};`;
const state = tab => tab.evaluate(() => JSON.parse(sessionStorage.getItem('hs3-gift')));
const pressed = (tab, v) => tab.getAttribute(`[data-hs3="chip"][data-v="${v}"]`, 'aria-pressed');

for (const minified of [false, true]) {
  test(`${minified ? 'minified' : 'source'}: every step has an address; Back, Forward and reload keep the answers`, async () => {
    const {browser, tab, errors, offsite} = await open(minified);
    try {
      await tab.goto('http://localhost/?utm_source=fixture');
      assert.equal(await screen(tab), 'hero'); assert.equal(step(tab), null);
      await tab.click('[data-hs3-start]');
      assert.equal(step(tab), 'dog'); assert.equal(new URL(tab.url()).searchParams.get('utm_source'), 'fixture', 'other parameters ride along');
      await tab.fill('#hs3-dog', 'Pip'); await tab.click('[data-hs3="next"]');
      assert.equal(step(tab), 'person');
      await tab.fill('#hs3-rec', 'Alex'); await tab.click('[data-hs3="next"]');
      assert.equal(step(tab), 'home');
      await tab.click('[data-hs3="chip"][data-v="door"]'); await tab.waitForSelector('[data-hs3="chip"][data-v="weekends"]');
      assert.equal(step(tab), 'home-more');
      await tab.click('[data-hs3="chip"][data-v="weekends"]');
      assert.equal(step(tab), 'spot');
      await tab.click('[data-hs3="chip"][data-v="bed"]');
      assert.equal(step(tab), 'together');

      // the browser's Back: the previous step, its answer pressed, nothing erased
      await move(tab, 'back', 'spot'); assert.equal(await pressed(tab, 'bed'), 'true');
      await move(tab, 'back', 'home-more'); assert.equal(await pressed(tab, 'weekends'), 'true');
      await move(tab, 'back', 'home'); assert.equal(await pressed(tab, 'door'), 'true');
      let s = await state(tab);
      assert.deepEqual([s.home, s.follow, s.spot], ['door', 'weekends', 'bed'], 'Back never erases an answer');
      await move(tab, 'forward', 'home-more');
      await move(tab, 'forward', 'spot');

      // a reload lands on the same step, never the first screen
      await tab.reload(); assert.equal(await screen(tab), 'chat'); assert.equal(step(tab), 'spot');
      assert.equal(await tab.evaluate(() => document.documentElement.classList.contains('hs3-routed')), false);
      assert.equal(await pressed(tab, 'bed'), 'true');

      // the in-app Back and an answered step's Next move without changing anything
      // the in-app Back goes through the browser's history, so wait for the step to draw
      await tab.click('[data-hs3="back"]'); await tab.waitForSelector('[data-hs3="chip"][data-v="weekends"]'); assert.equal(step(tab), 'home-more');
      await tab.click('[data-hs3="next"]'); assert.equal(step(tab), 'spot');
      await tab.click('[data-hs3="next"]'); assert.equal(step(tab), 'together');
      s = await state(tab); assert.equal(s.spot, 'bed');

      // a changed answer replaces only itself
      await move(tab, 'back', 'spot'); await tab.click('[data-hs3="chip"][data-v="couch"]');
      s = await state(tab); assert.deepEqual([s.home, s.follow, s.spot], ['door', 'weekends', 'couch']);

      // the logo: the first screen, offering to pick up where the buyer left off
      await tab.goto('http://localhost/');
      assert.equal(await screen(tab), 'hero');
      assert.equal((await tab.textContent('[data-hs3-start]')).trim(), 'Pick up where you left off');
      assert.match(await tab.textContent('[data-hs3-resume]'), /Welcome back\. Pip's answers are still here\./);
      await tab.click('[data-hs3-start]'); assert.equal(step(tab), 'together');

      // the page scrolls like any page: nothing locks it
      const locked = await tab.evaluate(() => [getComputedStyle(document.documentElement).overflow, getComputedStyle(document.body).overflow]);
      assert.deepEqual(locked.filter(v => v === 'hidden'), []);
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await browser.close(); }
  });

  test(`${minified ? 'minified' : 'source'}: after a typed answer and its follow-up, every Back and Forward press moves`, async () => {
    const {browser, tab, errors} = await open(minified);
    try {
      await tab.goto('http://localhost/');
      await tab.click('[data-hs3-start]');
      await tab.fill('#hs3-dog', 'Pip'); await tab.click('[data-hs3="next"]');
      await tab.fill('#hs3-rec', 'Alex'); await tab.click('[data-hs3="next"]');
      await tab.click('[data-hs3="other"]'); await tab.fill('#hs3-typed', 'She brings me a sock');
      await tab.click('[data-hs3="send"]'); await tab.waitForSelector('#hs3-typed');
      assert.equal(step(tab), 'home-more', 'the follow-up has its own address');
      await tab.fill('#hs3-typed', 'Always the left one'); await tab.click('[data-hs3="send"]');
      await tab.waitForFunction(() => new URL(location.href).searchParams.get('step') === 'spot');
      // the answered follow-up is no longer a step; Back passes over it in one press
      await move(tab, 'back', 'home');
      await move(tab, 'back', 'person');
      await move(tab, 'forward', 'home');
      await move(tab, 'forward', 'spot');
      const s = await state(tab);
      assert.equal(s.typed.home, 'She brings me a sock'); assert.equal(s.typed.home_follow, 'Always the left one', 'nothing erased');
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  test(`${minified ? 'minified' : 'source'}: "Not sure" on a follow-up keeps the home answer and skips only the detail`, async () => {
    const {browser, tab, errors} = await open(minified);
    try {
      await tab.goto('http://localhost/');
      await tab.click('[data-hs3-start]');
      await tab.fill('#hs3-dog', 'Pip'); await tab.click('[data-hs3="next"]');
      await tab.fill('#hs3-rec', 'Alex'); await tab.click('[data-hs3="next"]');
      await tab.click('[data-hs3="chip"][data-v="door"]'); await tab.waitForSelector('[data-hs3="chip"][data-v="weekends"]');
      await tab.click('[data-hs3="skip"]');
      assert.equal(step(tab), 'spot');
      const s = await state(tab); assert.equal(s.home, 'door'); assert.equal(s.follow, 'skip');
      await move(tab, 'back', 'home-more');
      assert.equal(await pressed(tab, 'weekends'), 'false');
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  // Ruling (Krish, 28 Oct): "There should be some sort of check because I bet tonnes of people will
  // spell things wrong and put in really weird breed names."
  test(`${minified ? 'minified' : 'source'}: the breed box offers a checked list, keeps the pick, and lets unmatched words stand`, async () => {
    const {browser, tab, errors, offsite} = await open(minified, BREEDS);
    try {
      await tab.goto('http://localhost/');
      await tab.click('[data-hs3-start]');
      await tab.fill('#hs3-dog', 'Pip');
      assert.equal(await tab.getAttribute('#hs3-breed', 'role'), 'combobox');
      await tab.fill('#hs3-breed', 'golden retr');
      await tab.waitForSelector('#hs3-breed-list [role=option]');
      const options = await tab.$$eval('#hs3-breed-list [role=option]', els => els.map(e => e.textContent));
      assert.ok(options.length <= 5, 'at most five'); assert.equal(options.at(-1), 'Mixed or not sure', 'always last');
      assert.equal(await tab.getAttribute('#hs3-breed', 'aria-expanded'), 'true');
      await tab.click('#hs3-breed-list [role=option]:has-text("Golden Retriever")');
      let s = await state(tab);
      assert.equal(s.breedId, 'golden-retriever'); assert.equal(s.breed, 'Golden Retriever');
      assert.equal(await tab.inputValue('#hs3-breed'), 'Golden Retriever');
      assert.equal(await tab.isVisible('#hs3-breed-list'), false, 'the list closes on a pick');
      assert.equal(await tab.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review')).hs3_energy), 'eager-open');
      // the keyboard: arrows move, Enter picks, and the box keeps focus
      await tab.fill('#hs3-breed', 'mix');
      await tab.press('#hs3-breed', 'ArrowUp');
      assert.equal(await tab.getAttribute('#hs3-breed', 'aria-activedescendant'), await tab.getAttribute('#hs3-breed-list [role=option]:last-child', 'id'));
      await tab.press('#hs3-breed', 'Enter');
      s = await state(tab); assert.equal(s.breedId, 'mixed-breed'); assert.equal(step(tab), 'dog', 'Enter picked; it did not move on');
      assert.equal(await tab.evaluate(() => JSON.parse(sessionStorage.getItem('hs2-review')).hs3_energy), '');
      // words that match nothing stay, with a quiet note, and Next still works
      await tab.fill('#hs3-breed', 'Fluffy wolf thing');
      await tab.press('#hs3-breed', 'Escape');
      await tab.click('#hs3-dog');
      assert.equal(await tab.isVisible('text=I\'ll go by your photo and answers.'), true);
      s = await state(tab); assert.equal(s.breed, 'Fluffy wolf thing'); assert.equal(s.breedId, '');
      await tab.click('[data-hs3="next"]'); assert.equal(step(tab), 'person');
      await move(tab, 'back', 'dog');
      assert.equal(await tab.inputValue('#hs3-breed'), 'Fluffy wolf thing', 'Back keeps the words');
      assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
    } finally { await browser.close(); }
  });

  test(`${minified ? 'minified' : 'source'}: a link to a step the answers don't reach clamps back, and Start over clears`, async () => {
    const {browser, tab, errors} = await open(minified);
    try {
      await tab.goto('http://localhost/?step=meaning');
      assert.equal(await screen(tab), 'chat'); assert.equal(step(tab), 'dog', 'no name yet, so the first question');
      await tab.goto('http://localhost/?step=not-a-step');
      assert.equal(await screen(tab), 'hero'); assert.equal(step(tab), null);
      await tab.click('[data-hs3-start]'); await tab.fill('#hs3-dog', 'Pip'); await tab.click('[data-hs3="next"]');
      await tab.goto('http://localhost/?step=together');
      assert.equal(step(tab), 'person', 'the furthest step the answers reach');
      await tab.goto('http://localhost/');
      await tab.click('[data-hs3-restart]');
      assert.equal(step(tab), 'dog'); assert.equal((await state(tab)).dog, '');
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });
}
