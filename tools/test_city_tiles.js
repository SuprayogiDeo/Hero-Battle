#!/usr/bin/env node
'use strict';
/* Atlas kota (CC0): assets/world/city/city_tiles.png/json dari tools/build_city_tiles.py. Semua entri json ada di atlas (batas, tidak tumpang tindih,
   piksel buram sama dengan catatan, tidak ada piksel liar), 16 tile 16x16 dengan nama yang dijanjikan, 3 prop + sprite rubah berlatar transparan,
   pratinjau 4x, CREDITS/LICENSE_AND_ASSETS mencatat CC0 + bantuan AI, cache dinaikkan, paket mentah tidak masuk repo, atlas belum dipakai runtime. */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), assert = require('assert');
const root = path.join(__dirname, '..'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
function readPng(buf) {   // PNG RGBA 8-bit -> {w,h,px(x,y)->[r,g,b,a]}; semua filter PNG
  ok(buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'tanda tangan PNG');
  let p = 8, w, h, ct, bd, idat = [];
  while (p < buf.length) { const len = buf.readUInt32BE(p), t = buf.toString('latin1', p + 4, p + 8), d = buf.slice(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; } else if (t === 'IDAT') idat.push(d); p += 12 + len; }
  return { w, h, ct, bd, idat };
}
function decode(info) {
  ok(info.ct === 6 && info.bd === 8, 'atlas RGBA 8-bit');
  const { w, h } = info, bpp = 4, stride = w * 4, raw = zlib.inflateSync(Buffer.concat(info.idat)), out = Buffer.alloc(h * stride); let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1)), cur = out.slice(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) { const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0; let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; } cur[i] = v & 255; }
    prev = cur; }
  return { w, h, alpha: (x, y) => out[y * stride + x * 4 + 3] };
}
const meta = JSON.parse(rd('assets/world/city/city_tiles.json'));
const info = readPng(fs.readFileSync(path.join(root, 'assets/world/city/city_tiles.png'))), png = decode(info);
ok(png.w === meta.width && png.h === meta.height && meta.version === 1 && meta.tileSize === 16, 'dimensi atlas = json');
ok(/venice menace/i.test(meta.source.author) && meta.source.license === 'CC0' && /AI/.test(meta.source.ai_disclosure), 'sumber, CC0 dan pengungkapan AI tercatat di json');
const keys = Object.keys(meta.entries);
ok(keys.length === meta.count && keys.length === 20, '20 entri (16 tile + 3 prop + 1 rubah)');
const TILES = ['grass_a', 'grass_b', 'sidewalk_a', 'sidewalk_b', 'sidewalk_c', 'cross_curb', 'cross_h', 'cross_v', 'road_h_a', 'road_h_b', 'road_v', 'road_cross', 'road_lanes_h', 'road_corner', 'road_t_a', 'road_t_b'];
ok(TILES.every(k => meta.entries[k] && meta.entries[k].kind === 'tile'), '16 tile bernama ada (grass_a/b, sidewalk_a/b/c, cross_h/v, road_*)');
ok(['prop_traffic_light', 'prop_street_lamp', 'prop_bench'].every(k => meta.entries[k] && meta.entries[k].kind === 'prop') && meta.entries.npc_fox_commuter.kind === 'sprite', 'tiga prop dan sprite rubah ada');
ok(keys.filter(k => k.startsWith('road_')).length >= 5, 'kelompok road_* lengkap');
// tile: tepat 16x16 pada grid 8x2 tanpa jarak
TILES.forEach((k, i) => { const e = meta.entries[k]; ok(e.w === 16 && e.h === 16 && e.x === (i % 8) * 16 && e.y === Math.floor(i / 8) * 16, 'tile 16x16 di grid: ' + k); });
// semua entri ada di atlas: di dalam batas, buram sesuai catatan, tidak tumpang tindih, latar transparan
const owner = new Int16Array(png.w * png.h).fill(-1);
keys.forEach((k, idx) => { const e = meta.entries[k];
  ok(Number.isInteger(e.x) && Number.isInteger(e.y) && e.w > 0 && e.h > 0 && e.x >= 0 && e.y >= 0 && e.x + e.w <= png.w && e.y + e.h <= png.h, 'dalam batas atlas: ' + k);
  let op = 0; for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) { assert.strictEqual(owner[y * png.w + x], -1, 'tumpang tindih: ' + k); owner[y * png.w + x] = idx; if (png.alpha(x, y)) op++; }
  n++; ok(op > 0 && op === e.opaque, 'piksel buram di atlas = catatan json (' + op + '): ' + k);
  if (e.kind === 'tile') ok(op >= 0.85 * 256, 'tile hampir penuh: ' + k);
  else { const c = [[0, 0], [e.w - 1, 0], [0, e.h - 1], [e.w - 1, e.h - 1]].filter(([dx, dy]) => png.alpha(e.x + dx, e.y + dy) === 0).length;
    ok(c >= 2 && op < e.w * e.h, 'latar transparan (sudut kosong): ' + k); }
  ok(e.sourceBox.length === 4 && /\.png$/.test(e.source), 'sumber tercatat: ' + k); });
ok(meta.entries.npc_fox_commuter.w <= 16 && meta.entries.npc_fox_commuter.h <= 16, 'rubah muat 16x16');
let stray = 0; for (let y = 0; y < png.h; y++) for (let x = 0; x < png.w; x++) if (owner[y * png.w + x] < 0 && png.alpha(x, y)) stray++;
ok(stray === 0, 'tidak ada piksel di luar entri json');
// pratinjau 4x
const pv = readPng(fs.readFileSync(path.join(root, 'docs/preview_city_tiles.png')));
ok(pv.w === png.w * 4 && pv.h === png.h * 4, 'docs/preview_city_tiles.png = atlas 4x');
// lisensi, cache, isolasi runtime
const credits = rd('CREDITS'), lic = rd('docs/LICENSE_AND_ASSETS.md');
ok(/city_tiles/.test(credits) && /CC0/.test(credits) && /AI/.test(credits) && /Venice Menace/.test(credits), 'CREDITS mencatat CC0, pengarang, dan bantuan AI');
ok(/city_tiles/.test(lic) && /CC0/.test(lic) && /AI/.test(lic) && /Venice Menace/.test(lic), 'LICENSE_AND_ASSETS mencatat CC0, pengarang, dan bantuan AI');
{ const sv = /const VERSION = '(v\d+)'/.exec(rd('sw.js')), vf = /cache: (v\d+)/.exec(rd('VERSION')); ok(sv && vf && sv[1] === vf[1], 'versi cache sw.js = VERSION'); }
const runtime = ['index.html', 'sw.js'].map(rd).concat(fs.readdirSync(path.join(root, 'js')).map(f => rd('js/' + f))).join('\n');
ok(/city_tiles/.test(runtime), 'atlas kota dirujuk kode runtime (js/city.js) dan precache (sejak Batch 9B-26)');
const tracked = []; (function walk(d) { for (const f of fs.readdirSync(d)) { if (f === 'node_modules' || f === '.git') continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : tracked.push(f); } })(root);
ok(!tracked.some(f => /^(sampler_tileset_16|sampler_props_3|fox_commuter_npc|modern-city-topdown-pack.*)\.(png|zip)$/.test(f)), 'paket mentah tidak ada di repo');
console.log('PASS: atlas kota CC0 — ' + n + ' pemeriksaan');
