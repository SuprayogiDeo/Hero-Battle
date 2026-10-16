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
// lampu jendela simetris (cermin terhadap lebar sprite)
{ ['b_res2', 'b_res3', 'b_res5'].forEach(n => { const r = I.spr[n], c = r.win.map(q => q[0] + q[2] / 2).sort((a, b) => a - b); assert.equal(c.length, 2, n); assert.ok(Math.abs((c[0] + c[1]) - r.w) <= 1, n + ' jendela tidak simetris'); }); }
console.log('PASS: NPC baru tidak solid, dekat Toko, roam dalam batas desa; jendela simetris');
