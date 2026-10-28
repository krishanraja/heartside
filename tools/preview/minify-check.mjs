// Shopify minifies theme JavaScript on its CDN, so heartside.io never runs shopify/assets/hs2.js
// as written. On 6 October its minifier turned an import() into a require() that doesn't exist
// in a browser, and every test that served the unminified file passed. This minifies every
// shopify/assets/hs*.js the same way (esbuild) and fails on anything that only works unminified.
// The list is read from the folder, so a new asset is checked from its first commit.
//
//   cd tools/preview && node minify-check.mjs            # exit 1 on a problem
//   node minify-check.mjs --out /tmp/hs2.min.js           # also keep hs2.js minified, for tests
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(here, '..', '..', 'shopify', 'assets');
const BAD = [
  [/\brequire\(/, 'require() (a dynamic import() was rewritten)'],
  [/__toESM|__commonJS/, 'esbuild module helpers'],
  [/\bimport\(/, 'a dynamic import()'],
];
const names = fs.readdirSync(assets).filter((f) => /^hs.*\.js$/.test(f)).sort();
let failed = false;
for (const name of names) {
  const src = fs.readFileSync(path.join(assets, name), 'utf8');
  const { code } = transformSync(src, { minify: true, loader: 'js' });
  const bad = BAD.filter(([re]) => re.test(code));
  // --out keeps the minified hs2.js, as the in-app test expects
  if (name === 'hs2.js') { const i = process.argv.indexOf('--out'); if (i > -1) fs.writeFileSync(process.argv[i + 1], code); }
  if (bad.length) { bad.forEach(([, why]) => console.log(`FAIL minified ${name} contains ${why}`)); failed = true; }
  else console.log(`ok   ${name} minifies cleanly (${src.length} -> ${code.length} bytes)`);
}
console.log(`${names.length} hs*.js assets checked`);
if (failed) process.exit(1);
