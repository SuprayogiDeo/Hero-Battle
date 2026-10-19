#!/usr/bin/env python3
"""Atlas barang toko + buah runtime: assets/world/mart_icons.png + fruit_icons.png + mart_icons.json (+ docs/preview_mart_icons.png).

Sumber (hanya dibaca; paket mentah TIDAK dimasukkan ke repo):
  1) "Pixel Mart" (ghostpixxells; CC0, boleh diedit) - 150 ikon barang toko 32x32 lepas (`milk_bottle.png`, `egg_brown.png`, `salmon_p.png`; akhiran `_p` = versi dikemas).
  2) "Fruit" (Ninjikin / SciGho; CC BY 4.0, WAJIB KREDIT) - satu sheet 608x96 = 38x6 sel 16x16 (`Fruit+.png`); sel kosong dibuang dari daftar.
Piksel TIDAK diubah: hanya dipotong dan disusun ulang.
  mart_icons.png   15 kolom x 10 baris sel 32x32 (480x320), urutan abjad nama.
  fruit_icons.png  sheet buah apa adanya (608x96).
Nama: Pixel Mart snake_case huruf kecil (`chopping board` -> `chopping_board`) diberi awalan `mart_`; buah `fruit_r<baris>c<kolom>` (sel tak kosong saja).
mart_icons.json: {sheets, icons:{nama:{s,x,y}}, sha256, count, source}. Deterministik dan idempoten.

Pakai:  python3 tools/build_mart_icons.py --mart "<folder Pixel_Mart>" --fruit "<Fruit+.png>" [--root DIR]
"""
import argparse, hashlib, json, re, sys
from pathlib import Path
from PIL import Image

COLS_MART = 15


def load_mart(base):
    fs = sorted(base.glob('*.png'))
    out = []
    for f in fs:
        im = Image.open(f).convert('RGBA')
        if im.size != (32, 32): sys.exit('%s: ukuran %s, diharapkan 32x32' % (f.name, im.size))
        out.append(('mart_' + re.sub(r'[^a-z0-9]+', '_', f.stem.lower()).strip('_'), im))
    names = [n for n, _ in out]
    if len(set(names)) != len(names): sys.exit('nama Pixel Mart ganda setelah normalisasi')
    if len(out) != 150: sys.exit('Pixel Mart: %d ikon, diharapkan 150' % len(out))
    return sorted(out, key=lambda t: t[0])


def load_fruit(path):
    im = Image.open(path).convert('RGBA')
    if im.size != (608, 96): sys.exit('Fruit: ukuran %s, diharapkan 608x96' % (im.size,))
    cells = {}
    for r in range(6):
        for c in range(38):
            if im.crop((c * 16, r * 16, c * 16 + 16, r * 16 + 16)).getchannel('A').getbbox() is not None:
                cells['fruit_r%dc%d' % (r, c)] = (c * 16, r * 16)
    if len(cells) < 100: sys.exit('Fruit: hanya %d sel berisi, tampaknya bukan sheet yang benar' % len(cells))
    return im, cells


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--mart', required=True); ap.add_argument('--fruit', required=True)
    ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent)); a = ap.parse_args()
    root = Path(a.root); out = root / 'assets' / 'world'; out.mkdir(parents=True, exist_ok=True)
    items = load_mart(Path(a.mart)); fruit, fcells = load_fruit(Path(a.fruit))
    rows = -(-len(items) // COLS_MART); sheet = Image.new('RGBA', (COLS_MART * 32, rows * 32), (0, 0, 0, 0)); icons = {}
    for i, (n, im) in enumerate(items):
        x, y = (i % COLS_MART) * 32, (i // COLS_MART) * 32; sheet.paste(im, (x, y)); icons[n] = {'s': 32, 'x': x, 'y': y}
    for n, (x, y) in fcells.items(): icons[n] = {'s': 16, 'x': x, 'y': y}
    sheet.save(out / 'mart_icons.png', optimize=False); fruit.save(out / 'fruit_icons.png', optimize=False)
    sha = {n: hashlib.sha256((out / n).read_bytes()).hexdigest() for n in ('mart_icons.png', 'fruit_icons.png')}
    meta = {'version': 1, 'sheets': {'mart': {'file': 'mart_icons.png', 'w': sheet.width, 'h': sheet.height, 'cell': 32, 'cols': COLS_MART},
                                     'fruit': {'file': 'fruit_icons.png', 'w': fruit.width, 'h': fruit.height, 'cell': 16, 'cols': 38}},
            'count': {'mart': len(items), 'fruit': len(fcells)}, 'icons': icons, 'sha256': sha,
            'source': {'mart': 'Pixel Mart - ghostpixxells (CC0)', 'fruit': 'Fruit - Ninjikin/SciGho (CC BY 4.0, wajib kredit)'}}
    (out / 'mart_icons.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    (root / 'docs').mkdir(exist_ok=True)
    a1 = sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST); b1 = fruit.resize((fruit.width * 2, fruit.height * 2), Image.NEAREST)
    bg = Image.new('RGBA', (max(a1.width, b1.width) + 16, a1.height + b1.height + 24), (46, 40, 70, 255)); bg.alpha_composite(a1, (8, 8)); bg.alpha_composite(b1, (8, a1.height + 16))
    bg.convert('RGB').save(root / 'docs' / 'preview_mart_icons.png', optimize=False)
    print('OK: %d barang 32px + %d sel buah 16px -> %s' % (len(items), len(fcells), out))


if __name__ == '__main__':
    sys.exit(main())
