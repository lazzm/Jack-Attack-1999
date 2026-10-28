// Flat things must be above the boot's real fabric surface, including old saved floor poses.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {provisionedRoom} from './provisioned-room.mjs';
const baseline=process.argv.includes('--baseline'),f=await provisionedRoom(process.argv[2],{timeoutScale:3,touch:true}),{page:p,until}=f;
const dir=new URL('shots/boot-rug/',import.meta.url).pathname;await mkdir(dir,{recursive:true});
try{
 await p.evaluate(async()=>{await Chores.load();House.buildRoom(House.ROOMS.drive);House.buildRoom(House.ROOMS.kitchen);await Chores.part('kitchen');const r=House.ROOMS.drive,c=r.carFrame,t=House.THINGS['ch.t.k3'];if(!r.carBoot.open)r.carBoot.toggle();t.at={room:'drive',x:c.x,y:House.LV.G-23*c.s,z:c.z-157*c.s,ry:0};t.st='rest';r.things.add(t.obj);House.place(t);House.layerFor(t);ChoreKit.keep(t.id)});
 await until(()=>House.ROOMS.drive.carBoot.hinge.rotation.x < -1.2);
 const c=await p.evaluate(()=>House.ROOMS.drive.carFrame);await f.view([c.x,210,c.z-245],[c.x,329,c.z-157*c.s],{level:'G'});
 const readWitness=()=>p.evaluate(()=>{const H=House,T=THREE,t=H.THINGS['ch.t.k3'];H.root.updateMatrixWorld(true);let part;t.obj.traverseVisible(o=>{if(!part&&o.isMesh&&!o.userData.contactShadow)part=o});part.geometry.computeBoundingBox();const q=part.geometry.boundingBox.getCenter(new T.Vector3()).applyMatrix4(part.matrixWorld),ray=new T.Raycaster(new T.Vector3(q.x,-240,q.z),new T.Vector3(0,-1,0));ray.layers.enableAll();const list=[];H.ROOMS.drive.group.traverseVisible(o=>{if(o.isMesh&&!o.userData.noPick)list.push(o)});const hits=ray.intersectObjects(list,false),h=hits[0];let item=false;for(let o=h?.object;o;o=o.parent)if(o===t.obj)item=true;return{savedY:t.at.y,drawnY:t.obj.position.y,firstY:h&&-h.point.y,firstIsRug:h?.object.material.map===H.K.TEX['hs.car.rug'],firstIsItem:item,point:[q.x,q.z],bootOpen:H.ROOMS.drive.carBoot.open}});
 const witness=await readWitness();
 console.log('BOOT RUG WITNESS',witness);await p.screenshot({path:dir+(baseline?'before':'after')+'.png'});
 if(baseline)assert(witness.firstIsRug&&!witness.firstIsItem,'Baseline did not reproduce the buried cutlery');else assert(witness.firstIsItem,'Fabric still hides the flat prop');
 if(!baseline){
  const aim=async w=>{await f.view([c.x,210,c.z-245],[w.point[0],w.firstY,w.point[1]],{level:'G'});await p.evaluate(()=>{House._.setMode('walk');House.dirty()});await p.waitForTimeout(400)};
  await aim(witness);assert.equal(await p.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot),'ch.t.k3','Standing crosshair cannot see the cutlery');await p.keyboard.press('e');await until(()=>House.held()==='ch.t.k3');await p.keyboard.press('q');await until(()=>!House.held());
  const at=await p.evaluate(()=>({...House.THINGS['ch.t.k3'].at}));
  await f.view([40,-70,155],[20,0,0]);await p.evaluate(()=>{House._.setMode('walk');House.saveWalkState();ChoreKit.keep('ch.t.k3');const t=House.THINGS['ch.t.k3'];House.place(t)});
  assert(await p.evaluate(()=>House.THINGS['ch.t.k3'].obj.position.y<House.THINGS['ch.t.k3'].at.y-.6),'Hidden-room restoration put the prop below the cloth');
  const power=await p.evaluate(()=>localStorage.getItem('jhp_off'));await p.waitForTimeout(1200);await p.reload({waitUntil:'domcontentloaded'});await until(()=>House.live&&!document.querySelector('.hs-loading,#houseEntry'));
  await p.evaluate(async()=>{await Chores.load();await Chores.part('kitchen')});await f.view([c.x,210,c.z-245],[c.x,329,c.z-157*c.s],{level:'G'});
  const restored=await readWitness();assert(restored.firstIsItem,'Refresh put the cutlery under the rug');assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),power);
  const kept=await p.evaluate(()=>({...House.THINGS['ch.t.k3'].at}));for(const k of ['x','y','z'])assert(Math.abs(kept[k]-at[k])<.11,'Saved pose moved on refresh: '+k);
  await aim(restored);
  for(const [width,height,name]of [[1366,860,'desktop'],[390,844,'phone'],[844,390,'phone-landscape'],[768,1024,'tablet'],[1024,768,'tablet-landscape']]){await p.setViewportSize({width,height});await p.waitForTimeout(500);await p.screenshot({path:dir+'restored-'+name+'.png'})}
  await p.setViewportSize({width:390,height:844});await p.evaluate(()=>document.exitPointerLock?.());await p.waitForTimeout(250);const touch=await p.context().newCDPSession(p);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:10,y:100}]});await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await until(()=>GameInput.touch);await p.evaluate(()=>HousePause.close());await until(()=>!House.paused);await p.locator('.ht-b[data-k=e]').tap();await until(()=>House.held()==='ch.t.k3');
  console.log('BOOT RUG PICKUP/REFRESH PASS: E and touch pickup, hidden restoration, unchanged saved pose and power');
 }
 assert.deepEqual(f.errors,[]);console.log(baseline?'BOOT RUG BASELINE CONFIRMED':'BOOT RUG PASS');
}finally{await f.browser.close()}
