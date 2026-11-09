'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/public/js/hs-pause.js'),'utf8');
const start=source.indexOf(' let menuPan=null,'),end=source.indexOf(' const guidance=',start);
assert(start>0&&end>start,'Production pause pan binding');
const handlers=new Map(),captures=[],released=[];
const el={open:true,scrollTop:0,scrollHeight:1000,clientHeight:300,
 addEventListener(type,fn){handlers.set(type,fn)},setPointerCapture(id){captures.push(id)},releasePointerCapture(id){released.push(id)}};
const box={closest:()=>null},range={closest:s=>s.startsWith('select,')?range:null};
const context={el};vm.runInNewContext(source.slice(start,end),context);
function fire(type,extra={}){const e={pointerType:'touch',pointerId:7,clientX:100,clientY:500,target:box,detail:1,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...extra};handlers.get(type)(e);return e}
fire('pointerdown');fire('pointermove',{clientY:480});assert.equal(el.scrollTop,20);
// Transferring implicit capture from the touched child bubbles this event.
fire('lostpointercapture',{target:box});fire('pointermove',{clientY:300});assert.equal(el.scrollTop,200);
assert.deepEqual(captures,[7]);fire('pointerup',{target:el});assert.deepEqual(released,[7]);
let click=fire('click');assert(click.prevented&&click.stopped,'A pan activated its original button');
// A new, stationary button press must work immediately after a pan.
fire('pointerdown');fire('pointerup');click=fire('click');assert(!click.prevented&&!click.stopped);
fire('pointerdown',{target:range});fire('pointermove',{target:range,clientY:100});assert.equal(el.scrollTop,200,'Range drag was taken by the menu');
fire('pointerdown',{pointerType:'mouse'});fire('pointermove',{pointerType:'mouse',clientY:100});assert.equal(el.scrollTop,200);
fire('pointerdown');fire('pointermove',{clientX:200,clientY:495});assert.equal(el.scrollTop,200,'Horizontal motion became a vertical pan');
fire('pointermove',{clientY:600});assert.equal(el.scrollTop,100);fire('pointercancel',{target:el});fire('pointermove',{clientY:200});assert.equal(el.scrollTop,100,'Cancelled pan remained active');
fire('pointerdown');fire('pointermove',{clientY:-500});assert.equal(el.scrollTop,700,'Pan exceeded the last setting');context.stopMenuPan();
fire('pointermove',{clientY:100});assert.equal(el.scrollTop,700,'Closing the menu left a drag active');
console.log('PAUSE PAN UNIT PASS: vertical motion, capture transfer, cancel/close, bounds, click suppression, immediate next press, native range and mouse');
