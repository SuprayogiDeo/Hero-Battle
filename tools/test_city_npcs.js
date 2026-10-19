#!/usr/bin/env node
'use strict';
/* NPC Kota (Batch 9B-27): atlas LimeZu mi_chars (Adam/Alex/Amelia/Bob), data NPC (adam, alex, amelia) di NPCS, jadwal, dialog, jalan antar blok,
   sakelar mi (aktif default untuk proyek pribadi non-komersial; ?mi=0 mematikan: tanpa fetch/Image), dan pencatatan lisensi LimeZu. */
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
// 2) data NPC + peta kota
const C = rj('assets/world/city/city.json'), chunks = C.chunks.map(c => rj('assets/world/city/' + c.file)), W = C.w, col = new Array(W * C.h).fill(1), occ = new Set();
chunks.forEach(c => { for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) col[(c.y + y) * W + c.x + x] = c.layers.collision[y * c.w + x]; });
const src = rd('js/npc.js'), list = src.slice(src.indexOf('const NPCS=['), src.indexOf('];', src.indexOf('const NPCS=[')) + 1), NPCS = new Function(list.replace('const NPCS=', 'return '))();
const seen = new Set([C.spawn.join(',')]), q = [C.spawn.slice()]; while (q.length) { const [x, y] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy, k = a + ',' + b; if (a < 0 || b < 0 || a >= W || b >= C.h || col[b * W + a] || seen.has(k)) return; seen.add(k); q.push([a, b]); }); }
const CITY = NPCS.filter(o => o.area === 'city'), ids = CITY.map(o => o.id); ok(['fox', 'adam', 'alex', 'amelia'].every(i => ids.includes(i)), 'fox + 3 warga kota ada di NPCS');
const plan = CITY.filter(o => o.plan); ok(plan.length >= 2 && plan.length <= 3 && plan.every(o => ['adam', 'alex', 'amelia'].includes(o.id)), '2-3 NPC berjadwal dari atlas');
const tileAt = (o, h) => { const b = o.plan.findIndex(p => h >= p[0] && h < p[1]); return b < 0 ? null : o.plan[b].slice(2); };
plan.forEach(o => { ok(o.n[0] && o.n[1] && o.mi && M.chars[o.mi] && o.h, o.id + ': nama 2 bahasa, sprite atlas, hero cadangan'); ok(o.static === undefined && !o.roam && !o.ambient, o.id + ' tidak roam/ambient');
  ok(o.plan.length >= 2 && o.tx === o.plan[0][2] && o.ty === o.plan[0][3], o.id + ' mulai di blok pertama');
  o.plan.forEach((p, i) => { ok(p[0] >= 0 && p[1] <= 24 && p[0] < p[1], o.id + ' jam blok valid'); if (i) ok(p[0] >= o.plan[i - 1][1], o.id + ' blok berurutan tanpa tumpang tindih');
    const k = p[2] + ',' + p[3]; ok(!col[p[3] * W + p[2]] && seen.has(k), o.id + ' tile jadwal bebas dan terjangkau ' + k); });
  ok(o.say.length === o.plan.length && o.say.every(s => s.length === 2 && s[0].length > 10 && s[1].length > 10), o.id + ' say sejumlah blok, 2 bahasa');
  ok(o.g.length >= 2 && o.g.every(s => s.length === 2 && s[0].length > 10 && s[1].length > 10), o.id + ' dialog umum 2 bahasa'); });
const fox = NPCS.find(o => o.id === 'fox'); for (let h = 0; h < 24; h += .5) { const t = new Set([fox.tx + ',' + fox.ty]); plan.forEach(o => { const c = tileAt(o, h); if (c) { ok(!t.has(c.join(',')), 'dua NPC di tile sama pada jam ' + h); t.add(c.join(',')); } }); }
// 3) runtime: muat game, masuk kota, jadwal + jalan + dialog + sakelar
const sm = rd('tools/test_browser_smoke.js'), head = sm.slice(0, sm.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} }; new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, __dirname, mod);
const { context, vm } = mod.exports, ev = c => vm.runInContext(c, context, { timeout: 5000 }), run = k => { for (let i = 0; i < k; i++) ev('updWorld(.1)'); };
(async () => {
  const calls = []; context.fetch = u => { calls.push(u); return Promise.resolve({ ok: true, json: () => Promise.resolve(/mi_chars/.test(u) ? M : /atlas|tiles\.json/.test(u) && /city_tiles/.test(u) ? rj('assets/world/city/city_tiles.json') : null) }); };
  const CT = rj('assets/world/city/city_tiles.json');
  ev(`cityInstall(${JSON.stringify(C)},${JSON.stringify(chunks)},${JSON.stringify(CT)})`);
  ev("S.world={x:126*32+16,y:23*32+24};best=10;st='world';wI=null;wC=null;wFade=null;wTalk=null;wDlg=0;lifeWorldQuick=false;hudEnsure();lifeHour=()=>9");
  // sakelar: ?mi=0 mematikan -> tanpa fetch atlas
  ev("location.search='?mi=0';cityMiS=null"); ok(ev('cityMiOn()') === false, '?mi=0 mematikan sprite LimeZu');
  ev('wInteract()'); run(8); ok(ev('!!wC'), 'masuk kota'); await new Promise(r => setImmediate(r)); ok(!calls.some(u => /mi_chars/.test(u)) && ev('cityMiS') === null, 'dengan ?mi=0: tidak ada fetch mi_chars');
  // jadwal: jam 5 sepi, jam 9 Adam di zebra barat, Alex di bangku, Amelia di utara
  ev('lifeHour=()=>5;cityNpcStep(.1)'); ok(ev("NPCS.filter(o=>o.plan&&npcAwake(o)).length") === 0, 'jam 05: belum ada warga');
  ev('lifeHour=()=>9'); ev('cityNpcStep(.1)'); const pos = id => ev(`(()=>{const o=NPCS.find(o=>o.id=='${id}');return[Math.floor(o.px/32),Math.floor(o.py/32)].join()})()`);
  ok(pos('adam') === '11,13' && pos('alex') === '9,15' && pos('amelia') === '19,3', 'jam 09: posisi blok pertama ' + [pos('adam'), pos('alex'), pos('amelia')]);
  ok(ev("npcAwake(NPCS.find(o=>o.id=='adam'))") === true && ev("(()=>{wC.x=11*32+16;wC.y=14*32+26;return npcNear(wC.x,wC.y).id})()") === 'adam', 'Adam aktif dan dapat diajak bicara');
  // dialog: baris pembuka tergantung blok jadwal
  const lines = id => ev(`npcLines(NPCS.find(o=>o.id=='${id}'))`); const a9 = lines('adam'); ok(a9.length === 3 && /zebra cross barat/.test(a9[0]), 'dialog Adam jam 09: ' + a9.length + ' baris, pembuka blok pagi');
  ev('lifeHour=()=>14'); const a14 = lines('adam'); ok(/timur/.test(a14[0]) && a14[1] === a9[1], 'jam 14 pembuka berganti, baris umum tetap');
  ev("S.set.lang='en'"); ok(/east/.test(lines('adam')[0]), 'dialog EN'); ev("S.set.lang='id'");
  // jalan antar blok: jam 14 -> Adam berjalan ke (27,15) dengan anim run, tidak menembus tabrakan, berhenti saat bicara
  ev('lifeHour=()=>11.9;cityNpcStep(.1);lifeHour=()=>12'); ev('wC.x=2*32;wC.y=14*32+26'); let moved = 0, bad = 0, last = pos('adam'); const x0 = ev("NPCS.find(o=>o.id=='adam').px");
  for (let i = 0; i < 12; i++) { ev('updWorld(.1)'); moved += ev("NPCS.find(o=>o.id=='adam').mv") ? 1 : 0; if (ev("citySolid(NPCS.find(o=>o.id=='adam').px,NPCS.find(o=>o.id=='adam').py)")) bad++; }
  ok(moved >= 10 && ev("NPCS.find(o=>o.id=='adam').px") > x0 && bad === 0, 'Adam berjalan antar blok (mv=' + moved + ') tanpa menembus tabrakan');
  { const o0 = ev('[NPCS.find(o=>o.id=="adam").px,NPCS.find(o=>o.id=="adam").py].join()'); ev("wTalk={o:NPCS.find(o=>o.id=='adam'),ls:['x'],i:0,n:'Adam'}"); run(10); ok(ev('[NPCS.find(o=>o.id=="adam").px,NPCS.find(o=>o.id=="adam").py].join()') === o0, 'NPC berhenti saat diajak bicara'); ev('wTalk=null'); }
  run(300); ok(pos('adam') === '27,15' && ev("NPCS.find(o=>o.id=='adam').mv") === 0, 'Adam tiba di blok siang (27,15) lalu diam: ' + pos('adam'));
  ev('lifeHour=()=>20;cityNpcStep(.1)'); ok(ev("npcAwake(NPCS.find(o=>o.id=='adam'))") === false && ev("npcHit(27*32+16,15*32+26)") === false, 'jam 20: Adam sudah pulang (tidak ada, tidak memblokir)');
  ev('lifeHour=()=>9;cityNpcStep(.1)'); ok(pos('adam') === '11,13', 'esok pagi muncul lagi di blok pertama');
  // menggambar: fallback hero saat ?mi=0
  ev('drawWorld()'); ok(true, 'drawWorld dengan ?mi=0 tidak error');
  // default (tanpa query) aktif: fetch atlas, siap, frame atlas digambar; ?mi=1 juga diterima
  ev("location.search='';cityMiS=null"); ok(ev('cityMiOn()') === true && ev('CITY_MI_DEFAULT') === true, 'default: sprite LimeZu aktif'); ev("location.search='?mi=1'"); ok(ev('cityMiOn()') === true, '?mi=1 tetap diterima'); ev("location.search=''");
  ev('cityMiStart()'); await new Promise(r => setImmediate(r)); await new Promise(r => setImmediate(r));
  ok(calls.some(u => /assets\/world\/mi_chars\.json$/.test(u)) && ev('cityMiReady()') === true, 'default: atlas dimuat dan siap');
  ev("globalThis.__dc=[];g.drawImage=function(){__dc.push(arguments)}"); ev('lifeHour=()=>9;cityNpcStep(.1)'); ev('drawWorld()'); const dc = ev('__dc.map(a=>[a[0]===cityMiS.IM,a[3],a[4],a[7],a[8]])');
  ok(dc.some(a => a[0] && a[1] === 16 && a[2] === 24 && a[3] === 32 && a[4] === 48), 'frame 16x24 atlas LimeZu digambar 2x (32x48)'); ok(dc.filter(a => a[0]).length >= 3, 'tiga warga digambar dari atlas pada jam 09');
  ev("location.search='?mi=0'"); ok(ev('cityMiOn()') === false, '?mi=0 mematikan lagi'); ev("location.search=''");
  // 4) lisensi, cache, precache
  const cr = rd('CREDITS'), lic = rd('docs/LICENSE_AND_ASSETS.md'), sw = rd('sw.js');
  ok(/LimeZu/.test(cr) && /mi_chars/.test(cr) && /NON-KOMERSIAL/i.test(cr) && /\?mi=0/.test(cr) && /pribadi/i.test(cr), 'CREDITS: LimeZu, mi_chars, non-komersial, pernyataan pemilik, ?mi=0');
  ok(/LimeZu/.test(lic) && /mi_chars/.test(lic) && /non-komersial/i.test(lic) && /jangan menjual/i.test(lic) && /\?mi=0/.test(lic) && /sebelum proyek dipublikasikan/i.test(lic), 'LICENSE_AND_ASSETS: LimeZu, non-komersial, larangan jual, langkah sebelum publikasi, ?mi=0');
  ok(/const VERSION = 'v90'/.test(sw) && /cache: v90/.test(rd('VERSION')), 'cache v90'); ok(sw.includes("'./assets/world/mi_chars.json'") && sw.includes("'./assets/world/mi_chars.png'"), 'atlas LimeZu di-precache (aktif default)');
  console.log('PASS: NPC Kota — ' + n + ' pemeriksaan');
})().catch(e => { console.error(e); process.exit(1); });
