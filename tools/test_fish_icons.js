#!/usr/bin/env node
'use strict';
/* Ikon ikan (9B-19): atlas fish_icons.png/json dari paket Hollow Dolphin, helper fishIcon + fallback teks, pemasangan di Buku Ikan dan tab IKAN, precache, kredit/lisensi. */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), assert = require('assert');
const root = path.join(__dirname, '..'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const life = rd('js/life.js');

// --- data: urutan & id LIFE_FISH
const fishIds = [...life.slice(life.indexOf('const LIFE_FISH=['), life.indexOf('];', life.indexOf('const LIFE_FISH=['))).matchAll(/\{id:'([a-z_]+)',name:/g)].map(m => m[1]);
ok(fishIds.length === 10, '10 ikan LIFE_FISH');
const meta = JSON.parse(rd('assets/world/fish_icons.json'));
ok(JSON.stringify(meta.order) === JSON.stringify([...fishIds, 'unknown']), 'urutan atlas = urutan LIFE_FISH + unknown');
ok(meta.cell === 16 && meta.cols === 11 && meta.rows === 1 && meta.width === 176 && meta.height === 16, 'dimensi atlas di json');
ok(/Hollow Dolphin/.test(meta.source.pack) && meta.source.file === 'fishing_icons_sheet_16x16.png' && meta.source.grid.cols === 12 && meta.source.grid.rows === 9, 'sumber tercatat');
const idxs = fishIds.map(id => meta.icons[id].sheetIndex);
ok(new Set(idxs).size === 10 && idxs.every(i => Number.isInteger(i) && i >= 0 && i < 108), '10 indeks ikon sheet unik dan valid');
fishIds.forEach((id, k) => { const ic = meta.icons[id]; ok(ic.x === k * 16 && ic.y === 0 && ic.w === 16 && ic.h === 16 && ic.sheetRow * 12 + ic.sheetCol === ic.sheetIndex && ic.why.length > 8, 'entri json ' + id); });
ok(meta.icons.unknown.derived === true && meta.icons.unknown.x === 160, 'sel unknown turunan di ujung');

// --- PNG: baca RGBA tanpa dependensi (semua filter PNG)
function readPng(buf) {
  ok(buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'tanda tangan PNG');
  let p = 8, w, h, ct, bd, idat = [], plte = null, trns = null;
  while (p < buf.length) { const len = buf.readUInt32BE(p), t = buf.toString('latin1', p + 4, p + 8), d = buf.slice(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; } else if (t === 'IDAT') idat.push(d); else if (t === 'PLTE') plte = d; else if (t === 'tRNS') trns = d; p += 12 + len; }
  const ch = { 6: 4, 2: 3, 0: 1, 4: 2, 3: 1 }[ct], bpp = Math.max(1, ch * bd / 8), stride = Math.ceil(w * ch * bd / 8), raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(h * stride); let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1)), cur = out.slice(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) { const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0; let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c), pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; v += pr; } cur[i] = v & 255; }
    prev = cur; }
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { let r, g, b, a = 255;
    if (ct === 6) [r, g, b, a] = [out[i * 4], out[i * 4 + 1], out[i * 4 + 2], out[i * 4 + 3]]; else if (ct === 3) { const k = out[i]; r = plte[k * 3]; g = plte[k * 3 + 1]; b = plte[k * 3 + 2]; a = trns && k < trns.length ? trns[k] : 255; } else if (ct === 2) [r, g, b] = [out[i * 3], out[i * 3 + 1], out[i * 3 + 2]]; else r = g = b = out[i];
    rgba.set([r, g, b, a], i * 4); }
  return { w, h, rgba };
}
const png = readPng(fs.readFileSync(path.join(root, 'assets/world/fish_icons.png')));
ok(png.w === 176 && png.h === 16, 'fish_icons.png 176x16');
const cellKey = k => { const px = []; let opaque = 0; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const o = ((y * png.w) + k * 16 + x) * 4; px.push(png.rgba.slice(o, o + 4).join(',')); if (png.rgba[o + 3]) opaque++; } return { key: px.join('|'), opaque }; };
const cells = meta.order.map((_, k) => cellKey(k));
ok(cells.every(c => c.opaque >= 40), 'setiap sel berisi gambar (tidak kosong)');
ok(new Set(cells.map(c => c.key)).size === 11, 'semua 11 sel berbeda');
ok(cells[10].opaque > 40, 'siluet unknown terisi');
{ const o0 = (0 * png.w + 160) * 4; let col = null, uniform = true; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const o = (y * png.w + 160 + x) * 4; if (png.rgba[o + 3]) { const c = png.rgba.slice(o, o + 3).join(','); col = col || c; if (c !== col) uniform = false; } } ok(uniform, 'siluet unknown berwarna rata'); }
// Reproduksi byte-identik bila paket sumber tersedia (opsional): FISH_SHEET=<path> node tools/test_fish_icons.js
if (process.env.FISH_SHEET && fs.existsSync(process.env.FISH_SHEET)) { const cp = require('child_process'), tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'fi-')); fs.cpSync(path.join(root, 'js'), path.join(tmp, 'js'), { recursive: true }); fs.mkdirSync(path.join(tmp, 'assets/world'), { recursive: true });
  cp.execFileSync('python3', [path.join(root, 'tools/build_fish_icons.py'), '--sheet', process.env.FISH_SHEET, '--root', tmp]); ok(fs.readFileSync(path.join(tmp, 'assets/world/fish_icons.png')).equals(fs.readFileSync(path.join(root, 'assets/world/fish_icons.png'))), 'rebuild dari sheet sumber identik'); }

// --- helper fishIcon (diekstrak dari js/life.js dan dijalankan dengan stub kanvas)
const m = life.match(/\/\* fishIcon:begin[\s\S]*?\/\* fishIcon:end \*\//); ok(!!m, 'blok fishIcon ada di life.js');
function run(imgState, lang) {
  const calls = [], texts = [], g = { save() { calls.push('save'); }, restore() { calls.push('restore'); }, drawImage(...a) { calls.push(['draw', ...a]); }, fillRect(...a) { calls.push(['fill', ...a]); }, strokeRect() { calls.push('stroke'); }, set fillStyle(v) {}, set strokeStyle(v) {}, set imageSmoothingEnabled(v) { calls.push('smooth:' + v); } };
  const T = (...a) => texts.push(a), S = { set: { lang } }; class Image { constructor() { Object.assign(this, imgState); } }
  const LIFE_FISH = fishIds.map((id, i) => ({ id, name: 'Nama' + i, en: 'Name' + i })), lifeFishById = id => LIFE_FISH.find(f => f.id === id) || null;
  const fn = new Function('g', 'T', 'S', 'Image', 'LIFE_FISH', 'lifeFishById', m[0] + '\nreturn {fishIcon,fishIconCell};')(g, T, S, Image, LIFE_FISH, lifeFishById);
  return { fn, calls, texts };
}
{ const r = run({ complete: true, naturalWidth: 176 }, 'id');
  ok(r.fn.fishIconCell('bluegill') === 0 && r.fn.fishIconCell('starlight_fish') === 9 && r.fn.fishIconCell('unknown') === 10 && r.fn.fishIconCell('nonexistent') === -1, 'indeks sel dari id');
  ok(r.fn.fishIcon('carp', 10.4, 20.6, 24) === true, 'ikon siap -> true'); const d = r.calls.find(c => c[0] === 'draw');
  ok(d && d[2] === 16 && d[3] === 0 && d[4] === 16 && d[5] === 16 && d[6] === 10 && d[7] === 21 && d[8] === 24 && d[9] === 24, 'drawImage memotong sel carp (x=16) dan menskala ke 24 px');
  ok(r.calls.includes('smooth:false') && r.texts.length === 0, 'tanpa smoothing dan tanpa teks bila ikon tergambar');
  r.fn.fishIcon('unknown', 0, 0); ok(r.calls.filter(c => c[0] === 'draw').pop()[2] === 160 && r.calls.filter(c => c[0] === 'draw').pop()[8] === 16, 'unknown = sel 10, ukuran default 16'); }
for (const st of [{ complete: false, naturalWidth: 0 }, { complete: true, naturalWidth: 0 }, { complete: true, naturalWidth: 96 }]) {   // belum dimuat / gagal / atlas terpotong
  const r = run(st, 'id'); ok(r.fn.fishIcon('mackerel', 5, 5, 24) === false && !r.calls.some(c => c[0] === 'draw'), 'fallback teks bila atlas belum siap: ' + JSON.stringify(st));
  ok(r.texts.length === 1 && r.texts[0][0] === 'NA' && r.texts[0][1] === 17 && r.texts[0][5] === 'center', 'fallback menulis inisial ikan di tengah kotak'); }
{ const r = run({ complete: true, naturalWidth: 176 }, 'en'); ok(r.fn.fishIcon('tidak_ada', 0, 0, 16) === false && r.texts[0][0] === '?', 'id tak dikenal -> badge "?" tanpa error');
  const r2 = run({ complete: false, naturalWidth: 0 }, 'en'); r2.fn.fishIcon('moss_fish', 0, 0, 16); ok(r2.texts[0][0] === 'NA', 'fallback ikut bahasa (EN)'); r2.fn.fishIcon('unknown', 0, 0, 16); ok(r2.texts[1][0] === '?', 'unknown tanpa gambar = "?"'); }

{ // tanpa global Image (harness tes / lingkungan tanpa DOM): tidak melempar, jatuh ke fallback teks
  const texts = []; const g = { fillRect() {}, strokeRect() {}, save() {}, restore() {}, drawImage() { throw new Error('tidak boleh menggambar'); }, set fillStyle(v) {}, set strokeStyle(v) {} };
  const f = new Function('g', 'T', 'S', 'LIFE_FISH', 'lifeFishById', m[0] + '\nreturn fishIcon;')(g, (...a) => texts.push(a), { set: { lang: 'id' } }, [{ id: 'carp', name: 'Ikan Mas', en: 'Carp' }], id => ({ id, name: 'Ikan Mas', en: 'Carp' }));
  ok(f('carp', 0, 0, 16) === false && texts[0][0] === 'IK', 'tanpa Image global -> fallback teks, tidak melempar'); }

// --- pemasangan
const book = life.slice(life.indexOf('function lifeDrawFishBook'), life.indexOf('function lifeFishBookClick')), shop = life.slice(life.indexOf('function lifeShopFishDraw'), life.indexOf('function lifeShopFishClick'));
ok(/fishIcon\(owned\?f\.id:'unknown',30,y\+5,24\)/.test(book) && !/fillRect\(30,y\+9,16,16\)/.test(book), 'Buku Ikan memakai fishIcon (siluet untuk yang belum ditemukan)');
ok(/fishIcon\(id,28,y\+4,24\)/.test(shop), 'tab IKAN Toko memakai fishIcon');
const sw = rd('sw.js'); ok(/\.\/assets\/world\/fish_icons\.png/.test(sw) && /\.\/assets\/world\/fish_icons\.json/.test(sw), 'sw.js precache atlas dan json');
ok(/Hollow Dolphin/.test(rd('CREDITS')) && /fish_icons/.test(rd('CREDITS')), 'CREDITS mencatat Hollow Dolphin');
const lic = rd('docs/LICENSE_AND_ASSETS.md'); ok(/Hollow Dolphin/.test(lic) && /belum terkonfirmasi/i.test(lic) && /build_fish_icons\.py/.test(lic), 'LICENSE_AND_ASSETS mencatat Hollow Dolphin dan status lisensi');
ok(/const VERSION = 'v90'/.test(sw) && /cache: v90/.test(rd('VERSION')), 'cache v90');
ok(!fs.existsSync(path.join(root, 'assets/world/fishing_icons_sheet_16x16.png')), 'sheet mentah tidak dimasukkan ke repo');

// --- HUD memancing (ikon tanpa teks) + popup tangkapan: tidak melempar di id dan en, memakai fishIcon (atlas siap maupun fallback)
{ const mu = life.match(/\/\* fishUi:begin[\s\S]*?\/\* fishUi:end \*\//); ok(!!mu, 'blok fishUi ada di life.js');
  ok(/lifeFishPopup\(lifeFish\)/.test(life) && /lifeFishHud\(lifeFish\)/.test(life), 'overlay dunia memanggil HUD dan popup');
  for (const lang of ['id', 'en']) for (const st of [{ complete: true, naturalWidth: 176 }, { complete: false, naturalWidth: 0 }]) {
    const r = run(st, lang), lifeLang = (a, b) => lang === 'en' ? b : a;
    const ui = new Function('g', 'T', 'fishIcon', 'lifeLang', mu[0] + '\nreturn {lifeFishHud,lifeFishPopup};');
    const gg = { fillRect() {}, strokeRect() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {} }, drawn = [];
    const u = ui(gg, (...a) => drawn.push(a[0]), (id, ...a) => { drawn.push('icon:' + id); return r.fn.fishIcon(id, ...a); }, lifeLang);
    for (const ph of ['waiting', 'bite', 'miss']) assert.doesNotThrow(() => u.lifeFishHud({ phase: ph }), 'HUD ' + ph + ' ' + lang);
    for (const fid of fishIds) assert.doesNotThrow(() => u.lifeFishPopup({ phase: 'caught', fish: { id: fid, name: 'Nama', en: 'Name', rarity: 'rare', price: 9 } }), 'popup ' + fid + ' ' + lang);
    assert.doesNotThrow(() => u.lifeFishPopup({ phase: 'caught', fish: null }), 'popup tanpa ikan'); n += 3;
    ok(drawn.includes('icon:unknown') && drawn.includes('icon:carp') && drawn.some(x => x === (lang === 'en' ? 'Name' : 'Nama')), 'HUD pakai siluet, popup pakai ikon ikan dan nama sesuai bahasa ' + lang + (st.complete ? '' : ' (fallback)')); } }
console.log('PASS: ikon ikan (' + n + ' pemeriksaan)');
