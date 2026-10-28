# Mock order photos

Test files for Part 3 of the [CoWork acceptance prompt](../COWORK-LIVE-ACCEPTANCE.md). They are derived from the stock dog photos in `assets/photos/`, not from any customer.

| File | Made from | Store photo check (28 Oct, Chromium, `HSPhotoQuality.check`) | Used in |
| --- | --- | --- | --- |
| `reject-blurry.jpg` | `maltipoo-on-deck.jpg`, Gaussian blur radius 6 | reject, `blur` (score 51, limit 65) | Order 5 |
| `reject-too-small.jpg` | `pug-autumn-leaves.jpg`, resized to 725 × 480 | reject, `size` (short side 480, limit 600) | Order 5 |
| `close-up.jpg` | `red-poodle-head-tilt.jpg`, face crop | not checked (Artist's touch photos go to the artist, not the painter) | Order 3 |

The five originals all pass the check (`ok`): `golden-puppy-asleep.jpg`, `pug-autumn-leaves.jpg`, `red-poodle-head-tilt.jpg`, `apricot-poodle-puppy.jpg`, `maltipoo-on-deck.jpg`.
