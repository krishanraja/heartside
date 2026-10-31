import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {transformSync} from 'esbuild';
const source=process.env.HS_AVAILABILITY_BASELINE?execFileSync('git',['show',process.env.HS_AVAILABILITY_BASELINE+':shopify/assets/hs2.js'],{cwd:new URL('../../',import.meta.url),encoding:'utf8'}):readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
const section=name=>{const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1);return source.slice(start,source.indexOf('\n  function ',start+1));};
function run(names,ctx,minified){const code=names.map(section).join('\n');vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,ctx);return ctx;}
for(const minified of [false,true]) {
 const mode=minified?'minified':'source';
 test(mode+': disabled availability survives observer progress updates without hiding upload status',()=>{
  let enabled='false',pending=false;const status={textContent:''};
  const c={updateRestoredArtworkReview(){},answer:()=>'',restoredArtworkAvailable:()=>false,document:{querySelector:s=>s==='#buy[data-hs2-artwork-kind]'?{getAttribute:()=>enabled}:s==='[data-hs2-artwork-status]'?status:null,querySelectorAll:()=>[]},blanketUploadPending:()=>pending,usePhoto:{},nativeBlanketInputsReady:()=>true,cityArtSaved:()=>false,blanketNativeError:()=>false,artRequested:()=>false,latestArtRequest:()=>false};
  run(['possessive','portraitSignatureChoice','updatePortraitSignatureRecovery','blanketPurchaseStatus','artPhase','artWords','artElapsed','artStage','updateBlanketPurchaseStatus'],c,minified);
  c.blanketPurchaseStatus('This gift is not available to order yet.');
  c.updateBlanketPurchaseStatus();
  assert.equal(status.textContent,"This gift is not available to order yet. Add your dog's photo below. Buddy paints from it.");
  pending=true;c.updateBlanketPurchaseStatus();c.updateBlanketPurchaseStatus();
  assert.match(status.textContent,/^This gift is not available to order yet\. Waiting for your artwork/);
  assert.equal((status.textContent.match(/not available/g)||[]).length,1);
  enabled='true';c.updateBlanketPurchaseStatus();assert.doesNotMatch(status.textContent,/not available/);assert.match(status.textContent,/Waiting for your artwork/);
 });
 test(mode+': native mug variant events filter the selected-color pair and follow its featured image',()=>{
  const events={},timers=[],idInput={value:'black'},price={textContent:'$45'},main={src:'black.jpg',alt:'',getAttribute(k){return this[k];},removeAttribute(){}},media={getAttribute:()=> 'photo'};
  const thumbs=['black','dark blue','dark green','pink','red'].flatMap(color=>[0,1].map(index=>({hidden:false,attrs:{'data-hs2-color':color,'data-hs2-thumb':color+'.jpg','data-alt':color},getAttribute(k){return this.attrs[k];},setAttribute(k,v){this.attrs[k]=v;},addEventListener(){}})));
  const buy={classList:{contains:()=>true},querySelector:()=>idInput,addEventListener:(event,fn)=>events[event]=fn};
  const c={document:{getElementById:()=>buy,querySelector:s=>s==='[data-hs2-media]'?media:s==='[data-hs2-price]'?price:s==='[data-hs2-main]'?main:s.startsWith('[data-hs2-thumb="')?thumbs.find(b=>s.includes(b.attrs['data-hs2-thumb'])):null,querySelectorAll:s=>s==='[data-hs2-thumb-preview]'||s==='[data-hs2-vmedia]'?[]:thumbs,addEventListener:(event,fn)=>events[event]=fn},window:{location:{search:'?variant=blue'}},URLSearchParams,setTimeout:fn=>timers.push(fn),swatchTib:()=>{},json:s=>s.includes('prices')?{blue:'$45',red:'$45'}:{blue:{src:'dark blue.jpg',alt:'Mug, dark blue inside: front'},red:{src:'red.jpg',alt:'Mug, red inside: front'}}};
  run(['swapMain','gallery'],c,minified);c.gallery();
  events['teeinblue-event-variant-changed']();while(timers.length)timers.shift()();
  assert.equal(idInput.value,'blue');assert.equal(main.src,'dark blue.jpg');assert.equal(thumbs.filter(b=>!b.hidden).length,2);assert.ok(thumbs.filter(b=>!b.hidden).every(b=>b.attrs['data-hs2-color']==='dark blue'));
  c.window.location.search='?variant=red';events.change({target:{closest:()=>({})}});while(timers.length)timers.shift()();
  assert.equal(idInput.value,'red');assert.equal(main.src,'red.jpg');assert.equal(thumbs.filter(b=>!b.hidden).length,2);assert.ok(thumbs.filter(b=>!b.hidden).every(b=>b.attrs['data-hs2-color']==='red'));
 });
}
