#!/usr/bin/env node
'use strict';
/* Interior Kota (Step 8): atlas mi_interior (Modern Interiors Free), tiga templat (kafe, toko, apartemen), gedung luar + pintu di peta kota,
   masuk/keluar lewat alur nyata (hudCtx -> fade -> updWorld) dengan pemulihan posisi kota, objek aksi punya sel kosong di depannya dan terjangkau,
   peta desa/interior desa tidak berubah, serta pencatatan lisensi LimeZu dan precache. */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), assert = require('assert');
const root = path.join(__dirname, '..'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const rd = f => fs.readFileSync(path.join(root, f), 'utf8'), rj = f => JSON.parse(rd(f));
function png(buf) { let p = 8, w, h, ct, bd, idat = []; while (p < buf.length) { const len = buf.readUInt32BE(p), t = buf.toString('latin1', p + 4, p + 8), d = buf.slice(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; } else if (t === 'IDAT') idat.push(d); p += 12 + len; }
  ok(ct === 6 && bd === 8, 'PNG RGBA 8-bit'); const stride = w * 4, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(h * stride); let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1)), cur = out.slice(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) { const a = i >= 4 ? cur[i - 4] : 0, b = prev[i], c = i >= 4 ? prev[i - 4] : 0; let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; } cur[i] = v & 255; }
    prev = cur; } return { w, h, a: (x, y) => out[y * stride + x * 4 + 3] }; }

// 1) atlas
const M = rj('assets/world/mi_interior.json'), P = png(fs.readFileSync(path.join(root, 'assets/world/mi_interior.png')));
ok(P.w === M.width && P.h === M.height, 'dimensi atlas = json');
ok(/limezu/i.test(M.source.author) && M.source.commercial_use === false && /non-commercial/i.test(M.source.license), 'json mencatat LimeZu + non-komersial');
const used = new Set();
Object.entries(M.spr).forEach(([k, r]) => { ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= P.w && r.y + r.h <= P.h && r.w > 0 && r.h > 0, k + ' di dalam atlas'); let op = 0;
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) { const key = (r.x + x) + ',' + (r.y + y); ok(!used.has(key), k + ' tumpang tindih'); used.add(key); if (P.a(r.x + x, r.y + y)) op++; }
  ok(op > 20, k + ' berisi piksel'); });

// 2) muat game + templat
const sm = rd('tools/test_browser_smoke.js'), head = sm.slice(0, sm.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} }; new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, __dirname, mod);
const { context, vm } = mod.exports, ev = c => vm.runInContext(c, context, { timeout: 5000 }), run = k => { for (let i = 0; i < k; i++) ev('updWorld(.1)'); };
const TPL = ['ccafe', 'cshop', 'capt'], CB = ev('CITY_B.map(b=>({id:b.id,tpl:b.tpl,bx:b.bx,by:b.by,bw:b.bw,bh:b.bh,dx:b.dx}))');
ok(CB.length === 3 && CB.map(b => b.tpl).join() === TPL.join() && new Set(CB.map(b => b.id)).size === 3, 'tiga bangunan kota: kafe, toko, apartemen (id unik)');
const NEED = new Set(); TPL.forEach(t => { const T = ev(`INT_T.${t}`); ok(!!T, 'templat ' + t + ' ada'); T.o.forEach(a => NEED.add(a[0])); T.d.concat(T.hg).forEach(a => NEED.add(a[0])); T.fl.forEach(f => NEED.add(f)); ['wl', 'sd', 'bt', 'dg'].forEach(k => NEED.add(T[k])); });
NEED.forEach(k => ok(!!M.spr[k], 'sprite templat ada di atlas: ' + k)); ok(ev('INT_B.length') === 17 && ['kafe','toko_kota','apartemen'].every(id => ev(`INT_B.some(b=>b.id===${JSON.stringify(id)})`)), 'INT_B desa: 14 lama + 3 bangunan K3');
TPL.forEach(t => { const T = ev(`INT_T.${t}`), room = ev(`intCompile({tpl:'${t}'})`), W = room.w, H = room.h, sol = room.sol, free = (x, y) => x > 0 && y >= 2 && x < W - 1 && y < H - 1 && !sol[y * W + x];
  ok(room.dx === T.dx && T.dx > 0 && T.dx < W - 1 && !sol[(H - 1) * W + T.dx], t + ': pintu di baris bawah terbuka');
  ok(free(T.dx, H - 2) && free(T.dx, H - 3), t + ': sel di depan pintu bebas');
  const seen = new Set([T.dx + ',' + (H - 2)]), q = [[T.dx, H - 2]]; while (q.length) { const [x, y] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy, k = a + ',' + b; if (free(a, b) && !seen.has(k)) { seen.add(k); q.push([a, b]); } }); }
  const cells = new Set(); T.o.forEach(a => { for (let y = a[2]; y < a[2] + a[4]; y++) for (let x = a[1]; x < a[1] + a[3]; x++) { const k = x + ',' + y; ok(!cells.has(k), t + ': objek tumpang tindih di ' + k); cells.add(k); ok(x > 0 && x < W - 1 && y >= 2 && y < H - 1, t + ': objek di dalam lantai ' + k); } });
  let acts = 0; T.o.forEach(a => { if (!a[5]) return; acts++; let ok1 = false; for (let x = a[1]; x < a[1] + a[3]; x++) if (free(x, a[2] + a[4]) && seen.has(x + ',' + (a[2] + a[4]))) ok1 = true; ok(ok1, t + ': ' + a[0] + ' (' + a[6] + ') punya sel kosong terjangkau di depannya');
    if (a[5] === 'msg') { ok(ev(`!!INT_MSG['${a[7]}']`), t + ': pesan ' + a[7] + ' ada'); ok(ev(`INT_MSG['${a[7]}'].length`) === 2, t + ': pesan 2 bahasa'); }
    ok(ev(`!!INT_LAB['${a[6]}']||'${a[6]}'==='TEMPAT TIDUR'`) && ev(`!!(INT_NAME['${a[6]}'])`), t + ': label ' + a[6] + ' punya nama 2 bahasa'); });
  ok(acts >= 4, t + ': minimal 4 objek interaktif (' + acts + ')'); });

// 3) bangunan di peta kota
const C = rj('assets/world/city/city.json'), chunks = C.chunks.map(c => rj('assets/world/city/' + c.file)), CT = rj('assets/world/city/city_tiles.json');
ev(`cityInstall(${JSON.stringify(C)},${JSON.stringify(chunks)},${JSON.stringify(CT)})`); const Wc = C.w, col = ev('Array.from(cityD.col)');
const props = []; chunks.forEach(c => c.objects.forEach(o => props.push(o)));
CB.forEach(b => { for (let y = b.by; y < b.by + b.bh; y++) for (let x = b.bx; x < b.bx + b.bw; x++) { ok(x >= 0 && y >= 0 && x < C.w && y < C.h && col[y * Wc + x] === 1, b.id + ': badan gedung solid ' + x + ',' + y); props.forEach(o => ok(!(x >= o.x && x < o.x + o.fw && y >= o.y && y < o.y + o.fh), b.id + ': tidak menimpa prop ' + o.k + ' di ' + x + ',' + y)); }
  ok(b.dx >= b.bx && b.dx < b.bx + b.bw && !col[(b.by + b.bh) * Wc + b.dx] && !col[(b.by + b.bh + 1) * Wc + b.dx], b.id + ': tile pintu dan satu sel di bawahnya bebas'); });
{ const seen = new Set([C.spawn.join(',')]), q = [C.spawn.slice()]; while (q.length) { const [x, y] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy, k = a + ',' + b; if (a >= 0 && b >= 0 && a < C.w && b < C.h && !col[b * Wc + a] && !seen.has(k)) { seen.add(k); q.push([a, b]); } }); }
  CB.forEach(b => ok(seen.has(b.dx + ',' + (b.by + b.bh)), b.id + ': pintu terjangkau dari titik masuk kota'));
  const npc = ev("NPCS.filter(o=>o.area==='city').flatMap(o=>o.plan?o.plan.map(p=>[p[2],p[3]]):[[o.tx,o.ty]])"); ok(npc.length === 0, 'tidak ada NPC area city (9B-36: pindah ke desa)'); npc.forEach(([x, y]) => ok(!CB.some(b => x >= b.bx && x < b.bx + b.bw && y >= b.by && y < b.by + b.bh && true) && seen.has(x + ',' + y), 'tile NPC kota tetap bebas dan terjangkau ' + x + ',' + y)); }

// 4) alur nyata: masuk kota -> pintu -> interior -> keluar kembali ke kota (tiap bangunan)
(async () => {
  context.fetch = u => Promise.resolve({ ok: true, json: () => Promise.resolve(/mi_interior/.test(u) ? M : /mi_chars/.test(u) ? rj('assets/world/mi_chars.json') : null) });
  ev("S.world={x:126*32+16,y:23*32+24};best=10;st='world';wI=null;wC=null;wFade=null;wTalk=null;wDlg=0;lifeWorldQuick=false;hudEnsure();lifeHour=()=>9;location.search='?mi=0'");
  ev('wInteract()'); run(8); ok(ev('!!wC'), 'masuk kota'); const sw0 = ev('[S.world.x,S.world.y].join()');
  for (const b of CB) {
    ev(`wC.x=${b.dx}*32+16;wC.y=${b.by + b.bh}*32+26;wC.near=cityNear()`); ok(ev('hudCtx().l') === 'MASUK' && ev('hudCtx().on') !== 0, b.id + ': tombol MASUK di pintu');
    ev("S.set.lang='en'"); ok(ev('hudCtx().l') === 'ENTER', b.id + ': label EN'); ev("S.set.lang='id'");
    ev(`wC.x=${b.dx}*32+16;wC.y=${b.by + b.bh + 3}*32+26`); ok(ev('hudCtx()') === null || ev('hudCtx().l') !== 'MASUK', b.id + ': jauh dari pintu tidak ada MASUK');
    ev(`wC.x=${b.dx}*32+16;wC.y=${b.by + b.bh}*32+26`); ev('hudCtx().f()'); run(10);
    ok(ev('!!wI') && ev('wC') === null && ev('wI.b.id') === b.id && ev('wI.b.tpl') === b.tpl, b.id + ': masuk interior, wC dilepas');
    ok(ev('[S.world.x,S.world.y].join()') === sw0, b.id + ': S.world tetap titik desa (simpan/muat aman)');
    ev('sv()'); ok(ev('Save.readMain().world.x') === ev('S.world.x'), b.id + ': simpan di dalam interior aman');
    ev('wI.near=intNear()'); ok(ev('hudCtx()') === null || ev('hudCtx().l') !== 'MASUK', b.id + ': di dalam bukan tombol MASUK kota');
    // setiap objek aksi: berdiri di sel depan, label muncul, aksi menampilkan pesan
    ev("S.set.lang='id'"); const objs = ev('wI.room.objs.filter(o=>o.act).map(o=>({x:o.x,y:o.y,fw:o.fw,fh:o.fh,lab:o.lab,msg:o.msg,act:o.act}))');
    for (const o of objs) { ev(`wI.x=${o.x}*32+16;wI.y=${o.y + o.fh}*32+16;wI.near=intNear()`); ok(ev('wI.near&&!wI.near.exit&&wI.near.lab')===o.lab, b.id + ': dekat objek ' + o.lab + ' memberi aksi');
      if (o.act === 'cafe' || o.act === 'cshop') { ev('hudCtx().f()'); ok(ev('st') === (o.act === 'cafe' ? 'inn' : 'cshop'), b.id + ': aksi ' + o.lab + ' membuka layar ' + o.act); ev("st='world'"); continue; }
      ev('wMsg.t=0;hudCtx().f()'); ok(ev('wMsg.t')>0 && ev('tr(wMsg.s)').length>10, b.id + ': aksi ' + o.lab + ' menampilkan pesan'); }
    assert.doesNotThrow(() => ev('draw()')); assert.doesNotThrow(() => ev('drawWorld()')); n += 2;
    // atlas dimuat: gambar tidak error (stub Image)
    ev('miIntStart()'); await new Promise(r => setImmediate(r)); await new Promise(r => setImmediate(r)); ok(ev('!!MI_SPR&&!!MI_SPR.mi_table_wood'), 'atlas mi_interior dimuat lewat miIntStart'); assert.doesNotThrow(() => ev('drawWorld()')); n++;
    // keluar lewat pintu
    ev('wI.x=wI.room.sx;wI.y=wI.room.sy;wI.near=intNear()'); ok(ev('hudCtx().l') === 'KELUAR', b.id + ': dekat pintu => KELUAR'); ev('hudCtx().f()'); run(10);
    ok(ev('wI') === null && ev('!!wC'), b.id + ': keluar kembali ke kota');
    ok(Math.abs(ev('wC.x') - (b.dx * 32 + 16)) < 1 && Math.abs(ev('wC.y') - ((b.by + b.bh) * 32 + 26)) < 1, b.id + ': posisi kota dipulihkan di pintu');
    ok(ev('[S.world.x,S.world.y].join()') === sw0 && ev('hudCtx().l') === 'MASUK', b.id + ': S.world tetap, tombol MASUK muncul lagi');
    ok(ev('cityD!==null&&NPCS.every(o=>o.area!=="city")&&NPCS.filter(o=>npcAwake(o)).length===0'), b.id + ': kota tetap termuat dan tanpa NPC setelah keluar (9B-36: warga pindah ke desa)');
  }
  // keluar kota normal masih bekerja (gerbang barat) setelah keluar-masuk interior
  ev('wC.x=2*32;wC.y=cityRetY();wC.near=cityNear()'); ok(ev('hudCtx().l') === 'DESA', 'gerbang kembali ke desa tetap bekerja'); ev('hudCtx().f()'); run(10); ok(ev('wC') === null && ev('wI') === null, 'kembali ke desa');
  // interior desa tidak terpengaruh: intExit biasa memulihkan posisi desa
  ev("S.world={x:320*2,y:320*2+20};wC=null;wI=null;wFade=null"); ev("intEnter(INT_B.find(b=>b.id==='toko'))"); run(10); ok(ev('!!wI')&&ev('wI.b.id')==='toko', 'interior desa (toko) tetap bisa dimasuki'); ev('intExit()'); run(10); ok(ev('wI')===null&&ev('wC')===null&&ev('S.world.x')===640, 'keluar interior desa kembali ke pintu desa');
  // 5) lisensi, precache, versi
  const cr = rd('CREDITS'), lic = rd('docs/LICENSE_AND_ASSETS.md'), sw = rd('sw.js');
  ok(/mi_interior/.test(cr) && /LimeZu/.test(cr) && /NON-KOMERSIAL/i.test(cr), 'CREDITS: mi_interior, LimeZu, non-komersial');
  ok(/mi_interior/.test(lic) && /non-komersial/i.test(lic) && /jangan menjual/i.test(lic), 'LICENSE_AND_ASSETS: mi_interior, non-komersial, larangan jual');
  ok(sw.includes("'./assets/world/mi_interior.json'") && sw.includes("'./assets/world/mi_interior.png'"), 'atlas interior kota di-precache');
  { const sv = /const VERSION = '(v\d+)'/.exec(sw), vf = /cache: (v\d+)/.exec(rd('VERSION')); ok(sv && vf && sv[1] === vf[1], 'versi cache sw.js = VERSION (' + (sv && sv[1]) + ')'); }
  ok(/build_mi_interiors\.py/.test(rd('CHANGELOG.md')), 'CHANGELOG menyebut build_mi_interiors.py');
  console.log('PASS: Interior Kota — ' + n + ' pemeriksaan');
})().catch(e => { console.error(e); process.exit(1); });
