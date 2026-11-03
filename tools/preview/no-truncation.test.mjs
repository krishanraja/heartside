// Krish, 3 Nov 2026: "Ensure text is never truncated." No theme stylesheet or section may cut text short with an
// ellipsis or a line clamp; long words wrap instead (overflow-wrap) and the layout makes room. The live gate and
// the homepage browser test also check that no visible text is clipped by its box.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../shopify/', import.meta.url);
test('no ellipsis or line clamp anywhere in the theme', () => {
  const hits = [];
  for (const dir of ['assets', 'sections', 'snippets', 'blocks']) {
    const d = new URL(dir + '/', root);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((x) => /\.(css|liquid|js)$/.test(x))) {
      fs.readFileSync(new URL(f, d), 'utf8').split('\n').forEach((l, i) => {
        if (/text-overflow\s*:\s*ellipsis|line-clamp|textOverflow\s*=\s*['"]ellipsis/.test(l)) hits.push(`${dir}/${f}:${i + 1}`);
      });
    }
  }
  assert.deepEqual(hits, []);
});
