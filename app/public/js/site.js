/* JACK ATTACK! Online: the extra magazine pages (Star Wars shrine, Comics, Top 10s, Quiz, Polls, Compo, Pen Pals,
 * Downloads, Links), the live arcade extras and the little touches on the old pages. Bulk content lives in
 * js/site-data.js and is loaded the first time a page needs it. Shared state goes through Net.kv / Net.relay. */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmt = n => Number(n || 0).toLocaleString('en-GB');
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const toast = (t, m, ms) => window.Desk && Desk.toast(t, m, ms);
  const sfx = n => window.Sound && Sound.play(n);
  const me = () => (window.Net && Net.me) || { id: 0, nick: '?' };
  const myField = () => 'v' + String((window.Net && Net.cid) || 'x').replace(/[^a-z0-9]/g, '').slice(0, 16);
  const today = () => (window.Desk && Desk.today99 ? Desk.today99() : { m: 1, d: 1, md: 101, date: new Date(1999, 0, 1) });
  const dd = t => String(t.d).padStart(2, '0') + '/' + String(t.m).padStart(2, '0') + '/99';
  const secret = id => window.Apps && Apps.secret(id);
  const A = window.Apps;
  let DATA = null;
  const data = () => DATA ? Promise.resolve(DATA) : (A ? A.load('js/site-data.js') : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/site-data.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); })).then(() => (DATA = window.SITE_DATA));
  const strip = s => String(s).replace(/<[^>]+>/g, '').replace(/&eacute;/g, 'é').replace(/&Eacute;/g, 'É').replace(/&amp;/g, '&').replace(/&pound;/g, '£').replace(/&middot;/g, '·');

  // ================================================================ secrets
  if (A) {
    [['site.holocron', 'Found the Holocron', 'Read the marquee REALLY closely'], ['site.letter', 'Pen friend', 'Write to Jack'], ['site.vod', 'Visitor of the Day', 'Be first through the door one morning'],
     ['site.force', 'Strong with the Force', 'Use the Force. A lot.'], ['site.quiz10', 'Ultimate nerd', 'A perfect score on the Nerd Quiz'], ['site.jedi', 'Jedi Master', 'Pass the Jedi test with flying colours'],
     ['site.compo', 'In the hat', 'Enter the competition'], ['site.dlall', 'Download junkie', 'Download everything on the Downloads page'], ['site.comicend', 'Comic collector', 'Read every strip of Gubbinz & Jack'],
     ['site.pollsall', 'Opinionated', 'Vote in every poll'], ['site.saberclash', 'Duel of the Fates', 'Cross lightsabers with somebody'], ['site.dave', 'Dave\'s page', 'Find Dave\'s homepage from the Links page'],
     ['site.y2kready', 'Y2K ready', 'Check your PC for the Millennium Bug'], ['site.penpal', 'Noticeboard', 'Pin a note on the Pen Pals board'], ['site.top10', 'Critic', 'Pick your number one in every chart'],
     ['site.webring', 'Round the ring', 'Go all the way round the webring']].forEach(s => A.defineSecret(...s));
  }

  // ================================================================ page builders, run the first time a page is opened
  const built = {};
  const BUILD = {};
  function onSection(sec) { if (BUILD[sec] && !built[sec]) { built[sec] = true; Promise.resolve(BUILD[sec]()).catch(e => { console.error(e); built[sec] = false; }); } }
  document.addEventListener('section', ev => onSection(String(ev.detail)));

  // ================================================================ REVIEWS, CHEATS, ORKS: more of the good stuff
  BUILD.reviews = () => data().then(D => {
    const anchor = document.querySelector('#s-reviews .broken');
    const frag = document.createDocumentFragment();
    D.reviews.forEach(r => {
      const a = h('article', 'review');
      if (r.from) a.dataset.from = r.from;
      a.innerHTML = `<div class="rv"><h3>${r.t}</h3><span class="meta">${r.plat}</span>${r.p.map(p => `<p>${p}</p>`).join('')}<div class="updown up"><b>UP</b>${r.up}</div><div class="updown down"><b>DOWN</b>${r.down}</div></div>
        <div class="scorebox"><div class="s"><span>GRAPHICS</span><span>${r.s[0]}%</span></div><div class="s"><span>SOUND</span><span>${r.s[1]}%</span></div><div class="s"><span>GAMEPLAY</span><span>${r.s[2]}%</span></div><div class="s"><span>LASTABILITY</span><span>${r.s[3]}%</span></div><div class="big">${r.big}%</div><div class="verdict">${r.v}</div>${r.award ? '<span class="award">JACK\'S<br>GOLD<br>AWARD</span>' : ''}</div>`;
      frag.appendChild(a);
    });
    const note = h('p', 'revnote', `${D.reviews.length + 3} reviews and counting. Scores are out of 100 because 10 isn't enough room to be picky. <b>JACK'S GOLD AWARD</b> goes to anything over 90 that I'd buy twice.`);
    anchor.parentNode.insertBefore(note, document.querySelector('#s-reviews .review'));
    anchor.parentNode.insertBefore(frag, anchor);
    const t = today(); document.querySelectorAll('#s-reviews [data-from]').forEach(el => { const [m, d] = el.dataset.from.split('-').map(Number); el.hidden = m * 100 + d > t.md; });
  });
  BUILD.cheats = () => data().then(D => {
    const anchor = document.querySelector('#s-cheats .applet');
    const frag = document.createDocumentFragment();
    D.cheats.forEach(c => { const d = h('div', 'cheat' + (c.rumour ? ' rumour' : '')); d.innerHTML = `<h4>${c.g}${c.rumour ? ' <span class="tag">PLAYGROUND RUMOUR</span>' : ' <span class="tag">TESTED</span>'}</h4>${c.h}`; frag.appendChild(d); });
    anchor.parentNode.insertBefore(frag, anchor);
  });
  BUILD.orks = () => data().then(D => {
    const dict = [...document.querySelectorAll('#s-orks .applet')].find(a => /DIKSHUNARY|JARGON/i.test(a.textContent));
    if (!dict) return;
    const body = dict.querySelector('.body');
    const more = h('div', null, '<br>' + D.orkwords.map(([w, d]) => `<b>${esc(w)}</b> &mdash; ${esc(d)}`).join('<br>'));
    more.hidden = true; body.appendChild(more);
    const b = h('button', 'btn', `More words (${D.orkwords.length})`); b.type = 'button'; b.style.marginTop = '8px';
    b.addEventListener('click', () => { more.hidden = !more.hidden; b.textContent = more.hidden ? `More words (${D.orkwords.length})` : 'Fewer words'; sfx('click'); });
    body.appendChild(b);
  });

  // ================================================================ POLLS (shared via Net.kv.put: one field per computer)
  const pollKey = id => 'site.poll.' + id;
  function pollWidget(pdef, D) {
    const box = h('div', 'win applet cgi spoll');
    box.innerHTML = `<div class="tb"><span class="t">${esc(pdef.q)} <small>poll.cgi</small> <span class="live">LIVE</span></span></div><div class="body"><div class="opts"></div><div class="pfoot"><span class="tot"></span><span class="mine"></span></div></div>`;
    const opts = box.querySelector('.opts');
    let votes = {};
    const render = () => {
      const counts = pdef.o.map(() => 0); let total = 0;
      for (const v of Object.values(votes)) { const i = +v; if (i >= 0 && i < counts.length) { counts[i]++; total++; } }
      const max = Math.max(1, ...counts), mine = votes[myField()];
      opts.innerHTML = '';
      pdef.o.forEach((o, i) => {
        const row = h('div', 'spopt');
        const b = h('button', 'btn' + (String(mine) === String(i) ? ' mine' : ''), esc(o)); b.type = 'button';
        b.addEventListener('click', () => { if (!window.Net || !Net.kv.put(pollKey(pdef.id), myField(), String(i))) return toast('Polls', 'Not connected. Redialling...'); sfx('pet'); votes[myField()] = String(i); render(); markVoted(pdef.id); });
        const pct = h('span', 'pct', (total ? Math.round(counts[i] / total * 100) : 0) + '%');
        const bar = h('div', 'pbar', `<i style="width:${counts[i] / max * 100}%"></i>`);
        row.append(b, pct, bar); opts.appendChild(row);
      });
      box.querySelector('.tot').textContent = `${fmt(total)} vote${total === 1 ? '' : 's'}`;
      box.querySelector('.mine').textContent = mine === undefined ? 'Click to vote!' : 'You voted. Click again to change your mind.';
    };
    render();
    if (window.Net) {
      Net.kv.get([pollKey(pdef.id)]).then(v => { const o = v[pollKey(pdef.id)]; votes = o && typeof o === 'object' && !Array.isArray(o) ? o : {}; render(); });
      Net.kv.watch(pollKey(pdef.id), ev => { if (ev.type === 'put') { if (ev.v === '') delete votes[ev.f]; else votes[ev.f] = ev.v; render(); } });
    }
    return box;
  }
  function markVoted(id) { const v = store.get('jhp_site_voted', []); if (!v.includes(id)) { v.push(id); store.set('jhp_site_voted', v); } if (DATA && DATA.polls.every(p => v.includes(p.id))) secret('site.pollsall'); }
  BUILD.polls = () => data().then(D => {
    const b = $('pollsBody'); b.innerHTML = '';
    const grid = h('div', 'pollgrid'); D.polls.forEach(p => grid.appendChild(pollWidget(p, D))); b.appendChild(grid);
    b.appendChild(h('p', 'note99', 'Want a poll? Write in on the Letters page. Polls are counted by my own poll.cgi script, which took me a whole weekend and only crashed twice.'));
  });

  // ================================================================ QUIZ (shared hall of fame via Net.kv.put)
  BUILD.quiz = () => data().then(D => {
    const b = $('quizBody'); b.innerHTML = '';
    const lay = h('div', 'quizlay'), left = h('div'), right = h('div');
    lay.append(left, right); b.appendChild(lay);
    const hof = h('div', 'hof', '<h4>HALL OF FAME</h4><ol><li>nobody yet</li></ol>');
    right.appendChild(hof);
    right.appendChild(h('p', 'note99', 'Scores: 100 a question plus a bonus for speed. Ten questions, 15 seconds each. The best score from each computer counts.'));
    let hofData = {};
    const renderHof = () => {
      const rows = Object.entries(hofData).map(([f, v]) => { const [s, n] = String(v).split('|'); return { f, s: +s || 0, n: n || '?' }; }).filter(r => r.s > 0).sort((a, b) => b.s - a.s).slice(0, 10);
      hof.querySelector('ol').innerHTML = rows.length ? rows.map(r => `<li${r.f === myField() ? ' class="me"' : ''}><span>${esc(r.n)}</span>${fmt(r.s)}</li>`).join('') : '<li>nobody yet</li>';
    };
    if (window.Net) {
      Net.kv.get(['site.quiz.hof']).then(v => { const o = v['site.quiz.hof']; hofData = o && typeof o === 'object' && !Array.isArray(o) ? o : {}; renderHof(); });
      Net.kv.watch('site.quiz.hof', ev => { if (ev.type === 'put') { if (ev.v === '') delete hofData[ev.f]; else hofData[ev.f] = ev.v; renderHof(); } });
    }
    const intro = () => {
      left.innerHTML = `<div class="sbox c"><p class="tagline">How much of a nerd are you? Be honest. The computer will know.</p><p>Ten questions about games, films, computers and 1999, picked at random from my big list. Fifteen seconds each. No looking things up (there's nowhere to look them up anyway, the Internet's engaged).</p><p>Your best score: <b>${fmt(store.get('jhp_site_quizbest', 0))}</b></p><button class="btn big" type="button">START THE QUIZ</button></div>`;
      left.querySelector('.btn').addEventListener('click', () => { sfx('click'); play(); });
    };
    const play = () => {
      const qs = D.quiz.slice().sort(() => Math.random() - 0.5).slice(0, 10);
      let i = 0, score = 0, right = 0, timer = null, t0 = 0;
      const box = h('div', 'sbox'); left.innerHTML = ''; left.appendChild(box);
      const ask = () => {
        const q = qs[i];
        box.innerHTML = `<div class="quizbar"><span>Question ${i + 1} of 10</span><span>Score: ${fmt(score)}</span></div><div class="qtimer"><i></i></div><div class="quizq">${q[0]}</div><div class="quizopts">${q[1].map((a, k) => `<button class="btn" type="button" data-k="${k}">${a}</button>`).join('')}</div>`;
        const bar = box.querySelector('.qtimer i'); t0 = performance.now();
        clearInterval(timer);
        timer = setInterval(() => { const left = Math.max(0, 15000 - (performance.now() - t0)); bar.style.width = (left / 150) + '%'; if (!left) answer(-1); }, 100);
        box.querySelectorAll('[data-k]').forEach(btn => btn.addEventListener('click', () => answer(+btn.dataset.k)));
      };
      const answer = k => {
        clearInterval(timer);
        const q = qs[i], secs = Math.max(0, 15 - (performance.now() - t0) / 1000);
        box.querySelectorAll('[data-k]').forEach(btn => { btn.disabled = true; if (+btn.dataset.k === q[2]) btn.classList.add('right'); else if (+btn.dataset.k === k) btn.classList.add('wrong'); });
        if (k === q[2]) { score += 100 + Math.round(secs * 5); right++; sfx('solve'); } else sfx('uhoh');
        i++;
        setTimeout(() => i < qs.length ? ask() : done(), 900);
      };
      const done = () => {
        const rank = right === 10 ? 'ULTIMATE NERD' : right >= 8 ? 'MEGA NERD' : right >= 6 ? 'PROPER NERD' : right >= 4 ? 'PART-TIME NERD' : right >= 2 ? 'NERD IN TRAINING' : 'DAVE';
        const best = Math.max(score, store.get('jhp_site_quizbest', 0)); store.set('jhp_site_quizbest', best);
        if (right === 10) secret('site.quiz10');
        box.innerHTML = `<div class="qresult"><div class="tagline">YOU ARE A...</div><div class="bigcount">${rank}</div><p>${right} out of 10 right. Score: <b>${fmt(score)}</b>${score >= best && score > 0 ? ' <b style="color:#090">NEW PERSONAL BEST!</b>' : ''}</p><p>${right === 10 ? 'Perfect. Are you me?' : right >= 8 ? 'Nearly perfect. You read the right magazines.' : right >= 6 ? 'Respectable. You own a Game Boy and you\'re not afraid to use it.' : right >= 4 ? 'Hmm. Go and read What\'s New on the home page and come back.' : 'Dave got the same score. Dave guessed.'}</p><button class="btn big" type="button">Play again</button></div>`;
        box.querySelector('.btn').addEventListener('click', play);
        const guest = window.Guest && Guest.is(), hof = () => Net.kv.put('site.quiz.hof', myField(), `${score}|${me().nick}`.slice(0, 120));
        if (score > 0 && score >= best && window.Net) { if (!guest) hof(); else { box.querySelector('.qresult').insertAdjacentHTML('beforeend', `<p class="small">${Guest.badge('Hall of Fame')} Guests' scores stay on this computer. <a href="#" class="qhof">Join JackNet to go in the Hall of Fame!</a></p>`); box.querySelector('.qhof').addEventListener('click', e => { e.preventDefault(); Guest.need('The Nerd Quiz Hall of Fame', hof); }); } }
      };
      ask();
    };
    intro();
  });

  // ================================================================ COMPETITION (entries shared via Net.kv.push)
  BUILD.compo = () => data().then(D => {
    const b = $('compoBody'); b.innerHTML = '';
    const poster = document.createElement('canvas'); poster.className = 'poster'; poster.width = 120; poster.height = 180;
    (() => { const g = poster.getContext('2d'), O = '#0c1a06'; g.lineJoin = 'round';
      const P = (col, f) => { g.beginPath(); f(); g.fillStyle = col; g.fill(); g.lineWidth = 2; g.strokeStyle = O; g.stroke(); };
      const el = (x, y, rx, ry, a) => g.ellipse(x, y, rx, ry, a || 0, 0, 7);
      const poly = (...p) => { g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); };
      g.fillStyle = '#ffd400'; g.fillRect(0, 0, 120, 180); g.save(); g.beginPath(); g.rect(6, 6, 108, 168); g.clip();
      g.fillStyle = '#2a0a3a'; g.fillRect(6, 6, 108, 168); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; if (i % 2) { g.fillStyle = '#4a1460'; g.beginPath(); g.moveTo(60, 96); g.arc(60, 96, 170, a, a + Math.PI / 9); g.closePath(); g.fill(); } }
      // Gubbinz, mid-WAAAGH: fist in the air, sack tunic, ears out, every tooth showing
      P('#3a9a2a', () => el(47, 156, 9, 4)); P('#3a9a2a', () => el(73, 156, 9, 4));
      P('#3a9a2a', () => { g.rect(44, 138, 7, 16); }); P('#3a9a2a', () => { g.rect(69, 138, 7, 16); });
      P('#3a9a2a', () => poly(76, 110, 82, 116, 98, 104, 94, 98)); P('#3a9a2a', () => el(98, 99, 6, 6));
      P('#3a9a2a', () => poly(44, 110, 38, 116, 22, 104, 26, 98)); P('#3a9a2a', () => el(22, 99, 6, 6)); g.strokeStyle = O; g.lineWidth = 1.2; g.beginPath(); g.moveTo(18, 98); g.lineTo(26, 98); g.moveTo(94, 98); g.lineTo(102, 98); g.stroke();
      P('#8a5a2a', () => poly(42, 106, 78, 106, 84, 144, 36, 144)); g.strokeStyle = '#5a3a1a'; g.lineWidth = 1; g.beginPath(); for (const x of [46, 56, 66, 76]) { g.moveTo(x, 138); g.lineTo(x + 2, 144); } g.stroke();
      P('#b07a3a', () => g.rect(64, 116, 10, 9)); P('#3a2a1a', () => g.rect(39, 124, 42, 4));
      P('#4aae36', () => poly(46, 80, 8, 56, 22, 80, 44, 92)); P('#4aae36', () => poly(74, 80, 112, 56, 98, 80, 76, 92));
      g.strokeStyle = '#2a7a1a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(42, 82); g.lineTo(18, 66); g.moveTo(78, 82); g.lineTo(102, 66); g.stroke();
      P('#4aae36', () => el(60, 86, 21, 20));
      P('#fff', () => el(51, 80, 5.5, 4.5)); P('#fff', () => el(69, 80, 5.5, 4.5)); g.fillStyle = '#e10600'; g.beginPath(); el(52, 81, 3, 3); el(68, 81, 3, 3); g.fill(); g.fillStyle = '#000'; g.fillRect(51, 80, 2, 2); g.fillRect(67, 80, 2, 2);
      g.strokeStyle = O; g.lineWidth = 3; g.beginPath(); g.moveTo(44, 72); g.lineTo(57, 76); g.moveTo(76, 72); g.lineTo(63, 76); g.stroke();
      P('#3a9a2a', () => poly(57, 80, 63, 80, 66, 96, 60, 99, 54, 96));
      P('#5a0a0a', () => { g.moveTo(45, 96); g.quadraticCurveTo(60, 116, 75, 96); g.quadraticCurveTo(60, 101, 45, 96); });
      g.fillStyle = '#fff'; g.beginPath(); for (const x of [49, 55, 61, 67]) poly(x, 98, x + 4, 99, x + 2, 103); g.fill();
      g.restore();
      g.textAlign = 'center'; g.lineWidth = 5; g.strokeStyle = '#000'; g.font = 'bold 22px Impact, "Arial Black", sans-serif'; g.strokeText('GUBBINZ', 60, 32); g.fillStyle = '#ffd400'; g.fillText('GUBBINZ', 60, 32);
      g.font = 'bold 15px Impact, "Arial Black", sans-serif'; g.strokeText('WAAAGH!', 60, 52); g.fillStyle = '#5f5'; g.fillText('WAAAGH!', 60, 52);
      // the signatures: Jack's in pen, Gubbinz's in green paint (one foot, three toes)
      g.save(); g.translate(92, 166); g.rotate(-0.18); g.font = 'italic bold 13px "Comic Sans MS", cursive'; g.fillStyle = '#ff6ab8'; g.fillText('Jack', 0, 0); g.restore();
      g.save(); g.translate(22, 158); g.rotate(-0.4); g.globalAlpha = 0.9; g.fillStyle = '#2ecc2e'; g.beginPath(); el(0, 4, 6, 9); g.fill(); for (const [dx, dy] of [[-6, -9], [0, -11], [6, -9]]) { g.beginPath(); el(dx, dy, 2.5, 3.5); g.fill(); } g.restore();
    })();
    const head = h('div', 'compohead'); head.appendChild(poster);
    head.appendChild(h('div', null, `<p class="tagline">WIN!!! WIN!!! WIN!!!</p><p>This issue's prize: <b>${esc(D.compo.prize)}</b>. Get all five questions right and your name goes in the hat. The draw is on 31/12/99 at Dave's house. The judge's decision (Mom) is final.</p><p class="small">One entry per computer. Prize is A4. Footprint may be a handprint, he wouldn't keep still.</p>`));
    b.appendChild(head);
    const box = h('div', 'sbox y'); b.appendChild(box);
    const hat = h('div', 'sbox', '<b>IN THE HAT SO FAR:</b> <span class="n">0</span><div class="entries"></div>'); b.appendChild(hat);
    let entries = [];
    const renderHat = () => { hat.querySelector('.n').textContent = entries.length; hat.querySelector('.entries').innerHTML = entries.slice().reverse().map((e, i) => `<span style="--r:${((hash(e.by) % 7) - 3)}deg;color:${esc(e.col || '#000')}">${esc(e.by)}</span>`).join('') || '<i>nobody yet, be the first!</i>'; };
    if (window.Net) {
      Net.kv.get(['site.compo']).then(v => { entries = Array.isArray(v['site.compo']) ? v['site.compo'] : []; renderHat(); });
      Net.kv.watch('site.compo', ev => { if (ev.type === 'push') { entries.push(ev.e); if (entries.length > 40) entries.shift(); renderHat(); } });
    }
    const entered = store.get('jhp_site_compo', false);
    const form = () => {
      box.innerHTML = `<h3>The questions</h3>` + D.compo.qs.map((q, i) => `<div class="cq" data-q="${i}"><p><b>${i + 1}.</b> ${q[0]}</p><div class="quizopts">${q[1].map((a, k) => `<button class="btn" type="button" data-k="${k}">${a}</button>`).join('')}</div></div>`).join('') + `<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn big" type="button" id="compoSend" disabled>Send my entry!</button></div>`;
      const picks = {};
      box.querySelectorAll('.cq').forEach(cq => cq.querySelectorAll('[data-k]').forEach(btn => btn.addEventListener('click', () => { cq.querySelectorAll('.btn').forEach(x => x.classList.remove('on')); btn.classList.add('on'); picks[cq.dataset.q] = +btn.dataset.k; $('compoSend').disabled = Object.keys(picks).length < D.compo.qs.length; sfx('click'); })));
      $('compoSend').addEventListener('click', () => {
        const wrong = D.compo.qs.filter((q, i) => picks[i] !== q[2]).length;
        if (wrong) { sfx('uhoh'); return Desk.msgbox('Competition', `${wrong} answer${wrong > 1 ? 's are' : ' is'} wrong. Have another look. (Hint: it's never Dave's cousin.)`, 'warn'); }
        if (window.Guest && Guest.is()) return Guest.need('Entering the compo', () => { const b = $('compoSend'); if (b) b.click(); }); // the prize has to go to someone we can find again
        if (!window.Net || !Net.kv.push('site.compo', 'entered')) return toast('Competition', 'Not connected. Redialling...');
        store.set('jhp_site_compo', true); secret('site.compo'); sfx('solve');
        Desk.msgbox('Competition', `All five right! ${me().nick} is in the hat. Good luck, and don't tell Mom she's judging.`, 'info');
        thanks();
      });
    };
    const thanks = () => { box.innerHTML = `<h3>You're in the hat!</h3><p>Your entry is in. The draw is on 31/12/99. If you win, I'll put your name on the home page in LETTERS THIS BIG and post the poster to... hmm. I'll think of something. Maybe you can collect it.</p><p class="small">Want to go again? You can't. One entry per computer. I know, I know.</p>`; };
    entered ? thanks() : form();
  });

  // ================================================================ PEN PALS (a cork board shared via Net.kv.push)
  const LIKES = ['N64', 'PlayStation', 'PC', 'Game Boy', 'Pok\u00e9mon', 'Star Wars', 'Painting minis', 'Tetris', 'Rubik\'s cubes', 'Robot Wars', 'Drawing', 'Football', 'LEGO', 'Dinosaurs'];
  BUILD.penpals = () => {
    const b = $('ppBody'); b.innerHTML = '';
    b.appendChild(h('div', 'warnbox', 'RULES (Mom\'s): no surnames, no addresses, no phone numbers, no schools, no e-mail. Just what you\'re into. Be nice or Gubbinz eats your note.'));
    const form = h('form', 'sbox y');
    form.innerHTML = `<h3>Pin a note</h3><div class="ppform"><label>Name</label><b class="ppname">${esc(me().nick)}</b><label>I'm into</label><div class="likepick">${LIKES.map(l => `<label><input type="checkbox" value="${esc(l)}"> ${esc(l)}</label>`).join('')}</div><label for="ppMsg">Looking for</label><textarea id="ppMsg" rows="3" maxlength="200" placeholder="e.g. someone to swap Pokemon with, or who also thinks Oddjob should be banned"></textarea></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn big" type="submit">Pin it!</button></div><p class="note99">Notes stay up until the board is full (it holds 40), then the oldest falls off. Nick comes from your JackNet log-on.</p>`;
    b.appendChild(form);
    const board = h('div', 'cork'); b.appendChild(board);
    let notes = [];
    const render = () => {
      board.innerHTML = notes.length ? notes.slice().reverse().map(n => {
        const m = String(n.text).match(/^\[(.*?)\]\s*([\s\S]*)$/), likes = m ? m[1] : '', text = m ? m[2] : n.text;
        return `<div class="ppnote" style="--r:${((hash(n.by + n.ts) % 7) - 3)}deg;--pin:${['#e10600', '#0028c8', '#2a9a2a', '#ffd400', '#ff2a6d'][hash(String(n.ts)) % 5]}"><b style="color:${esc(n.col || '#000')}">${esc(n.by)}${n.member ? ' \u2605' : ''}</b>${likes ? `<div class="likes">Into: ${esc(likes)}</div>` : ''}<div>${esc(text)}</div><div class="ppfoot"><span>${ago(n.ts)}</span><button class="btn" type="button" data-wave="${esc(n.by)}">Say hi</button></div></div>`;
      }).join('') : '<div class="ppnote"><b>Jack</b><div class="likes">Into: everything on this site</div><div>Looking for: people to pin notes on this board. It\'s empty. Go on.</div></div>';
    };
    board.addEventListener('click', ev => {
      const w = ev.target.closest('[data-wave]'); if (!w) return;
      const who = (window.SiteOnline || []).find(o => o.nick === w.dataset.wave);
      if (!who) return toast('Pen Pals', `${w.dataset.wave} isn't on the site right now. Leave a note!`);
      if (who.id === me().id) return toast('Pen Pals', 'That\'s you. Hi.');
      Net.send({ t: 'popup', to: who.id, text: `${me().nick} waved at you from the Pen Pals board!` }); toast('Pen Pals', `Waved at ${who.nick}.`); sfx('join');
    });
    render();
    if (window.Net) {
      Net.kv.get(['site.penpals']).then(v => { notes = Array.isArray(v['site.penpals']) ? v['site.penpals'] : []; render(); });
      Net.kv.watch('site.penpals', ev => { if (ev.type === 'push') { notes.push(ev.e); if (notes.length > 40) notes.shift(); render(); if (ev.e.by !== me().nick) toast('Pen Pals', `${ev.e.by} pinned a note on the board.`, 3000); } });
      Net.on('you', () => { const n = form.querySelector('.ppname'); if (n) n.textContent = me().nick; });
      Net.on('loginOk', () => { const n = form.querySelector('.ppname'); if (n) n.textContent = me().nick; });
    }
    let lastPin = 0;
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const likes = [...form.querySelectorAll('input:checked')].map(i => i.value), msg = $('ppMsg').value.trim();
      if (!msg && !likes.length) return Desk.msgbox('Pen Pals', 'Tick something you\'re into, or write what you\'re looking for. Or both!', 'warn');
      if (/\d{5,}|@|\bwww\.|http/i.test(msg)) return Desk.msgbox('Pen Pals', 'No phone numbers, e-mails or addresses. Mom checks this board. She WILL find you.', 'warn');
      if (window.Guest && Guest.is()) return Guest.need('Pinning a note on the Pen Pals board', () => form.requestSubmit()); // pen pals need a name that's still yours tomorrow
      if (Date.now() - lastPin < 5000) return toast('Pen Pals', 'Slow down, the drawing pins are running out.');
      const text = (likes.length ? `[${likes.join(', ')}] ` : '') + msg;
      if (!window.Net || !Net.kv.push('site.penpals', text.slice(0, 290))) return toast('Pen Pals', 'Not connected. Redialling...');
      lastPin = Date.now(); $('ppMsg').value = ''; form.querySelectorAll('input:checked').forEach(i => { i.checked = false; });
      sfx('pet'); secret('site.penpal'); toast('Pen Pals', 'Pinned! Gubbinz is guarding it.');
    });
  };
  function ago(ts) { const s = Math.max(0, (Date.now() - ts) / 1000); if (s < 90) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' mins ago'; if (s < 86400) { const n = Math.round(s / 3600); return n + ' hour' + (n > 1 ? 's' : '') + ' ago'; } const d = Math.round(s / 86400); return d < 60 ? d + ' day' + (d > 1 ? 's' : '') + ' ago' : 'ages ago'; }

  // ================================================================ DOWNLOADS: shareware that really installs things on the fake PC
  const CUR_SVG = {
    saber: c => `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect x='3' y='18' width='6' height='11' rx='1' fill='%23888' stroke='%23000'/><rect x='4' y='24' width='4' height='2' fill='%23000'/><path d='M6 18 L26 2' stroke='${encodeURIComponent(c)}' stroke-width='6' stroke-linecap='round' opacity='.45'/><path d='M6 18 L26 2' stroke='${encodeURIComponent(c)}' stroke-width='3.5' stroke-linecap='round'/><path d='M6 18 L26 2' stroke='%23fff' stroke-width='1.5' stroke-linecap='round'/></svg>`,
    squig: () => `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><circle cx='14' cy='15' r='11' fill='%23e8381b' stroke='%23000' stroke-width='1.5'/><circle cx='10' cy='12' r='3' fill='%23fff'/><circle cx='18' cy='12' r='3' fill='%23fff'/><circle cx='11' cy='12' r='1.2' fill='%23000'/><circle cx='19' cy='12' r='1.2' fill='%23000'/><path d='M7 19h14l-2 4h-10z' fill='%23300'/><path d='M9 19v3M13 19v4M17 19v3' stroke='%23fff'/><path d='M8 26l-3 5M20 26l3 5' stroke='%23000' stroke-width='2'/></svg>`,
  };
  const saberCol = () => store.get('jhp_site_saber', '#3f3');
  function applyCursor() { const c = store.get('jhp_site_cursor', ''); if (c && CUR_SVG[c]) document.body.style.cursor = `url("data:image/svg+xml;utf8,${CUR_SVG[c](saberCol())}") 4 ${c === 'saber' ? 18 : 15}, auto`; }
  applyCursor();
  // Gubbinz as a 24x28 sprite (left half; the right half is the mirror image). Used by the wallpaper, the fan club and the poster.
  const GROT = ['............', 'kk..........', 'kdkk........', '.kddkk..kkkk', '..kdddkkdddd', '..kkdddddddd', '....kkdddddd', '.....kddkkdd', '.....kdddkkk', '.....kdlllkn', '.....kdlrlkn', '.....kddddkn', '....kddddknn', '....kdddknnn', '....kddddkkk', '......kkkkkk', '.....klklklk', '......kkkkkk', '......kddddd', '.......kkkkk',
    '......kttttt', '....kkkttttt', '...kdkkttttt', '...kdktttttt', '...kkkTTTTTT', '.....kttttkk', '......kdk...', '.....kkdk...', '.....kkkk...'];
  function sprite(g, rows, pal, x, y, s) { rows.forEach((row, j) => [...row + [...row].reverse().join('')].forEach((ch, i) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x + i * s, y + j * s, s, s); } })); }
  function wallTile(id) {
    const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    if (id === 'gubwall') {
      g.fillStyle = '#008080'; g.fillRect(0, 0, 96, 96); g.fillStyle = '#0a8f8f'; for (let i = 0; i < 96; i += 4) g.fillRect(i, (i * 7) % 96, 1, 1);
      [[6, 4, '#3a9a2a'], [54, 4, '#4aae36'], [30, 52, '#4aae36'], [78, 52, '#3a9a2a'], [-18, 52, '#3a9a2a']].forEach(([x, y, col]) => sprite(g, GROT, { k: '#0a2a0a', d: col, n: '#5cc048', l: '#fff', r: '#e10600', t: '#9a6a32', T: '#5a3a1a' }, x, y, 1));
    } else if (id === 'orkwall') {
      g.fillStyle = '#2f5f1f'; g.fillRect(0, 0, 96, 96);
      for (const col of ['#4a8a2a', '#1a3a10', '#5a5a24']) for (let k = 0; k < 5; k++) { const bx = r() * 96, by = r() * 80; g.fillStyle = col; for (let j = 0; j < 4; j++) { const ox = bx + (r() - 0.5) * 22, oy = by + (r() - 0.5) * 14, rad = 5 + r() * 7; for (const dx of [-96, 0, 96]) for (const dy of [-96, 0, 96]) { g.beginPath(); g.arc(ox + dx, oy + dy, rad, 0, 7); g.fill(); } } }
      for (let i = 0; i < 12; i++) { g.fillStyle = (i % 2) ? '#000' : '#fff'; g.fillRect(i * 8, 84, 8, 6); g.fillStyle = (i % 2) ? '#fff' : '#000'; g.fillRect(i * 8, 90, 8, 6); }
      g.font = 'bold 15px Impact, "Arial Black", sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = '#000'; g.strokeText('WAAAGH!', 48, 52); g.fillStyle = '#e10600'; g.fillText('WAAAGH!', 48, 52);
    } else {
      g.fillStyle = '#000010'; g.fillRect(0, 0, 96, 96);
      for (let i = 0; i < 70; i++) { const b = r(); g.fillStyle = b > 0.85 ? '#fff' : b > 0.6 ? '#bbd' : '#556'; g.fillRect(Math.floor(r() * 96), Math.floor(r() * 96), 1, 1); }
      g.fillStyle = '#fff'; g.fillRect(70, 20, 3, 1); g.fillRect(71, 19, 1, 3);
      g.fillStyle = '#c86a30'; g.beginPath(); g.arc(18, 22, 9, 0, 7); g.fill(); g.fillStyle = '#e8a050'; g.beginPath(); g.arc(15, 19, 4, 0, 7); g.fill(); // a little desert planet
      const ship = ['..w.......', 'owwwr.....', 'owwwwwwwww', 'owwwr.....', '..w.......']; ship.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') { g.fillStyle = { w: '#e0e0e0', o: '#ff8030', r: '#e10600' }[ch]; g.fillRect(40 + i, 60 + j, 1, 1); } }));
      ['g...g', 'g.c.g', 'gcccg', 'g.c.g', 'g...g'].forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') { g.fillStyle = ch === 'g' ? '#8890a0' : '#c8ccd8'; g.fillRect(66 + i, 68 + j, 1, 1); } }));
      g.fillStyle = '#3f3'; g.fillRect(55, 69, 6, 1); g.fillStyle = '#f33'; g.fillRect(53, 62, 6, 1); // pew pew
    }
    return c.toDataURL();
  }
  const WALLCOL = { gubwall: '#008080', orkwall: '#2f5f1f', starwall: '#000010' };
  function installDownload(item) {
    const d99 = dd(today());
    const file = (path, node) => { if (A && A.fs) A.fs.add(path, Object.assign({ date: d99, size: item.size }, node)); };
    const announce = (kind, extra) => window.dispatchEvent(new CustomEvent('jhp-install', { detail: Object.assign({ kind, id: item.id, name: item.name }, extra || {}) }));
    if (item.kind === 'scr') {
      try { localStorage.setItem('jhp_scr_plasma', '1'); } catch (e) {}
      file('C:/JACKOS', { name: 'PLASMA.SCR', type: 'exe', app: 'site.plasma' });
      announce('scr', { id: 'plasma', name: 'Plasma Ball (JackNet)' });
      toast('PLASMA.SCR installed!', 'It\'s now in Display Properties > Screen Saver (right-click the desktop > Properties). Or try it full screen from the Screensaver page.', 7000);
      const si = $('saverInstalled'); if (si) si.hidden = false;
    } else if (item.kind === 'wall') {
      const img = wallTile(item.id), w = { img, mode: 'Tile', col: WALLCOL[item.id] || '#008080', name: item.name };
      try { localStorage.setItem('jhp_prog_wall', JSON.stringify(w)); } catch (e) {}
      const dk = $('desktop'); if (dk) dk.style.background = `url("${img}") 0 0/auto repeat,${w.col}`;
      file('C:/JACKOS', { name: item.name, type: 'img', art: img });
      announce('wall', { img, mode: 'Tile', col: w.col });
      toast('Wallpaper changed!', `${item.name} is tiled across your desktop. Minimise the browser and have a look.`, 6000);
    } else if (item.kind === 'cursor') {
      store.set('jhp_site_cursor', item.id === 'saber' ? 'saber' : 'squig'); applyCursor();
      file('C:/JACKOS/Cursors', { name: item.name, type: 'txt', text: `${item.name}\n\n(A mouse pointer. You can't read a mouse pointer in Notepad, but you tried, and that's what matters.)\n\nTo put the normal pointer back, download the other one or visit Control Panel > Mouse.` });
      announce('cursor', { cursor: document.body.style.cursor });
      toast('Pointer installed!', 'Wiggle the mouse. Nice, eh? Control Panel > Mouse puts it back.', 5000);
    } else if (item.kind === 'tune') {
      file('C:/My Documents/Downloads', { name: item.name, type: 'txt', text: 'JACKTRIS.MID (remix)\n\nMThd... no, you need JackAmp or the Games page to hear it, not Notepad.\n\nTurn SFX on (bottom right) and press Music: ON on JACKTRIS.' });
      if (window.Sound && Sound.music) { if (Sound.on) { Sound.music.play('site_jacktris'); toast('Now playing', 'JACKTRIS.MID (remix). Press Music: OFF on the Games page to stop it.', 5000); } else toast('JACKTRIS.MID', 'Downloaded! Turn SFX on (the speaker in the bottom corner) and press Music: ON on the Games page to hear it.', 6000); }
      announce('tune', { tune: 'site_jacktris' });
    } else if (item.kind === 'exe') {
      file('C:/My Documents/Downloads', { name: item.name, type: 'exe', app: 'site.y2kfix' });
      announce('exe', { app: 'site.y2kfix' });
      if (A) A.open('site.y2kfix');
    } else if (item.kind === 'txt') {
      const text = item.id === 'card' ? memberCard() : cheatsText();
      file('C:/My Documents/Downloads', { name: item.name, type: 'txt', text });
      announce('txt', {});
      if (window.Desk) Desk.notepad(item.name, text);
    }
    const got = store.get('jhp_site_dl', []); if (!got.includes(item.id)) { got.push(item.id); store.set('jhp_site_dl', got); }
    if (DATA && DATA.downloads.every(d => got.includes(d.id))) secret('site.dlall');
    if (window.Net) Net.kv.inc('site.dl.' + item.id);
    sfx('solve');
  }
  function memberCard() {
    const m = me(), t = today();
    return `+==========================================+\n|      JACK ATTACK! Online READER CARD      |\n+==========================================+\n|  Name:    ${String(m.nick).padEnd(30)} |\n|  Member:  ${(m.member ? '#' + (m.no || '?') + ' (JackNet)' : 'guest reader').padEnd(30)} |\n|  Issued:  ${(dd(t)).padEnd(30)} |\n|  Status:  WROTE TO JACK. LEGEND.          |\n+==========================================+\n|  This card entitles the holder to:        |\n|   * reading the site (free anyway)        |\n|   * one (1) go on the MegaCube            |\n|   * shouting COWABUNGA! in public         |\n|   * nothing else. Sorry. No budget.       |\n+==========================================+\n  Signed, Jack        (and a green footprint)\n`;
  }
  function cheatsText() {
    const out = ['JACK ATTACK! CHEATS.TXT', '=======================', '', 'Every cheat from the Cheats page. TESTED = I did it. RUMOUR = Dave\'s cousin.', ''];
    document.querySelectorAll('#s-cheats .cheat').forEach(c => { const t = c.querySelector('h4'); out.push('* ' + strip(t ? t.innerHTML : '').toUpperCase()); out.push('  ' + strip(c.innerHTML.replace(/<h4>[\s\S]*?<\/h4>/, '')).replace(/\s+/g, ' ').trim()); out.push(''); });
    if (DATA) DATA.cheats.forEach(c => { if (!out.join('\n').includes(strip(c.g).toUpperCase())) { out.push('* ' + strip(c.g).toUpperCase() + (c.rumour ? ' (RUMOUR)' : '')); out.push('  ' + strip(c.h)); out.push(''); } });
    out.push('Also: type IDDQD on the Cheats page. Or a famous code with arrows in it. You know the one.');
    return out.join('\n');
  }
  // the browser's little File Download box: a few seconds of 56K, then it installs
  function downloadFlow(item, then) {
    const body = h('div', 'fdl');
    body.innerHTML = `<div class="from"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="3" width="20" height="26" fill="#ffd400" stroke="#000"/><path d="M6 9h20M6 15h20M6 21h20" stroke="#000" stroke-dasharray="2 2"/><rect x="13" y="12" width="6" height="7" fill="#c0c0c0" stroke="#000"/></svg><div>Saving:<br><b>${esc(item.name)}</b> from www.jackattack.jnet</div></div><div class="fly"><span class="pg f1"></span><span class="pg"></span><span class="pg f2"></span></div><div class="prog"><span style="display:flex;gap:2px"></span></div><div class="st">Estimated time left: ${esc(item.time)} (${esc(item.size)} at 4.8 KB/sec)</div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" disabled>Open</button><button class="btn" type="button" disabled>Open Folder</button><button class="btn" type="button" data-c>Cancel</button></div>`;
    const w = A ? A.win('File Download', body, { w: 380, noResize: true, noMax: true, noMin: true, escClose: true }) : Desk.openWin('File Download', body, 380);
    let p = 0, dead = false;
    body.querySelector('[data-c]').addEventListener('click', () => { dead = true; w.close(); toast('Download cancelled', 'Probably for the best. Mom needs the phone.'); });
    const bar = body.querySelector('.prog span'), st = body.querySelector('.st');
    const tick = setInterval(() => {
      if (dead) return clearInterval(tick);
      p = Math.min(100, p + 5 + Math.random() * 9);
      bar.innerHTML = '<i></i>'.repeat(Math.round(p / 100 * 22)); st.textContent = `${Math.round(p)}% of ${item.size} copied... ${p > 90 ? 'nearly there' : p > 60 ? 'Mom, DON\'T pick up the phone' : 'keep the line clear'}`;
      if (p >= 100) { clearInterval(tick); st.textContent = 'Download complete.'; setTimeout(() => { if (!dead) { w.close(); then(); } }, 500); }
    }, 180);
  }
  BUILD.downloads = () => data().then(D => {
    const b = $('dlBody'); b.innerHTML = '';
    b.appendChild(h('div', 'teefbanner', (window.Econ && Econ.gem ? Econ.gem('green', 16) + ' ' : '') + '<b>SPEND YOUR RUPEES!!!</b> Got Rupees? Hats, badges and mad gubbinz for your Hangout avatar at <a href="#" data-teef>The Rupee Emporium</a> (www.rupeeshop.jnet). Shiny gem money. Don\'t ask.'));
    b.appendChild(h('p', 'kicker', 'Shareware, freeware and stuff I made. Click Download and it goes on YOUR computer (well, the one you\'re looking at). Everything is virus checked (I opened it and nothing happened).'));
    const list = h('div'); b.appendChild(list);
    const ICO = { scr: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="20" fill="#000" stroke="#555"/><circle cx="16" cy="14" r="7" fill="#60c"/><circle cx="16" cy="14" r="2" fill="#fff"/><rect x="10" y="26" width="12" height="3" fill="#888"/></svg>', wall: '<svg viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" fill="#008080"/><rect x="6" y="6" width="8" height="8" fill="#3a9a2a"/><rect x="18" y="6" width="8" height="8" fill="#3a9a2a"/><rect x="6" y="18" width="8" height="8" fill="#3a9a2a"/><rect x="18" y="18" width="8" height="8" fill="#3a9a2a"/></svg>', cursor: '<svg viewBox="0 0 32 32"><path d="M8 3v20l5-5 4 9 3-1-4-9h7z" fill="#fff" stroke="#000" stroke-width="1.5"/></svg>', tune: '<svg viewBox="0 0 32 32"><path d="M12 6v16a4 4 0 1 1-2-3.5V9l12-3v12a4 4 0 1 1-2-3.5V4z" fill="#ff2a6d" stroke="#000"/></svg>', exe: '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="24" height="5" fill="#000080"/><text x="16" y="23" font-size="9" font-weight="bold" text-anchor="middle" fill="#e10600">Y2K</text></svg>', txt: '<svg viewBox="0 0 32 32"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M21 2v6h6" fill="#ddd" stroke="#000"/><path d="M10 13h13M10 17h13M10 21h13M10 25h9" stroke="#000080"/></svg>' };
    let counts = {};
    const render = () => {
      const got = store.get('jhp_site_dl', []);
      list.innerHTML = '';
      D.downloads.forEach(item => {
        const locked = item.needs === 'letter' && !store.get('jhp_site_letter', false);
        const row = h('div', 'dlrow' + (got.includes(item.id) ? ' got' : ''));
        row.innerHTML = `${item.kind === 'wall' ? `<span class="dlico" role="img" aria-label="${esc(item.name)} preview" style="background:url(${wallTile(item.id)}) ${{ gubwall: '-1px -2px', orkwall: '-58px -60px', starwall: '-36px -50px' }[item.id] || '0 0'}"></span>` : item.id === 'saber' ? `<img class="dlico cur" alt="" src="data:image/svg+xml;utf8,${CUR_SVG.saber(saberCol())}">` : item.id === 'squigcur' ? `<img class="dlico cur" alt="" src="data:image/svg+xml;utf8,${CUR_SVG.squig()}">` : ICO[item.kind] || ICO.txt}<div><h4>${esc(item.name)} <span class="meta">v${esc(item.ver)} &middot; ${esc(item.size)} &middot; ${fmt(counts['site.dl.' + item.id])} download${counts['site.dl.' + item.id] === 1 ? '' : 's'}</span></h4><p>${esc(item.desc)}${locked ? ' <b>LOCKED: write a letter on the Letters page first.</b>' : ''}</p></div><button class="btn${got.includes(item.id) ? '' : ' big'}" type="button"${locked ? ' disabled' : ''}>${got.includes(item.id) ? 'Download again' : 'Download'}</button>`;
        row.querySelector('.btn').addEventListener('click', () => { sfx('click'); downloadFlow(item, () => { installDownload(item); render(); }); });
        list.appendChild(row);
      });
    };
    render();
    if (window.Net) Net.kv.get(D.downloads.map(d => 'site.dl.' + d.id)).then(v => { counts = v || {}; render(); });
    b.appendChild(h('p', 'note99', 'Disclaimer: if any of this breaks your computer, it was like that when you got it. Everything here is freeware. Copy it, share it, put it on a floppy for your mates. Don\'t sell it. Nobody would buy it.'));
  });
  // the programs the downloads install
  if (A) {
    A.register('site.y2kfix', { single: true, open() {
      const b = h('div', 'dldlg', '<p style="margin:0 0 6px"><b>Y2K FIXER v1.999</b> by Jack. Checking this computer for the Millennium Bug...</p><div class="field" style="height:120px;overflow:auto;padding:4px;font:12px \'Courier New\',monospace" id="y2kLog"></div><div class="prog" style="margin:6px 0"><span style="display:flex;gap:2px"></span></div><div class="row" style="justify-content:flex-end"><button class="btn" type="button" disabled>OK</button></div>');
      const w = A.win('Y2K Fixer', b, { w: 400, noResize: true, noMax: true, icon: '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" fill="#c0c0c0" stroke="#000"/><text x="16" y="21" font-size="9" font-weight="bold" text-anchor="middle" fill="#e10600">Y2K</text></svg>' });
      const log = b.querySelector('#y2kLog'), bar = b.querySelector('.prog span'), ok = b.querySelector('.btn');
      const lines = ['Checking BIOS clock... 1999. Good.', 'Checking CLOCK.DLL... two digits. Hmm.', 'Checking Gubbinz... he doesn\'t know what a year is.', 'Checking the toaster... not connected.', 'Checking Mom\'s beans... 40 tins. READY.', 'Checking JACKTRIS high scores... safe.', 'Setting clock to 31/12/99 23:59:59... waiting...', '...00:00:00 01/01/1900. Oh no.', '...just kidding. 01/01/2000. Setting it back to 1999, nobody saw.', 'RESULT: This PC is Y2K READY (probably). Have a nice Millennium.'];
      let i = 0; const t = setInterval(() => { if (w.closed) return clearInterval(t); log.innerHTML += esc(lines[i]) + '<br>'; log.scrollTop = 1e9; bar.innerHTML = '<i></i>'.repeat(Math.round((i + 1) / lines.length * 22)); if (++i >= lines.length) { clearInterval(t); ok.disabled = false; secret('site.y2kready'); sfx('solve'); } }, 450);
      ok.addEventListener('click', w.close);
      return w;
    } });
    A.register('site.plasma', { single: true, open() { Plasma.fullscreen(); return null; } });
  }
  if (window.Sound && Sound.addTune) Sound.addTune('site_jacktris', { step: 0.13, hats: true,
    lead: [76, -1, 71, 72, 74, -1, 72, 71, 69, -1, 69, 72, 76, -1, 74, 72, 71, -1, -1, 72, 74, -1, 76, -1, 72, -1, 69, -1, 69, -1, 0, 0, 0, 74, -1, 77, 81, -1, 79, 77, 76, -1, -1, 72, 76, -1, 74, 72, 71, -1, 71, 72, 74, -1, 76, -1, 72, -1, 69, -1, 69, -1, 0, 0],
    bass: [45, 45, 52, 52, 45, 45, 52, 52, 40, 40, 47, 47, 40, 40, 47, 47, 45, 45, 52, 52, 45, 45, 52, 52, 41, 41, 48, 48, 40, 40, 47, 47] });

  // ================================================================ the plasma ball: full screen (used by the web page AND the OS's Display Properties)
  const Plasma = {
    running: false,
    fullscreen() {
      const el = $('saverFull'); if (!el || Plasma.running) return;
      Plasma.running = true; el.style.display = 'block';
      if (window.PlasmaFull) PlasmaFull.start();
      const stop = () => { if (!Plasma.running) return; Plasma.running = false; el.style.display = 'none'; if (window.PlasmaFull) PlasmaFull.stop(); document.removeEventListener('keydown', onKey); el.removeEventListener('dblclick', stop); };
      const onKey = ev => { if (ev.key === 'Escape') stop(); };
      setTimeout(() => { document.addEventListener('keydown', onKey); el.addEventListener('dblclick', stop); }, 300);
      Plasma.stop = stop;
    },
    stop() {},
    installed: () => { try { return localStorage.getItem('jhp_scr_plasma') === '1'; } catch (e) { return false; } },
  };
  window.Plasma = Plasma;
  const sp = $('saverPreview'); if (sp) sp.addEventListener('click', () => { sfx('click'); Plasma.fullscreen(); });
  const sd = $('saverDownload'); if (sd) sd.addEventListener('click', () => data().then(D => { sfx('click'); downloadFlow(D.downloads[0], () => installDownload(D.downloads[0])); }));
  if ($('saverInstalled') && Plasma.installed()) $('saverInstalled').hidden = false;
  if (window.Net && $('saverDls')) { Net.kv.get(['site.dl.plasma']).then(v => { $('saverDls').textContent = fmt(v['site.dl.plasma']); }); Net.kv.watch('site.dl.plasma', ev => { if (ev.type === 'set') $('saverDls').textContent = fmt(ev.v); }); }

  // ================================================================ LINKS + the hidden pages they point at
  const RING = ['holocron', 'dave', 'orkhole', 'y2k', 'gubbinzfanclub'];
  const ringNav = word => { const i = RING.indexOf(word), prev = RING[(i + RING.length - 1) % RING.length], next = RING[(i + 1) % RING.length]; return `<div class="webring"><b>THE JACK ATTACK! WEBRING</b>[ <a href="#" data-page="${prev}">&laquo; prev</a> | <a href="#" data-page="${pick(RING)}">random</a> | <a href="#" data-go="links">list</a> | <a href="#" data-page="${next}">next &raquo;</a> ]<br><small>site ${i + 1} of ${RING.length}</small></div>`; };
  const PAGES = {
    holocron: () => { secret('site.holocron'); return `<div class="sechead"><h2>The <em>Holocron</em></h2><span class="pg">JEDI ONLY</span></div><div class="sitebody"><div class="sbox k"><p class="tagline">You found it. The marquee message worked. You are now a Jedi of the Internet.</p><p>This is where I keep the stuff that's too nerdy even for the Star Wars page.</p><ul><li>Episode I is the first Star Wars film in <b>16 years</b>. I have been alive for less than that and it still felt like forever.</li><li>The teaser trailer was downloaded so many times in November it set a record. Some of those were me.</li><li>The duel at the end has a bit where they just... wait. Behind red doors. Dave thinks it's boring. Dave is wrong. It's the best bit.</li><li>Darth Maul has about three lines. Doesn't matter. Coolest baddie since the one in the big black helmet.</li><li>Jar Jar. Look. I've thought about it a lot. He's for the little kids. I am not a little kid. (Mom, I'm not.)</li><li>A Gungan opinion, since you came all this way: the underwater city is actually brilliant and nobody says so because of the Jar Jar thing.</li></ul><p><b>The password for the next level is:</b> there isn't one. This is the last level. Go and play Racer.</p></div>${ringNav('holocron')}</div>`; },
    dave: () => { secret('site.dave'); return `<div class="sechead"><h2>Dave's <em>Homepage</em></h2><span class="pg">v0.1</span></div><div class="sitebody"><div class="ucbar" role="note"><span>&#9888; UNDER CONSTRUCTION &#9888;</span></div><div class="sbox"><p class="tagline">WELCOME TO DAVES PAGE!!!!!!!!</p><p>hi im dave. this is my page. jack is helping me do it. jack says i have to do the writing myself.</p><p>things i like: goldeneye, football, my cousin who works at nintendo (he does), oddjob (shut up jack)</p><p>coming soon: pictures, my high scores (better than jacks), a counter, my cousins secret nintendo stuff</p><div class="broken" aria-label="Missing image: dave.jpg"><span>dave.jpg</span></div><p>you are visitor number <span class="lcdnum"><b>0</b><b>0</b><b>0</b><b>0</b><b>0</b><b>7</b></span> (6 of them were jack)</p><p class="small">last updated: march. ish.</p></div>${ringNav('dave')}</div>`; },
    orkhole: () => `<div class="sechead"><h2>The Paint <em>Hole</em></h2><span class="pg">MINIS!</span></div><div class="sitebody"><div class="wh"><h3>WELCOME TO THE PAINT HOLE</h3><p>This is where I put everything I know about painting little plastic men: Space Marines, Eldar, Airfix soldiers, my Orks, even the LEGO spaceman I accidentally painted gold. One rule: if it's still wet, don't touch it.</p><p><b>JACK'S RULES OF PAINTING (learnt the hard way):</b></p><ol><li>Wash the bits in warm water first. The mould release stuff makes paint slide off. Mom's washing-up liquid is fine. Don't tell Mom.</li><li>Undercoat. Always. Black for dark, white for bright. I use black because it hides my mistakes.</li><li>Thin your paints. Two thin coats beat one thick one. Took me a YEAR to believe this.</li><li>Drybrush it: a dark colour, then a lighter one dragged over the top with almost no paint on the brush. Works on armour, rocks, Ork skin, anything. Magic.</li><li>Red for the fast bits (ask any Ork). Checks for the show-off bits. Teef for the... teef.</li><li>Leave it alone when it's done. It's never done. Leave it alone anyway.</li></ol><p>Current bits box status: FULL. Current bedroom status: also full. Mom's status: "we'll talk about this".</p></div>${ringNav('orkhole')}</div>`,
    y2k: () => `<div class="sechead"><h2>Y2K <em>Survival Centre</em></h2><span class="pg">THE BUG</span></div><div class="sitebody"><div class="sbox k"><p class="tagline">WILL THE MILLENNIUM BUG GET YOU? A JACK ATTACK! GUIDE</p><p><b>What is it?</b> Old computers store the year as two digits. 99. Then it goes to 00, and the computer thinks it's 1900, and nobody knows what happens next. Possibly nothing. Possibly planes. (Mom says not planes.)</p><p><b>MOM'S CHECKLIST (she typed this bit):</b></p><ul><li>&#9745; Tins of beans (40)</li><li>&#9745; Torch and batteries</li><li>&#9745; Fill the bath on the 31st</li><li>&#9745; Cash from the machine in case the machines stop</li><li>&#9744; Jack to tidy his room before the world ends</li></ul><p><b>JACK'S CHECKLIST:</b></p><ul><li>&#9745; Game Boy charged (it takes batteries, so: batteries)</li><li>&#9745; JACKTRIS high scores written down on paper</li><li>&#9745; Gubbinz fed (do it NOW on the Gubbinz page)</li><li>&#9745; Space Marines painted before midnight (race against time)</li><li>&#9744; Ask Dave's cousin what Nintendo are doing about it</li></ul><p>The countdown on the home page is accurate to the second. When it hits zero, THIS SITE will find out what happens along with everybody else. Hold on to something.</p><p class="small">Download Y2KFIX.EXE from the Downloads page to check your own PC. It's very thorough. It checks the toaster.</p></div>${ringNav('y2k')}</div>`,
    gubbinzfanclub: () => `<div class="sechead"><h2>Gubbinz <em>Fan Club</em></h2><span class="pg">OFFICIAL</span></div><div class="sitebody"><div class="egg"><canvas id="gfcCanvas" width="48" height="48" aria-hidden="true" style="width:144px;height:144px;image-rendering:pixelated;background:#9bbc0f;border:6px solid #306230;border-radius:6px"></canvas><div><p class="tagline" style="color:#fff">THE OFFICIAL GUBBINZ FAN CLUB</p><p style="color:#fff">Members: everyone who has ever fed him. Enemies: everyone who hasn't.</p><p style="color:#fff"><b>GUBBINZ FACTS</b><br>&bull; Favourite food: pizza. Second favourite: your homework.<br>&bull; Likes: fetch, Tetris, being hosed down (he says he doesn't, he does).<br>&bull; Dislikes: baths, Dave, the word "cute".<br>&bull; Has died: once. We don't talk about it. (Check the Gubbinz page to see how many times really.)<br>&bull; Catchphrase: "It looks like you're feeding me!"<br>&bull; Signed photo: he ate it. Twice.</p><p style="color:#fff">To join, go and feed him. That's it. That's the whole membership process.</p></div></div>${ringNav('gubbinzfanclub')}</div>`,
  };
  if (window.IE && IE.addPage) {
    IE.addPage('holocron', 'THE HOLOCRON', PAGES.holocron);
    IE.addPage('dave', "DAVES PAGE!!!!", PAGES.dave);
    IE.addPage('orkhole', 'The Paint Hole', PAGES.orkhole);
    IE.addPage('y2k', 'Y2K Survival Centre', PAGES.y2k);
    IE.addPage('gubbinzfanclub', 'The Gubbinz Fan Club', PAGES.gubbinzfanclub);
  }
  document.addEventListener('click', ev => { const t = ev.target.closest('[data-teef]'); if (t) { ev.preventDefault(); if (window.IE) IE.navigate('http://www.rupeeshop.jnet/'); } });
  document.addEventListener('click', ev => {
    const a = ev.target.closest('[data-page]'); if (!a) return; ev.preventDefault();
    const w = a.dataset.page; if (window.IE) IE.navigate(w);
    const seen = store.get('jhp_site_ring', []); if (!seen.includes(w)) { seen.push(w); store.set('jhp_site_ring', seen); } if (RING.every(r => seen.includes(r))) secret('site.webring');
  });
  document.addEventListener('section', ev => { if (ev.detail === 'secret:gubbinzfanclub') setTimeout(() => { const c = $('gfcCanvas'); if (!c) return; const g = c.getContext('2d'); g.fillStyle = '#9bbc0f'; g.fillRect(0, 0, 48, 48); g.fillStyle = '#8bac0f'; for (let y = 1; y < 42; y += 4) for (let x = (y % 8 === 1 ? 1 : 3); x < 48; x += 4) g.fillRect(x, y, 1, 1); sprite(g, GROT.slice(0, 20), { k: '#0f380f', d: '#8bac0f', n: '#9bbc0f', l: '#9bbc0f', r: '#0f380f' }, 0, 2, 2); g.fillStyle = '#306230'; for (const [x, y] of [[1, 44], [9, 44], [33, 44], [41, 44]]) g.fillRect(x, y, 6, 2); g.fillStyle = '#8bac0f'; g.fillRect(17, 43, 14, 4); g.fillStyle = '#0f380f'; g.fillRect(19, 44, 2, 2); g.fillRect(23, 44, 2, 2); g.fillRect(27, 44, 2, 2);}, 50); });
  BUILD.links = () => data().then(D => {
    const b = $('linksBody'); b.innerHTML = '';
    b.appendChild(h('div', 'teefbanner', (window.Econ && Econ.gem ? Econ.gem('green', 16) + ' ' : '') + '<b>SPEND YOUR RUPEES!!!</b> <a href="#" data-teef>www.rupeeshop.jnet</a>: hats for your avatar, paid in shiny Rupees.'));
    // LINK-O-RAMA!!!: a button for every site on the JackNet, the search engines, Site of the Day (js/web-engines.js)
    if (window.WebDir) { const lo = h('div', 'lorama'); b.appendChild(lo); WebDir.linkorama(lo, D); }
    const sh = h('h3', null, 'JACK\'S SECRET PAGES'); sh.id = 'lo-secret'; b.appendChild(sh);
    b.appendChild(h('p', 'kicker', 'And these are MY pages. Type the name in the address bar, or just click. Some of these are secret. Shh.'));
    const ul = h('ul', 'linklist');
    ul.innerHTML = D.links.map(l => `<li><a href="#" data-page="${esc(l.w)}">${esc(l.t)}</a><small>${esc(l.d)}</small><small style="color:#888">www.jackattack.jnet/${esc(l.w)}</small></li>`).join('');
    b.appendChild(ul);
    b.appendChild(h('div', 'webring', '<b>THE JACK ATTACK! WEBRING</b>Five sites. One ring. Go all the way round for a surprise.<br>[ <a href="#" data-page="holocron">start here</a> | <a href="#" data-page="' + pick(RING) + '">random</a> ]'));
    b.appendChild(h('h3', null, 'LINK TO ME!'));
    b.appendChild(h('div', 'sbox', `<p>Put this on YOUR homepage and tell your mates. Copy the code into Notepad, save it as a .htm, done. (Dave, this means you.)</p><div class="badges88" style="justify-content:flex-start"><span class="b88 b-ie"><b>JACK</b>ATTACK!<i>ONLINE</i></span></div><textarea class="linkcode" readonly>&lt;a href="http://www.jackattack.jnet/"&gt;&lt;img src="jackattack88x31.gif" width="88" height="31" alt="JACK ATTACK! Online"&gt;&lt;/a&gt;</textarea></div>`));
    b.appendChild(h('p', 'note99', 'Dead links? Write in. The Internet changes every day and I only get an hour of it.'));
  });

  // ================================================================ TOP 10s (with a live "readers' number one" per chart)
  BUILD.top10 = () => data().then(D => {
    const b = $('topBody'); b.innerHTML = '';
    const tabs = h('div', 'subtabs'), page = h('div'); b.append(tabs, page);
    const keys = Object.keys(D.top10);
    let votes = {}, cur = keys[0];
    const render = () => {
      const T = D.top10[cur], key = 'site.t10.' + cur, v = votes[key] || {};
      const counts = T.list.map(() => 0); let total = 0; for (const x of Object.values(v)) { const i = +x; if (i >= 0 && i < counts.length) { counts[i]++; total++; } }
      const mine = v[myField()], top = counts.indexOf(Math.max(...counts));
      tabs.querySelectorAll('.btn').forEach(x => x.classList.toggle('on', x.dataset.k === cur));
      page.innerHTML = `<h3>${T.name}</h3><p class="note99">${esc(T.note)}</p><ol class="t10">${T.list.map(([t, p, d], i) => `<li><div><b>${t}<span class="plat">${p}</span></b><small>${d}</small>${total && top === i && counts[i] ? '<small class="move">READERS\' NUMBER ONE (' + counts[i] + ' vote' + (counts[i] === 1 ? '' : 's') + ')</small>' : ''}</div><div class="thumb"><button class="btn${String(mine) === String(i) ? ' on' : ''}" type="button" data-i="${i}" title="This is MY number one">${String(mine) === String(i) ? '\u2605 mine' : '\u2606 my #1'}</button><span>${total ? Math.round(counts[i] / total * 100) : 0}%</span></div></li>`).join('')}</ol><p class="note99">${fmt(total)} reader${total === 1 ? ' has' : 's have'} picked a number one in this chart. <span class="live">LIVE</span></p>`;
      page.querySelectorAll('[data-i]').forEach(btn => btn.addEventListener('click', () => { if (!window.Net || !Net.kv.put(key, myField(), btn.dataset.i)) return toast('Top 10s', 'Not connected.'); (votes[key] = votes[key] || {})[myField()] = btn.dataset.i; sfx('pet'); render(); const d = store.get('jhp_site_t10', []); if (!d.includes(cur)) { d.push(cur); store.set('jhp_site_t10', d); } if (keys.every(k => d.includes(k))) secret('site.top10'); }));
    };
    keys.forEach(k => { const bt = h('button', 'btn', esc(D.top10[k].name.replace(/^Top 10 /, ''))); bt.type = 'button'; bt.dataset.k = k; bt.addEventListener('click', () => { cur = k; sfx('click'); render(); }); tabs.appendChild(bt); });
    render();
    if (window.Net) {
      Net.kv.get(keys.map(k => 'site.t10.' + k)).then(v => { for (const k in v) if (v[k] && typeof v[k] === 'object' && !Array.isArray(v[k])) votes[k] = v[k]; render(); });
      keys.forEach(k => Net.kv.watch('site.t10.' + k, ev => { if (ev.type === 'put') { (votes[ev.k] = votes[ev.k] || {})[ev.f] = ev.v; if (ev.v === '') delete votes[ev.k][ev.f]; render(); } }));
    }
  });

  // ================================================================ COMICS: "Jack & Co." (the strips and the drawing code live in js/site-comics.js)
  const comics = () => (A ? A.load('js/site-comics.js') : Promise.reject(new Error('no loader'))).then(() => window.SiteComics);
  const BADWORDS = /\b(poo+|bum|willy|crap|damn|hell|stupid idiot|shut up)\b/i;
  const released = C => { const t = today(); return C.STRIPS.filter(s => s.md <= t.md); };
  function stars(n) { return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n)); }
  BUILD.comics = () => comics().then(C => {
    const b = $('comicBody'); b.innerHTML = '';
    b.appendChild(h('p', 'kicker', Cast.t('<b>JACK &amp; CO.</b> The official JACK ATTACK! comic strip, about me, my mate Dave, my cousin {cousin}, my family, a cat, Gubbinz and a computer that crashes at the worst possible moment. New strips whenever something happens. Something always happens.')));
    const tabs = h('div', 'comictabs', '<a href="#" data-ctab="strip" class="on">Today\'s strip</a> | <a href="#" data-ctab="archive">The archive</a> | <a href="#" data-ctab="cast">Meet the cast</a>');
    const view = h('div'); b.append(tabs, view);
    const list = released(C), strips = list.length ? list : C.STRIPS.slice(0, 1);
    let i = strips.length - 1, tab = 'strip';
    const seen = store.get('jhp_site_comics', []);
    const narrow = () => (b.clientWidth || 600) < 560;
    function setTab(t) { tab = t; tabs.querySelectorAll('[data-ctab]').forEach(a => a.classList.toggle('on', a.dataset.ctab === t)); render(); }
    tabs.addEventListener('click', ev => { const a = ev.target.closest('[data-ctab]'); if (a) { ev.preventDefault(); sfx('click'); setTab(a.dataset.ctab); } });
    function render() {
      view.innerHTML = '';
      if (tab === 'archive') return archive();
      if (tab === 'cast') return cast();
      showStrip();
    }
    function nav() { return `<div class="comicnav"><button class="btn" type="button" data-n="0" ${i === 0 ? 'disabled' : ''}>|&laquo; First</button><button class="btn" type="button" data-n="${i - 1}" ${i === 0 ? 'disabled' : ''}>&laquo; Prev</button><button class="btn" type="button" data-rnd>Random</button><button class="btn" type="button" data-n="${i + 1}" ${i >= strips.length - 1 ? 'disabled' : ''}>Next &raquo;</button><button class="btn" type="button" data-n="${strips.length - 1}" ${i >= strips.length - 1 ? 'disabled' : ''}>Latest &raquo;|</button></div>`; }
    function showStrip() {
      const s = strips[i];
      const wrap = h('div', 'comicwrap');
      wrap.innerHTML = nav() + `<div class="comichead"><h3>#${C.STRIPS.indexOf(s) + 1}: ${esc(s.t)}</h3><small>${esc(s.d)}/99 &middot; ${s.sunday ? 'SUNDAY SPECIAL &middot; ' : ''}${s.single ? 'single panel &middot; ' : ''}strip ${i + 1} of ${strips.length}</small></div>`;
      const cv = document.createElement('canvas'); cv.className = 'comiccv' + (s.single ? ' single' : ''); cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', `${s.t}. ` + s.p.map((p, k) => `Panel ${k + 1}: ` + (p.cap ? p.cap + ' ' : '') + (p.s || []).map(x => `${(C.CAST[x[0]] || {}).name || String(x[0]).split(':')[1] || 'Someone'}: ${x[1]}`).join(' ') + (p.capb ? ' ' + p.capb : '') + (p.write ? p.write.join(' ') : '')).join(' / '));
      wrap.appendChild(cv); view.appendChild(wrap);
      C.drawStrip(cv, s, { maxCols: narrow() ? 1 : (b.clientWidth > 1100 ? 3 : 2) });
      if (s.note) wrap.appendChild(h('p', 'note99', esc(s.note)));
      if (s.endings) endings(wrap, s, C);
      if (s.caption) captions(wrap);
      wrap.insertAdjacentHTML('beforeend', nav());
      rating(view, s); comments(view, s);
      $('s-comics').dataset.sub = 'c' + (i + 1);
      if (!seen.includes(s.id)) { seen.push(s.id); store.set('jhp_site_comics', seen); } if (seen.length >= 20) secret('site.comicend');
    }
    function endings(wrap, s, C) {
      const key = 'site.cv.' + s.id, box = h('div', 'comicvote');
      box.innerHTML = `<p class="tagline">YOU DECIDE HOW IT ENDS! Vote for your favourite ending. <span class="live">LIVE</span></p><div class="cvgrid"></div>`;
      const grid = box.querySelector('.cvgrid'); wrap.appendChild(box);
      let votes = {};
      const draw = () => {
        const counts = s.endings.map(() => 0); let tot = 0; for (const v of Object.values(votes)) { const k = +v; if (k >= 0 && k < counts.length) { counts[k]++; tot++; } }
        const mine = votes[myField()];
        grid.innerHTML = '';
        s.endings.forEach((e, k) => {
          const cell = h('div', 'cvcell' + (String(mine) === String(k) ? ' mine' : ''));
          const ccv = document.createElement('canvas'); ccv.className = 'comiccv'; C.drawStrip(ccv, { p: [e.p] }, { maxCols: 1 });
          cell.appendChild(ccv);
          cell.insertAdjacentHTML('beforeend', `<div class="cvfoot"><b>${esc(e.label)}</b><span>${tot ? Math.round(counts[k] / tot * 100) : 0}% (${counts[k]})</span><button class="btn" type="button" data-v="${k}">${String(mine) === String(k) ? '✔ My vote' : 'Vote for this'}</button></div>`);
          grid.appendChild(cell);
        });
      };
      grid.addEventListener('click', ev => { const btn = ev.target.closest('[data-v]'); if (!btn) return; if (!window.Net || !Net.kv.put(key, myField(), btn.dataset.v)) return toast('Comics', 'Not connected.'); votes[myField()] = btn.dataset.v; sfx('pet'); draw(); });
      draw();
      if (window.Net) { Net.kv.get([key]).then(v => { if (v[key] && typeof v[key] === 'object') votes = v[key]; draw(); }); Net.kv.watch(key, ev => { if (ev.type === 'put') { votes[ev.f] = ev.v; draw(); } }); }
    }
    function captions(wrap) {
      const box = h('div', 'comiccaps');
      box.innerHTML = `<p class="tagline">WRITE YOUR OWN CAPTION! The funniest ones go in the next issue. <span class="live">LIVE</span></p><form class="row" autocomplete="off"><input type="text" maxlength="100" placeholder="What's going on here?" style="flex:1;min-width:0" aria-label="Your caption"><button class="btn" type="submit">Send caption</button></form><ul class="capslist"></ul>`;
      wrap.appendChild(box);
      let caps = [];
      const ul = box.querySelector('.capslist');
      const draw = () => { ul.innerHTML = caps.slice().reverse().filter(e => !BADWORDS.test(e.text)).slice(0, 15).map(e => `<li>"${esc(e.text)}" <small>&mdash; ${esc(e.by)}</small></li>`).join('') || '<li><i>No captions yet. Be the first!</i></li>'; };
      box.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); const inp = box.querySelector('input'), v = inp.value.trim(); if (!v) return; if (BADWORDS.test(v)) return toast('Captions', 'Keep it clean! Mom reads this.'); if (Net.kv.push('site.ccap', v.slice(0, 100))) { inp.value = ''; sfx('pet'); } });
      draw();
      if (window.Net) { Net.kv.get(['site.ccap']).then(v => { caps = Array.isArray(v['site.ccap']) ? v['site.ccap'] : []; draw(); }); Net.kv.watch('site.ccap', ev => { if (ev.type === 'push') { caps.push(ev.e); if (caps.length > 40) caps.shift(); draw(); } }); }
    }
    function rating(parent, s) {
      const key = 'site.cr.' + s.id, box = h('div', 'comicrate');
      parent.appendChild(box);
      let r = {};
      const draw = () => {
        const vals = Object.values(r).map(Number).filter(v => v >= 1 && v <= 5), avg = vals.length ? vals.reduce((a, b2) => a + b2, 0) / vals.length : 0, mine = +r[myField()] || 0;
        box.innerHTML = `<b>RATE THIS STRIP:</b> <span class="crstars">${[1, 2, 3, 4, 5].map(k => `<button type="button" class="crstar${k <= mine ? ' on' : ''}" data-r="${k}" aria-label="${k} star${k > 1 ? 's' : ''}">${k <= mine ? '★' : '☆'}</button>`).join('')}</span> <span class="cravg">${vals.length ? `Readers say ${stars(avg)} (${avg.toFixed(1)} from ${vals.length} vote${vals.length === 1 ? '' : 's'})` : 'Nobody has rated this one yet.'}</span> <span class="live">LIVE</span>`;
      };
      box.addEventListener('click', ev => { const st = ev.target.closest('[data-r]'); if (!st) return; if (!window.Net || !Net.kv.put(key, myField(), st.dataset.r)) return toast('Comics', 'Not connected.'); r[myField()] = st.dataset.r; sfx('pet'); draw(); });
      draw();
      if (window.Net) { Net.kv.get([key]).then(v => { if (v[key] && typeof v[key] === 'object') r = v[key]; draw(); }); Net.kv.watch(key, ev => { if (ev.type === 'put') { r[ev.f] = ev.v; draw(); } }); }
    }
    function comments(parent, s) {
      const key = 'site.cc.' + s.id, box = h('div', 'comiccomm');
      box.innerHTML = `<h3>What did you think?</h3><ul class="cclist"></ul><form class="row" autocomplete="off"><input type="text" maxlength="200" placeholder="Leave a comment (be nice!)" style="flex:1;min-width:0" aria-label="Your comment"><button class="btn" type="submit">Post</button></form>`;
      parent.appendChild(box);
      let list = [];
      const ul = box.querySelector('.cclist');
      const draw = () => { ul.innerHTML = list.slice().reverse().filter(e => !BADWORDS.test(e.text)).slice(0, 15).map(e => `<li><b style="color:${esc(e.col || '#000')}">${esc(e.by)}</b> <small>${ago(e.ts)}</small><div>${esc(e.text)}</div></li>`).join('') || '<li><i>No comments yet. What did YOU think?</i></li>'; };
      box.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); const inp = box.querySelector('input'), v = inp.value.trim(); if (!v) return; if (BADWORDS.test(v)) return toast('Comments', 'Keep it clean! Mom reads this.'); if (Net.kv.push(key, v.slice(0, 200))) { inp.value = ''; sfx('pet'); } else toast('Comments', 'Not connected (or slow down a bit!).'); });
      draw();
      if (window.Net) { Net.kv.get([key]).then(v => { list = Array.isArray(v[key]) ? v[key] : []; draw(); }); Net.kv.watch(key, ev => { if (ev.type === 'push') { list.push(ev.e); if (list.length > 40) list.shift(); draw(); } }); }
    }
    function archive() {
      const grid = h('div', 'comicarch');
      strips.forEach((s, k) => {
        const a = h('button', 'carcell' + (seen.includes(s.id) ? ' seen' : '')); a.type = 'button'; a.dataset.n = k;
        const tc = document.createElement('canvas'); C.thumb(tc, s, 0); a.appendChild(tc);
        a.insertAdjacentHTML('beforeend', `<b>#${C.STRIPS.indexOf(s) + 1} ${esc(s.t)}</b><small>${esc(s.d)}/99${seen.includes(s.id) ? '' : ' &middot; <i>NEW!</i>'}</small>`);
        grid.appendChild(a);
      });
      view.appendChild(h('p', 'note99', `${strips.length} strips so far. ${C.STRIPS.length - strips.length > 0 ? `${C.STRIPS.length - strips.length} more coming later in 1999.` : 'That\'s all of 1999!'} Click one to read it.`));
      view.appendChild(grid);
    }
    function cast() {
      const grid = h('div', 'comiccast');
      C.CAST_ORDER.forEach(id => {
        const k = C.CAST[id], card = h('div', 'castcard');
        const pc = document.createElement('canvas'); C.portrait(pc, id); card.appendChild(pc);
        card.insertAdjacentHTML('beforeend', `<div><b>${esc(k.name)}</b><p>${esc(k.bio)}</p></div>`);
        grid.appendChild(card);
      });
      view.appendChild(grid);
    }
    b.addEventListener('click', ev => {
      const n = ev.target.closest('[data-n]'); if (n && b.contains(n)) { sfx('turn'); i = Math.max(0, Math.min(strips.length - 1, +n.dataset.n)); setTab('strip'); window.scrollTo && $('page') && ($('page').scrollTop = $('page').scrollTop + b.getBoundingClientRect().top - $('page').getBoundingClientRect().top - 10); return; }
      if (ev.target.closest('[data-rnd]')) { sfx('turn'); i = Math.floor(Math.random() * strips.length); setTab('strip'); }
    });
    document.addEventListener('keydown', ev => {
      if (!(window.IE && IE.current === 'comics') || ev.target.closest('input,textarea,select')) return;
      if (ev.key === 'ArrowLeft' && i > 0) { i--; setTab('strip'); } else if (ev.key === 'ArrowRight' && i < strips.length - 1) { i++; setTab('strip'); } else if (ev.key.toLowerCase() === 'r') { i = Math.floor(Math.random() * strips.length); setTab('strip'); }
    });
    let rw = 0, lastNarrow = narrow(); addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(() => { if (tab === 'strip' && narrow() !== lastNarrow && window.IE && IE.current === 'comics') { lastNarrow = narrow(); render(); } }, 200); });
    window.SiteComicsGo = k => { i = Math.max(0, Math.min(strips.length - 1, k)); setTab('strip'); };
    render();
  });
  // the home page's "strip of the day" (loads the comics a few seconds after the page settles)
  (function stripOfTheDay() {
    const home = document.querySelector('#s-home .news'); if (!home) return;
    const box = h('div', 'win applet cgi sotd'); box.innerHTML = '<div class="tb"><span class="t">STRIP OF THE DAY <small>comics.cgi</small></span></div><div class="body"><p class="sitewait">Loading today\'s comic...</p></div>';
    const before = $('happeningBox') || $('vodBox') || $('countdowns'); if (before) before.parentNode.insertBefore(box, before); else home.parentNode.insertBefore(box, home);
    const fill = () => comics().then(C => {
      const list = released(C); if (!list.length) return;
      const t = today(), fresh = list.filter(s => s.md === t.md), s = fresh[0] || list[(t.date.getDate() * 7 + t.m) % list.length];
      const body = box.querySelector('.body'); body.innerHTML = '';
      const cv = document.createElement('canvas'); cv.className = 'comiccv sotdcv';
      C.drawStrip(cv, s, { maxCols: 1, panels: [s.p[s.p.length - 1]] });
      body.appendChild(h('p', 'sotdt', `<b>${fresh.length ? 'NEW TODAY: ' : ''}#${C.STRIPS.indexOf(s) + 1} ${esc(s.t)}</b> <small>(${esc(s.d)}/99)</small>`));
      body.appendChild(cv);
      body.appendChild(h('p', 'sotdlink', `<a href="#" data-sotd="${list.indexOf(s)}">Read the whole strip &raquo;</a> &middot; <a href="#" data-go="comics">All the comics</a>`));
    }).catch(() => { box.querySelector('.body').innerHTML = '<p><a href="#" data-go="comics">Read the comics &raquo;</a></p>'; });
    document.addEventListener('click', ev => { const a = ev.target.closest('[data-sotd]'); if (!a) return; ev.preventDefault(); IE.go('comics', 'click'); const k = +a.dataset.sotd; const go2 = () => window.SiteComicsGo ? SiteComicsGo(k) : setTimeout(go2, 150); go2(); });
    const start = () => setTimeout(fill, 2500);
    if (window.BootDone) BootDone.then(start); else start();
  })();

  // ================================================================ STAR WARS SHRINE
  BUILD.starwars = () => data().then(D => {
    const b = $('swBody'); b.innerHTML = '';
    const S = D.sw, t = today();
    // header: a starfield with a planet and a few tiny ships (all original silhouettes, no logos)
    const head = h('div', 'swhead'); const hc = document.createElement('canvas'); hc.width = 1200; hc.height = 300; head.appendChild(hc); head.appendChild(h('div', 'swt', 'JACK\'S STAR WARS SHRINE'));
    (() => { const g = hc.getContext('2d'), W = 1200, H = 300; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); let s = 42; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (const [x, y, rad, col] of [[330, 70, 300, 'rgba(110,40,160,.25)'], [760, 260, 260, 'rgba(30,80,170,.22)']]) { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
      for (let i = 0; i < 520; i++) { const v = r(); g.fillStyle = v > 0.93 ? '#fff' : v > 0.7 ? '#ccd' : '#667'; const z = v > 0.97 ? 3 : v > 0.82 ? 2 : 1; g.fillRect(Math.floor(r() * W), Math.floor(r() * H), z, z); }
      // a desert planet with two suns, far away
      g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(60, 40, 7, 0, 7); g.fill(); g.fillStyle = '#ffd890'; g.beginPath(); g.arc(84, 52, 5, 0, 7); g.fill();
      let gr = g.createRadialGradient(110, 230, 4, 140, 262, 70); gr.addColorStop(0, '#f6cc80'); gr.addColorStop(1, '#7a4418'); g.fillStyle = gr; g.beginPath(); g.arc(140, 262, 64, 0, 7); g.fill();
      // the moon that is actually a space station (with a dish, a trench and lots of little lights)
      const SX = 1050, SY = 110, SR = 125; g.save(); g.beginPath(); g.arc(SX, SY, SR, 0, 7); g.clip();
      gr = g.createRadialGradient(SX - 55, SY - 55, 10, SX, SY, SR); gr.addColorStop(0, '#dfe3ea'); gr.addColorStop(0.6, '#8d94a0'); gr.addColorStop(1, '#2a2e36'); g.fillStyle = gr; g.fillRect(SX - SR, SY - SR, SR * 2, SR * 2);
      g.strokeStyle = 'rgba(40,44,54,.45)'; g.lineWidth = 1.5; for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(SX - SR, SY + k * 19); g.lineTo(SX + SR, SY + k * 19); g.stroke(); }
      for (let i = 0; i < 90; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.28)'; g.fillRect(SX - SR + r() * SR * 2, SY - SR + r() * SR * 2, 4 + r() * 12, 3); }
      g.fillStyle = '#1a1d24'; g.fillRect(SX - SR, SY + 6, SR * 2, 7); g.fillStyle = '#ffe9a0'; for (let i = 0; i < 16; i++) g.fillRect(SX - SR + 8 + i * 15, SY + 9, 2, 1);
      gr = g.createRadialGradient(SX - 40, SY - 44, 2, SX - 48, SY - 52, 36); gr.addColorStop(0, '#454b56'); gr.addColorStop(1, '#bcc2cc'); g.fillStyle = gr; g.beginPath(); g.arc(SX - 48, SY - 52, 33, 0, 7); g.fill(); g.strokeStyle = '#30343c'; g.lineWidth = 2; g.stroke();
      g.strokeStyle = 'rgba(30,34,40,.6)'; g.lineWidth = 1; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(SX - 48, SY - 52); g.lineTo(SX - 48 + Math.cos(a) * 32, SY - 52 + Math.sin(a) * 32); g.stroke(); }
      g.fillStyle = '#7cff6a'; g.beginPath(); g.arc(SX - 48, SY - 52, 4, 0, 7); g.fill();
      gr = g.createLinearGradient(SX - SR, 0, SX + SR, 0); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.8)'); g.fillStyle = gr; g.fillRect(SX - SR, SY - SR, SR * 2, SR * 2); g.restore();
      const bolt = (x1, y1, x2, y2, c) => { g.lineCap = 'round'; g.strokeStyle = c; g.globalAlpha = 0.35; g.lineWidth = 8; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.globalAlpha = 1; g.lineWidth = 3; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 1; g.stroke(); };
      // the X-shaped fighter, seen from behind (engines glowing), banking towards the station
      const xf = (x, y, k, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k); g.lineJoin = 'round';
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.save(); g.scale(a, b); g.rotate(0.42); g.strokeStyle = '#1a1a1a'; g.lineWidth = 2;
          g.fillStyle = '#d4d4cc'; g.beginPath(); g.moveTo(12, -6); g.lineTo(84, -3); g.lineTo(84, 4); g.lineTo(12, 7); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#c0301c'; g.fillRect(50, -4.5, 10, 9); g.fillStyle = '#8a8a88'; g.fillRect(84, -2, 30, 4); g.strokeRect(84, -2, 30, 4); g.fillRect(112, -3, 5, 6);
          g.fillStyle = '#b8b8b0'; g.beginPath(); g.arc(28, 0, 10, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#ff7a2a'; g.beginPath(); g.arc(28, 0, 6, 0, 7); g.fill(); g.fillStyle = '#ffe0a0'; g.beginPath(); g.arc(28, 0, 2.5, 0, 7); g.fill(); g.restore(); }
        g.fillStyle = '#e4e4dc'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 17, 0, 7); g.fill(); g.stroke();
        g.fillStyle = '#9a9a92'; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill(); g.fillStyle = '#2a7ad8'; g.beginPath(); g.arc(0, -11, 6, Math.PI, 0); g.fill(); g.stroke(); g.restore(); };
      // the ball-and-wings fighters chasing it
      const tf = (x, y, k) => { g.save(); g.translate(x, y); g.scale(k, k); g.strokeStyle = '#0a0a0a'; g.lineWidth = 2; g.lineJoin = 'round';
        g.fillStyle = '#8c929c'; g.fillRect(-28, -4, 56, 8); g.strokeRect(-28, -4, 56, 8);
        for (const sx of [-1, 1]) { g.fillStyle = '#353a44'; g.beginPath(); g.moveTo(sx * 31, -44); g.lineTo(sx * 39, -22); g.lineTo(sx * 39, 22); g.lineTo(sx * 31, 44); g.lineTo(sx * 23, 22); g.lineTo(sx * 23, -22); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = '#6a707c'; g.beginPath(); g.moveTo(sx * 31, -40); g.lineTo(sx * 31, 40); g.stroke(); g.strokeStyle = '#0a0a0a'; }
        g.fillStyle = '#b4bac4'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#161a22'; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.strokeStyle = '#5a606a'; g.lineWidth = 1; g.beginPath(); for (let a = 0; a < 8; a++) { g.moveTo(0, 0); g.lineTo(Math.cos(a * Math.PI / 4) * 8, Math.sin(a * Math.PI / 4) * 8); } g.stroke(); g.restore(); };
      bolt(565, 92, 520, 104, '#3f3'); bolt(690, 168, 640, 160, '#3f3'); bolt(470, 98, 430, 110, '#3f3');
      xf(360, 128, 1, -0.12); tf(620, 82, 0.85); tf(745, 162, 0.6);
      bolt(800, 118, 850, 112, '#f33'); bolt(820, 130, 868, 124, '#f33');
    })();
    b.appendChild(head);
    // the Episode I counter
    const rel = new Date(1999, 6, 16), days = Math.round((t.date - rel) / 86400000);
    const count = h('div', 'swcount');
    if (days < 0) count.innerHTML = `THE PHANTOM MENACE IS OUT IN UK CINEMAS IN<span class="bigcount">${-days} DAY${days === -1 ? '' : 'S'}</span>(16 July 1999. It's been sixteen YEARS since the last one. I can wait ${-days} days. I can't. I can.)`;
    else count.innerHTML = `TIMES I HAVE SEEN THE PHANTOM MENACE<span class="bigcount">${Math.min(12, 1 + Math.floor(days / 12))}</span>(out since 16 July 1999. Mom says that's enough now. Mom is wrong.)`;
    b.appendChild(count);
    b.appendChild(h('div', 'sbox', `<p class="tagline">Why Star Wars is the best thing ever (a list)</p><p>Spaceships that go WHOOSH in space where there's no air (don't care). Laser swords. A big black helmet that breathes. A furry co-pilot. A little green bloke who talks backwards and is the wisest person in the galaxy. A planet that is also a gun. Teddy bears beating an army. And this year, for the first time since before I was born, a NEW ONE.</p><p>I have seen the first three about forty times each. Dave has seen them "loads". Dave once asked which one had the snow in it.</p>`));
    // diary
    b.appendChild(h('h3', null, 'My Episode I diary'));
    b.appendChild(h('ul', 'swdiary', S.diary.filter(d => { const m = { Nov: 1198, Jan: 101, Mar: 301, Apr: 401, Jun: 601, Aug: 801 }; const md = /^\d/.test(d[0]) ? (+d[0].split(' ')[0]) + { May: 500, Jul: 700 }[d[0].split(' ')[1]] : m[d[0].slice(0, 3)]; return md === 1198 || md <= t.md; }).map(d => `<li><b>${esc(d[0])}</b><span>${esc(d[1])}</span></li>`).join('')));
    // opinions
    b.appendChild(h('div', 'sgrid', `<div class="sbox k"><p class="tagline">DARTH MAUL IS THE COOLEST</p><p>Red and black face. Horns. Says about three things. Has a lightsaber with TWO ENDS and spins it like a baton. Fights two Jedi at once and is winning for most of it. The best baddie since the one with the helmet, and he doesn't even need the helmet.</p></div><div class="sbox y"><p class="tagline">PODRACING: THE VERDICT</p><p>Best bit of the film and it's not close. Engines the size of a bus held together with string. The two-headed commentator. Sebulba cheating. The crowd. I want a podracer more than I want a Dreamcast and I want a Dreamcast more than I want to breathe.</p><p>Play it on the Games page? No, play <b>Episode I: Racer</b> on the N64 (see Reviews). 90%.</p></div><div class="sbox c"><p class="tagline">THE JAR JAR QUESTION</p><p>Right. He's clumsy, he talks funny, he steps in stuff. The little kids at the cinema laughed. Dave laughed. I did NOT laugh. (I laughed once. The tongue bit. Don't tell anyone.) Final answer: he's fine, the Gungan city is brilliant, and the vote's on the Polls page.</p></div><div class="sbox g"><p class="tagline">THINGS I HAVE MADE</p><p>A double lightsaber from two wrapping-paper tubes, parcel tape and a torch. A podracer from a shoebox and two coke cans (it doesn't go). A Darth Maul face with Mom's eyeliner (she was not happy). An X-wing from the LEGO they started doing this year, which is officially the best LEGO there has ever been.</p></div>`));
    // lightsaber picker + the duel (LIVE)
    b.appendChild(h('h3', null, 'Build your lightsaber <span class="live">LIVE</span>'));
    const duel = h('div', 'sbox'); b.appendChild(duel);
    duel.innerHTML = `<div class="jedirow"><div><canvas id="jediCanvas" width="480" height="360" aria-label="Lightsaber duel: move your mouse, click to swing"></canvas></div><div><p>Pick a colour, then wave your mouse over the black bit. Click to swing. <b>Anyone else on this page right now shows up too</b>, so you can have an actual duel. Cross blades for sparks.</p><div class="saberpick"></div><p class="small" style="margin-top:8px">Hum the noise yourself. Vrrrm. VWOM. (Turn SFX on for the clash.)</p><p id="saberWho" class="small"></p></div></div>`;
    const COLS = [['#3f3', 'green'], ['#4af', 'blue'], ['#f33', 'red'], ['#c6f', 'purple'], ['#ff4', 'yellow'], ['#fff', 'white']];
    const pickEl = duel.querySelector('.saberpick');
    const renderPick = () => { pickEl.innerHTML = COLS.map(([c, n]) => `<button type="button" style="--c:${c}" class="${saberCol() === c ? 'on' : ''}" title="${n}" aria-label="${n} lightsaber"></button>`).join(''); };
    renderPick();
    pickEl.addEventListener('click', ev => { const btn = ev.target.closest('button'); if (!btn) return; store.set('jhp_site_saber', btn.style.getPropertyValue('--c').trim()); renderPick(); applyCursor(); sfx('click'); });
    const cv = $('jediCanvas'), g = cv.getContext('2d'), W = 480, H = 360;
    const mine = { x: 0.5, y: 0.5, sw: 0, on: false }, others = new Map();
    let lastSend = 0, clashT = 0;
    const pos = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height]; };
    cv.addEventListener('pointermove', ev => { [mine.x, mine.y] = pos(ev); mine.on = true; send(); });
    cv.addEventListener('pointerdown', ev => { [mine.x, mine.y] = pos(ev); mine.on = true; mine.sw = 1; send(true); });
    cv.addEventListener('pointerleave', () => { mine.on = false; send(true); });
    function send(force) { const now = performance.now(); if (!force && now - lastSend < 110) return; lastSend = now; if (window.Net && window.IE && IE.current === 'starwars') Net.relay(0, 'site.saber', { x: +mine.x.toFixed(3), y: +mine.y.toFixed(3), c: saberCol(), s: mine.sw > 0.5 ? 1 : 0, on: mine.on ? 1 : 0 }); }
    if (window.Net) Net.onRelay('site.saber', (d, m) => { if (!d || typeof d !== 'object') return; const x = +d.x, y = +d.y; if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return; const c = COLS.find(k => k[0] === d.c) ? d.c : '#3f3'; if (!d.on) { others.delete(m.fromId); return; } const o = others.get(m.fromId) || { sw: 0 }; Object.assign(o, { x, y, c, nick: String(m.from).slice(0, 16), t: performance.now() }); if (d.s) o.sw = 1; others.set(m.fromId, o); whoLine(); });
    const whoLine = () => { const who = $('saberWho'); if (who) who.textContent = others.size ? `Also duelling right now: ${[...others.values()].map(o => o.nick).join(', ')}` : 'Nobody else is duelling right now. Get a mate on the site!'; };
    const saber = (x, y, c, sw, label) => {
      const hx = W * 0.5 + (x - 0.5) * W * 0.9, hy = H - 20 - (1 - y) * 40, tx = x * W, ty = y * H;
      let ang = Math.atan2(ty - hy, tx - hx) + sw * 1.2, len = 170;
      const ex = hx + Math.cos(ang) * len, ey = hy + Math.sin(ang) * len;
      g.lineCap = 'round'; g.strokeStyle = c; g.globalAlpha = 0.25; g.lineWidth = 16; g.beginPath(); g.moveTo(hx, hy); g.lineTo(ex, ey); g.stroke();
      g.globalAlpha = 0.6; g.lineWidth = 8; g.stroke(); g.globalAlpha = 1; g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
      g.strokeStyle = '#999'; g.lineWidth = 8; g.beginPath(); g.moveTo(hx - Math.cos(ang) * 26, hy - Math.sin(ang) * 26); g.lineTo(hx, hy); g.stroke(); g.strokeStyle = '#333'; g.lineWidth = 3; g.stroke();
      if (label) { g.fillStyle = c; g.font = 'bold 11px Tahoma, sans-serif'; g.textAlign = 'center'; g.fillText(label, hx, Math.min(H - 4, hy + 26)); }
      return [ex, ey];
    };
    let raf = 0, vis = false;
    function frame() {
      if (!vis) { raf = 0; return; }
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#334'; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % W, (i * 61) % H, 1, 1);
      const now = performance.now();
      for (const [id, o] of others) if (now - o.t > 4000) others.delete(id);
      const tips = [];
      for (const o of others.values()) { o.sw = Math.max(0, o.sw - 0.08); tips.push(saber(o.x, o.y, o.c, o.sw, o.nick)); }
      if (mine.on) { mine.sw = Math.max(0, mine.sw - 0.08); const mt = saber(mine.x, mine.y, saberCol(), mine.sw, 'you'); for (const tp of tips) if (Math.hypot(tp[0] - mt[0], tp[1] - mt[1]) < 40 && now - clashT > 400) { clashT = now; sfx('zap'); secret('site.saberclash'); for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#fff' : '#ff0'; g.fillRect(mt[0] + (Math.random() - 0.5) * 50, mt[1] + (Math.random() - 0.5) * 50, 3, 3); } } }
      else { g.fillStyle = '#888'; g.font = '13px "Courier New", monospace'; g.textAlign = 'center'; g.fillText(others.size ? 'Someone is here. Move your mouse in!' : 'Move your mouse here. Click to swing.', W / 2, H / 2); }
      whoLine();
      raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf && vis) raf = requestAnimationFrame(frame); };
    if (window.IntersectionObserver) new IntersectionObserver(es => { vis = es[0].isIntersecting && (!window.IE || IE.current === 'starwars'); kick(); }).observe(cv);
    document.addEventListener('section', ev => { if (ev.detail === 'starwars') { vis = true; kick(); } else { vis = false; mine.on = false; } });
    vis = true; kick();
    // the Force
    const force = h('div', 'sbox k', '<p class="tagline">USE THE FORCE</p><p>This button has been used by visitors <b class="bigcount" id="forceN" style="font-size:28px">...</b> times. It does nothing. That\'s how you know it\'s working.</p><button class="forcebtn" type="button" id="forceBtn">USE THE FORCE</button><p class="small" id="forceMsg" style="margin-top:8px">Concentrate.</p>');
    b.appendChild(force);
    let forceN = 0, mineN = store.get('jhp_site_force', 0);
    const MSG = ['Nothing happened. Try again.', 'Did the page move? No. Try again.', 'You feel slightly more calm.', 'A pencil rolled off the desk. Coincidence.', 'Dave felt a disturbance. Dave is at school.', 'The Force is strong with this one.', 'Your Mom just shouted "tea". The Force works in mysterious ways.', 'Gubbinz levitated for a second. He says he jumped.'];
    $('forceBtn').addEventListener('click', () => { if (window.Net) Net.kv.inc('site.sw.force'); mineN++; store.set('jhp_site_force', mineN); $('forceMsg').textContent = mineN >= 50 ? 'You have used the Force 50 times. You are either a Jedi or very bored. Both is fine.' : pick(MSG); sfx(mineN % 10 === 0 ? 'boing' : 'click'); if (mineN === 50) secret('site.force'); });
    if (window.Net) { Net.kv.get(['site.sw.force']).then(v => { forceN = v['site.sw.force'] || 0; $('forceN').textContent = fmt(forceN); }); Net.kv.watch('site.sw.force', ev => { if (ev.type === 'set') { $('forceN').textContent = fmt(ev.v); if (ev.by !== me().nick) $('forceMsg').textContent = `${ev.by} just used the Force. Felt that.`; } }); }
    // Jedi test
    b.appendChild(h('h3', null, 'Are YOU a Jedi?'));
    const jt = h('div', 'sbox y jstest'); b.appendChild(jt);
    const jform = () => {
      jt.innerHTML = '<p class="tagline">The Jedi test. Answer honestly. The Force knows.</p>' + S.jedi.map((q, i) => `<p><b>${i + 1}. ${esc(q.q)}</b></p>${q.a.map((a, k) => `<label><input type="radio" name="jq${i}" value="${k}"> ${esc(a)}</label>`).join('')}`).join('') + '<div class="row" style="margin-top:8px"><button class="btn big" type="button">Reveal my destiny</button></div>';
      jt.querySelector('.btn').addEventListener('click', () => {
        const picks = S.jedi.map((q, i) => { const r = jt.querySelector(`input[name=jq${i}]:checked`); return r ? +r.value : -1; });
        if (picks.includes(-1)) return Desk.msgbox('The Jedi test', 'Answer ALL the questions. A Jedi does not skip questions. (Well. Maybe question 4.)', 'warn');
        const counts = [0, 0, 0, 0]; picks.forEach(k => counts[k]++);
        const best = counts.indexOf(Math.max(...counts)), v = S.verdict[best];
        if (best === 0) secret('site.jedi');
        jt.innerHTML = `<p class="tagline">THE FORCE HAS SPOKEN. YOU ARE A...</p><div class="bigcount" style="font-size:44px">${esc(v[0])}</div><p>${esc(v[1])}</p><p class="small">Jedi Master ${counts[0]}, Jedi Knight ${counts[1]}, Sith Lord ${counts[2]}, Gungan ${counts[3]}.</p><button class="btn" type="button">Take it again</button>`;
        jt.querySelector('.btn').addEventListener('click', jform); sfx('solve');
      });
    };
    jform();
    // the shelf
    b.appendChild(h('h3', null, 'The shelf'));
    const shelf = document.createElement('canvas'); shelf.className = 'swshelf'; shelf.width = 960; shelf.height = 180; shelf.setAttribute('aria-label', 'Jack\'s shelf of Star Wars toys, drawn in pixels');
    (() => { const g = shelf.getContext('2d'), W = 960, B = 146; g.lineJoin = 'round';
      g.fillStyle = '#5a3a1e'; g.fillRect(0, 0, W, 180); g.fillStyle = '#4c3018'; for (let x = 0; x < W; x += 64) g.fillRect(x, 0, 3, B);
      g.fillStyle = 'rgba(255,230,180,.06)'; for (let x = 20; x < W; x += 64) g.fillRect(x, 0, 18, B);
      g.fillStyle = '#9a6a3a'; g.fillRect(0, B, W, 7); g.fillStyle = '#6a4220'; g.fillRect(0, B + 7, W, 27); g.fillStyle = '#5a3818'; for (let i = 0; i < 6; i++) g.fillRect(0, B + 11 + i * 4, W, 1);
      g.fillStyle = '#f0d8a8'; g.font = 'italic 15px Georgia, "Times New Roman", serif'; g.fillText('(not to scale. Mom dusts them. I re-arrange them. Repeat.)', 12, 174);
      const P = (col, f) => { g.beginPath(); f(); g.fillStyle = col; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#120a04'; g.stroke(); };
      const rr = (x, y, w, h, q) => { g.moveTo(x + q, y); g.arcTo(x + w, y, x + w, y + h, q); g.arcTo(x + w, y + h, x, y + h, q); g.arcTo(x, y + h, x, y, q); g.arcTo(x, y, x + w, y, q); g.closePath(); };
      const el = (x, y, rx, ry) => g.ellipse(x, y, rx, ry, 0, 0, 7);
      const poly = (...p) => { g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); };
      const base = (x, w) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); el(x, B + 1, w || 30, 5); g.fill(); };
      const saber = (x1, y1, x2, y2, c) => { g.lineCap = 'round'; g.strokeStyle = c; g.globalAlpha = 0.35; g.lineWidth = 11; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.globalAlpha = 1; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.lineCap = 'butt'; };
      // 1. the big black helmet bloke (cape, chest box with lights, the breathing mask)
      { const x = 70; base(x, 40);
        P('#141418', () => poly(x - 30, B - 86, x + 30, B - 86, x + 42, B - 2, x - 42, B - 2));
        P('#26262e', () => rr(x - 13, B - 40, 11, 38, 2)); P('#26262e', () => rr(x + 2, B - 40, 11, 38, 2));
        P('#2c2c34', () => rr(x - 20, B - 90, 40, 54, 5));
        P('#8a8a92', () => rr(x - 9, B - 80, 18, 13, 2)); [['#e10600', -6], ['#3c3', -1], ['#4af', 4]].forEach(([c, dx]) => { g.fillStyle = c; g.fillRect(x + dx, B - 76, 3, 5); });
        P('#555', () => rr(x - 20, B - 46, 40, 6, 1)); g.fillStyle = '#bbb'; g.fillRect(x - 5, B - 45, 10, 4);
        P('#2c2c34', () => rr(x - 29, B - 88, 10, 44, 4)); P('#2c2c34', () => rr(x + 19, B - 88, 10, 44, 4));
        P('#9a9aa2', () => rr(x + 22, B - 46, 5, 14, 1)); // saber hilt in his hand
        P('#1a1a20', () => poly(x - 27, B - 86, x - 22, B - 112, x + 22, B - 112, x + 27, B - 86, x, B - 91));
        P('#1e1e26', () => { g.arc(x, B - 111, 20, Math.PI, 0); g.closePath(); });
        P('#3a3a44', () => poly(x - 14, B - 111, x + 14, B - 111, x + 9, B - 93, x, B - 89, x - 9, B - 93));
        g.fillStyle = '#060608'; g.beginPath(); poly(x - 13, B - 109, x - 3, B - 107, x - 4, B - 101, x - 12, B - 103); poly(x + 13, B - 109, x + 3, B - 107, x + 4, B - 101, x + 12, B - 103); g.fill();
        g.fillStyle = '#8a8a92'; for (let i = -2; i <= 2; i++) g.fillRect(x + i * 3 - 1, B - 98, 2, 6);
        g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(x - 8, B - 121, 7, 3, -0.5, 0, 7); g.fill(); }
      // 2. the furry co-pilot (bandolier, big hair)
      { const x = 178; base(x, 36);
        P('#7a4a22', () => rr(x - 14, B - 46, 12, 44, 3)); P('#7a4a22', () => rr(x + 2, B - 46, 12, 44, 3));
        P('#8b5a2b', () => rr(x - 34, B - 102, 12, 54, 5)); P('#8b5a2b', () => rr(x + 22, B - 102, 12, 54, 5));
        P('#8b5a2b', () => rr(x - 24, B - 106, 48, 66, 10));
        g.strokeStyle = '#5e3a18'; g.lineWidth = 1.5; for (let i = 0; i < 46; i++) { const fx = x - 22 + (i * 37 % 44), fy = B - 102 + (i * 23 % 60); g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + 2, fy + 6); g.stroke(); }
        g.save(); g.beginPath(); rr(x - 24, B - 106, 48, 66, 10); g.clip(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 10; g.beginPath(); g.moveTo(x - 26, B - 106); g.lineTo(x + 26, B - 44); g.stroke(); g.fillStyle = '#c8c8d0'; for (let i = 0; i < 5; i++) g.fillRect(x - 21 + i * 10, B - 101 + i * 12, 6, 6); g.restore();
        P('#6e4420', () => rr(x - 25, B - 142, 50, 54, 18));
        P('#8b5a2b', () => rr(x - 16, B - 136, 32, 38, 11));
        g.strokeStyle = '#5e3a18'; g.lineWidth = 1.5; for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(x - 15 + i * 3.3, B - 134); g.lineTo(x - 16 + i * 3.3, B - 127); g.stroke(); }
        P('#b98450', () => el(x, B - 110, 11, 8));
        g.fillStyle = '#111'; g.beginPath(); el(x, B - 114, 4.5, 3); g.fill(); g.fillRect(x - 10, B - 124, 5, 4); g.fillRect(x + 5, B - 124, 5, 4);
        g.fillStyle = '#4a2a10'; g.fillRect(x - 12, B - 128, 9, 2); g.fillRect(x + 3, B - 128, 9, 2); g.fillStyle = '#3a1a0a'; g.fillRect(x - 5, B - 106, 10, 2); }
      // 3. the farm boy, saber up
      { const x = 280; base(x);
        saber(x + 33, B - 118, x + 52, B - 140, '#4aa8ff');
        P('#d8c8a0', () => rr(x - 12, B - 42, 10, 40, 2)); P('#d8c8a0', () => rr(x + 2, B - 42, 10, 40, 2));
        P('#5a3a1a', () => rr(x - 13, B - 15, 12, 13, 2)); P('#5a3a1a', () => rr(x + 1, B - 15, 12, 13, 2));
        P('#f2ead8', () => rr(x - 27, B - 84, 10, 36, 4));
        P('#f2ead8', () => poly(x - 18, B - 86, x + 18, B - 86, x + 21, B - 38, x - 21, B - 38));
        g.strokeStyle = '#b8ac8c'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 10, B - 86); g.lineTo(x + 5, B - 58); g.stroke();
        P('#6a4a2a', () => rr(x - 20, B - 54, 40, 7, 1)); g.fillStyle = '#c9a060'; g.fillRect(x - 3, B - 53, 6, 5);
        P('#f2ead8', () => poly(x + 12, B - 84, x + 22, B - 87, x + 35, B - 112, x + 27, B - 116));
        P('#a0a0a8', () => poly(x + 27, B - 112, x + 33, B - 109, x + 39, B - 120, x + 33, B - 123));
        P('#f2c79a', () => el(x + 31, B - 113, 4.5, 4.5));
        P('#f2c79a', () => rr(x - 11, B - 108, 22, 25, 9));
        P('#e8c050', () => { g.moveTo(x - 13, B - 92); g.quadraticCurveTo(x - 15, B - 114, x, B - 113); g.quadraticCurveTo(x + 15, B - 114, x + 13, B - 92); g.lineTo(x + 10, B - 101); g.lineTo(x - 4, B - 103); g.lineTo(x - 10, B - 99); g.closePath(); });
        g.fillStyle = '#1a3a7a'; g.fillRect(x - 6, B - 97, 3, 3); g.fillRect(x + 3, B - 97, 3, 3); g.fillStyle = '#8a3a2a'; g.fillRect(x - 3, B - 89, 6, 2); }
      // 4. the one with the horns and the saber with TWO ENDS
      { const x = 402; base(x);
        P('#16161a', () => poly(x - 18, B - 88, x + 18, B - 88, x + 27, B - 2, x - 27, B - 2));
        g.strokeStyle = '#2e2e36'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, B - 84); g.lineTo(x, B - 4); g.stroke();
        P('#26262c', () => rr(x - 18, B - 58, 36, 6, 1));
        saber(x - 66, B - 70, x - 15, B - 70, '#ff2a2a'); saber(x + 15, B - 70, x + 66, B - 70, '#ff2a2a');
        P('#16161a', () => poly(x - 18, B - 86, x - 9, B - 88, x - 4, B - 72, x - 13, B - 66)); P('#16161a', () => poly(x + 18, B - 86, x + 9, B - 88, x + 4, B - 72, x + 13, B - 66));
        P('#9a9aa2', () => rr(x - 16, B - 73, 32, 6, 1)); g.fillStyle = '#222'; for (const dx of [-12, -4, 4, 10]) g.fillRect(x + dx, B - 73, 2, 6);
        P('#222', () => el(x - 8, B - 70, 4, 4)); P('#222', () => el(x + 8, B - 70, 4, 4));
        for (let i = -2; i <= 2; i++) P('#efe2bc', () => poly(x + i * 5 - 2, B - 105, x + i * 5 + 2, B - 105, x + i * 5, B - 113 + Math.abs(i)));
        P('#c8161a', () => rr(x - 11, B - 108, 22, 25, 9));
        g.fillStyle = '#111'; g.fillRect(x - 1, B - 108, 2, 9); g.beginPath(); poly(x - 10, B - 101, x - 2, B - 100, x - 6, B - 92); poly(x + 10, B - 101, x + 2, B - 100, x + 6, B - 92); poly(x - 7, B - 89, x + 7, B - 89, x + 4, B - 84, x - 4, B - 84); g.fill();
        g.fillRect(x - 10, B - 92, 2, 6); g.fillRect(x + 8, B - 92, 2, 6);
        g.fillStyle = '#ffd400'; g.fillRect(x - 7, B - 98, 3, 2); g.fillRect(x + 4, B - 98, 3, 2); }
      // 5. the little green wise one (big ears, walking stick)
      { const x = 512; base(x, 26);
        g.strokeStyle = '#4a3010'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 24, B - 2); g.lineTo(x + 21, B - 46); g.stroke();
        P('#7a5a3a', () => poly(x - 14, B - 42, x + 14, B - 42, x + 21, B - 2, x - 21, B - 2));
        P('#d8c8a0', () => poly(x - 5, B - 42, x + 5, B - 42, x + 4, B - 2, x - 4, B - 2));
        P('#7a5a3a', () => poly(x + 9, B - 40, x + 17, B - 42, x + 24, B - 34, x + 16, B - 30));
        P('#7d9a4a', () => el(x + 21, B - 36, 3.5, 3.5));
        P('#7d9a4a', () => poly(x - 10, B - 58, x - 36, B - 68, x - 28, B - 56, x - 10, B - 48)); P('#7d9a4a', () => poly(x + 10, B - 58, x + 36, B - 68, x + 28, B - 56, x + 10, B - 48));
        g.strokeStyle = '#5a7a30'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 13, B - 56); g.lineTo(x - 30, B - 63); g.moveTo(x + 13, B - 56); g.lineTo(x + 30, B - 63); g.stroke();
        P('#7d9a4a', () => el(x, B - 54, 14, 13));
        g.fillStyle = '#fff'; g.beginPath(); el(x - 5, B - 56, 3.5, 3); el(x + 5, B - 56, 3.5, 3); g.fill(); g.fillStyle = '#2a1a0a'; g.fillRect(x - 6, B - 57, 2, 2); g.fillRect(x + 4, B - 57, 2, 2);
        g.strokeStyle = '#4a6a24'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 7, B - 62); g.lineTo(x + 7, B - 62); g.moveTo(x - 4, B - 46); g.quadraticCurveTo(x, B - 44, x + 4, B - 46); g.stroke();
        g.strokeStyle = '#eee'; g.lineWidth = 1.2; g.beginPath(); for (const [a, c2] of [[-6, -12], [-2, -4], [5, 11]]) { g.moveTo(x + a, B - 66); g.quadraticCurveTo(x + a, B - 72, x + c2, B - 71); } g.stroke(); }
      // 6. the LEGO X-wing (studs on top, wings in an X, on its stand)
      { const x0 = 588, y0 = B - 52; base(x0 + 90, 70);
        P('#444', () => rr(x0 + 82, y0 + 8, 8, B - y0 - 12, 1)); P('#555', () => rr(x0 + 62, B - 6, 48, 5, 1));
        P('#d8d8d0', () => poly(x0 + 8, y0 + 4, x0 + 58, y0 + 4, x0 + 70, y0 + 40, x0 + 30, y0 + 40)); g.fillStyle = '#c03020'; g.fillRect(x0 + 40, y0 + 18, 14, 8); P('#9a9a98', () => rr(x0 + 30, y0 + 39, 76, 4, 1)); P('#9a9a98', () => rr(x0 + 104, y0 + 38, 6, 6, 1));
        P('#e2e2da', () => poly(x0 + 8, y0 - 6, x0 + 58, y0 - 6, x0 + 70, y0 - 44, x0 + 30, y0 - 44)); g.fillStyle = '#c03020'; g.fillRect(x0 + 40, y0 - 32, 14, 8);
        P('#9a9a98', () => rr(x0 + 30, y0 - 47, 76, 4, 1)); P('#9a9a98', () => rr(x0 + 104, y0 - 48, 6, 6, 1));
        P('#f2f2ea', () => poly(x0, y0 - 9, x0 + 70, y0 - 12, x0 + 196, y0 - 2, x0 + 196, y0 + 4, x0 + 70, y0 + 9, x0, y0 + 9));
        g.fillStyle = '#c03020'; g.fillRect(x0 + 120, y0 - 6, 22, 4); g.fillRect(x0 + 150, y0 - 4, 14, 3);
        P('#253a5a', () => poly(x0 + 72, y0 - 12, x0 + 98, y0 - 21, x0 + 124, y0 - 7));
        P('#bdbdb5', () => rr(x0 - 8, y0 - 18, 30, 9, 2)); P('#bdbdb5', () => rr(x0 - 8, y0 + 9, 30, 9, 2)); g.fillStyle = '#ff7a2a'; g.fillRect(x0 - 10, y0 - 16, 3, 5); g.fillRect(x0 - 10, y0 + 11, 3, 5);
        g.fillStyle = '#fff'; g.strokeStyle = '#9a9a92'; g.lineWidth = 1; for (let i = 0; i < 7; i++) { g.fillRect(x0 + 6 + i * 9, y0 - 13, 5, 3); g.strokeRect(x0 + 6 + i * 9, y0 - 13, 5, 3); }
        g.strokeStyle = 'rgba(0,0,0,.25)'; g.beginPath(); for (let i = 1; i < 6; i++) { g.moveTo(x0 + i * 20, y0 - 8); g.lineTo(x0 + i * 20, y0 + 8); } g.stroke(); }
      // 7. the trilogy on video, widescreen box set
      { const x0 = 808; base(x0 + 68, 74);
        P('#1c1c2c', () => rr(x0, B - 104, 138, 102, 3)); g.fillStyle = '#ffd400'; g.font = 'bold 10px Tahoma, sans-serif'; g.textAlign = 'center'; g.fillText('WIDESCREEN', x0 + 69, B - 94); g.fillText('THE TRILOGY', x0 + 69, B - 6);
        ['IV', 'V', 'VI'].forEach((t, i) => { const sx = x0 + 8 + i * 43; P('#0a0a0a', () => rr(sx, B - 86, 36, 66, 2)); g.fillStyle = '#e8e8e8'; g.fillRect(sx + 4, B - 84, 28, 9); g.fillStyle = '#000'; g.font = 'bold 8px Tahoma, sans-serif'; g.fillText('VHS', sx + 18, B - 77); g.fillStyle = '#ffd400'; g.font = 'bold 22px Georgia, serif'; g.fillText(t, sx + 18, B - 42); g.fillRect(sx + 6, B - 32, 24, 2); });
        g.textAlign = 'left'; }
    })();
    b.appendChild(shelf);
    b.appendChild(h('p', 'note99', 'Drawn by me from memory. Any resemblance to actual toys is because I own the actual toys. The films are on video (widescreen box set, Christmas 1997, best present ever until the N64).'));
    b.appendChild(h('div', 'sbox', '<p class="tagline">MORE STAR WARS ON THIS SITE</p><p>Reviews of <b>Rogue Squadron</b>, <b>Episode I: Racer</b> and <b>The Phantom Menace</b> on the <a href="#" data-go="reviews">Reviews page</a>. Real cheats for Rogue Squadron on the <a href="#" data-go="cheats">Cheats page</a>. "Best Star Wars film" and "Coolest thing in Episode I" on the <a href="#" data-go="polls">Polls page</a>. Star Wars questions in the <a href="#" data-go="quiz">Nerd Quiz</a>. A starfield wallpaper and a lightsaber pointer on the <a href="#" data-go="downloads">Downloads page</a>. And somewhere on this site there\'s a Holocron. The marquee at the top knows where.</p>'));
  });

  // ================================================================ HOME PAGE: visitor of the day, best-viewed strip, letter reward
  (function home() {
    const vod = h('div', 'win applet cgi'); vod.id = 'vodBox';
    vod.innerHTML = '<div class="tb"><span class="t">VISITOR OF THE DAY <small>vod.cgi</small> <span class="live">LIVE</span></span></div><div class="body"><div class="vod"><canvas class="vav" width="16" height="16" aria-hidden="true"></canvas><div><b class="n">...</b><span class="s">First one through the door today wins. It could be YOU tomorrow. Set your alarm.</span></div></div></div>';
    const cd = $('countdowns'); if (cd) cd.parentNode.insertBefore(vod, cd);
    const av = vod.querySelector('.vav'), nameEl = vod.querySelector('.n'), sEl = vod.querySelector('.s');
    const AVPAL = { k: '#000', w: '#fff', g: '#3a9a2a', r: '#e10600', y: '#ffd400', b: '#2a7ad8', s: '#f2c79a' };
    const drawAv = (nick, col) => { // a little 16x16 head-and-shoulders, the same every time for the same name
      const g = av.getContext('2d'), hsh = hash(nick), R = (x, y, w, hh, c) => { g.fillStyle = c; g.fillRect(x, y, w, hh); };
      const skin = ['#f2c79a', '#e0a878', '#c08a5a', '#8a5a3a', '#f8d8b8'][hsh % 5], hair = ['#5a3216', '#1a1a1a', '#e8c040', '#a0401a', '#7a5a3a', '#d0d0d0'][(hsh >> 3) % 6], top = ['#e10600', '#2a7ad8', '#3a9a2a', '#8000ff', '#ff8a00', '#222'][(hsh >> 6) % 6], style = (hsh >> 9) % 5;
      R(0, 0, 16, 16, col || '#2a7ad8'); R(0, 0, 16, 1, 'rgba(255,255,255,.25)');
      R(3, 13, 10, 3, top); R(2, 14, 12, 2, top); R(6, 12, 4, 2, skin); R(7, 13, 2, 1, '#fff');
      R(4, 4, 8, 9, skin); R(3, 7, 1, 2, skin); R(12, 7, 1, 2, skin); R(5, 12, 6, 1, skin);
      R(5, 7, 2, 2, '#fff'); R(9, 7, 2, 2, '#fff'); R(6, 8, 1, 1, '#000'); R(9, 8, 1, 1, '#000'); R(7, 10, 2, 1, 'rgba(0,0,0,.18)'); R(6, 11, 4, 1, '#8a2a2a');
      if (style === 0) { R(3, 2, 10, 3, top); R(2, 4, 12, 1, top); R(11, 4, 4, 1, '#000'); R(7, 2, 2, 1, '#fff'); } // a cap
      else if (style === 1) { R(4, 3, 8, 2, hair); for (let x = 4; x < 12; x += 2) R(x, 2, 1, 1, hair); R(3, 4, 1, 3, hair); R(12, 4, 1, 3, hair); } // spikes
      else if (style === 2) { R(4, 2, 8, 3, hair); R(3, 3, 2, 10, hair); R(11, 3, 2, 10, hair); } // long
      else if (style === 3) { R(4, 2, 8, 2, hair); R(4, 4, 3, 2, hair); R(9, 4, 3, 2, hair); R(3, 3, 1, 4, hair); R(12, 3, 1, 4, hair); } // curtains
      else { R(4, 3, 8, 1, hair); R(3, 4, 1, 2, hair); R(12, 4, 1, 2, hair); } // short back and sides
      R(5, 6, 2, 1, style === 0 ? 'rgba(0,0,0,.25)' : hair); R(9, 6, 2, 1, style === 0 ? 'rgba(0,0,0,.25)' : hair); };
    const render = v => {
      if (!v || !v.n) { nameEl.textContent = 'nobody yet!'; drawAv('nobody', '#888'); return; }
      nameEl.textContent = v.n; drawAv(v.n, v.c);
      if (v.n === me().nick) { sEl.textContent = 'THAT\'S YOU! You were first through the door today. Gubbinz salutes you.'; }
    };
    let claimed = false;
    const check = () => {
      if (!window.Net || !Net.connected) return;
      const t = today(), key = `${t.m}-${t.d}`;
      Net.kv.get(['site.vod']).then(v => {
        const o = v['site.vod'] && typeof v['site.vod'] === 'object' ? v['site.vod'] : {};
        if (o.d !== key && !claimed) { claimed = true; Net.kv.put('site.vod', 'd', key); Net.kv.put('site.vod', 'n', me().nick); Net.kv.put('site.vod', 'c', me().col || '#2a7ad8'); render({ n: me().nick, c: me().col }); secret('site.vod'); toast('Visitor of the Day!', 'You\'re the first person on the site today. Your name is on the home page!', 6000); }
        else render(o);
      });
    };
    if (window.Net) { Net.on('welcome', () => setTimeout(check, 800)); Net.kv.watch('site.vod', ev => { if (ev.type === 'put' && ev.f === 'n') Net.kv.get(['site.vod']).then(v => render(v['site.vod'])); }); }
    // the letter reward
    if (window.Net) Net.on('gbOk', () => { if (!store.get('jhp_site_letter', false)) { store.set('jhp_site_letter', true); secret('site.letter'); setTimeout(() => toast('Thanks for writing!', 'You\'ve unlocked MEMBER.TXT, your official reader card, on the Downloads page.', 7000), 1500); } });
    // "best viewed with" strip in the footer
    const foot = document.querySelector('.pagefoot');
    if (foot) {
      const bv = h('div', 'bestviewed', '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="#2a7ad8" stroke="#003a80"/><path d="M2.5 6.5c3.5-1.5 7.5-1.5 11 0M2.5 9.5c3.5 1.5 7.5 1.5 11 0M8 1.5v13" stroke="#9fd0ff" fill="none" stroke-width=".8"/><ellipse cx="8" cy="8" rx="8" ry="3" fill="none" stroke="#ffd400" stroke-width="1" transform="rotate(-20 8 8)"/></svg><span>This site is best viewed with <b>JackNet Explorer 5</b> at 800x600 in High Colour. If it looks wrong, that\'s your browser\'s fault, not mine.</span><span class="small">You are using: <b id="bvUA">JackNet Explorer 5.0</b></span>');
      foot.insertBefore(bv, foot.firstChild);
    }
    // letters: a letter from Dave
    const lk = document.querySelector('#s-letters .kicker');
    if (lk) {
      const dl = h('div', 'letter', '<div class="lh"><span>Dave, from down the road<span class="starbadge">LETTER OF THE ISSUE</span></span><span>this issue</span></div><div class="lb">dear jack. your site is ok but my cousin says the new star wars has a bit where the baddie has a lightsaber with 2 ends and you didnt put that on. also oddjob is allowed. also i have beat your jacktris score (i havent but i will). from dave. ps my cousin works at nintendo</div><div class="ed"><b>JACK SAYS:</b> Dave. There is a WHOLE PAGE about the lightsaber with two ends now. Click Star Wars. Oddjob is NOT allowed and never will be. And your cousin does not work at Nintendo, he works at the garden centre, I\'ve seen him.</div>');
      lk.parentNode.insertBefore(dl, lk.nextSibling);
    }
  })();

  // ================================================================ ARCADE: hall of fame, "now playing" badges and live ghosts (via Net.relay)
  (function arcade() {
    const NAMES = { snake: 'SNAKE', sweep: 'JACK SWEEPER', bricks: 'BRICK BASH', invaders: 'SAUCER INVADERS', rocks: 'SPACE ROCKS', pong: 'JACK PONG', whack: 'WHACK-A-ROBOT', simon: 'SIMON SAYS', hangman: 'SAVE THE ASTRONAUT', tris: 'JACKTRIS', squig: 'BLOBBIT LOB' };
    const FMT = { squig: s => (s / 10).toFixed(1) + 'm', sweep: s => s + ' sec', pong: s => s + ' pts', simon: s => s + ' rounds', hangman: s => s + ' words' };
    const grid = document.querySelector('#s-demos .gamegrid'); if (!grid) return;
    const mq = document.createElement('marquee'); mq.className = 'hallfame'; mq.setAttribute('scrollamount', '3'); mq.setAttribute('aria-label', 'Hall of fame'); mq.textContent = 'HALL OF FAME: loading...';
    grid.parentNode.insertBefore(mq, grid);
    let scores = {};
    const renderHof = () => {
      const bits = Object.keys(NAMES).filter(k => scores[k] && scores[k][0]).map(k => `${NAMES[k]}: <b>${esc(scores[k][0].n)}</b> ${(FMT[k] || (s => s))(scores[k][0].s)}`);
      mq.innerHTML = '&#9733; HALL OF FAME &#9733; ' + (bits.length ? bits.join(' &nbsp;&#9733;&nbsp; ') : 'no records yet, get playing!') + ' &nbsp;&#9733;&nbsp; records are LIVE and shared with everyone on the site';
    };
    if (window.Net) { Net.on('welcome', m => { scores = m.scores || {}; renderHof(); }); Net.on('scores', m => { scores[m.g] = m.list; renderHof(); }); }
    // now playing
    const np = new Map(); // fromId -> {g, st, nick, col, t}
    const side = document.querySelector('#s-demos .arcside');
    const npBox = h('div', 'arcnp', ''); npBox.style.cssText = 'font:12px var(--ui);margin:0 0 6px;min-height:16px';
    if (side) side.insertBefore(npBox, side.firstChild);
    const VALID = new Set(Object.keys(NAMES));
    if (window.Net) Net.onRelay('site.arc', (d, m) => {
      if (!d || typeof d !== 'object' || !VALID.has(d.g)) return;
      if (d.over) { np.delete(m.fromId); if (typeof d.sc === 'number' && d.sc > 0 && window.IE && IE.current === 'demos') toast('Arcade', `${m.from} just scored ${(FMT[d.g] || (s => s))(Math.floor(d.sc))} on ${NAMES[d.g]}.`, 3000); render(); return; }
      const st = d.st && typeof d.st === 'object' ? { sc: typeof d.st.sc === 'number' ? Math.max(0, Math.floor(d.st.sc)) : null, b: typeof d.st.b === 'string' && d.st.b.length <= 600 ? d.st.b : '' } : null;
      np.set(m.fromId, { g: d.g, st, nick: String(m.from).slice(0, 16), col: String(m.col || '#fff').slice(0, 9), t: performance.now() });
      render();
    });
    function render() {
      document.querySelectorAll('.gtile .nowp').forEach(e => e.remove());
      const byGame = {};
      for (const o of np.values()) (byGame[o.g] = byGame[o.g] || []).push(o);
      for (const g in byGame) { const tile = document.querySelector(`.gtile[data-arcade="${g}"],.gtile[data-demo="${g}"]`); if (tile) { const t = h('span', 'nowp', esc(byGame[g].map(o => o.nick).join(', ') + ' playing!')); tile.appendChild(t); } }
      const cur = window.Arcade ? Arcade.current : '';
      const here = (byGame[cur] || []);
      npBox.innerHTML = here.length ? '<b>Now playing:</b> ' + here.map(o => `<span style="color:${esc(o.col)}">\u25CF</span> ${esc(o.nick)}${o.st && o.st.sc != null ? ` (${(FMT[cur] || (s => s))(o.st.sc)})` : ''}`).join(', ') + ' <span class="live">LIVE</span>' : '';
    }
    setInterval(() => { const now = performance.now(); let changed = false; for (const [id, o] of np) if (now - o.t > 6000) { np.delete(id); changed = true; } if (changed) render(); }, 1500); // (pings come every 0.7-2.5 s, through the Zone's rate-limited relay: arcade.js)
    window.SiteArcade = { list: g => [...np.values()].filter(o => o.g === g), names: NAMES };
  })();

  // ================================================================ keep the online list handy (for "say hi" on the pen pals board)
  if (window.Net) Net.on('online', m => { window.SiteOnline = m.online || []; });

  // ================================================================ THE HANGOUT (lazy: js/site-hangout.js)
  BUILD.hangout = () => data().then(() => (A ? A.load('js/site-hangout.js') : null));
  if (window.Sound && Sound.addTune) {
    Sound.addTune('site_spacebar', { step: 0.14, hats: true, // an original swingy little bar tune
      lead: [69, 0, 72, 74, 76, -1, 74, 72, 74, 0, 77, 76, 74, -1, 72, 0, 69, 0, 72, 74, 76, -1, 79, 76, 74, -1, -1, 72, 69, -1, 0, 0, 81, 0, 79, 77, 76, -1, 74, 72, 74, 0, 76, 77, 79, -1, 76, 0, 72, 74, 76, 74, 72, -1, 71, 72, 69, -1, -1, -1, 0, 0, 0, 0],
      bass: [45, 52, 45, 52, 50, 57, 50, 57, 45, 52, 45, 52, 52, 59, 52, 59, 45, 52, 45, 52, 50, 57, 50, 57, 52, 59, 52, 59, 45, 52, 45, 45] });
    Sound.addTune('site_orkmarch', { step: 0.17, hats: false, // stomp stomp WAAAGH
      lead: [57, 0, 57, 0, 60, -1, 57, 0, 55, 0, 55, 0, 57, -1, -1, 0, 57, 0, 57, 0, 64, -1, 62, 0, 60, 0, 59, 0, 57, -1, -1, 0],
      bass: [33, 33, 40, 40, 31, 31, 33, 33, 33, 33, 40, 40, 36, 35, 33, 33] });
  }

  // ================================================================ build the page that's already open (if any)
  if (window.IE && IE.current) onSection(IE.current);
})();

/* ============================================================================================================
 * JackNet on the WEB: member login page (login.cgi), the member bar on every page, the "pick your name" prompt,
 * the What's Happening feed, chat extras, and the LOCAL "Log Off Jack" (the PC's user is always Jack).
 * ============================================================================================================ */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const me = () => (window.Net && Net.me) || { nick: '?' };
  const go = sec => { const b = $('browser'); if (b) b.classList.remove('min'); if (window.IE) IE.go(sec, 'click'); };
  const sfx = n => window.Sound && Sound.play(n);
  const toast = (t, m, ms) => window.Desk && Desk.toast(t, m, ms);
  const NICK_RULE = /^[A-Za-z0-9_\-]{3,16}$/;

  // ---------------------------------------------------------------- the member bar at the top of every page
  const bar = h('div', 'memberbar'); bar.id = 'memberBar'; bar.setAttribute('role', 'navigation'); bar.setAttribute('aria-label', 'JackNet member bar');
  const pane = $('pane'); if (pane) pane.insertBefore(bar, pane.firstChild);
  function renderBar() {
    const m = me();
    bar.innerHTML = m.member
      ? `<span class="mbwho"><span class="mbstar">★</span> Logged on to JackNet as <b>${esc(m.nick)}</b> <small>member #${esc(m.no || '?')}</small></span><span class="mblinks">[<a href="#" data-profile="${esc(m.nick)}">My Profile</a>] [<a href="#" data-myprofile>Edit profile</a>] [<a href="#" data-jlogoff>Log off</a>]</span>`
      : `<span class="mbwho">You're a guest: <b>${esc(m.nick || 'Guest')}</b></span><span class="mblinks">[<a href="#" data-jlogon>Log on</a> / <a href="#" data-jlogon class="mbjoin">Join FREE!</a>]</span>`;
    renderPrompt(); renderLoginPage();
    const lbl = $('smLogoffLbl'); if (lbl) lbl.textContent = `Log Off ${m.nick || 'Guest'}...`;
  }
  // [Log on] and [Log off] anywhere on the website open the JackNet logon (a desktop thing)
  document.addEventListener('click', ev => {
    const a = ev.target.closest('[data-jlogon],[data-jlogoff]'); if (!a) return; ev.preventDefault();
    if (a.hasAttribute('data-jlogoff')) JackLogon.logoff(); else JackLogon.show();
  });
  document.addEventListener('jacknet-who', renderBar);
  if (window.Net) { Net.on('welcome', () => setTimeout(renderBar, 0)); Net.on('you', () => setTimeout(renderBar, 0)); }

  // ---------------------------------------------------------------- login.cgi: a web page that explains JackNet (logging on itself is the JackOS logon screen)
  const lb = $('loginBody');
  function renderLoginPage() {
    if (!lb) return;
    const m = me();
    lb.innerHTML = `<p class="kicker">JackNet is the club for readers of JACK ATTACK! Online. Your JackNet name works everywhere: the chat, the Hangout, the forums, high score tables and every JackNet site. It's FREE. It will always be free. Mom says so.</p>
      <table class="webtable"><tr><th>${m.member ? 'YOU\'RE LOGGED ON!' : 'HOW TO LOG ON (OR JOIN)'}</th></tr><tr><td>${m.member
        ? `<p>You're logged on to JackNet as <b>${esc(m.nick)}</b>, member <b>#${esc(m.no || '?')}</b>.</p><p class="webbtns"><a href="#" class="webbtn" data-profile="${esc(m.nick)}">My Profile</a> <a href="#" class="webbtn" data-myprofile>Edit my profile</a> <a href="#" class="webbtn" data-go="hangout">Go to the Hangout</a> <a href="#" class="webbtn" data-jlogoff>Log off</a></p>`
        : `<p>You log on to JackNet when you switch the computer on: the <b>"Welcome to JackNet"</b> box asks for your name and password. Right now you're a guest called <b>${esc(m.nick)}</b>.</p><p><b>Not a member? JOIN JACKNET - it's FREE!!!</b> Just type a new name and a password into the logon box. That's it, you're signed up.</p><p class="webbtns"><a href="#" class="webbtn" data-jlogon>Log on / Join now</a></p>`}</td></tr></table>
      <ul class="nickrules"><li>Names are <b>3 to 16</b> letters, numbers, <b>_</b> or <b>-</b>. No spaces.</li><li>Keep it clean. Mom reads this site.</li><li>No real names, please. Be <i>Squirtle99</i>, not your actual name.</li><li>Passwords: at least 4 characters. Write it down. There's no "forgot my password" button, I haven't worked out how to do one.</li><li>Once a name is taken, it's taken. Forever. (Or until the Millennium Bug.)</li><li>Don't want to? Log on as a <b>Guest</b>. You can still do nearly everything.</li></ul>`;
  }
  window.SiteLogin = { error(msg) { return JackLogon.error(msg); }, ok(m) { JackLogon.ok(m); happen(m.isNew ? 'join' : 'login'); store.set('jhp_site_prompted', true); renderBar(); } };


  // ---------------------------------------------------------------- first-timers (and ?noboot visitors): a friendly web box on the home page, not a popup
  const prompt = h('div', 'pickname'); prompt.hidden = true;
  const edCopy = document.querySelector('#s-home .ed'); if (edCopy) edCopy.parentNode.insertBefore(prompt, edCopy.nextSibling);
  function renderPrompt() {
    const show = !me().member && !store.get('jhp_site_prompted', false) && !!(window.Net && Net.me && Net.me.nick);
    prompt.hidden = !show; if (!show) return;
    prompt.innerHTML = `<div class="pnhead">NEW HERE? PICK YOUR JACKNET NAME!</div><div class="pnform"><span>Right now you're <b>${esc(me().nick)}</b>, which is a bit boring. Pick a name and a password and you're a member (it's free, and it works all over JackNet).</span><a href="#" class="webbtn" data-jlogon>Pick my name!</a> <a href="#" class="pnno">No thanks, I'll stay a guest</a></div>`;
    prompt.querySelector('.pnno').addEventListener('click', ev => { ev.preventDefault(); store.set('jhp_site_prompted', true); prompt.hidden = true; });
  }

  // ---------------------------------------------------------------- WHAT'S HAPPENING: a shared, persistent feed (each visitor posts only their own news)
  // entry text = "kind|a|b" (rendered and escaped here; the server adds who and when)
  const KINDS = {
    join: (e) => `<b>${esc(e.by)}</b> joined JackNet! Say hello.`,
    login: (e) => `<b>${esc(e.by)}</b> logged in`,
    hs: (e, a, b) => `<b>${esc(e.by)}</b> set a high score on <b>${esc(a)}</b>: ${esc(b)}`,
    hang: (e, a) => `<b>${esc(e.by)}</b> walked into the Hangout${a ? ` (${esc(a)})` : ''}`,
    letter: (e) => `<b>${esc(e.by)}</b> wrote a letter to Jack`,
    post: (e, a) => `<b>${esc(e.by)}</b> posted on the forums: "${esc(a)}"`,
    art: (e) => `<b>${esc(e.by)}</b> is drawing on the Art Wall`,
    cube: (e) => `<b>${esc(e.by)}</b> SOLVED the MegaCube!!!`,
    quiz: (e, a) => `<b>${esc(e.by)}</b> scored ${esc(a)} on the Nerd Quiz`,
    pen: (e) => `<b>${esc(e.by)}</b> pinned a note on the Pen Pals board`,
    juke: (e, a) => `<b>${esc(e.by)}</b> put <i>${esc(a)}</i> on the Hangout jukebox`,
    triv: (e, a) => `<b>${esc(e.by)}</b> won a point in Gubbinz's Hangout trivia`,
    waaagh: (e) => `<b>${esc(e.by)}</b> called a WAAAGH!`,
  };
  const ICONS = { join: '★', login: '▶', hs: '♛', hang: '☺', letter: '✉', post: '✎', art: '✏', cube: '▣', quiz: '?', pen: '⌖', juke: '♫', triv: '!', waaagh: '!' };
  let feedList = [];
  const lastHappen = {};
  function happen(kind, a, b) {
    if (!window.Net || !KINDS[kind]) return;
    const now = Date.now(), gap = { art: 600000, hang: 300000, login: 600000 }[kind] || 15000;
    if (now - (lastHappen[kind] || 0) < gap) return; lastHappen[kind] = now;
    Net.kv.push('site.happening', [kind, a || '', b || ''].map(x => String(x).replace(/\|/g, '/')).join('|').slice(0, 200));
  }
  window.SiteHappen = happen;
  const box = h('div', 'win applet cgi happening'); box.id = 'happeningBox';
  box.innerHTML = `<div class="tb"><span class="t">WHAT'S HAPPENING <small>happening.cgi</small> <span class="live">LIVE</span></span></div><div class="body"><ul class="hplist"><li>Loading...</li></ul><p class="hpfoot"><span id="hpOnline"></span> &middot; <a href="#" data-go="hangout">Come to the Hangout &raquo;</a></p></div>`;
  const vod = $('vodBox') || $('countdowns'); if (vod) vod.parentNode.insertBefore(box, vod);
  const ago = ts => { const s = Math.max(0, (Date.now() - ts) / 1000); if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + 'm ago'; if (s < 86400) return Math.round(s / 3600) + 'h ago'; return Math.round(s / 86400) + 'd ago'; };
  function renderFeed() {
    const ul = box.querySelector('.hplist');
    const rows = feedList.slice().reverse().filter(e => { const k = String(e.text).split('|')[0]; return KINDS[k]; }).slice(0, 10);
    ul.innerHTML = rows.length ? rows.map(e => { const [k, a, b] = String(e.text).split('|'); return `<li><span class="hpi">${ICONS[k] || '*'}</span><span class="hpt">${KINDS[k](e, a, b)}</span><span class="hpa">${ago(e.ts)}</span></li>`; }).join('') : '<li>Nothing yet today. Be the first to do something!</li>';
  }
  if (window.Net) {
    Net.on('welcome', () => Net.kv.get(['site.happening']).then(v => { feedList = Array.isArray(v['site.happening']) ? v['site.happening'] : []; renderFeed(); }));
    Net.kv.watch('site.happening', ev => { if (ev.type === 'push') { feedList.push(ev.e); if (feedList.length > 40) feedList.shift(); renderFeed(); } });
    setInterval(renderFeed, 60000);
    Net.on('online', m => { const n = (m.online || []).length, hg = (m.online || []).filter(o => o.where === 'hangout').length; const el = $('hpOnline'); if (el) el.textContent = `${n} on the site, ${hg} in the Hangout`; });
    // my own news, as it happens
    Net.on('scores', m => { const top = m.list && m.list[0]; const mine = store.get('jhp_initials', ''); try { const ini = localStorage.getItem('jhp_initials'); if (top && ini && top.n === ini && Date.now() - (top.ts || 0) < 8000) happen('hs', (window.SiteArcade && SiteArcade.names[m.g]) || m.g.toUpperCase(), m.g === 'squig' ? (top.s / 10).toFixed(1) + 'm' : top.s); } catch (e) {} });
    Net.on('gbOk', () => happen('letter'));
    Net.on('fPosted', m => happen('post', (m.title || 'a new post').slice(0, 60)));
    Net.on('cubeSolved', m => { if (m.by === me().nick) happen('cube'); });
    Net.on('WAAAGH', m => { if (m.by === me().nick) happen('waaagh'); });
    Net.kv.watch('site.penpals', ev => { if (ev.type === 'push' && ev.e.by === me().nick) happen('pen'); });
    Net.kv.watch('site.quiz.hof', ev => { if (ev.type === 'put' && ev.by === me().nick) happen('quiz', String(ev.v).split('|')[0]); });
    const wall = $('wall'); if (wall) wall.addEventListener('pointerup', () => happen('art'));
  }

  // ---------------------------------------------------------------- chat extras: /away, /back, /help, emotes (shared by the Chat Room and the Hangout)
  const EMOTES = { wave: 'waves', dance: 'busts out some moves', sit: 'sits down', waaagh: 'shouts WAAAGH!!!', jump: 'jumps up and down', laugh: 'laughs', bow: 'bows', shrug: 'shrugs' };
  let away = '';
  window.SiteChat = {
    get away() { return away; },
    command(text) {
      const m = /^\/(\w+)\s*(.*)$/.exec(text); if (!m) return false;
      const cmd = m[1].toLowerCase(), rest = m[2].trim().slice(0, 100);
      if (cmd === 'away') { away = rest || 'away from keyboard'; Net.send({ t: 'chat', text: `is away (${away})`, me: true }); if (window.Hangout) Hangout.setAway(away); return true; }
      if (cmd === 'back') { if (away) Net.send({ t: 'chat', text: 'is back!', me: true }); away = ''; if (window.Hangout) Hangout.setAway(''); return true; }
      if (cmd === 'help') { toast('Chat commands', '/me does a thing  /away reason  /back  /wave /dance /sit /jump /laugh /bow /shrug /waaagh  /nick (log in)', 9000); return true; }
      if (EMOTES[cmd]) { Net.send({ t: 'chat', text: EMOTES[cmd] + (rest ? ' ' + rest : ''), me: true }); if (window.Hangout) Hangout.emote(cmd); return true; }
      return false;
    },
    EMOTES,
  };
  // typing anything brings you back from /away
  document.addEventListener('submit', ev => { if (away && ev.target && (ev.target.id === 'chatForm' || ev.target.id === 'hgForm')) { const inp = ev.target.querySelector('input'); if (inp && !/^\/away/i.test(inp.value)) { away = ''; if (window.Hangout) Hangout.setAway(''); } } }, true);

  // ---------------------------------------------------------------- THE JACKNET LOGON: full-screen JackOS 98 network logon. At boot (after the splash),
  // from Start > Log Off, and from the website's [Log on] links. Auto-logs-on with a saved token; Cancel = guest.
  const KEYS = window.JICON ? JICON.get('keys', 48) : '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><circle cx="16" cy="18" r="9" fill="#ffd400" stroke="#000"/><circle cx="14" cy="16" r="3" fill="#fff" stroke="#000"/><path d="M23 22l18 14-3 3-2-2-2 2-2-2-2 2-10-8" fill="#ffd400" stroke="#000"/><circle cx="30" cy="16" r="7" fill="#c0c0c0" stroke="#000"/><path d="M35 20l8 10-2 2-8-9" fill="#c0c0c0" stroke="#000"/></svg>';
  let ov = null, resolveLogon = null;
  const hasToken = () => { try { return !!localStorage.getItem('jhp_token'); } catch (e) { return false; } };
  const connected = () => window.Net && Net.connected && Net.me && Net.me.id;
  function overlay() { if (!ov) { ov = h('div', 'jlogoff logon'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Welcome to JackNet'); DesktopSurface.root().appendChild(ov); } return ov; }
  let atBoot = false; // the logon at switch-on (vs. [Log on] links and the members-only box later)
  function finish(guest) {
    if (!me().member) return; // logging on is mandatory; Escape/Cancel cannot become a guest
    const o = ov; ov = null; pend = false;
    if (o) { o.classList.add('jlbye'); setTimeout(() => o.remove(), 380); }
    atBoot = false;
    const r = resolveLogon; resolveLogon = null; if (r) setTimeout(r, o ? 300 : 0);
  }
  function lbox(inner) { overlay().innerHTML = `<form class="jlbox" autocomplete="on"><div class="jltb"><span>Welcome to JackNet</span><button type="button" class="jlhelp" aria-label="Help">?</button></div><div class="jlbody">${KEYS}${inner}</div></form>`; ov.querySelector('.jlhelp').addEventListener('click', () => { const hp = ov && ov.querySelector('.jlhint'); if (hp) { hp.innerHTML = '<b>Log on:</b> type your account name and password.<br><b>New?</b> Choose Create Account. A JackNet account is required to play.'; hp.style.color = '#000'; } sfx('click'); }); return ov.querySelector('form'); }
  function form(note) {
    const f = lbox(`<div class="jlmain"><p>Type a user name and password to log on to JackNet.</p>
      <div class="jlrow"><label for="jlUser"><u>U</u>ser name:</label><input id="jlUser" type="text" maxlength="16" autocomplete="username" value="${esc(me().member ? me().nick : store.get('jhp_site_lastnick', ''))}"></div>
      <div class="jlrow"><label for="jlPass"><u>P</u>assword:</label><input id="jlPass" type="password" maxlength="64" autocomplete="current-password"></div>
      <p class="jlhint">An account is required to play. New here? Choose Create Account.</p><p class="jlerr" role="alert">${esc(note || '')}</p></div>
      <div class="jlbtns"><button class="btn" type="submit">Log On</button><button class="btn" type="button" data-create>Create Account</button></div>`);
    setTimeout(() => { const u = $('jlUser'); (u && u.value ? $('jlPass') : u).focus(); }, 60);
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const name = $('jlUser').value.trim(), pass = $('jlPass').value, err = f.querySelector('.jlerr');
      if (!NICK_RULE.test(name)) { err.textContent = 'User names are 3 to 16 letters, numbers, _ or - (no spaces).'; sfx('uhoh'); return; }
      if (pass.length < 4) { err.textContent = 'Passwords are at least 4 characters.'; sfx('uhoh'); return; }
      if (!window.Net || !Net.send({ t: 'login', name, pass, signup:false })) { err.textContent = 'Can\'t reach JackNet (is somebody on the phone?). Reconnect and try again.'; return; }
      store.set('jhp_site_lastnick', name);
      err.style.color = '#000'; err.textContent = 'Verifying user name and password...'; f.querySelectorAll('button').forEach(b => { b.disabled = true; }); pend = true;
    });
    f.querySelector('[data-create]').addEventListener('click',()=>window.AccountGate&&AccountGate.show());
    f.addEventListener('keydown', ev => { if (ev.key === 'Escape') ev.preventDefault(); });
  }
  let pend = false;
  function auto() { // a saved logon that the server accepted: show it, then carry on by itself
    lbox(`<div class="jlmain"><p>Type a user name and password to log on to JackNet.</p><div class="jlrow"><label><u>U</u>ser name:</label><input type="text" value="${esc(me().nick)}" readonly></div><div class="jlrow"><label><u>P</u>assword:</label><input type="password" value="********" readonly></div><p class="jlerr" style="color:#000">Logging on to JackNet as <b>${esc(me().nick)}</b>...</p></div><div class="jlbtns"><button class="btn" type="button" disabled>OK</button><button class="btn" type="button" disabled>Cancel</button></div>`);
    setTimeout(() => finish(false), 1300);
  }
  function waitNet(ms) { return new Promise(res => { const t0 = Date.now(); (function poll() { if (connected() || Date.now() - t0 > ms) return res(); setTimeout(poll, 100); })(); }); }
  window.JackLogon = {
    boot() { // called by boot.js after the splash, before the dial-up box
      return new Promise(res => {
        resolveLogon = res; atBoot = true;
        lbox('<div class="jlmain"><p>Please wait while JackOS finds JackNet...</p></div>');
        waitNet(7000).then(() => {
          if (!ov) return;
          if (connected() && me().member) auto();
          else form(!connected() ? 'Can\'t reach JackNet right now. Reconnect to log on.' : hasToken() ? 'Your saved logon didn\'t work. Type your name and password again.' : '');
        });
      });
    },
    show() { if (ov) return Promise.resolve(); return new Promise(res => { resolveLogon = res; form(''); }); },
    logoff() {
      const sm = $('startMenu'); if (sm) sm.classList.remove('open'); const sb = $('startBtn'); if (sb) sb.classList.remove('on');
      Desk.msgbox('Log Off JackOS', 'Are you sure you want to log off?', 'q', [['Yes', async () => {
        if (window.Sound && Sound.music) Sound.music.stop();
        overlay().innerHTML = '<div class="jlsave">Saving your settings...</div>'; sfx('shutdown');
        const t0 = Date.now();
        try { if (window.Roam && me().member) await Roam.logoff(); } catch (e) {} // members: upload their roaming profile, give the PC back to the guest
        if (me().member) Net.send({ t: 'logoff', token: Net.store.get('jhp_token') });
        try { sessionStorage.setItem('jhp_site_relogon', '1'); } catch (e) {}
        setTimeout(() => location.reload(), Math.max(300, 1500 - (Date.now() - t0))); // a clean desktop, then the logon screen again
      }], ['No']]);
    },
    error(msg) { if (!ov || !pend) return false; pend = false; const f = ov.querySelector('form'), err = f && f.querySelector('.jlerr'); if (err) { err.style.color = ''; err.textContent = msg; } if (f) f.querySelectorAll('button').forEach(b => { b.disabled = false; }); sfx('uhoh'); return true; },
    ok(m) { if (ov && pend) finish(false); toast('JackNet', m.isNew ? `Welcome to JackNet, ${m.nick}! You're member #${m.no} of ${m.members}. That name is yours now. Don't forget your password!` : `Logged on to JackNet as ${m.nick}. Welcome back!`, 6000); },
    get open() { return !!ov; },
  };
  const lo = $('smLogoff'); if (lo) lo.addEventListener('click', () => JackLogon.logoff());
  // straight after a Log Off (the page reloads for a clean desktop): the logon screen comes back up
  let relogon = false; try { relogon = sessionStorage.getItem('jhp_site_relogon') === '1'; sessionStorage.removeItem('jhp_site_relogon'); } catch (e) {}
  if (relogon) JackLogon.boot().then(() => sfx('startup'));
  { const bt = $('boot'); if (relogon && bt) bt.remove(); }

  // (the Chat Room moved to JackIRC: the chat page is now a "we've moved" page, wired up by apps-social.js)


  renderBar();
})();
