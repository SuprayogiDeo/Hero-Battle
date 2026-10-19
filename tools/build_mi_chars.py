#!/usr/bin/env python3
"""Atlas karakter Modern Interiors (LimeZu, versi GRATIS): assets/world/mi_chars.png + mi_chars.json.

Sumber: folder `Characters_free/` pada "Modern Interiors - Free" (LimeZu). Diambil 4 karakter (Adam, Alex, Amelia, Bob) x 3 strip:
  <Nama>_idle_16x16.png       64x32   4 frame diam, urutan arah: kanan, atas, kiri, bawah
  <Nama>_idle_anim_16x16.png  384x32  24 frame = 4 arah x 6 frame (kanan, atas, kiri, bawah)
  <Nama>_run_16x16.png        384x32  24 frame = 4 arah x 6 frame (kanan, atas, kiri, bawah)
Frame sumber 16x32; 8 baris teratas selalu kosong di semua strip (dicek), jadi dipotong menjadi 16x24 (tanpa mengubah piksel). Titik kaki = tepi bawah frame.
Susunan atlas 384x216: baris 0 = idle statis 4 karakter berurutan (64 px per karakter), baris 1-4 = idle_anim, baris 5-8 = run (satu baris per karakter, urutan adam, alex, amelia, bob).
LISENSI VERSI GRATIS: hanya proyek NON-KOMERSIAL (proyek ini pribadi non-komersial); tidak boleh dijual ulang. Lihat CREDITS dan docs/LICENSE_AND_ASSETS.md.
Hanya menulis dua berkas di atas (deterministik, PNG tanpa metadata). Arsip paket tidak dimasukkan ke repo.

Pakai:  python3 tools/build_mi_chars.py --pack "<folder 'Modern tiles_Free' atau 'Characters_free'>" [--root DIR]
"""
import argparse, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

CHARS = ['Adam', 'Alex', 'Amelia', 'Bob']
FW, FH_SRC, TOP = 16, 32, 8
FH = FH_SRC - TOP
PER_DIR, DIRS = 6, ['right', 'up', 'left', 'down']
STRIPS = {'idle': (4, 'idle'), 'idle_anim': (24, 'idle_anim'), 'run': (24, 'run')}
FPS = {'idle_anim': 6, 'run': 10}
META = {'pack': 'Modern Interiors - Free (Characters_free)', 'author': 'LimeZu', 'url': 'https://limezu.itch.io/moderninteriors',
        'license': 'FREE VERSION: non-commercial projects only; edits allowed for non-commercial use; no resale; repo must stay private',
        'commercial_use': False}


def load(pack, name, key, frames):
    f = pack / ('%s_%s_16x16.png' % (name, key))
    if not f.is_file(): sys.exit('tidak ada ' + str(f))
    im = Image.open(f).convert('RGBA')
    if im.size != (frames * FW, FH_SRC): sys.exit('%s: ukuran %s, diharapkan %s' % (f.name, im.size, (frames * FW, FH_SRC)))
    a = np.array(im)
    if a[:TOP, :, 3].any(): sys.exit('%s: ada piksel di %d baris teratas; pemotongan tidak lossless' % (f.name, TOP))
    for i in range(frames):
        if not a[TOP:, i * FW:(i + 1) * FW, 3].any(): sys.exit('%s: frame %d kosong' % (f.name, i))
    a = a.copy(); a[a[..., 3] == 0] = 0          # RGB piksel transparan dinolkan agar byte-stabil
    return Image.fromarray(a[TOP:], 'RGBA')


def build(pack, root):
    pack = Path(pack)
    if (pack / 'Characters_free').is_dir(): pack = pack / 'Characters_free'
    if (pack / 'Modern tiles_Free' / 'Characters_free').is_dir(): pack = pack / 'Modern tiles_Free' / 'Characters_free'
    W, H = 24 * FW, FH * 9
    atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0)); chars = {}
    for ci, name in enumerate(CHARS):
        e = {'name': name}
        for key, (frames, _) in STRIPS.items():
            x, y = (ci * 4 * FW, 0) if key == 'idle' else (0, FH * ((1 if key == 'idle_anim' else 5) + ci))
            atlas.alpha_composite(load(pack, name, key, frames), (x, y)); e[key] = {'x': x, 'y': y, 'frames': frames}
        chars[name.lower()] = e
    meta = {'version': 1, 'width': W, 'height': H, 'frameW': FW, 'frameH': FH, 'cropTop': TOP, 'dirs': DIRS, 'perDir': PER_DIR, 'fps': FPS,
            'anchor': 'bottom-center', 'source': META, 'chars': chars}
    out = Path(root) / 'assets/world'; out.mkdir(parents=True, exist_ok=True)
    atlas.save(out / 'mi_chars.png', optimize=True)
    (out / 'mi_chars.json').write_text(json.dumps(meta, indent=1) + '\n', encoding='utf-8')
    print('OK: %d karakter, atlas %dx%d -> %s' % (len(chars), W, H, out))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--pack', required=True, help="folder 'Modern tiles_Free' atau 'Characters_free'")
    ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent))
    a = ap.parse_args(); build(a.pack, a.root)
