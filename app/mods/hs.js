/* hs: Jack's house (js/hs-world.js and friends). Everything here pays Rupees through econ's earn path (daily caps; the
 * browser never says how much): the biscuit tin (once a day), Mom's jobs on the fridge (the day's three, see
 * public/js/hs-cat.js), Saturday pocket money (Saturdays in 1999 terms: the site's "today"), and BEFUDDLED!, the TELLY-TEXT
 * quiz (ten questions a day, the same ten for everyone; the answers live only here).
 *   client -> { t:'hsMe' }             <- { t:'hsMe', member, chores:[ids], done:[ids], tin, pocket, saturday }
 *   client -> { t:'hsTin' }            <- { t:'hsTin', amt, again? }
 *   client -> { t:'hsChore', id }      <- { t:'hsChore', id, amt, done:[ids] }
 *   client -> { t:'hsPocket' }         <- { t:'hsPocket', amt, why? }
 *   client -> { t:'hsQ', i }           <- { t:'hsQ', i, n, q, o:[4], prev?: { a, ok, right } }
 *   client -> { t:'hsA', i, a }        <- { t:'hsA', i, ok, right, amt, score, all }
 * Data: state.mods.hs = { v, p: { memberKey: { tin: day, ch: { day, done:[] }, pk: day, q: { day, a: { i: [answer, ok] } } } } } */
'use strict';
const path = require('path');
const crypto = require('crypto');
const HC = require(path.join(__dirname, '..', 'public', 'js', 'hs-cat.js'));
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const ECON = require('./econ.js');

const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
let ctx, D, E;
const keyOfC = c => { if (!c || !c.member) return null; const k = String(c.member).toLowerCase(); return BADKEY.test(k) ? null : k; };
const today = () => E.uk().day;
function P(key) {
  let p = D.p[key];
  if (!p || typeof p !== 'object') { p = D.p[key] = {}; ctx.markDirty(); }
  if (!p.ch || typeof p.ch !== 'object') p.ch = { day: '', done: [] };
  if (!p.q || typeof p.q !== 'object') p.q = { day: '', a: {} };
  if (p.ch.day !== today()) { p.ch = { day: today(), done: [] }; }
  if (p.q.day !== today()) { p.q = { day: today(), a: {} }; }
  return p;
}

// ================================================================ BEFUDDLED! (kid friendly, true in 1999, nothing after it)
// [question, the right answer, three wrong ones]
const QB = [
  ['How many squares are on each face of a standard Rubik\'s cube?', '9', '4', '6', '16'],
  ['Which planet is known as the Red Planet?', 'Mars', 'Venus', 'Jupiter', 'Saturn'],
  ['In 1969, who was the first person to walk on the Moon?', 'Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'John Glenn'],
  ['How many players are on the pitch for one football team?', '11', '9', '10', '12'],
  ['What colour do you get mixing blue and yellow paint?', 'Green', 'Purple', 'Orange', 'Brown'],
  ['What does "CD" stand for in CD-ROM?', 'Compact Disc', 'Computer Data', 'Cool Disk', 'Colour Display'],
  ['How many bits are in a byte?', '8', '4', '10', '16'],
  ['Which is the largest planet in our solar system?', 'Jupiter', 'Saturn', 'Neptune', 'Earth'],
  ['How many sides does a hexagon have?', '6', '5', '7', '8'],
  ['What is the capital city of France?', 'Paris', 'Lyon', 'Marseille', 'Nice'],
  ['What is frozen water called?', 'Ice', 'Steam', 'Dew', 'Fog'],
  ['How many days are there in a leap year?', '366', '365', '364', '360'],
  ['Which animal is known as the King of the Jungle?', 'The lion', 'The tiger', 'The elephant', 'The gorilla'],
  ['What is the biggest ocean on Earth?', 'The Pacific', 'The Atlantic', 'The Indian', 'The Arctic'],
  ['How many minutes are there in an hour?', '60', '100', '30', '90'],
  ['Which gas do plants take in from the air to make food?', 'Carbon dioxide', 'Oxygen', 'Helium', 'Nitrogen'],
  ['What is the name of our galaxy?', 'The Milky Way', 'Andromeda', 'The Galaxy Bar', 'Orion'],
  ['How many legs does a spider have?', '8', '6', '10', '12'],
  ['What does a "modem" connect your computer to?', 'The phone line', 'The telly', 'The printer', 'The mouse'],
  ['How many years are in a century?', '100', '10', '1000', '50'],
  ['What shape is a stop sign?', 'Octagon', 'Hexagon', 'Square', 'Circle'],
  ['Which is the tallest mountain in the world?', 'Mount Everest', 'K2', 'Ben Nevis', 'Kilimanjaro'],
  ['What is 12 times 12?', '144', '124', '122', '132'],
  ['Who wrote Romeo and Juliet?', 'William Shakespeare', 'Charles Dickens', 'Roald Dahl', 'Jane Austen'],
  ['What is the chemical symbol for gold?', 'Au', 'Ag', 'Go', 'Gd'],
  ['How many strings does a standard guitar have?', '6', '4', '5', '12'],
  ['Which country is shaped a bit like a boot?', 'Italy', 'Spain', 'Greece', 'Portugal'],
  ['What is the largest mammal in the world?', 'The blue whale', 'The elephant', 'The giraffe', 'The hippo'],
  ['How many colours are there in a rainbow?', '7', '5', '6', '8'],
  ['In which country are the pyramids of Giza?', 'Egypt', 'Mexico', 'Peru', 'India'],
  ['What is the longest river in the world?', 'The Nile', 'The Thames', 'The Amazon', 'The Severn'],
  ['Which is closest to the Sun?', 'Mercury', 'Venus', 'Earth', 'Mars'],
  ['What do bees make?', 'Honey', 'Jam', 'Butter', 'Syrup'],
  ['Which UK city is home to Big Ben?', 'London', 'Edinburgh', 'Cardiff', 'Manchester'],
  ['What is 1999 in Roman numerals?', 'MCMXCIX', 'MIM', 'MXMIX', 'MCMLXIX'],
  ['How many players are in a cricket team?', '11', '9', '13', '15'],
  ['What does "WWW" stand for?', 'World Wide Web', 'World Wide Wires', 'Wide Web Window', 'Web Without Wires'],
  ['How many sides does a 50p coin have?', '7', '6', '8', '5'],
  ['Which animal does a tadpole grow up to be?', 'A frog', 'A fish', 'A newt', 'A lizard'],
  ['What is the freezing point of water in Celsius?', '0 degrees', '10 degrees', '32 degrees', '100 degrees'],
  ['How many hours are there in a day?', '24', '12', '20', '36'],
  ['What colour is a polar bear\'s skin?', 'Black', 'White', 'Pink', 'Grey'],
  ['Which instrument has 88 keys?', 'The piano', 'The violin', 'The trumpet', 'The drums'],
  ['What do you call a baby kangaroo?', 'A joey', 'A cub', 'A kid', 'A calf'],
  ['How many continents are there?', '7', '5', '6', '8'],
  ['In the game of chess, which piece can only move diagonally?', 'The bishop', 'The rook', 'The knight', 'The king'],
  ['How many pence make a pound?', '100', '10', '12', '240'],
  ['What is a group of lions called?', 'A pride', 'A pack', 'A herd', 'A flock'],
  ['What is the hardest natural substance?', 'Diamond', 'Iron', 'Granite', 'Glass'],
  ['How many weeks are there in a year?', '52', '48', '50', '56'],
  ['Which planet has the famous rings?', 'Saturn', 'Mars', 'Mercury', 'Venus'],
  ['Which shape has three sides?', 'A triangle', 'A square', 'A pentagon', 'A circle'],
  ['What colour is an emerald?', 'Green', 'Red', 'Blue', 'Yellow'],
  ['What is the opposite of "north"?', 'South', 'East', 'West', 'Up'],
  ['What does a thermometer measure?', 'Temperature', 'Weight', 'Speed', 'Height'],
  ['In which year did the Second World War end?', '1945', '1918', '1939', '1950'],
  ['What does "RAM" stand for in computers?', 'Random Access Memory', 'Read And Move', 'Really Awesome Machine', 'Rapid Action Mode'],
  ['How many noughts are in one million?', '6', '5', '7', '9'],
  ['What is the main language spoken in Brazil?', 'Portuguese', 'Spanish', 'Brazilian', 'French'],
  ['Which is the smallest prime number?', '2', '1', '3', '0'],
];
const DAYN = 10;
const H32 = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
function daySet(day) { // ten question numbers for the day, and each one's answer order
  const idx = QB.map((_, i) => i); const out = []; let h = H32('befuddled|' + day);
  while (out.length < DAYN) { out.push(idx.splice(h % idx.length, 1)[0]); h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; }
  return out.map((qi, n) => { const ord = [0, 1, 2, 3]; let g = H32(day + '|' + qi + '|' + n); for (let i = 3; i > 0; i--) { const j = g % (i + 1); [ord[i], ord[j]] = [ord[j], ord[i]]; g = Math.imul(g ^ (g >>> 13), 2654435761) >>> 0; } return { qi, ord }; });
}
function qView(day, i) { const s = daySet(day)[i]; const Q = QB[s.qi]; return { q: Q[0], o: s.ord.map(k => Q[1 + k]), right: s.ord.indexOf(0) }; }

// ================================================================ the handlers
function me(ws, c) {
  const key = keyOfC(c), day = today(), chores = HC.choresFor(day), sat = HC.dow99(day) === 6;
  if (!key) return ctx.send(ws, { t: 'hsMe', member: false, chores, done: [], tin: false, pocket: false, saturday: sat });
  const p = P(key);
  ctx.send(ws, { t: 'hsMe', member: true, chores, done: p.ch.done, tin: p.tin === day, pocket: p.pk === day, saturday: sat });
}
function tin(ws, c) {
  const key = keyOfC(c); if (!key) return ctx.send(ws, { t: 'hsTin', amt: 0, guest: 1 });
  const p = P(key), day = today();
  if (p.tin === day) return ctx.send(ws, { t: 'hsTin', amt: 0, again: 1 });
  p.tin = day; ctx.markDirty();
  const a = E.acct(c), amt = a ? Math.max(0, E.earnA(a, 'hstin', 'A biscuit and a few coins in the biscuit tin', 5 + crypto.randomInt(0, 11))) : 0;
  ctx.send(ws, { t: 'hsTin', amt });
}
function chore(ws, c, m) {
  const key = keyOfC(c), id = String(m.id || ''), day = today();
  if (!own(HC.CHORE, id)) return;
  if (!key) return ctx.send(ws, { t: 'hsChore', id, amt: 0, guest: 1 });
  const p = P(key);
  if (!HC.choresFor(day).includes(id) || p.ch.done.includes(id)) return ctx.send(ws, { t: 'hsChore', id, amt: 0, done: p.ch.done });
  // (a job takes a little while: no more than one every 20 seconds)
  if (c.hsChoreT && Date.now() - c.hsChoreT < 20000) return ctx.send(ws, { t: 'hsChore', id, amt: 0, done: p.ch.done, slow: 1 });
  c.hsChoreT = Date.now();
  p.ch.done.push(id); ctx.markDirty();
  // (no Rupees here: the browser can't prove a job was done. Agent J's mods/ch.js pays the real, checked 3D chores; this only keeps
  // the fridge list's ticks for the no-chores fallback)
  ctx.send(ws, { t: 'hsChore', id, amt: 0, done: p.ch.done });
}
function pocket(ws, c) {
  const key = keyOfC(c), day = today(); if (!key) return ctx.send(ws, { t: 'hsPocket', amt: 0, guest: 1 });
  if (HC.dow99(day) !== 6) return ctx.send(ws, { t: 'hsPocket', amt: 0, why: 'not saturday' });
  const p = P(key); if (p.pk === day) return ctx.send(ws, { t: 'hsPocket', amt: 0, why: 'had it' });
  p.pk = day; ctx.markDirty();
  const a = E.acct(c), amt = a ? Math.max(0, E.earnA(a, 'hspocket', 'Saturday pocket money from Mom')) : 0;
  ctx.send(ws, { t: 'hsPocket', amt });
}
function quizQ(ws, c, m) {
  const i = Math.floor(+m.i); if (!(i >= 0 && i < DAYN)) return;
  const day = today(), v = qView(day, i), key = keyOfC(c);
  const rec = key ? P(key).q.a : ((c.hsQ && c.hsQ.day === day) ? c.hsQ.a : null);
  const prev = rec && own(rec, i) ? { a: rec[i][0], ok: !!rec[i][1], right: v.right } : undefined;
  ctx.send(ws, { t: 'hsQ', i, n: DAYN, q: v.q, o: v.o, prev });
}
function quizA(ws, c, m) {
  const i = Math.floor(+m.i), ans = Math.floor(+m.a); if (!(i >= 0 && i < DAYN) || !(ans >= 0 && ans < 4)) return;
  const day = today(), v = qView(day, i), key = keyOfC(c);
  let rec;
  if (key) rec = P(key).q.a; else { if (!c.hsQ || c.hsQ.day !== day) c.hsQ = { day, a: {} }; rec = c.hsQ.a; }
  if (own(rec, i)) return ctx.send(ws, { t: 'hsA', i, ok: !!rec[i][1], right: v.right, amt: 0, again: 1, score: Object.values(rec).filter(x => x[1]).length });
  const ok = ans === v.right; rec[i] = [ans, ok ? 1 : 0];
  let amt = 0, all = false;
  const score = Object.values(rec).filter(x => x[1]).length, answered = Object.keys(rec).length;
  if (key) {
    ctx.markDirty();
    const a = E.acct(c);
    if (a && ok) amt += Math.max(0, E.earnA(a, 'hsquiz', 'BEFUDDLED! right answer'));
    if (answered === DAYN && score === DAYN) { all = true; if (a) amt += Math.max(0, E.earnA(a, 'hsquizall', 'BEFUDDLED! every answer right')); }
  } else if (answered === DAYN && score === DAYN) all = true;
  ctx.send(ws, { t: 'hsA', i, ok, right: v.right, amt, score, answered, all, guest: key ? undefined : 1 });
}

function handle(ws, c, m) {
  if (!c.hsB) c.hsB = new ctx.Bucket(4, 10);
  if (!c.hsB.take()) return;
  switch (m.t) {
    case 'hsMe': return me(ws, c);
    case 'hsTin': return tin(ws, c);
    case 'hsChore': return chore(ws, c, m);
    case 'hsPocket': return pocket(ws, c);
    case 'hsQ': return quizQ(ws, c, m);
    case 'hsA': return quizA(ws, c, m);
  }
}

module.exports = {
  name: 'hs',
  types: ['hsMe', 'hsTin', 'hsChore', 'hsPocket', 'hsQ', 'hsA'],
  init(x) {
    ctx = x; D = x.data;
    D.v = 1; D.p = D.p || {};
    E = ECON.api; if (!E || !E.earnA) { console.error('hs: econ is missing'); return; }
    for (const k in HC.EARN) if (!ECAT.EARN[k]) ECAT.EARN[k] = HC.EARN[k];
  },
  handle,
  _test: { get D() { return D; }, daySet, qView, QB },
};
