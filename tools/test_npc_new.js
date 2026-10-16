#!/usr/bin/env node
/* Tes NPC baru (smith, healer, innkeeper): ada di NPCS, dekat Toko, dan tile-nya tidak solid di peta nyata. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), base = path.join(root, 'assets', 'world');
const I = JSON.parse(fs.readFileSync(path.join(base, 'index.json'), 'utf8')), W = I.w;
const col = new Array(W * I.h).fill(0), decor = new Array(W * I.h).fill(0);
I.chunks.forEach(c => { const d = JSON.parse(fs.readFileSync(path.join(base, c.file), 'utf8'));
  for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) { const i = (d.y + y) * W + d.x + x; col[i] = d.layers.collision[y * d.w + x]; decor[i] = d.layers.decor[y * d.w + x]; } });
const src = fs.readFileSync(path.join(root, 'js', 'npc.js'), 'utf8');
const list = src.slice(src.indexOf('const NPCS=['), src.indexOf('];', src.indexOf('const NPCS=[')) + 1);
const NPCS = new Function(list.replace('const NPCS=', 'return '))();
const SOLID = { T: 1, '~': 1, S: 1, R: 1, G: 1, Q: 1, F: 1, X: 1 }, [x0, y0, x1, y1] = I.bld.S;
['smith', 'healer', 'innkeeper'].forEach(id => {
  const o = NPCS.find(n => n.id === id); assert.ok(o, id + ' ada di NPCS');
  assert.ok(o.roam, id + ' harus roam:1 (keliling desa)');
  assert.ok(o.n[0] && o.n[1], id + ' punya nama 2 bahasa');
  assert.ok(src.includes("o.id=='" + id + "'"), id + ' punya cabang npcLines');
  const ch = I.grid[o.ty][o.tx], i = o.ty * W + o.tx;
  assert.ok(!SOLID[ch] && col[i] === 0 && decor[i] === 0, id + ' berdiri di tile solid (' + o.tx + ',' + o.ty + ')');
  assert.ok(Math.hypot(o.tx - (x0 + x1) / 2, o.ty - (y0 + y1) / 2) <= 6, id + ' jauh dari Toko');
  assert.ok(!NPCS.some(q => q !== o && q.tx === o.tx && q.ty === o.ty), id + ' bertumpuk dengan NPC lain');
});
assert.ok(/NPCV=\[\d+,\d+,\d+,\d+\]/.test(src) && src.includes('o.roam'), 'logika roam + batas desa NPCV ada');
{ const m = src.match(/NPCV=\[(\d+),(\d+),(\d+),(\d+)\]/).map(Number); NPCS.filter(o => o.roam).forEach(o => assert.ok(o.tx >= m[1] && o.tx <= m[3] && o.ty >= m[2] && o.ty <= m[4], o.id + ' mulai di luar batas desa')); }
// lampu jendela simetris, jadwal jam 12/jam 2, 8 warga ambient, Nelayan + perahu (cermin terhadap lebar sprite)
{ ['b_res2', 'b_res3', 'b_res5'].forEach(n => { const r = I.spr[n], c = r.win.map(q => q[0] + q[2] / 2).sort((a, b) => a - b); assert.equal(c.length, 2, n); assert.ok(Math.abs((c[0] + c[1]) - r.w) <= 1, n + ' jendela tidak simetris'); }); }
// jadwal harian: jam 12 NPC berkeliling, jam 2 pagi pulang (hilang dari jalan)
{ const vm = require('node:vm'); let H = 12;
  const ctx = { WS: 16, WFH: 9, WFV: 8, S: { world: { x: 2000, y: 2000 }, set: { lang: 'id' } }, wTalk: null, wDlg: 0, wNpc: null, best: 0, wSolid: () => false, lifeHour: () => H, Anim: undefined, Math, performance };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const run = c => vm.runInContext(c, ctx), smith = () => run("NPCS.find(o=>o.id=='smith')"), at = (o) => [o.px, o.py];
  const sx = 23 * 16 + 8, sy = 18 * 16 + 26;
  H = 12; assert.equal(run("npcAwake(NPCS[0])"), true, 'jam 12 NPC aktif');
  assert.equal(run(`npcHit(${sx},${sy})`), true, 'jam 12 NPC menghalangi di rumahnya');
  assert.ok(run(`npcNear(${sx},${sy})`), 'jam 12 NPC bisa diajak bicara');
  let moved = false; for (let i = 0; i < 400 && !moved; i++) { run('npcUpdate(0.1)'); const p = at(smith()); moved = Math.hypot(p[0] - sx, p[1] - sy) > 24; }
  assert.ok(moved, 'jam 12 NPC roam tidak berkeliling');
  H = 2; run('npcUpdate(0.1)'); const frozen = at(smith()); for (let i = 0; i < 50; i++) run('npcUpdate(0.1)');
  assert.deepEqual(at(smith()), frozen, 'jam 2 pagi NPC masih bergerak');
  assert.equal(run("npcAwake(NPCS[0])"), false, 'jam 2 NPC tidak aktif');
  assert.equal(run(`npcHit(${frozen[0]},${frozen[1]})`), false, 'jam 2 NPC masih menghalangi jalan');
  assert.equal(run(`npcNear(${frozen[0]},${frozen[1]})`), null, 'jam 2 NPC masih bisa diajak bicara');
  H = 8; run('npcUpdate(0.1)'); const m = at(smith()); assert.ok(Math.abs(m[0] - sx) < 1 && Math.abs(m[1] - sy) < 1, 'pagi NPC tidak muncul di rumah'); }
// warga ambient: 8 orang, tile awal tidak solid, 1 baris sapaan 2 bahasa, dan tidak pernah menembus tile solid saat berjalan
{ const vm = require('node:vm'), amb = NPCS.filter(o => o.ambient);
  assert.equal(amb.length, 8, 'harus ada 8 warga ambient, Nelayan + perahu');
  amb.forEach(o => { assert.ok(o.roam && o.sp > 0 && o.sp < 28, o.id + ' harus jalan pelan'); assert.ok(o.g && o.g.length >= 2 && o.g.every(l => l[0] && l[1]), o.id + ' sapaan 2 bahasa');
    const i = o.ty * W + o.tx; assert.ok(!SOLID[I.grid[o.ty][o.tx]] && col[i] === 0, o.id + ' mulai di tile solid'); });
  const wSolid = (px, py) => { const x = Math.floor(px / 16), y = Math.floor(py / 16); return !(x >= 0 && y >= 0 && x < W && y < I.h) || !!SOLID[I.grid[y][x]] || col[y * W + x] === 1; };
  const ctx = { WS: 16, WFH: 9, WFV: 8, S: { world: { x: 2000, y: 2000 }, set: { lang: 'id' } }, wTalk: null, wDlg: 0, wNpc: null, best: 0, wSolid, lifeHour: () => 12, Anim: undefined, Math, performance, wSn: false, wL: (a, b) => a };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  amb.forEach(o => { const l = vm.runInContext("npcLines(NPCS.find(o=>o.id=='" + o.id + "'))", ctx); assert.equal(l.length, 1, o.id + ' menyapa tepat satu baris'); });
  let steps = 0, far = 0;
  for (let i = 0; i < 6000; i++) { vm.runInContext('npcUpdate(0.1)', ctx);
    NPCS.forEach(() => 0); const arr = vm.runInContext('NPCS.filter(o=>o.ambient).map(o=>[o.id,o.px,o.py])', ctx);
    arr.forEach(([id, x, y]) => { steps++; assert.ok(!(wSolid(x - 9, y - 8) || wSolid(x + 9, y - 8) || wSolid(x - 9, y) || wSolid(x + 9, y)), id + ' menembus tile solid di ' + x.toFixed(1) + ',' + y.toFixed(1)); }); }
  const moved = vm.runInContext('NPCS.filter(o=>o.ambient&&Math.hypot(o.px-(o.tx*16+8),o.py-(o.ty*16+26))>16).length', ctx);
  assert.ok(moved >= 4, 'warga ambient harus benar-benar berjalan (' + moved + '/8 bergeser)'); }
// Nelayan + dermaga: jadwal per jam, waypoint perahu di air, perahu ikut culling/zoom
{ const vm = require('node:vm'); let H = 7;
  const draws = { n: 0 }, gm = new Proxy({}, { get: (_, k) => k === 'drawImage' ? () => { draws.n++; } : () => {}, set: () => true });
  const ctx = { WS: 32, WW: W, WH: I.h, WMAP: I.grid, WFH: 9, WFV: 8, S: { world: { x: 4000, y: 4000 }, set: { lang: 'id' } }, wTalk: null, wDlg: 0, wNpc: null, best: 0, lifeHour: () => H, Anim: undefined, Math, performance,
    wSolid: () => false, g: gm, OX: 0, VW: 640, IM: {}, HEROES: new Proxy({}, { get: () => ({ s: 'k', rar: 0 }) }), HID: new Proxy({}, { get: () => 'x' }), RC: ['#fff'], T() {}, spr() {}, t: 0, wL: (a, b) => a,
    Image: function () { this.complete = true; this.naturalWidth = 48; }, Object,
    lifeShopFishAdd() { ctx.restocks = (ctx.restocks || 0) + 1; }, lifeFisherQuest: () => ({ id: 'carp', done: 0 }), lifeFishById: () => ({ name: 'Ikan Mas', en: 'Carp' }), lifeFisherDeliver: () => 'need', LIFE_BAIT_REWARD: 2 };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const run = c => vm.runInContext(c, ctx), F = () => run("NPCS.find(o=>o.id=='fisher')"), tile = (x, y) => [Math.floor(x / 32), Math.floor(y / 32)], chAt = (x, y) => { const [a, b] = tile(x, y); return I.grid[b][a]; };
  const fish = NPCS.find(o => o.id === 'fisher'); assert.ok(fish && fish.sched === 'fisher' && fish.boat && fish.n[0] && fish.n[1], 'Nelayan ada, dua bahasa');
  assert.ok(!SOLID[I.grid[fish.ty][fish.tx]] && I.grid[fish.ty][fish.tx] === '+', 'Nelayan mulai di dermaga');
  assert.ok(src.includes("o.id=='fisher'"), 'Nelayan punya cabang npcLines');
  const BR = run('NPCBR'); BR.forEach(([x, y], i) => assert.equal(I.grid[Math.floor(y)][Math.floor(x)], '~', 'waypoint ' + i + ' bukan air'));
  for (let i = 1; i < BR.length; i++) for (let k = 0; k <= 40; k++) { const x = (BR[i - 1][0] + (BR[i][0] - BR[i - 1][0]) * k / 40) * 32, y = (BR[i - 1][1] + (BR[i][1] - BR[i - 1][1]) * k / 40) * 32;
    [[0, 0], [-18, 0], [18, 0]].forEach(([dx, dy]) => assert.equal(chAt(x + dx, y + dy) === '~' || chAt(x + dx, y + dy) === '+', true, 'segmen perahu ' + i + ' melewati tile solid')); }
  // pagi (jam 7): memancing di ujung dermaga
  H = 7; for (let i = 0; i < 300; i++) run('npcUpdate(0.1)'); assert.equal(F().st, 'fish', 'jam 7 harus memancing'); assert.deepEqual(tile(F().px, F().py), [30, 37]);
  // siang (jam 12): menjahit jaring di dermaga
  H = 12; for (let i = 0; i < 300; i++) run('npcUpdate(0.1)'); assert.equal(F().st, 'net', 'jam 12 harus memperbaiki jaring'); assert.deepEqual(tile(F().px, F().py), [31, 36]);
  // sore (jam 17): naik perahu, berlayar, memancing di tengah, kembali
  H = 17; const seen = new Set(); let aboardSteps = 0, fishWater = false;
  for (let i = 0; i < 4000; i++) { run('npcUpdate(0.1)'); const o = F(); seen.add(o.st);
    if (o.aboard) { aboardSteps++; assert.equal(chAt(o.bx, o.by), '~', 'perahu keluar dari air di ' + o.bx.toFixed(0) + ',' + o.by.toFixed(0)); if (['sail', 'back', 'cast'].includes(o.st)) assert.equal(o.px, o.bx); }
    else if (o.st === 'board' || o.st === 'unboard') assert.ok(chAt(o.px, o.py) === '+' || chAt(o.px, o.py) === '~', 'naik/turun perahu keluar dermaga');
    else assert.ok(chAt(o.px, o.py) === '+', 'nelayan di luar perahu harus di dermaga, st=' + o.st);
    if (o.st === 'cast') fishWater = true; if (seen.has('rest') && seen.has('cast')) break; }
  ['toboat', 'board', 'sail', 'cast', 'back', 'unboard', 'rest'].forEach(st => assert.ok(seen.has(st), 'tahap sore tidak tercapai: ' + st)); assert.ok(aboardSteps > 100 && fishWater, 'nelayan harus berlayar dan memancing');
  assert.deepEqual(tile(F().bx, F().by), [33, 37], 'perahu kembali ke tambatan');
  assert.equal(ctx.restocks, 1, 'stok Toko ditambah tepat sekali setelah Nelayan kembali berlayar');
  assert.ok(run("npcLines(NPCS.find(o=>o.id=='fisher'))").some(l => /Ikan Mas/.test(l) && /umpan langka/.test(l)), 'dialog Nelayan menyebut quest ikan dan umpan langka');
  { const rd = f => fs.readFileSync(path.join(root, 'js', f), 'utf8'); assert.ok(/'IKAN'\]/.test(rd('screens.js')) && rd('screens.js').includes('lifeShopFishDraw') && rd('input.js').includes('lifeShopFishClick') && rd('input.js').includes('[0,1,2,3,4]'), 'tab IKAN terpasang di layar Toko (screens.js + input.js)'); }
  // menggambar: perahu ikut culling dan zoom, selalu di salah satu dari dua pass
  const draw = (cx, pass) => { draws.n = 0; vm.runInContext('npcDraw(' + cx + ',0,0,' + pass + ')', ctx); return draws.n; };
  const pv = F().by + 400; H = 2; run('npcUpdate(0.1)'); // malam: nelayan pulang, perahu tertambat tetap tergambar
  const cam = F().bx - 300, drawn = () => (vm.runInContext('npcDraw(' + cam + ',' + (F().by - 800) + ',0)', ctx), 0);
  let total = 0; [0, 1].forEach(pass => { draws.n = 0; vm.runInContext('npcDraw(' + cam + ',' + (F().by - 200) + ',' + (F().by + 50) + ',' + pass + ')', ctx); total += draws.n; });
  assert.equal(total, 1, 'perahu harus tergambar tepat sekali (kamera dekat)');
  total = 0; [0, 1].forEach(pass => { draws.n = 0; vm.runInContext('npcDraw(0,' + (F().by - 200) + ',' + (F().by + 50) + ',' + pass + ')', ctx); total += draws.n; }); assert.equal(total, 0, 'perahu di luar layar harus di-cull');
  ctx.VW = 1280; ctx.OX = 0; total = 0; [0, 1].forEach(pass => { draws.n = 0; vm.runInContext('npcDraw(' + (F().bx - 1000) + ',' + (F().by - 200) + ',' + (F().by + 50) + ',' + pass + ')', ctx); total += draws.n; }); assert.equal(total, 1, 'zoom out: perahu harus ikut tergambar'); }
console.log('PASS: NPC baru tidak solid, dekat Toko, roam dalam batas desa; jendela simetris, jadwal jam 12/jam 2, 8 warga ambient, Nelayan + perahu');
