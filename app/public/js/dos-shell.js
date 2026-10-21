/* dos-shell: JackOS 98 COMMAND.COM. A DOS command interpreter that walks the shared C: drive (Apps.fs) with proper
 * 8.3 short names, batch files, DOSKEY, redirection, pipes and a lot of things Jack's Dad would recognise. */
(function () {
  'use strict';
  const DOS = window.DOS, K = DOS.core, A = window.Apps;
  if (DOS.Shell) return;
  const pad = (s, n) => String(s).padEnd(n).slice(0, Math.max(n, String(s).length));
  const lpad = (s, n) => String(s).padStart(n);
  const p2 = n => String(n).padStart(2, '0');
  const commas = n => Math.round(n).toLocaleString('en-GB');
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dateOfToday = () => { const t = today(); return `${p2(t.d)}/${p2(t.m)}/99`; };
  const today = () => (window.Desk && Desk.today99) ? Desk.today99() : { m: 1, d: 1, date: new Date(1999, 0, 1) };
  const S = id => { try { return A.secret('dos.' + id); } catch (e) { return false; } };
  const canW = n => !!(n && (n.dos || n.user));
  const isCfg = r => r && r.dr === 'C' && r.dirs && r.dirs.length === 0 && r.node && /^(AUTOEXEC\.BAT|CONFIG\.SYS)$/i.test(r.node.name);

  // ================================================================ drives + 8.3 names
  const VALID83 = /^[A-Z0-9!#$%&'()\-@^_`{}~]{1,8}(\.[A-Z0-9!#$%&'()\-@^_`{}~]{1,3})?$/;
  const cache = new WeakMap();
  function shortNames(dir) {
    const kids = dir.kids || [];
    const sig = kids.length + ':' + kids.map(k => k.name).join('|');
    const c = cache.get(dir); if (c && c.sig === sig) return c.map;
    const map = new Map(), used = new Set();
    for (const k of kids) { const u = k.name.toUpperCase(); if (VALID83.test(u) && !used.has(u)) { map.set(k, u); used.add(u); } }
    for (const k of kids) {
      if (map.has(k)) continue;
      const nm = k.name.replace(/^\.+/, ''), dot = nm.lastIndexOf('.');
      const clean = s => s.toUpperCase().replace(/[^A-Z0-9!#$%&'()\-@^_`{}~]/g, '');
      let base = clean(dot > 0 ? nm.slice(0, dot) : nm) || 'FILE', ext = dot > 0 ? clean(nm.slice(dot + 1)).slice(0, 3) : '';
      for (let n = 1; n < 1000; n++) { const t = '~' + n, cand = base.slice(0, 8 - t.length) + t + (ext ? '.' + ext : ''); if (!used.has(cand)) { map.set(k, cand); used.add(cand); break; } }
    }
    cache.set(dir, { sig, map });
    return map;
  }
  const short = (dir, k) => shortNames(dir).get(k) || k.name.toUpperCase();
  function findKid(dir, name) {
    if (!dir || !dir.kids) return null;
    const low = name.toLowerCase().replace(/\.$/, ''), up = name.toUpperCase().replace(/\.$/, '');
    const sn = shortNames(dir);
    return dir.kids.find(k => k.name.toLowerCase() === low) || dir.kids.find(k => sn.get(k) === up) || null;
  }
  // floppy & CD: use the real ones if apps-files exposes them, otherwise a small built-in cover CD
  let FALLBACK_D = null;
  function cdRoot() {
    if (A.fs.drives && A.fs.drives['D:']) return A.fs.drives['D:'];
    if (!FALLBACK_D) {
      FALLBACK_D = { name: 'D:', type: 'dir', label: 'JACKATTACK7', kids: [], drive: true };
      const put = n => FALLBACK_D.kids.push(Object.assign({ date: '01/01/99' }, n));
      put({ name: 'AUTORUN.INF', type: 'txt', text: '[autorun]\nopen=SETUP.EXE\nicon=JACK.ICO\nlabel=JACK ATTACK! COVER DISC #7\n' });
      put({ name: 'README.TXT', type: 'txt', text: 'JACK ATTACK! COVER DISC #7\n==========================\n\nThis is the DOS side of the disc. Open My Computer to see the rest.\nTip: TYPE D:\\DOSSTUFF\\DISC.ANS\n' });
      put({ name: 'SETUP.EXE', type: 'exe', app: 'files.run', arg: 'setup', size: '1.2 MB' });
      const ds = { name: 'DOSSTUFF', type: 'dir', date: '01/01/99', kids: [] }; FALLBACK_D.kids.push(ds);
      [['JACKCRAWL.EXE', 'grotcrawl'], ['DAKKA.EXE', 'dakka'], ['SQUIGPIE.EXE', 'squigpie'], ['SQUIGHUNT.EXE', 'squighunt'], ['TRUKKRACE.EXE', 'trukkrace'], ['GEMWARS.EXE', 'teefwars'], ['INTRO.EXE', 'intro'], ['TPAINT.EXE', 'tpaint'], ['JACKTRAK.EXE', 'grottrak']].forEach(([n, p]) => ds.kids.push({ name: n, type: 'exe', date: '01/01/99', size: '40 KB', app: 'dos.run', arg: p.toUpperCase(), dosprog: p }));
      ds.kids.push({ name: 'DISC.ANS', type: 'ans', date: '01/01/99', text: '\x1b[1;35m  JACK ATTACK! COVER DISC #7 - DOS SIDE\n\x1b[0;36m  ======================================\n\x1b[0;37m  The games in this folder also live in C:\\GAMES\\SHAREWAR.\n  (The CD is a copy of the hard disk. The hard disk is a copy of the CD. Don\'t think about it.)\n\x1b[0m' });
      ds.kids.push({ name: 'README.TXT', type: 'txt', date: '01/01/99', text: 'DOS STUFF\n\nType the name of a game. Or ANSI DISC.ANS. Or go back to JackOS, I won\'t judge.\n' });
    }
    return FALLBACK_D;
  }
  const floppyRoot = () => (A.fs.drives && A.fs.drives['A:']) || null;
  const LABELS = { C: 'JACKS PC', D: 'JACKATTACK7', A: "DAVE'S DISK", E: 'RAMDRIVE' };
  const SERIAL = { C: '1999-0A7C', D: '4A41-434B', A: '0DA7-E000', E: '0000-0000' };

  // sizes: the same sums as Explorer does (roughly), so DIR and Properties agree
  function bytesOf(n) {
    if (!n || n.type === 'dir') return 0;
    if (n.size) { const m = /([\d.,]+)\s*(bytes|KB|MB|GB)?/i.exec(n.size); if (m) { const v = parseFloat(m[1].replace(/,/g, '')), u = (m[2] || 'bytes').toUpperCase(); return Math.round(v * (u === 'KB' ? 1024 : u === 'MB' ? 1048576 : u === 'GB' ? 1073741824 : 1)) + (hash(n.name) % 97); } }
    if (n.type === 'txt' || n.text != null) { const t = String(n.text || ''); return t.length + (t.match(/\n/g) || []).length; }
    if (n.type === 'img') return 20000 + (hash(n.name) % 90000);
    if (n.type === 'lnk') return 92 + (hash(n.name) % 60);
    return 1024 + (hash(n.name) % 4096);
  }
  const dateOf = n => n.date || (n.type === 'dir' ? '10/12/98' : '01/01/99');
  const timeOf = n => n.time || `${p2(8 + (hash(n.name) % 14))}:${p2((hash(n.name) >>> 4) % 60)}`;
  const isText = n => n.type === 'txt' || n.type === 'doc' || (n.text != null && n.type !== 'exe');
  const ext = n => { const m = /\.([^.]+)$/.exec(n.name); return m ? m[1].toUpperCase() : ''; };
  const isSys = (path) => /^C:\\JACKOS\b/i.test(path);
  function wild(pat) { // DOS wildcards -> regex
    if (!/[*?]/.test(pat)) return null;
    let p = pat.toUpperCase(); if (p === '*.*' || p === '*') return /^.*$/;
    if (!p.includes('.')) p += '.*'; // "A*" means "A*.*"
    const [b, e] = [p.slice(0, p.lastIndexOf('.')), p.slice(p.lastIndexOf('.') + 1)];
    const rx = s => s.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.?');
    return new RegExp('^' + rx(b) + (e === '*' ? '(\\..*)?' : e === '' ? '' : '\\.' + rx(e)) + '$', 'i');
  }

  // ================================================================ the shell
  class Shell {
    constructor(host, o) {
      o = o || {};
      this.host = host; this.term = host.term; this.o = o;
      this.mode = o.mode || 'win'; // 'win' = DOS box in a window, 'dos' = restarted in MS-DOS mode
      this.drive = 'C'; this.cwd = { C: [], D: [], A: [] }; // arrays of dir nodes below the root
      this.env = { COMSPEC: 'C:\\COMMAND.COM', PROMPT: '$p$g', PATH: 'C:\\JACKOS;C:\\JACKOS\\COMMAND;C:\\GAMES;C:\\JBASIC;C:\\BATCH', TEMP: 'C:\\JACKOS\\TEMP', TMP: 'C:\\JACKOS\\TEMP', BLASTER: 'A220 I5 D1 H5 P330 T6', WINDIR: 'C:\\JACKOS' };
      const saved = A.store.get('jhp_dos_env', null); if (saved && typeof saved === 'object') for (const k of ['PROMPT']) if (typeof saved[k] === 'string' && saved[k].length < 80) this.env[k] = saved[k];
      this.hist = A.store.get('jhp_dos_hist', []).filter(x => typeof x === 'string').slice(-50);
      this.echo = true; this.err = 0; this.exitReq = false; this.depth = o.depth || 0;
      this.floppy = { tries: 0, in: false, failed: false }; this.cdTries = 0;
      this.out = null; // capture buffer for pipes and redirection
      this.doskey = true;
      this.cfg = { ansi: true, bedtime: true, sound: false, files: 40 }; this.mouse = true; this.cd = true; this.booted = false;
    }
    // ---- CONFIG.SYS and AUTOEXEC.BAT really do things here (edit them with EDIT; DEL puts the originals back)
    async boot(visible) {
      if (this.booted) return; this.booted = true;
      const cfgNode = A.fs.get('C:/CONFIG.SYS'), cfgText = cfgNode ? String(cfgNode.text || '') : '';
      const live = cfgText.split('\n').filter(l => !/^\s*(REM|;)/i.test(l));
      const has = rx => live.some(l => rx.test(l));
      this.cfg.ansi = !cfgText.split('\n').some(l => /^\s*(REM|;)/i.test(l) && /ANSI\.SYS/i.test(l)) || has(/ANSI\.SYS/i); this.cfg.bedtime = has(/MOM\.SYS/i); this.cfg.sound = has(/(SOUND|SB16|BLASTER)[^\n]*\.(SYS|EXE)/i);
      const fm = /^\s*FILES\s*=\s*(\d+)/im.exec(live.join('\n')); this.cfg.files = fm ? +fm[1] : 8;
      if (has(/RAMDRIVE\.SYS/i)) { if (!DOS.ramdrive) { DOS.ramdrive = { name: 'E:', type: 'dir', kids: [], drive: true, label: 'RAMDRIVE' }; } this.cwd.E = this.cwd.E || []; S('ramdrive'); } else if (DOS.ramdrive) DOS.ramdrive = null;
      if (cfgNode && cfgNode.dos) S('config');
      if (visible) { if (!has(/HIMEM\.SYS/i)) this.println('WARNING: HIMEM.SYS not loaded. JackOS will pretend it was.'); if (this.cfg.sound) { this.println('JackBlaster 16 driver loaded. PC speaker now 16-bit (it isn\'t).'); S('blaster'); } if (DOS.ramdrive) this.println('JackOS RAMDrive version 3.07 virtual disk E:\n    Disk size: 4,096k   Sector size: 512 bytes   (vanishes when you switch off)'); }
      this.mouse = false; this.cd = false;
      const ae = A.fs.get('C:/AUTOEXEC.BAT');
      if (ae) { const prevOut = this.out; const prevEcho = this.echo; if (!visible) this.out = []; this.echo = false; this.booting = true; try { await this.runBatch(ae, ''); } catch (e) { /* a broken AUTOEXEC is very 1999 */ } this.booting = false; this.out = prevOut; this.echo = prevEcho; if (ae.dos) S('config'); }
      this.host.noMouse = !this.mouse;
    }
    // ---- output
    print(s) { if (this.out) { this.out.push(String(s)); return; } this.term.write(s); }
    println(s) { this.print((s == null ? '' : s) + '\n'); }
    get cols() { return this.host.screen.cols; }
    // ---- paths
    root(dr) { dr = dr || this.drive; return dr === 'C' ? A.fs.root : dr === 'D' ? cdRoot() : dr === 'A' ? floppyRoot() : dr === 'E' ? DOS.ramdrive || null : null; }
    pathStr(dr, nodes) { dr = dr || this.drive; nodes = nodes || this.cwd[dr]; let out = dr + ':\\', parent = this.root(dr); const parts = []; for (const n of nodes) { parts.push(short(parent, n)); parent = n; } return out + parts.join('\\'); }
    longPath(dr, nodes) { return dr + ':\\' + nodes.map(n => n.name).join('\\'); }
    fsPath(nodes) { return 'C:/' + nodes.map(n => n.name).join('/'); }
    // resolve "..\FOO\BAR.TXT" -> { dr, dirs:[...], node, parent, name }
    resolve(arg, o) {
      o = o || {};
      let s = String(arg || '').replace(/^"|"$/g, '').replace(/\//g, '\\');
      let dr = this.drive;
      const m = /^([a-zA-Z]):(.*)$/.exec(s); if (m) { dr = m[1].toUpperCase(); s = m[2]; }
      if (!'ACDE'.includes(dr) || (dr === 'E' && !DOS.ramdrive)) return { err: 'Invalid drive specification' };
      if (dr === 'A' && !this.floppyReady()) return { err: 'notready', dr };
      if (dr === 'D' && !this.cd) return { err: 'notready', dr };
      if (dr === 'E' && !this.cwd.E) this.cwd.E = [];
      const root = this.root(dr); if (!root) return { err: 'notready', dr };
      let dirs = s.startsWith('\\') ? [] : this.cwd[dr].slice();
      const parts = s.split('\\').filter((p, i) => p !== '' || i === 0).filter(Boolean);
      const last = parts.length ? parts[parts.length - 1] : '';
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i], isLast = i === parts.length - 1;
        if (p === '.') continue;
        if (/^\.{2,}$/.test(p)) { for (let k = 1; k < p.length; k++) dirs.pop(); continue; }
        const cur = dirs.length ? dirs[dirs.length - 1] : root;
        if (isLast && !o.dirOnly) { const k = findKid(cur, p); if (k && k.type === 'dir') dirs.push(k); else return { dr, dirs, parent: cur, node: k, name: p, wild: wild(p) }; continue; }
        const k = findKid(cur, p);
        if (!k || k.type !== 'dir') return { err: 'Invalid directory', dr, dirs };
        dirs.push(k);
      }
      void last;
      const node = dirs.length ? dirs[dirs.length - 1] : root;
      return { dr, dirs, node, parent: dirs.length > 1 ? dirs[dirs.length - 2] : root, name: node.name, isDir: true };
    }
    floppyReady() { return this.floppy.in && !!floppyRoot(); }
    async notReady(dr) {
      // the classic: Abort, Retry, Fail?
      for (;;) {
        this.println(`\nNot ready reading drive ${dr}`); this.print('Abort, Retry, Fail?');
        const k = await this.key('ARF');
        this.println(k);
        if (k === 'A') return 'abort';
        if (k === 'F') { S('fail'); return 'fail'; }
        if (dr === 'D') { if (++this.cdTries >= 2) { this.println('\nCDR101: Not ready reading drive D\n(MSCDEX isn\'t loaded. Look at the LH MSCDEX line in AUTOEXEC.BAT.)'); return 'abort'; } continue; }
        if (dr === 'A' && ++this.floppy.tries >= 3) {
          if (floppyRoot()) { this.floppy.in = true; window.Sound && Sound.play('thud'); this.println('\n*clunk* Oh. There WAS a disk in there. It says "DAVE\'S DISK" in felt tip.'); return 'ok'; }
          this.println('\nGeneral failure reading drive A'); this.print('Abort, Retry, Fail?'); const k2 = await this.key('ARF'); this.println(k2); if (k2 === 'F') S('fail'); return k2 === 'F' ? 'fail' : 'abort';
        }
      }
    }
    async key(allowed) { for (;;) { const e = await this.host.readKey(); if (e.ctrl && /^[cC]$/.test(e.key)) { this.host.brk = false; return allowed ? allowed[0] : ''; } const c = (e.ch || '').toUpperCase(); if (c && (!allowed || allowed.includes(c))) return c; if (e.key === 'Enter' && allowed && allowed.includes('\n')) return '\n'; if (!allowed && !c) return e.key; } }
    async pause(msg) { this.print(msg || 'Press any key to continue . . .'); const e = await this.host.readKey(); this.println(); if (e.ctrl && /^[cC]$/.test(e.key)) { this.host.brk = false; return false; } return true; }
    prompt() {
      const t = today(), now = new Date();
      return (this.env.PROMPT || '$p$g').replace(/\$(.)/g, (m, c) => {
        c = c.toLowerCase();
        return c === 'p' ? this.pathStr() : c === 'g' ? '>' : c === 'l' ? '<' : c === 'b' ? '|' : c === 'q' ? '=' : c === '$' ? '$' : c === 'n' ? this.drive : c === '_' ? '\n' : c === 'e' ? '\x1b' : c === 'h' ? '\b' : c === 'v' ? 'JackOS 98 [Version 4.10.1999]' : c === 't' ? `${p2(now.getHours())}:${p2(now.getMinutes())}:${p2(now.getSeconds())}.${p2(now.getMilliseconds() / 10 | 0)}` : c === 'd' ? `${DAYS[t.date.getDay()]} ${p2(t.d)}/${p2(t.m)}/1999` : '';
      });
    }
    saveState() { A.store.set('jhp_dos_hist', this.hist.slice(-50)); A.store.set('jhp_dos_env', { PROMPT: this.env.PROMPT }); }

    // ---- the main loop
    async loop(banner) {
      const t = this.term;
      if (banner !== false) { t.attr = 7; t.line(); t.line('JackOS(R) 98'); t.line('   (C)Copyright Jack 1981-1999. (He wasn\'t born in 1981. Nobody tell him.)'); t.line(); }
      while (!this.exitReq && !this.host.dead) {
        this.print(this.prompt());
        this.host.brk = false;
        const line = await K.readLine(this.host, { hist: this.hist, complete: s => this.complete(s), onF7: () => this.f7() });
        if (line == null) continue;
        this.saveState();
        await this.exec(line);
        if (this.out) this.out = null;
        if (this.term.x !== 0) this.println();
        this.println();
      }
    }
    async f7() {
      S('doskey');
      this.println(); this.hist.forEach((h, i) => this.println(`${lpad(i + 1, 3)}: ${h}`)); this.print(this.prompt());
    }
    complete(s) {
      // Tab completion on the last word against the current directory (long names, quoted if they have spaces)
      const m = /^(.*?)("?)([^"\s]*)$/.exec(s); if (!m) return [];
      const before = m[1], word = m[3];
      const slash = word.lastIndexOf('\\'), dirPart = slash >= 0 ? word.slice(0, slash + 1) : (/^[a-z]:/i.test(word) ? word.slice(0, 2) : ''), stem = word.slice(dirPart.length).toLowerCase();
      const r = dirPart ? this.resolve(dirPart || '.', { dirOnly: true }) : { node: this.cwd[this.drive].length ? this.cwd[this.drive][this.cwd[this.drive].length - 1] : this.root() };
      if (!r || r.err || !r.node || !r.node.kids) return [];
      const dir = r.node, first = !before.trim();
      return dir.kids.filter(k => !k.hidden && (k.name.toLowerCase().startsWith(stem) || short(dir, k).toLowerCase().startsWith(stem)))
        .filter(k => !first || k.type === 'dir' || /\.(exe|com|bat)$/i.test(k.name) || true)
        .map(k => { const n = /\s/.test(k.name) ? (k.name.toLowerCase().startsWith(stem) ? k.name : short(dir, k)) : k.name; const full = dirPart + n; return before + (/\s/.test(full) ? '"' + full + '"' : full); });
    }

    // ---- parse + run one command line (with |, > and >>)
    async exec(line, batch) {
      line = String(line);
      if (!batch) line = line.replace(/%([A-Za-z_][\w]*)%/g, (m, v) => this.env[v.toUpperCase()] != null ? this.env[v.toUpperCase()] : m);
      if (!line.trim()) return;
      // pipes
      const parts = splitOutside(line, '|');
      if (parts.length > 1) {
        let input = null;
        for (let i = 0; i < parts.length; i++) {
          const last = i === parts.length - 1;
          const buf = [];
          const prev = this.out; this.out = last ? prev : buf; this.stdin = input;
          await this.exec1(parts[i].trim(), batch);
          this.out = prev; this.stdin = null;
          input = buf.join('');
        }
        return;
      }
      await this.exec1(line, batch);
    }
    async exec1(line, batch) {
      // redirection
      let redir = null;
      const rm = /^(.*?)(>>?)\s*("[^"]+"|[^\s>]+)\s*$/.exec(line);
      if (rm && !/^\s*echo\.?\s*$/i.test(rm[1]) && !/^\s*rem\b/i.test(line)) { line = rm[1]; redir = { app: rm[2] === '>>', file: rm[3].replace(/"/g, '') }; }
      let inFile = null; const im = /^(.*?)<\s*("[^"]+"|\S+)\s*$/.exec(line); if (im && !/^\s*(echo|rem|prompt)\b/i.test(line)) { line = im[1]; inFile = im[2].replace(/"/g, ''); }
      if (inFile) { const r = this.resolve(inFile); if (r.err || !r.node || !isText(r.node)) { this.println('File not found'); return; } this.stdin = String(r.node.text || ''); }
      if (redir) {
        if (/^(nul|con|prn|lpt1)$/i.test(redir.file)) { const prev = this.out; this.out = /^con$/i.test(redir.file) ? prev : []; await this.run(line, batch); this.out = prev; if (/^(prn|lpt1)$/i.test(redir.file)) this.println('Printer out of cyan. Write fault error writing device PRN'); return; }
        const buf = [], prev = this.out; this.out = buf;
        await this.run(line, batch);
        this.out = prev;
        const r = this.resolve(redir.file);
        if (r.err) { this.println(r.err === 'notready' ? 'Write protect error writing drive ' + r.dr : r.err); return; }
        const old = r.node && redir.app && isText(r.node) ? String(r.node.text || '') : '';
        const w = this.writeFile(r, old + buf.join('').replace(/\x1b\[[0-9;]*[A-Za-z]/g, ''));
        if (w) this.println(w);
        return;
      }
      await this.run(line, batch);
    }
    // write a file (returns an error string or '')
    writeFile(r, text) {
      if (r.dr === 'E') { if (r.node && r.node.type === 'dir') return 'Access denied'; const name = r.node ? r.node.name : r.name; if (!name || /[*?"<>|]/.test(name)) return 'Invalid filename'; const used = (function sum(n) { return (n.kids || []).reduce((a, k) => a + (k.type === 'dir' ? sum(k) : String(k.text || '').length), 0); })(DOS.ramdrive); if (used + String(text).length > 4194304) return 'Insufficient disk space'; if (r.node) { r.node.text = String(text); r.node.date = dateOfToday(); } else r.parent.kids.push({ name, type: /\.bas$/i.test(name) ? 'bas' : /\.ans$/i.test(name) ? 'ans' : 'txt', text: String(text), date: dateOfToday(), dos: true, ram: true }); return ''; }
      if (r.dr !== 'C') return r.dr === 'D' ? 'Write protect error writing drive D' : 'Write protect error writing drive A';
      if (r.node && r.node.type === 'dir') return 'Access denied';
      if (r.node && !canW(r.node) && !isCfg(r)) return 'Access denied - ' + short(r.parent, r.node) + ' is read-only (it\'s one of Jack\'s)';
      const name = r.node ? r.node.name : r.name;
      if (!name || /[*?"<>|]/.test(name)) return 'Invalid filename';
      const res = DOS.fsx.write(this.fsPath(r.dirs), name, text);
      return res.err || '';
    }
    // split args, keeping quoted strings
    args(s) { const out = []; const rx = /"([^"]*)"|(\S+)/g; let m; while ((m = rx.exec(s))) out.push(m[1] != null ? m[1] : m[2]); return out; }
    switches(list) { const sw = {}; const rest = []; for (const a of list) { if (/^\/./.test(a)) a.slice(1).split('/').forEach(x => { const k = x[0].toUpperCase(); sw[k] = x.slice(1).replace(/^:/, '') || true; }); else rest.push(a); } return [sw, rest]; }

    async run(line, batch) {
      let raw = line.replace(/^\s*@/, '').trim();
      if (!raw) return;
      // "cd.." "cd\" "dir/w" etc. need no space after the command
      let cmd, rest;
      const first = /^"([^"]+)"|^(\S+)/.exec(raw), tok = first ? (first[1] != null ? first[1] : first[2]) : raw;
      if (/[\\:]/.test(tok) && !/^[a-z]:$/i.test(tok)) { cmd = tok; rest = raw.slice(first[0].length); }
      else { const m = /^([^\s\\/.;,=+"]+|\.\.?)((?:[\\/.;,=+"].*|\s.*)?)$/s.exec(raw) || [raw, raw, '']; cmd = m[1]; rest = (m[2] || ''); }
      if (/^[a-z]:$/i.test(raw)) return this.changeDrive(raw[0].toUpperCase());
      const C = cmd.toUpperCase();
      const argStr = rest.replace(/^\s/, '');
      // ---- internal commands
      const fn = INTERNAL[C];
      if (fn && !/[\\:]/.test(cmd)) { this.err = 0; return fn.call(this, argStr, batch, rest); }
      // ---- DOS programs the shell knows (no PATH needed; it's friendlier than real DOS and Kevin would disapprove)
      const pk0 = C.toLowerCase().replace(/\.(exe|com)$/, ''), pk = (DOS.PROGALIAS && DOS.PROGALIAS[pk0]) || pk0; // JACKQUEST etc. are the old GROT* programs
      if (!/[\\:]/.test(cmd) && (DOS.progs[pk] || DOS.PROGPACK[pk]) && !/^(command|mouse|mscdex|win_com|dir_type)$/.test(pk)) return this.prog(pk, argStr);
      // ---- programs on the PATH
      const exe = this.findExe(cmd);
      if (exe) return this.launch(exe, argStr, batch);
      if (await this.egg(C, argStr, raw)) return;
      // a JackOS program typed at the prompt (JackOS 98 lets you do that) - but never one of our own DOS launchers
      if (this.mode === 'win' && /^[a-z0-9 ._-]+$/i.test(raw) && !A.fs.find(raw) && !/\.(com|co\.uk)$|^www\./i.test(raw) && !/^(command|cmd|dos|msdos|ms-dos|dosprmpt|conagent|jbasic|qbasic|qb|basic|gwbasic|jackquest|grotquest|gq|zork|adventure|advent|gc|jackcmd|grotcmd|nc|norton|dosedit|ansi|ansiview|autoexec|deltree|format|fdisk|mem|msd|chkdsk|debug|tree|matrix|xyzzy|mode|rogue|roguelike|lemonade|wumpus|demo|tracker)\b/i.test(raw)) {
        let ok = false; try { ok = A.run(raw); } catch (e) { ok = false; }
        if (ok) return;
      }
      this.println('Bad command or file name');
    }
    changeDrive(d) {
      if (d === 'C') { this.drive = d; return; }
      if (d === 'E') { if (!DOS.ramdrive) { this.println('Invalid drive specification'); return; } this.cwd.E = this.cwd.E || []; this.drive = 'E'; return; }
      if (d === 'D') return (async () => { if (!this.cd) { const r = await this.notReady('D'); if (r !== 'ok') return; } this.drive = 'D'; })();
      if (d === 'A') return (async () => { if (!this.floppyReady()) { const r = await this.notReady('A'); if (r === 'fail') { this.println('Current drive is no longer valid'); return; } if (r !== 'ok') return; } this.drive = 'A'; })();
      this.println('Invalid drive specification');
    }
    findExe(cmd) {
      const hasExt = /\.(exe|com|bat)$/i.test(cmd);
      const tryIn = (dirNode, name) => { if (!dirNode) return null; for (const e of hasExt ? [''] : ['.COM', '.EXE', '.BAT', '']) { const k = findKid(dirNode, name + e); if (k && k.type !== 'dir' && (/\.(exe|com|bat)$/i.test(k.name) || k.type === 'exe')) return { node: k, dir: dirNode }; } return null; };
      if (/[\\:]/.test(cmd)) { const r = this.resolve(cmd.replace(/\.(exe|com|bat)$/i, '')); const r2 = this.resolve(cmd); const base = r2 && !r2.err && r2.node && r2.node.type !== 'dir' ? { node: r2.node, dir: r2.parent } : (!r.err && r.parent ? tryIn(r.parent, r.name) : null); return base; }
      const cur = this.cwd[this.drive].length ? this.cwd[this.drive][this.cwd[this.drive].length - 1] : this.root();
      let hit = tryIn(cur, cmd); if (hit) return hit;
      for (const p of (this.env.PATH || '').split(';').filter(Boolean)) { const r = this.resolve(p, { dirOnly: true }); if (r && !r.err && r.node && r.node.kids) { hit = tryIn(r.node, cmd); if (hit) return hit; } }
      return null;
    }
    async launch(x, args, batch) {
      const n = x.node;
      if (/\.bat$/i.test(n.name)) return this.runBatch(n, args, batch);
      if (n.app === 'dos.run' || n.dosprog) return this.prog(n.dosprog || n.arg, args, n);
      if (n.app === 'files.run' && n.arg === 'command') return this.prog('command', args, n);
      if (this.mode === 'dos') { this.println('This program cannot be run in DOS mode.'); return; }
      if (n.type === 'exe' || n.app) { try { A.openFile(n); } catch (e) { this.println('This program has performed an illegal operation.'); } return; }
      this.println('Bad command or file name');
    }
    async prog(name, args, node) {
      name = (DOS.PROGALIAS && DOS.PROGALIAS[name]) || name;
      const P = DOS.progs[name];
      if (P) return P(this, args, node);
      const pack = DOS.PROGPACK[name];
      if (pack) {
        try { await DOS.need(pack); } catch (e) { this.println('Error loading ' + name.toUpperCase() + ': Not enough memory (or the modem hung up).'); return; }
        if (DOS.progs[name]) return DOS.progs[name](this, args, node);
      }
      this.println('Program too big to fit in memory');
    }
    // ---- batch files
    async runBatch(node, args, parentBatch) {
      if (/^autoexec\.bat$/i.test(node.name) && !this.booting) S('autoexec');
      if (canW(node) && !/^autoexec/i.test(node.name) && !this.booting) S('batch');
      const lines = String(node.text || '').replace(/\r/g, '').split('\n');
      const b = { node, args: [node.name.replace(/\.bat$/i, '').toUpperCase(), ...this.args(args || '')], echo: this.echo, i: 0 };
      const labels = {}; lines.forEach((l, i) => { const mm = /^\s*:(\S+)/.exec(l); if (mm) labels[mm[1].toUpperCase()] = i; });
      let steps = 0;
      while (b.i < lines.length && !this.exitReq) {
        if (this.host.brk) { this.host.brk = false; this.print('^C\nTerminate batch job (Y/N)?'); const k = await this.key('YN'); this.println(k); if (k === 'Y') return 'stop'; }
        if (++steps % 40 === 0) await new Promise(r => setTimeout(r, 0));
        if (steps > 5000) { this.println('Batch file ran for too long. Out of environment space.'); return; }
        let l = lines[b.i++];
        if (/^\s*:/.test(l) || !l.trim()) continue;
        l = l.replace(/%(\d)/g, (mm, d) => b.args[+d] || '').replace(/%([A-Za-z_][\w]*)%/g, (mm, v) => this.env[v.toUpperCase()] || '').replace(/%%/g, '%');
        const at = /^\s*@/.test(l); l = l.replace(/^\s*@/, '');
        if (this.echo && !at) { this.println(); this.println(this.prompt() + l); }
        const u = l.trim().toUpperCase();
        if (/^GOTO\s+:?(\S+)/.test(u)) { const lab = /^GOTO\s+:?(\S+)/.exec(u)[1]; if (labels[lab] == null) { this.println('Label not found'); return; } b.i = labels[lab] + 1; continue; }
        if (/^SHIFT\b/.test(u)) { b.args.splice(1, 1); continue; }
        if (/^IF\b/.test(u)) { const r = this.ifCond(l.trim().slice(2).trim()); if (r == null) { this.println('Syntax error'); continue; } if (r.ok) { const cm = r.rest; if (/^GOTO\s+:?(\S+)/i.test(cm)) { const lab = /^GOTO\s+:?(\S+)/i.exec(cm)[1].toUpperCase(); if (labels[lab] == null) { this.println('Label not found'); return; } b.i = labels[lab] + 1; continue; } const res = await this.exec(cm, b); if (res === 'stop') return 'stop'; } continue; }
        if (/^CALL\s+/.test(u)) { const cm = l.trim().slice(5).trim(); const r = this.findExe(this.args(cm)[0] || ''); if (r && /\.bat$/i.test(r.node.name)) { const res = await this.runBatch(r.node, cm.slice((this.args(cm)[0] || '').length), b); if (res === 'stop') return 'stop'; } else await this.exec(cm, b); continue; }
        const exe = this.findExe(this.args(l)[0] || '');
        if (exe && /\.bat$/i.test(exe.node.name)) { await this.runBatch(exe.node, l.trim().slice((this.args(l)[0] || '').length), b); return; } // chaining without CALL never comes back
        const res = await this.exec(l, b);
        if (res === 'stop') return 'stop';
      }
    }
    ifCond(s) {
      let not = false; let m;
      if (/^NOT\s+/i.test(s)) { not = true; s = s.replace(/^NOT\s+/i, ''); }
      if ((m = /^ERRORLEVEL\s+(\d+)\s+(.*)$/i.exec(s))) return { ok: (this.err >= +m[1]) !== not, rest: m[2] };
      if ((m = /^EXIST\s+(\S+)\s+(.*)$/i.exec(s))) { const r = this.resolve(m[1]); const ok = !r.err && (r.node || (r.wild && (r.parent.kids || []).some(k => r.wild.test(k.name) || r.wild.test(short(r.parent, k))))); return { ok: !!ok !== not, rest: m[2] }; }
      if ((m = /^"?([^"=]*)"?\s*==\s*"?([^"\s]*)"?\s+(.*)$/i.exec(s))) return { ok: (m[1].trim().toUpperCase() === m[2].trim().toUpperCase()) !== not, rest: m[3] };
      return null;
    }
    dirNode() { const c = this.cwd[this.drive]; return c.length ? c[c.length - 1] : this.root(); }
    async need(res) { if (res.err === 'notready') { const r = await this.notReady(res.dr); if (r === 'ok') return true; if (r === 'fail') this.println(res.dr === 'A' ? 'Fail on INT 24' : ''); return false; } if (res.err) { this.println(res.err); return false; } return true; }
    // easter eggs + jokes for things that are not commands
    async egg(C, a, raw) {
      const E = EGGS[C] || EGGS[raw.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim()];
      if (!E) return false;
      const r = typeof E === 'function' ? await E.call(this, a, raw) : E;
      if (typeof r === 'string') this.println(r);
      return true;
    }
  }
  function splitOutside(s, ch) { const out = []; let cur = '', q = false; for (const c of s) { if (c === '"') q = !q; if (c === ch && !q) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; }

  // ================================================================ internal commands
  const HELP = {
    ATTRIB: 'Displays or changes file attributes.\n\nATTRIB [+R | -R] [+A | -A] [+S | -S] [+H | -H] [[drive:][path]filename] [/S]\n\n  +   Sets an attribute.      -   Clears an attribute.\n  R   Read-only file attribute.  A  Archive.  S  System.  H  Hidden.\n  /S  Processes files in all directories in the specified path.\n\n(You can only change attributes on your own files. Jack\'s are glued on.)',
    CD: 'Displays the name of or changes the current directory.\n\nCHDIR [drive:][path]\nCHDIR[..]\nCD [drive:][path]\nCD[..]\n\n  ..   Specifies that you want to change to the parent directory.\n\nType CD drive: to display the current directory in the specified drive.\nType CD without parameters to display the current drive and directory.',
    CLS: 'Clears the screen.\n\nCLS',
    COPY: 'Copies one or more files to another location.\n\nCOPY source [destination]\nCOPY CON filename      Type a new file. Press F6 or Ctrl+Z then Enter to finish.',
    DATE: 'Displays or sets the date.\n\nDATE [date]\n\n(It is 1999. It will always be 1999. Mom set it.)',
    DEL: 'Deletes one or more files.\n\nDEL [drive:][path]filename [/P]\nERASE [drive:][path]filename [/P]\n\n  /P   Prompts for confirmation before deleting each file.',
    DELTREE: 'Deletes a directory and all the subdirectories and files in it.\n\nDELTREE [/Y] [drive:]path\n\n  /Y   Suppresses prompting to confirm you want to delete the subdirectory.\n\nUse DELTREE cautiously. Every file and subdirectory within the specified\ndirectory will be deleted. (Unless Mom says no.)',
    DIR: 'Displays a list of files and subdirectories in a directory.\n\nDIR [drive:][path][filename] [/P] [/W] [/A[[:]attributes]] [/O[[:]sortorder]] [/S] [/B] [/L]\n\n  /P   Pauses after each screenful of information.\n  /W   Uses wide list format.\n  /A   Displays files with specified attributes (H hidden, S system, D dirs).\n  /O   List by files in sorted order (N name, S size, E extension, D date).\n  /S   Displays files in specified directory and all subdirectories.\n  /B   Uses bare format (no heading information or summary).\n  /L   Uses lowercase.',
    ECHO: 'Displays messages, or turns command-echoing on or off.\n\n  ECHO [ON | OFF]\n  ECHO [message]\n\nType ECHO without parameters to display the current echo setting.',
    EDIT: 'JackOS Editor  Version 2.0.026 (JackOS edition)\n\nEDIT [/B] [/H] [/R] [file(s)]\n\n  /B   Allows use of a monochrome monitor (you have a colour one. Mom checked.)\n  /R   Load file(s) in read-only mode.',
    EXIT: 'Quits the COMMAND.COM program (command interpreter).\n\nEXIT',
    FORMAT: 'Formats a disk for use with JackOS.\n\nFORMAT drive: [/V[:label]] [/Q] [/U] [/S]\n\n  /Q   Performs a quick format.   /S  Copies system files.\n\n(Formatting erases EVERYTHING. Dad has a list of who is allowed to do this.\nIt is just Dad.)',
    MD: 'Creates a directory.\n\nMKDIR [drive:]path\nMD [drive:]path',
    MEM: 'Displays the amount of used and free memory in your system.\n\nMEM [/CLASSIFY | /DEBUG | /FREE | /MODULE modulename] [/PAGE]\n\n  /CLASSIFY or /C  Classifies programs by memory usage.\n  /FREE or /F      Displays information about the amount of free memory left.\n  /PAGE or /P      Pauses after each screenful of output.',
    PATH: 'Displays or sets a search path for executable files.\n\nPATH [[drive:]path[;...]]\nPATH ;\n\nType PATH ; to clear all search-path settings.',
    PROMPT: 'Changes the command prompt.\n\nPROMPT [text]\n\n  $Q   = (equal sign)          $$   $ (dollar sign)\n  $T   Current time            $D   Current date\n  $P   Current drive and path  $V   JackOS version number\n  $N   Current drive           $G   > (greater-than sign)\n  $L   < (less-than sign)      $B   | (pipe)\n  $H   Backspace               $E   Escape code (ANSI colours!)\n  $_   Carriage return and linefeed\n\nType PROMPT without parameters to reset the prompt.',
    RD: 'Removes (deletes) a directory.\n\nRMDIR [drive:]path\nRD [drive:]path\n\nThe directory has to be empty first.',
    REN: 'Renames a file or files.\n\nRENAME [drive:][path]filename1 filename2\nREN [drive:][path]filename1 filename2',
    SET: 'Displays, sets, or removes JackOS environment variables.\n\nSET [variable=[string]]',
    TREE: 'Graphically displays the directory structure of a drive or path.\n\nTREE [drive:][path] [/F] [/A]\n\n  /F   Display the names of the files in each directory.\n  /A   Use ASCII instead of extended characters.',
    TYPE: 'Displays the contents of text files.\n\nTYPE [drive:][path]filename',
    VER: 'Displays the JackOS version.\n\nVER',
    VOL: 'Displays the disk volume label and serial number, if they exist.\n\nVOL [drive:]',
    MODE: 'Configures the screen.\n\nMODE CON COLS=40|80 [LINES=25|43|50]\nMODE 40   MODE 80   MODE CO80   MODE BW80',
    CHOICE: 'Waits for you to choose one of a set of choices.\n\nCHOICE [/C[:]choices] [/N] [text]\n\n  /C[:]choices  Specifies allowable keys. Default is YN\n  /N            Do not display choices and ? at end of prompt string.\n\nERRORLEVEL is set to offset of key you press in choices.',
    DOSKEY: 'Edits command lines, recalls JackOS commands, and creates macros.\n\nDOSKEY [/HISTORY]\n\n  UP, DOWN arrows recall commands     F7 displays command history\n  ESC clears current command          F3 repeats the last command\n  TAB finishes a filename (a JackOS extra. Real DOS can\'t do that!)',
    FIND: 'Searches for a text string in a file or files.\n\nFIND [/V] [/C] [/N] [/I] "string" [[drive:][path]filename[ ...]]',
    MORE: 'Displays output one screen at a time.\n\nMORE < [drive:][path]filename\ncommand-name | MORE',
    JBASIC: 'JBASIC  Version 1.1  - Jack\'s BASIC (QBasic-ish)\n\nJBASIC [[/RUN] [drive:][path]filename]\n\n  /RUN   Runs the specified program before displaying it.',
    START: 'Runs a JackOS program or an MS-DOS program.\n\nSTART program',
    XCOPY: 'Copies files and directory trees.\n\nXCOPY source [destination] [/S]',
    CHKDSK: 'Checks a disk and displays a status report.\n\nCHKDSK [drive:]',
    FC: 'Compares two files and displays the differences between them.\n\nFC [/C] [drive1:][path1]filename1 [drive2:][path2]filename2\n\n  /C   Disregards the case of letters.',
    COMP: 'Compares the contents of two files byte by byte.\n\nCOMP file1 file2',
    PRINT: 'Prints a text file. (On the printer that is out of cyan.)\n\nPRINT [drive:][path]filename',
    EDLIN: 'The line editor from 1981. Dad used it. Dad is sorry.\n\nEDLIN [drive:][path]filename\n\n  L     list     nI  insert before line n     nD  delete line n\n  n     edit line n     E  save and exit     Q  quit without saving',
    SQUASH: 'Squashes files into a .SQZ archive (like WinJack, but DOS, and registered).\n\nSQUASH archive[.SQZ] file [file...]\nUNSQUASH archive[.SQZ]      lists and extracts into the current directory\nSQUASH /L archive            lists only',
    DOSSHELL: 'The JackOS Shell: a menu for people who don\'t like typing.\n\nDOSSHELL',
    TRUENAME: 'Shows the real path of a file (the short one).\n\nTRUENAME [file]',
  };
  HELP.CHDIR = HELP.CD; HELP.MKDIR = HELP.MD; HELP.RMDIR = HELP.RD; HELP.RENAME = HELP.REN; HELP.ERASE = HELP.DEL;
  const CMDLIST = 'ATTRIB BREAK CALC CD CHKDSK CHOICE CLS COMP COPY DATE DEBUG DEFRAG DEL DELTREE DIR DISKCOPY DOSKEY DOSSHELL ECHO EDIT EDLIN EXIT FC FDISK FIND FORMAT GC JACKQUEST JACKSCAN HELP HEXED INTRO JBASIC LABEL MD MEM MODE MORE MOVE MSD PATH PAUSE PRINT PROMPT RD REN SCANDISK SET SORT SQUASH START SUBST TIME TPAINT TREE TRUENAME TYPE UNSQUASH VER VOL XCOPY'.split(' ');

  function listDir(sh, r, sw) {
    const dir = r.node && r.node.type === 'dir' && !r.wild ? r.node : r.parent;
    let kids = (dir.kids || []).slice();
    const a = sw.A; const showHidden = a === true || /h/i.test(a || '');
    if (r.wild) kids = kids.filter(k => r.wild.test(k.name) || r.wild.test(short(dir, k)));
    else if (r.node && r.node.type !== 'dir') kids = [r.node];
    if (typeof a === 'string') { if (/^-?d$/i.test(a)) kids = kids.filter(k => (k.type === 'dir') !== /^-/.test(a)); if (/h/i.test(a)) kids = kids.filter(k => k.hidden); }
    else if (!showHidden) kids = kids.filter(k => !k.hidden);
    const o = sw.O; if (o) { const key = String(o === true ? 'GN' : o).toUpperCase(); const rev = key.includes('-'); const by = key.replace(/[-G]/g, '')[0] || 'N';
      const d2 = k => { const m = /(\d\d)\/(\d\d)\/(\d\d)/.exec(dateOf(k)); return m ? (+m[3] < 50 ? 2000 : 1900) * 10000 + +m[3] * 10000 + +m[2] * 100 + +m[1] : 0; };
      kids.sort((x, y) => { if (key.includes('G') || o === true) { const g = (y.type === 'dir') - (x.type === 'dir'); if (g) return g; } const v = by === 'S' ? bytesOf(x) - bytesOf(y) : by === 'E' ? ext(x).localeCompare(ext(y)) : by === 'D' ? d2(x) - d2(y) : short(dir, x).localeCompare(short(dir, y)); return rev ? -v : v; }); }
    return { dir, kids };
  }
  function dirDate(k) { const m = /(\d\d)\/(\d\d)\/(\d\d)/.exec(dateOf(k)); return m ? `${m[1]}/${m[2]}/${m[3]}` : '01/01/99'; }
  const freeBytes = dr => dr === 'C' ? 1299226624 - DOS.fsx.used() : dr === 'E' && DOS.ramdrive ? 4194304 - (function sum(n) { return (n.kids || []).reduce((a, k) => a + (k.type === 'dir' ? sum(k) : String(k.text || '').length), 0); })(DOS.ramdrive) : 0;

  const INTERNAL = {
    async DIR(argStr) {
      const [sw, rest] = this.switches(this.args(argStr));
      const r = this.resolve(rest[0] || '.'); if (!await this.need(r)) return;
      if (!r.node && !r.wild) { this.println(` Volume in drive ${r.dr} is ${LABELS[r.dr]}\n Volume Serial Number is ${SERIAL[r.dr]}\n Directory of ${this.pathStr(r.dr, r.dirs)}\n\nFile not found`); return; }
      const lc = sw.L ? s => s.toLowerCase() : s => s;
      let lines = 0, tf = 0, tb = 0, td = 0;
      const rows = this.host.screen.rows;
      const out = async s => { this.println(s); if (sw.P && !this.out && ++lines >= rows - 2) { lines = 0; if (!await this.pause('Press any key to continue . . .')) return false; } if (this.host.brk) { this.host.brk = false; this.println('^C'); return false; } return true; };
      const one = async (rr, dirs) => {
        const { dir, kids } = listDir(this, rr, sw);
        if (sw.B) { for (const k of kids) { if (!await out(lc(sw.S ? this.longPath(rr.dr, dirs) + '\\' + k.name : k.name))) return false; } return true; }
        if (sw.S && !kids.length) return true;
        if (!await out(` Directory of ${this.pathStr(rr.dr, dirs)}`)) return false; if (!await out('')) return false;
        let nf = 0, nb = 0, nd = 0;
        if (sw.W) {
          const cells = []; if (dirs.length && !rr.wild) cells.push('[.]', '[..]');
          for (const k of kids) { const sn = short(dir, k); if (k.type === 'dir') { cells.push('[' + sn + ']'); nd++; } else { cells.push(sn); nf++; nb += bytesOf(k); } }
          const per = Math.max(1, Math.floor(this.cols / 16));
          for (let i = 0; i < cells.length; i += per) if (!await out(lc(cells.slice(i, i + per).map(c => pad(c, 16)).join('').replace(/\s+$/, '')))) return false;
        } else {
          if (dirs.length && !rr.wild && !(rr.node && rr.node.type !== 'dir')) { const d0 = dirs[dirs.length - 1]; if (!await out(lc(pad('.', 9) + '    ' + pad('<DIR>', 12) + ' ' + dirDate(d0) + '  ' + timeOf(d0) + ' .'))) return false; if (!await out(lc(pad('..', 9) + '    ' + pad('<DIR>', 12) + ' ' + dirDate(d0) + '  ' + timeOf(d0) + ' ..'))) return false; nd += 2; }
          for (const k of kids) {
            const sn = short(dir, k), dot = sn.lastIndexOf('.'), b = dot > 0 ? sn.slice(0, dot) : sn, e = dot > 0 ? sn.slice(dot + 1) : '';
            const sz = k.type === 'dir' ? pad('<DIR>', 12) : lpad(commas(bytesOf(k)), 12);
            const longn = this.cols >= 80 ? ' ' + k.name : '';
            const line = this.cols >= 80 ? `${pad(b, 8)} ${pad(e, 3)} ${sz}  ${dirDate(k)}  ${timeOf(k)}${longn}` : `${pad(b, 8)} ${pad(e, 3)} ${k.type === 'dir' ? pad('<DIR>', 10) : lpad(commas(bytesOf(k)), 10)} ${dirDate(k)}`;
            if (!await out(lc(line))) return false;
            if (k.type === 'dir') nd++; else { nf++; nb += bytesOf(k); }
          }
        }
        tf += nf; tb += nb; td += nd;
        if (!await out(`${lpad(commas(nf), 10)} file(s)${lpad(commas(nb), 15)} bytes`)) return false;
        if (!sw.S) { if (!await out(this.cols >= 80 ? `${lpad(commas(nd), 10)} dir(s)${lpad(commas(freeBytes(rr.dr)), 16)} bytes free` : `${lpad(commas(nd), 6)} dir(s) ${commas(freeBytes(rr.dr))} bytes free`)) return false; }
        else if (!await out('')) return false;
        if (sw.S) for (const k of dir.kids || []) if (k.type === 'dir' && (!k.hidden || sw.A)) { if (!await one({ dr: rr.dr, node: k, parent: dir, wild: rr.wild, dirs: [...dirs, k] }, [...dirs, k])) return false; }
        return true;
      };
      if (!sw.B) { await out(` Volume in drive ${r.dr} is ${LABELS[r.dr]}`); await out(` Volume Serial Number is ${SERIAL[r.dr]}`); }
      const dirs = r.node && r.node.type === 'dir' && !r.wild ? r.dirs : r.dirs;
      const ok = await one(r, dirs);
      if (ok && sw.S && !sw.B) { await out('     Total files listed:'); await out(`${lpad(commas(tf), 10)} file(s)${lpad(commas(tb), 15)} bytes`); await out(this.cols >= 80 ? `${lpad(commas(td), 10)} dir(s)${lpad(commas(freeBytes(r.dr)), 16)} bytes free` : `${lpad(commas(td), 6)} dir(s) ${commas(freeBytes(r.dr))} bytes free`); }
      if (sw.A && (sw.A === true || /h/i.test(sw.A))) { if ((r.node && r.node.kids || []).some(k => k.hidden)) S('hidden'); }
      if (!rest[0] && sw.W && sw.P) S('dirwp');
    },
    async CD(argStr) {
      const a = argStr.trim().replace(/^"|"$/g, '');
      if (!a) { this.println(this.pathStr()); return; }
      if (/^[a-z]:$/i.test(a)) { const d = a[0].toUpperCase(); this.println(this.pathStr(d)); return; }
      if (/^\.{3,}$/.test(a)) S('cdtrick');
      const r = this.resolve(a, { dirOnly: false }); if (!await this.need(r)) return;
      if (!r.isDir) { this.println('Invalid directory'); return; }
      if (r.node.locked && !(A.store.get('jhp_files_unlocked', {})[r.node.name])) { this.println('Access denied - this folder is locked. (Try Explorer. It\'ll ask for the password.)'); return; }
      this.cwd[r.dr] = r.dirs;
      if (/^C:\\JACKOS\\SYSTEM/i.test(this.pathStr(r.dr))) S('system');
    },
    async MD(argStr) {
      const a = this.args(argStr)[0]; if (!a) { this.println('Required parameter missing'); return; }
      const r = this.resolve(a); if (!await this.need(r)) return;
      if (r.dr === 'E') { if (r.node) { this.println('Directory already exists'); return; } r.parent.kids.push({ name: r.name, type: 'dir', kids: [], date: dateOfToday(), dos: true, ram: true }); return; }
      if (r.dr !== 'C') { this.println('Unable to create directory'); return; }
      if (r.node) { this.println('Directory already exists'); return; }
      if (!/^[^*?"<>|]{1,60}$/.test(r.name || '')) { this.println('Unable to create directory'); return; }
      const e = DOS.fsx.mkdir(this.fsPath(r.dirs), r.name); if (e) this.println(e);
    },
    async RD(argStr) {
      const r = this.resolve(this.args(argStr)[0] || ''); if (!await this.need(r)) return;
      if (!r.isDir || !r.dirs.length) { this.println('Invalid path, not directory,\nor directory not empty'); return; }
      if (this.cwd[r.dr].includes(r.node)) { this.println('Attempt to remove current directory'); return; }
      if (!canW(r.node)) { this.println('Access denied - that\'s one of Jack\'s directories.'); return; }
      if ((r.node.kids || []).length) { this.println('Invalid path, not directory,\nor directory not empty'); return; }
      if (r.dr === 'E') { r.parent.kids = r.parent.kids.filter(k => k !== r.node); return; }
      const e = DOS.fsx.remove(this.fsPath(r.dirs.slice(0, -1)), r.node); if (e) this.println(e);
    },
    async TYPE(argStr) {
      const files = this.args(argStr); if (!files.length) { this.println('Required parameter missing'); return; }
      for (const f of files) {
        const r = this.resolve(f); if (!await this.need(r)) return;
        const list = r.wild ? (r.parent.kids || []).filter(k => k.type !== 'dir' && (r.wild.test(k.name) || r.wild.test(short(r.parent, k)))) : r.node ? [r.node] : [];
        if (!list.length) { this.println(r.isDir ? 'Access denied' : 'File not found - ' + f.toUpperCase()); continue; }
        for (const n of list) {
          if (n.type === 'dir') { this.println('Access denied'); continue; }
          if (n.secret) try { A.secret(n.secret); } catch (e) {}
          if (list.length > 1) { this.println(); this.println(short(r.parent, n)); this.println(); }
          if (/\.ans$/i.test(n.name)) { if (!this.cfg.ansi) { S('noansi'); this.print(String(n.text || '').replace(/\x1b/g, '\u2190')); this.println('\n(That is what an .ANS file looks like without ANSI.SYS. Take the REM off the ANSI.SYS line in CONFIG.SYS.)'); continue; } S('ans'); this.print(String(n.text || '')); this.print('\x1b[0m'); this.term.attr = 7; continue; }
          if (n.type === 'exe' || /\.(exe|com)$/i.test(n.name)) { this.print(binJunk(n, 'MZ')); this.println(); continue; }
          if (n.type === 'img') { this.print(binJunk(n, /\.gif$/i.test(n.name) ? 'GIF89a' : 'BM')); this.println(); continue; }
          if (n.future) { this.println('Sharing violation reading drive C. (This file cannot be opened until 01/01/2000.)'); continue; }
          if (n.locked) { this.println('Access denied'); continue; }
          if (!isText(n)) { this.print(binJunk(n, '\u2302')); this.println(); continue; }
          const text = String(n.text || '');
          const lines = text.replace(/\r/g, '').split('\n');
          for (let i = 0; i < lines.length; i++) { this.print(lines[i] + (i < lines.length - 1 ? '\n' : '')); if (i % 25 === 24) { await new Promise(res => setTimeout(res, 0)); if (this.host.brk) { this.host.brk = false; this.println('^C'); return; } } }
          if (text && !text.endsWith('\n')) this.println();
        }
      }
    },
    async COPY(argStr) {
      const [sw, a] = this.switches(this.args(argStr)); void sw;
      if (!a.length) { this.println('Required parameter missing'); return; }
      if (/^con$/i.test(a[0])) { // COPY CON FILE.TXT: type a file straight in
        if (!a[1]) { this.println('Required parameter missing'); return; }
        const r = this.resolve(a[1]); if (!await this.need(r)) return;
        const lines = [];
        for (;;) {
          const l = await K.readLine(this.host, {});
          if (l == null) { this.println(); return; }
          const z = l.indexOf('^Z'); if (z >= 0) { if (z > 0) lines.push(l.slice(0, z)); break; }
          lines.push(l);
        }
        const e = this.writeFile(r, lines.join('\n') + (lines.length ? '\n' : ''));
        if (e) { this.println(e); this.println('        0 file(s) copied'); return; }
        this.println('        1 file(s) copied'); S('copycon'); return;
      }
      const src = this.resolve(a[0]); if (!await this.need(src)) return;
      let list = src.wild ? (src.parent.kids || []).filter(k => k.type !== 'dir' && (src.wild.test(k.name) || src.wild.test(short(src.parent, k)))) : src.node && src.node.type !== 'dir' ? [src.node] : src.isDir ? (src.node.kids || []).filter(k => k.type !== 'dir') : [];
      if (!list.length) { this.println('File not found - ' + a[0].toUpperCase()); this.println('        0 file(s) copied'); return; }
      const dst = this.resolve(a[1] || '.'); if (!await this.need(dst)) return;
      let n = 0;
      for (const f of list) {
        if (!isText(f)) { this.println(`${short(src.parent || src.node, f)}\nCannot copy ${f.name}: JackOS can only copy text files. (The rest are glued to the disk.)`); continue; }
        const target = dst.isDir ? { dr: dst.dr, dirs: dst.dirs, parent: dst.node, node: findKid(dst.node, f.name), name: f.name } : list.length > 1 ? null : dst;
        if (!target) { this.println('Cannot copy multiple files to a single file'); break; }
        if (target.node === f) { this.println('File cannot be copied onto itself'); continue; }
        const e = this.writeFile(target, String(f.text || ''));
        if (e) { this.println(e); continue; }
        if (list.length > 1) this.println(short(src.parent, f));
        n++;
      }
      this.println(`${lpad(n, 9)} file(s) copied`);
    },
    async DEL(argStr) {
      const [sw, a] = this.switches(this.args(argStr));
      if (!a.length) { this.println('Required parameter missing'); return; }
      const r = this.resolve(a[0]); if (!await this.need(r)) return;
      if (r.dr !== 'C' && r.dr !== 'E') { this.println('Write protect error writing drive ' + r.dr); return; }
      let list = r.wild ? (r.parent.kids || []).filter(k => k.type !== 'dir' && (r.wild.test(k.name) || r.wild.test(short(r.parent, k)))) : r.isDir ? (r.node.kids || []).filter(k => k.type !== 'dir') : r.node ? [r.node] : [];
      const dirPath = r.isDir ? this.fsPath(r.dirs) : this.fsPath(r.dirs);
      if (!list.length) { this.println('File not found'); return; }
      if ((r.wild && /^\*\.\*$|^\*$/.test(a[0].split('\\').pop())) || r.isDir) { this.print('All files in directory will be deleted!\nAre you sure (Y/N)?'); const k = await this.key('YN'); this.println(k); if (k !== 'Y') return; }
      let denied = 0;
      for (const f of list) {
        if (sw.P) { this.print(`${short(r.isDir ? r.node : r.parent, f)},    Delete (Y/N)?`); const k = await this.key('YN'); this.println(k); if (k !== 'Y') continue; }
        if (!canW(f)) { denied++; continue; }
        if (r.dr === 'E') { const d = r.isDir ? r.node : r.parent; d.kids = d.kids.filter(k => k !== f); continue; }
        DOS.fsx.remove(dirPath, f);
      }
      if (denied) this.println(denied === list.length && list.length === 1 ? (isSys(this.pathStr(r.dr, r.dirs)) ? 'Access denied. (Deleting things in JACKOS is how Dave broke his PC.)' : /^(AUTOEXEC\.BAT|CONFIG\.SYS)$/i.test(list[0].name) ? 'Access denied - that\'s Dad\'s original. (You can EDIT it, or COPY over it. DEL only removes YOUR version.)' : 'Access denied - that\'s one of Jack\'s files. (He\'d go mental.)') : `Access denied - ${denied} of Jack's file(s) were skipped.`);
    },
    async REN(argStr) {
      const a = this.args(argStr); if (a.length < 2) { this.println('Required parameter missing'); return; }
      const r = this.resolve(a[0]); if (!await this.need(r)) return;
      if (!r.node || r.isDir && !r.node.dos) { this.println(r.isDir ? 'Access denied' : 'File not found'); return; }
      if (!canW(r.node)) { this.println('Access denied - that\'s one of Jack\'s. You can COPY it to a new name instead.'); return; }
      const nn = a[1].split('\\').pop();
      if (findKid(r.isDir ? r.parent : r.parent, nn)) { this.println('Duplicate file name or file not found'); return; }
      if (r.dr === 'E') { r.node.name = nn; return; }
      const e = DOS.fsx.rename(this.fsPath(r.isDir ? r.dirs.slice(0, -1) : r.dirs), r.node, nn); if (e) this.println(e);
    },
    async MOVE(argStr) {
      const a = this.args(argStr); if (a.length < 2) { this.println('Required parameter missing'); return; }
      const r = this.resolve(a[0]); if (!await this.need(r)) return;
      if (!r.node || r.isDir) { this.println('File not found'); return; }
      if (!canW(r.node)) { this.println('Access denied - can\'t move Jack\'s files. Try COPY.'); return; }
      const d = this.resolve(a[1]); if (!await this.need(d)) return;
      const target = d.isDir ? { dr: d.dr, dirs: d.dirs, parent: d.node, node: findKid(d.node, r.node.name), name: r.node.name } : d;
      const e = this.writeFile(target, String(r.node.text || '')); if (e) { this.println(e); return; }
      DOS.fsx.remove(this.fsPath(r.dirs), r.node);
      this.println(`${this.pathStr(r.dr, r.dirs)}\\${short(r.parent, r.node)} => ${a[1].toUpperCase()} [ok]`);
    },
    CLS() { const t = this.term; t.attr = t.attr & 0xff; if (this.out) return; t.cls(); },
    VER(argStr) { this.println(); this.println('JackOS 98 [Version 4.10.1999]'); if (/\/R/i.test(argStr)) this.println('   Revision A\n   DOS is in HMA (High Memory Area)\n   Gubbinz is in HMA too. There is a lot of room up there.'); },
    async VOL(argStr) { const d = (/^([a-z]):/i.exec(argStr.trim()) || [0, this.drive])[1].toUpperCase(); if (d === 'A' && !this.floppyReady()) { const r = await this.notReady('A'); if (r !== 'ok') return; } if (!'ACD'.includes(d)) { this.println('Invalid drive specification'); return; } this.println(` Volume in drive ${d} is ${LABELS[d]}`); this.println(` Volume Serial Number is ${SERIAL[d]}`); },
    ECHO(argStr, batch, rest) {
      const a = rest.replace(/^[\s.]/, ''); const u = a.trim().toUpperCase();
      if (/^\./.test(rest)) { this.println(a); return; }
      if (!a.trim()) { this.println('ECHO is ' + (this.echo ? 'on' : 'off')); return; }
      if (u === 'ON' || u === 'OFF') { this.echo = u === 'ON'; return; }
      this.println(a);
    },
    REM() {},
    PAUSE() { return this.pause(); },
    async SET(argStr) {
      const a = argStr.trim();
      if (!a) { Object.keys(this.env).forEach(k => this.println(k + '=' + this.env[k])); return; }
      const m = /^([^=]+)=(.*)$/.exec(a); if (!m) { const v = this.env[a.toUpperCase()]; if (v != null) this.println(a.toUpperCase() + '=' + v); else this.println('Environment variable ' + a.toUpperCase() + ' not defined'); return; }
      const k = m[1].trim().toUpperCase(); if (m[2] === '') delete this.env[k]; else this.env[k] = m[2];
      if (Object.keys(this.env).length > 40) { delete this.env[k]; this.println('Out of environment space'); }
      if (k === 'PROMPT') this.saveState();
    },
    PATH(argStr) { const a = argStr.trim(); if (!a) { this.println(this.env.PATH ? 'PATH=' + this.env.PATH : 'No Path'); return; } this.env.PATH = a === ';' ? '' : a.replace(/^=/, '').toUpperCase(); },
    PROMPT(argStr) { const a = argStr.trim(); this.env.PROMPT = a || '$p$g'; if (/\$[tdvbqle_]/i.test(a)) S('prompt'); this.saveState(); },
    async DATE(argStr) {
      if (window.LeapDay && LeapDay.on) { this.println(LeapDay.dosDate()); return; } // 29/02: there isn't one in 1999 (leapday.js)
      const t = today();
      if (/^\/T/i.test(argStr.trim())) { this.println(`${DAYS[t.date.getDay()]} ${p2(t.d)}/${p2(t.m)}/1999`); return; }
      if (!argStr.trim()) { this.println(`Current date is ${DAYS[t.date.getDay()]} ${p2(t.d)}/${p2(t.m)}/1999`); this.print('Enter new date (dd-mm-yy): '); argStr = await K.readLine(this.host, { max: 12 }) || ''; }
      const v = argStr.trim(); if (!v) return;
      const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(v);
      if (!m) { this.println('Invalid date'); return; }
      const y = +m[3] < 100 ? (+m[3] < 80 ? 2000 + +m[3] : 1900 + +m[3]) : +m[3];
      if (y >= 2000) { S('y2k'); this.println('\nY2K PROTECTION ENGAGED.\nThe year 2000 has not happened yet. It is 1999. It will always be 1999.\n(The Y2K Checker says this PC is "probably fine". Nobody wants to test it.)'); return; }
      this.println('Access denied - MOM.SYS is in charge of the calendar.');
    },
    async TIME(argStr) {
      const d = new Date();
      if (/^\/T/i.test(argStr.trim())) { this.println(`${p2(d.getHours())}:${p2(d.getMinutes())}`); return; }
      if (!argStr.trim()) { this.println(`Current time is ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}.${p2(d.getMilliseconds() / 10 | 0)}`); this.print('Enter new time: '); argStr = await K.readLine(this.host, { max: 12 }) || ''; }
      const v = argStr.trim(); if (!v) return;
      if (!/^\d{1,2}(:\d{1,2}){0,2}(\.\d+)?$/.test(v)) { this.println('Invalid time'); return; }
      const h = +v.split(':')[0];
      if (h >= 20 && !this.cfg.bedtime) { S('bedtime'); this.println('Time set. MOM.SYS isn\'t loaded, so nobody noticed. Stay up as late as you like. (She will find out. She always finds out.)'); return; }
      this.println(h >= 20 ? 'Nice try. It\'s still bedtime at 8pm. (MOM.SYS /BEDTIME:8PM)' : 'The clock refuses to change. It has a job to do.');
    },
    EXIT() { if (this.o.noExit) { this.println('You can\'t exit the last shell. Type WIN to start JackOS.'); return; } this.exitReq = true; },
    async HELP(argStr) {
      const a = argStr.trim().toUpperCase();
      if (a && HELP[a]) { this.println(HELP[a]); return; }
      if (a) { this.println(`No help for "${a}". Try ${a} /?`); return; }
      S('help');
      this.println('JackOS 98 commands (type HELP command, or command /? for more):\n');
      const per = this.cols >= 80 ? 6 : 3;
      for (let i = 0; i < CMDLIST.length; i += per) this.println(CMDLIST.slice(i, i + per).map(c => pad(c, 12)).join(''));
      this.println('\nAlso: A: C: D: drives, | MORE, > FILE.TXT, batch files, and Alt+Enter for full screen.\nThere are secret commands. Jack won\'t tell you what they are. (Try reading his files.)');
    },
    async MEM(argStr) {
      const u = argStr.toUpperCase();
      if (/\/D/.test(u)) {
        this.println('\nConventional Memory Detail:\n\n  Segment       Total           Name           Type\n  -------   ----------------   -----------   --------');
        [['00000', 1024, '', 'Interrupt Vector'], ['00040', 256, '', 'ROM Communication Area'], ['00050', 512, '', 'DOS Communication Area'], ['00070', 2752, 'IO', 'System Data'], ['0011C', 5072, 'MSDOS', 'System Data'], ['00257', 8192, 'MOMSYS', 'DEVICE= (cannot be unloaded)'], ['00457', 7472, 'COMMAND', 'Program'], ['0062A', 412000, 'GUBBINZ', 'Program (eating)'], ['06A3A', 51200, 'SNACKS', 'Data (biscuits)'], ['0771A', 63664, 'MSDOS', '-- Free --']].forEach(([seg, sz, n, t]) => this.println(`  ${seg}   ${lpad(commas(sz), 9)}   (${lpad(Math.round(sz / 1024), 4)}K)   ${pad(n, 12)}  ${t}`));
        this.println('\nUpper Memory Detail:\n\n  C800     28,176   ( 28K)   MSCDEX    Program\n  CEE1     17,104   ( 17K)   MOUSE     Program (fluffy)\n  D310      4,688   (  5K)   DOSKEY    Program\n\nMemory Summary:\n\n  Type of Memory       Total       Used       Free\n  ----------------  ---------  ---------  ---------\n  Conventional        655,360    591,696     63,664\n  Upper                93,184     93,184          0\n  Extended (XMS)   65,967,104 65,967,104          0   <- Gubbinz. All of it.');
        return;
      }
      if (/\/C/.test(u)) {
        S('mem');
        this.println('\nModules using memory below 1 MB:\n');
        this.println('  Name           Total       Conventional      Upper Memory');
        this.println('  --------  ----------------   ----------------   ----------------');
        [['SYSTEM', 37440, 10816, 26624], ['HIMEM', 1168, 1168, 0], ['EMM386', 4320, 4320, 0], ['MOMSYS', 8192, 8192, 0], ['COMMAND', 7472, 7472, 0], ['MSCDEX', 28176, 0, 28176], ['MOUSE', 17104, 0, 17104], ['GUBBINZ', 412000, 412000, 0], ['SNACKS', 51200, 51200, 0], ['DOSKEY', 4688, 0, 4688], ['Free', 63664, 63664, 0]].forEach(([n, t, c, up]) => this.println(`  ${pad(n, 8)}${lpad(commas(t), 9)}   (${lpad(Math.round(t / 1024), 3)}K)${lpad(commas(c), 10)}   (${lpad(Math.round(c / 1024), 3)}K)${lpad(commas(up), 10)}   (${lpad(Math.round(up / 1024), 3)}K)`));
        this.println('\nGUBBINZ is using 412,000 bytes. Nobody knows what he\'s doing with them.\nSNACKS is a sub-module of GUBBINZ. It is mostly biscuits.');
        return;
      }
      this.println('\nMemory Type        Total  =   Used  +   Free');
      this.println('----------------  -------   -------   -------');
      this.println('Conventional         640K      578K       62K');
      this.println('Upper                 91K       91K        0K');
      this.println('Reserved             384K      384K        0K');
      this.println('Extended (XMS)    64,421K   64,421K        0K   (Gubbinz)');
      this.println('----------------  -------   -------   -------');
      this.println('Total memory      65,536K   65,474K       62K');
      this.println('\nTotal under 1 MB     731K      669K       62K');
      this.println('\nLargest executable program size        62K   (63,664 bytes)');
      this.println('Largest free upper memory block         0K        (0 bytes)');
      this.println('JackOS is resident in the high memory area. Gubbinz is resident everywhere.');
    },
    async CHKDSK(argStr) {
      const d = (/^([a-z]):/i.exec(argStr.trim()) || [0, this.drive])[1].toUpperCase();
      if (d !== 'C') { this.println(d === 'D' ? 'CHKDSK cannot check a CD-ROM. (It\'s shiny. It\'s fine.)' : 'Not ready reading drive ' + d); return; }
      let files = 0, dirs = 0, hid = 0, fb = 0, hb = 0;
      (function walk(n) { for (const k of n.kids || []) { if (k.type === 'dir') { dirs++; walk(k); } else if (k.hidden) { hid++; hb += bytesOf(k); } else { files++; fb += bytesOf(k); } } })(A.fs.root);
      const total = 5569708032, free = freeBytes('C');
      this.println(`\nVolume ${LABELS.C}     created 10/12/1998 20:00\nVolume Serial Number is ${SERIAL.C}\n`);
      this.println(`${lpad(commas(total), 15)} bytes total disk space`);
      this.println(`${lpad(commas(hb + 296960), 15)} bytes in ${hid + 3} hidden files`);
      this.println(`${lpad(commas(dirs * 4096), 15)} bytes in ${commas(dirs)} directories`);
      this.println(`${lpad(commas(total - free - hb - 296960 - dirs * 4096), 15)} bytes in ${commas(files)} user files (most of it is Dad's DOOM)`);
      this.println(`${lpad(commas(free), 15)} bytes available on disk\n`);
      this.println(`${lpad('4,096', 15)} bytes in each allocation unit\n${lpad(commas(total / 4096), 15)} total allocation units on disk\n${lpad(commas(free / 4096), 15)} available allocation units on disk\n`);
      this.println(`${lpad('655,360', 15)} total bytes memory\n${lpad('63,664', 15)} bytes free\n`);
      this.println('Instead of using CHKDSK, try using SCANDISK. SCANDISK can reliably detect\nand fix a much wider range of disk problems. (It also finds the grumpy sector.)');
    },
    async TREE(argStr) {
      const [sw, a] = this.switches(this.args(argStr));
      const r = this.resolve(a[0] || '.'); if (!await this.need(r)) return;
      if (!r.isDir) { this.println('Invalid path - ' + (a[0] || '').toUpperCase()); return; }
      const asc = !!sw.A, T = asc ? ['+---', '\\---', '|   ', '    '] : ['\u251c\u2500\u2500\u2500', '\u2514\u2500\u2500\u2500', '\u2502   ', '    '];
      this.println(`Directory PATH listing for Volume ${LABELS[r.dr]}\nVolume Serial Number is ${SERIAL[r.dr]}`);
      this.println(this.pathStr(r.dr, r.dirs));
      let n = 0, stop = false;
      const walk = async (dir, pre) => {
        const kids = (dir.kids || []).filter(k => !k.hidden);
        const ds = kids.filter(k => k.type === 'dir');
        if (sw.F) { const fs = kids.filter(k => k.type !== 'dir'); for (const f of fs) this.println(pre + (ds.length ? T[2] : '    ') + f.name); if (fs.length) this.println(pre + (ds.length ? T[2] : '')); }
        for (let i = 0; i < ds.length && !stop; i++) {
          const last = i === ds.length - 1;
          this.println(pre + (last ? T[1] : T[0]) + ds[i].name);
          if (++n % 30 === 0) { await new Promise(res => setTimeout(res, 0)); if (this.host.brk) { this.host.brk = false; this.println('^C'); stop = true; return; } }
          await walk(ds[i], pre + (last ? T[3] : T[2]));
        }
      };
      await walk(r.node, '');
    },
    async ATTRIB(argStr) {
      const [sw, a] = this.switches(this.args(argStr));
      const flags = a.filter(x => /^[+-][RASH]$/i.test(x)), files = a.filter(x => !/^[+-][RASH]$/i.test(x));
      const r = this.resolve(files[0] || '*.*'); if (!await this.need(r)) return;
      const dir = r.isDir ? r.node : r.parent;
      let list = r.wild ? (dir.kids || []).filter(k => r.wild.test(k.name) || r.wild.test(short(dir, k))) : r.isDir ? (files[0] ? [] : dir.kids || []) : r.node ? [r.node] : [];
      list = list.filter(k => k.type !== 'dir');
      if (!list.length) { this.println('File not found - ' + (files[0] || '').toUpperCase()); return; }
      const base = this.pathStr(r.dr, r.isDir ? r.dirs : r.dirs);
      for (const k of list) {
        if (flags.length) {
          if (!canW(k)) { this.println(`Access denied - ${base}\\${short(dir, k)}`); continue; }
          const at = { r: !!k.ro, h: !!k.hidden };
          for (const f of flags) { const on = f[0] === '+', c = f[1].toUpperCase(); if (c === 'R') at.r = on; if (c === 'H') at.h = on; if (c === 'S' && on) { this.println('Only JackOS can make system files. (Nice try.)'); } }
          DOS.fsx.attr(this.fsPath(r.isDir ? r.dirs : r.dirs), k, at);
          if (at.h) S('attrib');
          continue;
        }
        const sys = /^(io\.sys|msdos\.sys|command\.com)$/i.test(k.name) || /\.(vxd|dll|sys|drv)$/i.test(k.name) && isSys(base);
        const ro = !canW(k) || k.ro;
        this.println(`  A  ${sys ? 'S' : ' '}${k.hidden ? 'H' : ' '}${ro ? 'R' : ' '}     ${base.replace(/\\$/, '')}\\${short(dir, k)}`);
      }
      void sw;
    },
    async LABEL() { this.println(`Volume in drive C is ${LABELS.C}\nVolume Serial Number is ${SERIAL.C}`); this.print('Volume label (11 characters, ENTER for none)? '); const l = await K.readLine(this.host, { max: 11, upper: true }); if (l && l.trim()) this.println('Access denied - Dad named this disk and he likes the name.'); },
    async CHOICE(argStr, batch, rest) {
      const [sw, a] = this.switches(this.args(rest)); const keys = String(sw.C && sw.C !== true ? sw.C : 'YN').toUpperCase();
      const txt = a.join(' ');
      this.print(txt + (sw.N ? '' : `[${keys.split('').join(',')}]?`));
      const k = await this.key(keys); this.println(k); this.err = keys.indexOf(k) + 1;
    },
    async MODE(argStr) {
      const u = argStr.toUpperCase().replace(/\s+/g, ' ').trim();
      let cols = null, rows = null; let m;
      if ((m = /COLS=(\d+)/.exec(u))) cols = +m[1]; if ((m = /LINES=(\d+)/.exec(u))) rows = +m[1];
      if (/^(CO|BW)?40$/.test(u)) cols = 40; if (/^(CO|BW|MONO)?80$/.test(u)) cols = 80;
      if (!cols && !rows) { this.println('\nStatus for device CON:\n----------------------\nColumns=' + this.cols + '\nLines=' + this.host.screen.rows + '\n\nCode page operation not supported on this device\n(It\'s code page 437. It\'s always 437.)'); return; }
      if (cols && ![40, 80].includes(cols) || rows && ![25, 43, 50].includes(rows)) { this.println('Invalid parameter - ' + u); return; }
      this.host.screen.resize(cols || this.cols, rows || this.host.screen.rows); this.term.cls();
      if (rows === 50) S('mode50');
    },
    async DOSKEY(argStr) { if (/\/H/i.test(argStr)) { this.hist.forEach(h => this.println(h)); return; } this.println('DOSKEY is already installed. (Jack put it in AUTOEXEC. Wait, did he?)'); },
    async MORE(argStr) {
      let text = this.stdin;
      if (text == null) { this.println('MORE needs some input. Try: TYPE FILE.TXT | MORE'); return; }
      const lines = String(text).replace(/\n$/, '').split('\n'); const h = this.host.screen.rows - 1;
      const prev = this.out; this.out = null;
      for (let i = 0; i < lines.length; i++) { this.println(lines[i]); if ((i + 1) % h === 0 && i < lines.length - 1) { this.print('-- More --'); const e = await this.host.readKey(); this.print('\r          \r'); if (e.key === 'Escape' || e.ctrl && /^[cC]$/.test(e.key) || /^[qQ]$/.test(e.key)) break; } }
      this.out = prev; void argStr;
    },
    async FIND(argStr) {
      const [sw, a] = this.switches(this.args(argStr));
      const q = a[0]; if (q == null) { this.println('FIND: Parameter format not correct'); return; }
      const scan = (name, text) => { const lines = String(text).split('\n'); let c = 0; const hits = []; lines.forEach((l, i) => { const has = sw.I ? l.toLowerCase().includes(q.toLowerCase()) : l.includes(q); if (has !== !!sw.V) { c++; hits.push((sw.N ? `[${i + 1}]` : '') + l); } }); if (name) this.println('\n---------- ' + name + (sw.C ? ': ' + c : '')); else if (sw.C) this.println(String(c)); if (!sw.C) hits.forEach(h => this.println(h)); };
      if (a.length < 2) { if (this.stdin == null) { this.println('FIND: Parameter format not correct'); return; } scan('', this.stdin); return; }
      for (const f of a.slice(1)) { const r = this.resolve(f); if (r.err || !r.node || !isText(r.node)) { this.println('File not found - ' + f.toUpperCase()); continue; } scan(this.pathStr(r.dr, r.dirs).replace(/\\$/, '') + '\\' + short(r.parent, r.node), r.node.text || ''); }
    },
    async SORT(argStr) { const rev = /\/R/i.test(argStr); const text = this.stdin; if (text == null) { this.println('SORT needs some input. Try: DIR /B | SORT'); return; } const l = String(text).replace(/\n$/, '').split('\n').sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase())); if (rev) l.reverse(); l.forEach(x => this.println(x)); },
    async XCOPY(argStr) { this.println('XCOPY is busy. Using COPY instead. (Same thing really, but less X.)'); return INTERNAL.COPY.call(this, argStr.replace(/\/[SsEe]\b/g, '')); },
    async DELTREE(argStr) {
      const [sw, a] = this.switches(this.args(argStr));
      if (!a.length) { this.println('Required parameter missing'); return; }
      const r = this.resolve(a[0]); if (!await this.need(r)) return;
      const name = this.pathStr(r.dr, r.dirs);
      if (r.isDir && (!r.dirs.length || /^C:\\JACKOS/i.test(name))) {
        this.print(`Delete directory "${a[0].toUpperCase()}" and all its subdirectories? [yn] `); const k = sw.Y ? 'Y' : await this.key('YN'); this.println(k.toLowerCase()); if (k !== 'Y') return;
        this.println(`Deleting ${a[0].toUpperCase()}...`);
        for (const f of ['JACK.COM', 'SYSTEM.INI', 'EXPLORER.EXE', 'MOM.SYS', 'GUBBINZ.VXD']) { await this.host.sleep(380); this.println(`  ${f.padEnd(14)} ${f === 'MOM.SYS' ? 'REFUSES TO LEAVE' : f === 'GUBBINZ.VXD' ? 'is hiding under the desk' : 'Access denied'}`); }
        await this.host.sleep(400);
        this.println('\nDELTREE gave up. MOM.SYS sends her regards.\n(Dave did this to his PC in March. He had to tell his dad. Big trouble.)');
        window.Sound && Sound.play('uhoh'); S('deltree'); return;
      }
      if (!r.isDir && !r.node) { this.println('File not found'); return; }
      if (!r.isDir) return INTERNAL.DEL.call(this, a[0]);
      if (!canW(r.node)) { this.println('Access denied - that\'s one of Jack\'s directories.'); return; }
      if (!sw.Y) { this.print(`Delete directory "${a[0].toUpperCase()}" and all its subdirectories? [yn] `); const k = await this.key('YN'); this.println(k.toLowerCase()); if (k !== 'Y') return; }
      const bad = []; (function walk(n) { for (const k of n.kids || []) { if (!canW(k)) bad.push(k); if (k.kids) walk(k); } })(r.node);
      if (bad.length) { this.println('Access denied - some of Jack\'s files are in there.'); return; }
      this.println(`Deleting ${a[0].toUpperCase()}...`);
      DOS.fsx.removeTree(this.fsPath(r.dirs.slice(0, -1)), r.node);
      if (this.cwd.C.includes(r.node)) this.cwd.C = this.cwd.C.slice(0, this.cwd.C.indexOf(r.node));
    },
    async FORMAT(argStr) {
      const d = (/^([a-z]):/i.exec(argStr.trim()) || [0, ''])[1].toUpperCase();
      if (!d) { this.println('Required parameter missing'); return; }
      if (d === 'C') {
        this.println('\nWARNING, ALL DATA ON NON-REMOVABLE DISK\nDRIVE C: WILL BE LOST!'); this.print('Proceed with Format (Y/N)?');
        const k = await this.key('YN'); this.println(k); if (k !== 'Y') return;
        this.println('\nFormatting 5,311.56M');
        for (let p = 0; p <= 3; p++) { this.print(`\r${lpad(p, 3)} percent completed.`); await this.host.sleep(700); }
        this.println('\n\n*** FORMAT ABORTED BY MOM.SYS ***\n\nMom says: "If you format that computer I will format YOU."\nYour files are safe. Your pocket money is not.');
        window.Sound && Sound.play('uhoh'); S('format'); return;
      }
      if (d === 'D') { this.println('Cannot format a CD-ROM. (Dave tried it with a marker pen. Didn\'t work either.)'); return; }
      if (d !== 'A') { this.println('Invalid drive specification'); return; }
      this.print('Insert new diskette for drive A:\nand press ENTER when ready...'); const e = await this.host.readKey(); this.println(); if (e.key === 'Escape' || e.ctrl) return;
      this.println('\nChecking existing disk format.\nSaving UNFORMAT information.\nVerifying 1.44M');
      for (let p = 0; p <= 100; p += 7 + (Math.random() * 6 | 0)) { this.print(`\r${lpad(Math.min(100, p), 3)} percent completed.`); await this.host.sleep(160); if (p > 50 && p < 66) { this.println('\n\nWrite protect error writing drive A\nAbort, Retry, Fail?'); const k = await this.key('ARF'); this.println(k); this.println('\nThe disk is write-protected. Dave put a sticker over the little hole.\n(Dave\'s homework lives to fight another day. Well, YOUR homework. That Dave copied.)'); S('formata'); return; } }
    },
    async DEBUG(argStr) { return this.prog('debug', argStr); },
    async COMMAND(argStr) { return this.prog('command', argStr); },
    async START(argStr) {
      const a = argStr.trim(); if (!a) { this.println('Required parameter missing'); return; }
      if (this.mode === 'dos') { this.println('This program requires JackOS. (You\'re in MS-DOS mode. Type WIN.)'); return; }
      const exe = this.findExe(this.args(a)[0]); if (exe && (exe.node.app === 'dos.run')) { A.open('dos.run', exe.node.arg); return; }
      if (exe && exe.node.app) { A.openFile(exe.node); return; }
      let ok = false; try { ok = A.run(a); } catch (e) { ok = false; } if (!ok) this.println(`Cannot find the file '${a}' (or one of its components).`);
    },
    async WIN() {
      if (this.mode === 'dos') { this.println('Starting JackOS 98...'); await this.host.sleep(500); this.exitReq = true; this.winReq = true; return; }
      S('win'); this.println('You are already running JackOS. It\'s behind this window. (Wave at it.)');
    },
    async LH(argStr) { return this.exec(argStr); },
    async CALL(argStr) { const exe = this.findExe(this.args(argStr)[0] || ''); if (exe && /\.bat$/i.test(exe.node.name)) return this.runBatch(exe.node, argStr.trim().slice((this.args(argStr)[0] || '').length)); return this.exec(argStr); },
    GOTO() {}, SHIFT() {},
    async IF(argStr) { const r = this.ifCond(argStr.trim()); if (!r) { this.println('Syntax error'); return; } if (r.ok) await this.exec(r.rest); },
    async FOR(argStr) {
      const m = /^%%?(\w)\s+IN\s+\(([^)]*)\)\s+DO\s+(.+)$/i.exec(argStr.trim()); if (!m) { this.println('Syntax error'); return; }
      const items = [];
      for (const it of m[2].trim().split(/[\s,]+/).filter(Boolean)) { const r = /[*?]/.test(it) ? this.resolve(it) : null; if (r && !r.err && r.wild) (r.parent.kids || []).filter(k => k.type !== 'dir' && (r.wild.test(k.name) || r.wild.test(short(r.parent, k)))).forEach(k => items.push(short(r.parent, k))); else items.push(it); }
      for (const it of items.slice(0, 200)) { await this.exec(m[3].replace(new RegExp('%%?' + m[1], 'g'), it)); if (this.host.brk) { this.host.brk = false; this.println('^C'); return; } }
    },
    CTTY() { this.println('CTTY NUL is how Dave lost his keyboard for a whole afternoon. Not today.'); },
    async MSCDEX() { this.println('MSCDEX Version 2.25\nCopyright (C) JackOS Corp. 1986-1999. All rights reserved.\n        Drive D: = Driver JACKCD01 unit 0'); },
    async MOUSE() { this.println('JackMouse Driver Version 8.20\nCopyright (C) Jack 1999. Ball not included (it fell out).\nMouse driver installed'); },
    async SMARTDRV() { this.println('JackOS SMARTDrive Disk Cache version 5.0\n\n           Disk Caching Status\ndrive   read cache   write cache   buffering\n--------------------------------------------\n  A:       yes           no           no\n  C:       yes           yes          no\n  D:       yes           no           no\n\nFor help, type "Smartdrv /?". (It won\'t help.)'); },
    async KEYB() { this.println('Current keyboard code: UK   code page: 437\nCurrent CON code page: 437\n(The \u00a3 key works. The # key is in a silly place.)'); },
    async SYS() { this.println('No room for system on destination disk. (Gubbinz is sitting on it.)'); },
    async UNDELETE() { this.println('Directory: ' + this.pathStr() + '\nFile Specifications: *.*\n\n    Deletion-tracking file not found.\n    JackOS has a Recycle Bin for that now. (On the desktop. The bin-shaped thing.)'); },
    async FDISK() { return this.prog('fdisk', ''); },
    async SCANDISK(argStr) { return this.prog('scandisk', argStr); },
    async DEFRAG(argStr) { return this.prog('defrag', argStr); },
    async MSD() { return this.prog('msd', ''); },
    async EDIT(argStr) { return this.prog('edit', argStr); },
    async JBASIC(argStr) { return this.prog('jbasic', argStr); },
    async QBASIC(argStr) { S('qbasic'); this.println('QBASIC.EXE is on the JackOS CD, and Dad keeps the JackOS CD in a "safe place".\nNobody has seen it since 1998.\n\nStarting JBASIC instead (it\'s Jack\'s, it\'s better, it has robots)...'); await this.host.sleep(1400); return this.prog('jbasic', argStr); },
    async GC(argStr) { return this.prog('gc', argStr); },
    async MSAV() { this.println('JackNet Anti-Virus 99 (DOS edition)\n\nScanning memory for viruses...  none\nScanning drive C:...'); await this.host.sleep(900); this.println('  14,203 viruses checked. 0 found. 1 Gubbinz found (GUBBINZ.VXD). Gubbinz is allowed.'); },
    async ANSI(argStr) { return this.prog('ansi', argStr); },
    async MATRIX() { return this.prog('matrix', ''); },
    async FC(argStr) {
      const [sw, a] = this.switches(this.args(argStr)); if (a.length < 2) { this.println('FC: Insufficient number of file specifications'); return; }
      const r1 = this.resolve(a[0]), r2 = this.resolve(a[1]);
      if (r1.err || !r1.node || !isText(r1.node)) { this.println('FC: cannot open ' + a[0].toUpperCase() + ' - No such file or folder'); return; }
      if (r2.err || !r2.node || !isText(r2.node)) { this.println('FC: cannot open ' + a[1].toUpperCase() + ' - No such file or folder'); return; }
      const A1 = String(r1.node.text || '').split('\n'), B1 = String(r2.node.text || '').split('\n'); const ci = !!sw.C;
      const eq = (x, y) => ci ? (x || '').toLowerCase() === (y || '').toLowerCase() : x === y;
      this.println(`Comparing files ${a[0].toUpperCase()} and ${a[1].toUpperCase()}`);
      let diffs = 0;
      for (let i = 0; i < Math.max(A1.length, B1.length); i++) { if (!eq(A1[i], B1[i])) { if (++diffs > 20) { this.println('Resync failed. Files are too different. (Like you and Dave.)'); break; } this.println(`***** ${a[0].toUpperCase()}\n${A1[i] == null ? '' : A1[i]}\n***** ${a[1].toUpperCase()}\n${B1[i] == null ? '' : B1[i]}\n*****`); } }
      if (!diffs) this.println('FC: no differences encountered'); this.err = diffs ? 1 : 0;
    },
    async COMP(argStr) { const a = this.args(argStr); if (a.length < 2) { this.println('Name of first file to compare: (try COMP FILE1 FILE2)'); return; } const r1 = this.resolve(a[0]), r2 = this.resolve(a[1]); if (r1.err || !r1.node || r2.err || !r2.node) { this.println('File not found'); return; } const x = String(r1.node.text || ''), y = String(r2.node.text || ''); this.println(`Comparing ${a[0].toUpperCase()} and ${a[1].toUpperCase()}...`); if (x.length !== y.length) { this.println('Files are different sizes.'); } else { let n = 0; for (let i = 0; i < x.length && n < 10; i++) if (x[i] !== y[i]) { n++; this.println(`Compare error at OFFSET ${i.toString(16).toUpperCase()}\nfile1 = ${x.charCodeAt(i).toString(16).toUpperCase()}\nfile2 = ${y.charCodeAt(i).toString(16).toUpperCase()}`); } if (!n) this.println('Files compare OK'); } this.print('\nCompare more files (Y/N) ? '); const k = await this.key('YN'); this.println(k); },
    async PRINT(argStr) { const a = this.args(argStr)[0]; if (!a) { this.println('PRINT queue is empty'); return; } const r = this.resolve(a); if (r.err || !r.node) { this.println('File not found'); return; } this.println(`${a.toUpperCase()} is currently being printed`); await this.host.sleep(1200); this.println('\nPRINT: Printer out of cyan. Write fault error writing device LPT1\nAbort, Retry, Ignore, Fail?'); const k = await this.key('ARIF'); this.println(k); if (k === 'I') this.println('Printing with no cyan... it is a text file... the printer still refuses. It is a matter of principle.'); S('print'); },
    async TRUENAME(argStr) { const r = this.resolve(argStr.trim() || '.'); if (r.err) { this.println(r.err); return; } this.println(r.isDir ? this.pathStr(r.dr, r.dirs) : this.pathStr(r.dr, r.dirs).replace(/\\$/, '') + '\\' + (r.node ? short(r.parent, r.node) : r.name.toUpperCase())); },
    async SETVER() { this.println('\nJackOS Version Table\n\nJACK.COM        4.10    JACKTRIS.EXE   1.00    GUBBINZ.EXE    1.99\nDOOM.EXE       1.9     HOMEWORK.DOC   0.00    DAVE.EXE       0.1 (beta, always)\n\nEverything reports 1999 to everything else. It\'s simpler.'); },
    async POWER() { this.println('Power Management Status\n-----------------------\nSetting = ADV:REG\nCPU: idle 94% of the time (it\'s waiting for you)\nAPM: not detected. Power is managed by Mom, at the wall socket, at 8pm.'); },
    async INTERLNK() { this.println('Port=COM1\n\nThis Computer      Other Computer\n(Client)           (Server)\n--------------     --------------\n(none)\n\nDave\'s PC not found. The cable is 2 metres and his house is 40 metres. Dad says "no".'); },
    async INTERSVR() { this.println('JackOS Interlnk Server. Waiting for Dave... (he is not coming. Press Alt+F4. Actually that\'s JackOS. Press Ctrl+C.)'); const e = await this.host.readKey(); void e; this.println('Server stopped.'); },
    async SUBST(argStr) { if (!argStr.trim()) { this.println('A: => DAVE\'S DISK (when it\'s in)\nD: => JACKATTACK7\nX: => C:\\MY DOCUMENTS\\HOMEWORK (Dad set this up "to make it quicker". It did not.)'); return; } this.println('Invalid parameter - SUBST can only be used by Dad.'); },
    async SHARE() { this.println('SHARE installed. Nobody shares anything. Dave never gave the floppy back.'); },
    async BREAK(argStr) { const u = argStr.trim().toUpperCase(); if (!u) this.println('BREAK is on'); else if (u === 'ON' || u === 'OFF') this.println(u === 'OFF' ? 'BREAK is off. (Ctrl+C still works. BREAK OFF is a lie DOS tells.)' : 'BREAK is on'); else this.println('Must specify ON or OFF'); },
    async VERIFY(argStr) { const u = argStr.trim().toUpperCase(); if (!u) this.println('VERIFY is off'); else this.println(u === 'ON' ? 'VERIFY is on. Every write is read back and checked. It\'s 2% slower. Dad can tell.' : 'VERIFY is off'); },
    async APPEND() { this.println('No Append (and no Dave either, he\'s gone home)'); },
    async ASSIGN() { this.println('Original A: C: D:\nASSIGN is for people who want A: to be C:. Those people are not well.'); },
    async GRAPHICS() { this.println('GRAPHICS: print-screen support for graphics loaded. The printer is out of cyan. Print Screen will produce art, of a kind.'); },
    async MIRROR() { this.println('MIRROR: saves a copy of the FAT for UNFORMAT.\n\nCreates file C:\\MIRROR.FIL ... Access denied. (This disk is FAT32. MIRROR is from 1991. It\'s confused. So is Dad.)'); },
    async NLSFUNC() { this.println('NLSFUNC: national language support loaded. Country: United Kingdom. Date format: the correct one.'); },
    async EXPAND(argStr) { this.println(argStr.trim() ? `Cannot expand ${argStr.trim().toUpperCase()}: not a compressed file. (Try UNSQUASH for .SQZ files.)` : 'Expands one or more compressed files from the JackOS CD. Dad has the JackOS CD. Dad has it in a "safe place".'); },
    async DISKCOPY() { this.println('Insert SOURCE diskette in drive A:\n\nPress any key to continue . . .'); await this.host.readKey(); this.println('\nNot ready reading drive A\n(Even if a disk was in, DISKCOPY needs TWO disks and three swaps. Dave has one disk. Dave is the problem.)'); },
    async DISKCOMP() { this.println('Insert FIRST diskette in drive A:\nInsert SECOND diskette in drive A:\n(Same drive. Yes. Swap them. Four times. Welcome to 1991.)\n\nCompare another diskette (Y/N) ? N'); },
    async EDLIN(argStr) { return this.prog('edlin', argStr); },
    async DOSSHELL(argStr) { return this.prog('dosshell', argStr); },
    async SQUASH(argStr) { return this.prog('squash', argStr); },
    async UNSQUASH(argStr) { return this.prog('unsquash', argStr); },
    async JACKSCAN(argStr) { return this.prog('grotscan', argStr); },
    async GROTSCAN(argStr) { return this.prog('grotscan', argStr); }, // the old name still works
    async CALC(argStr) { return this.prog('calc', argStr); },
    async HEXED(argStr) { return this.prog('hexed', argStr); },
    async TPAINT(argStr) { return this.prog('tpaint', argStr); },
    async JACKTRAK(argStr) { return this.prog('grottrak', argStr); },
    async GROTTRAK(argStr) { return this.prog('grottrak', argStr); }, // the old name still works
    async INTRO() { return this.prog('intro', ''); },
    async FEED() { return this.prog('feed', ''); },
    async MEMMAKER() { this.println('JackOS MemMaker\n\nMemMaker will optimise your memory. It will reboot your PC three times.\nIt will make 2K more conventional memory available. Dad did this in 1996. He talks about it.\n\nContinue (Y/N)? '); const k = await this.key('YN'); this.println(k); if (k === 'Y') { this.println('\nOptimising...'); await this.host.sleep(1200); this.println('Done. 62K -> 64K free. GUBBINZ moved to upper memory. GUBBINZ moved back. 62K free.'); } },
  };
  // aliases + /? help
  Object.assign(INTERNAL, { CHDIR: INTERNAL.CD, 'CD..': INTERNAL.CD, MKDIR: INTERNAL.MD, RMDIR: INTERNAL.RD, ERASE: INTERNAL.DEL, RENAME: INTERNAL.REN, LOADHIGH: INTERNAL.LH, ANSIVIEW: INTERNAL.ANSI, JACKCMD: INTERNAL.GC, GROTCMD: INTERNAL.GC });
  for (const k of Object.keys(INTERNAL)) { const f = INTERNAL[k]; INTERNAL[k] = function (argStr, batch, rest) { if (/^\s*\/\?/.test(argStr) && HELP[k]) { this.println(HELP[k]); return; } return f.call(this, argStr, batch, rest); }; }

  function binJunk(n, head) {
    let h = hash(n.name), out = head;
    const msg = /\.(exe|com)$/i.test(n.name) ? 'This program cannot be run in DOS mode.' : '';
    for (let i = 0; i < 180; i++) { h = (h * 1103515245 + 12345) >>> 0; const c = h >>> 24; out += c < 32 ? K.chr(c | 1) : K.chr(c); if (i === 40 && msg) out += msg; }
    return out.replace(/\x1b/g, '\u2190').replace(/[\n\r\t\x07\b]/g, '\u25d8');
  }

  // ================================================================ easter eggs (Bad command or file name, but funnier)
  const unix = 'Bad command or file name.\n(That\'s a Dad-at-work command. This is DOS. Try DIR.)';
  const EGGS = {
    XYZZY() { S('xyzzy'); return 'Nothing happens.\n\n(Then, very faintly, from inside the PC: "...a hollow voice says \'Fool\'". Then Gubbinz giggles.)'; },
    PLUGH: 'A hollow voice says "Plugh". Gubbinz says "PLUGH!" back, louder. It echoes.',
    IDDQD: 'Degreelessness mode on. (Wrong program. Right attitude.)',
    IDKFA: 'Very happy ammo added. (Dad says this one is "cheating". Dad uses it.)',
    WAAAGH() { window.Sound && Sound.play('waaagh'); S('waaagh'); return 'W A A A G H ! ! !\n\nThe PC speaker is doing its best. The neighbours\' dog has opinions.'; },
    COWABUNGA() { window.Sound && Sound.play('waaagh'); S('waaagh'); return 'C O W A B U N G A ! ! !\n\nThe PC speaker is doing its best. Somewhere, four turtles approve.'; },
    BOOYAH() { return EGGS.COWABUNGA.call(this).replace('C O W A B U N G A', 'B O O Y A H'); },
    GUBBINZ: '        ,      ,\n       /(.-""-.)\\\n   |\\  \\/      \\/  /|\n   | \\ / =.  .= \\ / |\n   \\( \\   o\\/o   / )/\n    \\_, \'-/  \\-\' ,_/\n      /   \\__/   \\\n      \\ \\__/\\__/ /\n    ___\\ \\|--|/ /___\n  /`    \\      /    `\\\n /       \'----\'       \\\n\nHi! It looks like you\'re using DOS! Would you like help? (Type HELP. I\'m just a picture in here.)',
    DAVE: 'DAVE.EXE is not a valid program. (Dave would agree he is not valid.)',
    MOM: 'MOM.SYS is a device driver. It cannot be run. It runs YOU.\n(Bedtime: 8pm. Current time: too late.)',
    JACK: 'JACK.EXE is already running. He\'s the one typing. Hi Jack!',
    HELLO: 'Hello! JackOS 98 says hi. (It says that to everybody. It\'s polite.)', HI: 'Hi! Type HELP if you\'re lost. Type XYZZY if you\'re VERY lost.',
    LS: unix, PWD: unix, CAT: unix, MAN: unix, GREP: unix, RM: unix, SU: unix, VI: 'Bad command or file name. (Dad says vi is a text editor. Dad also says you can never leave it. Use EDIT.)', EMACS: 'Bad command or file name. (Dad\'s friend Kevin uses that. Kevin has a beard.)',
    WINNUKE: 'Nope. Not on this PC. (' + Cast.n('cousin2') + ' did that to Dave once in a chat room. Dave\'s PC went blue.)',
    PLEASE: 'Because you said please: Bad command or file name. But nicely.',
    SORRY: 'It\'s OK. Everyone makes typos. Dave makes about forty a day.',
    TEA: 'Making tea...\nError: kettle not found on COM1. (Ask Mom. Mom IS the kettle.)', COFFEE: 'Error 418: I\'m a computer, not a coffee pot.',
    CAKE: 'The cake is in the kitchen. Mom said NOT until after tea.',
    SANDWICH: 'What? Make it yourself.', 'MAKE ME A SANDWICH': 'What? Make it yourself.',
    '42': 'Six by nine. (Dad laughed for ages at this. Jack doesn\'t get it yet.)',
    WHO: 'You are logged on as: JACK (probably). Machine: JACKS-PC. Desktop pals: 1.',
    WHOAMI: 'A visitor from the Internet, sitting at Jack\'s PC. Please don\'t touch his diary.',
    TETRIS: 'Did you mean JACKTRIS? It\'s on the website. Under GAMES. Jack made it. From scratch. He\'d like you to know.',
    DOOM: 'DOOM is on 4 floppies in Dad\'s drawer. Dad\'s best is E1M1 in 47 seconds.\nHe brings this up at Christmas. Every Christmas.',
    QUAKE: 'Bad command or file name. (The PC shook a bit though. Did you feel that?)',
    Y2K: 'Y2K status: 77-ish days to go. The video recorder will still say 12:00. Everything is FINE.',
    REBOOT: 'To reboot, press Ctrl+Alt+Delete. (Twice, if you\'re brave. Or Start > Shut Down if you\'re sensible.)',
    SHUTDOWN: 'In DOS you just switch it off at the wall. (DON\'T. ScanDisk will tell on you.)',
    CUBE() { const F = 'UDLRFB', M = ['', "'", '2']; let last = -1, out = []; while (out.length < 20) { const f = Math.random() * 6 | 0; if (f === last || (f >> 1) === (last >> 1) && Math.random() < .5) continue; last = f; out.push(F[f] + M[Math.random() * 3 | 0]); } return 'Rubik\'s scramble: ' + out.join(' ') + '\n(Jack\'s best: 58.32 seconds. He wants you to know it was under a minute.)'; },
    RUBIK: 'Type CUBE for a scramble. Or JBASIC, then open CUBESCRM.BAS.',
    SNAKE: 'Snakes live in C:\\JBASIC\\WORM.BAS. Type JBASIC /RUN C:\\JBASIC\\WORM.BAS',
    BEEP() { DOS.beep(); return ''; },
    FORTUNE() { const F = ['You will find a shiny Pokemon card in an unexpected place.', 'A floppy disk in the hand is worth two in Dave\'s bag.', 'Your modem will connect at 26,400 today. Rejoice.', 'Today is a good day to defragment.', 'Beware of e-mails with attachments called LOVE or PRIZE.', 'You will beat Dave at GoldenEye. Unless he picks Oddjob.', 'Red ones go faster. This has always been true.', 'The cake is in the kitchen. You are not.', 'Someone will say "the Internet is just a fad". Smile and nod.']; return F[Math.random() * F.length | 0]; },
    async ORKSAY(a) { S('orksay'); const t = (a || 'WAAAGH!').toUpperCase().slice(0, 60); return ` ${'_'.repeat(t.length + 2)}\n< ${t} >\n ${'-'.repeat(t.length + 2)}\n    \\    ,--.\n     \\  ( o o)   <- Ork. (Paint him red. Red ones go faster.)\n        /|_^_|\\\n       / |___| \\\n        _|   |_`; },
    async ROBOSAY(a) { S('orksay'); const t = (a || 'BEEP BOOP.').toUpperCase().slice(0, 60); return ` ${'_'.repeat(t.length + 2)}\n< ${t} >\n ${'-'.repeat(t.length + 2)}\n    \\   [o_o]   <- Robot. (Built from a Meccano set and a toaster.)\n     \\  /|=|\\\n         d b`; },
    async MATRIX() { return this.prog('matrix', ''); },
    // ---- Star Wars nerdery (Episode I came out in the UK on 16 July 1999. Jack has seen it three times.)
    FORCE() { S('force'); return 'Reaching out with your feelings...\n\nThe Force is not installed on this PC. Insert "EPISODE I - THE DISC" and press any key.\n(Jack queued for 3 hours outside the cinema on 16 July. Worth it. Mostly.)'; },
    'USE THE FORCE': 'You close your eyes. You let go. You press Enter without looking.\nBad command or file name. (Even Jedi make typos.)',
    'MAY THE FORCE BE WITH YOU': '...and also with you. (Jack says this to the cat next door. The cat is unimpressed.)',
    async LIGHTSABER() { S('saber'); const t = this.term; const hum = [110, 116, 110, 104]; t.write('\n  ' + '\u2588\u2588\u2593\u2592'); for (let i = 0; i < 26; i++) { const a = t.attr; t.attr = 0x0c; t.write('\u2550'); t.attr = a; DOS.tone(hum[i % 4] + i * 3, 0.05); await this.host.sleep(25); } t.attr = 0x0f; t.write('\u25ba'); t.attr = 7; return '\n\n  VVVSHHHHMMMM. (A wrapping-paper tube and a red felt tip. Very realistic.)'; },
    SABER: 'Type LIGHTSABER. Spell it out. Jedi don\'t abbreviate.',
    R2D2() { S('droid'); [1800, 2400, 1200, 3000, 900, 2600].forEach((f, i) => DOS.tone(f, 0.07, i * 0.09)); return 'Bweep! Boo-dee-doo-WEEEP!\n\nTranslation unavailable. (Protocol driver not found on COM2.)'; },
    'R2-D2'() { return EGGS.R2D2.call(this); },
    C3PO: 'Oh dear. Oh my. This command was not in my programming. I am fluent in over six million forms of error message.',
    YODA(a) { const w = (a || 'Bad command or file name this is').trim().split(/\s+/); return w.length < 2 ? 'Reversed, a sentence of one word cannot be.' : (w.slice(Math.ceil(w.length / 2)).join(' ') + ', ' + w.slice(0, Math.ceil(w.length / 2)).join(' ')).replace(/^./, c => c.toUpperCase()) + ', hmmm.'; },
    CHEWIE: 'RRRAAAAWWWRRRGGGH! (He says the hyperdrive is fine. It is not fine.)', WOOKIEE: 'RRRAAAAWWWRRRGGGH!',
    VADER: 'Kshhhhh... pahhhhh... kshhhhh... pahhhhh... (Mom thought it was the boiler.)',
    'JAR JAR': 'Bad command or file name. (Jack would prefer not to talk about it.)', JARJAR: 'Bad command or file name. (Jack would prefer not to talk about it.)',
    PODRACE: 'Pod racing is in C:\\JBASIC\\PODRACE.BAS. Type: JBASIC /RUN C:\\JBASIC\\PODRACE.BAS',
    JEDI: 'JEDI.EXE requires midi-chlorians. Your count: 3. Gubbinz\'s count: 0. Dave\'s count: "loads, probably".',
    SITH: 'Access denied. (Only the Dark Side can read C:\\JACKOS\\SYSTEM. Or Dad.)',
  };

  DOS.Shell = Shell;
  DOS.shellUtil = { short, findKid, shortNames, bytesOf, dateOf, isText, wild, hash, commas, binJunk, LABELS, SERIAL, cdRoot, floppyRoot, freeBytes };
})();
