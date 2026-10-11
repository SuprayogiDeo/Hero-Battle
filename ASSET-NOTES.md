# ASSET-NOTES — Sunnyside World (Tahap 5A)

Diperiksa dengan PIL dari `Sunnyside_World_ASSET_PACK_V2_1.zip` dan `sunnyside_world_chatacter_anim_human_v1_0.aseprite`.
Semua PNG RGBA. Strip = frame bersebelahan horizontal, lebar frame = lebar/jumlah.

## Karakter manusia (`Characters/Human/<AKSI>/<layer>_<aksi>_strip<N>.png`)
- Frame **96x64**, 1 baris, tampak samping **menghadap KANAN** (kiri = flip). Layer: `base`, 6 rambut
  (`bowl/curly/long/mop/short/spikey hair`), `tools`. (Pengguna menyebut 7 gaya; yang ada di paket = 6.)
- Frame (terverifikasi): IDLE 9 (864x64), WALKING 8 (768x64), DIG 13 (1248x64), RUN 8, ATTACK 10, AXE 10, CARRY 8,
  CASTING 15, CAUGHT 10, DEATH 13, DOING 8, HAMMERING 23 (nama berkas "hamering"), HURT 8, JUMP 9, MINING 10,
  REELING 13, ROLL 10, SWIMMING 12, WAITING 9, WATERING 5.
- Durasi frame sumber (aseprite): **75 ms** (idle/walk/dig); tag `walk-*` memakai 100 ms.
- Tubuh kecil: ~11x16 px (x 43..54, y 23..38) di tengah kanvas 96x64 → sisanya transparan; atlas memotongnya.
- **Titik kaki**: x = **48** (tengah frame), baris piksel terbawah = **y 38** → garis jangkar y = **39** (konstan di semua frame idle/walk/dig).
- `tools` pada idle/walk hanya beberapa piksel (tangan) → tidak dipakai; pada DIG berisi sekop → dipakai. DIG melebar ke x 40..64, y 12..40.
- `.aseprite`: 310 frame 96x64, ada tag arah **idle-s/se/ne/n** dan **walk-s/se/ne/n** (4 pose arah: depan, serong depan,
  serong belakang, belakang). **Belum dipakai** (5A: atas/bawah = animasi jalan samping). Kandidat tahap berikut untuk gerak atas/bawah asli.
- Folder `Goblin`, `Skeleton`: PNG per aksi (tidak dipakai).

## Elemen
| Aset | Berkas | Frame | Ukuran frame | Anchor di atlas |
|---|---|---|---|---|
| Ayam/Sapi/Babi/Domba | `Animals/spr_deco_*_strip4` | 4 | 32x32 | (16, dasar bbox: 26/29/27/27) |
| Bebek/Burung/Kedip | `Animals/*` | 4 / 4 / 12 | 16x16 | tidak dipakai |
| Pohon 1 / 2 | `Plants/spr_deco_tree_0{1,2}_strip4` | 4 | 32x34 / 28x43 | bawah-tengah (16,34) / (14,40) |
| Jamur (4 jenis) | `Plants/…mushroom…` | 4 | 16x16 | tidak dipakai |
| **Kincir** | `Other/spr_deco_windmill_withshadow_strip9` | 9 | 112x112 | **hanya rotor/baling-baling** (bukan bangunan); poros (56,56). Menara ada di tileset |
| Asap cerobong 1-5 | `VFX/Chimney Smoke/chimneysmoke_0N_strip30` | 30 | 15x37, 10x30, 18x21, 20x32, 24x19 | bawah-tengah (mulut cerobong) |
| Tanaman (11 jenis) | `Crops/<nama>_00.._05.png` | 6 tahap, **PNG terpisah** (bukan strip) | 6x7 … 16x19 (bervariasi) | sel 16x20, bawah-tengah |
| Tanah | `Crops/soil_00,01,03,04` (tidak ada `soil_02`) | 1 | 16x12 | sel 16x20, kiri-bawah |
| Tileset | `Tileset/…16px.png` 1024x1024; `…forest_32px.png` 320x576 | – | 16 px | belum dipakai (tahap peta) |

Jenis tanaman: beetroot, cabbage, carrot, cauliflower, kale, parsnip, potato, pumpkin, radish, sunflower, wheat.

## Keluaran build (`python3 tools/build_assets.py <Sunnyside_World_Assets> <proyek>`)
`assets/world/avatar.png` 512x44 (4,3 KB), `props.png` 1024x285 (43 KB), `atlas.json` (8,4 KB) — **total ≈ 56 KB**.
Avatar = base + `shorthair` (+ `tools` untuk dig). Ganti rambut: konstanta `HAIR` di skrip.
Atlas: `anims[nama] = {s: sheet, x, y, w, h, n, ax, ay, d: ms/frame, loop}`; `ax,ay` = anchor dalam sel (kaki/dasar).
Nama: `avatar_idle|walk|dig`, `animal_{chicken,cow,pig,sheep}`, `tree_{1,2}`, `windmill`, `smoke_{1..5}`, `crop_<jenis>_<0..5>`, `soil_NN`.
