"""Metered, order-time dog-scene edit. Dry-run unless --execute is explicit.

This never sends gift copy, a delivery address or an order number to the model.
It does not confirm fulfillment or decide whether the dog still looks right.
"""

import argparse
import base64
import io
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageOps

from build import SIZE, digest, render_prompt


MODEL = "gpt-image-2.5-sunburst"
MODEL_SIZE = (2336, 3504)  # 2:3, 8,185,344 pixels, below the 8,294,400 limit
MAX_INPUT_BYTES = 50 * 1024 * 1024
ROOT = Path(__file__).resolve().parents[2]


def plan(manifest_path):
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("style") != "city-screenprint-v1":
        raise ValueError("This generator only supports city-screenprint-v1")
    if manifest.get("mode") not in ("test", "production"):
        raise ValueError("mode must be test or production")
    if manifest["mode"] == "production" and not manifest.get("order_ref"):
        raise ValueError("Production generation needs a private order reference")
    prompt = render_prompt(manifest)
    source = Path(manifest["source_photo"]).expanduser().resolve(strict=True)
    background = Path(manifest["background"]).expanduser().resolve()
    raw = background.with_name(background.stem + ".model.png")
    receipt = background.with_name(background.stem + ".generation.json")
    pending = background.with_name(background.stem + ".pending.json")
    if source.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
        raise ValueError("Source photo must be JPEG, PNG or WebP")
    if source.stat().st_size > MAX_INPUT_BYTES:
        raise ValueError("Source photo exceeds the model input limit")
    if any(p == ROOT or ROOT in p.parents for p in (background, raw, receipt)):
        raise ValueError("Private order output must stay outside the repository")
    if any(p.exists() for p in (background, raw, receipt, pending)):
        raise FileExistsError("This order has output or an unresolved image call; inspect it before another trial")
    with Image.open(source) as image:
        if min(image.size) < 512:
            raise ValueError("Source photo is too small for a likeness trial")
    return manifest, source, background, raw, receipt, pending, prompt


def sanitized_photo(source):
    """Discard EXIF, including location, before sending the dog reference."""
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=95, optimize=True)
    buffer.seek(0)
    buffer.name = "dog-reference.jpg"
    return buffer


def execute(manifest_path, client=None):
    manifest, source, background, raw, receipt, pending, prompt = plan(manifest_path)
    if client is None:
        if not os.environ.get("OPENAI_API_KEY"):
            raise RuntimeError("Connect the image API key through the approved runtime first")
        from openai import OpenAI
        client = OpenAI(timeout=180.0, max_retries=0)
    photo = sanitized_photo(source)
    background.parent.mkdir(parents=True, exist_ok=True)
    with pending.open("x", encoding="utf-8") as marker:
        json.dump({"status": "image_call_outcome_unknown", "model": MODEL,
                   "started_at": datetime.now(timezone.utc).isoformat(),
                   "source_photo_sha256": digest(source)}, marker)
    started = time.monotonic()
    response = client.images.edit(
        model=MODEL,
        image=photo,
        prompt=prompt,
        size=f"{MODEL_SIZE[0]}x{MODEL_SIZE[1]}",
        quality="high",
        output_format="png",
        background="opaque",
    )
    seconds = round(time.monotonic() - started, 2)
    data = response.data[0].b64_json if response.data else None
    if not data:
        raise ValueError("Image provider returned no image bytes")
    image_bytes = base64.b64decode(data, validate=True)
    with Image.open(io.BytesIO(image_bytes)) as image:
        image.load()
        if image.size != MODEL_SIZE:
            raise ValueError(f"Image provider returned {image.size}, not {MODEL_SIZE}")
        prepared = ImageOps.exif_transpose(image).convert("RGB").resize(SIZE, Image.Resampling.LANCZOS)
    raw.write_bytes(image_bytes)
    prepared.save(background, format="PNG", optimize=True)
    usage = getattr(response, "usage", None)
    if usage is not None and hasattr(usage, "model_dump"):
        usage = usage.model_dump(exclude_none=True)
    proof = {
        "status": "awaiting_human_likeness_and_print_review",
        "model": MODEL,
        "quality": "high",
        "model_pixels": list(MODEL_SIZE),
        "prepared_pixels": list(SIZE),
        "upscale_factor": round(SIZE[0] / MODEL_SIZE[0], 4),
        "image_call_seconds": seconds,
        "usage": usage,
        "source_photo_sha256": digest(source),
        "model_image_sha256": digest(raw),
        "prepared_background_sha256": digest(background),
        "fulfillment_confirmed": False,
    }
    receipt.write_text(json.dumps(proof, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    pending.unlink()
    return proof


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--execute", action="store_true", help="Make one paid image edit")
    args = parser.parse_args()
    manifest, source, background, raw, receipt, pending, prompt = plan(args.manifest)
    if not args.execute:
        print(json.dumps({
            "mode": "dry_run", "model": MODEL, "size": f"{MODEL_SIZE[0]}x{MODEL_SIZE[1]}",
            "source_photo_bytes": source.stat().st_size, "output_available": not background.exists(),
            "sends": "sanitized dog photo and approved place only",
            "paid_request_made": False,
        }, indent=2))
    else:
        proof = execute(args.manifest)
        print(json.dumps({k: proof[k] for k in ("status", "model", "image_call_seconds", "model_pixels", "prepared_pixels", "fulfillment_confirmed")}, indent=2))
