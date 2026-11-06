// Same real F-press matrix as QA5; fresh disposable account and standing pose.
await eval('(async()=>{'+await readFile('tests/qa5-desktop-input.mjs','utf8')+'})()');
await p.evaluate(()=>{window.__qaClock={date:'1999-11-07',hour:10};Object.defineProperty(OwnerTools,'clock',{configurable:true,get:()=>window.__qaClock});OwnerTools.now=()=>new Date(__qaClock.date+'T'+String(auditHour).padStart(2,'0')+':'+String(auditMinute).padStart(2,'0')+':00');dispatchEvent(new Event('ownerclock'));HouseFamily.debug.clock({md:1107,dow:0,t:10});});
await p.evaluate(()=>{Season.evaluate(true);for(const [id,spot]of [['mom','sofaL'],['dad','armchair'],['sister','sofaR']]){HouseFamily.debug.scene(id,spot);HouseFamily.debug.place(id,spot)}HouseFamily.debug.sim(25,.1)});
await log('dialogue-fixture-seats',await p.evaluate(()=>HouseFamily.debug.dump()));
await p.waitForTimeout(1000);
await log('dialogue-fixture-jobs',await p.evaluate(()=>({list:ChoreKit.list(),done:ChoreKit.list().filter(id=>ChoreKit.done(id)),veteran:st.getState()?.flags?.veteran})));
// Place the initial observer in the same lounge approach; conversations and
// subsequent room changes use the original keyboard/mouse drivers.
await aim([100,195,520],[141.6,258,402],'G');await p.evaluate(()=>{for(const id of ['lounge','kitchen']){if(!House.DOORS[id].open)House.setDoor(id,true,true)}}).catch(()=>{});
await log('command','qa5-dialogue.js');
await eval('(async()=>{'+await readFile('tests/qa5-dialogue.mjs','utf8')+'})()');
await p.evaluate(()=>{for(const id of ['mom','dad','sister'])HouseFamily.debug.scene(id,null)});
await eval('(async()=>{'+await readFile('tests/qa5-dialogue-later.mjs','utf8')+'})()');
if(!process.env.QA5_NO_AMBIENT)await eval('(async()=>{'+await readFile('tests/qa5-ambient.mjs','utf8')+'})()');

const attempts=report.events.filter(e=>e.label==='talk-attempt').map(e=>e.data);
await log('DIALOGUE-VALIDATION',{presses:attempts.length,validTargets:attempts.filter(a=>a.pick?.spot==='np.'+a.id).length});
if(attempts.length!==90 || attempts.some(a=>a.pick?.spot!=='np.'+a.id))throw Error('Dialogue matrix missed real F targets; inspect report before comparing counts');
