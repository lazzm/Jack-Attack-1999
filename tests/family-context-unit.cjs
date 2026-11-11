'use strict';
// R243-R246: family lines fit the moment and topics take turns, through the shared line memory.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const js=f=>fs.readFileSync(path.join(__dirname,'..','app/public/js',f),'utf8');
const source=js('np-life.js');
const compiled={window:{}};vm.createContext(compiled);vm.runInContext(js('np-lines.js'),compiled);
const data=compiled.window.NPCDialogue,L=compiled.window.NPCLines;
let clk={md:1113,dow:6,t:9.67},now=1e12;const memory={};
const C={mom:{id:'mom',present:true,lvl:'G',x:0,z:0,hold:0},dad:{id:'dad'},sister:{id:'sister'}};
const at={x:2000,z:0,lvl:'G'};
const w={mk:()=>({school:false}),window:{NPCDialogue:data,TTXData:{weather:Array(12).fill('Sunshine and showers')},ChoreKit:{avail:()=>true,list:()=>['plant'],done:()=>false,has:()=>false},st:{getState:()=>({ch:2,flags:{veteran:true}}),current:()=>({id:'free'})},PM:{owns:()=>true}},
 L,clock:()=>clk,heardAt:id=>memory[id]||0,heardMap:()=>memory,hear:id=>memory[id]=now,Date:class extends Date{static now(){return now}},Math,H:{mode:'walk',here:'kitchen'},
 player:()=>at,speech:{q:[]},C,nowMs:()=>now,ls:{get:()=>null},member:()=>'',sameFloor:(a,b)=>a.lvl===b.lvl,dist:(a,b)=>Math.hypot(a.x-b.x,a.z-b.z)};
vm.createContext(w);
const slice=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i);assert(i>=0&&j>i,'slice '+a);return source.slice(i,j)};
vm.runInContext(slice('  function freshest(','  // ================================================================ the 1999 clock')+slice('  function pick(','  const eyes =')+slice('  function barkPool(','  let barkAt')+';this.api={pick,jobReply,lineValid,barkPool,topicOf};',w);
const say=(c,id)=>{assert(id,'a line for '+c.id);memory[id]=now;now+=15000;return id};

// R246: never more than two lines about the same job in a row, and still no repeated line.
const mom={id:'mom',room:'kitchen',goal:{act:'washup'},said:{}};
const replies=[];for(let i=0;i<12;i++)replies.push(say(mom,w.api.jobReply(mom,'plant')[0]));
let run=0,worst=0;for(const id of replies){run=w.api.topicOf(id)==='job.plant'?run+1:0;worst=Math.max(worst,run)}
assert(worst<=2,'more than two plant replies in a row: '+replies.join(', '));
assert.equal(new Set(replies).size,replies.length,'a job conversation repeated a line');
assert(replies.filter(id=>w.api.topicOf(id)==='job.plant').length>=4,'the job still gets its give and three reminders');

// R246: the forecast (and the consoles) are family topics: once one person has raised it, the others wait.
Object.keys(memory).forEach(k=>delete memory[k]);
const weather=Object.keys(data).filter(id=>data[id].when.weather==='wet');assert(weather.length>=3);
const family=['mom','dad','sister'].map(id=>({id,room:'kitchen',goal:{},said:{}}));
let raised=0;for(let round=0;round<8;round++)for(const c of family){const id=say(c,w.api.pick(w.api.barkPool(c,clk,true),c));if(w.api.topicOf(id)==='weather')raised++}
assert(raised<=1,'the forecast came up '+raised+' times in one short morning');
const consoles=[];Object.keys(memory).forEach(k=>delete memory[k]);clk={md:1111,dow:4,t:19.5};
const sis={id:'sister',room:'lounge',goal:{act:'telly'},said:{},seated:true};
const order=[];for(let i=0;i<20;i++){const id=say(sis,w.api.pick(w.api.barkPool(sis,clk,true),sis));order.push(id);if(w.api.topicOf(id)==='console')consoles.push(i)}
// A topic only comes back once everything else fresh has been said (an empty pool falls back rather than going quiet).
assert(consoles.length<=2&&(consoles.length<2||consoles[1]-consoles[0]>=15),'consoles came up at replies '+consoles.join(', ')+': '+order.join(' '));

// R244: "Who's been using my chair? It's still warm." never while Dad is sitting in it.
const dad={id:'dad',room:'lounge',goal:{spotKey:'armchair',act:'telly'},cur:{k:'act'},seated:{},said:{}};
assert(!w.api.barkPool(dad,clk,true).includes('bark.dad.mess2'),'chair line offered while Dad sits in his chair');
assert(!w.api.lineValid(dad,'bark.dad.mess2','text'),'a queued chair line must not be delivered once he is seated');
assert(w.api.barkPool({id:'dad',room:'hall',goal:{},said:{}},clk,true).includes('bark.dad.mess1'),'the hall lines are still offered');
Object.assign(dad,{seated:null,cur:{k:'route'}});assert(w.api.barkPool(dad,clk,true).includes('bark.dad.mess2'),'the chair line still belongs to walking up to his chair');

// R245: no shouted chore nag at a player standing beside Mom, or straight after a chat.
const nag={kind:'choreNag'};
Object.assign(at,{x:40,z:0});assert(!w.api.lineValid(C.mom,'chore.say','text',nag),'nag shouted at a player beside Mom');
Object.assign(at,{x:2000,z:0});C.mom.talkedAt=now-20000;assert(!w.api.lineValid(C.mom,'chore.say','text',nag),'nag straight after a warm reply');
C.mom.talkedAt=now-600000;assert(w.api.lineValid(C.mom,'chore.say','text',nag),'a nag from across the house still works');

// R243: before dawn a new player hears one night call from Mom, never the kettle/"coming down" welcome.
const life=js('hs-life.js'),hello=life.slice(life.lastIndexOf('  const named ='),life.indexOf('  shoutLoop(); ringLoop();'));
function welcome(t,first){const lines=[],timers=[];const ctx={S:{},H:{live:true},window:{Cast:{me:()=>({first:'Simon'})},AccountGate:{allowed:true},st:{getState:()=>({flags:{veteran:!first},done:{}}),current:()=>({id:'lad'})}},document:{hidden:false,querySelector:()=>null},setTimeout:fn=>timers.push(fn),part:()=>t<6.5?'night':'day',now99:()=>({t}),save(){},voice:(who,text)=>lines.push(text)};ctx.Cast=ctx.window.Cast;vm.runInNewContext(hello,ctx);timers.shift()();return lines}
assert.deepEqual(welcome(5.8,true),[],'a new player before dawn got a second, contradicting welcome');
for(const t of [5.8,23])assert(!/kettle|coming down/i.test(welcome(t,false)[0]),'kettle welcome at '+t);
assert.match(welcome(9,true)[0],/kettle/,'the daytime welcome is unchanged');
const call=source.slice(source.indexOf('  function openingCall()'),source.indexOf('  function storyDirectives()'));
for(const [t,ok]of [[5.8,/Still awake/],[23,/Still awake/],[9,null]]){const said=[];vm.runInNewContext(call+';openingCall();',{window:{st:{getState:()=>({flags:{},done:{}}),current:()=>({id:'lad'})}},storyOn:()=>true,firstBeat:()=>true,clock:()=>({t}),say:(who,id,o)=>said.push(o.text||id)});if(ok)assert.match(said[0],ok);else assert.equal(said[0],'c1.wake.mom.call')}
console.log('FAMILY CONTEXT UNIT PASS: job topics take turns, family-wide weather/console cooldown, chair line, quiet nag, one night arrival band');
