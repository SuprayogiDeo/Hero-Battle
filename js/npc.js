/* NPC DUNIA 
 16 NPC berdialog di dunia. Dimuat setelah farm.js. Semua hook di world.js dijaga (self.npcXxx&&...), jadi bila file ini
 tidak dimuat dunia tetap jalan tanpa NPC. Teks 2 bahasa langsung di kode lewat wL(id,en) (tanpa kamus i18n.js).
 roam:1 = NPC berkeliling ke seluruh desa (lompatan 3-10 tile, dalam batas NPCV); tanpa roam hanya sekitar rumah. Tambah NPC: tambah entri di NPCS (h = id hero untuk sprite, tx/ty = tile rumput kosong) dan satu cabang di npcLines(). */
const NPCS=[
{id:'guard',h:'knight',tx:22,ty:3,n:['Penjaga Gerbang','Gate Guard']},
{id:'merchant',h:'cleric',tx:12,ty:9,n:['Pedagang','Merchant']},
{id:'farmer',h:'clubber',tx:13,ty:22,n:['Petani','Farmer']},
{id:'elder',h:'oracle',tx:26,ty:12,n:['Tetua Desa','Village Elder']},
{id:'fisher',h:'axeman',tx:56,ty:87,sched:'fisher',boat:1,n:['Nelayan','Fisherman']},
{id:'smith',roam:1,h:'paladin',tx:23,ty:18,n:['Pandai Besi','Blacksmith']},
{id:'healer',roam:1,h:'druid',tx:19,ty:17,n:['Tabib','Healer']},
{id:'innkeeper',roam:1,h:'hunter',tx:21,ty:15,n:['Pemilik Penginapan','Innkeeper']},
/* warga ambient: tanpa fungsi, jalan pelan (sp), menyapa 1 baris acak dari g */
{id:'kid',h:'recruit',tx:12,ty:14,roam:1,ambient:1,sp:15,n:['Anak','Kid'],g:[['Halo! Aku lagi main kejar-kejaran.','Hi! I am playing tag.'],['Kakak hero, kuat ya? Aku mau jadi kuat juga!','Hero, you must be strong! I want to be strong too!'],['Ssst, aku lihat ayam lari ke kebun tadi.','Shh, I saw a chicken run into the garden.']]},
{id:'girl',h:'apprentice',tx:30,ty:15,roam:1,ambient:1,sp:15,n:['Gadis Kecil','Little Girl'],g:[['Aku sedang mengumpulkan bunga untuk nenek.','I am picking flowers for grandma.'],['Bunga di desa ini cantik-cantik, ya.','The flowers in this village are so pretty.'],['Hehe, kamu hero yang di cerita itu, ya?','Hehe, are you the hero from the stories?']]},
{id:'granny',h:'acolyte',tx:40,ty:14,roam:1,ambient:1,sp:15,n:['Nenek','Granny'],g:[['Pelan-pelan saja jalannya, Nak. Desa ini tidak ke mana-mana.','Take it slow, dear. The village is not going anywhere.'],['Dulu desa ini sepi. Sekarang ramai, nenek senang.','This village used to be quiet. Now it is lively, and I am glad.'],['Sudah makan? Jangan bertarung dengan perut kosong.','Have you eaten? Never fight on an empty stomach.']]},
{id:'grandpa',h:'monk',tx:52,ty:23,roam:1,ambient:1,sp:15,n:['Kakek','Grandpa'],g:[['Hmm, cuacanya enak untuk berjemur.','Hmm, nice weather for sunbathing.'],['Kakek dulu juga pernah muda dan gagah seperti kamu.','I was young and brave like you once.'],['Hati-hati di luar gerbang, ya.','Be careful beyond the gate.']]},
{id:'youth',h:'squire',tx:28,ty:24,roam:1,ambient:1,sp:15,n:['Pemuda Desa','Village Youth'],g:[['Aku mau latihan pedang, tapi kayuku patah.','I want to practice swordplay, but my stick broke.'],['Suatu hari aku juga mau jadi hero!','One day I want to be a hero too!'],['Katanya Menara Harian berubah tiap hari. Seru!','They say the Daily Tower changes every day. Cool!']]},
{id:'aunt',h:'ranger',tx:40,ty:23,roam:1,ambient:1,sp:15,n:['Bibi','Auntie'],g:[['Aduh, belanjaanku banyak sekali hari ini.','Oh my, I have so much shopping today.'],['Sayurnya segar-segar dari ladang desa.','The vegetables are fresh from the village field.'],['Mampir ke rumah kalau lewat, ya.','Drop by my house if you pass.']]},
{id:'uncle',h:'spearman',tx:22,ty:32,roam:1,ambient:1,sp:15,n:['Paman','Uncle'],g:[['Jalan sore itu menyehatkan. Kamu juga coba.','An evening walk is healthy. You should try it.'],['Aku lagi mikir mau mancing atau tidur siang.','I am deciding between fishing and a nap.'],['Desa ini aman selama ada kamu.','The village is safe as long as you are here.']]},
{id:'toddler',h:'hunter',tx:52,ty:14,roam:1,ambient:1,sp:15,n:['Anak Kecil','Little Kid'],g:[['Lihat, ada kupu-kupu!','Look, a butterfly!'],['Aku bisa lari cepat. Mau lomba?','I can run fast. Race me?'],['Ibu bilang jangan jauh-jauh dari rumah.','Mom said not to go far from home.']]},
/* area:'city' = hanya ada di Kota Kecil (js/city.js; tx,ty = tile PETA KOTA); tanpa area = NPC desa. static:1 = berdiri diam sepanjang hari. home:[tx,ty] = tile depan pintu rumah (K3): NPC berjadwal keluar dari sana pagi hari dan berjalan pulang (memudar masuk pintu) saat jadwal habis, tidak pernah muncul/hilang mendadak; sch = jadwal tanpa dialog (rubah). Rubah Komuter kini NPC desa (Batch 9B-36), berdiri di blok K3. */
{id:'fox',h:'ranger',tx:116,ty:13,sch:[[7,20,116,13]],home:[115,10],n:['Rubah Komuter','Commuter Fox']},
/* Warga berjadwal (9B-27, pindah ke desa di 9B-36): plan = [jamMulai,jamSelesai,tileX,tileY] per blok (tile PETA DESA, sekitar kafe/toko/apartemen K3); tx,ty = tile blok pertama; mi = karakter atlas mi_chars (LimeZu), h = hero cadangan saat ?mi=0.
   say[i] = baris pembuka blok i, g = dialog umum. Berjalan antar blok lurus lewat logika NPC desa (npcUpdate + npcOk, tanpa cityPath; garis antar tile wajib bebas); di luar jam blok pertama..terakhir NPC pulang. */
{id:'adam',h:'squire',mi:'adam',tx:105,ty:11,home:[106,10],sp:40,n:['Petugas Kota','City Officer'],plan:[[6,12,105,11],[12,20,114,11]],
say:[['Pagi. Aku berjaga di zebra cross barat supaya warga menyeberang dengan aman.','Morning. I watch the west crosswalk so people cross safely.'],['Siang begini aku pindah ke timur, dekat persimpangan yang ramai.','At this hour I move east, near the busy junction.']],
g:[['Lampu lalu lintas itu baru dipasang. Tunggu hijau, ya.','Those traffic lights are brand new. Wait for green.'],['Kota ini kecil, tapi aturannya tetap sama dengan kota besar.','This city is small, but the rules are the same as in a big one.']]},
{id:'alex',h:'monk',mi:'alex',tx:113,ty:18,home:[110,17],sp:40,n:['Pembaca Koran','Newspaper Reader'],plan:[[6,13,113,18],[13,20,107,19]],
say:[['Bangku barat ini paling enak buat baca koran pagi.','This west bench is the best for the morning paper.'],['Sore aku pindah ke bangku timur. Anginnya lebih sejuk di sini.','In the afternoon I move to the east bench. The breeze is cooler here.']],
g:[['Berita hari ini: desa sebelah punya dermaga baru untuk para nelayan.','Today\'s news: the village next door has a new dock for its fishermen.'],['Koran ini terbit tiap hari, tapi beritanya jarang berubah.','This paper comes out daily, but the news rarely changes.']]},
{id:'amelia',h:'apprentice',mi:'amelia',tx:102,ty:12,home:[115,10],sp:40,n:['Pelari Pagi','Morning Jogger'],plan:[[6.5,13,102,12],[13,20,118,12]],
say:[['Aku sedang pemanasan di trotoar utara sebelum lari.','I am warming up on the north sidewalk before my run.'],['Sore aku berlari di trotoar selatan. Jalurnya lurus dan sepi.','In the afternoon I run on the south sidewalk. The path is straight and quiet.']],
g:[['Lari itu murah dan menyehatkan. Kamu juga coba.','Running is cheap and healthy. You should try it.'],['Dari gerbang desa sampai sini kira-kira lima menit lari.','From the village gate to here is about five minutes at a run.']]}];
const NB={R:['Barak','the Barracks'],F:['Ladang','the Field'],Q:['Papan Misi','the Quest Board']};
/* posisi runtime (px,py) = rumah (tx,ty) + berkeliling pendek. wUseV() menimpa tx,ty -> npcSync mereset posisi. */
function npcSync(o){const k=o.tx+','+o.ty;if(o._k!==k){o._k=k;o.px=o.tx*WS+WS/2;o.py=o.ty*WS+26;o.mode='wait';o.wt=1+Math.random()*3;o.vx=o.vy=0;o.gx=o.gy=0}}
const npcX=o=>(npcSync(o),o.px),npcY=o=>(npcSync(o),o.py);
/* Jadwal harian dari lifeHour() (life.js): jam NPCDAY[0]..NPCDAY[1]-1 NPC ada di desa; di luar itu pulang (tak tampil, tak menghalangi, tak bisa diajak bicara) dan paginya muncul lagi di rumah. */
const NPCDAY=[6,20],npcHour=()=>typeof lifeHour=='function'?lifeHour():9,npcSch=o=>o.plan||o.sch,npcPlanBlock=(o,h)=>{let b=0;npcSch(o).forEach((p,i)=>{if(h>=p[0])b=i});return b},npcAwake=o=>{if((o.area||'')!==(typeof cityNpcArea=='function'?cityNpcArea():''))return false;{const sc=npcSch(o);if(sc){const h=npcHour();return o.out===1||(h>=sc[0][0]&&h<sc[sc.length-1][1])}}if(o.area)return true;const h=typeof lifeHour=='function'?lifeHour():9;return h>=NPCDAY[0]&&h<NPCDAY[1]};
const NPCR=WS*2,NPCSP=28,NPCV=[3,5,60,42]; /* NPCV = batas desa (tile x0,y0,x1,y1) untuk NPC roam:1 */
function npcAc(o){if(o.ac===undefined)o.ac=typeof Anim!='undefined'?new Anim.Actor('npc_'+o.id):null;return o.ac}
const npcOk=(x,y)=>!(wSolid(x-WFH,y-WFV)||wSolid(x+WFH,y-WFV)||wSolid(x-WFH,y)||wSolid(x+WFH,y));
/* Nelayan (sched:'fisher'): jadwal per jam dari lifeHour(). Pagi <NPCFH[0] memancing di ujung dermaga (joran+pelampung), siang <NPCFH[1] menjahit jaring,
   sore naik perahu (boat:1), berlayar lewat waypoint NPCBR (tile air '~'), memancing di titik terakhir, lalu kembali ke tambatan. Perahu = boat.png (tools/build_boat.py), digambar di npcDraw (lapisan dunia, ikut culling/zoom). */
const NPCFH=[11,16],NPCBSP=46,NPCWSP=34,NPCCAST=13,NPCBR=[[59.5,87.7],[60.5,89.7],[63.5,91.7],[68.5,92.7]],NPCPF={fish:[56,87],net:[57,86],board:[58,87]}; /* Dermaga tenggara (fishing_pier (55,82), planks x52-58 y81-87): titik pancing, jaring, naik perahu; NPCBR[0] = tambatan di air sebelah timur */
const NPCBT=typeof Image=='function'?Object.assign(new Image(),{src:'assets/world/boat.png'}):null;
const npcTP=(tx,ty)=>[tx*WS+WS/2,ty*WS+26],npcBP=i=>[NPCBR[i][0]*WS,NPCBR[i][1]*WS];
const npcWater=(x,y)=>{const tx=Math.floor(x/WS),ty=Math.floor(y/WS);if(!(tx>=0&&ty>=0&&tx<WW&&ty<WH))return false;const c=WMAP[ty][tx];return c=='~'||c=='+'};
function npcFisherHome(o){o.act=null;o.st='tofish';o.aboard=0;o.wi=0;const m=npcBP(0);o.bx=m[0];o.by=m[1];o.bf=1;o.ft=0;o.face=1;o.walk=0}
function npcMove(o,x,y,dt){const sp=NPCWSP,dx=x-o.px,dy=y-o.py,l=Math.hypot(dx,dy);o.walk=1;if(l<=sp*dt){o.px=x;o.py=y;return true}o.px+=dx/l*sp*dt;o.py+=dy/l*sp*dt;if(Math.abs(dx)>1)o.face=dx>0?1:-1;return false}
function npcFisher(o,dt,talk){if(o.bx===undefined)npcFisherHome(o);const h=typeof lifeHour=='function'?lifeHour():9,act=h<NPCFH[0]?'fish':h<NPCFH[1]?'net':'boat';
if(act!=o.act){o.act=act;o.st=act=='boat'?'toboat':act=='net'?'tonet':'tofish';o.ft=0}
o.walk=0;if(talk||wDlg)return;const s=o.st;
if(s=='tofish'){const q=npcTP(...NPCPF.fish);if(npcMove(o,q[0],q[1],dt)){o.st='fish';o.ft=0;o.face=1}}
else if(s=='tonet'){const q=npcTP(...NPCPF.net);if(npcMove(o,q[0],q[1],dt)){o.st='net';o.ft=0;o.face=-1}}
else if(s=='toboat'){const q=npcTP(...NPCPF.board);if(npcMove(o,q[0],q[1],dt))o.st='board'}
else if(s=='board'){const m=npcBP(0);if(npcMove(o,m[0],m[1]-8,dt)){o.aboard=1;o.st='sail';o.wi=0}}
else if(s=='sail'||s=='back'){const dir=s=='sail'?1:-1,n=o.wi+dir,p=npcBP(n),dx=p[0]-o.bx,dy=p[1]-o.by,l=Math.hypot(dx,dy),st=NPCBSP*dt;
if(Math.abs(dx)>1)o.bf=dx>0?1:-1;
if(l<=st){o.bx=p[0];o.by=p[1];o.wi=n;if(s=='sail'&&n==NPCBR.length-1){o.st='cast';o.ft=0}else if(s=='back'&&n==0)o.st='unboard'}
else{const nx=o.bx+dx/l*st,ny=o.by+dy/l*st;if(npcWater(nx,ny)&&npcWater(nx-18,ny)&&npcWater(nx+18,ny)){o.bx=nx;o.by=ny}}
o.px=o.bx;o.py=o.by-8;o.face=o.bf;o.walk=1;o.oar=(o.oar||0)-dt;if(o.oar<=0){o.oar=1.1;const w=S.world;if(S.set&&S.set.fx&&typeof sfx=='function'&&w&&Math.hypot(w.x-o.bx,w.y-o.by)<12*WS)sfx('oar')}}
else if(s=='unboard'){const q=npcTP(...NPCPF.board);if(npcMove(o,q[0],q[1],dt)){o.aboard=0;o.st='rest';o.ft=0;if(typeof lifeShopFishAdd=='function')lifeShopFishAdd()}}
else{o.ft+=dt;if(s=='cast'&&o.ft>=NPCCAST){o.st='back';o.wi=NPCBR.length-1}else if(s=='rest'&&o.ft>=8)o.st='board'}}
/* joran + pelampung (siklus 7 dtk: ayun, lempar, mengambang+riak, tarik) dan jaring; digambar di atas sprite nelayan */
function npcFisherFx(o,sx,sy){const s=o.st,f=o.face||1,tt=performance.now()/1000;
if(s=='fish'||s=='cast'){const p=o.ft%7,hx=sx+9*f,hy=sy-17,aboard=!!o.aboard,Lx=sx+(aboard?46:58)*f,Ly=sy+(aboard?24:42),lerp=(a,b,u)=>a+(b-a)*u;
let ang=-50;if(p<.5)ang=lerp(-50,-115,p/.5);else if(p<.9)ang=lerp(-115,-25,(p-.5)/.4);else if(p<5.5)ang=-30+Math.sin(tt*2)*2;else if(p<6.3)ang=lerp(-30,-75,(p-5.5)/.8);else ang=lerp(-75,-50,(p-6.3)/.7);
const r=ang*Math.PI/180,tx=hx+Math.cos(r)*26*f,ty=hy+Math.sin(r)*26;let bx=tx,by=ty+10,line=p>=.5&&p<6.3;
if(p>=.9&&p<1.3){const u=(p-.9)/.4;bx=lerp(tx,Lx,u);by=lerp(ty,Ly,u)-Math.sin(u*Math.PI)*22}
else if(p>=1.3&&p<5.5){const dip=(p>3.1&&p<3.4)||(p>4.6&&p<4.8)?3:0;bx=Lx;by=Ly+Math.sin(tt*3)*1.2+dip;
g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=1;g.beginPath();g.ellipse(bx,Ly+3,5+(tt*5)%6,2+((tt*5)%6)/3,0,0,7);g.stroke()}
else if(p>=5.5&&p<6.3){const u=(p-5.5)/.8;bx=lerp(Lx,tx,u);by=lerp(Ly,ty,u)-Math.sin(u*Math.PI)*8}
if(S.set&&S.set.fx){const sp=(p0,p1,n,h)=>{if(p<p0||p>=p1)return;const u=(p-p0)/(p1-p0);g.fillStyle='rgba(235,248,255,'+(1-u).toFixed(2)+')';for(let i=0;i<n;i++){const a=-Math.PI*(.15+.7*i/(n-1)),v=h*(.6+.4*((i*7)%3)/2);g.beginPath();g.arc(Lx+Math.cos(a)*v*u*.6,Ly+Math.sin(a)*v*u+u*u*h*.8,1.6,0,7);g.fill()}};sp(1.3,1.8,7,26);sp(3.1,3.4,4,12);sp(4.6,4.8,4,12)}
g.strokeStyle='#8a5a34';g.lineWidth=2;g.beginPath();g.moveTo(hx,hy);g.lineTo(tx,ty);g.stroke();
g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=1;g.beginPath();g.moveTo(tx,ty);if(line){g.lineTo((tx+bx)/2,(ty+by)/2+(p>=1.3&&p<5.5?6:2))}g.lineTo(bx,by);g.stroke();
g.fillStyle='#e33';g.beginPath();g.arc(bx,by,3,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(bx,by-1,1.3,0,7);g.fill()}
else if(s=='net'){const nx=sx+f*8,ny=sy-9,tw=26,th=14;g.strokeStyle='#e0cf9f';g.lineWidth=1;g.beginPath();
for(let i=0;i<=6;i++){g.moveTo(nx+f*i*tw/6,ny);g.lineTo(nx+f*i*tw/6,ny+th)}for(let j=0;j<=4;j++){g.moveTo(nx,ny+j*th/4);g.lineTo(nx+f*tw,ny+j*th/4)}g.stroke();
g.fillStyle='#d44';for(let i=0;i<=6;i+=2){g.fillRect(nx+f*i*tw/6-1,ny-2,3,3)}
const nd=Math.sin(tt*7)*5;g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.moveTo(sx+f*(12+tw/2+nd),sy-14);g.lineTo(sx+f*(16+tw/2+nd),sy-10);g.stroke()}}
function npcBoatDraw(o,cx,cy,py,pass){if(o.bx===undefined)npcFisherHome(o);const rid=o.aboard&&npcAwake(o),ay=rid?o.py:o.by;if((pass==0)!=(ay<=py))return;
const sx=o.bx-cx-OX,sy=o.by-cy;if(sx<-70-OX||sx>VW+70||sy<-40||sy>400||!NPCBT||!NPCBT.complete||!NPCBT.naturalWidth)return;
const fr=Math.floor(performance.now()/450)%2,old=g.imageSmoothingEnabled;g.imageSmoothingEnabled=false;g.save();g.translate(sx,sy);if(o.bf<0)g.scale(-1,1);g.drawImage(NPCBT,fr*24,0,24,13,-24,-20,48,26);g.restore();g.imageSmoothingEnabled=old}
/* NPC desa berjadwal (plan/sch + home, tanpa area): jam blok pertama tiba -> muncul memudar di pintu rumah (o.out=1) lalu jalan lurus ke tile blok (npcOk, berhenti dekat pemain/saat bicara);
   jam habis -> jalan lurus pulang ke pintu, memudar, lalu hilang (o.out=0). Tanpa muncul/hilang mendadak. Macet > 4 dtk -> geser ke tile tujuan. o.fa = opasitas (0 di pintu .. 1 sejauh 1 tile). */
function npcPlanStep(o,dt){const w=S.world,ac=npcAc(o),sc=npcSch(o),h=npcHour(),inWin=h>=sc[0][0]&&h<sc[sc.length-1][1],HX=o.home[0]*WS+WS/2,HY=o.home[1]*WS+26;let vx=0,vy=0;
if(o.out!==1){o.out=1;o.ret=0;o.px=HX;o.py=HY;o.stk=0}
o.ret=inWin?0:1;const t=sc[npcPlanBlock(o,h)],gx=o.ret?HX:t[2]*WS+WS/2,gy=o.ret?HY:t[3]*WS+26;
const talk=wTalk&&wTalk.o===o,dx=gx-o.px,dy=gy-o.py,l=Math.hypot(dx,dy);
if(!talk&&!wDlg&&l>1){const st=Math.min(l,(o.sp||NPCSP)*dt),sx=dx/l,sy=dy/l,nx=o.px+sx*st,ny=o.py+sy*st;
if(npcOk(nx,ny)&&!(Math.abs(nx-w.x)<19&&Math.abs(ny-w.y)<13)){o.px=nx;o.py=ny;vx=sx;vy=sy;o.stk=0}else if((o.stk=(o.stk||0)+dt)>4){o.px=gx;o.py=gy;o.stk=0}}
o.fa=Math.min(1,Math.hypot(o.px-HX,o.py-HY)/(WS*.9));
if(o.ret&&Math.hypot(o.px-HX,o.py-HY)<2){o.out=0;o.ret=0;o.fa=0;return}
if(ac){ac.update(vx,vy);if(talk)ac.face(w.x-o.px,w.y-o.py)}}
function npcUpdate(dt){const w=S.world;if(!w)return;NPCS.forEach(o=>{if(!npcAwake(o)){o.gone=1;if(o.sched=='fisher')npcFisherHome(o);return}if(o.gone){o.gone=0;o._k=null}npcSync(o);if(o.home&&npcSch(o)){npcPlanStep(o,dt);return}if(o.static)return;if(o.sched=='fisher'){npcFisher(o,dt,wTalk&&wTalk.o===o);return}const ac=npcAc(o),hx=o.tx*WS+WS/2,hy=o.ty*WS+26;let vx=0,vy=0;
const talk=wTalk&&wTalk.o===o,near=Math.abs(w.x-o.px)<44&&Math.abs(w.y-o.py)<34;
if(talk||wDlg){o.mode='wait';o.wt=Math.max(o.wt,1.5)}
else if(o.mode=='wait'){o.wt-=dt;if(o.wt<=0){if(near){o.wt=1}else{const a=Math.random()*7,rm=!!o.roam,r=rm?(3+Math.random()*7)*WS:(.4+Math.random()*.6)*NPCR,bx=rm?o.px:hx,by=rm?o.py:hy,gx=bx+Math.cos(a)*r,gy=by+Math.sin(a)*r*(rm?1:.7);let ok=npcOk(gx,gy)&&Math.hypot(gx-w.x,gy-w.y)>40&&(!rm||gx>=NPCV[0]*WS&&gx<=NPCV[2]*WS&&gy>=NPCV[1]*WS&&gy<=NPCV[3]*WS);
const ns=Math.max(8,Math.ceil(Math.hypot(gx-o.px,gy-o.py)/6));for(let i=1;ok&&i<=ns;i++)ok=npcOk(o.px+(gx-o.px)*i/ns,o.py+(gy-o.py)*i/ns);if(ok){o.mode='go';o.gx=gx;o.gy=gy}else o.wt=.6}}}
else{const dx=o.gx-o.px,dy=o.gy-o.py,l=Math.hypot(dx,dy);if(l<2||near&&Math.hypot(w.x-o.px,w.y-o.py)<40){o.mode='wait';o.wt=1.5+Math.random()*3.5}
else{const sx=dx/l,sy=dy/l,nx=o.px+sx*(o.sp||NPCSP)*dt,ny=o.py+sy*(o.sp||NPCSP)*dt;
if(npcOk(nx,ny)&&!(Math.abs(nx-w.x)<19&&Math.abs(ny-w.y)<13)){o.px=nx;o.py=ny;vx=sx;vy=sy}else{o.mode='wait';o.wt=1+Math.random()*2}}}
if(ac){ac.update(vx,vy);if(talk)ac.face(w.x-o.px,w.y-o.py)}})}
function npcHit(x,y){for(const o of NPCS)if(npcAwake(o)&&Math.abs(x-npcX(o))<15&&Math.abs(y-npcY(o))<10)return true;return false}
function npcNear(px,py){let b=null,bd=34;for(const o of NPCS){if(!npcAwake(o))continue;const d=Math.hypot(px-npcX(o),py-npcY(o));if(d<bd){bd=d;b=o}}return b}
function npcLines(o){const b=best,r=[];
if(o.plan){const bi=npcPlanBlock(o,npcHour());return[wL(o.say[bi][0],o.say[bi][1])].concat(o.g.map(l=>wL(l[0],l[1])))}
if(o.ambient){const l=o.g[Math.floor(Math.random()*o.g.length)];return[wL(l[0],l[1])]}
if(o.id=='guard'){r.push(wL('Halo, selamat datang. Gerbang ini menuju medan pertempuran.','Hi, welcome. This gate leads to the battlefield.'));
r.push(b>0?wL('Rekormu stage '+b+'. Teruslah maju!','Your record is stage '+b+'. Keep going!'):wL('Belum pernah bertarung? Mulai dari Stage 1.','Not fought yet? Start from Stage 1.'));
r.push(wL('Menara Harian juga lewat sini. Aturannya berganti tiap hari.','The Daily Tower is through here too. Its rules change every day.'))}
else if(o.id=='merchant'){r.push(wL('Selamat datang. Tokonya buka terus, dan ada panggilan hero gratis tiap hari.','Welcome in. The shop stays open, and there is a free hero summon every day.'));
r.push(wL('Perlengkapan bagus ada di tab Liontin. Tapi naikkan level hero dulu, baru belanja.','Good gear is in the Pendant tab. Level up your heroes first, then shop.'));
r.push(S.ft>0||S.fe>0?wL('Panggilan gratis hari ini masih ada.','Your free summon is still available today.'):wL('Panggilan gratis hari ini sudah terpakai. Kembali besok.','Today\'s free summon is used. Come back tomorrow.'))}
else if(o.id=='farmer'){if(b<WUN.F){r.push(wL('Ladangku belum bisa dipakai. Capai stage '+WUN.F+' dan akan kubukakan.','My field is not ready yet. Reach stage '+WUN.F+' and I will open it.'));r.push(wL('Rekormu sekarang stage '+b+'. Sedikit lagi!','Your record is stage '+b+' now. Almost there!'))}
else{r.push(wL('Gemburkan tanahnya, tanam benih, lalu tinggalkan. Tanamannya tetap tumbuh saat kamu istirahat.','Loosen the soil, plant the seeds, then leave them. Crops keep growing while you rest.'));
r.push(typeof farmReady=='function'&&farmReady()?wL('Eh, ada yang sudah matang. Yuk panen.','Oh, something is ripe. Come harvest.'):wL('Panen sepuasnya.','Harvest as much as you like.'))}}
else if(o.id=='fisher'){r.push(wL('Selamat datang di dermaga kecil ini. Airnya tenang, ikannya jujur.','Welcome to this little dock. Calm water, honest fish.'));
if(typeof lifeFisherQuest=='function'){const q=lifeFisherQuest(),fi=lifeFishById(q.id),nm=wL(fi.name,fi.en);
if(q.done)r.push(wL('Terima kasih untuk '+nm+' tadi. Besok kuminta ikan lain.','Thanks for the '+nm+'. Tomorrow I will ask for another fish.'));
else if(lifeFisherDeliver()=='ok')r.push(wL('Wah, '+nm+'! Ini '+LIFE_BAIT_REWARD+' umpan langka untukmu.','Wow, '+nm+'! Here are '+LIFE_BAIT_REWARD+' rare baits for you.'));
else r.push(wL('Hari ini aku butuh 1 '+nm+'. Bawakan padaku, kuberi umpan langka.','Today I need 1 '+nm+'. Bring it to me and I will give rare bait.'))}
r.push(o.act=='net'?wL('Jaring ini sobek kena karang. Harus selesai kujahit sebelum sore.','This net tore on the reef. I must mend it before evening.'):o.act=='boat'?wL('Sore begini aku berlayar ke tengah teluk. Ikan besar suka di sana.','This time of day I sail to the middle of the bay. The big fish like it there.'):wL('Pagi hari ikan paling mudah menggigit. Kuncinya sabar.','Fish bite best in the morning. Patience is the key.'));
r.push(wL('Dermaga ini kami bangun bersama warga. Tidak besar, tapi cukup.','The villagers and I built this dock together. Not big, but enough.'))}
else if(o.id=='smith'){r.push(wL('Palu dan landasan ini sudah kupakai puluhan tahun. Senjata bagus lahir dari kesabaran.','I have used this hammer and anvil for decades. Good weapons come from patience.'));
r.push(wL('Perlengkapan terbaik ada di tab Liontin toko. Naikkan level hero dulu, baru tempa gayamu.','The best gear is in the shop Pendant tab. Level up your heroes first, then build your style.'));
r.push(b>0?wL('Rekor stage '+b+'? Lumayan. Besi di medan perang tidak pernah habis.','A record of stage '+b+'? Not bad. There is always more iron on the battlefield.'):wL('Belum bertarung? Datang lagi setelah kamu punya cerita.','Not fought yet? Come back when you have a story to tell.'))}
else if(o.id=='healer'){r.push(wL('Selamat datang. Aku meracik ramuan dari tanaman desa ini.','Welcome. I brew potions from the plants of this village.'));
r.push(wL('Istirahat yang cukup lebih manjur daripada ramuan apa pun.','A good rest works better than any potion.'));
r.push(wSn?wL('Dingin begini mudah sakit. Pakai baju hangat, ya.','This cold makes people sick easily. Dress warmly.'):wL('Cuaca cerah, waktu yang baik untuk mencari tanaman obat.','Fine weather, a good time to look for medicinal herbs.'))}
else if(o.id=='fox'){r.push(wL('Halo! Aku rubah komuter. Tiap pagi aku berangkat ke kota lewat gerbang desa.','Hi! I am the commuter fox. Every morning I head into the city through the village gate.'));
r.push(wL('Lampu lalu lintas itu lucu: merah, kuning, hijau. Aku selalu menunggu hijau sebelum menyeberang di zebra cross.','Traffic lights are funny: red, yellow, green. I always wait for green before using the zebra crossing.'));
r.push(wL('Bangku ini tempat istirahat favoritku. Hati-hati di jalan, ya!','This bench is my favorite resting spot. Safe travels!'))}
else if(o.id=='innkeeper'){r.push(wL('Selamat datang di penginapan. Kamar hangat selalu siap untuk petualang.','Welcome to the inn. A warm room is always ready for adventurers.'));
r.push(wL('Banyak pelancong lewat sini. Kabar dari gerbang selalu sampai duluan di mejaku.','Many travelers pass through. News from the gate always reaches my table first.'));
r.push(wL('Lelah bertarung? Duduk sebentar, nikmati desanya.','Tired from fighting? Sit a while and enjoy the village.'));
r.push(wL('Masakan hangat dijual di penginapan, di sebelah barat Toko. Stoknya terbatas tiap hari.','Hot meals are sold at the inn, west of the Shop. Stock is limited each day.'))}
else{r.push(wL('Desa ini tumbuh seiring langkahmu.','This village grows with every step you take.'));
let nx=null;for(const c in WUN)if(WUN[c]>b&&(!nx||WUN[c]<WUN[nx]))nx=c;
r.push(nx?wL('Capai stage '+WUN[nx]+' dan '+NB[nx][0]+' akan terbuka.','Reach stage '+WUN[nx]+' and '+NB[nx][1]+' will open.'):wL('Semua bangunan sudah terbuka. Nikmati desanya.','Every building is open. Enjoy the village.'));
r.push(wSn?wL('Salju turun. Hangatkan dirimu, ya.','Snow is falling. Stay warm.'):wL('Kalau musim dingin tiba, desa ini tertutup salju. Cantik sekali.','When winter comes, the village is covered in snow. It is lovely.'))}
return r}
function npcStart(o){wjid=null;wjx=wjy=0;wTalk={n:o.n[S.set.lang=='en'?1:0],ls:npcLines(o),i:0,o:o};const ac=npcAc(o);if(ac)ac.face(S.world.x-npcX(o),S.world.y-npcY(o));sfx('click')}
function npcAdv(){const d=wTalk;if(!d)return;sfx('click');if(d.i<d.ls.length-1)d.i++;else wTalk=null}
function npcDraw(cx,cy,py,pass){const w=S.world;NPCS.forEach((o,k)=>{if(o.boat)npcBoatDraw(o,cx,cy,py,pass);if(!npcAwake(o))return;const fy=npcY(o),back=fy<=py;if((pass==0)!=back)return;
const sx=npcX(o)-cx-OX,sy=fy-cy;if(sx<-40-OX||sx>VW+40||sy<-40||sy>400)return;const ga=g.globalAlpha;if(o.fa!==undefined&&o.fa<1)g.globalAlpha=ga*Math.max(0,o.fa);
const ac=npcAc(o),nw=ac&&Anim.has('npc_'+o.id+'_'+ac.state);let bob=0;const nr=wNpc===o;
if(nw){Anim.shadow(g,sx,sy-1,9,3,.3);ac.draw(g,sx,sy,performance.now(),WZ)}
else{const d=HEROES[HID[o.h]],im=IM[d.s],ok=im&&im.complete&&im.naturalWidth>0;bob=Math.abs(Math.sin(t*2+k*1.7))*(o.walk?2.5:1.5);
g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(sx,sy-1,10,4,0,0,7);g.fill();
g.save();g.translate(sx,sy);if(o.sched?o.face<0:w.x<npcX(o))g.scale(-1,1);if(ok)spr(d.s,0,0,2,-bob);else{g.fillStyle=RC[d.rar];g.fillRect(-8,-30-bob,16,28)}g.restore()}
if(o.sched=='fisher')npcFisherFx(o,sx,sy);const ly=nw?46:40;if(nr)T(o.n[S.set.lang=='en'?1:0],sx,sy-ly,'#fc4',10,'center');else T('...',sx,sy-(nw?42:34)-bob,'#fff',10,'center');g.globalAlpha=ga})}
function npcUI(){const d=wTalk;if(!d)return;card(20,228,600,96,'#fc4',1);T(d.n,34,250,'#fc4',13);wr(d.ls[d.i],34,274,68,'#fff',11);
T((d.i<d.ls.length-1?wL('KETUK: lanjut','TAP: next'):wL('KETUK: tutup','TAP: close'))+'  '+(d.i+1)+'/'+d.ls.length,606,316,'#9cf',9,'right')}

/* TEMPA PANDAI BESI: level gear 'fg' (0..SMITH_MAX) tersimpan di item S.items (ikut save). Biaya = emas + bahan (tas dulu, lalu peti). */
const SMITH_MAX=5,SMITH_ROWS=5;let smithPage=0;
const smithMatName={stone:['Batu','Stone'],wood:['Kayu','Wood']};
const smithL=(a,b)=>S.set&&S.set.lang==='en'?b:a;
function smithCost(it){const n=(it.fg|0)+1,r=1+Math.max(0,RAR.indexOf(it.rar))*.5;return{g:Math.round(120*n*r),mats:{stone:2*n,wood:n}}}
function smithMatHave(k){return(+(S.gather&&S.gather.items&&S.gather.items[k])||0)+(+(S.materialStorage&&S.materialStorage.items&&S.materialStorage.items[k])||0)}
function smithTake(k,n){const a=S.gather.items,b=S.materialStorage.items,t=Math.min(n,Math.max(0,a[k]|0));a[k]=(a[k]|0)-t;b[k]=Math.max(0,(b[k]|0)-(n-t))}
function smithUpgrade(it){if(typeof storagecraftEnsure=='function')storagecraftEnsure();if(!it)return'none';if((it.fg|0)>=SMITH_MAX)return'max';const c=smithCost(it);
if(Object.keys(c.mats).some(k=>smithMatHave(k)<c.mats[k])){say(smithL('Bahan kurang.','Not enough materials.'));return'mat'}
if(S.g<c.g){say(smithL('Emas tidak cukup','Not enough gold'));return'gold'}
S.g-=c.g;Object.keys(c.mats).forEach(k=>smithTake(k,c.mats[k]));it.fg=(it.fg|0)+1;sv();sfx('heal');return'ok'}
const smithItems=()=>(S.items||[]).slice().sort((a,b)=>(equippedBy(b.u)?1:0)-(equippedBy(a.u)?1:0)||RAR.indexOf(b.rar)-RAR.indexOf(a.rar));
function smithOpen(){if(typeof storagecraftEnsure=='function')storagecraftEnsure();if(st==='world')wFrom=1;if(typeof lifeWorldQuick!='undefined')lifeWorldQuick=false;smithPage=0;st='smith';sv()}
function smithDraw(){const L=smithItems(),mx=Math.max(0,Math.ceil(L.length/SMITH_ROWS)-1);smithPage=Math.min(smithPage,mx);ov(.94);btn(6,5,76,28,'KEMBALI');T(smithL('TEMPA PANDAI BESI','BLACKSMITH FORGE'),95,25,'#fc4',17);
T(smithL('Emas ','Gold ')+S.g+'  ·  '+smithL('Batu ','Stone ')+smithMatHave('stone')+'  ·  '+smithL('Kayu ','Wood ')+smithMatHave('wood'),320,50,'#cde',10,'center');
if(!L.length){T(smithL('Belum ada gear untuk ditempa.','No gear to forge yet.'),320,200,'#cde',11,'center');return}
L.slice(smithPage*SMITH_ROWS,smithPage*SMITH_ROWS+SMITH_ROWS).forEach((it,i)=>{const y=62+i*48,c=smithCost(it),mx2=(it.fg|0)>=SMITH_MAX,ok=!mx2&&S.g>=c.g&&smithMatHave('stone')>=c.mats.stone&&smithMatHave('wood')>=c.mats.wood;card(20,y,600,42,'#d5e3eb',ok);
T(iName(it)+' +'+(it.fg|0)+'/'+SMITH_MAX+(equippedBy(it.u)?' *':''),32,y+17,'#fff',11);T(mx2?smithL('Tempa maksimal','Max forged'):c.g+smithL(' emas · batu ',' gold · stone ')+c.mats.stone+smithL(' · kayu ',' · wood ')+c.mats.wood,32,y+33,'#9cf',9);
btn(500,y+8,112,26,mx2?'MAKS':smithL('TEMPA','FORGE'),ok)});
btn(20,310,90,26,'<',smithPage>0);T((smithPage+1)+'/'+(mx+1),320,328,'#cde',10,'center');btn(530,310,90,26,'>',smithPage<mx)}
function smithClick(x,y){if(y<34&&x<85){goBack();return}const L=smithItems(),mx=Math.max(0,Math.ceil(L.length/SMITH_ROWS)-1);
if(y>=310&&y<=336){if(x<=110&&smithPage>0)smithPage--;else if(x>=530&&smithPage<mx)smithPage++;return}
L.slice(smithPage*SMITH_ROWS,smithPage*SMITH_ROWS+SMITH_ROWS).forEach((it,i)=>{const y0=62+i*48;if(x>=500&&x<=612&&y>=y0+8&&y<=y0+34)smithUpgrade(it)})}

/* TABIB: sembuhkan racun/bakar (S.ail = sisa stage) & beli ramuan sementara (S.tonic, hitungan stage). Sakit datang dari laba-laba (racun) dan Iblis Merah (bakar). */
const HEALER_CURE=60,HEALER_BUFFS=[{id:'str',n:['Ramuan Kekuatan','Strength Tonic'],g:150,atk:.08,hp:0,stages:3},{id:'vit',n:['Ramuan Vitalitas','Vitality Tonic'],g:150,atk:0,hp:.08,stages:3},{id:'bal',n:['Tonik Tabib','Healer Tonic'],g:300,atk:.05,hp:.05,stages:5}];
function healerEnsure(){if(!S.ail||typeof S.ail!=='object')S.ail={};S.ail.poison=Math.max(0,S.ail.poison|0);S.ail.burn=Math.max(0,S.ail.burn|0);if(!('last' in S.ail))S.ail.last=null;if(!S.tonic||typeof S.tonic!=='object'||!(S.tonic.stages>0))S.tonic=null}
function healerInfect(k){healerEnsure();S.ail[k]=3}
function healerCure(k){healerEnsure();if(!(S.ail[k]>0)){say(smithL('Kamu tidak sakit.','You are not afflicted.'));return'none'}if(S.g<HEALER_CURE){say(smithL('Emas tidak cukup','Not enough gold'));return'gold'}S.g-=HEALER_CURE;S.ail[k]=0;sv();sfx('heal');return'ok'}
function healerBuy(id){healerEnsure();const b=HEALER_BUFFS.find(q=>q.id===id);if(!b)return'none';if(S.g<b.g){say(smithL('Emas tidak cukup','Not enough gold'));return'gold'}S.g-=b.g;S.tonic={id:b.id,name:b.n[0],en:b.n[1],atk:b.atk,hp:b.hp,stages:b.stages,lastStage:null};sv();sfx('heal');return'ok'}
function healerTick(){healerEnsure();const t=S.tonic;if(t){if(t.lastStage!=null&&t.lastStage!==stage){t.stages--;if(t.stages<=0)S.tonic=null}if(S.tonic)S.tonic.lastStage=stage}const a=S.ail;if(a.last!=null&&a.last!==stage){a.poison=Math.max(0,a.poison-1);a.burn=Math.max(0,a.burn-1)}a.last=stage}
function healerApply(){healerEnsure();if(typeof hs==='undefined')return;if(S.ail.poison>0)hs.forEach(h=>{if(!h.dead)h.poison=6});if(S.ail.burn>0)hs.forEach(h=>{if(!h.dead)h.hp=Math.max(1,h.hp-h.mh*.12)})}
function healerBuffSum(){let a=0,h=0;const m=S.buff;if(m&&m.stages>0){a+=Math.min(.10,m.atk||0);h+=Math.min(.10,m.hp||0)}const t=S.tonic;if(t&&t.stages>0){a+=t.atk||0;h+=t.hp||0}a=Math.min(.15,a);h=Math.min(.15,h);return{atk:a,hp:h,on:a>0||h>0}}
/* PENGINAPAN (Step 12): menjual masakan buff dari LIFE_RECIPES tanpa bahan. Stok harian per hidangan (reset saat today() berganti, tersimpan di S.inn).
   Efeknya sama persis dengan lifeCook (S.buff, bonus tiap stat maks 10%, ikut batas gabungan 15% di healerBuffSum). Harga PLACEHOLDER = 60 + (atk+hp)*500 + stage*15. */
const INN_STOCK=3;
/* Kedai bervenue: 'inn' = Penginapan desa (harga dasar, stok 3/hari); 'cafe' = Kafe Kota (harga +25%, stok 2/hari, stok terpisah 'cafe:<id>').
   Stok harian dua-duanya di S.inn.sold (satu objek, reset tiap hari). Default semua fungsi = 'inn' agar perilaku lama tidak berubah. */
const INNV={inn:{k:'',mult:1,stock:3,t:['PENGINAPAN DESA','VILLAGE INN']},cafe:{k:'cafe:',mult:1.25,stock:2,t:['KAFE KOTA','CITY CAFE']}};
let innV='inn';
const innVen=v=>INNV[v]||INNV.inn;
const innPrice=(r,v)=>Math.round((60+(r.atk+r.hp)*500+r.stages*15)*innVen(v).mult);
function innEnsure(){const d=today();if(!S.inn||typeof S.inn!=='object'||S.inn.d!==d)S.inn={d,sold:{}};if(!S.inn.sold||typeof S.inn.sold!=='object')S.inn.sold={}}
function innLeft(id,v){innEnsure();const V=innVen(v);return Math.max(0,V.stock-(S.inn.sold[V.k+id]|0))}
function innBuy(id,v){innEnsure();const V=innVen(v),r=LIFE_RECIPES.find(q=>q.id===id);if(!r)return'none';
if(innLeft(id,v)<=0){say(smithL('Hidangan ini habis hari ini.','Sold out for today.'));return'stock'}
if(S.buff&&S.buff.id===id&&S.buff.stages>0){say(smithL('Masakan itu masih aktif.','That dish is still active.'));return'active'}
const g=innPrice(r,v);if(S.g<g){say(smithL('Emas tidak cukup','Not enough gold'));return'gold'}
S.g-=g;S.inn.sold[V.k+id]=(S.inn.sold[V.k+id]|0)+1;S.buff={id:r.id,name:r.name,en:r.en,atk:Math.min(.10,r.atk),hp:Math.min(.10,r.hp),stages:r.stages,lastStage:null};sv();sfx('heal');
say(smithL('Masakan aktif: '+r.name+' ('+r.stages+' stage)','Dish active: '+r.en+' ('+r.stages+' stages)'));return'ok'}
function innOpen(v){innEnsure();innV=INNV[v]?v:'inn';if(st==='world')wFrom=1;if(typeof lifeWorldQuick!='undefined')lifeWorldQuick=false;st='inn';sv()}
function innRows(v){innEnsure();const V=innVen(v);return LIFE_RECIPES.map(r=>{const left=innLeft(r.id,v),g=innPrice(r,v),act=!!(S.buff&&S.buff.id===r.id&&S.buff.stages>0);return{k:r.id,t:smithL(r.name,r.en),d:r.desc+' · '+r.stages+smithL(' stage',' stages')+' · '+smithL('Sisa ','Left ')+left+'/'+V.stock,s:r.desc.replace(' / ',' · ')+' · '+r.stages+smithL(' stage',' stages'),ing:Object.keys(r.needs||{}).map(k=>[k,r.needs[k]|0]),max:V.stock,g,act,left,ok:left>0&&!act&&S.g>=g}})}
function innDraw(){const R=innRows(innV),b=S.buff&&S.buff.stages>0?S.buff:null;ov(.94);btn(6,5,76,28,'KEMBALI');T(smithL(innVen(innV).t[0],innVen(innV).t[1]),95,25,'#fc4',17);
T(smithL('Emas ','Gold ')+S.g+(b?'  ·  '+smithL('Aktif: ','Active: ')+smithL(b.name,b.en||b.name)+' '+b.stages:''),320,50,'#cde',10,'center');
R.forEach((r,i)=>{const y=62+i*48;card(20,y,600,42,'#f7c45c',r.ok);dishIcon(r.k,28,y+5,32);T(r.t,70,y+17,'#fff',11);T(r.s,70,y+33,'#9cf',9);T(smithL('Bahan','Items'),318,y+10,'#789',8);r.ing.forEach((q,j)=>{const ix=318+j*40;ingIcon(q[0],ix,y+14,16);if(q[1]>1)T('x'+q[1],ix+18,y+27,'#fff',8)});T(r.g+smithL(' emas',' gold'),490,y+17,'#fc4',11,'right');T(smithL('Sisa ','Left ')+r.left+'/'+r.max,490,y+33,'#9ab',9,'right');btn(500,y+8,112,26,r.act?smithL('AKTIF','ACTIVE'):r.left<=0?smithL('HABIS','SOLD OUT'):smithL('BELI','BUY'),r.ok)})}
function innClick(x,y){if(y<34&&x<85){goBack();return}innRows(innV).forEach((r,i)=>{const y0=62+i*48;if(x>=500&&x<=612&&y>=y0+8&&y<=y0+34)innBuy(r.k,innV)})}
/* Toko Kota (Step 10): menjual Umpan Langka (S.fish.bait, dipakai saat memancing) - barang yang tidak ada di toko desa. Batas harian CSHOP_CAP, stok di S.cshop.
   Harga/jumlah = PLACEHOLDER keseimbangan sampai diuji bermain. */
const CSHOP_BAIT={g:90,cap:5};
function cshopEnsure(){const d=today();if(!S.cshop||typeof S.cshop!=='object'||S.cshop.d!==d)S.cshop={d,bait:0};S.cshop.bait=Math.max(0,S.cshop.bait|0)}
const cshopLeft=()=>{cshopEnsure();return Math.max(0,CSHOP_BAIT.cap-S.cshop.bait)};
function cshopBuy(){cshopEnsure();if(cshopLeft()<=0){say(smithL('Umpan habis hari ini.','Bait sold out for today.'));return'stock'}
if(S.g<CSHOP_BAIT.g){say(smithL('Emas tidak cukup','Not enough gold'));return'gold'}
if(!S.fish||typeof S.fish!=='object')lifeEnsure();S.g-=CSHOP_BAIT.g;S.cshop.bait++;S.fish.bait=(S.fish.bait|0)+1;sv();sfx('coin');
say(smithL('Umpan Langka +1 (punya '+S.fish.bait+')','Rare Bait +1 (you have '+S.fish.bait+')'));return'ok'}
function cshopOpen(){cshopEnsure();lifeEnsure();if(st==='world')wFrom=1;if(typeof lifeWorldQuick!='undefined')lifeWorldQuick=false;st='cshop';sv()}
function cshopRow(){const left=cshopLeft();return{left,g:CSHOP_BAIT.g,ok:left>0&&S.g>=CSHOP_BAIT.g}}
function cshopDraw(){const r=cshopRow();ov(.94);btn(6,5,76,28,'KEMBALI');T(smithL('TOKO KOTA','CITY SHOP'),95,25,'#fc4',17);
T(smithL('Emas ','Gold ')+S.g+'  ·  '+smithL('Umpan Langka: ','Rare Bait: ')+((S.fish&&S.fish.bait)|0),320,50,'#cde',10,'center');
const y=62;card(20,y,600,42,'#f7c45c',r.ok);dishIcon('bait',28,y+5,32);T(smithL('Umpan Langka','Rare Bait'),70,y+17,'#fff',11);T(smithL('Peluang ikan langka naik saat memancing','Better rare-fish odds when fishing'),70,y+33,'#9cf',9);T(r.g+smithL(' emas',' gold'),490,y+17,'#fc4',11,'right');T(smithL('Sisa ','Left ')+r.left+'/'+CSHOP_BAIT.cap,490,y+33,'#9ab',9,'right');btn(500,y+8,112,26,r.left<=0?smithL('HABIS','SOLD OUT'):smithL('BELI','BUY'),r.ok)}
function cshopClick(x,y){if(y<34&&x<85){goBack();return}if(x>=500&&x<=612&&y>=70&&y<=96)cshopBuy()}
function healerOpen(){healerEnsure();if(st==='world')wFrom=1;if(typeof lifeWorldQuick!='undefined')lifeWorldQuick=false;st='healer';sv()}
function healerRows(){healerEnsure();const A=S.ail,c=[['poison',smithL('Sembuhkan Racun','Cure Poison'),A.poison>0],['burn',smithL('Sembuhkan Luka Bakar','Cure Burn'),A.burn>0]].map(r=>({k:r[0],t:r[1],d:r[2]?smithL('Sakit: ','Afflicted: ')+A[r[0]]+smithL(' stage',' stages'):smithL('Sehat','Healthy'),g:HEALER_CURE,ok:r[2]&&S.g>=HEALER_CURE}));return c.concat(HEALER_BUFFS.map(b=>({k:b.id,buff:1,t:smithL(b.n[0],b.n[1]),d:(b.atk?'ATK +'+Math.round(b.atk*100)+'% ':'')+(b.hp?'HP +'+Math.round(b.hp*100)+'% ':'')+'· '+b.stages+smithL(' stage',' stages'),g:b.g,ok:S.g>=b.g})))}
function healerDraw(){const R=healerRows(),t=S.tonic;ov(.94);btn(6,5,76,28,'KEMBALI');T(smithL('TABIB DESA','VILLAGE HEALER'),95,25,'#fc4',17);
T(smithL('Emas ','Gold ')+S.g+(t?'  ·  '+smithL('Aktif: ','Active: ')+smithL(t.name,t.en)+' '+t.stages:''),320,50,'#cde',10,'center');
R.forEach((r,i)=>{const y=62+i*48;card(20,y,600,42,r.buff?'#f7c45c':'#7fc9ff',r.ok);T(r.t,32,y+17,'#fff',11);T(r.d+' · '+r.g+smithL(' emas',' gold'),32,y+33,'#9cf',9);btn(500,y+8,112,26,r.buff?smithL('BELI','BUY'):smithL('SEMBUHKAN','CURE'),r.ok)})}
function healerClick(x,y){if(y<34&&x<85){goBack();return}healerRows().forEach((r,i)=>{const y0=62+i*48;if(x>=500&&x<=612&&y>=y0+8&&y<=y0+34){if(r.buff)healerBuy(r.k);else healerCure(r.k)}})}
