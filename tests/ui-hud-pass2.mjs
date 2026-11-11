// Native pass-two evidence. Fixtures prepare accounts/poses; trusted browser inputs exercise each UI.
// Run from any folder: node /path/to/tests/ui-hud-pass2.mjs [--before] [--only=guide,desktop,paper,glass,cupgames,notice]
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
import {playCase} from './case-actions.mjs';
const before=process.argv.includes('--before'),phase=before?'before':'after',only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
const out=new URL('./shots/ui-hud-pass2/'+phase+'/',import.meta.url);await mkdir(out,{recursive:true});
const requested=process.argv.find(a=>a.startsWith('--sizes='))?.slice(8).split(',');
const sizes=[[390,844],[844,390],[740,360],[768,1024],[1366,860]].filter(s=>!requested||requested.includes(s.join('x'))),evidence=[],findings=[];
const check=(ok,why)=>{if(!ok){findings.push(why);if(!before)throw Error(why)}};
const run=async(name,fn)=>{if(!only||only.includes(name)){console.log('SECTION',phase,name);await fn()}};
const assets=['js/st-guide.js','css/st.css','js/apps.js','style.css','css/apps.css','js/magazines.js','js/hs-world.js','css/hs-captions.css','js/rm-room.js','js/rm-tv.js','js/rm-g-zeldo.js','js/st-engine.js','css/rm-g-zeldo.css','css/rm-g-plumb.css'];
if(only){try{const old=JSON.parse(await readFile(new URL('evidence.json',out),'utf8'));const section=e=>e.state.startsWith('guide')?'guide':e.state.startsWith('desktop')?'desktop':e.state.startsWith('paper')?'paper':e.state.startsWith('cup-')?'cupgames':e.state.startsWith('notice')?'notice':'glass';evidence.push(...old.evidence.filter(e=>!only.includes(section(e))));}catch{}}
await withTestServer(async base=>{
 const name='PassTwo',password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name,pass:password})})).ok);
 const f=await roomFixture(base,{account:name,password,signup:false,resume:true,opening:true,hour:12,seed:1999,touch:true,width:390,height:844,contextOptions:{isMobile:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'},storageState:await bonfireLogin(base,password,name,{pv:12,x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0}),onPage:async p=>{await p.addInitScript(()=>localStorage.setItem('jhp_touch_slow_asked','true'));if(before)for(const file of assets)await p.route('**/'+file+'*',r=>r.fulfill({contentType:file.endsWith('.js')?'application/javascript':'text/css',body:execFileSync('git',['show','HEAD:app/public/'+file],{cwd:new URL('../',import.meta.url),encoding:'utf8'})}));}});
 const {page:p}=f;p.setDefaultTimeout(20000);const until=async(fn,arg)=>{const end=Date.now()+60000;while(Date.now()<end){if(f.errors.length)throw Error(f.errors.join('; '));if(await p.evaluate(fn,arg))return;await p.waitForTimeout(150)}throw Error('State timeout '+fn+' '+JSON.stringify(await p.evaluate(()=>({mode:House.mode,held:House.held(),reading:window.Magazines?.reading,paused:House.paused,focus:House.focused,gliding:House.gliding}))))};const cdp=await p.context().newCDPSession(p);let size=sizes[0];
 async function touch(points,type='touchStart'){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y}))})}
 async function finger(){await touch([[9,size[0]/2,2]]);await touch([],'touchCancel')}
 async function resize(s){size=s;await p.setViewportSize({width:s[0],height:s[1]});await finger();await p.waitForTimeout(650)}
 async function key(k){if(k==='f'){await p.keyboard.press('f');return;}const b=p.locator('.ht-hud [data-k="'+k+'"]');if(await b.isVisible())await b.tap();else await p.keyboard.press(({stand:'F2',lock:'t',menu:'Escape'}[k])||k)}
 async function stage(eye,target,level='U'){await f.view(eye,target,{level});await p.evaluate(target=>{HousePause.close();House.hush();House._.setMode('walk');House.W.eyeNow=House.W.eye;const P=House.P;P.y=House.W.fy-House.W.eye;P.rx=Math.atan2(-(target[1]-P.y),Math.hypot(target[0]-P.x,target[2]-P.z))*180/Math.PI;P.ry=Math.atan2(target[0]-P.x,-(target[2]-P.z))*180/Math.PI;House.dirty()},target);await finger();await p.waitForTimeout(550)}
 async function shot(state,details={}){const path=fileURLToPath(new URL(size.join('x')+'-'+state+'.png',out));await p.screenshot({path,scale:'css'});evidence.push({size,state,path,...details});console.log('CAPTURE',size.join('x'),state);return path}
 async function projection(kind){return p.evaluate(kind=>{if(kind==='bedroom'){const r=Room._.screenRect('n64');return{x:r.left,y:r.top,w:r.width,h:r.height}}const H=House,root=kind==='paper'?H.THINGS[Magazines.reading.id].obj:kind==='cupboard'?H.ROOMS.cupboard.cupScreen:null,pts=[];root.updateWorldMatrix(true,true);root.traverse(o=>{if(!o.isMesh||!o.geometry?.attributes.position)return;for(let a=o;a&&a!==root.parent;a=a.parent)if(!a.visible)return;const g=o.geometry.attributes.position;for(let i=0;i<g.count;i++){const v=new H.T.Vector3().fromBufferAttribute(g,i).applyMatrix4(o.matrixWorld).project(H.camera);pts.push([(v.x+1)*innerWidth/2,(1-v.y)*innerHeight/2])}});const x=Math.min(...pts.map(p=>p[0])),y=Math.min(...pts.map(p=>p[1]));return{x,y,w:Math.max(...pts.map(p=>p[0]))-x,h:Math.max(...pts.map(p=>p[1]))-y,rotation:root.rotation.toArray(),position:root.position.toArray()}},kind)}
 try{
 await run('guide',async()=>{
  await p.evaluate(async()=>{await Chores.part('kitchen');House.buildRoom(House.ROOMS.kitchen);await Chores.part('bedroom');ChoreKit.S.prog.cat=ChoreKit.S.prog.cat||{};st.track('chore.cat');House.hush()});
  for(const s of sizes){await resize(s);await stage([100,210,240],[-100,265,-145],'G');
   await touch([[8,size[0]*.7,size[1]*.42]]);await touch([[8,size[0]*.7-12,size[1]*.42+5]],'touchMove');await touch([],'touchEnd');await p.waitForTimeout(450);
   async function guidance(state){const guide=await p.evaluate(()=>{const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width&&r.height&&s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>0};const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent}};return{marker:[...document.querySelectorAll('.st-arrow,.st-marker-label')].filter(visible).map(rect),ink:[...document.querySelectorAll('.st-objective,.se-objective,.hs-top,.hs-map,.hs-tin,.rm-found,.rm-hunt,.hs-hold:not([hidden]),.ch-chip:not([hidden]),.ht-top .ht-b,.ht-acts .ht-b,.ht-target.on,.ht-stick,.ht-coach-card,.hs-note.on,.np-bub:not(.np-out)')].filter(visible).map(rect)}});
    await shot(state,guide);check(guide.marker.length===2,'Guidance must be visible '+s);for(const r of guide.marker){check(r.x>=0&&r.y>=0&&r.x+r.w<=s[0]+1&&r.y+r.h<=s[1]+1,'Guide outside '+s);check(!guide.ink.some(o=>Math.min(o.x+o.w,r.x+r.w)>Math.max(o.x,r.x)&&Math.min(o.y+o.h,r.y+r.h)>Math.max(o.y,r.y)),'Guide overlaps HUD '+s+' '+r.text)}
   }
   await guidance('guide-look');
   if(!before){
    await p.evaluate(()=>{const bowl=House.SPOTS['ch.bowl'];window.passTwoBowlLabel=bowl.label;bowl.label='Intergalactic Battles: An Old Hope — the complete game box';ChoreKit.S.prog.bed=ChoreKit.S.prog.bed||{};if(!st.track('chore.bed'))throw Error('No alternate tracked task')});await p.waitForTimeout(250);await p.evaluate(()=>st.track('chore.cat'));await p.waitForTimeout(300);
    // Stage the mug in arm's reach without changing another account's data.
    await stage([100,210,240],[-100,265,-145],'G');await p.evaluate(()=>{const t=House.THINGS.mug;t.at={...t.at,room:'kitchen',x:100,y:285,z:170,hide:false};House.ROOMS.kitchen.things.add(t.obj);House.place(t)});
    await stage([100,210,240],[100,285,170],'G');await p.keyboard.press('e');await until(()=>House.held()==='mug');
    await stage([100,210,240],[-100,265,-145],'G');await guidance('guide-long-carry');
    await p.evaluate(()=>Room.toast('Something found!','Intergalactic Battles: An Old Hope — game box'));await p.waitForTimeout(250);await guidance('guide-discovery');
    await p.keyboard.press('q');await until(()=>!House.held());
    await until(()=>HouseFamily?.ready);
    await p.evaluate(()=>{const F=HouseFamily,sp=F.debug.speech;House.hush();sp.q.length=0;sp.cur=null;sp.voice?.stop?.();sp.voice=null;sp.freeze=false;NPCBubble.clear();F.debug.spots.passTwoTalk={lvl:'G',x:270,z:600,face:180};F.debug.go('mom','passTwoTalk');F.debug.place('mom','passTwoTalk');const c=F.chars.mom;c.hold=0;c.plan=[];c.cur={k:'act',t:0};c.goal={key:'debug.passTwoTalk',spot:F.debug.spots.passTwoTalk,spotKey:'passTwoTalk'};c.yieldAt=Infinity});
    await stage([270,210,500],[270,210,600],'G');await p.keyboard.press('f');await until(()=>!!document.querySelector('.np-bub:not(.np-out)'));await p.waitForTimeout(300);await guidance('guide-conversation');await p.keyboard.press('Escape');if(await p.evaluate(()=>HousePause.open)){await p.locator('[data-pause=resume]').tap();await until(()=>!HousePause.open)}
    await p.evaluate(()=>{House.SPOTS['ch.bowl'].label=passTwoBowlLabel;House.hush()});
   }

  }
 });
 await run('desktop',async()=>{
  await p.evaluate(()=>House.putBack());await stage([40,-55,155],[-15,-24,0]);await key('f');await until(()=>House.mode==='monitor'&&!House.gliding&&DesktopSurface.ready());
  if(await p.locator('#brMin').isVisible())await p.locator('#brMin').tap();
  async function desktopShot(state){const layout=await p.evaluate(()=>{const r=DesktopSurface.rect(document.querySelector('#desktop'));return{desktop:{x:r.x,y:r.y,w:r.width,h:r.height},icons:[...document.querySelectorAll('.icons>.dicon')].filter(e=>getComputedStyle(e).display!=='none').map(e=>{const b=DesktopSurface.rect(e),t=e.querySelector('span'),l=t&&DesktopSurface.rect(t);return{id:e.id,text:e.textContent.trim(),x:b.x,y:b.y,w:b.width,h:b.height,label:l&&{x:l.x,y:l.y,w:l.width,h:l.height}}})}});await shot(state,layout);for(const b of layout.icons)check(b.x>=-1&&b.y>=-1&&b.x+b.w<=layout.desktop.w+1&&b.y+b.h<=layout.desktop.h+1,'Launcher clipped '+size+' '+b.text);}
  for(const s of sizes){await resize(s);if(await p.evaluate(()=>House.desktopDisplay())){await key('lock');await until(()=>!House.anims.has('pc-lock'))}await desktopShot('desktop-room');await key('lock');await until(()=>House.desktopDisplay()&&!House.anims.has('pc-lock'));await desktopShot('desktop-locked');
   if(!before&&await p.locator('#iconDesktopMore').isVisible()){
    await p.locator('#iconDesktopMore').tap();await until(()=>!!document.querySelector('.desktop-shortcut-folder'));
    const rows=await p.locator('.desktop-shortcut-folder .desktop-shortcut').count(),overflow=await p.locator('.icons>.desktop-overflow').count();check(rows===overflow&&rows>0,'Folder lost shortcuts '+s);await shot('desktop-folder',{rows,overflow});
    await p.locator('.desktop-shortcut-folder [data-w=close]').tap();
   }
  }
  await resize([844,390]);await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&House.mode==='monitor'&&!House.gliding&&DesktopSurface.ready());await finger();await desktopShot('desktop-refresh');
  await key('stand');await until(()=>House.mode==='walk'&&!House.gliding);
 });
 await run('paper',async()=>{
  for(const s of sizes){console.log('PAPER SIZE',s);await resize(s);await stage([40,-70,180],[40,-70,-30]);assert(await p.evaluate(()=>House.grab('reading.mag.bed')));console.log('PAPER GRIPPED',s);await p.keyboard.press('f');await until(()=>House.mode==='inspect'&&!!Magazines.reading);console.log('PAPER OPEN',s);await p.keyboard.press('f');await until(()=>!Magazines.reading.flipping);await p.waitForTimeout(900);
   // Rotate the actual solid paper, then magnify with a fixed-centre two-finger spread.
   const cx=s[0]/2,cy=s[1]*.38;await touch([[1,cx,cy]]);await touch([[1,cx+10,cy+4]],'touchMove');await touch([],'touchEnd');await p.waitForTimeout(250);
   const a=await projection('paper');await shot('paper-page',{projection:a});await touch([[21,cx-55,cy],[22,cx+55,cy]]);for(let i=1;i<=6;i++){await touch([[21,cx-55-i*7,cy],[22,cx+55+i*7,cy]],'touchMove');await p.waitForTimeout(60)}await touch([],'touchEnd');await p.waitForTimeout(450);const b=await projection('paper');await shot('paper-magnified',{projection:b,before:a});check(b.w>a.w*1.2,'Pinch did not enlarge paper '+s);check(b.rotation.slice(0,3).every((v,i)=>Math.abs(v-a.rotation[i])<.005),'Pinch reset paper angle '+s);
   await p.locator('[data-turn="1"]').tap();await until(()=>!Magazines.reading.flipping);
   if(!before&&s[0]===390){const saved=await p.evaluate(()=>({page:Magazines.reading.page,pose:House.inspectView()}));await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&House.mode==='inspect'&&!!Magazines.reading&&!document.querySelector('.hs-loading,#houseEntry'));const restored=await p.evaluate(()=>({page:Magazines.reading.page,pose:House.inspectView()}));check(JSON.stringify(saved)===JSON.stringify(restored),'Reading refresh changed bookmark/angle/magnification');await shot('paper-refresh',{saved,restored});}
   await p.keyboard.press('Escape');await until(()=>HousePause.open);await p.locator('[data-pause=resume]').tap();await until(()=>!HousePause.open);await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);await p.evaluate(()=>House.putBack());await until(()=>!House.held());
  }
 });
 await run('glass',async()=>{
  for(const gid of ['n64.kart','sn.zeldo']){
   await resize([390,844]);await p.evaluate(()=>House.putBack());if(gid.startsWith('sn.')){await p.evaluate(()=>House.goRoom('cupboard',0));await until(()=>!House.gliding);await p.evaluate(()=>{House.setWalkFrom({...House.P,lvl:'G',seat:0});House._.setMode('walk')})}await playCase(f,gid,{press:()=>key('e')});await until(()=>RoomTV._dbg()?.st==='game'&&!House.gliding);if(gid==='n64.kart'){
    for(const [k,mode]of [['Enter','main'],['z','cc'],['z','driver'],['z','cup'],['z','intro']]){await p.keyboard.press(k);await until(mode=>__kartDbg.st.mode===mode,mode)}
    await p.waitForTimeout(700);await p.keyboard.press('z');await until(()=>__kartDbg.st.mode==='race');await p.keyboard.down('z');await p.waitForTimeout(1200);await p.keyboard.up('z');check(await p.evaluate(()=>__kartDbg.st.me.v>0),'Real accelerator did not drive');
   }else{await p.keyboard.press('Enter');await p.locator('.zeldo-controls [data-zeldo=a]').tap();}
   await p.evaluate(()=>window.passTwoInstance=RoomTV.dbg());for(const s of sizes){await resize(s);await until(()=>{if(House.gliding)return false;const w=Room._.tvPose(RoomTV._dbg().con);return ['x','y','z'].every(k=>Math.abs(w[k]-House.P[k])<.5)});const kind=gid.startsWith('sn.')?'cupboard':'bedroom';const a=await projection(kind);await shot(kind+'-glass',{projection:a,area:await p.evaluate(()=>RoomTV.screenArea())});check(a.x>=-1&&a.y>=-1&&a.x+a.w<=s[0]+1&&a.y+a.h<=s[1]+1,'Glass outside '+s+' '+gid);await p.locator('.rm-tools .rm-lock').tap();await until(()=>RoomTV.lockIn());await p.locator('.rm-tools .rm-lock').tap();await until(()=>!RoomTV.lockIn()&&!House.gliding&&!document.querySelector('.rm-lockin'));await p.waitForTimeout(400);await until(()=>!House.gliding);const back=await projection(kind);check(Math.abs(back.h-a.h)<2,'T out did not return to the same framing '+s+' '+gid+' '+a.h+' '+back.h);check(await p.evaluate(()=>RoomTV.dbg()===passTwoInstance),'T restarted game');}
   await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);check(await p.evaluate(()=>RoomTV.dbg()===passTwoInstance),'Q restarted game');
  }
 });
 await run('notice',async()=>{
  // Discovery notices stack clear of the objective note instead of covering (or hiding) it.
  await p.evaluate(async()=>{if(House.mode!=='walk'){House._.setMode('walk')}House.putBack();await Chores.part('kitchen');House.buildRoom(House.ROOMS.kitchen);await Chores.part('bedroom');ChoreKit.S.prog.cat=ChoreKit.S.prog.cat||{};st.track('chore.cat');House.hush()});
  for(const s of sizes){await resize(s);
   for(const carry of [false,true]){
    await stage([100,210,240],[-100,265,-145],'G');
    if(carry){await p.evaluate(()=>{const t=House.THINGS.mug;t.at={...t.at,room:'kitchen',x:100,y:285,z:170,hide:false};House.ROOMS.kitchen.things.add(t.obj);House.place(t)});await stage([100,210,240],[100,285,170],'G');await p.keyboard.press('e');await until(()=>House.held()==='mug');await stage([100,210,240],[-100,265,-145],'G');}
    for(const [title,text] of [['Something found!','Intergalactic Battles: An Old Hope — the complete game box'],['★ SECRET FOUND! ★','Back issues of JACK ATTACK! magazine, bundled with string (1 of 1311 found)']]){
     let r;for(let attempt=0;attempt<4;attempt++){
     // The family chats freely here: retake a notice that a new bubble interrupted.
     await until(()=>!document.querySelector('.np-bub:not(.np-out)'));
     await p.evaluate(([a,b])=>Room.toast(a,b),[title,text]);await until(()=>{const e=document.querySelector('.hs-ui .rm-toast.on');return !!e&&+getComputedStyle(e).opacity>.9});await p.waitForTimeout(300);
     r=await p.evaluate(()=>{const v=e=>{if(!e)return null;const r=e.getBoundingClientRect(),c=getComputedStyle(e);return r.width&&r.height&&c.display!=='none'&&c.visibility!=='hidden'&&+c.opacity>.5?{x:r.x,y:r.y,w:r.width,h:r.height}:null};return{toast:v(document.querySelector('.hs-ui .rm-toast.on')),objective:v(document.querySelector('.hs-ui .st-objective')),speech:v(document.querySelector('.np-bub:not(.np-out)')),line:(e=>e&&{hidden:e.hidden,vis:getComputedStyle(e).visibility,display:getComputedStyle(e).display})(document.querySelector('.hs-ui .st-objective')),blockers:[...document.querySelectorAll('.rm-note.on,.hs-voice.on,.hs-call.on,.np-bub:not(.np-out),.ht-coach:not(.bye)')].map(e=>e.className)}});
     if(!r.speech&&!r.blockers.length&&!await p.evaluate(()=>!!document.querySelector('.np-bub:not(.np-out)')))break;await p.evaluate(()=>{document.querySelector('.hs-ui .rm-toast')?.classList.remove('on')});}
     await shot('notice-'+(carry?'carry-':'')+(title.includes('SECRET')?'secret':'found'),r);
     // (While the family speaks the objective steps aside for the bubble, as it always has.)
     check(r.toast&&(r.objective||r.speech||r.blockers.length),'Notice or objective missing '+s+' '+JSON.stringify(r));
     if(r.toast&&r.objective){const a=r.toast,b=r.objective;check(!(Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x)&&Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y)),'Notice overlaps the objective '+s+(carry?' carrying':''));check(a.x>=0&&a.y>=0&&a.x+a.w<=s[0]&&a.y+a.h<=s[1],'Notice off screen '+s);}
     await p.evaluate(()=>{document.querySelector('.hs-ui .rm-toast')?.classList.remove('on')});await p.waitForTimeout(250);
    }
    if(carry){await p.keyboard.press('q');await until(()=>!House.held());}
   }
  }
 });
 await run('cupgames',async()=>{
  // Every Super Ultra cartridge plays on the cupboard set: the whole picture, clear of its pad and bars.
  const controls='.rm-tools button,.rm-livebar .rm-b,.rm-pad:not([hidden]) :is(.rm-pl,.rm-pr,.rm-pm),.zeldo-dpad,.zeldo-actions,.plumb-dpad,.plumb-actions,.party-pad,.party-buttons';
  for(const gid of ['sn.zero','sn.plumb','sn.fight','sn.zeldo']){
   await resize([390,844]);if(await p.evaluate(()=>House.mode!=='walk'))await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);await p.evaluate(()=>House.putBack());
   await p.evaluate(()=>House.goRoom('cupboard',0));await until(()=>!House.gliding);await p.evaluate(()=>{House.setWalkFrom({...House.P,lvl:'G',seat:0});House._.setMode('walk')});
   await playCase(f,gid,{press:()=>key('e')});await until(()=>RoomTV._dbg()?.st==='game'&&!House.gliding);await p.keyboard.press('Enter');await p.waitForTimeout(1200);
   const name=gid.slice(3);
   for(const s of sizes.filter(s=>['390x844','844x390','1366x860'].includes(s.join('x')))){
    await resize(s);await until(()=>{if(House.gliding)return false;const w=Room._.tvPose('sn');return ['x','y','z'].every(k=>Math.abs(w[k]-House.P[k])<.5)});await p.waitForTimeout(300);
    const glass=await projection('cupboard'),ink=await p.evaluate(sel=>[...document.querySelectorAll(sel)].filter(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return r.width&&r.height&&c.display!=='none'&&c.visibility!=='hidden'&&+c.opacity>0}).map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,what:e.className||e.textContent}}),controls);
    await shot('cup-'+name,{projection:glass,ink});
    check(glass.x>=-1&&glass.y>=-1&&glass.x+glass.w<=s[0]+1&&glass.y+glass.h<=s[1]+1,'Cupboard picture cropped '+s+' '+gid);
    check(glass.h>=Math.min(200,s[1]*.5),'Cupboard picture too small to read '+s+' '+gid+' '+Math.round(glass.h));
    for(const o of ink)check(!(Math.min(o.x+o.w,glass.x+glass.w)>Math.max(o.x,glass.x)+1&&Math.min(o.y+o.h,glass.y+glass.h)>Math.max(o.y,glass.y)+1),'Control covers the cupboard picture '+s+' '+gid+' '+o.what);
   }
   await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);
  }
 });
 assert.deepEqual(f.errors,[]);console.log('PASS UI HUD PASS TWO',phase,'findings',findings.length);
 }catch(e){await shot('failure',{error:e.stack}).catch(()=>{});throw e}finally{await writeFile(new URL('evidence.json',out),JSON.stringify({phase,evidence,findings,errors:f.errors},null,2));await f.browser.close()}
});
