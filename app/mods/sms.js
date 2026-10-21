/* Text messages for Jack's Mobile (the Talkbrik T-99 pocket phone in public/js/family-phone.js).
 * Only real visitors can be texted: an online visitor by guest/member name, or a JackNet member by member number
 * (members who are offline get it when they next connect). 160 characters, cleaned, rate-limited.
 *   client -> { t:'smsSend', to: <member no | name>, text, ref }  <- { t:'smsSent', ref, ok, to?, id?, queued?, err? }
 *   recipient <- { t:'smsNew', item: { id, from, fromNo, text, ts } }   recipient -> { t:'smsAck', ids: [...] }
 *   sender <- { t:'smsDelivered', id, to }   (when the recipient's phone has it)
 * Offline boxes live in state.mods.sms.box[memberKey]. Delivery reports are only remembered while the sender is online. */
const MAXLEN = 160, PER_BOX = 20;
let ctx;
const pending = new Map(); // sms id -> { ws, to, ts } so the sender can get a "Delivered" report
const ipRl = new Map(); // ip -> Bucket (several tabs share one allowance)

const box = key => { const b = ctx.data.box = ctx.data.box || {}; return (b[key] = b[key] || []); };
function memberByNo(no) { const ms = ctx.state.members; return Object.keys(ms).find(k => ms[k].no === no) || null; }
function online() { return [...ctx.clients].filter(([, c]) => c.ready); }
function pushBox(ws, c) {
  if (!c || !c.member) return;
  const b = (ctx.data.box || {})[c.member.toLowerCase()];
  if (b && b.length) for (const item of b) ctx.send(ws, { t: 'smsNew', item });
}
function report(id, toName) {
  const p = pending.get(id); if (!p) return;
  pending.delete(id);
  // the sender's socket may have been replaced by a reconnect since: find them by visitor id (it comes back the same)
  const ws = p.ws && p.ws.readyState === 1 ? p.ws : (online().find(([, x]) => x.id === p.sid) || [])[0];
  if (ws) ctx.send(ws, { t: 'smsDelivered', id, to: toName || p.to });
}

module.exports = {
  name: 'sms',
  types: ['smsSend', 'smsAck'],
  init(c) {
    ctx = c;
    ctx.on('hello', (ws, cl) => pushBox(ws, cl));
    ctx.on('login', cl => { for (const [ws, x] of ctx.clients) if (x === cl) pushBox(ws, cl); });
    setInterval(() => {
      const now = Date.now();
      for (const [id, p] of pending) if (now - p.ts > 3 * 3600000) pending.delete(id);
      for (const [ip, b] of ipRl) if (b.t >= b.burst && now - b.last > 600000) ipRl.delete(ip);
    }, 300000).unref();
  },
  handle(ws, c, m) {
    if (m.t === 'smsAck') {
      const ids = (Array.isArray(m.ids) ? m.ids : []).slice(0, 40).map(String);
      if (c.member) {
        const key = c.member.toLowerCase(), b = (ctx.data.box || {})[key];
        if (b && b.length) { const keep = b.filter(x => !ids.includes(x.id)); if (keep.length !== b.length) { ctx.data.box[key] = keep; if (!keep.length) delete ctx.data.box[key]; ctx.markDirty(); } }
      }
      for (const id of ids) report(id, c.nick);
      return;
    }
    if (m.t !== 'smsSend') return;
    const ref = String(m.ref || '').slice(0, 20);
    const fail = err => ctx.send(ws, { t: 'smsSent', ref, ok: false, err });
    if (!c.ready || !c.nick) return fail('No network coverage.');
    if (!c.member) return fail('Texting is for JackNet members. Joining is FREE!');
    if (!c.smsRl) c.smsRl = new ctx.Bucket(1 / 8, 3);
    let ib = ipRl.get(c.ip); if (!ib) { ib = new ctx.Bucket(1 / 8, 4); ipRl.set(c.ip, ib); }
    if (!c.smsRl.take() || !ib.take()) return fail('Network busy. Try again in a few seconds.');
    const text = ctx.delink(ctx.clean(m.text, MAXLEN));
    if (!text) return fail('Message is empty.');
    const raw = String(m.to == null ? '' : m.to).trim().slice(0, 30);
    if (!raw) return fail('No number entered.');
    const mem = ctx.member(c);
    const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), from: c.nick, fromNo: mem ? mem.no : 0, text, ts: Date.now() };
    let targets = [], key = null, toName = '';
    if (/^\d{1,7}$/.test(raw)) { // a member number
      key = memberByNo(+raw);
      if (!key) return fail('Number not recognised. (No JackNet member ' + (+raw) + '.)');
      toName = ctx.state.members[key].name;
      targets = online().filter(([, x]) => x.member && x.member.toLowerCase() === key);
    } else { // somebody online by name (guest or member), or an offline member by name
      const low = raw.toLowerCase();
      targets = online().filter(([, x]) => String(x.nick).toLowerCase() === low);
      if (targets.length) { toName = targets[0][1].nick; if (targets[0][1].member) key = targets[0][1].member.toLowerCase(); }
      else if (ctx.state.members[low]) { key = low; toName = ctx.state.members[low].name; }
      else return fail('Number unavailable. (Nobody called "' + raw + '" is online.)');
    }
    if (targets.some(([w]) => w === ws) || (key && c.member && c.member.toLowerCase() === key)) return fail("You can't text yourself. (Jack tried. It cost 10p.)");
    if (key) { // members keep it until their phone says it arrived, even if they're online now
      const b = box(key); b.push(item); if (b.length > PER_BOX) b.splice(0, b.length - PER_BOX); ctx.markDirty();
    }
    pending.set(item.id, { ws, sid: c.id, to: toName, ts: Date.now() });
    for (const [w] of targets) ctx.send(w, { t: 'smsNew', item });
    ctx.send(ws, { t: 'smsSent', ref, ok: true, to: toName, id: item.id, queued: !targets.length });
  },
};
