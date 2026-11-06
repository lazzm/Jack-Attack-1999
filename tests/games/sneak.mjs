// Native cartridge review plus authenticated physical-telly checks. Localhost only.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const base=process.argv.find(a=>/^http:/.test(a));
assert(base&&['localhost','127.0.0.1'].includes(new URL(base).hostname),'Supply disposable localhost URL');
const before=process.argv.includes('--before'),tag=before?'before':'after';
const dir=fileURLToPath(new URL('../shots/games/sneak/',import.meta.url))+tag+'/';await mkdir(dir,{recursive:true});
const source=before?execFileSync('git',['show','HEAD:app/public/js/rm-g-sneak.js'],{encoding:'utf8'}):await readFile(new URL('../../app/public/js/rm-g-sneak.js',import.meta.url),'utf8');
let browser,p;const errors=[];
const watchdog=setTimeout(()=>{console.error('SNEAK total timeout');Promise.resolve(browser?.close()).finally(()=>process.exit(1))},1200000);
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>{console.error('SNEAK '+sig);Promise.resolve(browser?.close()).finally(()=>process.exit(1))});
const D=(fn,arg)=>p.evaluate(fn,arg),frames=n=>D(n=>review.step(n),n);
const key=async k=>{await p.keyboard.down(k);await frames(1);await p.keyboard.up(k);await frames(1)};
const hold=async(k,n)=>{await p.keyboard.down(k);await frames(n);await p.keyboard.up(k);await frames(1)};
const st=()=>D(()=>{const d=review.K.dbg;return{mode:d.mode,area:d.S?.area,P:{x:d.P.x,z:d.P.z,low:d.P.low,box:d.P.box},phase:d.phase,paused:d.paused,S:d.S,cd:!!d.cd}});
async function shot(name){await D(()=>review.game.draw());await p.screenshot({path:dir+name+'.png'});const data=await D(()=>{review.game.draw();const c=document.createElement('canvas');c.width=320;c.height=240;const g=c.getContext('2d');g.drawImage(review.K.cv,0,0);g.drawImage(review.K.hud.canvas,0,0);return c.toDataURL().split(',')[1]});await writeFile(dir+name+'-native.png',Buffer.from(data,'base64'));console.log('SHOT '+tag+'/'+name)}
function runner(restoring=false){
 const cv=document.createElement('canvas'),hc=document.createElement('canvas');for(const c of [cv,hc]){c.width=320;c.height=240;Object.assign(c.style,{position:'absolute',width:'100%',height:'100%',imageRendering:'pixelated'});document.querySelector('#screen').append(c)}
 const held={},pressed={},map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',z:'a',x:'b',c:'x',v:'y',Enter:'start',Shift:'select',u:'l',e:'r'};
 addEventListener('keydown',e=>{const b=map[e.key];if(b){if(!held[b])pressed[b]=true;held[b]=true;e.preventDefault()}},true);addEventListener('keyup',e=>{if(map[e.key])held[map[e.key]]=false},true);
 const K={cv,hud:hc.getContext('2d'),W:320,H:240,font:RoomTV.font,t:0,frame:0,restoring,stick:()=>({x:(held.right?1:0)-(held.left?1:0),y:(held.down?1:0)-(held.up?1:0)}),label:b=>({a:'Z',b:'X',x:'C',y:'V',l:'U',r:'E',start:'ENTER'}[b]||b.toUpperCase()),keyLabel:b=>K.label(b),
 held:b=>!!held[b],pressed:b=>!!pressed[b],rnd:seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296},load:()=>JSON.parse(localStorage.getItem('sneak-review')||'null'),save:s=>{localStorage.setItem('sneak-review',JSON.stringify(s));return true},resume:()=>{K.restoring=false},secret:()=>{},music:()=>{},over:()=>{},sfx:{tone(){},seq(){},noise(){}},three:o=>K._three||(K._three=RoomTV.make3d(K,{...o,look:'ps1'}))};
 window.review={K,game:RoomTV.defs['ps.sneak'].make(K),step(n){for(let i=0;i<n;i++){this.game.update(1/60);K.frame++;K.t+=1/60;for(const k in pressed)delete pressed[k]}this.game.draw()}};
}
async function native(restoring=false,seedSave){
 await p.goto(base+'/__sneak-review');await D(()=>{window.Room={_:{esc:s=>s}}});
 for(const src of ['vendor/three.min.js','js/cast.js','js/rm-tv.js','js/rm-3d.js'])await p.addScriptTag({url:base+'/'+src});
 await D(()=>Cast.bind('sneak-review',{first:'Robin',g:'f'}));await p.addScriptTag({content:source});if(seedSave)await D(s=>localStorage.setItem('sneak-review',JSON.stringify(s)),seedSave);await p.evaluate(runner,restoring);await frames(restoring?1:90);
}
async function area(i){await D(i=>review.K.dbg.enter(i),i);await frames(3)}
async function at(x,z,a){await D(({x,z,a})=>review.K.dbg.at(x,z,a),{x,z,a});await frames(1)}
async function perf(area=0){return D(area=>{const k=review.K,d=k.dbg;d.enter(area);const t=k._three,gl=t.ren.getContext(),pixel=new Uint8Array(4),a=[];for(let i=0;i<180;i++){const s=performance.now();review.step(1);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(i>=60)a.push(performance.now()-s)}a.sort((x,y)=>x-y);const ext=gl.getExtension('WEBGL_debug_renderer_info');return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],mean:a.reduce((x,y)=>x+y,0)/a.length,native:[k.W,k.H],calls:t.ren.info.render.calls,triangles:t.ren.info.render.triangles,renderer:ext&&gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),scope:'320x240 cartridge update + draw + GPU readback; excludes house'}},area)}
try{
 if(!process.argv.includes('--room-only')&&!process.argv.includes('--phone-only')){
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});p=await browser.newPage({viewport:{width:1366,height:860}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
 await p.route('**/__sneak-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Cartridge review</title><link rel="icon" href="data:,"><body style="margin:0;background:#0b1017"><div id="screen" style="position:absolute;width:min(96vw,128vh);aspect-ratio:4/3;left:50%;top:50%;transform:translate(-50%,-50%)"></div>'}));
 await native();if(!process.argv.includes('--bench')){await shot('title');await frames(300);await shot('attract');await key('Enter');await shot('menu');await key('z');await shot(before?'briefing':'difficulty');if(!before){await key('z');await shot('briefing')}await key('Enter');await frames(170);await shot('codec');await key('Enter');await frames(45);
 for(const i of (before?[0,1,2,3,4,5]:[0,1,2,3,4,18,19,20,5])){await area(i);await shot('area-'+i+'-start');await hold('ArrowUp',40);await shot('area-'+i+'-mid')}
 await area(0);const z=(await st()).P.z;await hold('ArrowUp',30);assert((await st()).P.z<z-.5,'Real keys move');await key('z');assert((await st()).P.low);await key('v');assert((await st()).P.box);await shot('box');await key('v');await key('Enter');const time=(await st()).S.st.t;await frames(120);assert.equal((await st()).S.st.t,time);await shot('pause');await key('Enter');
 await area(0);await at(10,10.5,Math.PI/2);await key('c');await frames(45);await shot('dart');await D(()=>review.K.dbg.alert());await frames(20);await shot('alert');
 if(!before)await improvements();else await baselineEnding();}
 const stats=await perf();stats.areas=[];for(const i of (before?[5]:[18,19,20,5]))stats.areas.push({area:i,...await perf(i)});await writeFile(dir+(process.argv.includes('--bench')?'paired-performance.json':'performance.json'),JSON.stringify(stats,null,2));console.log('PERFORMANCE '+JSON.stringify(stats));
 await browser.close();browser=null;
 }
 if(process.argv.includes('--phone-only'))await phone();else if(!process.argv.includes('--native'))await room();
 assert.deepEqual(errors,[],'Browser errors');console.log('SNEAK '+tag.toUpperCase()+' PASS');
}catch(e){if(p&&!p.isClosed()){console.log('FAIL STATE',JSON.stringify(await st()).slice(0,2400));await shot('failure').catch(()=>{})}throw e}finally{clearTimeout(watchdog);await browser?.close()}
async function baselineEnding(){
 await area(5);await frames(80);for(let i=0;i<3;i++){await frames(6);await shot('rex-scan-'+i)}
 const bs=await D(()=>review.K.dbg.A.breakers.map(b=>({x:b.x,z:b.z})));for(const b of bs){await at(b.x,b.z);await key('x');await frames(75)}assert(await D(()=>review.K.dbg.A.breakers.every(b=>b.on)));await frames(160);const plans=await D(()=>{const it=review.K.dbg.A.items.find(i=>i.k==='p');return{x:it.x,z:it.z}});await shot('rex-plans');await at(plans.x,plans.z);await frames(240);await key('Enter');await frames(300);assert.equal((await st()).mode,'results');await shot('results');await key('Enter');await shot('signature');if((await st()).mode==='name')await key('Enter');await frames(60);await shot('rankings');
}
async function improvements(){
 // Every authored tile row is closed and rectangular; all objectives have a route.
 assert(await D(()=>review.K.dbg.areas.every(a=>a.map.every(row=>row.length===a.map[0].length))),'Every area has a closed rectangular grid');
 const maps=await D(()=>review.K.dbg.training.map(v=>({i:v.area,name:v.name})));assert.equal(maps.length,12);
 // A blocked wall must stop movement; holding into it enters wall cover and knock lures a real patrol.
 await area(0);await at(13.65,8.5,Math.PI/2);await hold('ArrowRight',45);const x=(await st()).P.x;assert(x<13.77&&x>=13.65,'Crates stop the player');assert(await D(()=>!!review.K.dbg.P.wall),'Holding into a crate enters wall cover');await key('x');await shot('wall-knock');
 // A noticed but now-stationary box must be inspected, rather than freezing the patrol.
 await area(0);await key('v');await frames(40);await at(2.5,14.3);await D(()=>{const g=review.K.dbg.A.guards[0];g.st='notice';g.sus=.3;g.a=g.head=0});const alarms=(await st()).S.st.alerts;await frames(270);assert(await D(()=>review.K.dbg.A.guards[0].stared>0),'A distant box investigation completes');assert.equal((await st()).S.st.alerts,alarms);await shot('box-investigation-recovered');
 // Doors reject missing cards, then open after the key is physically collected.
 await area(1);await D(()=>{review.K.dbg.S.cards=0;review.K.dbg.P.low=false});await at(11.5,2.5);await hold('ArrowUp',35);assert((await st()).P.z>1.9,'Locked door rejects player');await shot('locked-door');
 await at(4.5,7.5);await key('z');await frames(8);assert.equal((await st()).S.cards,1,'Crawling under the truck finds card');await shot('keycard');
 await at(11.5,2.5);if((await st()).P.low)await key('z');await hold('ArrowUp',65);await frames(90);assert.equal((await st()).area,2,'Actual exit transition enters basement');
 // A real dart strikes a stationary post guard; capture flight and snooze animation.
 await area(2);await at(23.5,7.5,Math.PI);const darts=(await st()).S.darts;await key('c');for(let i=0;i<3;i++){await frames(3);await shot('dart-flight-'+i)}await frames(20);assert((await st()).S.darts===darts-1);assert(await D(()=>review.K.dbg.A.guards.some(g=>g.st==='sleep')),'Dart snoozes guard');await shot('guard-snooze');
 // Suspend in a genuine alert and paused state, preserving inventory and patrol positions.
 await D(()=>review.K.dbg.alert());await frames(20);await key('Enter');await D(()=>review.K.dbg.save());const saved=await D(()=>review.K.load().run);await shot('suspend-alert');await native(true);
 let restored=await D(()=>{const d=review.K.dbg;return{S:d.S,P:d.P,phase:d.phase,paused:d.paused,guards:d.A.guards.map(g=>({x:g.x,z:g.z,st:g.st}))}});
 assert.equal(restored.phase,saved.phase);assert(restored.paused);assert.equal(restored.P.x,saved.P.x);assert.deepEqual(restored.guards,saved.guards.map(g=>({x:g.x,z:g.z,st:g.st})));assert.deepEqual(restored.S,saved.S);assert(await D(()=>review.K.dbg.A.doors.every(d=>d.led.material.color.getHex()===0x40ff70)),'Door clearance lamps restore while paused');await shot('refresh-alert-paused');
 await key('Enter');await frames(5);assert(!(await st()).paused);
 await campaignChapter();
 // Clear the robot with real switch inputs, including refresh halfway through a lever pull.
 await area(5);const bs=await D(()=>review.K.dbg.A.breakers.map(b=>({x:b.x,z:b.z})));
 for(let i=0;i<bs.length;i++){
  const b=bs[i];await at(b.x,b.z);await key('x');await frames(20);
  if(i===0){await key('Enter');await D(()=>review.K.dbg.save());const r=await D(()=>review.K.load().run);await native(true);assert.equal(await D(()=>review.K.dbg.P.pullT),r.P.pullT);await key('Enter')}
  await frames(47);assert(await D(i=>review.K.dbg.A.breakers[i].on,i),'Lever completes '+i);await shot('rex-switch-'+i);
 }
 await frames(170);const plans=await D(()=>{const it=review.K.dbg.A.items.find(i=>i.k==='p');return it&&{x:it.x,z:it.z}});assert(plans,'Robot drops plans');await shot('rex-plans');await at(plans.x,plans.z);await frames(240);await key('Enter');await frames(4);assert.equal((await st()).mode,'results');await frames(300);await shot('results');await key('Enter');assert.equal((await st()).mode,'name');await shot('signature');await key('Enter');await frames(65);await shot('rankings');assert(await D(()=>review.K.dbg.HI.some(e=>e.me&&e.cast==='me')));await key('Enter');assert.equal((await st()).mode,'credits');await frames(600);await shot('credits');await key('Enter');await frames(8);await D(()=>review.K.dbg.save());await native(true);assert.equal((await st()).mode,'credits','Credits survive refresh');await shot('refresh-credits');await frames(400);assert.equal((await st()).mode,'done');assert(await D(()=>review.K.dbg.career.tux),'Clear unlocks dinner suit');
 // Title course menu and dossier are navigated with the same real controller inputs.
 await D(()=>review.K.dbg.title());await frames(45);await key('Enter');await key('ArrowDown');await key('z');assert.equal((await st()).mode,'training');await shot('training-menu');
 await key('ArrowDown');await key('z');assert.equal((await st()).mode,'training','Course 2 starts locked');await D(()=>review.K.dbg.save());await native(true);assert.equal((await st()).mode,'training','Course list survives refresh');assert.equal(await D(()=>review.K.load().ui.vrSel),1);await shot('refresh-course-list');await key('ArrowUp');await key('z');assert.equal((await st()).area,6);
 // Complete every exercise using real movement/equipment/action inputs. Debug placement
 // sets up each encounter; it never awards a medal, flips a circuit or snoozes a guard.
 for(let i=0;i<12;i++){
  if(i>0){await key('z');assert.equal((await st()).area,6+i,'Next exercise '+i)}
  await frames(70);assert.equal((await st()).mode,'play','Safe course start '+i);await shot('training-'+String(i+1).padStart(2,'0')+'-start');
  const v=await D(()=>review.K.dbg.training[review.K.dbg.vr.i]);
  if(v.goal==='box'){
   await key('v');await frames(40);
   const g=await D(()=>{const g=review.K.dbg.A.guards[0];return{x:g.x,z:g.z,a:g.a}});
   await at(g.x+Math.sin(g.a)*1.9,g.z+Math.cos(g.a)*1.9);await frames(220);
   assert(await D(()=>review.K.dbg.vr.boxed),'Guard accepts stationary box');await shot('training-box-inspection');await key('v');
  }
  if(v.goal==='seed'){
   const it=await D(()=>{const it=review.K.dbg.A.items.find(i=>i.k==='s');return{x:it.x,z:it.z}});
   if(v.layout===1)await key('z');await at(it.x,it.z);await frames(3);assert(Object.keys((await st()).S.seeds).length);await shot('training-seed-'+i);
  }
  if(v.goal==='switch'){
   const bs=await D(()=>review.K.dbg.A.breakers.map(b=>({x:b.x,z:b.z})));
   for(const b of bs){await at(b.x,b.z);await key('x');await frames(65)}assert(await D(()=>review.K.dbg.A.breakers.every(b=>b.on)));await shot('training-circuits-'+i);
  }
  if(v.goal==='targets'){
   for(let n=0;n<2;n++){const g=await D(n=>{const g=review.K.dbg.A.guards[n];return{x:g.x,z:g.z}},n);await at(g.x,g.z+2,Math.PI);await key('c');await frames(33)}
   assert(await D(()=>review.K.dbg.A.guards.every(g=>g.st==='sleep')));await shot('training-targets');
  }
  if(v.goal==='lure'){
   // A wall corner near the southern patrol, knocked from actual wall cover.
   await at(10.5,7.5,-Math.PI/2);await hold('ArrowLeft',28);await key('x');await frames(20);assert(await D(()=>review.K.dbg.vr.lured));await shot('training-lure');
  }
  if((await st()).P.low)await key('z');
  if(i!==11){if(!(await st()).P.box)await key('v')}else await key('z');
  await at(7.5,2.5,Math.PI);await hold('ArrowUp',i===11?66:57);assert.equal((await st()).mode,'vrresult','Course result '+i);assert(await D(()=>review.K.dbg.career.vr[review.K.dbg.vr.i]),'Medal saved '+i);await shot('training-'+String(i+1).padStart(2,'0')+'-result');
  if(i===3){await D(()=>review.K.dbg.save());await native(true);assert.equal((await st()).mode,'vrresult','Training result survives refresh')}
 }
 assert(await D(()=>review.K.dbg.career.gold),'12 medals unlock gold box');await key('x');assert.equal((await st()).mode,'training');await shot('all-medals');
 // Retry and timed failure never mutate the campaign or consume medals.
 await key('z');assert.equal((await st()).mode,'play');await frames(4600);assert.equal((await st()).mode,'vrresult');assert(await D(()=>/TIME UP/.test(review.K.load().run.vrResult.message)),'Time limit, not a guard, caused the retry');await shot('training-timeout');await key('z');assert.equal((await st()).mode,'play');await key('Enter');await key('x');assert.equal((await st()).mode,'training');await key('x');
 await key('ArrowDown');await key('ArrowDown');await key('z');assert.equal((await st()).mode,'dossier');await shot('dossier');await D(()=>review.K.dbg.save());await native(true);assert.equal((await st()).mode,'dossier','Dossier survives refresh');await key('x');
 await replayRewards();await legacyCard();
 // Whole-game native presentation at phone portrait and landscape sizes.
 await p.setViewportSize({width:390,height:844});await shot('phone-portrait');await p.setViewportSize({width:844,height:390});await shot('phone-landscape');await p.setViewportSize({width:1366,height:860});
 assert(await D(()=>JSON.stringify(review.K.load()).length<19500),'Save fits the roaming profile budget');
 console.log('FLOWS PASS: campaign puzzles, boss, results, credits, 12 training medals, timeout/retry, suspend');
}

async function campaignChapter(){
 // Scientist dialogue grants the card through its actual completion callback.
 await area(4);await D(()=>{review.K.dbg.S.cards=2;review.K.dbg.S.otter=0});await at(9.5,13.5);await frames(70);assert((await st()).cd);await shot('scientist');await key('Enter');assert.equal((await st()).S.cards,3);await D(()=>review.K.dbg.save());await native(true);assert(await D(()=>!!review.K.dbg.A.npc?.m),'Scientist stays in the cupboard after refresh');
 await at(25.5,10.5);await hold('ArrowRight',45);await frames(100);assert.equal((await st()).area,18,'Lab now leads to freezer');
 if((await st()).cd){await frames(100);await key('Enter')}
 // Debug placement sets up each circuit, but all locks and switches are real.
 await area(18);await inspectModel('freezer','freezer');await at(8.5,1.5);await frames(3);assert.equal((await st()).area,18,'Freezer exit is locked');
 const scope=await D(()=>{const it=review.K.dbg.A.items.find(i=>i.k==='n');return{x:it.x,z:it.z}});await at(scope.x,scope.z);assert((await st()).S.scope,'Binoculars are a real pickup');await shot('binoculars-found');
 const bs=await D(()=>review.K.dbg.A.breakers.map(b=>({x:b.x,z:b.z})));
 for(const b of bs){await at(b.x,b.z);await key('x');await frames(70)}assert(await D(()=>review.K.dbg.A.breakers.every(b=>b.on)));
 // First-person viewing and manual rations use the ordinary inventory menu.
 const watcher=await D(()=>{const g=review.K.dbg.A.guards[1];return{x:g.x,z:g.z}});await at(watcher.x-3.5,watcher.z,Math.PI/2);await key('u');assert.equal((await st()).mode,'equipment');await shot('equipment');const clock=await D(()=>review.K.dbg.clock);await frames(120);assert.equal(await D(()=>review.K.dbg.clock),clock,'Equipment freezes simulation');
 await key('ArrowDown');await key('ArrowDown');await key('z');assert(await D(()=>review.K.dbg.P.look&&review.K.dbg.P.tool==='scope'));await hold('ArrowLeft',12);await hold('ArrowRight',12);await shot('binoculars-view');const pose=await st();await hold('ArrowUp',20);assert.deepEqual((await st()).P,pose.P,'Look aims without walking');
 await key('e');assert(!(await D(()=>review.K.dbg.P.look)));await D(()=>review.K.dbg.S.life=50);await key('u');const rations=(await st()).S.rations;await key('z');assert.equal((await st()).S.life,95);assert.equal((await st()).S.rations,rations-1);await shot('ration-used');
 await D(()=>review.K.dbg.calm());await at(8.5,1.5);await frames(90);assert.equal((await st()).area,19,'Freezer circuits release the lift');
 await area(19);await inspectModel('fuse','f');await inspectModel('goggles','t');await at(10.5,1.5);await frames(2);assert.equal((await st()).area,19,'Packing exit needs fuses');
 const loot=await D(()=>review.K.dbg.A.items.filter(i=>i.k==='f'||i.k==='t').map(i=>({x:i.x,z:i.z,k:i.k})));
 for(const it of loot){await at(it.x,it.z);await frames(2)}assert.equal((await st()).S.fuses,2);assert((await st()).S.thermal);await shot('fuses-found');
 const warm=await D(()=>{const g=review.K.dbg.A.guards[1];return{x:g.x,z:g.z}});await at(warm.x,warm.z+3.5,Math.PI);await key('u');await key('ArrowDown');await key('ArrowDown');await key('ArrowDown');await key('z');assert(await D(()=>review.K.dbg.P.look&&review.K.dbg.P.tool==='thermal'));await shot('crumb-vision');await key('Enter');await D(()=>review.K.dbg.save());await native(true);assert(await D(()=>review.K.dbg.P.look&&review.K.dbg.paused&&review.K.dbg.P.tool==='thermal'),'Optics survive refresh');await shot('refresh-optics');await key('Enter');await key('e');
 await D(()=>review.K.dbg.calm());await at(10.5,1.5);await frames(90);assert.equal((await st()).area,20,'Fuses power the tower lift');
 await area(20);await frames(75);await inspectModel('stoat','chief');await shot('stoat-intro');const circuits=await D(()=>review.K.dbg.A.breakers.map(b=>({x:b.x,z:b.z})));
 for(let i=0;i<3;i++){await at(circuits[i].x,circuits[i].z);await key('x');await frames(70);assert(await D(i=>review.K.dbg.A.breakers[i].on,i));await shot('stoat-circuit-'+i);if(i===0){assert(await D(()=>review.K.dbg.A.spots.every(s=>s.disabled)));await key('Enter');await D(()=>review.K.dbg.save());await native(true);assert(await D(()=>review.K.dbg.A.spots.every(s=>s.disabled&&!s.beam.visible)));await key('Enter')}}
 assert(await D(()=>review.K.dbg.A.cams.every(c=>c.disabled)&&review.K.dbg.A.guards.every(g=>g.offDuty)),'Tea bell ends the Stoat encounter');
 await at(9.5,1.5);await frames(90);assert.equal((await st()).area,5,'Tower route reaches the original hangar');
 // Full-range wall and low-cover checks: a guard cannot see through a wall even at touching distance.
 await area(2);assert.equal(await D(()=>review.K.dbg.los(6.7,2.5,8.3,2.5,false)),false);
 // Timed hazards freeze without phase jumps across equipment or pause.
 await area(4);await at(12.1,10.5);await key('Enter');const t=await D(()=>review.K.dbg.clock);await frames(220);assert.equal(await D(()=>review.K.dbg.clock),t);await key('Enter');await frames(1);assert(await D(t=>review.K.dbg.clock<t+.06,t));
 console.log('CHAPTER PASS: scientist, two circuit locks, two fuses, binoculars, thermal optics, ration use, tower shutdown, chapter transitions');
}

async function replayRewards(){
 await D(()=>review.K.dbg.title());await frames(45);await key('Enter');await key('z');assert.equal((await st()).mode,'difficulty');await key('ArrowUp');await key('ArrowRight');await shot('tea-break-orders');await D(()=>review.K.dbg.save());await native(true);assert.equal((await st()).mode,'difficulty','Orders survive refresh');await shot('refresh-orders');await key('z');await key('Enter');await frames(170);await key('Enter');await frames(35);assert.equal((await st()).S.darts,8);assert.equal((await st()).S.rations,2);await shot('dinner-suit');await inspectModel('dinner-suit','hero');await key('v');await shot('gold-box');
 await D(()=>review.K.dbg.title());await frames(45);await key('Enter');await key('ArrowUp');await key('z');await key('ArrowDown');await shot('night-shift-orders');await key('z');await key('Enter');await frames(170);await key('Enter');await frames(35);assert.equal((await st()).S.darts,3);assert.equal((await st()).S.rations,1);await shot('night-shift');
}
async function legacyCard(){
 const full=await D(()=>{review.K.dbg.save();return review.K.load()});
 await native(true,{ck:full.ck,hi:full.hi});assert.equal((await st()).mode,'title');await frames(45);await key('Enter');await key('z');assert.equal((await st()).mode,'memcard');await shot('legacy-card');await key('z');assert.equal((await st()).mode,'play');assert.equal((await st()).S.darts,full.ck.darts,'Legacy checkpoint supplies preserved');assert.equal((await st()).S.st.alerts,full.ck.st.alerts);await shot('legacy-resume');await native(true,full);
}
async function inspectModel(name,kind){
 const saved=await D(()=>{review.K.dbg.save();return review.K.load().run});
 for(const [view,a] of [['front',0],['side',Math.PI/2],['back',Math.PI]]){
  await D(({kind,a})=>{const d=review.K.dbg,k=review.K;d.setMode('view');const person=kind==='chief'||kind==='hero',o=kind==='hero'?d.hero.root:kind==='chief'?d.A.guards[0].m.root:kind==='freezer'?d.A.root.children.find(o=>o.userData.sneakProp==='freezer'):d.A.items.find(it=>it.k===kind).g;d.hero.root.visible=kind==='hero';d.hero.sh.visible=kind==='hero';o.position.set(d.A.P[0]+3,person||kind==='freezer'?0:.35,d.A.P[1]);o.rotation.y=0;if(kind==='chief'){d.A.guards[0].m.sh.position.set(o.position.x,.03,o.position.z);d.A.guards[0].m.hd.rotation.y=0}const v=new THREE.Vector3();o.getWorldPosition(v);const c=k._three.cam;c.fov=44;c.updateProjectionMatrix();const dist=kind==='freezer'?3.4:2.5;c.position.set(v.x+Math.sin(a)*dist,person?1.5:kind==='freezer'?1.8:1.1,v.z+Math.cos(a)*dist);c.lookAt(v.x,person?.85:kind==='freezer'?.7:.4,v.z)}, {kind,a});await shot('model-'+name+'-'+view);
 }
 await D(saved=>review.K.dbg.restore(saved),saved);
}
async function room(){
 const account='Sneak'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,onPage:async page=>{if(before)await page.route('**/js/rm-g-sneak.js*',r=>r.fulfill({body:source,contentType:'application/javascript'}))}});browser=f.browser;p=f.page;
 try{
  await playCase(f,'ps.sneak');await f.until(()=>!!RoomTV.dbg()?.dbg);await p.waitForTimeout(1800);await p.screenshot({path:dir+'in-room-title.png'});
  await p.keyboard.press('t');await f.until(()=>RoomTV.lockIn());await p.screenshot({path:dir+'lock-in.png'});
  await p.evaluate(()=>RoomTV.dbg().dbg.enter(0));await p.keyboard.down('ArrowUp');await p.waitForTimeout(500);await p.keyboard.up('ArrowUp');await p.screenshot({path:dir+'room-game.png'});assert(await p.evaluate(()=>{let found=false;House.scene.traverse(o=>{if(o.material?.map?.userData?.jackLive&&o.material.map.image===RoomTV.dbg().cv)found=true});return found}),'Physical screen uses the cartridge canvas');
  if(!before){
   await p.evaluate(()=>{const buttons=Array.from({length:16},()=>({pressed:false,value:0}));window.sneakPad={id:'Review standard pad',index:0,connected:true,mapping:'standard',buttons,axes:[1,0,0,0]};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[sneakPad]});window.sneakX=RoomTV.dbg().dbg.P.x});
   await f.until(()=>GameInput.mode==='gamepad'&&RoomTV.dbg().dbg.P.x>sneakX+.3);await p.evaluate(()=>{sneakPad.axes[0]=0;sneakPad.buttons[9]={pressed:true,value:1}});await f.until(()=>RoomTV.dbg().dbg.paused);await p.evaluate(()=>sneakPad.buttons[9]={pressed:false,value:0});await p.waitForTimeout(250);await p.screenshot({path:dir+'gamepad-pause.png'});
   const time=await p.evaluate(()=>RoomTV.dbg().dbg.S.st.t);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>RoomTV.dbg().dbg.S.st.t),time);
   await p.evaluate(()=>sneakPad.buttons[9]={pressed:true,value:1});await f.until(()=>!RoomTV.dbg().dbg.paused);await p.evaluate(()=>{sneakPad.buttons[9]={pressed:false,value:0};sneakPad.buttons[4]={pressed:true,value:1}});await f.until(()=>RoomTV.dbg().dbg.mode==='equipment');await p.evaluate(()=>sneakPad.buttons[4]={pressed:false,value:0});await f.until(()=>!RoomTV.dbg().held('l'));await p.screenshot({path:dir+'gamepad-equipment.png'});
   await p.evaluate(()=>sneakPad.buttons[1]={pressed:true,value:1});await f.until(()=>RoomTV.dbg().dbg.mode==='play');await p.evaluate(()=>sneakPad.buttons[1]={pressed:false,value:0});await f.until(()=>!RoomTV.dbg().held('b'));await p.evaluate(()=>sneakPad.buttons[5]={pressed:true,value:1});await f.until(()=>RoomTV.dbg().dbg.P.look);await p.evaluate(()=>sneakPad.buttons[5]={pressed:false,value:0});await f.until(()=>!RoomTV.dbg().held('r'));await p.screenshot({path:dir+'gamepad-look.png'});await p.evaluate(()=>sneakPad.buttons[5]={pressed:true,value:1});await f.until(()=>!RoomTV.dbg().dbg.P.look);await p.evaluate(()=>{sneakPad.buttons[5]={pressed:false,value:0};sneakPad.connected=false});
   await p.keyboard.press('Enter');await f.until(()=>RoomTV.dbg().dbg.paused);await p.evaluate(()=>RoomTV.dbg().dbg.save());
   const pos=await p.evaluate(()=>({x:RoomTV.dbg().dbg.P.x,z:RoomTV.dbg().dbg.P.z}));await p.reload({waitUntil:'domcontentloaded'});await f.until(()=>window.AccountGate?.allowed&&window.House?.live&&window.RoomTV?._dbg()?.st==='game'&&!!RoomTV.dbg()?.dbg&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
   assert(await p.evaluate(pos=>RoomTV.lockIn()&&RoomTV.dbg().dbg.paused&&RoomTV.dbg().dbg.P.x===pos.x&&RoomTV.dbg().dbg.P.z===pos.z,pos),'Production refresh preserves cartridge pose, pause and LOCK IN');await p.screenshot({path:dir+'room-refresh.png'});
   await p.keyboard.press('Escape');await f.until(()=>HousePause.open);const frame=await p.evaluate(()=>RoomTV.dbg().frame);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>RoomTV.dbg().frame),frame,'Esc freezes cartridge');await p.screenshot({path:dir+'house-pause.png'});await p.keyboard.press('Escape');await f.until(()=>!HousePause.open);
   await p.keyboard.press('Enter');await f.until(()=>!RoomTV.dbg().dbg.paused);await p.keyboard.press('t');await f.until(()=>!RoomTV.lockIn());await p.screenshot({path:dir+'in-room-play.png'});await p.keyboard.press('q');await f.until(()=>House.mode==='walk'&&!House.gliding);assert(await p.evaluate(()=>RoomTV._dbg().background),'Q keeps cartridge running on the telly');await p.screenshot({path:dir+'lean-back.png'});
  }
  assert.deepEqual(f.errors,[]);console.log(before?'BASELINE ROOM PASS: physical telly, LOCK IN':'DESKTOP ROOM PASS: physical telly, LOCK IN, Q, Esc, standard gamepad, production refresh');
 }finally{await browser.close();browser=null}
 if(!before)await phone();
}
async function phone(){
 const account='SPhone'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,width:390,height:844,touch:true,storage:{jhp_touch_slow_asked:true},contextOptions:{isMobile:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (Linux; Android 9) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'}});browser=f.browser;p=f.page;
 try{
  await playCase(f,'ps.sneak');await f.until(()=>!!RoomTV.dbg()?.dbg);const cdp=await p.context().newCDPSession(p);
  const press=async selector=>{const r=await p.locator(selector).boundingBox();assert(r,selector);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});await p.waitForTimeout(160);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250)};
  await press('.rm-tools .rm-lock');await f.until(()=>RoomTV.lockIn());await p.evaluate(()=>RoomTV.dbg().dbg.enter(0));await p.waitForTimeout(1200);
  const r=await p.locator('.rm-pad .rm-dpad').boundingBox();assert(r,'Phone D-pad');const x0=await p.evaluate(()=>RoomTV.dbg().dbg.P.x);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.85,y:r.y+r.height*.5,id:1}]});await f.until(x0=>RoomTV.dbg().dbg.P.x>x0+.3,x0);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await press('.rm-pad [data-b="a"]');await f.until(()=>RoomTV.dbg().dbg.P.low);await press('.rm-pad [data-b="y"]');await f.until(()=>RoomTV.dbg().dbg.P.box);await press('.rm-pad [data-b="start"]');await f.until(()=>RoomTV.dbg().dbg.paused);await p.screenshot({path:dir+'phone-touch-portrait.png'});
  await p.setViewportSize({width:844,height:390});await p.waitForTimeout(900);await p.screenshot({path:dir+'phone-touch-landscape.png'});assert(await p.evaluate(()=>RoomTV.dbg().dbg.paused&&RoomTV.dbg().dbg.P.box),'Rotation keeps game state');
  await press('.rm-pad [data-b="start"]');await f.until(()=>!RoomTV.dbg().dbg.paused);await p.screenshot({path:dir+'phone-touch-play.png'});
  await press('.rm-pad [data-b="l"]');await f.until(()=>RoomTV.dbg().dbg.mode==='equipment');await p.screenshot({path:dir+'phone-touch-equipment.png'});await press('.rm-pad [data-b="b"]');await f.until(()=>RoomTV.dbg().dbg.mode==='play');await press('.rm-pad [data-b="y"]');await f.until(()=>!RoomTV.dbg().dbg.P.box);const darts=await p.evaluate(()=>RoomTV.dbg().dbg.S.darts);await press('.rm-pad [data-b="x"]');await f.until(darts=>RoomTV.dbg().dbg.S.darts<darts,darts);await press('.rm-pad [data-b="r"]');await f.until(()=>RoomTV.dbg().dbg.P.look);await p.screenshot({path:dir+'phone-touch-look.png'});await press('.rm-pad [data-b="r"]');await f.until(()=>!RoomTV.dbg().dbg.P.look);await p.setViewportSize({width:768,height:1024});await p.waitForTimeout(800);await p.screenshot({path:dir+'tablet-touch-game.png'});await press('.rm-tools .rm-lock');await f.until(()=>!RoomTV.lockIn()&&!House.gliding);await p.screenshot({path:dir+'tablet-in-room.png'});await cdp.detach();assert.deepEqual(f.errors,[]);console.log('PHONE PASS: controller movement, crawl/box, pause, rotation, equipment, darts, optics and tablet framing');
 }finally{await browser.close();browser=null}
}
