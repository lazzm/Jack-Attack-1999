// Measured real geometry, real hand proportions and actual rotation across mouse/touch viewports.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
await mkdir(new URL('shots/carry-size/',import.meta.url),{recursive:true});
await withTestServer(async base=>{
 const account='Size'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,touch:true,timeoutScale:3}),{page:p,until,view,errors}=f;
 const shot=name=>p.screenshot({path:new URL('shots/carry-size/'+name+'.png',import.meta.url).pathname,timeout:180000});
 const touch=await p.context().newCDPSession(p);
 const bounds=()=>p.evaluate(()=>{const H=House,t=H.THINGS[H.held()],T=H.T,v=new T.Vector3();let l=Infinity,r=-Infinity,top=Infinity,b=-Infinity;t.obj.updateWorldMatrix(true,true);t.obj.traverse(o=>{if(!o.isMesh||!o.visible||o.userData.contactShadow||o.userData.questRim||![].concat(o.material).some(m=>m.visible))return;const a=o.geometry?.attributes.position;if(!a)return;for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);const q=H.toScreen(v.x,-v.y,v.z);if(q){l=Math.min(l,q.x/innerWidth);r=Math.max(r,q.x/innerWidth);top=Math.min(top,q.y/innerHeight);b=Math.max(b,q.y/innerHeight)}}});return{height:b-top,l,r,top,b,scale:t.obj.scale.toArray(),same:t.obj===window.sizeReal,hand:H.root.children.find(g=>g.userData.sides)?.userData.sides.filter(a=>a.palm.visible).map(a=>a.palm.scale.toArray())}});
 try{
  const id=await p.evaluate(()=>Object.values(House.THINGS).find(t=>t.kind==='console-case'&&!t.at.hide)?.id);assert(id);
  await view([30,-55,150],[30,-55,-30]);await p.evaluate(id=>{House._.setMode('walk');window.sizeReal=House.THINGS[id].obj;window.sizeScale=sizeReal.scale.toArray();House.grab(id)},id);await p.waitForTimeout(2000);
  for(const[w,h,name]of [[1366,860,'desktop'],[1920,1080,'wide'],[390,844,'phone'],[844,390,'phone-landscape'],[768,1024,'tablet'],[1024,768,'tablet-landscape']]){
   await p.setViewportSize({width:w,height:h});if(name==='phone'&&!await p.evaluate(()=>GameInput.touch)){await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:70,y:h-150}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:70,y:h-185}]});await p.waitForTimeout(100);await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}await p.waitForTimeout(1800);const b=await bounds();console.log(name,JSON.stringify(b));assert(b.same&&b.scale.every((n,i)=>Math.abs(n-1)<1e-5),'Holding changed physical model/size');assert(b.height>=.09&&b.height<=.17,'Case must be roughly12% high: '+JSON.stringify(b));assert(b.top>.57&&b.b<1,'Case must stay low and visible');assert(b.l>0&&b.r<1);assert(b.hand?.length&&b.hand.every(s=>s.every(n=>n===1)),'Hands must retain real proportions');await shot(name);
  }
  await p.keyboard.press('r');await p.waitForTimeout(1500);await shot('turned');assert.equal(await p.evaluate(()=>House.held()),id);await p.keyboard.press('q');await until(()=>!House.held());
  await p.setViewportSize({width:1366,height:860});for(const id of ['mug','bin']){await p.evaluate(id=>{window.sizeReal=House.THINGS[id].obj;House.grab(id)},id);await p.waitForTimeout(1800);assert((await bounds()).same);await shot(id);await p.keyboard.press('q');await until(()=>!House.held())}
  assert.deepEqual(errors,[]);console.log('CARRY SIZE PASS: measured case silhouette, unchanged model/scale/hands, six sizes, actual R/Q, mug and larger bin');
 }catch(e){await shot('failure').catch(()=>{});throw e}finally{await f.browser.close()}
});
