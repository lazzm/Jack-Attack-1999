// Run sequentially from tests/: node mobile-phone-use.mjs http://localhost:PORT
// Uses the main runner's existing disposable server; never starts a server.
// Budget: five minutes total, 12 seconds per state wait, one browser at a time.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2];
assert(base && ['localhost','127.0.0.1'].includes(new URL(base).hostname),'Supply a throwaway localhost server URL');
let activeBrowser;
const watchdog=setTimeout(()=>{
  console.error('MOBILE PHONE: exceeded the five-minute browser budget');
  setTimeout(()=>process.exit(1),3000).unref();
  if(activeBrowser)activeBrowser.close().finally(()=>process.exit(1));else process.exit(1);
},300000);
await mkdir('shots',{recursive:true});
try {
  // Deliberately sequential: software WebGL must not share concurrent browsers.
  for(const size of [{width:1366,height:860,tag:'desktop',touch:false},{width:390,height:844,tag:'portrait',touch:true}]){
    const f=await roomFixture(base,size), {page:p,errors}=f;activeBrowser=f.browser;
    p.setDefaultTimeout(12000);
    const until=async fn=>{const deadline=Date.now()+12000;while(Date.now()<deadline){if(await p.evaluate(fn))return;await p.waitForTimeout(100)}throw Error('Phone state timeout: '+fn)};
    const snapshot=()=>p.evaluate(()=>({at:{...HouseMobile.thing.at,hide:!!HouseMobile.thing.at.hide},home:{...HouseMobile.thing.home},
      position:HouseMobile.thing.obj.position.toArray(),rotation:HouseMobile.thing.obj.rotation.toArray(),room:House.here,
      walking:{x:House.W.x,z:House.W.z,seat:House.W.seat,lvl:House.W.lvl}}));
    async function leave(key='q'){
      if(key==='button')await p.locator('.hs-getup').click();else await p.keyboard.press(key);
      await until(()=>House.mode==='walk'&&!House.focused&&!House.gliding);
      assert.equal(await p.locator('.hs-phone-key').count(),0);
      assert.equal(await p.locator('.hs-inspection').count(),0,'Temporary grip panel cleaned up');
    }
    async function keysFit(){
      const rects=await p.locator('.hs-phone-key').evaluateAll(keys=>keys.map(k=>{
        const r=k.getBoundingClientRect();return {label:k.getAttribute('aria-label'),x:r.x,y:r.y,w:r.width,h:r.height};
      }));
      const {width,height}=p.viewportSize();assert.equal(rects.length,16);
      for(const r of rects)assert(r.x>=0&&r.y>=38&&r.x+r.w<=width&&r.y+r.h<=height-60,`Phone key clipped: ${JSON.stringify(r)}`);
      assert(rects.find(r=>r.label==='Phone 2 ABC').w>(height<540?25:43),'Close-up keypad too small');
      assert(await p.evaluate(()=>{
        const lcd=HouseMobile.thing.obj.children.find(o=>o.isMesh&&o.material?.map?.image?.classList?.contains('tb-lcd'));
        return !!lcd&&lcd.material.map.flipY===false&&HouseMobile.thing.obj.visible;
      }),'Same 3D phone and LCD, no body hand-over');
      assert.equal(await p.locator('.hs-mobwrap').count(),0);
    }
    async function fourAngles(placement){
      const basePose=await p.evaluate(()=>({...House.P}));
      for(const [angle,offset] of [['front',null],['left',[-.6,-.9,.25]],['right',[.6,-.9,.25]],['back',[0,-.85,-.6]]]){
        if(offset)await p.evaluate(({offset,basePose})=>{
          const H=House,T=H.T,o=HouseMobile.thing.obj;o.updateWorldMatrix(true,false);
          const m=new T.Matrix4().copy(H.root.matrixWorld).invert().multiply(o.matrixWorld);
          const target=new T.Vector3(0,-1.4,-.7).applyMatrix4(m),d=Math.hypot(basePose.x-target.x,basePose.y-target.y,basePose.z-target.z);
          const v=new T.Vector3(...offset).transformDirection(m).multiplyScalar(d*1.18);
          const eye=target.clone().add(v),delta=target.clone().sub(eye);
          Object.assign(H.P,{x:eye.x,y:eye.y,z:eye.z,rx:Math.atan2(-delta.y,Math.hypot(delta.x,delta.z))*180/Math.PI,ry:Math.atan2(delta.x,-delta.z)*180/Math.PI});H.dirty();
        },{offset,basePose});
        await p.waitForTimeout(120);await p.screenshot({path:`shots/mobile-phone-${size.tag}-${placement}-${angle}.png`});
      }
      await p.evaluate(pose=>{Object.assign(House.P,pose);House.dirty()},basePose);await p.waitForTimeout(120);
    }
    try {
      await p.evaluate(()=>House.hush());
      // Setup uses only this throwaway account's mobile. Real F/E and pointer
      // controls below exercise use/pickup/drop; no reset or backend shortcut.
      for(const placement of ['table','floor','held']){
        if(placement==='floor'){
          await p.evaluate(()=>{const H=House,t=HouseMobile.thing;t.at={room:'bedroom',x:40,y:73,z:155,ry:-24};t.st='rest';t.rx=t.rz=0;H.ROOMS.bedroom.things.add(t.obj);H.place(t);H.saveThings(true)});
        }
        if(placement==='held'){
          assert(await p.evaluate(()=>House.grab('mobile')));await p.waitForTimeout(700);await p.evaluate(()=>House.hush());
        }
        const before=await snapshot();
        if(placement==='held')await p.keyboard.press('f');else await p.evaluate(()=>HouseMobile.route());
        await until(()=>House.focused&&House.mode==='focus'&&document.querySelectorAll('.hs-phone-key').length===16);
        const opened=await snapshot();assert.deepEqual(opened.at,before.at);assert.deepEqual(opened.home,before.home);
        if(placement!=='held')assert.deepEqual(opened.position,before.position,'Using the phone must not move it');
        else {await p.waitForTimeout(120);assert.deepEqual((await snapshot()).position,opened.position,'Held phone stays fixed during use')}
        assert(!opened.walking.seat,'Using a phone leaves the standing state intact');
        await keysFit();await fourAngles(placement);
        assert.equal(await p.locator('[aria-label="Phone 7 PQRS"]').count(),1);
        await p.keyboard.press('c');
        const press=p.locator('[aria-label="Phone Menu / Select"]');
        if(size.touch)await press.tap();else await press.click();
        await until(()=>FamilyPhone.state().id==='menu');
        await p.keyboard.press('ArrowDown');await p.keyboard.press('Backspace');await p.keyboard.press('Enter');
        await until(()=>FamilyPhone.state().id==='menu');
        // Raw buffer checks: idle/same-pixel flushes never upload; 100 rapid
        // changed draws coalesce; the real 1 Hz phone may also repaint our test pixel.
        await p.waitForTimeout(150); // let the preceding real key's queued LCD upload finish
        const budget=await p.evaluate(async()=>{
          const o=HouseMobile.thing.obj,lcd=o.children.find(o=>o.material?.map?.image?.classList?.contains('tb-lcd'));
          const tex=lcd.material.map,cv=tex.image,g=cv.getContext('2d'),copy=document.createElement('canvas');copy.width=cv.width;copy.height=cv.height;const read=copy.getContext('2d',{willReadFrequently:true});read.drawImage(cv,0,0);const original=read.getImageData(0,0,cv.width,cv.height),version=tex.version;
          for(let i=0;i<100;i++)g.putImageData(original,0,0);
          await new Promise(r=>setTimeout(r,70));const unchanged=tex.version-version;
          const v=tex.version,changed=new ImageData(new Uint8ClampedArray(original.data),original.width,original.height);
          for(let i=0;i<100;i++){changed.data[0]=(original.data[0]+i+1)%256;g.putImageData(changed,0,0)}
          await new Promise(r=>setTimeout(r,70));const uploads=tex.version-v;
          g.putImageData(original,0,0);return {unchanged,uploads};
        });assert.equal(budget.unchanged,0);assert(budget.uploads>=1&&budget.uploads<=2,'Rapid LCD writes exceeded the 20 Hz budget: '+JSON.stringify(budget));
        if(size.touch){
          await p.setViewportSize({width:844,height:390});await p.waitForTimeout(180);await keysFit();
          await p.screenshot({path:`shots/mobile-phone-landscape-${placement}.png`});
          await p.setViewportSize({width:size.width,height:size.height});await p.waitForTimeout(180);await keysFit();
        }
        await leave(placement==='table'?'button':'q');
        const after=await snapshot();assert.deepEqual(after.at,before.at);assert.deepEqual(after.home,before.home);assert.equal(after.room,before.room);
        assert(Math.hypot(after.walking.x-before.walking.x,after.walking.z-before.walking.z)<.2);
        if(placement==='held')assert.equal(await p.evaluate(()=>House.held()),'mobile','Phone returns held');
        // Q during zoom, Esc pause/resume, and Esc > Back to the room.
        await p.evaluate(()=>HouseMobile.use());await p.waitForTimeout(65);await p.keyboard.press('q');
        await until(()=>House.mode==='walk'&&!House.focused&&!House.gliding);assert.equal(await p.locator('.hs-phone-key').count(),0);
        await p.evaluate(()=>HouseMobile.use());await p.waitForTimeout(65);await p.keyboard.press('Escape');
        assert(await p.evaluate(()=>HousePause.open));await p.keyboard.press('Escape');
        await until(()=>House.focused&&document.querySelectorAll('.hs-phone-key').length===16);
        await p.keyboard.press('Escape');await p.locator('[data-pause="leave"]').click();
        await until(()=>House.mode==='walk'&&!House.focused&&!House.gliding);
        if(placement==='held')assert.equal(await p.evaluate(()=>House.held()),'mobile');
      }
      // Carry into another room using a valid standing cell; the phone remains
      // in the hand in that room after leaving its close-up.
      await p.evaluate(()=>{
        const H=House,r=H.ROOMS.lounge;H.buildRoom(r);let cell;
        for(const a of r.area){for(let x=a[0]+20;x<a[2]-20&&!cell;x+=20)for(let z=a[1]+20;z<a[3]-20&&!cell;z+=20)if(H._.cellOk(r.lvl,x,z)&&H._.floorAt(x,z,r.lvl,H.LV[r.lvl]))cell={x,z};if(cell)break}
        if(!cell)throw Error('No valid lounge standing cell');
        const pose={...cell,y:H.LV[r.lvl]-(r.eye||128),rx:-8,ry:0,lvl:r.lvl,seat:0};Object.assign(H.P,pose);H.setWalkFrom(pose);H.dirty();
      });await p.waitForTimeout(700);
      assert.equal(await p.evaluate(()=>House.here),'lounge');
      await p.evaluate(()=>HouseMobile.use());await until(()=>House.focused&&document.querySelectorAll('.hs-phone-key').length===16);
      await leave();assert.equal(await p.evaluate(()=>House.here),'lounge');assert.equal(await p.evaluate(()=>House.held()),'mobile');
      await p.keyboard.press('e');await until(()=>HouseMobile.thing.st==='rest'&&!House.held());
      // Refresh during entry, settled focus, and return. None may resume at the
      // phone camera or seat the standing player. Phone placement snapshots
      // retain the saved physical location; held persistence belongs to House.
      for(const state of ['entry','focused','return']){
        const before=await snapshot();
        before.at.x=+before.at.x.toFixed(1);before.at.y=+before.at.y.toFixed(1);before.at.z=+before.at.z.toFixed(1);before.at.ry=Math.round(before.at.ry||0)||0;
        await p.evaluate(()=>{House.saveThings(true);HouseMobile.use()});
        if(state==='entry')await p.waitForTimeout(65);
        else {await until(()=>House.focused&&document.querySelectorAll('.hs-phone-key').length===16);if(state==='return'){await p.keyboard.press('q');await p.waitForTimeout(65)}}
        await p.reload({waitUntil:'domcontentloaded',timeout:45000});
        await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.HouseMobile?.thing&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));
        const after=await snapshot();assert.equal(after.room,before.room);assert(!after.walking.seat);
        assert(Math.hypot(after.walking.x-before.walking.x,after.walking.z-before.walking.z)<.3,'Refresh changed standing position');
        assert.deepEqual(after.at,before.at,'Refresh saved the replacement phone pose');
        assert(await p.evaluate(()=>document.querySelector('#bootPower canvas')?.width>0||House.ren.domElement.width>0));
        await p.screenshot({path:`shots/mobile-phone-${size.tag}-refresh-${state}.png`});
      }
      assert.deepEqual(errors,[]);console.log(`MOBILE PHONE ${size.tag} PASS: table/floor/held, four angles, key surfaces, zoom/cancel/Esc, LCD budget, room return and three refresh states`);
    }finally{await f.browser.close();activeBrowser=null}
  }
}finally{clearTimeout(watchdog);if(activeBrowser)await activeBrowser.close()}
