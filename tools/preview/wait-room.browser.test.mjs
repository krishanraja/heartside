// The painting wait (Krish, 4 Nov): while the card paints, the photo paints in from grey, the dog talks
// from the studio, a true breed fact comes every third beat, a tap gives a treat, and the studio clears
// away when the painting lands. Real snippet, stylesheets, hs-breed-facts.js and hs-wait.js in Chromium,
// phone width; screens go to out/wait-room/. Nothing leaves localhost.
//   node --test tools/preview/wait-room.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {Liquid} from 'liquidjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '../..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const shots = path.join(here, 'out', 'wait-room');
fs.mkdirSync(shots, {recursive: true});
const photo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(root, 'assets/photos/pug-autumn-leaves.jpg')).toString('base64');
const REVIEW = {dog: 'Mowgli', person: 'Sam', hs_breed_id: 'pug', hs_journey: {tone: 'warm'},
  hs_brief_input: {breed: 'Pug', pronoun: 'he', spot: 'couch', together: 'naps', home: 'door', meaning: 'best', toys: 'a tennis ball and a rope toy', accessory: 'a bandana'}};

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

async function open(kind, reducedMotion) {
  const native = (await new Liquid().parseAndRender(read('shopify/snippets/hs-native-artwork.liquid'), {settings: {native_artwork_kind: kind, blanket_purchase: false}}))
    .replace(/hs-wait\.css|<link[^>]*hs-wait\.css[^>]*>|<script src="[^"]*(hs-breed-facts|hs-wait)\.js"[^>]*><\/script>/g, '');
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${read('shopify/assets/hs2.css')}${read('shopify/assets/hs-wait.css')}</style></head>
    <body style="margin:0;padding:16px;background:#FBF6F1"><main id="buy">${native}</main></body></html>`;
  const page = await browser.newPage({viewport: {width: 390, height: 844}, reducedMotion: reducedMotion ? 'reduce' : 'no-preference'});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.fulfill({contentType: 'text/html', body: html}) : r.abort());
  await page.goto('http://localhost/products/your-dogs-personality-blanket');
  await page.evaluate(([review, src]) => {
    sessionStorage.setItem('hs2-review', JSON.stringify(review));
    const card = document.querySelector('[data-hs-art]'), img = card.querySelector('[data-hs-art-photo]');
    img.src = src; img.hidden = false;
    card.querySelector('[data-hs-art-title]').textContent = 'Painting Mowgli';
  }, [REVIEW, photo]);
  await page.addScriptTag({content: read('shopify/assets/hs-breed-facts.js')});
  await page.addScriptTag({content: read('shopify/assets/hs-wait.js')});
  return {page, errors};
}
const paint = (page, agoMs) => page.evaluate(ms => {
  sessionStorage.setItem('hs-wait-start:' + location.pathname, String(Date.now() - ms));
  const card = document.querySelector('[data-hs-art]');
  card.hidden = false; card.setAttribute('data-state', 'painting');
}, agoMs);
const look = page => page.evaluate(() => {
  const card = document.querySelector('[data-hs-art]'), say = card.querySelector('[data-hs-wait-say]'), fact = card.querySelector('[data-hs-wait-fact]');
  const paths = [...card.querySelectorAll('.hs-wait__paint mask path')];
  const shown = paths.reduce((a, p) => a + (1 - Number(p.style.strokeDashoffset) / parseFloat(p.style.strokeDasharray)), 0) / (paths.length || 1);
  return {wait: card.classList.contains('has-wait'), say: say && (say.getAttribute('aria-label') || say.textContent), fact: fact && !fact.hidden ? fact.innerText : '',
    shown, bar: card.querySelector('[data-hs-art-bar] span').style.width, stage: !!card.querySelector('.hs-wait__stage'), text: card.innerText};
});

for (const kind of ['blanket', 'mug', 'print']) test(`${kind}: the studio paints in, talks, and clears when the painting lands`, async () => {
  const {page, errors} = await open(kind, false);
  try {
    await paint(page, 5000);
    await page.waitForFunction(() => document.querySelector('[data-hs-art]').classList.contains('has-wait'));
    await page.waitForTimeout(2600);
    const early = await look(page);
    assert.ok(early.stage, 'the studio is on the canvas');
    assert.ok(early.say && early.say.length > 10, 'the dog is talking');
    assert.doesNotMatch(early.text, /!|—/, 'house voice: no exclamation marks or dashes');
    await page.screenshot({path: path.join(shots, kind + '-05s.png'), fullPage: true});
    if (kind === 'blanket') {
      // later, more of the picture is in colour, and the bar is further on but never full
      await page.evaluate(() => { sessionStorage.setItem('hs-wait-start:' + location.pathname, String(Date.now() - 150000)); });
      await page.evaluate(() => { const c = document.querySelector('[data-hs-art]'); c.setAttribute('data-state', 'idle'); });
      await page.waitForFunction(() => !document.querySelector('.hs-wait__stage'));
      await paint(page, 150000);
      await page.waitForTimeout(1600);
      const late = await look(page);
      assert.ok(late.shown > early.shown + 0.3, `more painted later (${early.shown.toFixed(2)} to ${late.shown.toFixed(2)})`);
      assert.ok(parseFloat(late.bar) < 100 && parseFloat(late.bar) > 80, 'the bar is far on, never full while painting: ' + late.bar);
      // a treat: a counter and a thank you
      await page.click('[data-hs-wait-treat]');
      await page.click('[data-hs-wait-treat]');
      const fed = await page.evaluate(() => ({n: document.querySelector('[data-hs-wait-count]').textContent, say: document.querySelector('[data-hs-wait-say]').getAttribute('aria-label') || document.querySelector('[data-hs-wait-say]').textContent}));
      assert.equal(fed.n, '2');
      assert.match(fed.say, /Crunchy/);
      await page.waitForTimeout(700);
      await page.screenshot({path: path.join(shots, kind + '-150s.png'), fullPage: true});
      // the third beat is a true fact about the breed
      await page.evaluate(() => { window.__hsWaitTest = true; });
      // the fact holds the bubble for one beat (7 s) every third beat; wait for it rather than sample
      await page.waitForFunction(() => { const f = document.querySelector('[data-hs-wait-fact]'); return f && !f.hidden && f.innerText.length > 20; }, null, {timeout: 45000, polling: 200});
      const fact = (await look(page)).fact;
      assert.match(fact, /pug|Pompey|China/i, 'a pug fact: ' + fact);
      await page.screenshot({path: path.join(shots, kind + '-fact.png'), fullPage: true});
    }
    // the painting lands: the studio clears away and hs2.js's reveal takes over
    await page.evaluate(() => { const c = document.querySelector('[data-hs-art]'); c.setAttribute('data-state', 'done'); });
    await page.waitForFunction(() => !document.querySelector('.hs-wait__stage') && !document.querySelector('.hs-wait__talk'));
    assert.equal(await page.evaluate(() => document.querySelector('[data-hs-art]').classList.contains('has-wait')), false);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('reduced motion: the photo is still, nothing drifts, and the lines just change', async () => {
  const {page, errors} = await open('blanket', true);
  try {
    await paint(page, 30000);
    await page.waitForFunction(() => document.querySelector('[data-hs-art]').classList.contains('has-wait'));
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => ({things: document.querySelectorAll('.hs-wait__thing').length, say: document.querySelector('[data-hs-wait-say]').textContent}));
    assert.equal(r.things, 0, 'nothing drifts');
    assert.ok(r.say.length > 10, 'the whole line shows at once');
    await page.screenshot({path: path.join(shots, 'reduced.png'), fullPage: true});
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('every line the dog can say keeps the house voice, for every answer', async () => {
  const {page} = await open('blanket', false);
  try {
    const bad = await page.evaluate(() => {
      const out = [], W = window.__hsWait;
      const sets = [];
      for (const spot of ['couch', 'bed', 'feet', 'anywhere', '']) for (const together of ['walk', 'coffee', 'movie', 'naps', 'car', '']) for (const tone of ['sentimental', 'warm', 'hilarious', 'over_the_top'])
        sets.push(W.lines({dog: 'Mowgli', spot, together, home: 'door', meaning: 'boss', toy: 'tennis ball', wears: 'bandana', person: 'Sam', tone, ai: []}));
      for (const L of sets) for (const line of [].concat(L.open, L.mid, L.long, W.treats)) if (/!|—|–|undefined|null/.test(line)) out.push(line);
      return [...new Set(out)];
    });
    assert.deepEqual(bad, []);
  } finally { await page.close(); }
});

// Krish, 4 Nov: "Nothing on this page must randomly change size with volatility like that when text is
// generating." Watch the line under the bubble through typing, a treat and a breed fact: it never moves, and
// the dog's face stays a circle (a portrait photo once stretched it into a tall oval).
for (const kind of ['blanket', 'mug']) test(`${kind}: nothing below the bubble moves while the dog talks`, async () => {
  const {page, errors} = await open(kind, false);
  try {
    await paint(page, 5000);
    await page.waitForFunction(() => document.querySelector('[data-hs-art]').classList.contains('has-wait'));
    const tops = new Set(), faces = new Set();
    let sawFact = false;
    for (let i = 0; i < 160 && !(sawFact && i > 60); i++) {
      const r = await page.evaluate(() => {
        const b = document.querySelector('[data-hs-art-line]').getBoundingClientRect().top;
        const f = document.querySelector('.hs-wait__me img'); // layout size, not the munch animation's scale
        const fact = document.querySelector('[data-hs-wait-fact]');
        return {top: Math.round(b), face: f.offsetWidth + 'x' + f.offsetHeight, fact: !!fact && !fact.hidden};
      });
      tops.add(r.top); faces.add(r.face); sawFact = sawFact || r.fact;
      if (i === 10) await page.click('[data-hs-wait-treat]');
      await page.waitForTimeout(150);
    }
    assert.ok(sawFact, 'a breed fact took a turn during the watch');
    assert.deepEqual([...tops].length, 1, 'the line under the bubble held still: ' + [...tops].join(', '));
    assert.deepEqual([...faces], ['48x48'], 'the face is a circle');
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});
