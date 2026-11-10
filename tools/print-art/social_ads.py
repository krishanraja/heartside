#!/usr/bin/env python3
"""Heartside social ad and share cards, built in code from approved example scenes (Krish, 10 Nov 2026:
"We need to improve this social card drastically ASAP").

Two concepts, every size a placement needs:
  A  "A note from Maple": the golden's room set (mug, blanket, portrait) full bleed, the headline, and the
     note in the dog's voice on a slip of paper: the one thing the ad text promises and no rival shows.
  B  "Any dog": six dogs, each painted on its own gifts, under the same headline.
Sizes: 4:5 1080x1350 (Facebook and Instagram feed), 1:1 1080x1080, 9:16 1080x1920 (Stories, Reels) and
1.91:1 1200x630 (the link preview heartside.io gives, Shopify's social sharing image).

Pictures are the approved 1080 room sets in shopify/assets/hs-hero-*-1080.webp; they are only scaled and
cropped, never redrawn. No Example badge: in a post the examples carry none (Krish, 2 Nov, docs/SYNC.md).
Copy follows the house rules: no exclamation marks, no em dashes, words on the gifts never shown.

  python3 tools/print-art/social_ads.py --out design/social-ads-2026-11-10
  python3 tools/print-art/social_ads.py --check design/social-ads-2026-11-10
Needs Pillow and fontTools with brotli (the woff2 brand fonts are converted to a temporary folder).
"""
import argparse, os, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
A = lambda p: os.path.join(REPO, 'shopify', 'assets', p)

CREAM, PAPER, INK, BODY, STAMP, CHESTNUT, BLUSH, HEART = '#FBF6F1', '#FFFDF9', '#121010', '#3E322D', '#A8284E', '#8A4A2B', '#F0C0C0', '#E7A1BF'
DEADLINE = 'Order by Dec 4 for Christmas'
NOTE = ('Sam,', 'I saved your spot.', 'It is also my spot.', 'Love, Maple')
DOGS = ['golden', 'frenchie', 'dachshund', 'lab', 'doodle', 'shepherd']

SIZES = {
    'a-feed-4x5': (1080, 1350), 'a-square-1x1': (1080, 1080), 'a-story-9x16': (1080, 1920), 'a-link-1200x630': (1200, 630),
    'b-feed-4x5': (1080, 1350), 'b-square-1x1': (1080, 1080),
}


# ------------------------------------------------------------------ fonts
_FONTS = {}
def fonts_dir():
    d = os.path.join(tempfile.gettempdir(), 'hs-social-fonts')
    os.makedirs(d, exist_ok=True)
    from fontTools.ttLib import TTFont
    for name in ['hs-fraunces', 'hs-fraunces-italic', 'hs-dmsans', 'hs-courierprime-400', 'hs-courierprime-700']:
        out = os.path.join(d, name + '.ttf')
        if not os.path.exists(out):
            t = TTFont(A(name + '.woff2')); t.flavor = None; t.save(out)
    return d

def font(name, size, weight=None):
    key = (name, size, weight)
    if key in _FONTS: return _FONTS[key]
    f = ImageFont.truetype(os.path.join(fonts_dir(), name + '.ttf'), size)
    if weight is not None:
        # both variable families carry [optical size, weight]
        opsz = min(144, max(9, size)) if 'fraunces' in name else min(40, max(9, size))
        f.set_variation_by_axes([opsz, weight])
    _FONTS[key] = f
    return f

SERIF = lambda s, w=600: font('hs-fraunces', s, w)
SERIF_I = lambda s, w=600: font('hs-fraunces-italic', s, w)
SANS = lambda s, w=500: font('hs-dmsans', s, w)
TYPE = lambda s: font('hs-courierprime-400', s)


# ------------------------------------------------------------------ helpers
def cover(im, w, h, fx=0.5, fy=0.5):
    """Scale to cover w x h and crop around the focus (fx, fy), never stretched."""
    s = max(w / im.width, h / im.height)
    r = im.resize((max(w, round(im.width * s)), max(h, round(im.height * s))), Image.LANCZOS)
    x = round((r.width - w) * fx); y = round((r.height - h) * fy)
    return r.crop((x, y, x + w, y + h))

def scene(dog):
    return Image.open(A(f'hs-hero-{dog}-1080.webp')).convert('RGB')

def fit(draw, text, fnt_fn, size, max_w, min_size=10):
    while size > min_size and draw.textlength(text, font=fnt_fn(size)) > max_w: size -= 2
    return fnt_fn(size), size

def spaced(draw, xy, text, fnt, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill); x += draw.textlength(ch, font=fnt) + tracking
    return x

def spaced_w(draw, text, fnt, tracking):
    return sum(draw.textlength(c, font=fnt) + tracking for c in text) - tracking

def fade(w, h, color, top_alpha, stop, bottom=False):
    """A vertical wash of `color`, top_alpha at the edge falling to 0 at `stop` (0..1 of h)."""
    g = Image.new('L', (1, h))
    for y in range(h):
        t = (h - 1 - y) / h if bottom else y / h
        a = 0 if t >= stop else top_alpha * (1 - (t / stop)) ** 1.6
        g.putpixel((0, y), int(255 * a))
    layer = Image.new('RGBA', (w, h), color); layer.putalpha(g.resize((w, h)))
    return layer

def shadow(base, box, radius, blur, offset, opacity):
    x0, y0, x1, y1 = box
    sh = Image.new('RGBA', base.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((x0 + offset[0], y0 + offset[1], x1 + offset[0], y1 + offset[1]), radius, fill=(30, 23, 20, int(255 * opacity)))
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))


# ------------------------------------------------------------------ pieces
def headline(img, x, y, size, max_w, eyebrow=True, color_line=INK):
    d = ImageDraw.Draw(img)
    if eyebrow:
        ef = SANS(max(18, size // 4), 700)
        spaced(d, (x, y), 'GIFTS FROM YOUR DOG', ef, STAMP, max(2, size // 40)); y += round(size * 0.42)
    f1, s1 = fit(d, 'Your dog', lambda s: SERIF(s, 600), size, max_w)
    f2, s2 = fit(d, 'loves you too.', lambda s: SERIF_I(s, 600), size, max_w)
    s = min(s1, s2); f1, f2 = SERIF(s, 600), SERIF_I(s, 600)
    d.text((x, y), 'Your dog', font=f1, fill=color_line); y += round(s * 1.0)
    d.text((x, y), 'loves you too.', font=f2, fill=STAMP); y += round(s * 1.12)
    return y

def note_card(img, cx, cy, w, angle=-4, label=True):
    """The dog's note on a slip of paper, tilted, with a soft shadow: what the ad text promises."""
    pad = round(w * 0.085)
    h = round(w * 0.62)
    card = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(card)
    d.rounded_rectangle((0, 0, w - 1, h - 1), round(w * 0.02), fill=PAPER)
    # a fold line and the paw signature, like the printed slip
    ty = pad
    lf = SANS(round(w * 0.043), 700)
    spaced(d, (pad, ty), 'A NOTE FROM MAPLE', lf, CHESTNUT, round(w * 0.006)); ty += round(w * 0.1)
    d.line((pad, ty - round(w * 0.03), w - pad, ty - round(w * 0.03)), fill='#EFE6DD', width=max(1, w // 300))
    tf = TYPE(round(w * 0.066))
    for i, line in enumerate(NOTE):
        f = TYPE(round(w * 0.066)) if i < 3 else font('hs-courierprime-700', round(w * 0.066))
        d.text((pad, ty), line, font=f, fill=INK if i < 3 else STAMP); ty += round(w * 0.092)
    rot = card.rotate(angle, resample=Image.BICUBIC, expand=True)
    x0 = cx - rot.width // 2; y0 = cy - rot.height // 2
    shadow(img, (x0 + 12, y0 + 18, x0 + rot.width - 12, y0 + rot.height - 6), 16, 18, (0, 14), 0.38)
    img.alpha_composite(rot, (x0, y0))
    if label:
        d2 = ImageDraw.Draw(img); f = SANS(round(w * 0.05), 600)
        text = 'Their note, in every box'
        tw = d2.textlength(text, font=f)
        px, py = cx - tw / 2, y0 + rot.height + round(w * 0.02)
        d2.rounded_rectangle((px - 18, py - 8, px + tw + 18, py + f.size + 12), 999, fill=CREAM)
        d2.text((px, py), text, font=f, fill=INK)

def ribbon(img, y, h, pad):
    """The Christmas date and free shipping on ink, heartside.io in the logo heart's pink."""
    W = img.width; d = ImageDraw.Draw(img)
    d.rectangle((0, y, W, y + h), fill=INK)
    f = SANS(round(h * 0.27), 700); f2 = SANS(round(h * 0.2), 500)
    pill = 'heartside.io'
    pw = d.textlength(pill, font=f) + h * 0.5
    px1 = W - pad; px0 = px1 - pw
    d.rounded_rectangle((px0, y + h * 0.22, px1, y + h * 0.78), 999, fill=HEART)
    d.text((px0 + h * 0.25, y + (h - f.size) / 2 - 3), pill, font=f, fill=INK)
    room = px0 - pad - 24
    if h >= 100:
        top = y + (h - f.size - f2.size - 8) / 2 - 2
        d.text((pad, top), DEADLINE, font=fit(d, DEADLINE, lambda s: SANS(s, 700), f.size, room)[0], fill=CREAM)
        d.text((pad, top + f.size + 8), 'Free US shipping on every gift', font=fit(d, 'Free US shipping on every gift', lambda s: SANS(s, 500), f2.size, room)[0], fill=BLUSH)
    else:
        line = DEADLINE + '  ·  Free US shipping'
        ff, _ = fit(d, line, lambda s: SANS(s, 700), f.size, room)
        d.text((pad, y + (h - ff.size) / 2 - 2), line, font=ff, fill=CREAM)

def subline(img, x, y, size, max_w, text='Painted from your photo onto a mug, blanket or portrait.'):
    d = ImageDraw.Draw(img); f, s = fit(d, text, lambda s: SANS(s, 500), size, max_w)
    d.text((x, y), text, font=f, fill=BODY); return y + round(s * 1.45)


# ------------------------------------------------------------------ concept A
def concept_a(W, H):
    img = Image.new('RGBA', (W, H), CREAM)
    if W / H < 0.6:  # 9:16: cream headline area on top, the room below, note over the sofa side
        top = round(H * 0.25)
        img.alpha_composite(cover(scene('golden'), W, H - top, 0.5, 0.6).convert('RGBA'), (0, top))
        img.alpha_composite(fade(W, round(H * 0.12), CREAM, 1.0, 1.0), (0, top))
        y = headline(img, 72, 120, 132, W - 144)
        subline(img, 72, y, 38, W - 144)
        note_card(img, round(W * 0.34), round(H * 0.73), 520)
        ribbon(img, H - 150, 150, 64)
    elif W / H > 1.5:  # 1.91:1 link card: words left, the room right, the note bridging them
        split = 540
        img.alpha_composite(cover(scene('golden'), W - split, H, 0.5, 0.55).convert('RGBA'), (split, 0))
        y = headline(img, 56, 70, 84, split - 90)
        subline(img, 56, y + 4, 24, split - 90)
        note_card(img, split - 10, 452, 300, angle=-5, label=False)
        ribbon(img, H - 74, 74, 56)
    else:  # 4:5 and 1:1: words on a clean cream band, the room below, the note over the photo's lower edge
        tall = H > W
        rib = 140 if tall else 120
        band = 400 if tall else 360
        img.alpha_composite(cover(scene('golden'), W, H - rib - band, 0.5, 0.35 if tall else 0.45).convert('RGBA'), (0, band))
        y = headline(img, 64, 58 if tall else 44, 112 if tall else 92, W - 128)
        subline(img, 64, y + 10, 34 if tall else 30, W - 128)
        nw = 440 if tall else 380
        note_card(img, 64 + nw // 2 + 10, H - rib - (260 if tall else 200), nw)
        ribbon(img, H - rib, rib, 56)
    return img.convert('RGB')


# ------------------------------------------------------------------ concept B
def concept_b(W, H):
    img = Image.new('RGBA', (W, H), CREAM)
    rib = 140 if H > W else 120
    head_h = 380 if H > W else 330
    y = headline(img, 64, 52, 104 if H > W else 92, W - 128)
    d = ImageDraw.Draw(img)
    f, _ = fit(d, 'Any dog, any style. Painted from your photo.', lambda s: SANS(s, 500), 34, W - 128)
    d.text((64, y + 4), 'Any dog, any style. Painted from your photo.', font=f, fill=BODY)
    gap = 12; m = 40
    top = head_h + 24
    gh = H - rib - top - m
    cols, rows = 3, 2
    cw = (W - 2 * m - gap * (cols - 1)) // cols; ch = (gh - gap * (rows - 1)) // rows
    for i, dog in enumerate(DOGS):
        cx = m + (i % cols) * (cw + gap); cy = top + (i // cols) * (ch + gap)
        tile = cover(scene(dog), cw, ch, 0.55, 0.62).convert('RGBA')
        mask = Image.new('L', (cw, ch), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, cw - 1, ch - 1), 22, fill=255)
        shadow(img, (cx, cy, cx + cw, cy + ch), 22, 10, (0, 8), 0.22)
        img.paste(tile, (cx, cy), mask)
    ribbon(img, H - rib, rib, 56)
    return img.convert('RGB')


def build(out):
    os.makedirs(out, exist_ok=True)
    for name, (w, h) in SIZES.items():
        im = (concept_a if name.startswith('a-') else concept_b)(w, h)
        path = os.path.join(out, name + '.jpg')
        im.save(path, quality=90, optimize=True, progressive=True)
        if name == 'a-link-1200x630' and os.path.getsize(path) > 300_000:
            im.save(path, quality=82, optimize=True, progressive=True)
        print(path, im.size, os.path.getsize(path))
    # a contact sheet to review them together
    ims = [Image.open(os.path.join(out, n + '.jpg')) for n in SIZES]
    th = [i.copy() for i in ims]
    for t in th: t.thumbnail((540, 960))
    sheet = Image.new('RGB', (sum(t.width for t in th) + 24 * (len(th) + 1), max(t.height for t in th) + 48), '#e9e2db')
    x = 24
    for t in th: sheet.paste(t, (x, 24)); x += t.width + 24
    sheet.save(os.path.join(out, 'sheet.jpg'), quality=85)


def check(out):
    bad = []
    for name, size in SIZES.items():
        p = os.path.join(out, name + '.jpg')
        if not os.path.exists(p): bad.append(f'missing {name}'); continue
        im = Image.open(p)
        if im.size != size or im.mode != 'RGB': bad.append(f'{name}: {im.size} {im.mode}, want {size} RGB')
    p = os.path.join(out, 'a-link-1200x630.jpg')
    if os.path.exists(p) and os.path.getsize(p) > 300_000: bad.append('a-link-1200x630.jpg is over 300 KB')
    for b in bad: print('FAIL', b)
    print('ok' if not bad else f'{len(bad)} problems')
    return 0 if not bad else 1


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--out'); ap.add_argument('--check')
    a = ap.parse_args()
    if a.out: build(a.out)
    sys.exit(check(a.check) if a.check else 0)
