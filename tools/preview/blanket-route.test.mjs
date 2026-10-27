import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source=process.env.HS_BLANKET_ROUTE_BASELINE?execFileSync('git',['show',process.env.HS_BLANKET_ROUTE_BASELINE+':shopify/assets/hs3.js'],{cwd:new URL('../../',import.meta.url),encoding:'utf8'}):readFileSync(new URL('../../shopify/assets/hs3.js',import.meta.url),'utf8');
const section=name=>{const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1);return source.slice(start,source.indexOf('\n  function ',start+1));};
function fixture(minified,flag=true) {
  const saved=new Map();
  const ctx={URL,cfg:{artworkCandidates:true,blanketPurchase:flag,gifts:{mug:{url:'/products/fixture-mug?view=gift&variant=9',price:31},blanket:{url:'/products/new-configured-blanket?view=gift&view=blanket-art-preview&variant=42&keep=yes#art',price:137},print:{url:'/products/fixture-print?view=gift&variant=8',price:92}}},S:{sel:{mug:true,blanket:true,print:true,ornament:true}},GIFTS:['mug','blanket','print','ornament'],GN:{mug:'Mug',blanket:'Blanket',print:'Portrait'},DS:{mug:'Mug description',blanket:'Blanket description',print:'Print description'},shareWithBridge:()=>{},save:()=>{},ui:{},SHORT:{mug:'Mug',blanket:'Blanket',print:'Portrait'},mugColor:()=>({id:123,name:'Black'}),mugSwatches:()=>'',QKEY:'queue',track:()=>{},recGift:()=> 'blanket',esc:String,img:()=>'',lineFor:()=>'',window:{location:{href:'https://example.test/review'},sessionStorage:{setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}}};
  const code=['priceOf','priceLabel','fmt','reviewGifts','blanketPurchaseEnabled','giftPurchasable','multiOK','selectedGifts','selectGift','bundleTier','daysToChristmas','chooseModel','giftDesc','giftPhoto','chooseView','addToCart'].filter(name=>source.includes('  function '+name+'(')).map(section).join('\n');
  vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,ctx);
  let href=ctx.window.location.href;
  Object.defineProperty(ctx.window.location,'href',{get:()=>href,set:value=>{href=new URL(value,href).href;}});
  return {ctx,saved};
}
for(const minified of [false,true]) {
  const mode=minified?'minified':'source';
  test(mode+': core purchase sends each gift to its own address, with no template override',()=>{
    const {ctx,saved}=fixture(minified,false);ctx.cfg.corePurchase=true;
    for(const kind of ['mug','blanket','print']){
      ctx.S.sel={};ctx.selectGift(kind,true);ctx.addToCart();
      const url=new URL(ctx.window.location.href);
      assert.equal(url.searchParams.has('view'),false);assert.equal(saved.has('queue'),false);
      if(kind==='mug') assert.equal(url.searchParams.get('variant'),'123');
    }
    ctx.cfg.corePurchase=false;ctx.selectGift('mug',true);assert.equal(ctx.giftPurchasable('mug'),false);
  });
  test(mode+': core purchase takes several gifts together and queues them through their own pages',()=>{
    const {ctx,saved}=fixture(minified,false);ctx.cfg.corePurchase=true;ctx.S.sel={};
    ctx.selectGift('mug');ctx.selectGift('print');
    assert.deepEqual(Array.from(ctx.selectedGifts()),['mug','print']);
    let html=ctx.chooseView({dog:'Test dog',rec:'Test person'});
    assert.match(html,/Pick one, or a few/);assert.match(html,/Personalize 2 gifts · \$123/);assert.match(html,/Free US shipping on every order\./);
    assert.doesNotMatch(html,/save 15%/,'no saving is shown until the real discount exists');
    ctx.cfg.bundleOffer=true;html=ctx.chooseView({dog:'Test dog',rec:'Test person'});
    assert.match(html,/2 gifts: 15% off, taken at checkout\./);
    ctx.addToCart();
    const queue=JSON.parse(saved.get('queue'));
    assert.deepEqual(queue.map(q=>new URL(q.url,'https://example.test').pathname),['/products/fixture-mug','/products/fixture-print']);
    assert.equal(queue.some(q=>/view=/.test(q.url)),false);
  });
  test(mode+': restored mixed selections reach only blanket purchase, preserving its handle, variant, query and hash',()=>{
    const {ctx,saved}=fixture(minified);saved.set('queue','old draft queue');ctx.addToCart();
    assert.equal(saved.has('queue'),false);
    const url=new URL(ctx.window.location.href,'https://example.test');
    assert.deepEqual(url.searchParams.getAll('view'),['blanket-native']);
    assert.equal(url.pathname,'/products/new-configured-blanket');assert.equal(url.searchParams.get('variant'),'42');assert.equal(url.searchParams.get('keep'),'yes');assert.equal(url.hash,'#art');
  });
  test(mode+': default off retains paused blanket and no configured product cannot enable purchase',()=>{
    const {ctx,saved}=fixture(minified,false);ctx.addToCart();assert.match(JSON.parse(saved.get('queue'))[1].url,/view=blanket-art-preview/);
    ctx.cfg.blanketPurchase=true;ctx.cfg.gifts.blanket.url=null;assert.equal(ctx.blanketPurchaseEnabled(),false);assert.equal(ctx.chooseModel().missing.includes('blanket'),true);
  });
  test(mode+': opt-in selection switches visibly between one purchase and one draft without creating a cart queue',()=>{
    const {ctx,saved}=fixture(minified);ctx.selectGift('mug');assert.deepEqual(JSON.parse(JSON.stringify(ctx.S.sel)),{mug:true});assert.equal(ctx.chooseModel().count,1);
    let html=ctx.chooseView({dog:'Test dog',rec:'Test person'});assert.match(html,/Choose one at a time/);assert.match(html,/Drafts cannot be ordered/);assert.match(html,/>Review draft</);
    ctx.addToCart();assert.match(ctx.window.location.href,/view=mug-art-preview/);assert.equal(saved.has('queue'),false);
    ctx.selectGift('blanket');assert.deepEqual(JSON.parse(JSON.stringify(ctx.S.sel)),{blanket:true});ctx.addToCart();assert.match(ctx.window.location.href,/view=blanket-native/);assert.equal(saved.has('queue'),false);
    ctx.selectGift('blanket');assert.equal(ctx.chooseModel().count,0);ctx.selectGift('print',true);ctx.addToCart();assert.match(ctx.window.location.href,/view=city-art-preview/);assert.equal(saved.has('queue'),false);
    const legacy=fixture(minified,false).ctx;legacy.S.sel={blanket:true};legacy.selectGift('mug');assert.equal(legacy.S.sel.blanket,true);assert.equal(legacy.S.sel.mug,true);assert.equal(legacy.chooseModel().count,2);
  });
  test(mode+': review uses actual selected blanket price without pricing drafts, and says shipping is free',()=>{
    const {ctx}=fixture(minified);let html=ctx.chooseView({dog:'Test dog',rec:'Test person'});
    assert.equal((html.match(/hs3-opt__price">Draft/g)||[]).length,2);assert.match(html,/hs3-opt__price">\$137/);assert.match(html,/Personalize blanket · \$137/);assert.doesNotMatch(html,/Continue with selected gifts/);assert.match(html,/Free US shipping on every order\./);
    ctx.S.sel={blanket:true};html=ctx.chooseView({dog:'Test dog',rec:'Test person'});assert.match(html,/Personalize blanket · \$137/);assert.doesNotMatch(html,/Personalize blanket · \$89/);
    ctx.S.sel={mug:true};html=ctx.chooseView({dog:'Test dog',rec:'Test person'});assert.match(html,/>Review draft</);
  });
}
test('blanket purchase setting is default off and reads product picker price and URL',()=>{
  const liquid=readFileSync(new URL('../../shopify/sections/hs3-chat.liquid',import.meta.url),'utf8');
  const schema=JSON.parse(liquid.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
  assert.equal(schema.settings.find(setting=>setting.id==='blanket_purchase').default,false);
  assert.match(liquid,/"blanketPurchase": {{ s.blanket_purchase \| json }}/);
  assert.match(liquid,/p\.price_min \| divided_by: 100\.0/);assert.match(liquid,/"url": {{ p\.url \| json }}/);
  assert.doesNotMatch(liquid,/product_view|price_mug|price_blanket|price_print/,'no template override and no price that is not Shopify\'s');
  const memo=readFileSync(new URL('../../shopify/sections/hs2-memo.liquid',import.meta.url),'utf8');
  const bundle=JSON.parse(memo.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]).settings.find(setting=>setting.id==='bundle_offer_live');
  assert.equal(bundle.default,false,'one switch, on the memo strip, off until the real discount exists');
  assert.equal(schema.settings.some(setting=>setting.id==='bundle_offer_live'),false);
});

test('default Buddy entry point has live core products; the alternate entry points have moved',()=>{
  const config=JSON.parse(readFileSync(new URL('../../shopify/templates/index.json',import.meta.url),'utf8')).sections.gift.settings;
  assert.equal(config.product_blanket,'your-dogs-personality-blanket');
  assert.equal(config.product_print,'your-dogs-portrait');
  assert.equal(config.product_mug,'your-dogs-illustrated-mug');assert.equal(config.artwork_candidates,true);
  assert.equal(config.blanket_purchase,false);assert.equal(config.ornament_bundle,false);
  assert.equal(config.core_purchase,true);assert.equal(config.bundle_offer_live ?? false,false);
  for(const name of ['index.gifts.json','index.landing.json','index.artwork-preview.json']) {
    const t=JSON.parse(readFileSync(new URL('../../shopify/templates/'+name,import.meta.url),'utf8'));
    assert.deepEqual(Object.values(t.sections).map(x=>x.type),['hs-moved'],name+' now only points to the current gifts');
  }
});
