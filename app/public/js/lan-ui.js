/* lan-ui: the windows for THE LAN (loaded the first time you need one; lan.js is the always-on core).
 * Network Neighborhood, Sharing..., WinPopup, the floppy drive + disk box, SQUIG99.EXE's fireworks, JackClean, Map Network Drive. */
(function () {
  'use strict';
  const A = window.Apps, L = window.LAN;
  if (!A || !L || L.ui) return;
  const { esc, J, got, d99, touch } = L;
  const h = (tag, cls, html) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const ico = (n, s) => J(n, s || 16);
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const once = (types, fn, ms) => { const offs = types.map(t => L.on(t, m => { if (fn(t, m) !== false) done(); })); const tm = setTimeout(() => { done(); fn('timeout', null); }, ms || 8000); function done() { clearTimeout(tm); offs.forEach(o => o()); } return done; };
  const me = () => Net.me || {};
  const others = () => L.online.filter(o => o.id !== me().id);
  const hhmm = ts => { const d = ts ? new Date(ts) : new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const grind = (ms, then) => { // the floppy drive goes grrrk-grrrk-grrrk
    let i = 0; const n = Math.max(2, Math.round(ms / 140));
    const t = setInterval(() => { try { if (Sound.on) Sound.note(i % 2 ? 95 : 70, 0.09, 'square'); } catch (e) {} if (++i >= n) { clearInterval(t); if (then) then(); } }, 140);
  };
  const POPUP = J('popup'), NET = J('network'), PC = J('computer'), FLOP = J('floppy'), ENT = J('entirenet'), FOLDER = J('folder'), PRN = J('printer'), MAIL = J('mail');
  const SHARE_DIR = FOLDER.replace('</svg>', '<path d="M3 30c4-6 8-6 10-3" stroke="#2a5ad8" stroke-width="3" fill="none"/><path d="M1 30h6" stroke="#2a5ad8" stroke-width="3"/></svg>');
  const ADD = '<svg viewBox="0 0 32 32"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M21 2v6h6" fill="#ddd" stroke="#000"/><circle cx="16" cy="19" r="7" fill="#1a9a1a" stroke="#000"/><path d="M16 15v8M12 19h8" stroke="#fff" stroke-width="2.4"/></svg>';
  const GROUP = '<svg viewBox="0 0 32 32"><rect x="2" y="8" width="12" height="9" fill="#c0c0c0" stroke="#000"/><rect x="4" y="10" width="8" height="5" fill="#008080"/><rect x="18" y="8" width="12" height="9" fill="#c0c0c0" stroke="#000"/><rect x="20" y="10" width="8" height="5" fill="#008080"/><rect x="10" y="20" width="12" height="9" fill="#c0c0c0" stroke="#000"/><rect x="12" y="22" width="8" height="5" fill="#008080"/><path d="M8 17v2h16v-2M16 19v1" stroke="#000"/></svg>';
  const PCOFF = PC.replace(/#008080|#00a0a0|#0aa|#008b8b/gi, '#333');
  const UP = '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M1 4h5l1 1.5h8V14H1z" fill="#f2d16b" stroke="#7a5a00"/><path d="M8 12V7M5.5 9.5 8 7l2.5 2.5" stroke="#000" stroke-width="1.4" fill="none"/></svg>';
  const sm = svg => String(svg).replace('<svg', '<svg width="16" height="16"');

  // ================================================================ small dialogs
  function dialog(title, html, buttons, o) {
    o = o || {};
    const b = h('form', 'lan-dlg', html + `<div class="row" style="justify-content:flex-end;margin-top:10px;gap:6px">${buttons.map((x, i) => `<button class="btn" type="${i === 0 ? 'submit' : 'button'}" data-b="${i}" style="min-width:75px">${esc(x[0])}</button>`).join('')}</div>`);
    const w = A.win(title, b, { w: o.w || 380, icon: o.icon, noResize: true, noMax: true, noMin: true, escClose: true });
    const fire = i => { const fn = buttons[i] && buttons[i][1]; if (fn && fn(b, w) === false) return; w.close(); };
    b.addEventListener('submit', ev => { ev.preventDefault(); fire(0); });
    b.querySelectorAll('[data-b]').forEach(x => { if (+x.dataset.b) x.addEventListener('click', () => fire(+x.dataset.b)); });
    return { b, w };
  }
  // pick something from a list: items = [{ label, sub, icon, v }]
  function picker(title, prompt, items, okLabel, cb, o) {
    if (!items.length) return Desk.msgbox(title, (o && o.empty) || 'There is nothing to pick from.', 'info');
    let sel = 0;
    const d = dialog(title, `<div>${esc(prompt)}</div><div class="field lan-pick">${items.map((it, i) => `<button type="button" data-i="${i}" class="${i === 0 ? 'sel' : ''}">${sm(it.icon || PC)}<span>${esc(it.label)}</span>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</button>`).join('')}</div>${(o && o.extra) || ''}`,
      [[okLabel || 'OK', b => cb(items[sel], b)], ['Cancel']], { w: 360, icon: o && o.icon });
    d.b.querySelectorAll('.lan-pick button').forEach(x => {
      x.addEventListener('click', () => { sel = +x.dataset.i; d.b.querySelectorAll('.lan-pick button').forEach(y => y.classList.toggle('sel', y === x)); });
      x.addEventListener('dblclick', () => { sel = +x.dataset.i; d.b.requestSubmit ? d.b.requestSubmit() : d.b.dispatchEvent(new Event('submit', { cancelable: true })); });
    });
    return d;
  }
  function myDocs() {
    const out = [];
    (function walk(n, path, depth) {
      for (const k of (n.kids || [])) {
        if (out.length > 120) return;
        if (k.hidden || k.locked) continue;
        if (k.type === 'dir') { if (depth < 3 && k.name !== 'From JackNet') walk(k, path + '\\' + k.name, depth + 1); continue; }
        if (k.type === 'txt' || k.type === 'png' || (k.type === 'img' && k.art) || k.type === 'doc') out.push({ node: k, path: path + '\\' + k.name });
      }
    })(A.fs.get('C:/My Documents') || { kids: [] }, 'C:\\My Documents', 0);
    return out;
  }
  function pickDoc(title, cb) {
    const list = myDocs();
    picker(title, 'Pick a file from My Documents:', list.map(x => ({ label: x.node.name, sub: x.path.replace(/^C:\\My Documents\\?/, '').replace(/\\[^\\]*$/, '') || 'My Documents', icon: x.node.type === 'txt' || x.node.type === 'doc' ? J('txt') : J('bmp'), v: x.node })), 'OK', it => cb(it.v), { empty: 'There\'s nothing in My Documents that can go over the network.' });
  }
  const openFile = (f, from) => { const n = L.toNode(f); if (n.type === 'png') return A.open('mspaint', n); A.openFile(n); };

  // ================================================================ 1. NETWORK NEIGHBORHOOD
  const lists = new Map(); // pc id -> { list, at }
  L.on('lanList', m => { lists.set(m.id, { list: m.list || [], gone: m.gone, at: Date.now(), pc: m.pc }); refresh(); });
  L.on('lanShareCh', m => { if (lists.has(m.id)) Net.send({ t: 'lanList', id: m.id }); });
  L.on('lanShares', m => { lists.set(me().id, { list: m.list || [], at: Date.now() }); refresh(); });
  L.on('online', () => refresh());
  const renders = new Set();
  function refresh() { renders.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }

  function getFile(o, meta, then) {
    if (o.id === me().id) { const f = L.shares.find(x => x.n === meta.n); return f ? then(f) : Desk.msgbox('Network', 'That file is not shared any more.', 'warn'); }
    const t0 = Date.now();
    const b = h('div', '', `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center">${NET.replace('<svg', '<svg width="32" height="32"')}<div>Opening <b>\\\\${esc(L.pcName(o))}\\Shared Documents\\${esc(meta.n)}</b><br><span class="small">Receiving ${esc(L.fmtSize(meta.sz))} at 49,333 bps...</span></div></div><div class="prog" style="margin-top:8px"><span style="display:flex;gap:2px"></span></div>`);
    const w = A.win('Copying...', b, { w: 360, noResize: true, noMax: true, noMin: true, icon: NET });
    const bar = b.querySelector('.prog span'); const tick = setInterval(() => { if (bar.children.length < 24) bar.appendChild(document.createElement('i')); }, 60);
    Net.send({ t: 'lanGet', id: o.id, n: meta.n });
    once(['lanFile', 'lanErr'], (t, m) => {
      if (t === 'lanFile' && (m.id !== o.id || m.f.n.toLowerCase() !== meta.n.toLowerCase())) return false;
      if (t === 'lanErr' && m.op !== 'get') return false;
      const fin = () => { clearInterval(tick); w.close(); if (t === 'lanFile') then(m.f, m); else Desk.msgbox('Network', t === 'timeout' ? `\\\\${L.pcName(o)} is not responding. (The cable fell out, probably.)` : m.err, 'warn'); };
      setTimeout(fin, Math.max(0, 900 - (Date.now() - t0)));
    });
  }
  function copyToDocs(f, from) {
    const name = L.keep(f, from);
    got('copy'); sfx('click');
    Desk.toast('Copied!', `${name} was copied to My Documents\\From JackNet.`, 4000);
  }
  function fileNode(o, meta, mine) {
    return { key: 'f:' + meta.n, name: meta.n, icon: L.iconOf(meta), note: L.fmtSize(meta.sz), meta,
      act: () => getFile(o, meta, f => { if (!mine) got('nethood'); openFile(f, o.nick); }),
      menu: () => [{ label: 'Open', act: () => getFile(o, meta, f => openFile(f, o.nick)) },
        ...(mine ? [{ label: 'Stop Sharing', act: () => unshare(meta.n) }] : [{ label: 'Copy to My Documents', act: () => getFile(o, meta, f => copyToDocs(f, o.nick)) }, { label: 'Send To 3½ Floppy (A:)', act: () => getFile(o, meta, f => sendWire(f)) }])],
      props: () => Desk.msgbox(meta.n + ' Properties', `${meta.n}\n\nType: ${meta.ty === 'txt' ? 'Text Document' : 'Picture (64 x 48, 16 colours, squashed for the modem)'}\nLocation: \\\\${L.pcName(o)}\\Shared Documents\nSize: ${L.fmtSize(meta.sz)}\nModified: ${meta.d}\nShared by: ${o.nick}\nAccess: Read-Only`, 'info') };
  }
  function pcNode(o) {
    const mine = o.id === me().id;
    const shared = { key: 'sd:' + o.id, name: 'Shared Documents', icon: SHARE_DIR, crumb: `\\\\${L.pcName(o)}\\Shared Documents`,
      onEnter: () => Net.send({ t: 'lanList', id: o.id }),
      empty: mine ? 'You aren\'t sharing anything yet. Use "Share a file..." (or right-click a file in My Computer > Sharing...).' : `${o.nick} isn't sharing any files right now. (Ask them nicely with WinPopup!)`,
      kids: () => {
        const c = lists.get(o.id);
        if (!c) return null; // still loading
        const k = (c.list || []).map(x => fileNode(o, x, mine));
        if (mine) k.unshift({ key: 'add', name: 'Share a file...', icon: ADD, act: () => pickDoc('Share a file', shareNode) });
        return k;
      } };
    return { key: 'pc:' + o.id, id: o.id, o, name: '\\\\' + L.pcName(o), crumb: '\\\\' + L.pcName(o), icon: PC, note: mine ? 'This computer (you!)' : (o.member ? 'JackNet member ' : 'Guest ') + o.nick,
      kids: () => [shared, { key: 'prn:' + o.id, name: 'Printer', icon: PRN, act: () => Desk.msgbox(`Printer on \\\\${L.pcName(o)}`, `Sending a test page to ${mine ? 'your' : o.nick + '\'s'} printer...\n\nError: Out of cyan. Every printer on JackNet is out of cyan. It's a conspiracy.`, 'warn') }],
      onEnter: () => { if (!mine) got('nethood'); },
      menu: () => [{ label: 'Send Message...', act: () => sendPopup(o) }, ...(mine ? [] : [{ label: 'Give Floppy Disk...', act: () => giveTo(o) }, '-', { label: L.blocks.includes(o.nick) ? 'Blocked' : 'Block Messages...', dis: L.blocks.includes(o.nick), act: () => blockAsk(o) }])],
      props: () => Desk.msgbox(`\\\\${L.pcName(o)} Properties`, `Computer name: ${L.pcName(o)}\nWorkgroup: JACKNET\nUser: ${o.nick}${mine ? ' (you)' : ''}\nJackNet member: ${o.member ? 'Yes' : 'No (guest)'}\nShared folders: Shared Documents, Printer\nConnection: 56K (allegedly)`, 'info') };
  }
  const DAVE_PC = { key: 'dave', name: '\\\\DAVE-PC', icon: PCOFF, note: 'Not responding', dim: true, act: () => { A.secret('fun.davepc'); Desk.msgbox('\\\\DAVE-PC', "\\\\DAVE-PC is not accessible.\n\nThe network path was not found. (Dave's Mom switched it off at the wall again. Something about 'the phone bill'.)", 'warn'); } };
  const GROT_PC = { key: 'grot', name: '\\\\GUBBINZ', icon: PC, note: 'Comment: KEEP OUT', act: () => { A.secret('fun.grotpc'); Desk.msgbox('\\\\GUBBINZ', "\\\\GUBBINZ\\RUPEE STASH is not accessible.\n\nHEY! THAT'S MY COMPUTER! GET OUT!\n\n(It's Gubbinz's computer. Nobody sits at it. Not a real person.)", 'warn'); } };
  let nh = null;
  function nethood(arg) {
    if (nh && !nh.w.closed) { nh.w.restore(); return nh.w; }
    const pcs = () => L.online.slice().sort((a, b) => (b.id === me().id) - (a.id === me().id) || L.pcName(a).localeCompare(L.pcName(b))).map(pcNode);
    const jacknet = { key: 'wg', name: 'Jacknet', crumb: 'JACKNET', icon: GROUP, note: 'Workgroup', kids: pcs, empty: 'Nobody is on JackNet right now. (Not even you?)' };
    const entire = { key: 'ent', name: 'Entire Network', icon: ENT, onEnter: () => got('entire'),
      kids: () => [jacknet, { key: 'dn', name: 'Davesnet', crumb: 'DAVESNET', icon: GROUP, note: 'Workgroup', kids: () => [DAVE_PC] }, { key: 'gn', name: 'Gubbinznet', crumb: 'GUBBINZNET', icon: GROUP, note: 'Workgroup (Gubbinz\'s computer, not a visitor)', kids: () => [GROT_PC] }] };
    const top = { key: 'top', name: 'Network Neighborhood', icon: NET, kids: () => [entire, ...pcs()] };
    const api = folder('Network Neighborhood', NET, top, {
      w: 560, h: 400,
      buttons: [
        { label: 'Send Message', icon: POPUP, act: sel => sel && sel.o ? sendPopup(sel.o) : sendPopup() },
        { label: 'Share a file...', icon: J('documents'), act: () => pickDoc('Share a file', shareNode) },
        { label: 'Map Drive', icon: J('hdd'), act: () => mapDrive() },
      ],
      menus: (sel, api) => [
        ['File', [{ label: 'Open', dis: !sel, act: () => api.open(sel) }, { label: 'Send Message...', act: () => sendPopup(sel && sel.o) }, { label: 'Give Floppy Disk...', dis: !(sel && sel.o && sel.o.id !== me().id), act: () => giveTo(sel.o) }, '-', { label: 'Properties', act: () => api.props(sel) }, '-', { label: 'Close', act: () => api.w.close() }]],
        ['View', [{ label: 'Large Icons', rad: !api.list, act: () => api.setList(false) }, { label: 'List', rad: api.list, act: () => api.setList(true) }, '-', { label: 'Refresh', key: 'F5', act: () => { lists.clear(); api.reenter(); } }]],
        ['Tools', [{ label: 'Map Network Drive...', act: mapDrive }, { label: 'Disconnect Network Drive...', act: () => Desk.msgbox('Disconnect Network Drive', 'You have no network drives to disconnect. (Drive E: never existed. See Map Network Drive.)', 'info') }, '-', { label: 'Find Computer...', act: () => findComputer(api) }, { label: 'My Shared Files...', act: () => api.go([top, ...(pcs().filter(p => p.id === me().id).slice(0, 1))]) }, { label: 'Blocked People...', act: blockedDlg }, '-', { label: 'WinPopup', act: () => A.open('lan.winpopup') }, { label: '3½ Floppy (A:)', act: () => A.open('lan.floppy') }]],
        ['Help', [{ label: 'About Network Neighborhood', act: () => Desk.msgbox('About Network Neighborhood', 'Network Neighborhood\nJackOS 98\n\nEvery computer on JACKNET is a real person on the site right now.\nGuests are \\\\GUEST1234. Members are \\\\NAME-PC.\n\nShare files, send WinPopups and hand people floppy disks. Be nice!', 'info') }, { label: 'NETWORK.TXT', act: () => A.openFile(A.fs.get('C:/JACKOS/NETWORK.TXT')) }]],
      ],
      status: (c, kids) => c === jacknet || c === top ? `${L.online.length} computer(s) on JACKNET · live` : kids ? `${kids.length} object(s)` : 'Opening...',
    });
    if (arg === 'mine') { const p = pcs().find(x => x.id === me().id); if (p) api.go([top, p]); }
    nh = api;
    return api.w;
  }
  function findComputer(api) {
    Desk.ask('Find: Computer', 'Named:', '', 20, v => {
      v = String(v || '').trim().toLowerCase().replace(/^\\+/, ''); if (!v) return;
      const hit = L.online.find(o => L.pcName(o).toLowerCase().includes(v) || String(o.nick).toLowerCase().includes(v));
      if (hit) { Desk.msgbox('Find: Computer', `Found \\\\${L.pcName(hit)}! Opening it...`, 'info'); api.goPc(hit); }
      else if (/dave/.test(v)) DAVE_PC.act();
      else if (/gub|grot/.test(v)) GROT_PC.act();
      else Desk.msgbox('Find: Computer', `The computer '${v.toUpperCase()}' was not found. Maybe their Mom needed the phone.`, 'warn');
    });
  }
  // a little Explorer-style window over a tree of nodes { key, name, icon, kids() (null = loading), act, menu, props, note, onEnter, empty }
  function folder(title, icon, top, o) {
    const b = h('div', 'ff-exp lan-pc');
    b.innerHTML = `<div class="ff-tool"><button class="btn ff-up" type="button">${UP}<span>Up</span></button>${o.buttons.map((x, i) => `<button class="btn lan-xb" data-i="${i}" type="button">${sm(x.icon)}<span>${esc(x.label)}</span></button>`).join('')}</div>
      <div class="ff-addr"><span>Address</span><div class="field ff-crumb"></div></div><div class="field ff-grid" tabindex="-1"></div>`;
    const w = A.win(title, b, { w: o.w, h: o.h, icon, menubar: true, status: true, minW: 260, minH: 220, onClose: () => renders.delete(render) });
    let stack = [top], sel = null;
    const cur = () => stack[stack.length - 1];
    const grid = b.querySelector('.ff-grid');
    function enter(n) { stack.push(n); sel = null; if (n.onEnter) n.onEnter(); render(); }
    function openNode(n) { if (!n) return; if (n.act) return n.act(n); if (n.kids) enter(n); }
    function props(n) { n = n || cur(); if (n.props) return n.props(); const k = n.kids && n.kids(); Desk.msgbox(n.name + ' Properties', `${n.name}\n\n${n.note || 'Folder'}${k ? `\nContains: ${k.length} object(s)` : ''}`, 'info'); }
    function render() {
      if (w.closed) return;
      const c = cur(); let kids = c.kids ? c.kids() : [];
      // a computer that logged off disappears from under you
      // (a computer whose connection blipped gets 30 seconds to come back before it vanishes)
      const missing = stack.findIndex(n => n.id != null && !L.online.some(x => x.id === n.id));
      if (missing > 0) { const n = stack[missing]; n.missAt = n.missAt || Date.now(); if (Date.now() - n.missAt < 30000) { if (!n.missT) n.missT = setTimeout(() => { n.missT = 0; render(); }, 30500); } } else stack.forEach(n => { n.missAt = 0; });
      const gone = missing > 0 && Date.now() - stack[missing].missAt >= 30000 ? missing : -1;
      if (gone > 0) { stack.length = gone; sel = null; Desk.toast('Network Neighborhood', 'That computer has logged off. (Probably called down for tea.)', 3000); return render(); }
      b.querySelector('.ff-crumb').innerHTML = sm(c.icon || FOLDER) + stack.map((n, i) => `<a href="#" data-k="${i}">${esc(n.crumb || n.name)}</a>`).join(' <b>&rsaquo;</b> ');
      b.querySelectorAll('.ff-crumb a').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); stack.length = +a.dataset.k + 1; sel = null; render(); }));
      b.querySelector('.ff-up').disabled = stack.length < 2;
      grid.innerHTML = '';
      if (kids === null) { grid.innerHTML = `<div class="ff-empty"><span class="lan-grind"><b></b>Opening ${esc(c.crumb || c.name)}... (56K, please wait)</span></div>`; status(null); return; }
      if (sel) sel = kids.find(k => k.key === sel.key) || null;
      if (!kids.length) grid.innerHTML = `<div class="ff-empty">${esc(c.empty || 'This folder is empty.')}</div>`;
      kids.forEach(n => {
        const btn = h('button', 'ff-ic' + (sel && n.key === sel.key ? ' sel' : '') + (n.dim ? ' dim' : ''), (n.icon || FOLDER) + `<span>${esc(n.name)}</span>`);
        btn.type = 'button'; btn.title = n.note || n.name;
        let last = 0;
        btn.addEventListener('click', () => {
          const was = sel && sel.key === n.key;
          grid.querySelectorAll('.ff-ic.sel').forEach(x => x.classList.remove('sel')); btn.classList.add('sel'); sel = n; status(kids);
          const now = Date.now();
          if ((touch() && was) || now - last < 450) { last = 0; openNode(n); } else last = now;
        });
        btn.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); openNode(n); } });
        btn.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); btn.click(); IE.menu([{ label: 'Open', act: () => openNode(n) }, ...(n.menu ? n.menu() : []), '-', { label: 'Properties', act: () => props(n) }], ev.clientX, ev.clientY); });
        btn.dataset.key = n.key;
        grid.appendChild(btn);
      });
      status(kids);
      w.setTitle(stack.length === 1 ? title : (c.crumb || c.name));
    }
    function status(kids) { if (!w.status) return; w.status.textContent = sel ? `${sel.name}${sel.note ? ' - ' + sel.note : ''}${touch() ? ' (click again to open)' : ''}` : o.status(cur(), kids); }
    b.querySelector('.ff-up').addEventListener('click', () => { if (stack.length > 1) { stack.pop(); sel = null; render(); } });
    b.querySelectorAll('.lan-xb').forEach(x => x.addEventListener('click', () => o.buttons[+x.dataset.i].act(sel, api)));
    grid.addEventListener('contextmenu', ev => { if (ev.target.closest('.ff-ic')) return; ev.preventDefault(); IE.menu([{ label: 'Refresh', act: () => api.reenter() }, ...(/^sd:/.test(cur().key) && cur().key === 'sd:' + me().id ? [{ label: 'Share a file...', act: () => pickDoc('Share a file', shareNode) }] : []), '-', { label: 'Properties', act: () => props(cur()) }], ev.clientX, ev.clientY); });
    const api = {
      w, open: openNode, props, get list() { return b.classList.contains('list'); }, setList(v) { b.classList.toggle('list', v); },
      reenter() { const c = cur(); if (c.onEnter) c.onEnter(); render(); },
      go(path) { stack = path.slice(); sel = null; const c = cur(); if (c.onEnter) c.onEnter(); render(); },
      goPc(o2) { const p = top.kids().find(k => k.id === o2.id); if (p) api.go([top, p]); },
    };
    A.menubar(w, o.menus(null, api).map(([lbl]) => [lbl, () => (o.menus(sel, api).find(x => x[0] === lbl) || [lbl, []])[1]]));
    renders.add(render);
    render();
    return api;
  }

  // ---- sharing your own files
  function shareNode(node) {
    if (!node) return;
    const already = L.shares.some(x => x.n.toLowerCase() === String(node.name).toLowerCase());
    const d = dialog(`${node.name} Properties`, `<div class="tabs"><span>General</span><span class="on">Sharing</span></div><div class="tabpage" style="padding:8px">
      <div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center;margin-bottom:8px">${(node.type === 'txt' || node.type === 'doc' ? J('txt') : J('bmp')).replace('<svg', '<svg width="32" height="32"')}<b>${esc(node.name)}</b></div>
      <label class="row"><input type="radio" name="sh" value="0" ${already ? '' : ''}> <u>N</u>ot Shared</label>
      <label class="row"><input type="radio" name="sh" value="1" checked> <u>S</u>hared As:</label>
      <div class="group" style="margin:4px 0 0 18px"><div class="row"><label style="width:84px">Share <u>N</u>ame:</label><input type="text" readonly value="${esc(String(node.name).toUpperCase().slice(0, 40))}" style="flex:1;min-width:0"></div>
      <div class="row"><label style="width:84px">Access Type:</label><span>Read-Only (people can look and copy, not change)</span></div>
      <div class="small" style="margin-top:4px;color:#555">Everyone on JACKNET can see it in <b>\\\\${esc(L.myPc || L.pcName(me()))}\\Shared Documents</b> while you're online. ${node.type === 'png' || node.type === 'img' ? 'Pictures get squashed to 64 x 48 and 16 colours to fit down the modem.' : 'Text files travel up to 3,000 characters.'}</div></div></div>`,
      [['OK', b => { const v = b.querySelector('input[name=sh]:checked').value; if (v === '0') { if (already) unshare(node.name); return; } doShare(node); }], ['Cancel']], { w: 380, icon: NET });
    return d;
  }
  async function doShare(node) {
    let f; try { f = await L.toWire(node); } catch (e) { f = null; }
    if (!f) return Desk.msgbox('Sharing', `${node.name} can't be shared.\n\nOnly text files and pictures fit down the JackNet cable. (Programs and sounds are too big for a 56K modem. Ask Dad about ISDN.)`, 'warn');
    if (!Net.send({ t: 'lanShare', f })) return Desk.msgbox('Sharing', 'You aren\'t connected to JackNet. (Is somebody on the phone?)', 'warn');
    once(['lanShares', 'lanErr'], (t, m) => {
      if (t === 'lanErr' && m.op !== 'share') return false;
      if (t === 'lanShares') { L.shares = L.shares.filter(x => x.n.toLowerCase() !== f.n.toLowerCase()); L.shares.push(f); L.saveShares(); got('share'); Desk.toast('Sharing', `${f.n} is now shared in \\\\${L.myPc || L.pcName(me())}\\Shared Documents. (A little hand appears under it.)`, 4000); sfx('click'); }
      else Desk.msgbox('Sharing', t === 'timeout' ? 'JackNet didn\'t answer. Try again.' : m.err, 'warn');
    });
  }
  function unshare(name) {
    L.shares = L.shares.filter(x => x.n !== name); L.saveShares();
    Net.send({ t: 'lanUnshare', n: name });
    Desk.toast('Sharing', `${name} is not shared any more.`, 3000);
  }

  // ---- Map Network Drive (it doesn't)
  function mapDrive() {
    const pcs = others(), path = pcs.length ? `\\\\${L.pcName(pcs[0])}\\SHARED DOCUMENTS` : '\\\\DAVE-PC\\GAMES';
    dialog('Map Network Drive', `<div class="row"><label style="width:50px"><u>D</u>rive:</label><select style="flex:1">${['E:', 'F:', 'G:', 'H:', 'Z:'].map(x => `<option>${x}</option>`).join('')}</select></div>
      <div class="row"><label style="width:50px"><u>P</u>ath:</label><input type="text" value="${esc(path)}" style="flex:1;min-width:0"></div>
      <label class="row" style="margin-left:56px"><input type="checkbox" checked> <u>R</u>econnect at logon</label>`,
      [['OK', b => {
        const drv = b.querySelector('select').value, p = b.querySelector('input[type=text]').value || path;
        got('mapdrive');
        const pw = h('div', '', `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center">${NET.replace('<svg', '<svg width="32" height="32"')}<div>Connecting ${esc(drv)} to ${esc(p)}...</div></div><div class="prog" style="margin-top:8px"><span style="display:flex;gap:2px"></span></div>`);
        const w2 = A.win('Map Network Drive', pw, { w: 340, noResize: true, noMax: true, noMin: true, icon: NET });
        const bar = pw.querySelector('.prog span'); let i = 0;
        const t = setInterval(() => { bar.appendChild(document.createElement('i')); if (++i >= 22) { clearInterval(t); w2.close(); Desk.msgbox('Map Network Drive', `${drv} has been mapped to ${p}.\n\n...is what it would say if we had a drive ${drv}. We don't. Mapping a network drive needs a second hard drive letter, a proper network card and Dad's screwdriver, which is "somewhere in the shed".\n\nUse Network Neighborhood instead. It does the same thing, but with pictures.`, 'info'); } }, 70);
      }], ['Cancel']], { w: 360, icon: J('hdd') });
  }

  // ================================================================ 2. WINPOPUP (between real visitors only)
  let wp = null; // the WinPopup window
  const popKey = 'jhp_lan_pops';
  L.pops = A.store.get(popKey, []).slice(-20);
  const opts = Object.assign({ pop: true, sound: true, top: false }, A.store.get('jhp_lan_wpopts', {}));
  const saveOpts = () => A.store.set('jhp_lan_wpopts', opts);
  const savePops = () => A.store.set(popKey, L.pops.slice(-20));
  function winpopup(arg) {
    if (wp && !wp.w.closed) { wp.w.restore(); return wp.w; }
    const b = h('div', 'lan-wp');
    b.innerHTML = `<div class="ff-tool"><button class="btn" data-a="send" type="button">${sm(POPUP)}<span>Send</span></button><button class="btn" data-a="del" type="button"><span>Discard</span></button><button class="btn" data-a="prev" type="button" aria-label="Previous">&#9664;</button><button class="btn" data-a="next" type="button" aria-label="Next">&#9654;</button><button class="btn" data-a="reply" type="button"><span>Reply</span></button></div>
      <div class="hd"></div><div class="field ff-poptext" aria-live="polite"></div><label class="row small lan-ign"><input type="checkbox"> <span>Block messages from this person</span></label>`;
    const w = A.win('WinPopup', b, { w: 360, h: 300, icon: POPUP, menubar: true, status: true, minW: 260, minH: 230, onClose: () => { wp = null; } });
    let i = L.pops.length - 1;
    const draw = () => {
      if (i >= L.pops.length) i = L.pops.length - 1;
      const m = L.pops[i];
      b.querySelector('.hd').innerHTML = m ? `Message from <b>${esc(m.from)}</b> (\\\\${esc(m.pc || '')}) to <b>${esc(Net.me.nick || 'you')}</b> on ${esc(m.date || d99())} ${esc(hhmm(m.ts))}` : 'No messages.';
      b.querySelector('.ff-poptext').textContent = m ? m.text : 'No messages. (Use Send to pop a message up on somebody else\'s screen. Only real people who are online right now!)';
      const ign = b.querySelector('.lan-ign'), cb = ign.querySelector('input');
      ign.style.display = !m || m.self ? 'none' : ''; if (m) { cb.checked = L.blocks.includes(m.from); cb.disabled = cb.checked; }
      b.querySelector('[data-a=prev]').disabled = i <= 0; b.querySelector('[data-a=next]').disabled = i >= L.pops.length - 1;
      b.querySelector('[data-a=del]').disabled = !m; b.querySelector('[data-a=reply]').disabled = !m || m.self;
      if (w.status) w.status.textContent = `Current message: ${m ? i + 1 : 0}    Total number of messages: ${L.pops.length}`;
    };
    const act = a => {
      const m = L.pops[i];
      if (a === 'send') sendPopup();
      else if (a === 'del' && m) { L.pops.splice(i, 1); savePops(); draw(); }
      else if (a === 'prev') { i = Math.max(0, i - 1); draw(); }
      else if (a === 'next') { i = Math.min(L.pops.length - 1, i + 1); draw(); }
      else if (a === 'reply' && m) { const o = L.online.find(x => x.id === m.fromId) || L.online.find(x => x.nick === m.from); if (!o) return Desk.msgbox('WinPopup', `${m.from} has logged off. (Probably called down for tea.)`, 'warn'); sendPopup(o); }
    };
    b.querySelector('.ff-tool').addEventListener('click', ev => { const x = ev.target.closest('[data-a]'); if (x && !x.disabled) act(x.dataset.a); });
    b.querySelector('.lan-ign input').addEventListener('change', ev => { const m = L.pops[i]; if (!m || !ev.target.checked) return; const o = L.online.find(x => x.id === m.fromId); if (!o) { ev.target.checked = false; return Desk.msgbox('WinPopup', `${m.from} has already logged off, so there's no need. (If they come back and pester you, block them then.)`, 'info'); } blockAsk(o, draw, () => { ev.target.checked = false; }); });
    A.menubar(w, [
      ['Messages', () => [{ label: 'Send...', act: () => act('send') }, { label: 'Discard', dis: !L.pops[i], act: () => act('del') }, '-', { label: 'Previous', dis: i <= 0, act: () => act('prev') }, { label: 'Next', dis: i >= L.pops.length - 1, act: () => act('next') }, '-', { label: 'Clear All', act: () => { L.pops = []; savePops(); draw(); } }, '-', { label: 'Exit', act: w.close }]],
      ['Options', () => [{ label: 'Play Sound When New Message Arrives', chk: opts.sound, act: () => { opts.sound = !opts.sound; saveOpts(); } }, { label: 'Pop Up Dialog on Message Receipt', chk: opts.pop, act: () => { opts.pop = !opts.pop; saveOpts(); } }, '-', { label: 'Blocked People...', act: blockedDlg }]],
      ['Help', [{ label: 'About WinPopup', act: () => Desk.msgbox('About WinPopup', 'WinPopup\nJackOS 98\n\nSends a little message straight onto somebody else\'s screen. Every computer in the list is a real person on JackNet right now.\n\nBe nice. If someone isn\'t, tick "Block messages from this person".', 'info') }]],
    ]);
    wp = { w, show(k) { i = k == null ? L.pops.length - 1 : k; draw(); } };
    draw();
    if (arg && arg.to) sendPopup(arg.to);
    return w;
  }
  function popIn(m) {
    if (!m || !m.text) return;
    L.pops.push({ from: String(m.from || 'Somebody').slice(0, 20), fromId: m.fromId, pc: String(m.pc || '').slice(0, 20), text: String(m.text).slice(0, 200), ts: m.ts || Date.now(), date: d99(), self: !!m.self });
    if (L.pops.length > 20) L.pops.shift();
    savePops();
    if (opts.sound) sfx('beep');
    if (wp && !wp.w.closed) { wp.show(); wp.w.restore(); }
    else if (opts.pop) { A.open('lan.winpopup'); }
    else Desk.toast('WinPopup', `New message from ${m.from}. (Open WinPopup to read it.)`, 4000);
  }
  function sendPopup(to) {
    const list = L.online.slice().sort((a, b) => (a.id === me().id) - (b.id === me().id) || L.pcName(a).localeCompare(L.pcName(b)));
    const f = h('form', 'ff-pop');
    f.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${POPUP.replace('<svg', '<svg width="32" height="32" style="flex:none"')}<div style="flex:1;min-width:0"><div class="row" style="flex-wrap:nowrap"><label>To:</label><select style="flex:1;min-width:0">${list.map(o => `<option value="${o.id}"${to && o.id === to.id ? ' selected' : ''}>\\\\${esc(L.pcName(o))}${o.id === me().id ? ' (you)' : ' - ' + esc(o.nick)}</option>`).join('')}</select></div><div class="small" style="color:#555">This message will pop up on their screen right now. Real people only!</div></div></div>
      <textarea maxlength="200" rows="4" aria-label="Message" placeholder="Type your message..."></textarea><div class="ff-left small">200 characters left</div>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="submit" style="min-width:72px">Send</button><button class="btn" type="button" style="min-width:72px">Cancel</button></div>`;
    if (!list.length) return Desk.msgbox('WinPopup', 'You aren\'t connected to JackNet. (Is somebody on the phone?)', 'warn');
    if (!to && list.length === 1) to = list[0];
    if (!to && others().length) f.querySelector('select').value = String(others()[0].id);
    const w = A.win('Send Message', f, { w: 380, icon: POPUP, noResize: true, noMax: true, escClose: true });
    const ta = f.querySelector('textarea'); setTimeout(() => ta.focus(), 30);
    ta.addEventListener('input', () => { f.querySelector('.ff-left').textContent = (200 - ta.value.length) + ' characters left'; });
    f.querySelector('button[type=button]').addEventListener('click', w.close);
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const text = ta.value.trim().slice(0, 200); if (!text) return;
      const id = +f.querySelector('select').value, o = L.online.find(x => x.id === id);
      if (!o) return Desk.msgbox('WinPopup', 'That computer has logged off. (Probably called down for tea.)', 'warn');
      if (o.id === me().id) { w.close(); A.secret('fun.selfmsg'); setTimeout(() => popIn({ from: Net.me.nick, fromId: Net.me.id, pc: L.myPc || L.pcName(me()), text, self: true }), 600); return; }
      if (window.Guest && Guest.is()) return Guest.need('Sending WinPopup messages', () => f.requestSubmit ? f.requestSubmit() : null);
      if (!Net.send({ t: 'lanPop', to: o.id, text })) return Desk.msgbox('WinPopup', 'The message could not be sent. JackNet is not connected. (Is someone on the phone?)', 'warn');
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      once(['lanPopOk'], (t, m) => {
        btn.disabled = false;
        if (t === 'timeout') return Desk.msgbox('WinPopup', 'JackNet didn\'t answer. The message may not have arrived.', 'warn');
        if (!m.ok) return Desk.msgbox('WinPopup', m.err || 'The message could not be delivered.', 'warn');
        w.close(); got('popup'); A.secret('fun.netsend'); sfx('click');
        Desk.toast('WinPopup', `The message was successfully sent to \\\\${m.to}.`, 3000);
      });
    });
    return w;
  }
  function blockAsk(o, then, no) {
    Desk.msgbox('Block Messages', `Stop ${o.nick} (\\\\${L.pcName(o)}) from sending you WinPopups and floppy disks?\n\nThey won't be told. You can unblock them later (WinPopup > Options > Blocked People).`, 'q',
      [['Block', () => { Net.send({ t: 'lanBlock', id: o.id }); once(['lanBlocks'], () => { got('block'); Desk.toast('WinPopup', `${o.nick} is blocked.`, 3000); if (then) then(); }); }], ['Cancel', () => { if (no) no(); }]]);
  }
  function blockedDlg() {
    Net.send({ t: 'lanBlocks' });
    once(['lanBlocks'], (t) => {
      if (t === 'timeout') return;
      if (!L.blocks.length) return Desk.msgbox('Blocked People', 'You haven\'t blocked anybody. Everyone is being nice. (Hooray!)', 'info');
      picker('Blocked People', 'These people can\'t send you WinPopups or floppy disks:', L.blocks.map((n, i) => ({ label: n, v: i, icon: J('user') })), 'Unblock', it => { Net.send({ t: 'lanUnblock', i: it.v }); Desk.toast('WinPopup', `${it.label} is unblocked.`, 3000); }, { icon: POPUP });
    });
  }

  // ================================================================ 3. THE FLOPPY DRIVE (your disk box lives on the server, so disks can change hands)
  let fw = null;
  const DISK_BYTES = 1457664;
  function floppy() {
    if (fw && !fw.w.closed) { fw.w.restore(); return fw.w; }
    const b = h('div', 'ff-exp lan-pc lan-fl');
    b.innerHTML = `<div class="ff-tool"><button class="btn" data-a="copy" type="button"><span>Copy to My Docs</span></button><button class="btn" data-a="del" type="button"><span>Delete</span></button><button class="btn" data-a="give" type="button">${sm(FLOP)}<span>Give disk to...</span></button><button class="btn" data-a="box" type="button"><span>Disk box</span></button><button class="btn" data-a="eject" type="button"><span>Eject</span></button></div>
      <div class="lan-label" tabindex="0" role="button" aria-label="Disk label (click to write on it)"></div>
      <div class="field ff-grid" tabindex="-1"></div><div class="lan-bar"><span class="u"></span><span class="field"></span><span class="f"></span></div>`;
    const w = A.win('3½ Floppy (A:)', b, { w: 520, h: 400, icon: FLOP, menubar: true, status: true, minW: 260, minH: 260, onClose: () => { fw = null; offs.forEach(x => x()); } });
    let sel = null, busy = false;
    const grid = b.querySelector('.ff-grid');
    function draw() {
      const d = L.disk, box = L.box || { disks: [] }, inDrive = box.cur && d && d.id === box.cur;
      const lab = b.querySelector('.lan-label');
      b.querySelectorAll('.ff-tool .btn').forEach(x => { x.disabled = !inDrive && x.dataset.a !== 'box'; });
      if (busy) return;
      if (!inDrive) {
        lab.innerHTML = '<small>Drive A: is empty</small>(no disk)';
        grid.innerHTML = `<div class="ff-empty">There's no disk in drive A:.<br><br><button class="btn" type="button" data-x="new">Get a blank disk from the box</button> <button class="btn" type="button" data-x="box">Disk box...</button><br><br><small>${box.disks.length ? `You have ${box.disks.length} disk(s) in your disk box.` : 'Your disk box is empty. (A pack of ten 3½" HD disks costs £4.99. Mom bought one.)'}<br>The old disk with "DAVE'S DISK" on it lives in My Computer > 3½ Floppy (A:) when none of yours is in the drive.</small></div>`;
        grid.querySelectorAll('[data-x]').forEach(x => x.addEventListener('click', () => x.dataset.x === 'new' ? newDisk() : diskBox()));
        b.querySelector('.lan-bar').hidden = true;
        if (w.status) w.status.textContent = 'No disk';
        return;
      }
      b.querySelector('.lan-bar').hidden = false;
      lab.innerHTML = `<small>Label (click to write on it):</small>${d.l ? esc(d.l) : '<i style="color:#888">(blank label)</i>'}`;
      if (sel && !d.f.some(x => x.n === sel)) sel = null;
      grid.innerHTML = d.f.length ? '' : '<div class="ff-empty">This disk is empty. Right-click a file in My Computer > Send To > 3½ Floppy (A:) to copy something onto it.</div>';
      d.f.forEach(f => {
        const btn = h('button', 'ff-ic' + (f.n === sel ? ' sel' : ''), L.iconOf(f, 0) + `<span>${esc(f.n)}</span>`); btn.type = 'button'; btn.title = `${f.n} (${L.fmtSize(f.sz)})`;
        let last = 0;
        btn.addEventListener('click', () => { const was = sel === f.n; sel = f.n; grid.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); btn.classList.add('sel'); stat(); const now = Date.now(); if ((touch() && was) || now - last < 450) { last = 0; openF(f); } else last = now; });
        btn.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); btn.click(); IE.menu([{ label: 'Open', act: () => openF(f) }, { label: 'Copy to My Documents', act: () => copyOff(f) }, '-', { label: 'Delete', act: () => delF(f) }, '-', { label: 'Properties', act: () => Desk.msgbox(f.n + ' Properties', `${f.n}\n\nLocation: A:\\\nSize: ${L.fmtSize(f.sz)} (${f.sz.toLocaleString('en-GB')} bytes)\nModified: ${f.d}`, 'info') }], ev.clientX, ev.clientY); });
        grid.appendChild(btn);
      });
      const usedB = d.f.reduce((t, f) => t + f.sz, 0), pct = Math.min(1, usedB / DISK_BYTES);
      b.querySelector('.lan-bar .u').textContent = 'Used: ' + L.fmtSize(usedB);
      b.querySelector('.lan-bar .f').textContent = 'Free: ' + L.fmtSize(Math.max(0, DISK_BYTES - usedB));
      b.querySelector('.lan-bar .field').innerHTML = '<i></i>'.repeat(Math.round(pct * 40));
      stat();
    }
    function stat() { const d = L.disk; if (!w.status || !d) return; const f = sel && d.f.find(x => x.n === sel); w.status.textContent = f ? `${f.n} - ${L.fmtSize(f.sz)}` : `${d.f.length} object(s)${d.h && d.h.length > 1 ? ` · this disk has been through ${d.h.length} pairs of hands (last: ${d.h[d.h.length - 2]})` : ''}`; }
    function read(then) { // the drive light comes on and it grinds
      busy = true; grid.innerHTML = '<div class="ff-empty"><span class="lan-grind"><b></b>Reading A:\\ ... grrrk grrrk grrrk</span></div>';
      if (w.status) w.status.textContent = 'Reading drive A:...';
      grind(1100, () => { busy = false; draw(); if (then) then(); });
    }
    const openF = f => openFile(f);
    const copyOff = f => { const name = L.keep(f, 'a floppy'); got('copy'); Desk.toast('Copied!', `${name} was copied from A:\\ to My Documents\\From JackNet.`, 4000); };
    const delF = f => Desk.msgbox('Confirm File Delete', `Are you sure you want to delete '${f.n}' from the floppy disk?\n\n(Floppy disks don't have a Recycle Bin. It's gone for good.)`, 'q', [['Yes', () => { Net.send({ t: 'lanFlDel', n: f.n }); grind(500); }], ['No']]);
    const act = a => {
      const d = L.disk, f = d && sel && d.f.find(x => x.n === sel);
      if (a === 'copy') f ? copyOff(f) : Desk.msgbox('Copy', 'Click on a file first.', 'info');
      else if (a === 'del') f ? delF(f) : Desk.msgbox('Delete', 'Click on a file first.', 'info');
      else if (a === 'give') giveDisk();
      else if (a === 'box') diskBox();
      else if (a === 'eject') { Net.send({ t: 'lanFlIns', id: null }); sfx('thud'); Desk.toast('Drive A:', 'Kachunk! The disk pops out. It goes back in your disk box.', 3000); }
      else if (a === 'label') labelIt();
      else if (a === 'format') formatIt();
    };
    b.querySelector('.ff-tool').addEventListener('click', ev => { const x = ev.target.closest('[data-a]'); if (x && !x.disabled) act(x.dataset.a); });
    const lab = b.querySelector('.lan-label');
    lab.addEventListener('click', () => act('label')); lab.addEventListener('keydown', ev => { if (ev.key === 'Enter') act('label'); });
    function labelIt() {
      if (!L.diskIn()) return;
      Desk.ask('Disk Label', 'Write on the label (felt tip, 30 letters, no take-backs):', (L.disk && L.disk.l) || '', 30, v => { if (v == null) return; Net.send({ t: 'lanFlLabel', l: String(v).slice(0, 30) }); got('label'); sfx('click'); });
    }
    function formatIt() {
      if (!L.diskIn()) return;
      Desk.msgbox('Format - 3½ Floppy (A:)', 'WARNING: Formatting will erase ALL data on this disk.\n\nCapacity: 1.44 MB (3½")\nFormat type: Full\n\nTo format the disk, click OK.', 'warn', [['OK', () => {
        const pb = h('div', '', `<div>Formatting 3½ Floppy (A:)...</div><div class="prog" style="margin-top:8px"><span style="display:flex;gap:2px"></span></div><div class="small" style="margin-top:6px">Track <span class="tk">0</span> of 79</div>`);
        const w2 = A.win('Format - 3½ Floppy (A:)', pb, { w: 320, noResize: true, noMax: true, noMin: true, icon: FLOP });
        let tk = 0; const bar = pb.querySelector('.prog span');
        const t = setInterval(() => { tk += 4; pb.querySelector('.tk').textContent = Math.min(79, tk); if (bar.children.length < Math.round(tk / 80 * 26)) bar.appendChild(document.createElement('i')); try { if (Sound.on) Sound.note(tk % 8 ? 80 : 60, 0.06, 'square'); } catch (e) {} if (tk >= 80) { clearInterval(t); w2.close(); Net.send({ t: 'lanFlFormat' }); got('format'); Desk.msgbox('Format Results - 3½ Floppy (A:)', '1,457,664 bytes total disk space\n0 bytes in bad sectors\n1,457,664 bytes available on disk\n\n512 bytes in each allocation unit\n2,847 total allocation units on disk\n\nSerial number is 1999-0000', 'info'); } }, 90);
      }], ['Cancel']]);
    }
    A.menubar(w, [
      ['File', () => [{ label: 'Copy to My Documents', dis: !sel, act: () => act('copy') }, { label: 'Delete', dis: !sel, act: () => act('del') }, '-', { label: 'Give Disk To...', dis: !L.diskIn(), act: giveDisk }, { label: 'Write on Label...', dis: !L.diskIn(), act: labelIt }, { label: 'Format...', dis: !L.diskIn(), act: formatIt }, '-', { label: 'Eject', dis: !L.diskIn(), act: () => act('eject') }, { label: 'Disk Box...', act: diskBox }, '-', { label: 'Close', act: w.close }]],
      ['View', [{ label: 'Refresh', key: 'F5', act: () => { Net.send({ t: 'lanFlBox' }); read(); } }, { label: 'Dave\'s Disk (My Computer)', act: () => { if (L.diskIn()) Desk.msgbox('Drive A:', 'Your disk is in the drive. Eject it first, then open My Computer > 3½ Floppy (A:) to find the old disk with "DAVE\'S DISK" on it.', 'info'); else A.open('explorer', 'My Computer'); } }]],
      ['Help', [{ label: 'About Floppy Disks', act: () => Desk.msgbox('About Floppy Disks', '3½" High Density floppy disk\n1.44 MB (that\'s 1,457,664 bytes, or about one picture)\n\nCopy files on with Send To > 3½ Floppy (A:), write on the label, then hand the actual disk to somebody else on the LAN with "Give disk to...".\n\nDon\'t leave it on the radiator.', 'info') }]],
    ]);
    const offs = [L.on('lanFl', () => { if (!busy) draw(); }), L.on('lanFlBox', m => { if (m.cur && (!L.disk || L.disk.id !== m.cur)) Net.send({ t: 'lanFlGet', id: m.cur }); else draw(); }), L.on('lanFlErr', m => { if (m.op === 'new' || m.op === 'ins' || m.op === 'give') Desk.msgbox('3½ Floppy (A:)', m.err, 'warn'); })];
    fw = { w, draw };
    if (L.box && L.box.cur) Net.send({ t: 'lanFlGet', id: L.box.cur }); else Net.send({ t: 'lanFlBox' });
    read();
    return w;
  }
  function newDisk(then) {
    Net.send({ t: 'lanFlNew' });
    once(['lanFl', 'lanFlErr'], (t, m) => {
      if (t === 'lanFlErr' && m.op !== 'new') return false;
      if (t === 'lanFl') { sfx('thud'); Desk.toast('Drive A:', 'You take a blank disk out of the box and push it in. Clunk!', 3000); if (then) then(); }
      else if (t === 'timeout') Desk.msgbox('3½ Floppy (A:)', 'JackNet didn\'t answer. (Try again.)', 'warn');
    });
  }
  function diskBox() {
    Net.send({ t: 'lanFlBox' });
    once(['lanFlBox'], t => {
      if (t === 'timeout') return;
      const box = L.box || { disks: [] };
      const items = box.disks.map(d => ({ label: (d.l || '(blank label)') + (d.id === box.cur ? '  [in the drive]' : ''), sub: `${d.nf} file(s), ${L.fmtSize(d.used)}`, icon: FLOP, v: d.id }));
      if (items.length < 4) items.push({ label: 'A new blank disk', sub: 'from the pack of ten', icon: ADD, v: 'new' });
      picker('Disk Box', `Your disk box (${box.disks.length} of 4 disks). Pick one to put in drive A:`, items, 'Insert', it => {
        if (it.v === 'new') return newDisk();
        Net.send({ t: 'lanFlIns', id: it.v }); sfx('thud');
      }, { icon: FLOP });
    });
  }
  function giveDisk(to) {
    if (!L.diskIn()) return Desk.msgbox('Give Disk', 'There is no disk in drive A:. Put one in first! (Disk box...)', 'info');
    const list = others();
    if (!list.length) return Desk.msgbox('Give Disk', 'There\'s nobody else on JackNet to give it to. (You could give it to yourself, but that\'s just holding it.)', 'info');
    const lbl = L.disk && L.disk.l ? `"${L.disk.l}"` : 'your disk';
    picker('Give Disk To...', `Hand ${lbl} to somebody on the LAN. It leaves your disk box and turns up in their drive A:.`, list.map(o => ({ label: '\\\\' + L.pcName(o), sub: o.nick, v: o, icon: PC })), 'Give', (it, bx) => {
      const note = bx.querySelector('.lan-note').value.trim().slice(0, 80);
      if (window.Guest && Guest.is()) { Guest.need('Giving floppy disks away'); return; }
      Net.send({ t: 'lanFlGive', to: it.v.id, note });
      once(['lanFlGave', 'lanFlErr'], (t, m) => {
        if (t === 'lanFlErr' && m.op !== 'give') return false;
        if (t === 'lanFlGave') { got('give'); sfx('thud'); Desk.toast('Disk given!', `You handed ${lbl} to ${m.to}. (Make sure they give it back. Unlike Dave.)`, 4000); }
        else if (t === 'timeout') Desk.msgbox('Give Disk', 'JackNet didn\'t answer.', 'warn');
      });
    }, { icon: FLOP, extra: '<div class="row"><label>Sticky note:</label><input type="text" class="lan-note" maxlength="80" placeholder="(optional) e.g. give it back by Friday!" style="flex:1;min-width:0"></div>' });
    if (to) setTimeout(() => { const btn = [...document.querySelectorAll('.lan-pick button')].find(x => x.textContent.includes(L.pcName(to))); if (btn) btn.click(); }, 0);
  }
  function giveTo(o) { if (!L.diskIn()) return Desk.msgbox('Give Disk', 'There is no disk in drive A:. Open 3½ Floppy (A:) and put one in first!', 'info', [['Open A:', () => A.open('lan.floppy')], ['OK']]); giveDisk(o); }
  // Send To > 3½ Floppy (A:)
  async function sendToFloppy(node) {
    let f; try { f = await L.toWire(node); } catch (e) { f = null; }
    if (!f) return Desk.msgbox('Copying...', `Cannot copy ${node.name}: it won't fit through the floppy drive's slot.\n\n(Only text files and pictures can go on a floppy here.)`, 'warn');
    sendWire(f);
  }
  function sendWire(f) {
    const go = () => {
      const d = L.disk;
      if (d && d.f.some(x => x.n.toLowerCase() === f.n.toLowerCase())) return Desk.msgbox('Confirm File Replace', `This folder already contains a file named '${f.n}'.\n\nWould you like to replace the existing file?`, 'q', [['Yes', () => copyAnim(f)], ['No']]);
      copyAnim(f);
    };
    if (!L.diskIn()) return Desk.msgbox('3½ Floppy (A:)', 'A:\\ is not accessible.\n\nThe device is not ready. Please insert a disk into drive A:', 'warn', [['Get a blank disk', () => newDisk(go)], ['Disk box...', diskBox], ['Cancel']]);
    if (!L.disk || L.disk.id !== L.box.cur) { Net.send({ t: 'lanFlGet', id: L.box.cur }); once(['lanFl'], () => go(), 4000); return; }
    go();
  }
  function copyAnim(f) {
    const PAGE = '<svg viewBox="0 0 16 16" width="18" height="18"><path d="M3 1h7l3 3v11H3z" fill="#fff" stroke="#000"/><path d="M5 7h6M5 9h6M5 11h4" stroke="#000080"/></svg>';
    const b = h('div', '', `<div class="lan-copy">${J('folderOpen').replace('<svg', '<svg width="32" height="32"')}<span class="pg">${PAGE}</span>${FLOP.replace('<svg', '<svg width="32" height="32"')}</div><div><b>${esc(f.n)}</b></div><div class="small">From 'My Documents' to 'A:\\'</div><div class="prog" style="margin-top:8px"><span style="display:flex;gap:2px"></span></div><div class="small lan-grind" style="margin-top:4px"><b></b> grrrk grrrk grrrk...</div>`);
    const w = A.win('Copying...', b, { w: 340, noResize: true, noMax: true, noMin: true, icon: FLOP });
    const bar = b.querySelector('.prog span'); const tk = setInterval(() => { if (bar.children.length < 22) bar.appendChild(document.createElement('i')); }, 70);
    grind(1600, () => {
      clearInterval(tk);
      Net.send({ t: 'lanFlAdd', f });
      once(['lanFl', 'lanFlErr'], (t, m) => {
        if (t === 'lanFlErr' && !/^(add|full|nodisk)$/.test(m.op)) return false;
        w.close();
        if (t === 'lanFl') { got('floppy'); Desk.toast('3½ Floppy (A:)', `${f.n} was copied to A:\\.`, 3000); if (fw && !fw.w.closed) fw.draw(); }
        else if (t === 'timeout') Desk.msgbox('Copying...', 'The drive went quiet. JackNet didn\'t answer.', 'warn');
        else if (m.op === 'full') { got('diskfull'); sfx('uhoh'); Desk.msgbox('Error Copying File', m.err === 'full' ? `Cannot copy ${f.n}: There is not enough free space on the disk.\n\n${L.fmtSize(f.sz)} needed, but 3½ Floppy (A:) is nearly full. (1.44 MB fills up fast.)\n\nDelete one or more files on the disk to free disk space, put in another disk, and then try again.` : m.err, 'warn', [['Open A:', () => A.open('lan.floppy')], ['OK']]); }
        else Desk.msgbox('Copying...', m.err, 'warn');
      });
    });
  }

  // ================================================================ 4. SQUIG99.EXE (pretend!) and JACKCLEAN.EXE
  function squig99(arg) {
    arg = arg || {};
    const b = h('div', '', `<div class="lan-fw"><canvas width="480" height="220"></canvas><div class="msg">Happy New Year 1999 !!</div></div><div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn" type="button" style="min-width:75px">OK</button></div>`);
    const w = A.win('Happy New Year 1999 !!', b, { w: 480, noResize: true, noMax: true, icon: '<svg viewBox="0 0 32 32">' + L.SQUIG16.replace(/^<svg[^>]*>/, '').replace('</svg>', '').replace(/(\d+(\.\d+)?)/g, n => String(+n * 2)) + '</svg>', onClose: () => { cancelAnimationFrame(raf); done(); } });
    const cv = b.querySelector('canvas'), g = cv.getContext('2d');
    const parts = []; let raf = 0, t0 = performance.now(), last = 0;
    const COLS = ['#ff0', '#f0f', '#0ff', '#f80', '#0f0', '#f33', '#fff'];
    const burst = () => { const x = 60 + Math.random() * 360, y = 30 + Math.random() * 100, c = COLS[Math.floor(Math.random() * COLS.length)], sq = Math.random() < 0.3; for (let i = 0; i < 40; i++) { const a = Math.random() * 6.283, s = 0.6 + Math.random() * 2.2; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 60 + Math.random() * 30, c, sq }); } try { if (Sound.on) Sound.note(200 + Math.random() * 600, 0.12, 'triangle'); } catch (e) {} };
    function frame(t) {
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 0, cv.width, cv.height);
      if (t - last > 380) { last = t; burst(); }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life--;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        g.fillStyle = p.c;
        if (p.sq) { g.beginPath(); g.arc(p.x, p.y, 2.5, 0, 6.283); g.fill(); g.fillStyle = '#e10600'; g.fillRect(p.x - 1, p.y + 2, 2, 2); } else g.fillRect(p.x, p.y, 2, 2);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    b.querySelector('.btn').addEventListener('click', () => w.close());
    setTimeout(() => { if (!w.closed) w.close(); }, 7000);
    let fired = false;
    function done() {
      if (fired) return; fired = true;
      if (L.inf) return Desk.toast('SQUIG99', 'Nice fireworks! (SQUIG99 already lives in your PC, so nothing else happened.)', 4000);
      Net.send({ t: 'lanWormRun', from: arg.from || '', g: arg.g | 0 });
      got('worm');
      once(['lanMe'], () => {
        sfx('uhoh');
        Desk.msgbox('Uh-oh!', 'Something small just wriggled into your computer...\n\nSQUIG99 is a PRETEND e-mail worm (like the real "Happy99" from January 1999, which also showed fireworks). It\'s harmless: it puts a little worm in your clock corner and adds "(sent by SQUIG99)" to e-mails you send. It also "e-mails itself" to people you\'ve swapped WinPopups, files or floppies with.\n\nLesson: never run an attachment you weren\'t expecting. Even from a mate!\n\nCure it with JACKCLEAN.EXE from www.jackshield.netz', 'warn',
          [['Go to JackShield', () => { document.getElementById('browser').classList.remove('min'); IE.navigate('http://www.jackshield.netz/'); }], ['OK']]);
      });
    }
    return w;
  }
  let scw = null;
  function squigclean() {
    if (scw && !scw.closed) { scw.restore(); return scw; }
    const b = h('div', 'lan-scan', `<div class="lan-ss-logo">${shield(28)}JackClean 1.0</div><div class="small" style="margin:4px 0 6px">From JackShield Labs. Finds and removes the SQUIG99 e-mail worm.</div><div class="field"></div><div class="prog" style="margin-top:6px"><span style="display:flex;gap:2px"></span></div><div class="row" style="justify-content:flex-end;margin-top:8px;gap:6px"><button class="btn" data-a="scan" type="button" style="min-width:90px">Scan Now</button><button class="btn" data-a="close" type="button" style="min-width:75px">Close</button></div>`);
    const w = scw = A.win('JackClean', b, { w: 400, noResize: true, noMax: true, icon: shield(32) });
    const log = b.querySelector('.field'), bar = b.querySelector('.prog span'), scanBtn = b.querySelector('[data-a=scan]');
    const say = (t, cls) => { const d = h('div', cls || '', esc(t)); log.appendChild(d); log.scrollTop = log.scrollHeight; };
    say('Ready. Click Scan Now.');
    b.querySelector('[data-a=close]').addEventListener('click', w.close);
    scanBtn.addEventListener('click', () => {
      if (scanBtn.dataset.cure) return cure();
      scanBtn.disabled = true; log.innerHTML = ''; bar.innerHTML = '';
      const files = []; (function walk(n, p) { (n.kids || []).forEach(k => { if (files.length > 60) return; const q = p + '\\' + k.name; if (k.type === 'dir') walk(k, q); else files.push(q); }); })(A.fs.root, 'C:');
      let i = 0;
      const t = setInterval(() => {
        if (i < files.length) { say('Scanning ' + files[i]); if (i % 3 === 0 && bar.children.length < 26) bar.appendChild(document.createElement('i')); i += 2; return; }
        clearInterval(t); scanBtn.disabled = false;
        if (L.inf) {
          say('C:\\JACKOS\\SYSTEM\\SQUIG.DLL ... SQUIG99 FOUND!', 'hit'); say('C:\\JACKOS\\SYSTEM\\LISTE.SQG ... SQUIG99 address list FOUND!', 'hit');
          say(`Caught from: ${L.inf.by || 'a mystery e-mail'}. Generation ${(L.inf.g | 0) + 1} worm.`);
          scanBtn.textContent = 'Clean It!'; scanBtn.dataset.cure = '1'; sfx('uhoh');
        } else { say(`${files.length} files scanned. 0 worms, 0 viruses, 1 Gubbinz (harmless).`); say('Your PC is worm-free! Well done.'); sfx('solve'); }
      }, 40);
    });
    function cure() {
      scanBtn.disabled = true;
      Net.send({ t: 'lanCure' });
      once(['lanMe'], t => {
        scanBtn.disabled = false; delete scanBtn.dataset.cure; scanBtn.textContent = 'Scan Now';
        if (t === 'timeout') return say('Could not reach JackShield. Are you online?');
        if (L.inf) return say('Hmm. The worm is still there. Try again.');
        say('SQUIG99 removed. SQUIG.DLL deleted. Tray worm evicted.'); say('Your PC is worm-free! Remember: don\'t open attachments you weren\'t expecting.');
        got('cure'); sfx('solve'); Desk.toast('JackClean', 'SQUIG99 has been removed. Your computer is worm-free!', 5000);
      });
    }
    return w;
  }
  function shield(sz) { return `<svg viewBox="0 0 32 32" width="${sz}" height="${sz}"><path d="M16 2l12 4v8c0 8-5 13-12 16C9 27 4 22 4 14V6z" fill="#1a8a3a" stroke="#000"/><path d="M16 5l9 3v6c0 6-4 10-9 12-5-2-9-6-9-12V8z" fill="#fff"/><ellipse cx="16" cy="16" rx="6" ry="4.5" fill="#e10600" stroke="#000"/><path d="M9 9l14 14" stroke="#c00" stroke-width="2.5"/></svg>`; }
  L.shield = shield;

  L.ui = { nethood, winpopup, popIn, sendPopup, floppy, sendToFloppy, shareNode, squig99, squigclean, mapDrive, giveTo, diskBox };
})();
