"""Order QC for The Morning Mug: check an order's real Teeinblue print file before it prints.

Deterministic, no AI and no OCR. The mug's layout is known to the pixel (Cowork's mug v3 spec,
calibrated against Teeinblue's own print files on 15 Oct), so the check draws what the order's
words should look like and compares that ink with the print file:

  file      the print file is 2700 x 1050 with a transparent background, and not blank
  words     each Line field's words are on the print (every way Teeinblue could break the line is
            tried; the best match must reach the limit), and so is "Love, [dog]"
  breaks    a line Teeinblue broke leaves more than one word on its second row
  inside    no ink outside the note's boxes on the drinker's face
  photo     the photo is there, its background came off (a cut-out, not a rectangle), and the
            dog isn't cut off at the edge of the photo area

Then it wraps the print file onto Printful's photo of the mug, both faces, for the person who
confirms the order (golden_reveal_mug.py), and writes a card with the verdict.

  python3 tools/qc/mug_qc.py print.png out_dir --line1 "..." --line2 "..." --line3 "..." --signed "Love, Biscuit"
  (print.png can be the order's _tib_design_link_1 URL.) Exit 0 pass, 1 hold.
"""
import argparse, io, json, os, sys, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'realphoto'))
from golden_reveal_mug import golden  # noqa: E402

TEXT = ImageFont.truetype(os.path.join(ROOT, 'tools', 'fonts', 'HS-Fraunces-Text.ttf'), 70, layout_engine=ImageFont.Layout.RAQM)
SIGN = os.path.join(ROOT, 'tools', 'fonts', 'HS-Fraunces-Italic.ttf')
LINE_TOPS, LINE_X, BOX_W, BOX_H, ROW, BASE_OFF = (130, 345, 560), 1685, 860, 190, 84, 26
SIGN_X, SIGN_TOP, SIGN_W, SIGN_H, SIGN_OFF = 1774, 790, 775, 130, 34  # Teeinblue sets "Love," 4 px into its 1770 box
NOTE = (1660, 100, 2600, 940)          # everything on the drinker's face sits in here
PHOTO = (135, 50, 1035, 1050)          # the photo layer, 900 x 1000
WORDS_MIN = 0.85                       # ink match for "these words are on the print"


def load(src):
    if src.startswith('http'):
        with urllib.request.urlopen(src, timeout=60) as r:
            return Image.open(io.BytesIO(r.read()))
    return Image.open(src)


def ink(a):
    """dark or chestnut ink on the note: opaque and not near white"""
    return (a[..., 3] > 100) & (a[..., :3].mean(-1) < 170)


def dilate(m, r):
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out |= np.roll(np.roll(m, dy, 0), dx, 1)
    return out


def f1(expect, got, r=4):
    """ink match within r px, both ways"""
    if not expect.any() and not got.any():
        return 1.0
    p = (got & dilate(expect, r)).sum() / max(got.sum(), 1)
    q = (expect & dilate(got, r)).sum() / max(expect.sum(), 1)
    return 0.0 if p + q == 0 else 2 * p * q / (p + q)


def draw_rows(rows, top):
    im = Image.new('L', (2700, 1050), 0)
    d = ImageDraw.Draw(im)
    for j, r in enumerate(rows):
        d.text((LINE_X, top + BOX_H / 2 + (j - (len(rows) - 1) / 2) * ROW + BASE_OFF), r, font=TEXT, fill=255, anchor='ls')
    return np.asarray(im) > 100


def draw_sign(text):
    size = 96
    f = ImageFont.truetype(SIGN, size, layout_engine=ImageFont.Layout.RAQM)
    w = f.getlength(text)
    if w > SIGN_W:
        size = 96 * SIGN_W / w
        f = ImageFont.truetype(SIGN, round(size), layout_engine=ImageFont.Layout.RAQM)
    im = Image.new('L', (2700, 1050), 0)
    ImageDraw.Draw(im).text((SIGN_X, SIGN_TOP + SIGN_H / 2 + SIGN_OFF * size / 96), text, font=f, fill=255, anchor='ls')
    return np.asarray(im) > 100


def best_rows(line, got, top):
    """every way the line could sit in its box: one row, or broken at any space"""
    line = ' '.join(str(line).replace('\\n', '\n').split())  # Teeinblue keeps a typed break; a space stands in for it here
    words = line.split(' ')
    cands = [[line]] + [[' '.join(words[:i]), ' '.join(words[i:])] for i in range(1, len(words))]
    region = np.zeros_like(got); region[top - 20:top + BOX_H + 20, NOTE[0]:NOTE[2]] = True
    scored = [(f1(draw_rows(c, top) & region, got & region), c) for c in cands]
    return max(scored, key=lambda s: s[0])


def check(print_src, lines, signed):
    res = {'checks': [], 'verdict': 'pass'}
    def add(name, ok, detail, hold=True):
        res['checks'].append({'check': name, 'ok': bool(ok), 'detail': detail})
        if not ok and hold:
            res['verdict'] = 'hold'
    im = load(print_src)
    a = np.asarray(im.convert('RGBA')).astype(int)
    add('file', im.size == (2700, 1050) and im.mode in ('RGBA', 'LA', 'P'), f'{im.size[0]} x {im.size[1]} {im.mode}')
    got = ink(a)
    note = np.zeros_like(got); note[NOTE[1]:NOTE[3], NOTE[0]:NOTE[2]] = True
    add('not blank', got[note].sum() > 2000, f'{int(got[note].sum())} ink pixels on the note')
    words_ok, orphan = True, []
    for i, (line, top) in enumerate(zip(lines, LINE_TOPS), 1):
        score, rows = best_rows(line, got, top)
        words_ok &= score >= WORDS_MIN
        add(f'line {i} words', score >= WORDS_MIN, f'"{" / ".join(rows)}" matches the print at {score:.2f}')
        if len(rows) == 2 and len(rows[1].split(' ')) == 1:
            orphan.append(f'line {i} leaves "{rows[1]}" alone')
    add('breaks', not orphan, '; '.join(orphan) or 'no line leaves one word alone', hold=False)
    sig_region = np.zeros_like(got); sig_region[SIGN_TOP - 20:SIGN_TOP + SIGN_H + 20, SIGN_X - 20:NOTE[2]] = True
    s = f1(draw_sign(signed) & sig_region, got & sig_region)
    add('signature', s >= WORDS_MIN, f'"{signed}" matches the print at {s:.2f}')
    face = np.zeros_like(got); face[:, 1500:] = True
    stray = got & face & ~note
    add('inside', stray.sum() < 50, f'{int(stray.sum())} ink pixels outside the note')
    al = a[PHOTO[1]:PHOTO[3], PHOTO[0]:PHOTO[2], 3] > 128
    cover = al.mean()
    if cover < 0.02:
        add('photo', False, 'no photo on the dog face')
    else:
        ys, xs = np.where(al)
        box = (ys.max() - ys.min() + 1) * (xs.max() - xs.min() + 1)
        fill = al.sum() / box
        add('photo cut out', fill < 0.95, f'the photo fills {fill:.0%} of its own outline (a rectangle, background still on, is 95% or more)')
        h, w = al.shape
        edges = {'top': al[0, :].mean(), 'left': al[:, 0].mean(), 'right': al[:, w - 1].mean()}
        cut = [k for k, v in edges.items() if v > 0.25]  # a quarter of an edge: the photo itself cut the dog off
        add('photo whole', not cut, ('the dog touches the ' + ', '.join(cut) + ' of the photo area') if cut else 'the dog sits inside the photo area', hold=False)
    return res, im


def card(im, res, out):
    faces = [golden(im, 'dog'), golden(im, 'note')]
    board = Image.new('RGB', (1300, 549 + 60 + 26 * len(res['checks'])), (246, 241, 235))
    for i, f in enumerate(faces):
        board.paste(f, (10 + i * 650, 10))
    d = ImageDraw.Draw(board)
    font = ImageFont.truetype(os.path.join(ROOT, 'tools', 'fonts', 'DMSans-Regular.ttf'), 20)
    y = 569
    d.text((10, y), 'PASS' if res['verdict'] == 'pass' else 'HOLD: do not confirm until fixed', font=font, fill=(30, 120, 60) if res['verdict'] == 'pass' else (170, 30, 40))
    for c in res['checks']:
        y += 26
        d.text((10, y), ('ok    ' if c['ok'] else 'FAIL  ') + c['check'] + ': ' + c['detail'], font=font, fill=(40, 36, 32))
    board.save(os.path.join(out, 'card.png'))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('print'); ap.add_argument('out')
    ap.add_argument('--line1', required=True); ap.add_argument('--line2', required=True); ap.add_argument('--line3', required=True)
    ap.add_argument('--signed', required=True)
    o = ap.parse_args()
    os.makedirs(o.out, exist_ok=True)
    res, im = check(o.print, [o.line1, o.line2, o.line3], o.signed)
    card(im, res, o.out)
    json.dump(res, open(os.path.join(o.out, 'report.json'), 'w'), indent=1)
    print(res['verdict'].upper())
    for c in res['checks']:
        print(('  ok   ' if c['ok'] else '  FAIL ') + c['check'] + ': ' + c['detail'])
    sys.exit(0 if res['verdict'] == 'pass' else 1)
