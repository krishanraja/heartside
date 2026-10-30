import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parse, pct, summarize} from './timing-report.mjs';

test('nearest-rank percentiles and routes by model, with the deterministic floor named', () => {
  const rows = parse('# c\ncreated_at,call,step,source,model,ms\n2026-10-23T00:00:00Z,compose,reveal,ai,primary,100\n2026-10-23T00:00:01Z,compose,reveal,ai,primary,300\n2026-10-23T00:00:02Z,compose,reveal,ai,primary,200\n2026-10-14T00:00:00Z,typed,spot,fallback,none,50\n');
  assert.deepEqual(summarize(rows), [{route: 'compose primary', n: 3, p50: 200, p90: 300, max: 300}, {route: 'typed deterministic', n: 1, p50: 50, p90: 50, max: 50}]);
  assert.deepEqual(summarize(rows, '2026-10-22'), [{route: 'compose primary', n: 3, p50: 200, p90: 300, max: 300}]);
  assert.equal(pct([], 50), null);
});
