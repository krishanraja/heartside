// Render the Heartside theme sections locally, the way Shopify would, so the Liquid
// can be checked and screenshotted without touching the store.
//
//   cd tools/preview && npm install && node render.mjs && node shots.mjs
//
// Shopify-only filters and tags (asset_url, image_url, image_tag, money, form,
// schema) are stubbed, and products are mocks at the v2 prices. This is a layout
// check only: the real render happens in Shopify, inside the Helio theme.
import { Liquid } from 'liquidjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const theme = path.join(repo, 'shopify');
const out = path.join(here, 'out');
fs.mkdirSync(path.join(out, 'assets'), { recursive: true });

// --------------------------------------------- Shopify tokenizer pre-check
// Shopify's Liquid ends an output tag {{ }} at the FIRST closing brace, even inside a
// quoted string, so '{{ x | replace: "{dog}", y }}' renders fine here but is rejected by
// Shopify. Fail early on that pattern.
for (const dir of ['sections', 'snippets']) {
  for (const f of fs.readdirSync(path.join(theme, dir))) {
    const src = fs.readFileSync(path.join(theme, dir, f), 'utf8');
    for (const m of src.matchAll(/\{\{(?:(?!\}\}).)*?\}(?!\})/gs)) {
      throw new Error(`${dir}/${f}: Shopify cannot parse this output (a closing brace inside {{ }}): ${m[0].slice(0, 80)}`);
    }
  }
}

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
  const attrs = Object.entries(o).filter(([k]) => k !== 'widths').map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
  return `<img src="${src}" ${attrs}${'alt' in o ? '' : ' alt=""'}>`;
});
engine.registerFilter('money', (cents) => `$${(Number(cents) / 100).toFixed(2)}`);
engine.registerFilter('stylesheet_tag', (href) => `<link rel="stylesheet" href="${href}">`);
engine.registerFilter('json', (v) => JSON.stringify(v));
engine.registerTag('form', {
  parse(token, remain) {
    this.id = (token.args.match(/id:\s*'([^']*)'/) || [])[1] || '';
    this.kind = (token.args.match(/^'([^']*)'/) || [])[1] || '';
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
    const action = this.kind === 'product' ? '/cart/add' : '/contact';
    emitter.write(`<form method="post" action="${action}" id="${this.id}" onsubmit="return false"><input type="hidden" name="form_type" value="${this.kind}">${html}</form>`);
  },
});

// --------------------------------------------------------------- mock store
const variant = (id, title, price, available = true) => ({ id, title, price, available });
const products = {
  poster: {
    title: 'The Annual Review', url: '/products/the-annual-review', price: 3900, media: [], featured_media: null,
    has_only_default_variant: true, options: ['Title'], variants: [variant(1, 'Default Title', 3900)],
    description: '<p>A 12 by 18 inch poster of your annual review, written and signed by your dog. Printed on matte paper and checked by a person before it prints.</p>',
  },
  pillow: {
    title: 'The Body Double', url: '/products/the-body-double', price: 5900, media: [], featured_media: null,
    has_only_default_variant: false, options: ['Size'],
    variants: [variant(11, '10″', 4900), variant(12, '16″', 5900), variant(13, '22″', 6900, false)],
    description: "<p>A pillow cut to your dog's exact outline. For groomer days, vet days, and the occasional covert operation to the kitchen.</p>",
  },
};
for (const p of Object.values(products)) p.selected_or_first_available_variant = p.variants.find((v) => v.available);

// ---------------------------------------------------------------- sections
function readSection(type) {
  const src = fs.readFileSync(path.join(theme, 'sections', `${type}.liquid`), 'utf8');
  const m = src.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  return { schema: JSON.parse(m[1]), body: src.replace(m[0], '') };
}
const defaults = (settings = []) => Object.fromEntries(settings.filter((s) => 'default' in s).map((s) => [s.id, s.default]));

async function renderSection(key, conf, ctx) {
  const { schema, body } = readSection(conf.type);
  const settings = { ...defaults(schema.settings), ...(conf.settings || {}) };
  const blocks = (conf.block_order || []).map((id) => {
    const b = conf.blocks[id];
    const bs = (schema.blocks || []).find((x) => x.type === b.type) || {};
    return { id, type: b.type, settings: { ...defaults(bs.settings), ...(b.settings || {}) }, shopify_attributes: '' };
  });
  const html = await engine.parseAndRender(body, {
    section: { id: `template--${key}`, settings, blocks },
    shop: { url: 'https://heartside.io', domain: 'heartside.io' },
    request: { design_mode: false },
    routes: { root_url: 'index.html' },
    ...ctx,
  });
  return `<section id="shopify-section-${key}" class="shopify-section">${html}</section>`;
}

const header = `
<header class="mock-header">
  <img src="assets/heartside-logo.png" alt="Heartside" class="mock-logo">
  <nav><a href="#review">Your review</a><a href="#benefits">Benefits package</a><a href="#closure"><b>Christmas deadlines</b></a></nav>
</header>`;
const footer = `<footer class="mock-footer"><p>Helio footer (policies, contact) renders here.</p></footer>`;

async function page(file, templateName, ctx = {}) {
  const tpl = JSON.parse(fs.readFileSync(path.join(theme, 'templates', templateName), 'utf8'));
  const memo = await renderSection('memo', { type: 'hs2-memo' }, ctx);
  const main = [];
  for (const key of tpl.order) main.push(await renderSection(key, tpl.sections[key], ctx));
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Heartside preview: ${templateName}</title>
<style>
  body { margin: 0; background: #FBF6F1; }
  .mock-header { max-width: 1180px; margin: 0 auto; padding: 16px 20px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; font: 15px system-ui; }
  .mock-header nav { display: flex; flex-wrap: wrap; gap: 18px; } .mock-header a { color: #121010; text-decoration: none; }
  .mock-logo { height: 42px; width: auto; }
  .mock-footer { padding: 40px 16px 60px; text-align: center; font: 14px system-ui; color: #5A4A44; background: #F3ECE5; }
</style>
</head><body>
${memo}
${header}
<main>${main.join('\n')}</main>
${footer}
</body></html>`;
  fs.writeFileSync(path.join(out, file), html);
  return file;
}

const written = [
  await page('index.html', 'index.json'),
  await page('product-review.html', 'product.review.json', { product: products.poster }),
  await page('product-pillow.html', 'product.heartside.json', { product: products.pillow }),
];
for (const f of fs.readdirSync(path.join(theme, 'assets'))) fs.copyFileSync(path.join(theme, 'assets', f), path.join(out, 'assets', f));
fs.copyFileSync(path.join(repo, 'assets', 'heartside-logo.png'), path.join(out, 'assets', 'heartside-logo.png'));
console.log('rendered', written.join(', '));
