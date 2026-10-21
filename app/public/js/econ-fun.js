/* econ-fun: JackLotto (www.jacklotto.grot), Jackdown Park kart track (www.jackdownpark.grot) and My Pixel Pet Farm
 * (www.mypixelfarm.webcom; inside it is still the squig farm). The server draws the numbers, runs the races and grows the pets; these pages just show it. */
(function () {
  'use strict';
  const W = window.EconWeb, C = window.EconCat, A = window.Apps; if (!W || W.fun) return;
  const { route, member, guestBox, footer, teef, fmt, esc, d99, t99, ago, sfx } = W;
  const pad = n => String(n).padStart(2, '0');
  const dur = ms => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h}h ${pad(m)}m` : `${m}:${pad(s % 60)}`; };

  // ================================================================ JACKLOTTO
  const LH = 'www.jacklotto.grot', LU = 'http://' + LH;
  const ballCol = n => n < 10 ? '#f4f4f4' : n < 20 ? '#4a8aff' : n < 30 ? '#ff6ab0' : n < 40 ? '#4ac04a' : '#ffd400';
  const ball = (n, cls) => `<span class="lt-ball ${cls || ''}" style="--bc:${ballCol(n)}">${n}</span>`;
  function ltTop(on) { return `<div class="lt-head"><div class="lt-logo"><span class="lt-lb">JL</span><span><b>JACKLOTTO</b><i>It could be YOU! (It's usually Dave.)</i></span></div><div class="lt-nav"><a href="${LU}/" class="${on === '/' ? 'on' : ''}">Play</a><a href="${LU}/results.html" class="${on === 'r' ? 'on' : ''}">Results</a></div></div>`; }
  route(LH, '/', 'ecw-lotto', P => {
    let L = null, pick = [];
    P.el.innerHTML = `${ltTop('/')}<div class="lt-body"><div class="lt-jack"><span>THIS WEEK'S... er, TONIGHT'S JACKPOT</span><b class="lt-jp">?</b><span class="lt-when"></span></div>
      <div class="lt-cols"><div class="lt-play"><h2>Pick 6 numbers</h2>${member() ? '' : guestBox('You need a JackNet membership to buy tickets.')}<div class="lt-grid">${Array.from({ length: 49 }, (_, i) => `<button type="button" class="lt-n" data-n="${i + 1}" style="--bc:${ballCol(i + 1)}">${i + 1}</button>`).join('')}</div>
        <div class="lt-pick">Your numbers: <span class="lt-sel">none yet</span></div><div class="lt-btns"><button type="button" class="lt-buy" disabled>BUY TICKET (${C.LOTTO.price} Rupees)</button><button type="button" class="lt-dip">LUCKY DIP</button><button type="button" class="lt-clr">Clear</button></div><div class="ec-msg lt-msg" hidden></div>
        <h3>Your tickets for tonight</h3><div class="lt-mine"></div></div>
        <div class="lt-side"><div class="lt-mach"><canvas width="200" height="200"></canvas><div class="lt-drawn"></div></div><div class="lt-box"><b>PRIZES</b><table>${[[6, 'JACKPOT!'], [5, teef(C.LOTTO.prizes[5])], [4, teef(C.LOTTO.prizes[4])], [3, teef(C.LOTTO.prizes[3])]].map(([m, p]) => `<tr><td>Match ${m}</td><td><b>${p}</b></td></tr>`).join('')}</table><p class="lt-small">Drawn every night at <b>9pm</b>. Up to ${C.LOTTO.maxTickets} tickets per draw. Half of every ticket goes into the jackpot. No winner? It ROLLS OVER!</p></div><div class="lt-box lt-last"></div></div></div></div>${footer('<p class="c">JackLotto. Play responsibly. (Mom says.) Must be over 18 (in dog years).</p>')}`;
    const sel = () => { P.q('.lt-sel').innerHTML = pick.length ? pick.slice().sort((a, b) => a - b).map(n => ball(n, 'sm')).join(' ') : 'none yet'; P.qa('.lt-n').forEach(b => b.classList.toggle('on', pick.includes(+b.dataset.n))); P.q('.lt-buy').disabled = pick.length !== 6 || !member(); };
    P.q('.lt-grid').addEventListener('click', e => { const b = e.target.closest('.lt-n'); if (!b) return; const n = +b.dataset.n; if (pick.includes(n)) pick = pick.filter(x => x !== n); else if (pick.length < 6) pick.push(n); sfx('click'); sel(); });
    P.q('.lt-clr').addEventListener('click', () => { pick = []; sel(); });
    P.q('.lt-dip').addEventListener('click', () => { const s = new Set(); while (s.size < 6) s.add(1 + Math.floor(Math.random() * 49)); pick = [...s]; sfx('dice'); sel(); });
    P.q('.lt-buy').addEventListener('click', () => { if (pick.length !== 6) return; const n = pick.slice().sort((a, b) => a - b); if (n.join() === '1,2,3,4,5,6') A.secret('econ.lucky'); Net.send({ t: 'ecTicket', n }); P.q('.lt-buy').disabled = true; });
    P.errTo('.lt-msg', () => sel());
    const draw = () => {
      if (!L) return;
      P.q('.lt-jp').innerHTML = `${Econ.gem ? Econ.gem('rainbow', 30) : ''} ${fmt(L.jackpot)} RUPEES`;
      P.q('.lt-mine').innerHTML = L.mine.length ? L.mine.map(t => `<div class="lt-tk">${t.map(n => ball(n, 'sm')).join(' ')}</div>`).join('') : '<p class="lt-small">No tickets yet. Go on. Just one. (Mom: "no".)</p>';
      const last = L.last;
      P.q('.lt-last').innerHTML = `<b>LAST DRAW${last ? ' (No. ' + last.no + ')' : ''}</b>${last ? `<div class="lt-row">${last.balls.slice().sort((a, b) => a - b).map(n => ball(n)).join('')}</div><p>${last.rolled ? 'Nobody matched all 6: <b>ROLLOVER!</b>' : 'JACKPOT WON!'} ${fmt(last.sold)} tickets sold.</p>${last.winners.length ? '<p>' + last.winners.slice(0, 5).map(w => `${esc(w.n)}: matched ${w.match} (${W.rp(w.prize)})`).join('<br>') + '</p>' : ''}${L.lt.length && L.lt[0].no === last.no ? `<p><b>Your tickets:</b><br>${L.lt.map(t => `${t.n.map(n => last.balls.includes(n) ? `<u>${n}</u>` : n).join(' ')} - ${t.match} match${t.prize ? ` <b>WON ${fmt(t.prize)}!</b>` : ''}`).join('<br>')}</p>` : ''}` : '<p>No draws yet. The first one is tonight at 9pm!</p>'}`;
    };
    P.every(() => { if (L) P.q('.lt-when').textContent = `Next draw in ${dur(L.next - Date.now())} (9pm tonight). ${fmt(L.sold)} tickets sold.`; }, 1000);
    P.on('ecLotto', m => { const had = L && L.mine.length; L = m; if (had != null && m.mine.length > had) { A.secret('econ.lotto'); sfx('solve'); P.say('.lt-msg', 'Ticket bought! Good luck! (Dave has crossed his fingers. And his toes. He fell over.)', 'ok'); pick = []; sel(); } draw(); });
    // the draw machine: balls tumbling about; on a live draw they come out one by one
    const cv = P.q('.lt-mach canvas'), g = cv.getContext('2d');
    const balls = Array.from({ length: 49 }, (_, i) => ({ n: i + 1, x: 100 + Math.cos(i) * 50, y: 100 + Math.sin(i * 2) * 50, vx: Math.cos(i * 7) * 3, vy: Math.sin(i * 3) * 3 }));
    let out = [], drawing = null;
    P.every(() => {
      g.clearRect(0, 0, 200, 200); g.beginPath(); g.arc(100, 100, 92, 0, 7); g.fillStyle = 'rgba(200,230,255,.35)'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
      for (const b of balls) { if (out.includes(b.n)) continue; b.vy += 0.25; b.x += b.vx; b.y += b.vy; const dx = b.x - 100, dy = b.y - 100, d = Math.hypot(dx, dy); if (d > 82) { const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny; b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; b.vx += (Math.random() - .5) * 3; b.vy -= Math.random() * 2; b.x = 100 + nx * 82; b.y = 100 + ny * 82; } g.beginPath(); g.arc(b.x, b.y, 8, 0, 7); g.fillStyle = ballCol(b.n); g.fill(); g.lineWidth = 1; g.strokeStyle = '#333'; g.stroke(); g.fillStyle = '#000'; g.font = 'bold 8px Arial'; g.textAlign = 'center'; g.fillText(b.n, b.x, b.y + 3); }
      g.fillStyle = '#5a1a8a'; g.fillRect(90, 186, 20, 14);
    }, 50);
    P.on('ecDraw', m => {
      drawing = m.last.balls; out = []; const box = P.q('.lt-drawn'); box.innerHTML = '<b class="blink">DRAW IN PROGRESS!</b>';
      drawing.forEach((n, i) => P.later(() => { out.push(n); box.innerHTML = out.map(x => ball(x)).join(''); sfx('boing'); if (i === drawing.length - 1) P.later(() => { Net.send({ t: 'ecLotto' }); out = []; }, 3000); }, 1500 + i * 2200));
    });
    Net.send({ t: 'ecLotto' });
    sel();
  });
  route(LH, '/results.html', 'ecw-lotto', P => {
    P.el.innerHTML = `${ltTop('r')}<div class="lt-body"><h2>Past Results</h2><div class="lt-hist">Loading...</div></div>${footer()}`;
    P.on('ecLotto', L => { P.q('.lt-hist').innerHTML = L.hist.length ? `<table class="lt-tbl"><tr><th>Draw</th><th>Numbers</th><th>Jackpot</th><th></th></tr>${L.hist.slice().reverse().map(h => `<tr><td>${h.no}</td><td>${h.balls.slice().sort((a, b) => a - b).map(n => ball(n, 'sm')).join(' ')}</td><td>${fmt(h.jp)}</td><td>${h.won ? '<b>WON!</b>' : 'Rollover'}</td></tr>`).join('')}</table>` : '<p>No draws yet!</p>'; });
    Net.send({ t: 'ecLotto' });
  });

  // ================================================================ JACKDOWN PARK
  const RH = 'www.jackdownpark.grot', RU = 'http://' + RH;
  const SILK = ['#e10600', '#0028c8', '#ffd400', '#0a0', '#ff8c00', '#8000ff', '#fff', '#00b0c0'];
  const frac = d => { const x = d - 1; if (x === 1) return 'EVENS'; if (Number.isInteger(x)) return x + '/1'; const t = Math.round(x * 2); return t % 2 ? `${t}/2` : `${t / 2}/1`; };
  function rcTop(on) { return `<div class="rc-head"><div class="rc-logo"><b>JACKDOWN PARK</b><i>Go-Kart Track &middot; A race every 10 minutes &middot; Rain or shine (mostly rain)</i></div><div class="rc-nav"><a href="${RU}/" class="${on === '/' ? 'on' : ''}">Today's Racing</a><a href="${RU}/form.html" class="${on === 'f' ? 'on' : ''}">The Form Guide</a></div></div>`; }
  const LINES = { off: ["AND THEY'RE OFF!", "They're away!", 'Lights out and away they go!'], lead: n => [`${n} takes the lead!`, `${n} hits the front!`, `It's ${n}, ${n} out in front!`, `${n} is going like the clappers!`], mid: ['Into the back straight...', 'Round the hairpin they come!', 'One of them has spun out on a banana skin!', 'A dog is on the track!', 'Neck and neck!', 'Somebody is using the turbo button!'], fin: n => [`${n} WINS IT!`, `It's ${n} by a nose!`, `${n} first past the post!`] };
  const pk = l => l[Math.floor(Math.random() * l.length)];
  route(RH, '/', 'ecw-race', P => {
    let R = null, run = null, runAt = 0, lead = -1, said = {};
    P.el.innerHTML = `${rcTop('/')}<div class="rc-body"><div class="rc-board"><div class="rc-led rc-next">RACE ? STARTS IN --:--</div><div class="rc-led rc-pool"></div></div>
      <canvas class="rc-track"></canvas><div class="rc-comm">Welcome to Jackdown Park!</div>
      <div class="rc-cols"><div class="rc-card"><h2>The Race Card</h2><table class="rc-tbl"><thead><tr><th>No.</th><th>Kart</th><th>Form</th><th>Odds</th>${member() ? '<th>Bet</th>' : ''}</tr></thead><tbody></tbody></table>
        ${member() ? `<div class="rc-bet"><label>Stake: <input type="number" class="rc-amt" min="1" max="100" value="10"> Rupees</label> <button type="button" class="rc-place" disabled>PLACE BET</button><span class="rc-hint">Pick a kart first.</span></div>` : guestBox('Log on to bet Rupees on the karts.')}<div class="ec-msg rc-msg" hidden></div><div class="rc-mine"></div></div>
        <div class="rc-side"><div class="rc-box"><b>RECENT RESULTS</b><div class="rc-hist"></div></div><div class="rc-box"><b>HOW IT WORKS</b><p>A race every 10 minutes. Bets close 20 seconds before the off. Up to 3 bets of 1-100 Rupees per race. If your kart wins, you get your stake times the odds (10 Rupees at 4/1 = 50 back). The bookie keeps the rest. He is very happy.</p></div></div></div></div>${footer()}`;
    const cv = P.q('.rc-track'), g = cv.getContext('2d');
    let choice = -1;
    const card = () => {
      if (!R || !R.cur) return;
      const cur = R.cur, tb = P.q('.rc-tbl tbody');
      tb.innerHTML = cur.field.map((f, i) => `<tr class="${choice === i ? 'on' : ''}"><td><span class="rc-silk" style="background:${SILK[i]}">${i + 1}</span></td><td><b>${esc(f.n)}</b></td><td>${f.form}</td><td><b>${frac(f.odds)}</b></td>${member() ? `<td><input type="radio" name="rcg" value="${i}" ${choice === i ? 'checked' : ''} ${cur.state !== 'open' ? 'disabled' : ''} aria-label="Bet on ${esc(f.n)}"></td>` : ''}</tr>`).join('');
      tb.querySelectorAll('input[name=rcg]').forEach(r => r.addEventListener('change', () => { choice = +r.value; upd(); card(); }));
      P.q('.rc-mine').innerHTML = R.mine.length ? `<p><b>Your bets on race ${cur.no}:</b> ${R.mine.map(([gi, a]) => `${fmt(a)} on ${esc(cur.field[gi].n)} (${frac(cur.field[gi].odds)})`).join(', ')}</p>` : '';
      P.q('.rc-hist').innerHTML = R.hist.length ? R.hist.slice().reverse().map(h => `<p>Race ${h.no}: <b>${esc(h.order[0])}</b> (${frac(h.odds)}), ${esc(h.order[1])}, ${esc(h.order[2])}<br><span class="rc-small">${t99(h.ts)} &middot; ${W.rp(h.pool)} bet</span></p>`).join('') : '<p>No races yet today.</p>';
      upd();
    };
    const upd = () => { const b = P.q('.rc-place'); if (!b || !R || !R.cur) return; const open = R.cur.state === 'open' && Date.now() < R.cur.at - 20000; b.disabled = !(open && choice >= 0); P.q('.rc-hint').textContent = !open ? 'Betting has closed for this race.' : choice < 0 ? 'Pick a kart first.' : `On ${R.cur.field[choice].n} at ${frac(R.cur.field[choice].odds)}`; };
    const pl = P.q('.rc-place'); if (pl) pl.addEventListener('click', () => { const amt = Math.floor(+P.q('.rc-amt').value || 0); if (amt < 1 || amt > 100) { P.say('.rc-msg', 'Stakes are 1 to 100 Rupees.', 'err'); return; } Net.send({ t: 'ecBet', g: choice, amt }); pl.disabled = true; });
    P.errTo('.rc-msg');
    P.on('ecRace', m => { const before = R && R.mine.length; R = m; R.skew = m.now - Date.now(); if (m.cur && m.cur.state === 'running' && m.cur.run && !run) { run = m.cur.run; runAt = m.cur.at; } if (before != null && m.mine.length > before) { sfx('pet'); P.say('.rc-msg', 'Bet placed! The bookie licks his pencil and writes it down.', 'ok'); } card(); });
    P.on('ecRun', m => { run = m.run; runAt = m.at - (R ? R.skew : 0); lead = -1; said = {}; comm(pk(LINES.off)); sfx('beep'); });
    P.on('ecRaceEnd', m => { if (!R || !R.cur) return; const f = R.cur.field; comm(pk(LINES.fin(f[m.res[0]].n)) + `  2nd ${f[m.res[1]].n}, 3rd ${f[m.res[2]].n}.`); A.secret('econ.race'); sfx('solve'); P.later(() => { run = null; Net.send({ t: 'ecRace' }); }, 4000); });
    P.on('earn', m => { if (m.code === 'race') { A.secret('econ.winbet'); P.say('.rc-msg', `<b>YOUR KART WON!</b> ${teef(m.amt)} ${Econ.word(m.amt)} paid out!`, 'ok'); } });
    function comm(t) { const c = P.q('.rc-comm'); c.textContent = t; c.classList.remove('rc-flash'); void c.offsetWidth; c.classList.add('rc-flash'); }
    const posAt = (sp, t) => { if (t <= 0) return 0; for (let i = 0; i < sp.length; i++) { if (t < sp[i]) { const t0 = i ? sp[i - 1] : 0; return (i + (t - t0) / (sp[i] - t0)) / sp.length; } } return 1; };
    function paint() {
      const w = cv.clientWidth || 600, h = 200, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = h * dpr; cv.style.height = h + 'px'; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#5a5a62'; g.fillRect(0, 0, w, h); g.fillStyle = '#62626a'; for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 20, h); g.fillStyle = '#3a8a2a'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 6, w, 6); for (let x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#fff' : '#e10600'; g.fillRect(x, 10, 16, 3); g.fillRect(x, h - 9, 16, 3); }
      g.fillStyle = '#fff'; g.fillRect(0, 14, w, 3); g.fillRect(0, h - 10, w, 3); for (let x = 0; x < w; x += 24) { g.fillRect(x, 10, 2, 10); g.fillRect(x, h - 14, 2, 10); }
      const x0 = 30, x1 = w - 46; g.fillStyle = '#fff'; g.fillRect(x0, 20, 2, h - 34); g.fillStyle = '#e10600'; g.fillRect(x1, 20, 4, h - 34);
      g.fillStyle = '#fff'; g.font = 'bold 10px Verdana,Arial,sans-serif'; g.save(); g.translate(x1 + 14, 80); g.rotate(Math.PI / 2); g.fillText('FINISH', 0, 0); g.restore();
      const field = R && R.cur ? R.cur.field : [];
      const t = run ? (Date.now() - runAt) / 1000 : 0;
      const lane = (h - 40) / 6;
      let best = -1, bx = -1;
      field.forEach((f, i) => {
        const p = run ? posAt(run[i], t) : 0, x = x0 + p * (x1 - x0 - 26), y = 24 + i * lane + lane / 2, bob = run && p < 1 ? Math.abs(Math.sin(t * 12 + i)) * 3 : 0;
        if (p > bx) { bx = p; best = i; }
        g.save(); g.translate(x, y); g.scale(1.6, 1.6); g.translate(-x, -y);
        const jig = bob > 1.5 ? 1 : 0; // a go-kart, side on: wheels, a coloured body, a driver in a helmet
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 8, y + 7, 10, 2, 0, 0, 7); g.fill();
        g.fillStyle = SILK[i]; g.fillRect(x - 2, y - jig, 19, 4); g.fillRect(x + 14, y - 2 - jig, 4, 3); g.fillStyle = '#222'; g.fillRect(x - 3, y - 1 - jig, 2, 3);
        g.fillStyle = '#ffd8a8'; g.fillRect(x + 5, y - 5 - jig, 3, 2); g.fillStyle = SILK[(i + 3) % 8]; g.fillRect(x + 4, y - 9 - jig, 6, 5); g.fillStyle = '#9cf'; g.fillRect(x + 8, y - 8 - jig, 2, 2);
        g.fillStyle = '#000'; g.fillRect(x - 1, y + 3, 5, 4); g.fillRect(x + 11, y + 3, 5, 4); g.fillStyle = '#888'; g.fillRect(x + 1 - jig, y + 4, 1, 2); g.fillRect(x + 13 + jig, y + 4, 1, 2);
        g.restore();
        g.fillStyle = '#fff'; g.font = 'bold 9px Verdana,Arial,sans-serif'; g.fillText(String(i + 1), 8, y + 3);
      });
      if (run && best >= 0 && best !== lead && bx > 0.15 && bx < 0.95) { lead = best; if (!said[best]) { said[best] = 1; comm(pk(LINES.lead(field[best].n))); } else if (Math.random() < 0.02) comm(pk(LINES.mid)); }
      if (!run) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(w / 2 - 120, h / 2 - 16, 240, 30); g.fillStyle = '#ffd400'; g.font = 'bold 13px Verdana,Arial,sans-serif'; g.textAlign = 'center'; g.fillText(R && R.cur ? `RACE ${R.cur.no} - KARTS ON THE GRID` : 'LOADING...', w / 2, h / 2 + 4); g.textAlign = 'left'; }
    }
    P.every(paint, 50);
    P.every(() => { if (!R || !R.cur) return; const cur = R.cur, ms = cur.at - (Date.now() + (R.skew || 0)); P.q('.rc-next').textContent = run ? `RACE ${cur.no} - RUNNING!` : `RACE ${cur.no} STARTS IN ${dur(ms)}${ms < 20000 ? ' - BETS CLOSED' : ''}`; P.q('.rc-pool').textContent = `POOL ${fmt(cur.pool)} RUPEES / ${cur.nb} BETS`; upd(); if (!run && ms < -4000 && !P._asked) { P._asked = 1; P.later(() => { P._asked = 0; Net.send({ t: 'ecRace' }); }, 3000); } }, 500);
    P.sub({ race: true });
    Net.send({ t: 'ecRace' });
  });
  const BIOS = ['Fast, mean and smells of petrol.', 'Has never finished a race facing the right way.', 'Trained on every racing game in the arcade. Uses the turbo button too early.', 'Wears lucky socks. Has worn them since 1997.', 'Gets distracted by shiny things. And ice cream vans.', 'Once beat a bus. The bus was parked.', 'Bumps the other karts. Officially "spirited".', 'Goes best in the rain. So, always.', 'Their Mom is in the crowd every race. Shouting.', 'Faster in reverse than forwards. Nobody knows why.', 'Retired twice. Came back twice. Hungry.', 'Sponsored by Gubbinz Pet Food.', 'The engine is from a lawnmower. A very angry lawnmower.', 'Kart painted to look like a starfighter. Makes the noises too.'];
  route(RH, '/form.html', 'ecw-race', P => {
    P.el.innerHTML = `${rcTop('f')}<div class="rc-body"><h2>The Form Guide</h2><p>Every kart on the books at Jackdown Park, with expert opinion from our tipster (a lad called Tips who has played every racing game ever made).</p><table class="rc-tbl rc-form">${C.GROTS.map((n, i) => `<tr><td><span class="rc-silk" style="background:${SILK[i % 8]}">${i + 1}</span></td><td><b>${esc(n)}</b></td><td>${BIOS[(i * 5) % BIOS.length]}</td></tr>`).join('')}</table><p class="rc-small">The form numbers on the race card are the kart's last three finishes (1 = won, 6 = last). Odds are worked out by the bookie running the race 3,000 times on his calculator.</p></div>${footer()}`;
  });

  // ================================================================ MY PIXEL PET FARM (was My Squig Farm; www.mysquigfarm.webcom redirects)
  const FH = 'www.mypixelfarm.webcom', FU = 'http://' + FH;
  route(FH, '/', 'ecw-farm', P => {
    let F = null, got = 0;
    P.el.innerHTML = `<div class="sf-head"><b>MY PIXEL PET FARM</b><i>The FREE online pet farming game! Breed them, feed them, sell them! No download needed! Works on 486s!</i></div><div class="sf-body"><div class="sf-main">Loading your farm...</div></div>${footer('<p class="c">My Pixel Pet Farm is a JackNet game. Pixel Pets are sold to Pixel Pets plc (they go on keyrings) at a price that follows the share price.</p>')}`;
    const squigs = [];
    function draw() {
      const box = P.q('.sf-main'); if (!box) return;
      if (!member()) { box.innerHTML = `<h2>Breed Pixel Pets. Sell Pixel Pets. Get rich (slowly).</h2><p>Every JackNet member gets a FREE Pixel Pet farm. Pixel Pets are little blobby beeping critters, like the ones on keyrings, only these live on the Internet. Two Pixel Pets make more Pixel Pets. Sell them to Pixel Pets plc for Rupees. Build more pens to breed more!</p>${guestBox('Log on to start your farm.')}`; return; }
      if (!F) { box.innerHTML = `<h2>Start your FREE Pixel Pet farm!</h2><p>You get one pen and two Pixel Pets (one blue, one pink, both beepy). Pixel Pets breed on their own, even when you're not here. Come back, sell them, build more pens.</p><button type="button" class="sf-start">START MY FARM!</button><div class="ec-msg sf-msg" hidden></div>`; P.q('.sf-start').addEventListener('click', () => Net.send({ t: 'ecFarm', a: 'start' })); return; }
      if (!box.querySelector('.sf-cv')) {
        box.innerHTML = `<div class="sf-top"><label>Farm name: <input type="text" class="sf-nm" maxlength="24" placeholder="e.g. Beepy Acres"></label><button type="button" class="sf-nmb">Save</button></div><canvas class="sf-cv"></canvas>
          <div class="sf-stats"></div><div class="sf-acts"><button type="button" class="sf-sell">SELL PIXEL PETS</button><button type="button" class="sf-pen">BUILD A PEN</button><button type="button" class="sf-feed">BUY A SNACK MACHINE</button></div><div class="ec-msg sf-msg" hidden></div>
          <div class="sf-help"><b>How it works:</b> each pen breeds about ${(60 / C.FARM.breedMin).toFixed(0)} Pixel Pets an hour and holds ${C.FARM.perPen}. Snack machines make every pen breed 20% faster. When the pens are full, breeding stops, so come back and sell! You always keep two Pixel Pets. The price follows Pixel Pets plc on the <a href="http://www.jackexchange.grot/quote/pets.html">Jack Exchange</a>.</div>`;
        P.q('.sf-sell').addEventListener('click', () => Net.send({ t: 'ecFarm', a: 'sell' }));
        P.q('.sf-pen').addEventListener('click', () => Net.send({ t: 'ecFarm', a: 'pen' }));
        P.q('.sf-feed').addEventListener('click', () => Net.send({ t: 'ecFarm', a: 'feed' }));
        P.q('.sf-nmb').addEventListener('click', () => Net.send({ t: 'ecFarm', a: 'name', nm: P.q('.sf-nm').value }));
        P.q('.sf-nm').value = F.name || '';
      }
      const now = F.sq + (Date.now() - got) / 3600000 * F.rate;
      const sqn = Math.min(F.cap, F.sq >= 2 ? now : F.sq);
      P.q('.sf-stats').innerHTML = `<table><tr><td>Pixel Pets</td><td><b>${Math.floor(sqn)}</b> / ${F.cap}</td><td>Pens</td><td><b>${F.pens}</b> / ${C.FARM.maxPens}</td></tr><tr><td>Breeding</td><td>${sqn >= F.cap ? '<b class="sf-full">PENS FULL!</b>' : `${F.rate} an hour`}</td><td>Snack machines</td><td><b>${F.feed}</b> / ${C.FARM.maxFeed}</td></tr><tr><td>Price</td><td>${F.price} ${Econ.word(F.price)} each</td><td>Sold so far</td><td>${fmt(F.sold)}</td></tr></table>`;
      P.q('.sf-sell').textContent = `SELL ${Math.max(0, Math.floor(sqn) - 2)} PIXEL PETS (${W.rp(Math.floor(Math.max(0, Math.floor(sqn) - 2) * F.price))})`;
      P.q('.sf-pen').textContent = F.pens >= C.FARM.maxPens ? 'NO ROOM FOR PENS' : `BUILD A PEN (${W.rp(F.penCost)})`;
      P.q('.sf-feed').textContent = F.feed >= C.FARM.maxFeed ? 'SNACK MACHINES MAXED' : `BUY A SNACK MACHINE (${W.rp(F.feedCost)})`;
      while (squigs.length < Math.min(80, Math.floor(sqn))) squigs.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .01, h: Math.random() * 6, c: ['#3a8aff', '#ff5ab4', '#38c040', '#ffc020', '#a050f0'][squigs.length % 5] });
      squigs.length = Math.min(80, Math.floor(sqn));
    }
    function paint() {
      const cv = P.q('.sf-cv'); if (!cv || !F) return;
      const w = cv.clientWidth || 500, h = 220, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = h * dpr; cv.style.height = h + 'px'; }
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#8acaff'; g.fillRect(0, 0, w, 60); g.fillStyle = '#6ab03a'; g.fillRect(0, 60, w, h - 60);
      g.fillStyle = '#a03a2a'; g.fillRect(w - 110, 18, 80, 50); g.beginPath(); g.moveTo(w - 118, 20); g.lineTo(w - 70, -4); g.lineTo(w - 22, 20); g.fillStyle = '#6a2a1a'; g.fill(); g.fillStyle = '#fff'; g.fillRect(w - 80, 40, 20, 28);
      const cols = Math.min(F.pens, Math.max(1, Math.floor((w - 130) / 90))), rows = Math.ceil(F.pens / cols), pw = Math.min(200, (w - 130) / cols), ph = Math.min(120, (h - 82) / rows);
      g.strokeStyle = '#7a4a1a'; g.lineWidth = 2;
      for (let i = 0; i < F.pens; i++) { const x = 10 + (i % cols) * pw, y = 74 + Math.floor(i / cols) * ph; g.strokeRect(x + 3, y + 3, pw - 6, ph - 6); for (let k = 0; k < pw - 6; k += 8) { g.beginPath(); g.moveTo(x + 3 + k, y + 3); g.lineTo(x + 3 + k, y - 1); g.stroke(); } }
      for (let i = 0; i < F.feed; i++) { g.fillStyle = '#d02020'; g.fillRect(12 + i * 14, 62, 8, 11); g.fillStyle = '#9cf'; g.fillRect(13 + i * 14, 63, 6, 5); g.fillStyle = '#ffd400'; g.fillRect(14 + i * 14, 69, 4, 2); } // little snack machines
      const t = Date.now() / 200;
      squigs.forEach((s, i) => {
        const pen = i % F.pens, px0 = 10 + (pen % cols) * pw + 10, py0 = 74 + Math.floor(pen / cols) * ph + 8;
        s.x += s.vx; if (s.x < 0 || s.x > 1) s.vx = -s.vx;
        const x = px0 + Math.max(0, Math.min(1, s.x)) * (pw - 26), y = py0 + s.y * (ph - 26) + 8 - Math.abs(Math.sin(t + s.h)) * 6;
        g.fillStyle = s.c; g.beginPath(); g.ellipse(x, y, 9, 7, 0, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke();
        g.fillStyle = '#fff'; g.fillRect(x - 5, y - 3, 3, 3); g.fillRect(x + 2, y - 3, 3, 3); g.fillStyle = '#000'; g.fillRect(x - 4, y - 2, 1, 1); g.fillRect(x + 3, y - 2, 1, 1); g.fillRect(x - 2, y + 2, 4, 1); g.fillStyle = '#000'; g.fillRect(x, y - 10, 1, 3); g.fillStyle = '#ffd400'; g.fillRect(x - 1, y - 12, 3, 2); // eyes, a smile and an antenna
      });
    }
    P.on('ecFarm', m => { const was = F; F = m.farm; got = Date.now(); if (F && !was) A.secret('econ.farm'); draw(); });
    P.on('me', () => { if (!member()) draw(); });
    P.on('earn', m => { if (m.code === 'farm') { sfx('solve'); P.say('.sf-msg', `Sold! ${teef(m.amt)} ${Econ.word(m.amt)} in the bank. The Pixel Pets went off in a Jiffy Couriers van, beeping.`, 'ok'); } });
    P.errTo('.sf-msg');
    P.every(paint, 60); P.every(draw, 5000); P.every(() => { if (F) Net.send({ t: 'ecFarm', a: 'look' }); }, 60000);
    if (member()) Net.send({ t: 'ecFarm', a: 'look' }); else draw();
  });
  W.fun = true;
})();
