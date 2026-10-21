/* Real old-PC life: free toolbars that install themselves and stack up, and the odd silly pop-up.
 * All harmless: every pop-up closes with its X and nothing ever asks for real details. */
(function () {
  const $ = id => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const rebar = document.querySelector('#browser .rebar');
  const mobile = () => innerWidth < 640;

  // ================================================================ toolbars that install themselves
  // The toolbars themselves (skins, logos, buttons, tickers, mini games) live in js/toolbars-bars.js and
  // css/toolbars.css, loaded the first time one is shown. This part only knows their names, installs them,
  // nags you with "bundled software" setup boxes and makes uninstalling them a bit of a palaver.
  const NAMES = {
    search: 'GubbinzSearch Toolbar', mega: 'MegaSearch 2000 Companion', smileys: 'FREE Smileys!!! Toolbar', waaaghoo: 'WAAAGHoo! Answers Toolbar',
    newsflash: 'NewsFlash Ticker', dialup: 'Dial-Up Accelerator 3000', askgrot: 'Ask Jacksy! Toolbar', smileypop: 'SmileyPop Emoticon Bar',
    coupon: 'TurboCoupon Saver Bar', buddy: 'JackBuddy Toolbar', weathergrot: 'WeatherJack Live!', y2k: 'Millennium Countdown Bar',
    stargazer: 'StarGazer Horoscope Bar', booster: 'TurboNet Speed Booster', teefco: 'Rupee Companion', midibox: 'MusicBox MIDI Bar',
    ticker: 'Gem Exchange Ticker', petrescue: 'Pet Rescue Bar', cursors: 'CursorMania! Toolbar', funcursor: 'FunCursor Bar',
    lotto: 'LuckyLotto Bar', cyberpal: 'CyberPal Buddy Bar', shop: 'Shop-o-Rama Shopping Bar', kidsafe: 'Kid Safe Surfer',
    squigarc: 'Blobbit Arcade Bar', brainbox: 'BrainBox Trivia Bar', music: 'JackNet Radio Bar', waaagh: 'WAAAGH! Toolbar', weather: 'WeatherBuddy Toolbar',
  };
  const ORDER = Object.keys(NAMES); // the order they turn up in
  // 1 = asks "are you sure?" first; 2 = a "helper" quietly puts it back once per visit
  const STUBBORN = { mega: 1, coupon: 2, teefco: 2, dialup: 1, smileypop: 1, cyberpal: 2, lotto: 1, newsflash: 2, kidsafe: 1, weather: 2 };
  const MAX_AUTO = 9;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const secret = id => { try { if (window.Apps && Apps.secret) Apps.secret(id); } catch (e) {} };
  let installed = store.get('jhp_toolbars', []).filter(k => NAMES[k]);
  let peak = installed.length, autoN = 0;
  const cameBack = {};
  let barsP = null;
  function loadBars() { // the toolbar pack + its stylesheet, once, with the same build stamp as everything else
    if (barsP) return barsP;
    const stamp = ((document.querySelector('script[src*="js/oldpc.js"]') || {}).src || '').split('?v=')[1] || '1';
    const css = new Promise(res => {
      if (document.querySelector('link[href*="css/toolbars.css"]')) return res();
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/toolbars.css?v=' + stamp; l.onload = l.onerror = res; document.head.appendChild(l);
    });
    const js = window.TBars ? Promise.resolve() : new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = 'js/toolbars-bars.js?v=' + stamp; s.onload = res; s.onerror = () => { barsP = null; rej(new Error('toolbars')); }; document.head.appendChild(s);
    });
    return barsP = Promise.all([css, js]);
  }
  function renderToolbars() {
    if (!installed.length) { rebar.querySelectorAll('.band.adware,.band.tbmore').forEach(b => b.remove()); if (window.TBars) TBars.render([]); return; }
    loadBars().then(() => TBars.render(installed.slice())).catch(() => {});
  }
  function save() { store.set('jhp_toolbars', installed); }
  function install(key, quiet) {
    if (!NAMES[key] || installed.includes(key)) return;
    installed.push(key); save(); renderToolbars();
    peak = Math.max(peak, installed.length);
    const ever = store.get('jhp_tbever', []); if (!ever.includes(key)) { ever.push(key); store.set('jhp_tbever', ever); }
    if (installed.length >= 9) secret('tb.tower');
    if (ever.length >= 20) secret('tb.collector');
    if (!quiet) { Desk.toast('New toolbar installed!', `${NAMES[key]} has been added to JackNet Explorer. You didn't ask for it. Nobody ever does.`, 6000); Sound.play('join'); }
  }
  function remove(key, quiet) {
    if (!installed.includes(key)) return;
    installed = installed.filter(k => k !== key); save(); renderToolbars();
    if (!installed.length && peak >= 5) secret('tb.clean');
    if (!quiet) Desk.toast('Toolbar removed', `${NAMES[key]} has been removed. For now...`, 3500);
  }
  // the toolbar's own X, its menu and View > Toolbars all come through here
  function uninstall(key) {
    if (!installed.includes(key)) return;
    const s = STUBBORN[key] || 0, n = NAMES[key];
    const done = () => {
      remove(key);
      if (s === 2 && !cameBack[key]) { // the "helper" that nobody installed puts it back once
        cameBack[key] = 1;
        setTimeout(() => { if (store.get('jhp_adware', true) && !installed.includes(key)) { install(key, true); Desk.toast(n.replace(/ (Bar|Ticker|Toolbar)$/, '') + ' Helper', `${n} went missing, so ${n.replace(/ (Bar|Ticker|Toolbar)$/, '')} Helper kindly put it back. You're welcome! (Close it again. It won't come back twice.)`, 7000); Sound.play('boing'); } }, 25000 + Math.random() * 20000);
      }
      if ((key === 'mega' || key === 'coupon') && Math.random() < 0.5) setTimeout(survey.bind(null, key), 900);
    };
    if (s === 1) {
      Desk.msgbox('Uninstall ' + n, pick([`Are you SURE you want to remove ${n}?\n\nIt has been with you for ages. It thought you were friends.`, `Removing ${n} may cause your Internet to become up to 0% slower.\n\nRemove it anyway?`, `${n} is FREE. Free things are good. Are you sure?`]), 'q', [['Remove', done], ['Keep it', () => Desk.toast(n, 'Yay! :-) We knew you loved us.', 3000)]]);
    } else done();
  }
  function survey(key) {
    const b = document.createElement('div');
    const why = ['It installed itself', 'It is ugly', 'I have 9 other toolbars', 'My Mom said so', 'I want my page back', 'It sang at me'];
    b.innerHTML = `<p style="margin:0 0 8px">We're sorry to see <b>${NAMES[key]}</b> go! Why are you leaving? (Pick one. Or all.)</p>${why.map((w, i) => `<label style="display:block"><input type="checkbox"${i === 0 ? ' checked' : ''}> ${w}</label>`).join('')}<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn sv">Send</button></div>`;
    const w = Desk.openWin('Uninstall Survey', b, 300);
    b.querySelector('.sv').addEventListener('click', () => { w.close(); Desk.toast('Uninstall Survey', 'Thank you! Your answers have been printed out and filed in the bin.'); });
  }
  // the classic setup box: every box is already ticked, and one of them really wants to stay ticked
  function bundle(key) { loadBars().catch(() => 0).then(() => bundleNow(key)); }
  function bundleNow(key) {
    const left = ORDER.filter(k => !installed.includes(k));
    key = key && !installed.includes(key) ? key : pick(left.length ? left : ORDER);
    if (!key || document.querySelector('.tbsetup')) return;
    const extra = left.filter(k => k !== key).sort(() => Math.random() - 0.5).slice(0, 2);
    const b = document.createElement('div'); b.className = 'tbsetup';
    b.innerHTML = `<div class="tbsetup-hd"><b>${NAMES[key]}</b><span>Setup Wizard 2.0 &middot; FREE!!!</span></div>
<p style="margin:8px 0">Thank you for choosing <b>${NAMES[key]}</b>! (You didn't choose it. It chose you.) Setup will now install some <i>totally optional</i> extras:</p>
<label><input type="checkbox" data-o="main" checked> Yes, install ${NAMES[key]}</label>
<label><input type="checkbox" data-o="also" checked> <span class="ay">Also yes</span></label>
${extra.length ? `<label><input type="checkbox" data-o="extra" checked> Also install ${extra.map(k => NAMES[k]).join(' and ')} (recommended!!!)</label>` : ''}
<label><input type="checkbox" data-o="home" checked> Make JackSearch my home page, my wallpaper and my screensaver</label>
<label><input type="checkbox" data-o="eula" checked> I have read the Licence Agreement (all 4,096 pages)</label>
<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" disabled>&lt; Back</button><button class="btn big go">Install &gt;</button><button class="btn no">Cancel</button></div>`;
    const w = Desk.openWin('FREE Software Setup', b, 380);
    Sound.play('beep');
    let fights = 0; const also = b.querySelector('[data-o=also]'), ay = b.querySelector('.ay');
    also.addEventListener('change', () => { if (!also.checked && fights < 2) { fights++; setTimeout(() => { also.checked = true; ay.textContent = fights === 1 ? 'Also yes (are you sure?)' : 'Also yes (pretty please?)'; Sound.play('boing'); }, 350); } else if (!also.checked) ay.textContent = 'Also yes (fine. FINE.)'; });
    b.querySelector('.no').addEventListener('click', () => { w.close(); Desk.toast('FREE Software Setup', 'Setup cancelled. Setup will ask again later. Setup always asks again later.'); });
    b.querySelector('.go').addEventListener('click', () => {
      const on = o => { const i = b.querySelector(`[data-o=${o}]`); return i && i.checked; };
      w.close();
      const add = [];
      if (on('main')) add.push(key);
      if (on('extra')) add.push(...extra);
      if (on('also')) { const more = ORDER.filter(k => !installed.includes(k) && !add.includes(k)); if (more.length) add.push(pick(more)); }
      if (!add.length) { secret('tb.alsoyes'); Desk.toast('FREE Software Setup', 'You unticked EVERYTHING. Setup is very impressed, and slightly hurt. Nothing was installed.', 6000); return; }
      add.forEach((k, i) => setTimeout(() => install(k, i > 0), i * 700));
      if (on('home')) setTimeout(() => Desk.toast('JackSearch', "JackSearch is now your home page, wallpaper and screensaver. (It isn't. We forgot how.)", 5000), 2500);
    });
  }
  function nextToolbar() {
    if (document.hidden || !store.get('jhp_adware', true) || document.querySelector('.logon')) return;
    const left = ORDER.filter(k => !installed.includes(k));
    if (!left.length || installed.length >= (mobile() ? 4 : MAX_AUTO)) return;
    autoN++;
    if (autoN % 4 === 0 && !mobile() && document.querySelectorAll('.float').length < 2) bundle(left[0]); else install(left[0]);
  }

  // custom cursors, CursorMania style
  const CURSORS = ['', 'squig', 'sword', 'hand'];
  const CUR_SVG = {
    squig: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="5.5" cy="4.5" r="2.6" fill="%23e8381b" stroke="%235a0a00"/><circle cx="18.5" cy="4.5" r="2.6" fill="%23e8381b" stroke="%235a0a00"/><ellipse cx="12" cy="13" rx="10" ry="9" fill="%23e8381b" stroke="%235a0a00" stroke-width="1.2"/><ellipse cx="8" cy="8.5" rx="3" ry="1.5" fill="%23ff9a7a"/><ellipse cx="8.5" cy="12" rx="2.4" ry="3" fill="%23fff"/><ellipse cx="15.5" cy="12" rx="2.4" ry="3" fill="%23fff"/><circle cx="9" cy="12.6" r="1.2"/><circle cx="16" cy="12.6" r="1.2"/><path d="M9 17q3 2.4 6 0" stroke="%235a0a00" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>',
    sword: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M2 2l16 16-3 3L1 5z" fill="%23ccc" stroke="%23000"/><path d="M14 20l6-6 3 3-6 6z" fill="%238a4a1a" stroke="%23000"/></svg>',
    hand: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M8 2h4v10h2V6h4v8h2v-5h3v10l-3 7H10l-6-9 3-2 3 3V2z" fill="%233a9a2a" stroke="%23000"/></svg>',
  };
  function setCursor(i) {
    const c = CURSORS[i];
    // one !important rule for every element (title bars, menus and buttons all set their own cursor), text boxes keep the I-beam
    let st = document.getElementById('oldpc-cur');
    if (!st) { st = document.createElement('style'); st.id = 'oldpc-cur'; document.head.appendChild(st); }
    document.body.style.cursor = '';
    st.textContent = c ? `html,body,body *:not(input):not(textarea):not(select):not([contenteditable="true"]):not(.rz):not(#sizeGrip){cursor:url("data:image/svg+xml;utf8,${CUR_SVG[c].replace(/"/g, "'").replace(/#/g, '%23')}") 2 2,auto!important}` : '';
    store.set('jhp_cursor', i);
  }

  // ================================================================ the odd pop-up
  const AD = (bg, html) => `<div class="popad" style="background:${bg}">${html}</div>`;
  const POPUPS = {
    winner: () => {
      const b = document.createElement('div');
      b.innerHTML = AD('#ff0', `<div class="blinky">!!! CONGRATULATIONS !!!</div><p>You are the <b>1,000,000th</b> visitor to this site!!!</p><p>You have WON a <b>FREE Dreamcast</b>*</p><button class="btn big claim">CLAIM YOUR PRIZE</button><p class="tiny">*not a real Dreamcast. Or a real prize. Or a real millionth visitor.</p>`);
      const w = Desk.openWin('Congratulations!!! - JackNet Explorer', b, 320);
      b.querySelector('.claim').addEventListener('click', () => { w.close(); Desk.msgbox('Prize Centre', 'Your prize is... this pop-up! Thanks for playing.', 'info'); });
    },
    virus: () => {
      const b = document.createElement('div');
      b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:12px;align-items:flex-start"><svg viewBox="0 0 32 32" width="32" height="32" style="flex:none"><circle cx="16" cy="16" r="14" fill="#d42020" stroke="#600"/><path d="M10 10l12 12M22 10L10 22" stroke="#fff" stroke-width="3"/></svg><div><b>WARNING!</b> JackNet Anti-Virus has found the <b>GROTTY.EXE</b> virus on your computer!<br><br>Risk level: <b style="color:#c00">VERY SMELLY</b></div></div><div class="prog" style="margin-top:10px" hidden><span style="display:flex;gap:2px"></span></div><div class="vlog mono" style="font-size:11px;min-height:28px;margin-top:6px"></div><div class="row" style="justify-content:center;margin-top:8px"><button class="btn big vfix">Remove Virus</button><button class="btn vno">Ignore</button></div>`;
      const w = Desk.openWin('JackNet Anti-Virus 99', b, 360);
      Sound.play('uhoh');
      b.querySelector('.vno').addEventListener('click', () => { w.close(); Desk.toast('JackNet Anti-Virus', 'Virus ignored. It has eaten one (1) biscuit.'); });
      b.querySelector('.vfix').addEventListener('click', () => {
        b.querySelector('.prog').hidden = false; b.querySelector('.vfix').disabled = true;
        const lines = ['Scanning C:\\JACKOS...', 'Scanning C:\\MY DOCUMENTS\\HOMEWORK...', 'FOUND: C:\\JACKOS\\SYSTEM\\GUBBINZ.VXD', 'Removing...', 'It was just Gubbinz in a hat. All clean!'];
        let i = 0;
        const t = setInterval(() => { i++; b.querySelector('.prog span').appendChild(document.createElement('i')); b.querySelector('.vlog').textContent = lines[Math.min(lines.length - 1, i / 5 | 0)]; if (i >= 24) { clearInterval(t); setTimeout(w.close, 1400); } }, 90);
      });
    },
    squig: () => {
      const b = document.createElement('div');
      b.innerHTML = AD('#00e5ff', `<b class="popbig">PUNCH THE ALIEN AND WIN!!!</b><div class="squigzone"><button class="squigtarget" aria-label="The alien">&#9673;</button></div><p class="tiny">Hit the alien to win a prize!!!</p>`);
      const w = Desk.openWin('Free Prizes!!! - JackNet Explorer', b, 330);
      b.querySelector('.squigtarget').addEventListener('click', () => { w.close(); Desk.msgbox('YOU WIN!!!', 'You punched the alien! You win: a sore hand. The alien is fine. It phoned home about you.', 'info'); Sound.play('thud'); });
    },
    hours: () => {
      const b = document.createElement('div');
      b.innerHTML = AD('linear-gradient(135deg,#000080,#1084d0)', `<b class="popbig" style="color:#ffd400">500 FREE HOURS!!!</b><p style="color:#fff">Get on the Internet with <b>JackNet 56K</b>! Just put the CD in the drive. You've probably got 30 of them already, they come free with everything.</p><button class="btn big hrs">Sign me up!</button>`);
      const w = Desk.openWin('JackNet 56K - Free Trial', b, 330);
      b.querySelector('.hrs').addEventListener('click', () => { w.close(); Desk.toast('JackNet 56K', "You're already on JackNet! You're using it right now!"); });
    },
    runaway: () => {
      const b = document.createElement('div');
      b.innerHTML = `<p style="margin:0 0 10px">Are you SURE you want to close this window? There are LOADS of great offers!!!</p><div class="runzone"><button class="btn runbtn" style="min-width:80px">Close</button></div>`;
      const w = Desk.openWin('Special Offer!!!', b, 300);
      const btn = b.querySelector('.runbtn'); let dodges = 0;
      const dodge = () => { if (dodges >= 4) return; dodges++; btn.style.left = (Math.random() * 180) + 'px'; btn.style.top = (Math.random() * 40) + 'px'; };
      btn.addEventListener('pointerenter', dodge);
      btn.addEventListener('click', () => { if (dodges < 4 && !mobile()) { dodge(); return; } w.close(); Desk.toast('Special Offer', 'Fine, fine. You win.'); });
    },
    chain: () => {
      const b = document.createElement('div');
      b.innerHTML = `<div class="mono" style="font-size:12px;background:#fff;border:2px inset #808080;padding:6px;max-height:160px;overflow:auto">From: your cousin<br>Subject: FW: FW: FW: FW: READ THIS!!!<br><br>&gt;&gt;&gt;&gt; Send this to 10 people in the next 10 minutes or Gubbinz will come and live under your bed!!!<br>&gt;&gt;&gt;&gt; This is TRUE, it happened to my friend's brother's mate!!!<br>&gt;&gt;&gt;&gt; A big computer company will give you 50p for every person you send it to!!!</div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn cf">Forward</button><button class="btn cd">Delete</button></div>`;
      const w = Desk.openWin('FW: FW: FW: READ THIS!!! - Message', b, 360);
      b.querySelector('.cf').addEventListener('click', () => { w.close(); Desk.toast('Outlook Express', 'Forwarded to 0 people. Your 0p is in the post.'); });
      b.querySelector('.cd').addEventListener('click', () => { w.close(); Desk.toast('Outlook Express', 'Deleted. Gubbinz is on his way. (Not really.)'); });
    },
    upgrade: () => {
      const b = document.createElement('div');
      b.innerHTML = `<p style="margin:0 0 6px">A new version of JackNet Explorer is available! Downloading <b>jnx55.exe</b> (14.2 MB)...</p><div class="prog"><span style="display:flex;gap:2px"></span></div><p class="up mono" style="font-size:11px;margin:6px 0 0">Estimated time left: 4 hours 12 minutes (at 3.4 KB/sec)</p><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn uc">Cancel</button></div>`;
      const w = Desk.openWin('File Download', b, 360);
      let i = 0;
      const t = setInterval(() => { if (i < 25) { i++; b.querySelector('.prog span').appendChild(document.createElement('i')); } else { b.querySelector('.up').textContent = 'Estimated time left: 99% done... still 99%... someone picked up the phone.'; clearInterval(t); } }, 220);
      b.querySelector('.uc').addEventListener('click', () => { clearInterval(t); w.close(); });
    },
  };
  const POP_ORDER = ['winner', 'virus', 'squig', 'chain', 'hours', 'runaway', 'upgrade'];
  let popN = store.get('jhp_popn', Math.floor(Math.random() * POP_ORDER.length));
  function popup(force) {
    if (!force && (document.hidden || !store.get('jhp_popups', true) || [...document.querySelectorAll('.float')].some(e => e.offsetParent !== null && e.style.display !== 'none') || document.querySelector('.logon') || document.fullscreenElement && mobile())) return;
    POPUPS[POP_ORDER[popN % POP_ORDER.length]]();
    popN++; store.set('jhp_popn', popN);
  }

  // the Office Assistant would have loved the Letters page
  let helped = false;
  document.addEventListener('focusin', ev => {
    if (helped || ev.target.id !== 'gbMsg') return;
    helped = true;
    setTimeout(() => {
      const b = document.createElement('div');
      b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start"><canvas width="48" height="48" class="asst"></canvas><div class="bubblebox">It looks like you're writing a letter!<br><br>Would you like help?<br><label><input type="radio" name="ah" checked> Get help with writing the letter</label><br><label><input type="radio" name="ah"> Just type the letter without help</label></div></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn">OK</button></div>`;
      const w = Desk.openWin('Gubbinz the Assistant', b, 320);
      const c = b.querySelector('canvas').getContext('2d'); const pc = document.getElementById('petCanvas'); if (pc) c.drawImage(pc, 0, 0);
      b.querySelector('.btn').addEventListener('click', () => { const help = b.querySelector('input').checked; w.close(); if (help) Desk.toast('Gubbinz the Assistant', "Tip: start with 'Dear Jack'. End with 'COWABUNGA!'. You're welcome."); });
    }, 600);
  });

  // ================================================================ start up + schedule
  renderToolbars();
  setCursor(store.get('jhp_cursor', 0));
  // they still creep in, just not too often: the first one after a few minutes, then one every 10-14 minutes
  (function toolbarTimer(first) { setTimeout(() => { nextToolbar(); toolbarTimer(false); }, first ? (mobile() ? 6 : 4) * 60000 : (10 + Math.random() * 4) * 60000); })(true);
  const defSecrets = () => { if (!window.Apps || !Apps.defineSecret) return; [
    ['tb.tower', 'Toolbar Tower', 'Let the free toolbars pile up. ALL the way up.'],
    ['tb.collector', 'Toolbar Collector', 'Collect them all. Twenty of them, anyway.'],
    ['tb.clean', 'Clean Machine', 'After a big pile-up, get your browser back to nothing'],
    ['tb.alsoyes', 'Also No', 'Some setup boxes really, really want to stay ticked'],
    ['tb.57k', 'Fifty-Seven K', 'Some accelerators go to 56. Some go to 57.'],
    ['tb.squig', 'Blobbit Bopper', 'There is a Blobbit in a toolbar. Show it who is boss.'],
    ['tb.grotticus', 'The Thirteenth Sign', 'The crystal ball knows more signs than it lets on'],
    ['tb.piano', 'Toolbar Virtuoso', 'Play a scale on the smallest piano in the world'],
    ['tb.jackpot', 'Jackpot!', 'Three of a kind on a very lucky toolbar'],
    ['tb.mood', 'Mood: WAAAGH', 'Keep poking the mood ring until it turns proper green'],
    ['tb.pet', 'Good Puppy', 'Feed, pat and walk your toolbar pet until it is totally happy'],
    ['tb.skin', 'Skin Deep', 'Toolbars can change their clothes. Try on lots of them.'],
  ].forEach(s => Apps.defineSecret(s[0], s[1], s[2])); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', defSecrets); else defSecrets();
  setTimeout(() => popup(), 240000 + Math.random() * 90000); // not in a new visitor's first few minutes, and only when no other window is open
  setInterval(() => { if (Math.random() < 0.6) popup(); }, 5 * 60000);
  window.OldPC = {
    toolbarItems: () => installed.map(k => ({ label: NAMES[k], chk: true, act: () => uninstall(k) })),
    install, uninstall, remove, bundle, setCursor, NAMES, get installed() { return installed.slice(); },
    installAll() { ORDER.forEach(k => { if (!installed.includes(k)) installed.push(k); }); save(); renderToolbars(); }, // debug: every toolbar at once
    uninstallByName(n) { const k = Object.keys(NAMES).find(k => NAMES[k] === n); if (k) remove(k); }, popup, setPopups(v) { store.set('jhp_popups', v); }, setAdware(v) { store.set('jhp_adware', v); },
    get popupsOn() { return store.get('jhp_popups', true); }, get adwareOn() { return store.get('jhp_adware', true); },
  };
})();
