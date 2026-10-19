#!/usr/bin/env node
'use strict';
/* Tes ikon masakan + umpan (Step 10b): atlas 16 sel 16x16 (7 masakan/umpan + 9 bahan ing_*) dari tools/build_dish_icons.py, semua resep LIFE_RECIPES + 'bait' punya sel,
   sel tidak kosong dan tidak identik, rebuild deterministik, dishIcon() menggambar sel yang benar dan jatuh ke badge teks bila gambar belum siap,
   menu Penginapan/Kafe/Toko memakainya, dan atlas masuk precache. Seni asli proyek: tanpa paket pihak ketiga. */
const fs = require('fs'), path = require('path'), assert = require('assert'), cp = require('child_process'), zlib = require('zlib');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
const { context, vm } = mod.exports, ev = c => vm.runInContext(c, context, { timeout: 5000 });
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// PNG kecil: baca IHDR + piksel RGBA (8-bit, tak berinterlace) tanpa dependensi
function readPng(f) { const b = fs.readFileSync(f); assert.strictEqual(b.slice(1, 4).toString(), 'PNG');
  let p = 8, w, h, ct, idat = []; while (p < b.length) { const len = b.readUInt32BE(p), t = b.slice(p + 4, p + 8).toString(), d = b.slice(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } if (t === 'IDAT') idat.push(d); p += 12 + len; }
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = ct === 6 ? 4 : ct === 2 ? 3 : 1, st = w * bpp, out = Buffer.alloc(h * st);
  for (let y = 0; y < h; y++) { const ft = raw[y * (st + 1)], r = raw.slice(y * (st + 1) + 1, (y + 1) * (st + 1));
    for (let x = 0; x < st; x++) { const a = x >= bpp ? out[y * st + x - bpp] : 0, u = y ? out[(y - 1) * st + x] : 0, c = x >= bpp && y ? out[(y - 1) * st + x - bpp] : 0;
      let v = r[x]; if (ft === 1) v += a; else if (ft === 2) v += u; else if (ft === 3) v += (a + u) >> 1; else if (ft === 4) { const pp = a + u - c, pa = Math.abs(pp - a), pb = Math.abs(pp - u), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c; }
      out[y * st + x] = v & 255; } }
  return { w, h, bpp, data: out }; }

const J = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/dish_icons.json'), 'utf8'));
const img = readPng(path.join(root, 'assets/world/dish_icons.png'));
const recipes = ev('LIFE_RECIPES.map(r=>r.id)');
ok(img.w === 16 * J.order.length && img.h === 16 && img.bpp === 4, 'atlas ' + img.w + 'x' + img.h + ' RGBA, ' + J.order.length + ' sel');
ok(recipes.length >= 6 && recipes.every(id => J.order.includes(id)) && J.order.includes('bait'), 'semua resep (' + recipes.join(',') + ') + bait punya sel');
ok(JSON.stringify(ev('DISH_ICON_ORDER')) === JSON.stringify(J.order), 'urutan DISH_ICON_ORDER di life.js = dish_icons.json');
const cell = i => { const o = []; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const k = (y * img.w + i * 16 + x) * 4; o.push(img.data.slice(k, k + 4).join(',')); } return o; };
const seen = new Set();
J.order.forEach((id, i) => { const c = cell(i), opaque = c.filter(p => !p.endsWith(',0')).length, partial = c.some(p => { const a = +p.split(',')[3]; return a > 0 && a < 255; });
  ok(opaque >= 60 && opaque <= 200, id + ': ' + opaque + ' piksel buram (wajar 60..200)'); ok(!partial, id + ': tanpa piksel setengah transparan'); ok(c[0].endsWith(',0') && c[15].endsWith(',0'), id + ': sudut transparan');
  const sig = c.join('|'); ok(!seen.has(sig), id + ': berbeda dari sel lain'); seen.add(sig); });

// rebuild deterministik: jalankan skrip ke folder sementara dan bandingkan byte
const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'dish-'));
cp.execFileSync('python3', ['-I', path.join(root, 'tools/build_dish_icons.py'), '--root', tmp]);
ok(fs.readFileSync(path.join(tmp, 'assets/world/dish_icons.png')).equals(fs.readFileSync(path.join(root, 'assets/world/dish_icons.png'))), 'rebuild menghasilkan PNG identik (deterministik)');
ok(fs.readFileSync(path.join(tmp, 'assets/world/dish_icons.json'), 'utf8') === fs.readFileSync(path.join(root, 'assets/world/dish_icons.json'), 'utf8'), 'rebuild menghasilkan json identik');

// dishIcon(): gambar sel yang benar saat atlas siap, badge teks saat belum siap / id tak dikenal
ev("var __dr=[],__ft=[];g.drawImage=function(){__dr.push([].slice.call(arguments))};g.fillRect=function(){__ft.push(1)}");
ev('DISH_ICON_IM.complete=true;Object.defineProperty(DISH_ICON_IM,"naturalWidth",{value:' + img.w + ',configurable:true})');
J.order.forEach((id, i) => { ev('__dr.length=0'); ok(ev(`dishIcon('${id}',10,20,32)`) === true, id + ': dishIcon true saat atlas siap'); const d = ev('__dr[0]');
  ok(d.length === 9 && d[1] === i * 16 && d[2] === 0 && d[3] === 16 && d[4] === 16 && d[5] === 10 && d[6] === 20 && d[7] === 32 && d[8] === 32, id + ': memotong sel ' + i + ' dan menggambar 32x32'); });
ev('__dr.length=0;__ft.length=0'); ok(ev("dishIcon('tak_dikenal',0,0,16)") === false && ev('__dr.length') === 0 && ev('__ft.length') > 0, 'id tak dikenal -> badge teks, tanpa drawImage');
ev('Object.defineProperty(DISH_ICON_IM,"naturalWidth",{value:0,configurable:true})'); ev('__dr.length=0'); ok(ev("dishIcon('fish_soup',0,0,16)") === false && ev('__dr.length') === 0, 'atlas belum siap -> badge teks');
ev('Object.defineProperty(DISH_ICON_IM,"naturalWidth",{value:' + img.w + ',configurable:true})');

// menu memakai ikon: Penginapan, Kafe, Toko menggambar dishIcon dengan id yang benar dan baris statistik ringkas
ev("S.set.lang='id';S.g=999;S.buff=null;S.inn=null;S.cshop=null;lifeEnsure();var __ids=[];var __di=dishIcon;dishIcon=function(id){__ids.push(id);return __di.apply(null,arguments)}");
const notIng = a => a.filter(i => !i.startsWith('ing_'));
ev("innV='inn';st='inn'"); ev('__ids.length=0;innDraw()'); ok(JSON.stringify(notIng(ev('__ids'))) === JSON.stringify(recipes), 'Penginapan menggambar ikon tiap resep berurutan');
// Step 12: tiap resep menggambar ikon bahan sesuai `needs` (urutan kunci), dan semua kunci bahan punya sel ing_<kunci>
const needs = ev('LIFE_RECIPES.map(r=>Object.keys(r.needs))'), allKeys = [...new Set(needs.flat())];
ok(allKeys.length >= 9 && allKeys.every(k => J.order.includes('ing_' + k)), 'semua bahan resep (' + allKeys.join(',') + ') punya sel ing_*');
ok(JSON.stringify(ev('__ids').filter(i => i.startsWith('ing_'))) === JSON.stringify(needs.flat().map(k => 'ing_' + k)), 'Penginapan menggambar ikon bahan tiap resep berurutan');
ok(ev("innRows().every((r,i)=>JSON.stringify(r.ing.map(q=>q[0]))===JSON.stringify(Object.keys(LIFE_RECIPES[i].needs)))") && ev("innRows().some(r=>r.ing.some(q=>q[1]===2))"), 'baris menu: ing = [kunci, jumlah] dari needs (ada jumlah 2)');
ev('__ids.length=0;__dr.length=0'); ev("ingIcon('tak_dikenal',0,0,16)"); ok(ev("JSON.stringify(__ids)") === '["ing_tak_dikenal"]' && ev('__dr.length') === 0, 'bahan tak dikenal -> badge teks, tanpa drawImage');
ev("innV='cafe';st='inn'"); ev('__ids.length=0;innDraw()'); ok(JSON.stringify(notIng(ev('__ids'))) === JSON.stringify(recipes), 'Kafe menggambar ikon tiap resep berurutan');
ev("st='cshop'"); ev('__ids.length=0;cshopDraw()'); ok(JSON.stringify(ev('__ids')) === '["bait"]', 'Toko Kota menggambar ikon umpan');
ok(ev("innRows().every(r=>typeof r.s==='string'&&r.s.length>0&&r.s.length<=40&&!r.s.includes('Sisa')&&!r.s.includes('emas')&&r.max===3)"), 'baris menu: s = statistik ringkas (<=40 huruf, tanpa stok/harga), max = stok harian');
ok(ev("innRows('cafe').every(r=>r.max===2)"), 'stok maksimum kafe = 2');
ev('dishIcon=__di');
['id', 'en'].forEach(l => { ev(`S.set.lang='${l}'`); ev("innV='cafe';st='inn'"); assert.doesNotThrow(() => ev('draw()')); ev("st='cshop'"); assert.doesNotThrow(() => ev('draw()')); n += 2; });
ev("S.set.lang='id';st='world'");

// precache
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
ok(sw.includes("'./assets/world/dish_icons.png'") && sw.includes("'./assets/world/dish_icons.json'"), 'atlas ikon masakan masuk precache sw.js');
console.log('Dish icon tests OK (' + n + ' checks)');
