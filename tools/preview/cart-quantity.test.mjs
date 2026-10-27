import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {Liquid} from 'liquidjs';
const root=new URL('../../',import.meta.url);
const source=readFileSync(new URL('shopify/assets/component-cart-items.js',root),'utf8').replace(/\r\n/g,'\n');
const helper=source.slice(source.indexOf('function heartsideQuantityTarget('),source.indexOf('/** @typedef'));
const a=source.indexOf('      const componentKey = heartsideQuantityTarget('),b=source.indexOf('\n\n      cartTotal',a);
assert.ok(a>=0&&b>a);const request=source.slice(a,b);
const uuid='11111111-2222-4333-8444-555555555555';
const image='https://cdn.shopify.com/s/files/1/1111/2222/3333/files/heartside-checkout-'+uuid+'.jpg?v=123';
const component={key:'123:native',variant_id:123,quantity:2,properties:{_hs_checkout_image:image,_customization_id:uuid}};
const item={key:'123:merged',variant_id:123,quantity:1,original_price:25800,final_price:25800,original_line_price:25800,final_line_price:25800,item_components:[component]};
function requestFor(data,quantity,minified,key=component.key){
 const row={dataset:{key:data.key},getAttribute:k=>k==='data-hs2-cart-line'?JSON.stringify(data):key};
 const context={Theme:{routes:{cart_change_url:'/en/cart/change.js'}},window:{Shopify:{routes:{root:'/en/'}},location:{pathname:'/cart'}},line:1,quantity,sectionsToUpdate:new Set(['cart-main']),component:{refs:{cartItemRows:[row]}}};
 const code=helper+'\nresult=(function(){'+request+'\nreturn {payload:JSON.parse(body),url:requestUrl};}).call(component);';
 vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,context);return JSON.parse(JSON.stringify(context.result));
}
const body=(...args)=>requestFor(...args).payload;
for(const minified of [false,true]){
 const mode=minified?'minified':'source';
 test(mode+': exact native component key receives absolute quantity and removal without replacing properties',()=>{
  for(const quantity of [0,1,2,3])assert.deepEqual(body(item,quantity,minified),{updates:{'123:native':quantity},sections:'cart-main',sections_url:'/cart'});
  const other={...item,key:'123:other-parent',item_components:[{...component,key:'123:other-dog'}]};
  assert.deepEqual(body(other,1,minified,'123:other-dog').updates,{'123:other-dog':1});
  assert.equal(requestFor(item,1,minified).url,'/en/cart/update.js');
  assert.equal(requestFor(item,1,minified,'').url,'/en/cart/change.js');
 });
 test(mode+': ordinary, ambiguous, different-variant and invalid provenance lines retain native line-position behavior',()=>{
  for(const data of [{...item,item_components:[]},{...item,item_components:[component,component]},{...item,variant_id:456},{...item,quantity:2},{...item,item_components:[{...component,properties:{}}]}]){
   assert.deepEqual(body(data,1,minified,''),{line:1,quantity:1,sections:'cart-main',sections_url:'/cart'});
   assert.throws(()=>body(data,1,minified),/Refresh the page/);
  }
  assert.throws(()=>body(item,1,minified,'123:stale'),/Refresh the page/);
 });
}
test('Liquid displays actual component units and per-unit price but keeps the parent row index',async()=>{
 const source=readFileSync(new URL('shopify/snippets/cart-products.liquid',root),'utf8').replace(/\r\n/g,'\n');
 const a=source.indexOf('{%- liquid\n                assign hs_quantity_item'),b=source.indexOf('{%- comment -%} Current-row',a);
 assert.ok(a>=0&&b>a);const engine=new Liquid();
 const render=async item=>(await engine.parseAndRender(source.slice(a,b)+'{{ hs_quantity_item.quantity }}|{{ hs_quantity_key }}|{{ hs_unit_original_price }}|{{ hs_unit_final_price }}',{item})).trim();
 assert.equal(await render(item),'2|123:native|12900|12900');
 assert.equal(await render({...item,original_line_price:12900,final_line_price:12900,item_components:[{...component,quantity:1}]}),'1|123:native|12900|12900');
 assert.equal(await render({...item,item_components:[component,component]}),'1||25800|25800');
 assert.equal(await render({...item,item_components:[{...component,properties:{_hs_checkout_image:image}}]}),'1||25800|25800');
 assert.match(source,/in_cart_quantity: hs_quantity_item.quantity,\s+line_index: item.index/);
 assert.match(source,/hs_quantity_item.instructions.can_update_quantity == false/);
 assert.match(source,/hs_quantity_item.instructions.can_remove == false/);
});

test('marked-invalid controls stop before shimmer or optimistic removal',()=>{
 assert.match(source,/#onQuantityChange\(event\)[\s\S]*?#validateHeartsideQuantity\(line\)[\s\S]*?this.updateQuantity/);
 assert.match(source,/onLineItemRemove\(line\) \{\s+if \(!this.#validateHeartsideQuantity\(line\)\) return;/);
});
