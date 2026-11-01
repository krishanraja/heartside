#!/usr/bin/env python3
"""Render Heartside's silent, 12-second production proof from committed inputs."""
import argparse
from functools import lru_cache
from pathlib import Path
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
INPUTS = ROOT / 'design/launch-reel-2026-11-02/inputs'
SIZE = (1080, 1920)
FPS = 30
TIMES = (0.2, 2.0, 4.0, 6.2, 7.0, 8.9, 10.5, 11.9)
CREAM = '#EFE9E0'
INK = '#3C2D23'
WHITE = '#FFF8EC'
BREEDS = ('doodle', 'frenchie', 'dachshund', 'lab', 'shepherd')


@lru_cache(maxsize=12)
def photo(name):
    with Image.open(INPUTS / name) as source:
        return ImageOps.exif_transpose(source).convert('RGB')


def cover(source):
    return ImageOps.fit(source, SIZE, method=Image.Resampling.LANCZOS)


@lru_cache(maxsize=32)
def font(size, small=False):
    name = 'HS-Fraunces-Text.ttf' if small else 'HS-Fraunces-SemiBold.ttf'
    return ImageFont.truetype(str(ROOT / 'tools/fonts' / name), size)


def label(canvas, words, center_y, size, color, opacity=1.0, small=False):
    # Fit the complete line, including glyph overhangs, within the safe area.
    while True:
        face = font(size, small)
        box = face.getbbox(words)
        if box[2] - box[0] <= SIZE[0] - 128:
            break
        size -= 1
    layer = Image.new('RGBA', SIZE)
    x = (SIZE[0] - (box[2] - box[0])) / 2 - box[0]
    y = center_y - (box[3] - box[1]) / 2 - box[1]
    ImageDraw.Draw(layer).text((x, y), words, font=face, fill=color)
    if opacity < 1:
        layer.putalpha(layer.getchannel('A').point(lambda a: round(a * max(0, opacity))))
    canvas.paste(layer, (0, 0), layer)


def video_still(ffmpeg, time):
    result = subprocess.run(
        [ffmpeg, '-v', 'error', '-ss', str(time), '-i', str(INPUTS / 'shot1-runway.mp4'),
         '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
         '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920', '-'],
        check=True, stdout=subprocess.PIPE)
    return Image.frombytes('RGB', SIZE, result.stdout)


@lru_cache(maxsize=1)
def end_background():
    background = cover(photo('set-golden-real.jpg')).filter(ImageFilter.GaussianBlur(18))
    return Image.blend(background, Image.new('RGB', SIZE, (40, 28, 20)), 0.55)


def frame(time, first=None):
    if time < 3.5:
        canvas = cover(first)
        label(canvas, 'Your dog loves you too.', 1920 * 0.12, 82, WHITE,
              min(1, max(0, (time - 0.4) / 0.5)))
    elif time < 9.5:
        canvas = Image.new('RGB', SIZE, CREAM)
        if time < 6.5:
            source = photo('mug-real-golden.jpg')
            zoom = 1 + 0.08 * (time - 3.5) / 3
            words = 'Painted all the way round.'
        else:
            index = min(4, int(round((time - 6.5) * FPS) // 18))
            source = photo('mug-real-' + BREEDS[index] + '.jpg')
            zoom = 1
            words = 'Any breed. Any mood.'
        width = round(1080 * zoom)
        height = round(source.height * width / source.width)
        scaled = source.resize((width, height), Image.Resampling.LANCZOS)
        canvas.paste(scaled, ((1080 - width) // 2, (1920 - height) // 2))
        label(canvas, words, 1920 * 0.12, 76, INK)
    else:
        canvas = end_background().copy()
        alpha = min(1, (time - 9.5) / 0.4)
        for words, y, size, small in (
            ('Heartside', 790, 156, False),
            ("Your dog's illustrated mug", 965, 64, True),
            ('$45', 1095, 80, True),
            ('heartside.io', 1230, 58, True),
        ):
            label(canvas, words, y, size, WHITE, alpha, small)
    return canvas


def check(directory):
    paths = sorted(directory.glob('*.png'))
    if len(paths) != 8:
        raise ValueError(f'Expected 8 PNGs in {directory}, found {len(paths)}')
    for path in paths:
        with Image.open(path) as image:
            image.load()
            if image.size != SIZE or image.mode != 'RGB' or image.format != 'PNG':
                raise ValueError(f'{path}: expected 1080x1920 RGB PNG, got {image.size} {image.mode}')
    print('PASS: 8 PNGs, each 1080x1920 RGB')


def read_exact(stream, size):
    data = bytearray()
    while len(data) < size:
        chunk = stream.read(size - len(data))
        if not chunk:
            raise RuntimeError('Video decoder ended before 3.5 seconds')
        data.extend(chunk)
    return bytes(data)


def render(out, ffmpeg):
    out.parent.mkdir(parents=True, exist_ok=True)
    decoder = subprocess.Popen(
        [ffmpeg, '-v', 'error', '-i', str(INPUTS / 'shot1-runway.mp4'), '-t', '3.5',
         '-vf', 'fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
         '-an', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    encoder = None
    try:
        encoder = subprocess.Popen(
            [ffmpeg, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
             '-s', '1080x1920', '-r', '30', '-i', '-', '-an', '-c:v', 'libx264',
             '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
             '-movflags', '+faststart', '-f', 'mp4', str(out)], stdin=subprocess.PIPE)
        for index in range(360):
            first = None
            if index < 105:
                first = Image.frombytes('RGB', SIZE, read_exact(decoder.stdout, 1080 * 1920 * 3))
            encoder.stdin.write(frame(index / FPS, first).tobytes())
        decoder.stdout.close()
        if decoder.wait() != 0:
            raise RuntimeError('ffmpeg decoder failed')
        encoder.stdin.close()
        if encoder.wait() != 0:
            raise RuntimeError('ffmpeg encoder failed')
    finally:
        for process in (decoder, encoder):
            if process is not None and process.poll() is None:
                process.terminate()
                process.wait()
    print(f'Rendered {out}: 360 frames, 12.0 seconds, silent')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--out', type=Path, default=ROOT / 'tools/reel/out/launch-reel-proof.mp4')
    group.add_argument('--frames-only', type=Path, metavar='DIR')
    group.add_argument('--check', type=Path, metavar='DIR')
    args = parser.parse_args()
    if args.check is not None:
        check(args.check)
        return
    ffmpeg = shutil.which('ffmpeg')
    if args.frames_only is not None:
        args.frames_only.mkdir(parents=True, exist_ok=True)
        for time in TIMES:
            first = None
            if time < 3.5:
                if ffmpeg:
                    first = video_still(ffmpeg, time)
                else:
                    with Image.open(INPUTS.parent / 'f1.jpg') as image:
                        first = image.convert('RGB')
            frame(time, first).save(args.frames_only / f'frame-{time:04.1f}.png')
        print(f'Wrote 8 frames to {args.frames_only}; scene 1: {"ffmpeg" if ffmpeg else "f1.jpg fallback"}')
    elif ffmpeg:
        render(args.out, ffmpeg)
    else:
        raise RuntimeError('ffmpeg is required for MP4 output; use --frames-only DIR for Pillow-only previews')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        print(f'Error: {error}', file=sys.stderr)
        sys.exit(1)
