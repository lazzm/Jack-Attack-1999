/* social-im: the bits of Uh-Oh! Messenger you don't need every second (file transfers, User Info, Add/Find Users,
 * history, away messages, the ignore list). apps-social.js loads this the first time one of them is used. */
window.SocialIM = function (X) {
  'use strict';
  const { who, $, h, esc, store, pick, pad, got, hash, hhmm, d99, clean, isObj, int, okCol, gate, ico, txt, touch, showBrowser, I, LOGO, LOGO16, ENVELOPE, STAT, AWAY_DEF, UM, MEM, MEMNO, ignored, lc, liveOf, stOf, mOf, uinOf, uinText, uinToNo, guestUIN, memberUIN, myUIN, keyOf, contactOf, showName, isTop, isIgnored, whereOf, hist, session, addSys, flash, renderCL, sendStatus, uhohSound, members, addContact } = X;
  // ---- file transfers (the joke kind: only the file NAME travels, then the modem does its best)
  const JOKE_FILES = [['dancing_squig.avi', 1840], ['NOT_A_VIRUS.exe', 12], ['ork_painting.bmp', 922], ['top_secret_cheats.txt', 3], ['jacks_midi_mix.mid', 41], ['homework_answers.doc', 88], ['funny_noise.wav', 230], ['LEVEL9.SAV', 32], ['podrace_screensaver.scr', 640]];
  const xfers = new Map(), offerIn = gate(2, 20000), offerOut = gate(1, 15000);
  const okName = n => { const c = clean(n, 40); return /^[\w\- .()!']{1,40}$/.test(c) ? c : 'mystery.file'; };
  function fileMenu(s, btn) {
    const p = s.peer;
    if (!liveOf(p)) { addSys(s, `${p.nick} isn't online, so there's nobody to catch the file.`); return; }
    const mine = ((Apps.fs.get('C:/My Documents') || {}).kids || []).filter(k => k.type === 'txt').slice(0, 8);
    const items = mine.map(k => ({ label: k.name, icon: Apps.ICON.txt, act: () => offerFile(s, k.name, Math.max(1, Math.ceil(String(k.text || '').length / 1024))) }));
    const r = btn.getBoundingClientRect();
    IE.menu([...items, ...(items.length ? ['-'] : []), ...JOKE_FILES.map(([n, kb]) => ({ label: `${n} (${kb} KB)`, icon: Apps.ICON.exe, act: () => offerFile(s, n, kb) }))], r.left, r.bottom);
  }
  function offerFile(s, name, kb) {
    const p = liveOf(s.peer);
    if (!p) { addSys(s, `${s.peer.nick} has logged off.`); return; }
    if (!offerOut('me')) { addSys(s, 'Hold your horses! One file at a time. (The phone line is only so wide.)'); return; }
    const f = Math.random().toString(36).slice(2, 10).replace(/[^a-z0-9]/g, 'x').padEnd(8, 'q');
    if (!Net.relay(p.id, 'social.im', { k: 'file', f, n: name, z: kb })) { addSys(s, 'Not connected to JackNet.'); return; }
    xfers.set(f, { f, peer: p, name, kb, dir: 'send', state: 'offer' });
    addSys(s, `Offering "${name}" (${kb} KB) to ${p.nick}... waiting for them to accept.`);
  }
  function fileOffer(o, d) {
    if (typeof d.f !== 'string' || !/^[a-z0-9]{8}$/.test(d.f) || !int(d.z, 1, 99999) || xfers.has(d.f) || !offerIn(o.id)) return;
    const name = okName(d.n), x = { f: d.f, peer: o, name, kb: d.z, dir: 'recv', state: 'offer' };
    xfers.set(d.f, x);
    let s = UM.sessions.get(keyOf(o));
    if (!s || s.w.closed) s = session(o, { quiet: true, min: true });
    const line = addSys(s, `${o.nick} wants to send you "${name}" (${d.z} KB). `);
    const yes = h('button', 'btn so-sm', 'Accept'), no = h('button', 'btn so-sm', 'Decline'); yes.type = no.type = 'button';
    line.append(yes, ' ', no);
    const done = () => { yes.disabled = no.disabled = true; };
    yes.addEventListener('click', () => { done(); if (x.state !== 'offer') return; if (!who(o.id)) { addSys(s, `${o.nick} has logged off. Transfer cancelled.`); return; } Net.relay(o.id, 'social.im', { k: 'facc', f: x.f }); transfer(x); });
    no.addEventListener('click', () => { done(); x.state = 'done'; Net.relay(o.id, 'social.im', { k: 'fdec', f: x.f }); addSys(s, 'You declined the file. Probably wise.'); });
    if (!isTop(s.w)) { flash(s.w); s.unread = 1; renderCL(); }
    if (UM.sound && UM.status !== 'dnd') uhohSound();
  }
  function fileReply(o, d) {
    const x = typeof d.f === 'string' && xfers.get(d.f);
    if (!x || x.peer.id !== o.id) return;
    const s = UM.sessions.get(keyOf(o));
    if (d.k === 'facc' && x.dir === 'send' && x.state === 'offer') transfer(x);
    else if (d.k === 'fdec' && x.state === 'offer') { x.state = 'done'; if (s) addSys(s, `${o.nick} declined "${x.name}". Charming.`); }
    else if (d.k === 'fcan' && x.state === 'run') { x.cancel && x.cancel(`${o.nick} cancelled the transfer.`); }
  }
  function transfer(x) {
    x.state = 'run';
    const dur = 7000 + hash(x.f) % 5000, t0 = Date.now(), send = x.dir === 'send';
    const b = h('div', 'so-xfer');
    b.innerHTML = `<div class="so-xrow">${ico(send ? I.plane : ENVELOPE, 32)}<div><b></b><div class="small so-xwho"></div></div></div><div class="prog so-xprog"><span style="display:flex;gap:2px"></span></div><div class="so-xstat small">Negotiating with the modem...</div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button">Cancel</button></div>`;
    b.querySelector('b').textContent = (send ? 'Sending ' : 'Receiving ') + x.name;
    b.querySelector('.so-xwho').textContent = (send ? 'To: ' : 'From: ') + x.peer.nick + ` \u00b7 ${x.kb} KB`;
    const w = Apps.win(`${Math.floor(0)}% of ${x.name} - File Transfer`, b, { w: 340, icon: LOGO16, noResize: true, noMax: true, onClose: () => { if (x.state === 'run') { Net.relay(x.peer.id, 'social.im', { k: 'fcan', f: x.f }); x.cancel('You cancelled the transfer.'); } } });
    const bar = b.querySelector('.prog span'), st = b.querySelector('.so-xstat');
    const jokes = ['Someone picked up the phone! Hanging on...', 'Waiting for the modem to catch its breath...', 'Packets are queuing politely...', 'Mom is on the extension. Please hold.'];
    let stalled = false;
    const timer = setInterval(() => {
      const el = Date.now() - t0; let p = Math.min(1, el / dur);
      if (p > 0.9 && p < 0.97 && !stalled) { stalled = true; st.textContent = pick(jokes); }
      if (stalled && p < 0.97) p = 0.9;
      const kbps = (1.6 + (hash(x.f + Math.floor(el / 900)) % 30) / 10).toFixed(1);
      if (!stalled || p >= 0.97) st.textContent = `Rate: ${kbps} KB/s \u00b7 Time left: 0:${pad(Math.max(0, Math.ceil((dur - el) / 1000)))}`;
      bar.innerHTML = '<i></i>'.repeat(Math.round(p * 28));
      w.setTitle(`${Math.floor(p * 100)}% of ${x.name} - File Transfer`);
      if (el >= dur) finish();
    }, 250);
    b.querySelector('button').addEventListener('click', () => w.close());
    const s = () => UM.sessions.get(keyOf(x.peer));
    x.cancel = why => { clearInterval(timer); x.state = 'done'; if (!w.closed) { st.textContent = why; b.querySelector('button').textContent = 'Close'; b.querySelector('button').onclick = () => w.close(); setTimeout(() => w.close(), 4000); } addSys(s(), `File transfer of "${x.name}" cancelled.`); };
    function finish() {
      clearInterval(timer); x.state = 'done'; got('file');
      bar.innerHTML = '<i></i>'.repeat(28);
      if (send) { st.textContent = 'Transfer complete! (It only took ' + Math.round(dur / 1000) + ' seconds. A new JackNet record.)'; addSys(s(), `Sent "${x.name}" to ${x.peer.nick}.`); }
      else {
        const node = receivedFile(x.name, x.peer.nick);
        st.textContent = 'Saved to C:\\My Documents\\Received Files';
        const ob = b.querySelector('button'); ob.textContent = 'Open'; ob.onclick = () => { w.close(); Apps.openFile(node); };
        const line = addSys(s(), `Received "${x.name}". `);
        if (line) { const o2 = h('button', 'btn so-sm', 'Open'); o2.type = 'button'; o2.addEventListener('click', () => Apps.openFile(node)); line.appendChild(o2); }
        return;
      }
      setTimeout(() => w.close(), 3500);
    }
  }
  function receivedFile(name, from) {
    const src = Apps.fs.find(name), ext = (name.match(/\.(\w+)$/) || [, ''])[1].toLowerCase();
    const BODY = {
      avi: 'This was going to be a video of a dancing robot.\nThe modem has turned it into one (1) very still robot.\nIt is still dancing on the inside.',
      exe: "This file says it's NOT A VIRUS.\nGubbinz Anti-Virus 98 checked. It's not a virus. It's a picture of a duck.\nQuack.",
      bmp: 'A picture of Zapachu. Lovingly drawn in Paint. Yellow, mostly.\n(Only the top 3 lines of pixels arrived. They are very nice pixels.)',
      mid: 'A MIDI file! Sadly the sound card ate it.\nHum along: dum dum DUM, dum dum DUMMM.',
      doc: 'HOMEWORK ANSWERS\n\n1. Yes\n2. No\n3. The Romans\n4. Probably the Romans again\n\n(Not guaranteed. Not even slightly.)',
      wav: 'A funny noise. You had to be there.\nIt sounded a bit like a modem sneezing.',
      sav: 'A save game: level 9, 1 life left, 999 coins.\nWhoever sent this is either brilliant or a cheat.',
      scr: 'A screensaver of little racing pods zooming round a canyon.\nThe file got as far as the canyon. The pods are still on their way.',
    };
    const text = src && src.type === 'txt' && src.text ? src.text : (BODY[ext] || 'This file arrived over Uh-Oh! Messenger.\nIt is exactly as useful as it looks.');
    const node = { name, type: 'txt', date: d99(), size: Math.max(1, Math.ceil(text.length / 1024)) + ' KB', text: `[Received from ${from} over Uh-Oh! on ${d99()} at ${hhmm()}]\n\n` + text };
    return Apps.fs.add('C:/My Documents/Received Files', node);
  }


  // ---- user info and Add/Find Users
  function userInfo(p) {
    const l = liveOf(p), st = l ? stOf(p) : 'off';
    const b = h('div', 'so-info');
    b.innerHTML = `<div class="tabs"><span class="on" data-t="0">Main</span><span data-t="1">Profile</span></div><div class="tabpage">
      <div class="so-ipage" data-p="0"><div class="so-irow">${ico(STAT[st][1], 32)}<div><b class="so-inick"></b><div class="small">${esc(l ? STAT[st][0] : 'Offline')}</div></div></div>
        <table class="so-itab"><tr><td>Nickname:</td><td class="v1"></td></tr><tr><td>Uh-Oh! number:</td><td class="v4"></td></tr><tr><td>Currently:</td><td class="v2"></td></tr><tr><td>JackNet member:</td><td>${p.member ? 'Yes ★' : 'No (guest)'}</td></tr><tr><td>Status message:</td><td class="v3"></td></tr><tr><td>Client:</td><td>Uh-Oh! 99b</td></tr></table></div>
      <div class="so-ipage" data-p="1" hidden><div class="so-iprof">Loading...</div></div></div>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" data-x="add" hidden>Add to List</button><button class="btn" type="button" data-x="msg">Message</button><button class="btn" type="button" data-x="ok">OK</button></div>`;
    b.querySelector('.so-inick').textContent = showName(p); b.querySelector('.v1').textContent = p.nick;
    b.querySelector('.v2').textContent = l ? 'Reading ' + whereOf(l) : 'Not on JackNet right now';
    b.querySelector('.v3').textContent = mOf(p) || '(none)';
    const v4 = () => { b.querySelector('.v4').textContent = uinText(p); };
    v4(); if (p.member && !uinOf(p)) members(v4, 0);
    const w = Apps.win('User Info - ' + p.nick, b, { w: 340, icon: LOGO16, noResize: true, noMax: true, escClose: true });
    const addB = b.querySelector('[data-x=add]'); addB.hidden = !(p.member && Net.me.member && !contactOf(p) && lc(p.nick) !== lc(Net.me.nick));
    b.querySelector('[data-x=ok]').addEventListener('click', w.close);
    b.querySelector('[data-x=msg]').addEventListener('click', () => { w.close(); session(p); });
    addB.addEventListener('click', () => { w.close(); addContact(p.nick); });
    const prof = b.querySelector('.so-iprof');
    b.querySelectorAll('.tabs span').forEach(t => t.addEventListener('click', () => {
      b.querySelectorAll('.tabs span').forEach(x => x.classList.toggle('on', x === t));
      b.querySelectorAll('.so-ipage').forEach(x => { x.hidden = x.dataset.p !== t.dataset.t; });
    }));
    if (!p.member) { prof.textContent = `${p.nick} is a guest, so there's no profile to show. (Tell them to join JackNet! It's free and takes about 5 seconds.)`; return; }
    members(() => {
      if (w.closed) return;
      const c = MEM.get(lc(p.nick));
      if (!c) { prof.textContent = 'Profile not found. Spooky.'; return; }
      prof.innerHTML = `<div class="so-irow"><img alt="" width="48" height="48" class="so-iav"><div><b style="color:${okCol(c.col)}"></b><div class="small">Member #${c.no} · Uh-Oh! #${memberUIN(c.no)}</div><div class="small">${int(c.posts, 0, 1e9) ? c.posts : 0} forum post(s) · Mood: <span class="mood"></span></div></div></div><button class="btn" type="button" style="margin-top:8px">View full profile on JackNet...</button>`;
      prof.querySelector('b').textContent = c.name; prof.querySelector('.mood').textContent = X.moods()[c.mood] || '?';
      try { if (window.Community && Community.avatarURL) prof.querySelector('img').src = Community.avatarURL(c.avatar | 0); } catch (e) {}
      prof.querySelector('button').addEventListener('click', () => { w.close(); showBrowser(); if (window.Community) Community.openProfile(c.name); });
    }, 0);
  }
  function findUser() {
    const f = h('form', 'so-find');
    f.innerHTML = `<div class="so-frow">${ico(LOGO, 32)}<div>Find people by their <b>Uh-Oh! number</b> or <b>nickname</b>. ${Net.me.member ? `Your number is <b>${myUIN()}</b>.` : 'You\'re a guest: <a href="#" class="so-join">join JackNet</a> to get your own number and a contact list.'}</div></div>
      <div class="row" style="flex-wrap:nowrap;margin-top:8px"><input type="text" maxlength="20" style="flex:1;min-width:0" aria-label="Uh-Oh! number or nickname" placeholder="e.g. 1999037 or Squirtle99"><button class="btn" type="submit">Search</button></div>
      <div class="so-flab">Results:</div><div class="field so-fres" data-r="search"><div class="so-fmsg">Type a number or a nickname and press Search.</div></div>
      <div class="so-flab">Who's on JackNet right now:</div><div class="field so-fres" data-r="online"></div>`;
    const w = Apps.win('Add/Find Users', f, { w: 360, icon: LOGO16, noResize: true, noMax: true, escClose: true });
    const inp = f.querySelector('input'), res = f.querySelector('[data-r=search]'), onl = f.querySelector('[data-r=online]');
    const j = f.querySelector('.so-join'); if (j) j.addEventListener('click', ev => { ev.preventDefault(); w.close(); if (window.JackLogon) JackLogon.show(); });
    if (!touch()) setTimeout(() => inp.focus(), 40);
    const hitRow = (p, extra) => {
      const r = h('div', 'so-fhit'), st = liveOf(p) ? stOf(p) : 'off', u = uinOf(p), mine = lc(p.nick) === lc(Net.me.nick), inList = !!contactOf(p);
      r.innerHTML = `<span class="so-fi">${STAT[st][1]}</span><span class="so-fn"><b></b><small>${p.member ? (u ? '#' + u : '') + ' ★ member' : 'guest (#' + u + ', changes every visit)'}${extra ? ' · ' + esc(extra) : ''}</small></span>`;
      r.querySelector('b').textContent = p.nick + (mine ? ' (you)' : '');
      if (!mine) {
        if (p.member && Net.me.member) { const a = h('button', 'btn so-sm', inList ? 'In list' : 'Add'); a.type = 'button'; a.disabled = inList; a.addEventListener('click', () => { addContact(p.nick); a.disabled = true; a.textContent = 'Asked'; }); r.appendChild(a); }
        const m = h('button', 'btn so-sm', 'Message'); m.type = 'button'; m.disabled = !liveOf(p) && !(p.member && Net.me.member); m.addEventListener('click', () => { w.close(); session(p); }); r.appendChild(m);
      }
      return r;
    };
    const renderOnline = () => { onl.innerHTML = ''; const list = X.online().filter(o => !isIgnored(o)); if (!list.length) onl.innerHTML = '<div class="so-fmsg">Nobody is here yet.</div>'; list.slice(0, 40).forEach(o => onl.appendChild(hitRow(o, 'online now'))); };
    members(renderOnline, 30000); renderOnline();
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const q = inp.value.trim(); res.innerHTML = '<div class="so-fmsg">Searching...</div>'; if (!q) return;
      const known = () => /^\d{6,8}$/.test(q) ? MEMNO.has(uinToNo(+q)) || X.online().some(o => !o.member && guestUIN(o.id) === +q) : [...MEM.keys()].some(k => k.includes(lc(q)));
      members(() => { if (known()) search(); else members(search, 0); }, 15000);
      function search() {
        res.innerHTML = '';
        const out = [];
        if (/^\d{6,8}$/.test(q)) {
          const n = +q;
          if (n === myUIN()) { got('findme'); res.innerHTML = '<div class="so-fmsg">That\'s YOU! Hello, you.</div>'; return; }
          const c = MEMNO.get(uinToNo(n)); if (c) out.push({ id: 0, nick: c.name, member: true, uin: n });
          const g = X.online().find(o => !o.member && guestUIN(o.id) === n); if (g) out.push(g);
        } else {
          for (const c of MEM.values()) if (lc(c.name).includes(lc(q))) out.push(liveOf({ member: true, nick: c.name }) || { id: 0, nick: c.name, member: true, uin: memberUIN(c.no) });
          X.online().forEach(o => { if (!o.member && lc(o.nick).includes(lc(q))) out.push(o); });
        }
        if (!out.length) { res.innerHTML = '<div class="so-fmsg">No users found. Check the number (members\' numbers have 7 digits and start with 199...).</div>'; return; }
        out.slice(0, 20).forEach(p => res.appendChild(hitRow(p, liveOf(p) ? 'online now' : 'offline')));
      }
    });
  }
  function showHistory(nick) {
    const a = hist(nick);
    const lines = a.map(([ts, dir, t]) => `[${d99(ts)} ${hhmm(ts)}] ${dir === 'o' ? (Net.me.nick || 'Me') : nick}: ${t}`);
    txt(`History - ${String(nick).slice(0, 20)}.txt`, `UH-OH! MESSAGE HISTORY WITH ${String(nick).toUpperCase()}\n${'='.repeat(40)}\n\n${lines.join('\n') || '(No messages yet. Say hello!)'}\n`);
  }
  function editAway() {
    const f = h('form', 'so-away');
    f.innerHTML = ['away', 'na', 'occ', 'dnd'].map(k => `<label class="so-alab">${ico(STAT[k][1])} ${esc(STAT[k][0])}</label><input type="text" maxlength="120" data-k="${k}">`).join('') + '<div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" data-x="def">Defaults</button><button class="btn" type="submit">OK</button></div>';
    f.querySelectorAll('input').forEach(i => { i.value = UM.away[i.dataset.k] || ''; });
    const w = Apps.win('Away Messages', f, { w: 360, icon: LOGO16, noResize: true, noMax: true, escClose: true });
    f.querySelector('[data-x=def]').addEventListener('click', () => f.querySelectorAll('input').forEach(i => { i.value = AWAY_DEF[i.dataset.k]; }));
    f.addEventListener('submit', ev => { ev.preventDefault(); f.querySelectorAll('input').forEach(i => { UM.away[i.dataset.k] = clean(i.value, 120) || AWAY_DEF[i.dataset.k]; }); store.set('jhp_social_away', UM.away); sendStatus(0); w.close(); });
  }
  function ignoreList() {
    const list = [...ignored];
    if (!list.length) return Desk.msgbox('Ignore List', "You're not ignoring anybody. How nice of you.", 'info');
    Desk.msgbox('Ignore List', `You are ignoring:\n\n${list.join('\n')}\n\nClear the whole list?`, 'q', [['Clear', () => { ignored.clear(); store.set('jhp_social_ignore', []); renderCL(); }], ['Keep']]);
  }

  return { fileMenu, fileOffer, fileReply, userInfo, findUser, showHistory, editAway, ignoreList };
};
