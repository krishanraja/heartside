import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Liquid} from 'liquidjs';

// Buyer-typed line item properties are printed on the cart page. Teeinblue already
// entity-encodes some values, so output uses escape_once, and only https uploads link.
const liquid=readFileSync(new URL('../../shopify/snippets/cart-products.liquid',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const start=liquid.indexOf('<dl class="cart-items__properties">'),end=liquid.indexOf('</dl>',start)+'</dl>'.length;
// liquidjs writes &#34; where Shopify writes &quot;; normalise so assertions read as Shopify output.
const render=async properties=>(await new Liquid().parseAndRender(liquid.slice(start,end),{item:{properties}})).replace(/&#34;/g,'&quot;');

test('property names and values are escaped once, never raw and never double-escaped',async()=>{
 assert.ok(start>=0&&end>start);
 const html=await render({'<img src=x onerror=alert(1)>':'Juniper','Dog&#39;s name':'Fish &amp; chips','Your note':'I said "hi" & <b>loud</b>',_hidden:'<script>never</script>'});
 assert.doesNotMatch(html,/<img|<b>|<script|never/);
 assert.match(html,/<dt>&lt;img src=x onerror=alert\(1\)&gt;:<\/dt>/);
 assert.match(html,/<dt>Dog&#39;s name:<\/dt>/);
 assert.match(html,/Fish &amp; chips/);assert.doesNotMatch(html,/&amp;amp;|&amp;#39;/);
 assert.match(html,/I said &quot;hi&quot; &amp; &lt;b&gt;loud&lt;\/b&gt;/);
});
test('only https upload values become links; any other scheme prints as text',async()=>{
 const html=await render({Photo:'https://cdn.shopify.com/s/files/1/uploads/dog.jpg',Script:'javascript:alert(1)//uploads/x.jpg',Plain:'http://example.com/uploads/old.jpg',Quote:'https://cdn.shopify.com/uploads/a.jpg" onmouseover="alert(1)'});
 const links=[...html.matchAll(/<a class="hs2-cart-upload" href="([^"]*)">/g)].map(match=>match[1]);
 assert.deepEqual(links,['https://cdn.shopify.com/s/files/1/uploads/dog.jpg','https://cdn.shopify.com/uploads/a.jpg&quot; onmouseover=&quot;alert(1)']);
 assert.match(html,/<dd>javascript:alert\(1\)\/\/uploads\/x\.jpg<\/dd>/);
 assert.match(html,/<dd>http:\/\/example\.com\/uploads\/old\.jpg<\/dd>/);
 assert.doesNotMatch(html,/href="javascript|href="http:|src="javascript|src="http:/);
 assert.doesNotMatch(html,/<img[^>]*onmouseover="/,'the quote stays inside the attribute');
});
// A9e (28 Oct): the buyer's photo showed as Shopify's hashed file name ("ae640aecd262c417e2d87ce746697ea4.jpg"),
// and its label read "Photo 1: Another photo of my dog:".
test('an uploaded photo is a small picture and "View photo", never its hashed file name',async()=>{
 const hashed='https://cdn.shopify.com/s/files/1/1/2/3/uploads/0f3c9a7d2e1b4c5a8d6e9f0a1b2c3d4e.jpg';
 const heic='https://cdn.shopify.com/s/files/1/1/2/3/uploads/9a8b7c6d5e4f30211a2b3c4d5e6f7a8b.HEIC';
 const html=await render({'Photo 1 (favorite toy)':hashed,'Photo 2 (another photo of my dog)':heic});
 assert.doesNotMatch(html,/[0-9a-f]{32}\.(jpg|HEIC)</,'no file name as text');
 assert.equal((html.match(/<span>View photo<\/span><\/a>/g)||[]).length,2);
 assert.deepEqual([...html.matchAll(/<a class="hs2-cart-upload" href="([^"]*)">/g)].map(m=>m[1]),[hashed,heic]);
 assert.match(html,new RegExp('<img class="hs2-cart-upload__img" src="'+hashed.replace(/[.]/g,'\\.')+'" width="48" height="48" loading="lazy" alt="">'));
 assert.equal((html.match(/<img /g)||[]).length,1,'a HEIC, which browsers cannot draw, keeps the words alone');
 assert.match(html,/<dt>Photo 1 \(favorite toy\):<\/dt>/,'one colon');
});
