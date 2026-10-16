#!/usr/bin/env node
/* Tes layanan Tabib: emas berkurang tepat, penyembuhan racun/bakar, dan buff ramuan berakhir sesuai durasi stage. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'npc.js'), 'utf8');
const a = src.indexOf('const smithL='), b = src.indexOf('/* TABIB'), code = src.slice(a, src.indexOf('\n', a) + 1) + src.slice(b);
const ctx = { S: null, st: 'world', stage: 1, hs: [], say() {}, sfx() {}, sv() {} };
vm.createContext(ctx); vm.runInContext(code + ';Object.assign(this,{healerCure,healerBuy,healerTick,healerApply,healerInfect,healerBuffSum,HEALER_CURE,HEALER_BUFFS});', ctx);
const mk = g => ({ g, set: {}, buff: null });
// 1) Sembuhkan racun: emas turun persis HEALER_CURE, hanya racun yang hilang.
ctx.S = mk(500); ctx.healerInfect('poison'); ctx.healerInfect('burn');
assert.equal(ctx.healerCure('poison'), 'ok'); assert.equal(ctx.S.g, 500 - ctx.HEALER_CURE); assert.equal(ctx.S.ail.poison, 0); assert.ok(ctx.S.ail.burn > 0);
assert.equal(ctx.healerCure('burn'), 'ok'); assert.equal(ctx.S.g, 500 - 2 * ctx.HEALER_CURE); assert.equal(ctx.S.ail.burn, 0);
// 2) Tidak sakit atau emas kurang: emas tidak berubah.
assert.equal(ctx.healerCure('poison'), 'none'); assert.equal(ctx.S.g, 500 - 2 * ctx.HEALER_CURE);
ctx.S = mk(ctx.HEALER_CURE - 1); ctx.healerInfect('burn'); assert.equal(ctx.healerCure('burn'), 'gold'); assert.equal(ctx.S.g, ctx.HEALER_CURE - 1); assert.ok(ctx.S.ail.burn > 0);
// 3) Beli buff: emas turun tepat harga; gagal bila emas kurang.
const B = ctx.HEALER_BUFFS[0]; ctx.S = mk(B.g + 7); assert.equal(ctx.healerBuy(B.id), 'ok'); assert.equal(ctx.S.g, 7);
assert.equal(ctx.healerBuy(B.id), 'gold'); assert.equal(ctx.S.g, 7);
// 4) Durasi: aktif tepat B.stages stage berbeda, lalu berakhir.
ctx.S = mk(1000); ctx.healerBuy(B.id);
for (let s = 1; s <= B.stages; s++) { ctx.stage = s; ctx.healerTick(); assert.ok(ctx.S.tonic && ctx.healerBuffSum().on, 'buff harus aktif di stage ' + s); assert.equal(ctx.healerBuffSum().atk, B.atk); }
ctx.stage = B.stages; ctx.healerTick(); assert.ok(ctx.S.tonic, 'mengulang stage yang sama tidak mengurangi durasi');
ctx.stage = B.stages + 1; ctx.healerTick(); assert.equal(ctx.S.tonic, null, 'buff berakhir setelah durasi'); assert.equal(ctx.healerBuffSum().on, false);
// 5) Buff ramuan + masakan dibatasi total 15%.
ctx.S = mk(1000); ctx.S.buff = { atk: .10, hp: .10, stages: 2 }; ctx.healerBuy('bal'); ctx.healerBuy('str'); const sum = ctx.healerBuffSum(); assert.ok(sum.atk <= .15 + 1e-9 && sum.hp <= .15 + 1e-9);
// 6) Racun/bakar bertahan beberapa stage lalu hilang sendiri, dan diterapkan ke hero.
ctx.S = mk(0); ctx.healerInfect('poison'); ctx.healerInfect('burn'); ctx.stage = 1; ctx.healerTick();
ctx.hs = [{ hp: 100, mh: 100, dead: 0, poison: 0 }]; ctx.healerApply(); assert.equal(ctx.hs[0].poison, 6); assert.ok(ctx.hs[0].hp < 100 && ctx.hs[0].hp >= 1);
for (let s = 2; s <= 5; s++) { ctx.stage = s; ctx.healerTick(); } assert.equal(ctx.S.ail.poison, 0); assert.equal(ctx.S.ail.burn, 0);
console.log('Healer service tests OK');
