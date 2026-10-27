import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {createHeartsideCartQuantity} from '../../shopify/assets/hs-cart-quantity.js';

const cartId='gid://shopify/Cart/private-test?key=never-persist';
const attributes=[['_customization_id','test-design'],['_tib_design_link_1','https://example.invalid/original.png'],['_hs_checkout_image','https://cdn.shopify.com/s/files/1/1/2/3/files/design.jpg'],['Dog name','Test dog'],['_native_print_sku','original-sku']].map(([key,value])=>({key,value}));
const clone=value=>JSON.parse(JSON.stringify(value));
function buildFixture(create){
 const state={quantity:2,viewKey:'123:native',otherQuantity:1,mode:'ok',calls:[],stored:null,pending:[],readCount:0};
 const cart=()=>({id:cartId,lines:{nodes:[...(state.quantity?[{id:'parent',quantity:1,attributes:[],merchandise:{id:'gid://shopify/ProductVariant/123'},lineComponents:[{id:'child',viewKey:state.viewKey,quantity:state.quantity,attributes:clone(attributes),merchandise:{id:'gid://shopify/ProductVariant/123'}}]}]:[]),{id:'other',quantity:state.otherQuantity,attributes:[{key:'other dog',value:'Untouched'}],merchandise:{id:'gid://shopify/ProductVariant/456'}}]}});
 const storage={getItem:()=>state.stored,setItem:(_key,value)=>{if(state.mode==='storage-error')throw Error('Storage unavailable');state.stored=value;},removeItem:()=>{state.stored=null;}};
 const actions={async updateCart(payload){
   assert.ok(state.stored,'backup exists before any mutation');
   assert.equal(state.stored.includes('never-persist'),false);
   state.calls.push(clone(payload));
   const line=payload.lines[0];
   if(line.id){assert.equal(line.id,'parent');assert.equal(line.quantity,0);state.quantity=0;if(state.mode==='change-other')state.otherQuantity=2;return {cart:cart()};}
   assert.deepEqual(clone(line.attributes),attributes);assert.equal(line.merchandiseId,'gid://shopify/ProductVariant/123');
   if(state.mode==='reject-add')return {userErrors:[{message:'Unavailable'}]};
   if(state.mode==='unknown-add')throw Error('Network lost');
   state.quantity=line.quantity;
   if(state.mode==='rekey')state.viewKey='123:replacement-'+state.calls.length;
   if(state.mode==='committed-timeout')throw Error('Response lost');
   return {cart:cart()};
 }};
 const deps={actions,readCart:async()=>{state.readCount++;return cart();},storage,digest:async value=>createHash('sha256').update(value).digest('hex'),pendingChanged:record=>state.pending.push(record?.phase||null)};
 return {state,deps,engine:create(deps)};
}
const context={module:{exports:{}}};context.exports=context.module.exports;
vm.runInNewContext(transformSync(readFileSync(new URL('../../shopify/assets/hs-cart-quantity.js',import.meta.url),'utf8'),{minify:true,format:'cjs'}).code,context);
for(const [mode,create] of [['source',createHeartsideCartQuantity],['minified',context.module.exports.createHeartsideCartQuantity]]) {
const fixture=()=>buildFixture(create);
const check=(name,body)=>test(mode+': '+name,body);
check('2→1→2→1 preserves exact native attributes and the other personalized item',async()=>{
 const {state,engine}=fixture();
 for(const quantity of [1,2,1]){await engine.change(cartId,'123:native',quantity);assert.equal(state.quantity,quantity);assert.equal(state.otherQuantity,1);assert.equal(engine.pending(),null);}
 assert.equal(state.calls.length,6);assert.ok(state.calls.every(call=>call.lines.length===1));
});
check('replacement returns the fresh component key after each recreated line',async()=>{
 const {state,engine}=fixture();state.mode='rekey';let previous=state.viewKey;
 for(const quantity of [1,2,1]){
  const result=await engine.change(cartId,previous,quantity);
  assert.notEqual(result.componentKey,previous);
  assert.equal(result.componentKey,state.viewKey);
  assert.equal(result.cart.lines.nodes[0].lineComponents[0].quantity,quantity);
  previous=result.componentKey;
 }
});
check('failed backup prevents removal',async()=>{
 const {state,engine}=fixture();state.mode='storage-error';
 await assert.rejects(engine.change(cartId,'123:native',1),/Storage unavailable/);
 assert.equal(state.quantity,2);assert.equal(state.calls.length,0);
});
check('definitive add rejection retains design across refresh and explicit restore is exact',async()=>{
 const {state,engine,deps}=fixture();state.mode='reject-add';
 await assert.rejects(engine.change(cartId,'123:native',1),/rejected/);
 assert.equal(state.quantity,0);assert.equal(engine.pending().phase,'removed');
 const restored=create(deps);state.mode='ok';
 await restored.recover(cartId,'restore');assert.equal(state.quantity,2);assert.equal(restored.pending(),null);
 assert.equal(state.calls.length,3);
});
check('unknown add cannot be retried or restored; later confirmed commit clears without a duplicate',async()=>{
 const {state,engine}=fixture();state.mode='unknown-add';
 await assert.rejects(engine.change(cartId,'123:native',1),/not confirmed/);
 assert.equal(engine.pending().phase,'uncertain_add');
 for(const mode of ['retry','restore','discard'])await assert.rejects(engine.recover(cartId,mode),/Only a status check/);
 assert.equal(state.calls.length,2);
 state.quantity=1;await engine.recover(cartId,'check');assert.equal(engine.pending(),null);assert.equal(state.calls.length,2);
});
check('lost add response with authoritative committed readback completes once',async()=>{
 const {state,engine}=fixture();state.mode='committed-timeout';
 await engine.change(cartId,'123:native',1);assert.equal(state.quantity,1);assert.equal(engine.pending(),null);assert.equal(state.calls.length,2);
});
check('wrong-cart recovery and changed other items never cause a further mutation',async()=>{
 const {state,engine}=fixture();state.mode='change-other';
 await assert.rejects(engine.change(cartId,'123:native',1),/could not be confirmed/);
 assert.equal(state.calls.length,1);assert.equal(engine.pending().phase,'uncertain_remove');
 await assert.rejects(engine.recover('other-cart','restore'),/original cart/);assert.equal(state.calls.length,1);
});
check('definitive rejection permits explicit cancel of the absent saved item without stranding checkout',async()=>{
 const {state,engine}=fixture();state.mode='reject-add';
 await assert.rejects(engine.change(cartId,'123:native',1),/rejected/);
 await engine.recover(cartId,'discard');assert.equal(state.quantity,0);assert.equal(engine.pending(),null);assert.equal(state.calls.length,2);
});

}

