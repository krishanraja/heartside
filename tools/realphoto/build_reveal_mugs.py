"""The chat's mug reveal tab (hs3), on the same real mug photo as the live Teeinblue preview.

Reads the Teeinblue mockup files in design/teeinblue/mug-v3/ (built from Printful's own photo
by build_mug_mockups.py) and writes four phone-sized layers to shopify/assets/:

  hs-mug-dog-base.webp    the dog face (handle on the left), band white, page cream around it
  hs-mug-dog-shade.webp   the photo's own shading, laid over the dog
  hs-mug-note-base.webp   the note face (handle on the right)
  hs-mug-note-shade.webp  its shading

It also prints where the photo, lines, signature and paw sit, as percentages of the crop, for
shopify/assets/hs3.css. They follow the print file (docs/evidence/cowork-2026-10-15/
mug-v3-handoff-for-claude-code.md) mapped the way Teeinblue maps it (mk-geometry.json).

  python3 tools/realphoto/build_reveal_mugs.py
"""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'design', 'teeinblue', 'mug-v3')
OUT = os.path.join(ROOT, 'shopify', 'assets')
MOCK_CREAM = np.array([243, 238, 231], float)   # the mockups' background
PAGE_CREAM = np.array([251, 246, 241], float)   # hs3.css --cream, so the photo has no edge
W, H = 1060, 910                                 # crop of the 1200 canvas: mug, handle, shadow
CROP = {'outward': (80, 150), 'drinker': (60, 150)}
OUT_W = 640                                      # about 300 css px at 2x
geo = json.load(open(os.path.join(SRC, 'mk-geometry.json')))


def layer(name, kind, out_name):
    x0, y0 = CROP[name]
    im = Image.open(os.path.join(SRC, f'mk-{name}-{kind}.png')).crop((x0, y0, x0 + W, y0 + H))
    if kind == 'base':
        a = np.asarray(im.convert('RGB')).astype(float) * (PAGE_CREAM / MOCK_CREAM)
        im = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    im = im.resize((OUT_W, round(OUT_W * H / W)), Image.LANCZOS)
    path = os.path.join(OUT, out_name)
    im.save(path, 'WEBP', quality=82, alpha_quality=70, method=6)
    print(f'{out_name}: {im.size[0]}x{im.size[1]}, {os.path.getsize(path) // 1024} KB')


def pct(v, d):
    return round(100 * v / d, 2)


def place(name, left, top, width, height):
    """print-file px to % of the crop, as Teeinblue maps the print area onto the photo"""
    g = geo[name]
    kx, ky = g['width'] / 2700, g['height'] / 1050
    x0, y0 = CROP[name]
    return dict(left=pct(g['left'] + left * kx - x0, W), top=pct(g['top'] + top * ky - y0, H),
                width=pct(width * kx, W), height=pct(height * ky, H))


layer('outward', 'base', 'hs-mug-dog-base.webp')
layer('outward', 'shade', 'hs-mug-dog-shade.webp')
layer('drinker', 'base', 'hs-mug-note-base.webp')
layer('drinker', 'shade', 'hs-mug-note-shade.webp')

g = geo['drinker']
kx, ky = g['width'] / 2700, g['height'] / 1050
print('dog photo layer (900x1000 at 135,50):', place('outward', 135, 50, 900, 1000))
for i, top in enumerate((130, 345, 560), 1):
    print(f'line {i} (860x190 at 1685,{top}):', place('drinker', 1685, top, 860, 190))
print('signed (775x130 at 1770,790):', place('drinker', 1770, 790, 775, 130))
print('paw (72x69 at 1685,833):', place('drinker', 1685, 833, 72, 69))
print('font: lines 70 px =', round(100 * 70 * kx / W, 3), 'cqw; signed 96 px =', round(100 * 96 * kx / W, 3),
      'cqw; row pitch 84 px over 70 px type =', round(84 * ky / (70 * kx), 3), 'line-height')
