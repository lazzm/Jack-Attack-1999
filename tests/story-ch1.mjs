import {workBed} from './bed-actions.mjs';
// Story integration through existing public gameplay APIs, real chore timing and real sockets.
// Accepts only a disposable localhost server; never seeds or edits another mod's state.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base = process.argv[2] || 'http://localhost:18099';
// Stretch waits on a busy host (same rule as smoke.mjs; STORY_SCALE overrides).
const OS = await import('node:os');
const SCALE = +process.env.STORY_SCALE || Math.max(1, Math.min(4, Math.round(OS.loadavg()[0] / OS.cpus().length * 1.3 * 10) / 10));
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const shots = fileURLToPath(new URL('shots/story-opening/', import.meta.url)); await mkdir(shots, {recursive:true});
const stage=process.argv[3]||'all',resumeFile=process.argv[4]||'/tmp/jhp-story-opening-browser.json';
const resumed=['second','pc'].includes(stage)?JSON.parse(await readFile(resumeFile,'utf8')):null;
const account = 'Story' + Date.now().toString(36), password = 'Temporary-1999';
async function bootRoundTrip(){
  const name='Boot'+Date.now().toString(36);
  const reg=await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name,pass:password})});assert.equal(reg.status,200);
  const f=await roomFixture(base,{account:name,password,signup:false,timeoutScale:SCALE});
  try{
    const p=f.page;await p.evaluate(()=>House.buildRoom(House.ROOMS.drive));
    const frame=await p.evaluate(()=>House.ROOMS.drive.carFrame);
    await f.view([frame.x-165,245,frame.z-114],[frame.x,301,frame.z-146],{level:'G'});
    await p.evaluate(()=>{House._.setMode('walk');Sound.effectsOn=true;for(const cue of ['gravel','heavy','plug','pcfan','floppy'])Sound.play(cue);House.act('hs.carboot');House.saveWalkState();});
    await f.until(()=>House.ROOMS.drive.carBoot.hinge.rotation.x < -1.2);await p.screenshot({path:shots+'20-boot-open-persist.png'});
    const power=await p.evaluate(()=>localStorage.getItem('jhp_off'));
    for(const open of [true,false]){
      if(!open)await p.evaluate(()=>{House.act('hs.carboot');House.saveWalkState();});
      await p.reload({waitUntil:'domcontentloaded'});await f.until(()=>House.live&&House.mode==='walk'&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
      assert.equal(await p.evaluate(()=>House.here),'drive');
      assert.equal(await p.evaluate(()=>House.ROOMS.drive.carBoot.open),open);
      assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),power);
      assert.equal(await p.evaluate(()=>House.mode),'walk');
      await p.screenshot({path:shots+'21-boot-refresh-'+(open?'open':'shut')+'.png'});
    }
    assert.deepEqual(f.errors,[]);console.log('STORY BOOT PASS: open/shut lid, standing pose and PC power survive refresh');
  }catch(e){console.log(await f.page.evaluate(()=>({pose:House.P,saved:localStorage.getItem('jhp_hs_stand'),boot:localStorage.getItem('jhp_car_boot'),mode:House.mode,here:House.here})));await f.page.screenshot({path:shots+'boot-failure.png'});throw e;}finally{await f.browser.close();}
}
if(stage==='boot'){await bootRoundTrip();process.exit(0);}
// Owner replace actions first upload the profile; the server allows one upload per ~20s per connection, so on a busy host the
// first confirm can answer "JackNet has not confirmed your current save". Wait out the limit and confirm again.
async function ownerReplace(op,action,pick){
  for(let attempt=0;;attempt++){
    if(pick)await op.locator('[name=snapshot]').selectOption(pick);
    await op.locator(`[data-owner=${action}]`).click();
    const nav=op.waitForEvent('domcontentloaded',{timeout:30000*SCALE}).then(()=>true,()=>false);
    await op.locator('[data-owner=confirm]').click();
    if(await nav)return;
    const msg=await op.locator('.owner-tools [role=status]').textContent();
    assert(attempt<2&&/not confirmed/.test(msg),'Owner '+action+' did not reload: '+msg);
    await op.waitForTimeout(21000*SCALE);
  }
}
async function ownerRoundTrip(){
  const ownerReg=await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})});
  assert.equal(ownerReg.status,200);
  const of=await roomFixture(base,{account:'Jack',password,signup:false,timeoutScale:SCALE});
  try {
    const op=of.page;await of.until(()=>OwnerTools.allowed);
    assert.equal(await op.evaluate(()=>House.pcGL.visible),true);
    await op.keyboard.press('Backquote');await of.until(()=>document.querySelector('.owner-tools')?.open);
    await op.locator('[data-owner=snapshot]').click();await of.until(()=>!document.querySelector('[data-owner=snapshot]').disabled);
    const saved=await op.locator('[name=snapshot] option').first().getAttribute('value',{timeout:30000*SCALE});assert(saved);
    await op.waitForTimeout(21000*SCALE); // Respect the roaming profile's save limit (1 upload / 20s per connection); background autosaves can spend the refill on a busy host.
    await ownerReplace(op,'reset');
    await of.until(()=>AccountGate.allowed&&House.live&&StoryOpening?.built&&!document.querySelector('.hs-loading,#houseEntry'));
    assert.equal(await op.evaluate(()=>st.current().id),'lad');assert.equal(await op.evaluate(()=>House.pcGL.visible),false);
    assert.equal(await op.evaluate(()=>House.mode),'walk');
    assert.equal(await op.evaluate(()=>document.body.classList.contains('pc-monitor')),false);
    await op.screenshot({path:shots+'18-owner-reset-no-pc.png'});
    await op.keyboard.press('Backquote');await of.until(()=>document.querySelector('.owner-tools')?.open);
    await ownerReplace(op,'restore',saved);
    await of.until(()=>AccountGate.allowed&&House.live&&House.mode==='walk'&&!House.gliding&&st.getState()?.flags.veteran&&!document.querySelector('.hs-loading,#houseEntry'));
    assert.equal(await op.evaluate(()=>House.pcGL.visible),true);await op.screenshot({path:shots+'19-owner-restored-pc.png'});
    assert.deepEqual(of.errors,[]);
  } catch(e){await of.page.screenshot({path:shots+'owner-failure.png'});throw e;}finally {await of.browser.close();}
  console.log('STORY OWNER PASS: reset removes the PC; restore brings the original PC back');
}
if(stage==='owner'){await ownerRoundTrip();process.exit(0);}
const {browser, page:p, errors, until, view} = await roomFixture(base, {account, password, timeoutScale:SCALE, opening:true,resume:!!resumed,storageState:resumed||undefined});
const shot = name => p.screenshot({path:shots + name + '.png'});
async function wait(page, fn, arg, timeout=30000) {
  const end=Date.now()+timeout*SCALE;
  // (a first visit on another device may reload once while JackNet brings the account's newer profile down: js/roam.js)
  while(Date.now()<end){try{if(await page.evaluate(fn,arg))return}catch(e){if(!/context was destroyed|navigation|Cannot find context/i.test(e.message))throw e}await page.waitForTimeout(150)}
  throw Error('State timeout: '+String(fn));
}
// (walking puts the eye at the standing height at once, still looking at the target, so a press lands where it was aimed)
async function aim(eye, target, level='U') { await view(eye, target, {level}); await p.evaluate(t => {House.hush(); House._.setMode('walk'); HousePause.close();const P=House.P,W=House.W;if(!W.seat){W.eyeNow=W.eye;P.y=W.fy-W.eye;P.rx=Math.atan2(-(t[1]-P.y),Math.hypot(t[0]-P.x,t[2]-P.z))*180/Math.PI;P.ry=Math.atan2(t[0]-P.x,-(t[2]-P.z))*180/Math.PI;House.dirty()}}, target); }
async function waitStep(id) { await wait(p,id => !!st.getState()?.done[id],id,20000); }
async function dropIn(id, snap) {
  const s = await p.evaluate(snap => {const s=House.SNAPS[snap];return {x:s.x,y:s.y,z:s.z,room:s.room,bz1:House.ROOMS[s.room].bz1}}, snap);
  for(let attempt=0;attempt<3;attempt++){
    const side = s.room === 'bedroom' && s.z > 180 ? -1 : 1;
    await aim([s.x,s.room==='kitchen'?245:-55,s.z+55*side], [s.x,s.y,s.z+8*side], s.room==='kitchen'?'G':'U');
    assert(await p.evaluate(id => House.grab(id), id), 'Could not carry ' + id);
    // Extend the grip with the same distance controls as the carry HUD.
    for(let n=0;n<5+attempt;n++)await p.keyboard.press('+');
    await p.keyboard.press('e');
    await wait(p,id => !House.held() && ['snap','rest'].includes(House.THINGS[id].st),id);
    if(await p.evaluate(({id,snap})=>House.THINGS[id].snap===snap,{id,snap}))return;
  }
  throw Error('Missed physical snap: '+id+' -> '+snap);
}

try {
  await until(() => !!st.getState() && !!House.THINGS['st.diary']);
  if(!['second','pc'].includes(stage)){
  assert.equal(await p.evaluate(() => st.current().id), 'lad');
  assert.equal(await p.evaluate(()=>House.pcGL.visible),false);
  await until(()=>!!window.StoryOpening?.built);
  await aim([80,-55,220], [-61,-1,-12]); await p.waitForTimeout(300);await shot('00-guidance-far');
  await aim([80,-55,220], [200,-30,240]);await p.waitForTimeout(300);await shot('00-guidance-behind');
  await aim([300,-55,190], [-61,-1,-12]);await p.waitForTimeout(300);await shot('00-guidance-occluded');
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
  await waitStep('lad'); assert(!await p.locator('.st-objective').isVisible());await p.waitForTimeout(200);assert(!await p.locator('.st-marker').isVisible());await p.keyboard.press('t');await shot('05-game-lad-lock-in');assert(!await p.locator('.st-prompt').isVisible());await p.keyboard.press('t');
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
  await workBed(p,['pillow']);
  await dropIn('ch.pjs','ch.s.pjs'); await p.waitForTimeout(1300);
  await workBed(p,['pullL','pullR','smooth']);
  await waitStep('bed'); console.log('Ch1: real bed accepted');
  await p.evaluate(() => House.act('ch.binbag')); await until(() => ChoreKit.has('bin','tie'));
  await p.waitForTimeout(5500); await dropIn('ch.binbag','ch.s.kbin');
  await waitStep('bin'); console.log('Ch1: real chores accepted');
  if(stage==='first'){
    await p.evaluate(async()=>{House.saveWalkState();await Roam.syncNow();});
    await writeFile(resumeFile,JSON.stringify(await p.context().storageState()));
    assert.deepEqual(errors,[]);
    console.log('STORY CH1 FIRST PASS: Game Lad, real chores, empty PC, diary, guidance and refresh');
  }
  }
  if(stage!=='first'){
  const carFrame=await p.evaluate(()=>House.ROOMS.drive.carFrame);
  await aim([carFrame.x,225,carFrame.z-245],[carFrame.x,272,carFrame.z-150],'G'); // behind the actual car frame, looking down at the boot lid
  await waitStep('dad'); await p.waitForTimeout(700);await shot('07-dad-car');
  await p.keyboard.press('f');await waitStep('boot');await p.waitForTimeout(800);await shot('08-boot-open');await aim([carFrame.x-48,245,carFrame.z-245],[carFrame.x,300,carFrame.z-140],'G');await shot('08b-boot-wide');await p.evaluate(()=>House.act('st.boot'));await p.waitForTimeout(750);await shot('08c-boot-shut');await p.evaluate(()=>House.act('st.boot'));await p.waitForTimeout(750);
  async function walkDistance(){
    await aim([110,-55,160],[110,-55,50]);const z=await p.evaluate(()=>House.W.z);
    await p.keyboard.down('w');await p.waitForTimeout(450);await p.keyboard.up('w');
    return z-await p.evaluate(()=>House.W.z);
  }
  const ordinaryWalk=await walkDistance();assert(ordinaryWalk>0);
  for(const part of (stage==='pc'?['speakers','keys','monitor','tower']:['tower','monitor','keys','speakers'])) {
    const id='st.pc.'+part;
    assert(await p.evaluate(id=>House.grab(id),id),'Cannot grab '+part);
    if(part==='monitor') {
      const heavyWalk=await walkDistance();assert(heavyWalk>0&&heavyWalk<ordinaryWalk*.8,'CRT did not slow actual walking');
      await shot('09-heavy-monitor');
      // A refresh while carrying hands the CRT straight back (docs/PHYSICS.md); its saved place stays the real drive
      // pickup, never the room crossed last.
      await aim([150,-55,100],[20,-15,0]);
      await p.evaluate(()=>House.saveWalkState());
      await p.reload({waitUntil:'domcontentloaded'});
      await until(()=>window.House?.live&&window.StoryOpening?.built&&!document.querySelector('.hs-loading,#houseEntry'));
      await until(()=>House.held()==='st.pc.monitor');
      assert.equal(await p.evaluate(()=>House.ROOMS.drive.carBoot.open),true);
      assert.equal(await p.evaluate(()=>House.THINGS['st.pc.monitor'].at.room),'drive');
      assert.equal(await p.evaluate(()=>House.THINGS['st.pc.tower'].at.room),stage==='pc'?'drive':'bedroom');
      await p.evaluate(()=>{if(!House.ROOMS.drive.carBoot.open)House.act('st.boot')});
      await p.waitForTimeout(700);
      assert(await p.evaluate(id=>House.held()===id||House.grab(id),id));
    }
    const snap=await p.evaluate(part=>{const s=House.SNAPS['st.desk.'+part];return [s.x,s.y,s.z]},part);
    await aim([snap[0],-50,70],snap);
    await shot('10-carry-'+part);
    await p.keyboard.press('e');await waitStep('part.'+part);console.log('PC part placed:',part);
    await p.waitForTimeout(600);await shot('11-placed-'+part);
  }
  for(const lead of (stage==='pc'?['keyboard','video','power']:['power','video','keyboard'])){
    await aim([70,-55,80],[28,-9-['power','video','keyboard'].indexOf(lead)*8,-23]);
    await p.keyboard.press('f');await waitStep('lead.'+lead);console.log('PC lead connected:',lead);await shot('12-lead-'+lead);
  }
  await p.evaluate(()=>House.saveWalkState());await p.reload({waitUntil:'domcontentloaded'});
  await until(()=>window.House?.live&&window.StoryOpening?.built&&!document.querySelector('.hs-loading,#houseEntry'));
  assert.equal(await p.evaluate(()=>st.current().id),'power');
  assert.equal(await p.evaluate(()=>House.pcGL.visible),false);await shot('12b-assembled-refresh');
  await aim([40,-55,85],[17,-20,-11]);
  await p.evaluate(()=>House.interact('st.pc.tower'));await waitStep('power');
  await until(()=>House.mode==='monitor'||House.mode==='pcboot');await shot('13-first-boot');
  for(let disk=1;disk<=3;disk++){
    const button=p.getByRole('button',{name:'Insert Disk '+disk,exact:true});
    await button.waitFor({state:'visible',timeout:60000*SCALE});
    if(disk===1){
      await p.keyboard.press('Escape');assert(await p.evaluate(()=>HousePause.open));await shot('13b-setup-paused');await p.keyboard.press('Escape');
      await p.reload({waitUntil:'domcontentloaded'});
      await until(()=>window.House?.live&&window.StoryOpening?.built&&!document.querySelector('.hs-loading,#houseEntry'));
      await button.waitFor({state:'visible',timeout:60000*SCALE});await shot('13c-setup-refresh');
      assert.equal(await p.evaluate(()=>st.current().id),'install');
    }
    console.log('Recovery disk ready:',disk);await shot('14-setup-disk-'+disk);await button.click();
  }
  await waitStep('install');
  await until(()=>House.mode==='monitor'&&!House.gliding&&DesktopSurface.ready());await waitStep('pc');
  assert.equal(await p.evaluate(()=>st.getState().ch),2);
  await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);
  await p.waitForTimeout(800);await shot('15-chapter-two');
  assert.equal(await p.evaluate(()=>House.pcGL.visible),true);
  assert.equal(await p.evaluate(() => st.getState().trust), 3);
  if(stage==='pc'){
    assert.deepEqual(errors,[]);
    console.log('STORY PC PASS: reversed parts/leads, heavy monitor, carried/assembled/Setup refresh, installer and JackNet');
    await browser.close();process.exit(0);
  }
  await p.keyboard.press('Escape');await p.locator('[name=guidance]').selectOption('light');await shot('16-guidance-setting');await p.keyboard.press('Escape');
  await p.evaluate(()=>StoryGuide.setting('off'));await p.waitForTimeout(200);assert(!await p.locator('.st-marker').isVisible());await shot('17-guidance-off');
  await p.evaluate(()=>StoryGuide.setting('full'));
  await p.evaluate(() => House.interact('st.diary')); await until(() => !!Magazines.reading);
  // All future pages remain legible; resize reuses the shared reader's single-page mode.
  await p.locator('[data-turn="1"]').click(); await until(() => !Magazines.reading.flipping); await shot('09-chapter-two-goals');
  await p.locator('[data-turn="1"]').click(); await until(() => !Magazines.reading.flipping); await shot('09b-next-chapters');
  await p.setViewportSize({width:1024,height:768}); await p.waitForTimeout(750); await shot('10-diary-1024');
  await p.setViewportSize({width:1366,height:860});
  await p.evaluate(() => House.saveWalkState());
  console.log('Diary refresh source',await p.evaluate(() => ({mode:House.mode,stood:House.stood,stand:localStorage.getItem('jhp_hs_stand'),reading:localStorage.getItem('jhp_reading_active'),seat:sessionStorage.getItem('jhp_login_seat')})));
  const storageState = await p.context().storageState();
  await p.reload({waitUntil:'domcontentloaded'}); await wait(p,() => window.Magazines?.reading?.id==='st.diary'&&!!st.getState(),null,60000);
  assert.equal(await p.evaluate(() => st.getState().ch), 2);assert.equal(await p.evaluate(()=>House.pcGL.visible),true); await shot('11-diary-refresh');
  await p.keyboard.press('q'); await p.evaluate(() => House.putBack());
  if (errors.length) console.log('Desktop errors retained for the final assertion:',errors);
  // This is a device handover. Retire the old desktop before starting the phone:
  // its 45-second autosave can otherwise keep publishing newer profiles while a
  // software-rendered phone warms up, forcing repeated import/reload cycles.
  await p.close();
  // Phones play the same game (device policy, 2026-10-26): a token resume on a phone gets the same house, story and
  // diary, and (like any refresh) never rewrites the saved standing pose or the PC's power state.
  const mobile = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',storageState});
  const mp = await mobile.newPage(); mp.on('pageerror',e=>errors.push(e.message));
  // Wait for the real profile handshake, including the import-and-reload path.
  // House readiness can briefly become true before a slower profile download finishes.
  await mp.addInitScript(() => {
    const bind = () => {
      if (!window.Net?.on) { setTimeout(bind, 0); return; }
      Net.on('rmSame', () => { window.__testProfileReady = true; });
      Net.on('rmNone', () => { window.__testProfileReady = true; });
      Net.on('rmData', () => { window.__testProfileReady = false; });
    };
    bind();
  });
  const kept = () => [JSON.parse(localStorage.getItem('jhp_hs_stand')||'null')?.p||null, localStorage.getItem('jhp_off')];
  await mp.goto(base,{waitUntil:'domcontentloaded',timeout:90000*SCALE});
  try { await wait(mp,() => window.__testProfileReady&&window.AccountGate?.allowed&&window.House?.live&&!window.PCOnly?.desktopOnly&&window.GameInput?.touch&&!!window.st?.getState()&&!document.querySelector('.hs-loading,#houseEntry'),null,90000); }
  catch(e){console.log('Phone resume failure',await mp.evaluate(()=>({profileReady:window.__testProfileReady,connected:window.Net?.connected,member:window.Net?.me?.member,allowed:window.AccountGate?.allowed,live:window.House?.live,desktopOnly:window.PCOnly?.desktopOnly,touch:window.GameInput?.touch,story:window.st?.getState(),loading:!!document.querySelector('.hs-loading,#houseEntry')})));await mp.screenshot({path:shots+'phone-failure.png'});throw e;}
  // The phone may have reloaded once to bring the desktop's latest profile down; from here on nothing may change it.
  // Settled means: ready, and still the same document three seconds later (a roam reload replaces it).
  for (let i = 0; i < 6; i++) {
    await wait(mp,() => window.AccountGate?.allowed&&window.House?.live&&!!window.st?.getState()&&!document.querySelector('.hs-loading,#houseEntry'),null,60000);
    await mp.evaluate(() => { window.__settled = 1; }).catch(() => {});
    await mp.waitForTimeout(3000);
    if (await mp.evaluate(() => window.__settled === 1 && !!window.st?.getState()).catch(() => false)) break;
  }
  const mobileHouse = await mp.evaluate(kept);
  assert.equal(await mp.evaluate(() => st.getState().ch), 2);
  await mp.evaluate(() => { if (!window.Magazines?.reading) House.interact('st.diary'); }); await wait(mp,() => window.Magazines?.reading?.id==='st.diary',null,30000);
  await mp.waitForTimeout(800); await mp.screenshot({path:shots+'12-mobile-diary.png'});
  await mp.setViewportSize({width:844,height:390}); await mp.waitForTimeout(800); await mp.screenshot({path:shots+'13-mobile-landscape.png'});
  const after = await mp.evaluate(kept);
  assert.deepEqual(after[1], mobileHouse[1], 'A phone resume changed the PC power state');
  if (mobileHouse[0]) for (const k of ['x','z','lvl']) assert.equal(after[0]?.[k], mobileHouse[0][k], 'A phone resume changed the saved standing pose: ' + k);
  await mobile.close();
  // An admin-registered account is an existing veteran; preserve its room exactly.
  const veteran = 'Vet' + Date.now().toString(36);
  const registration = await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:veteran,pass:password})});
  assert.equal(registration.status,200);
  const vp = await browser.newPage({viewport:{width:1366,height:860}});vp.on('pageerror',e=>errors.push(e.message));
  await vp.goto(base,{waitUntil:'domcontentloaded',timeout:90000*SCALE});await vp.waitForSelector('#accountGate');
  await vp.locator('[name=name]').fill(veteran);await vp.locator('[name=password]').fill(password);await vp.locator('#accountGate [type=submit]').click();for(let i=0;i<100&&!(await vp.evaluate(()=>window.AccountGate?.allowed||!!document.querySelector('#accountFirst')));i++)await vp.waitForTimeout(200);if(await vp.locator('#accountFirst').count())await vp.locator('#accountGate [type=submit]').click();
  await wait(vp,() => window.House?.live&&House.mode==='monitor'&&window.PMGL?.built&&window.st?.getState()?.flags.veteran&&!document.querySelector('.hs-loading,#houseEntry'),null,90000);
  assert.equal(await vp.evaluate(() => st.objectives().some(s => s.key === 'story')),false);assert.equal(await vp.evaluate(() => !!House.THINGS['st.diary']),false);
  const room = await vp.evaluate(() => JSON.stringify(Object.entries(House.THINGS).map(([id,t]) => [id,t.at])));
  await vp.evaluate(() => {Net.send({t:'stEvent',id:'lad'});Net.send({t:'stEvent',id:'sync'});Apps.open('st.diary')});
  await vp.waitForTimeout(1200);await vp.screenshot({path:shots+'14-veteran-summary.png'});
  assert.equal(await vp.evaluate(() => JSON.stringify(Object.entries(House.THINGS).map(([id,t]) => [id,t.at]))),room);
  await vp.close();
  if(stage==='all')await ownerRoundTrip();
  console.log('Story gameplay checks complete: fresh signup, Game Lad, real chores, physical PC assembly/installer/JackNet, refresh progress/pose, physical reader, mobile and veteran isolation');
  assert.deepEqual(errors,[]);console.log('STORY CH1 PASS: no browser errors/warnings');
  }
} catch(e) {
  await shot('failure').catch(()=>{});
  console.log(await p.evaluate(() => ({story:window.st?.getState(),mode:window.House?.mode,held:window.House?.held(),ch:window.ChoreKit?.S?.done,boot:window.JHPBoot,early:window.JHPStood,stand:localStorage.getItem('jhp_hs_stand'),reading:localStorage.getItem('jhp_reading_active'),why:window.House?._?.whyNotStand()})).catch(()=>({errors})));
  throw e;
} finally {await browser.close()}
