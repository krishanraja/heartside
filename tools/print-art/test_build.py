"""Safety and output checks for the print compositor, using synthetic images."""

import json
import tempfile
from pathlib import Path

from PIL import Image

from build import build


def expect_failure(manifest, output, fragment):
    try:
        build(manifest, output)
    except ValueError as exc:
        assert fragment in str(exc), str(exc)
    else:
        raise AssertionError(f"Expected rejection: {fragment}")


with tempfile.TemporaryDirectory() as folder:
    root = Path(folder)
    photo = root / "dog.png"
    bg = root / "scene.png"
    manifest = root / "order.json"
    output = root / "print.png"
    Image.new("RGB", (800, 800), (200, 140, 80)).save(photo)
    Image.new("RGB", (1024, 1536), (220, 170, 110)).save(bg)
    order = {
        "mode": "test", "style": "city-screenprint-v1",
        "source_photo": str(photo), "background": str(bg),
        "dog_name": "Milo", "place_source": "none", "place": "",
        "lines": {
            "home": "I wait by the door until I hear you.",
            "spot": "Your side of the couch is where I belong.",
            "together": "Our walks always run a little long.",
            "meaning": "I'd choose you every time.",
        },
    }
    manifest.write_text(json.dumps(order), encoding="utf-8")
    expect_failure(manifest, output, "below the 300 DPI")
    Image.new("RGB", (3600, 5400), (220, 170, 110)).save(bg)
    order["place_source"] = "none"
    order["place"] = "Brooklyn"
    manifest.write_text(json.dumps(order), encoding="utf-8")
    expect_failure(manifest, output, "Omitted place")
    order["place_source"] = "buyer"
    order["mode"] = "production"
    manifest.write_text(json.dumps(order), encoding="utf-8")
    expect_failure(manifest, output, "named person")
    order["mode"] = "test"
    manifest.write_text(json.dumps(order), encoding="utf-8")
    proof = build(manifest, output)
    with Image.open(output) as image:
        assert image.size == (3600, 5400)
        assert image.info.get("dpi") == (299.9994, 299.9994)
        assert image.getpixel((3500, 5000)) == (255, 247, 224)
        assert image.getpixel((3270, 5250)) != (255, 247, 224)
    assert proof["status"] == "test_only"
    assert proof["fulfillment_confirmed"] is False
    assert proof["source_photo_sha256"] != proof["background_sha256"]
    assert json.loads(output.with_suffix(".proof.json").read_text())["print_file_sha256"] == proof["print_file_sha256"]
    print("print-art safety and 300 DPI output passed")
