#!/usr/bin/env python3
"""Place photographed product mugs on approved clean plates using Pillow/numpy.

No scene reconstruction or generative changes. Studio shadow is removed in
cutout(); output matte is feathered inward by one pixel. Room matching uses
one exposure and one red/blue balance correction across the complete mug.
Status: clean-plate composites, deterministic checks and JPEG review sheet.
Next: Claude to review the delivered sheet before homepage publication.
North Star check (2026-11-03): holds; truthful product imagery supports conversion.
"""
import argparse
import io
from collections import deque
from functools import lru_cache
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'design/examples-2026-11-03-real-mug-sets'
BOXES = {
    'lab': [(200, 610, 425, 815)],
    'frenchie': [(200, 700, 490, 955)],
    'doodle': [(235, 610, 475, 820)],
    'dachshund': [(115, 715, 385, 965)],
    'shepherd': [(90, 555, 390, 885), (405, 550, 705, 885)],
}


def source(dog):
    return DEST / 'inputs' / f'set-{dog}-source.png'


def plate(dog):
    return DEST / 'plates' / f'set-{dog}-plate.png'


def flood(candidate, seeds):
    """Four-connected fill, including enclosed handle openings via extra seeds."""
    h, w = candidate.shape
    seen = np.zeros((h, w), bool)
    q = deque()
    for y, x in seeds:
        if candidate[y, x] and not seen[y, x]:
            seen[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for yy, xx in ((y-1,x), (y+1,x), (y,x-1), (y,x+1)):
            if 0 <= yy < h and 0 <= xx < w and candidate[yy,xx] and not seen[yy,xx]:
                seen[yy,xx] = True
                q.append((yy,xx))
    return seen


@lru_cache(maxsize=5)
def cutout(dog):
    im = Image.open(ROOT / f'design/launch-reel-2026-11-02/inputs/mug-real-{dog}.jpg').convert('RGB')
    a = np.asarray(im).astype(float)
    h, w = a.shape[:2]
    corners = np.concatenate([a[:40,:40].reshape(-1,3), a[:40,-40:].reshape(-1,3),
                              a[-40:,:40].reshape(-1,3), a[-40:,-40:].reshape(-1,3)])
    backdrop = np.median(corners, axis=0)
    distance = np.linalg.norm(a-backdrop, axis=2)
    near = distance < 24
    seeds = [(0,x) for x in range(w)] + [(h-1,x) for x in range(w)]
    seeds += [(y,0) for y in range(h)] + [(y,w-1) for y in range(h)]
    # The handle opening is enclosed by black ceramic, so also seed its plain
    # backdrop component (not the white ceramic). Coordinates are photo pixels.
    seeds.append((650,200))
    bg = flood(near, seeds)
    mask = ~bg
    # The studio shadow is connected to the mug. Recover the bottom ceramic
    # edge from the strongest vertical colour transition, then reject pixels
    # below it. These approved photos share the same studio camera/template.
    # The five approved photos use the same mug template: the lower rim is
    # an ellipse, with its centre at y=1087 and sides at y=1005. A silhouette
    # constraint excludes the attached studio shadow without cutting a flat base.
    yy, xx = np.indices((h,w))
    lower = 1005 + 82*np.sqrt(np.clip(1-((xx-662)/320)**2,0,1))
    body = (xx >= 342) & (xx <= 981)
    mask[(yy > 960) & ~body] = False
    mask[(yy >= 990) & body & (yy <= lower)] = True
    mask[yy > lower] = False
    base = 1087
    # Keep only the component connected to the painting, rejecting stray shadow.
    mask = flood(mask, [(600,600)])
    alpha = Image.fromarray((mask*255).astype('uint8'))
    rgba = im.convert('RGBA'); rgba.putalpha(alpha)
    bounds = alpha.getbbox()
    print(f'{dog}: threshold 24; studio base {base}; handle LEFT retained (painting not mirrored)')
    return rgba.crop(bounds), bounds


def grown(box, pad=60):
    l,t,r,b = box
    return max(0,l-pad), max(0,t-pad), min(1080,r+pad), min(1350,b+pad)


def positioned(dog, box, product=None):
    mug, bounds = product if product is not None else cutout(dog)
    l,t,r,b = box
    # Shared photographed template: rim y=252, lowest ceramic y=1087.
    scale = .92*(b-t)/(1087-252)
    size = (round(mug.width*scale), round(mug.height*scale))
    m = mug.resize(size, Image.Resampling.LANCZOS)
    # Feather inward, excluding studio background from the antialias fringe.
    alpha = m.getchannel('A').filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))
    m.putalpha(alpha)
    x = round((l+r-size[0])/2)
    y = round(b - (1087-bounds[1])*scale)
    return m, x, y, 640*scale


def room_target(original, box):
    a = np.asarray(original, dtype=float)
    l,t,r,b = box
    samples = np.concatenate((a[t:b,max(0,l-40):l-8].reshape(-1,3),
                              a[t:b,r+8:min(1080,r+40)].reshape(-1,3)))
    return np.mean(samples, axis=0)


def match_room(m, target):
    a = np.asarray(m, dtype=float).copy()
    opaque = a[:,:,3] > 240
    rgb = a[:,:,:3]
    lum = np.array([.2126,.7152,.0722])
    # Iteration compensates for clipping, using the same gains at every pixel.
    for _ in range(30):
        mean = rgb[opaque].mean(axis=0)
        exposure = (target@lum)/(mean@lum)
        balance = np.sqrt((target[0]/target[2])/(mean[0]/mean[2]))
        rgb = np.clip(rgb*exposure*np.array([balance,1,1/balance]),0,255)
    mean = rgb[opaque].mean(axis=0)
    if abs((mean@lum)/(target@lum)-1) > .06 or abs((mean[0]/mean[2])/(target[0]/target[2])-1) > .06:
        raise ValueError('Room luminance/warmth matching failed')
    a[:,:,:3] = rgb
    return Image.fromarray(a.astype('uint8'), 'RGBA')


def place(canvas, original, dog, product, box):
    m,x,y,base = positioned(dog,box,product)
    m = match_room(m, room_target(original,box))
    cx, bottom = x+(662-product[1][0])*base/640, box[3]
    for opacity, blur, dx, width, height in ((.15,30,base*.25,base*1.4,base*.18),
                                            (.40,14,0,base*1.05,base*.12)):
        shadow = Image.new('L',canvas.size)
        ImageDraw.Draw(shadow).ellipse((cx+dx-width/2,bottom-height/2,
                                       cx+dx+width/2,bottom+height/2),fill=round(255*opacity))
        shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
        canvas.paste((0,0,0),(0,0,canvas.width,canvas.height),shadow)
    canvas.paste(m,(x,y),m)


def edge_ring(dog, boxes):
    silhouette = Image.new('L',(1080,1350))
    for box in boxes:
        m,x,y,_ = positioned(dog,box)
        core = m.getchannel('A').point(lambda a: 255 if a>=128 else 0)
        silhouette.paste(core,(x,y),core)
    core = np.asarray(silhouette)>0
    outer = np.asarray(silhouette.filter(ImageFilter.MaxFilter(7)))>0
    return outer & ~core


def save_composite(new, clean, dog, boxes, path):
    # Enforce the halo limit on decoded quality-92 JPEG bytes. This touches
    # only the three-pixel exterior fringe, never the product interior.
    ring = edge_ring(dog, boxes)
    pixels = np.asarray(new,dtype=float).copy()
    backdrop = np.asarray(clean,dtype=float)
    lum = np.array([.2126,.7152,.0722])
    for _ in range(20):
        stream = io.BytesIO()
        Image.fromarray(np.uint8(np.clip(pixels,0,255))).save(stream,format='JPEG',quality=92,subsampling=0)
        decoded = np.asarray(Image.open(io.BytesIO(stream.getvalue())),dtype=float)
        excess = (decoded-backdrop)@lum
        bad = ring & (excess > 10)
        if not bad.any():
            path.write_bytes(stream.getvalue())
            return
        pixels[bad] -= (excess[bad]-6)[:,None]
    raise ValueError(f'{dog}: could not encode halo-safe JPEG')


def build(out):
    out.mkdir(parents=True,exist_ok=True)
    rows=[]
    for dog, boxes in BOXES.items():
        old=Image.open(source(dog)).convert('RGB')
        if old.size != (1080,1350):
            raise ValueError(f'{dog}: wrong source dimensions')
        mug=cutout(dog)
        clean=Image.open(plate(dog)).convert('RGB')
        if clean.size != (1080,1350): raise ValueError(f'{dog}: wrong plate size')
        new=clean.copy()
        for box in boxes:
            place(new,clean,dog,mug,box)
        allowed=Image.new('L',old.size)
        for box in boxes:
            ImageDraw.Draw(allowed).rectangle(grown(box),fill=255)
        new=Image.composite(new,clean,allowed)
        save_composite(new,clean,dog,boxes,out/f'set-{dog}.jpg')
        # Review the actual delivered JPEG, not the uncompressed working image.
        new=Image.open(out/f'set-{dog}.jpg').convert('RGB')
        row=Image.new('RGB',(2700,1600 if len(boxes)>1 else 850),(245,241,235))
        draw=ImageDraw.Draw(row)
        draw.text((12,8),f'{dog.upper()} | OLD / REAL PRODUCT | mug details OLD / REAL (2x)',fill='black')
        row.paste(old.resize((540,675)),(0,40)); row.paste(new.resize((540,675)),(540,40))
        # Include both shepherd mugs in the close-up rather than hiding one.
        for i,box in enumerate(boxes):
            crop=grown(box,12)
            for j,im in enumerate((old,new)):
                detail=im.crop(crop).resize(((crop[2]-crop[0])*2,(crop[3]-crop[1])*2))
                if len(boxes)==1:
                    row.paste(detail,(1080+j*800,60))
                else:
                    row.paste(detail,(1080+j*800,40+i*780))
        rows.append(row)
    sheet=Image.new('RGB',(2700,sum(row.height for row in rows)))
    offset=0
    for row in rows:
        sheet.paste(row,(0,offset))
        offset += row.height
    sheet.save(out/'sheet.jpg',quality=92,subsampling=0)


def check(out):
    failures=[]
    for dog,boxes in BOXES.items():
        p=out/f'set-{dog}.jpg'
        if not p.exists(): failures.append(f'{dog}: missing'); continue
        with Image.open(p) as im:
            if im.size!=(1080,1350) or im.mode!='RGB':
                failures.append(f'{dog}: dimensions/mode'); continue
            delta=np.abs(np.asarray(im).astype(float)-np.asarray(Image.open(plate(dog)).convert('RGB')).astype(float)).mean(axis=2)
        outside=np.ones(delta.shape,bool)
        for box in boxes:
            l,t,r,b=grown(box);outside[t:b+1,l:r+1]=False
            l,t,r,b=box
            inside=float(delta[t:b,l:r].mean())
            print(f'{dog} {box}: inside MAD {inside:.3f}')
            if inside<=10: failures.append(f'{dog}: unchanged box {box}')
        ring = edge_ring(dog, boxes)
        delivered = np.asarray(Image.open(p).convert('RGB'), dtype=float)
        clean = np.asarray(Image.open(plate(dog)).convert('RGB'), dtype=float)
        excess = (delivered-clean) @ np.array([.2126,.7152,.0722])
        halo = float(excess[ring].max())
        print(f'{dog}: maximum halo luminance excess {halo:.3f}')
        if halo > 12: failures.append(f'{dog}: halo exceeds 12')
        error=float(delta[outside].mean())
        print(f'{dog}: outside MAD {error:.3f}')
        if error>=2: failures.append(f'{dog}: outside MAD >= 2')
    if not (out/'sheet.jpg').is_file(): failures.append('missing sheet')
    if failures: raise SystemExit('\n'.join(failures))
    print('PASS: five RGB JPEGs, every replacement, outside bounds, review sheet')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--out',type=Path)
    group.add_argument('--check',type=Path)
    args=parser.parse_args()
    if args.out: build(args.out)
    else: check(args.check)
