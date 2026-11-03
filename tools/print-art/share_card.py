#!/usr/bin/env python3
"""Render Heartside's approved social cards using Pillow and repository assets.

Run with --out DIRECTORY to render, or --check DIRECTORY to validate delivery.
WOFF2 is opened directly when supported; otherwise fontTools + brotli can
convert fonts in a temporary directory (never in the repository).
"""
import argparse
import math
from pathlib import Path
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
CREAM = '#FBF6F1'
INK = '#121010'
STAMP = '#A8284E'
ASSETS = ROOT / 'shopify/assets'
SIZES = ((1200, 630), (1200, 1200))


class Fonts:
    def __init__(self, temporary):
        self.temporary = Path(temporary)
        self.paths = {}

    def get(self, family, size, weight=400):
        name = {'sans': 'hs-dmsans', 'serif': 'hs-fraunces',
                'italic': 'hs-fraunces-italic'}[family]
        path = self.paths.get(name, ASSETS / (name + '.woff2'))
        try:
            font = ImageFont.truetype(str(path), size)
        except OSError:
            try:
                from fontTools.ttLib import TTFont
            except ImportError as exc:
                raise RuntimeError('WOFF2 unsupported: install fonttools brotli') from exc
            path = self.temporary / (name + '.ttf')
            with TTFont(ASSETS / (name + '.woff2')) as converted:
                converted.flavor = None
                converted.save(path)
            self.paths[name] = path
            print(f'Converted {name} to temporary TTF')
            font = ImageFont.truetype(str(path), size)
        try:
            axes = font.get_variation_axes()
        except OSError:
            axes = []
        if axes:
            values = [max(a['minimum'], min(a['maximum'], weight))
                      if a['name'] == b'Weight' else a['default'] for a in axes]
            font.set_variation_by_axes(values)
        return font


def width(draw, text, font, spacing=0):
    # Include glyph overhangs as well as advances in the fit calculation.
    box = draw.textbbox((0, 0), text, font=font)
    return max(draw.textlength(text, font=font), box[2]) - min(0, box[0]) + spacing * max(0, len(text) - 1)


def line(image, fonts, text, xy, family, size, color, weight=400,
         spacing=0, available=536):
    draw = ImageDraw.Draw(image)
    requested = size
    while True:
        font = fonts.get(family, size, weight)
        if width(draw, text, font, spacing) <= available:
            break
        size -= 2
        if size < 2:
            raise ValueError(f'Cannot fit {text!r}')
    if size != requested:
        print(f'{image.height}px card: {text!r} shrunk {requested} -> {size}px')
    box = draw.textbbox((0, 0), text, font=font)
    x, y = xy
    x -= min(0, box[0])
    # y means visible top, so all rows have predictable spacing.
    if spacing:
        for char in text:
            draw.text((x, y - box[1]), char, font=font, fill=color)
            x += draw.textlength(char, font=font) + spacing
    else:
        draw.text((x, y - box[1]), text, font=font, fill=color)
    return size


def picture(image, box, radius):
    x, y, w, h = box
    with Image.open(ASSETS / 'hs-ex-set-golden.webp') as source:
        crop = ImageOps.fit(source.convert('RGB'), (w, h),
                            method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    mask = Image.new('L', (w, h), 255 if not radius else 0)
    if radius:
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=255)
    image.paste(crop, (x, y), mask)


def tag(image, fonts, x, y):
    font = fonts.get('sans', 15, 700)
    draw = ImageDraw.Draw(image)
    w = math.ceil(width(draw, 'EXAMPLE', font, 1) + 24)
    overlay = Image.new('RGBA', image.size)
    ImageDraw.Draw(overlay).rounded_rectangle((x, y, x + w, y + 32), 8,
                                              fill=(26, 21, 20, 199))
    image.paste(Image.alpha_composite(image.convert('RGBA'), overlay).convert('RGB'))
    line(image, fonts, 'EXAMPLE', (x + 12, y + 9), 'sans', 15, 'white',
         weight=700, spacing=1, available=w - 24)


def footer(image, fonts, y, available):
    # Fit both items as one row, keeping a clear gap between them.
    draw = ImageDraw.Draw(image)
    size = 26
    gap = 24
    while sum(width(draw, t, fonts.get('sans', size, weight))
              for t, weight in [('heartside.io', 700), ('Free US shipping', 400)]) + gap > available:
        size -= 2
    if size != 26:
        print(f'{image.height}px card: footer shrunk 26 -> {size}px')
    line(image, fonts, 'heartside.io', (64, y), 'sans', size, INK, 700, available=available)
    x = 64 + width(draw, 'heartside.io', fonts.get('sans', size, 700)) + gap
    line(image, fonts, 'Free US shipping', (x, y), 'sans', size, '#8A4A2B', available=available - (x - 64))


def render(size, fonts):
    image = Image.new('RGB', size, CREAM)
    square = size[1] == 1200
    picture(image, (0, 0, 1200, 700) if square else (640, 40, 520, 550), 0 if square else 24)
    tag(image, fonts, 12 if square else 652, 12 if square else 52)
    with Image.open(ROOT / 'design/brand-v4/icon-1024.png') as heart:
        heart = heart.convert('RGBA').resize((56, 56), Image.Resampling.LANCZOS)
        image.paste(heart, (64, 724 if square else 52), heart)
    available = 1072 if square else 536
    rows = [('GIFTS FROM YOUR DOG', 796 if square else 144, 'sans', 20, STAMP, 700, 2),
            ('Your dog', 838 if square else 203, 'serif', 76, INK, 600, 0),
            ('loves you too.', 926 if square else 294, 'italic', 76, STAMP, 600, 0),
            ('Mug · Blanket · Portrait', 1022 if square else 407, 'sans', 28, '#3E322D', 400, 0)]
    for text, y, family, px, color, weight, spacing in rows:
        line(image, fonts, text, (64, y), family, px, color, weight, spacing, available)
    footer(image, fonts, 1120 if square else 550, available)
    return image


def check(directory):
    errors = []
    for size in SIZES:
        path = directory / f'share-{size[0]}x{size[1]}.jpg'
        try:
            with Image.open(path) as image:
                image.load()
                if (image.format, image.mode, image.size) != ('JPEG', 'RGB', size):
                    errors.append(f'{path}: expected RGB JPEG {size}, got {image.format} {image.mode} {image.size}')
            if size == (1200, 630) and path.stat().st_size >= 300000:
                errors.append(f'{path}: must be under 300000 bytes')
        except (OSError, ValueError) as exc:
            errors.append(f'{path}: {exc}')
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print('PASS: both RGB JPEGs have the required dimensions; landscape is under 300000 bytes.')
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--out', type=Path)
    group.add_argument('--check', type=Path)
    args = parser.parse_args()
    if args.check is not None:
        return check(args.check)
    args.out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='heartside-share-fonts-') as temporary:
        fonts = Fonts(temporary)
        for size in SIZES:
            path = args.out / f'share-{size[0]}x{size[1]}.jpg'
            render(size, fonts).save(path, 'JPEG', quality=86, optimize=True)
            print(f'Wrote {path} ({path.stat().st_size} bytes)')
    return check(args.out)


if __name__ == '__main__':
    sys.exit(main())
