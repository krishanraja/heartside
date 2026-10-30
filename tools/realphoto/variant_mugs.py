"""One studio picture per mug colour, from one approved painting (live audit, 30 Oct: four of the five mug
colours showed the black mug). No generation: the painting is wrapped onto Printful's own photo of each
colour (design/teeinblue/mug-v3: the pink base, and colors/ made by recolor_mug.py) with the shading layer
on top, by the same cylindrical wrap as shopify_mug_images.py.

  python3 tools/realphoto/variant_mugs.py <painting.png> <out_dir> [--left 0.5]

The painting is fitted to the print file's height (2700x1050, as Teeinblue's photo layer does) and centred
on the outward face. Writes <out_dir>/mug-<colour>.jpg (2048 px) for black, dark-blue, dark-green, pink, red.
"""
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shopify_mug_images as smi

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'design', 'teeinblue', 'mug-v3')
COLOURS = {'pink': 'mk-outward-base.png', 'black': 'colors/mk-outward-base-black.png', 'dark-blue': 'colors/mk-outward-base-dark-blue.png',
           'dark-green': 'colors/mk-outward-base-dark-green.png', 'red': 'colors/mk-outward-base-red.png'}
W, H = 2700, 1050
OUTWARD_CENTRE = 585  # the outward face's centre in the print file (shopify_mug_images.wrap)


def print_file(painting):
    p = painting.convert('RGBA')
    w = round(p.width * H / p.height)
    p = p.resize((w, H), Image.LANCZOS)
    sheet = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    x = max(0, min(W - w, OUTWARD_CENTRE - w // 2))
    sheet.alpha_composite(p, (x, 0))
    return sheet


def shaded(base_file):
    base = Image.open(os.path.join(ROOT, base_file)).convert('RGBA')
    shade = Image.open(os.path.join(ROOT, 'mk-outward-shade.png')).convert('RGBA')
    base.alpha_composite(shade)
    return base.convert('RGB')


def main():
    painting, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    sheet = print_file(Image.open(painting))
    tmp = os.path.join(out, '.bases'); os.makedirs(tmp, exist_ok=True)
    for name, f in COLOURS.items():
        # shopify_mug_images.wrap reads mk-outward-shaded.png from its folder M: point it at this colour
        shaded(f).save(os.path.join(tmp, 'mk-outward-shaded.png'))
        smi.M = tmp
        smi.wrap(sheet, 'outward').convert('RGB').save(os.path.join(out, f'mug-{name}.jpg'), quality=90)
        print('wrote', f'mug-{name}.jpg')


if __name__ == '__main__':
    main()
