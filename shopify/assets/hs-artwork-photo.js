/* Local-only candidate photo preparation. No upload, resizing or provider call. */
(function () {
  'use strict';
  async function digest(bytes) {
    var result = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(result), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
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
  async function prepare(file) {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Choose a JPEG, PNG or WebP photo');
    var original = await file.arrayBuffer(), bitmap = await createImageBitmap(file);
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000) throw new Error('Choose a photo up to 40 megapixels');
      var canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
      var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
      if (!blob) throw new Error('Photo preparation failed');
      var upload = await blob.arrayBuffer(); checkPNG(upload);
      return {file: new File([blob], 'dog-artwork-source.png', {type:'image/png'}),
        photo: {originalHash: await digest(original), uploadHash: await digest(upload), metadataRemoved: true},
        width: bitmap.width, height: bitmap.height};
    } finally { bitmap.close(); }
  }
  window.HSArtworkPhoto = {prepare: prepare, checkPNG: checkPNG};
}());
