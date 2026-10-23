import assert from 'node:assert/strict';
import {mkdir,writeFile,stat} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {roomFixture} from './room-fixture.mjs';

// Run sequentially with other GPU tests. Never starts a server or uses live data.
// node reading-motion-recording.mjs http://localhost:18080 before desktop
const [base,tag='after',device='desktop']=process.argv.slice(2);
assert(['before','after'].includes(tag));assert(['desktop','phone'].includes(device));
const touch=device==='phone',width=touch?390:1366,height=touch?844:860;
const dir=path.resolve('recordings',tag,device);await mkdir(dir,{recursive:true});
// Fail before launching a browser if Playwright's own encoder is missing/corrupt.
const require=createRequire(import.meta.url),pw=path.dirname(require.resolve('playwright-core/package.json'));
const ffmpeg=require(path.join(pw,'lib/server/registry/index.js')).registry.findExecutable('ffmpeg').executablePathOrDie('javascript');
assert.equal(spawnSync(ffmpeg,['-version']).status,0,'Playwright FFmpeg preflight failed');
const start=Date.now();
const {browser,page,errors,until,view}=await roomFixture(base,{touch,width,height,recordVideo:{dir,size:{width,height}}});
const video=page.video();assert(video,'roomFixture needs the additive recordVideo option');
const events=[];
async function mark(action){events.push({ms:Date.now()-start,action,state:await page.evaluate(()=>window.Magazines?.reading?{...Magazines.reading}:null)});console.log(action)}
const settle=()=>until(()=>!!Magazines.reading&&!Magazines.reading.flipping);
async function turn(key='ArrowRight'){await mark(key);await page.keyboard.press(key);await settle();await page.waitForTimeout(170)}
async function close(){await page.keyboard.press('q');await until(()=>!Magazines.reading);await page.evaluate(()=>House.putBack())}
async function open(id,docId){
 await view([40,-55,155],[-15,-24,0]);
 await page.evaluate(({id,docId})=>{House._.setMode('walk');const t=House.THINGS[id];assertThing(t);t.at.hide=false;t.obj.visible=true;House.grab(id);if(docId)Magazines.read(id,docId);else t.use();function assertThing(t){if(!t)throw Error('Missing print prop '+id)}},{id,docId});
 await settle();await page.waitForTimeout(500);await mark('open '+id);
}
try{
 await page.evaluate(()=>Magazines.ready);
 await open('reading.mag.bed');
 await page.screenshot({path:path.join(dir,'magazine-front.png')});
 const camera=await page.evaluate(()=>({...House.P}));
 await turn();await page.screenshot({path:path.join(dir,'magazine-open.png')});
 await turn();await turn('ArrowLeft');
 // Paused/menu and rapid opposite input while a leaf is moving.
 await mark('rapid-forward-forward-back');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');await settle();await page.waitForTimeout(450);
 for(let n=0;n<8;n++){if(await page.locator('[data-turn="1"]').isDisabled())break;await turn()}
 await page.screenshot({path:path.join(dir,'magazine-back.png')});
 assert.deepEqual(await page.evaluate(()=>House.P),camera,'Turns moved the camera');
 await turn('ArrowLeft');await close();
 await open('reading.book.0');await page.screenshot({path:path.join(dir,'book-front.png')});
 await turn();await turn();await turn('ArrowLeft');
 await page.mouse.move(width*.45,height*.4);await page.mouse.down();await page.mouse.move(width*.55,height*.43,{steps:6});await page.mouse.up();
 await page.screenshot({path:path.join(dir,'book-angle.png')});await turn();
 await mark('close-mid-turn');await page.keyboard.press('ArrowLeft');await page.waitForTimeout(120);await page.keyboard.press('q');
 assert.equal(await page.evaluate(()=>Magazines.reading),null);assert.equal(await page.evaluate(()=>House.anims.has('reading.page')),false);await page.evaluate(()=>House.putBack());
 await page.evaluate(()=>{House.buildRoom(House.ROOMS.lounge);Magazines.sync()});
 for(const id of ['hs.tvguide','hs.pbook','ch.m.comic']){await open(id);await turn();await turn();await page.screenshot({path:path.join(dir,id+'.png')});await close()}
 // Baseline has no readable Pixel Post catalogue; capture it if shared binding exists.
 const catalogue=await page.evaluate(()=>Magazines.bindings.has('pm.catalogue'));
 if(catalogue){await open('pm.catalogue');await turn();await turn();await page.screenshot({path:path.join(dir,'pixel-post.png')});await close()}
 await open('reading.mag.bed');await turn();await turn();
 const saved=await page.evaluate(()=>({...Magazines.reading}));await mark('refresh-pages');
 await page.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&House.mode==='inspect'&&!!Magazines.reading&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(await page.evaluate(()=>Magazines.reading.page),saved.page);await page.waitForTimeout(500);await page.screenshot({path:path.join(dir,'refresh.png')});
 await mark('resize-portrait-landscape');await page.setViewportSize({width:touch?844:390,height:touch?390:844});await settle();await page.waitForTimeout(450);await page.setViewportSize({width,height});await settle();await page.waitForTimeout(450);
 await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');assert(await page.evaluate(()=>HousePause.open));await page.waitForTimeout(300);await page.keyboard.press('Escape');await settle();await close();
 assert.deepEqual(errors,[]);await mark('PASS');
}catch(e){await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});await mark('FAIL '+e.message).catch(()=>{});throw e}
finally{
 await writeFile(path.join(dir,'timeline.json'),JSON.stringify({tag,device,width,height,events,errors},null,2));
 await page.context().close();
 try{
  const file=path.join(dir,'reading-motion.webm');await video.saveAs(file);assert((await stat(file)).size>1024,'Empty recording');
  const decoded=spawnSync(ffmpeg,['-loglevel','error','-y','-i',file,'-frames:v','1',path.join(dir,'video-first-frame.png')]);
  assert.equal(decoded.status,0,'Recorded video cannot be decoded: '+decoded.stderr?.toString());
 }finally{await browser.close()}
 console.log('Recording:',path.join(dir,'reading-motion.webm'));
}
