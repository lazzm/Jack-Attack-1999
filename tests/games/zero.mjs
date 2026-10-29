// FORMULA NULL (sn.zero) play-through on a disposable localhost server, with native 256x224 review captures.
//   P=$(~/bin/freeport); D=$(mktemp -d /tmp/zero-XXXX); (cd app && PORT=$P DATA_DIR=$D ADMIN_TOKEN=testtoken node server.js & echo $! >$D/pid)
//   ...wait for curl...; node tests/games/zero.mjs http://localhost:$P [--before]; kill $(cat $D/pid)
// Menus, countdown, throttle, steering, braking, pause, hazards (mines, ice, magnets, wind) and the room/LOCK IN/refresh
// checks use real key presses. Long distances (whole races, the cup's last race) use the cartridge's own autopilot
// (dbg.auto), which still drives through the production physics; placement (dbg.tp / dbg.near) only sets up a test.
// --before plays the committed HEAD cartridge into tests/shots/games/zero/before/ (title, menus, a race, the room).
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const base=process.argv.find(a=>/^https?:\/\//.test(a))||'http://localhost:18080';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Use a throwaway localhost server');
const before=process.argv.includes('--before'),dir=root+'tests/shots/games/zero/'+(before?'before':'after')+'/';
const baseline=before?execFileSync('git',['show','HEAD:app/public/js/rm-g-zero.js'],{cwd:root,encoding:'utf8'}):null;
await mkdir(dir,{recursive:true});
const account='Zero'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok,'register');
const f=await roomFixture(base,{account,password,signup:false}),p=f.page;
const watchdog=setTimeout(()=>{console.error('ZERO total timeout');f.browser.close().finally(()=>process.exit(1))},1500000);
const log=[];const note=s=>{console.log(s);log.push(s)};
try{
 if(before)await p.route('**/js/rm-g-zero.js*',r=>r.fulfill({body:baseline,contentType:'application/javascript'}));
 const until=async(fn,arg,n=600)=>{for(let i=0;i<n;i++){assert.deepEqual(f.errors,[],'browser errors');if(await p.evaluate(fn,arg))return;await p.waitForTimeout(100)}throw Error('Timeout '+fn)};
 const frames=async n=>{await p.evaluate(n=>window.zeroF=RoomTV.dbg().frame+n,n);await until(()=>RoomTV.dbg().frame>=window.zeroF)};
 const press=async(k,n=4)=>{await p.keyboard.press(k);await frames(n)};
 const st=()=>p.evaluate(()=>RoomTV.dbg().dbg.state());
 const mode=()=>p.evaluate(()=>RoomTV.dbg().dbg.mode);
 const D=(fn,arg)=>p.evaluate(fn,arg);
 async function pick(label){await press('Enter');for(let i=0;i<6&&await D(l=>{const d=RoomTV.dbg().dbg;return d.menu&&d.menu[d.sel]!==l},label);i++)await press('ArrowDown');await press('z')}
 async function shot(name,page=false){
  if(page)await p.screenshot({path:dir+name+'.png'});
  const uri=await p.evaluate(()=>RoomTV.dbg().cv.toDataURL('image/png').split(',')[1]);
  await writeFile(dir+name+(page?'-native':'')+'.png',Buffer.from(uri,'base64'));
 }
 // ---- into the cupboard: the Super Ultra, the cartridge, the telly
 await D(()=>House.goRoom('cupboard',0));await until(()=>!House.gliding);
 await D(()=>{House.setWalkFrom({...House.P,lvl:'G',seat:0});House._.setMode('walk')});await playCase(f,'sn.zero');
 await D(()=>RoomTV.test('sn.zero'));await until(()=>RoomTV._dbg()?.st==='game'&&!!RoomTV.dbg()?.dbg&&!House.gliding);
 await frames(40);await shot('in-room-title',true);
 if(!before)assert(await D(()=>RoomTV._dbg().surface&&HouseRooms.rooms.cupboard.cupScreen.material.map.userData.jackLive),'game draws on the physical telly');
 await p.keyboard.press('t');await until(()=>RoomTV.lockIn());await frames(10);await shot('lock-in-title',true);
 for(let n=0;n<3;n++){await frames(20);await shot('attract-'+n)}
 // ---- title menu -> grand prix -> class -> league -> machine
 await press('Enter');await shot('title-menu');
 await press('ArrowDown');await press('ArrowUp');await press('z');assert.equal(await mode(),'class');await shot('class');
 if(!before){await press('z');assert.equal(await mode(),'league');await shot('league-1');await press('ArrowDown');await shot('league-2');await press('ArrowDown');await shot('league-3');await press('ArrowUp');await press('ArrowUp')}
 await press('z');assert.equal(await mode(),'car');
 for(let n=0;n<4;n++){await frames(8);await shot('machine-'+n);await press('ArrowRight')}
 await press('z');assert.equal(await mode(),'intro');await frames(30);await shot('intro-flyby');await frames(70);await shot('intro-track-name');
 await until(()=>RoomTV.dbg().dbg.mode==='count');await frames(70);await shot('countdown');
 // hold GO through the lights (rocket start window), then steer and brake for real
 await p.keyboard.down('z');await until(()=>RoomTV.dbg().dbg.mode==='race');await frames(150);
 let s0=await st();assert(s0.v>120,'throttle moves the machine: '+s0.v);await shot('race-start');
 for(let n=0;n<3;n++){await frames(10);await shot('race-seq-'+n)}
 const a0=await D(()=>RoomTV.dbg().dbg.R.me.a);await p.keyboard.down('ArrowLeft');await frames(30);await p.keyboard.up('ArrowLeft');
 assert(Math.abs((await D(()=>RoomTV.dbg().dbg.R.me.a))-a0)>0.05,'steering turns');await shot('race-steer');
 await p.keyboard.up('z');const v1=(await st()).v;await p.keyboard.down('x');await frames(40);await p.keyboard.up('x');const v2=(await st()).v;assert(v2<v1-40||v2<40,'brake slows '+v1+' '+v2);
 await p.keyboard.down('z');await frames(60);
 await press('Enter');const t1=(await st()).t;await frames(40);assert.equal((await st()).t,t1,'pause freezes the race');await shot('pause');await press('Enter');await p.keyboard.up('z');
 if(before){
  const bench=await D(()=>RoomTV.dbg().dbg.bench());note('BENCH before draw/update ms '+JSON.stringify(bench));
  await writeFile(dir+'performance.json',JSON.stringify({bench},null,2));
  await D(()=>RoomTV.dbg().dbg.race(1,'gp',1,0));await frames(200);await shot('track-1-start');
  console.log('ZERO BEFORE CAPTURES DONE');
 }else{
  // backmarkers: five slow tugs, never in the ranking
  const bm=await D(()=>{const R=RoomTV.dbg().dbg.R;return {backs:R.cars.filter(c=>c.back).length,ranked:R.order.length}});
  assert.deepEqual(bm,{backs:5,ranked:8});
  // ---- every track of the three leagues: start + a stretch on autopilot
  for(let ti=0;ti<15;ti++){
   await D(ti=>{const d=RoomTV.dbg().dbg;d.race(ti,'gp',1,ti%4)},ti);await frames(90);await shot('track-'+String(ti).padStart(2,'0')+'-start');
   await D(()=>RoomTV.dbg().dbg.auto(true,1));await frames(ti%3?260:420);
   const s=await st();assert(s.s>800&&Number.isFinite(s.lat),'autopilot gets round track '+ti);
   const ai=await D(()=>RoomTV.dbg().dbg.R.cars.filter(c=>!c.player).every(c=>Number.isFinite(c.x)&&c.s>-200));assert(ai,'AI on track '+ti);
   await shot('track-'+String(ti).padStart(2,'0')+'-mid');
  }
  // ---- hazards with real keys (no autopilot): a mine, ice, a magnet strip, side wind
  const hazard=async(ti,kind,lat,test)=>{
   await D(ti=>RoomTV.dbg().dbg.race(ti,'practice',1,0),ti);await frames(5);
   const at=await D(({kind,lat})=>{const d=RoomTV.dbg().dbg,f=d.T.feats.find(f=>f.kind===kind);d.tp(f.s0-45,lat==null?f.lc:lat);d.R.me.energy=100;return f},{kind,lat});
   await p.keyboard.down('z');const r=await test(at);await p.keyboard.up('z');return r;
  };
  await hazard(5,'mine',null,async f=>{await until(()=>RoomTV.dbg().dbg.R.me.mineT>0,null,100);await frames(4);await shot('hazard-mine');assert((await st()).energy<100,'mine costs power')});
  await hazard(6,'ice',0,async f=>{await until(f=>{const m=RoomTV.dbg().dbg.R.me;return m.s>f.s0+20},f,100);await p.keyboard.down('ArrowRight');await frames(30);await shot('hazard-ice');await p.keyboard.up('ArrowRight')});
  const mag=await hazard(7,'mag',null,async f=>{const l0=(await st()).lat;await until(f=>RoomTV.dbg().dbg.R.me.s>f.s0+60,f,100);await frames(20);await shot('hazard-magnet');return [l0,(await st()).lat]});
  assert(Math.abs(mag[1])>Math.abs(mag[0])+2,'magnet pulls to the wall '+mag);
  await D(()=>RoomTV.dbg().dbg.race(4,'practice',1,0));await frames(5);
  await D(()=>{const d=RoomTV.dbg().dbg;d.tp(400,0)});const w0=(await st()).lat;await p.keyboard.down('z');await frames(90);await shot('hazard-wind');await p.keyboard.up('z');
  assert(Math.abs((await st()).lat-w0)>3,'wind pushes the machine');
  // ---- a backmarker up close, then a bump
  await D(()=>{const d=RoomTV.dbg().dbg;d.race(0,'gp',1,0)});await frames(5);
  await D(()=>{const d=RoomTV.dbg().dbg,R=d.R,b=R.cars.find(c=>c.back);d.tp(b.s-90,b.lat)});await frames(16);await shot('backmarker');
  // ---- practice via the menus (the ghost is a cast mate)
  await D(()=>RoomTV.dbg().dbg.title());await frames(40);
  await pick('PRACTICE');assert.equal(await mode(),'track');await shot('practice-track');
  for(let n=0;n<5;n++)await press('ArrowRight');await shot('practice-track-6');await press('ArrowLeft');await press('ArrowLeft');await press('ArrowLeft');await press('ArrowLeft');await press('ArrowLeft');
  await press('z');await press('z');assert.equal(await mode(),'intro');
  const ghost=await D(()=>RoomTV.dbg().dbg.R.cars.find(c=>c.ghost).name);assert(!/DAVE|LUKE|JACK/.test(ghost),'ghost name from Cast: '+ghost);
  await until(()=>RoomTV.dbg().dbg.mode==='count');await p.keyboard.down('z');await until(()=>RoomTV.dbg().dbg.mode==='race');await frames(200);await shot('practice-ghost');await p.keyboard.up('z');
  // ---- records
  await D(()=>RoomTV.dbg().dbg.title());await frames(40);await pick('RECORDS');assert.equal(await mode(),'records');await shot('records-1');
  await press('ArrowLeft');await shot('records-cups');await press('z');
  // ---- finish, results, standings (autopilot for the last lap)
  await D(()=>{const d=RoomTV.dbg().dbg;d.race(2,'gp',1,1);d.near(5,500);d.auto(true,1.05)});
  await until(()=>RoomTV.dbg().dbg.mode==='finish',null,900);await frames(20);await shot('finish');
  await until(()=>RoomTV.dbg().dbg.mode==='results',null,900);await frames(150);await shot('results');
  await press('z');assert.equal(await mode(),'standings');await frames(70);await shot('standings');
  // ---- rank out: everybody ahead when lap 1 ends
  await D(()=>{const d=RoomTV.dbg().dbg;d.race(0,'gp',2,3);const R=d.R,L=d.T.G.L;d.tp(L-60,0);for(const c of R.cars)if(!c.player&&!c.back){c.s=L+40+Math.random()*200;c.lapMax=1}d.auto(true,1)});
  await until(()=>['out','outcard'].includes(RoomTV.dbg().dbg.mode),null,300);await frames(30);await shot('ranked-out');
  await until(()=>RoomTV.dbg().dbg.mode==='outcard',null,300);await frames(70);await shot('spare-cars');
  // ---- the last race of the KINGSIZE league, won: ceremony, the machine's ending, the staff roll, the name
  await D(()=>{const d=RoomTV.dbg().dbg;d.race(14,'gp',1,2);d.cup.pts.gecko=40;d.near(5,500);d.auto(true,1.06);for(const c of d.R.cars)if(!c.player)c.s-=900});
  await until(()=>RoomTV.dbg().dbg.mode==='results',null,1500);await frames(120);await shot('results-final');
  await press('z');await frames(60);await shot('standings-final');await press('z');await frames(4);if(await mode()==='name'){await frames(10);await shot('name-lap');await press('Enter')}assert.equal(await mode(),'cupend');await frames(140);await shot('cup-ceremony');
  await press('z');assert.equal(await mode(),'ending');await frames(90);await shot('ending-1');await press('z');await frames(90);await shot('ending-2');
  await press('z');assert.equal(await mode(),'staff');await frames(200);await shot('staff-1');await p.keyboard.down('z');await frames(200);await shot('staff-2');
  await until(()=>!['staff','ending'].includes(RoomTV.dbg().dbg.mode),null,600);await p.keyboard.up('z');
  const m=await mode();assert(['name','reported'].includes(m),'after the roll: '+m);if(m==='name'){await frames(20);await shot('name-entry')}
  const sv=await D(()=>{const S=RoomTV.dbg().dbg.SV;return {won:S.won,ends:S.ends}});assert(sv.won['king:pro']&&sv.ends.gecko===4,'league win and ending saved '+JSON.stringify(sv));
  // ---- the secret class appears once all three leagues are won on MASTER
  await D(()=>{const S=RoomTV.dbg().dbg.SV;for(const l of ['night','queen','king'])S.won[l+':master']=1;RoomTV.dbg().dbg.title()});await frames(40);
  await pick('GRAND PRIX');assert.equal(await mode(),'class');
  for(let n=0;n<3;n++)await press('ArrowDown');await shot('class-null');
  // ---- names: every rival/high-score name comes from Cast
  const names=await D(()=>{const d=RoomTV.dbg().dbg,S=d.SV;return {cups:S.cups.map(r=>r[1]),recs:S.recs.chrome.map(r=>r[1]),me:window.Cast.me().first}});
  assert(names.cups.concat(names.recs).every(n=>/^@(me|mate[1-4])$/.test(n)||n.length===3),'tables hold cast ids or typed initials '+JSON.stringify(names));
  // ---- performance (software rendering, native 256x224)
  const bench=await D(()=>{const d=RoomTV.dbg().dbg;d.race(10,'gp',1,0);return d.bench()});note('BENCH after draw/update ms '+JSON.stringify(bench));
  const raf=await D(async()=>{const t=[];let pv;await new Promise(r=>{function k(n){if(pv)t.push(n-pv);pv=n;if(t.length>=120)r();else requestAnimationFrame(k)}requestAnimationFrame(k)});t.sort((a,b)=>a-b);return {p50:t[60],p95:t[114]}});
  note('RAF '+JSON.stringify(raf));await writeFile(dir+'performance.json',JSON.stringify({bench,raf},null,2));
  // ---- a race in progress survives a refresh (comes back paused, same place)
  await D(()=>{const d=RoomTV.dbg().dbg;d.race(7,'gp',1,0)});await frames(10);await p.keyboard.down('z');await frames(260);await p.keyboard.up('z');
  await press('Enter');const pre=await st();assert(pre.s>200);await shot('refresh-before');
  await p.reload({waitUntil:'domcontentloaded'});
  await until(()=>window.AccountGate?.allowed&&window.RoomTV?._dbg()?.st==='game'&&!!RoomTV.dbg()?.dbg&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'),null,900);
  await frames(10);const post=await st();assert.equal(post.mode,'race');assert(Math.abs(post.s-pre.s)<5,'same place after refresh '+pre.s+' '+post.s);
  assert(await D(()=>RoomTV.dbg().dbg.state&&RoomTV.dbg().dbg.R&&RoomTV.dbg().dbg.T.def.id==='port2'));
  await p.screenshot({path:dir+'refresh-resumed.png'});await shot('refresh-resumed-native');
  await press('Enter');await p.keyboard.down('z');await frames(60);await p.keyboard.up('z');assert((await st()).t>pre.t,'carries on after the refresh');
  // ---- Q leans back from the telly, the game keeps its instance
  if(await D(()=>RoomTV.lockIn()))await p.keyboard.press('t');await frames(10);await p.screenshot({path:dir+'in-room-race.png'});
  await D(()=>window.zeroInst=RoomTV.dbg());await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);
  assert(await D(()=>RoomTV._dbg().background&&RoomTV.dbg()===window.zeroInst));await p.screenshot({path:dir+'lean-back.png'});
  console.log('ZERO PASS');
 }
 assert.deepEqual(f.errors,[],'browser errors');
}finally{clearTimeout(watchdog);await f.browser.close()}
