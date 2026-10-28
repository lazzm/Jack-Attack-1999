// Focused final cat art review at native eye plus close-up front/side views; disposable localhost only.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2];assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const dir=fileURLToPath(new URL('shots/cat-views/',import.meta.url));await mkdir(dir,{recursive:true});
for(const [name,width,height,touch,tier] of [['desktop',1366,860,false,'low'],['wide',1920,1080,false,'low'],['phone',390,844,true,'potato'],['phone-landscape',844,390,true,'potato'],['tablet',768,1024,true,'low'],['tablet-landscape',1024,768,true,'low']]){
 const account='CatView'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,width,height,touch,tier});const {page:p,view,errors}=f;
 try{
  if(touch)await p.touchscreen.tap(width-2,2);await p.evaluate(()=>HouseFamily.debug.hide(true));
  const home=await p.evaluate(()=>{const c=House.SPOTS.cat.obj;return c.position.toArray()});
  await view([-10,-70,110],[home[0],home[1]+24,home[2]]);await p.screenshot({path:dir+name+'-tree-native.png'});
  await view([-160,-70,130],[home[0],home[1]+30,home[2]]);await p.screenshot({path:dir+name+'-tree-side.png'});
  for(const pose of ['sit','sleep','stretch','eat','walk']){
   await p.evaluate(pose=>{const c=House.SPOTS.cat.obj;c.position.set(-40,73,150);c.rotation.y=-Math.PI/2;c.userData.pose(pose,249);House.dirty()},pose);
   await view([-40,38,98],[-40,59,150]);await p.screenshot({path:dir+name+'-'+pose+'-front.png'});
   await view([-87,43,120],[-40,61,150]);await p.screenshot({path:dir+name+'-'+pose+'-side.png'});
  }
  assert.deepEqual(errors,[]);console.log('CAT VIEWS PASS',name);
 }finally{await f.browser.close()}
}
