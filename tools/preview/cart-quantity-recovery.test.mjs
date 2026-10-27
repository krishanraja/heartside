import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {createHeartsideCartQuantity} from '../../shopify/assets/hs-cart-quantity.js';

// Every recovery record must have a way out that a fresh read of the cart can justify.
const cartId='gid://shopify/Cart/recovery-test?key=never-persist';
const variant='gid://shopify/ProductVariant/123';
const attributes=[['_customization_id','recovery-design'],['_tib_design_link_1','https://example.invalid/design.png'],['_hs_checkout_image','https://cdn.shopify.com/s/files/1/1/2/3/files/design.jpg'],['Dog name','Test dog']].map(([key,value])=>({key,value}));
const clone=value=>JSON.parse(JSON.stringify(value));
function buildFixture(create){
 const state={designs:[{parent:'parent-1',viewKey:'123:native',quantity:2}],otherQuantity:1,removeMode:'ok',addMode:'ok',calls:[],stored:null};
 const parentLine=design=>({id:design.parent,quantity:1,attributes:[],merchandise:{id:variant},lineComponents:[{id:design.parent+'-child',viewKey:design.viewKey,quantity:design.quantity,attributes:clone(attributes),merchandise:{id:variant}}]});
 const cart=()=>({id:cartId,lines:{nodes:[...state.designs.map(parentLine),{id:'other',quantity:state.otherQuantity,attributes:[{key:'note',value:'Ordinary'}],merchandise:{id:'gid://shopify/ProductVariant/456'}}]}});
 const actions={async updateCart(payload){
  assert.ok(state.stored,'backup exists before any mutation');
  assert.equal(state.stored.includes('never-persist'),false);
  state.calls.push(clone(payload));
  const line=payload.lines[0];
  if(line.id){
   if(state.removeMode==='throw-uncommitted')throw Error('Network lost');
   state.designs=state.designs.filter(design=>design.parent!==line.id);
   return {};
  }
  assert.deepEqual(clone(line.attributes),attributes);assert.equal(line.merchandiseId,variant);
  if(state.addMode==='throw-uncommitted')throw Error('Network lost');
  if(state.addMode==='reject')return {userErrors:[{message:'Unavailable'}]};
  state.designs.push({parent:'parent-'+(state.calls.length+1),viewKey:'123:readded-'+state.calls.length,quantity:line.quantity});
  return {};
 }};
 const storage={getItem:()=>state.stored,setItem:(_key,value)=>{state.stored=value;},removeItem:()=>{state.stored=null;}};
 const deps={actions,readCart:async()=>cart(),storage,digest:async value=>createHash('sha256').update(value).digest('hex')};
 return {state,deps,engine:create(deps),units:()=>state.designs.reduce((sum,design)=>sum+design.quantity,0)};
}
const context={module:{exports:{}}};context.exports=context.module.exports;
vm.runInNewContext(transformSync(readFileSync(new URL('../../shopify/assets/hs-cart-quantity.js',import.meta.url),'utf8'),{minify:true,format:'cjs'}).code,context);
for(const [mode,create] of [['source',createHeartsideCartQuantity],['minified',context.module.exports.createHeartsideCartQuantity]]){
const fixture=()=>buildFixture(create);
const check=(name,body)=>test(mode+': '+name,body);

check('A: a removal that threw without committing clears on a fresh check showing the original line',async()=>{
 const {state,engine,units}=fixture();state.removeMode='throw-uncommitted';
 await assert.rejects(engine.change(cartId,'123:native',3),/uncertain/);
 assert.equal(engine.pending().phase,'uncertain_remove');
 await engine.recover(cartId,'check');
 assert.equal(engine.pending(),null);assert.equal(units(),2);assert.equal(state.calls.length,1);
});
check('A: an uncertain removal whose fresh read shows the line gone offers an exact restore',async()=>{
 const {state,engine,units}=fixture();state.removeMode='throw-uncommitted';
 await assert.rejects(engine.change(cartId,'123:native',3),/uncertain/);
 state.designs=[];state.removeMode='ok';
 await engine.recover(cartId,'check');assert.equal(engine.pending().phase,'removed');
 await engine.recover(cartId,'restore');
 assert.equal(engine.pending(),null);assert.equal(units(),2);assert.equal(state.calls.length,2);
});
check('B: after an add that threw without committing, a status check is allowed and then restore is offered',async()=>{
 const {state,engine,units}=fixture();state.addMode='throw-uncommitted';
 await assert.rejects(engine.change(cartId,'123:native',3),/not confirmed/);
 assert.equal(engine.pending().phase,'uncertain_add');assert.equal(state.calls.length,2);
 for(const action of ['retry','restore','discard'])await assert.rejects(engine.recover(cartId,action),/Only a status check/);
 assert.equal(state.calls.length,2);
 await engine.recover(cartId,'check');
 assert.equal(engine.pending().phase,'removed');assert.equal(state.calls.length,2);
 state.addMode='ok';await engine.recover(cartId,'restore');
 assert.equal(engine.pending(),null);assert.equal(units(),2);assert.equal(state.calls.length,3);
});
check('B: a status check that finds the add landed clears the record without another mutation',async()=>{
 const {state,engine,units}=fixture();state.addMode='throw-uncommitted';
 await assert.rejects(engine.change(cartId,'123:native',3),/not confirmed/);
 state.designs.push({parent:'parent-late',viewKey:'123:late',quantity:3});
 await engine.recover(cartId,'check');
 assert.equal(engine.pending(),null);assert.equal(units(),3);assert.equal(state.calls.length,2);
});
check('C: an unrelated ordinary row changing after a rejected add does not block check or restore',async()=>{
 const {state,engine,units}=fixture();state.addMode='reject';
 await assert.rejects(engine.change(cartId,'123:native',3),/rejected/);
 assert.equal(engine.pending().phase,'removed');
 state.otherQuantity=2;state.addMode='ok';
 await engine.recover(cartId,'check');assert.equal(engine.pending().phase,'removed');
 await engine.recover(cartId,'restore');
 assert.equal(engine.pending(),null);assert.equal(units(),2);assert.equal(state.otherQuantity,2);assert.equal(state.calls.length,3);
});
check('C: an unrelated ordinary row changing after a rejected add does not block discard',async()=>{
 const {state,engine}=fixture();state.addMode='reject';
 await assert.rejects(engine.change(cartId,'123:native',3),/rejected/);
 state.otherQuantity=3;
 await engine.recover(cartId,'discard');
 assert.equal(engine.pending(),null);assert.equal(state.calls.length,2);
});
check('2: a duplicate design identity is refused before anything is removed',async()=>{
 const {state,engine,units}=fixture();state.designs.push({parent:'parent-copy',viewKey:'123:copy',quantity:1});
 await assert.rejects(engine.change(cartId,'123:native',3),/more than once/);
 assert.equal(state.calls.length,0);assert.equal(state.stored,null);assert.equal(engine.pending(),null);
 assert.equal(state.designs.length,2);assert.equal(units(),3);
});
}
