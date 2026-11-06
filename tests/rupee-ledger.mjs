import assert from 'node:assert/strict';
// Compare complete server snapshots. A total-balance assertion alone confuses
// incidental discovery/achievement rewards with the event under test. Require
// every penny of the difference to have a ledger row, in the correct order.
export function reconcileRupees(before,after,expectedSeason,label){
 assert.equal(before.t,'ecMe');assert.equal(after.t,'ecMe');
 assert.deepEqual(after.log.slice(0,before.log.length),before.log,label+': prior ledger changed or exceeded its retained window');
 const rows=after.log.slice(before.log.length);let balance=before.bal,earned=0,spent=0,season=0;
 for(const row of rows){
  const [at,amount,source,note,recordedBalance]=row;
  assert(Number.isFinite(at)&&Number.isInteger(amount)&&typeof source==='string'&&source.length&&typeof note==='string',label+': malformed money record');
  balance+=amount;assert.equal(recordedBalance,balance,label+': unrecorded balance change before '+source);
  if(amount>0)earned+=amount;else spent-=amount;
  if(source==='season')season+=amount;
 }
 assert.equal(after.bal,balance,label+': balance changed without a server record');
 assert.equal(after.earned-before.earned,earned,label+': earned counter disagrees with ledger');
 assert.equal(after.spent-before.spent,spent,label+': spent counter disagrees with ledger');
 assert.equal(season,expectedSeason,label+': wrong seasonal payment');
 return rows;
}
