"""Wrap real Teeinblue print files (2700x1050) onto Printful's photo of the pink 11 oz mug.

Geometry (Printful guides): circumference 3063 print px (10.2 in at 300 dpi), print file 2700,
handle centre at u = -181.5 (gap -363..0). Faces 90 deg from the handle: u = 585 (seen with the
handle on the LEFT: the outward face for a right-handed drinker) and u = 2115 (handle on the
RIGHT: the drinker's own view).
usage: python3 render_v5.py out_dir name=print.png [name=print.png ...]
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
BASE = Image.open(os.path.join(D, 'src', 'pf-mug-pink.jpg')).convert('RGB')
B = np.asarray(BASE).astype(float)
W, H = 2700, 1050
CX, R = 275.5, 192.5
TOP_C, BAND, RIM_B = 323, 433, 18
RPX = 487.5
SS = 2  # supersample for smoother ink edges


def wrap(design, centre, mirror):
    base = B[:, ::-1] if mirror else B
    cx = (B.shape[1] - 1 - CX) if mirror else CX
    big = np.asarray(Image.fromarray(base.astype(np.uint8)).resize((base.shape[1] * SS, base.shape[0] * SS), Image.LANCZOS)).astype(float)
    Hh, Ww = big.shape[:2]
    dz = np.asarray(design.convert('RGBA')).astype(float)
    ys, xs = np.mgrid[0:Hh, 0:Ww] / SS
    t = (xs - cx) / R
    inside = np.abs(t) < 0.995
    th = np.arcsin(np.clip(t, -0.999, 0.999))
    u = centre + th * RPX
    top = TOP_C - RIM_B * (1 - np.sqrt(np.clip(1 - t * t, 0, 1)))
    v = (ys - top) / BAND * H
    ok = inside & (v >= 0) & (v < H - 1) & (u >= 0) & (u < W - 1)
    ui = np.clip(u, 0, W - 2); vi = np.clip(v, 0, H - 2)
    u0 = ui.astype(int); v0 = vi.astype(int)
    fu = (ui - u0)[..., None]; fv = (vi - v0)[..., None]
    s = (dz[v0, u0] * (1 - fu) * (1 - fv) + dz[v0, u0 + 1] * fu * (1 - fv)
         + dz[v0 + 1, u0] * (1 - fu) * fv + dz[v0 + 1, u0 + 1] * fu * fv)
    alpha = (s[..., 3:] / 255) * ok[..., None]
    lum = big.mean(axis=2, keepdims=True)
    shade = np.clip(lum / 250.0, 0, 1.05) ** 1.15
    ink = s[..., :3] * shade
    spec = np.clip((lum - 246) / 9, 0, 1) * 0.35
    comp = big * (1 - alpha) + ink * alpha
    comp = np.where(alpha > 0.01, comp * (1 - spec) + 255 * spec, comp)
    res = Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8)).resize((Ww // SS, Hh // SS), Image.LANCZOS)
    return res.crop((30, 215, 670, 830))


def board(rows, path, label_font):
    # rows: [(label, [img, img])]
    w = rows[0][1][0].width; h = rows[0][1][0].height
    pad, lab = 24, 60
    out = Image.new('RGB', (pad + 2 * (w + pad), pad + len(rows) * (h + lab + pad)), (246, 241, 235))
    d = ImageDraw.Draw(out)
    y = pad
    for label, ims in rows:
        d.text((pad, y + 14), label, font=label_font, fill=(40, 36, 32))
        for i, im in enumerate(ims):
            out.paste(im, (pad + i * (w + pad), y + lab))
        y += h + lab + pad
    out.save(path, quality=92)


if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    lf = ImageFont.truetype(os.path.join(D, 'src', 'Fraunces-Text-400.ttf'), 30)
    rows = []
    for arg in sys.argv[2:]:
        name, p = arg.split('=', 1)
        dsg = Image.open(p).convert('RGBA')
        a = wrap(dsg, 585, mirror=True)    # outward face, handle left
        b = wrap(dsg, 2115, mirror=False)  # drinker's face, handle right
        a.save(os.path.join(out, f'{name}-outward-face.png'))
        b.save(os.path.join(out, f'{name}-drinker-face.png'))
        # phone-size check: what a 390 px wide screen shows for each face
        for tag, im in (('outward', a), ('drinker', b)):
            ph = im.resize((390, int(im.height * 390 / im.width)), Image.LANCZOS)
            ph.save(os.path.join(out, f'{name}-{tag}-phone.png'))
        rows.append((name, [a, b]))
    board(rows, os.path.join(out, 'mug-v5-board.jpg'), lf)
    print('done', out)
