// minify-check.mjs covers every shopify/assets/hs*.js, read from the folder: on 28 Oct its
// hand-written list had left out hs-breeds.js and hs-cart-quantity.js, so a new asset was never
// checked against Shopify's minifier until someone remembered to add it.
//
//   node --test tools/preview/minify-check.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(here, '..', '..', 'shopify', 'assets');
const run = (...args) => new Promise((resolve) => execFile(process.execPath, [path.join(here, 'minify-check.mjs'), ...args], {timeout: 120000}, (err, stdout, stderr) => resolve({code: err ? err.code : 0, out: stdout + stderr})));

test('every hs*.js asset is minified and checked, and --out still keeps hs2.js', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-minify-'));
  try {
    const out = path.join(dir, 'hs2.min.js');
    const r = await run('--out', out);
    assert.equal(r.code, 0, r.out);
    const names = fs.readdirSync(assets).filter((f) => /^hs.*\.js$/.test(f));
    assert.ok(names.includes('hs-breeds.js') && names.includes('hs-cart-quantity.js'));
    for (const name of names) assert.match(r.out, new RegExp(`^ok   ${name.replace(/\./g, '\\.')} minifies cleanly`, 'm'), name);
    assert.ok(fs.statSync(out).size > 1000, 'the minified hs2.js was written');
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
