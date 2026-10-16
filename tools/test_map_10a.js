#!/usr/bin/env node
'use strict';
/* Tes data peta 10A (tools/fix_map_10a.py): jalur Balai Desa, jalan timur jembatan, semak b_res5, batas ID tile. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const base = path.join(__dirname, '..', 'assets', 'world');
const I = JSON.parse(fs.readFileSync(path.join(base, 'index.json'), 'utf8'));
const W = I.w, H = I.h, L = { ground: [], shadow: [], decor: [], over: [], collision: [] };
Object.keys(L).forEach(k => { L[k] = new Array(W * H).fill(0); });
let maxId = 0;
I.chunks.forEach(c => { const d = JSON.parse(fs.readFileSync(path.join(base, c.file), 'utf8'));
  Object.keys(L).forEach(k => { for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) { const v = d.layers[k][yy * d.w + xx]; L[k][(d.y + yy) * W + d.x + xx] = v; if (k !== 'collision' && v > maxId) maxId = v; } }); });
const at = (k, x, y) => L[k][y * W + x], ch = (x, y) => I.grid[y][x]; let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const ROAD = 34, STAIR = [[77, 44], [76, 45], [77, 45], [74, 46], [75, 46], [72, 47], [73, 47], [69, 48], [70, 48], [71, 48], [67, 49], [68, 49], [66, 50]];
const PATH = []; for (let y = 44; y <= 47; y++) PATH.push([77, y]); for (let x = 76; x >= 66; x--) PATH.push([x, 47]);
const inList = (l, x, y) => l.some(c => c[0] === x && c[1] === y);
// (i) jalur Balai Desa: BFS lewat petak jalan (collision 0) dari depan pintu (77,44) sampai jalan utara-selatan x=65
const hall = I.places.find(p => p.id === 'village_hall'); ok(hall && hall.x === 77 && hall.y === 44, 'village_hall di (77,44)');
PATH.forEach(([x, y]) => { ok(at('collision', x, y) === 0 && at('ground', x, y) === ROAD && ch(x, y) === ',', 'jalur Balai Desa tidak berjalan di ' + x + ',' + y); });
{ const seen = new Set(['77,44']), q = [[77, 44]]; let reach = false;
  while (q.length) { const [x, y] = q.pop(); if (x === 65) { reach = true; break; }
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy, k = a + ',' + b; if (a < 0 || b < 0 || a >= W || b >= H || seen.has(k) || ch(a, b) !== ',' || at('collision', a, b)) return; seen.add(k); q.push([a, b]); }); }
  ok(reach, 'BFS: pintu Balai Desa tidak tersambung ke jalan x=65'); }
// (ii) petak tangga lama (yang tidak dipakai jalur baru) tidak lagi jalan: ground bukan 34, grid '.', decor 0, collision 0
STAIR.filter(([x, y]) => !inList(PATH, x, y)).forEach(([x, y]) => { ok(at('ground', x, y) !== ROAD && ch(x, y) === '.' && at('decor', x, y) === 0 && at('collision', x, y) === 0, 'bekas tangga masih jalan/terhalang di ' + x + ',' + y); });
// (iii) jalan timur jembatan: x 61..62 y 22..24 jalan berjalan, bukan air; x=63 y 23..24 jalan; tidak ada air di kolom 61..63 y 16..30
for (let x = 61; x <= 62; x++) for (let y = 22; y <= 24; y++) ok(at('ground', x, y) === ROAD && ch(x, y) === ',' && at('collision', x, y) === 0, 'jalan timur jembatan tidak berjalan di ' + x + ',' + y);
[[63, 23], [63, 24]].forEach(([x, y]) => ok(at('ground', x, y) === ROAD && at('collision', x, y) === 0, 'penyempitan timur tidak berjalan di ' + x + ',' + y));
for (let x = 61; x <= 63; x++) for (let y = 16; y <= 30; y++) ok(ch(x, y) !== '~', 'air di ' + x + ',' + y);
for (let y = 22; y <= 24; y++) ok(ch(60, y) === '+' && at('collision', 61, y) === 0, 'sambungan jembatan-jalan timur di y=' + y);
// (iv) semak bush_c tidak lebih dekat dari 3 petak ke pintu b_res5, jumlah bush_c tetap, sel padatnya konsisten
const res = I.objects.find(o => o.k === 'b_res5'), m = I.spr.b_res5, dx = Math.floor((res.x - m.ax + m.door[0] + m.door[2] / 2) / 16), dy = Math.floor(res.y / 16);
const bushes = I.objects.filter(o => o.k === 'bush_c'); ok(bushes.length === 16, 'jumlah bush_c berubah: ' + bushes.length);
bushes.filter(o => Math.abs(o.x / 16 - 50) < 12 && Math.abs(o.y / 16 - 14) < 8).forEach(o => { const fx = Math.floor(o.x / 16), fy = Math.floor((o.y - 1) / 16);
  ok(Math.hypot(fx - dx, fy - dy) >= 3, 'bush_c ' + fx + ',' + fy + ' < 3 petak dari pintu ' + dx + ',' + dy); ok(ch(fx, fy) === 'X' && at('collision', fx, fy) === 1, 'sel padat bush_c hilang di ' + fx + ',' + fy); });
ok(ch(50, 14) === '.' && at('collision', 50, 14) === 0, 'sel (50,14) bekas semak masih padat');
// (iv) dermaga desa 4x2 (tools/build_world.py --patch-dock): kayu '+', bisa dilewati, tersambung ke jalan desa & sambung ke air, jalur dari spawn tidak putus
{ const dock = I.places.find(p => p.id === 'village_dock'), dd = JSON.parse(fs.readFileSync(path.join(__dirname, 'world_design.json'), 'utf8')).places.find(p => p.id === 'village_dock');
  ok(dock && dd && dd.platform.w === 4 && dd.platform.h === 2, 'village_dock 4x2 ada di index.json dan world_design.json');
  const tiles = []; for (let y = 36; y <= 37; y++) for (let x = 29; x <= 32; x++) tiles.push([x, y]);
  tiles.forEach(([x, y]) => ok(ch(x, y) === '+' && at('ground', x, y) === 50 && at('collision', x, y) === 0 && at('decor', x, y) === 0 && at('over', x, y) === 0, 'tile dermaga ' + x + ',' + y + ' tidak bisa dilewati'));
  for (let x = 29; x <= 32; x++) { ok(ch(x, 35) === ',' && at('collision', x, 35) === 0, 'jalan desa menyentuh dermaga di ' + x + ',35'); ok(ch(x, 38) === '~', 'air di selatan dermaga ' + x + ',38'); }
  ok(ch(33, 37) === '~', 'tambatan perahu (33,37) harus air');
  const SOL = new Set('~TSRGQFX'.split('')), seen = new Set(), q = [[I.spawn[0], I.spawn[1]]]; seen.add(q[0].join(','));
  while (q.length) { const [x, y] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy, k = a + ',' + b; if (a < 0 || b < 0 || a >= W || b >= H || seen.has(k) || SOL.has(ch(a, b)) || at('collision', a, b)) return; seen.add(k); q.push([a, b]); }); }
  [[30, 37], [32, 37], [31, 36]].forEach(([x, y]) => ok(seen.has(x + ',' + y), 'BFS: dermaga ' + x + ',' + y + ' tidak terjangkau dari spawn')); }
// (v) semua ID tile < 160 (tiles.png 5 baris x 32)
ok(maxId < 160, 'ID tile terbesar ' + maxId + ' >= 160');
console.log('PASS: data peta 10A — jalur Balai Desa (BFS) + bekas tangga, jalan timur jembatan 3 petak, semak b_res5, dermaga desa 4x2 (BFS dari spawn), ID tile maks ' + maxId + ' < 160 (' + n + ' pemeriksaan)');
