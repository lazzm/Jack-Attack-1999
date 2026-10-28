// Review every rebuilt garment in the shipped first-person grip, desktop and phone.
import assert from 'node:assert/strict';import{mkdir}from'node:fs/promises';import{fileURLToPath}from'node:url';import{roomFixture}from'./room-fixture.mjs';
const base=process.argv[2];assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));const dir=fileURLToPath(new URL('shots/garment-carry/',import.meta.url));await mkdir(dir,{recursive:true});
for(const [name,width,height,touch]of[['desktop',1366,860,false],['phone',390,844,true]]){
 const account='Cloth'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,width,height,touch,tier:touch?'potato':'low'}),{page:p,until,view,errors}=f;
 try{if(touch)await p.touchscreen.tap(width-2,2);await p.evaluate(async()=>{HouseFamily.debug.hide(true);await Chores.load();await Chores.part('bedroom')});
 for(const id of['ch.m.socks','ch.m.tshirt','ch.m.jeans','ch.m.shirt','ch.m.pe','ch.m.jumper2','ch.pjs']){
  await view([40,-70,185],[20,73,245]);assert(await p.evaluate(id=>{if(House.held())House.putBack();House.THINGS[id].canGrab=null;House._.setMode('walk');return House.grab(id)},id));await until(()=>!!House.held());await p.waitForTimeout(500);
  assert.equal(await p.evaluate(()=>House.root.children.find(g=>g.userData.sides)?.userData.sides.filter(s=>s.palm.visible).length),1,'Garment should be pinched by one hand');
  if(touch){await p.evaluate(()=>House.toast('SECRET FOUND','On the move'));await p.waitForTimeout(350);const r=await p.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{top:r.top,bottom:r.bottom}};return{hold:box('.hs-hold'),toast:box('.hs-ui .rm-toast'),chip:box('.ch-chip')}});assert(r.toast.top>=r.hold.bottom+4,'Toast covers carry caption');assert(r.chip.top>=r.toast.bottom+4,'Job chip covers toast')}
  await p.screenshot({path:dir+name+'-'+id+'.png'});
 }assert.deepEqual(errors,[]);console.log('GARMENT CARRY PASS',name);
 }finally{await f.browser.close()}
}
