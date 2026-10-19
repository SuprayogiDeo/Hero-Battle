#!/usr/bin/env node
'use strict';
/* Atlas Cute Fantasy (Kenmi): assets/world/cf_atlas.png/json dari tools/build_cf_tiles.py. Semua entri json harus ada di atlas (batas, tidak tumpang tindih, piksel buram sama dengan yang dicatat),
   cakupan Tiles/Outdoor decoration/Animals, atlas tidak dipakai peta/tileset desa, CREDITS mencatat lisensi non-komersial, paket mentah tidak masuk repo. */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), assert = require('assert');
const root = path.join(__dirname, '..'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const meta = JSON.parse(rd('assets/world/cf_atlas.json'));
function readAlpha(buf) {   // PNG RGBA 8-bit -> {w,h,a}; semua filter PNG
  ok(buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'tanda tangan PNG');
  let p = 8, w, h, ct, bd, idat = [];
  while (p < buf.length) { const len = buf.readUInt32BE(p), t = buf.toString('latin1', p + 4, p + 8), d = buf.slice(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; } else if (t === 'IDAT') idat.push(d); p += 12 + len; }
  ok(ct === 6 && bd === 8, 'atlas RGBA 8-bit');
  const bpp = 4, stride = w * 4, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(h * stride); let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1)), cur = out.slice(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) { const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0; let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; } cur[i] = v & 255; }
    prev = cur; }
  return { w, h, alpha: (x, y) => out[y * stride + x * 4 + 3] };
}
const png = readAlpha(fs.readFileSync(path.join(root, 'assets/world/cf_atlas.png')));
ok(png.w === meta.width && png.h === meta.height && meta.version === 1 && meta.padding === 1, 'dimensi atlas = json');
ok(/Kenmi/.test(meta.source.author) && /non-commercial/.test(meta.source.license), 'sumber dan lisensi tercatat di json');
const keys = Object.keys(meta.entries);
ok(keys.length === meta.count && keys.length === 19, '19 entri (8 Tiles + 7 Outdoor decoration + 4 Animals)');
const cat = c => keys.filter(k => meta.entries[k].category === c).length;
ok(cat('tiles') === 8 && cat('decor') === 7 && cat('animals') === 4, 'cakupan tiga folder sumber');
ok(keys.every(k => k.startsWith(meta.entries[k].category + '/') && /^(Tiles|Outdoor decoration|Animals)\/.+\.png$/.test(meta.entries[k].source)), 'kunci dan jalur sumber konsisten');
ok(['tiles/Grass_Middle', 'tiles/Water_Tile', 'decor/Oak_Tree', 'decor/Chest', 'animals/Sheep', 'animals/Cow', 'animals/Pig', 'animals/Chicken'].every(k => meta.entries[k]), 'entri kunci ada');
// semua entri ada di atlas: di dalam batas, buram sesuai catatan, tidak tumpang tindih
const owner = new Int16Array(png.w * png.h).fill(-1);
keys.forEach((k, idx) => { const e = meta.entries[k];
  ok(Number.isInteger(e.x) && Number.isInteger(e.y) && e.w > 0 && e.h > 0 && e.x >= 0 && e.y >= 0 && e.x + e.w <= png.w && e.y + e.h <= png.h, 'dalam batas atlas: ' + k);
  let op = 0; for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) { assert.strictEqual(owner[y * png.w + x], -1, 'tumpang tindih: ' + k); owner[y * png.w + x] = idx; if (png.alpha(x, y)) op++; }
  n++; ok(op > 0 && op === e.opaque, 'piksel buram di atlas = catatan json (' + op + '): ' + k);
  if (e.grid) ok(e.grid.cols * e.grid.cell === e.w && e.grid.rows * e.grid.cell === e.h, 'grid sesuai ukuran: ' + k); });
let stray = 0; for (let y = 0; y < png.h; y++) for (let x = 0; x < png.w; x++) if (owner[y * png.w + x] < 0 && png.alpha(x, y)) stray++;
ok(stray === 0, 'tidak ada piksel di luar entri json');
// Rebuild byte-identik bila paket sumber tersedia (opsional): CF_PACK=<folder Cute_Fantasy_Free> node tools/test_cf_atlas.js
if (process.env.CF_PACK && fs.existsSync(process.env.CF_PACK)) { const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'cf-'));
  require('child_process').execFileSync('python3', [path.join(root, 'tools/build_cf_tiles.py'), '--pack', process.env.CF_PACK, '--root', tmp]);
  ok(fs.readFileSync(path.join(tmp, 'assets/world/cf_atlas.png')).equals(fs.readFileSync(path.join(root, 'assets/world/cf_atlas.png'))) && fs.readFileSync(path.join(tmp, 'assets/world/cf_atlas.json'), 'utf8') === rd('assets/world/cf_atlas.json'), 'rebuild dari paket sumber identik'); }
// tidak mengubah peta/tileset desa: atlas baru tidak dirujuk data dunia; paket mentah tidak masuk repo
ok(!['assets/world/index.json', 'assets/world/village.json', 'assets/world/atlas.json'].some(f => /cf_atlas/.test(rd(f))), 'peta dan tileset desa tidak merujuk cf_atlas');
const cr = rd('CREDITS'); ok(/Cute Fantasy/.test(cr) && /Kenmi/.test(cr) && /non-?komersial/i.test(cr) && /cf_atlas/.test(cr) && /build_cf_tiles\.py/.test(cr), 'CREDITS mencatat Cute Fantasy (Kenmi) non-komersial');
const lic = rd('docs/LICENSE_AND_ASSETS.md'); ok(/Cute Fantasy/.test(lic) && /Kenmi/.test(lic) && /redistribusi/i.test(lic), 'LICENSE_AND_ASSETS mencatat syarat Cute Fantasy');
ok(!fs.existsSync(path.join(root, 'Cute_Fantasy_Free')) && !fs.existsSync(path.join(root, 'assets/world/Cute_Fantasy_Free')), 'paket mentah tidak dimasukkan ke repo');
console.log('PASS: atlas Cute Fantasy (' + n + ' pemeriksaan)');
