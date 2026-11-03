// Shopify rejects a section whose setting label or name runs past 70 characters, and the push then leaves that
// file at its old version on the theme (3 Nov 2026, run 165: the slider showed twice on the live page until a
// re-run). Every schema label and name in our sections and blocks stays within the limit.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../shopify/', import.meta.url);
test('every schema label and name is 70 characters or fewer', () => {
  const long = [];
  for (const dir of ['sections', 'blocks']) {
    const d = new URL(dir + '/', root);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.liquid'))) {
      const s = fs.readFileSync(new URL(f, d), 'utf8');
      if (!s.includes('{% schema %}')) continue;
      const walk = (x) => {
        if (Array.isArray(x)) return x.forEach(walk);
        if (!x || typeof x !== 'object') return;
        for (const k of ['label', 'name']) if (typeof x[k] === 'string' && x[k].length > 70) long.push(`${dir}/${f}: ${k} "${x[k]}" (${x[k].length})`);
        Object.values(x).forEach(walk);
      };
      walk(JSON.parse(s.split('{% schema %}')[1].split('{% endschema %}')[0]));
    }
  }
  assert.deepEqual(long, []);
});
