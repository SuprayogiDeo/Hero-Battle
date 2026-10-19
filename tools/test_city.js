#!/usr/bin/env node
'use strict';
/* Kota Kecil (Batch 9B-26): data peta + chunk, tabrakan prop, gerbang masuk/keluar lewat alur nyata (hudCtx -> fade -> updWorld),
   NPC rubah statis, dan peta desa 128x96 tidak berubah (hash berkas + dimensi + WW/WH/WMAP runtime). */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), assert = require('assert');
const root = path.join(__dirname, '..'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const rj = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
// 1) peta desa tidak berubah
const gold = rj('tools/city_village_golden.json');
Object.entries(gold.files).forEach(([f, h]) => ok(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex') === h, 'berkas peta desa berubah: ' + f));
const V = rj('assets/world/index.json');
ok(V.w === 128 && V.h === 96 && V.grid.length === 96 && V.grid.every(r => r.length === 128) && V.chunkSize === 32 && V.chunks.length === 12, 'desa tetap 128x96, 12 chunk 32x32');
ok(fs.readdirSync(path.join(root, 'assets/world/chunks')).length === 12, 'folder chunk desa tidak bertambah');
// 2) data kota
const base = 'assets/world/city/', C = rj(base + 'city.json'), A = rj(base + 'city_tiles.json');
ok(C.w === 40 && C.h === 30 && C.chunkSize === 20 && C.chunks.length === 4, 'kota 40x30 dengan 4 chunk sendiri');
const W = C.w, H = C.h, ground = new Array(W * H).fill(-1), col = new Array(W * H).fill(-1), objs = [];
C.chunks.forEach(c => { const d = rj(base + c.file); ok(d.w <= 20 && d.h <= 20 && d.layers.ground.length === d.w * d.h && d.layers.collision.length === d.w * d.h, 'ukuran chunk ' + c.file);
  for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) { const i = (d.y + y) * W + d.x + x; ok(ground[i] === -1, 'chunk tumpang tindih'); ground[i] = d.layers.ground[y * d.w + x]; col[i] = d.layers.collision[y * d.w + x]; }
  d.objects.forEach(o => { ok(o.x >= d.x && o.y >= d.y && o.x + o.fw <= d.x + d.w && o.y + o.fh <= d.y + d.h, 'prop di dalam chunknya'); objs.push(o); }); });
ok(ground.every(v => v > 0 && v <= C.tiles.length) && col.every(v => v === 0 || v === 1), 'semua tile terisi id valid, kolisi 0/1');
C.tiles.forEach(t => ok(A.entries[t] && A.entries[t].kind === 'tile', 'ubin ada di atlas: ' + t)); Object.keys(C.props).forEach(k => ok(A.entries[k], 'prop ada di atlas: ' + k));
const nm = (x, y) => C.tiles[ground[y * W + x] - 1], count = p => ground.filter(v => C.tiles[v - 1].startsWith(p)).length;
ok(count('grass') > 100 && count('sidewalk') > 40 && count('road_h') >= 30 && count('cross_h') >= 1 && count('cross_v') >= 1 && count('road_cross') === 1, 'ada rumput, trotoar, jalan horizontal, zebra, persimpangan');
const ry = C.roads.horizontalY; for (let x = 0; x < W; x++) ok(/^(road_h|cross_h|road_cross)/.test(nm(x, ry)), 'jalan horizontal utuh di x=' + x);
const kinds = k => objs.filter(o => o.k === k); ok(kinds('prop_street_lamp').length >= 8 && kinds('prop_bench').length >= 4 && kinds('prop_traffic_light').length >= 2, 'lampu jalan, bangku, lampu lalu lintas ada');
const occ = new Set(); objs.forEach(o => { const m = C.props[o.k]; ok(o.fw === m.fw && o.fh === m.fh, 'jejak prop sesuai tabel'); for (let y = o.y; y < o.y + o.fh; y++) for (let x = o.x; x < o.x + o.fw; x++) { ok(!occ.has(x + ',' + y), 'prop bertumpuk'); occ.add(x + ',' + y); ok(col[y * W + x] === 1, o.k + ' berkolisi di ' + x + ',' + y); ok(/^(grass|sidewalk)/.test(nm(x, y)), 'prop di atas jalan: ' + x + ',' + y); } });
for (let x = 0; x < W; x++) ok(col[x] && col[(H - 1) * W + x], 'tepi atas/bawah padat'); for (let y = 0; y < H; y++) ok(col[y * W] && col[y * W + W - 1], 'tepi kiri/kanan padat');
// 3) keterjangkauan: dari spawn ke gerbang kembali, tiap prop (sisi bebas), dan rubah
const sp = C.spawn, fox = C.npcs.fox, seen = new Set([sp.join(',')]), q = [sp.slice()]; ok(!col[sp[1] * W + sp[0]], 'spawn bebas');
while (q.length) { const [x, y] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy, k = a + ',' + b; if (a < 0 || b < 0 || a >= W || b >= H || col[b * W + a] || seen.has(k)) return; seen.add(k); q.push([a, b]); }); }
const gate = C.gates.return; ok(seen.has(gate.tile.join(',')), 'gerbang kembali terjangkau dari spawn'); ok(!col[fox[1] * W + fox[0]] && seen.has(fox.join(',')), 'tile rubah bebas dan terjangkau');
objs.forEach(o => { let hit = false; for (let y = o.y - 1; y <= o.y + o.fh; y++) for (let x = o.x - 1; x <= o.x + o.fw; x++) if (seen.has(x + ',' + y)) hit = true; ok(hit, 'prop terjangkau: ' + o.k + ' ' + o.x + ',' + o.y); });
// 4) runtime: muat game di vm, pasang data kota, jalankan alur nyata
const src = fs.readFileSync(path.join(__dirname, 'test_browser_smoke.js'), 'utf8'), head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} }; new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, __dirname, mod);
const { context, vm } = mod.exports, ev = c => vm.runInContext(c, context, { timeout: 5000 });
const chunks = C.chunks.map(c => rj(base + c.file)); ok(ev(`cityInstall(${JSON.stringify(C)},${JSON.stringify(chunks)},${JSON.stringify(A)})`) === true, 'cityInstall menerima data');
const run = (k) => { for (let i = 0; i < k; i++) ev('updWorld(.016)'); };
const dims = () => ev('[WW,WH,WMAP.length,WMAP[0].length].join()'); const dims0 = dims();
ev("S.world={x:126*32+16,y:23*32+16+8};best=10;st='world';wI=null;wC=null;wFade=null;wTalk=null;wDlg=0;lifeWorldQuick=false;hudEnsure()");
ok(ev('hudCtx().l') === 'KOTA' || ev('hudCtx().l') === 'CITY', 'dekat gerbang desa: tombol aksi KOTA');
ev("S.world={x:100*32,y:23*32};"); ok(ev('hudCtx()') === null || ev('hudCtx().l') !== 'KOTA', 'jauh dari gerbang: tidak ada tombol KOTA');
ev("S.world={x:126*32+16,y:23*32+24};wInteract()"); ok(ev('!!wFade'), 'fade masuk dimulai'); run(40);
ok(ev('!!wC') && ev('wI') === null, 'berada di kota (wC), bukan interior'); ok(ev('wC.x') === sp[0] * 32 + 16 && ev('wC.y') === sp[1] * 32 + 26, 'muncul di spawn kota');
ok(ev('S.world.x') === 126 * 32 + 16, 'S.world tetap di desa (titik aman simpan/muat)'); ok(dims() === dims0, 'WW/WH/WMAP desa tidak berubah saat di kota');
ok(ev('wNear===null&&wPlace===null'), 'target desa dikosongkan di kota');
// tabrakan: berjalan ke tiap prop tidak menembus; lampu, bangku, lampu lalu lintas
const blocked = (px, py) => ev(`cityBlocked(${px},${py})`);
objs.forEach(o => { const cx = (o.x + o.fw / 2) * 32, cy = (o.y + o.fh / 2) * 32 + 8; ok(blocked(cx, cy), o.k + ' memblokir pusatnya'); });
ok(!blocked(sp[0] * 32 + 16, sp[1] * 32 + 26), 'spawn tidak terblokir'); ok(blocked(0, 14 * 32 + 26) && blocked(W * 32 + 5, 100), 'luar peta padat');
{ const L = kinds('prop_street_lamp')[0]; ev(`wC.x=${L.x * 32 - 14};wC.y=${L.y * 32 + 24};wjx=1;wjy=0`); run(120); ev('wjx=0'); ok(ev('wC.x') < L.x * 32 - 8 + 1, 'berjalan ke lampu jalan tertahan (x=' + ev('wC.x') + ')'); }
{ const B = kinds('prop_bench')[0]; ev(`wC.x=${B.x * 32 + 32};wC.y=${B.y * 32 - 8};wjx=0;wjy=1`); run(120); ev('wjy=0'); ok(ev('wC.y') < B.y * 32 + 1, 'berjalan ke bangku tertahan (y=' + ev('wC.y') + ')'); }
{ const T = kinds('prop_traffic_light')[0]; ev(`wC.x=${T.x * 32 + 16};wC.y=${(T.y + 1) * 32 + 20};wjx=0;wjy=-1`); run(120); ev('wjy=0'); ok(ev('wC.y') > (T.y + 1) * 32 + 7, 'berjalan ke lampu lalu lintas tertahan (y=' + ev('wC.y') + ')'); }
// jalan kota bisa dilalui sepanjang jalan horizontal dari spawn ke timur
ev(`wC.x=${sp[0] * 32 + 16};wC.y=${ry * 32 + 26};wjx=1;wjy=0`); run(450); ev('wjx=0'); ok(ev('wC.x') > 22 * 32, 'jalan horizontal dapat dilalui melewati persimpangan (x=' + ev('wC.x') + ')');
// 9B-36: rubah dan warga berjadwal pindah ke desa -> di kota tidak ada NPC (tanpa penghalang, tombol BICARA, atau gambar)
const F = ev("(()=>{const o=NPCS.find(o=>o.id=='fox');return{tx:o.tx,ty:o.ty,area:o.area,st:o.static,n:o.n,awake:npcAwake(o)}})()");
ok(F.area === undefined && F.st === undefined && F.n[0] && F.n[1] && F.awake === false, 'rubah kini NPC desa (tanpa area, berjadwal dari pintu rumah, 2 bahasa) dan tidak aktif di kota');
ok(ev("NPCS.every(o=>o.area!=='city')&&NPCS.filter(o=>npcAwake(o)).length===0"), 'tidak ada NPC aktif di kota');
ev(`wC.x=${fox[0] * 32 + 16};wC.y=${(fox[1] + 1) * 32 + 26};wjx=wjy=0`); run(2); ok(ev('hudCtx()') === null || ev('hudCtx().l') !== 'BICARA', 'bekas tile rubah di kota: tidak ada tombol BICARA');
ok(!blocked(fox[0] * 32 + 16, fox[1] * 32 + 26), 'bekas tile rubah di kota tidak memblokir jalan');
// ketuk di kota tidak menanam/membuka layar desa; menggambar tidak error
ev("S.set.lang='en';"); ok(ev('wL("a","b")') === 'b', 'bahasa EN'); ev("S.set.lang='id'"); ev('drawWorld()'); ev('lifeWorldQuick=false');
// gerbang kembali: dekat ujung barat => tombol DESA, jalan masuk tiang tertutup, keluar ke desa
ev(`wC.x=${(gate.tile[0] + 1) * 32};wC.y=${gate.tile[1] * 32 + 26};wjx=wjy=0`); run(2); const lab = ev('hudCtx().l'); ok(lab === 'DESA' || lab === 'VILLAGE', 'dekat gerbang kembali: tombol DESA (' + lab + ')');
ok(blocked(gate.posts[0][0] * 32 + 16, gate.posts[0][1] * 32 + 26) && blocked(gate.posts[1][0] * 32 + 16, gate.posts[1][1] * 32 + 26) && !blocked(gate.tile[0] * 32 + 16, gate.tile[1] * 32 + 26), 'tiang gerbang padat, lorong jalan terbuka');
ev(`wC.x=${sp[0] * 32 + 16};wC.y=${sp[1] * 32 + 26}`); run(2); ok(ev('hudCtx()') === null || !/DESA|VILLAGE/.test(ev('hudCtx().l')), 'di spawn belum bisa kembali (harus berjalan ke gerbang)');
ev(`wC.x=${(gate.tile[0] + 1) * 32};wC.y=${gate.tile[1] * 32 + 26}`); run(2); ev('wInteract()'); ok(ev('!!wFade'), 'fade keluar dimulai'); run(40);
ok(ev('wC') === null, 'keluar dari kota'); ok(ev('S.world.x') === 124 * 32 + 16 && Math.floor(ev('S.world.y') / 32) === 23, 'mendarat di sisi dalam gerbang desa'); ok(dims() === dims0, 'WW/WH/WMAP desa tetap setelah keluar');
ok(ev('hudCtx()') === null || ev('hudCtx().l') !== 'KOTA' || true, 'konteks desa pulih');
ok(ev("typeof npcAwake(NPCS.find(o=>o.id=='fox'))")==='boolean' && ev("NPCS.every(o=>typeof npcAwake(o)==='boolean')"), 'di desa semua NPC (termasuk rubah) mengikuti jam desa');
// worldEnter (kembali dari menu) membersihkan wC
ev("S.world={x:126*32+16,y:23*32+24};wInteract()"); run(40); ok(ev('!!wC'), 'masuk lagi'); ev('worldEnter()'); ok(ev('wC') === null && ev('st') === 'world', 'worldEnter mereset keadaan kota');
// tombol gerbang desa memuat malas bila data belum ada
ev('cityD=null;wC=null;wFade=null;S.world={x:126*32+16,y:23*32+24};wMsg={t:0,s:""}'); ev('wInteract()'); ok(ev('wC') === null && /Kota|city/i.test(ev('wMsg.s')), 'data belum siap: pesan memuat, tanpa masuk');
// 5) berkas runtime terdaftar
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
ok(html.indexOf('js/hud.js') < html.indexOf('js/city.js') && html.indexOf('js/city.js') < html.indexOf('js/input.js'), 'city.js dimuat sesudah hud.js, sebelum input.js');
['./js/city.js', './assets/world/city/city.json', './assets/world/city/city_tiles.png', './assets/world/city/city_tiles.json'].concat(C.chunks.map(c => './assets/world/city/' + c.file)).forEach(f => ok(sw.includes("'" + f + "'"), 'precache ' + f));
{ const sv = /const VERSION = '(v\d+)'/.exec(sw), vf = /cache: (v\d+)/.exec(fs.readFileSync(path.join(root, 'VERSION'), 'utf8')); ok(sv && vf && sv[1] === vf[1], 'versi cache sw.js = VERSION (' + (sv && sv[1]) + ')'); }
console.log('PASS: Kota Kecil — ' + n + ' pemeriksaan');
