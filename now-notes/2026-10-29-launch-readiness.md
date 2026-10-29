Status: The 29 October handover's four repository priorities are built, tested and pushed to the draft theme "Heartside 28 Oct fixes" through PR #72, which supersedes #71. The live theme is unchanged and real payments are on. Release waits only on Krish's 5-painting phone batch (docs/review/PHONE-BATCH-2026-10-29.md). The Shopify connector needs Krish to sign in again before the number can be re-read; it was last read as $24 against $250 (U4).

Changed: The painting card says only what is known: no timer-driven percentage or "nearly there", words that follow real events, and an elapsed count that survives reloads. It promises "1 to 3 minutes".

Changed: Every text model call has a deadline, published live and proved: typed answers try Gemini for 3 s then 1.5 s, the note tries Claude for 6.5 s then Gemini for 3.5 s, and past both the buyer's own words are used.

Changed: The AI hourly limits are counted in a data table, so parallel calls cannot slip past them; live, the ninth call in one session was refused with 429. The warm-up now follows the buyer, because a cold n8n code runner adds about 1.4 s.

Changed: Checkout registration waits for the server's own 30 s ceiling, spreads its retries and registers two gifts at a time. The timing report, with sample sizes and limits, is docs/evidence/2026-10-29-timing-report.md.

Changed: The growth session has its two answers, a recalibration and the mandate to drive organic growth. Ruling (Krish, 2026-10-29): the customer email is krish@heartside.io.

Next: Krish runs the phone batch on the draft. When all five paintings pass, the session publishes the theme with the guarded push, runs the production gates and reads payments back.

North Star check (2026-10-29): holds.
