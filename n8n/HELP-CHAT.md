# Help chat: the friendly help assistant in the corner

Krish asked for this on 10 November 2026: "a good looking and easy to use chatbot in the bottom right corner that is specifically scoped to Heartside and answers all the questions a user may have and allows them to click one-click chips. If the conversation goes on too long or they ask to get in touch with someone, we send a history of the chat to jonny@heartside.io, with a promise someone will reach out to them via email within the next 6 hours." He added: "super friendly, reassuring, and have a humanoid emoji/bitmoji-style emoji of a regular guy with a call center headset."

## The parts

- **Theme:** `shopify/snippets/hs-help.liquid`, `assets/hs-help.js`, `assets/hs-help.css` and `assets/hs-help-agent.svg` (the avatar).
  - The memo strip, which is on every page, renders the snippet. The printable card page is skipped.
  - The whole thing stays off until the memo strip's **Help chat address** setting holds the workflow's webhook address, so that address is never written into this repository.
- **Workflow:** "Heartside: help chat" in n8n. Its source is `n8n/help-chat.workflow.js`.

## What the buyer sees

- **A launcher in the bottom-right corner:** the avatar with a green "online" dot, and "Questions? We're here to help". On phones it shows the avatar only.
  - It moves up above any bar pinned to the bottom of the screen: the journey dock, the sticky button and the next-gift bar.
- **A panel:** a card on desktop and a bottom sheet on phones. Its header reads "Heartside Help" and "Instant answers from our help assistant. Real people are one tap away." The assistant never claims to be a person.
- **One-tap chips:** How it works, Prices, Christmas delivery, Where is my order?, Returns and refunds, and Talk to a person.
  - Chips answer at once from text in `hs-help.js`. They make no AI call and cost nothing.
  - The answers come from the live shipping and refund policies and from `llms.txt`.
- **Typed questions** go to the workflow, which answers with Claude Sonnet.
  - The answer covers Heartside only, in one to four friendly sentences, and suggests chips that fit.
  - It is cleaned to the house style: no exclamation marks, no em dashes, and only chips from the known list.
- **A person:** the email form opens in four cases:
  - the buyer types anything like "talk to someone" (no AI call is made);
  - the buyer taps Talk to a person;
  - the assistant judges that a person is needed;
  - the eighth question in one chat.
- **Sending the form:**
  1. The whole chat goes to jonny@heartside.io from hello@krishraja.com, with reply-to set to the buyer's address.
  2. The buyer is told: "Someone from the Heartside team has this chat and will email you at ... within the next 6 hours."
- **The chat lasts the visit.** It survives moving between pages in the same tab, using sessionStorage.

## Limits

- 30 typed questions per chat a day.
- 3 handoffs per chat.
- 240 AI answers across the site per hour.
- Past a limit, the buyer is offered a person.
- Messages are capped at 600 characters, and the last 16 messages are sent to Claude.

## Privacy

- Successful runs and manual runs are not saved, so the n8n execution list holds no chats.
- Chats exist only in the buyer's tab and in the email to the team.

## Checked on 10 November 2026

- `tools/preview/help.browser.test.mjs`: 8 pass, on desktop and on 390 px and 320 px phones. They cover:
  - where the launcher sits;
  - chips answering with no call;
  - a typed question;
  - asking for a person, with a bad and then a good email;
  - the promise of a reply within 6 hours;
  - the eighth-question offer;
  - a failed answer;
  - lifting above a pinned bar;
  - no sideways scroll at 320 px;
  - the chat surviving a reload.
- The workflow was run on pinned data in n8n (executions 53700 to 53702):
  - an answer with an em dash, an exclamation mark and an unknown chip came back clean;
  - a handoff built the email to jonny@heartside.io;
  - a bad email was refused.
- No real Claude call or email has been made yet.

## Live state (10 November 2026, on Krish's yes)

- **The workflow is published.** A real question was answered by Claude in about 2 seconds (it acknowledged the problem, gave the policy answer and offered a person). A real test handoff reached Gmail as sent to jonny@heartside.io (Gmail message id 1a1c553ef3685860). Both runs went through n8n directly, because this sandbox's proxy adds its own n8n sign-in to webhook calls, which n8n refuses.
- **The theme** goes out through the guarded push with `help_chat: on`.
- **The address:** the repository secret `HS_HELP_CHAT_URL` has to be added by Krish (a session may not write secrets). Until then, paste the production webhook into the memo strip's Help chat address in the theme editor.

## Going live (each step needs Krish's yes)

1. Publish the workflow in n8n.
2. Push the theme through the guarded workflow.
3. Put the workflow's production webhook address in the memo strip's **Help chat address** setting (theme editor, header, HS memo bar).
4. Send one real handoff and confirm it reaches jonny@heartside.io.

To turn it off, empty the setting.

## Still to do

- **The avatar** in `hs-help-agent.svg` is a placeholder drawn in code. The final one is made through the Codex lane (`codex/README.md`) once Krish approves a direction.
- **Contact address:** the policies list krish@heartside.io as the contact, while handoffs go to jonny@heartside.io. Check that jonny@heartside.io receives mail before going live.
