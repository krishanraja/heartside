"""The homepage carousel's six sets, sharp on a phone and with the real mug (Krish, 3 Nov 2026: "What's causing
the mug mockups to look so crappy on the live site?"). The 30 Oct sets pasted the painting onto an AI mug as a flat
rectangle and were served at 540 px, stretched about 1.7x on a phone. These come from
design/examples-2026-11-03-real-mug-sets/: Maple's approved real set photo, and the other five sets with each dog's
real product mug put in by tools/print-art/real_mug_sets.py (Codex card real-mug-sets-2026-11-03).

Each set is written twice, 540 and 1080 wide (4:5, WebP), as shopify/assets/hs-hero-<dog>-540.webp and
-1080.webp; the hook serves both through srcset, so a phone loads the 1080 and a small screen the 540. The manifest
(design/examples-2026-11-03-real-mug-sets/site.json) records each master's and each output's SHA-256.

  python3 tools/print-art/hero-sets.py            (build from the masters)
  python3 tools/print-art/hero-sets.py --check    (CI: sizes, hashes, byte caps, used by the theme)
"""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / 'design' / 'examples-2026-11-03-real-mug-sets'
MANIFEST = DIR / 'site.json'
ASSETS = ROOT / 'shopify' / 'assets'
WIDTHS = {540: 90_000, 1080: 230_000}  # width: byte cap


def sha(data):
    return hashlib.sha256(data).hexdigest()


def out_name(dog, w):
    return 'hs-hero-%s-%d.webp' % (dog, w)


def build():
    m = json.loads(MANIFEST.read_text())
    for s in m['sets']:
        src = ROOT / s['master']
        s['master_sha256'] = sha(src.read_bytes())
        with Image.open(src) as im:
            im = im.convert('RGB')
            if im.size != (1080, 1350):
                sys.exit('%s is %s, not 1080x1350' % (s['master'], im.size))
            s['outputs'] = {}
            for w in WIDTHS:
                out = im if w == 1080 else im.resize((w, round(w * 1.25)), Image.LANCZOS)
                dest = ASSETS / out_name(s['dog'], w)
                out.save(dest, 'WEBP', quality=82, method=6)
                data = dest.read_bytes()
                s['outputs'][str(w)] = {'file': dest.name, 'sha256': sha(data), 'bytes': len(data)}
                print('wrote %s %d KB' % (dest.name, len(data) // 1024))
    MANIFEST.write_text(json.dumps(m, indent=2, ensure_ascii=False) + '\n')


def check():
    m = json.loads(MANIFEST.read_text())
    theme = (ROOT / 'shopify' / 'sections' / 'hs-journey.liquid').read_text()
    bad = []
    if len(m['sets']) != 6:
        bad.append('the carousel has %d sets, not 6' % len(m['sets']))
    for s in m['sets']:
        if not (s.get('approval') or '').startswith('Krish, '):
            bad.append(s['dog'] + ': no approval by Krish recorded')
        if "hero: '%s'" % s['dog'] not in theme:
            bad.append(s['dog'] + ': not used by the hook')
        for w, cap in WIDTHS.items():
            o = (s.get('outputs') or {}).get(str(w))
            path = ASSETS / out_name(s['dog'], w)
            if not o or not path.exists():
                bad.append('missing ' + out_name(s['dog'], w))
                continue
            data = path.read_bytes()
            if sha(data) != o['sha256']:
                bad.append(path.name + ' changed since the build recorded it')
            if len(data) > cap:
                bad.append('%s is %d KB, the cap is %d KB' % (path.name, len(data) // 1024, cap // 1024))
            with Image.open(path) as im:
                if im.size != (w, round(w * 1.25)):
                    bad.append('%s is %s' % (path.name, im.size))
    for p in sorted(ASSETS.glob('hs-hero-*')):
        if not any(p.name == out_name(s['dog'], w) for s in m['sets'] for w in WIDTHS):
            bad.append(p.name + ' is not in the manifest')
    print('\n'.join(bad) if bad else 'ok   %d sets at %s px' % (len(m['sets']), ' and '.join(map(str, WIDTHS))))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    check() if '--check' in sys.argv else build()
