# Claude CoWork: the Christmas date in the shipping policy

Status: ASSIGNMENT, not a result. Written 5 November 2026 for Krish to run in CoWork on his own computer, logged in to Shopify admin. One change in Shopify admin, read back on the live store. Nothing else.

Krish approved this change up front by starting this run, so do not stop to ask him. If the policy does not read as quoted below, change nothing and say what you found.

## Why this exists

The photo-first journey went live on heartside.io on 5 November. The site says "Order by December 4 for Christmas delivery to a US address." The shipping policy still says "We will publish a last order date for Christmas delivery on the site once our print partner confirms it", and calls the day "25 December" on a US store. Two of eleven test buyers read the policy first and saw the two disagree. The connector Claude Code uses cannot write policies, so this is done in admin.

December 4 is Krish's date. It is early on purpose: at the policy's slowest times (5 business days to print, then 7 to deliver), an order placed on Friday 4 December arrives by Tuesday 22 December.

## The change

1. In Shopify admin, open Settings, then Policies, then Shipping policy.
2. Find the paragraph that starts with **Christmas.** It reads exactly: "We will publish a last order date for Christmas delivery on the site once our print partner confirms it. Orders placed after that date may arrive after 25 December."
3. Replace that whole paragraph, keeping **Christmas.** in bold at its start, with exactly:

   > **Christmas.** Order by December 4 for Christmas delivery to a US address. Even at the slowest times above, an order placed on December 4 arrives by December 22. Orders placed later may arrive after December 25.

4. Change nothing else in the policy. Save.

## Read back

Open `https://heartside.io/policies/shipping-policy` in a private window. If it still shows the old text, wait a minute and reload once.
- The Christmas paragraph reads exactly as in step 3.
- The paragraph before it still says printing usually takes 2 to 5 business days and delivery another 3 to 7.
- The words "once our print partner confirms it" appear nowhere on the page.

If the read-back fails, correct the paragraph in admin and read back again. If it cannot be corrected, put back the original paragraph quoted in step 2, save, and report it.

## Never, in this run

- Change any other policy, product, photo, price or setting.
- Place an order, use a real card, or touch a real customer's order.
- Send a message to a customer or a vendor.

## The report

Plain sentences, brought back to the Claude Code session: done or not, the Christmas paragraph exactly as heartside.io shows it, and anything that did not match this prompt.
