"""Product photos: the real print, composited into staged scenes.

The scenes in assets/v2/scenes/ were generated for Heartside (ChatGPT, 5 October 2026)
with every product surface left blank: an empty frame, a blank sheet, a blank ornament.
The product itself is never AI-drawn, because image models redraw text and the poster is
text. This script places the real file on each blank surface, so what is pictured is
exactly what prints (docs/V2-FROM-THE-DOG.md: no mockups that look better than the real
thing).

    python3 tools/preview/mockups.py          (needs Pillow and NumPy)

Reads  design/mockups/poster-biscuit.png   (from tools/preview/print.mjs)
Writes design/mockups/<scene>.jpg, full size, plus <scene>-4x5.jpg and <scene>-1x1.jpg crops.

How a placement works:
- quad: the blank surface's four corners (top-left, top-right, bottom-right, bottom-left),
  measured on the scene once. The print is fitted to cover it and warped onto it,
  reaching a few pixels past the measured edge into the frame's shadow.
- paper: only paper-coloured pixels take the print (bright or shadowed, but nearly
  colourless). Frame wood, a black frame lip and fingers are not paper, so they stay in
  front, and the print runs right up to them.
- light: the paper's own shading and colour cast, taken from paper pixels only (so a
  finger's colour never bleeds in), multiply the print, so it sits in the room's light.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

REPO = Path(__file__).resolve().parents[2]
SCENES = REPO / 'assets' / 'v2' / 'scenes'
OUT = REPO / 'design' / 'mockups'

PLACEMENTS = [
    # scene, artwork, quad (TL, TR, BR, BL), held (a hand holds it: fingers overlap the edge),
    # and optionally 'disc' for a round surface inside the quad, or 'fabric' for a soft
    # surface whose outline is stored beside the scene as <scene>.mask.png
    ('office-black-a', 'poster-biscuit.png', [(370, 261), (661, 263), (659, 693), (369, 691)], False),
    ('office-black-b', 'poster-biscuit.png', [(355, 69), (676, 71), (674, 544), (353, 542)], False),
    ('entry-oak-a', 'poster-biscuit.png', [(362, 226), (670, 227), (669, 680), (358, 678)], False),
    ('entry-oak-b', 'poster-biscuit.png', [(347, 62), (686, 65), (684, 554), (342, 552)], False),
    ('christmas-sheet-a', 'poster-biscuit.png', [(252, 69), (770, 71), (768, 844), (251, 843)], True),
    ('christmas-sheet-b', 'poster-biscuit.png', [(215, 70), (794, 72), (790, 850), (215, 856)], True),
    # Tiny Me: provisional face (print.mjs step 6) until checked against Teeinblue's artwork
    ('ornament-tree', 'ornament-biscuit.png', [(371, 335), (907, 335), (907, 872), (371, 872)], False, 'disc'),
    # The Body Double prints the customer's photo edge to edge, so the art is the headshot itself.
    # Its mask was traced once from the scene (the pillow is near-neutral white, the sofa warm
    # beige, the dog saturated), smoothed, and saved beside it.
    ('pillow-sofa-a', 'assets/v2/biscuit-headshot.jpg', [(629, 318), (1212, 301), (1250, 838), (690, 846)], False, 'fabric'),
]


def homography(src, dst):
    """Coefficients PIL's PERSPECTIVE transform wants: output (dst) -> input (src)."""
    rows, rhs = [], []
    for (x, y), (u, v) in zip(dst, src):
        rows.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); rhs.append(u)
        rows.append([0, 0, 0, x, y, 1, -v * x, -v * y]); rhs.append(v)
    return np.linalg.solve(np.array(rows, float), np.array(rhs, float))


def shrink(quad, px):
    cx = sum(p[0] for p in quad) / 4
    cy = sum(p[1] for p in quad) / 4
    out = []
    for x, y in quad:
        dx, dy = cx - x, cy - y
        d = (dx * dx + dy * dy) ** 0.5
        out.append((x + dx / d * px, y + dy / d * px))
    return out


def place(scene, art, quad, held, shape='quad', fabric_mask=None):
    W, H = scene.size
    q = shrink(quad, -4 if shape == 'quad' else 0)  # reach into a frame's shadow; the paper test stops it at the lip
    qw = (np.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) + np.hypot(q[2][0] - q[3][0], q[2][1] - q[3][1])) / 2
    qh = (np.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]) + np.hypot(q[2][0] - q[1][0], q[2][1] - q[1][1])) / 2

    # cover-fit: trim the print's own white margin, never squash it
    aw, ah = art.size
    if aw / ah > qw / qh:
        cw = ah * qw / qh; box = ((aw - cw) / 2, 0, (aw + cw) / 2, ah)
    else:
        ch = aw * qh / qw; box = (0, (ah - ch) / 2, aw, (ah + ch) / 2)
    crop = art.crop(tuple(round(b) for b in box))
    src = [(0, 0), (crop.width, 0), (crop.width, crop.height), (0, crop.height)]
    # past the print's edge, continue its own border colour (a traced fabric outline can reach
    # a little beyond the four corners)
    edge = np.concatenate([np.asarray(crop)[[0, -1], :, :].reshape(-1, 3), np.asarray(crop)[:, [0, -1], :].reshape(-1, 3)])
    fill = tuple(int(v) for v in np.median(edge, axis=0))
    warped = crop.transform((W, H), Image.PERSPECTIVE, tuple(homography(src, q)), Image.BICUBIC, fillcolor=fill)

    s = np.asarray(scene, float)
    if shape == 'fabric':
        mask = np.asarray(fabric_mask.convert('L'), float) / 255
    else:
        # where the print goes: the quad (or the disc inside it), antialiased at 4x
        big = Image.new('L', (W * 4, H * 4), 0)
        if shape == 'disc':
            ImageDraw.Draw(big).ellipse([q[0][0] * 4, q[0][1] * 4, q[2][0] * 4, q[2][1] * 4], fill=255)
        else:
            ImageDraw.Draw(big).polygon([(x * 4, y * 4) for x, y in q], fill=255)
        mask = np.asarray(big.resize((W, H), Image.LANCZOS), float) / 255
        # paper: bright or shadowed, but nearly colourless. Wood, a black lip and skin are not.
        lum = s.mean(axis=2); sat = s.max(axis=2) - s.min(axis=2)
        paper = ((lum > 110) & (sat < (40 if held else 46))).astype(np.uint8) * 255
        paper = Image.fromarray(paper).filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
        mask = mask * (np.asarray(paper, float) / 255)

    # the surface's light and colour, from its own pixels only (normalised blur). Paper loses
    # its texture; fabric keeps its weave, as a print on linen does.
    inside = mask > 0.98
    white = np.percentile(s[inside], 98, axis=0)
    r = 2 if shape == 'fabric' else 6
    def blur(a, r=r):
        return np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), float)
    num = np.stack([blur(s[..., c] * mask) for c in range(3)], axis=2)
    den = blur(mask * 255)[..., None] / 255
    tint = np.clip(num / np.maximum(den, 1e-3) / white, 0, 1.04)

    p = np.asarray(warped.convert('RGB'), float) * tint
    m = mask[..., None]
    return Image.fromarray(np.clip(s * (1 - m) + p * m, 0, 255).astype(np.uint8))


def crops(img, name, quad, held):
    """4:5 for product pages and feed ads, 1:1 for cards. The product is never cut: each
    crop starts a little above it and keeps as much of the scene below (the dog) as fits.
    A held sheet is too tall for a square without cutting the dog's face, so it gets none."""
    W, H = img.size
    top_of_product = min(y for _, y in quad)
    # a square scene is already the square crop, and a 4:5 cut of it loses the dog
    sizes = [] if W == H else [('4x5', min(W, round(H * 4 / 5)), min(H, round(W * 5 / 4)))]
    if not held:
        sizes.append(('1x1', min(W, H), min(W, H)))
    for label, cw, ch in sizes:
        top = int(max(0, min(top_of_product - 48, H - ch)))
        left = (W - cw) // 2
        img.crop((left, top, left + cw, top + ch)).save(OUT / f'{name}-{label}.jpg', quality=92, optimize=True)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, art_file, quad, held, *shape in PLACEMENTS:
        scene = Image.open(SCENES / f'{name}.jpg').convert('RGB')
        art = Image.open((REPO / art_file) if '/' in art_file else (OUT / art_file)).convert('RGBA')
        flat = Image.new('RGB', art.size, (255, 253, 249))  # the print's paper colour behind any transparency
        flat.paste(art, mask=art.split()[3])
        fabric = Image.open(SCENES / f'{name}.mask.png') if shape and shape[0] == 'fabric' else None
        out = place(scene, flat, quad, held, *shape, fabric_mask=fabric)
        out.save(OUT / f'{name}.jpg', quality=93, optimize=True)
        crops(out, name, quad, held)
        print('wrote', name)


if __name__ == '__main__':
    main()
