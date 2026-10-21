/* ex-cup: THE MEGA MASTERS (www.megamasters.cyb), the weekly JackNet cup. Three events every 1999 week (Monday to
 * Sunday): an arcade game, a Pocket Money job and the Card Clash League. The server keeps the scores (only scores it
 * saw: arcade tables, jobs it checked, Card Clash games it ran) and pays the prizes when the week ends. */
(function () {
  'use strict';
  const A = window.Apps, X = window.ExCat, K = window.ExKit, EX = window.EX, esc = A.esc, W = window.ExWeb;
  const U = p => 'http://www.megamasters.cyb' + p;
  const R = n => (window.Econ && Econ.rupees ? Econ.rupees(n) : EX.rp(n));
  const ord = n => n + (['th', 'st', 'nd', 'rd'][(n % 10 < 4 && Math.floor(n / 10) % 10 !== 1) ? n % 10 : 0]);
  const head = sub => `<div class="exm-top"><div class="exm-logo">${EX.ICO.cup.replace('<svg', '<svg width="64" height="64"')}<div><span>THE MEGA</span><span>MASTERS</span><small>The Weekly JackNet Cup &middot; Est. 1999</small></div>${EX.ICO.cup.replace('<svg', '<svg width="64" height="64"')}</div>
    <div class="exm-nav"><a href="${U('/')}">This Week</a><a href="${U('/past.html')}">Past Champions</a><a href="${U('/rules.html')}">Rules</a></div>${sub ? `<h2 class="exm-h">${sub}</h2>` : ''}</div>`;
  const foot = () => '<div class="exm-foot">The Mega Masters is run by volunteers (Jack) &middot; Scores are kept by the JackNet server, so no fibbing &middot; Sponsored by nobody</div>';
  const HOW = {
    arcade: ev => [`Play <b>${esc(ev.n)}</b> in the Games Arcade on the JACK ATTACK! site and put your score on the high-score table. Your best score this week counts.`, 'Go to the Arcade', () => { const b = document.getElementById('browser'); if (b) b.classList.remove('min'); IE.go('demos', 'click'); }],
    job: ev => [`Do <b>${esc(ev.n)}</b> (a Pocket Money job). Your best score this week counts, paid or not.`, 'Do the job', () => window.Grind && Grind.job(ev.g)],
    clash: () => [`Win games of <b>Card Clash</b>: ${X.TOUR.clash.pvp} points for beating a real person online (${X.TOUR.clash.draw} for a draw), ${X.TOUR.clash.cpu} for beating JackK (up to ${X.TOUR.clash.cpuDay} a day). The same two people only count twice a day.`, 'Play Card Clash', () => A.open('ex.clash')],
  };

  W.cupHome = el => {
    el.className = 'ex-page exm';
    el.innerHTML = `${head()}<div class="exm-in"><p>Polishing the cups...</p></div>${foot()}`;
    const box = el.querySelector('.exm-in'), L = EX.live(el);
    L.on('exTour', m => {
      if (m.ev.some(e => e.me)) A.secret('ex.cup');
      box.innerHTML = `<div class="exm-week"><b>${esc(m.label)}</b> &middot; ends <span class="exm-cd" data-end="${m.ends}">${K.left(m.ends - Date.now())}</span> (Sunday midnight) &middot; Prizes: <b>1st</b> ${R(m.prizes[0])} + Gold Cup, <b>2nd</b> ${R(m.prizes[1])} + Silver Cup, <b>3rd</b> ${R(m.prizes[2])} + Bronze Cup. Everybody who enters an event gets ${R(m.part)}!</div>
        ${EX.member ? '' : K.guestNote('Entering The Mega Masters')}
        <div class="exm-evs">${m.ev.map(ev => { const [how, btn] = HOW[ev.k](ev); return `<div class="exm-ev exm-${ev.k}"><h3>${ev.k === 'arcade' ? 'ARCADE' : ev.k === 'job' ? 'POCKET MONEY' : 'CARD CLASH'}<span>${esc(ev.n)}</span></h3><p>${how}</p>${ev.me ? `<p class="exm-me">You're <b>${ord(ev.me.pos)}</b> with <b>${ev.me.s}</b> ${esc(ev.unit)}.</p>` : ''}<p><button class="btn" data-go="${ev.k}">${btn}</button></p>
          <table class="exm-tab"><thead><tr><th>#</th><th>Name</th><th>Best</th></tr></thead><tbody>${ev.top.map((r, i) => `<tr${i < 3 ? ` class="p${i + 1}"` : ''}><td>${i + 1}</td><td>${esc(r.n)}</td><td>${r.s}</td></tr>`).join('') || '<tr><td colspan="3"><i>Nobody yet. Be first!</i></td></tr>'}</tbody></table><p class="exm-small">${ev.count} entrant${ev.count === 1 ? '' : 's'} so far</p></div>`; }).join('')}</div>
        ${m.hist.length ? `<div class="exm-last"><h3>Last week's champions (${esc(m.hist[0].label)})</h3><ul>${m.hist[0].ev.map(e => `<li><b>${esc(e.n)}</b>: ${e.top.length ? e.top.map((t, i) => `${['&#129351;', '&#129352;', '&#129353;'][i]} ${esc(t.n)} (${t.s})`).join(' &middot; ') : '<i>no entries</i>'}</li>`).join('')}</ul></div>` : ''}`;
      box.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { const ev = m.ev.find(e => e.k === b.dataset.go); HOW[ev.k](ev)[2](); }));
    });
    L.every(() => { const c = el.querySelector('.exm-cd'); if (c) c.textContent = K.left(+c.dataset.end - Date.now()); }, 1000);
    L.on('tourEnd', () => EX.send({ t: 'exTour' }));
    EX.send({ t: 'exTour' });
  };
  W.cupPast = el => {
    el.className = 'ex-page exm';
    el.innerHTML = `${head('Past Champions')}<div class="exm-in"><p>Opening the trophy cabinet...</p></div>${foot()}`;
    EX.live(el).on('exTour', m => {
      el.querySelector('.exm-in').innerHTML = m.hist.length ? m.hist.map(h => `<div class="exm-last"><h3>${esc(h.label)}</h3><ul>${h.ev.map(e => `<li><b>${esc(e.n)}</b> (${e.entrants} entered): ${e.top.length ? e.top.map((t, i) => `${['&#129351;', '&#129352;', '&#129353;'][i]} ${esc(t.n)} (${t.s})`).join(' &middot; ') : '<i>no entries</i>'}</li>`).join('')}</ul></div>`).join('') : '<p>The Mega Masters only started this week! The trophy cabinet is empty (apart from a dead spider).</p>';
    });
    EX.send({ t: 'exTour' });
  };
  W.cupRules = el => {
    el.className = 'ex-page exm';
    el.innerHTML = `${head('The Rules')}<div class="exm-in"><div class="exm-rules"><ol>
      <li>The Mega Masters runs every 1999 week, Monday to Sunday. There are three events: an <b>arcade game</b>, a <b>Pocket Money job</b> and the <b>Card Clash League</b>. The arcade game and the job change every week.</li>
      <li>Only JackNet members can enter (it's free). You don't sign up: just play!</li>
      <li>Arcade and job events: your <b>best</b> score of the week counts. Card Clash: your points add up all week.</li>
      <li>The JackNet server keeps the scores itself. It only believes what it saw.</li>
      <li>When the week ends, the top three in each event win Rupees and a Mega Masters cup for their Treasure Chest. Everybody who entered an event gets ${EX.rp(X.TOUR.part)} for taking part.</li>
      <li>The Card Clash League winner also gets the <b>Card Clash Champ</b> badge.</li>
      <li>Ties go to whoever got there first.</li>
      <li>No cheating, no fibbing, no being Dave about it.</li></ol>
      <p><a href="${U('/')}">&laquo; Back to this week's events</a></p></div></div>${foot()}`;
  };
})();
