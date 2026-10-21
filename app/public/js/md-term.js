/* md-term: the JackMUD terminal, shared by the Telnet program, MUDdy 98 and the web site's Java client (lazy, js/md.js).
 *   MDTerm.term(o)   an ANSI colour terminal: o = { skin: 'win'|'awt'|'app', theme, size, onLine(text), inline (echo typing on
 *                    the last line, like real telnet; phones get a proper input box instead), clickable (bright CAPITAL words
 *                    in the text can be clicked to type them) } -> { el, write(s), prompt(p), info(s), clear(), focus(), cols(), ... }
 *   MDTerm.session(sink, via)  connects a terminal to JackMUD (one per browser tab: a new one takes over) -> { send, close, live }
 *   MDTerm.panel(o)  the GUI bits: health bars, the map, the compass and the "who's here" list (MUDdy 98 and the web client)
 *   MDTerm.quickbar(o) a slim row of the same things for the Telnet window */
(function () {
  'use strict';
  if (window.MDTerm) return;
  const A = window.Apps, esc = A.esc, store = A.store;
  const phone = () => innerWidth < 640 || matchMedia('(hover:none)').matches;
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // ================================================================ ANSI -> HTML
  const DIRWORDS = /^(north|south|east|west|up|down|northeast|northwest|southeast|southwest|in|out)$/;
  function ansiHtml(s, st, clickable) {
    let out = '';
    const parts = String(s).split(/\x1b\[([0-9;]*)m/);
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        for (const c of (parts[i] === '' ? ['0'] : parts[i].split(';'))) {
          const n = +c;
          if (n === 0) { st.fg = 7; st.bg = 0; st.bold = 0; } else if (n === 1) st.bold = 1; else if (n === 22) st.bold = 0;
          else if (n >= 30 && n <= 37) st.fg = n - 30; else if (n === 39) st.fg = 7; else if (n >= 40 && n <= 47) st.bg = n - 40; else if (n === 49) st.bg = 0;
          else if (n >= 90 && n <= 97) { st.fg = n - 90; st.bold = 1; }
        }
        continue;
      }
      const t = parts[i]; if (!t) continue;
      const fg = st.fg + (st.bold ? 8 : 0), cls = 'f' + fg + (st.bg ? ' b' + st.bg : '');
      if (clickable && fg === 15) {
        // bright white CAPITALS are things you can type (TALK PIXEL, GET SCARF...), lower-case bright words are exits
        out += `<span class="${cls}">` + esc(t).replace(/\b([A-Z][A-Z0-9]*(?: [A-Z0-9][A-Z0-9]*){0,3})\b|\b(north|south|east|west|up|down|northeast|northwest|southeast|southwest)\b/g, (m, cmd, dir) => {
          const c = cmd || dir; if (cmd && (cmd.length < 2 && !/^[NSEWUD]$/.test(cmd) || /^(HP|MP|XP|OK|TV|PC|ME|ALL|THE|AND|OR|ABOUT|JACKMUD|JACKNET|WINNER|BEEP|BOOP|TIP)$/.test(cmd))) return m;
          return `<span class="md-cmd" data-cmd="${esc(c.toLowerCase())}" title="Click to type: ${esc(c)}">${m}</span>`;
        }) + '</span>';
      } else out += `<span class="${cls}">${esc(t)}</span>`;
    }
    return out;
  }
  const strip = s => String(s).replace(/\x1b\[[0-9;]*m/g, '');

  // ================================================================ the terminal
  const THEMES = { ansi: 'ANSI colour (black)', blue: 'ANSI colour (dark blue)', green: 'Green screen', amber: 'Amber screen', white: 'Paper white' };
  const SIZES = { s: 12, m: 14, l: 16, xl: 19 };
  function term(o) {
    o = Object.assign({ skin: 'win', theme: store.get('jhp_md_theme', 'ansi'), size: store.get('jhp_md_size', phone() ? 's' : 'm'), inline: !phone(), clickable: true, max: 1500 }, o);
    const el = h('div', `md-term md-skin-${o.skin} md-th-${o.theme}`);
    el.innerHTML = `<div class="md-scr" tabindex="-1"><pre class="md-out"></pre><div class="md-live"><span class="md-pr"></span><span class="md-echo"></span><span class="md-cur">&nbsp;</span></div></div>
      <div class="md-inbar"><input class="md-in" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" aria-label="Type a command" placeholder="Type here, then press Enter"><button type="button" class="md-send">Send</button></div>`;
    const scr = el.querySelector('.md-scr'), pre = el.querySelector('.md-out'), pr = el.querySelector('.md-pr'), echo = el.querySelector('.md-echo'), cur = el.querySelector('.md-cur');
    const inp = el.querySelector('.md-in'), bar = el.querySelector('.md-inbar');
    const hist = store.get('jhp_md_hist', []).slice(-50); let hi = hist.length, st = { fg: 7, bg: 0, bold: 0 }, pst = { fg: 7, bg: 0, bold: 0 };
    let lines = 0, promptHtml = '', live = true, pass = false;
    const T = { el, scr, input: inp, hist, opts: o };
    const setInline = on => { o.inline = on; el.classList.toggle('md-inl', on); };
    setInline(o.inline);
    T.setTheme = th => { el.classList.remove('md-th-' + o.theme); o.theme = th; el.classList.add('md-th-' + th); store.set('jhp_md_theme', th); };
    T.setSize = sz => { o.size = sz; el.style.setProperty('--md-fs', (SIZES[sz] || 14) + 'px'); store.set('jhp_md_size', sz); setTimeout(fit, 30); };
    T.setSize(o.size);
    const atBottom = () => scr.scrollHeight - scr.scrollTop - scr.clientHeight < 40;
    const down = () => { scr.scrollTop = scr.scrollHeight; };
    T.write = s => {
      if (!s) return;
      if (s.indexOf('\x07') >= 0) { s = s.replace(/\x07/g, ''); sfx('beep'); }
      const stick = atBottom() || s.length > 0;
      const frag = document.createElement('span'); frag.innerHTML = ansiHtml(s, st, o.clickable);
      pre.appendChild(frag);
      lines += (s.match(/\n/g) || []).length;
      while (lines > o.max && pre.firstChild) { const f = pre.firstChild; lines -= (f.textContent.match(/\n/g) || []).length; f.remove(); }
      if (stick) down();
    };
    T.info = s => T.write('\x1b[1;30m' + s + '\x1b[0m\n');
    T.prompt = p => { pst = { fg: 7, bg: 0, bold: 0 }; promptHtml = ansiHtml(p || '', pst, false); pr.innerHTML = promptHtml; down(); };
    T.clear = () => { pre.innerHTML = ''; lines = 0; };
    T.text = () => pre.textContent;
    T.password = on => { pass = !!on; inp.type = on ? 'password' : 'text'; showEcho(); };
    T.setLive = on => { live = !!on; el.classList.toggle('md-dead', !live); if (!live) { pr.innerHTML = ''; echo.textContent = ''; } };
    const showEcho = () => {
      if (!o.inline) return;
      const v = inp.value, p = inp.selectionStart == null ? v.length : inp.selectionStart;
      echo.textContent = pass ? '*'.repeat(v.length) : v;
      // the block cursor sits after the text; when you go left with the arrows it sits on a letter instead
      const shown = pass ? '*'.repeat(v.length) : v;
      if (p < v.length) { echo.innerHTML = esc(shown.slice(0, p)) + `<span class="md-curon">${esc(shown[p])}</span>` + esc(shown.slice(p + 1)); cur.style.display = 'none'; } else cur.style.display = '';
    };
    T.focus = () => { try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } };
    T.send = text => {
      text = String(text == null ? inp.value : text);
      if (text.trim() && !pass && hist[hist.length - 1] !== text) { hist.push(text); if (hist.length > 50) hist.shift(); store.set('jhp_md_hist', hist); }
      hi = hist.length;
      // echo what was typed into the scrollback (after the prompt), like a real terminal
      const shown = pass ? '' : text;
      const fr = document.createElement('span'); fr.innerHTML = promptHtml + `<span class="f15">${esc(shown)}</span>\n`; pre.appendChild(fr); lines++;
      pr.innerHTML = ''; inp.value = ''; showEcho(); down();
      if (o.onLine) o.onLine(text);
    };
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); T.send(); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) { hi--; inp.value = hist[hi] || ''; requestAnimationFrame(() => { inp.selectionStart = inp.selectionEnd = inp.value.length; showEcho(); }); } return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); if (hi < hist.length) { hi++; inp.value = hist[hi] || ''; } showEcho(); return; }
      if (e.key === 'Escape') { inp.value = ''; showEcho(); return; }
      if (e.key === 'PageUp') { e.preventDefault(); scr.scrollTop -= scr.clientHeight * 0.8; return; }
      if (e.key === 'PageDown') { e.preventDefault(); scr.scrollTop += scr.clientHeight * 0.8; return; }
      if (o.numpad !== false && !inp.value && e.location === 3 && !e.getModifierState('NumLock')) {
        const D = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e', Home: 'nw', PageUp: 'ne', End: 'sw', PageDown: 'se', Clear: 'look' }[e.key];
        if (D) { e.preventDefault(); T.send(D); }
      }
      if (e.ctrlKey && (e.key === ']' || e.key === 'Dead') && o.onEscape) { e.preventDefault(); o.onEscape(); }
      setTimeout(showEcho, 0);
    });
    inp.addEventListener('input', showEcho);
    inp.addEventListener('focus', () => el.classList.add('md-focus'));
    inp.addEventListener('blur', () => el.classList.remove('md-focus'));
    ['select', 'click', 'keyup'].forEach(t => inp.addEventListener(t, showEcho));
    el.querySelector('.md-send').addEventListener('click', () => { T.send(); T.focus(); });
    // clicking the screen puts the cursor back (unless you're selecting text to copy), clicking a command types it
    scr.addEventListener('click', e => {
      const c = e.target.closest('.md-cmd');
      if (c && live) { sfx('click'); T.send(c.dataset.cmd); T.focus(); return; }
      const sel = getSelection(); if (sel && String(sel).length) return;
      T.focus();
    });
    // how many columns fit (the server shrinks its boxes and banner for narrow screens)
    let lastCols = 0, fitT = 0;
    function measure() { const s = h('span', 'md-meas', 'MMMMMMMMMM'); pre.appendChild(s); const w = s.getBoundingClientRect().width / 10; s.remove(); return w || 8; }
    function fit() { const cw = measure(), w = scr.clientWidth - 14; const c = Math.max(30, Math.floor(w / cw)); if (c !== lastCols) { lastCols = c; if (o.onCols) o.onCols(c); } }
    T.cols = () => { if (!lastCols) fit(); return lastCols || 80; };
    const ro = window.ResizeObserver ? new ResizeObserver(() => { clearTimeout(fitT); fitT = setTimeout(fit, 120); }) : null;
    if (ro) ro.observe(scr);
    T.destroy = () => { if (ro) ro.disconnect(); };
    T.inline = setInline;
    T.bar = bar;
    T.copy = () => { const s = String(getSelection() || ''); if (s && navigator.clipboard) navigator.clipboard.writeText(s).catch(() => {}); return s; };
    T.paste = t => { inp.value += t; showEcho(); T.focus(); };
    T.selectAll = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    return T;
  }

  // ================================================================ the session (one per tab: the server only knows one terminal per visitor)
  let cur = null;
  function session(sink, via) {
    if (cur && cur.sink !== sink) { const old = cur; cur = null; old.ended = true; try { old.sink.end('Connection closed: JackMUD was opened in another window.'); } catch (e) {} }
    const S = { sink, via, ended: false, live: false, waiting: true };
    cur = S;
    const offs = [];
    const mine = () => cur === S && !S.ended;
    const opened = () => { if (!mine()) return; S.waiting = false; Net.send({ t: 'mdOpen', via, cols: sink.cols ? sink.cols() : 80 }); S.live = true; };
    offs.push(MD.on('mdOut', m => { if (!mine()) return; if (m.s) sink.write(m.s); sink.prompt(m.p || ''); if (m.st && sink.stat) sink.stat(m.st); }));
    offs.push(MD.on('mdEnd', m => { if (!mine()) return; S.close(true, m.why || 'Connection to host lost.'); }));
    offs.push(MD.on('_close', () => { if (!mine()) return; S.live = false; sink.info && sink.info('*** The line went dead (the phone line dropped?). Redialling...'); }));
    offs.push(MD.on('_open', () => { if (!mine()) return; sink.info && sink.info('*** Reconnected to mud.jacknet.jnet. Picking up where you left off...'); opened(); }));
    S.send = line => { if (!mine()) return false; if (!Net.connected) { sink.info && sink.info('*** Not connected. Waiting for the modem...'); return false; } Net.send({ t: 'mdIn', s: String(line).slice(0, 240) }); return true; };
    S.cols = n => { if (mine() && Net.connected) Net.send({ t: 'mdCols', cols: n }); };
    S.close = (fromServer, why) => {
      if (S.ended) return; S.ended = true; S.live = false;
      offs.forEach(f => f());
      if (!fromServer && Net.connected && cur === S) Net.send({ t: 'mdClose' });
      if (cur === S) cur = null;
      try { sink.end(why || 'Connection closed.'); } catch (e) {}
    };
    if (Net.connected) setTimeout(opened, 30); else { sink.info && sink.info('Dialling the JackNet...'); const off = MD.on('_open', () => { off(); opened(); }); offs.push(off); }
    return S;
  }

  // ================================================================ the GUI bits
  const DIR9 = [['nw', 'NW'], ['n', 'N'], ['ne', 'NE'], ['w', 'W'], ['look', 'LOOK'], ['e', 'E'], ['sw', 'SW'], ['s', 'S'], ['se', 'SE']];
  const KIND = { npc: ['Talk to', 'npc'], mob: ['Fight', 'mob'], pc: ['Player', 'pc'], item: ['Pick up', 'item'] };
  function actions(x) {
    const k = x.kw;
    if (x.k === 'npc') return [['Talk to ' + x.n, 'talk ' + k], ['Look at ' + x.n, 'look ' + k], ['Shop: list what they sell', 'list']];
    if (x.k === 'mob') return [['Fight ' + x.n, 'kill ' + k], ['Consider (is it too tough?)', 'consider ' + k], ['Look at it', 'look ' + k]];
    if (x.k === 'pc') return [['Look at ' + x.n, 'look ' + k], ['Wave at ' + x.n, 'wave ' + k], ['Invite to my party', 'party invite ' + k], ['Follow ' + x.n, 'follow ' + k], ['High five!', 'highfive ' + k]];
    return [['Pick up ' + x.n, 'get ' + k], ['Look at it', 'look ' + k]];
  }
  function menuAt(anchor, items, send, skin) {
    if (window.IE && IE.menu && skin !== 'awt') { const r = anchor.getBoundingClientRect(); IE.menu(items.map(([label, cmd]) => ({ label, act: () => send(cmd) })), r.left, r.bottom); return; }
    document.querySelectorAll('.md-pop').forEach(p => p.remove());
    const p = h('div', 'md-pop'); const r = anchor.getBoundingClientRect();
    for (const [label, cmd] of items) { const b = h('button', '', esc(label)); b.type = 'button'; b.addEventListener('click', () => { p.remove(); send(cmd); }); p.appendChild(b); }
    document.body.appendChild(p);
    const pr = p.getBoundingClientRect();
    p.style.left = Math.max(4, Math.min(innerWidth - pr.width - 4, r.left)) + 'px'; p.style.top = (r.bottom + pr.height > innerHeight - 4 ? r.top - pr.height : r.bottom) + 'px';
    p.style.zIndex = (window.JZ = (window.JZ || 2400) + 5);
    setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener('pointerdown', off, true); } }, true), 0);
  }
  const CHIPICON = {
    npc: '<svg viewBox="0 0 12 12"><circle cx="6" cy="4" r="2.4" fill="#ffd400" stroke="#000" stroke-width=".7"/><path d="M1.6 11.4c.4-3 2.2-4.4 4.4-4.4s4 1.4 4.4 4.4z" fill="#ffd400" stroke="#000" stroke-width=".7"/></svg>',
    mob: '<svg viewBox="0 0 12 12"><path d="M2 10L9.6 2.4M8 1.4l2.6 2.6M3.4 8.6l-2 2" stroke="#e10600" stroke-width="1.6" stroke-linecap="round"/><path d="M10 10L2.4 2.4" stroke="#c0c0c0" stroke-width="1.6" stroke-linecap="round"/></svg>',
    pc: '<svg viewBox="0 0 12 12"><circle cx="6" cy="4" r="2.4" fill="#55ffff" stroke="#000" stroke-width=".7"/><path d="M1.6 11.4c.4-3 2.2-4.4 4.4-4.4s4 1.4 4.4 4.4z" fill="#55ffff" stroke="#000" stroke-width=".7"/></svg>',
    item: '<svg viewBox="0 0 12 12"><path d="M2 4.5l4-2.4 4 2.4v4.6L6 11.4 2 9.1z" fill="#c8a060" stroke="#000" stroke-width=".7"/><path d="M2 4.5l4 2.3 4-2.3M6 6.8v4.6" stroke="#000" stroke-width=".6" fill="none"/></svg>',
  };
  function chips(box, st, send, skin) {
    box.innerHTML = '';
    const L = (st && st.here) || [];
    if (!L.length) { box.appendChild(h('span', 'md-none', 'Nobody here but you.')); return; }
    for (const x of L) {
      const b = h('button', 'md-chip md-k-' + x.k, `${CHIPICON[x.k]}<span>${esc(x.n.replace(/^(a|an|the) /i, ''))}</span>`); b.type = 'button';
      b.title = KIND[x.k][0] + ': ' + x.n + (x.lv ? ' (level ' + x.lv + ')' : '');
      b.addEventListener('click', () => menuAt(b, actions(x), send, skin));
      box.appendChild(b);
    }
  }
  // the little map: the server sends the rooms round about you (only ones you've seen) when you move
  function drawMap(cv, list, o) {
    o = o || {};
    const W = cv.clientWidth || 180, H = cv.clientHeight || 130, dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = o.bg || '#001020', cell = o.cell || Math.max(16, Math.min(24, Math.floor(Math.min(W / 8, H / 6))));
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // a faint grid, like graph paper
    g.strokeStyle = o.grid || 'rgba(85,170,255,.10)'; g.lineWidth = 1;
    for (let x = (W / 2) % cell; x < W; x += cell) { g.beginPath(); g.moveTo(Math.floor(x) + .5, 0); g.lineTo(Math.floor(x) + .5, H); g.stroke(); }
    for (let y = (H / 2) % cell; y < H; y += cell) { g.beginPath(); g.moveTo(0, Math.floor(y) + .5); g.lineTo(W, Math.floor(y) + .5); g.stroke(); }
    if (!list || !list.length) { g.fillStyle = '#5a7a9a'; g.font = '11px Tahoma, Arial, sans-serif'; g.textAlign = 'center'; g.fillText(list ? 'No map here!' : 'Walk about to draw the map', W / 2, H / 2); return; }
    const cx = W / 2, cy = H / 2, rs = Math.round(cell * 0.56);
    const P = r => [cx + r.x * cell, cy + r.y * cell];
    const V = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [1, -1], nw: [-1, -1], se: [1, 1], sw: [-1, 1] };
    g.strokeStyle = o.line || '#3a8ad8'; g.lineWidth = 2;
    for (const r of list) { const [x, y] = P(r); for (const d of (r.ex || '').split(',')) { const v = V[d]; if (!v) continue; g.beginPath(); g.moveTo(x, y); g.lineTo(x + v[0] * cell * 0.5, y + v[1] * cell * 0.5); g.stroke(); } }
    for (const r of list) {
      const [x, y] = P(r), seen = r.n !== '?';
      g.fillStyle = r.me ? '#ffd400' : !seen ? '#0a1a2a' : r.k === 's' ? '#1a5a3a' : '#1a3a6a';
      g.strokeStyle = r.me ? '#fff' : seen ? '#7ab8ff' : '#2a4a6a'; g.lineWidth = r.me ? 2 : 1;
      g.fillRect(x - rs / 2, y - rs / 2, rs, rs); g.strokeRect(x - rs / 2 + .5, y - rs / 2 + .5, rs - 1, rs - 1);
      if (r.k === 'n' && !r.me) { g.fillStyle = '#ffd400'; g.fillRect(x - 1.5, y - rs / 2 + 2, 3, rs / 2 - 1); g.fillRect(x - 1.5, y + rs / 2 - 4, 3, 2.5); }
      if (r.ud) { g.fillStyle = r.me ? '#000' : '#9fd0ff'; g.font = 'bold 9px Tahoma, Arial, sans-serif'; g.textAlign = 'center'; g.fillText(r.ud.includes('u') && r.ud.includes('d') ? '↕' : r.ud === 'u' ? '▲' : '▼', x + rs / 2 + 4, y - rs / 2 + 4); }
      if (r.me) { g.fillStyle = '#000'; g.beginPath(); g.arc(x, y, rs * 0.2, 0, 7); g.fill(); }
    }
  }
  function bars(st) {
    const pc = (a, b) => Math.max(0, Math.min(100, Math.round(a / Math.max(1, b) * 100)));
    const hc = st.hp * 3 < st.mhp ? 'md-low' : st.hp * 3 < st.mhp * 2 ? 'md-mid' : '';
    return `<div class="md-bar md-hp ${hc}"><b>HP</b><span><i style="width:${pc(st.hp, st.mhp)}%"></i></span><em>${st.hp}/${st.mhp}</em></div>
      <div class="md-bar md-mp"><b>MP</b><span><i style="width:${pc(st.mp, st.mmp)}%"></i></span><em>${st.mp}/${st.mmp}</em></div>
      <div class="md-bar md-xp"><b>XP</b><span><i style="width:${pc(st.xp, st.nx)}%"></i></span><em>${pc(st.xp, st.nx)}%</em></div>`;
  }
  // the big panel: MUDdy 98's right-hand side, and the web client's
  function panel(o) {
    const el = h('div', `md-panel md-skin-${o.skin || 'app'}`);
    el.innerHTML = `<div class="md-pbox md-who"><div class="md-pname">Not connected</div><div class="md-pcls">&nbsp;</div><div class="md-pbars"></div><div class="md-pgold"></div><div class="md-pfight" hidden></div></div>
      <div class="md-pbox md-mapbox"><div class="md-ph"><span class="md-proom">Map</span><span class="md-parea"></span></div><canvas class="md-map" width="180" height="130" aria-label="Map"></canvas></div>
      <div class="md-pbox md-compbox"><div class="md-comp">${DIR9.map(([d, l]) => `<button type="button" data-go="${d}" class="${d === 'look' ? 'md-look' : ''}">${l}</button>`).join('')}</div><div class="md-ud"><button type="button" data-go="u">UP</button><button type="button" data-go="d">DOWN</button><button type="button" data-go="in">IN</button><button type="button" data-go="out">OUT</button></div></div>
      <div class="md-pbox md-herebox"><div class="md-ph">Here with you</div><div class="md-here"></div></div>
      <div class="md-pbox md-quick">${[['inv', 'Inventory'], ['eq', 'Equipment'], ['score', 'Score'], ['quests', 'Quests'], ['map', 'Map'], ['who', 'Who'], ['skills', 'Skills'], ['help', 'Help']].map(([c, l]) => `<button type="button" data-cmd="${c}">${l}</button>`).join('')}</div>`;
    const P = { el, last: null, map: null };
    const send = c => { sfx('click'); o.send(c); };
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => send(b.dataset.go)));
    el.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('click', () => send(b.dataset.cmd)));
    const cv = el.querySelector('.md-map');
    P.stat = st => {
      P.last = st; if (st.map !== undefined) P.map = st.map;
      el.querySelector('.md-pname').textContent = st.n;
      el.querySelector('.md-pcls').textContent = `Level ${st.lv} ${st.cls.charAt(0).toUpperCase() + st.cls.slice(1)}`;
      el.querySelector('.md-pbars').innerHTML = bars(st);
      el.querySelector('.md-pgold').innerHTML = `<span class="md-coin"></span> ${Math.floor(st.g).toLocaleString('en-GB')} gold`;
      const f = el.querySelector('.md-pfight'); f.hidden = !st.fight;
      if (st.fight) f.innerHTML = `<div class="md-bar md-foe"><b>VS</b><span><i style="width:${st.fight.pct}%"></i></span><em>${esc(st.fight.n.replace(/^(a|an|the) /i, ''))}</em></div><button type="button" class="md-flee">Run away!</button>`;
      const fl = f.querySelector('.md-flee'); if (fl) fl.onclick = () => send('flee');
      el.querySelector('.md-proom').textContent = st.room.n; el.querySelector('.md-parea').textContent = st.room.area;
      const ex = new Set(st.room.ex);
      el.querySelectorAll('[data-go]').forEach(b => { const d = b.dataset.go; b.disabled = d !== 'look' && !ex.has(d); b.classList.toggle('md-open', ex.has(d)); });
      el.querySelector('.md-ud').classList.toggle('md-some', ['u', 'd', 'in', 'out'].some(d => ex.has(d)));
      chips(el.querySelector('.md-here'), st, send, o.skin);
      drawMap(cv, P.map, o.mapStyle);
    };
    P.off = () => {
      el.querySelector('.md-pname').textContent = 'Not connected'; el.querySelector('.md-pcls').innerHTML = '&nbsp;';
      el.querySelector('.md-pbars').innerHTML = ''; el.querySelector('.md-pgold').innerHTML = ''; el.querySelector('.md-here').innerHTML = '';
      el.querySelector('.md-pfight').hidden = true; el.querySelectorAll('[data-go]').forEach(b => { b.disabled = true; b.classList.remove('md-open'); });
      drawMap(cv, null, o.mapStyle);
    };
    if (window.ResizeObserver) new ResizeObserver(() => drawMap(cv, P.map, o.mapStyle)).observe(cv);
    setTimeout(() => P.off(), 0);
    return P;
  }
  // the Telnet window's slim version: a compass row and the chips
  function quickbar(o) {
    const el = h('div', 'md-qbar');
    el.innerHTML = `<div class="md-qdirs">${[['n', 'N'], ['s', 'S'], ['e', 'E'], ['w', 'W'], ['u', 'Up'], ['d', 'Dn']].map(([d, l]) => `<button type="button" data-go="${d}" title="Go ${l}">${l}</button>`).join('')}<span class="md-qsep"></span>${[['look', 'Look'], ['inv', 'Inv'], ['quests', 'Quests'], ['map', 'Map'], ['help', 'Help']].map(([c, l]) => `<button type="button" data-cmd="${c}">${l}</button>`).join('')}</div><div class="md-qhere"></div>`;
    const Q = { el };
    const send = c => { sfx('click'); o.send(c); };
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => send(b.dataset.go)));
    el.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('click', () => send(b.dataset.cmd)));
    Q.stat = st => {
      const ex = new Set(st.room.ex);
      el.querySelectorAll('[data-go]').forEach(b => { b.disabled = !ex.has(b.dataset.go); });
      chips(el.querySelector('.md-qhere'), st, send, o.skin);
    };
    Q.off = () => { el.querySelectorAll('[data-go]').forEach(b => { b.disabled = true; }); el.querySelector('.md-qhere').innerHTML = ''; };
    Q.off();
    return Q;
  }

  window.MDTerm = { term, session, panel, quickbar, drawMap, ansiHtml, strip, THEMES, SIZES, phone, get current() { return cur; } };
})();
