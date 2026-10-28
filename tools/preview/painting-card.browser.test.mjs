// The painting card's words (28 Oct, the four order recordings): honest timing, a status line that
// only moves forward (it started over after 25 seconds, and a timer kept from the first call put
// "Nearly there" back over Teeinblue's open framing box), the framing box named before it opens, and
// "Artwork failed or stopped?" only after two minutes without a result or on a real error (under a
// normal run it invited doubt). A photo held behind the painting names that panel only while it shows
// (28 Oct review: it sent the buyer to a control that was hidden). Real snippet, stylesheet, artStage and
// photoHeld in Chromium; nothing leaves localhost.
//
//   node --test tools/preview/painting-card.browser.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {Liquid} from 'liquidjs';
import {transformSync} from 'esbuild';

const root = new URL('../../', import.meta.url);
const source = readFileSync(new URL('shopify/assets/hs2.js', root), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const css = readFileSync(new URL('shopify/assets/hs2.css', root), 'utf8');
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: the painting card's words move forward, name the framing box, and hold "failed or stopped" back for two minutes`, async () => {
  const native = await new Liquid().parseAndRender(readFileSync(new URL('shopify/snippets/hs-native-artwork.liquid', root), 'utf8'), {settings: {native_artwork_kind: 'mug', blanket_purchase: false}});
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><main id="buy" data-hs2-artwork-kind="mug"><div data-hs2-media></div><div class="hs2-product__stage" data-hs2-stage></div>${native}<div class="tee-field--photo"></div></main></body></html>`;
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  const offsite = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost') { offsite.push(url.href); return route.abort(); }
    return url.pathname === '/' ? route.fulfill({contentType: 'text/html', body: html}) : route.fulfill({status: 404, body: ''});
  });
  try {
    await page.goto('http://localhost/');
    const code = `var photoURL='', error=false, keepTibPhoto={}; function productId(){return 7;} function answer(k){return k==='dog'?'Pip':'';} function blanketNativeError(){return error;}
      function blanketArtPreview(){return false;} function cityArtSaved(){return false;} function cityArtSource(){return '';} function blanketUploadPending(){return true;} function nativeBlanketInputsReady(){return true;}` + ['previewHasArt', 'artLines', 'artStage', 'photoHeld'].map(section).join('\n');
    await page.addScriptTag({content: minified ? transformSync(code, {minify: true}).code : code});
    // the status code shows the recovery panel whenever an upload is unresolved; artStage decides when it may be seen
    const at = ms => page.evaluate(ms => { sessionStorage.setItem('hs-art-start:7', String(Date.now() - ms)); document.querySelector('[data-hs2-upload-recovery]').hidden = false; artStage(true);
      const r = document.querySelector('[data-hs2-upload-recovery]');
      return {line: document.querySelector('[data-hs-art-line]').textContent, note: document.querySelector('.hs-art__note').textContent, recovery: !!r.getClientRects().length, held: photoHeld()}; }, ms);
    const first = await at(0), lines = await page.evaluate(() => artLines('Pip'));
    assert.equal(first.line, lines[0]);
    assert.equal(first.note, "About a minute, sometimes two. When it's done, check the framing, then Save.");
    assert.equal(first.recovery, false, 'no "failed or stopped" under a normal run');
    assert.equal(first.held, "I'm still painting Pip from the photo you sent. It takes about a minute, sometimes two.", 'a held photo is not sent to a hidden panel');
    // Buddy's lines once each, then the longer waits: never back to the first line
    const seen = [];
    for (const ms of [6000, 12000, 21000, 26000, 29000, 31000, 60000, 101000]) seen.push((await at(ms)).line);
    assert.deepEqual(seen.slice(0, 5), [lines[1], lines[2], lines[4], lines[4], lines[4]], 'it went back to the first line at 25 seconds');
    assert.match(seen[5], /Nearly there/); assert.match(seen[6], /Nearly there/); assert.match(seen[7], /Still painting/);
    assert.equal((await at(101000)).recovery, false);
    const stuck = await at(121000);
    assert.equal(stuck.recovery, true, 'two minutes without a result: the way out shows');
    assert.equal(stuck.held, 'I\'m still working on the photo you sent. If it stopped, open "Artwork failed or stopped?" below.', 'and a held photo names it');
    // Teeinblue's framing box opens by itself: named, and the second-by-second timer keeps it named
    await page.evaluate(() => { const m = document.createElement('div'); m.className = 'vm--container'; document.body.appendChild(m); artStage(true); });
    assert.equal(await page.textContent('[data-hs-art-line]'), "It's painted. Check the framing, then Save.");
    await page.waitForTimeout(1300);
    assert.equal(await page.textContent('[data-hs-art-line]'), "It's painted. Check the framing, then Save.", 'the timer kept the framing line');
    // saved and closed: the next words, never "Nearly there" again
    await page.evaluate(() => { document.querySelector('.vm--container').remove(); });
    await page.waitForTimeout(1300);
    assert.equal(await page.textContent('[data-hs-art-line]'), 'Putting it on your gift.');
    // a real error ends the painting state: the way out shows at once
    const failed = await page.evaluate(() => { error = true; sessionStorage.setItem('hs-art-start:7', String(Date.now() - 5000)); document.querySelector('[data-hs2-upload-recovery]').hidden = false; artStage(true); return !!document.querySelector('[data-hs2-upload-recovery]').getClientRects().length; });
    assert.equal(failed, true);
    // a new painting starts its own words from the first line
    assert.equal((await page.evaluate(() => { error = false; artStage(false); return 1; })), 1);
    assert.equal((await at(1000)).line, lines[0]);
    assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
  } finally { await page.close(); }
});
