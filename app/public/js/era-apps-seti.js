/* era-apps-seti: JACK@home for the ERA SOFTWARE pack (lazy loaded by era-apps.js). Our take on the famous
 * screen saver that searched radio telescope data for aliens (it started on 17 May 1999). Ours does too (and finds microwaves).
 * Era.savers.seti is the screen saver; Era.mods.sqhome is the same thing in a window. One shared "work unit"
 * is processed by whichever is running; finished units go into the JackNet grand total (Net.kv 'era.sqhome.wu'). */
(function () {
  'use strict';
  const E = window.Era; if (!E) return;
  const store = E.store, TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const WU_SECS = 210; // a work unit takes about three and a half minutes (a real one took a Pentium II all night)
  const KEY = 'era.sqhome.wu';

  // ---------------------------------------------------------------- the shared state
  let S = store.get('jhp_era_sqh', null);
  if (!S || typeof S !== 'object') S = { wu: 0, cpu: 0, sig: 0, cur: null };
  const R = Math.random;
  function newUnit() {
    const d = E.today(), day = Math.max(1, Math.floor((d.date - new Date(1999, 0, 1)) / 864e5) - 1 - Math.floor(R() * 40));
    const rec = new Date(1999, 0, 1 + day, Math.floor(R() * 24), Math.floor(R() * 60), Math.floor(R() * 60));
    const MON = ['ja', 'fe', 'mr', 'ap', 'my', 'jn', 'jl', 'au', 'se', 'oc', 'no', 'de'];
    return {
      id: `${String(rec.getDate()).padStart(2, '0')}${MON[rec.getMonth()]}99a${'abcdefgh'[Math.floor(R() * 8)]}.${1000 + Math.floor(R() * 8999)}.${Math.floor(R() * 30000)}.${Math.floor(R() * 900000)}.${10 + Math.floor(R() * 90)}`,
      p: 0, cpu: 0, ra: R() * 24, dec: (R() - 0.3) * 60, jd: 2451179.5 + day + (rec.getHours() * 3600 + rec.getMinutes() * 60) / 86400, rec: +rec,
      freq: 1.4204 + R() * 0.0004, sig: R() < 0.36 ? 0.18 + R() * 0.62 : -1,
      gp: 1 + R(), gs: 0.2 + R() * 0.5, sp: 12 + R() * 8,
    };
  }
  if (!S.cur) S.cur = newUnit();
  const save = () => store.set('jhp_era_sqh', S);
  let global = null, lastAdv = 0, lastSave = 0;
  if (window.Net && Net.kv) {
    Net.kv.get([KEY]).then(v => { if (v && typeof v[KEY] === 'number') global = v[KEY]; });
    Net.kv.watch(KEY, ev => { if (ev && ev.type === 'set' && typeof ev.v === 'number') global = ev.v; });
  }
  const VERDICTS = [
    ["Dave's microwave", 'doing a Pot Noodle'], ["Dave's microwave", "he's doing a jacket potato"], ["Dave's microwave AGAIN", 'fish fingers this time'],
    ["Mom's hairdryer", 'she was getting ready to go out'], ['the baby monitor next door', 'the baby was singing'], ["Dad's electric shaver", 'Sunday morning'],
    ['Gubbinz', 'chewing the TV aerial'], ['a mobile phone', "someone's Nan rang them"], ["the telescope man's walkie-talkie", 'he wanted a cup of tea'],
    ['a satellite dish', 'pointing at the wrong satellite'], ['the electric fence', 'on the farm by the telescope'],
  ];
  const PHASES = ['Baseline smoothing', 'Computing FFTs', 'Searching for spikes', 'Computing Gaussians', 'Searching for pulses', 'Searching for triplets'];
  // what's happening right now: ev = { k: 'signal'|'send', t: seconds into it, v: verdict }
  const st = { ev: null, phase: 0, chirp: -10, paused: !!store.get('jhp_era_sqhpause', false), seen: false };
  const listeners = new Set(); // window status bars
  const say = t => listeners.forEach(fn => { try { fn(t); } catch (e) {} });
  function advance(now) {
    let d = lastAdv ? (now - lastAdv) / 1000 : 0; lastAdv = now;
    if (d <= 0) return; d = Math.min(0.25, d) * (E._sqhSpeed || 1);
    if (st.paused) return;
    const c = S.cur;
    if (st.ev) {
      st.ev.t += d / (E._sqhSpeed || 1);
      if (st.ev.k === 'send') {
        if (st.ev.t > 4.5) { st.ev = null; S.cur = newUnit(); save(); say('Got new work unit ' + S.cur.id + '. Analysing...'); }
        return;
      }
      if (st.ev.t > 18) { st.ev = null; say('Back to work. Analysing ' + c.id + '...'); }
    }
    c.p += d / WU_SECS; c.cpu += d; S.cpu += d;
    st.phase = Math.floor(c.p * 36) % PHASES.length; st.chirp = -10 + ((c.p * 36) % 1) * 20;
    if (c.sig > 0 && c.p >= c.sig && !st.ev) {
      c.sig = -1; S.sig = (S.sig || 0) + 1;
      st.ev = { k: 'signal', t: 0, v: VERDICTS[R() < 0.4 ? Math.floor(R() * 3) : Math.floor(R() * VERDICTS.length)], f: 0.2 + R() * 0.6 };
      st.seen = false; say('POSSIBLE SIGNAL! Checking it...');
    }
    if (c.p >= 1) {
      c.p = 1; S.wu++; save();
      st.ev = { k: 'send', t: 0 };
      if (window.Net && Net.kv) { Net.kv.inc(KEY); if (global != null) global++; }
      E.secret('seti.wu');
      say('Sending result to Jackecibo... (dialling)');
      setTimeout(() => say('Sending result... done. Getting new work unit...'), 1500);
    }
    if (now - lastSave > 5000) { lastSave = now; save(); }
  }
  E._sqh = { S: () => S, st, newUnit, finish: () => { S.cur.p = 0.999; }, signal: () => { S.cur.sig = S.cur.p + 0.001; } };

  // ---------------------------------------------------------------- drawing
  const hms = s => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = (s % 60).toFixed(1); return `${h} hr ${String(m).padStart(2, '0')} min ${x.padStart(4, '0')} sec`; };
  const raDec = c => { const rh = Math.floor(c.ra), rm = Math.floor((c.ra % 1) * 60), dd = Math.floor(Math.abs(c.dec)), dm = Math.floor((Math.abs(c.dec) % 1) * 60); return `${rh} hr ${String(rm).padStart(2, '0')}' RA, ${c.dec < 0 ? '-' : '+'}${dd}° ${String(dm).padStart(2, '0')}' Dec`; };
  const colFor = v => { const k = clamp(v, 0, 1); return `hsl(${Math.round(235 - k * 235)},100%,${Math.round(45 + k * 12)}%)`; };
  function logo(g, x, y, s) { // a radio dish with a little green alien peeking over the rim, listening
    g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round';
    // stand
    g.strokeStyle = '#8a8a96'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 2); g.lineTo(0, 9); g.moveTo(-5, 9.5); g.lineTo(5, 9.5); g.stroke();
    // dish (lit from the top-left)
    const dg = g.createLinearGradient(-10, -4, 8, 6); dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.6, '#c0c0c8'); dg.addColorStop(1, '#70707c');
    g.fillStyle = dg; g.strokeStyle = '#30303a'; g.lineWidth = 0.7; g.beginPath(); g.ellipse(0, 0, 10, 4.2, -0.4, 0, Math.PI); g.closePath(); g.fill(); g.stroke();
    // feed arm + receiver
    g.strokeStyle = '#c0c0c8'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-1, -1); g.lineTo(-4, -6); g.stroke(); g.fillStyle = '#ff3030'; g.beginPath(); g.arc(-4.3, -6.6, 1.3, 0, TAU); g.fill();
    // the alien: round green head, two antennae with bobbles, big black eyes
    g.strokeStyle = '#0a3a0a'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(3, -7); g.lineTo(1.6, -10.5); g.moveTo(5.6, -7); g.lineTo(7.2, -10.5); g.stroke();
    g.fillStyle = '#7aff5a'; g.beginPath(); g.arc(1.6, -10.8, 0.9, 0, TAU); g.arc(7.2, -10.8, 0.9, 0, TAU); g.fill();
    const ag = g.createRadialGradient(3.4, -6.4, 0.4, 4.3, -5, 4); ag.addColorStop(0, '#b8ff90'); ag.addColorStop(1, '#2a9a1a');
    g.fillStyle = ag; g.beginPath(); g.ellipse(4.3, -4.6, 3.6, 3.2, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(3, -4.8, 1, 1.4, -0.3, 0, TAU); g.ellipse(5.7, -4.8, 1, 1.4, 0.3, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.fillRect(2.6, -5.7, 0.6, 0.6); g.fillRect(5.3, -5.7, 0.6, 0.6);
    // signal waves
    g.strokeStyle = '#ffd400'; g.lineWidth = 0.7; [3, 5].forEach(r => { g.beginPath(); g.arc(9, -6, r, -1.2, 0.1); g.stroke(); });
    g.restore();
  }
  function makeSeti(g, W, H, o) {
    o = o || {};
    const NF = o.preview ? 20 : 40, NR = o.preview ? 14 : 26;
    const rows = []; for (let r = 0; r < NR; r++) rows.push(noiseRow());
    let rowT = 0, T = 0, gaussPts = Array.from({ length: 40 }, () => R());
    function noiseRow() {
      const a = new Float32Array(NF);
      for (let i = 0; i < NF; i++) a[i] = Math.min(1, -Math.log(1 - R() * 0.999) * 0.1 + (R() < 0.012 ? 0.45 + R() * 0.3 : 0));
      if (st.ev && st.ev.k === 'signal' && st.ev.t < 7) { const fi = Math.round(st.ev.f * (NF - 1)), env = Math.exp(-((st.ev.t - 3) ** 2) / 4); for (let i = -2; i <= 2; i++) if (a[fi + i] != null) a[fi + i] = Math.max(a[fi + i], env * (1 - Math.abs(i) * 0.3)); }
      return a;
    }
    function text(t, x, y, col, font) { g.fillStyle = col; if (font) g.font = font; g.fillText(t, x, y); }
    function graph(x, y, w, h, lf) {
      // the famous 3D bar graph: frequency across, time going away into the distance, power up
      const front = y + h, depthX = w * 0.22, depthY = h * 0.48, fw = w - depthX, bw = fw / NF;
      g.strokeStyle = '#13235a'; g.lineWidth = 1; g.beginPath();
      for (let k = 0; k <= 4; k++) { const z = k / 4; g.moveTo(x + depthX * z, front - depthY * z); g.lineTo(x + depthX * z + fw * lerp(1, 0.78, z), front - depthY * z); }
      for (let k = 0; k <= 8; k++) { const f = k / 8; g.moveTo(x + fw * f, front); g.lineTo(x + depthX + fw * 0.78 * f, front - depthY); }
      g.stroke();
      g.strokeStyle = '#2a4aa8'; g.beginPath(); g.moveTo(x, front); g.lineTo(x + fw, front); g.lineTo(x + depthX + fw * 0.78, front - depthY); g.lineTo(x + depthX, front - depthY); g.closePath(); g.stroke();
      for (let r = NR - 1; r >= 0; r--) {
        const z = r / (NR - 1), rowX = x + depthX * z, rowY = front - depthY * z, sc = lerp(1, 0.78, z), a = rows[r], fade = 1 - z * 0.45;
        for (let i = 0; i < NF; i++) {
          const v = a[i], bh = v * h * 0.6 * sc;
          if (bh < 0.6) continue;
          const bx = rowX + i * bw * sc, bwid = Math.max(1, bw * 0.5 * sc);
          g.globalAlpha = fade;
          g.fillStyle = colFor(v * 1.5); g.fillRect(bx, rowY - bh, bwid, bh);
          if (bwid > 2) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(bx + bwid * 0.6, rowY - bh, bwid * 0.4, bh); }
        }
      }
      g.globalAlpha = 1;
      if (!o.preview) {
        const fs = lf || Math.max(8, Math.round(h / 16));
        g.font = `${fs}px Arial, Helvetica, sans-serif`; g.fillStyle = '#7a9aff'; g.textAlign = 'left';
        g.fillText('frequency →', x + 4, front + fs + 3);
        g.save(); g.translate(x + fw + depthX * 0.55 + 6, front - depthY * 0.55 + 4); g.rotate(-Math.atan2(depthY, depthX)); g.fillText('time →', 0, 0); g.restore();
        g.save(); g.translate(x - 4, front - 4); g.rotate(-Math.PI / 2); g.fillText('power →', 0, 0); g.restore();
      }
    }
    function gauss(x, y, w, h, big) {
      g.strokeStyle = '#2a4aa8'; g.lineWidth = 1; g.strokeRect(x, y, w, h);
      const c = S.cur, pw = big ? 0.85 : clamp(c.gp / 3, 0.2, 0.7);
      g.fillStyle = '#9ab0ff';
      for (let i = 0; i < gaussPts.length; i++) { const k = i / (gaussPts.length - 1), bell = Math.exp(-((k - 0.5) ** 2) / 0.02) * pw, v = clamp(bell + (gaussPts[i] - 0.5) * (big ? 0.12 : 0.35) + 0.1, 0, 1); g.fillRect(x + k * w - 1, y + h - v * h * 0.9 - 1, 2, 2); }
      g.strokeStyle = big ? '#ff3a3a' : '#ffd400'; g.beginPath();
      for (let i = 0; i <= 40; i++) { const k = i / 40, v = Math.exp(-((k - 0.5) ** 2) / 0.02) * pw + 0.1; i ? g.lineTo(x + k * w, y + h - v * h * 0.9) : g.moveTo(x + k * w, y + h - v * h * 0.9); }
      g.stroke();
    }
    function frame(dt) {
      T += dt;
      advance(performance.now());
      if (o.canvas && !o.canvas.getClientRects().length) return; // window hidden: keep crunching, skip drawing
      rowT += dt; if (rowT > 0.11) { rowT = 0; rows.pop(); rows.unshift(noiseRow()); if (R() < 0.3) gaussPts = gaussPts.map(v => clamp(v + (R() - 0.5) * 0.3, 0, 1)); }
      const c = S.cur, ev = st.ev;
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      if (o.blank && o.blank()) { // "Show graphics" switched off
        const fs = Math.max(10, Math.round(W / 50));
        text(`JACK@home is analysing data in the background. ${(c.p * 100).toFixed(3)}% done.`, 12, H / 2, '#4a6ad8', `${fs}px Arial, sans-serif`);
        return;
      }
      if (o.preview) {
        logo(g, 10, 14, 0.7);
        text('JACK@home', 18, 13, '#fff', 'bold 11px Arial, sans-serif');
        graph(6, 24, W - 12, H - 44);
        g.fillStyle = '#1a2a6a'; g.fillRect(6, H - 12, W - 12, 6); g.fillStyle = '#4a7aff'; g.fillRect(6, H - 12, (W - 12) * c.p, 6);
        if (ev && ev.k === 'signal' && ev.t < 7 && (T * 3 | 0) % 2) text('SIGNAL!', W / 2 - 22, H / 2, '#ff3030', 'bold 12px Arial');
        return;
      }
      const fs = clamp(Math.round(Math.min(W / 68, H / 34)), 9, 16), lh = Math.round(fs * 1.35), pad = Math.round(fs * 0.9);
      const fN = `${fs}px Arial, Helvetica, sans-serif`, fB = `bold ${fs}px Arial, Helvetica, sans-serif`;
      // title
      logo(g, pad + fs * 1.3, pad + fs * 1.6, fs / 9);
      text('JACK', pad + fs * 3, pad + fs * 1.7, '#fff', `bold ${Math.round(fs * 2)}px Arial, Helvetica, sans-serif`);
      let tw = g.measureText('JACK').width;
      text('@', pad + fs * 3 + tw, pad + fs * 1.7, '#ffd400');
      const aw = g.measureText('@').width;
      text('home', pad + fs * 3 + tw + aw, pad + fs * 1.7, '#fff');
      const tEnd = pad + fs * 3 + tw + aw + g.measureText('home').width;
      if (W > 480) text('The Search for Little Green Men', tEnd + fs, pad + fs * 1.6, '#7a9aff', `italic ${fs}px Arial, Helvetica, sans-serif`);
      const topY = pad + fs * 2.6;
      // panels
      const pct = (c.p * 100).toFixed(3) + '% done';
      const panels = [
        ['Data Analysis', [
          [ev && ev.k === 'send' ? 'Sending result...' : PHASES[st.phase], '#fff', fB],
          ['Doppler drift rate: ' + st.chirp.toFixed(4) + ' Hz/sec'],
          ['Resolution: ' + [0.075, 0.149, 0.298, 0.596, 1.193][st.phase % 5] + ' Hz'],
          [`Best gaussian: power ${(c.gp + c.p).toFixed(2)}, fit ${(1.5 + c.gs).toFixed(3)}, score ${(c.p * 0.9).toFixed(3)}`],
          [`Best spike: peak ${(c.sp + c.p * 3).toFixed(2)}, time ${(c.p * 107.4).toFixed(1)}, ${c.freq.toFixed(4)} GHz`],
          [pct, '#ffd400', fB], ['bar']]],
        ['Data Info', [
          ['From: ' + raDec(c)], ['(the Crab Nebula, Gubbinz Sector)'],
          [`Recorded on: ${c.jd.toFixed(5)} (${new Date(c.rec).toDateString().slice(4)})`],
          ['Source: Jackecibo Radio Telescope'], [`Base frequency: ${c.freq.toFixed(9)} GHz`], ['Work unit: ' + c.id]]],
        ['User Info', [
          ['Name: ' + ((window.Net && Net.me && Net.me.nick) || 'Jack'), '#fff'], ['Total work units: ' + S.wu], ['Total CPU time: ' + hms(S.cpu)],
          ['Aliens found: 0'], ['Microwaves found: ' + (S.sig || 0)],
          ['JackNet total: ' + (global == null ? '(connecting...)' : global.toLocaleString('en-GB') + (global === 1 ? ' work unit' : ' work units')), '#7aff9a']]],
      ];
      const cols = W >= 560 ? 3 : 1;
      let y = topY, maxY = topY;
      const colW = (W - pad * (cols + 1)) / cols;
      g.font = fN;
      panels.forEach((pn, i) => {
        if (cols === 1 && i === 1 && H < 620) return; // phones: skip Data Info if it won't fit
        const px = pad + (cols === 3 ? i * (colW + pad) : 0), py = cols === 3 ? topY : y;
        g.strokeStyle = '#1a3a9a'; g.lineWidth = 1;
        const n = pn[1].length, ph = lh * (n + 1) + pad * 0.6;
        g.strokeRect(px + 0.5, py + 0.5, colW - 1, ph);
        g.fillStyle = '#000'; g.font = fB; const hw = g.measureText(pn[0]).width; g.fillRect(px + 8, py - fs * 0.5, hw + 8, fs);
        text(pn[0], px + 12, py + fs * 0.35, '#4a7aff', fB);
        let ly = py + lh * 1.3;
        g.save(); g.beginPath(); g.rect(px + 2, py + 2, colW - 4, ph); g.clip();
        for (const [t, col, font] of pn[1]) {
          if (t === 'bar') { const bw = colW - 24; g.fillStyle = '#10204a'; g.fillRect(px + 12, ly - fs * 0.8, bw, fs * 0.8); g.fillStyle = '#3a6aff'; g.fillRect(px + 12, ly - fs * 0.8, bw * c.p, fs * 0.8); }
          else text(t, px + 12, ly, col || '#b8c8ff', font || fN);
          ly += lh;
        }
        g.restore();
        if (cols === 1) y = py + ph + pad * 1.4;
        maxY = Math.max(maxY, py + ph);
      });
      // graph + the gaussian box
      const gy = maxY + pad * 1.6, gh = H - gy - pad * 2.2;
      const showGauss = W >= 560 && gh > 60;
      const gw = showGauss ? W * 0.7 : W - pad * 3;
      if (gh > 30) {
        graph(pad * 2, gy, gw - pad, gh - fs * 1.2, fs);
        if (showGauss) {
          const bx = gw + pad * 2, bwid = W - bx - pad, bh = Math.min(gh * 0.6, bwid * 0.75);
          text(ev && ev.k === 'signal' ? 'Signal!' : 'Best Gaussian', bx, gy + fs, ev && ev.k === 'signal' ? '#ff4040' : '#4a7aff', fB);
          gauss(bx, gy + fs * 1.6, bwid, bh, ev && ev.k === 'signal');
          text(`power ${(ev && ev.k === 'signal' ? 24.7 : c.gp + c.p).toFixed(2)}  score ${(ev && ev.k === 'signal' ? 9.81 : c.p).toFixed(2)}`, bx, gy + fs * 2.8 + bh, '#b8c8ff', fN);
        }
      }
      // the excitement
      if (ev && ev.k === 'signal') {
        if (!st.seen && (o.full || (o.canvas && document.visibilityState === 'visible'))) { st.seen = true; E.secret('seti.signal'); }
        const bw = Math.min(W - pad * 4, fs * 34), bh = fs * 5.4, bx = (W - bw) / 2, by = gy + Math.max(0, (gh - bh) / 2 - fs);
        g.fillStyle = 'rgba(0,0,30,.88)'; g.fillRect(bx, by, bw, bh); g.strokeStyle = ev.t < 7 && (T * 4 | 0) % 2 ? '#ff2020' : '#ffd400'; g.lineWidth = 2; g.strokeRect(bx, by, bw, bh);
        g.textAlign = 'center';
        if (ev.t < 7) {
          if ((T * 3 | 0) % 2 === 0) text('*** POSSIBLE SIGNAL! ***', W / 2, by + fs * 2.2, '#ff3030', `bold ${Math.round(fs * 1.7)}px Arial, sans-serif`);
          text(`Gaussian power ${(20 + ev.t).toFixed(2)} at ${(1420.2 + ev.f * 0.4).toFixed(4)} MHz. Could this be... ALIENS?!`, W / 2, by + fs * 4, '#fff', fN);
        } else if (ev.t < 11) {
          text('Analysing signal' + '.'.repeat(1 + ((T * 3) | 0) % 3), W / 2, by + fs * 2.2, '#ffd400', `bold ${Math.round(fs * 1.4)}px Arial, sans-serif`);
          text('Checking the JackNet Interference Database...', W / 2, by + fs * 4, '#b8c8ff', fN);
        } else {
          text(`RESULT: it was ${ev.v[0]}.`, W / 2, by + fs * 2.2, '#7aff9a', `bold ${Math.round(fs * 1.25)}px Arial, sans-serif`);
          text(`(${ev.v[1]}). Not aliens. Sorry, Mulder. Back to work!`, W / 2, by + fs * 4, '#fff', fN);
        }
        g.textAlign = 'left';
      } else if (ev && ev.k === 'send' && gh > 30) {
        g.textAlign = 'center';
        const msg = ev.t < 1.5 ? 'Connecting to Jackecibo...' : ev.t < 3 ? 'Sending result... done.' : 'Getting new work unit...';
        g.font = `bold ${Math.round(fs * 1.3)}px Arial, sans-serif`; const mw = g.measureText(msg).width + fs * 2;
        g.fillStyle = 'rgba(0,0,30,.88)'; g.fillRect(W / 2 - mw / 2, gy + gh / 2 - fs * 1.6, mw, fs * 2.6); g.strokeStyle = '#4a7aff'; g.lineWidth = 1; g.strokeRect(W / 2 - mw / 2, gy + gh / 2 - fs * 1.6, mw, fs * 2.6);
        text(msg, W / 2, gy + gh / 2, '#ffd400');
        g.textAlign = 'left';
      }
      if (st.paused) { g.textAlign = 'center'; text('Processing stopped (Settings > Start processing)', W / 2, H - pad, '#ff8a40', fB); g.textAlign = 'left'; }
    }
    return { frame, stop() {} };
  }
  E.savers.seti = (g, W, H, o) => makeSeti(g, W, H, o);

  // ---------------------------------------------------------------- the program in a window
  E.mods.sqhome = K => {
    const w = K.w; w.body.style.padding = '0'; w.body.style.overflow = 'hidden';
    K.body.style.cssText = 'position:relative;width:100%;height:100%;min-height:200px;background:#000;overflow:hidden';
    const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    K.body.appendChild(cv);
    const g = cv.getContext('2d');
    let graphics = store.get('jhp_era_sqhgfx', true), inst = null, raf = 0, last = 0;
    const build = () => { const r = K.body.getBoundingClientRect(); cv.width = Math.max(100, Math.round(r.width)); cv.height = Math.max(80, Math.round(r.height)); inst = makeSeti(g, cv.width, cv.height, { window: true, canvas: cv, blank: () => !graphics }); };
    build();
    const ro = new ResizeObserver(() => { const r = K.body.getBoundingClientRect(); if (Math.round(r.width) !== cv.width || Math.round(r.height) !== cv.height) build(); });
    ro.observe(K.body);
    const loop = t => { if (K.closed) return; raf = requestAnimationFrame(loop); const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t; try { inst.frame(dt); } catch (e) { console.error(e); cancelAnimationFrame(raf); } };
    raf = requestAnimationFrame(loop);
    const status = t => K.status(t);
    listeners.add(status);
    K.onClose(() => { cancelAnimationFrame(raf); ro.disconnect(); listeners.delete(status); save(); });
    status(st.paused ? 'Processing stopped.' : 'Connected. Analysing work unit ' + S.cur.id + '...');
    const README = `JACK@home - READ ME\n====================\n\nThank you for joining the search for intelligent aliens!\n\nWHAT AM I LOOKING AT?\n- The big graph shows radio power at lots of frequencies (across)\n  over time (going back). Tall red bars = loud bits.\n- Data Analysis shows what your computer is doing to the data.\n- User Info shows how much YOU have done, and how much everyone\n  on JackNet has done together.\n\nIf a POSSIBLE SIGNAL turns up, JACK@home checks it against the\nJackNet Interference Database. So far every single signal has been\nsomething on Earth. Mostly Dave's microwave.\n\nTip: pick JACK@home in Display Properties > Screen Saver and your\ncomputer will hunt for E.T. every time you go for your tea.\n`;
    K.menus([
      ['File', [{ label: 'Run as Screen Saver', act: () => { if (window.Savers) Savers.start('JACK@home'); } }, '-', { label: 'Exit', act: () => w.close() }]],
      ['Settings', () => [
        { label: 'Show graphics', chk: graphics, act: () => { graphics = !graphics; store.set('jhp_era_sqhgfx', graphics); } },
        { label: st.paused ? 'Start processing' : 'Stop processing', act: () => { st.paused = !st.paused; store.set('jhp_era_sqhpause', st.paused); status(st.paused ? 'Processing stopped. The aliens will wait.' : 'Processing started again.'); } },
        '-', { label: 'Use as my Screen Saver', act: () => { try { localStorage.setItem('jhp_saver', 'JACK@home'); } catch (e) {} Desk.toast('JACK@home', 'JACK@home is now your screen saver. Go and have your tea!', 4000); } },
        { label: 'User info...', act: () => Desk.msgbox('JACK@home - User info', `Name: ${(window.Net && Net.me && Net.me.nick) || 'Jack'}\nWork units done: ${S.wu}\nCPU time: ${hms(S.cpu)}\nPossible signals: ${S.sig || 0} (all of them microwaves)\nJackNet total: ${global == null ? 'not connected' : global.toLocaleString('en-GB')} work units\n\nYou are in the top ${Math.max(1, 99 - S.wu * 3)}% of JACK@home users!`, 'info') },
      ]],
      ['Help', [{ label: 'Read Me', act: () => Apps.openFile({ name: 'README.TXT', type: 'txt', text: README }) }, '-', { label: 'About JACK@home...', act: () => E.about('JACK@home', E.I.sqhome, ['<b>JACK@home</b> v1.0', 'The Search for Little Green Men.', 'Jackecibo Space Lab, 1999. Started on 17 May 1999, the same day as a certain other famous screen saver.']) }]],
    ]);
  };
})();
