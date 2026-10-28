// Render the Heartside theme locally, the way Shopify would, so the Liquid can be checked and
// screenshotted without touching the store.
//
//   cd tools/preview && npm install && node render.mjs
//   node render.mjs --helio-footer   # today's live footer (Helio's, with the company note) even
//                                    # when sections/hs-footer.liquid exists
//
// The catalog is today's: the illustrated mug, the portrait and the word-free blanket, with the
// option names, variant order, prices and media alt text the public store served on 27 Oct 2026.
// Pages: the homepage (templates/index.json), the three native product templates, the cart empty
// and with one line, the 404 page and every moved template (any template holding an hs-moved
// section) when the theme has them. Shopify-only filters and tags are stubbed. Around our
// sections sits Helio's own markup captured from the live store (fixtures/helio-*.html). Helio's
// and Teeinblue's stylesheets are not in this repo, so fixtures/standin.css lays out that chrome
// and the Teeinblue stand-in. A layout check only: the real render happens in Shopify, inside
// the Helio theme.
import { Liquid } from 'liquidjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const theme = path.join(repo, 'shopify');
const fixtures = path.join(here, 'fixtures');
const out = path.join(here, 'out');
const HELIO_FOOTER = process.argv.includes('--helio-footer');
fs.mkdirSync(path.join(out, 'assets', 'mock'), { recursive: true });

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
    // and a url setting whose default is a web address (13 October deploy: only shop paths are allowed)
    for (const st of all) if (st.type === 'url' && 'default' in st && !/^\/(collections|products|pages|blogs|search|cart)?/.test(String(st.default))) throw new Error(`sections/${f}: url setting "${st.id}" has default "${st.default}"; Shopify allows only shop paths. Use a text setting.`);
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
const attr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const money = (cents) => `$${(Number(cents) / 100).toFixed(2)}`;
const filters = {
  asset_url: (name) => `assets/${name}`,
  image_url: (img) => (typeof img === 'string' ? img : img && img.src),
  image_tag: (src, ...args) => {
    const o = kw(args);
    const attrs = Object.entries(o).filter(([k]) => k !== 'widths').map(([k, v]) => `${k}="${attr(v)}"`).join(' ');
    return `<img src="${src}" ${attrs}${'alt' in o ? '' : ' alt=""'}>`;
  },
  money,
  money_with_currency: (cents) => `${money(cents)} USD`,
  money_without_trailing_zeros: (cents) => money(cents).replace(/\.00$/, ''),
  stylesheet_tag: (href) => `<link rel="stylesheet" href="${href}">`,
  json: (v) => JSON.stringify(v ?? null),
  handleize: (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  // Shopify's form error list as one line; the stub form never posts, so it is rarely reached
  default_errors: (e) => (Array.isArray(e) ? e.join(' ') : e ? String(e) : ''),
};
for (const [name, fn] of Object.entries(filters)) engine.registerFilter(name, fn);
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

const shop = {
  url: 'https://heartside.io', domain: 'heartside.io', name: 'Heartside',
  // the policies Helio's footer lists on the live store
  privacy_policy: { title: 'Privacy policy', url: '/policies/privacy-policy' },
  refund_policy: { title: 'Refund policy', url: '/policies/refund-policy' },
  shipping_policy: { title: 'Shipping policy', url: '/policies/shipping-policy' },
  terms_of_service: { title: 'Terms of service', url: '/policies/terms-of-service' },
};
shop.policies = [shop.privacy_policy, shop.refund_policy, shop.shipping_policy, shop.terms_of_service, { title: 'Contact information', url: '/policies/contact-information' }];
const routes = { root_url: 'index.html', cart_url: '/cart', account_login_url: '/account/login', all_products_collection_url: '/collections/all' };

// ---------------------------------------------------------- today's catalog
// As products/<handle>.js served them on 27 Oct 2026: Teeinblue's three options, the variant
// order, the prices and every media alt text (the portrait has two images with no alt). The
// product ids are the store's, because the theme refers to them (hs-product-gallery hides the
// blanket's blank reference by product and media id); variant and other media ids are made up.
// The pictures are local stand-ins with the store's sizes, copied into out/assets/mock: the
// theme's own blank mug layers for the mug's color pairs, the framed-print photos for the frames,
// and an SVG fixture where the repo has no photo (unframed portrait, blank blanket).
let nextVariant = 58300000000001;
let nextMedia = 71900000000001;
const missingMedia = [];
function media(file, from, alt, width = 2048, height = 2048, id = nextMedia++) {
  const source = path.join(repo, from);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(out, 'assets', 'mock', file));
  else {
    file += '.svg';
    fs.writeFileSync(path.join(out, 'assets', 'mock', file), `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#e9e1d8"/></svg>`);
    missingMedia.push(from);
  }
  const src = `assets/mock/${file}`;
  return { id, media_type: 'image', alt, src, width, height, aspect_ratio: width / height, preview_image: { src, width, height, aspect_ratio: width / height, alt } };
}
function product({ id, handle, title, type, description, options, variants, gallery }) {
  const options_with_values = options.map(([name, values], i) => ({ name, position: i + 1, values }));
  const vs = variants.map(([opts, price, featured]) => ({
    id: nextVariant++, title: opts.join(' / '), options: opts, option1: opts[0], option2: opts[1], option3: opts[2],
    price, compare_at_price: null, available: true, featured_media: featured, featured_image: featured,
  }));
  const prices = vs.map((v) => v.price);
  return {
    id, handle, title, type, vendor: 'Heartside', url: `/products/${handle}`, description, available: true,
    price: Math.min(...prices), price_min: Math.min(...prices), price_max: Math.max(...prices), price_varies: Math.min(...prices) !== Math.max(...prices),
    media: gallery.map((m, i) => ({ ...m, position: i + 1 })), images: gallery.map((m) => m.src),
    featured_media: gallery[0] || null, featured_image: gallery[0] || null,
    has_only_default_variant: false, options: options_with_values.map((o) => o.name), options_with_values, variants: vs,
    selected_or_first_available_variant: vs[0],
  };
}

// Mug: a handle-left and a handle-right photo per inside color, in the store's media order
const mugAlt = (color, side) => `Illustrated mug, ${color.toLowerCase()} inside: ${side} view. Example only; your artwork appears in the live preview.`;
const mugPairs = {};
for (const color of ['Black', 'Pink', 'Red', 'Dark Blue', 'Dark Green']) {
  const suffix = color === 'Pink' ? '' : '-' + filters.handleize(color);
  const name = filters.handleize(color);
  mugPairs[color] = [
    media(`mug-${name}-left.webp`, `shopify/assets/hs-mug-dog-base${suffix}.webp`, mugAlt(color, 'handle-left'), 640, 549),
    media(`mug-${name}-right.webp`, `shopify/assets/hs-mug-note-base${suffix}.webp`, mugAlt(color, 'handle-right'), 640, 549),
  ];
}
const mugBase = "Your Dog's Illustrated Mug";
const mug = product({
  id: 16160217956734, handle: 'your-dogs-illustrated-mug', title: "Your Dog's Illustrated Mug", type: 'Mug',
  description: "<p>Your dog's portrait, wrapped around a mug with a note from them to someone they love.</p><p>Add a clear photo, choose an artwork style and review your exact note before ordering. Your note and signature are printed separately from the illustration.</p><ul>\n<li>11 oz ceramic mug</li>\n<li>Colored rim, handle and inside</li>\n<li>Choose Black, Dark Blue, Dark Green, Pink or Red</li>\n<li>3.79 inches high and 3.25 inches in diameter</li>\n<li>Made to order</li>\n</ul>",
  options: [['Available Product', [mugBase]], ['Color', ['Black', 'Dark Blue', 'Dark Green', 'Pink', 'Red']], ['Size', ['11 oz']]],
  variants: ['Black', 'Dark Blue', 'Dark Green', 'Pink', 'Red'].map((c) => [[mugBase, c, '11 oz'], 4500, mugPairs[c][0]]),
  gallery: Object.values(mugPairs).flat(),
});

// Portrait: framed in Black, Red Oak or White ($119, the first variant), or unframed ($59)
const portraitAlt = (frame) => `Example illustrated pug portrait in ${frame}. Your portrait uses your dog's photo.`;
const prints = 'design/shopify-images/gifts-2026-10-21';
const frames = {
  White: media('portrait-white.jpg', `${prints}/the-framed-print-white.jpg`, portraitAlt('a white frame')),
  Black: media('portrait-black.jpg', `${prints}/the-framed-print-black.jpg`, portraitAlt('a black frame')),
  'Red Oak': media('portrait-red-oak.jpg', `${prints}/the-framed-print-red-oak.jpg`, portraitAlt('a red oak frame')),
};
const unframed = media('portrait-unframed.svg', 'tools/preview/fixtures/mock-portrait-unframed.svg', "Example unframed illustrated pug portrait. Your portrait uses your dog's photo.");
const portrait = product({
  id: 16151384260990, handle: 'your-dogs-portrait', title: "Your Dog's Portrait", type: 'Framed Print',
  description: "<p>Your dog's portrait with a small personal note and signature. Add a clear photo, choose an artwork style and review your design before ordering. A city is optional.</p><ul>\n<li>12 × 18 inch print on 189 gsm matte paper</li>\n<li>Choose unframed or a Black, White or Red Oak frame</li>\n<li>Framed options have an acrylic front and hanging hardware</li>\n<li>Unframed option does not include a frame</li>\n<li>Made to order</li>\n</ul>",
  options: [['Available Product', ['Framed', 'Unframed']], ['Color', ['Black', 'Red Oak', 'White', 'Default']], ['Size', ['12″×18″']]],
  variants: [
    [['Framed', 'Black', '12″×18″'], 11900, frames.Black],
    [['Framed', 'Red Oak', '12″×18″'], 11900, frames['Red Oak']],
    [['Framed', 'White', '12″×18″'], 11900, frames.White],
    [['Unframed', 'Default', '12″×18″'], 5900, unframed],
  ],
  gallery: [frames.White, frames.Black, frames['Red Oak'], media('portrait-held.jpg', `${prints}/the-framed-print-held.jpg`, null), unframed, media('portrait-room.jpg', 'assets/photos/pug-autumn-leaves.jpg', null, 1589, 1052)],
});

// Blanket: the blank technical reference first (the theme hides it on the product page), then the
// example design
const blank = media('blanket-blank.svg', 'tools/preview/fixtures/mock-blanket-blank.svg', 'Blank tan sherpa blanket reference. Your personalized artwork is shown in your cart.', 1024, 1024, 71850515169662);
const blanketBase = 'Heartside Personality Blanket';
const blanket = product({
  id: 16158073880958, handle: 'your-dogs-personality-blanket', title: "Your Dog's Personality Blanket", type: 'Blanket',
  description: "<p>A word-free blanket inspired by your dog's face and the personality details you share with Buddy.</p><p>One tan sherpa blanket, 50 × 60 inches, with a smooth printed front and a soft sherpa reverse. Made to order. We review the artwork before sending it to print.</p><p>Delivery options and applicable taxes are shown at checkout.</p>",
  options: [['Available Product', [blanketBase]], ['Color', ['Tan']], ['Size', ['50″×60″']]],
  variants: [[[blanketBase, 'Tan', '50″×60″'], 12900, blank]],
  gallery: [blank, media('blanket-example.png', 'design/blanket/approved-direction-v2.png', "Example blanket design with an illustrated pug pattern. Your blanket uses your own dog's photo.", 1154, 1363)],
});
const catalog = { mug, portrait, blanket };
const byHandle = Object.fromEntries(Object.values(catalog).map((p) => [p.handle, p]));
// the same product with another variant chosen, as ?variant= would
const withVariant = (p, test) => ({ ...p, selected_or_first_available_variant: p.variants.find(test) });

// ------------------------------------------------------ Teeinblue's app block
// A stand-in for Teeinblue's personalizer, built only from the classes its storefront code drew
// on today's product pages (fixtures/teeinblue-classes.json; tee() refuses any other tee- class):
// the live preview gallery, which Teeinblue appends to the theme's [data-hs2-tib-gallery] box,
// the option radios, the personalization form with its photo field, and the quantity and Add to
// cart row. The block settings decide which parts show, as on the store. Field labels are
// placeholders: Teeinblue's real fields come from each campaign. Picking a radio puts the variant
// in the URL and fires teeinblue-event-variant-changed, which is all Teeinblue tells the page.
// The action row is what the live pages draw (Krish's 28 Oct recordings): a Preview button, the
// quantity and Teeinblue's own "Add To Cart" in Title Case, and on a phone a Personalize bar
// fixed to the bottom of the screen. So a local preview shows what a buyer meets, not a tidier
// stand-in; the theme's own fixes for them are what the preview then checks.
// fixtures/teeinblue-classes.json holds every class seen on the live pages, the Preview, Add To
// Cart and Personalize bar classes from the 28 Oct recordings included
const TEE_CLASSES = new Set(JSON.parse(fs.readFileSync(path.join(fixtures, 'teeinblue-classes.json'), 'utf8')));
const tee = (...names) => {
  for (const n of names) if (n.startsWith('tee-') && !TEE_CLASSES.has(n)) throw new Error(`render.mjs: "${n}" is not a class Teeinblue renders (fixtures/teeinblue-classes.json)`);
  return names.join(' ');
};
let teeCount = 0;
function teeinblueBlock(settings, product) {
  if (!product) return '';
  const n = ++teeCount;
  const cur = product.selected_or_first_available_variant;
  const show = { 'Available Product': settings.show_available_product, Color: settings.show_color, Size: settings.show_size };
  const shot = cur.featured_media || product.featured_media || { src: '', width: 1200, height: 1200 };
  const gallery = `<div class="${tee('tee-gallery-wrapper')}"><div class="${tee('tee-gallery-content')}"><div class="${tee('tee-gallery')}"><div class="${tee('tee-gallery__stage')}"><div class="${tee('tee-slider')}"><div class="${tee('tee-slider__inner')}"><div class="${tee('tee-slider__track')}"><div class="${tee('tee-slide')}"><div class="${tee('tee-mockup-zoomable', 'tee-zoom-normal')}"><div class="${tee('tee-mockup-item')}"><div class="${tee('tee-image--loader')}" hidden></div><div class="${tee('tee-mockup')}"><img class="${tee('tee-mockup-image')}" src="${attr(shot.src)}" alt="" width="${shot.width}" height="${shot.height}"><div class="${tee('tee-printarea')}"><div class="${tee('tee-printarea-allocator')}"><div class="${tee('tee-printarea-artwork', 'tee-printarea-masked')}"></div></div></div></div></div></div></div></div></div></div></div></div></div></div>`;
  const parts = [];
  if (settings.show_price) parts.push(`<div class="${tee('tee-block', 'tee-price-wrapper')}"><span class="money ${tee('tee-price--current')}" data-variant-price>${money(cur.price)}</span></div>`);
  // one radio group per shown option; a value the current choice can't have is hidden, and an
  // option left with one value is for screen readers only, as Teeinblue does
  for (const o of product.options_with_values.filter((x) => show[x.name])) {
    const key = filters.handleize(o.name);
    // a value fits when some variant has it alongside the current choice of the options before it
    const fits = (v) => product.variants.some((x) => x.options[o.position - 1] === v && x.options.slice(0, o.position - 1).every((ov, j) => ov === cur.options[j]));
    const radios = o.values.map((v, i) => {
      const on = v === cur.options[o.position - 1];
      const thumb = o.name === 'Available Product' ? (product.variants.find((x) => x.options[0] === v) || {}).featured_media : null;
      return `<div class="${tee('tee-radio')}${on ? ' active' : ''}"${fits(v) ? '' : ' hidden'}><input type="radio" id="tee-${n}-${key}-${i}" name="tee-${n}-${key}" data-pos="${o.position}" value="${attr(v)}"${on ? ' checked' : ''}><label class="${tee('tee-radio-label')}" for="tee-${n}-${key}-${i}" title="${attr(v)}">${thumb ? `<img class="${tee('tee-ap-thumbnail')}" src="${attr(thumb.src)}" alt="" width="48" height="48">` : ''}<span>${v}</span></label></div>`;
    });
    parts.push(`<div class="${tee('tee-option', 'tee-block')}${o.values.filter(fits).length === 1 ? ' sr-only' : ''}" display-type="radio"><label class="${tee('tee-option__title')}">${o.name}</label><div class="${tee('tee-row')}" role="radiogroup">${radios.join('')}</div></div>`);
  }
  if (settings.show_form !== false) {
    parts.push(`<div class="${tee('tee-customize-main-form')}"><div class="${tee('tee-form-header')}"><span class="${tee('tee-form-header__title')}">Personalize</span></div><div class="${tee('tee-customization-warning')}" hidden>Complete the required fields.</div><form class="${tee('tee-customization-form')}" onsubmit="return false">`
      + `<div class="${tee('tee-field')}"><div class="${tee('tee-field__header')}"><span class="${tee('tee-field__heading')}">Photo<span class="${tee('tee-asterisk')}">*</span></span></div><div class="${tee('tee-photo')}"><div class="${tee('tee-photo-head')}"><span class="${tee('tee-photo-label')}">Upload image</span></div><label class="${tee('tee-photo-placeholder')}"><span class="${tee('tee-photo-message')}">Choose a photo</span><input class="${tee('tee-photo-input')}" type="file" accept="image/*" hidden></label><div class="${tee('tee-photo-action')}"><button type="button" class="${tee('tee-btn')}">Upload</button></div><p class="${tee('tee-upload-instruction')}">JPG or PNG, one dog, face clearly visible.</p></div></div>`
      + `<div class="${tee('tee-field')}"><div class="${tee('tee-field__header')}"><label class="${tee('tee-field__heading')}" for="tee-${n}-text">Text</label><span class="${tee('tee-field__total-characters')}">0/60</span></div><input class="${tee('tee-field__input')}" id="tee-${n}-text" type="text" maxlength="60"></div>`
      + `<div class="${tee('tee-field')}"><div class="${tee('tee-field__header')}"><label class="${tee('tee-field__heading')}" for="tee-${n}-style">Style</label></div><div class="${tee('tee-select-wrapper')}"><select class="${tee('tee-field__select')}" id="tee-${n}-style"><option>Default</option></select></div></div>`
      + `<div class="${tee('tee-checkbox-wrapper')}"><label class="${tee('tee-checkbox__label')}"><input class="${tee('tee-checkbox__input')}" type="checkbox"><span class="${tee('tee-checkbox__pseudo')}"><span class="${tee('tee-checkbox__checkmark')}"><svg class="${tee('tee-clipart-checkmark__check')}" viewBox="0 0 12 10" width="12" height="10" aria-hidden="true"><path d="M1 5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2"/></svg></span></span>I approve my design</label></div>`
      + '</form></div>');
  }
  if (settings.show_action_buttons) {
    parts.push(`<div class="${tee('tee-form-actions')}"><div class="${tee('tee-form-action')}"><button type="button" class="${tee('tee-btn', 'tee-btn--preview')}">Preview</button></div><div class="${tee('tee-form-action')}"><div class="${tee('tee-quantity')}"><input type="number" value="1" min="1" aria-label="Quantity"></div></div><div class="${tee('tee-form-action')}"><button type="button" class="${tee('tee-btn', 'tee-btn--atc')}" id="teeAtcButton">Add To Cart</button></div></div>`);
    // on a phone Teeinblue pins a Personalize bar to the bottom of the screen; tapping it scrolls
    // to its form. The 750px breakpoint is the stand-in's; Teeinblue's own was not captured.
    parts.push(`<style>.tee-btn-wrapper--personalize{display:none}@media (max-width:749px){.tee-btn-wrapper--personalize{display:block;position:fixed;left:0;right:0;bottom:0;z-index:20}.tee-btn-wrapper--personalize .tee-btn{width:100%}}</style><div class="${tee('tee-btn-wrapper--personalize')}"><button type="button" class="${tee('tee-btn', 'tee-btn--personalize')}" data-tee-stub-personalize>Personalize</button></div>`);
  }
  const variants = JSON.stringify(product.variants.map((v) => ({ id: v.id, options: v.options })));
  return `<div class="shopify-app-block" data-tee-stub><div class="${tee('tee-form-wrapper')}"><div class="${tee('tee-campaign')}">${parts.join('')}</div></div><template data-tee-stub-gallery>${gallery}</template><script>(function () {
    var vs = ${variants}, box = document.currentScript.parentNode;
    // Teeinblue appends its live preview to the gallery box the theme names (window.teeinblue)
    var put = function () {
      var cfg = window.teeinblue || {}, to = document.querySelector(cfg.gallerySelector || '[data-hs2-tib-gallery]');
      var tpl = box.querySelector('[data-tee-stub-gallery]');
      if (to && tpl && !to.querySelector('.tee-gallery-wrapper')) to.appendChild(tpl.content.cloneNode(true));
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', put); else put();
    box.addEventListener('click', function (e) {
      if (!e.target.closest('[data-tee-stub-personalize]')) return;
      var form = box.querySelector('.tee-customize-main-form');
      if (form) form.scrollIntoView({ block: 'start' });
    });
    box.addEventListener('change', function (e) {
      if (!e.target.matches('.tee-radio input')) return;
      var picked = {};
      box.querySelectorAll('.tee-radio input:checked').forEach(function (i) { picked[i.getAttribute('data-pos')] = i.value; i.closest('.tee-row').querySelectorAll('.tee-radio').forEach(function (r) { r.classList.toggle('active', r.contains(i)); }); });
      var v = vs.filter(function (v) { return Object.keys(picked).every(function (p) { return v.options[p - 1] === picked[p]; }); })[0];
      if (!v && picked[1]) v = vs.filter(function (v) { return v.options[0] === picked[1]; })[0];
      if (v) { history.replaceState(null, '', location.pathname + '?variant=' + v.id); document.dispatchEvent(new CustomEvent('teeinblue-event-variant-changed', { detail: { variant: v } })); }
    });
  })();</script></div>`;
}

// ---------------------------------------------------------------- sections
const sectionFile = (type) => path.join(theme, 'sections', `${type}.liquid`);
function readSection(type) {
  const src = fs.readFileSync(sectionFile(type), 'utf8');
  const m = src.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  // app blocks render their own markup; here that is the stand-in built above
  const body = (m ? src.replace(m[0], '') : src).replace(/{%-?\s*render block\s*-?%}/g, '{{ block.app_html }}');
  return { schema: m ? JSON.parse(m[1]) : {}, body };
}
const defaults = (settings = []) => Object.fromEntries(settings.filter((s) => 'default' in s).map((s) => [s.id, s.default]));
// product pickers store a handle; Liquid sees the product, or nothing if it doesn't exist
const resolve = (schemaSettings = [], values, handles) => {
  for (const s of schemaSettings) if (s.type === 'product' && typeof values[s.id] === 'string') values[s.id] = handles[values[s.id]] || null;
  return values;
};
const missingSections = new Set();

async function renderSection(key, conf, ctx, extraClass = '') {
  // a section that lives only in Helio (main-404, main-cart...) is a labelled gap, not an error
  if (!fs.existsSync(sectionFile(conf.type))) {
    missingSections.add(conf.type);
    return `<div id="shopify-section-${key}" class="shopify-section ${extraClass}"><div class="hs-preview-missing">Helio's "${conf.type}" section renders here on the store (not in this repo).</div></div>`;
  }
  const { schema, body } = readSection(conf.type);
  const handles = ctx.catalog || byHandle;
  const settings = resolve(schema.settings, { ...defaults(schema.settings), ...(conf.settings || {}) }, handles);
  const blocks = (conf.block_order || Object.keys(conf.blocks || {})).filter((id) => !conf.blocks[id].disabled).map((id) => {
    const b = conf.blocks[id];
    if (String(b.type).startsWith('shopify://apps/')) return { id, type: '@app', settings: b.settings || {}, shopify_attributes: '', app_html: teeinblueBlock(b.settings || {}, ctx.product) };
    const bs = (schema.blocks || []).find((x) => x.type === b.type) || {};
    return { id, type: b.type, settings: resolve(bs.settings, { ...defaults(bs.settings), ...(b.settings || {}) }, handles), shopify_attributes: '' };
  });
  const html = await engine.parseAndRender(body, {
    section: { id: `template--${key}`, settings, blocks },
    shop, routes, request: { design_mode: false },
    ...ctx,
  });
  const tag = schema.tag || 'div';
  const cls = ['shopify-section', extraClass, schema.class].filter(Boolean).join(' ');
  return `<${tag} id="shopify-section-${key}" class="${cls}">${html}</${tag}>`;
}
// templates may open with Shopify's /* auto-generated */ note
const readTemplate = (name) => JSON.parse(fs.readFileSync(path.join(theme, 'templates', name), 'utf8').replace(/^\s*\/\*[\s\S]*?\*\//, ''));

// ------------------------------------------------------------- Helio chrome
// Helio's header, cart drawer, empty cart and footer as the live store rendered them (27 Oct).
// Our own sections inside the capture (the memo bar, the company note) are cut out and rendered
// from source instead, so the preview shows today's code. The capture's scrubbed image addresses
// point at local files: the logo, and each menu card's product photo found by its alt text.
const fixture = (name) => fs.readFileSync(path.join(fixtures, name), 'utf8');
const altToSrc = new Map(Object.values(catalog).flatMap((p) => p.media).filter((m) => m.alt).map((m) => [m.alt, m.src]));
const localImages = (html) => html.replace(/<img\b[^>]*>/g, (tag) => {
  if (!/cdn\.example/.test(tag)) return tag;
  const alt = (tag.match(/\salt="([^"]*)"/) || [])[1] || '';
  const src = /header-logo__image/.test(tag) ? 'assets/hs-logo.png' : altToSrc.get(alt.replace(/&#39;/g, "'").replace(/&quot;/g, '"')) || 'assets/hs-logo.png';
  return tag.replace(/\ssrcset="[^"]*"/, '').replace(/\ssrc="[^"]*"/, ` src="${src}"`);
}).replace(/(data-featured-media-url=")\/\/cdn\.example\/[^"]*"/g, '$1"');
const helio = (() => {
  const head = fixture('helio-header.html');
  const drawer = fixture('helio-drawer.html');
  const foot = fixture('helio-footer.html');
  const drawerEnd = drawer.indexOf('</div>', drawer.indexOf('</theme-drawer>')) + '</div>'.length;
  const note = foot.search(/<div id="shopify-section-[^"]*__hs_company_note"/);
  return {
    header: localImages(head.slice(head.indexOf('<header id="shopify-section-'))),
    drawer: drawer.slice(0, drawerEnd),
    footer: note > -1 ? foot.slice(0, note) : foot,
    cartEmpty: fixture('helio-cart-empty.html'),
  };
})();
fs.copyFileSync(path.join(fixtures, 'standin.css'), path.join(out, 'assets', 'standin.css'));

// The footer group as the theme push leaves it: with sections/hs-footer.liquid in the theme,
// footer-heartside.mjs adds it and switches Helio's footer and the company note off; without it
// (or with --helio-footer), today's live footer: Helio's utilities row, then the company note.
const OWN_FOOTER = fs.existsSync(sectionFile('hs-footer')) && !HELIO_FOOTER;
async function footerGroup(ctx) {
  const group = 'shopify-section-group-footer-group';
  if (OWN_FOOTER) return renderSection('hs_footer', { type: 'hs-footer' }, ctx, group);
  return [helio.footer, await renderSection('company_note', { type: 'hs-company-note' }, ctx, group)].join('\n');
}

async function writePage(file, title, main, ctx = {}) {
  const memo = await renderSection('memo', { type: 'hs2-memo' }, ctx, 'shopify-section-group-header-group');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="assets/standin.css">
</head><body>
<div id="header-group">
${memo}
${helio.header}
</div>
${helio.drawer}
<main id="MainContent" class="content-for-layout" role="main">${main}</main>
<footer class="footer-group">${await footerGroup(ctx)}</footer>
</body></html>`;
  fs.writeFileSync(path.join(out, file), html);
  return file;
}

async function page(file, templateName, ctx = {}, edit = (t) => t) {
  const tpl = edit(readTemplate(templateName));
  const main = [];
  for (const key of tpl.order) if (!tpl.sections[key].disabled) main.push(await renderSection(key, tpl.sections[key], ctx));
  return writePage(file, `Heartside preview: ${templateName}`, main.join('\n'), ctx);
}
const ctxFor = (templateName, product) => {
  const [name, suffix = null] = templateName.replace(/\.json$/, '').split('.');
  return { template: { name, suffix }, ...(product ? { product } : {}) };
};

// ------------------------------------------------------------------- cart
// Helio's cart page around our cart-products override (snippets/cart-products.liquid), which is
// rendered for real. Helio's main-cart section, its summary and the snippets our override calls
// (quantity selector, price styles...) live only in the full theme, so they are small stand-ins
// here, and Helio's @theme/* script modules are left out (they cannot load outside the store).
const snippetsDir = path.join(theme, 'snippets');
const HELIO_SNIPPETS = {
  'quantity-selector': '<quantity-selector-component class="quantity-selector {{ class }}"><button type="button" aria-label="Decrease quantity"{% unless can_update_quantity %} disabled{% endunless %}>-</button><input type="number" value="{{ in_cart_quantity }}" min="1" aria-label="Quantity"{% unless can_update_quantity %} disabled{% endunless %}><button type="button" aria-label="Increase quantity"{% unless can_update_quantity %} disabled{% endunless %}>+</button></quantity-selector-component>',
};
const helioPartial = (f) => HELIO_SNIPPETS[path.basename(f, '.liquid')] ?? '';
const helioFs = {
  exists: async () => true,
  existsSync: () => true,
  readFile: async (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : helioPartial(f)),
  readFileSync: (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : helioPartial(f)),
  resolve: (dir, file, ext) => path.resolve(dir, file + (path.extname(file) ? '' : ext)),
  sep: path.sep,
  dirname: path.dirname,
};
const cartEngine = new Liquid({ root: [snippetsDir], partials: [snippetsDir], extname: '.liquid', fs: helioFs });
for (const [name, fn] of Object.entries(filters)) cartEngine.registerFilter(name, fn);
cartEngine.registerFilter('inline_asset_content', () => '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg>');
// Helio's English strings for the keys the override uses
const T = {
  'actions.log_in_html': 'Have an account? <a href="{link}">Log in</a> to check out faster.',
  'actions.continue_shopping': 'Continue shopping', 'content.cart_total': 'Cart total', 'content.product_image': 'Product image',
  'content.product_information': 'Product information', 'content.quantity': 'Quantity', 'content.product_total': 'Product total',
  'content.price_sale': 'Sale price', 'content.price_regular': 'Regular price', 'content.price': 'Price',
  'accessibility.remove_item': 'Remove {title}', 'accessibility.remove': 'Remove', 'accessibility.nested_product': '{product_title} of {parent_title}',
};
cartEngine.registerFilter('t', (k, ...args) => { const o = kw(args); return (T[k] || k).replace(/{(\w+)}/g, (_, n) => o[n] ?? ''); });
const blockTag = (wrap) => ({
  parse(token, remain) {
    this.tpls = [];
    const end = 'tag:end' + token.name;
    const stream = this.liquid.parser.parseStream(remain).on(end, () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error(`${token.name} not closed`); });
    stream.start();
  },
  * render(ctx, emitter) { if (wrap) emitter.write(wrap((yield this.liquid.renderer.renderTemplates(this.tpls, ctx)))); },
});
cartEngine.registerTag('doc', blockTag(null));
cartEngine.registerTag('stylesheet', blockTag((css) => `<style>${css}</style>`));

async function cartPage(file, items) {
  const ctx = { template: { name: 'cart', suffix: null } };
  if (!items.length) return writePage(file, 'Heartside preview: cart, empty', helio.cartEmpty, ctx);
  const tpl = readTemplate('cart.json').sections['cart-section'];
  const total = items.reduce((s, i) => s + i.final_line_price, 0);
  const cart = { 'empty?': false, items, item_count: items.reduce((s, i) => s + i.quantity, 0), total_price: total };
  const rows = (await cartEngine.renderFile('cart-products', { cart, block: { settings: tpl.blocks['cart-page-items'].settings, shopify_attributes: '' }, settings: {}, routes, shop }))
    .replace(/<script\b[^>]*type="module"[^>]*>\s*<\/script>/g, '');
  // the summary: Helio's tax note as the live cart drawer showed it on 5 October; hs2.js rewrites it
  const summary = `<div class="cart-summary"><div class="cart-totals"><div class="cart-totals__item cart-totals__total"><span>Estimated total</span><span>${money(total)} USD</span></div></div>
<div class="cart-totals__item cart-totals__tax-note cart-primary-typography"><small>Taxes and <a href="/policies/shipping-policy">shipping</a> calculated at checkout. </small></div>
<button type="submit" form="cart-form" name="checkout" class="button cart__checkout-button">Check out</button></div>`;
  const main = `<div id="shopify-section-template--cart__cart-section" class="shopify-section"><cart-items-component class="cart-items-component"><div class="section section--page-width"><div class="cart-page"><div class="cart-page__title"><div class="cart-title"><h1 class="h4">${tpl.blocks['cart-page-title'].settings.title} <span class="cart-title__count">(${cart.item_count})</span></h1></div></div><div class="cart-page__items">${rows}</div><div class="cart-page__summary">${summary}</div></div></div></cart-items-component></div>`;
  return writePage(file, 'Heartside preview: cart', main, ctx);
}
// a cart line the way Shopify hands it to Liquid; the hidden _ properties stay out of view
const cartLine = (p, v, index = 0) => ({
  index, key: `${v.id}:preview${index}`, variant_id: v.id, quantity: 1, title: `${p.title} - ${v.title}`, url: `${p.url}?variant=${v.id}`,
  product: p, variant: v, image: v.featured_media || p.featured_media,
  options_with_values: p.options_with_values.map((o) => ({ name: o.name, value: v.options[o.position - 1] })),
  properties: { _hs_art_style: 'preview' }, item_components: [], parent_relationship: { parent: null },
  original_price: v.price, final_price: v.price, original_line_price: v.price, final_line_price: v.price,
  line_level_discount_allocations: [], instructions: { can_update_quantity: true, can_remove: true },
});

// ------------------------------------------------------------------ pages
const written = [];
const skipped = [];
const templates = fs.readdirSync(path.join(theme, 'templates')).filter((f) => f.endsWith('.json')).sort();
const exists = (t) => templates.includes(t);

// what shoppers see today
written.push(await page('index.html', 'index.json', ctxFor('index.json')));
for (const [kind, p] of Object.entries(catalog)) {
  const t = `product.${kind}-native.json`;
  if (exists(t)) written.push(await page(`product-${kind}-native.html`, t, ctxFor(t, p)));
  else skipped.push(`${t} (not in the theme)`);
}
if (exists('product.portrait-native.json')) written.push(await page('product-portrait-native-unframed.html', 'product.portrait-native.json', ctxFor('product.portrait-native.json', withVariant(portrait, (v) => v.options[0] === 'Unframed'))));
written.push(await cartPage('cart-empty.html', []));
written.push(await cartPage('cart.html', [cartLine(mug, mug.variants[0])]));
// the homepage before its products are picked: the chat says which gift is missing
written.push(await page('index-noproducts.html', 'index.json', ctxFor('index.json'), (t) => {
  for (const s of Object.values(t.sections)) if (s.type === 'hs3-chat' && s.settings) ['product_mug', 'product_blanket', 'product_print', 'product_ornament'].forEach((k) => delete s.settings[k]);
  return t;
}));

// the 404 page and the moved pages (every retired template now holds an hs-moved section), each
// when the theme has it. A moved product template gets the mug, so its way back has a product.
if (exists('404.json')) written.push(await page('404.html', '404.json', ctxFor('404.json')));
else skipped.push('404.json (not in the theme yet)');
const moved = templates.filter((t) => Object.values(readTemplate(t).sections || {}).some((s) => s.type === 'hs-moved'));
for (const t of moved) {
  const ctx = ctxFor(t);
  written.push(await page(`moved-${t.replace(/\.json$/, '').replace(/\./g, '-')}.html`, t, ctx.template.name === 'product' ? { ...ctx, product: mug } : ctx));
}
if (!moved.length) skipped.push('moved templates (no template holds an hs-moved section yet)');

// Older tools open the chat and the gift page by their old file names (reveal.mjs, mockup-gate.mjs
// and tone-concept.mjs open index-gifts.html; mug-bridge.mjs serves product-gift.html). Those
// templates are moved pages now, so the names carry today's pages: the chat on the homepage and
// the mug's own page.
fs.copyFileSync(path.join(out, 'index.html'), path.join(out, 'index-gifts.html'));
if (exists('product.mug-native.json')) fs.copyFileSync(path.join(out, 'product-mug-native.html'), path.join(out, 'product-gift.html'));

for (const f of fs.readdirSync(path.join(theme, 'assets'))) fs.copyFileSync(path.join(theme, 'assets', f), path.join(out, 'assets', f));
fs.copyFileSync(path.join(repo, 'assets', 'heartside-logo.png'), path.join(out, 'assets', 'heartside-logo.png'));
console.log('rendered', written.join(', '));
console.log(`copies for older tools: index-gifts.html (the homepage chat)${exists('product.mug-native.json') ? ', product-gift.html (the mug page)' : ''}`);
console.log(`footer: ${OWN_FOOTER ? 'sections/hs-footer.liquid (Helio footer and company note switched off, as footer-heartside.mjs does)' : "Helio's captured footer and the company note"}`);
if (missingSections.size) console.log(`Helio sections shown as labelled gaps: ${[...missingSections].join(', ')}`);
if (skipped.length) console.log(`skipped: ${skipped.join('; ')}`);
if (missingMedia.length) console.log(`mock media missing, plain placeholders used: ${missingMedia.join(', ')}`);
