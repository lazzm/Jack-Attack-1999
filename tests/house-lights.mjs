import assert from 'node:assert/strict';import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18450';const{browser,page:p,errors,until,view}=await roomFixture(base,{hour:22});
try{
 for(const id of ['landing','hall','lounge','kitchen']){
  await p.evaluate(id=>{House.goRoom(id,0);House.hush();House.act('hs.switch.'+id)},id);await p.waitForTimeout(700);
  assert.equal(await p.evaluate(id=>HouseRooms.lit(id),id),false);
  const at=await p.evaluate(id=>{const v=new THREE.Vector3();House.SPOTS['hs.switch.'+id].obj.getWorldPosition(v);return[v.x,-v.y,v.z]},id),level=id==='landing'?'U':'G';
  await view([at[0]+(id==='landing'||id==='hall'?35:-35),at[1]-4,at[2]+30],at,{level});await p.screenshot({path:`shots/switch-${id}-off.png`});
  if(id==='landing'){await p.evaluate(()=>{House.hush();House._.setMode('walk')});await p.keyboard.press('e');assert.equal(await p.evaluate(()=>HouseRooms.lit('landing')),true);await p.evaluate(()=>House.hush());await p.mouse.click(683,430);assert.equal(await p.evaluate(()=>HouseRooms.lit('landing')),false);await p.evaluate(()=>{if(document.pointerLockElement)document.exitPointerLock();House.hush()})}
  await p.evaluate(id=>{for(let i=0;i<5;i++)House.act('hs.switch.'+id);House.hush()},id);assert.equal(await p.evaluate(id=>HouseRooms.lit(id),id),true);
 }
 await p.evaluate(()=>{House.goRoom('cupboard',0);House.act('hs.cord');House.goRoom('lounge',0);House.act('hs.lamp');House.act('hs.fire');House.hush()});
 const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('jhp_hs_house_lights')));assert(saved.loungeFire);assert.equal(saved.cupboard,false);assert.equal(saved.loungeLamp,false);
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));await p.evaluate(()=>Room.ensureHouse());await until(()=>HouseRooms.ready);
 await p.evaluate(()=>{House.goRoom('lounge',0);House.hush()});assert.equal(await p.evaluate(()=>HouseRooms.rooms.lounge.fireOn),true);
 for(const [id,on]of Object.entries(saved))assert.equal(await p.evaluate(id=>HouseRooms.lightsOn[id],id),on,'Refresh changed '+id);
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(500);await p.screenshot({path:'shots/switches-narrow-refresh.png'});
 await p.evaluate(()=>{House.act('hs.fire');House.act('hs.switch.lounge');House.hush()});await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));await p.evaluate(()=>Room.ensureHouse());await until(()=>HouseRooms.ready);await p.evaluate(()=>House.goRoom('lounge',0));
 assert.equal(await p.evaluate(()=>HouseRooms.rooms.lounge.fireOn),false);assert.equal(await p.evaluate(()=>HouseRooms.lit('lounge')),false);
 assert.deepEqual(errors,[]);console.log('HOUSE LIGHTS PASS: switches, rapid toggles, on/off persistence, cupboard/lamp/fire and narrow refresh');
}finally{await browser.close()}
