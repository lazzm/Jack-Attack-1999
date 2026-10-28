// Owner layout comparison only. Browser request override; production source and real data stay untouched.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2];assert(base&&['localhost','127.0.0.1'].includes(new URL(base).hostname));
const root=fileURLToPath(new URL('../',import.meta.url)),shots=root+'tests/shots/front-clearance-preview/';await mkdir(shots,{recursive:true});
const source=await readFile(root+'app/public/js/hs-world.js','utf8'),report=[];
const changes=[['FZ: 1300, STREET:','FZ: 1400, STREET:'],['pave: [1300, 1445], kerb: 1450, road: [1455, 2015], farKerb: 2020, farPave: [2025, 2170]','pave: [1400, 1545], kerb: 1550, road: [1555, 2115], farKerb: 2120, farPave: [2125, 2270]'],['HEDGE: Object.freeze([1228.5, 1284])','HEDGE: Object.freeze([1328.5, 1384])']];
let six=source;for(const[from,to]of changes){if(six.includes(to))six=six.replace(to,from);else assert(six.includes(from),'Preview patch no longer matches')}
let deeper=six;for(const[from,to]of changes)deeper=deeper.replace(from,to)
for(const[profile,width,height]of [['desktop',1366,860],['phone',390,844]])for(const[variant,body]of [['six-metres',six],['seven-metres',deeper]]){
 const f=await roomFixture(base,{opening:true,width,height,touch:profile==='phone',onPage:async page=>{await page.route('**/js/hs-world.js*',route=>route.fulfill({body,contentType:'application/javascript'}))}});
 try{
  const {page,view,errors}=f;
  await page.evaluate(()=>{for(const r of Object.values(House.ROOMS))House.buildRoom(r);HouseFamily.debug.hide(true)});
  const m=await page.evaluate(()=>{const F=House.FRONT,c=House.ROOMS.drive.carFrame,step=House.ROOMS.drive.supports.find(s=>s.x0<=300&&s.x1>=300&&s.z0>=700&&s.z1<=800);return{frame:{...c},fz:F.FZ,step:step.z1,behind:c.z-205*c.s-step.z1,ahead:F.FZ-5-(c.z+205*c.s),eye:353-House.STAND}});
  report.push({profile,variant,...m});console.log('CLEARANCE '+JSON.stringify(report.at(-1)));
  for(const[name,eye,target]of [
   ['doorstep',[300,m.eye,760],[500,270,m.frame.z-100]],
   ['gateway',[700,m.eye,m.fz+65],[500,280,m.frame.z+160]],
   ['gable',[700,m.eye,950],[420,90,450]],
   ['hedge',[-150,m.eye,1100],[-150,260,m.fz]]
  ]){await view(eye,target,{level:'G'});await page.screenshot({path:shots+profile+'-'+variant+'-'+name+'.png'})}
  assert.deepEqual(errors,[]);
 }finally{await f.browser.close()}
}
await writeFile(shots+'report.json',JSON.stringify(report,null,2));console.log('FRONT CLEARANCE PREVIEW PASS: matched desktop/phone views; production source unchanged');
