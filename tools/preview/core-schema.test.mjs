import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Liquid} from 'liquidjs';
const source=readFileSync(new URL('../../shopify/snippets/hs-schema.liquid',import.meta.url),'utf8');
const engine=new Liquid();engine.registerFilter('json',v=>JSON.stringify(v));engine.registerFilter('asset_url',v=>'//cdn.example.test/'+v);engine.registerFilter('image_url',v=>'//cdn.example.test/'+v);
const handles=['your-dogs-illustrated-mug','your-dogs-personality-blanket','your-dogs-portrait'];
const catalog=Object.fromEntries(handles.map((handle,i)=>[handle,{title:['Illustrated mug','Word-free sherpa blanket','Portrait'][i],available:true,url:'/products/'+handle}]));
async function render(data){const html=await engine.parseAndRender(source,data);return JSON.parse(html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1])['@graph'];}
test('home schema lists only the three available core products and describes the word-free blanket',async()=>{
 const graph=await render({kind:'home',all_products:{...catalog,'the-tree-ornament':{title:'Old ornament',available:true,url:'/products/the-tree-ornament'}}});
 const list=graph.find(x=>x['@type']==='ItemList').itemListElement;
 assert.deepEqual(list.map(x=>x.url),handles.map(x=>'https://heartside.io/products/'+x));assert.deepEqual(list.map(x=>x.position),[1,2,3]);
 const description=graph.find(x=>x['@type']==='Organization').description;
 assert.match(description,/word-free sherpa blanket/);assert.match(description,/unframed or framed/);assert.doesNotMatch(description,/ornament|Free US shipping/i);
});
test('unavailable or missing core entries do not create stale catalog links or invalid JSON',async()=>{
 const graph=await render({kind:'home',all_products:{[handles[0]]:{...catalog[handles[0]],available:false},[handles[2]]:catalog[handles[2]]}});
 assert.deepEqual(graph.find(x=>x['@type']==='ItemList').itemListElement.map(x=>[x.position,x.name]),[[1,'Portrait']]);
 assert.deepEqual((await render({kind:'home',all_products:{}})).find(x=>x['@type']==='ItemList').itemListElement,[]);
});
test('product offers use actual variant prices and preserve the framed/unframed family without a false zero shipping rate',async()=>{
 for(const [index,prices] of [[0,[4500]],[1,[12900]],[2,[5900,11900]]]){
  const product={...catalog[handles[index]],description:index===1?'Word-free personalized artwork on a 50 x 60 in sherpa blanket.':'Approved personalized artwork.',images:[],variants:prices.map((price,i)=>({id:100+i,title:index===0?'11 oz':index===1?'50 x 60 in':i?'Framed':'Unframed',price,available:true,sku:'sku'+i}))};
  const graph=await render({kind:'product',product,cart:{currency:{iso_code:'USD'}}});
  const item=graph.find(x=>x['@type']==='Product');assert.deepEqual(item.offers.map(x=>x.price),prices.map(x=>x/100));
  assert.ok(item.offers.every(x=>!('shippingDetails' in x)));assert.ok(item.offers.every(x=>x.url.startsWith('https://heartside.io'+product.url+'?variant=')));
  product.variants[0].price+=100;const changed=(await render({kind:'product',product})).find(x=>x['@type']==='Product');assert.equal(changed.offers[0].price,prices[0]/100+1);
 }
});
