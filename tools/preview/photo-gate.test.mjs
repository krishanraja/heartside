// The on-device photo check on the product page (27 Oct): it runs before anything else, so a
// photo that can't make good artwork never reaches Teeinblue and never reserves the one upload;
// "It's my dog" lets a missed dog through; a warning still uploads. Same harness shape as
// blanket-native.test.mjs's upload tests, with the real keepTibPhoto and photoCheck.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const flush = () => new Promise(resolve => setImmediate(resolve));

function harness(minified, verdicts) {
  let listener, pending = false, release;
  const raw = {type: 'image/jpeg', name: 'dog.jpg'}, clean = {type: 'image/png', name: 'dog-artwork-source.png'}, vendor = [], checked = [], tracked = [];
  const usePhoto = () => {}; usePhoto.file = raw;
  const input = {type: 'file', matches: () => true, isConnected: true, files: [raw], value: 'chosen', dispatchEvent: event => { event.target = input; listener(event); if (!event.blocked) vendor.push(input.files[0]); }};
  const box = {hidden: true, text: {textContent: ''}, btn: {hidden: true, onclick: null}, querySelector(s) { return s.includes('override') ? this.btn : this.text; }};
  const ctx = {
    window: {
      HSPhotoQuality: {check: file => { checked.push(file); return Promise.resolve(verdicts.shift()); }},
      HSArtworkPhoto: {prepare: () => new Promise(resolve => { release = () => resolve({file: clean, photo: {metadataRemoved: true}, width: 10, height: 20}); })}
    },
    document: {addEventListener: (name, fn) => { if (name === 'change') listener = fn; }, querySelector: s => s === '[data-hs2-photo-check]' ? box : null},
    doHandoff: {}, nativeArtworkPurchase: () => true, blanketUploadPending: () => pending, nativeBlanketInputsReady: () => true,
    beginBlanketUpload: () => { if (pending) return false; pending = true; return true; }, resetBlanketUpload: () => { pending = false; return true; },
    artRequestKey: () => 'key', photoInput: () => input, blanketPurchaseStatus: () => {}, usePhoto, markHanded: () => {}, cityArtPreview: () => false,
    markArtRequested: () => {}, state: {}, save: () => {}, savePhoto: () => {}, track: (name, data) => tracked.push(name),
    DataTransfer: class { constructor() { this.files = []; this.items = {add: file => this.files.push(file)}; } },
    Event: class { constructor(type) { this.type = type; } preventDefault() { this.blocked = true; } stopImmediatePropagation() { this.blocked = true; } }
  };
  const code = ['photoCheck', 'keepTibPhoto'].map(section).join('\n');
  vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, ctx);
  ctx.keepTibPhoto();
  return {ctx, input, box, vendor, checked, tracked, clean, pending: () => pending, release: () => release && release()};
}
const reason = (code, message) => ({code, message});

for (const minified of [false, true]) {
  const mode = minified ? 'minified' : 'source';
  test(`${mode}: a rejected photo never reaches Teeinblue and never reserves the upload`, async () => {
    for (const r of [{verdict: 'reject', overridable: false, reasons: [reason('blur', 'This photo is too blurry.')]},
                     {verdict: 'reject', overridable: false, reasons: [reason('size', 'This photo is too small.')]},
                     {verdict: 'reject', overridable: false, reasons: [reason('dark', 'This photo is too dark.')]}]) {
      const h = harness(minified, [r]);
      h.input.dispatchEvent(new h.ctx.Event('change')); await flush();
      assert.deepEqual(h.vendor, [], 'no file reached the vendor');
      assert.equal(h.pending(), false, 'the one upload is not reserved');
      assert.equal(h.input.value, '', 'the file input is cleared');
      assert.equal(h.box.hidden, false); assert.equal(h.box.text.textContent, r.reasons[0].message);
      assert.equal(h.box.btn.hidden, true, 'a hard reject has no override');
    }
  });
  test(`${mode}: "It's my dog" sends a photo the detector missed, once, through the normal preparation`, async () => {
    const h = harness(minified, [{verdict: 'reject', overridable: true, reasons: [reason('nodog', "I couldn't spot a dog in this photo.")]}, {verdict: 'reject', overridable: true, reasons: [reason('nodog', '')]}]);
    h.input.dispatchEvent(new h.ctx.Event('change')); await flush();
    assert.deepEqual(h.vendor, []); assert.equal(h.box.btn.hidden, false);
    h.box.btn.onclick(); await flush();
    assert.equal(h.pending(), true, 'the override goes on to preparation');
    h.release(); await flush();
    assert.deepEqual(h.vendor, [h.clean], 'exactly one vendor event, with the cleaned file');
    assert.ok(h.tracked.includes('photo_override'));
  });
  test(`${mode}: a warning shows and the photo still goes through; no checker means the old path`, async () => {
    const h = harness(minified, [{verdict: 'warn', overridable: false, reasons: [reason('soft', 'This photo looks a little soft.')]}]);
    h.input.dispatchEvent(new h.ctx.Event('change')); await flush();
    assert.equal(h.box.text.textContent, 'This photo looks a little soft.');
    h.release(); await flush();
    assert.deepEqual(h.vendor, [h.clean]); assert.equal(h.checked.length, 1);
    const none = harness(minified, []); delete none.ctx.window.HSPhotoQuality;
    none.input.dispatchEvent(new none.ctx.Event('change')); await flush(); none.release(); await flush();
    assert.deepEqual(none.vendor, [none.clean], 'without the checker the upload works as before');
  });
}
