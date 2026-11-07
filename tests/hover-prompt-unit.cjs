// Execute the production hover scheduling branch with fast and stalled frames.
// A render-frame modulus must never defer an expired prompt refresh deadline.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app/public/js/hs-world.js'),'utf8');
const loop=source.slice(source.indexOf('  function loop(now) {'));
const branch=loop.slice(loop.indexOf('    if (',loop.indexOf('// People move')),loop.indexOf('    frame++;'));
assert(branch.includes('hover();'),'Missing production hover scheduling branch');
function step(c,now,frame){Object.assign(c,{now,frame});vm.runInContext(branch,c);}
function fixture(){const c={hoverQ:true,lastHover:0,refreshes:0};c.hover=()=>c.refreshes++;return vm.createContext(c);}
let c=fixture();step(c,600,1);assert.equal(c.refreshes,1,'Slow frame left a queued Talk prompt empty');assert.equal(c.lastHover,600);assert.equal(c.hoverQ,false);
c=fixture();c.hoverQ=false;step(c,600,2);assert.equal(c.refreshes,1,'Stationary pointer failed to recover a cleared prompt');
c=fixture();step(c,20,1);assert.equal(c.refreshes,0,'Fast mouse look lost its existing pick throttle');step(c,30,3);assert.equal(c.refreshes,1);
step(c,149,4);assert.equal(c.refreshes,1,'Idle pointer refreshed before its deadline');step(c,150,5);assert.equal(c.refreshes,2,'Moving NPC label waited for a render-frame modulus');
console.log('HOVER PROMPT PASS: queued and stationary prompts meet their deadline on slow frames; fast input stays throttled');
