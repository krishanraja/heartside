#!/usr/bin/env python3
"""Build the brand-v4 favicon set: the pink watercolor heart with a white paw.

Ruling (Krish, 2026-10-27): the favicon and site icon are the pink watercolor heart
with a white paw. Brand book: never recolor, outline or redraw it, and keep clear
space of a quarter of its width.

Reads  design/brand-v4/heart-paw-source.png (the brand-book master, cropped, RGBA)
Writes design/brand-v4/favicon-{16,32,48,180,192,512}.png, icon-1024.png,
       favicon.ico (16, 32, 48), heartside-favicon-heart.png (the Shopify upload),
       favicon-preview.png (review sheet), and copies favicon-32 and favicon-180 to
       shopify/assets/hs-favicon-32.png and hs-favicon-180.png for local previews.

Run:   python3 tools/build_favicon.py

Every size is resampled from the master. Only 16, 32 and 48 px get a small-size
treatment, so the paw survives at tab size: an area (box) resample, saturation and
contrast raised around the heart's own mean (hue is kept), then a gentle unsharp mask.
The Shopify upload gets the same framing and color step at 512 px, because Shopify
scales that file down to the 32 px tab icon itself. 180, 192, 512 and 1024 are plain
resamples. The math runs in float on premultiplied alpha, so edges never pick up a
dark fringe. Same input, same bytes: there is no randomness, no timestamp and no
metadata in the outputs. Stdlib, Pillow and numpy only.
"""
from __future__ import annotations

import hashlib
import io
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "design" / "brand-v4"
SRC = OUT / "heart-paw-source.png"
OLD = ROOT / "design" / "brand-v3"
SHOP = ROOT / "shopify" / "assets"
FONT = ROOT / "tools" / "fonts" / "DMSans-Regular.ttf"

CREAM = (0xFB, 0xF6, 0xF1)          # Apple touch tile
TAB_LIGHT = (0xF1, 0xF1, 0xF1)      # light browser tab
TAB_DARK = (0x20, 0x21, 0x24)       # dark browser tab

QUARTER = 1 / 1.5   # clear space of a quarter of the heart's width on each side
SAFE = 0.80         # 10% safe zone on each side
TIGHT = 0.92        # about 4% padding on each side, for tab sizes

# Small-size treatment, per size: (color, contrast, unsharp sigma px, unsharp amount).
# Tuned on 27 Oct 2026 by measuring paw-minus-heart luminance at 16 px: a plain
# resample gives +0.09, this recipe +0.16. The first try (Lanczos, color 1.3,
# contrast 1.2, unsharp 0.7/1.0) mottled the watercolor into a checkerboard and lit
# the heart's soft edge up like an outline, so small sizes use a box (area) filter,
# which has no ringing, a gentler unsharp, and contrast rather than more saturation.
SMALL = {
    16: (1.15, 1.4, 1.0, 0.5),
    32: (1.15, 1.3, 1.0, 0.5),
    48: (1.15, 1.2, 1.0, 0.4),
}
# The Shopify upload. Shopify scales it to 32 px for the tab itself, so it carries the
# tab framing and the color step (no unsharp, which would not survive the downscale).
UPLOAD = (512, TIGHT, 1.15, 1.3)


# ---------------------------------------------------------------- image math

def load_master() -> np.ndarray:
    """The master as premultiplied float RGBA in 0..1, cropped tight to the heart."""
    a = np.asarray(Image.open(SRC).convert("RGBA"), dtype=np.float64) / 255.0
    ys, xs = np.nonzero(a[..., 3] > 0)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy()
    a[..., :3] *= a[..., 3:4]
    return a


def place(pm: np.ndarray, size: int, frac: float,
          resample: Image.Resampling = Image.Resampling.LANCZOS) -> np.ndarray:
    """Scale the heart so its wider side is frac * size, centered on a transparent
    size x size canvas. Resamples each premultiplied band in float."""
    h, w = pm.shape[:2]
    k = max(w, h) / (frac * size)                 # master px per output px
    offx, offy = (size - w / k) / 2, (size - h / k) / 2
    pad = int(np.ceil(max(offx, offy, 0.0) * k + 4 * k)) + 2
    big = np.zeros((h + 2 * pad, w + 2 * pad, 4))
    big[pad:pad + h, pad:pad + w] = pm
    box = (pad - offx * k, pad - offy * k, pad + (size - offx) * k, pad + (size - offy) * k)
    bands = []
    for i in range(4):
        band = Image.fromarray(np.ascontiguousarray(big[..., i], dtype=np.float32))
        bands.append(np.asarray(band.resize((size, size), resample, box=box), dtype=np.float64))
    return clamp(np.stack(bands, axis=-1))


def clamp(pm: np.ndarray) -> np.ndarray:
    out = pm.copy()
    out[..., 3] = np.clip(out[..., 3], 0.0, 1.0)
    out[..., :3] = np.clip(out[..., :3], 0.0, None)
    out[..., :3] = np.minimum(out[..., :3], out[..., 3:4])
    return out


def unpremultiply(pm: np.ndarray) -> np.ndarray:
    a = pm[..., 3:4]
    rgb = np.divide(pm[..., :3], a, out=np.zeros_like(pm[..., :3]), where=a > 0)
    return np.clip(rgb, 0.0, 1.0)


def luma(rgb: np.ndarray) -> np.ndarray:
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def gaussian_blur(x: np.ndarray, sigma: float) -> np.ndarray:
    """Separable Gaussian, zero outside the canvas (the canvas edge is transparent)."""
    r = max(1, int(np.ceil(3 * sigma)))
    t = np.arange(-r, r + 1, dtype=np.float64)
    kern = np.exp(-(t * t) / (2 * sigma * sigma))
    kern /= kern.sum()
    h, w = x.shape[:2]
    p = np.zeros((h + 2 * r, w + 2 * r) + x.shape[2:])
    p[r:r + h, r:r + w] = x
    tmp = np.zeros((h + 2 * r, w) + x.shape[2:])
    for i, kv in enumerate(kern):
        tmp += kv * p[:, i:i + w]
    out = np.zeros((h, w) + x.shape[2:])
    for i, kv in enumerate(kern):
        out += kv * tmp[i:i + h]
    return out


def enhance(pm: np.ndarray, color: float, contrast: float) -> np.ndarray:
    """Saturation, then contrast around the heart's own mean luminance. Both steps
    scale each pixel's distance from a gray, so hue does not change."""
    a = pm[..., 3]
    rgb = unpremultiply(pm)
    g = luma(rgb)[..., None]
    rgb = g + color * (rgb - g)
    mean = float((luma(np.clip(rgb, 0, 1)) * a).sum() / a.sum())
    rgb = np.clip(mean + contrast * (rgb - mean), 0.0, 1.0)
    return np.concatenate([rgb * a[..., None], a[..., None]], axis=-1)


def unsharp(pm: np.ndarray, sigma: float, amount: float) -> np.ndarray:
    """Unsharp mask on premultiplied RGBA: the same as sharpening the icon composited
    over any flat background, so it never darkens or lightens the surroundings."""
    return clamp(pm + amount * (pm - gaussian_blur(pm, sigma)))


def small_icon(pm: np.ndarray, size: int) -> np.ndarray:
    color, contrast, sigma, amount = SMALL[size]
    return unsharp(enhance(place(pm, size, TIGHT, Image.Resampling.BOX), color, contrast), sigma, amount)


def to_image(pm: np.ndarray) -> Image.Image:
    a = pm[..., 3]
    rgb = unpremultiply(pm)
    a8 = np.rint(a * 255).astype(np.uint8)
    rgb8 = np.rint(rgb * 255).astype(np.uint8)
    rgb8[a8 == 0] = 0
    return Image.fromarray(np.dstack([rgb8, a8]))


def on_tile(pm: np.ndarray, rgb: tuple[int, int, int]) -> Image.Image:
    bg = np.array(rgb, dtype=np.float64) / 255.0
    out = pm[..., :3] + (1.0 - pm[..., 3:4]) * bg
    return Image.fromarray(np.rint(np.clip(out, 0, 1) * 255).astype(np.uint8))


# ---------------------------------------------------------------- outputs

def png_bytes(im: Image.Image) -> bytes:
    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def write(path: Path, data: bytes, written: list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    written.append(path)


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT), size, layout_engine=ImageFont.Layout.BASIC)


def paste(sheet: Image.Image, im: Image.Image, x: int, y: int) -> None:
    sheet.alpha_composite(im.convert("RGBA"), (x, y))


def preview(icons: dict, old: dict) -> Image.Image:
    """Review sheet: 180, 64, 32, 16 on a light and a dark browser tab, with the old
    brand-v3 Buddy head at 32 and 16 beside them. Everything at actual pixel size."""
    W, PANEL_H = 940, 352
    sheet = Image.new("RGBA", (W, 80 + 2 * PANEL_H + 16 + 56), (255, 255, 255, 255))
    d = ImageDraw.Draw(sheet)
    d.text((24, 18), "Heartside favicon, brand-v4: pink watercolor heart with white paw", font=font(20), fill=(31, 31, 31))
    d.text((24, 48), "Actual pixel sizes. The old brand-v3 Buddy head is on the right of each panel for comparison.",
           font=font(13), fill=(95, 99, 104))
    title = "Heartside | Personalized Dog Gifts"
    panels = [
        ("Light browser tab, #F1F1F1", TAB_LIGHT, (60, 64, 67), (95, 99, 104), (201, 203, 207)),
        ("Dark browser tab, #202124", TAB_DARK, (232, 234, 237), (154, 160, 166), (95, 99, 104)),
    ]
    for n, (label, bg, fg, sub, line) in enumerate(panels):
        top = 80 + n * (PANEL_H + 16)
        d.rectangle((24, top, W - 25, top + PANEL_H - 1), fill=bg)
        d.text((44, top + 14), label, font=font(13), fill=sub)
        d.text((44, top + 44), "New, brand-v4", font=font(14), fill=fg)
        d.text((594, top + 44), "Old, brand-v3 Buddy head", font=font(14), fill=fg)
        base = top + 72 + 180
        x = 44
        for size, cap in ((180, "180, Apple touch"), (64, "64"), (32, "32"), (16, "16")):
            paste(sheet, icons[size], x, base - size)
            d.text((x, base + 8), cap, font=font(12), fill=sub)
            x += size + 40
        d.line((560, top + 44, 560, base + 24), fill=line, width=1)
        x = 594
        for size in (32, 16):
            paste(sheet, old[size], x, base - size)
            d.text((x, base + 8), str(size), font=font(12), fill=sub)
            x += size + 40
        # Tab mocks: the 16 px icon on the tab color, next to the page title
        ty = base + 40
        for i, (cap, im) in enumerate((("New", icons[16]), ("Old", old[16]))):
            tx = 44 + i * 360
            d.text((tx, ty), cap, font=font(12), fill=sub)
            d.rounded_rectangle((tx, ty + 18, tx + 320, ty + 52), radius=8, fill=bg, outline=line, width=1)
            paste(sheet, im, tx + 12, ty + 27)
            d.text((tx + 38, ty + 26), title, font=font(13), fill=fg)
    d.text((24, sheet.height - 44),
           "16, 32 and 48 px: area resample, color x1.15, contrast x1.4 / 1.3 / 1.2 around the heart's own mean, "
           "a gentle unsharp mask, about 4% padding.",
           font=font(12), fill=(95, 99, 104))
    d.text((24, sheet.height - 26), "Same hue. Not recolored, outlined or redrawn. 180 uses the quarter-width clear space on cream.",
           font=font(12), fill=(95, 99, 104))
    return sheet.convert("RGB")


def main() -> None:
    pm = load_master()
    written: list[Path] = []
    icons: dict[int, Image.Image] = {}

    for size in SMALL:
        im = to_image(small_icon(pm, size))
        icons[size] = im
        write(OUT / f"favicon-{size}.png", png_bytes(im), written)

    icons[180] = on_tile(place(pm, 180, QUARTER), CREAM)
    write(OUT / "favicon-180.png", png_bytes(icons[180]), written)

    for size in (192, 512):
        icons[size] = to_image(place(pm, size, SAFE))
        write(OUT / f"favicon-{size}.png", png_bytes(icons[size]), written)

    write(OUT / "icon-1024.png", png_bytes(to_image(place(pm, 1024, QUARTER))), written)

    size, frac, color, contrast = UPLOAD
    upload = to_image(clamp(enhance(place(pm, size, frac), color, contrast)))
    write(OUT / "heartside-favicon-heart.png", png_bytes(upload), written)

    buf = io.BytesIO()
    icons[48].save(buf, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)],
                   append_images=[icons[16], icons[32]])
    write(OUT / "favicon.ico", buf.getvalue(), written)

    icons[64] = to_image(place(pm, 64, SAFE))   # review size only, 192/512 recipe
    old = {s: Image.open(OLD / f"favicon-{s}.png").convert("RGBA") for s in (16, 32)}
    write(OUT / "favicon-preview.png", png_bytes(preview(icons, old)), written)

    for size, name in ((32, "hs-favicon-32.png"), (180, "hs-favicon-180.png")):
        dst = SHOP / name
        shutil.copyfile(OUT / f"favicon-{size}.png", dst)
        written.append(dst)

    for p in written:
        data = p.read_bytes()
        if p.suffix == ".ico":
            dims = ", ".join(f"{w}x{h}" for w, h in sorted(Image.open(p).info["sizes"]))
        else:
            dims = "x".join(map(str, Image.open(p).size))
        print(f"wrote {p.relative_to(ROOT)}  {dims}  {len(data)} bytes  sha256 {hashlib.sha256(data).hexdigest()}")


if __name__ == "__main__":
    main()
