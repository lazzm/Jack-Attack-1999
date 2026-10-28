import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
await mkdir('shots/game-ui',{recursive:true});
const f=await roomFixture(process.argv[2]),{page:p,until,errors}=f;
const shot=n=>p.screenshot({path:'shots/game-ui/'+n+'.png'});
try{
 await f.view([25,-70,125],[0,0,-12]);await p.evaluate(()=>House._.setMode('walk'));
 await p.evaluate(()=>{House.hush();House.grab('mug')});await p.waitForTimeout(500);
 assert.match(await p.locator('.hs-hkeys').innerText(),/Q Return/);
 assert.match(await p.locator('.hs-hold [data-h=use]').innerText(),/Use \/ look closely/);
 await shot('carrying');
 await p.evaluate(()=>House.ui.snapHint({id:'review-slot',hint:'Click/E to return to shelf'}));assert.match(await p.locator('.hs-hmode').innerText(),/PLACE HERE|CARRYING/);
 await p.evaluate(()=>House.ui.holdBar(House.THINGS.mug));
 await p.evaluate(()=>{window.uiMutations=0;window.uiObserver=new MutationObserver(m=>uiMutations+=m.length);uiObserver.observe(document.querySelector('.hs-hold'),{subtree:true,childList:true,attributes:true,characterData:true})});
 await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>uiMutations),0,'Idle carry panel mutates each frame');await p.evaluate(()=>uiObserver.disconnect());
 await p.keyboard.press('i');await until(()=>House.mode==='inspect');await shot('inspection');await p.keyboard.press('q');await until(()=>House.mode==='walk');assert.equal(await p.evaluate(()=>House.held()),'mug');await p.keyboard.press('q');await until(()=>!House.held());
 await p.evaluate(()=>House.grab('mug'));await p.locator('#bootPower canvas').first().dispatchEvent('contextmenu',{button:2,bubbles:true});await until(()=>!House.held());
 await p.evaluate(()=>House.grab('chair'));assert.match(await p.locator('.hs-hkeys').innerText(),/F Sit/i);await p.keyboard.press('Escape');await until(()=>HousePause.open);
 assert(await p.locator('[data-pause=return]').isVisible());await shot('pause-carrying');await p.locator('[data-pause=return]').click();await until(()=>!House.held());
 if(await p.evaluate(()=>HousePause.open))await p.keyboard.press('Escape');
 await p.keyboard.press('Escape');await until(()=>HousePause.open);
 for(const [width,height]of [[1366,860],[1366,768],[1920,1080]]){await p.setViewportSize({width,height});await p.waitForTimeout(100);const r=await p.locator('.hs-pause').boundingBox();assert(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1);assert.equal(await p.locator('.hs-pause-main').evaluate(el=>el.scrollWidth>el.clientWidth),false);await shot('pause-'+width+'-'+height)}
 await p.locator('.hs-pause-controls summary').click();assert(await p.locator('.hs-pause-controls').evaluate(el=>el.open));await shot('controls');
 const music=p.locator('.hs-pause [name=music]'),before=await music.isChecked();await music.setChecked(!before);assert.equal(await p.evaluate(()=>Sound.musicOn),!before);await music.setChecked(before);
 assert.equal(await p.locator('[data-pause=graphics]').count(),0,'One look: no graphics options');await p.keyboard.press('Escape');await until(()=>!HousePause.open);
 await p.setViewportSize({width:1366,height:860});await p.evaluate(()=>House.hush());await p.keyboard.press('q');assert.equal(await p.evaluate(()=>House.mode),'walk');
 await f.view([25,-70,125],[0,0,-12]);
 await p.evaluate(()=>{if(document.pointerLockElement)document.exitPointerLock()});await p.waitForTimeout(150);
 await p.evaluate(()=>House.ui.tip('A long shelf label that must remain inside the viewport',innerWidth-4,innerHeight-4));const tip=await p.locator('.hs-tip').boundingBox();assert(tip.x>=0&&tip.y>=0&&tip.x+tip.width<=1366&&tip.y+tip.height<=860);await shot('tooltip');
 await p.evaluate(async()=>{await Apps.load('js/ch-core.js');const v=document.querySelector('.hs-voice');v.classList.add('on');v.querySelector('b').textContent='MOM';v.querySelector('p').textContent='Your jobs are on the list. Come downstairs when you are ready.';const c=document.querySelector('.ch-chip');c.hidden=false;c.querySelector('b').textContent='Tidy your room';House.dirty()});await p.waitForTimeout(100);const voice=await p.locator('.hs-voice').boundingBox(),chip=await p.locator('.ch-chip').boundingBox();assert(voice.y>=chip.y+chip.height,'Voice overlaps job tracker');await shot('hud-spacing');
 await p.evaluate(()=>{House._.setMode('walk');House.sitDown()});await until(()=>House.mode==='monitor'&&!House.gliding);await p.evaluate(async()=>{window.uiWin=await Apps.open('notepad')});await p.waitForTimeout(250);await p.locator('.appwin textarea').focus();await p.keyboard.type('qt');assert.equal(await p.locator('.appwin textarea').inputValue(),'qt');assert.equal(await p.evaluate(()=>House.mode),'monitor');
 assert.deepEqual(errors,[]);console.log('GAME UI PASS: carry caching, Q/right-click return, inspection Q, contextual Sit action, menu return, desktop sizes, controls/audio nav (no graphics options)igation, typing guard; zero errors');
}catch(e){await shot('failure');throw e}finally{await f.browser.close()}
