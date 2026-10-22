import assert from 'node:assert/strict';import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18450',now=Date.now(),state=x=>({t:{cube:['bedroom',x,73,180,25,0,0]},o:{wardrobe0:1,'hs.display.0':1}}),entry=(x,t)=>({f:1,v:1,t,s:state(x)});
for(const[name,storage,x]of [
 ['modern',{'jhp_gs_hs.things':entry(-20,now)},-20],
 ['newer-local',{'jhp_gs_hs.things':entry(-20,now-2000),'jhp_gsl_hs.things':entry(-30,now)},-30],
 ['newer-fallback',{'jhp_gs_hs.things':entry(-20,now-2000),'jhp_hs_things':{...state(-40),_savedAt:now}},-40]
]){
 const{browser,page:p,errors,until}=await roomFixture(base,{storage});try{
  assert.equal(await p.evaluate(()=>House.THINGS.cube.at.x),x,'Cold entry lost '+name+' prop save');assert(await p.evaluate(()=>House.OPEN.wardrobe0.open));await p.evaluate(()=>House.goRoom('lounge',0));assert(await p.evaluate(()=>House.OPEN['hs.display.0'].open),'Lazy-room openable state lost');
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&window.House?.live&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>House.THINGS.cube.at.x),x);assert(await p.evaluate(()=>House.OPEN.wardrobe0.open));assert.deepEqual(errors,[]);console.log('HOUSE STARTUP SAVE PASS',name);
 }finally{await browser.close()}
}
