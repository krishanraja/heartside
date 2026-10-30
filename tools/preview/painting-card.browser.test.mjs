// The painting card's words (28 Oct, the four order recordings; 29 Oct handover): the card says only
// what is known. Teeinblue reports nothing between "sent" and "ready", so there is no percentage, no
// aria-valuenow and no "nearly there" at a fixed time; the words follow real events (checking the photo
// on this device, with the painter, the framing box open, going onto the gift), the card counts the
// time since it started, and that count survives a reload. "Artwork failed or stopped?" shows only
// after two minutes without a result or on a real error. A held photo names that panel only while it
// shows (28 Oct review). Real snippet, stylesheet, artStage and photoHeld in Chromium; nothing leaves
// localhost.
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

const FN = ['previewHasArt', 'artPhase', 'artWords', 'artElapsed', 'artStage', 'photoHeld'];
async function open(reducedMotion, minified) {
  const native = await new Liquid().parseAndRender(readFileSync(new URL('shopify/snippets/hs-native-artwork.liquid', root), 'utf8'), {settings: {native_artwork_kind: 'mug', blanket_purchase: false}});
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><main id="buy" data-hs2-artwork-kind="mug"><div data-hs2-media></div><div class="hs2-product__stage" data-hs2-stage></div>${native}<div class="tee-field--photo"></div></main></body></html>`;
  const page = await browser.newPage({viewport: {width: 390, height: 844}, reducedMotion: reducedMotion ? 'reduce' : 'no-preference'});
  const offsite = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost') { offsite.push(url.href); return route.abort(); }
    return url.pathname === '/' || url.pathname === '/other' ? route.fulfill({contentType: 'text/html', body: html}) : route.fulfill({status: 404, body: ''});
  });
  const load = async (path = '/') => {
    await page.goto('http://localhost' + path);
    const code = `var photoURL='', error=false, keepTibPhoto={}, state={}, reduced=${reducedMotion}; function productId(){return 7;} function answer(k){return k==='dog'?'Pip':'';} function blanketNativeError(){return error;}
      function blanketArtPreview(){return false;} function cityArtSaved(){return false;} function cityArtSource(){return '';} function blanketUploadPending(){return true;} function nativeBlanketInputsReady(){return true;}` + FN.map(section).join('\n');
    await page.addScriptTag({content: minified ? transformSync(code, {minify: true}).code : code});
  };
  return {page, load, offsite, errors};
}
// the status code shows the recovery panel whenever an upload is unresolved; artStage decides when it may be seen
const at = (page, ms, lock = 'sent') => page.evaluate(([ms, lock]) => {
  sessionStorage.setItem('hs-art-start:7', String(Date.now() - ms)); sessionStorage.setItem('hs2-blanket-upload:7', JSON.stringify({before: '', stage: lock}));
  document.querySelector('[data-hs2-upload-recovery]').hidden = false; artStage(true);
  const card = document.querySelector('[data-hs-art]'), r = document.querySelector('[data-hs2-upload-recovery]'), bar = card.querySelector('[data-hs-art-bar]');
  return {line: card.querySelector('[data-hs-art-line]').textContent, note: card.querySelector('.hs-art__note').textContent, since: card.querySelector('[data-hs-art-elapsed]').textContent,
    recovery: !!r.getClientRects().length, held: photoHeld(), valued: bar.hasAttribute('aria-valuenow') || bar.hasAttribute('aria-valuemax'), text: card.innerText};
}, [ms, lock]);

for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: the painting card says only what is known, with no percentage, and holds "failed or stopped" back for two minutes`, async () => {
  const {page, load, offsite, errors} = await open(false, minified);
  try {
    await load();
    // checking the photo on this device, before anything was sent
    const checking = await at(page, 0, 'preparing');
    assert.equal(checking.line, 'Checking your photo on this device and getting it ready.');
    const first = await at(page, 0);
    assert.equal(first.line, 'Your photo is with the painter. The finished picture comes back all at once.');
    assert.equal(first.since, 'Started just now.');
    assert.equal(first.note, "Most paintings take 1 to 3 minutes. When it's done, check the framing, then Save.");
    assert.equal(first.recovery, false, 'no "failed or stopped" under a normal run');
    assert.equal(first.valued, false, 'an indeterminate bar: no value is claimed');
    assert.equal(first.held, "I'm still painting Pip from the photo you sent. Most paintings take 1 to 3 minutes.", 'a held photo is not sent to a hidden panel');
    // time passing changes the count, never the claim: no percentage and no "nearly" at any time
    const seen = [];
    for (const ms of [6000, 31000, 60000, 101000, 119000, 240000]) seen.push(await at(page, ms));
    for (const s of seen) { assert.doesNotMatch(s.text, /\d+\s*%|nearly|almost/i, s.text); assert.equal(s.valued, false); }
    assert.deepEqual(seen.map(s => s.since), ['Started just now.', 'Started 30 seconds ago.', 'Started 1 minute ago.', 'Started 1 minute ago.', 'Started 1 minute ago.', 'Started 4 minutes ago.']);
    assert.equal(seen[3].line, first.line, 'the words do not move on by a timer');
    assert.equal(seen[4].recovery, false);
    assert.equal(seen[5].line, "This one is taking longer than most. It's still going, and you don't need to send the photo again.");
    assert.equal(seen[5].recovery, true, 'two minutes without a result: the way out shows');
    assert.equal(seen[5].held, 'I\'m still working on the photo you sent. If it stopped, open "Artwork failed or stopped?" below.', 'and a held photo names it');
    // a reload mid-paint keeps the clock: the count continues, nothing restarts
    await load();
    const reloaded = await page.evaluate(() => { artStage(true); return document.querySelector('[data-hs-art-elapsed]').textContent; });
    assert.equal(reloaded, 'Started 4 minutes ago.');
    // back navigation and return: the same painting, the same clock
    await page.goto('http://localhost/other'); await page.goBack(); await load();
    assert.equal(await page.evaluate(() => { artStage(true); return document.querySelector('[data-hs-art-elapsed]').textContent; }), 'Started 4 minutes ago.');
    // Teeinblue's framing box opens by itself: named, and the second-by-second timer keeps it named
    await page.evaluate(() => { const m = document.createElement('div'); m.className = 'vm--container'; document.body.appendChild(m); artStage(true); });
    assert.equal(await page.textContent('[data-hs-art-line]'), "It's painted. Check the framing, then Save.");
    await page.waitForTimeout(1300);
    assert.equal(await page.textContent('[data-hs-art-line]'), "It's painted. Check the framing, then Save.", 'the timer kept the framing line');
    // saved and closed: the next words, never "painting" again
    await page.evaluate(() => { document.querySelector('.vm--container').remove(); });
    await page.waitForTimeout(1300);
    assert.equal(await page.textContent('[data-hs-art-line]'), 'Putting it on your gift.');
    // a real error ends the painting state: the way out shows at once
    const failed = await page.evaluate(() => { error = true; sessionStorage.setItem('hs-art-start:7', String(Date.now() - 5000)); document.querySelector('[data-hs2-upload-recovery]').hidden = false; artStage(true); return !!document.querySelector('[data-hs2-upload-recovery]').getClientRects().length; });
    assert.equal(failed, true);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('hs-art-start:7')), null, 'an ended painting clears its clock');
    // a new painting starts its own words and clock
    assert.equal((await page.evaluate(() => { error = false; artStage(false); return 1; })), 1);
    const fresh = await at(page, 1000);
    assert.equal(fresh.line, 'Your photo is with the painter. The finished picture comes back all at once.'); assert.equal(fresh.since, 'Started just now.');
    // the words are announced as they change; the bar is announced as busy, with no value
    assert.equal(await page.evaluate(() => document.querySelector('[data-hs-art-line]').getAttribute('aria-live')), 'polite');
    assert.deepEqual(errors, []); assert.deepEqual(offsite, []);
  } finally { await page.close(); }
});

test('reduced motion: the bar holds still, and nothing scrolls smoothly', async () => {
  const {page, load, errors} = await open(true, false);
  try {
    await load();
    const calls = await page.evaluate(() => {
      const seen = []; Element.prototype.scrollIntoView = function (o) { seen.push(o && o.behavior); };
      sessionStorage.setItem('hs2-blanket-upload:7', JSON.stringify({before: '', stage: 'sent'})); artStage(true);
      const span = document.querySelector('[data-hs-art-bar] span'), cs = getComputedStyle(span);
      return {seen, animation: cs.animationName, width: span.getBoundingClientRect().width / span.parentElement.getBoundingClientRect().width};
    });
    assert.equal(calls.animation, 'none'); assert.ok(calls.width > 0.99, String(calls.width));
    assert.deepEqual(calls.seen, ['auto']);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});
