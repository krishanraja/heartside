import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {Liquid} from 'liquidjs';
const root=new URL('../../',import.meta.url);
const source=readFileSync(new URL('shopify/assets/component-cart-items.js',root),'utf8').replace(/\r\n/g,'\n');
const helper=source.slice(source.indexOf('function heartsideQuantityTarget('),source.indexOf('/** @typedef'));
const uuid='11111111-2222-4333-8444-555555555555';
const image='https://cdn.shopify.com/s/files/1/1111/2222/3333/files/heartside-checkout-'+uuid+'.jpg?v=123';
const component={key:'123:native',variant_id:123,quantity:2,properties:{_hs_checkout_image:image,_customization_id:uuid}};
const item={key:'123:merged',variant_id:123,quantity:1,original_price:25800,final_price:25800,original_line_price:25800,final_line_price:25800,item_components:[component]};
function rowFor(data,key=component.key){return {dataset:{key:data.key},getAttribute:k=>k==='data-hs2-cart-line'?JSON.stringify(data):key};}
function helpers(minified, action){
 const context={window:{Shopify:{actions:{getCart:action?async()=>({cart:{id:'private-cart'}}):undefined}}},HeartsideCartQuantity:{change:action}};
 const code=helper+'\napi={target:heartsideQuantityTarget,set:heartsideSetComponentQuantity,matches:heartsideQuantityMatches};';
 vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,context);return context.api;
}
for(const minified of [false,true]){
 const mode=minified?'minified':'source';
 test(mode+': quantity replacement receives exact component key, cart and requested quantity',async()=>{
  const calls=[], api=helpers(minified,async(...args)=>{calls.push(args);return {lines:{nodes:[]}};});
  assert.equal(api.target(rowFor(item)),component.key);
  for(const quantity of [0,1,2,3])await api.set(component.key,quantity);
  assert.deepEqual(calls,[0,1,2,3].map(quantity=>['private-cart',component.key,quantity]));
 });
 test(mode+': refreshed verification uses the newly returned key after replacement',async()=>{
  const api=helpers(minified,async()=>({cart:{lines:{nodes:[]}},componentKey:'123:replacement'}));
  const result=await api.set(component.key,1);
  const fresh={...item,item_components:[{...component,key:'123:replacement',quantity:1}]};
  assert.equal(api.matches([rowFor(fresh)],component.key,1),false);
  assert.equal(api.matches([rowFor(fresh)],result.componentKey,1),true);
  assert.match(source,/heartsideQuantityMatches\(this.refs.cartItemRows, result.componentKey, quantity\)/);
 });
 test(mode+': ordinary rows keep native routing and malformed marked rows are blocked',()=>{
  const api=helpers(minified);
  for(const data of [{...item,item_components:[]},{...item,item_components:[component,component]},{...item,variant_id:456},{...item,quantity:2},{...item,item_components:[{...component,properties:{}}]}]){
   assert.equal(api.target(rowFor(data,'')),'');
   assert.equal(api.target(rowFor(data)),null);
  }
  assert.equal(api.target(rowFor(item,'123:stale')),null);
 });
 test(mode+': rejected, unavailable, uncertain and invalid quantity actions fail without retries',async()=>{
  let calls=0;
  await assert.rejects(helpers(minified,async()=>{calls++;throw Error('Not allowed');}).set(component.key,1),/Not allowed/);
  assert.equal(calls,1);
  await assert.rejects(helpers(minified).set(component.key,1),/still loading/);
  await assert.rejects(helpers(minified,async()=>{throw Error('Network unavailable');}).set(component.key,1),/Network unavailable/);
  await assert.rejects(helpers(minified,async()=>{throw Error('must not run');}).set(component.key,1.5),/whole-number/);
 });
 test(mode+': actual rendered readback rejects no-op, duplicate and missing component outcomes',()=>{
  const api=helpers(minified);
  assert.equal(api.matches([rowFor(item)],component.key,2),true);
  assert.equal(api.matches([rowFor(item)],component.key,1),false);
  assert.equal(api.matches([rowFor(item),rowFor(item)],component.key,2),false);
  assert.equal(api.matches([],component.key,1),false);
  assert.equal(api.matches([],component.key,0),true);
  assert.equal(api.matches([rowFor({...component,item_components:[]})],component.key,2),true);
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

for (const minified of [false,true]) test((minified?'minified':'source')+': in-flight action leaves one awaited render owner and releases ordinary events',()=>{
 const start=source.indexOf('  #handleCartUpdate = (event) => {');
 const end=source.indexOf('\n\n  /**',start);
 const handler=source.slice(start,end);
 const code='class Harness { #heartsideQuantityOwner=null; #refreshCartSection(){} #updateCartQuantitySelectorButtonStates(){} '+handler+' call(event,inFlight){this.#heartsideQuantityOwner=inFlight?{}:null;this.#handleCartUpdate(event);} } instance=new Harness();';
 const context={}; vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,context);
 let listeners=0; const event={target:{},promise:{then(){listeners++;return {catch(){}};}}};
 context.instance.call(event,true); assert.equal(listeners,0);
 context.instance.call(event,false); assert.equal(listeners,1);
 assert.match(source,/finally \{\s+\/\/ Only the owning operation releases the cart, after its final render.\s+if \(heartsideOwner && this.#heartsideQuantityOwner === heartsideOwner\) this.#heartsideQuantityOwner = null;/);
});
