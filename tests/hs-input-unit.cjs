'use strict';
// CPU-only: execute the production input service and icon activation helper.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Events {
 constructor(){this.handlers=new Map();this.dataset={}}
 addEventListener(name,fn){if(!this.handlers.has(name))this.handlers.set(name,new Set());this.handlers.get(name).add(fn)}
 dispatchEvent(ev){ev.target??=this;for(const fn of this.handlers.get(ev.type)||[])fn(ev);return true}
 fire(type,extra={}){return this.dispatchEvent({type,isTrusted:true,target:this,preventDefault(){},...extra})}
 closest(){return null}
}
function fixture(coarse=true){
 const document=new Events(),window=new Events(),timers=new Map(),changes=[];let seq=0,pads=[];
 const dispatch=document.dispatchEvent.bind(document);document.dispatchEvent=ev=>{window.dispatchEvent(ev);return dispatch(ev)};
 document.documentElement=new Events();document.activeElement=null;document.hidden=false;
 const ctx={window,document,navigator:{getGamepads:()=>pads},setTimeout:fn=>{timers.set(++seq,fn);return seq},clearTimeout:id=>timers.delete(id),CustomEvent:class{constructor(type,o){Object.assign(this,{type,...o})}}};
 window.matchMedia=()=>({matches:coarse});document.addEventListener('game-input-change',e=>changes.push(e.detail));vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../app/public/js/hs-input.js'),'utf8'),ctx);
 return {document,window,ctx,changes,get api(){return window.GameInput},pads(v){pads=v},poll(){const [id,fn]=timers.entries().next().value||[];assert(fn,'No poll scheduled');timers.delete(id);fn()}};
}
const f=fixture();assert.equal(f.api.touch,true);assert.equal(f.api.currentInput,'touch');assert.equal(f.api.currentinput,'touch');assert.equal(f.document.documentElement.dataset.gameTouch,'true');
f.document.fire('pointerdown',{pointerType:'mouse',isTrusted:false});assert(f.api.touch,'Synthetic trackpad mouse changed mode');
f.document.fire('pointerdown',{pointerType:'mouse',sourceCapabilities:{firesTouchEvents:true}});assert(f.api.touch);
f.document.fire('pointermove',{pointerType:'mouse',movementX:0,movementY:0});assert(f.api.touch);
f.document.fire('pointermove',{pointerType:'mouse',movementX:1,movementY:0});assert.equal(f.api.mode,'mouse');
f.document.fire('pointerdown',{pointerType:'pen'});assert(f.api.touch);
const keyboard={key:'w',code:'KeyW',keyCode:87};
f.document.fire('keydown',{...keyboard,isTrusted:false});assert(f.api.touch);
f.document.fire('keydown',{...keyboard,target:{closest:()=>({})}});assert(f.api.touch,'Typing in text field changed mode');
f.document.fire('keydown',{...keyboard,isComposing:true});assert(f.api.touch);
f.document.fire('keydown',{...keyboard,keyCode:229});assert(f.api.touch);
f.document.fire('keydown',{...keyboard,code:''});assert(f.api.touch,'Software key without hardware code changed mode');
f.document.fire('compositionstart');f.document.fire('keydown',keyboard);assert(f.api.touch);f.document.fire('compositionend');
f.document.fire('keydown',keyboard);assert.equal(f.api.mode,'keyboard');assert.equal(f.document.documentElement.dataset.gameInput,'keyboard');
f.document.fire('pointerdown',{pointerType:'touch'});assert(f.api.touch);
const pad={index:0,connected:true,buttons:[{pressed:true}],axes:[0,0]};f.pads([pad]);f.poll();assert.equal(f.api.mode,'gamepad');
f.document.fire('pointerdown',{pointerType:'mouse'});f.poll();assert.equal(f.api.mode,'mouse','Held gamepad stole input back');
pad.buttons[0].pressed=false;f.poll();pad.buttons[0].pressed=true;f.poll();assert.equal(f.api.mode,'gamepad');f.pads([]);f.poll();assert.equal(f.api.mode,'mouse');assert.equal(f.changes.at(-1).reason,'gamepad-disconnected');
f.document.hidden=true;f.document.fire('visibilitychange');f.document.hidden=false;f.document.fire('visibilitychange');
assert(f.changes.every(c=>c.previous&&c.mode&&typeof c.touch==='boolean'));assert.equal(fixture(false).api.mode,'mouse','Initial fine-pointer fallback failed');
// Test actual icon launch helper: trusted touch, keyboard, physical mouse and
// the precise untrusted click(1)/click(2)/dblclick trackpad sequence.
let time=1000,count=0,selected=0;const appCtx={window:{GameInput:{touch:true}},performance:{now:()=>time}};vm.createContext(appCtx);
const apps=fs.readFileSync(require.resolve('../app/public/js/apps.js'),'utf8'),start=apps.indexOf('  function bindLaunch('),end=apps.indexOf('  // ================================================================ desktop icons',start);
vm.runInContext(apps.slice(start,end),appCtx);const el=new Events();appCtx.bindLaunch(el,()=>count++,()=>selected++);
const click=(extra={})=>{time+=20;el.fire('click',{detail:1,button:0,pointerType:'mouse',...extra})};
click();assert.equal(count,0,'Physical single click opened an icon');click({detail:2});assert.equal(count,1);el.fire('dblclick',{detail:2});assert.equal(count,1,'Native double opened twice');
time+=700;click({pointerType:'touch'});assert.equal(count,2,'Real touch did not launch');el.fire('dblclick',{detail:2});assert.equal(count,2);
time+=700;click({isTrusted:false});assert.equal(count,2,'Trackpad single unexpectedly launched in touch mode');click({detail:2,isTrusted:false});el.fire('dblclick',{isTrusted:false,detail:2});assert.equal(count,3,'Trackpad Double did not launch exactly once');
click({detail:0,pointerType:''});assert.equal(count,4,'Keyboard button activation failed');
time+=700;click();el.fire('pointercancel');click();assert.equal(count,4,'Cancelled selection survived');assert(selected>0);
// Source ownership guard: no coupled simulation changes in the games kit.
const games=fs.readFileSync(require.resolve('../app/public/js/apps-games.js'),'utf8');assert(games.includes('Apps.bindLaunch(el,'));assert(games.includes('G.phone = () => window.GameInput'));assert(games.includes("G.on(document, 'game-input-change',"));
// Execute the launcher's cancellation hooks against real event ownership.
{
 const doc=new Events(),win=new Events(),host=new Events(),cancelled=[],ups=[],closing=[];
 host.contains=()=>true;
 const G={active:()=>true,keys:{up:ev=>ups.push(ev.key)},on:(el,type,fn)=>el.addEventListener(type,fn),onClose:fn=>closing.push(fn)};
 const target=new Events();let released=false;target.hasPointerCapture=()=>true;target.releasePointerCapture=()=>{released=true};target.addEventListener('pointercancel',ev=>cancelled.push(ev.pointerId));
 const c={G,document:doc,window:win,host,PointerEvent:class{constructor(type,init){Object.assign(this,{type,...init})}}};vm.createContext(c);
 const start=games.indexOf('      const keys = new Map(), pointers = new Map();'),end=games.indexOf('      JG.live[g.id] = G;',start);vm.runInContext(games.slice(start,end),c);
 doc.fire('keydown',{target,key:'z',code:'KeyZ'});host.fire('pointerdown',{target,pointerId:17,pointerType:'touch'});doc.fire('game-input-change',{detail:{mode:'mouse',previous:'keyboard'}});assert.deepEqual(ups,[],'Mouse look released held keyboard controls');assert.deepEqual(cancelled,[]);doc.fire('game-input-change',{detail:{mode:'touch',previous:'mouse'}});
 assert.deepEqual(ups,['z']);assert.deepEqual(cancelled,[17]);assert(released);doc.fire('game-input-change');assert.equal(cancelled.length,1,'A cancelled pointer remained owned');
 host.fire('pointerdown',{target,pointerId:19,pointerType:'touch'});host.fire('lostpointercapture',{pointerId:19});assert.deepEqual(cancelled,[17,19]);
 host.fire('pointerdown',{target,pointerId:20,pointerType:'touch'});win.fire('blur');assert.deepEqual(cancelled,[17,19,20]);closing[0]();assert.equal(cancelled.length,3);
}
console.log('HS INPUT UNIT PASS: coarse fallback, trusted hybrid sources, trackpad/IME/text exclusion, gamepad edges/disconnect, adaptive dataset/event and exactly-once touch/keyboard/mouse/trackpad icon activation');
