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

## Tahap 6B — sungai, pantai, tebing, sudut miring, properti
- **Sudut miring**: `arr[1,2,4,8]` pada Path/River/Pasir = tile dengan satu sudut terpotong (TL, TR, BL, BR; bagian terpotong transparan/rumput). Jalan: sudut cembung persegi bertanda `c` di `road ... c` memakai tile ini di atas rumput (serpihan sudut lama dibuang).
- **Sungai** (River, 1 sel): air = `arr[0]` (470); sel rumput di sisinya memakai tile tepi OPAK tunggal (S[3,12,5,10], serpihan S[7,11,13,14]) → tidak boleh digabung; tikungan sungai Room1 memakai tile air `arr[1,2,4,8]` (belum dipakai).
- **Jembatan**: lantai tile 808 (lebar 3 sel) di atas air; pagar atas 980/919/920/919(cermin)/980(cermin), pagar bawah 400/919/920/919/400, tiang 398 (flag 4 dan 6) di lapisan `over`.
- **Air terjun**: sungai sampai dasar pulau → tepi 859(flag 4), muka tebing 418/478/414, kilau 1420/1421, buih 1422/412.
- **Pasir**: Path 03 (`arr[0]` penuh + rim transparan). **Tebing dalam**: baris tepi 261 + muka 267/203 bolak-balik (tile sudut 262/263/266/147 berisi laut, tidak dipakai di ujung) + bayangan 76.
- Lapisan baru `over` di `village.json` (digambar setelah `decor`; tilemap.js melewatinya bila tidak ada).
- Properti baru (indeks komponen terhubung Room1, `d` = decoration_01, `b` = walls/building/decoration_02/03): peti d237, tumpukan peti b84, tong d32/d247, papan d313, karung d11/d12, pot d122, tangga d118, bangku b102, kepiting d13, bintang laut d368/d7, lentera = tiang d265 + lampu b62. Tidak ada sprite 'peti harta' di paket; yang dipakai peti kayu.
- Uji jangkauan BFS (tingkat sel) dijalankan build_village.py: NPC, pintu bangunan, tangga harus terjangkau dari spawn.
## Keterbatasan
Hanya satu tebing dalam + satu sungai lurus (tanpa tikungan); jalan tanpa diagonal panjang (hanya sudut terpotong); `tileset_forest` (32 px) belum dipakai.

## Tahap 6D: ladang hidup di dunia
- `tools/build_farm.py` (idempoten) memindahkan 12 objek `crop_*` dekor menjadi `farm` = 12 slot [x,y] (urutan = indeks petak farm.js). Bila `farm` tidak ada, dekor lama tampil seperti dulu.
- tilemap.js `Tmap.farm(S.farm.p, Date.now(), WCROP, FC)` hanya MEMBACA state; logika farm.js tidak diubah. Petak: rumput (s=0) = tanah hijau + rumput, tanah (s=1) = alur cangkul, tanaman (s=2) = frame atlas 1..4 menurut q=(now-t)/ms (4 = matang, berkilau). Wortel=carrot, Labu=pumpkin, Bunga Bulan=cauliflower (WCROP di world.js).

## Tahap 6C: bangunan hidup + siang-malam
- `tools/build_lights.py` (idempoten) menambah `spr.<nama>.win` ([x,y,w,h] jendela, dideteksi dari piksel biru-tua 38,43,68 di sprites.png) dan `.door` (hanya Toko & Barak, diukur dari gambar) ke village.json. Tidak membangun ulang peta.
- tilemap.js: `Tmap.fx(malam0..1, {S,R})` dipanggil tiap frame sebelum `Tmap.tall`; `Tmap.lights(g)` menggambar cahaya aditif SETELAH tint. Pintu = celah gelap + cahaya hangat yang melebar; jendela menyala 80% (deterministik); lentera berpendar.
- world.js: `wTone(jam)` interpolasi keyframe `WTK` (ubah di sini untuk menyetel warna/kegelapan). `S.set.dn`: 0 siklus cepat (6 menit/hari, mulai jam 9, tidak disimpan), 1 jam perangkat, 2 siang tetap. Satu fillRect per frame.
