/* NPC DUNIA 
 16 NPC berdialog di dunia. Dimuat setelah farm.js. Semua hook di world.js dijaga (self.npcXxx&&...), jadi bila file ini
 tidak dimuat dunia tetap jalan tanpa NPC. Teks 2 bahasa langsung di kode lewat wL(id,en) (tanpa kamus i18n.js).
 roam:1 = NPC berkeliling ke seluruh desa (lompatan 3-10 tile, dalam batas NPCV); tanpa roam hanya sekitar rumah. Tambah NPC: tambah entri di NPCS (h = id hero untuk sprite, tx/ty = tile rumput kosong) dan satu cabang di npcLines(). */
const NPCS=[
{id:'guard',h:'knight',tx:22,ty:3,n:['Penjaga Gerbang','Gate Guard']},
{id:'merchant',h:'cleric',tx:12,ty:9,n:['Pedagang','Merchant']},
{id:'farmer',h:'clubber',tx:13,ty:22,n:['Petani','Farmer']},
{id:'elder',h:'oracle',tx:26,ty:12,n:['Tetua Desa','Village Elder']},
{id:'fisher',h:'axeman',tx:30,ty:37,sched:'fisher',boat:1,n:['Nelayan','Fisherman']},
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
{id:'toddler',h:'hunter',tx:52,ty:14,roam:1,ambient:1,sp:15,n:['Anak Kecil','Little Kid'],g:[['Lihat, ada kupu-kupu!','Look, a butterfly!'],['Aku bisa lari cepat. Mau lomba?','I can run fast. Race me?'],['Ibu bilang jangan jauh-jauh dari rumah.','Mom said not to go far from home.']]}];
const NB={R:['Barak','the Barracks'],F:['Ladang','the Field'],Q:['Papan Misi','the Quest Board']};
/* posisi runtime (px,py) = rumah (tx,ty) + berkeliling pendek. wUseV() menimpa tx,ty -> npcSync mereset posisi. */
function npcSync(o){const k=o.tx+','+o.ty;if(o._k!==k){o._k=k;o.px=o.tx*WS+WS/2;o.py=o.ty*WS+26;o.mode='wait';o.wt=1+Math.random()*3;o.vx=o.vy=0;o.gx=o.gy=0}}
const npcX=o=>(npcSync(o),o.px),npcY=o=>(npcSync(o),o.py);
/* Jadwal harian dari lifeHour() (life.js): jam NPCDAY[0]..NPCDAY[1]-1 NPC ada di desa; di luar itu pulang (tak tampil, tak menghalangi, tak bisa diajak bicara) dan paginya muncul lagi di rumah. */
const NPCDAY=[6,20],npcAwake=o=>{const h=typeof lifeHour=='function'?lifeHour():9;return h>=NPCDAY[0]&&h<NPCDAY[1]};
const NPCR=WS*2,NPCSP=28,NPCV=[3,5,60,42]; /* NPCV = batas desa (tile x0,y0,x1,y1) untuk NPC roam:1 */
function npcAc(o){if(o.ac===undefined)o.ac=typeof Anim!='undefined'?new Anim.Actor('npc_'+o.id):null;return o.ac}
const npcOk=(x,y)=>!(wSolid(x-WFH,y-WFV)||wSolid(x+WFH,y-WFV)||wSolid(x-WFH,y)||wSolid(x+WFH,y));
/* Nelayan (sched:'fisher'): jadwal per jam dari lifeHour(). Pagi <NPCFH[0] memancing di ujung dermaga (joran+pelampung), siang <NPCFH[1] menjahit jaring,
   sore naik perahu (boat:1), berlayar lewat waypoint NPCBR (tile air '~'), memancing di titik terakhir, lalu kembali ke tambatan. Perahu = boat.png (tools/build_boat.py), digambar di npcDraw (lapisan dunia, ikut culling/zoom). */
const NPCFH=[11,16],NPCBSP=46,NPCWSP=34,NPCCAST=13,NPCBR=[[33.5,37.7],[34.5,39.7],[37.5,41.7],[42.5,42.7]];
const NPCBT=typeof Image=='function'?Object.assign(new Image(),{src:'assets/world/boat.png'}):null;
const npcTP=(tx,ty)=>[tx*WS+WS/2,ty*WS+26],npcBP=i=>[NPCBR[i][0]*WS,NPCBR[i][1]*WS];
const npcWater=(x,y)=>{const tx=Math.floor(x/WS),ty=Math.floor(y/WS);if(!(tx>=0&&ty>=0&&tx<WW&&ty<WH))return false;const c=WMAP[ty][tx];return c=='~'||c=='+'};
function npcFisherHome(o){o.act=null;o.st='tofish';o.aboard=0;o.wi=0;const m=npcBP(0);o.bx=m[0];o.by=m[1];o.bf=1;o.ft=0;o.face=1;o.walk=0}
function npcMove(o,x,y,dt){const sp=NPCWSP,dx=x-o.px,dy=y-o.py,l=Math.hypot(dx,dy);o.walk=1;if(l<=sp*dt){o.px=x;o.py=y;return true}o.px+=dx/l*sp*dt;o.py+=dy/l*sp*dt;if(Math.abs(dx)>1)o.face=dx>0?1:-1;return false}
function npcFisher(o,dt,talk){if(o.bx===undefined)npcFisherHome(o);const h=typeof lifeHour=='function'?lifeHour():9,act=h<NPCFH[0]?'fish':h<NPCFH[1]?'net':'boat';
if(act!=o.act){o.act=act;o.st=act=='boat'?'toboat':act=='net'?'tonet':'tofish';o.ft=0}
o.walk=0;if(talk||wDlg)return;const s=o.st;
if(s=='tofish'){const q=npcTP(30,37);if(npcMove(o,q[0],q[1],dt)){o.st='fish';o.ft=0;o.face=1}}
else if(s=='tonet'){const q=npcTP(31,36);if(npcMove(o,q[0],q[1],dt)){o.st='net';o.ft=0;o.face=-1}}
else if(s=='toboat'){const q=npcTP(32,37);if(npcMove(o,q[0],q[1],dt))o.st='board'}
else if(s=='board'){const m=npcBP(0);if(npcMove(o,m[0],m[1]-8,dt)){o.aboard=1;o.st='sail';o.wi=0}}
else if(s=='sail'||s=='back'){const dir=s=='sail'?1:-1,n=o.wi+dir,p=npcBP(n),dx=p[0]-o.bx,dy=p[1]-o.by,l=Math.hypot(dx,dy),st=NPCBSP*dt;
if(Math.abs(dx)>1)o.bf=dx>0?1:-1;
if(l<=st){o.bx=p[0];o.by=p[1];o.wi=n;if(s=='sail'&&n==NPCBR.length-1){o.st='cast';o.ft=0}else if(s=='back'&&n==0)o.st='unboard'}
else{const nx=o.bx+dx/l*st,ny=o.by+dy/l*st;if(npcWater(nx,ny)&&npcWater(nx-18,ny)&&npcWater(nx+18,ny)){o.bx=nx;o.by=ny}}
o.px=o.bx;o.py=o.by-8;o.face=o.bf;o.walk=1}
else if(s=='unboard'){const q=npcTP(32,37);if(npcMove(o,q[0],q[1],dt)){o.aboard=0;o.st='rest';o.ft=0;if(typeof lifeShopFishAdd=='function')lifeShopFishAdd()}}
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
function npcUpdate(dt){const w=S.world;if(!w)return;NPCS.forEach(o=>{if(!npcAwake(o)){o.gone=1;if(o.sched=='fisher')npcFisherHome(o);return}if(o.gone){o.gone=0;o._k=null}npcSync(o);if(o.sched=='fisher'){npcFisher(o,dt,wTalk&&wTalk.o===o);return}const ac=npcAc(o),hx=o.tx*WS+WS/2,hy=o.ty*WS+26;let vx=0,vy=0;
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
else if(o.id=='innkeeper'){r.push(wL('Selamat datang di penginapan. Kamar hangat selalu siap untuk petualang.','Welcome to the inn. A warm room is always ready for adventurers.'));
r.push(wL('Banyak pelancong lewat sini. Kabar dari gerbang selalu sampai duluan di mejaku.','Many travelers pass through. News from the gate always reaches my table first.'));
r.push(wL('Lelah bertarung? Duduk sebentar, nikmati desanya.','Tired from fighting? Sit a while and enjoy the village.'))}
else{r.push(wL('Desa ini tumbuh seiring langkahmu.','This village grows with every step you take.'));
let nx=null;for(const c in WUN)if(WUN[c]>b&&(!nx||WUN[c]<WUN[nx]))nx=c;
r.push(nx?wL('Capai stage '+WUN[nx]+' dan '+NB[nx][0]+' akan terbuka.','Reach stage '+WUN[nx]+' and '+NB[nx][1]+' will open.'):wL('Semua bangunan sudah terbuka. Nikmati desanya.','Every building is open. Enjoy the village.'));
r.push(wSn?wL('Salju turun. Hangatkan dirimu, ya.','Snow is falling. Stay warm.'):wL('Kalau musim dingin tiba, desa ini tertutup salju. Cantik sekali.','When winter comes, the village is covered in snow. It is lovely.'))}
return r}
function npcStart(o){wjid=null;wjx=wjy=0;wTalk={n:o.n[S.set.lang=='en'?1:0],ls:npcLines(o),i:0,o:o};const ac=npcAc(o);if(ac)ac.face(S.world.x-npcX(o),S.world.y-npcY(o));sfx('click')}
function npcAdv(){const d=wTalk;if(!d)return;sfx('click');if(d.i<d.ls.length-1)d.i++;else wTalk=null}
function npcDraw(cx,cy,py,pass){const w=S.world;NPCS.forEach((o,k)=>{if(o.boat)npcBoatDraw(o,cx,cy,py,pass);if(!npcAwake(o))return;const fy=npcY(o),back=fy<=py;if((pass==0)!=back)return;
const sx=npcX(o)-cx-OX,sy=fy-cy;if(sx<-40-OX||sx>VW+40||sy<-40||sy>400)return;
const ac=npcAc(o),nw=ac&&Anim.has('npc_'+o.id+'_'+ac.state);let bob=0;const nr=wNpc===o;
if(nw){Anim.shadow(g,sx,sy-1,9,3,.3);ac.draw(g,sx,sy,performance.now(),WZ)}
else{const d=HEROES[HID[o.h]],im=IM[d.s],ok=im&&im.complete&&im.naturalWidth>0;bob=Math.abs(Math.sin(t*2+k*1.7))*(o.walk?2.5:1.5);
g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(sx,sy-1,10,4,0,0,7);g.fill();
g.save();g.translate(sx,sy);if(o.sched?o.face<0:w.x<npcX(o))g.scale(-1,1);if(ok)spr(d.s,0,0,2,-bob);else{g.fillStyle=RC[d.rar];g.fillRect(-8,-30-bob,16,28)}g.restore()}
if(o.sched=='fisher')npcFisherFx(o,sx,sy);const ly=nw?46:40;if(nr)T(o.n[S.set.lang=='en'?1:0],sx,sy-ly,'#fc4',10,'center');else T('...',sx,sy-(nw?42:34)-bob,'#fff',10,'center')})}
function npcUI(){const d=wTalk;if(!d)return;card(20,228,600,96,'#fc4',1);T(d.n,34,250,'#fc4',13);wr(d.ls[d.i],34,274,68,'#fff',11);
T((d.i<d.ls.length-1?wL('KETUK: lanjut','TAP: next'):wL('KETUK: tutup','TAP: close'))+'  '+(d.i+1)+'/'+d.ls.length,606,316,'#9cf',9,'right')}
