// Put Heartside's head lines (snippets/hs-head.liquid: every favicon size, the touch icon, the manifest and
// the page colour) into Helio's layout, and switch off what Helio writes that competes with them (Krish,
// 3 Nov 2026: "the favicons don't even show"): its single 32 px icon, its empty theme colour
// (snippets/meta-tags.liquid) and its bare Organization block with the old logo (sections/header.liquid),
// which left two Organizations in the structured data beside ours (snippets/hs-schema.liquid). Nothing is
// deleted: each piece it switches off is wrapped in a marked Liquid comment, so --restore puts every file
// back exactly as it was. Running it twice changes nothing. Used by .github/workflows/shopify-theme-push.yml
// when "head_heartside" is ticked. Only the layout (a path ending layout/theme.liquid) gets the render line.
//
//   node .github/scripts/head-heartside.mjs layout/theme.liquid [sections/header.liquid snippets/meta-tags.liquid]
//   node .github/scripts/head-heartside.mjs <the same files> --restore
import fs from 'node:fs';

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const restore = process.argv.includes('--restore');
const RENDER = "{%- render 'hs-head' -%}{%- comment -%} head-heartside.mjs {%- endcomment -%}";
const OFF_OPEN = '{%- comment -%} head-heartside.mjs off\n';
const OFF_CLOSE = '\n{%- endcomment -%}';
const offRe = /\{%- comment -%\} head-heartside\.mjs off\n([\s\S]*?)\n\{%- endcomment -%\}/g;
// Helio's pieces, as whole tags or blocks; Liquid inside them is fine, a comment inside is not
const TARGETS = [
  { re: /<link\s[^>]*rel=["']icon["'][^>]*>/gi },
  { re: /<meta\s[^>]*name=["']theme-color["'][^>]*>/gi },
  // a JSON-LD Organization that is not ours (ours carries the #organization @id)
  { re: /<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi, keep: (b) => !/"@type"\s*:\s*"Organization"/.test(b) || /#organization/.test(b) },
];
if (!files.length) { console.log('::error::name at least the layout file. Nothing was changed.'); process.exit(1); }

const out = [];
for (const file of files) {
  const stop = (why) => { console.log(`::error::${file}: ${why} Nothing was changed.`); process.exit(1); };
  if (!fs.existsSync(file)) stop('does not exist.');
  const before = fs.readFileSync(file, 'utf8');
  const layout = /(^|\/)layout\/theme\.liquid$/.test(file);
  let text = before;
  const notes = [];
  if (restore) {
    if (text.includes(RENDER)) { text = text.replace(RENDER + '\n', '').replace(RENDER, ''); notes.push('removed the hs-head render'); }
    const n = (text.match(offRe) || []).length;
    text = text.replace(offRe, '$1');
    if (n) notes.push(`switched ${n} Helio piece(s) back on`);
  } else {
    if (layout) {
      const heads = text.match(/<\/head>/gi) || [];
      if (heads.length !== 1) stop(`has ${heads.length} </head> tags, not one.`);
    }
    for (const t of TARGETS) {
      text = text.replace(t.re, (tag, at, all) => {
        const already = all.lastIndexOf(OFF_OPEN.trim(), at) > all.lastIndexOf('endcomment', at);
        if (already || (t.keep && t.keep(tag))) return tag;
        if (/\{%-?\s*(end)?comment/.test(tag)) stop('has a comment inside a piece it would switch off.');
        notes.push('switched off ' + tag.replace(/\s+/g, ' ').slice(0, 60));
        return OFF_OPEN + tag + OFF_CLOSE;
      });
    }
    if (layout && !text.includes(RENDER)) { text = text.replace(/<\/head>/i, RENDER + '\n</head>'); notes.push('rendered hs-head before </head>'); }
  }
  out.push([file, before, text, notes]);
}
// every file is checked before any is written, so a refusal leaves all of them as they were
for (const [file, before, text, notes] of out) {
  if (text === before) { console.log(`${file}: already ${restore ? 'restored' : 'in place'}, nothing changed.`); continue; }
  fs.writeFileSync(file, text);
  console.log(`${file}: ${notes.join('; ')}.`);
}
