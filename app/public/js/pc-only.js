/* Device policy (owner, 2026-10-26): phones and tablets play the whole game, the 3D house included, with touch controls
 * (js/hs-touch.js) and a light quality tier picked in js/hs-world.js. JackOS on its own (js/mobile-desktop.js) is only a
 * last resort: a handheld without usable WebGL, or one whose player chose "JackOS only" after the house measured too slow.
 * The choice is remembered on this device (jhp_device_view) and can be changed from the game menu or the JackOS-only
 * power panel. Desktop/laptop players keep keyboard and mouse; a touchscreen laptop gets the touch controls only while
 * its touchscreen is in use (js/hs-input.js). */
(function () {
  'use strict';
  const n = navigator, ua = n.userAgent || '', platform = n.userAgentData?.platform || '';
  const handheld = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|IEMobile|Opera Mini|Tablet|PlayBook/i.test(ua) ||
    /Android|iOS/i.test(platform) || n.userAgentData?.mobile === true ||
    (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
  const KEY = 'jhp_device_view';
  let choice = '';
  try { choice = localStorage.getItem(KEY) || ''; } catch (e) {}
  // A throwaway context answers "can this handheld draw WebGL at all?" and is released at once (phones cap live contexts).
  let gl = true;
  if (handheld && choice !== 'jackos') {
    try {
      const c = document.createElement('canvas'), ctx = c.getContext('webgl2') || c.getContext('webgl');
      gl = !!ctx; ctx?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch (e) { gl = false; }
  }
  const jackos = handheld && (choice === 'jackos' || !gl);
  function choose(view) {
    try { if (view === 'jackos' || view === 'house') localStorage.setItem(KEY, view); else localStorage.removeItem(KEY); } catch (e) {}
  }
  window.PCOnly = Object.freeze({
    blocked: false, desktopOnly: jackos, handheld, house: !jackos, noWebGL: handheld && !gl,
    get choice() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }, choose,
  });
  const root = document.documentElement;
  if (jackos) root.classList.add('mobile-desktop');
  else if (handheld) root.classList.add('handheld-house');
  // Old bookmarks of the former access notice now enter the normal account gate.
  if (/\/pc-required\.html$/.test(location.pathname)) location.replace(new URL('./', location.href).href);
})();
