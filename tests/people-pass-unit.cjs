// Real family passage + real swept controller on adversarial floor plans.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const world=fs.readFileSync(require.resolve('../app/public/js/hs-world.js'),'utf8');
const life=fs.readFileSync(require.resolve('../app/public/js/np-life.js'),'utf8');
function fixture(width,blocks=[]){
 let now=10000;const Empty=class{};
 const c={RAD:22,STAND:143,LV:{U:73,G:353},D2R:Math.PI/180,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),grids:{dirty:false,shells:{},block:blocks,walk:[],stairs:[]},W:{x:width/2,z:80,lvl:'G',fy:353,vx:0,vz:140},THINGS:{},onStairs:()=>null,doorContacts:()=>[]};
 const H={ok:true,live:true,mode:'walk',T:{Frustum:Empty,Matrix4:Empty,Sphere:Empty,Vector3:Empty},FRONT:{CAR:{}},W:c.W,LV:c.LV,DOORS:{},ROOMS:{},_:{grids:c.grids}};
 const NV={NEED:25.5,onFlight:()=>false,clear:(lvl,x,z)=>Math.min(x,width-x,z,600-z,...blocks.map(b=>{const dx=Math.max(b.x0-x,0,x-b.x1),dz=Math.max(b.z0-z,0,z-b.z1);return Math.hypot(dx,dz)}))};
 NV.route=(a,b)=>{const len=Math.hypot(b.x-a.x,b.z-a.z);for(let d=0;d<=len;d+=2){const t=len?d/len:0;if(NV.clear('G',a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)<NV.NEED)return null}return{len,doors:[],pts:[{...a,s:0},{...b,s:len}]}};
 c.window={House:H,NPCRig:{},NPCNav:NV,NPCLines:{},Bonfire:{familySpace:()=>150}};
 Object.assign(c,{performance:{now:()=>now},localStorage:{getItem:()=>null,setItem(){}},addEventListener(){},document:{querySelector:()=>null,addEventListener(){}},setTimeout(){},setInterval(){},console});
 vm.createContext(c);
 vm.runInContext(world.slice(world.indexOf('  function walkEdges('),world.indexOf('  const onStairs ='))+world.slice(world.indexOf('  const walkingFloor='),world.indexOf('  function tickWalk(')),c);
 c.grids.shells.G={regions:[{lvl:'G',x0:0,z0:0,x1:width,z1:600}],edges:c.walkEdges([{lvl:'G',x0:0,z0:0,x1:width,z1:600}])};
 c.floorAt=(x,z)=>c.floorClear(x,z,'G')?{y:353,lvl:'G'}:null;
 vm.runInContext(life.replace('  boot();','  ready=true; window.testAside=stepAside;'),c);
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
