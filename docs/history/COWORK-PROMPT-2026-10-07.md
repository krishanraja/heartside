# Prompt for Claude Cowork: everything left before launch (7 October)

Paste everything below the line into the Cowork session. It replaces nothing: part A points at the 6 October prompt, which is still the spec for the Teeinblue work.

---

You're working in Krish's browser on **Heartside** (Shopify store `bnf1em-ge`, heartside.io, live and public, launching **20 October 2026**). Printful makes everything to order through the Teeinblue personalizer. Claude Code owns the theme; don't touch theme code or the theme editor.

Krish is at the keyboard. When a page needs a login, a code, a card or a button only the account owner may press, stop and ask him, then carry on.

## Hard rules

- **Teeinblue "Update" overwrites Shopify.** Its Update dialog pushes Description, Images, Title and Tags to Shopify by default. Untick all four on every Update, every time.
- **Ask Krish first** before spending money, deleting anything, installing an app, or changing checkout, payments, markets, taxes, domains or DNS. Wait for a clear yes.
- **No orders.** Carts are fine; empty them afterwards.
- **Honesty.** No invented reviews, counts, dates or scarcity. If a fact in a description isn't true of the real Printful product, leave that line out and say so.
- **Customer-facing email** is krish@heartside.io.

## Part A: Teeinblue and the product pages (about 45 minutes)

Open https://github.com/krishanraja/heartside/blob/main/docs/COWORK-PROMPT-2026-10-06.md and do **tasks 1 to 5** exactly as written there:

1. Tiny Me: the buyer picks the note on the ring (it still prints the office line).
2. Field labels in the other three campaigns: `Your dog's name` and `Your name` (the live form still says "Employee name (you)" and "Who is your manager?").
3. Our photos back to first position where Teeinblue reordered them.
4. The four product descriptions. All four still show Printful's stock text, and Meta's catalog shows the same text in ads.
5. Capture the new ornament for Claude Code.

## Part B: Meta (about 20 minutes; Krish logs in)

Tonight's status check found: an ad account exists, the Facebook Page is connected to the Shopify Facebook shop, but **the pixel isn't connected to any ad account, the ad account has no payment method, Instagram isn't linked, and only 2 of 4 products are in the catalog** (the ornament and the pillow are missing).

1. **Catalog.** In Shopify admin, open *Tiny Me, For The Tree* and *The Body Double*. Under Publishing / Sales channels, check they're published to **Facebook & Instagram**. If not, add them. Then in Meta Commerce Manager > Catalog > Issues, report any rejection or warning for any of the four products, word for word. Report how many products the catalog shows after a refresh.
2. **Pixel.** In Events Manager, open the Heartside pixel/dataset and connect it to the Heartside ad account (Settings > Connected assets, or Business settings > Data sources > Datasets). Report what it shows afterwards.
3. **Instagram.** Link the Instagram account (@yourdoghasnotes) to the Facebook Page "Heartside: From Your Dog". Krish signs in to Instagram if asked.
4. **Payment method.** Ask Krish to add a payment method to the ad account himself. Don't enter card details. Don't create or fund any campaign.

## Part C: Shipping leftovers (about 10 minutes)

A "Dropshipper-AI Shipping" profile from the old store still holds 31 products.

1. Settings > Shipping and delivery. For each of the four Heartside products (The Annual Review, The Annual Review Framed, Tiny Me For The Tree, The Body Double), report which shipping profile it's in. All four must be in the profile with **free US shipping**. If one isn't, tell Krish and move it on his yes.
2. List the 31 products in the old profile: title and status (active, draft or archived). Ask Krish whether to delete the profile and those products. Delete only on his yes.

## Part D: Ask Krish (no action without his yes)

1. **One real test order** of The Annual Review ($39) to his own address. It proves the whole chain (Shopify > Teeinblue print file > Printful draft > a person confirms > it ships) and it's the physical sample nobody has seen yet. If he says yes, he places it himself; then check it arrives in Printful as a draft with the right print file, and report.
2. **A bundle discount**, if he wants one: what it is (for example 15% off two or more). If he names one, set it up as a Shopify automatic discount and report the exact setting. Don't invent one.

## Report back

Paste this into the Claude Code session:
- Part A: everything the 6 October prompt asks for in its report.
- Part B: catalog count and any issue text; pixel connection state; Instagram linked or not; whether Krish added a payment method.
- Part C: each product's shipping profile; the 31 old products and what Krish decided.
- Part D: test order yes/no and what Printful showed; bundle discount yes/no and the exact setting.
