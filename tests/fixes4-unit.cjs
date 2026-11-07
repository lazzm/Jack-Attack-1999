'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=name=>fs.readFileSync(path.join(__dirname,'../app/public/js/',name),'utf8');
const house=source('hs-house.js');
const prep=house.slice(house.indexOf('    r.preparePose = p => {'),house.indexOf('    apply(parked.present);',house.indexOf('    r.preparePose = p => {')));
let clear=true;const applied=[];
const context={r:{},carBlock:{x0:400,x1:600,z0:862,z1:1272},parked:{present:true},window:{HouseFamily:{carAway:false}},H:{STAND:158,LV:{G:353},_:{floorAt:()=>clear}},apply:present=>{context.parked.present=present;applied.push(present)}};
vm.createContext(context);vm.runInContext(prep,context);
context.r.preparePose({lvl:'G',x:500,y:195,z:839.798});
assert.equal(context.parked.present,true,'Valid saved boot approach must keep the parked car');
context.parked.present=false;context.r.preparePose({lvl:'G',x:500,y:195,z:839.798});
assert.equal(context.parked.present,true,'An old stuck save must recover without movement');
clear=false;context.r.preparePose({lvl:'G',x:500,y:195,z:1000});assert.equal(context.parked.present,false,'A returning car must not spawn through an occupied saved pose');
clear=true;context.parked.present=true;context.window.HouseFamily.carAway=true;context.r.preparePose({lvl:'G',x:500,y:195,z:839.798});assert.equal(context.parked.present,false,'Keep a veteran workday car away before pose restoration');
console.log('PASS R193: valid boot clearance, old stuck save, genuinely occupied bay');

const life=source('np-life.js'), home=life.slice(life.indexOf('  function storyHome()'),life.indexOf('  async function start()'));
const carGetter=life.slice(life.indexOf('    get carAway()'),life.indexOf('    present: id =>'));
const presence={window:{},C:{dad:{present:false}},clock:()=>({}),scheduled:()=>({raw:'away:work'}),storyDirectives:()=>({}),manual:{},sceneDbg:{}};
vm.createContext(presence);const car=vm.runInContext('({'+carGetter+'})',presence);
assert.equal(car.carAway,false,'Wait for authoritative account state');
presence.window.StorySnapshot={ch:1,flags:{},done:{bin:1}};assert.equal(car.carAway,false,'Early story snapshot keeps Dad and his PC parts home');
presence.window.StorySnapshot={ch:6,flags:{veteran:true},done:{bin:1}};assert.equal(car.carAway,true,'Early veteran snapshot retains the normal workday absence');
presence.C.dad.present=true;assert.equal(car.carAway,false,'Present Dad keeps his car home');
let savedDay=0,story={ch:1,flags:{},done:{bin:1}};
const family={window:{st:{getState:()=>story}},clock:()=>({md:1103}),dadHomeDay:()=>savedDay,ls:{set:(k,v)=>{assert.equal(k,'jhp_np_dadhome');savedDay=v}}};
vm.createContext(family);vm.runInContext(home,family);family.storyHome();assert.equal(savedDay,1103,'Resumed parts stage must establish Dad home without replaying arrival speech');
savedDay=0;story={ch:1,flags:{},done:{}};family.storyHome();assert.equal(savedDay,0,'Do not keep Dad home before his story arrival');
story={ch:6,flags:{veteran:true},done:{bin:1}};family.storyHome();assert.equal(savedDay,0,'Leave veteran work routines alone');
const startCode=life.slice(life.indexOf('  async function start()'),life.indexOf('  function boot()'));
const order=[],startup={ready:false,chars:[],directives:{},manual:{},lastStep:null,H:{ROOMS:{},on(){},dirty(){}},NV:{rebuild(){}},window:{Room:{ensureHouse:async()=>{}},st:{onChange(){},current:()=>({id:'part.tower'})}},setTimeout:fn=>fn(),storyHome:()=>order.push('home'),storyDirectives:()=>({dad:{key:'story.dadcar'}}),restore:()=>{assert.equal(startup.directives.dad.key,'story.dadcar');order.push('restore')},placeRig(){},kick(){},still:()=>true,firstBeat:()=>false,addEventListener(){},onGrab(){},nowMs:()=>0};
vm.createContext(startup);vm.runInContext(startCode,startup);
const bark=life.slice(life.indexOf('  function barkPool('),life.indexOf('  let barkAt ='));
const barks={mk:()=>({school:true}),dialoguePool:()=>[],player:()=>({}),H:{here:'lounge',mode:'walk'},window:{}};vm.createContext(barks);vm.runInContext(bark,barks);
for(const seated of [true,false])for(const talking of [true,false]){
 const pool=barks.barkPool({id:'sister',room:'lounge',goal:{act:'telly'},seated},{t:16,dow:3,school:true},talking);
 assert.equal(pool.includes('bark.sis.react.peek'),!seated,'Standing-only recording selected with seated='+seated);assert(pool.includes('bark.sis.react.drawing'));
}
console.log('PASS R199: seated idle/conversation pools exclude standing line; standing keeps recording');
const bonfire=source('season-bonfire.js'),talk=bonfire.slice(bonfire.indexOf('  function displayEvening()'),bonfire.indexOf("  SE.on('state', sync)"));
let hour=7.5;const lines=[],season={window:{},showStart:()=>0,stageAt:()=>null,phase:'lead',enabled:()=>true,SE:{today:()=>({hour})},done:()=>false,say:(id,who,text)=>lines.push({id,who,text}),catchup:()=>false,startDisplay:()=>lines.push({display:true})};
vm.createContext(season);vm.runInContext(talk,season);
for(const [phase,time,tonight]of[['lead',7.5,false],['lead',19,false],['day',7.5,false],['day',17,true],['day',21.9,true]]){
 season.phase=phase;hour=time;lines.length=0;season.talk('mom');assert.equal(/tonight/i.test(lines[0].text),tonight);assert.equal(lines[0].id,tonight?'mom.talk':'mom.talk.prep');
 for(const id of ['dad','sister']){lines.length=0;season.talk(id);assert(!/tonight/i.test(lines[0].text));}
}
season.phase='day';hour=22;lines.length=0;season.talk('mom');assert.equal(lines[0].id,'mom.talk.late');assert(!/tonight|ready for/i.test(lines[0].text));
season.phase='tail';hour=7.5;lines.length=0;assert.equal(season.talk('mom'),false);assert.equal(season.talk('sister'),false);season.talk('dad');assert(!/tonight/i.test(lines[0].text));
season.EID='bonfire99';season.catHome=false;season.H={here:'bedroom',focused:false,held:()=>null};season.SE.step=()=>{};
vm.runInContext(bonfire.slice(bonfire.indexOf('  function petCheck()'),bonfire.indexOf('  function syncCat()')),season);
const gloveLine=bonfire.split('\n').find(l=>l.includes("return displayEvening() ? say('gloves.wait'"));vm.runInContext('this.gloves=()=>{'+gloveLine+'}',season);
for(const [phase,time,evening]of[['lead',19,false],['day',8,false],['day',19,true]]){
 season.phase=phase;hour=time;
 for(const method of ['petCheck','gloves']){lines.length=0;season[method]();assert.equal(/tonight/i.test(lines[0].text),evening);assert.equal(lines[0].id.endsWith('.prep'),!evening);}
}
season.window={st:{lineId:base=>base},HouseFamily:{heardAt:()=>Date.now()}};season.phase='lead';lines.length=0;assert.equal(season.talk('dad'),false);assert.equal(lines.length,0,'Heard seasonal reply yields to ordinary fresh Talk');season.window={};
console.log('PASS R194: preparation/day/evening/after-date family wording; original evening clip ID retained');
startup.start().then(()=>{assert.deepEqual(order,['home','restore']);console.log('PASS R193: story home/directives precede family restore')}).catch(e=>{console.error(e);process.exitCode=1});
