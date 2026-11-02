import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],dir='/opt/stacks/landing-qa-sweep2/tests/shots/qa-sweep2/';
const f=await roomFixture(base,{opening:true,hour:9,account:'Sw'+Date.now().toString(36),timeoutScale:4});
const p=f.page;p.setDefaultTimeout(400000);
const allr=await p.evaluate(()=>Object.values(House.ROOMS).filter(r=>r.built&&r.area?.length).map(r=>{const a=r.area.reduce((b,q)=>(q[2]-q[0])*(q[3]-q[1])>(b[2]-b[0])*(b[3]-b[1])?q:b);return{id:r.id,lvl:r.lvl,x:(a[0]+a[2])/2,z:(a[1]+a[3])/2}}));
const rooms=allr.filter(r=>!['bedroom'].includes(r.id)||0);const ft=()=>p.evaluate(()=>new Promise(res=>{const t=[];let l=performance.now();const f=n=>{t.push(n-l);l=n;if(t.length<40)requestAnimationFrame(f);else{t.sort((a,b)=>a-b);res({med:+t[20].toFixed(0),p95:+t[37].toFixed(0)})}};requestAnimationFrame(f)}));
for(const hour of [9,23]){
 await p.evaluate(h=>{window.auditHour=h},hour);await p.waitForTimeout(1500);
 for(const r of rooms){
  const ok=await p.evaluate(r=>{for(let d=0;d<260;d+=10)for(let k=0;k<8;k++){const x=r.x+Math.sin(k*.785)*d,z=r.z+Math.cos(k*.785)*d;if(House._.cellOk(r.lvl,x,z)){House.setWalkFrom({x,y:House.LV[r.lvl]-128,z,lvl:r.lvl,seat:0});House._.setMode('walk');House.visCalc();return 1}}return 0},r);
  if(!ok){console.log('nowalk',r.id);continue}
  for(const [i,ry] of (hour===9?[0,180]:[0]).entries()){
   await p.evaluate(ry=>{House.P.ry=ry;House.P.rx=0;House.dirty()},ry);await p.waitForTimeout(700);
   const m=await ft();
   const mem=await p.evaluate(()=>Math.round(performance.memory.usedJSHeapSize/1e6));
   console.log(hour,r.id,ry,JSON.stringify(m),mem+'MB');
   await p.screenshot({path:`${dir}b-${r.id}-${hour}-${ry}.png`,timeout:400000}).catch(e=>console.log("shotfail",r.id));
  }
 }
}
console.log('errors',f.errors.slice(0,5));
await f.browser.close();
