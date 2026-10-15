"""Static product images: real cylindrical wrap of a Teeinblue print file onto the 1200px cream mockup bases."""
import os, sys
import numpy as np
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); M = os.path.join(D, 'out', 'mockup')
OUT = 2048; S = OUT / 700.0; Y0 = 171
# each row rises at the edge by RIM_TOP (top of the print) growing to RIM_BOT (bottom), as the
# rim (18 px) and the base (59 px) of Printful's 700 px photo do (measured 15 Oct). Until then
# one constant (18 px) curved every row alike, which Krish found unrealistic.
R = 192.5 * S; TOP_C = (323 - Y0) * S; BAND = 433 * S; RIM_TOP = 19.84 * S; RIM_BOT = 57.15 * S; RPX = 487.5
W, H = 2700, 1050; SS = 2
def wrap(design, name):
    mirror = name == 'outward'
    centre = 585 if mirror else 2115
    cx = ((699 - 275.5) if mirror else 275.5) * S
    base = Image.open(os.path.join(M, f'mk-{name}-shaded.png')).convert('RGB')
    big = np.asarray(base.resize((OUT * SS, OUT * SS), Image.LANCZOS)).astype(float)
    dz = np.asarray(design.convert('RGBA')).astype(float)
    ys, xs = np.mgrid[0:OUT * SS, 0:OUT * SS] / SS
    t = (xs - cx) / R
    inside = np.abs(t) < 0.995
    u = centre + np.arcsin(np.clip(t, -0.999, 0.999)) * RPX
    cv = 1 - np.sqrt(np.clip(1 - t * t, 0, 1))
    v = (ys - TOP_C + RIM_TOP * cv) / (BAND - (RIM_BOT - RIM_TOP) * cv) * H
    ok = inside & (v >= 0) & (v < H - 1) & (u >= 0) & (u < W - 1)
    ui = np.clip(u, 0, W - 2); vi = np.clip(v, 0, H - 2); u0 = ui.astype(int); v0 = vi.astype(int)
    fu = (ui - u0)[..., None]; fv = (vi - v0)[..., None]
    s = (dz[v0, u0] * (1 - fu) * (1 - fv) + dz[v0, u0 + 1] * fu * (1 - fv) + dz[v0 + 1, u0] * (1 - fu) * fv + dz[v0 + 1, u0 + 1] * fu * fv)
    alpha = (s[..., 3:] / 255) * ok[..., None] * np.clip((0.995 - np.abs(t)) / 0.07, 0, 1)[..., None]
    lum = big.mean(axis=2, keepdims=True)
    shade = np.clip(lum / 250.0, 0, 1.05) ** 1.15
    spec = np.clip((lum - 246) / 9, 0, 1) * 0.35
    comp = big * (1 - alpha) + s[..., :3] * shade * alpha
    comp = np.where(alpha > 0.01, comp * (1 - spec) + 255 * spec, comp)
    return Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8)).resize((OUT, OUT), Image.LANCZOS)
if __name__ == '__main__':
    d = Image.open(sys.argv[1]); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    for n in ('outward', 'drinker'):
        wrap(d, n).save(os.path.join(out, f'the-morning-mug-{n}.jpg'), quality=92)
    print('ok')
