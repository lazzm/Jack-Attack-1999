/* CRT glass over the whole screen. On by default; CRT.set(false) / Run "crt" turns it off (remembered).
   Flickers happen at random: usually 8-25 s apart, a tiny 40-90 ms blip, sometimes a double blip,
   and an interference line now and then. Nothing on a regular beat. */
(function () {
  const el = document.createElement('div');
  el.id = 'crtglass'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = '<s></s><i></i><b></b><u></u><em></em>';
  let on = true;
  try { on = localStorage.getItem('jhp_crt') !== '0'; } catch (e) {}
  el.hidden = !on;
  DesktopSurface.root().appendChild(el);
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const rnd = (a, b) => a + Math.random() * (b - a);
  function blip(cls, ms, then) { el.classList.add(cls); setTimeout(() => { el.classList.remove(cls); if (then) then(); }, ms); }
  function flicker() {
    setTimeout(flicker, rnd(8000, 25000));
    if (el.hidden || document.hidden || still.matches || document.documentElement.classList.contains('pc-roomview')) return;
    const r = Math.random();
    if (r < 0.55) blip('fb', rnd(40, 90));
    else if (r < 0.8) blip('fu', rnd(50, 110));
    else blip('fb', rnd(30, 60), () => setTimeout(() => blip('fb', rnd(30, 70)), rnd(60, 160)));
  }
  function zip() {
    setTimeout(zip, rnd(30000, 90000));
    if (el.hidden || document.hidden || still.matches || document.documentElement.classList.contains('pc-roomview')) return;
    el.classList.remove('zip'); void el.offsetWidth; el.classList.add('zip');
    setTimeout(() => el.classList.remove('zip'), 1000);
  }
  setTimeout(flicker, rnd(5000, 15000));
  setTimeout(zip, rnd(20000, 60000));
  window.CRT = {
    get on() { return !el.hidden; },
    set(v) { el.hidden = !v; try { localStorage.setItem('jhp_crt', v ? '1' : '0'); } catch (e) {} },
    toggle() { this.set(el.hidden); return !el.hidden; },
  };
  if (window.Apps && Apps.cmd) Apps.cmd(['crt', 'scanlines'], () => {
    const v = CRT.toggle();
    if (window.Desk) Desk.toast('Monitor', v ? 'CRT glass on. Smell that warm dust.' : 'CRT glass off. Very modern of you.', 3000);
  });
})();
