// copy-lint.mjs: one small fixture per rule, and the look-alikes each rule must leave alone.
//   node --test tools/preview/copy-lint.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as lint from './copy-lint.mjs';

const { lintLiquid, lintJs, lintTemplateJson, jsLiterals, compareBaseline, keyOf, deliveredFiles } = lint;

const here = path.dirname(fileURLToPath(import.meta.url));
const rules = (offenses) => offenses.map((o) => o.rule);
const only = (offenses, rule) => offenses.filter((o) => o.rule === rule);

test('exclamation: page text, Liquid strings, JS strings and template literals are flagged', () => {
  assert.deepEqual(rules(lintLiquid('<p>Hi there!</p>')), ['exclamation']);
  assert.deepEqual(rules(lintLiquid('<p>Done!\nNext line</p>')), ['exclamation']);
  assert.deepEqual(rules(lintLiquid("{% assign msg = 'Yes!' %}")), ['exclamation']);
  assert.deepEqual(rules(lintLiquid('<img alt="Wow! A dog">')), ['exclamation']);
  assert.deepEqual(rules(lintJs("var a = 'Done!';")), ['exclamation']);
  assert.deepEqual(rules(lintJs("var a = 'Wow! Again';")), ['exclamation']);
  assert.deepEqual(rules(lintJs("var a = '!';")), ['exclamation']);
  assert.deepEqual(rules(lintJs("var a = n.dog + '! Great name.';")), ['exclamation']);
  assert.deepEqual(rules(lintJs('var a = `Hi ${name}!`;')), ['exclamation']);
  assert.deepEqual(rules(lintJs("var a = '<p>Yay!</p>';")), ['exclamation']);
});

test('exclamation: operators, !important, HTML comments, doctype, code and comments are not copy', () => {
  assert.deepEqual(lintLiquid('{% if a != b %}ok{% endif %}'), []);
  assert.deepEqual(lintLiquid('{%- unless x != blank -%}{{ y }}{%- endunless -%}'), []);
  assert.deepEqual(lintLiquid('<!doctype html><!-- note! -->'), []);
  assert.deepEqual(lintLiquid('<div style="color: red !important">x</div>'), []);
  assert.deepEqual(lintLiquid('<style>.a { color: red !important; } /* yes! */</style>'), []);
  assert.deepEqual(lintLiquid('{% comment %}Nice!{% endcomment %}{%- comment -%} Great! {%- endcomment -%}'), []);
  assert.deepEqual(lintLiquid('{% # quick note! %}'), []);
  assert.deepEqual(lintLiquid('{% liquid\n  # a comment line!\n  assign a = b\n%}'), []);
  assert.deepEqual(lintLiquid('<script>if (!done && a !== b) go(!x);</script>'), []);
  assert.deepEqual(lintJs('if (!x) { y = a !== b && c != d; }'), []);
  assert.deepEqual(lintJs("// great!\n/* wow! */\nvar s = 'calm.';"), []);
  assert.deepEqual(lintJs("var s = 'color:red !important';"), []);
  assert.deepEqual(lintJs('var re = /!(?=x)/g, t = a / b, u = "fine";'), []);
  assert.deepEqual(lintJs("var q = 'query Cart($id:ID!){cart(id:$id){id}}';"), []);
});

test('exclamation: schema defaults count, schema info and labels do not', () => {
  const liquid = `<p>x</p>
{% schema %}
{
  "settings": [
    { "type": "text", "id": "headline", "label": "Headline!", "info": "Keep it short!", "default": "Go!" },
    { "type": "text", "id": "calm", "label": "Calm", "default": "Calm." }
  ]
}
{% endschema %}`;
  const found = lintLiquid(liquid, 'sections/x.liquid');
  assert.deepEqual(rules(found), ['exclamation']);
  assert.equal(found[0].line, 5);
  assert.equal(found[0].file, 'sections/x.liquid');
});

test('em-dash: the character, its entities and its JS escape; not en dashes or comments', () => {
  assert.deepEqual(rules(lintLiquid('<p>one — two</p>')), ['em-dash']);
  assert.deepEqual(rules(lintLiquid('<p>one &mdash; two</p>')), ['em-dash']);
  assert.deepEqual(rules(lintLiquid('<p>one &#8212; two</p>')), ['em-dash']);
  assert.deepEqual(rules(lintJs("var a = 'one \\u2014 two';")), ['em-dash']);
  assert.deepEqual(lintLiquid('<p>9–10 am</p>'), []);
  assert.deepEqual(lintLiquid('{% comment %}a — b{% endcomment %}{% doc %}c — d{% enddoc %}'), []);
  assert.deepEqual(lintJs('// a — b\nvar a = 1;'), []);
});

test('calculated-at-checkout: in text, strings and template values', () => {
  assert.deepEqual(rules(lintLiquid('<p>Shipping calculated at checkout.</p>')), ['calculated-at-checkout']);
  assert.deepEqual(rules(lintLiquid('Shipping is calculated at checkout.')), ['calculated-at-checkout']);
  assert.deepEqual(rules(lintJs("show('Shipping and taxes calculated at checkout.');")), ['calculated-at-checkout']);
  assert.deepEqual(lintJs('// shipping calculated at checkout used to show here\nvar a = 1;'), []);
  assert.deepEqual(lintLiquid('<p>Free US shipping on every order.</p>'), []);
});

test('retired-name: the old product names as written, not handles, classes or ordinary words', () => {
  for (const name of ['The Morning Mug', 'The Couch Blanket', 'The Framed Print', 'The Tree Ornament', 'Annual Review', 'Body Double', 'Uniform']) {
    assert.deepEqual(rules(lintLiquid(`<p>${name}</p>`)), ['retired-name'], name);
  }
  assert.deepEqual(rules(lintJs("var GN = { mug: 'The Morning Mug' };")), ['retired-name']);
  assert.deepEqual(lintLiquid('<a href="/products/the-morning-mug" class="hs3-tree-ornament">Mug</a>'), []);
  assert.deepEqual(lintLiquid('<p>A uniform finish, framed print or unframed.</p>'), []);
  assert.deepEqual(lintTemplateJson('{ "settings": { "product_ornament": "the-tree-ornament" } }'), []);
});

test('retired-price: $29, $89, $24, $39 in copy and as a price default; other prices and numbers pass', () => {
  for (const p of ['$29', '$89', '$24', '$39', '$29.00', '$ 39']) assert.deepEqual(rules(lintLiquid(`<p>Only ${p} today.</p>`)), ['retired-price'], p);
  for (const p of ['$45', '$59', '$119', '$129', '$290', '$24.50', '24 hours', '29 days']) assert.deepEqual(lintLiquid(`<p>Only ${p} today.</p>`), [], p);
  const schema = `{% schema %}
{ "settings": [
  { "type": "number", "id": "price_mug", "label": "Mug price", "default": 29 },
  { "type": "range", "id": "gap", "label": "Gap", "default": 24 },
  { "type": "number", "id": "price_portrait", "label": "Portrait price", "default": 59 }
] }
{% endschema %}`;
  const found = lintLiquid(schema);
  assert.deepEqual(rules(found), ['retired-price']);
  assert.equal(found[0].excerpt, 'price_mug default 29');
  assert.equal(found[0].line, 3);
});

test('biscuit-host and your-dog-has-notes: the old host and tagline, not class names or handles', () => {
  assert.deepEqual(rules(lintLiquid("<p>Hi, I'm Biscuit.</p>")), ['biscuit-host']);
  assert.deepEqual(rules(lintJs("say('Biscuit sniffs out gifts');")), ['biscuit-host']);
  assert.deepEqual(lintLiquid('<span class="hs3-biscuit hs3-biscuit--peek"></span><img src="hs3-mug-sample-biscuit.png" alt="">'), []);
  assert.deepEqual(rules(lintLiquid('<h1>Your dog has notes.</h1>')), ['your-dog-has-notes']);
  assert.deepEqual(rules(lintJs("var t = 'your dog has notes';")), ['your-dog-has-notes']);
  assert.deepEqual(lintLiquid('<a href="https://www.instagram.com/yourdoghasnotes/">Instagram</a>'), []);
});

test('us-spelling: British forms in copy are flagged, in every kind of delivered string', () => {
  assert.deepEqual(rules(lintJs("var a = 'Pick a colour';")), ['us-spelling']);
  assert.deepEqual(rules(lintLiquid('<p>Your favourite photo</p>')), ['us-spelling']);
  assert.deepEqual(rules(lintLiquid("{% assign t = 'Personalised for Pip' %}")), ['us-spelling']);
  assert.deepEqual(rules(lintLiquid('<img alt="A grey mug">')), ['us-spelling']);
  assert.deepEqual(rules(lintTemplateJson('{ "settings": { "note": "Printed in the centre." } }')), ['us-spelling']);
  assert.deepEqual(rules(lintLiquid('{% schema %}{ "settings": [ { "type": "text", "id": "t", "label": "T", "default": "Your catalogue" } ] }{% endschema %}')), ['us-spelling']);
  for (const word of ['colours', 'coloured', 'favourites', 'personalise', 'personalisation', 'organised', 'greyish', 'centres', 'labelled', 'cancelled', 'catalogues', 'behaviour', 'realise', 'recognisable', 'honoured', 'jewellery', 'Colour', 'GREY']) {
    assert.deepEqual(rules(lintJs(`var a = 'A ${word} here';`)), ['us-spelling'], word);
  }
});

test('us-spelling: US forms, look-alike words, comments and theme-editor info are left alone', () => {
  for (const word of ['color', 'colorful', 'favorite', 'personalize', 'personalization', 'organize', 'gray', 'center', 'labeled', 'canceled', 'catalog', 'behavior', 'realize', 'realistic', 'recognize', 'honor', 'jewelry', 'Greyhound', 'Italian Greyhound']) {
    assert.deepEqual(lintJs(`var a = 'A ${word} here';`), [], word);
  }
  assert.deepEqual(lintLiquid('{% comment %}colour{% endcomment %}'), []);
  assert.deepEqual(lintJs("// the personalised line\n/* grey */\nvar a = 'calm.';"), []);
  assert.deepEqual(lintLiquid('{% schema %}{ "settings": [ { "type": "text", "id": "t", "label": "Colour", "info": "Behaviour of the favourite", "default": "Color" } ] }{% endschema %}'), []);
  assert.deepEqual(lintLiquid('<style>.a { color: grey; }</style>'), []);
});

test('deliveredFiles: the Helio cart script we own is linted with our own scripts', () => {
  const files = deliveredFiles().map((f) => path.basename(f));
  assert.ok(files.includes('component-cart-items.js'), 'its refusal copy reaches buyers');
  assert.ok(files.includes('hs2.js') && files.includes('hs3.js'));
  assert.deepEqual(lint.OWNED_ASSETS, ['component-cart-items.js']);
});

test('template JSON: values with their line, never keys, and a leading /* */ note is skipped', () => {
  const json = `/*
 * auto-generated note, calculated at checkout!
 */
{
  "sections": {
    "main": {
      "blocks": {
        "price": { "type": "price", "settings": { "note": "Shipping calculated at checkout." } },
        "calculated at checkout": { "type": "text" }
      }
    }
  }
}`;
  const found = lintTemplateJson(json, 'templates/product.x.json');
  assert.deepEqual(found.map((o) => `${o.file}:${o.line}: ${o.rule}`), ['templates/product.x.json:8: calculated-at-checkout']);
});

test('line numbers point at the source line in Liquid, scripts and JS', () => {
  const liquid = '{% comment %}\nline two!\n{% endcomment %}\n<p>ok</p>\n<p>Line five!</p>\n<script>\nvar a = "seven!";\n</script>';
  assert.deepEqual(lintLiquid(liquid).map((o) => o.line), [5, 7]);
  assert.deepEqual(lintJs('var a = 1;\n\nvar b = `three\nfour!`;').map((o) => o.line), [4]);
});

test('the JS tokenizer keeps regex literals, comments and template nesting apart from strings', () => {
  const src = "var r = /'/g; // it's\nvar s = 'one', t = `a${ {x: 'two'}.x }b`, u = x / 2 / 'three'.length;";
  assert.deepEqual(jsLiterals(src).map((l) => l.text), ['one', 'a', 'two', 'b', 'three']);
});

test('baseline: known offenses pass, new ones fail, and fixed ones are reported', () => {
  const a = { file: 'f', line: 1, rule: 'em-dash', excerpt: 'x' };
  const b = { file: 'f', line: 9, rule: 'exclamation', excerpt: 'Hi!' };
  const r = compareBaseline([a, b, a], [keyOf(a), keyOf(b), 'retired-name f gone']);
  assert.equal(r.introduced, 1);
  assert.deepEqual(r.tagged.map((o) => o.known), [true, true, false]);
  assert.deepEqual(r.resolved, ['retired-name f gone']);
});

test('CLI: lists file:line:offense, exits 1, and --baseline passes until something new appears', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-copy-lint-'));
  try {
    fs.mkdirSync(path.join(root, 'shopify', 'sections'), { recursive: true });
    fs.mkdirSync(path.join(root, 'shopify', 'assets'), { recursive: true });
    fs.writeFileSync(path.join(root, 'shopify', 'sections', 'a.liquid'), '<p>Old copy!</p>\n');
    fs.writeFileSync(path.join(root, 'shopify', 'assets', 'hs-a.js'), "var a = 'calm.';\n");
    fs.writeFileSync(path.join(root, 'shopify', 'assets', 'other.js'), "var a = 'Not ours!';\n");
    fs.writeFileSync(path.join(root, 'shopify', 'assets', 'component-cart-items.js'), "var a = 'Pick a colour';\n");
    const cli = path.join(here, 'copy-lint.mjs');
    const base = path.join(root, 'baseline.json');
    const run = (...args) => spawnSync(process.execPath, [cli, '--root', root, ...args], { encoding: 'utf8' });

    const plain = run();
    assert.equal(plain.status, 1);
    assert.match(plain.stdout, /^shopify\/sections\/a\.liquid:1: exclamation: <p>Old copy!<\/p>$/m);
    assert.doesNotMatch(plain.stdout, /Not ours/);
    assert.match(plain.stdout, /^shopify\/assets\/component-cart-items\.js:1: us-spelling: Pick a colour$/m);

    assert.equal(run('--write-baseline', base).status, 0);
    const known = run('--baseline', base);
    assert.equal(known.status, 0, known.stdout);
    assert.match(known.stdout, /\(known\)/);

    fs.writeFileSync(path.join(root, 'shopify', 'assets', 'hs-a.js'), "var a = 'New \\u2014 copy';\n");
    const added = run('--baseline', base);
    assert.equal(added.status, 1);
    assert.match(added.stdout, /shopify\/assets\/hs-a\.js:1: em-dash: New — copy \(introduced\)/);

    fs.writeFileSync(path.join(root, 'shopify', 'sections', 'a.liquid'), '<p>New copy.</p>\n');
    fs.writeFileSync(path.join(root, 'shopify', 'assets', 'hs-a.js'), "var a = 'calm.';\n");
    const fixed = run('--baseline', base);
    assert.equal(fixed.status, 0);
    assert.match(fixed.stdout, /resolved, can leave the baseline: exclamation shopify\/sections\/a\.liquid <p>Old copy!<\/p>/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
