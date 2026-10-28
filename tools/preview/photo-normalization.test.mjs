// The photo the painter receives (hs-artwork-photo.js), in a real browser with every request off
// localhost aborted. 28 Oct: a camera original used to become a full-size PNG of 13 to 25 MB (no
// cap); it is now capped at 4096 px on the long side and sent as a JPEG at 0.92, with a JPEG check
// that refuses EXIF, XMP, IPTC and comment segments the way checkPNG refuses PNG text chunks. A photo
// already within the cap keeps its size. Safari's encoder writes its own Exif and Photoshop blocks on
// every canvas JPEG, which the check refused for every photo (28 Oct review): they are cut first.
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs-artwork-photo.js', import.meta.url), 'utf8');
// The header Apple's ImageIO writes on every canvas JPEG (WebKit encodes canvas output through it on
// iPhone and Mac, so Safari and every iPhone browser): JFIF at 72 dpi, an Exif block holding only
// ColorSpace (sRGB), PixelXDimension and PixelYDimension, and a Photoshop 3.0 block holding an empty
// IPTC record and its MD5 digest. Chromium's encoder writes none of it. OBSERVED is that header as
// found in Apple-made JPEGs, for a 1 x 1 canvas (28 Oct review).
const OBSERVED = '/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+';
function appleHead(width, height) {
  const u32 = n => [n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255], text = s => [...Buffer.from(s, 'latin1')];
  const seg = (marker, body) => [0xFF, marker, (body.length + 2) >> 8, (body.length + 2) & 255, ...body];
  const exif = [...text('Exif\0\0MM\0*'), 0, 0, 0, 8, 0, 1, 0x87, 0x69, 0, 4, ...u32(1), ...u32(26), ...u32(0),
    0, 3, 0xA0, 0x01, 0, 3, ...u32(1), 0, 1, 0, 0, 0xA0, 0x02, 0, 4, ...u32(1), ...u32(width), 0xA0, 0x03, 0, 4, ...u32(1), ...u32(height), ...u32(0)];
  const iptc = [...text('Photoshop 3.0\x008BIM'), 4, 4, 0, 0, ...u32(0), ...text('8BIM'), 4, 0x25, 0, 0, ...u32(16), ...Buffer.from('d41d8cd98f00b204e9800998ecf8427e', 'hex')];
  return Buffer.from([0xFF, 0xD8, ...seg(0xE0, [...text('JFIF\0'), 1, 1, 0, 0, 0x48, 0, 0x48, 0, 0]), ...seg(0xE1, exif), ...seg(0xED, iptc)]);
}
test('the Apple stand-in header is the one found in Apple-made JPEGs', () => {
  assert.equal(appleHead(1, 1).toString('base64'), OBSERVED);
});
// 28 Oct review: a read or decode that never settled held the photo step, and every later pick, until
// a reload. A decode that never finishes, as photo-quality.test.mjs models it, in a bare context.
for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: a decode that never settles fails with code timeout within the limit, and a late one is dropped`, async () => {
  let finish, drawn = 0, closed = 0;
  const ctx = vm.createContext({window: {crypto: {subtle: {digest: async () => new ArrayBuffer(32)}}}, setTimeout, clearTimeout, File: class {},
    createImageBitmap: () => new Promise(resolve => { finish = resolve; }), document: {createElement: () => { drawn++; throw new Error('drawn after the limit'); }}});
  vm.runInContext(minified ? transformSync(source, {minify: true}).code : source, ctx);
  const photo = {type: 'image/jpeg', name: 'cloud-photo.jpg', arrayBuffer: async () => new ArrayBuffer(8)}, started = Date.now();
  const outcome = await Promise.race([ctx.window.HSArtworkPhoto.prepare(photo, {timeout: 60}).then(() => 'prepared', e => e),
    new Promise(resolve => setTimeout(() => resolve('still waiting'), 1000))]);
  assert.notEqual(outcome, 'still waiting', 'it settles');
  assert.equal(outcome.code, 'timeout'); assert.ok(Date.now() - started < 600, `${Date.now() - started} ms`);
  assert.equal(ctx.window.HSArtworkPhoto.timeout, 20000, 'twenty seconds on the page');
  finish({width: 4000, height: 3000, close() { closed++; }});
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.deepEqual([drawn, closed], [0, 1], 'the late decode draws nothing and is let go');
});
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

async function open(minified) {
  const page = await browser.newPage(), outside = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url === 'http://localhost/') return route.fulfill({contentType: 'text/html', body: '<!doctype html><title>Local photo normalization test</title>'});
    if (!url.startsWith('http://localhost/')) outside.push(url);
    return route.abort();
  });
  await page.goto('http://localhost/');
  await page.addScriptTag({content: minified ? transformSync(source, {minify: true}).code : source});
  return {page, outside, errors};
}

for (const minified of [false, true]) {
  const mode = minified ? 'minified' : 'source';
  test(`${mode}: a photo within the cap keeps its size, loses its metadata and keeps its look as a JPEG`, async () => {
    const {page, outside, errors} = await open(minified);
    try {
      const result = await page.evaluate(async () => {
        const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 32;
        const context = canvas.getContext('2d'); context.fillStyle = '#3166a1'; context.fillRect(0, 0, 64, 32); context.clearRect(4, 5, 7, 8);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const payload = new TextEncoder().encode('Comment\0synthetic-private-location');
        const chunk = new Uint8Array(payload.length + 12), view = new DataView(chunk.buffer);
        view.setUint32(0, payload.length); chunk.set(new TextEncoder().encode('tEXt'), 4); chunk.set(payload, 8);
        let crc = 0xffffffff;
        for (const byte of chunk.slice(4, -4)) { crc ^= byte; for (let j = 0; j < 8; j++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1; }
        view.setUint32(chunk.length - 4, (crc ^ 0xffffffff) >>> 0);
        const file = new File([bytes.slice(0, -12), chunk, bytes.slice(-12)], 'private-original.png', {type: 'image/png'});
        const prepared = await window.HSArtworkPhoto.prepare(file);
        const output = new Uint8Array(await prepared.file.arrayBuffer());
        window.HSArtworkPhoto.checkJPEG(output.buffer);
        const bitmap = await createImageBitmap(prepared.file);
        const back = document.createElement('canvas'); back.width = bitmap.width; back.height = bitmap.height;
        const b = back.getContext('2d'); b.drawImage(bitmap, 0, 0); bitmap.close();
        const px = b.getImageData(0, 0, 64, 32).data;
        // the photo as it looks: the clear corner reads as white, the rest as the blue it was
        let worst = 0;
        for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) {
          if (x < 16 && y < 16) continue; // the clear corner's own 16 px JPEG block carries its edge
          const i = (y * 64 + x) * 4;
          worst = Math.max(worst, Math.abs(px[i] - 0x31), Math.abs(px[i + 1] - 0x66), Math.abs(px[i + 2] - 0xa1));
        }
        const i = (9 * 64 + 7) * 4;
        return {width: prepared.width, height: prepared.height, uploadWidth: prepared.uploadWidth, uploadHeight: prepared.uploadHeight, decoded: back.width + 'x' + back.height,
          metadataRemoved: prepared.photo.metadataRemoved, type: prepared.file.type, name: prepared.file.name,
          distinctHashes: /^[a-f0-9]{64}$/.test(prepared.photo.originalHash) && prepared.photo.originalHash !== prepared.photo.uploadHash,
          worst, clearCorner: px[i] > 235 && px[i + 1] > 235 && px[i + 2] > 235 && px[i + 3] === 255,
          sourceTextRemains: new TextDecoder().decode(output).includes('synthetic-private-location')};
      });
      assert.deepEqual(result, {width: 64, height: 32, uploadWidth: 64, uploadHeight: 32, decoded: '64x32', metadataRemoved: true, type: 'image/jpeg', name: 'dog-artwork-source.jpg',
        distinctHashes: true, worst: result.worst, clearCorner: true, sourceTextRemains: false});
      assert.ok(result.worst <= 12, `the colors survive the JPEG (worst channel difference ${result.worst})`);
      assert.deepEqual(outside, []); assert.deepEqual(errors, []);
    } finally { await page.close(); }
  });
  test(`${mode}: a camera-size original is capped at 4096 px and arrives as a JPEG of a few MB, not a full-size PNG`, async () => {
    const {page, outside, errors} = await open(minified);
    try {
      const result = await page.evaluate(async () => {
        // 5000 x 3750 (18.75 MP), a gradient with per-pixel noise, saved the way a camera would
        const w = 5000, h = 3750, canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
        const context = canvas.getContext('2d'), image = context.createImageData(w, h), d = image.data; let seed = 11;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff; const n = (seed >> 16) % 25 - 12, i = (y * w + x) * 4;
          d[i] = (x * 255 / w + n) | 0; d[i + 1] = (y * 255 / h + n) | 0; d[i + 2] = (128 + n) | 0; d[i + 3] = 255;
        }
        context.putImageData(image, 0, 0);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        const original = new File([blob], 'PXL_20261028_131400.jpg', {type: 'image/jpeg'});
        const started = performance.now();
        const prepared = await window.HSArtworkPhoto.prepare(original);
        const ms = performance.now() - started, output = await prepared.file.arrayBuffer();
        window.HSArtworkPhoto.checkJPEG(output);
        const bitmap = await createImageBitmap(prepared.file), decoded = bitmap.width + 'x' + bitmap.height; bitmap.close();
        return {width: prepared.width, height: prepared.height, uploadWidth: prepared.uploadWidth, uploadHeight: prepared.uploadHeight, decoded, type: prepared.file.type,
          bytes: prepared.file.size, uploadBytes: prepared.uploadBytes, sourceBytes: prepared.sourceBytes, originalSize: original.size, ms};
      });
      assert.deepEqual([result.width, result.height], [5000, 3750], 'the source size is kept for the record');
      assert.deepEqual([result.uploadWidth, result.uploadHeight, result.decoded], [4096, 3072, '4096x3072'], 'the long side is capped at 4096 px');
      assert.equal(result.type, 'image/jpeg');
      assert.ok(result.bytes <= 12e6, `the upload is ${(result.bytes / 1e6).toFixed(1)} MB`);
      assert.equal(result.uploadBytes, result.bytes); assert.equal(result.sourceBytes, result.originalSize);
      assert.deepEqual(outside, []); assert.deepEqual(errors, []);
    } finally { await page.close(); }
  });
  test(`${mode}: the JPEG check refuses EXIF and XMP, IPTC, comments and trailing bytes, and the cleaned photo has none`, async () => {
    const {page, outside, errors} = await open(minified);
    try {
      const result = await page.evaluate(async () => {
        const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
        const c = canvas.getContext('2d'); c.fillStyle = '#8a4a2b'; c.fillRect(0, 0, 640, 480); c.fillStyle = '#e3d3bf'; c.fillRect(100, 80, 300, 200);
        const jpeg = new Uint8Array(await (await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))).arrayBuffer());
        const segment = (marker, text) => { const body = new TextEncoder().encode(text), s = new Uint8Array(body.length + 4); s[0] = 0xFF; s[1] = marker; s[2] = (body.length + 2) >> 8; s[3] = (body.length + 2) & 255; s.set(body, 4); return s; };
        const withSegment = (marker, text) => { const s = segment(marker, text), out = new Uint8Array(jpeg.length + s.length); out.set(jpeg.slice(0, 2)); out.set(s, 2); out.set(jpeg.slice(2), 2 + s.length); return out; };
        const refuse = bytes => { try { window.HSArtworkPhoto.checkJPEG(bytes.slice().buffer); return 'passed'; } catch (e) { return e.message; } };
        const exif = withSegment(0xE1, 'Exif\0\0GPS synthetic-private-location');
        const prepared = await window.HSArtworkPhoto.prepare(new File([exif], 'with-location.jpg', {type: 'image/jpeg'}));
        const output = new Uint8Array(await prepared.file.arrayBuffer());
        const trailing = new Uint8Array(jpeg.length + 1); trailing.set(jpeg);
        return {plain: refuse(jpeg), exif: refuse(exif), xmp: refuse(withSegment(0xE1, 'http://ns.adobe.com/xap/1.0/\0<x:xmpmeta/>')), iptc: refuse(withSegment(0xED, 'Photoshop 3.0\0')),
          comment: refuse(withSegment(0xFE, 'synthetic comment')), trailing: refuse(trailing), png: refuse(new Uint8Array([0x89, 0x50, 0x4E, 0x47])),
          cleaned: refuse(output), locationRemains: new TextDecoder().decode(output).includes('synthetic-private-location')};
      });
      assert.equal(result.plain, 'passed', 'a browser JPEG passes');
      for (const k of ['exif', 'xmp', 'iptc', 'comment']) assert.match(result[k], /metadata/, k);
      assert.match(result.trailing, /boundary/); assert.match(result.png, /JPEG/);
      assert.equal(result.cleaned, 'passed'); assert.equal(result.locationRemains, false);
      assert.deepEqual(outside, []); assert.deepEqual(errors, []);
    } finally { await page.close(); }
  });
  test(`${mode}: Safari's own canvas JPEG, with ImageIO's Exif and Photoshop blocks, is cleaned and goes on; a source's location still never does`, async () => {
    const {page, outside, errors} = await open(minified);
    try {
      const result = await page.evaluate(async head => {
        // the encoder as on an iPhone: Chromium's JPEG with its own SOI and JFIF swapped for ImageIO's header
        const toBlob = HTMLCanvasElement.prototype.toBlob, refuse = bytes => { try { window.HSArtworkPhoto.checkJPEG(bytes.slice().buffer); return 'passed'; } catch (e) { return e.message; } };
        window.encoded = [];
        HTMLCanvasElement.prototype.toBlob = function (done, type, quality) {
          toBlob.call(this, async blob => {
            const b = new Uint8Array(await blob.arrayBuffer()), app0 = b[2] === 0xFF && b[3] === 0xE0 ? 4 + ((b[4] << 8) | b[5]) : 2;
            const apple = new Uint8Array(head.length + b.length - app0); apple.set(head); apple.set(b.slice(app0), head.length);
            window.encoded.push(refuse(apple));
            done(new Blob([apple], {type: blob.type}));
          }, type, quality);
        };
        const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
        const c = canvas.getContext('2d'); c.fillStyle = '#8a4a2b'; c.fillRect(0, 0, 640, 480); c.fillStyle = '#e3d3bf'; c.fillRect(100, 80, 300, 200);
        const jpeg = new Uint8Array(await (await new Promise(resolve => toBlob.call(canvas, resolve, 'image/jpeg', 0.9))).arrayBuffer());
        // the source photo carries its location: an Exif block with a GPS IFD pointer (tag 0x8825), and the place in words
        const bytes = s => Uint8Array.from(s, ch => ch.charCodeAt(0));
        const gps = bytes('Exif\0\0MM\0*\0\0\0\x08\0\x01\x88\x25\0\x04\0\0\0\x01\0\0\0\x1a\0\0\0\0synthetic-private-location 21.3069N 157.8583W');
        const segment = new Uint8Array(gps.length + 4); segment.set([0xFF, 0xE1, (gps.length + 2) >> 8, (gps.length + 2) & 255]); segment.set(gps, 4);
        const source = new Uint8Array(jpeg.length + segment.length); source.set(jpeg.slice(0, 2)); source.set(segment, 2); source.set(jpeg.slice(2), 2 + segment.length);
        const prepared = await window.HSArtworkPhoto.prepare(new File([source], 'IMG_0042.jpg', {type: 'image/jpeg'}));
        const out = new Uint8Array(await prepared.file.arrayBuffer()), markers = [];
        for (let p = 2; p + 4 <= out.length && out[p] === 0xFF && out[p + 1] !== 0xDA; p += 2 + ((out[p + 2] << 8) | out[p + 3])) markers.push(out[p + 1].toString(16));
        const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', out)), x => x.toString(16).padStart(2, '0')).join('');
        const bitmap = await createImageBitmap(prepared.file), decoded = bitmap.width + 'x' + bitmap.height; bitmap.close();
        // an encoder block that did carry a place, and a comment, are cut the same way
        const leak = new Uint8Array(head.length + segment.length + jpeg.length - 2); leak.set(head); leak.set(segment, head.length); leak.set(jpeg.slice(2), head.length + segment.length);
        const stripped = new Uint8Array(window.HSArtworkPhoto.stripJPEG(leak.buffer));
        return {encoded: window.encoded, markers, check: refuse(out), uploadHash: prepared.photo.uploadHash === sha, sizes: [prepared.uploadBytes, prepared.file.size].every(n => n === out.length),
          decoded, upload: prepared.uploadWidth + 'x' + prepared.uploadHeight, locationRemains: new TextDecoder().decode(out).includes('synthetic-private-location'),
          leak: refuse(stripped), leakRemains: new TextDecoder().decode(stripped).includes('synthetic-private-location'), leakOriginal: refuse(leak)};
      }, [...appleHead(640, 480)]);
      assert.deepEqual(result.encoded, ['Image metadata remains'], "the encoder's own output carried the blocks the check refuses");
      assert.equal(result.check, 'passed', 'the prepared photo passes the JPEG check');
      assert.equal(result.markers[0], 'e0', 'JFIF stays first');
      for (const m of ['e1', 'ed', 'fe']) assert.ok(!result.markers.includes(m), `no ${m} segment in ${result.markers}`);
      assert.equal(result.uploadHash, true, 'the upload hash is of the bytes sent'); assert.equal(result.sizes, true);
      assert.deepEqual([result.decoded, result.upload], ['640x480', '640x480']);
      assert.equal(result.locationRemains, false, "the source's location is not in the upload");
      assert.equal(result.leakOriginal, 'Image metadata remains'); assert.equal(result.leak, 'passed'); assert.equal(result.leakRemains, false);
      assert.deepEqual(outside, []); assert.deepEqual(errors, []);
    } finally { await page.close(); }
  });
}
