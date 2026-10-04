# Heartside site imagery brief (Canva)

For Krish to pull from Canva. Written 4 October 2026. Two kinds of image, and they come from different places.

**Lifestyle and mood images come from Canva.** The direction: the same warm, real-home look as the ads. Window or lamp light, cream and wood tones, light grain, dogs at their eye level. Comedy comes from the dog's expression and the situation, never from costumes on real dogs, stock smiles at the camera or bright studio backdrops.

**Product images come from Printful's free mockup generator, using our real designs.** Never use Canva for the products themselves. Customers must see what will actually arrive.

Export at 2400 px on the long side, as JPG at 80% quality. File names in brackets are what Claude Code will expect in the repo under `assets/v2/`.

## Lifestyle and mood (Canva)

1. **Hero, the manager** [`hero-manager.jpg`] · 4:5 portrait. A small dog (dachshund, Frenchie or terrier) sitting upright on a sofa or armchair, looking straight into the lens with a flat, unimpressed, slightly judgmental expression. Eye-level and close. Warm window light from one side. Background: an out-of-focus living room. This is the most important image on the site. Pick the face that looks like it is about to give you notes.
   - Canva searches: "dog looking at camera serious", "dachshund portrait sofa", "dog judging".
2. **Status: in a meeting** [`status-asleep.jpg`] · 1:1. A small dog fast asleep on a desk chair or on a laptop keyboard, or curled on a pile of paperwork. Used as the hero's secondary image and in the Body Double card.
3. **Your side of the bed** [`side-of-bed.jpg`] · 4:5. A dog stretched across the middle of a made bed, taking up a human's space. Morning light. Used in the review builder ("Where I sleep").
4. **The mailman watch** [`window-watch.jpg`] · 4:5. A dog with paws on a windowsill, staring out with total focus. Used for "Known enemy of the company".
5. **The vacuum standoff** [`vacuum.jpg`] · 1:1. A small dog staring down an upright vacuum cleaner from a safe distance. Hilarious if the dog is clearly furious.
6. **The incident** [`incident.jpg`] · 1:1. A dog with a single sock in its mouth, or a shredded tissue around it, looking unrepentant.
7. **Management memo** [`memo-chest.jpg`] · 16:9 landscape. For the dark tender section: a small dog asleep on a person's chest, chin on the collarbone, a hand resting on its back. No faces, low warm light. Should feel like the best minute of someone's week.
8. **Holiday party** [`holiday-party.jpg`] · 16:9. A cosy living room at Christmas with a lit tree and soft fairy-light bokeh, no people. The background for the deadlines ("holiday office closure") section.
9. **Dogs of the company** (6 images) [`team-01.jpg` to `team-06.jpg`] · 1:1. Six different small and medium dogs, each with a distinct personality face: a pug, a poodle mix, a terrier, a Frenchie, a golden puppy and a rescue mutt. Used as the "staff directory" strip and as stand-ins for the free story card.

## Product images (Printful mockup generator, not Canva)

Use Biscuit-style placeholder artwork until the real designs exist. Swap in the real ones before launch.

10. Annual Review poster, unframed, on a cream wall above a sideboard, 4:5 [`p-review-poster.jpg`]
11. Annual Review, framed, black frame, leaning on a shelf, 4:5 [`p-review-framed.jpg`]
12. The Body Double, 16″ pillow, on a sofa, 1:1 [`p-body-double.jpg`]
13. Mandatory Company Uniform, sweatshirt flat lay plus bandana, 1:1 [`p-uniform.jpg`]
14. Surveillance Socks, flat lay, 1:1 [`p-socks.jpg`]
15. Tiny Me ornament, front and back, on a tree branch, 1:1 [`p-ornament.jpg`]

## Brand marks Claude Code will make (nothing needed from Canva)

- **Stamps:** APPROVED, CONFIDENTIAL and FORM HR-26, in stamp red `#A8284E`, made as SVG.
- **Paw signature:** an SVG mark.
- **ID badge and memo paper:** built in CSS.

## Delivered (4 October)

Krish sent the Canva set on 4 October. It is saved under `assets/v2/` with the names above, and `tools/build_shopify_assets.py` turns it into the theme's WebP files.

| File | Where it's used |
|---|---|
| `hero-manager.jpg` | Hero; its face, cropped square, is the sample headshot on the poster and the first story card |
| `status-asleep.jpg` | The HR help desk ("HR is in a meeting (asleep)"), the Body Double card until its mockup exists, and the evidence photo for "Your phone" |
| `side-of-bed.jpg` | Evidence photo A under the live poster (area for improvement) |
| `window-watch.jpg` | Evidence photo C (known enemy) and the threat story card |
| `vacuum.jpg` | Evidence and story card whenever "The vacuum" is picked |
| `incident.jpg` | Evidence photo B (incident) and the incident story card |
| `memo-chest.jpg` | Under the management memo, and the memo story card |
| `holiday-party.jpg` | Behind the holiday office closure deadlines |
| `team-01.jpg` to `team-04.jpg` | Pug, doodle asleep at the desk, golden at the desk, golden on the rug: stand-ins on the Uniform, Socks and Ornament cards, and the "Sharing food" / "The sandwich" evidence (the pug) |

- **Still to come:** `team-05.jpg` and `team-06.jpg` (a Frenchie and a rescue mutt). Nothing is waiting on them.
- **Size:** the exports came at 1122 to 1672 px on the long side rather than 2400. That is enough for the site, and nothing in print uses them.
- **Watch the props:** the props in these images carry AI-written text ("Same Dog Different Deadline", "Good Dogs Build Better Days"). It reads fine at site sizes. Check it before using any of them in an ad.
