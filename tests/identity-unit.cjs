'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Identity = require('../app/identity');
const {execFileSync} = require('node:child_process');
const path = require('node:path');
for (const file of ['app/identity.js', 'app/server.js', 'app/public/js/net.js', 'app/public/js/cast.js', 'app/public/js/account-gate.js', 'app/public/js/timeline.js', 'app/public/js/cx-mag-b.js', 'app/public/js/events-cat.js', 'tests/identity-unit.cjs', 'tests/identity.mjs', 'tests/room-fixture.mjs']) execFileSync(process.execPath, ['--check', path.join(__dirname, '..', file)]);

const source = fs.readFileSync(require.resolve('../app/server.js'), 'utf8');
const filter = source.slice(source.indexOf('const BAD ='), source.indexOf('// No links please'));
const clean = vm.runInNewContext(filter + '\nclean');
for (const [raw, first] of [['jo', 'Jo'], ['sArAh', 'Sarah'], ['ANNE-MARIE', 'Anne-Marie'], ["o'NEIL", "O'Neil"], ['abcdefghijklmn', 'Abcdefghijklmn'], ['Dave', 'Dave']]) {
  assert.deepEqual(Identity.validate({first: raw, g: 'f'}, clean), {me: {first, g: 'f', v: 1}});
}
for (const first of ['', 'A', 'abcdefghijklmno', ' Jo', 'Jo ', 'Jo\n', 'Jo\u200b', '-Jo', 'Jo-', "Jo''Jo", 'Jo-Jo-Jo', 'Jo2', 'Jo Jo', '<Jo>', 'Cunts', 'Retard']) {
  assert(Identity.validate({first, g: 'm'}, clean).error, 'Accepted ' + JSON.stringify(first));
}
for (const value of [null, {}, {first: 'Jo', g: 'x'}, {first: {}, g: 'f'}]) assert(Identity.validate(value, clean).error);
const legacy = {name: 'Older', cash: 123, rupees: 45, tokens: ['keep'], pc: {save: 99}};
const before = structuredClone(legacy);
assert.equal(Identity.current('older', legacy), null);
assert(Identity.set('older', legacy, {first: 'Jo', g: 'f'}, clean).me);
assert.deepEqual(legacy, {...before, me: {first: 'Jo', g: 'f', v: 1}});
const owner = {me: {first: 'Wrong', g: 'f'}};
assert.deepEqual(Identity.current('jack', owner), {first: 'Jack', g: 'm', v: 1});
assert(Identity.set('JACK', owner, {first: 'Sue', g: 'f'}, clean).error);
assert.equal(owner.me.first, 'Jack');
const castSource = fs.readFileSync(require.resolve('../app/public/js/cast.js'), 'utf8');
function cast(seed) {
  const values = new Map([['jhp_cast_seed', String(seed)]]), context = {window: {}, localStorage: {getItem: k => values.get(k), setItem: (k, v) => values.set(k, v)}};
  vm.runInNewContext(castSource, context);
  return context.window.Cast;
}
const a = cast(123), b = cast(987654), ids = ['sister', 'mate1', 'mate2', 'mate3', 'mate4'];
a.bind('SarahAccount', {first: 'Sarah', g: 'f'}); b.bind('sarahaccount', {first: 'Sarah', g: 'f'});
assert.deepEqual(ids.map(a.n), ids.map(b.n), 'House family must roam across browsers and old seeds');
const family = ids.map(a.n), cousin = a.n('cousin');
a.bind('OtherAccount', {first: 'Dave', g: 'm'});
assert.notDeepEqual(ids.map(a.n), family);
a.bind('SarahAccount', {first: 'Sarah', g: 'f'});
assert.deepEqual(ids.map(a.n), family);
assert.equal(a.n('cousin'), cousin, 'Keep the old roaming cast');
assert.equal(a.seed(), 123);
assert.equal(a.me().he, 'she'); assert.equal(a.me().son, 'daughter'); assert.equal(a.me().lad, 'girl');
assert.equal(a.t('{me} packed {me.his} bag. {me.He} is a {me.boy} and a {me.lad}.'), 'Sarah packed her bag. She is a girl and a lass.');
assert.equal(a.t('{me?boy|girl}'), 'girl');
assert.deepEqual(['jack', 'dave', 'luke', 'callum', 'jackk', 'jsister'].map(a.n), ['Jack', 'Dave', 'Luke', 'Callum', 'JackK', 'Crystal']);
assert.equal(a.idOfSlug('lucy'), 'jsister');
assert(!ids.map(a.n).includes('Crystal'));
a.bind('Jack', {first: 'Sarah', g: 'f'});
assert.deepEqual(ids.map(a.n), ['Crystal', 'Dave', 'Luke', 'Callum', 'JackK']);
assert.equal(a.me().first, 'Jack'); assert.equal(a.me().g, 'm');
assert.equal(a.first('mate4'), 'Jack');
assert.equal(a.t('{me} is {me.kid} / {me.lad}'), 'Jack is son / lad');
// Catalogues can require Cast without a browser global.
assert.equal(require('../app/public/js/cast').n('jsister'), 'Crystal');
console.log('PASS identity validation, owner lock, additive storage, account seeding, templates and server-side loading');
