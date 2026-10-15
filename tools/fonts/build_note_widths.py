"""Glyph widths for the mug note's even line breaks (shopify/assets/hs3.js, evenBreak).

The mug prints its lines in HS-Fraunces-Text (this folder, the cut uploaded to Teeinblue) at
70 px in an 860 px box. hs3.js measures a line with this table to decide whether it fits one
row and where the most even break is. Widths are shaped with kerning (Pillow + raqm), in
1/1000 em, so 70 px is width * 0.07. Checked against Teeinblue's own print files on 15 Oct:
its rows render about 1% narrower than this table, so a line the table says fits, prints on
one row. "Steals your side of the bed." measures 857.5 px.

  python3 tools/fonts/build_note_widths.py          rewrites the table in hs3.js
  python3 tools/fonts/build_note_widths.py --check  exits 1 if hs3.js is out of date
"""
import json, os, re, sys
from PIL import ImageFont, features

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FONT = os.path.join(ROOT, 'tools', 'fonts', 'HS-Fraunces-Text.ttf')
JS = os.path.join(ROOT, 'shopify', 'assets', 'hs3.js')
START, END = '/* note-widths:start', '/* note-widths:end */'

assert features.check('raqm'), 'Pillow needs raqm for kerning'
f = ImageFont.truetype(FONT, 1000, layout_engine=ImageFont.Layout.RAQM)
chars = [chr(c) for c in range(32, 127)]
adv = {c: f.getlength(c) for c in chars}
kern = {}
for a in chars:
    for b in chars:
        d = round(f.getlength(a + b) - adv[a] - adv[b])
        if abs(d) >= 3:
            kern[a + b] = d
block = (START + ' (tools/fonts/build_note_widths.py, HS-Fraunces-Text, 1/1000 em; do not edit) */\n'
         '  var NOTE_ADV = [' + ','.join(str(round(adv[c])) for c in chars) + '];\n'
         '  var NOTE_KERN = ' + json.dumps(kern, separators=(',', ':'), ensure_ascii=True) + ';\n'
         '  ' + END)

src = open(JS, encoding='utf-8').read()
pat = re.compile(re.escape(START) + r'.*?' + re.escape(END), re.S)
if not pat.search(src):
    sys.exit('markers not found in hs3.js')
new = pat.sub(lambda m: block, src)
if '--check' in sys.argv:
    if new != src:
        sys.exit('hs3.js note widths are out of date: run tools/fonts/build_note_widths.py')
    print('hs3.js note widths are up to date')
else:
    open(JS, 'w', encoding='utf-8').write(new)
    print(f'hs3.js: {len(chars)} widths, {len(kern)} kerning pairs')
