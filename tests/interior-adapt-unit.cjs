// Exercise the real pacing rule with visible 800 ms frames and recovery windows.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/public/js/hs-world.js'),'utf8');
const rule=source.slice(source.indexOf('  function fpsTick('),source.indexOf('  function adaptTo('));
function simulation(level){const steps=[],c={Q:{f:{n:0,t:0},mob:true,cap:60,capMiss:0,adapt:level,pinned:false},ADAPT:Array(6),lastR:0,lastStep:0,lastDown:0,slowBudget:0,goodBudget:0,perfCosts:[],backgroundCovered:()=>false,dirty(){},framePercentile:()=>2};c.adaptTo=n=>{steps.push({at:c.now,from:c.Q.adapt,to:n});c.Q.adapt=n;c.Q.f.n=c.Q.f.t=0;c.lastR=0};vm.createContext(c);vm.runInContext(rule,c);return{c,steps,frame(at){c.now=at;c.fpsTick(at,true)}}}
const slow=simulation(0);for(let t=800;t<=40000;t+=800)slow.frame(t);assert.equal(slow.c.Q.adapt,5,'Visible 800 ms frames must reach the cheapest rung');assert.deepEqual(slow.steps.map(s=>s.to),[1,2,3,4,5]);
const fast=simulation(4);fast.c.lastDown=1;for(let t=1000/60;t<60000;t+=1000/60)fast.frame(t);assert.equal(fast.c.Q.adapt,4,'A cheap-to-full recovery must hold for sixty stable seconds');for(let t=60000;t<=63000;t+=1000/60)fast.frame(t);assert.equal(fast.steps[0]?.to,3);
const pinned=simulation(0);pinned.c.Q.pinned=true;for(let t=800;t<=30000;t+=800)pinned.frame(t);assert.equal(pinned.c.Q.adapt,0,'An explicit diagnostic pin must remain pinned');
console.log('INTERIOR ADAPT PASS: slow visible frames count, one-way step-down, sixty-second lighting recovery, diagnostic pin');
