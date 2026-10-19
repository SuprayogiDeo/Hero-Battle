# License and third-party asset notice

## Project license

This repository does not currently include a blanket open-source license. Unless the project owner adds one, assume the project's original code and original content are **not granted for reuse by default**. Do not add an MIT/GPL/Apache license automatically because the repository contains third-party art with separate terms.

## Sunnyside World art

The current `CREDITS` file records that parts of the world art are derived from the **Sunnyside World** asset pack by Daniel Diggle. The creator's official page describes use in free and commercial projects, modification, and restrictions on repackaging/reselling and AI training. It also describes redistribution in tutorial/educational-course contexts. These terms should be read directly before making source assets downloadable from a public repository:

- Official page and current license text: <https://danieldiggle.itch.io/sunnyside>

The runtime files under `assets/world/` include cropped/combined/derived assets. Publishing a public GitHub repository makes source files downloadable, even when they are being used in a game. **Before making this repository public or deploying it, confirm that distribution of these derived source files in a public code repository is permitted under the pack's terms, or obtain written clarification from the creator.** A private repository avoids public distribution but does not replace the need to comply with the license.

The original asset-pack archive itself is not included in this repository. Do not add the original pack, paid packs, or unrelated downloaded asset bundles to the repo.

## 99 Ingredients icons

Tahap 8C uses selected derived 16×16 icons from the **99 Ingredients** pack by Keifoo PX in `assets/world/items.png`. Tahap 8D tidak menambah ikon 99 Ingredients; atlas farming/world memakai tahap crop Sunnyside yang sudah diturunkan ke runtime, dan `assets/world/chars.png` diperbarui untuk strip WATERING. Source page: <https://keifoopx.itch.io/99-various-ingredients>. The project catalog records permitted project use/modification and prohibits reselling/repackaging raw icons; re-read the current creator terms before any public repository or deployment. The original ZIP/PSD files are not bundled here.

## Hollow Dolphin fishing icons

Tahap 9B-19 menambahkan `assets/world/fish_icons.png` dan `assets/world/fish_icons.json`: atlas runtime 11 sel 16×16 (10 ikon untuk ikan `LIFE_FISH` + siluet `unknown` untuk ikan yang belum ditemukan) yang dipotong oleh `tools/build_fish_icons.py` dari `fishing_icons_sheet_16x16.png`, bagian dari **Fishing Icon Pack** oleh **Hollow Dolphin**. Pemetaan ikan → indeks ikon dan alasannya tercatat di `fish_icons.json` (`sheetIndex`, `why`). Ikon hanya dipotong dan digabung; siluet `unknown` diturunkan dari bentuk satu ikon dan diberi warna rata. Arsip paket dan ukuran sprite lain (32/48/64 px, ikon terpisah) **tidak** dimasukkan ke repo.

**Status lisensi: belum terkonfirmasi.** Arsip yang diterima hanya berisi gambar (tanpa berkas lisensi atau README), sehingga syarat penggunaan, atribusi wajib, dan izin distribusi ulang tidak diketahui. Seperti sumber lain di proyek privat ini, ini adalah gerbang pemblokir sebelum rilis publik: periksa halaman resmi paket, simpan salinan syaratnya bersama berkas yang dicakup, dan hapus atau ganti ikon bila syaratnya tidak mengizinkan. Atlas dapat dibuat ulang dengan `python3 tools/build_fish_icons.py --sheet <path>/fishing_icons_sheet_16x16.png`.

## Cute Fantasy (Kenmi)

Batch 9B-23 menambahkan `assets/world/cf_atlas.png` dan `assets/world/cf_atlas.json`: atlas 19 PNG dari paket **Cute Fantasy (Free)** oleh Kenmi (`Tiles/*`, `Outdoor decoration/*`, `Animals/*`), dibuat `tools/build_cf_tiles.py` (hanya digabung). Berkas `read_me.txt` paket menyatakan: boleh dipakai di proyek **non-komersial**, boleh dimodifikasi, **tidak boleh redistribusi atau dijual, meskipun sudah dimodifikasi**. Konsekuensi: repo harus tetap privat dan atlas ini tidak boleh ikut rilis publik atau komersial (gerbang pra-rilis: hapus atlas atau dapatkan lisensi yang sesuai). Atlas belum dirujuk peta/tileset desa; paket mentah tidak ada di repo.

## Modern Interiors — Free (LimeZu)

Batch 9B-27 menambahkan `assets/world/mi_chars.png` dan `assets/world/mi_chars.json`: atlas 384×216 (frame 16×24) untuk karakter **Adam, Alex, Amelia, Bob** (strip `idle`, `idle_anim`, `run` dari `Characters_free/`) dari paket **Modern Interiors — Free** oleh **LimeZu** (<https://limezu.itch.io/moderninteriors>), dibuat `tools/build_mi_chars.py` (hanya dipotong 8 baris atas yang kosong dan digabung; piksel tidak diubah). `LICENSE.txt` versi gratis paket menyatakan:

- **Boleh:** dipakai di proyek **non-komersial**; sprite boleh disunting untuk proyek non-komersial.
- **Tidak boleh:** dipakai di proyek **komersial**; menyunting lalu memakainya di proyek komersial; menyunting lalu **menjual ulang** sprite.

**Status:** pemilik proyek menyatakan proyek ini **pribadi dan non-komersial**, sehingga pemakaian versi gratis ini sesuai lisensinya. Karena itu sprite aktif secara default untuk NPC kota (`adam`, `alex`, `amelia`; Bob belum dipakai) dan atlas masuk precache; `?mi=0` mematikannya (sprite hero cadangan, tanpa fetch atlas). Syarat yang tetap berlaku: jangan menjual ulang sprite (juga yang sudah disunting), dan **sebelum proyek dipublikasikan atau dikomersialkan** hapus `mi_chars.*` (atau set `CITY_MI_DEFAULT = false` dan keluarkan dari precache) atau beli lisensi penuh. Arsip paket tidak ada di repo; atlas dapat dibuat ulang dengan `python3 tools/build_mi_chars.py --pack <path>/Characters_free`.

Batch 9B-29 menambahkan `assets/world/mi_interior.png` dan `assets/world/mi_interior.json`: atlas 256×168 berisi 44 sprite (perabot dari `Interiors_free_16x16.png`, dinding dan lantai tiga tema dari `Room_Builder_free_16x16.png`, empat karakter statis dari `Characters_free/`) dari paket **Modern Interiors — Free v2.2** oleh **LimeZu** (<https://limezu.itch.io/moderninteriors>), dibuat `tools/build_mi_interiors.py` (hanya dipotong dan disusun ulang, piksel tidak diubah). Dipakai tiga interior kota (kafe, toko, apartemen).

**Status:** lisensi versi gratis sama dengan di atas (hanya proyek non-komersial; jangan menjual ulang atau mendistribusikan ulang sprite, juga yang disunting). Proyek ini pribadi dan non-komersial. **Sebelum proyek dipublikasikan atau dikomersialkan** hapus `mi_interior.*` beserta templat `ccafe`, `cshop`, `capt` (dan `CITY_B` di `js/city.js`), atau beli lisensi penuh. Arsip paket tidak ada di repo; atlas dapat dibuat ulang dengan `python3 tools/build_mi_interiors.py --pack "<path>/Modern tiles_Free"`.

## Other assets

Review `CREDITS` and the provenance of every image/audio/font added later. Keep license and attribution notices with the files they cover. Do not assume that files found in a previous working directory are cleared for public redistribution.


## Tahap 8F+8G — signage dan lampu

Tahap ini tidak menambahkan arsip aset atau pack baru. Metadata jendela merupakan koordinat turunan pada sprite rumah yang sudah ada; papan nama menggunakan sprite Sunnyside yang ada; gapura dan palung pakan baru digambar secara prosedural dalam kode runtime. Tinjau tetap syarat Sunnyside dan syarat rumah yang bersumber dari unggahan pengguna sebelum distribusi publik. Proyek tetap privat.


## Modern City Top-Down Pack — Free Sampler (CC0)

Batch 9B-25 menambahkan `assets/world/city/city_tiles.png` dan `city_tiles.json` (20 entri: 16 tile 16×16, 3 prop jalan, sprite rubah), dibuat `tools/build_city_tiles.py` dari `sampler_tileset_16.png`, `sampler_props_3.png`, dan `fox_commuter_npc.png` pada **Modern City Top-Down Pack — Free Sampler** oleh **The Venice Menace Baking Co.** (<https://venicemenacebakingco.itch.io/modern-city-topdown-pack>). Pratinjau 4× ada di `docs/preview_city_tiles.png`.

- **Lisensi: CC0.** README paket menyatakan penggunaan komersial dan pribadi diizinkan tanpa kewajiban atribusi. Kami tetap mencatat sumbernya di `CREDITS`. Larangan "jangan jual ulang paketnya apa adanya" berlaku untuk paket mentah, yang **tidak** dimasukkan ke repo; hanya potongan 16×16 turunan yang disertakan.
- **Pengungkapan bantuan AI:** README paket menyatakan seninya dihasilkan dengan bantuan AI dan dikurasi manual (diungkap di halaman itch.io penulis). Karena itu aset ini ditandai sebagai AI-assisted; tinjau kebijakan platform tujuan rilis tentang konten AI sebelum publikasi.
- Pemrosesan: dipotong, latar dibuang menjadi transparan, diperkecil nearest-neighbour. Tidak ada pewarnaan ulang. Tile asli berukuran besar bergaya 16×16 (bukan autotile 16×16 asli), sehingga detail tipis dapat berubah setelah diperkecil.
- Sejak Batch 9B-26 atlas dipakai peta Kota Kecil (`js/city.js`, `assets/world/city/city.json` + chunk) dan masuk precache. Tata letak peta kota buatan proyek ini (`tools/build_city_map.py`); hanya ubin, prop, dan rubah yang berasal dari paket CC0 di atas.

## Ikon makanan (Henry Software + ghostpixxells)

Step 11 menambahkan `assets/world/food_icons16.png`, `food_icons32.png`, dan `food_icons.json` (dibuat `tools/build_food_icons.py`; pratinjau `docs/preview_food_icons.png`).

- **"Free Pixel Food" (Henry Software; art: benmhenry; lisensi CC0):** 64 ikon 16x16. Penulis menyatakan penggunaan bebas, termasuk komersial. Tanpa kewajiban kredit; tetap dicatat di `CREDITS`.
- **"Free Pixel Foods" (ghostpixxells; lisensi CC0):** dipakai 53 dari 102 ikon 32x32 (varian dasar + wadah `dish` dan `bowl`). Halaman penulis menyatakan tanpa AI generatif, tanpa kewajiban kredit, dan meminta file asli tidak didistribusikan ulang.
- Pemrosesan: hanya dipotong dan disusun ulang; piksel tidak diubah; ikon 32x32 tidak diperkecil. Paket mentah tidak masuk repositori; integritas atlas dijaga `sha256` di `food_icons.json` dan `tools/test_food_icons.js`.

## Barang toko dan buah (Pixel Mart + Fruit)

Step 13 menambahkan `assets/world/mart_icons.png`, `fruit_icons.png`, dan `mart_icons.json` (dibuat `tools/build_mart_icons.py`; pratinjau `docs/preview_mart_icons.png`).

- **"Pixel Mart" (ghostpixxells; CC0):** 150 ikon 32x32 (akhiran `_p` = versi dikemas). Penulis menyatakan penggunaan komersial dan penyuntingan boleh; tanpa kewajiban kredit (tetap dicatat di `CREDITS`).
- **"Fruit" (Ninjikin / SciGho; CC BY 4.0):** satu sheet 608x96 (228 sel 16x16). **Kredit wajib** ("Fruit by SciGho (Ninjikin)", tautan lisensi CC BY 4.0) dan sudah dicatat di `CREDITS`. Kredit ini harus tetap ada jika proyek dibagikan.
- Pemrosesan: hanya dipotong dan disusun ulang; piksel tidak diubah. Paket mentah tidak masuk repositori; integritas atlas dijaga `sha256` di `mart_icons.json` dan `tools/test_mart_icons.js`.
