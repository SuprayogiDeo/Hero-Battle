#!/usr/bin/env node
/* Tes upgrade gear Pandai Besi: sukses mengurangi emas+bahan & naik level; gagal bila material kurang tanpa mengurangi emas. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'npc.js'), 'utf8');
const code = src.slice(src.indexOf('/* TEMPA PANDAI BESI'));
const ctx = { S: null, RAR: ['N', 'R', 'SR', 'SSR'], st: 'world', say() {}, sfx() {}, sv() {}, equippedBy: () => 0, storagecraftEnsure() {} };
vm.createContext(ctx); vm.runInContext(code + ';this.smithUpgrade=smithUpgrade;this.smithCost=smithCost;', ctx);
const mk = () => ({ g: 1000, set: {}, items: [], gather: { items: { stone: 0, wood: 0 } }, materialStorage: { items: { stone: 0, wood: 0 } } });
{ ctx.S = mk(); const it = { u: 1, rar: 'N', lv: 0 }; ctx.S.items.push(it); ctx.S.gather.items.stone = 1; ctx.S.gather.items.wood = 5;
  assert.equal(ctx.smithUpgrade(it), 'mat'); assert.equal(ctx.S.g, 1000, 'emas tidak boleh berkurang bila material kurang'); assert.equal(it.fg | 0, 0); assert.equal(ctx.S.gather.items.stone, 1); assert.equal(ctx.S.gather.items.wood, 5); }
{ ctx.S = mk(); const it = { u: 1, rar: 'N', lv: 0 }; ctx.S.items.push(it); ctx.S.gather.items.stone = 1; ctx.S.materialStorage.items.stone = 1; ctx.S.gather.items.wood = 1; const c = ctx.smithCost(it);
  assert.equal(ctx.smithUpgrade(it), 'ok'); assert.equal(it.fg, 1); assert.equal(ctx.S.g, 1000 - c.g); assert.equal(ctx.S.gather.items.stone + ctx.S.materialStorage.items.stone, 0); assert.equal(ctx.S.gather.items.wood, 0); }
{ ctx.S = mk(); ctx.S.g = 5; const it = { u: 1, rar: 'N', lv: 0 }; ctx.S.items.push(it); ctx.S.gather.items.stone = 9; ctx.S.gather.items.wood = 9;
  assert.equal(ctx.smithUpgrade(it), 'gold'); assert.equal(ctx.S.g, 5); assert.equal(ctx.S.gather.items.stone, 9); }
{ ctx.S = mk(); const it = { u: 1, rar: 'N', lv: 0, fg: 5 }; assert.equal(ctx.smithUpgrade(it), 'max'); }
console.log('Smith upgrade tests OK');
