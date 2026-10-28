// Keyboard alternative to the same physical bed-making gestures used by mouse/touch.
import assert from 'node:assert/strict';
export async function workBed(p,steps){
 await p.evaluate(()=>House.act('bed'));
 await p.waitForFunction(()=>!!document.querySelector('.ch-bed-work'),null,{timeout:60000});
 for(const step of steps){
  await p.keyboard.down('Space');
  await p.waitForFunction(()=>document.querySelector('.ch-bed-note progress')?.value===1,null,{timeout:60000});
  await p.keyboard.up('Space');
  assert(await p.evaluate(step=>ChoreKit.has('bed',step),step),'Bed work not accepted: '+step);
 }
 await p.keyboard.press('q');await p.waitForFunction(()=>!House.focused&&!House.gliding,null,{timeout:60000});
}
