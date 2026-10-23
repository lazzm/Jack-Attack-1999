/* Handhelds use JackOS only. Desktop/laptop players keep the 3D house. */
(function () {
  'use strict';
  const n = navigator, ua = n.userAgent || '', platform = n.userAgentData?.platform || '';
  const handheld = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|IEMobile|Opera Mini|Tablet|PlayBook/i.test(ua) ||
    /Android|iOS/i.test(platform) || n.userAgentData?.mobile === true ||
    (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
  window.PCOnly = Object.freeze({ blocked: false, desktopOnly: !!handheld });
  if (handheld) document.documentElement.classList.add('mobile-desktop');
  // Old bookmarks of the former access notice now enter the normal account gate.
  if (/\/pc-required\.html$/.test(location.pathname)) location.replace(new URL('./', location.href).href);
})();
