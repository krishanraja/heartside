import numpy as np, sys
from PIL import Image, ImageFilter
from scipy import ndimage as nd
D=sys.argv[1]
S='design/teeinblue/mug-v3/shopify-images/colors'
BG=np.array([243,238,232],float)
def cut(p):
    a=np.asarray(Image.open(p).convert('RGB')).astype(float)
    d=np.abs(a-BG).max(2)
    body=nd.binary_opening(d>10, iterations=2)
    lab,n=nd.label(body); sizes=nd.sum(body,lab,range(1,n+1)); keep=np.isin(lab, 1+np.where(sizes>sizes.max()*0.02)[0])
    keep=nd.binary_fill_holes(keep)
    soft=np.asarray(Image.fromarray((keep*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.0))).astype(float)/255
    dark=np.clip((BG.mean()-a.mean(2))/40,0,1)*(1-soft)
    im=Image.fromarray(np.dstack([a,soft*255]).astype('uint8'),'RGBA'); sh=Image.fromarray((dark*255).astype('uint8'))
    box=Image.fromarray((((soft+dark)>0.02)*255).astype('uint8')).getbbox()
    return im.crop(box), sh.crop(box)
W,H=760,630
canvas=np.zeros((H,W,3))+BG
def place(img,sh,scale,x,y):
    im=img.resize((int(img.width*scale),int(img.height*scale)),Image.LANCZOS); s=sh.resize(im.size,Image.LANCZOS)
    a=np.asarray(im).astype(float); al=a[...,3:]/255; sv=np.asarray(s).astype(float)[...,None]/255
    reg=canvas[y:y+im.height,x:x+im.width]; reg=reg*(1-sv*0.35); reg=reg*(1-al)+a[...,:3]*al
    canvas[y:y+im.height,x:x+im.width]=reg
dog,dsh=cut(f'{S}/the-morning-mug-outward-black.jpg'); note,nsh=cut(f'{S}/the-morning-mug-drinker-black.jpg')
back,bsh,front,fsh=(dog,dsh,note,nsh) if sys.argv[7]=='dog-back' else (note,nsh,dog,dsh)
place(back,bsh,float(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4]))
ns=float(sys.argv[5]); place(front,fsh,ns,W-int(front.width*ns),H-int(front.height*ns)-int(sys.argv[6]))
Image.fromarray(canvas.astype('uint8')).save(f'{D}/mugs-pair.jpg',quality=95)
