'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), Module = require('node:module');
const C = require('../app/public/js/st-cat.js');
let story = require('../app/mods/story.js');
// Optional before-source runs the same assertions against the pre-fix module.
if (process.env.STORY_SOURCE) {
  const mod = new Module(require.resolve('../app/mods/story.js'));
  mod.filename = require.resolve('../app/mods/story.js'); mod.paths = module.paths;
  mod._compile(fs.readFileSync(process.env.STORY_SOURCE, 'utf8'), mod.filename); story = mod.exports;
}
let now = 2000000; const realNow=Date.now; Date.now=()=>now;
class Bucket { take(){return true;} }
const permutations = [['bed','tidy','bin'],['bed','bin','tidy'],['bin','bed','tidy'],['bin','tidy','bed'],['tidy','bed','bin'],['tidy','bin','bed']];
try {
  for (const order of permutations) {
    const events={}, ws={}, c={member:'Fresh'}, messages=[];
    const state={members:{fresh:{starterSparse:1,storyOpening:2}},mods:{story:{},ch:{p:{fresh:{n:{},done:{},run:{}}}},pmx:{p:{}},econ:{acct:{fresh:{bal:0,wallet:{pence:0},caps:{job:7}}}},sms:{contacts:{}}}};
    const initialEconomy=JSON.stringify(state.mods.econ);
    const ctx={state,data:state.mods.story,clients:new Map([[ws,c]]),Bucket,on(e,fn){events[e]=fn},send(w,m){messages.push(m)},markDirty(){}};
    story.init(ctx);events.login(c);
    const p=state.mods.story.p.fresh,ch=state.mods.ch.p.fresh;
    if(order===permutations[0]){events['story-phone'](c);assert(p.flags.mate&&!p.done.mate,'Early phone evidence was lost or skipped its chapter');}
    const send=id=>{now+=1000;story.handle(ws,c,{t:'stEvent',id});};
    // Partial tidy evidence must not count, even when bed and bin finish first.
    ch.run.tidy={got:{socks:now}};send('sync');assert(!p.done.tidy);
    for (const id of order) {
      now+=10000;
      // Last of the six permutations exercises the legacy zero-pay completion.
      ch.done[id]={sc:order===permutations.at(-1)?0:100,bad:order===permutations.at(-1)?1:0,t:now};
      if(!ch.done[id].bad)ch.n[id]=1;
      events.hello(ws,c);
      assert(p.done[id], `${order.join(' -> ')}: finished ${id} lost behind ${C.current(p)?.id}`);
      assert.equal(C.current(p).id,'lad','An early chore skipped the unfinished Game Lad');
      const snapshot=JSON.stringify(p);story.init(ctx);events.login(c);assert.equal(JSON.stringify(p),snapshot,'Refresh changed earned ticks');
    }
    send('lad');assert.equal(C.current(p).id,'dad');assert.equal(p.trust,3);
    send('power');send('part.monitor');assert(!p.flags.power&&!p.flags['part.monitor'],'Missing prerequisites accepted');
    send('dad');send('boot');
    for (const id of ['part.speakers','part.keys','part.monitor','part.tower']) {send(id);assert(p.done[id],`Independent ${id} was rejected`)}
    for (const id of ['lead.keyboard','lead.video','lead.power']) {send(id);assert(p.done[id],`Independent ${id} was rejected`)}
    send('install');assert(!p.done.install);send('pc');assert(!p.done.pc);
    for(const id of ['power','install','pc'])send(id);
    assert.equal(p.ch,2);assert.equal(C.current(p).id,'save');
    // Buying consumes money, so the server order itself also proves the save goal.
    state.mods.pmx.p.fresh={o:[{id:'hardware.md',no:'PP1'}]};send('sync');assert(p.done.save&&p.done.order);
    for(const id of ['play','connect','unbox','carry']){send(id);assert(p.done[id])}
    events['story-phone'](c);assert(p.done.mate);assert.equal(C.current(p),null);
    assert.equal(JSON.stringify(state.mods.econ),initialEconomy,'Story changed balances or earning caps');
    assert.equal(p.trust,3,'Refresh paid trust twice');
  }
  // Re-evaluate existing records at login; historical flags survive a daily reset.
  const events={}, state={members:{stuck:{starterSparse:1,storyOpening:2}},mods:{story:{p:{stuck:{ch:1,done:{lad:1,tidy:2},flags:{},trust:1,v:2}}},ch:{p:{stuck:{finished:{bed:1,bin:1},n:{},done:{}}}}}};
  story.init({state,data:state.mods.story,clients:new Map(),Bucket,on(e,fn){events[e]=fn},markDirty(){},send(){}});
  events.login({member:'Stuck'});assert.equal(C.current(state.mods.story.p.stuck).id,'dad');
  // Owner jumps may clear diary ticks while the physical room still contains
  // finished chores. Re-adopt that evidence; an actual fresh room stays fresh.
  state.members.jack={starterSparse:1,storyOpening:2};
  state.mods.story.p.jack={ch:1,done:{lad:1,tidy:2},flags:{},trust:0,v:2};
  state.mods.ch.p.jack={done:{bed:{bad:1,sc:0}},finished:{bin:1}};
  events.login({member:'Jack'});assert.equal(C.current(state.mods.story.p.jack).id,'dad');
  state.mods.story.p.jack={ch:1,done:{},flags:{},trust:0,v:2};delete state.mods.ch.p.jack;
  events.login({member:'Jack'});assert.equal(C.current(state.mods.story.p.jack).id,'lad');assert.deepEqual(state.mods.story.p.jack.done,{});
  // Guidance lifecycle uses real three.js geometry, without a GPU: a late room,
  // consumed pyjamas, held destinations, quest switching and hidden screens.
  const vm=require('node:vm'), T=require('../app/public/vendor/three.min.js');
  let selected={id:'dad',key:'story',targets:['st.boot']}, held=null, frame, change;
  const elements=[];
  const el=()=>({hidden:true,style:{setProperty(){}},dataset:{},append(){},setAttribute(){}});
  const house={ok:true,live:true,mode:'walk',T,scene:new T.Scene(),camera:new T.PerspectiveCamera(60,1366/860,1,3000),THINGS:{},SPOTS:{},SNAPS:{},ROOMS:{},DOORS:{},ui:{el:{clientWidth:1366,clientHeight:860,appendChild(e){elements.push(e)}}},held:()=>held,surfaceScreen:()=>null,on(){},dirty(){}};
  house.camera.position.set(0,100,200);house.camera.lookAt(0,0,0);house.camera.updateMatrixWorld(true);
  const steps={}, kit={has:(id,s)=>!!steps[id+'.'+s],done:()=>false,MODS:{bed:{guide:()=>house.THINGS.duvet.obj}},tool:{},stepsOf:()=>[]};
  const guide={House:house,st:{tracked:()=>selected,getState:()=>({ch:1,flags:{}}),onChange(fn){change=fn}},Net:{connected:true},StoryAccess:{available:false},AccountGate:{allowed:true},ChoreKit:kit,localStorage:{getItem(){return null},setItem(){}},document:{hidden:false,createElement:el,querySelector(){return null}},performance:{now:()=>1000},Date,innerWidth:1366,innerHeight:860,matchMedia:()=>({matches:true}),requestAnimationFrame(fn){frame=fn}};
  guide.window=guide;
  vm.runInNewContext(fs.readFileSync(require.resolve('../app/public/js/st-guide.js'),'utf8'),guide);
  frame(1000); // Dad's room/boot has not been built yet: keep waiting safely.
  assert.equal(elements[0].hidden,true);
  for(const [id,x] of [['ch.pillow',-40],['ch.pjs',40],['duvet',80]]){
    const obj=new T.Mesh(new T.BoxGeometry(20,10,20),new T.MeshPhongMaterial({color:0x556688}));obj.position.set(x,0,-50);house.scene.add(obj);house.THINGS[id]={id,obj,at:{hide:false},kind:'pjs',label:id};
  }
  selected={id:'bed',key:'chore.bed',test:'chore.bed'};house.SPOTS.bed={obj:house.THINGS.duvet.obj};change();frame(1300);
  const rims=()=>{const out=[];house.scene.traverse(o=>{if(o.userData.questRim)out.push(o)});return out};
  assert.equal(rims().length,2);assert(rims().every(o=>!o.material.wireframe));
  steps['bed.pjs']=1;house.THINGS['ch.pjs'].at.hide=true;frame(1600);
  assert(!guide.StoryGuide.targets().includes('ch.pjs'));assert(!rims().some(o=>o.userData.questRim==='ch.pjs'));
  held='ch.pillow';house.SNAPS['ch.s.pillow']={x:80,y:0,z:-50,hint:'Let go: on the bed',accepts:()=>true};house.THINGS[held].chore='bed';frame(1900);
  assert.deepEqual(Array.from(guide.StoryGuide.targets()),['ch.s.pillow']);
  guide.innerWidth=390;guide.document.querySelector=s=>s==='.ch-chip:not([hidden])'?{}:null;frame(2000);
  assert(elements[0].hidden&&elements[1].hidden,'Compact compass covers the native job progress strip');
  guide.innerWidth=1366;guide.document.querySelector=()=>null;
  selected={id:'part.tower',key:'story'};held='st.pc.speakers';
  assert.deepEqual(Array.from(guide.StoryGuide.targets()),['st.desk.speakers'],'Early component points at the wrong pickup instead of its desk spot');
  house.mode='monitor';frame(2200);assert(elements.every(e=>e.hidden));assert(rims().every(o=>!o.visible));
  house.mode='walk';guide.StoryGuide.chapter(2,'Saving up');frame(2300);
  assert(elements[0].hidden&&elements[1].hidden&&!elements[2].hidden,'Compass ink covers the chapter title');
  guide.StoryGuide.setting('off');assert(elements.every(e=>e.hidden));
  // Exercise the real chore slot helper against the two legacy rack callers.
  const core=fs.readFileSync(require.resolve('../app/public/js/ch-core.js'),'utf8');
  const snapStart=core.indexOf('  function snap(id, def) {'),snapEnd=core.indexOf('  // a spot of the house',snapStart);
  assert(snapStart>=0&&snapEnd>snapStart);
  const slotHouse={SNAPS:{}}, slots={H:slotHouse,R:{addSnap(id,def){return slotHouse.SNAPS[id]=Object.assign({id},def)}}};
  vm.runInNewContext(core.slice(snapStart,snapEnd)+';this.add=snap;',slots);
  const cd=slots.add('ch.s.rack',{room:'bedroom',accepts:k=>k==='mess.cd'});
  const draining=slots.add('ch.s.rack',{room:'kitchen',accepts:k=>k==='wdish'});
  assert.equal(slotHouse.SNAPS['ch.s.rack.bedroom'],cd);assert(cd.accepts('mess.cd'));assert(draining.accepts('wdish'));
  assert.equal(cd.id,'ch.s.rack','Legacy CD slot save ID changed');
  slots.add('ch.s.rack',{room:'bedroom',accepts:k=>k==='mess.cd'});
  draining.pose={x:30};assert.equal(slotHouse.SNAPS['ch.s.rack.kitchen'].pose.x,30,'Alias lost the dynamic rack pose');
  // A lost final Setup acknowledgement must retry after its button disappears.
  let openingState=null;const openingTicks=[],observations=[];
  const opening={House:{ok:true,T:{},K:{mat(){}},SPOTS:{},mode:'monitor'},Room:{},st:{getState:()=>openingState,onChange(){},event:id=>observations.push(id)},Setup:{recover(done){done()}},setInterval(fn){openingTicks.push(fn)},setTimeout(){},document:{querySelector(){return null}}};
  opening.window=opening;
  vm.runInNewContext(fs.readFileSync(require.resolve('../app/public/js/st-opening.js'),'utf8'),opening);
  openingState={ch:1,flags:{},done:{power:1}};
  let setupClosed=false;opening.StoryOpening.install(()=>{setupClosed=true});assert(setupClosed);assert.deepEqual(observations,['install']);
  openingTicks[0]();assert.deepEqual(observations,['install','install'],'Consumed Setup completion was never retried');
  openingState.done.install=1;openingTicks[0]();assert.equal(observations.length,2,'Acknowledged Setup kept sending');
  console.log('STORY ORDER UNIT PASS: six chore orders, partial tidy, zero-pay migration, refresh, reversed PC parts/leads, consumed console purchase, no economic changes');
} finally {Date.now=realNow}
