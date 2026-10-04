// Render the Heartside homepage sections locally, the way Shopify would, so the
// Liquid can be checked and screenshotted without touching the store.
//
//   cd tools/preview && npm install && node render.mjs && node shots.mjs
//
// Shopify-only filters and tags (asset_url, image_url, image_tag, money, form,
// schema) are stubbed. Products are mocks with the planned prices. This is a
// preview: the real render happens in Shopify, inside the Helio theme.
import { Liquid } from 'liquidjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const theme = path.join(repo, 'shopify');
const out = path.join(here, 'out');
fs.mkdirSync(path.join(out, 'assets'), { recursive: true });

// ------------------------------------------------------------ engine + stubs
const engine = new Liquid({
  root: [path.join(theme, 'sections')],
  partials: [path.join(theme, 'snippets')],
  extname: '.liquid',
  strictFilters: true,
});

const kw = (args) => Object.fromEntries(args.filter(Array.isArray));
engine.registerFilter('asset_url', (name) => `assets/${name}`);
engine.registerFilter('image_url', (img) => (typeof img === 'string' ? img : img && img.src));
engine.registerFilter('image_tag', (src, ...args) => {
  const o = kw(args);
  const attrs = Object.entries(o).filter(([k]) => k !== 'widths')
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
  return `<img src="${src}" ${attrs}${'alt' in o ? '' : ' alt=""'}>`;
});
engine.registerFilter('money', (cents) => `$${(Number(cents) / 100).toFixed(2)}`);
engine.registerFilter('stylesheet_tag', (href) => `<link rel="stylesheet" href="${href}">`);
engine.registerFilter('json', (v) => JSON.stringify(v));

engine.registerTag('form', {
  parse(token, remain) {
    this.cls = (token.args.match(/class:\s*'([^']*)'/) || [])[1] || '';
    this.id = (token.args.match(/id:\s*'([^']*)'/) || [])[1] || '';
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain)
      .on('tag:endform', () => stream.stop())
      .on('template', (t) => this.tpls.push(t))
      .on('end', () => { throw new Error('form not closed'); });
    stream.start();
  },
  * render(ctx, emitter) {
    ctx.push({ form: { posted_successfully: false, errors: false } });
    const html = yield this.liquid.renderer.renderTemplates(this.tpls, ctx);
    ctx.pop();
    emitter.write(`<form method="post" action="/contact#${this.id}" id="${this.id}" class="${this.cls}" onsubmit="return false"><input type="hidden" name="form_type" value="customer">${html}</form>`);
  },
});

// --------------------------------------------------------------- mock store
const products = {
  ornament: { title: 'Their Person Ornament', url: '/products/their-person-ornament', price: 3499,
    featured_media: { src: 'assets/hs-ornament-dachshund.webp', alt: 'Their Person Ornament' }, collections: [{ handle: 'all-gifts' }] },
  sling: { title: 'The Heartside Sling', url: '/products/heartside-sling', price: 7999, featured_media: null, collections: [{ handle: 'all-gifts' }] },
  tag: { title: 'The Heartside Tag', url: '/products/heartside-tag', price: 2499, featured_media: null, collections: [{ handle: 'all-gifts' }] },
  bottle: { title: 'Travel Water Bottle', url: '/products/travel-water-bottle', price: 2999, featured_media: null, collections: [{ handle: 'all-gifts' }] },
};
const productFor = { hero: 'ornament', maker: 'ornament', wall: 'ornament', sticky: 'ornament' };
const giftProducts = ['ornament', 'sling', 'tag', 'bottle'];

// ---------------------------------------------------------------- sections
function readSection(type) {
  const src = fs.readFileSync(path.join(theme, 'sections', `${type}.liquid`), 'utf8');
  const m = src.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  const schema = JSON.parse(m[1]);
  const body = src.replace(m[0], '').replace(/posted_successfully\?/g, 'posted_successfully');
  return { schema, body };
}
const defaults = (settings = []) => Object.fromEntries(settings.filter((s) => 'default' in s).map((s) => [s.id, s.default]));

async function renderSection(key, conf, extra = {}) {
  const { schema, body } = readSection(conf.type);
  const settings = { ...defaults(schema.settings), ...(conf.settings || {}) };
  if (productFor[key]) settings.product = products[productFor[key]];
  const blocks = (conf.block_order || []).map((id, i) => {
    const b = conf.blocks[id];
    const bs = (schema.blocks || []).find((x) => x.type === b.type) || {};
    const s = { ...defaults(bs.settings), ...(b.settings || {}) };
    if (key === 'gifts') s.product = products[giftProducts[i]];
    return { id, type: b.type, settings: s, shopify_attributes: '' };
  });
  const html = await engine.parseAndRender(body, {
    section: { id: `template--index__${key}`, settings, blocks },
    shop: { url: 'https://heart-side.org', domain: 'heart-side.org' },
    request: { design_mode: false },
    ...extra,
  });
  return `<section id="shopify-section-${key}" class="shopify-section">${html}</section>`;
}

const index = JSON.parse(fs.readFileSync(path.join(theme, 'templates', 'index.json'), 'utf8'));
const announce = await renderSection('announce', { type: 'hs-announcement', settings: {} });
const main = [];
for (const key of index.order) main.push(await renderSection(key, index.sections[key]));

// A stand-in for Helio's header and footer, so the sections are seen in context
const header = `
<header class="mock-header">
  <span class="mock-icon" aria-hidden="true">&#9776;</span>
  <img src="assets/heartside-logo.png" alt="Heartside" class="mock-logo">
  <span class="mock-icon" aria-hidden="true">&#128722;</span>
</header>`;
const footer = `<footer class="mock-footer"><p>Helio footer (policies, contact, the heart) renders here.</p></footer>`;
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Heartside homepage preview</title>
<style>
  body { margin: 0; background: #fbf6f1; }
  .mock-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fbf6f1; border-bottom: 1px solid rgba(18,16,16,.08); font: 22px system-ui; }
  .mock-logo { height: 40px; width: auto; }
  .mock-footer { padding: 48px 16px 120px; text-align: center; font: 14px system-ui; color: #6b605b; background: #f3ece5; }
  .mock-icon { width: 28px; text-align: center; }
</style>
</head><body>
<div id="shopify-section-announce">${announce}</div>
${header}
<main>${main.join('\n')}</main>
${footer}
</body></html>`;
fs.writeFileSync(path.join(out, 'index.html'), page);

// assets: the theme's, plus the logo for the stand-in header
for (const f of fs.readdirSync(path.join(theme, 'assets'))) fs.copyFileSync(path.join(theme, 'assets', f), path.join(out, 'assets', f));
fs.copyFileSync(path.join(repo, 'assets', 'heartside-logo.png'), path.join(out, 'assets', 'heartside-logo.png'));
console.log(`rendered ${index.order.length + 1} sections -> tools/preview/out/index.html`);
