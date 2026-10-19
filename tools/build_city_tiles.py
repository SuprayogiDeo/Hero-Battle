#!/usr/bin/env python3
"""Atlas kota: assets/world/city/city_tiles.png + city_tiles.json + docs/preview_city_tiles.png.

Sumber: "Modern City Top-Down Pack - Free Sampler" (The Venice Menace Baking Co., CC0, dibuat dengan bantuan AI dan dikurasi manual):
  sampler_tileset_16.png  8x2 tile besar (240 px per sel)  -> 16 tile 16x16
  sampler_props_3.png     3 prop (lampu lalu lintas, lampu jalan, bangku)
  fox_commuter_npc.png    sprite rubah (1600x1600)

Pemotongan: tiap objek dicari sebagai komponen terhubung terhadap warna latar sheet (bukan grid buta, karena isi tile tidak persis
di kisi 240 px), latar luar dibuang jadi transparan (bagian dalam seperti garis zebra tetap), lalu diperkecil dengan nearest-neighbour:
tile -> tepat 16x16; prop -> skala 1/15 (sama dengan 240 -> 16); rubah -> muat dalam 16x16 dengan rasio asli.
Deterministik (urutan tetap, PNG tanpa metadata), jadi rebuild menghasilkan berkas byte-identik.
Hanya menulis tiga berkas di atas. Peta, tileset desa, dan kode runtime tidak disentuh; atlas belum dirujuk game.

Pakai:  python3 tools/build_city_tiles.py --pack "<folder berisi 3 PNG sumber>" [--root DIR]
"""
import argparse, json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

CELL, TILE, PAD, ATLAS_W = 240, 16, 1, 128
SCALE = CELL // TILE          # 15
TOL = 40                      # jarak warna (jumlah |dR|+|dG|+|dB|) dari latar sheet
MIN_AREA = 2000               # komponen lebih kecil dari ini = noise latar

# urutan baris-demi-baris (kiri ke kanan) pada sheet 8x2
TILE_NAMES = [
    'grass_a', 'grass_b', 'sidewalk_a', 'sidewalk_b', 'sidewalk_c', 'cross_curb', 'cross_h', 'cross_v',
    'road_h_a', 'road_h_b', 'road_v', 'road_cross', 'road_lanes_h', 'road_corner', 'road_t_a', 'road_t_b',
]
PROP_NAMES = ['prop_traffic_light', 'prop_street_lamp', 'prop_bench']   # kiri ke kanan
FOX_NAME = 'npc_fox_commuter'
META = {'pack': 'Modern City Top-Down Pack - Free Sampler', 'author': 'The Venice Menace Baking Co.',
        'license': 'CC0', 'url': 'https://venicemenacebakingco.itch.io/modern-city-topdown-pack',
        'ai_disclosure': 'art generated with AI assistance and curated by hand (disclosed by the author)'}


def objects(path, expect):
    """Kembalikan [(bbox(x0,y0,x1,y1), RGBA penuh-resolusi dengan latar luar transparan)] untuk komponen besar."""
    im = Image.open(path).convert('RGB'); a = np.asarray(im).astype(int)
    bg = np.median(np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3)]), axis=0)
    fg = ndi.binary_closing(np.abs(a - bg).sum(2) > TOL, iterations=2)
    lab, n = ndi.label(fg)
    out = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if h * w < MIN_AREA: continue
        m = ndi.binary_fill_holes(lab[sl] == i)          # isi lubang: putih di dalam objek tetap buram
        rgba = np.dstack([np.asarray(im)[sl], (m * 255).astype(np.uint8)])
        out.append(((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop), Image.fromarray(rgba, 'RGBA')))
    if len(out) != expect: sys.exit('%s: ditemukan %d objek, diharapkan %d' % (path, len(out), expect))
    return out


def down(img, size):
    """Nearest-neighbour dengan fase terbaik: tiap piksel hasil tetap SATU piksel sumber (tanpa pencampuran warna), tetapi titik ambil
    tiap kolom/baris boleh bergeser dari tengah blok (maks. seperempat blok) ke piksel yang paling mendekati rata-rata blok. Dengan begitu
    garis tipis (garis putus-putus jalan, tepi trotoar) tidak lolos di sela sampel. Dua lintasan (kolom, lalu baris); seri -> pergeseran
    terkecil, jadi deterministik. RGB piksel transparan dinolkan agar byte-stabil."""
    arr = np.array(img); arr[arr[..., 3] == 0] = 0          # latar luar tidak boleh ikut memutihkan rata-rata tepi
    img = Image.fromarray(arr, 'RGBA'); src = arr.astype(int); W, H = img.size; w, h = size
    ref = np.asarray(img.resize(size, Image.BOX)).astype(int)
    sx, sy = W / w, H / h
    ys = np.clip(((np.arange(h) + 0.5) * sy).astype(int), 0, H - 1)
    xs = np.clip(((np.arange(w) + 0.5) * sx).astype(int), 0, W - 1)

    def pick(nominal, span, limit, err_of):
        out = []
        for i, c in enumerate(nominal):
            lo, hi = max(0, c - span), min(limit - 1, c + span)
            out.append(min(range(lo, hi + 1), key=lambda v: (err_of(i, v), abs(v - c))))
        return np.array(out)
    xs = pick(xs, max(0, int(sx / 4)), W, lambda i, v: int(np.abs(src[ys, v] - ref[:, i]).sum()))
    ys = pick(ys, max(0, int(sy / 4)), H, lambda j, v: int(np.abs(src[v, xs] - ref[j]).sum()))
    a = src[np.ix_(ys, xs)].astype(np.uint8); a[a[..., 3] == 0] = 0
    return Image.fromarray(a, 'RGBA')


def build(pack, root):
    pack = Path(pack)
    for f in ('sampler_tileset_16.png', 'sampler_props_3.png', 'fox_commuter_npc.png'):
        if not (pack / f).is_file(): sys.exit('tidak ada ' + str(pack / f))
    # --- tile: urutkan per baris (sumbu y tengah), lalu x
    tiles = objects(pack / 'sampler_tileset_16.png', 16)
    mid = max(b[3] for b, _ in tiles) * 0.5 + min(b[1] for b, _ in tiles) * 0.5
    row = lambda b: 0 if (b[1] + b[3]) / 2 < mid else 1
    tiles.sort(key=lambda t: (row(t[0]), t[0][0]))
    if [row(b) for b, _ in tiles] != [0] * 8 + [1] * 8: sys.exit('tile tidak membentuk 8x2')
    props = sorted(objects(pack / 'sampler_props_3.png', 3), key=lambda t: t[0][0])
    fox = objects(pack / 'fox_commuter_npc.png', 1)[0]

    entries, sprites = {}, []
    cells = [(n, b, down(im, (TILE, TILE)), 'tile', 'sampler_tileset_16.png') for n, (b, im) in zip(TILE_NAMES, tiles)]
    for n, (b, im) in zip(PROP_NAMES, props):
        sprites.append((n, b, down(im, (max(1, round(im.width / SCALE)), max(1, round(im.height / SCALE)))), 'prop', 'sampler_props_3.png'))
    fb, fim = fox; k = TILE / max(fim.size)
    sprites.append((FOX_NAME, fb, down(fim, (max(1, round(fim.width * k)), max(1, round(fim.height * k)))), 'sprite', 'fox_commuter_npc.png'))

    # --- susun: tile di grid 8x2 (tanpa jarak, 128x32), sprite di bawahnya (shelf, jarak 1 px)
    y = 2 * TILE + PAD; x = 0; row_h = 0; place = {}
    for n, b, im, kind, src in sprites:
        if x + im.width > ATLAS_W: x, y, row_h = 0, y + row_h + PAD, 0
        place[n] = (x, y); x += im.width + PAD; row_h = max(row_h, im.height)
    H = y + row_h
    atlas = Image.new('RGBA', (ATLAS_W, H), (0, 0, 0, 0))
    for i, (n, b, im, kind, src) in enumerate(cells): place[n] = ((i % 8) * TILE, (i // 8) * TILE)
    for n, b, im, kind, src in cells + sprites:
        atlas.paste(im, place[n])
        entries[n] = {'x': place[n][0], 'y': place[n][1], 'w': im.width, 'h': im.height, 'kind': kind, 'source': src,
                      'sourceBox': list(map(int, b)), 'opaque': int(sum(im.getchannel('A').histogram()[1:]))}
    meta = {'version': 1, 'width': ATLAS_W, 'height': H, 'tileSize': TILE, 'source': META, 'count': len(entries), 'entries': entries}

    out = Path(root) / 'assets/world/city'; out.mkdir(parents=True, exist_ok=True)
    atlas.save(out / 'city_tiles.png', optimize=True)
    (out / 'city_tiles.json').write_text(json.dumps(meta, indent=2) + '\n', encoding='utf-8')
    # pratinjau 4x di atas kotak-kotak abu agar transparansi terlihat
    S = 4; w, h = ATLAS_W * S, H * S; prev = Image.new('RGBA', (w, h))
    px = prev.load()
    for yy in range(h):
        for xx in range(w): px[xx, yy] = (200, 200, 200, 255) if ((xx // 16) + (yy // 16)) % 2 else (168, 168, 168, 255)
    prev.alpha_composite(atlas.resize((w, h), Image.NEAREST))
    docs = Path(root) / 'docs'; docs.mkdir(parents=True, exist_ok=True)
    prev.convert('RGB').save(docs / 'preview_city_tiles.png', optimize=True)
    print('OK: %d entri, atlas %dx%d -> %s' % (len(entries), ATLAS_W, H, out))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--pack', required=True, help='folder berisi sampler_tileset_16.png, sampler_props_3.png, fox_commuter_npc.png')
    ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent))
    a = ap.parse_args(); build(a.pack, a.root)
