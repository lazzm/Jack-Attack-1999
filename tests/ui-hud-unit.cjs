// Production monitor framing, with geometry and safe-area projection checks.
// Paths resolve from this file: the release gate runs from tests/.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../app/public/vendor/three.min.js');
const source=fs.readFileSync(require.resolve('../app/public/js/hs-world.js'),'utf8');
const start=source.indexOf('  function monitorPose() {'),end=source.indexOf('  function preparePCView()',start);
assert(start>0&&end>start,'Production monitor framing function');
for(const [vw,vh]of [[390,844],[844,390],[740,360],[768,1024],[1366,860]])for(const touch of [false,true])for(const safe of [0,20])for(const hudReady of [false,true]){
 const inset={paddingTop:String(safe),paddingRight:String(safe),paddingBottom:String(safe),paddingLeft:String(safe)};
 const context={window:{House:{},GameInput:{touch}},document:{querySelector:()=>hudReady?{}:null},getComputedStyle:()=>inset,
  House:{},T,vw,vh,GW:30,PERSP:115,em:10,monitorCentre:()=>new T.Vector3(10,-25,0)};
 vm.runInNewContext(source.slice(start,end),context);const pose=context.monitorPose();
 assert.equal(pose.seat,1);assert.equal(pose.rx,0);assert.equal(pose.ry,0);assert.equal(pose.lvl,'U');
 const project=(x,y)=>({x:vw/2+(x-pose.x)*1150/pose.z,y:vh/2+(y-pose.y)*1150/pose.z});
 const tl=project(-5,-36.25),br=project(25,-13.75),knownSafe=touch&&hudReady?safe:0,chin=touch?54+knownSafe:0;
 assert(tl.x>=knownSafe&&br.x<=vw-knownSafe,`${vw}x${vh} monitor width`);
 assert(tl.y>=knownSafe&&br.y<=vh-chin,`${vw}x${vh} touch=${touch} safe=${safe}: glass behind chin`);
 if(!touch){assert.equal(pose.x,10);assert.equal(pose.y,-25,'Desktop camera framing changed')}
}
console.log('UI HUD UNIT PASS: five viewport sizes, touch/mouse, safe areas, complete glass and unchanged desktop framing');

// Execute the actual carry renderer: hiding its old heading must not hide the
// first cartridge's next step, or replace a blocked/slot explanation with it.
const carryStart=source.indexOf('      carry(t,g){'),carryEnd=source.indexOf('      snapHint(',carryStart);
assert(carryStart>0&&carryEnd>carryStart);
let currentStep='lad';
const fields=new Map(),field=s=>{if(!fields.has(s))fields.set(s,{});return fields.get(s)};
const carryContext={window:{st:{current:()=>({id:currentStep})}},hold:{hidden:false,classList:{toggle(){}},querySelector:field},
 aimedAction:()=>null,actionLabel:()=> 'Read the case',whyText:()=> 'Blocked doorway',esc:String,
 tipEl:{classList:{contains:()=>false}},holdKey:'',snapKey:'',vw:1366,vh:860};
vm.runInNewContext('globalThis.panel={'+source.slice(carryStart,carryEnd)+'}',carryContext);
const cartridge={id:'cartridge',label:'Blockology — game box',gameId:'gb.blocks'};
carryContext.panel.carry(cartridge,{ok:true});
assert.match(field('.hs-carry-help').textContent,/put this in your Game Lad/i);
assert.equal(field('[data-h=put]').disabled,false);
currentStep='next';carryContext.panel.carry(cartridge,{ok:true});
assert.match(field('.hs-carry-help').textContent,/Green ghost/,'Old tutorial hint survived a step change');
currentStep='lad';carryContext.panel.carry(cartridge,{ok:false,why:'door'});
assert.match(field('.hs-carry-help').textContent,/Blocked doorway/);
assert.equal(field('[data-h=put]').disabled,true);
carryContext.panel.carry(cartridge,{ok:true,snap:{hint:'Insert it into the Game Lad'}});
assert.match(field('.hs-carry-help').textContent,/Gold outline: Insert/);
assert.equal(field('[data-h=put]').disabled,false);
console.log('UI CARRY UNIT PASS: first-cartridge guidance, step changes, blocked placement and gold slots');
