> **Historical.** Archived 2026-10-27. Not current guidance.
> Replaced by: NOW.md, docs/SCOPE.md and docs/ECONOMICS.md.
> Reason: records a superseded product, price, execution plan or source state.

# Prompt for Claude Cowork: the v3 launch, round two (14 October)

Paste everything below the line into a Cowork session on Krish's computer, with these tabs open and logged in:

1. Shopify admin, Products: https://admin.shopify.com/store/bnf1em-ge/products
2. Teeinblue (Shopify admin > Apps > Teeinblue Product Personalizer)
3. Teeinblue billing or plan page (the trial ends 19 October)
4. Printful dashboard, Orders: https://www.printful.com/dashboard
5. Shopify admin, Discounts: https://admin.shopify.com/store/bnf1em-ge/discounts
6. n8n, the call log: https://krishraja10101.app.n8n.cloud (Overview > Data tables > **Heartside AI calls**)
7. Google Cloud billing, budgets: https://console.cloud.google.com/billing (project gen-lang-client-0658374983)
8. The new journey, hidden until Sunday: https://heartside.io/?view=gifts
9. The spec: https://github.com/krishanraja/heartside/blob/main/docs/V3-GIFTS-FROM-YOUR-DOG.md

---

You're working in Krish's browser on **Heartside** (Shopify store `bnf1em-ge`, heartside.io, live and public). On **Sunday 18 October 2026** it relaunches as "gifts from your dog". You did Parts A to E of the first prompt on 14 October. Thank you: the four products, the $19 ornament, the privacy paragraph and the pixel are all in place.

## What Claude Code did with your report (14 October)

- **The chat now links to your four products** (`the-morning-mug`, `the-couch-blanket`, `the-framed-print`, `the-tree-ornament`) and shows the ornament at **$19 with another gift**. While the products are Draft, their pages don't open on the storefront, so the full path to a product page can only be tested once they're Active on Sunday.
- **Desktop header overlap:** fixed. The title no longer sits under the menu.
- **The reveal now draws each gift as Teeinblue prints it:**
  - Print: the name in normal case, and the signature inside the frame.
  - Blanket: centered photo, the dog's name, four lines and the signature.
  - Ornament: now has "Love, [dog]" with the paw.
  - Mug: has the paw too.
- **"Change a word"** now allows 45 characters, the same as Teeinblue.
- **Wrong "you" from the AI:** fixed in n8n and checked live with Biscotti for Linda.
  - Biscuit's questions, chips and reasons now name the person ("Is the sofa where Linda always sits?", chip "Until she sits").
  - Only the gift lines say you ("Howls until you sit on the sofa.").
  - The rules also reject a gift line that names the person.
- **Photo required:** no change needed. The product page asks for it before Add to cart, as you said.
- **Variant titles in the cart** (Printful's base names): the cart shows each option on its own line. It already hides the "Available Product" option that carries Printful's base name, and shows the frame color as "Frame". Check it in the real cart on Sunday (Part B).

**Don't touch theme code or the theme editor:** the next deploy would overwrite it. Anything the theme needs, report back and Claude Code adds it.

Krish is at the keyboard. When a page needs a login, a code, a card or a button only the account owner may press, stop and ask him, then carry on.

## Hard rules (unchanged)

- **Ask Krish first, and wait for a clear yes,** before anything that spends money, publishes, deletes, or changes prices, discounts, policies, checkout, payments, taxes, domains or permissions. Name the exact action before you ask.
- **Teeinblue "Update" overwrites Shopify.** Untick Description, Images, Title and Tags on every Update, every time.
- **Teeinblue "Auto confirm order" stays off,** and Printful stays on manual confirm.
- **No orders,** except the one real order Krish places himself in Part C. Carts are fine; empty them afterwards.
- **Honesty.** No invented reviews, counts, dates or scarcity.
- **Copy:** no em dashes, no exclamation marks in body copy, US spelling. Customer email is krish@heartside.io.

## Part A: Before Sunday (any day this week, about 30 minutes)

1. **Teeinblue form order (tab 2).** Ask Krish to drag the fields into this order in each artwork editor. The site fills fields by label, so this is only how the form looks to a buyer:
   - Blanket and Print: `Your dog's photo`, `Dog's name`, `Line 1`, `Line 2`, `Line 3`, `Line 4`, `Signed`.
   - Ornament: `Your dog's photo`, `Dog's name`, `Line 1`, `Signed`.
   - Keep every label exactly as it is now.
   - If he saves with Update, untick all four boxes.
2. **Teeinblue trial (tab 3).** The trial ends **19 October**, the day after launch. Report:
   - which plan the store needs to keep the personalizer working;
   - its monthly price;
   - what happens to live products and open orders if the trial lapses.
   - Choosing a plan is a spend: show Krish and wait for his yes. Don't let it lapse silently.
3. **Gemini budget (tab 7).** Krish said he sets this himself. Remind him once, with the numbers from your report:
   - flash-lite costs $0.25 per million input tokens and $1.50 per million output tokens;
   - one chat is at most 8 short calls.
   - Create nothing unless he asks.
4. **The chat on tab 8, once more, on desktop and a phone-size window.**
   - Run 1: chips only.
   - Run 2: "Something else" with a typed answer that mentions the person by name (for example, Biscotti for Linda: "he howls until Linda sits on the sofa").
   - Check that Biscuit's question and chips say Linda, she or he, never you.
   - Check that the gift lines say you and never Linda.
   - Check each reveal tab against your Teeinblue test files.
   - Report anything wrong, with a screenshot.

## Part B: Sunday 18 October (only after Krish says "go live")

Don't do any of this before Krish says "go live" on Sunday. Do it in this order:

1. **On Krish's yes, set the four gifts to Active** on the Online Store (tab 1).
2. **Tell Claude Code** to swap the homepage. It copies the chat template over `index.json` (keeping the old one as `index.classic.json`) and deploys. Wait for it to say the deploy finished.
3. **On Krish's yes, set to Draft:**
   - The Annual Review, The Annual Review Framed, The Body Double, and Tiny Me, For The Tree.
   - This hides them without deleting them or their reviews.
   - The Uniform and Socks stay paused.
4. **Real cart test** on heartside.io (no checkout):
   - Mug + Ornament: the ornament shows $19.
   - Ornament alone: $24.
   - Check the cart line titles read cleanly; report any Printful variant names that show.
   - Empty the cart afterwards.
5. **The chat to a product page:**
   - Go from heartside.io through the chat to two gifts.
   - On each product page, check that the Teeinblue fields hold the lines, "Love, [dog]" and the dog's name, and that the preview looks right.
   - Don't add a photo of a real customer's dog; use Biscuit's headshot or any stock dog photo Krish provides.
6. **Real phones.** Ask Krish to open heartside.io from a link in:
   - the **Instagram** app on an iPhone;
   - the **Facebook** app on an Android phone.
   - Have him go through the chat to a product page and add a photo there.
   - Report anything cut off, slow or broken, with screenshots.

## Part C: The real order (spec 11.5, Krish places it and approves the spend)

1. Krish places one real order with **at least two gifts**, one of them the ornament (so the $19 discount is tested at checkout).
2. Check, and report:
   - the Shopify order carries `_hs_answers`, `_hs_lines` and `_hs_ship_to`;
   - it reaches Teeinblue;
   - it reaches Printful as a **draft** (not confirmed) with the right print files (lines, signature, name, photo, nothing clipped).
3. Don't confirm it in Printful unless Krish says so.

## Part D: Launch week (a few minutes a day)

- **n8n call log (tab 6), table "Heartside AI calls".**
  - Each day, count rows with `source` = `fallback` or `slow` = true, over all rows.
  - Above about 1 in 10, tell Claude Code with the times and the `step` and `model` columns.
- **Gemini spend (tab 7):** report the project's spend once mid-week.
- **The heart ornament** stays out for launch. Ask Krish after launch week whether to add it.

## Report back

Paste this into the Claude Code session:

- **Part A:** form order done, yes or no; the Teeinblue plan, price and Krish's decision; the chat re-check, with anything wrong.
- **Part B:**
  - the time the products went Active;
  - which products you set to Draft;
  - the cart test result (prices, and the cart line titles);
  - the product page check;
  - the phone results, with screenshots.
- **Part C:** order number, what reached Teeinblue and Printful, and the print files.
- **Part D:** the daily fallback rate and the spend.
- **Anything you were unsure about, or skipped, and why.**
