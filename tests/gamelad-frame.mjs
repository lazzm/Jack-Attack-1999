import assert from 'node:assert/strict';import{mkdir}from'node:fs/promises';import{fileURLToPath}from'node:url';
import{withTestServer}from'./perf/server.mjs';import{roomFixture}from'./room-fixture.mjs';import{insertCase}from'./case-actions.mjs';
const dir=fileURLToPath(new URL('shots/gamelad-frame/',import.meta.url));await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const account='Hand'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,touch:true,timeoutScale:3,launchOptions:process.argv.includes('--inspect')?{args:['--enable-unsafe-swiftshader','--remote-debugging-port=19545']}:undefined}),{page:p,until,errors}=f;
 const shot=n=>p.screenshot({path:dir+n+'.png',timeout:180000});
 try{
  await insertCase(f,'media.box.gb.blocks','console.gb');await until(()=>RoomTV?._dbg()?.st==='game'&&!House.gliding&&!HouseCases.busy);
  await p.evaluate(()=>window.handSession=RoomTV.dbg());
  for(const[w,h,name]of[[1366,860,'desktop'],[1920,1080,'wide'],[390,844,'phone'],[844,390,'phone-landscape'],[768,1024,'tablet'],[1024,768,'tablet-landscape']]){
   await p.setViewportSize({width:w,height:h});await p.waitForTimeout(2500);
   const b=await p.evaluate(()=>{const o=House.THINGS.gb.obj,points=[[-4.1,-2.6,-6.9],[4.1,-2.6,-6.9],[-4.1,-2.6,7.3],[4.1,-2.6,7.3]].map(a=>{const v=new THREE.Vector3(...a);o.localToWorld(v);const q=House.toScreen(v.x,-v.y,v.z);return q});return points});
   assert(b.every(q=>q&&q.x>=-2&&q.x<=w+2&&q.y>=-2&&q.y<=h+2),'Handheld cropped '+name+': '+JSON.stringify(b));const height=Math.max(...b.map(q=>q.y))-Math.min(...b.map(q=>q.y));assert(height>h*.65,'Handheld too small '+name+': '+height/h);await shot(name);console.log('HAND VIEW',name,await p.evaluate(()=>({p:{...House.P},camera:{fov:House.camera.fov,aspect:House.camera.aspect},gb:{position:House.THINGS.gb.obj.position.toArray(),scale:House.THINGS.gb.obj.scale.toArray(),q:House.THINGS.gb.obj.quaternion.toArray()},cart:{position:House.THINGS['media.gb.blocks'].obj.position.toArray(),q:House.THINGS['media.gb.blocks'].obj.quaternion.toArray(),front:House.THINGS['media.gb.blocks'].frontAnchor},screen:RoomTV._dbg()})));
  }
  if(process.argv.includes('--inspect')){console.log('HAND INSPECT READY :19545');await p.waitForTimeout(600000)}
  await p.setViewportSize({width:1366,height:860});await p.keyboard.press('ArrowLeft');assert(await p.evaluate(()=>RoomTV.dbg()===handSession));
  await p.keyboard.press('t');await until(()=>RoomTV.lockIn());assert(await p.evaluate(()=>RoomTV.dbg()===handSession));await p.waitForTimeout(800);await shot('locked-mouse');
  const button=p.locator('.rm-tvv .rm-pad:not([hidden]) [data-b=a]');await button.waitFor({state:'visible'});const r=await button.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();assert(await p.evaluate(()=>RoomTV.dbg().held('a')),'Mouse A did not reach locked game');await p.mouse.up();
  await p.keyboard.press('t');await until(()=>!RoomTV.lockIn());assert(await p.evaluate(()=>RoomTV.dbg()===handSession));await shot('returned');
  assert.deepEqual(errors,[]);console.log('GAME LAD FRAME PASS: native case/E, six fitted views, same running game through keyboard/T/mouse controls');
 }catch(e){await shot('failure').catch(()=>{});throw e}finally{await f.browser.close()}
});
