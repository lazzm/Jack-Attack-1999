/* guest.js: GUESTS vs MEMBERS. One gate for every JackNet members-only thing on the PC and the website.
 *   Guest.is()                -> true for a guest (anyone not logged on to JackNet as a member)
 *   Guest.need(what, then)    -> a member: runs then() and returns true. A guest: shows the "JackNet Members Only"
 *                                box ("<what> is only for JackNet members...") and returns false; Join / Log On opens the
 *                                JackNet logon, and after a successful logon then() runs.
 *   Guest.badge(text)         -> HTML for a little web-page "MEMBERS ONLY" sticker
 *   Guest.webNote(what)       -> HTML for a web-page box: "<what> is for JackNet members. [Log on] / [Join FREE!]"
 *   Guest.lockIcon(svg)       -> the same icon with a small padlock on it (Start menu items guests can't fully use)
 *   Guest.lockItem(item, prog)-> Start menu item for a guest: padlocked icon, and the members-only box before it opens
 * Also a network backstop: if anything still tries to send a members-only message as a guest (a high score, a forum
 * post, a JackBay bid...), it is held back and the members-only box explains instead. The server refuses them anyway.
 * Loads straight after js/net.js (it only touches Desk, Apps and JackLogon when it needs them). */
(function () {
  'use strict';
  if (window.Guest) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const isGuest = () => !(window.Net && Net.me && Net.me.member);
  const sfx = n => { try { if (window.Sound) Sound.play(n); } catch (e) {} };
  const secret = id => { try { if (window.Apps && Apps.secret) Apps.secret(id); } catch (e) {} };
  const whenReady = fn => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); };

  // ---------------------------------------------------------------- the look (no shared CSS file to put it in)
  const css = `
.gst-box{display:grid;grid-template-columns:40px minmax(0,1fr);gap:10px;font:12px var(--ui,Tahoma,sans-serif)}
.gst-box p{margin:0 0 8px}
.gst-box .gst-what{font-weight:bold}
.gst-box .gst-free{color:#000080;font-weight:bold}
.gst-perks{margin:0;padding:6px 8px;background:#ffffe1;border:1px solid #808080;font-size:11px;line-height:1.35}
.gst-btns{display:flex;justify-content:center;gap:8px;margin-top:12px}
.gst-btns .btn{min-width:96px}
.gst-badge{display:inline-block;vertical-align:middle;background:#e10600;color:#fff;font:bold 9px/1 Verdana,Arial,sans-serif;letter-spacing:.06em;padding:3px 5px 2px;border:1px dashed #ffd400;transform:rotate(-2deg);white-space:nowrap;text-transform:uppercase;margin:0 4px}
.gst-note{border:2px dashed #e10600;background:#fffbe0;padding:6px 9px;margin:8px 0;font:12px Verdana,Arial,sans-serif;color:#000}
.gst-note b.gst-nt{color:#e10600}
.gst-note a{font-weight:bold}
.gst-mlock{position:relative;display:inline-block;line-height:0}
.gst-mlock .gst-pad{position:absolute;right:-3px;bottom:-3px;width:10px;height:11px}
.gst-local{color:#808080;font-style:italic}
`;
  whenReady(() => { const st = document.createElement('style'); st.id = 'guestCss'; st.textContent = css; document.head.appendChild(st); });

  const CARD = '<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" shape-rendering="crispEdges"><rect x="1" y="7" width="27" height="18" fill="#fff" stroke="#000"/><rect x="2" y="8" width="25" height="4" fill="#000080"/><rect x="4" y="15" width="7" height="7" fill="#c0c0c0" stroke="#808080"/><rect x="6" y="16" width="3" height="3" fill="#808080"/><path d="M13 16h11M13 19h9M13 22h6" stroke="#808080"/><path d="M22 2l1.5 3.2 3.5.4-2.6 2.4.7 3.5L22 9.8l-3.1 1.7.7-3.5-2.6-2.4 3.5-.4z" fill="#ffd400" stroke="#a07000"/><rect x="20" y="22" width="10" height="8" fill="#ffd400" stroke="#000"/><path d="M22 22v-3a3 3 0 0 1 6 0v3" fill="none" stroke="#000" stroke-width="1.5"/><rect x="24" y="25" width="2" height="3" fill="#000"/></svg>';
  const PAD = '<svg class="gst-pad" viewBox="0 0 10 11" aria-hidden="true" shape-rendering="crispEdges"><rect x="1" y="5" width="8" height="6" fill="#ffd400" stroke="#000"/><path d="M3 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="#000" stroke-width="1.3"/><rect x="4.5" y="7" width="1" height="2" fill="#000"/></svg>';

  // ---------------------------------------------------------------- the members-only box
  let box = null; // { w, then, what }
  const turnedAway = new Set();
  function need(what, then) {
    if (!isGuest()) { if (then) then(); return true; }
    what = String(what || 'That');
    if (box && box.w && box.w.el.isConnected) { box.then = then; box.what = what; box.w.el.querySelector('.gst-what').textContent = what; if (window.Desk && Desk.activate) Desk.activate(box.w.el); return false; }
    if (!window.Desk || !Desk.openWin) return false;
    const b = document.createElement('div');
    b.innerHTML = `<div class="gst-box">${CARD}<div><p><span class="gst-what"></span> is only for JackNet members.</p><p><span class="gst-free">Joining is FREE and takes 10 seconds!</span> Just pick a name and a password.</p><p class="gst-perks">Members get their own name, a profile, an Uh-Oh! number, forum posts, high scores, Rupees, a homepage, and their files on any computer.</p></div></div><div class="gst-btns"><button class="btn dflt" type="button" data-j>Join / Log On</button><button class="btn" type="button" data-n>Not now</button></div>`;
    b.querySelector('.gst-what').textContent = what;
    const w = Desk.openWin('JackNet Members Only', b, 350);
    w.el.classList.add('gst-win');
    box = { w, then, what };
    const close = () => { if (box && box.w === w) box = null; w.close(); };
    b.querySelector('[data-n]').addEventListener('click', close);
    b.querySelector('[data-j]').addEventListener('click', () => { const fn = box && box.w === w ? box.then : null; close(); join(fn); });
    w.el.addEventListener('keydown', ev => { if (ev.key === 'Escape' && box && box.w === w) box = null; });
    setTimeout(() => { const j = b.querySelector('[data-j]'); if (j && j.isConnected) j.focus(); }, 30);
    sfx('uhoh');
    secret('gst.door');
    turnedAway.add(what.toLowerCase()); if (turnedAway.size >= 5) secret('gst.bouncer');
    return false;
  }
  // open the JackNet logon; once they're a member, carry on with what they were doing
  function join(then) {
    if (!window.JackLogon) return;
    JackLogon.show().then(() => {
      if (isGuest()) return;
      secret('gst.join');
      if (then) setTimeout(() => { try { then(); } catch (e) { console.error(e); } }, 400);
    });
  }

  // ---------------------------------------------------------------- web-page bits (web-like, not window-like)
  const badge = text => `<span class="gst-badge" title="For JackNet members">&#9733; ${esc(text || 'Members only')}</span>`;
  const webNote = what => `<div class="gst-note"><b class="gst-nt">&#9733; MEMBERS ONLY &#9733;</b> ${esc(what)} is for JackNet members. You're a guest${window.Net && Net.me && Net.me.nick ? ` (<b>${esc(Net.me.nick)}</b>)` : ''}. <a href="#" data-jlogon>Log on</a> / <a href="#" data-jlogon>Join FREE!</a> It takes 10 seconds.</div>`;

  // ---------------------------------------------------------------- Start menu items guests can't fully use
  const LOCKED = { // Start > Programs path -> what. look: padlock only (guests can still open it and look round)
    'JackNet Hangout > Message in a Bottle': { what: 'Throwing a message in a bottle' },
    'Internet > Homepagez PageBuilder': { what: 'Publishing a homepage', look: true },
    'Internet > Rupees > My Pixel Pet Farm': { what: 'Having a Pixel Pet Farm', look: true },
  };
  const lockIcon = svg => `<span class="gst-mlock">${svg || ''}${PAD}</span>`;
  function lockItem(item, prog) {
    if (!isGuest() || !prog || !prog.path) return item;
    const L = LOCKED[prog.path.join(' > ')];
    if (!L) return item;
    const act = item.act;
    return Object.assign({}, item, { icon: lockIcon(item.icon), act: L.look ? act : () => need(L.what, act) });
  }

  // ---------------------------------------------------------------- the network backstop
  // (the same lists are in server.js, which refuses guests whatever the browser does)
  const MEMBER_KV = /^(site\.penpals|site\.quiz\.hof|site\.compo|social\.irctopic|social\.bottles|ss\.rt\.[a-z0-9._-]+|ss\.rv\.[a-z0-9._-]+|eras\.bay\.(?!fb$)[a-z0-9_-]+)$/;
  const SENDS = {
    score: 'The High Score table', fNew: 'Posting on the forums', fReply: 'Posting on the forums', saveProfile: 'Having a JackNet profile',
    shout: 'Leaving shout-outs', hpzPut: 'Building your own homepage', pmSend: 'Offline messages',
    ecBuy: 'Spending Rupees', ecWear: 'Spending Rupees', ecUse: 'Spending Rupees', ecTrade: 'The Jack Stock Exchange', ecClaim: 'Owning a plot in Jacktown',
    ecBuild: 'Building in Jacktown', ecPlotName: 'Owning a plot in Jacktown', ecAbandon: 'Owning a plot in Jacktown', ecTicket: 'JackLotto',
    ecBet: 'Betting at Jackdown Park', ecFarm: 'Having a Pixel Pet Farm',
    lootOpen: 'Opening loot parcels', lootPay: 'Paying other people', lootTNew: 'Trading items', lootSell: 'Selling on the Bazaar', lootBuy: 'Buying on the Bazaar', lootShopBuy: 'Buying loot',
    grClaim: 'Keeping the gems you find', // js/grind-hunt.js (guests can still find them, just not keep them)
  };
  const KV_WHAT = k => /^site\.penpals/.test(k) ? 'Pinning a note on the Pen Pals board' : /^site\.quiz/.test(k) ? 'The Nerd Quiz Hall of Fame' : /^site\.compo/.test(k) ? 'Entering the compo'
    : /^social\.irctopic/.test(k) ? 'Setting a channel topic' : /^social\.bottles/.test(k) ? 'Throwing a message in a bottle' : /^ss\./.test(k) ? 'Rating and reviewing on the Shareware Shack' : /^eras\.bay/.test(k) ? 'Buying and selling on JackBay' : 'That';
  const RELAY_WHAT = (ch, d) => {
    const k = d && typeof d === 'object' ? d.k : '';
    if (ch === 'social.im' && (k === 'm' || k === 'nudge' || k === 'file')) return 'Sending Uh-Oh! messages';
    if (ch === 'social.bottle') return 'Throwing a message in a bottle';
    if (ch === 'social.irc' && k === 'm') return 'Talking in JackIRC channels';
    if (ch === 'social.throw' && d && d.m) return 'Writing notes on paper aeroplanes';
    return '';
  };
  function guard() {
    if (!window.Net || Net._guestGuard) return;
    const raw = Net.send;
    Net.send = function (m) {
      if (m && isGuest()) {
        let what = SENDS[m.t] || '';
        if (!what && (m.t === 'kvPush' || m.t === 'kvPut') && MEMBER_KV.test(String(m.k || ''))) what = KV_WHAT(String(m.k));
        if (!what && m.t === 'relay') what = RELAY_WHAT(String(m.ch || ''), m.d);
        if (what) {
          if (m.t === 'score') scoreHeld(m);
          need(what, () => raw.call(Net, m));
          return true; // held: the box explains (and it goes when they join)
        }
      }
      return raw.call(Net, m);
    };
    Net._guestGuard = true;
  }
  guard();
  // a guest's high score: kept on this computer only, so the table can show it greyed (see arcade.js)
  function scoreHeld(m) {
    const k = 'jhp_guest_scores', all = store.get(k, {});
    const l = (all[m.g] = all[m.g] || []); l.push({ n: String(m.n || '').slice(0, 3), s: +m.s || 0, ts: Date.now() }); l.sort((a, b) => b.s - a.s); l.length = Math.min(l.length, 5);
    store.set(k, all);
  }

  // ---------------------------------------------------------------- one gentle reminder, the first time a guest saves a file
  document.addEventListener('jhp-toast', ev => {
    const d = ev.detail || {};
    if (!isGuest() || !/^(Notepad|Paint|WordPad|Sound Recorder)$/.test(d.title || '') || !/^Saved/.test(d.text || '')) return;
    if (store.get('jhp_guest_savenote', false)) return;
    store.set('jhp_guest_savenote', true);
    setTimeout(() => window.Desk && Desk.toast('Saved on this PC only', "You're a guest, so your files only live on this computer (until somebody clears it out). Join JackNet and they follow you to any computer! Start > Log Off to join.", 10000), 600);
  });

  // ---------------------------------------------------------------- secrets + a Run command
  whenReady(() => {
    if (!window.Apps) return;
    Apps.defineSecret('gst.door', 'Members Only', 'Some doors on JackNet have a bouncer.');
    Apps.defineSecret('gst.post', 'Lurker', 'Try to have your say on the forums without saying who you are.');
    Apps.defineSecret('gst.join', 'Signed Up at the Door', 'Join the club right there at the velvet rope.');
    Apps.defineSecret('gst.bouncer', 'Persistent Little Pest', 'Get turned away from five different places.');
    Apps.defineSecret('gst.card', 'Card-Carrying', 'Ask the computer for your membership card (Start > Run).');
    Apps.cmd(['membercard', 'member card', 'net user', 'jacknet card'], () => {
      const m = (window.Net && Net.me) || {};
      secret('gst.card');
      Desk.msgbox('JackNet Membership', m.member
        ? `JACKNET MEMBERSHIP CARD\n\nName: ${m.nick}\nMember number: #${m.no || '?'}\nUh-Oh! number: ${window.UhOh && m.no ? UhOh.uinOfNo(m.no) : '?'}\nStatus: FULL MEMBER (laminated)\n\nThis card lets you post, play for the High Score tables, earn Rupees and build a homepage. Don't lose it. (You can't lose it. It's pretend.)`
        : `JACKNET GUEST PASS\n\nName: ${m.nick || 'Guest'} (just for today)\nMember number: none\nStatus: GUEST (paper wristband)\n\nGuests can look round everything, play every game and read everything. Posting, high scores, Rupees, JackBay and homepages are for members.`, 'info',
        m.member ? [['OK']] : [['Join / Log On', () => join(null)], ['OK']]);
    });
  });

  window.Guest = { is: isGuest, need, join, badge, webNote, lockIcon, lockItem, LOCKED, MEMBER_KV };
})();
