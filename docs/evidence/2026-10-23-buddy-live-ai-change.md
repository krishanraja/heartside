# Buddy rename in the live AI workflows

Prepared on 23 October 2026. The approved tone update remains active.

Target: krishraja10101.app.n8n.cloud, Heartside only.

| Workflow | Current active version | Exact changes |
|---|---|---|
| Compose gift lines, 28WZgPmgTaY33KY3 | f67b2a25-aac8-48d9-8f61-586e00a25903 | Replace Biscuit with Buddy in workflow name, Enforce rules.jsCode and Gemini backup.options.systemMessage |
| Typed answer, ryyzdxv8SBm5HTjP | 08d63b62-216d-46c9-8e46-04b382831059 | Same three fields |

The compose primary reads the same system instructions as its backup, so this changes both model paths. The character, tone instructions, existing five-call compose limit, models, credentials, nodes, connections, settings, triggers, error paths and idempotency behavior are unchanged. No test generation or other external side effect is authorized by this rename proposal.

Rollback: complete current saved definitions are preserved privately in C:\Users\krish\.scratch\heartside-buddy-<workflow-id>-before.json. Restore and republish the corresponding prior definition if readback fails.

Before update, re-read both active versions and stop if either differs. After publication, compare the six intended fields, every unchanged workflow field, and active definitions. Publishing remains pending explicit approval required by the n8n operating skill.

Prepared definition SHA-256:
- Compose: 7cda662fb5a1eb8ce61f64ea1e679348d62f458902101595d33dd09e869adc3a
- Typed answer: 75c20cdbdf3f4f594ed8de726c323058abdc340bb244c28e00f241cc45800b13
