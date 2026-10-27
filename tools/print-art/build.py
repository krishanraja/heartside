"""Compose a reviewed city-screenprint background into a 12 x 18 inch print file.

This deliberately does not generate a dog or infer a place. A separate image
generation step must use the customer's own photo and the optional place they
gave, and a person must approve likeness before this file reaches fulfillment.
"""

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageCms, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent
SIZE = (3600, 5400)
FOOTER_TOP = 4660
PAPER = (255, 247, 224)
INK = (18, 42, 72)
FONT = ROOT / "fonts" / "Caveat-variable.ttf"
MAX_LINE = {"home": 60, "spot": 60, "together": 60, "meaning": 44}
CITY_PUNCTUATION = " .,'-"


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def checked_text(value, label, limit):
    if not isinstance(value, str):
        raise ValueError(f"{label} must be text")
    value = " ".join(value.split())
    if not value or len(value) > limit or any(c in value for c in "\n\r\t—!"):
        raise ValueError(f"{label} is empty, too long or contains unsupported print punctuation")
    return value


def render_prompt(manifest):
    """Turn only a buyer-supplied city into scene context; never use shipping data."""
    source = manifest.get("place_source")
    if source == "none":
        if manifest.get("place"):
            raise ValueError("Omitted place cannot carry a value")
        scene = "a quiet, unidentified residential neighborhood"
    elif source == "buyer":
        place = checked_text(manifest.get("place"), "place", 60)
        if not place[0].isalpha() or not all(c.isalpha() or c.isdigit() or c in CITY_PUNCTUATION for c in place):
            raise ValueError("Place must be a short city or neighborhood name")
        scene = f"a plausible residential street in {place}"
    else:
        raise ValueError("Place must come from the buyer or be omitted")
    return (ROOT / "prompt.txt").read_text(encoding="utf-8").replace("{PLACE_SCENE}", scene)


def fit_font(draw, lines, max_width):
    for size in range(108, 69, -2):
        font = ImageFont.truetype(str(FONT), size)
        if all(draw.textbbox((0, 0), line, font=font)[2] <= max_width for line in lines):
            return font
    raise ValueError("Note cannot fit legibly inside the print footer")


def fit_place(draw, place):
    for size in range(92, 57, -2):
        font = ImageFont.truetype(str(FONT), size)
        if draw.textbbox((0, 0), place, font=font)[2] <= 1000:
            return font
    raise ValueError("Place name cannot fit legibly inside the print footer")


def paw(draw, cx, cy, scale=1):
    # An illustrated mark, never presented as the customer's dog's actual paw.
    r = lambda a, b, c, d: (cx + int(a * scale), cy + int(b * scale),
                              cx + int(c * scale), cy + int(d * scale))
    draw.ellipse(r(-61, 3, 61, 90), fill=INK)
    for box in [(-79, -67, -30, -9), (-25, -94, 25, -31),
                (32, -72, 80, -14), (79, -20, 117, 32)]:
        draw.ellipse(r(*box), fill=INK)


def build(manifest_path, output_path):
    m = json.loads(manifest_path.read_text(encoding="utf-8"))
    if m.get("style") != "city-screenprint-v1":
        raise ValueError("Style must be city-screenprint-v1")
    mode = m.get("mode")
    if mode not in ("test", "production"):
        raise ValueError("mode must be test or production")
    if mode == "production" and not m.get("likeness_reviewed_by"):
        raise ValueError("A named person must review the generated dog's likeness")
    if m.get("place_source") not in ("buyer", "none"):
        raise ValueError("Place must come from the buyer or be omitted")
    rendered_prompt = render_prompt(m)
    if mode == "production" and not checked_text(m.get("order_ref"), "order_ref", 80):
        raise ValueError("Production requires an order reference")
    dog = checked_text(m.get("dog_name"), "dog_name", 14)
    place = checked_text(m.get("place"), "place", 60) if m.get("place_source") == "buyer" else ""
    if m.get("place_source") == "none" and m.get("place"):
        raise ValueError("Omitted place cannot carry a value")
    lines = [checked_text(m.get("lines", {}).get(k), k, cap) for k, cap in MAX_LINE.items()]
    source = Path(m["source_photo"]).expanduser().resolve(strict=True)
    background = Path(m["background"]).expanduser().resolve(strict=True)
    if source == background:
        raise ValueError("The original dog photo and generated background must be separate")
    with Image.open(source) as photo:
        if photo.width < 700 or photo.height < 700:
            raise ValueError("The original dog photo is too small for a likeness review")
    with Image.open(background) as src:
        if src.width < SIZE[0] or src.height < SIZE[1]:
            raise ValueError("Generated background is below the 300 DPI print canvas")
        ratio = src.width / src.height
        if abs(ratio - 2 / 3) > 0.012:
            raise ValueError("Generated background is not close to the 2:3 print ratio")
        art = ImageOps.fit(src.convert("RGB"), SIZE, method=Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(art)
    draw.rectangle((0, FOOTER_TOP, SIZE[0], SIZE[1]), fill=PAPER)
    font = fit_font(draw, lines, 3100)
    line_height = 106
    y = 4718
    for line in lines:
        width = draw.textbbox((0, 0), line, font=font)[2]
        draw.text((3320 - width, y), line, font=font, fill=INK, stroke_width=0)
        y += line_height
    sign_font = ImageFont.truetype(str(FONT), 130)
    signature = f"Love, {dog}"
    sw = draw.textbbox((0, 0), signature, font=sign_font)[2]
    draw.text((3160 - sw, 5160), signature, font=sign_font, fill=INK)
    paw(draw, 3270, 5200, 0.78)
    if place:
        place_font = fit_place(draw, place.upper())
        draw.text((230, 5175), place.upper(), font=place_font, fill=INK)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    srgb_profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
    art.save(output_path, format="PNG", dpi=(300, 300), icc_profile=srgb_profile, optimize=True)
    if output_path.stat().st_size > 60 * 1024 * 1024:
        output_path.unlink()
        raise ValueError("Print file exceeds the 60 MiB pre-upload limit")
    receipt = {
        "status": "test_only" if mode == "test" else "awaiting_print_proof_review",
        "canvas_px": list(SIZE), "dpi": 300, "size_inches": [12, 18],
        "source_photo_sha256": digest(source),
        "background_sha256": digest(background),
        "print_file_sha256": digest(output_path),
        "print_file_bytes": output_path.stat().st_size,
        "note_sha256": hashlib.sha256(json.dumps({"dog": dog, "lines": lines, "place": place}, ensure_ascii=False).encode("utf-8")).hexdigest(),
        "style_prompt_sha256": digest(ROOT / "prompt.txt"),
        "rendered_prompt_sha256": hashlib.sha256(rendered_prompt.encode("utf-8")).hexdigest(),
        "place_source": m["place_source"],
        "order_ref": m.get("order_ref") if mode == "production" else None,
        "likeness_reviewed_by": m.get("likeness_reviewed_by") if mode == "production" else None,
        "fulfillment_confirmed": False,
    }
    output_path.with_suffix(".proof.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    return receipt


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    print(json.dumps(build(args.manifest, args.output), indent=2))
