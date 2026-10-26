// From tests/: node sparse-polish.mjs http://localhost:18087 [before|after] [--room-only]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18081',account='Sparse'+Date.now().toString(36);
// Capture the committed baseline through browser-only request overrides; never
// replace worktree files or touch the throwaway server's account data.
const baseline=process.argv[3]==='before',originals=new Map(baseline?['rm-room.js','hs-world.js','pm-gl.js','pm-media.js'].map(file=>[file,execFileSync('git',['show','HEAD:app/public/js/'+file],{encoding:'utf8'})]):[]);
const {browser,page:p,errors,until,view}=await roomFixture(base,{account,onPage:baseline?page=>page.route('**/js/*.js*',route=>{const source=originals.get(new URL(route.request().url()).pathname.split('/').pop());return source?route.fulfill({contentType:'application/javascript',body:source}):route.continue()}):undefined});
fs.mkdirSync('shots/sparse-polish',{recursive:true});
async function aim(eye,target,level='U'){await view(eye,target,{level});await p.evaluate(()=>{House.hush();House._.setMode('walk')})}
async function shot(name){await p.screenshot({path:'shots/sparse-polish/'+(process.argv[3]||'after')+'-'+name+'.png'})}
async function parcelAim(id,eye=[300,225,610]){const target=await p.evaluate(id=>{const v=House.SPOTS['pm.parcel.'+id].obj.position;return[v.x,v.y-7,v.z]},id);await aim(eye,target,'G')}
async function catalogueShot(name,status){
 await p.evaluate(()=>{House.sitDown()});await until(()=>House.mode==='monitor');
 await p.evaluate(()=>{House.desktopDisplay(true);PM.catalogue('hardware.n64')});await p.waitForTimeout(700);
 if(status&&process.argv[3]!=='before')assert.match(await p.locator('[data-pp="hardware.n64"]').first().innerText(),new RegExp(status));
 await shot(name);await p.evaluate(()=>{House.desktopDisplay(false);document.querySelector('#browser')?.classList.add('min')});await p.keyboard.press('q');await until(()=>House.mode==='walk');
}
async function roomArt(){
 for(const [name,eye,target]of [
  ['01-sparse-room',[-80,-55,180],[-185,40,-25]],
  ['01b-door',[210,-55,184],[-150,5,70]],
  ['01c-books',[-120,-50,115],[-155,-5,234]],
  ['01d-tv-rack',[-170,-25,105],[-220,25,-35]],
  ['01f-games-shelf',[-190,-32,70],[-265,8,10]],
  ['01g-fund-note',[-155,-112,170],[-158,-79,234]],
  ['01h-radio',[-185,-94,70],[-265,-55,10]]
 ]){await view(eye,target);await p.evaluate(()=>House.hush());await shot(name)}
 await catalogueShot('01e-catalogue');
}
try{
 console.log('inventory',await p.evaluate(()=>({starter:localStorage.getItem('jhp_starter'),pm:PM.items().map(x=>x.id),magazines:Object.keys(House.THINGS).filter(id=>id.includes('mag')||id==='mags')})));
 assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_starter')),'1');
 if(process.argv[3]!=='before'){assert.equal(await p.evaluate(()=>Object.keys(House.THINGS).filter(id=>id.startsWith('reading.book.')).length),6);assert.equal(await p.evaluate(()=>Object.keys(House.THINGS).filter(id=>id.startsWith('reading.school.')).length),6);}
 assert.deepEqual(await p.evaluate(()=>['n64','ps','md','dc'].filter(id=>House.SPOTS[id])),[]);
 assert.deepEqual(await p.evaluate(()=>PM.items().map(x=>x.id)),['pm.mag.01','pm.mag.02']);
 await roomArt();
 if(process.argv.includes('--room-only')){assert.deepEqual(errors,[]);console.log('SPARSE ROOM ART PASS')}else{
 const credit=await fetch(base+'/admin/qa-credit?name='+account,{method:'POST',headers:{'x-admin-token':'testtoken'}});assert(credit.ok);
 console.log('order',await p.evaluate(()=>PM.order('hardware.n64')));
 await p.waitForTimeout(1700);console.log('order',await p.evaluate(()=>PM.order('pm.mag.07')));
 await until(()=>!!(House.SPOTS['pm.parcel.hardware.n64']&&House.SPOTS['pm.parcel.pm.mag.07']));
 await catalogueShot('02c-catalogue-delivered','DELIVERED');
 if(!baseline)assert.match(await p.locator('[data-pp="pm.mag.07"]').first().innerText(),/DELIVERED/);
 await parcelAim('hardware.n64');await shot('02-hall-parcels');
 await parcelAim('hardware.n64',[300,258,610]);await shot('02b-parcel-close');await parcelAim('hardware.n64');
 await p.keyboard.press('f');await until(()=>!!House.THINGS.n64);await p.waitForTimeout(1200);
 console.log('unboxed',await p.evaluate(()=>({here:House.here,held:House.held(),n64:House.THINGS.n64.at})));
 await shot('03-console-unboxed');assert.equal(await p.evaluate(()=>House.held()),'n64');
 await p.keyboard.press('q');await catalogueShot('03c-catalogue-unboxed','UNBOXED — IN THE HALL');
 const delivered=await p.evaluate(()=>{const a=House.THINGS.n64.at;return[a.x,a.y-3,a.z]});await aim([300,225,610],delivered,'G');await p.keyboard.press('e');await until(()=>House.held()==='n64');
 async function walk(axis,to,ry,direction){
  await p.evaluate(ry=>{House.hush();House.P.ry=ry;House.P.rx=0;House._.setMode('walk')},ry);await p.keyboard.down('w');
  try{for(let i=0;i<400;i++){if(await p.evaluate(({axis,to,direction})=>{const done=direction>0?House.W[axis]>=to:House.W[axis]<=to;if(done)dispatchEvent(new KeyboardEvent('keyup',{key:'w',bubbles:true}));return done},{axis,to,direction}))break;if(i===399){console.log('walk blocked',await p.evaluate(()=>({P:House.P,W:House.W,here:House.here})));await shot('03-walk-blocked');throw Error('Walk did not reach '+axis+' '+to)}await p.waitForTimeout(100)}}finally{await p.keyboard.up('w')}
  assert.equal(await p.evaluate(()=>House.held()),'n64');
 }
 await walk('z',630,180,1);await walk('x',355,90,1);await walk('z',430,0,-1);await shot('03a-carry-stairs');await walk('z',210,0,-1);
 assert.equal(await p.evaluate(()=>House.W.lvl),'U');await shot('03b-carried-upstairs');
 await p.evaluate(()=>House.setDoor('bedroom',true,true));await walk('x',210,-90,-1);assert.equal(await p.evaluate(()=>House.here),'bedroom');
 const dock=await p.evaluate(()=>House.SNAPS['hardware.dock.n64'].pose);
 await aim([-185,-55,110],[dock.x,dock.y-3,dock.z]);await p.keyboard.press('e');await until(()=>House.THINGS.n64.snap==='hardware.dock.n64');await shot('04-console-connected');await catalogueShot('04b-catalogue-connected','CONNECTED TO YOUR TELLY');
 await parcelAim('pm.mag.07',[300,225,610]);await p.keyboard.press('f');await until(()=>!!House.THINGS['pmb.pm.mag.07']);await p.waitForTimeout(1200);
 console.log('mag',await p.evaluate(()=>({held:House.held(),here:House.here,at:House.THINGS['pmb.pm.mag.07'].at})));
 assert.equal(await p.evaluate(()=>House.held()),'pmb.pm.mag.07');await p.keyboard.press('f');await until(()=>!!Magazines.reading);await p.keyboard.press('f');await p.waitForTimeout(700);await p.keyboard.press('f');await p.waitForTimeout(700);await shot('05-magazine-reading');await p.keyboard.press('q');
 const mh=await p.evaluate(()=>House.THINGS['pmb.pm.mag.07'].home);
 await aim([-110,-55,130],[mh.x,mh.y-12,mh.z]);await p.keyboard.press('e');await until(()=>House.THINGS['pmb.pm.mag.07'].st==='snap');await shot('06-magazine-shelved');await aim([mh.x+20,mh.y-20,mh.z-48],[mh.x,mh.y-12,mh.z]);await shot('06b-magazine-close');
 if(process.argv[3]!=='before')assert(await p.evaluate(()=>House.THINGS['pmb.pm.mag.07'].hz>=1.1/2));
 console.log('game order',await p.evaluate(()=>PM.order('cart.n64.kart')));
 await until(()=>!!House.SPOTS['pm.parcel.cart.n64.kart']);
 await parcelAim('cart.n64.kart');await p.keyboard.press('f');await p.waitForTimeout(1400);console.log('cart parcel',await p.evaluate(()=>({parcels:PM.parcels(),owned:PM.owns('cart.n64.kart'),media:!!House.THINGS['media.n64.kart']})));await until(()=>!!House.THINGS['media.n64.kart']);
 const gameBox=await p.evaluate(()=>House.THINGS['media.box.n64.kart'].at);
 await aim([-220,-55,35],[gameBox.x,gameBox.y-6,-36]);await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),'media.box.n64.kart');
 await aim([-80,-55,220],[-130,73,145]);await p.keyboard.press('e');await until(()=>House.THINGS['media.box.n64.kart'].st==='rest');
 await aim([-80,-55,220],[-130,67,146.6]);await p.keyboard.press('f');await until(()=>House.THINGS['media.box.n64.kart'].caseOpen);
 await aim([-80,-55,220],[-130,69,146.3]);await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),'media.n64.kart');
 await aim([-185,-55,110],[dock.x,dock.y-7,dock.z]);await p.waitForTimeout(300);await p.keyboard.press('e');
 await until(()=>House.THINGS['media.n64.kart'].snap==='console.n64'&&window.RoomTV?._dbg()?.st==='game');await shot('07-console-playing');
 await p.keyboard.press('q');await until(()=>House.mode==='walk');
 console.log('saved screen',await p.evaluate(()=>localStorage.getItem('jhp_console_focus')));
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>House?.live&&PMGL?.built&&House.THINGS.n64&&House.THINGS['pmb.pm.mag.07']&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(await p.evaluate(()=>House.THINGS.n64.snap),'hardware.dock.n64');assert.match(await p.evaluate(()=>House.THINGS['pmb.pm.mag.07'].snap),/^reading.slot/);
 await until(()=>window.RoomTV?._dbg()?.background&&RoomTV._dbg().gid==='n64.kart');
 await catalogueShot('08c-catalogue-shelved','CONNECTED TO YOUR TELLY');
 if(!baseline)assert.match(await p.locator('[data-pp="pm.mag.07"]').first().innerText(),/ON YOUR BOOKSHELF/);
 await aim([-80,-55,180],[-185,40,-25]);await shot('08-refresh');await p.setViewportSize({width:1024,height:768});await shot('08b-refresh-1024');assert.deepEqual(errors,[]);console.log('SPARSE PURCHASE PASS');
}
}finally{await browser.close()}
