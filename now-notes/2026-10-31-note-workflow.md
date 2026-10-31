Status: Built in n8n, dry run, not switched on: "Heartside: dog note on the packing slip, then confirm" (n8n/NOTE-AND-CONFIRM.md). The Printful token and the Shopify app's client credentials both work; Printful accepted a gift message on the never-confirmed cost-quote draft and read it back; the decision logic passed on simulated orders, and a live dry run touched nothing.

Changed: Teeinblue's Printful drafts carry the Shopify order name as their external id, which links each draft to its paid order and its note. Orders confirm only after startAfter (31 Oct 2026 15:20 UTC), so the old test drafts are never charged.

Next: give n8n an email credential for failure alerts, add the printed card item with the 3 December cutoff, then set dryRun false and activate at release.

North Star check (2026-10-31): holds.
