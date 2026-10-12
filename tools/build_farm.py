#!/usr/bin/env python3
"""Tahap 6D: memindahkan 12 tanaman dekor statis (objek 'crop_*' di village.json) menjadi daftar slot petak `farm`
([x,y] = kaki, px 1x, urutan baris-demi-baris = indeks petak farm.js: kolom i%4, baris i//4).
Idempoten: bila `farm` sudah ada dan tidak ada objek crop_*, tidak berbuat apa-apa.
Pakai: python3 tools/build_farm.py (dari akar proyek). Jalankan setelah build_village.py dan build_lights.py."""
import json
P = 'assets/world/village.json'
V = json.load(open(P))
crops = [o for o in V['objects'] if (o.get('a') or '').startswith('crop_')]
if crops:
    assert len(crops) == 12, 'harus 12 tanaman dekor, ada %d' % len(crops)
    ys = sorted({o['y'] for o in crops}); xs = sorted({o['x'] for o in crops})
    assert len(ys) == 3 and len(xs) == 4, 'bukan grid 4x3: %s %s' % (xs, ys)
    V['farm'] = [[x, y] for y in ys for x in xs]
    V['objects'] = [o for o in V['objects'] if o not in crops]
    json.dump(V, open(P, 'w'), separators=(',', ':'))
    print('farm slot:', V['farm'])
else:
    print('tidak ada objek crop_*; farm =', V.get('farm'))
