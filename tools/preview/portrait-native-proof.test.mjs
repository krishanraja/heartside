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
<div class="tee-field"><div class="tee-field__heading"><span>Dog's name</span></div><input type="text" name="layer-209591" value="Juniper"></div>
<div class="tee-field"><div class="tee-field__heading"><span>Your note</span></div><input type="text" name="layer-109349" value="Our favourite little walk."></div>
<svg><g id="artwork-layer--layer-109349"><text opacity="1"><tspan>Our favourite little walk.</tspan></text></g><g id="artwork-layer--layer-501370"><text opacity="1"><tspan>Love, Juniper</tspan></text></g></svg></main>`;
for(const minified of [false,true]) test(`${minified?'minified':'source'}: real portrait field shape proves dog-derived signature without a Signed input`,async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();await page.route('**/*',r=>r.abort());await page.setContent(html);
  const code=rules+['tibFields','mugArtworkValue','nativePurchaseReady'].map(section).join('\n')+`\nvar expected={dog:'Juniper',line4:'Our favourite little walk.',signed:'Love, Juniper'};function answer(k){return expected[k];}function mugProduct(){return false;}function nativeArtworkPurchase(){return true;}`;
  await page.addScriptTag({content:minified?transformSync(code,{minify:true}).code:code});
  const results=await page.evaluate(()=>{
   const out=[];out.push(tibFields().map(f=>f.rule.k));out.push(nativePurchaseReady());
   const dog=document.querySelector('[name="layer-209591"]'),note=document.querySelector('[name="layer-109349"]'),sig=document.querySelector('#artwork-layer--layer-501370 tspan');
   sig.textContent='Love, Milo';out.push(nativePurchaseReady());sig.textContent='Love, Juniper';
   dog.value='Other dog';out.push(nativePurchaseReady());dog.value='Juniper';
   expected.signed='With love from your dog';out.push(nativePurchaseReady());expected.signed='Love, Juniper';
   note.value='Changed without rendered proof';out.push(nativePurchaseReady());note.value=expected.line4;
   sig.closest('text').setAttribute('opacity','0');out.push(nativePurchaseReady());sig.closest('text').setAttribute('opacity','1');
   out.push(nativePurchaseReady());document.querySelector('#buy').dataset.hs2PurchaseEnabled='false';out.push(nativePurchaseReady());
   return out;
  });
  assert.deepEqual(results,[['city','dog','line4'],true,false,false,false,false,false,true,false]);
 }finally{await browser.close();}
});

for (const minified of [false,true]) test(`${minified?'minified':'source'}: portrait signature recovery is explicit, keyboard accessible and requires review again`, async()=>{
 const recoveryFunctions=['tibFields','mugArtworkValue','nativePurchaseReady','portraitSignatureChoice','updatePortraitSignatureRecovery'].map(section).join('\n');
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage(); await page.route('**/*',r=>r.abort());
  await page.setContent(html.replace('</main>', '<p data-hs2-artwork-status></p><input type="checkbox" checked data-hs2-artwork-accept></main>'));
  const code=rules+recoveryFunctions+`
   var state={hs3_signature_override:'Always your pal'}, saved=0, rendered=0, invalidated=0;
   function answer(k){return k==='signed'?state.hs3_signature_override:k==='dog'?'Juniper':'Our favourite little walk.';}
   function mugProduct(){return false;} function nativeArtworkPurchase(){return true;}
   function save(){saved++;} function render(){rendered++;}
   function invalidateBlanketReview(){invalidated++;document.querySelector('[data-hs2-artwork-accept]').checked=false;}
  `;
  await page.addScriptTag({content:minified?transformSync(code,{minify:true}).code:code});
  await page.evaluate(()=>{updatePortraitSignatureRecovery();updatePortraitSignatureRecovery();});
  const panel=page.locator('[data-hs2-portrait-signature-recovery]');
  assert.equal(await panel.count(),1);
  assert.match(await panel.textContent(),/saved signature is different/);
  assert.deepEqual(await page.evaluate(()=>[state.hs3_signature_override,saved,rendered,nativePurchaseReady()]),['Always your pal',0,0,false]);
  // A gift switch does not silently rewrite the custom mug signature.
  await page.evaluate(()=>{document.querySelector('#buy').dataset.hs2ArtworkKind='mug';updatePortraitSignatureRecovery();});
  assert.equal(await panel.isVisible(),false);
  assert.equal(await page.evaluate(()=>state.hs3_signature_override),'Always your pal');
  await page.evaluate(()=>{document.querySelector('#buy').dataset.hs2ArtworkKind='print';updatePortraitSignatureRecovery();});
  const button=panel.getByRole('button',{name:'Use "Love, Juniper"'});
  await button.focus(); await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(()=>[state.hs3_signature_override,saved,rendered,invalidated,nativePurchaseReady(),document.querySelector('[data-hs2-artwork-accept]').checked]),['Love, Juniper',1,1,1,true,false]);
  assert.equal(await panel.isVisible(),false);
  // The chosen signature persists into other gifts only after this explicit action.
  await page.evaluate(()=>{document.querySelector('#buy').dataset.hs2ArtworkKind='mug';updatePortraitSignatureRecovery();});
  assert.equal(await page.evaluate(()=>state.hs3_signature_override),'Love, Juniper');
 } finally {await browser.close();}
});
