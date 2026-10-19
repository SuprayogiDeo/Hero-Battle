#!/usr/bin/env python3
"""Atlas interior kota dari Modern Interiors (LimeZu, versi GRATIS): assets/world/mi_interior.png + mi_interior.json.

Sumber (hanya baca, TIDAK dimasukkan ke repo): folder "Modern tiles_Free" pada paket "Modern Interiors - Free v2.2":
  Interiors_free/16x16/Interiors_free_16x16.png  (256x1424)  objek perabot  -> dipotong per kotak (OBJ)
  Interiors_free/16x16/Room_Builder_free_16x16.png (272x368) dinding/lantai  -> potongan petak 16x16 / 16x32 (RB)
  Characters_free/<Nama>_idle_16x16.png (64x32, 4 frame: kanan, atas, kiri, bawah) -> frame 'bawah' dipotong 16x24 (CH)
Hanya crop + susun ulang (piksel tidak diubah), tanpa penskalaan. Daftar kotak ditulis tangan dari pemeriksaan visual lembar sumber.
LISENSI VERSI GRATIS: hanya proyek NON-KOMERSIAL (proyek ini pribadi non-komersial); tidak boleh dijual ulang/didistribusikan ulang. Lihat CREDITS dan docs/LICENSE_AND_ASSETS.md.
Deterministik: urutan nama tetap, penyusunan rak sederhana lebar 256, PNG tanpa metadata.

Pakai:  python3 tools/build_mi_interiors.py --pack "<folder 'Modern tiles_Free'>" [--root DIR]
"""
import argparse, json, sys
from pathlib import Path
from PIL import Image

# nama: (x, y, w, h) pada Interiors_free_16x16.png
OBJ = {
    'mi_table_wood': (13, 161, 38, 37), 'mi_table_light': (94, 161, 37, 37), 'mi_stool': (97, 209, 14, 14),
    'mi_bench': (117, 216, 38, 21), 'mi_window': (52, 217, 25, 15),
    'mi_bookcase_a': (80, 224, 31, 31), 'mi_bookcase_b': (80, 256, 31, 31),
    'mi_fridges': (32, 296, 64, 32), 'mi_rack': (102, 297, 21, 31), 'mi_sofa': (128, 288, 48, 26),
    'mi_rug_red': (114, 244, 60, 39), 'mi_rug_blue': (181, 254, 24, 18), 'mi_rug_green': (180, 286, 24, 18),
    'mi_bed_cyan': (92, 16, 40, 32), 'mi_bed_cream': (92, 48, 40, 32),
    'mi_plant_tree': (167, 713, 18, 31), 'mi_plant_small': (193, 722, 14, 23), 'mi_palm': (213, 704, 23, 31),
    'mi_chairs': (98, 342, 28, 25), 'mi_picture_a': (5, 216, 22, 7), 'mi_picture_b': (3, 234, 26, 18),
    'mi_food_a': (180, 197, 9, 8), 'mi_food_b': (180, 212, 9, 9), 'mi_food_c': (196, 213, 9, 8),
}
# nama: (x, y, w, h) pada Room_Builder_free_16x16.png (petak 16 px)
RB = {}
for theme, (wy, fy) in {'mint': (9, 9), 'cream': (7, 7), 'wood': (11, 13)}.items():
    RB['mi_wall_' + theme] = (16, wy * 16, 16, 32)       # dinding atas 16x32 (kolom 1, dua baris)
    RB['mi_side_' + theme] = (64, wy * 16, 16, 16)        # dinding samping (warna datar, baris pertama kolom 4)
    RB['mi_bot_' + theme] = (16, (wy + 1) * 16, 16, 16)   # dinding bawah (baris kedua, tepi gelap)
    RB['mi_floor_' + theme + '_a'] = (11 * 16, fy * 16, 16, 16)
    RB['mi_floor_' + theme + '_b'] = (12 * 16, fy * 16, 16, 16)
RB['mi_door_gap'] = (12 * 16, 0, 16, 16)
# karakter statis (frame 'bawah' = indeks 3, 8 baris atas kosong dipotong)
CH = {'mi_bob': 'Bob', 'mi_amelia': 'Amelia', 'mi_adam': 'Adam', 'mi_alex': 'Alex'}
AW = 256


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--pack', required=True); ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent))
    a = ap.parse_args(); pack = Path(a.pack)
    if pack.name != 'Modern tiles_Free' and (pack / 'Modern tiles_Free').is_dir(): pack = pack / 'Modern tiles_Free'
    isrc = pack / 'Interiors_free' / '16x16' / 'Interiors_free_16x16.png'; rsrc = pack / 'Interiors_free' / '16x16' / 'Room_Builder_free_16x16.png'
    for f in (isrc, rsrc):
        if not f.is_file(): sys.exit('tidak ada: %s' % f)
    I = Image.open(isrc).convert('RGBA'); R = Image.open(rsrc).convert('RGBA')
    if I.size != (256, 1424) or R.size != (272, 368): sys.exit('ukuran sumber tak sesuai: %s %s' % (I.size, R.size))
    tiles = {}
    for n, (x, y, w, h) in OBJ.items():
        c = I.crop((x, y, x + w, y + h))
        if not c.getchannel('A').getbbox(): sys.exit('%s: kotak kosong' % n)
        tiles[n] = c
    for n, (x, y, w, h) in RB.items(): tiles[n] = R.crop((x, y, x + w, y + h))
    for n, nm in CH.items():
        f = pack / 'Characters_free' / ('%s_idle_16x16.png' % nm)
        if not f.is_file(): sys.exit('tidak ada: %s' % f)
        S = Image.open(f).convert('RGBA')
        if S.size != (64, 32): sys.exit('%s: ukuran %s' % (f.name, S.size))
        c = S.crop((48, 8, 64, 32))
        if not c.getchannel('A').getbbox(): sys.exit('%s: frame kosong' % n)
        tiles[n] = c
    # susun rak: tinggi rak = tinggi terbesar pada baris, urut nama tetap
    names = list(OBJ) + list(RB) + list(CH); pos = {}; x = y = rh = 0
    for n in names:
        w, h = tiles[n].size
        if x + w + 1 > AW: x = 0; y += rh + 1; rh = 0
        pos[n] = (x, y); x += w + 1; rh = max(rh, h)
    H = y + rh; atlas = Image.new('RGBA', (AW, H), (0, 0, 0, 0))
    for n in names: atlas.paste(tiles[n], pos[n])
    root = Path(a.root); out = root / 'assets' / 'world'; out.mkdir(parents=True, exist_ok=True)
    atlas.save(out / 'mi_interior.png', optimize=True)
    spr = {n: {'x': pos[n][0], 'y': pos[n][1], 'w': tiles[n].size[0], 'h': tiles[n].size[1]} for n in names}
    meta = {'v': 1, 'width': AW, 'height': H, 'spr': spr,
            'source': {'pack': 'Modern Interiors - Free v2.2', 'author': 'LimeZu', 'license': 'free version: non-commercial only; no resale/redistribution',
                       'commercial_use': False, 'url': 'https://limezu.itch.io/moderninteriors'}}
    (out / 'mi_interior.json').write_text(json.dumps(meta, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    print('OK: %d sprite, atlas %dx%d -> %s' % (len(names), AW, H, out))


if __name__ == '__main__':
    main()
