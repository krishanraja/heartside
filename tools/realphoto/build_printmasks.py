"""Band masks in PRINT-AREA space (2700x1050), black + alpha, for Teeinblue's print-area mask.
Inverse-maps the canvas band mask through the flat quad actually set in Teeinblue (960 canvas)."""
import json, sys, os
import numpy as np
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); M = os.path.join(D, 'out', 'mockup')
def make(name, left, top, width, height):
    m = np.asarray(Image.open(os.path.join(M, f'mk-{name}-mask.png'))).astype(float) / 255  # 1200 canvas
    W, H = 2700, 1050
    u, v = np.meshgrid(np.arange(W) + 0.5, np.arange(H) + 0.5)
    x = (left + u * width / W) * 1.25   # 960 -> 1200 canvas
    y = (top + v * height / H) * 1.25
    xi = np.clip(x.astype(int), 0, 1199); yi = np.clip(y.astype(int), 0, 1199)
    inside = (x >= 0) & (x < 1200) & (y >= 0) & (y < 1200)
    a = m[yi, xi] * inside
    out = np.zeros((H, W, 4), np.uint8); out[..., 3] = (a * 255).astype(np.uint8)
    p = os.path.join(M, f'mk-{name}-printmask.png'); Image.fromarray(out, 'RGBA').save(p); print(p, a.mean().round(3))
if __name__ == '__main__':
    make(sys.argv[1], *map(float, sys.argv[2:6]))
