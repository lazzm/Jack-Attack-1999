// Keyboard alternative to the same physical bed-making gestures used by mouse/touch.
import assert from 'node:assert/strict';
export async function workBed(p,steps){
 // Poll with evaluate: deferred waitForFunction compiles its predicate through
 // eval, which the real site's script-src 'self' policy correctly rejects.
 async function until(fn){const end=Date.now()+90000*Math.max(1,+process.env.STORY_SCALE||1);while(Date.now()<end){if(await p.evaluate(fn))return;await p.waitForTimeout(150)}throw Error('Timed out waiting for bed work: '+fn)}
 await p.evaluate(()=>House.act('bed'));
 await until(()=>!!document.querySelector('.ch-bed-work'));
 for(const step of steps){
  await p.keyboard.down('Space');
  try{await until(()=>document.querySelector('.ch-bed-note progress')?.value===1)}finally{await p.keyboard.up('Space')}
  assert(await p.evaluate(step=>ChoreKit.has('bed',step),step),'Bed work not accepted: '+step);
 }
 await p.keyboard.press('q');await until(()=>!House.focused&&!House.gliding);
}
