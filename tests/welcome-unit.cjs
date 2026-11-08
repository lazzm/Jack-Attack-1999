'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../app/public/js/hs-life.js'),'utf8');
const code=source.slice(source.lastIndexOf('  const named ='),source.indexOf('  shoutLoop(); ringLoop();'));
function world(S={}){
 const timers=[],lines=[],gate={allowed:false},state={loading:false,first:'Sarah',saves:0};
 const Cast={me:()=>({first:state.first})},H={live:true};
 const w={S,H,Cast,window:{Cast,AccountGate:gate},document:{hidden:false,querySelector:()=>state.loading?{}:null},
  setTimeout:(fn,ms)=>{timers.push({fn,ms});},part:()=> 'day',save:()=>state.saves++,voice:(who,text)=>lines.push({who,text}),
  sessionStorage:{getItem:()=>null}};
 vm.runInNewContext(code,w);
 const next=()=>{assert(timers.length,'Welcome retry missing');timers.shift().fn();};
 return {S,H,state,gate,lines,next,timers,document:w.document};
}
const a=world();a.next();
assert.equal(a.lines.length,0,'Welcome was consumed behind the account/profile loading gate');
assert.equal(a.S.hello,undefined,'A hidden welcome must not be saved as delivered');
a.gate.allowed=true;a.state.loading=true;a.next();assert.equal(a.lines.length,0,'House loading hid the welcome');
a.state.loading=false;a.H.live=false;a.next();assert.equal(a.lines.length,0,'The house is not on show yet');
a.H.live=true;a.document.hidden=true;a.next();assert.equal(a.lines.length,0,'A background tab cannot hear the welcome');
a.document.hidden=false;a.state.first='you';for(let i=0;i<35;i++)a.next();assert.equal(a.lines.length,0,'Wait for the signed-in character name, including a slow profile');
assert(a.timers[0].ms<=500,'Check promptly when the house becomes visible');
a.state.first='Sarah';a.next();assert.equal(a.lines.length,1);assert.match(a.lines[0].text,/\{me\}/);assert.equal(a.S.hello,1);assert.equal(a.state.saves,1);
assert.equal(a.timers.length,0,'Delivered welcomes must not poll or repeat');
const refreshed=world(a.S);refreshed.gate.allowed=true;refreshed.next();assert.equal(refreshed.lines.length,0,'Refresh replayed the welcome');
const life=fs.readFileSync(path.join(__dirname,'../app/public/js/np-life.js'),'utf8');
let saved;
const line=(id,kind)=>({c:{id:'mom'},lineId:id,text:'Hello',context:kind?{kind}:undefined});
const speech={cur:line('welcome','welcome'),q:[line('pending','welcome'),line('ambient')],voice:null};
const store={nowMs:()=>1,simMode:false,chars:[],Date,window:{st:{current:()=>({id:'lad'})}},speech,SKEY:()=> 'save',ls:{set:(_k,v)=>saved=JSON.parse(JSON.stringify(v))}};
vm.createContext(store);vm.runInContext(life.slice(life.indexOf('  let savedAt = 0;'),life.indexOf('  const SPOT_OF =')),store);store.save();
assert.deepEqual(saved.conversation.lines.map(n=>n.line),['pending','ambient'],'An already-shown welcome cannot restart mid-sentence after refresh; an unshown one is retained');
speech.cur=line('conversation');store.save();assert.equal(saved.conversation.lines[0].line,'conversation','Ordinary conversations still resume');
let timer,ticks=0;
const boot={ready:false,H:{live:true},document:{hidden:false},window:{AccountGate:{allowed:true}},speech:{cur:null,q:[line('welcome','welcome')]},speechTick:()=>ticks++,setInterval:fn=>timer=fn};
vm.createContext(boot);const interval=life.indexOf('  setInterval(() => {',life.indexOf('  function kick()'));
vm.runInContext(life.slice(interval,life.indexOf('  // ================================================================ start up',interval)),boot);
timer();assert.equal(ticks,1,'The greeting waited for every family rig to build');
boot.window.AccountGate.allowed=false;timer();assert.equal(ticks,1,'Early speech bypassed the account gate');
boot.window.AccountGate.allowed=true;boot.speech.q=[line('ambient')];timer();assert.equal(ticks,1,'Other speech must keep its normal startup rules');
// Exercise actual speech dispatch with no model and a recording still loading.
let bubble;
const mom={id:'mom',present:false,lvl:'G',room:'kitchen',rig:null};
const pendingVoice={started:false,ended:false};
const dispatch={nowMs:()=>100,speech:{q:[{c:mom,lineId:'welcome',text:'SARAH! Hello!',context:{kind:'welcome'}}],cur:null},
 window:{Sound:{voicesOn:true},st:{voiceBusy:false,voiceText:(_id,text)=>text,voiceInfo:()=>({dur:3}),voiceReady:()=>false,prefetch(){},say:()=>pendingVoice},NPCBubble:{ok:()=>true,show:o=>(bubble=o,{close(){}})}},
 document:{querySelector:s=>s.startsWith('.rm-note')?{}:null,querySelectorAll:()=>[{querySelector:()=>({textContent:'My room'})}]},lineValid:()=>true,
 clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lineMs:()=>3000,H:{W:{lvl:'U'}},label:()=> 'Mom',V3:null,voiceDirection:null,L:{},save(){}};
vm.createContext(dispatch);vm.runInContext(life.slice(life.indexOf('  function speechTick()'),life.indexOf('  // ================================================================ talking (F)')),dispatch);dispatch.speechTick();
assert.equal(dispatch.speech.q.length,0,'Startup instructions or unloaded audio held up the greeting');
assert.equal(bubble.text,'SARAH! Hello!');assert.equal(bubble.voice,null,'Pending audio must not hold the visible name blank');assert.equal(bubble.anchor,null,'Shouting must work before the models exist');
dispatch.speech.cur=null;dispatch.speech.q=[{c:mom,lineId:'ambient',text:'Hello'}];bubble=null;dispatch.speechTick();assert.equal(bubble,null,'Other speech keeps the note busy check');
console.log('WELCOME UNIT PASS: profile/loading/identity gates, prompt delivery before rigs, one welcome, refresh resume rules');
