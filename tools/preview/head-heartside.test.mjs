// .github/scripts/head-heartside.mjs on a layout head shaped like Helio's: one 32 px favicon inside an
// if, a theme colour from the settings, content_for_header. It renders hs-head once, switches Helio's two
// lines off without deleting them, changes nothing the second time, and --restore gives the file back
// byte for byte (Krish, 3 Nov 2026: "the favicons don't even show").
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script = fileURLToPath(new URL('../../.github/scripts/head-heartside.mjs', import.meta.url));
const root = new URL('../../', import.meta.url);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-head-'));
const layout = `<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    {%- if settings.favicon != blank -%}
      <link
        rel="icon"
        type="image/png"
        href="{{ settings.favicon | image_url: width: 32, height: 32 }}"
      >
    {%- endif -%}
    <meta
      name="theme-color"
      content="{{ settings.color_background }}"
    >
    {%- render 'meta-tags' -%}
    {{ content_for_header }}
  </head>
  <body>{{ content_for_layout }}</body>
</html>
`;
const run = (file, ...args) => spawnSync(process.execPath, [script, file, ...args], {encoding: 'utf8'});

test('renders hs-head once before </head> and switches off Helio\'s icon and colour, not deleting them', () => {
  const f = path.join(dir, 'a.liquid'); fs.writeFileSync(f, layout);
  assert.equal(run(f).status, 0);
  const t = fs.readFileSync(f, 'utf8');
  assert.equal((t.match(/render 'hs-head'/g) || []).length, 1);
  assert.ok(t.indexOf("render 'hs-head'") < t.indexOf('</head>'));
  assert.equal((t.match(/head-heartside\.mjs off/g) || []).length, 2);
  assert.ok(t.includes('settings.favicon | image_url'), 'Helio\'s icon line is kept, inside a comment');
  assert.ok(t.includes("{%- render 'meta-tags' -%}") && t.includes('{{ content_for_header }}'), 'everything else is untouched');
  assert.equal(run(f).status, 0);
  assert.equal(fs.readFileSync(f, 'utf8'), t, 'a second run changes nothing');
  assert.equal(run(f, '--restore').status, 0);
  assert.equal(fs.readFileSync(f, 'utf8'), layout, '--restore gives the layout back byte for byte');
});

test('refuses a layout without exactly one </head>', () => {
  const f = path.join(dir, 'b.liquid'); fs.writeFileSync(f, '<html><body></body></html>');
  const r = run(f);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /::error::.*Nothing was changed/);
  assert.equal(fs.readFileSync(f, 'utf8'), '<html><body></body></html>');
});

test('hs-head carries every icon size from the approved brand-v4 set, the manifest and a page colour', () => {
  const snip = fs.readFileSync(new URL('shopify/snippets/hs-head.liquid', root), 'utf8');
  for (const n of [16, 32, 48, 192]) {
    assert.match(snip, new RegExp(`sizes="${n}x${n}" href="\\{\\{ 'hs-favicon-${n}\\.png' \\| asset_url \\}\\}"`));
    assert.deepEqual(fs.readFileSync(new URL(`shopify/assets/hs-favicon-${n}.png`, root)), fs.readFileSync(new URL(`design/brand-v4/favicon-${n}.png`, root)), `${n} px is a byte copy`);
  }
  assert.match(snip, /rel="apple-touch-icon" sizes="180x180"/);
  assert.match(snip, /<meta name="theme-color" content="#fbf6f1">/);
  const m = JSON.parse(fs.readFileSync(new URL('shopify/assets/hs-manifest.json', root), 'utf8'));
  for (const i of m.icons) assert.ok(fs.existsSync(new URL('shopify/assets/' + i.src, root)), i.src);
});
