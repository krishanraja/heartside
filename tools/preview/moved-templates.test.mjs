// The retired alternate templates render only sections/hs-moved.liquid, the live templates are
// untouched, and an old ?view= link lands on the same page without view, utm_* and all.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {Liquid} from 'liquidjs';

const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const retired=['index.classic.json','index.shop.json','index.landing.json','index.gifts.json','index.artwork-preview.json','product.landing.json','product.review.json','product.shop.json','product.shopgift.json','product.heartside.json','product.gift.json','product.mug-art-preview.json','product.blanket-art-preview.json','product.city-art-preview.json'];
const live=['product.mug-native.json','product.portrait-native.json','product.blanket-native.json','index.json','index.chat.json','cart.json'];

test('every retired template renders only the moved section',()=>{
  for(const name of retired) {
    const t=JSON.parse(read('shopify/templates/'+name));
    const types=Object.values(t.sections).map(s=>s.type);
    assert.deepEqual([...new Set(types)],['hs-moved'],name);
    assert.ok(t.order.length&&t.order.every(id=>t.sections[id]),name);
  }
});

test('the live templates still render their own sections, never the moved page',()=>{
  // their content changes on purpose (the shipping line, 27 Oct); what must hold is that the move
  // never reached them
  for(const name of live) {
    const t=JSON.parse(read('shopify/templates/'+name).replace(/^\s*\/\*[\s\S]*?\*\//,''));
    const types=Object.values(t.sections).map(x=>x.type);
    assert.ok(types.length && !types.includes('hs-moved'),name);
    if(name.startsWith('product.')) assert.deepEqual(types,['hs2-product'],name);
    // 29 Oct: the homepage is the journey; the chat stays one release at /?view=chat for rollback
    if(name==='index.json') assert.deepEqual(types,['hs-journey'],name);
    if(name==='index.chat.json') assert.deepEqual(types,['hs3-chat'],name);
  }
});

// Render the section's own Liquid up to its first snippet, take the inline script out, and run
// it against a fake location.
const section=read('shopify/sections/hs-moved.liquid');
const engine=new Liquid();
async function visit(context,search,hash='') {
  const html=await engine.parseAndRender(section.split("{%- render 'hs2-head' -%}")[0],{routes:{root_url:'/'},...context});
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const replaced=[];
  vm.runInNewContext(script,{URLSearchParams,location:{search,hash,replace:url=>replaced.push(url)}});
  return replaced;
}
const product={template:{name:'product',suffix:'gift'},product:{url:'/products/your-dogs-illustrated-mug'}};
const index={template:{name:'index',suffix:'gifts'}};

test('an old product view goes to the product without view, keeping utm_* and the rest',async()=>{
  const [to,...more]=await visit(product,'?view=gift&utm_source=instagram&utm_medium=paid&utm_campaign=xmas&variant=9','#buy');
  assert.equal(more.length,0);
  const url=new URL(to,'https://example.test');
  assert.equal(url.pathname,'/products/your-dogs-illustrated-mug');
  assert.equal(url.searchParams.has('view'),false);
  assert.equal(url.searchParams.get('utm_source'),'instagram');
  assert.equal(url.searchParams.get('utm_medium'),'paid');
  assert.equal(url.searchParams.get('utm_campaign'),'xmas');
  assert.equal(url.searchParams.get('variant'),'9');
  assert.equal(url.hash,'#buy');
});

test('an old homepage view goes to the homepage, and repeated view values all go',async()=>{
  assert.deepEqual(await visit(index,'?view=gifts&view=landing&utm_content=reel'),['/?utm_content=reel']);
  assert.deepEqual(await visit(index,'?view=classic'),['/']);
});

test('without a view parameter nothing redirects, so a retired default template cannot loop',async()=>{
  assert.deepEqual(await visit(product,'?utm_source=instagram'),[]);
  assert.deepEqual(await visit(index,''),[]);
});

test('a reader without JavaScript gets a link to the current page',async()=>{
  const html=await engine.parseAndRender(section.split('{% schema %}')[0].replace("{%- render 'hs2-head' -%}",''),{routes:{root_url:'/'},section:{settings:{heading:'This page has moved.'}},...product});
  assert.match(html,/<noscript>[\s\S]*href="\/products\/your-dogs-illustrated-mug"[\s\S]*<\/noscript>/);
});
