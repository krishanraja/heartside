# Open Generative AI: evaluation for the painter, 15 November 2026

**Verdict: install nothing.** Nothing in [Open Generative AI](https://github.com/Anil-matcha/Open-Generative-AI) (MIT, read at commit `fd7dd92`, 15 Nov 2026) improves the painting's quality, cost, speed or reliability enough to justify it. It would add a reseller that has weak privacy terms, and an outside painter breaks the automated print path. The model choice it would offer is already in Teeinblue, the painter Heartside uses. No file outside this record changed, no dependency was added, no account was opened, no photo was sent and no paid call was made.

**North Star:** at U5 ($45 against $1,084 this week) this evaluation moves the number only indirectly, through the painting. The 4 November blind-judge run (`2026-11-04-photo-first-journey.md`) scored likeness 6.9 of 10, buyer trust 4.1 and the director 4.0. The painter is not the weakest link.

## What Heartside runs today

| Part | What it is | Source |
|---|---|---|
| Painter | Teeinblue's own Gen AI photo effect, with Krish's OpenAI key, GPT Image 2.5 Sunburst at High quality, prompt spec v21 | `tools/print-art/ARTWORK-SYSTEM.md`, `tools/print-art/teeinblue/PROMPT-SPEC-2026-11-05-v21.md` |
| Print file | Teeinblue renders it at print size (a blanket test gave 15,900 x 18,900) and hands it to Printful under manual review | `NOW.md` |
| Cost | $0.37 for 3 recorded requests, about $0.123 each, billed to the key (23 Oct). About $0.13 a painting, one per gift and per redo | `2026-10-23-native-artwork-cost-and-resolution.md`, `docs/ECONOMICS.md` |
| Speed | One hand observation of 107 s; the page says most take 1 to 3 minutes | `2026-10-29-timing-report.md` |
| Photo handling | Prepared on the device before upload: metadata removed, long side capped at 4096 px, JPEG | `tools/print-art/ARTWORK-SYSTEM.md` |
| Keys | Held server side, in Teeinblue and n8n. A scan of `shopify/` on 15 Nov found no provider key or provider address in the theme | `n8n/CHECKOUT-IMAGE-CANDIDATE.md`, this session's scan |

## What Open Generative AI is

- A web, desktop and Docker front end over one paid aggregator, [Muapi.ai](https://muapi.ai) (Vadoo Internet Services, India). Every cloud call goes to `api.muapi.ai` with an `x-api-key`. The README links Muapi's white-label plans and carries a "Powered by MuAPI" badge.
- 88 image-to-image endpoints, among them GPT Image 2.5 Sunburst and Flare, Nano Banana 2, 2.1 and Pro edit, Flux Kontext and Flux 2 edit, Seedream 4 to 5 edit, Qwen and Wan edit, and Flux PuLID. It also has text-to-image, video, lip sync, marketing and agent studios, and three git submodules: a workflow builder, an agent framework and a design agent.
- Two local engines in the desktop app only: sd.cpp (SD 1.5, SDXL, Z-Image) and Wan2GP (Flux.1 dev, Qwen-Image, video models), run on the user's own GPU.
- The README promises "No content filters, no prompt rejections, no guardrails" and "your data stays on your machine". In cloud mode each uploaded image goes to Muapi's storage.

## Comparison against the current painter

| Axis | Current (Teeinblue + OpenAI) | Through Open Generative AI and Muapi | Call |
|---|---|---|---|
| Quality | GPT Image 2.5 Sunburst: 1201 ±11 Elo, third in the Artificial Analysis image-editing arena (free endpoint, read 15 Nov) | The same model, or lower-ranked ones: Seedream 5.5 1160, Nano Banana 2.1 1152, Nano Banana Pro 1109, FLUX.2 pro 1010. The newer GPT Image 2.6 Sunburst is 1210 ±13, inside the margin. | No meaningful gain. Arena Elo measures general edits, not one dog's likeness in a painted style. Heartside's own blind likeness judging is the test that counts. |
| Cost | About $0.123 a painting, measured | Muapi's own pages disagree on GPT Image 2.5 Sunburst image to image: $0.06 to $0.16 an image on one, $0.006 to $0.10 on another. Both were read from search excerpts, because its pricing page renders nothing without a browser | No measured saving. Three paintings come to about $0.39, under 1% of a $45 mug, so even half price cannot close the mug's gap to the 30% floor (it needs $51.30 or more). |
| Speed | 107 s, one observation | Not measured; no free test exists | Unknown. If speed matters, the test belongs inside Teeinblue (below). |
| Reliability | Teeinblue calls OpenAI directly with Krish's key; Teeinblue offers an optional same-provider outage backup (off by default) | Two or three hops: Muapi, then (by the policy text on its own site) Replicate or fal.ai, then the model's maker. Terms: "as is", no uptime promise, liability capped at the lesser of 6 months' fees or $100, Indian law. Client: a lost poll is retried every 2 s with no backoff, the submit carries no idempotency key, and the 8 test files cover only the desktop local engines, none the cloud client or model list. | Worse. |
| Model choice | Teeinblue supports GPT, Flux Kontext and Gemini, with a model chosen per photo layer ([Teeinblue, updated 23 Oct 2026](https://support.teeinblue.com/en/article/connecting-to-ai-model-services-cotusm/)) | 88 edit endpoints | Teeinblue already covers the strong alternatives without a new processor. |
| Print path | The painting becomes Teeinblue's print file automatically | Teeinblue's public API reads orders and cannot write a custom design, so an outside painting means a person uploads it by hand on each order (`tools/print-art/README.md`) | Breaks the automated order path. Decisive on its own. |

## Customer photos, retention and terms

| Processor | Training use | Retention | Source |
|---|---|---|---|
| OpenAI API (current) | Not used to train unless opted in | Up to 30 days for abuse monitoring. `gpt-image-2.5-sunburst` is eligible for Zero Data Retention, an arrangement OpenAI must grant; images flagged by its CSAM scan are kept for review either way | [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data), read 15 Nov |
| Gemini API, paid tier | Not used to improve products; covered by Google's data processing addendum | Logged for a limited time for abuse detection | [Gemini API terms](https://ai.google.dev/gemini-api/terms), read 15 Nov |
| Gemini API, unpaid tier | Used to improve Google products; people may review it | Not stated | Same |
| Muapi | Terms give Muapi "a limited license to use your data" and keep "Resultant Data" for itself; no data processing addendum offered | The upload endpoint returns a public S3 address (`muapi-assets`) in its own docs. `muapi.ai/privacy` serves the policy of a different app, PhotoAI (originals deleted after processing, outputs kept 30 days on `cdn.muapi.ai`), so no retention promise covers API uploads | [Muapi terms](https://muapi.ai/terms), [privacy page](https://muapi.ai/privacy), [upload docs](https://muapi.ai/docs/file-upload), read 15 Nov |

Sending a buyer's dog photo through Muapi would add a fourth party with a public file address and no retention promise, against a current path with a 30-day bound and an option for zero retention. Not checked here: how long Teeinblue keeps the photo and the painting. It holds them for every order today, so it is a separate question for the current path.

## Each part reviewed

| Part | Decision | Why |
|---|---|---|
| Muapi client (`packages/studio/src/muapi.js`), model list, Next.js proxy | Rejected | Adds an unvetted processor for the same or lower-ranked models, and puts the provider key in the browser's localStorage, where Heartside keeps it server side. |
| Polling helper (`utils/generationLifecycle.js`) | Rejected | Below the bar `tools/print-art/generate.py` already sets: one call per output, a pending marker that blocks a blind retry. |
| Image sizing and input contracts | Rejected | Teeinblue owns sizing for the print. |
| Local engines (sd.cpp, Wan2GP) | Rejected | The only route that keeps photos in-house, but it needs a GPU server running all the time, and its edit models rank far below the current one (FLUX.2 dev is 1000, the arena's reference point). |
| Video, lip sync, marketing, agent and workflow studios | Rejected | A separate creative studio, which the brief excludes. Higgsfield and Runway are already connected through Control Center, and `docs/SCOPE.md` rule 6 keeps them for lead-generation content. |

## Tests

- Run: a static read of the repository and its client code, the published terms and prices above, and the Artificial Analysis image-editing arena (free endpoint).
- Not run: a side-by-side painting with synthetic photos. Every route needs a paid call (a Muapi key or provider spend), and the brief rules that out without Krish's approval. No figure above is a Heartside measurement of Muapi.

## The test worth running, only if the funnel asks for it

1. **Gate, free:** read the painting stage from Shopify analytics: buyers who start a painting, see the reveal and add to cart. Run the next step only if buyers leave during the wait.
2. **Trial, needs Krish's approval for the key and the spend:** in a duplicate draft artwork in Teeinblue, connect a paid-tier Gemini key and set one photo layer to Gemini. Paint the same five synthetic or authorized dog photos, Warm tone, on the mug, through GPT Image 2.5 Sunburst and through Gemini. Ten paintings, about $0.62 on the current model plus a $1 cap on Gemini.
3. **Pass:** Gemini's median time from sent to ready is at most half the current one. Its blind likeness score (the 4 November judge method) is no more than 0.5 lower. It follows the mug's placement brief at least as often, and no painting fails.
4. **Leave alone:** live campaigns, the saved model and the account's backup setting.

## Revisit when

- Teeinblue drops Gemini or Flux Kontext, or retires GPT Image 2.5 Sunburst. It moves accounts to a successor model by itself, so recheck the prompts then.
- Heartside needs a painter outside Teeinblue, for example once Teeinblue offers a documented way to write a design.
- Muapi publishes a data processing addendum and an API retention policy.
