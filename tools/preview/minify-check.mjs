// Shopify minifies theme JavaScript on its CDN, so heartside.io never runs shopify/assets/hs2.js
// as written. On 6 October its minifier turned an import() into a require() that doesn't exist
// in a browser, and every test that served the unminified file passed. This minifies the file
// the same way (esbuild) and fails on anything that only works unminified.
//
//   cd tools/preview && node minify-check.mjs            # exit 1 on a problem
//   node minify-check.mjs --out /tmp/hs2.min.js           # also keep the minified copy for tests
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
// hs3.js (the v3 gift chat) gets the same check; --out keeps hs2.js, as the in-app test expects
let failed = false;
for (const name of ['hs3.js', 'hs-artwork-profile.js', 'hs-artwork-engine.js', 'hs-artwork-choices.js', 'hs-artwork-photo.js', 'hs-checkout-image.js']) {
  const s3 = fs.readFileSync(path.join(here, '..', '..', 'shopify', 'assets', name), 'utf8');
  const c3 = transformSync(s3, { minify: true, loader: 'js' }).code;
  if (/\brequire\(|__toESM|__commonJS|\bimport\(/.test(c3)) { console.log('FAIL minified ' + name + ' contains a require(), import() or module helper'); failed = true; }
  else console.log(`ok   ${name} minifies cleanly (${s3.length} -> ${c3.length} bytes)`);
}
const src = fs.readFileSync(path.join(here, '..', '..', 'shopify', 'assets', 'hs2.js'), 'utf8');
const { code } = transformSync(src, { minify: true, loader: 'js' });
const bad = [
  [/\brequire\(/, 'require() (a dynamic import() was rewritten)'],
  [/__toESM|__commonJS/, 'esbuild module helpers'],
  [/\bimport\(/, 'a dynamic import()'],
].filter(([re]) => re.test(code));
const i = process.argv.indexOf('--out');
if (i > -1) fs.writeFileSync(process.argv[i + 1], code);
if (bad.length) { bad.forEach(([, why]) => console.log('FAIL minified hs2.js contains ' + why)); process.exit(1); }
console.log(`ok   hs2.js minifies cleanly (${src.length} -> ${code.length} bytes)`);
if (failed) process.exit(1);
