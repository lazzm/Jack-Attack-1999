import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const base=new URL(process.argv[2]);base.searchParams.set('allsoft','1');
const f=await roomFixture(base.href,{width:1366,height:860}),{page:p,browser,until,errors}=f;
async function step(fn){for(let i=0;i<100;i++){if(await p.evaluate(fn))return;await p.waitForTimeout(100)}throw Error('Game action timeout: '+fn)}
async function drag(from,to){await p.mouse.move(from.x,from.y);await p.mouse.down();await p.mouse.move(to.x,to.y,{steps:8});await p.mouse.up()}
try{
 await p.evaluate(()=>{House.sitDown()});await until(()=>House.mode==='monitor');
 for(const [width,height,locked]of [[1366,860,true],[1920,1080,false]]){
  await p.setViewportSize({width,height});await p.evaluate(v=>House.desktopDisplay(v),locked);
  await p.evaluate(()=>Apps.open('games.chess'));await until(()=>!!JGames.live.chess?.dbg);await p.evaluate(()=>JGames.live.chess.dbgLoad('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));
  await p.waitForTimeout(400);
  const points=await p.evaluate(()=>{const G=JGames.live.chess,cv=G.host.querySelector('canvas'),r=G.rect(cv),W=parseFloat(cv.style.width),H=parseFloat(cv.style.height),lab=Math.min(W,H)>300?16:12,sz=Math.max(8,Math.floor((Math.min(W,H)-lab*2-6)/8)),ox=Math.floor((W-sz*8)/2),oy=Math.floor((H-sz*8)/2);return {from:G.client(r.left+ox+4.5*sz,r.top+oy+6.5*sz),to:G.client(r.left+ox+4.5*sz,r.top+oy+4.5*sz),native:W,parent:cv.parentElement.clientWidth}});
  assert(Math.abs(points.native-points.parent)<=1,'Canvas is sized from projected pixels');
  await drag(points.from,points.to);await step(()=>JGames.live.chess.dbg().moves.length>0);assert.equal(await p.evaluate(()=>JGames.live.chess.dbg().moves[0]),'e4');
  await p.screenshot({path:`shots/pc-game-chess-${width}.png`});await p.evaluate(()=>JGames.live.chess.w.close());
  await p.evaluate(()=>Apps.open('games.jigsaw'));await until(()=>!!JGames.live.jigsaw?.dbg);await p.waitForTimeout(300);
  const before=await p.evaluate(()=>JGames.live.jigsaw.w.status.textContent);await p.evaluate(()=>window.expectedJigsawCount=(parseInt(JGames.live.jigsaw.w.status.textContent)||0)+1);const piece=await p.evaluate(()=>JGames.live.jigsaw.dbg.pieceAt(0));assert(piece);
  await drag({x:piece.x,y:piece.y},{x:piece.tx,y:piece.ty});await step(()=>JGames.live.jigsaw.w.status.textContent.startsWith(window.expectedJigsawCount+' of '));
  assert.notEqual(await p.evaluate(()=>JGames.live.jigsaw.w.status.textContent),before);await p.screenshot({path:`shots/pc-game-jigsaw-${width}.png`});await p.evaluate(()=>JGames.live.jigsaw.w.close());
 }
 assert.deepEqual(errors,[]);console.log('PC GAME MONITOR INPUT PASS: real mouse chess move and jigsaw drag; native canvas sizing and screen transform at 1366 LOCK IN and 1920 in-world');
}catch(e){await p.screenshot({path:'shots/pc-game-input-failure.png'});console.log(await p.evaluate(()=>({expected:window.expectedJigsawCount,status:JGames.live.jigsaw?.w.status.textContent,piece:JGames.live.jigsaw?.dbg.pieceAt(0),chess:JGames.live.chess?.dbg()})));throw e}finally{await browser.close()}
