/* Hero Battle - cf.js
 Skrip klasik. Sakelar opt-in ?cf=1 untuk sprite atlas Cute Fantasy (assets/world/cf_atlas.png/json, Kenmi, non-komersial).
 Tanpa ?cf=1: CF.on === false, tidak ada fetch/Image baru, semua pemanggil memakai jalur lama (tampilan default tidak berubah).
 Dengan ?cf=1: hewan Kandang (ranch.js), tile jembatan dan sprite pagar objek dunia (tilemap.js) diganti dari atlas.
 Atlas belum siap / gagal dimuat -> setiap helper mengembalikan false/null dan pemanggil jatuh ke sprite lama. Data peta, tabrakan, chunk tidak disentuh. */
var CF = (function () {
  var ON = false;
  try { ON = /[?&]cf=1(?:[&#]|$)/.test((typeof location !== 'undefined' && location.search) || ''); } catch (e) { }
  var BASE = 'assets/world/', M = null, IM = null, bad = false, started = false;
  /* titik kaki (px sel 32) per hewan; sheet 2x2 sel 32: baris 0 = diam, baris 1 = jalan, 2 frame per baris, menghadap kiri */
  var FEET = { chicken: 20, cow: 24, pig: 21, sheep: 21 }, ANAME = { chicken: 'Chicken', cow: 'Cow', pig: 'Pig', sheep: 'Sheep' };
  /* jembatan (id tile 128-143 di bridge_tiles.json) -> sel Bridge_Wood 16 px (kolom, baris). Id lain null (pakai tile lama);
     tiang lama (132,141,142) tidak digambar karena Bridge_Wood sudah punya ujung gelondong sendiri. */
  var BR = { 128: [0, 1], 129: [1, 1], 130: [1, 1], 131: [2, 1], 133: [0, 2], 134: [1, 2], 135: [1, 2], 136: [2, 2], 137: [0, 3], 138: [1, 3], 139: [1, 3], 140: [2, 3] };
  var BR_SKIP = { 132: 1, 141: 1, 142: 1 };
  function start() {
    if (!ON || started) return; started = true;
    try {
      fetch(BASE + 'cf_atlas.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
        M = j.entries; var i = new Image();
        i.onload = function () { IM = i; }; i.onerror = function () { bad = true; }; i.src = BASE + 'cf_atlas.png';
      }).catch(function () { bad = true; });
    } catch (e) { bad = true; }
  }
  function ready() { return ON && !bad && !!IM && !!M; }
  /* true bila keputusan sudah final (siap atau gagal): chunk menunggu ini supaya tidak ter-bake setengah lama setengah baru */
  function settled() { return !ON || bad || ready(); }
  /* hewan: true bila tergambar. (x,y) = titik kaki, sc = skala, flip = cermin (sheet menghadap kiri) */
  function drawAnimal(g, type, t, x, y, sc, walk, flip) {
    if (!ready()) return false;
    var e = M['animals/' + ANAME[type]]; if (!e) return false;
    sc = sc || 1; var f = Math.floor(Math.max(0, t) / 260) % 2, sx = e.x + f * 32, sy = e.y + (walk ? 32 : 0), px = Math.round(x), py = Math.round(y), fy = FEET[type] || 22;
    var old = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false;
    if (flip) { g.save(); g.translate(px, py); g.scale(-1, 1); g.drawImage(IM, sx, sy, 32, 32, -16 * sc, -fy * sc, 32 * sc, 32 * sc); g.restore(); }
    else g.drawImage(IM, sx, sy, 32, 32, px - 16 * sc, py - fy * sc, 32 * sc, 32 * sc);
    g.imageSmoothingEnabled = old; return true;
  }
  /* tile jembatan: null = pakai tile lama; {im:null} = jangan gambar; {im,sx,sy[,dx,ux,uy]} = gambar sel 16x16 dari atlas (bila ux ada, gambar dasar ux,uy dulu; dx = geser x sel utama) */
  function tile(n) {
    if (!ready()) return null;
    if (BR_SKIP[n]) return { im: null };
    var c = BR[n]; if (!c) return null;
    var e = M['decor/Bridge_Wood']; if (!e) return null;
    var t = { im: IM, sx: e.x + c[0] * 16, sy: e.y + c[1] * 16 };
    /* sel ujung (kolom 0 / 2) punya tepi kosong 4-5 px: geser rata ke tepi petak dan isi dasarnya dengan sel tengah supaya ujung menempel di tanah */
    if (c[0] !== 1) { t.dx = c[0] === 0 ? -5 : 4; t.ux = e.x + 16; t.uy = t.sy; }
    return t;
  }
  /* pagar objek dunia (fence_h / fence_v): true bila tergambar. (sx,sb) = tengah-bawah di layar (skala 2x seperti sprite lama) */
  function drawFence(g, k, sx, sb) {
    if (!ready()) return false;
    var e = M['decor/Fences']; if (!e || (k !== 'fence_h' && k !== 'fence_v')) return false;
    var h = k === 'fence_h', ox = e.x + (h ? 32 : 0), oy = e.y + (h ? 0 : 16), old = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    g.drawImage(IM, ox, oy, 16, 16, Math.round(sx - 16), Math.round(sb - (h ? 26 : 32)), 32, 32);
    g.imageSmoothingEnabled = old; return true;
  }
  start();
  return { on: ON, ready: ready, settled: settled, drawAnimal: drawAnimal, tile: tile, drawFence: drawFence };
})();
