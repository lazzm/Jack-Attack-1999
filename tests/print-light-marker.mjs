import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';

// Run only against a fresh localhost DATA_DIR. --before records known failures.
const base = process.argv[2] || 'http://localhost:18274';
const before = process.argv.includes('--before');
const probeOnly = process.argv.includes('--probe-only');
const markerOnly = process.argv.includes('--marker-only');
const touch = process.argv.includes('--touch');
const tag = (before ? 'before' : 'after') + (touch ? '-touch' : '') + (markerOnly ? '-markers' : '');
const dir = `shots/print-light-marker-${tag}`;
await mkdir(dir, {recursive:true});
const {browser,page,errors,until,view} = await roomFixture(base,{touch,width:touch?390:1366,height:touch?844:860});
const posters = [
  ['band',[-178,-64,-55.75],[0,0,1],'posterBand'], ['film',[-236,-96,-55.75],[0,0,1],'posterFilm'],
  ['shuttle',[-52,-82,-55.75],[0,0,1],'posterShuttle'], ['game',[-279.75,-70,20],[1,0,0],'posterGame'],
  ['robot',[-10,-98,249.75],[0,0,-1],'posterRobot']
];
const findings = {tag, markers:[], posters:[]};
const shot = name => page.screenshot({path:`${dir}/${name}.png`});
function eyeFor(name,target,normal,distance,side,standing=false) {
  // Straight back from the film print intersects furniture. Offset into the
  // clear aisle instead of mistaking an occluder's pixels for the paper.
  if(name==='film'&&distance>=140)side=60;
  return target.map((v,i)=>i===1&&standing?-55:v+normal[i]*distance+(i===0?normal[2]*side:i===2?-normal[0]*side:0));
}
async function marker() {
  return page.evaluate(() => {
    const m = House.root.children.find(o => o.material?.color?.getHex() === 0xffd84a);
    return m ? {visible:m.visible, layer:m.layers.mask, position:m.position.toArray(),
      scale:m.scale.toArray(), rotation:m.rotation.toArray().slice(0,3), noPick:!!m.userData.noPick} : null;
  });
}
async function record(name, expectedVisible) {
  const m = await marker(); findings.markers.push({name,...m}); await shot(name);
  if (!before) assert.equal(!!m?.visible, expectedVisible, name);
  return m;
}
async function shelf(held=true) {
  const pose = await page.evaluate(() => {
    const t=House.THINGS['media.box.ps.run'];
    return {id:t.id,x:t.home.x,y:t.home.y-6.3,z:-36};
  });
  await view([-220,-55,35],[pose.x,pose.y,pose.z]);
  await page.evaluate(({id,held}) => {House._.setMode('walk'); if(held)House.grab(id);}, {...pose,held});
  await page.waitForTimeout(650);
  return pose;
}
async function sample(target, composite=false) {
  return page.evaluate(({target,composite}) => new Promise(resolve => {
    House.dirty(); requestAnimationFrame(() => {
      const src=document.querySelector('.hs-gl'), c=document.createElement('canvas');
      c.width=src.width; c.height=src.height; const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0);
      if(composite){const front=document.querySelector('.hs-gl2');if(front&&front.isConnected&&getComputedStyle(front).display!=='none')g.drawImage(front,0,0,c.width,c.height);}
      const p=House.toScreen(...target), data=g.getImageData(Math.round(p.x)-2,Math.round(p.y)-2,5,5).data;
      resolve([0,1,2].map(ch=>Array.from({length:25},(_,i)=>data[i*4+ch]).reduce((a,b)=>a+b)/25));
    });
  }), {target,composite});
}
try {
  if(before&&!probeOnly){
    // Serve the committed engine only in this disposable browser: no worktree rollback.
    const source=execFileSync('git',['show','HEAD:app/public/js/hs-world.js'],{encoding:'utf8'});
    await page.route('**/js/hs-world.js*',route=>route.fulfill({body:source,contentType:'application/javascript'}));
    await page.reload({waitUntil:'domcontentloaded'});
    await until(()=>AccountGate.allowed&&House.live&&!document.querySelector('.hs-loading,#houseEntry'));
  }
  await page.evaluate(() => HouseArt.postersReady);
  if(!markerOnly){
  // Remove image detail only for numeric diagnostics. With a uniform map,
  // camera-dependent brightness is material shading, not texture minification.
  await page.evaluate(()=>{
    const c=document.createElement('canvas');c.width=c.height=8;const g=c.getContext('2d');g.fillStyle='#808080';g.fillRect(0,0,8,8);
    window.printProbeMap=new THREE.CanvasTexture(c);
    window.printProbeMaterials=[];
    const maps=['posterBand','posterFilm','posterShuttle','posterGame','posterRobot'].map(n=>HouseArt.t(n));
    House.scene.traverse(o=>{for(const m of o.material?[].concat(o.material):[])if(maps.includes(m.map)&&!printProbeMaterials.some(p=>p.m===m))printProbeMaterials.push({m,map:m.map,specular:m.specular?.clone()})});
  });
  findings.paperProbe=[];
  for (const matte of [false,true]) {
    await page.evaluate(matte=>{for(const p of printProbeMaterials){p.m.map=printProbeMap;if(p.m.specular)p.m.specular.copy(matte?new THREE.Color('#000'):p.specular);p.m.needsUpdate=true;}},matte);
    for(const [name,target,normal] of posters) {
      for(const [angle,distance,side] of [['near',65,0],['far',140,0],['oblique',95,35]]) {
        const eye=eyeFor(name,target,normal,distance,side,true);
        await view(eye,target);
        findings.paperProbe.push({name,matte,angle,distance,rgb:await sample(target)});
      }
    }
  }
  await page.evaluate(()=>{for(const p of printProbeMaterials){p.m.map=p.map;if(p.m.specular)p.m.specular.copy(p.specular);p.m.needsUpdate=true;}printProbeMap.dispose();House.dirty()});
  findings.paperSummary=[];
  for(const [name] of posters){
    const values=findings.paperProbe.filter(p=>p.name===name&&p.matte);
    const delta=Math.max(...[0,1,2].map(ch=>Math.max(...values.map(v=>v.rgb[ch]))-Math.min(...values.map(v=>v.rgb[ch]))));
    findings.paperSummary.push({name,matteMaxDelta:delta});
    assert(delta<=2,`${name}: uniform matte paper changed brightness by ${delta}`);
  }
  console.log('Uniform paper max RGB change:',JSON.stringify(findings.paperSummary));
  }
  if(probeOnly){await writeFile(`${dir}/paper-probe.json`,JSON.stringify(findings.paperProbe,null,2)+'\n');process.exitCode=0;}
  else {
  for (const size of touch?[{width:390,height:844}]:[{width:1366,height:860},{width:390,height:844}]) {
    await page.setViewportSize(size);
    const label=size.width===390?'narrow':'desktop';
    for (const [name,target,normal] of markerOnly?[]:posters) {
      const values=[];
      for (const [angle,distance,side] of [['near',65,0],['far',140,0],['oblique',95,35]]) {
        const eye=eyeFor(name,target,normal,distance,side);
        await view(eye,target);
        values.push({angle,rgb:await sample(target),rig:await page.evaluate(()=>House._.lightingSnapshot('bedroom'))});
        await shot(`${label}-${name}-${angle}`);
      }
      findings.posters.push({label,name,values});
      assert.deepEqual(values[0].rig,values[1].rig,'Camera distance changed the room lighting rig');
    }
    await shelf();
    const active=await record(`${label}-marker-active`,true);
    if (!before) {assert.equal(active.layer,1,'Marker must share room depth');assert(active.noPick);}
    // A whole-room tidy used to leave a yellow marker alive with no held item.
    await page.evaluate(()=>House.tidy('bedroom'));await page.waitForTimeout(500);
    await record(`${label}-marker-tidy`,false);
    await shelf();if(touch)await page.locator('[data-h=put]').tap();else await page.keyboard.press('e');await page.waitForTimeout(600);
    assert.equal(await page.evaluate(()=>House.held()),null);
    assert.equal(await page.evaluate(()=>House.THINGS['media.box.ps.run'].st),'snap');
    await record(`${label}-marker-drop`,false);
    await shelf();await page.keyboard.press('Escape');await page.waitForTimeout(200);
    await record(`${label}-marker-menu`,false);
    await page.keyboard.press('Escape');await page.waitForTimeout(250);
    if(touch)await page.locator('[data-h=back]').tap();else await page.evaluate(()=>House.putBack());await page.waitForTimeout(600);
    await record(`${label}-marker-cancel`,false);
    const pose=await shelf();if(touch)await page.locator('[data-h=inspect]').tap();else await page.keyboard.press('i');await until(()=>House.mode==='inspect');
    await record(`${label}-marker-inspect`,false);
    if(touch)await page.locator('.hs-inspection button').tap();else await page.keyboard.press('q');await until(()=>House.mode==='walk');
    await page.evaluate(()=>House.putBack());await page.waitForTimeout(600);
    await shelf();
    // A real shelf/wall between eye and target must occlude the preview.
    await view([-220,-55,35],[pose.x,pose.y,pose.z]);
    await page.evaluate(()=>House._.setMode('walk'));
    await page.waitForTimeout(300);
    await page.evaluate(()=>{
      const m=House.root.children.find(o=>o.material?.color?.getHex()===0xffd84a);
      House.THINGS[House.held()].obj.visible=false; // exclude the held prop's idle sway from the pixel comparison
      const blocker=new THREE.Mesh(new THREE.BoxGeometry(40,40,3),new THREE.MeshBasicMaterial({color:0x17395b}));
      blocker.name='marker-test-blocker';blocker.userData.noPick=true;
      blocker.position.copy(m.position);blocker.position.z+=10;House.ROOMS.bedroom.group.add(blocker);House.dirty();
    });
    await page.waitForTimeout(200);await shot(`${label}-marker-occluded`);
    const blockerPoint=await page.evaluate(()=>House.scene.getObjectByName('marker-test-blocker').position.toArray());
    const withMarker=await sample(blockerPoint,true);
    await page.evaluate(()=>{House.root.children.find(o=>o.material?.color?.getHex()===0xffd84a).material.opacity=0;House.dirty()});
    await page.waitForTimeout(200);
    const withoutMarker=await sample(blockerPoint,true);
    const delta=Math.max(...withMarker.map((v,i)=>Math.abs(v-withoutMarker[i])));
    findings.markers.push({name:`${label}-occlusion-sample`,withMarker,withoutMarker,delta});
    if(!before)assert(delta<=1,'Marker shines through an opaque foreground object');
    await page.evaluate(()=>{House.THINGS[House.held()].obj.visible=true;House.root.children.find(o=>o.material?.color?.getHex()===0xffd84a).material.opacity=.35;const b=House.scene.getObjectByName('marker-test-blocker');b.parent.remove(b);b.geometry.dispose();b.material.dispose();House.putBack();House.saveThings(true)});
    await page.waitForTimeout(600);
    await shelf();await page.reload({waitUntil:'domcontentloaded'});
    await until(()=>AccountGate.allowed&&House.live&&!document.querySelector('.hs-loading,#houseEntry'));
    assert.equal(await page.evaluate(()=>House.mode),'walk','Refresh changed standing state');
    assert.equal(await page.evaluate(()=>House.held()),null);
    await record(`${label}-marker-refresh`,false);
    // A controlled snap exercises the generic cached aim independently of a
    // rack's own acceptance ray. Turn and drop in one frame, before 120ms.
    const stale=[];
    for(let attempt=0;attempt<3;attempt++){
      await view([-150,-55,80],[-150,-55,-56]);
      await page.evaluate(()=>{
        House._.setMode('walk');const hit=House.pick(innerWidth/2,innerHeight/2);
        const p=hit.p;House.snap('test.marker-aim',{room:'bedroom',...p,r:8,pose:{...p,y:p.y+14},accepts:(kind,t)=>t.id==='reading.book.1'});
        House.grab('reading.book.1');
      });await page.waitForTimeout(450);
      stale.push(await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{House.P.ry+=90;House.drop();resolve(House.THINGS['reading.book.1'].st==='anim')}))));
      await page.waitForTimeout(500);
      await page.evaluate(()=>{House.tidy('bedroom');delete House.SNAPS['test.marker-aim']});
    }
    findings.markers.push({name:`${label}-stale-aim`,snappedAfterTurningAway:stale});
    if(!before)assert(stale.every(v=>!v),'A drop used a cached target after turning away');
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${dir}/findings.json`,JSON.stringify(findings,null,2)+'\n');
  console.log(`PRINT/MARKER ${tag.toUpperCase()} PASS: ${markerOnly?'':'five posters near/far/oblique; '}marker tidy/drop/menu/cancel/inspect/refresh, occlusion and rapid turn/drop; zero browser errors/warnings. Findings: ${dir}/findings.json`);
  }
} catch(e) {
  await shot('failure');await writeFile(`${dir}/findings.json`,JSON.stringify(findings,null,2)+'\n');throw e;
} finally {await browser.close();}
