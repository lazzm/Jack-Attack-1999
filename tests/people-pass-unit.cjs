// Real family passage + real swept controller on adversarial floor plans.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const world=fs.readFileSync(require.resolve('../app/public/js/hs-world.js'),'utf8');
const life=fs.readFileSync(require.resolve('../app/public/js/np-life.js'),'utf8');
function fixture(width,blocks=[]){
 let now=10000;const Empty=class{};
 const c={RAD:22,STAND:143,LV:{U:73,G:353},D2R:Math.PI/180,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),grids:{dirty:false,shells:{},block:blocks,walk:[],stairs:[]},W:{x:width/2,z:80,lvl:'G',fy:353,vx:0,vz:140},THINGS:{},onStairs:()=>null,doorContacts:()=>[]};
 const H={ok:true,live:true,mode:'walk',T:{Frustum:Empty,Matrix4:Empty,Sphere:Empty,Vector3:Empty},FRONT:{CAR:{}},W:c.W,LV:c.LV,DOORS:{},ROOMS:{},_:{grids:c.grids}};
 const NV={NEED:25.5,onFlight:()=>false,clear:(lvl,x,z)=>Math.min(x,width-x,z,600-z,...blocks.map(b=>{const dx=Math.max(b.x0-x,0,x-b.x1),dz=Math.max(b.z0-z,0,z-b.z1);return Math.hypot(dx,dz)}))};
 NV.floor=(lvl,x,z)=>NV.onFlight(x,z)&&(lvl==='U'?z<440:z>410)?NV.ramp(z):c.LV[lvl];
 NV.route=(a,b)=>{const len=Math.hypot(b.x-a.x,b.z-a.z);for(let d=0;d<=len;d+=2){const t=len?d/len:0;if(NV.clear('G',a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)<NV.NEED)return null}return{len,doors:[],pts:[{...a,s:0},{...b,s:len}]}};
 c.window={House:H,NPCRig:{},NPCNav:NV,NPCLines:{},Bonfire:{familySpace:()=>150}};
 Object.assign(c,{performance:{now:()=>now},localStorage:{getItem:()=>null,setItem(){}},addEventListener(){},document:{querySelector:()=>null,addEventListener(){}},setTimeout(){},setInterval(){},console});
 vm.createContext(c);
 vm.runInContext(world.slice(world.indexOf('  function walkEdges('),world.indexOf('  const onStairs ='))+world.slice(world.indexOf('  const walkingFloor='),world.indexOf('  function tickWalk(')),c);
 c.grids.shells.G={regions:[{lvl:'G',x0:0,z0:0,x1:width,z1:600}],edges:c.walkEdges([{lvl:'G',x0:0,z0:0,x1:width,z1:600}])};
 c.floorAt=(x,z)=>c.floorClear(x,z,'G')?{y:353,lvl:'G'}:null;
 vm.runInContext(life.replace('  boot();','  ready=true; window.testAside=stepAside; window.testStep=step; window.testHeld=dialogueHeld; window.testFace=faceToward;'),c);
 const F=c.window.HouseFamily,m=F.chars.mom;Object.assign(m,{present:true,x:width/2,z:240,lvl:'G',cur:{k:'act'},goal:{key:'job'}});
 return{c,F,m,tick(){now+=1000/60},aside:()=>c.window.testAside(m,1/60)};
}
for(const width of [121,76,75]){
 const {c,F,m,tick,aside}=fixture(width);let min=Infinity,back=0,early=false;
 for(let i=0;i<600&&c.W.z<360;i++){
  tick();const move=F.passage(0,140/60,1/60,(x,z)=>!!c.floorAt(x,z));
  if(m.pushN>=6&&!m.aside){early=Math.hypot(m.x-c.W.x,m.z-c.W.z)>65;aside();}
  if(m.aside){const d=Math.hypot(m.aside.x-m.x,m.aside.z-m.z),k=Math.min(1,65/60/(d||1));m.x+=(m.aside.x-m.x)*k;m.z+=(m.aside.z-m.z)*k;}
  const z=c.W.z;c.W.vx=move.dx*60;c.W.vz=move.dz*60;c.moveCircle(move.dx,move.dz);back=Math.max(back,z-c.W.z);min=Math.min(min,Math.hypot(c.W.x-m.x,c.W.z-m.z));
 }
 assert(c.W.z>360,`Trapped in ${width} cm corridor: ${JSON.stringify({p:c.W,m:{x:m.x,z:m.z,aside:m.aside}})}`);
 assert(early,'Waited for contact');assert(min>=25.9,'Camera entered a head');assert(back<.01,'Backwards jitter');
 assert(m.x>=16&&m.x<=width-16,'Shuffled into a wall');if(m.x<25.5||m.x>width-25.5)assert(m.aside.narrow,'Narrow pose must turn sideways');
 console.log(`PASS ${width} cm: early checked shuffle, held forward passed, min ${min.toFixed(1)} cm, no jitter`);
}
const f=fixture(121);f.c.W.x=f.m.x;f.c.W.z=f.m.z;assert(!f.F.blocks(f.c.W.x+1,f.c.W.z,'G'),'An overlapping old pose must be able to escape');
assert(f.F.blocker(f.m.x+40,f.m.z,'G')===null,'Bonfire route reserve leaked into player collision');
console.log('PASS overlap escape and Bonfire route/player clearance separation');

const conversation=fixture(121), m=conversation.m;
Object.assign(m,{hold:99,goal:{key:'aside'},cur:{k:'route'},pass:null});
const position=[m.x,m.z];conversation.c.window.testStep(m,.1,{});
assert.deepEqual([m.x,m.z],position,'A conversation must stop a current aside');
assert(conversation.c.window.testHeld(m),'Stationary conversation must retain the pose');
conversation.c.W.z=120;conversation.F.passage(0,2,1/60,(x,z)=>!!conversation.c.floorAt(x,z));
assert(!conversation.c.window.testHeld(m),'New walking intent releases only the pose');
console.log('PASS conversation holds an aside until new walking intent');
const far=fixture(121);for(const c of Object.values(far.F.chars))Object.assign(c,{present:true,x:1000,z:1000});
far.c.window.NPCNav.onFlight=()=>{throw Error('Distant people queried floor geometry')};far.c.window.NPCNav.clear=()=>{throw Error('Distant people queried navigation')};
assert.deepEqual({...far.F.passage(0,2,1/60,()=>{throw Error('Distant people queried player floor')})},{dx:0,dz:2});
const empty=far.F.blockers(60,80,'G',.5);assert.equal(empty,far.F.blockers(60,80,'G',.5),'Empty contacts should reuse their result');
assert.equal(empty.length,0);far.F.passage(0,0,1/60,()=>{throw Error('Standing queried geometry')});
console.log('PASS standing/far fast paths avoid floor, navigation and empty-contact allocations');
const snapped=fixture(300);snapped.c.W.z=100;
snapped.c.window.NPCNav.route=(a,b)=>({len:Math.hypot(b.x-a.x-20,b.z-a.z),doors:[],pts:[{...a,x:a.x+20,s:0},{...b,s:40}]});
snapped.F.passage(0,2,1/60,(x,z)=>!!snapped.c.floorAt(x,z));snapped.aside();
assert(snapped.m.aside,'Expected a checked escape');assert.equal(snapped.m.aside.route.pts[0].x,snapped.m.x,'An aside must not snap its starting point');
Object.assign(m,{hold:0,pass:null,goal:{key:'aside'},aside:null,talking:true});
const remark={c:m,talk:false,lineId:'bf.mom.remark'};conversation.F.debug.speech.cur=remark;
assert(!conversation.c.window.testHeld(m),'A finished yield must resume work during a passing line');assert.equal(conversation.F.debug.speech.cur,remark,'Resuming work must keep the current line');
console.log('PASS exact aside start and return-to-work without interrupting a passing line');

Object.assign(m,{aside:{narrow:true},h:0});conversation.c.window.testFace(m,{x:m.x+100,z:m.z},1);assert.equal(m.h,0,'A conversation must not turn a flattened body through its wall');

// The flight and the cupboard share X/Z, but not air space. Hidden family
// fixtures still collide: an adult on the stairs must not pin a crouched
// player below the solid soffit (the low-end cupboard refresh position).
{
 const {c,F,m}=fixture(121),NV=c.window.NPCNav;
 NV.onFlight=()=>true;NV.ramp=()=>251.7;
 Object.assign(c.W,{x:60,z:473.4,fy:353,eyeNow:44.2});
 Object.assign(m,{x:60,z:473.4,lvl:'G',room:'hall'});
 assert.equal(F.blocker(60,473.4,'G'),null,'A person 57 cm above the player head blocked through the cupboard soffit');
 Object.assign(c.W,{fy:251.7,eyeNow:143});
 assert(F.blocker(60,473.4,'G'),'A real same-flight person must remain solid');
 Object.assign(c.W,{fy:353,eyeNow:44.2});NV.onFlight=()=>false;
 assert(F.blocker(60,473.4,'G'),'A real same-floor person must remain solid');
 NV.onFlight=()=>true;Object.assign(c.W,{z:350});m.z=350;
 assert(F.blocker(60,350,'G'),'A grounded cupboard person must use the ground floor below the flight');
 console.log('PASS cupboard soffit separates overhead people; real same-flight/same-floor/under-flight contacts remain solid');
}
