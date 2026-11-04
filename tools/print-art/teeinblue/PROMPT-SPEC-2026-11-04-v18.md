# Painter prompt spec v18: Roast (4 November 2026)

Recipe version `actual-dog-recipes-v18-roast`, recipes SHA-256 `ce8ba2bcc334b0e6daf693cb1e3e32076465f9d19ede3e770a36376aae75fe32`. It follows v17 (`PROMPT-SPEC-2026-10-31-v17.md`).

Status: theme-only. It ships with the next theme push. Nothing changes in Teeinblue.

## Why

Krish, 4 November: "if we've chosen roast, should be somewhat hilarious and have more hilarity in it", and "Hilarious should be the dog being hilarious, and roast should be the dog lightly mocking the person who's getting the gift based on all the inputs and its traits and personality." The fourth tone is shown to buyers as Roast; its id stays `over_the_top`, so saved carts and Teeinblue's three-value tone option (Roast selects Hilarious there, as before) are unchanged. Until v18 its painting was a straight royal portrait (velvet throne, royal court, "royally unimpressed"), so a funny note arrived on a dignified picture.

## What changed (Roast only; Sentimental, Warm and Hilarious are byte for byte v17)

1. **The pose line** is a visible roast: the dog openly judging its person, who stays out of frame, with a dramatic side-eye down the lens, one brow raised, smug. The joke is in the attitude, never the dog's body. The general line no longer says "chin lifted", so a scene's own pose (chin on paws) never conflicts with it.
2. **The scenes** (spot, toy, boss, none) hog the stated place and judge the viewer: sprawled across the whole couch, starfished across the bed, a long-suffering stare from the rug, a paw planted on the stated toy. Four archetype lines (Retriever, Companion Velcro, Guardian, Scent Detective) carry the roast's attitude, and every archetype's own Roast scene (these ship, with `archetypeScenes` on) now judges the person instead of posing in triumph: the retriever waits on you pointedly, the terrier looks down at you from its cushion mountain, the sighthound swoons with heavy-lidded disdain, the herding dog narrows its eyes like a supervisor, the guardian is a bouncer at the door.
6. **A roast is awake.** A nap never sets a Roast scene, so "in the middle of a nap" no longer fights "both eyes open".
3. **The blanket figures** are "smug, hogging the space with diva confidence ... a dramatic side-eye".
4. **The camera** is "a centered, slightly low view, like a grand portrait spoofed for laughs".
5. **The buyer's own brief** (`hs-brief.js`) leads "Roast portrait:" and describes the same side-eye.

Every new word was checked against the saved blocks' Avoid line: no food or snacks, nothing that could be drawn as writing (no report, list or sign), no audience or other people, and no object the owner did not name. Theatrical staging (a velvet cushion, a spotlight, the person's own couch cushions) is still allowed under the 29 October ruling, and crowns, capes and costumes are still never asked for.

## Field limits

Across every style, format, breed archetype, answer, two toys and a worn item, Roast's Tone direction is at most 1,069 of the field's 1,200 characters, and Energy at most 216 of 300.

The four saved blocks, byte for byte as before:
- mug `aa41590e9e59effb331bbea91d4064a1eb5c3eb7c6bfa47f595a7144041194c6` (v16);
- portrait `dddbf245f588aea4487a9da1dc4c0da6dafa5ce5d2d98c634a4d71ab8b39f6cd`;
- blanket `b6aa708e8737f483362f99d8433b50dd4282e480a11df5f882e20f453a5d0108`;
- card `1868aab7a1bf48770259028da9c443ada62311ae4cb0b0c004af5d34bfebacbd`.

## Not verified here

No image has been generated from v18. The Roast jobs on the test board (`design/pipeline-test-board/`) and in `design/examples-2026-10-29-breeds/` are regenerated and ready to paint, which spends credits and waits for Krish's yes.
