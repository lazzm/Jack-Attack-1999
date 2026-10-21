/* lan-web: the two LAN web sites inside JackNet Explorer (loaded the first time you visit one).
 *   http://www.jackshield.netz/            JackShield Outbreak Centre: the live SQUIG99 outbreak map, the Virus Encyclopedia, JackClean
 *   http://www.counterwars.homepagez/       COUNTER WARS!!! The week's Top 10 Homepagez hit counters + the Golden Counter Award */
(function () {
  'use strict';
  const A = window.Apps, L = window.LAN;
  if (!A || !L || L.web) return;
  const esc = L.esc;
  const live = (el, type, fn) => { const off = L.on(type, m => { if (!el.isConnected) return off(); fn(m); }); return off; };
  const hash = s => { let x = 2166136261; for (const c of String(s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
  const ago = ts => { const s = Math.max(0, (Date.now() - ts) / 1000); return s < 90 ? 'just now' : s < 5400 ? Math.round(s / 60) + ' mins ago' : s < 129600 ? Math.round(s / 3600) + ' hours ago' : Math.round(s / 86400) + ' days ago'; };
  const wk99 = wk => wk ? wk.slice(8, 10) + '/' + wk.slice(5, 7) + '/99' : '';
  const link = (href, text) => `<a href="${href}">${text}</a>`;

  // ================================================================ JackShield
  const SS_NAV = `<div style="background:#063;color:#fff;padding:4px 8px;font:bold 12px Arial,sans-serif;display:flex;flex-wrap:wrap;gap:4px 14px">${[['/', 'Outbreak Centre'], ['/download.html', 'FREE JackClean'], ['/virus.html', 'Virus Encyclopedia'], ['/tips.html', 'Safe Surfing Tips']].map(([p, t]) => `<a href="http://www.jackshield.netz${p}" style="color:#ff0">${t}</a>`).join('')}</div>`;
  const ssHead = () => `<div style="background:linear-gradient(#0a5,#063);color:#fff;padding:10px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">${L.shield ? L.shield(48) : ''}<div><div style="font:bold 26px Arial Black,Arial,sans-serif;letter-spacing:1px">JackShield</div><div style="font:italic 12px Arial,sans-serif">Keeping JackNet worm-free since 1998</div></div><div style="margin-left:auto;font:11px Arial,sans-serif;text-align:right">Virus definitions updated: ${L.d99()}<br>Worms blocked this year: lots</div></div>${SS_NAV}`;
  const ssFoot = '<div style="margin-top:14px;padding:8px;border-top:2px groove #fff;font:10px Arial,sans-serif;color:#555;text-align:center">JackShield Labs is not a real company. SQUIG99 is a pretend worm: it can\'t hurt your computer. Real ones can, so be careful out there!<br>Best viewed in JackNet Explorer at 800 x 600. &copy; 1999 JackShield Labs.</div>';
  const LEVEL_COL = { LOW: '#0a0', MEDIUM: '#e90', HIGH: '#e10600', SQUIGTASTROPHIC: '#90f' };
  function ssHome(el) {
    L.got('squigshield');
    el.innerHTML = `<div style="background:#fff;color:#000;font:13px Arial,sans-serif;min-height:100%">${ssHead()}<div style="padding:10px 12px">
      <div class="ssx-level" style="border:3px solid #000;padding:8px;text-align:center;font:bold 22px Arial Black,Arial,sans-serif;background:#eee">OUTBREAK LEVEL: ...</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px">
        <div style="flex:1 1 300px;min-width:0"><h3 style="margin:0 0 4px;font:bold 15px Arial,sans-serif;color:#063">LIVE OUTBREAK MAP: SQUIG99 on JackNet</h3><div class="ssx-map" style="background:#001a0a;border:2px inset #fff"></div><div style="font:10px Arial,sans-serif;color:#555">Red = infected right now. Lines = who "sent" it to whom. Updates live.</div></div>
        <div style="flex:1 1 200px;min-width:0"><table class="ssx-stats" style="width:100%;border-collapse:collapse;font:12px Arial,sans-serif"></table>
          <div class="ssx-you" style="margin-top:10px;padding:8px;border:2px dashed #063;background:#efe"></div></div>
      </div>
      <h3 style="margin:12px 0 4px;font:bold 15px Arial,sans-serif;color:#063">LATEST SIGHTINGS</h3><div class="ssx-log" style="font:12px 'Courier New',monospace;background:#000;color:#0f0;padding:6px;max-height:160px;overflow:auto"></div>
      <p style="margin-top:10px"><b>What is SQUIG99?</b> A pretend e-mail worm going round JackNet. It arrives as <b>"Happy New Year 1999 !!"</b> with <b>SQUIG99.EXE</b> attached. Open it and you get fireworks... and a little worm in your clock corner, "(sent by SQUIG99)" on your e-mails, and it "posts itself" to everyone you've swapped WinPopups, files or floppies with. It's a joke version of <b>Happy99</b>, a real worm from January 1999. ${link('http://www.jackshield.netz/virus.html', 'Read more in the Virus Encyclopedia')}.</p>
      <p><b>Got it?</b> ${link('http://www.jackshield.netz/download.html', 'Download JackClean FREE')}. One click and it's gone.</p>${ssFoot}</div></div>`;
    const fill = m => {
      const lv = el.querySelector('.ssx-level'); if (!lv) return;
      const col = LEVEL_COL[m.level] || '#e10600';
      lv.innerHTML = `OUTBREAK LEVEL: <span style="color:${col}">${esc(m.level === 'SQUIGTASTROPHIC' ? 'WORMTASTROPHIC' : m.level)}</span>${m.level === 'HIGH' || m.level === 'SQUIGTASTROPHIC' ? ' <blink style="color:#c00">!!!</blink>' : ''}<div style="font:12px Arial,sans-serif">${m.n ? `${m.n} PC${m.n === 1 ? '' : 's'} on JackNet ${m.n === 1 ? 'has' : 'have'} SQUIG99 right now` : 'No worms on JackNet right now. Phew! (For now...)'}</div>`;
      lv.style.background = m.n >= 2 ? '#fdd' : m.n ? '#ffe9c0' : '#dfd';
      el.querySelector('.ssx-stats').innerHTML = [['Infected right now', m.n], ['Infected ever', m.ever], ['Times it spread', m.spreads], ['Cured by JackClean', m.cures]].map(([k, v]) => `<tr><td style="border:1px solid #9c9;padding:3px 6px">${k}</td><td style="border:1px solid #9c9;padding:3px 6px;text-align:right;font:bold 16px 'Courier New',monospace;color:#c00">${(v | 0).toLocaleString('en-GB')}</td></tr>`).join('');
      el.querySelector('.ssx-log').innerHTML = (m.log || []).slice().reverse().map(e => `${esc(ago(e.ts).padEnd(13))} ${esc(e.a)} --worm--&gt; ${esc(e.b)}`).join('<br>') || 'No sightings yet. Keep watching...';
      el.querySelector('.ssx-map').innerHTML = map(m);
      you();
    };
    const you = () => {
      const y = el.querySelector('.ssx-you'); if (!y) return;
      y.innerHTML = L.inf ? `<b style="color:#c00">YOUR PC IS INFECTED!</b><br>SQUIG99 has been living in your computer since ${esc(ago(L.inf.ts))}${L.inf.by ? `, caught from ${esc(L.inf.by)}` : ''}.<br><br>${link('http://www.jackshield.netz/download.html', '<b>Get JackClean now &raquo;</b>')}` : '<b style="color:#063">Your PC: worm-free.</b><br>Nice one. Don\'t open attachments you weren\'t expecting, and it\'ll stay that way.';
    };
    live(el, 'lanOutbreak', fill);
    live(el, 'lanOutbreakCh', () => Net.send({ t: 'lanOutbreak' }));
    live(el, 'lanMe', you);
    if (!Net.send({ t: 'lanOutbreak' })) fill({ n: 0, level: 'LOW', ever: 0, spreads: 0, cures: 0, nodes: [], log: [] });
  }
  function map(m) {
    const W = 320, H = 190, names = new Map();
    const pos = n => { if (!names.has(n)) { const x = hash(n); names.set(n, [24 + (x % (W - 48)), 22 + ((x >>> 12) % (H - 44))]); } return names.get(n); };
    const inf = new Set((m.nodes || []).map(x => x.n));
    (m.log || []).forEach(e => { pos(e.a); pos(e.b); }); (m.nodes || []).forEach(x => pos(x.n));
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;max-height:240px" role="img" aria-label="Outbreak map">`;
    for (let i = 1; i < 4; i++) s += `<circle cx="${W / 2}" cy="${H / 2}" r="${i * 30}" fill="none" stroke="#0a4" stroke-opacity=".35"/>`;
    s += `<path d="M0 ${H / 2}H${W}M${W / 2} 0V${H}" stroke="#0a4" stroke-opacity=".35"/>`;
    (m.log || []).forEach(e => { const a = pos(e.a), b = pos(e.b); s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#ff0" stroke-opacity=".6" stroke-dasharray="3 2"/>`; });
    for (const [n, [x, y]] of names) {
      const on = inf.has(n);
      s += `<g><circle cx="${x}" cy="${y}" r="${on ? 6 : 4}" fill="${on ? '#e10600' : '#577'}" stroke="#000"/>${on ? `<circle cx="${x - 2}" cy="${y - 1.5}" r="1.3" fill="#ff0"/><circle cx="${x + 2}" cy="${y - 1.5}" r="1.3" fill="#ff0"/><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#e10600"><animate attributeName="r" values="6;13;6" dur="1.6s" repeatCount="indefinite"/></circle>` : ''}<text x="${x}" y="${y + 15}" fill="${on ? '#f99' : '#9cb'}" font-size="8" font-family="Arial" text-anchor="middle">${esc(n.slice(0, 14))}</text></g>`;
    }
    if (!names.size) s += `<text x="${W / 2}" y="${H / 2 + 4}" fill="#0f0" font-size="11" font-family="Courier New" text-anchor="middle">NO WORMS DETECTED</text>`;
    return s + '</svg>';
  }
  function ssDownload(el) {
    L.got('squigshield');
    const has = () => !(window.Setup && Setup.has) || Setup.has('lan.squigclean');
    el.innerHTML = `<div style="background:#fff;color:#000;font:13px Arial,sans-serif;min-height:100%">${ssHead()}<div style="padding:10px 12px">
      <h2 style="font:bold 20px Arial,sans-serif;color:#063;margin:4px 0">Download JackClean 1.0 - FREE!</h2>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start"><div style="border:2px outset #fff;background:#c0c0c0;padding:10px;text-align:center;width:150px">${L.shield ? L.shield(64) : ''}<br><b>JACKCLN.EXE</b><br><small>96 KB · about 20 seconds on a 56K modem</small></div>
      <div style="flex:1;min-width:200px"><ul style="margin:0;padding-left:18px"><li>Finds SQUIG99 and gets rid of it in <b>one click</b></li><li>Takes the worm out of your clock corner</li><li>Stops the "(sent by SQUIG99)" on your e-mails</li><li>Also checks under the bed (finds: socks)</li></ul>
      <p><button class="btn ssx-dl" type="button" style="font-weight:bold;padding:4px 14px">Download JackClean Now!</button> <span class="ssx-st small"></span></p>
      <p style="font-size:11px;color:#555">Free for kids, grans and anyone with a worm problem. Works on JackOS 98. Needs a mouse.</p></div></div>${ssFoot}</div></div>`;
    const st = el.querySelector('.ssx-st'), btn = el.querySelector('.ssx-dl');
    const upd = () => { if (has()) { btn.textContent = 'Run JackClean'; st.textContent = 'JackClean is installed on this PC.'; } };
    upd();
    btn.addEventListener('click', () => { if (has()) A.open('lan.squigclean'); else { Setup.download('lan.squigclean'); setTimeout(upd, 1500); } });
  }
  function ssVirus(el) {
    const v = (name, when, kind, html, real) => `<div style="border:2px solid ${real ? '#c00' : '#063'};margin:8px 0;padding:6px 8px;background:${real ? '#fff4f4' : '#f4fff4'}"><b style="font-size:15px">${name}</b> <small style="color:#555">${when} &middot; ${kind}${real ? ' &middot; <b style="color:#c00">REAL</b>' : ' &middot; <b style="color:#063">PRETEND</b>'}</small><div style="margin-top:4px">${html}</div></div>`;
    el.innerHTML = `<div style="background:#fff;color:#000;font:13px Arial,sans-serif;min-height:100%">${ssHead()}<div style="padding:10px 12px"><h2 style="font:bold 20px Arial,sans-serif;color:#063;margin:4px 0">Virus Encyclopedia</h2><p>The nasties of 1999 (and one silly one that isn't real).</p>
      ${v('SQUIG99', '1999', 'e-mail worm (pretend)', 'Arrives as "Happy New Year 1999 !!" with SQUIG99.EXE attached. Shows fireworks, puts a worm in your tray, adds "(sent by SQUIG99)" to your e-mails and sends itself to people you\'ve swapped stuff with on JackNet. Totally harmless. Cure: JackClean, one click.')}
      ${v('Happy99 (also called Ska)', 'January 1999', 'e-mail worm', 'Arrived as an attachment called Happy99.exe. When you ran it, it showed fireworks and "Happy New Year 1999 !!" so you didn\'t suspect a thing. Secretly it changed a JackOS file (WSOCK32.DLL) so that every time you sent an e-mail or a newsgroup post, a second message followed it with Happy99.exe attached. It kept a list of everyone it had sent itself to in a file called LISTE.SKA. SQUIG99 is our joke version of it.', true)}
      ${v('Melissa', 'March 1999', 'Word macro virus', 'Came inside a Word document. If you opened it, it used Outlook to e-mail itself to the first 50 people in your address book, with the subject "Important Message From" and your name. So many e-mails flew about at once that some companies had to switch their e-mail off. The man who wrote it was caught within a week.', true)}
      ${v('CIH (also called Chernobyl)', '26 April 1999', 'file virus', 'Hid inside programs. On 26 April 1999 it went off on lots of PCs around the world at once: it wiped hard disks, and on some computers it scrambled the BIOS chip so the PC wouldn\'t even start. Back up your homework!', true)}
      ${v('"Good Times"', '1994 onwards', 'hoax', 'A warning e-mail saying that just READING a message called "Good Times" would wipe your hard disk. There was no such virus. The warning itself was the pest, because everyone forwarded it to everyone. If an e-mail says "send this to everyone you know", don\'t.', true)}
      ${ssFoot}</div></div>`;
  }
  function ssTips(el) {
    el.innerHTML = `<div style="background:#fff;color:#000;font:13px Arial,sans-serif;min-height:100%">${ssHead()}<div style="padding:10px 12px"><h2 style="font:bold 20px Arial,sans-serif;color:#063;margin:4px 0">Safe Surfing Tips</h2><ol style="line-height:1.6">
      <li><b>Never open an attachment you weren't expecting.</b> Even from your mates. Viruses send themselves from your mates' computers without them knowing!</li>
      <li>Files ending in <b>.EXE</b>, <b>.COM</b>, <b>.BAT</b>, <b>.VBS</b> and <b>.SCR</b> are programs. Programs can do anything. Pictures and text files are much safer.</li>
      <li>Word documents can have <b>macros</b> in them (that's how Melissa worked). If Word asks to enable macros and you don't know why, say no.</li>
      <li>Keep your virus checker up to date. A virus checker from 1997 doesn't know about 1999's viruses.</li>
      <li>"Forward this to everyone you know" e-mails are nearly always rubbish.</li>
      <li>Never give out your address, phone number, school or passwords online.</li>
      <li>Back up your stuff onto floppies. (Then don't lose the floppies.)</li>
      <li>If something weird happens, tell a grown-up. That's not being a baby, that's being smart.</li></ol>${ssFoot}</div></div>`;
  }

  // ================================================================ Counter Wars
  const CW_NAV = `<div style="background:#000;padding:4px;text-align:center;font:bold 12px Arial,sans-serif">${[['/', 'THIS WEEK'], ['/halloffame.html', 'HALL OF FAME'], ['/rules.html', 'RULES'], ['/quiz.html', 'QUIZ NIGHT']].map(([p, t]) => `<a href="http://www.counterwars.homepagez${p}" style="color:#ff0;margin:0 8px">[ ${t} ]</a>`).join('')}</div>`;
  const cwHead = sub => `<div style="background:#000 repeating-linear-gradient(90deg,#000 0 18px,#111 18px 20px);color:#fff;text-align:center;padding:12px 6px 8px"><div style="font:bold 34px Impact,'Arial Black',sans-serif;color:#ff0;text-shadow:3px 3px #c00;letter-spacing:2px">COUNTER WARS!!!</div><div style="font:bold 13px Arial,sans-serif;color:#0f0">${sub}</div></div>${CW_NAV}`;
  const cwFoot = '<div style="margin:14px 0 4px;font:10px Arial,sans-serif;color:#999;text-align:center">Counter Wars is run by the Homepagez Hit Counter Appreciation Society (3 members). Counts are real: every visit to a JackNet member\'s Homepagez page counts, once per visitor every 30 minutes.<br>Quiz Night: JackIRC, <b>/join #quiznight</b>, every hour on the hour.</div>';
  const odo = (n, digits) => `<span style="display:inline-flex;gap:1px;background:#000;padding:2px;border:1px solid #666">${String(Math.max(0, n | 0)).padStart(digits || 6, '0').split('').map(d => `<b style="display:inline-block;width:12px;text-align:center;background:linear-gradient(#333,#000 50%,#222);color:#fff;font:bold 13px 'Courier New',monospace">${d}</b>`).join('')}</span>`;
  let bid = 0;
  function badge(kind, sub) { // an 88 x 31 award button
    const id = 'lanb' + (++bid), gold = kind === 'gold';
    const g1 = gold ? '#fff2a0' : kind === 'silver' ? '#f4f4f4' : '#ffd0a0', g2 = gold ? '#c89000' : kind === 'silver' ? '#8a8a8a' : '#9a5a20';
    return `<svg viewBox="0 0 88 31" width="88" height="31" role="img" aria-label="${gold ? 'Golden Counter Award' : 'Counter Wars award'}" style="display:inline-block;vertical-align:middle"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g1}"/><stop offset="1" stop-color="${g2}"/></linearGradient></defs><rect x=".5" y=".5" width="87" height="30" fill="url(#${id})" stroke="#000"/><rect x="3" y="7" width="22" height="12" fill="#000"/>${[0, 1, 2].map(i => `<text x="${6 + i * 7}" y="16.5" fill="#0f0" font-family="Courier New" font-size="9" font-weight="bold">${(hash(sub + i) % 10)}</text>`).join('')}<path d="M8 21l6 7 6-7" fill="#c00"/><text x="56" y="11" font-family="Arial" font-size="7.5" font-weight="bold" text-anchor="middle">${gold ? 'GOLDEN' : kind === 'silver' ? 'SILVER' : 'BRONZE'}</text><text x="56" y="19" font-family="Arial" font-size="7.5" font-weight="bold" text-anchor="middle">COUNTER</text><text x="56" y="27" font-family="Arial" font-size="6.5" text-anchor="middle">AWARD ${esc(sub)}</text></svg>`;
  }
  const pageLink = x => `<a href="http://members.homepagez.webcom/~${esc(x.k)}/" style="color:#0ff">${esc(x.t || x.n + "'s Homepage")}</a>`;
  function cwHome(el) {
    L.got('counterwars');
    el.innerHTML = `<div style="background:#101030;color:#fff;font:13px Arial,sans-serif;min-height:100%">${cwHead('THE TOP 10 HIT COUNTERS OF THE WEEK!!! WHOSE COUNTER IS BIGGEST?!')}<div style="padding:10px 12px" class="cwx">Loading the counters... (56K, please wait)</div></div>`;
    live(el, 'lanCw', m => {
      const box = el.querySelector('.cwx'); if (!box) return;
      const days = Math.max(0, Math.ceil((m.ends - Date.now()) / 86400000));
      const row = (x, i) => `<tr style="background:${i % 2 ? '#1a1a4a' : '#22225a'}"><td style="padding:4px;text-align:center;font:bold 18px Impact,Arial,sans-serif;color:${i === 0 ? '#ffd400' : i === 1 ? '#ddd' : i === 2 ? '#e8a060' : '#88f'}">${i + 1}</td><td style="padding:4px">${pageLink(x)}<br><small style="color:#aaa">by ${esc(x.n)}${x.hood ? ' &middot; ' + esc(x.hood) : ''}</small></td><td style="padding:4px;text-align:right">${odo(x.w, 5)}</td><td style="padding:4px;text-align:right;color:#aaa"><small>${(x.h | 0).toLocaleString('en-GB')}</small></td></tr>`;
      const last = m.last && m.last.top && m.last.top.length ? m.last : null;
      box.innerHTML = `<p style="text-align:center;margin:0 0 8px">Week of <b>${wk99(m.week)}</b> &middot; the war ends in <b style="color:#ff0">${days} day${days === 1 ? '' : 's'}</b> &middot; ${m.pages} JackNet member page${m.pages === 1 ? '' : 's'} competing &middot; ${odo(m.total, 7)} hits in total</p>
        ${m.top.length ? `<table style="width:100%;border-collapse:collapse;border:2px solid #ff0"><tr style="background:#ff0;color:#000;font-weight:bold"><td style="padding:3px;width:36px">#</td><td style="padding:3px">PAGE</td><td style="padding:3px;text-align:right">THIS WEEK</td><td style="padding:3px;text-align:right">EVER</td></tr>${m.top.map(row).join('')}</table>` : `<div style="border:2px dashed #ff0;padding:12px;text-align:center">Nobody has had a single visitor yet this week!!!<br>Go and visit some ${link('http://members.homepagez.webcom/directory.html', '<span style="color:#0ff">Member Pages</span>')} and get those counters spinning.</div>`}
        <h3 style="color:#ffd400;font:bold 18px Impact,Arial,sans-serif;margin:16px 0 6px;text-align:center">&#9733; LAST WEEK'S GOLDEN COUNTER AWARD &#9733;</h3>
        ${last ? `<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">${last.top.slice(0, 3).map((x, i) => `<div style="text-align:center;background:#000;border:1px solid #ff0;padding:8px;min-width:140px">${badge(['gold', 'silver', 'bronze'][i], wk99(last.week))}<br><b>${pageLink(x)}</b><br><small>${esc(x.n)} &middot; ${(x.w | 0).toLocaleString('en-GB')} hits that week</small></div>`).join('')}</div>`
          : `<div style="text-align:center">${badge('gold', '99')}<br><small>No winners yet: this is the very first Counter War! The winner gets this 88 x 31 badge here for a whole week.</small></div>`}
        <p style="text-align:center;margin-top:12px"><b>Want to join?</b> Become a JackNet member and build a page with ${link('http://members.homepagez.webcom/signup.html', '<span style="color:#0ff">Homepagez</span>')}. Every member page is in the war automatically. Add a hit counter block so your visitors can see it go up!</p>${cwFoot}`;
    });
    if (!Net.send({ t: 'lanCw' })) el.querySelector('.cwx').textContent = 'Can\'t reach the Counter Wars server. Are you online?';
  }
  function cwFame(el) {
    el.innerHTML = `<div style="background:#101030;color:#fff;font:13px Arial,sans-serif;min-height:100%">${cwHead('HALL OF FAME: THE BIGGEST COUNTERS OF ALL TIME')}<div style="padding:10px 12px" class="cwx">Loading...</div></div>`;
    live(el, 'lanCw', m => {
      const box = el.querySelector('.cwx'); if (!box) return;
      box.innerHTML = (m.all.length ? `<table style="width:100%;border-collapse:collapse;border:2px solid #0ff">${m.all.map((x, i) => `<tr style="background:${i % 2 ? '#1a1a4a' : '#22225a'}"><td style="padding:4px;width:30px;text-align:center;font:bold 16px Impact,Arial,sans-serif;color:#0ff">${i + 1}</td><td style="padding:4px">${pageLink(x)}<br><small style="color:#aaa">by ${esc(x.n)}</small></td><td style="padding:4px;text-align:right">${odo(x.h, 6)}</td></tr>`).join('')}</table>` : '<p>No member pages yet. Be the first!</p>') + cwFoot;
    });
    Net.send({ t: 'lanCw' });
  }
  function cwRules(el) {
    el.innerHTML = `<div style="background:#101030;color:#fff;font:13px Arial,sans-serif;min-height:100%">${cwHead('DA RULES')}<div style="padding:10px 12px"><ol style="line-height:1.7">
      <li>Every JackNet member's Homepagez page is in Counter Wars. No signing up.</li>
      <li>Each visitor counts <b>once per page every 30 minutes</b>. Pressing Refresh 400 times does nothing except wear out your F5 key.</li>
      <li>A computer can only add a few new visits every 10 minutes, so no robots. (Gubbinz tried. He was a robot made of a sock.)</li>
      <li>The war runs Monday to Sunday. On Monday the counters for the war go back to zero (your real counter doesn't).</li>
      <li>The Top 3 get a <b>Golden</b>, <b>Silver</b> or <b>Bronze Counter Award</b> 88 x 31 badge on this page for a whole week.</li>
      <li>Your own visits to your own page don't count. Nice try.</li>
      <li>Be nice in guestbooks. Counters are for fun.</li></ol><p style="text-align:center">${badge('gold', 'RULES')} ${badge('silver', 'RULES')} ${badge('bronze', 'RULES')}</p>${cwFoot}</div></div>`;
  }
  function cwQuiz(el) {
    el.innerHTML = `<div style="background:#101030;color:#fff;font:13px Arial,sans-serif;min-height:100%">${cwHead('QUIZ NIGHT WITH QUIZJACK: THIS WEEK\'S BRAINIEST')}<div style="padding:10px 12px" class="cwx">Loading...</div></div>`;
    live(el, 'lanQuizTop', m => {
      const box = el.querySelector('.cwx'); if (!box) return;
      box.innerHTML = `<p style="text-align:center">Every hour, on the hour, for 10 minutes: <b style="color:#ff0">JackIRC &rarr; /join #quiznight</b>. 10 questions about 1999. First right answer gets a point.<br><button class="btn cwx-join" type="button" style="margin-top:6px">Take me to #quiznight!</button></p>
        <h3 style="color:#ff0;text-align:center;font:bold 18px Impact,Arial,sans-serif">WEEK OF ${wk99(m.week)}</h3>${m.top.length ? `<table style="margin:0 auto;border-collapse:collapse;border:2px solid #ff0;min-width:260px">${m.top.map(([n, p], i) => `<tr style="background:${i % 2 ? '#1a1a4a' : '#22225a'}"><td style="padding:4px 8px;color:#ff0;font-weight:bold">${i + 1}</td><td style="padding:4px 8px">${esc(n)}</td><td style="padding:4px 8px;text-align:right">${odo(p, 3)}</td></tr>`).join('')}</table>` : '<p style="text-align:center">Nobody has scored a point yet this week. QuizJack is very smug about it.</p>'}
        ${m.last && m.last.top && m.last.top.length ? `<p style="text-align:center;color:#aaa">Last week's champion: <b style="color:#ffd400">${esc(m.last.top[0][0])}</b> with ${m.last.top[0][1]} point(s)</p>` : ''}${cwFoot}`;
      const j = box.querySelector('.cwx-join'); if (j) j.addEventListener('click', () => L.quizJoin && L.quizJoin());
    });
    Net.send({ t: 'lanQuizTop' });
  }

  const PAGES = {
    ss: { '/': ssHome, '/index.html': ssHome, '/download.html': ssDownload, '/virus.html': ssVirus, '/tips.html': ssTips },
    cw: { '/': cwHome, '/index.html': cwHome, '/halloffame.html': cwFame, '/rules.html': cwRules, '/quiz.html': cwQuiz },
  };
  L.web = { render(site, path, el) { const fn = (PAGES[site] || {})[path]; if (fn) fn(el); else el.innerHTML = '<h2>404 Not Found</h2>'; } };
})();
