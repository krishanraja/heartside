#!/usr/bin/env python3
"""Render the avatar comparison; --check validates the delivered card files.

Prefer CairoSVG, then rsvg-convert. Pillow fallback supports the deliberately
small SVG vocabulary used by this card (absolute paths, flat fills, circle clip).
It samples Bezier curves and supersamples; it is not a general SVG renderer.
"""
import argparse
import io
from pathlib import Path
import re
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET

from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
DEFAULT = ROOT / 'design/help-avatar-2026-11-10'
INK, CREAM = '#121010', '#FBF6F1'


def check(folder):
    errors = []
    for letter in 'abc':
        path = folder / f'option-{letter}.svg'
        try:
            data = path.read_bytes()
            source = data.decode('utf-8')
            root = ET.fromstring(source)
            if len(data) >= 6144:
                errors.append(f'{path.name}: must be under 6144 bytes')
            if root.get('viewBox') != '0 0 96 96':
                errors.append(f'{path.name}: incorrect viewBox')
            if root.get('role') != 'img' or root.get('aria-label') != 'Heartside help':
                errors.append(f'{path.name}: missing accessibility attributes')
            if re.search(r'<(?:image|script)\b|href\s*=\s*[\"\']https?://|@import', source, re.I):
                errors.append(f'{path.name}: forbidden content')
        except (OSError, ValueError, ET.ParseError) as exc:
            errors.append(f'{path.name}: {exc}')
    try:
        with Image.open(folder / 'sheet.png') as sheet:
            sheet.verify()
    except (OSError, ValueError) as exc:
        errors.append(f'sheet.png: {exc}')
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print('PASS: three SVGs, size, viewBox, accessibility, content and sheet.png')
    return 0


def subpaths(data):
    """Flatten this card's absolute SVG path commands into point lists."""
    tokens = re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?', data)
    i, command, point, points = 0, None, (0, 0), []
    while i < len(tokens):
        if tokens[i].isalpha():
            command = tokens[i]
            i += 1
        if command == 'Z':
            if points:
                points.append(points[0])
                yield points
                point = points[0]
                points = []
            command = None
            continue
        count = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'Q': 4, 'C': 6}.get(command)
        if count is None:
            raise ValueError(f'Unsupported fallback path command: {command}')
        values = list(map(float, tokens[i:i + count]))
        i += count
        if command == 'M':
            if points:
                yield points
            point = tuple(values)
            points = [point]
            command = 'L'
        elif command in ('L', 'H', 'V'):
            point = (values[0], point[1]) if command == 'H' else ((point[0], values[0]) if command == 'V' else tuple(values))
            points.append(point)
        else:
            start = point
            for step in range(1, 41):
                t = step / 40
                u = 1 - t
                if command == 'Q':
                    point = tuple(u*u*start[k] + 2*u*t*values[k] + t*t*values[k+2] for k in (0, 1))
                else:
                    point = tuple(u**3*start[k] + 3*u*u*t*values[k] + 3*u*t*t*values[k+2] + t**3*values[k+4] for k in (0, 1))
                points.append(point)
    if points:
        yield points


def pillow_svg(path, size):
    scale = size * 3 / 96
    image = Image.new('RGBA', (size * 3, size * 3))
    draw = ImageDraw.Draw(image)
    root = ET.parse(path).getroot()
    group = root.find('{*}g')
    for node in group:
        tag = node.tag.split('}')[-1]
        fill = node.get('fill', 'black')
        fill = None if fill == 'none' else fill
        def box(x, y, w, h):
            return tuple(v * scale for v in (x, y, x+w, y+h))
        if tag in ('circle', 'ellipse'):
            x, y = float(node.get('cx')), float(node.get('cy'))
            rx = float(node.get('r', node.get('rx', 0)))
            ry = float(node.get('r', node.get('ry', 0)))
            draw.ellipse(box(x-rx, y-ry, 2*rx, 2*ry), fill=fill)
        elif tag == 'rect':
            draw.rounded_rectangle(box(*(float(node.get(k)) for k in ('x', 'y', 'width', 'height'))), radius=float(node.get('rx', 0))*scale, fill=fill)
        elif tag == 'path':
            for points in subpaths(node.get('d')):
                points = [(x*scale, y*scale) for x, y in points]
                if fill:
                    draw.polygon(points, fill=fill)
                if node.get('stroke'):
                    width = round(float(node.get('stroke-width', 1))*scale)
                    draw.line(points, fill=node.get('stroke'), width=width, joint='curve')
                    if node.get('stroke-linecap') == 'round':
                        r = width/2
                        for x, y in points:
                            draw.ellipse((x-r, y-r, x+r, y+r), fill=node.get('stroke'))
        else:
            raise ValueError(f'Unsupported fallback element: {tag}')
    mask = Image.new('L', image.size)
    ImageDraw.Draw(mask).ellipse((0, 0, image.width, image.height), fill=255)
    image.putalpha(ImageChops.multiply(image.getchannel('A'), mask))
    return image.resize((size, size), Image.Resampling.LANCZOS)


def render(folder):
    try:
        import cairosvg
    except ImportError:
        cairosvg = None
    rsvg = shutil.which('rsvg-convert')
    method = 'CairoSVG' if cairosvg else ('rsvg-convert' if rsvg else 'Pillow fallback: sampled SVG curves, supersampled circle clipping')
    def avatar(path, size):
        if cairosvg:
            data = cairosvg.svg2png(url=str(path), output_width=size, output_height=size)
        elif rsvg:
            data = subprocess.check_output([rsvg, '-w', str(size), '-h', str(size), str(path)])
        else:
            return pillow_svg(path, size)
        return Image.open(io.BytesIO(data)).convert('RGBA')
    sheet = Image.new('RGB', (1260, 1260), '#E9E2DB')
    draw = ImageDraw.Draw(sheet)
    def font(size):
        try:
            return ImageFont.truetype('DejaVuSans.ttf', size)
        except OSError:
            return ImageFont.load_default(size=size)
    draw.text((30, 22), 'HEARTSIDE / HELP AVATAR OPTIONS', fill=INK, font=font(24))
    draw.text((30, 59), 'Actual pixel sizes on cream and the ink launcher pill', fill=INK, font=font(17))
    for col, letter in enumerate('abc'):
        x = col*410 + 30
        draw.text((x, 102), f'{letter.upper()}  /  ' + ['Swept hair', 'Curls + beard', 'Close crop'][col], fill=INK, font=font(22))
        y = 150
        for size in (44, 96, 256):
            draw.text((x, y), f'{size} px', fill=INK, font=font(17))
            portrait = avatar(folder / f'option-{letter}.svg', size)
            for bg in (CREAM, INK):
                top = y+30
                draw.rounded_rectangle((x, top, x+370, top+size+20), radius=(size+20)//2, fill=bg)
                sheet.paste(portrait, (x+(370-size)//2, top+10), portrait)
                y += size+30
            y += 26
    draw.text((30, 1220), f'Renderer: {method}', fill=INK, font=font(15))
    sheet.save(folder / 'sheet.png')
    print(f'Wrote {folder / "sheet.png"} ({method})')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Validate existing deliverables without regenerating them')
    parser.add_argument('directory', nargs='?', type=Path, default=DEFAULT)
    args = parser.parse_args()
    if not args.check:
        render(args.directory)
    sys.exit(check(args.directory))
