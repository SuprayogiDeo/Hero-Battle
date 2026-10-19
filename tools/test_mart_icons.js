#!/usr/bin/env node
'use strict';
/* Tes atlas barang toko + buah (Step 13): mart_icons.png (150 ikon 32x32, Pixel Mart ghostpixxells CC0) + fruit_icons.png (sheet 608x96 = 38x6 sel 16x16,
   Fruit Ninjikin/SciGho CC BY 4.0 -> WAJIB kredit) + mart_icons.json. Mengunci dimensi, jumlah, posisi tanpa tumpang tindih, sel berisi dan unik (barang),
   nama kunci untuk Toko Kota, sha256, precache, serta CREDITS/lisensi (termasuk kredit SciGho). Rebuild butuh paket mentah, jadi determinisme dijaga sha256. */
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

const J = JSON.parse(rd('assets/world/mart_icons.json')), names = Object.keys(J.icons);
const png = { mart: readPng(path.join(root, 'assets/world/' + J.sheets.mart.file)), fruit: readPng(path.join(root, 'assets/world/' + J.sheets.fruit.file)) };
ok(J.version === 1 && J.sheets.mart.cell === 32 && J.sheets.fruit.cell === 16, 'json: versi 1, sel 32 (barang) dan 16 (buah)');
ok(png.mart.w === 480 && png.mart.h === 320 && png.fruit.w === 608 && png.fruit.h === 96, 'sheet barang 480x320, sheet buah 608x96');
ok(png.mart.w === J.sheets.mart.w && png.mart.h === J.sheets.mart.h && png.fruit.w === J.sheets.fruit.w && png.fruit.h === J.sheets.fruit.h, 'ukuran PNG = ukuran di json');
const mart = names.filter(k => k.startsWith('mart_')), fruit = names.filter(k => k.startsWith('fruit_'));
ok(mart.length === 150 && J.count.mart === 150 && fruit.length === 228 && J.count.fruit === 228 && mart.length + fruit.length === names.length, '150 barang + 228 sel buah, tanpa nama lain');
ok(names.length === new Set(names).size && names.every(k => /^[a-z0-9_]+$/.test(k)), 'nama unik dan snake_case');
ok(mart.every(k => J.icons[k].s === 32) && fruit.every(k => J.icons[k].s === 16 && /^fruit_r[0-5]c([0-9]|[12][0-9]|3[0-7])$/.test(k)), 'ukuran sel per jenis dan format nama buah fruit_r<baris>c<kolom>');

[['mart', mart, 32], ['fruit', fruit, 16]].forEach(([sh, list, s]) => { const P = png[sh], seen = new Set(), sigs = new Set();
  list.forEach(k => { const o = J.icons[k]; ok(o.x % s === 0 && o.y % s === 0 && o.x + s <= P.w && o.y + s <= P.h, k + ': sel sejajar dan di dalam sheet');
    const key = o.x + ',' + o.y; ok(!seen.has(key), k + ': tidak menumpuk'); seen.add(key);
    let op = 0, parts = []; for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const i = ((o.y + y) * P.w + o.x + x) * 4; if (P.data[i + 3] > 0) op++; parts.push(P.data.slice(i, i + 4).join(',')); }
    ok(op >= s * s * .1, k + ': ' + op + ' piksel buram (>= 10% sel)');
    if (sh === 'mart') { const sig = parts.join('|'); ok(!sigs.has(sig), k + ': berbeda dari barang lain'); sigs.add(sig); } }); });
// sel sisa pada sheet barang harus transparan (150 = 15x10 penuh, jadi tak ada sisa; tetap dijaga)
const used = new Set(mart.map(k => J.icons[k].x + ',' + J.icons[k].y)); let stray = 0;
for (let cy = 0; cy < png.mart.h; cy += 32) for (let cx = 0; cx < png.mart.w; cx += 32) if (!used.has(cx + ',' + cy)) stray++;
ok(stray === 0, 'sheet barang terisi penuh (tak ada sel kosong)');

// nama kunci yang akan dipakai Toko Kota (bahan masakan) dan buah
['mart_egg_brown', 'mart_egg_white', 'mart_milk_bottle', 'mart_white_cheese', 'mart_butter', 'mart_flour', 'mart_sugar', 'mart_salt', 'mart_mushroom_white', 'mart_salmon', 'mart_fish',
 'mart_strawberry_jam', 'mart_olive_oil', 'mart_potato', 'mart_red_apple', 'mart_green_apple', 'mart_banana', 'mart_water', 'fruit_r0c0', 'fruit_r5c37'].forEach(k => ok(!!J.icons[k], 'ikon ' + k + ' ada'));

['mart_icons.png', 'fruit_icons.png'].forEach(f => ok(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'assets/world/' + f))).digest('hex') === J.sha256[f], f + ': sha256 cocok dengan json'));
const sw = rd('sw.js'); ['mart_icons.png', 'fruit_icons.png', 'mart_icons.json'].forEach(f => ok(sw.includes("'./assets/world/" + f + "'"), f + ' masuk precache sw.js'));
ok(fs.existsSync(path.join(root, 'docs/preview_mart_icons.png')), 'pratinjau docs/preview_mart_icons.png ada');
const cr = rd('CREDITS'), lic = rd('docs/LICENSE_AND_ASSETS.md');
ok(/Pixel Mart/.test(cr) && /ghostpixxells/.test(cr) && /SciGho/.test(cr) && /CC BY 4\.0/.test(cr) && /build_mart_icons\.py/.test(cr), 'CREDITS memuat Pixel Mart, ghostpixxells, kredit SciGho (CC BY 4.0), dan skrip build');
ok(/Pixel Mart/.test(lic) && /SciGho/.test(lic) && /CC BY 4\.0/.test(lic), 'LICENSE_AND_ASSETS memuat Pixel Mart dan Fruit (CC BY 4.0, kredit wajib)');
ok(!fs.readdirSync(path.join(root, 'assets/world')).some(f => /^(Fruit\+|Pixel_Mart)/i.test(f)), 'paket mentah tidak ada di assets/world');
console.log('Mart icon tests OK (' + n + ' checks)');
