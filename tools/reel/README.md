# Heartside launch reel proof

Builds a silent 12.0-second, 1080×1920, 30 fps vertical production proof. This is approved for proof only, not posting. Python 3 and Pillow are required; MP4 output also requires `ffmpeg` on PATH with libx264 support.

The committed inputs in `design/launch-reel-2026-11-02/inputs/` are `shot1-runway.mp4`, `mug-real-golden.jpg`, `mug-real-doodle.jpg`, `mug-real-frenchie.jpg`, `mug-real-dachshund.jpg`, `mug-real-lab.jpg`, `mug-real-shepherd.jpg`, and `set-golden-real.jpg`. Type uses `tools/fonts/HS-Fraunces-SemiBold.ttf` and `HS-Fraunces-Text.ttf`.

The edit hard-cuts from the first 3.5 seconds of Runway footage to a three-second golden mug push-in, then five 0.6-second breed photos, then a 2.5-second blurred and darkened end card. Product artwork is preserved; the photos only scale and move. Text is fitted within 64 px side margins without ellipses.

From the repository root:

```sh
python3 tools/reel/build_launch_reel.py
python3 tools/reel/build_launch_reel.py --out tools/reel/out/custom.mp4
python3 tools/reel/build_launch_reel.py --frames-only tools/reel/out/frames
python3 tools/reel/build_launch_reel.py --check tools/reel/out/frames
python3 -m py_compile tools/reel/build_launch_reel.py
```

Default output: `tools/reel/out/launch-reel-proof.mp4` (H.264, yuv420p, no audio). Paths supplied on the command line resolve relative to the current directory; input and font paths resolve relative to the script. Generated outputs are ignored by git.

Frames-only writes RGB PNGs at 0.2, 2.0, 4.0, 6.2, 7.0, 8.9, 10.5 and 11.9 seconds. It uses ffmpeg to extract scene 1 frames when available; without ffmpeg it uses the committed `design/launch-reel-2026-11-02/f1.jpg` still and otherwise requires only Pillow. Use a dedicated preview directory: `--check` requires exactly eight PNGs and verifies their decoded dimensions and RGB mode.

Licensed music is added by Claude outside this public repository. Never add audio here.

## Proof verification, 2026-11-01

Status: Built locally. All three card acceptance commands passed. ffmpeg was on PATH; ffprobe decoded 360 frames and reported one H.264 video stream, 1080×1920, yuv420p, 30/1 fps and 12.000000 seconds, with no audio stream. The Pillow fallback also produced eight valid previews with ffmpeg discovery disabled. The eight-frame contact sheet was visually inspected; this is sampled visual review, not approval for posting.

Next: Claude reviews the silent proof and adds licensed music outside the repository.

North Star check (2026-11-01): holds. The production path is demonstrated; sales impact is unmeasured. This record stays here because the card permits writes only under `tools/reel/` and `.gitignore`.
