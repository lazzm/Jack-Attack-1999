/* grind-rank: JACKNET RANK (your rank card + the level-up fanfare) and the NETIZEN HALL OF FAME (www.netizenhof.jnet).
 * XP comes from the server (mods/grind.js): 1 XP for every Rupee the server pays you, a bit more for everything that
 * pays, and a little for things past their daily cap (secrets, scores, posts, jobs, gems...). Levels 1-50. */
(function () {
  'use strict';
  if (window.GrindRank || !window.Grind) return;
  const A = Apps, C = window.GrindCat, esc = A.esc, RP = Grind.RP, fmt = Grind.fmt;
  const css = `
.grk{font:12px Tahoma,Verdana,sans-serif;padding:8px}
.grk-card{position:relative;display:grid;grid-template-columns:96px minmax(0,1fr);gap:10px;padding:10px;border:2px solid #000;border-radius:8px;background:linear-gradient(135deg,#0a1a6a,#2a4ac0 55%,#6a2ab0);color:#fff;box-shadow:inset 0 0 0 2px rgba(255,255,255,.25),3px 3px 0 rgba(0,0,0,.35);overflow:hidden}
.grk-card::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,transparent 0 30px,rgba(255,255,255,.05) 30px 60px);pointer-events:none}
.grk-lv{width:96px;height:96px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#fff6b0,#ffd400 45%,#c08a00);border:3px solid #6a4a00;box-shadow:0 0 0 3px #fff3,0 2px 6px #000a;color:#4a2a00;text-shadow:0 1px 0 #fff8}
.grk-lv b{font:bold 40px/1 Impact,'Arial Black',sans-serif}
.grk-lv small{font:bold 9px Verdana,sans-serif;letter-spacing:2px}
.grk-t{font:bold 20px/1.1 'Arial Black',Arial,sans-serif;color:#ffe680;text-shadow:2px 2px 0 #000;margin:2px 0 2px}
.grk-nm{font-size:11px;opacity:.9}
.grk-bar{position:relative;height:16px;margin:8px 0 3px;background:#000a;border:1px solid #fff8;border-radius:3px;overflow:hidden}
.grk-bar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#9fff7a,#2ab02a);box-shadow:inset 0 -3px 0 #0a6a0a}
.grk-bar span{position:absolute;inset:0;text-align:center;font:bold 10px/16px Verdana,sans-serif;color:#fff;text-shadow:1px 1px 0 #000}
.grk-sm{font-size:11px;opacity:.9}
.grk-cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin-top:8px}
.grk-list{height:190px;overflow:auto;padding:2px;background:#fff;font-size:11px}
.grk-list div{display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:4px;padding:1px 3px;align-items:center}
.grk-list div.me{background:#000080;color:#fff}
.grk-list div.got{color:#000}.grk-list div.no{color:#888}
.grk-list em{font-style:normal;font-size:10px;color:#9333d6}
.grk-list div.me em{color:#ffd0ff}
.grk-how{margin:0;padding-left:16px;line-height:1.5;font-size:11px}
/* the fanfare */
.grk-ding{position:fixed;left:50%;top:38%;z-index:99990;transform:translate(-50%,-50%);pointer-events:none;text-align:center;width:min(92vw,420px)}
.grk-ding .grk-burst{position:absolute;left:50%;top:50%;width:420px;height:420px;margin:-210px 0 0 -210px;background:repeating-conic-gradient(from 0deg,rgba(255,220,0,.55) 0 8deg,transparent 8deg 22deg);border-radius:50%;-webkit-mask:radial-gradient(circle,#000 20%,transparent 70%);mask:radial-gradient(circle,#000 20%,transparent 70%);animation:grkSpin 6s linear infinite}
.grk-ding .grk-box{position:relative;display:inline-block;padding:12px 20px 14px;background:linear-gradient(#fffbe0,#ffe680);border:3px solid #000;box-shadow:5px 5px 0 rgba(0,0,0,.4);animation:grkPop .6s cubic-bezier(.2,1.6,.4,1) both}
.grk-ding .grk-dg{font:bold 46px/1 Impact,'Arial Black',sans-serif;color:#e10600;text-shadow:3px 3px 0 #000,0 0 14px #fff;letter-spacing:2px}
.grk-ding .grk-lvn{font:bold 15px Verdana,sans-serif;color:#000080;margin-top:4px}
.grk-ding .grk-tt{font:bold 22px 'Arial Black',Arial,sans-serif;color:#5a1a8a}
.grk-ding .grk-rw{font:bold 12px Verdana,sans-serif;color:#0a5a1a;margin-top:6px}
.grk-ding .grk-star{position:absolute;width:14px;height:14px;background:#ffd400;clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);animation:grkStar 1.4s ease-out forwards}
.grk-ding.out{animation:grkOut .5s ease-in forwards}
@keyframes grkSpin{to{transform:rotate(360deg)}}
@keyframes grkPop{0%{transform:scale(.2) rotate(-8deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes grkStar{0%{transform:translate(0,0) scale(.4);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.1) rotate(200deg);opacity:0}}
@keyframes grkOut{to{opacity:0;transform:translate(-50%,-60%)}}
@media (prefers-reduced-motion:reduce){.grk-ding .grk-burst,.grk-ding .grk-box,.grk-ding .grk-star{animation:none}.grk-ding .grk-star{display:none}}
/* the Hall of Fame */
.hof{font:13px Georgia,'Times New Roman',serif;color:#2a1a00;background:#3a0a0a linear-gradient(90deg,#2a0505,#5a1010 50%,#2a0505);padding:10px;min-height:100%}
.hof-in{max-width:800px;margin:0 auto;background:#f8f0dc;border:6px double #b8902a;box-shadow:0 0 0 3px #3a0a0a,0 0 30px #000}
.hof-top{text-align:center;padding:14px 10px 10px;background:linear-gradient(#fff8e0,#e8d8a8);border-bottom:4px double #b8902a}
.hof-top h1{margin:0;font:bold 34px/1 Georgia,serif;letter-spacing:3px;color:#8a1a1a;text-shadow:1px 1px 0 #fff,2px 2px 0 #c8a040}
.hof-top .hof-sub{font:italic 13px Georgia,serif;color:#5a3a1a;margin-top:4px}
.hof-tro{display:flex;justify-content:center;gap:24px;margin-top:8px}
.hof-tabs{display:flex;justify-content:center;gap:4px;margin:10px 0 0}
.hof-tabs button{font:bold 12px Verdana,sans-serif;padding:4px 14px;border:2px outset #d8b860;background:#f0d890;cursor:pointer}
.hof-tabs button.on{background:#8a1a1a;color:#fff;border-style:inset}
.hof-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:12px}
.hof-t{background:#fff;border:1px solid #b8902a;box-shadow:2px 2px 0 #d8c8a0}
.hof-t h3{margin:0;padding:4px 8px;font:bold 13px Verdana,sans-serif;color:#fff;background:linear-gradient(#a02a2a,#6a0a0a);letter-spacing:1px}
.hof-t table{width:100%;border-collapse:collapse;font:12px Verdana,sans-serif}
.hof-t td{padding:3px 6px;border-bottom:1px dotted #d8c8a0}
.hof-t td:first-child{width:22px;text-align:center;font-weight:bold;color:#8a6000}
.hof-t tr:nth-child(1) td:first-child{color:#c89a00;font-size:15px}.hof-t tr:nth-child(2) td:first-child{color:#8a8a9a}.hof-t tr:nth-child(3) td:first-child{color:#a0602a}
.hof-t td:last-child{text-align:right;white-space:nowrap}
.hof-t .hof-none{padding:8px;font:italic 12px Georgia,serif;color:#8a7a5a}
.hof-t .ec-rp svg{vertical-align:-2px}
.hof-me{margin:0 12px;padding:6px 10px;background:#fffbe0;border:2px dashed #b8902a;font:12px Verdana,sans-serif}
.hof-foot{text-align:center;font:11px Verdana,sans-serif;color:#6a4a1a;padding:8px 10px 12px}
@media (max-width:620px){.hof-grid{grid-template-columns:minmax(0,1fr)}.hof-top h1{font-size:24px}.grk-cols{grid-template-columns:minmax(0,1fr)}.grk-card{grid-template-columns:72px minmax(0,1fr)}.grk-lv{width:72px;height:72px}.grk-lv b{font-size:30px}}
`;
  const st = document.createElement('style'); st.id = 'grindRankCss'; st.textContent = css; document.head.appendChild(st);
  const rpHtml = n => (window.Econ && Econ.rupees ? Econ.rupees(n, true) : esc(RP(n)));
  const lootName = id => { const it = window.LootCat && LootCat.ITEM[id]; return it ? it.name : id; };

  // ================================================================ the rank card
  let cardW = null;
  function card() {
    if (cardW && !cardW.closed) { cardW.restore(); return cardW; }
    const b = document.createElement('div'); b.className = 'grk';
    const w = cardW = A.win('JackNet Rank', b, { w: 470, icon: Grind.ICO.rank, noMax: true });
    const draw = () => {
      const me = Grind.me, mem = Grind.member;
      if (!mem) { b.innerHTML = `<div class="grk-card"><div class="grk-lv"><b>?</b><small>RANK</small></div><div><div class="grk-t">No rank yet</div><p class="grk-sm">JackNet Rank is for members. Every member gets a rank, from <b>Newbie</b> all the way up to <b>Lord of the JackNet</b> (level 50), by doing stuff on the JackNet: playing, posting, hunting gems, doing jobs.</p><p class="grk-sm">Joining is FREE: Start &gt; Log Off, then pick a name and a password.</p></div></div>${lists(0)}`; return; }
      if (!me) { b.innerHTML = '<p>Fetching your rank card from JackNet...</p>'; Grind.send({ t: 'grMe' }); return; }
      const lv = me.lv, span = Math.max(1, me.next - me.cur), k = me.next ? Math.min(1, (me.xp - me.cur) / span) : 1;
      b.innerHTML = `<div class="grk-card"><div class="grk-lv"><small>RANK</small><b>${lv}</b><small>of ${C.MAXLV}</small></div><div>
        <div class="grk-nm">JACKNET MEMBERS' CLUB &middot; RANK CARD &middot; ${esc((window.Net && Net.me && Net.me.nick) || '')}</div>
        <div class="grk-t">${esc(C.TITLES[lv])}</div>
        <div class="grk-bar"><i style="width:${(k * 100).toFixed(1)}%"></i><span>${me.next ? `${fmt(me.xp - me.cur)} / ${fmt(span)} XP` : 'MAXIMUM RANK!'}</span></div>
        <div class="grk-sm">${me.next ? `Next: <b>Rank ${lv + 1}, ${esc(C.TITLES[lv + 1])}</b> (+${esc(RP(C.levelReward(lv + 1)))})` : 'You have done EVERYTHING. Go outside? (No, stay.)'}<br>Total XP: ${fmt(me.xp)} &middot; Gems found: ${fmt(me.finds)}</div>
      </div></div>${lists(lv)}`;
    };
    function lists(lv) {
      const ms = {}; for (const [l, id] of C.RANK_LOOT) ms[l] = id;
      return `<div class="grk-cols"><div><b>The ranks</b><div class="grk-list field">${C.TITLES.slice(1).map((t, i) => { const l = i + 1; return `<div class="${l === lv ? 'me' : l < lv ? 'got' : 'no'}"><span>${l}</span><span>${esc(t)}${ms[l] ? `<br><em>&#9733; ${esc(lootName(ms[l]))}</em>` : ''}</span><span>${l > 1 ? '+' + C.levelReward(l) : ''}</span></div>`; }).join('')}</div></div>
        <div><b>How to earn XP</b><ul class="grk-how"><li>Every Rupee the JackNet pays you = 1 XP, plus 3 XP for each thing that pays.</li><li>Find gems in <b>The Great Rupee Hunt</b>.</li><li>Do jobs on <b>Mom's Chore List</b> and the <b>Odd Jobz Board</b>.</li><li>High scores, forum posts, secrets, Solitaire, Daily Missions, the Daily Parcel...</li><li>Even things past their daily limit still give a little XP.</li><li>Level up = Rupees, and special <b>JackLoot</b> things at ranks 5, 10, 15, 20, 25, 30, 40 and 50 that you can't get any other way.</li></ul>
        <p style="margin:6px 0 0"><button class="btn" data-hof>Hall of Fame...</button></p></div></div>`;
    }
    draw();
    b.addEventListener('click', ev => { if (ev.target.closest('[data-hof]')) Grind.go('http://www.netizenhof.jnet/'); });
    const off = Grind.on('me', () => { if (w.closed) return off(); draw(); });
    Grind.send({ t: 'grMe' });
    A.secret('grind.rank');
    return w;
  }

  // ================================================================ DING! the level-up fanfare
  function fanfare(m) {
    A.secret('grind.levelup');
    const d = document.createElement('div'); d.className = 'grk-ding'; d.setAttribute('role', 'status');
    const items = (m.items || []).map(lootName);
    d.innerHTML = `<div class="grk-burst"></div><div class="grk-box"><div class="grk-dg">LEVEL UP!</div><div class="grk-lvn">JackNet Rank ${m.lv}</div><div class="grk-tt">${esc(C.TITLES[m.lv] || '')}</div>${m.rw ? `<div class="grk-rw">+${esc(RP(m.rw))}${items.length ? ' and ' + items.map(esc).join(', ') + '!' : ''}</div>` : ''}</div>`;
    for (let i = 0; i < 16; i++) { const s = document.createElement('i'); s.className = 'grk-star'; const a = i / 16 * Math.PI * 2; s.style.left = '50%'; s.style.top = '50%'; s.style.setProperty('--dx', Math.cos(a) * (120 + Math.random() * 60) + 'px'); s.style.setProperty('--dy', Math.sin(a) * (90 + Math.random() * 50) + 'px'); s.style.animationDelay = (Math.random() * 0.2) + 's'; s.style.background = ['#ffd400', '#ff3a9a', '#3ad0ff', '#7aff5a'][i % 4]; d.appendChild(s); }
    DesktopSurface.root().appendChild(d);
    if (window.Sound && Sound.on && Sound.note) { // a little original fanfare
      [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3], [784, 0.45], [1047, 0.55], [1319, 0.7]].forEach(([f, at]) => setTimeout(() => Sound.note(f, at >= 0.7 ? 0.35 : 0.12, 'square'), at * 1000));
    }
    setTimeout(() => d.classList.add('out'), 3600); setTimeout(() => d.remove(), 4200);
    Desk.toast(`JackNet Rank ${m.lv}: ${C.TITLES[m.lv] || ''}`, `${m.rw ? '+' + RP(m.rw) + '. ' : ''}${items.length ? 'Unlocked: ' + items.join(', ') + ' (in your Treasure Chest). ' : ''}Start > Programs > Rupees & Rank > JackNet Rank`, 8000);
    if (cardW && !cardW.closed) Grind.emit('me', Grind.me);
  }

  // ================================================================ the Hall of Fame (www.netizenhof.jnet)
  const GAMES = { tris: ['Jacktris', s => fmt(s)], squig: ['Blobbit Lob', s => (s / 10) + ' m'], snake: ['Snake', fmt], sweep: ['Jack Sweeper', s => s + ' sec'], bricks: ['Brick Bash', fmt], invaders: ['Saucer Invaders', fmt], rocks: ['Space Rocks', fmt], pong: ['Jack Pong', fmt], whack: ['Whack-a-Robot', fmt], simon: ['Simon Says', fmt], hangman: ['Save the Astronaut', fmt] };
  let hofEl = null, data = null, tab = 'wk';
  Grind.on('grHof', m => { data = m; if (hofEl && hofEl.isConnected) render(); });
  const who = n => `<a href="#" class="plink" data-profile="${esc(n)}">${esc(n)}</a>`;
  const table = (title, rows, val) => `<div class="hof-t"><h3>${esc(title)}</h3>${rows && rows.length ? `<table>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${who(r.n)}</td><td>${val(r)}</td></tr>`).join('')}</table>` : '<div class="hof-none">Nobody yet. It could be you!</div>'}</div>`;
  function render() {
    const el = hofEl; if (!el) return;
    el.className = 'gr-page hof';
    const D = data, X = D ? D[tab] : null, me = D && D.me;
    const trophy = `<svg viewBox="0 0 32 32" width="34" height="34">${(Grind.ICO.hof || '').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>`;
    let grid = '<p style="padding:20px">Polishing the trophies...</p>';
    if (X) {
      const jobs = Object.keys(C.JOBS), sc = X.sc || {};
      grid = `<div class="hof-grid">
        ${table(tab === 'wk' ? 'Most Rupees earned this week' : 'Most Rupees earned ever', X.e, r => rpHtml(r.v))}
        ${table(tab === 'wk' ? 'Top gem hunters this week' : 'Top gem hunters of all time', X.g, r => `${fmt(r.v)} gem${r.v === 1 ? '' : 's'}`)}
        ${tab === 'all' ? table('Highest JackNet Rank', X.xp, r => `Rank ${r.lv} <small>(${fmt(r.v)} XP)</small>`) : ''}
        <div class="hof-t"><h3>${tab === 'wk' ? 'Pocket Money: best this week' : 'Pocket Money: best ever'}</h3><table>${jobs.map(j => { const r = X.jb && X.jb[j] && X.jb[j][0]; return `<tr><td>&#9733;</td><td>${esc(C.JOBS[j].n)}</td><td>${r ? `${who(r.n)} ${fmt(r.v)} <small>${esc(C.JOBS[j].unit)}</small>` : '<i>nobody yet</i>'}</td></tr>`; }).join('')}</table></div>
        <div class="hof-t"><h3>${tab === 'wk' ? 'Arcade: best by a member this week' : 'Arcade: the all-time records'}</h3>${Object.keys(GAMES).some(g => sc[g]) ? `<table>${Object.keys(GAMES).filter(g => sc[g]).map(g => `<tr><td>&#9733;</td><td>${esc(GAMES[g][0])}</td><td>${tab === 'wk' ? who(sc[g].n) : `<b>${esc(sc[g].n)}</b>`} ${esc(GAMES[g][1](sc[g].s))}</td></tr>`).join('')}</table>` : '<div class="hof-none">No scores yet. Get to the Games Arcade!</div>'}</div>
      </div>`;
    }
    el.innerHTML = `<div class="hof-in"><div class="hof-top"><div class="hof-tro">${trophy}<h1>THE NETIZEN<br>HALL OF FAME</h1>${trophy}</div><div class="hof-sub">${D ? esc(D.label) : '1999'} &middot; the finest Netizens of the JackNet</div>
      <div class="hof-tabs"><button data-tab="wk" class="${tab === 'wk' ? 'on' : ''}">This Week</button><button data-tab="all" class="${tab === 'all' ? 'on' : ''}">All Time</button></div></div>
      ${me ? `<p class="hof-me" style="margin-top:10px">You: <b>Rank ${me.lv}, ${esc(C.TITLES[me.lv])}</b> &middot; this week ${rpHtml(me.wk.e)} earned and ${me.wk.g} gem${me.wk.g === 1 ? '' : 's'} found. <a href="#" data-card>Your rank card</a></p>` : (Grind.member ? '' : `<p class="hof-me" style="margin-top:10px">Guests can look! To get on these tables, join JackNet (FREE): <a href="#" data-jlogon>Log on / Join</a></p>`)}
      ${grid}
      <div class="hof-foot">New week every Monday (1999 weeks). Tables update every few seconds.<br><a href="http://www.rupeehunt.jnet/">The Great Rupee Hunt</a> &middot; <a href="http://www.oddjobz.jnet/">The Odd Jobz Board</a> &middot; <a href="http://www.jacknetbank.webcom/richlist.html">The Rich List</a></div></div>`;
    el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; Sound.play('click'); render(); }));
    const c = el.querySelector('[data-card]'); if (c) c.addEventListener('click', ev => { ev.preventDefault(); A.open('grind.rank'); });
  }
  function hof(el) { hofEl = el; A.secret('grind.hof'); render(); Grind.send({ t: 'grHof' }); }

  window.GrindRank = { card, fanfare, hof };
})();
