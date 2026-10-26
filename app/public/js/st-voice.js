/* Recorded lines are opt-in: add lineId: '/audio/voice/<lineId>.mp3' after the file exists. */
(function () {
  'use strict';
  const manifest = Object.freeze({});
  let active = null;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function stop() { if (active) { active.pause(); active = null; } }
  function say(lineId, who, text) {
    window.Room?.say(String(who), esc(text), 4200);
    stop();
    if (!Object.prototype.hasOwnProperty.call(manifest, lineId) || !window.Sound?.effectsOn || !Sound.volume) return;
    active = new Audio(manifest[lineId]); active.volume = Sound.volume;
    active.play().catch(() => {});
  }
  document.addEventListener('audiochange', () => { if (!window.Sound?.effectsOn || !Sound.volume) stop(); else if (active) active.volume = Sound.volume; });
  window.st = { say, voice: manifest, stopVoice: stop };
})();
