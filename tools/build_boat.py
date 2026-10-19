#!/usr/bin/env python3
"""Buat sprite perahu nelayan kecil (gambar sendiri, piksel kode) -> assets/world/boat.png.
Sheet 2 frame (naik-turun di air), tiap frame 24x13 px, menghadap kanan (kiri = flip di game).
Jangkar gambar: tengah-bawah lambung (garis air) ada di baris BASE_Y = 10 dalam frame."""
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[1] / 'assets/world/boat.png'
FW, FH, FRAMES, BASE_Y = 24, 13, 2, 10
OUTLINE, DARK, MID, LIGHT, RIM, INSIDE, BENCH = (46, 28, 20, 255), (107, 66, 38, 255), (138, 90, 52, 255), (176, 122, 70, 255), (214, 160, 100, 255), (74, 47, 28, 255), (154, 106, 60, 255)
RIPPLE = [(225, 245, 255, 120), (225, 245, 255, 70)]

def frame(f):
    px = {}
    dy = f  # frame 2 turun 1 px
    for x in range(1, 23):
        top = 3 - (1 if x <= 2 or x >= 21 else 0) - (1 if x >= 22 else 0)
        taper = 2 if x in (1, 22) else 1 if x in (2, 3, 20, 21) else 0
        bottom = 9 - taper
        for y in range(top, bottom + 1):
            if y == top: c = RIM
            elif y == top + 1: c = INSIDE
            else: c = LIGHT if (y - top) % 3 == 0 else MID if (y - top) % 3 == 1 else DARK
            px[(x, y + dy)] = c
    for x in range(9, 14): px[(x, 5 + dy)] = BENCH          # bangku tengah
    for x in range(9, 14): px[(x, 6 + dy)] = INSIDE if (x, 6 + dy) in px else None
    px = {k: v for k, v in px.items() if v}
    out = dict(px)
    for (x, y) in px:                                        # garis tepi gelap
        if any((x + a, y + b) not in px for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))): out[(x, y)] = OUTLINE
    for x in range(5, 19):                                   # riak air di bawah lambung
        y = BASE_Y + 2 + (0 if f == 0 else -1)
        if (x + f) % 3 != 0 and (x, y) not in out: out[(x, y)] = RIPPLE[f]
    return out

img = Image.new('RGBA', (FW * FRAMES, FH), (0, 0, 0, 0))
for f in range(FRAMES):
    for (x, y), c in frame(f).items():
        if 0 <= x < FW and 0 <= y < FH: img.putpixel((f * FW + x, y), c)
OUT.parent.mkdir(parents=True, exist_ok=True); img.save(OUT)
print('PASS: boat.png %dx%d, %d frame %dx%d' % (img.width, img.height, FRAMES, FW, FH))
