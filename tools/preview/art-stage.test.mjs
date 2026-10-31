// The painting and the finished design (Krish, 28 Oct: the wait "looks broken", and the tickbox
// sat above the picture where he barely saw it). Real snippet and stylesheet in a browser: while
// Teeinblue paints, the card names the dog, says what is known and sweeps a bar with no value; the finished
// design then fills the card with the review directly under the picture.
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {Liquid} from 'liquidjs';
import {transformSync} from 'esbuild';
import {fileURLToPath} from 'node:url';

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


// The screenshots are evidence for a person, never a check. Chromium can refuse a capture while the
// painting card's endless wash animates on a busy runner ("Unable to capture screenshot", CI 31 Oct),
// so one retry with animations paused; a second refusal still fails the test.
async function shot(page, opts) {
  try { await page.screenshot(opts); } catch (e) { if (!/capture screenshot/i.test(String(e))) throw e; await page.screenshot({...opts, animations: 'disabled'}); }
}

for (const [kind, settings] of [['blanket', {blanket_purchase: true, native_artwork_kind: 'blanket'}], ['mug', {blanket_purchase: false, native_artwork_kind: 'mug'}]]) {
  for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'} ${kind}: a painting state that reads as painting, then the design with its review under it`, async () => {
    const html = await new Liquid().parseAndRender(readFileSync(new URL('shopify/snippets/hs-native-artwork.liquid', root), 'utf8'), {settings});
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    // a real origin, so the page has sessionStorage like the store does; nothing else loads
    await page.route('**/*', r => r.request().url() === 'https://hs.test/' ? r.fulfill({contentType: 'text/html', body: `<!doctype html><style>${css}</style><main id="buy"><div data-hs2-media><button data-hs2-thumb-preview aria-current="true"></button><button data-hs2-thumb aria-current="false"></button><div class="hs2-product__stage" data-hs2-stage><div style="height:200px"></div></div></div>${html}<div class="tee-field--photo"></div></main>`}) : r.abort());
    try {
      await page.goto('https://hs.test/');
      const fns = ['previewHasArt', 'artPhase', 'artWords', 'artElapsed', 'artStage', 'nudgeReview'].map(section).join('\n');
      const code = `var pending=true,saved=false,src='',state={},reduced=false,photoURL=${JSON.stringify(PHOTO)};function productId(){return 7;}function answer(k){return k==='dog'?'Pip':'';}
        function blanketNativeError(){return false;}function blanketArtPreview(){return ${kind === 'blanket'};}function cityArtSaved(){return saved;}function cityArtSource(){return src;}` + fns;
      await page.addScriptTag({content: minified ? transformSync(code, {minify: true}).code : code});
      // before any painting, a gift page reached without the chat shows its labeled example, not
      // Teeinblue's sample dog as "Your design" (29 Oct: the mug and portrait did, over the sample pug)
      assert.equal(await page.evaluate(() => { pending = false; artStage(false); const m = document.querySelector('[data-hs2-media]'); return m.getAttribute('data-show') + ':' + m.querySelector('[data-hs2-thumb]').getAttribute('aria-current'); }), 'photo:true');
      await page.evaluate(() => { pending = true; artStage(pending); });
      assert.equal(await page.evaluate(() => document.querySelector('[data-hs2-media]').hasAttribute('data-show')), false, 'painting: back to the preview, under the wash');
      const painting = await page.evaluate(() => {
        const card = document.querySelector('[data-hs-art]'), line = card.querySelector('[data-hs-art-line]');
        return {shown: !card.hidden && card.getBoundingClientRect().height > 300, state: card.getAttribute('data-state'), title: card.querySelector('[data-hs-art-title]').textContent,
          line: line.textContent, review: !!card.querySelector('[data-hs-art-done]:not([hidden])'), animated: getComputedStyle(card.querySelector('.hs-art__wash i')).animationName};
      });
      assert.ok(painting.shown, 'a large card, not a small loader'); assert.equal(painting.state, 'painting');
      assert.equal(painting.title, 'Painting Pip'); assert.ok(painting.line.length > 8); assert.equal(painting.review, false);
      assert.equal(painting.animated, 'hs-art-wash', 'the wash moves');
      assert.equal(await page.evaluate(() => { const st = document.querySelector('[data-hs2-stage]'); return st.classList.contains('hs-painting') && getComputedStyle(st, '::after').content; }), '"Painting Pip"', 'the gallery paints too');
      assert.equal(await page.evaluate(() => !document.querySelector('[data-hs-art-photo]').hidden), true, "the buyer's photo shows as the sketch being painted");
      await shot(page, {path: fileURLToPath(new URL(`${kind}-painting.png`, out))});
      // forty seconds in, the bar still claims no value and the card counts the time, never a finish
      const later = await page.evaluate(() => { sessionStorage.setItem('hs-art-start:7', String(Date.now() - 40000)); artStage(true); const bar = document.querySelector('[data-hs-art-bar]'); return {valued: bar.hasAttribute('aria-valuenow'), sweep: getComputedStyle(bar.firstElementChild).animationName, since: document.querySelector('[data-hs-art-elapsed]').textContent, line: document.querySelector('[data-hs-art-line]').textContent}; });
      assert.equal(later.valued, false); assert.equal(later.sweep, 'hs-art-sweep'); assert.equal(later.since, 'Started 40 seconds ago.'); assert.doesNotMatch(later.line, /nearly/i);
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
      assert.equal(done.painting, false); assert.equal(await page.evaluate(() => document.querySelector('[data-hs2-stage]').classList.contains('hs-painting')), false); assert.equal(done.started, null, 'the next painting starts its own clock');
      assert.doesNotMatch(done.text, /I have checked the finished artwork/);
      assert.doesNotMatch(done.text, /note and signature/, 'artwork only (31 Oct): no gift carries words');
      await page.waitForTimeout(1000); // the reveal
      await shot(page, {path: fileURLToPath(new URL(`${kind}-done.png`, out)), fullPage: true});
      assert.equal(await page.evaluate(() => nudgeReview() && document.querySelector('[data-hs2-artwork-accept-wrap]').classList.contains('is-nudged')), true, 'a blocked Add to cart points at the review');
      // nothing to show: no card at all
      assert.equal(await page.evaluate(() => { saved = false; return artStage(false) === 'idle' && document.querySelector('[data-hs-art]').hidden; }), true);
    } finally { await page.close(); }
  });
}

// 29 Oct: after the chat the preview carries the buyer's words (Krish, 19 Oct), so it stays on show, but
// until the painting is in it the dog is Teeinblue's sample: it is labeled Example, and the label goes
// once the buyer's painting is there.
for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'} mug after the chat: the preview stays on show, labeled Example until the painting is in it`, async () => {
  const html = await new Liquid().parseAndRender(readFileSync(new URL('shopify/snippets/hs-native-artwork.liquid', root), 'utf8'), {settings: {blanket_purchase: false, native_artwork_kind: 'mug'}});
  const gallery = readFileSync(new URL('shopify/snippets/hs-product-gallery.liquid', root), 'utf8');
  const tag = gallery.match(/<span class="hs2-product__tag hs2-product__tag--preview"[^>]*>Example<\/span>/);
  assert.ok(tag, 'the gallery draws the preview label');
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  await page.route('**/*', r => r.request().url() === 'https://hs.test/' ? r.fulfill({contentType: 'text/html', body: `<!doctype html><style>${css}</style><main id="buy"><div class="hs2-product__media" data-hs2-media data-tib="on"><button data-hs2-thumb-preview aria-current="true"></button><button data-hs2-thumb aria-current="false"></button><div class="hs2-product__stage" data-hs2-stage><div class="hs2-product__tib" data-hs2-tib-gallery style="height:200px"></div>${tag[0]}</div></div>${html}<div class="tee-field--photo"><img class="tee-photo-image" src=""></div></main>`}) : r.abort());
  try {
    await page.goto('https://hs.test/');
    const fns = ['previewHasArt', 'artPhase', 'artWords', 'artElapsed', 'artStage', 'nudgeReview'].map(section).join('\n');
    const code = `var pending=false,saved=false,src='',state={hs3_lines:{meaning:'I wait by the door.'}},photoURL=${JSON.stringify(PHOTO)};function productId(){return 7;}function answer(k){return k==='dog'?'Pip':'';}
      function blanketNativeError(){return false;}function blanketArtPreview(){return false;}function cityArtSaved(){return saved;}function cityArtSource(){return src;}` + fns;
    await page.addScriptTag({content: minified ? transformSync(code, {minify: true}).code : code});
    const look = () => page.evaluate(() => { const m = document.querySelector('[data-hs2-media]'), t = document.querySelector('.hs2-product__tag--preview');
      return {show: m.getAttribute('data-show'), preview: m.querySelector('[data-hs2-thumb-preview]').getAttribute('aria-current'), label: getComputedStyle(t).display !== 'none' && t.getBoundingClientRect().width > 0}; });
    await page.evaluate(() => artStage(false));
    assert.deepEqual(await look(), {show: null, preview: 'true', label: true}, 'the buyer\'s words on show, the sample dog labeled');
    // the painting is in the preview: no label
    await page.evaluate(design => { src = design; document.querySelector('.tee-photo-image').setAttribute('src', design); artStage(false); }, DESIGN);
    assert.deepEqual(await look(), {show: null, preview: 'true', label: false}, 'their painting, unlabeled');
  } finally { await page.close(); }
});

// review of the fix above: on a page reached without the chat, the example is held; typing the note
// in Teeinblue's field then writes lines, and the hold must still let go once the painting runs
for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'} mug without the chat, note typed before painting: the painting still comes on show`, async () => {
  const html = await new Liquid().parseAndRender(readFileSync(new URL('shopify/snippets/hs-native-artwork.liquid', root), 'utf8'), {settings: {blanket_purchase: false, native_artwork_kind: 'mug'}});
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  await page.route('**/*', r => r.request().url() === 'https://hs.test/' ? r.fulfill({contentType: 'text/html', body: `<!doctype html><style>${css}</style><main id="buy"><div class="hs2-product__media" data-hs2-media data-tib="on"><button data-hs2-thumb-preview aria-current="true"></button><button data-hs2-thumb aria-current="false"></button><div class="hs2-product__stage" data-hs2-stage><div class="hs2-product__tib" data-hs2-tib-gallery style="height:200px"></div></div></div>${html}<div class="tee-field--photo"><img class="tee-photo-image" src=""></div></main>`}) : r.abort());
  try {
    await page.goto('https://hs.test/');
    const fns = ['previewHasArt', 'artPhase', 'artWords', 'artElapsed', 'artStage', 'nudgeReview'].map(section).join('\n');
    const code = `var pending=false,saved=false,src='',state={},reduced=false,photoURL=${JSON.stringify(PHOTO)};function productId(){return 7;}function answer(k){return k==='dog'?'Pip':'';}
      function blanketNativeError(){return false;}function blanketArtPreview(){return false;}function cityArtSaved(){return saved;}function cityArtSource(){return src;}` + fns;
    await page.addScriptTag({content: minified ? transformSync(code, {minify: true}).code : code});
    const show = () => page.evaluate(() => document.querySelector('[data-hs2-media]').getAttribute('data-show'));
    await page.evaluate(() => artStage(false));
    assert.equal(await show(), 'photo', 'held on the example');
    await page.evaluate(() => { state.hs3_lines = {line1: 'Morning, you.'}; artStage(false); });
    await page.evaluate(() => artStage(true));
    assert.equal(await show(), null, 'painting: the preview, under the wash');
    await page.evaluate(design => { src = design; saved = true; document.querySelector('.tee-photo-image').setAttribute('src', design); artStage(false); }, DESIGN);
    assert.equal(await show(), null, 'done: their painting on show');
    assert.equal(await page.evaluate(() => document.querySelector('[data-hs2-thumb-preview]').getAttribute('aria-current')), 'true');
  } finally { await page.close(); }
});

// 28 Oct: the photo the buyer gave Buddy is one choice (Krish: "the UI should absolutely really be asking
// if you want to add to that or use a different picture"). Real snippet and stylesheet: the card names the
// dog and says it starts the painting; Teeinblue's empty uploader is clip-hidden while it shows, never
// display:none; "Use a different photo" brings the field back and opens the picker in the same tap.
const has = name => source.includes('  function ' + name + '(');
const PHOTO_FNS = ['possessive', 'photoInput', 'blanketPurchaseStatus', 'photoCheck', 'photoNote', 'photoNoteSpot', 'photoNoteFill', 'photoHeld', 'photoReason', 'livePhotoInput', 'openPhotoPicker',
  'previewHasArt', 'artLines', 'artStage', 'updateBlanketPurchaseStatus', 'bindBlanketRecovery'].filter(has).map(section).join('\n');
const STANDINS = `var photoURL=${JSON.stringify(PHOTO)},usePhoto={file:new File(['x'],'pickle.jpg',{type:'image/jpeg'})},blanketAcceptedKey='',keepTibPhoto={},sent=0,journeys=0,overrides=0;
  function productId(){return 7;}function answer(k){return k==='dog'?'Pickle':'';}function nativeArtworkPurchase(){return true;}function blanketArtPreview(){return false;}
  function blanketUploadPending(){return false;}function nativeBlanketInputsReady(){return true;}function artRequested(){return false;}function cityArtSaved(){return false;}function cityArtSource(){return '';}
  function blanketNativeError(){return false;}function restoredArtworkAvailable(){return false;}function latestArtRequest(){return '';}function blanketReviewAccepted(){return false;}function blanketReviewKey(){return '';}
  function updatePortraitSignatureRecovery(){}function updateRestoredArtworkReview(){}function resetBlanketUpload(){return true;}function sendBlanketPhoto(){sent++;}function journeyCard(){journeys++;}function photoLog(){}
`;
async function photoPage(settings, body) {
  const html = await new Liquid().parseAndRender(readFileSync(new URL('shopify/snippets/hs-native-artwork.liquid', root), 'utf8'), {settings});
  const page = await browser.newPage({viewport: {width: 360, height: 640}}), outside = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => {
    if (r.request().url() === 'https://hs.test/') return r.fulfill({contentType: 'text/html', body: `<!doctype html><style>${css}</style>${body(html)}`});
    outside.push(r.request().url());
    return r.abort();
  });
  await page.goto('https://hs.test/');
  return {page, outside: () => outside.filter(u => !u.startsWith('data:')), errors};
}
for (const [kind, settings] of [['mug', {blanket_purchase: false, native_artwork_kind: 'mug'}], ['blanket', {blanket_purchase: true, native_artwork_kind: 'blanket'}]]) {
  for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'} ${kind}: the saved photo is one choice, and "Use a different photo" opens the picker in the same tap`, async () => {
    const {page, outside, errors} = await photoPage(settings, html => `<main id="buy">${html}<div class="tee-field--photo"><label for="tee-photo-1">Choose an image</label><input type="file" id="tee-photo-1" accept="image/*"></div></main>`);
    try {
      const code = STANDINS + PHOTO_FNS;
      await page.addScriptTag({content: minified ? transformSync(code, {minify: true}).code : code});
      await page.evaluate(() => { bindBlanketRecovery(); updateBlanketPurchaseStatus(); });
      const use = page.getByRole('button', {name: "Use Pickle's photo"}), other = page.getByRole('button', {name: 'Use a different photo'});
      assert.equal(await use.isVisible(), true, 'the primary names the dog'); assert.equal(await other.isVisible(), true);
      assert.equal(await page.getByText('Paint Pickle from this photo?').isVisible(), true);
      assert.equal(await page.getByText('This starts the painting.', {exact: false}).isVisible(), true, 'it says the tap starts a painting');
      const hidden = await page.evaluate(() => { const f = document.querySelector('.tee-field--photo'), r = f.getBoundingClientRect(); return {display: getComputedStyle(f).display, w: r.width, h: r.height, cls: document.getElementById('buy').classList.contains('hs2-photo-choice')}; });
      assert.notEqual(hidden.display, 'none', 'never display:none: iOS ignores click() on those');
      assert.ok(hidden.w <= 1 && hidden.h <= 1, `Teeinblue's empty uploader is clip-hidden (${hidden.w}x${hidden.h})`); assert.equal(hidden.cls, true);
      assert.equal(await page.locator('[data-hs2-artwork-status]').textContent(), 'Create artwork with your saved photo. Check the result before adding your gift.');
      assert.equal(await page.evaluate(() => journeys), 1, "the journey card's button is told the card is showing");
      const card = await page.locator('[data-hs2-blanket-photo]').boundingBox();
      assert.ok(card.x >= 0 && card.x + card.width <= 360, 'the card fits a 360 px phone');
      await page.screenshot({path: new URL(`${kind}-photo-choice.png`, out).pathname});
      const [chooser] = await Promise.all([page.waitForEvent('filechooser', {timeout: 3000}), other.click()]);
      assert.ok(chooser, 'the picker opened in the same tap');
      const shown = await page.evaluate(() => { updateBlanketPurchaseStatus(); const r = document.querySelector('.tee-field--photo').getBoundingClientRect(); return {w: r.width, h: r.height, cls: document.getElementById('buy').classList.contains('hs2-photo-choice')}; });
      assert.ok(shown.w > 1 && shown.h > 1, "Teeinblue's field is back for the new photo"); assert.equal(shown.cls, false);
      assert.match(await page.locator('[data-hs2-artwork-status]').textContent(), /^Add Pickle's photo below\. Buddy paints from it\.$/, 'the field is there again, so the status asks for the photo');
      await use.click();
      assert.equal(await page.evaluate(() => sent), 1, 'one tap on the primary sends the saved photo once');
      assert.deepEqual(outside(), []); assert.deepEqual(errors, []);
    } finally { await page.close(); }
  });
}
for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: a photo outcome lands under the journey button and right after Teeinblue's field, in one live region`, async () => {
  const {page, outside, errors} = await photoPage({blanket_purchase: false, native_artwork_kind: 'mug'}, html => `<div class="hs-journey" data-hs-journey><div class="hs-journey__card" data-hs-journey-card><button type="button" class="hs-journey__go hs-journey__photo" data-hs-journey-photo>Add Pickle's photo</button></div></div>
    <main id="buy">${html}<div class="tee-form"><div class="tee-field--photo"><input type="file" id="tee-photo-1"></div><div class="tee-field">Your note</div></div></main>`);
  try {
    const code = STANDINS + PHOTO_FNS;
    await page.addScriptTag({content: minified ? transformSync(code, {minify: true}).code : code});
    const message = "I couldn't spot a dog in this photo. If your dog is in it, you can still use it.";
    const placed = await page.evaluate(m => {
      photoNote(m, () => { overrides++; });
      const field = document.querySelector('.tee-field--photo'), card = document.querySelector('[data-hs-journey-card]');
      const inline = field.nextElementSibling, under = card.nextElementSibling;
      const live = [...document.querySelectorAll('[aria-live]')].filter(e => e.textContent.includes('spot a dog') && e.getClientRects().length);
      return {inline: inline && inline.matches('[data-hs2-photo-inline]') ? inline.textContent : null, inlineLive: inline && inline.getAttribute('aria-live'),
        under: under && under.matches('[data-hs-journey-photo-status]') ? under.textContent : null, underLive: under && under.getAttribute('aria-live'), live: live.length,
        box: document.querySelector('[data-hs2-photo-check]').hidden};
    }, message);
    assert.match(placed.inline, /couldn't spot a dog/); assert.match(placed.inline, /It's my dog\. Use this photo\./);
    assert.match(placed.under, /couldn't spot a dog/);
    assert.equal(placed.inlineLive, 'polite'); assert.equal(placed.underLive, null); assert.equal(placed.live, 1, 'a screen reader hears it once');
    assert.equal(placed.box, true, 'the box above the form stays empty');
    await page.screenshot({path: new URL('photo-note.png', out).pathname, fullPage: true});
    await page.locator('[data-hs-journey-photo-status]').getByRole('button', {name: "It's my dog. Use this photo."}).click();
    assert.equal(await page.evaluate(() => overrides), 1);
    assert.equal(await page.locator('[data-hs2-photo-inline]').isVisible(), false, 'the override clears every copy');
    // Teeinblue redraws its form: the next outcome goes after the new field
    const again = await page.evaluate(() => {
      document.querySelector('.tee-form').innerHTML = '<div class="tee-field--photo"><input type="file" id="tee-photo-2"></div>';
      photoNote("Your photo didn't reach the painter. Choose it again.");
      const next = document.querySelector('.tee-field--photo').nextElementSibling;
      return next && next.matches('[data-hs2-photo-inline]') ? next.querySelector('[data-hs-photo-note-text]').textContent : null;
    });
    assert.equal(again, "Your photo didn't reach the painter. Choose it again.");
    assert.deepEqual(outside(), []); assert.deepEqual(errors, []);
  } finally { await page.close(); }
});
