# First videos (6 October 2026): style not approved

Seven 9:16 videos (1080×1920, 30 fps, with sound) made by `tools/content/reel.py` from the specs in `tools/content/specs/`. Krish's verdict on 7 October: **"Not sure about the visual style at all."** Treat them as proof that the pipeline works and that the real print can be shown truthfully, not as an approved look. Don't post them or make more like them until Krish has picked a direction (see `docs/HANDOFF.md` section 4, Content).

| File | Series | What it is |
|---|---|---|
| `hs_pov-review_h1_18s_v1.mp4` | POV: your dog filed your review (hero ad) | Hook "POV: your dog just wrote your annual performance review" over Biscuit. Three poster lines type out over library photos (the sock, leaving, the vacuum). The real poster appears and the APPROVED stamp slams on. Ends on hands holding that same poster, with the end card "Made from your dog's photo. The Annual Review · $39 · Free US shipping · HEARTSIDE.IO" |
| `hs_lotd-leaving_7s_v1.mp4` | Line of the day | "Areas for improvement: Leaving. Please stop leaving." over a dachshund lying on a bed |
| `hs_lotd-sock_7s_v1.mp4` | Line of the day | "Incident report: The sock. I would do it again. Case closed." |
| `hs_lotd-bath_7s_v1.mp4` | Line of the day | "Areas for improvement: Scheduled a bath without consulting me. Bold." |
| `hs_lotd-phone_7s_v1.mp4` | Line of the day | "Areas for improvement: Looked at a rectangle for six hours instead of me." over a dog asleep on a laptop |
| `hs_lotd-mailman_7s_v1.mp4` | Line of the day | "Threat assessment: The mailman. Comes every day. Clearly planning something." |
| `hs_lotd-vacuum_7s_v1.mp4` | Line of the day | "Threat assessment: The vacuum. Loud. Hungry. Unemployable." |

`hero-contact-sheet.jpg` and `line-of-the-day-contact-sheet.jpg` show one frame per scene.

**How they were made, and what any new style should keep**
- Every poster line on screen is read from `shopify/snippets/hs2-lines.liquid`, the same source as the site and the print, so a video can't show a line the poster doesn't print.
- The poster is composed from the real print layers in `design/poster-template/`, and the final scene places that same poster into a staged photo (`tools/preview/mockups.py`). No AI-drawn product.
- Dogs and rooms come from the licensed library in `assets/v2/`; there is no AI video motion yet (Ken Burns push-ins only). No Higgsfield credits were spent.
- Sound is generated in code (typewriter clicks, a bell at the end of each line, the stamp thunk), so there are no music licensing issues. A trending sound can be added inside each app.
- Text stays inside the platform safe zone (y 250 to 1520 of 1920), so the apps' buttons and captions don't cover it.
- Built with brand fonts: DM Sans (hooks), Courier Prime (the form), Fraunces (end card).

**What is open to change:** everything about the look. That includes the cream paper cards, the pacing (7 s and 18 s), the slow push-ins on stills, whether a voice reads the review, and whether real dog motion (Higgsfield image-to-video, dog and room only) replaces the stills.
