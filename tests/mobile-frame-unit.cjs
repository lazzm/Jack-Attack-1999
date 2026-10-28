// Demand-aware phone pacing: idle animation must not masquerade as a slow device.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require.resolve('../app/public/js/hs-world.js'),'utf8');
const code=s.slice(s.indexOf('  let lastR=0,goodBudget=0;'),s.indexOf('  function setTier('));
function device(mobile=true){const c={Q:{mob:mobile,tier:'potato',cap:60,capMiss:0,f:{n:0,t:0}},graphics:{dynamic:false},backgroundCovered:()=>false,dirty(){},framePercentile:()=>3,perfCosts:[]};vm.createContext(c);vm.runInContext(code,c);let now=100;return {c,advance(fps,seconds,continuous=true){const end=now+seconds*1000;while(now<end){now+=1000/fps;c.fpsTick(now,continuous)}return now}}}
const fast=device();fast.advance(60,10);assert.equal(fast.c.Q.cap,60,'Cap penalises a phone sustaining 60');
const slow=device();slow.advance(40,1.1);assert.equal(slow.c.Q.cap,60,'One slow window caused a cap change');slow.advance(40,1.1);assert.equal(slow.c.Q.cap,30,'Sustained misses did not settle at 30');
const retry=slow.c.Q.capRetry;slow.advance(30,20);assert.equal(slow.c.Q.cap,30,'Retried before cooldown');for(let i=0;i<120&&slow.c.Q.cap===30;i++)slow.advance(30,.1);assert.equal(slow.c.Q.cap,60,'Cheap frames did not get another chance at 60');assert(retry>30000);
const idle=device();idle.advance(20,20,false);assert.equal(idle.c.Q.cap,60,'Ambient frames lowered cap');idle.c.backgroundCovered=()=>true;idle.advance(20,20);assert.equal(idle.c.Q.cap,60,'Covered screen lowered cap');
const desktop=device(false);desktop.advance(40,5);assert.equal(desktop.c.Q.cap,60,'Phone pacing changed desktop');
const expensive=device();expensive.advance(40,2.2);expensive.c.framePercentile=()=>12;expensive.advance(30,40);assert.equal(expensive.c.Q.cap,30,'Expensive frames repeatedly retried 60');
console.log('MOBILE FRAME PASS: sustained 60, two-window fallback, cooldown/retry, expensive-frame guard, idle/covered/desktop isolation');
