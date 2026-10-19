#!/usr/bin/env python3
"""Atlas ikon ikan runtime: assets/world/fish_icons.png + fish_icons.json.

Memotong ikon 16x16 dari `fishing_icons_sheet_16x16.png` (paket "Fishing Icon Pack" oleh Hollow Dolphin; 12 kolom x 9 baris = 108 ikon)
dan memetakan 10 ikan `LIFE_FISH` (js/life.js) ke ikon yang paling mirip. Sel atlas mengikuti URUTAN LIFE_FISH; sel terakhir
`unknown` adalah siluet gelap turunan (untuk ikan yang belum ditemukan di Buku Ikan). Hanya dipotong/digabung/diwarnai-ulang siluet;
paket mentah TIDAK dimasukkan ke repo. Deterministik dan idempoten.

Pakai:  python3 tools/build_fish_icons.py --sheet "<folder>/Full Sprite Sheets/fishing_icons_sheet_16x16.png" [--root DIR]
"""
import argparse, json, re, sys
from pathlib import Path
from PIL import Image

CELL, SHEET_COLS, SHEET_ROWS = 16, 12, 9
SHEET_NAME = 'fishing_icons_sheet_16x16.png'
# id LIFE_FISH -> (indeks ikon di sheet = baris*12+kolom, alasan pemetaan)
FISH_MAP = {
    'bluegill':       (12, 'ikan bulat biru = sirip biru'),
    'carp':           (3,  'ikan kuning keemasan = Ikan Mas'),
    'river_trout':    (36, 'ikan merah muda berbintik = trout pelangi'),
    'gold_koi':       (2,  'ikan oranye berpita putih = koi'),
    'sardine':        (24, 'ikan ramping sian = sarden'),
    'mackerel':       (25, 'ikan hijau-biru gelap berekor tegas = makarel'),
    'moon_eel':       (58, 'tubuh panjang ungu bergelombang = belut bulan'),
    'snow_char':      (39, 'ikan krem pucat = arang salju'),
    'moss_fish':      (27, 'ikan hijau lumut = ikan lumut'),
    'starlight_fish': (14, 'ikan ungu berbentuk bulan sabit = cahaya bintang'),
}
UNKNOWN_BASE = 12          # siluet 'unknown' diturunkan dari bentuk ikon ini
SILHOUETTE = (58, 58, 74, 255)

def life_fish_ids(root):
    src = (root / 'js/life.js').read_text(encoding='utf-8')
    block = src[src.index('const LIFE_FISH=['):src.index('];', src.index('const LIFE_FISH=['))]
    return re.findall(r"\{id:'([a-z_]+)',name:", block)

def cell(sheet, idx):
    r, c = divmod(idx, SHEET_COLS); return sheet.crop((c * CELL, r * CELL, c * CELL + CELL, r * CELL + CELL))

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--sheet', required=True, help='path fishing_icons_sheet_16x16.png dari paket Hollow Dolphin')
    ap.add_argument('--root', default=str(Path(__file__).resolve().parents[1])); a = ap.parse_args(); root = Path(a.root)
    sheet = Image.open(a.sheet).convert('RGBA')
    if sheet.size != (SHEET_COLS * CELL, SHEET_ROWS * CELL): sys.exit(f'ukuran sheet {sheet.size} tidak sesuai (harus {SHEET_COLS * CELL}x{SHEET_ROWS * CELL})')
    ids = life_fish_ids(root)
    if set(ids) != set(FISH_MAP) or len(ids) != len(FISH_MAP): sys.exit(f'FISH_MAP tidak cocok dengan LIFE_FISH: {sorted(set(ids) ^ set(FISH_MAP))}')
    if len({v[0] for v in FISH_MAP.values()}) != len(FISH_MAP): sys.exit('dua ikan memakai ikon yang sama')
    order = ids + ['unknown']; atlas = Image.new('RGBA', (len(order) * CELL, CELL), (0, 0, 0, 0)); icons = {}
    for n, fid in enumerate(order):
        if fid == 'unknown':
            base = cell(sheet, UNKNOWN_BASE); im = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
            sp, dp = base.load(), im.load()
            for yy in range(CELL):
                for xx in range(CELL):
                    if sp[xx, yy][3] > 0: dp[xx, yy] = SILHOUETTE
            idx, why = UNKNOWN_BASE, 'siluet gelap dari bentuk ikon 12 (ikan belum ditemukan)'
        else:
            idx, why = FISH_MAP[fid]; im = cell(sheet, idx)
        if not im.getbbox(): sys.exit(f'ikon kosong untuk {fid} (indeks {idx})')
        atlas.paste(im, (n * CELL, 0)); r, c = divmod(idx, SHEET_COLS)
        icons[fid] = dict(x=n * CELL, y=0, w=CELL, h=CELL, sheetIndex=idx, sheetRow=r, sheetCol=c, why=why, **({'derived': True} if fid == 'unknown' else {}))
    out = root / 'assets/world'; atlas.save(out / 'fish_icons.png', optimize=True)
    meta = dict(version=1, cell=CELL, cols=len(order), rows=1, width=atlas.width, height=atlas.height, order=order,
                source=dict(pack='Fishing Icon Pack by Hollow Dolphin', file=SHEET_NAME, grid=dict(cols=SHEET_COLS, rows=SHEET_ROWS, cell=CELL)), icons=icons)
    (out / 'fish_icons.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'fish_icons.png {atlas.size} + fish_icons.json: {len(order)} sel ({", ".join(order)})')

if __name__ == '__main__': main()
