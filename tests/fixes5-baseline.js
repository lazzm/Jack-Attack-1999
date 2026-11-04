// Restore tracked source in this browser only, without changing the checkout.
const {execFileSync}=await import('node:child_process');
const changed=execFileSync('git',['diff','--name-only','--','app/public'],{encoding:'utf8'}).trim().split('\n');
for(const path of changed){
 const body=execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'});
 await p.route('**/'+path.slice('app/public/'.length)+'*',r=>r.fulfill({body,contentType:path.endsWith('.css')?'text/css':'application/javascript'}));
}
await p.reload({waitUntil:'domcontentloaded'});
await wait(()=>!!window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'),null,120000);
await wait(()=>!House.gliding,null,120000);
f.errors.length=0;
if(await p.evaluate(()=>!!window.RoomTV?.open_))await p.evaluate(()=>RoomTV.close(true));
await wait(()=>!House.gliding);if(await p.evaluate(()=>House.mode==='monitor'))await p.keyboard.press('q');await wait(()=>House.mode==='walk');
process.env.FIXES5_PHASE='before';
