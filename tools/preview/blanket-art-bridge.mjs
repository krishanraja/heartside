// Provider fixture: tests handoff and stale-image guards, not generated likeness.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer((req,res) => {
  const pathname = new URL(req.url,'http://test').pathname;
  const f = pathname.includes('/assets/') ? path.join(here,'out/assets',path.basename(pathname)) : path.join(here,'out',pathname === '/chat' ? 'index-gifts.html' : 'product-blanket-art.html');
  if (!fs.existsSync(f)) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:390,height:844}}), errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
    if(!sessionStorage.getItem('hs2-review')) sessionStorage.setItem('hs2-review',JSON.stringify({dog:'Fixture dog',hs3_lines:{meaning:'A made-up sock habit must not enter the art.'},hs3_art_profile:{version:1,facts:[{source:'together',text:'Naps alongside their person.'}]}}));
    window.teeinblueCampaign={productId:'fixture-blanket-v2'};
    const data={};window.teeinblue={getCurrentCustomization:()=>({...data})};window.uploads=0;window.cartAdds=0;
    document.addEventListener('DOMContentLoaded',()=>{
      if (location.pathname === '/chat') return;
      const form=document.createElement('div');form.className='tee-customization-form';
      const field=(id,label,max)=>`<div class="tee-field" id="tee-field--${id}"><div class="tee-field__heading"><span>${label}</span></div><input type="text" name="${id}" id="${id}" maxlength="${max}"></div>`;
      form.innerHTML=field('layer-388769','Personality',1600)+field('layer-768760',"Dog's name",14)+'<div class="tee-field tee-field--photo"><span>Upload photo</span><input type="file"></div><button id="teeAtcButton">Add to cart</button><svg><g id="artwork-layer--layer-292294-image-placement"><image/></g></svg>';
      form.addEventListener('input',e=>{data[e.target.name]=e.target.value;});
      form.addEventListener('change',e=>{if(e.target.type==='file'){window.uploads++;window.factsAtUpload=data['layer-388769'];}});
      form.querySelector('#teeAtcButton').addEventListener('click',()=>window.cartAdds++);
      document.querySelector('[data-hs2-answers]').after(form);document.dispatchEvent(new Event('teeinblue-event-component-injected'));
    });
  });
  const url=`http://127.0.0.1:${server.address().port}/products/blanket-art-test`;
  await page.goto(url);await page.waitForTimeout(1000);
  assert.equal(await page.locator('#layer-388769').isVisible(),false,'internal facts never become a customer text box');
  assert.match(await page.inputValue('#layer-388769'),/Naps alongside/);
  assert.doesNotMatch(await page.inputValue('#layer-388769'),/sock/);
  await page.evaluate(()=>{window.__hs2api.usePhoto(new File(['fixture'],'dog.png',{type:'image/png'}),56789);document.dispatchEvent(new Event('teeinblue-event-component-injected'));});
  await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.uploads),0);
  await page.click('[data-hs2-handoff-btn]');await page.waitForTimeout(11500);
  assert.equal(await page.evaluate(()=>window.uploads),1,'no automatic repeat during uncertain generation');
  assert.match(await page.evaluate(()=>window.factsAtUpload),/Naps alongside/,'facts are present before upload dispatch');
  await page.evaluate(()=>{
    document.querySelector('.tee-field--photo').insertAdjacentHTML('beforeend','<img class="tee-photo-image" src="https://example.test/blanket-naps.png">');
    document.querySelector('#artwork-layer--layer-292294-image-placement image').setAttribute('href','https://example.test/blanket-naps.png');document.dispatchEvent(new Event('teeinblue-event-component-injected'));
  });
  await page.waitForTimeout(500);
  assert.equal(await page.locator('[data-hs2-artwork-source]').getAttribute('href'),'https://example.test/blanket-naps.png');
  assert.equal(await page.locator('[data-hs2-handoff]').isVisible(),false);
  assert.equal(await page.locator('#teeAtcButton').isDisabled(),true);
  assert.equal(await page.locator('.tee-btn--atc').isDisabled(),true,'alternate provider button is also blocked');
  assert.equal(await page.evaluate(()=>{const form=document.querySelector('#buy form');return form ? form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})) : false;}),false,'native form submit cannot bypass the preview guard');
  await page.locator('#teeAtcButton').dispatchEvent('click');assert.equal(await page.evaluate(()=>window.cartAdds),0);
  await page.evaluate(()=>{const s=JSON.parse(sessionStorage.getItem('hs2-review'));s.hs3_art_profile={version:1,facts:[{source:'home_follow',text:'Brings a shoe when their person comes home.'}]};sessionStorage.setItem('hs2-review',JSON.stringify(s));});
  await page.reload();await page.waitForTimeout(1000);
  await page.evaluate(()=>{window.__hs2api.usePhoto(new File(['fixture'],'dog.png',{type:'image/png'}),56789);document.dispatchEvent(new Event('teeinblue-event-component-injected'));});
  await page.waitForTimeout(500);
  assert.match(await page.inputValue('#layer-388769'),/shoe/);
  assert.equal(await page.locator('[data-hs2-artwork-source]').isVisible(),false,'changed facts cannot inherit a previous image');
  assert.equal(await page.evaluate(()=>window.uploads),0);
  assert.equal(await page.locator('[data-hs2-handoff-btn]').isEnabled(),true);
  for(const width of [390,1440]) {await page.setViewportSize({width,height:900});await page.screenshot({path:path.join(here,`out/blanket-art-bridge-${width}.png`)});}
  await page.evaluate(()=>sessionStorage.setItem('hs3-gift',JSON.stringify({screen:'reveal',dog:'Fixture dog',rec:'Fixture person',home:'toy',follow:'shoe',spot:'bed',together:'naps',meaning:'best',gift:'blanket',typed:{},hasPhoto:false})));
  await page.goto(new URL('/chat',url).href);
  await page.locator('[data-hs3="them"]').click();
  const handedProfile=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('hs2-review')).hs3_art_profile);
  assert.ok(handedProfile.facts.some(f=>f.text.includes('shoe')),'actual Buddy chat exports the chosen follow-up');
  assert.ok(handedProfile.facts.some(f=>f.text.includes('Naps')));
  assert.ok(!JSON.stringify(handedProfile).includes('Fixture person'),'recipient is not sent to the image model');
  assert.deepEqual(errors,[]);
  console.log('PASS: hidden source facts, photo-first generation, no repeat, saved preview, changed-facts invalidation and blocked orders. Provider is a fixture.');
} finally {await browser.close();await new Promise(r=>server.close(r));}
