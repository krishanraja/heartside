# n8n: the Shopify Admin call that saves nothing

The workflow "Heartside: Shopify Admin call (saves nothing)" runs in n8n. It is a helper workflow: the four order workflows call it whenever they need Shopify, and nothing else can.

- `SEND-TO-PRINTFUL.md`
- `NOTE-AND-CONFIRM.md`
- `PRINTED-CARD.md`
- `MARK-FULFILLED.md`

**Built:** 10 November 2026. **State:** built and tested, not yet published. It goes live together with the four workflows' new versions, on Krish's go.

## Why it exists

Each of the four workflows used to start with an HTTP Request node called "Shopify token". That node posted the client id and secret from the n8n credential `Shopify - Heartside orders (client)` and received a 24-hour Admin access token. n8n saves every node's output in the execution data, so every saved run held that token in plain form (`docs/evidence/2026-11-10-fulfillment-and-thumbnails/REPORT.md`, "Execution log hygiene"). Redacting execution data needs a paid n8n plan.

Turning off saving for successful runs was not enough, because failed runs still saved the token, and failed runs are the ones we need for debugging.

Two other routes were weighed and turned down:
- **A Code node that fetches the token and calls Shopify.** n8n Code nodes cannot read credentials, so the client secret would have had to be written into the code.
- **An n8n credential type that fetches the token itself** (a generic OAuth2 credential with the client-credentials grant). Krish would have had to type the secret into a new credential. That credential sends the token as `Authorization: Bearer`, while the header Shopify documents for the Admin API is `X-Shopify-Access-Token`, so it would need testing first. It stays the fallback if this helper ever has to go.

## What it does

The trigger "Called by a Heartside workflow" takes three inputs:

- `query`: the GraphQL query or mutation;
- `variables`: its variables;
- `full`: whether to return the status code as well as the body.

Then:

1. **Shopify sign-in** posts the existing credential to Shopify's token endpoint. The token never leaves this workflow.
2. **Shopify GraphQL** sends the call with the token in `X-Shopify-Access-Token`. Both HTTP nodes never throw, so an HTTP error object (which can carry request headers) is never built.
3. **Answer without the token** returns only Shopify's answer:
   - if the sign-in was refused, it fails with "Shopify sign-in was refused: HTTP <status>" and nothing else;
   - with `full` true it returns `{ statusCode, body }`. "Mark fulfilled in Shopify" uses this, and so does "Did Shopify take it?", unchanged;
   - otherwise it returns the body. On a non-2xx answer it fails with the status and the first 300 characters of the body, as the old HTTP nodes did.

## Settings that keep the token out of every saved run

- Save failed production executions: **Do not save**.
- Save successful production executions: **Do not save**.
- Save manual executions: **off**. Save execution progress: **off**.
- This workflow can be called by: only the four order workflows, by id.

A calling workflow's saved run shows the helper's answer and a link to a sub-execution that was never stored. The calling workflows keep their own saving settings, so failed runs stay saved for debugging, now without the token.

If the token needs debugging, run the helper by hand in the n8n editor. Nothing is saved: the editor shows the run, and then it is gone.

## Checked on 10 November 2026

All runs were manual test executions of the new drafts. The published versions were not touched. In every failed run below, the token was really fetched before the failure. Each saved run was read back in full, with no `access_token` key and no Shopify token in any node's data or in the error.

| Workflow | Failed on purpose | Read back | Working run, pinned data |
|---|---|---|---|
| Send to Printful | 53678: a malformed pinned Printful list made "What to send" throw after the real Shopify read | no token | 53680: a synthetic paid order became a Printful draft body and reached the (pinned) send |
| Note and confirm | 53687: a temporary Stop and Error node after the real per-draft Shopify read, removed afterwards | no token | 53681 and 53689: the real order lookup through the helper built the note and reached the (pinned) note and confirm |
| Printed card | 53692: a temporary Stop and Error node after the real Shopify read, removed afterwards | no token | 53695: a synthetic card order became a four-panel Printful card order at the (pinned) create |
| Mark fulfilled | 53696: a temporary Stop and Error node after the real Shopify read, removed afterwards | no token | 53698: a synthetic shipped order became a fulfillment with tracking; a pinned Shopify refusal reached the (pinned) email |

- **The helper saved nothing.** Its sub-executions (53679, 53688, 53693, 53697) do not exist, and the helper's execution list is empty.
- **Item pairing holds.** The per-item calls ("Shopify order" in the note workflow, "Mark fulfilled in Shopify") run once per item, so `$('…').item` downstream still finds its order (53681, 53698).
- **Not exercised:** a real fulfillment write through the helper (`full: true`). Its path is the same sign-in and GraphQL call. The first real shipment after publication is the end-to-end proof.

## Already-saved runs

Runs saved before the switch still hold old tokens. Each token expired 24 hours after it was issued, so they no longer open the store. They can be deleted in n8n once Krish approves the deletion.

The store's myshopify address and the n8n address appear only inside n8n, never here: both are on the never-publish list.
