"""Rewords the Courier Prime lines on the blanket, framed print and ornament product images (Teeinblue's
mockups of its long-name sample), keeping everything else in the photo as it is (21 Oct 2026).

Krish (21 Oct): "re-render the product images in the dog's voice". For each image, the old lines are
found as rows of dark ink inside the paper area; Courier Prime is fitted to each old row's width (the
old words are known), so the new line gets the same size, centre and baseline. Each row is erased with
the paper colour sampled just above and below it, column by column, then the new line is drawn in the
old ink colour. Name, photo, signature and paw are untouched.

  python3 tools/realphoto/reword_gift_images.py <in_dir> <out_dir>

<in_dir> holds the current Shopify files, named by their Shopify file name.
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT = os.path.join(os.path.dirname(__file__), '..', 'fonts', 'CourierPrime-Regular.ttf')

OLD4 = ['Waits at the door for you, every single day.', 'Steals your side of the bed, then the duvet.',
        "Will ride anywhere, as long as it's with you.", 'Your best friend, no contest.']
NEW4 = ['I wait by the door. Weekends too. Obviously.', 'I took your side of the bed. Not sorry.',
        'Our walks are the best part of my day.', "I'm your shadow. Where else would I be?"]
OLD1 = ['Will ride anywhere, as', "long as it's with you."]
NEW1 = ["I'm your shadow.", 'Where else would I be?']

# file: (old rows, new rows, region of the paper as fractions x0, y0, x1, y1)
JOBS = {
    '6acf64c548c13.webp': (OLD4, NEW4, (0.18, 0.62, 0.82, 0.75)),   # blanket
    '6acf69942e805.webp': (OLD4, NEW4, (0.25, 0.58, 0.75, 0.68)),   # framed print, white frame
    '6acf6995181a1.webp': (OLD4, NEW4, (0.25, 0.58, 0.75, 0.68)),   # framed print, black frame
    '6acf6986270d5.webp': (OLD4, NEW4, (0.25, 0.58, 0.75, 0.68)),   # framed print, red oak frame
    '6acf69fb15466.webp': (OLD4, NEW4, (0.34, 0.545, 0.66, 0.616)),  # framed print, held
    '6acf6aa696d50.webp': (OLD1, NEW1, (0.30, 0.57, 0.70, 0.65)),   # ornament
    '6acf6aa660156.webp': (OLD1, NEW1, (0.34, 0.578, 0.66, 0.634)),  # ornament on the tree
}


def ink_rows(a, box):
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1].astype(int)
    lum = sub.mean(2)
    sat = sub.max(2) - sub.min(2)
    ink = (lum < 140) & (sat < 40)
    rows = np.where(ink.sum(1) > 2)[0]
    groups = []
    for r in rows:
        if groups and r - groups[-1][1] <= 4:
            groups[-1][1] = r
        else:
            groups.append([r, r])
    out = []
    for g0, g1 in groups:
        cols = np.where(ink[g0:g1 + 1].any(0))[0]
        out.append((x0 + cols[0], y0 + g0, x0 + cols[-1], y0 + g1, ink[g0:g1 + 1]))
    return out


def fit(text, width):
    lo, hi = 4.0, 200.0
    for _ in range(40):
        mid = (lo + hi) / 2
        f = ImageFont.truetype(FONT, mid)
        b = f.getbbox(text)
        if b[2] - b[0] > width:
            hi = mid
        else:
            lo = mid
    return ImageFont.truetype(FONT, lo)


def reword(path, old, new, frac, out):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im)
    H, W = a.shape[:2]
    box = (int(frac[0] * W), int(frac[1] * H), int(frac[2] * W), int(frac[3] * H))
    rows = ink_rows(a, box)
    if len(rows) != len(old):
        raise SystemExit(f'{os.path.basename(path)}: found {len(rows)} ink rows, expected {len(old)}')
    b = a.copy()
    plan = []
    # Teeinblue sets every line in one size: fit each old row, then use the median for all
    size = float(np.median([fit(o, r[2] - r[0] + 1).size for r, o in zip(rows, old)]))
    f = ImageFont.truetype(FONT, size)
    for (rx0, ry0, rx1, ry1, mask), o, n in zip(rows, old, new):
        ob = f.getbbox(o)
        # baseline: the old row's ink top sits where the fitted text's ink top would be
        base = ry0 - ob[1]
        cx = (rx0 + rx1) / 2
        dark = a[ry0:ry1 + 1, rx0:rx1 + 1][mask[:, rx0 - box[0]:rx1 - box[0] + 1]]
        ink = tuple(int(v) for v in np.median(dark, axis=0)) if len(dark) else (30, 30, 30)
        plan.append((n, f, cx, base, ink))
    # erase the whole block at once, so a row is never painted from its neighbour's ink
    pad = max(4, (rows[0][3] - rows[0][1]) // 2)
    top, bot = max(min(r[1] for r in rows) - pad, 0), min(max(r[3] for r in rows) + pad, H - 1)
    x0, x1 = max(box[0], min(r[0] for r in rows) - pad * 2), min(box[2], max(r[2] for r in rows) + pad * 2)
    above = np.median(a[max(top - 6, 0):top].astype(float), axis=0)
    below = np.median(a[bot + 1:min(bot + 7, H)].astype(float), axis=0)
    for y in range(top, bot + 1):
        t = (y - top) / max(bot - top, 1)
        b[y, x0:x1] = (above[x0:x1] * (1 - t) + below[x0:x1] * t).astype(np.uint8)
    out_im = Image.fromarray(b)
    d = ImageDraw.Draw(out_im)
    for n, f, cx, base, ink in plan:
        nb = f.getbbox(n)
        d.text((cx - (nb[0] + nb[2]) / 2, base), n, font=f, fill=ink)
    out_im.save(out, quality=94)
    return [(p[0], round(p[1].size, 1)) for p in plan]


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    for name, (old, new, frac) in JOBS.items():
        out = os.path.join(dst, os.path.splitext(name)[0] + '.jpg')
        print(name, reword(os.path.join(src, name), old, new, frac, out))
