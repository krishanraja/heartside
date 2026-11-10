// Which painting belongs under an order line, from the line's own attributes or, for a bundle line, its
// components'. The cart wrote _hs_checkout_image (the checkout picture) and Teeinblue _customization_image
// (its preview); both are https images on Shopify's or Teeinblue's CDN. Tested by
// tools/preview/order-painting.test.mjs.
const HOSTS = /^https:\/\/(cdn\.shopify\.com|cdn\.teeinblue\.com)\//;

function val(attrs, key) {
  const a = (attrs || []).find(x => x && x.key === key && String(x.value || '').trim());
  return a ? String(a.value).trim() : '';
}

function fromAttrs(attrs) {
  for (const key of ['_hs_checkout_image', '_customization_image']) {
    const v = val(attrs, key);
    if (HOSTS.test(v)) return v;
  }
  return '';
}

// the dog's name, from "Dog: Mowgli (he) | ..." in _hs_answers, or a Dog's name field
function dogName(attrs) {
  const named = val(attrs, "Dog's name");
  if (named) return named.slice(0, 40);
  const m = /Dog:\s*([^|(]+?)\s*(?:\(|\||$)/.exec(val(attrs, '_hs_answers'));
  return m ? m[1].trim().slice(0, 40) : '';
}

export function paintingFor(line) {
  if (!line) return null;
  const sets = [line.attributes || []].concat((line.lineComponents || []).map(c => c.attributes || []));
  for (const attrs of sets) {
    const src = fromAttrs(attrs);
    if (src) return { src, dog: dogName(attrs) };
  }
  return null;
}
