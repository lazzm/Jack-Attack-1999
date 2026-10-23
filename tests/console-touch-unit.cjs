'use strict';
// Bounded CPU-only regression of the actual runtime. No browser/server or saves.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
class Element {
  constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.children = []; this.parentNode = null; this.dataset = {}; this.attrs = {}; this.style = {setProperty(k,v){this[k]=v}}; this.listeners = new Map(); this.captures = new Set(); this.width = 320; this.height = 240; this.clientWidth = 390; this.clientHeight = 844; this.hidden = false; this.classes = new Set(); this.classList = { add:(...a)=>a.forEach(x=>this.classes.add(x)), remove:(...a)=>a.forEach(x=>this.classes.delete(x)), contains:x=>this.classes.has(x), toggle:(x,on)=>{on=on===undefined?!this.classes.has(x):on;on?this.classes.add(x):this.classes.delete(x);return on} }; }
  set className(v) { this.classes = new Set(v.split(/\s+/).filter(Boolean)); } get className(){return [...this.classes].join(' ')}
  set innerHTML(html) {
    this.html = html; this.children = []; const stack = [this];
    for (const m of html.matchAll(/<(\/?)([\w-]+)([^>]*)>/g)) {
      if(m[1]){if(stack.length>1)stack.pop();continue}
      const e = new Element(m[2]); for (const a of m[3].matchAll(/([\w-]+)="([^"]*)"/g)) {if(a[1]==='class')e.className=a[2];else e.setAttribute(a[1],a[2])}
      e.hidden = /\bhidden\b/.test(m[3]); stack.at(-1).appendChild(e); if(!['i','input','br','link'].includes(m[2]) || m[2]==='i')stack.push(e);
    }
  }
  get innerHTML(){return this.html||''}
  setAttribute(k,v){this.attrs[k]=v;if(k.startsWith('data-'))this.dataset[k.slice(5)]=v}
  appendChild(e){e.remove();this.children.push(e);e.parentNode=this;return e}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(e=>e!==this);this.parentNode=null}
  contains(e){return e===this||this.children.some(c=>c.contains(e))}
  matches(s){if(s.startsWith('.'))return s.slice(1).split('.').every(c=>this.classes.has(c));if(s.startsWith('[')){const m=s.match(/^\[([^=\]]+)(?:="?([^"\]]+)"?)?\]$/);return !!m&&(m[2]===undefined?m[1] in this.attrs:this.attrs[m[1]]===m[2])}return this.tagName.toLowerCase()===s}
  closest(s){return s.split(',').map(s=>{let e=this;while(e&&!e.matches(s)){e=e.parentNode}return e}).find(Boolean)||null}
  querySelectorAll(s){const results=[],parts=s.trim().split(/\s+/);const visit=e=>{for(const c of e.children){if(c.matches(parts.at(-1))&&(parts.length===1||c.parentNode?.closest(parts.slice(0,-1).join(' '))))results.push(c);visit(c)}};visit(this);return results}
  querySelector(s){return this.querySelectorAll(s)[0]||null}
  get firstElementChild(){return this.children[0]}
  getBoundingClientRect(){return this.rect||{left:0,top:0,right:128,bottom:128,width:128,height:128}}
  addEventListener(n,f){if(!this.listeners.has(n))this.listeners.set(n,new Set());this.listeners.get(n).add(f)}
  removeEventListener(n,f){this.listeners.get(n)?.delete(f)}
  fire(n,props={}){const ev={target:this,pointerId:1,clientX:64,clientY:64,button:0,detail:1,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){},...props};for(const f of [...this.listeners.get(n)||[]])f(ev);return ev}
  setPointerCapture(id){this.captures.add(id)} hasPointerCapture(id){return this.captures.has(id)} releasePointerCapture(id){this.captures.delete(id)}
  getContext(){return paint} cloneNode(){const e=new Element(this.tagName);e.className=this.className;return e}
  replaceWith(e){const p=this.parentNode;p.children[p.children.indexOf(this)]=e;e.parentNode=p;this.parentNode=null}
}
const paint = new Proxy({createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{}});
const win = new Element(), doc = new Element('document'), root = new Element('html'), pb = new Element(); doc.documentElement=root;doc.head=new Element('head');doc.createElement=t=>new Element(t);doc.getElementById=()=>true;doc.hidden=false;
let dirty=0, ended=0, made=0, nextRaf=0, gp=null, timer=0;
const store=new Map(), consoles=Object.fromEntries(['n64','ps','gb','md','dc','sn'].map(con=>[con,{n:con,full:con,from:con,media:'cartridge'}]));
const games=Object.fromEntries(['n64.range','ps.sneak','gb.blocks','md.rings','dc.taxi','sn.zero'].map(id=>[id,{id,con:id.split('.')[0],title:id,max:100,pay:1,file:'unused'}]));
const ctx={console,Map,Set,Promise,window:null,document:doc,navigator:{getGamepads:()=>gp?[gp]:[]},innerWidth:390,innerHeight:844,performance:{now:()=>0},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},sessionStorage:{getItem:()=>0,setItem(){}},requestAnimationFrame:()=>++nextRaf,cancelAnimationFrame(){},setInterval:()=>1,clearInterval(){},setTimeout:()=>++timer,clearTimeout(){},matchMedia:()=>({matches:true}),getComputedStyle:el=>({getPropertyValue:k=>el.css?.[k]||'0'}),Room:{House:{paused:false,hush(){},dirty(){dirty++}},owned:()=>true,_:{pb,esc:String,isOut:()=>true,sfx(){},emit(){},save(){},S:{},tvOff(){}}},RoomCat:{CONSOLES:consoles,GAME:games,GAMES:Object.values(games)}};
ctx.window=ctx;ctx.addEventListener=win.addEventListener.bind(win);ctx.removeEventListener=win.removeEventListener.bind(win);ctx.visualViewport=new Element();vm.createContext(ctx);
let source=fs.readFileSync(require.resolve('../app/public/js/rm-tv.js'),'utf8');
source=source.replace(/\}\)\(\);\s*$/,`window.testRuntime={pad,padTouch,clearInput,onKey,onKeyUp,pollGamepad,stick,isHeld,stopGame,startGame,loop,get view(){return V},get pads(){return touchPads},get pending(){return pend},get game(){return game},get key(){return K}};})();`);
vm.runInContext(source,ctx);
const rt=ctx.testRuntime, tv=ctx.RoomTV;
const keyboard={KeyW:'moveForward',KeyS:'moveBack',KeyA:'moveLeft',KeyD:'moveRight'};
for(const [id,g] of Object.entries(games))tv.game(id,{buttons:g.con==='sn'?['y','x','l','b','a','r']:g.con==='n64'?['a','b','l','r']:['a','b'],stick:g.con==='n64',keyboard:g.con==='n64'?keyboard:undefined,make(){made++;return {end(){ended++},update(){}}}});
const target=(p,s)=>{const e=p.querySelector(s);assert(e,'Missing '+s);return e};
const down=(p,id,e,x=64,y=64)=>p.fire('pointerdown',{pointerId:id,target:e,clientX:x,clientY:y});
const up=(p,id,type='pointerup')=>p.fire(type,{pointerId:id});
const key=(name,code,extra={})=>({key:name,code,target:root,preventDefault(){},stopImmediatePropagation(){},...extra});
(async()=>{
  tv.test('n64.range');rt.startGame();const p=target(rt.view.el,'.rm-pad'), move=target(p,'.rm-dpad'), aim=target(p,'.rm-stick'), a=target(p,'[data-b="a"]');
  down(p,1,a);down(p,2,a);up(p,1);assert(rt.isHeld('a'),'First finger released second finger');up(p,2,'pointercancel');assert(!rt.isHeld('a'));
  down(p,1,move,64,0);down(p,2,aim,128,64);down(p,3,a);
  assert(rt.isHeld('moveForward'));assert(rt.isHeld('up'),'Movement cannot navigate game menus');assert(rt.isHeld('right'));assert(rt.isHeld('a'));assert(rt.stick().x>.9);
  assert(target(p,'[data-b="up"]').classList.contains('on'),'Movement direction has no feedback');
  up(p,2,'lostpointercapture');assert(rt.isHeld('moveForward'));assert.equal(rt.stick().x,0);assert.equal(rt.stick().y,0,'Movement leaked into aim');up(p,3);up(p,1);
  for(const b of ['a','b','l','r','start']){const el=target(p,`[data-b="${b}"]`);down(p,4,el);assert(rt.isHeld(b));up(p,4);assert(!rt.isHeld(b))}
  // Two independent movement fingers; cancel one and preserve the other.
  down(p,1,move,0,64);down(p,2,move,64,0);up(p,1,'pointercancel');assert(rt.isHeld('moveForward'));assert(!rt.isHeld('moveLeft'));rt.clearInput();up(p,2);p.fire('pointermove',{pointerId:2,clientY:0});assert(!rt.isHeld('moveForward'));
  rt.onKey(key('z','KeyZ'));rt.onKey(key(' ','Space'));rt.onKeyUp(key('z','KeyZ'));assert(rt.isHeld('a'),'Aliased keyboard keys released each other');rt.onKeyUp(key(' ','Space'));assert(!rt.isHeld('a'));
  rt.onKey(key('z','KeyZ'));down(p,7,a);up(p,7);assert(rt.isHeld('a'));rt.clearInput();
  for(const event of ['blur','resize']){down(p,1,a);win.fire(event);assert(!rt.isHeld('a'));assert.equal(rt.pads.get(p).act.size,0)}
  down(p,1,a);doc.hidden=true;doc.fire('visibilitychange');assert(!rt.isHeld('a'));doc.hidden=false;doc.fire('visibilitychange');
  ctx.Room.House.paused=true;down(p,1,a);assert(!rt.isHeld('a'));ctx.Room.House.paused=false;
  // Replacing markup must have exactly one set of pointer listeners.
  for(let i=0;i<12;i++)rt.pad(tv.defs['n64.range']);assert.equal(p.listeners.get('pointerdown').size,1);assert.equal(win.listeners.get('pointerup').size,1);assert.equal(rt.pads.size,1);
  down(p,1,target(p,'[data-b="a"]'));win.fire('pointercancel',{pointerId:1});assert(!rt.isHeld('a'),'Failed capture release outside pad');
  gp={connected:true,buttons:[{pressed:true}],axes:[0,0]};rt.pollGamepad();assert(rt.isHeld('a'));gp=null;rt.pollGamepad();assert(!rt.isHeld('a'),'Disconnected pad kept firing');
  for(const k of ['q','t']){let swallowed=false;rt.onKey(key(k,'Key'+k.toUpperCase(),{stopImmediatePropagation(){swallowed=true}}));assert(!swallowed)}
  // Ratios and reserved controls: desktop, portrait and both landscape shapes.
  const view=rt.view, tools=target(view.el,'.rm-tools');target(p,'.rm-pr').rect={left:10000,right:10128};tools.rect={top:8,bottom:52};p.rect={top:566,bottom:838};
  const K=tv.dbg(), canvases=[view.cv0,view.cv1], currentGame=rt.game;let oldDirty=dirty;
  for(const [w,h,res,left,bottom] of [[1366,860,[320,240],8,284],[390,844,[320,240],8,284],[844,390,[320,240],174,8],[667,375,[320,240],174,8],[390,844,[160,144],8,236],[844,390,[320,224],174,8],[390,844,[256,224],8,236]]){
    view.el.clientWidth=w;view.el.clientHeight=h;view.el.css={'--rm-screen-top':'58px','--rm-screen-bottom':bottom+'px','--rm-screen-left':left+'px','--rm-screen-right':left+'px'};view.cv0.width=res[0];view.cv0.height=res[1];p.rect.top=h-bottom+6;
    tv.lockIn(true);const st=view.el.style, sw=parseFloat(st['--lock-width']),sh=parseFloat(st['--lock-height']),x=parseFloat(st['--lock-x']),y=parseFloat(st['--lock-y']);
    assert(Math.abs(sw/sh-res[0]/res[1])<1e-8);assert(x-sw/2>=left-.01&&x+sw/2<=w-left+.01);assert(y-sh/2>=58-.01&&y+sh/2<=h-bottom+.01);assert.equal(tv.dbg(),K);assert.equal(rt.game,currentGame);assert.deepEqual([view.cv0,view.cv1],canvases);
  }
  const queryDirty=dirty;for(let i=0;i<200;i++)assert(tv.lockIn());assert.equal(dirty,queryDirty,'Read-only query dirtied the world');tv.lockIn(false);assert(dirty>oldDirty);
  down(p,1,target(p,'[data-b="a"]'));const madeBefore=made;tv.close();assert(rt.view.background);assert(!rt.isHeld('a'));assert.equal(rt.game,currentGame);assert.equal(tv.dbg(),K);
  tv.open('n64');assert(!rt.view.background);assert.equal(tv.dbg(),K);assert.equal(made,madeBefore,'Q/back restarted the game');
  gp={connected:true,axes:[1,1],buttons:[]};tv.close();assert.equal(rt.stick().x,0,'Background game consumed gamepad aim');tv.open('n64');gp=null;
  // Media replacement clears every source without leaking listeners.
  rt.onKey(key('w','KeyW'));down(p,1,target(p,'[data-b="a"]'));tv.playPhysical('n64.range');assert(rt.isHeld('a'),'Reusing inserted game changed input');
  tv.open('sn');assert.equal(rt.view.con,'sn');assert(!rt.isHeld('a'));assert(!rt.isHeld('moveForward'));assert.equal(rt.pads.size,0);tv.test('sn.zero');rt.startGame();
  const sn=target(rt.view.el,'.rm-pad');for(const b of ['y','x','l','b','a','r','start','select']){down(sn,9,target(sn,`[data-b="${b}"]`));assert(rt.isHeld(b));up(sn,9)}
  for(const id of ['ps.sneak','gb.blocks','md.rings','dc.taxi']){tv.test(id);rt.startGame();assert.equal(rt.pads.size,1);assert.equal(win.listeners.get('pointerup').size,1)}
  tv.close(true);assert.equal(rt.pads.size,0);assert.equal(win.listeners.get('pointerup').size,0);assert(ended>=5);
  // Handheld body and LOCK IN pad use the same cancellation path.
  consoles.gb.away=true;tv.test('gb.blocks');rt.startGame();const gb=target(rt.view.el,'.rm-gbpad');down(gb,1,target(gb,'[data-b="a"]'));up(gb,1,'lostpointercapture');assert(!rt.isHeld('a'));tv.close(true);
  // Hybrid input changes rebuild only the controls, never the running game.
  tv.test('n64.range');rt.startGame();const hybrid=tv.dbg(),hp=target(rt.view.el,'.rm-pad');down(hp,1,target(hp,'[data-b="a"]'));
  ctx.GameInput={touch:false,mode:'keyboard'};doc.fire('game-input-change');assert(!rt.isHeld('a'));assert(hp.hidden);assert.equal(tv.dbg(),hybrid);assert.equal(target(rt.view.el,'.rm-lean').textContent,'Q · BACK');
  rt.onKey(key('w','KeyW'));ctx.GameInput.mode='mouse';doc.fire('game-input-change',{detail:{mode:'mouse',previous:'keyboard'}});assert(rt.isHeld('moveForward'),'Mouse look released held WASD');ctx.GameInput.mode='keyboard';doc.fire('game-input-change',{detail:{mode:'keyboard',previous:'mouse'}});assert(rt.isHeld('moveForward'),'Keyboard/mouse exchange released movement');rt.onKeyUp(key('w','KeyW'));
  ctx.GameInput={touch:true,mode:'touch'};doc.fire('game-input-change');assert(!hp.hidden);assert.equal(tv.dbg(),hybrid);assert.equal(target(rt.view.el,'.rm-lean').textContent,'BACK');assert.equal(target(rt.view.el,'.rm-menu').textContent,'MENU');assert.equal(target(rt.view.el,'.rm-lock').textContent,'LOCK IN');
  ctx.GameInput={touch:false,mode:'gamepad'};doc.fire('game-input-change');assert(hp.hidden);assert.equal(target(rt.view.el,'.rm-menu').textContent,'MENU');delete ctx.GameInput;tv.close(true);
  // A stale completed boot may never start after A -> A reinserted while ready
  // resolves: identity/gid alone are insufficient, hence the boot generation.
  tv.test('n64.range');let resolveOld;rt.view.ready=new Promise(r=>resolveOld=r);for(let n=0;n<18;n++)rt.loop.tick((n+1)*250);assert.equal(rt.view.st,'wait');
  tv.test('n64.range');const newer=rt.view.bootEpoch;rt.view.st='wait';resolveOld(true);await Promise.resolve();assert.equal(rt.view.bootEpoch,newer);assert.equal(rt.view.st,'wait','Stale boot started a newer insertion');tv.close(true);
  console.log('CONSOLE TOUCH UNIT PASS: multitouch, all actions, independent Goldenballs move/aim + menus, cancellation/blur/visibility/resize, aliases/gamepad disconnect, listener cleanup, same-instance Q/LOCK IN, reserved native ratios, console/media switching and stale boot');
})().catch(e=>{console.error(e);process.exitCode=1});
