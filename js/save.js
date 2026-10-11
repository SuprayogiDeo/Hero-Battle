/* ===== SAVE: satu-satunya pintu ke penyimpanan data =====
   Semua baca/tulis data pemain lewat Save.* (jangan memanggil localStorage langsung di tempat lain).
   Nanti Firebase / login Google cukup dipasang di sini: ganti isi Store, atau tambahkan fungsi
   ke Save.onWrite (dipanggil setiap kali data utama ditulis) tanpa menyentuh kode game. */
/* Mode DEV: buka game dengan ?dev=1 (mis. .../index.html?dev=1). Hanya dalam mode ini js/dev.js dimuat (lihat boot.js),
   dan data disimpan di slot TERPISAH (akhiran _dev) sehingga progres asli tidak pernah tertimpa/ter-unlock. */
const DEV=/[?&]dev=1(&|$)/.test(location.search);
const SAVE_KEYS=DEV?{main:'hb_s4_dev',best:'hb_best_dev',man:'hb_man_dev'}:{main:'hb_s4',best:'hb_best',man:'hb_man'};
const Store={ // lapisan terendah: localStorage, aman bila diblokir (mode privat dsb.)
  get(k){try{return localStorage.getItem(k)}catch(e){return null}},
  set(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}},
  del(k){try{localStorage.removeItem(k)}catch(e){}}
};
const Save={
  onWrite:[], // fungsi(S,best) yang dipanggil setelah tiap simpan, mis. sinkron ke cloud
  readMain(){try{const q=JSON.parse(Store.get(SAVE_KEYS.main));return q&&q.own?q:null}catch(e){return null}},
  readBest(){return +Store.get(SAVE_KEYS.best)||0},
  readMan(){return Store.get(SAVE_KEYS.man)!='0'},
  writeMain(S,best){const ok=Store.set(SAVE_KEYS.main,JSON.stringify(S));Store.set(SAVE_KEYS.best,best);Save.onWrite.forEach(f=>{try{f(S,best)}catch(e){}});return ok},
  writeMan(v){Store.set(SAVE_KEYS.man,v?1:0)},
  wipe(){Object.keys(SAVE_KEYS).forEach(k=>Store.del(SAVE_KEYS[k]))}
};
