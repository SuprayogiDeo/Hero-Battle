#!/usr/bin/env node
'use strict';
/* Tes Penginapan (Step 12): pintu masuk/keluar, kecocokan registri interior.json dengan templat, menu masakan buff dari LIFE_RECIPES,
   pembelian (emas turun tepat harga, gagal bila emas kurang / stok habis / masakan sama masih aktif), stok harian + reset saat hari berganti,
   stok tersimpan setelah save+load, serta klik UI. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
const { context, vm } = mod.exports, ev = c => vm.runInContext(c, context, { timeout: 5000 });
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const settle = () => { for (let i = 0; i < 60; i++) ev('updWorld(.016)'); };
const stand = (act, dx) => ev(`{const o=wI.room.objs.find(o=>o.act=='${act}');wI.x=o.x*WS+WS*${dx};wI.y=(o.y+1)*WS+16;wI.near=intNear()}`);
const enter = () => { ev("S.world={x:200*2,y:320*2+20};best=10;st='world';wI=null;wFade=null;hudEnsure()"); ok(ev('hudCtx().l') === 'MASUK', 'pintu Penginapan memberi konteks MASUK'); ev('wInteract()'); settle(); };
const leave = () => { ev('wI.x=wI.room.sx;wI.y=wI.room.sy;wI.near=intNear()'); ok(ev('hudCtx().l') === 'KELUAR', 'dekat pintu => KELUAR'); ev('wInteract()'); settle(); };
const reset = g => ev(`S.g=${g};S.buff=null;S.inn=null`);
const price = id => ev(`innPrice(LIFE_RECIPES.find(r=>r.id==='${id}'))`);

// 1) registri: INT_B, templat, dan interior.json konsisten; rumah lama res1 sudah diganti
const IJ = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/interior.json'), 'utf8'));
const B = ev("INT_B.find(b=>b.id==='penginapan')"), T = ev('INT_T.inn'), D = IJ.buildingDoors.find(d => d.id === 'penginapan');
ok(B && B.tpl === 'inn' && !!T && !!D, 'penginapan terdaftar di INT_B, INT_T, dan interior.json');
ok(D.room.w === T.w && D.room.h === T.h && D.entry.x === T.dx && D.entry.y === T.h - 2 && D.exit.x === T.dx && D.exit.y === T.h - 1, 'registri pintu cocok dengan templat inn');
ok(D.exterior.x === B.x && D.exterior.y === B.y, 'posisi eksterior registri = INT_B');
ok(!ev("INT_B.some(b=>b.id==='res1')") && !IJ.buildingDoors.some(d => d.id === 'res1'), 'res1 sudah diganti (tak ada duplikat pintu)');
ok(ev('INT_B.length') === 17 && IJ.buildingDoors.length === 17 && new Set(ev('INT_B.map(b=>b.id)')).size === 17, '17 bangunan (14 lama + kafe/toko/apartemen di K3), id unik');
ok(T.o.some(o => o[5] === 'inn' && o[0] === 'vendor') && T.o.some(o => o[5] === 'inn' && o[0] === 'counter'), 'pemilik dan meja membuka menu');

// 2) pintu masuk/keluar dan membuka menu dari meja
enter(); ok(ev('!!wI') && ev('wI.b.id') === 'penginapan', 'masuk ke interior Penginapan');
ok(ev('S.world.x') === 400 && ev('S.world.y') === 660, 'posisi dunia tetap di pintu luar saat di dalam');
ev('S.set.lang="id"'); stand('inn', 0.5); ok(ev('hudCtx().on') !== 0 && ev('hudCtx().l') === 'MENU', 'dekat meja ada aksi MENU');
ev('wInteract()'); ok(ev('st') === 'inn', 'meja membuka layar menu Penginapan');
ok(ev('lifeInputState(40,10)') === true && ev('st') === 'world' && ev('!!wI'), 'KEMBALI menutup menu dan tetap di dalam Penginapan');
leave(); ok(ev('wI') === null, 'keluar kembali ke desa');

// 3) menu = semua resep LIFE_RECIPES, harga mengikuti rumus, UI tergambar di dua bahasa
const ids = ev('LIFE_RECIPES.map(r=>r.id)'); ev('S.g=1000;S.buff=null;S.inn=null');
ok(ids.length >= 4 && ev('innRows().map(r=>r.k)').join() === ids.join(), 'menu memuat semua resep: ' + ids.join(','));
ok(price('fish_soup') === 170, 'harga Sup Ikan = 170 (60 + 0.13*500 + 3*15), dapat ' + price('fish_soup'));
ok(ev('innRows().every(r=>r.g>0&&r.left===INN_STOCK&&r.ok)'), 'awal hari: stok penuh dan semua bisa dibeli');
ok(ev('innRows().length*48+62') <= 360, 'baris menu muat di layar 360');
['id', 'en'].forEach(l => { ev(`S.set.lang='${l}'`); ev("st='inn'"); assert.doesNotThrow(() => ev('innDraw()')); assert.doesNotThrow(() => ev('draw()')); n += 2; }); ev("S.set.lang='id';st='world'");

// 4) pembelian: emas turun tepat harga, buff sama dengan lifeCook (batas 10%), stok berkurang
reset(1000); const P = price('fish_soup'); const R0 = ev("LIFE_RECIPES.find(r=>r.id==='fish_soup')");
ok(ev("innBuy('fish_soup')") === 'ok' && ev('S.g') === 1000 - P, 'beli Sup Ikan: emas turun tepat ' + P);
const bf = ev('S.buff'); ok(bf.id === 'fish_soup' && bf.stages === R0.stages && bf.lastStage === null && bf.atk === Math.min(.10, R0.atk) && bf.hp === Math.min(.10, R0.hp), 'buff = resep (stat dibatasi 10%)');
ok(Math.abs(ev('healerBuffSum().atk') - .08) < 1e-9 && Math.abs(ev('healerBuffSum().hp') - .05) < 1e-9 && ev('healerBuffSum().on'), 'buff terhitung di healerBuffSum');
ok(ev('S.inn.sold.fish_soup') === 1 && ev("innLeft('fish_soup')") === ev('INN_STOCK') - 1, 'stok hari ini berkurang 1');
// masakan sama masih aktif: ditolak dan emas tidak berkurang
ok(ev("innBuy('fish_soup')") === 'active' && ev('S.g') === 1000 - P && ev('S.inn.sold.fish_soup') === 1, 'masakan sama masih aktif: ditolak, emas dan stok tetap');
// masakan lain menggantikan buff (seperti lifeCook)
const P2 = price('farm_stew'); ok(ev("innBuy('farm_stew')") === 'ok' && ev('S.buff.id') === 'farm_stew' && ev('S.g') === 1000 - P - P2, 'masakan lain menggantikan buff dan dibayar tepat');

// 5) emas kurang dan id tak dikenal: tak ada perubahan
reset(P - 1); ok(ev("innBuy('fish_soup')") === 'gold' && ev('S.g') === P - 1 && ev('S.buff') === null && !ev('S.inn.sold.fish_soup'), 'emas kurang 1: ditolak tanpa efek');
ok(ev("innBuy('tidak_ada')") === 'none' && ev('S.g') === P - 1, 'id tak dikenal ditolak');
reset(P); ok(ev("innBuy('fish_soup')") === 'ok' && ev('S.g') === 0, 'emas pas harga: berhasil, sisa 0');

// 6) stok harian: tepat INN_STOCK kali, lalu habis; hidangan lain tidak ikut habis
reset(100000); const SP = price('farm_stew'), K = ev('INN_STOCK');
for (let i = 0; i < K; i++) { ev('S.buff=null'); ok(ev("innBuy('farm_stew')") === 'ok', 'pembelian ke-' + (i + 1) + ' berhasil'); }
ok(ev('S.g') === 100000 - K * SP && ev("innLeft('farm_stew')") === 0, 'setelah ' + K + ' kali stok habis, emas turun ' + K + 'x harga');
ev('S.buff=null'); ok(ev("innBuy('farm_stew')") === 'stock' && ev('S.g') === 100000 - K * SP && ev('S.inn.sold.farm_stew') === K && ev('S.buff') === null, 'melebihi stok: ditolak tanpa efek');
ok(ev("innRows().find(r=>r.k==='farm_stew').ok") === false && ev("innRows().find(r=>r.k==='moon_broth').ok") === true, 'baris habis tak bisa dibeli, hidangan lain tetap bisa');
ok(ev("innBuy('moon_broth')") === 'ok', 'hidangan lain tetap bisa dibeli');

// 7) stok disimpan lewat save+load, dan reset saat hari berganti
ev('sv()'); ev("S=Object.assign({},Save.readMain())");
ok(ev('S.inn.sold.farm_stew') === K && ev('S.inn.d') === ev('today()') && ev("innLeft('farm_stew')") === 0, 'stok habis tetap habis setelah save+load (tak bisa dicurangi lewat muat ulang)');
ev("S.inn.d='1999-01-01'"); ok(ev("innLeft('farm_stew')") === K && ev('S.inn.d') === ev('today()') && !ev('S.inn.sold.farm_stew'), 'hari berganti: stok direset penuh');
ev('S.inn=null'); ok(ev("innLeft('fish_soup')") === K, 'save lama tanpa S.inn aman (dibuat otomatis)');
ev("S.inn={d:today(),sold:null}"); ok(ev("innLeft('fish_soup')") === K, 'S.inn rusak (sold null) dipulihkan');

// 8) klik UI: tombol BELI baris ke-3 membeli resep ke-3; klik di luar tombol tak membeli
reset(1000); ev("st='inn'"); const third = ids[2], P3 = price(third);
ok(ev('lifeInputState(300,62+96+20)') === true && ev('S.g') === 1000, 'klik di luar tombol BELI tidak membeli');
ev('lifeInputState(550,62+96+8+5)'); ok(ev('S.buff&&S.buff.id') === third && ev('S.g') === 1000 - P3, 'klik BELI baris 3 membeli ' + third);

ev("S.set.lang='id';st='world';wI=null");
console.log('Inn tests OK (' + n + ' checks)');
