/* Play together (public/js/mp.js): who is playing what right now, the JackNet-wide "Who wants to play?" lobby, and
 * online results that only count once the players agree on them.
 *   client -> { t:'mpHere', g:[ids] }            what this visitor is playing / using right now (max 6 ids)
 *   client -> { t:'mpSeek', g, note } | { t:'mpUnseek', g }   put your name up (or take it down) in the lobby
 *   client -> { t:'mpOpen', sid, g, ids:[...] }   a host starting an online game with these visitors
 *   client -> { t:'mpResult', sid, w }            w = the winner's visitor id (0 = a draw); counted once two players agree
 *   client -> { t:'mpTop' }                       -> { t:'mpTop', top:[[name, wins], ...] }
 *   server -> { t:'mpNow', n:{ id: count }, seeks:[{ id, nick, g, note, ts, lost }] }   (throttled, and on hello)
 * A dropped connection doesn't take anybody out of the counts or the lobby straight away: the server gives a visitor
 * who comes back within 3 minutes the same id, so their entries just wait (marked "lost") and carry on. */
'use strict';
const GID = /^[a-z0-9.]{2,24}$/;
const GRACE = 180000;
let ctx;
const here = new Map(); // visitor id -> { g: [...], lost: ts|0 }
let seeks = []; // { id, nick, g, note, ts, lost }
const sessions = new Map(); // sid -> { g, ids: Set, votes: Map(id -> w), done, ts }
let nowT = 0;

function counts() {
  const n = {};
  const t = Date.now();
  for (const h of here.values()) if (!h.lost || t - h.lost < 30000) for (const g of h.g) n[g] = (n[g] || 0) + 1; // a blip still counts; a goodbye stops counting after 30 s
  return n;
}
const view = () => ({ t: 'mpNow', n: counts(), seeks: seeks.map(s => ({ id: s.id, nick: s.nick, g: s.g, note: s.note, ts: s.ts, lost: s.lost ? 1 : 0 })) });
function changed() { // at most one broadcast a second
  if (nowT) return;
  nowT = setTimeout(() => { nowT = 0; ctx.broadcast(view()); }, 1000);
}
function top() {
  const w = ctx.data.wins || {};
  return Object.values(w).sort((a, b) => b.w - a.w).slice(0, 15).map(x => [x.name, x.w, x.g]);
}

module.exports = {
  name: 'mp',
  types: ['mpHere', 'mpSeek', 'mpUnseek', 'mpOpen', 'mpResult', 'mpTop'],
  init(c) {
    ctx = c;
    ctx.data.wins = ctx.data.wins || {};
    ctx.on('hello', (ws, cl) => {
      const h = here.get(cl.id); if (h) h.lost = 0;
      let any = false; for (const s of seeks) if (s.id === cl.id && s.lost) { s.lost = 0; s.nick = cl.nick; any = true; }
      ctx.send(ws, view()); if (h || any) changed();
    });
    ctx.on('close', cl => {
      const h = here.get(cl.id); if (h) h.lost = Date.now();
      for (const s of seeks) if (s.id === cl.id) s.lost = Date.now();
      changed(); setTimeout(changed, 31000).unref(); // they stop counting as "playing now" after 30 s
    });
    setInterval(() => {
      const t = Date.now(); let ch = false;
      const live = new Set([...ctx.clients.values()].map(x => x.id));
      for (const [id, h] of here) if ((h.lost && t - h.lost > GRACE) || (!h.lost && !live.has(id))) { here.delete(id); ch = true; }
      const before = seeks.length;
      seeks = seeks.filter(s => !(s.lost && t - s.lost > GRACE) && t - s.ts < 20 * 60000 && (s.lost || live.has(s.id)));
      if (seeks.length !== before) ch = true;
      for (const [sid, s] of sessions) if (t - s.ts > 4 * 3600000) sessions.delete(sid);
      if (ch) changed();
    }, 15000);
  },
  handle(ws, c, m) {
    if (!c.mpRl) c.mpRl = { here: new ctx.Bucket(2, 10), seek: new ctx.Bucket(0.2, 4), open: new ctx.Bucket(0.5, 6), res: new ctx.Bucket(0.5, 6) };
    const rl = c.mpRl;
    switch (m.t) {
      case 'mpHere': {
        if (!rl.here.take() || !Array.isArray(m.g)) return;
        const g = [...new Set(m.g.filter(x => typeof x === 'string' && GID.test(x)))].slice(0, 6);
        if (!g.length) here.delete(c.id); else here.set(c.id, { g, lost: 0 });
        return changed();
      }
      case 'mpSeek': {
        const g = String(m.g || ''); if (!GID.test(g) || !rl.seek.take()) return;
        const note = ctx.delink(ctx.clean(m.note, 60));
        seeks = seeks.filter(s => !(s.id === c.id && s.g === g));
        if (seeks.filter(s => s.id === c.id).length >= 3) return ctx.send(ws, { t: 'err', msg: 'You are already waiting for three games. Give someone a chance to answer!' });
        seeks.push({ id: c.id, nick: c.nick, g, note, ts: Date.now(), lost: 0 });
        if (seeks.length > 60) seeks.shift();
        return changed();
      }
      case 'mpUnseek': {
        const g = String(m.g || ''), before = seeks.length;
        seeks = seeks.filter(s => !(s.id === c.id && (g === '*' || s.g === g)));
        if (seeks.length !== before) changed();
        return;
      }
      case 'mpOpen': { // a host says "I'm starting game sid with these people"; results for it need two of them to agree
        const sid = String(m.sid || ''), g = String(m.g || '');
        if (!/^[a-z0-9]{6,12}$/.test(sid) || !GID.test(g) || !Array.isArray(m.ids) || !rl.open.take()) return;
        const live = new Set([...ctx.clients.values()].map(x => x.id));
        const ids = new Set([c.id, ...m.ids.map(x => x | 0).filter(x => x > 0 && live.has(x))].slice(0, 8));
        const old = sessions.get(sid);
        if (old && !old.ids.has(c.id)) return; // somebody else's game
        if (ids.size < 2) return;
        sessions.set(sid, { g, ids, votes: old ? old.votes : new Map(), done: old ? old.done : false, ts: Date.now() });
        if (sessions.size > 4000) sessions.delete(sessions.keys().next().value);
        return;
      }
      case 'mpResult': {
        const s = sessions.get(String(m.sid || '')), w = m.w | 0;
        if (!s || s.done || !s.ids.has(c.id) || !(w === 0 || s.ids.has(w)) || !rl.res.take()) return;
        s.votes.set(c.id, w);
        const agree = [...s.votes.values()].filter(x => x === w).length;
        if (agree < 2) return;
        s.done = true;
        if (!w) return;
        const win = [...ctx.clients.values()].find(x => x.id === w);
        if (!win || !win.member) return; // only JackNet members go on the board (a guest's name is gone tomorrow)
        const key = win.member.toLowerCase(), e = ctx.data.wins[key] = ctx.data.wins[key] || { name: win.member, w: 0, g: {} };
        e.name = win.member; e.w++; e.g[s.g] = (e.g[s.g] || 0) + 1;
        ctx.markDirty();
        ctx.broadcast({ t: 'mpTop', top: top() });
        return;
      }
      case 'mpTop': return ctx.send(ws, { t: 'mpTop', top: top() });
    }
  },
};
