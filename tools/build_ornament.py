"""Build the "Their Person" ornament print files from the supplied brand assets.

Run from the repo root:
    python3 tools/build_ornament.py                       # rebuild every file in ornament/
    python3 tools/build_ornament.py --photo dog.jpg --name "Biscuit" [--focus 0.5,0.45]
                                                          # one finished front for one order
Needs Pillow and the fonts in tools/fonts/ (Cormorant Garamond, DM Sans; SIL OFL).

Everything is drawn on a 1500 x 1500 square that maps onto the 2.99" round
ceramic ornament (about 500 px per inch). The design lives inside a safe circle
of 86% of the diameter so nothing important sits near the cut edge.
"""
from pathlib import Path

import argparse
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
OUT = ROOT / "ornament"
FONTS = ROOT / "tools" / "fonts"

S = 1500                      # canvas, px
C = S // 2                    # centre
SAFE_R = int(S * 0.43)        # safe-circle radius (86% of diameter)

CREAM = (251, 246, 241)       # --cream  #FBF6F1
INK = (18, 16, 16)            # --ink    #121010
ROSE = (228, 156, 180)        # --rose   #E49CB4

# Heart window placement (front)
HEART_W = 760                 # width of the watercolour heart on the canvas
HEART_TOP = 214               # y of the heart's top edge
RIM = 24                      # watercolour rim left visible around the photo, px

# Text placement (front)
NAME_Y = 1084                 # vertical centre of the name line
NAME_SIZE = 168
NAME_MAX_W = 900              # widest the name may run before it shrinks
LINE2_Y = 1218                # vertical centre of "is my person."
LINE2_SIZE = 86
NAME_FONT = "CormorantGaramond-MediumItalic.ttf"
LINE2_FONT = "CormorantGaramond-Medium.ttf"


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def load_heart():
    """The supplied watercolour heart, trimmed to its painted area."""
    h = Image.open(ASSETS / "heartside-heart-watercolor.png").convert("RGBA")
    return h.crop(h.getchannel("A").getbbox())


def placed_heart():
    """Watercolour heart scaled and placed on a transparent canvas."""
    h = load_heart()
    scale = HEART_W / h.width
    h = h.resize((HEART_W, round(h.height * scale)), Image.LANCZOS)
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    layer.alpha_composite(h, (C - HEART_W // 2, HEART_TOP))
    return layer


def window_mask(heart_layer):
    """Photo window: the heart's own silhouette, pulled in by RIM px.

    Eroding the painted silhouette keeps the hand-painted wobble of the brand
    heart, so the window reads as drawn rather than as a geometric heart icon.
    """
    a = heart_layer.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    m = a.filter(ImageFilter.MinFilter(RIM * 2 + 1))
    # soften the edge a touch so the photo melts into the watercolour
    return m.filter(ImageFilter.GaussianBlur(1.6))


def cover(photo, box_w, box_h, focus=(0.5, 0.45)):
    """Scale-and-crop a photo to fill a box, biased toward the focus point."""
    pw, ph = photo.size
    scale = max(box_w / pw, box_h / ph)
    nw, nh = round(pw * scale), round(ph * scale)
    p = photo.resize((nw, nh), Image.LANCZOS)
    left = min(max(round(nw * focus[0] - box_w / 2), 0), nw - box_w)
    top = min(max(round(nh * focus[1] - box_h / 2), 0), nh - box_h)
    return p.crop((left, top, left + box_w, top + box_h))


def name_font(draw, text):
    size = NAME_SIZE
    while size > 90:
        f = font(NAME_FONT, size)
        if draw.textlength(text, font=f) <= NAME_MAX_W:
            return f
        size -= 4
    return font(NAME_FONT, size)


def circle_mask(r=C):
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).ellipse((C - r, C - r, C + r, C + r), fill=255)
    return m


# ---------------------------------------------------------------- front ----

def build_front_parts():
    heart = placed_heart()
    win = window_mask(heart)
    win_box = win.point(lambda v: 255 if v > 0 else 0).getbbox()

    # Frame overlay: cream everywhere, watercolour heart on top, photo hole cut out.
    # No text on it: both lines are Printify text layers so they share one font.
    frame = Image.new("RGBA", (S, S), CREAM + (255,))
    frame.alpha_composite(heart)
    frame.putalpha(ImageChops.subtract(frame.getchannel("A"), win))
    return heart, win, win_box, frame


def compose_front(photo, name, frame, win, win_box, focus=(0.5, 0.45)):
    x0, y0, x1, y1 = win_box
    pad = 12
    bw, bh = x1 - x0 + pad * 2, y1 - y0 + pad * 2
    img = Image.new("RGBA", (S, S), CREAM + (255,))
    img.alpha_composite(cover(photo.convert("RGBA"), bw, bh, focus), (x0 - pad, y0 - pad))
    img.alpha_composite(frame)
    d = ImageDraw.Draw(img)
    d.text((C, NAME_Y), name, font=name_font(d, name), fill=INK, anchor="mm")
    d.text((C, LINE2_Y), "is my person.", font=font(LINE2_FONT, LINE2_SIZE), fill=INK,
           anchor="mm")
    return img


# ----------------------------------------------------------------- back ----

def build_back():
    img = Image.new("RGBA", (S, S), CREAM + (255,))
    d = ImageDraw.Draw(img)

    # "Keep them close." — the brand line, large, centred slightly above middle
    f = font("CormorantGaramond-MediumItalic.ttf", 156)
    d.text((C, 516), "Keep them", font=f, fill=INK, anchor="mm")
    d.text((C, 680), "close.", font=f, fill=INK, anchor="mm")

    # Heartside mark: the supplied wordmark, as given, under the line. 720 px wide
    # keeps its hairlines printable on a 3" disc ("EST. 2022" will read as a fine line).
    logo = Image.open(ASSETS / "heartside-logo.png").convert("RGBA")
    logo = logo.crop(logo.getchannel("A").getbbox())
    lw = 720
    logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
    img.alpha_composite(logo, (C - lw // 2, 856))
    return img


# ------------------------------------------------------------- previews ----

def guide_overlay(img):
    """Draw the cut circle and safe circle over a print file, for checking only."""
    g = img.copy()
    d = ImageDraw.Draw(g)
    d.ellipse((2, 2, S - 3, S - 3), outline=(200, 40, 40, 255), width=4)
    d.ellipse((C - SAFE_R, C - SAFE_R, C + SAFE_R, C + SAFE_R),
              outline=(40, 120, 200, 255), width=3)
    return g


def ornament_render(face, size=900):
    """A flat product render: round, glossy ceramic, soft shadow, gold cap."""
    pad = int(size * 0.14)
    W, H = size + pad * 2, size + pad * 2 + int(size * 0.10)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    disc = face.resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).ellipse((0, 0, size - 1, size - 1), fill=255)
    disc.putalpha(m)

    # glaze: a soft highlight top-left and a faint edge darkening
    gl = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gl)
    gd.ellipse((int(size * .12), int(size * .06), int(size * .62), int(size * .42)),
               fill=(255, 255, 255, 46))
    gl = gl.filter(ImageFilter.GaussianBlur(size * .05))
    edge = Image.new("L", (size, size), 0)
    ImageDraw.Draw(edge).ellipse((0, 0, size - 1, size - 1), outline=70, width=int(size * .02))
    edge = edge.filter(ImageFilter.GaussianBlur(size * .012))
    shade = Image.new("RGBA", (size, size), (60, 40, 30, 0))
    shade.putalpha(ImageChops.multiply(edge, m))
    disc.alpha_composite(shade)
    gl.putalpha(ImageChops.multiply(gl.getchannel("A"), m))
    disc.alpha_composite(gl)

    top = pad + int(size * 0.10)
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((pad + 14, top + 26, pad + size + 14, top + size + 26),
                               fill=(70, 40, 30, 70))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size * .03)))
    canvas.alpha_composite(disc, (pad, top))

    # ribbon + hole
    cd = ImageDraw.Draw(canvas)
    cx = pad + size // 2
    hole_y = top + int(size * 0.045)
    cd.line((cx, 0, cx, hole_y), fill=(178, 38, 52, 255), width=max(6, size // 90))
    r = max(9, size // 55)
    cd.ellipse((cx - r, hole_y - r, cx + r, hole_y + r), fill=(235, 226, 216, 255),
               outline=(180, 160, 140, 255), width=2)
    return canvas


def preview_sheet(fronts, back):
    """Cream sheet: one front large, the back, and name stress tests."""
    W, H = 2400, 1500
    sheet = Image.new("RGBA", (W, H), CREAM + (255,))
    big = ornament_render(fronts[0][1], 820)
    sheet.alpha_composite(big, (90, 60))
    bk = ornament_render(back, 820)
    sheet.alpha_composite(bk, (1250, 60))
    d = ImageDraw.Draw(sheet)
    lab = font("DMSans-Medium.ttf", 30)
    d.text((90 + big.width // 2, 1270), "FRONT  ·  customer's photo + dog's name", font=lab,
           fill=INK, anchor="mm")
    d.text((1250 + bk.width // 2, 1270), "BACK  ·  same on every ornament", font=lab,
           fill=INK, anchor="mm")
    small = font("DMSans-Regular.ttf", 24)
    d.text((W // 2, 1400), "Their Person ornament  ·  2.99\" round ceramic  ·  sample photo: "
           "assets/hero-dachshund.png", font=small, fill=(110, 100, 96), anchor="mm")
    return sheet


def names_sheet(fronts):
    W, H = 2400, 900
    sheet = Image.new("RGBA", (W, H), CREAM + (255,))
    d = ImageDraw.Draw(sheet)
    lab = font("DMSans-Regular.ttf", 26)
    n = len(fronts)
    slot = W // n
    for i, (name, face) in enumerate(fronts):
        r = ornament_render(face, 560)
        x = i * slot + (slot - r.width) // 2
        sheet.alpha_composite(r, (x, 20))
        d.text((i * slot + slot // 2, 840), f"\"{name}\"  ·  {len(name)} characters",
               font=lab, fill=(110, 100, 96), anchor="mm")
    return sheet


def compose_one(photo_path, name, focus, out_path):
    """Fallback for manual personalisation: one finished, print-ready front."""
    _, win, win_box, frame = build_front_parts()
    photo = Image.open(photo_path)
    try:  # respect phone-camera rotation
        from PIL import ImageOps
        photo = ImageOps.exif_transpose(photo)
    except Exception:
        pass
    front = compose_front(photo, name.strip(), frame, win, win_box, focus)
    front.convert("RGB").save(out_path, optimize=True)
    guide_overlay(front).convert("RGB").save(
        Path(out_path).with_name(Path(out_path).stem + "-check.png"))
    print(f"wrote {out_path} (print file) and its -check.png (with cut + safe circles)")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--photo", help="customer's dog photo (jpg/png)")
    ap.add_argument("--name", help="dog's name, as typed by the customer")
    ap.add_argument("--focus", default="0.5,0.45",
                    help="where the dog's face is in the photo, as x,y fractions (default 0.5,0.45)")
    ap.add_argument("--out", default=None, help="output path (default ornament/orders/<name>.png)")
    args = ap.parse_args()
    if args.photo or args.name:
        if not (args.photo and args.name):
            ap.error("--photo and --name go together")
        fx, fy = (float(v) for v in args.focus.split(","))
        out = args.out or str(OUT / "orders" / f"{args.name.strip().replace(' ', '-')}.png")
        Path(out).parent.mkdir(parents=True, exist_ok=True)
        compose_one(args.photo, args.name, (fx, fy), out)
        return

    OUT.mkdir(exist_ok=True)
    (OUT / "preview").mkdir(exist_ok=True)

    heart, win, win_box, frame = build_front_parts()
    dog = Image.open(ASSETS / "hero-dachshund.png")
    # The dachshund's face sits slightly right of centre and above middle
    focus = (0.53, 0.47)

    # 1. Layer files for Printify's editor
    frame.save(OUT / "front-frame-overlay.png", optimize=True)
    mask = Image.new("L", (S, S), 0)
    mask.paste(win)
    mask.save(OUT / "front-heart-window-mask.png", optimize=True)
    # same window as transparent PNG, cropped to the photo slot, for tools that
    # want a clipping shape rather than a full-canvas mask
    clip = Image.new("RGBA", (S, S), INK + (0,))
    clip.putalpha(win)
    clip.crop(win_box).save(OUT / "front-heart-window-shape.png", optimize=True)

    # 2. Flattened sample front (needed so Printify's editor has real artwork to save)
    sample = compose_front(dog, "Biscuit", frame, win, win_box, focus)
    sample.convert("RGB").save(OUT / "front-sample-biscuit.png", optimize=True)

    # 3. Back
    back = build_back()
    back.convert("RGB").save(OUT / "back.png", optimize=True)

    # 4. Checking and selling previews
    guide_overlay(sample).convert("RGB").save(OUT / "preview" / "front-with-guides.png")
    guide_overlay(back).convert("RGB").save(OUT / "preview" / "back-with-guides.png")
    preview_sheet([("Biscuit", sample)], back).convert("RGB").save(
        OUT / "preview" / "ornament-front-back.png", optimize=True)
    tests = ["Bo", "Biscuit", "Mr. Pickles", "Sir Waffleton"]  # 2 to 13 characters
    fronts = [(n, compose_front(dog, n, frame, win, win_box, focus)) for n in tests]
    names_sheet(fronts).convert("RGB").save(OUT / "preview" / "name-length-test.png", optimize=True)

    x0, y0, x1, y1 = win_box
    print("photo window bbox (px on 1500 canvas):", win_box,
          f"-> {x1 - x0} x {y1 - y0}")
    print("as % of canvas: left {:.1f} top {:.1f} width {:.1f} height {:.1f}".format(
        x0 / S * 100, y0 / S * 100, (x1 - x0) / S * 100, (y1 - y0) / S * 100))
    d = ImageDraw.Draw(sample)
    for n in tests:
        f = name_font(d, n)
        print(f"name {n!r}: font size {f.size}, width {d.textlength(n, font=f):.0f}px")


if __name__ == "__main__":
    main()
