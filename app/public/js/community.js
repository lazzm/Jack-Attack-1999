/* JackNet community: member profiles (avatars, bios, themes, shout-outs) and the forums. */
(function () {
  const $ = id => document.getElementById(id);
  // members-only things go through the one gate (js/guest.js): a member carries straight on, a guest gets the box
  const gate = (what, fn) => (window.Guest ? Guest.need(what, fn) : (Net.me.member && fn && fn(), !!Net.me.member));
  const mbadge = () => (Net.me.member || !window.Guest ? '' : Guest.badge());
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ago = ts => { const s = Math.max(0, (Date.now() - ts) / 1000); if (s < 90) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' mins ago'; if (s < 86400) { const h = Math.round(s / 3600); return h + ' hour' + (h > 1 ? 's' : '') + ' ago'; } const d = Math.round(s / 86400); return d < 60 ? d + ' day' + (d > 1 ? 's' : '') + ' ago' : 'ages ago'; };

  // ================================================================ pixel avatars (10x10)
  const PAL = { k: '#000', w: '#fff', g: '#3a9a2a', G: '#1f5e14', r: '#e10600', y: '#ffd400', b: '#2a7ad8', B: '#0028c8', o: '#ff8000', p: '#ff8ac0', s: '#f2c79a', n: '#7a4a1a', c: '#00e5ff', m: '#8000ff', a: '#9a9a9a', A: '#555', d: '#7a0a00' };
  const AV = [
    ['....rr....', '...rrrr...', '..rrrrrr..', 'g.gggggg.g', 'ggwkggwkgg', '.ggggGggg.', '..gwwwwg..', '...gggg...', '..nnnnnn..', '..nn..nn..'], // goblin (pointy red hat, big nose, cheeky grin)
    ['..GGGGGG..', '.GggggggG.', 'GgrggggrgG', 'GggggggggG', 'GgkkkkkkgG', 'Gwgk..kgwG', '.GggggggG.', '..GGGGGG..', '..nnnnnn..', '.nn....nn.'], // ork
    ['..........', '.dd....dd.', 'drrddddrrd', 'drwkrrwkrd', 'drwkrrwkrd', 'dprrrrrrpd', 'drrdrrdrrd', '.drrddrrd.', '..dddddd..', '..d....d..'], // Blobbit (round, ears, big eyes, grin)
    ['...BBBB...', '..BBBBBB..', '.BBBBBBBB.', '.BccBBccB.', '.BBBBBBBB.', '.BBkkkkBB.', '..BBBBBB..', '.BBBBBBBB.', 'BBBBBBBBBB', 'BB.BBBB.BB'], // space marine
    ['...a..a...', '..aaaaaa..', '.aaaaaaaa.', '.aryaayra.', '.aaaaaaaa.', '.akakakaa.', '..aaaaaa..', '...aaaa...', '.aaaaaaaa.', '.a.a..a.a.'], // robot
    ['..........', '..cccccc..', '.cccccccc.', 'ckkcccckkc', 'ckkcccckkc', '.cccccccc.', '..cckkcc..', '...cccc...', '....cc....', '..........'], // alien
    ['..wwwwww..', '.wwwwwwww.', 'wwkwwwwkww', 'wwkwwwwkww', 'wwwwwwwwww', 'wwwwkkwwww', 'wwwwwwwwww', 'wwwwwwwwww', 'w.ww.ww.ww', '..........'], // ghost
    ['.o......o.', '.oo....oo.', '.oooooooo.', 'ooggooggoo', 'oooooooooo', 'ooooppoooo', '.oowkkwoo.', '..oooooo..', '...oooo...', '..........'], // cat
    ['r.......r.', 'rr.rrrr.rr', '.rrrrrrrr.', '.ryrrrryr.', '.rrrrrrrr.', '..rrrrrr..', '..rwrrwr..', '...rrrr...', '..rr..rr..', '.rr....rr.'], // dragon
    ['..yyyyyy..', '.yyyyyyyy.', 'yyykyykyyy', 'yyykyykyyy', 'yyyyyyyyyy', 'ykyyyyyyky', 'yykyyyykyy', '.yykkkkyy.', '..yyyyyy..', '..........'], // smiley
    ['..kkkkkk..', '.kkkkkkkk.', 'kkkkkkkkkk', 'kswskswskk', 'kkkkkkkkkk', 'kkkkkkkkkk', '.kkkkkkkk.', 'rrrrrrrrrr', '.kkkkkkkk.', '.kk....kk.'], // ninja
    ['....m.....', '...mmm....', '..mmymm...', '.mmmmmmm..', 'mmmmmmmmm.', '..ssssss..', '..skssks..', '..ssssss..', '..swwwws..', '..wwwwww..'], // wizard
    ['..wwwwww..', '.wwwwwwww.', 'wwkkwwkkww', 'wwkkwwkkww', 'wwwwwwwwww', 'wwwwkkwwww', '.wwwwwwww.', '..wkwkwk..', '..wwwwww..', '..........'], // skull
    ['.rr....rr.', 'rrrr..rrrr', 'rrrrrrrrrr', 'rrwrrrrrrr', 'rrrrrrrrrr', '.rrrrrrrr.', '..rrrrrr..', '...rrrr...', '....rr....', '..........'], // heart
    ['..........', '..aaaaaa..', '.aaaaaaaaa', 'aakaaaaraa', 'akkkaaraba', 'aakaaayaaa', '.aaaaaaaaa', '..aa..aa..', '..........', '..........'], // controller
    ['rrryyyBBB.', 'rrryyyBBB.', 'rrryyyBBB.', 'gggwwwooo.', 'gggwwwooo.', 'gggwwwooo.', 'BBBrrryyy.', 'BBBrrryyy.', 'BBBrrryyy.', '..........'], // cube
  ];
  const AV_NAMES = ['Goblin', 'Ork', 'Blobbit', 'Space Marine', 'Robot', 'Alien', 'Ghost', 'Cat', 'Dragon', 'Smiley', 'Ninja', 'Wizard', 'Skull', 'Heart', 'Joypad', 'Cube'];
  const avCache = {};
  function avatarURL(i) {
    i = Math.max(0, Math.min(AV.length - 1, i | 0));
    if (avCache[i]) return avCache[i];
    const c = document.createElement('canvas'); c.width = c.height = 10;
    const g = c.getContext('2d');
    AV[i].forEach((row, y) => [...row].forEach((ch, x) => { if (PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } }));
    return (avCache[i] = c.toDataURL());
  }
  const avImg = (i, size, cls) => `<img class="av ${cls || ''}" src="${avatarURL(i)}" width="${size}" height="${size}" alt="">`;
  const nameLink = (name, col) => `<a href="#" class="plink" data-profile="${esc(name)}" style="color:${esc(col || '#0028c8')}">${esc(name)}</a>`;
  const THEMES = ['stars', 'flames', 'matrix', 'clouds', 'hearts', 'grass', 'space', 'plain'];
  const PCOLS = ['#e10600', '#ff8000', '#c9a000', '#2a9a2a', '#008080', '#0028c8', '#8000ff', '#d1007a', '#000000', '#808080'];
  let MOODS = ['Happy'];

  // ================================================================ members + profiles
  const mv = $('memView');
  let pending = null;
  function members() { profName = ''; mv.innerHTML = '<p>Loading members...</p>'; Net.send({ t: 'members' }); }
  Net.on('members', m => {
    MOODS = m.moods || MOODS;
    const me = Net.me;
    mv.innerHTML = `<div class="row" style="justify-content:space-between;margin-bottom:8px"><span><b>${m.list.length}</b> JackNet member${m.list.length === 1 ? '' : 's'}. Click a member to see their profile.</span>${me.member ? '<button class="btn" data-myprofile>Edit my profile</button>' : '<button class="btn" data-logon>Become a member!</button>'}</div>
      <div class="memgrid">${m.list.map(x => `<button class="memcard" data-profile="${esc(x.name)}">${avImg(x.avatar, 40)}<span><b style="color:${esc(x.col)}">${esc(x.name)}</b><small>Member #${x.no} &middot; ${x.posts} post${x.posts === 1 ? '' : 's'}</small><small>${esc(MOODS[x.mood] || '')}</small></span>${x.online ? '<i class="ondot" title="Online now"></i>' : ''}</button>`).join('') || '<p>No members yet. Be the first!</p>'}</div>`;
  });
  let profName = '';
  function openProfile(name) { if (window.IE && IE.current !== 'members') IE.go('members', 'click'); profName = String(name); mv.innerHTML = '<p>Loading profile...</p>'; Net.send({ t: 'profile', name }); }
  Net.on('profile', m => {
    if (m.missing !== undefined) { mv.innerHTML = `<p>There's no member called <b>${esc(m.missing)}</b>. Maybe they were just a guest?</p><button class="btn" data-members>&laquo; All members</button>`; return; }
    const p = m.p; MOODS = p.moods || MOODS;
    const visits = String(p.visits).padStart(5, '0');
    mv.innerHTML = `<div class="profile theme-${esc(p.theme)}">
      <div class="phead">${avImg(p.avatar, 96, 'big')}<div><h3 style="color:${esc(p.col)}">${esc(p.name)}</h3>
        <div class="pmeta">JackNet member <b>#${p.no}</b> &middot; joined ${ago(p.created)} ${p.online ? '&middot; <span class="ondot inline"></span> online now' : ''}</div>
        <div class="puhoh">Uh-Oh! number: <b>${1999000 + (p.no | 0) * 37}</b> ${p.me ? '<a href="#" data-uhohadd="' + esc(p.name) + '">(that\'s you! give it to your mates)</a>' : '<a href="#" class="uhohbadge" data-uhohadd="' + esc(p.name) + '">Add me on Uh-Oh!</a>'}</div>
        <div class="pmood">Mood: <b>${esc(MOODS[p.mood] || '')}</b></div></div></div>
      <div class="pbody">
        <div class="pbio">${p.bio ? esc(p.bio) : '<i>This member hasn\'t written a bio yet.</i>'}</div>
        <table class="pfacts"><tr><th>Favourite game</th><td>${esc(p.game) || '-'}</td></tr><tr><th>Favourite film</th><td>${esc(p.film) || '-'}</td></tr><tr><th>Playing right now</th><td>${esc(p.playing) || '-'}</td></tr><tr><th>Favourite Pok&eacute;mon</th><td>${esc(p.poke) || '-'}</td></tr><tr><th>Forum posts</th><td>${p.posts}</td></tr></table>
        <div class="pvisits">This profile has been visited <span class="lcdnum">${[...visits].map(c => '<b>' + c + '</b>').join('')}</span> times!</div>
        ${p.sig ? `<div class="psig">${esc(p.sig)}</div>` : ''}
      </div>
      <div class="pshouts"><h4>Shout-outs (${p.shouts.length})</h4>
        ${p.shouts.slice().reverse().map(s => `<div class="shout"><b>${nameLink(s.by)}</b> <small>${ago(s.ts)}</small><div>${esc(s.text)}</div></div>`).join('') || '<p><i>No shout-outs yet. Be the first!</i></p>'}
        <form class="row shoutform" data-shoutto="${esc(p.name)}"><input type="text" maxlength="200" placeholder="Leave a shout-out for ${esc(p.name)}..." style="flex:1;min-width:0"><button class="btn">Shout!</button>${mbadge()}</form>
      </div>
      <div class="row" style="margin-top:10px"><button class="btn" data-members>&laquo; All members</button>${p.me ? '<button class="btn" data-myprofile>Edit my profile</button>' : ''}</div>
    </div>`;
  });
  Net.on('shouted', m => Desk.toast('Shout-out!', `${m.by} left you a shout-out on your profile!`, 6000));

  function editProfile() {
    if (!Net.me.member) return gate('Having your own JackNet profile', editProfile);
    if (window.IE && IE.current !== 'members') IE.go('members', 'click');
    pending = 'edit'; profName = '~edit~'; Net.send({ t: 'profile', name: Net.me.nick });
  }
  Net.on('profile', m => {
    if (pending !== 'edit' || !m.p || !m.p.me) return;
    pending = null;
    const p = m.p;
    mv.innerHTML = `<form class="pedit" id="pedit"><h3>Edit my profile</h3>
      <div class="pe-row"><label>Avatar</label><div class="avpick">${AV.map((_, i) => `<label title="${AV_NAMES[i]}"><input type="radio" name="avatar" value="${i}" ${i === p.avatar ? 'checked' : ''}>${avImg(i, 40)}</label>`).join('')}</div></div>
      <div class="pe-row"><label>Name colour</label><div class="colpick">${PCOLS.map(c => `<label><input type="radio" name="col" value="${c}" ${c === p.col ? 'checked' : ''}><i style="background:${c}"></i></label>`).join('')}</div></div>
      <div class="pe-row"><label for="peMood">Mood</label><select id="peMood" name="mood">${MOODS.map((md, i) => `<option value="${i}" ${i === p.mood ? 'selected' : ''}>${esc(md)}</option>`).join('')}</select></div>
      <div class="pe-row"><label for="peTheme">Page theme</label><select id="peTheme" name="theme">${THEMES.map(t => `<option ${t === p.theme ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="pe-row"><label for="peBio">About me</label><textarea id="peBio" name="bio" rows="5" maxlength="600" placeholder="Tell everyone about yourself! (No addresses or phone numbers please.)">${esc(p.bio)}</textarea></div>
      <div class="pe-row"><label for="peGame">Favourite game</label><input type="text" id="peGame" name="game" maxlength="40" value="${esc(p.game)}"></div>
      <div class="pe-row"><label for="peFilm">Favourite film</label><input type="text" id="peFilm" name="film" maxlength="40" value="${esc(p.film)}"></div>
      <div class="pe-row"><label for="pePlay">Playing right now</label><input type="text" id="pePlay" name="playing" maxlength="40" value="${esc(p.playing)}"></div>
      <div class="pe-row"><label for="pePoke">Favourite Pok&eacute;mon</label><input type="text" id="pePoke" name="poke" maxlength="20" value="${esc(p.poke)}"></div>
      <div class="pe-row"><label for="peSig">Forum signature</label><input type="text" id="peSig" name="sig" maxlength="100" value="${esc(p.sig)}" placeholder="e.g. WAAAGH!!! ~*~ Squirtle 4 eva ~*~"></div>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-members>Cancel</button><button class="btn big" type="submit">Save profile</button></div></form>`;
  });
  document.addEventListener('submit', ev => {
    const f = ev.target;
    if (f.id === 'pedit') {
      ev.preventDefault();
      const fd = new FormData(f), q = {};
      for (const [k, v] of fd) q[k] = v;
      q.avatar = +q.avatar; q.mood = +q.mood;
      Net.send({ t: 'saveProfile', p: q });
    } else if (f.classList.contains('shoutform')) {
      ev.preventDefault();
      const inp = f.querySelector('input'); if (!inp.value.trim()) return;
      if (!Net.me.member) return gate('Leaving shout-outs', () => { if (f.isConnected) f.requestSubmit(); });
      Net.send({ t: 'shout', name: f.dataset.shoutto, text: inp.value }); inp.value = '';
    } else if (f.id === 'fnew' || f.id === 'freply') {
      ev.preventDefault();
      if (!Net.me.member) { if (window.Apps) Apps.secret('gst.post'); return gate('Posting on the forums', () => { if (f.isConnected) f.requestSubmit(); }); } // what they typed waits for them
      const body = f.querySelector('textarea').value;
      if (f.id === 'fnew') Net.send({ t: 'fNew', board: f.dataset.board, title: f.querySelector('input').value, body });
      else Net.send({ t: 'fReply', topic: +f.dataset.topic, body });
      f.querySelector('button[type=submit]').disabled = true;
      setTimeout(() => { const b = f.querySelector('button[type=submit]'); if (b) b.disabled = false; }, 1500);
    }
  });
  Net.on('profileSaved', m => { Desk.toast('My Profile', 'Profile saved! Looking good.'); Sound.play('pet'); openProfile(m.name); });

  // ================================================================ forums
  const fv = $('forumView');
  const crumbs = parts => `<div class="fcrumb">${parts.map((p, i) => i < parts.length - 1 ? `<a href="#" ${p[1]}>${esc(p[0])}</a>` : `<b>${esc(p[0])}</b>`).join(' &raquo; ')}</div>`;
  const FOLDER = '<svg viewBox="0 0 16 16" width="20" height="20"><path d="M1 3h5l1 1.5h8V14H1z" fill="#f2d16b" stroke="#7a5a00"/></svg>';
  const FOLDER_NEW = '<svg viewBox="0 0 16 16" width="20" height="20"><path d="M1 3h5l1 1.5h8V14H1z" fill="#ff8a40" stroke="#7a2a00"/><text x="8" y="12" font-size="7" text-anchor="middle" fill="#fff" font-weight="bold">!</text></svg>';
  let fstate = { view: 'boards' };
  const seenKey = 'jhp_fseen';
  const seen = () => { try { return JSON.parse(localStorage.getItem(seenKey) || '{}'); } catch (e) { return {}; } };
  const markSeen = (id, ts) => { const s = seen(); s[id] = ts; try { localStorage.setItem(seenKey, JSON.stringify(s)); } catch (e) {} };
  function boards() { fstate = { view: 'boards' }; Net.send({ t: 'fBoards' }); }
  function topics(board, page) { fstate = { view: 'topics', board, page: page || 1 }; Net.send({ t: 'fTopics', board, page: page || 1 }); }
  function topic(id, page) { fstate = { view: 'topic', id, page: page || 1 }; Net.send({ t: 'fTopic', id, page: page || 1 }); }
  const pager = (page, pages, attr) => pages > 1 ? `<div class="fpager">Pages: ${Array.from({ length: pages }, (_, i) => i + 1 === page ? `<b>[${i + 1}]</b>` : `<a href="#" ${attr}="${i + 1}">${i + 1}</a>`).join(' ')}</div>` : '';
  Net.on('fBoards', m => {
    if (fstate.view !== 'boards') return;
    fv.innerHTML = crumbs([['JACK ATTACK! Forums']]) + `<table class="ftable"><tr><th colspan="2">Forum</th><th>Topics</th><th>Posts</th><th>Last post</th></tr>
      ${m.boards.map(b => `<tr><td class="fic">${b.last && (seen()['b' + b.id] || 0) < b.last.ts ? FOLDER_NEW : FOLDER}</td><td><a href="#" class="fboard" data-board="${b.id}">${esc(b.name)}</a><div class="fdesc">${esc(b.desc)}</div></td><td class="fnum">${b.topics}</td><td class="fnum">${b.posts}</td><td class="flast">${b.last ? `${ago(b.last.ts)}<br>by ${nameLink(b.last.by)}` : 'No posts'}</td></tr>`).join('')}
      </table><div class="fstats">JackNet has <b>${m.members}</b> member${m.members === 1 ? '' : 's'} and <b>${m.online}</b> ${m.online === 1 ? 'person' : 'people'} online right now. ${FOLDER_NEW} = new posts since your last visit.</div>`;
  });
  Net.on('fTopics', m => {
    if (fstate.view !== 'topics' || fstate.board !== m.board) return;
    markSeen('b' + m.board, Date.now());
    fv.innerHTML = crumbs([['JACK ATTACK! Forums', 'data-fhome'], [m.boardName]]) +
      `<div class="row" style="justify-content:space-between;margin:6px 0"><span><button class="btn big" data-fnewtopic="${m.board}">New Topic</button>${mbadge()}</span>${pager(m.page, m.pages, 'data-fpage')}</div>
      <table class="ftable"><tr><th colspan="2">Topic</th><th>Started by</th><th>Replies</th><th>Views</th><th>Last post</th></tr>
      ${m.list.map(t => `<tr><td class="fic">${(seen()['t' + t.id] || 0) < t.last ? FOLDER_NEW : FOLDER}</td><td><a href="#" class="ftopic" data-topic="${t.id}">${esc(t.title)}</a></td><td>${nameLink(t.by)}</td><td class="fnum">${t.replies}</td><td class="fnum">${t.views}</td><td class="flast">${ago(t.last)}<br>by ${nameLink(t.lastBy)}</td></tr>`).join('') || '<tr><td colspan="6" class="fempty">No topics yet. Start one!</td></tr>'}
      </table>`;
  });
  function bb(text) { // [b] [i] [u] [quote] and a few smileys, on top of escaped text
    let h = esc(text);
    h = h.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>').replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<i>$1</i>').replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>')
      .replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote>$1</blockquote>');
    const SM = { ':)': '#ffd400', ':D': '#ffb000', ';)': '#ffd400', ':(': '#7ec8ff', ':P': '#ff8ac0', ':O': '#ffd400' };
    h = h.replace(/(^|\s)(:\)|:D|;\)|:\(|:P|:O)(?=\s|$)/g, (_, sp, s) => `${sp}<span class="smiley" style="background:${SM[s]}">${s}</span>`);
    return h.replace(/\n/g, '<br>');
  }
  Net.on('fTopic', m => {
    if (fstate.view !== 'topic' || fstate.id !== m.topic.id) return;
    MOODS = m.moods || MOODS;
    markSeen('t' + m.topic.id, Date.now());
    fv.innerHTML = crumbs([['JACK ATTACK! Forums', 'data-fhome'], [m.boardName, `data-fboardlink="${m.topic.board}"`], [m.topic.title]]) + pager(m.page, m.pages, 'data-ftpage') +
      `<table class="ftable fposts"><tr><th style="width:150px">Author</th><th>${esc(m.topic.title)}</th></tr>
      ${m.posts.map(p => { const a = p.author; return `<tr><td class="fauthor">${a ? `${nameLink(a.name, a.col)}<br>${avImg(a.avatar, 48)}<div class="fainfo">Member #${a.no}<br>Posts: ${a.posts}<br>Mood: ${esc(MOODS[a.mood] || '')}${a.online ? '<br><span class="ondot inline"></span> online' : ''}</div>` : `<b>${esc(p.by)}</b>`}</td>
        <td class="fpost"><div class="fphead">Posted ${ago(p.ts)}${Net.me.member && p.by === Net.me.nick && !/^\[deleted/.test(p.body) ? ` &middot; <a href="#" data-fdel="${p.id}">delete</a>` : ''} &middot; <a href="#" data-fquote="${p.id}">quote</a></div><div class="fpbody" data-raw="${esc(p.body)}" data-by="${esc(p.by)}">${bb(p.body)}</div>${a && a.sig ? `<div class="fsig">${esc(a.sig)}</div>` : ''}</td></tr>`; }).join('')}
      </table>` + pager(m.page, m.pages, 'data-ftpage') +
      `<form id="freply" class="fform" data-topic="${m.topic.id}"><b>Post a reply${mbadge()}</b> <span class="small">[b]bold[/b] [i]italic[/i] [quote]...[/quote] :) :D ;)</span><textarea rows="5" maxlength="2000" required></textarea><div class="row" style="justify-content:flex-end"><button class="btn big" type="submit">Post Reply</button></div></form>`;
  });
  Net.on('fPosted', m => { Sound.play('pet'); if (m.topic) topic(m.topic, 'last'); else topics(m.board || fstate.board); });
  Net.on('fActivity', m => {
    if (m.by !== Net.me.nick) Desk.toast('JackNet Forums', `${m.by} ${m.kind === 'topic' ? 'started a new topic' : 'replied to'}: "${m.title}"`, 4500);
    if (window.IE && IE.current === 'forums') { if (fstate.view === 'boards') boards(); else if (fstate.view === 'topics' && fstate.board === m.board) topics(m.board, fstate.page); else if (fstate.view === 'topic' && fstate.id === m.topic && m.by !== Net.me.nick) topic(m.topic, fstate.page); }
  });
  function newTopicForm(board) {
    fstate = { view: 'new', board };
    fv.innerHTML = crumbs([['JACK ATTACK! Forums', 'data-fhome'], ['New topic']]) + `<form id="fnew" class="fform" data-board="${board}"><label>Topic title<input type="text" maxlength="80" required style="width:100%"></label><label>Message <span class="small">[b]bold[/b] [i]italic[/i] :) :D</span><textarea rows="8" maxlength="2000" required></textarea></label><div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-fboardlink="${board}">Cancel</button><button class="btn big" type="submit">Post New Topic</button></div></form>`;
  }

  // ================================================================ clicks
  document.addEventListener('click', ev => {
    const t = ev.target.closest('[data-profile],[data-myprofile],[data-members],[data-logon],.fboard,[data-fboardlink],.ftopic,[data-fhome],[data-fnewtopic],[data-fpage],[data-ftpage],[data-fdel],[data-fquote]');
    if (!t) return;
    ev.preventDefault();
    const d = t.dataset;
    if (d.profile !== undefined) openProfile(d.profile);
    else if (d.myprofile !== undefined) editProfile();
    else if (d.members !== undefined) members();
    else if (d.logon !== undefined) { if (window.JackLogon) JackLogon.show(); }
    else if (t.classList.contains('fboard')) topics(d.board);
    else if (d.fboardlink) topics(d.fboardlink);
    else if (t.classList.contains('ftopic')) topic(+d.topic);
    else if (d.fhome !== undefined) boards();
    else if (d.fnewtopic) { if (!Net.me.member && window.Apps) Apps.secret('gst.post'); gate('Posting on the forums', () => newTopicForm(d.fnewtopic)); }
    else if (d.fpage) topics(fstate.board, +d.fpage);
    else if (d.ftpage) topic(fstate.id, +d.ftpage);
    else if (d.fdel) Desk.msgbox('Delete post', 'Delete this post?', 'q', [['Yes', () => Net.send({ t: 'fDel', topic: fstate.id, post: +d.fdel })], ['No']]);
    else if (d.fquote) { const body = t.closest('.fpost').querySelector('.fpbody'), ta = document.querySelector('#freply textarea'); if (ta) { ta.value += `[quote]${body.dataset.by} said:\n${body.dataset.raw}[/quote]\n`; ta.focus(); } }
  });
  document.addEventListener('section', ev => { if (ev.detail === 'members' && !pending) members(); if (ev.detail === 'forums') boards(); });
  Net.on('welcome', () => { if (window.IE && IE.current === 'forums') boards(); if (window.IE && IE.current === 'members') members(); });
  // where am I? (for other people's cursors: only people on the same board / topic / profile see each other)
  function where(which) {
    if (which === 'members') return profName.toLowerCase();
    return fstate.view === 'topic' ? 't' + fstate.id : fstate.view === 'topics' ? 'b' + fstate.board : fstate.view === 'new' ? 'new' : '';
  }
  window.Community = { openProfile, editProfile, avatarURL, nameLink, where };
})();
