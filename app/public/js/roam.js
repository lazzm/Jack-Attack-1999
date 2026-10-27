/* Roaming profiles (see mods/roam.js). Everything the PC remembers lives in localStorage under jhp_* keys. For a
 * JackNet member, those keys are uploaded to the server (gzip + base64, in chunks) and downloaded again when they
 * log on from another computer, so their desktop, files, settings, secrets and saves follow them about.
 * A guest who signs up keeps what they made as a guest: it becomes their profile.
 *   Roam.logoff() -> Promise: saves the profile now, then gives the PC back to the guest (call before reloading).
 *   Roam.syncNow() -> Promise: uploads straight away (if anything changed). */
(function () {
  // device-only keys never roam: who this browser is, boot state, window geometry, the roaming bookkeeping itself
  const LOCAL = /^jhp_(cid|token|clean|booted|everbooted|forceboot|win|max|logon_seen|roam_.*|site_prompted|gsl_.*)$/; // (jhp_gsl_*: big saved games stay on this PC, js/gamesave.js)
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
    keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch (e) {} return out; },
  };
  const roaming = () => ls.keys().filter(k => k && k.startsWith('jhp_') && !LOCAL.test(k)).sort();
  function snapshot() { const o = {}; roaming().forEach(k => { o[k] = ls.get(k); }); return o; }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + str.length; }
  function wipe() { roaming().forEach(ls.del); }
  function apply(obj) { wipe(); Object.keys(obj || {}).forEach(k => { if (k.startsWith('jhp_') && !LOCAL.test(k) && typeof obj[k] === 'string') ls.set(k, obj[k]); }); }
  // Apply downloaded profiles before room/media modules start, not while the
  // previous user's in-memory timers can save their inventory over the new one.
  try{const pending=JSON.parse(sessionStorage.getItem('jhp_roam_pending')||'null');if(pending?.obj&&typeof pending.name==='string'){apply(pending.obj);ls.set('jhp_roam_who',pending.name);ls.set('jhp_roam_ts',String(pending.ts));ls.set('jhp_roam_hash',hash(JSON.stringify(snapshot())));if(pending.ownerRev!==undefined)ls.set('jhp_roam_ownerRev',String(pending.ownerRev));sessionStorage.removeItem('jhp_roam_pending')}}catch(e){try{sessionStorage.removeItem('jhp_roam_pending')}catch(ignore){}}

  // ---- gzip + base64 (falls back to plain base64 on browsers without CompressionStream)
  const toB64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  const fromB64 = b64 => Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
  async function pack(str) {
    const raw = new TextEncoder().encode(str);
    if (window.CompressionStream) {
      try { const buf = await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer(); return { enc: 'gzip', data: toB64(new Uint8Array(buf)) }; } catch (e) {}
    }
    return { enc: 'raw', data: toB64(raw) };
  }
  async function unpack(enc, data) {
    const bytes = fromB64(data);
    if (enc === 'gzip') { const buf = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(); return new TextDecoder().decode(buf); }
    return new TextDecoder().decode(bytes);
  }

  let who = ls.get('jhp_roam_who') || '', busy = false, lastHash = ls.get('jhp_roam_hash') || '', waiters = [],switching=false;
  const me = () => (Net.me && Net.me.member ? Net.me.nick : '');

  // ---- upload: chunks of 3000 base64 chars, paced so the server's rate limit is happy
  async function upload(force, now) {
    const name = me();
    if (!name || who.toLowerCase() !== name.toLowerCase() || busy || switching) return false;
    const str = JSON.stringify(snapshot()), h = hash(str);
    if (!force && h === lastHash) return true;
    busy = true;
    try {
      const { enc, data } = await pack(str);
      if(switching)return false;
      const id = Math.random().toString(36).slice(2, 10), n = Math.max(1, Math.ceil(data.length / 3000));
      for (let i = 0; i < n; i++) {
        if(switching||me().toLowerCase()!==name.toLowerCase())return false;
        if (!Net.send({ t: 'rmPut', id, i, n, d: data.slice(i * 3000, (i + 1) * 3000), ts: Date.now(), enc, base: +(ls.get('jhp_roam_ts') || 0), ownerRev: +(ls.get('jhp_roam_ownerRev')||0), ...(now ? { now: 1 } : {}) })) { busy = false; return false; }
        if (i % 10 === 9) await new Promise(r => setTimeout(r, 700));
      }
      const ok = await new Promise(res => { waiters.push(res); setTimeout(() => res(false), 8000); });
      if (ok) { lastHash = h; ls.set('jhp_roam_hash', h); }
      return ok;
    } finally { busy = false; }
  }
  Net.on('rmSaved', m => { ls.set('jhp_roam_ts', String(m.ts)); const w = waiters; waiters = []; w.forEach(f => f(true)); });
  Net.on('rmErr', m => { const w = waiters; waiters = []; w.forEach(f => f(false)); if (window.Desk) Desk.toast('Roaming profile', m.msg, 5000); });
  Net.on('rmBusy', () => { const w = waiters; waiters = []; w.forEach(f => f(false)); });

  // ---- what a guest made on this PC: so signing up can say what it's copying, and logging on to an old account can ask
  const J = s => { try { return JSON.parse(s); } catch (e) { return null; } };
  const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  function made(o) {
    const n = v => { const x = J(v); return Array.isArray(x) ? x.length : isObj(x) ? Object.keys(x).length : 0; };
    let scores = 0; const gs = J(o.jhp_guest_scores); if (isObj(gs)) for (const k in gs) scores += Array.isArray(gs[k]) ? gs[k].length : 0;
    const files = n(o.jhp_files_docs) + n(o.jhp_prog_pics), secrets = n(o.jhp_secrets);
    return { files, secrets, scores, kb: Math.max(1, Math.ceil(JSON.stringify(o).length / 1024)), any: files > 0 || scores > 0 || secrets >= 3 };
  }
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  // the member's saved profile with the guest's things added in (the member's copy wins a clash; a clashing file is kept as "Copy of")
  function merge(mem, guest) {
    const out = Object.assign({}, mem);
    for (const k of Object.keys(guest)) {
      if (k === 'jhp_setup') continue; // the member's own installed programs win (setup.js: an old profile without one must not look like a fresh PC)
      if (!(k in out)) { out[k] = guest[k]; continue; }
      const a = J(out[k]), b = J(guest[k]);
      if (Array.isArray(a) && Array.isArray(b)) { const seen = new Set(a.map(x => JSON.stringify(x))); out[k] = JSON.stringify(a.concat(b.filter(x => !seen.has(JSON.stringify(x))))); }
      else if (isObj(a) && isObj(b)) {
        const o = Object.assign({}, b, a);
        if (k === 'jhp_files_docs') for (const f of Object.keys(b)) if (a[f] && JSON.stringify(a[f]) !== JSON.stringify(b[f])) o['Copy of ' + f] = b[f];
        out[k] = JSON.stringify(o);
      }
    }
    return out;
  }
  // our boxes wait for the full-screen JackNet logon (js/site.js) to finish fading away
  // (and, at switch-on, for the dial-up box to finish)
  let booted = false, hooked = false; // (boot.js loads after this file, so BootDone is looked up when it's needed)
  const waiting = () => { if(window.AccountGate&&AccountGate.blocked)return false; if (!hooked && window.BootDone) { hooked = true; BootDone.then(() => { booted = true; }); } return (!booted && !!window.BootDone) || !!document.querySelector('.jlogoff'); };
  const afterLogon = fn => { const t0 = Date.now(); (function poll() { if (waiting() && Date.now() - t0 < 15000) return setTimeout(poll, 150); fn(); })(); };
  // a 1999 file-copy box that waits for the upload ("Copying your files and settings to JackNet...")
  function copying(m, done, up) {
    up = up || upload(true); // the copy starts straight away: the box only shows it (once the screen is free)
    if (!window.Desk || !Desk.openWin) { up.then(ok => done && done(ok)); return; }
    if (waiting()) return afterLogon(() => copying(m, done, up));
    const b = document.createElement('div');
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:12px;align-items:flex-start"><svg viewBox="0 0 96 34" width="96" height="34" aria-hidden="true" style="flex:none"><path d="M2 10h11l3 3h12v17H2z" fill="#f2d16b" stroke="#7a5a00"/><circle cx="80" cy="18" r="13" fill="#2a7ad8" stroke="#000"/><path d="M70 12q6 4 4 10t6 8M86 7q-4 6 2 10t4 6" fill="none" stroke="#3a9a2a" stroke-width="3"/><g><path d="M0 0h9l3 3v11H0z" fill="#fff" stroke="#000"/><path d="M2 5h7M2 8h7M2 11h5" stroke="#000080"/><animateTransform attributeName="transform" type="translate" values="12 6;40 -2;62 8" keyTimes="0;.5;1" dur="1.1s" repeatCount="indefinite"/></g></svg>
      <div style="flex:1;min-width:0"><p class="rm-h" style="margin:0 0 4px">Copying your files and settings to JackNet...</p><div style="font-size:11px;color:#444">Desktop, My Documents (${plural(m.files, 'file')}), high scores (${m.scores}), secrets (${m.secrets}), settings</div>
      <div class="prog" style="margin-top:8px"><span style="display:flex;gap:2px" class="rm-bar"></span></div><p class="rm-st" style="margin:6px 0 0;font-size:11px">Sending ${m.kb} KB at 49,333 bps...</p></div></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" type="button" disabled style="min-width:75px">OK</button></div>`;
    const w = Desk.openWin('Copying to JackNet', b, 380);
    const bar = b.querySelector('.rm-bar'), st = b.querySelector('.rm-st'), btn = b.querySelector('button'), t0 = Date.now();
    const iv = setInterval(() => { if (bar.children.length < 22) bar.appendChild(document.createElement('i')); }, 90);
    let closed = false; const fin = ok => { if (closed) return; closed = true; w.close(); if (done) done(ok); };
    btn.addEventListener('click', () => fin(true));
    up.then(ok => setTimeout(() => {
      clearInterval(iv); while (ok && bar.children.length < 26) bar.appendChild(document.createElement('i'));
      const sv = b.querySelector('svg g'); if (sv) sv.remove();
      b.querySelector('.rm-h').innerHTML = ok ? '<b>Done!</b> Your stuff is on JackNet now.' : '<b>JackNet is busy.</b> Your stuff is safe on this PC.';
      st.textContent = ok ? 'Log on from any computer and your desktop, files, high scores and secrets will be there.' : 'JackOS will try copying it again in a minute. (Somebody probably picked up the phone.)';
      btn.disabled = false; btn.focus();
      setTimeout(() => fin(ok), 6000);
    }, Math.max(0, 1600 - (Date.now() - t0)))).catch(() => fin(false));
  }
  // a guest who made things logs on to an account that already has a saved profile: which one do they want?
  function choose(name, m, cb) {
    if (!window.Desk || !Desk.openWin) return cb(false);
    if (waiting()) return afterLogon(() => choose(name, m, cb));
    const b = document.createElement('div');
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:12px;align-items:flex-start"><svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" style="flex:none"><circle cx="16" cy="16" r="14" fill="#fff" stroke="#000080" stroke-width="2"/><text x="16" y="23" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#000080">?</text></svg>
      <div style="flex:1;min-width:0"><p style="margin:0 0 6px">Welcome back, <b></b>!</p><p style="margin:0 0 6px">While you were a guest on this computer you made some things: ${plural(m.files, 'file')}, ${plural(m.secrets, 'secret')} found and ${plural(m.scores, 'high score')}.</p><p style="margin:0">You've also got a saved JackNet profile. Which do you want?</p></div></div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:12px"><button class="btn dflt" type="button" data-k style="text-align:left;padding:5px 8px">Keep the files on this computer and <u>a</u>dd them to my profile</button><button class="btn" type="button" data-u style="text-align:left;padding:5px 8px"><u>U</u>se my saved JackNet profile <small>(the guest's things stay on this PC)</small></button></div>`;
    b.querySelector('b').textContent = name;
    const w = Desk.openWin('JackNet - Your Profile', b, 380);
    if(window.AccountGate&&AccountGate.blocked)AccountGate.profile(w.el);
    let picked = false; const pick = keep => { if (picked) return; picked = true; w.close(); cb(keep); };
    b.querySelector('[data-k]').addEventListener('click', () => pick(true));
    b.querySelector('[data-u]').addEventListener('click', () => pick(false));
    const x = w.el.querySelector('.tb button'); if (x) x.addEventListener('click', () => pick(false)); // closing it = keep what's saved (nothing is lost: the guest's things wait on this PC)
    w.el.addEventListener('keydown', ev => { if (ev.key === 'Escape') pick(false); });
    setTimeout(() => b.querySelector('[data-k]').focus(), 30);
    if (window.Sound) Sound.play('uhoh');
  }

  // ---- on log on: fetch the member's profile; bring it down if it's theirs from elsewhere, or claim the local one
  function loaded(fn) { if (window.Desk && Desk.msgbox) Desk.msgbox('JackNet', 'Loading your personal settings...\n\nYour desktop, files and saves are on their way down the phone line.', 'info'); setTimeout(fn, 900); }
  function onMember() {
    const name = me(); if (!name) return;
    const mine = who.toLowerCase() === name.toLowerCase();
    Net.send({ t: 'rmGet', since: mine ? +(ls.get('jhp_roam_ts') || 0) : 0, ownerRev: +(ls.get('jhp_roam_ownerRev')||0) });
  }
  Net.on('ownerReload', async m => {
    if (!window.OwnerTools?.allowed || !m.profile) return;
    switching=true; busy=true; // No pagehide upload of the old in-memory room.
    const obj=JSON.parse(await unpack(m.profile.enc,m.profile.data));
    sessionStorage.setItem('jhp_roam_pending',JSON.stringify({obj,name:me(),ts:m.profile.ts,ownerRev:m.ownerRev}));
    location.reload();
  });
  Net.on('rmData', async m => {
    const name = me(); if (!name) return;
    let obj;
    try { obj = JSON.parse(await unpack(m.enc, m.data)); } catch (e) { console.warn('roam: bad profile', e); return; }
    const guest = !who ? snapshot() : null, gm = guest ? made(guest) : null;
    const take = keep => {
      if (me().toLowerCase() !== name.toLowerCase()) return; // logged off while deciding
      if (guest && !keep) ls.set('jhp_roam_guest', JSON.stringify(guest)); // keep the guest's stuff for when they log off
      if (guest && keep) ls.del('jhp_roam_guest'); // moved into the profile
      if(!keep){switching=true;try{sessionStorage.setItem('jhp_roam_pending',JSON.stringify({obj,name,ts:m.ts,ownerRev:m.ownerRev}))}catch(e){apply(obj);ls.set('jhp_roam_who',name);ls.set('jhp_roam_ts',String(m.ts))}location.reload();return;}
      apply(keep ? merge(obj, guest) : obj);
      who = name; ls.set('jhp_roam_who', name); ls.set('jhp_roam_ts', String(m.ts)); lastHash = keep ? '' : hash(JSON.stringify(snapshot())); ls.set('jhp_roam_hash', lastHash);
      if (keep) copying(made(snapshot()), () => location.reload());
      else loaded(() => location.reload());
    };
    // A starter profile is deliberate: never merge the pre-login demo inventory into it.
    if(obj.jhp_starter==='1'||window.AccountGate?.blocked)take(false);else if (gm && gm.any) choose(name, gm, take); else take(false);
  });
  Net.on('rmSame', () => { /* up to date */ });
  Net.on('rmNone', m => {
    if (m.guest) return;
    // first time on the server: whatever is on this PC becomes their profile (signing up keeps your guest session)
    const name = me(); if (!name) return;
    const wasGuest = !who;
    if (who && who.toLowerCase() !== name.toLowerCase()) { apply({}); ls.del('jhp_roam_guest'); } // someone else's profile is on this PC: start clean
    who = name; ls.set('jhp_roam_who', name);
    if (wasGuest) copying(made(snapshot())); // a guest who just signed up: show their stuff going up to JackNet
    else upload(true);
  });
  Net.on('welcome', m => { if (m.member) onMember(); else if (who) giveBack(); }); // token gone: never show a member's desktop to a guest
  Net.on('loginOk', () => setTimeout(onMember, 50));
  Net.on('you', m => { if (!m.member && who) giveBack(); }); // logged off from elsewhere

  // ---- log off: save, then hand the PC back to the guest
  function giveBack() {
    const guest = ls.get('jhp_roam_guest');
    let g = {}; try { g = guest ? JSON.parse(guest) : {}; } catch (e) {}
    apply(g); ls.del('jhp_roam_guest');
    who = ''; ls.del('jhp_roam_who'); ls.del('jhp_roam_ts'); ls.del('jhp_roam_hash'); lastHash = '';
  }
  async function logoff() { try { await upload(true); } catch (e) {} giveBack(); }

  setInterval(() => { upload(false); }, 45000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) upload(false); });

  window.Roam = { logoff, syncNow: () => upload(false, true), get owner() { return who; } };
})();
