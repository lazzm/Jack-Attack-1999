// Real held-can geometry, rotation, pouring and device captures on disposable data.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
import {withTestServer} from './perf/server.mjs';
const shots=fileURLToPath(new URL('shots/watering-grips/',import.meta.url));
await mkdir(shots,{recursive:true});
await withTestServer(async base=>{
 const account='Can'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,touch:true,timeoutScale:3});
 const {page:p,until,view,errors}=f;
 const shot=name=>p.screenshot({path:shots+name+'.png',timeout:180000});
 try{
  await p.evaluate(async()=>{HouseFamily.debug.hide(true);await Chores.load();await Chores.part('bedroom')});
  await until(()=>!!House.THINGS['ch.can']);
  await view([100,-70,100],[170,-24,-52]);
  assert(await p.evaluate(()=>{House._.setMode('walk');return House.grab('ch.can')}));
  await until(()=>House.root.children.some(g=>g.userData.sides&&g.visible));
  // Compare authored contact points to actual closed rendered triangles.
  const fit=await p.evaluate(()=>{
   const H=House,T=H.T,t=H.THINGS['ch.can'],grips=t.obj.userData.handGrips||[];
   t.obj.updateWorldMatrix(true,true);const inv=t.obj.matrixWorld.clone().invert();
   return grips.map(point=>{let nearest=Infinity;const q=new T.Vector3(...point);
    t.obj.traverse(o=>{if(!o.isMesh||o.userData.contactShadow)return;const g=o.geometry,p=g.attributes.position,I=g.index,m=inv.clone().multiply(o.matrixWorld);for(let i=0;i<(I?I.count:p.count);i+=3){const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,I?I.getX(i+k):i+k).applyMatrix4(m));const tri=new T.Triangle(...v);if(tri.getArea()>1e-10){const d=tri.closestPointToPoint(q,new T.Vector3()).distanceTo(q);if(Number.isFinite(d))nearest=Math.min(nearest,d)}}});return nearest;
   });
  });
  assert.equal(fit.length,2,'A full can needs a handle grip and body support');
  console.log('Rendered can contact distances (cm):',fit);
  assert(fit.every(d=>d<1),'A grip is floating away from the real can: '+fit);
  for(const turn of [0,45,90]){
   if(turn)await p.keyboard.press('r');await p.waitForTimeout(700);
   assert.equal(await p.evaluate(()=>House.held()),'ch.can');
   assert.equal(await p.evaluate(()=>House.root.children.find(g=>g.userData.sides)?.userData.sides.filter(s=>s.palm.visible).length),2);
   await shot('desktop-turn-'+turn);
  }
  // Return to the pickup pose before the pour, using the real control.
  await p.keyboard.press('q');await until(()=>!House.held());
  await view([100,-70,100],[170,-24,-52]);
  assert(await p.evaluate(()=>{House._.setMode('walk');return House.grab('ch.can')}));
  await p.waitForTimeout(500);
  await p.evaluate(()=>{window.__canPourPeak=0;const start=performance.now();(function sample(){__canPourPeak=Math.max(__canPourPeak,House.THINGS['ch.can'].holdRoll||0);if(performance.now()-start<8000)requestAnimationFrame(sample)})();});
  await p.keyboard.press('f');await until(()=>ChoreKit.has('plant','water')&&!House.anims.has('ch.can.tilt'));
  assert(await p.evaluate(()=>__canPourPeak>10),'The carried can never tipped');
  await shot('desktop-watered');
  const cdp=await p.context().newCDPSession(p);
  for(const [width,height]of [[390,844],[844,390],[768,1024],[1024,768],[1920,1080]]){
   await p.setViewportSize({width,height});
   if(width===390){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:width-4,y:4}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{id:1,x:width-4,y:4}]});}
   await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>House.held()),'ch.can');
   await shot('held-'+width+'x'+height);
   if(width===390){await p.locator('.ht-b[data-k="r"]').tap();await p.waitForTimeout(500);await shot('phone-turned');}
  }
  await p.keyboard.press('q');await until(()=>!House.held());
  await p.evaluate(()=>House.saveWalkState());
  const pose=await p.evaluate(()=>({x:House.W.x,z:House.W.z,power:localStorage.getItem('jhp_off'),water:ChoreKit.has('plant','water')}));
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));
  await until(()=>!!window.ChoreKit?.MODS.plant?._built);
  assert.equal(await p.evaluate(()=>ChoreKit.has('plant','water')),pose.water);
  assert.equal(await p.evaluate(()=>House.held()),null);
  const after=await p.evaluate(()=>({x:House.W.x,z:House.W.z,power:localStorage.getItem('jhp_off')}));
  assert(Math.hypot(after.x-pose.x,after.z-pose.z)<2,'Refresh changed the standing pose');assert.equal(after.power,pose.power);
  assert.deepEqual(errors,[]);console.log('WATERING GRIPS PASS: physical contacts, real turn/pour/return, six sizes, touch turn and refresh');
 }finally{await f.browser.close()}
});
