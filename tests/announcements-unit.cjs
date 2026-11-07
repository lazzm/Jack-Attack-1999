'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(require('path').join(__dirname,'..','app/public/js/st-voice.js'),'utf8');
const block=src.slice(src.indexOf('  function speakLine('),src.indexOf('  // Account-scoped text/id only:'));
const store={};let delivered=0,accepted=true;
function reload(family=true,nick='one'){
 const w={cueContextValid:()=>true,window:{VoiceLines:{},HouseFamily:family?{enabled:true,speak:()=>{if(accepted)delivered++;return accepted}}:null},account:()=>nick,speakerId:()=> 'dad',lineId:(b,s,t)=>b+'.variant',localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},cueQueue:[],cue:null,info:()=>null,prefetch:()=>{},saveCues:()=>{},pumpCues:()=>{},JSON};vm.createContext(w);vm.runInContext(block+';this.speak=speakLine;',w);return w;
}
reload().speak('bf.tail','Dad','Ash',{once:true});reload().speak('bf.tail','Dad','Ash',{once:true});assert.equal(delivered,1,'completed phase does not replay after a reload');
reload().speak('bf.day','Dad','Day',{once:true});assert.equal(delivered,2,'each phase has its own identity');
reload(true,'two').speak('bf.tail','Dad','Ash',{once:true});assert.equal(delivered,3,'separate account');
accepted=false;const rejected=reload();rejected.speak('bark','Dad','Hi');assert.equal(rejected.cueQueue.length,0,'memory rejection never bypasses through fallback');
const fallback=reload(false);fallback.speak('hw.tail','Dad','Ash',{once:true});assert.equal(fallback.cueQueue.length,1);const after=reload(false);after.speak('hw.tail','Dad','Ash',{once:true});assert.equal(after.cueQueue.length,0,'fallback also remembers announcements');
const life=fs.readFileSync(require('path').join(__dirname,'..','app/public/js/np-life.js'),'utf8');assert(life.includes('speech.cur = null; save();'),'completion immediately clears persisted conversation');assert(life.includes('if (o.prio) speech.q.sort((a, b) => b.prio - a.prio);\n    save();'),'pending lines immediately saved');
console.log('ANNOUNCEMENTS PASS: phases, account isolation, fallback guard, pending/completed saves');
// Execute the production queue serializer: queued/interrupted words survive,
// completed clips do not come back while their visual timer winds down.
const saved={},n={c:{id:'dad'},lineId:'bf.tail.variant',text:'Ash',talk:false,context:{kind:'seasonPhase',event:'bonfire99',phase:'tail'}};
const serial={nowMs:()=>10,simMode:false,chars:[],Date,window:{st:{current:()=>({id:'free'})}},speech:{cur:null,q:[n],voice:null},SKEY:()=> 'save',ls:{set:(k,v)=>saved[k]=JSON.parse(JSON.stringify(v))}};
vm.createContext(serial);vm.runInContext(life.slice(life.indexOf('  let savedAt = 0;'),life.indexOf('  const SPOT_OF =')),serial);
serial.save();assert.equal(saved.save.conversation.lines.length,1,'queued speech saved immediately');assert.equal(saved.save.conversation.lines[0].context.phase,'tail');
serial.speech.q=[];serial.speech.cur=n;serial.save();assert.equal(saved.save.conversation.lines.length,1,'interrupted text-only speech retained');
serial.speech.voice={ended:true};serial.save();assert.equal(saved.save.conversation.lines.length,0,'finished recording omitted');
serial.speech.cur=null;serial.save();assert.equal(saved.save.conversation.lines.length,0,'completed text-only speech omitted');
const contextCode=src.slice(src.indexOf('  function cueContextValid('),src.indexOf('  function speakLine('));
const ctx={window:{Season:{active:()=>[{e:{id:'bonfire99'},phase:'tail'}]},Bonfire:{_:{stageAt:()=> 'finale'}}}};vm.createContext(ctx);vm.runInContext(contextCode,ctx);
assert(ctx.cueContextValid({kind:'seasonPhase',event:'bonfire99',phase:'tail'}));assert(!ctx.cueContextValid({kind:'seasonPhase',event:'bonfire99',phase:'day'}));assert(!ctx.cueContextValid({kind:'bonfireStage',stage:'wheel'}));assert(ctx.cueContextValid({kind:'bonfireStage',stage:'finale'}));
console.log('ANNOUNCEMENT QUEUES PASS: interrupted text/queue retained; completed audio/text omitted; phase/stage revalidation');
const queueWorld={C:{dad:{id:'dad',present:true,said:{'bf.tail.variant':999}}},L:{'bf.tail.variant':['dad','Ash'],'c1.bed.give':['dad','Bed']},lineValid:()=>true,dialogue:()=>({}),nowMs:()=>1000,heardAt:()=>Date.now(),hear:()=>{},member:()=> 'one',ls:{get:()=>1,set:()=>{}},speech:{q:[]},save:()=>{},window:{st:{current:()=>({id:'bed'})}}};vm.createContext(queueWorld);vm.runInContext(life.slice(life.indexOf('  function say(id, lineId, o)'),life.indexOf('  // Where a speaker is')),queueWorld);
assert(!queueWorld.say('dad','bf.tail.variant',{again:true,force:true}),'ordinary duplicate seasonal cue suppressed');
assert(queueWorld.say('dad','bf.tail.variant',{again:true,resume:true,force:true}),'unfinished saved seasonal cue bypasses replay cooldown');
assert(!queueWorld.say('dad','c1.bed.give',{again:true,force:true}),'completed automatic story cue suppressed');
assert(queueWorld.say('dad','c1.bed.give',{again:true,resume:true,force:true}),'unfinished saved story cue resumes despite once key');
console.log('RESUME PASS: pending seasonal and story cues bypass repeat guards without enabling fresh replay');
const restoreCode=life.slice(life.indexOf('  function restore()'),life.indexOf("  addEventListener('pagehide'"));
function restoreQueue(prequeued){const q=prequeued?[{c:{id:'dad'},lineId:'bf.tail.variant'}]:[],out=[];const w={SKEY:()=> 'save',ls:{get:()=>({pv:10,t:Date.now(),c:{},conversation:{step:'free',lines:[{id:'dad',line:'bf.tail.variant',text:'Ash',talk:false},{id:'dad',line:'bf.tail.variant',text:'Ash',talk:false}]}})},clock:()=>({}),chars:[],C:{dad:{id:'dad',present:true}},speech:{cur:null,q},window:{st:{current:()=>({id:'free'})}},say:(id,line,o)=>{out.push(o);q.push({c:{id},lineId:line})},Date};vm.createContext(w);vm.runInContext(restoreCode,w);w.restore();return{q,out}}
assert.equal(restoreQueue(false).q.length,1,'old duplicate saved announcement restored once');assert.equal(restoreQueue(true).out.length,0,'startup cue already queued before restore is not copied again');
console.log('RESTORE DEDUP PASS: existing startup queue and old duplicate saved entries');
