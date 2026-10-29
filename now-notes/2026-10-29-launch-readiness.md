Status: The 29 October handover's four repository priorities are built, tested and on the draft theme "Heartside 28 Oct fixes" through PR #72, which supersedes #71. The live theme is unchanged. Release waits only on Krish's 5-painting phone batch (`docs/review/PHONE-BATCH-2026-10-29.md`). Real payments are on.

Changed:
- The painting card says only what is known. It shows no percentage and no "nearly there" on a timer, follows real events, counts elapsed time across reloads, and promises "1 to 3 minutes".
- Every text model call now has a deadline, published live and proved:
  - typed: Gemini 3 s, then 1.5 s;
  - note: Claude 6.5 s, then Gemini 3.5 s;
  - past both calls, the buyer's own words.
- The AI hourly limits are counted in a data table, so parallel calls cannot slip past them. Live, the ninth call in one session was refused with 429.
- The warm-up follows the buyer, because a cold n8n code runner adds about 1.4 s.
- Registration waits for the server's own 30 s ceiling, spreads its retries and registers two gifts at a time.
- The timing report, with sample sizes and limits: `docs/evidence/2026-10-29-timing-report.md`.
- The draft theme id no longer reaches the Actions log.
- The growth session was given its answers, a recalibration and the mandate to drive organic growth. Ruling (Krish, 2026-10-29): the customer email is krish@heartside.io.

Next: Krish runs the phone batch on the draft. When all five pass, the session publishes the theme with the guarded push, runs the production gates, and reads payments back.

North Star check (2026-10-29): holds. The number was not re-read this session, because the Shopify connector needs Krish to sign in again. The last reading is $24 against $250 (U4).
