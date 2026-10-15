"""Teeinblue mockup assets for The Morning Mug, built from Printful's real product photo.

Outputs (1200x1200, brand cream background):
  mk-outward-base.png   handle on the LEFT (outward face, u=585), band painted flat white
  mk-drinker-base.png   handle on the RIGHT (drinker's face, u=2115), band painted flat white
  mk-*-shade.png        RGBA overlay: the photo's own shading + glaze highlight, band only
  mk-*-mask.png         band mask (white = printable, black = hidden), canvas size
  mk-*-shaded.png       fallback base with the photo's shading kept (if no overlay is possible)
  mk-geometry.json      print-area quad per mockup, in 1200-canvas pixels
"""
import json, os
import numpy as np
from PIL import Image, ImageFilter

D = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(D, 'out', 'mockup'); os.makedirs(OUT, exist_ok=True)
CREAM = np.array([243, 238, 231], float)
SIZE = 1200
Y0 = 171                  # crop top in original photo px (square 700x700 window)
S = SIZE / 700.0          # canvas px per original photo px
CX0, R0, TOP0, BAND0, RIM0 = 275.5, 192.5, 323, 433, 18
K_PRINT = None            # set below

src = Image.open(os.path.join(D, 'src', 'pf-mug-pink.jpg')).convert('RGB')

# mug silhouette (body + handle + rim) from rembg, so the background can turn cream
from rembg import remove, new_session
sess = new_session('isnet-general-use')
cut = remove(src, session=sess)
mug_a = np.asarray(cut.split()[-1]).astype(float) / 255.0


def build(mirror):
    im = src.transpose(Image.FLIP_LEFT_RIGHT) if mirror else src
    a = Image.fromarray((mug_a[:, ::-1] if mirror else mug_a) * 255).convert('L')
    box = (0, Y0, 700, Y0 + 700)
    im = im.crop(box).resize((SIZE, SIZE), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 40, 2))
    a = a.crop(box).resize((SIZE, SIZE), Image.LANCZOS)
    P = np.asarray(im).astype(float)
    A = (np.asarray(a).astype(float) / 255.0)[..., None]
    lum = P.mean(axis=2, keepdims=True)
    bg = CREAM * np.clip(lum / 255.0, 0, 1)          # white -> cream, the floor shadow carries over
    shaded = P * A + bg * (1 - A)

    cx = ((699 - CX0) if mirror else CX0) * S
    R = R0 * S
    top_c = (TOP0 - Y0) * S
    band = BAND0 * S
    rim = RIM0 * S
    ys, xs = np.mgrid[0:SIZE, 0:SIZE].astype(float)
    t = (xs - cx) / R
    inside = np.abs(t) < 1
    curve = rim * (1 - np.sqrt(np.clip(1 - t * t, 0, 1)))
    top = top_c - curve
    bot = top + band
    # soft band mask: hard top/bottom (the print edge), foreshortening fade at the limbs
    limb = np.clip((0.995 - np.abs(t)) / 0.07, 0, 1)
    vert = np.clip(np.minimum(ys - top, bot - ys) + 0.5, 0, 1)
    m = (inside * limb * vert)

    # overlay = the photo's own shading (multiply) + glaze highlight, inside the band
    sh = np.clip(lum / 250.0, 0, 1.0) ** 1.15
    a1 = (1 - sh)[..., 0] * m
    spec = np.clip((lum[..., 0] - 246) / 9, 0, 1) * 0.35 * m
    Aov = 1 - (1 - a1) * (1 - spec)
    C = np.where(Aov > 1e-4, 255 * spec / np.maximum(Aov, 1e-4), 0)
    ov = np.dstack([C, C, C, Aov * 255]).clip(0, 255).astype(np.uint8)

    flat = shaded.copy()
    flat = flat * (1 - m[..., None]) + 255 * m[..., None]   # band painted white; overlay restores shading

    name = 'outward' if mirror else 'drinker'
    Image.fromarray(shaded.clip(0, 255).astype(np.uint8)).save(os.path.join(OUT, f'mk-{name}-shaded.png'))
    Image.fromarray(flat.clip(0, 255).astype(np.uint8)).save(os.path.join(OUT, f'mk-{name}-base.png'))
    Image.fromarray(ov, 'RGBA').save(os.path.join(OUT, f'mk-{name}-shade.png'))
    Image.fromarray((m * 255).astype(np.uint8)).save(os.path.join(OUT, f'mk-{name}-mask.png'))

    k = R / 520.0                       # canvas px per print px, horizontally (flat compromise)
    centre = 585 if mirror else 2115
    q = dict(left=cx - centre * k, top=top_c, width=2700 * k, height=band, k=k, cx=cx, R=R)
    return name, q


geo = dict(build(True) for _ in [0])
geo.update(dict([build(False)]))
json.dump(geo, open(os.path.join(OUT, 'mk-geometry.json'), 'w'), indent=1)
print(json.dumps(geo, indent=1))
