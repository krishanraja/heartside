"""One picture per portrait finish, from one approved painting (live audit, 30 Oct: the Red Oak, White and
Unframed variants showed the black frame). No generation: the painting goes onto Printful's own photos of
the 12x18 framed poster in black, red oak and white (tools/realphoto/README.md lists them; download them to
tools/realphoto/src/pf-frame-<finish>.jpg), only where the photo's paper shows, with the photo's own light.
Unframed is the flat print on a plain studio wall with a soft shadow.

  python3 tools/realphoto/variant_frames.py <painting.png> <out_dir>

Writes <out_dir>/portrait-<finish>.jpg (1400x2000) for black, red-oak, white, unframed.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
# the paper inside the frame on Printful's 700x1000 photos, measured on the black frame at row 650 and
# column 350 (30 Oct); the three photos share one layout
PAPER = (183, 377, 516, 890)  # left, top, right (exclusive), bottom (exclusive)
SCALE = 2


def cover(img, w, h):
    s = max(w / img.width, h / img.height)
    r = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    x, y = (r.width - w) // 2, (r.height - h) // 2
    return r.crop((x, y, x + w, y + h))


def framed(painting, finish):
    photo = Image.open(os.path.join(SRC, f'pf-frame-{finish}.jpg')).convert('RGB')
    photo = photo.resize((photo.width * SCALE, photo.height * SCALE), Image.LANCZOS)
    l, t, r, b = [v * SCALE for v in PAPER]
    base = np.asarray(photo).astype(float)
    art = np.asarray(cover(painting.convert('RGB'), r - l, b - t)).astype(float)
    region = base[t:b, l:r]
    lum = region.mean(axis=2, keepdims=True)
    sat = (region.max(axis=2) - region.min(axis=2))[..., None]
    # the paper is bright and grey; a finger over its edge is neither, so it stays in front
    paper = ((lum > 185) & (sat < 28)).astype(float)
    paper = np.asarray(Image.fromarray((paper[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(float)[..., None] / 255
    light = np.clip(lum / np.percentile(lum, 90), 0.6, 1.04)
    region[:] = region * (1 - paper) + art * light * paper
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))


def unframed(painting):
    W, H = 1400, 2000
    wall = Image.new('RGB', (W, H), (240, 234, 226))
    # a soft daylight falloff across the wall
    g = np.linspace(1.03, 0.94, W)[None, :, None] * np.linspace(1.02, 0.96, H)[:, None, None]
    wall = Image.fromarray(np.clip(np.asarray(wall).astype(float) * g, 0, 255).astype(np.uint8))
    pw, ph = 860, 1290
    x, y = (W - pw) // 2, (H - ph) // 2 - 40
    shadow = Image.new('L', (W, H), 0)
    shadow.paste(150, (x + 14, y + 26, x + pw + 14, y + ph + 26))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    wall = Image.composite(Image.new('RGB', (W, H), (150, 138, 126)), wall, shadow)
    wall.paste(cover(painting.convert('RGB'), pw, ph), (x, y))
    return wall


def main():
    painting, out = Image.open(sys.argv[1]), sys.argv[2]
    os.makedirs(out, exist_ok=True)
    for finish in ('black', 'red-oak', 'white'):
        framed(painting, finish).save(os.path.join(out, f'portrait-{finish}.jpg'), quality=90)
        print('wrote', f'portrait-{finish}.jpg')
    unframed(painting).save(os.path.join(out, 'portrait-unframed.jpg'), quality=90)
    print('wrote portrait-unframed.jpg')


if __name__ == '__main__':
    main()
