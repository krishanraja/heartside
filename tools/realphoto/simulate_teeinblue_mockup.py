"""Simulate Teeinblue's flat print-area compositing on the new mockups, for review before upload."""
import json, os, sys
import numpy as np
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); M = os.path.join(D, 'out', 'mockup')
geo = json.load(open(os.path.join(M, 'mk-geometry.json')))
def sim(design_path, name, overlay=True):
    g = geo[name]
    base = Image.open(os.path.join(M, f'mk-{name}-base.png' if overlay else f'mk-{name}-shaded.png')).convert('RGBA')
    mask = np.asarray(Image.open(os.path.join(M, f'mk-{name}-mask.png'))).astype(float) / 255
    d = Image.open(design_path).convert('RGBA').resize((round(g['width']), round(g['height'])), Image.LANCZOS)
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0)); layer.paste(d, (round(g['left']), round(g['top'])))
    la = np.asarray(layer).astype(float); la[..., 3] *= mask
    out = base.copy(); out.alpha_composite(Image.fromarray(la.astype(np.uint8)))
    if overlay: out.alpha_composite(Image.open(os.path.join(M, f'mk-{name}-shade.png')))
    return out.convert('RGB')
if __name__ == '__main__':
    o = sys.argv[1]; os.makedirs(o, exist_ok=True)
    tiles = []
    for p in sys.argv[2:]:
        for n in ('outward', 'drinker'):
            im = sim(p, n); im.save(os.path.join(o, os.path.basename(p)[:-4] + f'-{n}.jpg'), quality=90); tiles.append(im.resize((600, 600), Image.LANCZOS))
    W = 2 * 600 + 30; H = (len(tiles) // 2) * 630 + 10
    sheet = Image.new('RGB', (W, H), (255, 255, 255))
    for i, t in enumerate(tiles): sheet.paste(t, (10 + (i % 2) * 610, 10 + (i // 2) * 630))
    sheet.save(os.path.join(o, 'sim-sheet.jpg'), quality=90); print('ok')
