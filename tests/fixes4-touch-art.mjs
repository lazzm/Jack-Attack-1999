// Focused touch-context viewport review of changed models; not a hardware/performance claim.
import assert from 'node:assert/strict';
import {devices} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],out='tests/shots/fixes4/';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));await mkdir(out,{recursive:true});
const name='ArtQA'+Date.now().toString(36),pass='Temporary-1999';
for(const[url,body]of[['register',{name,pass}],['fixes4-checkpoint',{name}]])assert((await fetch(base+'/admin/'+url,{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify(body)})).ok);
const f=await roomFixture(base,{account:name,password:pass,signup:false,opening:true,hour:16,touch:true,width:390,height:844,debug:true,contextOptions:{isMobile:true,userAgent:devices['iPhone 13'].userAgent},onPage:p=>p.addInitScript(()=>localStorage.setItem('jhp_touch_slow_asked','true'))}),p=f.page;
const shot=async name=>{await p.screenshot({path:out+name+'.png',timeout:60000});console.log('SHOT',name)};
const aim=async(eye,target,lvl)=>{await f.view(eye,target,{level:lvl});await p.evaluate(()=>{House.hush();HousePause.close();House._.setMode('walk');House.dirty()})};
try{
 await p.touchscreen.tap(388,2);await f.until(()=>!!GameInput.touch&&!!window.HouseFamily?.ready&&!!window.StoryOpening?.built);
 await p.evaluate(async()=>{await Chores.load();await Chores.part('bedroom');HouseFamily.debug.clock({md:1103,dow:3,t:16});HouseFamily.debug.go('sister','sofaR');HouseFamily.debug.sim(200,.2)});
 await aim([40,-85,180],[20,-55,-100],'U');await p.evaluate(()=>House.act('ch.binbag'));await f.until(()=>!!ChoreKit.has('bin','tie'));
 for(const [width,height,ids]of[[390,844,['ch.m.wrap','st.pc.keys']],[844,390,['ch.m.wrap','st.pc.keys']],[768,1024,['ch.binbag']],[1024,768,['ch.m.mug']]]){
  await p.setViewportSize({width,height});await aim([70,195,475],[-9.6,278,587],'G');
  await p.evaluate(()=>{const r=HouseFamily.chars.sister.rig;for(let i=0;i<120;i++)r.update(1/60,true);House.dirty()});await shot('r196-touch-'+width+'x'+height);
  for(const id of ids){
   await aim([40,-85,180],[20,-55,-100],'U');
   assert(await p.evaluate(id=>{if(House.held())House.putBack();const t=House.THINGS[id];t.canGrab=null;t.at.hide=false;House.place(t);return House.grab(id)},id));
   await p.waitForTimeout(500);await shot((id==='ch.m.mug'?'r197':'r195')+'-touch-'+width+'x'+height+'-'+id.replaceAll('.','-'));
   await p.evaluate(()=>House.putBack());
  }
 }
 assert.deepEqual(f.errors,[]);console.log('FIXES4 TOUCH ART PASS: real touch context, four phone/tablet viewports, settled seat and changed carry models');
}finally{await f.browser.close();}
