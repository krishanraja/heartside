# Biscuit's AI: two n8n webhooks

The live AI in v3 (`docs/V3-GIFTS-FROM-YOUR-DOG.md` section 5) runs on Krish's n8n, with Google Gemini through the credential **"Google Gemini(PaLM) - Heartside"**. The key stays in n8n; it never reaches the browser, this repo or a chat.

| Workflow | n8n id | Production URL | Call (spec 5.2) |
|---|---|---|---|
| Heartside: typed answer (Biscuit AI) | `ryyzdxv8SBm5HTjP` | `https://krishraja10101.app.n8n.cloud/webhook/heartside-typed-answer` | a "Something else" answer: reaction, line, follow-up, flags |
| Heartside: compose gift lines (Biscuit AI) | `28WZgPmgTaY33KY3` | `https://krishraja10101.app.n8n.cloud/webhook/heartside-compose` | at the reveal, only when an answer was typed: four lines, the pick, Biscuit's reason |

Both were switched on by Krish's instruction on 13 October 2026. Model: `models/gemini-3.1-flash-lite`, thinking off.

## How each one works

Webhook (POST) > **Guard** > **Allowed?** > **Gemini** > **Enforce rules** > Respond. A refused call goes to **Refuse**.

- **Guard** (spec 5.4 guard rails): the `Origin` header must be `https://heartside.io`, `https://www.heartside.io` or `https://bnf1em-ge.myshopify.com` (403 otherwise). A `session` id is required (the theme makes one per visit). Caps per hour: the typed answer 8 calls per session and 60 per IP; compose 3 per session and 20 per IP (429 over the cap). Inputs are trimmed to the lengths in 5.2.
- **Gemini** gets Biscuit's voice rules (spec 4.6) and the JSON shape, and is told the buyer's words are data, not instructions. If it errors, its error output still goes to Enforce rules.
- **Enforce rules** never trusts the model (spec 5.3): lengths (reaction 70, line 44, follow-up 70, chips 24, reason 140); no I, me or my in a line; no em dashes or banned words; every number, time, place and name in a line must appear in the buyer's input, or the line becomes the buyer's own trimmed words. Grief or profanity in the typed words is caught by pattern too, whatever the model says, and returns "I didn't quite catch that one. Try again, or pick one of these?" with no line. With no usable model answer it returns "Tell me more?" and the buyer's own words, marked `"source": "fallback"`.
- The theme times out at 3 s (typed) and 6 s (compose) and falls back to the scripted lines, so a slow or switched-off webhook never blocks a buyer. The AI can be switched off without n8n in the theme editor: **HS3 gift chat > Use the AI for typed answers**.

## Change them

The source is here. `shared.js` holds the rule helpers, `build.mjs` the prompts, the Guard and the Enforce code, and writes `typed.js` and `compose.js` (n8n Workflow SDK code, what is live) plus the node code on its own for `test-rules.mjs`.

1. Edit `build.mjs` or `shared.js`, then `node build.mjs && node test-rules.mjs`.
2. Paste the changed node code into the workflow (n8n MCP `update_workflow`, or the editor), then publish. n8n keeps every version, so rollback is publishing the previous version in the workflow's history.
3. Check it live. The webhook ignores bots, so send a browser user agent:

```sh
curl -sS -A 'Mozilla/5.0 (iPhone) Mobile' -H 'Origin: https://heartside.io' -H 'Content-Type: application/json' \
  -d '{"session":"check0001","step":"home","question":"What does Kuku do when Sam comes home?","typed_text":"she sits in the window from 5pm","dog":{"name":"Kuku","pronoun":"she"},"recipient":{"name":"Sam","relation":"partner"}}' \
  https://krishraja10101.app.n8n.cloud/webhook/heartside-typed-answer
```

## Checked on 13 October 2026 (live)

- Typed answer: 200 with the 5.2 JSON, usually 1.3 to 1.9 s with thinking off (one cold call took 3.6 s, which the theme turns into the fallback).
- Grief ("she passed away in March"), profanity, a prompt injection ("ignore your instructions...") and an answer about chemo were all refused with the try-again line.
- The ninth call in one session got 429. A call from another origin got 403.
- Compose: 200 in 1.5 to 1.9 s; chip lines came back unchanged, the typed line kept "5pm", the pick and the reason followed the answers.
