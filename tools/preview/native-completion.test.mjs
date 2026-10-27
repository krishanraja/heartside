import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const root=new URL('../../',import.meta.url);
const source=process.env.HS_COMPLETION_BASELINE?execFileSync('git',['show',process.env.HS_COMPLETION_BASELINE+':shopify/assets/hs2.js'],{cwd:root,encoding:'utf8'}):readFileSync(new URL('shopify/assets/hs2.js',root),'utf8');
const section=name=>{const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1);return source.slice(start,source.indexOf('\n  function ',start+1));};
const run=(names,ctx,minified)=>{const code=names.filter(name=>source.includes('  function '+name+'(')).map(section).join('\n');vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,ctx);};
function lifecycle(minified,native=true){
 let now=0,sourceUrl='before',photo='before',status='waiting',updates=0;const timers=[],observers=[];
 const stored=new Map([['hs2-blanket-upload:7',JSON.stringify({before:'before'})]]);
 class Observer{constructor(fn){this.fn=fn;this.active=true;observers.push(this);}observe(target,options){this.options=options;}disconnect(){this.active=false;}}
 const update=()=>{updates++;status=ctx.blanketUploadPending()?'waiting':'saved';};
 const ctx={window:{MutationObserver:Observer,sessionStorage:{getItem:key=>stored.get(key)||null,removeItem:key=>stored.delete(key)}},MutationObserver:Observer,document:{body:{},querySelector:selector=>selector==='.vm--container'?null:selector==='.tee-field--photo .tee-photo-image'?{getAttribute:()=>photo}:{},getElementById:()=>({}),addEventListener:()=>{}},nativeBlanketPurchase:()=>native,productId:()=>7,cityArtSource:()=>sourceUrl,setTimeout:(fn,ms)=>timers.push({at:now+ms,fn}),editDetails:()=>{},runBridge:()=>{},tibGallery:()=>{},handoff:update,updateBlanketPurchaseStatus:update,relabelOptions:()=>{},unfoldInvalid:()=>{},giftLabels:()=>{},giftFit:()=>{},swatchTib:()=>{},bridge:{}};
 run(['blanketUploadPending','watchBlanketCompletion','teeinblue'],ctx,minified);ctx.teeinblue();
 const advance=until=>{let timer;while((timer=timers.filter(t=>t.at<=until).sort((a,b)=>a.at-b.at)[0])){timers.splice(timers.indexOf(timer),1);now=timer.at;timer.fn();}now=until;};
 const emit=record=>observers.filter(o=>o.active&&(record.type==='attributes'?o.options.attributes:o.options.childList)).forEach(o=>o.fn([record]));
 return {advance,emit,finish:()=>{sourceUrl=photo='generated';},status:()=>status,updates:()=>updates,stored};
}
for(const minified of [false,true]){
 const mode=minified?'minified':'source';
 test(mode+': saved placement clears pending after the general observer expires at 60 seconds',()=>{
  const app=lifecycle(minified);app.advance(61000);app.finish();
  const modal={nodeType:1,matches:()=>true,querySelector:()=>null};
  app.emit({type:'childList',addedNodes:[],removedNodes:[modal]});app.advance(61200);
  assert.equal(app.status(),'saved');assert.equal(app.stored.has('hs2-blanket-upload:7'),false);
 });
 test(mode+': late image attributes settle without vendor events and own UI mutations do not loop',()=>{
  const app=lifecycle(minified);app.advance(180000);app.finish();
  app.emit({type:'attributes',target:{matches:()=>true}});app.advance(180200);assert.equal(app.status(),'saved');
  const settled=app.updates();app.emit({type:'attributes',target:{matches:()=>false}});app.emit({type:'childList',addedNodes:[{nodeType:3}],removedNodes:[]});app.advance(181000);assert.equal(app.updates(),settled);
 });
 test(mode+': non-blanket pages retain the existing bounded observer lifetime',()=>{
  const app=lifecycle(minified,false);app.advance(61000);app.finish();app.emit({type:'childList',addedNodes:[],removedNodes:[{nodeType:1,matches:()=>true}]});app.advance(61200);assert.equal(app.status(),'waiting');
 });
 test(mode+': cart drawer and cart-page note do not promise unverified free shipping',()=>{
  const note={tagName:'SMALL',textContent:'Free US shipping. Taxes calculated at checkout.',querySelector:()=>null};
  const ctx={window:{},document:{querySelectorAll:selector=>selector.startsWith('.cart-items__table-row')?[]:[note],querySelector:()=>({})}};
  run(['cartTidy'],ctx,minified);ctx.cartTidy();assert.equal(note.textContent,'Shipping and taxes calculated at checkout.');
 });
}
