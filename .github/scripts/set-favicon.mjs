// Set the theme's favicon to a file already in Shopify Files (Content > Files), leaving every other
// theme setting as it is. Used by .github/workflows/shopify-theme-push.yml when "favicon" names a
// file (Krish approved the Biscuit favicon on 21 Oct 2026; design/brand-v3/). With "logo" as a third
// argument it sets the header logo instead, at the square icon's heights (Krish, 10 Nov 2026: the
// dachshund with the heart letter is the top-left icon; design/brand-v5/).
//
//   node .github/scripts/set-favicon.mjs path/to/config/settings_data.json heartside-favicon.png
//   node .github/scripts/set-favicon.mjs path/to/config/settings_data.json heartside-icon-dachshund.png logo
import fs from 'node:fs';

const [file, name, key = 'favicon'] = process.argv.slice(2);
if (!['favicon', 'logo'].includes(key)) throw new Error(`"${key}" is not favicon or logo`);
if (!/^[\w.-]+\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name || '')) throw new Error(`"${name}" is not a file name in Shopify Files`);
const raw = fs.readFileSync(file, 'utf8');
// Shopify starts files it writes with a /* comment */, which JSON.parse rejects
const comment = (raw.match(/^\s*\/\*[\s\S]*?\*\//) || [''])[0];
const data = JSON.parse(raw.slice(comment.length));
const value = `shopify://shop_images/${name}`;
// "current" is either the settings themselves or the name of a preset
const cur = typeof data.current === 'string' ? data.presets[data.current] : data.current;
const before = cur[key];
cur[key] = value;
// the square icon sits a little taller than the old wordmark did (41 and 28 px)
if (key === 'logo') { cur.logo_height = 44; cur.logo_height_mobile = 36; }
fs.writeFileSync(file, comment + (comment ? '\n' : '') + JSON.stringify(data, null, 2) + '\n');
console.log(before === value ? `${key} already ${value}` : `${key}: ${before || '(none)'} -> ${value}`);
