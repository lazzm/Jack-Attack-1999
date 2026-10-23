import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page,errors,until,view}=await roomFixture(process.argv[2],{debug:true});
async function drawn(){return page.evaluate(()=>new Promise(resolve=>{const renderer=House.ren,old=renderer.render,seen=new Set();renderer.render=function(...args){for(const r of Object.values(House.ROOMS))if(r.group.visible)seen.add(r.id);return old.apply(this,args)};House.dirty();requestAnimationFrame(()=>requestAnimationFrame(()=>{renderer.render=old;resolve([...seen])}))}))}
try{
 for(const[room,outside]of [['bedroom','garden'],['kitchen','garden'],['lounge','drive'],['hall','drive'],['garden','kitchen'],['drive','lounge']]){
  const state=await page.evaluate(({room,outside})=>{for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,false,true);House.goRoom(room,0);House.hush();return{visible:House.ROOMS[outside].group.visible,room:House.here}},{room,outside});
  assert(state.visible,room+' lost the view through its window');assert.equal(state.room,room);console.log('SIGHT LINE',room,outside);
 }
 await page.evaluate(()=>House.goRoom('kitchen',0));
 const glass=await page.evaluate(()=>{
  House.scene.updateMatrixWorld(true);return [false,true].map(outside=>{
   const T=House.T,r=new T.Raycaster(new T.Vector3(-105,-225,outside?-150:40),new T.Vector3(0,0,outside?1:-1));
   const h=r.intersectObjects(House.root.children,true).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;return m.visible&&m.opacity>0});
   const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;return{z:h.point.z,transparent:m.transparent,opacity:m.opacity};
  });
 });assert(glass.every(g=>g.transparent&&g.opacity<.2),'A solid wall or panel still blocks the kitchen glass: '+JSON.stringify(glass));
 for(const open of [false,true,false]){
  await page.evaluate(open=>House.setDoor('back',open,true),open);await until(()=>!House.anims.has('door:back'));
  assert(await page.evaluate(()=>House.ROOMS.garden.group.visible));
  await page.setViewportSize({width:1366,height:860});await view([-80,205,75],[-80,225,-200],{level:'G'});await page.screenshot({path:'shots/window-kitchen-'+open+'.png'});
  assert((await drawn()).includes('garden'),'The visible garden was incorrectly culled');
 }
 await view([-80,205,75],[-80,240,280],{level:'G'});assert(!(await drawn()).includes('garden'),'Garden still renders when every window is behind the camera');assert(await page.evaluate(()=>House.ROOMS.garden.group.visible),'Render culling changed logical room visibility');
 await view([-80,205,75],[-80,225,-200],{level:'G'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'shots/window-kitchen-narrow.png'});
 await page.setViewportSize({width:1366,height:860});await view([-140,195,-260],[-80,240,-56],{level:'G'});await page.screenshot({path:'shots/window-kitchen-outside.png'});
 await page.evaluate(()=>{House.goRoom('kitchen',0);House.saveWalkState()});await page.reload({waitUntil:'domcontentloaded'});
 await until(()=>AccountGate.allowed&&House.live&&!document.querySelector('.hs-loading,#houseEntry'));await page.evaluate(()=>Room.ensureHouse());await until(()=>HouseRooms.ready);
 assert(await page.evaluate(()=>House.ROOMS.garden.group.visible&&!House.DOORS.back.open));
 assert.deepEqual(errors,[]);console.log('WINDOW VIEWS PASS: six permanent sight lines, clear two-sided kitchen glass, closed/open/closed back door, refresh and desktop/narrow screenshots');
}finally{await browser.close()}
