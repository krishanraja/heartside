"""Tests for mug_qc.py: Teeinblue's real print files pass, and broken prints are caught.

  python3 tools/qc/test_mug_qc.py
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import mug_qc as q  # noqa: E402

E = os.path.join(ROOT, 'docs', 'evidence', 'cowork-2026-10-15', 'mug')
OUT = os.path.join(ROOT, 'tools', 'preview', 'out', 'qc-test')
os.makedirs(OUT, exist_ok=True)
EVEN = (['Naps best when\nyou are there.', 'Guards your slippers\non the bottom stair.', 'Your best friend,\nno contest.'], 'Love, Biscuit')
fails = 0


def run(name, src, lines, signed, want_verdict, want_failed=()):
    global fails
    res, _ = q.check(src, lines, signed)
    failed = {c['check'] for c in res['checks'] if not c['ok']}
    ok = res['verdict'] == want_verdict and set(want_failed) <= failed
    print(('ok   ' if ok else 'FAIL ') + f'{name}: {res["verdict"]}' + (f' ({", ".join(sorted(failed))})' if failed else ''))
    fails += not ok


def broken(fn):
    im = Image.open(os.path.join(E, 'print-file-even-line-breaks.png')).convert('RGBA')
    fn(im)
    path = os.path.join(OUT, fn.__name__ + '.png')
    im.save(path)
    return path


def clear(im, box):
    im.paste((0, 0, 0, 0), box)


def line_missing(im): clear(im, (1600, 345, 2700, 540))
def no_photo(im): clear(im, (0, 0, 1500, 1050))
def background_left_on(im):
    clear(im, (0, 0, 1500, 1050))
    p = Image.open(os.path.join(ROOT, 'shopify', 'assets', 'hs-photo-bed-1200.webp')).convert('RGBA')
    p.thumbnail((900, 1000))
    im.paste(p, (135 + (900 - p.width) // 2, 50 + (1000 - p.height) // 2))
def lone_word(im):
    clear(im, (1600, 120, 2700, 330))
    m = Image.fromarray((q.draw_rows(['Naps best when you are', 'there.'], 130) * 255).astype(np.uint8))
    im.paste((18, 16, 16, 255), (0, 0), m)
def spills_over(im):
    m = Image.fromarray((q.draw_rows(['Steals your side of the bed, then the duvet, then the lot.'], 345) * 255).astype(np.uint8))
    clear(im, (1600, 335, 2700, 545))
    im.paste((18, 16, 16, 255), (0, 0), m)


run('even line breaks (real print)', os.path.join(E, 'print-file-even-line-breaks.png'), *EVEN, 'pass')
run('longest lines (real print)', os.path.join(E, 'print-file-long-lines.png'),
    ['Waits at the door for you, every single day.', 'Steals your side of the bed, then the duvet.', "Will ride anywhere, as long as it's with you."], 'Love, Bartholomew Jr', 'pass')
run('shortest lines (real print)', os.path.join(E, 'print-file-short-lines.png'), ['Waits for you.', 'Steals the bed.', 'Yours, always.'], 'Love, Bo', 'pass')
run('a line missing from the print', broken(line_missing), *EVEN, 'hold', ['line 2 words'])
run('no photo', broken(no_photo), *EVEN, 'hold', ['photo'])
run('background not removed', broken(background_left_on), *EVEN, 'hold', ['photo cut out'])
run('one word alone on a row (warning, not a hold)', broken(lone_word), ['Naps best when you are there.'] + EVEN[0][1:], EVEN[1], 'pass', ['breaks'])
run('text past its box', broken(spills_over), [EVEN[0][0], 'Steals your side of the bed.', EVEN[0][2]], EVEN[1], 'hold', ['inside'])
run('wrong name on the signature', os.path.join(E, 'print-file-even-line-breaks.png'), EVEN[0], 'Love, Bartholomew', 'hold', ['signature'])
print(f'{fails} FAILED' if fails else 'all passed')
sys.exit(1 if fails else 0)
