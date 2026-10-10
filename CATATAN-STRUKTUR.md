# Hero Battle: catatan struktur (Tahap 1)

## Berkas
- `index.html`  : kerangka HTML + daftar `<script>` (urutan pemuatan PENTING).
- `sw.js`       : service worker. Naikkan `VERSION` tiap ada perubahan. Semua file baru HARUS didaftarkan di `SHELL` / `ART`.
- `js/`         : kode game (skrip klasik, BUKAN ES module, variabel global dipakai bersama):
  assets, audio, data (hero + state `S` + `sv()`), progress (misi, item), autogear (auto pasang & rekomendasi),
  modes (menara/boss/arena/event), combat (efek, alur stage, pertempuran), hero-icons (ikon + data `HI`),
  ai (AI hero + limit break + `clearStage`), manual (kontrol manual), i18n (kamus EN + `tr()`),
  settings, render (gacha + gambar dasar + latar), screens (semua layar), input (klik + loop), pwa, boot.
- `assets/sprites/*.png`, `assets/tiles/*.png` : sprite dan tileset (dulu base64 di dalam HTML).
- Tidak termasuk di paket ini (sudah ada di hosting Anda): `manifest.webmanifest`, `icons/`, `audio/`.

## Aturan penting
1. Fungsi `function x(){}` hanya di-hoist di dalam SATU file. Jangan memanggil fungsi dari file yang dimuat
   belakangan saat file dimuat (di luar fungsi). Pemanggilan awal ditaruh di `js/boot.js`.
2. String UI baru wajib ditambahkan ke kamus `EN` di `js/i18n.js` (blok `Object.assign(EN, ...)` sebelum `const ENK`).
3. Game harus dibuka lewat http(s) (hosting / `python3 -m http.server`), bukan klik dua kali (file://).
4. Teks di kanvas minimal 9 px; tombol sentuh minimal ~26 px tingginya.
