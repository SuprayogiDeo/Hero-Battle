#!/usr/bin/env python3
"""Peta Kota kecil: assets/world/city/city.json + chunks/c<cx>_<cy>.json (+ docs/preview_city_map.png).

Peta 40x30 tile (tile data 16 px, tampil x2 = 32 px seperti desa) dipecah jadi chunk 20x20 (empat berkas; baris bawah hanya 10 tile tinggi).
Ubin berasal dari atlas assets/world/city/city_tiles.png (tools/build_city_tiles.py, CC0); id ground = indeks nama di city.json "tiles" + 1.
Chunk memuat: ground (id ubin), collision (1 = padat), objects (prop berkolisi: lampu jalan, bangku, lampu lalu lintas; x,y = tile pojok kiri-atas,
fw x fh = jejak tabrakan). Tabrakan prop DITURUNKAN dari objects di sini, jadi data dan tabrakan tidak bisa saling menyimpang.
Peta desa (index.json, village.json, chunks/, tiles.png) TIDAK disentuh. Deterministik: rebuild menghasilkan berkas identik.

Pakai:  python3 tools/build_city_map.py [--root DIR]
"""
import argparse, json
from pathlib import Path
from PIL import Image

W, H, CS = 40, 30, 20
TILES = ['grass_a', 'grass_b', 'sidewalk_a', 'sidewalk_b', 'sidewalk_c', 'cross_curb', 'cross_h', 'cross_v',
         'road_h_a', 'road_h_b', 'road_v', 'road_cross', 'road_lanes_h', 'road_corner', 'road_t_a', 'road_t_b']
TID = {n: i + 1 for i, n in enumerate(TILES)}
PROPS = {'prop_street_lamp': {'fw': 1, 'fh': 1, 'anchor': 'center'},
         'prop_bench': {'fw': 2, 'fh': 1, 'anchor': 'center'},
         'prop_traffic_light': {'fw': 1, 'fh': 1, 'anchor': 'bottom'}}
SPAWN = [4, 14]            # tile tempat pemain muncul setelah lewat gerbang desa (di jalan, 3 tile dari gerbang kembali)
FOX = [25, 13]             # tile rubah statis (trotoar utara)
ROAD_Y, ROAD_X = 14, 20    # jalan horizontal (seluruh lebar) dan jalan vertikal (persimpangan di tengah)

# --- desain simbolik: g rumput, s trotoar, h jalan horizontal, v jalan vertikal, + persimpangan, H zebra di jalan horizontal, V zebra di jalan vertikal
d = [['g'] * W for _ in range(H)]
def rect(ch, x0, y0, x1, y1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): d[y][x] = ch
rect('s', 1, 12, 38, 16)                 # pita trotoar sepanjang jalan horizontal (2 tile tiap sisi)
rect('s', 18, 1, 22, 28)                 # pita trotoar sepanjang jalan vertikal
rect('h', 0, ROAD_Y, W - 1, ROAD_Y)
rect('v', ROAD_X, 1, ROAD_X, 28)
d[ROAD_Y][ROAD_X] = '+'
for x in (12, 28): d[ROAD_Y][x] = 'H'    # zebra cross melintasi jalan horizontal
for y in (10, 18): d[y][ROAD_X] = 'V'    # zebra cross melintasi jalan vertikal

# --- prop berkolisi: (nama, tile x, tile y)
LAMPS = [(x, 12) for x in (4, 8, 15, 31, 35)] + [(x, 16) for x in (6, 14, 25, 29, 36)] + [(18, 5), (22, 5), (18, 24), (22, 24)]
BENCHES = [(26, 12), (9, 16), (8, 6), (30, 6), (8, 22), (30, 23)]       # 2x1 tile
LIGHTS = [(19, 13), (21, 13), (19, 15), (21, 15)]                       # sudut persimpangan
GATE_POSTS = [(1, 13), (1, 15)]                                          # tiang gerbang kembali (jalan x=1,y=14 tetap terbuka)
objects = ([{'k': 'prop_street_lamp', 'x': x, 'y': y, 'fw': 1, 'fh': 1} for x, y in LAMPS]
           + [{'k': 'prop_bench', 'x': x, 'y': y, 'fw': 2, 'fh': 1} for x, y in BENCHES]
           + [{'k': 'prop_traffic_light', 'x': x, 'y': y, 'fw': 1, 'fh': 1} for x, y in LIGHTS])
objects.sort(key=lambda o: (o['y'], o['x'], o['k']))

# --- validasi desain: prop tidak bertumpuk, hanya di trotoar/rumput, rubah/spawn/tiang tidak menimpa prop
occ = {}
for o in objects:
    for yy in range(o['y'], o['y'] + o['fh']):
        for xx in range(o['x'], o['x'] + o['fw']):
            assert (xx, yy) not in occ, 'prop bertumpuk di %d,%d' % (xx, yy)
            assert d[yy][xx] in 'gs', 'prop di atas jalan di %d,%d' % (xx, yy); occ[(xx, yy)] = o['k']
for name, (x, y) in {'rubah': FOX, 'spawn': SPAWN}.items(): assert (x, y) not in occ, name + ' menimpa prop'
for p in GATE_POSTS: assert p not in occ and d[p[1]][p[0]] == 's', 'tiang gerbang menimpa prop/jalan'
assert d[FOX[1]][FOX[0]] == 's' and d[SPAWN[1]][SPAWN[0]] == 'h', 'rubah di trotoar, spawn di jalan'

# --- ground: id ubin per tile
ground = [[0] * W for _ in range(H)]
for y in range(H):
    for x in range(W):
        c = d[y][x]
        if c == 'g': n = 'grass_b' if (x * 3 + y * 5) % 4 == 0 else 'grass_a'
        elif c == 's':
            if y > 0 and d[y - 1][x] == 'g': n = 'sidewalk_c'                     # tepi atas pita: garis putus-putus
            elif (x * 5 + y * 3) % 11 == 0: n = 'sidewalk_b'
            else: n = 'sidewalk_a'
        elif c == 'h': n = 'road_h_a' if x % 2 == 0 else 'road_h_b'
        elif c == 'v': n = 'road_v'
        elif c == '+': n = 'road_cross'
        elif c == 'H': n = 'cross_h'
        else: n = 'cross_v'
        ground[y][x] = TID[n]

# --- collision: tepi peta, prop, tiang gerbang
col = [[0] * W for _ in range(H)]
for y in range(H):
    for x in range(W):
        if x in (0, W - 1) or y in (0, H - 1): col[y][x] = 1
for o in objects:
    for yy in range(o['y'], o['y'] + o['fh']):
        for xx in range(o['x'], o['x'] + o['fw']): col[yy][xx] = 1
for x, y in GATE_POSTS: col[y][x] = 1

# --- tulis
def build(root):
    out = Path(root) / 'assets/world/city'; (out / 'chunks').mkdir(parents=True, exist_ok=True)
    chunks = []
    for cy in range(0, (H + CS - 1) // CS):
        for cx in range(0, (W + CS - 1) // CS):
            x0, y0 = cx * CS, cy * CS; w, h = min(CS, W - x0), min(CS, H - y0)
            flat = lambda g: [g[y0 + y][x0 + x] for y in range(h) for x in range(w)]
            objs = [o for o in objects if x0 <= o['x'] < x0 + w and y0 <= o['y'] < y0 + h]
            for o in objs:
                assert o['x'] + o['fw'] <= x0 + w and o['y'] + o['fh'] <= y0 + h, 'prop melewati batas chunk: %s' % o
            fn = 'chunks/c%d_%d.json' % (cx, cy)
            (out / fn).write_text(json.dumps({'v': 1, 'x': x0, 'y': y0, 'w': w, 'h': h, 'layers': {'ground': flat(ground), 'collision': flat(col)},
                                              'objects': objs}, separators=(',', ':')) + '\n', encoding='utf-8')
            chunks.append({'x': cx, 'y': cy, 'file': fn})
    idx = {'v': 1, 'w': W, 'h': H, 'tile': 16, 'chunkSize': CS, 'atlas': 'city_tiles.png', 'atlasMeta': 'city_tiles.json',
           'tiles': TILES, 'props': PROPS, 'chunks': chunks, 'spawn': SPAWN,
           'gates': {'village': {'tile': [126, 23], 'landing': [124, 23], 'note': 'gerbang di tepi timur desa (kode city.js); peta desa tidak diubah'},
                     'return': {'tile': [1, 14], 'zone': 1.5, 'posts': [list(p) for p in GATE_POSTS]}},
           'npcs': {'fox': FOX}, 'roads': {'horizontalY': ROAD_Y, 'verticalX': ROAD_X}, 'source': 'tools/build_city_map.py',
           'design': [''.join(r) for r in d]}
    (out / 'city.json').write_text(json.dumps(idx, indent=1) + '\n', encoding='utf-8')
    # pratinjau 2x (atlas harus ada)
    atlas_png, meta = out / 'city_tiles.png', out / 'city_tiles.json'
    if atlas_png.is_file() and meta.is_file():
        E = json.loads(meta.read_text(encoding='utf-8'))['entries']; at = Image.open(atlas_png).convert('RGBA')
        crop = lambda n: at.crop((E[n]['x'], E[n]['y'], E[n]['x'] + E[n]['w'], E[n]['y'] + E[n]['h']))
        img = Image.new('RGBA', (W * 16, H * 16))
        for y in range(H):
            for x in range(W): img.alpha_composite(crop(TILES[ground[y][x] - 1]), (x * 16, y * 16))
        for o in objects:
            c = crop(o['k'])
            if PROPS[o['k']]['anchor'] == 'center': pos = (o['x'] * 16 + o['fw'] * 8 - c.width // 2, o['y'] * 16 + o['fh'] * 8 - c.height // 2)
            else: pos = (o['x'] * 16 + o['fw'] * 8 - c.width // 2, (o['y'] + o['fh']) * 16 - c.height)
            img.alpha_composite(c, pos)
        fx = crop('npc_fox_commuter'); img.alpha_composite(fx, (FOX[0] * 16 + 8 - fx.width // 2, FOX[1] * 16 + 13 - fx.height))
        docs = Path(root) / 'docs'; docs.mkdir(parents=True, exist_ok=True)
        img.resize((W * 32, H * 32), Image.NEAREST).convert('RGB').save(docs / 'preview_city_map.png', optimize=True)
    print('OK: peta %dx%d, %d chunk, %d prop -> %s' % (W, H, len(chunks), len(objects), out))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent))
    build(ap.parse_args().root)
