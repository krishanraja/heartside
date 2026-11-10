"""Build the brand-v5 icon set from Krish's dachshund-with-a-letter tile (10 Nov 2026).

Ruling (Krish, 2026-11-10): the dachshund with the heart letter is the header icon and the favicon.

    python3 tools/build_icon_v5.py

Reads design/brand-v5/dachshund-letter-source.png (1254 px, opaque) and writes, beside it, the tab sizes
(16, 32, 48), favicon.ico, the touch icon (180), the manifest sizes (192, 512), icon-1024 and the header
logo (header-logo.png, 256 px). Every file is a plain area resample of the whole tile: the raspberry ground
fills the square, so nothing needs padding, and nothing is redrawn or recoloured. The four shopify/assets
copies (hs-favicon-*.png) are byte copies. Two runs give the same bytes.
"""
import hashlib
import shutil
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'design/brand-v5'
SRC = OUT / 'dachshund-letter-source.png'
ASSETS = ROOT / 'shopify/assets'


def size(img, n):
    out = img.resize((n, n), Image.Resampling.BOX if n <= 64 else Image.Resampling.LANCZOS)
    if n <= 48:  # a light sharpen keeps the eyes and the letter's line at tab size
        out = out.filter(ImageFilter.UnsharpMask(radius=1, percent=40, threshold=0))
    return out


def save(img, path):
    img.save(path, 'PNG', optimize=True)
    print(f'{path.relative_to(ROOT)}  {img.size[0]} px  {hashlib.sha256(path.read_bytes()).hexdigest()[:12]}')


def main():
    src = Image.open(SRC).convert('RGB')
    for n in (16, 32, 48, 180, 192, 512, 1024):
        save(size(src, n), OUT / (f'icon-{n}.png' if n == 1024 else f'favicon-{n}.png'))
    save(size(src, 256), OUT / 'header-logo.png')
    ico = OUT / 'favicon.ico'
    size(src, 48).save(ico, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f'{ico.relative_to(ROOT)}  16, 32, 48 px')
    for n in (16, 32, 48, 180, 192, 512):
        shutil.copyfile(OUT / f'favicon-{n}.png', ASSETS / f'hs-favicon-{n}.png')
    shutil.copyfile(OUT / 'header-logo.png', ASSETS / 'hs-icon.png')


if __name__ == '__main__':
    main()
