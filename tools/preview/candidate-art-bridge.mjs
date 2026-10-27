// Standalone CI runner. In Codex-only browser sessions use the same fixture via
// tone-fixture-server.mjs and the in-app browser; do not launch this runner.
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export async function runCandidateBridge(kind) {
  const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://fixture').pathname;
    const file=pathname==='/candidate-native-fixture.js'?path.join(here,'candidate-native-fixture.js'):pathname.includes('/assets/')?path.join(here,'../../shopify/assets',path.basename(pathname)):path.join(here,'out','product-'+kind+'-art.html');
    if(!fs.existsSync(file)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
    const raw=fs.readFileSync(file);res.end(file.endsWith('.html')?raw.toString().replace('</head>','<script src="/candidate-native-fixture.js"></script></head>'):raw);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch();
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}}), errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.addInitScript(()=>{if(!sessionStorage.getItem('hs2-review')) sessionStorage.setItem('hs2-review',JSON.stringify({dog:'Test dog',hs3_lines:{meaning:'My exact words.'}}));});
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.getByLabel('Artwork style',{exact:true}).selectOption('comic');
    await page.getByLabel('Tone for your gifts',{exact:true}).selectOption('hilarious');
    await page.waitForFunction(()=>document.querySelector('#fixture-native-result')?.textContent.includes('"nativeStyle":"comic"') && document.querySelector('#fixture-native-result')?.textContent.includes('"nativeTone":"hilarious"'));
    assert.deepEqual(JSON.parse(await page.locator('#fixture-native-result').textContent()),{nativeStyle:'comic',nativeTone:'hilarious',factsHidden:true,uploads:0});
    assert.equal(await page.locator('[data-hs2-handoff-btn]').isDisabled(),true);
    assert.equal(await page.locator('#teeAtcButton').isDisabled(),true);
    if(kind==='blanket') assert.equal(await page.locator('[data-hs2-tib-edit]').isVisible(),false);
    await page.reload();
    assert.equal(await page.getByLabel('Artwork style',{exact:true}).inputValue(),'comic');
    assert.equal(await page.getByLabel('Tone for your gifts',{exact:true}).inputValue(),'hilarious');
    assert.deepEqual(errors,[]);
    console.log('PASS: '+kind+' candidate choices, native fixture mapping, hidden metadata, reload and generation/order gates. No provider-quality claim.');
  } finally {await browser.close();await new Promise(r=>server.close(r));}
}
