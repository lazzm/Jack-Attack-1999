/* JackOS 98 "system" pack, part 2 (lazily loaded): Printers + spooler, Task Manager, Device Manager, System Monitor,
 * Resource Meter, Scheduled Tasks, Backup, Disk Cleanup, Maintenance Wizard, Accessibility Wizard, Sound Recorder,
 * Volume Control, JackOS Update and the Y2K Compliance Patch. */
(function () {
  'use strict';
  const X = window.SysPack; if (!X || X.P._progs) return;
  const A = window.Apps;
  const { P, I, get, put, qs, qsa, on, h, esc, clamp, rnd, pick, touch, S, toast, msg, fmt, dbl, mini, bar, crawl, tabs, dlg, wizard, vslider, LOAD, open } = X;
  P._progs = true;
  const nick = () => (window.Net && Net.me && Net.me.nick) || 'Jack';
  const t99 = () => { const t = Desk.today99(); return `${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}/99`; };
  const hhmm = () => new Date().toTimeString().slice(0, 5);
  const hash = s => { let x = 2166136261; for (const c of String(s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
  const sfx = n => Sound.play(n);

  // a JackOS 98 list view: cols [[label, width|'flex', align?]], rows: [{cells:[], data, cls}]
  function listView(cols, o) {
    o = o || {};
    const el = h(`<div class="sys-lv-hd">${cols.map((c, i) => `<button type="button" data-c="${i}" style="${c[1] === 'flex' ? 'flex:1;min-width:' + (c[3] || 60) + 'px' : 'width:' + c[1] + 'px;flex:none'}${c[2] ? ';text-align:' + c[2] : ''}">${esc(c[0])}</button>`).join('')}</div><div class="sys-lv-bd"></div>`, 'sys-lv field');
    const bd = qs(el, '.sys-lv-bd'); let rows = [], sel = -1, sortC = -1, sortD = 1;
    function render() {
      const list = rows.slice();
      if (sortC >= 0) list.sort((a, b) => { const x = a.sort ? a.sort[sortC] : a.cells[sortC], y = b.sort ? b.sort[sortC] : b.cells[sortC]; return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sortD; });
      bd.innerHTML = list.map(r => `<div class="sys-lv-r${r === rows[sel] ? ' sel' : ''}${r.cls ? ' ' + r.cls : ''}" data-i="${rows.indexOf(r)}">${r.cells.map((c, i) => `<span style="${cols[i][1] === 'flex' ? 'flex:1;min-width:' + (cols[i][3] || 60) + 'px' : 'width:' + cols[i][1] + 'px;flex:none'}${cols[i][2] ? ';text-align:' + cols[i][2] : ''}">${i === 0 && r.icon ? mini(r.icon, 16) + ' ' : ''}${r.html && r.html[i] != null ? r.html[i] : esc(c)}</span>`).join('')}</div>`).join('') || (o.empty ? `<div class="sys-lv-empty">${esc(o.empty)}</div>` : '');
    }
    on(bd, 'click', ev => { const r = ev.target.closest('.sys-lv-r'); if (!r) return; sel = +r.dataset.i; qsa(bd, '.sys-lv-r').forEach(x => x.classList.toggle('sel', x === r)); if (o.select) o.select(rows[sel]); if (touch() && o.open && o.tapOpen) o.open(rows[sel]); });
    on(bd, 'dblclick', ev => { const r = ev.target.closest('.sys-lv-r'); if (r && o.open) o.open(rows[+r.dataset.i]); });
    on(bd, 'contextmenu', ev => { const r = ev.target.closest('.sys-lv-r'); if (!o.menu) return; ev.preventDefault(); ev.stopPropagation(); if (r) { sel = +r.dataset.i; render(); } IE.menu(o.menu(r ? rows[sel] : null), ev.clientX, ev.clientY); });
    qsa(el, '.sys-lv-hd button').forEach(b => on(b, 'click', () => { const c = +b.dataset.c; sortD = sortC === c ? -sortD : 1; sortC = c; render(); }));
    return { el, set(r, keepSel) { const old = rows[sel]; rows = r; sel = keepSel && old ? rows.findIndex(x => x.key != null && x.key === old.key) : -1; render(); }, get sel() { return rows[sel] || null; }, select(i) { sel = i; render(); } };
  }

  // ================================================================ PRINTERS + the JackJet 500 spooler
  const LCD_CRYPTIC = ['MC FEED A4', 'TRAY 1 HUNGRY', 'LOAD A4 PLAIN\nPRESS GO', 'ERR 50.2 RESTART', 'PAPER WAD AT C', 'HEAD PARK FAIL\nPRESS GO'];
  const SP = { jobs: [], state: 'idle', lcd: 'READY', paper: get('paper', 6), out: [], ui: new Set(), busy: false, nextId: 1, wait: null, sheet: null };
  const spEmit = () => SP.ui.forEach(fn => { try { fn(); } catch (e) {} });
  const setLcd = t => { SP.lcd = t; spEmit(); };
  const setPaper = n => { SP.paper = Math.max(0, n); put('paper', SP.paper); spEmit(); };
  function spPrint(doc, o) {
    const job = { id: SP.nextId++, doc, pages: clamp(o.pages | 0 || 1, 1, 40), done: 0, owner: o.owner || nick(), status: 'Spooling', at: hhmm(), test: !!o.test, text: o.text || '', size: rnd(14, 220) + 'KB' };
    SP.jobs.push(job); X.printerTray(true); spEmit();
    if (!X.winByTitle('JackJet 500')) open('system.printq');
    toast('JackJet 500', `Printing "${doc}"...`, 2500);
    setTimeout(() => { job.status = 'Waiting'; spEmit(); spRun(); }, 1300);
    return job;
  }
  function spRun() {
    if (SP.busy || SP.state === 'paused') return;
    const job = SP.jobs.find(j => j.status === 'Waiting' || j.status === 'Printing');
    if (!job) { SP.state = 'idle'; setLcd('READY'); setTimeout(() => { if (!SP.jobs.length) X.printerTray(false); }, 2500); return; }
    SP.busy = true; job.status = 'Printing'; SP.state = 'printing'; spEmit();
    // now and then the printer says something nobody understands and waits for GO
    if (!job.cryptic && Math.random() < 0.18) { job.cryptic = true; SP.busy = false; spError('cryptic', pick(LCD_CRYPTIC)); return; }
    printPage(job);
  }
  function spError(kind, lcd) {
    SP.state = kind; SP.busy = false; setLcd(lcd); X.printerTray('err'); spEmit();
    const job = SP.jobs.find(j => j.status === 'Printing'); if (job) job.status = kind === 'nopaper' ? 'Error - Out of paper' : kind === 'jam' ? 'Error - Paper jam' : 'Error - ' + lcd.split('\n')[0];
    spEmit();
    if (kind === 'nopaper') { S('nopaper'); msg('JackJet 500 - Out of Paper', 'The printer is out of paper.\n\nLoad paper in the tray at the back (the bit that sticks up), then click Retry in the printer window.\n\n(Mom keeps the paper in the drawer under the phone.)', 'warn'); }
    if (kind === 'jam') msg('JackJet 500', 'There was an error writing to LPT1: for the printer (JackJet 500):\n\nPAPER JAM.\n\nOpen the printer window and pull the scrunched-up page out (click it). Gently! Then click Retry.', 'warn');
    if (kind === 'cryptic') toast('JackJet 500', `The printer says: "${lcd.replace('\n', ' ')}"\n\nPress GO on the printer to carry on. (Nobody knows what it means. The manual is in the loft.)`, 7000);
  }
  function spResume() {
    if (SP.state === 'nopaper' && SP.paper <= 0) return toast('JackJet 500', 'Still no paper in the tray. Click the paper tray on the printer to load some.');
    if (SP.state === 'jam' && SP.sheet) return toast('JackJet 500', 'The jammed page is still in there. Click it to pull it out.');
    const job = SP.jobs.find(j => /^Error/.test(j.status)); if (job) job.status = 'Printing';
    SP.state = 'printing'; X.printerTray(true); setLcd('PRINTING'); spRun();
  }
  function printPage(job) {
    if (SP.paper <= 0) return spError('nopaper', 'ADD PAPER\nTRAY 1 EMPTY');
    setLcd(`PRINTING\nPAGE ${job.done + 1}`);
    const jam = Math.random() < 0.2 && !job.jammedPage;
    const total = job.test ? 5200 : 4200 + Math.random() * 2600;
    SP.sheet = { job, page: job.done + 1, f: 0, jam: false };
    sfx('dice');
    const t0 = performance.now();
    const step = () => {
      if (SP.state !== 'printing') { SP.busy = false; return; }
      if (!SP.jobs.includes(job)) { SP.sheet = null; SP.busy = false; spEmit(); spRun(); return; }
      const f = clamp((performance.now() - t0) / total, 0, 1);
      SP.sheet.f = f;
      if (Math.random() < 0.25) sfx('zap');
      if (jam && f > 0.42) { job.jammedPage = true; SP.sheet.jam = true; setPaper(SP.paper - 1); SP.busy = false; spError('jam', 'PAPER JAM\nOPEN COVER'); return; }
      spEmit();
      if (f < 1) { setTimeout(step, 180); return; }
      // the page drops into the output tray
      setPaper(SP.paper - 1); job.done++;
      SP.out.push({ doc: job.doc, page: job.done, of: job.pages, test: job.test, text: job.text, owner: job.owner }); if (SP.out.length > 30) SP.out.shift();
      SP.sheet = null; S('printed'); sfx('thud');
      if (job.done >= job.pages) { SP.jobs = SP.jobs.filter(j => j !== job); toast('JackJet 500', `"${job.doc}" has finished printing.`, 3000); }
      SP.busy = false; spEmit();
      setTimeout(spRun, 700);
    };
    setTimeout(step, 400);
  }
  function pullJam() {
    if (SP.state !== 'jam' || !SP.sheet) return;
    SP.sheet = null; S('jam'); sfx('boing'); setLcd('COVER OPEN\nPRESS GO');
    toast('JackJet 500', 'You pulled out a crumpled, half-printed page. It smells of hot ink. Click Retry (or GO) to carry on.', 5000);
  }
  function loadPaper() {
    setPaper(SP.paper + 10); sfx('turn');
    toast('JackJet 500', pick(['You loaded 10 sheets of paper. (It\'s the back of Jack\'s old maths homework. Waste not, want not.)', 'You loaded 10 sheets of Mom\'s posh letter paper. Don\'t tell her.', 'You loaded 10 sheets. One of them has a Gubbinz drawing on the back.']), 5000);
    if (SP.state === 'nopaper') { setLcd('READY\nPRESS GO'); }
  }
  P._spool = { print: spPrint, state: SP };

  const PRN_SVG = '<svg viewBox="0 0 220 120" class="sys-prn-svg" aria-hidden="true"><rect x="10" y="34" width="200" height="66" rx="8" fill="#d8d0c0" stroke="#000" stroke-width="2"/><rect x="10" y="34" width="200" height="14" rx="6" fill="#bdb4a2"/><rect x="34" y="70" width="152" height="9" fill="#333" stroke="#000"/><rect x="18" y="86" width="44" height="6" rx="2" fill="#8a8272"/><text x="160" y="94" font-family="Arial" font-size="9" font-weight="bold" fill="#5a5242" text-anchor="middle">JackJet 500</text></svg>';
  function printerWin() {
    const b = h(`<div class="sys-pq-top"></div><div class="sys-prn"><div class="sys-prn-box"><div class="sys-prn-feed" title="Paper tray (click to load paper)"><i></i><i></i><i></i><i></i><i></i></div>${PRN_SVG}<div class="sys-prn-head"></div><div class="sys-prn-lcd lcd"></div><div class="sys-prn-leds"><i class="pw" title="Power"></i><i class="er" title="Error"></i></div><button type="button" class="sys-prn-go" title="GO button">GO</button><div class="sys-prn-out"><div class="sys-prn-sheet"><b></b><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div class="sys-prn-tray" title="Output tray (click a page to look at it)"></div><div class="sys-prn-lbl">paper tray at the back (click to load) \u2022 printed pages land in front (click to read)</div></div></div><div class="row sys-pq-btns"><button type="button" class="btn" data-p="retry">Retry</button><button type="button" class="btn" data-p="paper">Load Paper</button><button type="button" class="btn" data-p="test">Print Test Page</button></div>`, 'sys-pq');
    const w = A.win('JackJet 500', b, { w: 520, icon: I.printer, menubar: true, status: true, minW: 320, minH: 300, onClose: () => SP.ui.delete(draw) });
    const lv = listView([['Document Name', 'flex', null, 110], ['Status', 140], ['Owner', 60], ['Progress', 90], ['Started At', 60]], { empty: '', menu: r => r ? [{ label: 'Pause Printing', act: () => toast('JackJet 500', 'Paused. (It was going to jam anyway.)') }, { label: 'Cancel Printing', act: () => cancelJob(r.data) }] : [{ label: 'Purge Print Documents', act: purge }] });
    qs(b, '.sys-pq-top').appendChild(lv.el);
    function cancelJob(j) { SP.jobs = SP.jobs.filter(x => x !== j); if (SP.sheet && SP.sheet.job === j) SP.sheet = null; if (!SP.jobs.length) { SP.state = 'idle'; SP.busy = false; setLcd('READY'); X.printerTray(false); } spEmit(); }
    function purge() { SP.jobs = []; SP.sheet = null; SP.busy = false; SP.state = 'idle'; setLcd('CANCELLING...'); setTimeout(() => setLcd('READY'), 1500); X.printerTray(false); spEmit(); }
    const lcd = qs(b, '.sys-prn-lcd'), sheet = qs(b, '.sys-prn-sheet'), prn = qs(b, '.sys-prn'), trayEl = qs(b, '.sys-prn-tray'), feed = qs(b, '.sys-prn-feed');
    function draw() {
      lv.set(SP.jobs.map(j => ({ key: j.id, data: j, cells: [j.doc, j.status, j.owner, `${j.done} of ${j.pages} pages`, j.at], icon: I.txt, cls: /^Error/.test(j.status) ? 'sys-err' : '' })), true);
      lcd.textContent = SP.lcd;
      prn.classList.toggle('printing', SP.state === 'printing' && !!SP.sheet);
      prn.classList.toggle('error', /jam|nopaper|cryptic/.test(SP.state));
      prn.classList.toggle('paused', SP.state === 'paused');
      const s = SP.sheet;
      sheet.classList.toggle('on', !!s); sheet.classList.toggle('jam', !!(s && s.jam));
      if (s) { sheet.style.setProperty('--f', s.f.toFixed(3)); qs(sheet, 'b').textContent = s.job.test ? 'TEST PAGE' : s.job.doc.slice(0, 22); }
      qsa(feed, 'i').forEach((e, i) => { e.style.display = i < Math.ceil(SP.paper / 2) ? '' : 'none'; });
      feed.classList.toggle('empty', SP.paper <= 0);
      trayEl.innerHTML = SP.out.slice(-6).map((p, i, arr) => `<button type="button" class="sys-prn-pg" style="--i:${i}" data-i="${SP.out.length - arr.length + i}" aria-label="Printed page"></button>`).join('');
      qsa(trayEl, 'button').forEach(e => on(e, 'click', () => printout(SP.out[+e.dataset.i])));
      w.status.textContent = `${SP.jobs.length} document(s) in queue \u2022 Paper: ${SP.paper} sheet(s)` + (SP.state === 'paused' ? ' \u2022 Paused' : '');
      qs(b, '[data-p=retry]').disabled = !/jam|nopaper|cryptic/.test(SP.state);
    }
    SP.ui.add(draw); draw();
    on(sheet, 'click', () => { if (SP.sheet && SP.sheet.jam) { pullJam(); } });
    on(feed, 'click', loadPaper);
    on(qs(b, '.sys-prn-go'), 'click', () => { sfx('click'); if (/jam|nopaper|cryptic/.test(SP.state)) spResume(); else if (SP.state === 'paused') { SP.state = 'printing'; spRun(); } else { setLcd('READY\nGO GO GO'); setTimeout(() => { if (SP.state === 'idle') setLcd('READY'); }, 1200); } });
    on(qs(b, '[data-p=retry]'), 'click', spResume);
    on(qs(b, '[data-p=paper]'), 'click', loadPaper);
    on(qs(b, '[data-p=test]'), 'click', () => spPrint('Test Page', { test: true, owner: 'JackOS' }));
    A.menubar(w, [
      ['Printer', () => [{ label: 'Pause Printing', chk: SP.state === 'paused', act: () => { if (SP.state === 'paused') { SP.state = 'printing'; SP.busy = false; spRun(); } else { SP.state = 'paused'; setLcd('PAUSED'); } spEmit(); } }, { label: 'Purge Print Documents', act: purge }, '-', { label: 'Set As Default', chk: true }, { label: 'Properties', act: () => printerProps() }, '-', { label: 'Close', act: w.close }]],
      ['Document', () => { const j = lv.sel && lv.sel.data; return [{ label: 'Pause Printing', dis: !j, act: () => toast('JackJet 500', 'That document is paused. The printer is pretending it never saw it.') }, { label: 'Cancel Printing', dis: !j, act: () => cancelJob(j) }]; }],
      ['View', [{ label: 'Status Bar', chk: true }, { label: 'Refresh', act: draw }]],
      ['Help', [{ label: 'Help Topics', act: () => open('system.help', 'printing') }, '-', { label: 'About JackJet 500', act: () => msg('About JackJet 500', 'JackJet 500 Colour Inkjet\nDriver version 1.0 (JACKJET.DRV)\n\n300 x 300 dpi (600 if you squint)\n2 pages per minute (claims 6)\nPaper tray: 10 sheets (claims 100)\n\nBought at the computer fair for \u00a349.99. The ink costs \u00a324.99.', 'info') }]],
    ]);
    return w;
  }
  function printout(p) {
    if (!p) return;
    const t = Desk.today99();
    const body = p.test ? `<h4>JackOS 98 Printer Test Page</h4><div class="sys-po-flag">${window.JICON ? JICON.logo(48) : '<i></i><i></i><i></i><i></i>'}</div><p>Congratulations! If you can read this, your JackJet 500 is correctly installed.</p><table class="sys-kv"><tr><td>Printer name:</td><td>JackJet 500</td></tr><tr><td>Printer model:</td><td>JackJet 500 Colour Inkjet</td></tr><tr><td>Driver:</td><td>JACKJET.DRV 1.0</td></tr><tr><td>Port:</td><td>LPT1:</td></tr><tr><td>Colour:</td><td>Yes (cyan is a bit stripy)</td></tr><tr><td>Printed:</td><td>${t.d}/${t.m}/1999 ${hhmm()}</td></tr></table>`
      : p.text ? `<h4>${esc(p.doc)}</h4><pre>${esc(p.text.slice(0, 1600))}</pre>` : `<h4>${esc(p.doc)}</h4><div class="sys-po-ban">JACK ATTACK!</div>${'<i class="sys-po-l"></i>'.repeat(14)}`;
    const b = h(`<div class="sys-po-paper">${body}<div class="sys-po-foot">Page ${p.page} of ${p.of} \u2022 printed by ${esc(p.owner)} on a JackJet 500</div><div class="sys-po-band"></div></div>`, 'sys-po');
    return A.win(`Printout - ${p.doc}`, b, { w: 360, h: 470, icon: I.printer });
  }
  function printerProps() {
    const host = h('', 'sys-sheet');
    const w = A.win('JackJet 500 Properties', host, { w: 380, icon: I.printer, noResize: true, noMax: true, escClose: true });
    tabs(host, [
      ['General', pg => { pg.innerHTML = `<div class="row sys-prtop">${mini(I.printer, 32)}<b>JackJet 500</b></div><hr class="sys-hr"><label class="sys-lbl">Comment:<input type="text" value="Jack's printer. Do NOT print the whole Critterdex again." style="width:100%"></label><label class="sys-lbl">Separator page:<select style="width:100%"><option>(none)</option><option>Full</option><option>Simple</option><option>Gubbinz</option></select></label><div class="row" style="justify-content:flex-end;margin-top:10px"><button type="button" class="btn">Print Test Page</button></div>`; on(qs(pg, '.btn'), 'click', () => spPrint('Test Page', { test: true, owner: 'JackOS' })); }],
      ['Details', pg => { pg.innerHTML = `<table class="sys-kv"><tr><td>Print to the following port:</td><td><select><option>LPT1: (ECP Printer Port)</option><option>COM1: (the mouse is on it)</option><option>FILE: (Creates a file on disk)</option></select></td></tr><tr><td>Print using the following driver:</td><td><select><option>JackJet 500</option><option>Generic / Text Only</option></select></td></tr></table><div class="group"><span class="lg">Timeout settings</span><table class="sys-kv"><tr><td>Not selected:</td><td>15 seconds</td></tr><tr><td>Transmission retry:</td><td>45 seconds (or until it jams)</td></tr></table></div><button type="button" class="btn">Spool Settings...</button>`; on(qs(pg, '.btn'), 'click', () => msg('Spool Settings', 'Spool print jobs so program finishes printing faster.\nStart printing after last page is spooled.\nSpool data format: EMF\n\n(Changing these makes no difference. It still takes ages.)', 'info')); }],
      ['Paper', pg => { pg.innerHTML = `<div>Paper size: <b>A4 210 x 297 mm</b></div><div class="sys-papers">${['A4', 'Letter', 'Legal', 'Envelope', 'Banner (Gubbinz size)'].map((n, i) => `<button type="button" class="sys-paper${i === 0 ? ' sel' : ''}"><i></i>${n}</button>`).join('')}</div><div class="group"><span class="lg">Orientation</span><label><input type="radio" name="sysor" checked> Portrait</label> <label><input type="radio" name="sysor"> Landscape</label></div><label class="sys-lbl">Paper source: <select><option>Tray 1 (the bit at the back)</option><option>Manual feed (MC FEED A4)</option></select></label>`; qsa(pg, '.sys-paper').forEach(e => on(e, 'click', () => qsa(pg, '.sys-paper').forEach(x => x.classList.toggle('sel', x === e)))); }],
      ['Graphics', pg => { pg.innerHTML = `<label class="sys-lbl">Resolution: <select><option>300 x 300 dots per inch</option><option>600 x 300 dots per inch (slow)</option><option>Photo (go and have your tea)</option></select></label><div class="group"><span class="lg">Dithering</span><label class="sys-ck"><input type="radio" name="sysdi"> None</label><label class="sys-ck"><input type="radio" name="sysdi"> Coarse</label><label class="sys-ck"><input type="radio" name="sysdi" checked> Fine</label><label class="sys-ck"><input type="radio" name="sysdi"> Line art</label></div><label class="sys-lbl">Intensity: Darkest<input type="range" min="0" max="10" value="5" style="vertical-align:middle">Lightest</label>`; }],
    ]);
    const row = h('<button type="button" class="btn">OK</button><button type="button" class="btn">Cancel</button><button type="button" class="btn" disabled>Apply</button>', 'row sys-btns'); host.appendChild(row);
    qsa(row, '.btn').forEach(x => on(x, 'click', w.close));
    return w;
  }
  function addPrinterWizard() {
    const art = window.JICON && JICON.wizArt ? JICON.wizArt('printer') : `<svg viewBox="0 0 100 160" width="100" height="160"><rect width="100" height="160" fill="#008080"/><rect x="18" y="56" width="64" height="40" rx="4" fill="#d8d0c0" stroke="#000"/><rect x="28" y="36" width="44" height="24" fill="#fff" stroke="#000"/><rect x="26" y="86" width="48" height="30" fill="#fff" stroke="#000"/><path d="M32 96h36M32 104h28" stroke="#000080"/><circle cx="74" cy="66" r="3" fill="#0c0"/></svg>`;
    return wizard('Add Printer Wizard', art, [
      { render(pg) { pg.innerHTML = '<p>This wizard will help you to install your printer quickly and easily.</p><p>To begin installing your printer, click Next.</p>'; } },
      { render(pg, d) { pg.innerHTML = `<p>How is this printer attached to your computer?</p><label class="sys-ck"><input type="radio" name="syspa" value="l" checked> Local printer</label><label class="sys-ck"><input type="radio" name="syspa" value="n"> Network printer</label>`; }, next(d, pg) { if (qs(pg, 'input[value=n]').checked) { msg('Add Printer Wizard', 'The only other computer on the network is Dave\'s, and his printer is his little brother with a crayon. Choose Local printer.', 'info'); return false; } } },
      { render(pg, d) { pg.innerHTML = `<p>Click the manufacturer and model of your printer.</p><div class="row" style="align-items:stretch;flex-wrap:nowrap"><div class="field sys-pick" data-k="m">${['Generic', 'Gizmo Industries', 'JackJet', 'Pixel-o-Print'].map((n, i) => `<button type="button" class="${i === 2 ? 'sel' : ''}">${n}</button>`).join('')}</div><div class="field sys-pick" data-k="p">${['JackJet 100 (it squeaks)', 'JackJet 500', 'JackJet 9000 (doesn\'t exist yet)'].map((n, i) => `<button type="button" class="${i === 1 ? 'sel' : ''}">${n}</button>`).join('')}</div></div><div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn sys-hd">Have Disk...</button></div>`; qsa(pg, '.sys-pick button').forEach(e => on(e, 'click', () => qsa(e.parentNode, 'button').forEach(x => x.classList.toggle('sel', x === e)))); on(qs(pg, '.sys-hd'), 'click', () => msg('Install From Disk', 'Insert the manufacturer\'s installation disk into drive A:.\n\n(The disk came with the printer. It is now a coaster.)', 'info')); } },
      { render(pg) { pg.innerHTML = `<p>Click the port you want to use with this printer, and then click Next.</p><div class="field sys-pick">${['COM1: Communications Port (the mouse lives here)', 'COM2: Communications Port (the modem lives here)', 'FILE: Creates a file on disk', 'LPT1: ECP Printer Port'].map((n, i) => `<button type="button" class="${i === 3 ? 'sel' : ''}">${n}</button>`).join('')}</div>`; qsa(pg, '.sys-pick button').forEach(e => on(e, 'click', () => qsa(e.parentNode, 'button').forEach(x => x.classList.toggle('sel', x === e)))); } },
      { last: true, render(pg) { pg.innerHTML = `<label class="sys-lbl">Printer name:<input type="text" value="JackJet 500 (Copy 2)" style="width:100%"></label><p>After your printer is installed, JackOS can print a test page so you can confirm that the printer is set up properly.</p><p>Would you like to print a test page?</p><label class="sys-ck"><input type="radio" name="systp" value="y" checked> Yes (recommended)</label><label class="sys-ck"><input type="radio" name="systp"> No</label>`; }, next(d, pg) { d.test = qs(pg, 'input[value=y]').checked; } },
    ], { w: 470, icon: I.printers, finish: d => { msg('Copying Files...', 'Please insert the disk labeled \'JackOS 98 CD-ROM\', and then click OK.\n\n...\n\nJackOS found the files in C:\\JACKOS\\OPTIONS\\CABS (they were there all along). The printer was already installed, so JackOS has installed it again.', 'info', [['OK', () => { if (d.test) spPrint('Test Page', { test: true, owner: 'JackOS' }); }]]); } });
  }
  P['system.printq'] = () => X.winByTitle('JackJet 500') ? null : printerWin();
  P['system.printers'] = () => {
    const b = h('<div class="sys-fold"></div>', 'sys-foldwin');
    const w = A.win('Printers', b, { w: 420, h: 260, icon: I.printers, menubar: true, status: true });
    const items = [
      { n: 'Add Printer', ic: I.printers, act: addPrinterWizard, info: 'Add Printer: starts the Add Printer Wizard.' },
      { n: 'JackJet 500', ic: I.printer, def: true, act: () => open('system.printq'), info: 'JackJet 500: Default printer. Documents: ' + SP.jobs.length + '. Status: ' + (SP.state === 'idle' ? 'Ready' : SP.state), menu: true },
      { n: 'Epsom Stylus Color 440', ic: I.printer, off: true, act: () => msg('Epsom Stylus Color 440', 'Status: Use Printer Offline.\n\nThis printer is out of cyan. It is always out of cyan. The new JackJet 500 is the default printer now.\n\nNote: the Epsom cartridge costs more than the JackJet did.', 'warn'), info: 'Epsom Stylus Color 440: Offline (out of cyan)' },
    ];
    const f = qs(b, '.sys-fold');
    f.innerHTML = items.map((it, i) => `<button type="button" class="sys-fi${it.off ? ' off' : ''}" data-i="${i}">${mini(it.ic, 32)}${it.def ? '<b class="sys-fi-def">\u2714</b>' : ''}<span>${esc(it.n)}</span></button>`).join('');
    qsa(f, '.sys-fi').forEach(e => { const it = items[+e.dataset.i]; on(e, 'click', () => { qsa(f, '.sys-fi').forEach(x => x.classList.toggle('sel', x === e)); w.status.textContent = it.info; }); dbl(e, it.act); on(e, 'contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); IE.menu([{ label: 'Open', act: it.act }, '-', { label: 'Pause Printing', dis: !it.menu }, { label: 'Set As Default', chk: !!it.def }, { label: 'Use Printer Offline', chk: !!it.off }, '-', { label: 'Delete', act: () => msg('Printers', it.def ? 'You can\'t delete the JackJet. Dad would ask where the \u00a349.99 went.' : 'Delete the Epsom? Mom says we might find some cyan one day.', 'warn') }, { label: 'Properties', dis: !it.menu, act: printerProps }], ev.clientX, ev.clientY); }); });
    w.status.textContent = '3 object(s)';
    A.menubar(w, [['File', [{ label: 'Open', act: () => open('system.printq') }, { label: 'Properties', act: printerProps }, '-', { label: 'Close', act: w.close }]], ['View', [{ label: 'Large Icons', rad: true }, { label: 'Details', dis: true }, '-', { label: 'Refresh' }]], ['Help', [{ label: 'Help Topics', act: () => open('system.help', 'printing') }]]]);
    return w;
  };

  // ================================================================ TASK MANAGER
  let gubKills = 0, gubPid = 'FFF' + (hash('gub' + Date.now()) % 0xFFFFF).toString(16).toUpperCase().padStart(5, '0');
  const pidOf = n => 'FFF' + ((hash(n) % 0xFFFFF).toString(16).toUpperCase().padStart(5, '0'));
  const exeOf = t => (t.split(/[ \-:]/)[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'PROGRAM') + '.EXE';
  function processes() {
    const titles = X.visibleWins().map(w => qs(w, '.tb .t').textContent).concat(qsa(document, '.appwin').filter(w => w.style.display === 'none').map(w => qs(w, '.tb .t').textContent));
    const br = document.getElementById('browser'), brOpen = br && !(document.getElementById('taskBrowser') || {}).hidden;
    const sys = [['KERNEL32.DLL', 0.04, 1300], ['MSGSRV32.EXE', 0.01, 420], ['MPREXE.EXE', 0.01, 380], ['MMTASK.TSK', 0.01, 120], ['EXPLORER.EXE', 0.08, 2900], ['SYSTRAY.EXE', 0.01, 300], ['TASKMON.EXE', 0.01, 210], ['RNAAPP.EXE', 0.03, 650], ['TAPISRV.EXE', 0.01, 400], ['MSTASK.EXE', 0.005, 330], ['GUBBINZ.EXE', 0.09, 6400]];
    if (brOpen) sys.push(['IEXPLORE.EXE', 0.18, 9800]);
    if (SP.jobs.length) sys.push(['SPOOL32.EXE', 0.12, 900]);
    if (get('rsrc', false)) sys.push(['RSRCMTR.EXE', 0.005, 160]);
    if (LOAD.game) sys.push(['DDHELP.EXE', 0.02, 700]);
    const apps = titles.map(t => [exeOf(t), GAME(t) ? 0.7 : 0.05, 900 + (hash(t) % 4000), t]);
    return sys.concat(apps);
  }
  const GAME = t => /solitaire|freecell|pinball|mine|jacktris|blockology|squig|game|grotchi|jackotchi|cube/i.test(t);
  P['system.taskmgr'] = () => {
    const host = h('', 'sys-tm');
    const w = A.win('JackOS Task Manager', host, { w: 400, h: 480, icon: I.taskmgr, menubar: true, status: true, minW: 300, minH: 330, onClose: () => { stop(); T.stop(); } });
    let paused = false, speed = 1, tick = 0, ontop = false;
    const stop = LOAD.onTick(() => { if (paused || w.closed) return; tick++; if (tick % speed) return; refresh(); });
    let refresh = () => {};
    function status() { w.status.textContent = `Processes: ${processes().length}    CPU Usage: ${LOAD.cpu}%    Mem Usage: ${fmt(LOAD.mem * 1024)}K / 65,024K`; }
    const T = tabs(host, [
      ['Applications', pg => {
        pg.innerHTML = '<div class="sys-tm-list"></div><div class="row sys-btns"><button type="button" class="btn" data-a="end">End Task</button><button type="button" class="btn" data-a="sw">Switch To</button><button type="button" class="btn" data-a="new">New Task...</button></div>';
        const lv = listView([['Task', 'flex'], ['Status', 100]], { open: r => switchTo(r) });
        qs(pg, '.sys-tm-list').appendChild(lv.el);
        refresh = () => {
          const rows = qsa(document, '.appwin').map(e => { const t = qs(e, '.tb .t').textContent; return { key: t, el: e, cells: [t, /grotchi|jackotchi|gubbinz/i.test(t) && Math.random() < 0.5 ? 'Not Responding' : 'Running'], icon: (qs(e, '.tb .ico') || {}).innerHTML || I.app }; });
          const br = document.getElementById('browser'); if (br && !(document.getElementById('taskBrowser') || {}).hidden) rows.unshift({ key: '__br', el: br, cells: ['JACK ATTACK! Online - JackNet Explorer', 'Running'], icon: I.update });
          lv.set(rows, true); status();
        };
        function switchTo(r) { if (!r) return; if (r.key === '__br') { document.getElementById('browser').classList.remove('min'); const tb = document.getElementById('taskBrowser'); if (tb) tb.classList.add('on'); return; } const task = qsa(document, '#tasks .tbtn').find(b => b.lastChild && b.lastChild.textContent === r.key); if (r.el.style.display === 'none' && task) task.click(); else r.el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }
        on(qs(pg, '[data-a=end]'), 'click', () => { const r = lv.sel; if (!r) return; if (r.key === '__br') { const c = document.getElementById('brClose'); if (c) c.click(); } else if (r.el === w.el) msg('JackOS Task Manager', 'Task Manager can\'t end itself. It would feel weird.', 'info'); else { const c = qs(r.el, '[data-w=close]'); if (c) c.click(); } setTimeout(refresh, 50); });
        on(qs(pg, '[data-a=sw]'), 'click', () => switchTo(lv.sel));
        on(qs(pg, '[data-a=new]'), 'click', () => A.runDialog());
        refresh();
      }],
      ['Processes', pg => {
        pg.innerHTML = '<div class="sys-tm-list"></div><div class="row sys-btns"><label class="sys-ck" style="margin-right:auto"><input type="checkbox" checked> Show processes from all users</label><button type="button" class="btn" data-a="kill">End Process</button></div>';
        const lv = listView([['Image Name', 'flex'], ['PID', 72], ['CPU', 36, 'right'], ['Mem Usage', 72, 'right']]);
        qs(pg, '.sys-tm-list').appendChild(lv.el);
        refresh = () => {
          const pr = processes(); let left = 100 - LOAD.cpu;
          const busy = pr.reduce((a, p) => a + p[1], 0) || 1;
          const rows = pr.map(p => { const cpu = Math.round(LOAD.cpu * p[1] / busy * (0.6 + Math.random() * 0.8)); const pid = p[0] === 'GUBBINZ.EXE' ? gubPid : pidOf(p[3] || p[0]); return { key: p[3] || p[0], data: p, cells: [p[0], pid, String(Math.min(99, cpu)).padStart(2, '0'), fmt(p[2] + rnd(0, 40)) + ' K'], sort: [p[0], pid, cpu, p[2]], icon: I.app }; });
          rows.unshift({ key: '__idle', data: ['System Idle Process'], cells: ['System Idle Process', '00000000', String(clamp(left, 0, 99)).padStart(2, '0'), '16 K'], sort: ['System Idle Process', '0', left, 16] });
          lv.set(rows, true); status();
        };
        on(qs(pg, '[data-a=kill]'), 'click', () => {
          const r = lv.sel; if (!r) return msg('JackOS Task Manager', 'Click a process first, then click End Process.', 'info');
          const n = r.data[0];
          if (n === 'System Idle Process') return msg('Unable to Terminate Process', 'The operation could not be completed.\n\nThe System Idle Process is busy doing nothing. It is very good at it.', 'warn');
          msg('Task Manager Warning', `WARNING: Terminating a process can cause undesired results including loss of data and system instability. The process will not be given the chance to save its state or data before it is terminated.\n\nAre you sure you want to terminate "${n}"?`, 'warn', [['Yes', () => endProcess(r)], ['No']]);
        });
        refresh();
      }],
      ['Performance', pg => {
        pg.innerHTML = `<div class="sys-tm-perf"><div class="group"><span class="lg">CPU Usage</span><canvas class="sys-g1" width="60" height="90"></canvas><b class="sys-gv1"></b></div><div class="group"><span class="lg">CPU Usage History</span><canvas class="sys-h1" width="240" height="90"></canvas></div><div class="group"><span class="lg">MEM Usage</span><canvas class="sys-g2" width="60" height="90"></canvas><b class="sys-gv2"></b></div><div class="group"><span class="lg">Memory Usage History</span><canvas class="sys-h2" width="240" height="90"></canvas></div></div>
          <div class="sys-tm-tot"><div class="group"><span class="lg">Totals</span><table class="sys-kv"><tr><td>Handles</td><td class="sys-v1"></td></tr><tr><td>Threads</td><td class="sys-v2"></td></tr><tr><td>Processes</td><td class="sys-v3"></td></tr></table></div><div class="group"><span class="lg">Physical Memory (K)</span><table class="sys-kv"><tr><td>Total</td><td>65,024</td></tr><tr><td>Available</td><td class="sys-v4"></td></tr><tr><td>Swap file</td><td class="sys-v5"></td></tr></table></div></div>`;
        const gauge = (cv, v, label) => {
          const x = cv.getContext('2d'), W = cv.width, H = cv.height; x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
          const rows = 20, lit = Math.round(v / 100 * rows);
          for (let i = 0; i < rows; i++) { const y = H - 16 - (i + 1) * ((H - 20) / rows); x.fillStyle = i < lit ? '#0f0' : '#004000'; x.fillRect(W / 2 - 15, y, 13, (H - 20) / rows - 1); x.fillRect(W / 2 + 2, y, 13, (H - 20) / rows - 1); }
          x.fillStyle = '#0f0'; x.font = '10px Tahoma, sans-serif'; x.textAlign = 'center'; x.fillText(label, W / 2, H - 4);
        };
        const graph = (cv, data, max) => {
          const W = cv.clientWidth || 240; if (cv.width !== W) cv.width = W;
          const x = cv.getContext('2d'), H = cv.height; x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
          x.strokeStyle = '#008040'; x.lineWidth = 1; const off = (tick * 4) % 12;
          for (let gx = W - off; gx > 0; gx -= 12) { x.beginPath(); x.moveTo(gx + 0.5, 0); x.lineTo(gx + 0.5, H); x.stroke(); }
          for (let gy = 0; gy < H; gy += 12) { x.beginPath(); x.moveTo(0, gy + 0.5); x.lineTo(W, gy + 0.5); x.stroke(); }
          x.strokeStyle = '#0f0'; x.beginPath(); const n = Math.floor(W / 4);
          data.slice(-n).forEach((v, i, arr) => { const px = W - (arr.length - 1 - i) * 4, py = H - 1 - v / max * (H - 2); if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke();
        };
        refresh = () => {
          gauge(qs(pg, '.sys-g1'), LOAD.cpu, LOAD.cpu + ' %'); gauge(qs(pg, '.sys-g2'), LOAD.mem / 64 * 100, Math.round(LOAD.mem * 1024 / 1000) + 'K');
          graph(qs(pg, '.sys-h1'), LOAD.hist, 100); graph(qs(pg, '.sys-h2'), LOAD.memHist, 64);
          const np = processes().length;
          qs(pg, '.sys-v1').textContent = fmt(1800 + np * 61 + rnd(0, 9)); qs(pg, '.sys-v2').textContent = fmt(40 + np * 3); qs(pg, '.sys-v3').textContent = np;
          qs(pg, '.sys-v4').textContent = fmt((64 - LOAD.mem) * 1024); qs(pg, '.sys-v5').textContent = fmt(LOAD.swap * 1024);
          if (LOAD.cpu >= 100) S('cpu100');
          status();
        };
        refresh();
      }],
    ], 0);
    function endProcess(r) {
      const n = r.data[0], title = r.data[3];
      if (n === 'KERNEL32.DLL') { S('kernel'); setTimeout(() => Desk.bsod(), 900); return; }
      if (n === 'GUBBINZ.EXE') {
        gubKills++; gubPid = 'FFF' + rnd(0x10000, 0xFFFFF).toString(16).toUpperCase();
        if (gubKills >= 3) S('gubproc');
        return msg('Unable to Terminate Process', ['Access is denied.\n\nGUBBINZ.EXE is eating. You cannot end a process while it is eating.', 'GUBBINZ.EXE has been terminated.\n\n...\n\nGUBBINZ.EXE has started again with a new process ID. He says "OI".', 'GUBBINZ.EXE cannot be terminated.\n\nHe is holding on to the process list with both hands.', 'The operation could not be completed.\n\nGubbinz has hidden in KERNEL32.DLL. Do not end KERNEL32.DLL. (Seriously.)'][Math.min(3, gubKills - 1)], 'warn');
      }
      if (n === 'EXPLORER.EXE') { const tb = document.getElementById('taskbar'), ic = qs(document, '.icons'); tb.style.visibility = 'hidden'; if (ic) ic.style.visibility = 'hidden'; setTimeout(() => { tb.style.visibility = ''; if (ic) ic.style.visibility = ''; toast('JackOS', 'Explorer has restarted itself. It always does. The desktop is back.'); }, 2500); return; }
      if (n === 'SYSTRAY.EXE') { const tr = document.getElementById('tray'); tr.style.visibility = 'hidden'; setTimeout(() => { tr.style.visibility = ''; }, 3000); return; }
      if (n === 'MSGSRV32.EXE' || n === 'MPREXE.EXE' || n === 'MMTASK.TSK') return msg('Unable to Terminate Process', `${n} cannot be ended. It is too important.\n\nNobody knows what it does, but everyone agrees it is important.`, 'warn');
      if (n === 'IEXPLORE.EXE') { const c = document.getElementById('brClose'); if (c) c.click(); return; }
      if (n === 'SPOOL32.EXE') { SP.jobs = []; SP.sheet = null; SP.busy = false; SP.state = 'idle'; SP.lcd = 'READY'; X.printerTray(false); spEmit(); return toast('JackJet 500', 'The print spooler was ended. Your documents have vanished. The printer looks relieved.'); }
      if (n === 'RSRCMTR.EXE') { X.resTray(false); return; }
      if (title) { const e = X.winByTitle(title); if (e && e !== w.el) { const c = qs(e, '[data-w=close]'); if (c) c.click(); } else if (e === w.el) msg('JackOS Task Manager', 'Task Manager can\'t end itself. It would feel weird.', 'info'); return; }
      toast('JackOS Task Manager', `${n} has been terminated. JackOS will start it again in a minute. It always does.`);
    }
    A.menubar(w, [
      ['File', [{ label: 'New Task (Run...)', act: () => A.runDialog() }, '-', { label: 'Exit Task Manager', act: w.close }]],
      ['Options', () => [{ label: 'Always On Top', chk: ontop, act: () => { ontop = !ontop; w.el.classList.toggle('sys-ontop', ontop); } }, { label: 'Minimize On Use', chk: false }, { label: 'Hide When Minimized', chk: false }]],
      ['View', () => [{ label: 'Refresh Now', key: 'F5', act: () => refresh() }, { label: 'Update Speed', sub: [['High', 1], ['Normal', 2], ['Low', 4]].map(([l, s]) => ({ label: l, rad: !paused && speed === s, act: () => { paused = false; speed = s; } })).concat([{ label: 'Paused', rad: paused, act: () => { paused = true; } }]) }]],
      ['JackOS', [{ label: 'Tile Horizontally', act: () => A.run('tile') }, { label: 'Cascade', act: () => A.run('cascade') }, { label: 'Minimize', act: () => A.run('minimize all') }]],
      ['Help', [{ label: 'Task Manager Help Topics', act: () => open('system.help', 'taskmgr') }, '-', { label: 'About Task Manager', act: () => msg('About JackOS Task Manager', 'JackOS Task Manager 1.0 (Power User Edition)\n\nInstalled off a magazine cover disc.\nShows everything your PC is doing.\nCannot stop Gubbinz. Nothing can.', 'info') }]],
    ]);
    status();
    return w;
  };

  // ================================================================ DEVICE MANAGER (System Properties)
  const CAT_IC = {
    cd: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#e0e0f0" stroke="#555"/><circle cx="8" cy="8" r="2" fill="#fff" stroke="#555"/><path d="M3 6a6 6 0 0 1 4-3" stroke="#f0f" fill="none"/></svg>',
    disk: '<svg viewBox="0 0 16 16"><rect x="1" y="5" width="14" height="7" fill="#c0c0c0" stroke="#000"/><rect x="3" y="8" width="5" height="1" fill="#000"/><rect x="12" y="8" width="2" height="1" fill="#0c0"/></svg>',
    disp: '<svg viewBox="0 0 16 16"><rect x="1" y="4" width="14" height="9" fill="#2a7a2a" stroke="#000"/><path d="M3 13v2M6 13v2M9 13v2M12 13v2" stroke="#c8a000"/><rect x="4" y="6" width="5" height="4" fill="#111"/></svg>',
    flop: '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#222" stroke="#000"/><rect x="5" y="2" width="6" height="4" fill="#bbb"/><rect x="4" y="9" width="8" height="5" fill="#eee"/></svg>',
    ide: '<svg viewBox="0 0 16 16"><rect x="1" y="6" width="14" height="5" fill="#2a7a2a" stroke="#000"/><path d="M2 8h12" stroke="#ffd400" stroke-dasharray="1 1"/></svg>',
    kbd: '<svg viewBox="0 0 16 16"><rect x="1" y="5" width="14" height="7" fill="#e0dcd0" stroke="#000"/><path d="M3 7h10M3 9h10M5 11h6" stroke="#808080"/></svg>',
    modem: '<svg viewBox="0 0 16 16"><rect x="1" y="6" width="14" height="6" fill="#c0c0c0" stroke="#000"/><rect x="3" y="9" width="1.5" height="1" fill="#0c0"/><rect x="6" y="9" width="1.5" height="1" fill="#c00"/><rect x="9" y="9" width="1.5" height="1" fill="#0c0"/></svg>',
    mon: '<svg viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="10" fill="#c0c0c0" stroke="#000"/><rect x="3" y="3" width="10" height="6" fill="#008080"/><rect x="5" y="12" width="6" height="2" fill="#808080" stroke="#000"/></svg>',
    mouse: '<svg viewBox="0 0 16 16"><rect x="4" y="3" width="8" height="11" rx="4" fill="#e0dcd0" stroke="#000"/><path d="M8 3v5M4 8h8" stroke="#000"/><path d="M8 3c0-2 3-2 3-3" stroke="#000" fill="none"/></svg>',
    net: '<svg viewBox="0 0 16 16"><rect x="1" y="2" width="6" height="5" fill="#00e5ff" stroke="#000"/><rect x="9" y="9" width="6" height="5" fill="#00e5ff" stroke="#000"/><path d="M4 7v4h5" stroke="#000" fill="none"/></svg>',
    other: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#ffd400" stroke="#000"/><text x="8" y="12" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="11">?</text></svg>',
    port: '<svg viewBox="0 0 16 16"><path d="M1 5h14l-2 6H3z" fill="#c0c0c0" stroke="#000"/><path d="M4 7h1M7 7h1M10 7h1M5 9h1M8 9h1" stroke="#000"/></svg>',
    snd: '<svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z" fill="#ffd400" stroke="#000"/><path d="M11 5q2 3 0 6" stroke="#000" fill="none"/></svg>',
    sys: '<svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="12" fill="#c0c0c0" stroke="#000"/><rect x="4" y="5" width="8" height="6" fill="#333"/><path d="M5 4v-2M8 4v-2M11 4v-2M5 12v2M8 12v2M11 12v2" stroke="#000"/></svg>',
    usb: '<svg viewBox="0 0 16 16"><path d="M8 1v12M8 13l-2-2M8 13l2-2M8 5l-4 3v2M8 7l4-2v2" stroke="#000" fill="none" stroke-width="1.3"/><circle cx="8" cy="14" r="1.5"/></svg>',
    pc: '<svg viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="10" fill="#c0c0c0" stroke="#000"/><rect x="3" y="3" width="10" height="6" fill="#000080"/><rect x="4" y="12" width="8" height="3" fill="#808080" stroke="#000"/></svg>',
  };
  if (window.JICON) Object.assign(CAT_IC, { cd: JICON.get('cdrom', 16), disk: JICON.get('hdd', 16), disp: JICON.get('display', 16), flop: JICON.get('floppy', 16), kbd: JICON.get('keyboard', 16), modem: JICON.get('modem', 16), mon: JICON.get('display', 16), mouse: JICON.get('mouse', 16), net: JICON.get('network', 16), other: JICON.get('question', 16), snd: JICON.get('sound', 16), sys: JICON.get('chip', 16), pc: JICON.get('computer', 16) });
  const D = (n, o) => Object.assign({ n, st: 'ok', mfr: '(Standard system devices)', bus: 'PCI bus', res: [], drv: ['JackOS', '11/05/98', ['C:\\JACKOS\\SYSTEM\\VMM32.VXD']] }, o || {});
  const DEVS = [
    ['CDROM', 'cd', [D('JACKATAK 32X CD-ROM', { mfr: '(Standard CD-ROM drives)', bus: 'Secondary IDE controller (dual fifo)', drv: ['JackOS', '11/05/98', ['C:\\JACKOS\\SYSTEM\\IOSUBSYS\\CDFS.VXD', 'C:\\JACKOS\\SYSTEM\\IOSUBSYS\\CDVSD.VXD']], info: 'Firmware revision: 1.99. Reads at 32x on the outside of the disc, 14x on the inside, 0x when Dave\'s greasy disc is in.' })]],
    ['Disk drives', 'disk', [D('GENERIC IDE DISK TYPE47', { mfr: '(Standard disk drives)', bus: 'Primary IDE controller (dual fifo)', info: '6.4 GB, 5400 RPM, Ultra DMA/33. Makes a little "tk-tk-tk" noise when it is thinking.' }), D('GENERIC NEC FLOPPY DISK', { mfr: '(Standard disk drives)', bus: 'Standard Floppy Disk Controller', info: '3\u00bd inch, 1.44 MB. The eject button is a bit sticky.' })]],
    ['Display adapters', 'disp', [D('ATI 3D RAGE PRO AGP 2X', { mfr: 'ETI Technologies', bus: 'Inkle 82443BX Pent-Yum(r) II Processor to AGP controller', res: [['Interrupt Request', '11'], ['Memory Range', 'E0000000 - E7FFFFFF'], ['Input/Output Range', '03B0 - 03BB'], ['Input/Output Range', '03C0 - 03DF']], drv: ['ETI Technologies', '08/03/99', ['C:\\JACKOS\\SYSTEM\\ATI_RAGE.DRV', 'C:\\JACKOS\\SYSTEM\\ATI_RAGE.VXD']], info: '8 MB SGRAM, AGP 2x. It draws the 2D. The Hoodoo2 does the 3D. Teamwork.' })]],
    ['Floppy disk controllers', 'flop', [D('Standard Floppy Disk Controller', { bus: 'ISA Plug and Play bus', res: [['Interrupt Request', '06'], ['Direct Memory Access', '02'], ['Input/Output Range', '03F0 - 03F5']] })]],
    ['Hard disk controllers', 'ide', [D('Inkle 82371AB/EB PCI Bus Master IDE Controller', { mfr: 'Inkle' }), D('Primary IDE controller (dual fifo)', { res: [['Interrupt Request', '14'], ['Input/Output Range', '01F0 - 01F7']] }), D('Secondary IDE controller (dual fifo)', { res: [['Interrupt Request', '15'], ['Input/Output Range', '0170 - 0177']] })]],
    ['Keyboard', 'kbd', [D('Standard 101/102-Key Keyboard (UK layout)', { mfr: '(Standard keyboards)', bus: 'System board', res: [['Interrupt Request', '01'], ['Input/Output Range', '0060 - 0060']], info: 'The W, A, S and D keys are worn shiny.' })]],
    ['Modem', 'modem', [D('JackNet 56K Voice Modem', { mfr: 'JackNet', bus: 'ISA Plug and Play bus', res: [['Interrupt Request', '03'], ['Input/Output Range', '02F8 - 02FF']], drv: ['JackNet', '02/02/99', ['C:\\JACKOS\\SYSTEM\\JACKNET56.VXD', 'C:\\JACKOS\\SYSTEM\\SERIAL.VXD']], info: 'V.90 and K56flex. Connects at 56K on the box, 49,333 bps in real life, 0 bps when Mom picks up the phone.' })]],
    ['Monitors', 'mon', [D('Plug and Play Monitor (VESA DDC)', { mfr: '(Standard monitor types)', bus: 'ATI 3D RAGE PRO AGP 2X', info: '14 inch CRT, 800 x 600 at 75 Hz. Hums a bit. Makes a "thoong" when you switch it on.' })]],
    ['Mouse', 'mouse', [D('Standard Serial Mouse', { mfr: '(Standard mouse types)', bus: 'Communications Port (COM1)', res: [], info: 'Two buttons, one ball, lots of fluff. Take the ball out and pick the fluff off the rollers once a month.' })]],
    ['Network adapters', 'net', [D('Dial-Up Adapter', { mfr: 'JackOS', bus: 'Root', info: 'Pretends the modem is a network card. Everyone is fooled.' })]],
    ['Other devices', 'other', [
      D('Bug Detector', { st: 'irq', mfr: 'Gizmo Industries', bus: 'ISA Plug and Play bus', code: 12, res: [['Interrupt Request', '12'], ['Input/Output Range', '0B00 - 0B0F']], drv: ['Gizmo Industries', '01/04/99', ['C:\\JACKOS\\SYSTEM\\SQUIG.VXD']], info: 'Detects bugs (the computer kind). Beeps when Gubbinz is eating. Beeps a lot.' }),
      D('Hyperdrive Motivator', { st: 'warn', code: 10, mfr: '(Unknown - it came in a box from a galaxy far away)', bus: 'ISA Plug and Play bus', drv: ['Unknown', '(none)', ['(no driver files are required or have been loaded)']], text: 'This device is not working properly. (Code 10)\n\nThe Hyperdrive Motivator has been damaged. JackOS cannot make the jump to lightspeed.\n\nTo fix this, take it to a mechanic on a desert planet, or try hitting it.' }),
      D('Unknown Device: GIZMO-1999', { st: 'warn', code: 28, mfr: '(Unknown)', text: 'The drivers for this device are not installed. (Code 28)\n\nJackOS asked it what it was. It said "beep boop". JackOS does not have a driver for beep boop.' }),
      D('PCI Toaster', { st: 'off', code: 22, mfr: 'Crumb Labs', text: 'This device is disabled. (Code 22)\n\nMom disabled it after the crumpet incident.' }),
      D('Y2K Compliance Chip', { st: 'warn', code: 31, mfr: 'Millennium Hardware Ltd', text: 'This device is not working properly because JackOS cannot load the drivers required for this device. (Code 31)\n\nThe driver is dated 01/01/2000. That date has not happened yet.' }),
    ]],
    ['Ports (COM & LPT)', 'port', [D('Communications Port (COM1)', { bus: 'System board', res: [['Interrupt Request', '04'], ['Input/Output Range', '03F8 - 03FF']], info: 'The mouse is plugged in here.' }), D('Communications Port (COM2)', { bus: 'System board', res: [['Interrupt Request', '03'], ['Input/Output Range', '02F8 - 02FF']], info: 'The modem uses this one.' }), D('ECP Printer Port (LPT1)', { bus: 'System board', res: [['Interrupt Request', '07'], ['Direct Memory Access', '03'], ['Input/Output Range', '0378 - 037A']], info: 'The JackJet 500 is plugged in here. The Epsom is plugged into nothing (it is out of cyan anyway).' })]],
    ['Sound, video and game controllers', 'snd', [D('JackBlaster 16 PnP', { mfr: 'JackBlaster', bus: 'ISA Plug and Play bus', res: [['Interrupt Request', '05'], ['Direct Memory Access', '01'], ['Direct Memory Access', '05'], ['Input/Output Range', '0220 - 022F'], ['Input/Output Range', '0330 - 0331'], ['Input/Output Range', '0388 - 038B']], drv: ['JackBlaster', '30/10/98', ['C:\\JACKOS\\SYSTEM\\JBSB16.VXD', 'C:\\JACKOS\\SYSTEM\\JBSB16.DRV']], info: 'SET BLASTER=A220 I5 D1 H5 T6. 16-bit stereo at 44.1kHz. Plays MIDI with a wobbly FM synth that Jack loves.' }), D('3dfix Hoodoo2 3D Accelerator', { mfr: '3dfix Interactive', bus: 'PCI bus', res: [['Memory Range', 'E8000000 - E8FFFFFF']], drv: ['3dfix Interactive', '15/01/99', ['C:\\JACKOS\\SYSTEM\\GLIDE2X.DLL']], info: '12 MB. Plugged into the graphics card with a little loop-through cable. Makes games look AMAZING.' }), D('Gameport Joystick', { bus: 'JackBlaster 16 PnP', res: [['Input/Output Range', '0201 - 0201']] }), D('MPU-401 Compatible', { bus: 'JackBlaster 16 PnP' }), D('JackAmp Chiptune Engine', { mfr: 'Jack', bus: 'JackBlaster 16 PnP', info: 'Software synth, written by Jack, in his bedroom.' })]],
    ['System devices', 'sys', ['Advanced Power Management support', 'Direct memory access controller', 'Inkle 82371AB/EB PCI to ISA bridge', 'Inkle 82371AB/EB Power Management Controller', 'Inkle 82443BX Pent-Yum(r) II Processor to AGP controller', 'Inkle 82443BX Pent-Yum(r) II Processor to PCI bridge', 'IRQ Holder for PCI Steering', 'ISA Plug and Play bus', 'Motherboard resources', 'Numeric data processor', 'PCI bus', 'Plug and Play BIOS', 'Programmable interrupt controller', 'PS/2 mouse port (nothing plugged in)', 'System board', 'System CMOS/real time clock', 'System speaker', 'System timer', 'Gubbinz bus (8-bit, wobbly)'].map(n => D(n, { bus: 'System board', res: n === 'System timer' ? [['Interrupt Request', '00'], ['Input/Output Range', '0040 - 0043']] : n === 'System CMOS/real time clock' ? [['Interrupt Request', '08'], ['Input/Output Range', '0070 - 0071']] : n === 'Numeric data processor' ? [['Interrupt Request', '13'], ['Input/Output Range', '00F0 - 00FF']] : n === 'Programmable interrupt controller' ? [['Interrupt Request', '02'], ['Input/Output Range', '0020 - 0021']] : n === 'IRQ Holder for PCI Steering' ? [['Interrupt Request', '09']] : n === 'PS/2 mouse port (nothing plugged in)' ? [['Interrupt Request', '12'], ['Input/Output Range', '0060 - 0064']] : [] }))],
    ['Universal Serial Bus controller', 'usb', [D('Inkle 82371AB/EB PCI to USB Universal Host Controller', { mfr: 'Inkle', res: [['Interrupt Request', '10'], ['Input/Output Range', 'E000 - E01F']] }), D('USB Root Hub', { info: '2 ports. Nothing plugged in. Nobody has anything USB yet.' })]],
  ];
  const allDevs = () => DEVS.flatMap(c => c[2].map(d => Object.assign(d, { cat: c[0], ic: c[1] })));
  const IRQ_OWNER = { 0: 'System timer', 1: 'Keyboard', 2: 'Programmable interrupt controller', 3: 'Communications Port (COM2)', 4: 'Communications Port (COM1)', 5: 'JackBlaster 16 PnP', 6: 'Standard Floppy Disk Controller', 7: 'ECP Printer Port (LPT1)', 8: 'System CMOS/real time clock', 10: 'USB Universal Host Controller', 11: 'ATI 3D RAGE PRO AGP 2X', 12: 'PS/2 mouse port (nothing plugged in)', 13: 'Numeric data processor', 14: 'Primary IDE controller (dual fifo)', 15: 'Secondary IDE controller (dual fifo)' };
  function devState(d) {
    if (d.n === 'Bug Detector') { const q = get('irq', 12); return q === 12 ? 'irq' : IRQ_OWNER[q] ? 'irq' : 'ok'; }
    if (d.n === 'PCI Toaster') return 'off';
    return d.st;
  }
  const devStatusText = d => {
    const s = devState(d);
    if (d.n === 'Bug Detector') { const q = get('irq', 12); return s === 'ok' ? `This device is working properly.\n\nIt is using IRQ ${String(q).padStart(2, '0')} (shared nicely through PCI steering). It has detected 1 bug. (It's the Millennium Bug. It's early.)` : `This device is not working properly because it is using an Interrupt Request (IRQ) that ${IRQ_OWNER[q] || 'another device'} is already using. (Code 12)\n\nTo fix this, click the Resources tab, untick "Use automatic settings" and change the Interrupt Request to one nobody else is using.`; }
    return d.text || 'This device is working properly.' + (d.info ? '\n\n' + d.info : '');
  };
  const badge = s => s === 'ok' ? '' : s === 'off' ? '<b class="sys-dm-x">\u00d7</b>' : '<b class="sys-dm-bang">!</b>';
  function devProps(d, after) {
    if (d.n === 'Hyperdrive Motivator') S('hyperdrive');
    const host = h('', 'sys-sheet');
    const w = A.win(d.n + ' Properties', host, { w: 380, icon: CAT_IC[d.ic], noResize: true, noMax: true, escClose: true });
    let auto = true, irq = get('irq', 12);
    tabs(host, [
      ['General', pg => {
        const s = devState(d);
        pg.innerHTML = `<div class="row sys-prtop"><span class="sys-dm-ic big">${mini(CAT_IC[d.ic], 32)}${badge(s)}</span><b>${esc(d.n)}</b></div><hr class="sys-hr"><table class="sys-kv"><tr><td>Device type:</td><td>${esc(d.cat)}</td></tr><tr><td>Manufacturer:</td><td>${esc(d.mfr)}</td></tr><tr><td>Hardware version:</td><td>${d.st === 'ok' ? '00' + (hash(d.n) % 9 + 1) : 'Not available'}</td></tr></table><div class="group"><span class="lg">Device status</span><div class="sys-dm-st">${esc(devStatusText(d))}</div>${s !== 'ok' && s !== 'off' ? '<button type="button" class="btn sys-dm-ts">Troubleshooter...</button>' : ''}</div><div class="group"><span class="lg">Device usage</span><label class="sys-ck"><input type="checkbox" class="sys-dm-dis" ${s === 'off' ? 'checked' : ''}> Disable in this hardware profile</label><label class="sys-ck"><input type="checkbox" checked disabled> Exists in all hardware profiles</label></div>`;
        const ts = qs(pg, '.sys-dm-ts');
        if (ts) on(ts, 'click', () => {
          if (d.n === 'Hyperdrive Motivator') { msg('Hyperdrive Troubleshooter', 'Have you tried hitting it?', 'q', [['Hit it', () => { sfx('thud'); toast('Hyperdrive Motivator', 'BANG! The lights flickered... it\'s working! ... No. It\'s gone again. It\'s not my fault!', 6000); }], ['Don\'t hit it']]); return; }
          if (d.n === 'Bug Detector') return open('system.help', 'irq');
          open('system.help', 'devmgr');
        });
        on(qs(pg, '.sys-dm-dis'), 'change', e => {
          if (d.n === 'PCI Toaster' && !e.target.checked) { toast('PCI Toaster', 'The toaster is enabled! Mom has been notified...', 3000); setTimeout(() => { toast('PCI Toaster', 'Mom disabled the toaster again. (Code 22)', 5000); if (!w.closed) e.target.checked = true; }, 3500); return; }
          if (d.n !== 'PCI Toaster' && e.target.checked) { e.target.checked = false; msg('Device Manager', `If you disable ${d.n}, JackOS might stop working, or Jack might stop working. Better not.`, 'warn'); }
        });
      }],
      ['Driver', pg => {
        pg.innerHTML = `<div class="row sys-prtop">${mini(CAT_IC[d.ic], 32)}<b>${esc(d.n)}</b></div><hr class="sys-hr"><table class="sys-kv"><tr><td>Provider:</td><td>${esc(d.drv[0])}</td></tr><tr><td>Date:</td><td>${esc(d.drv[1])}</td></tr></table><p>Driver files:</p><div class="field sys-dm-files">${d.drv[2].map(f => `<div>${esc(f)}</div>`).join('')}</div><div class="row" style="justify-content:flex-end;margin-top:8px"><button type="button" class="btn sys-dm-fd">Driver File Details...</button><button type="button" class="btn sys-dm-up">Update Driver...</button></div>`;
        on(qs(pg, '.sys-dm-fd'), 'click', () => msg('Driver File Details', `${d.drv[2][0]}\n\nProvider: ${d.drv[0]}\nFile version: 4.10.1999\nCopyright: (C) 1999 ${d.drv[0]}${/\(no driver/.test(d.drv[2][0]) ? '\n\n(There is no file. There is only a sticker that says "MOTIVATOR".)' : ''}`, 'info'));
        on(qs(pg, '.sys-dm-up'), 'click', () => updateDriver(d));
      }],
      ...(d.res.length ? [['Resources', pg => {
        const isSq = d.n === 'Bug Detector';
        const draw = () => {
          const res = d.res.map(r => isSq && r[0] === 'Interrupt Request' ? [r[0], String(irq).padStart(2, '0')] : r);
          const conflict = isSq && IRQ_OWNER[irq] ? `Interrupt Request ${String(irq).padStart(2, '0')} used by:\n${IRQ_OWNER[irq]}` : 'No conflicts.';
          pg.innerHTML = `<div class="row sys-prtop">${mini(CAT_IC[d.ic], 32)}<b>${esc(d.n)}</b></div><label class="sys-ck"><input type="checkbox" class="sys-dm-auto" ${auto ? 'checked' : ''}> Use automatic settings</label><label class="sys-lbl">Setting based on: <select ${auto ? 'disabled' : ''}><option>Basic configuration 0000</option><option>Basic configuration 0001</option></select></label><div class="field sys-dm-res"><div class="sys-dm-rh"><span>Resource type</span><span>Setting</span></div>${res.map((r, i) => `<button type="button" class="sys-dm-rr${i === 0 ? ' sel' : ''}${isSq && r[0] === 'Interrupt Request' && IRQ_OWNER[irq] ? ' bad' : ''}" data-i="${i}"><span>${r[0] === 'Interrupt Request' ? '\u26a1' : r[0] === 'Direct Memory Access' ? '\u21c4' : '\u25a6'} ${esc(r[0])}</span><span>${esc(r[1])}</span></button>`).join('')}</div><div class="row" style="justify-content:flex-end;margin:6px 0"><button type="button" class="btn sys-dm-chg" ${auto ? 'disabled' : ''}>Change Setting...</button></div><div>Conflicting device list:</div><div class="field sys-dm-conf">${esc(conflict)}</div>`;
          on(qs(pg, '.sys-dm-auto'), 'change', e => { if (!isSq && !e.target.checked) { e.target.checked = true; return msg('Resources', 'This resource setting cannot be modified. (It works. Leave it.)', 'info'); } auto = e.target.checked; draw(); });
          qsa(pg, '.sys-dm-rr').forEach(e => on(e, 'click', () => qsa(pg, '.sys-dm-rr').forEach(x => x.classList.toggle('sel', x === e))));
          on(qs(pg, '.sys-dm-chg'), 'click', () => {
            const r = qs(pg, '.sys-dm-rr.sel'); if (!r || res[+r.dataset.i][0] !== 'Interrupt Request') return msg('Resources', 'Click the Interrupt Request line first. That\'s the one that\'s fighting.', 'info');
            let v = irq;
            const e = dlg('Edit Interrupt Request', `<p>Enter the interrupt request you would like to set for this device.</p><p>You may either enter a specific value and the nearest valid value will be automatically selected, or you may select a value using the up and down arrows.</p><div class="row"><span>Value:</span><span class="sys-spin"><input type="text" class="sys-iv" readonly><span><button type="button" data-d="1" aria-label="Up">\u25b2</button><button type="button" data-d="-1" aria-label="Down">\u25bc</button></span></span></div><div class="group"><span class="lg">Conflict information</span><div class="sys-ci"></div></div>`, [['OK', () => { irq = v; put('irq', v); if (!IRQ_OWNER[v]) { S('irq'); sfx('solve'); toast('Device Manager', 'Bug Detector is now working properly. It immediately detected Gubbinz.', 5000); } draw(); if (after) after(); }], ['Cancel']], { w: 330, icon: CAT_IC.other });
            const iv = qs(e.b, '.sys-iv'), ci = qs(e.b, '.sys-ci');
            const show = () => { iv.value = String(v).padStart(2, '0'); ci.textContent = IRQ_OWNER[v] ? `The setting you have chosen conflicts with the following device:\n\n${IRQ_OWNER[v]}` : v === 9 ? 'No devices are conflicting. (IRQ 09 is held for PCI steering, so it can be shared.)' : 'No devices are conflicting.'; ci.classList.toggle('bad', !!IRQ_OWNER[v]); };
            qsa(e.b, '[data-d]').forEach(bt => on(bt, 'click', () => { v = (v + +bt.dataset.d + 16) % 16; show(); }));
            show();
          });
        };
        draw();
      }]] : []),
    ]);
    const row = h('<button type="button" class="btn">OK</button><button type="button" class="btn">Cancel</button>', 'row sys-btns'); host.appendChild(row);
    qsa(row, '.btn').forEach(x => on(x, 'click', () => { w.close(); if (after) after(); }));
    return w;
  }
  function updateDriver(d) {
    const art = window.JICON && JICON.wizArt ? JICON.wizArt('devmgr', 'floppy') : `<svg viewBox="0 0 100 160" width="100" height="160"><rect width="100" height="160" fill="#008080"/><rect x="20" y="50" width="60" height="44" fill="#2a7a2a" stroke="#000"/><path d="M26 94v8M36 94v8M46 94v8M56 94v8M66 94v8M74 94v8" stroke="#c8a000" stroke-width="3"/><rect x="34" y="60" width="24" height="18" fill="#111"/><circle cx="72" cy="40" r="16" fill="#fff" stroke="#000"/><path d="M72 30v10l7 5" stroke="#000" stroke-width="2" fill="none"/></svg>`;
    return wizard('Update Device Driver Wizard', art, [
      { render(pg) { pg.innerHTML = `<p>This wizard searches for updated drivers for:</p><p style="margin-left:16px"><b>${esc(d.n)}</b></p><p>A device driver is a software program that makes a hardware device work.</p>`; } },
      { render(pg) { pg.innerHTML = '<p>What do you want JackOS to do?</p><label class="sys-ck"><input type="radio" name="sysud" checked> Search for a better driver than the one your device is using now. (Recommended)</label><label class="sys-ck"><input type="radio" name="sysud"> Display a list of all the drivers in a specific location, so you can select the driver you want.</label>'; } },
      { render(pg) { pg.innerHTML = '<p>JackOS will search for new drivers in its driver database on your hard drive, and in any of the following selected locations.</p><label class="sys-ck"><input type="checkbox"> Floppy disk drives</label><label class="sys-ck"><input type="checkbox" checked> CD-ROM drive</label><label class="sys-ck"><input type="checkbox"> JackOS Update</label><label class="sys-ck"><input type="checkbox"> Specify a location:</label><input type="text" value="A:\\" style="width:100%">'; } },
      { noNext: true, render(pg, data, ww) {
        pg.innerHTML = '<p>Searching for drivers...</p><div class="sys-bar"></div><div class="small sys-ud-now">&nbsp;</div>';
        const set = bar(qs(pg, '.sys-bar')); const now = qs(pg, '.sys-ud-now');
        crawl({ ms: 4200, set: f => { set(f); now.textContent = 'Looking in ' + pick(['C:\\JACKOS\\INF', 'D:\\DRIVERS', 'C:\\JACKOS\\OPTIONS\\CABS', 'the box the PC came in', 'under the desk', 'Dave\'s floppy']); }, alive: () => !ww.closed, done: () => { if (ww.closed) return; now.textContent = 'Done.'; qs(ww.el, '[data-z=next]').disabled = false; qs(ww.el, '[data-z=next]').click(); } });
      } },
      { last: true, render(pg) { pg.innerHTML = d.n === 'Hyperdrive Motivator' ? '<p><b>JackOS could not find a driver for the Hyperdrive Motivator.</b></p><p>The nearest driver is in a galaxy far, far away. JackOS Update does not deliver that far.</p><p>Status: it\'s not working. It\'s not my fault.</p>' : d.n === 'Bug Detector' ? '<p>JackOS has found an updated driver for this device: <b>SQUIG.VXD 1.0</b>. It is the same driver. The driver isn\'t the problem; the Interrupt Request is. (See the Resources tab.)</p>' : d.st !== 'ok' ? `<p>JackOS was unable to locate a driver for this device.</p><p>If you do not want to install a driver now, click Finish. To search for a driver manually, click Back.</p>` : `<p>JackOS has determined that the driver on your system is the best one for this device.</p><p><b>${esc(d.n)}</b></p><p>(Mostly because there wasn't any other driver.)</p>`; } },
    ], { w: 460, icon: I.devmgr });
  }
  P['system.devmgr'] = arg => {
    const host = h('', 'sys-sheet sys-dmwin');
    const w = A.win('System Properties', host, { w: 420, h: 470, icon: I.devmgr, minW: 320, minH: 380, escClose: true });
    const open1 = new Set(['Other devices']); let sel = arg === 'hyperdrive' ? 'Hyperdrive Motivator' : null, byConn = false;
    const T = tabs(host, [
      ['General', pg => { pg.innerHTML = `<div class="sys-sysg"><div class="sys-syslogo">${window.JICON ? JICON.logo(72) + '<div><i>JackOS</i><b>98</b></div>' : '<div class="sys-flag"><i></i><i></i><i></i><i></i></div><div><i>JackOS</i><b>98</b></div>'}</div><div><p><b>System:</b><br>&nbsp;&nbsp;JackOS 98<br>&nbsp;&nbsp;4.10.1999</p><p><b>Registered to:</b><br>&nbsp;&nbsp;${esc(nick())}<br>&nbsp;&nbsp;JACK ATTACK! Online<br>&nbsp;&nbsp;19990-OEM-0031337-42</p><p><b>Computer:</b><br>&nbsp;&nbsp;GenuineInkle<br>&nbsp;&nbsp;Pent-Yum(r) II Processor<br>&nbsp;&nbsp;350MHz<br>&nbsp;&nbsp;64.0MB RAM</p></div></div>`; }],
      ['Device Manager', pg => {
        pg.innerHTML = `<div class="row"><label class="sys-ck"><input type="radio" name="sysdmv" ${byConn ? '' : 'checked'} value="t"> View devices by type</label><label class="sys-ck"><input type="radio" name="sysdmv" value="c" ${byConn ? 'checked' : ''}> View devices by connection</label></div><div class="field sys-dm" tabindex="0"></div><div class="row sys-btns"><button type="button" class="btn" data-d="prop">Properties</button><button type="button" class="btn" data-d="ref">Refresh</button><button type="button" class="btn" data-d="rem">Remove</button><button type="button" class="btn" data-d="prn">Print...</button></div>`;
        const tree = qs(pg, '.sys-dm');
        const render = () => {
          const groups = byConn ? Object.entries(allDevs().reduce((m, d) => { (m[d.bus] = m[d.bus] || []).push(d); return m; }, {})).map(([k, v]) => [k, 'sys', v]) : DEVS;
          let out = `<div class="sys-dm-n root">${mini(CAT_IC.pc, 16)}<span>Computer</span></div>`;
          groups.forEach(([cat, ic, devs]) => {
            const isOpen = open1.has(cat) || devs.some(d => devState(d) !== 'ok' && !byConn);
            out += `<div class="sys-dm-n cat${sel === cat ? ' sel' : ''}" data-c="${esc(cat)}"><b class="sys-pm">${isOpen ? '\u2212' : '+'}</b>${mini(CAT_IC[ic], 16)}<span>${esc(cat)}</span></div>`;
            if (isOpen) devs.forEach(d => { out += `<div class="sys-dm-n dev${sel === d.n ? ' sel' : ''}" data-d="${esc(d.n)}"><span class="sys-dm-ic">${mini(CAT_IC[d.ic || ic], 16)}${badge(devState(d))}</span><span>${esc(d.n)}</span></div>`; });
          });
          tree.innerHTML = out;
          qsa(tree, '.cat').forEach(e => on(e, 'click', () => { sel = e.dataset.c; if (open1.has(sel)) open1.delete(sel); else open1.add(sel); render(); }));
          qsa(tree, '.dev').forEach(e => { on(e, 'click', () => { sel = e.dataset.d; qsa(tree, '.sys-dm-n').forEach(x => x.classList.toggle('sel', x === e)); }); dbl(e, () => { sel = e.dataset.d; props(); }); });
          const s = qs(tree, '.sel'); if (s) s.scrollIntoView({ block: 'nearest' });
        };
        const props = () => { const d = allDevs().find(x => x.n === sel); if (d) devProps(d, render); else if (sel) { if (open1.has(sel)) open1.delete(sel); else open1.add(sel); render(); } };
        qsa(pg, 'input[name=sysdmv]').forEach(r => on(r, 'change', () => { byConn = r.value === 'c' && r.checked; render(); }));
        on(qs(pg, '[data-d=prop]'), 'click', props);
        on(qs(pg, '[data-d=ref]'), 'click', () => { tree.classList.add('sys-busy'); setTimeout(() => { tree.classList.remove('sys-busy'); render(); toast('Device Manager', 'JackOS looked for new hardware. It found the same stuff. And a crisp.'); }, 1200); });
        on(qs(pg, '[data-d=rem]'), 'click', () => { if (!sel) return; msg('Confirm Device Removal', `Warning: You are about to remove this device from your system.\n\n${sel}\n\n(JackOS will find it again next time you restart. It always does.)`, 'q', [['OK'], ['Cancel']]); });
        on(qs(pg, '[data-d=prn]'), 'click', () => X.Spooler.print('Device Manager - System summary', { pages: 2, owner: nick(), text: allDevs().map(d => `${d.cat}: ${d.n}${devState(d) !== 'ok' ? '  (PROBLEM)' : ''}`).join('\n') }));
        on(tree, 'keydown', ev => { if (ev.key === 'Enter') props(); });
        render();
        if (arg === 'hyperdrive') setTimeout(props, 300);
      }],
      ['Hardware Profiles', pg => { pg.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px">${mini(I.devmgr, 32)}<span>You can create hardware configurations to select from at startup.</span></div><div class="field sys-hp"><div class="sel">Original Configuration</div><div>Dave Is Round (two joysticks)</div><div>Mom Is Using The Scanner</div></div><div class="row"><button type="button" class="btn">Copy...</button><button type="button" class="btn">Rename...</button><button type="button" class="btn">Delete</button></div>`; qsa(pg, '.sys-hp div').forEach(e => on(e, 'click', () => qsa(pg, '.sys-hp div').forEach(x => x.classList.toggle('sel', x === e)))); qsa(pg, '.btn').forEach(b => on(b, 'click', () => toast('Hardware Profiles', 'Hardware profiles are locked. Dad set them up in 1998 and nobody knows the password.'))); }],
      ['Performance', pg => {
        pg.innerHTML = `<div class="group"><span class="lg">Performance status</span><table class="sys-kv"><tr><td>Memory:</td><td>64.0 MB of RAM</td></tr><tr><td>System Resources:</td><td class="sys-pr">${LOAD.res}% free</td></tr><tr><td>File System:</td><td>32-bit</td></tr><tr><td>Virtual Memory:</td><td>32-bit</td></tr><tr><td>Disk Compression:</td><td>Not installed</td></tr><tr><td>PC Cards (PCMCIA):</td><td>No PC Card sockets are installed.</td></tr></table><p style="margin:8px 0 0">${LOAD.res < 30 ? 'Your system is running low on resources. Close some programs.' : 'Your system is configured for optimal performance.'}</p></div><div class="group"><span class="lg">Advanced settings</span><div class="row"><button type="button" class="btn" data-p="fs">File System...</button><button type="button" class="btn" data-p="gr">Graphics...</button><button type="button" class="btn" data-p="vm">Virtual Memory...</button></div></div>`;
        on(qs(pg, '[data-p=fs]'), 'click', () => msg('File System Properties', 'Typical role of this computer: Desktop computer\nRead-ahead optimisation: Full\nCD-ROM supplemental cache: Large\nOptimise access pattern for: Quad-speed or higher\n\n(Turning any of this down would be madness.)', 'info'));
        on(qs(pg, '[data-p=gr]'), 'click', () => { const e = dlg('Advanced Graphics Settings', '<p>These settings control how JackOS uses your graphics hardware. They can help you troubleshoot display-related problems.</p><div class="group"><span class="lg">Graphics</span><div class="row" style="flex-wrap:nowrap">Hardware acceleration: None<input type="range" min="0" max="3" value="3" style="flex:1">Full</div><div class="small sys-gx">Full: All accelerator functions are used. Use this setting if your computer has no problems. (It has loads of problems, but not graphics ones.)</div></div>', [['OK'], ['Cancel']], { w: 360 }); on(qs(e.b, 'input'), 'input', ev => { qs(e.b, '.sys-gx').textContent = ['None: Everything is drawn by hand, by the CPU, slowly. Like a monk.', 'Basic: the mouse pointer goes a bit wobbly.', 'Most: disables some cursor acceleration. Use if the mouse leaves trails of ghosts.', 'Full: All accelerator functions are used.'][+ev.target.value]; }); });
        on(qs(pg, '[data-p=vm]'), 'click', () => dlg('Virtual Memory', '<p>These settings can adversely affect system performance and should be adjusted by advanced users and system administrators only.</p><label class="sys-ck"><input type="radio" name="sysvm" checked> Let JackOS manage my virtual memory settings. (Recommended)</label><label class="sys-ck"><input type="radio" name="sysvm"> Let me specify my own virtual memory settings.</label><table class="sys-kv"><tr><td>Hard disk:</td><td>C:\\ 1,239MB Free</td></tr><tr><td>Minimum:</td><td>0</td></tr><tr><td>Maximum:</td><td>No maximum</td></tr></table><label class="sys-ck"><input type="checkbox"> Disable virtual memory. (Not recommended. Very not recommended.)</label>', [['OK', b => { if (qs(b, 'input[type=checkbox]').checked) X.lowVirtualMemory(); }], ['Cancel']], { w: 360 }));
      }],
    ], 1);
    const row = h('<button type="button" class="btn">OK</button><button type="button" class="btn">Cancel</button>', 'row sys-btns'); host.appendChild(row);
    qsa(row, '.btn').forEach(x => on(x, 'click', w.close));
    return w;
  };

  // ================================================================ SYSTEM MONITOR (live charts)
  const SM_ITEMS = [
    ['Kernel: Processor Usage (%)', () => LOAD.cpu, 100, '#0f0'], ['Memory Manager: Allocated memory (MB)', () => LOAD.mem, 64, '#ff0'], ['Memory Manager: Swapfile in use (MB)', () => LOAD.swap, 32, '#f80'],
    ['Memory Manager: Unused physical memory (MB)', () => 64 - LOAD.mem, 64, '#0ff'], ['Kernel: Threads', () => 40 + LOAD.wins * 3 + rnd(0, 2), 120, '#f0f'], ['File System: Reads/second', () => LOAD.game ? rnd(30, 90) : rnd(0, 12), 100, '#fff'],
    ['Dial-Up Adapter: Bytes Received/Second', () => Math.round(LOAD.kbIn * 1024), 5600, '#8f8'], ['Dial-Up Adapter: Bytes Transmitted/Second', () => Math.round(LOAD.kbOut * 1024), 1200, '#88f'],
    ['Gubbinz: Biscuits eaten/minute', () => rnd(0, 3) + (LOAD.game ? 2 : 0), 10, '#f44'], ['Modem: Connection Speed (bps)', () => Net && Net.connected ? 49333 : 0, 56000, '#fc0'],
  ];
  P['system.sysmon'] = () => {
    let items = get('sysmon', [0, 1, 3]), mode = get('sysmonmode', 'line'), hist = SM_ITEMS.map(() => []), tick = 0;
    const b = h('<div class="sys-sm-tb"><button type="button" class="btn" data-m="add" title="Add Item">+</button><button type="button" class="btn" data-m="rem" title="Remove Item">\u2212</button><button type="button" class="btn" data-m="line" title="Line Charts">\u2571</button><button type="button" class="btn" data-m="bar" title="Bar Charts">\u2590</button><button type="button" class="btn" data-m="num" title="Numeric Charts">12</button></div><div class="sys-sm-grid"></div>', 'sys-sm');
    const w = A.win('System Monitor', b, { w: 520, h: 420, icon: I.sysmon, menubar: true, status: true, minW: 300, minH: 240, onClose: () => stop() });
    const grid = qs(b, '.sys-sm-grid');
    function layout() { grid.innerHTML = items.map(i => `<div class="sys-sm-cell"><div class="sys-sm-t">${esc(SM_ITEMS[i][0])}</div><canvas height="80"></canvas><div class="sys-sm-v"></div></div>`).join('') || '<div class="sys-sm-empty">Choose Edit > Add Item to monitor something. Anything. The CPU is lonely.</div>'; }
    function draw() {
      tick++;
      SM_ITEMS.forEach((it, i) => { hist[i].push(it[1]()); if (hist[i].length > 200) hist[i].shift(); });
      qsa(grid, '.sys-sm-cell').forEach((cell, k) => {
        const i = items[k], it = SM_ITEMS[i], cv = qs(cell, 'canvas'), W = cv.clientWidth || 200; if (cv.width !== W) cv.width = W;
        const x = cv.getContext('2d'), H = cv.height, data = hist[i], v = data[data.length - 1];
        x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.strokeStyle = '#0a4a0a'; x.lineWidth = 1;
        for (let gx = W - (tick * 3) % 20; gx > 0; gx -= 20) { x.beginPath(); x.moveTo(gx + 0.5, 0); x.lineTo(gx + 0.5, H); x.stroke(); }
        for (let gy = 0; gy < H; gy += 16) { x.beginPath(); x.moveTo(0, gy + 0.5); x.lineTo(W, gy + 0.5); x.stroke(); }
        x.strokeStyle = x.fillStyle = it[3];
        if (mode === 'line') { x.beginPath(); const n = Math.floor(W / 3); data.slice(-n).forEach((d, j, arr) => { const px = W - (arr.length - 1 - j) * 3, py = H - 1 - clamp(d / it[2], 0, 1) * (H - 2); j ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); }
        else if (mode === 'bar') { const hh = clamp(v / it[2], 0, 1) * (H - 4); x.fillRect(W / 2 - 30, H - 2 - hh, 60, hh); }
        else { x.font = 'bold 28px Courier New, monospace'; x.textAlign = 'center'; x.fillText(fmt(v), W / 2, H / 2 + 10); }
        qs(cell, '.sys-sm-v').textContent = `Last value: ${fmt(v)}   Peak value: ${fmt(Math.max(...data))}`;
      });
      w.status.textContent = `${items.length} item(s)  \u2022  Update interval: 1 sec  \u2022  ${LOAD.game ? 'A game is running! Everything is on fire.' : 'Idle-ish.'}`;
    }
    const stop = LOAD.onTick(() => { if (!w.closed) draw(); });
    function addItem() {
      const d = dlg('Add Item', `<p>Select a category and an item to monitor:</p><div class="field sys-pick sys-sm-pick">${SM_ITEMS.map((it, i) => `<button type="button" data-i="${i}" ${items.includes(i) ? 'disabled' : ''}>${esc(it[0])}</button>`).join('')}</div>`, [['OK', bb => { const s = qs(bb, '.sel'); if (!s) return false; items.push(+s.dataset.i); put('sysmon', items); layout(); draw(); }], ['Cancel'], ['Explain...', bb => { const s = qs(bb, '.sel'); msg('Explain', s ? SM_ITEMS[+s.dataset.i][0] + '\n\n' + ({ 0: 'How hard the Pent-Yum II is working. 100% means a game is on (or Gubbinz is thinking).', 8: 'Measured by the Bug Detector on IRQ 12. If this is high, hide your sandwiches.', 9: 'What the modem says it connected at. Not what it actually does.' }[+s.dataset.i] || 'A number. It goes up and down. That is the whole point of System Monitor.') : 'Pick an item first.', 'info'); return false; }]], { w: 400 });
      qsa(d.b, '.sys-pick button').forEach(e => on(e, 'click', () => qsa(d.b, '.sys-pick button').forEach(x => x.classList.toggle('sel', x === e))));
    }
    function remItem() {
      const d = dlg('Remove Item', `<p>Select the items you want to stop monitoring:</p><div class="field sys-pick">${items.map(i => `<button type="button" data-i="${i}">${esc(SM_ITEMS[i][0])}</button>`).join('')}</div>`, [['OK', bb => { const s = qs(bb, '.sel'); if (!s) return false; items = items.filter(i => i !== +s.dataset.i); put('sysmon', items); layout(); draw(); }], ['Cancel']], { w: 400 });
      qsa(d.b, '.sys-pick button').forEach(e => on(e, 'click', () => qsa(d.b, '.sys-pick button').forEach(x => x.classList.toggle('sel', x === e))));
    }
    const setMode = m => { mode = m; put('sysmonmode', m); draw(); };
    qsa(b, '.sys-sm-tb .btn').forEach(bt => on(bt, 'click', () => { const m = bt.dataset.m; if (m === 'add') addItem(); else if (m === 'rem') remItem(); else setMode(m); }));
    A.menubar(w, [
      ['File', [{ label: 'Start Logging...', act: () => toast('System Monitor', 'Logging to C:\\JACKOS\\SYSMON.LOG. It will be 4MB by tea time.') }, { label: 'Stop Logging', dis: true }, '-', { label: 'Exit', act: w.close }]],
      ['Edit', [{ label: 'Add Item...', act: addItem }, { label: 'Remove Item...', act: remItem }, { label: 'Edit Item...', dis: true }]],
      ['View', () => [{ label: 'Toolbar', chk: true }, { label: 'Status Bar', chk: true }, { label: 'Always on Top' }, '-', { label: 'Line Charts', rad: mode === 'line', act: () => setMode('line') }, { label: 'Bar Charts', rad: mode === 'bar', act: () => setMode('bar') }, { label: 'Numeric Charts', rad: mode === 'num', act: () => setMode('num') }, '-', { label: 'Hide Title Bar', act: () => toast('System Monitor', 'Nope. Then you couldn\'t move it.') }]],
      ['Options', [{ label: 'Chart...', act: () => msg('Options', 'Update interval:\nFaster <--|--> Slower\n\n(It is on "1 second". Faster would melt the CPU. Slower would be boring.)', 'info') }]],
      ['Help', [{ label: 'Help Topics', act: () => open('system.help', 'sysmon') }]],
    ]);
    layout(); draw();
    return w;
  };

  // ================================================================ RESOURCE METER
  P['system.rsrcmtr'] = () => {
    if (!get('rsrc', false)) {
      msg('Resource Meter', 'Resource Meter uses some system resources itself. (About 1%. It\'s the irony that hurts.)\n\nA little meter will appear in the taskbar next to the clock.', 'info', [['OK', () => { X.resTray(true); P['system.rsrcmtr'](); }], ['Cancel']]);
      return null;
    }
    X.resTray(true);
    const b = h(`${['System resources', 'User resources', 'GDI resources'].map(n => `<div class="sys-rm-row"><span>${n}: <b></b> free</span><div class="prog sys-rm-bar"><span style="display:flex;gap:2px"></span></div></div>`).join('')}<div class="row sys-btns"><button type="button" class="btn">OK</button></div>`, 'sys-rm');
    const w = A.win('Resource Meter', b, { w: 320, icon: I.rsrc, noResize: true, noMax: true, onClose: () => stop() });
    const draw = () => qsa(b, '.sys-rm-row').forEach((r, i) => { const v = [LOAD.res, LOAD.user, LOAD.gdi][i]; qs(r, 'b').textContent = v + '%'; const sp = qs(r, '.prog span'); const n = Math.round(v / 100 * 24); sp.innerHTML = '<i></i>'.repeat(n); sp.style.setProperty('--c', v < 15 ? '#e10600' : v < 35 ? '#c8a000' : '#000080'); });
    const stop = LOAD.onTick(draw); draw();
    on(qs(b, '.btn'), 'click', w.close);
    return w;
  };

  // ================================================================ SCHEDULED TASKS
  const WHEN = { daily: 'Every day', weekly: 'Every Sunday', monthly: 'The 1st of every month', once: 'Once', startup: 'At system startup' };
  function taskProps(t, after) {
    const host = h('', 'sys-sheet');
    const w = A.win(t.n, host, { w: 360, icon: I.sched, noResize: true, noMax: true, escClose: true });
    const d = Object.assign({}, t);
    tabs(host, [
      ['Task', pg => { pg.innerHTML = `<table class="sys-kv"><tr><td>Run:</td><td><input type="text" class="sys-tk-cmd" value="${esc(d.cmd)}" style="width:100%"></td></tr><tr><td>Start in:</td><td><input type="text" value="C:\\JACKOS" style="width:100%" readonly></td></tr><tr><td>Comments:</td><td><input type="text" value="${esc(d.note || '')}" style="width:100%" readonly></td></tr></table><label class="sys-ck"><input type="checkbox" class="sys-tk-on" ${d.on ? 'checked' : ''}> Enabled (scheduled task runs at specified time)</label>`; on(qs(pg, '.sys-tk-cmd'), 'input', e => { d.cmd = e.target.value.trim(); }); on(qs(pg, '.sys-tk-on'), 'change', e => { d.on = e.target.checked; }); }],
      ['Schedule', pg => { pg.innerHTML = `<p>${esc(d.date ? `At ${d.t} on ${d.date}` : `At ${d.t} ${WHEN[d.when].toLowerCase()}, starting ${t99()}`)}</p><table class="sys-kv"><tr><td>Schedule Task:</td><td><select class="sys-tk-when" style="width:100%">${Object.entries(WHEN).map(([k, v]) => `<option value="${k}" ${k === d.when ? 'selected' : ''}>${v}</option>`).join('')}</select></td></tr><tr><td>Start time:</td><td><input type="time" class="sys-tk-t" value="${esc(d.t)}"></td></tr></table><label class="sys-ck"><input type="checkbox"> Show multiple schedules.</label>`; on(qs(pg, '.sys-tk-when'), 'change', e => { d.when = e.target.value; }); on(qs(pg, '.sys-tk-t'), 'change', e => { d.t = e.target.value || d.t; }); }],
      ['Settings', pg => { pg.innerHTML = `<div class="group"><span class="lg">Scheduled Task Completed</span><label class="sys-ck"><input type="checkbox"> Delete the task if it is not scheduled to run again.</label><label class="sys-ck"><input type="checkbox" checked> Stop the task if it runs for: 72 hour(s)</label></div><div class="group"><span class="lg">Idle Time</span><label class="sys-ck"><input type="checkbox"> Only start the task if the computer has been idle for at least 10 minute(s)</label></div><div class="group"><span class="lg">Power Management</span><label class="sys-ck"><input type="checkbox" checked> Don't start the task if the computer is running on batteries. (It isn't. It's a beige tower.)</label></div>`; }],
    ]);
    const row = h('<button type="button" class="btn">OK</button><button type="button" class="btn">Cancel</button>', 'row sys-btns'); host.appendChild(row);
    on(row.children[0], 'click', () => { Object.assign(t, d); w.close(); if (after) after(); });
    on(row.children[1], 'click', w.close);
    return w;
  }
  function newTaskWizard(after) {
    const PROGS = [['Disk Cleanup', 'cleanmgr'], ['Disk Defragmenter', 'defrag'], ['ScanDisk', 'scandisk'], ['Feed Gubbinz', 'grotchi'], ['Backup', 'msbackup'], ['Solitaire (for "research")', 'sol'], ['Screen Saver', 'saver'], ['Phone Dialer', 'dialer'], ['JackOS Update', 'wupdmgr']];
    const art = window.JICON && JICON.wizArt ? JICON.wizArt('sched', 'clock') : `<svg viewBox="0 0 100 160" width="100" height="160"><rect width="100" height="160" fill="#008080"/><rect x="18" y="40" width="64" height="70" fill="#fff" stroke="#000"/><rect x="18" y="40" width="64" height="12" fill="#e10600"/><path d="M26 62h14M46 62h14M66 62h10M26 74h14M46 74h14M26 86h14" stroke="#808080" stroke-width="4"/><circle cx="72" cy="104" r="18" fill="#fff" stroke="#000" stroke-width="2"/><path d="M72 92v12l8 5" stroke="#000" stroke-width="2.5" fill="none"/></svg>`;
    return wizard('Scheduled Task Wizard', art, [
      { render(pg) { pg.innerHTML = '<p>This wizard helps you schedule a task for JackOS to perform.</p><p>You select the program you want JackOS to run, and then schedule it for a convenient time.</p><p>Click Next to continue.</p>'; } },
      { render(pg, d) { pg.innerHTML = `<p>Click the program you want JackOS to run.</p><div class="field sys-pick">${PROGS.map(([n, c], i) => `<button type="button" data-c="${c}" data-n="${esc(n)}" class="${i === 0 ? 'sel' : ''}">${mini(I.app, 16)} ${n}</button>`).join('')}</div><div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn sys-br">Browse...</button></div>`; qsa(pg, '.sys-pick button').forEach(e => on(e, 'click', () => qsa(pg, '.sys-pick button').forEach(x => x.classList.toggle('sel', x === e)))); on(qs(pg, '.sys-br'), 'click', () => Desk.ask('Browse', 'Type the name of the program to run (e.g. calc):', '', 20, v => { if (v) { d.cmd = v.trim().toLowerCase(); d.n = v.trim(); qsa(pg, '.sys-pick button').forEach(x => x.classList.remove('sel')); } })); }, next(d, pg) { const s = qs(pg, '.sys-pick .sel'); if (s) { d.cmd = s.dataset.c; d.n = s.dataset.n; } if (!d.cmd) { msg('Scheduled Task Wizard', 'Pick a program first.', 'warn'); return false; } } },
      { render(pg, d) { pg.innerHTML = `<label class="sys-lbl">Type a name for this task:<input type="text" class="sys-tn" value="${esc(d.n)}" style="width:100%" maxlength="40"></label><p>Perform this task:</p>${Object.entries(WHEN).map(([k, v], i) => `<label class="sys-ck"><input type="radio" name="syswz" value="${k}" ${i === 0 ? 'checked' : ''}> ${v}</label>`).join('')}`; }, next(d, pg) { d.n = qs(pg, '.sys-tn').value.trim() || d.n; d.when = qs(pg, 'input[name=syswz]:checked').value; } },
      { render(pg, d) { pg.innerHTML = `<p>Select the time you want this task to start:</p><label class="sys-lbl">Start time:<input type="time" class="sys-tt" value="16:00"></label>${d.when === 'once' ? '<label class="sys-lbl">Start date:<input type="text" value="31/12/1999" readonly></label><p class="small">(Only one date is available. You know why.)</p>' : ''}`; }, next(d, pg) { d.t = qs(pg, '.sys-tt').value || '16:00'; if (d.when === 'once') d.date = '31/12/1999'; } },
      { last: true, render(pg, d) { pg.innerHTML = `<p>You have successfully scheduled the following task:</p><p style="margin-left:16px"><b>${esc(d.n)}</b></p><p>JackOS will perform this task:</p><p style="margin-left:16px">${esc(WHEN[d.when])} at ${esc(d.t)}${d.date ? ' on ' + d.date : ''}</p><label class="sys-ck"><input type="checkbox" class="sys-op"> Open advanced properties for this task when I click Finish.</label>`; }, next(d, pg) { d.adv = qs(pg, '.sys-op').checked; } },
    ], { w: 470, icon: I.sched, finish: d => { const list = X.tasks(); const t = { n: d.n, cmd: d.cmd, when: d.when, t: d.t, on: true, last: 'Never', date: d.date }; list.push(t); X.saveTasks(list); after(); if (d.adv) taskProps(t, after); } });
  }
  P['system.sched'] = () => {
    if (!get('schedUsed', false)) { put('schedUsed', true); X.schedTray(); } // the tray clock-and-calendar turns up once you've used it
    const b = h('<div class="sys-fold-list"></div>', 'sys-foldwin');
    const w = A.win('Scheduled Tasks', b, { w: 660, h: 320, icon: I.sched, menubar: true, status: true, minW: 320 });
    const lv = listView([['Name', 'flex', null, 170], ['Schedule', 150], ['Next Run Time', 110], ['Last Run Time', 110], ['Status', 90]], { open: r => r.data ? taskProps(r.data, draw) : newTaskWizard(draw), tapOpen: true, menu: r => r && r.data ? [{ label: 'Run', act: () => { X.runTask(r.data, 'now'); draw(); } }, { label: 'End Task', act: () => toast('Scheduled Tasks', 'The task is not running. It is just sitting there, like you.') }, '-', { label: 'Delete', act: () => del(r.data) }, { label: 'Rename', act: () => Desk.ask('Rename', 'New name:', r.data.n, 40, v => { if (v) { r.data.n = v; save(); } }) }, '-', { label: 'Properties', act: () => taskProps(r.data, draw) }] : [{ label: 'Add Scheduled Task', act: () => newTaskWizard(draw) }] });
    qs(b, '.sys-fold-list').appendChild(lv.el);
    let list = X.tasks();
    const save = () => { X.saveTasks(list); draw(); };
    const nextRun = t => { if (!t.on) return 'Disabled'; if (t.when === 'once') return t.t + ' ' + (t.date || '31/12/1999'); if (t.when === 'startup') return 'At startup'; const now = hhmm(); return t.t + ' ' + (t.t > now && t.when === 'daily' ? t99() : t.when === 'daily' ? 'tomorrow' : t.when === 'weekly' ? 'Sunday' : '01/' + String(Desk.today99().m % 12 + 1).padStart(2, '0') + '/99'); };
    function draw() {
      lv.set([{ key: '__add', cells: ['Add Scheduled Task', '', '', '', ''], icon: I.sched }].concat(list.map(t => ({ key: t.n, data: t, cells: [t.n, (t.date ? 'Once at ' + t.t + ' on ' + t.date : WHEN[t.when] + ' at ' + t.t) + (t.on ? '' : ' (disabled)'), nextRun(t), t.last || 'Never', t.note || (t.on ? (get('schedPaused', false) ? 'Paused' : '') : 'Disabled')], icon: I.app, cls: t.note ? 'sys-err' : '' }))), true);
      w.status.textContent = `${list.length} task(s)  \u2022  Task Scheduler is ${get('schedOff', false) ? 'stopped' : get('schedPaused', false) ? 'paused' : 'running'}`;
    }
    function del(t) { msg('Confirm File Delete', `Are you sure you want to send '${t.n}' to the Recycle Bin?`, 'q', [['Yes', () => { if (t.cmd === 'system.millennium') { msg('Scheduled Tasks', 'The Millennium cannot be deleted. It is coming whether you like it or not. (It isn\'t, actually. See Y2K.TXT.)', 'warn'); return; } list = list.filter(x => x !== t); save(); }], ['No']]); }
    A.menubar(w, [
      ['File', () => [{ label: 'New', sub: [{ label: 'Scheduled Task', act: () => newTaskWizard(draw) }] }, { label: 'Run', dis: !(lv.sel && lv.sel.data), act: () => { X.runTask(lv.sel.data, 'now'); draw(); } }, '-', { label: 'Delete', dis: !(lv.sel && lv.sel.data), act: () => del(lv.sel.data) }, { label: 'Properties', dis: !(lv.sel && lv.sel.data), act: () => taskProps(lv.sel.data, draw) }, '-', { label: 'Close', act: w.close }]],
      ['View', [{ label: 'Details', rad: true }, '-', { label: 'Refresh', key: 'F5', act: draw }]],
      ['Advanced', () => [{ label: get('schedOff', false) ? 'Start Using Task Scheduler' : 'Stop Using Task Scheduler', act: () => { put('schedOff', !get('schedOff', false)); X.schedTray(); draw(); } }, { label: get('schedPaused', false) ? 'Continue Task Scheduler' : 'Pause Task Scheduler', act: () => { put('schedPaused', !get('schedPaused', false)); X.schedTray(); draw(); } }, '-', { label: 'Notify Me of Missed Tasks', chk: true }, { label: 'View Log', act: () => Desk.notepad('SchedLog.txt', `"Task Scheduler Service"\n\tStarted at ${t99()} ${hhmm()}\n"Feed Gubbinz.job" (JACKOTCHI.EXE)\n\tStarted ${t99()} 16:00:00\n\tFinished ${t99()} 16:00:04\n\tResult: Gubbinz says he wasn't fed. He was.\n"Tidy bedroom.job"\n\tCould not start. The program was not found. (0x80070002)\n"Millennium.job"\n\tNext run time: never. (See Y2K.TXT)\n"Maintenance-ScanDisk.job"\n\tStarted Sunday 00:30\n\tResult: found 1 bug in a lost cluster. Converted to FILE0001.CHK.\n`) }]],
      ['Help', [{ label: 'Help Topics', act: () => open('system.help', 'sched') }]],
    ]);
    draw();
    return w;
  };

  // ================================================================ BACKUP (1,440 floppies)
  P['system.backup'] = () => {
    const art = window.JICON && JICON.wizArt ? JICON.wizArt('backup', 'floppy') : `<svg viewBox="0 0 100 160" width="100" height="160"><rect width="100" height="160" fill="#000080"/><g transform="translate(14 30)"><rect x="0" y="0" width="40" height="40" fill="#222" stroke="#000"/><rect x="10" y="0" width="20" height="12" fill="#bbb"/><rect x="6" y="22" width="28" height="18" fill="#eee"/></g><g transform="translate(40 56)"><rect x="0" y="0" width="40" height="40" fill="#2a4aa0" stroke="#000"/><rect x="10" y="0" width="20" height="12" fill="#bbb"/><rect x="6" y="22" width="28" height="18" fill="#eee"/></g><g transform="translate(24 84)"><rect x="0" y="0" width="40" height="40" fill="#a02a2a" stroke="#000"/><rect x="10" y="0" width="20" height="12" fill="#bbb"/><rect x="6" y="22" width="28" height="18" fill="#eee"/></g><text x="50" y="146" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="11" fill="#fff">x 1,440</text></svg>`;
    let job = null;
    return wizard('JackOS Backup', art, [
      { render(pg) { pg.innerHTML = '<p><b>Welcome to JackOS Backup!</b></p><p>A backup is a copy of the files from your computer stored on media such as a tape, a floppy disk or another hard disk.</p><p>What would you like to do?</p><label class="sys-ck"><input type="radio" name="sysbk" value="new" checked> Create a new backup job.</label><label class="sys-ck"><input type="radio" name="sysbk" value="open"> Open an existing backup job.</label><label class="sys-ck"><input type="radio" name="sysbk" value="rest"> Restore backed up files.</label>'; }, next(d, pg) { const v = qs(pg, 'input[name=sysbk]:checked').value; if (v === 'rest') { msg('JackOS Backup', 'There are no previous backups to restore from.\n\n(There was one in 1998. It was on 23 floppies. Floppy 17 is a coaster now.)', 'warn'); return false; } if (v === 'open') { msg('Open Backup Job', 'Backup jobs: (none)\n\nWell. "Everything (don\'t lose this one)" was there, but the file is 0 bytes.', 'info'); return false; } } },
      { render(pg, d) { pg.innerHTML = '<p>What to back up?</p><label class="sys-ck"><input type="radio" name="sysbw" value="all" checked> Back up My Computer (backs up everything on your hard disk)</label><label class="sys-ck"><input type="radio" name="sysbw" value="sel"> Back up selected files, folders and drives</label><div class="field sys-bk-tree"><label><input type="checkbox" checked> <b>My Computer</b></label><label style="margin-left:18px"><input type="checkbox" checked> Jack\'s PC (C:)</label><label style="margin-left:36px"><input type="checkbox" checked> My Documents (Diary, Pocket Critters, Homework (empty))</label><label style="margin-left:36px"><input type="checkbox" checked> JACKOS</label><label style="margin-left:36px"><input type="checkbox" checked> Program Files</label><label style="margin-left:36px"><input type="checkbox" checked> GAMES (Dad\'s GLOOM)</label><label style="margin-left:18px"><input type="checkbox"> Gubbinz (cannot be backed up: he bites)</label></div>'; }, next(d, pg) { d.all = qs(pg, 'input[value=all]').checked; const n = qsa(pg, '.sys-bk-tree input:checked').length; d.mb = d.all ? 5190 : Math.max(2, n * 740); } },
      { render(pg, d) { pg.innerHTML = `<p>Where to back up?</p><label class="sys-lbl">Back up to:<select class="sys-bk-to" style="width:100%"><option value="a">3\u00bd Floppy (A:)</option><option value="tape">Tape drive (not installed)</option><option value="zip">Zip 100 drive (on the Christmas list)</option><option value="c">File on C: (backing up C: to C:)</option><option value="dave">\\\\DAVE-PC\\C (over the modem)</option></select></label><div class="sys-bk-est"></div>`; const est = qs(pg, '.sys-bk-est'); const upd = () => { const v = qs(pg, '.sys-bk-to').value; d.to = v; est.innerHTML = { a: `<p>Estimated size: <b>${fmt(d.mb)} MB</b><br>Floppy disks required: <b>${fmt(Math.ceil(d.mb / 1.44))}</b> (1.44 MB each)<br>Floppy disks you own: <b>3</b> (one is Dave's)<br>Estimated time: <b>${fmt(Math.ceil(d.mb / 1.44 * 1.5 / 60))} hours</b> of swapping disks</p>`, tape: '<p>There is no tape drive. Dad says they cost \u00a3200. Dad says a lot of things.</p>', zip: '<p>100 MB per disk. You would need ' + fmt(Math.ceil(d.mb / 100)) + ' Zip disks at \u00a312 each. That is more than the PC cost.</p>', c: '<p>Backing up C: to C: is like photocopying your homework and keeping both copies in the same bag you are about to lose.</p>', dave: `<p>At 49,333 bps this would take <b>${fmt(Math.ceil(d.mb * 8 * 1024 / 49.333 / 3600 / 24))} days</b>, and Dave's Mom needs the phone.</p>` }[v]; }; on(qs(pg, '.sys-bk-to'), 'change', upd); upd(); }, next(d) { if (d.to !== 'a') { msg('JackOS Backup', d.to === 'c' ? 'JackOS refuses, on principle.' : 'That destination is not available. The floppy drive is. It is always the floppy drive.', 'warn'); return false; } } },
      { render(pg, d) { pg.innerHTML = `<p>How to back up?</p><label class="sys-ck"><input type="checkbox" checked> Compare original and backup files to verify data was successfully backed up.</label><label class="sys-ck"><input type="checkbox" checked> Compress the backup data to save space. (Saves about 40 floppies. Still ${fmt(Math.ceil(d.mb / 1.44) - 40)} to go.)</label><label class="sys-lbl">Name the backup job:<input type="text" class="sys-bk-n" value="Everything (don't lose this one) (2)" style="width:100%"></label>`; }, next(d, pg) { d.name = qs(pg, '.sys-bk-n').value.trim() || 'Untitled'; d.disks = Math.ceil(d.mb / 1.44); } },
      { noNext: true, render(pg, d, ww) {
        pg.innerHTML = `<p>Backup job: <b>${esc(d.name)}</b></p><table class="sys-kv"><tr><td>Device:</td><td>3\u00bd Floppy (A:)</td></tr><tr><td>Media:</td><td class="sys-bk-disk">Disk 1 of ${fmt(d.disks)}</td></tr><tr><td>Status:</td><td class="sys-bk-st">Backing up...</td></tr><tr><td>Files:</td><td class="sys-bk-f">0</td></tr><tr><td>Bytes:</td><td class="sys-bk-b">0</td></tr><tr><td>Time:</td><td class="sys-bk-t">0:00</td></tr></table><div class="sys-bar"></div><div class="small sys-bk-now">&nbsp;</div>`;
        const set = bar(qs(pg, '.sys-bar')); let disk = 1, files = 0, bytes = 0, t0 = Date.now();
        const FILES = ['C:\\JACKOS\\SYSTEM\\KERNEL32.DLL', 'C:\\My Documents\\Diary\\march.txt', 'C:\\My Documents\\Painting\\bitsbox.txt', 'C:\\JACKOS\\GUBBINZ.VXD', 'C:\\GAMES\\GLOOM\\GLOOM.WAD', 'C:\\My Documents\\homework.txt (0 bytes)', 'C:\\JACKOS\\WIN386.SWP (112MB, why)', 'C:\\Program Files\\JackAmp\\JACKAMP.EXE'];
        const tmr = setInterval(() => { if (ww.closed) return clearInterval(tmr); files += rnd(3, 14); bytes += rnd(40000, 140000); qs(pg, '.sys-bk-f').textContent = fmt(files); qs(pg, '.sys-bk-b').textContent = fmt(bytes); const s = Math.floor((Date.now() - t0) / 1000); qs(pg, '.sys-bk-t').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); qs(pg, '.sys-bk-now').textContent = pick(FILES); }, 400);
        const next = () => {
          if (ww.closed) return clearInterval(tmr);
          crawl({ ms: 2600, set, alive: () => !ww.closed, stallMs: 1200, done: () => {
            if (ww.closed) return;
            disk++; qs(pg, '.sys-bk-disk').textContent = `Disk ${disk} of ${fmt(d.disks)}`;
            if (disk === 3) S('floppies');
            if (disk >= 4) { clearInterval(tmr); qs(pg, '.sys-bk-st').textContent = 'Stopped.'; msg('JackOS Backup', `Please insert disk ${disk} of ${fmt(d.disks)} into drive A:.\n\nYou don't have a disk ${disk}. You have 3 disks. One of them has GLOOM on it and Dave wants it back.\n\nBackup job "${d.name}" has been stopped after ${fmt(files)} files (${(bytes / 1048576).toFixed(1)} MB of ${fmt(d.mb)} MB). That is ${(bytes / 1048576 / d.mb * 100).toFixed(2)}%.`, 'warn', [['OK', () => { qs(ww.el, '[data-z=next]').disabled = false; qs(ww.el, '[data-z=next]').click(); }]]); return; }
            sfx('turn');
            msg('Insert Disk', `Please insert disk ${disk} of ${fmt(d.disks)} into drive A:, then click OK.\n\n(Label it! Jack learnt this the hard way.)`, 'info', [['OK', () => { set(0); next(); }], ['Cancel', () => { clearInterval(tmr); qs(pg, '.sys-bk-st').textContent = 'Cancelled.'; qs(ww.el, '[data-z=next]').disabled = false; }]]);
          } });
        };
        next();
      } },
      { last: true, render(pg, d) { pg.innerHTML = `<p><b>Backup incomplete.</b></p><p>Items backed up: some of C:\\JACKOS (the boring bit).</p><p>Disks used: 3 of ${fmt(d.disks)}.</p><p>Recommendation: don't break anything. Alternatively, ask for a Zap Drive for Christmas, or a CD writer (\u00a3250, you'd need 9 CDs).</p><p>A note has been saved in My Documents.</p>`; } },
    ], { w: 480, icon: I.backup });
  };

  // ================================================================ DISK CLEANUP
  P['system.cleanmgr'] = () => {
    const CATS = [['Temporary Internet Files', 0.74, 'Pictures of every web page you ever looked at, in case you want to look at them again without the modem.', true], ['Downloaded Program Files', 0.00, 'ActiveX controls and Java applets. Jack says "no" to all of them.', true], ['Recycle Bin', 1.21, 'The Recycle Bin contains files you have deleted. They are not permanently removed until you empty it. There are 3 Z-Wing drawings in here that Jack is not ready to lose.', false], ['Temporary files', 2.60, 'Programs leave these behind. Like crumbs. Mostly Dave\'s.', true], ['Old ScanDisk files in the root folder', 0.03, 'FILE0001.CHK: a bug in a lost cluster. FILE0002.CHK: the rest of it.', true], ['Homework', 0.00, 'C:\\My Documents\\homework.txt is 0 bytes. Deleting it saves nothing. But it feels good.', false], ['Intergalactic Battles pictures (My Pictures)', 14.2, 'DO NOT DELETE. Jack will know. He has a list.', false]];
    const b = h(`<p>Disk Cleanup is calculating how much space you will be able to free on Jack's PC (C:). This may take a few minutes to complete.</p><div class="sys-bar"></div><div class="small sys-cl-now">Scanning: Temporary Internet Files</div>`, 'sys-cl');
    const w0 = A.win('Disk Cleanup', b, { w: 360, icon: I.clean, noResize: true, noMax: true });
    const set = bar(qs(b, '.sys-bar'));
    crawl({ ms: 3000, set: f => { set(f); qs(b, '.sys-cl-now').textContent = 'Scanning: ' + CATS[Math.min(CATS.length - 1, Math.floor(f * CATS.length))][0]; }, alive: () => !w0.closed, stallMs: 1500, done: () => { if (w0.closed) return; w0.close(); main(); } });
    function main() {
      const host = h('', 'sys-sheet');
      const w = A.win('Disk Cleanup for Jack\'s PC (C:)', host, { w: 400, icon: I.clean, noResize: true, noMax: true, escClose: true });
      const checked = CATS.map(c => c[3]);
      const total = () => CATS.reduce((a, c, i) => a + (checked[i] ? c[1] : 0), 0);
      tabs(host, [
        ['Disk Cleanup', pg => {
          pg.innerHTML = `<p>You can use Disk Cleanup to free up to <b>${CATS.reduce((a, c) => a + c[1], 0).toFixed(2)} MB</b> of disk space on Jack's PC (C:).</p><div>Files to delete:</div><div class="field sys-cl-list">${CATS.map((c, i) => `<label class="sys-cl-row"><input type="checkbox" data-i="${i}" ${checked[i] ? 'checked' : ''}><span>${esc(c[0])}</span><b>${c[1].toFixed(2)} MB</b></label>`).join('')}</div><div class="row" style="justify-content:space-between"><span>Total amount of disk space you gain:</span><b class="sys-cl-tot">${total().toFixed(2)} MB</b></div><div class="group"><span class="lg">Description</span><div class="sys-cl-desc">${esc(CATS[0][2])}</div><div class="row" style="justify-content:flex-end;margin-top:4px"><button type="button" class="btn sys-cl-view">View Files</button></div></div>`;
          let cur = 0;
          qsa(pg, '.sys-cl-row').forEach((r, i) => { on(r, 'click', () => { cur = i; qs(pg, '.sys-cl-desc').textContent = CATS[i][2]; }); on(qs(r, 'input'), 'change', e => { checked[i] = e.target.checked; qs(pg, '.sys-cl-tot').textContent = total().toFixed(2) + ' MB'; if (i === 6 && e.target.checked) { e.target.checked = false; checked[i] = false; qs(pg, '.sys-cl-tot').textContent = total().toFixed(2) + ' MB'; msg('Disk Cleanup', 'No.', 'warn'); } }); });
          on(qs(pg, '.sys-cl-view'), 'click', () => { if (cur === 2) open('files.bin'); else if (cur === 6) open('imgview'); else open('explorer', cur === 4 ? 'C:\\' : 'C:\\JACKOS'); });
        }],
        ['More Options', pg => { pg.innerHTML = `<div class="group"><span class="lg">JackOS components</span><p>You can free more disk space by removing optional JackOS components that you do not use.</p><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-c="w">Clean up...</button></div></div><div class="group"><span class="lg">Installed programs</span><p>You can free more disk space by removing programs that you do not use.</p><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-c="p">Clean up...</button></div></div><div class="group"><span class="lg">Drive conversion (FAT32)</span><p>Already converted. It took all night and Dad stayed up watching it. Nothing changed.</p></div>`; on(qs(pg, '[data-c=w]'), 'click', () => toast('Disk Cleanup', 'Optional components: Desktop Themes (1.9 MB), Screen Savers (0.8 MB), Gubbinz (he\'s not optional).')); on(qs(pg, '[data-c=p]'), 'click', () => A.run('appwiz.cpl')); }],
        ['Settings', pg => { pg.innerHTML = '<label class="sys-ck"><input type="checkbox" checked> If this drive runs low on disk space, automatically run Disk Cleanup.</label><p class="small">(It runs about once a week. The drive is 6.4 GB. Mom says it is "massive". It is not massive.)</p>'; }],
      ]);
      const row = h('<button type="button" class="btn">OK</button><button type="button" class="btn">Cancel</button>', 'row sys-btns'); host.appendChild(row);
      on(row.children[1], 'click', w.close);
      on(row.children[0], 'click', () => msg('Disk Cleanup for Jack\'s PC (C:)', 'Are you sure you want to delete files?', 'q', [['Yes', () => { w.close(); doClean(total()); }], ['No']]));
    }
    function doClean(mb) {
      const b2 = h('<p>Disk Cleanup is cleaning up unnecessary files on your machine.</p><div class="sys-bar"></div><div class="small sys-cl-now">Cleaning: Temporary Internet Files</div><div class="row sys-btns"><button type="button" class="btn">Cancel</button></div>', 'sys-cl');
      const w = A.win('Disk Cleanup', b2, { w: 360, icon: I.clean, noResize: true, noMax: true });
      const set = bar(qs(b2, '.sys-bar')); on(qs(b2, '.btn'), 'click', w.close);
      crawl({ ms: 4000, set: f => { set(f); qs(b2, '.sys-cl-now').textContent = f >= 0.99 ? 'Cleaning: that one file that will not delete...' : 'Cleaning: ' + CATS[Math.min(4, Math.floor(f * 5))][0]; }, alive: () => !w.closed, stallMs: 6000, done: () => { if (w.closed) return; w.close(); S('cleanup'); sfx('solve'); msg('Disk Cleanup', `Disk Cleanup has finished.\n\nSpace freed: ${mb.toFixed(2)} MB.\nSpace on C: now: 1.21 GB free... no wait, 1.21 GB free. Same as before. The number on the drive didn't change. It never does.\n\n(The one file that would not delete was GUBBINZ.TMP. He put it back.)`, 'info'); } });
    }
    return w0;
  };

  // ================================================================ MAINTENANCE WIZARD
  P['system.tuneup'] = () => {
    const art = window.JICON && JICON.wizArt ? JICON.wizArt('tuneup', 'cleanup') : `<svg viewBox="0 0 100 160" width="100" height="160"><rect width="100" height="160" fill="#000080"/><rect x="20" y="40" width="60" height="44" fill="#c0c0c0" stroke="#000"/><rect x="26" y="46" width="48" height="30" fill="#008080"/><rect x="38" y="86" width="24" height="6" fill="#808080" stroke="#000"/><path d="M68 120l-20-20 6-6 20 20z" fill="#808080" stroke="#000"/><path d="M46 92a9 9 0 1 1-6 6l4-4 4 4 2-2-4-4z" fill="#808080" stroke="#000"/><circle cx="76" cy="128" r="10" fill="#ffd400" stroke="#000"/></svg>`;
    return wizard('Maintenance Wizard', art, [
      { render(pg) { pg.innerHTML = '<p>Using the Maintenance Wizard, you can make your programs run faster, check your hard disk for problems, and free up hard disk space.</p><p>By performing these tasks on a regular basis, you can make sure your computer is running at its best. (Its best is a Pent-Yum II 350. That\'s pretty good, actually.)</p><label class="sys-ck"><input type="radio" name="systu" value="e" checked> Express - Use the most common maintenance settings.</label><label class="sys-ck"><input type="radio" name="systu" value="c"> Custom - Select your own maintenance settings.</label>'; }, next(d, pg) { d.custom = qs(pg, 'input[value=c]').checked; } },
      { render(pg, d) { pg.innerHTML = '<p>Choose a time when your computer is on, but you are not using it.</p><label class="sys-ck"><input type="radio" name="systw" checked> Nights - Midnight to 3:00 AM</label><label class="sys-ck"><input type="radio" name="systw"> Days - Noon to 3:00 PM (school)</label><label class="sys-ck"><input type="radio" name="systw"> Evenings - 8:00 PM to 11:00 PM (Dad is on it)</label><label class="sys-ck"><input type="radio" name="systw"> Custom - Use current settings</label><p class="small">Note: the computer is never on at midnight. Mom turns it off at the wall. ScanDisk runs every morning because of this.</p>'; } },
      { render(pg, d) { if (!d.custom) { pg.innerHTML = '<p>JackOS will perform the following tasks:</p><ul><li>Speed up your most frequently used programs (Disk Defragmenter)</li><li>Check your hard disk for errors (ScanDisk)</li><li>Delete unnecessary files from your hard disk (Disk Cleanup)</li></ul>'; return; } pg.innerHTML = `<p>Select the tasks you want JackOS to perform:</p>${[['Speed up programs (Defragmenter)', true], ['Scan hard disk for errors (ScanDisk)', true], ['Delete unnecessary files (Disk Cleanup)', true], ['Feed Gubbinz (he insisted on being in here)', true], ['Blow the dust out of the case (manual)', false], ['Tidy bedroom (not supported)', false]].map(([n, c]) => `<label class="sys-ck"><input type="checkbox" ${c ? 'checked' : ''}> ${n}</label>`).join('')}`; } },
      { last: true, render(pg, d) { pg.innerHTML = '<p>JackOS will perform the maintenance tasks you have chosen, on the schedule you have chosen.</p><p>Would you like to run them now?</p><label class="sys-ck"><input type="checkbox" class="sys-tu-now" checked> When I click Finish, perform each scheduled task for the first time.</label>'; }, next(d, pg) { d.now = qs(pg, '.sys-tu-now').checked; } },
    ], { w: 480, icon: I.tuneup, finish: d => { if (!d.now) return toast('Maintenance Wizard', 'Scheduled. See Scheduled Tasks.'); let i = 0; const steps = ['scandisk', 'defrag', 'cleanmgr']; const run = () => { if (i >= steps.length) { S('maint'); return msg('Maintenance Wizard', 'All maintenance tasks have run.\n\nYour computer is now 0.4% faster. You will not notice. Jack noticed. Jack says it "feels snappier".', 'info'); } const s = steps[i++]; toast('Maintenance Wizard', `Running ${s}...`, 2500); A.run(s); setTimeout(run, 5000); }; run(); } });
  };

  // ================================================================ ACCESSIBILITY WIZARD
  P['system.accwiz'] = () => {
    const art = window.JICON && JICON.wizArt ? JICON.wizArt('access', 'magnifier') : `<svg viewBox="0 0 100 160" width="100" height="160"><rect width="100" height="160" fill="#000080"/><circle cx="50" cy="60" r="34" fill="#2a7ad8" stroke="#fff" stroke-width="2"/><circle cx="50" cy="40" r="6" fill="#fff"/><path d="M30 50h40M50 50v18l-10 18M50 68l10 18" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><text x="50" y="130" text-anchor="middle" font-family="Arial" font-size="22" font-weight="bold" fill="#fff">Aa</text></svg>`;
    const restore = () => { document.documentElement.style.removeProperty('--sys-zoom'); document.body.classList.remove('sys-bigtext', 'sys-hicontrast', 'sys-bigcursor'); put('acc', null); };
    return wizard('Accessibility Wizard', art, [
      { render(pg) { pg.innerHTML = '<p>This wizard helps you configure JackOS for your vision, hearing and mobility needs.</p><p>Click the smallest text you can read:</p><div class="sys-acc-sizes"><button type="button" class="btn sel" data-s="1">Use usual text size for JackOS.</button><button type="button" class="btn" data-s="1.25" style="font-size:15px">Use large window titles and menus.</button><button type="button" class="btn" data-s="1.6" style="font-size:19px">Use JackOS Magnifier, and large titles and menus.</button></div>'; qsa(pg, '[data-s]').forEach(e => on(e, 'click', () => qsa(pg, '[data-s]').forEach(x => x.classList.toggle('sel', x === e)))); }, next(d, pg) { d.size = +qs(pg, '[data-s].sel').dataset.s; } },
      { render(pg, d) { pg.innerHTML = '<p>Select the statements that apply to you:</p>' + [['vis', 'I am blind or have difficulty seeing things on screen.'], ['hear', 'I am deaf or have difficulty hearing sounds from the computer.'], ['mob', 'I have difficulty using the keyboard or mouse.'], ['ork', 'I am a robot and I have difficulty with everything that is not beeping.'], ['set', 'I want to set administrative options.']].map(([k, t]) => `<label class="sys-ck"><input type="checkbox" data-k="${k}"> ${t}</label>`).join(''); }, next(d, pg) { d.opts = qsa(pg, 'input:checked').map(e => e.dataset.k); if (d.opts.includes('ork')) { sfx('beep'); toast('Accessibility Wizard', 'Robot mode is not available in this version of JackOS. Gubbinz has filed a complaint.', 5000); } } },
      { render(pg, d) { pg.innerHTML = `<p>Choose a colour scheme and cursor size:</p><label class="sys-ck"><input type="checkbox" class="sys-ac-hc" ${d.opts && d.opts.includes('vis') ? 'checked' : ''}> Use a high contrast colour scheme (white on black)</label><label class="sys-ck"><input type="checkbox" class="sys-ac-cur"> Use a large mouse pointer</label><label class="sys-ck"><input type="checkbox" class="sys-ac-snd" ${d.opts && d.opts.includes('hear') ? 'checked' : ''}> Use SoundSentry (flash the screen instead of beeping)</label>${d.opts && d.opts.includes('mob') ? '<label class="sys-ck"><input type="checkbox" checked> Use StickyKeys (press Ctrl, Alt or Shift one at a time)</label><label class="sys-ck"><input type="checkbox"> Use MouseKeys (move the pointer with the number pad)</label>' : ''}`; }, next(d, pg) { d.hc = qs(pg, '.sys-ac-hc').checked; d.cur = qs(pg, '.sys-ac-cur').checked; d.snd = qs(pg, '.sys-ac-snd').checked; } },
      { last: true, render(pg, d) { pg.innerHTML = `<p>You have completed the Accessibility Wizard. The following settings will be applied:</p><ul>${d.size > 1 ? `<li>Text size: ${d.size === 1.25 ? 'Large' : 'Extra large (Magnifier)'}</li>` : ''}${d.hc ? '<li>High contrast colours</li>' : ''}${d.cur ? '<li>Large mouse pointer</li>' : ''}${d.snd ? '<li>SoundSentry</li>' : ''}${d.size === 1 && !d.hc && !d.cur && !d.snd ? '<li>No changes. Everything is fine as it is. Lovely.</li>' : ''}</ul><p class="small">Run the wizard again (Start > Programs > Accessories > Accessibility) to put things back.</p>`; } },
    ], { w: 470, icon: I.access, finish: d => {
      restore();
      if (d.size > 1) { document.documentElement.style.setProperty('--sys-zoom', d.size); document.body.classList.add('sys-bigtext'); S('accwiz'); }
      if (d.hc) { document.body.classList.add('sys-hicontrast'); if (A.run) A.run('access.cpl'); }
      if (d.cur) document.body.classList.add('sys-bigcursor');
      put('acc', { size: d.size, hc: d.hc, cur: d.cur });
      if (d.snd) { toast('SoundSentry', 'SoundSentry is on. Every beep will flash the screen.', 4000); document.body.classList.add('sys-flash'); setTimeout(() => document.body.classList.remove('sys-flash'), 300); }
    } });
  };
  (function restoreAcc() { const a = get('acc', null); if (!a) return; if (a.size > 1) { document.documentElement.style.setProperty('--sys-zoom', a.size); document.body.classList.add('sys-bigtext'); } if (a.hc) document.body.classList.add('sys-hicontrast'); if (a.cur) document.body.classList.add('sys-bigcursor'); })();

  // ================================================================ SOUND RECORDER (records real audio into memory, plays it back; never leaves the PC)
  P['system.sndrec'] = arg => {
    const name = arg && arg.name ? arg.name : 'Sound';
    const b = h(`<div class="sys-sr"><div class="sys-sr-top"><div class="sys-sr-pos">Position:<br><b>0.00 sec.</b></div><div class="sys-sr-scope"><canvas width="110" height="54"></canvas></div><div class="sys-sr-len">Length:<br><b>0.00 sec.</b></div></div><input type="range" class="sys-sr-slider" min="0" max="1000" value="0" aria-label="Position"><div class="sys-sr-btns"><button type="button" class="btn" data-s="start" title="Seek to Start">|&#9664;&#9664;</button><button type="button" class="btn" data-s="end" title="Seek to End">&#9654;&#9654;|</button><button type="button" class="btn" data-s="play" title="Play">&#9654;</button><button type="button" class="btn" data-s="stop" title="Stop">&#9632;</button><button type="button" class="btn sys-sr-rec" data-s="rec" title="Record">&#9679;</button></div></div>`, 'sys-srwin');
    const w = A.win(name + ' - Sound Recorder', b, { w: 330, icon: I.mic, menubar: true, noResize: true, noMax: true, onClose: () => { stopAll(); if (stream) stream.getTracks().forEach(t => t.stop()); } });
    const cv = qs(b, 'canvas'), g = cv.getContext('2d'), slider = qs(b, '.sys-sr-slider');
    let buf = null, src = null, rec = null, stream = null, chunks = [], raf = 0, t0 = 0, mode = 'idle', pos = 0, reversed = false, speed = 1, echo = false, vol = 1, recT = 0, playLen = 0;
    const ac = () => Sound.unlock && Sound.unlock();
    const len = () => buf ? buf.duration : 0;
    const setPos = p => { pos = clamp(p, 0, len()); qs(b, '.sys-sr-pos b').textContent = pos.toFixed(2) + ' sec.'; slider.value = len() ? Math.round(pos / len() * 1000) : 0; };
    let srSv = null; // (the autosave, set up at the end)
    const setLen = () => { qs(b, '.sys-sr-len b').textContent = len().toFixed(2) + ' sec.'; if (srSv) srSv.save(); };
    const draw = (live, t) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, 110, 54); g.strokeStyle = '#0f0'; g.beginPath();
      for (let x = 0; x < 110; x++) { let a = 0; if (live) a = Math.sin(x * 0.4 + t * 25) * Math.sin(x * 0.07 + t * 4) * 20 * (0.4 + Math.random() * 0.6); else if (buf && mode === 'play') { const d = buf.getChannelData(0), i = Math.floor(clamp(pos / len(), 0, 1) * d.length) + x * 20; a = (d[i % d.length] || 0) * 24; } g.lineTo(x, 27 + a); }
      g.stroke();
    };
    draw(false, 0);
    function stopAll() { cancelAnimationFrame(raf); if (src) { try { src.stop(); } catch (e) {} src = null; } if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch (e) {} } mode = 'idle'; b.classList.remove('rec'); draw(false, 0); }
    function play() {
      const c = ac(); if (!buf || !c) return msg('Sound Recorder', 'There is nothing to play. Click the red button to record something first. (Say "Hello, computer". Everyone does.)', 'info');
      stopAll(); mode = 'play'; src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = speed;
      let node = src; const gn = c.createGain(); gn.gain.value = vol; node.connect(gn); node = gn;
      if (echo) { const dl = c.createDelay(0.5); dl.delayTime.value = 0.22; const fb = c.createGain(); fb.gain.value = 0.4; node.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(Sound.output(c)); }
      node.connect(Sound.output(c));
      const start = pos >= len() - 0.02 ? 0 : pos; src.start(0, start); t0 = performance.now(); playLen = (len() - start) / speed;
      if (!Sound.on) toast('Sound Recorder', 'Sound is muted (the speaker in the tray). Playing silently, which is very 1999 of it.', 3500);
      const tick = () => { if (mode !== 'play') return; const el = (performance.now() - t0) / 1000; setPos(start + el * speed); draw(false, el); if (el >= playLen) { stopAll(); setPos(len()); return; } raf = requestAnimationFrame(tick); }; tick();
    }
    async function record() {
      if (mode === 'rec') return stopAll();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return fakeRecord();
      try { stream = stream || await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return msg('Sound Recorder', 'Could not open the microphone.\n\nThe microphone is the little plastic one that came with the sound card. It is plugged into the wrong hole. (Or your browser said no, which is fair.)\n\nJackOS will pretend instead.', 'warn', [['OK', fakeRecord]]); }
      chunks = []; rec = new MediaRecorder(stream); rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = async () => { const c = ac(); if (!c) return; try { const ab = await new Blob(chunks).arrayBuffer(); const nb = await c.decodeAudioData(ab); buf = buf && pos > 0 ? splice(buf, nb, pos) : nb; setLen(); setPos(0); if (len() > 60) toast('Sound Recorder', 'That is a long recording. At 44.1kHz 16-bit stereo it would be ' + Math.round(len() * 176) + ' KB. Nearly a whole floppy.', 5000); } catch (e) { toast('Sound Recorder', 'Nothing was recorded. The microphone may be unplugged. (It is always unplugged.)'); } };
      rec.start(); mode = 'rec'; b.classList.add('rec'); t0 = performance.now(); recT = pos;
      const tick = () => { if (mode !== 'rec') return; const el = (performance.now() - t0) / 1000; qs(b, '.sys-sr-pos b').textContent = (recT + el).toFixed(2) + ' sec.'; qs(b, '.sys-sr-len b').textContent = Math.max(len(), recT + el).toFixed(2) + ' sec.'; draw(true, el); if (recT + el >= 60) stopAll(); else raf = requestAnimationFrame(tick); }; tick();
    }
    function fakeRecord() { // no mic: synthesise a 2-second "WAAAGH" into the buffer so everything still works
      const c = ac(); if (!c) return; const n = Math.floor(c.sampleRate * 2), nb = c.createBuffer(1, n, c.sampleRate), d = nb.getChannelData(0);
      for (let i = 0; i < n; i++) { const t = i / c.sampleRate, f = 140 - t * 30; d[i] = (Math.sin(t * f * 6.283) * 0.5 + Math.sin(t * f * 2 * 6.283) * 0.25 + (Math.random() - 0.5) * 0.3) * Math.min(1, t * 8) * Math.max(0, 1 - (t - 1.4) / 0.6) * 0.5; }
      buf = nb; setLen(); setPos(0); toast('Sound Recorder', 'Recorded 2.00 seconds of a robot burp (synthesised: no microphone). Press play!', 4000);
    }
    function splice(a, bb, at) { const c = ac(), i = Math.floor(at * a.sampleRate), out = c.createBuffer(1, i + bb.length, a.sampleRate), d = out.getChannelData(0); d.set(a.getChannelData(0).subarray(0, i)); d.set(bb.getChannelData(0), i); return out; }
    function effect(fn, label) { const c = ac(); if (!buf || !c) return msg('Sound Recorder', 'Record something first!', 'info'); const d = buf.getChannelData(0), nb = c.createBuffer(1, d.length, buf.sampleRate); nb.getChannelData(0).set(fn(d)); buf = nb; setLen(); toast('Sound Recorder', label, 2000); }
    qsa(b, '[data-s]').forEach(bt => on(bt, 'click', () => { const k = bt.dataset.s; if (k === 'play') play(); else if (k === 'stop') stopAll(); else if (k === 'rec') record(); else if (k === 'start') { stopAll(); setPos(0); } else if (k === 'end') { stopAll(); setPos(len()); } }));
    on(slider, 'input', () => { if (mode === 'play') stopAll(); setPos(+slider.value / 1000 * len()); });
    A.menubar(w, [
      ['File', [{ label: 'New', act: () => { stopAll(); buf = null; setLen(); setPos(0); } }, { label: 'Open...', act: () => open('explorer', 'C:\\JACKOS\\Media') }, { label: 'Save', act: () => { if (!buf) return msg('Sound Recorder', 'Nothing to save.', 'info'); Desk.ask('Save As', 'File name (saved to C:\\My Documents, this session only):', 'my sound.wav', 30, v => { if (!v) return; A.fs.add('C:/My Documents', { name: /\.wav$/i.test(v) ? v : v + '.wav', type: 'txt', size: Math.round(len() * 86) + ' KB', date: t99(), text: `RIFF WAVE fmt (binary gibberish, ${len().toFixed(2)} seconds of you)\n\nThis recording lives in this computer's memory only. It was never sent anywhere. When you shut down, it goes.` }); toast('Sound Recorder', `Saved ${v} (${Math.round(len() * 86)} KB) to My Documents.`); }); } }, { label: 'Save As...', dis: !0 }, '-', { label: 'Properties', act: () => msg('Properties for Sound', `Length: ${len().toFixed(2)} sec.\nData size: ${fmt(len() * 88200)} bytes\nAudio format: PCM 44,100 Hz, 16 Bit, Mono\n\nFormat conversion: "Radio Quality" (22 kHz) or "Telephone Quality" (11 kHz, saves floppies).`, 'info') }, '-', { label: 'Exit', act: w.close }]],
      ['Edit', [{ label: 'Copy', act: () => toast('Sound Recorder', 'Copied the sound to the Clipboard. The Clipboard says "ow".') }, { label: 'Paste Insert', dis: true }, { label: 'Paste Mix', dis: true }, '-', { label: 'Insert File...', act: () => open('explorer', 'C:\\JACKOS\\Media') }, { label: 'Mix with File...', dis: true }, '-', { label: 'Delete Before Current Position', act: () => effect(d => d.slice(Math.floor(pos * buf.sampleRate)), 'Deleted.') }, { label: 'Delete After Current Position', act: () => effect(d => d.slice(0, Math.max(1, Math.floor(pos * buf.sampleRate))), 'Deleted.') }, '-', { label: 'Audio Properties', act: () => open('system.sndvol') }]],
      ['Effects', () => [{ label: 'Increase Volume (by 25%)', act: () => { vol = Math.min(4, vol * 1.25); toast('Sound Recorder', 'Louder.', 1200); } }, { label: 'Decrease Volume', act: () => { vol = Math.max(0.1, vol / 1.25); toast('Sound Recorder', 'Quieter.', 1200); } }, '-', { label: 'Increase Speed (by 100%)', act: () => { speed = Math.min(4, speed * 2); toast('Sound Recorder', 'Chipmunk mode: x' + speed, 1500); } }, { label: 'Decrease Speed', act: () => { speed = Math.max(0.25, speed / 2); toast('Sound Recorder', 'Slooooow: x' + speed, 1500); } }, '-', { label: 'Add Echo', chk: echo, act: () => { echo = !echo; toast('Sound Recorder', echo ? 'Echo on... on... on...' : 'Echo off.', 1500); } }, { label: 'Reverse', act: () => { reversed = !reversed; effect(d => Float32Array.from(d).reverse(), 'Reversed. Play it back for the hidden message.'); S('backwards'); } }]],
      ['Help', [{ label: 'Help Topics', act: () => open('system.help', 'sndrec') }, '-', { label: 'About Sound Recorder', act: () => msg('About Sound Recorder', 'JackOS Sound Recorder\n\nRecords up to 60 seconds from your microphone, into this computer\'s memory, and nowhere else. Nothing is uploaded. Shut down and it\'s gone.\n\nTry: record, then Effects > Reverse.', 'info') }]],
    ]);
    // the recording is kept (js/gamesave.js, on this PC only), squashed to 8 kHz 8-bit like a proper 1999 .WAV (up to 37 seconds of it),
    // so it is still there after a refresh or when Sound Recorder is opened again. File > New forgets it.
    if (A.gameSaver) {
      const RATE = 8000, MAXN = RATE * 37;
      let owned = false;
      const pack = () => { const d = buf.getChannelData(0), step = buf.sampleRate / RATE, n = Math.min(MAXN, Math.floor(d.length / step)), u = new Uint8Array(n); for (let i = 0; i < n; i++) u[i] = Math.max(0, Math.min(255, Math.round(d[Math.floor(i * step)] * 127 + 128))); let s = ''; for (let i = 0; i < n; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
      srSv = A.gameSaver('sndrec', () => { if (buf) owned = true; return !owned ? undefined : buf ? { pcm: pack(), pos, vol, speed, echo } : null; }, { v: 1, delay: 1000, max: 420000 }).watch(w);
      const kept = !(arg && arg.sound) ? srSv.load() : null, c = kept && typeof kept.pcm === 'string' ? ac() : null;
      if (c) { try { const raw = atob(kept.pcm), nb = c.createBuffer(1, Math.max(1, raw.length), RATE), d = nb.getChannelData(0); for (let i = 0; i < raw.length; i++) d[i] = (raw.charCodeAt(i) - 128) / 127; buf = nb; owned = true; vol = +kept.vol || 1; speed = +kept.speed || 1; echo = !!kept.echo; setLen(); setPos(+kept.pos || 0); } catch (e) {} }
    }
    if (arg && arg.sound) toast('Sound Recorder', `Opened ${name}. (It's a system sound, so press play in the Explorer window to hear it; this window records new ones.)`, 4000);
    return w;
  };

  // ================================================================ VOLUME CONTROL (the mixer)
  P['system.sndvol'] = () => {
    const CH = [['Volume Control', 'vol'], ['Wave', 'wave'], ['MIDI', 'midi'], ['CD Audio', 'cd'], ['Line-In', 'line'], ['Microphone', 'mic'], ['PC Speaker', 'pcspk'], ['Gubbinz', 'gub']];
    const mix = get('mix', {});
    const b = h(`<div class="sys-mix">${CH.map(([n, k]) => `<div class="sys-mix-ch" data-k="${k}"><div class="sys-mix-n">${n}</div><div class="sys-mix-bal">Balance:<div class="sys-mix-balr"><input type="range" min="0" max="100" value="50" aria-label="${n} balance"></div></div><div class="sys-mix-v">Volume:<div class="sys-mix-vs"></div></div><label class="sys-ck"><input type="checkbox" class="sys-mix-m" ${k === 'vol' ? (Sound.on ? '' : 'checked') : (mix[k + 'm'] ? 'checked' : '')}> ${k === 'vol' ? 'Mute all' : 'Mute'}</label></div>`).join('')}</div><div class="sys-mix-foot">JackBlaster 16 PnP Mixer</div>`, 'sys-mixwin');
    const w = A.win('Volume Control', b, { w: 700, icon: I.vol, menubar: true, minW: 300, noMax: true });
    qsa(b, '.sys-mix-ch').forEach(ch => {
      const k = ch.dataset.k, v0 = k === 'vol' ? X.volume() : (mix[k] == null ? 0.75 : mix[k]);
      const sl = vslider(v0, v => { if (k === 'vol') X.applyVol(v); else { mix[k] = v; put('mix', mix); } if (v >= 0.999 && k === 'vol') S('loud'); }, { label: CH.find(c => c[1] === k)[0] + ' volume', end: () => { if (Sound.on && k !== 'gub') Sound.play('beep'); if (k === 'gub' && Sound.on) Sound.play('waaagh'); } });
      qs(ch, '.sys-mix-vs').appendChild(sl.el);
      on(qs(ch, '.sys-mix-m'), 'change', e => { if (k === 'vol') { X.setSfx(!e.target.checked); } else { mix[k + 'm'] = e.target.checked; put('mix', mix); if (k === 'gub' && e.target.checked) { S('mutegub'); toast('Volume Control', 'Gubbinz muted. ... He is still making noise. The mute is for show.', 5000); } } });
      on(qs(ch, 'input[type=range]'), 'change', e => { if (Math.abs(+e.target.value - 50) > 40) toast('Volume Control', 'The other speaker is on the floor behind the desk. Balance makes no difference.', 4000); });
    });
    A.menubar(w, [
      ['Options', () => [{ label: 'Properties', act: () => { const d = dlg('Properties', `<label class="sys-lbl">Mixer device: <select style="width:100%"><option>JackBlaster 16 PnP Mixer</option><option>PC Speaker (one beep, take it or leave it)</option></select></label><div class="group"><span class="lg">Adjust volume for</span><label class="sys-ck"><input type="radio" name="sysmx" checked> Playback</label><label class="sys-ck"><input type="radio" name="sysmx"> Recording</label><label class="sys-ck"><input type="radio" name="sysmx"> Other: Voice Commands (don\'t)</label></div><p>Show the following volume controls:</p><div class="field sys-mix-show">${CH.map(([n, k]) => `<label class="sys-ck"><input type="checkbox" data-k="${k}" ${mix['hide' + k] ? '' : 'checked'}> ${n}</label>`).join('')}</div>`, [['OK', bb => { qsa(bb, '.sys-mix-show input').forEach(i => { mix['hide' + i.dataset.k] = !i.checked; const ch = qs(b, `.sys-mix-ch[data-k="${i.dataset.k}"]`); if (ch) ch.hidden = !i.checked; }); put('mix', mix); }], ['Cancel']], { w: 340, icon: I.vol }); } }, { label: 'Advanced Controls', chk: false, act: () => toast('Volume Control', 'Advanced controls: Bass, Treble, and a mystery button marked "3D" that makes everything sound like a bathroom.') }, '-', { label: 'Exit', act: w.close }]],
      ['Help', [{ label: 'Help Topics', act: () => open('system.help', 'volume') }, '-', { label: 'About Volume Control', act: () => msg('About Volume Control', 'JackOS Volume Control\n\nThe real volume knob is on the front of the left speaker. This window is a suggestion.', 'info') }]],
    ]);
    CH.forEach(([, k]) => { if (mix['hide' + k]) qs(b, `.sys-mix-ch[data-k="${k}"]`).hidden = true; });
    return w;
  };

  // ================================================================ JACKOS UPDATE (critical updates at 28.8K) + Y2K patch
  const UPDATES = [
    { n: 'Y2K Compliance Patch for JackOS 98', kb: 1999, crit: true, d: 'Prepares your computer for the year 2000. Teaches the clock what a "20" is. Required.' },
    { n: 'JackNet Explorer 5.0 Security Update (Q1999)', kb: 2450, crit: true, d: 'Fixes a bug where web pages could see your Favorites. Your Favorites are all Jack\'s own site anyway.' },
    { n: 'Modem Driver Update: 56K to 56K (actually 49K)', kb: 320, crit: false, d: 'Changes what the modem says when it connects. It still connects at the same speed.' },
    { n: 'Gubbinz Compatibility Pack 1.2a', kb: 140, crit: true, d: 'Stops Gubbinz from eating the mouse pointer. (Partially.)' },
    { n: 'Solitaire Shuffle Fairness Fix', kb: 56, crit: false, d: 'The deck was not rigged. This update makes it still not rigged, but faster.' },
    { n: 'Daylight Saving Time Fix (Pixel Island)', kb: 12, crit: false, d: 'Pixel Island does not observe daylight saving. Or time.' },
    { n: 'Printer Spooler Jam Reduction Pack', kb: 410, crit: false, d: 'Reduces paper jams by 2%. The JackJet jams out of spite, not bugs.' },
    { n: 'Critical Update Notification 1.0', kb: 88, crit: true, d: 'Tells you about critical updates. It is a critical update. It will tell you about itself.' },
  ];
  const UPD_OLD = { 'Daylight Saving Time Fix (Squig Island)': 'Daylight Saving Time Fix (Pixel Island)' }; // renamed update: installed under its old name still counts
  P['system.update'] = () => {
    const done = get('updates', []).map(n => UPD_OLD[n] || n);
    const b = h(`<div class="sys-up"><div class="sys-up-hd"><span class="sys-up-logo">${mini(I.update, 40)}</span><div><b>JackOS Update</b><br><span class="small">Product Updates for your computer</span></div></div><div class="sys-up-body"><p class="sys-up-st">Connecting to JackOS Update...</p><div class="sys-bar"></div><div class="sys-up-list" hidden></div></div><div class="row sys-btns"><button type="button" class="btn sys-up-go" disabled>Download</button><button type="button" class="btn sys-up-x">Close</button></div></div>`, 'sys-upwin');
    const w = A.win('JackOS Update', b, { w: 480, h: 420, icon: I.update, minW: 320 });
    const st = qs(b, '.sys-up-st'), set = bar(qs(b, '.sys-bar')), list = qs(b, '.sys-up-list'), go = qs(b, '.sys-up-go');
    on(qs(b, '.sys-up-x'), 'click', w.close);
    const steps = ['Connecting to JackOS Update...', 'Checking your computer for installed updates (please wait, do not move the mouse)...', 'Comparing against the product catalogue...', 'Still comparing. (The catalogue is 3 MB.)'];
    let i = 0; const iv = setInterval(() => { if (w.closed) return clearInterval(iv); i++; if (i < steps.length) st.textContent = steps[i]; }, 1400);
    crawl({ ms: 4800, set, alive: () => !w.closed, stallMs: 1800, done: () => {
      clearInterval(iv); if (w.closed) return;
      const todo = UPDATES.filter(u => !done.includes(u.n));
      st.innerHTML = todo.length ? `<b>${todo.length} update(s)</b> are available for your computer, including <b>${todo.filter(u => u.crit).length} critical</b>. Select the ones you want and click Download.` : '<b>Your computer is completely up to date.</b> For 1999. There will never be another update. Enjoy!';
      qs(b, '.sys-bar').hidden = true; list.hidden = false;
      list.innerHTML = todo.map((u, k) => `<label class="sys-up-row${u.crit ? ' crit' : ''}"><input type="checkbox" data-k="${k}" ${u.crit ? 'checked' : ''}><span><b>${esc(u.n)}</b> <i>${fmt(u.kb)} KB${u.crit ? ' \u2022 CRITICAL' : ''}</i><br>${esc(u.d)}</span></label>`).join('');
      go.disabled = !todo.length;
      on(go, 'click', () => { const sel = qsa(list, 'input:checked').map(e => todo[+e.dataset.k]); if (!sel.length) return msg('JackOS Update', 'Select at least one update. The critical ones are critical.', 'info'); download(sel); });
      if (!todo.length) S('update');
    } });
    function download(sel) {
      const total = sel.reduce((a, u) => a + u.kb, 0); let got = 0, k = 0, speed = 28.8;
      list.hidden = true; qs(b, '.sys-bar').hidden = false; set(0); go.disabled = true;
      const line = () => { st.innerHTML = `Downloading <b>${esc(sel[k].n)}</b><br>${fmt(got)} KB of ${fmt(total)} KB at ${speed.toFixed(1)} Kbps \u2022 ${Math.ceil((total - got) * 8 / speed)} sec remaining (it says)`; };
      const iv = setInterval(() => {
        if (w.closed) return clearInterval(iv);
        speed = clamp(speed + (Math.random() - 0.5) * 6, 14.4, 33.6);
        if (Math.random() < 0.03) { st.innerHTML = '<b>Connection lost.</b> Someone picked up the phone. Redialling...'; speed = 14.4; return; }
        got = Math.min(total, got + speed * 0.3 * 1.8);
        set(got / total); line();
        if (got >= sel.slice(0, k + 1).reduce((a, u) => a + u.kb, 0) && k < sel.length - 1) k++;
        if (got >= total) { clearInterval(iv); install(sel); }
      }, 300);
    }
    function install(sel) {
      st.textContent = 'Installing updates...'; set(0);
      crawl({ ms: 3500, set, alive: () => !w.closed, stallMs: 2000, done: () => {
        if (w.closed) return;
        const d = get('updates', []).map(n => UPD_OLD[n] || n); sel.forEach(u => { if (!d.includes(u.n)) d.push(u.n); }); put('updates', d);
        if (d.length >= UPDATES.length) S('update');
        const y2k = sel.some(u => /Y2K/.test(u.n));
        st.innerHTML = `<b>${sel.length} update(s) installed successfully.</b> You must restart your computer for the changes to take effect.`;
        msg('JackOS Update', `${sel.length} update(s) were installed.\n\nYou must restart your computer before the new settings will take effect.\n\nDo you want to restart your computer now?`, 'q', [['Yes', () => { if (y2k) { put('y2kpatched', true); S('y2kpatch'); } Desk.reboot('bios'); }], ['No', () => { if (y2k) P['system.y2kpatch'](); }]]);
      } });
    }
    return w;
  };
  P['system.y2kpatch'] = () => {
    if (get('y2kpatched', false)) return msg('Y2K Compliance Patch', 'The Y2K Compliance Patch is already installed.\n\nYour computer is ready for the year 2000. (It will never get there, but it is READY.)\n\nClock check: 1999 OK. 2000 OK. 19100: hmm.', 'info');
    const b = h('<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">' + mini(I.y2k, 32) + '<div><p><b>Y2K Compliance Patch for JackOS 98</b> (Q1999, 1,999 KB)</p><p>This update fixes the following issues:</p><ul><li>The clock going to 1900 (or 19100) at midnight on 31/12/99</li><li>Dates showing as "01/01/00" and programs panicking</li><li>The CMOS battery\'s feelings</li></ul><p>Do you want to install the patch?</p></div></div><label class="sys-ck"><input type="checkbox" checked> Back up my system first (to 1,440 floppy disks)</label>', 'sys-y2k');
    const d = dlg('Y2K Compliance Patch', '', [['Install', bb => { install(qs(bb, 'input').checked); }], ['Cancel']], { w: 400, icon: I.y2k });
    d.b.insertBefore(b, d.b.firstChild);
    function install(backup) {
      if (backup) { toast('Y2K Compliance Patch', 'Backup skipped. (We only have 3 floppies.)', 3000); }
      const b2 = h('<p>Installing Y2K Compliance Patch...</p><div class="sys-bar"></div><div class="small sys-y2-now">Patching CLOCK.DLL</div>', 'sys-y2k');
      const w = A.win('Y2K Compliance Patch', b2, { w: 360, icon: I.y2k, noResize: true, noMax: true, noMin: true });
      const set = bar(qs(b2, '.sys-bar')), FILES = ['CLOCK.DLL', 'DATE.VXD', 'CMOS.SYS', 'CALENDAR.DLL', 'PANIC.DLL (removing)', 'Y2K.TXT (reading it again)'];
      crawl({ ms: 5000, set: f => { set(f); qs(b2, '.sys-y2-now').textContent = 'Patching ' + FILES[Math.min(FILES.length - 1, Math.floor(f * FILES.length))]; }, alive: () => !w.closed, stallMs: 3000, done: () => {
        if (w.closed) return; w.close(); put('y2kpatched', true); S('y2kpatch');
        const clock = document.getElementById('clock'); if (clock) { const old = clock.textContent; clock.textContent = '19100'; clock.classList.add('sys-glitch'); setTimeout(() => { clock.textContent = old; clock.classList.remove('sys-glitch'); }, 2600); }
        document.body.classList.add('glitch'); Sound.play('uhoh'); setTimeout(() => document.body.classList.remove('glitch'), 1500);
        setTimeout(() => msg('Y2K Compliance Patch', 'The Y2K Compliance Patch has been installed.\n\nTest result: the clock briefly said 19100, then went back to normal.\n\nStatus: COMPLIANT (probably). Keep the torch handy.', 'info'), 2800);
      } });
    }
    return d.w;
  };

  // Date/Time Properties fallback (only used if Control Panel's applet is not loaded)
  P['system.datetime'] = () => { const t = Desk.today99(); return dlg('Date/Time Properties', `<p>Today is <b>${X.dateLong()}</b>.</p><p>Current time: <b>${hhmm()}</b></p><p class="small">Time zone: (GMT) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London</p>`, [['OK']], { w: 300 }).w; };
})();
