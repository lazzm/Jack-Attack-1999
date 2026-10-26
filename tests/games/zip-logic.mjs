// Deterministic long-flow checks. Real game logic and THREE geometry, no raster/audio.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const T=createRequire(import.meta.url)('../../app/public/vendor/three.min.js');
const noop=()=>{},gradient={addColorStop:noop};
const g=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,createPattern:()=>({}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:s=>({width:s.length*6})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const canvas=()=>({width:0,height:0,getContext:()=>g});g.canvas=canvas();
let defs={},saved=null,down=new Set(),edges=new Set(),over=[];
const sandbox={console,document:{createElement:canvas,addEventListener:noop,removeEventListener:noop},setTimeout:noop,addEventListener:noop,removeEventListener:noop,RoomTV:{game:(id,d)=>defs[id]=d},Cast:{n:id=>'MATE'},Apps:{defineSecret:noop},THREE:T};sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['rm-g-zip.js','rm-g-dash.js'])vm.runInContext(await readFile(new URL('../../app/public/js/'+file,import.meta.url),'utf8'),sandbox,{filename:file});
function kit(){const scene=new T.Scene(),cam=new T.PerspectiveCamera(66,4/3,.3,700);scene.fog=new T.Fog(0,180,560);const t3={T,scene,cam,keep:x=>x,add:x=>(scene.add(x),x),tex:(w,h,paint)=>{const c=canvas();c.width=w;c.height=h;paint(g,w,h);return new T.CanvasTexture(c)},mat:p=>new T.MeshLambertMaterial({color:p.color??0xffffff,vertexColors:!!p.vcol,...(p.map?{map:p.map}:{})}),lights:()=>({hemi:new T.HemisphereLight(),sun:new T.DirectionalLight()}),render:noop};return{W:640,H:480,g,hud:g,font:{draw:noop,center:noop,width:s=>s.length*6},frame:0,t:0,restoring:false,load:()=>saved&&structuredClone(saved),save:s=>{saved=structuredClone(s)},music:noop,sfx:new Proxy({},{get:()=>noop}),secret:noop,over:(...v)=>over.push(v),label:b=>b,keyLabel:b=>b,held:b=>down.has(b),pressed:b=>edges.has(b),stick:()=>({x:+down.has('right')-+down.has('left'),y:+down.has('down')-+down.has('up')}),any:()=>edges.size>0,rnd:seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),three:()=>t3}}
let k=kit(),game=defs['md.zip'].make(k);
function step(n=1){for(let i=0;i<n;i++){k.frame++;k.t+=1/60;game.update(1/60);edges.clear()}}
function press(b){edges.add(b);step()}
for(let act=0;act<12;act++){
 sandbox.__zipDo.go(act);step(200);const l=sandbox.__zipDo.level;
 assert(l.objs.every(o=>Number.isFinite(o.x)&&Number.isFinite(o.y)),'Nonfinite object in act '+act);
 assert(l.plats.every(o=>Number.isFinite(o.x)&&Number.isFinite(o.y)),'Nonfinite platform in act '+act);
 assert(l.len>3500,'Act too short '+act);
 down.add('right');step(120);down.clear();assert(sandbox.__zipDbg().x>100);
 press('start');const frozen=JSON.stringify(sandbox.__zipDbg());step(90);assert.equal(JSON.stringify(sandbox.__zipDbg()),frozen,'Paused state moved');
 sandbox.__zipDo.save();assert(saved.run&&saved.cont);assert(JSON.stringify(saved).length<18000,'Run no longer fits roaming profile');const r=structuredClone(saved.run);assert(sandbox.__zipDo.resume());assert.equal(sandbox.__zipDbg().x,Math.floor(r.player.x));assert.equal(sandbox.__zipDbg().rings,r.rings);assert.equal(sandbox.__zipDbg().paused,true);
 console.log('ZIP act '+act+': '+l.name+' / '+l.len+'px; finite, moves, pauses, resumes');
}
if(process.argv.includes('--pilot')){
 for(let act=0;act<12;act++){sandbox.__zipDo.go(act);sandbox.__zipDo.lives(50);sandbox.__zipAI=true;let far=0;for(let frame=0;frame<18000;frame++){step();far=Math.max(far,sandbox.__zipDbg().x);if(sandbox.__zipDbg().act!==act||sandbox.__zipDo.mode()!=='play'||sandbox.__zipDbg().boss?.on)break}console.log('PILOT '+act+' '+JSON.stringify({far,state:sandbox.__zipDbg()}));sandbox.__zipAI=false}
}
// Bounded terrain pilot uses only the same held/pressed controls after approach setup.
// Invincibility isolates landing geometry from enemies; it cannot prevent falling into a pit.
for(let act=6;act<12;act++){
 sandbox.__zipDo.go(act);const hm=sandbox.__zipDo.level.hm,gaps=[];for(let x=0;x<hm.length;x++)if(!Number.isFinite(hm[x])){const start=x;while(x<hm.length&&!Number.isFinite(hm[x]))x++;gaps.push([start,x])}
 for(const[start,end]of gaps){sandbox.__zipDo.go(act);sandbox.__zipDo.inv();const p=sandbox.__zipDo.P;Object.assign(p,{x:start-90,y:hm[start-90],gsp:6,vx:6,ground:true});down.add('right');for(let f=0;f<300&&p.x<end+20&&!p.dead;f++){if(p.ground&&p.x>=start-22){if(down.has('a'))down.delete('a');else{down.add('a');edges.add('a')}}step()}down.clear();assert(!p.dead&&p.x>=end+20,'Unreachable pit approach '+act+' '+start+'..'+end);console.log('TERRAIN '+act+' pit '+start+'..'+end+' crossed')}
}
// Ring loss preserves lives; zero-ring damage consumes exactly one life after recovery.
sandbox.__zipDo.go(0);sandbox.__zipDo.rings(12);sandbox.__zipDo.hit();assert.equal(sandbox.__zipDbg().rings,0);assert.equal(sandbox.__zipDbg().lives,3);step(180);
sandbox.__zipDo.go(0);sandbox.__zipDo.hit();step(160);assert.equal(sandbox.__zipDbg().lives,2);
// All six machines take their full damage through the production collision path.
for(const act of [1,3,5,7,9,11]){sandbox.__zipDo.go(act);sandbox.__zipDo.inv();const b=sandbox.__zipDo.level.boss;sandbox.__zipDo.warp(b.x0+80);step(220);const hp=b.hp;let strikes=0;while(b.hp>0&&strikes++<hp+2){const before=b.hp;b.hitT=0;Object.assign(sandbox.__zipDo.P,{x:b.x,y:b.y+14,vx:0,vy:0,gsp:0,ground:false,ball:true,roll:false,dead:false});step();assert.equal(b.hp,before-1,'Machine did not accept a spinning collision '+act);if(b.hp>0)step(61)}assert(b.dead)}
console.log('ZIP six machines accept all spinning collisions PASS');
// Every boss release capsule leads into the following act, including the final ending.
for(const act of [1,3,5,7,9,11]){sandbox.__zipDo.go(act);assert(sandbox.__zipDo.boss());step(210);assert(sandbox.__zipDo.cap());step(75);step(1000);assert(act===11?sandbox.__zipDo.mode()==='won':sandbox.__zipDbg().act===act+1,'Boss progression failed '+act)}
console.log('ZIP six boss/capsule/result/next-act flows PASS');
for(let i=0;i<6;i++){sandbox.__zipDo.go(i);sandbox.__zipDo.bonus();sandbox.__zipDo.rings(40);sandbox.__zipDo.sign();step(60);assert.equal(saved.gems[i],1);sandbox.__zipDo.save();assert(sandbox.__zipDo.resume());step(180);assert.equal(sandbox.__zipDbg().act,i+1)}
sandbox.__zipDo.go(0);sandbox.__zipDo.rings(50);press('select');assert(sandbox.__zipDbg().superT>0);const life=sandbox.__zipDbg().lives;sandbox.__zipDo.hit();assert.equal(sandbox.__zipDbg().lives,life);step(61);assert.equal(sandbox.__zipDbg().rings,49);console.log('ZIP six bonus stones, saved return and Burrow Power drain/protection PASS');

game.end();saved=null;k=kit();game=defs['dc.dash'].make(k);
for(let stage=0;stage<5;stage++){
 sandbox.__dashDbg.go(stage);step(90);const d=sandbox.__dashDbg;assert(Number.isFinite(d.P.s)&&d.P.s>2);press('start');const old=d.P.s;step(90);assert.equal(d.P.s,old);d.save();assert(JSON.stringify(saved).length<18000,'Run no longer fits roaming profile');const r=structuredClone(saved.run);assert(d.resume());assert.equal(d.P.s,r.player.s);assert.equal(d.rings,r.rings);assert(d.paused);assert(d.prog.journey===null||d.prog.journey.stage>=0);console.log('DASH stage '+stage+': geometry, movement, pause and resume PASS');
}
// Boss damage must come from a real homing collision, not a debug win flag.
sandbox.__dashDbg.go(4);const d=sandbox.__dashDbg;d.P.inv=999;
for(let hp=6;hp>0;hp--){const b=d.BOSS;b.on=true;b.inv=0;b.st='swoop';b.h=2.6;b.u=0;b.s=d.P.s+8;Object.assign(d.P,{air:true,airJ:true,h:2.6,vh:0,homing:b,hTime:0,u:0});step(8);assert.equal(b.hp,hp-1);if(hp===4){d.save();assert(d.resume());assert.equal(d.BOSS.hp,3)}step(90)}
step(250);assert.equal(d.mode,'ending');assert.equal(d.prog.clear,1);assert(d.prog.badges['boss.clear']);console.log('DASH six homing boss hits -> ending and saved clear PASS');
game.end();console.log('ZIP LOGIC PASS');
