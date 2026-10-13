# Prompt for Claude Cowork: everything left before the v3 launch (13 October)

Paste everything below the line into a Cowork session on Krish's computer, with these tabs open and logged in:

1. Shopify admin, Products: https://admin.shopify.com/store/bnf1em-ge/products
2. Teeinblue (Shopify admin > Apps > Teeinblue Product Personalizer)
3. Printful dashboard: https://www.printful.com/dashboard
4. Shopify admin, Discounts: https://admin.shopify.com/store/bnf1em-ge/discounts
5. Shopify admin, Policies: https://admin.shopify.com/store/bnf1em-ge/settings/legal
6. Shopify admin, Customer events: https://admin.shopify.com/store/bnf1em-ge/settings/customer_events
7. Shopify admin, Shipping: https://admin.shopify.com/store/bnf1em-ge/settings/shipping
8. Google AI Studio, API keys and usage: https://aistudio.google.com/apikey
9. Google Cloud billing, budgets: https://console.cloud.google.com/billing
10. n8n, the two Heartside workflows: https://krishraja10101.app.n8n.cloud/workflow/ryyzdxv8SBm5HTjP and https://krishraja10101.app.n8n.cloud/workflow/28WZgPmgTaY33KY3
11. The new journey, hidden until Sunday: https://heartside.io/?view=gifts
12. The spec: https://github.com/krishanraja/heartside/blob/main/docs/V3-GIFTS-FROM-YOUR-DOG.md

---

You're working in Krish's browser on **Heartside** (Shopify store `bnf1em-ge`, heartside.io, live and public). On **Sunday 18 October 2026** it relaunches as "gifts from your dog": a buyer chats with Biscuit, an illustrated dachshund, about their dog and the person it loves. The answers become four short lines, which go on any of four gifts that Printful makes through the Teeinblue personalizer. Read sections 3, 6 and 12 of the spec (tab 12) before you start.

Claude Code has built and deployed the chat as a hidden page (tab 11) and switched on the AI (two n8n webhooks, tab 10). **Don't touch theme code or the theme editor:** the next deploy would overwrite it. Anything the theme needs from you, report back and Claude Code adds it.

Krish is at the keyboard. When a page needs a login, a code, a card or a button only the account owner may press, stop and ask him, then carry on.

## Hard rules

- **Ask Krish first, and wait for a clear yes,** before anything that spends money, publishes, deletes, or changes prices, discounts, policies, checkout, payments, taxes, domains or permissions. Name the exact action before you ask.
- **Teeinblue "Update" overwrites Shopify.** Its Update dialog pushes Description, Images, Title and Tags by default. Untick all four on every Update, every time.
- **Teeinblue "Auto confirm order" stays off,** and Printful stays on manual confirm. That is the "a person checks every order" promise.
- **Don't hide the old products yet.** The live homepage still sells The Annual Review until Sunday. Part F is for Sunday.
- **No orders.** Carts are fine; empty them afterwards.
- **Honesty.** No invented reviews, counts, dates or scarcity. A product fact goes in only if it's true of the real Printful product.
- **Copy:** no em dashes, no exclamation marks in body copy, US spelling. Customer email is krish@heartside.io.

## Part A: The four gifts in Teeinblue (the big one, about 90 minutes)

Create one Teeinblue campaign per gift, each publishing a Shopify product. Prices were approved by Krish on 13 October.

| Product title | Printful product | Price |
|---|---|---|
| The Morning Mug | #403 White Ceramic Mug with Color Inside, 11 oz, Pink inside | $29 |
| The Couch Blanket | #711 Sublimated Sherpa Blanket, 50x60 in | $89 |
| The Framed Print | #2 Enhanced Matte Paper Framed Poster, 12x18 in, black, white and red oak | $89 |
| The Tree Ornament | #900 Ceramic Ornament, two-sided (circle, and heart if offered) | $24 |

**The fields.** The site fills them by their labels, so the labels must be exactly these, and the lines must be in this order:

| Gift | Fields, in order |
|---|---|
| Mug | Photo; `Line 1` (home); `Line 2` (spot); `Line 3` (meaning); `Signed` |
| Blanket | Photo; `Dog's name`; `Line 1` (home); `Line 2` (spot); `Line 3` (together); `Line 4` (meaning); `Signed` |
| Framed Print | the same as the blanket |
| Ornament | front: Photo and `Dog's name`; back: `Line 1` (meaning) and `Signed` |

- **Type:** Courier Prime for the lines; Fraunces italic in chestnut (#8A4A2B) for `Signed`; Fraunces for the dog's name. The font files are in the repo under `tools/fonts/`.
- **Layout:** the approved mockups are the reveal screens on tab 11 and the prototype in the spec (section 4.3). The words sit next to or under a round photo, signed "Love, [Dog]" with a paw.
- **The fit test (spec 11.3).** In each campaign's preview, type the longest real case:
  - Dog's name: `Bartholomew Jr`
  - Lines: `Waits at the door for you, every single day.`, `Steals your side of the bed, then the duvet.`, `Will ride anywhere, as long as it's with you.` and `Your best friend, no contest.`
  - Signed: `Love, Bartholomew Jr`
  - Then the shortest case: `Kuku`, `Yours, always.`, `Love, Kuku`.

  Note that `Will ride anywhere, as long as it's with you.` is 45 characters. It is the approved chip line for car rides, so every template must fit 45.

  Download Teeinblue's print file at full size for each gift and check that nothing clips, wraps badly or shrinks below a readable size. Save the files.
- **Shopify side:** set each product's theme template to **gift** (product page > Theme template). Put it in the free US shipping profile (tab 7). Write a short, true description in plain words; Krish approves it before it goes on.
- Don't publish a product to the Online Store until Krish says yes. Draft is fine.

## Part B: Make the AI stable (about 20 minutes)

1. **Gemini billing tier (tab 8).** Find the project behind the Gemini key that n8n uses (n8n credential "Google Gemini(PaLM) - Heartside"). Report its tier: free, or paid tier 1 or higher. Report its rate limits for `gemini-3.1-flash-lite` (requests per minute and per day). The free tier can throttle on launch day once ads run, and every throttled call falls back to the buyer's own words. If it's free, ask Krish whether to turn on billing. That spends money, so wait for his yes.
2. **Budget alert (tab 9).** On Krish's yes, create a budget on that billing account with alerts at 50%, 90% and 100%. Suggested amount: $25 a month. One chat uses at most 8 short calls, well under a cent in total at flash-lite prices; check the price on the page and report it.
3. **Key restriction (tab 8, or Google Cloud > Credentials).** If the key has no API restriction, restrict it to the Generative Language API only. Don't rotate or delete it: n8n uses it.
4. **n8n (tab 10).** Open each workflow's Executions and report the last 20: status, and the time each took. Don't edit or switch anything off.

## Part C: The $19 ornament (about 10 minutes, Krish approves)

Spec section 3: the ornament is $24 alone and $19 with another gift. The site shows $24 until a real discount exists.

- Propose to Krish: an automatic **Buy X get Y** discount named "Ornament with another gift". The customer buys 1 of The Morning Mug, The Couch Blanket or The Framed Print, and gets The Tree Ornament at $5 off. Limit it to one use per order, with no end date.
- On his yes, create it and test it in a cart: add the mug and the ornament and check the ornament line shows $19. Empty the cart afterwards.
- Report the exact settings.

## Part D: Privacy policy (about 10 minutes, Krish approves the words)

Spec section 7 says the page tells buyers that typed answers go to an AI service. The privacy policy must match. Propose adding this paragraph to Settings > Policies > Privacy policy, under the section on what we collect:

> **Answers you type to Biscuit.** When you type your own answer in the chat on our site, we send that text, your dog's first name and the first name of the person the gift is for to Google's Gemini AI service, through our automation provider n8n, to write the words for your gift. We don't send your email, address or payment details. Answers you pick from the buttons aren't sent anywhere. The words you choose are saved with your order so a person can check it before it prints.

Show it to Krish. On his yes, add it and save. Report the final wording.

## Part E: Checks Claude Code can't do from its side (about 20 minutes)

1. **Christmas date (spec 4.4).** In Printful, read the last order date for US Christmas delivery for each of the four products. The site says "Order by Dec 10 for Christmas". Report each product's real date.
2. **Costs.** Read each product's base price and US first-item shipping in Printful, and report them against the table in spec section 3.
3. **Funnel pixel (tab 6).** If a custom pixel named "Heartside funnel" exists, report whether it's connected. Claude Code updated its code to forward the new chat events (`hs3_step` and the others). If it's installed, paste in the new file from https://github.com/krishanraja/heartside/blob/main/shopify/pixels/hs2-funnel.js on Krish's yes, then report.
4. **The chat on tab 11.** Go through it once with chips only and once using "Something else". Report anything that looks wrong, with a screenshot. It can't reach a product page until Part A is done.

## Part F: Sunday 18 October only (Krish's go-live approval first)

Don't do any of this before Krish says "go live" on Sunday.

1. Claude Code swaps the homepage to the chat, and sets the four product handles from Part A in the chat section.
2. Then, on Krish's yes: set The Annual Review, The Annual Review Framed and The Body Double to **Draft**. That hides them without deleting them or their reviews. The Uniform and Socks stay paused.
3. Krish places one real order with at least two gifts (spec 11.5; he approves the spend). Check that it reaches Teeinblue and then Printful as a draft, with the right print files. Report what you see.

## Report back

Paste this into the Claude Code session:

- **Part A:** each product's title, handle, price, Teeinblue campaign id and field labels exactly as typed. The fit-test result per gift (pass or fail, with the print file names). Template and shipping profile set, yes or no.
- **Part B:** Gemini tier and rate limits; whether billing and a budget were set (and the amount); whether the key is restricted; the n8n execution statuses and times.
- **Part C:** discount created, yes or no, with its exact settings and the cart test result.
- **Part D:** policy updated, yes or no, and the final wording.
- **Part E:** the Christmas date and costs per product; the pixel state; anything wrong in the chat.
- **Anything you were unsure about, or skipped, and why.**
