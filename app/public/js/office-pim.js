/* office-pim: Cardfile (the JackOS 3.1 index-card box), the Address Book, and Jack's 1999 Calendar / Scheduler. */
(function () {
  'use strict';
  const K = window.OfficeKit; if (!K) return;
  const { A, esc, h, qs, qsa, on, tap, touchy, msg, toast, today, ext, sfx, store, MONTHS, DAYS, pad2 } = K;
  const I = K.I;
  const DTMF = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477], 7: [852, 1209], 8: [852, 1336], 9: [852, 1477], 0: [941, 1336], '*': [941, 1209], '#': [941, 1477] };
  const CALLS = { // what you hear when you autodial someone
    '01632960123': ['Dave\'s Mom: "Hello? Oh, it\'s you! He\'s on his PlayStation. DAVID! PHONE!"', 'Dave: "...what? I was on the last level!"'],
    '01632960404': [Cast.t('{cousin}: "Yeah? Oh, hi. Did you scratch my CD? You scratched my CD."')],
    '01632960356': [Cast.t('{cousin2}: "Have you tried turning it off and on again?" (You haven\'t said anything yet.)')],
    '01632960222': ['Nan: "HELLO? Who is it? Oh, it\'s you! Did the jumper fit? Is it warm?"'],
    '01632960555': ['Tony: "Tony\'s Pizza! Large pepperoni? Is your Mom paying?"'],
    '01632960777': ['Receptionist: "Putting you through..."', 'Mom: "Is everything OK? Have you done your homework? Why are you ringing me at WORK?"'],
    '01632960888': ['Recorded voice: "Welcome to the Multiplex. For Star Wars Episode One, press 1. For everything else, why?"'],
    '09098790199': ['JackNet support: "Your call is important to us. You are number 47 in the queue. Calls cost 50p a minute."', '(You hang up VERY quickly. Mom checks the phone bill.)'],
  };
  function autodial(number, who) {
    const clean = String(number || '').replace(/[^0-9*#]/g, '');
    if (!clean) return msg('Autodial', `There's no phone number on ${who || 'this card'}.\n\n(Gubbinz doesn't have a phone. He just shouts.)`, 'info');
    const d = K.dialog('Autodial', `<div class="of-grid2"><label>Dial:</label><input type="text" class="dn" value="${esc(number)}"><label>Prefix:</label><input type="text" class="dp" value="" placeholder="9, for an outside line"></div><label style="display:block;margin-top:6px"><input type="checkbox" checked> Use tone dialling (not pulse - it's 1999)</label>`,
      [['OK', bb => { const n = qs(bb, '.dn').value.replace(/[^0-9*#]/g, ''); K.secret('carddial'); let t = 0; [...n].forEach(ch => { const p = DTMF[ch]; if (p) setTimeout(() => { try { Sound.note(p[0], 0.12, 'sine'); Sound.note(p[1], 0.12, 'sine'); } catch (e) {} }, t); t += 150; });
        setTimeout(() => { const lines = CALLS[n] || ['Ring ring... ring ring... ring ring...', 'Nobody answers. (They\'re probably on the Internet. The line is engaged.)']; msg('Autodial - ' + (who || n), `Dialling ${number}...\n\nPick up the phone now!\n\n${lines.join('\n\n')}`, 'info'); }, t + 300); }], ['Cancel']], { w: 320, icon: I.cardfile });
    return d;
  }
  K.autodial = autodial;

  // ================================================================ CARDFILE
  function openCardfile(arg) {
    arg = arg || {};
    let node = arg.node || null, name = node ? node.name : '(Untitled)', cards = [], cur = 0, mode = 'card', saved = '[]';
    const b = h('<div class="cf-bar"><span class="cf-mode">Card View</span><button class="btn cf-prev" type="button" aria-label="Previous card">&#9664;</button><button class="btn cf-next" type="button" aria-label="Next card">&#9654;</button><span class="cf-count"></span></div><div class="cf-stack"><div class="cf-cards"></div></div><div class="cf-list" hidden></div>', 'cf');
    const w = K.win('Cardfile - ' + name, b, { w: 470, h: 380, menubar: true, icon: I.cardfile, minW: 260, minH: 220, cls: 'w31' });
    const stack = qs(b, '.cf-cards'), list = qs(b, '.cf-list'), stackWrap = qs(b, '.cf-stack');
    const sortCards = () => { const front = cards[cur]; cards.sort((x, y) => x[0].localeCompare(y[0])); cur = Math.max(0, cards.indexOf(front)); };
    function draw() {
      qs(b, '.cf-count').textContent = `${cards.length} Card${cards.length === 1 ? '' : 's'}`;
      qs(b, '.cf-mode').textContent = mode === 'card' ? 'Card View' : 'List View';
      stackWrap.hidden = mode !== 'card'; list.hidden = mode === 'card';
      if (mode === 'list') { list.innerHTML = cards.map((c, i) => `<div class="cf-li${i === cur ? ' sel' : ''}" data-i="${i}">${esc(c[0])}</div>`).join(''); return; }
      if (!cards.length) { stack.innerHTML = '<p style="color:#fff;font-size:11px">No cards. Press F7 (Card &gt; Add) to add one.</p>'; return; }
      const n = Math.min(cards.length, Math.max(1, Math.floor((stackWrap.clientHeight - 210) / 20) + 1, 1), 8);
      const W = stackWrap.clientWidth - 24, cw = Math.min(300, W - (n - 1) * 12);
      let s = '';
      for (let k = n - 1; k >= 0; k--) {
        const i = (cur + k) % cards.length, c = cards[i];
        const x = k * Math.min(14, Math.max(4, (W - cw) / Math.max(1, n - 1))), y = (n - 1 - k) * 20;
        s += `<div class="cf-card${k ? ' back' : ''}" data-i="${i}" style="left:${x}px;top:${y}px;width:${cw}px;z-index:${10 - k}"><div class="cf-idx"><span>${esc(c[0])}</span>${k ? '' : `<small>${i + 1}/${cards.length}</small>`}</div>${k ? '' : `<div class="cf-body" contenteditable="true" spellcheck="false">${esc(c[1])}</div>`}</div>`;
      }
      stack.innerHTML = s; stack.style.height = ((n - 1) * 20 + 210) + 'px';
      const body = qs(stack, '.cf-body');
      if (body) on(body, 'input', () => { cards[cur][1] = body.innerText.replace(/\n$/, ''); });
    }
    on(stack, 'click', ev => { const c = ev.target.closest('.cf-card.back'); if (c) { cur = +c.dataset.i; draw(); sfx('click'); } else if (ev.target.closest('.cf-idx')) indexDlg(); });
    on(list, 'click', ev => { const r = ev.target.closest('.cf-li'); if (!r) return; cur = +r.dataset.i; draw(); });
    on(list, 'dblclick', () => { mode = 'card'; draw(); });
    const step = d => { if (!cards.length) return; cur = (cur + d + cards.length) % cards.length; draw(); };
    tap(qs(b, '.cf-prev'), () => step(-1)); tap(qs(b, '.cf-next'), () => step(1));
    new ResizeObserver(() => { if (!w.closed) draw(); }).observe(stackWrap);
    function indexDlg() { if (!cards.length) return; K.dialog('Index', `<div class="of-grid2"><label>Index Line:</label><input type="text" class="ix" maxlength="40" value="${esc(cards[cur][0])}"></div>`, [['OK', bb => { const v = qs(bb, '.ix').value.trim(); if (!v) return false; cards[cur][0] = v; sortCards(); draw(); }], ['Cancel']], { w: 320, icon: I.cardfile }); }
    function addDlg() { K.dialog('Add', `<div class="of-grid2"><label>Add:</label><input type="text" class="ix" maxlength="40" placeholder="e.g. DAVE'S NEW PHONE NUMBER"></div>`, [['OK', bb => { const v = qs(bb, '.ix').value.trim(); if (!v) return false; cards.push([v, '']); cur = cards.length - 1; sortCards(); mode = 'card'; draw(); K.secret('cardadd'); setTimeout(() => { const bd = qs(stack, '.cf-body'); if (bd) bd.focus(); }, 50); }], ['Cancel']], { w: 320, icon: I.cardfile }); }
    function delCard() { if (!cards.length) return; msg('Cardfile', `Delete "${cards[cur][0]}"?`, 'q', [['OK', () => { cards.splice(cur, 1); cur = Math.min(cur, cards.length - 1); cur = Math.max(0, cur); draw(); }], ['Cancel']]); }
    let fq = '';
    function find(next) {
      const go = q => { fq = q; const low = q.toLowerCase(); for (let k = 1; k <= cards.length; k++) { const i = (cur + (next ? k : k - 1)) % cards.length; if ((cards[i][0] + '\n' + cards[i][1]).toLowerCase().includes(low)) { cur = i; mode = 'card'; draw(); return; } } msg('Cardfile', `Cannot find "${q}"`, 'info'); };
      if (next && fq) return go(fq);
      K.dialog('Find', `<div class="of-grid2"><label>Find What:</label><input type="text" class="fq" value="${esc(fq)}"></div>`, [['Find Next', bb => { const q = qs(bb, '.fq').value.trim(); if (q) go(q); return false; }], ['Cancel']], { w: 320, side: true, icon: I.cardfile });
    }
    function goTo() { K.dialog('Go To', `<div class="of-grid2"><label>Go To:</label><input type="text" class="fq"></div>`, [['OK', bb => { const q = qs(bb, '.fq').value.trim().toLowerCase(); const i = cards.findIndex(c => c[0].toLowerCase().includes(q)); if (i < 0) { msg('Cardfile', `Cannot find "${q}"`, 'info'); return false; } cur = i; draw(); }], ['Cancel']], { w: 300, icon: I.cardfile }); }
    const dirty = () => JSON.stringify(cards) !== saved;
    function load(n) { K.readDoc(n).then(d => { node = n; name = n.name; cards = (d && d.cards ? d.cards : []).map(c => [c[0], c[1]]); cur = 0; sortCards(); saved = JSON.stringify(cards); w.setTitle('Cardfile - ' + name); draw(); }); }
    const confirm = next => dirty() ? K.askSave('Cardfile', name, save, next) : next();
    K.guardClose(w, 'Cardfile', () => name, dirty, save);
    const TYPES = [['Cardfile (*.crd)', ['crd']]];
    const openDlg = merge => K.fileDlg({ mode: 'open', title: merge ? 'File Merge' : 'File Open', types: TYPES, dir: node ? K.pathOf(node) : K.MD + '/Cardfiles', icon: I.cardfile }, n => { if (ext(n.name) !== 'crd') return msg('Cardfile', 'Not a valid card file.', 'warn'); if (merge) K.readDoc(n).then(d => { (d && d.cards || []).forEach(c => cards.push([c[0], c[1]])); sortCards(); draw(); toast('Cardfile', `Merged ${n.name}.`, 2500); }); else confirm(() => load(n)); });
    function save(then) { if (node && node.user) return write(K.pathOf(node), node.name, then); if (node) return msg('Cardfile', `${name}\n\nThis file is read-only. (It's one of Jack's.)\n\nSave a copy with a different name?`, 'warn', [['Save As...', () => saveAs(then)], ['Cancel']]); saveAs(then); }
    function saveAs(then) { K.fileDlg({ mode: 'save', title: 'File Save As', types: TYPES, name: node ? 'My ' + node.name : '', dir: node ? K.pathOf(node) : K.MD + '/Cardfiles', icon: I.cardfile }, t => write(t.dir, t.name, then)); }
    function write(dir, fname, then) { const n = K.saveUser(dir, fname, 'crd', { cards }); if (!n) return; node = n; name = fname; saved = JSON.stringify(cards); w.setTitle('Cardfile - ' + name); toast('Cardfile', `Saved ${fname}.`, 2000); if (then) then(); }
    A.menubar(w, [
      ['File', () => [{ label: 'New', act: () => confirm(() => { node = null; name = '(Untitled)'; cards = []; saved = '[]'; w.setTitle('Cardfile - ' + name); draw(); }) }, { label: 'Open...', act: () => confirm(() => openDlg(false)) }, { label: 'Save', act: () => save() }, { label: 'Save As...', act: () => saveAs() }, { label: 'Print', act: () => msg('Cardfile', `Printing "${cards[cur] ? cards[cur][0] : ''}"... Out of cyan. The card came out orange.`, 'warn') }, { label: 'Print All', act: () => msg('Cardfile', `Printing ${cards.length} cards... The printer has asked for a holiday.`, 'warn') }, { label: 'Merge...', act: () => openDlg(true) }, '-', { label: 'Exit', act: () => confirm(() => { saved = JSON.stringify(cards); w.close(); }) }]],
      ['Edit', () => [{ label: 'Undo', dis: true }, '-', { label: 'Cut', key: 'Ctrl+X', act: () => document.execCommand('cut') }, { label: 'Copy', key: 'Ctrl+C', act: () => document.execCommand('copy') }, { label: 'Paste', key: 'Ctrl+V', act: () => document.execCommand('paste') }, '-', { label: 'Index...', key: 'F6', act: indexDlg }, { label: 'Restore', act: () => { if (node) load(node); } }]],
      ['View', () => [{ label: 'Card', rad: mode === 'card', act: () => { mode = 'card'; draw(); } }, { label: 'List', rad: mode === 'list', act: () => { mode = 'list'; draw(); } }]],
      ['Card', () => [{ label: 'Add...', key: 'F7', act: addDlg }, { label: 'Delete', act: delCard }, { label: 'Duplicate', act: () => { if (cards[cur]) { cards.push([cards[cur][0] + ' (copy)', cards[cur][1]]); sortCards(); draw(); } } }, { label: 'Autodial...', key: 'F5', act: () => { const c = cards[cur]; if (c) autodial((/0\d{3,4}[ \d]{6,8}\d/.exec(c[1]) || [''])[0], c[0]); } }]],
      ['Search', () => [{ label: 'Go To...', key: 'F4', act: goTo }, { label: 'Find...', act: () => find(false) }, { label: 'Find Next', key: 'F3', act: () => find(true) }]],
      ['Help', () => [{ label: 'Contents', act: () => A.openFile({ name: 'Cardfile Help.txt', type: 'txt', text: 'CARDFILE HELP\n=============\n\nCardfile is a box of index cards, like the one on Mom\'s kitchen shelf, but on a computer.\n\nThe front card is the one you can type on. Click a card behind it to bring it to the front.\nF7 adds a card. F6 changes the index line (the bit at the top). F5 rings the phone number on the card.\nF4 jumps to a card. F3 finds the next match.\n\nIt came with JackOS 3.1. Dad still uses it for recipes.' }) }, '-', { label: 'About Cardfile...', act: () => msg('About Cardfile', 'Cardfile\nVersion 3.1\n\nFor index cards. Every family had one.\n\nFree memory: 4,096 KB (Dad\'s old computer)', 'info') }]],
    ]);
    w.el.addEventListener('keydown', ev => { if (ev.key === 'F7') { ev.preventDefault(); addDlg(); } else if (ev.key === 'F6') { ev.preventDefault(); indexDlg(); } else if (ev.key === 'F4') { ev.preventDefault(); goTo(); } else if (ev.key === 'F3') { ev.preventDefault(); find(true); } else if (ev.key === 'F5') { ev.preventDefault(); const c = cards[cur]; if (c) autodial((/0\d{3,4}[ \d]{6,8}\d/.exec(c[1]) || [''])[0], c[0]); } else if (ev.key === 'PageDown' && !ev.target.closest('.cf-body')) step(1); else if (ev.key === 'PageUp' && !ev.target.closest('.cf-body')) step(-1); });
    if (node) load(node); else { cards = []; draw(); }
    return w;
  }

  // ================================================================ ADDRESS BOOK
  const DEFAULT_CONTACTS = Cast.deep([ // names from the visitor's cast (js/cast.js)
    { n: 'Dave', e: 'dave@hotjack.jnet', hp: '01632 960123', g: 'Mates', note: 'Best mate. Owes me a floppy disk.' },
    { n: 'Cousin {cousin}', e: '{cousin.slug}.the.great@hotjack.jnet', hp: '01632 960404', g: 'Family', note: 'Has a PlayStation. Do NOT scratch {cousin.his} CDs.' },
    { n: 'Cousin {cousin2}', e: '{cousin2.slug}_the_great@hotjack.jnet', hp: '01632 960356', g: 'Family', note: 'Says he didn\'t send the virus. He sent the virus.' },
    { n: 'Nan', e: '', hp: '01632 960222', g: 'Family', note: 'No e-mail. Thinks e-mail is "for spies". Ring on Sundays.' },
    { n: 'Gran and Grandad', e: 'gran.and.grandad@jacknet.jnet', hp: '', g: 'Family', note: 'Have e-mail. Type IN CAPITALS.' },
    { n: 'Mom (at work)', e: '', bp: '01632 960777', g: 'Family', co: 'Mom\'s work', note: 'Only ring if it\'s an emergency. "I\'m bored" is not an emergency.' },
    { n: 'Dad (at work)', e: 'dad.at.work@jacknet.jnet', bp: '01632 960778', g: 'Family', co: 'Dad\'s office', note: 'Will reply with "ok" and nothing else.' },
    { n: 'Tony\'s Pizza', e: '', bp: '01632 960555', g: 'Takeaways', co: 'Tony\'s Pizza', note: 'Large pepperoni + garlic bread. Cash on the door. Is your Mom paying?' },
    { n: 'Golden Dragon (Chinese)', e: '', bp: '01632 960556', g: 'Takeaways', co: 'Golden Dragon', note: 'Mom\'s favourite. Prawn crackers come free if you ask nicely.' },
    { n: '{teacher} (Computer Club)', e: 'computerclub@skool.kidz', bp: '01632 960900', g: 'School', co: 'School', note: 'Computer Club is Wednesdays. Bring a floppy.' },
    { n: 'School Office', e: '', bp: '01632 960901', g: 'School', co: 'School', note: 'For when I am "ill". (Mom rings, not me.)' },
    { n: 'Cinema times', e: '', bp: '01632 960888', g: 'Other', co: 'The Multiplex', note: 'Press 1 for films. Do not press 3.' },
    { n: 'JackNet Support', e: 'help@jacknet.jnet', bp: '0909 8790199', g: 'Other', co: 'JackNet', note: 'PREMIUM RATE. ASK MOM FIRST. 50p a minute!!!' },
    { n: 'Gubbinz', e: 'gubbinz@squigpen.grot', hp: '', g: 'Mates', co: 'Inside the computer', note: 'No phone. He just shouts. Address: the website, on his own page. Job: JackOS helper (self-appointed).' },
  ]);
  const ABKEY = 'jhp_office_wab';
  function openAbook() {
    let C = store.get(ABKEY, null) || JSON.parse(JSON.stringify(DEFAULT_CONTACTS)), grp = 'All', q = '', sel = -1;
    const saveC = () => store.set(ABKEY, C);
    const PI = '<svg viewBox="0 0 16 16"><rect x="5" y="1" width="6" height="6" fill="#f2c79a" stroke="#000"/><rect x="5" y="1" width="6" height="2" fill="#4a2a0a"/><path d="M2 15c0-5 12-5 12 0z" fill="#2a7ad8" stroke="#000"/></svg>';
    const GI = '<svg viewBox="0 0 16 16"><path d="M1 15c0-4 8-4 8 0zM7 15c0-4 8-4 8 0z" fill="#2a7ad8" stroke="#000"/><rect x="3" y="4" width="4" height="5" fill="#f2c79a" stroke="#000"/><rect x="9" y="4" width="4" height="5" fill="#f2c79a" stroke="#000"/></svg>';
    const TB = { new: '<svg viewBox="0 0 16 16"><rect x="2" y="1" width="5" height="5" fill="#f2c79a" stroke="#000"/><path d="M0.5 14c0-5 8-5 8 0z" fill="#2a7ad8" stroke="#000"/><path d="M12 6v8M8 10h8" stroke="#008000" stroke-width="2"/></svg>', props: '<svg viewBox="0 0 16 16"><rect x="2.5" y="1.5" width="11" height="13" fill="#fff" stroke="#000"/><rect x="3" y="2" width="10" height="3" fill="#000080"/><path d="M4 8h8M4 10h8M4 12h5" stroke="#808080"/></svg>', del: '<svg viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#e10600" stroke-width="2.5"/></svg>', find: '<svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5" fill="#cfe8ff" stroke="#000" stroke-width="1.3"/><path d="M10 10l4.5 4.5" stroke="#000" stroke-width="2"/></svg>', print: '<svg viewBox="0 0 16 16"><rect x="4" y="1.5" width="8" height="5" fill="#fff" stroke="#000"/><rect x="1.5" y="6.5" width="13" height="6" fill="#c0c0c0" stroke="#000"/><rect x="4" y="10.5" width="8" height="4" fill="#fff" stroke="#000"/></svg>', act: '<svg viewBox="0 0 16 16"><path d="M1 12c0-2 2-3 5-3s5 1 5 3v1H8v-1.5H4V13H1z" fill="#e10600" stroke="#000"/><rect x="9" y="2" width="6" height="5" fill="#fff" stroke="#000"/><path d="M9 2l3 2.5L15 2" fill="none" stroke="#000"/></svg>' };
    const b = h(`<div class="ab-groups"></div><div class="ab-left"><div class="ab-find"><label for="abq">Type name or select from list:</label><input type="text" id="abq" autocomplete="off"></div><div class="ab-list"></div></div>`, 'ab');
    const outer = h(''); outer.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0';
    const tb = K.toolbar([{ t: 'New Contact', i: TB.new, label: 'New', a: () => edit(-1) }, { t: 'Properties', i: TB.props, label: 'Properties', a: () => sel >= 0 && edit(sel) }, { t: 'Delete', i: TB.del, label: 'Delete', a: () => del() }, '|', { t: 'Find People', i: TB.find, label: 'Find People', a: () => findPeople() }, { t: 'Print', i: TB.print, label: 'Print', a: () => msg('Print', `Printing ${C.length} contacts in "Phone List" style...\n\nOut of cyan. Dave's number came out pink. It's still readable. Just.`, 'warn') }, { t: 'Action', i: TB.act, label: 'Action', a: bt => { const r = bt.getBoundingClientRect(); IE.menu([{ label: 'Send Mail', dis: sel < 0 || !C[sel].e, act: () => mail(C[sel]) }, { label: 'Dial...', dis: sel < 0, act: () => autodial(C[sel].hp || C[sel].bp, C[sel].n) }], r.left, r.bottom); } }]);
    outer.append(tb, b);
    const w = K.win('Address Book', outer, { w: 640, h: 400, menubar: true, status: true, icon: I.abook, minW: 280, minH: 200 });
    const groups = () => ['All', ...[...new Set(C.map(c => c.g || 'Other'))].sort()];
    const visible = () => C.map((c, i) => [c, i]).filter(([c]) => (grp === 'All' || (c.g || 'Other') === grp) && (!q || c.n.toLowerCase().includes(q))).sort((x, y) => x[0].n.localeCompare(y[0].n));
    function draw() {
      qs(b, '.ab-groups').innerHTML = groups().map(g => `<div class="g${g === grp ? ' sel' : ''}" data-g="${esc(g)}">${K.sel16(g === 'All' ? I.abook : GI)} ${esc(g === 'All' ? 'Shared Contacts' : g)}</div>`).join('');
      const v = visible();
      qs(b, '.ab-list').innerHTML = `<table><thead><tr><th>Name</th><th>E-Mail Address</th><th>Business Phone</th><th>Home Phone</th></tr></thead><tbody>${v.map(([c, i]) => `<tr data-i="${i}" class="${i === sel ? 'sel' : ''}"><td>${K.sel16(PI)}${esc(c.n)}</td><td>${esc(c.e || '')}</td><td>${esc(c.bp || '')}</td><td>${esc(c.hp || '')}</td></tr>`).join('')}</tbody></table>`;
      w.status.textContent = `${v.length} item(s)`;
    }
    on(qs(b, '.ab-groups'), 'click', ev => { const g = ev.target.closest('.g'); if (g) { grp = g.dataset.g; draw(); } });
    on(qs(b, '.ab-list'), 'click', ev => { const r = ev.target.closest('tr[data-i]'); if (!r) return; sel = +r.dataset.i; draw(); if (C[sel].n === 'Gubbinz') K.secret('abgrot'); });
    K.dbl(qs(b, '.ab-list'), ev => { const r = ev.target.closest('tr[data-i]'); if (r) edit(+r.dataset.i); });
    on(qs(b, '#abq'), 'input', ev => { q = ev.target.value.trim().toLowerCase(); const v = visible(); sel = v.length ? v[0][1] : -1; draw(); });
    function mail(c) { if (window.JackFiles && JackFiles.compose) JackFiles.compose({ to: `${c.n} <${c.e}>`, subj: '' }); else A.open('outlook'); }
    function del() { if (sel < 0) return; msg('Address Book', `Are you sure you want to permanently delete "${C[sel].n}" from your Address Book?`, 'q', [['Yes', () => { C.splice(sel, 1); sel = -1; saveC(); draw(); }], ['No']]); }
    function edit(i) {
      const c = i >= 0 ? C[i] : { n: '', e: '', hp: '', bp: '', g: grp === 'All' ? 'Mates' : grp, co: '', note: '' };
      if (c.n === 'Gubbinz') K.secret('abgrot');
      const pages = ['Summary', 'Name', 'Home', 'Business', 'Other'];
      const d = K.dialog(i >= 0 ? `${c.n} Properties` : 'Properties', `<div class="ab-props"><div class="tabs">${pages.map((p, j) => `<span class="${j ? '' : 'on'}" data-p="${j}">${p}</span>`).join('')}</div>
        <div class="tabpage" data-pg="0"><p><b>Summary of information about this contact</b></p><div class="of-grid2"><label>Name:</label><span>${esc(c.n) || '(new contact)'}</span><label>E-Mail:</label><span>${esc(c.e || '-')}</span><label>Home Phone:</label><span>${esc(c.hp || '-')}</span><label>Business Phone:</label><span>${esc(c.bp || '-')}</span><label>Group:</label><span>${esc(c.g || 'Other')}</span></div></div>
        <div class="tabpage" data-pg="1" hidden><div class="of-grid2"><label>Display name:</label><input type="text" class="an" value="${esc(c.n)}" maxlength="60"><label>E-Mail:</label><input type="text" class="ae" value="${esc(c.e || '')}" maxlength="80"><label>Group:</label><select class="ag">${['Mates', 'Family', 'School', 'Takeaways', 'Other'].map(g => `<option${g === c.g ? ' selected' : ''}>${g}</option>`).join('')}</select></div></div>
        <div class="tabpage" data-pg="2" hidden><div class="of-grid2"><label>Phone:</label><input type="text" class="ah" value="${esc(c.hp || '')}" maxlength="20" inputmode="tel"><label>Address:</label><input type="text" value="(not telling - privacy!)" disabled></div></div>
        <div class="tabpage" data-pg="3" hidden><div class="of-grid2"><label>Company:</label><input type="text" class="ac" value="${esc(c.co || '')}" maxlength="60"><label>Phone:</label><input type="text" class="ab2" value="${esc(c.bp || '')}" maxlength="20" inputmode="tel"></div></div>
        <div class="tabpage" data-pg="4" hidden><label class="of-small">Notes:</label><textarea class="ao" maxlength="300">${esc(c.note || '')}</textarea></div></div>`,
        [['OK', bb => { const n = qs(bb, '.an').value.trim(); if (!n) { msg('Address Book', 'You must type a name for this contact.', 'warn'); return false; } const nc = { n, e: qs(bb, '.ae').value.trim(), g: qs(bb, '.ag').value, hp: qs(bb, '.ah').value.trim(), co: qs(bb, '.ac').value.trim(), bp: qs(bb, '.ab2').value.trim(), note: qs(bb, '.ao').value }; if (i >= 0) C[i] = nc; else { C.push(nc); sel = C.length - 1; K.secret('abadd'); } saveC(); draw(); }], ['Cancel']], { w: 400, icon: I.abook });
      qsa(d.b, '.tabs span').forEach(t => tap(t, () => { qsa(d.b, '.tabs span').forEach(x => x.classList.toggle('on', x === t)); qsa(d.b, '.tabpage').forEach(p => { p.hidden = p.dataset.pg !== t.dataset.p; }); }));
      if (i < 0) qs(d.b, '.tabs span[data-p="1"]').click();
    }
    function findPeople() {
      const d = K.dialog('Find People', `<div class="of-grid2"><label>Look in:</label><select><option>Address Book</option><option>JackNet Directory</option><option>The Phone Book (Mom's, in the drawer)</option></select><label>Name:</label><input type="text" class="fn"><label>E-mail:</label><input type="text" class="fe"></div><div class="field of-list" style="margin-top:8px;height:90px"></div>`,
        [['Find Now', bb => { const n = qs(bb, '.fn').value.trim().toLowerCase(), e = qs(bb, '.fe').value.trim().toLowerCase(); const src = qs(bb, 'select').selectedIndex; const out = qs(bb, '.of-list'); if (src === 2) { out.innerHTML = '<div class="it">The phone book is under the telly. It\'s from 1996.</div>'; return false; } if (src === 1) { out.innerHTML = '<div class="it">JackNet Directory: could not connect. (Somebody is on the phone.)</div>'; return false; } const hits = C.filter(c => (!n || c.n.toLowerCase().includes(n)) && (!e || (c.e || '').toLowerCase().includes(e))); out.innerHTML = hits.map(c => `<div class="it">${esc(c.n)} <span style="color:#808080">${esc(c.e || c.hp || c.bp || '')}</span></div>`).join('') || '<div class="it">No matches.</div>'; if (hits.some(c => c.n === 'Gubbinz')) K.secret('abgrot'); return false; }], ['Close']], { w: 400, side: true, icon: I.abook });
      return d;
    }
    A.menubar(w, [
      ['File', [{ label: 'New Contact...', act: () => edit(-1) }, { label: 'Properties', act: () => sel >= 0 && edit(sel) }, { label: 'Delete', act: del }, '-', { label: 'Import', sub: [{ label: 'Address Book (WAB)...', act: () => msg('Import', 'Insert the floppy disk with the address book on it. (Not the Doom disk.)', 'info') }, { label: 'Business Card (vCard)...', act: () => msg('Import', 'vCard? Nobody Jack knows has a business card. Except Dad. His says "Dad".', 'info') }] }, { label: 'Export', sub: [{ label: 'Address Book (WAB)...', act: () => toast('Address Book', 'Exported to C:\\JACKOS\\Address Book.wab. (It was already there.)', 3000) }] }, '-', { label: 'Print...', act: () => msg('Print', 'Out of cyan.', 'warn') }, '-', { label: 'Close', act: w.close }]],
      ['Edit', [{ label: 'Select All', act: () => toast('Address Book', Cast.t('Selected everyone. Even {cousin2}.'), 2000) }, '-', { label: 'Find People...', key: 'Ctrl+F', act: findPeople }]],
      ['View', () => [{ label: 'Folders and Groups', chk: !qs(b, '.ab-groups').hidden, act: () => { const g = qs(b, '.ab-groups'); g.hidden = !g.hidden; } }, '-', { label: 'Reset to Jack\'s contacts', act: () => msg('Address Book', 'Put the Address Book back how Jack had it? Your own contacts will go.', 'q', [['OK', () => { C = JSON.parse(JSON.stringify(DEFAULT_CONTACTS)); saveC(); sel = -1; draw(); }], ['Cancel']]) }]],
      ['Tools', () => [{ label: 'Action', sub: [{ label: 'Send Mail', dis: sel < 0, act: () => mail(C[sel]) }, { label: 'Dial...', dis: sel < 0, act: () => autodial(C[sel].hp || C[sel].bp, C[sel].n) }] }]],
      ['Help', [{ label: 'About Address Book', act: () => msg('About Address Book', 'JackOS Address Book\nVersion 4.72.1999\n\nKeeps everyone\'s numbers so Mom doesn\'t have to shout them up the stairs.', 'info') }]],
    ]);
    w.el.addEventListener('keydown', ev => { if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'f') { ev.preventDefault(); findPeople(); } else if (ev.key === 'Delete' && ev.target.tagName !== 'INPUT') del(); else if (ev.key === 'Enter' && sel >= 0 && ev.target.tagName !== 'INPUT') edit(sel); });
    draw();
    return w;
  }

  // ================================================================ CALENDAR
  // [MM-DD, time, text, kind] kinds: hw (homework), sw (Star Wars), fun, '' (normal)
  const JACK = [
    ['01-01', '', 'NEW YEAR! Launched JACK ATTACK! Online', 'fun'], ['01-05', '08:45', 'Back to school (boo)', ''], ['01-16', '10:00', 'January sales with Mom (RUBIK\'S CUBE)', 'fun'],
    ['01-22', '09:00', 'Hand in: what I want to be when I grow up (English)', 'hw'], ['02-08', '09:00', 'Maths sheet 4 - fractions due', 'hw'], ['02-15', '', 'Half term!!!', 'fun'], ['02-16', '18:00', 'Pancake Day (Dad flips, Dad drops)', 'fun'],
    ['03-03', '09:00', 'French homework: ma famille', 'hw'], ['03-12', '19:00', 'Red Nose Day', 'fun'], ['03-14', '', 'MOTHER\'S DAY - card + breakfast in bed (don\'t burn the toast)', ''], ['03-15', '09:00', 'Geography: volcanoes project due', 'hw'],
    ['03-28', '01:00', 'Clocks go forward (lose an hour of sleep!!!)', ''], ['04-02', '', 'Good Friday', ''], ['04-04', '', 'Easter Sunday (EGGS)', 'fun'], ['04-27', '09:00', 'English: persuasive letter due', 'hw'],
    ['05-03', '', 'Bank holiday + Episode I toys in the shops!!!', 'sw'], ['05-10', '09:00', 'History: the Romans due', 'hw'], ['05-19', '', 'Episode I out in AMERICA (not fair)', 'sw'], ['05-31', '', 'Bank holiday', ''],
    ['06-04', '', 'Episode I: Racer out on N64', 'sw'], ['06-09', '15:30', Cast.t('Computer Club: show my web site to {teacher}'), 'hw'], ['06-20', '', 'FATHER\'S DAY - card for Dad (Championship Manager joke?)', ''],
    ['07-15', '20:00', 'Can\'t sleep. Episode I is TOMORROW.', 'sw'], ['07-16', '18:30', 'STAR WARS EPISODE I - cinema with Dave & Dad, row G!!!', 'sw'], ['07-23', '15:30', 'SUMMER HOLIDAYS START', 'fun'], ['07-24', '14:00', 'See Episode I again (Dave\'s turn to pay)', 'sw'],
    ['08-11', '11:00', 'TOTAL ECLIPSE - do NOT look at the Sun. Use the viewer.', 'fun'], ['08-30', '', 'Bank holiday', ''], ['09-06', '08:45', 'Back to school (BOO)', ''], ['09-08', '15:30', 'Computer Club starts again', ''],
    ['09-28', '09:00', 'English: spooky story due (it has a robot in it)', 'hw'], ['10-06', '09:00', 'Book report: The Hobbit', 'hw'], ['10-14', '', 'DREAMCAST OUT (£199.99, not that I\'m counting)', 'fun'], ['10-25', '', 'Half term', 'fun'],
    ['10-31', '02:00', 'Clocks go back + Halloween!', 'fun'], ['11-05', '19:00', 'Bonfire Night - sparklers (Mom: no rockets)', 'fun'], ['11-18', '02:00', 'Leonid meteors - set alarm!', 'fun'], ['12-17', '15:30', 'Last day of term', 'fun'],
    ['12-24', '', 'Christmas Eve - leave a mince pie out', 'fun'], ['12-25', '', 'CHRISTMAS DAY', 'fun'], ['12-26', '', 'Boxing Day (Nan\'s)', ''], ['12-31', '19:00', 'MILLENNIUM PARTY AT DAVE\'S!!! (stay up till midnight)', 'fun'],
  ];
  // weekly things
  const WEEKLY = [[3, '15:30', 'Computer Club', ''], [4, '09:00', 'French vocab test', 'hw'], [6, '10:00', 'Painting minis (and LEGO)', 'fun']];
  const CALKEY = 'jhp_office_cal';
  function openCalendar() {
    let mine = store.get(CALKEY, {}); // 'MM-DD' -> [{t, x, al}]
    const t0 = today();
    let m = t0.m, selD = t0.d, view = 'month';
    const b = h(`<div class="cl-head"><button class="btn cl-prev" type="button" aria-label="Previous month">&#9664;</button><b class="cl-title"></b><span><button class="btn cl-today" type="button">Today</button> <button class="btn cl-next" type="button" aria-label="Next month">&#9654;</button></span></div><div class="cl-main"><div class="cl-month"></div><div class="cl-year" hidden></div><div class="cl-side"><h4 class="cl-dt"></h4><div class="cl-evs"></div><div class="cl-add"><button class="btn" type="button">New Appointment...</button></div></div></div>`, 'cl');
    const w = K.win('Calendar - Jack\'s 1999 Diary', b, { w: 720, h: 470, menubar: true, status: true, icon: I.cal, minW: 280, minH: 300 });
    const key = (mm, dd) => pad2(mm) + '-' + pad2(dd);
    const clean = s => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&eacute;/g, 'é').replace(/&Eacute;/g, 'É');
    function eventsOn(mm, dd) {
      const k = key(mm, dd), dow = new Date(1999, mm - 1, dd).getDay();
      const out = JACK.filter(e => e[0] === k).map(e => ({ t: e[1], x: e[2], k: e[3] }));
      const term = !((mm === 7 && dd > 23) || mm === 8 || (mm === 12 && dd > 17) || (mm === 1 && dd < 5) || (mm === 2 && dd >= 15 && dd <= 19) || (mm === 4 && dd <= 16 && dd >= 2) || (mm === 10 && dd >= 25 && dd <= 29) || (mm === 5 && dd >= 31) || (mm === 6 && dd <= 4) || (mm === 9 && dd < 6));
      if (term) WEEKLY.forEach(wk => { if (wk[0] === dow && (dow === 6 || term)) out.push({ t: wk[1], x: wk[2], k: wk[3] }); });
      else WEEKLY.filter(wk => wk[0] === 6 && wk[0] === dow).forEach(wk => out.push({ t: wk[1], x: wk[2], k: wk[3] }));
      ((window.CAL && CAL.hype) || []).forEach(hy => { if (hy[0] === k && !out.some(o => clean(hy[1]).toLowerCase().split(' ').slice(-1)[0] && o.x.toLowerCase().includes(clean(hy[1]).toLowerCase().replace(/^the /, '').split(' ')[0]))) out.push({ t: '', x: 'OUT TODAY: ' + clean(hy[1]), k: /phantom|episode/i.test(hy[1]) ? 'sw' : 'fun' }); });
      (mine[k] || []).forEach((e, i) => out.push({ t: e.t, x: e.x, k: 'me', al: e.al, mi: i }));
      return out.sort((a, c) => (a.t || '00:00').localeCompare(c.t || '00:00'));
    }
    function drawMonth() {
      const first = new Date(1999, m - 1, 1).getDay(), days = new Date(1999, m, 0).getDate(), lead = (first + 6) % 7; // weeks start on Monday (UK)
      qs(b, '.cl-title').textContent = `${MONTHS[m - 1]} 1999`;
      let s = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="cl-dow">${d}</div>`).join('');
      const prevDays = new Date(1999, m - 1, 0).getDate();
      const cells = Math.ceil((lead + days) / 7) * 7;
      for (let i = 0; i < cells; i++) {
        const d = i - lead + 1, inM = d >= 1 && d <= days, dd = inM ? d : d < 1 ? prevDays + d : d - days, mm = inM ? m : d < 1 ? m - 1 : m + 1;
        const ev = inM ? eventsOn(m, d) : [], wk = i % 7 >= 5;
        s += `<div class="cl-day${inM ? '' : ' off'}${wk ? ' wknd' : ''}${inM && m === t0.m && d === t0.d ? ' today' : ''}${inM && d === selD ? ' sel' : ''}" ${inM ? `data-d="${d}"` : `data-o="${mm}"`}><b>${dd}</b>${ev.slice(0, 3).map(e => `<span class="ev ${e.k}">${esc(e.x)}</span>`).join('')}${ev.length > 3 ? `<span class="more">+${ev.length - 3} more</span>` : ''}${ev.length ? '<i class="dot"></i>' : ''}</div>`;
      }
      const grid = qs(b, '.cl-month'); grid.innerHTML = s; grid.style.gridTemplateRows = `auto repeat(${cells / 7},minmax(0,1fr))`;
    }
    function drawYear() {
      qs(b, '.cl-title').textContent = '1999';
      qs(b, '.cl-year').innerHTML = MONTHS.map((mn, i) => { const first = (new Date(1999, i, 1).getDay() + 6) % 7, days = new Date(1999, i + 1, 0).getDate(); let g = 'MTWTFSS'.split('').map(x => `<span class="hd">${x}</span>`).join('') + '<span></span>'.repeat(first); for (let d = 1; d <= days; d++) g += `<span class="${eventsOn(i + 1, d).some(e => e.k !== '' && e.k !== 'hw') ? 'ev' : ''}${i + 1 === t0.m && d === t0.d ? ' td' : ''}">${d}</span>`; return `<div class="cl-mini" data-m="${i + 1}"><b>${mn}</b><div class="g">${g}</div></div>`; }).join('');
    }
    function drawSide() {
      const dt = new Date(1999, m - 1, selD);
      qs(b, '.cl-dt').textContent = `${DAYS[dt.getDay()]} ${selD} ${MONTHS[m - 1]} 1999`;
      const ev = eventsOn(m, selD), news = ((window.CAL && CAL.posts) || []).filter(p => p[0] === key(m, selD) && (m * 100 + selD) <= t0.md);
      qs(b, '.cl-evs').innerHTML = (ev.length ? ev.map(e => `<div class="e ${e.k}"><span>${e.t ? `<b>${esc(e.t)}</b> ` : ''}${esc(e.x)}${e.al ? ' &#9200;' : ''}</span>${e.k === 'me' ? `<button type="button" data-del="${e.mi}" title="Delete" aria-label="Delete appointment">x</button>` : ''}</div>`).join('') : '<p style="color:#808080;margin:4px 0">Nothing on. Could be a Tetris day.</p>')
        + (news.length ? `<p style="margin:8px 0 3px"><b>JACK ATTACK! news that day:</b></p>${news.map(p => `<div class="e"><span><small>${esc(p[1])}</small>${esc(clean(p[2])).slice(0, 220)}</span></div>`).join('')}` : '');
      w.status.textContent = `${ev.length} appointment${ev.length === 1 ? '' : 's'}   |   Today is ${DAYS[t0.date.getDay()]} ${t0.d} ${MONTHS[t0.m - 1]} 1999`;
      if (m === 7 && selD === 16) K.secret('calphantom');
    }
    function draw() { qs(b, '.cl-month').hidden = view !== 'month'; qs(b, '.cl-year').hidden = view !== 'year'; if (view === 'month') drawMonth(); else drawYear(); drawSide(); }
    function month(d) {
      const nm = m + d;
      if (nm > 12) { K.secret('caly2k'); sfx('uhoh'); return msg('Calendar', 'January 2000 could not be displayed.\n\nThe calendar ends here. Nobody knows what happens after 31/12/1999. (Dad says the computers might all think it\'s 1900. Mom has bought 52 tins of beans just in case.)\n\nIt is always 1999.', 'warn'); }
      if (nm < 1) return msg('Calendar', '1998 is finished. It was fine. Nothing to see.', 'info');
      m = nm; selD = Math.min(selD, new Date(1999, m, 0).getDate()); draw();
    }
    tap(qs(b, '.cl-prev'), () => month(-1)); tap(qs(b, '.cl-next'), () => month(1));
    tap(qs(b, '.cl-today'), () => { m = t0.m; selD = t0.d; view = 'month'; draw(); });
    on(qs(b, '.cl-month'), 'click', ev => { const d = ev.target.closest('.cl-day'); if (!d) return; if (d.dataset.d) { selD = +d.dataset.d; draw(); } else if (d.dataset.o) month(+d.dataset.o - m); });
    on(qs(b, '.cl-month'), 'dblclick', ev => { if (ev.target.closest('.cl-day[data-d]')) addDlg(); });
    on(qs(b, '.cl-year'), 'click', ev => { const c = ev.target.closest('.cl-mini'); if (c) { m = +c.dataset.m; selD = 1; view = 'month'; draw(); } });
    on(qs(b, '.cl-evs'), 'click', ev => { const x = ev.target.closest('[data-del]'); if (!x) return; const k = key(m, selD); (mine[k] || []).splice(+x.dataset.del, 1); if (!mine[k].length) delete mine[k]; store.set(CALKEY, mine); draw(); });
    tap(qs(b, '.cl-add .btn'), () => addDlg());
    function addDlg() {
      K.dialog('New Appointment', `<p><b>${selD} ${MONTHS[m - 1]} 1999</b></p><div class="of-grid2"><label>Time:</label><select class="at"><option value="">All day</option>${Array.from({ length: 32 }, (_, i) => { const hh = 7 + Math.floor(i / 2), mm = i % 2 ? '30' : '00'; return `<option>${pad2(hh)}:${mm}</option>`; }).join('')}</select><label>What:</label><input type="text" class="ax" maxlength="80" placeholder="e.g. Feed Gubbinz"></div><label style="display:block;margin-top:6px"><input type="checkbox" class="aa"> Alarm (rings if JackOS is switched on)</label>`,
        [['OK', bb => { const x = qs(bb, '.ax').value.trim(); if (!x) return false; const k = key(m, selD); (mine[k] = mine[k] || []).push({ t: qs(bb, '.at').value, x, al: qs(bb, '.aa').checked }); store.set(CALKEY, mine); K.secret('caladd'); draw(); }], ['Cancel']], { w: 320, icon: I.cal });
    }
    function goDate() { K.dialog('Show Date', `<div class="of-grid2"><label>Show date (dd/mm/99):</label><input type="text" class="gd" value="${pad2(selD)}/${pad2(m)}/99"></div>`, [['OK', bb => { const mt = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(qs(bb, '.gd').value.trim()); if (!mt) { msg('Calendar', 'Please type a date like 16/07/99.', 'warn'); return false; } if (mt[3] && !/^(99|1999)$/.test(mt[3])) { K.secret('caly2k'); msg('Calendar', 'This calendar only does 1999. (It is always 1999.)', 'warn'); return false; } const mm = +mt[2], dd = +mt[1]; if (mm < 1 || mm > 12 || dd < 1 || dd > new Date(1999, mm, 0).getDate()) { msg('Calendar', 'That date doesn\'t exist. Not even in 1999.', 'warn'); return false; } m = mm; selD = dd; view = 'month'; draw(); }], ['Cancel']], { w: 300, icon: I.cal }); }
    A.menubar(w, [
      ['File', [{ label: 'Open Jack\'s Diary', act: () => { m = t0.m; selD = t0.d; draw(); } }, { label: 'Print...', act: () => msg('Print', `Printing ${MONTHS[m - 1]} 1999... Out of cyan. The weekends came out orange. (They're always orange in Jack's head anyway.)`, 'warn') }, '-', { label: 'Exit', act: w.close }]],
      ['Edit', [{ label: 'New Appointment...', key: 'Ins', act: () => addDlg() }, { label: 'Remove All My Appointments', act: () => msg('Calendar', 'Remove all the appointments you added? Jack\'s own ones stay.', 'q', [['OK', () => { mine = {}; store.set(CALKEY, mine); draw(); }], ['Cancel']]) }]],
      ['View', () => [{ label: 'Month', key: 'F9', rad: view === 'month', act: () => { view = 'month'; draw(); } }, { label: 'Year', rad: view === 'year', act: () => { view = 'year'; draw(); } }]],
      ['Show', [{ label: 'Today', act: () => qs(b, '.cl-today').click() }, { label: 'Previous Month', key: 'Ctrl+PgUp', act: () => month(-1) }, { label: 'Next Month', key: 'Ctrl+PgDn', act: () => month(1) }, { label: 'Date...', key: 'F4', act: goDate }, '-', { label: 'Episode I Day', act: () => { m = 7; selD = 16; view = 'month'; draw(); } }]],
      ['Help', [{ label: 'About Calendar', act: () => msg('About Calendar', 'Calendar 99\nKeeps track of Jack\'s 1999.\n\nRed = homework. Yellow = Star Wars. Green = fun. Purple = yours.\n\nIt only does 1999. After that, nobody knows.', 'info') }]],
    ]);
    w.el.addEventListener('keydown', ev => { if (ev.target.tagName === 'INPUT') return; if (ev.key === 'F4') { ev.preventDefault(); goDate(); } else if (ev.key === 'F9') { ev.preventDefault(); view = 'month'; draw(); } else if (ev.key === 'Insert') addDlg(); else if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' || ev.key === 'ArrowDown') { const dd = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: -7, ArrowDown: 7 }[ev.key], days = new Date(1999, m, 0).getDate(), n = selD + dd; if (n >= 1 && n <= days) { selD = n; draw(); } else month(dd > 0 ? 1 : -1); ev.preventDefault(); } else if (ev.key === 'PageUp') month(-1); else if (ev.key === 'PageDown') month(1); });
    w.el.tabIndex = -1;
    draw();
    return w;
  }
  // appointment alarms ring while JackOS is open
  let lastAl = '';
  setInterval(() => { const t = today(), k = pad2(t.m) + '-' + pad2(t.d), now = new Date(), hm = pad2(now.getHours()) + ':' + pad2(now.getMinutes()); if (hm === lastAl) return; lastAl = hm; (store.get(CALKEY, {})[k] || []).forEach(e => { if (e.al && e.t === hm) { sfx('beep'); toast('Calendar alarm', `${e.t} ${e.x}`, 9000); } }); }, 20000);

  K.apps.cardfile = arg => openCardfile(arg);
  K.apps.abook = () => openAbook();
  K.apps.calendar = () => openCalendar();
})();
