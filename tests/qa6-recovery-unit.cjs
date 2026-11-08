'use strict';
// Execute the production touch-view scheduling through its recovery event.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','app/public/js/hs-touch.js'),'utf8');
const block=source.slice(source.indexOf('  let autoLocked ='),source.indexOf('  // ---------------------------------------------------------------- the game menu'));
for(const width of [390,844,768,1024]){
 let full=false,recovering=false,resize,handler,st='pc',versionChanges=0;const queue=[];
 const H={mode:'pcboot',gliding:false,desktopDisplay(value){if(typeof value==='boolean'){const change=full!==value;full=value;if(change){versionChanges++;resize?.()}}return full},on(event,fn){assert.equal(event,'pc-recovery');handler=fn}};
 const context={H,window:{JHPBoot:'cold',DesktopSurface:{ready:()=>false}},ls:{get:()=>null},touchOn:()=>true,phone:()=>width<600,document:{querySelector:()=>recovering?{}:null},addEventListener:(_,fn)=>resize=fn,setTimeout:fn=>queue.push(fn),st};
 vm.createContext(context);vm.runInContext(block+';this.arrive=pcArrived;',context);context.arrive();
 const advance=n=>{while(n-->0&&queue.length)queue.shift()()};advance(5);assert(!full,'Locks before recovery is visible');
 recovering=true;handler();advance(20);assert(full,width+' recovery did not auto-lock before desktop readiness');
 H.desktopDisplay(false);handler();advance(50);assert(!full,'Delayed recovery lock overrides explicit In room choice');assert(versionChanges>=2);
}
for(const width of [390,768])for(const saved of [false,true]){
 let full=saved,handler,recovering=false;const queue=[];
 const H={mode:'pcboot',gliding:false,desktopDisplay(value){if(typeof value==='boolean')full=value;return full},on(_,fn){handler=fn}};
 const ctx={H,window:{JHPBoot:'wake',DesktopSurface:{ready:()=>false}},ls:{get:()=>saved},touchOn:()=>true,phone:()=>width<600,document:{querySelector:()=>recovering?{}:null},addEventListener(){},setTimeout:fn=>queue.push(fn),st:'pc'};
 vm.createContext(ctx);vm.runInContext(block+';this.arrive=pcArrived;',ctx);ctx.arrive();recovering=true;handler();for(let n=0;n<20&&queue.length;n++)queue.shift()();assert.equal(full,saved,'Token resume changes the saved recovery view');
}
assert(fs.readFileSync(path.join(__dirname,'..','app/public/js/setup.js'),'utf8').includes("window.House?.emit('pc-recovery')"));
console.log('PASS QA6 recovery: phone/tablet cold boot, readiness boundary, explicit view choice');
// Reproduce QA's portrait collision at its measured pixels. Exercise the real
// keep-out collection and placement, including the live bed-work element.
const bubbleSource=fs.readFileSync(path.join(__dirname,'..','app/public/js/np-bubble.js'),'utf8'),bubbleWindow={};
vm.runInNewContext(bubbleSource,{window:bubbleWindow,console});
const note={className:'ch-bed-note',getBoundingClientRect:()=>({left:92,top:710,width:207,height:64})};
const ctx={document:{documentElement:{clientWidth:390,clientHeight:844},querySelectorAll:selector=>selector.split(',').some(s=>s.trim().startsWith('.'+note.className))?[note]:[]},getComputedStyle:()=>({visibility:'visible',display:'block',opacity:'1'})};
vm.createContext(ctx);const start=bubbleSource.indexOf('  const KEEP ='),end=bubbleSource.indexOf('  let V =',start);
vm.runInContext(bubbleSource.slice(start,end)+';refreshKeep(1000);this.rects=keep;this.viewport=view;',ctx);
const place=bubbleWindow.NPCBubble.layout.place,overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const work={x:92,y:710,w:207,h:64},anchor={x:145,y:789};
const old={...place(anchor,270,60,ctx.viewport,[],18),w:270,h:60};assert(overlaps(old,work),'QA portrait collision fixture no longer overlaps');
const fixed={...place(anchor,270,60,ctx.viewport,ctx.rects,18),w:270,h:60};assert(!overlaps(fixed,work),'Speech covers active bed-work instructions');
console.log('PASS QA6 bed speech: real keep-out collection separates the measured portrait rectangles');
