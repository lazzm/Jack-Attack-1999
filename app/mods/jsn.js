/* JSN Messenger Service: live instant messages between signed-in JackNet members.
 * Only the contact lists are kept (state.mods.jsn.u). Messages are passed straight through and never stored anywhere.
 *   u[memberKey] = { fl: [keys] contacts, al: [keys] allowed to see me + message me, bl: [keys] blocked, rl: [keys] "added you" (waiting for an answer) }
 *   client -> { t:'jsnIn', st }      sign in (JackNet members only)  <- { t:'jsnHi', me, fl:[{name,no,st}], rl:[{name,no}], al:[names], bl:[names] }
 *   client -> { t:'jsnOut' }         sign out                        <- { t:'jsnBye' }
 *   client -> { t:'jsnSt', st }      my status: NLN BSY BRB AWY PHN LUN HDN (HDN = Appear Offline)
 *   client -> { t:'jsnAdd', to }     add a contact by member name, member number or name@jackmail.webcom  <- { t:'jsnAdded', c } | { t:'jsnErr', err }
 *   client -> { t:'jsnDel', name }   remove a contact                <- { t:'jsnDeleted', name }
 *   client -> { t:'jsnAllow', name, allow, add }   answer "<name> has added you" (or move someone between Allow and Block)  <- { t:'jsnLists', al, bl }
 *   client -> { t:'jsnMsg', to, text, cid }        <- { t:'jsnAck', cid, ok, err? }; the other person gets { t:'jsnMsg', from, text, ts }
 * The server also pushes { t:'jsnPres', name, st, sign } when a contact's status changes (st 'FLN' = Not Online; sign = just signed in)
 * and { t:'jsnReq', name, no } when somebody adds you. You only ever see (and can message) people who have allowed you. */
'use strict';
const STATUS = new Set(['NLN', 'BSY', 'BRB', 'AWY', 'PHN', 'LUN', 'HDN']);
const MAX_LIST = 150, MAX_RL = 40;
let ctx;
const sessions = new Map(); // client info -> { key, st, ws, since }

const keyOf = name => String(name || '').toLowerCase().slice(0, 40);
const mem = key => ctx.state.members[key] || null;
function lists(key) {
  const U = ctx.data.u = ctx.data.u || {};
  const u = U[key] = U[key] || {};
  for (const k of ['fl', 'al', 'bl', 'rl']) if (!Array.isArray(u[k])) u[k] = [];
  return u;
}
function findMember(to) {
  let s = String(to == null ? '' : to).trim().toLowerCase().slice(0, 60);
  s = s.replace(/@jackmail\.webcom$/, '').replace(/^#/, '');
  if (!s) return null;
  if (/^\d{1,7}$/.test(s)) { const no = +s; return Object.keys(ctx.state.members).find(k => ctx.state.members[k].no === no) || null; }
  return ctx.state.members[s] ? s : null;
}
// the status everyone else sees for this member (ignoring who is allowed)
function liveSt(key) {
  let best = null;
  for (const s of sessions.values()) if (s.key === key && (!best || s.since > best.since)) best = s;
  return best ? best.st : 'FLN';
}
// what `viewer` sees for `key`
function seenSt(viewer, key) {
  const st = liveSt(key);
  if (st === 'FLN' || st === 'HDN') return 'FLN';
  const u = lists(key);
  return u.al.includes(viewer) && !u.bl.includes(viewer) ? st : 'FLN';
}
// a session whose connection just dropped (s.ws = null) is a "ghost" for a minute: messages for it wait in s.q
function sendTo(key, msg) { let n = 0; for (const [c, s] of sessions) if (s.key === key) { if (s.ws) ctx.send(s.ws, msg); else if (msg.t === 'jsnMsg' && s.q.length < 10) s.q.push(msg); else continue; n++; } return n; }
const card = (viewer, k) => { const m = mem(k); return m ? { name: m.name, no: m.no, st: seenSt(viewer, k) } : null; };

// tell everyone who has `key` on their list what they now see
const lastSeen = new Map(); // viewer + '>' + key -> st (so nobody gets the same news twice)
function fanout(key) {
  const m = mem(key); if (!m) return;
  const viewers = new Set([...sessions.values()].map(s => s.key));
  for (const v of viewers) {
    if (v === key || !lists(v).fl.includes(key)) continue;
    const st = seenSt(v, key), id = v + '>' + key, was = lastSeen.get(id) || 'FLN';
    if (st === was) continue;
    lastSeen.set(id, st);
    sendTo(v, { t: 'jsnPres', name: m.name, st, sign: was === 'FLN' && st !== 'FLN' });
  }
}
function hello(c, s) {
  const u = lists(s.key), m = mem(s.key);
  // forget members that no longer exist
  let changed = false;
  for (const k of ['fl', 'al', 'bl', 'rl']) { const keep = u[k].filter(x => mem(x)); if (keep.length !== u[k].length) { u[k] = keep; changed = true; } }
  if (changed) ctx.markDirty();
  const fl = u.fl.map(k => card(s.key, k)).filter(Boolean);
  for (const x of fl) lastSeen.set(s.key + '>' + keyOf(x.name), x.st);
  ctx.send(s.ws, { t: 'jsnHi', me: { name: m.name, no: m.no, st: s.st }, fl, rl: u.rl.map(k => ({ name: mem(k).name, no: mem(k).no })), al: u.al.map(k => mem(k).name), bl: u.bl.map(k => mem(k).name) });
}
function signOut(c, why) {
  const s = sessions.get(c); if (!s) return;
  sessions.delete(c);
  if (why && s.ws) ctx.send(s.ws, { t: 'jsnBye', why });
  if (liveSt(s.key) === 'FLN') for (const id of [...lastSeen.keys()]) if (id.startsWith(s.key + '>')) lastSeen.delete(id);
  fanout(s.key);
}
const err = (ws, e, extra) => ctx.send(ws, Object.assign({ t: 'jsnErr', err: e }, extra || {}));
const add = (arr, k, max) => { if (!arr.includes(k)) { arr.push(k); if (arr.length > max) arr.splice(0, arr.length - max); return true; } return false; };
const drop = (arr, k) => { const i = arr.indexOf(k); if (i >= 0) { arr.splice(i, 1); return true; } return false; };

module.exports = {
  name: 'jsn',
  types: ['jsnIn', 'jsnOut', 'jsnSt', 'jsnAdd', 'jsnDel', 'jsnAllow', 'jsnMsg'],
  init(c) {
    ctx = c;
    ctx.data.u = ctx.data.u || {};
    // a connection blip isn't a sign-out: contacts see no change for a minute, and the same visitor picks the session
    // back up (with any messages that arrived meanwhile) when they reconnect
    ctx.on('close', cl => { const s = sessions.get(cl); if (!s) return; s.ws = null; s.ghost = Date.now(); s.q = s.q || []; });
    ctx.on('login', cl => { const s = sessions.get(cl); if (s && (!cl.member || keyOf(cl.member) !== s.key)) signOut(cl, 'logoff'); });
    // a JackNet Log Off doesn't tell the mods, so check now and then
    setInterval(() => { for (const [cl, s] of [...sessions]) { if (s.ghost) { if (Date.now() - s.ghost > 60000) signOut(cl); continue; } if (!cl.member || keyOf(cl.member) !== s.key || s.ws.readyState !== 1) signOut(cl, 'logoff'); } }, 3000).unref();
  },
  handle(ws, c, m) {
    if (!c.jsnRl) c.jsnRl = { msg: new ctx.Bucket(1.5, 8), add: new ctx.Bucket(0.2, 6), st: new ctx.Bucket(0.5, 8), misc: new ctx.Bucket(2, 12) };
    const R = c.jsnRl;
    if (!c.member) { if (sessions.has(c)) signOut(c, 'logoff'); return err(ws, 'passport'); }
    const me = keyOf(c.member);
    if (!mem(me)) return err(ws, 'passport');
    let s = sessions.get(c);
    if (s && s.key !== me) { signOut(c, 'logoff'); s = null; }

    if (m.t === 'jsnIn') {
      if (!R.misc.take()) return;
      const st = STATUS.has(m.st) ? m.st : 'NLN';
      let q = [];
      if (!s) { // back after a blip? take over the ghost session (same visitor id, same member)
        for (const [gc, gs] of [...sessions]) if (gs.ghost && gs.key === me && gc.id === c.id) { q = gs.q || []; sessions.delete(gc); }
        s = { key: me, st, ws, since: Date.now() }; sessions.set(c, s);
      } else { s.st = st; s.since = Date.now(); }
      hello(c, s);
      for (const msg of q) ctx.send(ws, msg);
      return fanout(me);
    }
    if (!s) return err(ws, 'signin');
    switch (m.t) {
      case 'jsnOut': return signOut(c, 'out');
      case 'jsnSt': {
        if (!STATUS.has(m.st) || !R.st.take()) return;
        for (const x of sessions.values()) if (x.key === me) x.st = m.st; // every window you are signed in on changes together
        s.since = Date.now();
        sendTo(me, { t: 'jsnMe', st: m.st });
        return fanout(me);
      }
      case 'jsnAdd': {
        if (!R.add.take()) return err(ws, 'slow');
        const to = findMember(m.to);
        if (!to) return err(ws, 'nouser', { to: String(m.to || '').slice(0, 40) });
        if (to === me) return err(ws, 'self');
        const u = lists(me), t = lists(to);
        if (u.fl.length >= MAX_LIST && !u.fl.includes(to)) return err(ws, 'full');
        const isNew = add(u.fl, to, MAX_LIST);
        add(u.al, to, MAX_LIST); drop(u.bl, to); // adding someone allows them too (that's how it worked)
        // tell them, unless they already allowed or blocked me
        if (!t.al.includes(me) && !t.bl.includes(me) && add(t.rl, me, MAX_RL)) sendTo(to, { t: 'jsnReq', name: mem(me).name, no: mem(me).no });
        ctx.markDirty();
        const cd = card(me, to); lastSeen.set(me + '>' + to, cd.st);
        ctx.send(ws, { t: 'jsnAdded', c: cd, isNew });
        sendTo(me, { t: 'jsnLists', al: u.al.map(k => mem(k).name), bl: u.bl.map(k => mem(k).name) });
        return fanout(me); // they might have me on their list already, and now they can see me
      }
      case 'jsnDel': {
        if (!R.misc.take()) return;
        const k = keyOf(m.name), u = lists(me);
        if (drop(u.fl, k)) { ctx.markDirty(); lastSeen.delete(me + '>' + k); }
        return ctx.send(ws, { t: 'jsnDeleted', name: mem(k) ? mem(k).name : String(m.name || '').slice(0, 40) });
      }
      case 'jsnAllow': {
        if (!R.misc.take()) return;
        const k = keyOf(m.name); if (!mem(k) || k === me) return;
        const u = lists(me);
        drop(u.rl, k);
        if (m.allow) { add(u.al, k, MAX_LIST); drop(u.bl, k); } else { add(u.bl, k, MAX_LIST); drop(u.al, k); }
        if (m.add && m.allow) add(u.fl, k, MAX_LIST);
        ctx.markDirty();
        sendTo(me, { t: 'jsnLists', al: u.al.map(x => mem(x).name), bl: u.bl.map(x => mem(x).name), rl: u.rl.map(x => mem(x).name) });
        if (m.add && m.allow) { const cd = card(me, k); lastSeen.set(me + '>' + k, cd.st); ctx.send(ws, { t: 'jsnAdded', c: cd, isNew: true, quiet: true }); }
        return fanout(me);
      }
      case 'jsnMsg': {
        const cid = String(m.cid || '').slice(0, 20);
        if (!R.msg.take()) return ctx.send(ws, { t: 'jsnAck', cid, ok: false, err: 'slow' });
        const text = ctx.delink(ctx.clean(m.text, 400));
        if (!text) return;
        const to = findMember(m.to);
        if (!to || to === me) return ctx.send(ws, { t: 'jsnAck', cid, ok: false, err: 'nouser' });
        if (s.st === 'HDN') return ctx.send(ws, { t: 'jsnAck', cid, ok: false, err: 'hidden' });
        if (seenSt(me, to) === 'FLN') return ctx.send(ws, { t: 'jsnAck', cid, ok: false, err: 'offline' });
        const n = sendTo(to, { t: 'jsnMsg', from: mem(me).name, no: mem(me).no, text, ts: Date.now() });
        return ctx.send(ws, { t: 'jsnAck', cid, ok: n > 0, err: n ? undefined : 'offline', text });
      }
    }
  },
};
