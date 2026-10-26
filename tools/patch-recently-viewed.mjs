// Apply only the missing-product guard to a separately retrieved theme snippet.
// The base theme remains private; this repository stores our narrow change only.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function patchRecentlyViewed(source) {
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const anchor = "            {% assign product = products | find: 'id', int_id %}";
  const guard = [
    '            {% if product == blank %}',
    '              {% continue %}',
    '            {% endif %}',
  ].join(newline);
  if (source.split(anchor).length !== 2) {
    throw new Error('Expected one product lookup; refusing an unknown snippet revision.');
  }
  if (source.includes(anchor + newline + guard)) return source;
  return source.replace(anchor, anchor + newline + guard);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || resolve(input) === resolve(output)) {
    throw new Error('Usage: node tools/patch-recently-viewed.mjs <backup> <candidate>; paths must differ.');
  }
  const before = await readFile(input, 'utf8');
  const after = patchRecentlyViewed(before);
  await writeFile(output, after, { flag: 'wx' });
  const sha256 = value => createHash('sha256').update(value).digest('hex');
  console.log(JSON.stringify({ changed: before !== after, before: sha256(before), after: sha256(after) }));
}
