// Set the theme's favicon to a file already in Shopify Files (Content > Files), leaving every other
// theme setting as it is. Used by .github/workflows/shopify-theme-push.yml when "favicon" names a
// file (Krish approved the Biscuit favicon on 21 Oct 2026; design/brand-v3/).
//
//   node .github/scripts/set-favicon.mjs path/to/config/settings_data.json heartside-favicon.png
import fs from 'node:fs';

const [file, name] = process.argv.slice(2);
if (!/^[\w.-]+\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name || '')) throw new Error(`"${name}" is not a file name in Shopify Files`);
const raw = fs.readFileSync(file, 'utf8');
// Shopify starts files it writes with a /* comment */, which JSON.parse rejects
const comment = (raw.match(/^\s*\/\*[\s\S]*?\*\//) || [''])[0];
const data = JSON.parse(raw.slice(comment.length));
const value = `shopify://shop_images/${name}`;
// "current" is either the settings themselves or the name of a preset
const cur = typeof data.current === 'string' ? data.presets[data.current] : data.current;
const before = cur.favicon;
cur.favicon = value;
fs.writeFileSync(file, comment + (comment ? '\n' : '') + JSON.stringify(data, null, 2) + '\n');
console.log(before === value ? `favicon already ${value}` : `favicon: ${before || '(none)'} -> ${value}`);
