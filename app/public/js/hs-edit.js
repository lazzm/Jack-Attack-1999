/* hs-edit.js: in-world layout editor ("god mode"). Only for the logged-in JackNet member Jack. Backquote toggles owner tools; F9 remains an alias.
 * Local only: it nudges groups (position / rotation.y in the parent's own frame, the numbers the build code uses), keeps the
 * edits in localStorage (re-applied after a refresh) and exports them as JSON. Hooks in hs-world.js: House.god (a tick fn, set only
 * while the mode is on) is called from tickWalk and makes onKey step aside. Nothing here runs for anybody else. */
(function () {
  'use strict';
  const T = window.THREE; if (!T || !T.Object3D || window.__hsEdit) return; window.__hsEdit = 1;
  const D2R = Math.PI / 180, LS = 'jhp_god_edits', H = () => window.House;
  const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { saved = {}; }
  const store = () => { try { localStorage.setItem(LS, JSON.stringify(saved)); } catch (e) {} };
  const isJack = () => !!window.OwnerTools?.allowed;

  // ---- tag every Group as it is added to something, with the file:line that added it (this is what gives models their names)
  const pending = [], reg = new Map(), counts = {}, srcCache = {}, claimedEdits=new Set();
  const add0 = T.Object3D.prototype.add;
  function srcOf() {
    const st = new Error().stack || '', re = /((?:https?:)?\/\/[^\s()]+?\/([\w.-]+\.js))(?:\?[^\s:)]*)?:(\d+):(\d+)/g; let m;
    while ((m = re.exec(st))) { if (/hs-edit|three|hs-kit/i.test(m[2])) continue; return { url: m[1], file: m[2], line: +m[3], col: +m[4] }; }
    return null;
  }
  T.Object3D.prototype.add = function (o) {
    try { if (o && o.isGroup && arguments.length === 1 && !o.userData.edSrc) { const s = srcOf(); if (s) { o.userData.edSrc = s; pending.push({ g: o, t: performance.now() }); } } } catch (e) {}
    return add0.apply(this, arguments);
  };
  const vals = g => ({ x: g.position.x, y: g.position.y, z: g.position.z, rx: g.rotation.x / D2R, ry: g.rotation.y / D2R, rz: g.rotation.z / D2R });
  const setVals = (g, v) => { g.position.set(v.x, v.y, v.z); g.rotation.set(v.rx * D2R, v.ry * D2R, v.rz * D2R); touch(g); };
  function touch(g) {
    // A saved editor angle is not an open-door command. Replaying it used
    // to leave an open-looking leaf with closed collision/portal visibility.
    const h=H(),door=h&&Object.values(h.DOORS).find(d=>d.pivot===g);
    if(door)g.rotation.y=door.ang*door.swing*D2R*(door.dir||1);
    g.updateMatrix();g.matrixWorldNeedsUpdate=true;g.updateMatrixWorld(true);if(h&&h.dirty)h.dirty();
  }
  function roomOf(g) { const R = H().ROOMS; for (let p = g.parent; p; p = p.parent) for (const id in R) if (R[id].group === p) return id; return null; }
  const attached = g => { for (let p = g; p; p = p.parent) if (p === H().scene) return true; return false; };
  const excluded = g => { const R = H().ROOMS; for (const id in R) if (R[id].group === g || R[id].things === g) return true; return g === H().root; };
  function srcLines(s) { return srcCache[s.url] || (srcCache[s.url] = fetch(s.url).then(r => r.text()).then(t => t.split('\n')).catch(() => [])); }
  function nameIt(g) {
    const s = g.userData.edSrc;
    srcLines(s).then(lines => {
      const L = lines[s.line - 1] || '', rest = L.slice(Math.max(0, s.col - 1));
      const v = (/add\(\s*([\w$.]+)/.exec(rest) || /\.add\(\s*([\w$.]+)\s*\)/.exec(L) || [])[1];
      const c = /\s\/\/\s*(.+)$/.exec(L);
      g.userData.edName = v || ('group@' + s.line); if (c) g.userData.edNote = c[1].replace(/^\(|\)\s*$/g, '').slice(0, 70);
    });
  }
  function resolve(g) { // once a group hangs in the scene: its key, its original values, and any saved edit
    const ud = g.userData; if (ud.ed) return true;
    if (!attached(g) || excluded(g)) return false;
    const s = ud.edSrc, room = roomOf(g) || 'house', base = room + '|' + s.file + ':' + s.line, n = counts[base] = (counts[base] || 0) + 1;
    ud.ed = { key: base + '|' + n, room, orig: vals(g) }; reg.set(ud.ed.key, g); nameIt(g);
    // Source lines move as models improve. Never apply an old line's edit to
    // an unrelated group which now happens to occupy that line.
    const original=ud.ed.orig,valid=v=>v&&['x','y','z','rx','ry','rz'].every(k=>Number.isFinite(v[k]));
    const same=v=>valid(v)&&['x','y','z','rx','ry','rz'].every(k=>Math.abs(v[k]-original[k])<.02);
    const located=Object.values(original).some(v=>Math.abs(v)>.02),target=targetOf(g),legacyKey=ud.ed.key;ud.ed.target=target;
    if(target){reg.delete(legacyKey);ud.ed.key='target|'+target;reg.set(ud.ed.key,g)}
    let sourceKey=saved[ud.ed.key]?ud.ed.key:legacyKey,entry=saved[sourceKey];
    if(!entry||claimedEdits.has(sourceKey)||!valid(entry.now)||(entry.target?entry.target!==target:!(target&&entry.name===target)&&!(located&&same(entry.original))))entry=null;
    if(!entry){
      const matches=Object.entries(saved).filter(([key,e])=>!claimedEdits.has(key)&&e&&valid(e.now)&&(e.target?target&&e.target===target:target&&(e.name===target||located&&e.room===room&&String(e.file||'').split(':')[0]===s.file&&same(e.original))));
      if(matches.length===1)[sourceKey,entry]=matches[0];
    }
    if(entry){claimedEdits.add(sourceKey);ud.ed.sourceKey=sourceKey;setVals(g,entry.now)}
    return true;
  }
  function targetOf(g){
    const h=H();for(const[id,t]of Object.entries(h.THINGS))if(t.obj===g)return 'thing:'+id;
    for(const[id,d]of Object.entries(h.DOORS))if(d.pivot===g)return 'door:'+id;
    for(const[id,s]of Object.entries(h.SPOTS))if(s.obj===g)return 'spot:'+id;
    return null;
  }
  setInterval(() => {
    if (!pending.length || !H() || !H().scene) return;
    const now = performance.now();
    for (let i = pending.length - 1; i >= 0; i--) { const p = pending[i]; if (resolve(p.g) || now - p.t > 90000) pending.splice(i, 1); }
  }, 250);

  const nameOf = g => {
    const h = H(); for (const id in h.THINGS) if (h.THINGS[id].obj === g) return 'thing:' + id;
    for (const id in h.SPOTS) if (h.SPOTS[id].obj === g) return 'spot:' + id;
    const ud = g.userData; return ud.edName || ((ud.ed && ud.ed.room || '?') + '/Group#' + (g.parent ? g.parent.children.indexOf(g) : 0));
  };
  function parentOf(g) { for (let p = g.parent; p && p !== H().scene; p = p.parent) if (p.userData.edSrc && !excluded(p)) return p; return null; }
  function info(g) {
    const ud = g.userData; resolve(g); const par = parentOf(g), s = ud.edSrc || {};
    return { name: nameOf(g), room: ud.ed ? ud.ed.room : '?', file: s.file ? s.file + ':' + s.line : undefined, parentName: par ? nameOf(par) : (ud.ed ? ud.ed.room : '?') + ' (room)', note: ud.edNote };
  }
  const K = ['x', 'y', 'z', 'rx', 'ry', 'rz'];
  const differs = (a, b) => K.some(k => Math.abs(a[k] - b[k]) > 0.01);
  function record(g) {
    const e = g.userData.ed; if (!e) return;
    const now = vals(g);
    if(e.sourceKey&&e.sourceKey!==e.key)delete saved[e.sourceKey];
    if (differs(now, e.orig)) saved[e.key] = Object.assign(info(g), { id: e.key, target:e.target, original: e.orig, now }); else delete saved[e.key];
    store(); render();
  }

  // ---- god mode
  let on = false, sel = null, box = null, panel = null, snap = null, drag = null, lastRender = 0;
  const gk = {};
  const body = () => document.body;
  const cvEl = () => H().ren && H().ren.domElement;
  const locked = () => !!document.pointerLockElement;

  function mkPanel() {
    panel = document.createElement('div'); panel.className = 'hs-ui hs-god';
    panel.style.cssText = 'position:fixed;right:8px;bottom:8px;width:292px;max-height:64vh;overflow:auto;z-index:99999;background:rgba(10,12,16,.82);color:#cfe;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;padding:8px 9px;border:1px solid rgba(120,255,200,.35);border-radius:4px;pointer-events:auto;user-select:none;backdrop-filter:blur(2px)';
    const st = document.createElement('style'); st.textContent = '.hs-god button{font:inherit;color:#cfe;background:#1c2a28;border:1px solid #3a6;border-radius:3px;padding:1px 6px;margin:2px 3px 2px 0;cursor:pointer}.hs-god button:hover{background:#2a4a40}.hs-god b{color:#ffd24a}.hs-god .d{color:#7a9}.hs-god .row{border-top:1px solid rgba(120,255,200,.15);padding:2px 0;cursor:pointer}';
    panel.appendChild(st); const c = document.createElement('div'); c.className = 'c'; panel.appendChild(c); document.documentElement.appendChild(panel); // (on <html>: the page body is scaled/transformed, which would drag a fixed panel off screen)
    panel.addEventListener('click', ev => {
      const b = ev.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a; try { b.blur(); } catch (e) {}
      if (a === 'parent' && sel) { const p = parentOf(sel); if (p) pick(p); }
      else if (a === 'reset') resetSel();
      else if (a === 'export') doExport();
      else if (a === 'clear') clearAll();
      else if (a === 'row') { const g = reg.get(b.dataset.k); if (g) pick(g); }
    });
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function render() {
    if (!panel) return; const c = panel.querySelector('.c'); let h = '<b>GOD MODE</b> <span class="d">` owner tools</span><br><span class="d">WASD fly, Space/C up/dn, Shift fast, Esc game menu<br>click or E select, arrows move, PgUp/PgDn y, [ ] rotate, R reset</span><hr style="border:0;border-top:1px solid rgba(120,255,200,.2);margin:4px 0">';
    if (sel) {
      const i = info(sel), v = vals(sel);
      h += '<b>' + esc(i.name) + '</b> <span class="d">' + esc(i.room) + (i.file ? ' ' + esc(i.file) : '') + '</span><br>' + (i.note ? '<span class="d">' + esc(i.note) + '</span><br>' : '') + '<span class="d">in ' + esc(i.parentName) + '</span><br>' +
        'x ' + r2(v.x) + '  y ' + r2(v.y) + '  z ' + r2(v.z) + '<br>rx ' + r1(v.rx) + '  ry ' + r1(v.ry) + '  rz ' + r1(v.rz) + '<br>';
    } else h += '<span class="d">' + (lastMsg || 'nothing selected') + '</span><br>';
    h += '<button data-a="parent">Parent</button><button data-a="reset">Reset</button><button data-a="export">Export</button><button data-a="clear">Clear all</button><br>';
    const ks = Object.keys(saved); h += '<b>Changed (' + ks.length + ')</b>';
    for (const k of ks) {
      const e = saved[k], d = K.filter(q => Math.abs(e.now[q] - e.original[q]) > 0.05).map(q => q + ' ' + r1(e.original[q]) + '&rarr;' + r1(e.now[q])).join(', ');
      h += '<div class="row" data-a="row" data-k="' + esc(k) + '"><b>' + esc(e.name) + '</b> <span class="d">' + esc(e.room) + '</span><br>' + d + '</div>';
    }
    if (c.__h !== h) { c.__h = h; c.innerHTML = h; } // (only when it changed: a re-render between mousedown and mouseup would eat the click)
  }
  let lastMsg = '';

  // ---- picking
  const ray = new T.Raycaster(), _o = new T.Vector3(), _d = new T.Vector3();
  function rayFrom(sx, sy) { const r = H().rayAt(sx, sy); _o.set(r.o.x, -r.o.y, r.o.z); _d.set(r.d.x, -r.d.y, r.d.z); ray.set(_o, _d); ray.far = 3000; ray.layers.enableAll(); return r; }
  function movableOf(m) { for (let p = m.parent; p && p !== H().scene; p = p.parent) { if (p.userData.edSrc && !excluded(p)) { resolve(p); return p; } } return null; }
  function pickAt(sx, sy) {
    rayFrom(sx, sy); const list = [];
    H().scene.traverseVisible(m => { if (m.isMesh && !m.userData.noPick && m.material && (Array.isArray(m.material) || m.material.visible !== false)) list.push(m); });
    const hit = ray.intersectObjects(list, false)[0]; if (!hit) return { none: true };
    const g = movableOf(hit.object); return g ? { g } : { stat: true };
  }
  function pick(g) {
    sel = g; lastMsg = '';
    if (!box) { box = new T.BoxHelper(g, 0xffd24a); box.material.depthTest = false; box.material.transparent = true; box.renderOrder = 9999; box.userData.noPick = true; H().scene.add(box); }
    box.visible = true; box.setFromObject(g); render(); H().dirty();
  }
  function selectAt(sx, sy) {
    const p = pickAt(sx, sy);
    if (p.g) { pick(p.g); return p.g; }
    lastMsg = p.stat ? 'that is static room geometry (merged batch), not a movable model' : 'nothing there'; sel = null; if (box) box.visible = false; render(); return null;
  }
  function centre() { const r = cvEl().getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }

  // ---- moving the selection
  function nudgeWorld(g, d, step) {
    g.parent.updateWorldMatrix(true, false);
    const wp = g.getWorldPosition(new T.Vector3()), a = g.parent.worldToLocal(wp.clone().add(d.multiplyScalar(step))), b = g.parent.worldToLocal(wp.clone());
    g.position.add(a.sub(b)); for (const k of ['x', 'y', 'z']) g.position[k] = Math.round(g.position[k] * 1000) / 1000; touch(g); record(g);
  }
  function resetSel() { if (!sel || !sel.userData.ed) return; setVals(sel, sel.userData.ed.orig); delete saved[sel.userData.ed.key]; store(); render(); }
  function clearAll() { reg.forEach(g => { if (g.userData.ed) setVals(g, g.userData.ed.orig); }); saved = {}; store(); render(); }
  function arrowDir(code) {
    const a = H().P.ry * D2R, fx = Math.sin(a), fz = -Math.cos(a), rx = Math.cos(a), rz = Math.sin(a);
    let x = 0, z = 0; if (code === 'ArrowUp') { x = fx; z = fz; } else if (code === 'ArrowDown') { x = -fx; z = -fz; } else if (code === 'ArrowRight') { x = rx; z = rz; } else { x = -rx; z = -rz; }
    return Math.abs(x) > Math.abs(z) ? new T.Vector3(Math.sign(x), 0, 0) : new T.Vector3(0, 0, Math.sign(z));
  }
  function onKey(ev) {
    if (window.OwnerTools?.typing(ev.target) || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.code === 'Backquote' || ev.code === 'F9') {
      if (!isJack() || ev.repeat) return;
      ev.preventDefault(); ev.stopImmediatePropagation();
      window.OwnerTools.toggle(); return;
    }
    if (!on) return;
    const t = ev.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    ev.stopPropagation(); // (keeps the world's own key handlers, including its mouse re-lock on WASD, out of it)
    const c = ev.code, shift = ev.shiftKey;
    if (/^(KeyW|KeyA|KeyS|KeyD|Space|KeyC|ShiftLeft|ShiftRight)$/.test(c)) { gk[c] = true; ev.preventDefault(); return; }
    ev.preventDefault();
    if (c === 'Escape') { window.OwnerTools?.escape(); return; }
    if (c === 'KeyE' || c === 'Enter') { if (!ev.repeat) { const [x, y] = centre(); selectAt(x, y); } return; }
    if (!sel || !sel.userData.ed) return;
    if (/^Arrow/.test(c)) nudgeWorld(sel, arrowDir(c), shift ? 10 : 1);
    else if (c === 'PageUp' || c === 'PageDown') nudgeWorld(sel, new T.Vector3(0, c === 'PageUp' ? 1 : -1, 0), shift ? 10 : 1);
    else if (c === 'BracketLeft' || c === 'BracketRight') { sel.rotation.y += (c === 'BracketRight' ? 1 : -1) * (shift ? 15 : 5) * D2R; touch(sel); record(sel); }
    else if (c === 'KeyR') resetSel();
  }
  addEventListener('keydown', onKey, true);
  addEventListener('keyup', ev => { if (gk[ev.code]) { delete gk[ev.code]; if (on) ev.stopPropagation(); } }, true);
  addEventListener('blur', () => { for (const k in gk) delete gk[k]; });

  // mouse: while the mode is on the world's own click / drag-to-look / re-lock stay out of it
  const inPanel = ev => panel && panel.contains(ev.target) || !!ev.target.closest?.('.owner-tools');
  for (const n of ['mousedown', 'mouseup', 'click', 'pointerup']) addEventListener(n, ev => { if (on && !inPanel(ev)) { ev.stopPropagation(); if (n === 'pointerup' && drag) { try { drag = null; } catch (e) {} } } }, true);
  addEventListener('pointerdown', ev => {
    if (!on || inPanel(ev)) return; ev.stopPropagation(); if (ev.button !== 0) return;
    const lk = locked(), [x, y] = lk ? centre() : [ev.clientX, ev.clientY], g = selectAt(x, y);
    if (g && !lk) { // drag it across the plane it stands on
      rayFrom(x, y); g.updateWorldMatrix(true, false); const h = g.getWorldPosition(new T.Vector3()).y, t = (h - _o.y) / _d.y;
      if (_d.y && t > 0) { const hit = _o.clone().add(_d.clone().multiplyScalar(t)), l = g.parent.worldToLocal(hit.clone()); drag = { g, h, ox: g.position.x - l.x, oz: g.position.z - l.z, sx: x, sy: y, moved: false }; }
    }
  }, true);
  addEventListener('pointermove', ev => {
    if (!on || !drag || locked()) return;
    if (!drag.moved && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < 4) return; drag.moved = true;
    rayFrom(ev.clientX, ev.clientY); const t = (drag.h - _o.y) / _d.y; if (!_d.y || t <= 0) return;
    const g = drag.g, l = g.parent.worldToLocal(_o.clone().add(_d.clone().multiplyScalar(t)));
    g.position.x = Math.round((l.x + drag.ox) * 100) / 100; g.position.z = Math.round((l.z + drag.oz) * 100) / 100; touch(g); record(g);
  }, true);

  // ---- the tick (called from the world's tickWalk while on): noclip fly, no gravity, no collision
  function tick(dt) {
    const h = H(), P = h.P, W = h.W; dt = Math.min(dt, 0.1);
    const a = P.ry * D2R, p = P.rx * D2R, sp = (gk.ShiftLeft || gk.ShiftRight ? 900 : 300) * dt;
    const mf = (gk.KeyW ? 1 : 0) - (gk.KeyS ? 1 : 0), mr = (gk.KeyD ? 1 : 0) - (gk.KeyA ? 1 : 0), mu = (gk.Space ? 1 : 0) - (gk.KeyC ? 1 : 0);
    P.x += (Math.sin(a) * Math.cos(p) * mf + Math.cos(a) * mr) * sp;
    P.z += (-Math.cos(a) * Math.cos(p) * mf + Math.sin(a) * mr) * sp;
    P.y += (-Math.sin(p) * mf - mu) * sp;
    W.x = P.x; W.z = P.z; W.vx = W.vz = 0; W.bob = 0;
    try { const f = h._.floorAt(W.x, W.z, W.lvl, W.fy); if (f) W.lvl = f.lvl; } catch (e) {}
    if (box && sel && box.visible) box.setFromObject(sel);
    const n = performance.now(); if (n - lastRender > 250) { lastRender = n; render(); }
    if (h.mode !== 'walk') exit();
    return true;
  }
  function enter() {
    const h = H(); snap = { P: Object.assign({}, h.P), W: Object.assign({}, h.W) };
    on = true; for (const k in gk) delete gk[k]; if (!panel) mkPanel(); panel.style.display = ''; render();
    h.god = tick; if (h.dirty) h.dirty();
  }
  function exit() {
    const h = H(); on = false; h.god = null; drag = null; for (const k in gk) delete gk[k];
    if (panel) panel.style.display = 'none'; if (box) box.visible = false; sel = null;
    if (snap) { Object.assign(h.P, snap.P); Object.assign(h.W, snap.W); snap = null; }
    if (h.dirty) h.dirty();
  }
  setInterval(() => { if (on && H().mode !== 'walk') exit(); }, 300);

  // ---- export
  function doExport() {
    const o = {}; const rd = v => { const r = {}; K.forEach(k => { r[k] = r1(v[k]); }); return r; };
    const edits = Object.keys(saved).map(k => { const e = saved[k]; return { name: e.name, room: e.room, file: e.file, parentName: e.parentName, id: e.id, note: e.note, original: rd(e.original), now: rd(e.now) }; });
    const txt = JSON.stringify({ date: new Date().toISOString(), edits }, null, 2); window.__hsEditLast = txt;
    let ok = false;
    try { const ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;left:-999px;top:0'; body().appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch (e) {}
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).catch(() => {}); } catch (e) {}
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = 'layout-edits.json'; body().appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); } catch (e) {}
    lastMsg = 'exported ' + edits.length + ' edit(s)' + (ok ? ', copied' : ''); if (!sel) render();
  }
  window.HouseEdit = { get on() { return on; }, setEnabled(value) { if (!isJack()) return false; const h=H(); if (!value) { if(on)exit(); return true; } if(on)return true; if(!h?.live||h.mode!=='walk'||!h.stood||h.busy||h.paused)return false; enter(); return true; }, get selected() { return sel && nameOf(sel); }, saved: () => saved, exportJSON: () => window.__hsEditLast };
  Object.defineProperty(window, 'HouseEdit', { enumerable: false });
})();
