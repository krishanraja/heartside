// The photo the painter receives (hs-artwork-photo.js), in a real browser with every request off
// localhost aborted. 28 Oct: a camera original used to become a full-size PNG of 13 to 25 MB (no
// cap); it is now capped at 4096 px on the long side and sent as a JPEG at 0.92, with a JPEG check
// that refuses EXIF, XMP, IPTC and comment segments the way checkPNG refuses PNG text chunks. A photo
// already within the cap keeps its size.
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs-artwork-photo.js', import.meta.url), 'utf8');
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
}
