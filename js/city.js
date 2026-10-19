/* KOTA KECIL (Batch 9B-26)
 Area terpisah 40x30 tile dengan chunk sendiri di assets/world/city/ (dibuat tools/build_city_map.py; ubin dari city_tiles.png, CC0).
 Dimuat SESUDAH hud.js (membungkus hudCtx/updWorld/drawWorld/worldDown/worldEnter/wTint/wZoomActive) dan sebelum input.js.
 Pola sama dengan interior.js: keadaan runtime wC = {x,y,cx,cy,near,returnPos}, TIDAK disimpan. S.world tetap = titik di desa (di depan gerbang),
 jadi simpan/muat saat di kota selalu pulih di desa (titik aman). Peta desa (Tmap, WMAP, WW, WH) tidak pernah disentuh.
 Gerbang masuk = kode (CITY_GATE, tile desa di tepi timur, digambar lewat wTint) supaya data peta desa tetap identik.
 Gerbang kembali = ujung barat jalan kota (tombol aksi). Data dimuat malas (fetch) saat pemain mendekati gerbang; cityInstall() juga dipakai tes. */
const CITY_DIR='assets/world/city/',CITY_GATE={x:126,y:23},CITY_LAND={x:124,y:23};
const CITY_IM=typeof Image==='function'?Object.assign(new Image(),{src:CITY_DIR+'city_tiles.png'}):null;
/* Sprite warga kota dari atlas Modern Interiors (LimeZu, versi GRATIS = NON-KOMERSIAL). Pemilik memastikan proyek ini pribadi dan non-komersial, jadi aktif secara default;
 ?mi=0 mematikannya (NPC memakai sprite hero cadangan o.h, tanpa fetch/Image atlas). Bila proyek kelak dipublikasikan/dikomersialkan: set CITY_MI_DEFAULT=false dan hapus mi_chars.* */
const CITY_MI_DEFAULT=true;
/* Bangunan kota (Step 8): bx,by,bw,bh = badan gedung (tile peta kota, SOLID); pintu = tile di bawah tengah-bawah gedung (dx, by+bh); tpl = templat interior (interior.js INT_T).
 Gedung luar digambar kode (kotak sederhana, sementara) karena paket sampler tidak punya gedung; interior memakai sprite Modern Interiors (atlas mi_interior). */
const CITY_B=[
{id:'kafe',tpl:'ccafe',bx:3,by:2,bw:6,bh:3,dx:5,col:['#c9d6df','#8fa3b3','#3fa7a0'],n:['KAFE KOTA','CITY CAFE']},
{id:'toko_kota',tpl:'cshop',bx:26,by:2,bw:6,bh:3,dx:28,col:['#e8d9a8','#b79d55','#c2563b'],n:['TOKO KOTA','CITY SHOP']},
{id:'apartemen',tpl:'capt',bx:24,by:18,bw:7,bh:4,dx:27,col:['#d7b9a6','#9c7560','#5879b8'],n:['APARTEMEN','APARTMENT']}];
let wC=null,cityD=null,cityLoading=0,cityFailAt=0,cityMiS=null;
function cityMiOn(){try{const q=(typeof location!=='undefined'&&location.search)||'';if(/[?&]mi=0(?:[&#]|$)/.test(q))return false;return CITY_MI_DEFAULT||/[?&]mi=1(?:[&#]|$)/.test(q)}catch(e){return false}}
function cityMiStart(){
 if(cityMiS||!cityMiOn()||typeof fetch!=='function')return;const m=cityMiS={M:null,IM:null,bad:0};
 try{fetch('assets/world/mi_chars.json').then(r=>{if(!r.ok)throw 0;return r.json()}).then(j=>{m.M=j;const i=new Image();i.onload=()=>{m.IM=i};i.onerror=()=>{m.bad=1};i.src='assets/world/mi_chars.png'}).catch(()=>{m.bad=1})}catch(e){m.bad=1}
}
const cityMiReady=()=>!!(cityMiS&&cityMiS.M&&cityMiS.IM&&!cityMiS.bad);
const cityNpcArea=()=>wC?'city':'';
/* ---------- data ---------- */
function cityInstall(idx,chunks,atlas){
 try{
  const W=idx.w,H=idx.h,ground=new Uint8Array(W*H),col=new Uint8Array(W*H).fill(1),props=[];
  chunks.forEach(c=>{for(let y=0;y<c.h;y++)for(let x=0;x<c.w;x++){const i=(c.y+y)*W+c.x+x;ground[i]=c.layers.ground[y*c.w+x];col[i]=c.layers.collision[y*c.w+x]}c.objects.forEach(o=>props.push(o))});
  CITY_B.forEach(b=>{for(let y=b.by;y<b.by+b.bh;y++)for(let x=b.bx;x<b.bx+b.bw;x++)if(x>=0&&y>=0&&x<W&&y<H)col[y*W+x]=1});
  props.sort((a,b)=>(a.y+a.fh)-(b.y+b.fh)||a.x-b.x);
  cityD={idx:idx,W:W,H:H,ground:ground,col:col,props:props,chunks:chunks,rects:atlas.entries,cv:{}};return true;
 }catch(e){cityD=null;return false}
}
function cityLoad(){
 if(cityD||cityLoading||typeof fetch!=='function'||Date.now()-cityFailAt<5000)return;cityLoading=1;
 const j=u=>fetch(u).then(r=>{if(!r.ok)throw new Error(u);return r.json()});
 try{j(CITY_DIR+'city.json').then(idx=>Promise.all([Promise.all(idx.chunks.map(c=>j(CITY_DIR+c.file))),j(CITY_DIR+idx.atlasMeta)]).then(r=>{cityInstall(idx,r[0],r[1]);cityLoading=0})).catch(()=>{cityLoading=0;cityFailAt=Date.now()})}catch(e){cityLoading=0;cityFailAt=Date.now()}
}
/* ---------- tabrakan ---------- */
function citySolid(px,py){if(!cityD)return true;const tx=Math.floor(px/WS),ty=Math.floor(py/WS);if(tx<0||ty<0||tx>=cityD.W||ty>=cityD.H)return true;return cityD.col[ty*cityD.W+tx]===1}
const cityBlocked=(x,y)=>citySolid(x-WFH,y-WFV)||citySolid(x+WFH,y-WFV)||citySolid(x-WFH,y)||citySolid(x+WFH,y)||!!(self.npcHit&&npcHit(x,y));
/* ---------- warga kota: jadwal (npc.js plan) + jalan antar blok lewat BFS pada grid tabrakan ---------- */
function cityPath(ax,ay,bx,by){
 const D=cityD;if(!D)return null;const W=D.W,H=D.H,key=(x,y)=>y*W+x,prev=new Map([[key(ax,ay),-1]]),q=[[ax,ay]];
 for(let i=0;i<q.length;i++){const c=q[i];if(c[0]===bx&&c[1]===by){const out=[];let k=key(bx,by);while(k!==-1){out.push([k%W,Math.floor(k/W)]);k=prev.get(k)}return out.reverse()}
  [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const x=c[0]+d[0],y=c[1]+d[1];if(x<0||y<0||x>=W||y>=H||D.col[key(x,y)]||prev.has(key(x,y)))return;prev.set(key(x,y),key(c[0],c[1]));q.push([x,y])})}
 return null;
}
const cityDirTo=(dx,dy)=>Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
function cityNpcStep(dt){
 const w=wC,h=npcHour();
 NPCS.forEach(o=>{
  if(!o.plan||o.area!=='city')return;if(!npcAwake(o)){o._blk=undefined;o.path=null;o.mv=0;return}
  npcSync(o);const b=npcPlanBlock(o,h),t=o.plan[b];
  if(o._blk===undefined){o._blk=b;o.px=t[2]*WS+WS/2;o.py=t[3]*WS+26;o.path=null;o.mv=0;o.face='down'}
  else if(o._blk!==b){o._blk=b;const p=cityPath(Math.floor(o.px/WS),Math.floor(o.py/WS),t[2],t[3]);if(p&&p.length>1)o.path=p.slice(1);else{o.path=null;o.px=t[2]*WS+WS/2;o.py=t[3]*WS+26}}
  const talk=wTalk&&wTalk.o===o;o.mv=0;
  if(talk){o.face=cityDirTo(w.x-o.px,w.y-o.py);return}
  if(o.path&&o.path.length&&!wDlg){const wp=o.path[0],gx=wp[0]*WS+WS/2,gy=wp[1]*WS+26,dx=gx-o.px,dy=gy-o.py,l=Math.hypot(dx,dy),st=(o.sp||40)*dt;
   if(l<=st){if(!(Math.abs(gx-w.x)<19&&Math.abs(gy-w.y)<13)){o.px=gx;o.py=gy;o.path.shift()}o.mv=1}
   else{const nx=o.px+dx/l*st,ny=o.py+dy/l*st;if(!(Math.abs(nx-w.x)<19&&Math.abs(ny-w.y)<13)){o.px=nx;o.py=ny;o.mv=1;o.face=cityDirTo(dx,dy)}}}
 });
}
/* ---------- gerbang & interaksi ---------- */
const cityGateXY=()=>[CITY_GATE.x*WS+WS/2,CITY_GATE.y*WS+WS/2+8];
function cityGateNear(){if(wC||wI||!S.world)return false;const p=cityGateXY();return Math.abs(S.world.x-p[0])<=48&&Math.abs(S.world.y-p[1])<=60}
const cityRetY=()=>cityD?cityD.idx.gates.return.tile[1]*WS+26:0;
function cityExitNear(){if(!wC||!cityD)return false;const g=cityD.idx.gates.return;return wC.x<=(g.tile[0]+1+g.zone)*WS&&Math.abs(wC.y-cityRetY())<=48}
const cityDoorXY=b=>[b.dx*WS+WS/2,(b.by+b.bh)*WS+26];
function cityDoorNear(){if(!wC)return null;for(const b of CITY_B){const p=cityDoorXY(b);if(Math.abs(wC.x-p[0])<=30&&Math.abs(wC.y-p[1])<=34)return b}return null}
function cityNear(){if(!wC)return null;if(cityExitNear())return{exit:1,l:wL('DESA','VILLAGE')};const bd=cityDoorNear();if(bd)return{door:bd,l:wL('MASUK','ENTER')};const o=self.npcNear?npcNear(wC.x,wC.y):null;return o?{npc:o,l:wL('BICARA','TALK')}:null}
function cityEnter(){
 if(wC||wFade)return;if(!cityD){cityLoad();wSay(wL('Kota sedang dimuat. Coba lagi sebentar.','Loading the city. Try again in a moment.'),2.5);sfx('click');return}
 cityMiStart();miIntStart();const back={x:S.world.x,y:S.world.y,tool:S.hb&&Number.isFinite(S.hb.sel)?S.hb.sel:0};
 intFade(()=>{const sp=cityD.idx.spawn;wC={x:sp[0]*WS+WS/2,y:sp[1]*WS+26,cx:null,cy:null,near:null,t:0,returnPos:back};wjid=null;wjx=wjy=0;NPCS.forEach(o=>{if(o.plan){o._blk=undefined;o.path=null}});wNear=null;wNpc=null;wPlace=null;wTalk=null;sv();sfx('click');wSay(wL('Selamat datang di Kota Kecil','Welcome to Little City'),3)});
}
function cityExit(){
 if(!wC||wFade)return;const back=wC.returnPos;
 intFade(()=>{wC=null;if(S.world){S.world.x=CITY_LAND.x*WS+WS/2;S.world.y=CITY_LAND.y*WS+WS/2+8;if(back&&S.hb)S.hb.sel=back.tool}wcx=null;wjid=null;wjx=wjy=0;wHint=0;wTalk=null;wNpc=null;sv();sfx('click')});
}
/* masuk gedung kota: wC dilepas (interior memakai wI), posisi kota disimpan di returnPos.city; intExit (dibungkus di bawah) memulihkan wC. S.world tetap titik desa => simpan/muat di dalam aman. */
function cityEnterB(b){
 if(!wC||wFade||wI)return;const back={x:S.world.x,y:S.world.y,tool:S.hb&&Number.isFinite(S.hb.sel)?S.hb.sel:0,city:{x:cityDoorXY(b)[0],y:cityDoorXY(b)[1]}},room=intCompile(b);miIntStart();
 intFade(()=>{wC=null;wI={b:b,room:room,x:room.sx,y:room.sy,near:null,cx:null,cy:null,returnPos:back};wjid=null;wjx=wjy=0;wNear=null;wNpc=null;wPlace=null;wTalk=null;sv();sfx('click')});
}
const _cityIntExit=intExit;
intExit=function(){
 const back=wI&&wI.returnPos;if(!(back&&back.city))return _cityIntExit();
 intFade(()=>{wI=null;wC={x:back.city.x,y:back.city.y,cx:null,cy:null,near:null,t:0,returnPos:{x:back.x,y:back.y,tool:back.tool}};if(S.hb)S.hb.sel=back.tool;wjid=null;wjx=wjy=0;wHint=0;wNear=null;wNpc=null;wPlace=null;wTalk=null;sv();sfx('click')});
};
function cityAct(n){if(n.exit){cityExit();return}if(n.door){cityEnterB(n.door);return}if(n.npc){sfx('click');npcStart(n.npc)}}
/* ---------- gambar ---------- */
const CITY_FB={grass:'#4ec41a',sidewalk:'#c8c8c8',cross:'#e6e6f0',road:'#343a4c'};
function cityChunkCanvas(c){
 const D=cityD,k=c.x+'_'+c.y;if(D.cv[k])return D.cv[k];if(!CITY_IM||!CITY_IM.complete||!CITY_IM.naturalWidth)return null;
 const cv=document.createElement('canvas');cv.width=c.w*16;cv.height=c.h*16;const x=cv.getContext('2d');x.imageSmoothingEnabled=false;
 for(let ty=0;ty<c.h;ty++)for(let tx=0;tx<c.w;tx++){const id=c.layers.ground[ty*c.w+tx],r=id?D.rects[D.idx.tiles[id-1]]:null;if(r)x.drawImage(CITY_IM,r.x,r.y,r.w,r.h,tx*16,ty*16,16,16)}
 return D.cv[k]=cv;
}
function cityDrawGate(sx,sy,l0,l1){ /* gerbang untuk jalan barat-timur: dua tiang (utara/selatan jalan) + balok + papan nama; sx,sy = tengah jalan di layar */
 const pil=(py)=>{g.fillStyle='rgba(0,0,0,.3)';g.fillRect(sx-9,py+2,22,6);g.fillStyle='#2a2630';g.fillRect(sx-8,py-30,16,34);g.fillStyle='#8d8a96';g.fillRect(sx-6,py-28,12,30);g.fillStyle='#b9b6c4';g.fillRect(sx-6,py-28,12,4);g.fillStyle='#e6c45a';g.fillRect(sx-3,py-34,6,5)};
 pil(sy-WS);pil(sy+WS);g.fillStyle='#2a1a0e';g.fillRect(sx-5,sy-WS-30,10,WS*2);g.fillStyle='#8c5330';g.fillRect(sx-3,sy-WS-30,6,WS*2);
 g.font='bold 9px monospace';const t=wL(l0,l1),tw=Math.ceil(g.measureText(t).width)+10;g.fillStyle='#2a1a0e';g.fillRect(sx-tw/2-1,sy-WS-52,tw+2,16);g.fillStyle='#d9a45a';g.fillRect(sx-tw/2,sy-WS-51,tw,14);T(t,sx,sy-WS-40,'#3a2008',9,'center');
}
/* gerbang masuk di desa: digambar di wTint (sesudah entitas, sebelum label) pada koordinat kamera desa */
const _cityTint=wTint;
wTint=function(){if(!wC&&wcx!=null&&typeof st!=='undefined'&&st==='world'){const p=cityGateXY(),sx=p[0]-Math.round(wcx)-OX,sy=CITY_GATE.y*WS+WS/2-Math.round(wcy);if(sx>-60-OX&&sx<VW+60)cityDrawGate(sx,sy,'KOTA','CITY')}_cityTint()};
function cityCam(){const w=wC,D=cityD,tx=Math.max(0,Math.min(D.W*WS-VW,w.x-VW/2)),ty=Math.max(0,Math.min(D.H*WS-360,w.y-14-180));if(w.cx==null){w.cx=tx;w.cy=ty}else{w.cx+=(tx-w.cx)*.25;w.cy+=(ty-w.cy)*.25}return[Math.round(w.cx),Math.round(w.cy)]}
/* gambar satu warga: sakelar mi aktif + atlas siap -> frame LimeZu (diam saat bicara, run saat berjalan, idle_anim selain itu); rubah dari atlas kota; selain itu sprite hero cadangan */
function cityNpcDraw(o,k,sx,sy){
 const w=wC,D=cityD,nr=wNpc===o,bob=Math.abs(Math.sin(w.t*2+k))*1.5,mi=o.mi&&cityMiReady()?cityMiS.M:null,ready=CITY_IM&&CITY_IM.complete&&CITY_IM.naturalWidth;let top=36;
 g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(sx,sy-1,10,4,0,0,7);g.fill();
 if(mi&&mi.chars[o.mi]){const c=mi.chars[o.mi],dir=Math.max(0,mi.dirs.indexOf(o.face||'down')),talk=wTalk&&wTalk.o===o;let st,fi;
  if(talk){st=c.idle;fi=dir}else if(o.mv){st=c.run;fi=dir*mi.perDir+Math.floor(w.t*mi.fps.run)%mi.perDir}else{st=c.idle_anim;fi=dir*mi.perDir+Math.floor(w.t*mi.fps.idle_anim)%mi.perDir}
  g.drawImage(cityMiS.IM,st.x+fi*mi.frameW,st.y,mi.frameW,mi.frameH,Math.round(sx-mi.frameW*WZ/2),Math.round(sy-mi.frameH*WZ),mi.frameW*WZ,mi.frameH*WZ);top=mi.frameH*WZ+4}
 else if(o.id==='fox'&&D.rects['npc_fox_commuter']&&ready){const r=D.rects['npc_fox_commuter'];g.drawImage(CITY_IM,r.x,r.y,r.w,r.h,Math.round(sx-r.w*WZ/2),Math.round(sy-r.h*WZ-bob),r.w*WZ,r.h*WZ);top=r.h*WZ+4}
 else{const d=HEROES[HID[o.h]],im=d&&IM[d.s],ok=im&&im.complete&&im.naturalWidth;g.save();g.translate(sx,sy);if(w.x<npcX(o))g.scale(-1,1);if(ok)spr(d.s,0,0,2,-bob);else{g.fillStyle=d?RC[d.rar]:'#e8731a';g.fillRect(-8,-30-bob,16,28)}g.restore()}
 if(nr)T(o.n[S.set.lang=='en'?1:0],sx,sy-top-4,'#fc4',10,'center');else T('...',sx,sy-top-2-bob,'#fff',10,'center');
}
function cityDrawB(b,cx,cy){ /* gedung luar sederhana (sementara): bayangan, badan, atap, jendela, pintu, papan nama */
 const x=b.bx*WS-cx-OX,y=b.by*WS-cy,w=b.bw*WS,h=b.bh*WS,c=b.col,dx=b.dx*WS-cx-OX,roof=Math.round(h*.3);
 if(x>VW+40||x+w<-OX-40)return;
 g.fillStyle='rgba(0,0,0,.28)';g.fillRect(x+4,y+h-2,w+4,8);
 g.fillStyle='#1c1a24';g.fillRect(x-2,y-2,w+4,h+4);g.fillStyle=c[0];g.fillRect(x,y,w,h);g.fillStyle=c[1];g.fillRect(x,y,w,roof);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(x,y,w,3);
 g.fillStyle=c[2];g.fillRect(x,y+roof,w,4);
 const win=(wx)=>{g.fillStyle='#1c1a24';g.fillRect(wx-1,y+roof+9,22,18);g.fillStyle='#bfe3f2';g.fillRect(wx,y+roof+10,20,16);g.fillStyle='rgba(255,255,255,.45)';g.fillRect(wx+2,y+roof+12,6,3)};
 for(let k=0;k<b.bw;k++){const wx=x+k*WS+6;if(Math.abs(wx+10-dx-WS/2)>WS*.9)win(wx)}
 g.fillStyle='#1c1a24';g.fillRect(dx+2,y+h-34,WS-4,34);g.fillStyle=c[2];g.fillRect(dx+4,y+h-32,WS-8,32);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(dx+WS/2-1,y+h-32,2,32);g.fillStyle='#fc4';g.fillRect(dx+WS-11,y+h-16,3,3);
 g.font='bold 9px monospace';const t=wL(b.n[0],b.n[1]),tw=Math.ceil(g.measureText(t).width)+10;g.fillStyle='#1c1a24';g.fillRect(x+w/2-tw/2-1,y+3,tw+2,15);g.fillStyle='#f4ecd0';g.fillRect(x+w/2-tw/2,y+4,tw,13);T(t,x+w/2,y+14,'#2a2018',9,'center');
}
function cityDraw(){
 const w=wC,D=cityD;g.imageSmoothingEnabled=false;g.fillStyle='#0d1411';g.fillRect(-OX,0,VW,360);if(!D)return;
 const cam=cityCam(),cx=cam[0],cy=cam[1];
 D.chunks.forEach(c=>{const dx=c.x*WS-cx-OX,dy=c.y*WS-cy;if(dx>VW||dy>360||dx+c.w*WS<-OX||dy+c.h*WS<0)return;const cv=cityChunkCanvas(c);
  if(cv)g.drawImage(cv,0,0,cv.width,cv.height,dx,dy,c.w*WS,c.h*WS);
  else for(let ty=0;ty<c.h;ty++)for(let tx=0;tx<c.w;tx++){const id=c.layers.ground[ty*c.w+tx],n=id?D.idx.tiles[id-1]:'';g.fillStyle=CITY_FB[n.split('_')[0]]||'#222';g.fillRect(dx+tx*WS,dy+ty*WS,WS,WS)}});
 const items=[],spr=(o,anchor)=>{const r=D.rects[o.k];if(!r||!CITY_IM||!CITY_IM.complete||!CITY_IM.naturalWidth)return false;const bx=(o.x+o.fw/2)*WS-cx-OX,by=anchor==='bottom'?(o.y+o.fh)*WS-cy-2:(o.y+o.fh/2)*WS-cy+r.h*WZ/2;
  if(bx<-60-OX||bx>VW+60)return true;g.drawImage(CITY_IM,r.x,r.y,r.w,r.h,Math.round(bx-r.w*WZ/2),Math.round(by-r.h*WZ),r.w*WZ,r.h*WZ);return true};
 D.props.forEach(o=>{const a=D.idx.props[o.k].anchor;if(a==='center')spr(o,a);else items.push({y:(o.y+o.fh)*WS,f:()=>{spr(o,a)}})});
 CITY_B.forEach(b=>items.push({y:(b.by+b.bh)*WS-1,f:()=>cityDrawB(b,cx,cy)}));
 const gt=D.idx.gates.return.tile;items.push({y:(gt[1]+1)*WS,f:()=>cityDrawGate(gt[0]*WS+WS/2-cx-OX,gt[1]*WS+WS/2-cy,'DESA','VILLAGE')});
 NPCS.forEach((o,k)=>{if(typeof npcAwake!=='function'||!npcAwake(o))return;items.push({y:npcY(o),f:()=>cityNpcDraw(o,k,npcX(o)-cx-OX,npcY(o)-cy)})});
 items.push({y:w.y,f:()=>{const px=w.x-cx-OX,py=w.y-cy;if(wAct&&self.Anim&&Anim.has('avatar_'+wAct.state)){Anim.shadow(g,px,py-1,9,3,.3);wAct.draw(g,px,py,performance.now(),WZ)}else{g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(px,py-1,10,4,0,0,7);g.fill();g.fillStyle='#fc4';g.fillRect(px-7,py-26,14,24)}}});
 items.sort((a,b)=>a.y-b.y).forEach(i=>i.f());
 if(typeof wTn!=='undefined'&&wTn[3]>.01){g.fillStyle='rgba('+wTn[0]+','+wTn[1]+','+wTn[2]+','+wTn[3].toFixed(3)+')';g.fillRect(-OX,0,VW,360)}
 if(self.lifeDrawWeather)lifeDrawWeather();
 {const a=wL('KOTA KECIL','LITTLE CITY');g.font='bold 10px monospace';const tw=Math.max(110,Math.ceil(g.measureText(a).width)+24);g.fillStyle='rgba(8,6,16,.78)';g.fillRect(6,6,tw,22);g.strokeStyle='#e6c45a';g.lineWidth=1;g.strokeRect(6.5,6.5,tw-1,21);T(a,6+tw/2,21,'#fe8',10,'center')}
 if(wMsg.t>0){g.globalAlpha=Math.min(1,wMsg.t);g.font='bold 11px monospace';const tw=Math.min(620,Math.ceil(g.measureText(tr(wMsg.s)).width)+28),tx0=Math.round(320-tw/2);g.fillStyle='rgba(0,0,0,.78)';g.fillRect(tx0,44,tw,24);g.strokeStyle='#fc4';g.lineWidth=1;g.strokeRect(tx0+.5,44.5,tw-1,23);T(wMsg.s,320,61,'#fe8',11,'center');g.globalAlpha=1}
 if(!wTalk){g.globalAlpha=.35;g.fillStyle='#000';g.beginPath();g.arc(JC[0],JC[1],JR,0,7);g.fill();g.globalAlpha=.8;g.strokeStyle='#fff';g.lineWidth=2;g.stroke();g.globalAlpha=.85;g.fillStyle='#9cf';g.beginPath();g.arc(JC[0]+wjx*JR*.6,JC[1]+wjy*JR*.6,14,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=1;g.stroke();g.globalAlpha=1}
 btn(500,6,58,26,wL('MENU','MENU'),1);if(self.npcUI)npcUI();
}
function cityUpdate(dt){
 const w=wC;w.t+=dt;if(wMsg.t>0)wMsg.t-=dt;if(self.wFx)wFx(dt);
 let dx=wjx,dy=wjy;const kx=(KD.d||KD.arrowright?1:0)-(KD.a||KD.arrowleft?1:0),ky=(KD.s||KD.arrowdown?1:0)-(KD.w||KD.arrowup?1:0);
 if(kx||ky){const l=Math.hypot(kx,ky);dx=kx/l;dy=ky/l}if(wFade||wTalk||wDlg)dx=dy=0;let mv=0;
 if(dx||dy){const nx=w.x+dx*WSPEED*dt,ny=w.y+dy*WSPEED*dt;if(!cityBlocked(nx,w.y)){w.x=nx;mv=1}if(!cityBlocked(w.x,ny)){w.y=ny;mv=1}if(dx)wface=dx>0?1:-1}
 wwalk=mv?wwalk+dt:0;if(wAct)wAct.update(mv?dx:0,mv?dy:0);
 cityNpcStep(dt);wNear=null;wPlace=null;wNpc=self.npcNear?npcNear(w.x,w.y):null;w.near=cityNear();if(self.lifeWorldUpdate)lifeWorldUpdate(dt);
}
/* ---------- pengait (urutan rantai: ... hud.js -> city.js) ---------- */
const _cityCtx=hudCtx,_cityUpd=updWorld,_cityDraw=drawWorld,_cityDown=worldDown,_cityEnterW=worldEnter,_cityZoom=wZoomActive;
hudCtx=function(){
 if(st!=='world'||wDlg||wTalk||wFade)return _cityCtx();
 if(wC){const n=cityNear();return n?{l:n.l,on:1,f:()=>cityAct(n)}:null}
 if(!wI&&!(self.lifeFish&&lifeFish.active)&&S.world){const p=cityGateXY();if(Math.hypot(S.world.x-p[0],S.world.y-p[1])<WS*12){cityLoad();cityMiStart()}if(cityGateNear())return{l:wL('KOTA','CITY'),on:1,f:cityEnter}}
 return _cityCtx();
};
updWorld=function(dt){if(wC&&!lifeWorldQuick){if(wFade)intFadeStep(dt);if(wC)cityUpdate(dt);return}_cityUpd(dt)};
drawWorld=function(){if(wC){cityDraw();if(self.lifeWorldAfterRender)lifeWorldAfterRender();hudDraw()}else _cityDraw()};
worldDown=function(id,x,y){
 if(wC&&st==='world'&&!lifeWorldQuick&&!wTalk&&!wFade){const z=hudUiScale();if(x>=4&&x<=4+100*z&&y>=4&&y<=4+76*z)return; /* minimap desa tidak berlaku di kota */
  if(self.jrFocusRect){const f=jrFocusRect();if(x>=f.x&&x<=f.x+f.w&&y>=f.y-6&&y<=f.y+f.h+8)return}}
 _cityDown(id,x,y);
};
worldEnter=function(){wC=null;_cityEnterW()};
wZoomActive=function(){return!wC&&_cityZoom()};
