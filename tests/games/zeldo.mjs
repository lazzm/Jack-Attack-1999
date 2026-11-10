// Disposable localhost cartridge review. Branch placement uses the existing debug API;
// all menu, movement, equipment, puzzle and combat decisions use real browser inputs.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {roomFixture} from '../room-fixture.mjs';
import {playCase,caseEjected} from '../case-actions.mjs';
const base=process.argv.find(x=>/^http:/.test(x));
assert(base&&['localhost','127.0.0.1'].includes(new URL(base).hostname),'Supply a throwaway localhost URL');
const before=process.argv.includes('--before'),tag=before?'before':'after';
assert.equal(await (await fetch(base+'/js/rm-g-zeldo.js')).text(),await readFile(fileURLToPath(new URL('../../app/public/js/rm-g-zeldo.js',import.meta.url)),'utf8'),'Throwaway server must serve this worktree');
const dir=fileURLToPath(new URL('../shots/games/zeldo/',import.meta.url));await mkdir(dir,{recursive:true});
const baseline=before?(process.env.ZELDO_BASELINE?await readFile(process.env.ZELDO_BASELINE,'utf8'):execFileSync('git',['show','HEAD:app/public/js/rm-g-zeldo.js'],{encoding:'utf8'})):null;
let browser;
let p;const errors=[];
async function makePage(){
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
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
async function pressureSample(){return p.evaluate(()=>{
 const a=[];for(let i=0;i<100;i++)review.step(1);for(let i=0;i<1200;i++){const t=performance.now();review.step(1);a.push(performance.now()-t)}a.sort((a,b)=>a-b);
 return{median:a[600],p95:a[1140],max:a[1199],resolution:[256,224],scope:'native active-boss update/draw CPU; tells/projectiles and saves; excludes house'};
})}
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
 if(!before){await legacyCheck();if(!process.argv.includes('--cold-only')){if(!process.argv.includes('--third-only'))await chapter();await thirdCourse();}await coldCourse();if(process.argv.includes('--routes'))await routeCheck();}
 if(!before){await p.evaluate(()=>{const d=review.K.dbg;d.flag('stockpot',0);delete d.S.cleared.t11;d.give({hp:20,maxH:10});});await place('t11',7,9,1);await text();const pressure=await pressureSample();assert.equal((await state()).mode,'play','Pressure timing measures active play');assert(await p.evaluate(()=>review.K.dbg.ents.some(e=>e.type==='stockpot'&&!e.dead)),'Pressure timing retains the active boss');await writeFile(dir+'after-pressure-performance.json',JSON.stringify(pressure,null,2));console.log('PRESSURE PERFORMANCE',JSON.stringify(pressure));}
 const perf=await performanceSample();await writeFile(dir+tag+'-performance.json',JSON.stringify(perf,null,2));console.log('PERFORMANCE',JSON.stringify(perf));
 }
 // The native runner and the full-house fixture must never hold two browsers.
 await browser?.close();browser=null;
 if(!process.argv.includes('--native'))await roomCheck();
 assert.deepEqual(errors,[],'Browser errors');console.log('ZELDO '+tag.toUpperCase()+' PASS');
}catch(e){if(p&&!p.isClosed()){console.log('FAIL STATE',JSON.stringify(await state()).slice(0,3000));await shot('failure').catch(()=>{});}throw e}finally{await browser?.close()}

async function coldCourse(){
 await p.evaluate(()=>{const d=review.K.dbg;d.give({sword:2,shield:2,boots:1,hook:1,boom:1,bag:1,bombs:10,bow:1,hp:24,maxH:12,gems:300,done:1});for(const k of ['baron','recipe','second','secondDone','secondCredits','stockpot','tidebell'])d.flag(k,1)});
 await place('q_beacon',7,1,3);await hold('ArrowRight',15);await frames(45);assert.equal((await state()).room,'k_gate','Actual north-wall passage leads to the Cold Pantry region');await key('c');await key('c');await frames(10);assert.equal((await state()).mode,'play','A second MAP edge during opening is retained');
 const counts=await p.evaluate(()=>Object.values(review.K.dbg.ROOMS).reduce((o,r)=>{o[r.kind]=(o[r.kind]||0)+1;return o},{}));assert.equal(counts.ow,30);assert.equal(counts.dg,50);assert.equal((counts.in||0)+(counts.cv||0),17);console.log('SCOPE COUNTS',JSON.stringify(counts));
 const worlds=await p.evaluate(()=>Object.entries(review.K.dbg.ROOMS).filter(([id,r])=>r.world==='pantry').map(([id])=>id));assert.equal(worlds.length,6);
 for(const id of worlds){await place(id,7,9,1);await shot('cold-world-'+id)}
 await place('k_flue',7,7,1);await equip('hook');await key('v');await frames(40);assert((await state()).y>80,'Bread bridge remains closed before the starter');await hold('ArrowUp',50);await frames(10);assert.equal((await state()).room,'k_flue');assert((await state()).y>80,'Walking cannot bypass the bread shutter');await hold('ArrowUp',50);await frames(10);assert.equal((await state()).room,'k_flue');assert((await state()).y>80,'Walking cannot bypass the bread shutter');
 await place('f1',7,10,1);await text();assert.equal((await state()).S.keys,0);assert.equal((await state()).S.map,0);assert.equal((await state()).S.big,0);assert(!(await state()).S.puzzles);
 const rooms=await p.evaluate(()=>Object.entries(review.K.dbg.ROOMS).filter(([id,r])=>r.dg==='pantry').map(([id])=>id));assert.equal(rooms.length,14);
 assert(await p.evaluate(()=>Object.values(review.K.dbg.ROOMS).every(r=>r.map.length===12&&r.map.every(row=>row.length===16))),'Every room has the exact native grid');
 for(const id of rooms){await place(id,7,10,1);await text();await shot('cold-start-'+id)}
 await place('f3',7,9,1);await fightRoom();await frames(40);await walkTo(7,6);await hold('ArrowUp',1);await key('z');await text();assert.equal((await state()).S.keys,1);
 await place('f4',1,6,3);await walkTo(12,3);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.map);
 await place('f2',7,1,1);await hold('ArrowUp',32);await frames(45);assert.equal((await state()).room,'f5');assert.equal((await state()).S.keys,0);
 await place('f6',7,4,0);await p.keyboard.down('ArrowDown');for(let i=0;i<60;i++){await frames(1);if(await p.evaluate(()=>review.K.dbg.ents.some(e=>e.type==='block')))break;}await p.keyboard.up('ArrowDown');
 assert(await p.evaluate(()=>review.K.dbg.ents.some(e=>e.type==='block'&&e.duration>16)),'A storage weight slides more than one square');
 await key('Enter');await frames(15);const glide=await p.evaluate(()=>review.K.dbg.ents.find(e=>e.type==='block'));await p.evaluate(()=>review.restart());assert.equal((await state()).mode,'menu');assert.equal(await p.evaluate(()=>review.K.dbg.ents.find(e=>e.type==='block').y),glide.y,'Mid-slide refresh preserves the exact weight');await key('Enter');await frames(65);
 assert((await state()).S.dungeons.pantry.puzzles.plates_f6);await shot('cold-sliding-weight');await walkTo(7,3);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.caster);assert.equal((await state()).S.sel,'caster');await shot('cayenne-caster');
 await place('f7',7,7,1);await key('v');await key('v');await key('v');assert.equal(await p.evaluate(()=>review.K.dbg.pl.actionQueue.y),1,'Distinct rapid ITEM edges queue individually');for(let i=0;i<15;i++){if(await p.evaluate(()=>review.K.dbg.tileAt(7,4)==='.'))break;await frames(1);}assert(await p.evaluate(()=>!review.saved.value.live.ents.some(e=>e.type==='heat')),'The melt save consumes its puff atomically');let launches=0;for(let i=0;i<80;i++){await frames(1);if(await p.evaluate(()=>review.K.dbg.ents.some(e=>e.type==='heat'&&e.t===1)))launches++;}assert.equal(launches,2,'Both queued ITEM edges fire after the first puff');assert.equal(await p.evaluate(()=>review.K.dbg.tileAt(7,4)),'.','Buffered hot puff melts sugar ice');assert((await state()).S.dungeons.pantry.puzzles.thaw,'Second ITEM edge lights the pan through the melted passage');await shot('cold-first-flue');
 await p.evaluate(()=>review.restart());assert((await state()).S.dungeons.pantry.puzzles.thaw,'Warm flue persists on refresh');
 await place('f1',14,6,3);await equip('bombs');await key('v');await hold('ArrowLeft',30);await frames(110);assert((await state()).S.doors['f1|f14']);await place('f14',13,5,1);await equip('caster');await key('v');await frames(35);await walkTo(13,3);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.comp);await key('c');await frames(12);await shot('cold-map');await key('c');
 await place('f8',7,3,1);await key('v');await frames(45);assert(!(await state()).S.dungeons.pantry.puzzles.foil,'Wrong foil orientation does not light the remote pan');await key('z');assert.equal(await p.evaluate(()=>review.K.dbg.tileAt(7,2)),'/');await key('v');await frames(5);await shot('cold-foil-turn');await key('Enter');await frames(15);const beam=await p.evaluate(()=>review.K.dbg.ents.find(e=>e.type==='heat'));assert(beam,'Heat is saved in flight');await p.evaluate(()=>review.restart());assert.deepEqual(await p.evaluate(()=>{const e=review.K.dbg.ents.find(e=>e.type==='heat');return[e.x,e.y,e.dir]}),[beam.x,beam.y,beam.dir]);await key('Enter');await frames(45);assert((await state()).S.dungeons.pantry.puzzles.foil);await walkTo(3,3);await hold('ArrowUp',1);await key('z');await text();assert.equal((await state()).S.keys,1);await shot('cold-foil-key');
 await place('f8',1,6,2);await hold('ArrowLeft',35);await frames(45);assert.equal((await state()).room,'f9');assert.equal((await state()).S.keys,0);
 await place('f9',3,6,1);await key('v');await frames(30);assert((await state()).S.dungeons.pantry.puzzles.return);await place('f9',7,10,0);await hold('ArrowDown',25);await frames(45);assert.equal((await state()).room,'f5','Thermal return shortcut connects the upper vault to the hub');
 await place('f10',13,6,2);await fightRoom();await walkTo(3,6);await pushUntil(3,9,'ArrowDown');await walkTo(11,6);await pushUntil(11,9,'ArrowDown');assert((await state()).S.dungeons.pantry.puzzles.plates_f10);await walkTo(7,6);await equip('hook');await hold('ArrowUp',1);await key('v');await frames(40);assert((await state()).y>80,'An icy landing refuses the spork before warming');await equip('caster');await key('v');await frames(40);assert.equal(await p.evaluate(()=>review.K.dbg.tileAt(7,3)),'.');await equip('hook');await key('v');await frames(40);assert.equal(Math.round((await state()).y),60,'Warm landing accepts the spork');await walkTo(8,2);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.big);await shot('cold-big-key');await walkTo(7,3);await hold('ArrowDown',1);await key('v');await frames(40);assert.equal(Math.round((await state()).y),140,'Big-key shelf has a usable return ring');
 await place('f10',7,1,1);await equip('bombs');await key('v');await hold('ArrowRight',30);await frames(110);assert((await state()).S.doors['f10|f13']);
 await place('f13',3,3,1);await key('z');await place('f13',11,2,2);await key('z');await place('f13',3,8,1);await equip('caster');await key('v');await frames(60);assert((await state()).S.dungeons.pantry.puzzles.double,'Two foil turns heat the sealed pan');await shot('cold-double-fold');await walkTo(7,6);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.opened['f13:7,5']);
 await place('f9',7,1,1);await hold('ArrowUp',32);await frames(45);await text();assert.equal((await state()).room,'f11');assert((await state()).S.doors['f11|f9']);await place('f11',7,9,1);await text();await equip('caster');
 const phases=new Set();let thawRefreshed=false,phaseRefreshed=false;
 for(let i=0;i<850;i++){
  const boss=await p.evaluate(()=>{const e=review.K.dbg.ents.find(e=>e.type==='glace');return e&&{st:e.st,hp:e.hp,tm:e.tm,aimX:e.aimX,thaw:e.thaw}});if(!boss||(await state()).S.f.glace)break;
  if(!phases.has(boss.st)){phases.add(boss.st);await shot('glace-'+boss.st)}
  if(boss.hp<=10&&!phases.has('phase2')){phases.add('phase2');await shot('glace-double-scoop')}
  if(boss.st==='dizzy'){const s=await state();if(s.y>104)await hold('ArrowUp',Math.min(12,Math.ceil((s.y-100)/1.45)));else{await hold('ArrowUp',1);await key('x');await frames(15)}}
  else if(boss.st==='vent'){
   const s=await state();if(Math.abs(s.x-128)>3)await hold(s.x<128?'ArrowRight':'ArrowLeft',Math.min(12,Math.ceil(Math.abs(s.x-128)/1.45)));
   else {if(boss.thaw===1&&!thawRefreshed){await key('Enter');await frames(12);await p.evaluate(()=>review.restart());assert.equal(await p.evaluate(()=>review.K.dbg.ents.find(e=>e.type==='glace').thaw),1);await key('Enter');thawRefreshed=true;}await hold('ArrowUp',1);await key('v');await frames(13)}
  }else if(boss.st==='wind'&&boss.tm<=52&&boss.tm>20){const s=await state();await hold(s.x<128?'ArrowLeft':'ArrowRight',36)}
  else {if(boss.hp<=10&&!phaseRefreshed){await key('Enter');await frames(12);await p.evaluate(()=>review.restart());await key('Enter');phaseRefreshed=true;}await frames(8)}
  assert((await state()).S.hp>0,'Learned tells can be dodged without health resets');
 }
 await text();assert((await state()).S.f.glace,'Grand Glace defeated using heat then sword');for(const phase of ['wind','pour','vent','dizzy','phase2'])assert(phases.has(phase),'Boss phase '+phase);assert(thawRefreshed&&phaseRefreshed,'Boss refresh checks ran');
 await p.evaluate(()=>review.K.dbg.give({maxH:10,hp:12}));await place('f11',7,8,1);await hold('ArrowUp',16);await text();assert((await state()).S.got.hc_glace);assert.equal((await state()).S.maxH,11);await shot('cold-heart-container');
 await place('f11',14,6,3);await hold('ArrowRight',25);await frames(45);assert.equal((await state()).room,'f12','Defeated boss opens the actual shrine doorway');await walkTo(7,7);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.f.starter);await shot('living-starter');await place('k_bake',7,6,1);await key('z');await text();assert.equal((await state()).S.sword,3);assert((await state()).S.f.coldDone);await shot('smoulder-blade');
 await place('q_reeds',2,3,3);await equip('caster');await key('v');await frames(20);assert.equal(await p.evaluate(()=>review.K.dbg.tileAt(3,3)),'@');await hold('ArrowRight',12);await frames(40);assert.equal((await state()).room,'k_cave_lid');await place('k_cave_lid',7,4,1);await key('z');await text();assert((await state()).S.f.lid);await place('k_bake',7,6,1);await key('z');await text();assert.equal((await state()).S.flask,2);await shot('second-soup-flask');
 await p.evaluate(()=>review.K.dbg.give({bottle:2,hp:2}));await equip('soup');await key('v');await text();assert.equal((await state()).S.bottle,1);assert.equal((await state()).S.flask,2);await p.evaluate(()=>review.K.dbg.give({hp:2}));await key('v');await text();assert.equal((await state()).S.flask,1);await p.evaluate(()=>review.restart());assert.equal((await state()).S.bottle,1);assert.equal((await state()).S.flask,1,'Refresh never refills a flask');
 for(let i=0;i<2;i++){await place('k_shop',7,7,1);const gems=(await state()).S.gems;await key('z');await text();assert.equal((await state()).S.gems,gems-20,'Each separate soup refill costs twenty gems');assert.equal((await state()).S.bottle,2);assert.equal((await state()).S.flask,i?2:1);}const fullGems=(await state()).S.gems;await key('z');await text();assert.equal((await state()).S.gems,fullGems,'Full vessels cannot be charged for another refill');
 await place('k_bake',7,6,1);const reward=await state();await key('z');await text();assert.equal((await state()).S.score,reward.S.score,'Baker rewards cannot repeat');assert.equal((await state()).S.sword,3);

 for(const[id,tx,ty,dir,ix,iy,cave]of [['p_forest',8,2,3,9,2,'k_cave_leaf'],['p_grave',11,2,1,11,0,'k_cave_salt']]){await place(id,tx,ty,dir);if(id==='p_grave'){await key('z');await frames(14);await key('z');await frames(25);await walkTo(11,1);await hold('ArrowUp',1);}await equip('caster');await key('v');await frames(20);assert.equal(await p.evaluate(({ix,iy})=>review.K.dbg.tileAt(ix,iy),{ix,iy}),'@');await hold(dir===3?'ArrowRight':'ArrowUp',12);await frames(40);assert.equal((await state()).room,cave);await place(cave,7,4,1);await key('z');await text();assert((await state()).S.opened[cave+':7,3']);await shot('heat-secret-'+cave);await key('c');await frames(12);await shot('heat-secret-map-'+cave);await key('c')}
 await place('k_orchard',13,4,1);await key('v');await frames(25);await walkTo(13,2);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.opened['k_orchard:13,1']);
 await place('k_flue',7,5,1);assert.equal(await p.evaluate(()=>review.K.dbg.tileAt(7,4)),'=');await hold('ArrowUp',65);await frames(45);assert.equal((await state()).room,'k_rise','Raised bread bridge reaches the onward region');await shot('rising-road');await place('k_post',7,6,1);await key('z');await text();await frames(45);assert.equal((await state()).room,'village');assert((await state()).S.f.breadLift);
 await place('village',14,10,1);await key('z');await text();await frames(45);assert.equal((await state()).room,'k_rise','Bread lift shortcut works back from daylight');await key('c');await frames(12);await shot('cold-region-map');await key('c');
 // Walk real thresholds on the designed circulation loop, including both secret branches and the outdoor return.
 for(const[from,x,y,keyName,to]of [['f1',7,10,'ArrowDown','k_shelves'],['k_shelves',7,4,'ArrowUp','f1'],['f1',14,6,'ArrowRight','f14'],['f14',1,6,'ArrowLeft','f1'],['f1',7,1,'ArrowUp','f2'],['f2',1,6,'ArrowLeft','f3'],['f3',14,6,'ArrowRight','f2'],['f2',14,6,'ArrowRight','f4'],['f4',1,6,'ArrowLeft','f2'],['f2',7,1,'ArrowUp','f5'],['f5',1,6,'ArrowLeft','f6'],['f6',14,6,'ArrowRight','f5'],['f5',14,6,'ArrowRight','f7'],['f7',7,1,'ArrowUp','f8'],['f8',1,6,'ArrowLeft','f9'],['f9',7,10,'ArrowDown','f5'],['f5',7,1,'ArrowUp','f9'],['f9',1,6,'ArrowLeft','f10'],['f10',7,1,'ArrowUp','f13'],['f13',7,10,'ArrowDown','f10']]){await place(from,x,y,0);await hold(keyName,35);await frames(50);assert.equal((await state()).room,to,'Cold doorway '+from+' -> '+to);}
 await place('f1',7,10,1);assert((await state()).S.big&&(await state()).S.map&&(await state()).S.comp);assert.equal((await state()).S.keys,0);await key('Enter');await frames(15);await shot('cold-complete-kit');await key('Enter');await place('f11',7,9,1);assert.equal(await p.evaluate(()=>review.K.dbg.song),'pantry','Cleared boss room returns to exploration music');await p.evaluate(()=>review.restart());assert.equal(await p.evaluate(()=>review.K.dbg.song),'pantry','Cleared boss music remains correct after refresh');
 await p.evaluate(()=>{const d=review.K.dbg;d.flag('glace',0);delete d.S.cleared.f11;d.give({hp:24,maxH:12})});await place('f11',7,9,1);await text();const perf=await pressureSample();assert.equal((await state()).mode,'play');assert(await p.evaluate(()=>review.K.dbg.ents.some(e=>e.type==='glace'&&!e.dead)));await writeFile(dir+'after-cold-performance.json',JSON.stringify(perf,null,2));console.log('COLD PERFORMANCE',JSON.stringify(perf));
 console.log('COLD PASS: 14 rooms, six overworld screens, sliding weights, queued heat, foil, mid-flight saves, spork combination, boss tells and phase refresh, reward, four pieces, second flask and onward bread lift');
}
async function thirdCourse(){
 // Seed only the completed forge chapter; every new key, tool, puzzle and reward starts unearned.
 await p.evaluate(()=>{const d=review.K.dbg;d.give({sword:2,shield:1,boots:1,boom:1,bag:1,bombs:10,hp:20,maxH:10,done:1});for(const k of ['baron','recipe','second','secondDone','secondCredits'])d.flag(k,1)});
 const oldInventory=(await state()).S.activeDg;
 await place('p_shore',14,5,3);await equip('boots');await key('v');await frames(35);
 assert((await state()).S.gone.p_shore.includes('15,5'),'Boots open the new shore route');await shot('quay-road-open');
 await place('p_shore',14,5,3);await hold('ArrowRight',30);await frames(50);assert.equal((await state()).room,'q_moor','Actual shore boundary reaches new region');
 const outside=await p.evaluate(()=>Object.values(review.K.dbg.ROOMS).filter(r=>r.world==='salt'));assert.equal(outside.length,15);
 for(const r of outside.filter(r=>r.id.startsWith('q_'))){await place(r.id,8,10,1);await shot('quay-'+r.id)}
 await place('q_mender',7,6,1);await key('z');await text();assert((await state()).S.f.menderQuest,'Optional quest accepted');
 await place('t1',7,10,1);await text();assert.equal((await state()).S.keys,0,'Third dungeon starts with its own keys');assert.equal((await state()).S.map,0);assert.equal((await state()).S.big,0);assert(!(await state()).S.puzzles,'Dungeon puzzles never leak into global inventory');
 const rooms=await p.evaluate(()=>Object.values(review.K.dbg.ROOMS).filter(r=>r.dg==='pumpworks').map(r=>r.id));assert.equal(rooms.length,13);
 assert(await p.evaluate(()=>Object.values(review.K.dbg.ROOMS).every(r=>r.map.length===12&&r.map.every(row=>row.length===16))),'All authored rooms retain exact native grid');
 for(const id of rooms){await place(id,7,10,1);await text();await shot('pump-start-'+id)}
 await place('t3',7,9,1);await fightRoom();await frames(35);await walkTo(7,6);await hold('ArrowUp',1);await key('z');await text();assert.equal((await state()).S.keys,1);await shot('pump-small-key');
 await place('t4',3,3,1);await key('z');await text();await place('t4',12,3,1);await key('z');await text();assert((await state()).S.map&&(await state()).S.comp);
 await key('c');await frames(12);await shot('pump-map');await key('c');
 await place('t2',7,1,1);await hold('ArrowUp',32);await text();assert.equal((await state()).S.keys,0);assert((await state()).S.doors['t2|t5']);
 // Counterweight lesson: hold a physical block onto a floor plate, then enter its little vault.
 await place('t6',7,6,0);await pushUntil(7,9,'ArrowDown');assert((await state()).S.dungeons.pumpworks.puzzles.plates_t6);await walkTo(7,4);await hold('ArrowUp',1);await key('z');await frames(30);await shot('spool-spork-found');await text();assert((await state()).S.hook);assert.equal((await state()).S.sel,'hook');
 // A missed shot retracts, and a second ITEM edge near its end survives the animation.
 await place('t7',10,8,1);await key('v');await frames(9);await key('v');await frames(35);assert.equal((await state()).act,'grapple','Second ITEM edge buffers through retraction');await frames(45);assert.equal((await state()).act,null,'Missed hook returns control');
 await place('t7',6,7,1);await key('v');await frames(6);await shot('spork-extension');
 for(let i=0;i<30;i++){if(await p.evaluate(()=>review.K.dbg.pl.hook?.stage==='pull'))break;await frames(1)}
 assert(await p.evaluate(()=>review.K.dbg.pl.hook?.stage==='pull'),'Spork latches to brass mooring');await frames(2);const mid=await state();await key('Enter');await frames(15);const stopped=await state();await shot('spork-paused');await p.evaluate(()=>review.restart());assert.equal((await state()).mode,'menu');assert.equal((await state()).y,stopped.y,'Midair reel stays at its exact saved point');await key('Enter');await frames(25);assert.equal(Math.round((await state()).y),76,'Reel reaches the north landing after refresh');await shot('spork-north-landing');
 await walkTo(4,3);await hold('ArrowLeft',1);await key('v');await frames(35);assert((await state()).S.dungeons.pumpworks.puzzles.lower,'Forked handle fills the lower lift');assert.equal(await p.evaluate(()=>review.K.dbg.tileAt(7,5)),'=');await shot('lower-floodgate');
 await walkTo(7,3);await hold('ArrowUp',24);await frames(50);assert.equal((await state()).room,'t8','Raised lift leads to the upper spillway');
 await place('t8',6,7,1);await key('v');await frames(35);assert.equal(Math.round((await state()).y),76);await walkTo(3,4);await hold('ArrowUp',1);await key('z');await text();assert.equal((await state()).S.keys,1);await shot('upper-key');
 await walkTo(6,4);await hold('ArrowDown',1);await key('v');await frames(35);assert.equal(Math.round((await state()).y),124,'Return ring prevents a stranded upper ledge');
 await walkTo(1,6);await hold('ArrowLeft',35);await frames(50);assert.equal((await state()).room,'t9');assert.equal((await state()).S.keys,0,'Upper spillway key pays for its own lock');
 await place('t9',3,6,1);await key('v');await frames(30);assert((await state()).S.dungeons.pumpworks.puzzles.upper,'Upper handle opens a lower return shortcut');await shot('upper-shortcut');await walkTo(7,9);await hold('ArrowDown',20);await frames(40);assert.equal((await state()).room,'t5','Return stair descends to the lower landing');await shot('pump-return-stairs');await hold('ArrowUp',20);await frames(40);assert.equal((await state()).room,'t9','Earned stair shortcut works back up to the upper floor');
 // Heavy counterweights gate the grapple to the big-key island.
 await place('t10',13,6,2);await fightRoom();await walkTo(3,7);await pushUntil(3,9,'ArrowDown');await walkTo(11,7);await pushUntil(11,9,'ArrowDown');assert((await state()).S.dungeons.pumpworks.puzzles.plates_t10);
 await walkTo(7,7);await hold('ArrowUp',1);await key('v');await frames(35);assert.equal(Math.round((await state()).y),76);await walkTo(8,3);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.big);await shot('pump-big-key');
 await walkTo(7,4);await hold('ArrowDown',1);await key('v');await frames(35);assert.equal(Math.round((await state()).y),140,'Loft has a usable return ring');
 await place('t10',7,1,1);await equip('bombs');await key('v');await hold('ArrowRight',35);await frames(100);assert((await state()).S.doors['t10|t13']);await place('t13',7,6,1);await key('z');await text();assert((await state()).S.opened['t13:7,5']);await shot('pump-dry-attic');
 // The onward route cannot be crossed before the bell, even with the spork.
 await place('q_steps',7,7,1);await equip('hook');await key('v');await frames(35);assert((await state()).y>110,'Unraised flood shutter stops the hook');
 await place('t9',7,1,1);await hold('ArrowUp',30);await frames(45);await text();assert((await state()).S.doors['t11|t9']);
 await place('t11',7,9,1);await text();await equip('hook');
 const phases=new Set();let refreshed=false;
 for(let i=0;i<700;i++){
  const boss=await p.evaluate(()=>{const e=review.K.dbg.ents.find(e=>e.type==='stockpot');return e&&{st:e.st,hp:e.hp,tm:e.tm,aimX:e.aimX}});
  if(!boss||(await state()).S.f.stockpot)break;
  if(!phases.has(boss.st)){phases.add(boss.st);await shot('stockpot-'+boss.st)}
  if(boss.hp<=8&&!phases.has('phase2')){phases.add('phase2');await shot('stockpot-full-boil')}
  if(boss.st==='dizzy'){
    const s=await state();if(s.y>109)await hold('ArrowUp',Math.min(10,Math.ceil((s.y-104)/1.45)));else{await hold('ArrowUp',1);await key('x');await frames(14)}
  }else if(boss.st==='vent'){
    const s=await state();if(Math.abs(s.x-128)>3)await hold(s.x<128?'ArrowRight':'ArrowLeft',Math.min(12,Math.ceil(Math.abs(s.x-128)/1.45)));
    else {if(!refreshed){await p.evaluate(()=>review.restart());refreshed=true;}await hold('ArrowUp',1);await key('v');await frames(10);}
  }else{
    const s=await state();if(s.y<140)await hold('ArrowDown',12);
    else if(boss.st==='wind'&&boss.tm<=48&&Math.abs(s.x-boss.aimX)<25)await hold(s.x>150?'ArrowLeft':'ArrowRight',25);
    else await frames(12);
  }
  assert((await state()).S.hp>0,'Fair boss fixture survives learned tells');
 }
 await text();await frames(130);await text();assert((await state()).S.f.stockpot,'Admiral defeated with spork and sword inputs');for(const phase of ['wind','steam','vent','dizzy','phase2'])assert(phases.has(phase),'Boss phase '+phase);await shot('stockpot-defeated');
 await p.evaluate(()=>review.K.dbg.give({maxH:8}));await place('t11',8,8,1);await hold('ArrowUp',14);await frames(40);await text();assert((await state()).S.got.hc_stockpot);assert.equal((await state()).S.maxH,9);await shot('pump-heart-container');
 await place('t12',7,7,1);await key('z');await text();assert((await state()).S.f.tidebell);await shot('tidebell');
 await place('q_steps',7,7,1);await key('v');await frames(35);assert.equal(Math.round((await state()).y),92,'Raised stairs allow spork to the upper route');await shot('high-water-route');await walkTo(8,2);await hold('ArrowUp',40);await frames(50);assert.equal((await state()).room,'q_beacon');await shot('cooler-road-arrival');
 await place('q_ferry',7,6,1);await key('z');await text();await frames(40);assert.equal((await state()).room,'village');assert((await state()).S.f.ferry,'Onward road unlocks the daylight ferry shortcut');await place('village',14,10,1);await key('z');await text();await frames(40);assert.equal((await state()).room,'q_beacon','Unlocked ferry works in both directions');
 // Optional town chain crosses both old worlds; each return island has an explicit escape ring.
 await place('p_lake',3,10,1);await key('v');await frames(40);await text();assert.equal(Math.round((await state()).y),92);await walkTo(4,7);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.f.spindle);await shot('brinewater-spindle');
 await walkTo(4,7);await hold('ArrowRight',1);await key('v');await frames(35);assert.equal(Math.round((await state()).x),104,'Brinewater island has a return mooring');
 await place('q_mender',7,6,1);await key('z');await text();assert((await state()).S.f.menderFit);await place('p_forge',7,6,1);await key('z');await text();assert((await state()).S.f.washer);
 await place('q_mender',7,6,1);await key('z');await text();assert((await state()).S.f.menderDone);assert.equal((await state()).S.shield,2);const reward={pieces:(await state()).S.pieces,gems:(await state()).S.gems};await p.evaluate(()=>review.restart());await key('z');await text();assert.deepEqual({pieces:(await state()).S.pieces,gems:(await state()).S.gems},reward,'Quest rewards are atomic and cannot repeat');await shot('mender-reward');
 await place('forest',12,6,1);await key('v');await frames(35);assert.equal(Math.round((await state()).y),76);await walkTo(13,4);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.opened['forest:13,3']);await shot('old-forest-spork-secret');await walkTo(12,4);await hold('ArrowDown',1);await key('v');await frames(35);assert.equal(Math.round((await state()).y),124);
 await place('p_grave',7,8,3);await key('v');await frames(35);assert.equal(Math.round((await state()).x),152);await walkTo(11,9);await hold('ArrowUp',1);await key('z');await text();assert((await state()).S.opened['p_grave:11,8']);await shot('salt-flats-spork-secret');
 await place('q_quay',8,7,1);await key('c');await frames(12);await shot('expanded-salt-map');await key('c');
 await reloadCartridge();assert.equal((await state()).room,'q_quay');assert((await state()).S.hook&&(await state()).S.f.tidebell);assert((await state()).S.dungeons.pumpworks.puzzles.lower&&(await state()).S.dungeons.pumpworks.puzzles.upper);assert(await p.evaluate(()=>JSON.stringify(review.saved.value).length<20000),'Three-chapter save fits roaming record');
 console.log('THIRD COURSE PASS: 13 rooms, 24 outdoor screens, local inventory, counterweights, grapple/pause/refresh, both floodgates, return moorings, boss tells/two phases/container, Tidebell stairs, ferry, three old-world secrets, atomic town quest');
}

async function routeCheck(){
 // Check real door mouths too: debug room starts alone cannot catch a bad bank/entry alcove.
 async function cross(id,x,y,direction,to,bank=false){
  const dir={ArrowUp:1,ArrowDown:0,ArrowLeft:2,ArrowRight:3}[direction];await place(id,x,y,dir);await text();await hold(direction,22);await frames(50);assert.equal((await state()).room,to,id+' doorway reaches '+to);
  if(bank){await hold(direction,14);assert((await state()).y>=90,'Door mouth stays on the lower bank of '+to);}
 }
 await cross('d1',7,10,'ArrowDown','cliff');await cross('r1',7,10,'ArrowDown','p_cliff');
 await place('q_tower',7,3,1);await hold('ArrowUp',20);await frames(50);assert.equal((await state()).room,'t1','Physical tower cave enters the low-tide door');
 await cross('t1',7,10,'ArrowDown','q_tower');
 await cross('t1',7,1,'ArrowUp','t2');
 await cross('t2',1,6,'ArrowLeft','t3');await cross('t3',14,6,'ArrowRight','t2');
 await cross('t2',14,6,'ArrowRight','t4');await cross('t4',1,6,'ArrowLeft','t2');
 await cross('t2',7,1,'ArrowUp','t5');
 await cross('t5',1,6,'ArrowLeft','t6');await cross('t6',14,6,'ArrowRight','t5');
 await cross('t5',14,6,'ArrowRight','t7',true);
 await place('t8',7,9,0);await hold('ArrowDown',20);await frames(50);assert.equal((await state()).room,'t7','A stair descends from upper spillway to the lower lift');
 await cross('t9',14,6,'ArrowRight','t8',true);
 await cross('t9',1,6,'ArrowLeft','t10',true);
 await cross('t10',7,1,'ArrowUp','t13');await cross('t13',7,10,'ArrowDown','t10');
 await cross('t11',14,6,'ArrowRight','t12');await walkTo(7,7);await shot('pump-shrine-door-route');
 await cross('t12',1,6,'ArrowLeft','t11');
 console.log('ROUTES PASS: real cave/exit, all side branches, lower-bank door alcoves, A/B stairs, attic and boss shrine');
}

async function legacyCheck(){
 await place('village',7,6,0);
 const old=await p.evaluate(()=>{const d=review.K.dbg;d.store.slots[1].name='DAVE SUX';const old=JSON.stringify(d.store.slots[1]);for(const k of ['caster','flask','hook','bow','boots','dungeons','activeDg','terrainRev'])delete d.S[k];d.flush();delete d.store.live.mapRevision;review.K.save(d.store);return {old,name:d.S.name,gems:d.S.gems,x:d.pl.x,y:d.pl.y}});
 await p.evaluate(()=>review.restart());const s=await state();assert.equal(s.S.name,old.name);assert.equal(s.S.gems,old.gems);assert.equal(s.x,old.x);assert.equal(s.y,old.y);assert.equal(s.S.hook,0);assert.equal(s.S.caster,0);assert.equal(s.S.flask,0);assert.equal(s.S.activeDg,'keep');assert.deepEqual(s.S.dungeons,{});
 assert.equal(await p.evaluate(()=>JSON.stringify(review.K.dbg.store.slots[1])),old.old,'Inactive legacy file names, balances and saves survive migration');
 for(const [id,x,y,sx,sy]of [['forest',12,4,200,108],['p_grave',10,9,120,140]]){
  await place(id,x,y,0);const before=await state();
  await p.evaluate(()=>{const d=review.K.dbg;delete d.S.terrainRev;d.flush();delete d.store.live.mapRevision;review.K.save(d.store);review.restart()});
  const moved=await state();assert.equal(moved.room,id);assert.equal(moved.x,sx,'Old '+id+' island position moves to its mainland');assert.equal(moved.y,sy);assert.equal(moved.S.gems,before.S.gems);assert.equal(moved.S.hp,before.S.hp);assert.equal(moved.S.sword,before.S.sword);assert.equal(moved.S.hook,0);
  await p.evaluate(()=>review.restart());assert.equal((await state()).x,sx,'Terrain migration runs once');assert.equal((await state()).y,sy);
 }
 // An old six-tool save used row 2 for CARRY ON/SAVE/QUIT; the seventh tool adds a row.
 await place('village',7,6,0);await key('Enter');await frames(12);await p.evaluate(()=>{const d=review.K.dbg;d.flush();const legacy=structuredClone(d.store);legacy.live.menu={row:2,col:0,t:15,saved:0};delete legacy.live.itemMenuRev;review.game.end();review.K.save(legacy);review.game.end=()=>{};review.restart()});assert.equal((await state()).mode,'menu');await key('z');assert.equal((await state()).mode,'play','Old CARRY ON selection migrates to the action row');
 for(const[id,x,y,tx,ty,oldTile,newTile]of [['q_beacon',7,1,8,1,'S','@'],['p_forest',8,2,9,2,'T','i'],['p_grave',10,1,11,0,'C','i'],['q_reeds',2,3,3,3,'~','i']]){
  await place(id,x,y,0);const pose=await state();await p.evaluate(({tx,ty,oldTile})=>{const d=review.K.dbg;d.give({bottle:1});d.flush();const legacy=structuredClone(d.store),row=legacy.live.tiles[ty].split('');row[tx]=oldTile;legacy.live.tiles[ty]=row.join('');delete legacy.slots[legacy.active].caster;delete legacy.slots[legacy.active].flask;review.game.end();review.K.save(legacy);review.game.end=()=>{};review.restart()},{tx,ty,oldTile});assert.equal(await p.evaluate(({tx,ty})=>review.K.dbg.tileAt(tx,ty),{tx,ty}),newTile,'Old live terrain receives '+id+' entrance');assert.equal((await state()).x,pose.x);assert.equal((await state()).y,pose.y);assert.equal((await state()).S.bottle,1,'Migration never refills old soup');assert.equal((await state()).S.flask,0);
 }
 console.log('LEGACY PASS: version-1 fields, exact unaffected pose/name/balance, untouched inactive file, one-time mainland migration for both new moats');
}
async function chapter(){
 // The second chapter is a post-credits branch. Seed only the completed first chapter;
 // keep the new dungeon's entire inventory, locks, puzzles, tools and boss unearned.
 await p.evaluate(()=>{const d=review.K.dbg;d.store.slots[1].name='DAVE SUX';d.give({done:1,hp:20,maxH:10,sword:1,shield:1,boom:1,bag:1,bombs:10,keys:3,map:1,comp:1,big:1});d.flag('baron',1);d.flag('recipe',1)});
 await place('village',10,9,1);await key('z');await frames(180);await key('z');await text();await frames(40);
 assert.equal((await state()).room,'p_village','Well enters alternate world');await shot('salt-arrival');
 await key('c');await frames(12);await shot('salt-map');await key('c');
 // Walk across an actual scrolling boundary, then restore during its animation.
 await place('p_village',15,6,3);await hold('ArrowRight',15);assert.equal((await state()).mode,'scroll');
 await shot('scroll');await p.evaluate(()=>review.restart());assert.equal((await state()).room,'p_east');assert.equal((await state()).mode,'play');
 await place('p_cliff',7,6,1);await shot('reservoir-exterior');
 await place('r1',7,10,1);await text();assert.equal((await state()).S.keys,0,'Keep keys do not open a second dungeon');assert.equal((await state()).S.big,0);assert(!(await state()).S.puzzles,'Dungeon puzzles never leak into global inventory');
 await shot('reservoir-start');
 // Capture all level starts and validate every hand-authored map/connection.
 const rooms=await p.evaluate(()=>Object.values(review.K.dbg.ROOMS).filter(r=>r.dg==='reservoir').map(r=>r.id));
 assert.equal(rooms.length,12);
 const outside=await p.evaluate(()=>Object.values(review.K.dbg.ROOMS).filter(r=>r.world==='salt').map(r=>r.id));assert.equal(outside.length,15);for(const id of outside){await place(id,7,6,0);await shot('world-'+id)}
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
 for(let i=0;i<160;i++){
  const target=await p.evaluate(()=>{const d=review.K.dbg,e=d.ents.find(e=>e.enemy&&!e.dead&&e.type!=='spike');return e&&{x:e.x,y:e.y,h:e.h,px:d.pl.x,py:d.pl.y,hp:d.S.hp}});
  if(!target)return;assert(target.hp>0,'Combat fixture survived');
  const dx=target.x-target.px,dy=target.y-target.py;
  if(Math.hypot(dx,dy)<48){await hold('x',62);await frames(26);}
  else if(Math.abs(dx)>Math.abs(dy))await hold(dx<0?'ArrowLeft':'ArrowRight',8);
  else await hold(dy<0?'ArrowUp':'ArrowDown',8);
 }
 throw Error('Combat did not clear');
}

async function walkTo(tx,ty){
 for(let i=0;i<150;i++){
  const next=await p.evaluate(({tx,ty})=>{
   const d=review.K.dbg,pl=d.pl,room=d.room,px=tx*16+8,py=ty*16+12;
   if(Math.abs(pl.x-px)<1.5&&Math.abs(pl.y-py)<1.5)return null;
   const solid=new Set('iP/\\j!HTbrXCFSgGhKOxkpcwq#BtQAeaZ13LYJU%~v'.split(''));
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
   await f.until(()=>GameInput.mode==='gamepad'&&RoomTV.dbg().dbg.pl.x>zeldoX+6);await page.evaluate(()=>{zeldoPad.axes[0]=0;zeldoPad.buttons[9]={pressed:true,value:1}});await f.until(()=>RoomTV.dbg().dbg.mode==='menu');await page.evaluate(()=>{zeldoPad.buttons[9]={pressed:false,value:0}});await page.waitForTimeout(220);await page.evaluate(()=>{zeldoPad.buttons[9]={pressed:true,value:1}});await f.until(()=>RoomTV.dbg().dbg.mode==='play');await page.evaluate(()=>{zeldoPad.buttons[9]={pressed:false,value:0};RoomTV.dbg().dbg.give({hook:1,sel:'hook'});RoomTV.dbg().dbg.warp('t7',6,7,1);zeldoPad.buttons[3]={pressed:true,value:1}});
   await f.until(()=>!!RoomTV.dbg().dbg.pl.hook||RoomTV.dbg().dbg.pl.y<85);await page.evaluate(()=>{zeldoPad.buttons[3]={pressed:false,value:0}});await f.until(()=>RoomTV.dbg().dbg.pl.y<85&&!RoomTV.dbg().dbg.pl.act);await page.screenshot({path:dir+'after-gamepad-spork.png'});
   await page.evaluate(()=>{const d=RoomTV.dbg().dbg;d.give({caster:1,sel:'caster'});d.warp('f7',7,7,1);zeldoPad.buttons[3]={pressed:true,value:1}});await f.until(()=>RoomTV.dbg().dbg.tileAt(7,4)==='.');await page.evaluate(()=>{zeldoPad.buttons[3]={pressed:false,value:0}});await page.waitForTimeout(250);await page.evaluate(()=>{zeldoPad.buttons[3]={pressed:true,value:1}});await f.until(()=>!!RoomTV.dbg().dbg.S.dungeons.pantry.puzzles.thaw);await page.evaluate(()=>{zeldoPad.buttons[3]={pressed:false,value:0};zeldoPad.connected=false});await page.screenshot({path:dir+'after-gamepad-caster.png'});
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
   await page.locator('.rm-eject').click();
   await f.until(caseEjected,'sn.zeldo');
   assert.equal(await page.evaluate(()=>House.THINGS['media.sn.zeldo'].snap),'media.case.sn.zeldo');
   if(await page.evaluate(()=>!!House.held()))await page.evaluate(()=>House.putBack());
   await f.until(()=>!House.held()&&House.THINGS['media.box.sn.zeldo'].st==='rest');
   assert(await page.evaluate(()=>House.THINGS['media.box.sn.zeldo'].canGrab()),'Ejected case is carryable');
   // Formula Null now opts into the telly itself; Street Scrapper II still has no screen hook.
   await playCase(f,'sn.fight');await f.until(()=>RoomTV._dbg().st==='game');assert(await page.evaluate(()=>typeof RoomTV.defs['sn.fight']?.screen!=='function'),'sn.fight has no screen hook');assert(await page.evaluate(()=>RoomTV._dbg().surface),'Cartridges without a screen hook use the physical cupboard telly');await page.keyboard.press('Enter');await page.waitForTimeout(200);await page.screenshot({path:dir+'after-shared-unchanged-cartridge.png'});
  }
  assert.deepEqual(f.errors,[],'Room browser errors');console.log(before?'ROOM BASELINE: legacy overlay, LOCK IN and pause':'ROOM PASS: physical telly, same-instance LOCK IN/Q, pause, analog gamepad, four viewports, cartridge change and unchanged Street Scrapper');
 }catch(e){console.log('ROOM FAILURE',await page.evaluate(()=>({mode:House?.mode,pose:{x:House?.P.x,z:House?.P.z,wx:House?.W.x,wz:House?.W.z},glide:House?.gliding,game:window.RoomTV?._dbg(),loading:document.querySelector('.hs-loading')?.innerText,member:AccountGate?.allowed,cases:HouseCases.state(),held:House.held(),media:['sn.zeldo','sn.fight'].map(id=>{const b=House.THINGS['media.box.'+id],m=House.THINGS['media.'+id];return{id,box:b&&{state:b.st,snap:b.snap,canGrab:b.canGrab?.(),at:b.at},medium:m&&{state:m.st,snap:m.snap},registered:HouseCases.inserted('console.sn')?.medium.gameId}})})));await page.screenshot({path:dir+'after-room-failure.png'}).catch(()=>{});throw e;}finally{await f.browser.close()}
 if(!before)await touchCheck(account,password);
}

async function touchCheck(account,password){
 const f=await roomFixture(base,{account,password,signup:false,onPage:page=>page.setDefaultTimeout(30000),touch:true,width:390,height:844}),page=f.page;
 try{
  await page.evaluate(()=>House.goRoom('cupboard',0));await f.until(()=>!House.gliding);await page.evaluate(()=>{House.setWalkFrom({...House.P,lvl:'G',seat:0});House._.setMode('walk')});await playCase(f,'sn.zeldo');await page.evaluate(()=>RoomTV.test('sn.zeldo'));await f.until(()=>RoomTV._dbg()?.st==='game'&&!!RoomTV.dbg()?.dbg);
  await page.evaluate(()=>{RoomTV.dbg().dbg.start(0,'JACK');RoomTV.dbg().dbg.give({sword:1,shield:1});RoomTV.dbg().dbg.warp('south',7,6,3)});
  const control=b=>page.locator('[data-zeldo="'+b+'"]');
  async function press(b){const r=await control(b).boundingBox();assert(r,'Touch button '+b);await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2)}
  await press('lock');await f.until(()=>RoomTV.lockIn()&&!House.gliding);await page.waitForTimeout(await page.evaluate(()=>House.motion.scale(House.motion.ms.lock)+100));
  const cdp=await page.context().newCDPSession(page),pad=await page.locator('.zeldo-dpad').boundingBox();
  const x=await page.evaluate(()=>RoomTV.dbg().dbg.pl.x);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pad.x+pad.width-12,y:pad.y+pad.height/2,id:1}]});
  let moved=false,last;try{for(let i=0;i<120;i++){last=await page.evaluate(()=>({x:RoomTV.dbg().dbg.pl.x,frame:RoomTV.dbg().frame,mode:RoomTV.dbg().dbg.mode,paused:House.paused,input:GameInput.mode}));if(last.x>x+3){moved=true;break}await page.waitForTimeout(100)}}finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach()}
  assert(moved,'Left thumb pad walks: '+JSON.stringify({from:x,last,pad}));
  await press('start');await f.until(()=>RoomTV.dbg().dbg.mode==='menu');await page.screenshot({path:dir+'after-touch-items.png'});await press('start');await f.until(()=>RoomTV.dbg().dbg.mode==='play');
  await press('x');await f.until(()=>RoomTV.dbg().dbg.mode==='map');await page.waitForTimeout(200);await press('x');await f.until(()=>RoomTV.dbg().dbg.mode==='play');
  await page.evaluate(()=>{RoomTV.dbg().dbg.give({hook:1,sel:'hook'});RoomTV.dbg().dbg.warp('t7',6,7,1)});await press('y');await f.until(()=>RoomTV.dbg().dbg.pl.y<85&&!RoomTV.dbg().dbg.pl.act);await page.screenshot({path:dir+'after-touch-spork.png'});
  await page.evaluate(()=>{const d=RoomTV.dbg().dbg;d.give({caster:1,hook:1,sword:3,shield:2,sel:'caster',flask:2,bottle:1});const flags=d.S.dungeons.pantry.puzzles;delete flags.thaw;delete flags['melt:f7:7,4'];d.warp('f7',7,7,1)});await press('y');await f.until(()=>RoomTV.dbg().dbg.tileAt(7,4)==='.');await page.waitForTimeout(250);await press('y');await f.until(()=>!!RoomTV.dbg().dbg.S.dungeons.pantry.puzzles.thaw);await page.screenshot({path:dir+'after-touch-caster.png'});await press('start');await f.until(()=>RoomTV.dbg().dbg.mode==='menu');await page.screenshot({path:dir+'after-touch-cold-kit.png'});await press('start');await f.until(()=>RoomTV.dbg().dbg.mode==='play');
  for(const [width,height,name]of [[390,844,'portrait'],[844,390,'landscape'],[768,1024,'tablet']]){
   await page.setViewportSize({width,height});await page.waitForTimeout(300);await f.until(()=>!House.gliding);
   const layout=await page.evaluate(()=>{const e=document.querySelector('.zeldo-dpad'),cs=getComputedStyle(e);return{visibility:cs.visibility,opacity:cs.opacity,classes:document.documentElement.className,view:document.querySelector('.rm-tvv').className}});console.log('TOUCH LAYOUT',name,JSON.stringify(layout));assert.equal(layout.visibility,'visible','Touch controller remains visible after resize');
   const screen=await page.locator('.rm-tvv .rm-glass').boundingBox(),dpad=await page.locator('.zeldo-dpad').boundingBox(),buttons=await page.locator('.zeldo-actions').boundingBox();
   assert(screen&&Math.abs(screen.width/screen.height-256/224)<.01);const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
   assert(dpad.x>=0&&dpad.y>=0&&dpad.x+dpad.width<=width+1&&dpad.y+dpad.height<=height+1&&buttons.x>=0&&buttons.y>=0&&buttons.x+buttons.width<=width+1&&buttons.y+buttons.height<=height+1,'Both thumb controls remain inside '+name);assert(!overlaps(screen,dpad)&&!overlaps(screen,buttons),'Controller does not cover game in '+name);assert(screen.width>250,'Readable native screen in '+name);
   await press('x');await f.until(()=>RoomTV.dbg().dbg.mode==='map');await page.waitForTimeout(180);await press('x');await f.until(()=>RoomTV.dbg().dbg.mode==='play');
   await page.screenshot({path:dir+'after-touch-'+name+'.png'});
  }
  assert.deepEqual(f.errors,[]);console.log('TOUCH PASS: thumb drag, item menu, map, LOCK IN, portrait/landscape/tablet, no screen overlap');
 }finally{await f.browser.close()}
}

async function equip(item){
 const items=['boom','bombs','soup','bow','boots','hook','caster'],current=Math.max(0,items.indexOf((await state()).S.sel)),target=items.indexOf(item);
 await key('Enter');await frames(12);
 let row=Math.floor(current/3),col=current%3;const targetRow=Math.floor(target/3);
 while(row!==targetRow){await key(targetRow>row?'ArrowDown':'ArrowUp');row+=targetRow>row?1:-1;col=Math.min(col,row===2?0:2);}
 const cols=3;for(let i=0,n=(target%3-col+cols)%cols;i<n;i++)await key('ArrowRight');
 await key('z');assert.equal((await state()).S.sel,item,'Item menu equips '+item);await key('Enter');
}
