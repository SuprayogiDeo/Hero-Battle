#!/usr/bin/env node
'use strict';
/* Blok desa K3 (Batch 9B-30): kafe, toko serba ada, apartemen di Hutan Rimbun.
   Data peta (objek, kolisi 2 baris kaki, jalan depan pintu), registri pintu, masuk/keluar lewat alur nyata (hudCtx -> wInteract -> fade),
   menu kafe/toko dari dalam, dan semua pintu terjangkau jalan kaki dari spawn desa (BFS pada kolisi chunk). */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
const { context, vm } = mod.exports, ev = c => vm.runInContext(c, context, { timeout: 5000 });
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const rj = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const settle = () => { for (let i = 0; i < 60; i++) ev('updWorld(.016)'); };
const V = rj('assets/world/index.json'), IJ = rj('assets/world/interior.json'), W = V.w, H = V.h;
const col = new Uint8Array(W * H);
for (const c of V.chunks) { const d = rj('assets/world/' + c.file); for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) col[(d.y + y) * W + d.x + x] = d.layers.collision[y * d.w + x]; }
const IDS = { kafe: ['b_cafe', 'ccafe'], toko_kota: ['b_cshop', 'cshop'], apartemen: ['b_apt', 'capt'] };

// 1) data: sprite, objek, registri, kolisi kaki bangunan, jalan di depan pintu, area di dalam K3
for (const [id, [k, tpl]] of Object.entries(IDS)) {
  const B = ev(`INT_B.find(b=>b.id==='${id}')`), D = IJ.buildingDoors.find(d => d.id === id), o = V.objects.find(o => o.k === k);
  ok(B && B.tpl === tpl && D && D.tpl === tpl && !!o, 'terdaftar di INT_B, interior.json, dan objek peta: ' + id);
  ok(o.x === B.x && o.y === B.y && D.exterior.x === B.x && D.exterior.y === B.y, 'posisi sama di peta, INT_B, dan registri: ' + id);
  ok(!!V.spr[k] && V.spr[k].door.length === 4 && V.spr[k].w >= 56, 'sprite eksterior ada: ' + k);
  const fx = o.x >> 4, fy = (o.y - 1) >> 4;                       // tile kaki (baris bawah)
  ok(col[fy * W + fx] === 1 && col[(fy - 1) * W + fx] === 1 && col[(fy + 1) * W + fx] === 0, 'badan bangunan padat 2 baris, depan pintu bebas: ' + id);
  ok(V.grid[fy + 1][fx] === ',' && V.grid[fy + 1][fx - 1] === ',', 'jalan 2 petak di depan pintu: ' + id);
  ok(o.x >> 4 >= 101 && o.x >> 4 <= 122 && fy >= 5 && fy <= 18, 'di dalam lahan K3 (Hutan Rimbun): ' + id);
}
ok(V.objects.filter(o => /^b_(cafe|cshop|apt)$/.test(o.k || '')).length === 3, 'tepat 3 objek bangunan baru (tanpa duplikat)');
ok(!V.objects.some(o => /^(pine|tree|rock|bush|flower)_/.test(o.k || o.a || '') && (o.x >> 4) >= 100 && (o.x >> 4) <= 122 && ((o.y - 1) >> 4) >= 4 && ((o.y - 1) >> 4) <= 19), 'pohon/batu di lahan blok sudah ditebang');
ok(V.w === 128 && V.h === 96 && V.chunks.length === 12, 'peta desa tetap 128x96 dengan 12 chunk');

// 2) tumpang tindih: kotak badan tiap bangunan tidak beririsan dan tidak menimpa tempat penting
const boxes = Object.values(IDS).map(([k]) => { const o = V.objects.find(q => q.k === k), s = V.spr[k]; return [o.x - s.ax, o.y - s.h, o.x - s.ax + s.w, o.y]; });
for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const a = boxes[i], b = boxes[j]; ok(a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1], 'bangunan tidak saling menumpuk ' + i + '-' + j); }
for (const p of V.places) { const fp = p.footprint || [3, 3]; const px0 = p.x * 16, py0 = p.y * 16; ok(!boxes.some(b => px0 < b[2] && px0 + fp[0] * 16 > b[0] && py0 < b[3] && py0 + fp[1] * 16 > b[1]), 'tidak menimpa tempat: ' + p.id); }

// 3) alur nyata: berdiri di depan pintu -> MASUK -> di dalam -> KELUAR kembali ke posisi semula
for (const id of Object.keys(IDS)) {
  const B = ev(`INT_B.find(b=>b.id==='${id}')`), sx = B.x * 2, sy = B.y * 2 + 20;
  ev(`S.world={x:${sx},y:${sy}};best=10;st='world';wI=null;wFade=null;hudEnsure()`);
  ok(ev('hudCtx().l') === 'MASUK', 'konteks MASUK di depan pintu: ' + id);
  ev('wInteract()'); settle();
  ok(ev('!!wI') && ev('wI.b.id') === id, 'masuk ke interior: ' + id);
  ev('wI.x=wI.room.sx;wI.y=wI.room.sy;wI.near=intNear()');
  ok(ev('hudCtx().l') === 'KELUAR', 'dekat pintu dalam => KELUAR: ' + id);
  ev('wInteract()'); settle();
  ok(ev('wI') === null && Math.abs(ev('S.world.x') - sx) < 2 && Math.abs(ev('S.world.y') - sy) < 2, 'keluar kembali ke posisi di depan pintu: ' + id);
}

// 4) menu dari dalam: kafe -> menu kafe (st=inn), toko -> toko kota (st=cshop)
for (const [id, act, stt] of [['kafe', 'cafe', 'inn'], ['toko_kota', 'cshop', 'cshop']]) {
  const B = ev(`INT_B.find(b=>b.id==='${id}')`);
  ev(`S.world={x:${B.x * 2},y:${B.y * 2 + 20}};st='world';wI=null;wFade=null;hudEnsure();wInteract()`); settle();
  ev(`{const o=wI.room.objs.find(o=>o.act=='${act}');wI.x=o.x*WS+WS/2;wI.y=(o.y+1)*WS+16;wI.near=intNear()}`);
  ev('wInteract()'); settle();
  ok(ev('st') === stt, 'aksi ' + act + ' membuka ' + stt + ' dari gedung desa');
  ev("st='world'");
}

// 5) keterjangkauan: BFS dari spawn desa ke petak di depan tiap pintu (kolisi chunk, gerak 4 arah)
const sp = V.spawn, start = sp[1] * W + sp[0]; /* spawn = koordinat tile */ const seen = new Uint8Array(W * H), q = [start]; seen[start] = 1;
for (let h = 0; h < q.length; h++) { const c = q[h], x = c % W, y = (c / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy, i = yy * W + xx; if (xx < 0 || yy < 0 || xx >= W || yy >= H || seen[i] || col[i]) continue; seen[i] = 1; q.push(i); } }
for (const [id, [k]] of Object.entries(IDS)) { const o = V.objects.find(q => q.k === k); ok(seen[(((o.y - 1) >> 4) + 1) * W + (o.x >> 4)] === 1, 'pintu terjangkau dari spawn: ' + id); }
console.log('PASS: blok desa K3 (' + n + ' pemeriksaan)');
