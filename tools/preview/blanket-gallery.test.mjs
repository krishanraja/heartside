import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Liquid} from 'liquidjs';
const source=readFileSync(new URL('../../shopify/snippets/hs-product-gallery.liquid',import.meta.url),'utf8');
const engine=new Liquid();
engine.registerFilter('image_url',(media)=>`/media/${media?.id}.png`);
const technical={id:71850515169662,alt:'Technical placement'};
const example={id:71856804102526,alt:'Labelled blanket example'};
const first={id:71850000000000,alt:'Blanket reference'};
const render=(settings={},productId=16158073880958,featured=first,media=[first,technical,example])=>engine.parseAndRender(source,{s:settings,product:{id:productId,title:'Gift',featured_media:featured,media,options_with_values:[]},current:{featured_media:featured},tib:true});
test('blanket candidate gallery excludes exact technical media and retains the labelled example',async()=>{
 for(const settings of [{blanket_purchase:true},{blanket_art_preview:true}]){
  const html=await render(settings);
  assert.doesNotMatch(html,/71850515169662/);
  assert.match(html,/71856804102526/);
  assert.match(html,/data-hs2-thumb-preview/);
  assert.equal((html.match(/aria-current="true"/g)||[]).length,1);
 }
});
test('technical featured media falls back to allowed media with the correct active thumbnail',async()=>{
 const html=await render({blanket_purchase:true},16158073880958,technical,[technical,example,first]);
 assert.doesNotMatch(html,/71850515169662/);
 assert.match(html,/data-hs2-main src="\/media\/71856804102526.png"/);
 assert.match(html,/data-hs2-thumb="\/media\/71856804102526.png"[^>]*aria-current="true"/);
});
test('the blank technical image is hidden by its alt text on every product, labelled photos stay',async()=>{
 const live={id:71856697049470,alt:'Blank tan sherpa blanket reference. Your personalized artwork is shown in your cart.'};
 const other={id:71859323634046,alt:'Illustrated mug, black inside: handle-left view. Example only.'};
 for(const [settings,id] of [[{},16158073880958],[{blanket_purchase:true},16160217956734],[{mug_art_preview:true},16160217956734]]){
  const html=await render(settings,id,live,[live,other,example]);
  assert.doesNotMatch(html,/71856697049470/,'the blank reference never shows, first or as a thumbnail');
  assert.match(html,/data-hs2-main src="\/media\/71859323634046.png"/);assert.match(html,/71856804102526/);
 }
 // a setting can name other alt text to hide; the known ids stay hidden as a backstop
 const custom=await render({hide_media_alt:'handle-left'},16158073880958,other,[other,example]);
 assert.doesNotMatch(custom,/71859323634046/);
});
test('only-excluded media never leaks into the main image',async()=>{
 const html=await render({blanket_purchase:true},16158073880958,technical,[technical]);
 assert.doesNotMatch(html,/71850515169662|data-hs2-main/);
 assert.match(html,/data-hs2-tib-gallery/);
});
test('a checkout tile, the designed picture a variant carries for checkout, never shows on the page (28 Oct)',async()=>{
 const tile={id:71860000000001,alt:'Your design, painted from your dog. Heartside checkout tile.'};
 const other={id:71859323634046,alt:'Illustrated mug, black inside: handle-left view. Example only.'};
 for(const settings of [{},{blanket_purchase:true}]){
  const html=await render(settings,16158073880958,tile,[tile,other,example]);
  assert.doesNotMatch(html,/71860000000001/,'the tile is hidden, first or as a thumbnail');
  assert.match(html,/data-hs2-main src="\/media\/71859323634046.png"/);
 }
});
