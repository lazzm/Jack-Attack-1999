// An asynchronous, deliberate release can arrive after a focus return finishes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const world=fs.readFileSync(process.argv[2]||require.resolve('../app/public/js/hs-world.js'),'utf8'),pause=fs.readFileSync(process.argv[3]||require.resolve('../app/public/js/hs-pause.js'),'utf8');
const listeners=[],cv={classList:{contains:n=>n==='hs-gl'}},classes={toggle(){},add(){},remove(){}};
const c={cv,document:{pointerLockElement:cv,hidden:false,hasFocus:()=>true,addEventListener:(name,fn)=>listeners.push(fn),exitPointerLock(){this.pointerLockElement=null}},H:{mode:'walk',_:{focusS:null}},el:{open:false},ui:{el:{classList:classes,contains:()=>true},tip(){}},lockHint:{classList:classes},PT:{clear(){}},lockPending:false,lockHintT:0,clearTimeout(){},setTimeout(){return 1},keys:{},vw:100,vh:100,setHot(){},hoverQ:true,lastPt:null};
c.inRoom=()=>c.H.mode==='walk';c.openMenu=()=>{c.el.open=true};vm.createContext(c);
const take=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
vm.runInContext(take(world,'  const locked =','  const lockHint =')+take(world,"  document.addEventListener('pointerlockchange'","  pb.addEventListener('pointermove'"),c);
vm.runInContext(take(pause,' let owned=false;',' window.HousePause='),c);
const change=()=>{const ev={};for(const fn of listeners)fn(ev);return ev};
change();c.H.mode='focus';vm.runInContext('unlock()',c);c.H.mode='walk';change();assert.equal(c.el.open,false,'A delayed deliberate release opened pause and hid the carry ghost');
c.document.pointerLockElement=cv;change();c.document.pointerLockElement=null;change();assert.equal(c.el.open,true,'A genuine browser Esc release must still open the menu');
// An acquire event may overtake an old release; its flag must not suppress a
// later genuine Escape on the newly acquired lock.
c.el.open=false;c.document.pointerLockElement=cv;change();vm.runInContext('unlock()',c);c.document.pointerLockElement=cv;change();c.document.pointerLockElement=null;change();assert.equal(c.el.open,true,'A stale release flag swallowed the next Esc');
console.log('POINTER RELEASE PASS: delayed focus release does not pause walking; genuine Esc still pauses');
