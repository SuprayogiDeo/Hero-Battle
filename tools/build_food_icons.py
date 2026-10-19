#!/usr/bin/env python3
"""Atlas ikon makanan runtime: assets/world/food_icons16.png + food_icons32.png + food_icons.json (+ docs/preview_food_icons.png).

Sumber (hanya dibaca; paket mentah TIDAK dimasukkan ke repo):
  1) "Free Pixel Food" (Henry Software; art: benmhenry; CC0) - 64 ikon 16x16 lepas di `Sprite/Food/*.png`.
  2) "Free Pixel Foods" (ghostpixxells; CC0; tanpa AI) - 102 ikon 32x32 bernomor (`38_friedegg.png`). Dipakai varian dasar (tanpa
     `_dish/_bowl/_napkin/_sauce`) ditambah wadah `dish` (01) dan `bowl` (04): 53 ikon.
Ikon TIDAK diubah pikselnya: hanya dipotong dan disusun ulang (ikon 32x32 dipertahankan 32x32 supaya tidak kehilangan detail).
  food_icons16.png  8x8 sel 16x16 (128x128), urutan abjad nama.
  food_icons32.png  8 kolom sel 32x32 (256 x 32*baris), urutan nomor berkas.
Nama: Henry CamelCase -> snake_case (`PotatoRed` -> `potato_red`); ghostpixxells diberi awalan `big_` (`big_ramen`) supaya tak bertabrakan dengan nama Henry.
food_icons.json: {sheets:{16:{file,w,h,cell},32:{...}}, icons:{nama:{s:16|32,x,y}}, sha256:{...}, source:{...}}. Deterministik dan idempoten.

Pakai:  python3 tools/build_food_icons.py --henry "<folder Free Pixel Food>" --ghost "<folder Ghostpixxells_pixelfood>" [--root DIR]
"""
import argparse, hashlib, json, re, sys
from pathlib import Path
from PIL import Image

COLS16, COLS32 = 8, 8
SKIP = re.compile(r'_(dish|bowl|napkin|sauce)$')
KEEP_NUM = {1: 'dish', 4: 'bowl'}


def snake(name):
    return re.sub(r'(?<=[a-z0-9])(?=[A-Z])', '_', name).lower()


def find_dir(base, pred, what):
    for d in [base] + sorted(p for p in base.rglob('*') if p.is_dir()):
        if pred(d):
            return d
    sys.exit('tidak menemukan ' + what + ' di ' + str(base))


def load_henry(base):
    d = find_dir(base, lambda d: d.name == 'Food' and d.parent.name == 'Sprite', 'Sprite/Food (Free Pixel Food)')
    out = {}
    for f in sorted(d.glob('*.png')):
        im = Image.open(f).convert('RGBA')
        if im.size != (16, 16): sys.exit('%s: ukuran %s, diharapkan 16x16' % (f.name, im.size))
        out[snake(f.stem)] = im
    if len(out) != 64: sys.exit('Henry: %d ikon, diharapkan 64' % len(out))
    return dict(sorted(out.items()))


def load_ghost(base):
    d = find_dir(base, lambda d: any(d.glob('01_dish.png')), 'folder ghostpixxells (01_dish.png)')
    out = []
    for f in sorted(d.glob('*.png'), key=lambda p: int(p.name.split('_')[0])):
        num, rest = f.stem.split('_', 1)
        if int(num) in KEEP_NUM: rest = KEEP_NUM[int(num)]
        elif SKIP.search(f.stem): continue
        im = Image.open(f).convert('RGBA')
        if im.size != (32, 32): sys.exit('%s: ukuran %s, diharapkan 32x32' % (f.name, im.size))
        out.append(('big_' + re.sub(r'[^a-z0-9]+', '_', rest.lower()).strip('_'), im))
    names = [n for n, _ in out]
    if len(set(names)) != len(names): sys.exit('nama ghostpixxells ganda')
    if len(out) != 53: sys.exit('ghostpixxells: %d ikon, diharapkan 53' % len(out))
    return out


def pack(items, cell, cols):
    rows = -(-len(items) // cols)
    sheet = Image.new('RGBA', (cols * cell, rows * cell), (0, 0, 0, 0)); pos = {}
    for i, (name, im) in enumerate(items):
        x, y = (i % cols) * cell, (i // cols) * cell; sheet.paste(im, (x, y)); pos[name] = (x, y)
    return sheet, pos


def preview(s16, s32, path):
    a = s16.resize((s16.width * 4, s16.height * 4), Image.NEAREST); b = s32.resize((s32.width * 2, s32.height * 2), Image.NEAREST)
    W, H = max(a.width, b.width) + 16, a.height + b.height + 24
    bg = Image.new('RGBA', (W, H), (46, 40, 70, 255)); bg.alpha_composite(a, (8, 8)); bg.alpha_composite(b, (8, a.height + 16))
    bg.convert('RGB').save(path, optimize=False)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--henry', required=True); ap.add_argument('--ghost', required=True)
    ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent)); a = ap.parse_args()
    root = Path(a.root); out = root / 'assets' / 'world'; out.mkdir(parents=True, exist_ok=True)
    h = load_henry(Path(a.henry)); g = load_ghost(Path(a.ghost))
    s16, p16 = pack(list(h.items()), 16, COLS16); s32, p32 = pack(g, 32, COLS32)
    s16.save(out / 'food_icons16.png', optimize=False); s32.save(out / 'food_icons32.png', optimize=False)
    sha = {n: hashlib.sha256((out / n).read_bytes()).hexdigest() for n in ('food_icons16.png', 'food_icons32.png')}
    icons = {n: {'s': 16, 'x': x, 'y': y} for n, (x, y) in p16.items()}; icons.update({n: {'s': 32, 'x': x, 'y': y} for n, (x, y) in p32.items()})
    meta = {'version': 1, 'sheets': {'16': {'file': 'food_icons16.png', 'w': s16.width, 'h': s16.height, 'cell': 16},
                                     '32': {'file': 'food_icons32.png', 'w': s32.width, 'h': s32.height, 'cell': 32}},
            'count': {'16': len(p16), '32': len(p32)}, 'icons': icons, 'sha256': sha,
            'source': {'16': 'Free Pixel Food - Henry Software (CC0)', '32': 'Free Pixel Foods - ghostpixxells (CC0, tanpa AI)'}}
    (out / 'food_icons.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    (root / 'docs').mkdir(exist_ok=True); preview(s16, s32, root / 'docs' / 'preview_food_icons.png')
    print('OK: %d ikon 16px + %d ikon 32px -> %s' % (len(p16), len(p32), out))


if __name__ == '__main__':
    sys.exit(main())
