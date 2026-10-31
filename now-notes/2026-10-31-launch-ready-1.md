Status: CoWork launch-ready part 1 is done (docs/evidence/2026-10-31-launch-ready-1-report.md). Printful backup facilities are OFF on Krish's yes; manual confirm and drafts stay ON. The Printful token sits in the n8n credential "Printful - Heartside orders", pasted by Krish. Shopify read access is a Dev Dashboard app "Heartside n8n orders" (read_orders only, installed), which issues 24-hour tokens through the client credentials grant, so the workflow exchanges a client id and secret for a token on each run.

Changed: The checkout warning from 29 October sits beside two active cart transforms, Teeinblue's add-on price and the Function Studio merge that shows the buyer's design at checkout; a full personalised checkout, stopped before payment, is the next check. The Printify app no longer appears in Shopify's installed apps; this run did not remove it.

Next: Krish adds the Shopify client id and secret to n8n as a Custom Auth credential; then the note-and-confirm workflow is built and checked against a Printful draft that is never confirmed.

North Star check (2026-10-31): holds.
