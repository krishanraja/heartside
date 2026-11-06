// The weekly real-engine run (Krish, 6 Nov: yes to "a weekly run of awkward photos through real Teeinblue
// paintings, about $1.30 a week"): six buyers from fixtures/real-buyer/personas.json, three at a time, each through
// Teeinblue's real painter on the live store to the checkout page, never past it. Under ten paintings in all, at
// about $0.13 each; the run stops a buyer before an eleventh.
//
// Prints one "ok" or "FAIL" line per buyer (FAIL lines open the real-buyer issue, .github/workflows/real-buyer.yml)
// and exits 1 when any buyer did not reach checkout. docs/RUNBOOK-cart.md says where to look.
//
//   node tools/preview/real-buyer-run.cjs            # all six
//   node tools/preview/real-buyer-run.cjs p04-bob     # one
const fs = require('fs'), path = require('path'), {spawn} = require('child_process');

const HERE = __dirname, PERSONAS = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'real-buyer', 'personas.json'), 'utf8'));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PERSONAS);
const CAP = 10;

function run(id) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(HERE, 'real-buyer.cjs'), id], {stdio: ['ignore', 'pipe', 'pipe'], env: process.env});
    let log = '';
    child.stdout.on('data', d => { log += d; });
    child.stderr.on('data', d => { log += d; });
    child.on('close', () => {
      let R = null;
      try { R = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'real-buyer', id, 'run.json'), 'utf8')); } catch (e) { R = null; }
      fs.writeFileSync(path.join(HERE, 'out', 'real-buyer', id + '.log'), log);
      resolve({id, R});
    });
  });
}

(async () => {
  fs.mkdirSync(path.join(HERE, 'out', 'real-buyer'), {recursive: true});
  const planned = ids.reduce((n, id) => n + (PERSONAS[id] ? (PERSONAS[id].paintCap || 2) : 0), 0);
  if (planned > CAP) { console.log(`FAIL real buyer: the set plans ${planned} paintings, over the cap of ${CAP}`); process.exitCode = 1; return; }
  const results = [];
  for (let i = 0; i < ids.length; i += 3) results.push(...await Promise.all(ids.slice(i, i + 3).map(run)));
  let paints = 0, failed = false;
  for (const {id, R} of results) {
    if (!R) { failed = true; console.log(`FAIL real buyer ${id}: no record (the run itself failed)`); continue; }
    paints += R.paints.length;
    const ok = /^reached checkout/.test(R.outcome || '');
    const err = (R.errors || []).filter(e => !/^harness: page\.screenshot/.test(e.msg)).slice(-1)[0];
    const extra = `${R.paints.length} paintings, ${R.totalSeconds} s` + (R.errors && R.errors.length ? `, ${R.errors.length} page errors` : '');
    if (ok) console.log(`ok   real buyer ${id}: ${R.outcome}; ${extra}`);
    else { failed = true; console.log(`FAIL real buyer ${id}: ${R.outcome || 'unfinished'}; ${extra}` + (err ? `; last: ${String(err.msg).split('\n')[0].slice(0, 160)}` : '')); }
  }
  console.log(`# ${paints} paintings this run (about $${(paints * 0.13).toFixed(2)})`);
  process.exitCode = failed ? 1 : 0;
})();
