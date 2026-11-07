// Real helper, controlled renderer cadence: API calls alone never present a frame.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
async function run(source){
 const id='media.box.sn.fight',sid='console.sn',box={id,st:'rest',snap:null,at:{x:0,y:0,z:0},canGrab:()=>true};let held=null,ghost=null,frames=0,commits=0;
 const H={SNAPS:{[sid]:{x:10,y:300,z:20,room:'cupboard'}},ROOMS:{cupboard:{lvl:'G',area:[[-500,-500,500,500]],stations:[{pose:{x:40,z:30}}]}},LV:{G:353},STAND:140,THINGS:{[id]:box,'media.sn.fight':{}},_:{floorAt:()=>({lvl:'G',y:353}),setMode(){}},hush(){},held:()=>held,ghost:()=>ghost,perf:()=>({frames}),grab(){held=id;box.st='held';return true},isAway:()=>false};
 const present=()=>{frames++;ghost={snap:{id:'case.insert.'+sid},x:1,y:2,z:3}};
 const p={evaluate:async(fn,arg)=>fn(arg),waitForTimeout:async()=>present(),keyboard:{press:async key=>{if(key==='e'){assert(ghost,'E cannot invent a drawn picture');commits++;box.snap='case.park.'+sid;box.at={x:ghost.x,y:ghost.y,z:ghost.z};held=null}}},waitForFunction:async(fn,arg)=>{for(let i=0;i<3;i++){present();if(fn(arg))return}throw Error('No presented ghost') }};
 const c={House:H,HouseCases:{busy:false},assert,process:{env:{}}};vm.createContext(c);
 const part=source.slice(source.indexOf('export async function caseGhostFrame')<0?source.indexOf('// Find a real gold'):source.indexOf('export async function caseGhostFrame'),source.indexOf('// Provision through'));
 vm.runInContext(part.replace(/export /g,'')+';this.insert=insertCase;',c);
 await c.insert({page:p,view:async()=>{ghost=null}},id,sid);return{commits,frames};
}
(async()=>{
 const fixed=await run(fs.readFileSync(process.argv[2]||require.resolve('./case-actions.mjs'),'utf8'));assert.equal(fixed.commits,1);assert(fixed.frames>0);
 console.log('CASE FRAME PASS: helper waits for a drawn gold ghost under controlled renderer cadence and commits it once');
})().catch(e=>{console.error(e);process.exitCode=1});
