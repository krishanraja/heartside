import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {Liquid} from 'liquidjs';
const root=new URL('../../',import.meta.url);
const source=process.env.HS_CART_BASELINE?execFileSync('git',['show',process.env.HS_CART_BASELINE+':shopify/assets/hs2.js'],{cwd:root,encoding:'utf8'}):readFileSync(new URL('shopify/assets/hs2.js',root),'utf8');
const part=name=>{const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1,name);return source.slice(start,source.indexOf('\n  function ',start+1));};
const uuid='11111111-2222-4333-8444-555555555555';
const prepared='https://cdn.shopify.com/s/files/1/1111/2222/3333/files/heartside-checkout-'+uuid+'.jpg?v=123';
const native='https://cdn.teeinblue.com/customizations/'+uuid+'.jpg';
const child={key:'123:child',variant_id:123,quantity:2,properties:{_customization_image:native}};
for(const minified of [false,true]){
 const mode=minified?'minified':'source';
 const context=extra=>{const c={redoOffers:()=>{},bundleLine:()=>{},artistTouch:()=>{},...extra};const code=['cartArtworkImage','cartTidy','cartPicture'].map(part).join('\n');vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,c);return c;};
 test(mode+': parent prepared image wins; ordinary native and exact single component recover artwork',()=>{
  const c=context();assert.equal(c.cartArtworkImage({...child,properties:{_hs_checkout_image:prepared,_customization_image:native}}),prepared);
  assert.equal(c.cartArtworkImage(child),native);
  assert.equal(c.cartArtworkImage({variant_id:123,item_components:[child]}),native);
  assert.equal(c.cartArtworkImage({variant_id:123,item_components:[{...child,properties:{_hs_checkout_image:prepared}}]}),prepared);
 });
 test(mode+': ambiguous or different-variant children and arbitrary product images never provide artwork',()=>{
  const c=context();for(const item of [{variant_id:123,item_components:[child,child]},{variant_id:456,item_components:[child]},{image:prepared,featured_image:{url:prepared}},{properties:{_hs_checkout_image:'https://evil.example/a.jpg',_customization_image:'javascript:alert(1)'}},{properties:{_hs_checkout_image:prepared.replace('cdn.shopify.com','cdn.shopify.com.evil.example')}}])assert.equal(c.cartArtworkImage(item),'');
 });
 test(mode+': current row snapshot replaces stale cache on native rerender without cross-design leakage or fetch',()=>{
  const attrs={src:'https://example.test/neutral.jpg',srcset:'neutral 1x',alt:'Blank blanket reference'},img={getAttribute:k=>attrs[k]??null,setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k],classList:{add(){},remove(){}}};Object.defineProperty(img,'src',{get:()=>attrs.src,set:v=>attrs.src=v});
  let snapshot={key:'123:parent',variant_id:123,quantity:1,item_components:[child]};
  const row={getAttribute:k=>k==='data-key'?'123:parent':JSON.stringify(snapshot),querySelector:s=>s==='.cart-items__media img'?img:null,querySelectorAll:()=>[]};
  const c=context({cartImages:{'123:parent':prepared},window:{},fetch:()=>{throw Error('unexpected request');},document:{querySelectorAll:s=>s.startsWith('.cart-items__table-row')?[row]:[],querySelector:()=>null}});
  c.cartTidy();assert.equal(img.src,native);assert.equal(attrs.srcset,undefined);assert.equal(attrs.alt,'Your personalized artwork');
  snapshot={key:'123:parent',variant_id:123,quantity:1,properties:{_hs_checkout_image:prepared}};c.cartTidy();assert.equal(img.src,prepared);
  snapshot={key:'another:design',variant_id:123,properties:{_hs_checkout_image:prepared}};c.cartTidy();assert.equal(img.src,'https://example.test/neutral.jpg');assert.equal(attrs.srcset,'neutral 1x');assert.equal(attrs.alt,'Blank blanket reference');
  snapshot={key:'123:parent',variant_id:123,item_components:[child,child]};c.cartTidy();assert.equal(img.src,'https://example.test/neutral.jpg');
 });
}
test('actual Liquid row snapshot escapes values and exposes only whitelisted line/component fields',async()=>{
 const liquid=readFileSync(new URL('shopify/snippets/cart-products.liquid',root),'utf8');
 const start=liquid.indexOf('{%- capture hs_cart_line -%}'),end=liquid.indexOf('{%- endcapture -%}',start)+'{%- endcapture -%}'.length;
 assert.ok(start>=0);const fragment=liquid.slice(start,end)+'<div data-hs2-cart-line="{{ hs_cart_line | escape }}"></div>';
 const engine=new Liquid();engine.registerFilter('json',value=>JSON.stringify(value??null));
 const item={...child,key:'123:<"&',properties:{_hs_checkout_image:prepared,_customization_image:native,'Dog\'s name':'DO-NOT-EXPOSE'},item_components:[child]};
 const html=await engine.parseAndRender(fragment,{item,cart:{token:'SECRET'},customer:{email:'PRIVATE'}});
 assert.doesNotMatch(html,/DO-NOT-EXPOSE|SECRET|PRIVATE/);assert.match(html,/&lt;.*(?:&quot;|&#34;).*&amp;/);
 const decoded=html.match(/data-hs2-cart-line="([\s\S]*)"><\/div>/)[1].replace(/&quot;|&#34;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
 const data=JSON.parse(decoded);assert.deepEqual(Object.keys(data).sort(),['item_components','key','properties','quantity','variant_id']);assert.equal(data.key,item.key);assert.equal(data.quantity,2);assert.equal(data.item_components[0].key,child.key);assert.equal(data.item_components[0].quantity,2);
});
test('cart template retains inherited collection configuration but disables obsolete recommendations',()=>{
 const raw=readFileSync(new URL('shopify/templates/cart.json',root),'utf8');
 const section=JSON.parse(raw.slice(raw.indexOf('{'))).sections.product_list_NNFgcy;
 assert.equal(section.disabled,true);assert.equal(section.type,'product-list');
 assert.equal(section.settings.collection,'all');assert.equal(section.settings.max_products,4);
});
