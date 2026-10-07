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

// Shopify also rejects a schema setting whose default is an empty string (Theme Check
// doesn't flag it; the 5 October deploy was refused for two). Leave the default out instead.
for (const f of fs.readdirSync(path.join(theme, 'sections'))) {
  const src = fs.readFileSync(path.join(theme, 'sections', f), 'utf8');
  if (/"default"\s*:\s*""/.test(src)) throw new Error(`sections/${f}: a setting has "default": "", which Shopify rejects. Remove the default.`);
  // Shopify also refuses a select or radio option label over 50 characters (6 October deploy)
  const m = src.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  if (m) {
    const schema = JSON.parse(m[1]);
    const all = [...(schema.settings || []), ...(schema.blocks || []).flatMap((b) => b.settings || [])];
    for (const st of all) for (const o of st.options || []) {
      if (String(o.label).length > 50) throw new Error(`sections/${f}: option label for "${st.id}" is ${String(o.label).length} characters; Shopify allows 50: "${o.label}"`);
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
engine.registerFilter('money_without_trailing_zeros', (cents) => `$${(Number(cents) / 100).toFixed(2).replace(/\.00$/, '')}`);
engine.registerFilter('stylesheet_tag', (href) => `<link rel="stylesheet" href="${href}">`);
engine.registerFilter('json', (v) => JSON.stringify(v));
engine.registerFilter('handleize', (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
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
// The four launch products as Teeinblue created them (docs/archive/ADMIN-RUN-2026-10-04.md): three
// options each, "Available Product", "Color" and "Size", most with one value, and Printful's
// stock description, which Teeinblue rewrites on every campaign update.
const PRINTFUL = '<p>Museum-quality posters made on thick matte paper. Add a wonderful accent to your room and office with these posters that are sure to brighten any environment.</p>';
const mkProduct = (handle, id, title, base, colors, sizes, price, variantIds, description = PRINTFUL) => {
  const options_with_values = [
    { name: 'Available Product', position: 1, values: [base] },
    { name: 'Color', position: 2, values: colors },
    { name: 'Size', position: 3, values: sizes },
  ];
  const variants = [];
  let n = 0;
  for (const c of colors) for (const s of sizes) {
    const options = [base, c, s];
    variants.push({ id: variantIds[n++], title: options.join(' / '), options, price, available: true });
  }
  return {
    handle, id, title, url: `/products/${handle}`, price, media: [], featured_media: null, description,
    has_only_default_variant: false, options: options_with_values.map((o) => o.name), options_with_values, variants,
    selected_or_first_available_variant: variants[0],
  };
};
// product photos, as the store has them (our staged photo first, then Printful's mockups)
const withMedia = (p, files) => {
  p.media = files.map((f) => ({ src: `assets/${f}`, alt: p.title }));
  p.featured_media = p.media[0] || null;
  return p;
};
const products = {
  poster: mkProduct('the-annual-review', 16115061457278, 'The Annual Review', 'Enhanced Matte Paper Poster (in)', ['Default'], ['12″×18″'], 3900, [58152473002366]),
  framed: mkProduct('the-annual-review-framed', 16115081773438, 'The Annual Review, Framed', 'Enhanced Matte Paper Framed Poster (in)', ['Black', 'Red Oak', 'White'], ['12″×18″'], 8900, [58152515797374, 58152515830142, 58152515862910]),
  pillow: mkProduct('the-body-double', 16115384746366, 'The Body Double', 'All-Over Print Basic Pillow', ['Default'], ['16″×16″'], 5900, [58160000000001], '<p>This basic pillow will add some character to your home, and the 100% polyester fabric makes it soft and durable.</p>'),
  ornament: mkProduct('tiny-me-for-the-tree', 16115386876286, 'Tiny Me, For The Tree', 'Ceramic Ornament', ['Default'], ['Circle'], 2400, [58160000000002], '<p>Add a personal touch to your holiday decor with this ceramic ornament.</p>'),
};
withMedia(products.poster, ['hs-photo-memo-960.webp', 'hs-photo-team-02-640.webp', 'hs-photo-team-03-640.webp']);
withMedia(products.framed, ['hs-photo-manager-640.webp', 'hs-photo-team-01-640.webp']);
withMedia(products.pillow, ['hs-photo-pillow-sofa-640.webp']);
withMedia(products.ornament, ['hs-photo-ornament-tree-640.webp']);
const byHandle = Object.fromEntries(Object.values(products).map((p) => [p.handle, p]));

// Teeinblue's app block, built from its block settings and the markup it renders on the
// live store (tee-product-price, tee-variants with one radio group per option, a single
// size marked sr-only, Preview and Add To Cart buttons). Picking a radio puts the variant
// in the URL, which is all Teeinblue tells the page.
const money = (c) => `$${(Number(c) / 100).toFixed(2)}`;
function teeinblueBlock(settings, product) {
  if (!product) return '';
  const cur = product.selected_or_first_available_variant;
  const show = { 'Available Product': settings.show_available_product, Color: settings.show_color, Size: settings.show_size };
  const parts = [];
  if (settings.show_price) parts.push(`<div class="tee-block tee-product-price"><div class="tee-price-wrapper"><span class="money theme-money price tee-price--current" data-variant-price>${money(cur.price)}</span></div></div>`);
  const groups = product.options_with_values.filter((o) => show[o.name]).map((o) => {
    const key = o.name.toLowerCase().replace(/\s+/g, '-');
    const sr = o.name === 'Size' && o.values.length === 1 ? ' sr-only' : '';
    const radios = o.values.map((v, i) => `<div class="tee-radio${v === cur.options[o.position - 1] ? ' active' : ''}"><input type="radio" id="${key}-${i}" name="${key}-tee" data-pos="${o.position}" value="${v}"${v === cur.options[o.position - 1] ? ' checked' : ''}><label class="tee-radio-label" for="${key}-${i}" title="${v}"><span>${v}</span></label></div>`).join('');
    return `<div class="tee-option tee-option--${key}${sr} tee-block" display-type="radio"><label class="tee-option__title">${o.name.toLowerCase()}</label><div class="tee-row tee-option-inner" role="radiogroup">${radios}</div></div>`;
  });
  if (groups.length) parts.push(`<div class="tee-block tee-variants">${groups.join('')}</div>`);
  if (settings.show_action_buttons) parts.push('<div class="tee-block tee-actions"><button type="button" class="tee-btn tee-btn--full tee-btn--preview">Preview</button><button type="button" class="tee-btn tee-btn--atc">Add To Cart</button></div>');
  const variants = JSON.stringify(product.variants.map((v) => ({ id: v.id, options: v.options })));
  return `<div class="shopify-app-block tee-stub" data-tee-stub>${parts.join('')}<script>(function () {
    var vs = ${variants}, box = document.currentScript.parentNode;
    box.addEventListener('change', function (e) {
      var picked = {};
      box.querySelectorAll('.tee-variants input:checked').forEach(function (i) { picked[i.getAttribute('data-pos')] = i.value; i.parentNode.parentNode.querySelectorAll('.tee-radio').forEach(function (r) { r.classList.toggle('active', r.contains(i)); }); });
      var v = vs.filter(function (v) { return Object.keys(picked).every(function (p) { return v.options[p - 1] === picked[p]; }); })[0];
      if (v) history.replaceState(null, '', location.pathname + '?variant=' + v.id);
    });
  })();</script></div>`;
}

// ---------------------------------------------------------------- sections
function readSection(type) {
  const src = fs.readFileSync(path.join(theme, 'sections', `${type}.liquid`), 'utf8');
  const m = src.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  // app blocks render their own markup; here that is the stand-in built above
  return { schema: JSON.parse(m[1]), body: src.replace(m[0], '').replace(/{%-?\s*render block\s*-?%}/g, '{{ block.app_html }}') };
}
const defaults = (settings = []) => Object.fromEntries(settings.filter((s) => 'default' in s).map((s) => [s.id, s.default]));
// product pickers store a handle; Liquid sees the product, or nothing if it doesn't exist
const resolve = (schemaSettings = [], values) => {
  for (const s of schemaSettings) if (s.type === 'product' && typeof values[s.id] === 'string') values[s.id] = byHandle[values[s.id]] || null;
  return values;
};

async function renderSection(key, conf, ctx) {
  const { schema, body } = readSection(conf.type);
  const settings = resolve(schema.settings, { ...defaults(schema.settings), ...(conf.settings || {}) });
  const blocks = (conf.block_order || []).map((id) => {
    const b = conf.blocks[id];
    if (String(b.type).startsWith('shopify://apps/')) return { id, type: '@app', settings: b.settings || {}, shopify_attributes: '', app_html: teeinblueBlock(b.settings || {}, ctx.product) };
    const bs = (schema.blocks || []).find((x) => x.type === b.type) || {};
    return { id, type: b.type, settings: resolve(bs.settings, { ...defaults(bs.settings), ...(b.settings || {}) }), shopify_attributes: '' };
  });
  const html = await engine.parseAndRender(body, {
    section: { id: `template--${key}`, settings, blocks },
    shop: { url: 'https://heartside.io', domain: 'heartside.io' },
    request: { design_mode: false },
    routes: { root_url: 'index.html' },
    ...ctx,
  });
  const cls = ['shopify-section', schema.class].filter(Boolean).join(' ');
  return `<section id="shopify-section-${key}" class="${cls}">${html}</section>`;
}

const header = `
<header class="mock-header">
  <img src="assets/heartside-logo.png" alt="Heartside" class="mock-logo">
  <nav><a href="#review">Your review</a><a href="#benefits">More gifts</a><a href="#faq">Questions</a></nav>
</header>`;
const footer = `<footer class="mock-footer"><p>Helio footer (policies, contact) renders here.</p></footer>`;

async function page(file, templateName, ctx = {}, edit = (t) => t) {
  const tpl = edit(JSON.parse(fs.readFileSync(path.join(theme, 'templates', templateName), 'utf8')));
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
  #header-group > .header-section { position: sticky; top: -1px; z-index: 30; background: #FBF6F1; }
  @media (max-width: 760px) { .mock-header { padding: 12px 16px; } .mock-header nav { display: none; } .mock-logo { height: 30px; } }
  .mock-footer { padding: 40px 16px 60px; text-align: center; font: 14px system-ui; color: #5A4A44; background: #F3ECE5; }
</style>
</head><body>
<div id="header-group">
${memo.replace('class="shopify-section', 'class="shopify-section shopify-section-group-header-group')}
<section class="shopify-section shopify-section-group-header-group header-section">${header}</section>
</div>
<main>${main.join('\n')}</main>
${footer}
</body></html>`;
  fs.writeFileSync(path.join(out, file), html);
  return file;
}

const HERO_B = {
  stamp: 'PERSONALIZED POSTER · $39 · FREE US SHIPPING',
  heading: "{yourdog} loves you too. Now it's <em>in\u00a0writing.</em>",
  text: 'Their annual review of you, printed on a 12 × 18 inch poster with their photo and your name.',
  what: '',
  name_label: "Your dog's name",
  button: 'Make my poster',
  note: '',
  proof: 'A person checks every order | Misprinted? We make it right | Free US shipping',
};
const HERO_A = {
  heading: '{yourdog} wrote your <em>annual review.</em>',
  text: "They love you too, and they'd like it on the record. A 12 × 18 inch poster with their photo, your name and three notes you pick.",
};
const written = [
  await page('index.html', 'index.json', { template: { name: 'index', suffix: null } }),
  // the homepage once Tiny Me's own section is switched on
  await page('index-ornament.html', 'index.json', { template: { name: 'index', suffix: null } }, (t) => { t.sections.ornament.settings.show = true; return t; }),
  await page('product-review.html', 'product.review.json', { product: products.poster, template: { name: 'product', suffix: 'review' } }),
  await page('product-framed.html', 'product.review.json', { product: products.framed, template: { name: 'product', suffix: 'review' } }),
  // the same page if Teeinblue's block were removed: the theme's own picker and button come back
  await page('product-framed-plain.html', 'product.review.json', { product: products.framed, template: { name: 'product', suffix: 'review' } }, (t) => {
    const m = t.sections.main;
    m.block_order = m.block_order.filter((id) => !String(m.blocks[id].type).startsWith('shopify://'));
    return t;
  }),
  await page('product-pillow.html', 'product.heartside.json', { product: products.pillow, template: { name: 'product', suffix: 'heartside' } }),
  await page('product-ornament.html', 'product.heartside.json', { product: products.ornament, template: { name: 'product', suffix: 'heartside' } }),
  // no description written for this product: Printful's text shows, as before
  await page('product-pillow-nodesc.html', 'product.heartside.json', { product: products.pillow, template: { name: 'product', suffix: 'heartside' } }, (t) => {
    for (const b of Object.values(t.sections.main.blocks)) if (b.type === 'description' && b.settings && b.settings.product === 'the-body-double') delete b.settings.text;
    return t;
  }),
  await page('product-landing.html', 'product.landing.json', { product: products.poster, template: { name: 'product', suffix: 'landing' } }),
  // the hero Krish proposed on 5 October (B) and the colder-traffic fallback (A), for him to see
  // before either goes live
  await page('index-hero-b.html', 'index.json', { template: { name: 'index', suffix: null } }, (t) => { t.sections.hero.settings = { ...(t.sections.hero.settings || {}), ...HERO_B }; return t; }),
  await page('landing-hero-b.html', 'product.landing.json', { product: products.poster, template: { name: 'product', suffix: 'landing' } }, (t) => { t.sections.hero.settings = { ...t.sections.hero.settings, ...HERO_B }; return t; }),
  // the shop-first homepage and its product pages (hidden ?view=shop templates), for Krish to judge
  await page('index-shop.html', 'index.shop.json', { template: { name: 'index', suffix: 'shop' } }),
  await page('product-shop.html', 'product.shop.json', { product: products.poster, template: { name: 'product', suffix: 'shop' } }),
  await page('product-shopgift.html', 'product.shopgift.json', { product: products.pillow, template: { name: 'product', suffix: 'shopgift' } }),
  await page('index-hero-a.html', 'index.json', { template: { name: 'index', suffix: null } }, (t) => { t.sections.hero.settings = { ...(t.sections.hero.settings || {}), ...HERO_B, ...HERO_A }; return t; }),
];
// Helio's cart drawer, as the live store rendered it on 5 October with a framed poster in it
// (one row per line, the variant options in a list, Teeinblue's visible properties under
// them, the tax note). hs2.js tidies it; shots.mjs serves /cart.js for it.
{
  const memo = await renderSection('memo', { type: 'hs2-memo' }, {});
  fs.writeFileSync(path.join(out, 'cart.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Heartside preview: cart</title>
<style>body{margin:0;font:15px system-ui;background:#fff}.visually-hidden{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.cart-items__table{width:100%}.cart-items__media img{width:90px;height:90px;border-radius:12px}.cart-items__variants,.cart-items__properties{margin:4px 0;color:#555}.cart-items__variant{display:inline}.cart-items__variant dd,.cart-items__property dd{display:inline;margin:0}.cart-items__property dt{display:inline}.cart-totals__tax-note{margin:12px;color:#555}</style></head><body>
<div id="header-group">${memo}</div>
<cart-items-component class="cart-items-component"><form action="/cart" class="cart-form" id="cart-form"><table class="cart-items__table"><tbody>
<tr id="CartItem-58152515830142:cd7e" class="cart-items__table-row" data-key="58152515830142:cd7e">
<td class="cart-items__media"><a href="/products/the-annual-review-framed?variant=58152515830142" class="cart-items__media-container"><img src="assets/hs-photo-team-04-640.webp" srcset="assets/hs-photo-team-04-640.webp 250w" width="250" height="250" class="cart-items__media-image" alt="mockup-framed-redoak"></a></td>
<td class="cart-items__details"><div class="cart-items__product-info"><a href="/products/the-annual-review-framed?variant=58152515830142" class="cart-items__title">The Annual Review, Framed</a></div>
<div class="cart-items__variants-wrapper"><dl class="cart-items__variants"><div class="cart-items__variant"><dt class="visually-hidden">Available Product:</dt><dd>Enhanced Matte Paper Framed Poster (in),&nbsp;</dd></div><div class="cart-items__variant"><dt class="visually-hidden">Color:</dt><dd>Red Oak,&nbsp;</dd></div><div class="cart-items__variant"><dt class="visually-hidden">Size:</dt><dd>12″×18″</dd></div></dl>
<dl class="cart-items__properties"><div class="cart-items__property"><dt>Available Product:</dt><dd>Enhanced Matte Paper Framed Poster (in) </dd></div><div class="cart-items__property"><dt>Employee name (you):</dt><dd>Jordan </dd></div></dl></div></td></tr>
<tr id="CartItem-58160000000002:ab12" class="cart-items__table-row" data-key="58160000000002:ab12">
<td class="cart-items__media"><a href="/products/tiny-me-for-the-tree?variant=58160000000002" class="cart-items__media-container"><img src="assets/hs-photo-team-01-640.webp" width="250" height="250" class="cart-items__media-image" alt="ornament"></a></td>
<td class="cart-items__details"><div class="cart-items__product-info"><a href="/products/tiny-me-for-the-tree?variant=58160000000002" class="cart-items__title">Tiny Me, For The Tree</a></div>
<div class="cart-items__variants-wrapper"><dl class="cart-items__variants"><div class="cart-items__variant"><dt class="visually-hidden">Available Product:</dt><dd>Ceramic Ornament,&nbsp;</dd></div><div class="cart-items__variant"><dt class="visually-hidden">color:</dt><dd>1 pc,&nbsp;</dd></div><div class="cart-items__variant"><dt class="visually-hidden">Size:</dt><dd>Circle</dd></div></dl></div></td></tr>
</tbody></table></form></cart-items-component>
<div class="cart-totals__item cart-totals__tax-note cart-primary-typography"><small>Taxes and <a href="/policies/shipping-policy">shipping</a> calculated at checkout. </small></div>
</body></html>`);
  written.push('cart.html');
}
for (const f of fs.readdirSync(path.join(theme, 'assets'))) fs.copyFileSync(path.join(theme, 'assets', f), path.join(out, 'assets', f));
fs.copyFileSync(path.join(repo, 'assets', 'heartside-logo.png'), path.join(out, 'assets', 'heartside-logo.png'));
console.log('rendered', written.join(', '));
