// House scale survey: eye-height captures of every room, the stairs both ways, the drive and the street.
// node tests/house-scale.mjs http://localhost:PORT before|after [--tier=low|medium|high] [--only=name,name] [--eye=143] [--width=1366 --height=860]
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],tag=process.argv[3]||'after';
const tier=process.argv.find(a=>a.startsWith('--tier='))?.slice(7)||'low';
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7)?.split(',');
if(!/^[\w-]+$/.test(tag))throw Error('bad tag');
const dir=fileURLToPath(new URL('./shots/house-scale/'+tag+'/',import.meta.url));
await mkdir(dir,{recursive:true});
const EYE=+(process.argv.find(a=>a.startsWith('--eye='))?.slice(6)||143); // the live standing eye (hs-world.js STAND)
const UE=73-EYE,GE=353-EYE,CE=353-112;
// [name, level, eye, target]
const VIEWS=[
 ['bedroom-door','U',[225,UE,215],[-220,40,-20]],
 ['bedroom-corner','U',[-255,UE,-30],[220,10,230]],
 ['bedroom-up','U',[0,UE,100],[0,-185,60]],
 ['landing-top','U',[300,UE,180],[370,200,560]],
 ['landing-corridor','U',[290,UE,670],[300,-30,150]],
 ['landing-from-bedroom','U',[262,UE,200],[300,0,690]],
 ['stairs-down-mid','U',[370,UE+120,400],[370,330,620]],
 ['stairs-up-bottom','G',[370,GE,670],[370,40,300]],
 ['stairs-up-diag','G',[240,GE,680],[380,80,330]],
 ['hall-front','G',[300,GE,680],[300,230,70]],
 ['hall-back','G',[260,GE,90],[300,240,690]],
 ['cupboard','G',[370,CE,425],[370,300,260]],
 ['lounge-door','G',[180,GE,640],[-260,260,360]],
 ['lounge-corner','G',[-255,GE,330],[170,250,690]],
 ['kitchen-door','G',[180,GE,270],[-260,260,-40]],
 ['kitchen-corner','G',[-250,GE,-40],[180,250,280]],
 ['garden-back','G',[0,GE,-520],[0,120,-56]],
 ['garden-patio','G',[100,GE,-90],[-120,260,-500]],
 ['drive-door','G',[300,GE,740],[420,260,1100]],
 ['drive-gate','G',[330,GE,1080],[330,150,700]],
 ['car-side','G',[190,GE,900],[430,280,900]],
 ['car-front-q','G',[230,GE,1080],[430,280,880]],
 ['street-pavement','G',[-200,GE,1150],[400,240,850]],
 ['street-wide','G',[-300,GE,1000],[400,180,800]],
 ['drive-overhead','G',[250,-900,1010],[250,353,1011]],
 ['street-opposite','G',[150,GE,1360],[300,150,800]],
 ['car-rear-boot','G',[380,GE,760],[500,260,990]],
 ['front-step','G',[300,GE,760],[520,250,1000]],
 // round 2: the street carries on both ways, the crossroads and the corner shop, the far end of the back road
 ['street-east','G',[700,GE,1430],[3000,250,1520]],
 ['street-west','G',[-330,GE,1430],[-3000,250,1520]],
 ['street-across','G',[300,GE,1430],[300,220,2400]],
 ['front-wall-hedge','G',[-150,GE,1100],[-150,250,1300]],
 ['garden-far','G',[0,GE,-300],[-600,-120,-2400]],
 ['lounge-from-door','G',[188,GE,520],[-280,270,470]],
 ['lounge-to-window','G',[-60,GE,375],[-60,250,700]],
 ['lounge-fire','G',[95,GE,521],[-280,290,500]],
];
const W=+(process.argv.find(a=>a.startsWith('--width='))?.slice(8)||1366),Hh=+(process.argv.find(a=>a.startsWith('--height='))?.slice(9)||860);
const fx=await roomFixture(base,{tier,opening:true,width:W,height:Hh,touch:W<800,account:'Scale'+Date.now().toString(36)});
const {page:p,view,errors}=fx;
const report=[];
try{
 await p.evaluate(()=>{Object.values(House.ROOMS).forEach(r=>House.buildRoom(r));for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,true,true);House.dirty()});
 await p.waitForTimeout(800);
 for(const [name,lvl,eye,target] of VIEWS){
  if(only&&!only.includes(name))continue;
  await view(eye,target,{level:lvl});await p.waitForTimeout(700);
  await p.screenshot({path:dir+tier+(W<800?'-phone':'')+'-'+name+'.png'});
  report.push({name,lvl,eye,target,room:await p.evaluate(()=>House.W?.room||House.cur?.id||null)});
  console.log('SHOT',name);
 }
 await writeFile(dir+tier+'-report.json',JSON.stringify({report,errors},null,1));
 if(errors.length)console.log('ERRORS',errors);
}finally{await fx.browser.close()}
