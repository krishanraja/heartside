// The example paintings on the first screen (Krish, 28 Oct: "wire them in behind the switch, just
// set them to on"). Only images the 28 Oct review kept, each from the job it was made for, each in
// the section once with the manifest's words and size, and the switch on.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const site = JSON.parse(read('design/examples-2026-10-28/site.json'));
const jobs = JSON.parse(read('design/examples-2026-10-28/jobs.json')).jobs;
const review = read('design/examples-2026-10-28/review.md');
const section = read('shopify/sections/hs3-chat.liquid');

test('every example on the page was made by its job and kept by the review', () => {
  assert.equal(site.images.length, 8);
  for (const img of site.images) {
    const job = jobs.find(j => j.id === img.id);
    assert.ok(job, img.id + ' is a 28 Oct job');
    assert.match(review, new RegExp('`' + img.id + '`: kept'), img.id + ' was kept');
    assert.ok(existsSync(new URL('shopify/assets/hs-example-' + img.id + '.webp', root)), img.id + ' asset');
    assert.match(img.source_sha256 || '', /^[a-f0-9]{64}$/);
    // the tone it shows is the tone it was made at
    assert.equal(['Sentimental', 'Warm with a wink', 'Hilarious'][img.tone], job.tone, img.id);
  }
  for (const id of ['poodle-hilarious-mug', 'golden-hilarious-portrait']) {
    assert.match(review, new RegExp('`' + id + '`: rejected'));
    assert.ok(!site.images.some(i => i.id === id), id + ' stays off the page');
  }
});

test('the section shows each kept image once, with its words and size, and nothing else', () => {
  const used = [...section.matchAll(/'hs-example-([a-z-]+)\.webp'/g)].map(m => m[1]);
  assert.deepEqual([...used].sort(), site.images.map(i => i.id).sort());
  for (const img of site.images) {
    const tag = section.match(new RegExp('<img[^>]*hs-example-' + img.id + '\\.webp[^>]*>'))[0];
    assert.ok(tag.includes('alt="' + img.alt + '"'), img.id + ' alt');
    assert.ok(tag.includes(`width="${img.size[0]}" height="${img.size[1]}"`), img.id + ' size');
    if (img.use === 'slider') assert.ok(tag.includes(`data-hs3-demo-img="${img.tone}"`), img.id + ' sits at its tone on the slider');
  }
  // every picture is labelled Example on the page
  assert.equal((section.match(/<span class="hs3-example">EXAMPLES?<\/span>/g) || []).length >= 3, true);
});

test('the switch is on', () => {
  const schema = JSON.parse(section.slice(section.indexOf('{% schema %}') + 12, section.indexOf('{% endschema %}')));
  assert.equal(schema.settings.find(s => s.id === 'examples_on').default, true);
  const index = JSON.parse(read('shopify/templates/index.chat.json').replace(/\/\*[\s\S]*?\*\//g, ''));
  assert.equal(index.sections.gift.settings.examples_on, true);
  // the slider moves the picture: hs3.js toggles the image that matches the tone
  assert.match(read('shopify/assets/hs3.js'), /\[data-hs3-demo-img\][\s\S]{0,200}classList\.toggle\('is-on', on\)/);
});
