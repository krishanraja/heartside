"""Heartside short-form video builder (9:16, 1080 x 1920, 30 fps, with sound).

Every reel is a list of scenes in a JSON spec, so one spec is one video and a folder of
specs is a week of posts. The poster on screen is composed from the real print layers in
design/poster-template (background, the 15 line images Teeinblue prints, the stamp, the
layer positions), so what a viewer sees is what Printful prints. AI makes the rooms and
dogs; it never makes the product.

    python3 tools/content/reel.py tools/content/specs/hero-pov-sock.json
    python3 tools/content/reel.py tools/content/specs/*.json     # a batch

Writes content/out/<name>.mp4 and a contact sheet <name>.jpg (one frame per scene).

Scene types:
  photo   a library photo, slow push-in, with an optional hook card (top) and an optional
          form card (lower middle) whose line types itself out, with typewriter sound
  poster  the real poster, pushed in, with the APPROVED stamp slamming on
  end     a scene photo (or "scene": a staged scene from tools/preview/mockups.py, which
          then holds this reel's own poster) with the end card (headline, offer, address), arriving at end.at
          seconds so the scene lands first

Safe zone: text stays between y=250 and y=1520 (the apps' own buttons and captions sit
above and below), and inside x=72..1008.
"""
import json
import math
import os
import random
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
TPL = os.path.join(REPO, 'design', 'poster-template')
OUT = os.path.join(REPO, 'content', 'out')
W, H, FPS, SR = 1080, 1920, 30, 48000

INK = (18, 16, 16)
PAPER = (255, 253, 249)
BERRY = (168, 40, 78)
PAW = (138, 74, 43)


def font(name, size, wght=None, opsz=None):
    path = {
        'courier': os.path.join(REPO, 'tools', 'fonts', 'CourierPrime-Regular.ttf'),
        'courier-bold': os.path.join(REPO, 'tools', 'fonts', 'CourierPrime-Bold.ttf'),
        'dmsans': os.path.join(HERE, 'fonts', 'DMSans-var.ttf'),
        'fraunces': os.path.join(HERE, 'fonts', 'Fraunces.ttf'),
    }[name]
    f = ImageFont.truetype(path, size)
    if name in ('dmsans', 'fraunces'):
        axes = {'opsz': opsz or (40 if name == 'dmsans' else 144), 'wght': wght or (500 if name == 'dmsans' else 700)}
        try:
            names = [a['name'] if isinstance(a['name'], str) else a['name'].decode() for a in f.get_variation_axes()]
            f.set_variation_by_axes([axes['opsz'] if 'pt' in n.lower() or 'opsz' in n.lower() or 'optical' in n.lower() else axes['wght'] for n in names])
        except Exception:
            pass
    return f


def wrap(draw, text, fnt, width):
    words, lines, cur = text.split(' '), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=fnt) <= width or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def spaced(draw, xy, text, fnt, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + tracking


def spaced_width(draw, text, fnt, tracking):
    return sum(draw.textlength(ch, font=fnt) + tracking for ch in text) - tracking


# ------------------------------------------------------------------ the real poster
def lines_for(kind):
    """Label -> line, read from the theme snippet that the site and the print both use."""
    src = open(os.path.join(REPO, 'shopify', 'snippets', 'hs2-lines.liquid')).read()
    block = src.split("when '%s'" % kind)[1]
    labels = block.split("assign labels = '")[1].split("'")[0].split('|')
    lines = block.split("assign lines = '")[1].split("' | split")[0].split('|')
    return dict(zip(labels, lines))


def render_poster(photo, person, dog, improvement, incident, enemy, cupboard='1,412', stamp=True):
    """The 3600 x 5400 print, layer by layer, as Teeinblue builds it."""
    layers = {l['id']: l for l in json.load(open(os.path.join(TPL, 'layers.json')))['layers']}
    img = Image.open(os.path.join(TPL, 'poster-background.png')).convert('RGBA')
    d = ImageDraw.Draw(img)
    p = layers['photo']
    ph = Image.open(photo).convert('RGB')
    s = max(p['width'] / ph.width, p['height'] / ph.height)
    ph = ph.resize((math.ceil(ph.width * s), math.ceil(ph.height * s)), Image.LANCZOS)
    left = (ph.width - p['width']) // 2
    top = int((ph.height - p['height']) * 0.24)
    ph = ph.crop((left, top, left + p['width'], top + p['height']))
    mask = Image.new('L', ph.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, ph.width - 1, ph.height - 1), radius=24, fill=255)
    img.paste(ph, (p['x'], p['y']), mask)
    cf = font('courier', 96)
    for key, val, color in (('person', person, INK), ('dog', dog, INK), ('signature', dog, PAW)):
        l = layers[key]
        d.text((l['x'], l['y'] + l['height'] / 2), val, font=cf, fill=color, anchor='lm')
    l = layers['cupboard_line']
    for i, ln in enumerate(wrap(d, 'Opened the treat cupboard %s times. Strong numbers.' % cupboard, cf, l['width'])[:2]):
        d.text((l['x'], l['y'] + 134.4 * i + 67), ln, font=cf, fill=INK, anchor='lm')
    for kind, label in (('improvement', improvement), ('incident', incident), ('enemy', enemy)):
        l = layers[kind]
        art = Image.open(os.path.join(TPL, 'lines', kind, label + '.png')).convert('RGBA')
        img.alpha_composite(art, (l['x'], l['y']))
    st = Image.open(os.path.join(TPL, 'poster-stamp.png')).convert('RGBA')
    if stamp:
        img.alpha_composite(st)
    return img.convert('RGB'), st


# ------------------------------------------------------------------ drawing helpers
def cover(img, w, h, zoom=1.0, fx=0.5, fy=0.5):
    """Scale img to cover w x h at the given zoom, centred on (fx, fy) of the image."""
    s = max(w / img.width, h / img.height) * zoom
    sw, sh = img.width * s, img.height * s
    x = min(max(fx * sw - w / 2, 0), sw - w)
    y = min(max(fy * sh - h / 2, 0), sh - h)
    box = (x / s, y / s, (x + w) / s, (y + h) / s)
    return img.resize((w, h), Image.BICUBIC, box=box)


def ease(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def shadowed(base, card, xy, radius=28, blur=24, alpha=70):
    sh = Image.new('RGBA', base.size, (0, 0, 0, 0))
    m = Image.new('L', card.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, card.width - 1, card.height - 1), radius=radius, fill=alpha)
    sh.paste((0, 0, 0, 255), (xy[0], xy[1] + 14), m)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(sh)
    cm = Image.new('L', card.size, 0)
    ImageDraw.Draw(cm).rounded_rectangle((0, 0, card.width - 1, card.height - 1), radius=radius, fill=255)
    base.paste(card, xy, cm)


def hook_card(text, label=None):
    tmp = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    f = font('dmsans', 62, wght=600)
    lines = wrap(tmp, text, f, 936 - 96)
    lab_h = 56 if label else 0
    h = 48 + lab_h + len(lines) * 76 + 40
    card = Image.new('RGB', (936, h), PAPER)
    d = ImageDraw.Draw(card)
    y = 44
    if label:
        spaced(d, (48, y), label, font('courier-bold', 28), BERRY, 5)
        y += lab_h
    for ln in lines:
        d.text((48, y), ln, font=f, fill=INK)
        y += 76
    return card


def form_card(heading, line, shown, cursor_on):
    tmp = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    fh, fl = font('courier-bold', 34), font('courier', 52)
    full = wrap(tmp, line, fl, 936 - 96)
    h = 44 + 44 + 26 + len(full) * 70 + 40
    card = Image.new('RGB', (936, h), PAPER)
    d = ImageDraw.Draw(card)
    d.rectangle((48, 40, 936 - 48, 43), fill=INK)
    spaced(d, (48, 62), heading, fh, INK, 5)
    # type the line out, wrapping exactly as the full line will
    left, y = shown, 62 + 44 + 26
    last = (48, y)
    for ln in full:
        part = ln[:max(left, 0)]
        d.text((48, y), part, font=fl, fill=INK)
        last = (48 + d.textlength(part, font=fl), y)
        left -= len(ln) + 1
        if left < 0:
            break
        y += 70
    if cursor_on:
        d.rectangle((last[0] + 4, last[1] + 6, last[0] + 30, last[1] + 58), fill=BERRY)
    return card


def end_card(headline, offer, address):
    tmp = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    fh, fo, fa = font('fraunces', 76, wght=700), font('dmsans', 38, wght=500), font('courier-bold', 40)
    hl = wrap(tmp, headline, fh, 936 - 96)
    h = 52 + len(hl) * 84 + 22 + 50 + 30 + 52 + 44
    card = Image.new('RGB', (936, h), PAPER)
    d = ImageDraw.Draw(card)
    y = 50
    for ln in hl:
        d.text((48, y), ln, font=fh, fill=INK)
        y += 84
    y += 22
    d.text((48, y), offer, font=fo, fill=INK)
    y += 50 + 30
    d.rectangle((48, y - 16, 936 - 48, y - 14), fill=INK)
    spaced(d, (48, y), address, fa, BERRY, 3)
    return card


# ------------------------------------------------------------------ sound
def click(rng):
    n = int(SR * 0.018)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    hi = np.diff(np.concatenate([[0], noise]))  # crude high-pass: the metal tick
    thock = np.sin(2 * np.pi * rng.uniform(160, 220) * t)  # the key bottoming out
    env = np.exp(-t * rng.uniform(260, 340))
    return (0.55 * hi + 0.45 * thock) * env * rng.uniform(0.5, 0.8)


def bell():
    n = int(SR * 0.9)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 2093 * t) + 0.5 * np.sin(2 * np.pi * 4186 * t) + 0.25 * np.sin(2 * np.pi * 6280 * t)
    return 0.22 * tone * np.exp(-t * 5.5)


def thunk(rng):
    n = int(SR * 0.32)
    t = np.arange(n) / SR
    sweep = np.sin(2 * np.pi * (110 * t - 120 * t * t))
    body = sweep * np.exp(-t * 16)
    slap = rng.standard_normal(n) * np.exp(-t * 90) * 0.5
    return 0.9 * (body + slap)


def mix(events, dur, path):
    buf = np.zeros(int(SR * dur) + SR)
    for at, snd in events:
        i = int(at * SR)
        buf[i:i + len(snd)] += snd[:max(0, len(buf) - i)]
    peak = np.max(np.abs(buf)) or 1
    buf = buf / peak * 0.6
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((buf[:int(SR * dur)] * 32767).astype(np.int16).tobytes())


# ------------------------------------------------------------------ the builder
def build(spec_path):
    spec = json.load(open(spec_path))
    name = spec['name']
    os.makedirs(OUT, exist_ok=True)
    rng = random.Random(name)
    nrng = np.random.default_rng(abs(hash(name)) % (2 ** 32))
    scenes, t0 = [], 0.0
    for sc in spec['scenes']:
        sc = dict(sc)
        sc['t0'], sc['t1'] = t0, t0 + sc['dur']
        t0 += sc['dur']
        scenes.append(sc)
    dur = t0
    sounds = []
    cache = {}

    def photo(p):
        if p not in cache:
            cache[p] = Image.open(os.path.join(REPO, p)).convert('RGB')
        return cache[p]

    # the poster, once per reel, composed from the print layers
    pz = spec.get('poster')
    if pz:
        lines = {k: lines_for(k) for k in ('improvement', 'incident', 'enemy')}
        for k in ('improvement', 'incident', 'enemy'):
            assert pz[k] in lines[k], 'no %s line called %r' % (k, pz[k])
        full, stamp_layer = render_poster(os.path.join(REPO, pz['photo']), pz['person'], pz['dog'], pz['improvement'], pz['incident'], pz['enemy'], stamp=False)
        S = 3  # work at 1200 x 1800
        poster_small = full.resize((1200, 1800), Image.LANCZOS)
        stamp_small = stamp_layer.resize((1200, 1800), Image.LANCZOS)
        bbox = stamp_small.getbbox()
        stamp_crop = stamp_small.crop(bbox)

        # a staged scene from tools/preview/mockups.py, holding this reel's own poster,
        # so the poster in the last shot says what the reel just typed
        for sc in scenes:
            if sc.get('scene'):
                sys.path.insert(0, os.path.join(REPO, 'tools', 'preview'))
                import mockups
                pl = next(p for p in mockups.PLACEMENTS if p[0] == sc['scene'])
                stamped = full.copy()
                stamped.paste(stamp_layer, (0, 0), stamp_layer)
                base = Image.open(mockups.SCENES / (pl[0] + '.jpg')).convert('RGB')
                cache[sc['scene']] = mockups.place(base, stamped, pl[2], pl[3], *pl[4:])
                sc['photo'] = sc['scene']

    # typed lines: plan the sound and the character timing per scene
    for sc in scenes:
        if sc.get('form'):
            f = sc['form']
            text = f['line']
            start = sc['t0'] + f.get('delay', 0.35)
            rate = f.get('cps', 24)
            sc['_type'] = (start, rate)
            for i, ch in enumerate(text):
                if ch != ' ':
                    sounds.append((start + i / rate + rng.uniform(-0.006, 0.006), click(nrng)))
            sounds.append((start + len(text) / rate + 0.05, bell()))
        if sc['type'] == 'poster':
            sc['_slam'] = sc['t0'] + sc.get('stamp_at', 0.8)
            sounds.append((sc['_slam'], thunk(nrng)))

    wav = os.path.join(OUT, name + '.wav')
    mix(sounds, dur, wav)
    mp4 = os.path.join(OUT, name + '.mp4')
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H), '-r', str(FPS), '-i', '-',
                           '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
                           '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', mp4], stdin=subprocess.PIPE)
    sheet = []
    nframes = int(round(dur * FPS))
    for fi in range(nframes):
        t = fi / FPS
        sc = next(s for s in scenes if s['t0'] <= t < s['t1'] or s is scenes[-1])
        u = (t - sc['t0']) / sc['dur']
        if sc['type'] in ('photo', 'end'):
            z0, z1 = sc.get('zoom', [1.0, 1.08])
            fx, fy = sc.get('focus', [0.5, 0.5])
            frame = cover(photo(sc['photo']), W, H, z0 + (z1 - z0) * ease(u), fx, fy).convert('RGBA')
            if sc.get('shade'):
                g = Image.new('RGBA', (W, H), (0, 0, 0, 0))
                gd = ImageDraw.Draw(g)
                for y in range(H):
                    a = int(sc['shade'] * 255 * max(0, (y - H * 0.45) / (H * 0.55)))
                    gd.line((0, y, W, y), fill=(0, 0, 0, a))
                frame.alpha_composite(g)
            if sc.get('hook'):
                k = ease((t - sc['t0']) / 0.25)
                card = hook_card(sc['hook'], sc.get('label'))
                # top of the safe zone, or its foot when the top would cover the dog's face
                y = int((1500 - card.height if sc.get('hook_at') == 'bottom' else 270) - (1 - k) * 40)
                if k > 0:
                    shadowed(frame, card, (72, y))
            if sc.get('form'):
                start, rate = sc['_type']
                shown = int(max(0, (t - start) * rate)) if t >= start else 0
                done = shown >= len(sc['form']['line'])
                cursor = (not done) or (int(t * 2.2) % 2 == 0)
                card = form_card(sc['form']['heading'], sc['form']['line'], shown, cursor)
                k = ease((t - sc['t0']) / 0.22)
                y = int(1500 - card.height + (1 - k) * 60)
                shadowed(frame, card, (72, y))
            if sc['type'] == 'end':
                e = sc['end']
                card = end_card(e['headline'], e['offer'], e['address'])
                k = ease((t - sc['t0'] - e.get('at', 0.3)) / 0.35)
                if k > 0:
                    shadowed(frame, card, (72, int(1500 - card.height + (1 - k) * 80)))
        elif sc['type'] == 'poster':
            bg = Image.new('RGBA', (W, H), tuple(sc.get('bg', [239, 231, 221])) + (255,))
            z = 1.0 + 0.06 * ease(u)
            pw = int(sc.get('width', 860) * z)
            ph = int(pw * 1.5)
            img = poster_small.convert('RGBA')
            slam = sc['_slam']
            if t >= slam - 0.12:
                k = min(1.0, (t - (slam - 0.12)) / 0.12)
                sc_k = 1.0 + 0.9 * (1 - ease(k))
                st = stamp_crop.resize((int(stamp_crop.width * sc_k), int(stamp_crop.height * sc_k)), Image.LANCZOS)
                if k < 1:
                    st.putalpha(st.getchannel('A').point(lambda a: int(a * ease(k))))
                cx = (bbox[0] + bbox[2]) / 2
                cy = (bbox[1] + bbox[3]) / 2
                img.alpha_composite(st, (int(cx - st.width / 2), int(cy - st.height / 2)))
            sx = sy = 0
            if slam <= t < slam + 0.16:
                sx, sy = rng.randint(-9, 9), rng.randint(-9, 9)
            px = (W - pw) // 2 + sx
            py = int(sc.get('top', 240) - (z - 1) * 300) + sy
            shadowed(bg, img.resize((pw, ph), Image.LANCZOS).convert('RGB'), (px, py), radius=6, blur=30, alpha=90)
            frame = bg
        frame = frame.convert('RGB')
        ff.stdin.write(frame.tobytes())
        if abs(t - (sc['t0'] + sc['dur'] * 0.85)) < 0.5 / FPS:
            sheet.append(frame.resize((270, 480)))
    ff.stdin.close()
    ff.wait()
    os.remove(wav)
    cs = Image.new('RGB', (270 * len(sheet), 480), 'white')
    for i, fr in enumerate(sheet):
        cs.paste(fr, (270 * i, 0))
    cs.save(os.path.join(OUT, name + '.jpg'), quality=85)
    print('wrote', mp4, '%.1fs' % dur)


if __name__ == '__main__':
    for p in sys.argv[1:]:
        build(p)
