# Prompt for Claude Cowork: Teeinblue lines and labels, product descriptions (6 October)

Paste everything below the line into the Cowork session.

---

You're working in Krish's browser on **Heartside** (Shopify store `bnf1em-ge`, heartside.io, live and public). It's a US-only dog-gift store launching on **20 October 2026**. Printful makes everything to order through the Teeinblue personalizer. The theme lives in github.com/krishanraja/heartside, and Claude Code deploys it. The last session's report is in Krish's Drive folder: https://drive.google.com/drive/folders/1-a44OHrHtf0IqJOXS9uFGtGWwIcSWYSH

Krish is at the keyboard. When a page needs a login, a code or a button only the account owner may press, stop and ask him to do that step, then carry on.

## Why tonight's work matters

Krish's direction on 5 October:
- "The experience should be the most easy thing on earth."
- On tone: "we make everyone's dog sound like a horrible boss right now… I dont know if I would want something corporate from a dog on my christmas tree."

So the office joke stays on the poster only. The ornament should carry a warm note the buyer picks. Everything else uses plain labels.

The theme now copies the review's answers into Teeinblue and folds Teeinblue's copies away. It finds each field by its label, so the exact labels below matter.

## Hard rules

- **Theme.** No theme code and no theme-editor changes. Anything that needs the theme goes in your report for Claude Code.
- **Ask Krish first.** Before you spend money, install an app, or change checkout, payments, markets, taxes, domains or DNS, ask Krish in this session and wait for his yes.
- **Orders.** Carts are fine; empty them afterwards. Never place an order.
- **Honesty.** No invented reviews, scarcity, counts or dates. Don't fill any `[DATE]`.
- **Email and payments.** Customer-facing email is krish@heartside.io. Payments stay on Shopify Payments.
- **Files.** Save files for Claude Code in the Drive folder above.

## Order of work (it matters)

A Teeinblue campaign update rewrites the product's photos **and** its Shopify description. So do the Teeinblue changes first (tasks 1 and 2), then the photos and descriptions (tasks 3 and 4).

### 1. Tiny Me (campaign 1032885): the buyer picks the note on the ring

Today the ring around the photo always reads "Overall rating: exceeds expectations · Contract renewed. For life." Replace it with a line the buyer chooses.

1. **Add a field labeled exactly `A note from your dog`.** The buyer picks one of these lines, and the chosen line prints on the ring (in place of the current text, same red typewriter style and position):
   - Still my favourite person.
   - Best human. Every single year.
   - Home is wherever you are.
   - I'd pick you again.
   - Merry Christmas from your shadow.
   - Write my own
2. **"Still my favourite person." is preselected.**
3. **"Write my own" opens a text field labeled exactly `Your own note`,** with a limit of **36 characters**. What the buyer types prints on the ring instead.
   - Use Teeinblue's visibility control (show the field only when "Write my own" is picked), if it has one.
   - If Teeinblue can't do the conditional field, offer the five lines only, and say so in your report.
4. **Check the ring in Teeinblue's preview:**
   - with the longest line ("Merry Christmas from your shadow.");
   - with a 36-character custom line;
   - with "Write my own" picked and the field left empty.

   Nothing should overlap the photo or run past the ring. If 36 characters is too long, lower the limit and report the number.
5. **Rename the dog's name field to exactly `Your dog's name`.**
6. **Check what prints on the back.** Teeinblue's base 364797 ("Ceramic Ornaments, 2-Side Print") has a front and a back print area. The site says the ornament is printed the same on both sides. Check whether campaign 1032885 sends the artwork to the back as well as the front, the way the pillow's campaign 1032878 does.
   - If only the front is mapped, show Krish and, on his yes, map the same artwork to the back.
   - Report what you found either way.
7. **Save and update the campaign.**

Labels must be exact. The theme finds the dog's name by "dog's name" and the shopper's by "Your name". Don't use "Your name" or "dog's name" anywhere in the note fields' labels, or the theme will write a name into them.

### 2. Field labels in the other three campaigns

In The Annual Review, The Annual Review Framed and The Body Double, rename:

| Now | New label (exactly) |
|---|---|
| Who is your manager? (Your dog's name) | `Your dog's name` |
| Employee name (you) | `Your name` |

Leave every other label as it is ("Times you opened the treat cupboard", "Area for improvement", "Open incident report", "Known enemy of the company"). They are the poster's own content, and the theme matches them. Save and update each campaign.

### 3. Photos back to first position

After the updates, check each product's Media and drag ours to the front again where Teeinblue reordered them:
- **The Annual Review:** christmas-sheet-a first.
- **The Annual Review, Framed:** office-black-b first, then entry-oak-a.
- **The Body Double:** pillow-sofa-a first.
- **Tiny Me:** nothing of ours yet. Leave it.

The files are at https://raw.githubusercontent.com/krishanraja/heartside/main/design/mockups/ if one needs re-adding: `christmas-sheet-a-4x5.jpg`, `office-black-b-4x5.jpg`, `entry-oak-a-4x5.jpg`, `pillow-sofa-a-1x1.jpg`.

### 4. Product descriptions (Shopify admin > Products > Description)

Teeinblue's "Update" syncs Description, Images, Title and Tags back to Shopify **by default** (found during the 6 October audit-fix session) — untick all of them in the Update dialog before saving any campaign, every time, including tasks 1 and 2 above. If you've already run an Update since reading this, check each product's description before you paste: Teeinblue may have already put Printful's stock text back over whatever's there.

Paste each one exactly, as plain paragraphs with the bullet list as a list. (As of 6 October, all four products still carry generic Printful text — this task hasn't been run yet.)

**Before you paste, check two facts on Printful's product pages and tell Krish:**
- Does the ceramic ornament come with a ribbon or string for hanging?
- Is the framed poster's frame wood, and is the acrylic front standard?

If a fact in a description isn't true, leave that line out and say so in your report.

**The Annual Review**
> Your dog's annual review of you, on a 12 × 18 inch poster. It has your dog's photo, your name and the three notes you pick, printed on thick matte paper.
> - 12 × 18 inches, thick matte paper
> - Frame not included (the framed version is $89)
> - Made to order, and a person checks your design before it prints
> - Free US shipping

**The Annual Review, Framed**
> Your dog's annual review of you, framed and ready to hang. A 12 × 18 inch poster with your dog's photo, your name and the three notes you pick, printed on thick matte paper.
> - Frame in black, red oak or white wood
> - Acrylic front, hanging hardware included
> - Made to order, and a person checks your design before it prints
> - Free US shipping

**Tiny Me, For The Tree**
> Your dog on a ceramic Christmas ornament: one 3-inch circle with their photo, their name and a short note to you around the edge. It's printed the same on both sides, so it faces the room whichever way it turns.
> - Ceramic, 2.99 inches across
> - Pick the note, or write your own
> - Made to order, and a person checks your design before it prints
> - Free US shipping

Use the "both sides" sentence only if task 1 step 6 confirmed it. Use "Pick the note, or write your own" only if task 1 worked; with presets only, write "Pick the note from five".

**The Body Double**
> Your dog's face on a 16-inch square pillow, printed on both sides. For when they can't be on the sofa with you.
> - 16 × 16 inches, printed edge to edge on both sides
> - Insert included
> - Made to order, and a person checks your design before it prints
> - Free US shipping

### 5. Capture the new ornament for Claude Code

1. Open https://heartside.io/products/tiny-me-for-the-tree on a phone-sized window.
2. Upload Biscuit's headshot (https://raw.githubusercontent.com/krishanraja/heartside/main/assets/v2/biscuit-headshot.jpg), crop with **Select**, type **Biscuit**, and keep "Still my favourite person."
3. Press **Preview** and save the image to the Drive folder as **`teeinblue-ornament-note.png`**.
4. Add to cart. Open https://heartside.io/cart.js and copy every `_tib_design_link_*` URL and the `_customization_image` URL into your report. Empty the cart.

Claude Code rebuilds the ornament photo from these, then switches on the Tiny Me section.

### 6. Re-check the funnel events

Claude Code deployed changes on 5 October evening. In Meta Events Manager > Test events, with heartside.io open, type a dog's name and step through the review. Confirm that `hs2_name_entered` and `hs2_review_step` still arrive.

### 7. Ask Krish

There's an empty custom pixel named "DB1BJ0RC77UD1K9HASRG" (template code only) connected beside "Heartside funnel". Ask Krish whether to **disconnect** it. It does nothing, and the funnel pixel already carries his TikTok ID. Do it only on his yes.

### 8. Report back

Paste this into the Claude Code session:
- For each task: done, skipped or failed, with every setting you changed (old value, new value).
- How the note picker works: preset list, custom field, character limit, conditional or not.
- The back-print finding.
- Which photos you moved.
- Which descriptions you pasted, with any line you left out and why.
- The two Printful facts.
- The ornament files and the cart URLs.
- The Meta test result.
- Krish's answer on the empty pixel.
