// Bounce Quest cartridge + physical-screen regression. Disposable localhost only.
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const base=process.argv.find(a=>/^http:/.test(a));
assert(base&&['localhost','127.0.0.1'].includes(new URL(base).hostname),'Supply throwaway localhost URL');
const before=process.argv.includes('--before'),dir=path.join(__dirname,'../shots/games/hop',before?'before':'after');
await mkdir(dir,{recursive:true});
const source=before?execFileSync('git',['show','HEAD:app/public/js/rm-g-hop.js'],{cwd:path.join(__dirname,'../..'),encoding:'utf8'}):await readFile(path.join(__dirname,'../../app/public/js/rm-g-hop.js'),'utf8');
let browser,p;const errors=[];
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{console.error('HOP '+signal);Promise.resolve(browser?.close()).finally(()=>process.exit(1))});
const watchdog=setTimeout(()=>{console.error('HOP timeout');Promise.resolve(browser?.close()).finally(()=>process.exit(1))},1100000);
const D=(fn,arg)=>p.evaluate(fn,arg),frames=n=>D(n=>review.step(n),n);
const key=async k=>{await p.keyboard.down(k);await frames(1);await p.keyboard.up(k);await frames(1)};
const hold=async(k,n)=>{await p.keyboard.down(k);await frames(n);await p.keyboard.up(k);await frames(1)};
const state=()=>D(()=>{const d=__hopDbg;return{mode:d.mode,w:d.world,paused:d.paused,P:{x:d.P.x,y:d.P.y,z:d.P.z,st:d.P.st,gnd:d.P.gnd,hp:d.P.hp},count:Object.keys(d.prog.got).length+Object.values(d.prog.ac).reduce((n,a)=>n+Object.keys(a).length,0)}});
async function shot(name){await D(()=>review.game.draw());await p.screenshot({path:path.join(dir,name+'.png')});const data=await D(()=>{review.game.draw();const c=document.createElement('canvas');c.width=320;c.height=240;const g=c.getContext('2d');g.drawImage(review.K.cv,0,0);g.drawImage(review.K.hud.canvas,0,0);return c.toDataURL().split(',')[1]});await writeFile(path.join(dir,name+'-native.png'),Buffer.from(data,'base64'));console.log('SHOT '+name)}
function runner(restoring){
 const cv=document.createElement('canvas'),hc=document.createElement('canvas');for(const c of [cv,hc]){c.width=320;c.height=240;Object.assign(c.style,{position:'absolute',width:'100%',height:'100%',imageRendering:'pixelated'});document.querySelector('#screen').append(c)}
 const held={},pressed={},map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',z:'a',x:'b',c:'c',Enter:'start',u:'l',e:'r'};
 addEventListener('keydown',e=>{const b=map[e.key];if(b){if(!held[b])pressed[b]=true;held[b]=true;e.preventDefault()}},true);addEventListener('keyup',e=>{if(map[e.key])held[map[e.key]]=false},true);
 const K={cv,hud:hc.getContext('2d'),W:320,H:240,font:RoomTV.font,t:0,frame:0,restoring,stick:()=>({x:(held.right?1:0)-(held.left?1:0),y:(held.down?1:0)-(held.up?1:0)}),label:b=>({a:'Z',b:'X',c:'C',l:'U',r:'E',start:'ENTER'}[b]||b.toUpperCase()),any:()=>Object.values(pressed).some(Boolean),held:b=>!!held[b],pressed:b=>!!pressed[b],rnd:seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296},load:()=>JSON.parse(localStorage.getItem('hop-review')||'null'),save:s=>{localStorage.setItem('hop-review',JSON.stringify(s));return true},resume:()=>{K.restoring=false},secret:()=>{},music:s=>{K.song=s},over:(score,options)=>{K.result={score,...options}},sfx:{tone(){},seq(){},noise(){}},three:o=>K._three||(K._three=RoomTV.make3d(K,o))};
 window.review={K,game:RoomTV.defs['n64.hop'].make(K),step(n){for(let i=0;i<n;i++){this.game.update(1/60);K.frame++;K.t+=1/60;for(const k in pressed)delete pressed[k]}this.game.draw()}};
}
async function native(restoring=false){
 await p.goto(base+'/__hop-review');await D(()=>{window.Room={_:{esc:s=>s}}});
 for(const src of ['vendor/three.min.js','js/cast.js','js/rm-tv.js','js/rm-3d.js'])await p.addScriptTag({url:base+'/'+src});
 await D(()=>Cast.bind('hop-review',{first:'Robin',g:'f'}));await p.addScriptTag({content:source});await p.evaluate(runner,restoring);await frames(restoring?0:90);
}
async function world(w){await D(w=>__hopDbg.go(w),w);await frames(1)}
async function at(x,y,z){await D(a=>__hopDbg.tp(...a),[x,y,z]);await frames(1)}
async function walkTo(x,z,max=450){
 for(let i=0;i<max;i++){
  const v=await D(({x,z})=>{const P=__hopDbg.P,c=review.K._three.cam,a=c.matrixWorld.elements,dx=x-P.x,dz=z-P.z;return{d:Math.hypot(dx,dz),x:dx*a[0]+dz*a[2],y:-(dx*a[8]+dz*a[10]),mode:__hopDbg.mode}},{x,z});
  if(v.d<.45||v.mode!=='play')return;
  const keys=[];if(Math.abs(v.x)>.25*Math.abs(v.y))keys.push(v.x>0?'ArrowRight':'ArrowLeft');if(Math.abs(v.y)>.25*Math.abs(v.x))keys.push(v.y>0?'ArrowUp':'ArrowDown');
  for(const k of keys)await p.keyboard.down(k);await frames(3);for(const k of keys)await p.keyboard.up(k);
 }
 throw Error('Walk route blocked at '+JSON.stringify(await state())+' toward '+x+','+z);
}
async function win(name){assert.equal((await state()).mode,'win','Natural acorn pickup');await shot(name+'-get');for(let i=0;i<3;i++){await frames(8);await shot(name+'-sequence-'+i)}await frames(60);await shot(name+'-pose');await frames(150);assert.equal((await state()).mode,'play')}
async function perf(w){return D(w=>{
 const d=__hopDbg,k=review.K;d.go(w);const t=k._three,gl=t.ren.getContext(),px=new Uint8Array(4),a=[],updates=[];
 for(let i=0;i<180;i++){const s=performance.now();review.game.update(1/60);k.t+=1/60;k.frame++;const u=performance.now();review.game.draw();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);if(i>=60){a.push(performance.now()-s);updates.push(u-s)}}
 a.sort((a,b)=>a-b);updates.sort((a,b)=>a-b);
 const pixels=new Uint8Array(320*240*4);gl.readPixels(0,0,320,240,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
 const hist=new Uint32Array(4096),luma=new Uint32Array(256),ys=new Uint8Array(320*240);let edges=0,n=ys.length;
 for(let i=0;i<n;i++){const r=pixels[i*4],g=pixels[i*4+1],b=pixels[i*4+2],y=Math.round(r*.2126+g*.7152+b*.0722);hist[(r>>4)*256+(g>>4)*16+(b>>4)]++;luma[y]++;ys[i]=y;if(i%320&&Math.abs(y-ys[i-1])>20)edges++}
 let entropy=0,dominant=0,cumulative=0,lo=0,hi=255;
 for(const count of hist)if(count){const p=count/n;entropy-=p*Math.log2(p);dominant=Math.max(dominant,p)}
 for(let i=0;i<256;i++){cumulative+=luma[i];if(cumulative<n*.05)lo=i;if(cumulative<n*.95)hi=i}
 const mats=new Set();t.scene.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m)});
 const ext=gl.getExtension('WEBGL_debug_renderer_info');
 return{world:w,median:a[60],p95:a[114],updateMedian:updates[60],updateP95:updates[114],calls:t.ren.info.render.calls,triangles:t.ren.info.render.triangles,geometries:t.ren.info.memory.geometries,textures:t.ren.info.memory.textures,materials:mats.size,programs:t.ren.info.programs.length,dpr:t.ren.getPixelRatio(),postPasses:0,shadowMaps:t.ren.shadowMap.enabled,metrics:{colorEntropyBits:entropy,dominantColorShare:dominant,edgeDensity:edges/(n-240),luminanceContrastP95P05:hi-lo},renderer:ext&&gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),scope:'320x240 update + draw + synchronous GPU readback, 60 warmup + 120 samples; house excluded; scene-only quantized RGB pixel diagnostics'};
},w)}

try{
 if(!process.argv.includes('--room-only')&&!process.argv.includes('--phone-only')){
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});p=await browser.newPage({viewport:{width:1366,height:860}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
  await p.route('**/__hop-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Jack Attack 1999</title><link rel="icon" href="data:,"><body style="margin:0;background:#10152a"><div id="screen" style="position:absolute;width:min(96vw,128vh);aspect-ratio:4/3;left:50%;top:50%;transform:translate(-50%,-50%)"></div>'}));
  await native();
  if(!process.argv.includes('--bench')){if(process.argv.includes('--feel-only')||process.argv.includes('--boss-only')||process.argv.includes('--trials-only')||process.argv.includes('--edges-only')){await key('Enter');await key('z');await frames(45);await key('z');if(process.argv.includes('--boss-only'))await bossFight();else if(process.argv.includes('--trials-only'))await trials();else if(process.argv.includes('--edges-only')){await enemiesAndPuzzles();await doorAndTitleEdges();await gameOverEdge()}else await improvements()}else await playthrough()}
  if(!['--feel-only','--trials-only','--boss-only','--edges-only'].some(a=>process.argv.includes(a))){const stats=[];for(const w of ['hub','cove','peaks','manor','tower','boss'])stats.push(await perf(w));await writeFile(path.join(dir,process.argv.includes('--bench')?'paired-performance.json':'performance.json'),JSON.stringify(stats,null,2));console.log('PERFORMANCE '+JSON.stringify(stats));}
  await browser.close();browser=null;
 }
 if(!process.argv.includes('--native')&&!process.argv.includes('--bench')){if(process.argv.includes('--phone-only'))await phone();else await room();}
 assert.deepEqual(errors,[],'Browser errors');console.log('HOP '+(before?'BEFORE':'AFTER')+' PASS');
}catch(e){if(p&&!p.isClosed()){console.log('FAIL STATE',await state().catch(()=>({unavailable:true})));await shot('failure').catch(()=>{})}throw e}finally{clearTimeout(watchdog);await browser?.close()}
async function playthrough(){
 assert.equal((await state()).mode,'title');await shot('title');await frames(750);assert.equal((await state()).mode,'attract');await shot('attract');await key('Enter');await key('Enter');await shot('menu');await key('z');assert.equal((await state()).mode,'card');await shot('hub-card');await frames(45);await key('z');assert.equal((await state()).mode,'play');await shot('hub-start');
 const z0=(await state()).P.z;await hold('ArrowUp',35);assert((await state()).P.z<z0-1);await shot('hub-movement');
 await walkTo(6,20);await walkTo(0,10);await walkTo(.8,5);await walkTo(3.57,3.14);await frames(70);assert.equal((await state()).w,'cove');assert.equal((await state()).mode,'card');await shot('cove-card');await frames(45);await key('z');await shot('cove-start');await hold('ArrowUp',75);await shot('cove-mid');
 // Staging here avoids a slow full climb; acorns are awarded by real collision only.
 await at(0,9.2,-8);await frames(1);await win('sandcastle');assert.equal((await state()).count,1);
 await key('Enter');const pose=await state();await frames(90);assert.deepEqual((await state()).P,pose.P,'Pause freezes player');await shot('pause');
 if(!before){await native(true);assert.equal((await state()).w,'cove');assert((await state()).paused,'Refresh keeps pause');assert.deepEqual((await state()).P,pose.P,'Refresh keeps pose');assert.equal((await state()).count,1);await shot('refresh-paused');await key('Enter')}
 else await key('Enter');
 await world('hub');for(const id of ['hill','pond']){const a=await D(id=>{const a=__hopDbg.ACS().find(a=>a.id===id);return{x:a.x,y:a.y,z:a.z}},id);await at(a.x,a.y-.6,a.z);await win('hub-'+id)}assert.equal((await state()).count,3);
 // Door 2 is now genuinely unlocked by three pickups.
 await at(-.8,3,3.8);await walkTo(.31,.1);await frames(70);assert.equal((await state()).w,'peaks');await shot('peaks-card');await frames(45);await key('z');await shot('peaks-start');await hold('ArrowUp',65);await shot('peaks-mid');
 for(const w of ['manor','tower','boss']){await world(w);await shot(w+'-start');await hold('ArrowUp',40);await shot(w+'-mid')}
 await world('cove');await at(12,2,-21);await p.keyboard.down('ArrowRight');await key('z');await frames(16);await shot('wall-contact');await key('z');await frames(5);await shot('wall-kick');await p.keyboard.up('ArrowRight');
 await world('hub');await key('Enter');await key('ArrowDown');await key('ArrowDown');await key('z');await frames(70);assert.equal((await state()).mode,'title');await key('Enter');await shot('continue-menu');await key('z');assert.equal((await state()).mode,before?'card':'play');if(before){await frames(45);await key('z')}assert.equal((await state()).count,3);await shot('continue-hub');
 if(!before)await improvements();else await baselineFeel();
 console.log('FLOW PASS: title, attract, hub input, real Cove/Peaks doors, 3 pickups, pause, continue'+(!before?', refresh':''));
}
async function baselineFeel(){
 await world('cove');await faceAt(-27,25);const jumps=[];await p.keyboard.down('ArrowUp');await frames(15);
 for(let i=0;i<3;i++){await p.keyboard.down('z');await frames(1);jumps.push((await state()).P.st);await frames(10);await shot('jump-attempt-'+i);await p.keyboard.up('z');await untilFrame(()=>__hopDbg.P.gnd,120);await frames(8)}await p.keyboard.up('ArrowUp');
 await faceAt(-27,25);await p.keyboard.down('ArrowUp');await frames(18);await p.keyboard.down('c');await frames(7);await key('z');const grace=(await state()).P.st;await shot('crouch-jump-grace');await p.keyboard.up('c');await p.keyboard.up('ArrowUp');
 await faceAt(-27,25);await p.keyboard.down('ArrowUp');await frames(18);await p.keyboard.down('c');await key('z');await frames(10);await shot('long-jump');await p.keyboard.up('c');await p.keyboard.up('ArrowUp');
 await faceAt(-20,25);const yaw=await D(()=>{const P=__hopDbg.P,c=review.K._three.cam;return Math.atan2(c.position.x-P.x,c.position.z-P.z)});await hold('ArrowRight',45);const turn=await D(yaw=>{const P=__hopDbg.P,c=review.K._three.cam;return Math.atan2(c.position.x-P.x,c.position.z-P.z)-yaw},yaw);await shot('camera-strafe');
 await world('tower');await faceAt(3,0,0,56);for(let i=0;i<8;i++){await key('u');await frames(24);if(i%2===0)await shot('camera-tower-3-0-'+i)}
 await writeFile(path.join(dir,'movement.json'),JSON.stringify({delayedJumpAttempts:jumps,crouchGraceMove:grace,strafeCameraTurnRadians:turn},null,2));console.log('BASELINE FEEL '+JSON.stringify({jumps,grace,turn}));
}
async function untilFrame(fn,max=600){for(let i=0;i<max;i++){if(await D(fn))return;await frames(1)}throw Error('Frame condition timed out: '+fn)}
async function faceAt(x,z,a=0,y=99){await D(({x,z,a,y})=>{__hopDbg.P.face=a;__hopDbg.tp(x,y,z)},{x,z,a,y});await frames(1)}
function layout(){return D(()=>{const s=__hopDbg.solids();return{boxes:s.boxes.filter(b=>!b.mv).map(b=>[b.x,b.y,b.z,b.hw,b.hh,b.hd,b.ry]),cyls:s.cyls.filter(c=>!c.mv).map(c=>[c.x,c.y0,c.y1,c.z,c.r])}});}
async function suspend(name){
 const scenery=await layout();
 await D(()=>__hopDbg.save());const s=await D(()=>review.K.load().run),count=(await state()).count;
 await native(true);assert.deepEqual(await layout(),scenery,name+' restores cold-cache scenery');const r=await D(()=>__hopDbg.snapshot());
 for(const k of ['w','time','random','player','plat','visit','mode','paused','pauseI','card','win','winT','endT','overT','result','enemies','visuals','gotCoins','reds','lives','acorns','chestOpen','plugOut','bossDown','raceWon','props','lamps','trial','motionClock','mission','boss','boo','race','snow','dlg','fade'])assert.deepEqual(r[k],s[k],name+' restores '+k);
 assert.equal((await state()).count,count);await shot('refresh-'+name);
}
async function improvements(){
 await world('cove');await faceAt(-7,25);await key('x');assert.equal((await state()).mode,'dlg');assert(await D(()=>__hopDbg.snapshot().dlg.name===Cast.n('sister').toUpperCase()),'Course guide uses the account Cast');await frames(90);await shot('cast-course-dialogue');await suspend('cast-dialogue');
 // Each takeoff uses real keys; an eight-frame landing gap is deliberate.
 await world('cove');await faceAt(-27,25);await p.keyboard.down('ArrowUp');await frames(15);
 for(const move of ['jump','jump2','jump3']){
  await p.keyboard.down('z');await frames(1);assert.equal((await state()).P.st,move,'Jump chain '+move);await frames(10);await shot(move+'-rise');await p.keyboard.up('z');await untilFrame(()=>__hopDbg.P.gnd);await shot(move+'-land');await frames(8);
 }
 await p.keyboard.up('ArrowUp');assert(await D(()=>__hopDbg.P.chainT===0));
 await faceAt(-27,24);await p.keyboard.down('ArrowUp');await frames(18);await p.keyboard.down('c');await frames(7);await p.keyboard.down('z');await frames(1);assert.equal((await state()).P.st,'long','Crouch remembers running speed briefly');const takeoff=await state();await frames(12);await shot('long-jump-rise');await p.keyboard.up('z');await p.keyboard.up('c');await frames(20);assert(Math.hypot((await state()).P.x-takeoff.P.x,(await state()).P.z-takeoff.P.z)>4.5,'Long jump covers ground');await p.keyboard.up('ArrowUp');await shot('long-jump-flight');
 // A true ledge departure gets 100 ms grace; pressing early on descent is buffered.
 await faceAt(-.5,-6,0,9.2);await p.keyboard.down('ArrowRight');await untilFrame(()=>!__hopDbg.P.gnd,60);await frames(3);await key('z');assert.equal((await state()).P.st,'jump','Coyote jump, not an aerial twirl');await p.keyboard.up('ArrowRight');await shot('coyote-jump');
 await faceAt(-25,22);await D(()=>{__hopDbg.air(-25,__hopDbg.WORLDS.cove.ground(-25,22)+.45,22);__hopDbg.P.vy=-5;__hopDbg.P.coyote=0});await key('z');await untilFrame(()=>__hopDbg.P.st==='jump',30);await shot('buffered-landing-jump');
 // Turn-free strafe: the camera cannot rotate camera-relative axes under a held direction.
 await faceAt(-20,25);const yaw=await D(()=>__hopDbg.C.yaw);await hold('ArrowRight',45);assert(Math.abs(await D(()=>__hopDbg.C.yaw)-yaw)<.01,'Strafing does not steer the camera');await shot('stable-strafe');
 // Wall kicks are possible on both sides of the original narrow chimney.
 await faceAt(14.7,-21,Math.PI/2);await p.keyboard.down('ArrowUp');await key('z');await untilFrame(()=>__hopDbg.P.wallT>0,40);await key('z');assert.equal((await state()).P.st,'wallkick');await p.keyboard.up('ArrowUp');await p.keyboard.down('ArrowDown');await untilFrame(()=>__hopDbg.P.wallT>0&&__hopDbg.P.wallLock===0,80);await key('z');assert.equal((await state()).P.st,'wallkick');assert(await D(()=>__hopDbg.visit.kicks>=2));await shot('successive-wall-kicks');await p.keyboard.up('ArrowDown');
 // Analytic camera checks + visible orbit captures at the main obstruction families.
 for(const [w,x,z,y] of [['cove',6.2,-8,1.5],['manor',-26,10,99],['tower',0,10.5,0],['hub',18,-12.9,99],['hub',-1.4,24,99],['manor',-2.5,-7.9,99],['tower',3,0,56]]){
  await world(w);await faceAt(x,z,0,y);
  for(let i=0;i<8;i++){
   await key('u');await frames(24);
   const v=await D(()=>{const c=review.K._three.cam,P=__hopDbg.P,q=new THREE.Vector3(P.x,P.y+.8,P.z).project(c);return{x:q.x,y:q.y,z:q.z,distance:c.position.distanceTo(new THREE.Vector3(P.x,Math.max(P.y+.8,__hopDbg.C.ty+1.1),P.z)),room:__hopDbg.cameraRoom(P.x,Math.max(P.y+.8,__hopDbg.C.ty+1.1),P.z,c.position.x,c.position.y,c.position.z)}});
   assert(v.z<1&&Math.abs(v.x)<.25&&Math.abs(v.y)<.9,'Camera keeps player visible '+w+': '+JSON.stringify(v));assert(v.distance>3.5,'Camera has room to frame the full player '+w+': '+JSON.stringify(v));assert(v.room>.96,'Boom remains clear '+w+': '+JSON.stringify(v));
   if(i%2===0)await shot('camera-'+w+'-'+x+'-'+z+'-'+i);
  }
 }
 // Paused moving platforms and their riders remain fixed, even across a reload.
 await world('tower');await D(()=>{const m=__hopDbg.solids().movers.find(m=>m.k==='box');__hopDbg.P.face=0;__hopDbg.tp(m.x,m.y+m.hh,m.z);__hopDbg.P.plat=m});await frames(12);await key('Enter');const time=await D(()=>__hopDbg.clock),pose=await state(),movers=await D(()=>__hopDbg.solids().movers.map(m=>[m.x,m.y,m.z,m.ry,m.y1]));await frames(240);assert.equal(await D(()=>__hopDbg.clock),time);assert.deepEqual((await state()).P,pose.P);assert.deepEqual(await D(()=>__hopDbg.solids().movers.map(m=>[m.x,m.y,m.z,m.ry,m.y1])),movers);await suspend('moving-platform-paused');await key('Enter');await frames(1);assert(await D(t=>__hopDbg.clock<t+.04,time),'No phase jump after pause');
 // Save in flight, a world entrance, the reward pose, an open chest and cleared ice plug.
 await world('cove');await faceAt(-24,24);await p.keyboard.down('z');await frames(10);await p.keyboard.up('z');await suspend('mid-jump');
 await world('cove');await faceAt(24.8,12,0,14.35);await key('z');await frames(12);await key('c');await untilFrame(()=>__hopDbg.props()[0].open>0,120);await shot('chest-ground-pound');await suspend('open-chest');await at(24.8,14.8,12);await win('captain-chest');
 await world('peaks');const plug=await D(()=>{const p=__hopDbg.props().find(p=>p.kind==='plug');return{x:p.b.x,y:p.b.y+p.b.hh,z:p.b.z}});await faceAt(plug.x,plug.z,0,plug.y);await key('z');await frames(12);await key('c');await untilFrame(()=>!__hopDbg.props().find(p=>p.kind==='plug').m.visible,100);await shot('ice-plug-pound');await suspend('ice-plug');
 await enemiesAndPuzzles();await doorAndTitleEdges();await trials();await bossFight();await gameOverEdge();
 assert(await D(()=>JSON.stringify(review.K.load()).length<19500),'Suspension remains in roaming-save budget');
 await p.setViewportSize({width:1280,height:720});await shot('desktop-1280');await p.setViewportSize({width:1920,height:1080});await shot('desktop-1920');await p.setViewportSize({width:1366,height:860});
 console.log('DEPTH PASS: delayed triple jump, long jump, coyote, buffered jump, successive wall kicks, camera orbits, platform pause/refresh, chest, plug, boss, credits');
}
async function enemiesAndPuzzles(){
 await world('manor');await faceAt(0,-20,0,0);assert((await state()).P.z>-13.7,'Exact-centre box overlap escapes');
 await world('hub');const centre=await D(()=>{const c=__hopDbg.solids().cyls.find(c=>Math.abs(c.x+3)<.01&&Math.abs(c.z-24)<.01);return{x:c.x,z:c.z,y:c.y0,r:c.r}});await faceAt(centre.x,centre.z,0,centre.y);assert(Math.hypot((await state()).P.x-centre.x,(await state()).P.z-centre.z)>=centre.r+.4,'Exact-centre cylinder overlap escapes');
 for(const w of ['hub','cove','peaks','manor','tower']){
  await world(w);assert(await D(()=>__hopDbg.ENS().every(e=>Number.isFinite(e.y)&&Number.isFinite(e.mesh.position.y))),'Enemy heights are finite in '+w);
  if(w!=='hub')assert(await D(()=>__hopDbg.coins().length+__hopDbg.reds().length*2+__hopDbg.ENS().length*2>=100),'100-coin goal has enough real coins in '+w);
 }
 await world('hub');let e=await D(()=>{const e=__hopDbg.ENS()[0];return{x:e.x,y:e.y,z:e.z}});await faceAt(e.x,e.z+1.6,0,e.y);await key('x');assert(await D(()=>!__hopDbg.ENS()[0].alive),'Real punch defeats grounded enemy');await shot('grumpy-punch');await suspend('enemy-defeat');
 e=await D(()=>{const e=__hopDbg.ENS()[1];return{x:e.x,y:e.y,z:e.z}});const hp=(await state()).P.hp;await at(e.x,e.y,e.z);assert((await state()).P.hp<hp,'Enemy contact hurts');assert(await D(()=>__hopDbg.P.inv>0&&__hopDbg.P.hp>0));await frames(3);await shot('damage-silhouette');
 await world('manor');const lamps=await D(()=>__hopDbg.lamps().map(l=>({x:l.x,z:l.z})));
 for(let i=0;i<lamps.length;i++){await faceAt(lamps[i].x,lamps[i].z);if(i===1){await key('Enter');await suspend('two-lanterns');await key('Enter')}}
 assert(await D(()=>__hopDbg.lamps().every(l=>l.lit)));const a=await D(()=>{const a=__hopDbg.ACS().find(a=>a.id==='lamps');return{x:a.x,y:a.y,z:a.z}});await at(a.x,a.y-.6,a.z);await win('four-lanterns');
 // The graveyard encounter is fought with real punches, including its shy/invulnerable phases.
 await world('manor');await faceAt(20,18);await untilFrame(()=>__hopDbg.mode==='dlg',30);await shot('boohoo-intro');for(let i=0;i<6;i++)await key('z');assert.equal(await D(()=>__hopDbg.BB.st),'fight');
 for(let i=0;i<3;i++){
  await untilFrame(()=>__hopDbg.BB.inv<=0,180);const b=await D(()=>({x:__hopDbg.BB.x,z:__hopDbg.BB.z,hp:__hopDbg.BB.hp}));await faceAt(b.x,b.z+3,0,0);await key('x');assert.equal(await D(()=>__hopDbg.BB.hp),b.hp-1);await shot('boohoo-hit-'+i);if(i===0)await suspend('boohoo-fight');
 }
 await untilFrame(()=>__hopDbg.BB.st==='gone',100);await at(20,0,14);await win('boohoo');
}
async function doorAndTitleEdges(){
 await world('hub');const d=await D(()=>{const d=__hopDbg.doors()[0];return{x:d.x,z:d.z,fx:d.fx,fz:d.fz,y:d.y}});await faceAt(d.x+d.fx*2,d.z+d.fz*2,Math.atan2(d.fx,d.fz),d.y);await p.keyboard.down('ArrowUp');await untilFrame(()=>!!__hopDbg.fading,100);await p.keyboard.up('ArrowUp');await suspend('door-closing');await untilFrame(()=>__hopDbg.fading?.done,40);await suspend('door-opening');await frames(60);assert.equal((await state()).w,'cove');assert.equal((await state()).mode,'card');await key('ArrowDown');await shot('objective-card');const sel=await D(()=>__hopDbg.ui.card.sel);await suspend('objective-card');assert.equal(await D(()=>__hopDbg.ui.card.sel),sel);await key('z');
 // Title options and attract scenery must leave the suspended course record intact.
 await key('Enter');await key('ArrowDown');await key('ArrowDown');await key('ArrowDown');await key('z');await frames(60);assert.equal((await state()).mode,'title');await key('Enter');const saved=await D(()=>review.K.load().run);await key('ArrowDown');await key('z');await shot('erase-confirmation');await suspendTitle('erase-menu');await key('x');assert.equal((await state()).count,Object.keys((await D(()=>__hopDbg.prog.got))).length+Object.values(await D(()=>__hopDbg.prog.ac)).reduce((n,a)=>n+Object.keys(a).length,0));await key('ArrowDown');await key('ArrowDown');await key('z');await shot('options');await key('z');await key('z');await key('x');assert.deepEqual(await D(()=>review.K.load().run),saved,'Options do not replace the suspended run');
 await key('ArrowUp');await key('z');await shot('how-to-1');await key('z');await shot('how-to-2');await key('x');await key('ArrowDown');await key('ArrowDown');await key('z');await shot('cast-high-scores');await key('x');
 await D(()=>__hopDbg.title());const score=await D(()=>__hopDbg.prog.score);await frames(900);assert.equal((await state()).mode,'attract');await shot('saved-file-attract');await frames(1750);assert.equal(await D(()=>__hopDbg.prog.score),score,'Attract cannot earn score');assert.deepEqual(await D(()=>review.K.load().run),saved,'Attract does not replace run');
 await key('Enter');if(!await D(()=>__hopDbg.ui.started))await key('Enter');await key('z');assert.equal((await state()).w,'cove');assert.equal((await state()).mode,'play');
}
async function suspendTitle(name){await D(()=>__hopDbg.save());const s=await D(()=>review.K.load());await native(true);assert.deepEqual(await D(()=>review.K.load()),s);await shot('refresh-'+name)}
async function gameOverEdge(){
 await world('hub');await D(()=>{__hopDbg.prog.lives=0;__hopDbg.P.hp=1;__hopDbg.air(65,-2,0)});await frames(1);assert.equal((await state()).P.st,'dead');await suspend('death');await frames(150);assert.equal((await state()).mode,'over');await frames(230);const result=await D(()=>review.K.result);assert(result&&result.title==='GAME OVER');await shot('game-over');await suspend('game-over');assert.deepEqual(await D(()=>review.K.result),result,'Result overlay is reconstructed without resubmitting');
 const count=(await state()).count;await D(()=>__hopDbg.title());await key('Enter');await key('z');assert.equal((await state()).mode,'card');assert.equal((await state()).w,'hub');await frames(50);await key('z');assert.equal((await state()).count,count,'Continue after exhausted lives preserves acorns');assert.equal(await D(()=>__hopDbg.prog.lives),4);await shot('continue-after-game-over');
}
async function bossFight(){
 await D(()=>__hopDbg.prog.opt.mus=0);await world('boss');await faceAt(0,12,0,2);await frames(2);assert.equal((await state()).mode,'dlg');await shot('boss-intro');await suspend('boss-dialogue');
 for(let i=0;i<6;i++)await key('z');assert.equal((await state()).mode,'play');assert.equal(await D(()=>review.K.song),null,'Boss respects music off');
 for(let hit=0;hit<3;hit++){
  // A real pillar top is a safe observation perch. Stage there between encounters.
  await faceAt(Math.sin(4*Math.PI/4+.2)*15.8,Math.cos(4*Math.PI/4+.2)*15.8,0,6.5);
  // The boss still performs its whole walk/stomp/charge cycle and bonks real geometry.
  for(let i=0;i<2500;i++){
   const s=await D(()=>({st:__hopDbg.BOSS.st,t:__hopDbg.BOSS.t,x:__hopDbg.BOSS.x,z:__hopDbg.BOSS.z,d:Math.hypot(__hopDbg.P.x-__hopDbg.BOSS.x,__hopDbg.P.z-__hopDbg.BOSS.z)}));if(s.st==='dizzy')break;
   if(s.d<7&&s.st!=='charge'){const a=(Math.round((Math.atan2(s.x,s.z)-.2)/(Math.PI/4))+4)*Math.PI/4+.2;await faceAt(Math.sin(a)*15.8,Math.cos(a)*15.8,0,6.5)}
   await frames(1);assert.notEqual((await state()).P.st,'dead','Boss evasion survived');if(i===2499)throw Error('Boss never became dizzy');
  }
  const b=await D(()=>({x:__hopDbg.BOSS.x,z:__hopDbg.BOSS.z,hp:__hopDbg.BOSS.hp}));await shot('boss-dizzy-'+hit);if(hit===0)await suspend('boss-dizzy');
  // Backflip toward the head from the floor. No direct damage or boss-state mutation.
  const br=Math.hypot(b.x,b.z)||1;await faceAt(b.x-b.x/br*3.4,b.z-b.z/br*3.4,Math.atan2(b.x,b.z),2);await p.keyboard.down('c');await p.keyboard.down('z');await frames(28);await shot('boss-backflip-'+hit);await p.keyboard.up('z');await p.keyboard.up('c');await untilFrame(()=>__hopDbg.BOSS.st==='hurt'||__hopDbg.BOSS.st==='dead',150);assert.equal(await D(()=>__hopDbg.BOSS.hp),b.hp-1);await shot('boss-hit-'+hit);
  if(hit<2){await faceAt(0,10,0,2);await frames(1)}
 }
 await frames(120);assert(await D(()=>__hopDbg.ACS().find(a=>a.id==='crown').mesh.visible));await shot('crown-revealed');await at(0,2,0);assert.equal((await state()).mode,'win');await suspend('crown-get');await frames(210);assert.equal((await state()).mode,'ending');assert(await D(()=>__hopDbg.prog.boss));await frames(600);await shot('ending-credits');await suspend('credits');await frames(2400);assert.equal((await state()).w,'hub');await shot('ending-return-hub');
}
async function startTrial(w){
 await world(w);const q=await D(()=>__hopDbg.trial.switch);await faceAt(q.x,q.z,0,q.y);await key('z');await frames(12);await key('c');await untilFrame(()=>__hopDbg.trial.st!=='idle',120);await shot('trial-'+w+'-switch');
 await untilFrame(()=>['run','listen'].includes(__hopDbg.trial.st),500);
}
async function trials(){
 // Countdown and timeout are real; a retry must leave acorns and records unchanged.
 await startTrial('cove');await frames(1600);assert.equal(await D(()=>__hopDbg.trial.st),'idle');assert(!await D(()=>__hopDbg.prog.ac.cove?.trial));await shot('buoy-timeout');
 await startTrial('cove');const route=await D(()=>__hopDbg.trial.route);let prev=[32,1.5,4];
 for(let i=0;i<route.length;i++){
  const [x,y,z]=route[i],dx=x-prev[0],dz=z-prev[2],a=Math.atan2(-dx,-dz);
  await faceAt(prev[0],prev[2],a,prev[1]);await p.keyboard.down('ArrowUp');await frames(8);await p.keyboard.down('z');await frames(1);
  await D(i=>review.gate=i,i);await untilFrame(()=>__hopDbg.trial.next>review.gate,90);await shot('buoy-jump-'+i);await p.keyboard.up('z');await p.keyboard.up('ArrowUp');
  if(i===1){await key('Enter');await suspend('buoy-route-paused');await key('Enter')}
  prev=[x,y-1.3,z];
 }
 assert.equal(await D(()=>__hopDbg.trial.st),'done');assert(await D(()=>Number.isFinite(__hopDbg.prog.records.cove)));await at(54,2.6,5);await win('buoy-trial');
 // A downhill run follows the actual packed-snow route, including its corners.
 await startTrial('peaks');
 for(const [x,z] of [[4,-8],[0,-15],[-14.1,-14.1],[-20,0],[-30.5,0],[-21.6,21.6],[0,30.5],[0,48]]){await walkTo(x,z,450);await shot('post-route-'+x+'-'+z)}
 assert.equal(await D(()=>__hopDbg.trial.st),'done');await faceAt(4.5,47);await frames(1);await win('post-run');
 // Three tunes: a wrong bell repeats the current phrase and cannot grant the reward.
 await startTrial('manor');let bells=await D(()=>__hopDbg.trial.def.bells);
 await faceAt(bells[1][0],bells[1][1]+1.2);await key('x');assert.equal(await D(()=>__hopDbg.trial.st),'demo');assert.equal(await D(()=>__hopDbg.trial.round),0);await shot('bell-wrong-note');await suspend('bell-phrase');
 for(let round=0;round<3;round++){
  await untilFrame(()=>__hopDbg.trial.st==='listen',500);const tune=await D(()=>__hopDbg.trial.def.tunes[__hopDbg.trial.round]);await shot('bells-round-'+round);
  for(const i of tune){const [x,z]=bells[i];await faceAt(x,z+1.2);await key('x')}
 }
 assert.equal(await D(()=>__hopDbg.trial.st),'done');await faceAt(0,-9);await win('bell-blues');await inspectTrialModels('bell');
 // Clock slowdown is a saved motion phase, independent from the trial deadline.
 await startTrial('tower');const clock=await D(()=>({c:__hopDbg.clock,m:__hopDbg.snapshot().motionClock}));await frames(60);const later=await D(()=>({c:__hopDbg.clock,m:__hopDbg.snapshot().motionClock}));assert(Math.abs((later.m-clock.m)/(later.c-clock.c)-.35)<.001,'Trial slows clockwork only');
 const gates=await D(()=>__hopDbg.trial.route);
 for(let i=0;i<gates.length;i++){const[x,y,z]=gates[i];await faceAt(x,z,0,y-1.3);await key('z');await D(i=>review.gate=i,i);await untilFrame(()=>__hopDbg.trial.next>review.gate,60);await shot('clock-trial-gate-'+i);if(i===1){await key('Enter');await suspend('slow-clock-paused');await key('Enter')}}
 assert.equal(await D(()=>__hopDbg.trial.st),'done');const [x,y,z]=await D(()=>__hopDbg.trial.def.end);await at(x,y-.6,z);await win('clock-out');await inspectTrialModels('switch');
 console.log('TRIALS PASS: timeout/retry, five real buoy jumps, downhill delivery, three bell tunes/wrong-note retry, four slow-clock gates, pause/refresh and best records');
}
async function inspectTrialModels(kind){
 const saved=await D(()=>__hopDbg.snapshot());
 for(const [name,a] of [['front',0],['side',Math.PI/2],['back',Math.PI]]){
  await D(({kind,a})=>{const q=__hopDbg.trial,at=kind==='bell'?q.def.bells[1]:[q.switch.x,q.switch.z],x=at[0],z=at[1],y=kind==='bell'?__hopDbg.WORLDS[__hopDbg.world].ground(x,z):q.switch.y-.57;__hopDbg.view('acorn');const c=review.K._three.cam,d=kind==='bell'?3.1:2.4;c.position.set(x+Math.sin(a)*d,y+(kind==='bell'?1.8:1.5),z+Math.cos(a)*d);c.lookAt(x,y+(kind==='bell'?.95:.3),z)},{kind,a});const framed=await D(kind=>{const q=__hopDbg.trial,c=review.K._three.cam;c.updateMatrixWorld(true);const v=kind==='bell'?new THREE.Box3().setFromObject(q.bells[1]).getCenter(new THREE.Vector3()):new THREE.Vector3(q.switch.x,q.switch.y,q.switch.z);v.project(c);return Math.abs(v.x)<.8&&Math.abs(v.y)<.8&&v.z<1&&v.z>-1},kind);assert(framed,'Model close-up contains '+kind);await shot('model-'+kind+'-'+name);
 }
 await D(s=>__hopDbg.restore(s),saved);
}
async function room(){
 const account='Hop'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,onPage:async page=>{if(before)await page.route('**/js/rm-g-hop.js*',r=>r.fulfill({body:source,contentType:'application/javascript'}))}});browser=f.browser;p=f.page;
 try{
  await playCase(f,'n64.hop');await f.until(()=>!!window.__hopDbg);await p.waitForTimeout(1000);await p.screenshot({path:path.join(dir,'in-room-title.png')});
  await p.keyboard.press('t');await f.until(()=>RoomTV.lockIn());await p.keyboard.press('Enter');if(!before)await f.until(()=>__hopDbg.ui.started);else await p.waitForTimeout(900);
  await p.keyboard.press('z');await f.until(()=>__hopDbg.mode==='card');await f.until(()=>__hopDbg.snapshot?__hopDbg.snapshot().card.t>.7:true);if(before)await p.waitForTimeout(1000);await p.keyboard.press('z');if(before)for(let i=0;i<15&&await p.evaluate(()=>__hopDbg.mode==='card');i++){await p.waitForTimeout(400);await p.keyboard.press('z')}await f.until(()=>__hopDbg.mode==='play');
  const z=await p.evaluate(()=>__hopDbg.P.z);await p.keyboard.down('ArrowUp');await f.until(z=>__hopDbg.P.z<z-.4,z);await p.keyboard.up('ArrowUp');await p.screenshot({path:path.join(dir,'lock-in-play.png')});
  assert(await p.evaluate(()=>{let yes=false;House.scene.traverse(o=>{if(o.material?.map?.userData?.jackLive&&o.material.map.image===RoomTV.dbg().cv)yes=true});return yes}),'Telly shows live game canvas');
  assert(await p.evaluate(()=>RoomTV.dbg().cv.width===320&&RoomTV.dbg().cv.height===240),'Native cartridge resolution');
  if(!before){
   await p.evaluate(()=>{const buttons=Array.from({length:16},()=>({pressed:false,value:0}));window.hopPad={id:'Review standard pad',index:0,connected:true,mapping:'standard',buttons,axes:[1,0,0,0]};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[hopPad]});window.hopX=__hopDbg.P.x});
   await f.until(()=>GameInput.mode==='gamepad'&&__hopDbg.P.x>hopX+.3);await p.evaluate(()=>hopPad.axes=[.12,.08,0,0]);await f.until(()=>Math.hypot(__hopDbg.P.vx,__hopDbg.P.vz)<.01);const rest=await p.evaluate(()=>[__hopDbg.P.x,__hopDbg.P.z]);await p.waitForTimeout(500);assert.deepEqual(await p.evaluate(()=>[__hopDbg.P.x,__hopDbg.P.z]),rest,'Resting stick does not drift');
   await p.evaluate(()=>{hopPad.axes=[0,0,0,0];hopPad.buttons[0]={pressed:true,value:1}});await f.until(()=>!__hopDbg.P.gnd);await p.evaluate(()=>hopPad.buttons[0]={pressed:false,value:0});await f.until(()=>__hopDbg.P.gnd);const yaw=await p.evaluate(()=>__hopDbg.C.want);await p.evaluate(()=>hopPad.buttons[4]={pressed:true,value:1});await f.until(yaw=>__hopDbg.C.want>yaw+.7,yaw);await p.evaluate(()=>hopPad.buttons[4]={pressed:false,value:0});await f.until(()=>!RoomTV.dbg().held('l'));await p.screenshot({path:path.join(dir,'gamepad-camera.png')});
   await p.evaluate(()=>hopPad.buttons[9]={pressed:true,value:1});await f.until(()=>__hopDbg.paused);await p.evaluate(()=>hopPad.buttons[9]={pressed:false,value:0});await f.until(()=>!RoomTV.dbg().held('start'));const time=await p.evaluate(()=>__hopDbg.clock);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>__hopDbg.clock),time);await p.screenshot({path:path.join(dir,'gamepad-pause.png')});
   await p.evaluate(()=>{hopPad.connected=false;__hopDbg.save()});const pose=await p.evaluate(()=>[__hopDbg.P.x,__hopDbg.P.y,__hopDbg.P.z,__hopDbg.P.hp]);
   await p.reload({waitUntil:'domcontentloaded'});await f.until(()=>window.AccountGate?.allowed&&window.House?.live&&window.RoomTV?._dbg()?.st==='game'&&window.__hopDbg&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
   assert(await p.evaluate(()=>RoomTV.lockIn()&&__hopDbg.paused),'Production refresh preserves LOCK IN and pause');assert.deepEqual(await p.evaluate(()=>[__hopDbg.P.x,__hopDbg.P.y,__hopDbg.P.z,__hopDbg.P.hp]),pose);await p.screenshot({path:path.join(dir,'production-refresh.png')});
   await p.keyboard.press('Escape');await f.until(()=>HousePause.open);const frame=await p.evaluate(()=>RoomTV.dbg().frame);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>RoomTV.dbg().frame),frame,'House Esc menu freezes cartridge');await p.screenshot({path:path.join(dir,'house-pause.png')});await p.keyboard.press('Escape');await f.until(()=>!HousePause.open);
   await p.keyboard.press('Enter');await f.until(()=>!__hopDbg.paused);
   await p.evaluate(()=>{__hopDbg.prog.lives=0;__hopDbg.P.hp=1;__hopDbg.air(65,-2,0)});await f.until(()=>RoomTV.dbg().done);await p.evaluate(()=>__hopDbg.save());await p.screenshot({path:path.join(dir,'production-game-over.png')});
   const submitted=[];p.on('websocket',ws=>ws.on('framesent',e=>{try{const m=JSON.parse(e.payload);if(m.t==='rmDone')submitted.push(m)}catch{}}));
   await p.reload({waitUntil:'domcontentloaded'});await f.until(()=>window.__hopDbg?.mode==='over'&&RoomTV.dbg()?.done&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(submitted.length,0,'Refresh does not submit another score');await p.screenshot({path:path.join(dir,'production-game-over-refresh.png')});
   await p.keyboard.press('Enter');await f.until(()=>__hopDbg.mode==='title'&&!__hopDbg.ui.started);await p.keyboard.press('Enter');await f.until(()=>__hopDbg.ui.started);await p.keyboard.press('z');await f.until(()=>__hopDbg.mode==='card'&&__hopDbg.ui.card.t>.7);await p.keyboard.press('z');await f.until(()=>__hopDbg.mode==='play');
   await p.keyboard.press('t');await f.until(()=>!RoomTV.lockIn()&&!House.gliding);await p.screenshot({path:path.join(dir,'in-room-play.png')});await p.keyboard.press('q');await f.until(()=>House.mode==='walk'&&!House.gliding);assert(await p.evaluate(()=>RoomTV._dbg().background),'Q leaves the cartridge on the telly');await p.screenshot({path:path.join(dir,'lean-back.png')});
  }
  assert.deepEqual(f.errors,[]);console.log(before?'BASELINE ROOM PASS: physical case/telly, LOCK IN':'ROOM PASS: physical case/telly, LOCK IN, keyboard, standard gamepad/deadzone/jump/camera, pause, production refresh/results, no score resubmission, Esc and Q');
 }finally{await browser.close();browser=null}
 if(!before)await phone();
}
async function phone(){
 const account='HPhone'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,width:390,height:844,touch:true,storage:{jhp_touch_slow_asked:true},contextOptions:{isMobile:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (Linux; Android 9) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'}});browser=f.browser;p=f.page;
 try{
  await playCase(f,'n64.hop');await f.until(()=>!!window.__hopDbg);const cdp=await p.context().newCDPSession(p);
  const press=async selector=>{const r=await p.locator(selector).boundingBox();assert(r,selector);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:2}]});await p.waitForTimeout(120);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})};
  await press('.rm-tools .rm-lock');await f.until(()=>RoomTV.lockIn());await press('.rm-pad [data-b="start"]');await f.until(()=>__hopDbg.ui.started);await press('.rm-pad [data-b="a"]');await f.until(()=>__hopDbg.mode==='card');await f.until(()=>__hopDbg.ui.card.t>.7);await press('.rm-pad [data-b="a"]');await f.until(()=>__hopDbg.mode==='play');
  const r=await p.locator('.rm-pad .rm-stick').boundingBox();assert(r,'Phone movement pad');const x=await p.evaluate(()=>__hopDbg.P.x);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.85,y:r.y+r.height*.5,id:1}]});await f.until(x=>__hopDbg.P.x>x+.3,x);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await f.until(()=>Math.hypot(__hopDbg.P.vx,__hopDbg.P.vz)<.1);
  await press('.rm-pad [data-b="a"]');await f.until(()=>!__hopDbg.P.gnd);await p.screenshot({path:path.join(dir,'phone-touch-jump.png')});await f.until(()=>__hopDbg.P.gnd);const yaw=await p.evaluate(()=>__hopDbg.C.want);await press('.rm-pad [data-b="l"]');await f.until(yaw=>__hopDbg.C.want>yaw+.7,yaw);
  await press('.rm-pad [data-b="start"]');await f.until(()=>__hopDbg.paused);await p.screenshot({path:path.join(dir,'phone-touch-portrait.png')});const pose=await p.evaluate(()=>[__hopDbg.P.x,__hopDbg.P.y,__hopDbg.P.z]);await p.setViewportSize({width:844,height:390});await p.waitForTimeout(800);assert(await p.evaluate(()=>__hopDbg.paused));assert.deepEqual(await p.evaluate(()=>[__hopDbg.P.x,__hopDbg.P.y,__hopDbg.P.z]),pose,'Rotation preserves player');await p.screenshot({path:path.join(dir,'phone-touch-landscape.png')});
  await press('.rm-pad [data-b="start"]');await f.until(()=>!__hopDbg.paused);await press('.rm-pad [data-b="b"]');await f.until(()=>__hopDbg.P.punchN>0);await p.screenshot({path:path.join(dir,'phone-touch-play.png')});await p.setViewportSize({width:768,height:1024});await p.waitForTimeout(800);await p.screenshot({path:path.join(dir,'tablet-touch-game.png')});await press('.rm-tools .rm-lock');await f.until(()=>!RoomTV.lockIn()&&!House.gliding);await p.screenshot({path:path.join(dir,'tablet-in-room.png')});await cdp.detach();assert.deepEqual(f.errors,[]);console.log('PHONE PASS: actual touch title/card, thumb movement, jump, camera, pause, rotation, punch and tablet framing');
 }finally{await browser.close();browser=null}
}
