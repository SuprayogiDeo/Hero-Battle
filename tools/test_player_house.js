#!/usr/bin/env node
'use strict';
/* Tes Rumah Pemain: keluar-masuk pintu, isi peti tetap ada setelah save+load, dan tempat tidur melewati malam. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
const { context, vm } = mod.exports, ev = c => vm.runInContext(c, context, { timeout: 5000 });
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const settle = () => { for (let i = 0; i < 60; i++) ev('updWorld(.016)'); };
const stand = (act, dx) => ev(`{const o=wI.room.objs.find(o=>o.act=='${act}');wI.x=o.x*WS+WS*${dx};wI.y=(o.y+1)*WS+16;wI.near=intNear()}`);
const enter = () => { ev("S.world={x:328*2,y:208*2+20};best=10;st='world';wI=null;wFade=null;hudEnsure()"); ok(ev('hudCtx().l') === 'MASUK', 'pintu Rumah Pemain memberi konteks MASUK'); ev('wInteract()'); settle(); };
const leave = () => { ev('wI.x=wI.room.sx;wI.y=wI.room.sy;wI.near=intNear()'); ok(ev('hudCtx().l') === 'KELUAR', 'dekat pintu => KELUAR'); ev('wInteract()'); settle(); };

// 1) pintu masuk dan keluar
ok(ev("INT_B.some(b=>b.id==='rumah'&&b.tpl==='home')"), 'Rumah Pemain terdaftar di INT_B');
enter(); ok(ev('!!wI') && ev('wI.b.id') === 'rumah', 'masuk ke interior Rumah Pemain');
ok(ev('S.world.x') === 656 && ev('S.world.y') === 436, 'posisi dunia tetap di pintu luar saat di dalam');
leave(); ok(ev('wI') === null && ev('S.world.x') === 656, 'keluar kembali ke pintu eksterior');
enter(); leave(); ok(ev('wI') === null, 'masuk-keluar berulang tetap konsisten');

// 2) peti: isi tetap ada setelah save + load baru
enter(); stand('storage', 0.5); ok(ev('hudCtx().on') !== 0, 'dekat peti ada aksi');
ev('wInteract()'); ok(ev('st') === 'storage', 'peti membuka layar penyimpanan'); ev('goBack()');
ev("storagecraftEnsure();S.materialStorage.items.wood=7;S.materialStorage.items.stone=3;sv()");
ev("S=Object.assign({},Save.readMain());storagecraftEnsure()");
ok(ev('S.materialStorage.items.wood') === 7 && ev('S.materialStorage.items.stone') === 3, 'isi peti tetap ada setelah load');
ev("st='world';wI=null;wFade=null"); enter(); stand('storage', 0.5); ev('wInteract()');
ok(ev('st') === 'storage' && ev('scMaterialCount("wood")') >= 7, 'peti yang dibuka lagi masih berisi bahan'); ev("st='world'"); ev('wI=null');

// 3) tempat tidur: melewati malam, ditolak saat siang atau jam asli
const sleep = (hr, dn) => { enter(); ev(`S.set.dn=${dn};wHr=${hr}`); stand('bed', 1.5); ev('wInteract()'); settle(); const h = ev('wHr'); leave(); return h; };
const night = sleep(22, 0); ok(night >= 6 && night < 6.5, 'tidur malam hari membangunkan di pagi (06:00), dapat ' + night);
const early = sleep(2, 0); ok(early >= 6 && early < 6.5, 'dini hari juga bisa dilewati');
const noon = sleep(12, 0); ok(noon >= 12 && noon < 12.5, 'siang hari tidak melompat waktu');
const real = sleep(22, 1); ok(real === 22, 'mode jam asli tidak mengubah jam desa'); ev('S.set.dn=0');
console.log('Player house tests OK (' + n + ' checks)');
