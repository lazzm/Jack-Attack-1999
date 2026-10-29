// Exercise the production surface-framing callback against an in-flight focus move.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/../app/public/js/rm-tv.js','utf8');
const fn=src.slice(src.indexOf('  function frameSurface(ms) {'),src.indexOf('  function releaseSurface()'));
const jobs=new Map(),moves=[];let next=0;
const H={focused:true,gliding:true,glideTo(p,o){assert(!this.gliding,'Framing cancelled the focus move');moves.push({p,o})}};
const c=vm.createContext({R:{House:H},V:{gid:'test',surface:{}},defs:{test:{screenPose:()=>({x:1,y:2,z:3})}},setTimeout:f=>{jobs.set(++next,f);return next},clearTimeout:id=>jobs.delete(id)});
vm.runInContext(fn,c);const frame=()=>vm.runInContext('frameSurface(450)',c);
const tick=()=>{const pending=[...jobs.values()];jobs.clear();pending.forEach(f=>f())};
frame();assert.equal(moves.length,0);assert.equal(jobs.size,1);
frame();assert.equal(jobs.size,1,'Duplicate framing timers');H.gliding=false;tick();assert.equal(moves.length,1);assert.equal(moves[0].o.ms,450);
H.gliding=true;frame();H.focused=false;tick();assert.equal(moves.length,1,'Leaving focus resumed the screen');
H.focused=true;frame();c.V={gid:'test',surface:{}};H.gliding=false;tick();assert.equal(moves.length,1,'Old screen framed a replacement');
c.V.background=true;frame();assert.equal(moves.length,1);
console.log('PASS surface framing waits for focus, coalesces, and abandons closed/replaced screens');
