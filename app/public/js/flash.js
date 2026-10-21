/* The flashy bits: wavy headings, headlines marquee, glitter cursor (inside the browser page only). */
(function () {
  const $ = id => document.getElementById(id);
  // wavy letters
  document.querySelectorAll('.wavy').forEach(h => {
    const text = h.textContent; h.textContent = ''; h.setAttribute('aria-label', text);
    [...text].forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch === ' ' ? ' ' : ch; s.style.animationDelay = (i * 0.07) + 's'; s.setAttribute('aria-hidden', 'true'); h.appendChild(s); });
  });
  // headlines marquee: the latest posts that have "happened" so far this 1999
  function headlines() {
    const t = Desk.today99(), CAL = window.CAL;
    if (!CAL) return;
    const md = s => { const [m, d] = s.split('-').map(Number); return m * 100 + d; };
    const strip = h => h.replace(/<[^>]+>/g, '').replace(/&eacute;/g, 'é').replace(/&Eacute;/g, 'É').replace(/&amp;/g, '&').replace(/&pound;/g, '£');
    const posts = CAL.posts.filter(p => md(p[0]) <= t.md && p[1] !== 'SITE').sort((a, b) => md(b[0]) - md(a[0])).slice(0, 8);
    const el = $('headlines');
    const esc = s => s.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    // ...and a hidden message, black on black, for anyone who looks REALLY closely (hover the marquee, or wait for it to pass)
    const hidden = ' &nbsp;&#9733;&nbsp; <span class="hid">psst... there is a secret page: type HOLOCRON in the address bar. Tell nobody. Especially Dave.</span>';
    el.innerHTML = (posts.length ? posts.map((p, i) => (i === 0 && md(p[0]) === t.md ? '<b>NEW!!!</b> ' : '') + esc(strip(p[2]).split(/(?<=[.!?])\s/)[0])).join(' &nbsp;&#9733;&nbsp; ') : 'Welcome to JACK ATTACK! Online!!! &#9733; The new site for 1999 &#9733; Sign the Letters page!!!') + hidden;
  }
  headlines(); setInterval(headlines, 60000);
  // glitter trail, only over the web page inside the browser window
  const cols = ['#ff0', '#f0f', '#0ff', '#fff', '#f80', '#3f3'];
  let last = 0;
  $('page').addEventListener('pointermove', ev => {
    if (ev.pointerType !== 'mouse' || document.body.classList.contains('noanim')) return;
    const now = performance.now(); if (now - last < 50) return; last = now;
    const s = document.createElement('span'); s.className = 'spark';
    s.textContent = Math.random() < 0.5 ? '✦' : '*';
    s.style.left = (ev.clientX + (Math.random() * 12 - 6)) + 'px'; s.style.top = (ev.clientY + 6 + Math.random() * 8) + 'px';
    s.style.color = cols[Math.floor(Math.random() * cols.length)];
    document.body.appendChild(s); setTimeout(() => s.remove(), 800);
  }, { passive: true });
})();
