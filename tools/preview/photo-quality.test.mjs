// On-device photo quality check (shopify/assets/hs-photo-quality.js).
// The fixtures are the exact analysis-size pixels Chromium fed measure() during calibration,
// stored as luminance PNGs, so these metrics must match the recorded browser metrics exactly.
//
//   node --test tools/preview/photo-quality.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import vm from 'node:vm';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs-photo-quality.js', import.meta.url), 'utf8');
const fixtureDir = new URL('./fixtures/photo-quality/', import.meta.url);
// The fixtures are derived from Krish's Drive dog photos. The repository is public, so they stay
// out of Git until he confirms those photos may be published; without them the fixture tests skip
// and the decision tests run on the metrics Chromium recorded for two of them.
const haveFixtures = existsSync(new URL('manifest.json', fixtureDir));
const held = !haveFixtures && 'photo fixtures are held locally until Krish confirms the Drive photos may be public';
const {fixtures} = haveFixtures ? JSON.parse(readFileSync(new URL('manifest.json', fixtureDir), 'utf8')) : {fixtures: []};
const RECORDED = {
  'golden-puppy-asleep--real.png': {originalWidth: 1589, originalHeight: 1053, browser: {shortSide: 1053, blur: 451.0115898120773, blurRaw: 87.04836174770294, mean: 132.48667957227138, nearBlack: 0.004269220132743363, nearWhite: 0, low: 33, high: 221, opaque: 1}},
  'golden-puppy-asleep--tiny400.png': {originalWidth: 400, originalHeight: 265, browser: {shortSide: 265, blur: 1086.4778075581155, blurRaw: 208.10277916468533, mean: 132.78650943396227, nearBlack: 0.005443396226415095, nearWhite: 0, low: 33, high: 222, opaque: 1}}
};
const context = vm.createContext({window: {}});
vm.runInContext(source, context);
const Q = context.window.HSPhotoQuality;
const plain = value => JSON.parse(JSON.stringify(value));
// Arrays built inside the vm context have their own prototype, so copy them out before deepEqual.
const codes = result => Array.from(result.reasons, r => r.code);

// Minimal PNG reader for the fixtures: 8-bit grayscale (type 0) or grayscale + alpha (type 4).
function readPNG(buffer) {
  assert.equal(buffer.toString('hex', 0, 8), '89504e470d0a1a0a');
  let p = 8, width = 0, height = 0, type = -1;
  const idat = [];
  while (p < buffer.length) {
    const length = buffer.readUInt32BE(p), kind = buffer.toString('latin1', p + 4, p + 8), body = buffer.subarray(p + 8, p + 8 + length);
    if (kind === 'IHDR') {
      width = body.readUInt32BE(0); height = body.readUInt32BE(4); type = body[9];
      assert.equal(body[8], 8); assert.equal(body[12], 0);
    } else if (kind === 'IDAT') idat.push(body);
    else if (kind === 'IEND') break;
    p += length + 12;
  }
  assert.ok(type === 0 || type === 4, 'fixture PNGs are grayscale');
  const channels = type === 4 ? 2 : 1, stride = width * channels, raw = inflateSync(Buffer.concat(idat)), out = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], line = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[y * stride + x - channels] : 0, b = y ? out[(y - 1) * stride + x] : 0;
      const c = x >= channels && y ? out[(y - 1) * stride + x - channels] : 0;
      let v = raw[line + x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[y * stride + x] = v & 255;
    }
  }
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const lum = out[i * channels];
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = lum;
    data[i * 4 + 3] = channels === 2 ? out[i * 2 + 1] : 255;
  }
  return {width, height, data};
}

function metricsFor(fixture) {
  const png = readPNG(readFileSync(new URL(fixture.file, fixtureDir)));
  return Q.measure(png.data, png.width, png.height, fixture.originalWidth, fixture.originalHeight);
}

// What each fixture must produce with no detector (detection null fails open).
const EXPECTED = {
  'golden-puppy-asleep--real.png': ['ok', []],
  'golden-puppy-painted-cutout--real.png': ['ok', []],
  'red-poodle-head-tilt--studio-white.png': ['ok', []],
  'golden-puppy-painted-cutout--on-black.png': ['ok', []],
  'golden-puppy-painted-cutout--on-white.png': ['warn', ['soft']],
  'apricot-poodle-puppy--dim030.png': ['warn', ['dim']],
  'golden-puppy-asleep--tiny400.png': ['reject', ['size']],
  'maltipoo-on-deck--blur6.png': ['reject', ['blur']],
  'golden-puppy-asleep--dark008.png': ['reject', ['dark']],
  'pug-autumn-leaves--blown6.png': ['reject', ['bright']],
  'red-poodle-head-tilt--blown6.png': ['reject', ['bright']],
};

test('every fixture is covered by an expectation and stays small', {skip: held}, () => {
  assert.deepEqual(fixtures.map(f => f.file).sort(), Object.keys(EXPECTED).sort());
  for (const f of fixtures) assert.ok(readFileSync(new URL(f.file, fixtureDir)).length < 66 * 1024, f.file);
});

for (const fixture of fixtures) {
  test(`metrics and decision: ${fixture.file}`, () => {
    const metrics = metricsFor(fixture);
    for (const [key, value] of Object.entries(fixture.browser)) {
      assert.ok(Math.abs(metrics[key] - value) <= 1e-9 * Math.max(1, Math.abs(value)), `${key}: node ${metrics[key]} vs browser ${value}`);
    }
    assert.equal(metrics.analysisWidth, Q.analysisSize(fixture.originalWidth, fixture.originalHeight).width);
    const [verdict, expected] = EXPECTED[fixture.file];
    const result = Q.decide(metrics, null);
    assert.equal(result.verdict, verdict);
    assert.deepEqual(codes(result), expected);
    assert.equal(result.overridable, false, 'only a missing or tiny dog is overridable');
    if (fixture.detection) {
      // Replay the recorded COCO-SSD output: one confident dog, so the verdict is unchanged.
      const withDog = Q.decide(metrics, fixture.detection);
      assert.equal(withDog.verdict, verdict);
      assert.deepEqual(codes(withDog), expected);
    }
  });
}

const recorded = name => {
  if (haveFixtures) return metricsFor(fixtures.find(f => f.file === name));
  const r = RECORDED[name], size = Q.analysisSize(r.originalWidth, r.originalHeight);
  return Object.assign({analysisWidth: size.width, analysisHeight: size.height}, r.browser);
};
const okMetrics = recorded('golden-puppy-asleep--real.png');
const tinyMetrics = recorded('golden-puppy-asleep--tiny400.png');
const dog = (score, w, h) => ({score, bbox: [10, 10, w, h]});

test('no dog found rejects, but the buyer can override it', () => {
  const result = plain(Q.decide(okMetrics, {width: 512, height: 339, dogs: []}));
  assert.deepEqual(result, {verdict: 'reject', overridable: true, reasons: [{code: 'nodog', message: Q.messages.nodog}]});
  // A dog below the confidence floor does not count.
  assert.deepEqual(codes(Q.decide(okMetrics, {width: 512, height: 339, dogs: [dog(0.39, 200, 200)]})), ['nodog']);
  // A confident dog covering under 5% of the frame is "far", also overridable.
  const far = Q.decide(okMetrics, {width: 512, height: 339, dogs: [dog(0.9, 40, 40)]});
  assert.deepEqual([far.verdict, far.overridable, codes(far)], ['reject', true, ['far']]);
  // Warnings still travel with an overridable reject, so the buyer sees them before overriding.
  const small = Object.assign({}, okMetrics, {shortSide: 700});
  assert.deepEqual(codes(Q.decide(small, {width: 512, height: 339, dogs: []})), ['nodog', 'small']);
});

test('hard failures are never overridable and hide the dog reasons', () => {
  const result = Q.decide(tinyMetrics, {width: 400, height: 265, dogs: []});
  assert.deepEqual([result.verdict, result.overridable, codes(result)], ['reject', false, ['size']]);
});

test('detection null fails open', () => {
  assert.deepEqual(plain(Q.decide(okMetrics, null)), {verdict: 'ok', overridable: false, reasons: []});
  assert.deepEqual(plain(Q.decide(okMetrics, undefined)), {verdict: 'ok', overridable: false, reasons: []});
});

test('more than one dog warns, never rejects', () => {
  const result = Q.decide(okMetrics, {width: 512, height: 339, dogs: [dog(0.95, 200, 150), dog(0.8, 120, 100)]});
  assert.deepEqual([result.verdict, result.overridable, codes(result)], ['warn', false, ['dogs']]);
  // A second box below the floor is ignored.
  assert.equal(Q.decide(okMetrics, {width: 512, height: 339, dogs: [dog(0.95, 200, 150), dog(0.3, 120, 100)]}).verdict, 'ok');
});

test('size tiers use the original short side', () => {
  assert.deepEqual(codes(Q.decide(Object.assign({}, okMetrics, {shortSide: 599}), null)), ['size']);
  assert.deepEqual(codes(Q.decide(Object.assign({}, okMetrics, {shortSide: 600}), null)), ['small']);
  assert.deepEqual(codes(Q.decide(Object.assign({}, okMetrics, {shortSide: 899}), null)), ['small']);
  assert.deepEqual(codes(Q.decide(Object.assign({}, okMetrics, {shortSide: 900}), null)), []);
  assert.deepEqual(plain(Q.analysisSize(1589, 1053)), {width: 512, height: 339});
  assert.deepEqual(plain(Q.analysisSize(400, 265)), {width: 400, height: 265}, 'never upscaled');
});

test('dogsFrom keeps only confident dog boxes', () => {
  const found = plain(Q.dogsFrom([
    {class: 'dog', score: 0.91, bbox: [1, 2, 3, 4]}, {class: 'dog', score: 0.2, bbox: [0, 0, 9, 9]},
    {class: 'cat', score: 0.8, bbox: [0, 0, 5, 5]}], 512, 384));
  assert.deepEqual(found, {width: 512, height: 384, dogs: [{score: 0.91, bbox: [1, 2, 3, 4]}], others: [{label: 'cat', score: 0.8}]});
});

test('an empty or fully transparent image is unreadable', () => {
  const clear = Q.measure(new Uint8ClampedArray(16 * 16 * 4), 16, 16, 1600, 1200);
  assert.deepEqual(codes(Q.decide(clear, null)), ['unreadable']);
  assert.deepEqual(codes(Q.decide(null, null)), ['unreadable']);
});

test('messages are warm, plain and follow the copy rules', () => {
  const all = Object.entries(Q.messages);
  assert.deepEqual(all.map(([k]) => k).sort(), ['blur', 'bright', 'dark', 'dim', 'dogs', 'far', 'glare', 'nodog', 'size', 'small', 'soft', 'unreadable']);
  for (const [code, message] of all) {
    assert.ok(!/[!\u2014\u2013]/.test(message), `${code} has an exclamation mark or a dash`);
    assert.ok(message.length > 20 && message.length <= 140, `${code} is ${message.length} characters`);
    assert.ok(/[.]$/.test(message), `${code} ends with a period`);
  }
});

test('plain browser script: no modules, no import(), nothing sent anywhere', () => {
  assert.ok(!/\bimport\s*\(/.test(source), 'no dynamic import');
  assert.ok(!/^\s*(import|export)\s/m.test(source), 'no module syntax');
  assert.ok(!/\brequire\(/.test(source));
  assert.ok(!/\bfetch\(|XMLHttpRequest|sendBeacon|FormData|WebSocket/.test(source), 'the checker never sends data');
  // esbuild lowers anything newer than ES2017 into helper functions; there must be none.
  assert.ok(!/\b__\w+\s*=/.test(transformSync(source, {target: 'es2017', loader: 'js'}).code), 'ES2017 syntax only');
  for (const name of ['analysisSize', 'percentile', 'measure', 'dogsFrom', 'decide']) {
    assert.match(source, new RegExp(`\\n  function ${name}\\(`), `${name} is a top-level declaration that can be sliced`);
    assert.equal(typeof Q[name], 'function');
  }
  for (const script of Q.detectorScripts) {
    assert.match(script.src, /^https:\/\/cdn\.jsdelivr\.net\/npm\/@[\w-]+\/[\w-]+@\d+\.\d+\.\d+\/dist\/[\w.-]+\.js$/, 'pinned exact version');
    assert.match(script.integrity, /^sha384-[A-Za-z0-9+/]{64}$/);
  }
  assert.match(source, /crossOrigin = 'anonymous'/);
});

// Real browser, offline: every request off localhost is aborted, so the detector fails open.
for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: browser check decodes, scales and measures locally`, {skip: held}, async () => {
  const browser = await chromium.launch({headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage(), requests = [];
    page.on('request', r => requests.push([r.method(), r.url()]));
    const fixture = readFileSync(new URL('golden-puppy-asleep--real.png', fixtureDir));
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url === 'http://localhost/') return route.fulfill({contentType: 'text/html', body: '<!doctype html><title>Photo quality test</title>'});
      if (url === 'http://localhost/fixture.png') return route.fulfill({contentType: 'image/png', body: fixture});
      return route.abort();
    });
    await page.goto('http://localhost/');
    await page.addScriptTag({content: minified ? transformSync(source, {minify: true}).code : source});
    const result = await page.evaluate(async () => {
      const Q = window.HSPhotoQuality, scriptsBefore = document.querySelectorAll('script[src]').length;
      const fromCanvas = canvas => new Promise(resolve => canvas.toBlob(b => resolve(new File([b], 'dog.png', {type: 'image/png'})), 'image/png'));
      // A deterministic 2000 x 1500 "photo" of shapes, then blurred and darkened copies of it.
      const sharp = document.createElement('canvas'); sharp.width = 2000; sharp.height = 1500;
      const ctx = sharp.getContext('2d'); let seed = 7;
      const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
      ctx.fillStyle = '#8a7a66'; ctx.fillRect(0, 0, 2000, 1500);
      for (let i = 0; i < 600; i++) {
        ctx.fillStyle = `rgb(${rand() * 255 | 0},${rand() * 255 | 0},${rand() * 255 | 0})`;
        ctx.fillRect(rand() * 2000, rand() * 1500, 8 + rand() * 120, 8 + rand() * 120);
      }
      const variant = filter => { const c = document.createElement('canvas'); c.width = 2000; c.height = 1500; const x = c.getContext('2d'); x.filter = filter; x.drawImage(sharp, 0, 0); return c; };
      const out = {scriptsBefore};
      out.sharp = await Q.check(await fromCanvas(sharp), {detect: false});
      out.blurred = await Q.check(await fromCanvas(variant('blur(16px)')), {detect: false});
      out.dark = await Q.check(await fromCanvas(variant('brightness(0.04)')), {detect: false});
      out.unreadable = await Q.check(new File([new Uint8Array([1, 2, 3, 4])], 'dog.jpg', {type: 'image/jpeg'}));
      const fixtureFile = new File([await (await fetch('/fixture.png')).blob()], 'fixture.png', {type: 'image/png'});
      out.fixture = await Q.check(fixtureFile, {detect: false});
      const injected = [];
      new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(n => {
        if (n.tagName === 'SCRIPT' && n.src) injected.push({src: n.src, integrity: n.integrity, crossOrigin: n.crossOrigin});
      }))).observe(document.head, {childList: true});
      const started = performance.now();
      out.detected = await Q.check(await fromCanvas(sharp), {timeout: 3000});
      out.detectMs = performance.now() - started;
      await new Promise(resolve => setTimeout(resolve, 0));
      out.scripts = injected;
      return out;
    });
    assert.equal(result.scriptsBefore, 0, 'nothing loads until a check asks for detection');
    assert.deepEqual([result.sharp.verdict, codes(result.sharp)], ['ok', []]);
    assert.deepEqual([result.sharp.metrics.shortSide, result.sharp.metrics.analysisWidth, result.sharp.metrics.analysisHeight], [1500, 512, 384]);
    assert.deepEqual([result.blurred.verdict, result.blurred.overridable, codes(result.blurred)], ['reject', false, ['blur']]);
    assert.deepEqual([result.dark.verdict, codes(result.dark)], ['reject', ['dark']]);
    assert.deepEqual([result.unreadable.verdict, codes(result.unreadable), result.unreadable.metrics], ['reject', ['unreadable'], null]);
    // The browser reads the fixture PNG back to the same metrics Node computes from it.
    const fromNode = Q.measure(readPNG(fixture).data, 512, 339, 512, 339);
    for (const key of ['blur', 'blurRaw', 'mean', 'nearBlack', 'nearWhite', 'low', 'high', 'opaque']) assert.equal(result.fixture.metrics[key], fromNode[key], key);
    // Detector unreachable: fails open quickly with detection null and the same verdict.
    assert.equal(result.detected.detection, null);
    assert.deepEqual([result.detected.verdict, codes(result.detected)], ['ok', []]);
    assert.ok(result.detectMs < 3500);
    for (const s of result.scripts) {
      assert.ok(Q.detectorScripts.some(d => d.src === s.src && d.integrity === s.integrity), s.src);
      assert.equal(s.crossOrigin, 'anonymous');
    }
    for (const [method, url] of requests) {
      assert.equal(method, 'GET', `${method} ${url}`);
      assert.ok(url.startsWith('http://localhost/') || url.startsWith('https://cdn.jsdelivr.net/npm/') || url.startsWith('blob:'), url);
    }
  } finally { await browser.close(); }
});
