// Story integration through existing public gameplay APIs, real chore timing and real sockets.
// Accepts only a disposable localhost server; never seeds or edits another mod's state.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base = process.argv[2] || 'http://localhost:18099';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const shots = fileURLToPath(new URL('shots/story/', import.meta.url)); await mkdir(shots, {recursive:true});
const account = 'Story' + Date.now().toString(36), password = 'Temporary-1999';
const {browser, page:p, errors, until, view} = await roomFixture(base, {account, password});
const shot = name => p.screenshot({path:shots + name + '.png'});
async function wait(page, fn, arg, timeout=30000) {
  const end=Date.now()+timeout;
  while(Date.now()<end){if(await page.evaluate(fn,arg))return;await page.waitForTimeout(150)}
  throw Error('State timeout: '+String(fn));
}
async function aim(eye, target, level='U') { await view(eye, target, {level}); await p.evaluate(() => {House.hush(); House._.setMode('walk')}); }
async function waitStep(id) { await wait(p,id => !!st.getState()?.done[id],id,20000); }
async function dropIn(id, snap) {
  const s = await p.evaluate(snap => {const s=House.SNAPS[snap];return {x:s.x,y:s.y,z:s.z,room:s.room}}, snap);
  await aim([s.x,s.y-35,s.z+55], [s.x,s.y,s.z], s.room==='kitchen'?'G':'U');
  assert(await p.evaluate(id => House.grab(id), id), 'Could not carry ' + id);
  await p.keyboard.press('e');
  await wait(p,id => !House.held() && ['snap','rest'].includes(House.THINGS[id].st),id);
}
try {
  await until(() => !!st.getState() && !!House.THINGS['st.diary']);
  assert.equal(await p.evaluate(() => st.current().id), 'lad');
  await aim([60,-55,150], [20,-5,0]);
  await p.locator('.st-objective').waitFor({state:'visible'}); await shot('01-objective');
  await aim([-105,-32,56], [-61,-1,-12]); await shot('02-diary-prop');
  await aim([-25,-40,55], [-61,-1,-12]); await shot('03-diary-prop-side');
  // Use F on the actual carried prop, then exercise the shared reader and page controls.
  await p.evaluate(() => House.grab('st.diary')); await p.keyboard.press('f');
  await until(() => Magazines.reading?.id==='st.diary' && Magazines.reading.phase==='pages');
  await shot('04-diary-open'); assert(!await p.locator('.st-objective').isVisible());
  await p.locator('[data-turn="1"]').click(); await until(() => !Magazines.reading.flipping); await shot('05-diary-goals');
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('Escape'); assert(await p.evaluate(() => HousePause.open));
  await p.keyboard.press('Escape'); await p.keyboard.press('q'); await p.evaluate(() => House.putBack());
  assert.equal(await p.evaluate(() => House.THINGS['st.diary'].obj.children.length>4), true);
  // Play the existing owned cartridge. No stEvent packets are fabricated by this test.
  await p.evaluate(() => {House._.setMode('walk');House.interact('gb')});
  await until(() => window.RoomTV?.open_);
  await p.evaluate(() => RoomTV.playPhysical('gb.blocks'));
  await until(() => RoomTV._dbg()?.st==='game'); await p.keyboard.press('Enter'); await p.keyboard.press('ArrowLeft');
  await waitStep('lad'); assert(!await p.locator('.st-objective').isVisible());
  await p.keyboard.press('q'); await until(() => House.mode==='walk'&&!House.gliding);
  // Save standing, reload halfway through Chapter 1, retain the authoritative tick and pose.
  await aim([40,-55,180], [40,-55,-20]); await p.evaluate(() => House.saveWalkState());
  const pose = await p.evaluate(() => ({x:House.W.x,z:House.W.z,off:localStorage.getItem('jhp_off')}));
  await p.reload({waitUntil:'domcontentloaded'});
  await until(() => window.House?.live&&window.st?.getState()?.done.lad&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
  assert.equal(await p.evaluate(() => House.mode), 'walk');
  const resumed = await p.evaluate(() => ({x:House.W.x,z:House.W.z,off:localStorage.getItem('jhp_off')}));
  assert.deepEqual(resumed, pose); await shot('06-progress-refresh');
  await p.evaluate(async () => {await Room.ensureHouse();await Chores.load();await Chores.part('bedroom');House.buildRoom(House.ROOMS.kitchen);await Chores.part('kitchen')});
  await until(() => !!House.SNAPS['ch.s.sink'] && !!House.THINGS['ch.pillow']);
  const mess = await p.evaluate(() => ChoreCat.tidyFor(ChoreKit.day(),true));
  await p.evaluate(() => ChoreKit.begin('tidy'));
  for (const m of mess) {
    await dropIn('ch.m.'+m.id, {clothes:'ch.s.basket',rubbish:'ch.s.bin',dish:'ch.s.sink'}[m.kind]);
    await p.waitForTimeout(2400);
  }
  await waitStep('tidy'); console.log('Ch1: real tidy accepted');
  await p.evaluate(() => ChoreKit.begin('bed')); await p.waitForTimeout(1200);
  await dropIn('ch.pillow','ch.s.pillow'); await p.waitForTimeout(1300);
  await dropIn('ch.pjs','ch.s.pjs'); await p.waitForTimeout(1300);
  for(let i=0;i<3;i++){await p.evaluate(() => House.act('bed'));await p.waitForTimeout(1400)}
  await waitStep('bed'); console.log('Ch1: real bed accepted');
  await p.evaluate(() => House.act('ch.binbag')); await until(() => ChoreKit.has('bin','tie'));
  await p.waitForTimeout(5500); await dropIn('ch.binbag','ch.s.kbin');
  await waitStep('bin'); await waitStep('downstairs'); console.log('Ch1: real bin/downstairs accepted');
  await aim([40,-55,155], [-15,-24,0]); await p.keyboard.press('f');
  await until(() => House.mode==='monitor'&&!House.gliding&&DesktopSurface.ready()); await waitStep('pc');
  await p.evaluate(() => IE.navigate('http://www.pixelpost.jnet/')); await waitStep('pixelpost');
  assert.equal(await p.evaluate(() => st.current().id), 'plan');
  await p.keyboard.press('q'); await until(() => House.mode==='walk'&&!House.gliding);
  await p.evaluate(() => {House.grab('st.diary');House.interact('st.diary')});
  await waitStep('plan'); assert.equal(await p.evaluate(() => st.getState().ch), 2);
  await shot('07-chapter-two');
  await p.keyboard.press('q'); await p.evaluate(() => House.putBack());
  await p.waitForTimeout(2800); await p.evaluate(() => House.hush()); await shot('08-saving-objective');
  assert.equal(await p.evaluate(() => st.getState().trust), 3);
  // All future pages remain legible; resize reuses the shared reader's single-page mode.
  await p.evaluate(() => House.interact('st.diary')); await until(() => !!Magazines.reading);
  await p.locator('[data-turn="1"]').click(); await until(() => !Magazines.reading.flipping); await shot('09-chapter-two-goals');
  await p.locator('[data-turn="1"]').click(); await until(() => !Magazines.reading.flipping); await shot('09b-next-chapters');
  await p.setViewportSize({width:1024,height:768}); await p.waitForTimeout(750); await shot('10-diary-1024');
  await p.setViewportSize({width:1366,height:860});
  await p.evaluate(() => House.saveWalkState());
  console.log('Diary refresh source',await p.evaluate(() => ({mode:House.mode,stood:House.stood,stand:localStorage.getItem('jhp_hs_stand'),reading:localStorage.getItem('jhp_reading_active'),seat:sessionStorage.getItem('jhp_login_seat')})));
  const storageState = await p.context().storageState();
  await p.reload({waitUntil:'domcontentloaded'}); await wait(p,() => window.Magazines?.reading?.id==='st.diary'&&!!st.getState(),null,60000);
  assert.equal(await p.evaluate(() => st.getState().ch), 2); await shot('11-diary-refresh');
  await p.keyboard.press('q'); await p.evaluate(() => House.putBack());
  if (errors.length) console.log('Desktop errors retained for the final assertion:',errors);
  // Mobile must not build the prop/house or rewrite a desktop pose or PC power state.
  const mobile = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',storageState});
  const mp = await mobile.newPage(); mp.on('pageerror',e=>errors.push(e.message));
  await mp.goto(base,{waitUntil:'domcontentloaded'}); await wait(mp,() => window.AccountGate?.allowed&&window.PCOnly?.desktopOnly&&!!window.st?.getState());
  assert.equal(await mp.locator('.hs-gl,.st-objective').count(),0);
  const mobileHouse = await mp.evaluate(() => ['jhp_hs_pose','jhp_hs_stand','jhp_off'].map(k=>localStorage.getItem(k)));
  await mp.evaluate(() => Apps.open('st.diary')); await mp.screenshot({path:shots+'12-mobile-diary.png'});
  await mp.setViewportSize({width:844,height:390}); await mp.screenshot({path:shots+'13-mobile-landscape.png'});
  assert.deepEqual(await mp.evaluate(() => ['jhp_hs_pose','jhp_hs_stand','jhp_off'].map(k=>localStorage.getItem(k))),mobileHouse);
  await mobile.close();
  // An admin-registered account is an existing veteran; preserve its room exactly.
  const veteran = 'Vet' + Date.now().toString(36);
  const registration = await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:veteran,pass:password})});
  assert.equal(registration.status,200);
  const vp = await browser.newPage({viewport:{width:1366,height:860}});vp.on('pageerror',e=>errors.push(e.message));
  await vp.goto(base,{waitUntil:'domcontentloaded'});await vp.waitForSelector('#accountGate');
  await vp.locator('[name=name]').fill(veteran);await vp.locator('[name=password]').fill(password);await vp.locator('#accountGate [type=submit]').click();
  await wait(vp,() => window.House?.live&&House.mode==='monitor'&&window.PMGL?.built&&window.st?.getState()?.flags.veteran&&!document.querySelector('.hs-loading,#houseEntry'),null,90000);
  assert.equal(await vp.locator('.st-objective').count(),0);assert.equal(await vp.evaluate(() => !!House.THINGS['st.diary']),false);
  const room = await vp.evaluate(() => JSON.stringify(Object.entries(House.THINGS).map(([id,t]) => [id,t.at])));
  await vp.evaluate(() => {Net.send({t:'stEvent',id:'lad'});Net.send({t:'stEvent',id:'sync'});Apps.open('st.diary')});
  await vp.waitForTimeout(1200);await vp.screenshot({path:shots+'14-veteran-summary.png'});
  assert.equal(await vp.evaluate(() => JSON.stringify(Object.entries(House.THINGS).map(([id,t]) => [id,t.at]))),room);
  console.log('Story gameplay checks complete: fresh signup, Game Lad, real chores, downstairs/PC/catalogue/diary, refresh progress/pose, physical reader, mobile and veteran isolation');
  assert.deepEqual(errors,[]);console.log('STORY CH1 PASS: no browser errors/warnings');
} catch(e) {
  await shot('failure').catch(()=>{});
  console.log(await p.evaluate(() => ({story:window.st?.getState(),mode:window.House?.mode,held:window.House?.held(),ch:window.ChoreKit?.S?.done,boot:window.JHPBoot,early:window.JHPStood,stand:localStorage.getItem('jhp_hs_stand'),reading:localStorage.getItem('jhp_reading_active'),why:window.House?._?.whyNotStand()})).catch(()=>({errors})));
  throw e;
} finally {await browser.close()}
