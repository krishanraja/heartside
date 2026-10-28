"""Web images for the kept example art (design/examples-<date>/site.json).

Reads each kept PNG from a folder holding the branch's out/ images, resizes it to the
manifest's long side and writes shopify/assets/hs-example-<id>.webp. Records each
source's SHA-256 in the manifest so a later build can prove it used the reviewed file.
--check needs no sources: every listed asset exists at its size, and nothing else
named hs-example-* sits in shopify/assets.

  git show / checkout the examples branch's out/ PNGs into DIR, then
  python3 tools/print-art/example-assets.py DIR      (build)
  python3 tools/print-art/example-assets.py --check  (CI)
"""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / 'design' / 'examples-2026-10-28' / 'site.json'
ASSETS = ROOT / 'shopify' / 'assets'


def target(img, long_side):
    w, h = img.size
    scale = long_side / max(w, h)
    return (round(w * scale), round(h * scale))


def build(src_dir):
    manifest = json.loads(MANIFEST.read_text())
    for item in manifest['images']:
        src = Path(src_dir) / (item['id'] + '.png')
        data = src.read_bytes()
        item['source_sha256'] = hashlib.sha256(data).hexdigest()
        with Image.open(src) as im:
            im = im.convert('RGB')
            size = target(im, item['long_side'])
            out = im.resize(size, Image.LANCZOS)
            out.save(ASSETS / ('hs-example-' + item['id'] + '.webp'), 'WEBP', quality=80, method=6)
            item['size'] = list(size)
        print('wrote hs-example-%s.webp %dx%d' % (item['id'], size[0], size[1]))
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')


def check():
    manifest = json.loads(MANIFEST.read_text())
    listed = set()
    bad = []
    for item in manifest['images']:
        name = 'hs-example-' + item['id'] + '.webp'
        listed.add(name)
        path = ASSETS / name
        if not path.exists():
            bad.append('missing ' + name)
            continue
        with Image.open(path) as im:
            if list(im.size) != item.get('size') or max(im.size) != item['long_side']:
                bad.append('%s is %s, manifest says %s' % (name, im.size, item.get('size')))
        if not item.get('source_sha256'):
            bad.append(name + ' has no source hash')
    extra = sorted(p.name for p in ASSETS.glob('hs-example-*') if p.name not in listed)
    bad += ['not in the manifest: ' + n for n in extra]
    if bad:
        print('\n'.join(bad))
        sys.exit(1)
    print('ok   %d example images match %s' % (len(listed), MANIFEST.relative_to(ROOT)))


if __name__ == '__main__':
    if '--check' in sys.argv:
        check()
    elif len(sys.argv) == 2:
        build(sys.argv[1])
    else:
        print(__doc__)
        sys.exit(2)
