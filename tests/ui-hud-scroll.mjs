// Native pause-menu scrolling starts on visible settings text. A range or
// select legitimately owns a drag beginning on its face. All scroll changes
// below are driven by trusted input, never by assigning a passing scroll value.
import assert from 'node:assert/strict';

export async function scrollPause({page,cdp,touch}) {
 const selector='.hs-pause',dialog=page.locator(selector);
 const position=()=>dialog.evaluate(e=>({top:e.scrollTop,max:e.scrollHeight-e.clientHeight}));
 const resume=()=>page.locator('[data-pause=resume]').evaluate(e=>{
  const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return {x:r.x,y:r.y,w:r.width,h:r.height,hit:e===hit||e.contains(hit),viewport:innerHeight};
 });
 const checkResume=async()=>{const r=await resume();assert(r.y>=0&&r.y+r.h<=r.viewport&&r.hit,'Resume obscured while settings scroll');return r};
 const samples=[],targets=[];
 await page.evaluate(()=>{window.uiPauseNative=[];for(const type of ['touchstart','touchmove','touchend','scroll'])window.addEventListener(type,e=>{if(!document.querySelector('.hs-pause')?.open)return;if(uiPauseNative.length<100)uiPauseNative.push({type,trusted:e.isTrusted,target:e.target.tagName,top:document.querySelector('.hs-pause').scrollTop})},{capture:true,passive:true})});
 async function waitForScroll(predicate,arg){for(let n=0;n<60;n++){if(await page.evaluate(predicate,arg))return;await page.waitForTimeout(50)}assert.fail('Native pause scroll did not reach its target: '+JSON.stringify(await position()))}
 const point=async()=>{
  const r=await dialog.boundingBox();
  const p=await page.evaluate(selector=>{
   const d=document.querySelector(selector),r=d.getBoundingClientRect();
   return [...d.querySelectorAll('fieldset small,p,legend,fieldset label')]
    .filter(e=>!e.closest('label')?.querySelector('select,input[type="range"]'))
    .map(e=>{const r=e.getBoundingClientRect();return{e,p:{x:r.x+r.width*.6,y:r.y+r.height/2}}})
    .filter(({p})=>p.y>r.top+35&&p.y<r.bottom-12)
    .filter(({e,p})=>{const hit=document.elementFromPoint(p.x,p.y);return (hit===e||e.contains(hit))&&!hit.closest('button,input,select,textarea,a,summary,[role="button"]')})
    .at(-1)?.p;
  },selector);
  assert(p,'Visible settings text for a native drag');
  p.end=Math.max(r.y+14,p.y-Math.min(200,r.height*.75));
  const hit=await page.evaluate(({p,selector})=>{
   const e=document.elementFromPoint(p.x,p.y),d=document.querySelector(selector);
   return {tag:e?.tagName,cls:e?.className,inside:e===d||d.contains(e),control:!!e?.closest('button,input,select,textarea,a,summary,[role="button"]')};
  },{p,selector});
  assert(hit.inside&&!hit.control,'Pause drag must start on ordinary settings text: '+JSON.stringify(hit));
  targets.push({...p,...hit});return p;
 };
 await checkResume();
 const initial=await position();
 if(initial.max>0){
  // A real wheel follows mouse movement into the dialog. Sending only a CDP
  // wheel, with no preceding hover, can leave Chrome's scroll latch elsewhere.
  await dialog.hover();
  for(const deltaY of touch?[2000,-2000]:[2000]){
   await page.mouse.wheel(0,deltaY);
   await waitForScroll(({selector,bottom})=>{const e=document.querySelector(selector);return bottom?e.scrollTop>=e.scrollHeight-e.clientHeight-1:e.scrollTop<=1},{selector,bottom:deltaY>0});
   samples.push({method:'wheel',deltaY,...await position(),resume:await checkResume()});
  }
  if(touch){
   // Return through a genuine, completed finger press on the harmless heading,
   // then drive the same settings to their end using only touch movement.
   const head=await page.locator('.hs-pause-head').boundingBox();
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:9,x:head.x+30,y:head.y+20}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(100);
   for(let n=0;n<12;n++){
    const old=await position();if(old.top>=old.max-1)break;
    const p=await point();console.log('PAUSE DRAG',JSON.stringify({selector,old,p}));
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:7,x:p.x,y:p.y,force:1,radiusX:6,radiusY:6}]});
    for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:7,x:p.x,y:p.y+(p.end-p.y)*i/8,force:1,radiusX:6,radiusY:6}]});await page.waitForTimeout(35)}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await waitForScroll(({selector,top})=>document.querySelector(selector).scrollTop>top,{selector,top:old.top});
    await page.waitForTimeout(180);
    samples.push({method:'touch',...await position(),resume:await checkResume()});
   }
   const bottom=await position();assert(bottom.top>=bottom.max-1,'Touch could not reach the bottom settings');
  }
 }
 let setting=null;
 if(touch){const range=page.locator('.hs-pause [name=touchLook]'),from=Number(await range.inputValue()),r=await range.boundingBox();await range.tap({position:{x:r.width*(from>145?.25:.75),y:r.height/2}});const to=Number(await range.inputValue());assert.notEqual(to,from,'Lower Look speed setting ignored native touch');setting={from,to};await checkResume();}
 const scroll=await position();
 assert(scroll.max===0||scroll.top>=scroll.max-1,'Pause settings below the fold are unreachable');
 return {scroll,resume:await checkResume(),targets,samples,setting,native:await page.evaluate(()=>uiPauseNative)};
}
