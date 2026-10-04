"""Build the web assets for the Shopify homepage sections in shopify/assets/.

Run from the repo root after tools/build_ornament.py:
    python3 tools/build_shopify_assets.py

Needs Pillow and fonttools + brotli (pip install pillow fonttools brotli).
Everything is generated from assets/ and ornament/, so swapping a photo or the
ornament artwork and rerunning keeps the site and the print files in step.
"""
from pathlib import Path

from fontTools import subset
from PIL import Image

from build_ornament import (ASSETS, FONTS, OUT, build_back, build_front_parts, compose_front,
                            ornament_render)

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "shopify" / "assets"
SCRATCH_FONTS = Path(__file__).resolve().parent / "fonts"

# Every dog on the site: source photo, where the face sits (x, y fractions), how
# tight to crop (zoom), and the sample name it wears. Names are samples, never customers.
DOGS = {
    "dachshund": (ASSETS / "hero-dachshund.png", (0.53, 0.47), 1.0, "Biscuit"),
    "poodle": (ASSETS / "photos" / "red-poodle-head-tilt.jpg", (0.46, 0.30), 1.55, "Mochi"),
    "pug": (ASSETS / "photos" / "pug-autumn-leaves.jpg", (0.455, 0.33), 2.5, "Gerald"),
    "maltipoo": (ASSETS / "photos" / "maltipoo-on-deck.jpg", (0.36, 0.30), 1.9, "Pudding"),
    "apricot": (ASSETS / "photos" / "apricot-poodle-puppy.jpg", (0.49, 0.33), 2.3, "Nugget"),
    "golden": (ASSETS / "photos" / "golden-puppy-asleep.jpg", (0.63, 0.55), 2.0, "Waffles"),
}

# Full photos used as section imagery (key -> source)
PHOTOS = {
    "dachshund": ASSETS / "hero-dachshund.png",
    "golden-asleep": ASSETS / "photos" / "golden-puppy-asleep.jpg",
    "poodle": ASSETS / "photos" / "red-poodle-head-tilt.jpg",
    "maltipoo": ASSETS / "photos" / "maltipoo-on-deck.jpg",
    "pug": ASSETS / "photos" / "pug-autumn-leaves.jpg",
    "apricot": ASSETS / "photos" / "apricot-poodle-puppy.jpg",
}

FONT_FILES = {
    "hs-cormorant-400.woff2": "CormorantGaramond-Regular.ttf",
    "hs-cormorant-400i.woff2": "CormorantGaramond-Italic.ttf",
    "hs-cormorant-500.woff2": "CormorantGaramond-Medium.ttf",
    "hs-cormorant-500i.woff2": "CormorantGaramond-MediumItalic.ttf",
    "hs-dmsans-400.woff2": "DMSans-Regular.ttf",
    "hs-dmsans-500.woff2": "DMSans-Medium.ttf",
}


def webp(img, path, width, quality=80):
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    img.save(path, "WEBP", quality=quality, method=6)


def photos():
    for key, src in PHOTOS.items():
        im = Image.open(src)
        im = im.convert("RGB")
        for w in (800, 1600):
            webp(im, DEST / f"hs-photo-{key}-{w}.webp", w)


def ornaments():
    _, win, win_box, frame = build_front_parts()
    x0, y0, x1, y1 = win_box
    # Frame overlay and back for the live preview (alpha kept)
    webp(frame, DEST / "hs-ornament-frame.webp", 1000, quality=86)
    webp(build_back().convert("RGB"), DEST / "hs-ornament-back.webp", 1000, quality=86)
    from build_ornament import cover
    for key, (src, focus, zoom, name) in DOGS.items():
        photo = Image.open(src).convert("RGB")
        # Photo pre-cropped to the heart window, for the live preview
        crop = cover(photo.convert("RGBA"), x1 - x0, y1 - y0, focus, zoom).convert("RGB")
        webp(crop, DEST / f"hs-window-{key}.webp", 720, quality=82)
        # Hanging product render with the sample name, for galleries and the hero
        face = compose_front(photo, name, frame, win, win_box, focus, zoom)
        render = ornament_render(face, 900)
        webp(render, DEST / f"hs-ornament-{key}.webp", 760, quality=84)


def fonts():
    for out, ttf in FONT_FILES.items():
        src = FONTS / ttf
        if not src.exists():
            src = SCRATCH_FONTS / ttf
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["kern", "liga", "onum", "lnum"]
        opts.desubroutinize = True
        font = subset.load_font(str(src), opts)
        s = subset.Subsetter(opts)
        s.populate(unicodes=list(range(0x20, 0x7F)) + list(range(0xA0, 0x100))
                   + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x00D7])
        s.subset(font)
        subset.save_font(font, str(DEST / out), opts)


def heart():
    h = Image.open(ASSETS / "heartside-heart-watercolor.png").convert("RGBA")
    h = h.crop(h.getchannel("A").getbbox())
    webp(h, DEST / "hs-heart.webp", 240, quality=88)


if __name__ == "__main__":
    DEST.mkdir(parents=True, exist_ok=True)
    photos()
    ornaments()
    fonts()
    heart()
    total = sum(p.stat().st_size for p in DEST.iterdir())
    print(f"wrote {len(list(DEST.iterdir()))} files to shopify/assets ({total / 1024:.0f} KB)")
