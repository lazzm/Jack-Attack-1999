/* JackNet Explorer 5: the browser chrome. History, menus, toolbars, explorer bar, dialogs, full screen. */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const browser = $('browser');
  const secs = [...document.querySelectorAll('.sec')];
  const NAMES = { home: 'JACK ATTACK! Online', demos: 'Games Arcade', grot: 'Gubbinz Pet', saver: 'Screensaver', reviews: 'Reviews', cheats: 'Cheats', orks: 'Hobby Corner', letters: 'Letters', art: 'Art Wall', chat: 'Chat Room', forums: 'Forums', members: 'Members', starwars: 'Intergalactic Battles Shrine', comics: 'Comics', top10: 'Top 10s', quiz: 'Nerd Quiz', polls: 'Polls', compo: 'Competitions', penpals: 'Pen Pals', downloads: 'Downloads', links: 'Cool Links', hangout: 'The Hangout', login: 'Member Login', error: 'Cannot find server' };
  let PAGE_ICO = '<svg viewBox="0 0 16 16"><path d="M3 1h7l3 3v11H3z" fill="#fff" stroke="#555"/><circle cx="8" cy="9" r="3.6" fill="#2a7ad8"/><path d="M5 8.5h6M8 5.5v7" stroke="#9fd0ff" stroke-width=".8"/></svg>';
  let FOLDER_ICO = '<svg viewBox="0 0 16 16"><path d="M1 4h5l1 1.5h8V14H1z" fill="#f2d16b" stroke="#7a5a00"/></svg>';
  const STAR_ICO = '<svg viewBox="0 0 16 16"><path d="M8 1.5l1.9 4 4.4.5-3.2 3 .9 4.3L8 11.2l-4 2.1.9-4.3-3.2-3 4.4-.5z" fill="#ffd400" stroke="#a07000"/></svg>';
  // the official JackOS 98 icons (icons.js loads after this file)
  document.addEventListener('DOMContentLoaded', () => { if (window.JICON) { PAGE_ICO = JICON.get('webpage', 16); FOLDER_ICO = JICON.get('folder', 16); } });
  // Inside JackNet Explorer the magazine lives at www.jackattack.jnet (the real tab is still jacklm.com, which also works when typed)
  const MAIN = 'www.jackattack.jnet', MAIN_RE = /^(www\.)?jackattack\.jnet/;
  const fileOf = sec => { const el = document.querySelector(`.sec[data-sec="${sec}"]`); return (el && el.dataset.file) || sec + '.htm'; };
  const urlOf = sec => 'http://' + MAIN + '/' + (sec === 'home' ? '' : fileOf(sec));
  const pageUrl = word => 'http://' + MAIN + '/' + word;
  const curUrl = () => current === 'error' || current === 'secret' ? errUrl : urlOf(current);
  const titleOf = sec => sec === 'home' ? NAMES.home : 'JACK ATTACK! - ' + (NAMES[sec] || sec);

  // ================================================================ navigation + history
  let current = null, errUrl = '';
  const back = [], fwd = [];
  let history99 = store.get('jhp_hist', []); // [{sec, ts}]
  let homeSec = store.get('jhp_homepage', 'home');
  // a home page out on the fake web ("Make this my home page!", see bridge.js) wins over a section of the magazine
  const homeUrl = () => store.get('jhp_homeurl', '') || '';
  function goHome() { const u = homeUrl(); if (u) navigate(u); else go(homeSec, 'click'); }
  let typed = store.get('jhp_typed', []);

  function show(sec) {
    const el = secs.find(s => s.dataset.sec === sec);
    if (!el) return false;
    current = sec;
    document.body.classList.toggle('ext-site', sec === 'secret');
    secs.forEach(s => s.classList.toggle('on', s === el));
    document.querySelectorAll('.mbtn').forEach(b => b.classList.toggle('on', b.dataset.go === sec));
    const t = titleOf(sec);
    $('winTitle').textContent = t + ' - JackNet Explorer' + (Net.offline ? ' [Working Offline]' : '');
    $('taskBrowser').textContent = t;
    document.title = t;
    try { history.replaceState(null, '', location.pathname + location.search + (sec === 'home' || sec === 'error' ? '' : '#' + sec)); } catch (e) {}
    $('addrBar').value = sec === 'error' ? errUrl : urlOf(sec);
    return true;
  }
  function go(sec, how) {
    if (!secs.some(s => s.dataset.sec === sec)) return;
    if (how !== 'hist' && current && (current !== sec || sec === 'error')) { back.push({ sec: current, url: current === 'error' ? errUrl : urlOf(current) }); fwd.length = 0; }
    if (back.length > 50) back.shift();
    show(sec);
    buttons();
    loading(sec === 'error' ? errUrl : urlOf(sec), sec === 'error');
    if (sec !== 'error') {
      history99.push({ sec, ts: Date.now() });
      if (history99.length > 200) history99 = history99.slice(-200);
      store.set('jhp_hist', history99);
    }
    document.dispatchEvent(new CustomEvent('section', { detail: sec }));
    $('startMenu').classList.remove('open');
    if (how === 'click') { // a new page starts at the top, like a browser (on phones, just under the banner)
      const pg = $('page');
      pg.scrollTop = DesktopSurface.width() < 760 ? pg.scrollTop + $('pane').getBoundingClientRect().top - pg.getBoundingClientRect().top - ($('menu') ? $('menu').offsetHeight : 46) : 0; // phones: land just under the sticky menu, member bar showing
    }
    if (xbarMode === 'history') renderXbar();
  }
  function goBack(n) { n = n || 1; while (n-- > 0 && back.length) { fwd.push({ sec: current, url: current === 'error' ? errUrl : urlOf(current) }); const e = back.pop(); errUrl = e.sec === 'error' ? e.url : errUrl; show(e.sec); } buttons(); loading($('addrBar').value); document.dispatchEvent(new CustomEvent('section', { detail: current })); }
  function goFwd(n) { n = n || 1; while (n-- > 0 && fwd.length) { back.push({ sec: current, url: current === 'error' ? errUrl : urlOf(current) }); const e = fwd.pop(); errUrl = e.sec === 'error' ? e.url : errUrl; show(e.sec); } buttons(); loading($('addrBar').value); document.dispatchEvent(new CustomEvent('section', { detail: current })); }
  function buttons() {
    $('navBack').disabled = $('navBackDrop').disabled = !back.length;
    $('navFwd').disabled = $('navFwdDrop').disabled = !fwd.length;
  }

  // the page "loads": throbber spins, status bar counts, progress bar fills
  let loadT = null, progT = null;
  function loading(url, failed) {
    clearTimeout(loadT); clearInterval(progT);
    const th = $('throbber'), bar = $('sProg').firstElementChild;
    th.classList.add('busy');
    $('brStatus').textContent = failed ? `Finding site: ${url.replace(/^\w+:\/\//, '').split('/')[0]}` : `Opening page ${url}...`;
    let p = 0; bar.style.width = '0';
    progT = setInterval(() => { p = Math.min(100, p + 8 + Math.random() * 18); bar.style.width = p + '%'; }, 70);
    loadT = setTimeout(() => {
      clearInterval(progT); bar.style.width = '0'; th.classList.remove('busy');
      $('brStatus').textContent = failed ? 'Cannot find server or DNS Error' : 'Done';
    }, failed ? 1600 : 420 + Math.random() * 500);
  }
  function stop() { clearTimeout(loadT); clearInterval(progT); $('throbber').classList.remove('busy'); $('sProg').firstElementChild.style.width = '0'; $('brStatus').textContent = 'Stopped'; }

  // address bar: page names, #hashes or our own URL go there; anything else, the page cannot be displayed
  function navigate(raw) {
    const text = String(raw || '').trim();
    if (!text) return;
    let lower = text.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const host = location.host.toLowerCase().replace(/^www\./, '');
    if (MAIN_RE.test(lower)) lower = host + lower.replace(MAIN_RE, '');
    let sec = null;
    const m = lower.match(/#([a-z]+)/);
    if (lower.startsWith(host) || !/[./]/.test(lower) || lower.startsWith('#')) {
      const word = m ? m[1] : lower.replace(host, '').replace(/[/#]/g, '').replace(/\.html?$/, '');
      sec = word === '' || word === 'index' ? 'home' : Object.keys(NAMES).find(k => k === word || fileOf(k).replace(/\.html?$/,'') === word || NAMES[k].toLowerCase().includes(word));
    }
    typed = [text, ...typed.filter(t => t !== text)].slice(0, 12); store.set('jhp_typed', typed);
    const exact = lower.replace(host, '').replace(/^[/#]+/, '').replace(/\.html?$/, '').replace(/\/$/, '');
    if (PAGES[exact] && !Object.keys(NAMES).includes(exact)) { showPage(exact); return; } // hidden pages beat partial title matches
    if (sec && sec !== 'error') { go(sec, 'click'); return; }
    const word = lower.replace(host, '').replace(/^[/#]+/, '').replace(/\.html?$/, '').replace(/\/$/, '');
    if (PAGES[word]) { showPage(word); return; }
    const sm = lower.match(/^([a-z0-9.-]+)(\/[^#?]*)?/); // fake 1999 web sites (IE.addSite): http://www.davesplace.jnet/cat.html
    if (sm && !SITES[sm[1]] && ALIAS[sm[1]] && SITES[ALIAS[sm[1]]]) sm[1] = ALIAS[sm[1]]; // a renamed site: the old address redirects to the new one
    if (sm && SITES[sm[1]]) { const path = (sm[2] || '/').replace(/\/(index\.html?)?$/, '/'); if (SITES[sm[1]].pages[path]) { showSite(sm[1], path); return; } }
    errUrl = /^\w+:\/\//.test(text) ? text : 'http://' + text;
    go('error', 'click');
  }
  $('addrBar').addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); navigate($('addrBar').value); $('addrBar').blur(); } });
  $('addrBar').addEventListener('focus', () => $('addrBar').select());
  $('addrGo').addEventListener('click', () => navigate($('addrBar').value));
  $('errRefresh').addEventListener('click', ev => { ev.preventDefault(); loading(errUrl, true); });

  // ================================================================ hidden pages (type them in the address bar). IE.addPage(word, title, html|fn)
  const PAGES = {};
  function addPage(word, title, html) { PAGES[word.toLowerCase()] = { title, html }; }
  function showPage(word) {
    const p = PAGES[word], el = secs.find(s => s.dataset.sec === 'secret');
    el.innerHTML = '';
    const h = typeof p.html === 'function' ? p.html() : p.html;
    if (typeof h === 'string') el.innerHTML = h; else el.appendChild(h);
    errUrl = pageUrl(word);
    if (current && current !== 'secret') { back.push({ sec: current, url: current === 'error' ? errUrl : urlOf(current) }); fwd.length = 0; }
    current = 'secret'; document.body.classList.add('ext-site');
    secs.forEach(s => s.classList.toggle('on', s === el));
    document.querySelectorAll('.mbtn').forEach(b => b.classList.remove('on'));
    $('winTitle').textContent = p.title + ' - JackNet Explorer';
    $('taskBrowser').textContent = p.title;
    $('addrBar').value = errUrl; document.title = p.title;
    buttons(); loading(errUrl);
    $('page').scrollTop = 0;
    document.dispatchEvent(new CustomEvent('section', { detail: 'secret:' + word }));
  }
  // Fake web sites that only exist inside JackNet Explorer: IE.addSite('www.davesplace.jnet', { title, pages: { '/': html|fn, '/cat.html': ... } }).
  // Keyed without the "www." so both spellings work; the address bar shows the registered host. Links inside the
  // page content (<a href="http://host/path">) stay inside the fake web; anything else "cannot be displayed".
  const SITES = {};
  function addSite(host, site) { const h = String(host).toLowerCase(); SITES[h.replace(/^www\./, '')] = Object.assign({ host: h, pages: {} }, site); }
  // Sites that changed their name (the Grot-everything ones became Jack-everything). The old address still works and
  // redirects to the new one, so old Favorites, home pages, shortcuts and links never break. IE.legacyHost(host) gives
  // the OLD host back for things keyed by it (hit counters and guestbooks in Net.kv), so nobody's counts are lost.
  const ALIAS = {}, LEGACY = {};
  const hk = h => String(h || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  function aliasSite(oldHost, newHost) { ALIAS[hk(oldHost)] = hk(newHost); LEGACY[hk(newHost)] = hk(oldHost); }
  function legacyHost(host) { const k = hk(host); return LEGACY[k] ? String(host).replace(new RegExp(k.replace(/[.]/g, '\\.'), 'i'), LEGACY[k]) : host; }
  [['grotsearch.find', 'jacksearch.find'], ['grotbay.webcom', 'jackbay.webcom'], ['grotdot.jnet', 'jackdot.jnet'], ['grotfaqs.w3b', 'jackfaqs.w3b'],
    ['grotfax.jnet', 'jackfax.jnet'], ['grotbo.netz', 'jackbo.netz'], ['aintitgrotnews.infobahn', 'aintitkoolnews.infobahn'], ['newgrots.wubwub', 'newjacks.wubwub'],
    ['squigtoonz.toonz', 'jacktoonz.toonz'], ['radiogrot.wubwub', 'radiojack.wubwub'], ['grotville.jnet', 'jacktown.jnet'], ['squigexchange.grot', 'jackexchange.grot'],
    ['grotlotto.grot', 'jacklotto.grot'], ['grotdowns.grot', 'jackdownpark.grot'], ['grotchigraveyard.kidz', 'jackotchigraveyard.kidz'], ['squigshield.netz', 'jackshield.netz'],
    ['realsquig.netz', 'realjack.netz'], ['babelgrot.grot', 'babeljack.grot'], ['grotflash-required.cyb', 'jackflash-required.cyb']].forEach(([o, n]) => aliasSite(o, n));
  function showSite(key, path) {
    if (!SITES[key] && ALIAS[key]) key = ALIAS[key];
    const s = SITES[key], pg = s.pages[path], el = secs.find(x => x.dataset.sec === 'secret');
    const url = 'http://' + s.host + ((pg && pg.path) || path); // pg.path keeps the capitals (e.g. /SpaceCity/)
    el.innerHTML = '';
    const h = typeof pg === 'function' ? pg() : (pg && pg.html ? (typeof pg.html === 'function' ? pg.html() : pg.html) : pg);
    if (typeof h === 'string') el.innerHTML = h; else if (h) el.appendChild(h);
    errUrl = url;
    if (current && current !== 'secret') { back.push({ sec: current, url: current === 'error' ? errUrl : urlOf(current) }); fwd.length = 0; }
    current = 'secret'; document.body.classList.add('ext-site');
    secs.forEach(x => x.classList.toggle('on', x === el));
    document.querySelectorAll('.mbtn').forEach(b => b.classList.remove('on'));
    const title = (pg && pg.title) || s.title || s.host;
    $('winTitle').textContent = title + ' - JackNet Explorer';
    $('taskBrowser').textContent = title;
    $('addrBar').value = url; document.title = title;
    buttons(); loading(url);
    $('page').scrollTop = 0;
    document.dispatchEvent(new CustomEvent('section', { detail: 'site:' + s.host + path }));
  }
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('#s-secret a[href^="http://"], #s-secret a[href^="https://"]'); if (!a) return;
    ev.preventDefault(); navigate(a.getAttribute('href'));
  });

  // ================================================================ menus
  let openMenus = [], menubarOpen = null;
  function closeMenus() { openMenus.forEach(m => m.remove()); openMenus = []; document.querySelectorAll('#ieMenu button.open').forEach(b => b.classList.remove('open')); menubarOpen = null; }
  function menu(items, x, y, level, inSurface) {
    // Public callers pass browser client coordinates; layout below uses monitor pixels.
    if (!inSurface) { const local = DesktopSurface.point(x, y); x = local.x; y = local.y; }
    level = level || 0;
    openMenus.filter((m, i) => i >= level).forEach(m => m.remove());
    openMenus = openMenus.slice(0, level);
    const el = document.createElement('div'); el.className = 'menu'; el.setAttribute('role', 'menu');
    for (const it of items) {
      if (it === '-') { el.appendChild(document.createElement('hr')); continue; }
      const b = document.createElement('button'); b.setAttribute('role', 'menuitem');
      b.innerHTML = (it.icon ? `<span class="mico">${it.icon}</span>` : '') + `<span>${esc(it.label)}</span>` + (it.key ? `<span class="key">${esc(it.key)}</span>` : '');
      if (it.dis) b.disabled = true;
      if (it.chk) b.classList.add('chk');
      if (it.rad) b.classList.add('rad');
      if (it.sub) {
        b.classList.add('sub');
        const openSub = () => { const r = DesktopSurface.rect(b); menu(typeof it.sub === 'function' ? it.sub() : it.sub, r.right - 3, r.top - 3, level + 1, true); };
        b.addEventListener('mouseenter', openSub); b.addEventListener('click', openSub);
      } else {
        b.addEventListener('mouseenter', () => { openMenus.filter((m, i) => i > level).forEach(m => m.remove()); openMenus = openMenus.slice(0, level + 1); });
        b.addEventListener('click', () => { closeMenus(); if (it.act) it.act(); });
      }
      b.addEventListener('mouseenter', () => hl(el, null)); // the mouse takes over from the keyboard highlight
      el.appendChild(b);
    }
    DesktopSurface.root().appendChild(el);
    el.style.maxHeight = Math.max(40, DesktopSurface.height() - 40) + 'px';
    el.style.maxWidth = Math.max(40, DesktopSurface.width() - 4) + 'px';
    el.style.overflowY = 'auto';
    const r = DesktopSurface.rect(el);
    // a submenu that will not fit on the right opens to the left of its parent, like JackOS
    el.style.left = Math.max(2, (level && x + r.width > DesktopSurface.width() - 2) ? x - r.width - (openMenus[level - 1] ? openMenus[level - 1].offsetWidth - 6 : 0) : Math.min(x, DesktopSurface.width() - r.width - 2)) + 'px';
    el.style.top = Math.max(2, Math.min(y, DesktopSurface.height() - r.height - 34)) + 'px';
    openMenus.push(el);
    return el;
  }
  document.addEventListener('pointerdown', ev => { if (!ev.target.closest('.menu') && !ev.target.closest('#ieMenu button') && !ev.target.closest('.tdrop,.cdrop,.links .chev')) closeMenus(); });
  const under = (btn, items) => { const r = btn.getBoundingClientRect(); menu(items, r.left, r.bottom); };
  // ---- keyboard: arrows move, Enter picks, Esc closes one level, a letter jumps to an item, Alt+letter opens a menu-bar menu
  const menuItems = m => [...m.querySelectorAll('button:not(:disabled)')];
  function hl(m, b) { m.querySelectorAll('.hl').forEach(x => x.classList.remove('hl')); if (b) { b.classList.add('hl'); b.scrollIntoView({ block: 'nearest' }); } }
  function barStep(d) {
    const bs = [...document.querySelectorAll('#ieMenu button')], j = bs.indexOf(menubarOpen);
    bs[(j + d + bs.length) % bs.length].click();
    if (openMenus[0]) hl(openMenus[0], menuItems(openMenus[0])[0]);
  }
  document.addEventListener('keydown', ev => {
    if (!openMenus.length) {
      if (ev.altKey && !ev.ctrlKey && !ev.metaKey && /^[a-z]$/i.test(ev.key) && !(ev.target.closest && ev.target.closest('.float')) && browser.classList.contains('inactive')) {
        const a = document.querySelector('.float:not(.inactive)'), f = a && a.style.display !== 'none' && a._altKeys && a._altKeys[ev.key.toLowerCase()];
        if (f) { ev.preventDefault(); f(); }
        return;
      }
      if (ev.altKey && !ev.ctrlKey && !ev.metaKey && /^[a-z]$/i.test(ev.key) && !browser.classList.contains('min') && !(ev.target.closest && ev.target.closest('.float'))) {
        const b = [...document.querySelectorAll('#ieMenu button')].find(x => x.querySelector('u') && x.querySelector('u').textContent.toLowerCase() === ev.key.toLowerCase());
        if (b) { ev.preventDefault(); b.click(); if (openMenus[0]) hl(openMenus[0], menuItems(openMenus[0])[0]); }
      }
      return;
    }
    const m = openMenus[openMenus.length - 1], items = menuItems(m), cur = m.querySelector('.hl'), i = items.indexOf(cur), k = ev.key;
    if (k === 'ArrowDown' || k === 'ArrowUp') { ev.preventDefault(); if (items.length) hl(m, items[(i + (k === 'ArrowDown' ? 1 : -1) + items.length) % items.length]); }
    else if (k === 'ArrowRight') { ev.preventDefault(); if (cur && cur.classList.contains('sub')) { cur.click(); const s = openMenus[openMenus.length - 1]; if (s !== m) hl(s, menuItems(s)[0]); } else if (menubarOpen) barStep(1); }
    else if (k === 'ArrowLeft') { ev.preventDefault(); if (openMenus.length > 1) { m.remove(); openMenus.pop(); } else if (menubarOpen) barStep(-1); else closeMenus(); }
    else if (k === 'Enter' || k === ' ') { ev.preventDefault(); if (cur) cur.click(); }
    else if (k === 'Escape') { ev.preventDefault(); ev.stopPropagation(); if (openMenus.length > 1) { m.remove(); openMenus.pop(); } else closeMenus(); }
    else if (/^[a-z0-9]$/i.test(k) && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
      const starts = b => b.textContent.trim().toLowerCase().startsWith(k.toLowerCase());
      const all = items.filter(starts), hit = items.find((b, j) => j > i && starts(b)) || all[0];
      if (hit) { ev.preventDefault(); hl(m, hit); if (all.length === 1) hit.click(); }
    }
  }, true);

  const sizes = [['Largest', 1.3], ['Larger', 1.15], ['Medium', 1], ['Smaller', 0.9], ['Smallest', 0.8]];
  let textSize = store.get('jhp_textsize', 1);
  document.documentElement.style.setProperty('--tz', textSize);
  let encoding = 'Western European (JackOS)';
  const MENUS = {
    file: () => [
      { label: 'New', sub: [{ label: 'Window', key: 'Ctrl+N', act: () => Desk.msgbox('JackNet Explorer', 'You can only have one window open at a time. This computer only has 32MB of RAM.', 'warn') }, '-', { label: 'Message', act: () => go('letters', 'click') }, { label: 'Post', act: () => go('chat', 'click') }, { label: 'Contact', dis: true }] },
      { label: 'Open...', key: 'Ctrl+O', act: openDialog },
      { label: 'Edit with Notepad', act: viewSource },
      { label: 'Save', key: 'Ctrl+S', dis: true },
      { label: 'Save As...', act: () => window.Bridge ? Bridge.saveAs() : saveAs() },
      '-',
      { label: 'Page Setup...', act: pageSetup },
      { label: 'Print...', key: 'Ctrl+P', act: () => (window.Family && Family.printPage ? Family.printPage() : window.print()) },
      '-',
      { label: 'Send', sub: [{ label: 'Page by E-mail...', act: () => mailNew({ subj: document.title, body: '(page attached... well, the address is)\n\n' + curUrl() + '\n' }) }, { label: 'Link by E-mail...', act: () => mailNew({ subj: document.title, body: 'Look at this!!!\n\n' + curUrl() + '\n' }) }, { label: 'Shortcut to Desktop', act: shortcut }] },
      { label: 'Import and Export...', dis: true },
      '-',
      { label: 'Properties', act: properties },
      { label: 'Work Offline', chk: Net.offline, act: () => window.Bridge ? Bridge.toggleOffline() : toggleOffline() },
      { label: 'Close', act: closeBrowser },
    ],
    edit: () => {
      const sel = String(window.getSelection() || '');
      return [
        { label: 'Cut', key: 'Ctrl+X', dis: true },
        { label: 'Copy', key: 'Ctrl+C', dis: !sel, act: () => document.execCommand('copy') },
        { label: 'Paste', key: 'Ctrl+V', dis: true },
        '-',
        { label: 'Select All', key: 'Ctrl+A', act: selectAll },
        '-',
        { label: 'Find (on This Page)...', key: 'Ctrl+F', act: findDialog },
      ];
    },
    view: () => [
      { label: 'Toolbars', sub: () => [
        { label: 'Standard Buttons', chk: !browser.classList.contains('no-std'), act: () => toggleBand('no-std') },
        { label: 'Address Bar', chk: !browser.classList.contains('no-addr'), act: () => toggleBand('no-addr') },
        { label: 'Links', chk: !browser.classList.contains('no-links'), act: () => toggleBand('no-links') },
        ...(window.OldPC ? OldPC.toolbarItems() : []),
        '-', { label: 'Customize...', dis: true }] },
      { label: 'Status Bar', chk: !browser.classList.contains('no-status'), act: () => toggleBand('no-status') },
      { label: 'Explorer Bar', sub: () => [
        { label: 'Search', key: 'Ctrl+E', rad: xbarMode === 'search', act: () => xbar('search') },
        { label: 'Favorites', key: 'Ctrl+I', rad: xbarMode === 'favorites', act: () => xbar('favorites') },
        { label: 'History', key: 'Ctrl+H', rad: xbarMode === 'history', act: () => xbar('history') },
        { label: 'Folders', dis: true },
        '-', { label: 'Tip of the Day', act: tip }] },
      '-',
      { label: 'Go To', sub: () => [
        { label: 'Back', key: 'Alt+Left', dis: !back.length, act: () => goBack() },
        { label: 'Forward', key: 'Alt+Right', dis: !fwd.length, act: () => goFwd() },
        '-', { label: 'Home Page', key: 'Alt+Home', act: goHome },
        '-', ...back.slice(-6).reverse().map((e, i) => ({ label: titleOf(e.sec), act: () => goBack(i + 1) }))] },
      { label: 'Stop', key: 'Esc', act: stop },
      { label: 'Refresh', key: 'F5', act: refresh },
      '-',
      { label: 'Text Size', sub: () => sizes.map(([n, v]) => ({ label: n, rad: textSize === v, act: () => { textSize = v; document.documentElement.style.setProperty('--tz', v); store.set('jhp_textsize', v); window.dispatchEvent(new Event('resize')); } })) },
      { label: 'Encoding', sub: () => [{ label: 'Auto-Select', chk: true }, '-', ...['Western European (JackOS)', 'Western European (ISO)', 'Central European (JackOS)', 'Cyrillic (JackOS)', 'Japanese (Auto-Select)', 'User Defined'].map(e => ({ label: e, rad: encoding === e, act: () => { encoding = e; Desk.toast('Encoding', e === 'Western European (JackOS)' ? 'Back to normal.' : 'Nothing changed. It was already in English.'); } }))] },
      '-',
      { label: 'Source', act: viewSource },
      { label: 'Full Screen', key: 'F11', chk: !!document.fullscreenElement, act: fullScreen },
    ],
    favorites: () => [
      { label: 'Add to Favorites...', key: 'Ctrl+D', act: addFav },
      { label: 'Organize Favorites...', act: organizeFavs },
      '-',
      { label: 'Links', icon: FOLDER_ICO, sub: () => linkItems() },
      ...(window.WebDir ? [{ label: 'JackNet Directory', icon: FOLDER_ICO, sub: () => WebDir.favItems(PAGE_ICO, FOLDER_ICO) }] : []),
      ...favs().map(f => ({ label: f.title, icon: PAGE_ICO, act: () => f.url ? navigate(f.url) : go(f.sec, 'click') })),
    ],
    tools: () => [
      { label: 'Mail and News', sub: mailItems },
      { label: 'Synchronize...', act: synchronize },
      { label: 'JackOS Update', act: () => Desk.msgbox('JackOS Update', 'Checking for updates... Your computer is completely up to date. For 1999.', 'info') },
      '-',
      { label: 'Show Related Links', act: () => { xbar('search'); $('xq').value = NAMES[current] || ''; runSearch(); } },
      '-',
      { label: 'Internet Options...', act: options },
    ],
    help: () => [
      { label: 'Contents and Index', act: helpContents },
      { label: 'Tip of the Day', act: tip },
      { label: 'For NetScapeGoat Users', act: () => Desk.msgbox('For NetScapeGoat Users', "Welcome! Everything works the same as NetScapeGoat Navigator, except the big N doesn't have shooting stars. Sorry.", 'info') },
      { label: 'Tour', act: () => go('home', 'click') },
      { label: 'Online Support', act: () => navigate('http://support.jacknet') },
      { label: 'Send Feedback', act: () => go('letters', 'click') },
      '-',
      { label: 'About JackNet Explorer', act: about },
    ],
  };
  document.querySelectorAll('#ieMenu button').forEach(b => {
    const open = () => { closeMenus(); b.classList.add('open'); menubarOpen = b; under(b, MENUS[b.dataset.menu]()); };
    b.addEventListener('click', () => { if (menubarOpen === b) closeMenus(); else open(); });
    b.addEventListener('mouseenter', () => { if (menubarOpen && menubarOpen !== b) open(); });
  });
  function linkItems() { return [...document.querySelectorAll('#bandLinks button')].map(b => ({ label: b.textContent.trim(), icon: PAGE_ICO, act: () => b.dataset.url ? navigate(b.dataset.url) : go(b.dataset.go, 'click') })); }
  // Links bar buttons can point at a section (data-go) or at any address on the fake web (data-url)
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('#bandLinks button[data-url]'); if (!b) return; ev.preventDefault(); navigate(b.dataset.url); Sound.play('click'); });
  function mailNew(o) { if (window.JackFiles && JackFiles.compose) JackFiles.compose(o); else go('letters', 'click'); }
  function mailItems() {
    return [{ label: 'Read Mail', act: () => (window.Apps ? Apps.open('outlook') : Desk.toast('JackMail Express', 'You have 0 new messages. You always have 0 new messages.')) },
      { label: 'New Message...', act: () => mailNew({ to: 'Jack <jack@jackattack.jnet>', subj: 'A letter for JACK ATTACK!' }) },
      { label: 'Send a Link...', act: () => mailNew({ subj: document.title, body: 'Look at this!!!\n\n' + curUrl() + '\n' }) },
      { label: 'Send Page...', act: () => mailNew({ subj: document.title, body: '(page attached... well, the address is)\n\n' + curUrl() + '\n' }) },
      '-', { label: 'Read News', act: () => { go('home', 'click'); setTimeout(() => $('news').scrollIntoView({ block: 'center', behavior: 'smooth' }), 80); } }];
  }

  // ================================================================ toolbar
  $('navBack').addEventListener('click', () => goBack());
  $('navFwd').addEventListener('click', () => goFwd());
  $('navBackDrop').addEventListener('click', ev => under(ev.currentTarget.parentElement, back.slice(-9).reverse().map((e, i) => ({ label: titleOf(e.sec), act: () => goBack(i + 1) })).concat(['-', { label: 'History', key: 'Ctrl+H', act: () => xbar('history') }])));
  $('navFwdDrop').addEventListener('click', ev => under(ev.currentTarget.parentElement, fwd.slice(-9).reverse().map((e, i) => ({ label: titleOf(e.sec), act: () => goFwd(i + 1) })).concat(['-', { label: 'History', key: 'Ctrl+H', act: () => xbar('history') }])));
  $('navStop').addEventListener('click', stop);
  $('navRefresh').addEventListener('click', refresh);
  $('navHome').addEventListener('click', goHome);
  $('navSearch').addEventListener('click', () => xbar('search'));
  $('navFav').addEventListener('click', () => xbar('favorites'));
  $('navHist').addEventListener('click', () => xbar('history'));
  $('navMail').addEventListener('click', ev => under(ev.currentTarget, mailItems()));
  $('navMailDrop').addEventListener('click', ev => under(ev.currentTarget.parentElement, mailItems()));
  $('navPrint').addEventListener('click', () => (window.Family && Family.printPage ? Family.printPage() : window.print()));
  $('navEdit').addEventListener('click', viewSource);
  $('addrDrop').addEventListener('click', ev => {
    const combo = ev.currentTarget.parentElement, r = combo.getBoundingClientRect();
    const pop = window.WebDir ? WebDir.popular(10).map(e => ({ label: e.url, icon: PAGE_ICO, act: () => navigate(e.url) })) : [];
    const list = [...typed.map(t => ({ label: t, act: () => navigate(t) })), ...(typed.length ? ['-'] : []), ...pop, ...(pop.length ? ['-'] : []), ...Object.keys(NAMES).filter(k => k !== 'error').map(k => ({ label: urlOf(k), icon: PAGE_ICO, act: () => go(k, 'click') }))];
    const m = menu(list, r.left, r.bottom); m.classList.add('combolist'); m.style.minWidth = r.width + 'px';
  });
  document.querySelector('#bandLinks .chev').addEventListener('click', ev => under(ev.currentTarget, linkItems()));
  function refresh() { loading(curUrl(), current === 'error'); document.dispatchEvent(new CustomEvent('section', { detail: current })); }

  // ================================================================ explorer bar (Search / Favorites / History)
  let xbarMode = null;
  function xbar(mode) {
    if (xbarMode === mode) mode = null;
    xbarMode = mode;
    $('xbar').hidden = !mode;
    ['navSearch', 'navFav', 'navHist'].forEach(id => $(id).classList.toggle('on', mode && id === { search: 'navSearch', favorites: 'navFav', history: 'navHist' }[mode]));
    if (mode) renderXbar();
  }
  $('xClose').addEventListener('click', () => xbar(null));
  function xi(icon, label, fn) { const b = document.createElement('button'); b.className = 'xi'; b.innerHTML = icon + '<span>' + esc(label) + '</span>'; b.addEventListener('click', fn); return b; }
  function renderXbar() {
    const body = $('xBody'); body.innerHTML = '';
    $('xTitle').textContent = { search: 'Search', favorites: 'Favorites', history: 'History' }[xbarMode];
    if (xbarMode === 'search' && window.WebDir && WebDir.xbar) {
      WebDir.xbar(body, runSearch); // "Choose a search service": the web engines, or this site (runSearch below)
    } else if (xbarMode === 'search') {
      body.innerHTML = '<div style="font-weight:bold;margin-bottom:4px">JackSearch</div><form id="xform" class="row" style="gap:4px;flex-wrap:nowrap"><input type="text" id="xq" placeholder="Find a page..." style="flex:1;min-width:0"><button class="btn" type="submit" style="padding:2px 6px">Search</button></form><div id="xres" style="margin-top:8px"></div>';
      $('xform').addEventListener('submit', ev => { ev.preventDefault(); runSearch(); });
      setTimeout(() => $('xq').focus(), 30);
    } else if (xbarMode === 'favorites') {
      const row = document.createElement('div'); row.className = 'row'; row.style.marginBottom = '6px';
      row.innerHTML = '<button class="btn" style="padding:1px 6px">Add...</button><button class="btn" style="padding:1px 6px">Organize...</button>';
      row.children[0].addEventListener('click', addFav); row.children[1].addEventListener('click', organizeFavs);
      body.appendChild(row);
      const f = document.createElement('div'); f.className = 'folder'; f.innerHTML = FOLDER_ICO.replace('<svg', '<svg style="width:16px;height:16px;vertical-align:-3px"') + ' Links'; body.appendChild(f);
      linkItems().forEach(l => body.appendChild(xi(PAGE_ICO, l.label, l.act)));
      if (window.WebDir) WebDir.xbarFavs(body, xi, FOLDER_ICO, PAGE_ICO);
      favs().forEach(fv => body.appendChild(xi(PAGE_ICO, fv.title, () => fv.url ? navigate(fv.url) : go(fv.sec, 'click'))));
    } else if (xbarMode === 'history') {
      const day = new Date().toDateString();
      const groups = { Today: [], 'Earlier': [] };
      const seen = new Set();
      for (const h of [...history99].reverse()) {
        const g = new Date(h.ts).toDateString() === day ? 'Today' : 'Earlier';
        if (seen.has(g + h.sec)) continue; seen.add(g + h.sec);
        groups[g].push(h);
      }
      body.innerHTML = '<div style="margin-bottom:6px">View: <b>By Date</b></div>';
      for (const [g, list] of Object.entries(groups)) {
        if (!list.length) continue;
        const f = document.createElement('div'); f.className = 'folder'; f.innerHTML = FOLDER_ICO.replace('<svg', '<svg style="width:16px;height:16px;vertical-align:-3px"') + ' ' + g; body.appendChild(f);
        list.forEach(h => body.appendChild(xi(PAGE_ICO, titleOf(h.sec), () => go(h.sec, 'click'))));
      }
      if (!history99.length) body.insertAdjacentHTML('beforeend', '<p>Nothing here yet.</p>');
    }
  }
  function runSearch() {
    const fold = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); // so "pokemon" finds "Pokémon"
    const q = fold(($('xq').value || '').trim()), res = $('xres');
    res.innerHTML = '';
    if (!q) return;
    const hits = [];
    for (const s of secs) {
      if (s.dataset.sec === 'error') continue;
      const text = fold(s.textContent.replace(/\s+/g, ' ')), i = text.indexOf(q);
      if (i < 0) continue;
      const n = text.split(q).length - 1;
      const snip = esc(text.slice(Math.max(0, i - 40), i)) + '<mark>' + esc(text.substr(i, q.length)) + '</mark>' + esc(text.slice(i + q.length, i + q.length + 50));
      hits.push({ sec: s.dataset.sec, n, snip });
    }
    hits.sort((a, b) => b.n - a.n);
    res.insertAdjacentHTML('beforeend', `<div style="margin-bottom:4px">${hits.length ? hits.length + ' page' + (hits.length > 1 ? 's' : '') + ' found:' : 'No pages found. Try another word!'}</div>`);
    for (const h of hits) {
      res.appendChild(xi(PAGE_ICO, `${titleOf(h.sec)} (${h.n})`, () => { go(h.sec, 'click'); setTimeout(() => { window.getSelection().removeAllRanges(); window.find && window.find(q); }, 120); }));
      const sn = document.createElement('div'); sn.className = 'snip'; sn.innerHTML = '...' + h.snip + '...'; res.appendChild(sn);
    }
  }

  // ================================================================ favorites + desktop shortcuts
  const DEFAULT_FAVS = [{ sec: 'demos', title: 'Games Arcade' }, { sec: 'cheats', title: 'Cheats!!!' }, { sec: 'orks', title: 'Hobby Corner' }];
  function favs() { return store.get('jhp_favs', DEFAULT_FAVS).map(f => (f && f.sec === 'orks' && f.title === 'WAAAGH!' ? Object.assign({}, f, { title: 'Hobby Corner' }) : f)); } // the old default name, shown as the section's new name
  function addFav() {
    if (current === 'error') return Desk.msgbox('Add Favorite', "You can't add a page that doesn't exist!", 'warn');
    if (current === 'secret' && window.Bridge) return Bridge.addFav(curUrl(), document.title); // pages out on the fake web keep their address
    Desk.ask('Add Favorite', 'JackNet Explorer will add this page to your Favorites list. Name:', titleOf(current), 40, name => {
      name = (name || '').trim(); if (!name) return;
      const list = favs().filter(f => f.sec !== current); list.push({ sec: current, title: name.slice(0, 40) }); store.set('jhp_favs', list);
      Desk.toast('Favorites', `"${name}" added to Favorites.`);
      if (xbarMode === 'favorites') renderXbar();
    });
  }
  function organizeFavs() {
    const body = document.createElement('div');
    const draw = () => {
      body.innerHTML = '<p style="margin:0 0 6px">To delete an item, select it and click Delete.</p><div class="field" style="height:160px;overflow:auto;padding:4px" id="ofList"></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" id="ofClose">Close</button></div>';
      const list = body.querySelector('#ofList');
      favs().forEach((f, i) => {
        const row = document.createElement('div'); row.className = 'row'; row.style.justifyContent = 'space-between';
        row.innerHTML = `<span>${PAGE_ICO.replace('<svg', '<svg style="width:16px;height:16px;vertical-align:-3px"')} ${esc(f.title)}</span>`;
        const del = document.createElement('button'); del.className = 'btn'; del.style.padding = '0 6px'; del.style.minHeight = '18px'; del.textContent = 'Delete';
        del.addEventListener('click', () => { const l = favs(); l.splice(i, 1); store.set('jhp_favs', l); draw(); if (xbarMode === 'favorites') renderXbar(); });
        row.appendChild(del); list.appendChild(row);
      });
      body.querySelector('#ofClose').addEventListener('click', () => w.close());
    };
    const w = Desk.openWin('Organize Favorites', body, 340);
    draw();
  }
  function renderShortcuts() {
    document.querySelectorAll('.dicon.sc').forEach(e => e.remove());
    for (const s of store.get('jhp_shortcuts', [])) {
      const b = document.createElement('button'); b.className = 'dicon sc';
      b.innerHTML = `${window.JICON ? JICON.get('url', 32) : '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><circle cx="16" cy="18" r="7" fill="#2a7ad8"/><rect x="5" y="22" width="9" height="9" fill="#fff" stroke="#000"/><path d="M7 29l5-5M9 24h3v3" stroke="#000" fill="none"/></svg>'}<span>${esc(s.title)}</span>`;
      b.addEventListener('click', () => { showBrowser(); go(s.sec, 'click'); });
      document.querySelector('.icons').appendChild(b);
    }
  }
  function shortcut() {
    if (current === 'error') return;
    if (window.Bridge) return Bridge.shortcut(); // a proper Internet Shortcut that remembers the address (bridge.js)
    const list = store.get('jhp_shortcuts', []).filter(s => s.sec !== current);
    list.push({ sec: current, title: 'Shortcut to ' + (NAMES[current] || current) }); store.set('jhp_shortcuts', list.slice(-6));
    renderShortcuts(); Desk.toast('Desktop', 'Shortcut created on the desktop.');
  }

  // ================================================================ dialogs
  function openDialog() {
    const f = document.createElement('form');
    f.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${PAGE_ICO.replace('<svg', '<svg style="width:32px;height:32px;flex:none"')}<span>Type the Internet address of a document or folder, and JackNet Explorer will open it for you.</span></div><div class="row" style="margin-top:10px;flex-wrap:nowrap"><label>Open:</label><input type="text" style="flex:1;min-width:0" value="${esc(curUrl())}"></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" type="submit" style="min-width:75px">OK</button><button class="btn" type="button" style="min-width:75px">Cancel</button></div>`;
    const w = Desk.openWin('Open', f, 380);
    const inp = f.querySelector('input'); setTimeout(() => inp.select(), 30);
    f.addEventListener('submit', ev => { ev.preventDefault(); w.close(); navigate(inp.value); });
    f.querySelector('button[type=button]').addEventListener('click', w.close);
  }
  function sectionSource() {
    const el = secs.find(s => s.dataset.sec === current);
    const src = (el ? el.outerHTML : '').replace(/></g, '>\n<').replace(/\n\s*\n/g, '\n');
    return `<html>\n<head>\n<title>${titleOf(current)}</title>\n<!-- Made in Notepad. Honest. -->\n</head>\n<body>\n${src}\n</body>\n</html>`;
  }
  function viewSource() { Desk.notepad((current === 'home' ? 'index' : current) + '[1].htm', sectionSource()); }
  function saveAs() {
    const blob = new Blob(['<!DOCTYPE html>\n' + document.documentElement.outerHTML], { type: 'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = titleOf(current).replace(/[^\w !-]/g, '') + '.htm';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    Desk.toast('Save Web Page', 'Saved! (Complete web page, about ' + Math.round(blob.size / 1024) + ' KB)');
  }
  function pageSetup() {
    const b = document.createElement('div');
    b.innerHTML = `<div class="group"><span class="lg">Paper</span><div class="row"><label>Size:</label><select><option>A4</option><option>Letter</option></select></div><div class="row" style="margin-top:4px"><label>Source:</label><select><option>Automatically Select</option></select></div></div><div class="group"><span class="lg">Headers and Footers</span><div class="row"><label style="width:50px">Header</label><input type="text" value="&amp;w&amp;bPage &amp;p of &amp;P" style="flex:1"></div><div class="row" style="margin-top:4px"><label style="width:50px">Footer</label><input type="text" value="&amp;u&amp;b&amp;d" style="flex:1"></div></div><div class="row"><label><input type="radio" name="or" checked> Portrait</label><label><input type="radio" name="or"> Landscape</label></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" style="min-width:75px">OK</button><button class="btn" style="min-width:75px">Cancel</button><button class="btn" style="min-width:75px">Printer...</button></div>`;
    const w = Desk.openWin('Page Setup', b, 380);
    b.querySelectorAll('.btn').forEach((x, i) => x.addEventListener('click', i < 2 ? w.close : () => window.print()));
  }
  function properties() {
    const t = Desk.today99(), size = document.documentElement.outerHTML.length;
    const b = document.createElement('div');
    b.innerHTML = `<div class="tabs"><span class="on">General</span></div><div class="tabpage"><div class="row" style="flex-wrap:nowrap;gap:10px">${PAGE_ICO.replace('<svg', '<svg style="width:32px;height:32px"')}<b>${esc(titleOf(current))}</b></div><hr><table style="font:12px var(--ui);border-collapse:collapse;width:100%"><tr><td style="width:110px;vertical-align:top">Protocol:</td><td>${location.protocol === 'https:' ? 'HyperText Transfer Protocol with Privacy' : 'HyperText Transfer Protocol'}</td></tr><tr><td>Type:</td><td>HTML Document</td></tr><tr><td>Connection:</td><td>${location.protocol === 'https:' ? 'SSL 3.0, RC4 with 128 bit encryption (High)' : 'Not Encrypted'}</td></tr><tr><td style="vertical-align:top">Address (URL):</td><td style="word-break:break-all">${esc(curUrl())}</td></tr><tr><td>Size:</td><td>${size.toLocaleString('en-GB')} bytes</td></tr><tr><td>Created:</td><td>01/01/99</td></tr><tr><td>Modified:</td><td>${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}/99</td></tr></table></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" disabled>Certificates</button><button class="btn" style="min-width:75px">OK</button></div>`;
    const w = Desk.openWin('Properties', b, 380);
    b.querySelectorAll('.btn')[1].addEventListener('click', w.close);
  }
  function findDialog() {
    const f = document.createElement('form');
    f.innerHTML = `<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:8px"><div style="flex:1"><div class="row" style="flex-wrap:nowrap"><label for="fdq">Fi<u>n</u>d what:</label><input type="text" id="fdq" style="flex:1;min-width:0"></div><div class="row" style="margin-top:8px;align-items:flex-start"><div><label><input type="checkbox" id="fdw"> Match <u>w</u>hole word only</label><br><label><input type="checkbox" id="fdc"> Match <u>c</u>ase</label></div><div class="group" style="margin:0 0 0 auto;padding:8px 6px 4px"><span class="lg">Direction</span><label><input type="radio" name="fdd" id="fdu"> <u>U</u>p</label> <label><input type="radio" name="fdd" checked> <u>D</u>own</label></div></div><div id="fdmsg" style="color:#c00;min-height:14px;margin-top:4px"></div></div><div style="display:flex;flex-direction:column;gap:6px"><button class="btn" type="submit" style="min-width:80px"><u>F</u>ind Next</button><button class="btn" type="button">Cancel</button></div></div>`;
    const w = Desk.openWin('Find', f, 420);
    setTimeout(() => f.querySelector('#fdq').focus(), 30);
    f.querySelector('button[type=button]').addEventListener('click', w.close);
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const q = f.querySelector('#fdq').value; if (!q) return;
      const found = window.find ? window.find(q, f.querySelector('#fdc').checked, f.querySelector('#fdu').checked, true, f.querySelector('#fdw').checked) : false;
      f.querySelector('#fdmsg').textContent = found ? '' : 'Finished searching the document.';
      if (!found) Sound.play('uhoh');
    });
  }
  function selectAll() { const r = document.createRange(); r.selectNodeContents($('pane')); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
  function copyLink() {
    const url = curUrl();
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => Desk.toast('Send Link', 'Link copied! Paste it into an e-mail to your mates.'), () => Desk.msgbox('Send Link', url, 'info'));
  }
  function synchronize() {
    const b = document.createElement('div');
    b.innerHTML = '<p style="margin:0 0 8px">Synchronizing offline web pages...</p><div class="prog"><span style="display:flex;gap:2px"></span></div><p id="syn" style="margin:8px 0 0;color:#444">Connecting to JackNet...</p>';
    const w = Desk.openWin('Synchronizing', b, 340);
    let i = 0; const steps = ['Connecting to JackNet...', 'Downloading index.htm', 'Downloading reviews.htm', 'Downloading cheats.htm', 'Done!'];
    const t = setInterval(() => { i++; b.querySelector('.prog span').appendChild(document.createElement('i')); b.querySelector('#syn').textContent = steps[Math.min(steps.length - 1, i >> 2)]; if (i >= 20) { clearInterval(t); setTimeout(w.close, 600); } }, 90);
  }
  function options() {
    const b = document.createElement('div');
    const tabs = ['General', 'Security', 'Content', 'Connections', 'Programs', 'Advanced'];
    const homeAddr = homeUrl() || urlOf(homeSec);
    const PAGES = {
      General: `<div class="group"><span class="lg">Home page</span><div class="row" style="flex-wrap:nowrap"><label>Address:</label><input type="text" id="ioHome" value="${esc(homeAddr)}" style="flex:1;min-width:0"></div><div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn" id="ioCur">Use Current</button><button class="btn" id="ioDef">Use Default</button><button class="btn" id="ioBlank">Use Blank</button></div></div>
        <div class="group"><span class="lg">Temporary Internet files</span><p style="margin:0 0 6px">Pages you view on the Internet are stored in a special folder for quick viewing later. (Including the demos you installed.)</p><div class="row" style="justify-content:flex-end"><button class="btn" id="ioDel">Delete Files...</button><button class="btn" disabled>Settings...</button></div></div>
        <div class="group"><span class="lg">History</span><div class="row"><label>Days to keep pages in history:</label><input type="text" value="20" style="width:40px"><button class="btn" id="ioClr" style="margin-left:auto">Clear History</button></div></div>`,
      Security: '<p>Select a Web content zone to specify its security settings.</p><div class="row" style="gap:16px;justify-content:center;margin:10px 0">' + ['Internet', 'Local intranet', 'Trusted sites', 'Restricted sites'].map(z => `<span style="text-align:center;width:64px">${PAGE_ICO.replace('<svg', '<svg style="width:32px;height:32px;display:block;margin:0 auto"')}${z}</span>`).join('') + '</div><div class="group"><span class="lg">Security level for this zone</span><b>Medium</b><br>- Safe browsing and still functional<br>- Prompts before downloading potentially unsafe content<br>- Gubbinz is watching</div>',
      Content: '<div class="group"><span class="lg">Content Advisor</span>Ratings help you control the Internet content that can be viewed on this computer.<div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn" id="ioCa">Enable...</button></div></div><div class="group"><span class="lg">Personal information</span>An online wallet? Never heard of it. Keep your pocket money in an actual wallet.</div>',
      Connections: '<div class="group"><span class="lg">Dial-up settings</span><div class="field" style="padding:4px">JackNet 56K (Default)</div><p style="margin:6px 0 0"><label><input type="radio" name="dial"> Never dial a connection</label><br><label><input type="radio" name="dial" checked> Dial whenever a network connection is not present</label><br><label><input type="radio" name="dial"> Always dial my default connection</label></p><p style="color:#c00;margin:6px 0 0">Get off the phone, Mom!</p></div>',
      Programs: '<div class="group"><span class="lg">Internet programs</span><table style="font:12px var(--ui)"><tr><td style="width:110px">HTML editor:</td><td><select><option>Notepad</option></select></td></tr><tr><td>E-mail:</td><td><select><option>JackMail Express</option></select></td></tr><tr><td>Newsgroups:</td><td><select><option>JackMail Express</option></select></td></tr><tr><td>Internet call:</td><td><select><option>NetMeeting</option></select></td></tr><tr><td>Calendar:</td><td><select><option>Jack\'s 1999 Calendar</option></select></td></tr></table></div>',
      Advanced: `<div class="field" style="height:180px;overflow:auto;padding:6px;line-height:1.7"><b>Multimedia</b><br><label><input type="checkbox" id="ioSnd" ${Sound.on ? 'checked' : ''}> Play sounds in web pages</label><br><label><input type="checkbox" id="ioAnim" ${document.body.classList.contains('noanim') ? '' : 'checked'}> Play animations in web pages</label><br><label><input type="checkbox" checked disabled> Show pictures</label><br><b>Browsing</b><br><label><input type="checkbox" id="ioPop" ${window.OldPC && OldPC.popupsOn ? 'checked' : ''}> Allow pop-up jackos (there's no blocker in 1999)</label><br><label><input type="checkbox" id="ioAd" ${window.OldPC && OldPC.adwareOn ? 'checked' : ''}> Let free toolbars install themselves</label><br><label><input type="checkbox" id="ioTips" ${store.get('jhp_tips', true) ? 'checked' : ''}> Show Tip of the Day at startup</label><br><label><input type="checkbox" checked disabled> Enable page transitions</label><br><label><input type="checkbox" checked disabled> Underline links: Always</label><br><b>Security</b><br><label><input type="checkbox" checked disabled> Warn if changing between secure and not secure mode</label></div>`,
    };
    b.innerHTML = `<div class="tabs" id="ioTabs">${tabs.map((t, i) => `<span data-t="${t}" class="${i ? '' : 'on'}" style="cursor:default">${t}</span>`).join('')}</div><div class="tabpage" id="ioPage"></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" id="ioOk" style="min-width:75px">OK</button><button class="btn" id="ioCancel" style="min-width:75px">Cancel</button><button class="btn" id="ioApply" style="min-width:75px">Apply</button></div>`;
    const w = Desk.openWin('Internet Options', b, 430);
    const page = b.querySelector('#ioPage');
    let pendingHome = homeSec, pendingUrl = homeUrl();
    const wire = () => {
      const q = id => page.querySelector('#' + id);
      if (q('ioCur')) q('ioCur').addEventListener('click', () => { pendingHome = current === 'error' || current === 'secret' ? homeSec : current; pendingUrl = current === 'secret' ? curUrl() : ''; q('ioHome').value = pendingUrl || urlOf(pendingHome); });
      if (q('ioDef')) q('ioDef').addEventListener('click', () => { pendingHome = 'home'; pendingUrl = ''; q('ioHome').value = urlOf('home'); });
      if (q('ioHome')) q('ioHome').addEventListener('change', e => { const v = e.target.value.trim(); pendingUrl = !v || v === urlOf(pendingHome) ? '' : v; });
      if (q('ioBlank')) q('ioBlank').addEventListener('click', () => { pendingHome = 'home'; pendingUrl = ''; q('ioHome').value = 'about:blank'; Desk.toast('Internet Options', "There's no such thing as a blank page on JACK ATTACK!. Using the default instead."); });
      if (q('ioDel')) q('ioDel').addEventListener('click', () => Desk.msgbox('Delete Files', 'Delete all files in the Temporary Internet Files folder? (This also gets rid of those free toolbars and cursors.)', 'q', [['OK', () => { ['jhp_toolbars', 'jhp_cursor', 'jhp_wall'].forEach(k => localStorage.removeItem(k)); Desk.toast('Internet Options', 'Temporary files deleted. Refresh to see it.'); }], ['Cancel']]));
      if (q('ioClr')) q('ioClr').addEventListener('click', () => Desk.msgbox('Internet Options', 'Are you sure you want JackNet Explorer to delete all items in your History folder?', 'q', [['Yes', () => { history99 = []; store.set('jhp_hist', []); back.length = 0; fwd.length = 0; typed = []; store.set('jhp_typed', []); buttons(); if (xbarMode === 'history') renderXbar(); }], ['No']]));
      if (q('ioCa')) q('ioCa').addEventListener('click', () => Desk.msgbox('Content Advisor', 'Content Advisor is already on. It is called Mom.', 'info'));
      if (q('ioSnd')) q('ioSnd').addEventListener('change', e => { Sound.on = e.target.checked; document.dispatchEvent(new Event('sfxchange')); });
      if (q('ioAnim')) q('ioAnim').addEventListener('change', e => document.body.classList.toggle('noanim', !e.target.checked));
      if (q('ioTips')) q('ioTips').addEventListener('change', e => store.set('jhp_tips', e.target.checked));
      if (q('ioPop')) q('ioPop').addEventListener('change', e => OldPC.setPopups(e.target.checked));
      if (q('ioAd')) q('ioAd').addEventListener('change', e => OldPC.setAdware(e.target.checked));
    };
    const showTab = t => { page.innerHTML = PAGES[t]; b.querySelectorAll('#ioTabs span').forEach(s => s.classList.toggle('on', s.dataset.t === t)); wire(); };
    b.querySelectorAll('#ioTabs span').forEach(s => s.addEventListener('click', () => showTab(s.dataset.t)));
    showTab('General');
    const apply = () => { homeSec = pendingHome; store.set('jhp_homepage', homeSec); store.set('jhp_homeurl', pendingUrl); };
    b.querySelector('#ioOk').addEventListener('click', () => { apply(); w.close(); });
    b.querySelector('#ioApply').addEventListener('click', apply);
    b.querySelector('#ioCancel').addEventListener('click', w.close);
  }
  function about() {
    const b = document.createElement('div');
    const who = Net.me && Net.me.member ? Net.me.nick : (Net.me && Net.me.nick) || 'Guest';
    b.innerHTML = `<div style="background:linear-gradient(120deg,#000080,#1084d0 70%,#7ec8ff);color:#fff;padding:14px;margin:-8px -8px 10px;display:flex;align-items:center;gap:12px">${window.JICON ? JICON.get('jacknet', 32).replace('width="32" height="32"', 'width="64" height="64"') : '<svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="18" fill="#2a7ad8" stroke="#fff"/><path d="M8 20c10-5 22-5 32 0M8 28c10 5 22 5 32 0M24 6v36" stroke="#9fd0ff" fill="none"/><ellipse cx="24" cy="24" rx="26" ry="9" fill="none" stroke="#ffd400" stroke-width="3" transform="rotate(-20 24 24)"/></svg>'}<div><div style="font:bold 22px Arial,sans-serif">JackNet Explorer <span style="font-size:30px">5</span></div><div style="font-size:11px">The best way to see JACK ATTACK! Online</div></div></div>
      <table style="font:12px var(--ui)"><tr><td style="width:110px">Version:</td><td>5.00.1999.0101</td></tr><tr><td>Cipher Strength:</td><td>128-bit</td></tr><tr><td>Product ID:</td><td>01999-OEM-0408199-00JAK</td></tr><tr><td>Update Versions:</td><td>; SP1; Y2K;</td></tr></table>
      <p style="font-size:11px;color:#444">Based on lots of late nights. Contains no actual JackNet Explorer.<br>Warning: This computer program is protected by Gubbinz.</p>
      <p style="margin:0">This product is licensed to:<br><b>${esc(who)}</b><br>JACK ATTACK! Readers</p>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" style="min-width:75px">OK</button><button class="btn">System Info...</button></div>`;
    const w = Desk.openWin('About JackNet Explorer', b, 380);
    const bs = b.querySelectorAll('.btn');
    bs[0].addEventListener('click', w.close);
    bs[1].addEventListener('click', () => Desk.msgbox('System Information', `Screen: ${screen.width} x ${screen.height} (that's bigger than 800x600!)\nColours: ${screen.colorDepth}-bit (High Color and then some)\nProcessors: ${navigator.hardwareConcurrency || 1} (we had ONE)\nMemory: more than 32MB, probably`, 'info'));
  }
  const TIPS = [
    'Press F11 (or View > Full Screen) to make it look like you are sat at the family PC.',
    'Right-click a page for more options, just like the real thing.',
    'Type a page name like "chat" or "cheats" in the Address bar and press Enter.',
    'Click the History button to see every page you looked at today.',
    'Add your favourite pages with Favorites > Add to Favorites.',
    'View > Text Size makes everything bigger. Good for Nan.',
    'There are secret cheats on the Cheats page. Up, up, down, down...',
    'Double-click the clock in the corner to see the calendar.',
    'Everything with a LIVE sign is shared with everyone on the site right now.',
    'File > Work Offline stops JackNet so Mom can use the phone.',
  ];
  function tip() { Desk.toast('Did you know...', TIPS[Math.floor(Math.random() * TIPS.length)], 8000); }
  function helpContents() {
    Desk.notepad('help.txt', `JACKNET EXPLORER HELP
=====================

KEYBOARD SHORTCUTS
  Alt+Left ........ Back
  Alt+Right ....... Forward
  Alt+Home ........ Home page
  Esc ............. Stop
  F11 ............. Full Screen
  Ctrl+D .......... Add to Favorites
  Ctrl+E .......... Search
  Ctrl+I .......... Favorites
  Ctrl+H .......... History

THE ADDRESS BAR
  Type the name of a page (home, demos, reviews, cheats, hobby,
  letters, chat...) and press Enter. Pages that don't exist
  "cannot be displayed". Just like the real 1999.

RIGHT-CLICK
  Right-click a page, the desktop or a title bar for its
  menu. Just like the real thing.

STILL STUCK?
  Write to Jack on the Letters page. He replies to everyone.
`);
  }

  // ================================================================ window: min / max / close / full screen
  function showBrowser() { browser.classList.remove('min'); $('taskBrowser').hidden = false; Desk.activate(browser); }
  function closeBrowser() { browser.classList.add('min'); $('taskBrowser').hidden = true; closeMenus(); }
  // the browser is one of the desktop's windows: clicking it brings it to the front (over other programs), and anything
  // that shows or hides it (packs just toggle the 'min' class) keeps its taskbar button and the active window right
  browser._task = $('taskBrowser');
  browser.addEventListener('pointerdown', () => { if (DesktopSurface.width() > 760 && !browser.classList.contains('min')) Desk.activate(browser); }, true);
  let wasMin = browser.classList.contains('min');
  new MutationObserver(() => {
    const m = browser.classList.contains('min');
    if (m === wasMin) return;
    wasMin = m;
    if (m) { closeMenus(); Desk.activateTop(); } else { $('taskBrowser').hidden = false; Desk.activate(browser); }
  }).observe(browser, { attributes: true, attributeFilter: ['class'] });
  // drag the window by its title bar, resize from the corner grip, and remember where it was left
  const canMove = () => !document.body.classList.contains('maxed') && DesktopSurface.width() > 760;
  function applyGeom() {
    const g = store.get('jhp_win', null);
    if (!g || !canMove()) { browser.style.left = browser.style.top = browser.style.width = browser.style.height = browser.style.bottom = ''; return; }
    const w = Math.min(g.w, DesktopSurface.width() - 20), h = Math.min(g.h, DesktopSurface.height() - 52);
    browser.style.width = w + 'px'; browser.style.height = h + 'px'; browser.style.bottom = 'auto';
    browser.style.left = Math.max(-w + 120, Math.min(DesktopSurface.width() - 120, g.l)) + 'px';
    browser.style.top = Math.max(0, Math.min(DesktopSurface.height() - 70, g.t)) + 'px';
  }
  function grab(ev, mode) {
    if (!canMove() || ev.button > 0 || ev.target.closest('button')) return;
    ev.preventDefault();
    const r = DesktopSurface.rect(browser), start = DesktopSurface.point(ev.clientX, ev.clientY);
    const startT = r.top - DesktopSurface.rect($('desktop')).top;
    const el = ev.currentTarget; el.setPointerCapture(ev.pointerId);
    const move = e => {
      const p = DesktopSurface.point(e.clientX, e.clientY), dx = p.x - start.x, dy = p.y - start.y;
      let g;
      if (mode === 'move') g = { l: r.left + dx, t: startT + dy, w: r.width, h: r.height };
      else { // resize from any edge or corner: mode is like 'se', 'w', 'n'...
        g = { l: r.left, t: startT, w: r.width, h: r.height };
        if (mode.includes('e')) g.w = Math.max(420, r.width + dx);
        if (mode.includes('s')) g.h = Math.max(300, r.height + dy);
        if (mode.includes('w')) { g.w = Math.max(420, r.width - dx); g.l = r.left + r.width - g.w; }
        if (mode.includes('n')) { g.h = Math.max(300, r.height - dy); g.t = startT + r.height - g.h; }
      }
      store.set('jhp_win', g); applyGeom();
    };
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); window.dispatchEvent(new Event('resize')); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  $('brTitleBar').addEventListener('pointerdown', ev => grab(ev, 'move'));
  $('sizeGrip').addEventListener('pointerdown', ev => grab(ev, 'se'));
  for (const d of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
    const h = document.createElement('div'); h.className = 'rz rz-' + d; h.setAttribute('aria-hidden', 'true');
    h.addEventListener('pointerdown', ev => grab(ev, d));
    browser.appendChild(h);
  }
  window.addEventListener('resize', applyGeom); // always: turning a phone back upright must drop the landscape size (applyGeom clears it when narrow)

  function setMax(on) {
    document.body.classList.toggle('maxed', on);
    applyGeom();
    $('brMax').innerHTML = on ? '&#10064;' : '&#9633;';
    $('brMax').setAttribute('aria-label', on ? 'Restore' : 'Maximise');
    store.set('jhp_max', on);
    window.dispatchEvent(new Event('resize'));
  }
  $('brMin').addEventListener('click', () => { browser.classList.add('min'); $('taskBrowser').classList.remove('on'); });  $('brMax').addEventListener('click', () => setMax(!document.body.classList.contains('maxed')));
  $('brClose').addEventListener('click', closeBrowser);
  $('brTitleBar').addEventListener('dblclick', ev => { if (!ev.target.closest('button')) setMax(!document.body.classList.contains('maxed')); });
  $('taskBrowser').addEventListener('click', () => { if (browser.classList.contains('min')) showBrowser(); else if (Desk.isActive(browser)) browser.classList.add('min'); else Desk.activate(browser); });
  $('iconIe').addEventListener('click', showBrowser);
  $('qlIe').addEventListener('click', showBrowser);
  // Quick Launch, laid out like the real 1998 one: browser, mail, Show Desktop (the desk blotter), View Channels
  (() => {
    const q = $('qlIe').parentElement, mail = $('qlMail'), desk = $('qlDesk');
    mail.title = 'Launch JackMail Express'; mail.setAttribute('aria-label', mail.title);
    desk.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true"><path fill="#000" d="M3 5h12v1H3zM2 6h1v1H2zM1 7h1v1H1zM0 8h1v4H0zM1 12h13v1H1zM14 6h1v6h-1zM15 5h1v1h-1z"/><path fill="#fff" d="M3 6h11v1H3zM2 7h12v1H2z"/><path fill="#d8d8d8" d="M1 8h13v4H1z"/><path fill="#1e6fd9" d="M2 9h5v2H2z"/><path fill="#808080" d="M8 9h5v1H8zM8 11h4v1H8z"/><path fill="#ffd400" d="M10 1h1v1h-1zM9 2h1v1H9zM8 3h1v1H8zM7 4h1v1H7z"/><path fill="#c08000" d="M11 1h1v1h-1zM10 2h1v1h-1zM9 3h1v1H9zM8 4h1v1H8z"/><path fill="#e10600" d="M11 0h1v1h-1zM12 1h1v1h-1z"/><path fill="#000" d="M6 5h1v1H6z"/></svg>';
    const chan = document.createElement('button'); chan.id = 'qlChan'; chan.title = 'View Channels'; chan.setAttribute('aria-label', chan.title);
    chan.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true"><path fill="#000" d="M2 2h1v1H2zM1 3h1v9H1zM2 12h1v1H2zM3 13h9v1H3zM12 12h1v1h-1zM13 3h1v9h-1zM3 1h9v1H3zM12 2h1v1h-1z"/><path fill="#1e6fd9" d="M2 3h11v9H2zM3 2h9v1H3zM3 12h9v1H3z"/><path fill="#ffd400" d="M5 4h5v1H5zM4 5h1v5H4zM10 5h1v1h-1zM5 10h5v1H5zM10 9h1v1h-1z"/><path fill="#fff" d="M7 6h3v1H7zM6 7h1v2H6zM7 9h3v1H7z"/><path fill="#e10600" d="M11 5h1v1h-1zM11 9h1v1h-1z"/></svg>';
    const end = q.querySelector('.grip:last-child'); [mail, desk, chan].forEach(b => q.insertBefore(b, end && end !== q.firstElementChild ? end : null));
    mail.addEventListener('click', () => { try { Sound.play('click'); } catch (e) {} if (!(window.Apps && Apps.open && Apps.open('outlook'))) { showBrowser(); go('letters', 'click'); } });
    chan.addEventListener('click', () => { showBrowser(); navigate('http://www.waaaghooo.find/'); if (window.Desk && Desk.toast) Desk.toast('Channels', 'Opening the Channel Guide... (it is just the biggest portal on the JackNet, but with a fancier name)', 3500); });
  })();
  let desktopShown = false, hidWins = [];
  $('qlDesk').addEventListener('click', () => {
    desktopShown = !desktopShown;
    browser.classList.toggle('min', desktopShown || $('taskBrowser').hidden);
    $('taskBrowser').classList.toggle('on', !desktopShown);
    document.querySelectorAll('.float').forEach(f => { f.style.display = desktopShown ? 'none' : ''; });
    if (desktopShown) { hidWins = [...document.querySelectorAll('.appwin')].filter(w => w.style.display !== 'none' && w.offsetWidth); hidWins.forEach(w => { const b = w.querySelector('[data-w=min]'); if (b) b.click(); else w.style.display = 'none'; }); }
    else { hidWins.forEach(w => { if (w.isConnected && w.style.display === 'none') { w.style.display = ''; } }); hidWins = []; }
    Desk.activateTop();
  });
  function fullScreen() {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    const el = document.documentElement;
    wasMax = document.body.classList.contains('maxed');
    (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).then(() => setMax(true)).catch(() => Desk.msgbox('Full Screen', "Your browser won't let this page go full screen. Try pressing F11 yourself!", 'warn'));
  }
  // leaving full screen puts the window back how it was, so the desktop comes back too
  let wasMax = null;
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) setMax(true);
    else if (wasMax !== null) { setMax(wasMax); wasMax = null; }
  });
  function toggleBand(cls) { browser.classList.toggle(cls); store.set('jhp_bands', ['no-std', 'no-addr', 'no-links', 'no-status'].filter(c => browser.classList.contains(c))); }
  function toggleOffline() {
    Net.setOffline(!Net.offline);
    show(current);
    Desk.toast('JackNet', Net.offline ? 'Working offline. Nobody else can see you, and you can\'t see them.' : 'Back online! Reconnecting to JackNet...');
  }

  // ================================================================ right-click menus
  document.addEventListener('contextmenu', ev => {
    const t = ev.target;
    if (window.Bridge && Bridge.pageMenu && !ev.defaultPrevented && Bridge.pageMenu(ev)) return; // links + pictures: bridge.js
    if (t.closest('canvas,input,textarea,select,.menu,.float,#taskbar')) return;
    if (t.closest('#page')) {
      ev.preventDefault();
      menu([
        { label: 'Back', dis: !back.length, act: () => goBack() }, { label: 'Forward', dis: !fwd.length, act: () => goFwd() }, '-',
        { label: 'Save Background As...', dis: true }, { label: 'Set as Wallpaper', act: wallpaper }, { label: 'Copy Background', dis: true }, '-',
        { label: 'Select All', act: selectAll }, { label: 'Paste', dis: true }, '-',
        { label: 'Create Shortcut', act: shortcut }, { label: 'Add to Favorites...', act: addFav }, { label: 'View Source', act: viewSource }, '-',
        { label: 'Encoding', sub: () => MENUS.view().find(i => i.label === 'Encoding').sub() }, '-',
        { label: 'Print', act: () => (window.Family && Family.printPage ? Family.printPage() : window.print()) }, { label: 'Refresh', act: refresh }, '-',
        { label: 'Properties', act: properties },
      ], ev.clientX, ev.clientY);
    } else if (t === $('desktop') || t.classList.contains('icons')) {
      ev.preventDefault();
      menu([
        { label: 'Active Desktop', sub: [{ label: 'View As Web Page', dis: true }, { label: 'Customize my Desktop...', act: () => deskProps() }] },
        '-', { label: 'Arrange Icons', sub: [{ label: 'by Name' }, { label: 'by Type' }, { label: 'by Size' }, { label: 'by Date' }, '-', { label: 'Auto Arrange', chk: true }] },
        { label: 'Line Up Icons' }, '-', { label: 'Refresh', act: () => location.reload() }, '-', { label: 'Paste', dis: true }, { label: 'Paste Shortcut', dis: true }, '-',
        { label: 'New', sub: [{ label: 'Folder', dis: true }, { label: 'Shortcut', act: () => { showBrowser(); shortcut(); } }, '-', { label: 'Text Document', act: () => Desk.notepad('New Text Document.txt', '') }] }, '-',
        { label: 'Properties', act: () => deskProps() },
      ], ev.clientX, ev.clientY);
    }
  });
  const WALLS = ['', 'linear-gradient(135deg,#2a0a6b,#e0157a 60%,#ff7a00)', 'repeating-linear-gradient(45deg,#008080 0 10px,#007070 10px 20px)', 'radial-gradient(circle at 30% 30%,#7ec8ff,#000080)'];
  // desktop properties live on the PC (Control Panel > Display), not on the website
  function deskProps() { if (window.Apps && Apps.run('desk.cpl')) return; Desk.msgbox('Display Properties', 'Display Properties is not installed on this computer.', 'warn'); }
  function wallpaper() {
    const i = (store.get('jhp_wall', 0) + 1) % WALLS.length; store.set('jhp_wall', i); applyWall();
    Desk.toast('Display Properties', i ? 'Wallpaper changed!' : 'Back to the classic look.');
  }
  function applyWall() { const w = WALLS[store.get('jhp_wall', 0)]; $('desktop').style.background = w || ''; }

  // ================================================================ keyboard
  document.addEventListener('keydown', ev => {
    const typing = ev.target.closest && ev.target.closest('input,textarea,select,#tris');
    if (ev.key === 'Escape') { if (openMenus.length) { closeMenus(); return; } if (!typing) stop(); }
    if (ev.altKey && ev.key === 'ArrowLeft') { ev.preventDefault(); goBack(); }
    else if (ev.altKey && ev.key === 'ArrowRight') { ev.preventDefault(); goFwd(); }
    else if (ev.altKey && ev.key === 'Home') { ev.preventDefault(); goHome(); }
    else if (ev.key === 'F11') { ev.preventDefault(); fullScreen(); }
    else if (ev.ctrlKey && !ev.shiftKey && !typing) {
      const k = ev.key.toLowerCase();
      if (k === 'd') { ev.preventDefault(); addFav(); }
      else if (k === 'e') { ev.preventDefault(); xbar('search'); }
      else if (k === 'i') { ev.preventDefault(); xbar('favorites'); }
      else if (k === 'h') { ev.preventDefault(); xbar('history'); }
    }
    if (ev.key === 'Alt') document.body.classList.add('alt');
  });
  document.addEventListener('keyup', ev => { if (ev.key === 'Alt') document.body.classList.remove('alt'); });

  // ================================================================ start up
  store.get('jhp_bands', []).forEach(c => browser.classList.add(c));
  if (store.get('jhp_max', false)) setMax(true);
  applyWall(); renderShortcuts(); applyGeom();
  if (!browser.classList.contains('min')) Desk.activate(browser);
  window.IE = { go, navigate, menu, addPage, showPage, addSite, showSite, aliasSite, legacyHost, closeMenus, get current() { return current; }, get sites() { return SITES; }, get pages() { return PAGES; } };
  const first = decodeURIComponent((location.hash || '').slice(1));
  if (/^members\/./.test(first)) { go('members', 'hist'); setTimeout(() => window.Community && Community.openProfile(first.slice(8)), 0); }
  else go(secs.some(s => s.dataset.sec === first && first !== 'error') ? first : homeSec, 'hist');
  if (!first && homeUrl()) window.addEventListener('load', () => { if (current !== homeSec) return; navigate(homeUrl()); back.length = 0; buttons(); }); // the home page is out on the web
  if (store.get('jhp_tips', true)) (window.BootDone || Promise.resolve()).then(() => setTimeout(() => { if (!document.querySelector('.logon')) tip(); }, 9000));
})();
