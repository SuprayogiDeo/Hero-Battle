#!/usr/bin/env node
'use strict';
/* Tes atlas ikon makanan (Step 11): food_icons16.png (64 ikon 16x16, Henry Software CC0) + food_icons32.png (53 ikon 32x32, ghostpixxells CC0) + food_icons.json.
   Mengunci: dimensi sheet, jumlah ikon, posisi di dalam sheet dan tanpa tumpang tindih, tiap sel berisi piksel (bukan kosong) dan unik, nama snake_case
   tanpa tabrakan, nama kunci yang dipakai menu ada, sha256 PNG cocok dengan json (cegah suntingan tak sengaja), precache sw.js, serta CREDITS dan
   docs/LICENSE_AND_ASSETS.md memuat kedua sumber. Rebuild butuh paket mentah (tak ada di repo), jadi determinisme dijaga lewat sha256. */
const fs = require('fs'), path = require('path'), assert = require('assert'), zlib = require('zlib'), crypto = require('crypto');
const root = path.join(__dirname, '..'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
function readPng(f) { const b = fs.readFileSync(f); assert.strictEqual(b.slice(1, 4).toString(), 'PNG');
  let p = 8, w, h, ct, idat = []; while (p < b.length) { const len = b.readUInt32BE(p), t = b.slice(p + 4, p + 8).toString(), d = b.slice(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } if (t === 'IDAT') idat.push(d); p += 12 + len; }
  assert.strictEqual(ct, 6, 'PNG harus RGBA'); const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 4, st = w * bpp, out = Buffer.alloc(h * st);
  for (let y = 0; y < h; y++) { const ft = raw[y * (st + 1)], r = raw.slice(y * (st + 1) + 1, (y + 1) * (st + 1));
    for (let x = 0; x < st; x++) { const a = x >= bpp ? out[y * st + x - bpp] : 0, u = y ? out[(y - 1) * st + x] : 0, c = x >= bpp && y ? out[(y - 1) * st + x - bpp] : 0;
      let v = r[x]; if (ft === 1) v += a; else if (ft === 2) v += u; else if (ft === 3) v += (a + u) >> 1; else if (ft === 4) { const pp = a + u - c, pa = Math.abs(pp - a), pb = Math.abs(pp - u), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c; }
      out[y * st + x] = v & 255; } }
  return { w, h, data: out }; }

const J = JSON.parse(rd('assets/world/food_icons.json')), names = Object.keys(J.icons);
const png = { 16: readPng(path.join(root, 'assets/world/' + J.sheets['16'].file)), 32: readPng(path.join(root, 'assets/world/' + J.sheets['32'].file)) };
ok(J.version === 1 && J.sheets['16'].cell === 16 && J.sheets['32'].cell === 32, 'json: versi 1, sel 16 dan 32');
ok(png[16].w === 128 && png[16].h === 128, 'sheet 16px = 128x128 (dapat ' + png[16].w + 'x' + png[16].h + ')');
ok(png[32].w === 256 && png[32].h === 224, 'sheet 32px = 256x224 (dapat ' + png[32].w + 'x' + png[32].h + ')');
ok(png[16].w === J.sheets['16'].w && png[16].h === J.sheets['16'].h && png[32].w === J.sheets['32'].w && png[32].h === J.sheets['32'].h, 'ukuran PNG = ukuran di json');
const by = s => names.filter(k => J.icons[k].s === s);
ok(by(16).length === 64 && J.count['16'] === 64 && by(32).length === 53 && J.count['32'] === 53, '64 ikon 16px + 53 ikon 32px');
ok(names.length === new Set(names).size && names.every(k => /^[a-z0-9_]+$/.test(k)), 'nama unik dan snake_case');
ok(by(32).every(k => k.startsWith('big_')) && by(16).every(k => !k.startsWith('big_')), 'ikon 32px berawalan big_, 16px tidak (tak bertabrakan)');

// posisi: di dalam sheet, sejajar sel, tanpa tumpang tindih, tiap sel berisi piksel buram dan berbeda
[16, 32].forEach(s => { const seen = new Set(), sigs = new Set(), P = png[s];
  by(s).forEach(k => { const o = J.icons[k]; ok(o.x % s === 0 && o.y % s === 0 && o.x + s <= P.w && o.y + s <= P.h, k + ': sel sejajar dan di dalam sheet');
    const key = o.x + ',' + o.y; ok(!seen.has(key), k + ': tidak menumpuk'); seen.add(key);
    let op = 0, parts = []; for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const i = ((o.y + y) * P.w + o.x + x) * 4, a = P.data[i + 3]; if (a > 0) op++; parts.push(P.data.slice(i, i + 4).join(',')); }
    ok(op >= s * s * .12, k + ': ' + op + ' piksel buram (>= 12% sel)'); const sig = parts.join('|'); ok(!sigs.has(sig), k + ': berbeda dari ikon lain'); sigs.add(sig); });
  // sel di luar ikon (sisa grid) harus transparan penuh
  const used = new Set(by(s).map(k => J.icons[k].x + ',' + J.icons[k].y)); let stray = 0;
  for (let cy = 0; cy < P.h; cy += s) for (let cx = 0; cx < P.w; cx += s) if (!used.has(cx + ',' + cy)) for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) if (P.data[((cy + y) * P.w + cx + x) * 4 + 3]) stray++;
  ok(stray === 0, 'sheet ' + s + 'px: sel tak terpakai transparan'); });

// nama kunci yang akan dipakai menu (bahan dan masakan)
['fish', 'eggs', 'cheese', 'apple', 'strawberry', 'cherry', 'onion', 'tomato', 'potato', 'bread', 'honey', 'big_ramen', 'big_omlet', 'big_curry', 'big_roastedchicken', 'big_salmon', 'big_bowl', 'big_dish', 'big_friedegg', 'big_spaghetti', 'big_steak']
  .forEach(k => ok(!!J.icons[k], 'ikon ' + k + ' ada'));

// sha256 PNG cocok (tak ada suntingan tak sengaja)
['food_icons16.png', 'food_icons32.png'].forEach(f => ok(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'assets/world/' + f))).digest('hex') === J.sha256[f], f + ': sha256 cocok dengan json'));

// precache, pratinjau, kredit, lisensi
const sw = rd('sw.js'); ['food_icons16.png', 'food_icons32.png', 'food_icons.json'].forEach(f => ok(sw.includes("'./assets/world/" + f + "'"), f + ' masuk precache sw.js'));
ok(fs.existsSync(path.join(root, 'docs/preview_food_icons.png')), 'pratinjau docs/preview_food_icons.png ada');
const cr = rd('CREDITS'), lic = rd('docs/LICENSE_AND_ASSETS.md');
ok(/Henry Software/.test(cr) && /ghostpixxells/.test(cr) && /build_food_icons\.py/.test(cr), 'CREDITS memuat Henry Software, ghostpixxells, dan skrip build');
ok(/Henry Software/.test(lic) && /ghostpixxells/.test(lic) && /CC0/.test(lic), 'LICENSE_AND_ASSETS memuat kedua sumber (CC0)');
ok(!fs.readdirSync(path.join(root, 'assets/world')).some(f => /Food\.png$|^\d+_/.test(f)), 'paket mentah tidak ada di assets/world');
console.log('Food icon tests OK (' + n + ' checks)');
