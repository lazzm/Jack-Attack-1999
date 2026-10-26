// Exercise production geometry and swept movement, without WebGL or player data.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/public/js/hs-world.js'),'utf8');
const geometry=source.slice(source.indexOf('  function walkEdges('),source.indexOf('  const onStairs ='));
const movement=source.slice(source.indexOf('  const walkingFloor='),source.indexOf('  function tickWalk('));
const placement=source.slice(source.indexOf('  function insideFootprint('),source.indexOf('  let held ='));
const c={RAD:22,STAND:128,LV:{U:73,G:353},D2R:Math.PI/180,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),grids:{dirty:false,shells:{},block:[],walk:[],stairs:[]},window:{},W:{x:50,z:50,lvl:'G',fy:353,vx:0,vz:0},THINGS:{},onStairs:()=>null,doorContacts:()=>[]};
vm.createContext(c);vm.runInContext(geometry+movement,c);
vm.runInContext(placement,c);
function room(regions,blocks=[]){c.grids.shells.G={regions,edges:c.walkEdges(regions)};c.grids.block=blocks;c.floorAt=(x,z)=>c.floorClear(x,z,'G')?{y:353,lvl:'G'}:null}
const rect=(x0,z0,x1,z1)=>({x0,z0,x1,z1,lvl:'G'});
assert.equal(c.circleBox(116,116,0,0,100,100),null,'Round body snagged an expanded square corner');
assert(c.circleBox(110,110,0,0,100,100));
room([rect(0,0,200,300)]);
assert(c.floorClear(22,22,'G'));assert(!c.floorClear(21.9,50,'G'));
// Doorway unions must erase interior edges, while preserving the solid jambs.
room([rect(0,0,200,300),rect(200,110,210,190),rect(210,0,410,300)]);
for(let x=170;x<=240;x+=.5)assert(c.floorClear(x,150,'G'),'Seam in a clear doorway at '+x);
assert(!c.floorClear(202,112,'G'),'Body crossed a doorway corner');
// A shallow brush keeps the full tangential component for many simulation steps.
room([rect(0,0,200,1000)]);Object.assign(c.W,{x:30,z:80,vx:-30,vz:140});
for(let i=0;i<120;i++){c.W.vx=-30;c.W.vz=140;c.moveCircle(-30*.01,140*.01)}
assert(Math.abs(c.W.x-22)<.02);assert(Math.abs(c.W.z-248)<.02,'Wall sliding lost speed');
assert.equal(c.W.vz,140);
// Rounded furniture corners let a diagonal glancing route clear, rather than snag.
room([rect(0,0,500,500)],[rect(100,100,200,200)]);Object.assign(c.W,{x:75,z:75,vx:140,vz:140});
c.moveCircle(10,10);assert(c.W.x>84&&c.W.z>84);assert(c.floorClear(c.W.x,c.W.z,'G'));
// A fast frame cannot tunnel through a thin obstacle.
room([rect(0,0,500,500)],[rect(200,0,204,500)]);Object.assign(c.W,{x:100,z:100,vx:210,vz:0});
c.moveCircle(200,0);assert(c.W.x<=178.01);assert(c.W.x>=177.9);
// Intentional wall contact is stable and never invokes the invalid-pose nudge.
for(let i=0;i<120;i++){c.W.vx=140;c.moveCircle(1.4,0);assert.equal(c.recoverWalking(.01),false)}
assert(c.W.x<=178.01);
// Regression: using the failed endpoint's corner normal froze this exact pose.
room([rect(207,600,408,698),rect(124,704,466,1120),rect(-340,704,124,1060),rect(262,660,338,710)],[rect(-300,694,260,708),rect(340,694,420,708)]);
Object.assign(c.W,{x:337.15616965329195,z:672.1853730193089,vx:-108,vz:90});
c.moveCircle(-3.24,2.7);assert(c.W.x<334.1,'Stalled on the front-door rounded corner');assert(c.floorClear(c.W.x,c.W.z,'G'));
room([rect(-280,-60,240,250),rect(234,154,256,226),rect(252,132,408,250)]);
Object.assign(c.W,{x:267.9477681715895,z:210.84661840287728,vx:-123,vz:-67});
c.moveCircle(-3.69,-2.01);assert(c.W.x<265,'Stalled at the bedroom doorway funnel');assert(c.W.z<210);assert(c.floorClear(c.W.x,c.W.z,'G'));
room([rect(207,62,408,250),rect(-278,-54,193,293),rect(193,154,209,226)]);
Object.assign(c.W,{x:206.96188832526343,z:175.99900085721922,vx:-209,vz:-21});
c.moveCircle(-6.27,-.63);assert(c.W.x<201,'Finite doorway edge produced a phantom second contact');assert(c.floorClear(c.W.x,c.W.z,'G'));
// Seeded sweeps around both jambs must always leave a valid, bounded body pose.
let seed=1999;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<2000;i++){
 const x=150+random()*120,z=120+random()*140;if(!c.floorClear(x,z,'G'))continue;
 const dx=(random()-.5)*40,dz=(random()-.5)*40;Object.assign(c.W,{x,z,vx:dx/.12,vz:dz/.12});c.moveCircle(dx,dz);
 assert(c.floorClear(c.W.x,c.W.z,'G'),'Sweep left the walkable union');assert(Math.hypot(c.W.x-x,c.W.z-z)<=Math.hypot(dx,dz)+.01,'Sweep pushed the body farther than its input');
}
// A newly overlapping prop recovers to the nearest same-floor clear position.
room([rect(0,0,500,500)],[rect(100,100,130,130)]);Object.assign(c.W,{x:90,z:115,vx:0,vz:0});
for(let i=0;i<30;i++)c.recoverWalking(.01);
assert(c.floorClear(c.W.x,c.W.z,'G'));assert(Math.hypot(c.W.x-90,c.W.z-115)<=14.01);
// Two legal furniture footprints must not together seal a passage.
room([rect(0,0,300,500)],[rect(0,200,190,220)]);Object.assign(c.W,{x:50,z:50});
const r={id:'hall',lvl:'G',bx0:0,bx1:300,bz0:0,bz1:500,area:[[0,0,300,500]]},t={id:'carton',hx:40,hz:20};
assert(c.floorPlacement(t,r,240,210,0),'Fixture must fit individually');
assert.equal(c.placementKeepsRoutes(t,r,{x:240,z:210},0),false,'New furniture sealed the only passage');
assert(c.placementKeepsRoutes({...t,hx:20},r,{x:100,z:100},0),'Safe furniture was rejected');
// Exercise acceleration and normalized keyboard diagonals through tickWalk.
Object.assign(c,{P:{ry:0},keys:{},cur:{id:'hall'},held:null,stIdx:-1,ui:{where(){}},emit(){},sfxStep(){},roomCheck(){},lowDoorAt:()=>null});
vm.runInContext(source.slice(source.indexOf('  function tickWalk('),source.indexOf('  function onKey(')),c);
function travel(keys){room([rect(-1000,-1000,1000,1000)]);Object.assign(c.W,{x:0,z:0,vx:0,vz:0,fy:353,seat:false,eye:128,eyeNow:128,bob:0,bobT:0,jh:0,jv:0});c.keys=keys;for(let i=0;i<200;i++)c.tickWalk(.01);return Math.hypot(c.W.x,c.W.z)}
const forward=travel({f:true}),diagonal=travel({f:true,r:true});assert(Math.abs(forward-diagonal)<.01,'Diagonal speed differs');
assert(travel({f:true,run:true})>forward*1.49);assert(travel({f:true,crouch:true})<forward*.51);
const house=fs.readFileSync(require.resolve('../app/public/js/hs-house.js'),'utf8'),rampLine=house.split('\n').find(line=>line.includes('H.stairs({'));
c.H={stairs:def=>{c.flight=def}};c.UY=73;vm.runInContext(rampLine,c);
for(let z=250;z<600;z++)assert(Math.abs(c.flight.y(370,z+1)-c.flight.y(370,z)-.8)<.00001,'Stair ramp is discontinuous');
assert.equal(c.flight.y(370,200),73);assert.equal(c.flight.y(370,650),353);
c.ROOMS={hall:{lvl:'G'}};c.DOORS={cupboard:{open:true,headroom:93.8,floorY:353,rooms:['hall'],lintelPlane:330,closedBounds:{x0:325.7,x1:329.3,z0:361.8,z1:438}}};
vm.runInContext(source.slice(source.indexOf('  function lowDoorAt('),source.indexOf('  // the floor under (x, z)')),c);
assert(c.headFitsDoor(305,392,'G',353,128),'Low cupboard lintel blocked the adjacent hall');
assert.equal(c.headFitsDoor(309,392,'G',353,128),false);assert(c.headFitsDoor(309,392,'G',353,84));
console.log('MOVEMENT UNIT PASS: exact union, round corners, sweep/slide, stable walls, bounded recovery, furniture routes, diagonal/crouch/jog speeds');
