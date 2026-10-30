# Phone batch for release, 29 October 2026

Krish runs this on his own phones, against the draft theme "Heartside 28 Oct fixes" at its preview link from the Shopify admin. It is the last gate before that theme goes live. The detailed steps are in `phone-checks.md` from the 29 October delivery folder. This sheet adds what changed today, and it does not change the budget.

**Budget:** exactly 5 paintings remain of the 14 approved. If one fails, stop and report. Never paint a sixth.

**Record every run:** screen-record each one. Afterwards, copy the photo log (step 0) into the report.

## 0. Before any painting

Open each product page with `?hsdebug=photo` added to the preview link. That turns on the on-page photo log, which survives a reload in that tab. Note the clock time each painting starts and the time its design appears.

## 1. The five paintings, in this order

1. **Android Edge, mug, camera original.**
   - First, a bad photo must be rejected.
   - Then a large camera-original photo paints.
2. **Android Edge, the same mug, a second painting through redo.**
   - The cart shows the First and New labels.
   - The old line is removed.
   - A HEIC file is rejected.
   - Quantity stays at one per design.
3. **Android Chrome, Sentimental collage blanket.**
   - Type the toy and accessory first, with no blur before choosing the photo: green hedgehog, red plaid bandana.
   - Both must repeat in the design.
   - The Chrome mug still gets the picker and the rejection check, with no painting.
4. **iPhone Safari, Unframed portrait at $59, Hilarious.**
   - Check that it is a real likeness.
   - Check the exact text.
   - The comic premise must be visible, which is the v8 recipe's first real test.
5. **Edge, Mock 5: Mochi, Maltipoo, she; pink Fine ink; Sentimental.**
   - Rejection first.
   - Reload, and use back, mid-painting. Neither may start a second painting.
   - Toronto shipping is refused.
   - Then a controlled Chicago test checkout, using the agreed bounded test-payment procedure.

## 2. New in today's draft: check on every painting

- [ ] **The painting card never shows a percentage, and never says "nearly" or "almost".**
  - It says "Checking your photo on this device and getting it ready.", then "Your photo is with the painter. The finished picture comes back all at once."
  - It counts up: "Started just now.", "Started 30 seconds ago.", "Started 1 minute ago."
- [ ] **The count survives a reload and the back button (Mock 5)**, and no second painting starts.
- [ ] **When Teeinblue's framing box opens,** the card says "It's painted. Check the framing, then Save." After Save it says "Putting it on your gift."
- [ ] **Past two minutes,** the card says "This one is taking longer than most…", and "Artwork failed or stopped?" appears. Nothing repaints by itself.
- [ ] **Buddy's typed replies and the note still arrive.** They now come through calls with deadlines; if a call is slow, the buyer's own words are used.
- [ ] **Add to cart for a multi-gift order** shows "Getting … picture ready for checkout." and lands without another tap.

## 3. What to send back

For each painting, send:

- the device and browser;
- the time from start to the design appearing;
- the recording;
- the photo log;
- pass or fail on each box above.

When all five pass, the session publishes the theme with the guarded push, then runs the production gates and reads payments back. Any failure keeps the draft, and the remaining budget is reported.
