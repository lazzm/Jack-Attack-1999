/* THE FAMILY PC: it's not just Jack's computer. Mom's, Dad's and Jack's little sister's files turn up on their 1999 dates (js/family-files.js),
 * "Who's been on the computer?!" sticky notes, Jack's Mobile (a Talkbrik T-99 pocket phone with Snake, a ringtone composer,
 * predictive text and real texts to other visitors: js/family-phone.js + app/mods/sms.js), the Jackotchi nag and the Jackotchi
 * Graveyard (js/family-pet.js), and the family's dot-matrix printer that prints a real PNG (js/family-print.js).
 * Dev: ?famdate=MM-DD fakes the 1999 date for this pack only (files, stickies and texts). */
(function () {
  if (!window.Apps || !window.Desk) return;
  const A = Apps, esc = A.esc, store = A.store;
  const $ = id => document.getElementById(id);
  const pad2 = n => String(n).padStart(2, '0');
  const touch = () => matchMedia('(hover:none)').matches;

  // ================================================================ the date (with a dev override)
  const DEV = (() => {
    const m = /[?&]famdate=(\d\d)-?(\d\d)/.exec(location.search);
    if (!m) return 0;
    const md = +m[1] * 100 + +m[2];
    return md >= 101 && md <= 1231 ? md : 0;
  })();
  function today() {
    if (DEV) { const m = Math.floor(DEV / 100), d = DEV % 100; return { m, d, md: DEV, date: new Date(1999, m - 1, d) }; }
    return Desk.today99();
  }
  const mdOf = s => { const m = /^(\d\d)\/(\d\d)\/99$/.exec(s || ''); return m ? +m[2] * 100 + +m[1] : 0; };
  const happened = date => mdOf(date) <= today().md;
  const todayStr = () => { const t = today(); return `${pad2(t.d)}/${pad2(t.m)}/99`; };

  // ================================================================ secrets (all fam.*)
  [['fam.dadfolder', 'Do not delete', 'Dad has a folder you are definitely not allowed in'],
   ['fam.bike', 'Father Christmas\'s workshop', 'Somebody is building something on Christmas Eve'],
   ['fam.lucydiary', 'KEEP OUT means you', 'Read a little girl\'s private diary (naughty)'],
   ['fam.owed', 'Debt collector', 'Somebody owes Jack two quid'],
   ['fam.snake', 'Snake charmer', 'Score 100 on a phone game'],
   ['fam.t9', 'Predictive', 'Let the phone guess your words'],
   ['fam.tune', 'Ringtone composer', 'Write a tune with at least 8 notes and play it'],
   ['fam.text', 'Txt msg', 'Text a real person'],
   ['fam.textgot', 'U hav 1 msg', 'Get a text from a real person'],
   ['fam.topup', 'Top-up card', 'Find a top-up code in the magazine'],
   ['fam.topup2', 'For emergencies only', 'Dad keeps a top-up card somewhere'],
   ['fam.flat', 'Battery low', 'Let the phone run completely flat'],
   ['fam.flower', 'Gone but not forgotten', 'Leave a flower for a lost Jackotchi'],
   ['fam.printout', 'Hard copy', 'Print something on the dot-matrix and keep it'],
   ['fam.jam', 'Paper jam', 'Pull a crumpled page out of the dot-matrix'],
  ].forEach(s => A.defineSecret(...s));

  // ================================================================ icons
  const PHONE32 = '<svg viewBox="0 0 32 32"><rect x="20" y="1" width="3" height="7" rx="1" fill="#333" stroke="#000"/><rect x="8" y="5" width="16" height="26" rx="4" fill="#3a4a6a" stroke="#000"/><rect x="10" y="9" width="12" height="8" fill="#9fcf4f" stroke="#1a2a10"/><path d="M11 11h6M11 13h8M11 15h4" stroke="#2a4a10"/><g fill="#d8d8d8" stroke="#000" stroke-width=".5"><rect x="10" y="19" width="3" height="2" rx=".8"/><rect x="14.5" y="19" width="3" height="2" rx=".8"/><rect x="19" y="19" width="3" height="2" rx=".8"/><rect x="10" y="22.5" width="3" height="2" rx=".8"/><rect x="14.5" y="22.5" width="3" height="2" rx=".8"/><rect x="19" y="22.5" width="3" height="2" rx=".8"/><rect x="10" y="26" width="3" height="2" rx=".8"/><rect x="14.5" y="26" width="3" height="2" rx=".8"/><rect x="19" y="26" width="3" height="2" rx=".8"/></g><path d="M13 6.5h6" stroke="#111" stroke-width="1.2"/></svg>';
  const PRN32 = '<svg viewBox="0 0 32 32"><path d="M7 4h18v9H7z" fill="#fff" stroke="#000"/><path d="M9 7h14M9 10h10" stroke="#777"/><rect x="2" y="12" width="28" height="11" rx="2" fill="#e8dcc0" stroke="#000"/><rect x="5" y="17" width="22" height="2" fill="#333"/><rect x="24" y="14" width="3" height="1.5" fill="#2a9a2a"/><path d="M6 23h20l2 6H4z" fill="#fff" stroke="#000"/><g fill="#999"><circle cx="6.5" cy="26" r=".8"/><circle cx="25.5" cy="26" r=".8"/></g><path d="M8 26h14" stroke="#555" stroke-dasharray="1 1"/></svg>';
  const TOMB = '<svg viewBox="0 0 32 32"><rect x="0" y="24" width="32" height="8" fill="#3a9a2a"/><path d="M9 26V12a7 7 0 0 1 14 0v14z" fill="#c8c8c8" stroke="#000"/><path d="M13 14h6M16 11v8" stroke="#555" stroke-width="1.5"/><circle cx="6" cy="25" r="2" fill="#ff6ab8"/><circle cx="26" cy="25" r="2" fill="#ffd400"/></svg>';

  // ================================================================ family files (content in js/family-files.js, loaded when the PC is idle)
  const PENDING = [];
  const TODAYS = [];
  function addFile(path, node) {
    if (node.type === 'dir') { const d = A.fs.dir(path + '/' + node.name); Object.assign(d, node, { kids: d.kids }); return d; }
    if (node.date && !happened(node.date)) { PENDING.push([path, node]); return node; }
    if (node.date === todayStr()) TODAYS.push([path, node]);
    return A.fs.add(path, node);
  }
  setInterval(() => { for (let i = PENDING.length - 1; i >= 0; i--) if (happened(PENDING[i][1].date)) { A.fs.add(PENDING[i][0], PENDING[i][1]); PENDING.splice(i, 1); } }, 600000);
  // office documents (WordPad / JackCalc) are looked up by key in window.OfficeDocs, which js/office-docs.js creates lazily
  const DOCS = {};
  try {
    if (window.OfficeDocs) Object.assign(window.OfficeDocs, DOCS);
    else { let v; Object.defineProperty(window, 'OfficeDocs', { configurable: true, enumerable: true, get: () => v, set: x => { v = x; if (x && typeof x === 'object') Object.assign(x, DOCS); } }); }
  } catch (e) {}
  function addDocs(o) { Object.assign(DOCS, o); if (window.OfficeDocs) Object.assign(window.OfficeDocs, o); }
  function whoSaved(path) { return /\/Mom\b/.test(path) ? 'Mom' : /DAD|\/Dad\b/.test(path) ? 'Dad' : path.startsWith('C:/My Documents/' + Cast.n('sister')) ? Cast.n('sister') : 'Jack'; }
  function announce() {
    if (!TODAYS.length) return;
    const key = 'jhp_family_ann', seen = store.get(key, '');
    if (seen === todayStr()) return;
    store.set(key, todayStr());
    const [path, node] = TODAYS[0];
    setTimeout(() => Desk.toast('New on the family PC', `${whoSaved(path)} saved "${node.name}" today.${TODAYS.length > 1 ? ` (And ${TODAYS.length - 1} more.)` : ''}`, 7000), 12000);
  }

  // ================================================================ sticky notes on the desktop: "WHO'S BEEN ON THE COMPUTER?!"
  const STICKY_KEY = 'jhp_family_stickies';
  const stickyCss = document.createElement('style');
  stickyCss.textContent = `.fam-sticky{position:absolute;width:150px;min-height:120px;padding:18px 10px 10px;background:#fff68f;box-shadow:2px 3px 6px rgba(0,0,0,.35);font:15px/1.25 "Comic Sans MS","Comic Neue","Chalkboard SE",cursive;color:#102060;transform:rotate(var(--r,-2deg));z-index:3;cursor:pointer;touch-action:none;user-select:none;white-space:pre-line}
.fam-sticky:before{content:"";position:absolute;left:45px;top:-7px;width:60px;height:16px;background:rgba(255,255,255,.55);border:1px solid rgba(0,0,0,.08);transform:rotate(-3deg)}
.fam-sticky b{display:block;font-size:16px;color:#b00000;margin-bottom:4px}
.fam-sticky i{display:block;text-align:right;font-style:normal;margin-top:6px}
.fam-sticky .x{position:absolute;right:3px;top:1px;font:bold 12px Tahoma,sans-serif;color:#806000;background:none;border:0;padding:2px 5px;cursor:pointer}
.fam-sticky.peel{transition:transform .5s,opacity .5s;transform:rotate(25deg) translate(60px,-40px);opacity:0}
.fam-nag{position:relative;width:20px;height:20px;padding:0;border:0;background:none;display:none;align-items:center;justify-content:center;cursor:pointer}
.fam-nag.on{display:inline-flex}
.fam-nag svg{width:16px;height:16px;animation:famnag 1s steps(2) infinite}
@keyframes famnag{50%{transform:translateY(-2px)}}
@media (max-width:600px){.fam-sticky{width:120px;min-height:96px;font-size:13px}}`;
  document.head.appendChild(stickyCss);
  const STICKIES = [];
  function sticky(list) { STICKIES.push(...list); drawStickies(); }
  function drawStickies() {
    const gone = store.get(STICKY_KEY, {});
    document.querySelectorAll('.fam-sticky').forEach(e => e.remove());
    if (!window.FAM_STICKIES) return; // Jack asked for no sticky notes on the desktop (the notes stay in the data, switched off)
    const live = STICKIES.filter(s => happened(s.date) && !gone[s.id]).sort((a, b) => mdOf(b.date) - mdOf(a.date)).slice(0, innerWidth < 700 ? 1 : 3);
    live.forEach((s, i) => {
      const e = document.createElement('div'); e.className = 'fam-sticky'; e.setAttribute('role', 'note');
      e.style.setProperty('--r', (s.rot != null ? s.rot : (i % 2 ? 3 : -2)) + 'deg');
      const W = innerWidth;
      if (W < 700) { e.style.left = Math.max(8, Math.min(W - 140, W - 150 - i * 18)) + 'px'; e.style.top = (250 + i * 40) + 'px'; }
      else { e.style.left = Math.max(260, Math.min(W - 180, W * 0.36 + i * 178)) + 'px'; e.style.top = (64 + (i % 2) * 46) + 'px'; }
      e.innerHTML = `<button class="x" type="button" aria-label="Peel off">x</button><b>${esc(s.head)}</b>${esc(s.text)}<i>- ${esc(s.by)}</i>`;
      let drag = null, moved = false;
      e.addEventListener('pointerdown', ev => { if (ev.target.closest('.x')) return; drag = { x: ev.clientX - e.offsetLeft, y: ev.clientY - e.offsetTop }; moved = false; e.setPointerCapture(ev.pointerId); });
      e.addEventListener('pointermove', ev => { if (!drag) return; moved = true; e.style.left = Math.max(0, Math.min(innerWidth - 60, ev.clientX - drag.x)) + 'px'; e.style.top = Math.max(0, Math.min(innerHeight - 80, ev.clientY - drag.y)) + 'px'; });
      e.addEventListener('pointerup', () => { if (drag && !moved) { A.secret('fam.sticky'); Sound.play('turn'); } drag = null; });
      e.querySelector('.x').addEventListener('click', () => { A.secret('fam.sticky'); const g = store.get(STICKY_KEY, {}); g[s.id] = 1; store.set(STICKY_KEY, g); e.classList.add('peel'); Sound.play('turn'); setTimeout(() => e.remove(), 520); });
      document.body.appendChild(e);
    });
  }

  // ================================================================ texts that arrive while the phone is in your pocket
  const SMS_KEY = 'jhp_family_sms';
  const sms = () => { const s = store.get(SMS_KEY, null) || {}; s.inbox = s.inbox || []; s.sent = s.sent || []; s.blocked = s.blocked || []; return s; };
  const saveSms = s => { s.inbox = s.inbox.slice(-60); s.sent = s.sent.slice(-40); store.set(SMS_KEY, s); };
  const phoneOpen = () => window.FamilyPhone && FamilyPhone.isOpen();
  if (window.Net) {
    Net.on('smsNew', m => {
      const it = m.item; if (!it || !it.id) return;
      const s = sms();
      Net.send({ t: 'smsAck', ids: [it.id] });
      if (s.blocked.includes(String(it.from).toLowerCase()) || s.inbox.some(x => x.id === it.id)) return;
      s.inbox.push({ id: it.id, from: it.from, fromNo: it.fromNo | 0, text: String(it.text || '').slice(0, 160), ts: it.ts || Date.now(), real: true, read: false });
      saveSms(s);
      A.secret('fam.textgot');
      if (phoneOpen()) FamilyPhone.incoming(it);
      else if (window.House && House.ok) { const b = () => { if (window.HouseMobile) HouseMobile.buzz(it); }; if (window.HouseMobile) b(); else A.load('js/hs-mobile.js').then(b, b); } // (the real phone is in the room: it buzzes there)
      else { Desk.toast('Jack\'s Mobile  *bzzzt*', `1 message received from ${it.from}. (Start > Programs > Accessories > Jack's Mobile)`, 7000); Sound.play('beep'); nagPhone(true); }
    });
    Net.on('smsSent', m => { if (window.FamilyPhone) FamilyPhone.net(m); });
    Net.on('smsDelivered', m => {
      const s = sms(), x = s.sent.find(y => y.id === m.id); if (x) { x.status = 'delivered'; saveSms(s); }
      if (phoneOpen()) FamilyPhone.net(m); else Desk.toast('Jack\'s Mobile', `Delivered: ${m.to}`, 3500);
    });
  }
  let phoneTray = null;
  function nagPhone(on) {
    const tray = $('tray'); if (!tray) return;
    if (on && !phoneTray) {
      phoneTray = document.createElement('button'); phoneTray.type = 'button'; phoneTray.className = 'fam-nag on'; phoneTray.title = 'Jack\'s Mobile: new message'; phoneTray.setAttribute('aria-label', 'Jack\'s Mobile: new message');
      phoneTray.innerHTML = PHONE32;
      phoneTray.addEventListener('click', () => { openPhone(); });
      tray.insertBefore(phoneTray, $('clock') || null);
    }
    if (!on && phoneTray) { phoneTray.remove(); phoneTray = null; }
  }

  // ================================================================ Jack's Mobile (lazy)
  const inRoom = !!(window.House && House.ok); // (the house is there: the phone is a real thing in Jack's room, js/hs-mobile.js, not a program)
  function openPhone(arg) {
    nagPhone(false);
    if (inRoom) { const r = () => window.HouseMobile && HouseMobile.route(arg); return window.HouseMobile ? Promise.resolve(r()) : A.load('js/hs-mobile.js').then(r, r); }
    return A.load('js/family-phone.js').then(() => FamilyPhone.open(arg)).catch(e => { console.error(e); Desk.msgbox('Jack\'s Mobile', 'No signal. (Could not load the phone. Try again in a minute.)', 'warn'); });
  }
  A.register('family.phone', { cmd: inRoom ? [] : ['mobile', 'jacksmobile', 'talkbrik', 'phone', 'texts'], open: arg => openPhone(arg) });
  if (!inRoom) { A.addProgram(['Accessories', 'Jack\'s Mobile'], 'family.phone', PHONE32); A.desktopIcon('Jack\'s Mobile', PHONE32, () => A.open('family.phone'), 'iconFamPhone'); }

  // ================================================================ the Jackotchi nag (reads the Jackotchi's own save; js/apps-fun.js owns the pet)
  const GKEY = 'jhp_fun_grotchi', NAG = 'jhp_family_nag', BURIED = 'jhp_family_buried';
  let nagBtn = null;
  const roman = n => { const r = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, l] of r) while (n >= v) { s += l; n -= v; } return s || 'I'; };
  const petName = s => (store.get('jhp_family_petnames', {})[s.born] || ('Jackotchi ' + roman(s.gen || 1)));
  function petStats(s) {
    const hrs = k => (Date.now() - (s[k] || Date.now())) / 3600000;
    return { hungry: Math.max(0, 4 - Math.floor(hrs('fed') / 3)), happy: Math.max(0, 4 - Math.floor(hrs('played') / 4)), poop: Math.min(3, Math.floor(hrs('cleaned') / 6)), gone: hrs('fed') > 72, age: Math.floor((Date.now() - s.born) / 86400000), cared: (s.fed || 0) > (s.born || 0) + 3000 };
  }
  function petCheck() {
    const s = store.get(GKEY, null);
    if (!s || !s.born) return setNag(null);
    if (window.Setup && Setup.has && !Setup.has('grotchi')) return setNag(null); // no Jackotchi on this PC: nothing to nag about
    const k = petStats(s);
    if (k.gone) { if (k.cared) bury(s, k); return setNag(null); }
    const need = k.hungry < 2 ? 'hungry' : k.poop >= 2 ? 'dirty' : k.happy < 2 ? 'bored' : null;
    setNag(need, s);
    if (!need) return;
    const last = store.get(NAG, 0);
    if (Date.now() - last > 45 * 60000) {
      store.set(NAG, Date.now());
      const name = petName(s);
      const say = { hungry: [`Your Jackotchi is hungry!`, `${name} is looking at you with big sad eyes. Feed him a pizza before he ends up on www.jackotchigraveyard.kidz!`],
        dirty: [`Your Jackotchi needs cleaning!`, `${name} has done ${k.poop} little poos. They are steaming. Click the egg and press CLEAN.`],
        bored: [`Your Jackotchi is bored!`, `${name} has been staring at the wall for hours. Give him a game!`] }[need];
      setTimeout(() => { Desk.toast(say[0], say[1], 8000); Sound.play('beep'); }, 4000);
    }
  }
  function setNag(need) {
    const tray = $('tray'); if (!tray) return;
    if (!need) { if (nagBtn) { nagBtn.remove(); nagBtn = null; } return; } // only in the tray while the pet actually needs something
    if (!nagBtn) {
      nagBtn = document.createElement('button'); nagBtn.type = 'button'; nagBtn.className = 'fam-nag';
      nagBtn.innerHTML = '<svg viewBox="0 0 16 16"><path d="M1 1h14v10H7l-4 4v-4H1z" fill="#fff" stroke="#000"/><rect x="7" y="2.5" width="2" height="5" fill="#e10600"/><rect x="7" y="8.5" width="2" height="1.6" fill="#e10600"/></svg>';
      nagBtn.addEventListener('click', () => A.open('grotchi'));
      tray.insertBefore(nagBtn, $('clock') || null);
    }
    nagBtn.classList.toggle('on', !!need);
    const t = need ? `Your Jackotchi is ${need === 'dirty' ? 'dirty' : need}!` : '';
    nagBtn.title = t; nagBtn.setAttribute('aria-label', t || 'Jackotchi is fine');
  }
  function bury(s, k) {
    const done = store.get(BURIED, {}); if (done[s.born]) return;
    if (!window.Net || !Net.connected) return; // try again when we have a line
    const cause = k.age >= 7 ? 'old age (and a bit of hunger)' : 'ran off to join the circus (nobody fed him)';
    if (!Net.kv.push('fam.graves', `${petName(s)}|${s.gen || 1}|${Math.max(0, Math.floor((s.fed - s.born) / 86400000))}|${cause}`)) return;
    done[s.born] = Date.now(); store.set(BURIED, done);
    Desk.toast('Your Jackotchi has gone...', `${petName(s)} got too hungry and wandered off. There is a little memorial for him on www.jackotchigraveyard.kidz. A new egg will hatch when you open the Jackotchi.`, 9000);
  }
  setTimeout(petCheck, 6000); setInterval(petCheck, 60000);
  if (window.Net) {
    Net.on('welcome', m => { if (window.Family) Family.gubbinz = m.pet; setTimeout(petCheck, 3000); });
    Net.on('pet', m => { if (window.Family && m.pet) Family.gubbinz = m.pet; });
  }

  // ================================================================ www.jackotchigraveyard.kidz (lazy)
  if (window.IE && IE.addSite) {
    const page = () => {
      const el = document.createElement('div'); el.className = 'fam-gy-host'; el.innerHTML = '<p style="padding:20px;font:14px Tahoma,sans-serif">Opening page http://www.jackotchigraveyard.kidz/ ...</p>';
      A.load('js/family-pet.js').then(() => FamilyPet.render(el)).catch(() => { el.innerHTML = '<p style="padding:20px">The page cannot be displayed. (Try Refresh.)</p>'; });
      return el;
    };
    IE.addSite('www.jackotchigraveyard.kidz', { title: 'The Jackotchi Graveyard', desc: 'A peaceful place for Jackotchis who wandered off', cat: 'Kids', pages: { '/': { title: 'The Jackotchi Graveyard', html: page } } });
  }
  const goGraveyard = () => { const b = $('browser'); if (b) b.classList.remove('min'); IE.navigate('www.jackotchigraveyard.kidz'); };
  A.cmd(['jackotchigraveyard', 'grotchigraveyard', 'graveyard', 'www.jackotchigraveyard.kidz', 'jackotchigraveyard.kidz', 'www.grotchigraveyard.kidz', 'grotchigraveyard.kidz'], goGraveyard); // the old name still works

  // ================================================================ the top-up card printed in the magazine (bottom of the Cheats page)
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function topupCode(md) { const a = hash('talkbrik' + md), b = hash('chatter' + md * 7); return (String(a % 10000).padStart(4, '0') + String(b % 10000).padStart(4, '0') + String((a ^ b) % 10000).padStart(4, '0')); }
  const DAD_CODE = '199919992000';
  function topupAd() {
    const sec = document.querySelector('.sec[data-sec="cheats"]'); if (!sec || sec.querySelector('.fam-topup')) return;
    const code = topupCode(today().md), pretty = code.replace(/(\d{4})(?=\d)/g, '$1 ');
    const d = document.createElement('div'); d.className = 'fam-topup';
    d.innerHTML = `<div style="margin:18px auto 8px;max-width:440px;border:3px dashed #000;background:#e8f8ff;padding:10px 12px;font:13px/1.35 Tahoma,Verdana,sans-serif;color:#000;text-align:center">
      <div style="font:bold 20px Impact,'Anton',sans-serif;letter-spacing:1px;color:#0050a0">FREE! TALKBRIK TOP-UP CARD</div>
      <div>Got a pay-as-you-go mobile? Text your mates for FREE* with this week's JACK ATTACK! top-up card.</div>
      <div class="fam-scratch" role="button" tabindex="0" style="margin:8px auto;width:230px;height:30px;line-height:30px;background:repeating-linear-gradient(45deg,#b8b8b8 0 6px,#a8a8a8 6px 12px);border:2px solid #555;font:bold 18px 'Courier New',monospace;cursor:pointer;color:#555">SCRATCH HERE</div>
      <div style="font-size:11px">Phone: Menu &gt; Credit &gt; Top up, then key in the 12 numbers. New code printed every day.<br>*worth &pound;2.00 of texts. One go per day per phone. Ask the bill payer's permission (Mom).</div></div>`;
    const sc = d.querySelector('.fam-scratch');
    const reveal = () => { sc.style.background = '#fff'; sc.style.color = '#000'; sc.textContent = pretty; Sound.play('zap'); };
    sc.addEventListener('click', reveal); sc.addEventListener('keydown', ev => { if (ev.key === 'Enter') reveal(); });
    sec.appendChild(d);
  }
  document.addEventListener('section', ev => { if (String(ev.detail) === 'cheats') setTimeout(topupAd, 50); });
  setTimeout(() => { if (window.IE && IE.current === 'cheats') topupAd(); }, 1500);

  // ================================================================ the dot-matrix printer (lazy)
  const printer = () => A.load('js/family-print.js').then(() => window.FamilyPrint);
  // the open page in JackNet Explorer (ie.js's Print button can call this instead of window.print)
  function printPage() {
    const b = $('browser'); const sec = document.querySelector('#page .sec.on') || document.querySelector('#page');
    const title = (($('winTitle') || {}).textContent || document.title || 'JACK ATTACK! Online').replace(/ - JackNet Explorer$/, '');
    const url = (($('addrBar') || {}).value || 'http://www.jacklm.com/');
    return printDialog(title + '.htm', { el: sec, url, owner: (window.Net && Net.me && Net.me.nick) || 'Jack' }, () => window.print());
  }
  const printText = (doc, text, o) => printDialog(doc, Object.assign({ text: String(text || '') }, o || {}), null);
  // JackOS 98 Print dialog: the family's dot-matrix (real printout) or the JackJet 500 (js/system-progs.js)
  function printDialog(doc, o, jackjet) {
    const PRN = store.get('jhp_family_prn', 'dm');
    const b = document.createElement('form');
    b.innerHTML = `<fieldset class="group" style="margin:0 0 8px"><span class="lg">Printer</span>
      <div class="row" style="flex-wrap:nowrap"><label style="width:50px">Name:</label><select class="fam-pn" style="flex:1;min-width:0"><option value="dm">Family Dot Matrix (RattleTek DM-9)</option>${jackjet ? '<option value="jj">JackJet 500</option>' : ''}</select></div>
      <div class="row small" style="margin-top:4px"><label style="width:50px">Status:</label><span class="fam-st">Ready (it's always ready, it's from 1991)</span></div>
      <div class="row small"><label style="width:50px">Where:</label><span>LPT1: (the big plug)</span></div></fieldset>
      <div class="row small" style="margin-bottom:8px">Printing: <b style="margin-left:4px">${esc(doc)}</b></div>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="submit" style="min-width:75px">OK</button><button class="btn" type="button" data-c style="min-width:75px">Cancel</button></div>`;
    const sel = b.querySelector('select'); sel.value = jackjet && PRN === 'jj' ? 'jj' : 'dm';
    const st = b.querySelector('.fam-st');
    sel.addEventListener('change', () => { st.textContent = sel.value === 'jj' ? 'Out of cyan (ready-ish)' : 'Ready (it\'s always ready, it\'s from 1991)'; });
    const w = A.win('Print', b, { w: 360, noResize: true, noMax: true, noMin: true, escClose: true, icon: PRN32 });
    b.querySelector('[data-c]').addEventListener('click', w.close);
    b.addEventListener('submit', ev => {
      ev.preventDefault(); store.set('jhp_family_prn', sel.value); w.close();
      if (sel.value === 'jj' && jackjet) return jackjet();
      printer().then(P => P.print(doc, o)).catch(e => { console.error(e); Desk.msgbox('Print', 'There was an error writing to LPT1:. (Could not load the printer driver.)', 'warn'); });
    });
    setTimeout(() => sel.focus(), 30);
    return w;
  }
  // other programs print through window.Spooler (js/apps-system.js); jobs that carry their text can go to the dot-matrix
  if (window.Spooler && typeof Spooler.print === 'function' && !Spooler._fam) {
    const orig = Spooler.print.bind(Spooler);
    Spooler.print = (doc, o) => (o && o.text && !o.test) ? printDialog(String(doc || 'Untitled'), { text: o.text, owner: o.owner }, () => orig(doc, o)) : orig(doc, o);
    Spooler._fam = orig;
  }
  A.register('family.printq', { cmd: ['dotmatrix', 'rattletek', 'familyprinter'], open: () => printer().then(P => P.queue()) });
  A.addProgram(['Accessories', 'System Tools', 'Family Dot Matrix'], 'family.printq', PRN32);
  A.cmd(['printpage', 'print page'], () => printPage());

  // ================================================================ export + load the family's files when the PC is idle
  window.Family = { today, happened, mdOf, todayStr, dev: DEV, addFile, addDocs, sticky, sms, saveSms, openPhone, printPage, printText, printDialog, topupCode, DAD_CODE, petName, petStats, roman, nagPhone, icons: { PHONE32, PRN32, TOMB }, goGraveyard };
  const loadFiles = () => A.load('js/family-files.js').then(() => { announce(); }).catch(e => console.error(e));
  (window.requestIdleCallback ? cb => requestIdleCallback(cb, { timeout: 2500 }) : cb => setTimeout(cb, 1200))(loadFiles);
  addEventListener('resize', () => { if (STICKIES.length) drawStickies(); });
})();
