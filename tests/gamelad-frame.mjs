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
   const bounds=await p.evaluate(()=>{const measure=id=>{const out={l:Infinity,r:-Infinity,t:Infinity,b:-Infinity,z:-Infinity},v=new THREE.Vector3();House.THINGS[id].obj.traverseVisible(m=>{if(!m.isMesh||m.userData.contactShadow||m.userData.questRim||m.userData.hand)return;const a=m.geometry?.attributes?.position;if(!a)return;for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld).project(House.camera);const x=(v.x+1)*innerWidth/2,y=(1-v.y)*innerHeight/2;out.l=Math.min(out.l,x);out.r=Math.max(out.r,x);out.t=Math.min(out.t,y);out.b=Math.max(out.b,y);out.z=Math.max(out.z,v.z)}});return out};return{body:measure('gb'),cart:measure('media.gb.blocks'),header:document.querySelector('.rm-tools').getBoundingClientRect().bottom}});
   for(const [part,b]of Object.entries(bounds).filter(([k])=>k!=='header'))assert(b.l>=-2&&b.r<=w+2&&b.t>=bounds.header&&b.b<=h+2&&b.z<1,'Handheld '+part+' cropped '+name+': '+JSON.stringify(bounds));
   const height=Math.max(bounds.body.b,bounds.cart.b)-Math.min(bounds.body.t,bounds.cart.t),width=Math.max(bounds.body.r,bounds.cart.r)-Math.min(bounds.body.l,bounds.cart.l);assert(Math.max(height/(h-66),width/w)>.78,'Handheld too small '+name+': '+JSON.stringify(bounds));await shot(name);console.log('HAND VIEW',name,await p.evaluate(()=>({p:{...House.P},camera:{fov:House.camera.fov,aspect:House.camera.aspect},gb:{position:House.THINGS.gb.obj.position.toArray(),scale:House.THINGS.gb.obj.scale.toArray(),q:House.THINGS.gb.obj.quaternion.toArray()},cart:{position:House.THINGS['media.gb.blocks'].obj.position.toArray(),q:House.THINGS['media.gb.blocks'].obj.quaternion.toArray(),front:House.THINGS['media.gb.blocks'].frontAnchor},screen:RoomTV._dbg()})));
  }
  if(process.argv.includes('--inspect')){console.log('HAND INSPECT READY :19545');await p.waitForTimeout(600000)}
  await p.setViewportSize({width:1366,height:860});await p.keyboard.press('ArrowLeft');assert(await p.evaluate(()=>RoomTV.dbg()===handSession));
  await p.keyboard.press('t');await until(()=>RoomTV.lockIn());assert(await p.evaluate(()=>RoomTV.dbg()===handSession));await p.waitForTimeout(800);await shot('locked-mouse');
  const button=p.locator('.rm-tvv .rm-pad:not([hidden]) [data-b=a]');await button.waitFor({state:'visible'});const r=await button.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();assert(await p.evaluate(()=>RoomTV.dbg().held('a')),'Mouse A did not reach locked game');await p.mouse.up();
  await p.keyboard.press('t');await until(()=>!RoomTV.lockIn());assert(await p.evaluate(()=>RoomTV.dbg()===handSession));await shot('returned');
  assert.deepEqual(errors,[]);console.log('GAME LAD FRAME PASS: native case/E, six fitted views, same running game through keyboard/T/mouse controls');
 }catch(e){await shot('failure').catch(()=>{});throw e}finally{await f.browser.close()}
});
