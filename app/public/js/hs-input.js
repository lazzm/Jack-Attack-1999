/* PC input shared by the room and JackOS. Only hardware activity changes mode;
 * keyboard and mouse belong to the same desktop control family. */
(function () {
  'use strict';
  if (window.GameInput) return;
  let mode = 'mouse', lastDirect = mode, composing = false;
  const pads = new Map(); let timer = 0;
  const editable = el => !!el?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
  function publish(next, reason) {
    if (next === mode) return;
    const previous = mode; mode = next; if (next !== 'gamepad') lastDirect = next;
    mark();
    document.dispatchEvent(new CustomEvent('game-input-change', { bubbles: true, detail: { mode, currentInput: mode, touch: false, previous, reason } }));
  }
  function mark() { document.documentElement.dataset.gameInput = mode; document.documentElement.dataset.gameTouch = 'false'; }
  function pointer(ev) {
    if (!ev.isTrusted) return;
    // Touch-generated compatibility mouse events are not a physical mouse.
    if (ev.sourceCapabilities?.firesTouchEvents) return;
    if (ev.pointerType === 'mouse' && (ev.type !== 'pointermove' || ev.movementX || ev.movementY)) publish('mouse', 'mouse');
  }
  window.addEventListener('pointerdown', pointer, true);
  window.addEventListener('pointermove', pointer, { capture: true, passive: true });
  window.addEventListener('compositionstart', ev => { if (ev.isTrusted) composing = true; }, true);
  window.addEventListener('compositionend', ev => { if (ev.isTrusted) composing = false; }, true);
  window.addEventListener('keydown', ev => {
    if (!ev.isTrusted || composing || ev.isComposing || ev.keyCode === 229 || ev.key === 'Process' || ev.key === 'Unidentified' || !ev.code || ev.code === 'Unidentified' || editable(ev.target) || editable(document.activeElement)) return;
    publish('keyboard', 'hardware-key');
  }, true);
  function poll() {
    timer = 0; if (document.hidden) return;
    let connected = [];
    try { connected = Array.from(navigator.getGamepads?.() || []).filter(p => p?.connected); } catch (_) {}
    const seen = new Set(); let activity = false;
    for (const pad of connected) {
      seen.add(pad.index);
      const buttons = pad.buttons.map(b => !!b.pressed), axes = Array.from(pad.axes || [], v => Math.abs(v) > .25 ? v : 0), old = pads.get(pad.index);
      // Held controls/drifting axes cannot steal focus back every polling step.
      if (buttons.some((b, i) => b && !old?.buttons[i]) || axes.some((v, i) => v && Math.abs(v - (old?.axes[i] || 0)) > .2)) activity = true;
      pads.set(pad.index, { buttons, axes });
    }
    for (const index of pads.keys()) if (!seen.has(index)) pads.delete(index);
    if (activity) publish('gamepad', 'gamepad-control');
    else if (mode === 'gamepad' && !connected.length) publish(lastDirect, 'gamepad-disconnected');
    timer = setTimeout(poll, 160);
  }
  document.addEventListener('visibilitychange', () => { clearTimeout(timer); timer = 0; if (document.hidden) { pads.clear(); composing = false; } else poll(); });
  window.addEventListener('gamepadconnected', () => { clearTimeout(timer); poll(); });
  window.addEventListener('gamepaddisconnected', () => { clearTimeout(timer); poll(); });
  window.addEventListener('blur', () => { composing = false; });
  window.GameInput = Object.freeze({ get mode() { return mode; }, get currentInput() { return mode; }, get currentinput() { return mode; }, get touch() { return false; } });
  mark(); poll();
})();
