# Phone batch results, 29 October 2026

Status: Stopped before painting 1. **Failed.** Do not publish.

Krish's verdict: "Literally nothing works functionally and the user flow is a 0 out of 10."

In plain terms, a customer on a phone cannot get from the chat to a painted product without hitting broken or confusing steps:

- **The tone control does nothing useful.** Set to Hilarious, it gives a sentimental note, and Update note only swaps a few words.
- **The note keeps changing without being asked.** It came back in three different wordings across three screens.
- **The first photo control can't be tapped.** The paw circle on the gift step looks decorative and does nothing.
- **Buttons go to the wrong place.** "Choose Mowgli's gifts" shows up after the gift is already chosen.
- **The same questions are asked again and again.** By the product page, the customer has seen the note, what will be painted, the style and the tone two to four times, and is asked to type the toy, collar, note and signature again.
- **The steps are in the wrong order.** The photo, the one thing the product needs, comes last, after several screens of copy.

The few passes below show only that the test setup worked (the preview, the log, Buddy replying). They are not product passes.
Tester: Krish, on his own Android phone. Guide and recorder: a Claude Code session.
Theme under test: the draft theme "Heartside 28 Oct fixes", opened through its Shopify preview link.

## Paintings

| | |
|---|---|
| Used | 0 |
| Remaining | 5 of 5 |

The batch stopped at Krish's call, before any painting started, because the flow before the photo step failed. All five paintings stay available for a rerun on the rebuilt flow.

## Devices

| Device | Browser | Tested |
|---|---|---|
| Android 10 | Edge (Chrome 156 engine) | Yes, up to the product page photo step |
| Android | Chrome | Not tested |
| iPhone | Safari | Not available. Krish had no iPhone in hand, so painting 4 cannot run as written. |

## What ran: Android, Edge, the illustrated mug flow (about 17 minutes, 09:14 to 09:31)

| Check | Result | Notes |
|---|---|---|
| Draft theme preview opens on the phone | Pass | The preview bar showed "Heartside 28 Oct fixes · Draft" on every screen. |
| `?hsdebug=photo` turns on the Photo log | Pass | It stayed on in the tab after the address lost the parameter, and came back on the product page. |
| Photo log usable on a phone | Fail (test tool only) | The panel covered page buttons, so Krish had to hide it. On the product page it covered the photo box and Add to cart. Customers never see it. |
| Buddy replies within a few seconds when typed to | Pass | |
| Note step: tone slider placement | Fail | Krish: "The slider should go next to the text with a much clearer update button because we're refining the tone before we select the gifts whereas the slider is underneath the gifts button." |
| Note step: tone matches the slider | Fail | Slider on Hilarious; the note read "On the hard days, I stay right next to you." Krish: "it's on "Hilarious" and the copy is anything but hilarious." |
| Note step: Update note | Fail | Krish: "I did update the note and it just changes a couple of words but the message is pretty much the same." |
| Note step: layout stability | Fail | Krish: "The slider also changes the text underneath it, which looks volatile because it shifts other components around." |
| Note step: overall | Fail | Krish: "the whole slider experience looks tacky and unprofessional. It's in the wrong place. There are duplications of the word "hilarious." There's an extra button to update note and change word and the text to the left of the update note button just doesn't really need to be there. It's just verbal diarrhoea." |
| Note step: content below the main button | Fail | Krish: "I don't really understand why we're exploring artwork styles. Yet the bottom of this experience should just be "Choose the gift," not all that crap underneath about exploring artwork styles and then more copy underneath." |
| Gift step: mug preselected | Pass | "Buddy's pick" was on the mug. |
| Gift step: the paw photo circle | Fail | Krish: "The paw button is not tapable and it's not even clear that it's tapable even if it was tapable." |
| Gift step: onward button label | Fail | Krish: "we already showed them the three gifts at the top of the page so this button should be called "Paint your dog" or something like that. We then try to upsell them to a bundle later on. At this point in time they've just selected one of the three gifts so I don't really get why the button says "Choose Mowgli's Gifts."" |
| Choose step (pick one or more gifts, colour, "Personalize the mug · $45") | Pass | Krish: "makes a lot more sense". |
| Product page (personalize the mug) | **Fail, blocking** | The page repeats the note, what will be painted, the style and the tone, and asks again for toy, collar, note and signature. The note text had changed a third time, to "When the days are hard, I'm staying close." Krish: "Now we're back to this screen, which I already said I hate, which is just the worst UX on the planet. There are like four different versions of the same questions everywhere. We've already created this copy." |

## Not tested

Everything from the first photo choice onwards. None of these are passes.

- Painting 1, mug: bad photo refused, the painting screen messages and counter, the finished mug, review box, Add to cart hand-off.
- Painting 2, mug redo: HEIC refused, second version, cart with First and New, removal, quantity locked at 1.
- Painting 3, Chrome, blanket: Chrome refusal, toy and accessory painted, no words on the blanket.
- Painting 4, iPhone Safari, portrait: no iPhone available.
- Painting 5, Edge, Mochi: reload and Back while painting, Toronto refused, Chicago free shipping, stop at payment.

## The flow Krish wants (his words, for the rebuild)

Order: "selecting the breed of the dog and uploading the photo should be one of the first things that happens in this UX. Then the personality and style are mocked up and generated without generating the image so that they can confirm the details. Then they pick the gift and decide if they want any artwork style changes, tone changes, or any other favourite accessories or food items, etc., painted into the picture and then the painting begins."

Rules: "Every screen should accomplish just one thing and not be duplicative. It should be in the right order such that we don't start generating without enough detail but we don't let the user get bored and leave the site quickly. Everything should be clickable pills as opposed to them needing to type in anything."

On the previous screen: "the entirety of the previous screen should be just about nailing down the tone and copy of Mowgli (to make sure that we've captured his personality and traits and any accessories) because then this screen becomes about selecting the gifts."

Krish says he has given this direction before. Searching this repository found no written rule saying it, and the taste engine holds no approved Heartside rules yet. That is why it keeps coming back. Each of his words above was reported to his taste ledger on 29 October so they can become approved rules. The rebuild should be checked against these rules before anyone else runs a phone batch.

## Test photos used

Built for this run, not committed: three repository dog photos (`assets/photos/`), a no-dog picture, a tiny blurred picture and a real HEIC file. None were chosen on the site.
