import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,until,view}=await roomFixture(process.argv[2],{storage:{jhp_hs_things:{t:{'reading.mag.bed':['bedroom',172,30,105,12,0,0]},o:{}}}});
try{
 assert.equal(await p.evaluate(()=>House.THINGS['reading.mag.bed'].at.z),29,'Untouched overlapping factory magazine was not corrected');
 await p.evaluate(()=>{House.buildRoom(House.ROOMS.kitchen);House.buildRoom(House.ROOMS.drive)});await until(()=>!!House.SPOTS['ch.mud0']);
 const scale=await p.evaluate(()=>{const map=HouseArt.t('tiles');let answer;House.ROOMS.kitchen.group.traverse(o=>{if(o.material?.map!==map)return;const a=o.geometry.attributes.position,u=o.geometry.attributes.uv;const range=(a,k)=>{const v=Array.from({length:a.count},(_,i)=>a.array[i*a.itemSize+k]);return Math.max(...v)-Math.min(...v)};answer=(range(u,0)/range(u,1))/(range(a,0)/range(a,1))});return answer});assert(Math.abs(scale-1)<.001,'Splashback tiles are stretched');
 assert(await p.evaluate(()=>{const f=House.ROOMS.drive.carFrame,p=House.SPOTS['ch.mud0'].obj.position;return Math.abs(p.x-(f.x-85.15*f.s-.5))<.01&&Math.abs(p.z-(f.z-155*f.s))<.01}),'Car washing spots moved away from body');
 for(const[name,eye,target,level]of [['bed-side',[115,-15,155],[180,30,65],'U'],['bed-low',[130,15,105],[172,30,29],'U'],['car-front',[488,215,1268],[488,302,1208],'G'],['car-rear',[478,215,742],[488,295,792],'G'],['tiles-close',[-145,220,15],[-145,235,-55],'G'],['sink-window',[-80,205,75],[-80,225,-65],'G']]){
  await p.setViewportSize({width:1366,height:860});await view(eye,target,{level});await p.screenshot({path:'shots/review-models-'+name+'.png'});
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/review-models-'+name+'-narrow.png'});
 }
 await p.evaluate(()=>{House._.setMode('walk');House.act('ch.bucket');for(let i=0;i<3;i++)House.act('ch.mud0')});assert.equal(await p.evaluate(()=>House.SPOTS['ch.mud0'].off),true,'Mud cannot be scrubbed off');
 const custom={room:'bedroom',x:170,y:30,z:65,ry:24};
 await p.evaluate(at=>{const t=House.THINGS['reading.mag.bed'];t.at={...at};t.st='rest';t.snap=null;House.place(t);House.saveThings(true);House.saveWalkState()},custom);
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&PMGL.built&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.deepEqual(await p.evaluate(()=>{const t=House.THINGS['reading.mag.bed'];return{room:t.at.room,x:t.at.x,y:t.at.y,z:t.at.z,ry:t.at.ry}}),custom,'A custom magazine placement was reset');
 await p.evaluate(()=>{House.goRoom('bedroom',0);House.grab('reading.mag.bed');House.putBack()});await until(()=>House.THINGS['reading.mag.bed'].st==='rest');assert.equal(await p.evaluate(()=>House.THINGS['reading.mag.bed'].at.z),custom.z,'Cancel pickup changed the custom position');
 await p.evaluate(()=>House.tidy('bedroom'));assert.equal(await p.evaluate(()=>House.THINGS['reading.mag.bed'].snap),'reading.slot.31','Tidy lost the reserved reading slot');
 await p.evaluate(()=>House.buildRoom(House.ROOMS.drive));await until(()=>!!House.SPOTS['ch.mud0']);assert.equal(await p.evaluate(()=>House.SPOTS['ch.mud0'].off),true,'Washed mud returned after refresh');
 assert.deepEqual(errors,[]);console.log('REVIEW MODELS PASS: factory correction, custom placement/refresh, square tiles, car/mud alignment, washing/refresh, six desktop/narrow angles, zero browser errors/warnings');
}finally{await browser.close()}
