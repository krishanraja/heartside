# v3 launch, round two: Cowork report for Claude Code (14 Oct 2026)

Part A is done. Parts B and C wait for Krish's "go live" on Sunday 18 October and his real order. Part D runs in launch week.

## Part A

**1. Teeinblue form order: done.** I did it myself in each artwork's form "Re-order" mode, using the drag handles. Then I checked each campaign preview after a fresh load:

- Blanket (1043153) and Print (1043167): `Your dog's photo`, `Dog's name`, `Line 1`, `Line 2`, `Line 3`, `Line 4`, `Signed`
- Ornament (1043174): `Your dog's photo`, `Dog's name`, `Line 1`, `Signed`
- Mug (1043122): `Your dog's photo`, `Line 1`, `Line 2`, `Line 3`, `Signed`. The round-two prompt didn't list the mug, but the original spec puts the photo first, so I moved it to match the other three.
- Labels are unchanged. Saving an artwork doesn't open Teeinblue's Update dialog, so nothing was pushed to Shopify. All four products are still Draft with their approved descriptions, and none was updated after 13:15 UTC.

**2. Teeinblue plan: nothing to choose, nothing lapses.**

- **Plan:** "Blue", **$49/month**. It is already approved and **Active** through Shopify billing on heartside.io. It shows as "Current plan" in the portal (Subscriptions > Manage).
- **Trial:** ends **Oct 19, 2026**. The portal shows the next bill date as Oct 18. Billing then starts on its own; Shopify's billing docs say "billing begins after any trial period expires" for an approved subscription.
- **Per-item fees, on Teeinblue products, counted per month across stores:**
  - $0 for orders 1 to 100
  - $0.40 per item for orders 101 to 1,000
  - $0.20 per item for orders 1,001 to 10,000
  - $0.10 per item above that
  - This cycle's usage so far: 1 order, $0.
- **If it lapsed** (only if someone cancels or uninstalls): Teeinblue's help article says cancelling ends the subscription immediately on Shopify, and uninstalling cancels it. Designs are kept for a reinstall, but left-over theme code may remain. It doesn't spell out storefront behaviour. In practice the personalizer and print-file generation are the paid service, so live products would lose their personalizer and new orders wouldn't get print files. **Recommendation: leave it as is.**
- **Krish's decision:** none needed. It's already approved; flagged so the $49 charge on his Shopify bill isn't a surprise.

**3. Gemini budget:** reminded Krish once. Flash-lite is $0.25 per million input tokens and $1.50 per million output tokens, and one chat is at most 8 short calls. Nothing created.

**4. The chat, re-checked on desktop and at phone size** (iPhone 13 viewport, 390 px). Run 1 used chips only (Kuku for Sam); run 2 used "Something else" with Linda named (Biscotti for Linda). Screenshots are in `heartside-chat-check-2/` (desktop and phone).

- **Pass. Biscuit's questions and chips never say "you":**
  - "Biscotti makes sure Linda sits down for a rest. How long does Biscotti howl until Linda sits?" with chips "Just a minute", "Five minutes", "Until she sits".
  - On desktop: "Does he howl until Linda sits on the sofa every time?" with chips "Every time", "Only after work", "When she has a bag".
  - The explainers name Linda: "Biscotti prefers the couch for naps with Linda."
- **Pass. The gift lines say "you" and never the person:**
  - Run 2: "He howls until you sit on the sofa." / "Guards your slippers on the bottom stair." / "Naps best when you are there." / "Your best friend, no contest."
  - Run 1: "Waits at the door for you, weekends too." / "Steals your side of the bed." / "Will ride anywhere, as long as it's with you." / "Your best friend, no contest."
- **Pass. Desktop header** no longer overlaps the menu.
- **Pass. Phone layout:** no horizontal overflow on any step (scroll width 390 = viewport). Nothing cut off.
- **Pass. AI speed:** typed answers came back in 1.6 to 3.0 s.
- **Pass. Picker pricing:**
  - Ornament alone shows $24 ("Add to cart · $24").
  - With the mug it shows $19 ("Add 2 gifts to cart · $48").
  - Every gift still says "not in the shop yet", as expected while Draft.
- **Reveal tabs vs the Teeinblue print files.** All four now match in layout: print and blanket are centered photo, name in normal case, four lines, signature; the ornament has name, line and "Love, [dog]"; the mug has photo left and words right. Two small differences:
  1. **Paw position.** The reveals put the paw inline, right of the signature. The print files put it centered below the signature on the blanket, print and ornament, and left of the signature on the mug.
  2. **"He howls…"** A typed answer produced a line starting "He" in a note signed by the dog, while the chip lines drop the subject ("Waits at the door…", "Guards your slippers…"). The n8n rules could strip a leading He/She so typed lines match.

## Part B, Part C: not started

Waiting for Krish's "go live" on Sunday 18 Oct, and his real order.

## Part D: launch week

Not started. The daily fallback-rate check on the n8n "Heartside AI calls" table and the mid-week Gemini spend check begin on launch day.

## Unsure or skipped

- The mug's form order was outside this round's list; I changed it to match the spec (photo first).
- The trial-end date: the portal shows both "trial ends Oct 19" and "next bill Oct 18". Either way, the first $49 lands on the Shopify bill around launch day.
