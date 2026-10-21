/* Jack's own mailbox, and "pick a new password" for members given a temporary one.
 * Every letter for the Letters page (the Write to Jack form, and e-mails sent to anyone@jackattack.jnet) is also kept here,
 * privately, and handed to the member called Jack, who gets them in Outlook Express as real e-mails.
 *   client -> { t:'jbFetch' }                 <- { t:'jbList', items: [{ id, name, from, found, msg, ts }] }   (Jack only)
 *                                             <- { t:'jbNew', item }                                         (Jack, live)
 *   client -> { t:'jbChpass', old, pass }     <- { t:'jbChpassOk' } | { t:'jbChpassErr', msg }
 *                                             <- { t:'jbMustChange' }  (on connect/logon, while the password is a temporary one)
 * Admin: POST /admin/register {"name","pass","mustChange":true} gives a member a temporary password. */
const OWNER = 'jack';
const KEEP = 500;
let ctx;
const crypto = require('crypto');
const isOwner = c => !!(c && c.member && c.member.toLowerCase() === OWNER);
const box = () => (ctx.data.letters = ctx.data.letters || []);

function greet(ws, c) {
  const mem = ctx.member(c); if (!mem) return;
  if (mem.mustChange) ctx.send(ws, { t: 'jbMustChange' });
  if (isOwner(c)) ctx.send(ws, { t: 'jbList', items: box().slice(-200) });
}

module.exports = {
  name: 'jackbox',
  types: ['jbFetch', 'jbChpass'],
  init(c) {
    ctx = c;
    ctx.on('hello', (ws, cl) => greet(ws, cl));
    ctx.on('login', cl => { for (const [ws, x] of ctx.clients) if (x === cl) greet(ws, cl); });
    ctx.on('gb', (cl, e) => {
      if (!e) return;
      const item = { id: e.id, name: e.name, from: e.from || '', found: e.found || '', msg: e.msg, ts: e.ts };
      const b = box(); b.push(item); if (b.length > KEEP) b.splice(0, b.length - KEEP);
      ctx.markDirty();
      for (const [ws2, c2] of ctx.clients) if (isOwner(c2)) ctx.send(ws2, { t: 'jbNew', item });
    });
  },
  handle(ws, c, m) {
    if (m.t === 'jbFetch') { if (isOwner(c)) ctx.send(ws, { t: 'jbList', items: box().slice(-200) }); return; }
    if (m.t === 'jbChpass') {
      const mem = ctx.member(c);
      if (!mem) return ctx.send(ws, { t: 'jbChpassErr', msg: 'Log on to JackNet first.' });
      if (!c.jbRl) c.jbRl = new ctx.Bucket(0.05, 4);
      if (!c.jbRl.take()) return ctx.send(ws, { t: 'jbChpassErr', msg: 'Too many tries. Wait a minute and try again.' });
      const old = String(m.old || ''), pass = String(m.pass || '');
      if (pass.length < 6 || pass.length > 64) return ctx.send(ws, { t: 'jbChpassErr', msg: 'The new password must be 6 to 64 characters long.' });
      if (pass === old) return ctx.send(ws, { t: 'jbChpassErr', msg: 'The new password must be different from the old one.' });
      ctx.scrypt(old, mem.salt).then(h => {
        if (!crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(mem.hash, 'hex'))) return ctx.send(ws, { t: 'jbChpassErr', msg: 'The old password is not correct.' });
        const salt = crypto.randomBytes(16).toString('hex');
        return ctx.scrypt(pass, salt).then(h2 => { mem.salt = salt; mem.hash = h2; delete mem.mustChange; ctx.markDirty(); ctx.send(ws, { t: 'jbChpassOk' }); });
      }).catch(() => ctx.send(ws, { t: 'jbChpassErr', msg: 'JackNet had a wobble. Try again.' }));
    }
  },
};
