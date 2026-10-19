#!/usr/bin/env node
'use strict';
/* Sakelar ?cf=1 (atlas Cute Fantasy): TANPA flag tidak ada yang berubah; DENGAN flag hanya sprite ayam/sapi/babi/domba (ranch.js), tile jembatan
   dan sprite pagar objek dunia (tilemap.js) yang diganti. Peta, tabrakan, dan isi chunk harus identik di kedua mode. */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto'), assert = require('assert');
const root = path.join(__dirname, '..'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const rd = f => fs.readFileSync(path.join(root, f), 'utf8'), sha = s => crypto.createHash('sha256').update(s).digest('hex');
const noop = () => { };

/* ---------- 0) data dunia tidak diubah (peta, tabrakan, chunk, tabel tile jembatan) ---------- */
const chunkFiles = fs.readdirSync(path.join(root, 'assets/world/chunks')).sort();
const chunks = chunkFiles.map(f => JSON.parse(rd('assets/world/chunks/' + f)));
const GOLD = {   // sidik data dunia sebelum ?cf=1 ada; ubah HANYA bila peta memang sengaja diubah
  index: sha(rd('assets/world/index.json')) , chunks: sha(chunkFiles.map(f => rd('assets/world/chunks/' + f)).join('\n')),
  collision: sha(JSON.stringify(chunks.map(c => [c.x, c.y, c.layers.collision]))), bridge: sha(rd('assets/world/bridge_tiles.json')) };
const PINNED = JSON.parse(rd('tools/cf_flag_golden.json'));
ok(GOLD.index === PINNED.index, 'index.json (peta) tidak berubah');
ok(GOLD.chunks === PINNED.chunks, 'seluruh berkas chunk tidak berubah');
ok(GOLD.collision === PINNED.collision, 'layer tabrakan semua chunk tidak berubah');
ok(GOLD.bridge === PINNED.bridge, 'bridge_tiles.json tidak berubah');

/* ---------- 1) modul cf.js: flag ketat, tanpa efek samping bila mati ---------- */
const atlasMeta = JSON.parse(rd('assets/world/cf_atlas.json'));
function loadCf(search) {
  const calls = { fetch: [], img: [] };
  class Img { set src(v) { this._src = v; calls.img.push(v); Promise.resolve().then(() => this.onload && this.onload()); } get src() { return this._src; } }
  const ctx = vm.createContext({ location: { search }, Image: Img, console, Promise,
    fetch: u => { calls.fetch.push(u); return Promise.resolve({ ok: true, json: () => Promise.resolve(atlasMeta) }); } });
  vm.runInContext(rd('js/cf.js') + '\n;this.CF=CF;', ctx); return { CF: ctx.CF, calls };
}
const settle = async () => { for (let i = 0; i < 6; i++) await new Promise(r => setImmediate(r)); };
const rec = () => { const o = []; return { o, g: { imageSmoothingEnabled: true, save: noop, restore: noop, translate: noop, scale: noop, drawImage(...a) { o.push(a); } } }; };
(async () => {
  for (const s of ['', '?cf=0', '?cf=10', '?xcf=1', '?zoom=0.8', '?perf=1&zoom=.9', '?cf=']) {
    const { CF, calls } = loadCf(s); await settle(); const r = rec();
    ok(CF.on === false && CF.ready() === false && CF.settled() === true, 'flag mati untuk "' + s + '"');
    ok(calls.fetch.length === 0 && calls.img.length === 0, 'tanpa flag tidak ada fetch/Image atlas: "' + s + '"');
    ok(CF.tile(128) === null && CF.drawFence(r.g, 'fence_h', 0, 0) === false && CF.drawAnimal(r.g, 'cow', 0, 0, 0, 1) === false && r.o.length === 0, 'helper netral bila mati: "' + s + '"');
  }
  for (const s of ['?cf=1', '?a=1&cf=1', '?cf=1&perf=1', '?zoom=.9&cf=1#x']) {
    const { CF, calls } = loadCf(s); ok(CF.on === true && CF.ready() === false && CF.settled() === false, 'flag hidup, atlas belum siap: "' + s + '"');
    ok(CF.tile(128) === null, 'sebelum siap helper tile = null (tile lama dipakai)');
    await settle(); ok(CF.ready() && CF.settled() && calls.fetch.length === 1 && /cf_atlas\.json$/.test(calls.fetch[0]) && calls.img.length === 1 && /cf_atlas\.png$/.test(calls.img[0]), 'atlas dimuat satu kali: "' + s + '"');
  }
  { const { CF } = loadCf('?cf=1'); await settle(); const E = atlasMeta.entries, br = E['decor/Bridge_Wood'], inside = (t, e) => t.sx >= e.x && t.sy >= e.y && t.sx + 16 <= e.x + e.w && t.sy + 16 <= e.y + e.h;
    const ids = JSON.parse(rd('assets/world/bridge_tiles.json')).ids, mapped = [], skipped = [], kept = [];
    for (const k in ids) { const t = CF.tile(ids[k]); (t === null ? kept : t.im === null ? skipped : mapped).push(k); if (t && t.im) { ok(inside(t, br), 'sel jembatan di dalam entri atlas: ' + k); ok(t.ux == null || inside({ sx: t.ux, sy: t.uy }, br), 'sel dasar ujung di dalam entri atlas: ' + k); } }
    ok(mapped.length === 12 && skipped.join() === 'top_post,bot_post,post_cap' && kept.join() === 'water_shadow', 'pemetaan jembatan: 12 sel, 3 tiang lama dilewati, bayangan air tetap lama');
    ok(CF.tile(0) === null && CF.tile(5) === null && CF.tile(127) === null && CF.tile(144) === null, 'id tile non-jembatan tidak pernah diganti');
    const r = rec(); ok(CF.drawFence(r.g, 'fence_h', 100, 100) && CF.drawFence(r.g, 'fence_v', 100, 100) && !CF.drawFence(r.g, 'bench', 1, 1) && r.o.length === 2, 'pagar atlas hanya untuk fence_h dan fence_v');
    for (const [t, nm] of [['chicken', 'Chicken'], ['cow', 'Cow'], ['pig', 'Pig'], ['sheep', 'Sheep']]) { const q = rec(), e = E['animals/' + nm];
      ok(CF.drawAnimal(q.g, t, 0, 50, 50, 1.25, false) && CF.drawAnimal(q.g, t, 300, 50, 50, 1.25, true, true) && q.o.every(a => a[1] >= e.x && a[2] >= e.y && a[1] + 32 <= e.x + e.w && a[2] + 32 <= e.y + e.h), 'sprite ' + t + ' berasal dari entri animals/' + nm); }
    ok(!CF.drawAnimal(rec().g, 'dragon', 0, 0, 0, 1), 'jenis tak dikenal tidak digambar');
  }

  /* ---------- 2) ranch.js lewat harness smoke ---------- */
  const src = rd('tools/test_browser_smoke.js'), head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
  const mod = { exports: {} }; new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
  const { context, vm: V2 } = mod.exports, ev = c => V2.runInContext(c, context, { timeout: 5000 });
  ev("sfx=function(){};S.set=S.set||{};S.ranch=null;S.g=999;window.__t=[];window.__d=0;" +
     "Anim.draw=function(c,nm,t,x,y,f,sc){__t.push(['draw',nm,x,y,f,sc]);return true};Anim.shadow=function(c,x,y,a,b,al){__t.push(['shadow',x,y,a,b,al])};");
  const animals = "[{type:'chicken',x:.2,y:.3,tx:.2,ty:.3},{type:'cow',x:.5,y:.5,tx:.8,ty:.5},{type:'pig',x:.4,y:.4,tx:.1,ty:.4},{type:'sheep',x:.7,y:.2,tx:.7,ty:.2}]";
  const runAnimals = () => ev("__t.length=0;" + animals + ".forEach(function(a,i){ranchDrawAnimal(a,100+i*30,120)});JSON.stringify(__t)");
  ok(ev("typeof CF!=='undefined'&&CF.on===false"), 'harness smoke berjalan tanpa flag (CF.on = false)');
  const oldRanch = JSON.parse(runAnimals());
  ok(oldRanch.length === 8 && oldRanch.filter(a => a[0] === 'shadow').length === 4, 'tanpa flag: 4 bayangan + 4 sprite lama');
  ok(['chicken', 'cow', 'pig', 'sheep'].every((t, i) => { const d = oldRanch[i * 2 + 1], s = oldRanch[i * 2]; return d[0] === 'draw' && d[1] === 'animal_' + t && d[2] === 100 + i * 30 && d[3] === 120 && d[4] === false && d[5] === 1.25 && s[0] === 'shadow' && s[2] === 122; }), 'tanpa flag: urutan dan argumen gambar hewan sama persis dengan sebelumnya');
  ev("window.__cf=[];CF.drawAnimal=function(){__cf.push([].slice.call(arguments,1));return true}");
  ok(ev("__cf.length") === 0 && JSON.stringify(JSON.parse(runAnimals())) === JSON.stringify(oldRanch) && ev("__cf.length") === 0, 'CF.on mati: atlas tidak pernah dipanggil, keluaran identik');
  ev("drawRanch()"); const dr = JSON.parse(ev("JSON.stringify(__t)")).filter(a => a[0] === 'draw'); ok(dr.length >= 4 && ['chicken', 'cow', 'pig', 'sheep'].every(t => dr.some(a => a[1] === 'animal_' + t && a[5] === .7)), 'tanpa flag: tombol beli kandang tetap memakai sprite lama (skala .7)');
  ev("CF.on=true"); const withCf = JSON.parse(runAnimals()), calls = JSON.parse(ev("JSON.stringify(__cf)"));
  ok(withCf.length === 0 && calls.length === 4 && calls.map(c => c[0]).join() === 'chicken,cow,pig,sheep', 'flag hidup: 4 hewan digambar dari atlas, sprite dan bayangan lama dilewati');
  ok(calls[0][5] === false && calls[1][5] === true && calls[1][6] === true && calls[2][5] === true && calls[2][6] === false && calls[0][4] === 1.25, 'flag hidup: animasi jalan hanya saat bergerak, cermin saat menuju kanan');
  ev("__cf.length=0;__t.length=0;drawRanch()"); const bt = JSON.parse(ev("JSON.stringify(__cf)")); ok(bt.filter(c => c[4] === .7 && c[5] === false).length === 4, 'flag hidup: tombol beli kandang memakai atlas');
  ev("CF.drawAnimal=function(){return false}"); ok(JSON.stringify(JSON.parse(runAnimals())) === JSON.stringify(oldRanch), 'flag hidup tapi atlas belum siap/gagal: jatuh ke sprite lama persis');
  ev("CF.on=false");
  const rsrc = rd('js/ranch.js'); ok(!/CF\.(tile|drawFence)/.test(rsrc) && (rsrc.match(/ranchAtlasAnimal\(/g) || []).length === 3, 'ranch.js hanya menyentuh hewan (1 definisi + 2 pemakaian)');

  /* ---------- 3) dunia nyata: Tmap + chunk asli, flag mati vs hidup ---------- */
  async function world(search) {
    const all = [], mk = () => { const ops = []; const cx = { ops, imageSmoothingEnabled: true, save: noop, restore: noop, translate: noop, scale: noop, setTransform: noop, fillRect: noop, strokeRect: noop, clearRect: noop, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, ellipse: noop, fill: noop, stroke: noop, fillText: noop, strokeText: noop, measureText: () => ({ width: 10 }), createPattern: () => ({}), createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: noop,
      drawImage(im, ...a) { ops.push([im && im._src ? path.basename(im._src) : 'canvas#' + (im && im._id), ...a]); } };
      const c = { width: 0, height: 0, _id: ++mk.id, getContext: () => cx, getBoundingClientRect: () => ({ height: 360 }) }; cx.canvas = c; all.push(cx); return c; }; mk.id = 0;
    class Img { set src(v) { this._src = v; this.complete = true; this.naturalWidth = 512; Promise.resolve().then(() => this.onload && this.onload()); } get src() { return this._src; } }
    let seed = 12345; const M2 = Object.create(Math); M2.random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;   // hewan kandang memakai Math.random: dibuat deterministik
    const ctx = vm.createContext({ location: { search }, Image: Img, console, Promise, Date, Math: M2, JSON, Uint8ClampedArray, setTimeout, clearTimeout,
      document: { createElement: t => mk() }, performance: { now: () => 1000 }, VH: 1e6, S: { world: { x: 800, y: 800 }, set: { lang: 'id' } }, self: null,
      fetch: u => { const f = path.join(root, u); return fs.existsSync(f) ? Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(fs.readFileSync(f, 'utf8'))) }) : Promise.resolve({ ok: false }); } });
    ctx.self = ctx; vm.runInContext(rd('js/cf.js') + '\n' + rd('js/anim.js') + '\n' + rd('js/tilemap.js') + '\n;this.CF=CF;this.Tmap=Tmap;this.Anim=Anim;', ctx);
    ctx.Anim.draw = noop; ctx.Anim.shadow = noop;   // sprite animasi tidak relevan; hanya gambar tile/pagar yang dibandingkan
    await settle(); await settle();
    const main = mk().getContext('2d'); for (let i = 0; i < 4; i++) { ctx.Tmap.draw(main, 1500, 1100, 0, 640, false); await settle(); }
    // semua chunk harus termuat setelah beberapa frame
    const T = ctx.Tmap, data = T.data(), W = data.w, H = data.h, col = []; let known = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = T.collisionAt(x, y); col.push(c === null ? 'n' : c ? 1 : 0); if (c !== null) known++; }
    const g = mk().getContext('2d'), out = T.tall(g, 0, 0, 0, 99999, false, () => false);   // viewport sangat lebar -> semua objek
    const order = out.map(o => [o.y, o.x, o.b]); out.forEach(o => o.f());
    const tileOps = c => c.ops.filter(o => (o[0] === 'tiles.png' || o[0] === 'cf_atlas.png') && o[3] === 16 && o[4] === 16 && o[7] === 16 && o[8] === 16);
    const chunkOps = all.filter(c => c !== main && c !== g && tileOps(c).length > 100).map(tileOps);
    return { ctx, T, col: col.join(''), known, order, objOps: g.ops, ready: ctx.CF.ready(), V: data, chunkOps };
  }
  const OFF = await world(''), ON = await world('?cf=1');
  ok(OFF.known === OFF.V.w * OFF.V.h && ON.known === ON.V.w * ON.V.h, 'semua chunk termuat di kedua mode (' + OFF.known + ' petak)');
  ok(OFF.col === ON.col, 'TABRAKAN identik petak demi petak (flag mati vs hidup)');
  const expectCol = []; { const by = {}; chunks.forEach(c => by[c.x + ',' + c.y] = c);
    for (let y = 0; y < OFF.V.h; y++) for (let x = 0; x < OFF.V.w; x++) { let v = 'n'; for (const c of chunks) if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) v = c.layers.collision[(y - c.y) * c.w + (x - c.x)] === 1 ? 1 : 0; expectCol.push(v); } }
  const rocks = new Set(OFF.V.objects.filter(o => o.k && o.k.indexOf('rock_') === 0).map(o => Math.floor((o.y - 1) / 16) * OFF.V.w + Math.floor(o.x / 16)));
  let colDiff = 0; for (let i = 0; i < expectCol.length; i++) if (!rocks.has(i) && String(expectCol[i]) !== OFF.col[i]) colDiff++;
  ok(colDiff === 0, 'tabrakan runtime = layer collision berkas chunk (selain batu objek)');
  ok(OFF.ready === false && ON.ready === true, 'mode hidup memakai atlas, mode mati tidak memuatnya');
  ok(JSON.stringify(OFF.order) === JSON.stringify(ON.order) && OFF.order.length > 100, 'daftar objek dunia (posisi dan urutan-y) identik: ' + OFF.order.length + ' objek');
  const fenceN = OFF.V.objects.filter(o => o.k === 'fence_h' || o.k === 'fence_v').length;
  const fo = ops => ops.filter(o => o[0] === 'cf_atlas.png'), so = ops => ops.filter(o => o[0] === 'sprites.png');
  ok(fo(OFF.objOps).length === 0 && fo(ON.objOps).length > 0 && fo(ON.objOps).length <= fenceN, 'pagar objek: atlas hanya saat flag hidup (' + fo(ON.objOps).length + ' sprite pagar)');
  ok(so(OFF.objOps).length - so(ON.objOps).length === fo(ON.objOps).length, 'tiap pagar atlas menggantikan tepat satu sprite pagar lama; sprite objek lain sama jumlahnya');
  const strip = ops => ops.filter(o => o[0] !== 'cf_atlas.png').map(o => JSON.stringify(o));
  const offNoFence = OFF.objOps.filter(o => !(o[0] === 'sprites.png' && (o[3] === 16 && o[4] === 11 || o[3] === 8 && o[4] === 16))).map(o => JSON.stringify(o)), onNoFence = strip(ON.objOps).filter(s => { const o = JSON.parse(s); return !(o[0] === 'sprites.png' && (o[3] === 16 && o[4] === 11 || o[3] === 8 && o[4] === 16)); });
  ok(JSON.stringify(offNoFence) === JSON.stringify(onNoFence), 'semua gambar objek selain pagar identik byte demi byte');
  // isi chunk (kanvas hasil bake): sama persis dengan berkas chunk bila flag mati; bila hidup hanya tile jembatan yang berganti sumber
  const BRI = JSON.parse(rd('assets/world/bridge_tiles.json')).ids, SKIP = new Set([BRI.top_post, BRI.bot_post, BRI.post_cap]), MAP = new Set(Object.values(BRI).filter(i => i !== BRI.water_shadow && !SKIP.has(i)));
  const idOf = o => (o[2] / 16) * 32 + o[1] / 16, flat = [].concat(...OFF.chunkOps);
  ok(OFF.chunkOps.length === chunks.length && ON.chunkOps.length === chunks.length, 'semua ' + chunks.length + ' chunk ter-bake di kedua mode');
  const expectTiles = chunks.reduce((a, c) => a + ['ground', 'shadow', 'decor', 'over'].reduce((b, L) => b + (c.layers[L] || []).filter(t => t && !(OFF.V.anim && OFF.V.anim[t])).length, 0), 0);
  ok(flat.length === expectTiles && flat.every(o => o[0] === 'tiles.png'), 'flag mati: bake chunk memakai tiles.png untuk semua ' + expectTiles + ' tile, sama dengan berkas chunk');
  let bridgeCells = 0, skipped = 0;
  OFF.chunkOps.forEach((offOps, i) => { const onOps = ON.chunkOps[i];
    const CFt = ON.ctx.CF, plain = offOps.filter(o => !MAP.has(idOf(o)) && !SKIP.has(idOf(o))), cfDest = [].concat(...offOps.filter(o => MAP.has(idOf(o))).map(o => { const t = CFt.tile(idOf(o)), r = []; if (t.ux != null) r.push(['cf_atlas.png', t.ux, t.uy, 16, 16, o[5], o[6], 16, 16].slice(1).join()); r.push(['cf_atlas.png', t.sx, t.sy, 16, 16, o[5] + (t.dx || 0), o[6], 16, 16].slice(1).join()); return r; })), dropped = offOps.filter(o => SKIP.has(idOf(o))).length;
    ok(JSON.stringify(plain) === JSON.stringify(onOps.filter(o => o[0] === 'tiles.png')), 'chunk ' + i + ': semua tile non-jembatan identik');
    ok(JSON.stringify(cfDest) === JSON.stringify(onOps.filter(o => o[0] === 'cf_atlas.png').map(o => o.slice(1).join())), 'chunk ' + i + ': tile jembatan diganti di petak yang sama (sumber atlas, tujuan = petak lama)');
    bridgeCells += offOps.filter(o => MAP.has(idOf(o))).length; skipped += dropped; });
  ok(bridgeCells >= 20 && skipped >= 1, 'jembatan benar-benar diganti di flag hidup (' + bridgeCells + ' sel atlas, ' + skipped + ' tiang lama dilewati)');
  console.log('PASS: sakelar ?cf=1 (' + n + ' pemeriksaan)');
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
