# Timing and resilience report, 29 October 2026

This is the measured state of the buyer-visible waits, with each sample's size and its limits. It answers Priority 2 of the 29 October handover and records what Priorities 1, 3 and 4 changed. It is not a load test, and it makes no p95 or capacity claim the data cannot carry.

Reproduce the text numbers:

```
node tools/perf/timing-report.mjs --since 2026-10-22
```

It reads `tools/perf/samples/ai-calls-2026-10-29.csv`. That is all 89 rows of the n8n "Heartside AI calls" table as read at 08:10 UTC, before any of this session's test calls, and it carries no personal data. `ms` in that table is server time, from arrival (the Stamp node) to the Tag node.

## What was measured

### The text layer (n8n), since Claude began writing the note on 22 October

| Route | n | p50 | p90 | max |
|---|---|---|---|---|
| Note, Claude | 25 | 3.9 s | 5.2 s | 5.3 s |
| Note, Gemini backup | 1 | 9.8 s | n/a | 9.8 s |
| Typed answer, Gemini | 13 | 1.1 s | 3.8 s | 4.0 s |

- **Sample limits.** The rows are mostly test and acceptance traffic from Krish, CoWork and earlier sessions, not buyers. Warm and cold runs are mixed. No buyer has produced a row yet.
- **Cold code runner.** Execution data shows the first Code node of a run (Guard) takes about 1.4 s when n8n's code runner has been idle. In `tools/perf/samples/runner-cold-start-2026-10-29.csv`:
  - runs 2.6 s, 4.4 s, 5.0 s and 14.4 s after the previous Heartside run took 14–15 ms;
  - a run 39 s after took 1,367 ms.
- **What that means.** The runner idles out somewhere between about 15 s and 40 s, and that cost lands inside the buyer's wait. It explains why typed answers have a fast cluster (about 0.8–1.5 s) and a slow one (about 2.8–4.0 s).
- **The old warm ping missed it.** The page sent one warm ping as the chat started, at most once every 45 s. A buyer who read or typed for longer than the idle window met a cold runner.

### Live proofs after the changes in this session

These are single calls, so they prove the paths work and nothing about the distribution. Each wrote one row to the calls table on 29 October between 08:34 and 08:42 UTC; leave those rows out of future buyer statistics.

| Execution | What it shows |
|---|---|
| typed 47810 | Gemini by REST with a deadline: 2.1 s for the model, 3.8 s on the server (cold runner), `source: ai` |
| compose 47811 | Claude reading the one system prompt from Voice: 4.0 s for the model, 5.5 s on the server, `source: ai`. The prompt-cache write was 3,596 tokens, the same size as the earlier cached reads. |
| typed 47812 | The atomic limit: Admit 94 ms, Count 20 ms, check 17 ms, about 130 ms added in total |
| typed 47813–47820 | One session in one hour: calls 1–8 admitted, call 9 refused with `limit` (HTTP 429) in 0.17 s |
| compose 47821 | Note admitted through the new limit, `source: ai` |

### Painting

The only observation is about 107 s from one recorded "painting" state to the reveal, taken by hand on 28 October. It is not a provider benchmark. Teeinblue reports pending and ready, and nothing in between.

### Checkout registration

The page already sends `add_timing`, made of `teeinblue_ms`, `prepare_ms` and `add_ms`, to Shopify analytics. It now also sends `retries`. No production sample has been read yet: buyer orders are the source. The original 5.667 s failure stays uncategorized.

### Spans not available from these sources

None of these is available yet:

- browser end-to-end time for the text calls (network included);
- n8n queue time before Stamp;
- provider-only model time, except per node in an execution read by hand;
- art generation time;
- registration server time per step.

None of them is inferred here.

## What changed, and the bound each change sets

1. **The painting wait (Priority 1).**
   - The timer-driven bar that crept toward 92%, its `aria-valuenow`, and "Nearly there" at 30 s are gone.
   - The words follow observed events only:
     - the photo checked on this device (upload lock `preparing`);
     - with the painter (`sent`);
     - the framing box open;
     - going onto the gift.
   - The card counts the time since the painting started. That count survives reload and back navigation.
   - From 2 minutes it says the painting is taking longer than most, and that the photo need not be sent again.
   - "Most paintings take 1 to 3 minutes" replaces "about a minute, sometimes two". The one observation (107 s) is inside that range. Recalibrate it from the five device paintings.
2. **Text deadlines (Priority 3).** The Gemini node has no timeout option, so every Gemini call is now a REST request with one.

   | Workflow | First call | Backup | Past both | Server worst case |
   |---|---|---|---|---|
   | typed | Gemini 3 s | Gemini 1.5 s | buyer's own words | about 6 s, cold. The page gives up at 5 s with its own fallback. |
   | note | Claude 6.5 s (was 7.5) | Gemini 3.5 s | buyer's own lines | about 11.5 s, cold. The page waits 11 s, then still takes a late note. |

   Before this change, both Gemini calls had no bound of their own.
3. **The limits (Priority 3).**
   - Static data is saved at the end of a run. In simulation against the live Guard code, ten parallel note calls from one session were all admitted against a limit of five.
   - Each call now appends hashed keys to the "Heartside AI admission" table and counts them. A race can only over-count.
   - The IP is stored only as a hash, rows go after two hours, and a data-table error fails open.
   - The test is in `n8n/test-rules.mjs`.
4. **Warm-up.** Typing, the tone slider and a just-shown note warm their workflow:
   - at most once every 12 s;
   - at most 15 times per workflow per page;
   - and, after a note is shown, for one more minute.

   That is at most about 30 extra n8n executions for a buyer who uses the whole flow.
5. **Registration (Priority 4).**
   - Each request now waits up to 32 s, past the server's 30 s ceiling, instead of abandoning it at 20 s. A retry no longer repeats work that is still running.
   - Retry waits keep the server's 3 or 5 s for three tries, then lengthen up to 8 s, with up to 400 ms of jitter.
   - A multi-gift add registers two items at a time.
   - The 90 s budget, the 12-request cap, identity checks and fail-fast on unknown or authorization errors are unchanged.
   - A second add while one is preparing was already refused.

## Proposed service objectives (for Krish, not yet agreed)

| Span | Objective | Measured from |
|---|---|---|
| Typed answer, server | p90 ≤ 3 s, with a hard ceiling of 6 s | "Heartside AI calls" table |
| Note, server | p90 ≤ 6 s, with a hard ceiling of 11.5 s; the backup used in < 5% of calls | same |
| Painting, sent to ready | report only (provider-bound); the page's promise is "1 to 3 minutes" | the device batch, then buyer `add_timing` |
| Checkout registration | p90 ≤ 15 s; failures < 2% of adds | `add_timing` in Shopify analytics |

## The load envelope that can be stated

These are the limits that bound the system. None of them is a measured throughput.

- Per buyer session and hour: 8 typed answers and 5 notes.
- Per IP and hour: 60 typed answers and 20 notes.
- Registration admits 30 a minute per shop.

Unknown:

- the n8n plan's concurrent-execution limit, which the connector does not expose;
- the Anthropic and Gemini rate limits for these keys, which were not read in this session.

No paid load test was run, and none of the five reserved paintings was spent on timing.

## What stays open

- **Server-side in-flight sharing for registration.** The checkout-image workflow is not available to the n8n connector, so it was not changed. Its idempotency design is in `n8n/CHECKOUT-IMAGE-CANDIDATE.md` (Core and idempotency). The client changes above remove the repeat-work case that a 20 s abort created.
- **The note's Gemini backup was not triggered live.** Its node is identical to the typed backup, which was proved live, and the offline expression tests cover it.
- **Real-buyer distributions.** These need real orders. Re-run the report weekly from a fresh export.
