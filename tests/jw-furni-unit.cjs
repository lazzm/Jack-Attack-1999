'use strict';
// In-memory throwaway state only. Does not initialise either mod or read DATA_DIR.
const assert = require('node:assert/strict');
const {checkFurni} = require('../app/mods/jw.js')._test;
const C = require('../app/public/js/jw-cat.js');
const id = Object.keys(C.FURNI).find(k => !C.FURNI[k].pub&&C.FURNI[k].k!=='w');
assert(id);
const placement = u => ({u,id,x:1,y:2,r:0,s:1});
const item = (u,more={}) => ({u,id,...more});
const rooms = {bad:null,noOwner:{f:[placement(90)]},badList:{o:'alice',f:{}},
  absent:{o:'absent',f:[placement(91)]},missing:{o:'missing',f:[placement(92)]},
  corrupt:{o:'corrupt',f:[placement(93)]},
  first:{o:'alice',f:[null,{},'bad',{u:8,id:{toString:0}},placement(1),placement(2),placement(3),placement(4),placement(5),placement(6),placement(7),{u:8,id:'unknown'}]},
  last:{o:'bob',f:[placement(10)]}};
const players={alice:{it:[null,{},item(1),item(2,{lk:'jw'}),item(3,{lk:'t9'}),item(5,{id:'wrong'}),item(6),item(6),item(7,{lk:false}),item(8)]},bob:{it:[item(10,{lk:''})]},corrupt:{it:{}},missing:{}};
rooms.gone={o:'gone',f:[placement(99)]};players.gone={it:[item(99)]};
rooms.badPlacement={o:'alice',f:[{u:11,id}, {...placement(12),x:1e9},{...placement(13),r:'0'},{...placement(14),s:{}}]};
players.alice.it.push(...[11,12,13,14].map(u=>item(u)));
const wallId=Object.keys(C.FURNI).find(k=>!C.FURNI[k].pub&&C.FURNI[k].k==='w');assert(wallId);
rooms.wall={o:'bob',f:[{u:15,id:wallId,w:'L',x:1,y:0,z:0,s:0}]};players.bob.it.push({u:15,id:wallId});
for(const R of Object.values(rooms))if(R&&typeof R==='object')R.md='box';
rooms.badModel={o:'alice',md:{toString:0},f:[placement(16)]};players.alice.it.push(item(16));
const state={members:{alice:{},bob:{},corrupt:{},missing:{},absent:{},gone:null},mods:{loot:{p:players}}};
const original=structuredClone(state), roomSnapshot=structuredClone(rooms);
// Reproduces real load order: loot.api.P exists, but its module data is undefined.
assert.throws(()=>require('../app/mods/loot.js').api.P('alice'),/reading 'p'/);
assert.equal(checkFurni(state,rooms),3);
original.mods.loot.p.alice.it[2].lk='jw';original.mods.loot.p.bob.it[0].lk='jw';original.mods.loot.p.bob.it[1].lk='jw';
assert.deepEqual(state,original,'Only verified unlocked owned items may acquire jw locks');
assert.deepEqual(rooms,roomSnapshot,'Never remove/rewrite any room or placement, including unresolved references');
assert.equal(checkFurni(state,rooms),0,'Idempotent restart');
for(const badRooms of [null,undefined,'bad',17])assert.equal(checkFurni(state,badRooms),0);
for(const loot of [undefined,{}, {p:null},{p:[]},{p:{}}]){
 const s={members:{alice:{}},mods:{loot}},before=structuredClone(s);
 assert.equal(checkFurni(s,rooms),0);assert.deepEqual(s,before);assert.deepEqual(rooms,roomSnapshot);
}
console.log('PASS jw furni: real pre-loot load order, missing/corrupt/duplicate/conflicting records, later rooms, locks and idempotence; no room loss');
