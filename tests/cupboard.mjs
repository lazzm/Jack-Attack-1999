// Disposable cupboard geometry, movement and save regression. Same cameras before/after.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {playCase} from './case-actions.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],tag=process.argv.includes('--before')?'before':'after';
const dir=new URL('./shots/cupboard/'+tag+'/',import.meta.url).pathname;await mkdir(dir,{recursive:true});
const account='Cup'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,password,account,{pv:12,x:40,y:-70,z:155,rx:0,ry:0,lvl:"U",seat:0}),seed:12345,onPage:async p=>{if(tag==='before')for(const file of ['hs-house.js','hs-world.js','rm-room.js','hs-cases.js']){const body=execFileSync('git',['show','b34c2557062b5bb208f6d667d1f1808617caeff0:app/public/js/'+file],{encoding:'utf8'});await p.route('**/js/'+file+'*',r=>r.fulfill({body,contentType:'application/javascript'}))}}}),p=f.page,report={views:[],errors:f.errors};
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
 ];
 for(const [name,eye,target,open]of views){
  if(process.argv.includes('--functional-only'))break;
  await p.evaluate(({open,name})=>{House.setDoor('cupboard',open,true);House.camera.fov=name==='arc-above'?65:House.camera.fov;House.camera.updateProjectionMatrix()},{open,name});await f.view(eye,target,{level:'G'});await p.waitForTimeout(400);
  await p.screenshot({path:dir+name+'.png'});report.views.push({name,eye,target,draws:await p.evaluate(()=>House.ren.info.render.calls)});console.log('SHOT',name,report.views.at(-1).draws);
 }
 if(!process.argv.includes('--functional-only')){await p.setViewportSize({width:412,height:915});await f.view([244,210,445],[331,235,315],{level:'G'});await p.screenshot({path:dir+'phone.png'});
 await p.setViewportSize({width:1366,height:860});}
 if(tag==='after'&&!process.argv.includes('--shots-only')){
  const stand=async(x,z,ry=0)=>p.evaluate(({x,z,ry})=>{House.hush();HousePause.close();House.setWalkFrom({x,y:210,z,lvl:'G',seat:0});Object.assign(House.P,{x,y:210,z,rx:0,ry});House._.setMode('walk')},{x,z,ry});
  await p.exposeFunction('cupStop',async()=>{await p.keyboard.up('w')});
  const walk=async(x,z)=>{
   await p.evaluate(({x,z})=>{
    const sx=House.W.x,sz=House.W.z,dx=x-sx,dz=z-sz,len=Math.hypot(dx,dz);
    House.P.ry=Math.atan2(dx,-dz)*180/Math.PI;House.P.rx=0;window.cupDone=false;
    const tick=()=>{if(window.cupDone)return;const advance=((House.W.x-sx)*dx+(House.W.z-sz)*dz)/len;
     if(advance>=len-7){window.cupDone=true;window.cupStop();return}requestAnimationFrame(tick)};requestAnimationFrame(tick);
   },{x,z});
   await p.keyboard.down('w');
   try{const end=Date.now()+60000;let ok=false;while(Date.now()<end){if(await p.evaluate(()=>window.cupDone)){ok=true;break}await p.waitForTimeout(80)}assert(ok,'Walk blocked '+JSON.stringify(await p.evaluate(()=>({w:{...House.W},p:{...House.P},paused:House.paused}))))}finally{await p.keyboard.up('w');await p.evaluate(()=>window.cupDone=true)}
   await p.waitForTimeout(600);
   const a=await p.evaluate(()=>({x:House.W.x,z:House.W.z,y:House.P.y,ceiling:House.ROOMS[House.here]?.ceilingAt?.(House.W.x,House.W.z)}));
   if(a.ceiling)assert(a.y>a.ceiling+10,'Camera crossed soffit '+JSON.stringify(a));
   console.log('WALK',a);return a;
  };
  const refresh=async label=>{
   await p.waitForTimeout(1200);await p.evaluate(()=>House.saveWalkState());
   const a=await p.evaluate(()=>({x:House.W.x,z:House.W.z,door:House.DOORS.cupboard.open,power:localStorage.getItem('jhp_off')}));
   await p.reload({waitUntil:'domcontentloaded'});await f.until(()=>!!(window.House?.live&&window.AccountGate?.allowed&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry')));
   await p.evaluate(()=>Room.ensureHouse());await f.until(()=>!!window.HouseRooms?.ready);await p.evaluate(()=>HouseFamily.debug.hide(true));
   const b=await p.evaluate(()=>({x:House.W.x,z:House.W.z,door:House.DOORS.cupboard.open,power:localStorage.getItem('jhp_off')}));assert.deepEqual(b,a,label+' changed on refresh');console.log('REFRESH',label,b);
  };
  await p.evaluate(()=>House.setDoor('cupboard',true,true));await stand(270,323,90);await walk(358,323);await refresh('doorway');
  await walk(358,399);await refresh('inside');await walk(380,420);
  await p.keyboard.down('c');try{await walk(380,470)}finally{await p.keyboard.up('c')}
  await refresh('low-end');await walk(380,420);await walk(358,399);await walk(358,323);await walk(270,323);
  // A nearby player arrests the leaf. It finishes the same action after they
  // step away; rapid reversals and Esc cannot leave an unusable doorway.
  await stand(270,310,90);await p.evaluate(()=>House.setDoor('cupboard',false));await p.waitForTimeout(1500);
  const held=await p.evaluate(()=>House.DOORS.cupboard.ang);assert(held>0&&held<1,'Door failed to wait for player: '+held);
  await walk(240,360);await f.until(()=>House.DOORS.cupboard.ang===0);await refresh('hall-shut');
  await p.evaluate(()=>House.setDoor('cupboard',true));await f.until(()=>House.DOORS.cupboard.ang===1);
  await p.evaluate(()=>{House.setDoor('cupboard',false);House.setDoor('cupboard',true);House.setDoor('cupboard',false)});await p.keyboard.press('Escape');await p.keyboard.press('Escape');await f.until(()=>House.DOORS.cupboard.ang===0);
  await playCase(f,'sn.zero');await f.until(()=>!!(RoomTV._dbg()?.surface&&House.ROOMS.cupboard.cupScreen.material.map.userData.jackLive));
  await p.evaluate(()=>window.cupGame=RoomTV.dbg());await p.keyboard.press('t');await f.until(()=>RoomTV.lockIn());assert(await p.evaluate(()=>RoomTV.dbg()===window.cupGame));await p.keyboard.press('t');await p.keyboard.press('q');await f.until(()=>House.mode==='walk'&&!House.gliding);assert(await p.evaluate(()=>RoomTV.dbg()===window.cupGame));
  console.log('CUPBOARD WALK PASS: real keys in/along/out, slope clearance, nearby-player door sweep, reversals/Esc and four exact refreshes; physical Super Ultra insertion, live telly, T/LOCK IN and same game on Q');
 }
 report.rooms=await p.evaluate(()=>Object.fromEntries(['hall','cupboard'].map(id=>{let calls=0;House.ROOMS[id].group.traverse(m=>{if(m.isMesh&&m.visible)calls+=Array.isArray(m.material)?m.geometry.groups.filter(g=>m.material[g.materialIndex]?.visible!==false).length:m.material.visible===false?0:1});return[id,calls]})));
 await writeFile(dir+'report.json' ,JSON.stringify(report,null,2));assert.deepEqual(f.errors,[]);
}finally{await f.browser.close()}
