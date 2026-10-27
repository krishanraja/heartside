"""Offline contract for a single paid-order image edit and handoff to print layout."""

import base64
import io
import json
import tempfile
from pathlib import Path

from PIL import Image

from build import build
from generate import MODEL_SIZE, execute, plan


class Response:
    def __init__(self, encoded):
        self.data = [type("ImageData", (), {"b64_json": encoded})()]
        self.usage = None


class Images:
    def __init__(self, encoded):
        self.encoded = encoded
        self.calls = []

    def edit(self, **kwargs):
        self.calls.append(kwargs)
        return Response(self.encoded)


with tempfile.TemporaryDirectory() as folder:
    root = Path(folder)
    source = root / "dog.jpg"
    background = root / "background.png"
    manifest = root / "order.json"
    output = root / "print.png"
    Image.new("RGB", (800, 800), (130, 90, 50)).save(source)
    order = {
        "mode": "test", "style": "city-screenprint-v1",
        "source_photo": str(source), "background": str(background),
        "dog_name": "Milo", "place_source": "buyer", "place": "Brooklyn",
        "lines": {
            "home": "I wait by the door until I hear you.",
            "spot": "Your side of the couch is where I belong.",
            "together": "Our walks always run a little long.",
            "meaning": "I'd choose you every time.",
        },
    }
    manifest.write_text(json.dumps(order), encoding="utf-8")
    assert plan(manifest)[2] == background
    raw = io.BytesIO()
    Image.new("RGB", MODEL_SIZE, (40, 80, 110)).save(raw, format="PNG")
    client = type("Client", (), {"images": Images(base64.b64encode(raw.getvalue()).decode())})()
    proof = execute(manifest, client)
    assert len(client.images.calls) == 1
    call = client.images.calls[0]
    assert call["size"] == "2336x3504"
    assert "Brooklyn" in call["prompt"]
    assert "I wait by the door" not in call["prompt"]
    assert call["image"].name == "dog-reference.jpg"
    assert proof["upscale_factor"] > 1.5
    assert proof["fulfillment_confirmed"] is False
    assert background.exists() and background.with_name("background.model.png").exists()
    assert not background.with_name("background.pending.json").exists()
    print_proof = build(manifest, output)
    assert print_proof["status"] == "test_only"
    assert output.exists()
    try:
        plan(manifest)
    except FileExistsError:
        pass
    else:
        raise AssertionError("A second call must not overwrite or re-charge the order")
    order["background"] = str(root / "failed-background.png")
    manifest.write_text(json.dumps(order), encoding="utf-8")
    class FailedImages:
        def edit(self, **kwargs):
            raise TimeoutError("unknown provider outcome")
    failed_client = type("Client", (), {"images": FailedImages()})()
    try:
        execute(manifest, failed_client)
    except TimeoutError:
        pass
    else:
        raise AssertionError("Expected the simulated timeout")
    assert (root / "failed-background.pending.json").exists()
    try:
        plan(manifest)
    except FileExistsError:
        pass
    else:
        raise AssertionError("An ambiguous charged call must block automatic retry")
    print("order image edit and 300 DPI print handoff passed without an API call")
