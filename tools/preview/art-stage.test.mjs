// The painting and the finished design (Krish, 28 Oct: the wait "looks broken", and the tickbox
// sat above the picture where he barely saw it). Real snippet and stylesheet in a browser: while
// Teeinblue paints, the card names the dog, says what it is doing and eases its bar; the finished
// design then fills the card with the review directly under the picture.
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {Liquid} from 'liquidjs';
import {transformSync} from 'esbuild';

const root = new URL('../../', import.meta.url);
const source = readFileSync(new URL('shopify/assets/hs2.js', root), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const css = readFileSync(new URL('shopify/assets/hs2.css', root), 'utf8');
const out = new URL('tools/preview/out/art-stage/', root);
mkdirSync(out, {recursive: true});
// a small stand-in for the finished design, drawn here so the test needs no network
const PHOTO = 'data:image/webp;base64,' + readFileSync(new URL('shopify/assets/hs-photo-headshot-480.webp', root)).toString('base64');
const DESIGN = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="600"><rect width="500" height="600" fill="#e3d3bf"/><circle cx="250" cy="280" r="150" fill="#8a4a2b"/></svg>');
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

for (const [kind, settings] of [['blanket', {blanket_purchase: true, native_artwork_kind: 'blanket'}], ['mug', {blanket_purchase: false, native_artwork_kind: 'mug'}]]) {
  for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'} ${kind}: a painting state that reads as painting, then the design with its review under it`, async () => {
    const html = await new Liquid().parseAndRender(readFileSync(new URL('shopify/snippets/hs-native-artwork.liquid', root), 'utf8'), {settings});
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    // a real origin, so the page has sessionStorage like the store does; nothing else loads
    await page.route('**/*', r => r.request().url() === 'https://hs.test/' ? r.fulfill({contentType: 'text/html', body: `<!doctype html><style>${css}</style><main id="buy">${html}<div class="tee-field--photo"></div></main>`}) : r.abort());
    try {
      await page.goto('https://hs.test/');
      const fns = ['artLines', 'artStage', 'nudgeReview'].map(section).join('\n');
      const code = `var pending=true,saved=false,src='',photoURL=${JSON.stringify(PHOTO)};function productId(){return 7;}function answer(k){return k==='dog'?'Pip':'';}
        function blanketNativeError(){return false;}function cityArtSaved(){return saved;}function cityArtSource(){return src;}` + fns;
      await page.addScriptTag({content: minified ? transformSync(code, {minify: true}).code : code});
      await page.evaluate(() => artStage(pending));
      const painting = await page.evaluate(() => {
        const card = document.querySelector('[data-hs-art]'), line = card.querySelector('[data-hs-art-line]');
        return {shown: !card.hidden && card.getBoundingClientRect().height > 300, state: card.getAttribute('data-state'), title: card.querySelector('[data-hs-art-title]').textContent,
          line: line.textContent, review: !!card.querySelector('[data-hs-art-done]:not([hidden])'), animated: getComputedStyle(card.querySelector('.hs-art__wash i')).animationName};
      });
      assert.ok(painting.shown, 'a large card, not a small loader'); assert.equal(painting.state, 'painting');
      assert.equal(painting.title, 'Painting Pip'); assert.ok(painting.line.length > 8); assert.equal(painting.review, false);
      assert.equal(painting.animated, 'hs-art-wash', 'the wash moves');
      assert.equal(await page.evaluate(() => !document.querySelector('[data-hs-art-photo]').hidden), true, "the buyer's photo shows as the sketch being painted");
      await page.screenshot({path: new URL(`${kind}-painting.png`, out).pathname});
      // forty seconds in, the bar has moved most of the way and the line says so, without claiming the end
      const later = await page.evaluate(() => { sessionStorage.setItem('hs-art-start:7', String(Date.now() - 40000)); artStage(true); const bar = document.querySelector('[data-hs-art-bar]'); return {pct: Number(bar.getAttribute('aria-valuenow')), line: document.querySelector('[data-hs-art-line]').textContent}; });
      assert.ok(later.pct > 60 && later.pct < 92, String(later.pct)); assert.match(later.line, /Nearly there/);
      // the design arrives
      const done = await page.evaluate(async (design) => {
        pending = false; saved = true; src = design; document.querySelector('[data-hs2-artwork-accept-wrap]').hidden = false;
        artStage(false);
        const card = document.querySelector('[data-hs-art]'), img = card.querySelector('[data-hs-art-result]');
        await new Promise(r => img.complete ? r() : img.addEventListener('load', r));
        const canvas = card.querySelector('[data-hs-art-canvas]').getBoundingClientRect(), accept = card.querySelector('[data-hs2-artwork-accept-wrap]').getBoundingClientRect();
        return {state: card.getAttribute('data-state'), img: img.getAttribute('src') === design && !img.hidden && img.naturalWidth > 0, title: card.querySelector('[data-hs-art-done-title]').textContent,
          yes: card.querySelector('[data-hs-art-yes]').textContent, below: accept.top >= canvas.bottom, tall: accept.height >= 44, painting: !card.querySelector('[data-hs-art-painting]').hidden,
          started: sessionStorage.getItem('hs-art-start:7'), text: card.innerText};
      }, DESIGN);
      assert.equal(done.state, 'done'); assert.ok(done.img, 'the finished design fills the card');
      assert.equal(done.title, "Here's Pip."); assert.equal(done.yes, 'Yes, this is Pip.');
      assert.ok(done.below, 'the review sits under the picture'); assert.ok(done.tall, 'a tap target, not a small tickbox');
      assert.equal(done.painting, false); assert.equal(done.started, null, 'the next painting starts its own clock');
      assert.doesNotMatch(done.text, /I have checked the finished artwork/);
      if (kind === 'mug') assert.match(done.text, /the note and signature/); else assert.doesNotMatch(done.text, /note and signature/);
      await page.waitForTimeout(1000); // the reveal
      await page.screenshot({path: new URL(`${kind}-done.png`, out).pathname, fullPage: true});
      assert.equal(await page.evaluate(() => nudgeReview() && document.querySelector('[data-hs2-artwork-accept-wrap]').classList.contains('is-nudged')), true, 'a blocked Add to cart points at the review');
      // nothing to show: no card at all
      assert.equal(await page.evaluate(() => { saved = false; return artStage(false) === 'idle' && document.querySelector('[data-hs-art]').hidden; }), true);
    } finally { await page.close(); }
  });
}
