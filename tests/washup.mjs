// Real sink/rack gameplay on disposable localhost data, including rendered dirt ownership.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {provisionedRoom} from './provisioned-room.mjs';
const base=process.argv[2],baseline=process.argv.includes('--baseline'),tableOnly=process.argv.includes('--table-only');
const f=await provisionedRoom(base,{account:'Jack',timeoutScale:3,touch:true}),{page:p,until}=f;
const touch=await p.context().newCDPSession(p);
async function touchMode(){await p.evaluate(()=>document.exitPointerLock?.());await p.waitForTimeout(200);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:10,y:100}]});await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await until(()=>GameInput.touch);await p.evaluate(()=>HousePause.close());await until(()=>!House.paused)}
const dir=fileURLToPath(new URL('shots/washup/',import.meta.url));await mkdir(dir,{recursive:true});
async function aim(target,eye=[target[0],210,target[2]+70]){await f.view(eye,target,{level:'G'});await p.evaluate(t=>{House._.setMode('walk');const P=House.P,W=House.W;W.eyeNow=W.eye;P.y=W.fy-W.eye;P.rx=Math.atan2(-(t[1]-P.y),Math.hypot(t[0]-P.x,t[2]-P.z))*180/Math.PI;P.ry=Math.atan2(t[0]-P.x,-(t[2]-P.z))*180/Math.PI;House.dirty()},target)}
async function put(id,snap){const s=await p.evaluate(id=>{const s=Object.values(House.SNAPS).find(s=>s.id===id&&s.room==='kitchen');return[s.x,s.y,s.z]},snap);for(let attempt=0;attempt<3;attempt++){await aim([s[0],s[1],s[2]+8],snap==='ch.s.tp0'?[-150,210,100]:undefined);assert(await p.evaluate(id=>House.held()===id||House.grab(id),id));for(let n=0;n<(snap==='ch.s.tp0'?7:5)+attempt;n++)await p.keyboard.press('+');await p.keyboard.press('e');await p.waitForTimeout(1100);if(await p.evaluate(({id,snap})=>House.THINGS[id].snap===snap,{id,snap}))return}console.log('Placement state',await p.evaluate(()=>({P:House.P,W:House.W,held:House.grip,ghost:House.ghost(),snaps:Object.entries(House.SNAPS).filter(([id])=>id.startsWith('ch.s.rack')).map(([key,s])=>({key,id:s.id,room:s.room,x:s.x,y:s.y,z:s.z}))})));throw Error('Missed '+snap+' with '+id)}
try{
await p.evaluate(async()=>{await Chores.load();House.buildRoom(House.ROOMS.kitchen);await Chores.part('kitchen');HouseFamily.debug.hide(true)});
await until(()=>!!House.THINGS['ch.d.6']);
if(tableOnly){
 const before=await p.evaluate(()=>JSON.stringify(ChoreKit.S.v.wash));await put('ch.t.p0','ch.s.tp0');assert(await p.evaluate(()=>ChoreKit.has('table','p0')),'The real table slot did not accept the plate');assert.equal(await p.evaluate(()=>JSON.stringify(ChoreKit.S.v.wash)),before,'Laying the table changed wash-up metadata');await p.screenshot({path:dir+'table-isolation.png'});assert.deepEqual(f.errors,[]);console.log('TABLE/WASHUP ISOLATION PASS: real E/table step and unchanged drying state');
}else{
await f.view([-132,192,85],[-132,250,-15],{level:'G'});await p.screenshot({path:dir+(baseline?'before':'after')+'-01-kitchen.png'});
console.log('Dirt ownership',await p.evaluate(()=>Array.from({length:7},(_,i)=>{const t=House.THINGS['ch.d.'+i],m=t.obj.userData.dirt;let owns=false;t.obj.traverse(o=>{if(o.material===m)owns=true});return{i,owns}})));
await f.view([25,195,95],[-10,257,-24],{level:'G'});await p.screenshot({path:dir+(baseline?'before':'after')+'-dirty-pile.png'});
await p.evaluate(()=>House.act('ch.sink'));await until(()=>ChoreKit.has('washup','plug'));
await p.evaluate(()=>House.act('ch.sink'));await until(()=>ChoreKit.has('washup','fill'));
for(let i=0;i<(baseline?1:7);i++){
 await put('ch.d.'+i,'ch.s.wsink');
 if(!baseline)assert(await p.evaluate(()=>House.grab('ch.sponge')),'Sponge pickup failed');
 for(let n=0;n<4;n++){
  if(baseline)await p.evaluate(()=>House.act('ch.sink'));
  else if(i===0&&n>=2){if(n===2){await p.setViewportSize({width:390,height:844});await touchMode()}await p.locator('.ht-b[data-k=f]').tap()}
  else await p.keyboard.press('f');
  await p.waitForTimeout(700);
  if(!baseline&&i===0&&n===2)await p.screenshot({path:dir+'scrub-phone.png'});
 }
 if(!baseline&&i===0)await p.setViewportSize({width:1366,height:860});
 if(!baseline)await p.evaluate(()=>House.putBack());
 assert(await p.evaluate(i=>ChoreKit.has('washup','w'+i),i),'Scrubbing did not finish dish '+i);
 const rendered=await p.evaluate(i=>{const t=House.THINGS['ch.d.'+i],m=t.obj.userData.dirt;const dirt=[];t.obj.traverse(o=>{if(o.material?.map===m.map)dirt.push({opacity:o.material.opacity,visible:o.material.visible,meshVisible:o.visible,owns:o.material===m})});return dirt},i);
 console.log('Washed',i,rendered);
 if(!baseline)assert(rendered.length&&rendered.every(x=>x.opacity===0&&!x.visible),'Rendered food remains on washed dish '+i);
 await put('ch.d.'+i,'ch.s.rack');
 await f.view([-132,198,55],[-132,247,-10],{level:'G'});await p.screenshot({path:dir+(baseline?'before':'after')+'-rack-'+i+'.png'});
}
if(!baseline){
 const bounds=await p.evaluate(()=>Array.from({length:7},(_,i)=>{const t=House.THINGS['ch.d.'+i],b=new THREE.Box3();t.obj.updateWorldMatrix(true,true);const inv=new THREE.Matrix4().copy(House.root.matrixWorld).invert();t.obj.traverseVisible(o=>{if(o.isMesh&&o.material.visible!==false&&!o.userData.contactShadow){o.geometry.computeBoundingBox();b.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)))}});return{i,min:b.min.toArray(),max:b.max.toArray(),st:t.st,snap:t.snap}}));
 console.log('Rack visible bounds',bounds);
 for(const b of bounds)assert(Math.abs(b.max[1]-257.6)<.2,'Dish floats above or sinks through wire floor: '+JSON.stringify(b));
 for(const [i,diameter]of [[0,24],[1,24],[2,18]]){const b=bounds[i];assert(Math.abs(b.max[1]-b.min[1]-diameter)<.2,'Plate has wrong diameter');assert(b.max[0]-b.min[0]<2,'Plate tilts through uprights')}
 for(const [width,height,name]of [[1366,860,'desktop'],[1920,1080,'wide'],[390,844,'phone'],[844,390,'phone-landscape'],[768,1024,'tablet'],[1024,768,'tablet-landscape']]){
  await p.setViewportSize({width,height});if(name==='phone')await touchMode();await f.view([-132,198,60],[-132,247,-10],{level:'G'});await p.screenshot({path:dir+'complete-'+name+'.png'});
 }
 await p.setViewportSize({width:1366,height:860});await p.keyboard.press('Shift');
 for(const [name,eye]of [['left',[-195,208,32]],['right',[-75,205,45]],['overhead',[-132,170,13]]]){await f.view(eye,[-132,250,-9],{level:'G'});await p.screenshot({path:dir+'complete-'+name+'.png'})}
 await p.evaluate(()=>House.saveWalkState());const power=await p.evaluate(()=>localStorage.getItem('jhp_off'));
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>House.live&&!document.querySelector('.hs-loading,#houseEntry'));
 await p.evaluate(async()=>{await Chores.load();await Chores.part('kitchen')});await until(()=>ChoreKit.has('washup','r6'));
 assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),power);
 assert(await p.evaluate(()=>Array.from({length:7},(_,i)=>{const t=House.THINGS['ch.d.'+i];let clean=true;t.obj.traverse(o=>{if(o.material?.map===t.obj.userData.dirt.map&&o.material.visible)clean=false});return clean&&!t.canGrab()}).every(Boolean)),'Rack dirt/grab state failed after refresh');
 const dryingBefore=await p.evaluate(()=>JSON.stringify(ChoreKit.S.v.wash.rackAt));await put('ch.t.p0','ch.s.tp0');assert.equal(await p.evaluate(()=>JSON.stringify(ChoreKit.S.v.wash.rackAt)),dryingBefore,'Laying the table changed washing-up drying metadata');
 assert(await p.evaluate(()=>ChoreKit.ownerStart('washup')),'Disposable owner redo did not begin');
 const reset=await p.evaluate(()=>Array.from({length:7},(_,i)=>{const t=House.THINGS['ch.d.'+i];return{i,at:t.at,dirt:t.obj.userData.dirt.opacity,visible:t.obj.userData.dirt.visible,rz:t.rz,rx:t.rx,home:t.factoryHome}}));
 for(const t of reset){assert.equal(t.dirt,1,'Redo kept the dish clean');assert(t.visible,'Redo hid the food');assert.equal(t.at.x,t.home.x);assert.equal(t.at.z,t.home.z);assert.equal(t.rx,0);assert.equal(t.rz,0)}
 console.log('WASHUP REDO PASS: factory pile, dirt, empty rack and flat poses restored');
}
assert.deepEqual(f.errors,[]);console.log(baseline?'WASHUP BASELINE CAPTURED':'WASHUP PASS');
}
}catch(e){await p.screenshot({path:dir+'failure.png'}).catch(()=>{});throw e}finally{await f.browser.close()}
