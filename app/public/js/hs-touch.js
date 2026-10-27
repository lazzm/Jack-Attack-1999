/* hs-touch: the house on a touchscreen (owner's device policy, 2026-10-26). Shown only while touch is the input in use
 * (js/hs-input.js), so a touchscreen laptop with a mouse keeps the desktop prompts.
 *   left thumb : a floating stick wherever it lands on the left of the screen; push to the rim and beyond to jog
 *   right thumb: drag anywhere to look (sensitivity in the game menu); a short click on a thing uses it, like the mouse
 *   buttons    : only what is possible right now, with an icon and a short label: Use [F], Pick up / Place [E],
 *                Turn [R], Drop [X], Return [Q], nearer/further, Jump, Crouch, and the game menu (top right)
 *   the PC     : direct touch on JackOS; phones LOCK IN to a full-screen desktop on sitting down; Stand up / LOCK IN buttons
 *   consoles   : their own controller pad (js/rm-tv.js and each cartridge), the Game Lad its moulded buttons
 * Every button sends the same key the desktop uses (onKey in js/hs-world.js), so there is one set of rules. */
(function () {
  'use strict';
  const H = window.House, html = document.documentElement;
  if (!H || !H.ok || !H.touch || window.HouseTouch) return;
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const touchOn = () => !!window.GameInput?.touch;
  const phone = () => Math.min(innerWidth, innerHeight) < 600;
  let sens = clamp(+ls.get('jhp_touch_look', 1) || 1, .4, 2.5);

  // ---------------------------------------------------------------- icons (24x24, drawn in the HUD's ink colour)
  const P = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${extra}/></svg>`;
  const ICON = {
    use: P('M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.6-2.2L3.6 15a1.6 1.6 0 0 1 2.4-2l3 2.5'),
    look: P('M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'),
    grab: P('M12 3v12m-5-5 5 5 5-5M5 21h14'),
    place: P('M12 21V9m-5 5 5-5 5 5M5 3h14'),
    turn: P('M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5'),
    drop: P('M12 3v10m-4-4 4 4 4-4M6 17l-2 4h16l-2-4'),
    back: P('M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3'),
    jump: P('M6 15l6-6 6 6M6 21l6-6 6 6'),
    crouch: P('M6 3l6 6 6-6M6 9l6 6 6-6M5 21h14'),
    menu: P('M4 6h16M4 12h16M4 18h16'),
    stand: P('M12 4a2 2 0 1 0 0 .01M9 21l1.5-7L8 11l4-3 4 3-2.5 3L15 21'),
    lock: P('M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'),
    room: P('M9 4v5H4m11-5v5h5M9 20v-5H4m11 5v-5h5'),
    near: P('M5 12h14'),
    far: P('M5 12h14M12 5v14'),
    sit: P('M6 21v-7h12v7M6 14V5h4v9m8 0V9'),
  };

  // ---------------------------------------------------------------- the layer: a surface for the thumbs, and the HUD
  const surface = document.createElement('div'); surface.className = 'ht-surface'; surface.setAttribute('aria-hidden', 'true');
  const hud = document.createElement('div'); hud.className = 'ht-hud';
  hud.innerHTML = `<div class="ht-stick" aria-hidden="true"><i></i></div>
    <div class="ht-target" aria-live="polite"><b></b></div>
    <div class="ht-acts" role="toolbar" aria-label="Actions"></div>
    <div class="ht-top" role="toolbar" aria-label="Game"><button type="button" class="ht-b ht-menu" data-k="menu" aria-label="Game menu">${ICON.menu}<span>Menu</span></button></div>`;
  html.append(surface, hud);
  const stickEl = hud.querySelector('.ht-stick'), knob = stickEl.querySelector('i'), acts = hud.querySelector('.ht-acts'), top = hud.querySelector('.ht-top'), target = hud.querySelector('.ht-target');

  // ---------------------------------------------------------------- what the player is doing (one place, read every frame we need it)
  function state() {
    if (!H.live || !touchOn() || H.paused || window.HousePause?.open || html.classList.contains('account-required') || document.querySelector('.hs-loading,#houseEntry')) return 'off';
    if (H.mode === 'inspect') return 'inspect';
    if (['monitor', 'pcboot', 'sit', 'stand', 'shutdown'].includes(H.mode) || document.body.classList.contains('pc-monitor')) return 'pc';
    if (window.RoomTV?.open_) return 'console';
    if (H.mode === 'focus') return H.seated ? 'seat' : 'screen';
    if (H.mode === 'walk' || H.mode === 'glide') return 'walk';
    return 'off';
  }
  let st = 'off';
  function syncState() {
    const next = state();
    if (next !== st) {
      const old = st; st = next; html.dataset.touchState = st;
      if (!['walk', 'seat'].includes(st)) releaseAll();
      if (st === 'pc' && old !== 'pc') pcArrived();
      if (st === 'walk') setTimeout(() => { if (st === 'walk') coach(true); }, 1200); else coach(false);
      lastKey = ''; render();
    }
    return st;
  }

  // ---------------------------------------------------------------- thumbs: stick (left) and look (right)
  const pts = new Map(); let stick = null, look = null;
  const R = () => clamp(Math.min(innerWidth, innerHeight) * .15, 46, 70); // the stick's travel, in CSS px
  function releaseAll() {
    pts.clear(); stick = look = null; H.touch.move(0, 0); stickEl.classList.remove('on', 'run');
    knob.style.transform = ''; stickEl.style.removeProperty('left'); stickEl.style.removeProperty('top');
  }
  function stickSide(x, y) { return x < innerWidth * (innerWidth > innerHeight ? .42 : .5) && y > innerHeight * .28; }
  surface.addEventListener('pointerdown', ev => {
    if (!['walk', 'seat'].includes(syncState())) return;
    ev.preventDefault();
    try { surface.setPointerCapture(ev.pointerId); } catch (e) {}
    if (!stick && stickSide(ev.clientX, ev.clientY)) {
      // (a still, short press on this side is still a click on the thing under it: the stick only walks once it moves)
      stick = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, sx: ev.clientX, sy: ev.clientY, t0: performance.now(), moved: false, aim: H.held() ? null : aimPoint(ev.clientX, ev.clientY) }; tapMark(stick.aim, ev.clientX, ev.clientY);
      stickEl.classList.add('on'); stickEl.style.left = ev.clientX + 'px'; stickEl.style.top = ev.clientY + 'px'; knob.style.transform = '';
    } else if (!look) { look = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, t0: performance.now(), moved: false }; look.aim = H.held() ? null : aimPoint(ev.clientX, ev.clientY); tapMark(look.aim, ev.clientX, ev.clientY); }
    coach(false);
    pts.set(ev.pointerId, true);
  });
  surface.addEventListener('pointermove', ev => {
    if (stick && ev.pointerId === stick.id) {
      ev.preventDefault();
      const r = R(); let dx = ev.clientX - stick.x0, dy = ev.clientY - stick.y0; const d = Math.hypot(dx, dy);
      // A thumb that runs past the rim drags the stick along with it (floating), and jogs.
      if (!stick.moved && Math.hypot(ev.clientX - stick.sx, ev.clientY - stick.sy) > 12) { stick.moved = true; tapMark(null); }
      if (!stick.moved) return;
      const run = d > r * 1.18;
      if (d > r * 1.6) { const k = (d - r * 1.6) / d; stick.x0 += dx * k; stick.y0 += dy * k; dx = ev.clientX - stick.x0; dy = ev.clientY - stick.y0; stickEl.style.left = stick.x0 + 'px'; stickEl.style.top = stick.y0 + 'px'; }
      const m = Math.min(1, Math.hypot(dx, dy) / r), a = Math.atan2(dy, dx), dead = .14;
      const amt = m < dead ? 0 : (m - dead) / (1 - dead);
      knob.style.transform = `translate(${Math.cos(a) * Math.min(r, Math.hypot(dx, dy))}px,${Math.sin(a) * Math.min(r, Math.hypot(dx, dy))}px)`;
      stickEl.classList.toggle('run', run && amt > .5);
      if (amt && H.seated && H.mode === 'focus') { H.unfocus(); return; } // (like the keys: walking gets you up first)
      H.touch.move(Math.cos(a) * amt, -Math.sin(a) * amt, run);
      return;
    }
    if (look && ev.pointerId === look.id) {
      ev.preventDefault();
      const dx = ev.clientX - look.x, dy = ev.clientY - look.y; look.x = ev.clientX; look.y = ev.clientY;
      if (!look.moved && Math.hypot(ev.clientX - look.x0, ev.clientY - look.y0) > 9) { look.moved = true; tapMark(null); }
      if (look.moved) {
        // gentle acceleration: slow drags aim precisely, a quick flick turns round
        const t = performance.now(), dt = Math.max(8, t - (look.t || t - 16)); look.t = t;
        const speed = Math.hypot(dx, dy) / dt, accel = 1 + clamp(speed - .35, 0, 1.4) * .9;
        const k = .24 * sens * accel * 400 / clamp(Math.min(innerWidth, innerHeight), 320, 900); H.touch.look(dx * k, dy * k * .85);
      }
    }
  });
  function lift(ev) {
    if (stick && ev.pointerId === stick.id) {
      const s0 = stick; stick = null; tapMark(null); H.touch.move(0, 0); stickEl.classList.remove('on', 'run'); knob.style.transform = '';
      if (ev.type === 'pointerup' && !s0.moved && (s0.aim || performance.now() - s0.t0 < 400) && ['walk', 'seat'].includes(st) && !H.busy) {
        if (H.held()) { const hold = document.querySelector('.hs-ui .hs-hold'); if (!hold?.classList.contains('blocked')) press('e'); }
        else if (s0.aim) { H.useAt(ev.clientX, ev.clientY); if (!s0.aim.far) buzz(); }
        lastKey = ''; setTimeout(render, 80);
      }
    }
    if (look && ev.pointerId === look.id) {
      const l = look; look = null;
      tapMark(null);
      // A short, still press in the room is a click on what is under the finger: it does what the label said (pick up,
      // open, talk, sit...). Carrying something, a click puts it down where its ghost shows.
      if (ev.type === 'pointerup' && !l.moved && (l.aim || H.held() || performance.now() - l.t0 < 450) && ['walk', 'seat'].includes(st) && !H.busy) { // (press, read the label, let go to do it; drag away to cancel)
        if (H.held()) { const hold = document.querySelector('.hs-ui .hs-hold'); if (!hold?.classList.contains('blocked')) press('e'); }
        else if (l.aim && !l.aim.far) { H.useAt(ev.clientX, ev.clientY); buzz(); }
        else H.useAt(ev.clientX, ev.clientY); // (too far: the house says "move closer")
        lastKey = ''; setTimeout(render, 80);
      }
    }
    pts.delete(ev.pointerId);
  }
  for (const n of ['pointerup', 'pointercancel', 'lostpointercapture']) surface.addEventListener(n, lift);
  surface.addEventListener('contextmenu', ev => ev.preventDefault());
  addEventListener('blur', releaseAll); document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

  // What a click at a screen point would do (the same picking as the mouse): a name and a verb, or null.
  function aimPoint(x, y) {
    if (H.busy) return null;
    let h = null; try { h = H.pick(x, y); } catch (e) { return null; }
    const s = h && h.spot && H.SPOTS[h.spot]; if (!s || s.off) return null;
    const label = short(typeof s.label === 'function' ? s.label() : s.label), t = H.THINGS[s.id];
    // exactly what a click does (useAt in js/hs-world.js): take out, pick up, or the spot's own action
    let door = H.DOORS[s.id] || null; // (a door leaf: its spot's mesh hangs off the door's pivot, as hs-world's doorOf finds)
    if (!door) for (const d of Object.values(H.DOORS)) { if (!d.pivot) continue; for (let o = s.obj || h.obj; o; o = o.parent) if (o === d.pivot) { door = d; break; } if (door) break; }
    const verb = s.remove && !s.grab ? 'Take out' : s.grab && t && !s.use ? 'Pick up' : door ? (door.open ? 'Shut' : 'Open') : verbOf(label);
    return { id: s.id, label, verb, far: h.dist > s.range };
  }
  // the finger's label: what letting go here will do (or "walk closer"), drawn just above the thumb
  const mark = document.createElement('div'); mark.className = 'ht-tapmark'; mark.setAttribute('aria-hidden', 'true'); hud.appendChild(mark);
  function tapMark(a, x, y) {
    if (!a) { mark.classList.remove('on'); return; }
    mark.innerHTML = '<b>' + esc(a.far ? 'Walk closer' : a.verb) + '</b><span>' + esc(a.label) + '</span>';
    mark.classList.toggle('far', !!a.far); mark.style.left = clamp(x, 70, innerWidth - 70) + 'px'; mark.style.top = Math.max(60, y - 64) + 'px'; mark.classList.add('on');
  }
  const buzz = () => { try { navigator.vibrate?.(10); } catch (e) {} };
  // first time on a touchscreen: three quiet coach marks, shown once (any thumb on the room dismisses them)
  let coachEl = null;
  function coach(show) {
    if (show) {
      if (coachEl || ls.get('jhp_touch_coach', false)) return;
      coachEl = document.createElement('div'); coachEl.className = 'ht-coach'; coachEl.setAttribute('role', 'note');
      coachEl.innerHTML = '<div class="ht-coach-card"><b>HOW TO PLAY</b><p><i>LEFT THUMB</i>walk: put it down anywhere on the left and slide it (further to jog)</p><p><i>RIGHT SIDE</i>drag to look round</p><p><i>CLICK THINGS</i>to use them: doors, people, games. The big button uses what is in the middle.</p></div>';
      hud.appendChild(coachEl); setTimeout(() => coach(false), 14000); return;
    }
    if (!coachEl) return; coachEl.classList.add('bye'); const el = coachEl; coachEl = null; ls.set('jhp_touch_coach', true); setTimeout(() => el.remove(), 400);
  }

  // ---------------------------------------------------------------- the contextual buttons
  const key = (k, up) => window.dispatchEvent(new KeyboardEvent(up ? 'keyup' : 'keydown', { key: k, bubbles: true, cancelable: true }));
  const press = k => { key(k); key(k, true); };
  const crouched = () => !!H._?.movementState?.().keys.crouch;
  function doAction(k) {
    switch (k) {
      case 'menu': window.HousePause?.show(); break;
      case 'f': case 'e': case 'r': case 'x': case 'q': case '+': case '-': press(k); break;
      case 'jump': press(' '); break;
      case 'crouch': if (H.crouchSetting()) key('c'); else if (crouched()) key('c', true); else key('c'); break;
      case 'stand': window.HousePause?.quickBack(); break;
      case 'lock': window.ScreenLock?.toggle(); break;
    }
    lastKey = ''; setTimeout(render, 60); setTimeout(render, 260);
  }
  for (const box of [acts, top]) {
    box.addEventListener('pointerdown', ev => { if (ev.target.closest('button')) ev.preventDefault(); });
    box.addEventListener('click', ev => { const b = ev.target.closest('button[data-k]'); if (b && !b.disabled) { ev.preventDefault(); doAction(b.dataset.k); } });
  }
  const btn = (k, icon, label, cls = '', disabled = false) => `<button type="button" class="ht-b ${cls}" data-k="${k}"${disabled ? ' disabled' : ''} aria-label="${esc(label)}">${ICON[icon]}<span>${esc(label)}</span></button>`;
  // A spot's own label is a name ("Band poster"); the button wants a verb. Labels that already start with one keep it.
  const VERB = /^(Open|Shut|Close|Turn on|Turn off|Turn|Switch on|Switch off|Switch|Play|Read|Look|Sit|Use|Plug in|Unplug|Press|Answer|Pick up|Put|Ring|Watch|Listen|Feed|Pet|Lie|Get in|Get|Take|Wind|Water|Empty|Check|Raid|Set|Unbox|Wash|Mow|Fill|Eat|Drink|Talk|Knock|Sleep|Wake|Lock|Unlock|Insert|Eject|Flip|Draw|Pull|Push|Tidy|Clean)\b/i;
  const verbOf = label => { const m = String(label || '').match(VERB); return m ? m[1].replace(/^./, c => c.toUpperCase()) : 'Use'; };
  const short = s => String(s || '').replace(/\s*\[[^\]]*\]\s*$/, '').replace(/\s*\(.*\)$/, '').replace(/^F:\s*/, '').trim();
  const thingVerb = t => !t?.use || t.useLabel === 'Inspect' ? 'Look closely' : t.useLabel || 'Use';
  let aim = null, aimAt = 0, aimPose = '', lastKey = '';
  function aimed() {
    // (a raycast through every visible mesh: only when the view has really changed, at most ~4 times a second)
    const now = performance.now(), P = H.P, pose = [P.x, P.y, P.z, P.rx, P.ry].map(v => Math.round(v * 2)).join() + '|' + (H.held() || '');
    if (now - aimAt < 240 || pose === aimPose && now - aimAt < 1500) return aim; aimAt = now; aimPose = pose; aim = null;
    if (H.busy) return null;
    let h = null; try { const id = H.held(); h = H.pick(innerWidth / 2, innerHeight / 2, id ? { skip: o => o.userData.spot === id } : undefined); } catch (e) { return null; }
    const s = h && h.spot && H.SPOTS[h.spot]; if (!s || s.off) return null;
    const label = short(typeof s.label === 'function' ? s.label() : s.label), t = H.THINGS[s.id];
    aim = { id: s.id, label, far: h.dist > s.range, grab: !!s.grab, remove: !!s.remove && !s.grab, thing: !!t, use: t ? thingVerb(t) : (s.act ? label : '') };
    return aim;
  }
  function render() {
    const s = syncState(); let k = s, buttons = '', caption = '';
    if (s === 'walk' || s === 'seat') {
      const held = H.held(), hold = document.querySelector('.hs-ui .hs-hold');
      if (held && hold && !hold.hidden) {
        const drag = hold.classList.contains('drag'), blocked = hold.classList.contains('blocked'), snap = hold.classList.contains('snap');
        let use = short(hold.querySelector('[data-h=use]')?.textContent) || 'Use'; if (use.length > 12) use = use.split(/\s*\/\s*/)[0].length <= 12 ? use.split(/\s*\/\s*/)[0] : verbOf(use);
        buttons = btn('e', drag ? 'grab' : 'place', drag ? 'Let go' : snap ? 'Put in' : 'Put down', 'ht-main', blocked && !drag) +
          (drag ? '' : btn('x', 'drop', 'Drop')) + btn('r', 'turn', 'Turn') + btn('q', 'back', 'Return') + btn('f', use === 'Look closely' ? 'look' : use.startsWith('Sit') ? 'sit' : 'use', use, 'ht-use') +
          '';
        k += '|h|' + [held, drag, blocked, snap, use].join(',');
      } else {
        const a = aimed();
        if (a) {
          caption = a.label + (a.far ? ' · walk closer' : '');
          if (!a.far) {
            if (a.use) { const v = a.thing ? a.use : verbOf(a.use); buttons += btn('f', v === 'Look closely' ? 'look' : /^Sit/.test(v) ? 'sit' : 'use', v.length > 13 ? verbOf(v) : v, 'ht-main'); }
            if (a.grab) buttons += btn('e', 'grab', 'Pick up', a.use ? '' : 'ht-main');
            else if (a.remove) buttons += btn('e', 'grab', 'Take out');
          }
          k += '|a|' + [a.id, a.far, a.use, a.grab, a.remove, a.label].join(',');
        }
        if (!a || a.far || !(a.use || a.grab || a.remove)) buttons = btn('f', 'use', 'Use', 'ht-main ht-idle', true) + buttons; // (where actions appear)
        if (s === 'walk') { const c = crouched(); buttons += btn('jump', 'jump', 'Jump') + btn('crouch', 'crouch', c ? 'Stand' : 'Crouch', c ? 'ht-on' : ''); k += '|c' + c; }
      }
    }
    let topButtons = btn('menu', 'menu', 'Menu', 'ht-menu');
    if (s === 'pc') { const full = !!H.desktopDisplay(); topButtons = btn('stand', 'stand', 'Stand up') + btn('lock', full ? 'room' : 'lock', full ? 'In room' : 'LOCK IN') + topButtons; k += '|pc' + full; }
    if (k === lastKey) return; lastKey = k;
    acts.innerHTML = buttons; top.innerHTML = topButtons; layout();
    target.querySelector('b').textContent = caption; target.classList.toggle('on', !!caption);
    hud.dataset.state = s;
  }
  // Slot centres, measured from the cluster's bottom-right corner. The most likely action sits under the thumb's resting
  // point; Jump and Crouch never move, so the thumb learns them; carrying has its own fixed arc.
  const WALK = { main: [52, 52], second: [146, 38], jump: [34, 152], crouch: [108, 134] };
  const CARRY = { e: [52, 52], x: [146, 40], r: [36, 150], q: [118, 132], f: [44, 234] }; // (Use stacks above Turn: never near the walk stick on a 360 px phone)
  function layout() {
    const carrying = !!acts.querySelector('[data-k="x"],[data-k="r"]'); let n = 0;
    for (const b of acts.children) {
      const k = b.dataset.k, w = b.offsetWidth || 58;
      const at = carrying ? CARRY[k] || CARRY.f : k === 'jump' || k === 'crouch' ? WALK[k] : n++ ? WALK.second : WALK.main;
      b.style.right = (at[0] - w / 2) + 'px'; b.style.bottom = (at[1] - w / 2) + 'px';
    }
  }
  setInterval(render, 150);
  ['room', 'click', 'standup'].forEach(e => H.on(e, () => { lastKey = ''; }));
  document.addEventListener('game-input-change', () => { releaseAll(); lastKey = ''; render(); });

  // ---------------------------------------------------------------- the PC: phones LOCK IN on sitting down, so JackOS is finger-sized
  let autoLocked = false;
  function pcArrived() {
    if (!phone()) return;
    let tries = 0;
    const go = () => {
      if (st !== 'pc') return;
      if (H.mode !== 'monitor' || H.gliding || !window.DesktopSurface?.ready?.()) { if (++tries < 600) setTimeout(go, 150); return; } // (a cold boot can take a while)
      if (!H.desktopDisplay()) { H.desktopDisplay(true); autoLocked = true; }
    };
    setTimeout(go, 200);
  }

  // ---------------------------------------------------------------- the game menu: touch settings and the JackOS-only choice
  function menuSettings() {
    const dlg = document.querySelector('dialog.hs-pause'), main = dlg?.querySelector('.hs-pause-main'); if (!main || main.querySelector('.ht-settings')) return;
    dlg.querySelector('.hs-pause-controls')?.setAttribute('data-input-only', 'keyboard');
    dlg.querySelectorAll('.hs-pause-mouse').forEach(p => { if (/^Mouse:/.test(p.textContent)) p.setAttribute('data-input-only', 'keyboard'); });
    const f = document.createElement('fieldset'); f.className = 'ht-settings'; f.setAttribute('data-input-only', 'touch');
    f.innerHTML = `<legend>TOUCH CONTROLS</legend>
      <label class="ht-sens">Look speed <output></output><input type="range" name="touchLook" min="40" max="250" step="5" aria-label="Look speed"></label>
      ${window.PCOnly?.handheld ? '<button type="button" data-touch="jackos">PLAY JACKOS ONLY ON THIS DEVICE</button><div class="ht-jackos-confirm" hidden><p>Skip the house on this device and go straight to the JackOS desktop? Your room, saves and the PC stay exactly as they are; you can come back from the desktop\'s power screen.</p><button type="button" data-touch="jackosYes">YES, JACKOS ONLY</button><button type="button" data-touch="jackosNo">CANCEL</button></div>' : ''}`;
    const keysBox = main.querySelector('.hs-pause-controls'); main.insertBefore(f, keysBox || null);
    const range = f.querySelector('[name=touchLook]'), out = f.querySelector('output');
    const show = () => { range.value = Math.round(sens * 100); out.textContent = Math.round(sens * 100) + '%'; };
    show(); range.addEventListener('input', () => { sens = clamp(range.value / 100, .4, 2.5); ls.set('jhp_touch_look', sens); show(); });
    f.addEventListener('click', ev => {
      const b = ev.target.closest('[data-touch]'); if (!b) return; const c = f.querySelector('.ht-jackos-confirm');
      if (b.dataset.touch === 'jackos') { c.hidden = false; c.querySelector('button').focus(); }
      else if (b.dataset.touch === 'jackosNo') c.hidden = true;
      else if (b.dataset.touch === 'jackosYes') jackosOnly();
    });
    const help = document.createElement('details'); help.className = 'hs-pause-controls ht-help'; help.setAttribute('data-input-only', 'touch');
    help.innerHTML = '<summary>HOW TO PLAY BY TOUCH</summary><p class="hs-pause-keys">Left thumb: walk · push further: jog<br>Right thumb: drag to look · click a thing: use it<br>Use [F] · Pick up / Put down [E] · Turn [R]<br>Drop [X] · Return [Q] · Jump · Crouch · Menu<br>At the PC: Stand up · LOCK IN · JackOS takes your fingers directly<br>Close-ups: drag to turn · two fingers to zoom</p>';
    main.insertBefore(help, keysBox ? keysBox.nextSibling : null);
  }
  function jackosOnly() {
    try { H.saveWalkState(); window.Apps?.flushGames?.(); } catch (e) {}
    window.PCOnly?.choose('jackos');
    Promise.resolve(window.Roam?.syncNow?.()).catch(() => {}).finally(() => location.reload());
  }
  menuSettings(); setTimeout(menuSettings, 1500);

  // ---------------------------------------------------------------- too slow even on Potato: offer JackOS on its own, never force it
  // (only real handhelds, only after the house has had a fair chance, and only once per device unless they say "ask again")
  const perfLog = []; let offered = !!ls.get('jhp_touch_slow_asked', false);
  setInterval(() => {
    if (offered || !window.PCOnly?.handheld || st !== 'walk' || document.hidden || !H.perf) return;
    const p = H.perf(); if (!p || p.frames < 60 || p.tier !== 'potato') return;
    if (!H.touch.moving && !look) return; // (an idle room draws rarely on purpose)
    perfLog.push(p.frameP50); if (perfLog.length > 12) perfLog.shift();
    const sorted = perfLog.slice().sort((a, b) => a - b), med = sorted[sorted.length >> 1];
    if (perfLog.length >= 8 && med > 125 && (p.scale || 1) <= .6) slowOffer(med);
  }, 1500);
  function slowOffer(ms) {
    offered = true; ls.set('jhp_touch_slow_asked', true);
    const box = document.createElement('div'); box.className = 'ht-slow'; box.setAttribute('role', 'alertdialog'); box.setAttribute('aria-labelledby', 'htSlowTitle');
    box.innerHTML = `<div class="ht-slow-win"><div class="ht-slow-tb" id="htSlowTitle">This computer is struggling</div><div class="ht-slow-body"><p>The house is drawing about ${Math.max(1, Math.round(1000 / ms))} pictures a second on the lowest graphics. You can keep playing in the house, or use JackOS on its own on this device (same account, same saves).</p><div class="ht-slow-row"><button type="button" data-v="house">Keep the house</button><button type="button" data-v="jackos">JackOS only</button></div></div></div>`;
    box.addEventListener('click', ev => { const b = ev.target.closest('[data-v]'); if (!b) return; box.remove(); if (b.dataset.v === 'jackos') jackosOnly(); else window.PCOnly?.choose('house'); });
    html.appendChild(box); box.querySelector('button').focus();
  }

  window.HouseTouch = { get state() { return st; }, get sensitivity() { return sens; }, render, releaseAll, _aim: () => aimed(), _slowOffer: slowOffer };
  render();
})();
