import assert from 'node:assert/strict';import {roomFixture} from './room-fixture.mjs';
const{browser,page:p,errors,view,until}=await roomFixture(process.argv[2]||'http://localhost:18450');
try{
 for(const[name,eye,target]of [['cabinet',[-125,220,420],[-180,285,326]],['cabinet-side',[-255,260,365],[-180,292,326]],['bowl',[20,274,505],[-32,307,460]],['lamp',[20,180,505],[160,260,360]],['lamp-inside',[130,219,400],[160,194,360]]]){await view(eye,target,{level:'G'});await p.screenshot({path:'shots/lounge-'+name+'.png'})}
 await p.evaluate(()=>{House.act('hs.lamp');House.hush()});await p.waitForTimeout(700);await p.screenshot({path:'shots/lounge-lamp-on.png'});assert(await p.evaluate(()=>HouseRooms.rooms.lounge.standardBulbMaterial.emissive.getHex()!==0));
 const collisions=await p.evaluate(()=>HouseRooms.rooms.lounge.standardLampCable.filter(([x,y,z])=>y+0.25>353||x+0.25>195||(y+0.25>344&&x+0.25>193.4)).length);assert.equal(collisions,0,'Standard lamp cable clips floor/wall/skirting');
 await p.setViewportSize({width:390,height:844});await view([-125,220,420],[-180,285,326],{level:'G'});await p.screenshot({path:'shots/lounge-cabinet-narrow.png'});
 await p.evaluate(()=>{House.toggle('hs.display.0');House.toggle('hs.display.1');House.toggle('hs.display.0');House.toggle('hs.display.0')});await p.waitForTimeout(100);await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));await p.evaluate(()=>Room.ensureHouse());await until(()=>HouseRooms.ready);await view([-125,220,420],[-180,285,326],{level:'G'});
 const restored=await p.evaluate(()=>({a:House.OPEN['hs.display.0'].open,b:House.OPEN['hs.display.1'].open,saved:Apps.loadGame('hs.things',1)?.o}));assert(restored.a&&restored.b,'Cabinet panel state lost on mid-slide refresh: '+JSON.stringify(restored));await p.screenshot({path:'shots/lounge-cabinet-open-refresh.png'});
 await p.evaluate(()=>{House.toggle('hs.display.0',false);House.toggle('hs.display.1',false)});await p.waitForTimeout(550);assert(await p.evaluate(()=>Math.abs(House.OPEN['hs.display.0'].pivot.position.x+222)<.01&&Math.abs(House.OPEN['hs.display.1'].pivot.position.x+180)<.01));
 assert.deepEqual(errors,[]);console.log('LOUNGE ART PASS: cabinet sides/glass, solid bowl, lamp/cable and narrow view');
}finally{await browser.close()}
