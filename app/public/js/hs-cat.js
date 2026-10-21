/* hs-cat: the house's shared catalogue (the browser's js/hs-life.js and the server's mods/hs.js both read it, so a chore or
 * an earn rule is only written down once). Rupees only ever move on the server (mods/hs.js, through econ's capped earn path).
 *   CHORES       the jobs Mom leaves on the fridge (three a day, the same three for everybody that day)
 *   choresFor(day)  'yyyy-mm-dd' (the UK day) -> [three chore ids]
 *   dow99(day)   the day of the week that date was in 1999 (0 = Sunday): pocket money comes on Saturdays
 *   EARN         the house's earn sources (added to econ's table by mods/hs.js) */
(function (root) {
  'use strict';
  const CHORES = [
    { id: 'washup', n: 'Do the washing up', where: 'the kitchen sink', done: 'Washing up done. One plate is still a bit eggy. Mom will never know.' },
    { id: 'bin', n: 'Take the bin out', where: 'the kitchen bin', done: 'Bin bag out to the dustbin. It split a bit. Only a bit.' },
    { id: 'hoover', n: 'Hoover your room', where: 'the hoover (under the stairs)', done: 'Room hoovered. Mostly round things. It ate a sock.' },
    { id: 'table', n: 'Set the table for tea', where: 'the kitchen table', done: 'Table set: four plates, four forks, the ketchup. Job done.' },
    { id: 'washing', n: 'Take your washing downstairs', where: 'your washing basket', done: 'Washing basket emptied into the machine. Mom found a tissue in a pocket. Oops.' },
    { id: 'tidy', n: 'Tidy your room (put things back where they live)', where: 'your room', done: 'Room tidy! Everything back where it lives. Mom might faint.' },
    { id: 'cat', n: "Put next door's cat out", where: 'your bed', done: 'The cat went back out the window. It will be back. It is always back.' },
  ];
  const CHORE = {}; for (const c of CHORES) CHORE[c.id] = c;
  function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  function choresFor(day) {
    const ids = CHORES.map(c => c.id), out = []; let h = hash('chores|' + day);
    while (out.length < 3) { out.push(ids.splice(h % ids.length, 1)[0]); h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; }
    return out;
  }
  function dow99(day) { const [, m, d] = String(day).split('-').map(Number); return new Date(Date.UTC(1999, m - 1, m === 2 && d === 29 ? 28 : d)).getUTCDay(); }
  const EARN = {
    hstin: { amt: 10, cap: 1, drop: 0.1, label: 'Raided the biscuit tin' },
    hspocket: { amt: 25, cap: 1, label: 'Pocket money (Saturday!)' },
    hsquiz: { amt: 2, cap: 10, half: 6, label: 'TELLY-TEXT quiz: right answer' },
    hsquizall: { amt: 10, cap: 1, drop: 0.2, label: 'TELLY-TEXT quiz: every answer right' },
  };
  const C = { CHORES, CHORE, choresFor, dow99, EARN, hash };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.HouseCat = C;
})(typeof window !== 'undefined' ? window : this);
