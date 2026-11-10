// Catalogue/subtitle agreement and the recording-friendly reminder forms.
// These ids may receive recordings later; that must not break the regression.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const current=JSON.parse(read('tools/audio/voice-lines.json'));
const manifestPath=path.join(root,'app/public/audio/voice/manifest.json'),manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{};
const requested=new Set(['context.room.hall','context.weather.warm','job.cat.remind.09','job.plant.remind.01','job.bed.remind.01','job.washup.remind.02','job.table.remind.01','job.bins.remind.01','job.cushions.remind.01','job.cat.remind.05'].map(id=>'talk.mom.'+id));
const window={};vm.runInNewContext(read('app/public/js/np-lines.js'),{window});
assert.equal(new Set(current.lines.map(l=>l.id)).size,current.lines.length,'Duplicate catalogue ids');
const byId=new Map(current.lines.map(l=>[l.id,l]));
for(const l of current.lines){
 const canonical=byId.get(window.VoiceLineAliases[l.id])||l;
 assert.equal(window.VoiceLines[l.id][0],canonical.character,l.id+' generated speaker differs');
 assert.equal(window.VoiceLines[l.id][1],String(canonical.line).replace(/\s*\|\s*$/,'').trim(),l.id+' generated subtitle differs');
}
for(const id of requested){const l=current.lines.find(l=>l.id===id);assert(l,'Missing recording id '+id);assert.equal(l.character,'mom');assert.equal(l.tag,'warm');assert.equal(l.dialogue.mood,id==='talk.mom.context.weather.warm'?'cheeky':'neutral');if(manifest[id])assert.equal(manifest[id].character,l.character);}
const text=id=>current.lines.find(l=>l.id==='talk.mom.'+id).line;
assert(!/^(?:the\s+)?hall\b/i.test(text('context.room.hall')),'Ambiguous opening hall');
assert(!/before it starts school/i.test(text('context.weather.warm')),'Ambiguous washing subject');
assert(!/cat tree/i.test(text('job.cat.remind.09')),'Cattery homophone');
assert(!/Gran['’]s/i.test(text('job.plant.remind.01')),'Grand\'s homophone');
for(const suffix of ['bed.remind.01','washup.remind.02','table.remind.01','bins.remind.01','cushions.remind.01','cat.remind.05']){
 const line=current.lines.find(l=>l.id==='talk.mom.job.'+suffix).line;
 assert(line.split(/\s+/).length>=6&&line.split(/\s+/).length<=10,'Reminder length: '+line);assert(!/love[.!?]*$/i.test(line),'Regional-accent trigger remains');
}
console.log('PASS catalogue/subtitle agreement, ten recording ids/directions and natural reminders; future recordings supported');

// Execute the shared production ownership function through call entry, the
// held-prop fade, player hang-up and an absent/returning family member.
const source=read('app/public/js/hs-life.js'),start=source.indexOf('  let playerPhone = false;'),end=source.indexOf('  let ring = null;',start);
assert(start>0&&end>start,'Shared handset ownership function');
const handset={visible:true},mom={present:true,rig:{st:{action:null,walking:false},bones:{p_phone:{scale:{x:0}}}}};
let redraws=0;const c={lounge:()=>({handset}),window:{HouseFamily:{chars:{mom}}},H:{dirty:()=>redraws++}};
vm.createContext(c);vm.runInContext(source.slice(start,end)+';this.sync=syncPhone;this.player=v=>{playerPhone=v;syncPhone()}',c);
c.sync();assert(handset.visible);assert.equal(redraws,0,'Idle ownership causes redundant redraws');
mom.rig.st.action='phone';c.sync();assert(!handset.visible,'Charger copy survives call entry');
mom.rig.bones.p_phone.scale.x=1;c.sync();assert(!handset.visible);
mom.rig.st.action='water';mom.rig.bones.p_phone.scale.x=.1;c.sync();assert(!handset.visible,'Charger returns before the held handset disappears');
mom.rig.bones.p_phone.scale.x=0;c.sync();assert(handset.visible,'Call never returns handset');
c.player(true);assert(!handset.visible);mom.rig.st.action='phone';c.player(false);assert(!handset.visible,'Player hang-up duplicates Mom\'s handset');
mom.present=false;c.sync();assert(handset.visible,'Absent family member retains handset');
mom.present=true;mom.rig.st.walking=true;c.sync();assert(handset.visible,'Walking without a handset empties the charger');
console.log('PASS production handset ownership, held-prop fade, return, player hang-up and absent/walking isolation');

// The ordinary routine must step into the work stance, rather than allowing
// the walking grid to snap its endpoint back away from the water.
const life=read('app/public/js/np-life.js'),planStart=life.indexOf('  function setGoal(c, g) {'),planEnd=life.indexOf('  // where to step off',planStart);
const sink=vm.runInNewContext('('+life.match(/sink: (\{[^\n]+\}),/)[1]+')');
const planner={SPOT:{sink},D2R:Math.PI/180,approachOf:s=>({x:s.approach[0],z:s.approach[1]})};vm.createContext(planner);vm.runInContext(life.slice(planStart,planEnd)+';this.planGoal=setGoal',planner);
const person={x:0,z:100,lvl:'G',seated:null};planner.planGoal(person,{key:'sink',spot:sink});
assert.equal(person.plan.map(p=>p.k).join(','),'route,line,face,act');
assert.equal(person.plan[0].to.z,sink.approach[1]);assert.equal(person.plan[1].to.z,sink.z);
assert.equal(person.plan[1].tolerance,.05,'Working contact stops short of the water');
Object.assign(person,{x:sink.x,z:sink.z});planner.planGoal(person,{key:'sink',spot:sink});
assert.equal(person.plan.map(p=>p.k).join(','),'face,act','Refresh walks away from an already reached work stance');
planner.planGoal(person,{key:'phone',spot:{lvl:'G',x:117,z:611,face:90}});
assert.equal(person.plan.map(p=>p.k).join(','),'line,route,face,act','Leaving work skips the clear approach');
assert(person.plan[0].workContact);assert.equal(person.plan[0].to.z,sink.approach[1]);
Object.assign(person,{x:0,z:100});planner.planGoal(person,{key:'phone',spot:{lvl:'G',x:117,z:611,face:90}});
assert.equal(person.plan.map(p=>p.k).join(','),'route,face,act','Ordinary non-work routes changed');
console.log('PASS production sink approach/final step, restored stance and unchanged ordinary route planning');
