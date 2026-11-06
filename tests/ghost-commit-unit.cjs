// The live carry selector may change between two drawn frames. E must commit
// the displayed result, while still rejecting a slot that stopped accepting it.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/public/js/hs-world.js'),'utf8');
const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
let time=1000,hit={p:{x:20,y:0,z:-80}};
const t={id:'case',kind:'case',h:10},slot={id:'console',x:20,y:0,z:-80,r:10,room:'bedroom',accepts:()=>true,enabled:()=>true};
const c={performance:{now:()=>time},P:{x:0,y:0,z:0,rx:0,ry:0},cur:{id:'bedroom'},vw:100,vh:100,held:{id:t.id},THINGS:{case:t},SNAPS:{console:slot},REACH:260,aimT:0,aimPt:null,carryPick:()=>hit,fwd:()=>({x:0,y:0,z:-1}),GP:{t:null,at:0,res:null},reachPos:()=>({x:100,y:0,z:0}),freeGhost:()=>({ok:false,why:'solid'}),drawnGhost:{t,g:null},computeCalls:0,dirty(){},ROOMS:{bedroom:{lvl:'U'}},letGo(){throw Error('Unexpected release')},ui:{toast(){}},physicalSound(){},whyText:x=>x,snapIn(_t,s){c.committed=s.id;return true},setDown(_t,g){c.committed=g},physReady:()=>null,bodyFor:()=>null};
vm.createContext(c);vm.runInContext(between('  function nearSnap(', '  // The footprint'),c);vm.runInContext(between('  function computeGhost(', '  function fitsCeiling('),c);
const shown=vm.runInContext('computeGhost(THINGS.case)',c);assert.equal(shown.snap.id,'console');c.drawnGhost.g=shown;
// A moving occluder changes the fresh ray; the cached, drawn gold target still
// names the console until the next frame. No camera matrix is involved.
hit={p:{x:0,y:0,z:-10}};time+=10;
assert.equal(vm.runInContext('computeGhost(THINGS.case,null,null,true)',c).snap,undefined,'Production selector must reproduce the disagreement');
vm.runInContext(between('  function drop(', '  function releaseHold('),c);
assert.equal(vm.runInContext("drop(null,null,'user')",c),true,'E discarded the displayed gold ghost');assert.equal(c.committed,'console');
c.committed=null;slot.enabled=()=>false;assert.equal(vm.runInContext("drop(null,null,'user')",c),false);assert.equal(c.committed,null,'Disabled slot accepted a stale ghost');
// The same rule applies to green placement. Recheck the drawn footprint at its
// exact coordinates so a newly arrived blocker cannot be silently crossed.
const green={ok:true,room:'bedroom',x:45,y:73,z:-60,ry:0};c.drawnGhost.g=green;
const body={sw:0};let rest={ok:true,y:73},query;
c.bodyFor=()=>body;c.physReady=()=>({findRest(...args){query=args;return rest}});
assert.equal(vm.runInContext("drop(null,null,'user')",c),true);assert.equal(c.committed,green);assert.deepEqual(query.slice(1,5),['U',45,-60,0]);
for(const blocked of [{ok:false,y:73},{ok:true,y:90}]){rest=blocked;c.committed=null;assert.equal(vm.runInContext("drop(null,null,'user')",c),false);assert.equal(c.committed,null)}
c.drawnGhost.g=null;assert.equal(vm.runInContext("drop(null,null,'user')",c),false);
console.log('GHOST COMMIT PASS: cached/fresh disagreement reproduced; displayed target committed; invalidated slot refused');
