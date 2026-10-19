#!/usr/bin/env python3
"""Blok desa "Kafe / Toko / Apartemen" di Hutan Rimbun (lahan K3, asal blok 101,5).

Memindahkan tiga gedung Kota Kecil ke peta desa (index.json + chunks). Koordinat relatif terhadap ORIGIN
supaya blok yang sama bisa dipasang di biome lain nanti (ganti ORIGIN / jalankan dengan --origin X,Y).

Isi:
 - alias sprite (rect sama dengan sprite lama): b_cafe <- b_res2, b_cshop <- b_res1, b_apt <- b_barak
 - menebang pinus/batu/semak/bunga dan membuka kolisi di dalam area blok (+ margin)
 - menaruh objek b_* dan kolisi 2 baris kaki bangunan (pola sama dengan bangunan desa lain)
 - jalur jalan 2 petak di depan pintu + penghubung antar gedung
 - assets/world/interior.json: tiga pintu bangunan baru
Idempoten (aman dijalankan ulang). Pakai: python3 tools/build_town_k3.py [--root DIR] [--origin X,Y] [--dry-run]
"""
import argparse, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fix_map_9a import World, Ops, ROAD, add_obj

ORIGIN = (101, 5)
# id, sprite, alias dari, templat interior, (tile tengah x relatif, tile baris kaki relatif), ukuran ruang, entri
BLD = [
    dict(id='kafe', k='b_cafe', src='b_res2', tpl='ccafe', cx=5, foot=4, room=(13, 9), entry=(6, 7), exit=(6, 8)),
    dict(id='toko_kota', k='b_cshop', src='b_res1', tpl='cshop', cx=14, foot=4, room=(13, 9), entry=(6, 7), exit=(6, 8)),
    dict(id='apartemen', k='b_apt', src='b_barak', tpl='capt', cx=9, foot=11, room=(11, 8), entry=(5, 6), exit=(5, 7)),
]
CLEAR = (-1, -1, 21, 16)           # kotak tebang relatif ORIGIN: x0,y0,x1,y1 (inklusif)
CLEAR_KINDS = ('pine_', 'tree_', 'rock_', 'bush_', 'flower_')   # tree_* = pohon beranimasi (kunci 'a')
ROADS = []                         # diisi di build()


def feet(b, o):
    return (o[0] + b['cx'], o[1] + b['foot'])


def build(S, origin, log):
    ops = Ops(S, None); W = S.W; ox, oy = origin; changed = False
    # 1. alias sprite
    for b in BLD:
        if b['k'] not in S.spr:
            S.spr[b['k']] = dict(S.spr[b['src']]); changed = True; log(f'  spr alias {b["k"]} <- {b["src"]}')
    # 2. tebang
    x0, y0, x1, y1 = ox + CLEAR[0], oy + CLEAR[1], ox + CLEAR[2], oy + CLEAR[3]
    def tile_of(o): return (int(o['x']) // 16, (int(o['y']) - 1) // 16)
    def inside(o): t = tile_of(o); return x0 <= t[0] <= x1 and y0 <= t[1] <= y1
    def kind(o): return o.get('k') or o.get('a') or ''
    def clearable(o): return kind(o).startswith(CLEAR_KINDS)
    other = [o for o in S.objects if kind(o) and inside(o) and not clearable(o) and not kind(o).startswith(tuple(b['k'] for b in BLD))]
    if other: raise SystemExit(f'objek lain di lahan: {[(o["k"], tile_of(o)) for o in other]}')
    n = ops.remove_objects(lambda o: inside(o) and clearable(o))
    if n: changed = True; log(f'  tebang {n} objek')
    foot = set()
    for b in BLD:
        fx, fy = feet(b, origin); px, py = fx * 16, (fy + 1) * 16
        foot |= {(x, y) for (x, y) in ops.sprite_cells({'k': b['k'], 'x': px, 'y': py}) if y in (fy - 1, fy)}
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            i = y * W + x
            if (x, y) in foot: continue
            if S.L['collision'][i] or S.grid[y][x] not in '.,':
                if S.grid[y][x] in '.X' : S.L['collision'][i] = 0; S.grid[y][x] = '.'; changed = True
                else: raise SystemExit(f'sel khusus di lahan {(x, y)} grid={S.grid[y][x]}')
    # 3. bangunan
    for b in BLD:
        fx, fy = feet(b, origin); px, py = fx * 16, (fy + 1) * 16
        if not [o for o in S.objects if o.get('k') == b['k']]:
            add_obj(S, k=b['k'], x=px, y=py); changed = True; log(f'  objek {b["k"]} @ {px},{py}')
        cells = ops.sprite_cells({'k': b['k'], 'x': px, 'y': py})
        for (x, y) in cells:
            if y in (fy - 1, fy):
                i = y * W + x
                if S.L['collision'][i] != 1 or S.grid[y][x] != 'X': S.L['collision'][i] = 1; S.grid[y][x] = 'X'; changed = True
        b['px'], b['py'] = px, py
    # 4. jalan: 2 petak di depan tiap pintu (baris kaki+1, +2) dan penghubung horizontal baris kaki+2 baris atas
    road = set()
    for b in BLD:
        fx, fy = feet(b, origin)
        for dx in (-1, 0):
            for dy in (1, 2): road.add((fx + dx, fy + dy))
    ky = oy + BLD[0]['foot'] + 2
    for x in range(ox + 4, ox + 15): road.add((x, ky)); road.add((x, ky + 1))
    ak = BLD[2]; ax, ay = feet(ak, origin)
    for y in range(ky, ay + 1):
        for dx in (-1, 0): road.add((ax + dx, y))
    for (x, y) in sorted(road):
        i = y * W + x
        if S.L['collision'][i] == 0 and (S.L['ground'][i] != ROAD or S.L['decor'][i] != 0 or S.grid[y][x] != ','):
            S.L['ground'][i] = ROAD; S.L['decor'][i] = 0; S.grid[y][x] = ','; changed = True
    return changed


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--root', default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument('--origin', default='%d,%d' % ORIGIN); ap.add_argument('--dry-run', action='store_true'); a = ap.parse_args()
    origin = tuple(int(v) for v in a.origin.split(','))
    S = World(a.root); changed = build(S, origin, print)
    ip = Path(a.root) / 'assets/world/interior.json'; it = json.loads(ip.read_text(encoding='utf-8')); have = {d['id'] for d in it['buildingDoors']}
    for b in BLD:
        if b['id'] in have: continue
        it['buildingDoors'].append({'id': b['id'], 'tpl': b['tpl'], 'exterior': {'x': b['px'], 'y': b['py']}, 'room': {'w': b['room'][0], 'h': b['room'][1]},
                                    'entry': {'x': b['entry'][0], 'y': b['entry'][1]}, 'exit': {'x': b['exit'][0], 'y': b['exit'][1]}}); changed = True
    if a.dry_run: print('dry-run:', 'ada perubahan' if changed else 'tidak ada perubahan'); return
    if changed: S.save(); ip.write_text(json.dumps(it, ensure_ascii=False), encoding='utf-8')
    print('selesai' if changed else 'tidak ada perubahan')


if __name__ == '__main__': main()
