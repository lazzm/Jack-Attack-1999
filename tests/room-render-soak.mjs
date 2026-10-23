import assert from 'node:assert/strict';import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18450',minutes=Number(process.argv[3]||35);assert(minutes>0&&minutes<=90);
const{browser,page:p,errors,until}=await roomFixture(base);const start=Date.now(),end=start+minutes*60000,rooms=['bedroom','landing','hall','cupboard','lounge','kitchen','garden','drive'];
let cycle=0,rebuilt=false,runtime=null,maxGeometries=0,maxPrograms=0;
async function sample(){return p.evaluate(()=>{House.dirty();return new Promise(resolve=>requestAnimationFrame(()=>{const gl=House.ren.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,px=new Uint8Array(4);let lit=false;for(const[x,y]of [[.5,.5],[.2,.4],[.8,.6],[.5,.8]]){gl.readPixels(Math.floor(w*x),Math.floor(h*y),1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);if(px[0]+px[1]+px[2]>24)lit=true}resolve(lit)}))})}
try{
 await p.evaluate(()=>Apps.load('js/rm-tv.js'));await until(()=>!!window.RoomTV);
 await p.evaluate(()=>RoomTV.test('n64.kart'));await until(()=>RoomTV._dbg()?.st==='game');await p.keyboard.press('Enter');await p.waitForTimeout(1200);await p.keyboard.press('q');await until(()=>House.mode==='walk');
 await p.evaluate(()=>window.soakRuntime=RoomTV.dbg());
 while(Date.now()<end){
  const id=rooms[cycle%rooms.length];
  await p.evaluate(({id,cycle})=>{House.hush();for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,cycle%3!==0,true);House.goRoom(id,0);if(cycle%7===0&&House.SPOTS['hs.switch.'+id])House.act('hs.switch.'+id);if(cycle%30===0){window.auditHour=[14,18,22][Math.floor(cycle/30)%3];window.auditMinute+=5}House.hush()},{id,cycle});await p.waitForTimeout(1200);
  assert(await sample(),'Blank view in '+id+' cycle '+cycle);
  assert(await p.evaluate(()=>RoomTV._dbg()?.background&&RoomTV.dbg()===window.soakRuntime),'Lost/replaced background console runtime');
  assert(await p.evaluate(()=>House.root.children.filter(o=>o.isPointLight).length<=5),'Light objects accumulate');
  if(cycle%16===0){await p.evaluate(()=>House.inspect('cube'));await p.waitForTimeout(250);await p.keyboard.press('q');await until(()=>House.mode==='walk');await p.evaluate(()=>House.putBack())}
  if(cycle%20===0){const m=await p.evaluate(()=>({geometry:House.ren.info.memory.geometries,programs:House.ren.info.programs.length}));maxGeometries=Math.max(maxGeometries,m.geometry);maxPrograms=Math.max(maxPrograms,m.programs);assert(m.geometry<2200&&m.programs<100,'Unbounded renderer resource growth');await p.screenshot({path:'shots/soak-'+id+'-'+cycle+'.png'});console.log('SOAK',cycle,id,Math.round((Date.now()-start)/1000)+'s',JSON.stringify(m));assert.deepEqual(errors,[])}
  if(!rebuilt&&Date.now()-start>minutes*30000){assert(await p.evaluate(()=>{const ext=House.ren.getContext().getExtension('WEBGL_lose_context');if(!ext)return false;window.soakOldCanvas=document.querySelector('.hs-gl');ext.loseContext();setTimeout(()=>ext.restoreContext(),500);return true}),'Context-loss extension unavailable');await until(()=>document.querySelector('.hs-gl')!==window.soakOldCanvas&&!House.ren.getContext().isContextLost());await p.waitForTimeout(2000);rebuilt=true;assert(await sample(),'Blank after renderer rebuild')}
  if(cycle>0&&cycle%80===0){await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&window.House?.live&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));await p.evaluate(()=>Room.ensureHouse());await until(()=>HouseRooms.ready&&RoomTV._dbg()?.background);await p.evaluate(()=>window.soakRuntime=RoomTV.dbg())}
  cycle++;await p.waitForTimeout(1800);
 }
 assert.deepEqual(errors,[]);console.log('ROOM SOAK PASS',JSON.stringify({minutes:(Date.now()-start)/60000,cycles:cycle,rebuilt,maxGeometries,maxPrograms}));
}finally{await browser.close()}
