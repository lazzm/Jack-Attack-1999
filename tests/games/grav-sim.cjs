const fs=require('fs'),vm=require('vm'),assert=require('assert');
// Production physics/save checks without a GPU. Rendering and browser inputs are covered by grav.mjs.
const root=require('path').resolve(__dirname,'../..'),THREE=require(root+'/app/public/vendor/three.min.js');
let saved={},buttons={},held={},game,def;
const grad={addColorStop(){}};
const canvas=()=>({width:0,height:0,getContext(){const g=new Proxy({canvas:this,createLinearGradient:()=>grad,createRadialGradient:()=>grad,getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:s=>({width:s.length*6})},{get:(o,k)=>o[k]||(()=>{})});return g;}});
const doc={createElement:canvas,addEventListener(){},removeEventListener(){},hidden:false};
const seededMath=Object.create(Math);let seed=3000;seededMath.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const ctx={console,Math:seededMath,Float32Array,Uint8Array,Uint8ClampedArray,Set,Map,Promise,JSON,Number,String,Object,Array,Date,document:doc,performance,localStorage:{data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,String(v))},removeItem(k){this.data.delete(k)},get length(){return this.data.size},key(n){return [...this.data.keys()][n]}},addEventListener(){},removeEventListener(){},Cast:{n:id=>id.toUpperCase(),first:id=>id.toUpperCase(),me:()=>({first:'PLAYER'})}};
ctx.window=ctx;let mirrorWrites=0;const storageKey=k=>'jhp_gs_'+k.replace(/[^A-Za-z0-9._-]/g,'_');ctx.Apps={defineSecret(){},loadGame(k){try{return JSON.parse(ctx.localStorage.getItem(storageKey(k))).s}catch(e){return null}},saveGame(k,s,o){mirrorWrites++;ctx.localStorage.setItem(storageKey(k),JSON.stringify({f:1,v:o.v,s}));return true}};ctx.RoomTV={game:(id,d)=>def=d};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'/app/public/js/rm-g-racekit.js','utf8'),ctx);
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(70,4/3,.3,900);
scene.fog=new THREE.Fog(0,60,320);
const T3={T:THREE,scene,cam,keep:x=>x,add:x=>scene.add(x),mat:o=>new THREE.MeshBasicMaterial(),tex:(w,h,f)=>{const c=canvas();c.width=w;c.height=h;if(f)f(c.getContext('2d'),w,h);return new THREE.Texture(c)},tile:x=>x,render(){},lights:()=>({hemi:new THREE.HemisphereLight(),sun:new THREE.DirectionalLight()}),ren:{info:{render:{calls:0,triangles:0}}}};
const K={three:()=>T3,hud:canvas().getContext('2d'),font:{draw(){},center(){}},W:320,H:240,load:()=>JSON.parse(JSON.stringify(saved)),save:s=>{saved=JSON.parse(JSON.stringify(s))},sfx:new Proxy({},{get:()=>()=>{}}),music(){},secret(){},over(){},held:k=>held[k],pressed:k=>buttons[k],stick:()=>({x:0,y:0}),any:()=>Object.values(buttons).some(Boolean),keyLabel:x=>x,label:x=>x,t:0,frame:0};
vm.runInContext(fs.readFileSync(root+'/app/public/js/rm-g-grav.js','utf8'),ctx);game=def.make(K);
const step=n=>{for(let j=0;j<n;j++){K.t+=1/60;K.frame++;game.update(1/60);buttons={};}};
const dbg=()=>ctx.__gravDbg,st=()=>dbg().st;
const press=k=>{buttons={[k]:true};step(1);step(2)};
const race=(kind,track=0,cls=0)=>{dbg().race(kind,track,cls);dbg().go();step(1)};
function restore(label){dbg().save();const pre=st(),old=JSON.parse(JSON.stringify(saved));game.end();game=def.make(K);const post=st();assert.equal(post.mode,pre.mode,label+' mode');assert.equal(post.track,pre.track,label+' track');assert.equal(post.raceT,pre.raceT,label+' clock');assert(Math.abs(post.me.prog-pre.me.prog)<1e-6,label+' progress');assert.equal(post.me.energy,pre.me.energy,label+' energy');assert.equal(post.me.wep,pre.me.wep,label+' weapon');if(['race','count'].includes(post.mode)){assert(post.paused);press('start')}return old;}
// Every class, every circuit: complete three laps using the actual AI controller and physics.
ctx.__rmAuto=true;
for(let cls=0;cls<4;cls++)for(let track=0;track<12;track++){
 race('race',track,cls);let n=0;for(;n<24000&&!['finish','results'].includes(st().mode);n+=60)step(60);
 const s=st();if(!s.me.done||s.me.out)console.error('RACE FAILURE',JSON.stringify({cls,track,n,me:s.me,time:s.raceT}));assert(s.me.done&&!s.me.out,'Finish track '+track+' class '+cls);assert(s.ships.every(x=>Number.isFinite(x.prog)&&x.e>=0));console.log('SIM',cls,track,n,'frames',Math.round(s.me.energy)+' shield');
}
// Legacy saves survive in place, including balance-independent records and old championship unlocks.
const oldBest=33.21;game.end();saved={best:oldBest,hi:[{n:'PERSONAL ENTRY',s:1234}],champ:{0:1},unl:{sup:1},team:0};game=def.make(K);assert.equal(st().sv.best,oldBest);assert.equal(st().sv.lap[0],oldBest);assert(st().sv.unl.sup);assert(st().sv.hi.some(h=>h.s===1234&&h.n==='PERSONAL ENTRY'));
race('race');step(400);dbg().give('SHIELD');press('start');restore('paused race');
// Loading and countdown snapshots reconstruct their track and grid.
dbg().race('race',6,2);step(1);restore('loading');dbg().go();press('start');restore('countdown');
// Recordings are compact strings in live saves and retain their samples on resume.
race('tt');step(400);restore('ghost trial');assert(typeof saved.live.gh==='string');
dbg().at(.97,0,55);dbg().skipLaps(2);for(let i=0;i<600&&st().mode!=='finish';i++)step(1);assert.equal(st().mode,'finish');restore('finish');
for(let i=0;i<400&&st().mode!=='ttres';i++)step(1);assert.equal(st().mode,'ttres');restore('trial results');
// Mirrored ghosts roam only within the spare small-save budget; a newer local ghost wins over a stale mirror.
race('tt');assert(st().ghost);const writes=mirrorWrites;ctx.localStorage.setItem('jhp_gs_reserved','X'.repeat(170000));step(180);dbg().at(.99,0,70);dbg().skipLaps(2);for(let i=0;i<600&&st().mode!=='ttres';i++)step(1);assert.equal(mirrorWrites,writes);assert.equal(ctx.localStorage.getItem('jhp_gs_reserved').length,170000);race('tt');assert(st().ghost,'New local ghost remains available when roaming budget is full');ctx.localStorage.removeItem('jhp_gs_reserved');
// Weapon shields prevent both energy loss and terminal damage.
ctx.__rmAuto=false;race('race');dbg().give('SHIELD');press('b');const e=st().me.energy;dbg().hurt(1000);assert.equal(st().me.energy,e);assert(!st().me.out);
// A complete league takes eight independent results; each result contributes once after restore.
const originalCastName=ctx.Cast.n;ctx.Cast.n=()=>ctx.Cast.me().first;ctx.__rmAuto=true;race('champ');for(let round=0;round<8;round++){
 if(round){dbg().go();step(1)}dbg().at(.97,0,55);dbg().skipLaps(2);for(let i=0;i<700&&st().mode!=='results';i++)step(1);assert.equal(st().mode,'results');assert.equal(Object.keys(st().champ.pts).length,12);const pts=JSON.stringify(st().champ.pts);restore('league results');assert.equal(JSON.stringify(st().champ.pts),pts);step(70);press('a');assert.equal(st().mode,'standings');restore('standings');step(70);press('a');
}
assert.equal(st().mode,'podium');assert(st().sv.unl.sup);restore('podium');step(250);press('a');assert.equal(st().mode,'ending');restore('ending page one');step(70);press('a');restore('ending page two');step(70);press('a');assert.equal(st().mode,'credits');restore('credits');ctx.Cast.n=originalCastName;
// Combat respawns, checkpoint clock extension and time-out all terminate cleanly.
race('elim');dbg().hurt(1000);assert(st().me.out);step(150);assert(!st().me.out&&st().me.energy>80);restore('combat');ctx.__rmAuto=false;for(let i=0;i<5;i++){dbg().at(.04,0,30);assert(dbg().target());dbg().give('BOLTS');press('b');step(25);}assert(st().me.kos>=5&&st().mode==='finish');
ctx.__rmAuto=true;race('attack');const t0=st().attackLeft;step(30);dbg().at(.99,0,55);dbg().skipLaps(1);step(90);assert(st().attackLeft>t0);ctx.__rmAuto=false;held={};step(6000);assert(['finish','ttres'].includes(st().mode));
// Finish fixtures exercise every medal/blueprint unlock through production finish code.
ctx.__rmAuto=true;for(let cls=0;cls<4;cls++)for(let team=0;team<4;team++)for(let track=0;track<8;track++){st().sv.team=team;race('race',track,cls);dbg().at(.99,0,70);dbg().skipLaps(2);for(let i=0;i<200&&st().mode!=='finish';i++)step(1);assert.equal(st().sv.medals[cls+':'+track+':'+team],1);}
for(let cls=0;cls<4;cls++)assert(st().sv.unl['proto'+cls],'Blueprint '+cls);
// Complete the other three league classes; the class ladder and secret prototype are permanent.
for(let cls=1;cls<4;cls++){race('champ',0,cls);for(let round=0;round<8;round++){if(round){dbg().go();step(1)}dbg().at(.99,0,70);dbg().skipLaps(2);for(let i=0;i<700&&st().mode!=='results';i++)step(1);step(70);press('a');step(70);press('a');}assert.equal(st().mode,'podium');if(cls<3)assert(st().sv.unl['class'+(cls+1)]);}
assert(st().sv.unl.nullp&&st().sv.champ[3]===1);
// Licence navigation and goals use actual button edges; only race distance/target condition is staged.
ctx.__rmAuto=false;for(let id=0;id<24;id++){dbg().title();press('start');if(id===0)for(let i=0;i<5;i++)press('down');press('a');assert.equal(st().mode,'challenge');if(id){if(id%3===0)press('down');press('right');}press('a');dbg().go();step(1);if(id%3===2){for(let i=0;i<3;i++){dbg().at(.04,0,30);assert(dbg().target());dbg().give('BOLTS');press('b');step(25);}}else{ctx.__rmAuto=true;dbg().at(.99,0,70);dbg().skipLaps(2);for(let i=0;i<200&&st().mode!=='finish';i++)step(1);ctx.__rmAuto=false;}assert(st().sv.challenges[id],'Licence '+id);}
for(let team=5;team<8;team++)assert(st().sv.unl['team'+team]);
assert(!scene.children.some(o=>o.position&&(!Number.isFinite(o.position.x)||!Number.isFinite(o.position.y))));
console.log('GRAV SIM PASS: 48 complete races, legacy migration, live-state restores, four league endings, all medal/blueprint/licence unlocks, shields, combat and checkpoint clock');
