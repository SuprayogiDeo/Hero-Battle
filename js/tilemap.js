/* Hero Battle - tilemap.js (Tahap 5B)
   Skrip klasik. Memuat assets/world/village.json (+ tiles.png, sprites.png, sea.png), mem-bake lapisan tile
   (ground, shadow, decor) ke kanvas 1x, lalu menggambar HANYA bagian yang terlihat (blit subrect, x2).
   Laut = pola yang bergulir; ubin buih pantai beranimasi; objek (rumah/pohon/hewan/asap/kincir) diurutkan
   menurut posisi kaki agar pemain bisa lewat di belakang objek tinggi. Bergantung pada anim.js (opsional).
   Bila berkas gagal dimuat, ready() tetap false dan world.js memakai peta lama. */
var Tmap = (function () {
  var BASE = 'assets/world/', V = null, ti = null, si = null, sea = null, land = null, landS = null, seaP = null;
  var pend = 0, bad = false, okf = false, ANT = [], OB = [], CR = [], T = 0, VC = {};
  function ready() { return okf && !bad; }
  function data() { return V; }
  function load(src, cb) { pend++; var im = new Image(); im.onload = function () { pend--; cb && cb(im); if (!pend) bake(); }; im.onerror = function () { bad = true; pend--; }; im.src = src; return im; }
  function init(base) {
    if (base) BASE = base;
    try {
      fetch(BASE + 'village.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
        V = j; ti = load(BASE + j.tiles); si = load(BASE + j.sprites); sea = load(BASE + j.sea);
      }).catch(function () { bad = true; });
    } catch (e) { bad = true; }
  }
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function bake() {
    if (bad || !V) return;
    try {
      var W = V.w, H = V.h, tc = V.tcols; land = cv(W * 16, H * 16); var x = land.getContext('2d'); x.imageSmoothingEnabled = false;
      ANT = [];
      ['ground', 'shadow', 'decor', 'over'].forEach(function (L) {   /* 'over' (Tahap 6B): pagar jembatan, buih air terjun */
        var a = V.layers[L]; if (!a) return;
        for (var i = 0; i < a.length; i++) {
          var n = a[i]; if (!n) continue; var cx = (i % W) * 16, cy = ((i / W) | 0) * 16;
          if (V.anim[n]) { ANT.push({ x: cx, y: cy, f: V.anim[n] }); continue; }
          x.drawImage(ti, (n % tc) * 16, ((n / tc) | 0) * 16, 16, 16, cx, cy, 16, 16);
        }
      });
      var p = cv(128, 128), pc = p.getContext('2d'); pc.imageSmoothingEnabled = false; pc.drawImage(sea, 0, 0, 64, 64, 0, 0, 128, 128);
      seaP = p; OB = V.objects.map(function (o) { return o; });
      CR = [];
      V.animals.forEach(function (a, k) {
        for (var i = 0; i < a.n; i++) { var z = a.z; var ox = z[0] + Math.random() * (z[2] - z[0]), oy = z[1] + Math.random() * (z[3] - z[1]);
          CR.push({ a: a.a, x: ox, y: oy, tx: ox, ty: oy, w: Math.random() * 3, fl: Math.random() < .5, mv: 0, z: z, sp: a.a == 'animal_chicken' ? 11 : a.a == 'animal_cow' ? 6 : 8 }); }
      });
      okf = true;
    } catch (e) { bad = true; }
  }
  function snowLand() {
    if (landS) return landS;
    landS = cv(land.width, land.height); var x = landS.getContext('2d'); x.drawImage(land, 0, 0);
    var im = x.getImageData(0, 0, landS.width, landS.height), d = im.data;
    for (var i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue; var r = d[i], g = d[i + 1], b = d[i + 2], k = (g > r + 6 && g > b) ? .74 : (r > g && r > b) ? .5 : 0;
      if (k) { d[i] += (232 - r) * k; d[i + 1] += (241 - g) * k; d[i + 2] += (250 - b) * k; }
    }
    x.putImageData(im, 0, 0); return landS;
  }
  /* kritter berkeliaran di padang */
  function update(dt) {
    if (!okf) return; T += dt;
    for (var i = 0; i < CR.length; i++) {
      var c = CR[i];
      if (c.w > 0) { c.w -= dt; c.mv = 0; if (c.w <= 0) { c.tx = c.z[0] + Math.random() * (c.z[2] - c.z[0]); c.ty = c.z[1] + Math.random() * (c.z[3] - c.z[1]); } continue; }
      var dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { c.w = 1.5 + Math.random() * 4; c.mv = 0; continue; }
      c.x += dx / d * c.sp * dt; c.y += dy / d * c.sp * dt; c.mv = 1; if (Math.abs(dx) > 1) c.fl = dx > 0;
    }
  }
  function sea_(g, cx, cy, OX, VW, snow) {
    var ox = -(cx + Math.floor(T * 7)) % 128, oy = -(cy + Math.floor(T * 3.5)) % 128;
    g.save(); g.translate(-OX + ox - 128, oy - 128); g.fillStyle = g.createPattern(seaP, 'repeat'); g.fillRect(0, 0, VW + 256, 360 + 256); g.restore();
    if (snow) { g.fillStyle = 'rgba(190,215,240,.18)'; g.fillRect(-OX, 0, VW, 360); }
  }
  /* gambar laut + tanah (+ buih beranimasi); cx,cy = kamera (px layar x2) */
  function draw(g, cx, cy, OX, VW, snow) {
    if (!okf) return; var old = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false;
    sea_(g, cx, cy, OX, VW, snow);
    var src = snow ? snowLand() : land, sx = cx >> 1, sy = cy >> 1, offx = cx & 1, offy = cy & 1;
    var sw = Math.min(Math.ceil(VW / 2) + 1, src.width - sx), sh = Math.min(181, src.height - sy);
    g.drawImage(src, sx, sy, sw, sh, -OX - offx, -offy, sw * 2, sh * 2);
    var tc = V.tcols;
    for (var i = 0; i < ANT.length; i++) {
      var a = ANT[i], px = a.x * 2 - cx - OX, py = a.y * 2 - cy; if (px < -32 || px > VW || py < -32 || py > 360) continue;
      var n = a.f[Math.floor(T * 2.2) % a.f.length]; g.drawImage(ti, (n % tc) * 16, ((n / tc) | 0) * 16, 16, 16, px, py, 32, 32);
    }
    g.imageSmoothingEnabled = old;
  }
  function variant(k, md) {
    var id = k + md; if (VC[id]) return VC[id]; var r = V.spr[k], c = cv(r.w, r.h), x = c.getContext('2d');
    x.drawImage(si, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h); x.globalCompositeOperation = 'source-atop';
    if (md == 'l') { x.fillStyle = 'rgba(8,10,28,.55)'; x.fillRect(0, 0, r.w, r.h); }
    else { var gr = x.createLinearGradient(0, 0, 0, r.h); gr.addColorStop(0, 'rgba(242,247,252,.85)'); gr.addColorStop(.5, 'rgba(242,247,252,.15)'); gr.addColorStop(1, 'rgba(242,247,252,0)'); x.fillStyle = gr; x.fillRect(0, 0, r.w, r.h); }
    return VC[id] = c;
  }
  /* daftar objek tampak, siap diurutkan oleh world.js: {y,x,b,f} (y = kaki dunia, x/b = posisi layar) */
  function tall(g, cx, cy, OX, VW, snow, lockFn) {
    var out = []; if (!okf) return out; var tm = T * 1000;
    function add(wx, wy, h, fn, ky) { var sx = wx - cx - OX, sb = wy - cy; if (sx < -150 || sx > VW + 150 || sb < -10 || sb > 360 + h) return; out.push({ y: ky == null ? wy : ky, x: sx, b: sb, f: function () { fn(sx, sb); } }); }
    for (var i = 0; i < OB.length; i++) {
      var o = OB[i], wx = o.x * 2, wy = o.y * 2;
      if (o.a) { (function (o) { add(wx, wy, 120, function (sx, sb) { var an = o.a.indexOf('tree') == 0; Anim.draw(g, o.a, an ? tm + o.x * 41 : 0, sx, sb, false, 2); }); })(o); continue; }
      var r = V.spr[o.k]; if (!r) continue;
      (function (o, r) { add(wx, wy, r.h * 2, function (sx, sb) {
        var md = (o.c && o.c != 'f' && 'SR'.indexOf(o.c) >= 0 && lockFn(o.c)) ? 'l' : snow ? 's' : '';
        var im = md ? variant(o.k, md) : si, a = md ? 0 : r.x, b = md ? 0 : r.y;
        g.drawImage(im, a, b, r.w, r.h, Math.round(sx - r.w), Math.round(sb - r.h * 2), r.w * 2, r.h * 2); }); })(o, r);
    }
    CR.forEach(function (c) { add(c.x * 2, c.y * 2, 70, function (sx, sb) { Anim.draw(g, c.a, c.mv ? tm + c.x * 13 : 0, sx, sb, c.fl, 2); Anim.shadow(g, sx, sb - 1, 9, 3, .25); }); });
    V.smoke.forEach(function (s, k) { add(s.x * 2, s.y * 2 + 2, 120, function (sx, sb) { Anim.draw(g, s.a, tm + k * 700, sx, sb, false, 2); }); });
    var w = V.windmill, tw = OB.filter(function (o) { return o.k == 'windtower'; })[0];
    add(w.x * 2, w.y * 2, 140, function (sx, sb) { Anim.draw(g, 'windmill', tm, sx, sb, false, 2); }, tw ? tw.y * 2 + 1 : null);
    return out;
  }
  return { init: init, ready: ready, data: data, update: update, draw: draw, tall: tall };
})();
try { Tmap.init(); } catch (e) { }
