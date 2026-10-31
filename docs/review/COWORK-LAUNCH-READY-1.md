# Claude CoWork: launch ready, part 1 (Printful settings and the automation's credentials)

Status: ASSIGNMENT, not a result. Written 31 October 2026 for Krish to run in CoWork on his own computer. The plan is `docs/review/LAUNCH-READY-2026-10-31.md`; read it first. Work only from `main` of `krishanraja/heartside`. **This replaces `COWORK-NOTE-SLIP-TEST.md`**: Krish will test as a real customer once the store is launch ready, so do not place any order in this run.

## Why this exists, in Krish's terms

Krish wants to order a mug and a blanket with the dog's note as an ordinary customer, and have it arrive with nobody touching it. The Claude Code session is building an n8n workflow that writes the note onto each Printful order's packing slip and then confirms the order. This run gives that workflow what it needs, and sets the one Printful option Krish approved. Krish's yes covers exactly these steps.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027.

## Rules that hold for the whole run

- **Secrets.** Never paste a token into this chat, the report, a screenshot, a file or the repository. Copy each token straight from where it is shown into the n8n credential form, then close the page. If one is ever exposed, say so and revoke it.
- Never put a credential, the store handle, a theme id, a Teeinblue campaign id, a Printful id, an order number, a customer's name or address, or Krish's personal email in the report or in any file you save. Use hello@krishraja.com where a contact is needed.
- **No orders.** Never place, confirm or cancel an order. Never press Update in Teeinblue in this run.
- Stop and ask Krish, in this chat, before each step marked **STOP**. A yes covers that one step only.
- For every setting you change, record before and after with a screenshot.

## Steps

1. **STOP: backup facilities off.**
   - Show Krish the setting: Printful, Settings, Orders, the Heartside store, "Fulfill my orders at a backup facility", currently ON.
   - After his yes, switch it OFF, save, and read it back.
   - Leave everything else on that page as it is.

2. **STOP: a Printful API token for the automation.**
   - In Printful, open Developers (developers.printful.com, signed in as Heartside's account) and create a **private token**:
     - **name:** "Heartside n8n note and confirm";
     - **store:** Heartside;
     - **scopes:** orders (read and write) and files (read and write), only those, plus whatever Printful requires to read the store's products.
   - Show Krish the scopes before creating it.
   - **Do not** reuse or rotate the key that Teeinblue's Printful connection uses. That key stays as it is.

3. **STOP: put the token in n8n.**
   - In n8n, Credentials, create a "Header Auth" credential:
     - **name:** `Printful - Heartside orders`;
     - **header name:** `Authorization`;
     - **value:** `Bearer ` followed by the token.
   - Save it, and confirm the credential list shows the name. Report the name only.

4. **STOP: Shopify read access for n8n.**
   - n8n needs to read orders and their line properties.
   - In Shopify admin, Settings, Apps and sales channels, Develop apps, create a custom app named "Heartside n8n orders" with only the Admin API scope `read_orders`, and install it.
   - In n8n, create a "Header Auth" credential:
     - **name:** `Shopify - Heartside orders (read)`;
     - **header name:** `X-Shopify-Access-Token`;
     - **value:** the app's Admin API access token.
   - Report the names only.

5. **Read back (no changes).**
   - In Printful, Settings, Orders: "Manually confirm imported orders" is ON and "Import personalized orders as drafts" is ON. Both stay on: the workflow is what confirms.
   - In Teeinblue, Fulfillment Providers: auto confirm is OFF. Report both.

## Report

Return:
- step 1's before and after;
- the two credential names in n8n and the token's scopes (never the values);
- the read-backs in step 5;
- anything you skipped and why.

Say plainly what is verified by readback.

Krish brings the report back to the Claude Code session, which builds and tests the workflow against these credentials.
