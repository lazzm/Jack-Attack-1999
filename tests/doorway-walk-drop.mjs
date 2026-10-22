import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18450');
try {
 await p.evaluate(()=>{House.setDoor('bedroom',true,true);const pose={x:225,y:-55,z:190,rx:0,ry:90,lvl:'U',seat:0};House.setWalkFrom(pose);Object.assign(House.P,pose);House._.setMode('walk');House.hush()});await p.waitForTimeout(1000);
 const rig=await p.evaluate(()=>House._.lightingSnapshot('bedroom'));
 await p.keyboard.down('w');try{await until(()=>House.P.x>275)}finally{await p.keyboard.up('w')}
 assert.equal(await p.evaluate(()=>House.here),'landing');assert.deepEqual(await p.evaluate(()=>House._.lightingSnapshot('bedroom')),rig);
 await p.screenshot({path:'shots/walk-doorway-landing.png'});
 await p.keyboard.down('s');try{await until(()=>House.P.x<235)}finally{await p.keyboard.up('s')}
 assert.equal(await p.evaluate(()=>House.here),'bedroom');
 await view([40,-55,155],[40,40,220]);await p.evaluate(()=>House.grab('cube'));await p.waitForTimeout(400);
 const dropped=await p.evaluate(()=>{House.drop();const t=House.THINGS.cube;return {state:t.st,x:t.at.x,y:t.landY,z:t.at.z}});assert.equal(dropped.state,'fall');
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&window.House?.live&&window.House.THINGS.cube&&!document.querySelector('.hs-loading,#houseEntry'));
 const restored=await p.evaluate(()=>({at:House.THINGS.cube.at,st:House.THINGS.cube.st}));assert.equal(restored.st,'rest');for(const k of ['x','y','z'])assert(Math.abs(restored.at[k]-dropped[k])<.11,'Dropped '+k+' lost on refresh');
 await view([40,-55,155],[dropped.x,dropped.y-4,dropped.z]);await p.screenshot({path:'shots/drop-refresh-desktop.png'});await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/drop-refresh-narrow.png'});
 assert.deepEqual(errors,[]);console.log('DOORWAY WALK / IMMEDIATE DROP REFRESH PASS');
}finally{await browser.close()}
