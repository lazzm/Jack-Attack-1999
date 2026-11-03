// Real console runtime, phone sizing and actual touch input on disposable accounts.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],tag=process.argv[3]||'after',shots=new URL('./shots/fixes3/',import.meta.url).pathname;
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Throwaway localhost only');
await mkdir(shots,{recursive:true});
const account='Pads'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const f=await roomFixture(base,{account,password,signup:false,width:390,height:844,touch:true,contextOptions:{isMobile:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'},onPage:async p=>{
 if(tag==='before')for(const file of ['rm-tv.js','rm-g-fight.js']){
  const body=execFileSync('git',['show','HEAD:app/public/js/'+file],{encoding:'utf8'});
  await p.route('**/js/'+file+'*',r=>r.fulfill({body,contentType:'application/javascript'}));
 }
}});
try{
 const {page,until}=f,cdp=await page.context().newCDPSession(page),rows=[];
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:2,y:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.evaluate(()=>Apps.load('js/rm-tv.js'));
 const games=tag==='before'?['ps.fight']:['ps.fight','n64.kart','gb.blocks','md.zip','dc.taxi','sn.zero'];
 async function audit(name){
  const size=await page.evaluate(()=>({w:innerWidth,h:innerHeight}));
  const buttons=await page.locator('.rm-tvv.on .rm-pad:not([hidden]) button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{key:n.dataset.b,label:n.textContent,name:n.getAttribute('aria-label'),x:r.x,y:r.y,w:r.width,h:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===n}}));
  assert(buttons.length,name+' pad is visible');
  for(const b of buttons){assert(b.w>=44&&b.h>=44,name+' thumb target '+JSON.stringify(b));assert(b.x>=0&&b.y>=0&&b.x+b.w<=size.w&&b.y+b.h<=size.h,name+' clipped '+JSON.stringify(b));assert(b.hit,name+' button is covered '+JSON.stringify(b));}
  if(tag!=='before')assert(!buttons.some(b=>/[✕○□△]/.test(b.label)),'No real face legends');
  rows.push({name,buttons});await page.screenshot({path:shots+tag+'-'+name+'.png'});console.log('PAD',tag,name,buttons.map(b=>b.label).join(' '));
 }
 async function hold(key){
  const r=await page.locator(`.rm-tvv.on .rm-pad [data-b="${key}"]`).boundingBox();assert(r);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});
  assert(await page.evaluate(k=>RoomTV.dbg().held(k),key),'Real touch reaches '+key);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert(!await page.evaluate(k=>RoomTV.dbg().held(k),key),'Release clears '+key);
 }
 for(const gid of games){
  await page.evaluate(g=>RoomTV.test(g),gid);
  await until(()=>RoomTV._dbg()?.st==='game');await page.evaluate(()=>RoomTV.lockIn(true));await page.waitForTimeout(1000);
  if(gid==='ps.fight'){
   await until(()=>!!window.__teknoDbg);await page.evaluate(()=>{__teknoDbg.cheat({go:'title'});__teknoDbg.cheat({go:'how'});});
   await audit('playspace-help-portrait');
   if(tag!=='before'){
    const labels=await page.evaluate(()=>['a','b','x','y'].map(b=>RoomTV.dbg().label(b)));
    assert.deepEqual(labels,['★','@','#','~']);
    const native=await page.evaluate(()=>RoomTV.dbg().hud.canvas.toDataURL('image/png'));
    await writeFile(shots+'after-playspace-help-native.png',Buffer.from(native.split(',')[1],'base64'));
    for(const b of ['a','b','x','y'])await hold(b);
   }
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(1000);await audit('playspace-landscape');
   await page.setViewportSize({width:360,height:740});await page.waitForTimeout(1000);await audit('playspace-small-phone');
   await page.setViewportSize({width:390,height:844});
  }else await audit(gid.split('.')[0]+'-pad-portrait');
  await page.evaluate(()=>RoomTV.close(true));await page.waitForTimeout(200);
 }
 // The line uses this non-owner's identity through the production Cast/voice path.
 if(tag!=='before'){
  await page.setViewportSize({width:390,height:844});
  const z=await page.evaluate(()=>House.FRONT.FZ);
  await f.view([290,210,z-130],[250,220,z+900],{level:'G'});
  await page.evaluate(()=>{window.auditHour=22;const c=document.getElementById('bootPower').classList;c.remove('rm-day','rm-dawn','rm-dusk');c.add('rm-night');HouseEnvironment.update();House.relight();});
  await page.screenshot({path:shots+'after-phone-night.png'});
  const lightCost=await page.evaluate(()=>{
   const ink=HouseEnvironment.nightInk,gl=House.ren.getContext(),runs=[],old=ink.visible;
   try{for(const on of [false,true,true,false]){
    ink.visible=on;const samples=[];
    for(let i=-3;i<12;i++){const t=performance.now();House._.renderForBenchmark();gl.finish();if(i>=0)samples.push(performance.now()-t);}
    samples.sort((a,b)=>a-b);runs.push({on,medianMs:samples[samples.length>>1],draws:House.ren.info.render.calls});
   }}finally{ink.visible=old;House.dirty();}
   return{runs,buffer:[House.ren.domElement.width,House.ren.domElement.height]};
  });
  await writeFile(shots+'after-phone-light-cost.json',JSON.stringify(lightCost,null,2));console.log('LIGHT COST',JSON.stringify(lightCost));
  const line=await page.evaluate(()=>{const say=House.say,tools=window.OwnerTools;let text;House.say=(who,s)=>text=s;try{window.OwnerTools={allowed:true};HouseLife.ownerEvent('bedtime');return{text,name:Cast.me().first}}finally{House.say=say;window.OwnerTools=tools}});
  assert.equal(line.text,`Time for bed, ${line.name}. Save your game.`);
  const loggedOff=await page.evaluate(async()=>{
   const box=Desk.msgbox,send=Net.send,owner=Roam.owner;let confirm,notice='',packets=0;
   localStorage.setItem('jhp_fixes3_sentinel','keep');Net.setOffline(true);
   Desk.msgbox=(title,text,kind,buttons)=>{if(title==='Log Off JackOS')confirm=buttons[0][1];else notice=text;};
   Net.send=m=>{if(m.t==='logoff')packets++;return send(m)};
   try{JackLogon.logoff();await confirm();return{notice,packets,owner,after:Roam.owner,local:localStorage.getItem('jhp_fixes3_sentinel'),member:Net.me.member};}
   finally{Desk.msgbox=box;Net.send=send;}
  });
  assert.equal(loggedOff.packets,0,'Failed save must not send logoff');assert.equal(loggedOff.after,loggedOff.owner);assert.equal(loggedOff.local,'keep');assert(loggedOff.member);assert.match(loggedOff.notice,/could not confirm your save/);

 }
 await writeFile(shots+tag+'-pads.json',JSON.stringify(rows,null,2));assert.deepEqual(f.errors,[]);
 console.log(tag==='before'?'PASS baseline PlaySpace pad: 44px targets and phone rotation':'PASS all console pads, 44px targets, legends, phone rotation, real touch press/release, player-name bedtime, disconnected JackOS logoff retains profile');
}finally{await f.browser.close()}
