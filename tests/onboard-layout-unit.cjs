// Load the production placement maths, without a renderer or a second browser.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope={window:{}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../app/public/js/np-bubble.js'),'utf8'),scope);
const place=scope.window.NPCBubble.layout.place;
for(const f of [
 {view:{w:412,h:915,m:10,top:8},w:230,h:100,y:100,keep:[{x:93,y:146,w:226,h:58},{x:70,y:10,w:170,h:48},{x:172,y:423,w:68,h:68}]},
 {view:{w:412,h:915,m:10,top:8},w:230,h:130,y:100,keep:[{x:93,y:146,w:226,h:92},{x:70,y:10,w:170,h:48},{x:172,y:423,w:68,h:68}]},
 {view:{w:915,h:412,m:10,top:8},w:380,h:105,y:76,keep:[{x:340,y:96,w:234,h:58},{x:70,y:10,w:149,h:44},{x:413,y:162,w:88,h:88},{x:825,y:275,w:72,h:72},{x:715,y:357,w:180,h:44}]}
]){
 const p=place({x:f.view.w/2,y:f.y+f.h},f.w,f.h,f.view,f.keep,0);
 assert(p.x>=f.view.m&&p.y>=f.view.top+12&&p.x+f.w<=f.view.w-f.view.m&&p.y+f.h<=f.view.h-f.view.m);
 for(const k of f.keep)assert(!(p.x<k.x+k.w+6&&p.x+f.w+6>k.x&&p.y-12<k.y+k.h+6&&p.y+f.h+6>k.y),'Subtitle/name overlaps HUD: '+JSON.stringify({p,k}));
}
// A reply retains both panels, including name tabs, across all house shapes.
for(const [w,h,bw,bh] of [[1366,860,380,90],[412,915,230,100],[915,412,350,75]]){
 const view={w,h,m:10,top:8},keep=[{x:w/2-34,y:h/2-34,w:68,h:68}],p=place({x:w/2,y:h-30},bw,bh,view,keep,0);
 const panels=[{...p,w:bw,h:bh},{...p,w:bw,h:bh}];scope.window.NPCBubble.layout.separate(panels,view,keep);
 const [a,b]=panels;
 for(const r of panels)assert(r.x>=10&&r.x+r.w<=w-10&&r.y>=20&&r.y+r.h<=h-10,'Reply leaves view');
 assert(a.x+a.w+6<=b.x||b.x+b.w+6<=a.x||a.y+a.h+18<=b.y||b.y+b.h+18<=a.y,'Reply/name tabs overlap: '+JSON.stringify(panels));
}
console.log('ONBOARD LAYOUT PASS: long speech and name tabs clear carry panels, headers, crosshair and actions');
// An orphaned bubble must release note/dialogue queues even with no renderer frames.
{
 const timers=new Map();let serial=0;
 class El {
  constructor(){this.style={setProperty(){}};this.classList={add(){}};this.parts={};this.children=[];this.hidden=false;}
  setAttribute(){} appendChild(el){this.children.push(el);return el;} insertBefore(el){this.children.unshift(el);} remove(){this.removed=true;}
  querySelector(key){return this.parts[key]||=new El();}
 }
 const host=new El(),context={window:{House:{ok:true,live:true,camera:{},ui:{el:host}}},document:{createElement:()=>new El(),createElementNS:()=>new El()},getComputedStyle:()=>({display:'block',visibility:'visible'}),addEventListener(){},performance:{now:()=>0},requestAnimationFrame:()=>1,setTimeout(fn,ms){timers.set(++serial,{fn,ms});return serial;},clearTimeout(id){timers.delete(id);}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../app/public/js/np-bubble.js'),'utf8'),context);
 const b=context.window.NPCBubble.show({key:'mom',who:'Mom',text:'One line at a time.',ms:4000});
 assert(b&&!b.out);const expiry=[...timers.values()].find(t=>t.ms===45000);assert(expiry,'A stopped frame loop has no finite bubble lifetime');expiry.fn();
 assert(b.out&&b.el.hidden,'An expired bubble still matches the queue blocker');assert(![...timers.values()].some(t=>t.ms===45000),'Expiry timer was not cleared');
 const mom=context.window.NPCBubble.show({key:'mom',who:'Mom',text:'Your turn.',ms:4000}),dad=context.window.NPCBubble.show({key:'dad',who:'Dad',text:'Thanks.',ms:4000});
 assert(!mom.out&&!dad.out,'A reply closed the previous speaker');
 const next=context.window.NPCBubble.show({key:'mom',who:'Mom',text:'Another line.',ms:4000});assert(mom.out&&!dad.out&&!next.out,'Only the same speaker should replace a panel');
 console.log('ONBOARD EXPIRY PASS: orphaned speech releases its queue without a renderer frame');
}
