// Production feeding with real F input and persisted progress, on a disposable localhost account.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2];assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const name='Cat'+Date.now().toString(36),pass='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name,pass})})).ok);
const f=await roomFixture(base,{account:name,password:pass,signup:false});
const {page:p,until,errors}=f,dir=fileURLToPath(new URL('shots/cat-feeding/',import.meta.url));await mkdir(dir,{recursive:true});
try{
 await p.evaluate(async()=>{await Chores.load();await Chores.part('bedroom')});
 await until(()=>!!House.THINGS['ch.catbox']&&!!House.SPOTS.cat.obj.userData.tree);
 const home=await p.evaluate(()=>{const c=House.SPOTS.cat.obj;return{x:c.position.x,y:c.position.y,z:c.position.z,pose:c.userData.homePose}});
 console.log('Cat room ready');await f.view([100,-70,140],[122,68,112]);assert(await p.evaluate(()=>{House._.setMode('walk');return House.grab('ch.catbox')}),'Cat biscuits not picked up');
 await p.waitForTimeout(800);await p.keyboard.press('f');
 const pourEnd=Date.now()+20000;while(Date.now()<pourEnd&&!await p.evaluate(()=>ChoreKit.has('cat','pour')))await p.waitForTimeout(200);
 assert(await p.evaluate(()=>ChoreKit.has('cat','pour')),'F did not pour: '+JSON.stringify(await p.evaluate(()=>({held:House.held(),pos:House.THINGS['ch.catbox'].obj.position.toArray(),mode:House.mode}))));
 console.log('Cat biscuits poured');
 await p.evaluate(()=>House.putBack());await p.screenshot({path:dir+'01-bowl-filled.png'});
 await f.view([-10,-70,110],[home.x,home.y+24,home.z]);await p.evaluate(()=>{House._.setMode('walk');window.__catPath=[];const c=House.SPOTS.cat.obj;(function sample(){__catPath.push({x:c.position.x,y:c.position.y,z:c.position.z,pose:c.userData.poseName});if(__catPath.length<900&&!ChoreKit.has('cat','ate'))requestAnimationFrame(sample)})();House.act('cat')});
 await until(()=>House.SPOTS.cat.obj.userData.poseName==='walk');
 await p.screenshot({path:dir+'02-coming-down.png'});
 await until(()=>House.SPOTS.cat.obj.userData.poseName==='eat');
 await f.view([65,30,172],[112,65,114]);await p.screenshot({path:dir+'03-eating.png'});
 await until(()=>ChoreKit.has('cat','ate'));
 const path=await p.evaluate(()=>__catPath);assert(path.some(v=>v.y>0&&v.y<70),'No visible intermediate descent');assert(path.filter(v=>v.pose==='eat').every(v=>v.x<120),'Eating torso overlaps the bed');
 await until(()=>{const c=House.SPOTS.cat.obj,t=c.userData.tree;return Math.hypot(c.position.x-t.top.x,c.position.z-t.top.z)<.1&&Math.abs(c.position.y-t.top.y)<.1&&c.userData.poseName===c.userData.homePose});
 await f.view([-10,-70,110],[home.x,home.y-12,home.z]);await p.screenshot({path:dir+'04-back-home.png'});
 await p.evaluate(()=>House.saveWalkState());const power=await p.evaluate(()=>localStorage.getItem('jhp_off'));
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));
 await p.evaluate(async()=>{await Chores.load();await Chores.part('bedroom')});await until(()=>ChoreKit.has('cat','ate'));
 assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),power);assert.equal(await p.evaluate(()=>ChoreKit.has('cat','pour')),true);
 assert.deepEqual(errors,[]);console.log('CAT FEEDING PASS: F pours, tree descent, walk/eat/return, progress and PC power survive refresh');
}catch(e){console.log('Cat state',await p.evaluate(()=>({mode:House.mode,held:House.held(),pour:ChoreKit.has('cat','pour'),ate:ChoreKit.has('cat','ate')})).catch(()=>null));await p.screenshot({path:dir+'failure.png'}).catch(()=>{});throw e}finally{await f.browser.close()}
