// Focused visual fixtures on disposable checkpoint data; no house layout edits.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],tag=process.argv[3]||'after',out='tests/shots/fixes4/';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));await mkdir(out,{recursive:true});
const name='ArtQA'+Date.now().toString(36),pass='Temporary-1999';
for(const[url,body]of[['register',{name,pass}],['fixes4-checkpoint',{name}]])assert((await fetch(base+'/admin/'+url,{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify(body)})).ok);
const f=await roomFixture(base,{account:name,password:pass,signup:false,opening:true,hour:16,debug:true}),p=f.page,report={};
const shot=async (name,label=tag)=>{await p.screenshot({path:out+name+'-'+label+'.png',timeout:60000});console.log('SHOT',name)};
const aim=async(eye,target,level='G')=>{await f.view(eye,target,{level});};
try{
 await f.until(()=>!!window.HouseFamily?.ready&&!!window.StoryOpening?.built);
 await p.evaluate(async()=>{await Chores.load();await Chores.part('bedroom');HouseFamily.debug.clock({md:1103,dow:3,t:16});HouseFamily.debug.go('sister','sofaR');HouseFamily.debug.sim(200,.2);HouseFamily.debug.speech.q.length=0;HouseFamily.debug.speech.cur=null;});
 await f.until(()=>!!HouseFamily.chars.sister.seated&&HouseFamily.chars.sister.cur?.k==='act');
 // focus views intentionally pause family drawing. Settle the production rig
 // explicitly; otherwise a logically seated character can still show old walk bones.
 const settle=()=>p.evaluate(()=>{const r=HouseFamily.chars.sister.rig;for(let i=0;i<120;i++)r.update(1/60,true);House.dirty()});
 if(tag==='after')assert(await p.evaluate(()=>HouseFamily.chars.sister.seated===HouseFamily.debug.spots.sofaR.childSeat),'Routine failed to choose the child seat');
 for(const variant of tag==='after'?['before','after']:[tag]){
  // Matched original adult anchor/foot target versus the shipped child pose.
  await p.evaluate(variant=>{const c=HouseFamily.chars.sister,s=HouseFamily.debug.spots.sofaR,q=variant==='before'?s.seat:s.childSeat;Object.assign(c,{x:q.x,z:q.z,h:q.face*Math.PI/180,seated:q});c.rig.root(c.x,353,c.z,c.h,0);c.rig.set({seat:{h:q.h,back:q.back,knee:q.knee,table:q.table,footH:q.footH}});c.rig.st.sitK=1;},variant);
  for(const[view,eye]of[['front',[70,210,475]],['side',[140,240,535]]]){
   await aim(eye,[-9.6,278,587]);await settle();await shot('r196-'+view+'-idle',variant);
   await p.evaluate(()=>{const c=HouseFamily.chars.sister;c.said={};HouseFamily.talk('sister')});
   await f.until(()=>HouseFamily.debug.speech.cur?.c?.id==='sister');
   await p.evaluate(()=>{const S=HouseFamily.debug.speech;S.freeze=true;S.cur.c.rig.talk(60000,S.cur.text,null)});await settle();await shot('r196-'+view+'-talk',variant);
   const pose=await p.evaluate(()=>{const c=HouseFamily.chars.sister,r=c.rig;return{seated:!!c.seated,anchor:[c.x,c.z],seat:r.st.seat,bones:Object.fromEntries(['hips','thighL','shinL','footL','thighR','shinR','footR'].map(k=>[k,r.bones[k].getWorldPosition(new House.T.Vector3()).toArray()]))}});
   report[variant+'-'+view]=pose;
   if(variant==='after')for(const k of ['shinL','shinR','footL','footR'])assert(pose.bones[k][2]<568,k+' is buried in cushion');
   await p.evaluate(()=>{const S=HouseFamily.debug.speech;S.freeze=false;S.q.length=0;S.bub?.close();S.voice?.stop();S.bub=S.voice=null;S.cur=null;const c=HouseFamily.chars.sister;c.hold=0;c.talking=false;c.rig.hush()});
  }
 }
 await aim([40,-85,180],[20,30,245],'U');
 await p.evaluate(()=>{House.act('ch.binbag')});await f.until(()=>!!ChoreKit.has('bin','tie'));await p.waitForTimeout(1000);
 for(const id of ['ch.m.mug','ch.m.wrap','ch.binbag','st.pc.keys','ch.m.socks','media.box.gb.blocks']){
  await aim([40,-85,180],[20,30,245],'U');
  const ok=await p.evaluate(id=>{if(House.held())House.putBack();House._.setMode('walk');HousePause.close();const t=House.THINGS[id];t.canGrab=null;t.at.hide=false;House.place(t);return House.grab(id)},id);assert(ok,'Cannot carry '+id);await p.waitForTimeout(500);
  await shot((id==='ch.m.mug'?'r197':'r195')+'-'+id.replaceAll('.','-'));
  report[id]=await p.evaluate(id=>{const t=House.THINGS[id],g=House.root.children.find(g=>g.userData.sides);return{grips:t.handGrips||t.obj.userData.handGrips||null,hands:g?.userData.sides.filter(s=>s.palm.visible).length}},id);
  if(tag==='after'&&['ch.m.wrap','ch.binbag'].includes(id))assert.equal(report[id].hands,1,id+' must use one hand');
  if(tag==='after'&&id==='st.pc.keys')assert.equal(report[id].grips?.length,2,'Keyboard needs two side grips');
 }
 await p.evaluate(()=>House.putBack());
 // Mug at floor height: inspect lip/inner wall from above and from the side.
 await p.evaluate(()=>{const t=House.THINGS['ch.m.mug'];t.st='rest';t.at={room:'bedroom',x:40,y:73,z:170,ry:0,hide:false};House.place(t);});
 for(const[v,eye]of[['rim',[55,43,145]],['side',[65,60,166]]]){await aim(eye,[40,67,170],'U');await shot('r197-mug-'+v);}
 assert.deepEqual(f.errors,[]);console.log('FIXES4 ART PASS',JSON.stringify(report));
}finally{await writeFile(out+'art-'+tag+'.json',JSON.stringify({report,errors:f.errors},null,2));await f.browser.close();}
