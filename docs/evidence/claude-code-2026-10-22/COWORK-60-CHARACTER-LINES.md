# Cowork brief: 60-character gift lines (22 Oct 2026)

For Cowork, working in Teeinblue (and Printful only to look). Written by Claude Code. Report back to Krish, and save the renders and report under `docs/evidence/cowork-2026-10-22/`.

## Why

Krish, 22 Oct, on the AI's gift lines: "They all sound like Claude... Two-word sentences stacked against two- or three-word sentences are just a clear tell. It needs to feel heartfelt, real, humanized, but each dog's personality, based on the corpus, shines through in bringing all of the details the users put in into life. A border collie would sound different to a poodle if they were human."

Claude Code rewrote the AI's instructions and tested them on six models. At 44 characters a line, the same answers from a Border Collie, a Poodle and a Beagle came out nearly identical. At 60 they became three different dogs:

- Border Collie: "Three throws is the plan, and I never lose count."
- Poodle: "I took the couch beside you because I have good taste."
- Beagle: "I've sniffed a lot of dogs and I'd still pick you."

Krish approved (22 Oct): **raise the printed line from 44 to 60 characters**, and use Claude Sonnet to write the whole note. The site and the AI are Claude Code's job. **Your job is to make the four Teeinblue gifts print a 60-character line well, and to show Krish the mug options before anything changes.**

## Rules

- **No orders, no spend, no settings outside this brief** without Krish's yes. Never handle tokens, keys or passwords.
- **Don't change the live look of any campaign without Krish's yes on the renders.** Make every test in a duplicate campaign or without saving, except step 1 (the character limit), which changes nothing that prints today.
- **If Teeinblue asks to update Shopify, untick Images, Description, Title and Tags.** Never push Teeinblue images to Shopify.
- **Keep the field labels exactly as they are:** "Dog's name", "Line 1" to "Line 4", "Signed". The site fills Teeinblue's fields by those labels.
- **Writing:** no em dashes, no exclamation marks, US spelling.

## The campaigns

| Gift | Campaign | Lines it prints | Line type today |
|---|---|---|---|
| The Morning Mug | 1043122 (artwork #1353995) | Line 1 to 3 (home, spot, meaning) on the drinker's face | HS-Fraunces-Text 70 px (16.8 pt), boxes 860 x 190 at left 1685, tops 130, 345, 560; Signed at top 790 |
| The Couch Blanket | 1043153 | Line 1 to 4 | Courier Prime |
| The Framed Print | 1043167 | Line 1 to 4 | Courier Prime |
| The Tree Ornament | 1043174 | Line 1 only (the meaning line), on the back | Courier Prime |

Mug spec: `docs/evidence/cowork-2026-10-15/mug-v3-handoff-for-claude-code.md`. Fonts: `tools/fonts/`.

## What to do

### 1. Raise the limit on every Line field (all four campaigns)

- Set the maximum characters on "Line 1" to "Line 4" from 45 to **61**: 60 plus one spare, as 44 had 45.
- The site keeps sending 44-character lines until Claude Code switches over, so this changes nothing that prints today.
- "Dog's name" (14) and "Signed" stay as they are.
- **Check:** in each campaign, type a 61-character line into Line 1 and confirm Teeinblue keeps every character.

### 2. Test lines

Use these exact strings, so every render is comparable. The first four are 59 to 60 characters, with apostrophes.

- Line 1: `I'm at the door before your key is even out of your pocket.`
- Line 2: `I took the couch beside you because I have good taste, dear.`
- Line 3: `We walk till I've had my three throws, and not before, okay.`
- Line 4: `I've sniffed a lot of dogs, and I'd still pick you, always.`
- Stress line, the widest possible: `WWWWW WWWWW WWWWW WWWWW WWWWW WWWWW WWWWW WWWWW WWWWW WWWWW.`
- Shortest line: `I'm yours, always.`
- Dog's name at the 14-character maximum: `Bartholomew Jr`

**Balanced breaks.** Teeinblue keeps a `\n` typed into a field. Where a line takes more than one row, type it the way the site will send it: the spaces at the most even break points replaced by `\n`, so no row ends with one lonely word. Example for two rows: `I took the couch beside you\nbecause I have good taste, dear.`

### 3. Blanket, framed print and ornament

For each, make Teeinblue's real print file at full size with the four long lines, then again with the stress line in every Line field, then with the shortest line. The ornament gets Line 1 only.

Report for each:

- Does every line print in full, with nothing clipped, overlapping or running into the photo, name or signature?
- If the text box shrinks text to fit, what is the smallest size it reaches, in pt? Below **12 pt** at real print size counts as a fail.
- How many rows a 60-character line takes, and whether the boxes need to be taller.
- If something fails, the smallest change that fixes it: taller boxes, a smaller fixed size or a moved layer. Make it in a duplicate and render it again. Don't save it to the live campaign.

### 4. The mug: render the options and let Krish choose

At 70 px about 25 characters fit on a row, so a 60-character line needs three rows. Three such lines don't fit the drinker's face above the signature. Render each option below in a duplicate of 1043122, with the four test lines (the mug uses Lines 1 to 3) and balanced `\n` breaks:

- **A. Smaller type, three lines.** Lines 1 to 3 at about 58 px (about 14 pt), two rows each. Boxes as tall as two rows need; keep the signature and paw clear.
- **B. Same type, two lines.** Keep 70 px (16.8 pt). The mug prints two lines, home and meaning, three rows each. Line 2 is left empty.
- **C. Today's layout as the baseline.** 70 px, three lines at 44 characters, e.g. `I took your side of the bed to keep it warm.`

For each option send Krish:

- the flat print file at full size;
- the note face on the mug mockup;
- one sentence on how it reads at arm's length.

Don't pick for him, and don't change the live mug campaign until he picks. Claude Code then makes the site send the mug's lines to match his choice.

### 5. Sample text (all four campaigns, after Krish picks the mug)

If a campaign shows sample words before a buyer personalizes, replace them with these lines in the new voice:

- Line 1: `I hear your car long before anyone else.`
- Line 2: `I keep your spot on the couch warm for you.`
- Line 3: `Our walks are the best part of my day.` (blanket and print). On the mug, Line 3 is `I'm your shadow, and I like it that way.`
- Line 4: `I'm your shadow, and I like it that way.` (blanket and print)
- Ornament Line 1: `I'm your shadow, and I like it that way.`

These are the chat's own pre-written lines, so the sample and the site match.

## Report back

1. Step 1 done on all four campaigns, with the 61-character check.
2. Blanket, print and ornament: pass or fail per gift, with the smallest size reached and the print files.
3. Mug A, B and C: the renders, and a note on each.
4. Anything you changed on a live campaign. It should be only the character limit, plus the sample text after Krish picks the mug.

Save the files and a short `REPORT.md` under `docs/evidence/cowork-2026-10-22/`.

## What Claude Code does after your report

- Switches the AI to 60 characters and Claude Sonnet for the note.
- Makes the site's line editor, the preview and the balanced breaks handle three rows.
- Sends the mug's lines to match Krish's pick.
- Deploys through the usual pull request and theme workflow, with Krish's yes on the day.

Until then the live site keeps writing 44-character lines, so nothing a customer orders changes.

---

## Round 2 (after Cowork's report, 22 Oct)

Krish picked **mug option A** (58 px, three lines, two rows each) and **kept the meaning line at 44 characters**. The ornament prints only the meaning line, so it stays exactly as it is today. Claude Code has made the site and the AI match. Please do the following:

1. **Mug 1043122, live campaign:** set Line 1 to 3 to HS-Fraunces-Text **58 px**. Leave the boxes (860 x 190 at tops 130, 345, 560), the signature and the paw where they are. Today's 44-character lines also fit at 58 px, so this is safe to save now. Save. If Teeinblue asks to update Shopify, untick Images, Description, Title and Tags.
2. **Mug mockups:** generate the note-face mockup with Line 1 to 3 set to these lines, so Krish can see the real Preview:
   - `I'm at the door before your\nkey is even out of your pocket.`
   - `I took the couch beside you\nbecause I have good taste, dear.`
   - `I've sniffed a lot of dogs,\nand I'd still pick you, always.`

   These are the breaks the site sends.
3. **Blanket and framed print: one row or two?** The site sends their lines without `\n`, as today. In a duplicate, render Line 1 = `I'm at the door before your key is even out of your pocket.` with no `\n`, and report what Teeinblue does:
   - does it keep one row and shrink it, or wrap it greedily?
   - what is the type size?
   - does a single word end up alone on a second row?

   If wrapping greedily leaves a lone word, say so. Claude Code will then send balanced breaks for those gifts too.
4. **Real print files:** run "Generate test design" once for each gift with the four long test lines (the mug with Lines 1 to 3, the ornament with `I've sniffed a lot of dogs, and I'd still pick you.`), and save the full-size files. Your round 1 sizes came from the editor preview, so this confirms them.
5. **Sample text** on all four campaigns, as in step 5 above.
6. **Storefront check:** on each product page, confirm the personalizer's Line fields accept 60 characters.

Save the files and `REPORT-2.md` under `docs/evidence/cowork-2026-10-22/`, or send them to Krish.
