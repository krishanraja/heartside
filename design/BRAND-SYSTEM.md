# Heartside brand system

> **Positioning (12 October 2026).** Display name **Heartside: Personalized Dog Gifts**. Lead line **"Your dog loves you too."** One-line offer: "Personalized posters, ornaments and pillows made from their photo." Krish's rule: business headlines must never be lame or dumb. [`docs/POSITIONING.md`](../docs/POSITIONING.md) wins over this file on headlines and brand copy. This file is canonical in the GitHub repo (`design/BRAND-SYSTEM.md`); the Drive copies mirror it.

Heartside makes personalized gifts for people whose dog is their person. The hero product is **The Annual Review**: a 12 × 18 inch poster in which the dog reviews their human's year. The store is **heartside.io** (Shopify, Printful for every product, Teeinblue for personalization). Social accounts run as **@yourdoghasnotes**, display name **Heartside: Personalized Dog Gifts**.

**The feeling, in order:** a laugh in the first two seconds, then "that is exactly my dog", then the tender turn ("You also came back. Every single time. I noticed."), then the urge to send it to someone. Hilarity is the delivery system and tenderness is the payload. Since 5 October the governing note is **love with a wink**: the dog's voice stays affectionate everywhere, and the HR parody is one joke that lives in one place, the poster.

**North star for every page:** "the experience should be the most easy thing on earth." A buyer arriving from an ad can pay after three inputs: the dog's name, their own name and a photo.

## Source of truth

The live theme is in the heartside repository (Shopify theme sections, deployed through the GitHub workflow into the "Heartside launch" theme). The approved look is the "Heartside: From the dog" canvas (`Main.dc.html`, `Poster.dc.html`, five ad storyboards). Positioning and headline copy live in `docs/POSITIONING.md` (12 October). Facts and decisions live in `docs/V2-FROM-THE-DOG.md` (4 October) and `docs/HANDOFF.md`. When the canvas and the briefs disagree, the canvas wins on look and the briefs win on facts; `POSITIONING.md` wins on headlines and brand copy. Where every file lives, in the repo and in Drive: `docs/SYNC.md`.

## Content fundamentals

- **US spelling** throughout the site ("personalized", "favorite"). Plain words a ten-year-old could read.
- **Who speaks.** The dog speaks on the poster, in ads and in product copy. The brand speaks plainly everywhere else: labels, prices, promises, shipping, bios, page names and headlines.
- **Business headlines** (bios, page names, the site hero, meta titles and descriptions): plain, warm and true for every product. Lead with "Your dog loves you too." Never describe the business as "written by your dog" or as "your dog's annual review of you"; that describes the poster, not the business.
- **The dog's voice on the poster:** flat, sincere, short sentences, office language for dog things ("Strong numbers.", "We have discussed this.", "Case closed."), petty about small betrayals (the vacuum, the mailman, leaving), devoted underneath. Approved lines: "Looked at a rectangle for six hours instead of me." "Leaving. Please stop leaving." "Contract renewed. For life."
- **Everywhere else, warm and plain.** Form labels are "Your dog's name" and "Your name". Sections are **Our promises**, **Questions** and **Christmas order dates** (never "Company policy", "HR FAQs", "Benefits package" or "A word from management" on the site).
- **Ornament lines are lovey, chosen by the buyer:** "Still my favorite person." "Best human. Every single year." "Home is wherever you are." "I'd pick you again." "Merry Christmas from your shadow."
- **Hero:** eyebrow "PERSONALIZED POSTER · $39 · FREE US SHIPPING", headline "Your dog loves you too.", reassurance "A person checks every order · Misprinted? Remade free · Free US shipping". The live site still adds "Now it's in writing."; that half is retired and comes off in the next site session.
- **Sign-off:** heartside.io on every ad. Whether "Your dog has notes." stays as the end-card line is undecided; ask Krish. Tagline "Keep them close." appears once, where the tender turn lands.
- **Never:** "it's not X, it's Y" or staccato false binaries; emoji in headlines; exclamation marks in body copy; "must-have", "elevate", "unleash", "game-changer"; jokes about a dog dying, ageing, being ill or abandoned; mocking breeds, bodies or the customer; fake countdowns, invented reviews, customers, numbers or scarcity; strike-through "was" prices; safety or health claims; grief used to sell; AI-generated "customers" holding or reviewing the product.

## Visual foundations

- **Colour.** The page is `cream` with `ink` type and `ink` primary buttons. `blush` is the review-builder band and the button colour on dark panels. `stamp-red` is reserved for stamps, star ratings and the hero's italic line. `chestnut` signs the poster with a paw. `night` grounds the tender memo. Cards are `white`; the poster is `paper`. Secondary text is `muted`; hairlines are `rule`. Values: ink `#121010`, cream `#FBF6F1`, blush `#F0C0C0`, stamp-red `#A8284E`, chestnut `#8A4A2B`, night `#1E1714`, paper `#FFFDF9`, white `#FFFFFF`, muted `#5A4A44`, rule `#E8DCD3`, focus `#E49CB4`.
- **Type.** `--font-display` (Fraunces) for headlines at 650 with tight tracking (`hero`, `section`, `title`, `card-title`), and Fraunces italic 400 in `stamp-red` for the one emotional phrase in a headline. `--font-ui` (DM Sans) for everything functional (`lede`, `body`, `body-sm`, `label`, `button`). `--font-paper` (Courier Prime) for anything that is paperwork: the poster, stamps, eyebrows, the memo bar and the tender memo.
- **Paperwork details.** Stamps sit slightly rotated (-2° to -14°). Paper has a soft lift (`shadow-poster`) and tilts about 1°. The ID badge tilts 4°. Nothing else rotates.
- **Shape.** Soft, friendly corners: `radius-control` 14px on buttons and inputs, `radius-panel` 20px, `radius-card` 24px, `radius-hero` 28px on the hero photo, pills (`radius-pill`) for chips and the sticky bar. The poster stays nearly square (`radius-poster`).
- **Depth.** Warm, soft shadows only (`shadow-soft`, `shadow-poster`, `shadow-badge`, `shadow-sticky`, `shadow-chip`). No hard offsets, no glows.
- **Layout.** Content max `page-max` 1180px with a 20px `gutter`. Bands alternate cream, blush and night. Mobile is the real target: the header gets its own row on phones, and a sticky buy bar appears once the hero scrolls away. Touch targets at least 44px.
- **Focus.** A 3px `focus` outline at 3px offset. The source pink fails 3:1 on cream (2.0:1); prefer an ink ring on cream surfaces when the theme is next touched.
- **Imagery.** Warm real homes in window or lamp light, cream and wood tones, light grain, dogs at their eye level. The comedy is the dog's expression and the situation. Product shots are Printful mockups of the real designs. In ads, Biscuit (an original AI-generated miniature dachshund, chestnut-red, greying muzzle) is the only recurring character and stays identical across every ad. He is also the profile photo on every platform.

## Iconography

No icon library. The only drawn marks are the **paw** signature (`Paw`) and a line **camera** for the photo upload, plus Unicode stars (★ ☆) for ratings in `stamp-red`. The logo's watercolour heart is the favicon. No emoji anywhere in the interface.

## Using this system

- Wrap a page in `class="hs-page"`; load `components/bundle.css` for the component layer.
- Components (`window.HeartsideDS`): actions `Button`, `Chip`, `StickyBuyBar`; forms `TextField`; paperwork `Stamp`, `MemoBar`, `StatusPill`, `Eyebrow`; product `ReviewPoster`, `IdBadge`, `ProductCard`; trust `PromiseCard`, `FaqItem`; story `TenderMemo`. `Paw` and `Stars` are exported helpers.
- **LandingPage** shows the ad-traffic landing template assembled from these parts.
- Assets: Logos, Imagery (lifestyle scenes), Product mockups, Poster template (Teeinblue layers), Social cards and Founder.
- The component layer, tokens and previews are the claude.ai Design System artifact; its export is in Drive `00_Brand-Assets/06_Claude-Design-System` (see `docs/SYNC.md`).
- The range and prices are live business facts: The Annual Review $39, framed $89, The Body Double $59, Tiny Me ornament $24. Paused until Teeinblue background removal is set up: Mandatory Company Uniform set $129, Surveillance Socks $24. Re-check them before publishing anything.
