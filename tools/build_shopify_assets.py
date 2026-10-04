"""Build the web assets for the v2 Shopify sections in shopify/assets/.

Run from the repo root:
    python3 tools/build_shopify_assets.py

Needs Pillow and fonttools + brotli (pip install pillow fonttools brotli).
Photos come from assets/, fonts from tools/fonts/ (all SIL Open Font License).
Rerunning keeps the theme's images and fonts in step with the source files.
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
FONTS = ROOT / "tools" / "fonts"
DEST = ROOT / "shopify" / "assets"

# Section imagery (key -> source). Stand-ins until the Canva and Printful images in
# assets/IMAGE-BRIEF.md exist; every section also has an image picker.
PHOTOS = {
    "dachshund": ASSETS / "hero-dachshund.png",
    "golden-asleep": ASSETS / "photos" / "golden-puppy-asleep.jpg",
    "poodle": ASSETS / "photos" / "red-poodle-head-tilt.jpg",
    "maltipoo": ASSETS / "photos" / "maltipoo-on-deck.jpg",
    "pug": ASSETS / "photos" / "pug-autumn-leaves.jpg",
}

LATIN = (list(range(0x20, 0x7F)) + list(range(0xA0, 0x100))
         + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x00B7])

# out file -> (source, axis limits or None for a static font)
FONT_FILES = {
    "hs-fraunces.woff2": ("Fraunces[opsz,wght].ttf", {"SOFT": 0, "WONK": 1, "wght": (400, 700)}),
    "hs-fraunces-italic.woff2": ("Fraunces-Italic[opsz,wght].ttf", {"SOFT": 0, "WONK": 1, "wght": 400}),
    "hs-dmsans.woff2": ("DMSans[opsz,wght].ttf", {"wght": (400, 700)}),
    "hs-courierprime-400.woff2": ("CourierPrime-Regular.ttf", None),
    "hs-courierprime-700.woff2": ("CourierPrime-Bold.ttf", None),
}


def webp(img, path, width, quality=80):
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    img.save(path, "WEBP", quality=quality, method=6)


def photos():
    for key, src in PHOTOS.items():
        im = Image.open(src).convert("RGB")
        for w in (800, 1600):
            webp(im, DEST / f"hs-photo-{key}-{w}.webp", w)


def fonts():
    for out, (src, limits) in FONT_FILES.items():
        font = TTFont(str(FONTS / src))
        if limits:
            font = instancer.instantiateVariableFont(font, limits)
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["kern", "liga", "calt", "onum", "lnum"]
        opts.desubroutinize = True
        s = subset.Subsetter(opts)
        s.populate(unicodes=LATIN)
        s.subset(font)
        subset.save_font(font, str(DEST / out), opts)


if __name__ == "__main__":
    DEST.mkdir(parents=True, exist_ok=True)
    photos()
    fonts()
    total = sum(p.stat().st_size for p in DEST.iterdir())
    print(f"shopify/assets: {len(list(DEST.iterdir()))} files, {total / 1024:.0f} KB")
