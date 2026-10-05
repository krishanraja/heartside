"""Build the web assets for the v2 Shopify sections in shopify/assets/.

Run from the repo root:
    python3 tools/build_shopify_assets.py

Needs Pillow and fonttools + brotli (pip install pillow fonttools brotli).
Photos come from assets/v2/, fonts from tools/fonts/ (all SIL Open Font License).
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

# Section imagery from the Canva set in assets/v2/ (assets/IMAGE-BRIEF.md).
# key -> (source, widths). Every section also has an image picker in the theme editor.
V2 = ASSETS / "v2"
SQUARE = (640, 1200)
WIDE = (960, 1600)
PHOTOS = {
    "manager": (V2 / "hero-manager.jpg", SQUARE),      # 1 hero, the manager
    "asleep": (V2 / "status-asleep.jpg", SQUARE),      # 2 in a meeting (asleep)
    "bed": (V2 / "side-of-bed.jpg", SQUARE),           # 3 your side of the bed
    "window": (V2 / "window-watch.jpg", SQUARE),       # 4 the mailman watch
    "vacuum": (V2 / "vacuum.jpg", SQUARE),             # 5 the vacuum standoff
    "incident": (V2 / "incident.jpg", SQUARE),         # 6 the incident
    "memo": (V2 / "memo-chest.jpg", WIDE),             # 7 management memo
    "holiday": (V2 / "holiday-party.jpg", WIDE),       # 8 holiday office closure
    "team-01": (V2 / "team-01.jpg", SQUARE),           # 9 dogs of the company
    "team-02": (V2 / "team-02.jpg", SQUARE),
    "team-03": (V2 / "team-03.jpg", SQUARE),
    "team-04": (V2 / "team-04.jpg", SQUARE),
    # product photos: the real design composited into a staged scene (tools/preview/mockups.py)
    "ornament-tree": (ROOT / "design" / "mockups" / "ornament-tree-1x1.jpg", SQUARE),
}
# The manager's face, square, for the poster headshot and the story card
HEADSHOT = (V2 / "hero-manager.jpg", (245, 80, 885, 720), 480)

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
    # The Canva exports are 1122 to 1672 px wide, so the large size can upscale a
    # little; the file name and srcset width stay true to the saved width.
    if img.width != width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    img.save(path, "WEBP", quality=quality, method=6)


def photos():
    for old in DEST.glob("hs-photo-*.webp"):
        old.unlink()
    for key, (src, widths) in PHOTOS.items():
        im = Image.open(src).convert("RGB")
        for w in widths:
            webp(im, DEST / f"hs-photo-{key}-{w}.webp", w)
    src, box, w = HEADSHOT
    webp(Image.open(src).convert("RGB").crop(box), DEST / f"hs-photo-headshot-{w}.webp", w, 84)


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
