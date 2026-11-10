// Poll truthiness without returning a scene graph through Playwright's value serializer.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const line=fs.readFileSync(path.join(__dirname,'room-fixture.mjs'),'utf8').split('\n').find(l=>l.trim().startsWith('async function until('));
let calls=0,disposed=0;const mesh={isMesh:true};mesh.parent=mesh;
const page={evaluate(){throw Error('Would serialize the scene graph')},async evaluateHandle(){const value=++calls<3?null:mesh;return{async evaluate(f){return f(value)},async dispose(){disposed++},jsonValue(){throw Error('Would serialize the scene graph')}}},async waitForTimeout(){}};
const until=vm.runInNewContext('('+line.trim()+')',{page,errors:[],timeoutScale:1,debug:false});
until(()=>mesh).then(()=>{assert.equal(calls,3);assert.equal(disposed,3);console.log('FIXTURE PREDICATE PASS: false polls, cyclic truthy scene handle, primitive result, all handles disposed')}).catch(e=>{console.error(e);process.exitCode=1});

// Cupboard's identity check must retain the live game without returning its
// track buffers through Playwright. Execute the actual callback, then verify
// identity and progress remain available to later assertions.
{
 const source=fs.readFileSync(path.join(__dirname,'cupboard.mjs'),'utf8');
 const callback=source.match(/await p\.evaluate\((\(\)=>\{window\.cupGame=RoomTV\.dbg\(\);[^}]*\})\)/)?.[1];
 assert(callback,'Missing in-page cupboard identity callback');
 const game={frame:12,dbg:{T:{tex:new Uint8Array(4096)}}},window={};
 const result=vm.runInNewContext('('+callback+')()',{window,RoomTV:{dbg:()=>game}});
 assert.equal(result,undefined,'Returning K serializes its multi-million-entry track buffers');
 assert.equal(window.cupGame,game);assert.equal(window.cupFrame,12);game.frame++;
 assert(window.cupGame.frame>window.cupFrame,'In-page game progress must remain observable');
 console.log('CUPBOARD IDENTITY PASS: primitive return, retained live identity and progress');
}
