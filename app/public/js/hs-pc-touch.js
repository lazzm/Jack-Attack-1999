/* JackOS pointing device. The pad speaks the desktop's mouse/pointer protocol;
 * the screen and applications keep their native monitor coordinates. */
(function () {
  'use strict';
  const H = window.House, S = window.DesktopSurface;
  if (!H?.ok || !S || window.PCTouch) return;
  const coarse = matchMedia('(pointer:coarse), (hover:none)'), key = 'jhp_pc_trackpad';
  let preference = null;
  try { const v = localStorage.getItem(key); if (v !== null) preference = v === '1'; } catch (_) {}
  const enabled = () => preference === null ? coarse.matches : preference;
  const seated = () => H.mode === 'monitor' && S.ready() && (!window.AccountGate || AccountGate.allowed);
  const available = () => enabled() && seated() && !H.paused && !window.HousePause?.open && !document.hidden;
  const panel = document.createElement('section');
  panel.className = 'pc-touch'; panel.hidden = true; panel.setAttribute('aria-label', 'JackOS trackpad');
  panel.innerHTML = `<header><b>JackOS Trackpad</b><button type="button" data-pct="fold" aria-label="Minimise trackpad" aria-expanded="true">_</button></header>
    <div class="pc-touch-body"><p class="pc-touch-help">Move to point · Click twice to open · Two fingers scroll</p>
    <div class="pc-touch-area"><div class="pc-touch-pad" role="group" aria-label="Trackpad: drag to move the cursor; click to use"></div><div class="pc-touch-scroll" role="group" aria-label="Drag up or down to scroll"><span aria-hidden="true">▲<br>SCROLL<br>▼</span></div></div>
    <div class="pc-touch-buttons"><button type="button" data-pct="left">Left</button><button type="button" data-pct="double">Double</button><button type="button" data-pct="right">Right</button><button type="button" data-pct="drag" aria-pressed="false">Drag</button></div>
    <div class="pc-touch-tools"><button type="button" data-pct="type">Keyboard</button><button type="button" data-pct="lock">LOCK IN</button><button type="button" data-pct="menu">Menu</button></div>
    <div class="pc-touch-editor" hidden><label>Type in <span></span><input aria-label="Text entry" autocomplete="off" autocapitalize="off" spellcheck="false"><textarea aria-label="Text entry" autocomplete="off" autocapitalize="off" spellcheck="false" rows="2" hidden></textarea></label><div><button type="button" data-pct="enter">Enter</button><button type="button" data-pct="tab">Next field</button><button type="button" data-pct="done">Done</button></div></div>
    <output class="pc-touch-status" aria-live="polite">Left clicks; hold Left or press Drag to drag.</output></div>`;
  document.documentElement.appendChild(panel);
  const pad = panel.querySelector('.pc-touch-pad'), rail = panel.querySelector('.pc-touch-scroll');
  const editor = panel.querySelector('.pc-touch-editor'), status = panel.querySelector('output');
  const cursor = document.createElement('div'); cursor.className = 'pc-touch-cursor'; cursor.hidden = true;
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<svg viewBox="0 0 20 28" aria-hidden="true"><path d="M1 1v23l6-6 4 9 4-2-4-8h8Z" fill="#fff" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  S.root().appendChild(cursor);
  const id = -1999, fingers = new Map(), physical = new Map();
  let x = 512, y = 384, hover = null, capture = null, press = null, buttons = 0;
  let folded = false, dragging = false, scrolling = false, lastClick = null, visible = false;
  let textTarget = null, textChanged = false, field = null;
  let lastReserve = { bottom: 0, right: 0 };
  const button = name => panel.querySelector('[data-pct="' + name + '"]');
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const inside = el => !!el && S.root().contains(el) && !cursor.contains(el);
  function hit() {
    const p = S.client(x, y);
    return document.elementsFromPoint(p.x, p.y).find(inside) || S.root();
  }
  function options(extra = {}) {
    const p = S.client(x, y);
    return { bubbles: true, cancelable: true, view: window, clientX: p.x, clientY: p.y,
      screenX: p.x + window.screenX, screenY: p.y + window.screenY, button: 0, buttons,
      pointerId: id, pointerType: 'mouse', isPrimary: true, ...extra };
  }
  function send(target, type, extra) {
    if (!target) return true;
    // A synthetic pointer is not in the browser's active-pointer table. Scope
    // capture emulation to this dispatch and this ID; real mouse/touch methods
    // always delegate. Apps' existing setPointerCapture calls work unchanged.
    const proto = Element.prototype, originals = {};
    for (const name of ['setPointerCapture', 'releasePointerCapture', 'hasPointerCapture']) {
      originals[name] = proto[name];
      proto[name] = function (pointerId) {
        if (pointerId !== id) return originals[name]?.call(this, pointerId);
        if (name === 'hasPointerCapture') return capture === this;
        if (name === 'setPointerCapture') capture = this;
        else if (capture === this) capture = null;
      };
    }
    try {
      const Ctor = type.startsWith('pointer') ? PointerEvent : type === 'wheel' ? WheelEvent : MouseEvent;
      return target.dispatchEvent(new Ctor(type, options(extra)));
    } finally { for (const name in originals) proto[name] = originals[name]; }
  }
  function pointCursor() {
    x = clamp(x, 1, S.width() - 2); y = clamp(y, 1, S.height() - 2);
    cursor.style.left = x + 'px'; cursor.style.top = y + 'px';
    const a = S.client(x, y), b = S.client(x + 20, y);
    cursor.style.setProperty('--pc-cursor-scale', clamp(17 / Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), 1, 2.5));
  }
  function boundaries(next) {
    if (next === hover) return;
    const old = hover;
    if (old) {
      send(old, 'pointerout', { relatedTarget: next }); send(old, 'mouseout', { relatedTarget: next });
      for (let el = old; el && !el.contains(next); el = el.parentElement) {
        send(el, 'pointerleave', { bubbles: false, relatedTarget: next }); send(el, 'mouseleave', { bubbles: false, relatedTarget: next });
        if (el === S.root()) break;
      }
    }
    hover = next;
    if (next) {
      send(next, 'pointerover', { relatedTarget: old }); send(next, 'mouseover', { relatedTarget: old });
      const entering = [];
      for (let el = next; el && !el.contains(old); el = el.parentElement) { entering.push(el); if (el === S.root()) break; }
      entering.reverse().forEach(el => {
        send(el, 'pointerenter', { bubbles: false, relatedTarget: old }); send(el, 'mouseenter', { bubbles: false, relatedTarget: old });
      });
    }
  }
  function move(dx, dy) {
    const before = S.client(x, y);
    x += dx; y += dy; pointCursor(); cursor.hidden = false;
    const target = capture?.isConnected ? capture : hit(), after = S.client(x, y);
    if (!capture) boundaries(target);
    if (press && Math.hypot(x - press.x, y - press.y) > 4) press.moved = true;
    const movement = { button: -1, movementX: after.x - before.x, movementY: after.y - before.y };
    send(target, 'pointermove', movement); send(target, 'mousemove', movement);
    if (press?.range) rangeValue(press);
  }
  const editable = el => inside(el) && !el.disabled && !el.readOnly &&
    (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' && /^(text|search|url|email|tel|password|number)$/.test(el.type));
  function rememberText(el) {
    if (!editable(el) || el === textTarget) return;
    closeEditor(); textTarget = el;
  }
  function down(which = 0) {
    if (!available() || buttons) return;
    move(0, 0);
    const target = hit(); buttons = which === 2 ? 2 : 1;
    const now = performance.now(), detail = which === 0 && lastClick?.target === target && now - lastClick.time < 450 ? 2 : 1;
    press = { target, which, x, y, moved: false, detail };
    const started = press;
    const pointerOK = send(target, 'pointerdown', { button: which, detail });
    if (press !== started) return;
    const mouseOK = pointerOK && send(target, 'mousedown', { button: which, detail });
    if (press !== started) return;
    if (which === 0 && mouseOK) {
      const focus = target.closest('input,textarea,select,button,a[href],[tabindex],[contenteditable="true"]');
      if (focus && !focus.disabled) {
        focus.focus({ preventScroll: true }); rememberText(focus);
        if (focus.tagName === 'SELECT') started.select = focus;
        if (focus.tagName === 'INPUT' && focus.type === 'range') {
          started.range = focus; started.rangeStart = focus.value;
          if (!capture) capture = focus;
          rangeValue(started);
        }
      }
      else if (inside(document.activeElement)) document.activeElement.blur();
    }
  }
  function rangeValue(state) {
    const el = state.range, r = S.rect(el), style = getComputedStyle(el);
    const vertical = style.writingMode.startsWith('vertical') || el.getAttribute('orient') === 'vertical';
    let fraction = vertical ? (y - r.top - 7) / Math.max(1, r.height - 14) : (x - r.left - 7) / Math.max(1, r.width - 14);
    if (style.direction === 'rtl') fraction = 1 - fraction;
    const min = el.min === '' ? 0 : Number(el.min), max = el.max === '' ? 100 : Number(el.max), old = el.value;
    el.value = String(min + clamp(fraction, 0, 1) * (max - min));
    if (el.value !== old) el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function selectMenu(el) {
    if (!window.IE?.menu || !el.isConnected) return;
    // Native select popups cannot be opened by an untrusted mouse click. Use
    // JackOS's own menus, preserving disabled options, values and change events.
    const items = [...el.options].map(option => ({
      label: option.label || option.textContent, chk: option.selected,
      dis: option.disabled || !!option.closest('optgroup[disabled]'),
      act: () => {
        const before = [...el.selectedOptions];
        if (el.multiple) option.selected = !option.selected; else el.selectedIndex = option.index;
        if (before.length !== el.selectedOptions.length || before.some((v, i) => v !== el.selectedOptions[i])) {
          el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }));
    const r = S.rect(el), client = S.client(r.left, r.bottom);
    IE.menu(items, client.x, client.y);
  }
  function up(cancel = false) {
    if (!press) { buttons = 0; capture = null; return; }
    const was = press, target = capture || was.target, under = hit();
    press = null; buttons = 0;
    if (cancel) send(target, 'pointercancel', { button: was.which });
    // Some games release held fire only on pointerup, while window and card
    // drags cancel on pointercancel. Deliver both on teardown, with no click.
    send(target, 'pointerup', { button: was.which, detail: was.detail });
    if (!target.isConnected) send(S.root(), 'pointerup', { button: was.which, detail: was.detail });
    send(target, 'mouseup', { button: was.which, detail: was.detail });
    capture = null;
    if (was.range?.isConnected && was.range.value !== was.rangeStart) was.range.dispatchEvent(new Event('change', { bubbles: true }));
    if (!cancel && !was.moved && was.target.isConnected && (was.target === under || was.target.contains(under))) {
      if (was.which === 2) { send(was.target, 'auxclick', { button: 2 }); send(was.target, 'contextmenu', { button: 2 }); }
      else {
        const allowed = send(was.target, 'click', { detail: was.detail });
        if (allowed && was.select) selectMenu(was.select);
        if (was.detail === 2) { send(was.target, 'dblclick', { detail: 2 }); lastClick = null; }
        else lastClick = { target: was.target, time: performance.now() };
      }
    }
    boundaries(under);
  }
  function click(which = 0) { if (!buttons) { down(which); up(); } }
  function scroll(dx, dy) {
    if (!available()) return;
    const target = hit();
    if (!send(target, 'wheel', { deltaX: dx, deltaY: dy, deltaMode: 0 })) return;
    // Untrusted wheel events do not perform the browser's default scrolling.
    // Reproduce scroll chaining, including a nested pane reaching its edge.
    let rx = dx, ry = dy;
    for (let el = target; inside(el) && (rx || ry); el = el.parentElement) {
      const style = getComputedStyle(el), ox = el.scrollLeft, oy = el.scrollTop;
      if (/(auto|scroll|overlay)/.test(style.overflowX)) el.scrollLeft += rx;
      if (/(auto|scroll|overlay)/.test(style.overflowY)) el.scrollTop += ry;
      rx -= el.scrollLeft - ox; ry -= el.scrollTop - oy;
      if (el === S.root()) break;
    }
  }
  function releasePointers() {
    for (const pointerId of physical.keys()) { try { if (panel.hasPointerCapture(pointerId)) panel.releasePointerCapture(pointerId); } catch (_) {} }
    physical.clear(); fingers.clear(); scrolling = false;
  }
  function reset() {
    up(true); dragging = false; releasePointers(); lastClick = null;
    button('drag').setAttribute('aria-pressed', 'false');
    panel.querySelectorAll('.pc-touch-held').forEach(el => el.classList.remove('pc-touch-held'));
    boundaries(null);
  }
  function closeEditor() {
    if (textTarget?.isConnected && textChanged) textTarget.dispatchEvent(new Event('change', { bubbles: true }));
    textChanged = false;
    if (editor.contains(document.activeElement)) document.activeElement.blur();
    editor.hidden = true; field = null; panel.classList.remove('pc-touch-typing');
  }
  function type() {
    if (!editable(textTarget)) {
      const target = hit().closest('input,textarea');
      if (editable(target)) rememberText(target);
    }
    if (!editable(textTarget)) { status.textContent = 'Click a text box first, then press Keyboard.'; return; }
    reset();
    const multiline = textTarget.tagName === 'TEXTAREA';
    editor.querySelector('span').textContent = textTarget.getAttribute('aria-label') || textTarget.placeholder || textTarget.name || 'the selected text box';
    const single = editor.querySelector('input'), multi = editor.querySelector('textarea');
    single.hidden = multiline; multi.hidden = !multiline; field = multiline ? multi : single;
    single.type = textTarget.type === 'password' ? 'password' : 'text';
    field.inputMode = textTarget.inputMode || (textTarget.type === 'number' ? 'decimal' : textTarget.type === 'email' ? 'email' : 'text');
    field.maxLength = textTarget.maxLength >= 0 ? textTarget.maxLength : 524288;
    field.value = textTarget.value; editor.hidden = false; panel.classList.add('pc-touch-typing'); folded = false; sync();
    field.focus({ preventScroll: true });
    try { field.setSelectionRange(textTarget.selectionStart ?? field.value.length, textTarget.selectionEnd ?? field.value.length); } catch (_) {}
    status.textContent = 'Typing goes to the selected JackOS text box.';
  }
  editor.addEventListener('input', ev => {
    if (ev.target !== field || !editable(textTarget)) return;
    const before = new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: ev.inputType || 'insertText', data: ev.data, isComposing: ev.isComposing });
    if (!textTarget.dispatchEvent(before)) { field.value = textTarget.value; return; }
    textTarget.value = field.value;
    try { textTarget.setSelectionRange(field.selectionStart, field.selectionEnd); } catch (_) {}
    textTarget.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: ev.inputType || 'insertText', data: ev.data, isComposing: ev.isComposing }));
    textChanged = true;
  });
  function enter(shiftKey = false) {
    if (!editable(textTarget)) return;
    const target = textTarget;
    const init = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, shiftKey, bubbles: true, cancelable: true };
    const ok = target.dispatchEvent(new KeyboardEvent('keydown', init));
    target.dispatchEvent(new KeyboardEvent('keyup', init));
    if (ok && target.tagName === 'TEXTAREA' && field) {
      field.setRangeText('\n', field.selectionStart, field.selectionEnd, 'end');
      field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertLineBreak', data: '\n' }));
    } else if (ok && target.form) {
      if (target.checkValidity()) target.form.requestSubmit();
      else status.textContent = target.validationMessage;
    }
  }
  editor.addEventListener('keydown', ev => {
    if (ev.target !== field || ev.isComposing) return;
    if (ev.key === 'Enter') { ev.preventDefault(); enter(ev.shiftKey); }
    else if (ev.key === 'Tab') { ev.preventDefault(); nextField(ev.shiftKey ? -1 : 1); }
  });
  function nextField(direction = 1) {
    const fields = [...S.root().querySelectorAll('input,textarea')].filter(el => editable(el) && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    if (!fields.length) return;
    const next = fields[(Math.max(0, fields.indexOf(textTarget)) + direction + fields.length) % fields.length];
    rememberText(next); type();
  }
  function command(name) {
    if (name === 'fold') { reset(); closeEditor(); folded = !folded; sync(); }
    else if (name === 'double') { lastClick = null; click(); click(); }
    else if (name === 'drag') {
      if (dragging) { up(); dragging = false; }
      else { down(); dragging = !!press; }
      button('drag').setAttribute('aria-pressed', String(dragging));
      status.textContent = dragging ? 'Left held. Move the cursor; press Drag again to release.' : 'Left released.';
    } else if (name === 'type') type();
    else if (name === 'done') { closeEditor(); sync(); }
    else if (name === 'enter') enter();
    else if (name === 'tab') nextField();
    else if (name === 'lock') { reset(); window.ScreenLock?.toggle(); }
    else if (name === 'menu') window.HousePause?.show();
  }
  function centroid() { const all = [...fingers.values()]; return { x: all.reduce((n, p) => n + p.x, 0) / all.length, y: all.reduce((n, p) => n + p.y, 0) / all.length }; }
  function raw(ev) {
    const own = panel.contains(ev.target), tracked = physical.get(ev.pointerId);
    if (!own && !tracked) return;
    // Stop the physical pad pointer reaching document-level desktop menu/drag
    // handlers. Only the translated mouse is allowed to operate JackOS.
    ev.stopImmediatePropagation();
    if (editor.contains(ev.target) && /^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) return;
    if (ev.cancelable) ev.preventDefault();
    if (ev.type === 'pointerdown') {
      if (!available()) return;
      const zone = pad.contains(ev.target) ? 'pad' : rail.contains(ev.target) ? 'scroll' : ev.target.closest('[data-pct]')?.dataset.pct;
      if (!zone) return;
      const p = { zone, x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, distance: 0, time: performance.now(), el: ev.target.closest('button') };
      physical.set(ev.pointerId, p);
      try { panel.setPointerCapture(ev.pointerId); } catch (_) {}
      if (zone === 'pad') {
        fingers.set(ev.pointerId, p);
        if (fingers.size > 1) { scrolling = true; lastClick = null; if (buttons) { up(true); dragging = false; button('drag').setAttribute('aria-pressed', 'false'); } }
      } else if (zone === 'left' || zone === 'right') {
        if (dragging) { up(true); dragging = false; button('drag').setAttribute('aria-pressed', 'false'); }
        down(zone === 'right' ? 2 : 0); if (physical.has(ev.pointerId)) p.el?.classList.add('pc-touch-held');
      }
    } else if (ev.type === 'pointermove' && tracked) {
      const before = fingers.size ? centroid() : null, dx = ev.clientX - tracked.x, dy = ev.clientY - tracked.y;
      tracked.distance += Math.hypot(dx, dy); tracked.x = ev.clientX; tracked.y = ev.clientY;
      if (tracked.zone === 'scroll') scroll(0, -dy * 3);
      else if (tracked.zone === 'pad') {
        if (scrolling && fingers.size > 1) { const after = centroid(); scroll((before.x - after.x) * 3, (before.y - after.y) * 3); }
        else if (!scrolling) move(dx * 2.4, dy * 2.4);
      }
    } else if (tracked && ['pointerup', 'pointercancel', 'lostpointercapture'].includes(ev.type)) {
      const cancel = ev.type !== 'pointerup';
      physical.delete(ev.pointerId); fingers.delete(ev.pointerId);
      tracked.el?.classList.remove('pc-touch-held');
      if (tracked.zone === 'left' || tracked.zone === 'right') up(cancel);
      else if (tracked.zone === 'pad' && !cancel && !scrolling && !dragging && !buttons && tracked.distance < 7 && performance.now() - tracked.time < 500) click();
      else if (cancel && buttons) { up(true); dragging = false; button('drag').setAttribute('aria-pressed', 'false'); }
      else if (!cancel && !['pad', 'scroll'].includes(tracked.zone) && tracked.distance < 14) command(tracked.zone);
      if (!fingers.size) scrolling = false;
      try { if (panel.hasPointerCapture(ev.pointerId)) panel.releasePointerCapture(ev.pointerId); } catch (_) {}
    }
  }
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture']) addEventListener(type, raw, { capture: true, passive: false });
  for (const type of ['touchstart', 'touchmove', 'touchend', 'contextmenu', 'mousedown', 'mouseup']) addEventListener(type, ev => {
    if (!panel.contains(ev.target)) return;
    ev.stopImmediatePropagation();
    if (!(editor.contains(ev.target) && /^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) && ev.cancelable) ev.preventDefault();
  }, { capture: true, passive: false });
  addEventListener('click', ev => {
    if (!panel.contains(ev.target)) return;
    ev.stopImmediatePropagation();
    const b = ev.target.closest('[data-pct]');
    if (b && ev.detail === 0 && available()) {
      if (['left', 'right'].includes(b.dataset.pct)) click(b.dataset.pct === 'right' ? 2 : 0);
      else command(b.dataset.pct);
    }
  }, true);
  panel.addEventListener('wheel', ev => { ev.preventDefault(); ev.stopPropagation(); scroll(ev.deltaX, ev.deltaY); }, { passive: false });
  document.addEventListener('focusin', ev => { if (inside(ev.target)) rememberText(ev.target); });
  addEventListener('pointermove', ev => { if (ev.isTrusted && ev.pointerType === 'mouse' && !panel.contains(ev.target)) cursor.hidden = true; }, true);
  function reserve() {
    const vv = window.visualViewport;
    const keyboardInset = Math.max(0, innerHeight - ((vv?.height || innerHeight) + (vv?.offsetTop || 0)));
    // Keep the editor above the real keyboard without changing JackOS geometry.
    panel.style.bottom = keyboardInset + 10 + 'px';
    panel.style.maxHeight = Math.max(100, (vv?.height || innerHeight) - 20) + 'px';
    const r = panel.getBoundingClientRect();
    const landscape = innerWidth > innerHeight && innerHeight < 600;
    // Renderer contract: subtract these CSS-pixel insets when fitting the 4:3
    // PC view, in-world or LOCK IN. Do not resize the 1024x768 JackOS surface.
    let bottom = visible ? keyboardInset + (landscape ? 0 : r.height + 18) : 0;
    let right = visible && landscape ? r.width + 18 : 0;
    // A pause modal temporarily hides input controls; the monitor must stay put.
    if (!visible && enabled() && seated() && (H.paused || window.HousePause?.open)) ({ bottom, right } = lastReserve);
    else lastReserve = { bottom, right };
    const html = document.documentElement;
    let changed = false;
    for (const [name, value] of [['--pc-touch-reserve-bottom', bottom], ['--pc-touch-reserve-right', right]]) {
      const px = value + 'px'; if (html.style.getPropertyValue(name) !== px) { html.style.setProperty(name, px); changed = true; }
    }
    if (changed) document.dispatchEvent(new CustomEvent('pc-trackpad-layout', { detail: { bottom, right } }));
  }
  function sync() {
    const show = available();
    if (visible && !show) { reset(); closeEditor(); textTarget = null; }
    if (textTarget && !editable(textTarget)) { closeEditor(); textTarget = null; }
    visible = show; panel.hidden = !show;
    panel.classList.toggle('pc-touch-folded', folded);
    button('fold').textContent = folded ? '▣' : '_';
    button('fold').setAttribute('aria-label', folded ? 'Restore trackpad' : 'Minimise trackpad');
    button('fold').setAttribute('aria-expanded', String(!folded));
    document.documentElement.classList.toggle('pc-touch-active', show);document.documentElement.classList.toggle('pc-touch-expanded',show&&!folded);
    cursor.hidden = !show || folded;
    button('lock').textContent = H.desktopDisplay() ? 'IN ROOM' : 'LOCK IN';
    if (show) pointCursor();
    reserve();
  }
  window.PCTouch = {
    get enabled() { return enabled(); },
    setEnabled(value) { reset(); closeEditor(); preference = !!value; try { localStorage.setItem(key, preference ? '1' : '0'); } catch (_) {} sync(); document.dispatchEvent(new Event('pc-trackpad-change')); },
    reset() { reset(); closeEditor(); }, sync,
    get state() { return { x, y, buttons, dragging, captured: !!capture, pointers: physical.size, visible, folded }; }
  };
  H.on('mode', sync); H.on('sat', sync); H.on('stood', sync); H.on('pcpower', sync);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => { if (available() !== visible || H.desktopDisplay() !== (button('lock').textContent === 'IN ROOM')) sync(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  new ResizeObserver(reserve).observe(panel);
  coarse.addEventListener('change', sync);
  window.Net?.on('testResetResult', () => { reset(); closeEditor(); textTarget = null; sync(); });
  addEventListener('blur', () => { reset(); closeEditor(); });
  addEventListener('pagehide', () => { reset(); closeEditor(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { reset(); closeEditor(); } sync(); });
  addEventListener('resize', () => { reset(); sync(); });
  window.visualViewport?.addEventListener('resize', reserve);
  window.visualViewport?.addEventListener('scroll', reserve);
  sync();
})();
