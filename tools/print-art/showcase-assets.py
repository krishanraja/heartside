"""Web images for the approved breed examples (design/examples-2026-10-30-showcase/site.json).

Reads the example set from krishanraja/growth-heartside (assets/heartside-examples-2026-10-29)
and writes shopify/assets/hs-ex-<id>.webp. Only a job the growth repository's approvals ledger
marks "approved" is used, and its painting must still match the ledger's sha256. A bundle shot
must match the ledger's hash for that file. Each source's SHA-256 and each output's SHA-256 are
written into the manifest, so a later build can prove which approved file it came from.

  python3 tools/print-art/showcase-assets.py SET_DIR   (build; SET_DIR is the example folder,
                                                        its ledger sits beside it)
  python3 tools/print-art/showcase-assets.py --check   (CI; needs no sources)

--check proves: every listed asset exists at its size and hash, nothing else named hs-ex-* sits
in shopify/assets, the retired hs-example-* images are gone, and every listed image is used by
the theme.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / 'design' / 'examples-2026-10-30-showcase' / 'site.json'
ASSETS = ROOT / 'shopify' / 'assets'
SECTIONS = ROOT / 'shopify' / 'sections'
MAX_BYTES = 90_000  # one image never costs a phone more than this


def sha(data):
    return hashlib.sha256(data).hexdigest()


def fit(im, size, cover):
    """Resize to size; a photo is cropped to the frame (top-weighted so heads stay in)."""
    w, h = im.size
    tw, th = size
    if cover:
        scale = max(tw / w, th / h)
        r = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        left = (r.width - tw) // 2
        top = round((r.height - th) * 0.25)
        return r.crop((left, top, left + tw, top + th))
    return im.resize((tw, th), Image.LANCZOS)


def ledger_for(set_dir):
    path = Path(set_dir).parent / 'heartside-examples-2026-10-29.approvals.json'
    return json.loads(path.read_text())


def approve(item, set_dir, ledger):
    """Return the ledger's reason this file may be used, or exit."""
    job = item['job']
    if job.startswith('bundle:'):
        dog = job.split(':')[1]
        entry = next((b for b in ledger['bundles'] if b['dog'] == dog and b['status'] == 'approved'), None)
        rel = item['src']
        match = entry and next((f for f in entry['files'] if f['file'] == rel), None)
        if not match:
            sys.exit('%s: bundle %s is not approved in the ledger' % (item['id'], rel))
        if sha((Path(set_dir) / rel).read_bytes()) != match['sha256']:
            sys.exit('%s: %s does not match the ledger hash' % (item['id'], rel))
        return 'bundle %s approved %s' % (dog, entry['decided'])
    entry = next((p for p in ledger['paintings'] if p['job'] == job and p['status'] == 'approved'), None)
    if not entry:
        sys.exit('%s: job %s is not approved in the ledger' % (item['id'], job))
    painting = Path(set_dir) / 'paintings' / (job + '.png')
    if sha(painting.read_bytes()) != entry['sha256']:
        sys.exit('%s: painting %s does not match the ledger hash' % (item['id'], job))
    return 'job %s approved %s' % (job, entry['decided'])


def build(set_dir):
    manifest = json.loads(MANIFEST.read_text())
    ledger = ledger_for(set_dir)
    for item in manifest['images']:
        item['approval'] = approve(item, set_dir, ledger)
        src = Path(set_dir) / item['src']
        data = src.read_bytes()
        item['source_sha256'] = sha(data)
        with Image.open(src) as im:
            out = fit(im.convert('RGB'), tuple(item['size']), item.get('cover'))
        dest = ASSETS / ('hs-ex-' + item['id'] + '.webp')
        out.save(dest, 'WEBP', quality=78, method=6)
        item['output_sha256'] = sha(dest.read_bytes())
        item['bytes'] = dest.stat().st_size
        print('wrote %s %dx%d %d KB' % (dest.name, out.width, out.height, item['bytes'] // 1024))
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')


def check():
    manifest = json.loads(MANIFEST.read_text())
    bad, listed = [], set()
    theme = ''.join(p.read_text() for p in SECTIONS.glob('*.liquid'))
    theme += ''.join(p.read_text() for p in (ROOT / 'shopify' / 'templates').glob('*') if p.is_file())
    for item in manifest['images']:
        name = 'hs-ex-' + item['id'] + '.webp'
        listed.add(name)
        path = ASSETS / name
        if not path.exists():
            bad.append('missing ' + name)
            continue
        data = path.read_bytes()
        with Image.open(path) as im:
            if list(im.size) != item['size']:
                bad.append('%s is %s, manifest says %s' % (name, list(im.size), item['size']))
        if sha(data) != item.get('output_sha256'):
            bad.append(name + ' changed since the build recorded it')
        if len(data) > MAX_BYTES:
            bad.append('%s is %d KB, the cap is %d KB' % (name, len(data) // 1024, MAX_BYTES // 1024))
        if not re.fullmatch(r'[a-f0-9]{64}', item.get('source_sha256') or ''):
            bad.append(name + ' has no source hash')
        if not (item.get('approval') or '').startswith(('job ', 'bundle ')):
            bad.append(name + ' has no ledger approval recorded')
        if "'" + name + "'" not in theme and "id: '" + item['id'] + "'" not in theme:
            bad.append(name + ' is not used by the theme')
    for p in sorted(ASSETS.glob('hs-ex-*')):
        if p.name not in listed:
            bad.append('not in the manifest: ' + p.name)
    for p in sorted(ASSETS.glob('hs-example-*')):
        bad.append('retired pug example still present: ' + p.name)
    if bad:
        print('\n'.join(bad))
        sys.exit(1)
    print('ok   %d showcase images match %s' % (len(listed), MANIFEST.relative_to(ROOT)))


if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == '--check':
        check()
    elif len(sys.argv) == 2:
        build(sys.argv[1])
    else:
        sys.exit(__doc__)
