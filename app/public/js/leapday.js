/* leapday: 1999 had no 29 February, so on a real leap day (next: 29/02/2028) the PC is stuck BETWEEN days.
 * This always-loaded part is tiny: the date check, Desk.leapDay(), the secrets, a hint on Jack's Y2K page and
 * C:\LOSTDAYS (after a repair). Everything else (glitches, the hidden site, the midnight time repair) is lazy:
 * js/leapday-x.js, loaded only on the day. Desk.today99() stays 28/02 so the magazine's calendar still works.
 * Testing: ?leapday (pretends it's 29/02 now), ?date99=02-29, ?date99=02-29&time=23:59:50 (the midnight repair),
 * LeapDay.preview('burst'|'clock'|'icons'|'letters'|'counter'|'repair'). */
(function () {
  'use strict';
  if (!window.Apps || !window.Desk) return;
  const A = Apps, $ = id => document.getElementById(id);
  const Q = new URLSearchParams(location.search);
  const SS = () => window.Seasons;
  // ?leapday on its own: pretend it is 29 February (the clock keeps the real time unless ?time= says otherwise)
  if (Q.has('leapday') && !Q.get('date99') && SS() && SS().setTime) SS().setTime('02-29', Q.get('time') || undefined);
  const now = () => (SS() && SS().now ? SS().now() : new Date());
  const isLeap = () => { const n = now(); return n.getMonth() === 1 && n.getDate() === 29; };
  let on = false, x = null, wasOn = false;
  const L = window.LeapDay = {
    get on() { return on; },
    now, isLeap,
    // DOS DATE (dos-shell.js) asks this on the day
    dosDate: () => 'Current date is ????day 29/02/1999\nInvalid date\n\n(1999 has no 29 February. JackOS is somewhere between Sunday 28/02 and Monday 01/03.)',
    preview(what) { return load().then(() => window.LeapX && LeapX.preview(what)); }, // for testing (most of it only does anything on the day)
  };
  Desk.leapDay = () => on;

  // ---- secrets (defined every day so the total never changes; found only on the day)
  [['site', 'The space between the days', 'Some web sites only exist on a day that doesn\'t'],
    ['restore', 'Lost property', 'Fish a whole day out of the Recycle Bin (if there is one in there)'],
    ['clock', 'Caught the clock', 'Click the clock while it\'s not sure what time it is'],
    ['door', 'The door between the days', 'Find the page that can\'t be found, and sign your name'],
    ['midnight', 'Time repair', 'Stay up until midnight on a day that never happened']].forEach(([id, n, hint]) => A.defineSecret('leap.' + id, n, hint));

  // ---- after a repair, the lost day lives on the C: drive
  const LOST = '29/02/1999\r\n==========\r\n\r\nScanDisk found this day lying around between Sunday 28/02/99\r\nand Monday 01/03/99. It does not belong to any month.\r\n\r\n00:00 ......................................\r\n01:00 ......................................\r\n  (and so on: 24 hours, all unused)\r\n23:59 ......................................\r\n\r\nContents: 1 day, never opened. Smells faintly of\r\nCeefax and cold toast.\r\n\r\nIt will probably come back in four years.\r\nIt knows where we live.\r\n';
  const lostFile = () => { A.fs.add('C:/LOSTDAYS', { name: 'FILE0029.CHK', type: 'txt', date: '01/03/99', size: '1 KB', text: LOST }); };
  if (A.store.get('jhp_leap_lost', 0)) lostFile();
  L.lostFile = lostFile;

  // ---- the hint on Jack's Y2K Survival Centre page (every day)
  document.addEventListener('section', ev => {
    if (String(ev.detail) !== 'secret:y2k') return;
    setTimeout(() => {
      const box = document.querySelector('#s-secret .sbox'); if (!box || box.querySelector('.lp-hint')) return;
      const p = document.createElement('p'); p.className = 'small lp-hint';
      p.innerHTML = '<b>P.S.</b> Every four years something weird happens to my PC. The clock goes funny, the calendar gets an extra square and Dave swears the desktop icons moved on their own. Dad says it\'s the calendar chip. Mom says turn it off and on again. But 1999 hasn\'t even GOT a 29th of February, so how would it know?';
      box.appendChild(p);
    }, 80);
  });

  // ---- the date check (every second on the day, every 20 s otherwise: it's just a Date)
  const load = () => (x = x || A.load('js/leapday-x.js'));
  function start() { on = true; wasOn = true; load().then(() => window.LeapX && LeapX.start()).catch(e => console.error(e)); }
  function check() {
    const l = isLeap();
    if (l && !on) start();
    else if (!l && on) { on = false; if (window.LeapX) LeapX.end(now()); }
    setTimeout(check, on || wasOn ? 1000 : 20000);
  }
  if (isLeap()) start();
  setTimeout(check, 1000);
})();
