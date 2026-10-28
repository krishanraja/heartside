# Mock order photos

Test files for Parts 2.3 and 3 of the [CoWork acceptance prompt](../COWORK-LIVE-ACCEPTANCE.md). They are derived from the stock dog photos in `assets/photos/`, not from any customer.

| File | Made from | Store photo check (28 Oct, Chromium, `HSPhotoQuality.check`) | Used in |
| --- | --- | --- | --- |
| `reject-blurry.jpg` | `maltipoo-on-deck.jpg`, Gaussian blur radius 6 | reject, `blur` (score 51, limit 65) | Part 2.3 and order 5 |
| `reject-too-small.jpg` | `pug-autumn-leaves.jpg`, resized to 725 × 480 | reject, `size` (short side 480, limit 600) | Order 5 |
| `large-camera-original.jpg` | `maltipoo-on-deck.jpg`, enlarged to 6000 × 4489 (27 MP, 4.3 MB) with light sharpening, like a phone camera's original | ok (blur 5844). The upload is resized to 4096 px on its long side as a JPEG (1.7 MB) | Part 2.3 |
| `close-up.jpg` | `red-poodle-head-tilt.jpg`, face crop | not checked (Artist's touch photos go to the artist, not the painter) | Order 3 |

The five originals all pass the check (`ok`): `golden-puppy-asleep.jpg`, `pug-autumn-leaves.jpg`, `red-poodle-head-tilt.jpg`, `apricot-poodle-puppy.jpg`, `maltipoo-on-deck.jpg`.

There is no HEIC file here: nothing in this environment can write one. A HEIC test needs a real one from a phone set to save HEIC (High efficiency), picked through the phone's own file picker. The store refuses it by type or file name, before reading it.
