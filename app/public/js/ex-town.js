/* ex-town: JACKTOWN TOWN HALL (www.jacktownhall.jnet). Your plot's shops and houses take money every day: collect the
 * takings (after business rates), upgrade your business licence for bigger takings, and see the Jacktown league.
 * The server (mods/ex.js) works it all out from your plot in Jacktown (www.jacktown.jnet, mods/econ.js). */
(function () {
  'use strict';
  const A = window.Apps, X = window.ExCat, K = window.ExKit, EX = window.EX, esc = A.esc, W = window.ExWeb;
  const U = p => 'http://www.jacktownhall.jnet' + p;
  const R = n => (window.Econ && Econ.rupees ? Econ.rupees(n) : EX.rp(n));
  const rp = EX.rp;
  const crest = '<svg viewBox="0 0 60 70" width="60" height="70" aria-hidden="true"><path d="M30 2l26 8v24c0 18-12 28-26 34C16 62 4 52 4 34V10z" fill="#1a3a8a" stroke="#ffd400" stroke-width="2.4"/><path d="M30 8v54M8 30h44" stroke="#ffd400" stroke-width="1.6"/><path d="M14 22l4-6 4 6v4h-8z" fill="#fff"/><circle cx="43" cy="20" r="5" fill="#e10600" stroke="#fff"/><path d="M12 44c4-3 8-3 12 0M36 40l6-6 6 6v8H36z" fill="#fff" stroke="#fff"/><rect x="40" y="42" width="4" height="6" fill="#1a3a8a"/></svg>';
  const head = sub => `<div class="exh-top">${crest}<div><div class="exh-t">Jacktown Borough Council</div><div class="exh-s">Town Hall &middot; Market Square &middot; "Pro Bono Jacktownico"</div></div></div>
    <div class="exh-nav"><a href="${U('/')}">Business Rates &amp; Takings</a><a href="${U('/rates.html')}">How Rates Work</a><a href="http://www.jacktown.jnet/">Jacktown Planning (build)</a><a href="http://www.jacktown.jnet/gazette.html">The Gazette</a></div>${sub ? `<h2 class="exh-h">${sub}</h2>` : ''}`;
  const foot = () => '<div class="exh-foot">Jacktown Borough Council &middot; Bins are collected on Tuesdays (except when they are not) &middot; This site is best viewed at 800x600 &middot; Last updated by the Clerk to the Council</div>';
  const loadB = () => A.load('js/econ-cat.js').then(() => window.EconCat).catch(() => null);

  W.townHome = el => {
    el.className = 'ex-page exh';
    el.innerHTML = `${head()}<div class="exh-in"><p>Opening the filing cabinet...</p></div>${foot()}`;
    const box = el.querySelector('.exh-in'), L = EX.live(el);
    let last = null, said = '';
    const draw = (m, EC) => {
      last = m; const me = m.me, B = EC ? EC.BUILD : {};
      const lv = me ? m.levels[me.lv] : null, nx = me ? m.levels[me.lv + 1] : null;
      const cells = me && me.cells ? [...me.cells] : [];
      const tally = {}; for (const ch of cells) if (m.take[ch]) tally[ch] = (tally[ch] || 0) + 1;
      box.innerHTML = `${said ? `<div class="exh-said">${said}</div>` : ''}
      <div class="exh-cols"><div class="exh-main">
        ${!EX.member ? `<div class="exh-box"><h3>Business Rates &amp; Takings</h3><p>Every member who owns a plot in Jacktown can collect the day's <b>takings</b> here: the money its shops, cafes and houses took. The council keeps a little for <b>business rates</b>.</p>${K.guestNote('Collecting your takings')}</div>`
        : !me || me.plot < 0 ? `<div class="exh-box"><h3>No plot on our records</h3><p>You don't own a plot in Jacktown yet, so there's nothing to collect. Claim one (25 Rupees) and build some shops at <a href="http://www.jacktown.jnet/">Jacktown Planning</a>, then come back here every day for your takings.</p></div>`
        : `<div class="exh-box"><h3>Your Business: ${esc(me.nm || 'Plot ' + (me.plot + 1))}</h3>
          <div class="exh-biz"><div class="exh-plot">${cells.map(ch => `<span class="exh-cell" title="${esc(B[ch] ? B[ch].n : '')}" style="background:${CELLC[ch] || '#5ac03a'}">${m.take[ch] ? '&pound;' : ''}</span>`).join('')}</div>
          <table class="exh-tab"><tr><td>Licence</td><td><b>${esc(lv.n)}</b> (level ${me.lv + 1} of ${m.levels.length})</td></tr>
            <tr><td>Takings today</td><td>${R(me.tk.base || 0)} base &times; ${lv.mult} (licence) &times; ${me.tk.mood} (town mood) = <b>${R(me.tk.gross)}</b>${me.tk.gross >= me.tk.cap ? ' <small>(the most a ' + esc(lv.n) + ' can take)</small>' : ''}</td></tr>
            <tr><td>Business rates</td><td>- ${R(me.tk.rates)} a day</td></tr>
            <tr><td>Yours to collect</td><td class="exh-big">${R(me.owed)}${me.days > 1 ? ` <small>(${me.days} days' worth)</small>` : ''}</td></tr></table></div>
          ${me.days > 0 ? `<p><button class="btn exh-go" data-collect><b>COLLECT TAKINGS</b></button> <small>Takings wait for you for up to ${m.keep} days.</small></p>` : `<p class="exh-done">&#10004; You've collected today's takings. The till is empty until tomorrow!</p>`}
          ${Object.keys(tally).length ? `<p class="exh-small">Earning buildings: ${Object.keys(tally).map(ch => `${tally[ch]} &times; ${esc(B[ch] ? B[ch].n : ch)} (${m.take[ch]} each)`).join(', ')}.</p>` : '<p class="exh-small">Nothing on your plot takes any money yet! Shops, cafes, the arcade, the cinema and the bank take the most.</p>'}
          <p class="exh-small">This week: ${R(me.wk)} &middot; all time: ${R(me.tot)}. (Your hourly rent from Jacktown, ${R(me.rent)} so far this hour, is paid separately by the Jacktown Treasury.)</p></div>
          <div class="exh-box"><h3>Business Licence</h3>${nx ? `<p>Upgrade to a <b>${esc(nx.n)}</b> for ${R(nx.cost)}: takings &times;${nx.mult} (now &times;${lv.mult}), up to ${R(nx.cap)} a day (now ${R(lv.cap)}), business rates ${R(nx.rates)} a day.</p><p><button class="btn" data-up>Apply for planning permission (${rp(nx.cost)})</button></p>` : '<p>You have the top licence: a <b>Retail Park</b>! The council salutes you. (Quietly. It\'s a library.)</p>'}
          <table class="exh-tab exh-lv"><tr><th>Licence</th><th>Costs</th><th>Takings</th><th>Most a day</th><th>Rates</th></tr>${m.levels.map((l, i) => `<tr${i === me.lv ? ' class="on"' : ''}><td>${i + 1}. ${esc(l.n)}</td><td>${l.cost ? rp(l.cost) : 'free'}</td><td>&times;${l.mult}</td><td>${l.cap}</td><td>${l.rates}</td></tr>`).join('')}</table></div>`}
      </div><div class="exh-side">
        <div class="exh-box"><h3>Jacktown League</h3><p class="exh-small">The most valuable plots in town (buildings + licences).</p><ol class="exh-ol">${m.byV.map(r => `<li><b>${esc(r.n)}</b> ${r.nm ? `<small>"${esc(r.nm)}"</small>` : ''}<br><small>${R(r.v)} &middot; ${esc(m.levels[r.lv].n)}</small></li>`).join('') || '<li><i>Nobody has built anything yet!</i></li>'}</ol></div>
        <div class="exh-box"><h3>Top Takings This Week</h3><ol class="exh-ol">${m.byWk.map(r => `<li><b>${esc(r.n)}</b>: ${R(r.wk)}</li>`).join('') || '<li><i>Nobody has collected yet this week.</i></li>'}</ol></div>
        <div class="exh-box exh-small"><b>Town mood:</b> ${m.hap}% happy. Happy towns spend more! Parks, trees, fountains and fewer power stations make people happy.</div>
      </div></div>`;
      const c = box.querySelector('[data-collect]'); if (c) c.addEventListener('click', () => { c.disabled = true; EX.send({ t: 'exTownCollect' }); });
      const u = box.querySelector('[data-up]'); if (u) u.addEventListener('click', () => Desk.msgbox('Jacktown Planning Committee', `Upgrade your business licence to a ${nx.n} for ${rp(nx.cost)}?\n\nYour takings will go up, and so will your business rates.`, 'q', [['Apply', () => { u.disabled = true; EX.send({ t: 'exTownUp' }); }], ['Not yet']]));
    };
    let EC = null;
    L.on('exTown', m => {
      if (m.got != null) { said = m.got > 0 ? `<b>Takings collected:</b> ${R(m.gross)} taken, ${R(m.rates)} business rates paid, <b>${R(m.got)}</b> into your JackNet Bank account. Thank you for your custom!` : m.gross > 0 ? 'Takings counted. (The Bank says you\'ve already been paid today.)' : 'The till was empty! Build some shops on your plot.'; EX.sfx(m.got > 0 ? 'solve' : 'click'); }
      draw(m, EC);
    });
    L.on('exErr', m => { said = `<b>The council says:</b> ${esc(m.msg)}`; if (last) draw(last, EC); EX.sfx('uhoh'); });
    loadB().then(ec => { EC = ec; EX.send({ t: 'exTown' }); });
  };
  const CELLC = { '.': '#5ac03a', r: '#c8b890', t: '#2a8a2a', f: '#ff8ad8', p: '#5aa8ff', F: '#8ad8ff', h: '#e8a060', a: '#c87a5a', o: '#a08060', s: '#ffd400', T: '#ff8a00', m: '#a0602a', q: '#ff6a9a', w: '#8a8a8a', g: '#3a5a8a', e: '#4a4a4a', n: '#e8e8e8', x: '#ff3a3a', b: '#c8a000', R: '#e10600', c: '#9a3ae0' };

  W.townRates = el => {
    el.className = 'ex-page exh';
    loadB().then(EC => {
      const B = EC ? EC.BUILD : {};
      el.innerHTML = `${head('Business Rates Explained')}<div class="exh-in"><div class="exh-box">
        <p>Every day, the shops and houses on your plot take money from the people of Jacktown. That's your <b>takings</b>.</p>
        <ol><li>Each building takes a set amount a day (see the table).</li><li>That's multiplied by your <b>business licence</b> (a Corner Plot is &times;1, a Retail Park &times;2.5) and by the <b>town mood</b> (a happy town spends more, a grumpy one less).</li><li>Each licence has a most-a-day limit.</li><li>The council takes its <b>business rates</b> out of it. (Bigger licences, bigger rates.)</li><li>Collect once a day here at the Town Hall. If you're away, takings wait for up to ${X.TOWN.keep} days.</li></ol>
        <p>This is <b>on top of</b> the hourly rent that Jacktown already pays you for your houses and shops.</p>
        <table class="exh-tab"><tr><th>Building</th><th>Takes a day</th></tr>${Object.keys(X.TAKE).filter(ch => X.TAKE[ch] > 0 && B[ch]).sort((a, b) => X.TAKE[b] - X.TAKE[a]).map(ch => `<tr><td>${esc(B[ch].n)}</td><td>${X.TAKE[ch]}</td></tr>`).join('')}</table>
        <p><a href="${U('/')}">&laquo; Back to the Town Hall</a></p></div></div>${foot()}`;
    });
  };
})();
