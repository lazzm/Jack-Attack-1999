// Keep every real F press and post-speech wait; capture the first reply per person
// in later periods. The full morning/seat galleries supply the redundant angles.
const fullMatrixShot=qshot;
globalThis.qshot=async name=>/talk-.*-(7|10)$/.test(name)?log('skipped-redundant-shot',name):fullMatrixShot(name);
await p.evaluate(()=>{auditHour=14;auditMinute=18;__qaClock.hour=14;HouseFamily.debug.clock({md:1107,dow:0,t:14.3});dispatchEvent(new Event('ownerclock'))});await log('time-change-14_3',await p.evaluate(()=>HouseFamily.debug.dump()));await qshot('family-afternoon-transition');await p.waitForTimeout(25000);
for(const id of ['mom','dad'])for(let n=1;n<=10;n++)await talkAttempt(id,n,'14_3');
await nwalk(260,520,40000);for(let n=1;n<=10;n++)await talkAttempt('sister',n,'14_3');
await log('AFTERNOON-MATRIX-COMPLETE',true);
await p.evaluate(()=>{auditHour=19;auditMinute=0;__qaClock.hour=19;HouseFamily.debug.clock({md:1107,dow:0,t:19});dispatchEvent(new Event('ownerclock'))});await log('time-change-19',await p.evaluate(()=>HouseFamily.debug.dump()));await qshot('family-evening-transition');await p.waitForTimeout(25000);await nwalk(100,520,40000);
for(let n=1;n<=10;n++)for(const id of ['mom','dad','sister'])await talkAttempt(id,n,'19pm');
await log('EVENING-MATRIX-COMPLETE',true);
// R215's multi-angle gallery is handled separately by qa5-art-grip.mjs.
