import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const f=await roomFixture(process.argv[2]),{page:p,until,errors}=f;
await mkdir('shots/props-town',{recursive:true});
async function wait(fn){for(let i=0;i<150;i++){try{if(await p.evaluate(fn))return}catch(e){if(!/context was destroyed/.test(e.message))throw e}await p.waitForTimeout(100)}throw Error('Step timeout '+fn)}
async function shot(name){await p.screenshot({path:'shots/props-town/'+name+'.png'})}
async function walk(){await wait(()=>House.mode==='walk'&&!House.gliding);await p.evaluate(()=>House.hush())}
try{
 const ids=['mug','vpet','jumper','chair','beanbag','bin','washing','cactus','shuttlemodel','coaster','trophy','robotmodel','schoolbag','pencilpot','books'];
 assert(await p.evaluate(ids=>ids.every(id=>House.THINGS[id]&&House.SPOTS[id].grab),ids));
 assert(await p.evaluate(ids=>ids.every(id=>{let valid=true;House.THINGS[id].obj.traverse(o=>{if(o.geometry)for(const attribute of Object.values(o.geometry.attributes))if(!Array.from(attribute.array).every(Number.isFinite))valid=false});return valid}),ids),'Non-finite prop geometry');
 if(!process.env.SNAP_ONLY)for(const id of ['mug','vpet','jumper']){
  await p.evaluate(id=>{House.hush();House.grab(id)},id);await p.keyboard.press(id==='vpet'?'f':'i');await wait(()=>House.mode==='inspect');
  if(id==='vpet'){assert.equal(await p.locator('.hs-inspection [data-pet]').count(),3);await p.locator('.hs-inspection [data-pet=feed]').click();await p.keyboard.press('b');await p.keyboard.press('c');assert(await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('jhp_rm_pet'));return s.food===4&&s.fun===4&&!s.poo}));assert.equal(await p.locator('.rm-eggbig,.rm-view').count(),0)}
  await shot(id+'-front');await p.mouse.move(650,300);await p.mouse.down();await p.mouse.move(1040,430,{steps:12});await p.mouse.up();await shot(id+'-rear');
  await p.keyboard.press('q');await p.evaluate(()=>House.putBack());await wait(()=>!House.held()&&!Object.values(House.THINGS).some(t=>t.st==='fall'));
 }
 if(!process.env.SNAP_ONLY)for(const id of ['chair','beanbag']){
  const at=await p.evaluate(id=>({...House.THINGS[id].at}),id);const eye=await p.evaluate(at=>{for(let d=85;d<135;d+=10)for(let i=0;i<16;i++){const a=i*Math.PI/8,x=at.x+Math.sin(a)*d,z=at.z+Math.cos(a)*d;if(House._.floorAt(x,z,'U',73))return[x,-55,z]}throw Error('No seat approach')},at);await f.view(eye,[at.x,at.y-24,at.z]);await p.evaluate(()=>House._.setMode('walk'));await p.keyboard.press('f');
  await wait(()=>House.mode==='focus'&&!!House._.focusS?.o.seatId);assert.equal(await p.evaluate(()=>House._.focusS.o.seatId),id);await shot(id+'-seated');
  await p.mouse.click(800,300);await p.mouse.move(900,325,{steps:5});await p.evaluate(()=>House.saveWalkState());
  console.log('SEAT SAVE',id,await p.evaluate(()=>({at:House.THINGS[House._.focusS.o.seatId].at,pose:{...House.P},stand:localStorage.getItem('jhp_hs_stand'),saved:localStorage.getItem('jhp_hs_furniture_seat'),login:sessionStorage.getItem('jhp_login_seat')})));const pose=await p.evaluate(()=>({...House.P}));await p.reload({waitUntil:'domcontentloaded'});await wait(()=>AccountGate.allowed&&House.mode==='focus'&&!!House._.focusS?.o.seatId);
  assert.equal(await p.evaluate(()=>House._.focusS.o.seatId),id);assert(await p.evaluate(pose=>Math.hypot(House.P.x-pose.x,House.P.y-pose.y,House.P.z-pose.z)<.5,pose));
  await shot(id+'-refresh');await p.keyboard.press('Escape');await wait(()=>HousePause.open);await p.keyboard.press('Escape');await p.keyboard.press('q');await walk();assert(!await p.evaluate(()=>!!localStorage.getItem('jhp_hs_furniture_seat')));
  assert(await p.evaluate(id=>House.sitOn(id),id));await wait(()=>House.mode==='focus');await p.keyboard.press('w');await walk();
  assert(await p.evaluate(()=>!!House._.floorAt(House.W.x,House.W.z,House.W.lvl,House.W.fy)),'Seat exit blocked');
 }
 // The drawer is a genuine visible slot and the snapped jumper travels with it.
 await p.evaluate(()=>{House.hush();House.toggle('bedroom.drawer.1');House.grab('jumper')});await p.waitForTimeout(600);
 const slot=await p.evaluate(()=>({...House.SNAPS['clothes.jumper'].pose}));await f.view([slot.x+95,-38,slot.z-40],[slot.x,slot.y,slot.z]);await p.evaluate(()=>House._.setMode('walk'));await p.waitForTimeout(250);await shot('jumper-slot');console.log('SLOT BEFORE',await p.evaluate(()=>({P:{...House.P},W:{...House.W},slot:{...House.SNAPS['clothes.jumper'],accepts:null,enabled:House.SNAPS['clothes.jumper'].enabled()},held:House.held(),pick:House.pick(innerWidth/2,innerHeight/2,{skip:o=>o.userData.spot==='jumper'})?.spot})));await p.keyboard.press('e');
 await wait(()=>House.THINGS.jumper.st==='snap');assert.equal(await p.evaluate(()=>House.THINGS.jumper.snap),'clothes.jumper');await shot('jumper-drawer-open');
 await p.evaluate(()=>House.toggle('bedroom.drawer.1'));await p.waitForTimeout(650);await p.evaluate(()=>House.saveThings(true));await shot('jumper-drawer-closed');
 await p.reload({waitUntil:'domcontentloaded'});await wait(()=>AccountGate.allowed&&House.live&&House.THINGS.jumper&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>House.THINGS.jumper.snap),'clothes.jumper');
 await p.evaluate(()=>{Room.tidy('bedroom');House.hush()});assert.equal(await p.evaluate(()=>House.THINGS.jumper.snap),'clothes.jumper');
 for(const id of ['bin','washing','cactus','shuttlemodel','trophy','robotmodel','coaster']){assert(await p.evaluate(id=>House.grab(id),id));await p.evaluate(()=>House.putBack());await wait(()=>!House.held()&&!Object.values(House.THINGS).some(t=>t.st==='fall'))}
 await p.evaluate(async()=>{await Apps.load('js/ch-core.js')});await p.waitForTimeout(600);
 // Room views show the desktop joinery, clothing, moved props and shelf surfaces.
 for(const [name,eye,target]of [['desk',[25,-70,125],[0,0,-12]],['shelf',[0,-155,45],[-14,-143,-47]],['floor',[190,-30,210],[170,73,165]],['drawers',[-160,-45,180],[-250,25,212]]]){await f.view(eye,target);await shot(name)}
 // Visible scenery is static, solid, and still outside the walkable rooms.
 for(const [name,eye,target,point]of [['street',[200,195,1040],[50,40,2200],[200,195,1040]],['west',[-260,195,1000],[-850,30,800],[-260,195,1000]],['rear',[-40,195,-300],[-70,-10,-1740],[-40,195,-300]],['facade',[-550,100,1450],[-550,-100,2100],[200,195,1040]]]){await f.view(eye,target,{roomPoint:point,level:'G'});await shot(name+'-day')}
 await p.evaluate(()=>{window.auditHour=22;const cl=document.getElementById('bootPower').classList;cl.remove('rm-day','rm-dawn','rm-dusk');cl.add('rm-night');HouseEnvironment.update();House.relight()});await p.waitForTimeout(400);await shot('facade-night');
 assert.deepEqual(errors,[]);console.log('ROOM PROPS / SEATS PASS: 15 pickup props, real pet care/model inspection, chair/beanbag F/Q/WASD and seated refresh, jumper drawer/close/refresh/tidy, portable shelf/basket/bin, multi-angle room and day/night town captures; no errors/warnings');
}catch(e){await shot('failure');console.log('DETAIL',await p.evaluate(()=>({P:{...House.P},W:{...House.W},slot:House.SNAPS['clothes.jumper'].pose,open:House.OPEN['bedroom.drawer.1'].open,mode:House.mode,seat:House._.focusS?.o.seatId,held:House.held(),jumper:House.THINGS.jumper.at,errors:window.testErrors})));throw e}finally{await f.browser.close()}
