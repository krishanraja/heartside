// Shopify Theme Check on the Heartside files only. The repo holds our sections, snippets,
// templates and assets, not the whole Helio theme, so this copies them into a temporary
// theme folder with a stub layout, settings and locale, runs @shopify/theme-check-node, and
// reports offenses in our files (the stubs' own offenses are ignored).
//
//   cd tools/preview && node theme-check.mjs        # exit 1 on any offense in our files
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check } from '@shopify/theme-check-node';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '..', '..', 'shopify');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-theme-check-'));
const theme = path.join(dir, 'theme');
for (const sub of ['assets', 'sections', 'snippets', 'templates']) {
  if (fs.existsSync(path.join(src, sub))) fs.cpSync(path.join(src, sub), path.join(theme, sub), { recursive: true });
}
fs.mkdirSync(path.join(theme, 'layout'), { recursive: true });
fs.mkdirSync(path.join(theme, 'config'), { recursive: true });
fs.mkdirSync(path.join(theme, 'locales'), { recursive: true });
fs.writeFileSync(path.join(theme, 'layout', 'theme.liquid'), '<!doctype html><html><head>{{ content_for_header }}</head><body>{{ content_for_layout }}</body></html>\n');
fs.writeFileSync(path.join(theme, 'config', 'settings_schema.json'), '[]\n');
fs.writeFileSync(path.join(theme, 'locales', 'en.default.json'), '{}\n');

const offenses = await check(theme);
const ours = offenses.filter((o) => !/layout\/theme\.liquid|config\/|locales\//.test(o.uri));
for (const o of ours) {
  const f = o.uri.split('/theme/')[1];
  console.log(`[${['ERROR', 'WARN', 'INFO'][o.severity] ?? o.severity}] ${o.check} ${f}:${o.start?.line ?? ''}  ${o.message}`);
}
console.log(`${ours.length ? 'FAIL' : 'ok  '} ${ours.length} offenses in Heartside files (${offenses.length - ours.length} in the stubs ignored)`);
fs.rmSync(dir, { recursive: true, force: true });
process.exit(ours.length ? 1 : 0);
