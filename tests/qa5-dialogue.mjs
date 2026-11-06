globalThis.talkAttempt=async(id,n,tag)=>{
 const before=report.events.length;
 await wait(()=>!HouseFamily.debug.speech.cur&&!HouseFamily.debug.speech.q.length,null,30000).catch(()=>{});
 const c=await p.evaluate(id=>{const c=HouseFamily.chars[id];return{x:c.x,y:House.LV[c.lvl]-(c.seated?95:115),z:c.z}},id);
 await nlook(c.x,c.y,c.z);
 const pick=await p.evaluate(()=>{const h=House.pick(innerWidth/2,innerHeight/2);return h&&{spot:h.spot,dist:h.dist}});
 if(pick?.spot!=='np.'+id)throw Error('QA5 setup missed '+id+': '+JSON.stringify(pick));
 await p.keyboard.press('f');await p.waitForTimeout(700);
 if(f.errors.length)throw Error('QA5 browser errors: '+f.errors.join('; '));
 const speech=await p.evaluate(()=>({cur:HouseFamily.debug.speech.cur&&{id:HouseFamily.debug.speech.cur.c.id,line:HouseFamily.debug.speech.cur.lineId,text:HouseFamily.debug.speech.cur.text},q:HouseFamily.debug.speech.q.map(q=>({id:q.c.id,line:q.lineId,text:q.text}))}));
 await log('talk-attempt',{tag,id,n,pick,speech,pose:await state()});
 if(n===1||n===7||n===10)await qshot('talk-'+tag+'-'+id+'-'+n);
 await wait(id=>!HouseFamily.debug.speech.cur||HouseFamily.debug.speech.cur.c.id!==id,id,20000).catch(()=>{});
 await p.waitForTimeout(3500);
 await log('talk-delivered',{tag,id,n,lines:report.events.slice(before).filter(e=>e.label==='speech').map(e=>e.data.args.slice(0,3))});
};
for(let n=1;n<=10;n++)for(const id of ['mom','dad','sister'])await talkAttempt(id,n,'10am');
await log('MORNING-MATRIX-COMPLETE',true);
