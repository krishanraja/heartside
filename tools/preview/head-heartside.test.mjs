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
const run = (...args) => spawnSync(process.execPath, [script, ...args], {encoding: 'utf8'});
const at = (name, rel) => { const f = path.join(dir, name, rel); fs.mkdirSync(path.dirname(f), {recursive: true}); return f; };
// shaped like the live Helio files (read from the theme, 3 Nov): the header's bare Organization with the old
// logo, and meta-tags' empty theme colour
const header = `{% endcapture %}

<script type="application/ld+json">
  {
    "@context": "http://schema.org",
    "@type": "Organization",
    "name": {{ shop.name | json }},
    {% if settings.logo %}
      "logo": {{ settings.logo | image_url: width: 500 | prepend: "https:" | json }},
    {% endif %}
    "url": {{ request.origin | append: page.url | json }}
  }
</script>

<header-component id="header-component">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}</script>
`;
const meta = `<meta charset="utf-8">
<meta
  name="theme-color"
  content=""
>
<meta property="og:site_name" content="{{ shop.name }}">
`;

test('renders hs-head once before </head> and switches off Helio\'s icon and colour, not deleting them', () => {
  const f = at('a', 'layout/theme.liquid'); fs.writeFileSync(f, layout);
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
  const f = at('b', 'layout/theme.liquid'); fs.writeFileSync(f, '<html><body></body></html>');
  const r = run(f);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /::error::.*Nothing was changed/);
  assert.equal(fs.readFileSync(f, 'utf8'), '<html><body></body></html>');
});

test('switches off Helio\'s bare Organization and empty theme colour, keeps other JSON-LD, and restores all three files', () => {
  const l = at('c', 'layout/theme.liquid'), h = at('c', 'sections/header.liquid'), m = at('c', 'snippets/meta-tags.liquid');
  fs.writeFileSync(l, layout); fs.writeFileSync(h, header); fs.writeFileSync(m, meta);
  assert.equal(run(l, h, m).status, 0);
  const ht = fs.readFileSync(h, 'utf8'), mt = fs.readFileSync(m, 'utf8');
  assert.match(ht, /head-heartside\.mjs off\n<script type="application\/ld\+json">[\s\S]*?"@type": "Organization"[\s\S]*?<\/script>\n\{%- endcomment -%\}/);
  assert.match(ht, /\n<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"BreadcrumbList"/, 'other JSON-LD stays on');
  assert.doesNotMatch(ht, /render 'hs-head'/, 'only the layout gets the render line');
  assert.match(mt, /head-heartside\.mjs off\n<meta\n  name="theme-color"/);
  assert.equal(run(l, h, m).status, 0);
  assert.equal(fs.readFileSync(h, 'utf8'), ht, 'a second run changes nothing');
  assert.equal(run(l, h, m, '--restore').status, 0);
  assert.equal(fs.readFileSync(l, 'utf8'), layout); assert.equal(fs.readFileSync(h, 'utf8'), header); assert.equal(fs.readFileSync(m, 'utf8'), meta);
});

test('leaves our own Organization alone', () => {
  const h = at('d', 'sections/header.liquid');
  const ours = '<script type="application/ld+json">{"@graph":[{"@type": "Organization","@id":"https://heartside.io/#organization"}]}</script>\n';
  fs.writeFileSync(h, ours);
  assert.equal(run(h).status, 0);
  assert.equal(fs.readFileSync(h, 'utf8'), ours);
});

test('hs-head carries every icon size from the approved brand-v5 set, the manifest and a page colour', () => {
  const snip = fs.readFileSync(new URL('shopify/snippets/hs-head.liquid', root), 'utf8');
  for (const n of [16, 32, 48, 192]) {
    assert.match(snip, new RegExp(`sizes="${n}x${n}" href="\\{\\{ 'hs-favicon-${n}\\.png' \\| asset_url \\}\\}"`));
    assert.deepEqual(fs.readFileSync(new URL(`shopify/assets/hs-favicon-${n}.png`, root)), fs.readFileSync(new URL(`design/brand-v5/favicon-${n}.png`, root)), `${n} px is a byte copy`);
  }
  assert.match(snip, /rel="apple-touch-icon" sizes="180x180"/);
  assert.match(snip, /<meta name="theme-color" content="#fbf6f1">/);
  const m = JSON.parse(fs.readFileSync(new URL('shopify/assets/hs-manifest.json', root), 'utf8'));
  for (const i of m.icons) assert.ok(fs.existsSync(new URL('shopify/assets/' + i.src, root)), i.src);
});
