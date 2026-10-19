#!/usr/bin/env python3
"""Atlas ikon masakan + umpan runtime: assets/world/dish_icons.png + dish_icons.json.

SEMUA piksel digambar sendiri oleh skrip ini (seni asli proyek; tidak memakai paket pihak ketiga, jadi tanpa batasan lisensi tambahan).
Sel 16x16, urutan = DISH_ORDER: enam masakan `LIFE_RECIPES` (fish_soup, farm_stew, forest_omelet, moon_broth, village_feast, herbal_broth),
`bait` (Umpan Langka, Toko Kota), lalu sembilan bahan resep `ing_*` (Step 12: egg, mushroom, herb, fish, carrot, fruit, milk, moonflower, pumpkin). Latar transparan. Kontur gelap otomatis (piksel transparan yang bertetangga dengan bentuk).
Deterministik dan idempoten (PNG tanpa metadata).

Pakai:  python3 tools/build_dish_icons.py [--root DIR]
"""
import argparse, json, sys
from pathlib import Path
from PIL import Image

CELL = 16
DISH_ORDER = ['fish_soup', 'farm_stew', 'forest_omelet', 'moon_broth', 'village_feast', 'herbal_broth', 'bait',
              'ing_egg', 'ing_mushroom', 'ing_herb', 'ing_fish', 'ing_carrot', 'ing_fruit', 'ing_milk', 'ing_moonflower', 'ing_pumpkin']
P = dict(k=(43, 29, 46), g=(214, 221, 228), G=(164, 175, 187), D=(112, 124, 139), W=(246, 239, 226), w=(255, 255, 255),
         o=(240, 178, 79), O=(214, 138, 43), r=(224, 96, 58), n=(163, 92, 48), N=(122, 65, 32), y=(246, 211, 74), Y=(217, 168, 42),
         p=(240, 154, 160), l=(123, 201, 111), L=(78, 154, 74), b=(169, 183, 240), B=(127, 143, 224), m=(232, 224, 255),
         c=(248, 232, 200), t=(190, 112, 60), u=(150, 80, 44), h=(150, 150, 160), z=(222, 120, 150), Z=(176, 84, 118))


def canvas():
    return [[None] * CELL for _ in range(CELL)]


def put(cv, x, y, c):
    if 0 <= x < CELL and 0 <= y < CELL:
        cv[y][x] = P[c]


def rows(cv, spec, c):
    for y, (a, b) in spec.items():
        for x in range(a, b + 1):
            put(cv, x, y, c)


def outline(cv):
    k, out = P['k'], [r[:] for r in cv]
    for y in range(CELL):
        for x in range(CELL):
            if cv[y][x] is None:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < CELL and 0 <= yy < CELL and cv[yy][xx] is not None and cv[yy][xx] != k:
                        out[y][x] = k
                        break
    return out


def bowl(cv, soup):
    """mangkuk dari atas-miring: tepi terang, isi `soup`, badan bergradasi."""
    rows(cv, {5: (2, 13), 6: (1, 14), 7: (1, 14), 8: (2, 13)}, 'g')
    rows(cv, {9: (2, 13), 10: (3, 12), 11: (4, 11), 12: (5, 10), 13: (6, 9)}, 'g')
    rows(cv, {11: (4, 11), 12: (5, 10), 13: (6, 9)}, 'G')
    rows(cv, {9: (11, 13), 10: (10, 12), 11: (9, 11), 12: (8, 10), 13: (8, 9)}, 'D')
    rows(cv, {6: (3, 12), 7: (3, 12)}, soup)
    rows(cv, {5: (4, 11), 8: (4, 11)}, soup)
    rows(cv, {8: (2, 13)}, 'G')
    rows(cv, {8: (4, 11)}, soup)


def plate(cv):
    rows(cv, {5: (4, 11), 6: (2, 13), 7: (1, 14), 8: (1, 14), 9: (1, 14), 10: (2, 13), 11: (4, 11)}, 'g')
    rows(cv, {10: (4, 11), 11: (5, 10)}, 'G')
    rows(cv, {6: (4, 11), 7: (3, 12), 8: (3, 12), 9: (3, 12)}, 'W')


def draw_fish_soup():
    cv = canvas(); bowl(cv, 'o')
    rows(cv, {6: (4, 6), 7: (9, 11)}, 'O')
    for x, y in ((9, 6), (10, 6), (8, 7), (5, 7)): put(cv, x, y, 'r')           # irisan wortel
    for x, y in ((6, 8), (11, 8)): put(cv, x, y, 'l')                            # daun bawang
    # ikan: badan merah muda + ekor yang menyembul di tepi mangkuk
    rows(cv, {2: (4, 6), 3: (3, 8), 4: (4, 9)}, 'p'); put(cv, 2, 3, 'p'); put(cv, 10, 3, 'p'); put(cv, 10, 4, 'p'); put(cv, 11, 2, 'p'); put(cv, 11, 5, 'p')
    put(cv, 5, 3, 'k'); put(cv, 7, 4, 'r')
    return cv


def draw_farm_stew():
    cv = canvas(); bowl(cv, 'n')
    rows(cv, {7: (3, 12)}, 'N')
    for x, y in ((4, 6), (5, 6), (4, 7), (5, 7), (9, 7), (10, 7), (9, 8), (10, 8)): put(cv, x, y, 'O')   # labu
    for x, y in ((8, 5), (7, 6)): put(cv, x, y, 'c')                                                      # susu
    for x, y in ((11, 6), (6, 8)): put(cv, x, y, 'l')
    for x, y in ((6, 3), (9, 2), (7, 1)): put(cv, x, y, 'w')                                              # uap
    for x, y in ((6, 4), (9, 3), (7, 2)): put(cv, x, y, 'm')
    return cv


def draw_forest_omelet():
    cv = canvas(); plate(cv)
    rows(cv, {6: (5, 10), 7: (4, 12), 8: (4, 12), 9: (5, 11)}, 'y')
    rows(cv, {9: (5, 11), 8: (11, 12)}, 'Y')
    for x, y in ((6, 7), (9, 6), (10, 8), (7, 9)): put(cv, x, y, 'l')
    put(cv, 8, 8, 'L'); put(cv, 5, 8, 'L')
    rows(cv, {7: (7, 8)}, 'w')
    for x, y in ((12, 5), (13, 4)): put(cv, x, y, 'L')                                                    # tangkai herba
    put(cv, 12, 4, 'l'); put(cv, 14, 4, 'l')
    return cv


def draw_moon_broth():
    cv = canvas(); bowl(cv, 'b')
    rows(cv, {7: (3, 12)}, 'B')
    for x, y in ((6, 6), (7, 6), (8, 6), (9, 6), (6, 7), (7, 7), (8, 7), (9, 7)): put(cv, x, y, 'w')       # bunga bulan
    put(cv, 7, 6, 'y'); put(cv, 8, 6, 'y'); put(cv, 7, 5, 'm'); put(cv, 8, 5, 'm'); put(cv, 5, 6, 'm'); put(cv, 10, 6, 'm')
    for x, y in ((4, 8), (11, 5)): put(cv, x, y, 'm')
    for x, y in ((12, 2), (3, 3)): put(cv, x, y, 'y'); put(cv, x + 1, y, 'y'); put(cv, x, y + 1, 'y')       # kilau
    return cv


def draw_village_feast():
    cv = canvas(); plate(cv)
    rows(cv, {5: (6, 10), 6: (5, 11), 7: (5, 11), 8: (6, 10)}, 't')                                         # panggang
    rows(cv, {8: (6, 10), 7: (9, 11)}, 'u')
    rows(cv, {5: (7, 8), 6: (6, 7)}, 'O')
    rows(cv, {4: (3, 4), 5: (2, 5)}, 'r'); put(cv, 3, 3, 'l')                                               # apel
    rows(cv, {8: (11, 13), 9: (11, 13)}, 'y'); put(cv, 12, 8, 'Y')                                          # roti/keju
    for x, y in ((4, 9), (5, 9), (7, 10)): put(cv, x, y, 'l')
    return cv


def draw_herbal_broth():
    cv = canvas(); bowl(cv, 'l')
    rows(cv, {7: (3, 12)}, 'L')
    for x, y in ((5, 5), (6, 5), (6, 6), (7, 6), (9, 6), (10, 6), (10, 7)): put(cv, x, y, 'L')
    for x, y in ((4, 6), (8, 6), (11, 6), (5, 8), (9, 8)): put(cv, x, y, 'w')                               # kilau kuah
    rows(cv, {8: (6, 7)}, 'c')                                                                                # jamur
    for x, y in ((12, 2), (13, 1), (11, 3)): put(cv, x, y, 'l')                                              # daun
    put(cv, 12, 3, 'L'); put(cv, 3, 3, 'l'); put(cv, 2, 2, 'l'); put(cv, 3, 2, 'L')
    return cv


def draw_bait():
    cv = canvas()
    # kail: mata di atas, batang lurus, lengkung ke kiri
    for x, y in ((8, 1), (9, 1), (8, 2), (9, 2)): put(cv, x, y, 'w')
    for y in range(3, 9): put(cv, 8, y, 'h')
    for x, y in ((7, 9), (6, 9), (5, 8), (5, 7)): put(cv, x, y, 'h')
    put(cv, 4, 7, 'h')
    # cacing merah muda bergelombang di bawah kail
    for x, y in ((2, 12), (3, 11), (4, 11), (5, 12), (6, 12), (7, 11), (8, 11), (9, 12), (10, 12), (11, 11), (12, 11), (13, 10)):
        put(cv, x, y, 'z'); put(cv, x, y + 1, 'Z')
    put(cv, 12, 10, 'w'); put(cv, 3, 12, 'Z')
    return cv


def draw_ing_egg():
    cv = canvas()
    rows(cv, {4: (3, 6), 5: (2, 7), 6: (2, 7), 7: (2, 7), 8: (3, 6)}, 'W'); rows(cv, {7: (6, 7), 8: (5, 6)}, 'c')
    rows(cv, {7: (8, 11), 8: (7, 12), 9: (7, 12), 10: (7, 12), 11: (8, 11)}, 't'); rows(cv, {9: (11, 12), 10: (10, 12), 11: (10, 11)}, 'u')
    put(cv, 3, 5, 'w'); put(cv, 9, 8, 'c')
    return cv


def draw_ing_mushroom():
    cv = canvas()
    rows(cv, {3: (5, 10), 4: (3, 12), 5: (2, 13), 6: (2, 13), 7: (3, 12)}, 'r')
    for x, y in ((4, 5), (8, 4), (11, 6), (7, 6)): put(cv, x, y, 'w')
    rows(cv, {7: (11, 12), 6: (13, 13)}, 'Z')
    rows(cv, {8: (6, 9), 9: (6, 9), 10: (6, 9), 11: (5, 10), 12: (5, 10)}, 'c'); rows(cv, {8: (9, 9), 9: (9, 9), 10: (9, 9), 11: (10, 10), 12: (10, 10)}, 'W')
    return cv


def draw_ing_herb():
    cv = canvas()
    for y in range(6, 13): put(cv, 8, y, 'L')
    rows(cv, {2: (7, 9), 3: (6, 10), 4: (6, 10), 5: (7, 9)}, 'l'); rows(cv, {3: (8, 8), 4: (8, 8)}, 'L')
    rows(cv, {7: (3, 7), 8: (2, 6), 9: (3, 7)}, 'l'); rows(cv, {8: (4, 4)}, 'L')
    rows(cv, {8: (10, 14), 9: (9, 13), 10: (10, 14)}, 'l'); rows(cv, {9: (11, 11)}, 'L')
    rows(cv, {13: (7, 9)}, 'u')
    return cv


def draw_ing_fish():
    cv = canvas()
    rows(cv, {4: (5, 9), 5: (4, 10), 6: (3, 11), 7: (2, 11), 8: (3, 11), 9: (4, 10), 10: (5, 9)}, 'B')
    rows(cv, {6: (4, 10), 7: (3, 10), 8: (4, 10)}, 'b'); rows(cv, {9: (5, 9), 10: (6, 9)}, 'b')
    rows(cv, {5: (12, 14), 6: (12, 14), 7: (11, 14), 8: (12, 14), 9: (12, 14), 3: (13, 14), 10: (13, 14)}, 'B'); put(cv, 12, 4, 'B'); put(cv, 12, 10, 'B')
    put(cv, 4, 6, 'k'); put(cv, 4, 5, 'w')
    for x, y in ((7, 6), (8, 8), (9, 7)): put(cv, x, y, 'p')
    rows(cv, {2: (6, 8), 3: (6, 8)}, 'B')
    return cv


def draw_ing_carrot():
    cv = canvas()
    for x, y in ((11, 1), (12, 2), (13, 1), (10, 3), (12, 3), (11, 2)): put(cv, x, y, 'l')
    put(cv, 11, 3, 'L'); put(cv, 12, 4, 'L')
    rows(cv, {4: (10, 13), 5: (9, 13), 6: (8, 12), 7: (7, 11), 8: (6, 10), 9: (5, 9), 10: (4, 8), 11: (3, 7), 12: (3, 5)}, 'o')
    rows(cv, {4: (13, 13), 5: (12, 13), 6: (11, 12), 7: (10, 11), 8: (9, 10), 9: (8, 9), 10: (7, 8), 11: (6, 7)}, 'O')
    put(cv, 11, 5, 'r'); put(cv, 9, 7, 'r'); put(cv, 7, 9, 'r')
    return cv


def draw_ing_fruit():
    cv = canvas()
    rows(cv, {4: (4, 7), 5: (3, 12), 6: (2, 13), 7: (2, 13), 8: (2, 13), 9: (3, 12), 10: (4, 11), 11: (5, 10)}, 'r')
    rows(cv, {4: (9, 11), 5: (9, 12)}, 'r'); rows(cv, {7: (11, 13), 8: (11, 13), 9: (10, 12), 10: (9, 11), 11: (8, 10)}, 'Z')
    put(cv, 4, 6, 'p'); put(cv, 4, 7, 'p'); put(cv, 5, 6, 'p')
    for y in (2, 3): put(cv, 8, y, 'u')
    rows(cv, {2: (9, 11), 3: (10, 12)}, 'l'); put(cv, 9, 3, 'L')
    return cv


def draw_ing_milk():
    cv = canvas()
    rows(cv, {1: (6, 9), 2: (6, 9)}, 'B'); rows(cv, {3: (5, 10), 4: (4, 11)}, 'W')
    rows(cv, {5: (4, 11), 6: (4, 11), 7: (4, 11), 8: (4, 11), 9: (4, 11), 10: (4, 11), 11: (4, 11), 12: (4, 11)}, 'W')
    rows(cv, {7: (4, 11), 8: (4, 11), 9: (4, 11)}, 'b'); rows(cv, {6: (4, 11)}, 'B')
    rows(cv, {5: (10, 11), 10: (10, 11), 11: (10, 11), 12: (10, 11)}, 'g'); put(cv, 5, 5, 'w'); put(cv, 5, 10, 'w')
    return cv


def draw_ing_moonflower():
    cv = canvas()
    for x, y in ((7, 1), (8, 1), (7, 2), (8, 2), (7, 9), (8, 9), (7, 10), (8, 10), (2, 5), (3, 5), (2, 6), (3, 6), (12, 5), (13, 5), (12, 6), (13, 6),
                 (4, 2), (3, 3), (4, 3), (11, 2), (12, 3), (11, 3), (4, 8), (3, 9), (4, 9), (11, 8), (12, 9), (11, 9)): put(cv, x, y, 'm')
    rows(cv, {3: (6, 9), 4: (5, 10), 5: (4, 11), 6: (4, 11), 7: (4, 11), 8: (5, 10), 9: (6, 9)}, 'w')
    rows(cv, {5: (6, 9), 6: (6, 9), 7: (6, 9)}, 'y'); put(cv, 7, 6, 'Y'); put(cv, 8, 5, 'W')
    rows(cv, {11: (7, 8), 12: (7, 8), 13: (7, 8)}, 'L'); put(cv, 6, 12, 'l'); put(cv, 9, 11, 'l')
    return cv


def draw_ing_pumpkin():
    cv = canvas()
    rows(cv, {3: (7, 8), 4: (7, 8)}, 'L'); put(cv, 9, 3, 'l'); put(cv, 10, 3, 'l')
    rows(cv, {5: (4, 11), 6: (2, 13), 7: (1, 14), 8: (1, 14), 9: (1, 14), 10: (2, 13), 11: (3, 12), 12: (4, 11)}, 'O')
    rows(cv, {6: (5, 7), 7: (4, 6), 8: (3, 5), 9: (3, 5), 10: (4, 6), 11: (5, 7)}, 'o'); rows(cv, {7: (10, 12), 8: (11, 13), 9: (11, 13), 10: (10, 12)}, 'o')
    for y in range(5, 12): put(cv, 8, y, 'u')
    for y in range(6, 11): put(cv, 4 if y in (8, 9) else 5, y, 'u')
    return cv


DRAW = dict(fish_soup=draw_fish_soup, farm_stew=draw_farm_stew, forest_omelet=draw_forest_omelet, moon_broth=draw_moon_broth,
            village_feast=draw_village_feast, herbal_broth=draw_herbal_broth, bait=draw_bait,
            ing_egg=draw_ing_egg, ing_mushroom=draw_ing_mushroom, ing_herb=draw_ing_herb, ing_fish=draw_ing_fish, ing_carrot=draw_ing_carrot,
            ing_fruit=draw_ing_fruit, ing_milk=draw_ing_milk, ing_moonflower=draw_ing_moonflower, ing_pumpkin=draw_ing_pumpkin)


def build():
    im = Image.new('RGBA', (CELL * len(DISH_ORDER), CELL), (0, 0, 0, 0))
    for i, name in enumerate(DISH_ORDER):
        cv = outline(DRAW[name]())
        for y in range(CELL):
            for x in range(CELL):
                if cv[y][x] is not None:
                    im.putpixel((i * CELL + x, y), cv[y][x] + (255,))
    meta = {'version': 1, 'cell': CELL, 'order': DISH_ORDER, 'source': 'gambar sendiri oleh tools/build_dish_icons.py (seni asli proyek)'}
    return im, meta


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent)); a = ap.parse_args()
    out = Path(a.root) / 'assets' / 'world'; out.mkdir(parents=True, exist_ok=True)
    im, meta = build()
    im.save(out / 'dish_icons.png', optimize=False)
    (out / 'dish_icons.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('OK: %d ikon -> %s' % (len(DISH_ORDER), out))


if __name__ == '__main__':
    sys.exit(main())
