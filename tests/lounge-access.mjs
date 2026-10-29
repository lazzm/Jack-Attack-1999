// Native floor routes, the single post mat and PV7 furniture-save compatibility.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
const dir=fileURLToPath(new URL('shots/lounge-access/',import.meta.url));await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const account='Lounge'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,touch:true,timeoutScale:3}),{page:p,view,until,errors}=f;
 const shot=name=>p.screenshot({path:dir+name+'.png',timeout:180000});
 const cdp=await p.context().newCDPSession(p);
 async function load(){await p.evaluate(()=>{for(const id of ['hall','lounge','drive'])House.buildRoom(House.ROOMS[id]);HouseFamily.debug.hide(true);for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,true,true)});await until(()=>!Array.from(House.anims.keys()).some(k=>k.startsWith('door:')))}
 try{
  await load();const eye=await p.evaluate(()=>House.LV.G-House.STAND);
  const widths=await p.evaluate(()=>[420,440,460].map(z=>Array.from({length:21},(_,i)=>-30+i*5).filter(x=>!!House._.floorAt(x,z,'G',353,House.STAND))));for(const xs of widths)assert(xs.at(-1)-xs[0]>=50,'Living-room route narrowed: '+xs);
  await p.evaluate(()=>{window.routeTime=0;window.routeOn=false;window.routeSamples=[];let last=0;requestAnimationFrame(function tick(t){if(routeOn){routeTime+=last?Math.min(.12,(t-last)/1000):0;routeSamples.push([House.W.x,House.W.z])}last=t;requestAnimationFrame(tick)})});
  async function route(x,touch=false){
   await view([x,eye,530],[x,eye,380],{level:'G'});await p.evaluate(()=>{House.hush();House._.setMode('walk');HousePause.close();routeTime=0;routeSamples=[];routeOn=true});
   if(touch){await p.touchscreen.tap(p.viewportSize().width/2,2);await until(()=>GameInput.touch);await p.evaluate(()=>{if(document.pointerLockElement)document.exitPointerLock()});const {width:w,height:h}=p.viewportSize(),sx=Math.min(100,w*.22),sy=h-Math.min(170,h*.3),r=Math.max(46,Math.min(70,Math.min(w,h)*.15));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx,y:sy-r*.92,id:1}]})}else await p.keyboard.down('w');
   const began=Date.now();try{for(;;){const s=await p.evaluate(()=>({z:House.W.z,t:routeTime}));if(s.z<395||s.t>3||Date.now()-began>90000)break;await p.waitForTimeout(80)}}finally{if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await p.keyboard.up('w');await p.evaluate(()=>routeOn=false)}
   const s=await p.evaluate(()=>({z:House.W.z,samples:routeSamples}));assert(s.z<405,'Cannot walk along lounge route');const middle=s.samples.filter(q=>q[1]>=410&&q[1]<=470);assert(middle.length,'Route never entered the corridor');assert(middle.every(q=>Math.abs(q[0]-x)<3),'Furniture forces sideways sliding: '+JSON.stringify(middle));console.log('Native route PASS',x,touch?'thumbstick':'W');
  }
  for(const x of [0,20,40])await route(x);
  await p.setViewportSize({width:390,height:844});await route(20,true);await shot('phone-walk');await p.setViewportSize({width:844,height:390});await route(40,true);await shot('phone-landscape-walk');await p.setViewportSize({width:1366,height:860});
  await p.evaluate(()=>House.setDoor('front',false,true));await until(()=>!House.anims.has('door:front'));
  const mats=await p.evaluate(()=>{House.root.updateMatrixWorld(true);const T=House.T,ray=new T.Raycaster(),tex=House.K.TEX['hs.mat'];return[658,730].map(z=>{ray.set(new T.Vector3(300,-(House.LV.G-50),z),new T.Vector3(0,-1,0));return ray.intersectObject(House.root,true).some(h=>{const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;return m?.visible!==false&&m?.map===tex})})});assert.deepEqual(mats,[true,false]);assert(await p.evaluate(()=>!!House.SPOTS['hs.mat']));console.log('Single indoor post mat PASS');
  for(const[name,e,t]of [['door',[280,eye,520],[-90,300,500]],['right',[100,eye,650],[-90,300,430]],['chair',[-170,eye,390],[100,300,430]],['mat-inside',[300,eye,600],[300,353,680]],['mat-outside',[400,eye,820],[300,353,680]]]){await view(e,t,{level:'G'});await shot(name)}
  // A real old save, loaded by the production entry path; no geometry or physics stubs.
  await p.evaluate(()=>{House.saveWalkState();House.saveThings(true);const s=structuredClone(Apps.loadGame('hs.things',1));s.pv=7;delete s.pv0;s.t.mug=['lounge',-60,309.5,450,0,0,0];s.t.cube=['lounge',110,308,395,0,0,0];sessionStorage.setItem('__lounge_old',JSON.stringify(s))});
  await p.addInitScript(()=>{const old=sessionStorage.getItem('__lounge_old');if(!old)return;sessionStorage.removeItem('__lounge_old');localStorage.setItem('jhp_hs_things',JSON.stringify({...JSON.parse(old),_savedAt:Date.now()+10000}))});
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));await load();
  async function poses(){return p.evaluate(()=>['mug','cube'].map(id=>{const t=House.THINGS[id],b=House.physics.body(id);return{id,at:{...t.at},body:{x:b.x,y:b.y,z:b.z}}}))}
  const a=await poses();for(const [i,x,z,y]of [[0,-72,456.5,309.5],[1,136,400,308]]){assert(Math.abs(a[i].at.x-x)<.2&&Math.abs(a[i].at.z-z)<.2&&Math.abs(a[i].at.y-y)<.2,JSON.stringify(a));assert(Math.abs(a[i].body.x-x)<.2&&Math.abs(a[i].body.z-z)<.2,JSON.stringify(a))}
  // Precise chair parts admit an object above its seat, without a ceiling collider.
  const chair=await p.evaluate(()=>House.physics.world.staticsNear('G',130,390,140,410).filter(s=>s.kind==='lounge-chair').map(s=>({top:s.top,bot:s.bot})));assert(chair.length>0);assert(chair.every(s=>s.top>260),'Chair retained a ceiling-height collider');
  await view([20,eye,480],[136,308,400],{level:'G'});await shot('saved-chair-item');await view([20,eye,520],[-72,309.5,456.5],{level:'G'});await shot('saved-table-item');
  await p.evaluate(()=>{House._.setMode('walk');House.saveWalkState();House.saveThings(true)});await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));await load();const b=await poses();for(let i=0;i<a.length;i++)for(const k of ['x','y','z'])assert(Math.abs(a[i].at[k]-b[i].at[k])<.2,'Refresh moved saved item');
  assert.deepEqual(errors,[]);console.log('LOUNGE ACCESS PASS: native desktop/touch routes, indoor-only mat, real PV7 furniture saves, precise chair parts and repeat refresh');
 }catch(e){await shot('failure').catch(()=>{});throw e}finally{await f.browser.close()}
});
