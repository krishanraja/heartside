import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source=readFileSync(new URL('../../shopify/templates/product.checkout-image-check.liquid',import.meta.url),'utf8');
const helper=source.slice(source.indexOf('      function retainedRuntime()'),source.indexOf("      retainedForm.elements.cartId.addEventListener"));
for(const minified of [false,true]) {
  const setup=()=>{
    const context={window:{Shopify:{actions:{getCart(){},updateCart(){}}}},document:{readyState:'complete'},retainedResult:{textContent:''}};
    vm.runInNewContext(minified?transformSync(helper,{minify:true}).code:helper,context);
    return context;
  };
  test(`${minified?'minified':'source'} retained cart accepts documented array and observed runtime nodes without exposing cart ID`,()=>{
    const context=setup(), lines=[{id:'gid://shopify/CartLine/example',quantity:2,cost:{totalAmount:{amount:'258',currencyCode:'USD'}}}];
    for(const shape of [lines,{nodes:lines}]) {
      context.showRetainedCart({id:'private-cart?key=never-display',lines:shape,totalQuantity:2,cost:{totalAmount:{amount:'258',currencyCode:'USD'}}});
      const result=JSON.parse(context.retainedResult.textContent);
      assert.deepEqual(result.lines,lines);
      assert.equal(context.retainedResult.textContent.includes('never-display'),false);
    }
    context.showRetainedCart(null);
    assert.equal(JSON.parse(context.retainedResult.textContent).found,false);
    assert.throws(()=>context.showRetainedCart({lines:{edges:[]}}),/lines shape/);
  });
  test(`${minified?'minified':'source'} diagnostic classifies safe metadata without raw exception or cause leakage`,()=>{
    const context=setup();
    context.retainedFailure('read_request',{name:'Error',message:'SFAPI 403 secret-key',cause:{status:403,id:'private-cart'}});
    const result=JSON.parse(context.retainedResult.textContent);
    assert.equal(result.classification,'provider_http_error');
    assert.equal(result.httpStatus,403);
    assert.equal(result.runtime.getCart,true);
    assert.equal(context.retainedResult.textContent.includes('secret-key'),false);
    assert.equal(context.retainedResult.textContent.includes('private-cart'),false);
    context.window.Shopify={};
    assert.equal(context.retainedRuntime().getCart,false);
  });
}
