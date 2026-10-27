import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';
const source=process.env.HS_PORTRAIT_BASELINE?execFileSync('git',['show',process.env.HS_PORTRAIT_BASELINE+':shopify/assets/hs2.js'],{cwd:new URL('../../',import.meta.url),encoding:'utf8'}):readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
const section=name=>{const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1);return source.slice(start,source.indexOf('\n  function ',start+1));};
const rules=source.slice(source.indexOf('  var TIB_RULES ='),source.indexOf('  var bridge ='));
// Shape read from the actual native portrait on27Oct and artwork1378371. No Signed input:
// form-only dog209591 populates visible signature501370 with 'Love, {{value}}'.
const html=`<!doctype html><main id="buy" data-hs2-artwork-kind="print" data-hs2-purchase-enabled="true">
<div class="tee-field"><div class="tee-field__heading"><span>City</span></div><input type="text" name="layer-842906" value=""></div>
<div class="tee-field tee-field--photo"><div class="tee-field__heading"><span>Photo</span></div><input type="file" name="layer-747218"></div>
<div class="tee-field"><div class="tee-field__heading"><span>Dog's name</span></div><input type="text" name="layer-209591" value="Mowgli"></div>
<div class="tee-field"><div class="tee-field__heading"><span>Your note</span></div><input type="text" name="layer-109349" value="Your spot is our spot."></div>
<svg><g id="artwork-layer--layer-109349"><text opacity="1"><tspan>Your spot is our spot.</tspan></text></g><g id="artwork-layer--layer-501370"><text opacity="1"><tspan>Love, Mowgli</tspan></text></g></svg></main>`;
for(const minified of [false,true]) test(`${minified?'minified':'source'}: real portrait field shape proves dog-derived signature without a Signed input`,async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();await page.route('**/*',r=>r.abort());await page.setContent(html);
  const code=rules+['tibFields','mugArtworkValue','nativePurchaseReady'].map(section).join('\n')+`\nvar expected={dog:'Mowgli',line4:'Your spot is our spot.',signed:'Love, Mowgli'};function answer(k){return expected[k];}function mugProduct(){return false;}function nativeArtworkPurchase(){return true;}`;
  await page.addScriptTag({content:minified?transformSync(code,{minify:true}).code:code});
  const results=await page.evaluate(()=>{
   const out=[];out.push(tibFields().map(f=>f.rule.k));out.push(nativePurchaseReady());
   const dog=document.querySelector('[name="layer-209591"]'),note=document.querySelector('[name="layer-109349"]'),sig=document.querySelector('#artwork-layer--layer-501370 tspan');
   sig.textContent='Love, Milo';out.push(nativePurchaseReady());sig.textContent='Love, Mowgli';
   dog.value='Other dog';out.push(nativePurchaseReady());dog.value='Mowgli';
   expected.signed='Élodie';out.push(nativePurchaseReady());expected.signed='Love, Mowgli';
   note.value='Changed without rendered proof';out.push(nativePurchaseReady());note.value=expected.line4;
   sig.closest('text').setAttribute('opacity','0');out.push(nativePurchaseReady());sig.closest('text').setAttribute('opacity','1');
   out.push(nativePurchaseReady());document.querySelector('#buy').dataset.hs2PurchaseEnabled='false';out.push(nativePurchaseReady());
   return out;
  });
  assert.deepEqual(results,[['city','dog','line4'],true,false,false,false,false,false,true,false]);
 }finally{await browser.close();}
});
