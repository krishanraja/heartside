---
card: launch-reel-proof-2026-11-01
title: 12-second vertical proof reel for the illustrated mug, built in code from committed inputs
spend_id: a71dfb36-0c12-4eb7-a1f7-769cb59996ed
max_minutes: 40
max_calls: 40
write_allow: [tools/reel/*, .gitignore]
---
## Goal
Build `tools/reel/build_launch_reel.py`, a Python 3 script that renders a silent 12.0-second, 1080x1920, 30 fps
vertical video for Heartside from the files in `design/launch-reel-2026-11-02/inputs/`. This is a proof that the
production machine works (Krish, 2026-11-01: "focus on the fact that this system works and each part of the machine
is doing its job correctly and proportionately"). It will not be posted. Claude adds the licensed music afterwards;
never put audio in this repository, because it is public.

Timeline (seconds), each scene a hard cut unless stated:
1. 0.0 to 3.5: `inputs/shot1-runway.mp4` (720x1280, 5.04 s, a Runway clip), its first 3.5 s scaled to fill
   1080x1920. Words "Your dog loves you too." centred at about 12% from the top, fading in from 0.4 s to 0.9 s.
2. 3.5 to 6.5: `inputs/mug-real-golden.jpg` (1080x1350, the real product photo) on the cream background
   #EFE9E0, scaled to the full width and centred, with a slow push-in from 100% to 108% over the 3 s. Words
   "Painted all the way round." above it, in ink #3C2D23.
3. 6.5 to 9.5: five cuts of 0.6 s each on the same cream background, in this order: `mug-real-doodle.jpg`,
   `mug-real-frenchie.jpg`, `mug-real-dachshund.jpg`, `mug-real-lab.jpg`, `mug-real-shepherd.jpg`, each at full
   width and centred. Words "Any breed. Any mood." held above them for the whole 3 s.
4. 9.5 to 12.0: end card. `set-golden-real.jpg` scaled to fill 1080x1920, Gaussian blur radius 18, a dark warm
   overlay rgba(40,28,20,0.55). Centred, in this order: "Heartside" (large), "Your dog's illustrated mug", "$45",
   "heartside.io". Fade in over the first 0.4 s.

Type: Fraunces from `tools/fonts/` (the HS-Fraunces SemiBold file for "Heartside" and the scene words, the text
file for the small lines). Text in white #FFF8EC on scenes 1 and 4, in #3C2D23 on 2 and 3. Every line fits inside a
64 px side margin; never ellipsise. Never draw, warp or regenerate the mug paintings: they are real product photos
and only move and scale.

The script:
- `--out PATH` writes the MP4 (H.264, yuv420p, 30 fps, no audio) using the `ffmpeg` binary on PATH. Default
  `tools/reel/out/launch-reel-proof.mp4`. Add `tools/reel/out/` to `.gitignore`.
- `--frames-only DIR` writes PNG frames at 0.2, 2.0, 4.0, 6.2, 7.0, 8.9, 10.5 and 11.9 s instead, with Pillow only,
  so it works where ffmpeg is missing. Read video frames for scene 1 with `ffmpeg` if present; when it is missing,
  `--frames-only` uses a still taken from `design/launch-reel-2026-11-02/f1.jpg` for scene 1.
- `--check DIR` opens those PNGs and exits non-zero unless there are 8, each 1080x1920 RGB.
- Write `tools/reel/README.md`: what it makes, the inputs, the commands, and that audio is added outside the repo.

## Acceptance
python3 tools/reel/build_launch_reel.py --frames-only tools/reel/out/frames
python3 tools/reel/build_launch_reel.py --check tools/reel/out/frames
python3 -m py_compile tools/reel/build_launch_reel.py

## Return
The files you made, whether ffmpeg was on PATH and whether you rendered the MP4, and anything you could not do.
