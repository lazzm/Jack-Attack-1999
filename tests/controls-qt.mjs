import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,until}=await roomFixture(process.argv[2]||'http://localhost:18527');
try {
  await p.evaluate(async()=>{await Apps.load('js/pcgames.js');await Apps.load('js/pcgames-engine.js')});
  const bindingCheck=await p.evaluate(()=>{
    const E=PCG.engine,saved={prev:['KeyQ'],talk:['KeyT']},before=JSON.stringify(saved),b=E.bindings(saved);
    const normalized=[b.codes('prev'),b.codes('talk')];b.set('prev','KeyQ');b.set('talk','KeyT');
    const afterReject=[b.codes('prev'),b.codes('talk')];
    b.B.prev=['KeyQ'];b.B.talk=['KeyT'];const host=document.createElement('div');
    const input=E.input(host,{binds:b});const atInput=[b.codes('prev'),b.codes('talk')];input.dispose();
    return {normalized,afterReject,atInput,unchanged:before===JSON.stringify(saved)};
  });
  assert.deepEqual(bindingCheck,{normalized:[['KeyZ'],['KeyY']],afterReject:[['KeyZ'],['KeyY']],atInput:[['KeyZ'],['KeyY']],unchanged:true});
  await p.evaluate(()=>House.sitDown());await until(()=>House.mode==='monitor');
  for(const kind of ['input','textarea','select','editable','textbox']){
    await p.evaluate(kind=>{
      const el=document.createElement(['editable','textbox'].includes(kind)?'div':kind);el.id='qtTyping';
      if(kind==='editable')el.contentEditable='true';
      if(kind==='textbox'){el.setAttribute('role','textbox');el.tabIndex=0}
      if(kind==='select')el.innerHTML='<option>Quiet</option><option>Tea</option>';
      document.getElementById('monitorSurface').appendChild(el);el.focus();
    },kind);
    await p.keyboard.press('q');await p.keyboard.press('t');
    assert.equal(await p.evaluate(()=>House.mode),'monitor',kind+' swallowed Q');
    assert.equal(await p.evaluate(()=>House.desktopDisplay()),false,kind+' swallowed T');
    if(['input','textarea'].includes(kind)){
      assert.equal(await p.locator('#qtTyping').inputValue(),'qt');
      await p.keyboard.press('Backspace');assert.equal(await p.locator('#qtTyping').inputValue(),'q');
    }
    await p.evaluate(()=>document.getElementById('qtTyping').remove());
  }
  for(const modifier of ['Control','Alt','Meta'])for(const key of ['q','t']){
    await p.evaluate(({modifier,key})=>window.dispatchEvent(new KeyboardEvent('keydown',{key,[modifier.toLowerCase()+'Key']:true,bubbles:true,cancelable:true})),{modifier:modifier==='Control'?'Ctrl':modifier,key});
    assert.equal(await p.evaluate(()=>House.mode),'monitor');assert.equal(await p.evaluate(()=>House.desktopDisplay()),false);
  }
  await p.keyboard.press('0');await p.keyboard.press('Backspace');
  assert.equal(await p.evaluate(()=>House.mode),'monitor');assert.equal(await p.evaluate(()=>House.desktopDisplay()),false);
  await p.evaluate(()=>{
    const host=document.createElement('div');host.id='qtCanvasTyping';host.className='pcg-host';host.tabIndex=0;
    document.getElementById('monitorSurface').appendChild(host);
    window.qtCanvasInput=PCG.engine.input(host,{typing:()=>true,onKey:ev=>{host.dataset.typed=(host.dataset.typed||'')+ev.key;return false}});host.focus();
  });
  await p.keyboard.press('q');await p.keyboard.press('t');
  assert.equal(await p.locator('#qtCanvasTyping').getAttribute('data-typed'),'qt');
  assert.equal(await p.evaluate(()=>House.mode),'monitor');assert.equal(await p.evaluate(()=>House.desktopDisplay()),false);
  await p.evaluate(()=>{qtCanvasInput.dispose();document.getElementById('qtCanvasTyping').remove()});
  // A disposable desktop game window exercises the same ownership routing as
  // disc games, whose shortcuts listen on document rather than a focused canvas.
  await p.evaluate(()=>{
    const w=document.createElement('div');w.id='qtGameWindow';w.className='float';w.innerHTML='<div class="dg-host"></div>';
    document.getElementById('monitorSurface').appendChild(w);Desk.activate(w);
    window.qtDelivered=[];window.qtListener=ev=>qtDelivered.push(ev.key);document.addEventListener('keydown',qtListener);
  });
  await p.keyboard.press('t');assert(await p.evaluate(()=>House.desktopDisplay()));
  await p.keyboard.press('q');await until(()=>House.mode==='walk');
  assert.deepEqual(await p.evaluate(()=>qtDelivered),[],'Game intercepted house Q/T');
  await p.evaluate(()=>{document.removeEventListener('keydown',qtListener);document.getElementById('qtGameWindow').remove()});
  await p.evaluate(()=>House.desktopDisplay(false));await p.evaluate(()=>House.sitDown());await until(()=>House.mode==='monitor');
  await p.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'q',repeat:true,bubbles:true})));
  assert.equal(await p.evaluate(()=>House.mode),'monitor','Repeat leaned back');
  await p.keyboard.press('T');assert(await p.evaluate(()=>House.desktopDisplay()));
  await p.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'t',repeat:true,bubbles:true})));
  assert(await p.evaluate(()=>House.desktopDisplay()),'Repeat toggled LOCK IN');
  await p.screenshot({path:'shots/controls-qt-pc-lock.png'});
  await p.keyboard.press('Q');await until(()=>House.mode==='walk');
  assert.equal(await p.evaluate(()=>document.documentElement.classList.contains('pc-desktop-full')),false);
  await p.evaluate(()=>{House.grab('media.box.ps.run');House.inspect('media.box.ps.run')});
  await until(()=>House.mode==='inspect');await p.screenshot({path:'shots/controls-qt-inspection.png'});
  await p.keyboard.press('q');await until(()=>House.mode==='walk');await p.evaluate(()=>House.putBack());
  await p.evaluate(()=>Apps.load('js/rm-bits.js'));
  for(const id of ['postershuttle','posterband','posterfilm','postergame','posterrobot']){
    assert(await p.evaluate(id=>RoomBits.has(id),id));await p.evaluate(id=>RoomBits.open(id),id);
    await until(()=>House.mode==='focus');assert.equal(await p.locator('.rm-view').count(),0);
    await p.keyboard.press('q');await until(()=>House.mode==='walk');
  }
  await p.evaluate(async()=>{await Apps.load('js/rm-tv.js');RoomTV.test('gb.blocks')});await until(()=>RoomTV._dbg()?.st==='game');
  await p.evaluate(()=>window.qtGame=RoomTV.dbg());
  for(const [width,height,tag] of [[1366,860,'desktop'],[390,844,'phone']]){
    await p.setViewportSize({width,height});
    if(!await p.evaluate(()=>RoomTV.lockIn()))await p.keyboard.press('t');
    await p.waitForTimeout(350);const rect=await p.locator('.rm-tvv.on .rm-glass').boundingBox();
    assert(Math.abs(rect.width/rect.height-10/9)<.01);assert(await p.evaluate(()=>RoomTV.dbg()===qtGame));
    await p.screenshot({path:`shots/controls-qt-handheld-${tag}.png`});
  }
  await p.keyboard.press('q');await until(()=>House.mode==='walk');
  await p.setViewportSize({width:1366,height:860});
  await p.evaluate(()=>RoomTV.test('n64.range'));await until(()=>RoomTV._dbg()?.st==='game');
  await p.keyboard.press('u');assert(await p.evaluate(()=>RoomTV.open_),'Shoulder U leaned back');
  assert.match(await p.locator('.rm-help').innerText(),/Swap gun: U/);
  await p.keyboard.press('t');assert(await p.evaluate(()=>RoomTV.lockIn()));
  await p.keyboard.press('q');await until(()=>House.mode==='walk');
  await p.keyboard.press('Escape');assert(await p.evaluate(()=>HousePause.open));
  assert.match(await p.locator('.hs-pause-keys').innerText(),/Q: lean back · T: LOCK IN/);
  await p.screenshot({path:'shots/controls-qt-menu.png'});await p.keyboard.press('Escape');
  await p.evaluate(()=>House.goRoom('lounge',0));await until(()=>!!window.HouseTelly);
  await p.evaluate(()=>HouseTelly.open('tv'));await until(()=>House.mode==='focus'&&!!House.surfaceScreen());
  await p.keyboard.press('t');assert(await p.evaluate(()=>House.surfaceScreen().locked));
  const textBefore=await p.evaluate(()=>!!HouseTelly.st.text);
  await p.keyboard.press('Shift+t');assert.equal(await p.evaluate(()=>!!HouseTelly.st.text),!textBefore);
  assert(await p.evaluate(()=>House.surfaceScreen().locked),'TEXT changed LOCK IN');
  await p.screenshot({path:'shots/controls-qt-family-tv.png'});
  await p.keyboard.press('q');await until(()=>House.mode==='walk');assert.equal(await p.evaluate(()=>House.surfaceScreen()),null);
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House?.live&&!document.querySelector('.hs-loading,#houseEntry'));
  assert.equal(await p.evaluate(()=>House.mode),'walk');
  assert.deepEqual(errors,[]);console.log('Q/T CONTROLS PASS: typing/delete/modifiers/repeat, legacy keys, PC/game ownership, inspection, five legacy posters, handheld, console Q, family TV/TEXT, aspect/resize, menu and standing refresh');
} catch(e) {
  await p.screenshot({path:'shots/controls-qt-failure.png'});
  console.error('Q/T state',await p.evaluate(()=>({mode:House.mode,tv:window.RoomTV?._dbg(),errors:[] })),errors);
  throw e;
} finally {await browser.close()}
