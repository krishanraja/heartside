"""The reference render the chat's mug must match (tools/preview/mockup-gate.mjs).

Wraps a real Teeinblue print file (2700x1050) onto the same phone-size photo layers the chat
uses (shopify/assets/hs-mug-*-base.webp and -shade.webp): arcsin mapping, each row's curve
growing from the rim to the base as measured on Printful's photo (RIM_TOP, RIM_BOT; 15 Oct), edge
fade, the photo's own shading through the ink, and the glaze. 2 x 2 supersampled. The approved
Shopify images used one curve for every row, which Krish found unrealistic on 15 Oct.

  python3 tools/realphoto/golden_reveal_mug.py print.png out_dir
  writes out_dir/golden-note.png and out_dir/golden-dog.png (640 x 549)
"""
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
A = os.path.join(ROOT, 'shopify', 'assets')
W, H, RPX = 2700, 1050, 487.5
R, TOP, BAND, Y0 = 330.0, 260.5714, 742.2857, 150
RIM_TOP, RIM_BOT = 34.0171, 97.9695   # rise at the edge for the print's top and bottom rows
CROP, OUT, OUTH = 1060, 640, 549
FACES = {'note': dict(cx=472.2857, x0=60, centre=2115), 'dog': dict(cx=726.0, x0=80, centre=585)}


def golden(design, face):
    g = FACES[face]
    base = Image.open(os.path.join(A, f'hs-mug-{face}-base.webp')).convert('RGBA')
    shade = Image.open(os.path.join(A, f'hs-mug-{face}-shade.webp')).convert('RGBA')
    big = np.asarray(Image.alpha_composite(base, shade).convert('RGB')).astype(float)
    dz = np.asarray(design.convert('RGBA')).astype(float)
    k = OUT / CROP
    acc = np.zeros((OUTH, OUT, 3)); acca = np.zeros((OUTH, OUT, 1))
    for sx in (0.25, 0.75):
        for sy in (0.25, 0.75):
            ys, xs = np.mgrid[0:OUTH, 0:OUT].astype(float)
            X = (xs + sx) / k + g['x0']; Y = (ys + sy) / k + Y0
            t = (X - g['cx']) / R
            inside = np.abs(t) < 0.995
            u = g['centre'] + np.arcsin(np.clip(t, -0.999, 0.999)) * RPX
            cv = 1 - np.sqrt(np.clip(1 - t * t, 0, 1))
            v = (Y - TOP + RIM_TOP * cv) / (BAND - (RIM_BOT - RIM_TOP) * cv) * H
            ok = inside & (v >= 0) & (v < H - 1) & (u >= 0) & (u < W - 1)
            ui = np.clip(u, 0, W - 2); vi = np.clip(v, 0, H - 2); u0 = ui.astype(int); v0 = vi.astype(int)
            fu = (ui - u0)[..., None]; fv = (vi - v0)[..., None]
            q = [dz[v0, u0], dz[v0, u0 + 1], dz[v0 + 1, u0], dz[v0 + 1, u0 + 1]]
            w = [(1 - fu) * (1 - fv), fu * (1 - fv), (1 - fu) * fv, fu * fv]
            a = sum(qi[..., 3:] * wi for qi, wi in zip(q, w)) / 255
            c = sum(qi[..., :3] * qi[..., 3:] * wi for qi, wi in zip(q, w)) / 255
            lim = (ok * np.clip((0.995 - np.abs(t)) / 0.07, 0, 1))[..., None]
            acc += c * lim; acca += a * lim
    A_ = acca / 4
    col = np.where(acca > 0, acc / np.maximum(acca, 1e-6), 0)
    lum = big.mean(axis=2, keepdims=True)
    shade_ = np.clip(lum / 250.0, 0, 1.05) ** 1.15
    spec = np.clip((lum - 246) / 9, 0, 1) * 0.35
    comp = big * (1 - A_) + col * shade_ * A_
    comp = np.where(A_ > 0.01, comp * (1 - spec) + 255 * spec, comp)
    return Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    design = Image.open(sys.argv[1]); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    for face in FACES:
        golden(design, face).save(os.path.join(out, f'golden-{face}.png'))
    print('ok', out)
