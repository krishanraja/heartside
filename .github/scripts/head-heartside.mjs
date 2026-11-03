// Put Heartside's head lines (snippets/hs-head.liquid: every favicon size, the touch icon, the manifest and
// the page colour) into Helio's layout, and switch off Helio's single 32 px icon and its empty theme colour,
// which would otherwise compete with them (Krish, 3 Nov 2026: "the favicons don't even show"). Nothing is
// deleted: each line it switches off is wrapped in a marked Liquid comment, so --restore puts the layout
// back exactly as it was. Running it twice changes nothing. Used by .github/workflows/shopify-theme-push.yml
// when "head_heartside" is ticked.
//
//   node .github/scripts/head-heartside.mjs path/to/layout/theme.liquid
//   node .github/scripts/head-heartside.mjs path/to/layout/theme.liquid --restore
import fs from 'node:fs';

const file = process.argv[2];
const restore = process.argv.includes('--restore');
const stop = (why) => { console.log(`::error::${file}: ${why} Nothing was changed.`); process.exit(1); };
if (!file || !fs.existsSync(file)) stop('does not exist.');
const before = fs.readFileSync(file, 'utf8');

const RENDER = "{%- render 'hs-head' -%}{%- comment -%} head-heartside.mjs {%- endcomment -%}";
const OFF_OPEN = '{%- comment -%} head-heartside.mjs off\n';
const OFF_CLOSE = '\n{%- endcomment -%}';
const offRe = /\{%- comment -%\} head-heartside\.mjs off\n([\s\S]*?)\n\{%- endcomment -%\}/g;

let text = before;
const notes = [];
if (restore) {
  if (text.includes(RENDER)) { text = text.replace(RENDER + '\n', '').replace(RENDER, ''); notes.push('removed the hs-head render'); }
  const n = (text.match(offRe) || []).length;
  text = text.replace(offRe, '$1');
  if (n) notes.push(`switched ${n} Helio line(s) back on`);
} else {
  const heads = text.match(/<\/head>/gi) || [];
  if (heads.length !== 1) stop(`has ${heads.length} </head> tags, not one.`);
  // Helio's own icon and theme colour, as tags; Liquid inside them is fine, a comment inside is not
  const targets = [/<link\s[^>]*rel=["']icon["'][^>]*>/gi, /<meta\s[^>]*name=["']theme-color["'][^>]*>/gi];
  for (const re of targets) {
    text = text.replace(re, (tag, at, all) => {
      const already = all.lastIndexOf(OFF_OPEN.trim(), at) > all.lastIndexOf('endcomment', at);
      if (already) return tag;
      if (/comment/.test(tag)) stop('has a comment inside a tag it would switch off.');
      notes.push('switched off ' + tag.replace(/\s+/g, ' ').slice(0, 60));
      return OFF_OPEN + tag + OFF_CLOSE;
    });
  }
  if (!text.includes(RENDER)) { text = text.replace(/<\/head>/i, RENDER + '\n</head>'); notes.push('rendered hs-head before </head>'); }
}

if (text === before) { console.log(`${file}: already ${restore ? 'restored' : 'in place'}, nothing changed.`); process.exit(0); }
fs.writeFileSync(file, text);
console.log(`${file}: ${notes.join('; ')}.`);
