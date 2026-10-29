// Disposable localhost cartridge review. Branch placement uses the existing debug API;
// all menu, movement, equipment, puzzle and combat decisions use real browser inputs.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const base=process.argv.find(x=>/^http:/.test(x));
assert(base&&['localhost','127.0.0.1'].includes(new URL(base).hostname),'Supply a throwaway localhost URL');
const before=process.argv.includes('--before'),tag=before?'before':'after';
assert.equal(await (await fetch(base+'/js/rm-g-zeldo.js')).text(),await readFile(fileURLToPath(new URL('../../app/public/js/rm-g-zeldo.js',import.meta.url)),'utf8'),'Throwaway server must serve this worktree');
const dir=fileURLToPath(new URL('../shots/games/zeldo/',import.meta.url));await mkdir(dir,{recursive:true});
const baseline=before?(process.env.ZELDO_BASELINE?await readFile(process.env.ZELDO_BASELINE,'utf8'):execFileSync('git',['show','HEAD:app/public/js/rm-g-zeldo.js'],{encoding:'utf8'})):null;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
let p;const errors=[];
async function makePage(){
 p=await browser.newPage({viewport:{width:1366,height:860}});
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
 await p.route('**/__zeldo-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Cartridge review</title><link rel="icon" href="data:,"><body style="background:#101828">'}));
 if(before)await p.route('**/js/rm-g-zeldo.js*',r=>r.fulfill({body:baseline,contentType:'application/javascript'}));
 await p.goto(base+'/__zeldo-review');
 await p.evaluate(()=>{window.Room={_:{esc:s=>s},House:{paused:true}};window.House=Room.House});
 for(const src of ['cast','rm-tv','rm-g-zeldo'])await p.addScriptTag({url:base+'/js/'+src+'.js'});
 await p.evaluate(installRunner,false);
}
function installRunner(restoring=false){
  const cv=document.createElement('canvas');cv.width=256;cv.height=224;
  Object.assign(cv.style,{position:'fixed',width:'min(90vw,90vh * 256 / 224)',height:'auto',imageRendering:'pixelated',left:'50%',top:'50%',transform:'translate(-50%,-50%)'});document.body.append(cv);
  const held={},pressed={};let seed=1999;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const saved={value:JSON.parse(localStorage.getItem('zeldo-review-save')||'null')};
  const K={cv,g:cv.getContext('2d'),hud:document.createElement('canvas').getContext('2d'),W:256,H:224,font:RoomTV.font,t:0,frame:0,restoring,label:b=>({a:'A',b:'B',y:'Y',x:'X',start:'START'}[b]||b),keyLabel:b=>({a:'Z',b:'X',y:'V',x:'C',start:'ENTER'}[b]||b),
   rnd:()=>()=>Math.random(),load:()=>structuredClone(saved.value),save:s=>{saved.value=structuredClone(s);localStorage.setItem('zeldo-review-save',JSON.stringify(s));return true},music:()=>{},over:()=>{},secret:()=>{},held:b=>!!held[b],pressed:b=>!!pressed[b],sfx:{tone(){},seq(){},noise(){}}};
  const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',z:'a',x:'b',v:'y',c:'x',Enter:'start',Shift:'select'};
  addEventListener('keydown',e=>{const b=map[e.key];if(b){if(!held[b])pressed[b]=true;held[b]=true;e.preventDefault()}},true);addEventListener('keyup',e=>{if(map[e.key])held[map[e.key]]=false},true);
  window.review={K,saved,game:RoomTV.defs['sn.zeldo'].make(K),step(n){for(let i=0;i<n;i++){this.game.update(1/60);K.frame++;K.t+=1/60;for(const k in pressed)delete pressed[k]}this.game.draw()},restart(restoring=true){this.game.end();K.restoring=restoring;this.game=RoomTV.defs['sn.zeldo'].make(K);this.step(1)}};
}

const frames=n=>p.evaluate(n=>review.step(n),n);
const key=async k=>{await p.keyboard.down(k);await frames(1);await p.keyboard.up(k);await frames(1)};
const hold=async(k,n)=>{await p.keyboard.down(k);await frames(n);await p.keyboard.up(k);await frames(1)};
const state=()=>p.evaluate(()=>{const d=review.K.dbg;return{mode:d.mode,room:d.room?.id,act:d.pl?.act,x:d.pl?.x,y:d.pl?.y,tb:!!d.tb,co:!!d.co,S:d.S}});
const shot=async name=>{await frames(1);await p.screenshot({path:dir+tag+'-'+name+'.png'});const data=await p.evaluate(()=>review.K.cv.toDataURL());await writeFile(dir+tag+'-'+name+'-native.png',Buffer.from(data.split(',')[1],'base64'))};
async function text(){for(let i=0;i<100;i++){const s=await state();if(!s.tb&&!s.co)return;if(s.tb){await frames(150);await key('z')}else await frames(60)}throw Error('Dialogue stalled '+JSON.stringify(await state()))}
async function reloadCartridge(){await p.reload();await p.evaluate(()=>{window.Room={_:{esc:s=>s},House:{paused:true}};window.House=Room.House});for(const src of ['cast','rm-tv','rm-g-zeldo'])await p.addScriptTag({url:base+'/js/'+src+'.js'});await p.evaluate(installRunner,true);await frames(1)}
async function place(id,x,y,dir=0){await p.evaluate(({id,x,y,dir})=>review.K.dbg.warp(id,x,y,dir),{id,x,y,dir});await frames(1)}
async function performanceSample(){return p.evaluate(()=>{
 const d=review.K.dbg;d.start(0,'JACK');d.warp('south',7,6,0);d.give({hp:20,maxH:10});
 const a=[];for(let i=0;i<100;i++)review.step(1);for(let i=0;i<1200;i++){const t=performance.now();review.step(1);a.push(performance.now()-t)}a.sort((a,b)=>a-b);
 return{median:a[600],p95:a[1140],max:a[1199],resolution:[256,224],scope:'native update/draw CPU in software Chromium; excludes house'};
})}
try{
 if(!process.argv.includes('--room-only')){
 await makePage();await frames(90);await shot('title');await frames(810);await shot('attract');await key('Enter');await shot('files');await key('z');await shot('name');await key('Enter');await shot('intro');await key('Enter');await text();await shot('home');
 await place('h_home',11,5,1);await key('z');await frames(50);await shot('sword');await text();assert((await state()).S.sword);
 await place('south',6,6,3);const x=(await state()).x;await hold('ArrowRight',20);assert((await state()).x>x+15,'Walking responds');
 await hold('x',62);for(let i=0;i<3;i++){await frames(4);await shot('spin-'+i)}
 await place('village',7,6,0);await shot('village');await key('Enter');await frames(15);await shot('menu');await key('Enter');await key('c');await frames(12);await shot('map');await key('c');
 await place('d1',7,9,1);await text();await shot('keep-start');await place('d6',7,9,1);await frames(100);await shot('cheese');
 if(!before)await chapter();
 const perf=await performanceSample();await writeFile(dir+tag+'-performance.json',JSON.stringify(perf,null,2));console.log('PERFORMANCE',JSON.stringify(perf));
 }
 if(!process.argv.includes('--native'))await roomCheck();
 assert.deepEqual(errors,[],'Browser errors');console.log('ZELDO '+tag.toUpperCase()+' PASS');
}catch(e){if(p&&!p.isClosed()){console.log('FAIL STATE',JSON.stringify(await state()).slice(0,3000));await shot('failure').catch(()=>{});}throw e}finally{await browser.close()}
async function chapter(){
 // The second chapter is a post-credits branch. Seed only the completed first chapter;
 // keep the new dungeon's entire inventory, locks, puzzles, tools and boss unearned.
 await p.evaluate(()=>{const d=review.K.dbg;d.give({done:1,hp:20,maxH:10,sword:1,shield:1,boom:1,bag:1,bombs:10,keys:3,map:1,comp:1,big:1});d.flag('baron',1);d.flag('recipe',1)});
 await place('village',10,9,1);await key('z');await frames(180);await key('z');await text();await frames(40);
 assert.equal((await state()).room,'p_village','Well enters alternate world');await shot('salt-arrival');
 await key('c');await frames(12);await shot('salt-map');await key('c');
 // Walk across an actual scrolling boundary, then restore during its animation.
 await place('p_village',15,6,3);await hold('ArrowRight',15);assert.equal((await state()).mode,'scroll');
 await shot('scroll');await p.evaluate(()=>review.restart());assert.equal((await state()).room,'p_east');assert.equal((await state()).mode,'play');
 await place('p_cliff',7,6,1);await shot('reservoir-exterior');
 await place('r1',7,10,1);await text();assert.equal((await state()).S.keys,0,'Keep keys do not open a second dungeon');assert.equal((await state()).S.big,0);
 await shot('reservoir-start');
 // Capture all level starts and validate every hand-authored map/connection.
 const rooms=await p.evaluate(()=>Object.values(review.K.dbg.ROOMS).filter(r=>r.dg==='reservoir').map(r=>r.id));
 assert.equal(rooms.length,12);
 const outside=await p.evaluate(()=>Object.values(review.K.dbg.ROOMS).filter(r=>r.world==='salt').map(r=>r.id));assert.equal(outside.length,9);for(const id of outside){await place(id,7,6,0);await shot('world-'+id)}
 assert(await p.evaluate(()=>Object.values(review.K.dbg.ROOMS).every(r=>r.map.length===12&&r.map.every(row=>row.length===16))),'Every screen is 16 by 12');
 for(const id of rooms){await place(id,7,10,1);await text();await shot('start-'+id)}
 // Trap treasure: use actual sword inputs; branches place the player near each enemy.
 await place('r3',7,9,1);await frames(1);await fightRoom();await frames(40);
 assert((await state()).S.cleared.r3,'Trap releases on combat clear');await place('r3',7,6,1);await key('z');await text();assert.equal((await state()).S.keys,1);await shot('small-key');
 await place('r2',7,1,1);await hold('ArrowUp',32);await text();assert.equal((await state()).S.keys,0);assert((await state()).S.doors['r2|r5']);
 // Retrieve local map and compass using chest interactions.
 await place('r4',13,3,1);await key('z');await text();assert((await state()).S.map);
 await place('r4',3,10,1);await key('z');await text();assert((await state()).S.comp);await key('c');await frames(12);await shot('reservoir-map');await key('c');
 // The armoury block needs two upward shoves, then a step round its left edge.
 await place('r6',8,9,1);await fightRoom();await walkTo(8,7);await hold('ArrowUp',115);await hold('ArrowLeft',11);await hold('ArrowUp',7);await key('z');await frames(20);await shot('bow-found');await text();
 assert((await state()).S.bow,'Armoury puzzle awards the bow');await shot('bow');
 // Refresh in the item menu keeps selection and freezes enemies.
 await key('Enter');await frames(15);await shot('new-items');const paused=await p.evaluate(()=>review.K.dbg.ents.map(e=>[e.x,e.y]));await frames(120);assert.deepEqual(await p.evaluate(()=>review.K.dbg.ents.map(e=>[e.x,e.y])),paused);
 await p.evaluate(()=>review.restart());assert.equal((await state()).mode,'menu');await key('Enter');
 // Fire over the water at a real arrow-only switch. Before shooting, the bridge is impassable.
 await place('r7',7,7,1);assert.equal(await p.evaluate(()=>review.K.dbg.tileAt(7,3)),'v');await key('v');
 for(let i=0;i<3;i++){await frames(4);await shot('arrow-'+i)}await frames(28);
 assert((await state()).S.f.sluice);assert.equal(await p.evaluate(()=>review.K.dbg.tileAt(7,3)),'=');await shot('sluice');
 await place('r7',7,9,1);await key('z');await text();assert.equal((await state()).S.keys,1);
 await place('r7',7,2,1);await equip('bombs');await key('v');await hold('ArrowDown',32);await frames(100);assert((await state()).S.doors['r7|r8']);await shot('bomb-secret');
 await place('r8',6,5,1);await key('z');await text();assert((await state()).S.opened['r8:6,4']);
 await place('r5',7,1,1);await hold('ArrowUp',32);await text();assert.equal((await state()).S.keys,0);assert((await state()).S.doors['r5|r9']);
 // Twin plates: each block moves two cells. Test halfway through the first shove.
 await place('r10',7,9,1);await fightRoom();await walkTo(3,5);await hold('ArrowDown',27);await p.evaluate(()=>review.restart());await pushUntil(3,8,'ArrowDown');
 await walkTo(11,5);await pushUntil(11,8,'ArrowDown');assert((await state()).S.f.plates_r10,'Both physical blocks lower the gate');
 await walkTo(7,3);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.big);await shot('big-key');
 await place('r9',7,1,1);await hold('ArrowUp',32);await text();assert((await state()).S.doors['r11|r9']);
 await place('r11',7,10,1);await text();await equip('bow');
 let phases=new Set();for(let i=0;i<450;i++){
   const boss=await p.evaluate(()=>{const e=review.K.dbg.ents.find(e=>e.type==='crouton');return e&&{hp:e.hp,st:e.st,tm:e.tm}});
   if(!boss||(await state()).S.f.crouton)break;
   if(!phases.has(boss.st)){phases.add(boss.st);await shot('crouton-'+boss.st)}
   if(boss.hp<=8&&!phases.has('phase2')){phases.add('phase2');await shot('crouton-phase2');await p.evaluate(()=>review.restart());}
   await key('v');await frames(14);
 }
 await text();await frames(140);await text();assert((await state()).S.f.crouton,'Count Crouton defeated with actual bow inputs');assert(phases.has('eye')&&phases.has('dizzy')&&phases.has('phase2'));
 await shot('crouton-defeated');
 await p.evaluate(()=>review.K.dbg.give({maxH:8}));await walkTo(8,9);await hold('ArrowUp',35);await shot('heart-container-found');await text();assert((await state()).S.got.hc_crouton&& (await state()).S.maxH===9,'Boss heart container is collected once');await shot('heart-container');
 await place('r12',7,7,1);await key('z');await frames(20);await shot('ovenheart-found');await text();assert((await state()).S.f.ovenheart);await shot('ovenheart');
 // The forge reward closes this chapter; credits and its continue file survive refresh.
 await place('p_forge',7,6,1);await key('z');await text();await frames(80);assert.equal((await state()).S.sword,2);assert((await state()).S.boots);await shot('second-feast');
 for(let i=0;i<40&&(await state()).mode==='ending';i++){const phase=await p.evaluate(()=>review.K.dbg.ending.phase);if(phase>=2)break;await frames(180);await key('z');}
 await frames(200);await shot('credits');await p.evaluate(()=>review.restart());assert.equal((await state()).mode,'ending');await frames(1400);await shot('results');
 assert((await state()).S.f.secondDone);
 await place('p_shore',10,5,1);await equip('boots');await key('v');await frames(45);assert((await state()).S.gone.p_shore?.includes('10,4'),'Dash breaks the marked tree');await shot('dash-secret');
 // Old dungeon state and old demo saves have survived all chapter transitions.
 await place('d1',7,9,1);await text();assert.equal((await state()).S.keys,3);assert((await state()).S.big);assert.equal(await p.evaluate(()=>review.K.dbg.store.slots[1].name),'DAVE SUX');
 await place('village',7,6,3);await hold('ArrowRight',10);const pose=await state();await reloadCartridge();assert(Math.abs((await state()).x-pose.x)<.01,'Exact standing position restored');
 // A full page reload reconstructs the cartridge from local persistence and pagehide flush.
 assert(pose.S.sword===2);assert(await p.evaluate(()=>JSON.stringify(review.saved.value).length<20000),'Campaign snapshot stays within roaming save size');console.log('CHAPTER PASS: well, scroll restore, local inventory, 12 rooms, combat trap, bow, sluice, bomb secret, twin plates, two-phase boss, forge, ending, dash tree');
}
async function fightRoom(){
 for(let i=0;i<500;i++){
  const target=await p.evaluate(()=>{const d=review.K.dbg,e=d.ents.find(e=>e.enemy&&!e.dead&&e.type!=='spike');return e&&{x:e.x,y:e.y,h:e.h,px:d.pl.x,py:d.pl.y,hp:d.S.hp}});
  if(!target)return;
  assert(target.hp>0,'Combat fixture survived');
  const dx=target.x-target.px,dy=(target.y+12)-target.py;
  if(Math.abs(dx)>8)await hold(dx<0?'ArrowLeft':'ArrowRight',Math.min(7,Math.ceil(Math.abs(dx)/1.45)));
  else if(Math.abs(dy)>5)await hold(dy<0?'ArrowUp':'ArrowDown',Math.min(7,Math.ceil(Math.abs(dy)/1.45)));
  else{await hold('ArrowUp',1);await key('x');await frames(13);}
 }
 throw Error('Combat did not clear');
}

async function walkTo(tx,ty){
 for(let i=0;i<150;i++){
  const next=await p.evaluate(({tx,ty})=>{
   const d=review.K.dbg,pl=d.pl,room=d.room,px=tx*16+8,py=ty*16+12;
   if(Math.abs(pl.x-px)<1.5&&Math.abs(pl.y-py)<1.5)return null;
   const solid=new Set('HTbrXCFSgGhKOxkpcwq#BtQAeaZ13LYJU%~v'.split(''));
   const sx=Math.floor(pl.x/16),sy=Math.floor((pl.y-4)/16),q=[[sx,sy,[]]],seen=new Set([sx+','+sy]);
   for(let k=0;k<q.length;k++){
    const[x,y,path]=q[k];if(x===tx&&y===ty){const[a,b]=path[0]||[tx,ty],gx=a*16+8,gy=b*16+12,dx=gx-pl.x,dy=gy-pl.y;return Math.abs(dx)>1.5?{key:dx<0?'ArrowLeft':'ArrowRight',n:Math.min(6,Math.max(1,Math.round(Math.abs(dx)/1.45)))}:{key:dy<0?'ArrowUp':'ArrowDown',n:Math.min(6,Math.max(1,Math.round(Math.abs(dy)/1.45)))}};
    for(const[a,b]of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])if(a>0&&a<15&&b>0&&b<11&&!solid.has(room.t[b][a])&&!seen.has(a+','+b)){seen.add(a+','+b);q.push([a,b,[...path,[a,b]]]);}
   }throw Error('No path '+JSON.stringify({tx,ty,sx,sy}));
  },{tx,ty});
  if(!next)return;await hold(next.key,next.n);
 }
 throw Error('Walking route stalled '+JSON.stringify(await state()));
}

async function pushUntil(tx,ty,keyName){
 await p.keyboard.down(keyName);
 for(let i=0;i<240;i++){await frames(1);if(await p.evaluate(({tx,ty})=>review.K.dbg.tileAt(tx,ty)==='B',{tx,ty})){await p.keyboard.up(keyName);await frames(1);return;}}
 await p.keyboard.up(keyName);throw Error('Block did not reach plate '+tx+','+ty);
}

async function roomCheck(){
 const account='Zeldo'+Date.now().toString(36),password='Throwaway-1999';
 const registered=await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})});assert(registered.ok);
 const f=await roomFixture(base,{account,password,signup:false,onPage:page=>page.setDefaultTimeout(30000),debug:process.argv.includes('--debug')}),page=f.page;
 try{
  console.log('ROOM: fixture ready');
  if(before)await page.route('**/js/rm-g-zeldo.js*',r=>r.fulfill({body:baseline,contentType:'application/javascript'}));
  await page.evaluate(()=>House.goRoom('cupboard',0));await f.until(()=>!House.gliding);
  await page.evaluate(()=>{House.setWalkFrom({...House.P,lvl:'G',seat:0});House._.setMode('walk')});await playCase(f,'sn.zeldo');
  await page.evaluate(()=>RoomTV.test('sn.zeldo'));await f.until(()=>RoomTV._dbg()?.st==='game'&&!!RoomTV.dbg()?.dbg);
  await f.until(()=>!House.gliding);await page.waitForTimeout(500);await page.screenshot({path:dir+tag+'-in-room-title.png'});
  if(!before)assert(await page.evaluate(()=>RoomTV._dbg().surface&&HouseRooms.rooms.cupboard.cupScreen.material.map.userData.jackLive),'Zeldo renders onto the cupboard telly');
  await page.evaluate(()=>{RoomTV.dbg().dbg.start(0,'JACK');RoomTV.dbg().dbg.warp('village',7,6,0);window.zeldoInstance=RoomTV.dbg()});
  if(before)await page.waitForTimeout(1500);else await f.until(()=>RoomTV.dbg().dbg.fade===0);await page.screenshot({path:dir+tag+'-in-room-game.png'});
  if(process.argv.includes('--bg-only')){
   await page.keyboard.press('q');await f.until(()=>House.mode==='walk'&&!House.gliding);
   const prior=await page.evaluate(()=>({x:House.W.x,z:House.W.z}));console.log('BG SAVED',await page.evaluate(()=>({local:localStorage.getItem('jhp_console_focus'),tab:sessionStorage.getItem('jhp_surface_session')})));
   await page.reload({waitUntil:'domcontentloaded'});
   for(let i=0;i<350;i++){
    const d=await page.evaluate(()=>({allowed:window.AccountGate?.allowed,live:window.House?.live,mode:window.House?.mode,game:window.RoomTV?._dbg(),loading:!!document.querySelector('.hs-loading,#houseEntry'),pm:!!window.PMGL?.built,owned:window.Room?.hasConsole?.('sn'),session:localStorage.getItem('jhp_console_focus')}));
    if(i%25===0)console.log('BG WAIT',d);
    if(d.allowed&&d.live&&d.game?.background&&!d.loading){assert(await page.evaluate(p=>Math.abs(House.W.x-p.x)<1&&Math.abs(House.W.z-p.z)<1,prior));await page.screenshot({path:dir+'after-refresh-background.png'});console.log('BACKGROUND REFRESH PASS');return;}
    await page.waitForTimeout(200);
   }throw Error('Background did not restore');
  }
  await page.keyboard.press('t');assert(await page.evaluate(()=>RoomTV.lockIn()&&RoomTV.dbg()===zeldoInstance));await page.waitForTimeout(250);await page.screenshot({path:dir+tag+'-lock-in.png'});
  await page.keyboard.press('Escape');await f.until(()=>HousePause.open);await page.screenshot({path:dir+tag+'-pause.png'});
  const frame=await page.evaluate(()=>RoomTV.dbg().frame);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>RoomTV.dbg().frame),frame,'House pause freezes cartridge steps');await page.keyboard.press('Escape');await f.until(()=>!HousePause.open);
  if(!before){
   await page.evaluate(()=>{const buttons=Array.from({length:16},()=>({pressed:false,value:0}));window.zeldoPad={id:'Review standard pad',index:0,connected:true,mapping:'standard',buttons,axes:[0,0,0,0]};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[zeldoPad]});RoomTV.dbg().dbg.warp('south',7,6,0);zeldoPad.axes[0]=1;window.zeldoX=RoomTV.dbg().dbg.pl.x;});
   await f.until(()=>GameInput.mode==='gamepad'&&RoomTV.dbg().dbg.pl.x>zeldoX+6);await page.evaluate(()=>{zeldoPad.axes[0]=0;zeldoPad.buttons[9]={pressed:true,value:1}});await f.until(()=>RoomTV.dbg().dbg.mode==='menu');await page.evaluate(()=>{zeldoPad.buttons[9]={pressed:false,value:0}});await page.waitForTimeout(220);await page.evaluate(()=>{zeldoPad.buttons[9]={pressed:true,value:1}});await f.until(()=>RoomTV.dbg().dbg.mode==='play');await page.evaluate(()=>{zeldoPad.buttons[9]={pressed:false,value:0};zeldoPad.connected=false});
  }
  for(const [width,height,name]of [[390,844,'portrait'],[844,390,'landscape'],[1024,768,'tablet'],[1366,860,'desktop']]){
   await page.setViewportSize({width,height});await page.waitForTimeout(250);const r=await page.locator('.rm-tvv.on .rm-glass').boundingBox();assert(r&&Math.abs(r.width/r.height-256/224)<.01&&r.width<=width+1&&r.height<=height+1,'Native screen fits '+name);await page.screenshot({path:dir+tag+'-'+name+'.png'});
  }
  if(!before){
   await page.evaluate(()=>RoomTV.dbg().dbg.warp('village',7,6,0));
   console.log('ROOM: refreshing foreground');
   const file=await page.evaluate(()=>({x:RoomTV.dbg().dbg.pl.x,y:RoomTV.dbg().dbg.pl.y}));
   await page.reload({waitUntil:'domcontentloaded'});await f.until(()=>window.AccountGate?.allowed&&window.House?.live&&window.RoomTV?._dbg()?.st==='game'&&!!RoomTV.dbg()?.dbg&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
   assert(await page.evaluate(file=>RoomTV.lockIn()&&RoomTV.dbg().dbg.room.id==='village'&&Math.abs(RoomTV.dbg().dbg.pl.x-file.x)<.01&&Math.abs(RoomTV.dbg().dbg.pl.y-file.y)<.01,file),'Foreground refresh resumes the same file and LOCK IN');
   await page.evaluate(()=>window.zeldoInstance=RoomTV.dbg());await page.screenshot({path:dir+'after-refresh-running.png'});
   await page.keyboard.press('t');assert(await page.evaluate(()=>!RoomTV.lockIn()&&RoomTV.dbg()===zeldoInstance));await page.keyboard.press('q');await f.until(()=>House.mode==='walk'&&!House.gliding);assert(await page.evaluate(()=>RoomTV._dbg().background&&RoomTV.dbg()===zeldoInstance),'Q keeps the same in-world cartridge running');await page.screenshot({path:dir+tag+'-lean-back.png'});
   console.log('ROOM: refreshing background');
   const pose=await page.evaluate(()=>({x:House.W.x,y:House.P.y,z:House.W.z,power:localStorage.getItem('jhp_off')}));
   await page.reload({waitUntil:'domcontentloaded'});await f.until(()=>window.AccountGate?.allowed&&window.House?.live&&window.RoomTV?._dbg()?.background&&!!RoomTV.dbg()?.dbg&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
   assert(await page.evaluate(p=>House.mode==='walk'&&Math.abs(House.W.x-p.x)<1&&Math.abs(House.W.z-p.z)<1&&localStorage.getItem('jhp_off')===p.power,pose),'Background refresh keeps standing pose and PC power');
   await page.evaluate(()=>window.zeldoInstance=RoomTV.dbg());await page.screenshot({path:dir+'after-refresh-background.png'});
   await page.evaluate(()=>{House.setWalkFrom({...House.P,lvl:'G',seat:0});House._.setMode('walk');House.act('snes')});await f.until(()=>RoomTV.open_&&!House.gliding);assert(await page.evaluate(()=>RoomTV.dbg()===zeldoInstance),'Return keeps instance');
   // The cartridge's optional surface must release cleanly back to the old catalogue.
   await page.locator('.rm-eject').click();await f.until(()=>!HouseCases.busy&&!RoomTV.open_);assert.equal(await page.evaluate(()=>House.THINGS['media.sn.zeldo'].snap),'media.case.sn.zeldo');if(await page.evaluate(()=>!!House.held()))await page.evaluate(()=>House.putBack());await f.until(()=>!House.held());assert(await page.evaluate(()=>House.THINGS['media.box.sn.zeldo'].canGrab()),'Ejected case is carryable');
   // Formula Null now opts into the telly itself; Street Scrapper II still has no screen hook.
   await playCase(f,'sn.fight');await f.until(()=>RoomTV._dbg().st==='game');assert(await page.evaluate(()=>typeof RoomTV.defs['sn.fight']?.screen!=='function'),'sn.fight has no screen hook');assert(await page.evaluate(()=>RoomTV._dbg().surface),'Cartridges without a screen hook use the physical cupboard telly');await page.keyboard.press('Enter');await page.waitForTimeout(200);await page.screenshot({path:dir+'after-shared-unchanged-cartridge.png'});
  }
  assert.deepEqual(f.errors,[],'Room browser errors');console.log(before?'ROOM BASELINE: legacy overlay, LOCK IN and pause':'ROOM PASS: physical telly, same-instance LOCK IN/Q, pause, analog gamepad, four viewports, cartridge change and unchanged Street Scrapper');
 }catch(e){console.log('ROOM FAILURE',await page.evaluate(()=>({mode:House?.mode,pose:{x:House?.P.x,z:House?.P.z,wx:House?.W.x,wz:House?.W.z},glide:House?.gliding,game:window.RoomTV?._dbg(),loading:document.querySelector('.hs-loading')?.innerText,member:AccountGate?.allowed})));await page.screenshot({path:dir+'after-room-failure.png'}).catch(()=>{});throw e;}finally{await f.browser.close()}
 if(!before)await touchCheck(account,password);
}

async function touchCheck(account,password){
 const f=await roomFixture(base,{account,password,signup:false,onPage:page=>page.setDefaultTimeout(30000),touch:true,width:390,height:844}),page=f.page;
 try{
  await page.evaluate(()=>House.goRoom('cupboard',0));await f.until(()=>!House.gliding);await page.evaluate(()=>{House.setWalkFrom({...House.P,lvl:'G',seat:0});House._.setMode('walk')});await playCase(f,'sn.zeldo');await page.evaluate(()=>RoomTV.test('sn.zeldo'));await f.until(()=>RoomTV._dbg()?.st==='game'&&!!RoomTV.dbg()?.dbg);
  await page.evaluate(()=>{RoomTV.dbg().dbg.start(0,'JACK');RoomTV.dbg().dbg.give({sword:1,shield:1});RoomTV.dbg().dbg.warp('south',7,6,3)});
  const control=b=>page.locator('[data-zeldo="'+b+'"]');
  async function press(b){const r=await control(b).boundingBox();assert(r,'Touch button '+b);await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2)}
  await press('lock');await f.until(()=>RoomTV.lockIn());
  const cdp=await page.context().newCDPSession(page),pad=await page.locator('.zeldo-dpad').boundingBox();
  const x=await page.evaluate(()=>RoomTV.dbg().dbg.pl.x);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pad.x+pad.width-12,y:pad.y+pad.height/2,id:1}]});await page.waitForTimeout(220);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert(await page.evaluate(x=>RoomTV.dbg().dbg.pl.x>x+3,x),'Left thumb pad walks');
  await press('start');await f.until(()=>RoomTV.dbg().dbg.mode==='menu');await page.screenshot({path:dir+'after-touch-items.png'});await press('start');await f.until(()=>RoomTV.dbg().dbg.mode==='play');
  await press('x');await f.until(()=>RoomTV.dbg().dbg.mode==='map');await page.waitForTimeout(200);await press('x');await f.until(()=>RoomTV.dbg().dbg.mode==='play');
  for(const [width,height,name]of [[390,844,'portrait'],[844,390,'landscape'],[768,1024,'tablet']]){
   await page.setViewportSize({width,height});await page.waitForTimeout(300);
   const screen=await page.locator('.rm-tvv .rm-glass').boundingBox(),dpad=await page.locator('.zeldo-dpad').boundingBox(),buttons=await page.locator('.zeldo-actions').boundingBox();
   assert(screen&&Math.abs(screen.width/screen.height-256/224)<.01);const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
   assert(!overlaps(screen,dpad)&&!overlaps(screen,buttons),'Controller does not cover game in '+name);assert(screen.width>250,'Readable native screen in '+name);
   await page.screenshot({path:dir+'after-touch-'+name+'.png'});
  }
  assert.deepEqual(f.errors,[]);console.log('TOUCH PASS: thumb drag, item menu, map, LOCK IN, portrait/landscape/tablet, no screen overlap');
 }finally{await f.browser.close()}
}

async function equip(item){
 const items=['boom','bombs','soup','bow','boots'],current=Math.max(0,items.indexOf((await state()).S.sel)),target=items.indexOf(item);
 await key('Enter');await frames(12);
 let row=Math.floor(current/3),col=current%3;const targetRow=Math.floor(target/3);
 if(row!==targetRow){await key(targetRow>row?'ArrowDown':'ArrowUp');row=targetRow;col=Math.min(col,row===1?1:2);}
 const cols=row===1?2:3;for(let i=0,n=(target%3-col+cols)%cols;i<n;i++)await key('ArrowRight');
 await key('z');assert.equal((await state()).S.sel,item,'Item menu equips '+item);await key('Enter');
}
