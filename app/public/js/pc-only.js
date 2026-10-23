/* PC access policy. Screen size and touch support alone never exclude a PC. */
(function () {
  'use strict';
  const n = navigator, ua = n.userAgent || '', platform = n.userAgentData?.platform || '';
  const handheld = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|IEMobile|Opera Mini|Tablet|PlayBook/i.test(ua) ||
    /Android|iOS/i.test(platform) || n.userAgentData?.mobile === true ||
    (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
  window.PCOnly = Object.freeze({ blocked: !!handheld });
  if (!handheld) return;
  document.documentElement.classList.add('pc-device-blocked');
  location.replace(new URL('pc-required.html', location.href).href);
})();
