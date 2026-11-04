// Evaluated inside qa-tablet.mjs: real cases, fingers, shared running game through rotation/LOCK IN.
const phase=process.env.FIXES5_PHASE||'after';
const sizes=[[1024,768],[768,1024],[1180,820],[1366,1024]];
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
await p.evaluate(()=>Apps.load('js/rm-tv.js'));
for(const gid of ['n64.kart','ps.grav','sn.zero','gb.mon']){
 await p.evaluate(()=>{HousePause.close();RoomTV.close(true)});await wait(()=>!House.gliding);
 await playCase(f,gid);await tap(4,200);await p.waitForTimeout(800);
 for(const [w,h] of sizes){
  await rotate(w,h);await wait(()=>!House.gliding);await tap(4,200);
  for(const locked of [false,true]){
   await p.evaluate(locked=>RoomTV.lockIn(locked),locked);await p.waitForTimeout(650);
   const tag=`${phase}-${w}x${h}-${gid}-${locked?'lock':'room'}`;
   await p.screenshot({path:'tests/shots/fixes5/'+tag+'.png',timeout:60000});
   const data=await p.evaluate(()=>{
    const el=document.querySelector('.rm-tvv.on'),r=Room._.screenRect(RoomTV.dbg().con,RoomTV._dbg().con==='sn'?House.ROOMS.cupboard.cupScreen:null);
    const glass=RoomTV.lockIn()?el.querySelector('.rm-glass').getBoundingClientRect():r;
    const rect=r=>r&&({x:r.left,y:r.top,w:r.width,h:r.height});
    const controls=[...el.querySelectorAll('.rm-pl,.rm-pr,.rm-pm,.rm-tools,.rm-livebar')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>({class:e.className,...rect(e.getBoundingClientRect())}));
    const keys=[...el.querySelectorAll('.rm-pad button')].filter(e=>e.getClientRects().length).map(e=>({key:e.dataset.b,...rect(e.getBoundingClientRect())}));
    return{glass:rect(glass),controls,keys,mode:House.mode,touch:GameInput.touch,keyA:RoomTV.dbg().keyLabel('a'),keyStart:RoomTV.dbg().keyLabel('start')};
   });
   await log(tag,data);
   if(phase==='after'){
    assert(data.touch,'Touch must stay active');assert(data.keyStart==='START','Touch title label');
    assert(data.keys.length>1,'Visible tablet buttons, including the handheld');
    for(const b of data.keys){assert(b.w>=44&&b.h>=44,'Finger target '+b.key);assert(b.x+b.w<=174||b.x>=w-174,'Thumb reach '+b.key+' '+tag)}
    for(const b of data.controls){
     if(b.class==='rm-livebar'&&locked)continue;
     const a=data.glass;if(!a)continue;
     assert(!(b.x<a.x+a.w-2&&b.x+b.w>a.x+2&&b.y<a.y+a.h-2&&b.y+b.h>a.y+2),'Picture covered by '+b.class+' '+tag);
    }
   }
  }
  await p.evaluate(()=>RoomTV.lockIn(false));await p.waitForTimeout(600);
 }
}
await p.evaluate(()=>RoomTV.close(true));await wait(()=>!House.gliding);
await log('console-review-complete',phase);
