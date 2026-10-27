// Local-only UI verification of the real hs3 assets. No provider or Shopify calls.
// node tools/preview/tone-fixture-server.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const assets = fileURLToPath(new URL('../../shopify/assets/', import.meta.url));
const revision = createHash('sha256').update(fs.readFileSync(path.join(assets, 'hs3.js'))).digest('hex');
let calls = 0;
const seed = {screen: 'reveal', dog: 'Pip', rec: 'Alex', pro: 'she', rel: 'partner',
  home: 'door', follow: 'weekends', spot: 'feet', together: 'walk', meaning: 'best',
  gift: 'mug', edits: {}, hasPhoto: false, noteTone: 'warm', appliedTone: 'warm'};
const cfg = {ai: true, composeUrl: '/fixture-compose', typedUrl: '', gifts: {}, mug: Object.fromEntries([
  ['dog', 'hs-mug-dog-base.webp'], ['dogShade', 'hs-mug-dog-shade.webp'],
  ['note', 'hs-mug-note-base.webp'], ['noteShade', 'hs-mug-note-shade.webp'],
  ['paw', 'hs-mug-paw.png'], ['fontText', 'hs-note-text.woff2'], ['fontItalic', 'hs-note-italic.woff2']
].map(([k, v]) => [k, '/assets/' + v]))};
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4318');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'");
  if (url.pathname === '/stats') {
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({calls, revision})); return;
  }
  if (url.pathname === '/fixture-compose' && req.method === 'POST') {
    let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 20000) { res.writeHead(413).end(); return; } }
    const input = JSON.parse(raw); calls++;
    const delay = url.searchParams.get('slow') === '1' ? 14000 : 1500;
    setTimeout(() => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({source: 'ai', recommended_gift: 'mug', reason: 'For the mornings you share.', lines: {
        home: input.note_tone === 'hilarious' ? 'I run door security. You pay me in cuddles.' : 'I wait by the door because you are worth it.',
        spot: 'I rest by your feet.', together: 'Our walks are the best part of my day.', meaning: 'You are my favorite person.'
      }}));
    }, delay); return;
  }
  if (/^\/assets\/[a-zA-Z0-9_.-]+$/.test(url.pathname)) {
    const file = path.join(assets, path.basename(url.pathname));
    if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file)); return;
  }
  if (['/product-city-art.html','/product-blanket-art.html','/product-mug-art.html'].includes(url.pathname)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    var html = fs.readFileSync(new URL('./out'+url.pathname,import.meta.url),'utf8');
    res.end(url.pathname === '/product-mug-art.html' ? html : html.replace('</head>','<script src="/candidate-native-fixture.js"></script></head>')); return;
  }
  if (url.pathname === '/candidate-native-fixture.js') {
    res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(new URL('./candidate-native-fixture.js',import.meta.url)));return;
  }
  if (url.pathname === '/photo-check') {
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(`<!doctype html><html><head><title>Local artwork photo preparation check</title><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/assets/hs-artwork-photo.js"></script></head><body><h1>Local photo preparation</h1><p>Nothing is uploaded. Original dimensions are preserved.</p><label>Reference photo <input type="file" accept="image/png,image/jpeg,image/webp"></label><button id="prepare">Prepare locally</button><pre id="result" role="status">Choose a reference photo.</pre><script>document.getElementById('prepare').onclick=async()=>{try{const result=await HSArtworkPhoto.prepare(document.querySelector('input').files[0]);document.getElementById('result').textContent=JSON.stringify({width:result.width,height:result.height,photo:result.photo,type:result.file.type,bytes:result.file.size},null,2)}catch(e){document.getElementById('result').textContent=e.message}};</script></body></html>`); return;
  }
  if (url.pathname !== '/tone') { res.writeHead(404).end(); return; }
  const config = {...cfg, artworkCandidates: url.searchParams.get('art') === '1', composeUrl: '/fixture-compose' + (url.searchParams.get('slow') === '1' ? '?slow=1' : '')};
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Heartside local tone-control test</title>
    <link rel="stylesheet" href="/assets/hs2.css"><link rel="stylesheet" href="/assets/hs3.css"><style>body{margin:0;background:#FBF6F1}#fixture{height:32px;font:11px system-ui;display:flex;align-items:center;justify-content:center;gap:12px;background:#fff;border-bottom:1px solid #ddd}
    @font-face{font-family:"HS Fraunces";src:url('/assets/hs-fraunces.woff2')}@font-face{font-family:"HS DM Sans";src:url('/assets/hs-dmsans.woff2')}@font-face{font-family:"HS Courier Prime";src:url('/assets/hs-courierprime-400.woff2')}</style>
    <script>const fixtureSeed=new URLSearchParams(location.search).get('seed')||'1';if(sessionStorage.getItem('tone-fixture-seed')!==fixtureSeed){sessionStorage.setItem('hs3-gift',JSON.stringify(${JSON.stringify(seed)}));sessionStorage.setItem('tone-fixture-seed',fixtureSeed)}
    addEventListener('DOMContentLoaded',()=>{async function stats(){const r=await fetch('/stats');const s=await r.json();document.getElementById('count').textContent='Fixture requests: '+s.calls;document.getElementById('fixture').dataset.sourceSha=s.revision}stats();setInterval(stats,500)});</script>
    <script src="/assets/hs-artwork-profile.js" defer></script><script src="/assets/hs-artwork-engine.js" defer></script><script src="/assets/hs-artwork-choices.js" defer></script><script src="/assets/hs3.js" defer></script></head><body><aside id="fixture">Local control test; existing preview <span id="count"></span></aside><main class="hs3" data-hs3><script type="application/json" data-hs3-config>${JSON.stringify(config)}</script><div class="hs3__frame"></div></main></body></html>`);
});
server.listen(4318, '127.0.0.1', () => console.log(`Local tone fixture http://127.0.0.1:4318/tone?seed=1; hs3 sha256 ${revision}`));
