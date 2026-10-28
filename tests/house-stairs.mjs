// The stairs, both ways, from every approach, the way a person plays: look where you're going and hold a key.
// node tests/house-stairs.mjs http://localhost:PORT [--touch] [--only=name]
// Each leg: real keyboard (W, Shift jog, C crouch) or the touch stick, the camera re-aimed at the next target every
// 80 ms; a leg fails if the body stops making progress for 1.5 s or does not arrive within 30 s.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2];assert(base,'base url');
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7);
const dir=fileURLToPath(new URL('./shots/house-scale/stairs/',import.meta.url));await mkdir(dir,{recursive:true});
const TOP={x:371,z:228,lvl:'U'},BOTTOM={x:371,z:650,lvl:'G'};
// [name, start, targets]
const LEGS=[
 ['down-straight',{x:371,z:150,lvl:'U'},[BOTTOM]],
 ['down-from-bedroom-door',{x:262,z:190,lvl:'U'},[TOP,BOTTOM]],
 ['down-bedroom-door-diagonal',{x:262,z:215,lvl:'U'},[{x:378,z:262,lvl:'U'},BOTTOM]],
 ['down-from-corridor',{x:290,z:420,lvl:'U'},[{x:300,z:200,lvl:'U'},TOP,BOTTOM]],
 ['down-off-centre-left',{x:340,z:150,lvl:'U'},[{x:340,z:420,lvl:'U'},BOTTOM]], // aims beside the flight: the funnel eases you on
 ['down-hug-right',{x:400,z:150,lvl:'U'},[{x:402,z:280,lvl:'U'},BOTTOM]],
 ['up-straight',{x:371,z:680,lvl:'G'},[TOP]],
 ['up-from-hall-diagonal',{x:240,z:685,lvl:'G'},[{x:371,z:618,lvl:'G'},TOP]],
 ['up-off-centre-left',{x:340,z:690,lvl:'G'},[{x:340,z:420,lvl:'G'},TOP]],
 ['up-from-front-door',{x:300,z:690,lvl:'G'},[{x:360,z:580,lvl:'G'},TOP]],
 ['up-to-bedroom-door',{x:371,z:680,lvl:'G'},[TOP,{x:262,z:190,lvl:'U'}]],
];
const MODES=process.argv.find(a=>a.startsWith('--modes='))?.slice(8).split(',')||['walk','jog','crouch','carry-small','carry-large'];
const fx=await roomFixture(base,{opening:true,touch:process.argv.includes('--touch')});
const {page:p,errors}=fx,results=[];
try{
 await p.evaluate(()=>{Object.values(House.ROOMS).forEach(r=>House.buildRoom(r));for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,true,true);House.dirty()});
 await p.waitForTimeout(600);
 for(const mode of MODES){
  if(mode.startsWith('carry'))await p.evaluate(mode=>{const B=HouseKit,g=new THREE.Group(),b=B.into(g),big=mode==='carry-large';b.box(0,big?-16:-4,0,big?50:10,big?32:8,big?40:8,B.mat('#ba9560'));House.thing('stairs.'+mode,{obj:g,label:'Stairs test parcel',home:{room:'bedroom',x:80,y:73,z:180},obstacle:true,floorOnly:big});House.grab('stairs.'+mode)},mode);
  for(const [name,start,targets] of LEGS){
   if(only&&name!==only)continue;
   const leg=mode+'-'+name;
   await p.evaluate(s=>{House.hush();House.cancelGlide(true);House.setWalkFrom({x:s.x,z:s.z,y:(s.lvl==='U'?73:353)-(House.STAND||128),lvl:s.lvl,seat:0,ry:0,rx:0});House.W.vx=House.W.vz=0;House._.setMode('walk');House.dirty()},start);
   await p.waitForTimeout(200);
   if(mode==='jog')await p.keyboard.down('Shift');if(mode==='crouch')await p.keyboard.down('c');
   let k=0,last=null,lastMove=Date.now(),t0=Date.now(),fail=null,minDist=1e9;const trace=[];
   await p.keyboard.down('w');
   while(true){
    const s=await p.evaluate(()=>({x:House.W.x,z:House.W.z,y:House.W.fy,lvl:House.W.lvl,mode:House.mode}));trace.push(s);
    const t=targets[k],d=Math.hypot(s.x-t.x,s.z-t.z);
    if(d<22&&(k<targets.length-1||s.lvl===t.lvl)||k<targets.length-1&&s.lvl!==start.lvl){if(++k>=targets.length)break;continue}
    if(!last||Math.hypot(s.x-last.x,s.z-last.z)>1){last=s;lastMove=Date.now()}
    if(Date.now()-lastMove>1500){fail='stuck';break}
    if(Date.now()-t0>45000){fail='timeout';break}
    await p.evaluate(({t,s})=>{House.P.ry=Math.atan2(t.x-s.x,-(t.z-s.z))*180/Math.PI;House.P.rx=-8;House.dirty()},{t,s});
    await p.keyboard.down('w'); // auto-repeat
    await p.waitForTimeout(80);
   }
   await p.keyboard.up('w');if(mode==='jog')await p.keyboard.up('Shift');if(mode==='crouch')await p.keyboard.up('c');
   const r={leg,ok:!fail,fail,seconds:(Date.now()-t0)/1000,end:trace.at(-1),target:targets[Math.min(k,targets.length-1)]};
   if(fail){r.diag=await p.evaluate(()=>House._.movementState?.());await p.screenshot({path:dir+'fail-'+leg+'.png'})}
   results.push(r);console.log((fail?'FAIL ':'PASS ')+leg+' '+r.seconds.toFixed(1)+'s'+(fail?' at '+JSON.stringify(r.end):''));
   await p.waitForTimeout(150);
  }
  if(mode.startsWith('carry'))await p.evaluate(mode=>{House.putBack();const t=House.THINGS['stairs.'+mode];if(t){House.unspot(t.id);t.obj.parent?.remove(t.obj);delete House.THINGS[t.id]}},mode);
 }
 await writeFile(dir+'report'+(process.argv.includes('--touch')?'-touch':'')+'.json',JSON.stringify({results,errors},null,1));
 const bad=results.filter(r=>!r.ok);console.log('STAIRS '+(results.length-bad.length)+'/'+results.length+' legs passed');
 assert.deepEqual(errors,[],'browser errors');assert.equal(bad.length,0,'stuck legs: '+bad.map(r=>r.leg).join(', '));
}finally{await fx.browser.close()}
