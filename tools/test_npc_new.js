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
// lampu jendela simetris, jadwal jam 12/jam 2 (cermin terhadap lebar sprite)
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
console.log('PASS: NPC baru tidak solid, dekat Toko, roam dalam batas desa; jendela simetris, jadwal jam 12/jam 2');
