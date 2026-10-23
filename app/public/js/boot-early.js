/* Runs while the page is still loading (it sits at the top of #bootPower), so the first thing painted is right:
 * the room with the PC switched off, or (a PC that was left on) the desktop waking up. boot.js reads window.JHPBoot.
 *   skip   : ?noboot (testing) or straight after Log Off (the logon screen)
 *   forced : a restart, a crash or a shut down on its way back round (boot.js knows what to do)
 *   room   : first visit, or they chose Shut Down last time: the PC is off, and a fresh start
 *   old    : not been here for over 48 hours: the PC is off (it got switched off at the wall), and a fresh start
 *   wake   : back within 48 hours and it was left on: straight back to where they were */
(function () {
  if(window.PCOnly?.blocked)return;
  var m = 'room';
  try {
    var ss = sessionStorage, ls = localStorage;
    window.JHPAway = Date.now() - (+ls.getItem('jhp_last') || 0); // (js/hs-world.js: back after 10 hours with the PC left on, you start stood up in the room)
    window.JHPEverBooted = ls.getItem('jhp_everbooted') === '1'; // before boot.js sets it (setup.js needs to know if this PC is brand new)
    if (/[?&]noboot/.test(location.search) || ss.getItem('jhp_site_relogon') === '1') m = 'skip';
    else if (ss.getItem('jhp_forceboot')) m = 'forced';
    else if (ls.getItem('jhp_off') === '1' || ls.getItem('jhp_everbooted') !== '1') m = 'room';
    else m = Date.now() - (+ls.getItem('jhp_last') || 0) < 48 * 3600 * 1000 ? 'wake' : 'old';
  } catch (e) {}
  window.JHPBoot = m;
  if (m === 'room' || m === 'old') {
    // The old CSS tower is not an entry screen: wait for the walkable house.
    document.documentElement.classList.add('house-entering');
    var entry = document.createElement('div'); entry.id = 'houseEntry'; entry.setAttribute('role', 'status');
    var title = document.createElement('strong'); title.textContent = 'ENTERING HOUSE';
    var note = document.createElement('span'); note.textContent = 'Preparing the room...';
    entry.append(title, note); document.documentElement.appendChild(entry);
  }
  if (m === 'wake') document.documentElement.classList.add('pc-wake');
  try { var st = JSON.parse(localStorage.getItem('jhp_hs_stand') || 'null'); if (m === 'wake' && st) { window.JHPStood = st; document.documentElement.classList.add('pc-standwake'); } } catch (e) {} // (stay hidden until the saved room is ready, without an arbitrary pose expiry)
  if (m === 'skip') document.documentElement.classList.add('pc-skip'); // no flash of the room straight after Log Off
})();
