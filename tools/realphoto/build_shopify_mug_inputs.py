"""Rebuild the two inputs of shopify_mug_images.py, so the Shopify mug images can be made again
from the repo alone (19 Oct; Cowork's 15 Oct render used copies that were never committed).

  1. The print file: Biscuit's sample cut-out, the three lines and "Love, Biscuit", drawn where
     Teeinblue prints them. The layout and fonts are mug_qc.py's own (calibrated on Teeinblue's
     print files), so the file passes tools/qc/mug_qc.py at 1.00; the paw is the artwork's
     background layer. The words are the ones on the live Shopify images.
  2. The shaded bases mk-outward-shaded.png and mk-drinker-shaded.png: build_mug_mockups.py makes
     them from Printful's photo, but Printful's CDN is blocked from the cloud session. So they are
     rebuilt from the committed Teeinblue mockup files: the base with its band painted white, and
     the shading overlay composited back over it.

  python3 tools/realphoto/build_shopify_mug_inputs.py      writes design/teeinblue/mug-v3/shopify-images/
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'design', 'teeinblue', 'mug-v3')
OUT = os.path.join(SRC, 'shopify-images')
sys.path.insert(0, os.path.join(ROOT, 'tools', 'qc'))
import mug_qc as q  # noqa: E402

LINES = ['Waits at the door for\nyou, weekends too.', 'Steals your side of the bed.', "Will ride anywhere, as\nlong as it's with you."]
SIGNED = 'Love, Biscuit'
INK, CHESTNUT = (18, 16, 16, 255), (138, 74, 43, 255)  # #121010 and #8A4A2B, as hs3.js draws the note


def print_file():
    im = Image.new('RGBA', (2700, 1050), (0, 0, 0, 0))
    photo = Image.open(os.path.join(SRC, 'hs3-mug-sample-biscuit.png')).convert('RGBA')
    mask = Image.open(os.path.join(SRC, 'hs3-mug-photo-mask-fade-900.png')).convert('RGBA').split()[-1]
    photo.putalpha(Image.fromarray(((q.np.asarray(photo.split()[-1]).astype(int) * q.np.asarray(mask).astype(int)) // 255).astype('uint8')))
    im.alpha_composite(photo, (q.PHOTO[0], q.PHOTO[1]))
    im.alpha_composite(Image.open(os.path.join(SRC, 'hs3-bg-mug-v2.png')).convert('RGBA'))  # the paw
    d = ImageDraw.Draw(im)
    for line, top in zip(LINES, q.LINE_TOPS):  # same rows and baselines as mug_qc.draw_rows
        rows = line.split('\n')
        for j, r in enumerate(rows):
            d.text((q.LINE_X, top + q.BOX_H / 2 + (j - (len(rows) - 1) / 2) * q.ROW + q.BASE_OFF), r, font=q.TEXT, fill=INK, anchor='ls')
    size = 96  # same size rule and baseline as mug_qc.draw_sign
    f = ImageFont.truetype(q.SIGN, size, layout_engine=ImageFont.Layout.RAQM)
    if f.getlength(SIGNED) > q.SIGN_W:
        size = 96 * q.SIGN_W / f.getlength(SIGNED)
        f = ImageFont.truetype(q.SIGN, round(size), layout_engine=ImageFont.Layout.RAQM)
    d.text((q.SIGN_X, q.SIGN_TOP + q.SIGN_H / 2 + q.SIGN_OFF * size / 96), SIGNED, font=f, fill=CHESTNUT, anchor='ls')
    return im


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    print_file().save(os.path.join(OUT, 'print-file-biscuit.png'))
    for name in ('outward', 'drinker'):
        base = Image.open(os.path.join(SRC, f'mk-{name}-base.png')).convert('RGBA')
        base.alpha_composite(Image.open(os.path.join(SRC, f'mk-{name}-shade.png')).convert('RGBA'))
        base.convert('RGB').save(os.path.join(OUT, f'mk-{name}-shaded.png'))
    print('wrote', OUT)
