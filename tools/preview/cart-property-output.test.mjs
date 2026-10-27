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
 const links=[...html.matchAll(/<a href="([^"]*)">/g)].map(match=>match[1]);
 assert.deepEqual(links,['https://cdn.shopify.com/s/files/1/uploads/dog.jpg','https://cdn.shopify.com/uploads/a.jpg&quot; onmouseover=&quot;alert(1)']);
 assert.match(html,/>dog\.jpg<\/a>/);
 assert.match(html,/<dd>javascript:alert\(1\)\/\/uploads\/x\.jpg<\/dd>/);
 assert.match(html,/<dd>http:\/\/example\.com\/uploads\/old\.jpg<\/dd>/);
 assert.doesNotMatch(html,/href="javascript|href="http:/);
});
