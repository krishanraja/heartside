// The on-device photo check on the product page (27 Oct): it runs before anything else, so a
// photo that can't make good artwork never reaches Teeinblue and never reserves the one upload;
// "It's my dog" lets a missed dog through; a warning still uploads. Same harness shape as
// blanket-native.test.mjs's upload tests, with the real keepTibPhoto, photoNote and photoCheck.
//
// 28 Oct (Krish's Android phone: "the photo would not add"): every outcome now shows where the buyer
// is, under the journey card's photo button and right after Teeinblue's photo field, with the real
// reason; a held pick clears the field; a field Teeinblue redrew during the check still gets the
// photo; a second pick replaces a running check; ?hsdebug=photo keeps an on-device log; the dog
// detector loads only after a pick.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const has = name => source.includes('  function ' + name + '(');
const flush = () => new Promise(resolve => setImmediate(resolve));
const NOTE = ['photoCheck', 'photoNote', 'photoNoteSpot', 'photoNoteFill', 'photoHeld', 'photoReason', 'livePhotoInput'].filter(has);
const LOG = ['photoLog', 'photoLogRead', 'photoLogOn', 'photoLogFile', 'photoLogLock'];
const FORTY_MP = 'No artwork was started. Use a JPEG, PNG or WebP photo up to 40 megapixels, then try again.';

function storage() {
  const map = new Map();
  return {map, getItem: k => map.has(k) ? map.get(k) : null, setItem: (k, v) => { map.set(k, String(v)); }, removeItem: k => { map.delete(k); }};
}
// a stand-in for one note spot: its text and its override button
function spot() { const text = {textContent: ''}, btn = {hidden: true, onclick: null}; return {hidden: true, text, btn, querySelector: s => s.includes('override') ? btn : text}; }

function harness(minified, verdicts, opts = {}) {
  let listener, pending = false, release, key = 'key';
  const raw = opts.raw || {type: 'image/jpeg', name: 'dog.jpg', size: 4200000, lastModified: 1}, clean = {type: 'image/jpeg', name: 'dog-artwork-source.jpg'};
  const vendor = [], vendorInputs = [], checked = [], tracked = [], status = [], logs = [], order = [];
  const usePhoto = () => {}; usePhoto.file = raw;
  const makeInput = id => ({id, type: 'file', matches: () => true, isConnected: true, files: [raw], value: 'chosen', disabled: false,
    dispatchEvent(event) { event.target = this; listener(event); if (!event.blocked) { vendor.push(this.files[0]); vendorInputs.push(this.id); order.push('vendor'); } }});
  const input = makeInput('tee-photo-1'), redrawn = makeInput('tee-photo-2');
  let live = input;
  const box = {hidden: true, text: {textContent: ''}, btn: {hidden: true, onclick: null}, querySelector(s) { return s.includes('override') ? this.btn : this.text; }};
  const inline = spot(), journey = spot();
  const field = {nextElementSibling: inline, insertAdjacentElement() {}}, card = {nextElementSibling: journey, insertAdjacentElement() {}}, go = {closest: () => card};
  const spots = {'[data-hs2-photo-check]': box, '[data-hs2-photo-inline]': inline, '[data-hs-journey-photo-status]': journey, '[data-hs-journey-photo]': go, '.tee-field--photo': field};
  const session = storage();
  const ctx = {
    window: {
      HSPhotoQuality: {check: file => { checked.push(file); const v = verdicts.shift(); return v && v.then ? v : Promise.resolve(v); }},
      HSArtworkPhoto: {prepare: () => new Promise((resolve, reject) => { release = outcome => outcome instanceof Error ? reject(outcome) : resolve({file: clean, photo: {metadataRemoved: true}, width: 4000, height: 3000, uploadWidth: 4000, uploadHeight: 3000, uploadBytes: 2100000}); })},
      sessionStorage: session, location: {search: opts.search || ''}
    },
    URLSearchParams,
    document: {addEventListener: (name, fn) => { if (name === 'change') listener = fn; }, querySelector: s => (opts.noField && (s === '.tee-field--photo' || s === '[data-hs2-photo-inline]')) ? null : spots[s] || null},
    doHandoff: {}, nativeArtworkPurchase: () => true, blanketUploadPending: () => pending, nativeBlanketInputsReady: () => true,
    beginBlanketUpload: () => { if (pending) return false; pending = true; return true; }, resetBlanketUpload: () => { pending = false; ctx.keepTibPhoto.preparing = null; return true; },
    blanketUploadSent: () => { order.push('sent'); return true; },
    artRequestKey: () => key, photoInput: () => live, blanketPurchaseStatus: m => status.push(m), usePhoto, markHanded: () => {}, cityArtPreview: () => false,
    markArtRequested: () => {}, state: {}, save: () => {}, savePhoto: () => {}, track: (name) => tracked.push(name), productId: () => 7,
    answer: k => k === 'dog' ? 'Pip' : '', possessive: n => /s$/i.test(n) ? n + "'" : n + "'s",
    photoLog: (stage, data) => logs.push([stage, data]), photoLogOn: () => false, photoLogFile: () => ({}), photoLogLock: () => '',
    photoLogStart: () => {}, photoLogDraw: () => {},
    DataTransfer: class { constructor() { this.files = []; this.items = {add: file => this.files.push(file)}; } },
    Event: class { constructor(type) { this.type = type; } preventDefault() { this.blocked = true; } stopImmediatePropagation() { this.blocked = true; } }
  };
  const names = NOTE.concat(opts.realLog ? LOG.filter(has) : [], ['keepTibPhoto']);
  if (opts.realLog) { delete ctx.photoLog; delete ctx.photoLogOn; }
  const code = names.map(section).join('\n');
  vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, ctx);
  ctx.keepTibPhoto();
  return {ctx, input, redrawn, box, inline, journey, vendor, vendorInputs, checked, tracked, status, logs, order, clean, raw, session,
    pending: () => pending, release: outcome => release && release(outcome), changeKey: () => { key = 'changed'; }, redraw: to => { input.isConnected = false; live = to; }};
}
const reason = (code, message) => ({code, message});
const pick = h => { h.input.dispatchEvent(new h.ctx.Event('change')); return flush(); };

for (const minified of [false, true]) {
  const mode = minified ? 'minified' : 'source';
  test(`${mode}: a rejected photo never reaches Teeinblue and never reserves the upload`, async () => {
    for (const r of [{verdict: 'reject', overridable: false, reasons: [reason('blur', 'This photo is too blurry.')]},
                     {verdict: 'reject', overridable: false, reasons: [reason('size', 'This photo is too small.')]},
                     {verdict: 'reject', overridable: false, reasons: [reason('heic', 'This photo is saved as HEIC.')]},
                     {verdict: 'reject', overridable: false, reasons: [reason('dark', 'This photo is too dark.')]}]) {
      const h = harness(minified, [r]);
      await pick(h);
      assert.deepEqual(h.vendor, [], 'no file reached the vendor');
      assert.equal(h.pending(), false, 'the one upload is not reserved');
      assert.equal(h.input.value, '', 'the file input is cleared');
      assert.equal(h.inline.hidden, false); assert.equal(h.inline.text.textContent, r.reasons[0].message);
      assert.equal(h.inline.btn.hidden, true, 'a hard reject has no override');
    }
  });
  test(`${mode}: a photo outcome shows under the button tapped and right after Teeinblue's field, with the override in both`, async () => {
    const h = harness(minified, [{verdict: 'reject', overridable: true, reasons: [reason('nodog', "I couldn't spot a dog in this photo.")]}]);
    await pick(h);
    for (const [where, s] of [['after the photo field', h.inline], ['under the journey button', h.journey]]) {
      assert.equal(s.hidden, false, where); assert.equal(s.text.textContent, "I couldn't spot a dog in this photo.", where);
      assert.equal(s.btn.hidden, false, `the override is reachable ${where}`); assert.equal(typeof s.btn.onclick, 'function');
    }
    assert.equal(h.box.hidden, true, 'the old box above the form is not a second copy');
    assert.equal(h.input.value, '', 'cleared, so the same photo can be chosen again');
    // before Teeinblue draws its field, the box in our snippet holds the words instead
    const early = harness(minified, [{verdict: 'reject', overridable: false, reasons: [reason('blur', 'This photo is too blurry.')]}], {noField: true});
    await pick(early);
    assert.equal(early.box.hidden, false); assert.equal(early.box.text.textContent, 'This photo is too blurry.'); assert.equal(early.inline.hidden, true);
  });
  test(`${mode}: "It's my dog" sends a photo the detector missed, once, through the normal preparation`, async () => {
    for (const from of ['inline', 'journey']) {
      const h = harness(minified, [{verdict: 'reject', overridable: true, reasons: [reason('nodog', "I couldn't spot a dog in this photo.")]}, {verdict: 'reject', overridable: true, reasons: [reason('nodog', '')]}]);
      await pick(h);
      assert.deepEqual(h.vendor, []);
      const first = h[from].btn.onclick, other = (from === 'inline' ? h.journey : h.inline).btn.onclick;
      first(); other(); await flush();
      assert.equal(h.pending(), true, 'the override goes on to preparation');
      assert.equal(h.checked.length, 2, 'one more check, not two, for a double tap');
      h.release(); await flush();
      assert.deepEqual(h.vendor, [h.clean], 'exactly one vendor event, with the cleaned file');
      assert.ok(h.tracked.includes('photo_override'));
    }
  });
  test(`${mode}: a warning shows and the photo still goes through; no checker means the old path`, async () => {
    const h = harness(minified, [{verdict: 'warn', overridable: false, reasons: [reason('soft', 'This photo looks a little soft.')]}]);
    await pick(h);
    assert.equal(h.inline.text.textContent, 'This photo looks a little soft.');
    h.release(); await flush();
    assert.deepEqual(h.vendor, [h.clean]); assert.equal(h.checked.length, 1);
    assert.equal(h.inline.text.textContent, 'This photo looks a little soft.', 'the warning stays after the photo goes on');
    const none = harness(minified, []); delete none.ctx.window.HSPhotoQuality;
    await pick(none); none.release(); await flush();
    assert.deepEqual(none.vendor, [none.clean], 'without the checker the upload works as before');
  });
  test(`${mode}: a preparation failure says the real reason at the field, never one sentence for every cause`, async () => {
    const code = (c, m = c) => Object.assign(new Error(m), {code: c});
    for (const [what, outcome, expect, raw] of [
      ['over 40 megapixels', code('megapixels'), /over 40 megapixels/],
      ['unreadable', code('unreadable'), /couldn't open this photo/],
      ['canvas ran out', new Error('Photo preparation failed'), /couldn't get this photo ready in this browser/],
      ['HEIC with no checker', code('type'), /saved as HEIC/, {type: 'image/heic', name: 'PXL_20261028.heic', size: 2e6}],
      ['HEIC by name only', code('type'), /saved as HEIC/, {type: '', name: 'IMG_0042.HEIC', size: 2e6}],
      ['choices changed', 'changed', /Your choices changed while I was getting the photo ready\. Choose it again\./]]) {
      const h = harness(minified, [], {raw}); delete h.ctx.window.HSPhotoQuality;
      await pick(h);
      assert.equal(h.pending(), true, what);
      if (outcome === 'changed') { h.changeKey(); h.release(); } else h.release(outcome);
      await flush();
      assert.deepEqual(h.vendor, [], what); assert.equal(h.pending(), false, what); assert.equal(h.input.value, '', what);
      assert.equal(h.inline.hidden, false, what); assert.match(h.inline.text.textContent, expect, what);
      assert.match(h.journey.text.textContent, expect, `${what}: under the journey button too`);
      assert.ok(!h.status.includes(FORTY_MP) && h.inline.text.textContent !== FORTY_MP, `${what}: not the 40 megapixel sentence`);
    }
  });
  test(`${mode}: a pick held behind the current photo is cleared and says why`, async () => {
    const h = harness(minified, []); delete h.ctx.window.HSPhotoQuality;
    await pick(h);
    h.input.value = 'second'; await pick(h);
    assert.equal(h.input.value, '', 'cleared, so choosing the same photo again fires a change');
    assert.match(h.inline.text.textContent, /still getting your last photo ready/);
    h.release(); await flush();
    assert.deepEqual(h.vendor, [h.clean], 'still one vendor event, from the first pick');
  });
  test(`${mode}: a field Teeinblue redrew during the check still gets the photo, or the buyer is told`, async () => {
    let finish;
    const h = harness(minified, [new Promise(resolve => { finish = resolve; })]);
    await pick(h);
    h.redraw(h.redrawn); finish({verdict: 'ok', overridable: false, reasons: []}); await flush();
    h.release(); await flush();
    assert.deepEqual(h.vendor, [h.clean], 'one vendor event');
    assert.deepEqual(h.vendorInputs, ['tee-photo-2'], 'on the live input');
    let end;
    const gone = harness(minified, [new Promise(resolve => { end = resolve; })]);
    await pick(gone);
    gone.redraw(null); end({verdict: 'ok', overridable: false, reasons: []}); await flush();
    assert.deepEqual(gone.vendor, []); assert.equal(gone.input.value, '');
    assert.equal(gone.inline.text.textContent, "Your photo didn't reach the painter. Choose it again.");
    assert.equal(gone.pending(), false, 'nothing reserved');
  });
  test(`${mode}: a second pick while a check runs replaces the first instead of being dropped`, async () => {
    let first, second;
    const h = harness(minified, [new Promise(resolve => { first = resolve; }), new Promise(resolve => { second = resolve; })]);
    await pick(h);
    const newer = {type: 'image/jpeg', name: 'better.jpg', size: 3e6};
    h.input.files = [newer]; await pick(h);
    assert.equal(h.checked.length, 2, 'the newer photo is checked too');
    second({verdict: 'ok', overridable: false, reasons: []}); await flush();
    first({verdict: 'reject', overridable: false, reasons: [reason('blur', 'This photo is too blurry.')]}); await flush();
    assert.equal(h.inline.text.textContent, "Getting Pip's photo ready and removing its location data.", 'the older result is ignored');
    h.release(); await flush();
    assert.deepEqual(h.vendor, [h.clean], 'one vendor event, for the newer photo');
  });
  test(`${mode}: a check that runs out of time fails open, the photo goes on, and the log says so`, async () => {
    const h = harness(minified, [{verdict: 'ok', overridable: false, reasons: [], metrics: null, detection: null, timedOut: true}]);
    await pick(h); h.release(); await flush();
    assert.deepEqual(h.vendor, [h.clean]);
    assert.ok(h.logs.some(([stage]) => stage === 'check:timeout'), JSON.stringify(h.logs.map(l => l[0])));
    // a checker that throws never leaves the buyer on "Checking": the photo goes on, as after a timeout
    const broken = harness(minified, [{then: (ok, fail) => fail(new Error('WebGL context lost'))}]);
    await pick(broken); broken.release(); await flush();
    assert.deepEqual(broken.vendor, [broken.clean]);
    assert.ok(broken.logs.some(([stage]) => stage === 'check:error'));
  });
  test(`${mode}: the lock reads sent before the vendor's change event, once per pick`, async () => {
    const h = harness(minified, [{verdict: 'ok', overridable: false, reasons: []}]);
    await pick(h); h.release(); await flush();
    assert.deepEqual(h.order, ['sent', 'vendor']);
  });
  test(`${mode}: ?hsdebug=photo keeps an on-device log of each stage; off by default it writes nothing`, async () => {
    const fetched = [];
    const h = harness(minified, [{verdict: 'ok', overridable: false, reasons: []}], {realLog: true, search: '?hsdebug=photo'});
    h.ctx.fetch = h.ctx.window.fetch = (...a) => fetched.push(a);
    await pick(h); h.release(); await flush();
    const log = JSON.parse(h.session.getItem('hs-photo-log'));
    assert.deepEqual(log.map(e => e.s), ['change', 'check', 'check:ok', 'change', 'prepare', 'prepare:ok', 'vendor']);
    assert.equal(log[0].type, 'image/jpeg'); assert.equal(log[0].size, 4200000); assert.equal(log[0].branch, 'check'); assert.equal(log[0].id, 'tee-photo-1');
    assert.equal(log[3].branch, 'prepare'); assert.match(log[4].lock, /"stage":"preparing"|none|key/);
    assert.equal(log[5].bytes, 2100000);
    assert.equal(h.session.getItem('hs-debug'), 'photo', 'the flag survives a reload in this tab');
    assert.deepEqual(fetched, [], 'nothing leaves the device');
    for (const e of log) for (const v of Object.values(e)) assert.ok(typeof v !== 'string' || !/^data:|base64/.test(v), 'no pixels');
    const off = harness(minified, [{verdict: 'ok', overridable: false, reasons: []}], {realLog: true});
    await pick(off); off.release(); await flush();
    assert.equal(off.session.map.size, 0, 'off by default: nothing stored');
    const stop = harness(minified, [], {realLog: true, search: '?hsdebug=off'});
    stop.session.setItem('hs-debug', 'photo'); stop.session.setItem('hs-photo-log', '[]');
    vm.runInNewContext('photoLogOn.on = undefined; photoLogOn();', stop.ctx);
    assert.equal(stop.session.getItem('hs-debug'), null); assert.equal(stop.session.getItem('hs-photo-log'), null);
  });
  test(`${mode}: the dog detector loads only after a photo is picked, never as the photo step scrolls into view`, () => {
    let loads = 0, docChange = null, observed = 0;
    const field = {};
    const ctx = {window: {HSPhotoQuality: {loadDetector: () => { loads++; return Promise.resolve(null); }}, IntersectionObserver: class { constructor(fn) { this.fn = fn; } observe() { observed++; this.fn([{isIntersecting: true}]); } disconnect() {} }},
      IntersectionObserver: class { constructor(fn) { this.fn = fn; } observe() { observed++; this.fn([{isIntersecting: true}]); } disconnect() {} },
      navigator: {connection: {}, deviceMemory: 4}, setInterval: fn => { fn(); return 1; }, clearInterval: () => {}, nativeArtworkPurchase: () => true, photoLog: () => {}, Date,
      document: {addEventListener: (name, fn) => { if (name === 'change') docChange = fn; if (name === 'pointerdown') ctx.pointer = fn; }, removeEventListener() {}, querySelector: s => s === '.tee-field--photo' ? field : null}};
    vm.runInNewContext(minified ? transformSync(section('warmPhotoCheck'), {minify: true}).code : section('warmPhotoCheck'), ctx);
    ctx.warmPhotoCheck();
    if (ctx.pointer) ctx.pointer({target: {closest: () => field}});
    assert.equal(loads, 0, 'scrolling to or touching the photo step loads nothing');
    assert.equal(typeof docChange, 'function', 'it waits for a pick');
    docChange({target: {type: 'file', matches: () => true, files: [{type: 'image/jpeg'}]}});
    assert.equal(loads, 1, 'the pick starts it');
  });
}

test('the in-app class never matches Edge or Chrome on Android', () => {
  const regex = new RegExp(/var inApp = \/(.+)\/i\.test/.exec(source)[1], 'i');
  assert.equal(regex.test('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 EdgA/130.0.0.0'), false);
  assert.equal(regex.test('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'), false);
});
test('photo outcome copy follows the house rules', () => {
  const code = ['photoHeld', 'photoReason', 'photoNote', 'openPhotoPicker', 'keepTibPhoto', 'sendBlanketPhoto'].filter(has).map(section).join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
  const words = code.match(/(['"])(?:(?!\1)[^\\]|\\.)*\1/g).filter(s => / /.test(s));
  assert.ok(words.length > 10);
  for (const w of words) { assert.doesNotMatch(w, /!(\s|$|['"])|\u2014|\u2013/, w); assert.doesNotMatch(w, /colour|personalis|favourite|grey/i, w); }
});
