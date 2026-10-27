import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';
const source=process.env.HS_RESTORED_BASELINE?execFileSync('git',['show',process.env.HS_RESTORED_BASELINE+':shopify/assets/hs2.js'],{cwd:new URL('../../',import.meta.url),encoding:'utf8'}):readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
const section=name=>{const i=source.indexOf('  function '+name+'(');assert.notEqual(i,-1,name);return source.slice(i,source.indexOf('\n  function ',i+1));};
const functions=['cityArtSource','cityArtSaved','restoredArtworkKey','restoredArtworkAvailable','restoredArtworkChosen','updateRestoredArtworkReview','blanketPurchaseStatus','blanketReviewKey','invalidateBlanketReview','blanketReviewAccepted','updateBlanketPurchaseStatus','bindBlanketRecovery','guardGiftPhoto','hsProps','withHsProps'].map(section).join('\n');
let browser;before(async()=>{browser=await chromium.launch({headless:true});});after(async()=>{await browser.close();});
for(const minified of [false,true])test(`${minified?'minified':'source'}: restored native blanket requires explicit exact-design review, preserves identity and invalidates on changed context`,async()=>{
 const page=await browser.newPage();await page.route('**/*',r=>r.abort());
 try{
  const src='https://cdnx.teeinblue.com/r2/customers/uploads/synthetic_large.webp';
  await page.setContent(`<main id="buy" data-hs2-blanket-purchase><div class="tee-field--photo"><img class="tee-photo-image" src="${src}"><input type="file"></div><input id="dog" value="Juniper"><svg><g id="artwork-layer--layer-292294-image-placement"><image href="${src}"></image></g></svg><p data-hs2-artwork-status></p><a data-hs2-artwork-source data-hs2-artwork-layer="layer-292294" hidden></a><label data-hs2-artwork-accept-wrap hidden><input type="checkbox" data-hs2-artwork-accept> I checked this exact artwork</label><button data-hs2-blanket-create>Create</button><details data-hs2-upload-recovery hidden><input type="checkbox" data-hs2-upload-retry-ack><button data-hs2-upload-retry disabled>Retry</button></details><button id="teeAtcButton">Add to cart</button><form id="hs2-product-form"><input name="properties[_hs_art_style]" data-hs2-prop value="Screenprint"><input name="properties[_hs_art_tone]" data-hs2-prop value="Warm"><input name="properties[_hs_art_profile]" data-hs2-prop value='{"version":1,"facts":[]}'></form></main>`);
  const setup=`var revision='initial',latest='',pending=false,ready=true,nativeError=false,blanketAcceptedKey='',usePhoto={},photoURL='',cartAdds=0,uploads=0;
   function nativeArtworkPurchase(){return true;}function cityArtPreview(){return false;}function nativePurchaseReady(){return true;}function giftView(){return false;}
   function productId(){return 123;}function artRequestKey(){return revision;}function artRequested(){return false;}function latestArtRequest(){return latest;}function blanketUploadPending(){return pending;}function nativeBlanketInputsReady(){return ready;}function blanketNativeError(){return nativeError;}
   function answer(k){return k==='dog'?document.querySelector('#dog').value:'';}function tibFields(){return [{rule:{k:'dog'},el:{querySelector:()=>document.querySelector('#dog')}}];}
   function updatePortraitSignatureRecovery(){}function syncBlanketProperties(){}function sendBlanketPhoto(){uploads++;}function markArtRequested(){throw Error('must not fabricate request');}
  `;
  const code=setup+functions+`\nbindBlanketRecovery();guardGiftPhoto();document.querySelector('#teeAtcButton').addEventListener('click',()=>cartAdds++);document.querySelector('input[type=file]').addEventListener('change',()=>uploads++);updateBlanketPurchaseStatus();`;
  await page.addScriptTag({content:minified?transformSync(code,{minify:true}).code:code});
  const review=page.locator('[data-hs2-artwork-accept-wrap]'),button=page.getByRole('button',{name:'Review this saved artwork'});
  assert.equal(await review.isVisible(),false);assert.equal(await button.isVisible(),true);await page.getByRole('button',{name:'Add to cart',exact:true}).click();assert.equal(await page.evaluate(()=>cartAdds),0);
  await button.focus();await page.keyboard.press('Enter');assert.equal(await review.isVisible(),true);assert.equal(await page.locator('[data-hs2-artwork-accept]').isChecked(),false);
  await page.getByRole('button',{name:'Add to cart',exact:true}).click();assert.equal(await page.evaluate(()=>cartAdds),0);
  await page.locator('[data-hs2-artwork-accept]').check();await page.getByRole('button',{name:'Add to cart',exact:true}).click();assert.equal(await page.evaluate(()=>cartAdds),1);
  const props=await page.evaluate(()=>JSON.parse(withHsProps(JSON.stringify({id:123,quantity:1,properties:{_customization_id:'synthetic-id',_tib_design_link_1:'https://example.invalid/existing.png'}}))).properties);
  assert.equal(props._customization_id,'synthetic-id');assert.equal(props._tib_design_link_1,'https://example.invalid/existing.png');assert.equal(props._hs_art_source,'restored-buyer-reviewed');assert.match(props._hs_art_style,/Unverified/);assert.equal(props._hs_art_profile,'');
  await page.evaluate(()=>{revision='changed profile';updateBlanketPurchaseStatus();});assert.equal(await review.isVisible(),false);assert.equal(await button.isVisible(),true);assert.equal(await page.locator('[data-hs2-artwork-accept]').isChecked(),false);
  // Explicitly review again; changing the dog's identity also revokes that choice.
  await button.click();await page.evaluate(()=>{document.querySelector('#dog').value='Other dog';updateBlanketPurchaseStatus();});assert.equal(await review.isVisible(),false);
  for(const condition of ['stale','pending','error','modal','mismatch','choices']){
   await page.evaluate(({condition,src})=>{latest=condition==='stale'?'older-request':'';pending=condition==='pending';nativeError=condition==='error';ready=condition!=='choices';document.querySelector('.vm--container')?.remove();if(condition==='modal'){const el=document.createElement('div');el.className='vm--container';document.body.appendChild(el);}document.querySelector('.tee-photo-image').src=condition==='mismatch'?'https://example.invalid/other.png':src;updateBlanketPurchaseStatus();},{condition,src});
   assert.equal(await button.isVisible(),false,condition);assert.equal(await page.evaluate(()=>cityArtSaved()),false,condition);
  }
  assert.equal(await page.evaluate(()=>uploads),0);
 }finally{await page.close();}
});
