#!/usr/bin/env python3
"""Tahap 6C: menambahkan data jendela & pintu ke assets/world/village.json (spr[nama].win / .door).
Jendela = komponen piksel biru-tua (38,43,68) pada sprite bangunan di sprites.png (dideteksi, bukan ditebak).
Pintu yang bisa terbuka dipasang manual (hasil pemeriksaan gambar): Toko dan Barak. Idempoten; tidak membangun ulang peta.
Pakai: python3 tools/build_lights.py   (dari akar proyek)"""
import json
from PIL import Image
P = 'assets/world/'
V = json.load(open(P + 'village.json'))
im = Image.open(P + 'sprites.png').convert('RGBA')
NAVY = (38, 43, 68)
DOORS = {'house_toko': [8, 69, 16, 11], 'house_barak': [40, 78, 15, 11]}   # x,y,w,h pada sprite (px asli)
HOUSES = ['house_toko', 'house_barak', 'house_purple', 'house_orange', 'house_green', 'house_orange2', 'house_redtall', 'house_hut', 'house_blue', 'tower']

def comps(c):
    W, H = c.size; seen = set(); out = []
    ok = lambda x, y: c.getpixel((x, y))[3] and c.getpixel((x, y))[:3] == NAVY
    for y in range(H):
        for x in range(W):
            if (x, y) in seen or not ok(x, y): continue
            st = [(x, y)]; seen.add((x, y)); pts = []
            while st:
                a, b = st.pop(); pts.append((a, b))
                for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    n = (a + d[0], b + d[1])
                    if 0 <= n[0] < W and 0 <= n[1] < H and n not in seen and ok(*n): seen.add(n); st.append(n)
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            out.append([min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1])
    return out

for n in HOUSES:
    r = V['spr'][n]; c = im.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
    w = [k for k in comps(c) if 4 <= k[2] <= 9 and 2 <= k[3] <= 6]   # jendela kecil; menolak bayangan/atap/pintu besar
    r.pop('win', None); r.pop('door', None)
    if w: r['win'] = w
    if n in DOORS: r['door'] = DOORS[n]
    print(n, 'jendela', w, 'pintu', r.get('door'))
json.dump(V, open(P + 'village.json', 'w'), separators=(',', ':'))
