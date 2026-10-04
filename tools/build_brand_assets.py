"""Build the small store assets from the supplied brand files.

Run from the repo root after tools/build_ornament.py:
    python3 tools/build_brand_assets.py

Writes assets/favicon-512.png, the watercolour heart, square and transparent.

The v2 social sharing image (assets/social-share-1200x628.png) is built by
tools/preview/print.mjs from the poster design; share_image() below is the v1
ornament version, kept for reference and no longer run.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from build_ornament import ASSETS, CREAM, FONTS, INK, OUT, ornament_render

ROOT = Path(__file__).resolve().parent.parent


def favicon():
    h = Image.open(ASSETS / "heartside-heart-watercolor.png").convert("RGBA")
    h = h.crop(h.getchannel("A").getbbox())
    side = 512
    inner = int(side * 0.9)
    scale = inner / max(h.size)
    h = h.resize((round(h.width * scale), round(h.height * scale)), Image.LANCZOS)
    img = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    img.alpha_composite(h, ((side - h.width) // 2, (side - h.height) // 2))
    img.save(ASSETS / "favicon-512.png", optimize=True)


def share_image():
    W, H = 1200, 628
    img = Image.new("RGBA", (W, H), CREAM + (255,))
    d = ImageDraw.Draw(img)

    # Left: wordmark as supplied, then the positioning line
    logo = Image.open(ASSETS / "heartside-logo.png").convert("RGBA")
    logo = logo.crop(logo.getchannel("A").getbbox())
    lw = 430
    logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
    x0 = 80
    img.alpha_composite(logo, (x0, 150))

    f = ImageFont.truetype(str(FONTS / "CormorantGaramond-Medium.ttf"), 50)
    fi = ImageFont.truetype(str(FONTS / "CormorantGaramond-MediumItalic.ttf"), 50)
    y = 150 + logo.height + 58
    d.text((x0, y), "Gifts for people whose", font=f, fill=INK)
    d.text((x0, y + 58), "dog is their ", font=f, fill=INK)
    d.text((x0 + d.textlength("dog is their ", font=f), y + 58), "person.", font=fi, fill=INK)
    small = ImageFont.truetype(str(FONTS / "DMSans-Medium.ttf"), 20)
    d.text((x0 + 2, y + 160), "HEARTSIDE.IO", font=small, fill=(110, 100, 96))

    # Right: the ornament, the hero product
    face = Image.open(OUT / "front-sample-biscuit.png").convert("RGBA")
    orn = ornament_render(face, 470)
    img.alpha_composite(orn, (W - orn.width - 30, (H - orn.height) // 2 - 6))
    img.convert("RGB").save(ASSETS / "social-share-1200x628.png", optimize=True)


if __name__ == "__main__":
    favicon()
    print("wrote assets/favicon-512.png")
