import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],dir='/opt/stacks/landing-qa-sweep2/tests/shots/qa-sweep2/';
const f=await roomFixture(base,{opening:true,hour:23,account:'Sn'+Date.now().toString(36),timeoutScale:4});
const p=f.page;p.setDefaultTimeout(300000);
const rooms=await p.evaluate(()=>['drive','garden','lounge','kitchen','bedroom'].map(id=>{const r=House.ROOMS[id];const a=r.area.reduce((b,q)=>(q[2]-q[0])*(q[3]-q[1])>(b[2]-b[0])*(b[3]-b[1])?q:b);return{id,lvl:r.lvl,x:(a[0]+a[2])/2,z:(a[1]+a[3])/2}}));
for(const r of rooms){
 const ok=await p.evaluate(r=>{for(let d=0;d<260;d+=10)for(let k=0;k<8;k++){const x=r.x+Math.sin(k*.785)*d,z=r.z+Math.cos(k*.785)*d;if(House._.cellOk(r.lvl,x,z)){House.setWalkFrom({x,y:House.LV[r.lvl]-128,z,lvl:r.lvl,seat:0});House._.setMode('walk');House.visCalc();House.P.rx=-5;House.P.ry=r.id==='drive'?180:(r.id==='garden'?180:0);House.dirty();return 1}}return 0},r);
 await p.waitForTimeout(1500);
 await p.screenshot({path:`${dir}c-${r.id}-night.png`,timeout:300000});console.log('shot',r.id);
}
await f.browser.close();
