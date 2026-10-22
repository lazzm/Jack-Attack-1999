import assert from 'node:assert/strict';
import{roomFixture}from'./room-fixture.mjs';
const{browser,page:p,errors,until}=await roomFixture(process.argv[2]||'http://localhost:18461');
try{
 await p.evaluate(()=>Apps.load('js/rm-tv.js'));
 for(const [i,gid] of ['dc.taxi','n64.kart','n64.range','dc.taxi','n64.range'].entries()){
  await p.evaluate(gid=>RoomTV.test(gid),gid);await until(()=>RoomTV._dbg()?.st==='game');await p.waitForTimeout(900);
  if(gid==='dc.taxi'||gid==='n64.kart')await p.keyboard.press('Enter');await p.waitForTimeout(250);
  const bindings=await p.evaluate(()=>{const seen=new Set(),out=[];House.scene.traverse(o=>{for(const m of o.material?[].concat(o.material):[]){if(seen.has(m)||!m.map?.userData?.jackLive)continue;seen.add(m);const compiled=House.ren.properties.get(m).uniforms;out.push({bound:compiled?.rmHUD?.value===m.map.userData.hud,currentCanvas:m.map.userData.hud.image===RoomTV.dbg().hud.canvas})}});return out});
  console.log(gid,bindings);await p.keyboard.press('0');assert.equal(await p.locator('.rm-lockin .rm-tvbez').evaluate(el=>getComputedStyle(el,'::after').display),'none','CRT speaker grille leaked over LOCK IN');await p.screenshot({path:`shots/console-switch-${i}-${gid.replace('.','-')}.png`});await p.keyboard.press('0');assert(bindings.length&&bindings.every(b=>b.bound&&b.currentCanvas),'Old console HUD texture is still bound');
  await p.keyboard.press('Backspace');await until(()=>House.mode==='walk');
 }
 assert.deepEqual(errors,[]);console.log('CONSOLE SWITCH HUD PASS: Daydream taxi → Ultra kart → Goldenballs, repeated paused-HUD switches, live shader binding and LOCK IN captures');
}finally{await browser.close()}
