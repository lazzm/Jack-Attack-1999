// A GPU context rebuild must keep static batching, the saved pose and PC power.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {provisionedRoom} from './provisioned-room.mjs';
const f=await provisionedRoom(process.argv[2],{timeoutScale:4,debug:true}),{page:p,until,errors}=f;
const dir=new URL('shots/gfx-context/',import.meta.url).pathname;await mkdir(dir,{recursive:true});
try{
 await p.evaluate(()=>{House.hush();StoryGuide.setting('off');House.ambient.clear();House.anims.clear();House._.setMode('focus')});await p.waitForTimeout(4000);
 const before=await p.evaluate(()=>{window.contextOldRenderer=House.ren;return{batches:Object.values(House.ROOMS).reduce((n,r)=>n+HouseStatic.stats(r.group).batches,0),pose:[House.P.x,House.P.y,House.P.z,House.P.rx,House.P.ry],power:localStorage.getItem('jhp_off')}});
 assert(before.batches>50,JSON.stringify(before));await p.screenshot({path:dir+'before.png'});
 await p.evaluate(()=>{const x=House.ren.getContext().getExtension('WEBGL_lose_context');if(!x)throw Error('No context-loss test extension');x.loseContext()});
 await until(()=>House.ren!==contextOldRenderer&&!House.ren.getContext().isContextLost());await p.waitForTimeout(2000);
 const after=await p.evaluate(()=>{House._.renderForBenchmark();return{batches:Object.values(House.ROOMS).reduce((n,r)=>n+HouseStatic.stats(r.group).batches,0),pose:[House.P.x,House.P.y,House.P.z,House.P.rx,House.P.ry],power:localStorage.getItem('jhp_off'),programs:House.ren.info.programs.length}});
 assert(after.batches>=before.batches,'Rebuild discarded healthy static batches: '+JSON.stringify({before,after}));assert.deepEqual(after.pose,before.pose);assert.equal(after.power,before.power);assert(after.programs>0);await p.screenshot({path:dir+'restored.png'});
 assert.deepEqual(errors.filter(e=>!/context[ _-]lost/i.test(e)),[]);console.log('GRAPHICS CONTEXT PASS',JSON.stringify({before,after}));
}finally{await f.browser.close()}
