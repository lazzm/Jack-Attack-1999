/* homepages-builder: "Homepagez PageBuilder 2.0", the FrontPage-Express-ish page editor. Toolbar of blocks on top,
 * WYSIWYG-ish preview on the left (click a thing to select it), properties on the right. Save keeps a draft in this
 * browser (and C:\My Documents\My Webs\MYPAGE.HTM), Publish FTPs it to the Homepagez server (mods/homepages.js).
 * Lazy-loaded by homepages.js after homepages-view.js. All text shown back is escaped (esc) or set with textContent. */
(function () {
  'use strict';
  const H = window.HPZ, A = window.Apps, esc = A.esc, V = H && H.view;
  if (!H || !V || H.builder) return;
  const L = H.LIMITS, store = A.store;
  const DRAFT = 'jhp_hpz_draft', TIPK = 'jhp_hpz_tips';
  const HOODS = Object.keys(H.HOODS);
  const clone = o => JSON.parse(JSON.stringify(o));
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  // ================================================================ blocks you can insert
  const BLOCKS = [
    ['h', 'Heading', 'H', () => ({ k: 'h', t: 'Welcome to my homepage!!!', s: 1, a: 'c', c: '#ffff00', f: 'comic' })],
    ['p', 'Text', '\u00b6', () => ({ k: 'p', t: 'Type something about yourself here! What do you like? What is your favourite game? Do you have a pet?', a: 'l' })],
    ['mq', 'Marquee', '\u21c4', () => ({ k: 'mq', t: '*** WELCOME TO MY PAGE!!! *** SIGN MY GUESTBOOK!!! ***', d: 'l', sp: 'm', c: '#ff0000' })],
    ['bl', 'Blink', '\u2733', () => ({ k: 'bl', t: 'NEW!!! NEW!!! NEW!!!', c: '#ff0000', a: 'c' })],
    ['hr', 'Line', '\u2015', () => ({ k: 'hr', st: 'rainbow' })],
    ['uc', 'Construction', '\u26a0', () => ({ k: 'uc', st: 'worker' })],
    ['st', 'Clip Art', '\u263a', () => ({ k: 'st', s: ['smiley', 'star', 'globe'], z: 3, a: 'c' })],
    ['ct', 'Counter', '#', () => ({ k: 'ct', st: 'odo', l: 0, a: 'c' })],
    ['gb', 'Guestbook', '\u270e', () => ({ k: 'gb', t: 'Sign my guestbook!!!' })],
    ['ln', 'Links', '@', () => ({ k: 'ln', h: 'My Kool Links', l: [{ u: 'http://www.davesplace.jnet/', t: "Dave's Kool Page" }, { u: 'http://www.homepagez.webcom/', t: 'Homepagez Neighbourhoods' }] })],
    ['ul', 'List', '\u2022', () => ({ k: 'ul', h: 'Things I like:', it: ['Video games', 'Pizza', 'My Rubik\'s Cube'], bu: 'star' })],
    ['ring', 'Webring', '\u25ce', () => ({ k: 'ring', r: 'hpz' })],
    ['bdg', 'Badges', '\u25ad', () => ({ k: 'bdg', b: ['bvie', 'bv800', 'pgb'], a: 'c' })],
    ['poll', 'Poll', '?', () => ({ k: 'poll', q: 'What is the best game of 1999?', o: ['Pokemon Red & Blue', 'Driver', 'Ape Escape'] })],
    ['mail', 'E-mail me', '\u2709', () => ({ k: 'mail', t: 'E-MAIL ME!!!' })],
  ];
  const BK = {}; BLOCKS.forEach(b => { BK[b[0]] = b; });
  const NAME = k => (BK[k] ? BK[k][1] : k);

  const TIPS = [
    'Welcome to Homepagez PageBuilder! Click the buttons on the toolbar to add things to your page. Click a thing on your page to change it.',
    'Did you know? You can make text BLINK. Use this power wisely.',
    'A guestbook lets your visitors say hello. Sign it yourself first so it doesn\'t look empty. Everybody does.',
    'Put an UNDER CONSTRUCTION sign on your page. Then nobody can complain that it isn\'t finished.',
    'Your hit counter starts at 0. Every visitor makes it go up by one. Visiting your own page does NOT count. (We checked.)',
    'Pick a neighbourhood that suits your page. Space stuff goes in SpaceCity. Mud goes in Grotville.',
    'MIDI music plays when people visit your page. Your visitors will LOVE it. (Your visitors might not love it.)',
    'Never put your real address, phone number or school on your page. Put your favourite biscuit instead.',
    'Links can go anywhere on the Web, like http://www.davesplace.jnet/ or other members\' pages at http://members.homepagez.webcom/~name/',
    'Too many colours? There is no such thing. (There is. But it is fun.)',
    'Black text on a black background is very hard to read. Jack found this out the hard way.',
    'Join the Homepagez Member Ring! Your visitors can hop from your page to the next member\'s page, and the next, and the next...',
    'File > Save keeps your page in C:\\My Documents\\My Webs. File > Publish puts it on the World Wide Web.',
    'Webmasters always say "Best viewed at 800 x 600". Nobody knows why. Add the badge anyway.',
    'Ask your visitors a question with a Visitor Poll! Like "Which is better: Tetris, or more Tetris?"',
    'A marquee makes your words scroll across the screen, like the news on telly.',
    'The little arrows on the right move the selected thing up and down your page.',
    'If Mom picks up the phone while you are publishing, the upload fails. Put a sign on the phone: INTERNET IN USE!!!',
    'Read your neighbourhood\'s rules. SpaceCity is VERY strict about ice cream.',
    'Remember to update your page! A page that says "Last updated 1997" is a sad, sad page.',
    'Homepagez gives you 2 MB of space! Each page can use 16 KB of it. The rest is for our adverts. Sorry.',
    'File > View HTML Source shows you what your page looks like underneath. (Spooky.)',
  ];

  // ================================================================ a new page
  function freeNum(hood, street) { for (let i = 0; i < 50; i++) { const n = rnd(100, 9999); if (!H.isTaken(hood, street, n)) return n; } return 9998; }
  function newPage(o) {
    const me = H.me(), nick = me.member ? me.nick : 'YourName';
    const hood = H.findHood(o && o.hood) || 'SpaceCity', street = H.HOODS[hood].streets[3];
    return {
      title: `~${nick}'s Homepage`, hood, street, num: freeNum(hood, street), bg: 'stars', bgc: '#000000', tc: '#ffffff', lc: '#ffff00', font: 'comic', midi: 'hpz_elise',
      blocks: [BK.h[3](), BK.mq[3](), BK.uc[3](),
        { k: 'p', t: `Hi! My name is ${nick} and this is my homepage on the World Wide Web! It is under construction. I like video games, sci-fi and computers. Please sign my guestbook!!!`, a: 'c' },
        BK.hr[3](), BK.st[3](), BK.ct[3](), { k: 'hr', st: 'stars' }, BK.gb[3](), BK.bdg[3](), BK.ring[3]()],
    };
  }

  // ================================================================ fake 1999 HTML (View Source / MYPAGE.HTM). Plain text, never rendered.
  const ent = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const FN = {}; H.FONTS.forEach(f => { FN[f[0]] = f[1]; });
  const SZ = { 1: 7, 2: 6, 3: 5, 4: 4 };
  const ALN = { l: 'LEFT', c: 'CENTER', r: 'RIGHT' };
  function source(p) {
    const T = {}; H.TUNES.forEach(t => { T[t[0]] = t[1]; });
    const font = (b, inner) => (b.f || b.c) ? `<FONT${b.f ? ` FACE="${FN[b.f] || 'Arial'}"` : ''}${b.c ? ` COLOR="${b.c}"` : ''}>${inner}</FONT>` : inner;
    const al = (b, inner) => b.a && b.a !== 'l' ? `<P ALIGN="${ALN[b.a]}">${inner}</P>` : `<P>${inner}</P>`;
    const out = ['<HTML>', '<HEAD>', `<TITLE>${ent(p.title)}</TITLE>`, '<META NAME="GENERATOR" CONTENT="Homepagez PageBuilder 2.0">', '<META NAME="KEYWORDS" CONTENT="homepage, cool, games, 1999, sign my guestbook">', '</HEAD>',
      `<BODY${p.bg && p.bg !== 'none' ? ` BACKGROUND="/images/bg_${p.bg}.gif"` : ''} BGCOLOR="${p.bgc}" TEXT="${p.tc}" LINK="${p.lc}" VLINK="#800080">`,
      '<!-- Homepagez advert code: DO NOT REMOVE (or your page will be deleted) -->', '<SCRIPT LANGUAGE="JavaScript" SRC="/ads/hpz_banner.js"></SCRIPT>', `<BASEFONT FACE="${FN[p.font] || 'Times New Roman'}">`];
    if (p.midi && p.midi !== 'none') out.push(`<EMBED SRC="/midi/${(T[p.midi] || 'TUNE.MID').toLowerCase()}" AUTOSTART="true" LOOP="true" WIDTH="145" HEIGHT="60">`, `<NOEMBED><BGSOUND SRC="/midi/${(T[p.midi] || 'TUNE.MID').toLowerCase()}" LOOP="INFINITE"></NOEMBED>`);
    for (const b of p.blocks) {
      switch (b.k) {
        case 'h': out.push(al(b, font(b, `<FONT SIZE="${SZ[b.s] || 6}"><B>${ent(b.t)}</B></FONT>`))); break;
        case 'p': out.push(al(b, font(b, ent(b.t).replace(/\n/g, '<BR>\n')))); break;
        case 'mq': out.push(`<MARQUEE${b.d === 'r' ? ' DIRECTION="RIGHT"' : b.d === 'b' ? ' BEHAVIOR="ALTERNATE"' : ''} SCROLLAMOUNT="${{ s: 3, m: 6, f: 12 }[b.sp] || 6}"${b.bc ? ` BGCOLOR="${b.bc}"` : ''}>${font(b, '<B>' + ent(b.t) + '</B>')}</MARQUEE>`); break;
        case 'bl': out.push(al(Object.assign({ a: 'c' }, b), `<BLINK>${font(b, '<B>' + ent(b.t) + '</B>')}</BLINK>`)); break;
        case 'hr': out.push(b.st === 'groove' ? '<HR SIZE="4">' : b.st === 'plain' ? '<HR NOSHADE>' : `<CENTER><IMG SRC="/clipart/line_${b.st}.gif" WIDTH="600" HEIGHT="20" ALT="----------"></CENTER>`); break;
        case 'uc': out.push(`<CENTER><IMG SRC="/clipart/under_construction_${b.st}.gif" ALT="UNDER CONSTRUCTION"><BR><B>${ent(b.t || 'This page is UNDER CONSTRUCTION!!! Come back soon!')}</B></CENTER>`); break;
        case 'st': out.push(al(b, b.s.map(s => `<IMG SRC="/clipart/${s}${b.sp ? '_spin' : ''}.gif" ALT="${s}">`).join(' '))); break;
        case 'ct': out.push(`<CENTER>${ent(H.CLABELS[b.l] || '')} <IMG SRC="/cgi-bin/counter.cgi?style=${b.st}&amp;user=you" ALT="counter"></CENTER>`); break;
        case 'gb': out.push(`<CENTER><A HREF="/cgi-bin/guestbook.pl?sign"><IMG SRC="/clipart/mailbox.gif" BORDER="0"> ${ent(b.t || 'Sign my guestbook!!!')}</A></CENTER>`); break;
        case 'ln': out.push((b.h ? `<H3>${ent(b.h)}</H3>\n` : '') + '<UL>\n' + b.l.map(x => `<LI><A HREF="${ent(x.u)}">${ent(x.t || x.u)}</A>`).join('\n') + '\n</UL>'); break;
        case 'ul': out.push((b.h ? `<H3>${ent(b.h)}</H3>\n` : '') + (b.bu === 'num' ? '<OL>' : '<UL>') + '\n' + b.it.map(x => `<LI>${ent(x)}`).join('\n') + '\n' + (b.bu === 'num' ? '</OL>' : '</UL>')); break;
        case 'ring': out.push(`<!-- BEGIN WEBRING CODE: ${ent((H.RINGS.find(r => r[0] === b.r) || ['', ''])[1])} -->`, '<CENTER><TABLE BORDER="3"><TR><TD ALIGN="CENTER">[ <A HREF="/ring?prev">Prev</A> | <A HREF="/ring?random">Random</A> | <A HREF="/ring?next">Next</A> ]</TD></TR></TABLE></CENTER>', '<!-- END WEBRING CODE -->'); break;
        case 'bdg': out.push(`<CENTER>${b.b.map(x => `<IMG SRC="/badges/${x}.gif" WIDTH="88" HEIGHT="31">`).join(' ')}</CENTER>`); break;
        case 'poll': out.push(`<FORM ACTION="/cgi-bin/poll.pl" METHOD="POST">\n<B>${ent(b.q)}</B><BR>\n` + b.o.map((x, i) => `<INPUT TYPE="RADIO" NAME="vote" VALUE="${i}"> ${ent(x)}<BR>`).join('\n') + '\n<INPUT TYPE="SUBMIT" VALUE="Vote!">\n</FORM>'); break;
        case 'mail': out.push(`<CENTER><A HREF="mailto:you@jacknet.jnet"><IMG SRC="/clipart/mail_anim.gif" BORDER="0"> ${ent(b.t || 'E-MAIL ME!!!')}</A></CENTER>`); break;
      }
    }
    out.push('<HR>', '<CENTER><FONT SIZE="1">This page was made with Homepagez PageBuilder 2.0. Best viewed with JackNet Explorer at 800 x 600.</FONT></CENTER>', '</BODY>', '</HTML>');
    return out.join('\n') + '\n';
  }

  // ================================================================ styles
  const css = document.createElement('style'); css.id = 'hpzb-css';
  css.textContent = `
.hpzb{display:flex;flex-direction:column;height:100%;min-height:0;gap:4px;font:11px Tahoma,var(--ui),sans-serif}
.appbody:has(> .hpzb){padding:3px;overflow:hidden}
.hpzb-bar,.hpzb-ins{display:flex;flex-wrap:wrap;gap:2px;align-items:stretch;padding:2px;border:1px solid;border-color:#fff #808080 #808080 #fff;flex:none}
.hpzb-bar .btn,.hpzb-ins .btn{padding:2px 6px;min-height:24px;display:inline-flex;align-items:center;gap:4px;font-size:11px}
.hpzb-ins .btn i{font-style:normal;font-weight:bold;display:inline-block;width:14px;text-align:center;color:#000080}
.hpzb-pub{font-weight:bold!important}.hpzb-pub svg{width:16px;height:16px}
.hpzb-sep{width:2px;border-left:1px solid #808080;border-right:1px solid #fff;margin:0 3px}
.hpzb-main{flex:1;display:flex;gap:4px;min-height:0}
.hpzb-prevw{flex:1 1 60%;min-width:0;overflow:auto;background:#fff}
.hpzb-prev{min-height:100%}
.hpzb-side{flex:0 0 290px;display:flex;flex-direction:column;min-height:0;min-width:0}
.hpzb-side .tabs span{cursor:pointer}
.hpzb-props{flex:1;overflow:auto;background:var(--face,#c0c0c0);border:1px solid;border-color:#fff #000 #000 #fff;box-shadow:inset -1px -1px #808080;padding:6px}
.hpzb-props label,.hpzb-f{display:block;margin:0 0 7px}
.hpzb-props .lab{display:block;font-weight:bold;margin-bottom:2px}
.hpzb-props input[type=text],.hpzb-props input[type=number],.hpzb-props select,.hpzb-props textarea{width:100%;box-sizing:border-box;font:12px Tahoma,sans-serif}
.hpzb-props textarea{resize:vertical;min-height:70px}
.hpzb-cnt{float:right;font-weight:normal;color:#444}
.hpzb-sw{display:flex;flex-wrap:wrap;gap:2px}
.hpzb-sw button{width:22px;height:22px;padding:0;border:2px solid #808080;cursor:pointer}
.hpzb-sw button.on{outline:2px solid #000;outline-offset:1px;border-color:#fff}
.hpzb-sw .none{background:#fff;font-size:10px;width:auto;padding:0 4px}
.hpzb-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:3px}
.hpzb-tiles button{height:34px;border:2px solid #808080;cursor:pointer;font:9px Tahoma,sans-serif;color:#000;text-shadow:0 0 2px #fff,0 0 2px #fff;padding:0;overflow:hidden}
.hpzb-tiles button.on{outline:2px solid #000;border-color:#fff}
.hpzb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:3px}
.hpzb-grid button{height:38px;padding:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;background:#fff;border:2px solid #808080}
.hpzb-grid button.on{border-color:#ff00ff;background:#ffe0ff}
.hpzb-grid button.on::after{content:attr(data-n);position:absolute;right:1px;top:0;font:bold 9px Tahoma;color:#ff00ff}
.hpzb-grid canvas,.hpzb-grid .hpz-clip{width:28px!important;height:28px!important}
.hpzb-bdg{display:flex;flex-wrap:wrap;gap:3px}.hpzb-bdg button{padding:0;border:2px solid transparent;cursor:pointer;background:none}.hpzb-bdg button.on{border-color:#ff00ff}
.hpzb-row{display:flex;gap:3px;align-items:center;margin-bottom:3px}.hpzb-row input{flex:1;min-width:0}
.hpzb-ok{color:#080;font-weight:bold}.hpzb-bad{color:#c00;font-weight:bold}
.hpzb-move{display:flex;gap:3px;flex-wrap:wrap;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #808080}
.hpzb-move .btn{padding:2px 6px;min-height:22px}
.hpzb-addr{font:11px "Courier New",monospace;background:#fff;border:1px solid #808080;padding:3px;word-break:break-all;margin:3px 0}
.hpzb-rules{background:#ffffe1;border:1px solid #000;padding:4px 6px;margin:4px 0 8px}.hpzb-rules ol{margin:2px 0;padding-left:18px}
.hpzb-help{color:#333;margin:2px 0 6px}
.hpzb.narrow .hpzb-main{flex-direction:column}.hpzb.narrow .hpzb-prevw{flex:1 1 45%;min-height:140px}.hpzb.narrow .hpzb-side{flex:1 1 55%;min-height:160px}
.hpzb.narrow .hpzb-ins .btn span{display:none}.hpzb.narrow .hpzb-ins .btn{padding:2px 4px;min-width:30px;justify-content:center}
.hpzftp pre{height:190px;overflow:auto;background:#000;color:#c0c0c0;font:12px/1.3 "Courier New",monospace;padding:6px;margin:0 0 6px;white-space:pre-wrap;word-break:break-all}
.hpzftp .done{background:#ffffe1;border:1px solid #000;padding:8px;margin-bottom:6px;font-size:12px}.hpzftp .done tt{word-break:break-all}.hpzftp .done b.big{display:block;font-size:14px;margin-bottom:4px}
.hpztip{display:flex;gap:10px}.hpztip .bulb{flex:none}.hpztip .tipbox{flex:1;background:#fff;border:2px inset #fff;padding:10px;min-height:90px;font-size:12px}.hpztip .tipbox b{display:block;font-size:15px;margin-bottom:6px}
`;
  document.head.appendChild(css);

  const PUB_ICON = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#2a7ad8" stroke="#003080"/><path d="M4 5c2 0 2 2 4 1s1 3-1 3-1 3-3 2M10 3c2 1 3 2 2 4" fill="#3c3"/><path d="M11 9l4 4-1 1-4-4z" fill="#ffd400" stroke="#000" stroke-width=".5"/></svg>';
  const BULB = '<svg viewBox="0 0 32 32" width="40" height="40"><path d="M16 3a9 9 0 0 0-5 16v4h10v-4a9 9 0 0 0-5-16z" fill="#ffff80" stroke="#000"/><rect x="11" y="23" width="10" height="5" fill="#c0c0c0" stroke="#000"/><path d="M13 13l3 4 3-4M16 17v6" stroke="#a07000" fill="none"/></svg>';

  // ================================================================ the editor
  let S = null; // { w, page, sel, tab, pub: {a, url, hits} | null, root, prev, props, dirty }
  function mount(w, arg) {
    const draft = store.get(DRAFT, null);
    S = { w, page: draft && draft.blocks ? draft : newPage(arg), sel: -1, tab: 'page', pub: null };
    w.setTitle('Homepagez PageBuilder - [index.html]');
    const root = document.createElement('div'); root.className = 'hpzb';
    root.innerHTML = `<div class="hpzb-bar" role="toolbar" aria-label="File">
<button type="button" class="btn" data-a="new" title="New page">New</button><button type="button" class="btn" data-a="open" title="Open your published page">Open</button><button type="button" class="btn" data-a="save" title="Save to My Webs">Save</button><span class="hpzb-sep"></span>
<button type="button" class="btn hpzb-pub" data-a="publish" title="Publish to the World Wide Web">${PUB_ICON}Publish!</button><button type="button" class="btn" data-a="view" title="Visit your page in JackNet Explorer">View on Web</button><span class="hpzb-sep"></span><button type="button" class="btn" data-a="source">Source</button><button type="button" class="btn" data-a="tip">Tip</button></div>
<div class="hpzb-ins" role="toolbar" aria-label="Insert">${BLOCKS.map(b => `<button type="button" class="btn" data-ins="${b[0]}" title="Insert ${esc(b[1])}"><i>${b[2]}</i><span>${esc(b[1])}</span></button>`).join('')}</div>
<div class="hpzb-main"><div class="hpzb-prevw field"><div class="hpzb-prev"></div></div><div class="hpzb-side"><div class="tabs"><span data-t="page">Page</span><span data-t="block">Selected thing</span></div><div class="hpzb-props"></div></div></div>`;
    w.body.innerHTML = ''; w.body.appendChild(root);
    S.root = root; S.prev = root.querySelector('.hpzb-prev'); S.props = root.querySelector('.hpzb-props');
    root.querySelector('.hpzb-bar').addEventListener('click', ev => { const b = ev.target.closest('[data-a]'); if (b) act(b.dataset.a); });
    root.querySelector('.hpzb-ins').addEventListener('click', ev => { const b = ev.target.closest('[data-ins]'); if (b) insert(b.dataset.ins); });
    root.querySelectorAll('.tabs [data-t]').forEach(t => t.addEventListener('click', () => { S.tab = t.dataset.t; drawProps(); }));
    // the preview: clicks select, links never go anywhere
    const pick = ev => { ev.preventDefault(); ev.stopPropagation(); const b = ev.target.closest('.hpz-b'); if (b) select(+b.dataset.i); };
    S.prev.addEventListener('click', pick, true);
    S.prev.addEventListener('submit', ev => ev.preventDefault(), true);
    S.prev.addEventListener('keydown', ev => {
      const b = ev.target.closest && ev.target.closest('.hpz-b'); if (!b) return;
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(+b.dataset.i); }
      if (ev.key === 'Delete') { ev.preventDefault(); select(+b.dataset.i); act('del'); }
    });
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => root.classList.toggle('narrow', root.clientWidth < 620)); ro.observe(root); }
    else root.classList.toggle('narrow', innerWidth < 620);
    menus();
    if (arg) apply(arg, true);
    draw(); drawProps();
    checkPublished(!draft);
    if (store.get(TIPK, { on: true }).on !== false) setTimeout(() => { if (!w.closed) tip(); }, 400);
  }
  function apply(arg, quiet) {
    if (!S || S.w.closed || !arg) return;
    S.w.restore && S.w.restore();
    if (arg.load) return act('open');
    const hood = H.findHood(arg.hood);
    if (hood) {
      S.page.hood = hood;
      const street = H.findStreet(hood, arg.street); S.page.street = street || (H.HOODS[hood].streets.includes(S.page.street) ? S.page.street : H.HOODS[hood].streets[3]);
      S.page.num = arg.num && !H.isTaken(hood, S.page.street, arg.num) ? Math.max(1, Math.min(9999, arg.num | 0)) : (H.isTaken(hood, S.page.street, S.page.num) ? freeNum(hood, S.page.street) : S.page.num);
      S.tab = 'page';
      if (!quiet) { changed(); drawProps(); Desk.toast('PageBuilder', 'Your page will live at ' + H.addrText(S.page.hood, S.page.street, S.page.num)); }
    }
  }
  function menus() {
    const me = () => H.me();
    A.menubar(S.w, [
      ['File', () => [{ label: 'New Page', act: () => act('new') }, { label: 'Open My Published Page', act: () => act('open') }, { label: 'Save', key: 'Ctrl+S', act: () => act('save') }, '-',
        { label: 'Publish to the Web...', act: () => act('publish') }, { label: 'View My Page on the Web', act: () => act('view'), dis: !S.pub }, '-',
        { label: 'View HTML Source', act: () => act('source') }, { label: 'Delete My Page from the Web...', act: () => act('unpublish'), dis: !S.pub || !me().member }, '-', { label: 'Exit', act: () => S.w.close() }]],
      ['Edit', () => [{ label: 'Move Up', act: () => act('up'), dis: S.sel < 1 }, { label: 'Move Down', act: () => act('down'), dis: S.sel < 0 || S.sel >= S.page.blocks.length - 1 }, { label: 'Duplicate', act: () => act('dup'), dis: S.sel < 0 }, { label: 'Delete', key: 'Del', act: () => act('del'), dis: S.sel < 0 }]],
      ['Insert', () => BLOCKS.map(b => ({ label: b[1], act: () => insert(b[0]) }))],
      ['Format', () => [{ label: 'Page Properties...', act: () => { S.tab = 'page'; drawProps(); } }, '-', ...H.BGS.map(b => ({ label: 'Background: ' + b[1], rad: S.page.bg === b[0], act: () => { S.page.bg = b[0]; changed(); drawProps(); } }))]],
      ['Help', () => [{ label: 'Tip of the Day...', act: tip }, { label: 'Neighbourhood Rules', act: () => Desk.msgbox(S.page.hood + ' Rules', H.HOODS[S.page.hood].rules.map((r, i) => (i + 1) + '. ' + r).join('\n'), 'info') }, '-', { label: 'About PageBuilder', act: about }]],
    ]);
    S.w.el.addEventListener('keydown', ev => { if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); act('save'); } });
  }

  // ---- drawing
  let drawT = 0;
  function draw() {
    S.prev.innerHTML = V.render(S.page, { edit: true, sel: S.sel, hits: S.pub ? S.pub.hits : 0, gb: [] });
    V.paint(S.prev);
    status();
  }
  function changed(now) {
    clearTimeout(drawT);
    drawT = setTimeout(() => { if (S.w.closed) return; draw(); store.set(DRAFT, S.page); }, now ? 0 : 140);
  }
  function status() {
    const size = JSON.stringify(S.page).length, n = S.page.blocks.length;
    if (S.w.status) S.w.status.textContent = `${n} of ${L.blocks} things | ${(size / 1024).toFixed(1)} KB of ${Math.floor(L.json / 1024)} KB used | ${S.pub ? 'Published at ' + S.pub.a + ' (' + S.pub.hits + ' visitors)' : 'Not published yet'}`;
  }
  function select(i) {
    S.sel = i >= 0 && i < S.page.blocks.length ? i : -1; S.tab = S.sel >= 0 ? 'block' : 'page';
    S.prev.querySelectorAll('.hpz-b').forEach(b => b.classList.toggle('sel', +b.dataset.i === S.sel));
    drawProps();
  }
  function insert(k) {
    if (!BK[k]) return;
    if (S.page.blocks.length >= L.blocks) { A.secret('hpz.full'); return Desk.msgbox('PageBuilder', `Your page is FULL! A Homepagez page can have ${L.blocks} things on it. (Take something off first.)`, 'warn'); }
    if ((k === 'gb' || k === 'poll') && S.page.blocks.some(b => b.k === k)) return Desk.msgbox('PageBuilder', `Your page already has a ${NAME(k).toLowerCase()}! One is plenty.`, 'info');
    const at = S.sel >= 0 ? S.sel + 1 : S.page.blocks.length;
    S.page.blocks.splice(at, 0, BK[k][3]());
    S.sel = at; S.tab = 'block';
    Sound.play('click');
    if (S.page.blocks.length >= L.blocks) A.secret('hpz.full');
    changed(true); drawProps();
    setTimeout(() => { const el = S.prev.querySelector(`.hpz-b[data-i="${at}"]`); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }, 30);
  }

  // ---- property panel widgets
  const PALS = H.PALETTE;
  const swatches = (f, val, optional) => `<div class="hpzb-sw" data-sw="${f}">${optional ? `<button type="button" class="none${!val ? ' on' : ''}" data-v="">auto</button>` : ''}${PALS.map(([c, n]) => `<button type="button" style="background:${c}" data-v="${c}" title="${esc(n)}" aria-label="${esc(n)}"${val === c ? ' class="on"' : ''}></button>`).join('')}</div>`;
  const sel = (f, list, val, opt) => `<select data-f="${f}">${opt ? `<option value="">${esc(opt)}</option>` : ''}${list.map(x => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return `<option value="${esc(v)}"${String(val) === String(v) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
  const txt = (f, val, max, label) => `<label><span class="lab">${label} <span class="hpzb-cnt" data-cnt="${f}">${String(val || '').length}/${max}</span></span><input type="text" data-f="${f}" maxlength="${max}" value="${esc(val || '')}"></label>`;
  const area = (f, val, max, label) => `<label><span class="lab">${label} <span class="hpzb-cnt" data-cnt="${f}">${String(val || '').length}/${max}</span></span><textarea data-f="${f}" maxlength="${max}" rows="5">${esc(val || '')}</textarea></label>`;
  const field = (label, inner) => `<div class="hpzb-f"><span class="lab">${label}</span>${inner}</div>`;
  const ALS = [['l', 'Left'], ['c', 'Centre'], ['r', 'Right']];
  const FONTL = H.FONTS.map(f => [f[0], f[1]]);
  function blockForm(b) {
    const c = (lab, opt) => field(lab || 'Colour', swatches('c', b.c, opt !== false));
    switch (b.k) {
      case 'h': return txt('t', b.t, 80, 'Heading text') + field('Size', sel('s', [[1, 'HUGE'], [2, 'Big'], [3, 'Medium'], [4, 'Small']], b.s)) + field('Font', sel('f', FONTL, b.f, '(page font)')) + c() + field('Line up', sel('a', ALS, b.a || 'c'));
      case 'p': return area('t', b.t, L.text, 'Your text') + '<p class="hpzb-help">Press Enter for a new line. Links go in a Links box (web addresses typed here get removed).</p>' + field('Font', sel('f', FONTL, b.f, '(page font)')) + c() + field('Line up', sel('a', ALS, b.a || 'l'));
      case 'mq': return txt('t', b.t, 150, 'Scrolling text') + field('Direction', sel('d', [['l', 'Right to left'], ['r', 'Left to right'], ['b', 'Bounce!']], b.d)) + field('Speed', sel('sp', [['s', 'Slow'], ['m', 'Medium'], ['f', 'FAST']], b.sp)) + c('Text colour') + field('Background colour', swatches('bc', b.bc, true));
      case 'bl': return txt('t', b.t, 100, 'Blinking text') + c() + field('Font', sel('f', FONTL, b.f, '(page font)')) + field('Line up', sel('a', ALS, b.a || 'c'));
      case 'hr': return field('Line style', sel('st', H.HRS, b.st));
      case 'uc': return field('Sign', sel('st', H.UCS, b.st)) + txt('t', b.t, 80, 'Message (leave empty for the usual one)');
      case 'st': return field(`Pick up to ${L.stickers} (click again to remove)`, `<div class="hpzb-grid" data-pick="s">${H.STICKERS.map(n => { const i = (b.s || []).indexOf(n); return `<button type="button" data-v="${n}" title="${n}"${i >= 0 ? ` class="on" data-n="${i + 1}"` : ''}>${V.BLK.st({ s: [n], z: 2 }).replace(/^<div[^>]*>|<\/div>$/g, '')}</button>`; }).join('')}</div>`) + field('Size', sel('z', [[1, 'Tiny'], [2, 'Small'], [3, 'Medium'], [4, 'BIG']], b.z)) + `<label><input type="checkbox" data-f="sp"${b.sp ? ' checked' : ''}> Make them spin!</label>` + field('Line up', sel('a', ALS, b.a || 'c'));
      case 'ct': return field('Counter style', sel('st', H.COUNTERS, b.st)) + field('Words before it', sel('l', H.CLABELS.map((l, i) => [i, l]), b.l)) + field('Line up', sel('a', ALS, b.a || 'c')) + '<p class="hpzb-help">Your counter starts at 0 and counts real visitors. (Not you.)</p>';
      case 'gb': return txt('t', b.t, 60, 'Guestbook title') + '<p class="hpzb-help">Visitors (members AND guests) can write a message here. You can delete messages on your page by clicking Delete next to them.</p>';
      case 'ln': return txt('h', b.h, 60, 'Heading') + `<div class="hpzb-f"><span class="lab">Links (up to ${L.links})</span><div data-links="1">${(b.l || []).map((x, i) => linkRow(x, i)).join('')}</div><button type="button" class="btn" data-addlink="1"${(b.l || []).length >= L.links ? ' disabled' : ''}>Add a link</button> <button type="button" class="btn" data-member="1">Add a member's page...</button></div><p class="hpzb-help">Links can only go to places on the Web, like <b>www.davesplace.jnet</b> or <b>members.homepagez.webcom/~name/</b>.</p>`;
      case 'ul': return txt('h', b.h, 60, 'Heading') + area('it', (b.it || []).join('\n'), L.items * 81, `Things (one per line, up to ${L.items})`) + field('Bullets', sel('bu', H.BULLETS, b.bu)) + c();
      case 'ring': return field('Which webring?', sel('r', H.RINGS, b.r)) + '<p class="hpzb-help">The Homepagez Member Ring links every member\'s page together. Visitors click Next to go to the next page in the ring!</p>';
      case 'bdg': return field(`Pick up to ${L.badges}`, `<div class="hpzb-bdg" data-pick="b">${H.BADGES.map(x => `<button type="button" data-v="${x[0]}"${(b.b || []).includes(x[0]) ? ' class="on"' : ''}>${V.BLK.bdg({ b: [x[0]] }).replace(/^<div[^>]*>|<\/div>$/g, '')}</button>`).join('')}</div>`) + field('Line up', sel('a', ALS, b.a || 'c'));
      case 'poll': return txt('q', b.q, 100, 'Question') + [0, 1, 2, 3, 4].map(i => `<label><span class="lab">Answer ${i + 1}${i > 1 ? ' (optional)' : ''}</span><input type="text" data-opt="${i}" maxlength="40" value="${esc((b.o || [])[i] || '')}"></label>`).join('') + '<p class="hpzb-help">Changing the question or answers starts the votes again from 0.</p>';
      case 'mail': return txt('t', b.t, 60, 'Button text') + field('Line up', sel('a', ALS, b.a || 'c')) + '<p class="hpzb-help">Visitors who are JackNet members can send you a message. It arrives as an Uh-Oh! offline message.</p>';
    }
    return '';
  }
  function linkRow(x, i) {
    const ok = !!H.normUrl(x.u);
    return `<div class="hpzb-lnk" data-li="${i}"><div class="hpzb-row"><input type="text" data-lu="${i}" maxlength="140" placeholder="http://www.davesplace.jnet/" value="${esc(x.u || '')}"><span class="${ok ? 'hpzb-ok' : 'hpzb-bad'}" data-lok="${i}" title="${ok ? 'OK!' : 'That address is not on the Web'}">${ok ? '&#10004;' : '&#10008;'}</span><button type="button" class="btn" data-ldel="${i}" aria-label="Remove link">x</button></div><div class="hpzb-row"><input type="text" data-lt="${i}" maxlength="60" placeholder="Link text" value="${esc(x.t || '')}"></div></div>`;
  }
  function pageForm() {
    const p = S.page, hood = H.HOODS[p.hood];
    return txt('title', p.title, 60, 'Page title')
      + `<div class="hpzb-f"><span class="lab">Your address</span>${sel('hood', HOODS, p.hood)}<div class="hpzb-row" style="margin-top:3px">${sel('street', hood.streets.map(s => [s, s + ' Street']), p.street)}<input type="number" data-f="num" min="1" max="9999" value="${p.num | 0}" style="width:76px;flex:none" aria-label="House number"></div><div class="hpzb-addr" data-addr="1"></div><div data-addrok="1"></div></div>`
      + `<div class="hpzb-rules"><b>${esc(p.hood)} rules:</b><ol>${hood.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol></div>`
      + field('Background', `<div class="hpzb-tiles">${H.BGS.map(([id, l]) => `<button type="button" data-bg="${id}"${p.bg === id ? ' class="on"' : ''} title="${esc(l)}" style="${esc(V.TILES[id] ? 'background-image:' + V.TILES[id]() : 'background:' + p.bgc)}">${esc(l.split(' ')[0])}</button>`).join('')}</div>`)
      + field('Background colour', swatches('bgc', p.bgc)) + field('Text colour', swatches('tc', p.tc)) + field('Link colour', swatches('lc', p.lc))
      + field('Font', sel('font', FONTL, p.font))
      + field('Background music (MIDI)', `<div class="hpzb-row">${sel('midi', H.TUNES, p.midi)}<button type="button" class="btn" data-tune="play" aria-label="Play">&#9654;</button><button type="button" class="btn" data-tune="stop" aria-label="Stop">&#9632;</button></div>`);
  }
  function drawProps() {
    if (!S || S.w.closed) return;
    S.root.querySelectorAll('.tabs [data-t]').forEach(t => t.classList.toggle('on', t.dataset.t === S.tab));
    const b = S.page.blocks[S.sel];
    if (S.tab === 'block' && !b) { S.props.innerHTML = '<p>Click something on your page to change it.</p><p>Or add something new with the buttons on the toolbar!</p>'; return; }
    if (S.tab === 'block') {
      S.props.innerHTML = `<div class="hpzb-move"><b style="flex:1 1 100%">${esc(NAME(b.k))} (${S.sel + 1} of ${S.page.blocks.length})</b><button type="button" class="btn" data-a="up" aria-label="Move up"${S.sel < 1 ? ' disabled' : ''}>&#9650; Up</button><button type="button" class="btn" data-a="down" aria-label="Move down"${S.sel >= S.page.blocks.length - 1 ? ' disabled' : ''}>&#9660; Down</button><button type="button" class="btn" data-a="dup">Copy</button><button type="button" class="btn" data-a="del">Delete</button></div>${blockForm(b)}`;
      if (b.k === 'st' || b.k === 'bdg') V.paint(S.props);
    } else { S.props.innerHTML = pageForm(); addrInfo(); }
    wireProps();
  }
  let addrT = 0;
  function addrInfo() {
    const p = S.page, a = H.addrText(p.hood, p.street, p.num), box = S.props.querySelector('[data-addr]'), ok = S.props.querySelector('[data-addrok]');
    if (!box) return;
    box.textContent = H.addrUrl(a);
    if (!(p.num >= 1 && p.num <= 9999)) { ok.innerHTML = '<span class="hpzb-bad">House numbers go from 1 to 9999.</span>'; return; }
    if (H.isTaken(p.hood, p.street, p.num)) { ok.innerHTML = '<span class="hpzb-bad">&#10008; Somebody already lives there! Pick another number.</span>'; return; }
    ok.innerHTML = H.isRent(p.hood, p.street, p.num) ? '<span class="hpzb-ok">&#10004; FOR RENT! Move right in.</span>' : '<span class="hpzb-ok">Checking...</span>';
    clearTimeout(addrT);
    addrT = setTimeout(() => H.req({ t: 'hpzGet', addr: a }).then(r => {
      if (!ok.isConnected || H.addrText(S.page.hood, S.page.street, S.page.num) !== a) return;
      if (r.page && !r.mine) ok.innerHTML = `<span class="hpzb-bad">&#10008; ~${esc(r.n)} already lives there! Pick another number.</span>`;
      else if (r.page && r.mine) ok.innerHTML = '<span class="hpzb-ok">&#10004; That\'s your house!</span>';
      else if (r.t !== 'hpzErr') ok.innerHTML = `<span class="hpzb-ok">&#10004; ${H.isRent(S.page.hood, S.page.street, S.page.num) ? 'FOR RENT! Move right in.' : 'Free! Nobody lives here yet.'}</span>`;
    }), 500);
  }
  function wireProps() {
    const P = S.props, b = S.page.blocks[S.sel], tgt = S.tab === 'block' ? b : S.page;
    P.querySelectorAll('[data-a]').forEach(x => x.addEventListener('click', () => act(x.dataset.a)));
    P.querySelectorAll('[data-f]').forEach(x => {
      const f = x.dataset.f;
      const upd = () => {
        let v = x.type === 'checkbox' ? x.checked : x.value;
        if (f === 'it') v = String(v).split('\n').slice(0, L.items).map(s => s.slice(0, 80));
        else if (['s', 'z', 'l', 'num'].includes(f)) v = parseInt(v, 10) || 0;
        if (v === '' && f !== 't' && f !== 'title' && f !== 'h') delete tgt[f]; else tgt[f] = v;
        const cnt = P.querySelector(`[data-cnt="${f}"]`); if (cnt) cnt.textContent = String(x.value).length + '/' + x.maxLength;
        if (S.tab === 'page' && f === 'hood') { const h = H.HOODS[S.page.hood]; if (!h.streets.includes(S.page.street)) S.page.street = h.streets[3]; if (H.isTaken(S.page.hood, S.page.street, S.page.num)) S.page.num = freeNum(S.page.hood, S.page.street); changed(); return drawProps(); }
        if (S.tab === 'page' && (f === 'street' || f === 'num')) addrInfo();
        changed();
      };
      x.addEventListener('input', upd); x.addEventListener('change', upd);
    });
    P.querySelectorAll('[data-sw]').forEach(box => box.addEventListener('click', ev => {
      const btn = ev.target.closest('button'); if (!btn) return;
      const f = box.dataset.sw, v = btn.dataset.v;
      if (v) tgt[f] = v; else delete tgt[f];
      box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === btn));
      changed();
      if (S.tab === 'page' && f === 'bgc') P.querySelectorAll('.hpzb-tiles [data-bg="none"]').forEach(x => { x.style.background = v; });
    }));
    P.querySelectorAll('[data-bg]').forEach(x => x.addEventListener('click', () => { S.page.bg = x.dataset.bg; P.querySelectorAll('[data-bg]').forEach(y => y.classList.toggle('on', y === x)); changed(); }));
    P.querySelectorAll('[data-pick]').forEach(box => box.addEventListener('click', ev => {
      const btn = ev.target.closest('button'); if (!btn) return;
      const f = box.dataset.pick, v = btn.dataset.v, list = Array.isArray(b[f]) ? b[f] : (b[f] = []), max = f === 's' ? L.stickers : L.badges;
      const i = list.indexOf(v);
      if (i >= 0) { if (list.length === 1) return Desk.toast('PageBuilder', 'Keep at least one! (Or delete the whole thing.)'); list.splice(i, 1); }
      else { if (list.length >= max) return Desk.toast('PageBuilder', `That's the most you can have (${max})!`); list.push(v); }
      box.querySelectorAll('button').forEach(x => { const j = list.indexOf(x.dataset.v); x.classList.toggle('on', j >= 0); if (j >= 0) x.dataset.n = j + 1; else delete x.dataset.n; });
      changed();
    }));
    // links editor
    const lbox = P.querySelector('[data-links]');
    if (lbox) {
      lbox.addEventListener('input', ev => {
        const t = ev.target, i = +(t.dataset.lu || t.dataset.lt); if (!b.l[i]) return;
        if (t.dataset.lu !== undefined) { b.l[i].u = t.value; const ok = !!H.normUrl(t.value), m = lbox.querySelector(`[data-lok="${i}"]`); m.className = ok ? 'hpzb-ok' : 'hpzb-bad'; m.innerHTML = ok ? '&#10004;' : '&#10008;'; m.title = ok ? 'OK!' : 'That address is not on the Web'; }
        else b.l[i].t = t.value;
        changed();
      });
      lbox.addEventListener('click', ev => { const d = ev.target.closest('[data-ldel]'); if (!d) return; b.l.splice(+d.dataset.ldel, 1); changed(); drawProps(); });
      P.querySelector('[data-addlink]').addEventListener('click', () => { if (b.l.length >= L.links) return; b.l.push({ u: '', t: '' }); drawProps(); const ins = S.props.querySelectorAll('[data-lu]'); if (ins.length) ins[ins.length - 1].focus(); });
      P.querySelector('[data-member]').addEventListener('click', ev => {
        const r = ev.target.getBoundingClientRect();
        H.req({ t: 'hpzList', what: 'all' }).then(x => {
          const items = (x.items || []).slice(0, 40);
          if (!items.length) return Desk.toast('PageBuilder', 'No other member pages yet! You could be the first.');
          IE.menu(items.map(it => ({ label: (it.t || '~' + it.n).slice(0, 40) + '  (~' + it.n + ')', act: () => { if (b.l.length >= L.links) return; b.l.push({ u: H.memberUrl(it.k || it.n), t: String(it.t || '~' + it.n).slice(0, 60) }); changed(); drawProps(); } })), r.left, r.bottom);
        });
      });
    }
    // poll answers
    P.querySelectorAll('[data-opt]').forEach(x => x.addEventListener('input', () => { const o = []; P.querySelectorAll('[data-opt]').forEach(y => o.push(y.value)); b.o = o.filter((v, i) => v || i < 2); changed(); }));
    // MIDI preview
    P.querySelectorAll('[data-tune]').forEach(x => x.addEventListener('click', () => { if (x.dataset.tune === 'stop') { V.stopTune(); return; } if (window.Sound && !Sound.on) Desk.toast('MIDI', 'Turn the sound on (the speaker in the tray) to hear it!'); V.playTune(S.page.midi, S.root); }));
  }

  // ---- actions
  function act(a) {
    const p = S.page, i = S.sel;
    switch (a) {
      case 'up': if (i > 0) { [p.blocks[i - 1], p.blocks[i]] = [p.blocks[i], p.blocks[i - 1]]; S.sel--; changed(true); drawProps(); } break;
      case 'down': if (i >= 0 && i < p.blocks.length - 1) { [p.blocks[i + 1], p.blocks[i]] = [p.blocks[i], p.blocks[i + 1]]; S.sel++; changed(true); drawProps(); } break;
      case 'dup': if (i >= 0) { const k = p.blocks[i].k; if (k === 'gb' || k === 'poll') return Desk.toast('PageBuilder', 'One ' + NAME(k).toLowerCase() + ' is plenty!'); if (p.blocks.length >= L.blocks) return insert(k); p.blocks.splice(i + 1, 0, clone(p.blocks[i])); S.sel++; changed(true); drawProps(); } break;
      case 'del': if (i >= 0) { p.blocks.splice(i, 1); S.sel = Math.min(i, p.blocks.length - 1); if (S.sel < 0) S.tab = 'page'; Sound.play('thud'); changed(true); drawProps(); } break;
      case 'new': Desk.msgbox('New Page', 'Start a brand new page? (Your published page stays on the Web until you publish the new one.)', 'q', [['Yes', () => { S.page = newPage({ hood: S.page.hood }); S.sel = -1; S.tab = 'page'; changed(true); drawProps(); }], ['No']]); break;
      case 'save': {
        store.set(DRAFT, S.page);
        A.fs.add('C:/My Documents/My Webs', { name: 'MYPAGE.HTM', type: 'txt', text: source(S.page), size: Math.max(1, Math.ceil(source(S.page).length / 1024)) + ' KB', date: Desk.today99 ? Desk.today99().date : '' });
        Desk.toast('PageBuilder', 'Saved to C:\\My Documents\\My Webs\\MYPAGE.HTM. (Click Publish to put it on the Web!)'); Sound.play('click');
        break;
      }
      case 'open': {
        const me = H.me();
        if (!me.member) return window.Guest ? Guest.need('Opening your published homepage', () => act('open')) : Desk.msgbox('Open', 'Log on to JackNet first, then you can open the page you published.', 'info');
        H.req({ t: 'hpzGet', name: me.nick }).then(r => {
          if (!r.page) return Desk.msgbox('Open', "You haven't published a page yet! Build one and click Publish.", 'info');
          S.page = r.page; S.pub = { a: r.a, hits: r.hits }; S.sel = -1; S.tab = 'page'; store.set(DRAFT, S.page); changed(true); drawProps();
          Desk.toast('PageBuilder', 'Opened your page from ' + H.addrUrl(r.a));
        });
        break;
      }
      case 'publish': return publish();
      case 'view': {
        if (!S.pub) return Desk.msgbox('View on Web', 'Your page is not on the Web yet! Click Publish first.', 'info');
        H.go(H.addrUrl(S.pub.a)); break;
      }
      case 'source': A.secret('hpz.source'); Desk.notepad('index.html', source(S.page)); break;
      case 'tip': tip(); break;
      case 'unpublish': Desk.msgbox('Delete My Page', 'Really delete your page from the World Wide Web? Your hit counter and guestbook will be gone forever! (Your draft stays in PageBuilder.)', 'warn', [['Delete it', () => H.req({ t: 'hpzDel' }).then(r => { if (r.ok) { S.pub = null; status(); Desk.toast('Homepagez', '550 File deleted. Your page has left the World Wide Web.'); } })], ['Cancel']]); break;
    }
  }
  function checkPublished(loadIt) {
    const me = H.me(); if (!me.member) return;
    H.req({ t: 'hpzGet', name: me.nick }).then(r => {
      if (!S || S.w.closed || !r.page) return;
      S.pub = { a: r.a, hits: r.hits };
      if (loadIt) { S.page = r.page; S.sel = -1; store.set(DRAFT, S.page); draw(); drawProps(); } else status();
    });
  }

  // ================================================================ Publish! (the FTP bit)
  function ruleBreak(p) {
    const all = [p.title].concat(...p.blocks.map(b => [b.t, b.h, b.q].concat(b.it || [], b.o || [], (b.l || []).map(x => x.t)))).filter(Boolean).join(' ');
    if (p.hood === 'SpaceCity' && /ice[\s-]*cream|ice[\s-]*lolly|choc[\s-]*ice/i.test(all)) return ['SpaceCity Neighbourhood Watch', 'BEEP BEEP! Our robots have found ICE CREAM on your page! Ice cream is NOT allowed in SpaceCity. (It melts in the rocket exhaust.)\n\nThe Neighbourhood Watch will let you off this once.', 'hpz.ice'];
    if (p.hood === 'Grotville' && /\bsoap/i.test(all)) return ['Grotville Neighbourhood Watch', 'Oi! Something on your page says SOAP. There is NO SOAP in Grotville. Gubbinz is very upset. He will get over it.', null];
    if (p.hood === 'PetPark' && p.street === 'Goldfish' && /\bcats?\b|kitten/i.test(all)) return ['PetPark Neighbourhood Watch', 'Your page mentions CATS. On Goldfish Street! The residents are very nervous now. Please be careful.', null];
    if (p.hood === 'Tunesville' && /\bsilence\b|\bquiet\b/i.test(all)) return ['Tunesville Neighbourhood Watch', 'Did somebody say QUIET?! This is Tunesville! TURN IT UP!!!', null];
    return null;
  }
  function publish() {
    const me = H.me(), p = S.page;
    // guests can build a draft (it's kept on this PC); putting it on the Web is for JackNet members
    if (!me.member) return window.Guest ? Guest.need('Publishing a homepage', () => { if (!S.w.closed) publish(); }) : Desk.msgbox('Publish', 'You need a JackNet membership to publish a homepage. It is FREE! Log on with Start > Log Off, then click Publish again.', 'info');
    if (!p.blocks.length) return Desk.msgbox('Publish', 'Your page is empty! Add some things to it first. (A heading? A cat?)', 'warn');
    if (H.isTaken(p.hood, p.street, p.num)) { S.tab = 'page'; drawProps(); return Desk.msgbox('Publish', 'Somebody already lives at ' + H.addrText(p.hood, p.street, p.num) + '! Pick a different house number on the Page tab.', 'warn'); }
    const size = JSON.stringify(p).length;
    if (size > L.json) return Desk.msgbox('Publish', `Your page is too big! It is ${(size / 1024).toFixed(1)} KB and each Homepagez page can only be ${Math.floor(L.json / 1024)} KB. Take some bits out.`, 'warn');
    const rb = ruleBreak(p);
    if (rb) { if (rb[2]) A.secret(rb[2]); return Desk.msgbox(rb[0], rb[1], 'warn', [['Publish anyway', ftp], ['Cancel']]); }
    ftp();
  }
  function ftp() {
    const me = H.me();
    // a page started before logging on says "YourName": fill in the real one
    if (me.member) { const fix = s => (typeof s === 'string' ? s.replace(/YourName/g, me.nick) : s); S.page.title = fix(S.page.title); S.page.blocks.forEach(b => { b.t = fix(b.t); }); }
    const p = clone(S.page), user = String(me.nick || 'you').toLowerCase(), a = H.addrText(p.hood, p.street, p.num);
    const body = document.createElement('div'); body.className = 'hpzftp';
    body.innerHTML = '<pre aria-live="polite"></pre><div class="prog"><span style="display:flex;gap:2px"></span></div><div class="row" style="justify-content:flex-end;margin-top:8px;gap:6px"><button type="button" class="btn" data-x="cancel">Cancel</button></div>';
    const w = A.win('Publishing to ftp.homepagez.webcom', body, { w: 460, noMax: true, icon: H.ICON, escClose: false });
    const pre = body.querySelector('pre'), bar = body.querySelector('.prog span'), btns = body.querySelector('.row');
    let cancelled = false, step = 0;
    btns.querySelector('[data-x=cancel]').addEventListener('click', () => { cancelled = true; w.close(); });
    const log = s => { pre.textContent += s + '\n'; pre.scrollTop = pre.scrollHeight; };
    const prog = n => { bar.innerHTML = '<i></i>'.repeat(Math.max(0, Math.min(24, n))); };
    const json = JSON.stringify(p), bytes = new TextEncoder().encode(json);
    const kb = (bytes.length * 3.1 + 2048) | 0; // it's "HTML", so it's bigger
    const script = [
      'ftp> open ftp.homepagez.webcom', 'Connected to ftp.homepagez.webcom.', '220 Homepagez FTP server (Version 2.1) ready.', `Name (ftp.homepagez.webcom:${user}): ${user}`,
      `331 Password required for ${user}.`, 'Password: ********', `230 User ${user} logged in.`, `ftp> cd /${a}`, '250 CWD command successful.', 'ftp> binary', '200 Type set to I.',
      'ftp> put index.html', '200 PORT command successful.', `150 Opening BINARY mode data connection for index.html (${kb} bytes).`,
    ];
    let reply = null, waiting = false;
    const next = () => {
      if (cancelled || w.closed) return;
      if (step < script.length) { log(script[step]); prog(Math.round(step / (script.length + 6) * 24)); step++; if (step === script.length) send(); return setTimeout(next, step < 8 ? 220 + Math.random() * 200 : 160); }
      if (!reply) { if (!waiting) { waiting = true; log('...'); } return setTimeout(next, 250); }
      finish();
    };
    const send = () => {
      let b64 = ''; const CH = 0x8000;
      for (let i = 0; i < bytes.length; i += CH) b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
      b64 = btoa(b64);
      const n = Math.max(1, Math.ceil(b64.length / 3000)), id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6), rid = H.rid();
      for (let i = 0; i < n - 1; i++) Net.send({ t: 'hpzPut', id, i, n, d: b64.slice(i * 3000, i * 3000 + 3000), rid });
      H.req({ t: 'hpzPut', id, i: n - 1, n, d: b64.slice((n - 1) * 3000), rid }, 15000).then(r => { reply = r; });
    };
    const finish = () => {
      const r = reply;
      if (!r.ok) {
        log((r.err && /^\d{3} /.test(r.err) ? '' : '550 ') + (r.err || 'Upload failed.'));
        log('ftp> bye'); log('221 Goodbye.'); prog(0); Sound.play('uhoh');
        btns.innerHTML = '<button type="button" class="btn" data-x="close">Close</button>';
        btns.querySelector('[data-x=close]').addEventListener('click', w.close);
        if (/neighbourhood|street|house|lives/i.test(r.err || '')) { S.tab = 'page'; drawProps(); }
        return;
      }
      const secs = (1 + Math.random() * 2).toFixed(2);
      ['226 Transfer complete.', `${kb} bytes sent in ${secs} seconds (${(kb / 1024 / secs).toFixed(2)} Kbytes/s)`, 'ftp> put counter.gif', '226 Transfer complete.', 'ftp> put guestbook.cgi', '226 Transfer complete.', 'ftp> bye', '221 Goodbye. Thank you for using Homepagez!'].forEach(log);
      prog(24); Sound.play('solve');
      S.pub = { a: r.addr, hits: r.hits | 0 }; S.page = r.page; store.set(DRAFT, S.page); draw(); drawProps();
      A.secret('hpz.publish'); if (H.isRent(p.hood, p.street, p.num)) A.secret('hpz.rent');
      if (p.blocks.filter(b => b.k === 'bl').length >= 5) A.secret('hpz.blink');
      const url = H.addrUrl(r.addr), short = H.memberUrl(user);
      const done = document.createElement('div'); done.className = 'done';
      done.innerHTML = `<b class="big">Your page has been published to the World Wide Web!</b>Anyone on JackNet can visit it now at:<br><tt></tt><br>or <tt></tt><br>${r.stripped ? `<br><i>The Homepagez robot tidied up ${r.stripped | 0} thing${r.stripped === 1 ? '' : 's'} on your page (like links that didn't go anywhere).</i><br>` : ''}<br>Tell your mates! Write it on your pencil case!`;
      const tts = done.querySelectorAll('tt'); tts[0].textContent = url; tts[1].textContent = short;
      body.insertBefore(done, pre);
      btns.innerHTML = '<button type="button" class="btn" data-x="view">View my page!</button><button type="button" class="btn" data-x="close">Close</button>';
      btns.querySelector('[data-x=view]').addEventListener('click', () => { w.close(); H.go(url); });
      btns.querySelector('[data-x=close]').addEventListener('click', w.close);
      Desk.toast('Homepagez', 'Your page is on the World Wide Web!');
    };
    next();
  }

  // ================================================================ Tip of the Day, About
  function tip() {
    const st = store.get(TIPK, { on: true, i: 0, seen: [] });
    st.seen = Array.isArray(st.seen) ? st.seen : [];
    let i = (st.i | 0) % TIPS.length;
    const body = document.createElement('div');
    body.innerHTML = `<div class="hpztip"><div class="bulb">${BULB}</div><div class="tipbox"><b>Did you know...</b><span class="tt"></span></div></div><div class="row" style="justify-content:space-between;margin-top:10px;flex-wrap:wrap;gap:6px"><label><input type="checkbox" class="on"${st.on !== false ? ' checked' : ''}> Show tips at startup</label><span><button type="button" class="btn" data-x="next">Next Tip</button> <button type="button" class="btn" data-x="close">Close</button></span></div>`;
    const w = A.win('Tip of the Day', body, { w: 380, noMax: true, noResize: true, icon: H.ICON, escClose: true });
    const show = () => {
      body.querySelector('.tt').textContent = TIPS[i];
      if (!st.seen.includes(i)) st.seen.push(i);
      if (st.seen.length >= TIPS.length) A.secret('hpz.tips');
      st.i = (i + 1) % TIPS.length; store.set(TIPK, st);
    };
    body.querySelector('[data-x=next]').addEventListener('click', () => { i = (i + 1) % TIPS.length; show(); Sound.play('click'); });
    body.querySelector('[data-x=close]').addEventListener('click', w.close);
    body.querySelector('.on').addEventListener('change', ev => { st.on = ev.target.checked; store.set(TIPK, st); });
    show();
  }
  function about() {
    const me = H.me();
    Desk.msgbox('About Homepagez PageBuilder', `Homepagez PageBuilder\nVersion 2.0 (Build 1999.06.01)\n\nLicensed to: ${me.member ? me.nick : 'Unregistered User'}\nFree web space: 2,048 KB\nClip art: ${H.STICKERS.length} pictures\nBlink tags: unlimited\n\n(c) 1999 Homepagez Inc. All rights reserved.\n"Everybody deserves a home on the Web."`, 'info');
  }

  H.builder = { mount, apply, source };
})();
