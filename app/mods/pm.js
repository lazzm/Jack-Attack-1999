/* Private mailboxes for JackNet members: Uh-Oh! offline messages and contact authorisation requests.
 * Only the recipient can read their box (unlike Net.kv, which anyone can read).
 *   client -> { t:'pmSend', to: <member name or member no>, kind: 'msg'|'auth'|'authok'|'authno', text }
 *          <- { t:'pmSent', to, ok, err? }     (the recipient gets { t:'pmNew', item } straight away if online)
 *   client -> { t:'pmFetch' }                  <- { t:'pmList', items: [{ id, from, fromNo, kind, text, ts }] }
 *   client -> { t:'pmAck', ids: [...] }        (deletes those from your box)
 * The box is also pushed as pmList when a member connects or logs on. */
const KINDS = new Set(['msg', 'auth', 'authok', 'authno']);
const PER_BOX = 60;
let ctx;

function findMember(to) {
  const members = ctx.state.members;
  if (typeof to === 'number' || /^\d+$/.test(String(to))) { const no = +to; return Object.keys(members).find(k => members[k].no === no) || null; }
  const k = String(to || '').toLowerCase().slice(0, 40);
  return members[k] ? k : null;
}
const box = key => (ctx.data.box = ctx.data.box || {})[key] = ctx.data.box[key] || [];
function pushList(ws, c) { if (!c.member) return; const b = (ctx.data.box || {})[c.member.toLowerCase()] || []; ctx.send(ws, { t: 'pmList', items: b }); }

module.exports = {
  name: 'pm',
  types: ['pmSend', 'pmFetch', 'pmAck'],
  init(c) {
    ctx = c;
    ctx.on('hello', (ws, cl) => pushList(ws, cl));
    ctx.on('login', cl => { for (const [ws, x] of ctx.clients) if (x === cl) pushList(ws, cl); });
  },
  handle(ws, c, m) {
    if (!c.member) return ctx.send(ws, { t: 'pmSent', ok: false, err: 'Log on to JackNet to use offline messages.' });
    const me = c.member.toLowerCase();
    if (m.t === 'pmFetch') return pushList(ws, c);
    if (m.t === 'pmAck') {
      const ids = new Set((Array.isArray(m.ids) ? m.ids : []).slice(0, 100).map(String));
      const b = box(me); const keep = b.filter(x => !ids.has(x.id));
      if (keep.length !== b.length) { ctx.data.box[me] = keep; ctx.markDirty(); }
      return;
    }
    if (m.t === 'pmSend') {
      if (!c.pmRl) c.pmRl = new ctx.Bucket(0.5, 6);
      if (!c.pmRl.take()) return ctx.send(ws, { t: 'pmSent', ok: false, err: 'Slow down! (offline messages are limited)' });
      const kind = KINDS.has(m.kind) ? m.kind : 'msg';
      const text = ctx.delink(ctx.clean(m.text, 400));
      if (kind === 'msg' && !text) return;
      const to = findMember(m.to);
      if (!to) return ctx.send(ws, { t: 'pmSent', to: String(m.to).slice(0, 40), ok: false, err: 'No JackNet member by that name or number.' });
      if (to === me) return ctx.send(ws, { t: 'pmSent', to, ok: false, err: 'You can\'t send yourself an offline message.' });
      const mem = ctx.state.members[me];
      const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), from: mem.name, fromNo: mem.no, kind, text, ts: Date.now() };
      const b = box(to);
      // one pending auth request per sender is plenty
      if (kind === 'auth' && b.some(x => x.kind === 'auth' && x.from === mem.name)) return ctx.send(ws, { t: 'pmSent', to: ctx.state.members[to].name, ok: true });
      b.push(item); if (b.length > PER_BOX) b.splice(0, b.length - PER_BOX);
      ctx.markDirty();
      for (const [ws2, c2] of ctx.clients) if (c2.member && c2.member.toLowerCase() === to) ctx.send(ws2, { t: 'pmNew', item });
      return ctx.send(ws, { t: 'pmSent', to: ctx.state.members[to].name, ok: true });
    }
  },
};
