/* bridge: JackNet Explorer and the PC talk to each other, like IE5 and JackOS 98 did.
 *  - right-click a picture on any web page: Save Picture As (into My Pictures, opens in Paint), Set as Wallpaper,
 *    Set as Desktop Item, Copy, E-mail Picture, Properties. Right-click a link: Open, Open in New Window,
 *    Save Target As (a File Download into My Downloads), Copy Shortcut, Add to Favorites, Send To > Desktop.
 *  - drag a link, a picture or the little page icon in the Address bar onto the desktop: an Internet Shortcut.
 *  - File > Save As saves the page into My Documents ("Title.htm" + "Title_files"); open it again from My Computer.
 *  - File > Work Offline / hanging up the modem (tray icon): pages you've seen come from Temporary Internet Files,
 *    the rest are "not available offline".
 *  - "Make this my home page!" links, "Add to Active Desktop" buttons (live desktop items), cookies, and pages that
 *    "know" your PC (your name, your screen, your last visit, whether you've got JackAmp...).
 * Everything is kept in jhp_bridge_* keys (plus Paint's jhp_prog_pics and the jhp_prog_wall wallpaper), so it roams
 * with a JackNet member's profile. ie.js calls Bridge.pageMenu / saveAs / toggleOffline / shortcut / addFav. */
(function () {
  const A = window.Apps;
  if (!A || !window.IE || !window.Desk) return;
  const esc = A.esc, store = A.store, $ = id => document.getElementById(id);
  const qs = (r, s) => r.querySelector(s), qsa = (r, s) => [...r.querySelectorAll(s)];
  const get = (k, d) => store.get('jhp_bridge_' + k, d), put = (k, v) => store.set('jhp_bridge_' + k, v);
  const S = id => A.secret('br.' + id);
  const toast = (t, x, ms) => Desk.toast(t, x, ms), msg = (t, x, i, b) => Desk.msgbox(t, x, i, b);
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const pad = n => String(n).padStart(2, '0');
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // real timestamps -> the same day and month in 1999 (the PC is stuck in 1999)
  const in99 = ts => { const d = new Date(ts); let m = d.getMonth() + 1, dd = d.getDate(); if (m === 2 && dd === 29) dd = 28; return new Date(1999, m - 1, dd, d.getHours(), d.getMinutes()); };
  const d99 = ts => { const x = ts ? in99(ts) : Desk.today99().date; return pad(x.getDate()) + '/' + pad(x.getMonth() + 1) + '/99'; };
  const long99 = ts => { const x = in99(ts); return `${DAYS[x.getDay()]} ${x.getDate()} ${MONTHS[x.getMonth()]} 1999`; };
  const hm = ts => { const d = new Date(ts); return d.getHours() + ':' + pad(d.getMinutes()); };
  const JI = (n, s, o) => window.JICON ? JICON.get(n, s || 32, o) : (A.ICON[n] || A.ICON.app);
  const big = svg => `<span class="br-i32">${svg}</span>`, small = svg => `<span class="br-i16">${svg}</span>`;
  const nick = () => (window.Net && Net.me && Net.me.member && Net.me.nick) || '';
  const who = () => nick() || (window.Net && Net.me && Net.me.nick) || 'Guest';
  const cookieUser = () => (nick() || 'guest').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 16) || 'guest';
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const cleanName = s => String(s || '').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 48);
  const touchy = () => matchMedia('(hover:none)').matches;

  // ================================================================ secrets
  A.defineSecret('br.savepic', 'Picture snatcher', 'Right-click a picture on a web page. Keep it forever');
  A.defineSecret('br.wallpaper', 'Interior decorator', 'Some pictures on the web would look great behind your icons');
  A.defineSecret('br.drag', 'Drag and drop', 'Things on web pages can be dragged right out of the browser');
  A.defineSecret('br.homepage', 'Hijacked!', 'Let a web site take over your Home button');
  A.defineSecret('br.activedesk', 'Active Desktop', 'Put something live from the web on your desktop');
  A.defineSecret('br.offline', 'Unplugged', 'Mom needs the phone. Try surfing somewhere new anyway');
  A.defineSecret('br.savedpage', 'Offline reader', 'Save a web page to the hard disk, then open it again from My Computer');
  A.defineSecret('br.cookie', 'Cookie monster', 'Web sites leave crumbs on your computer. Find one');
  A.defineSecret('br.skin', 'Skinned', 'Give JackAmp a new look, straight off the web');

  // ================================================================ addresses
  const MAIN = 'www.jackattack.jnet';
  const norm = u => String(u || '').toLowerCase().trim().replace(/^\w+:\/\//, '').replace(/^www\./, '').replace(/#.*$/, '').replace(/\/(index\.html?)?$/, '').replace(/\/$/, '');
  const hostOf = u => String(u || '').replace(/^\w+:\/\//, '').split(/[/?#]/)[0].toLowerCase();
  const secFile = sec => { const el = qs(document, `.sec[data-sec="${sec}"]`); return (el && el.dataset.file) || sec + '.htm'; };
  const secUrl = sec => 'http://' + MAIN + '/' + (sec === 'home' ? '' : secFile(sec));
  let viewing = null; // a saved page being shown from the hard disk: { rec, path }
  const curUrl = () => viewing ? viewing.rec.u : ($('addrBar').value || secUrl('home'));
  const curTitle = () => viewing ? viewing.rec.t : (document.title || 'Untitled');
  function linkUrl(a) {
    const h = a.getAttribute('href') || '';
    if (/^(https?|ftp):\/\//i.test(h) || /^mailto:/i.test(h)) return h;
    if (a.dataset.go || a.dataset.wgo) return secUrl(a.dataset.go || a.dataset.wgo);
    if (a.dataset.wmail) return 'mailto:' + a.dataset.wmail + '@jackmail.webcom';
    const wp = a.dataset.wp;
    if (wp === '?') return 'http://www.biscuitring.webcom/cgi-bin/random.cgi';
    if (wp) return window.WebPack && WebPack.urlOfWord ? WebPack.urlOfWord(wp) : 'http://' + MAIN + '/' + wp;
    if (/^#\w/.test(h)) return curUrl().split('#')[0] + h;
    return 'javascript:void(0)';
  }
  const linkTitle = a => ((a.getAttribute('title') || a.textContent || '').replace(/\s+/g, ' ').trim() || hostOf(linkUrl(a)) || 'Link').slice(0, 48);
  const LINKS = 'a[href], [data-wp], [data-wgo], [data-go]:not(.mbtn):not(button)';
  function showBrowser() { const br = $('browser'); br.classList.remove('min'); const tb = $('taskBrowser'); if (tb) tb.hidden = false; Desk.activate(br); }
  function openUrl(u) {
    if (/^javascript:/i.test(u)) return;
    if (/^mailto:/i.test(u)) { const to = u.slice(7).split('?')[0]; return window.JackFiles && JackFiles.compose ? JackFiles.compose({ to }) : msg('Outlook Express', 'Outlook Express is not installed.', 'warn'); }
    showBrowser(); IE.navigate(u);
  }
  function copyText(t, what) {
    const ok = () => toast('Copy', `${what} copied to the Clipboard. Paste it into an e-mail to your mates.`);
    (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).then(ok, () => msg('Copy', t, 'info'));
  }

  // ================================================================ pictures: find one, draw it on a canvas
  const PIC_MAX_W = 480, PIC_MAX_H = 320; // Paint's canvas size (and nice and small for the roaming profile)
  function pictureAt(t) {
    const page = $('page'); if (!t || !t.closest || !page || !page.contains(t)) return null;
    const ic = t.closest('img,canvas'); if (ic) { const r = ic.getBoundingClientRect(); return r.width >= 12 && r.height >= 12 ? ic : null; }
    let svg = t.closest('svg');
    if (svg) { let up; while ((up = svg.parentElement && svg.parentElement.closest('svg'))) svg = up; const r = svg.getBoundingClientRect(); if (r.width >= 16 && r.height >= 16) return svg; return null; }
    let e = t;
    for (let i = 0; i < 4 && e && e !== page && !e.classList.contains('sec') && !e.classList.contains('wpg'); i++, e = e.parentElement) {
      if (/^(A|BUTTON|INPUT|TEXTAREA|SELECT|LABEL|MAIN|SECTION|BODY|UL|OL|TABLE|FORM)$/.test(e.tagName)) return null;
      const cs = getComputedStyle(e); if (cs.backgroundImage === 'none') continue;
      const r = e.getBoundingClientRect();
      if (r.width >= 20 && r.height >= 20 && r.width <= 640 && r.height <= 480 && (e.textContent || '').trim().length < 120) return e;
    }
    return null;
  }
  function picName(el) {
    const tl = el.querySelector && el.querySelector(':scope > title');
    let n = el.getAttribute('alt') || el.getAttribute('aria-label') || el.getAttribute('title') || (tl && tl.textContent) || '';
    if (!n) { const cls = (typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '').split(/\s+/).filter(x => x && x.length > 2 && !/^(on|sel|small|big|jd|h48)$/.test(x)); n = cls.length ? cls[cls.length - 1] : el.tagName === 'CANVAS' ? 'snapshot' : 'image'; }
    n = String(n).toLowerCase().replace(/^[a-z]{1,3}-/, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20);
    return n || 'image';
  }
  function bgBehind(el) {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      if (c && c !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(c)) return c;
    }
    return '#ffffff';
  }
  const SVG_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'visibility', 'display', 'color', 'fill-rule'];
  function svgMarkup(svg, w, h) {
    const clone = svg.cloneNode(true), src = [svg, ...svg.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
    src.slice(0, 3000).forEach((s, i) => { const d = dst[i]; if (!d || !d.setAttribute) return; const cs = getComputedStyle(s); d.setAttribute('style', SVG_PROPS.map(p => `${p}:${cs.getPropertyValue(p)}`).join(';')); });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
    clone.setAttribute('width', w); clone.setAttribute('height', h);
    return new XMLSerializer().serializeToString(clone);
  }
  function htmlMarkup(el, w, h) {
    const clone = el.cloneNode(true), src = [el, ...el.querySelectorAll('*')].slice(0, 300), dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((s, i) => { const d = dst[i]; if (!d || !d.setAttribute) return; const cs = getComputedStyle(s); let css = ''; for (let j = 0; j < cs.length; j++) css += `${cs[j]}:${cs.getPropertyValue(cs[j])};`; d.setAttribute('style', css); });
    Object.assign(clone.style, { margin: '0', position: 'static', transform: 'none', left: 'auto', top: 'auto', width: w + 'px', height: h + 'px', boxSizing: 'border-box' });
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="${w}" height="${h}">${new XMLSerializer().serializeToString(clone)}</foreignObject></svg>`;
  }
  const svgImage = markup => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('bad picture')); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup); });
  function fit(w, h) { const s = Math.min(1, PIC_MAX_W / w, PIC_MAX_H / h); return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))]; }
  // a "sensible pixel snapshot" when the real thing can't be drawn: the picture's colours, a frame and a little landscape
  function placeholder(el, w, h, label) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    x.fillStyle = bgBehind(el); x.fillRect(0, 0, w, h);
    x.strokeStyle = '#808080'; x.strokeRect(0.5, 0.5, w - 1, h - 1);
    x.fillStyle = '#2a9a2a'; x.beginPath(); x.moveTo(w * 0.1, h * 0.85); x.lineTo(w * 0.35, h * 0.45); x.lineTo(w * 0.55, h * 0.7); x.lineTo(w * 0.7, h * 0.55); x.lineTo(w * 0.9, h * 0.85); x.fill();
    x.fillStyle = '#ffd400'; x.beginPath(); x.arc(w * 0.72, h * 0.28, Math.min(w, h) * 0.1, 0, 7); x.fill();
    x.fillStyle = '#000'; x.font = '10px Tahoma, sans-serif'; x.fillText(String(label || '').slice(0, 30), 4, 12);
    return c;
  }
  async function renderPicture(el) {
    const r = el.getBoundingClientRect(), name = picName(el);
    let sw = Math.max(1, Math.round(r.width)), sh = Math.max(1, Math.round(r.height)), draw = null, pixel = false;
    try {
      if (el.tagName === 'CANVAS') { if (el.width >= sw) { sw = el.width; sh = el.height; } pixel = true; draw = (x, w, h) => x.drawImage(el, 0, 0, w, h); } // little pixel canvases are saved the size they look
      else if (el.tagName === 'IMG') { sw = el.naturalWidth || sw; sh = el.naturalHeight || sh; draw = (x, w, h) => x.drawImage(el, 0, 0, w, h); }
      else { const im = await svgImage(el instanceof SVGElement ? svgMarkup(el, sw, sh) : htmlMarkup(el, sw, sh)); draw = (x, w, h) => x.drawImage(im, 0, 0, w, h); }
      const [w, h] = fit(sw, sh);
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      x.imageSmoothingEnabled = !pixel; x.fillStyle = bgBehind(el); x.fillRect(0, 0, w, h);
      draw(x, w, h);
      return { url: c.toDataURL('image/png'), w, h, canvas: c, name, real: true };
    } catch (e) {
      const [w, h] = fit(sw, sh), c = placeholder(el, w, h, name);
      return { url: c.toDataURL('image/png'), w, h, canvas: c, name, real: false };
    }
  }
  // pictures are kept where Paint keeps its pictures, so My Pictures shows them and Paint opens them
  function savePic(name, url) {
    let list = store.get('jhp_prog_pics', []); if (!Array.isArray(list)) list = [];
    list = list.filter(p => p && p.name !== name); list.unshift({ name, data: url, date: d99() });
    while (list.length > 15) list.pop();
    let ok = false;
    while (!ok && list.length) { try { localStorage.setItem('jhp_prog_pics', JSON.stringify(list)); ok = true; } catch (e) { list.pop(); } }
    if (!ok || !list.some(p => p.name === name)) return false;
    const dir = A.fs.dir('C:/My Documents/My Pictures');
    dir.kids = dir.kids.filter(k => !(k.painted && k.name.toLowerCase() === name.toLowerCase()));
    dir.kids.push({ name, type: 'png', dataURL: url, date: d99(), size: Math.max(1, Math.round(url.length * 0.75 / 1024)) + ' KB', painted: true });
    return true;
  }
  const picData = name => { const p = (store.get('jhp_prog_pics', []) || []).find(x => x && x.name === name); return p ? p.data : null; };
  function uniquePic(base, ext) { const names = (store.get('jhp_prog_pics', []) || []).map(p => p && p.name); let n = base + ext, i = 2; while (names.includes(n)) n = `${base}${i++}${ext}`; return n; }

  // ================================================================ a JackOS 98 "Save As" box (a real window on the desktop)
  const PLACES = { pics: ['My Pictures', 'C:/My Documents/My Pictures'], docs: ['My Documents', 'C:/My Documents'], dl: ['My Downloads', 'C:/My Documents/My Downloads'], desk: ['Desktop', 'C:/JACKOS/Desktop'] };
  function saveDialog(o) {
    const b = document.createElement('form'); b.className = 'br-sv';
    b.innerHTML = `<div class="row br-sv-top"><label>Save <u>i</u>n:</label><select class="br-in">${o.places.map((p, i) => `<option value="${i}">${esc(PLACES[p][0])}</option>`).join('')}</select><button type="button" class="btn br-up" title="Up One Level" aria-label="Up One Level">&#8679;</button></div>
      <div class="field br-list" role="listbox"></div>
      <div class="br-sv-grid"><label for="brFn${o.id = uid()}">File <u>n</u>ame:</label><input type="text" id="brFn${o.id}" class="br-fn" autocomplete="off" spellcheck="false"><button class="btn" type="submit">Save</button>
      <label>Save as <u>t</u>ype:</label><select class="br-ty">${o.types.map((t, i) => `<option value="${i}">${esc(t[0])}</option>`).join('')}</select><button class="btn br-cancel" type="button">Cancel</button></div>`;
    const w = A.win(o.title, b, { w: 430, icon: o.icon || JI('folderOpen', 16), noResize: true, noMax: true, noMin: true, escClose: true });
    const fn = qs(b, '.br-fn'), sel = qs(b, '.br-in'), ty = qs(b, '.br-ty'), list = qs(b, '.br-list');
    fn.value = o.name; ty.value = String(o.type || 0);
    const place = () => PLACES[o.places[+sel.value]][1];
    const draw = () => {
      const d = A.fs.dir(place()), kids = (d.kids || []).filter(k => !k.hidden).sort((x, y) => (x.type === 'dir' ? 0 : 1) - (y.type === 'dir' ? 0 : 1) || x.name.localeCompare(y.name));
      list.innerHTML = kids.length ? kids.slice(0, 60).map((k, i) => `<button type="button" class="br-li" data-i="${i}">${small(k.type === 'dir' ? JI('folder', 16) : k.type === 'png' ? JI('bmp', 16) : k.type === 'lnk' ? JI('url', 16) : k.type === 'htm' ? JI('webpage', 16) : JI('txt', 16))}<span>${esc(k.name)}</span></button>`).join('') : '<div class="br-empty">(This folder is empty)</div>';
      qsa(list, '.br-li').forEach(e => e.addEventListener('click', () => { const k = kids[+e.dataset.i]; qsa(list, '.br-li').forEach(x => x.classList.toggle('sel', x === e)); if (k.type !== 'dir') fn.value = k.name.replace(/\.[a-z0-9]{2,4}$/i, ''); }));
    };
    sel.addEventListener('change', draw); draw();
    qs(b, '.br-up').addEventListener('click', () => toast('Save As', 'You can only save in the folders on the list. Jack set it up that way after Dave saved his homework into C:\\JACKOS\\SYSTEM.'));
    qs(b, '.br-cancel').addEventListener('click', w.close);
    setTimeout(() => { fn.focus(); fn.select(); }, 40);
    b.addEventListener('submit', ev => {
      ev.preventDefault();
      let name = cleanName(fn.value); if (!name) return msg(o.title, 'Please type a file name.', 'warn');
      const ext = o.types[+ty.value][1];
      if (ext && !/\.[a-z0-9]{2,4}$/i.test(name)) name += ext;
      const path = place(), dir = A.fs.dir(path), clash = (dir.kids || []).find(k => k.name.toLowerCase() === name.toLowerCase());
      const done = () => { w.close(); o.onSave(name, o.places[+sel.value], +ty.value, path); };
      if (clash && clash.type === 'dir') return msg(o.title, `${name} is a folder. Pick another name.`, 'warn');
      if (clash && !clash.painted && !clash.br) return msg(o.title, `${name} is read-only. Jack made it and he says no.\n\nPick another name.`, 'warn');
      if (clash) return msg('Save As', `${name} already exists.\nDo you want to replace it?`, 'warn', [['Yes', done], ['No']]);
      done();
    });
    return w;
  }

  // ================================================================ File Download + the "copying" progress window
  function progressWin(file, host, kb, to, done) {
    const b = document.createElement('div'); b.className = 'br-dl';
    b.innerHTML = `<div class="br-dl-anim"><span class="a l">${big(JI('jacknet', 32))}</span><span class="a r">${big(JI('folderOpen', 32))}</span><span class="pp"></span><span class="pp"></span><span class="pp"></span></div>
      <div class="br-dl-st">Saving:</div><div class="br-ell">${esc(file)} from ${esc(host)}</div><div class="prog" style="margin:6px 0"><span style="display:flex;gap:2px"></span></div>
      <div class="br-dl-grid"><span>Estimated time left:</span><span class="br-dl-left">Not known (opening the line...)</span><span>Download to:</span><span class="br-ell">${esc(to)}</span><span>Transfer rate:</span><span class="br-dl-rate">0 KB/Sec</span></div>
      <div class="row" style="justify-content:flex-end;gap:6px;margin-top:8px"><button class="btn" type="button" data-d="open" disabled>Open</button><button class="btn" type="button" data-d="folder" disabled>Open Folder</button><button class="btn" type="button" data-d="cancel">Cancel</button></div>`;
    const w = A.win('0% of ' + file + ' Completed', b, { w: 360, icon: JI('jacknet', 16), noResize: true, noMax: true });
    const bar = qs(b, '.prog span'), maxN = 26; let got = 0, n = 0;
    const dur = Math.min(4200, 1400 + kb * 60);
    sfx('modem');
    const t0 = performance.now();
    const iv = setInterval(() => {
      if (w.closed) return clearInterval(iv);
      const f = Math.min(1, (performance.now() - t0) / dur); got = kb * f;
      while (n < Math.round(f * maxN)) { bar.appendChild(document.createElement('i')); n++; }
      w.setTitle(Math.floor(f * 100) + '% of ' + file + ' Completed');
      const rate = (3.2 + Math.random() * 2.1);
      qs(b, '.br-dl-rate').textContent = rate.toFixed(1) + ' KB/Sec';
      qs(b, '.br-dl-left').textContent = `${Math.max(0, Math.ceil((kb - got) / rate))} sec (${Math.floor(got)} KB of ${kb} KB copied)`;
      if (f >= 1) {
        clearInterval(iv); b.classList.add('done');
        qs(b, '.br-dl-st').textContent = 'Download complete:'; w.setTitle('Download complete'); sfx('join');
        qs(b, '.br-dl-left').textContent = `${kb} KB downloaded in ${Math.round(dur / 1000)} sec`;
        qsa(b, '[data-d]').forEach(x => { x.disabled = false; }); qs(b, '[data-d=cancel]').textContent = 'Close';
        done(w, b);
      }
    }, 110);
    qs(b, '[data-d=cancel]').addEventListener('click', () => { clearInterval(iv); w.close(); });
    return w;
  }
  function fileDownload(file, host, onSave, onOpen) {
    const b = document.createElement('form');
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${big(JI('jacknet', 32))}<div style="flex:1;min-width:0"><p style="margin:0 0 8px">You have chosen to download a file from this location.</p><p class="br-ell" style="margin:0 0 8px"><b>${esc(file)}</b> from ${esc(host)}</p><p style="margin:0 0 4px">What would you like to do with this file?</p>
      <label class="br-rad"><input type="radio" name="brdm" value="open"> Open this file from its current location</label><label class="br-rad"><input type="radio" name="brdm" value="save" checked> Save this file to disk</label><hr><label class="br-rad"><input type="checkbox" checked disabled> Always ask before opening this type of file</label></div></div>
      <div class="row" style="justify-content:flex-end;gap:6px;margin-top:8px"><button class="btn" type="submit" style="min-width:72px">OK</button><button class="btn" type="button" data-x="c" style="min-width:72px">Cancel</button><button class="btn" type="button" data-x="i">More Info</button></div>`;
    const w = A.win('File Download', b, { w: 380, icon: JI('jacknet', 16), noResize: true, noMax: true, noMin: true, escClose: true });
    qs(b, '[data-x=c]').addEventListener('click', w.close);
    qs(b, '[data-x=i]').addEventListener('click', () => msg('Authenticode', `${file}\n\nThis is a web page. Web pages can't hurt your computer. (Unless it's Dave's. His has a MIDI that plays forever.)`, 'info'));
    b.addEventListener('submit', ev => { ev.preventDefault(); const m = qs(b, 'input[name=brdm]:checked').value; w.close(); if (m === 'open') onOpen(); else onSave(); });
    return w;
  }

  // ================================================================ desktop icons: Internet shortcuts, pictures and saved pages
  // jhp_bridge_desk = [{ id, k: 'url'|'pic'|'page', n: label, u?: url, p?: picture name, r?: saved page id }]
  let DESK = get('desk', []); if (!Array.isArray(DESK)) DESK = [];
  const DESKDIR = 'C:/JACKOS/Desktop';
  const deskBtns = new Map();
  const deskIco = it => it.k === 'url' ? JI('url', 32, { lnk: true }) : it.k === 'pic' ? JI('bmp', 32) : JI('webpage', 32);
  function deskOpen(it) {
    if (it.k === 'url') return openUrl(it.u);
    if (it.k === 'pic') { const n = A.fs.get('C:/My Documents/My Pictures/' + it.p); if (!n) return msg(it.n, `Cannot find 'C:\\My Documents\\My Pictures\\${it.p}'.\n\nThe picture this shortcut points to has been deleted. (Paint only keeps 15 pictures. Blame Paint.)`, 'warn'); return A.openFile(n); }
    const rec = PAGES.find(p => p.id === it.r); if (!rec) return msg(it.n, 'This web page has been deleted.', 'warn');
    openSaved(rec);
  }
  function deskNode(it) {
    if (it.k === 'url') A.fs.add(DESKDIR, { name: it.n + '.url', type: 'lnk', web: it.u, date: d99(it.ts), size: '1 KB', br: it.id });
    else if (it.k === 'pic') { const d = picData(it.p); if (d) A.fs.add(DESKDIR, { name: it.p, type: 'png', dataURL: d, date: d99(it.ts), size: Math.max(1, Math.round(d.length * 0.75 / 1024)) + ' KB', br: it.id }); }
  }
  function deskUnNode(it) { const d = A.fs.get(DESKDIR); if (d) d.kids = (d.kids || []).filter(k => k.br !== it.id); }
  function deskRender(it) {
    const b = A.desktopIcon(it.n, deskIco(it), () => deskOpen(it));
    b.classList.add('br-dicon'); b.dataset.br = it.id; b.title = it.k === 'url' ? it.u : it.n;
    b.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); qsa(document, '.dicon.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); IE.menu(deskMenu(it), ev.clientX, ev.clientY); });
    b.addEventListener('keydown', ev => { if (ev.key === 'Delete') deskDel(it); else if (ev.key === 'F2') deskRename(it); });
    deskBtns.set(it.id, b); deskNode(it);
    return b;
  }
  function deskAdd(it) {
    let n = cleanName(it.n) || 'Shortcut', i = 2; const base = n;
    while (DESK.some(d => d.n.toLowerCase() === n.toLowerCase())) n = `${base} (${i++})`;
    Object.assign(it, { id: 'd' + uid(), n, ts: Date.now() });
    DESK.push(it); put('desk', DESK);
    const b = deskRender(it);
    qsa(document, '.dicon.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel', 'br-new'); setTimeout(() => b.classList.remove('br-new'), 1200);
    sfx('click');
    return b;
  }
  function deskDel(it) {
    msg('Confirm File Delete', `Are you sure you want to send '${it.n}' to the Recycle Bin?`, 'q', [['Yes', () => {
      DESK = DESK.filter(d => d.id !== it.id); put('desk', DESK);
      const b = deskBtns.get(it.id); if (b) b.remove(); deskBtns.delete(it.id); deskUnNode(it);
      sfx('thud');
    }], ['No']]);
  }
  function deskRename(it) {
    Desk.ask('Rename', 'New name:', it.n, 40, v => {
      v = cleanName(v); if (!v || v === it.n) return;
      if (DESK.some(d => d !== it && d.n.toLowerCase() === v.toLowerCase())) return msg('Error Renaming File', `Cannot rename ${it.n}: A file with the name you specified already exists.`, 'warn');
      deskUnNode(it); it.n = v; put('desk', DESK); deskNode(it);
      const b = deskBtns.get(it.id); if (b) { const s = qs(b, 'span'); if (s) s.textContent = v; }
    });
  }
  function deskProps(it) {
    const b = document.createElement('div'); const t = in99(it.ts || Date.now());
    const kind = it.k === 'url' ? 'Internet Shortcut' : it.k === 'pic' ? 'Bitmap Image' : 'HTML Document';
    b.innerHTML = `<div class="tabs"><span class="on">General</span>${it.k === 'url' ? '<span>Internet Shortcut</span>' : ''}</div><div class="tabpage"><div class="row" style="flex-wrap:nowrap;gap:10px">${big(deskIco(it))}<b class="br-ell">${esc(it.n)}</b></div><hr>
      <table class="br-kv"><tr><td>Type:</td><td>${kind}</td></tr><tr><td>Location:</td><td>C:\\JACKOS\\Desktop</td></tr>${it.k === 'url' ? `<tr><td>Target URL:</td><td><input type="text" readonly value="${esc(it.u)}" style="width:100%"></td></tr><tr><td>Shortcut key:</td><td>None</td></tr>` : ''}<tr><td>Created:</td><td>${DAYS[t.getDay()]}, ${t.getDate()} ${MONTHS[t.getMonth()]} 1999, ${hm(it.ts || Date.now())}</td></tr></table></div>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" style="min-width:72px">OK</button></div>`;
    const w = Desk.openWin(it.n + ' Properties', b, 360); qs(b, '.btn').addEventListener('click', w.close);
  }
  function deskMenu(it) {
    return [
      { label: 'Open', act: () => deskOpen(it) },
      ...(it.k === 'pic' ? [{ label: 'Edit', act: () => deskOpen(it) }, { label: 'Set as Wallpaper', act: () => { const d = picData(it.p); if (d) { const im = new Image(); im.onload = () => setWallpaper(d, im.width, im.height); im.src = d; } } }] : []),
      '-',
      { label: 'Send To', sub: [{ label: 'Mail Recipient', act: () => mailIt(it.n, it.k === 'url' ? `Look at this!!!\n\n${it.u}\n` : `Here it is!\n`, it.k === 'url' ? [] : [{ name: it.p || it.n }]) }, { label: '3\u00bd Floppy (A:)', act: () => msg('Copying...', 'A:\\ is not accessible.\n\nThe device is not ready. (The floppy in there is Dave\'s DOOM disk. It is always in there.)', 'warn') }] },
      '-', { label: 'Cut', dis: true }, { label: 'Copy', act: () => copyText(it.k === 'url' ? it.u : it.n, it.k === 'url' ? 'Shortcut' : 'File name') }, '-',
      { label: 'Delete', act: () => deskDel(it) }, { label: 'Rename', act: () => deskRename(it) }, '-',
      { label: 'Properties', act: () => deskProps(it) },
    ];
  }
  function deskShortcut(u, title) {
    if (!u || /^javascript:/i.test(u)) return toast('Create Shortcut', "That link doesn't actually go anywhere. It's one of those JavaScript ones.");
    deskAdd({ k: 'url', u, n: title || hostOf(u) });
    toast('Desktop', `Shortcut to "${title || u}" created on the desktop.`);
  }

  // ================================================================ the desktop accepts drops from the web page
  let dragging = null; // { k: 'url', u, n } | { k: 'pic', el }
  const overDesk = t => !!(t && t.closest && t.closest('#desktop') && !t.closest('#browser, .float, .sys-chan, .br-ad'));
  document.addEventListener('dragstart', ev => {
    const t = ev.target; if (!t || !t.closest) return;
    if (t.closest('.br-pgdrag')) dragging = { k: 'url', u: curUrl(), n: curTitle() };
    else if (t.closest('#page')) {
      const a = t.closest(LINKS), img = t.tagName === 'IMG' ? t : null;
      if (img && !a) dragging = { k: 'pic', el: img };
      else if (a) dragging = { k: 'url', u: linkUrl(a), n: linkTitle(a) };
      else return;
    } else return;
    try { if (dragging.u) { ev.dataTransfer.setData('text/uri-list', dragging.u); ev.dataTransfer.setData('text/plain', dragging.u); } ev.dataTransfer.effectAllowed = 'copyLink'; } catch (e) {}
    document.body.classList.add('br-dragon');
  });
  document.addEventListener('dragend', () => { document.body.classList.remove('br-dragon'); setTimeout(() => { dragging = null; }, 0); });
  document.addEventListener('dragover', ev => { if (dragging && overDesk(ev.target)) { ev.preventDefault(); try { ev.dataTransfer.dropEffect = 'link'; } catch (e) {} } });
  document.addEventListener('drop', ev => { if (!dragging || !overDesk(ev.target)) return; ev.preventDefault(); const d = dragging; dragging = null; document.body.classList.remove('br-dragon'); dropOnDesk(d); });
  async function dropOnDesk(d) {
    if (d.k === 'url') { if (/^javascript:/i.test(d.u)) return toast('Desktop', "That link doesn't go anywhere. (It's JavaScript. It just does a thing.)"); deskAdd({ k: 'url', u: d.u, n: d.n }); S('drag'); return; }
    const r = await renderPicture(d.el), name = uniquePic(r.name, '.bmp');
    if (!savePic(name, r.url)) return msg('Copy File', 'There is not enough free disk space. Delete some pictures from My Pictures and try again.', 'warn');
    deskAdd({ k: 'pic', n: name, p: name }); S('drag');
  }
  // inline pictures (SVG) aren't draggable in a real browser, so they get a little drag of their own (mouse only)
  let pdrag = null;
  document.addEventListener('pointerdown', ev => {
    if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
    const t = ev.target; if (!t.closest || !t.closest('#page') || t.closest(LINKS + ',button,input,label,select,textarea,canvas')) return;
    const svg = t.closest('svg'); if (!svg) return;
    const pic = pictureAt(t); if (!pic || pic.tagName === 'CANVAS' || /pointer|grab|move|crosshair/.test(getComputedStyle(t).cursor)) return;
    pdrag = { pic, x: ev.clientX, y: ev.clientY, ghost: null };
  });
  document.addEventListener('pointermove', ev => {
    if (!pdrag) return;
    if (!pdrag.ghost) {
      if (Math.abs(ev.clientX - pdrag.x) + Math.abs(ev.clientY - pdrag.y) < 10) return;
      const g = document.createElement('div'); g.className = 'br-ghost'; g.innerHTML = big(JI('bmp', 32)) + `<span>${esc(picName(pdrag.pic))}.bmp</span>`;
      DesktopSurface.root().appendChild(g); pdrag.ghost = g; document.body.classList.add('br-dragon');
      try { getSelection().removeAllRanges(); } catch (e) {}
    }
    const p = DesktopSurface.point(ev.clientX, ev.clientY);
    pdrag.ghost.style.left = (p.x + 6) + 'px'; pdrag.ghost.style.top = (p.y + 6) + 'px';
    pdrag.ghost.classList.toggle('ok', overDesk(document.elementFromPoint(ev.clientX, ev.clientY)));
  });
  const endPdrag = ev => {
    if (!pdrag) return; const d = pdrag; pdrag = null;
    if (!d.ghost) return;
    d.ghost.remove(); document.body.classList.remove('br-dragon');
    const swallow = e => { e.stopPropagation(); e.preventDefault(); }; document.addEventListener('click', swallow, true); setTimeout(() => document.removeEventListener('click', swallow, true), 0);
    if (ev.type === 'pointerup' && overDesk(document.elementFromPoint(ev.clientX, ev.clientY))) dropOnDesk({ k: 'pic', el: d.pic });
  };
  document.addEventListener('pointerup', endPdrag); document.addEventListener('pointercancel', endPdrag);

  // ================================================================ pictures: the right-click jobs
  async function savePictureAs(pic) {
    const r = await renderPicture(pic);
    saveDialog({ title: 'Save Picture', name: r.name, types: [['Bitmap (*.bmp)', '.bmp'], ['GIF (*.gif)', '.gif']], type: r.w * r.h < 20000 ? 1 : 0, places: ['pics', 'desk'], icon: JI('bmp', 16),
      onSave: (name, place) => {
        if (!savePic(name, r.url)) return msg('Save Picture', 'There is not enough disk space to save this picture. Delete some pictures from My Pictures first.', 'warn');
        S('savepic'); sfx('click');
        if (place === 'desk') { deskAdd({ k: 'pic', n: name, p: name }); toast('Save Picture', `${name} is on your desktop (and in My Pictures). Double-click it to open it in Paint.`, 5000); }
        else toast('Save Picture', `Saved C:\\My Documents\\My Pictures\\${name}. Double-click it to open it in Paint.`, 5000);
      } });
  }
  function setWallpaper(url, w, h) {
    const mode = (w >= 300 || h >= 220) ? 'Center' : 'Tile';
    const css = mode === 'Center' ? `url("${url}") center/auto no-repeat,#008080` : `url("${url}") 0 0/auto repeat,#008080`;
    const d = $('desktop'); if (d) d.style.background = css;
    try { localStorage.setItem('jhp_prog_wall', JSON.stringify({ img: url, col: '#008080', mode })); } catch (e) { toast('Display Properties', 'Your hard disk is full. The wallpaper will be forgotten when you restart.'); }
    A.fs.add('C:/JACKOS', { name: 'JackNet Explorer Wallpaper.bmp', type: 'png', dataURL: url, date: d99(), size: Math.max(1, Math.round(w * h * 3 / 1024)) + ' KB', br: 'wall' });
    put('wallfile', 1);
  }
  async function picWallpaper(pic) {
    const r = await renderPicture(pic);
    setWallpaper(r.url, r.w, r.h); S('wallpaper'); sfx('click');
    toast('Display Properties', `Wallpaper changed to "JackNet Explorer Wallpaper.bmp" (${r.w >= 300 || r.h >= 220 ? 'centred' : 'tiled'}). Minimise the browser to admire it.`, 5000);
  }
  async function picCopy(pic) {
    const r = await renderPicture(pic);
    const ok = () => toast('Copy', 'Picture copied to the Clipboard. Paste it into Paint!');
    try { r.canvas.toBlob(bl => { try { navigator.clipboard.write([new ClipboardItem({ 'image/png': bl })]).then(ok, () => toast('Copy', 'Picture copied to the JackOS Clipboard.')); } catch (e) { toast('Copy', 'Picture copied to the JackOS Clipboard.'); } }); } catch (e) { toast('Copy', 'Picture copied to the JackOS Clipboard.'); }
  }
  function mailIt(subj, body, att) {
    if (window.JackFiles && JackFiles.compose) JackFiles.compose({ subj, body, att });
    else msg('Outlook Express', 'Outlook Express is not installed on this computer.', 'warn');
  }
  async function picMail(pic) {
    const r = await renderPicture(pic), name = r.name + (r.w * r.h < 20000 ? '.gif' : '.bmp');
    mailIt(name, `Look at this picture I found on ${hostOf(curUrl())}!!!\n\n(It's attached. ${Math.max(1, Math.round(r.url.length * 0.75 / 1024))} KB. It'll take about ${Math.max(2, Math.round(r.url.length * 0.75 / 1024 / 4.8))} seconds to send on the modem.)\n`, [{ name }]);
  }
  async function picToDesk(pic) { await dropOnDesk({ k: 'pic', el: pic }); toast('Send To', 'The picture is on your desktop.'); }
  async function picDeskItem(pic) {
    const r = await renderPicture(pic), name = uniquePic(r.name, '.bmp');
    if (!savePic(name, r.url)) return msg('Active Desktop', 'There is not enough disk space for that picture.', 'warn');
    const w = Math.min(220, r.w + 4); addToActiveDesktop({ k: 'pic', n: name, p: name, u: curUrl(), w, ph: Math.round(r.h * (w - 4) / r.w) });
  }
  function picProps(pic) {
    const r = pic.getBoundingClientRect(), name = picName(pic), gif = r.width * r.height < 20000, file = name + (gif ? '.gif' : '.bmp');
    const w = Math.round(pic.tagName === 'CANVAS' ? pic.width : r.width), h = Math.round(pic.tagName === 'CANVAS' ? pic.height : r.height);
    const bytes = gif ? Math.round(w * h / 2) + 790 : w * h * 3 + 54, base = curUrl().replace(/[#?].*$/, '').replace(/[^/]*$/, '');
    const b = document.createElement('div');
    b.innerHTML = `<div class="tabs"><span class="on">General</span></div><div class="tabpage"><div class="row" style="flex-wrap:nowrap;gap:10px">${big(JI('bmp', 32))}<b>${esc(file)}</b></div><hr>
      <table class="br-kv"><tr><td>Protocol:</td><td>HyperText Transfer Protocol</td></tr><tr><td>Type:</td><td>${gif ? 'GIF Image' : 'Bitmap Image'}</td></tr><tr><td>Address (URL):</td><td class="br-url">${esc(base + 'images/' + file)}</td></tr><tr><td>Size:</td><td>${bytes.toLocaleString('en-GB')} bytes</td></tr><tr><td>Dimensions:</td><td>${w} x ${h} pixels</td></tr><tr><td>Created:</td><td>${d99()}</td></tr><tr><td>Modified:</td><td>${d99()}</td></tr></table></div>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" style="min-width:72px">OK</button></div>`;
    const wn = Desk.openWin('Properties', b, 360); qs(b, '.btn').addEventListener('click', wn.close);
  }
  function linkProps(a) {
    const u = linkUrl(a), b = document.createElement('div');
    b.innerHTML = `<div class="tabs"><span class="on">General</span></div><div class="tabpage"><div class="row" style="flex-wrap:nowrap;gap:10px">${big(JI('webpage', 32))}<b class="br-ell">${esc(linkTitle(a))}</b></div><hr>
      <table class="br-kv"><tr><td>Protocol:</td><td>${/^mailto:/i.test(u) ? 'Simple Mail Transfer Protocol' : /^javascript:/i.test(u) ? 'JScript Language' : 'HyperText Transfer Protocol'}</td></tr><tr><td>Type:</td><td>${/^mailto:/i.test(u) ? 'E-mail address' : 'HTML Document'}</td></tr><tr><td>Address (URL):</td><td class="br-url">${esc(u)}</td></tr><tr><td>Size:</td><td>Not Available</td></tr><tr><td>Created:</td><td>Not Available</td></tr></table></div>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" style="min-width:72px">OK</button></div>`;
    const wn = Desk.openWin('Properties', b, 360); qs(b, '.btn').addEventListener('click', wn.close);
  }

  // ================================================================ links: the right-click jobs
  function newWindow(a) {
    msg('JackNet Explorer', 'JackNet Explorer can only have one window open at a time. This computer only has 32MB of RAM, and Dave\'s screensaver is using 30 of it.\n\nOpen the link in this window instead?', 'q', [['Open Here', () => a.click()], ['Cancel']]);
  }
  function targetFile(u) {
    const path = u.replace(/^\w+:\/\//, '').replace(/[?#].*$/, ''), seg = path.split('/').slice(1).filter(Boolean).pop();
    if (seg && /\.\w{2,4}$/.test(seg)) return seg;
    if (seg) return seg.replace(/[^\w~-]+/g, '') + '.htm';
    const h = hostOf(u).replace(/^www\./, '').split('.')[0];
    return (h || 'index') + '.htm';
  }
  function saveTarget(u, title) {
    if (/^javascript:/i.test(u)) return msg('JackNet Explorer', 'The file could not be written to the cache.\n\n(That link is a JavaScript one. There is nothing to save.)', 'warn');
    if (/^mailto:/i.test(u)) return msg('JackNet Explorer', 'You can\'t save an e-mail address to disk. Write it on your hand like everyone else.', 'warn');
    if (Net.offline && !cached(u)) return offlineDialog(u, () => saveTarget(u, title));
    const file = targetFile(u), host = hostOf(u);
    fileDownload(file, host, () => saveDialog({ title: 'Save As', name: file.replace(/\.\w+$/, ''), types: [['HTML Document (*.htm;*.html)', /\.html$/.test(file) ? '.html' : '.htm'], ['All Files (*.*)', '']], places: ['dl', 'docs', 'desk'], icon: JI('webpage', 16),
      onSave: (name, place, ti, path) => {
        const kb = 3 + (name.length * 7 + host.length * 3) % 37;
        progressWin(file, host, kb, path.replace(/\//g, '\\') + '\\' + name, (w, b) => {
          const rec = savePage({ n: name, dir: path, u, t: title || name, kind: 'html', kb });
          if (place === 'desk') deskAdd({ k: 'page', n: name, r: rec.id });
          qs(b, '[data-d=open]').addEventListener('click', () => { w.close(); openSaved(rec); });
          qs(b, '[data-d=folder]').addEventListener('click', () => { w.close(); A.open('explorer', path); });
        });
      } }), () => openUrl(u));
  }
  function addFavUrl(u, title) {
    if (!u || /^javascript:|^mailto:/i.test(u)) return msg('Add Favorite', 'You can\'t add that to your Favorites. It isn\'t a web page.', 'warn');
    Desk.ask('Add Favorite', 'JackNet Explorer will add this page to your Favorites list. Name:', String(title || u).slice(0, 40), 40, name => {
      name = (name || '').trim(); if (!name) return;
      const def = [{ sec: 'demos', title: 'Games Arcade' }, { sec: 'cheats', title: 'Cheats!!!' }, { sec: 'orks', title: 'Hobby Corner' }];
      const list = store.get('jhp_favs', def).filter(f => f.url !== u); list.push({ sec: 'secret', url: u, title: name.slice(0, 40) }); store.set('jhp_favs', list);
      A.fs.add('C:/JACKOS/Favorites', { name: cleanName(name) + '.url', type: 'lnk', web: u, date: d99(), size: '1 KB', br: 'fav' });
      toast('Favorites', `"${name}" added to Favorites.`);
    });
  }
  function linkItems(a) {
    const u = linkUrl(a), title = linkTitle(a), mail = /^mailto:/i.test(u);
    return [
      { label: 'Open', act: () => a.click() },
      { label: 'Open in New Window', dis: mail, act: () => newWindow(a) },
      { label: 'Save Target As...', act: () => saveTarget(u, title) },
      { label: 'Print Target', dis: mail, act: () => toast('Print', `Printing "${title}"... The printer is warming up. It sounds like a tractor.`, 4000) },
      '-',
      { label: 'Copy Shortcut', act: () => copyText(u, mail ? 'E-mail address' : 'Shortcut') },
      '-',
      { label: 'Add to Favorites...', dis: mail, act: () => addFavUrl(u, title) },
      { label: 'Send To', sub: [{ label: 'Desktop (create shortcut)', act: () => deskShortcut(u, title) }, { label: 'Mail Recipient', act: () => mailIt(title, `Look at this!!!\n\n${u}\n`) }] },
    ];
  }
  function picItems(pic) {
    return [
      { label: 'Save Picture As...', act: () => savePictureAs(pic) },
      { label: 'E-mail Picture...', act: () => picMail(pic) },
      { label: 'Print Picture...', act: () => toast('Print', 'Printing picture... It came out mostly magenta. The printer is out of cyan. Again.', 4000) },
      { label: 'Go to My Pictures', act: () => A.open('explorer', 'C:/My Documents/My Pictures') },
      { label: 'Set as Wallpaper', act: () => picWallpaper(pic) },
      { label: 'Set as Desktop Item...', act: () => picDeskItem(pic) },
      '-',
      { label: 'Copy', act: () => picCopy(pic) },
      { label: 'Send To', sub: [{ label: 'Desktop (create shortcut)', act: () => picToDesk(pic) }, { label: 'Mail Recipient', act: () => picMail(pic) }] },
    ];
  }
  // ie.js asks first: true = handled (a link or a picture), false = its own page menu
  function pageMenu(ev) {
    const t = ev.target; if (!t || !t.closest || !t.closest('#page') || t.closest('input,textarea,select,.menu')) return false;
    const a = t.closest(LINKS), pic = pictureAt(t);
    if (!a && !pic) return false;
    ev.preventDefault();
    const items = a ? linkItems(a) : [];
    if (pic) { if (items.length) items.push('-'); items.push(...picItems(pic)); }
    if (!a) items.push('-', { label: 'Add to Favorites...', act: () => addFavUrl(curUrl(), curTitle()) });
    items.push('-', { label: 'Properties', act: () => pic && !a ? picProps(pic) : linkProps(a) });
    IE.menu(items, ev.clientX, ev.clientY);
    return true;
  }
  // phones: hold your finger on a link or picture (iOS never sends contextmenu)
  let lp = null;
  document.addEventListener('pointerdown', ev => {
    if (ev.pointerType !== 'touch' || !ev.target.closest || !ev.target.closest('#page')) return;
    if (!ev.target.closest(LINKS) && !pictureAt(ev.target)) return;
    const t = ev.target, x = ev.clientX, y = ev.clientY;
    lp = { x, y, t, fired: false, tm: setTimeout(() => { if (!lp || lp.fired) return; lp.fired = true; lp.done = true; pageMenu({ target: t, clientX: x, clientY: y, preventDefault() {} }); }, 650) };
  }, true);
  document.addEventListener('pointermove', ev => { if (lp && Math.abs(ev.clientX - lp.x) + Math.abs(ev.clientY - lp.y) > 12) { clearTimeout(lp.tm); lp = null; } }, true);
  document.addEventListener('contextmenu', () => { if (lp) { lp.fired = true; clearTimeout(lp.tm); } }, true);
  document.addEventListener('pointercancel', () => { if (lp) { clearTimeout(lp.tm); lp = null; } }, true); // the finger started scrolling
  document.getElementById('page') && document.getElementById('page').addEventListener('scroll', () => { if (lp && !lp.done) { clearTimeout(lp.tm); lp = null; } }, { passive: true });
  document.addEventListener('pointerup', () => { if (lp) { clearTimeout(lp.tm); if (lp.done) { const swallow = e => { e.stopPropagation(); e.preventDefault(); document.removeEventListener('click', swallow, true); }; document.addEventListener('click', swallow, true); setTimeout(() => document.removeEventListener('click', swallow, true), 350); } lp = null; } }, true);

  // ================================================================ saved web pages (File > Save As, Save Target As)
  // jhp_bridge_pages = [{ id, n: file name, dir: fs path, u: url, t: title, d: date, kb, kind: 'full'|'mht'|'html'|'txt', txt?, files? }]
  let PAGES = get('pages', []); if (!Array.isArray(PAGES)) PAGES = [];
  const GARBAGE = ['GIF89a\u0001\u0000\u0001\u0000\u0080\u0000\u0000\u00ff\u00ff\u00ff\u0000\u0000\u0000!\u00f9\u0004\u0001\u0000\u0000\u0000\u0000,\u0000\u0000\u0000\u0000\u0001\u0000\u0001\u0000\u0000\u0002\u0002D\u0001\u0000;', '\u00ff\u00d8\u00ff\u00e0\u0000\u0010JFIF\u0000\u0001\u0001\u0000\u0000\u0001\u0000\u0001\u0000\u0000\u00ff\u00db\u0000C\u0000\u0008\u0006\u0006\u0007\u0006\u0005\u0008\u0007\u0007\u0007\t\t\u0008'];
  function pageNodes(rec) {
    const dir = A.fs.dir(rec.dir);
    dir.kids = dir.kids.filter(k => k.br !== rec.id);
    if (rec.kind === 'txt') { dir.kids.push({ name: rec.n, type: 'txt', text: rec.txt || '', date: rec.d, size: Math.max(1, Math.round((rec.txt || '').length / 1024)) + ' KB', br: rec.id }); return; }
    dir.kids.push({ name: rec.n, type: 'htm', br: rec.id, date: rec.d, size: rec.kb + ' KB', icon: JI('webpage', 32), svg: JI('webpage', 32) });
    if (rec.kind === 'full' && rec.files) {
      const fd = { name: rec.n.replace(/\.\w+$/, '') + '_files', type: 'dir', date: rec.d, br: rec.id, kids: [] };
      rec.files.forEach((f, i) => fd.kids.push(/\.css$/.test(f) ? { name: f, type: 'txt', date: rec.d, size: '1 KB', text: `/* ${rec.t} */\nbody { background: #ffffff; font-family: "Comic Sans MS", Verdana, sans-serif; }\nblink { text-decoration: blink; } /* still the best tag */\na:hover { color: #ff00ff; }\n` } : { name: f, type: 'txt', date: rec.d, size: (1 + (f.length * 3 + i) % 9) + ' KB', text: GARBAGE[/\.jpg$/.test(f) ? 1 : 0] }));
      dir.kids.push(fd);
    }
  }
  function savePage(o) {
    const rec = Object.assign({ id: 'p' + uid(), d: d99() }, o);
    PAGES = PAGES.filter(p => !(p.dir === rec.dir && p.n.toLowerCase() === rec.n.toLowerCase()));
    PAGES.push(rec); while (PAGES.length > 30) PAGES.shift();
    put('pages', PAGES); pageNodes(rec);
    return rec;
  }
  function pageFiles() {
    const el = qs(document, '.sec.on'); const n = el ? Math.min(8, qsa(el, 'svg,canvas,img').filter(x => !x.parentElement.closest('svg')).length) : 2;
    const out = ['style.css', 'spacer.gif']; for (let i = 0; i < n; i++) out.push(i === 0 ? 'banner.gif' : i === 1 ? 'counter.gif' : `image${i}.${i % 3 ? 'gif' : 'jpg'}`);
    return out;
  }
  function pageText() {
    const el = qs(document, '.sec.on'); const t = el ? el.innerText : '';
    return `${curTitle()}\n${curUrl()}\n${'='.repeat(Math.min(60, curTitle().length))}\n\n` + String(t || '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 2000) + '\n';
  }
  function saveAs() {
    if (IE.current === 'error') return msg('Save Web Page', 'There is nothing to save. The page could not be displayed.', 'warn');
    const title = curTitle(), u = curUrl();
    saveDialog({ title: 'Save Web Page', name: cleanName(title) || 'Untitled', icon: JI('webpage', 16),
      types: [['Web Page, complete (*.htm;*.html)', '.htm'], ['Web Archive, single file (*.mht)', '.mht'], ['Web Page, HTML only (*.htm;*.html)', '.htm'], ['Text File (*.txt)', '.txt']], places: ['docs', 'desk', 'dl'],
      onSave: (name, place, ti, path) => {
        const kind = ['full', 'mht', 'html', 'txt'][ti], files = kind === 'full' ? pageFiles() : null, text = kind === 'txt' ? pageText() : null;
        const kb = kind === 'txt' ? Math.max(1, Math.round(text.length / 1024)) : 4 + (title.length * 5) % 30 + (files ? files.length * 3 : 0);
        const b = document.createElement('div');
        b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center">${big(JI('webpage', 32))}<div class="br-ell" style="flex:1">Saving:<br><b>${esc(name)}</b></div></div><div class="prog" style="margin:8px 0"><span style="display:flex;gap:2px"></span></div><div class="br-ell br-svf">Copying ${esc(u)}</div>`;
        const w = A.win('Save Web Page', b, { w: 340, icon: JI('webpage', 16), noResize: true, noMax: true, noMin: true });
        const steps = [u].concat(files || []); let i = 0;
        const iv = setInterval(() => {
          if (w.closed) return clearInterval(iv);
          qs(b, '.prog span').appendChild(document.createElement('i')); i++;
          qs(b, '.br-svf').textContent = 'Copying ' + steps[Math.min(steps.length - 1, Math.floor(i / 2))];
          if (i >= Math.max(8, steps.length * 2)) {
            clearInterval(iv); w.close();
            const rec = savePage({ n: name, dir: path, u, t: title, kind, kb, files, txt: text });
            if (place === 'desk') deskAdd({ k: 'page', n: name, r: rec.id });
            toast('Save Web Page', `Saved ${path.replace(/\//g, '\\')}\\${name}${files ? ` (and a folder of ${files.length} pictures and bits)` : ''}. Open it from My Computer, even offline!`, 6000);
          }
        }, 90);
      } });
  }
  function openSaved(rec) {
    if (rec.kind === 'txt') { const n = A.fs.get(rec.dir + '/' + rec.n); return n ? A.openFile(n) : 0; }
    S('savedpage');
    pending = { rec, path: rec.dir.replace(/\//g, '\\') + '\\' + rec.n, ts: Date.now() };
    showBrowser(); IE.navigate(rec.u);
  }
  let pending = null;
  A.OPENERS.htm = A.OPENERS.mht = node => { const rec = PAGES.find(p => p.id === node.br); if (rec) return openSaved(rec); if (node.web) return A.OPENERS.lnk ? A.OPENERS.lnk(node) : 0; msg(node.name, 'This web page is empty. (It was saved during a thunderstorm.)', 'warn'); };
  // typing C:\... (or file:///C:/...) into the Address bar opens it from the hard disk
  function openPath(v) {
    const m = /^(?:file:\/{2,3})?([a-z]):([\\/].*)?$/i.exec(String(v || '').trim()); if (!m) return false;
    if (m[1].toLowerCase() !== 'c') { msg('JackNet Explorer', `${m[1].toUpperCase()}:\\ is not accessible.\n\nThe device is not ready.`, 'warn'); return true; }
    const rest = (m[2] || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''), node = rest ? A.fs.get('C:/' + rest) : A.fs.root;
    if (!node) { msg('JackNet Explorer', `Cannot find 'file:///C:/${rest}'. Make sure the path or Internet address is correct.`, 'warn'); return true; }
    if (node.type === 'dir') A.open('explorer', 'C:/' + rest); else A.openFile(node);
    return true;
  }
  document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target && ev.target.id === 'addrBar' && openPath(ev.target.value)) { ev.preventDefault(); ev.stopPropagation(); ev.target.blur(); } }, true);
  document.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('#addrGo') && openPath($('addrBar').value)) { ev.preventDefault(); ev.stopPropagation(); } }, true);

  // ================================================================ Temporary Internet Files + Work Offline
  // jhp_bridge_tif = [{ u, t, ts, f: file name }] newest last: every page you look at while online is "cached"
  const TIF = 'C:/JACKOS/Temporary Internet Files';
  let CACHE = get('tif', []); if (!Array.isArray(CACHE)) CACHE = [];
  const tifName = u => { const f = targetFile(u).replace(/\.\w+$/, ''); let i = 1, n; const used = new Set(CACHE.map(c => c.f)); do { n = `${f}[${i++}].htm`; } while (used.has(n)); return n; };
  function tifNode(c) { A.fs.add(TIF, { name: c.f, type: 'lnk', web: c.u, date: d99(c.ts), size: (2 + c.f.length % 11) + ' KB', br: 'tif' }); }
  function remember(u, t) {
    const k = norm(u); if (!k || /^javascript/.test(k)) return;
    const old = CACHE.find(c => norm(c.u) === k);
    if (old) { old.ts = Date.now(); old.t = t; CACHE = CACHE.filter(c => c !== old).concat([old]); }
    else { const c = { u, t, ts: Date.now(), f: tifName(u) }; CACHE.push(c); tifNode(c); }
    while (CACHE.length > 120) { const gone = CACHE.shift(); const d = A.fs.get(TIF); if (d) d.kids = d.kids.filter(x => !(x.br === 'tif' && x.name === gone.f)); }
    put('tif', CACHE);
  }
  function cached(u) {
    const k = norm(u);
    if (k === norm(secUrl('home'))) return true;
    if (CACHE.some(c => norm(c.u) === k)) return true;
    const hist = store.get('jhp_hist', []) || [];
    return hist.some(h => h && norm(secUrl(h.sec)) === k);
  }
  const offTitle = () => { const t = $('winTitle'); if (Net.offline && t && !/\[Working Offline\]/.test(t.textContent)) t.textContent += ' [Working Offline]'; if (!Net.offline && t) t.textContent = t.textContent.replace(' [Working Offline]', ''); };
  function offlinePage(u) {
    const el = $('s-secret'); if (!el) return;
    const recent = CACHE.slice(-6).reverse();
    el.innerHTML = `<div class="br-off"><div class="br-off-h">${big(JI('jacknet', 32))}<div><b>Web page unavailable while offline</b><div class="small">${esc(u)}</div></div></div><hr>
      <p>The Web page you requested is not available offline.</p><p>To view this page, click <b>Connect</b>.</p><p><button class="btn br-off-c" type="button">Connect</button></p><hr>
      <p class="small">Pages you have already looked at are kept in <b>Temporary Internet Files</b>, so you can still read them while Mom is on the phone:</p>
      <ul>${recent.map(c => `<li><a href="${esc(c.u)}">${esc(c.t || c.u)}</a></li>`).join('')}<li><a href="#" class="br-off-tif">Open the Temporary Internet Files folder</a></li></ul></div>`;
    qsa(document, '.sec').forEach(s => s.classList.toggle('on', s === el));
    document.body.classList.add('ext-site');
    qs(el, '.br-off-c').addEventListener('click', () => goOnline(() => IE.navigate(u)));
    qs(el, '.br-off-tif').addEventListener('click', ev => { ev.preventDefault(); A.open('explorer', TIF); });
    const t = $('winTitle'); if (t) t.textContent = 'Web page unavailable while offline - JackNet Explorer [Working Offline]';
    document.title = 'Web page unavailable while offline';
    setTimeout(() => { const st = $('brStatus'); if (st) st.textContent = 'Web page unavailable while offline'; }, 1100);
  }
  let offDlg = null;
  function offlineDialog(u, then) {
    if (offDlg && offDlg.el.isConnected) return;
    S('offline');
    const b = document.createElement('div');
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:12px;align-items:flex-start">${big(JI('jacknet', 32))}<div><p style="margin:0 0 6px">The Web page you requested is not available offline.</p><p style="margin:0 0 6px" class="br-ell">${esc(u)}</p><p style="margin:0">To view this page, click Connect.</p></div></div>
      <div class="row" style="justify-content:center;margin-top:12px;gap:6px"><button class="btn dflt" type="button" style="min-width:80px">Connect</button><button class="btn" type="button" style="min-width:80px">Stay Offline</button></div>`;
    offDlg = Desk.openWin('Web page unavailable while offline', b, 360);
    const [c, s] = qsa(b, '.btn');
    c.addEventListener('click', () => { offDlg.close(); goOnline(then || (() => IE.navigate(u))); });
    s.addEventListener('click', () => offDlg.close());
    setTimeout(() => c.focus(), 30); sfx('uhoh');
  }
  // the dial-up box: the modem screams, then you're online
  let dialing = null;
  function goOnline(then) {
    if (!Net.offline) { if (then) then(); return; }
    if (dialing && !dialing.closed) return;
    const b = document.createElement('div');
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center">${big(JI('dialup', 32))}<div><b>JackNet 56K</b><div class="br-dial-st">Dialling 01632 960199...</div></div></div><div class="prog" style="margin:10px 0 6px"><span style="display:flex;gap:2px"></span></div><div class="row" style="justify-content:flex-end"><button class="btn" type="button" style="min-width:80px">Cancel</button></div>`;
    dialing = A.win('Dial-up Connection', b, { w: 320, icon: JI('dialup', 16), noResize: true, noMax: true, noMin: true });
    const w = dialing, st = qs(b, '.br-dial-st'), bar = qs(b, '.prog span');
    sfx('modem');
    const steps = ['Dialling 01632 960199... (BEEEE-DOOOO)', 'Verifying user name and password... (KSSSHHHHHH)', 'Logging on to network...', 'Connected at 49,333 bps!'];
    let i = 0;
    const iv = setInterval(() => {
      if (w.closed) return clearInterval(iv);
      bar.appendChild(document.createElement('i')); i++;
      st.textContent = steps[Math.min(steps.length - 1, Math.floor(i / 5))];
      if (i >= 20) { clearInterval(iv); setTimeout(() => { w.close(); Net.setOffline(false); offTitle(); trayDraw(); toast('JackNet', 'Connected to JackNet 56K at 49,333 bps. You are online!'); if (then) then(); }, 350); }
    }, 130);
    qs(b, '.btn').addEventListener('click', () => { clearInterval(iv); w.close(); });
  }
  function goOffline() {
    if (Net.offline) return;
    Net.setOffline(true); offTitle(); trayDraw(); sfx('click');
    toast('JackNet', "Working offline. Pages you've already seen still work (they're in Temporary Internet Files). Nobody else can see you, and you can't see them.", 6000);
  }
  function toggleOffline() { if (Net.offline) goOnline(() => IE.navigate(curUrl())); else goOffline(); }
  // the little two-computers modem icon in the tray: click it to see the connection, or hang up
  const t0 = Date.now(); let trayBtn = null, recv = 21000 + Math.floor(Math.random() * 9000), sent = 4000;
  function trayDraw() {
    if (!trayBtn) return;
    trayBtn.classList.toggle('off', Net.offline);
    trayBtn.title = Net.offline ? 'Not connected (click to dial JackNet 56K)' : 'Connected to JackNet 56K at 49,333 bps';
  }
  function dunStatus() {
    if (Net.offline) return msg('Dial-up Networking', 'You are not connected. Connect to JackNet 56K now?\n\n(Check nobody is on the phone first.)', 'q', [['Connect', () => goOnline()], ['Cancel']]);
    const b = document.createElement('div');
    const draw = () => { const s = Math.floor((Date.now() - t0) / 1000); qs(b, '.br-dur').textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`; qs(b, '.br-rx').textContent = recv.toLocaleString('en-GB') + ' bytes'; qs(b, '.br-tx').textContent = sent.toLocaleString('en-GB') + ' bytes'; };
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${big(JI('dialup', 32))}<table class="br-kv"><tr><td colspan="2"><b>Connected at 49,333 bps</b></td></tr><tr><td>Duration:</td><td class="br-dur"></td></tr><tr><td>Bytes received:</td><td class="br-rx"></td></tr><tr><td>Bytes sent:</td><td class="br-tx"></td></tr><tr><td>Server type:</td><td>PPP: JackOS 98, JackNet</td></tr></table></div>
      <div class="row" style="justify-content:flex-end;gap:6px;margin-top:10px"><button class="btn" type="button" style="min-width:72px">OK</button><button class="btn" type="button" style="min-width:72px">Disconnect</button></div>`;
    const w = Desk.openWin('Connected to JackNet 56K', b, 330); draw();
    const iv = setInterval(() => { if (!b.isConnected) return clearInterval(iv); draw(); }, 1000);
    const [ok, dc] = qsa(b, '.btn'); ok.addEventListener('click', w.close);
    dc.addEventListener('click', () => { w.close(); goOffline(); });
  }
  function trayIcon() {
    const tray = $('tray'); if (!tray || $('brDun')) return;
    trayBtn = document.createElement('button'); trayBtn.id = 'brDun'; trayBtn.type = 'button'; trayBtn.setAttribute('aria-label', 'Dial-up connection');
    trayBtn.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true"><rect x="1" y="2" width="8" height="6" fill="#c0c0c0" stroke="#000"/><rect x="2" y="3" width="6" height="4" fill="#008080"/><rect x="7" y="7" width="8" height="6" fill="#c0c0c0" stroke="#000"/><rect x="8" y="8" width="6" height="4" fill="#008080"/><rect class="l1" x="2" y="10" width="2" height="2" fill="#0c0"/><rect class="l2" x="4" y="13" width="2" height="2" fill="#0c0"/><path class="x" d="M9 1l6 6M15 1l-6 6" stroke="#e00" stroke-width="2"/></svg>';
    trayBtn.addEventListener('click', dunStatus);
    trayBtn.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); IE.menu([{ label: 'Status', act: dunStatus }, Net.offline ? { label: 'Connect', act: () => goOnline() } : { label: 'Disconnect', act: goOffline }], ev.clientX, ev.clientY - 40); });
    const clock = $('clock'); tray.insertBefore(trayBtn, clock || null);
    trayDraw();
    setInterval(() => { if (!trayBtn || Net.offline || document.hidden) return; const r = Math.random(); trayBtn.classList.toggle('rx', r < 0.5); trayBtn.classList.toggle('tx', r > 0.75); recv += Math.floor(Math.random() * 900); if (r > 0.75) sent += Math.floor(Math.random() * 200); }, 700);
  }

  // ================================================================ home page
  const homeUrl = () => store.get('jhp_homeurl', '') || '';
  function askHome(u) {
    if (norm(homeUrl()) === norm(u)) return toast('Home Page', 'This is already your home page!');
    msg('Set Home Page', `Would you like to set your home page to '${u}'?`, 'q', [['Yes', () => {
      store.set('jhp_homeurl', u); S('homepage'); sfx('click');
      toast('Home Page', 'Done! The Home button (and every time JackNet Explorer starts) now goes there. Tools > Internet Options > Use Default puts it back.', 6000);
    }], ['No']]);
  }

  // ================================================================ cookies (C:\JACKOS\Cookies\you@site[1].txt)
  // jhp_bridge_ck = { domain: { first, last, prev, n } }
  const CK = get('ck', {}) || {};
  const ckDomain = host => host.replace(/^www\./, '');
  const ckFile = dom => `${cookieUser()}@${dom}[1].txt`;
  function ckNode(dom) {
    const c = CK[dom]; if (!c) return;
    const dir = A.fs.dir('C:/JACKOS/Cookies'); dir.kids = dir.kids.filter(k => !(k.br === 'ck' && k.dom === dom));
    dir.kids.push({ name: ckFile(dom), type: 'txt', br: 'ck', dom, secret: 'br.cookie', date: d99(c.first), size: '1 KB',
      get text() { const x = CK[dom] || c; return `lastvisit\n${Math.floor(x.last / 1000)}\n${dom}/\n0\n${(x.last * 7 % 4294967295) >>> 0}\n29999999\n*\nvisits\n${x.n}\n${dom}/\n0\n2147483647\n29999999\n*\nname\n${who().replace(/\s/g, '+')}\n${dom}/\n0\n2147483647\n29999999\n*\n\n(This is a COOKIE. ${dom} left it here so it remembers you. Not a real cookie. Mom was very disappointed.)\n`; } });
  }
  const ckSeen = {};
  function visitCookie(host) {
    const dom = ckDomain(host); if (ckSeen[dom]) return ckSeen[dom];
    const c = CK[dom] || { first: Date.now(), last: 0, n: 0 };
    const prev = c.last; c.prev = prev; c.last = Date.now(); c.n++;
    CK[dom] = c; put('ck', CK); ckNode(dom);
    return (ckSeen[dom] = { prev, n: c.n, first: c.first });
  }
  const lastVisit = v => v.prev ? `Welcome back! You last visited on ${long99(v.prev)} at ${hm(v.prev)}. This is visit number ${v.n}.` : 'This is your first visit! We put a cookie on your computer so we remember you next time.';
  const screenLine = () => `You are using JackNet Explorer 5.0 on JackOS 98, screen ${innerWidth}x${innerHeight}, 256 colours.`;
  const hasJackAmp = () => !!(A.apps.jackamp && (!window.Setup || !Setup.has || Setup.has('jackamp')));

  // ================================================================ JackAmp skins (from the web, for real)
  const SKINS = [
    { id: 'camo', n: 'Army Camo', by: 'Snaz', d: 'Green and brown, like an Airfix tank. Buttons go BOOM (they don\'t).', main: 'linear-gradient(#3a5a1a,#22300f)', lcd: '#ffd400', btn: 'linear-gradient(#6a7a3a,#2a3a10)', edge: '#9aaa5a' },
    { id: 'hotdog', n: 'Hot Dog Stand', by: 'Jack', d: 'Red and yellow. Hurts your eyes. You\'ll love it.', main: 'linear-gradient(#e00000,#900000)', lcd: '#ffff00', btn: 'linear-gradient(#ffff40,#c0a000)', edge: '#ffff80', btext: '#000' },
    { id: 'rubik', n: 'Cube Mania', by: Cast.n('cousin'), d: 'Six colours. Solves itself when you press Play. (It doesn\'t.)', main: 'linear-gradient(90deg,#e10600 0 16%,#ffffff 16% 33%,#0028c8 33% 50%,#ffd400 50% 66%,#0a0 66% 83%,#ff7a00 83%)', lcd: '#ffffff', btn: 'linear-gradient(#ffffff,#a0a0a0)', edge: '#fff', btext: '#000' },
    { id: 'space', n: 'Deep Space Nine-ish', by: Cast.n('club2'), d: 'Black, stars, purple buttons. For listening to space music in the dark.', main: 'radial-gradient(1px 1px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 60%,#fff,transparent),radial-gradient(1px 1px at 40% 80%,#ff8,transparent),linear-gradient(#000010,#1a0a4a)', lcd: '#9fd0ff', btn: 'linear-gradient(#8060c0,#301060)', edge: '#c0a0ff' },
    { id: 'squig', n: 'Red Racer', by: 'Gubbinz', d: 'RED. FAST. The best skin. (Gubbinz made it. Don\'t tell him it\'s just red.)', main: 'linear-gradient(#ff3030,#a00000)', lcd: '#fff', btn: 'linear-gradient(#ffd400,#c09000)', edge: '#ffe080', btext: '#000' },
  ];
  const SKINDIR = 'C:/Program Files/JackAmp/Skins';
  function skinCss() {
    return SKINS.map(s => `body.brsk-${s.id} .pga-main{background:${s.main}}body.brsk-${s.id} .pga-lt,body.brsk-${s.id} .pga-marq,body.brsk-${s.id} .pga-list,body.brsk-${s.id} .pga-tot{color:${s.lcd};text-shadow:none}body.brsk-${s.id} .pga-b{background:${s.btn};color:${s.btext || '#fff'};border-color:${s.edge} #000 #000 ${s.edge}}body.brsk-${s.id} .pga-bar{background:${s.main};color:${s.lcd}}body.brsk-${s.id} .pga-eq,body.brsk-${s.id} .pga-pl{background:${s.main}}body.brsk-${s.id} .pga-win{background:${s.edge}}body.brsk-${s.id} .pga-tg{color:${s.lcd}}`).join('\n');
  }
  function applySkin(id, quiet) {
    SKINS.forEach(s => document.body.classList.remove('brsk-' + s.id));
    const s = SKINS.find(x => x.id === id);
    if (s) document.body.classList.add('brsk-' + s.id);
    put('jskin', s ? s.id : '');
    if (!quiet && s) { S('skin'); toast('JackAmp', `Skin changed to "${s.n}". Looking sharp.`); }
  }
  const skinFile = s => s.id + '.jsk';
  function skinNodes() {
    const got = get('jskins', []) || [];
    SKINS.filter(s => got.includes(s.id)).forEach(s => A.fs.add(SKINDIR, { name: skinFile(s), type: 'jsk', skin: s.id, date: d99(), size: (40 + s.id.length * 7) + ' KB', br: 'skin', icon: JI('jackamp', 32) }));
  }
  A.OPENERS.jsk = node => { applySkin(node.skin); if (hasJackAmp()) A.open('jackamp'); };
  function getSkin(s) {
    if (!hasJackAmp()) return msg('JackAmp Skins', 'You need JackAmp to use skins!\n\nGet it from The Shareware Shack (it\'s free).', 'warn', [['Get JackAmp', () => openUrl('http://www.sharewareshack.netz/')], ['Cancel']]);
    const file = skinFile(s);
    fileDownload(file, MAIN, () => progressWin(file, MAIN, 40 + s.id.length * 7, SKINDIR.replace(/\//g, '\\') + '\\' + file, (w, b) => {
      const got = get('jskins', []) || []; if (!got.includes(s.id)) { got.push(s.id); put('jskins', got); }
      skinNodes();
      qs(b, '[data-d=open]').addEventListener('click', () => { w.close(); applySkin(s.id); A.open('jackamp'); });
      qs(b, '[data-d=folder]').addEventListener('click', () => { w.close(); A.open('explorer', SKINDIR); });
      msg('JackAmp', `The skin "${s.n}" has been saved to your JackAmp Skins folder.\n\nUse it now?`, 'q', [['Yes', () => { w.close(); applySkin(s.id); A.open('jackamp'); }], ['No']]);
    }), () => { applySkin(s.id); if (hasJackAmp()) A.open('jackamp'); });
  }
  IE.addPage('skins', 'JACK ATTACK! - JackAmp Skins', () => {
    const el = document.createElement('div'); el.className = 'br-skins';
    const cur = get('jskin', '');
    el.innerHTML = `<h1>JACKAMP SKINS!!!</h1><p>Make JackAmp look COOL. Download a skin, it goes in your <b>JackAmp\\Skins</b> folder and JackAmp changes straight away. All made by readers (and one by Gubbinz).</p>
      ${hasJackAmp() ? '' : '<p class="br-skins-warn"><b>Hang on!</b> You haven\'t got JackAmp! Get it free from <a href="http://www.sharewareshack.netz/">The Shareware Shack</a> first.</p>'}
      <div class="br-skins-grid">${SKINS.map(s => `<div class="br-skin"><div class="br-skin-pv" style="background:${s.main}"><i style="color:${s.lcd}">0:42</i><span style="background:${s.btn};border-color:${s.edge}"></span><span style="background:${s.btn};border-color:${s.edge}"></span><span style="background:${s.btn};border-color:${s.edge}"></span></div><b>${esc(s.n)}</b><div class="small">by ${esc(s.by)}</div><p>${esc(s.d)}</p><button class="btn" type="button" data-skin="${s.id}">${cur === s.id ? 'In use!' : 'Download'}</button></div>`).join('')}</div>
      <p class="small">Want the old look back? <a href="#" class="br-skin-def">Use the default skin</a>. Want to make your own? Read <b>how_to_make_skins.txt</b> in your JackAmp folder.</p>
      <p class="small"><a href="#" data-go="downloads">&laquo; back to Downloads</a> &middot; <a href="#" data-go="home">JACK ATTACK! home</a></p>`;
    qsa(el, '[data-skin]').forEach(b => b.addEventListener('click', () => getSkin(SKINS.find(s => s.id === b.dataset.skin))));
    qs(el, '.br-skin-def').addEventListener('click', ev => { ev.preventDefault(); applySkin(''); toast('JackAmp', 'Back to the classic JackAmp skin.'); });
    return el;
  });

  // ================================================================ decorating web pages after they're drawn
  // [match(detail, url) -> bool, fn(root, url)]: run on every 'section' event once the page content is there
  const DECOR = [];
  const deco = (match, fn) => DECOR.push([match, fn]);
  const isSite = (host, path) => (d, u) => hostOf(u) === host && (path == null || '/' + (u.replace(/^\w+:\/\//, '').split('/').slice(1).join('/')).replace(/index\.html?$/, '') === path);
  function whenDrawn(fn) {
    const el = $('s-secret'); let tries = 0;
    const ready = () => { const r = el.firstElementChild; return r && !/loading|wait/.test(r.className) && r.textContent.trim().length > 20 ? r : null; };
    const tick = () => { const r = ready(); if (r) return fn(r); if (++tries < 40) setTimeout(tick, 100); };
    tick();
  }
  const once = (root, cls) => { if (qs(root, '.' + cls)) return false; return true; };
  function homeLink(root, u, where) {
    if (!once(root, 'br-hp')) return;
    const p = document.createElement('div'); p.className = 'br-hp';
    p.innerHTML = `<a href="#" class="br-hpa">${small(JI('webpage', 16))}<span>Make this my home page!</span></a>`;
    qs(p, 'a').addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); askHome(u); });
    const h = where === 'end' ? null : qs(root, 'h1, h2');
    if (h && h.parentElement) h.insertAdjacentElement('afterend', p); else root.appendChild(p);
  }
  function adButton(root, def) {
    if (!once(root, 'br-adb')) return;
    const b = document.createElement('div'); b.className = 'br-adb';
    b.innerHTML = `<button type="button" class="br-adbtn">${small(JI('desktop', 16))}<span>Add to Active Desktop</span></button><span class="small">Put ${esc(def.n)} on your desktop. Live!</span>`;
    qs(b, 'button').addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); addToActiveDesktop(typeof def.make === 'function' ? def.make(root) : def); });
    const h = qs(root, 'h1, h2'); if (h && h.parentElement) h.insertAdjacentElement('afterend', b); else root.insertBefore(b, root.firstChild);
  }
  function jsBox(root, cls, html, style) {
    let box = qs(root, '.' + cls);
    if (!box) { box = document.createElement('div'); box.className = 'br-js ' + cls; if (style) box.setAttribute('style', style); const h = qs(root, 'h1, h2'); if (h && h.parentElement) h.insertAdjacentElement('afterend', box); else root.insertBefore(box, root.firstChild); }
    box.innerHTML = html;
    return box;
  }
  const scrape = root => {
    const grab = sel => [...new Set(qsa(root, sel).filter(e => !e.closest('.br-adb,.br-js')).map(e => e.textContent.replace(/\s+/g, ' ').trim()).filter(t => t.length >= 14 && t.length <= 110))];
    const best = grab('.nw-head, h2 > a, h3 > a');
    return (best.length >= 3 ? best : best.concat(grab('h2, h3, h4, li > a, td > b, dt'))).slice(0, 10);
  };
  // "Make this my home page!" on fan sites and dodgy ones
  [['www.davesplace.jnet', '/'], ['www.kimspopzone.kidz', '/'], ['www.lookhere.infobahn', '/'], ['www.jacksearch.find', '/'], ['www.megaflash.cyb', '/'], ['www.waaaghooo.find', '/'], ['www.popupmania.w3b', '/'], ['www.petrock.netz', '/'], ['www.fireandglitter.homepagez', '/']]
    .forEach(([h, p]) => deco(isSite(h, p), (root, u) => homeLink(root, u, /jacksearch|grotsearch|waaaghooo|lookhere/.test(h) ? 'top' : 'end')));
  // the really dodgy one asks by itself the moment you arrive (it was 1999, they could)
  let popAsked = false;
  deco(isSite('www.popupmania.w3b', '/'), (root, u) => { if (popAsked || norm(homeUrl()) === norm(u)) return; popAsked = true; setTimeout(() => askHome(u), 1200); });
  // "Add to Active Desktop"
  deco(isSite('www.hamstercam.webcom', '/'), (root, u) => adButton(root, { k: 'hamster', n: 'Hamster Cam', u, w: 176 }));
  deco(d => d === 'secret:weather', (root, u) => adButton(root, { k: 'weather', n: 'JackNet Weather', u, w: 200 }));
  deco(d => d === 'secret:news', (root, u) => adButton(root, { k: 'ticker', n: 'JackNet News', u, w: 260, make: r => ({ k: 'ticker', n: 'JackNet News', u, w: 260, items: scrape(r) }) }));
  deco(isSite('www.jackdot.jnet', '/'), (root, u) => adButton(root, { k: 'ticker', n: 'Jackdot Headlines', u, w: 260, make: r => ({ k: 'ticker', n: 'Jackdot Headlines', u, w: 260, items: scrape(r), grot: true }) }));
  // pages that know your PC
  deco(isSite('www.davesplace.jnet', '/'), (root, u) => {
    const v = visitCookie('www.davesplace.jnet');
    jsBox(root, 'br-js-dave', `<b class="br-blink">HELLO ${esc(who().toUpperCase())}!!!</b> WELCOME 2 MY PAGE!!!<br>${esc(lastVisit(v))} <span class="small">(my page put a COOKIE on ur PC!!! look in C:\\JACKOS\\Cookies)</span><br><span class="small">${esc(screenLine())} ${innerWidth < 800 ? 'ur screen is TINY lol' : 'nice screen!!!'}</span>`, 'background:#000;color:#0f0;border:3px ridge #f00;font:bold 13px "Comic Sans MS",cursive;padding:8px;margin:10px 0;text-align:center');
  });
  const KIMHOST = Cast.t('www.{cousin.slug}spopzone.kidz'); // the cousin's pop page (js/cast.js names the cousin; apps-web.js gives it this host)
  deco(isSite(KIMHOST, '/'), (root, u) => {
    const v = visitCookie(KIMHOST);
    jsBox(root, 'br-js-kim', `~*~ Hiya <b>${esc(who())}</b>!!! ~*~<br>${esc(screenLine())}<br>${innerWidth > 800 ? 'This site is best viewed at 800x600. Yours is BIGGER. Show off! ^_^' : 'This site is best viewed at 800x600 so it should look PERFECT ^_^'}<br><i>${esc(lastVisit(v))}</i>`, 'background:#ffe0f0;color:#c0007a;border:2px dashed #ff66cc;font:13px "Comic Sans MS",cursive;padding:8px;margin:10px 0;text-align:center');
  });
  deco(isSite('www.lookhere.infobahn', '/'), (root, u) => {
    const v = visitCookie('www.lookhere.infobahn'), h = new Date().getHours(), wins = qsa(document, '.appwin').filter(w => w.style.display !== 'none').length + 1;
    const hp = homeUrl();
    jsBox(root, 'br-js-look', `<b>Good ${h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'}, ${esc(who())}!</b> Your computer's clock says it's <b>${hm(Date.now())}</b> on ${esc(long99(Date.now()))}.<br>You have <b>${wins}</b> window${wins > 1 ? 's' : ''} open. JackAmp is <b>${hasJackAmp() ? 'installed' : 'not installed'}</b>. Your home page is <b>${esc(hp || secUrl('home'))}</b>${norm(hp) === norm(u) ? ' (that\'s us! thank you!)' : ''}.<br><span class="small">${esc(lastVisit(v))}</span>`, 'background:#fffbe0;border:1px solid #c9b200;font:12px Verdana,sans-serif;padding:6px 8px;margin:8px 0');
  });
  deco(isSite('www.y2kscan.netz', null), (root, u) => {
    const files = (function count(n) { return (n.kids || []).reduce((s, k) => s + (k.type === 'dir' ? count(k) : 1), 0); })(A.fs.root);
    const progs = (A.programs || []).length, t = Desk.today99();
    jsBox(root, 'br-js-y2k', `<b>LIVE SCAN OF YOUR PC (using JavaScript!!!)</b><br>Browser: JackNet Explorer 5.0 ........ <b>Y2K OK</b><br>System: JackOS 98 ........ <b>Y2K OK*</b><br>Your clock: ${pad(t.d)}/${pad(t.m)}/1999 ........ <b>OK (for now)</b><br>C:\\ drive: ${files.toLocaleString('en-GB')} files ........ <b>OK</b><br>Start menu: ${progs} programs ........ <b>OK</b><br>Screen: ${innerWidth}x${innerHeight}, 256 colours ........ <b>OK</b><br><span class="small">*JackOS 98 will be fine. Jack checked. Twice.</span>`, 'background:#000080;color:#fff;font:12px "Courier New",monospace;padding:8px;margin:8px 0;border:2px solid #ffd400');
  });
  // the magazine notices you: last visit, and whether JackAmp is installed
  function magHello() {
    const home = qs(document, '#s-home'); if (!home) return;
    const v = visitCookie(MAIN);
    let box = $('brMagHello');
    if (!box) { box = document.createElement('div'); box.id = 'brMagHello'; box.className = 'br-mag'; const ed = qs(home, '.ed'); if (ed) ed.insertAdjacentElement('afterend', box); else home.appendChild(box); }
    box.innerHTML = `<span class="br-mag-js">JavaScript says:</span> ${nick() ? `Hi <b>${esc(nick())}</b>! ` : ''}${esc(lastVisit(v))}${hasJackAmp() ? ` <b class="br-mag-amp">&#9733; Our robot spotted JackAmp on your computer! <a href="#" class="br-mag-skins">GET SKINS!!!</a></b>` : ''}`;
    const a = qs(box, '.br-mag-skins'); if (a) a.addEventListener('click', ev => { ev.preventDefault(); IE.navigate('skins'); });
  }

  // ================================================================ every page view: offline, cache, saved files, decorations
  function onSection(detail) {
    const u = $('addrBar').value;
    if (pending && Date.now() - pending.ts < 4000) { // a saved page, opened from the hard disk
      viewing = pending; pending = null;
      $('addrBar').value = viewing.path;
      const t = viewing.rec.t; $('winTitle').textContent = t + ' - JackNet Explorer' + (Net.offline ? ' [Working Offline]' : ''); document.title = t;
      const tb = $('taskBrowser'); if (tb) tb.textContent = t;
      setTimeout(() => { const st = $('brStatus'); if (st) st.textContent = 'Done (from the hard disk)'; }, 1000);
    } else {
      viewing = null;
      if (detail === 'error') return;
      if (Net.offline && !cached(u)) { offlinePage(u); offlineDialog(u); return; }
      if (!Net.offline) remember(u, document.title);
      offTitle();
    }
    if (detail === 'home') magHello();
    const hits = DECOR.filter(([m]) => { try { return m(detail, curUrl()); } catch (e) { return false; } });
    if (!hits.length || String(detail).indexOf(':') < 0) return;
    const at = curUrl(), run = root => hits.forEach(([, fn]) => { try { fn(root, at); } catch (e) { console.error(e); } });
    let done = null; whenDrawn(root => { done = root; run(root); });
    // some sites draw themselves twice (the second time a moment later): decorate the new copy too
    [700, 1800, 3500].forEach(ms => setTimeout(() => { const r = $('s-secret').firstElementChild; if (done && r && (r !== done || !qs(r, '.br-hp, .br-adb, .br-js')) && !/loading|wait/.test(r.className) && curUrl() === at && IE.current === 'secret') { done = r; run(r); } }, ms));
  }
  document.addEventListener('section', ev => setTimeout(() => onSection(ev.detail), 0));

  // ================================================================ Active Desktop items
  // jhp_bridge_ad = [{ id, k: 'hamster'|'weather'|'ticker'|'pic', n, u, x, y, w, items?, p? }]
  let ADS = get('ad', []); if (!Array.isArray(ADS)) ADS = [];
  const adEls = new Map();
  function addToActiveDesktop(def) {
    msg('Security Alert', `Do you want to add a desktop item to your Active Desktop?\n\n${def.n}\n${def.u}\n\n(Desktop items update themselves from the Internet while you're connected.)`, 'warn', [['Yes', () => {
      const b = document.createElement('div');
      b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${big(JI('desktop', 32))}<div style="flex:1;min-width:0"><p style="margin:0 0 8px">You have chosen to add the following desktop item to your Active Desktop.</p><table class="br-kv"><tr><td>Name:</td><td><b>${esc(def.n)}</b></td></tr><tr><td>URL:</td><td class="br-url">${esc(def.u)}</td></tr></table><p class="small" style="margin:8px 0 0">To have this item updated automatically, click Customize Subscription.</p></div></div>
        <div class="row" style="justify-content:flex-end;gap:6px;margin-top:10px"><button class="btn" type="button">Customize Subscription...</button><button class="btn dflt" type="button" style="min-width:72px">OK</button><button class="btn" type="button" style="min-width:72px">Cancel</button></div>`;
      const w = Desk.openWin('Add item to Active Desktop(TM)', b, 400);
      const [cs, ok, cancel] = qsa(b, '.btn');
      cs.addEventListener('click', () => msg('Customize Subscription', 'Update this item: Every few seconds, forever.\n\n(That\'s the only setting. It\'s a hamster. He doesn\'t do schedules.)', 'info'));
      cancel.addEventListener('click', w.close);
      ok.addEventListener('click', () => { w.close(); syncThen(def.n, () => { const it = Object.assign({ id: 'a' + uid() }, def); delete it.make; ADS.push(it); adRender(it); put('ad', ADS); S('activedesk'); toast('Active Desktop', `${def.n} is on your desktop now. Minimise JackNet Explorer to see it. Drag it by the bar at the top.`, 6000); }); });
      setTimeout(() => ok.focus(), 30);
    }], ['No']]);
  }
  function syncThen(name, then) {
    const b = document.createElement('div');
    b.innerHTML = `<p style="margin:0 0 6px">Synchronizing: <b>${esc(name)}</b></p><div class="prog"><span style="display:flex;gap:2px"></span></div><p class="small br-syn" style="margin:6px 0 0">Downloading desktop item...</p>`;
    const w = A.win('Synchronizing', b, { w: 300, noResize: true, noMax: true, noMin: true, icon: JI('desktop', 16) });
    let i = 0; const iv = setInterval(() => { if (w.closed) return clearInterval(iv); qs(b, '.prog span').appendChild(document.createElement('i')); if (++i === 8) qs(b, '.br-syn').textContent = 'Adding to your Active Desktop...'; if (i >= 14) { clearInterval(iv); w.close(); then(); } }, 90);
  }
  // a new item goes in the first free spot: down the right-hand side (left of the Channel Bar), then the next column in
  function placeNew(it, el) {
    const W = innerWidth, H = innerHeight - 40, w = el.offsetWidth || it.w || 200, h = Math.max(el.offsetHeight || 140, (it.ph || 0) + 8);
    const busy = qsa(document, '.br-ad, #sysChan').filter(e => e !== el).map(e => e.getBoundingClientRect()).filter(r => r.width);
    const free = (x, y) => !busy.some(r => x < r.right + 8 && x + w > r.left - 8 && y - 20 < r.bottom + 8 && y + h > r.top - 8);
    if (W < 600) { it.x = Math.max(4, (W - w) / 2); it.y = 40 + (qsa(document, '.br-ad').length - 1) % 4 * 40; return; }
    for (let x = W - w - 16; x > 280; x -= 40) for (let y = 30; y + h < H; y += 20) if (free(x, y)) { it.x = x; it.y = y; return; }
    it.x = Math.max(4, W - w - 200); it.y = 40;
  }
  function adRender(it) {
    const desk = $('desktop'); if (!desk) return;
    const el = document.createElement('div'); el.className = 'br-ad br-ad-' + it.k; el.dataset.id = it.id;
    el.style.width = (it.w || 200) + 'px';
    el.innerHTML = `<div class="br-ad-bar"><button type="button" class="br-ad-m" aria-label="Desktop item menu">&#9660;</button><span class="br-ad-t">${esc(it.n)}</span><button type="button" class="br-ad-x" aria-label="Close">x</button></div><div class="br-ad-in"></div>`;
    const br = $('browser'); desk.insertBefore(el, br || null);
    const clamp = () => { el.style.left = Math.max(0, Math.min(innerWidth - 60, it.x)) + 'px'; el.style.top = Math.max(22, Math.min(innerHeight - 80, it.y)) + 'px'; };
    clamp();
    const bar = qs(el, '.br-ad-bar'); let drag = null;
    bar.addEventListener('pointerdown', ev => { if (ev.target.closest('button')) return; drag = { dx: ev.clientX - it.x, dy: ev.clientY - it.y }; bar.setPointerCapture(ev.pointerId); el.classList.add('drag'); });
    bar.addEventListener('pointermove', ev => { if (!drag) return; it.x = ev.clientX - drag.dx; it.y = ev.clientY - drag.dy; clamp(); });
    const up = () => { if (!drag) return; drag = null; el.classList.remove('drag'); it.x = parseInt(el.style.left, 10); it.y = parseInt(el.style.top, 10); put('ad', ADS); };
    bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
    qs(el, '.br-ad-x').addEventListener('click', () => adClose(it));
    qs(el, '.br-ad-m').addEventListener('click', ev => { const r = ev.currentTarget.getBoundingClientRect(); IE.menu(adMenu(it), r.left, r.bottom); });
    el.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); IE.menu(adMenu(it), ev.clientX, ev.clientY); });
    adEls.set(it.id, el);
    const inner = qs(el, '.br-ad-in');
    try { (AD_KINDS[it.k] || AD_KINDS.pic)(inner, it); } catch (e) { inner.textContent = 'This desktop item could not be displayed.'; }
    if (it.x == null) { placeNew(it, el); clamp(); }
    window.addEventListener('resize', clamp);
  }
  function adClose(it) {
    const el = adEls.get(it.id); if (el) { if (el._stop) el._stop(); el.remove(); } adEls.delete(it.id);
    ADS = ADS.filter(a => a.id !== it.id); put('ad', ADS);
  }
  function adMenu(it) {
    return [
      { label: 'Open in Browser', act: () => openUrl(it.u) },
      { label: 'Synchronize', act: () => syncThen(it.n, () => { const el = adEls.get(it.id); if (el) { if (el._stop) el._stop(); const inner = qs(el, '.br-ad-in'); inner.innerHTML = ''; (AD_KINDS[it.k] || AD_KINDS.pic)(inner, it); } }) },
      '-', { label: 'Customize my Desktop...', act: () => { if (!A.run('desk.cpl')) A.open('system.themes'); } },
      { label: 'Properties', act: () => msg(it.n + ' Properties', `Desktop item: ${it.n}\nURL: ${it.u}\nUpdates: automatically, while you're online.\nSize: ${it.w || 200} pixels wide.`, 'info') },
      '-', { label: 'Close', act: () => adClose(it) },
    ];
  }
  const liveTick = (el, ms, fn) => { const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); if (!document.hidden) fn(); }, ms); el.closest('.br-ad')._stop = () => clearInterval(iv); fn(); };
  const AD_KINDS = {
    hamster(inner, it) {
      inner.innerHTML = '<canvas width="160" height="120" class="br-cam" title="Click to visit Hamster Cam"></canvas><div class="br-cam-cap">' + Cast.n('hamster') + ' is: <b></b></div>';
      const c = qs(inner, 'canvas'), x = c.getContext('2d'), cap = qs(inner, 'b');
      c.addEventListener('click', () => openUrl(it.u));
      let ang = 0, f = 0;
      liveTick(inner, 1000, () => {
        f++; const h = new Date().getHours(), night = h >= 20 || h < 7;
        const mood = Net.offline ? 'offline' : night ? (f % 7 < 5 ? 'running' : 'eating') : (f % 23 < 16 ? 'sleeping' : f % 23 < 20 ? 'eating' : 'running');
        x.fillStyle = '#5a3a1a'; x.fillRect(0, 0, 160, 120);
        for (let i = 0; i < 160; i += 8) { x.fillStyle = '#3a2410'; x.fillRect(i, 0, 1, 92); }
        x.fillStyle = '#d8b878'; x.fillRect(0, 92, 160, 28);
        for (let i = 0; i < 40; i++) { x.fillStyle = i % 2 ? '#c8a060' : '#e8c890'; x.fillRect((i * 37 + f * (mood === 'running' ? 3 : 0)) % 160, 94 + (i * 13) % 24, 3, 1); }
        // the wheel
        const cx = 54, cy = 62, R = 30; x.strokeStyle = '#c8c8c8'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke();
        if (mood === 'running') ang += 0.9;
        x.lineWidth = 1; for (let k = 0; k < 6; k++) { const a = ang + k * Math.PI / 3; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.stroke(); }
        x.fillStyle = '#888'; x.fillRect(cx - 2, cy, 4, 32);
        // the food bowl and the bottle
        x.fillStyle = '#e0e0e0'; x.fillRect(118, 84, 26, 9); x.fillStyle = '#c89a40'; x.fillRect(121, 82, 20, 3);
        x.fillStyle = 'rgba(160,200,255,.7)'; x.fillRect(140, 14, 10, 34); x.fillStyle = '#888'; x.fillRect(143, 48, 4, 10);
        // the hamster
        const nx = mood === 'running' ? cx - 10 + (f % 2) : mood === 'eating' ? 104 : 76, ny = mood === 'running' ? cy + 14 : 78;
        x.fillStyle = '#e8a850'; x.fillRect(nx, ny, 22, 13); x.fillRect(nx + 18, ny - 4, 10, 11);
        x.fillStyle = '#fff2d8'; x.fillRect(nx + 4, ny + 8, 12, 5);
        x.fillStyle = '#c07830'; x.fillRect(nx + 20, ny - 7, 4, 4);
        x.fillStyle = '#000'; if (mood === 'sleeping') x.fillRect(nx + 23, ny - 1, 3, 1); else x.fillRect(nx + 24, ny - 2, 2, 2);
        if (mood === 'sleeping') { x.fillStyle = '#fff'; x.font = 'bold 10px monospace'; x.fillText('z', nx + 30, ny - 8 - (f % 3) * 3); x.fillText('Z', nx + 36, ny - 16 - (f % 3) * 2); }
        if (mood === 'offline') { x.fillStyle = 'rgba(0,0,0,.75)'; x.fillRect(0, 0, 160, 120); x.fillStyle = '#fff'; x.font = 'bold 11px monospace'; x.fillText('NO SIGNAL', 48, 58); x.font = '9px monospace'; x.fillText('(you are offline)', 34, 72); }
        x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, 0, 160, 12);
        x.font = '9px monospace'; x.fillStyle = f % 2 ? '#f33' : '#900'; x.fillText('\u25CF LIVE', 3, 9);
        const d = new Date(); x.fillStyle = '#3f3'; x.fillText(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`, 106, 9);
        cap.textContent = mood;
      });
    },
    weather(inner, it) {
      inner.innerHTML = '<div class="br-wx">Loading the forecast...</div>';
      const box = qs(inner, '.br-wx');
      const draw = list => {
        if (!list || !list.length) { box.textContent = 'Rain. Probably. (The forecast didn\'t download.)'; return; }
        const t = list[0];
        box.innerHTML = `<div class="br-wx-top"><span class="br-wx-ic">${esc(t.icon)}</span><div><b>Today</b><br>${esc(t.desc)}<br><span class="small">${t.hi}&deg; / ${t.lo}&deg;</span></div></div><div class="br-wx-next">${list.slice(1, 4).map(d => `<span><b>${esc(d.day)}</b><br><span class="br-wx-s">${esc(d.icon)}</span><br>${d.hi}&deg;</span>`).join('')}</div><div class="small br-wx-f">JackNet Weather &middot; updated ${hm(Date.now())}</div>`;
      };
      const go = () => { try { if (window.WebPack && WebPack.weather) return draw(WebPack.weather(Desk.today99())); } catch (e) {} A.load('js/web-p4.js').then(() => draw(window.WebPack && WebPack.weather ? WebPack.weather(Desk.today99()) : null)).catch(() => draw(null)); };
      go(); inner.addEventListener('click', () => openUrl(it.u));
    },
    ticker(inner, it) {
      let items = (it.items || []).filter(Boolean);
      if (items.length < 3) items = items.concat(((window.CAL && CAL.posts) || []).filter(p => { const [m, d] = p[0].split('-').map(Number); return m * 100 + d <= Desk.today99().md; }).slice(-6).reverse().map(p => String(p[2]).replace(/<[^>]+>/g, '').slice(0, 90)));
      if (!items.length) items = ['Nothing has happened today. Gubbinz is asleep.'];
      inner.innerHTML = `<div class="br-tk${it.grot ? ' grot' : ''}"><div class="br-tk-h">${it.grot ? 'JACKDOT' : 'JACKNET NEWS'} <i>LIVE</i></div><div class="br-tk-s"><span>${items.map(esc).join(' &nbsp;&#9733;&nbsp; ')}</span></div><div class="br-tk-l"></div></div>`;
      const list = qs(inner, '.br-tk-l');
      let i = 0; liveTick(inner, 5000, () => { list.textContent = '\u25B8 ' + items[i++ % items.length]; });
      inner.addEventListener('click', () => openUrl(it.u));
    },
    pic(inner, it) {
      const d = picData(it.p);
      inner.innerHTML = d ? `<img alt="${esc(it.n)}" class="br-adpic">` : '<div class="br-wx">This picture has been deleted from My Pictures.</div>';
      if (d) { const im = qs(inner, 'img'); im.src = d; if (it.ph) im.style.height = it.ph + 'px'; }
    },
  };

  // ================================================================ styles
  const css = document.createElement('style');
  css.textContent = `
.br-i32{display:inline-flex;width:32px;height:32px;flex:none}.br-i32 svg{width:32px;height:32px}
.br-i16{display:inline-flex;width:16px;height:16px;flex:none;vertical-align:-3px}.br-i16 svg{width:16px;height:16px}
.br-ell{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.br-kv{font:12px var(--ui);border-collapse:collapse;width:100%;table-layout:fixed}.br-kv td{padding:2px 4px 2px 0;vertical-align:top}.br-kv td:first-child{width:104px;white-space:nowrap}.br-url{word-break:break-all}
.br-sv{font:11px/1.4 var(--ui)}.br-sv-top{flex-wrap:nowrap;gap:6px}.br-sv-top select{flex:1;min-width:0}.br-up{min-width:0!important;padding:0 6px}
.br-list{height:150px;overflow:auto;margin:6px 0;padding:2px;display:flex;flex-direction:column;flex-wrap:wrap;align-content:flex-start;gap:0 8px}
.br-li{display:flex;align-items:center;gap:4px;background:none;border:0;padding:1px 3px;font:11px var(--ui);text-align:left;max-width:180px;cursor:default;color:#000}.br-li span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.br-li.sel{background:#000080;color:#fff}
.br-empty{color:#808080;padding:6px}
.br-sv-grid{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px 8px;align-items:center}.br-sv-grid input,.br-sv-grid select{min-width:0;width:100%;box-sizing:border-box}.br-sv-grid .btn{min-width:72px}
.br-rad{display:flex;gap:5px;align-items:center;margin:2px 0}
.br-dl{font:11px/1.4 var(--ui)}.br-dl-anim{position:relative;height:42px;margin:2px 0 8px}.br-dl-anim .a{position:absolute;top:4px}.br-dl-anim .l{left:4px}.br-dl-anim .r{right:4px}
.br-dl-anim .pp{position:absolute;top:10px;left:44px;width:12px;height:14px;background:#fff;border:1px solid #000;animation:brfly 1.2s linear infinite}.br-dl-anim .pp:nth-child(4){animation-delay:.4s}.br-dl-anim .pp:nth-child(5){animation-delay:.8s}
@keyframes brfly{0%{left:40px;top:14px;opacity:0}15%{opacity:1}50%{top:0}85%{opacity:1}100%{left:calc(100% - 56px);top:14px;opacity:0}}
.br-dl.done .pp{animation:none;opacity:0}.br-dl-grid{display:grid;grid-template-columns:auto minmax(0,1fr);gap:2px 10px;margin:8px 0}.br-dl-grid span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dicon.br-new span{background:#000080;color:#fff}
body.br-dragon #desktop .icons{outline:2px dashed rgba(255,255,255,.5);outline-offset:-2px}body.br-dragon{user-select:none}
.br-ghost{position:fixed;z-index:2147483000;pointer-events:none;display:flex;flex-direction:column;align-items:center;font:11px var(--ui);color:#fff;opacity:.6;width:80px;text-align:center}.br-ghost span{background:#000080;padding:0 2px}.br-ghost.ok{opacity:.95}
.br-pgdrag{display:inline-flex;cursor:grab;flex:none}
#brDun{background:none;border:0;padding:0 2px;cursor:pointer;display:inline-flex;align-items:center}#brDun .x{display:none}#brDun.off .x{display:inline}#brDun.off .l1,#brDun.off .l2{fill:#555}#brDun.rx .l1{fill:#8f8}#brDun.tx .l2{fill:#8f8}
.br-off{max-width:560px;margin:24px auto;background:#fff;color:#000;font:12px/1.5 Verdana,Tahoma,sans-serif;padding:16px 20px;border:1px solid #808080}.br-off-h{display:flex;gap:12px;align-items:center;font-size:14px}.br-off a{color:#00f}
.br-hp{margin:8px 0;text-align:center}.br-hpa{display:inline-flex;align-items:center;gap:5px;font:bold 13px Verdana,Arial,sans-serif;color:#00e!important;text-decoration:underline;background:#ffffcc;border:1px solid #c9b200;padding:3px 8px}
.br-adb{display:flex;align-items:center;gap:8px;justify-content:center;flex-wrap:wrap;margin:8px 0;font:11px Verdana,sans-serif}
.br-adbtn{display:inline-flex;align-items:center;gap:6px;font:bold 11px Tahoma,Verdana,sans-serif;color:#fff;background:linear-gradient(#3a7ad8,#0a3a9a);border:1px solid #001a5a;border-radius:10px;padding:4px 12px 4px 8px;cursor:pointer;box-shadow:inset 1px 1px rgba(255,255,255,.5)}
.br-js{border-radius:0}.br-blink{animation:brblink 1s steps(1) infinite}@keyframes brblink{50%{visibility:hidden}}
body.noanim .br-blink{animation:none}
.br-mag{margin:10px 0;padding:6px 10px;background:#ffffe1;border:1px dashed #c9b200;color:#000;font-size:13px}.br-mag-js{font:bold 10px "Courier New",monospace;background:#000;color:#0f0;padding:1px 4px;margin-right:4px}.br-mag-amp{color:#a00}.br-mag a{color:#00e}
.br-ad{position:absolute;z-index:1;background:#c0c0c0;border:2px solid;border-color:#fff #404040 #404040 #fff;box-shadow:1px 1px 0 #000;font:11px var(--ui);color:#000}
.br-ad-bar{display:flex;align-items:center;gap:3px;height:16px;padding:1px 2px;background:linear-gradient(90deg,#808080,#c0c0c0);color:#fff;cursor:move;opacity:0;transition:opacity .15s;touch-action:none;position:absolute;left:-2px;right:-2px;top:-20px;border:1px solid #404040}
.br-ad:hover .br-ad-bar,.br-ad:focus-within .br-ad-bar,.br-ad.drag .br-ad-bar{opacity:1}
@media (hover:none){.br-ad-bar{opacity:1}}
.br-ad-bar button{width:14px;height:13px;padding:0;font:bold 8px/1 var(--ui);background:#c0c0c0;border:1px solid;border-color:#fff #000 #000 #fff;color:#000;cursor:pointer;flex:none}
.br-ad-t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:bold}
.br-ad-in{background:#000;display:block;cursor:pointer}
.br-cam{display:block;width:100%;image-rendering:pixelated}.br-cam-cap{background:#000;color:#3f3;font:10px "Courier New",monospace;padding:1px 4px}
.br-wx{background:#eef6ff;color:#123;padding:6px;font:11px Verdana,sans-serif}.br-wx-top{display:flex;gap:8px;align-items:center}.br-wx-ic{font-size:30px;line-height:1}.br-wx-next{display:flex;justify-content:space-around;text-align:center;margin-top:6px;border-top:1px solid #9bc;padding-top:4px}.br-wx-s{font-size:16px}.br-wx-f{margin-top:4px;color:#369}
.br-tk{background:#000080;color:#fff;font:11px Verdana,sans-serif}.br-tk.grot{background:#1a3a0a}.br-tk-h{background:#ffd400;color:#000;font-weight:bold;padding:1px 6px;display:flex;justify-content:space-between}.br-tk-h i{color:#c00;font-style:normal;animation:brblink 1s steps(1) infinite}
.br-tk-s{overflow:hidden;white-space:nowrap;padding:3px 0}.br-tk-s span{display:inline-block;padding-left:100%;animation:brtick 40s linear infinite}@keyframes brtick{to{transform:translateX(-100%)}}
.br-tk-l{padding:3px 6px 5px;min-height:28px;color:#cfe}
.br-adpic{display:block;width:100%}
.br-skins{max-width:720px;margin:0 auto;padding:14px 18px;background:#fff;color:#000;font:13px/1.45 Verdana,Arial,sans-serif;border:4px ridge #5b16c9}.br-skins h1{font:bold 28px Impact,sans-serif;color:#5b16c9;margin:0 0 6px;letter-spacing:1px}.br-skins a{color:#00e}
.br-skins-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin:10px 0}.br-skin{border:2px solid #5b16c9;padding:8px;background:#f4f0ff}.br-skin p{margin:4px 0 6px;font-size:12px}
.br-skin-pv{height:46px;border:2px solid #000;display:flex;align-items:center;gap:4px;padding:4px;margin-bottom:6px}.br-skin-pv i{font:bold 18px "Courier New",monospace;background:#000;padding:2px 4px;margin-right:auto}.br-skin-pv span{width:18px;height:14px;border:1px solid}
.br-skins-warn{background:#ffe0e0;border:1px solid #c00;padding:6px}
@media (max-width:560px){.br-sv-grid{grid-template-columns:auto minmax(0,1fr)}.br-sv-grid .btn{grid-column:2;justify-self:end}.br-list{height:110px}}
` + skinCss();
  document.head.appendChild(css);

  // ================================================================ start up
  function init() {
    // the little page icon in the Address bar can be dragged onto the desktop
    const pg = qs(document, '#bandAddr .pgico');
    if (pg && !pg.parentElement.classList.contains('br-pgdrag')) { const w = document.createElement('span'); w.className = 'br-pgdrag'; w.draggable = true; w.title = 'Drag this onto the desktop to make a shortcut to this page'; pg.parentNode.insertBefore(w, pg); w.appendChild(pg); }
    DESK.forEach(it => { try { deskRender(it); } catch (e) { console.error(e); } });
    PAGES.forEach(rec => { try { pageNodes(rec); } catch (e) { console.error(e); } });
    CACHE.forEach(tifNode);
    Object.keys(CK).forEach(ckNode);
    skinNodes(); applySkin(get('jskin', ''), true);
    (store.get('jhp_favs', []) || []).filter(f => f && f.url).forEach(f => A.fs.add('C:/JACKOS/Favorites', { name: cleanName(f.title) + '.url', type: 'lnk', web: f.url, date: d99(), size: '1 KB', br: 'fav' }));
    const wall = store.get('jhp_prog_wall', null);
    if (get('wallfile', 0) && wall && wall.img) A.fs.add('C:/JACKOS', { name: 'JackNet Explorer Wallpaper.bmp', type: 'png', dataURL: wall.img, date: d99(), size: Math.max(1, Math.round(wall.img.length * 0.75 / 1024)) + ' KB', br: 'wall' });
    ADS.forEach(it => { try { adRender(it); } catch (e) { console.error(e); } });
    trayIcon();
    if (IE.current === 'home') magHello();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else setTimeout(init, 0);
  A.cmd(['skins', 'jackamp skins'], () => { showBrowser(); IE.navigate('skins'); });

  window.Bridge = { pageMenu, saveAs, toggleOffline, goOnline, goOffline, shortcut: () => IE.current === 'error' ? null : deskShortcut(curUrl(), curTitle()), addFav: (u, t) => addFavUrl(u || curUrl(), t || curTitle()), askHome, openUrl, openSaved, renderPicture, cached, get viewing() { return viewing; } };
})();
