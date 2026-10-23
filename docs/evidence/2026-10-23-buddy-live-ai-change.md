# Buddy rename in the live AI workflows

Prepared on 23 October 2026. The approved tone update remains active.

Target: krishraja10101.app.n8n.cloud, Heartside only.

| Workflow | Current active version | Exact changes |
|---|---|---|
| Compose gift lines, 28WZgPmgTaY33KY3 | f67b2a25-aac8-48d9-8f61-586e00a25903 | Replace Biscuit with Buddy in workflow name, Enforce rules.jsCode and Gemini backup.options.systemMessage |
| Typed answer, ryyzdxv8SBm5HTjP | 08d63b62-216d-46c9-8e46-04b382831059 | Same three fields |

The compose primary reads the same system instructions as its backup, so this changes both model paths. The character, tone instructions, existing five-call compose limit, models, credentials, nodes, connections, settings, triggers, error paths and idempotency behavior are unchanged. No test generation or other external side effect is authorized by this rename proposal.

Rollback: complete current saved definitions are preserved privately in C:\Users\krish\.scratch\heartside-buddy-<workflow-id>-before.json. Restore and republish the corresponding prior definition if readback fails.

Before update, re-read both active versions and stop if either differs. After publication, compare the six intended fields, every unchanged workflow field, and active definitions. Krish approved both Buddy-only updates. Both are now published and independently read back.

Prepared definition SHA-256:
- Compose: 7cda662fb5a1eb8ce61f64ea1e679348d62f458902101595d33dd09e869adc3a
- Typed answer: 75c20cdbdf3f4f594ed8de726c323058abdc340bb244c28e00f241cc45800b13

## Approved publication result

- Compose active version: e4fb43e3-41ef-47f5-850d-6edb6c10b2fe.
- Typed-answer active version: 28e20399-3c26-4d4c-b140-4429dd9f42af.
- Immediately before mutation both saved and active versions matched the prepared base versions and all four submitted top-level fields matched the backups. Prepared-file hashes matched the approved record.
- Both workflows retain 14 nodes. Saved and published nodes and connections exactly match the approved prepared definitions. Independent recursive comparison against the prior definitions finds precisely the three approved changed fields per workflow, each only replacing Biscuit with Buddy.
- Settings, credential references, triggers, expressions outside the name validator, error paths and idempotency behavior are preserved. Runtime static data, including accumulated rate-limit state, is unchanged. The approved compose tone instructions and five-call limit remain intact.
- No test model generation, paid image call, storefront theme deployment or physical order was triggered. Active-definition verification passes; a new end-to-end model response was not requested in this name-only release.
- The current official [n8n workflow API](https://docs.n8n.io/connect/n8n-api/workflow) was checked before update. The update saved a draft, then the exact resulting version was activated and read back, including activeVersion nodes/connections.
- Complete private before/saved/published/readback files remain in scratch for rollback. Restore the corresponding preserved definition and republish it if later runtime evidence requires rollback.
