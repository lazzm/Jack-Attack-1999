/* zone-core.js: the JackNet Gaming Zone's live data (who's where, ladder, profiles, chat), the game client window and the wire protocol. Lazy-loaded by apps-zone.js
 * after zone-games.js. One client per game (the host) is authoritative; every move is validated on both sides,
 * every message carries the game id and a sequence number, and the full (small) state is sent after each move so a
 * mismatch simply resyncs. Nothing arriving over the relay is trusted without checking its shape first. */
(function () {
  'use strict';
  const Z = window.Zone, GM = Z.GAMES, U = Z.util, esc = Apps.esc, store = Apps.store, sfx = Z.sfx, secret = Z.secret;
  const now = () => performance.now();
  const isInt = U.isInt, okId = Z.okId;
  const phone = () => innerWidth < 640;
  const meId = () => Net.me.id, meNick = () => Net.me.nick || 'Me';
  const cleanText = (t, n) => String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, n || 200).trim();
  const RUDE = /\b(bloody|crap|bugger|sod(ding)?|git|wanker|bastard|arse(hole)?|damn|hell|shit|fuck\w*|piss\w*)\b/gi;
  const nanny = t => t.replace(RUDE, m => '*'.repeat(m.length));
  const fieldOf = nick => (String(nick || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '_').slice(0, 24) || 'x');
  const TURN_S = 45;
  const LADDER_K = 'zone.wins';
  const LIVE_K = 'jhp_zone_live';

  // ================================================================ status (what everybody sees on the Zone web site)
  const my = Z.my = { where: 'away', g: '', lv: 0, t: -1, gid: '', opp: '', hid: 0, host: false };
  const peers = Z.peers = new Map(); // id -> status
  const bus = new Set(); let busT = 0;
  Z.onChange = fn => { bus.add(fn); return () => bus.delete(fn); };
  const changed = Z.changed = () => { if (busT) return; busT = setTimeout(() => { busT = 0; bus.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }, 60); };
  const okStatus = s => s && typeof s === 'object' && /^(lobby|away|seat|game|watch)$/.test(s.where) && (s.g === '' || Z.META[s.g]) && isInt(s.lv, 0, 2) && isInt(s.t, -1, 3) && (s.gid === '' || okId(s.gid)) && typeof s.opp === 'string' && s.opp.length <= 24 && isInt(s.hid, 0, 1e9) && typeof s.host === 'boolean';
  const pub = () => ({ where: my.where, g: my.g, lv: my.lv, t: my.t, gid: my.gid, opp: my.opp, hid: my.hid, host: my.host });
  function setStatus(o) { Object.assign(my, o); Z.relay(0, 'zone.lob', { k: 'st', s: pub() }); changed(); }
  Z.setStatus = setStatus;
  Z.busy = () => my.where === 'game';
  const idle = () => (Z.onSite ? 'lobby' : 'away');
  Z.onOnline(list => {
    for (const id of [...peers.keys()]) if (!list.some(o => o.id === id)) peers.delete(id);
    changed();
    if (Z.current) Z.current.presence(list);
  });
  // our own connection came back (same id, see server.js): catch up with the board straight away
  Net.on('welcome', () => setTimeout(() => { const c = Z.current; if (c && !c.closed && !c.done && c.online) c.resync(); }, 700));
  Net.onRelay('zone.lob', (d, m) => {
    if (!d || typeof d !== 'object' || !m || !m.fromId || m.fromId === meId()) return;
    if (d.k === 'st') { if (okStatus(d.s)) { peers.set(m.fromId, d.s); changed(); if (my.where === 'seat') seatCheck(); } return; }
    if (d.k === 'who') { if (my.where !== 'away') Z.relay(m.fromId, 'zone.lob', { k: 'st', s: pub() }); }
  });
  Net.on('_open', () => { peers.clear(); if (my.where !== 'away') setTimeout(() => { setStatus({}); Z.relay(0, 'zone.lob', { k: 'who' }); }, 800); });
  // two people seated at the same table: the lower id hosts
  function seatCheck() {
    if (my.where !== 'seat') return;
    for (const [id, s] of peers) if (s.where === 'seat' && s.g === my.g && s.lv === my.lv && s.t === my.t && Z.isOnline(id)) {
      if (meId() < id) startHosted(id, Z.nickOf(id) || 'Guest', my.g, my.lv, { t: my.t });
      return;
    }
  }
  Z.everyone = () => { const list = [[meId(), pub(), meNick()]]; for (const [id, s] of peers) if (Z.isOnline(id)) list.push([id, s, Z.nickOf(id)]); return list; };
  Z.statusText = s => s.where === 'game' ? `playing ${Z.META[s.g].name} v ${s.opp}` : s.where === 'seat' ? `waiting at a ${Z.META[s.g].name} table` : s.where === 'watch' ? `watching ${Z.META[s.g].name}` : s.where === 'lobby' ? 'in the Zone' : 'somewhere on JackNet';
  Z.sit = (g, lv, t) => {
    if (my.where === 'game') { Desk.toast('JackNet Zone', 'Finish your current game first!', 3000); return false; }
    if (!Net.connected) { Desk.toast('JackNet Zone', 'You are not connected to JackNet. (Is somebody on the phone?)', 3500); return false; }
    setStatus({ where: 'seat', g, lv, t, gid: '', opp: '', hid: 0, host: false });
    seatCheck(); sfx('click'); return true;
  };
  Z.stand = () => { if (my.where === 'seat') setStatus({ where: idle(), t: -1 }); };
  Z.watch = (hid, gid, g, lv) => {
    if (!Z.isOnline(hid)) { Desk.toast('JackNet Zone', 'That game seems to have finished.', 3000); return; }
    openMatch({ mode: 'watch', g, lv, gid, peerId: hid, names: ['?', '?'] });
  };
  // the web site calls these as you arrive and leave
  Z.enterSite = () => { const first = !Z.onSite; Z.onSite = true; if (my.where === 'away') setStatus({ where: 'lobby' }); if (first) { Z.relay(0, 'zone.lob', { k: 'who' }); loadShared(); } };
  Z.leaveSite = () => { Z.onSite = false; if (my.where === 'lobby' || my.where === 'seat') setStatus({ where: 'away', t: -1 }); };

  // ================================================================ shared tables: ladder ("wins:losses:rating:Nick"), profiles, rating history, taglines
  // profiles: "since;w.l,w.l,... (one per game in Zone ORDER);Nick"   history: "1200,1216,..."   tags: "avatar|tagline"
  const ladder = Z.ladder = { rows: {}, prof: {}, hist: {}, tag: {}, loaded: false };
  const KEYS = { [LADDER_K]: 'rows', 'zone.prof': 'prof', 'zone.hist': 'hist', 'zone.tag': 'tag' };
  const parseRow = Z.parseRow = v => { const m = /^(\d{1,6}):(\d{1,6}):(\d{1,4})(?::(.{1,24}))?$/.exec(String(v || '')); return m ? { w: +m[1], l: +m[2], r: Math.min(3000, +m[3]), nm: m[4] || '' } : null; };
  Z.parseProf = v => { const m = /^([0-9/]{0,10});([0-9.,]{0,90});(.{0,24})$/.exec(String(v || '')); if (!m) return null; const games = {}; m[2].split(',').forEach((x, i) => { const [w, l] = x.split('.').map(n => Math.min(99999, +n || 0)); if (Z.ORDER[i]) games[Z.ORDER[i]] = { w: w || 0, l: l || 0 }; }); return { since: m[1], games, nm: m[3] }; };
  Z.parseHist = v => String(v || '').split(',').map(Number).filter(n => n >= 100 && n <= 3000).slice(-30);
  Z.parseTag = v => { const m = /^(\d{1,2})\|(.{0,100})$/.exec(String(v || '')); return m ? { av: Math.min(15, +m[1]), text: m[2] } : null; };
  let sharedP = null;
  function loadShared() {
    return sharedP = sharedP || Net.kv.get(Object.keys(KEYS)).then(v => {
      for (const k of Object.keys(KEYS)) { const o = v && v[k]; ladder[KEYS[k]] = (o && typeof o === 'object' && !Array.isArray(o)) ? o : {}; }
      ladder.loaded = !!(v && Object.keys(v).length); if (!ladder.loaded) sharedP = null; changed(); return ladder;
    });
  }
  Z.loadShared = loadShared;
  Object.keys(KEYS).forEach(k => Net.kv.watch(k, ev => { if (ev.type !== 'put') return; const t = ladder[KEYS[k]]; if (ev.v === '') delete t[ev.f]; else t[ev.f] = ev.v; changed(); }));
  const ratingOf = Z.ratingOf = nick => { const r = parseRow(ladder.rows[fieldOf(nick)]); return r ? r.r : 1200; };
  Z.fieldOf = fieldOf;
  function recordResult(nick, won, oppNick, draw, g) {
    const f = fieldOf(nick), cur = parseRow(ladder.rows[f]) || { w: 0, l: 0, r: 1200 }, or = ratingOf(oppNick);
    const exp = 1 / (1 + Math.pow(10, (or - cur.r) / 400)), sc = draw ? 0.5 : won ? 1 : 0;
    const nr = Math.max(100, Math.min(3000, Math.round(cur.r + 32 * (sc - exp))));
    const nm = String(nick).replace(/[:;|,]/g, '').slice(0, 24);
    const row = `${cur.w + (won && !draw ? 1 : 0)}:${cur.l + (!won && !draw ? 1 : 0)}:${nr}:${nm}`;
    ladder.rows[f] = row; Net.kv.put(LADDER_K, f, row);
    // the per-game profile and the rating history
    const p = Z.parseProf(ladder.prof[f]) || { since: Desk.today99 ? (() => { const t = Desk.today99(); return `${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}/99`; })() : '01/01/99', games: {} };
    if (g && Z.META[g] && !draw) { const x = p.games[g] = p.games[g] || { w: 0, l: 0 }; if (won) x.w++; else x.l++; }
    const prow = `${p.since};${Z.ORDER.map(x => { const e = p.games[x] || { w: 0, l: 0 }; return e.w + '.' + e.l; }).join(',')};${nm}`;
    ladder.prof[f] = prow; Net.kv.put('zone.prof', f, prow);
    const h = Z.parseHist(ladder.hist[f]); if (!h.length) h.push(cur.r); h.push(nr);
    let hs = h.slice(-22).join(','); while (hs.length > 118) hs = hs.slice(hs.indexOf(',') + 1);
    ladder.hist[f] = hs; Net.kv.put('zone.hist', f, hs);
    changed();
    return nr - cur.r;
  }
  Z.ladderList = () => Object.keys(ladder.rows).map(f => ({ f, ...parseRow(ladder.rows[f]) })).filter(x => x.r).sort((a, b) => b.r - a.r || b.w - a.w);

  // ================================================================ lobby chat: a shared list (last 40 lines), live for everyone
  const chat = Z.chat = { list: [], loaded: false, last: 0 };
  Net.kv.get(['zone.chat']).then(v => { const l = v && v['zone.chat']; if (Array.isArray(l)) chat.list = l.slice(-40); chat.loaded = true; changed(); });
  Net.kv.watch('zone.chat', ev => { if (ev.type === 'push' && ev.e) { chat.list.push(ev.e); if (chat.list.length > 40) chat.list.shift(); if (Z.onSite && Z.opts.chatSnd && ev.e.by !== meNick()) sfx('beep'); changed(); } });
  chat.say = text => {
    text = cleanText(text, 200); if (!text) return 'empty';
    if (now() - chat.last < 5200) return 'slow';
    if (!Net.kv.push('zone.chat', text)) return 'offline';
    chat.last = now();
    if (/brb,? mom/i.test(text)) secret('zone.mom');
    const n = (store.get('jhp_zone_chatty', 0) | 0) + 1; store.set('jhp_zone_chatty', n); if (n >= 20) secret('zone.chatty');
    return 'ok';
  };
  Z.nanny = nanny;
  Z.rulesText = g => { const names = { reversi: 'REVERSI.TXT', checkers: 'CHECKERS.TXT', c4: 'CONNECT4.TXT', ships: 'BATTLESH.TXT', ttt: 'NOUGHTS.TXT', gomoku: 'NOUGHTS.TXT', dots: 'DOTS.TXT', bg: 'BACKGAMM.TXT', pong: 'SABRPONG.TXT' }; const f = names[g] && Apps.fs.find(names[g]); return f ? f.text : (g === 'chess' ? 'ZONE CHESS\n==========\n\nProper chess. White moves first. Click a piece, then click where it goes.\nCheck, checkmate, castling, en passant and pawn promotion all work.\n\nThe Pawn Shop is for beginners, The Knight Club for regulars, and\nDeep Jack\'s Den is for people who like losing to a computer.\n\nBe a good sport: say "good game" at the end. Even if you lost.' : ''); };
  function rulesFor(g) { Z.goSite('/games/' + g + '.html'); }

  // ================================================================ starting games
  const played = store.get('jhp_zone_played', {});
  function playCpu(g, lv) {
    if (Z.current && Z.current.online && !Z.current.done) return Desk.msgbox('JackNet Zone', 'Finish your online game first!', 'info');
    openMatch({ mode: 'cpu', g, lv, gid: Z.rid(), names: null, me: Math.random() < 0.5 ? 0 : 1 });
  }
  function startHosted(peerId, peerNick, g, lv, how) {
    if (Z.current && Z.current.online && !Z.current.done) return;
    const gid = Z.rid();
    openMatch({ mode: 'host', g, lv, gid, peerId, peerNick, me: Math.random() < 0.5 ? 0 : 1, t: how.t });
  }
  // the guest side: a 'start' arrives from a host we invited / accepted / sat opposite
  Net.onRelay('zone.g', (d, m) => {
    if (!d || typeof d !== 'object' || !m || !m.fromId || m.fromId === meId() || !okId(d.gid)) return;
    if (d.k === 'start') {
      if (!Z.META[d.g] || !isInt(d.lv, 0, 2) || !(d.you === 0 || d.you === 1) || !GM[d.g].check(d.st)) return;
      const acc = Z.INV.accepted.get(m.fromId), seated = my.where === 'seat' && my.g === d.g && my.lv === d.lv && (d.t == null || d.t === my.t);
      const rematch = Z.current && Z.current.online && Z.current.done && Z.current.peerId === m.fromId && Z.current.wantRematch;
      if (!acc && !seated && !rematch) return;
      if (Z.current && Z.current.online && !Z.current.done) return;
      Z.INV.accepted.delete(m.fromId);
      openMatch({ mode: 'guest', g: d.g, lv: d.lv, gid: d.gid, peerId: m.fromId, peerNick: String(m.from || 'Host').slice(0, 24), me: d.you, st: d.st, n: d.n | 0, t: d.t });
      return;
    }
    if (Z.current && !Z.current.closed) Z.current.recv(d, m);
  });

  // ================================================================ a match: one game window, any mode
  function openMatch(o) {
    if (Z.current && !Z.current.closed) { Z.current.close(true); }
    const M = new Match(o); Z.current = M; return M;
  }
  class Match {
    constructor(o) {
      const G = this.G = GM[o.g]; this.g = o.g; this.lv = o.lv; this.mode = o.mode; this.gid = o.gid; this.peerId = o.peerId || 0; this.t = o.t;
      this.online = o.mode !== 'cpu'; this.rt = !!G.rt; this.done = false; this.closed = false; this.specs = new Set(); this.priv = (o.resume && o.priv) || {}; this.last = null; this.n = 0;
      this.me = o.mode === 'watch' ? -1 : o.me; this.cpuLv = o.lv; this.mem = {};
      this.names = o.mode === 'cpu' ? (this.me === 0 ? [meNick(), Z.CPU[o.lv]] : [Z.CPU[o.lv], meNick()]) : o.mode === 'watch' ? ['?', '?'] : (this.me === 0 ? [meNick(), o.peerNick] : [o.peerNick, meNick()]);
      this.hints = Z.opts.hints; this.chat = []; this.wantRematch = false; this.draws = 0; this.series = 0; this.dots = 0;
      this.ratings = [ratingOf(this.names[0]), ratingOf(this.names[1])];
      if (this.rt) this.sim = G.pong.newSim(); else this.st = o.st || G.init(Math.random);
      if (o.n) this.n = o.n;
      this.makeWindow();
      if (this.mode === 'watch') { Z.relay(this.peerId, 'zone.g', { k: 'watch', gid: this.gid }); setStatus({ where: 'watch', g: this.g, lv: this.lv, gid: this.gid, hid: this.peerId, opp: '', host: false }); this.setStatusText('Connecting to the game...'); secret('zone.spectate'); }
      else {
        if (this.online) setStatus({ where: 'game', g: this.g, lv: this.lv, gid: this.gid, opp: this.names[1 - this.me], hid: this.mode === 'host' ? meId() : this.peerId, host: this.mode === 'host', t: this.t == null ? -1 : this.t });
        if (this.mode === 'host' && !o.resume) { this.send({ k: 'start', gid: this.gid, g: this.g, lv: this.lv, you: 1 - this.me, st: this.rt ? null : this.st, n: this.n, t: this.t == null ? undefined : this.t }); Net.kv.inc('zone.played'); }
        played[this.g] = 1; store.set('jhp_zone_played', played); if (Z.ORDER.every(g => played[g])) secret('zone.allgames');
      }
      this.begin();
      if (o.resume) { this.logLine('Welcome back! Picking up where you left off...', 'sys'); setTimeout(() => this.resync(), 400); }
    }
    // ---------------- window
    makeWindow() {
      const G = this.G, body = document.createElement('div'); body.className = 'zg';
      body.innerHTML = `<div class="zg-top"><div class="zg-pl p0"><span class="zg-sw"></span><b></b><small></small><div class="zg-tm"><i></i></div></div><div class="zg-mid"><span class="zg-vs">v</span><span class="zg-mv"></span></div><div class="zg-pl p1"><span class="zg-sw"></span><b></b><small></small><div class="zg-tm"><i></i></div></div></div>
        <div class="zg-cv"><canvas></canvas><div class="zg-over" hidden></div></div>
        <div class="zg-tools row"></div>
        <div class="zg-chat"><div class="zg-log field"></div><div class="zg-chatrow"><select class="zg-quick" aria-label="Quick chat"><option value="">Quick chat...</option>${Z.QUICK.map(q => `<option>${esc(q)}</option>`).join('')}</select><input type="text" class="zg-in" maxlength="160" placeholder="Chat" aria-label="Chat"><button class="btn zg-send">Send</button></div></div>`;
      const title = `${G.name} - ${this.mode === 'watch' ? 'Watching' : 'v ' + this.names[1 - this.me]} - JackNet Zone`;
      this.title = title;
      const w = this.w = Apps.win(title, body, { cls: 'zgwin gamewin', w: Math.min(innerWidth - 8, G.aspect >= 1.3 ? 760 : 540), h: Math.min(innerHeight - 40, G.aspect >= 1.3 ? 600 : 690), icon: Z.ICON[this.g], menubar: true, status: true, minW: 300, minH: 360, onClose: () => this.onClose() });
      if (phone()) w.el.classList.add('maxwin');
      this.$ = s => body.querySelector(s);
      this.cv = this.$('canvas'); this.cv.tabIndex = 0; this.cv.setAttribute('aria-label', G.name + ' board'); this.ctx = this.cv.getContext('2d');
      Apps.menubar(w, [
        ['Game', () => [
          { label: 'Resign', dis: this.me < 0 || this.done, act: () => this.askResign() },
          { label: this.rt ? 'Offer a draw' : 'Offer a draw', dis: this.me < 0 || this.done || this.rt, act: () => this.offerDraw() },
          { label: 'Rematch', dis: !this.done || this.me < 0, act: () => this.askRematch() }, '-',
          { label: 'Play the computer instead', dis: this.mode === 'cpu', act: () => { this.close(); playCpu(this.g, this.lv); } },
          { label: 'Back to the Zone web site', act: () => Z.goSite(`/rooms/${this.g}-${this.lv}.html`) }, '-', { label: 'Leave game', act: () => this.w.close() }]],
        ['Options', () => [
          { label: 'Show legal moves', chk: this.hints, act: () => { this.hints = Z.opts.hints = !this.hints; Z.saveOpts(); this.redraw(); } },
          { label: 'Flip the board (no, not really)', act: () => Desk.toast('JackNet Zone', 'The board is bolted to the table. Sorry.', 3000) }]],
        ['Help', () => [{ label: 'Rules of ' + G.name, act: () => rulesFor(this.g) }, { label: 'Who is the host?', act: () => Desk.msgbox('JackNet Zone', this.mode === 'cpu' ? 'This game lives entirely inside your PC. The computer player is ' + this.names[1 - this.me] + '.' : `The game is hosted on ${this.mode === 'host' ? 'YOUR' : this.names[this.me === 0 ? 1 : 0] + "'s"} computer. It checks every move; your computer checks them too.`, 'info') }]],
      ]);
      // tools (game-specific buttons)
      const self_ = this;
      this.api = {
        get st() { return self_.st; }, get me() { return self_.me; }, get names() { return self_.names; }, get last() { return self_.last; }, get hints() { return self_.hints; }, priv: this.priv,
        mine: () => this.myTurn(), move: mv => this.userMove(mv), redraw: () => this.redraw(), anim: ms => this.animate(ms), sfx, say: t => this.setStatusText(t, true),
      };
      if (!this.rt) { this.ui = G.ui(this.api); this.drawTools(); }
      // input
      const pos = ev => { const r = this.cv.getBoundingClientRect(); return [(ev.clientX - r.left), (ev.clientY - r.top)]; };
      this.cv.addEventListener('pointerdown', ev => { ev.preventDefault(); try { this.cv.focus({ preventScroll: true }); } catch (e) {} this.cv.setPointerCapture(ev.pointerId); this.stopFlash(); const [x, y] = pos(ev); if (this.rt) this.ptInput(y, true); else if (this.ui.tap && !this.done) this.ui.tap(x, y); });
      this.cv.addEventListener('pointermove', ev => { const [x, y] = pos(ev); if (this.rt) { if (ev.buttons || ev.pointerType === 'touch') this.ptInput(y, false); } else if (this.ui.hover && !this.done && ev.pointerType !== 'touch') this.ui.hover(x, y); });
      this.cv.addEventListener('pointerup', () => { if (this.rt) this.ptInput(null); });
      this.keyFn = ev => { if (!this.rt || this.done || this.me < 0) return; const k = ev.key; if (k === 'ArrowUp' || k === 'w' || k === 'W') { this.keys.up = ev.type === 'keydown'; ev.preventDefault(); } if (k === 'ArrowDown' || k === 's' || k === 'S') { this.keys.down = ev.type === 'keydown'; ev.preventDefault(); } };
      this.keys = {}; window.addEventListener('keydown', this.keyFn); window.addEventListener('keyup', this.keyFn);
      // chat
      const inp = this.$('.zg-in');
      this.$('.zg-send').addEventListener('click', () => { this.sayChat(inp.value); inp.value = ''; });
      inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); this.sayChat(inp.value); inp.value = ''; } });
      this.$('.zg-quick').addEventListener('change', ev => { if (ev.target.value) this.sayChat(ev.target.value); ev.target.value = ''; });
      // sizing
      this.ro = new ResizeObserver(() => this.fitCanvas()); this.ro.observe(this.$('.zg-cv'));
      this.fitCanvas();
      // header
      this.$('.p0 b').textContent = this.names[0]; this.$('.p1 b').textContent = this.names[1];
      this.$('.p0 .zg-sw').style.background = G.pc[0]; this.$('.p1 .zg-sw').style.background = G.pc[1];
      this.$('.zg-vs').textContent = G.pn[0].slice(0, 1) !== G.pn[1].slice(0, 1) ? 'v' : 'v';
      this.$('.zg-mid').title = `${G.pn[0]} v ${G.pn[1]}`;
      this.logLine(this.mode === 'cpu' ? `You are playing ${this.names[1 - this.me]} (${Z.LEVELS[this.lv]}). ${this.me === 0 ? 'You go first.' : 'They go first.'}` : this.mode === 'watch' ? 'You are watching. Be quiet in the chat (or not).' : `Playing ${this.names[1 - this.me]} (rated ${this.ratings[1 - this.me]}). You are ${G.pn[this.me]}. Say hi!`, 'sys');
    }
    drawTools() {
      const row = this.$('.zg-tools'); row.innerHTML = '';
      const tools = (this.ui && this.ui.tools) || [];
      for (const t of tools) { if (t.show && !t.show()) continue; const b = document.createElement('button'); b.className = 'btn' + (t.bold ? ' big' : ''); b.textContent = t.label; if (t.dis && t.dis()) b.disabled = true; b.addEventListener('click', () => { if (this.done) return; t.act(); this.drawTools(); }); row.appendChild(b); }
      if (!this.done && this.me >= 0) {
        const r = document.createElement('button'); r.className = 'btn zg-resign'; r.textContent = this.rt ? 'Give up' : 'Resign'; r.addEventListener('click', () => this.askResign()); row.appendChild(r);
        if (!this.rt) { const d = document.createElement('button'); d.className = 'btn'; d.textContent = 'Offer draw'; d.addEventListener('click', () => this.offerDraw()); row.appendChild(d); }
      }
      const timeLbl = document.createElement('span'); timeLbl.className = 'zg-turnlbl'; row.appendChild(timeLbl); this.turnLbl = timeLbl;
      row.style.display = row.children.length > 1 || tools.length ? '' : '';
    }
    fitCanvas() {
      if (this.closed) return;
      const wrap = this.$('.zg-cv'), r = wrap.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      const W = Math.max(50, Math.floor(r.width)), H = Math.max(50, Math.floor(r.height));
      this.cv.style.width = W + 'px'; this.cv.style.height = H + 'px'; this.cv.width = W * dpr; this.cv.height = H * dpr; this.W = W; this.H = H; this.dpr = dpr;
      this.redraw();
    }
    redraw() {
      if (this.closed || !this.W) return;
      const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.fillStyle = '#c0c0c0'; c.fillRect(0, 0, this.W, this.H);
      try { if (this.rt) this.pf = this.G.pong.draw(c, this.W, this.H, this.sim, this.me, this.names, now()); else this.ui.draw(c, this.W, this.H); } catch (e) { console.error(e); }
      this.header();
    }
    animate(ms) {
      this.animEnd = Math.max(this.animEnd || 0, now() + ms);
      if (this.animating || this.rt) return; this.animating = true;
      const g = () => { if (this.closed) { this.animating = false; return; } this.redraw(); if (now() < this.animEnd) requestAnimationFrame(g); else this.animating = false; };
      requestAnimationFrame(g);
    }
    header() {
      const G = this.G;
      for (const p of [0, 1]) {
        const el = this.$('.p' + p), turn = !this.done && (this.rt ? false : (G.mustAct ? G.mustAct(this.st, p) : G.turn(this.st) === p));
        el.classList.toggle('turn', turn); el.classList.toggle('me', p === this.me);
        el.querySelector('small').textContent = this.rt ? (p === this.me ? 'you' : '') : (G.info ? G.info(this.st, p) : (p === this.me ? 'you' : ''));
        const bar = el.querySelector('.zg-tm i');
        if (turn && this.deadline) { const k = Math.max(0, Math.min(1, (this.deadline - now()) / this.turnMs)); bar.style.width = (k * 100) + '%'; bar.style.background = k < 0.25 ? '#e01010' : '#000080'; el.querySelector('.zg-tm').style.visibility = ''; } else el.querySelector('.zg-tm').style.visibility = 'hidden';
      }
      this.$('.zg-mv').textContent = this.rt ? `${this.sim.sc[0]} - ${this.sim.sc[1]}` : `move ${this.n}`;
    }
    setStatusText(t, flashMsg) { if (this.w.status) this.w.status.textContent = t; if (flashMsg) { clearTimeout(this.stT); this.stT = setTimeout(() => this.status(), 2500); } }
    status() {
      if (this.closed) return;
      if (this.done) return this.setStatusText(this.result ? this.result.text : 'Game over');
      if (this.me < 0) return this.setStatusText(`Watching ${this.names[0]} v ${this.names[1]}. ${this.rt ? '' : (this.G.turn(this.st) >= 0 ? this.names[this.G.turn(this.st)] + ' to move.' : '')}`);
      if (this.rt) return this.setStatusText(`First to ${this.G.pong.WIN}. Drag the saber or use the arrow keys. Rally: ${this.sim.hits}`);
      const t = this.G.turn(this.st);
      if (t === -2) this.setStatusText(this.st.rd && this.st.rd[this.me] ? `Waiting for ${this.names[1 - this.me]} to place their fleet...` : 'Place your fleet, then press Ready!');
      else if (t === -3) this.setStatusText('Rolling the dice...');
      else if (this.myTurn()) this.setStatusText(this.G.id === 'ships' && this.st.pend >= 0 ? 'Answering their shot...' : 'Your turn!');
      else this.setStatusText(`Waiting for ${this.names[1 - this.me]}...`);
    }
    logLine(text, cls, col) { const log = this.$('.zg-log'); const d = document.createElement('div'); d.className = cls || ''; if (cls === 'sys') d.innerHTML = `<span class="zl-sys">*** ${esc(text)}</span>`; else d.innerHTML = `<b style="color:${esc(col || '#000080')}">&lt;${esc(cls)}&gt;</b> ${esc(nanny(text))}`; log.appendChild(d); while (log.children.length > 60) log.firstChild.remove(); log.scrollTop = log.scrollHeight; }
    sayChat(text) {
      text = cleanText(text, 160); if (!text) return;
      if (now() - (this.lastChat || 0) < 1000) return; this.lastChat = now();
      this.logLine(text, meNick(), (Z.online.find(o => o.id === meId()) || {}).col);
      if (/brb,? mom/i.test(text)) secret('zone.mom');
      if (this.mode === 'cpu') { setTimeout(() => this.cpuChat(text), 700 + Math.random() * 1200); return; }
      if (this.mode === 'watch') { Z.relay(this.peerId, 'zone.g', { k: 'chat', gid: this.gid, text }); return; }
      this.send({ k: 'chat', gid: this.gid, text }); this.toSpecs({ k: 'chat', gid: this.gid, text, who: meNick() });
    }
    cpuChat(text) {
      if (this.closed) return; const t = text.toLowerCase(); let r;
      if (/gg/.test(t)) r = 'gg'; else if (/hi|hello/.test(t)) r = ['hi', 'hello human', 'BEEP. hi.'][this.lv]; else if (/hurry/.test(t)) r = ['sorry!! thinking', 'patience is a virtue', 'I calculate 4,000 moves per second. You typed that in 4 seconds. Who is slow?'][this.lv];
      else if (/nice|good/.test(t)) r = ['thanks :)', 'ta', 'Naturally.'][this.lv]; else if (/mom/.test(t)) r = 'my Mom is a 486. she wants me too.'; else if (/lag/.test(t)) r = 'there is no lag. I am inside your computer.';
      else r = ['lol', 'ok', 'hmm', ':)', 'is that a trick?', 'no comment', 'waaagh', 'processing...'][U.rint(8)];
      this.logLine(r, this.names[1 - this.me], '#800000');
    }
    // ---------------- turn-based engine
    begin() {
      this.turnMs = TURN_S * 1000 * (this.G.tmul || 1);
      if (this.rt) return this.pongBegin();
      this.newTurn(); this.status(); this.redraw();
      this.tick = setInterval(() => this.onTick(), 250);
      this.afterState();
    }
    myTurn() { if (this.done || this.me < 0 || this.rt) return false; return this.G.mustAct ? this.G.mustAct(this.st, this.me) : this.G.turn(this.st) === this.me; }
    actor() { const G = this.G, t = G.turn(this.st); if (t >= 0) return t; if (t === -2) return this.st.rd[0] ? 1 : this.st.rd[1] ? 0 : -2; return t; } // -2: both placing, -3: system
    newTurn() {
      const G = this.G, t = G.turn(this.st);
      this.turnMs = TURN_S * 1000 * (G.tmul || 1) * (t === -2 ? 2 : 1);
      this.deadline = now() + this.turnMs; this.timedOut = false;
      if (this.myTurn()) { sfx('turn'); this.flash(); } else this.stopFlash();
    }
    flash() { if (this.flashT || this.me < 0) return; let on = false; this.flashT = setInterval(() => { on = !on; this.w.setTitle(on ? 'YOUR TURN! - ' + this.G.name : this.title); this.w.el.classList.toggle('zone-flash', on); this.w.task.classList.toggle('zone-flash', on); }, 600); }
    stopFlash() { if (!this.flashT) return; clearInterval(this.flashT); this.flashT = 0; this.w.setTitle(this.title); this.w.el.classList.remove('zone-flash'); this.w.task.classList.remove('zone-flash'); }
    onTick() {
      if (this.closed || this.done) return;
      this.header();
      // OUR connection dropped (tab asleep, phone in a tunnel): stop the clock and judge nobody until Net is back
      if (this.online && !Net.connected) { if (!this.offSince) { this.offSince = now(); this.logLine('Your connection to JackNet dropped. Reconnecting... (the clock is stopped)', 'sys'); this.setStatusText('Reconnecting to JackNet...'); } return; }
      if (this.offSince) { const away = now() - this.offSince; this.offSince = 0; if (this.deadline) this.deadline += away; if (this.graceAt) this.graceAt += away; this.logLine('Reconnected. Carrying on!', 'sys'); this.status(); }
      if (this.waitSince) return; // the other player's connection dropped: the clock is stopped until they're back
      if (this.mode === 'watch' || !this.deadline) return;
      if (now() > this.deadline && !this.timedOut) {
        this.timedOut = true; this.graceAt = now() + 15000;
        if (this.myTurn()) this.myTimeout();
        else if (this.mode === 'cpu') { const a = this.actor(); if (a >= 0 || a === -2) this.forceMove(1 - this.me, true); }
        else if (this.mode === 'host' && this.actor() === 1 - this.me && !(this.G.id === 'ships' && (this.st.ph === 'setup' || this.st.pend >= 0))) this.forceMove(1 - this.me, true);
      }
      // the other side has gone quiet for far too long: don't hang, give the win
      if (this.timedOut && this.graceAt && now() > this.graceAt && this.online && !this.myTurn()) {
        const a = this.actor(), theirs = a === 1 - this.me || (a === -2 && !this.st.rd[1 - this.me]) || (a === -3 && this.mode === 'guest');
        if (theirs) { this.send({ k: 'leave', gid: this.gid }); this.finish(this.me, `${this.names[1 - this.me]} stopped responding`, null, false, 'dc'); }
      }
    }
    myTimeout() {
      this.timeouts = (this.timeouts | 0) + 1; secret('zone.timeout');
      if (this.timeouts >= 3) { this.logLine('Three timeouts! The Zone has resigned the game for you.', 'sys'); this.send({ k: 'resign', gid: this.gid }); return this.finish(1 - this.me, `${meNick()} ran out of time three times`); }
      const G = this.G, st = this.st; let mv;
      if (G.id === 'ships' && st.ph === 'setup') mv = G.ready(this.priv);
      else if (G.autoPass && G.autoPass(st)) mv = G.passMove ? G.passMove() : { pass: 1 };
      else if (G.auto && G.auto(st, this.me, this.priv)) mv = G.auto(st, this.me, this.priv);
      else mv = G.rand ? G.rand(st, this.me, this.priv) : G.ai(st, this.me, 0, this.priv);
      this.logLine(`Time's up! A random move was played for you (${this.timeouts} of 3).`, 'sys');
      Desk.toast('JackNet Zone', 'Wake up! You ran out of time.', 3000);
      if (mv) { if (this.mode === 'guest') this.userMove(mv); else this.commit(mv, this.me, 1); }
    }
    forceMove(p, timeout) { // a random legal move for whoever is dawdling
      const G = this.G; let mv;
      if (G.id === 'ships' && this.st.ph === 'setup') { if (p === this.me) { mv = G.ready(this.priv); } else if (this.mode === 'cpu') { mv = G.ai(this.st, p, 0, this.cpuPriv()); } else return; }
      else if (G.autoPass && G.autoPass(this.st)) mv = G.passMove ? G.passMove() : { pass: 1 };
      else if (G.id === 'ships' && this.st.pend >= 0) { if (p === this.me) mv = G.auto(this.st, p, this.priv); else if (this.mode === 'cpu') mv = G.auto(this.st, p, this.cpuPriv()); else return; }
      else mv = G.rand ? G.rand(this.st, p, p === this.me ? this.priv : this.cpuPriv()) : G.ai(this.st, p, 0, p === this.me ? this.priv : this.cpuPriv());
      if (!mv) return;
      if (timeout) this.logLine(`${this.names[p]} ran out of time. A random move was played.`, 'sys');
      this.commit(mv, p, timeout ? 1 : 0);
    }
    cpuPriv() { return this.cpu = this.cpu || {}; }
    userMove(mv) {
      if (this.done || !this.myTurn()) return;
      const G = this.G;
      if (this.online && !Net.connected) { this.setStatusText('Reconnecting to JackNet... hang on a sec, then try that again.', true); sfx('thud'); return; }
      if (!mv || typeof mv !== 'object' || !G.legal(this.st, mv, this.me)) { sfx('thud'); return; }
      this.stopFlash();
      if (this.mode === 'guest') { this.send({ k: 'mv', gid: this.gid, n: this.n, mv }); this.local(mv, this.me, this.n); return; }
      this.commit(mv, this.me, 0);
    }
    local(mv, by, n) { // optimistic apply on the guest (the host's 'st' will confirm or correct it)
      const G = this.G; const prev = this.st;
      this.st = G.apply(prev, mv, by); this.n = n + 1; this.last = { mv, by }; this.pendingN = this.n;
      this.afterMove(mv, by, prev); this.redraw(); this.status();
    }
    commit(mv, by, flag) { // authoritative (host / cpu)
      const G = this.G, prev = this.st;
      if (!G.legal(prev, mv, by)) return console.warn('zone: illegal commit', mv);
      this.st = G.apply(prev, mv, by); this.n++; this.last = { mv, by };
      this.broadcastState(mv, by, flag);
      this.afterMove(mv, by, prev); this.redraw(); this.status();
      this.afterState();
    }
    broadcastState(mv, by, flag) {
      if (this.mode !== 'host') return;
      const pkt = { k: 'st', gid: this.gid, n: this.n, st: this.st, mv, by, f: flag || 0 };
      this.send(pkt); this.toSpecs(Object.assign({ names: this.names, g: this.g }, pkt));
    }
    afterMove(mv, by, prev) {
      const G = this.G;
      if (by !== this.me || this.me < 0) sfx(G.id === 'ships' && 'a' in (mv || {}) ? (mv.a ? 'zap' : 'thud') : 'click'); else sfx('click');
      if (G.id === 'checkers' && by === this.me && mv.path && mv.path.length >= 4) secret('zone.triple');
      if (G.id === 'dots' && by === this.me) { this.dots = (this.st.p === this.me) ? this.dots + this.st.got : 0; if (this.dots >= 6) secret('zone.hoarder'); if (this.st.p === this.me && this.st.got) this.setStatusText('Box! Go again.', true); }
      if (G.id === 'ships' && 'a' in mv && this.st.lastShot) { const ls = this.st.lastShot; const who = ls.q === this.me ? 'Your' : 'Their'; this.logLine(ls.k ? `${who} ${ls.q === this.me ? 'ship' : 'enemy ship'} (${Z.GAMES.ships.FLEET_N[Z.GAMES.ships.FLEET.indexOf(ls.k)] || 'ship'}) was SUNK!` : ls.a ? (ls.q === this.me ? 'HIT on your fleet!' : 'HIT!') : (ls.q === this.me ? 'They missed.' : 'Splash. Miss.'), 'sys'); }
      if (G.id === 'bg' && this.st.hits && by !== this.me) this.setStatusText('Ouch! One of your checkers was hit.', true);
      void prev;
    }
    afterState() { // runs after every state change: new turn, auto-moves, computer moves, game over
      if (this.closed || this.done) return;
      this.persist();
      const G = this.G, ov = G.over(this.st);
      this.drawTools();
      if (ov) { if (this.mode !== 'guest') this.finish(ov.w, ov.why, ov); return; }
      this.newTurn(); this.status();
      if (this.mode === 'guest') { // the defender answers shots automatically
        if (G.auto) { const a = G.auto(this.st, this.me, this.priv); if (a) setTimeout(() => { if (!this.closed && !this.done && G.legal(this.st, a, this.me)) { this.send({ k: 'mv', gid: this.gid, n: this.n, mv: a }); this.local(a, this.me, this.n); } }, 300); }
        return;
      }
      // system moves (dice)
      if (G.sys && G.turn(this.st) === -3) { const mv = G.sys(this.st, Math.random); if (mv) setTimeout(() => { if (!this.closed && !this.done && G.legalSys(this.st, mv)) { const prev = this.st; this.st = G.apply(prev, mv); this.n++; this.last = { mv, by: -1 }; this.broadcastState(mv, -1, 0); this.redraw(); this.status(); this.afterState(); } }, 500); return; }
      if (G.autoPass && G.autoPass(this.st)) { const p = G.turn(this.st); setTimeout(() => { if (!this.closed && !this.done && G.autoPass(this.st)) { this.logLine(`${this.names[p]} has no move and must pass.`, 'sys'); this.commit(G.passMove ? G.passMove() : { pass: 1 }, p, 0); } }, 700); return; }
      const t = this.actor();
      if (this.me >= 0 && G.auto) { const a = G.auto(this.st, this.me, this.priv); if (a) { setTimeout(() => { if (!this.closed && !this.done && G.legal(this.st, a, this.me)) this.commit(a, this.me, 0); }, 350); return; } }
      if (this.mode === 'cpu') {
        const cp = 1 - this.me, act = t === -2 ? !this.st.rd[cp] : t === cp;
        if (act) { const delay = 350 + Math.random() * 500, tok = this.n; setTimeout(() => { if (this.closed || this.done || this.n !== tok) return; const mv = G.ai(this.st, cp, this.cpuLv, this.cpuPriv()); if (mv && G.legal(this.st, mv, cp)) this.commit(mv, cp, 0); else if (mv) console.warn('zone: ai illegal', mv); }, delay); }
      }
    }
    // ---------------- messages from the other side
    recv(d, m) {
      if (d.gid !== this.gid) { if (d.k === 'watch' && this.mode === 'host' && this.done) Z.relay(m.fromId, 'zone.g', { k: 'end', gid: d.gid, w: -2, why: 'finished' }); return; }
      const fromPeer = m.fromId === this.peerId;
      switch (d.k) {
        case 'ok': return;
        case 'mv': { // guest's move, validated by the host
          if (this.mode !== 'host' || !fromPeer || this.done) return;
          const mv = d.mv, gp = 1 - this.me;
          if (!mv || typeof mv !== 'object' || Array.isArray(mv)) return;
          const free = this.G.needsHost && this.G.needsHost(mv); // order-free moves (e.g. 'my fleet is ready')
          if (d.n !== this.n && !(free && this.G.legal(this.st, mv, gp))) { this.send({ k: 'st', gid: this.gid, n: this.n, st: this.st, f: 2 }); return; }
          if (!this.G.legal(this.st, mv, gp)) { console.warn('zone: rejected move', d.mv); this.send({ k: 'st', gid: this.gid, n: this.n, st: this.st, f: 2 }); return; }
          this.commit(mv, gp, 0); return;
        }
        case 'st': { // the authoritative state (guest and spectators)
          if (this.mode === 'host' || !fromPeer) return;
          if (!isInt(d.n, 0, 99999) || !this.G.check(d.st)) { console.warn('zone: bad state'); return; }
          if (this.mode === 'watch' && this.names[0] === '?' && Array.isArray(d.names) && d.names.length === 2 && d.names.every(x => typeof x === 'string' && x.length <= 24) && d.g === this.g) { this.names = d.names.slice(); this.$('.p0 b').textContent = this.names[0]; this.$('.p1 b').textContent = this.names[1]; this.logLine(`${this.names[0]} v ${this.names[1]}, move ${d.n}.`, 'sys'); }
          if (d.n < this.n && !(d.f === 2)) return; // old news
          const prev = this.st, expected = (d.mv && d.n === this.n + 1 && (d.by === -1 ? this.G.legalSys && this.G.legalSys(prev, d.mv) : this.G.legal(prev, d.mv, d.by))) ? this.G.apply(prev, d.mv, d.by) : null;
          if (expected && JSON.stringify(expected) !== JSON.stringify(d.st)) console.warn('zone: state mismatch, taking the host\'s');
          if (d.n === this.n && this.pendingN === this.n && d.f !== 2 && JSON.stringify(this.st) === JSON.stringify(d.st)) { this.pendingN = 0; this.afterState(); return; } // confirms our optimistic move
          if (d.mv && (typeof d.mv !== 'object' || !(d.by === -1 || d.by === 0 || d.by === 1))) d.mv = null;
          if (d.f === 2 && d.n === this.n && JSON.stringify(this.st) === JSON.stringify(d.st)) return;
          this.st = d.st; this.n = d.n; this.last = d.mv ? { mv: d.mv, by: d.by } : this.last; this.pendingN = 0;
          if (d.f === 2) this.logLine('Resynchronised with the host.', 'sys');
          if (d.mv && d.by === this.me && d.f === 1) { this.logLine('You ran out of time! A random move was played for you.', 'sys'); secret('zone.timeout'); }
          else if (d.mv && d.f === 1) this.logLine(`${this.names[d.by] || 'They'} ran out of time. A random move was played.`, 'sys');
          if (d.mv && d.by !== this.me) this.afterMove(d.mv, d.by, prev);
          this.redraw(); this.afterState(); this.status(); return;
        }
        case 'end': {
          if (this.mode === 'host' || !fromPeer || this.done) return;
          if (d.w === -2) { this.finish(-2, 'that game has already finished'); return; }
          if (!(d.w === -1 || d.w === 0 || d.w === 1) || typeof d.why !== 'string') return;
          this.finish(d.w, d.why.slice(0, 80), null, true); return;
        }
        case 'sync': { if (this.mode !== 'host' || !(fromPeer || this.specs.has(m.fromId))) return; Z.relay(m.fromId, 'zone.g', { k: 'st', gid: this.gid, n: this.n, st: this.st, f: 2 }); return; }
        case 'resign': { if (!fromPeer || this.done || this.me < 0) return; this.finish(this.me, `${this.names[1 - this.me]} resigned`); return; }
        case 'draw': { if (!fromPeer || this.done || this.me < 0 || this.rt) return; this.logLine(`${this.names[1 - this.me]} offers a draw.`, 'sys'); if (this.drawDlg) return; this.drawDlg = Desk.msgbox(this.G.name, `${this.names[1 - this.me]} offers you a draw. Accept?`, 'q', [['Accept', () => { this.drawDlg = null; this.send({ k: 'drawok', gid: this.gid }); this.finish(-1, 'draw agreed'); }], ['Decline', () => { this.drawDlg = null; this.send({ k: 'drawno', gid: this.gid }); }]]); return; }
        case 'drawok': { if (!fromPeer || this.done || !this.drawOffered) return; this.finish(-1, 'draw agreed'); return; }
        case 'drawno': { if (!fromPeer || !this.drawOffered) return; this.drawOffered = false; this.logLine(`${this.names[1 - this.me]} declined the draw.`, 'sys'); return; }
        case 'leave': { if (!fromPeer) return; if (!this.done && this.me >= 0) { this.finish(this.me, `${this.names[1 - this.me]} left the game`, null, false, 'left'); } else if (this.me < 0) { this.finish(-2, 'the host closed the game'); } return; }
        case 'chat': {
          const text = cleanText(d.text, 160); if (!text) return;
          if (fromPeer && this.mode === 'watch') { this.logLine(text, typeof d.who === 'string' ? d.who.slice(0, 30) : String(m.from).slice(0, 24), m.col); return; }
          if (fromPeer) { this.logLine(text, this.names[1 - this.me] || String(m.from).slice(0, 24), m.col); if (Z.opts.chatSnd) sfx('beep'); if (this.mode === 'host') this.toSpecs({ k: 'chat', gid: this.gid, text, who: this.names[1] }); }
          else if (this.mode === 'host' && this.specs.has(m.fromId)) { this.logLine(text, String(m.from).slice(0, 24) + ' (watching)', m.col); this.send({ k: 'chat', gid: this.gid, text: `[${String(m.from).slice(0, 16)} watching] ${text}` }); this.toSpecs({ k: 'chat', gid: this.gid, text, who: String(m.from).slice(0, 24) + ' (watching)' }); }
          return;
        }
        case 'watch': { if (this.mode !== 'host') return; if (this.specs.size >= (this.rt ? 2 : 8)) return; this.specs.add(m.fromId); this.logLine(`${String(m.from).slice(0, 24)} is watching.`, 'sys'); Z.relay(m.fromId, 'zone.g', { k: 'st', gid: this.gid, n: this.n, st: this.rt ? null : this.st, names: this.names, g: this.g, f: 2 }); if (this.rt) Z.relay(m.fromId, 'zone.g', { k: 'p', gid: this.gid, sim: this.pongPkt() }); return; }
        case 'unwatch': { if (this.specs.delete(m.fromId)) this.logLine(`${String(m.from).slice(0, 24)} stopped watching.`, 'sys'); return; }
        case 'rematch': { if (!fromPeer || !this.done || this.me < 0) return; this.logLine(`${this.names[1 - this.me]} wants a rematch!`, 'sys'); if (this.rmDlg || this.wantRematch) { if (this.wantRematch) this.rematchGo(); return; } this.rmDlg = Desk.msgbox(this.G.name, `${this.names[1 - this.me]} wants a rematch. Play again?`, 'q', [['Yes!', () => { this.rmDlg = null; this.wantRematch = true; this.send({ k: 'rematchok', gid: this.gid }); this.rematchGo(); }], ['No thanks', () => { this.rmDlg = null; this.send({ k: 'rematchno', gid: this.gid }); }]]); return; }
        case 'rematchok': { if (!fromPeer || !this.done || !this.wantRematch) return; this.rematchGo(true); return; }
        case 'rematchno': { if (!fromPeer) return; this.wantRematch = false; this.logLine(`${this.names[1 - this.me]} doesn't want a rematch.`, 'sys'); this.overlayButtons(); return; }
        case 'rev': { if (!fromPeer || this.G.id !== 'ships' || !this.done) return; const ok = this.G.verify(this.st, 1 - this.me, d.fleet, String(d.salt || '')); this.logLine(ok ? `${this.names[1 - this.me]}'s fleet checked out against its sealed code. Fair game.` : `CHEAT ALERT! ${this.names[1 - this.me]}'s fleet did NOT match its sealed code. This game is void.`, 'sys'); if (!ok) Desk.msgbox('Battleships', `${this.names[1 - this.me]}'s fleet did not match the code it was sealed with. Somebody moved their ships! The result is void.`, 'warn'); return; }
        // real time
        case 'p': { if (this.mode === 'host' || !fromPeer || !this.rt) return; this.pongRecv(d.sim); return; }
        case 'py': { if (this.mode !== 'host' || !fromPeer || !this.rt) return; if (typeof d.y === 'number' && d.y >= 0 && d.y <= this.G.pong.H) this.sim.y[1 - this.me] = d.y; return; }
      }
    }
    send(d) { if (this.mode === 'cpu' || !this.peerId) return; Z.relay(this.peerId, 'zone.g', d); }
    toSpecs(d) { if (this.mode !== 'host') return; for (const id of this.specs) if (Z.isOnline(id)) Z.relay(id, 'zone.g', d); else this.specs.delete(id); }
    // A dropped connection (a tab asleep, a phone that locked) isn't the end of the game: the server gives them the same id
    // back when they return, so wait up to two minutes (the clock stops meanwhile), then resynchronise the board.
    presence(list) {
      if (this.closed || this.mode === 'cpu' || this.done || !this.peerId) return;
      const here = list.some(o => o.id === this.peerId), who = this.me < 0 ? 'The host' : (this.names[1 - this.me] || 'They');
      if (!here) {
        if (!this.waitSince) { this.waitSince = now(); this.logLine(`${who} lost connection. Waiting for them to come back... (the clock is stopped)`, 'sys'); this.status(); }
        if (!this.gone) this.gone = setTimeout(() => { this.gone = null; if (this.closed || this.done || Z.isOnline(this.peerId)) return; if (this.me < 0) this.finish(-2, 'the host went offline'); else this.finish(this.me, `${who} disconnected and didn't come back`, null, false, 'dc'); }, 120000);
      } else if (this.waitSince) {
        const away = now() - this.waitSince; this.waitSince = 0; clearTimeout(this.gone); this.gone = null;
        if (this.deadline) this.deadline += away;
        this.logLine(`${who} is back! Carrying on.`, 'sys'); this.resync(); this.status();
      }
    }
    resync() { if (this.closed || this.done || this.mode === 'cpu') return; if (this.mode === 'host') { this.send({ k: 'st', gid: this.gid, n: this.n, st: this.st, f: 2 }); this.toSpecs({ k: 'st', gid: this.gid, n: this.n, st: this.st, f: 2 }); } else this.send({ k: 'sync', gid: this.gid }); }
    // ---------------- offers and ending
    askResign() { if (this.done || this.me < 0) return; Desk.msgbox(this.G.name, 'Resign this game? That counts as a loss, you know.', 'q', [['Resign', () => { if (this.done) return; this.send({ k: 'resign', gid: this.gid }); this.finish(1 - this.me, `${meNick()} resigned`); }], ['Keep playing']]); }
    offerDraw() {
      if (this.done || this.me < 0 || this.rt) return;
      if (this.mode === 'cpu') { const G = this.G, ov = G.score ? G.score(this.st) : null; const losing = ov ? ov[1 - this.me] > ov[this.me] : Math.random() < 0.5; return Desk.msgbox(this.G.name, losing ? `${this.names[1 - this.me]} says: "No thanks, I'm winning."` : this.lv === 2 ? `${this.names[1 - this.me]} says: "DEEP JACK does not do draws."` : `${this.names[1 - this.me]} says: "Alright then, draw."`, 'info', [['OK', () => { if (!losing && this.lv < 2) this.finish(-1, 'draw agreed'); }]]); }
      if (this.drawOffered) return this.logLine('You already offered a draw. Patience.', 'sys');
      this.drawOffered = true; this.send({ k: 'draw', gid: this.gid }); this.logLine('You offered a draw.', 'sys');
    }
    finish(w, why, ov, fromHost, forfeit) {
      if (this.done) return; this.done = true; this.stopFlash(); clearInterval(this.tick); clearTimeout(this.gone); this.deadline = 0;
      if (this.mode === 'host' && !fromHost) { this.send({ k: 'end', gid: this.gid, w, why }); this.toSpecs({ k: 'end', gid: this.gid, w, why }); }
      if (this.mode === 'guest' && !fromHost && w !== -2) this.send({ k: 'end', gid: this.gid, w, why }); // tells the host when we resigned etc.
      const G = this.G, me = this.me;
      let text, cls;
      if (w === -2) { text = 'Game over: ' + why + '.'; cls = 'draw'; }
      else if (me < 0) { text = w < 0 ? `It's a draw (${why}).` : `${this.names[w]} wins! (${why})`; cls = 'draw'; }
      else if (w < 0) { text = `It's a draw (${why}).`; cls = 'draw'; }
      else if (w === me) { text = `YOU WIN! (${why})`; cls = 'win'; }
      else { text = `You lost. (${why})`; cls = 'lose'; }
      this.result = { w, why, text, cls }; this.unpersist();
      this.logLine(text, 'sys');
      sfx(cls === 'win' ? 'solve' : cls === 'lose' ? 'uhoh' : 'beep');
      if (me >= 0 && w !== -2) this.scoreIt(w, why, ov, forfeit);
      if (G.id === 'ships' && me >= 0 && this.online && this.priv.fleet) this.send({ k: 'rev', gid: this.gid, fleet: this.priv.fleet, salt: this.priv.salt || '' });
      this.overlay();
      this.drawTools(); this.redraw(); this.status();
      if (this.online && my.where === 'game') setStatus({ where: idle(), gid: '', opp: '', host: false, t: -1 });
      if (this.mode === 'watch') setStatus({ where: idle(), gid: '', hid: 0 });
    }
    scoreIt(w, why, ov, forfeit) {
      const G = this.G, me = this.me, won = w === me, draw = w < 0;
      if (this.mode === 'cpu') {
        const cs = store.get('jhp_zone_cpu', {}); cs[this.g] = cs[this.g] || [0, 0, 0]; cs[this.g][won ? 0 : draw ? 2 : 1]++; store.set('jhp_zone_cpu', cs);
        if (won && this.lv === 2) secret('zone.cpuexpert');
        if (G.id === 'ttt' && draw && this.lv === 2) { const n = (store.get('jhp_zone_tttdraw', 0) | 0) + 1; store.set('jhp_zone_tttdraw', n); if (n >= 5) secret('zone.stalemate'); }
      } else {
        const opp = this.names[1 - me];
        const delta = recordResult(meNick(), won, opp, draw, this.g);
        try { if (Z.onResult) Z.onResult({ g: this.g, won, draw, opp, me: meNick(), forfeit }); } catch (e) { console.error(e); }
        if (forfeit && won) { if (forfeit === 'dc') recordResult(opp, false, meNick(), false, this.g); secret('zone.forfeit'); }
        this.logLine(`Ladder: ${delta >= 0 ? '+' : ''}${delta} points (now ${ratingOf(meNick())}).`, 'sys');
        if (won) { secret('zone.firstwin'); const nem = store.get('jhp_zone_nem', {}); const f = fieldOf(opp); nem[f] = (nem[f] | 0) + 1; store.set('jhp_zone_nem', nem); if (nem[f] >= 5) secret('zone.nemesis'); }
      }
      if (won) {
        if (G.id === 'reversi' && G.score(this.st)[me] >= 50) secret('zone.eclipse');
        if (G.id === 'c4' && ov && ov.diag) secret('zone.diagonal');
        if (G.id === 'ships' && this.st.sk && this.st.sk[me].length === 0) secret('zone.flawless');
        if (G.id === 'bg' && ov && ov.gammon >= 2) secret('zone.gammon');
        if (G.id === 'pong' && this.sim.sc[1 - me] === 0) secret('zone.shutout');
      }
    }
    overlay() {
      const ov = this.$('.zg-over'); ov.hidden = false; ov.className = 'zg-over ' + this.result.cls;
      ov.innerHTML = `<div class="zg-res"><b>${this.result.cls === 'win' ? 'YOU WIN!' : this.result.cls === 'lose' ? 'YOU LOSE' : 'GAME OVER'}</b><span>${esc(this.result.why)}</span><div class="row zg-resbtns"></div></div>`;
      this.overlayButtons();
    }
    overlayButtons() {
      const row = this.$('.zg-resbtns'); if (!row) return; row.innerHTML = '';
      const add = (label, fn, dis) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = label; b.disabled = !!dis; b.addEventListener('click', fn); row.appendChild(b); };
      if (this.me >= 0 && this.result.w !== -2) add(this.wantRematch ? 'Waiting for them...' : 'Rematch', () => this.askRematch(), this.wantRematch || (this.online && !Z.isOnline(this.peerId)));
      add('Back to the Zone', () => { this.w.close(); Z.goSite(`/rooms/${this.g}-${this.lv}.html`); });
      add('Close', () => this.w.close());
      const hide = document.createElement('button'); hide.className = 'btn'; hide.textContent = 'Look at the board'; hide.addEventListener('click', () => { this.$('.zg-over').hidden = true; }); row.appendChild(hide);
    }
    askRematch() {
      if (!this.done || this.me < 0) return;
      if (this.mode === 'cpu') { this.logLine(`${this.names[1 - this.me]} says: "Again? Fine. Loading..."`, 'sys'); return setTimeout(() => this.rematchGo(), 400); }
      if (!Z.isOnline(this.peerId)) return Desk.msgbox(this.G.name, `${this.names[1 - this.me]} has left the Zone.`, 'info');
      if (this.wantRematch) return;
      this.wantRematch = true; this.send({ k: 'rematch', gid: this.gid }); this.logLine('Rematch offered. Waiting...', 'sys'); this.overlayButtons();
    }
    rematchGo(accepted) {
      if (this.rematched) return; this.rematched = true;
      secret('zone.rematch');
      const swap = 1 - this.me, o = { mode: this.mode, g: this.g, lv: this.lv, peerId: this.peerId, peerNick: this.names[1 - this.me], me: swap, t: this.t };
      if (this.mode === 'cpu' || this.mode === 'host') { o.gid = Z.rid(); this.close(); openMatch(o).logLine('Rematch! Colours swapped.', 'sys'); }
      else { this.logLine('Rematch agreed. Waiting for the host to deal...', 'sys'); this.wantRematch = true; this.rematched = false; void accepted; }
    }
    // ---------------- pong (real time)
    pongBegin() {
      const P = this.G.pong, sim = this.sim; this.pf = null; this.keys = {}; this.lastPkt = 0; this.lastPy = 0; this.ptY = null;
      this.status(); this.logLine('Drag up and down (or use the arrow keys). First to 7.', 'sys');
      let last = now(); const mem = {};
      const loop = () => {
        if (this.closed) return;
        const t = now(), dt = Math.min(0.05, (t - last) / 1000); last = t;
        const auth = this.mode === 'cpu' || this.mode === 'host';
        if (!this.done && !this.waitSince && !(this.online && !Net.connected)) { // paused while either side is reconnecting
          // my paddle
          if (this.me >= 0) { const v = (this.keys.up ? -1 : 0) + (this.keys.down ? 1 : 0); if (v) sim.y[this.me] = Math.max(P.PADH / 2, Math.min(P.H - P.PADH / 2, sim.y[this.me] + v * 330 * dt)); else if (this.ptY != null) sim.y[this.me] += (this.ptY - sim.y[this.me]) * Math.min(1, dt * 18); }
          if (this.mode === 'cpu') sim.y[1 - this.me] = Math.max(P.PADH / 2, Math.min(P.H - P.PADH / 2, P.aiY(sim, 1 - this.me, this.lv, dt, mem)));
          const ev = P.step(sim, dt, auth);
          if (ev === 'hit') sfx('boing'); else if (ev === 'wall') sfx('click'); else if (ev && ev.startsWith('point')) { sfx(+ev[5] === this.me ? 'zap' : 'thud'); this.logLine(`${this.names[+ev[5]]} scores! ${sim.sc[0]} - ${sim.sc[1]}`, 'sys'); this.status(); }
          if (auth && (sim.sc[0] >= P.WIN || sim.sc[1] >= P.WIN)) this.finish(sim.sc[0] >= P.WIN ? 0 : 1, `${sim.sc[0]} - ${sim.sc[1]}`);
          if (this.mode === 'host' && t - this.lastPkt > 125) { this.lastPkt = t; this.send({ k: 'p', gid: this.gid, sim: this.pongPkt() }); if (this.specs.size && (this.specTick = (this.specTick | 0) + 1) % 5 === 0) this.toSpecs({ k: 'p', gid: this.gid, sim: this.pongPkt() }); }
          if (this.mode === 'guest' && t - this.lastPy > 100) { this.lastPy = t; this.send({ k: 'py', gid: this.gid, y: Math.round(sim.y[this.me] * 10) / 10 }); }
          if (sim.hits && sim.hits % 10 === 0 && this.lastRally !== sim.hits) { this.lastRally = sim.hits; this.status(); }
        }
        this.redraw();
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }
    pongPkt() { const s = this.sim; return { b: s.b.map(v => Math.round(v * 10) / 10), y: s.y.map(v => Math.round(v * 10) / 10), sc: s.sc, serve: Math.round(s.serve), srv: s.srv, hits: s.hits }; }
    pongRecv(p) {
      const P = this.G.pong; if (!p || !Array.isArray(p.b) || p.b.length !== 4 || !p.b.every(v => typeof v === 'number' && isFinite(v)) || !Array.isArray(p.y) || p.y.length !== 2 || !Array.isArray(p.sc) || !p.sc.every(v => isInt(v, 0, 99))) return;
      const s = this.sim, oldSc = s.sc.slice();
      s.b = p.b.slice(); if (this.me !== 0) s.y[0] = +p.y[0]; if (this.me !== 1) s.y[1] = +p.y[1];
      s.sc = p.sc.slice(); s.serve = +p.serve || 0; s.srv = p.srv ? 1 : 0; s.hits = p.hits | 0;
      if (oldSc[0] !== s.sc[0] || oldSc[1] !== s.sc[1]) { const who = s.sc[0] !== oldSc[0] ? 0 : 1; sfx(who === this.me ? 'zap' : 'thud'); this.logLine(`${this.names[who]} scores! ${s.sc[0]} - ${s.sc[1]}`, 'sys'); this.status(); }
    }
    ptInput(y, down) {
      if (!this.rt || this.me < 0 || this.done) return;
      if (y == null) { this.ptY = null; return; }
      const f = this.pf; if (!f) return;
      const P = this.G.pong; this.ptY = Math.max(P.PADH / 2, Math.min(P.H - P.PADH / 2, (y - f.y) / (f.h / P.H)));
      void down;
    }
    // ---------------- closing
    onClose() {
      if (this.closed) return; this.closed = true;
      this.stopFlash(); clearInterval(this.tick); cancelAnimationFrame(this.raf); clearTimeout(this.gone); try { this.ro.disconnect(); } catch (e) {}
      window.removeEventListener('keydown', this.keyFn); window.removeEventListener('keyup', this.keyFn);
      if (this.mode === 'watch') { Z.relay(this.peerId, 'zone.g', { k: 'unwatch', gid: this.gid }); if (my.where === 'watch') setStatus({ where: idle(), gid: '', hid: 0 }); }
      else if (this.online) {
        if (!this.done) { this.send({ k: 'leave', gid: this.gid }); this.toSpecs({ k: 'end', gid: this.gid, w: 1 - this.me, why: `${meNick()} left` }); if (this.me >= 0) { recordResult(meNick(), false, this.names[1 - this.me], false, this.g); Net.kv.inc('zone.quits'); Desk.toast('JackNet Zone', 'You left a game in progress. That counts as a loss!', 4000); } }
        else if (this.mode === 'host') this.toSpecs({ k: 'end', gid: this.gid, w: -2, why: 'finished' });
        if (my.where === 'game' && my.gid === this.gid) setStatus({ where: idle(), gid: '', opp: '', host: false, t: -1 });
      }
      this.unpersist();
      if (Z.current === this) Z.current = null;
    }
    // a page reload (or a closed-and-reopened browser) mid-game: remember the board so we can carry on (see resumeSaved)
    persist() { if (this.mode !== 'host' && this.mode !== 'guest') return; if (this.rt) return; store.set(LIVE_K, { g: this.g, lv: this.lv, gid: this.gid, mode: this.mode, peerId: this.peerId, peerNick: this.names[1 - this.me], me: this.me, st: this.st, n: this.n, t: this.t, priv: this.priv, ts: Date.now() }); }
    unpersist() { const s = store.get(LIVE_K, null); if (s && s.gid === this.gid) store.set(LIVE_K, null); }
    close(silent) { if (this.closed) return; if (silent && this.online && !this.done) { /* a forced close still tells the other side */ } this.w.close(); }
  }
  Z.openMatch = openMatch; Z.playCpu = playCpu; Z.startHosted = startHosted;
  // came back (same browser, same id from the server) within a couple of minutes of a reload: re-open the board and resync
  function resumeSaved() {
    const s = store.get(LIVE_K, null);
    if (!s || typeof s !== 'object' || Date.now() - (s.ts || 0) > 170000) { if (s) store.set(LIVE_K, null); return; }
    if (Z.current && !Z.current.closed) return;
    if (!Z.META[s.g] || !GM[s.g] || GM[s.g].rt || !okId(s.gid) || !(s.mode === 'host' || s.mode === 'guest') || !(s.me === 0 || s.me === 1) || !isInt(s.peerId, 1, 1e9) || !GM[s.g].check(s.st)) { store.set(LIVE_K, null); return; }
    if (!Z.isOnline(s.peerId)) { if (!resumeSaved.tries) resumeSaved.tries = 0; if (++resumeSaved.tries < 8) setTimeout(resumeSaved, 2500); return; }
    openMatch({ mode: s.mode, g: s.g, lv: s.lv | 0, gid: s.gid, peerId: s.peerId, peerNick: String(s.peerNick || 'Guest').slice(0, 24), me: s.me, st: s.st, n: s.n | 0, t: s.t, priv: s.priv && typeof s.priv === 'object' ? s.priv : {}, resume: true });
  }
  Z.resumeSaved = resumeSaved;
  if (Net.connected && Net.me.id) setTimeout(resumeSaved, 300); else Net.on('welcome', () => setTimeout(resumeSaved, 900));
})();
