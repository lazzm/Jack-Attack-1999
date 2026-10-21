/* pcgames-spy: JackSpy 3D (the 1999 Internet game finder for Jackreal Tournament and JAQUAKE: server list with pings,
 * maps, players and modes, filters, Quick Match, Join/Spectate, server rules and players, the frag rankings) and The Frag
 * Zone (www.fragzone.jnet), a fan site with the live [JackNet] 24/7 servers and the weekly and all-time rankings.
 * Loaded on demand by pcgames.js. Talks to mods/arena.js (arList, arTop, arPing). Written from scratch for jacklm.com. */
(function () {
  'use strict';
  if (window.PCGSpy) return;
  const AR = window.PCGArena, esc = Apps.esc, store = Apps.store;
  const css = (id, t) => { if (document.getElementById(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = t; document.head.appendChild(s); };
  css('pcg-spy-css', `
.jsp{display:flex;flex-direction:column;height:100%;min-height:0;background:#c0c0c0;font:11px Tahoma,sans-serif;color:#000}
.jsp *{box-sizing:border-box}
.jsp-tb{display:flex;gap:2px;padding:3px;border-bottom:1px solid #808080;box-shadow:0 1px #fff;flex-wrap:wrap;align-items:stretch}
.jsp-tb button{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:54px;padding:3px 5px;background:#c0c0c0;border:1px solid transparent;font:11px Tahoma;cursor:pointer}
.jsp-tb button:hover{border-color:#fff #808080 #808080 #fff}.jsp-tb button:active{border-color:#808080 #fff #fff #808080}
.jsp-tb button svg{width:22px;height:22px}.jsp-tb .sep{width:2px;border-left:1px solid #808080;border-right:1px solid #fff;margin:2px 3px}
.jsp-tb button.qm{font-weight:bold;color:#006000}
.jsp-ad{margin-left:auto;align-self:center;display:flex;align-items:center;gap:6px;background:#000080;color:#ffff00;padding:3px 8px;font:bold 11px Verdana,sans-serif;cursor:pointer;border:2px outset #c0c0ff;max-width:260px}
.jsp-ad small{display:block;color:#fff;font-weight:normal;font-size:10px}.jsp-ad svg{width:24px;height:24px;flex:none}
.jsp-main{flex:1;display:flex;min-height:0;gap:3px;padding:3px}
.jsp-tree{width:150px;flex:none;overflow:auto}
.jsp-tree div{padding:3px 4px;cursor:pointer;display:flex;align-items:center;gap:4px;white-space:nowrap}
.jsp-tree div.on{background:#000080;color:#fff}.jsp-tree div.off{color:#808080}
.jsp-tree svg{width:16px;height:16px;flex:none}
.jsp-right{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.jsp-list{flex:1;overflow:auto;min-height:90px}
.jsp-list table{width:100%;border-collapse:collapse}
.jsp-list th{position:sticky;top:0;background:#c0c0c0;border:1px solid;border-color:#fff #808080 #808080 #fff;text-align:left;padding:2px 4px;font-weight:normal;cursor:pointer;white-space:nowrap}
.jsp-list td{padding:2px 4px;white-space:nowrap;border-bottom:1px solid #f0f0f0}
.jsp-list tr.sel td{background:#000080;color:#fff}.jsp-list tr.dead td{color:#909090}
.jsp-list .pub{color:#006000;font-weight:bold}.jsp-list tr.sel .pub{color:#9f9}
.jsp-list .png{display:inline-block;width:8px;height:8px;margin-right:4px;border:1px solid #000;vertical-align:-1px}
.jsp-bot{height:118px;flex:none;display:flex;gap:3px;min-height:0}
.jsp-bot > div{flex:1;min-width:0;overflow:auto;padding:3px 5px}
.jsp-bot h4{margin:0 0 3px;font:bold 11px Tahoma;color:#000080}
.jsp-bot td{padding:1px 6px 1px 0;white-space:nowrap}
.jsp-filt{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:0 3px}
.jsp-filt label{display:flex;gap:3px;align-items:center}
@media (max-width:560px){.jsp-tree{display:none}.jsp-tb button{min-width:44px;padding:2px}.jsp-ad{display:none}.jsp-bot{height:96px}.jsp-hm{display:none}}
.fz{background:#000 radial-gradient(circle at 20% 10%,#1a1a3a 0,#000 60%);color:#e0e0e0;font:13px Verdana,Arial,sans-serif;padding:12px;min-height:100%}
.fz a{color:#7cf}.fz a:hover{color:#ff0}
.fz h1{margin:0;font:900 clamp(28px,7vw,52px)/1 Impact,'Arial Black',sans-serif;letter-spacing:2px;color:#ff7a00;text-shadow:3px 3px 0 #600,0 0 12px #f60}
.fz h1 span{color:#ffe000}
.fz .tag{color:#9f9;font:bold 12px 'Courier New',monospace;margin:4px 0 10px}
.fz .nav{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}
.fz .nav a{background:#200;border:2px outset #a40;color:#ffd000;font:bold 12px Verdana;padding:3px 10px;text-decoration:none}
.fz .cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,260px);gap:12px}
@media (max-width:640px){.fz .cols{grid-template-columns:minmax(0,1fr)}}
.fz .box{border:2px solid #f60;background:rgba(40,10,0,.6);margin-bottom:12px}
.fz .box > h2{margin:0;background:linear-gradient(90deg,#a30,#300);color:#ffe000;font:bold 14px Verdana;padding:4px 8px;letter-spacing:1px}
.fz .box > .in{padding:8px}
.fz table{width:100%;border-collapse:collapse;font-size:12px}.fz th{text-align:left;color:#ffd000;border-bottom:1px solid #a40;padding:2px 4px}.fz td{padding:3px 4px;border-bottom:1px dotted #522}
.fz .join{background:#060;color:#fff;border:2px outset #6f6;font:bold 11px Verdana;cursor:pointer;padding:2px 8px}
.fz .new{background:#f00;color:#fff;font:bold 10px Verdana;padding:0 3px;margin-right:4px;animation:fzB 1s steps(2) infinite}
@keyframes fzB{50%{opacity:.2}}
.fz .uc{display:inline-block;background:repeating-linear-gradient(45deg,#ff0 0 8px,#000 8px 16px);color:#000;font:bold 11px Verdana;padding:3px 8px;border:1px solid #ff0}
.fz .uc b{background:#ff0;padding:0 4px}
.fz .tabs a{margin-right:6px;cursor:pointer}.fz .tabs a.on{color:#ff0;text-decoration:none;font-weight:bold}
.fz .foot{text-align:center;color:#888;font-size:11px;margin-top:10px}
.fz .ctr{display:inline-block;background:#000;color:#0f0;font:bold 13px 'Courier New',monospace;border:2px inset #444;padding:1px 6px;letter-spacing:2px}
.fz .mq{overflow:hidden;white-space:nowrap;border:1px solid #f60;background:#100;color:#ff0;font:bold 12px Verdana;padding:3px 0;margin-bottom:10px}
.fz .mq span{display:inline-block;padding-left:100%;animation:fzMq 22s linear infinite}
@keyframes fzMq{to{transform:translateX(-100%)}}
`);
  const ICO = {
    refresh: '<svg viewBox="0 0 22 22"><path d="M17 7A7 7 0 1 0 18 13" fill="none" stroke="#006000" stroke-width="2.5"/><path d="M13 3l6 1-2 6z" fill="#006000"/></svg>',
    quick: '<svg viewBox="0 0 22 22"><path d="M12 1L4 13h6l-2 8 10-13h-6l3-7z" fill="#ffd000" stroke="#805000"/></svg>',
    join: '<svg viewBox="0 0 22 22"><rect x="2" y="5" width="12" height="12" fill="#c0c0c0" stroke="#000"/><path d="M8 11h12M15 6l5 5-5 5" fill="none" stroke="#000080" stroke-width="2.5"/></svg>',
    spec: '<svg viewBox="0 0 22 22"><ellipse cx="11" cy="11" rx="9" ry="5.5" fill="#fff" stroke="#000"/><circle cx="11" cy="11" r="3.5" fill="#2050c0"/><circle cx="11" cy="11" r="1.4" fill="#000"/></svg>',
    rank: '<svg viewBox="0 0 22 22"><path d="M6 3h10v5q0 5-5 5T6 8z" fill="#ffd000" stroke="#805000"/><path d="M8 13h6v3H8zM5 17h12v3H5z" fill="#a07000" stroke="#503000"/><path d="M6 5H2q0 4 4 4M16 5h4q0 4-4 4" fill="none" stroke="#805000"/></svg>',
    site: '<svg viewBox="0 0 22 22"><circle cx="11" cy="11" r="9" fill="#2a6ad8" stroke="#000"/><path d="M3 9h16M3 13h16M11 2q-5 9 0 18M11 2q5 9 0 18" fill="none" stroke="#bde" stroke-width="1"/></svg>',
    jrt: () => (window.PCGStub && PCGStub.I.jrt) || '', jq: () => (window.PCGStub && PCGStub.I.jaquake) || '',
    off: '<svg viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" fill="#808080" stroke="#404040"/><path d="M4 4l8 8M12 4l-8 8" stroke="#c0c0c0" stroke-width="2"/></svg>',
  };
  const GN = { jrt: 'Jackreal Tournament', jq: 'JAQUAKE' };
  const MODE = { dm: 'DeathMatch', ctf: 'Capture the Flag', coop: 'Co-op' };
  // games JackSpy "knows" but you haven't got (1999 had a LOT of shooters; these are all made up)
  const OTHER = [['Half-Jack', 'Not installed. (It\'s scary, Mom said no.)'], ['Team Fortress Jack', 'Not installed. Ask Callum, he\'s got it.'], ['Jackfire 2', 'Not installed. It\'s on a coaster CD somewhere.'], ['Starsiege: Jackbox', 'Not installed. Too many keys to learn.']];
  const FAKE = [['=FrAgZ= 24/7 Space Station', 'jrt', 'Space Station Jack', 'dm', '8/8', 412], ['[UK] Callum\'s Old Server', 'jrt', 'Castle Jackstone', 'ctf', '0/8', 999], ['=QUAKE= Clan Rusty Pit 24/7', 'jq', 'DM1: The Rusty Pit', 'dm', '16/16', 380], ['Dial-Up Dan\'s JQ Box', 'jq', 'DM2: Jackstone Cloisters', 'dm', '0/4', 999]];

  // ---- one set of network listeners for every JackSpy window and fan page
  const subs = new Set();
  let rtt = 0;
  if (window.Net) {
    Net.on('arList', m => subs.forEach(f => f('list', m)));
    Net.on('arTop', m => subs.forEach(f => f('top', m)));
    Net.on('arPong', m => { if (m.k && m.k < 0) { rtt = Math.round(performance.now() + m.k); subs.forEach(f => f('ping', rtt)); } });
  }
  const ping = () => { if (window.Net && Net.connected) Net.send({ t: 'arPing', k: -performance.now() }); };
  const pingOf = g => g.pub ? (rtt || 60) + 4 : Math.round((rtt || 60) / 2 + g.ping / 2 + 18);
  const pingCol = p => p < 100 ? '#00c000' : p < 250 ? '#e0c000' : '#e00000';
  const appOf = game => game === 'jq' ? 'pcgames.jaquake' : 'pcgames.jrt';
  function joinGame(g, spec) { Apps.secret('fps.spy'); return window.PCGStub && PCGStub.play(appOf(g.game), { go: 'join', id: g.id, name: g.name, spec: !!spec }); }
  function quickGame(game, mode) { return window.PCGStub && PCGStub.play(appOf(game || 'jrt'), { go: mode === 'coop' ? 'coop' : 'quick' }); }

  // ================================================================ JackSpy 3D
  function app(w, body, arg) {
    let list = [], sel = null, tree = store.get('jhp_spy_tree', 'all'), sort = store.get('jhp_spy_sort', ['ping', 1]), F = Object.assign({ empty: false, full: false, mode: '' }, store.get('jhp_spy_f', {})), refreshing = false, timer = 0;
    body.innerHTML = `<div class="jsp">
      <div class="jsp-tb">
        <button type="button" data-a="refresh">${ICO.refresh}Refresh</button><button type="button" data-a="quick" class="qm">${ICO.quick}Quick Match</button>
        <span class="sep"></span><button type="button" data-a="join">${ICO.join}Join</button><button type="button" data-a="spec">${ICO.spec}Spectate</button>
        <span class="sep"></span><button type="button" data-a="rank">${ICO.rank}Rankings</button><button type="button" data-a="site" class="jsp-hm">${ICO.site}Fan site</button>
        <div class="jsp-ad" data-a="site" title="Visit The Frag Zone">${ICO.site}<span>THE FRAG ZONE<small>The No.1 JRT &amp; JAQUAKE fan site!</small></span></div>
      </div>
      <div class="jsp-filt"><label><input type="checkbox" data-f="empty" ${F.empty ? 'checked' : ''}>Hide empty</label><label><input type="checkbox" data-f="full" ${F.full ? 'checked' : ''}>Hide full</label><label>Game type <select data-f="mode"><option value="">Any</option><option value="dm" ${F.mode === 'dm' ? 'selected' : ''}>DeathMatch</option><option value="ctf" ${F.mode === 'ctf' ? 'selected' : ''}>Capture the Flag</option><option value="coop" ${F.mode === 'coop' ? 'selected' : ''}>Co-op</option></select></label></div>
      <div class="jsp-main"><div class="jsp-tree field"></div><div class="jsp-right"><div class="jsp-list field"><table><thead><tr><th data-s="name">Server</th><th data-s="ping">Ping</th><th data-s="n">Players</th><th data-s="map">Map</th><th data-s="mode">Mode</th><th data-s="game" class="jsp-hm">Game</th></tr></thead><tbody></tbody></table></div>
      <div class="jsp-bot"><div class="field jsp-pl"></div><div class="field jsp-ru"></div></div></div></div></div>`;
    const $ = s => body.querySelector(s);
    const st = t => { if (w.status) w.status.textContent = t; };
    const drawTree = () => {
      const count = gm => list.filter(g => gm === 'all' || g.game === gm).reduce((n, g) => n + g.n, 0);
      $('.jsp-tree').innerHTML = [['all', 'All games', ICO.site], ['jrt', GN.jrt, ICO.jrt()], ['jq', GN.jq, ICO.jq()]].map(([k, n, ic]) => `<div data-g="${k}" class="${tree === k ? 'on' : ''}">${ic.replace('<svg', '<svg width="16" height="16"')}<span>${esc(n)} (${count(k)})</span></div>`).join('')
        + OTHER.map(([n, why]) => `<div class="off" data-o="${esc(why)}">${ICO.off}<span>${esc(n)}</span></div>`).join('');
      $('.jsp-tree').querySelectorAll('[data-g]').forEach(d => d.addEventListener('click', () => { tree = d.dataset.g; store.set('jhp_spy_tree', tree); drawTree(); draw(); }));
      $('.jsp-tree').querySelectorAll('[data-o]').forEach(d => d.addEventListener('click', () => Desk.msgbox('JackSpy 3D', d.dataset.o, 'info')));
    };
    const rows = () => {
      const r = list.filter(g => (tree === 'all' || g.game === tree) && !g.lan && !(F.empty && !g.n) && !(F.full && g.n >= g.max) && !(F.mode && g.mode !== F.mode));
      const [k, d] = sort, key = g => k === 'ping' ? pingOf(g) : k === 'n' ? g.n * 100 + g.b : k === 'map' ? ((AR.MAPS[g.map] || {}).title || g.map) : g[k];
      return r.sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * d || (b.pub - a.pub); });
    };
    function draw() {
      const tb = $('.jsp-list tbody'); if (!tb) return;
      const R = rows();
      tb.innerHTML = R.map(g => { const p = pingOf(g); return `<tr data-id="${g.id}" class="${sel === g.id ? 'sel' : ''}"><td>${g.pub ? `<span class="pub">${esc(g.name)}</span>` : esc(g.name)}</td><td><span class="png" style="background:${pingCol(p)}"></span>${p}</td><td>${g.st === 'idle' ? `0/${g.max} (bots ready)` : `${g.n}/${g.max}${g.b ? ` +${g.b} bots` : ''}`}</td><td>${esc((AR.MAPS[g.map] || {}).title || g.map)}</td><td>${MODE[g.mode] || g.mode}</td><td class="jsp-hm">${GN[g.game] || ''}</td></tr>`; }).join('')
        + (F.empty || F.mode ? '' : FAKE.filter(f => tree === 'all' || tree === f[1]).map((f, i) => `<tr class="dead" data-fake="${i}"><td>${esc(f[0])}</td><td><span class="png" style="background:${pingCol(f[5])}"></span>${f[5]}</td><td>${f[4]}</td><td>${esc(f[2])}</td><td>${MODE[f[3]]}</td><td class="jsp-hm">${GN[f[1]]}</td></tr>`).join(''));
      if (!R.length && list.length) tb.insertAdjacentHTML('afterbegin', '<tr class="dead"><td colspan="6">Nothing matches your filters. Untick a box!</td></tr>');
      panels();
    }
    // selecting a row only restyles it (redrawing the rows would swallow a double-click)
    function select(id) { sel = id; body.querySelectorAll('.jsp-list tr[data-id]').forEach(tr => tr.classList.toggle('sel', +tr.dataset.id === id)); panels(); }
    function panels() {
      const g = list.find(x => x.id === sel);
      $('.jsp-pl').innerHTML = g ? `<h4>Players (${g.n}${g.b ? ` + ${g.b} bots` : ''})</h4>${g.st === 'idle' ? '<p style="margin:0">Nobody on yet. Join and bots start a match with you straight away!</p>' : (g.players || []).map(n => `<div>${esc(n)}</div>`).join('')}` : '<h4>Players</h4><p style="margin:0;color:#606060">Click a server to see who\'s on it.</p>';
      $('.jsp-ru').innerHTML = g ? `<h4>Server rules</h4><table><tr><td>Game</td><td>${GN[g.game]}</td></tr><tr><td>Mode</td><td>${MODE[g.mode] || g.mode}</td></tr>${g.mode === 'dm' ? `<tr><td>Frag limit</td><td>${g.fl}</td></tr>` : ''}<tr><td>Time limit</td><td>${g.tl ? g.tl + ' min' : 'none'}</td></tr>${g.left > 0 ? `<tr><td>Time left</td><td>${Math.floor(g.left / 60)}:${String(g.left % 60).padStart(2, '0')}</td></tr>` : ''}<tr><td>Map rotation</td><td>${(g.rot || []).map(m => esc((AR.MAPS[m] || {}).title || m)).join(', ')}</td></tr><tr><td>Host</td><td>${g.pub ? 'JackNet (24/7)' : esc(g.host)}</td></tr></table>` : '<h4>Server rules</h4>';
      body.querySelectorAll('th[data-s]').forEach(th => { th.textContent = th.textContent.replace(/ [\u25b2\u25bc]$/, '') + (sort[0] === th.dataset.s ? (sort[1] > 0 ? ' \u25b2' : ' \u25bc') : ''); });
      const pl = list.reduce((n, g) => n + g.n, 0);
      st(`${list.length} servers, ${pl} player${pl === 1 ? '' : 's'} online${rtt ? ` - your ping ${rtt} ms` : ''} - JackSpy 3D v2.10 (unregistered)`);
    }
    function refresh() {
      if (!window.Net || !Net.connected) { st('Not connected to JackNet. Is the modem plugged in?'); return; }
      refreshing = true; st('Querying the master server...'); ping(); Net.send({ t: 'arList' });
    }
    function doJoin(spec) {
      const g = list.find(x => x.id === sel);
      if (!g) { Desk.msgbox('JackSpy 3D', 'Pick a server first. (Click one in the list. Double-click joins it.)', 'info'); return; }
      st(`Launching ${GN[g.game]}...`); joinGame(g, spec);
    }
    // (one listener on the table body: the rows are redrawn on every click, so a double-click still lands)
    const tbody = $('.jsp-list tbody');
    tbody.addEventListener('click', ev => { const tr = ev.target.closest('tr'); if (!tr) return; if (tr.dataset.id) select(+tr.dataset.id); else if (tr.dataset.fake) st(['Connection timed out. (Somebody picked up the phone.)', 'Server is full. It has been full since August.', 'His Mom switched it off at 10pm.', 'Version mismatch. Callum says "update your drivers".'][+tr.dataset.fake % 4]); });
    tbody.addEventListener('dblclick', ev => { const tr = ev.target.closest('tr[data-id]'); if (!tr) return; select(+tr.dataset.id); doJoin(false); });
    const on = (k, m) => { if (w.closed) { subs.delete(on); return; } if (k === 'list') { list = m.games || []; refreshing = false; drawTree(); draw(); Apps.secret('fps.spy'); } else if (k === 'ping') draw(); };
    subs.add(on);
    body.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.a;
      if (a === 'refresh') refresh(); else if (a === 'join') doJoin(false); else if (a === 'spec') doJoin(true);
      else if (a === 'quick') quickGame(tree === 'jq' ? 'jq' : 'jrt', F.mode);
      else if (a === 'rank') rankWin();
      else if (a === 'site') { document.getElementById('browser').classList.remove('min'); IE.navigate('http://www.fragzone.jnet/'); }
    }));
    body.querySelectorAll('[data-f]').forEach(el => el.addEventListener('change', () => { F[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value; store.set('jhp_spy_f', F); draw(); }));
    body.querySelectorAll('th[data-s]').forEach(th => th.addEventListener('click', () => { sort = [th.dataset.s, sort[0] === th.dataset.s ? -sort[1] : 1]; store.set('jhp_spy_sort', sort); draw(); }));
    if (w.menubar) Apps.menubar(w, [
      ['File', [{ label: 'Refresh', key: 'F5', act: refresh }, { label: 'Quick Match', act: () => quickGame(tree === 'jq' ? 'jq' : 'jrt', F.mode) }, '-', { label: 'Exit', act: () => w.close() }]],
      ['Server', () => [{ label: 'Join', act: () => doJoin(false), dis: sel == null }, { label: 'Spectate', act: () => doJoin(true), dis: sel == null }]],
      ['View', () => [{ label: 'Hide empty servers', chk: F.empty, act: () => { F.empty = !F.empty; store.set('jhp_spy_f', F); body.querySelector('[data-f=empty]').checked = F.empty; draw(); } }, { label: 'Hide full servers', chk: F.full, act: () => { F.full = !F.full; store.set('jhp_spy_f', F); body.querySelector('[data-f=full]').checked = F.full; draw(); } }, '-', { label: 'Rankings', act: rankWin }]],
      ['Help', [{ label: 'Read Me', act: () => { const n = Apps.fs.get('C:/Program Files/JackSpy 3D/README.TXT'); if (n) Apps.openFile(n); } }, { label: 'Register JackSpy 3D...', act: () => Desk.msgbox('Register JackSpy 3D', 'Registering costs £14.99 by postal order to JackSpy Industries, PO Box 3D.\n\nYou get: a warm feeling, a sticker, and the nag message stops. (There is no nag message. We forgot to write one.)\n\nPlease ask a grown-up before posting money.', 'info') }, '-', { label: 'About JackSpy 3D', act: () => Desk.msgbox('About JackSpy 3D', 'JackSpy 3D v2.10\n(c) 1999 JackSpy Industries\n\nFinds Jackreal Tournament and JAQUAKE games on JackNet.\n\nThis copy is UNREGISTERED. Day 1 of 30. It is always day 1.', 'info') }]],
    ]);
    drawTree(); draw(); refresh();
    timer = setInterval(() => { if (w.closed) { clearInterval(timer); subs.delete(on); return; } if (!document.hidden && !refreshing) refresh(); }, 15000);
    if (arg === 'quick') quickGame('jrt');
  }
  // the rankings in a JackOS 98 window
  function rankWin() {
    const b = document.createElement('div'); b.style.cssText = 'padding:6px;font:11px Tahoma;background:#c0c0c0;height:100%;overflow:auto;box-sizing:border-box';
    const w = Apps.win('JackNet Frag Rankings', b, { w: Math.min(560, innerWidth - 10), h: Math.min(440, innerHeight - 60), icon: ICO.rank.replace('22 22', '22 22'), noMax: true });
    let game = 'jrt', tab = 'wk', data = null;
    const paint = () => {
      const rows = !data ? [] : tab === 'prev' ? (data.prev ? data.prev[game] || [] : []) : (data[tab] || {})[game] || [];
      b.innerHTML = `<div class="tabs" style="display:flex;gap:2px;margin-bottom:4px">${[['jrt', GN.jrt], ['jq', GN.jq]].map(([k, n]) => `<button type="button" class="btn" data-gm="${k}" style="${game === k ? 'font-weight:bold' : ''}">${n}</button>`).join('')}<span style="flex:1"></span>${[['wk', 'This week'], ['all', 'All time'], ['prev', 'Last week']].map(([k, n]) => `<button type="button" class="btn" data-tb="${k}" style="${tab === k ? 'font-weight:bold' : ''}">${n}</button>`).join('')}</div>
        <div class="field" style="padding:4px;min-height:200px">${!data ? 'Asking the master server...' : rows.length ? `<table style="width:100%;border-collapse:collapse"><tr style="background:#000080;color:#fff"><th>#</th><th style="text-align:left">Name</th><th>Frags</th><th>Deaths</th><th>Wins</th><th>Matches</th><th>Best spree</th></tr>${rows.map((r, i) => `<tr style="${i % 2 ? 'background:#eef' : ''}"><td style="text-align:center">${i + 1}</td><td>${window.Grind && Grind.badge ? Grind.badge(Grind.rankOf(r[0])) + ' ' : ''}${esc(r[0])}</td><td style="text-align:center">${r[1]}</td><td style="text-align:center">${r[2]}</td><td style="text-align:center">${r[3]}</td><td style="text-align:center">${r[4]}</td><td style="text-align:center">${r[5]}</td></tr>`).join('')}</table>` : '<p>Nobody on the board yet. Get fragging!</p>'}</div>
        <p style="margin:4px 0 0">Frags on JackNet servers (bots count). Members only: join JackNet for FREE to get on the board. The weekly table starts again every Monday.</p>`;
      b.querySelectorAll('[data-gm]').forEach(x => x.addEventListener('click', () => { game = x.dataset.gm; paint(); }));
      b.querySelectorAll('[data-tb]').forEach(x => x.addEventListener('click', () => { tab = x.dataset.tb; paint(); }));
    };
    const on = (k, m) => { if (w.closed) { subs.delete(on); return; } if (k === 'top') { data = m; paint(); } };
    subs.add(on); paint();
    if (window.Net && Net.connected) Net.send({ t: 'arTop' }); else b.innerHTML = '<p>Not connected to JackNet.</p>';
    return w;
  }

  // ================================================================ The Frag Zone (www.fragzone.jnet)
  const NEWS = [
    ['19/10/99', 'JackNet 24/7 servers are UP!', 'JackNet have put up FIVE servers that never go off: JRT Deathmatch, JRT Capture the Flag, Newbies Only (the bots go easy, perfect for your little brother), JAQUAKE Deathmatch and JAQUAKE Co-op. If nobody\'s on, bots play with you till somebody turns up. Press PLAY ONLINE NOW in the game, or use JackSpy 3D.'],
    ['12/10/99', 'JAQUAKE 1.06 adds deathmatch!', 'Jackware have sneaked JackNet deathmatch into the 1.06 shareware. Two maps (The Rusty Pit and Jackstone Cloisters) and CO-OP against six waves of tin robots. Rocket jumping works online. Of course it does.'],
    ['28/09/99', 'JRT demo is out!', 'The Jackreal Tournament demo is out on JackNet: Space Station Jack (low gravity!) and Coax Foundry. 22 MB though, so start the download before tea. The full game is out on 22 November.'],
    ['15/09/99', 'Callum\'s LAN party report', 'Eight PCs, three tables, one extension lead (don\'t tell Jack\'s Mom). Callum won every match. Dave fell off Space Station Jack 31 times. Luke asked if it was on the N64. It is not on the N64.'],
  ];
  const CLANS = [['[JKN] Jackanory', 'Story time is frag time.'], ['=FrAgZ=', 'Always full. Always fragging. Always in bed by 10.'], ['{RUST}', 'JAQUAKE clan. We love the Boomstick.'], ['<DAVE>', 'Dave\'s clan. Dave is the only member. Dave is very good at falling off things.']];
  function fan(el) {
    Apps.secret('fps.fanzone');
    let data = null, list = [], game = 'jrt', tab = 'wk';
    el.className = 'fz';
    const hits = 14000 + Math.floor((Date.now() / 86400000) % 1000) * 7;
    el.innerHTML = `<h1>THE <span>FRAG</span> ZONE</h1><div class="tag">&gt;&gt; The No.1 Jackreal Tournament &amp; JAQUAKE fan site on JackNet &lt;&lt;</div>
      <div class="mq"><span>*** JACKNET 24/7 SERVERS ARE UP - PRESS PLAY ONLINE NOW IN THE GAME *** JRT FULL VERSION OUT 22 NOVEMBER *** JAQUAKE 1.06: DEATHMATCH AND CO-OP *** CALLUM STILL UNDEFEATED (HE SAYS) ***</span></div>
      <div class="nav"><a href="#" data-n="servers">Servers</a><a href="#" data-n="rankings">Rankings</a><a href="#" data-n="news">News</a><a href="#" data-n="clans">Clans</a><a href="#" data-n="files">Downloads</a></div>
      <div class="cols"><div>
        <div class="box" id="fz-servers"><h2>LIVE! JACKNET 24/7 SERVERS</h2><div class="in"><div class="sv">Asking the master server...</div></div></div>
        <div class="box" id="fz-news"><h2>NEWS</h2><div class="in">${NEWS.map(([d, t, x], i) => `<p><b style="color:#ffd000">${i === 0 ? '<span class="new">NEW!</span>' : ''}${esc(d)} - ${esc(t)}</b><br>${esc(x)}</p>`).join('')}</div></div>
        <div class="box" id="fz-clans"><h2>CLANS</h2><div class="in"><table>${CLANS.map(([n, x]) => `<tr><td style="color:#9f9;white-space:nowrap">${esc(n)}</td><td>${esc(x)}</td></tr>`).join('')}</table><p style="font-size:11px">Want your clan here? Email the webmaster. (Clan names must be nice. Mom checks.)</p></div></div>
      </div><div>
        <div class="box" id="fz-rankings"><h2>FRAG RANKINGS</h2><div class="in"><div class="tabs"><a data-gm="jrt" class="on">JRT</a><a data-gm="jq">JAQUAKE</a> | <a data-tb="wk" class="on">This week</a><a data-tb="all">All time</a><a data-tb="prev">Last week</a></div><div class="rk">Loading...</div><p style="font-size:11px;color:#aaa">JackNet members only. Join JackNet for FREE to get on the board!</p></div></div>
        <div class="box" id="fz-files"><h2>DOWNLOADS</h2><div class="in"><p><a href="#" data-dl="pcgames.spy">JackSpy 3D v2.10</a> (1.4 MB)<br><small>Finds every game on JackNet. Essential!</small></p><p><a href="#" data-dl="pcgames.jrt">Jackreal Tournament ${window.PCGStub && PCGStub.jrtFull() ? '(full version)' : 'DEMO'}</a><br><small>Space Station Jack + Coax Foundry${window.PCGStub && PCGStub.jrtFull() ? ' + Castle Jackstone + Coax Canyon' : ''}.</small></p><p><a href="#" data-dl="pcgames.jaquake">JAQUAKE 1.06 shareware</a><br><small>Now with JackNet deathmatch and co-op.</small></p><p><span class="uc"><b>!</b> MAP PACK UNDER CONSTRUCTION <b>!</b></span></p></div></div>
        <div class="box"><h2>TOP TIPS</h2><div class="in" style="font-size:12px"><p>* Dodge in JRT: press a direction key twice, quickly. Callum does it ALL the time.</p><p>* Rocket jump in JAQUAKE: look down, jump, fire. Ouch, but WHEEE.</p><p>* Tabbed out for your tea? The server keeps your place for two minutes.</p><p>* Be nice in chat. The Frag Zone is a no-flaming zone.</p></div></div>
      </div></div>
      <div class="foot">You are visitor number <span class="ctr">${String(hits).padStart(6, '0')}</span><br>Best viewed in JackNet Explorer 5 at 800x600. Webmaster: RocketRob99. Not an official site. Jackreal Tournament and JAQUAKE belong to the people who made them (Jack, mostly).</div>`;
    const $ = s => el.querySelector(s);
    const drawSv = () => {
      const sv = list.filter(g => g.pub);
      $('.sv').innerHTML = sv.length ? `<table><tr><th>Server</th><th>Map</th><th>Players</th><th></th></tr>${sv.map(g => `<tr><td style="color:${g.game === 'jq' ? '#ffa060' : '#9f9'}">${esc(g.name)}</td><td>${esc((AR.MAPS[g.map] || {}).title || g.map)}</td><td>${g.st === 'idle' ? '0 (bots ready)' : `${g.n}${g.b ? ` +${g.b} bots` : ''}`}</td><td><button type="button" class="join" data-j="${g.id}">JOIN!</button></td></tr>`).join('')}</table><p style="font-size:11px;margin:6px 0 0">${list.filter(g => !g.pub && !g.lan).length} more games hosted by players. Get <a href="#" data-spy>JackSpy 3D</a> to see them all.</p>`
        : (window.Net && Net.connected ? 'Asking the master server...' : 'The master server is not answering. (Is your modem plugged in?)');
      $('.sv').querySelectorAll('[data-j]').forEach(b => b.addEventListener('click', () => { const g = list.find(x => x.id === +b.dataset.j); if (g) joinGame(g, false); }));
      const sp = $('.sv [data-spy]'); if (sp) sp.addEventListener('click', ev => { ev.preventDefault(); Apps.open('pcgames.spy'); });
    };
    const drawRk = () => {
      const rows = !data ? null : tab === 'prev' ? (data.prev ? data.prev[game] || [] : []) : (data[tab] || {})[game] || [];
      $('.rk').innerHTML = !rows ? 'Loading...' : rows.length ? `<table><tr><th>#</th><th>Name</th><th>Frags</th><th>Wins</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td style="${i === 0 ? 'color:#ff0;font-weight:bold' : ''}">${window.Grind && Grind.badge ? Grind.badge(Grind.rankOf(r[0])) + ' ' : ''}${esc(r[0])}</td><td>${r[1]}</td><td>${r[3]}</td></tr>`).join('')}</table>` : '<p>Nobody yet. Be the first!</p>';
      el.querySelectorAll('.tabs [data-gm]').forEach(a => a.classList.toggle('on', a.dataset.gm === game));
      el.querySelectorAll('.tabs [data-tb]').forEach(a => a.classList.toggle('on', a.dataset.tb === tab));
    };
    el.querySelectorAll('.tabs [data-gm]').forEach(a => a.addEventListener('click', () => { game = a.dataset.gm; drawRk(); }));
    el.querySelectorAll('.tabs [data-tb]').forEach(a => a.addEventListener('click', () => { tab = a.dataset.tb; drawRk(); }));
    el.querySelectorAll('[data-n]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const t = el.querySelector('#fz-' + a.dataset.n); if (t) t.scrollIntoView({ block: 'start' }); }));
    el.querySelectorAll('[data-dl]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const id = a.dataset.dl; if (window.Setup && Setup.has && Setup.has(id)) { Desk.msgbox('The Frag Zone', 'You\'ve already got that one! Look in Start > Programs.', 'info'); return; } if (window.Setup && Setup.download) Setup.download(id); }));
    const on = (k, m) => { if (!el.isConnected && el._seen) { subs.delete(on); return; } el._seen = true; if (k === 'list') { list = m.games || []; drawSv(); } else if (k === 'top') { data = m; drawRk(); } };
    subs.add(on);
    drawSv(); drawRk();
    const ask = () => { if (window.Net && Net.connected) { Net.send({ t: 'arList' }); Net.send({ t: 'arTop' }); } };
    setTimeout(ask, 50);
    const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); subs.delete(on); return; } if (!document.hidden && window.Net && Net.connected) Net.send({ t: 'arList' }); }, 20000);
  }
  window.PCGSpy = { app, fan, rankWin };
})();
