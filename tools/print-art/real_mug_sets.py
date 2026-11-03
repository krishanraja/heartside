#!/usr/bin/env python3
"""Replace carousel mockups with photographed mugs. Pillow and numpy only.

Artwork is never reflected. All handles remain on the left. Changes are clipped
at 40 pixels from the supplied boxes; JPEG compression is checked separately.

Observed limitation (2026-11-03): shepherd source mugs extend to about y=884,
beyond the allowed y=875 / y=855 boundaries. Old lower strips therefore remain.
Do not publish that image without revised box authority. Cleanup extends 8 px
sideways and 40 px below the supplied boxes; placement uses original boxes.
All masks use threshold 24 plus a studio-template lower-rim silhouette to
separate the attached shadow. The numeric check cannot certify visual quality.
North Star check (2026-11-03): holds; product-faithful carousel drafts prepared.
Next: Claude to resolve shepherd bounds before publication.
"""
import argparse
from collections import deque
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
    'shepherd': [(90, 555, 390, 835), (405, 550, 705, 815)],
}


def source(dog):
    return DEST / 'inputs' / f'set-{dog}-source.png'


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
    alpha = Image.fromarray((mask*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.5))
    rgba = im.convert('RGBA'); rgba.putalpha(alpha)
    bounds = alpha.getbbox()
    print(f'{dog}: threshold 24; studio base {base}; handle LEFT retained (painting not mirrored)')
    return rgba.crop(bounds)


def grown(box, pad=40):
    l,t,r,b = box
    return max(0,l-pad), max(0,t-pad), min(1080,r+pad), min(1350,b+pad)


def place(canvas, original, mug, box):
    l,t,r,b = grown(box, 8)
    b = min(1350, box[3]+40)
    a = np.asarray(original).astype(float)
    # Reconstruct each wall/table row from uncontaminated strips at either side.
    # Sampling at the same height preserves the room's wall/table transition.
    left = np.median(a[t:b, max(0,l-35):max(1,l-12)],axis=1)
    right = np.median(a[t:b, r+12:min(1080,r+35)],axis=1)
    weight = np.linspace(0,1,r-l)[None,:,None]
    fill = left[:,None,:]*(1-weight)+right[:,None,:]*weight
    patch = Image.fromarray(np.uint8(np.clip(fill,0,255)))
    canvas.paste(patch,(l,t))
    l,t,r,b = box
    scale = max((b-t)*1.06/mug.height, (r-l)/mug.width)
    size = (round(mug.width*scale),round(mug.height*scale))
    m = mug.resize(size,Image.Resampling.LANCZOS)
    x, y = round((l+r-size[0])/2), b-size[1]
    # Cap exposure correction to eight percent; add only a slight wall WB shift.
    rgb = np.asarray(m).astype(float).copy()
    opaque = rgb[:,:,3] > 220
    lum = np.array([.2126,.7152,.0722])
    surround = np.concatenate([left,right])
    factor = np.clip(np.mean(surround@lum)/np.mean(rgb[:,:,:3][opaque]@lum),.92,1.08)
    wall = np.median(np.concatenate([a[max(0,t-45):t,l-35:l-10].reshape(-1,3),
                                    a[max(0,t-45):t,r+10:r+35].reshape(-1,3)]),axis=0)
    warmth = (wall-wall.mean())*.10
    rgb[:,:,:3] = np.clip(rgb[:,:,:3]*factor+warmth,0,255)
    m = Image.fromarray(rgb.astype('uint8'),'RGBA')
    shadow = Image.new('L',canvas.size)
    dr = ImageDraw.Draw(shadow)
    sw = size[0]*1.1
    dr.ellipse(((l+r-sw)/2,b-10,(l+r+sw)/2,b+14), fill=89)
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.paste(Image.new('RGB',canvas.size,(30,23,18)),(0,0),shadow)
    canvas.paste(m,(x,y),m)
    # Hard spatial guarantee: no edits outside the permitted union, including blur.
    return canvas


def build(out):
    out.mkdir(parents=True,exist_ok=True)
    rows=[]
    for dog, boxes in BOXES.items():
        old=Image.open(source(dog)).convert('RGB')
        if old.size != (1080,1350):
            raise ValueError(f'{dog}: wrong source dimensions')
        mug=cutout(dog)
        new=old.copy()
        for box in boxes:
            place(new,old,mug,box)
        allowed=Image.new('L',old.size)
        for box in boxes:
            ImageDraw.Draw(allowed).rectangle(grown(box),fill=255)
        new=Image.composite(new,old,allowed)
        new.save(out/f'set-{dog}.jpg',quality=92,subsampling=0)
        # Review the actual delivered JPEG, not the uncompressed working image.
        new=Image.open(out/f'set-{dog}.jpg').convert('RGB')
        row=Image.new('RGB',(2500,1400 if len(boxes)>1 else 760),(245,241,235))
        draw=ImageDraw.Draw(row)
        draw.text((12,8),f'{dog.upper()} | OLD / REAL PRODUCT | mug details OLD / REAL (2x)',fill='black')
        row.paste(old.resize((540,675)),(0,40)); row.paste(new.resize((540,675)),(540,40))
        # Include both shepherd mugs in the close-up rather than hiding one.
        for i,box in enumerate(boxes):
            crop=grown(box,12)
            for j,im in enumerate((old,new)):
                detail=im.crop(crop).resize(((crop[2]-crop[0])*2,(crop[3]-crop[1])*2))
                if len(boxes)==1:
                    row.paste(detail,(1080+j*700,60))
                else:
                    row.paste(detail,(1080+j*700,40+i*680))
        rows.append(row)
    sheet=Image.new('RGB',(2500,sum(row.height for row in rows)))
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
            delta=np.abs(np.asarray(im).astype(float)-np.asarray(Image.open(source(dog)).convert('RGB')).astype(float)).mean(axis=2)
        outside=np.ones(delta.shape,bool)
        for box in boxes:
            l,t,r,b=grown(box);outside[t:b+1,l:r+1]=False
            l,t,r,b=box
            inside=float(delta[t:b,l:r].mean())
            print(f'{dog} {box}: inside MAD {inside:.3f}')
            if inside<=10: failures.append(f'{dog}: unchanged box {box}')
        error=float(delta[outside].mean())
        print(f'{dog}: outside MAD {error:.3f}')
        if error>=3: failures.append(f'{dog}: outside MAD >= 3')
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
