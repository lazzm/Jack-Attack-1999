// Real cushion placement/plumping, rendered contact, old saves, refresh and owner redo.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';import{fileURLToPath}from'node:url';
import{roomFixture}from'./room-fixture.mjs';import{withTestServer}from'./perf/server.mjs';import{placeChore}from'./chore-actions.mjs';
const dir=fileURLToPath(new URL('shots/cushions-final/',import.meta.url));await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})})).ok);
 const f=await roomFixture(base,{account:'Jack',password,signup:false,touch:true,timeoutScale:3}),{page:p,until,view,errors}=f;
 const shot=name=>p.screenshot({path:dir+name+'.png',timeout:180000});
 const cdp=await p.context().newCDPSession(p);
 async function finger(point){const q={...point,id:30,radiusX:6,radiusY:6,force:1};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q]});await p.waitForTimeout(60);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[q]})}
 async function touchMode(){await finger({x:p.viewportSize().width/2,y:2});await p.evaluate(async()=>{if(document.pointerLockElement)await new Promise(resolve=>{document.addEventListener('pointerlockchange',resolve,{once:true});document.exitPointerLock()});HousePause.close()});assert(await p.evaluate(()=>GameInput.touch))}
 async function use(touch){if(!touch)return p.keyboard.press('f');const q=await p.locator('.ht-hud .ht-b[data-k="f"]').evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});await finger(q)}

 async function load(){await p.evaluate(async()=>{await Room.ensureHouse();House.buildRoom(House.ROOMS.lounge);HouseFamily.debug.hide(true);await Chores.load();await Chores.part('lounge')});await until(()=>!!ChoreKit.MODS.cushions?._built)}
 async function inspectGeometry(){return p.evaluate(()=>{
  const H=House,T=H.T,inv=H.root.matrixWorld.clone().invert();return [0,1,2,3].map(i=>{
   const t=H.THINGS['ch.c.'+i],box=new T.Box3();t.obj.updateWorldMatrix(true,true);
   t.obj.traverseVisible(o=>{if(!o.isMesh||o.userData.contactShadow)return;const a=o.geometry.attributes.position,m=inv.clone().multiply(o.matrixWorld),v=new T.Vector3();for(let j=0;j<a.count;j++)box.expandByPoint(v.fromBufferAttribute(a,j).applyMatrix4(m))});
   const b=H.physics.body(t.id);return{i,min:box.min.toArray(),max:box.max.toArray(),pose:{...t.at},rx:t.rx,angle:t.obj.userData.body.rotation.z,fixed:b.fixed,part:{...b.parts[0]},seat:H.K.restY(308)};
  });
 })}
 async function contacts(){const all=await inspectGeometry();for(const c of all){assert(Math.abs(c.max[1]-c.seat)<.02,'Seat contact: '+JSON.stringify(c));assert(Math.abs(c.part.hi-c.part.lo-(c.max[1]-c.min[1]))<.02,'Collider height: '+JSON.stringify(c));assert(c.fixed)}return all}
 async function redo(){
  await p.keyboard.press('Backquote');await until(()=>!!document.querySelector('.owner-tools')?.open);
  await p.locator('[data-tab=world]').click();await p.locator('[name=chore]').selectOption('cushions');await p.locator('[data-owner=chore]').click();
  await until(()=>!document.querySelector('.owner-tools')?.open&&House.here==='lounge'&&!House.gliding&&!ChoreKit.has('cushions','c0'));
  const floor=await inspectGeometry();for(const c of floor){assert.equal(c.rx,90);assert(!c.fixed);assert(Math.abs(c.angle)<.001);assert(Math.abs(c.part.hi-c.part.lo-(c.max[1]-c.min[1]))<.02)}
 }
 async function aim(i){const id='ch.c.'+i,target=await p.evaluate(id=>{const v=new House.T.Box3().setFromObject(House.THINGS[id].obj).getCenter(new House.T.Vector3());return[v.x,-v.y,v.z]},id),eye=i===3?[10,210,380]:[50,210,520];await view(eye,target,{level:'G'});await p.evaluate(()=>{House._.setMode('walk');HousePause.close()});await p.waitForTimeout(300);await p.evaluate(t=>{const P=House.P;P.rx=Math.atan2(-(t[1]-P.y),Math.hypot(t[0]-P.x,t[2]-P.z))*180/Math.PI;P.ry=Math.atan2(t[0]-P.x,-(t[2]-P.z))*180/Math.PI;House.dirty()},target);assert.equal(await p.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot),id,'F must hit the actual cushion')}
 async function plump(i,touch=false){await aim(i);await use(touch);await use(touch);await use(touch);await until(()=>!Array.from(House.anims.keys()).some(k=>k.startsWith('ch.plump')));assert(await p.evaluate(i=>ChoreKit.has('cushions','p'+i),i),'Plump did not commit');const c=(await inspectGeometry())[i];assert(Math.abs(c.max[1]-c.seat)<.02);return c}
 async function refresh(){
  await p.evaluate(()=>{House.setWalkFrom({x:50,y:House.LV.G-House.STAND,z:520,lvl:'G',seat:0});House._.setMode('walk');House.saveWalkState();addEventListener('pagehide',()=>sessionStorage.setItem('__cushion_reload',JSON.stringify({flags:{...ChoreKit.S.prog.cushions},power:localStorage.getItem('jhp_off'),x:House.W.x,z:House.W.z})),{once:true})});
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));await load();
  const before=await p.evaluate(()=>JSON.parse(sessionStorage.getItem('__cushion_reload'))),after=await p.evaluate(()=>({flags:{...ChoreKit.S.prog.cushions},power:localStorage.getItem('jhp_off'),x:House.W.x,z:House.W.z}));
  assert.equal(after.power,before.power);assert(Math.hypot(after.x-before.x,after.z-before.z)<2);for(const k of Object.keys(before.flags))assert(after.flags[k],'Refresh lost '+k);
 }
 try{
  await load();await until(()=>OwnerTools.allowed);
  // A renderer-only legacy fixture: paid steps keep their assignments, old poses fit the new seats.
  await p.evaluate(()=>{const C=ChoreKit;C.S.v.cush={seat:{0:0,1:1,2:2,3:3}};C.S.prog.cushions={};for(let i=0;i<4;i++){C.S.prog.cushions['c'+i]=1;C.S.prog.cushions['p'+i]=1;const t=House.THINGS['ch.c.'+i];t.at={room:'lounge',x:[-93,-60,-27,122][i],y:308,z:i===3?388:592,ry:i===3?-62:0};t.st='rest'}C.MODS.cushions.sync()});
  const legacy=await contacts(),sorted=legacy.slice(0,3).sort((a,b)=>a.min[0]-b.min[0]);for(let i=1;i<3;i++)assert(sorted[i].min[0]>sorted[i-1].max[0]+1,'Plumped cushions overlap');console.log('Legacy geometry/body fixture PASS');
  await redo();await shot('01-owner-redo-floor');
  for(let i=0;i<4;i++){
   await placeChore(f,'ch.c.'+i,'ch.s.cush'+i);
   if(i===3){await refresh();await p.setViewportSize({width:390,height:844});await touchMode();await aim(3);await use(true);await refresh();await touchMode();if(!await p.evaluate(()=>ChoreKit.has('cushions','p3')))await plump(3,true)}else await plump(i);
   console.log('Real cushion placed/plumped:',i);
  }
  await contacts();await refresh();await contacts();
  for(const [width,height,name]of [[1366,860,'desktop'],[1920,1080,'wide'],[390,844,'phone'],[844,390,'phone-landscape'],[768,1024,'tablet'],[1024,768,'tablet-landscape']]){await p.setViewportSize({width,height});if(width===390)await touchMode();await view([-60,230,450],[-60,290,590],{level:'G'});await p.evaluate(()=>HousePause.close());await shot('complete-'+name)}
  await p.setViewportSize({width:1366,height:860});for(const[name,eye,target]of[['left',[-130,230,500],[-60,290,590]],['right',[40,230,520],[-60,290,590]],['chair',[10,210,380],[118,290,398]],['chair-side',[60,210,460],[118,290,398]]]){await view(eye,target,{level:'G'});await shot('complete-'+name)}
  await redo();await refresh();const loose=await inspectGeometry();assert(loose.every(c=>c.rx===90&&!c.fixed));await shot('02-redo-refresh');
  assert.deepEqual(errors,[]);console.log('CUSHIONS PASS: legacy/current solid contact, native F/rapid presses, actual E slots, refresh placed/mid-plump/completed, six sizes and owner redo');
 }catch(e){await shot('failure').catch(()=>{});throw e}finally{await f.browser.close()}
});
