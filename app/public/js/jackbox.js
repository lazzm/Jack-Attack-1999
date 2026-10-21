/* jackbox: the client half of mods/jackbox.js.
 * - A member given a temporary password is asked to pick a new one (the JackOS "Change Password" dialog) right after logon.
 * - The member called Jack gets every reader's letter (Write to Jack, e-mails to @jackattack.jnet) in Outlook Express. */
(function () {
  'use strict';
  if (!window.Net || !Net.on) return;
  const A = window.Apps, esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const msg = (t, x, ic) => (window.Desk && Desk.msgbox ? Desk.msgbox(t, x, ic || 'info') : alert(x));

  // ---------------------------------------------------------------- pick a new password
  let open = null, pendingDlg = null;
  function askNewPassword() {
    if (open) return;
    const S = window.SysPack;
    if (!S || !S.dlg || !DesktopSurface.ready()) { clearTimeout(pendingDlg); pendingDlg = setTimeout(askNewPassword, 1500); return; }
    const d = S.dlg('Change JackNet Password', `<p style="margin:0 0 8px">Your JackNet password is a temporary one. Please choose a new password now. Only you will know it.</p>
<div class="pgk-pwg" style="display:grid;grid-template-columns:auto 1fr;gap:6px 8px;align-items:center">
<label for="jbOld">Old password:</label><input id="jbOld" type="password" autocomplete="current-password" maxlength="64">
<label for="jbN1">New password:</label><input id="jbN1" type="password" autocomplete="new-password" maxlength="64">
<label for="jbN2">Confirm new password:</label><input id="jbN2" type="password" autocomplete="new-password" maxlength="64"></div>
<p class="jb-err" style="margin:8px 0 0;color:#a00;min-height:1em"></p>`, [['OK', b => {
      const o = b.querySelector('#jbOld').value, n1 = b.querySelector('#jbN1').value, n2 = b.querySelector('#jbN2').value, err = b.querySelector('.jb-err');
      if (n1 !== n2) { err.textContent = 'The new passwords you typed do not match.'; return false; }
      if (n1.length < 6) { err.textContent = 'The new password must be at least 6 characters long.'; return false; }
      if (!Net.send({ t: 'jbChpass', old: o, pass: n1 })) { err.textContent = 'Not connected to JackNet. Wait for the modem to redial, then press OK again.'; return false; }
      err.textContent = 'Changing password...'; setTimeout(() => { if (err.isConnected && err.textContent === 'Changing password...') err.textContent = 'JackNet had a wobble and didn\'t answer. Press OK to try again.'; }, 10000); return false;
    }], ['Cancel', () => { setTimeout(() => msg('Change JackNet Password', 'Your password was not changed. You will be asked again the next time you log on.', 'warn'), 50); }]], { w: 380, onClose: () => { open = null; } });
    open = d;
  }
  // once per logon (a connection blip re-sends jbMustChange: don't nag again if they pressed Cancel)
  let asked = false;
  Net.on('loginOk', () => { asked = false; });
  Net.on('jbMustChange', () => { if (asked || open) return; asked = true; setTimeout(askNewPassword, 1200); });
  Net.on('jbChpassErr', m => { if (open) { const e = open.b.querySelector('.jb-err'); if (e) e.textContent = m.msg || 'That did not work.'; } else msg('Change JackNet Password', m.msg || 'That did not work.', 'warn'); });
  Net.on('jbChpassOk', () => { if (open) { open.w.close(); open = null; } msg('Change JackNet Password', 'Your password has been changed.', 'info'); });

  // ---------------------------------------------------------------- Jack's letters, as e-mails
  const isJack = () => !!(Net.me && Net.me.member && String(Net.me.nick).toLowerCase() === 'jack');
  const slug = n => String(n || 'reader').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 24) || 'reader';
  const fmt = ts => { const d = new Date(ts); const p = n => String(n).padStart(2, '0'); return { date: `${p(d.getDate())}/${p(d.getMonth() + 1)}/99`, time: `${p(d.getHours())}:${p(d.getMinutes())}` }; };
  function take(items, live) {
    if (!isJack() || !window.JackFiles || !JackFiles.deliver) return;
    const seen = new Set(store.get('jhp_jb_seen', [])); let n = 0;
    items.filter(it => it && it.id && !seen.has(it.id)).forEach(it => {
      const email = it.found === 'E-mail', text = String(it.msg || ''), cut = email ? text.indexOf(' - ') : -1;
      const subj = email && cut > 0 && cut < 80 ? text.slice(0, cut) : (email ? 'An e-mail for Jack' : 'A letter for the Letters page');
      const body = (email && cut > 0 && cut < 80 ? text.slice(cut + 3) : text) + `\n\n-----\nFrom: ${it.name}${it.from ? ' (' + it.from + ')' : ''}\n${it.found ? 'Found the site: ' + it.found + '\n' : ''}This letter is also on the Letters page.`;
      JackFiles.deliver(Object.assign({ from: `${it.name} <${slug(it.name)}@jacknet.jnet>`, to: 'Jack <jack@jackattack.jnet>', subj, body }, fmt(it.ts || Date.now())));
      seen.add(it.id); n++;
    });
    if (!n) return;
    store.set('jhp_jb_seen', [...seen].slice(-800));
    try { Sound.play('join'); } catch (e) {}
    if (window.Desk && Desk.toast) Desk.toast('Outlook Express', live ? `New letter from ${esc(items[0].name)}!` : `You have ${n} new letter${n > 1 ? 's' : ''} from readers in your Inbox.`, 5000);
  }
  Net.on('jbList', m => setTimeout(() => take(m.items || [], false), 2500));
  Net.on('jbNew', m => take([m.item], true));
  Net.on('loginOk', () => setTimeout(() => { if (isJack()) Net.send({ t: 'jbFetch' }); }, 1500));
  if (A && A.defineSecret) A.defineSecret('jb.letters', 'Fan mail', 'Read your letters (if you are Jack)');
})();
