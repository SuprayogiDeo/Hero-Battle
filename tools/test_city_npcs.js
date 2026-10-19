#!/usr/bin/env node
'use strict';
/* NPC berjadwal (9B-27, dipindah ke desa di 9B-36): atlas LimeZu mi_chars (tidak berubah), adam/alex/amelia/fox kini NPC DESA di sekitar kafe, toko, apartemen K3
   (tile bebas + terjangkau dari spawn, jadwal berurutan, tanpa tabrakan dengan NPC desa lain, jalan lurus lewat logika NPC desa bukan cityPath), dialog,
   sakelar mi (?mi=0), dan pencatatan lisensi LimeZu. */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), assert = require('assert');
const root = path.join(__dirname, '..'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const rd = f => fs.readFileSync(path.join(root, f), 'utf8'), rj = f => JSON.parse(rd(f));
function png(buf) { let p = 8, w, h, ct, bd, idat = []; while (p < buf.length) { const len = buf.readUInt32BE(p), t = buf.toString('latin1', p + 4, p + 8), d = buf.slice(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; } else if (t === 'IDAT') idat.push(d); p += 12 + len; }
  ok(ct === 6 && bd === 8, 'PNG RGBA 8-bit'); const stride = w * 4, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(h * stride); let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1)), cur = out.slice(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) { const a = i >= 4 ? cur[i - 4] : 0, b = prev[i], c = i >= 4 ? prev[i - 4] : 0; let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; } cur[i] = v & 255; } prev = cur; }
  return { w, h, a: (x, y) => out[y * stride + x * 4 + 3] }; }
// 1) atlas
const M = rj('assets/world/mi_chars.json'), P = png(fs.readFileSync(path.join(root, 'assets/world/mi_chars.png')));
ok(P.w === M.width && P.h === M.height && M.frameW === 16 && M.frameH === 24 && M.cropTop === 8 && M.perDir === 6, 'dimensi atlas = json (frame 16x24)');
ok(JSON.stringify(M.dirs) === '["right","up","left","down"]' && M.fps.run > 0 && M.fps.idle_anim > 0, 'urutan arah dan fps');
ok(Object.keys(M.chars).join() === 'adam,alex,amelia,bob', '4 karakter: adam, alex, amelia, bob');
ok(/limezu/i.test(M.source.author) && M.source.commercial_use === false && /non-commercial/i.test(M.source.license), 'json mencatat LimeZu + non-komersial');
const used = new Set();
Object.entries(M.chars).forEach(([id, c]) => { ['idle', 'idle_anim', 'run'].forEach(k => { const s = c[k]; ok(s && s.frames === (k === 'idle' ? 4 : 24), id + '.' + k + ' jumlah frame');
    ok(s.x >= 0 && s.y >= 0 && s.x + s.frames * 16 <= P.w && s.y + 24 <= P.h, id + '.' + k + ' di dalam atlas');
    for (let f = 0; f < s.frames; f++) { let op = 0; for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) { const X = s.x + f * 16 + x, Y = s.y + y, key = X + ',' + Y; ok(!used.has(key), 'strip tumpang tindih'); used.add(key); if (P.a(X, Y)) op++; }
      ok(op > 40, id + '.' + k + ' frame ' + f + ' berisi sprite'); } }); });
// 2) data NPC + peta desa (kolisi chunk 16px; tile = koordinat tile; game WS=32 per tile)
const V = rj('assets/world/index.json'), W = V.w, H = V.h, col = new Uint8Array(W * H);
V.chunks.forEach(c => { const d = rj('assets/world/' + c.file); for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) col[(d.y + y) * W + d.x + x] = d.layers.collision[y * d.w + x]; });
const seen = new Uint8Array(W * H), q = [V.spawn[1] * W + V.spawn[0]]; seen[q[0]] = 1;
while (q.length) { const k = q.pop(), x = k % W, y = (k - x) / W; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy; if (a < 0 || b < 0 || a >= W || b >= H || col[b * W + a] || seen[b * W + a]) return; seen[b * W + a] = 1; q.push(b * W + a); }); }
const src = rd('js/npc.js'), list = src.slice(src.indexOf('const NPCS=['), src.indexOf('];', src.indexOf('const NPCS=[')) + 1), NPCS = new Function(list.replace('const NPCS=', 'return '))();
const NPCV = JSON.parse(src.match(/NPCV=(\[[\d,]+\])/)[1]);
ok(NPCS.every(o => o.area !== 'city'), 'tidak ada lagi NPC area city (semua NPC desa)');
const IDS = ['adam', 'alex', 'amelia', 'fox'], mine = IDS.map(i => NPCS.find(o => o.id === i)); ok(mine.every(Boolean), 'adam, alex, amelia, fox ada di NPCS'); ok(mine.every(o => o.area === undefined), 'keempatnya tanpa area (NPC desa)');
const free = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !col[y * W + x] && seen[y * W + x] === 1;
// gedung K3: kotak badan (tile) dan petak depan pintu
const BK = ['b_cafe', 'b_cshop', 'b_apt'].map(k => { const o = V.objects.find(o => o.k === k), s = V.spr[k]; return { x0: (o.x - s.ax) >> 4, x1: (o.x - s.ax + s.w - 1) >> 4, y0: (o.y - s.h) >> 4, y1: (o.y - 1) >> 4, door: [o.x >> 4, ((o.y - 1) >> 4) + 1] }; });
const dist = (x, y) => Math.min(...BK.map(b => Math.max(b.x0 - x, x - b.x1, b.y0 - y, y - b.y1, 0)));
const others = NPCS.filter(o => !IDS.includes(o.id)); const otherTiles = new Set(others.map(o => o.tx + ',' + o.ty));
const plan = mine.filter(o => o.plan); ok(plan.length === 3 && plan.every(o => ['adam', 'alex', 'amelia'].includes(o.id)), '3 NPC berjadwal: adam, alex, amelia');
const sch = o => o.plan || o.sch, tileAt = (o, h) => { const s = sch(o), b = s.findIndex(p => h >= p[0] && h < p[1]); return b < 0 ? null : s[b].slice(2); };
const tiles = [];
plan.forEach(o => { ok(o.n[0] && o.n[1] && o.mi && M.chars[o.mi] && o.h, o.id + ': nama 2 bahasa, sprite atlas, hero cadangan'); ok(o.static === undefined && !o.roam && !o.ambient, o.id + ' tidak roam/ambient');
  ok(o.plan.length >= 2 && o.tx === o.plan[0][2] && o.ty === o.plan[0][3], o.id + ' mulai di blok pertama');
  o.plan.forEach((p, i) => { ok(p[0] >= 0 && p[1] <= 24 && p[0] < p[1], o.id + ' jam blok valid'); if (i) ok(p[0] >= o.plan[i - 1][1], o.id + ' blok berurutan tanpa tumpang tindih');
    const x = p[2], y = p[3]; ok(free(x, y), o.id + ' tile jadwal bebas dan terjangkau dari spawn desa ' + x + ',' + y); ok(dist(x, y) >= 1 && dist(x, y) <= 4, o.id + ' di sekitar gedung (jarak ' + dist(x, y) + ')');
    ok(!(x >= NPCV[0] && x <= NPCV[2] && y >= NPCV[1] && y <= NPCV[3]), o.id + ' di luar wilayah roam NPC desa lain'); ok(!otherTiles.has(x + ',' + y), o.id + ' bukan rumah NPC desa lain'); ok(!BK.some(b => b.door[0] === x && b.door[1] === y), o.id + ' tidak menutup petak depan pintu'); tiles.push(x + ',' + y);
    if (i) { const a = o.plan[i - 1]; for (let t = 0; t <= 100; t++) { const fx = Math.round(a[2] + (x - a[2]) * t / 100), fy = Math.round(a[3] + (y - a[3]) * t / 100); if (!free(fx, fy)) ok(false, o.id + ' garis lurus blok ' + (i - 1) + '->' + i + ' menabrak ' + fx + ',' + fy); } ok(true, o.id + ' garis lurus antar blok bebas'); } });
  ok(o.say.length === o.plan.length && o.say.every(s => s.length === 2 && s[0].length > 10 && s[1].length > 10), o.id + ' say sejumlah blok, 2 bahasa');
  ok(o.g.length >= 2 && o.g.every(s => s.length === 2 && s[0].length > 10 && s[1].length > 10), o.id + ' dialog umum 2 bahasa'); });
const fox = NPCS.find(o => o.id === 'fox'); ok(fox.static === undefined && !fox.plan && fox.sch.length === 1 && fox.sch[0][2] === fox.tx && fox.sch[0][3] === fox.ty && fox.n[0] && fox.n[1] && free(fox.tx, fox.ty) && dist(fox.tx, fox.ty) >= 1 && dist(fox.tx, fox.ty) <= 4, 'rubah statis, tile bebas, terjangkau, di sekitar gedung ' + fox.tx + ',' + fox.ty);
ok(!otherTiles.has(fox.tx + ',' + fox.ty) && !(fox.tx >= NPCV[0] && fox.tx <= NPCV[2] && fox.ty >= NPCV[1] && fox.ty <= NPCV[3]), 'rubah bukan rumah NPC desa lain dan di luar wilayah roam');
ok(new Set(NPCS.map(o => o.id)).size === NPCS.length, 'id NPC unik');
// rumah (pintu): tile depan pintu gedung K3, bebas/terjangkau, garis lurus rumah <-> tiap blok bebas (keluar dan pulang tanpa menembus gedung)
mine.forEach(o => { ok(Array.isArray(o.home) && o.home.length === 2, o.id + ' punya rumah (pintu)'); const [hx, hy] = o.home; ok(BK.some(b => b.door[0] === hx && b.door[1] === hy) && free(hx, hy), o.id + ' rumah = petak depan pintu gedung K3 yang terjangkau ' + hx + ',' + hy);
  sch(o).forEach((p, i) => { for (let t = 0; t <= 100; t++) { const fx = Math.round(hx + (p[2] - hx) * t / 100), fy = Math.round(hy + (p[3] - hy) * t / 100); if (!free(fx, fy)) ok(false, o.id + ' garis rumah<->blok ' + i + ' menabrak ' + fx + ',' + fy); } ok(true, o.id + ' garis rumah<->blok ' + i + ' bebas'); });
  ok(sch(o)[0][2] === o.tx && sch(o)[0][3] === o.ty, o.id + ' tx,ty = blok pertama'); });
ok(new Set(mine.map(o => o.home.join() + '@' + sch(o)[0][0])).size === 4, 'tidak ada dua NPC keluar dari pintu yang sama pada jam yang sama');
for (let h = 0; h < 24; h += .5) { const t = new Set([...otherTiles]); mine.forEach(o => { const c = tileAt(o, h); if (c) { ok(!t.has(c.join(',')), 'dua NPC di tile sama pada jam ' + h + ' ' + c); t.add(c.join(',')); } }); }
// 3) runtime desa: jadwal + jalan (logika NPC desa) + dialog + sakelar mi
const sm = rd('tools/test_browser_smoke.js'), hd = sm.slice(0, sm.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} }; new Function('require', '__dirname', 'module', hd + '\nmodule.exports={context,vm};')(require, __dirname, mod);
const { context, vm } = mod.exports, ev = c => vm.runInContext(c, context, { timeout: 5000 }), step = k => { for (let i = 0; i < k; i++) ev('npcUpdate(.1)'); };
(async () => {
  const get = id => `NPCS.find(o=>o.id=='${id}')`, pos = id => ev(`(()=>{const o=${get(id)};return[Math.floor(o.px/32),Math.floor(o.py/32)].join()})()`);
  const away = 'S.world={x:5*32,y:5*32}'; // pemain jauh dari blok K3
  ev("best=10;st='world';wI=null;wC=null;wFade=null;wTalk=null;wDlg=0;lifeWorldQuick=false;hudEnsure();worldEnter()"); ev(away);
  /* harness smoke tidak memuat Tmap: wSolid diganti kolisi chunk desa nyata (sama dengan yang dipakai Tmap) supaya npcOk menguji jalur sungguhan */
  ev(`globalThis.VCOL=new Uint8Array(${JSON.stringify(Array.from(col))});wSolid=function(px,py){const tx=Math.floor(px/WS),ty=Math.floor(py/WS);return !(tx>=0&&ty>=0&&tx<${W}&&ty<${H})||VCOL[ty*${W}+tx]===1}`);
  ev('globalThis.__cp=0;cityPath=function(){__cp++;return null}');
  const HM = id => ev(`${get(id)}.home`), dHome = id => { const h = HM(id); return ev(`Math.hypot(${get(id)}.px-(${h[0]}*32+16),${get(id)}.py-(${h[1]}*32+26))`); }, awake = id => ev(`npcAwake(${get(id)})`), fa = id => ev(`${get(id)}.fa`);
  ev('lifeHour=()=>5;npcUpdate(.1)'); ok(['adam', 'alex', 'amelia', 'fox'].every(i => !awake(i)), 'jam 05: belum ada warga/rubah');
  // pagi: muncul dari pintu rumah (transparan di pintu), lalu berjalan keluar dan makin jelas
  ev('lifeHour=()=>6;npcUpdate(.1)'); ok(awake('adam') && !awake('amelia') && !awake('fox') && dHome('adam') < 6 && fa('adam') < .2, 'jam 06: Adam muncul di pintu kafe (transparan), bukan di tile blok: ' + pos('adam') + ' fa=' + fa('adam'));
  ok(pos('adam') !== '105,11' && pos('alex') === '110,17' && ev(`${get('alex')}.out`) === 1, 'Alex juga keluar dari pintu apartemen (110,17), bukan di tile blok'); step(5); ok(dHome('adam') > 10 && fa('adam') > .3 && fa('adam') < 1, 'Adam berjalan menjauh dari pintu, opasitas naik ' + fa('adam').toFixed(2));
  ev('lifeHour=()=>9;npcUpdate(.1)'); ok(awake('amelia') && awake('fox') && dHome('amelia') < 6 && dHome('fox') < 6 && fa('fox') < .2, 'amelia dan rubah muncul dari pintu masing-masing saat jamnya tiba'); step(300);
  ok(pos('adam') === '105,11' && pos('alex') === '113,18' && pos('amelia') === '102,12' && pos('fox') === '116,13' && ['adam', 'alex', 'amelia', 'fox'].every(i => fa(i) === 1), 'sampai di blok pertama, opasitas penuh: ' + ['adam', 'alex', 'amelia', 'fox'].map(pos));
  ok(ev(`npcAwake(${get('adam')})&&npcAwake(${get('fox')})`) === true && ev("(()=>{S.world={x:105*32+16,y:12*32+26};return npcNear(S.world.x,S.world.y).id})()") === 'adam', 'Adam aktif di desa dan dapat diajak bicara'); ev(away);
  const lines = id => ev(`npcLines(${get(id)})`); const a9 = lines('adam'); ok(a9.length === 3 && /zebra cross barat/.test(a9[0]), 'dialog Adam jam 09 tidak berubah: ' + a9.length + ' baris');
  ev('lifeHour=()=>14'); const a14 = lines('adam'); ok(/timur/.test(a14[0]) && a14[1] === a9[1], 'jam 14 pembuka berganti, baris umum tetap');
  ev("S.set.lang='en'"); ok(/east/.test(lines('adam')[0]), 'dialog EN'); ev("S.set.lang='id'"); ok(lines('fox').length >= 2 && /rubah komuter/i.test(lines('fox')[0]), 'dialog rubah tidak berubah');
  // jalan antar blok: jam 12 -> Adam berjalan lurus dari (105,11) ke (114,11) lewat npcUpdate (npcOk), tanpa menembus tabrakan
  ev('lifeHour=()=>12'); const x0 = ev(`${get('adam')}.px`); let bad = 0, moved = 0, lx = x0;
  for (let i = 0; i < 100; i++) { ev('npcUpdate(.1)'); const px = ev(`${get('adam')}.px`), py = ev(`${get('adam')}.py`); if (px > lx) moved++; lx = px; if (!ev(`npcOk(${px},${py})`)) bad++; }
  ok(moved >= 60 && bad === 0 && pos('adam') === '114,11', 'Adam berjalan antar blok tanpa menembus tabrakan, tiba di 114,11 (maju ' + moved + ' langkah): ' + pos('adam')); ok(ev('__cp') === 0 && !/cityPath/.test(src.slice(src.indexOf('function npcPlanStep'), src.indexOf('function npcUpdate'))), 'jalur memakai logika NPC desa, cityPath tidak dipanggil');
  { const o0 = pos('alex') + ev(`${get('alex')}.px`); ev('lifeHour=()=>12.9;npcUpdate(.1);lifeHour=()=>13'); ev(`wTalk={o:${get('alex')},ls:['x'],i:0,n:'Alex'}`); step(15); ok(pos('alex') + ev(`${get('alex')}.px`) === o0, 'NPC berhenti saat diajak bicara'); ev('wTalk=null'); step(120); ok(pos('alex') === '107,19', 'Alex tiba di blok sore (107,19): ' + pos('alex')); }
  step(200); ok(pos('fox') === '116,13' && pos('amelia') === '118,12', 'rubah tetap diam, Amelia tiba di blok sore: ' + pos('fox') + ' ' + pos('amelia'));
  ok(ev("npcHit(116*32+16,13*32+26)") === true, 'rubah memblokir jalan di desa');
  // sore: jadwal habis -> berjalan PULANG ke pintu, memudar, baru hilang di pintu (tidak pernah hilang mendadak)
  ev('lifeHour=()=>20;npcUpdate(.1)'); ok(awake('adam') && awake('fox') && awake('alex') && awake('amelia') && ev(`${get('adam')}.ret`) === 1, 'jam 20: masih ada di luar, sedang pulang');
  ev('globalThis.__w={};'); let pops = 0, prev = { adam: 1, alex: 1, amelia: 1, fox: 1 }, midFa = 1;
  for (let i = 0; i < 900; i++) { ev('npcUpdate(.1)'); ['adam', 'alex', 'amelia', 'fox'].forEach(id => { const a = awake(id); if (prev[id] && !a && !(dHome(id) < 2 && fa(id) === 0)) pops++; if (id === 'adam' && a) midFa = Math.min(midFa, fa(id)); if (!prev[id] && a) pops++; prev[id] = a; }); }
  ok(pops === 0 && midFa < .3 && ['adam', 'alex', 'amelia', 'fox'].every(i => !awake(i)) && ev('npcHit(114*32+16,11*32+26)') === false, 'semua pulang ke pintu, memudar, lalu hilang tepat di pintu (hilang mendadak: ' + pops + ', opasitas min Adam ' + midFa.toFixed(2) + ')');
  ev('lifeHour=()=>5;npcUpdate(.1)'); ok(!awake('adam'), 'jam 05 sesudahnya: masih di dalam rumah');
  ev('lifeHour=()=>6;npcUpdate(.1)'); ok(awake('adam') && dHome('adam') < 6 && fa('adam') < .2, 'esok pagi muncul lagi dari pintu rumah');
  { ev('lifeHour=()=>13;npcUpdate(.1)'); ev('S.world={x:5*32,y:5*32}'); step(3); ev('lifeHour=()=>23;npcUpdate(.1)'); ev('lifeHour=()=>6'); ok(awake('adam'), 'lompat waktu semalam: warga yang masih di luar tidak teleport hilang (tetap berjalan pulang lalu keluar lagi)'); }
  // pemain menghalangi: NPC tidak menembus pemain (berhenti), lalu pindah langsung bila macet > 4 dtk
  ev('lifeHour=()=>12');step(600);ev('lifeHour=()=>6;npcUpdate(.1);lifeHour=()=>12'); ev('S.world={x:108*32+16,y:11*32+26}'); step(30); ok(Math.abs(ev(`${get('adam')}.px`) - ev('S.world.x')) >= 19 || Math.abs(ev(`${get('adam')}.py`) - ev('S.world.y')) >= 13, 'Adam tidak menembus pemain'); step(60); ok(pos('adam') === '114,11', 'macet > 4 dtk: Adam tetap sampai ke tile blok'); ev(away);
  // menggambar desa dengan NPC dekat kamera tanpa error
  ev('S.world={x:110*32,y:12*32};lifeHour=()=>9;npcUpdate(.1)'); ev('drawWorld()'); ok(true, 'drawWorld desa dengan NPC K3 tidak error'); ev(away);
  // kota: tidak ada NPC aktif, cityNpcStep aman
  const calls = []; context.fetch = u => { calls.push(u); return Promise.resolve({ ok: true, json: () => Promise.resolve(/mi_chars/.test(u) ? M : null) }); };
  const C = rj('assets/world/city/city.json'), chunks = C.chunks.map(c => rj('assets/world/city/' + c.file)), CT = rj('assets/world/city/city_tiles.json');
  ev(`cityInstall(${JSON.stringify(C)},${JSON.stringify(chunks)},${JSON.stringify(CT)})`); ev("S.world={x:126*32+16,y:23*32+24};best=10;st='world';wI=null;wC=null;wFade=null;wTalk=null;wDlg=0;hudEnsure();lifeHour=()=>9");
  ev('wInteract()'); for (let i = 0; i < 8; i++) ev('updWorld(.1)'); ok(ev('!!wC'), 'masuk kota'); ev('cityNpcStep(.1)'); ok(ev('NPCS.filter(o=>npcAwake(o)).length') === 0 && ev('npcNear(wC.x,wC.y)') === null, 'di kota tidak ada NPC aktif'); ev('drawWorld()'); ok(true, 'drawWorld kota tanpa NPC tidak error');
  // sakelar ?mi=0 / default
  ev("location.search='?mi=0';cityMiS=null"); ok(ev('cityMiOn()') === false, '?mi=0 mematikan sprite LimeZu'); ev("location.search=''"); ok(ev('cityMiOn()') === true && ev('CITY_MI_DEFAULT') === true, 'default: sprite LimeZu aktif'); ev("location.search='?mi=1'"); ok(ev('cityMiOn()') === true, '?mi=1 tetap diterima'); ev("location.search=''");
  // 4) lisensi, cache, precache
  const cr = rd('CREDITS'), lic = rd('docs/LICENSE_AND_ASSETS.md'), sw = rd('sw.js');
  ok(/LimeZu/.test(cr) && /mi_chars/.test(cr) && /NON-KOMERSIAL/i.test(cr) && /\?mi=0/.test(cr) && /pribadi/i.test(cr), 'CREDITS: LimeZu, mi_chars, non-komersial, pernyataan pemilik, ?mi=0');
  ok(/LimeZu/.test(lic) && /mi_chars/.test(lic) && /non-komersial/i.test(lic) && /jangan menjual/i.test(lic) && /\?mi=0/.test(lic) && /sebelum proyek dipublikasikan/i.test(lic), 'LICENSE_AND_ASSETS: LimeZu, non-komersial, larangan jual, langkah sebelum publikasi, ?mi=0');
  ok(/const VERSION = 'v91'/.test(sw) && /cache: v91/.test(rd('VERSION')), 'cache v91'); ok(sw.includes("'./assets/world/mi_chars.json'") && sw.includes("'./assets/world/mi_chars.png'"), 'atlas LimeZu di-precache (aktif default)');
  console.log('PASS: NPC Kota — ' + n + ' pemeriksaan');
})().catch(e => { console.error(e); process.exit(1); });
