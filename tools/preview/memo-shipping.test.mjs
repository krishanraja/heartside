import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {Liquid} from 'liquidjs';

const root=new URL('../../',import.meta.url);
const source=process.env.HS_MEMO_TEST_BASELINE?execFileSync('git',['show',process.env.HS_MEMO_TEST_BASELINE+':shopify/sections/hs2-memo.liquid'],{cwd:root,encoding:'utf8'}):readFileSync(new URL('shopify/sections/hs2-memo.liquid',root),'utf8');
// Stub asset and text-rendering snippets; execute the section's actual Liquid conditions.
const body=source.replace("{%- render 'hs2-head' -%}",'').replace("{% render 'hs2-t', text: msg %}",'{{ msg }}').replace(/\{% render 'hs-cart-more'[^%]*%\}/,'').replace(/\{%- render 'hs-help'[^%]*-%\}/,'').split('{% schema %}')[0];
const schema=JSON.parse(source.split('{% schema %}')[1].split('{% endschema %}')[0]);
const defaults=Object.fromEntries(schema.settings.filter(s=>s.id).map(s=>[s.id,s.default]));
const engine=new Liquid();
// the strip renders the schema defaults unless a test passes the text a store saved earlier
// the one-line memo is what shows with the Christmas offer switched off (Krish, 3 Nov: the strip is the offer by default)
const render=(template,deadline='',saved={})=>engine.parseAndRender(body,{template,section:{settings:{...defaults,offer_on:false,...saved,deadline}}});
const renderOffer=(deadline='2026-12-10',saved={})=>engine.parseAndRender(body,{template:{name:'index',suffix:''},section:{settings:{...defaults,...saved,deadline}}});
const msg=html=>html.match(/class="hs2-memo__msg">([^<]*)<\/span>/)[1];
const templates=[{name:'product',suffix:'blanket-native'},{name:'product',suffix:'mug-native'},{name:'product',suffix:'portrait-native'},{name:'product',suffix:'gift'},{name:'product',suffix:'blanket-art-preview'},{name:'product',suffix:''},{name:'index',suffix:'blanket-native'},{name:'index',suffix:''},{name:'cart',suffix:''}];

test('every page, native products included, carries the one shipping line with no deadline set',async()=>{
  for(const template of templates) {
    const html=await render(template);
    assert.equal(msg(html),'Free US shipping on every order.');
    assert.match(html,/data-hs2-countdown="memo"/);
  }
});
test('with a last order date the strip names it, then the same shipping line',async()=>{
  for(const template of templates) assert.equal(msg(await render(template,'2026-12-10')),'Order by December 10 for Christmas delivery. Free US shipping on every order.');
});
test('a memo the theme editor saved before the ruling still ends with the full shipping line',async()=>{
  const saved={text:'Order by [DATE] for Christmas delivery. Free US shipping.'};
  assert.equal(msg(await render({name:'product',suffix:'mug-native'},'2026-12-10',saved)),'Order by December 10 for Christmas delivery. Free US shipping on every order.');
  assert.equal(msg(await render({name:'index',suffix:''},'',saved)),'Free US shipping on every order.');
});
test('no delivered memo string says shipping is calculated at checkout',async()=>{
  assert.doesNotMatch(source,/calculated at checkout/i);
  for(const template of templates) for(const deadline of ['','2026-12-10']) assert.doesNotMatch(await render(template,deadline),/calculated at checkout/i);
});
test('the memo renders as the brand strip and keeps the store-wide countdown dates',async()=>{
  const html=await render({name:'index',suffix:''},'2026-12-10');
  assert.match(html,/class="hs2-memo hs-strip" data-hs2-memo data-deadline="2026-12-10"/);
  assert.match(await renderOffer(),/class="hs2-memo hs-strip hs-strip--offer" data-hs2-memo data-deadline="2026-12-10"/);
  assert.match(html,/data-offer-start="2026-10-20" data-offer-end="2026-11-01"/);
});

test('by default the strip is the one Christmas offer: badge, countdown, free shipping, and the saving only when it exists (3 Nov)',async()=>{
  assert.equal(defaults.offer_on,true);
  const off=await renderOffer();
  assert.match(off,/class="hs2-memo__msg">Christmas offer<\/span><span class="hs2-memo__count" data-hs2-countdown="memo" hidden><\/span>/);
  assert.match(off,/class="hs2-memo__deal">Fast, free US shipping<\/p>/);
  assert.doesNotMatch(off,/15% off/,'no saving while the bundle switch is off');
  assert.doesNotMatch(off,/data-hs2-ticker/,'the offer sits still');
  assert.match(await renderOffer('2026-12-10',{bundle_offer_live:true}),/Fast, free US shipping<span aria-hidden="true"> · <\/span>15% off 2 gifts, 20% off 3<\/p>/);
  // a deal line the theme editor saved before 6 Nov still leads with fast shipping (Krish, 6 Nov)
  assert.match(await renderOffer('2026-12-10',{offer_deal:'Free US shipping'}),/class="hs2-memo__deal">Fast, free US shipping<\/p>/);
});
