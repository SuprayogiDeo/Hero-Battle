/* ===== DUNIA (Tahap 2A + 4: bangunan terbuka sesuai progres, musim salju, NPC di npc.js, tileset town.png opsional) =====
   st='world'. Peta tile 40x30 (tile data 16 px, tampil x2 = 32 px), kamera mengikuti pemain,
   joystick virtual (gaya kontrol manual), tabrakan tile, pemain = sprite hero.
   Aset sementara: kotak berwarna. Bangunan baru penanda (belum membuka layar; itu Tahap 2B).
   Posisi pemain: S.world={x,y} (piksel dunia, titik kaki), disimpan lewat sv(). Penyimpanan tetap via Save.*. */
const WT=16,WZ=2,WS=WT*WZ;let WW=40,WH=30;
const WROWS=[
'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
'TT................GGGG..............T..T',
'T..T..............GGGG....T.........T..T',
'TTT................dd..................T',
'T.......SSSS.......,,.......RRRR.....T.T',
'TT......SSSS.......,,.......RRRR....T..T',
'T.T.....SSSS.......,,.......RRRR....T.TT',
'T..T....SSSS.......,,.......RRRR.......T',
'T..T....SSSS.......,,.......RRRR.......T',
'T..T.....dd........,,........dd........T',
'T........,,........,,........,,........T',
'TT.......,,........,,...QQ...,,........T',
'T........,,........,,...QQ...,,.....TT.T',
'T........,,........,,........,,........T',
'T.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.T',
'TT,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.T',
'TT.................,,..................T',
'T..................,,..................T',
'TT.T...............,,..................T',
'TT...FFFFFFFF......,,.....~~~~~~~~~...TT',
'TT.T.FppppppF......,,.....~~~~~~~~~..T.T',
'TT...FppppppF......,,.....~~~~~~~~~..T.T',
'T....FppppppF......,,.....~~~~~~~~~..T.T',
'T....FppppppF......,,.....~~~~~~~~~....T',
'T.T..FFFddFFF......,,.....~~~~~~~~~..T.T',
'TT......,,,,,,,,,,,,,.....~~~~~~~~~..T.T',
'T.T.....,,,,,,,,,,,,,..................T',
'T..................,,................TTT',
'TT.......T.........,,................TTT',
'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'];
/* legenda: . rumput  , jalan  d pintu/celah  T pohon  ~ air  S toko (rumah 4x5)  R barak (rumah 4x5)  G gerbang  Q papan misi  F pagar ladang  p petak ladang */
const WMAP=WROWS.map(r=>r.split('')),WSOL={T:1,'~':1,S:1,R:1,G:1,Q:1,F:1,X:1},WNAME={S:'TOKO',R:'BARAK',G:'GERBANG',Q:'PAPAN MISI',F:'LADANG'},WSPAWN=[19,15];
const WBLD=(()=>{const b={};WMAP.forEach((r,y)=>r.forEach((c,x)=>{if(!WNAME[c])return;const o=b[c]||(b[c]={c,x0:x,y0:y,x1:x,y1:y});o.x0=Math.min(o.x0,x);o.y0=Math.min(o.y0,y);o.x1=Math.max(o.x1,x);o.y1=Math.max(o.y1,y)}));return Object.values(b)})();
const wAct=self.Anim?new Anim.Actor('avatar'):null; /* Tahap 5A: avatar Sunnyside */
/* Tahap 5B: desa Sunnyside (Tmap). Bila village.json belum siap, peta lama tetap dipakai. */
let wVon=0;
function wUseV(){if(wVon||!self.Tmap||!Tmap.ready())return;const V=Tmap.data();WW=V.w;WH=V.h;WMAP.length=0;V.grid.forEach(r=>WMAP.push(r.split('')));WBLD.length=0;for(const c in WBM)delete WBM[c];
for(const c in V.bld){const b=V.bld[c],o={c,x0:b[0],y0:b[1],x1:b[2],y1:b[3]};WBLD.push(o);WBM[c]=o}
WSPAWN[0]=V.spawn[0];WSPAWN[1]=V.spawn[1];if(typeof NPCS!='undefined')NPCS.forEach(o=>{const p=V.npcs[o.id];if(p){o.tx=p[0];o.ty=p[1]}});wVon=1}
let wjx=0,wjy=0,wjid=null,wcx=null,wcy=0,wface=1,wwalk=0,wHint=0,wFrom=0,wDlg=0,wNear=null;
/* ---- Tahap 4 ---- */
let wNpc=null,wTalk=null,wMsg={t:0,s:''},wSn=0;
const wL=(a,b)=>S.set.lang=='en'?b:a; /* teks 2 bahasa langsung di kode (tanpa kamus i18n) */
const WUN={R:3,F:5,Q:8}; /* stage tertinggi (best) untuk membuka bangunan; tidak tercantum = selalu terbuka (Toko, Gerbang) */
const wLock=c=>best<(WUN[c]||0);
function wSay(s,tm){wMsg={t:tm||3,s}}
/* Musim: S.set.season 0=otomatis (Des-Feb = salju), 1=normal, 2=salju */
function wSnow(){const m=S.set.season|0;return m==2||(m==0&&[11,0,1].includes(new Date().getMonth()))}
function wUnlockCheck(){const sn=S.wseen=(S.wseen&&typeof S.wseen=='object')?S.wseen:{},nw=[];for(const c in WUN)if(best>=WUN[c]&&!sn[c]){sn[c]=1;nw.push(WNAME[c])}if(nw.length){sv();wSay(wL('Bangunan baru terbuka: ','New building unlocked: ')+nw.join(', '),5);sfx('clear')}}
/* Aset (CC0): "Adventure Awaits Asset Pack" oleh Ishtar Pixels -> assets/tiles/adv.png (tanah, rumput, air, rumah, pohon, pagar).
   Tanaman: "16x16 RPG Tileset" oleh hilau (OpenGameArt) -> assets/tiles/plants.png. Bila gambar belum termuat/tidak ada, dunia memakai warna polos. */
const ADV=new Image();ADV.src='assets/tiles/adv.png';const PLT=new Image();PLT.src='assets/tiles/plants.png';
const wArt=()=>ADV.complete&&ADV.naturalWidth>0;
const WSP={t1:[99,16,42,54],t2:[174,21,52,49],S:[205,73,54,80],R:[68,73,54,80]}; /* x,y,w,h pada adv.png (S rumah merah, R rumah biru) */
const wVC={};
function wVar(k,md){const id=k+md;if(wVC[id])return wVC[id];const r=WSP[k],c=document.createElement('canvas');c.width=r[2];c.height=r[3];const x=c.getContext('2d');x.drawImage(ADV,r[0],r[1],r[2],r[3],0,0,r[2],r[3]);x.globalCompositeOperation='source-atop';
if(md=='s'){const gr=x.createLinearGradient(0,0,0,r[3]*.55);gr.addColorStop(0,'rgba(248,251,255,.92)');gr.addColorStop(1,'rgba(248,251,255,0)');x.fillStyle=gr}else x.fillStyle='rgba(14,14,30,.62)';x.fillRect(0,0,r[2],r[3]);return wVC[id]=c}
const WSPEED=96,WFH=9,WFV=8; // kecepatan px/detik; kotak kaki: setengah lebar 9, tinggi 8 (lebih kecil dari 1 tile)
function wSolid(px,py){const tx=Math.floor(px/WS),ty=Math.floor(py/WS);if(!(tx>=0&&ty>=0&&tx<WW&&ty<WH))return true;const c=WMAP[ty][tx];return !!WSOL[c]||(c=='p'&&wLock('F'))}
const wBlocked=(x,y)=>wSolid(x-WFH,y-WFV)||wSolid(x+WFH,y-WFV)||wSolid(x-WFH,y)||wSolid(x+WFH,y)||!!(self.npcHit&&npcHit(x,y));
function worldEnter(){wUseV();const w=S.world;if(!w||!isFinite(w.x)||!isFinite(w.y)||wBlocked(w.x,w.y))S.world={x:WSPAWN[0]*WS+WS/2,y:WSPAWN[1]*WS+WS/2+8};wjx=wjy=0;wjid=null;wcx=null;wHint=6;wFrom=0;wDlg=0;wTalk=null;st='world';wUnlockCheck();sv();sfx('click')}
function worldLeave(){wjid=null;wjx=wjy=0;wFrom=0;wDlg=0;wTalk=null;st='menu';sv();sfx('click')}
function wMove(x,y){let dx=(x-JC[0])/JR,dy=(y-JC[1])/JR;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}wjx=l<.15?0:dx;wjy=l<.15?0:dy}
/* ---- Tahap 2B: bangunan = pintu ke layar lama. wFrom=1 berarti layar dibuka dari dunia, jadi KEMBALI -> goBack() -> dunia. ---- */
const WGO={S:'shop',R:'heroes',Q:'quests',F:'farm'},WGD=[['STAGE',190,124,260,32],['MENARA HARIAN',190,164,260,32],['BATAL',190,204,260,32]],WNR=22;
function wNearB(){const w=S.world;let b=null,bd=WNR;WBLD.forEach(o=>{const dx=Math.max(o.x0*WS-w.x,0,w.x-(o.x1+1)*WS),dy=Math.max(o.y0*WS-w.y,0,w.y-(o.y1+1)*WS),d=Math.hypot(dx,dy);if(d<bd){bd=d;b=o}});return b}
function wGo(s){wbCheck();wFrom=1;wDlg=0;wTalk=null;wjid=null;wjx=wjy=0;sv();st=s}
function wInteract(){if(st!='world'||wDlg)return;if(wTalk){npcAdv();return}wjid=null;wjx=wjy=0;
if(wNpc){npcStart(wNpc);return}if(!wNear)return;sfx('click');
if(wLock(wNear.c)){wSay(wL('Terkunci. Capai stage '+WUN[wNear.c]+' dulu (rekormu: '+best+')','Locked. Reach stage '+WUN[wNear.c]+' first (your best: '+best+')'),3);return}
if(wNear.c=='G'){wDlg=1;return}wGo(WGO[wNear.c])}
function worldResume(){wjid=null;wjx=wjy=0;wDlg=0;wTalk=null;wHint=0;st='world';wUnlockCheck();sv()}
function goBack(){if(wFrom)worldResume();else st='menu'}
function worldDown(id,x,y){if(wTalk){npcAdv();return}if(wDlg){WGD.forEach((b,i)=>{if(x>=b[1]&&x<=b[1]+b[3]&&y>=b[2]&&y<=b[2]+b[4]){sfx('click');if(i==0)wGo('stages');else if(i==1)wGo('tower');else wDlg=0}});return}
if((wNear||wNpc)&&x>=220&&x<=420&&y>=296&&y<=324){wInteract();return}
if(x>=500&&x<=630&&y>=6&&y<=34){worldLeave();return}if(x<170&&y>180){wjid=id;wMove(x,y)}}
function updWorld(dt){const w=S.world;let dx=wjx,dy=wjy;const kx=(KD.d||KD.arrowright?1:0)-(KD.a||KD.arrowleft?1:0),ky=(KD.s||KD.arrowdown?1:0)-(KD.w||KD.arrowup?1:0);if(kx||ky){const l=Math.hypot(kx,ky);dx=kx/l;dy=ky/l}
if(wDlg||wTalk)dx=dy=0;let mv=0;if(dx||dy){const nx=w.x+dx*WSPEED*dt,ny=w.y+dy*WSPEED*dt;if(!wBlocked(nx,w.y)){w.x=nx;mv=1}if(!wBlocked(w.x,ny)){w.y=ny;mv=1}if(dx)wface=dx>0?1:-1}
wwalk=mv?wwalk+dt:0;if(mv)qDirty=1;if(wAct)wAct.update(mv?dx:0,mv?dy:0);if(wVon)Tmap.update(dt);if(self.npcUpdate)npcUpdate(dt);
const tx=Math.max(0,Math.min(WW*WS-VW,w.x-VW/2)),ty=Math.max(0,Math.min(WH*WS-360,w.y-14-180));
if(wcx==null){wcx=tx;wcy=ty}else{const k=1-Math.exp(-10*dt);wcx+=(tx-wcx)*k;wcy+=(ty-wcy)*k}if(wHint>0)wHint-=dt;if(wMsg.t>0)wMsg.t-=dt;wNear=wNearB();wNpc=self.npcNear?npcNear(w.x,w.y):null}
const WBM={};WBLD.forEach(b=>WBM[b.c]=b);
const WGR=[[5,13],[5,13],[5,13],[5,13],[5,13],[3,11],[4,11],[5,11],[3,12],[4,12],[5,12],[3,13],[4,13]];
const roadOK=r=>r===undefined||',dSRGFp'.includes(r),watOK=r=>r===undefined||r=='~';
function wEdge(tx,ty,ok,b){const f=(x,y)=>ok(WMAP[y]&&WMAP[y][x]),mn=!f(tx,ty-1),ms=!f(tx,ty+1),mw=!f(tx-1,ty),me=!f(tx+1,ty);
const c=(mw&&me)?1:mw?0:me?2:1,r=(mn&&ms)?1:mn?0:ms?2:1;return[b[0]+c,b[1]+r]}
function aT(c,r,sx,sy){g.drawImage(ADV,c*16,r*16,16,16,sx,sy,WS,WS)}
function wTile(c,sx,sy,tx,ty){const n=hh(ty*WW+tx,2),sn=wSn,rd=c==','||c=='d',wt=c=='~';
if(!wArt()){g.fillStyle=wt?'#2a5a9a':rd?'#8b7650':c=='p'?'#5a3d22':'#2f5f36';g.fillRect(sx,sy,WS,WS);return}
if(rd){const e=wEdge(tx,ty,roadOK,[7,10]);aT(e[0],e[1],sx,sy)}
else if(wt){const e=wEdge(tx,ty,watOK,[15,14]);aT(e[0],e[1],sx,sy)}
else{const q=WGR[n*WGR.length|0];aT(q[0],q[1],sx,sy)}
if(c=='p'){g.fillStyle='#5a3d22';g.fillRect(sx,sy,WS,WS);g.fillStyle='#46301a';g.fillRect(sx+2,sy+8,WS-4,5);g.fillRect(sx+2,sy+20,WS-4,5)}
else if(c=='F'){const b=WBM.F,r=ty==b.y0?0:ty==b.y1?2:1,k=tx==b.x0?0:tx==b.x1?2:1;aT(1+k,6+r,sx,sy)}
else if(c=='G'){const b=WBM.G,r=ty-b.y0;aT(5+(tx&1),16+r,sx,sy);if(r==1&&tx>=19&&tx<=20){g.fillStyle='#241a38';g.fillRect(tx==19?sx+6:sx,sy+4,WS-6,WS-4);g.fillStyle='#000';g.fillRect(tx==19?sx+6:sx,sy+4,WS-6,2)}}
else if(c=='Q')aT(4,18,sx,sy);
if(sn&&c!='F'&&c!='G'&&c!='p'){g.fillStyle=wt?'rgba(215,235,250,.55)':rd?'rgba(228,236,244,.5)':'rgba(236,243,250,.78)';g.fillRect(sx,sy,WS,WS)}}
function wSprite(k,cxp,by,z,md){const r=WSP[k],w=r[2]*z,h=r[3]*z;if(md)g.drawImage(wVar(k,md),cxp-w/2,by-h,w,h);else g.drawImage(ADV,r[0],r[1],r[2],r[3],cxp-w/2,by-h,w,h)}
function wPlant(k,cx,cy,sc,rp){if(!(PLT.complete&&PLT.naturalWidth>0)||k==1)return false;const t=k==0?(rp?[26,3]:[27,1]):(rp?[24,4]:[25,6]),s=32*sc;g.drawImage(PLT,t[0]*16,t[1]*16,16,16,cx-s/2,cy+10*sc-s,s,s);return true}
function drawWorld(){const w=S.world;wSn=wSnow();g.fillStyle=wSn?'#c8d6e4':'#2f5f36';g.fillRect(-OX,0,VW,360);if(wcx==null){wcx=Math.max(0,Math.min(WW*WS-VW,w.x-VW/2));wcy=Math.max(0,Math.min(WH*WS-360,w.y-194))}
g.imageSmoothingEnabled=false;
const cx=Math.round(wcx),cy=Math.round(wcy),x0=Math.max(0,Math.floor(cx/WS)),x1=Math.min(WW-1,Math.floor((cx+VW)/WS)),y0=Math.max(0,Math.floor(cy/WS)),y1=Math.min(WH-1,Math.floor((cy+360)/WS)),tall=[];
if(wVon){Tmap.draw(g,cx,cy,OX,VW,wSn);tall.push(...Tmap.tall(g,cx,cy,OX,VW,wSn,wLock))}else{for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)wTile(WMAP[ty][tx],tx*WS-cx-OX,ty*WS-cy,tx,ty);
if(wArt()){for(let ty=y0;ty<=Math.min(WH-1,y1+3);ty++)for(let tx=Math.max(0,x0-2);tx<=Math.min(WW-1,x1+2);tx++)if(WMAP[ty][tx]=='T')tall.push({y:ty*WS+WS-2,k:hh(ty*WW+tx,6)>.5?'t1':'t2',x:tx*WS+WS/2-cx-OX,b:ty*WS+WS-2-cy,z:1.5,md:wSn?'s':0});
for(const c of'SR'){const b=WBM[c];if(!b)continue;tall.push({y:(b.y1+1)*WS,k:c,x:(b.x0+b.x1+1)*WS/2-cx-OX,b:(b.y1+1)*WS-cy,z:2,md:wLock(c)?'l':wSn?'s':0})}}}
tall.sort((a,b)=>a.y-b.y);const dT=l=>l.forEach(o=>{if(o.x>-90-OX&&o.x<VW+90)(o.f?o.f():wSprite(o.k,o.x,o.b,o.z,o.md))});
if(wNear&&!wDlg&&!wTalk&&!wNpc){const o=wNear;g.strokeStyle=wLock(o.c)?'#f88':'#fc4';g.globalAlpha=.6+.4*Math.sin(t*6);g.lineWidth=2;g.strokeRect(o.x0*WS-cx-OX+1,o.y0*WS-cy+1,(o.x1-o.x0+1)*WS-2,(o.y1-o.y0+1)*WS-2);g.globalAlpha=1}
const id=S.own[S.lead]?S.lead:(S.deck[0]||'recruit'),d=HEROES[HID[id]],px=w.x-cx-OX,py=w.y-cy,bob=wwalk?Math.abs(Math.sin(wwalk*10))*3:0,im=IM[d.s],ok=im&&im.complete&&im.naturalWidth>0;
dT(tall.filter(o=>o.y<=w.y));if(self.npcDraw)npcDraw(cx,cy,w.y,0);
if(wAct&&Anim.has('avatar_'+wAct.state)){Anim.shadow(g,px,py-1,9,3,.3);wAct.draw(g,px,py,performance.now(),WZ)}
else{g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(px,py-1,10,4,0,0,7);g.fill();
g.save();g.translate(px,py);if(wface<0)g.scale(-1,1);if(ok)spr(d.s,0,0,2,-bob);else{g.fillStyle=RC[d.rar];g.fillRect(-8,-30-bob,16,28)}g.restore()}
if(self.npcDraw)npcDraw(cx,cy,w.y,1);dT(tall.filter(o=>o.y>w.y));
WBLD.forEach(b=>{const sx=(b.x0+b.x1+1)*WS/2-cx-OX,ly=(b.y1+1)*WS-cy+13,my=(b.y0+b.y1+1)*WS/2-cy;if(!(sx>-90-OX&&sx<VW+90))return;const lk=wLock(b.c),rd=b.c=='F'&&!lk&&farmReady();
if(lk){if(b.c=='F'||b.c=='Q'){g.fillStyle='rgba(10,10,25,.55)';g.fillRect(b.x0*WS-cx-OX,b.y0*WS-cy,(b.x1-b.x0+1)*WS,(b.y1-b.y0+1)*WS)}
g.fillStyle='#ddd';g.fillRect(sx-7,my-4,14,11);g.strokeStyle='#ddd';g.lineWidth=2;g.beginPath();g.arc(sx,my-4,5,Math.PI,0);g.stroke();g.fillStyle='#333';g.fillRect(sx-1,my,2,4);
T(WNAME[b.c],sx,ly,'#99a',11,'center');T('STAGE '+WUN[b.c],sx,ly+12,'#f88',10,'center')}
else T(WNAME[b.c]+(rd?' (!)':''),sx,ly,rd?'#fc4':'#fff',11,'center')});
if(wSn){g.fillStyle='rgba(190,210,240,.08)';g.fillRect(-OX,0,VW,360);const nf=S.set.fx?70:30;g.fillStyle='#fff';for(let i=0;i<nf;i++){const x=(((hh(i,1)*VW+Math.sin(t*.8+i)*14-t*5)%VW)+VW)%VW-OX,y=(((hh(i,2)*380+t*(18+hh(i,3)*30))%380)+380)%380-10,z=(i%3)?1:2;g.fillRect(x|0,y|0,z,z)}}
if(!wTalk){g.globalAlpha=.35;g.fillStyle='#000';g.beginPath();g.arc(JC[0],JC[1],JR,0,7);g.fill();g.globalAlpha=.8;g.strokeStyle='#fff';g.lineWidth=2;g.stroke();g.globalAlpha=.85;g.fillStyle='#9cf';g.beginPath();g.arc(JC[0]+wjx*JR*.6,JC[1]+wjy*JR*.6,14,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=1;g.stroke();g.globalAlpha=1}
T(wL('DUNIA','WORLD'),12,22,'#fc4',12);btn(500,6,130,28,'MENU CEPAT',1);
if(wHint>0){g.globalAlpha=Math.min(1,wHint);T('Geser joystick kiri atau WASD untuk berjalan',320,342,'#9cf',11,'center');g.globalAlpha=1}
if(wMsg.t>0){g.globalAlpha=Math.min(1,wMsg.t);g.fillStyle='rgba(0,0,0,.75)';g.fillRect(60,44,520,24);g.strokeStyle='#fc4';g.lineWidth=1;g.strokeRect(60.5,44.5,519,23);T(wMsg.s,320,61,'#fe8',11,'center');g.globalAlpha=1}
if(!wDlg&&!wTalk){if(wNpc)btn(220,296,200,28,wL('E / KETUK: ','E / TAP: ')+wNpc.n[S.set.lang=='en'?1:0],1);else if(wNear)btn(220,296,200,28,wLock(wNear.c)?wL('TERKUNCI: STAGE ','LOCKED: STAGE ')+WUN[wNear.c]:'E / KETUK: '+WNAME[wNear.c],!wLock(wNear.c))}
if(wDlg){ov(.65);card(160,66,320,196,'#fc4',1);T('GERBANG',320,92,'#fc4',16,'center');T('Mau ke mana?',320,112,'#cde',11,'center');WGD.forEach((b,i)=>btn(b[1],b[2],b[3],b[4],b[0],i<2))}
if(self.npcUI)npcUI()}
addEventListener('pointermove',e=>{if(st=='world'&&e.pointerId===wjid){const r=cv.getBoundingClientRect();wMove((e.clientX-r.left)*VW/r.width-OX,(e.clientY-r.top)*360/r.height)}});
const wRel=e=>{if(e.pointerId===wjid){wjid=null;wjx=wjy=0}};addEventListener('pointerup',wRel);addEventListener('pointercancel',wRel);addEventListener('blur',()=>{wjid=null;wjx=wjy=0});
addEventListener('keydown',e=>{if(st!='world'||e.repeat)return;const k=e.key.toLowerCase();if(k=='e'||k==' '||k=='enter'){wInteract();e.preventDefault()}else if(k=='escape'){if(wDlg)wDlg=0;else wTalk=null}});
