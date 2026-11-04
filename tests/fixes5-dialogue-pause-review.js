// Final speech wrapping and a deliberately slowed, real sit/menu finger race.
await p.touchscreen.tap(4,4);
await p.evaluate(async()=>{await Chores.load();await Chores.part('kitchen')});
const source=await readFile('tests/fixes5-ui-review.js','utf8');
const prefix=source.slice(0,source.indexOf('await p.evaluate(()=>{HousePause')).replace('[[1024,768],[768,1024],[1180,820],[1366,1024]]','[[1024,768],[768,1024]]');
await eval('(async()=>{'+prefix+source.slice(source.indexOf('// An ordinary talking distance'),source.indexOf('// Open Menu'))+'})()');
await aim([60,-70,170],[0,-35,-10]);await rotate(1024,768);
const old=await p.evaluate(()=>{const old=House.motion.ms.pc;House.motion.ms.pc=8000;House.sitDown();return old});
try{
 await wait(()=>document.documentElement.dataset.touchState==='pc');await press('menu');
 const during=await p.evaluate(()=>({mode:House.mode,gliding:House.gliding,open:HousePause.open}));await log('slow-menu-during-sit',during);
 if(!during.open||!during.gliding||during.mode!=='sit')throw Error('The test did not open Menu during the sit glide');
 await wait(()=>House.mode==='monitor'&&!House.gliding);
 for(const [width,height]of [[1024,768],[768,1024]]){
  await rotate(width,height);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true)))));
  const actions=await p.evaluate(()=>({leave:!document.querySelector('[data-pause=leave]').hidden,lock:!document.querySelector('[name=desktopFull]').disabled}));await log('settled-menu-actions',actions);
  if(!actions.leave||!actions.lock)throw Error('Pause menu retained pre-sit actions');
  await p.screenshot({path:`tests/shots/fixes5/after-${width}x${height}-pause-after-sit.png`});
 }
 await press('[data-pause=leave]');await wait(()=>House.mode==='walk'&&!House.gliding);
}finally{await p.evaluate(old=>House.motion.ms.pc=old,old)}
await p.evaluate(()=>House.sitDown());await wait(()=>House.mode==='monitor'&&!House.gliding);
await eval('(async()=>{'+source.slice(0,source.indexOf('await p.evaluate(()=>{HousePause'))+source.slice(source.indexOf('await p.evaluate(async()=>{if(window.Era'))+'})()');
await log('dialogue-pause-review-complete',true);
