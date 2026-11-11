'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('path').join(__dirname,'..','app/public/js/np-life.js'),'utf8'),voice=JSON.parse(fs.readFileSync(require('path').join(__dirname,'..','tools/audio/voice-lines.json'),'utf8'));
const compiled={window:{}};vm.createContext(compiled);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','app/public/js/np-lines.js'),'utf8'),compiled);
const data=compiled.window.NPCDialogue,L=compiled.window.NPCLines;
assert(data,'generated browser catalogue must export dialogue conditions');
assert.deepEqual(JSON.parse(JSON.stringify(data)),Object.fromEntries(voice.lines.filter(l=>l.dialogue).map(l=>[l.id,{speaker:l.character,...l.dialogue}])),'generated conditions match the authored data');
let clk={md:1107,dow:0,t:10},now=1e12;const memory={};
const c={id:'dad',room:'lounge',goal:{act:'paper'},seated:true};
const w={mk:()=>({school:true}),window:{NPCDialogue:data,ChoreKit:{avail:()=>true,list:()=>['cat'],done:()=>false},st:{getState:()=>({ch:2,flags:{veteran:true}}),current:()=>({id:'free'})}},L,clock:()=>clk,heardAt:id=>memory[id]||0,heardMap:()=>memory,hear:id=>memory[id]=now,Date:class extends Date {static now(){return now}},Math,H:{mode:'walk',here:'lounge'},player:()=>({}),speech:{q:[]},C:{},nowMs:()=>0};
vm.createContext(w);
const freshest=source.slice(source.indexOf('  function freshest('),source.indexOf('  // ================================================================ the 1999 clock'));
const helpers=source.slice(source.indexOf('  function pick('),source.indexOf('  const eyes ='));
const pools=source.slice(source.indexOf('  function barkPool('),source.indexOf('  let barkAt'));
vm.runInContext(freshest+helpers+pools+';this.api={pick,dialogueFits,dialoguePool,jobReply,lineValid,barkPool};',w);
for(const person of ['mom','dad','sister'])for(const [time,period]of [[10,'morning'],[14.3,'afternoon'],[19,'evening']]){
 c.id=person;clk.t=time;
 const ids=Object.entries(data).filter(([id,d])=>d.speaker===person&&d.kind==='talk'&&d.when.period===period).map(([id])=>id);
 assert.equal(ids.length,12,person+' '+period+' has twelve new lines');assert(ids.every(id=>w.api.dialogueFits(c,data[id].when)));
 const seen=[];for(let i=0;i<10;i++){const id=w.api.pick(w.api.barkPool(c,clk,true),c);assert(id);seen.push(id);memory[id]=now;now+=10000;}assert.equal(new Set(seen).size,10,person+' '+period+' has ten fresh responses');
}
Object.keys(memory).forEach(id=>delete memory[id]);c.id='mom';clk.t=10;let replies=[];for(let i=0;i<30;i++){clk.t=i<10?10:i<20?14.3:19;const id=w.api.jobReply(c,'cat')[0];assert(id,'cat reply '+i);replies.push(id);memory[id]=now;now+=10000;}assert.equal(new Set(replies).size,30,'thirty job conversations without repetition');assert(data[replies[0]].kind==='give');assert(replies.slice(1).every(id=>data[id]?.kind!=='give'),'later questions use reminders or chat');
assert.equal(w.api.lineValid(c,'anything','text',{kind:'choreNag',pc:true}),false,'PC nag invalid standing');w.H.mode='monitor';assert(w.api.lineValid(c,'anything','text',{kind:'choreNag',pc:true}));
for(const md of [115,415,715,1015]){clk.md=md;assert.equal(['winter','spring','summer','autumn'].filter(season=>w.api.dialogueFits(c,{season})).length,1)}
clk.md=1107;clk.t=19;assert(!w.api.lineValid(c,'talk.mom.morning.01','text'),'queued morning line expires in evening');
const p=['talk.dad.morning.01','talk.dad.morning.02'];p.forEach(id=>memory[id]=now);assert.equal(w.api.pick(p,c),undefined,'exhausted pools request acknowledgement');
assert(Object.values(data).every(d=>Object.keys(d.when).every(k=>['period','dow','room','weather','season','jobDone','console','chapter','job'].includes(k))));
console.log('DIALOGUE POOLS PASS: 12 x 3 x 3; ten fresh each; thirty cat replies; conditions; exhausted acknowledgement');

for(const md of [115,215,315,415,515,615,715,815,915,1015,1115,1215])for(let dow=0;dow<7;dow++)for(const time of [9,14,19])for(const person of ['mom','dad','sister']){
 clk={md,dow,t:time};c.id=person;assert(w.api.dialoguePool(c).length>=12,person+' year-round '+md+'/'+dow+'/'+time);
}
for(const job of ['tidy','bed','bin','cat','plant','washup','table','shopping','bins','hoover','videos','cushions','car','lawn','sweep']){
 const entries=Object.values(data).filter(d=>d.when.job===job);assert(entries.filter(d=>d.kind==='give').length>=2,job+' instructions');assert(entries.filter(d=>d.kind==='remind').length>=3,job+' reminders');
}
console.log('YEAR-ROUND PASS: 756 month/day/period/person pools and fifteen job instruction/reminder flows');

const filterStart=source.indexOf('    const fresh = lines.filter('),filterEnd=source.indexOf('    if (!fresh.length)',filterStart);
const safe={lines:[undefined],c:{said:{}},nowMs:()=>0,heardAt:()=>0,Date};vm.createContext(safe);vm.runInContext(source.slice(filterStart,filterEnd)+';this.result=fresh;',safe);assert.equal(safe.result.length,0,'empty pool cannot admit undefined as a fresh line');
console.log('GENERATED DATA / EMPTY POOL PASS');
clk={md:1107,dow:0,t:10};
for(const [forecast,expected]of [['Cold and frosty','cold'],['Sunshine and showers','wet'],['Mostly dry and warm','warm']]){
 w.window.TTXData={weather:Array(12).fill(forecast)};for(const weather of ['cold','wet','warm'])assert.equal(w.api.dialogueFits(c,{weather}),weather===expected,'forecast '+forecast);
}
w.window.PM={owns:id=>id==='hardware.n64'};assert(w.api.dialogueFits(c,{console:'n64'}));assert(!w.api.dialogueFits(c,{console:'ps'}));
w.window.ChoreKit.done=id=>id==='cat';assert(w.api.dialogueFits(c,{jobDone:'cat'}));assert(!w.api.dialogueFits(c,{job:'cat'}),'completed job cannot get an unfinished-job instruction');
w.window.st.getState=()=>({ch:1,flags:{}});assert(w.api.dialogueFits(c,{chapter:1}));assert(!w.api.dialogueFits(c,{chapter:2}));
w.window.st.getState=()=>({ch:2,flags:{}});assert(w.api.dialogueFits(c,{chapter:2}));assert(!w.api.dialogueFits(c,{chapter:1}));
console.log('CONTEXT STATE PASS: forecast, owned hardware, finished jobs, story chapter');

clk={md:1107,dow:0,t:1};assert(!w.api.dialogueFits(c,{period:'morning'}),'midnight conversations must not use morning greetings');
