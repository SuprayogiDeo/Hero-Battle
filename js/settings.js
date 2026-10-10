/* ===== PENGATURAN ===== */
let setBack='menu',resetArm=0;
const fsEl=document.documentElement,fsOn=()=>document.fullscreenElement||document.webkitFullscreenElement,fsOK=!!(fsEl.requestFullscreen||fsEl.webkitRequestFullscreen);
/* Fullscreen otomatis: browser hanya mengizinkan lewat sentuhan/klik, jadi diminta di sentuhan pertama
   dan diulang di sentuhan berikutnya bila pemain keluar dari layar penuh. */
function fsReq(){if(!fsOK||fsOn())return;try{const r=(fsEl.requestFullscreen||fsEl.webkitRequestFullscreen).call(fsEl,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{})}catch(e){}}
addEventListener('pointerup',fsReq,true);addEventListener('keydown',fsReq,true);
/* Hentikan semua audio saat aplikasi ke latar belakang / layar mati, lanjut saat kembali. */
function aPause(){if(AC&&AC.state=='running')AC.suspend().catch(()=>{})}
function aResume(){if(AC&&AC.state!='running'&&!document.hidden)AC.resume().catch(()=>{})}
function bgOff(){aPause();if(st=='fight')st='pause';if(qDirty){qDirty=0;sv()}}
document.addEventListener('visibilitychange',()=>document.hidden?bgOff():aResume());
addEventListener('pagehide',bgOff);addEventListener('pageshow',aResume);addEventListener('freeze',aPause);addEventListener('resume',aResume);
function setVol(k,d){S.set[k]=Math.max(0,Math.min(10,S.set[k]+d));applyVol();sv();sfx('click')}
function setRows(){const q=S.set,r=[];
const seg=(y,lab,opts,sel,fn)=>{const w=Math.floor(320/opts.length);r.push({y,lab,o:opts.map((p,i)=>({x:300+i*w,w:w-6,t:p,on:sel==i,f:()=>{fn(i);sv();sfx('click')}}))})};
seg(50,'Bahasa',['INDONESIA','ENGLISH'],q.lang=='en'?1:0,i=>{q.lang=i?'en':'id';TC.clear();applyLang()});
seg(79,'Musik latar (BGM)',['ON','OFF'],q.bgm?0:1,i=>{q.bgm=i?0:1;applyVol()});
r.push({y:108,lab:'Musik',bar:'mv',o:[{x:300,w:34,t:'-',f:()=>setVol('mv',-1)},{x:536,w:34,t:'+',f:()=>setVol('mv',1)}]});
r.push({y:137,lab:'Efek suara',bar:'sv',o:[{x:300,w:34,t:'-',f:()=>setVol('sv',-1)},{x:536,w:34,t:'+',f:()=>setVol('sv',1)}]});
seg(166,'Kontrol hero manual',['ON','OFF'],MAN?0:1,i=>{MAN=!i;jid=aid=null;jx=jy=atkH=0;try{localStorage.setItem('hb_man',MAN?1:0)}catch(e){}});
seg(195,'Ukuran tombol kontrol',['KECIL','SEDANG','BESAR'],q.cs,i=>{q.cs=i;applyCS()});
seg(224,'Getar layar',['ON','OFF'],q.shake?0:1,i=>q.shake=i?0:1);
seg(253,'Angka damage',['ON','OFF'],q.dmg?0:1,i=>q.dmg=i?0:1);
seg(282,'Efek partikel',['TINGGI','RENDAH'],q.fx?0:1,i=>q.fx=i?1:0);
r.push({y:311,lab:'Hapus data',o:[{x:300,w:200,t:t<resetArm?'YAKIN? KETUK LAGI':'HAPUS DATA',on:t<resetArm,f:()=>{if(t<resetArm){try{['hb_s4','hb_best','hb_man'].forEach(k=>localStorage.removeItem(k))}catch(e){}location.reload()}else{resetArm=t+3;sfx('click')}}}]});
return r}
function drawSet(){ov(.92);btn(6,5,76,28,'KEMBALI');T('PENGATURAN',320,26,'#fc4',16,'center');
setRows().forEach(r=>{T(r.lab,24,r.y+16,'#cde',11);if(r.note)T(r.note,300,r.y+16,'#fa8',9);if(r.bar){g.fillStyle='#000';g.fillRect(342,r.y+3,188,16);g.fillStyle='#4a9';g.fillRect(344,r.y+5,184*S.set[r.bar]/10,12);T(S.set[r.bar]*10+'%',583,r.y+16,'#fff',10)}
r.o.forEach(b=>{g.fillStyle=b.on?'#2a7a4a':'#3a3560';g.fillRect(b.x,r.y,b.w,22);g.strokeStyle=b.on?'#6f8':'#000';g.lineWidth=2;g.strokeRect(b.x,r.y,b.w,22);T(b.t,b.x+b.w/2,r.y+15,'#fff',10,'center')})});
T('Aset: Kenney (CC0)',320,350,'#667',9,'center')}
function setClick(x,y){if(y<34&&x<80){st=setBack;setBack='menu';sv();sfx('click');return}for(const r of setRows())for(const b of r.o)if(x>=b.x&&x<=b.x+b.w&&y>=r.y&&y<=r.y+22){b.f();return}}
applyLang();applyCS();

