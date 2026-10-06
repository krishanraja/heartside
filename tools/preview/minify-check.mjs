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
