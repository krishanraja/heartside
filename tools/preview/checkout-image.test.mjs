import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const helper=readFileSync(new URL('../../shopify/assets/hs-checkout-image.js',import.meta.url),'utf8');
const source=readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
const uuid='12345678-1234-1234-1234-123456789abc';
const prefix='https://cdn.shopify.com/s/files/1/1111/2222/3333/files/';
const props={_customization_id:uuid,_customization_image:'https://preview.example/existing.jpg',_tib_design_link_1:'https://preview.example/design.png',_tib_fulfilled_sku:'supplier-variant',_tib_campaign_id:'campaign',_tib_product_id:'product',"Dog's name":'Test dog','Your note':'Exact < & words'};
const line=(id=123)=>({id,quantity:1,properties:{...props}});
const ready=(id='123')=>({state:'ready',customizationId:uuid,variantId:id,fileId:'gid://shopify/MediaImage/123',imageUrl:prefix+'art.jpg?v=123',properties:{_hs_checkout_image:prefix+'art.jpg?v=123',_hs_checkout_parent:'true',_hs_checkout_bundle_id:uuid+'-'+id}});
const response=(data,status=200)=>({status,json:async()=>data});
const section=name=>{const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1);return source.slice(start,source.indexOf('\n  function ',start+1));};
const tick=()=>new Promise(r=>setImmediate(r));
// the add line clears itself after a minute; that timer must not hold the test process open
const later=(f,ms)=>{const t=setTimeout(f,ms);if(ms>=60000)t.unref();return t;};
for(const minified of [false,true]) {
  const mode=minified?'minified':'source';
  const getHelper=()=>{
    const window={location:{href:'https://shop.example/products/gift'}};
    vm.runInNewContext(minified?transformSync(helper,{minify:true}).code:helper,{window,URL,AbortController,setTimeout:(f,ms)=>setTimeout(f,ms>=8000?30:0),clearTimeout});
    return window.HSCheckoutImage;
  };
  const options=fetch=>({endpoint:'/apps/checkout-image',cdnPrefix:prefix,fetch});
  test(mode+': registers only customization and variant, preserves all eight native properties and cart data',async()=>{
    const original={items:[line()],sections:'cart-drawer',sections_url:'/products/gift'};let call;
    const out=JSON.parse(await getHelper().prepare(JSON.stringify(original),options(async(url,init)=>{call={url,init};return response(ready());})));
    assert.deepEqual(JSON.parse(call.init.body),{customizationId:uuid,variantId:'123'});
    assert.equal(new URL(call.url).searchParams.get('customizationId'),uuid);assert.equal(new URL(call.url).searchParams.get('variantId'),'123');
    assert.equal(call.init.method,'POST');assert.equal(call.init.cache,'no-store');assert.equal(call.init.credentials,'same-origin');
    for(const [k,v]of Object.entries(props))assert.equal(out.items[0].properties[k],v);
    assert.equal(out.items[0].id,123);assert.equal(out.items[0].quantity,1);assert.equal(out.sections,'cart-drawer');
    assert.equal(out.items[0].properties._hs_checkout_image,ready().imageUrl);
    assert.equal(out.items[0].properties._hs_checkout_parent,'true');assert.equal(out.items[0].properties._hs_checkout_bundle_id,uuid+'-123');
    assert.equal(Object.keys(out.items[0].properties).length,11);
  });
  test(mode+': same customization on separate variants gets separate bundle identity',async()=>{
    const out=JSON.parse(await getHelper().prepare(JSON.stringify({items:[line(123),line(456)]}),options(async(_,i)=>response(ready(JSON.parse(i.body).variantId)))));
    assert.notEqual(out.items[0].properties._hs_checkout_bundle_id,out.items[1].properties._hs_checkout_bundle_id);
  });
  test(mode+': pending polls before ready and a perpetual pending result stops after twelve requests',async()=>{
    let count=0;
    await getHelper().prepare(JSON.stringify(line()),options(async()=>++count===1?response({state:'pending',retryAfterSeconds:3},202):response(ready())));
    assert.equal(count,2);count=0;
    await assert.rejects(getHelper().prepare(JSON.stringify(line()),options(async()=>{count++;return response({state:'pending',retryAfterSeconds:5},202);})),/try Add to cart again/);
    assert.equal(count,12);
  });
  // 28 Oct, Recording 4: the redo's add failed on the first 503 while Teeinblue was still serving its copy
  test(mode+': 503 preview_unavailable right after painting waits inside the same budget and never uploads',async()=>{
    let count=0;const pending=[];
    const out=JSON.parse(await getHelper().prepare(JSON.stringify(line()),{...options(async(url,init)=>{count++;assert.deepEqual(JSON.parse(init.body),{customizationId:uuid,variantId:'123'});return count===1?response({state:'error',code:'preview_unavailable'},503):response(ready());}),onPending:n=>pending.push(n)}));
    assert.equal(count,2);assert.equal(out.properties._hs_checkout_image,ready().imageUrl);assert.deepEqual(pending,[1]);
    count=0;
    await assert.rejects(getHelper().prepare(JSON.stringify(line()),options(async()=>{count++;return response({state:'error',code:'preview_unavailable'},503);})),/does not need another upload/);
    assert.equal(count,12,'the same twelve-request budget');
    count=0;await assert.rejects(getHelper().prepare(JSON.stringify(line()),options(async()=>{count++;return response({state:'error',code:'other'},503);})));assert.equal(count,1,'any other 503 still fails at once');
  });
  test(mode+': slow saved artwork reaches the cart without another buyer tap',async()=>{
    let count=0;
    const out=JSON.parse(await getHelper().prepare(JSON.stringify(line()),options(async()=>++count<=6?response({state:'error',code:'preview_unavailable'},503):response(ready()))));
    assert.equal(count,7);
    assert.equal(out.properties._hs_checkout_image,ready().imageUrl);
    assert.equal(out.properties._customization_id,uuid);
  });
  test(mode+': service errors, malformed JSON, hanging body, wrong identity and foreign CDN never become ready',async()=>{
    const bad=[async()=>response({},503),async()=>({status:200,json:async()=>{throw Error('HTML');}}),async()=>({status:200,json:()=>new Promise(()=>{})}),async()=>response({...ready(),variantId:'456'}),async()=>response({...ready(),fileId:null}),async()=>response({...ready(),imageUrl:'https://cdn.shopify.com/s/files/1/4444/5555/6666/files/art.jpg'}),async()=>response({...ready(),properties:{...ready().properties,_hs_checkout_parent:'false'}}),async()=>response({state:'pending',retryAfterSeconds:0},202)];
    for(const fetch of bad)await assert.rejects(getHelper().prepare(JSON.stringify(line()),options(fetch)),/does not need another upload/);
  });
  test(mode+': invalid configuration and native payload fail without sending registration',async()=>{
    let calls=0;const opts=options(async()=>{calls++;return response(ready());});
    for(const body of ['invalid',JSON.stringify({id:123,properties:{}}),JSON.stringify({items:[]})])await assert.rejects(getHelper().prepare(body,opts));
    await assert.rejects(getHelper().prepare(JSON.stringify(line()),{...opts,endpoint:'http://register.example'}));
    await assert.rejects(getHelper().prepare(JSON.stringify(line()),{...opts,endpoint:'https://register.example/apps/checkout-image'}));
    await assert.rejects(getHelper().prepare(JSON.stringify(line()),{...opts,endpoint:'/arbitrary-endpoint'}));
    await assert.rejects(getHelper().prepare(JSON.stringify(line()),{...opts,cdnPrefix:''}));
    assert.equal(calls,0);
  });
  function transport({enabled=true,prepare=async b=>b,button=false}={}) {
    let art='same-art',variant='123',accepted=true,note='Exact words';
    const calls=[],status={textContent:'',hidden:true},nodes={},tracked=[];
    // Teeinblue's Add to cart, with the line hs2 puts right after it
    const atc=button?{nextSibling:null,parentNode:{insertBefore(n,ref){n.after=atc;atc.nextSibling=n;nodes.note=n;}}}:null;
    const p=()=>({attrs:{},hidden:false,textContent:'',setAttribute(k,v){this.attrs[k]=v;}});
    const buy={getAttribute:k=>k.endsWith('endpoint')?'https://register.example/art':prefix};
    class XHR {
      constructor(){this.events=[];this.handlers={};this.status=0;}
      open(){this.readyState=1;} abort(){this.readyState=0;}
      send(body){calls.push({xhr:true,body});}
      addEventListener(k,f){this.handlers[k]=f;}
      dispatchEvent(e){this.events.push(e.type);if(this.handlers[e.type])this.handlers[e.type]();}
    }
    const window={fetch:async(...args)=>{calls.push({args});return {ok:true,clone:()=>({json:async()=>({id:123})})};},XMLHttpRequest:XHR,HSCheckoutImage:{prepare}};
    const c={restoredArtworkChosen:()=>false,window,Event,setTimeout:later,clearTimeout,track:(name,data)=>tracked.push([name,data]),document:{querySelector:s=>s.includes('checkout-image-enabled')?(enabled?buy:null):s.includes('checkout-image-status')?status:s.includes('variant-id')?{value:variant}:s.includes('teeAtcButton')?atc:s==='[data-hs2-add-note]'?(nodes.note||null):null,querySelectorAll:()=>[],createElement:p,getElementById:()=>null},nativeArtworkPurchase:()=>true,blanketReviewKey:()=>art,answer:()=>note,cityArtSaved:()=>true,blanketReviewAccepted:()=>accepted,nativePurchaseReady:()=>true,blanketUploadPending:()=>false};
    const code=['hsProps','withHsProps','checkoutImageConfig','checkoutImageStatus','prepareCheckoutCart','onCartAdd'].map(section).join('\n');
    vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,c);c.onCartAdd(()=>{});
    return {window,calls,status,nodes,tracked,c,changeArt:()=>{art='changed';},changeVariant:()=>{variant='456';},changeNote:()=>{note='New words';},uncheck:()=>{accepted=false;}};
  }
  test(mode+': disabled route sends immediately without touching registrar; unrelated fetch is unchanged',async()=>{
    const t=transport({enabled:false,prepare:()=>{throw Error('must not run');}});
    await t.window.fetch('/cart/add.js',{method:'POST',body:JSON.stringify(line())});assert.equal(t.calls.length,1);
    const u=transport({prepare:()=>{throw Error('must not run');}});await u.window.fetch('/cart.js');assert.equal(u.calls.length,1);
  });
  test(mode+': fetch and XHR wait before sending, and repeated add while waiting is rejected',async()=>{
    let resolve;const t=transport({prepare:()=>new Promise(r=>{resolve=r;})});
    const first=t.window.fetch('/cart/add.js',{method:'POST',body:JSON.stringify(line())});await tick();assert.equal(t.calls.length,0);
    await assert.rejects(t.window.fetch('/cart/add.js',{method:'POST',body:JSON.stringify(line())}),/already being prepared/);
    resolve(JSON.stringify(line()));await first;assert.equal(t.calls.length,1);
    const x=new t.window.XMLHttpRequest();x.open('POST','/cart/add.js');x.send(JSON.stringify(line()));await tick();assert.equal(t.calls.length,1);
    resolve(JSON.stringify(line()));await tick();assert.equal(t.calls.length,2);
  });
  test(mode+': failed registration releases XHR with error and explicit retry copy, without any cart request',async()=>{
    const t=transport({prepare:async()=>{throw Error('temporary');}}),x=new t.window.XMLHttpRequest();x.open('POST','/cart/add.js');x.send(JSON.stringify(line()));await tick();
    assert.deepEqual(x.events,['error','loadend']);assert.equal(t.calls.length,0);assert.match(t.status.textContent,/Try Add to cart again/);assert.match(t.status.textContent,/do not need to upload/);
  });
  // 28 Oct: about 30 seconds behind a bare spinner, with the words at the top of the form, out of sight
  test(mode+': the add says what it is doing in one line right after Add to cart, then clears when it lands',async()=>{
    let resolve,pendingWords;const t=transport({button:true,prepare:(b,o)=>new Promise(r=>{resolve=r;pendingWords=o.onPending;})});
    t.c.checkoutImageStatus.dog="Pip's";
    const p=t.window.fetch('/cart/add.js',{method:'POST',body:JSON.stringify(line())});await tick();
    const note=t.nodes.note;assert.ok(note,'a line after the button');assert.equal(note.attrs.role,'status');
    assert.equal(note.textContent,"Getting Pip's picture ready for checkout.");assert.equal(note.hidden,false);
    assert.equal(t.status.hidden,true,'nothing off screen above the form');
    pendingWords(1);assert.equal(note.textContent,'Almost there.');
    resolve(JSON.stringify(line()));await p;await tick();await tick();
    assert.equal(note.hidden,true,'cleared once the add lands');
    assert.equal(t.tracked.length,1);assert.equal(t.tracked[0][0],'add_timing');
    assert.deepEqual(Object.keys(t.tracked[0][1]),['teeinblue_ms','prepare_ms','add_ms']);
    // a failure says so in plain words, beside the button, and never asks for another painting
    const f=transport({button:true,prepare:async()=>{throw Error('temporary');}});f.c.checkoutImageStatus.dog="Pip's";
    await assert.rejects(f.window.fetch('/cart/add.js',{method:'POST',body:JSON.stringify(line())}));
    assert.equal(f.nodes.note.textContent,"That didn't go through. Pip's design is saved, so you do not need to upload a photo again. Try Add to cart again.");
  });
  test(mode+': late preparation cannot send a changed selection or an aborted XHR',async()=>{
    for(const change of ['changeArt','changeVariant','changeNote','uncheck']){
      let resolve;const t=transport({prepare:()=>new Promise(r=>{resolve=r;})});const p=t.window.fetch('/cart/add.js',{body:JSON.stringify(line())});await tick();t[change]();resolve(JSON.stringify(line()));await assert.rejects(p,/selection changed/);assert.equal(t.calls.length,0);
    }
    let resolve;const t=transport({prepare:()=>new Promise(r=>{resolve=r;})}),x=new t.window.XMLHttpRequest();x.open('POST','/cart/add.js');x.send(JSON.stringify(line()));await tick();x.abort();resolve(JSON.stringify(line()));await tick();assert.equal(t.calls.length,0);
  });
}
test('configuration is off by default and helper loads before cart transport',()=>{
  const section=readFileSync(new URL('../../shopify/sections/hs2-product.liquid',import.meta.url),'utf8');
  const schema=JSON.parse(section.split('{% schema %}')[1].split('{% endschema %}')[0]);
  assert.equal(schema.settings.find(s=>s.id==='checkout_image_enabled').default,false);
  const head=readFileSync(new URL('../../shopify/snippets/hs2-head.liquid',import.meta.url),'utf8');
  assert.ok(head.indexOf('hs-checkout-image.js')<head.indexOf("'hs2.js'"));
});
