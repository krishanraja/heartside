/* On-device photo quality check. Runs before any upload or paid artwork generation.
   Nothing about the photo leaves the device: pixels are read from a local canvas, and the
   optional dog detector runs in the browser (its scripts and weights are downloads only).

   window.HSPhotoQuality.check(file, {detect, timeout, checkTimeout, limits}) resolves
     {verdict: 'ok'|'warn'|'reject', overridable, reasons: [{code, message}], metrics, detection, timedOut}.
   Hard rejects (never overridable): size, blur, dark, bright, unreadable, heic.
   HEIC or HEIF (by type or file name) is refused before any decode, with guidance to choose a JPEG
   (Krish, 28 Oct). The whole check gets 10 seconds (checkTimeout; Krish's ruling: "a 10-second
   limit, then the photo goes on"). Decoding may use all of it; a decode past it
   fails open with verdict ok and timedOut true, and the photo goes on, where the painter's own
   minimum size check still applies. A decode that never settles used to hold every later pick.
   The detector gets what is left, at most its own timeout: it used to start a fresh 4 seconds
   after a slow decode, so a check could take 14 seconds or more.
   Overridable rejects (detectors miss unusual dogs): nodog, far.
   Warnings: small, soft, dim, glare, dogs. Detection null (off, no WebGL, offline, slower than
   the timeout) skips the dog checks. The product page loads the detector only once a photo is
   picked (28 Oct): warming it as the photo step scrolled into view could put a 19 MB download and a
   WebGL pause on a phone right before its picker opened. A cold first check can therefore
   skip the dog checks. The first load also compiles WebGL shaders on the main thread, which can
   pause the page for a moment and hold a timer past its time on that one call (7.3 s against
   4 s with software WebGL); a detector that becomes ready after the deadline is not run.

   Calibration, 2026-10-27, headless Chromium through this file's own pixels() path.
   blur = variance of the 4-neighbor Laplacian on luminance, contrast-stretched (1st to 99th
   percentile to 0..255), over the sharpest quarter of an 8 x 8 tile grid. raw = the plain
   whole-image variance of the Laplacian, unstretched. p5/p95 = luminance percentiles.

   Six real photos, all ok (dog = COCO-SSD score / largest box share of the frame):
     photo                  short   blur   raw  mean  black  white  p5  p95  dog
     apricot poodle          1053    812   156   101   .017   .001  32  183  .97 / 29%
     golden puppy asleep     1053    451    87   133   .004   .000  33  221  .98 / 32%
     painted cutout (alpha)  1059    147    36   156   .014   .000  66  215  .75 / 94%
     maltipoo on deck        1189   4078   589   132   .007   .000  63  199  .99 / 30%
     pug in leaves           1052   1165   195    98   .012   .000  38  194  .98 / 38%
     red poodle              1389    855   185   166   .023   .000  39  225  .99 / 51%
   Pillow variants of all six, each rejected for its own reason only:
     400 px long side     short 265 to 350                        size
     Gaussian blur r6     blur 16.3 to 50.3 (maltipoo highest)    blur
     brightness x0.08     black 1.000, p95 14 to 18               dark
     brightness x6        white .544 to .960, p5 190 to 251       bright
   Borderline: blur r3 scored 44.5 (cutout, blur), 68 to 122 (four, soft) and 451 (maltipoo, ok).
   Brightness x0.30: p95 54 to 67, all dim, none dark. Cutout on white 90.9 (soft); cutout on
   black, 39% near-black (ok); red poodle at half size on a white backdrop, 71% near-white,
   p5 98 (ok). Short side 497 to 656 after a 750 px resize: size, or small at 656.
   Margins: blurReject 65 is 1.29x the sharpest blur6 and 1/2.26 of the softest real photo
   (1/1.40 of the cutout on white). darkHigh 32 sits between 18 (x0.08) and 54 (x0.30).
   brightLow 160 sits between 190 (x6) and 98 (white backdrop); brightShare .4 under .544.
   The global score was rejected: flat backdrops dilute it (cutout on white 33.5, blur6 20.9).
   Unstretched (Pillow probe), the cutout at x0.35 brightness scored 8.2, inside the blur6 range.
   Detector: real dogs .75 to .99, no second dog box on any real photo. Small pugs pasted at
   1/2, 1/3 and 1/4 size read as cat .80, dog .39 (4.5% of the frame) and cow .69, which is why
   nodog and far stay overridable. Sandbox timing (software WebGL): cold load 8.8 to 9.8 s,
   warm detection 0.65 to 2 s. */
(function () {
  'use strict';
  if (window.HSPhotoQuality) return;

  var LIMITS = {
    analysisSize: 512,   // longest side the photo is scaled to before measuring; never upscaled
    minShortSide: 600,   // hard reject below (original pixels)
    goodShortSide: 900,  // warn below
    blurReject: 65,      // hard reject below (blur score, see measure)
    blurWarn: 140,       // warn below
    darkLuma: 24,        // a pixel at or below this luminance is near-black
    brightLuma: 245,     // a pixel at or above this luminance is near-white
    darkShare: 0.5,      // hard reject as near-black when this share is near-black
    darkHigh: 32,        //   and even the 95th percentile luminance is at or below this
    brightShare: 0.4,    // hard reject as blown out when this share is near-white
    brightLow: 160,      //   and even the 5th percentile luminance is at or above this
    dimHigh: 96,         // warn when the 95th percentile luminance is below this
    glareShare: 0.75,    // warn when this share of pixels is near-white
    glareLow: 140,       //   or when the 5th percentile luminance is at or above this
    stretchFloor: 32,    // luminance range floor, caps the contrast stretch at 8x
    tileGrid: 8,         // blur is scored on the sharpest quarter of an 8 x 8 grid of tiles
    dogScore: 0.4,       // detector confidence a dog box needs to count
    dogMinShare: 0.05,   // largest dog box must cover this share of the photo
    detectTimeout: 4000, // ms to wait for the detector before failing open, within checkTimeout
    checkTimeout: 10000  // ms for the whole check; a decode past it fails open (verdict ok, timedOut)
  };

  // Buddy's words. Plain US English, no exclamation marks, no dashes.
  var MESSAGES = {
    size: 'This photo is too small for me to draw from. Try the original from your camera roll, not a screenshot or a photo saved from a chat.',
    small: 'This photo is a little small, so fine details may come out soft. The original from your camera roll will look sharper.',
    blur: 'This photo is too blurry for me to see your dog clearly. Try one where the eyes look sharp.',
    soft: 'This photo looks a little soft. A sharper one will give crisper artwork, but this one can work.',
    dark: 'This photo is too dark for me to see your dog. Try one taken in daylight or a bright room.',
    dim: 'This photo is a bit dark, so some details may get lost. A brighter one will look better.',
    bright: 'This photo is so bright that your dog gets lost in it. Try one taken without a flash or a bright window behind.',
    glare: 'Parts of this photo are very bright. If your dog\'s fur looks washed out, try one in softer light.',
    nodog: 'I couldn\'t spot a dog in this photo. If your dog is in it, you can still use it.',
    far: 'Your dog looks small in this photo. A closer one where your dog fills more of the frame works best, but you can still use this one.',
    dogs: 'I see more than one dog here. Your artwork works best with just your dog in the photo.',
    unreadable: 'I couldn\'t open this photo. Try a JPEG or PNG from your camera roll.',
    heic: 'This photo is saved as HEIC, which I can\'t paint from. Choose a JPEG of your dog instead.'
  };

  // Pinned detector scripts, loaded only on first use. SRI computed from the exact files.
  var DETECTOR_SCRIPTS = [
    {global: 'tf', src: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
      integrity: 'sha384-vE8hbVJ4lezako5rlvE7bY0BVzWlFhZncPlckrqNwcUQpVtgbENTgZ8TBbnPjZre'},
    {global: 'cocoSsd', src: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js',
      integrity: 'sha384-7qLdgfEQyO9ZQi9ArRHigK+IBto4XPk468jAqc+fnsXaZIcMAhQeLwzggRK7aESl'}
  ];

  function limitsWith(overrides) {
    return overrides ? Object.assign({}, LIMITS, overrides) : LIMITS;
  }

  function analysisSize(width, height, max) {
    var scale = Math.min(1, (max || LIMITS.analysisSize) / Math.max(width, height));
    return {width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale))};
  }

  function percentile(hist, total, q) {
    var need = Math.max(1, Math.ceil(q * total)), seen = 0;
    for (var v = 0; v < hist.length; v++) { seen += hist[v]; if (seen >= need) return v; }
    return hist.length - 1;
  }

  // data: RGBA bytes at analysis size. Pixels with alpha < 128 (cutout backgrounds) are ignored.
  function measure(data, width, height, originalWidth, originalHeight) {
    var ow = originalWidth || width, oh = originalHeight || height, n = width * height;
    var lum = new Uint8Array(n), solid = new Uint8Array(n), hist = new Uint32Array(256);
    var count = 0, sum = 0, dark = 0, bright = 0, i, y;
    for (i = 0; i < n; i++) {
      if (data[i * 4 + 3] < 128) continue;
      y = (77 * data[i * 4] + 150 * data[i * 4 + 1] + 29 * data[i * 4 + 2]) >> 8;
      lum[i] = y; solid[i] = 1; hist[y]++; count++; sum += y;
      if (y <= LIMITS.darkLuma) dark++;
      if (y >= LIMITS.brightLuma) bright++;
    }
    var metrics = {shortSide: Math.min(ow, oh), width: ow, height: oh, analysisWidth: width, analysisHeight: height,
      blur: 0, blurRaw: 0, mean: 0, nearBlack: 0, nearWhite: 0, low: 0, high: 0, opaque: n ? count / n : 0};
    if (!count) return metrics;
    // 4-neighbor Laplacian, only where the pixel and its neighbors are opaque (no cutout edges).
    var s1 = 0, s2 = 0, m = 0, x, row, v, t, G = LIMITS.tileGrid;
    var t1 = new Float64Array(G * G), t2 = new Float64Array(G * G), tm = new Float64Array(G * G);
    for (y = 1; y < height - 1; y++) {
      row = y * width;
      for (x = 1; x < width - 1; x++) {
        i = row + x;
        if (!solid[i] || !solid[i - 1] || !solid[i + 1] || !solid[i - width] || !solid[i + width]) continue;
        v = lum[i - 1] + lum[i + 1] + lum[i - width] + lum[i + width] - 4 * lum[i];
        s1 += v; s2 += v * v; m++;
        t = Math.floor(x * G / width) + G * Math.floor(y * G / height);
        t1[t] += v; t2[t] += v * v; tm[t]++;
      }
    }
    var raw = m ? Math.max(0, s2 / m - (s1 / m) * (s1 / m)) : 0;
    // Score the sharpest quarter of the tiles, so a sharp dog against a plain wall, a studio
    // backdrop or portrait-mode blur is not averaged down by the empty background.
    var tiles = [], top = 0, keep;
    for (t = 0; t < G * G; t++) if (tm[t] >= 32) tiles.push(Math.max(0, t2[t] / tm[t] - (t1[t] / tm[t]) * (t1[t] / tm[t])));
    tiles.sort(function (a, b) { return b - a; });
    keep = Math.max(1, Math.round(tiles.length / 4));
    for (t = 0; t < keep && t < tiles.length; t++) top += tiles[t];
    var sharp = tiles.length ? top / Math.min(keep, tiles.length) : raw;
    // Stretch the 1st to 99th percentile range to full scale, so a dim or flat but sharp photo
    // scores like a well-lit one. Scaling luminance by k scales the variance by k squared.
    var range = Math.max(percentile(hist, count, 0.99) - percentile(hist, count, 0.01), LIMITS.stretchFloor);
    metrics.blurRaw = raw;
    metrics.blur = sharp * (255 / range) * (255 / range);
    metrics.mean = sum / count;
    metrics.nearBlack = dark / count;
    metrics.nearWhite = bright / count;
    metrics.low = percentile(hist, count, 0.05);
    metrics.high = percentile(hist, count, 0.95);
    return metrics;
  }

  // COCO-SSD predictions to {width, height, dogs, others}, keeping 'dog' boxes at or above
  // minScore (default dogScore). decide() counts only dogs at or above dogScore.
  function dogsFrom(predictions, width, height, minScore) {
    var floor = minScore === undefined ? LIMITS.dogScore : minScore;
    var list = predictions || [];
    return {width: width, height: height,
      dogs: list.filter(function (p) { return p && p.class === 'dog' && p.score >= floor; })
        .map(function (p) { return {score: p.score, bbox: p.bbox.slice(0, 4)}; }),
      others: list.filter(function (p) { return p && p.class !== 'dog'; })
        .map(function (p) { return {label: String(p.class), score: p.score}; })};
  }

  function reason(code) { return {code: code, message: MESSAGES[code]}; }

  // detection: null when the detector was skipped, unavailable or too slow (fail open).
  function decide(metrics, detection, overrides) {
    var L = limitsWith(overrides), hard = [], soft = [], dog = [];
    if (!metrics || !metrics.opaque) return {verdict: 'reject', overridable: false, reasons: [reason('unreadable')]};
    if (metrics.shortSide < L.minShortSide) hard.push('size');
    else if (metrics.shortSide < L.goodShortSide) soft.push('small');
    // Blur is only meaningful when there is something to see, so exposure failures skip it.
    var seen = true;
    if (metrics.nearBlack >= L.darkShare && metrics.high <= L.darkHigh) { hard.push('dark'); seen = false; }
    else if (metrics.nearWhite >= L.brightShare && metrics.low >= L.brightLow) { hard.push('bright'); seen = false; }
    else {
      if (metrics.high < L.dimHigh) soft.push('dim');
      if (metrics.nearWhite >= L.glareShare || metrics.low >= L.glareLow) soft.push('glare');
    }
    if (seen) {
      if (metrics.blur < L.blurReject) hard.push('blur');
      else if (metrics.blur < L.blurWarn) soft.push('soft');
    }
    if (detection) {
      var dogs = (detection.dogs || []).filter(function (d) { return d.score >= L.dogScore; });
      var area = Math.max(1, detection.width * detection.height), share = 0;
      dogs.forEach(function (d) { share = Math.max(share, (d.bbox[2] * d.bbox[3]) / area); });
      if (!dogs.length) dog.push('nodog');
      else if (share < L.dogMinShare) dog.push('far');
      if (dogs.length > 1) soft.push('dogs');
    }
    if (hard.length) return {verdict: 'reject', overridable: false, reasons: hard.map(reason)};
    if (dog.length) return {verdict: 'reject', overridable: true, reasons: dog.concat(soft).map(reason)};
    return {verdict: soft.length ? 'warn' : 'ok', overridable: false, reasons: soft.map(reason)};
  }

  /* Browser glue below: decoding, canvas drawing and the lazy detector. */

  function decodeWithImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        resolve({source: img, width: img.naturalWidth, height: img.naturalHeight, close: function () { URL.revokeObjectURL(url); }});
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Photo could not be decoded')); };
      img.src = url;
    });
  }

  // Any failure here means this browser cannot read the file, which the checks report as unreadable.
  function decode(file) {
    return Promise.resolve().then(function () {
      if (typeof createImageBitmap !== 'function') return decodeWithImage(file);
      return createImageBitmap(file).then(function (bitmap) {
        return {source: bitmap, width: bitmap.width, height: bitmap.height, close: function () { bitmap.close(); }};
      }, function () { return decodeWithImage(file); });
    }).catch(function () {
      var error = new Error('Photo could not be decoded'); error.unreadable = true; throw error;
    });
  }

  function paint(source, width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    var context = canvas.getContext('2d', {willReadFrequently: true});
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, width, height);
    return canvas;
  }

  // Halve in steps until within 2x of the target, then scale once. Each halving averages
  // 2x2 blocks in every browser, so a large photo cannot alias into a falsely sharp one.
  function draw(source, width, height, size) {
    var from = source, w = width, h = height;
    while (w >= size.width * 2 && h >= size.height * 2) {
      w = Math.round(w / 2); h = Math.round(h / 2);
      from = paint(from, w, h);
    }
    return paint(from, size.width, size.height);
  }

  // The analysis-size pixels the checks read. A decode failure rejects with error.unreadable set.
  function pixels(file) {
    return decode(file).then(function (decoded) {
      try {
        var size = analysisSize(decoded.width, decoded.height, LIMITS.analysisSize);
        var canvas = draw(decoded.source, decoded.width, decoded.height, size);
        return {canvas: canvas, data: canvas.getContext('2d').getImageData(0, 0, size.width, size.height).data,
          width: size.width, height: size.height, originalWidth: decoded.width, originalHeight: decoded.height};
      } finally { decoded.close(); }
    });
  }

  function loadScript(entry) {
    if (window[entry.global]) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = entry.src; script.integrity = entry.integrity; script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer'; script.async = true;
      script.onload = function () { if (window[entry.global]) resolve(); else reject(new Error('Detector global missing')); };
      script.onerror = function () { script.remove(); reject(new Error('Detector script failed')); };
      document.head.appendChild(script);
    });
  }

  function hasWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch (e) { return false; }
  }

  var detectorPromise = null;
  // Resolves to {detect(canvas) -> Promise<detection>} or null. Safe to call early to warm up.
  function loadDetector() {
    if (detectorPromise) return detectorPromise;
    detectorPromise = (hasWebGL() ? Promise.resolve() : Promise.reject(new Error('WebGL unavailable')))
      .then(function () { return loadScript(DETECTOR_SCRIPTS[0]); })
      .then(function () { return loadScript(DETECTOR_SCRIPTS[1]); })
      .then(function () { return window.tf.setBackend('webgl'); })
      .then(function () { return window.tf.ready(); })
      .then(function () {
        if (window.tf.getBackend() !== 'webgl') throw new Error('WebGL backend unavailable');
        return window.cocoSsd.load({base: 'lite_mobilenet_v2'});
      })
      .then(function (model) {
        return {detect: function (canvas) {
          return model.detect(canvas, 20, 0.2).then(function (predictions) { return dogsFrom(predictions, canvas.width, canvas.height, 0); });
        }};
      })
      .catch(function () { detectorPromise = null; return null; });
    return detectorPromise;
  }

  // HEIC and HEIF: by type, or by name when a picker leaves the type empty
  function isHeic(file) {
    return !!file && (/^image\/hei[cf]/i.test(file.type || '') || /\.hei[cf]$/i.test(file.name || ''));
  }

  // pixels(), bounded: a decode that never settles rejects with timedOut set instead of hanging
  function pixelsWithin(file, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { var error = new Error('Photo check timed out'); error.timedOut = true; reject(error); }, ms);
      pixels(file).then(function (px) { clearTimeout(timer); resolve(px); }, function (error) { clearTimeout(timer); reject(error); });
    });
  }

  function within(promise, ms) {
    return new Promise(function (resolve) {
      var timer = setTimeout(function () { resolve(null); }, ms);
      promise.then(function (value) { clearTimeout(timer); resolve(value); },
        function () { clearTimeout(timer); resolve(null); });
    });
  }

  // Resolves {verdict, overridable, reasons, metrics, detection}. Never uploads anything.
  function check(file, options) {
    var opts = options || {};
    if (isHeic(file)) return Promise.resolve({verdict: 'reject', overridable: false, reasons: [reason('heic')], metrics: null, detection: null});
    var limit = opts.checkTimeout || limitsWith(opts.limits).checkTimeout, started = Date.now();
    return pixelsWithin(file, limit).then(function (px) {
      var metrics = measure(px.data, px.width, px.height, px.originalWidth, px.originalHeight);
      var first = decide(metrics, null, opts.limits);
      if (opts.detect === false || (first.verdict === 'reject' && !first.overridable)) {
        return Object.assign(first, {metrics: metrics, detection: null});
      }
      // The detector gets the time the decode left, at most its own timeout. The first load compiles
      // WebGL shaders on the main thread, which can hold this timer past the budget; a detector that
      // becomes ready after the deadline is not run for this photo.
      var budget = Math.min(opts.timeout || limitsWith(opts.limits).detectTimeout, limit - (Date.now() - started)), deadline = Date.now() + budget;
      if (budget <= 0) return Object.assign(first, {metrics: metrics, detection: null});
      var detection = within(loadDetector().then(function (detector) {
        return detector && Date.now() < deadline ? detector.detect(px.canvas) : null;
      }), budget);
      return detection.then(function (found) {
        return Object.assign(decide(metrics, found, opts.limits), {metrics: metrics, detection: found});
      });
    }).catch(function (error) {
      if (error && error.timedOut) return {verdict: 'ok', overridable: false, reasons: [], metrics: null, detection: null, timedOut: true};
      if (error && error.unreadable) return {verdict: 'reject', overridable: false, reasons: [reason('unreadable')], metrics: null, detection: null};
      // The photo decoded but could not be measured here: fail open and let the flow continue.
      return {verdict: 'ok', overridable: false, reasons: [], metrics: null, detection: null};
    });
  }

  window.HSPhotoQuality = {check: check, measure: measure, decide: decide, dogsFrom: dogsFrom, isHeic: isHeic,
    analysisSize: analysisSize, percentile: percentile, pixels: pixels, loadDetector: loadDetector,
    limits: LIMITS, messages: MESSAGES, detectorScripts: DETECTOR_SCRIPTS};
}());
