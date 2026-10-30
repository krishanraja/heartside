// Buyer-visible text latency from the n8n "Heartside AI calls" export (tools/perf/samples/*.csv).
// Prints n, p50, p90 and max per call and route, nearest-rank. It reports what the sample is and
// no more: server time only (Stamp to Tag), no browser network, no load. Spans the data does not
// carry are named as unavailable rather than guessed.
//
//   node tools/perf/timing-report.mjs [tools/perf/samples/ai-calls-2026-10-29.csv] [--since 2026-10-22]
import {readFileSync} from 'node:fs';

export function parse(text) {
  const lines = text.split('\n').filter(l => l && !l.startsWith('#'));
  const head = lines.shift().split(',');
  return lines.map(l => Object.fromEntries(l.split(',').map((v, i) => [head[i], head[i] === 'ms' ? Number(v) : v])));
}
export function pct(sorted, p) { return sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(p / 100 * sorted.length) - 1)] : null; }
export function summarize(rows, since = '') {
  const groups = new Map();
  for (const r of rows) {
    if (since && r.created_at < since) continue;
    const key = `${r.call} ${r.source === 'fallback' ? 'deterministic' : r.model}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r.ms);
  }
  return [...groups].sort().map(([route, ms]) => {
    const s = ms.slice().sort((a, b) => a - b);
    return {route, n: s.length, p50: pct(s, 50), p90: pct(s, 90), max: s[s.length - 1]};
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), i = args.indexOf('--since');
  const since = i >= 0 ? args[i + 1] : '';
  const file = args.find((a, j) => !a.startsWith('--') && j !== i + 1) || new URL('samples/ai-calls-2026-10-29.csv', import.meta.url);
  const rows = parse(readFileSync(file, 'utf8'));
  console.log(`| Route | n | p50 ms | p90 ms | max ms |\n|---|---|---|---|---|`);
  for (const g of summarize(rows, since)) console.log(`| ${g.route} | ${g.n} | ${g.p50} | ${g.p90} | ${g.max} |`);
  console.log('\nUnavailable from this source: browser end-to-end time, network, n8n queue/start before Stamp, provider-only model time, art generation, registration.');
}
