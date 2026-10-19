#!/usr/bin/env python3
"""Atlas runtime Cute Fantasy: assets/world/cf_atlas.png + cf_atlas.json.

Membaca `Tiles/*`, `Outdoor decoration/*` dan `Animals/*/*` dari paket "Cute Fantasy (Free)" oleh Kenmi, lalu menyusun semua PNG
menjadi satu atlas (shelf packing, jarak 1 px, urutan deterministik). Hanya digabung, tidak diwarnai-ulang. Paket mentah TIDAK dimasukkan ke
repo. Lisensi versi gratis: hanya proyek NON-KOMERSIAL, boleh dimodifikasi, DILARANG redistribusi/jual (termasuk hasil modifikasi) ->
repo harus tetap privat. Skrip ini TIDAK menyentuh peta, tileset desa, atau aset lain; hanya menulis dua berkas cf_atlas.*.

Pakai:  python3 tools/build_cf_tiles.py --pack "<folder>/Cute_Fantasy_Free" [--root DIR]
"""
import argparse, json, sys
from pathlib import Path
from PIL import Image

ATLAS_W, PAD = 256, 1
# (kategori, glob relatif ke folder paket, ukuran sel untuk pemotongan grid)
SOURCES = [('tiles', 'Tiles/*.png', 16), ('decor', 'Outdoor decoration/*.png', 16), ('animals', 'Animals/*/*.png', 32)]
META = {'pack': 'Cute Fantasy (Free)', 'author': 'Kenmi', 'license': 'non-commercial only; modification allowed; no redistribution or resale, even if modified'}

def collect(pack):
    items = []
    for cat, pat, cell in SOURCES:
        files = sorted(pack.glob(pat), key=lambda p: p.relative_to(pack).as_posix())
        for f in files:
            im = Image.open(f).convert('RGBA'); w, h = im.size
            grid = {'cell': cell, 'cols': w // cell, 'rows': h // cell} if w % cell == 0 and h % cell == 0 else None
            items.append({'key': cat + '/' + f.stem, 'cat': cat, 'src': f.relative_to(pack).as_posix(), 'im': im, 'grid': grid})
    keys = [i['key'] for i in items]
    if len(set(keys)) != len(keys): sys.exit('kunci ganda: ' + ', '.join(sorted({k for k in keys if keys.count(k) > 1})))
    return items

def pack_items(items):
    order = sorted(items, key=lambda i: (-i['im'].height, i['key']))      # tinggi menurun lalu kunci -> deterministik
    x = y = row_h = 0
    for it in order:
        w, h = it['im'].size
        if w > ATLAS_W: sys.exit('lebar %s melebihi atlas' % it['key'])
        if x + w > ATLAS_W: x, y, row_h = 0, y + row_h + PAD, 0
        it['x'], it['y'] = x, y; x += w + PAD; row_h = max(row_h, h)
    return y + row_h

def build(pack, root):
    items = collect(pack)
    if not items: sys.exit('tidak ada PNG di ' + str(pack))
    H = pack_items(items); atlas = Image.new('RGBA', (ATLAS_W, H), (0, 0, 0, 0)); entries = {}
    for it in sorted(items, key=lambda i: i['key']):
        atlas.paste(it['im'], (it['x'], it['y'])); w, h = it['im'].size
        e = {'x': it['x'], 'y': it['y'], 'w': w, 'h': h, 'category': it['cat'], 'source': it['src'], 'opaque': sum(it['im'].getchannel('A').histogram()[1:])}
        if it['grid']: e['grid'] = it['grid']
        entries[it['key']] = e
    out = root / 'assets/world'; out.mkdir(parents=True, exist_ok=True)
    atlas.save(out / 'cf_atlas.png', optimize=True)
    meta = {'version': 1, 'width': ATLAS_W, 'height': H, 'padding': PAD, 'source': META, 'count': len(entries), 'entries': entries}
    (out / 'cf_atlas.json').write_text(json.dumps(meta, indent=2) + '\n', encoding='utf-8')
    print('OK: %d entri, atlas %dx%d -> %s' % (len(entries), ATLAS_W, H, out / 'cf_atlas.png'))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--pack', required=True, help='folder Cute_Fantasy_Free (berisi Tiles/, Outdoor decoration/, Animals/)')
    ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent), help='root repo (default: induk tools/)')
    a = ap.parse_args(); build(Path(a.pack), Path(a.root))
