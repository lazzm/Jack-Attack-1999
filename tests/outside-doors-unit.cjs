'use strict';
// R241: the front and back doors never stand open all day. A door left open with nobody in or near it
// shuts itself after a short while; never on the player, never on someone about to use it; the saved pose follows.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','app/public/js/np-life.js'),'utf8');
const i=source.indexOf('  const OUTSIDE_DOORS'),j=source.indexOf('  // Dad changes after work',i);assert(i>0&&j>i);
assert(/outfits\(\);\n    outsideDoors\(dt\);\n    if \(simMode\) return;/.test(source),'outside doors run in the family tick, including fast-forwards');
function world(){
 const store={jhp_hs_pose:{x:0,d:{front:true,back:true,kitchen:true}}},calls=[];
 const door=(x0,x1,z0,z1,room)=>({open:true,ang:1,closedBounds:{x0,x1,z0,z1},rooms:[room,'drive']});
 const ctx={H:{live:true,DOORS:{front:door(400,500,600,606,'hall'),back:door(-300,-220,-400,-394,'kitchen'),kitchen:door(0,80,0,6,'hall')},ROOMS:{hall:{lvl:'G'},kitchen:{lvl:'G'}},setDoor:(id,open)=>{calls.push([id,open]);ctx.H.DOORS[id].open=open;ctx.H.DOORS[id].ang=open?1:0}},
  chars:[],pl:{x:-2000,z:-2000,lvl:'U'},ls:{get:k=>JSON.parse(JSON.stringify(store[k]??null)),set:(k,v)=>store[k]=v},Math};
 ctx.player=()=>ctx.pl;ctx.simMode=false;vm.createContext(ctx);vm.runInContext(source.slice(i,j)+';this.tick=outsideDoors;',ctx);
 return {ctx,store,calls,run:s=>{for(let t=0;t<s;t+=.1)ctx.tick(.1)}};
}
{const w=world();w.run(14);assert.deepEqual(w.calls,[],'closed too soon');w.run(1.5);
 assert.deepEqual(w.calls.map(c=>c[0]).sort(),['back','front'],'both outside doors shut after a short while with nobody about; inside doors untouched');
 assert.equal(w.store.jhp_hs_pose.d.front,false);assert.equal(w.store.jhp_hs_pose.d.back,false);assert.equal(w.store.jhp_hs_pose.d.kitchen,true,'a refresh shows them shut, nothing else changes');}
{const w=world();Object.assign(w.ctx.pl,{x:450,z:640,lvl:'G'});w.run(60);assert(!w.calls.some(c=>c[0]==='front'),'closed the front door on the player');assert(w.calls.some(c=>c[0]==='back'),'the back door still shuts');
 Object.assign(w.ctx.pl,{x:-2000,z:-2000});w.run(14);assert(!w.calls.some(c=>c[0]==='front'),'the wait restarts once the player walks away');w.run(2);assert(w.calls.some(c=>c[0]==='front'));}
{const w=world();w.ctx.chars.push({present:true,lvl:'G',x:0,z:0,opened:new Set(),cur:{k:'route',s:40,r:{doors:[{id:'back',s0:60,s1:90}]}}});w.run(60);
 assert(!w.calls.some(c=>c[0]==='back'),'closed a door in front of someone about to walk through it');assert(w.calls.some(c=>c[0]==='front'));
 w.ctx.chars[0].cur.s=200;w.ctx.chars[0].x=2000;w.run(16);assert(w.calls.some(c=>c[0]==='back'),'shut once they are well through');}
{const w=world();w.ctx.chars.push({present:true,lvl:'G',x:-260,z:-430,opened:new Set()});w.run(60);assert(!w.calls.some(c=>c[0]==='back'),'closed on somebody standing in the doorway');}
{const w=world();w.ctx.H.DOORS.front.ang=.5;w.run(30);assert(!w.calls.some(c=>c[0]==='front'),'a door still swinging is left alone');}
console.log('OUTSIDE DOORS UNIT PASS: shut after 15 s idle, never on the player or a walker, saved shut');
