import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';
const source=readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
const helper=readFileSync(new URL('../../shopify/assets/hs-checkout-image.js',import.meta.url),'utf8');
const section=name=>{const start=source.indexOf('  function '+name+'(');return source.slice(start,source.indexOf('\n  function ',start+1));};
const transport=['hsProps','withHsProps','checkoutImageConfig','checkoutImageStatus','prepareCheckoutCart','onCartAdd'].map(section).join('\n');
const id='12345678-1234-1234-1234-123456789abc',prefix='https://cdn.shopify.com/s/files/1/1111/2222/3333/files/';
const properties={_customization_id:id,_customization_image:'https://preview.example/existing.jpg',_tib_design_link_1:'https://preview.example/design.png',_tib_fulfilled_sku:'native-sku',_tib_campaign_id:'campaign',_tib_product_id:'product',"Dog's name":'Test dog','Your note':'Exact note'};
let browser;
before(async()=>{browser=await chromium.launch({headless:true});},{timeout:90000});
after(async()=>{await browser?.close();},{timeout:90000});
for(const minified of [false,true])for(const api of ['fetch','xhr']){
  test(`${minified?'minified':'source'} Chromium ${api}: waits, retains native cart, and recovers without another upload`,{timeout:30000},async()=>{
    let release,page;
    try{
      page=await browser.newPage();const requests=[];let calls=0,entered;
      await page.context().addCookies([{name:'storefront_digest',value:'synthetic-test-session',url:'https://shop.example'}]);
      const enteredPromise=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
      await page.route('**/*',async route=>{
        const url=new URL(route.request().url());
        if(url.pathname==='/products/gift')return route.fulfill({contentType:'text/html',body:`<div id="buy" data-hs2-checkout-image-enabled="true" data-hs2-checkout-image-endpoint="/apps/checkout-image" data-hs2-checkout-image-cdn-prefix="${prefix}"></div><input data-hs2-variant-id value="123"><p data-hs2-checkout-image-status hidden></p>`});
        if(url.pathname==='/apps/checkout-image'){
          requests.push({kind:'register',data:route.request().postDataJSON(),query:Object.fromEntries(url.searchParams)});calls++;
          if(calls===1){entered();await gate;return route.fulfill({status:503,contentType:'application/json',body:'{"state":"error"}'});}
          const imageUrl=prefix+'art.jpg?v=1';return route.fulfill({contentType:'application/json',body:JSON.stringify({state:'ready',customizationId:id,variantId:'123',fileId:'gid://shopify/MediaImage/1',imageUrl,properties:{_hs_checkout_image:imageUrl,_hs_checkout_parent:'true',_hs_checkout_bundle_id:id+'-123'}})});
        }
        if(url.pathname==='/cart/add.js'){requests.push({kind:'cart',data:route.request().postDataJSON()});return route.fulfill({contentType:'application/json',body:JSON.stringify({id:123,variant_id:123})});}
        return route.abort();
      });
      await page.goto('https://shop.example/products/gift');
      const preamble=`function restoredArtworkChosen(){return false;}function nativeArtworkPurchase(){return true;}function blanketReviewKey(){return 'saved-art';}function answer(){return 'Exact words';}function cityArtSaved(){return true;}function blanketReviewAccepted(){return true;}function nativePurchaseReady(){return true;}function blanketUploadPending(){return false;}`;
      const code=preamble+'\n'+helper+'\n'+transport+'\nonCartAdd(function(){});';
      await page.addScriptTag({content:minified?transformSync(code,{minify:true}).code:code});
      await page.evaluate(({api,properties})=>{
        window.startAdd=()=>{
          const body=JSON.stringify({id:123,quantity:1,properties});
          if(api==='fetch')return fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body}).then(r=>r.ok?'ok':'error',()=> 'error');
          return new Promise(resolve=>{const x=new XMLHttpRequest();x.open('POST','/cart/add.js');x.setRequestHeader('Content-Type','application/json');x.onload=()=>resolve('ok');x.onerror=()=>resolve('error');x.send(body);});
        };window.firstAdd=window.startAdd();
      },{api,properties});
      await enteredPromise;
      assert.equal(requests.filter(r=>r.kind==='cart').length,0);
      assert.deepEqual(requests[0].query,{customizationId:id,variantId:'123'});
      release();assert.equal(await page.evaluate(()=>window.firstAdd),'error');
      assert.match(await page.evaluate(()=>document.cookie),/storefront_digest=synthetic-test-session/);
      assert.match(await page.locator('[data-hs2-checkout-image-status]').innerText(),/do not need to upload/);
      assert.equal(await page.evaluate(()=>window.startAdd()),'ok');
      assert.equal(requests.filter(r=>r.kind==='register').length,2);
      const carts=requests.filter(r=>r.kind==='cart');assert.equal(carts.length,1);
      assert.deepEqual(requests[0].data,{customizationId:id,variantId:'123'});
      for(const[k,v]of Object.entries(properties))assert.equal(carts[0].data.properties[k],v);
      assert.equal(carts[0].data.id,123);assert.equal(carts[0].data.properties._hs_checkout_bundle_id,id+'-123');
      assert.equal(carts[0].data.properties._hs_checkout_parent,'true');
    }finally{if(release)release();if(page)await page.unrouteAll({behavior:'ignoreErrors'});}
  });
}
