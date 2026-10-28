/* Local-only photo preparation before the one upload to the painter. No upload or provider call here.
   The photo is redrawn on a canvas, which drops every byte of its metadata (location included), then
   encoded as a JPEG at quality 0.92. The long side is capped at 4096 px (28 Oct): a 12 MP or larger
   phone original used to become a full-size PNG of 13 to 25 MB, and the painter works at 3840 px,
   so pixels beyond the cap gave nothing. A photo already within the cap keeps its size.
   Errors carry a code (type, megapixels, unreadable, failed) so the page can say the real reason. */
(function () {
  'use strict';
  var CAP = 4096, QUALITY = 0.92;
  async function digest(bytes) {
    var result = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(result), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function fail(code, message) { var error = new Error(message); error.code = code; return error; }
  function checkPNG(buffer) {
    var b = new Uint8Array(buffer), view = new DataView(buffer);
    if (b.length < 33 || Array.from(b.slice(0, 8)).join(',') !== '137,80,78,71,13,10,26,10') throw new Error('Expected a normalized PNG');
    var p = 8, ended = false;
    while (p + 12 <= b.length) {
      var length = view.getUint32(p), type = String.fromCharCode.apply(null, b.slice(p + 4, p + 8));
      if (length > b.length - p - 12) throw new Error('Incomplete PNG');
      if (['eXIf', 'tEXt', 'zTXt', 'iTXt'].indexOf(type) !== -1) throw new Error('Image metadata remains');
      p += length + 12;
      if (type === 'IEND') { ended = true; break; }
    }
    if (!ended || p !== b.length) throw new Error('Invalid PNG boundary');
  }
  // The JPEG twin of checkPNG: walks every marker segment and refuses the ones that carry metadata,
  // APP1 (EXIF and XMP, where a phone keeps the location), APP13 (IPTC) and COM (comments), and any
  // byte after the end of the image.
  function checkJPEG(buffer) {
    var b = new Uint8Array(buffer);
    if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) throw new Error('Expected a normalized JPEG');
    var p = 2, ended = false;
    while (p < b.length) {
      if (b[p] !== 0xFF) throw new Error('Invalid JPEG segment');
      while (b[p] === 0xFF && p < b.length) p++; // fill bytes before a marker
      var marker = b[p++];
      if (marker === 0xD9) { ended = true; break; }
      if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) continue; // markers with no length
      if (p + 2 > b.length) throw new Error('Incomplete JPEG');
      var length = (b[p] << 8) | b[p + 1];
      if (length < 2 || p + length > b.length) throw new Error('Incomplete JPEG');
      if (marker === 0xE1 || marker === 0xED || marker === 0xFE) throw new Error('Image metadata remains');
      p += length;
      if (marker === 0xDA) {
        // the scan: entropy-coded bytes run to the next marker that is not a stuffed 0x00 or a restart
        while (p < b.length && !(b[p] === 0xFF && p + 1 < b.length && b[p + 1] !== 0x00 && !(b[p + 1] >= 0xD0 && b[p + 1] <= 0xD7))) p++;
      }
    }
    if (!ended || p !== b.length) throw new Error('Invalid JPEG boundary');
  }
  // Scale so the long side is at most cap; never upscaled.
  function fit(width, height, cap) {
    var scale = Math.min(1, cap / Math.max(width, height));
    return {width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale))};
  }
  function paint(source, width, height, first) {
    var canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    var context = canvas.getContext('2d');
    // a JPEG has no transparency: a cutout's clear background becomes white, not black
    if (first) { context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height); }
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, width, height);
    return canvas;
  }
  // Halve in steps until within 2x of the target, then scale once, as hs-photo-quality.js draw()
  // does: each halving averages 2x2 blocks, so a large photo cannot alias. Within the cap the photo
  // is drawn once at its own size.
  function draw(source, width, height, size) {
    var from = source, w = width, h = height, first = true;
    while (w >= size.width * 2 && h >= size.height * 2) {
      w = Math.round(w / 2); h = Math.round(h / 2);
      from = paint(from, w, h, first); first = false;
    }
    return paint(from, size.width, size.height, first);
  }
  function photoType(file) {
    if (/^image\/(jpeg|png|webp)$/.test(file.type)) return true;
    // some Android pickers hand over a file with no type; its name still says what it is
    return !file.type && /\.(jpe?g|png|webp)$/i.test(file.name || '');
  }
  async function prepare(file) {
    if (!file || !photoType(file)) throw fail('type', 'Choose a JPEG, PNG or WebP photo');
    var original, bitmap;
    try { original = await file.arrayBuffer(); bitmap = await createImageBitmap(file); }
    catch (e) { throw fail('unreadable', 'This browser could not read the photo'); }
    try {
      if (!bitmap.width || !bitmap.height) throw fail('unreadable', 'This browser could not read the photo');
      if (bitmap.width * bitmap.height > 40000000) throw fail('megapixels', 'Choose a photo up to 40 megapixels');
      var size = fit(bitmap.width, bitmap.height, CAP), canvas = draw(bitmap, bitmap.width, bitmap.height, size);
      var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/jpeg', QUALITY); });
      if (!blob || blob.type !== 'image/jpeg') throw fail('failed', 'Photo preparation failed');
      var upload = await blob.arrayBuffer();
      try { checkJPEG(upload); } catch (e) { throw fail('failed', e.message); }
      return {file: new File([blob], 'dog-artwork-source.jpg', {type: 'image/jpeg'}),
        photo: {originalHash: await digest(original), uploadHash: await digest(upload), metadataRemoved: true},
        // width and height stay the source photo's; the upload's own size and bytes travel beside them
        width: bitmap.width, height: bitmap.height, uploadWidth: size.width, uploadHeight: size.height,
        sourceBytes: original.byteLength, uploadBytes: upload.byteLength};
    } finally { bitmap.close(); }
  }
  window.HSArtworkPhoto = {prepare: prepare, checkPNG: checkPNG, checkJPEG: checkJPEG, cap: CAP, quality: QUALITY};
}());
