# TILESET-NOTES — Sunnyside World (Tahap 5B)

Diperiksa dari `Tileset/spr_tileset_sunnysideworld_16px.png`, `Sunnyside_World_ExampleScene.png`, dan folder `Sunnyside_World_Gamemaker`
(`tilesets/tileset_sunnysideworld/*.yy`, `rooms/Room1/Room1.yy`).

## Grid
- 1024x1024 px = **64x64 tile 16 px**. Indeks tile GameMaker = `y*64 + x` (4096 tile). Warna magenta pada pratinjau = transparan.
- Contoh scene (4434x2470) = **Room1 (1366x768) diperbesar ~3,25x** (bukan 1:1). Room1 = 86x48 tile, 12 lapisan tile + lapisan aset.
- Lapisan Room1: `sea, clouds_02, land, paths, shadows, decoration_01, forest(tileset_forest 32 px), building, walls, decoration_02/03, cloud_shadow, clouds_01`.
- Data tile: RLE (n<0: ulangi nilai berikutnya |n| kali; n>0: n nilai literal). `-2147483648` = kosong.
  Nilai tile: bit 0-18 = indeks; bit 28 = cermin-X, bit 29 = balik-Y, bit 30 = putar 90°.

## Autotile (11 set x 16 tile; `.yy`)
Land (193-200, 257-264), Building 01/02, Inner Walls, Path 01 (tanah muda, x1-8,y7-8), Path 02 (tanah tua, x12-19), Path 03 (pasir, x34-41),
River (x22-29), Clouds 01/02, Cloud Shadow. Set TIDAK berbentuk blob 47-tile klasik; tiap set = "tile penuh + potongan tepi":
- **Path/River/Pasir** (arr = urutan 16 tile): `0` penuh; `3` rim bawah, `12` rim atas, `5` rim kanan, `10` rim kiri (dipasang pada sel RUMPUT
  yang bersebelahan dengan jalan); `7,11,13,14` serpihan sudut BR/BL/TR/TL (sel diagonal); `1,2,4,8` sudut bersegi miring (belum dipakai).
- **Land (pulau)**: `196` rim atas, `198` kiri, `259` kanan, `261` bawah; sudut `200` (kiri-atas), `260` (kanan-atas), `262`/`263` (bawah);
  rumput variasi `193`(dominan) `194 195 197 199 257 258`. Tebing (bukan bagian set): `266/267/203/147/148/403` (+flag), bayangan laut `76/77`.
  Aturan pulau diturunkan dari pulau kecil kiri-atas Room1 (lihat `build_village.py`).
- Tes mask 4/8 tetangga pada Room1 hanya cocok 40-60% (peta dilukis manual + variasi), jadi aturan ditulis berdasarkan bentuk tile, bukan tabel mask.
- **Laut**: pola 4x4 tile (ids 1163-1166, 1227-1230, 1291-1294, 1355-1358) → `sea.png` 64x64; digulirkan di kode.
- **Animasi tile** (`tileAnimationFrames`, 25 set, kebanyakan 2 frame): buih tebing 147↔150, 148↔151, 149↔152; tepi air 211↔214, 213↔216, …;
  kilau 1419-1422; ombak awan 414-417. Pada peta dipakai tile buih (2 frame) via `anim` di `village.json`.

## Bangunan & properti
Rumah = komposit banyak tile (atap berwarna biru/hijau/oranye/merah/ungu + dinding kayu) di lapisan `building/walls/decoration_02/03`;
lantai/sprite aset ada di lapisan aset (tidak dipakai). Untuk 5B: komponen terhubung Room1 dipotong menjadi sprite (`sprites.png`, 33 sprite):
rumah (toko merah, barak biru, ungu, oranye x2, hijau, merah tinggi, gubuk, biru kecil), lapak merah, menara kayu, menara kincir batu,
pinus x3, semak x3 (satu berbuah), batu x2, bunga/jamur x10, pagar horizontal/vertikal (potongan 16 px).
Properti lain di tileset (peti, tong, tangga, rel, patung, karpet, ikon UI, dll.) belum dipakai.
Dilarang: dijual/dikemas ulang/dipakai melatih AI (lihat CREDITS).

## Keterbatasan
Jalan memakai sudut persegi (rim + serpihan sudut), tanpa sudut miring; tidak ada sungai, pasir, atau tebing bertingkat (hanya satu pulau persegi);
`tileset_forest` (32 px) belum dipakai (pohon = animasi pohon 5A).
