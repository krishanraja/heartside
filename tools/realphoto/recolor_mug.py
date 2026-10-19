"""Recolors the pink inside and handle of a plain mug base (no print on it) to another Printful color.

  python3 tools/realphoto/recolor_mug.py <pink_base> <out_dir> [Color ...]

Writes <out_dir>/<stem>-<slug>.<ext> per color (black, dark-blue, dark-green, red). The pink is
found by hue on the plain base, so the white band and anything drawn on it later stay as they are.
Shading is kept: each pixel's brightness against Printful's pink becomes the shade of the new color.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

PINK = (0xf6, 0xa1, 0xb1)
# Printful catalog, product 403 (read 19 Oct)
COLORS = {'Black': (0x05, 0x05, 0x05), 'Dark Blue': (0x1b, 0x1b, 0x51), 'Dark Green': (0x22, 0x66, 0x53), 'Red': (0xe3, 0x2a, 0x2d)}


def slug(name):
    return name.lower().replace(' ', '-')


def recolor(im, target):
    rgba = im.convert('RGBA')
    a = np.asarray(rgba).astype(float) / 255
    rgb = a[..., :3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    sat = rgb.max(-1) - rgb.min(-1)
    mask = ((r > g + 0.06) & (r >= b) & (sat > 0.12)).astype(np.uint8) * 255
    m = np.asarray(Image.fromarray(mask).filter(ImageFilter.GaussianBlur(1.0))).astype(float)[..., None] / 255
    ref = np.array(PINK) / 255
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    refl = ref @ np.array([0.299, 0.587, 0.114])
    shade = (lum / refl)[..., None]
    t = np.array(target) / 255
    # dark colors still need a highlight where the glaze catches the light
    new = t * np.minimum(shade, 1) + np.maximum(shade - 1, 0) * 0.55
    out = rgb * (1 - m) + np.clip(new, 0, 1) * m
    res = np.concatenate([out, a[..., 3:]], -1)
    img = Image.fromarray((res * 255).round().astype(np.uint8), 'RGBA')
    return img if im.mode == 'RGBA' else img.convert('RGB')


if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    names = sys.argv[3:] or list(COLORS)
    os.makedirs(out, exist_ok=True)
    im = Image.open(src)
    stem, ext = os.path.splitext(os.path.basename(src))
    for n in names:
        p = os.path.join(out, f'{stem}-{slug(n)}{ext}')
        kw = {'quality': 90, 'method': 6} if ext == '.webp' else {}
        recolor(im, COLORS[n]).save(p, **kw)
        print(p)
