// The mockup gate: the chat's mug must match the approved render, not just "look right".
// Run after render.mjs:   cd tools/preview && node mockup-gate.mjs
//
// Truth is Teeinblue's own print files (docs/evidence/cowork-2026-10-15/mug/print-file-*.png),
// wrapped onto the real mug photo by tools/realphoto/golden_reveal_mug.py with the formula of
// the Shopify images Krish approved. For each print file it checks, in a real browser:
//   1. the wrap: hs3.js wrapping that same print file matches the reference render;
//   2. the layout: hs3.js laying out the same words itself (fonts, rows, paw, signature)
//      matches the reference render of Teeinblue's file.
// Scores: ink match (F1 of the dark pixels, text, paw and signature, within 1 px) and the
// mean brightness difference where either render has ink. Side-by-side boards (reference, chat, difference) go to
// out/gate-mug/ for a person to look at. Exits 1 on any failure.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..', '..');
const out = path.join(here, 'out');
const gate = path.join(out, 'gate-mug');
fs.mkdirSync(gate, { recursive: true });
const evidence = path.join(repo, 'docs', 'evidence', 'cowork-2026-10-15', 'mug');
const CASES = [
  { file: 'print-file-even-line-breaks.png', name: 'Biscuit', texts: ['Naps best when\nyou are there.', 'Guards your slippers\non the bottom stair.', 'Your best friend,\nno contest.'] },
  { file: 'print-file-long-lines.png', name: 'Bartholomew Jr', texts: ['Waits at the door for you,\nevery single day.', 'Steals your side of the bed,\nthen the duvet.', "Will ride anywhere, as\nlong as it's with you."] },
  { file: 'print-file-short-lines.png', name: 'Bo', texts: ['Waits for you.', 'Steals the bed.', 'Yours, always.'] }
];
// Limits, set on 15 Oct from the first run (wrap 0.999 to 1.000 and 2 to 8; layout 0.94 to 0.99
// and 14 to 19), with a control below that must fail: the print file moved 12 print px.
const LIMITS = { wrap: { iou: 0.98, diff: 12 }, layout: { iou: 0.9, diff: 25 } };

for (const c of CASES) {
  const dir = path.join(gate, path.basename(c.file, '.png'));
  execFileSync('python3', [path.join(repo, 'tools', 'realphoto', 'golden_reveal_mug.py'), path.join(evidence, c.file), dir]);
  fs.copyFileSync(path.join(evidence, c.file), path.join(dir, 'print.png'));
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let f = path.join(out, decodeURIComponent(u.pathname));
  if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', path.basename(u.pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : f.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${base}/index-gifts.html`);
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) failures++; };

for (const c of CASES) {
  const rel = 'gate-mug/' + path.basename(c.file, '.png');
  const r = await page.evaluate(async ({ rel, c }) => {
    const api = window.__hs3api.mug;
    const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    const a = await api.loadMugAssets();
    const print = await load(`/${rel}/print.png`);
    const px = (img) => { const cv = document.createElement('canvas'); cv.width = 640; cv.height = 549; const x = cv.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, 640, 549).data; };
    // ink match with 1 px tolerance (F1 of dark pixels, each side matched against the other
    // dilated by one pixel), and the mean brightness difference where either side has ink
    const score = (A, B) => {
      const W = 640, H = 549, n = W * H, la = new Float32Array(n), lb = new Float32Array(n);
      for (let i = 0; i < n; i++) { la[i] = (A[i * 4] + A[i * 4 + 1] + A[i * 4 + 2]) / 3; lb[i] = (B[i * 4] + B[i * 4 + 1] + B[i * 4 + 2]) / 3; }
      const near = (L, i) => { const x = i % W, y = (i / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && L[yy * W + xx] < 150) return true; } return false; };
      let ia = 0, ib = 0, ma = 0, mb = 0, d = 0, m = 0;
      for (let i = 0; i < n; i++) {
        if (la[i] < 150) { ia++; if (near(lb, i)) ma++; }
        if (lb[i] < 150) { ib++; if (near(la, i)) mb++; }
        if (la[i] < 200 || lb[i] < 200) { d += Math.abs(la[i] - lb[i]); m++; }
      }
      const p = ia ? ma / ia : 1, r = ib ? mb / ib : 1;
      return { iou: p + r ? 2 * p * r / (p + r) : 0, diff: m ? d / m : 0 };
    };
    const outp = {};
    for (const face of ['note', 'dog']) {
      const gold = px(await load(`/${rel}/golden-${face}.png`));
      const wrapCv = api.renderFace(face, a, null, { print });
      outp[face + 'Wrap'] = score(wrapCv.getContext('2d').getImageData(0, 0, 640, 549).data, gold);
      outp[face + 'WrapPng'] = wrapCv.toDataURL('image/png');
      if (face === 'note') {
        const lay = api.renderFace('note', a, null, { texts: c.texts, ink: 3, name: c.name });
        outp.noteLayout = score(lay.getContext('2d').getImageData(0, 0, 640, 549).data, gold);
        outp.noteLayoutPng = lay.toDataURL('image/png');
        // the control: the same print file moved 12 print px right and 8 down must fail
        const moved = document.createElement('canvas'); moved.width = 2700; moved.height = 1050;
        moved.getContext('2d').drawImage(print, 12, 8);
        outp.control = score(api.renderFace('note', a, null, { print: moved }).getContext('2d').getImageData(0, 0, 640, 549).data, gold);
      }
    }
    return outp;
  }, { rel, c });
  const dir = path.join(out, rel);
  for (const k of ['noteWrapPng', 'dogWrapPng', 'noteLayoutPng']) fs.writeFileSync(path.join(dir, k.replace('Png', '') + '.png'), Buffer.from(r[k].split(',')[1], 'base64'));
  ok(r.noteWrap.iou >= LIMITS.wrap.iou && r.noteWrap.diff <= LIMITS.wrap.diff, `${c.file}: note face wrap matches the reference (ink match ${r.noteWrap.iou.toFixed(3)}, ink difference ${r.noteWrap.diff.toFixed(1)})`);
  ok(r.dogWrap.iou >= LIMITS.wrap.iou && r.dogWrap.diff <= LIMITS.wrap.diff, `${c.file}: dog face wrap matches the reference (ink match ${r.dogWrap.iou.toFixed(3)}, ink difference ${r.dogWrap.diff.toFixed(1)})`);
  ok(r.noteLayout.iou >= LIMITS.layout.iou && r.noteLayout.diff <= LIMITS.layout.diff, `${c.file}: the chat's own layout of "${c.texts[0].split('\n')[0]}..." / "Love, ${c.name}" matches Teeinblue's print (ink match ${r.noteLayout.iou.toFixed(3)}, ink difference ${r.noteLayout.diff.toFixed(1)})`);
  ok(r.control.iou < LIMITS.layout.iou || r.control.diff > LIMITS.layout.diff, `${c.file}: the gate fails a print moved by 12 px (ink match ${r.control.iou.toFixed(3)}, ink difference ${r.control.diff.toFixed(1)})`);
  // a board for people: reference, chat, and the difference (red where the chat has ink the
  // print doesn't, blue the other way)
  execFileSync('python3', ['-c', `
import sys, numpy as np
from PIL import Image
d = sys.argv[1]
g = Image.open(d + '/golden-note.png').convert('RGB'); c = Image.open(d + '/noteLayout.png').convert('RGB')
G = np.asarray(g).astype(int).mean(2) < 150; C = np.asarray(c).astype(int).mean(2) < 150
diff = np.full(G.shape + (3,), 255, np.uint8); diff[G & C] = (60, 60, 60); diff[C & ~G] = (220, 40, 40); diff[G & ~C] = (40, 90, 220)
b = Image.new('RGB', (640 * 3 + 40, 549 + 20), (246, 241, 235))
for i, im in enumerate([g, c, Image.fromarray(diff)]): b.paste(im, (10 + i * 650, 10))
b.save(d + '/board.png')
`, dir]);
}
ok(!errors.length, 'no script errors ' + errors.join(' '));
await browser.close();
server.close();
console.log(failures ? `${failures} FAILED` : 'all passed');
process.exit(failures ? 1 : 0);
