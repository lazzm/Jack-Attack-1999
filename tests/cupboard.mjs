// Disposable cupboard geometry, movement and save regression. Same cameras before/after.
import './browser-budget.cjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {playCase} from './case-actions.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';
// Detached failure evidence only: never serialize scene meshes or game buffers.
function cupboardState(){
 const H=window.House;
 return {w:H&&{...H.W},p:H&&{...H.P},mode:H?.mode,busy:H?.busy,paused:H?.paused,gliding:H?.gliding,
  focus:document.activeElement?.tagName,hidden:document.hidden,loading:!!document.querySelector('.hs-loading,#houseEntry'),
  doors:H&&Object.fromEntries(Object.entries(H.DOORS).map(([id,d])=>[id,{open:d.open,ang:d.ang,active:H.anims.has('door:'+id)}])),
  frames:H?.perf().frames,movement:H?._?.movementState?.(),trace:window.cupTrace,family:window.HouseFamily?.debug.dump(),
  props:H&&Object.values(H.THINGS).filter(t=>t.at?.room==='cupboard'||t.at?.room==='hall').map(t=>({id:t.id,at:t.at,hx:t.hx,hz:t.hz,st:t.st}))};
}
const base=process.argv[2],tag=process.argv.includes('--before')?'before':'after';
const native=process.argv.includes('--native'),reviewBefore=process.argv.includes('--review-before');
const dir=new URL('./shots/cupboard/'+(native?(reviewBefore?'native-before/':'native/'):tag+'/'),import.meta.url).pathname;await mkdir(dir,{recursive:true});
const account='Cup'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,password,account,{pv:12,x:40,y:-70,z:155,rx:0,ry:0,lvl:"U",seat:0}),seed:12345,onPage:async p=>{await p.addInitScript(()=>{
 window.cupTrace=[];
 const log=event=>{const H=window.House;window.cupTrace.push({at:Math.round(performance.now()),event,mode:H?.mode,busy:H?.busy,paused:H?.paused,keys:H?._?.movementState?.()?.keys,focus:document.activeElement?.tagName,lock:!!document.pointerLockElement});if(window.cupTrace.length>60)window.cupTrace.shift()};
 for(const event of ['keydown','keyup','blur','focus','pointerlockchange'])addEventListener(event,e=>setTimeout(()=>log(event+(e.key?':'+e.key:'')),0),true);
 });if(native)await p.addInitScript(()=>localStorage.setItem('jhp_hs_msaa','true'));if(tag==='before'||reviewBefore)for(const file of ['hs-house.js','hs-world.js','rm-room.js','hs-cases.js']){const body=execFileSync('git',['show',(reviewBefore?'52ce5e1':'b34c2557062b5bb208f6d667d1f1808617caeff0')+':app/public/js/'+file],{encoding:'utf8'});await p.route('**/js/'+file+'*',r=>r.fulfill({body,contentType:'application/javascript'}))}}}),p=f.page,report={views:[],errors:f.errors};
try{
 await p.evaluate(()=>{House.buildRoom(House.ROOMS.cupboard);HouseFamily.debug.hide(true);House.setDoor('cupboard',false,true);House.hush()});
 const views=[
 ['hall-shut',[244,210,445],[331,235,315],false],
 ['hall-open',[244,210,445],[331,235,315],true],
 ['doorway',[334,210,323],[370,300,450],true],
 ['length',[370,210,340],[370,320,535],true],
 ['back',[370,266,420],[370,280,280],true],
 ['low-end',[380,308,470],[375,330,540],true],
 ['arc-above',[285,110,315],[285,353,315.1],true],
 ...(native?[
 ['vacuum',[377,280,420],[345,325,450],true],
 ['boots',[380,301,463],[344,334,485],true],
 ['bag-tools',[380,290,450],[375,330,513],true],
 ['frame-shut',[270,153,355],[330,153,309],false],
 ['frame-open',[270,153,355],[330,153,309],true],
 ]:[]),
 ];
 for(const [name,eye,target,open]of views){
  if(process.argv.includes('--functional-only'))break;
  const only=process.argv.find(a=>a.startsWith('--views='))?.slice(8).split(',');if(only&&!only.includes(name))continue;
  await p.evaluate(({open,name})=>{House.setDoor('cupboard',open,true);House.camera.fov=name==='arc-above'?65:House.camera.fov;House.camera.updateProjectionMatrix()},{open,name});await f.view(eye,target,{level:'G'});await p.waitForTimeout(400);
  if(native){await p.evaluate(()=>{House.ren.setPixelRatio(1);House._.renderForBenchmark();House.ren.getContext().finish()});assert.equal(await p.evaluate(()=>House.ren.getPixelRatio()),1);assert(await p.evaluate(()=>House.ren.domElement.width===innerWidth&&House.ren.domElement.height===innerHeight),'Native drawing buffer must match viewport')}
  if(native&&name==='hall-shut')report.floorProbe=await p.evaluate(()=>{
   House.scene.updateMatrixWorld(true);const rays=[];
   for(const x of [3,20,35,40,45,50,60,70,80])for(const y of [730,750,760,770,780,790,800]){
    const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(x/innerWidth*2-1,1-y/innerHeight*2),House.camera);
    const h=ray.intersectObjects(House.scene.children,true).find(h=>{let a=h.object;while(a){if(!a.visible)return false;a=a.parent}const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;return m?.visible!==false&&!m?.transparent});
    if(h){const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;rays.push({pixel:[x,y],point:h.point.toArray(),color:m.color?.getHexString(),texture:Object.entries(House.K.TEX).find(([,t])=>t===m.map)?.[0],sources:h.object.userData.auditSources?.slice(0,3)})}
   }return rays;
  });
  await p.screenshot({path:dir+name+'.png'});report.views.push({name,eye,target,pixelRatio:await p.evaluate(()=>House.ren.getPixelRatio()),raster:await p.evaluate(()=>({width:House.ren.domElement.width,height:House.ren.domElement.height,msaa:House.ren.getContext().getContextAttributes().antialias})),draws:await p.evaluate(()=>House.ren.info.render.calls)});console.log('SHOT',name,report.views.at(-1).draws);
 }
 if(!process.argv.includes('--functional-only')){await p.setViewportSize({width:412,height:915});await f.view([244,210,445],[331,235,315],{level:'G'});await p.screenshot({path:dir+'phone.png'});
 await p.setViewportSize({width:1366,height:860});}
 if(tag==='after'&&!process.argv.includes('--shots-only')){
  // Readiness is an input contract, not a sleep: a rebuilt room may still
  // own the controls after its loading element disappears on a busy host.
  const walkingReady=async()=>{
   await f.until(()=>House.mode==='walk'&&!House.gliding&&!House.busy&&!House.paused&&!House.ui.modalOpen());
   const frame=await p.evaluate(()=>{House.dirty();return House.perf().frames});
   await f.until(frame=>House.perf().frames>frame,frame);
  };
  const stand=async(x,z,ry=0)=>p.evaluate(({x,z,ry})=>{House.hush();HousePause.close();House.setWalkFrom({x,y:210,z,lvl:'G',seat:0});Object.assign(House.P,{x,y:210,z,rx:0,ry});House._.setMode('walk')},{x,z,ry});
  await p.exposeFunction('cupStop',async()=>{await p.keyboard.up('w')});
  const walk=async(x,z)=>{
   await walkingReady();
   await p.evaluate(({x,z})=>{
    const sx=House.W.x,sz=House.W.z,dx=x-sx,dz=z-sz,len=Math.hypot(dx,dz);
    House.P.ry=Math.atan2(dx,-dz)*180/Math.PI;House.P.rx=0;window.cupDone=false;
    const tick=()=>{if(window.cupDone)return;const advance=((House.W.x-sx)*dx+(House.W.z-sz)*dz)/len;
     if(advance>=len-7){window.cupDone=true;window.cupStop();return}requestAnimationFrame(tick)};requestAnimationFrame(tick);
   },{x,z});
   await p.keyboard.down('w');
   try{const end=Date.now()+60000;let ok=false,nextLog=Date.now()+10000;while(Date.now()<end){if(Date.now()>nextLog){nextLog=Date.now()+10000;console.log('WALK WAIT',JSON.stringify(await p.evaluate(()=>({x:House.W.x,z:House.W.z,busy:House.busy,mode:House.mode,paused:House.paused,movement:House._.movementState(),trace:window.cupTrace,family:HouseFamily.debug.dump()}))))}if(await p.evaluate(()=>window.cupDone)){ok=true;break}await p.waitForTimeout(80)}assert(ok,'Walk blocked '+JSON.stringify(await p.evaluate(cupboardState)))}finally{await p.keyboard.up('w');await p.evaluate(()=>window.cupDone=true)}
   // Inertia decays on house simulation frames, not on the wall clock.
   await f.until(()=>Math.hypot(House.W.vx,House.W.vz)<.1);
   const a=await p.evaluate(()=>({x:House.W.x,z:House.W.z,y:House.P.y,ceiling:House.ROOMS[House.here]?.ceilingAt?.(House.W.x,House.W.z)}));
   if(a.ceiling)assert(a.y>a.ceiling+10,'Camera crossed soffit '+JSON.stringify(a));
   console.log('WALK',a);return a;
  };
  const refresh=async label=>{
   await walkingReady();await p.evaluate(()=>House.saveWalkState());
   const a=await p.evaluate(()=>({x:House.W.x,z:House.W.z,door:House.DOORS.cupboard.open,power:localStorage.getItem('jhp_off')}));
   await p.reload({waitUntil:'domcontentloaded'});await f.until(()=>!!(window.House?.live&&window.AccountGate?.allowed&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry')));
   await p.evaluate(()=>Room.ensureHouse());await f.until(()=>!!window.HouseRooms?.ready);await p.evaluate(()=>HouseFamily.debug.hide(true));await walkingReady();
   const b=await p.evaluate(()=>({x:House.W.x,z:House.W.z,door:House.DOORS.cupboard.open,power:localStorage.getItem('jhp_off')}));assert.deepEqual(b,a,label+' changed on refresh');console.log('REFRESH',label,b);
  };
  await p.evaluate(()=>House.setDoor('cupboard',true,true));await f.until(()=>House.DOORS.cupboard.ang===1&&!House.anims.has('door:cupboard'));await stand(270,323,90);await walk(358,323);await refresh('doorway');
  await walk(358,399);await refresh('inside');await walk(380,420);
  await p.keyboard.down('c');try{await walk(380,470)}finally{await p.keyboard.up('c')}
  await refresh('low-end');
  // A person on the flight directly above must not collide through the soffit.
  // Keep their real collision service active, including in the hidden art fixture.
  await p.evaluate(()=>{const F=HouseFamily;F.debug.spots.cupAbove={lvl:'G',x:House.W.x-10,z:House.W.z-8,face:0};F.debug.go('mom','cupAbove');if(!F.debug.place('mom','cupAbove'))throw Error('Could not place overhead person');});
  const overhead=await p.evaluate(()=>{const c=HouseFamily.chars.mom;return{feet:c.rig.st.y,head:House.W.fy-House.W.eyeNow,blocker:HouseFamily.blocker(House.W.x,House.W.z,House.W.lvl)}});
  assert(overhead.feet<overhead.head-30,'Overhead-person fixture did not stand on the flight: '+JSON.stringify(overhead));assert.equal(overhead.blocker,null,'Person blocked through the soffit');console.log('OVERHEAD PERSON',overhead);
  await walk(380,420);await p.evaluate(()=>{HouseFamily.debug.go('mom','sofaL');HouseFamily.debug.place('mom','sofaL')});await walk(358,399);await walk(358,323);await walk(270,323);
  // A nearby player arrests the leaf. It finishes the same action after they
  // step away; rapid reversals and Esc cannot leave an unusable doorway.
  await stand(270,310,90);await walkingReady();await p.evaluate(()=>{window.cupCloseAt=performance.now();House.setDoor('cupboard',false)});
  await f.until(()=>performance.now()-window.cupCloseAt>=House.DOORS.cupboard.ms&&House.DOORS.cupboard.ang>0&&House.DOORS.cupboard.ang<1&&House.anims.has('door:cupboard'));
  const held=await p.evaluate(()=>House.DOORS.cupboard.ang);assert(held>0&&held<1,'Door failed to wait for player: '+held);
  await walk(240,360);console.log('DOOR DEPARTURE',await p.evaluate(()=>({ang:House.DOORS.cupboard.ang,active:House.anims.has('door:cupboard'),paused:House.paused})));await f.until(()=>House.DOORS.cupboard.ang===0&&!House.anims.has('door:cupboard'));await refresh('hall-shut');
  await p.evaluate(()=>House.setDoor('cupboard',true));await f.until(()=>House.DOORS.cupboard.ang===1&&!House.anims.has('door:cupboard'));
  await p.evaluate(()=>{House.setDoor('cupboard',false);House.setDoor('cupboard',true);House.setDoor('cupboard',false)});await p.keyboard.press('Escape');await f.until(()=>HousePause.open);await p.keyboard.press('Escape');await f.until(()=>!HousePause.open);await f.until(()=>House.DOORS.cupboard.ang===0&&!House.anims.has('door:cupboard'));
  await playCase(f,'sn.zero');await f.until(()=>!!(RoomTV._dbg()?.surface&&House.ROOMS.cupboard.cupScreen.material.map.userData.jackLive));
  // Keep the identity in-page: K.dbg.T contains multi-million-entry track arrays.
  await p.evaluate(()=>{window.cupGame=RoomTV.dbg();window.cupFrame=window.cupGame.frame});await p.keyboard.press('t');await f.until(()=>RoomTV.lockIn());assert(await p.evaluate(()=>RoomTV.dbg()===window.cupGame));await p.keyboard.press('t');await f.until(()=>!RoomTV.lockIn()&&!House.gliding);await p.keyboard.press('q');await f.until(()=>House.mode==='walk'&&!House.gliding);assert(await p.evaluate(()=>RoomTV.dbg()===window.cupGame));await f.until(()=>RoomTV.dbg().frame>window.cupFrame);
  console.log('CUPBOARD WALK PASS: real keys in/along/out, slope clearance, nearby-player door sweep, reversals/Esc and four exact refreshes; physical Super Ultra insertion, live telly, T/LOCK IN and same game on Q');
 }
 report.rooms=await p.evaluate(()=>Object.fromEntries(['hall','cupboard'].map(id=>{let calls=0;House.ROOMS[id].group.traverse(m=>{if(m.isMesh&&m.visible)calls+=Array.isArray(m.material)?m.geometry.groups.filter(g=>m.material[g.materialIndex]?.visible!==false).length:m.material.visible===false?0:1});return[id,calls]})));
 await writeFile(dir+'report.json' ,JSON.stringify(report,null,2));assert.deepEqual(f.errors,[]);
}catch(error){
 report.failure={message:error.message,state:await p.evaluate(cupboardState).catch(()=>null)};
 console.error('CUPBOARD FAILURE',JSON.stringify(report.failure));
 await writeFile(dir+'failure.json',JSON.stringify(report,null,2));
 if(f.browser.isConnected())await p.screenshot({path:dir+'failure.png',timeout:15000}).catch(()=>{});
 throw error;
}finally{await f.browser.close()}
