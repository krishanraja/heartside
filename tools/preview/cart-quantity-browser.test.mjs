import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';

// Drives the real cart-items component and the real quantity engine in Chromium. The base
// theme modules (@theme/*, @shopify/events) are not in this overlay, so they are minimal stubs;
// the cart, the Storefront read and Shopify.actions are an in-page fake.
// Shopify minifies theme JavaScript on its CDN, so every case also runs the minified modules.
const asset=(name,minified)=>{const code=readFileSync(new URL('../../shopify/assets/'+name,import.meta.url),'utf8');return minified?transformSync(code,{minify:true,format:'esm'}).code:code;};
const stubs={
 'component.js':`export class Component extends HTMLElement{get refs(){const refs={cartItemRows:[...this.querySelectorAll('[ref="cartItemRows[]"]')],quantitySelectors:[...this.querySelectorAll('[ref="quantitySelectors[]"]')]};for(const el of this.querySelectorAll('[ref]')){const name=el.getAttribute('ref');if(!name.endsWith('[]'))refs[name]=el;}return refs;}connectedCallback(){}disconnectedCallback(){}}`,
 'utilities.js':`export const fetchConfig=(type,{body})=>({method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body});export const debounce=fn=>fn;export const onAnimationEnd=(el,cb)=>cb();export const prefersReducedMotion=()=>true;export const resetShimmer=()=>{};export const startViewTransition=cb=>cb();`,
 'section-renderer.js':`export const sectionRenderer={renderSection:(id,options)=>window.__renderSection(id,options),abortRender:id=>window.__server.aborts.push(id)};export const morphSection=async()=>window.__renderSection();`,
 'events.js':`export const ThemeEvents={quantitySelectorUpdate:'quantity-selector:update'};export class QuantitySelectorUpdateEvent extends Event{constructor(quantity,cartLine){super(ThemeEvents.quantitySelectorUpdate,{bubbles:true});this.detail={quantity,cartLine};}}export class CartSectionRestoredEvent extends Event{constructor(){super('cart:section-restored',{bubbles:true});}}`,
 'performance.js':`export const cartPerformance={createStartingMarker:()=>({}),measureFromMarker:()=>{}};`,
 'shopify-events.js':`export const StandardEvents={cartLinesUpdate:'shopify:cart:lines-update',cartDiscountUpdate:'shopify:cart:discount-update',cartNoteUpdate:'shopify:cart:note-update'};export const createViewEventElement=Base=>Base;class DetailEvent extends Event{constructor(type,detail){super(type,{bubbles:true});Object.assign(this,detail);this.detail=detail;}}export class CartErrorEvent extends DetailEvent{constructor(detail){super('cart:error',detail);}}export class CartLinesUpdateEvent extends DetailEvent{constructor(detail){super(StandardEvents.cartLinesUpdate,detail);}static createPromise(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}static createCartFromAjaxResponse(response){return response;}}export class CartDiscountUpdateEvent extends DetailEvent{}export class CartNoteUpdateEvent extends DetailEvent{}`,
};
const imports={'@theme/component':'/stubs/component.js','@theme/utilities':'/stubs/utilities.js','@theme/section-renderer':'/stubs/section-renderer.js','@theme/events':'/stubs/events.js','@theme/performance':'/stubs/performance.js','@shopify/events':'/stubs/shopify-events.js'};
const page=`<!doctype html><html><head><meta charset="utf-8"><script type="importmap">${JSON.stringify({imports})}</script></head><body>
<div id="shopify-section-main"><cart-items-component data-section-id="main"></cart-items-component><div id="summary"></div></div>
<script>window.Theme={routes:{cart_change_url:'/cart/change.js',cart_url:'/cart'}};window.__renderDom();</script>
<script type="module">import '/assets/component-cart-items.js';window.__ready=true;</script></body></html>`;

// Runs in the page before any theme script. `setup` picks the server order, the (possibly stale)
// rendered order, and an optional recovery record already saved in this tab.
function fakeStore(setup){
 const cartId='gid://shopify/Cart/browser-test?key=never-persist',variant='gid://shopify/ProductVariant/123';
 const image='https://cdn.shopify.com/s/files/1/1111/2222/3333/files/heartside-checkout-11111111-2222-4333-8444-555555555555.jpg?v=1';
 const attributes=[{key:'_customization_id',value:'browser-design'},{key:'_tib_design_link_1',value:'https://example.invalid/design.png'},{key:'_hs_checkout_image',value:image},{key:'Dog name',value:'Test dog'}];
 const design={kind:'design',id:'gid://shopify/CartLine/design-1',key:'123:bundle-1',childId:'gid://shopify/CartLine/design-1-child',childKey:'123:native',quantity:setup.designQuantity||2};
 const ordinary={kind:'ordinary',id:'gid://shopify/CartLine/ordinary',key:'456:ordinary',quantity:1};
 const server=window.__server={cartId,lines:setup.serverOrder.map(kind=>kind==='design'?design:ordinary),renders:0,requests:[],updates:[],errors:[],aborts:[],next:1,addGate:null,addMode:'ok'};
 if(setup.record)sessionStorage.setItem('heartside.quantity.pending.v1',JSON.stringify(setup.record));
 const esc=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
 const row=(line,index)=>{
  const n=index+1,data=line.kind==='design'
   ?{key:line.key,variant_id:123,quantity:1,properties:{_hs_checkout_image:null,_customization_image:null},item_components:[{key:line.childKey,variant_id:123,quantity:line.quantity,properties:{_hs_checkout_image:image,_customization_image:null}}]}
   :{key:line.key,variant_id:456,quantity:line.quantity,properties:{_hs_checkout_image:null,_customization_image:null},item_components:[]};
  return `<tr ref="cartItemRows[]" data-kind="${line.kind}" data-key="${esc(line.key)}" data-hs2-cart-line="${esc(JSON.stringify(data))}" data-hs2-quantity-key="${line.kind==='design'?esc(line.childKey):''}"><td><div class="cart-items__quantity-controls"><cart-quantity-selector-component ref="quantitySelectors[]"><button type="button" name="minus">-</button><input type="number" value="${line.quantity}"><button type="button" name="plus">+</button></cart-quantity-selector-component><button class="button cart-items__remove" type="button">Remove</button></div></td><td class="hidden" ref="cartItemErrorContainer-${n}"><small ref="cartItemError-${n}"></small></td></tr>`;
 };
 window.__renderDom=(lines=setup.domOrder?setup.domOrder.map(kind=>kind==='design'?design:ordinary):server.lines)=>{
  document.querySelector('cart-items-component').innerHTML=`<table><tbody>${lines.map(row).join('')}</tbody></table>`;
  document.getElementById('summary').innerHTML='<form id="cart-form" action="/cart" method="post"><button type="submit" name="checkout">Check out</button></form><a id="checkout-link" href="/checkout">Checkout</a><shopify-accelerated-checkout-cart></shopify-accelerated-checkout-cart>';
 };
 window.__renderSection=async()=>{server.renders++;await new Promise(resolve=>setTimeout(resolve,0));window.__renderDom(server.lines);};
 const cart=()=>({id:cartId,lines:{pageInfo:{hasNextPage:false},nodes:server.lines.map(line=>line.kind==='design'
  ?{id:line.id,quantity:1,attributes:[],merchandise:{id:variant},viewKey:line.key,lineComponents:[{id:line.childId,viewKey:line.childKey,quantity:line.quantity,attributes,merchandise:{id:variant}}]}
  :{id:line.id,quantity:line.quantity,attributes:[],merchandise:{id:'gid://shopify/ProductVariant/456'},viewKey:line.key})}});
 const json=body=>new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json'}});
 window.fetch=async(url,init={})=>{
  const path=new URL(url,location.href).pathname;
  if(path==='/api/2026-07/graphql.json')return json({data:{cart:cart()}});
  if(path==='/cart/change.js'){
   const body=JSON.parse(init.body);server.requests.push(body);
   const index='id' in body?server.lines.findIndex(line=>line.key===body.id):body.line-1,target=server.lines[index];
   if(target){if(body.quantity===0)server.lines.splice(index,1);else target.quantity=body.quantity;}
   return json({item_count:server.lines.length,items:[]});
  }
  throw new Error('Unexpected request '+path);
 };
 window.Shopify={actions:{
  getCart:async()=>({cart:{id:cartId}}),
  async updateCart(payload){
   server.updates.push(JSON.parse(JSON.stringify(payload)));
   // Like the real action, announce the mutation synchronously with a promise for its result.
   let settle;const event=new Event('shopify:cart:lines-update');event.promise=new Promise(resolve=>settle=resolve);document.dispatchEvent(event);
   const line=payload.lines[0];
   if(line.id)server.lines=server.lines.filter(entry=>entry.id!==line.id);
   else{
    if(server.addGate)await server.addGate;
    if(server.addMode==='reject'){settle({detail:{}});return {userErrors:[{message:'Unavailable'}]};}
    const n=++server.next;server.lines.push({kind:'design',id:'gid://shopify/CartLine/design-'+n,key:'123:bundle-'+n,childId:'gid://shopify/CartLine/design-'+n+'-child',childKey:'123:native-'+n,quantity:line.quantity});
   }
   settle({detail:{}});return {};
  },
 }};
 document.addEventListener('cart:error',event=>server.errors.push(event.detail?.error||''));
}

let browser;
before(async()=>{browser=await chromium.launch({headless:true});},{timeout:90000});
after(async()=>{await browser?.close();},{timeout:90000});
for(const minified of [false,true]){
const mode=minified?'minified':'source';
async function open(setup){
 const tab=await browser.newPage();
 await tab.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/cart')return route.fulfill({contentType:'text/html',body:page});
  if(url.pathname.startsWith('/assets/'))return route.fulfill({contentType:'text/javascript',body:asset(url.pathname.slice(8),minified)});
  if(url.pathname.startsWith('/stubs/'))return route.fulfill({contentType:'text/javascript',body:stubs[url.pathname.slice(7)]});
  return route.abort();
 });
 await tab.addInitScript(fakeStore,setup);
 await tab.goto('https://shop.example/cart');
 await tab.waitForFunction(()=>window.__ready&&customElements.get('cart-items-component'));
 return tab;
}
// Fires the quantity selector event exactly as the theme's selector does, from inside a row.
const changeRow=(tab,kind,quantity)=>tab.evaluate(async({kind,quantity})=>{
 const {QuantitySelectorUpdateEvent}=await import('/stubs/events.js');
 const rows=[...document.querySelectorAll('[ref="cartItemRows[]"]')],index=rows.findIndex(row=>row.dataset.kind===kind);
 rows[index].querySelector('input').dispatchEvent(new QuantitySelectorUpdateEvent(quantity,index+1));
},{kind,quantity});
const settle=tab=>tab.evaluate(async()=>{for(let i=0;i<3;i++){await Promise.all(customElements.get('cart-items-component').pendingQuantityUpdates);await new Promise(requestAnimationFrame);}});
const controls=tab=>tab.evaluate(()=>{
 const pick=selector=>[...document.querySelectorAll(selector)].map(el=>({disabled:!!el.disabled,inert:el.inert}));
 return {ordinary:pick('[data-kind="ordinary"] .cart-items__quantity-controls :is(input,button)'),checkout:pick('[name="checkout"],shopify-accelerated-checkout-cart'),banner:document.getElementById('hs-quantity-recovery')?.querySelector('p')?.textContent??null};
});
const record={version:1,phase:'removed',cartHash:'not-this-cart',othersHash:'x',original:{merchandise:{id:'gid://shopify/ProductVariant/123'},attributes:[],quantity:2},desiredQuantity:3};

test(mode+': 3: an ordinary row changes by line key, so a stale row position never removes the re-added design',{timeout:30000},async()=>{
 const tab=await open({serverOrder:['ordinary','design'],domOrder:['design','ordinary']});
 try{
  await changeRow(tab,'ordinary',0);await settle(tab);
  const server=await tab.evaluate(()=>window.__server);
  assert.equal(server.requests.length,1);
  assert.equal(server.requests[0].id,'456:ordinary');assert.equal('line' in server.requests[0],false);
  assert.deepEqual(server.lines.map(line=>line.kind),['design']);
 }finally{await tab.close();}
});

test(mode+': 3: ordinary quantity controls are disabled and refused while a recovery record is pending, and return after it resolves',{timeout:30000},async()=>{
 // a design only ever comes down (one unit per design, 28 Oct), so the repair is driven 4 -> 3
 const tab=await open({serverOrder:['design','ordinary'],designQuantity:4});
 try{
  await tab.evaluate(()=>{window.__server.addMode='reject';});
  await changeRow(tab,'design',3);await settle(tab);
  assert.equal(JSON.parse(await tab.evaluate(()=>sessionStorage.getItem('heartside.quantity.pending.v1'))).phase,'removed');
  let state=await controls(tab);
  assert.ok(state.ordinary.length===4&&state.ordinary.every(control=>control.disabled),'ordinary controls disabled after the re-render');
  await changeRow(tab,'ordinary',0);
  await tab.evaluate(()=>document.querySelector('cart-items-component').onLineItemRemove(1));
  await settle(tab);
  const server=await tab.evaluate(()=>window.__server);
  assert.equal(server.requests.length,0);assert.deepEqual(server.lines.map(line=>line.kind),['ordinary']);
  assert.equal(await tab.evaluate(()=>document.querySelectorAll('[data-kind="ordinary"]').length),1);
  assert.match(await tab.evaluate(()=>document.querySelector('[ref="cartItemError-1"]').textContent),/Finish the saved quantity change first/);
  await tab.evaluate(async()=>{window.__server.addMode='ok';await window.HSCartQuantity.recover(window.__server.cartId,'restore');});
  state=await controls(tab);
  assert.ok(state.ordinary.every(control=>!control.disabled&&!control.inert),'ordinary controls return');
  assert.ok(state.checkout.every(control=>!control.disabled&&!control.inert));assert.equal(state.banner,null);
 }finally{await tab.close();}
});

test(mode+': 4: an overlapping change cannot release another operation, abort its render or start a competing one',{timeout:30000},async()=>{
 const tab=await open({serverOrder:['design','ordinary'],designQuantity:4});
 try{
  await tab.evaluate(()=>{window.__server.addGate=new Promise(resolve=>window.__releaseAdd=resolve);});
  await changeRow(tab,'design',3);
  await tab.waitForFunction(()=>window.__server.updates.length===2);
  // Keyboard repeats on both rows, and a direct call that skips row validation.
  await changeRow(tab,'design',2);await changeRow(tab,'ordinary',0);
  await tab.evaluate(()=>document.querySelector('cart-items-component').updateQuantity({line:2,quantity:5,action:'change'}));
  await tab.evaluate(()=>new Promise(resolve=>setTimeout(resolve,50)));
  let server=await tab.evaluate(()=>window.__server);
  assert.equal(server.renders,0);assert.equal(server.requests.length,0);
  const abortsBefore=server.aborts.length;
  await tab.evaluate(()=>window.__releaseAdd());await settle(tab);
  server=await tab.evaluate(()=>window.__server);
  assert.equal(server.renders,1,'only the owning operation renders');
  assert.equal(server.aborts.length,abortsBefore);
  assert.equal(server.errors.some(error=>/not confirmed/.test(error)),false);
  assert.equal(server.updates.length,2);
  assert.deepEqual(server.lines.map(line=>[line.kind,line.quantity]),[['ordinary',1],['design',3]]);
  assert.equal(await tab.evaluate(()=>sessionStorage.getItem('heartside.quantity.pending.v1')),null);
 }finally{await tab.close();}
});

test(mode+': 6: a design never goes above one: Shopify\'s checkout merge doubled it (28 Oct)',{timeout:30000},async()=>{
 const tab=await open({serverOrder:['design','ordinary'],designQuantity:1});
 try{
  await changeRow(tab,'design',2);await settle(tab);
  const server=await tab.evaluate(()=>window.__server);
  assert.equal(server.updates.length,0,'nothing removed, nothing added');
  assert.deepEqual(server.lines.map(line=>[line.kind,line.quantity]),[['design',1],['ordinary',1]]);
  assert.ok(server.errors.some(error=>/Each design is one gift/.test(error)),JSON.stringify(server.errors));
 }finally{await tab.close();}
});

test(mode+': 5: the checkout gate survives section renders, morph attribute loss and history restores, and blocks middle click',{timeout:30000},async()=>{
 const tab=await open({serverOrder:['design','ordinary'],record});
 try{
  const blocked=async()=>{const state=await controls(tab);return state.checkout.length===2&&state.checkout.every(control=>control.inert)&&state.ordinary.every(control=>control.disabled)&&(await tab.evaluate(()=>document.querySelector('[name="checkout"]').disabled));};
  // Bubble-phase recorder: it only runs when the gate let the event through, and it stops navigation.
  await tab.evaluate(()=>{for(const type of ['click','auxclick'])document.addEventListener(type,event=>{if(event.target.id!=='checkout-link')return;window.__seen.push(event.defaultPrevented);event.preventDefault();});});
  const clicks=()=>tab.evaluate(()=>{
   window.__seen=[];const link=document.getElementById('checkout-link');
   link.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,button:0}));
   link.dispatchEvent(new MouseEvent('auxclick',{bubbles:true,cancelable:true,button:1}));
   return window.__seen;
  });
  assert.ok(await blocked());
  const banner=(await controls(tab)).banner;
  assert.equal(banner,'Finish this change before checkout. Your design is saved in this tab.');
  assert.doesNotMatch(banner,/paused|!|\u2014/);
  assert.deepEqual(await clicks(),[],'click and middle click never reach the link');
  await tab.evaluate(()=>window.__renderSection());await settle(tab);
  assert.ok(await blocked(),'gate re-applied after a section render');
  assert.equal((await controls(tab)).banner,'Finish this change before checkout. Your design is saved in this tab.');
  await tab.evaluate(()=>{for(const el of document.querySelectorAll('[name="checkout"],shopify-accelerated-checkout-cart,.cart-items__quantity-controls :is(input,button)')){el.disabled=false;el.inert=false;el.removeAttribute('data-hs-quantity-disabled');}});
  await settle(tab);
  assert.ok(await blocked(),'gate re-applied after a morph strips attributes');
  await tab.evaluate(()=>{sessionStorage.removeItem('heartside.quantity.pending.v1');window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
  await settle(tab);
  let state=await controls(tab);
  assert.ok(state.checkout.every(control=>!control.inert)&&state.ordinary.every(control=>!control.disabled));assert.equal(state.banner,null);
  assert.deepEqual(await clicks(),[false,false],'nothing is blocked once resolved');
  await tab.evaluate(record=>{sessionStorage.setItem('heartside.quantity.pending.v1',JSON.stringify(record));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));},record);
  await settle(tab);
  assert.ok(await blocked(),'a history restore re-applies the gate');
 }finally{await tab.close();}
});
}
