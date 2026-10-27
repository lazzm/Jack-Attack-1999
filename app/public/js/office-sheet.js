/* office-sheet: JackCalc, a Works/Lotus-flavoured spreadsheet. A1 refs, formulas (=SUM, AVERAGE, MIN, MAX, COUNT, COUNTIF,
 * SUMIF, IF, ROUND, DATE, TODAY... and Dad's old @SUM(A1..A5) style), number formats, column resizing, fill, sort, undo,
 * and bar / pie / line charts drawn in SVG. Files: .wks / .xls on C:. */
(function () {
  'use strict';
  const K = window.OfficeKit; if (!K) return;
  const { A, esc, h, qs, qsa, on, tap, touchy, msg, toast, today, ext, sfx, store } = K;
  const I = K.I;
  const NC = 26, NR = 120;
  const COLL = i => String.fromCharCode(65 + i);
  const idOf = (r, c) => COLL(c) + (r + 1);
  const parseId = id => { const m = /^\$?([A-Z])\$?(\d+)$/i.exec(id); return m ? { r: +m[2] - 1, c: m[1].toUpperCase().charCodeAt(0) - 65 } : null; };
  const ERR = e => ({ e });
  const isErr = v => v && typeof v === 'object' && 'e' in v;
  const SERIAL0 = Date.UTC(1899, 11, 30);
  const dateSerial = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - SERIAL0) / 864e5);
  const todaySerial = () => { const t = today(); return dateSerial(1999, t.m, t.d); };
  const serialDate = n => { const d = new Date(SERIAL0 + Math.round(n) * 864e5); return K.pad2(d.getUTCDate()) + '/' + K.pad2(d.getUTCMonth() + 1) + '/' + String(d.getUTCFullYear()).slice(2); };
  const TI = {
    new: '<svg viewBox="0 0 16 16"><path d="M3.5 1.5h6l3 3v10h-9z" fill="#fff" stroke="#000"/><path d="M9.5 1.5v3h3" fill="#c0c0c0" stroke="#000"/></svg>',
    open: '<svg viewBox="0 0 16 16"><path d="M1.5 3.5h5l1.5 1.5h7v9h-13.5z" fill="#f2d16b" stroke="#7a5a00"/><path d="M1.5 7.5h13.5" stroke="#7a5a00"/></svg>',
    save: '<svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" fill="#000080" stroke="#000"/><rect x="4" y="2" width="8" height="5" fill="#fff"/><rect x="4" y="9" width="8" height="5" fill="#c0c0c0"/><rect x="9" y="3" width="2" height="3" fill="#000080"/></svg>',
    print: '<svg viewBox="0 0 16 16"><rect x="4" y="1.5" width="8" height="5" fill="#fff" stroke="#000"/><rect x="1.5" y="6.5" width="13" height="6" fill="#c0c0c0" stroke="#000"/><rect x="4" y="10.5" width="8" height="4" fill="#fff" stroke="#000"/></svg>',
    cut: '<svg viewBox="0 0 16 16"><path d="M10 2L5.5 10M6 2l4.5 8" stroke="#000" stroke-width="1.2"/><circle cx="4.5" cy="12" r="2" fill="none" stroke="#000"/><circle cx="11.5" cy="12" r="2" fill="none" stroke="#000"/></svg>',
    copy: '<svg viewBox="0 0 16 16"><rect x="2.5" y="1.5" width="7" height="9" fill="#fff" stroke="#000"/><rect x="6.5" y="5.5" width="7" height="9" fill="#fff" stroke="#000"/></svg>',
    paste: '<svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="9" height="11" fill="#a0702a" stroke="#000"/><rect x="5" y="1.5" width="4" height="2" fill="#c0c0c0" stroke="#000"/><rect x="6.5" y="6.5" width="7" height="8" fill="#fff" stroke="#000"/></svg>',
    bold: '<svg viewBox="0 0 16 16"><text x="3" y="13" font-family="Times New Roman,serif" font-weight="bold" font-size="14">B</text></svg>',
    italic: '<svg viewBox="0 0 16 16"><text x="5" y="13" font-family="Times New Roman,serif" font-style="italic" font-size="14">I</text></svg>',
    under: '<svg viewBox="0 0 16 16"><text x="3.5" y="12" font-family="Times New Roman,serif" font-size="13">U</text><path d="M3 14h10" stroke="#000"/></svg>',
    left: '<svg viewBox="0 0 16 16"><path d="M2 3h12M2 6h8M2 9h12M2 12h8" stroke="#000"/></svg>',
    center: '<svg viewBox="0 0 16 16"><path d="M2 3h12M4 6h8M2 9h12M4 12h8" stroke="#000"/></svg>',
    right: '<svg viewBox="0 0 16 16"><path d="M2 3h12M6 6h8M2 9h12M6 12h8" stroke="#000"/></svg>',
    cur: '<svg viewBox="0 0 16 16"><text x="3" y="13" font-family="Arial" font-weight="bold" font-size="13" fill="#008000">£</text></svg>',
    pct: '<svg viewBox="0 0 16 16"><text x="1.5" y="12.5" font-family="Arial" font-weight="bold" font-size="12">%</text></svg>',
    comma: '<svg viewBox="0 0 16 16"><text x="1" y="11" font-family="Arial" font-weight="bold" font-size="9">,00</text></svg>',
    sum: '<svg viewBox="0 0 16 16"><path d="M12 3H4l5 5-5 5h8" fill="none" stroke="#000" stroke-width="1.6"/></svg>',
    chart: '<svg viewBox="0 0 16 16"><path d="M1.5 14.5h13" stroke="#000"/><rect x="2.5" y="8" width="3" height="6" fill="#e10600" stroke="#000"/><rect x="6.5" y="3" width="3" height="11" fill="#0028c8" stroke="#000"/><rect x="10.5" y="6" width="3" height="8" fill="#ffd400" stroke="#000"/></svg>',
    az: '<svg viewBox="0 0 16 16"><text x="1" y="7" font-family="Arial" font-size="7" fill="#000080">A</text><text x="1" y="15" font-family="Arial" font-size="7" fill="#e10600">Z</text><path d="M11 2v11M8 10l3 3 3-3" stroke="#000" fill="none"/></svg>',
    za: '<svg viewBox="0 0 16 16"><text x="1" y="7" font-family="Arial" font-size="7" fill="#e10600">Z</text><text x="1" y="15" font-family="Arial" font-size="7" fill="#000080">A</text><path d="M11 2v11M8 10l3 3 3-3" stroke="#000" fill="none"/></svg>',
  };

  // ================================================================ formulas
  const FNAMES = ['SUM', 'AVERAGE', 'AVG', 'MIN', 'MAX', 'COUNT', 'COUNTA', 'COUNTIF', 'SUMIF', 'IF', 'ROUND', 'INT', 'ABS', 'SQRT', 'MOD', 'POWER', 'PRODUCT', 'MEDIAN', 'AND', 'OR', 'NOT', 'LEN', 'UPPER', 'LOWER', 'CONCATENATE', 'TODAY', 'DATE', 'PI'];
  function tokenize(s) {
    const t = []; let i = 0;
    while (i < s.length) {
      const rest = s.slice(i); let m;
      if (/^\s/.test(rest)) { i++; continue; }
      if (rest[0] === '"') { const j = s.indexOf('"', i + 1); t.push({ k: 'str', v: s.slice(i + 1, j < 0 ? s.length : j) }); i = j < 0 ? s.length : j + 1; continue; }
      if ((m = /^@?([A-Za-z]{2,12})\s*\(/.exec(rest))) { t.push({ k: 'fn', v: m[1].toUpperCase() }); i += m[0].length; continue; }
      if ((m = /^(\$?[A-Za-z]\$?\d+)(?::|\.\.)(\$?[A-Za-z]\$?\d+)/.exec(rest))) { t.push({ k: 'rng', a: m[1].replace(/\$/g, '').toUpperCase(), b: m[2].replace(/\$/g, '').toUpperCase() }); i += m[0].length; continue; }
      if ((m = /^\$?[A-Za-z]\$?\d+/.exec(rest)) && !/^[A-Za-z]\d+[A-Za-z(]/.test(rest)) { t.push({ k: 'ref', v: m[0].replace(/\$/g, '').toUpperCase() }); i += m[0].length; continue; }
      if ((m = /^(TRUE|FALSE)\b/i.exec(rest))) { t.push({ k: 'num', v: /^t/i.test(m[1]) ? true : false }); i += m[0].length; continue; }
      if ((m = /^\d*\.?\d+(?:[eE][+-]?\d+)?/.exec(rest))) { t.push({ k: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if ((m = /^(<=|>=|<>|[-+*/^&%=<>(),;])/.exec(rest))) { t.push({ k: 'op', v: m[1] === ';' ? ',' : m[1] }); i += m[0].length; continue; }
      throw ERR('#NAME?');
    }
    return t;
  }
  function Sheet(data) {
    const S = { cells: {}, fmt: {}, colW: {}, chart: null };
    if (data) { Object.entries(data.cells || {}).forEach(([k, v]) => { S.cells[k.toUpperCase()] = String(v); }); S.colW = Object.assign({}, data.colW || {}); S.chart = data.chart || null;
      Object.entries(data.fmt || {}).forEach(([rng, spec]) => { const f = typeof spec === 'string' ? parseFmt(spec) : spec; eachIn(rng, id => { S.fmt[id] = Object.assign({}, S.fmt[id], f); }); }); }
    return S;
  }
  function parseFmt(spec) { const f = {}; spec.split(/\s+/).filter(Boolean).forEach(t => { if (/^(b|i|u)$/.test(t)) f[t] = 1; else if (/^(cur|pct|num|num0|date|gen)$/.test(t)) f.nf = t; else if (/^al=/.test(t)) f.al = t.slice(3); else if (/^c=/.test(t)) f.c = t.slice(2); else if (/^bg=/.test(t)) f.bg = t.slice(3); }); return f; }
  function eachIn(rng, fn) { const [a, b] = rng.split(':'); const p = parseId(a), q = parseId(b || a); if (!p || !q) return; for (let r = Math.min(p.r, q.r); r <= Math.max(p.r, q.r); r++) for (let c = Math.min(p.c, q.c); c <= Math.max(p.c, q.c); c++) fn(idOf(r, c), r, c); }
  // evaluates every cell; returns { vals: id -> value, circ: bool }
  function evaluate(S) {
    const vals = {}, busy = {}; let circ = false;
    const toNum = v => isErr(v) ? v : typeof v === 'number' ? v : typeof v === 'boolean' ? +v : v === '' || v == null ? 0 : isNaN(+v) ? ERR('#VALUE!') : +v;
    function cell(id) {
      if (id in vals) return vals[id];
      if (busy[id]) { circ = true; return ERR('#CIRC!'); }
      const raw = S.cells[id];
      if (raw == null || raw === '') return '';
      busy[id] = 1; let v;
      if (/^[=@+]/.test(raw) && raw.length > 1 && !/^\+\d/.test(raw) || /^@/.test(raw)) { try { v = formula(raw.replace(/^[=+]/, '')); } catch (e) { v = isErr(e) ? e : ERR('#ERR!'); } }
      else v = literal(raw).v;
      if (typeof v === 'number' && !isFinite(v)) v = ERR('#NUM!');
      delete busy[id]; vals[id] = v; return v;
    }
    function rangeVals(a, b) { const out = []; const p = parseId(a), q = parseId(b); if (!p || !q || p.r >= NR || q.r >= NR) throw ERR('#REF!'); eachIn(a + ':' + b, id => out.push(cell(id))); return out; }
    function formula(src) {
      const T = tokenize(src); let i = 0;
      const peek = () => T[i], next = () => T[i++], isOp = v => T[i] && T[i].k === 'op' && T[i].v === v;
      const expect = v => { if (!isOp(v)) throw ERR('#ERR!'); i++; };
      function cmp() { let a = cat(); while (T[i] && T[i].k === 'op' && /^(=|<>|<|>|<=|>=)$/.test(T[i].v)) { const o = next().v, b = cat(); if (isErr(a)) return a; if (isErr(b)) return b; const x = typeof a === 'string' || typeof b === 'string' ? [String(a).toLowerCase(), String(b).toLowerCase()] : [toNum(a), toNum(b)]; a = o === '=' ? x[0] === x[1] : o === '<>' ? x[0] !== x[1] : o === '<' ? x[0] < x[1] : o === '>' ? x[0] > x[1] : o === '<=' ? x[0] <= x[1] : x[0] >= x[1]; } return a; }
      function cat() { let a = add(); while (isOp('&')) { next(); const b = add(); a = isErr(a) ? a : isErr(b) ? b : String(a === true ? 'TRUE' : a === false ? 'FALSE' : a) + String(b); } return a; }
      function add() { let a = mul(); while (isOp('+') || isOp('-')) { const o = next().v, b = mul(); const x = toNum(a), y = toNum(b); a = isErr(x) ? x : isErr(y) ? y : o === '+' ? x + y : x - y; } return a; }
      function mul() { let a = pow(); while (isOp('*') || isOp('/')) { const o = next().v, b = pow(); const x = toNum(a), y = toNum(b); a = isErr(x) ? x : isErr(y) ? y : o === '*' ? x * y : (y === 0 ? ERR('#DIV/0!') : x / y); } return a; }
      function pow() { let a = una(); while (isOp('^')) { next(); const b = una(); const x = toNum(a), y = toNum(b); a = isErr(x) ? x : isErr(y) ? y : Math.pow(x, y); } return a; }
      function una() { if (isOp('-')) { next(); const v = toNum(una()); return isErr(v) ? v : -v; } if (isOp('+')) { next(); return una(); } let v = prim(); if (isOp('%')) { next(); const n = toNum(v); v = isErr(n) ? n : n / 100; } return v; }
      function prim() {
        const t = next(); if (!t) throw ERR('#ERR!');
        if (t.k === 'num' || t.k === 'str') return t.v;
        if (t.k === 'ref') { const p = parseId(t.v); if (!p || p.r >= NR) return ERR('#REF!'); return cell(t.v); }
        if (t.k === 'rng') return { range: rangeVals(t.a, t.b) };
        if (t.k === 'op' && t.v === '(') { const v = cmp(); expect(')'); return v; }
        if (t.k === 'fn') { const args = []; if (!isOp(')')) { do { if (isOp(',')) next(); args.push(cmp()); } while (isOp(',')); } expect(')'); return call(t.v, args); }
        throw ERR('#ERR!');
      }
      const v = cmp(); if (i < T.length) throw ERR('#ERR!');
      return v && v.range ? (v.range.length === 1 ? v.range[0] : ERR('#VALUE!')) : v;
    }
    function flat(args) { const out = []; args.forEach(a => { if (a && a.range) a.range.forEach(x => out.push({ v: x, ref: true })); else out.push({ v: a, ref: false }); }); return out; }
    function nums(args) { const out = []; for (const { v, ref } of flat(args)) { if (isErr(v)) throw v; if (typeof v === 'number') out.push(v); else if (!ref && v !== '') { const n = toNum(v); if (isErr(n)) throw n; out.push(n); } } return out; }
    function crit(c) { const m = /^(<=|>=|<>|<|>|=)?(.*)$/.exec(String(c)); const op = m[1] || '=', rhs = m[2], num = rhs !== '' && !isNaN(+rhs); return v => { const x = num ? (typeof v === 'number' ? v : NaN) : String(v).toLowerCase(), y = num ? +rhs : rhs.toLowerCase(); return op === '=' ? x === y : op === '<>' ? x !== y : op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y; }; }
    function call(fn, a) {
      const N = () => nums(a);
      switch (fn) {
        case 'SUM': return N().reduce((s, x) => s + x, 0);
        case 'AVERAGE': case 'AVG': { const n = N(); return n.length ? n.reduce((s, x) => s + x, 0) / n.length : ERR('#DIV/0!'); }
        case 'MIN': { const n = N(); return n.length ? Math.min(...n) : 0; }
        case 'MAX': { const n = N(); return n.length ? Math.max(...n) : 0; }
        case 'MEDIAN': { const n = N().sort((x, y) => x - y); if (!n.length) return ERR('#NUM!'); const m = n.length >> 1; return n.length % 2 ? n[m] : (n[m - 1] + n[m]) / 2; }
        case 'PRODUCT': return N().reduce((s, x) => s * x, 1);
        case 'COUNT': return flat(a).filter(x => typeof x.v === 'number').length;
        case 'COUNTA': return flat(a).filter(x => x.v !== '').length;
        case 'COUNTIF': { const f = crit(a[1]); return (a[0] && a[0].range || [a[0]]).filter(f).length; }
        case 'SUMIF': { const f = crit(a[1]), r = a[0] && a[0].range || [a[0]], s = a[2] ? (a[2].range || [a[2]]) : r; return r.reduce((t, v, i) => t + (f(v) && typeof s[i] === 'number' ? s[i] : 0), 0); }
        case 'IF': { const c = a[0]; if (isErr(c)) return c; const truthy = typeof c === 'string' ? c !== '' : !!toNum(c); return truthy ? (a[1] === undefined ? true : a[1]) : (a[2] === undefined ? false : a[2]); }
        case 'ROUND': { const x = toNum(a[0]), n = toNum(a[1] || 0); if (isErr(x)) return x; const p = Math.pow(10, n); return Math.round(x * p) / p; }
        case 'INT': { const x = toNum(a[0]); return isErr(x) ? x : Math.floor(x); }
        case 'ABS': { const x = toNum(a[0]); return isErr(x) ? x : Math.abs(x); }
        case 'SQRT': { const x = toNum(a[0]); return isErr(x) ? x : x < 0 ? ERR('#NUM!') : Math.sqrt(x); }
        case 'MOD': { const x = toNum(a[0]), y = toNum(a[1]); return isErr(x) ? x : isErr(y) ? y : y === 0 ? ERR('#DIV/0!') : x - y * Math.floor(x / y); }
        case 'POWER': { const x = toNum(a[0]), y = toNum(a[1]); return isErr(x) ? x : isErr(y) ? y : Math.pow(x, y); }
        case 'AND': return flat(a).every(x => !!toNum(x.v));
        case 'OR': return flat(a).some(x => !!toNum(x.v));
        case 'NOT': return !toNum(a[0]);
        case 'LEN': return String(a[0] == null ? '' : a[0]).length;
        case 'UPPER': return String(a[0] == null ? '' : a[0]).toUpperCase();
        case 'LOWER': return String(a[0] == null ? '' : a[0]).toLowerCase();
        case 'CONCATENATE': return flat(a).map(x => x.v).join('');
        case 'TODAY': return todaySerial();
        case 'DATE': { const y = toNum(a[0]), m = toNum(a[1]), d = toNum(a[2]); if ([y, m, d].some(isErr)) return ERR('#VALUE!'); if (y >= 2000) return ERR('#Y2K!'); return dateSerial(y < 100 ? 1900 + y : y, m, d); }
        case 'PI': return Math.PI;
        default: return ERR('#NAME?');
      }
    }
    Object.keys(S.cells).forEach(cell);
    return { vals, circ };
  }
  // typed text -> { v, nf }
  function literal(raw) {
    const s = String(raw).trim(); let m;
    if (s === '') return { v: '' };
    if (/^'/.test(s)) return { v: s.slice(1) };
    if ((m = /^(-)?£\s*([\d,]*\.?\d+)$/.exec(s))) return { v: (m[1] ? -1 : 1) * parseFloat(m[2].replace(/,/g, '')), nf: 'cur' };
    if ((m = /^(-?[\d,]*\.?\d+)\s*%$/.exec(s))) return { v: parseFloat(m[1].replace(/,/g, '')) / 100, nf: 'pct' };
    if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(s))) { const y = +m[3] < 100 ? 1900 + +m[3] : +m[3]; if (y < 2000 && +m[2] >= 1 && +m[2] <= 12) return { v: dateSerial(y, +m[2], +m[1]), nf: 'date' }; }
    if (/^-?[\d,]*\.?\d+(e[+-]?\d+)?$/i.test(s) && !/,,/.test(s)) return { v: parseFloat(s.replace(/,/g, '')) };
    if (/^true$/i.test(s)) return { v: true };
    if (/^false$/i.test(s)) return { v: false };
    return { v: String(raw) };
  }
  const commas = (n, dp) => { const s = Math.abs(n).toFixed(dp).split('.'); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (n < 0 ? '-' : '') + s.join('.'); };
  function show(v, f) {
    if (isErr(v)) return v.e;
    if (v === true) return 'TRUE'; if (v === false) return 'FALSE';
    if (typeof v !== 'number') return String(v);
    const nf = f && f.nf;
    if (nf === 'cur') return (v < 0 ? '-£' : '£') + commas(Math.abs(v), 2);
    if (nf === 'pct') return commas(v * 100, Math.abs(v * 100 - Math.round(v * 100)) > 0.001 ? 1 : 0) + '%';
    if (nf === 'num') return commas(v, 2);
    if (nf === 'num0') return commas(Math.round(v), 0);
    if (nf === 'date') return serialDate(v);
    if (Number.isInteger(v)) return String(v);
    return String(+v.toPrecision(10));
  }
  // shift relative refs in a formula by dr/dc (absolute $ parts stay put)
  function shiftRefs(raw, dr, dc, cond) {
    if (!/^[=@+]/.test(raw)) return raw;
    return raw.split('"').map((part, i) => i % 2 ? part : part.replace(/(@?[A-Za-z]{2,12}\s*\()|(\$?)([A-Za-z])(\$?)(\d+)(?![A-Za-z(])/g, (m, fn, d1, col, d2, row) => {
      if (fn) return fn;
      const c0 = col.toUpperCase().charCodeAt(0) - 65, r0 = +row - 1;
      if (cond && !cond(r0, c0)) return m;
      const c = d1 ? c0 : c0 + dc, r = d2 ? r0 : r0 + dr;
      if (c < 0 || r < 0 || c >= NC) return '#REF!';
      return d1 + COLL(c) + d2 + (r + 1);
    })).join('"');
  }

  // ================================================================ the window
  function openCalc(arg) {
    arg = arg || {};
    let node = arg.node || null, name = node ? node.name : 'Untitled.wks';
    let S = Sheet(null), V = { vals: {}, circ: false }, saved = '';
    let ar = 0, ac = 0, er = 0, ec = 0; // anchor + extent of the selection
    let editing = null, showF = false, ext8 = false, clip = null, undo = [], redo = [];
    const b = h('', 'jc'); b.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0';
    const w = K.win(name + ' - JackCalc', b, { w: 700, h: 480, menubar: true, status: true, icon: I.calc, minW: 280, minH: 200 });
    const tb = K.toolbar([
      { t: 'New', i: TI.new, a: () => newSheet() }, { t: 'Open', i: TI.open, a: () => openDlg() }, { t: 'Save', i: TI.save, a: () => save() }, { t: 'Print', i: TI.print, a: () => print() }, '|',
      { t: 'Cut', i: TI.cut, a: () => { copy(); clearSel(); } }, { t: 'Copy', i: TI.copy, a: () => copy() }, { t: 'Paste', i: TI.paste, a: () => paste() }, '|',
      { t: 'Bold', i: TI.bold, a: () => toggleF('b'), id: 'b' }, { t: 'Italic', i: TI.italic, a: () => toggleF('i'), id: 'i' }, { t: 'Underline', i: TI.under, a: () => toggleF('u'), id: 'u' }, '|',
      { t: 'Align Left', i: TI.left, a: () => setF({ al: 'l' }) }, { t: 'Center', i: TI.center, a: () => setF({ al: 'c' }) }, { t: 'Align Right', i: TI.right, a: () => setF({ al: 'r' }) }, '|',
      { t: 'Currency (£)', i: TI.cur, a: () => setF({ nf: 'cur' }) }, { t: 'Percent', i: TI.pct, a: () => setF({ nf: 'pct' }) }, { t: 'Comma (2 decimal places)', i: TI.comma, a: () => setF({ nf: 'num' }) }, '|',
      { t: 'AutoSum', i: TI.sum, a: () => autoSum() }, { t: 'Sort Ascending', i: TI.az, a: () => sort(1) }, { t: 'Sort Descending', i: TI.za, a: () => sort(-1) }, { t: 'Chart Wizard', i: TI.chart, a: () => chartDlg() },
    ]);
    const fb = h(`<input class="jc-name" type="text" aria-label="Cell reference" value="A1"><span class="jc-fx">=</span><input class="jc-formula" type="text" aria-label="Formula" spellcheck="false" autocomplete="off">`, 'jc-fbar');
    const grid = h('', 'jc-grid'); grid.tabIndex = 0;
    const tabs = h('<span class="on">Sheet1</span><span>Sheet2</span><span>Sheet3</span>', 'jc-tabs');
    b.append(tb, fb, grid, tabs);
    const nameBox = qs(fb, '.jc-name'), fx = qs(fb, '.jc-formula');
    const [stSum, stFlags] = K.statusParts(w, ['', '']); stFlags.className = 'of-sst';
    // ---- grid DOM
    const colw = c => S.colW[COLL(c)] || 72;
    function build() {
      let s = `<table><colgroup><col style="width:34px">${Array.from({ length: NC }, (_, c) => `<col data-c="${c}" style="width:${colw(c)}px">`).join('')}</colgroup><thead><tr><th></th>${Array.from({ length: NC }, (_, c) => `<th data-c="${c}"><span>${COLL(c)}</span><i class="jc-rs" data-rs="${c}"></i></th>`).join('')}</tr></thead><tbody>`;
      for (let r = 0; r < NR; r++) s += `<tr><th data-r="${r}">${r + 1}</th>${'<td></td>'.repeat(NC)}</tr>`;
      grid.innerHTML = s + '</tbody></table>';
      qs(grid, 'table').style.width = (34 + Array.from({ length: NC }, (_, c) => colw(c)).reduce((x, y) => x + y, 0)) + 'px';
    }
    const td = (r, c) => grid.querySelector('tbody').rows[r].cells[c + 1];
    let shown = new Set();
    function recalc() {
      V = evaluate(S);
      const now = new Set(Object.keys(S.cells).filter(k => S.cells[k] !== '').concat(Object.keys(S.fmt)));
      shown.forEach(id => { if (!now.has(id)) paint(id); });
      now.forEach(paint); shown = now;
      stFlags.textContent = [V.circ ? 'CIRC' : '', ext8 ? 'EXT' : '', showF ? 'FORMULAS' : '', 'NUM'].filter(Boolean).join('  ');
      if (V.circ) K.secret('calccirc');
      if (Object.entries(V.vals).some(([id, v]) => typeof v === 'number' && v >= 1e6 && (S.fmt[id] || {}).nf === 'cur')) K.secret('calcrich');
      status();
    }
    function paint(id) {
      const p = parseId(id); if (!p || p.r >= NR || p.c >= NC) return;
      const cell = td(p.r, p.c), f = S.fmt[id] || {}, raw = S.cells[id] || '', v = V.vals[id] === undefined ? '' : V.vals[id];
      cell.textContent = showF && /^[=@]/.test(raw) ? raw : show(v, f);
      const num = typeof v === 'number' || (isErr(v));
      cell.className = (num && !f.al ? 'num' : '') + (isErr(v) ? ' err' : '') + (f.b ? ' b' : '') + (f.i ? ' i' : '') + (f.u ? ' u' : '') + (f.al ? ' a' + f.al : '');
      cell.style.color = f.c || ''; cell.style.background = f.bg || '';
      if (!num && cell.textContent && p.c < NC - 1 && !S.cells[idOf(p.r, p.c + 1)]) cell.classList.add('over');
    }
    function selBox() { return { r0: Math.min(ar, er), r1: Math.max(ar, er), c0: Math.min(ac, ec), c1: Math.max(ac, ec) }; }
    function drawSel() {
      qsa(grid, '.sel,.rng').forEach(e => e.classList.remove('sel', 'rng'));
      const s = selBox();
      for (let r = s.r0; r <= s.r1; r++) for (let c = s.c0; c <= s.c1; c++) td(r, c).classList.add(r === ar && c === ac ? 'sel' : 'rng');
      for (let c = s.c0; c <= s.c1; c++) qs(grid, `thead th[data-c="${c}"]`).classList.add('sel');
      for (let r = s.r0; r <= s.r1; r++) qs(grid, `tbody th[data-r="${r}"]`).classList.add('sel');
      nameBox.value = s.r0 === s.r1 && s.c0 === s.c1 ? idOf(ar, ac) : `${idOf(s.r0, s.c0)}:${idOf(s.r1, s.c1)}`;
      if (!editing) fx.value = S.cells[idOf(ar, ac)] || '';
      const f = S.fmt[idOf(ar, ac)] || {}; ['b', 'i', 'u'].forEach(k => tb.btns[k].classList.toggle('on', !!f[k]));
      status();
    }
    function status() {
      const s = selBox(); let sum = 0, n = 0;
      for (let r = s.r0; r <= s.r1; r++) for (let c = s.c0; c <= s.c1; c++) { const v = V.vals[idOf(r, c)]; if (typeof v === 'number') { sum += v; n++; } }
      w.status.textContent = editing ? (editing.point ? 'Point' : 'Enter') : 'Ready';
      stSum.textContent = n > 1 ? `SUM=${show(sum, S.fmt[idOf(ar, ac)])}   AVG=${show(+(sum / n).toFixed(4))}` : n === 1 ? `SUM=${show(sum, S.fmt[idOf(ar, ac)])}` : '';
    }
    function scrollTo(r, c) { const cell = td(r, c), g = grid; const L = cell.offsetLeft - 34, T = cell.offsetTop - 18; if (L < g.scrollLeft) g.scrollLeft = L; else if (cell.offsetLeft + cell.offsetWidth > g.scrollLeft + g.clientWidth) g.scrollLeft = cell.offsetLeft + cell.offsetWidth - g.clientWidth; if (T < g.scrollTop) g.scrollTop = T; else if (cell.offsetTop + cell.offsetHeight > g.scrollTop + g.clientHeight) g.scrollTop = cell.offsetTop + cell.offsetHeight - g.clientHeight; }
    function go(r, c, extend) { r = K.clamp(r, 0, NR - 1); c = K.clamp(c, 0, NC - 1); if (extend || ext8) { er = r; ec = c; } else { ar = er = r; ac = ec = c; } drawSel(); scrollTo(extend || ext8 ? er : ar, extend || ext8 ? ec : ac); }
    // ---- changes + undo
    const snap = () => JSON.stringify({ c: S.cells, f: S.fmt, w: S.colW });
    let jcSv = null; // (the autosave, set up at the start below)
    function change(fn) { undo.push(snap()); if (undo.length > 60) undo.shift(); redo = []; fn(); recalc(); drawSel(); if (jcSv) jcSv.save(); }
    function restore(js) { const o = JSON.parse(js); S.cells = o.c; S.fmt = o.f; S.colW = o.w; build(); shown = new Set(Object.keys(S.fmt)); recalc(); drawSel(); if (jcSv) jcSv.save(); }
    const doUndo = () => { if (!undo.length) return; redo.push(snap()); restore(undo.pop()); };
    const doRedo = () => { if (!redo.length) return; undo.push(snap()); restore(redo.pop()); };
    function setCell(id, raw) {
      raw = String(raw);
      if (raw === '') { delete S.cells[id]; return; }
      if (/^[=@+]/.test(raw) && raw.length > 1 && !/^\+\d+(\.\d+)?$/.test(raw)) {
        if (/^@|@[A-Z]|\.\./i.test(raw)) K.secret('calclotus');
        if (/SUM\s*\(/i.test(raw)) K.secret('calcsum');
        S.cells[id] = raw.replace(/^=?\s*/, '=').replace(/^=@/, '@').replace(/[a-z]{2,12}\s*\(/gi, x => x.toUpperCase()).replace(/\b([a-z])(\d+)\b/g, (m, c, r) => c.toUpperCase() + r);
        if (S.cells[id].startsWith('@')) S.cells[id] = S.cells[id];
        return;
      }
      const L = literal(raw); S.cells[id] = raw;
      if (L.nf && !(S.fmt[id] && S.fmt[id].nf)) S.fmt[id] = Object.assign({}, S.fmt[id], { nf: L.nf });
    }
    function setF(o) { change(() => { const s = selBox(); for (let r = s.r0; r <= s.r1; r++) for (let c = s.c0; c <= s.c1; c++) { const id = idOf(r, c); S.fmt[id] = Object.assign({}, S.fmt[id], o); Object.keys(S.fmt[id]).forEach(k => { if (S.fmt[id][k] === null || S.fmt[id][k] === 0) delete S.fmt[id][k]; }); } }); }
    const toggleF = k => setF({ [k]: (S.fmt[idOf(ar, ac)] || {})[k] ? 0 : 1 });
    function clearSel() { change(() => { const s = selBox(); for (let r = s.r0; r <= s.r1; r++) for (let c = s.c0; c <= s.c1; c++) delete S.cells[idOf(r, c)]; }); }
    // ---- editing
    const POINTABLE = /[=+\-*/^(,:<>&]$/;
    function startEdit(initial, inBar) {
      if (editing) return;
      const cell = td(ar, ac), id = idOf(ar, ac);
      editing = { id, r: ar, c: ac, point: false };
      if (inBar) { editing.bar = true; fx.focus(); if (initial != null) fx.value = initial; status(); return; }
      const inp = h('', 'jc-edit', 'input'); inp.type = 'text'; inp.spellcheck = false; inp.autocomplete = 'off';
      inp.style.left = cell.offsetLeft + 'px'; inp.style.top = cell.offsetTop + 'px'; inp.style.minWidth = cell.offsetWidth + 'px'; inp.style.height = cell.offsetHeight + 'px';
      inp.value = initial != null ? initial : (S.cells[id] || '');
      grid.appendChild(inp); editing.inp = inp; fx.value = inp.value;
      inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
      on(inp, 'input', () => { fx.value = inp.value; inp.style.width = Math.max(cell.offsetWidth, inp.value.length * 7 + 10) + 'px'; editing.point = /^[=@]/.test(inp.value) && POINTABLE.test(inp.value); status(); });
      on(inp, 'keydown', editKeys);
      on(inp, 'blur', () => setTimeout(() => { if (editing && editing.inp === inp && document.activeElement !== fx && !editing.pointing) commit(0, 0); }, 120));
      status();
    }
    function commit(dr, dc) {
      if (!editing) return;
      const val = editing.inp ? editing.inp.value : fx.value, id = editing.id, r = editing.r, c = editing.c;
      if (editing.inp) editing.inp.remove(); editing = null;
      if (val !== (S.cells[id] || '')) change(() => setCell(id, val));
      ar = er = r; ac = ec = c;
      go(r + dr, c + dc); grid.focus({ preventScroll: true });
    }
    function cancelEdit() { if (!editing) return; if (editing.inp) editing.inp.remove(); editing = null; drawSel(); grid.focus({ preventScroll: true }); }
    function editKeys(ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); commit(ev.shiftKey ? -1 : 1, 0); }
      else if (ev.key === 'Tab') { ev.preventDefault(); commit(0, ev.shiftKey ? -1 : 1); }
      else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); cancelEdit(); }
      else if (/^Arrow/.test(ev.key) && editing && editing.inp && !/^[=@]/.test(editing.inp.value)) { ev.preventDefault(); commit(ev.key === 'ArrowDown' ? 1 : ev.key === 'ArrowUp' ? -1 : 0, ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0); }
    }
    on(fx, 'focus', () => { if (!editing) startEdit(null, true); });
    on(fx, 'input', () => { if (editing) { if (editing.inp) editing.inp.value = fx.value; editing.point = /^[=@]/.test(fx.value) && POINTABLE.test(fx.value); status(); } });
    on(fx, 'keydown', ev => { if (!editing) startEdit(null, true); editKeys(ev); });
    on(fx, 'blur', () => setTimeout(() => { if (editing && editing.bar && document.activeElement !== fx && !editing.pointing) commit(0, 0); }, 150));
    on(nameBox, 'keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); const [a, b2] = nameBox.value.toUpperCase().split(':'); const p = parseId(a), q = parseId(b2 || a); if (p && q && p.r < NR && q.r < NR) { ar = p.r; ac = p.c; er = q.r; ec = q.c; drawSel(); scrollTo(ar, ac); grid.focus(); } else msg('JackCalc', 'Reference is not valid.', 'warn'); } });
    // ---- mouse / touch on the grid
    let dragging = false;
    on(grid, 'pointerdown', ev => {
      const rs = ev.target.closest('.jc-rs');
      if (rs) return colResize(ev, +rs.dataset.rs);
      const cell = ev.target.closest('td'), rh = ev.target.closest('tbody th'), ch = ev.target.closest('thead th[data-c]');
      if (ev.target.closest('.jc-edit')) return;
      if (editing && editing.point && cell) { // point mode: clicking a cell types its reference
        ev.preventDefault(); editing.pointing = true;
        const ref = idOf(cell.parentNode.rowIndex - 1, cell.cellIndex - 1), t = editing.inp || fx;
        t.value += ref; fx.value = t.value; if (editing.inp) editing.inp.dispatchEvent(new Event('input'));
        setTimeout(() => { if (editing) { editing.pointing = false; t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 0);
        return;
      }
      if (editing) commit(0, 0);
      if (cell) { const r = cell.parentNode.rowIndex - 1, c = cell.cellIndex - 1, was = r === ar && c === ac && ar === er && ac === ec && !ev.shiftKey; go(r, c, ev.shiftKey); if (ev.pointerType === 'mouse') { dragging = true; grid.setPointerCapture(ev.pointerId); } else if (was) { setTimeout(() => startEdit(), 0); return; } }
      else if (rh) { const r = +rh.dataset.r; ar = r; er = r; ac = 0; ec = NC - 1; drawSel(); }
      else if (ch) { const c = +ch.dataset.c; ac = c; ec = c; ar = 0; er = NR - 1; drawSel(); }
      if (!touchy()) setTimeout(() => grid.focus({ preventScroll: true }), 0);
    });
    on(grid, 'pointermove', ev => { if (!dragging) return; const el = document.elementFromPoint(ev.clientX, ev.clientY), cell = el && el.closest && el.closest('td'); if (cell && grid.contains(cell)) { const r = cell.parentNode.rowIndex - 1, c = cell.cellIndex - 1; if (r !== er || c !== ec) { er = r; ec = c; drawSel(); } } });
    on(grid, 'pointerup', () => { dragging = false; });
    on(grid, 'dblclick', ev => { if (ev.target.closest('td')) startEdit(); });
    function colResize(ev, c) {
      ev.preventDefault(); ev.stopPropagation();
      const x0 = ev.clientX, w0 = colw(c), el = ev.target; el.setPointerCapture(ev.pointerId);
      const before = snap();
      const mv = e => { S.colW[COLL(c)] = Math.max(16, Math.round(w0 + e.clientX - x0)); qs(grid, `col[data-c="${c}"]`).style.width = colw(c) + 'px'; qs(grid, 'table').style.width = (34 + Array.from({ length: NC }, (_, i) => colw(i)).reduce((x, y) => x + y, 0)) + 'px'; };
      const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); if (snap() !== before) { undo.push(before); redo = []; } };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
    }
    on(grid, 'dblclick', ev => { const rs = ev.target.closest('.jc-rs'); if (rs) autoFit(+rs.dataset.rs); });
    function autoFit(c) { change(() => { let m = 30; for (let r = 0; r < NR; r++) { const t = td(r, c).textContent; if (t) m = Math.max(m, t.length * 7 + 10); } S.colW[COLL(c)] = Math.min(400, m); build(); shown = new Set(Object.keys(S.fmt)); }); }
    // ---- keyboard
    on(grid, 'keydown', ev => {
      if (editing || ev.target !== grid) return;
      const k = ev.key, c = ev.ctrlKey || ev.metaKey, sh = ev.shiftKey;
      const mv = (dr, dc) => { ev.preventDefault(); if (sh || ext8) go((sh || ext8 ? er : ar) + dr, (sh || ext8 ? ec : ac) + dc, true); else go(ar + dr, ac + dc); };
      if (k === 'ArrowDown') mv(c ? NR : 1, 0); else if (k === 'ArrowUp') mv(c ? -NR : -1, 0); else if (k === 'ArrowLeft') mv(0, c ? -NC : -1); else if (k === 'ArrowRight') mv(0, c ? NC : 1);
      else if (k === 'PageDown') mv(20, 0); else if (k === 'PageUp') mv(-20, 0);
      else if (k === 'Home') { ev.preventDefault(); go(c ? 0 : ar, 0); }
      else if (k === 'Enter') mv(sh ? -1 : 1, 0); else if (k === 'Tab') mv(0, sh ? -1 : 1);
      else if (k === 'Delete' || k === 'Backspace') { ev.preventDefault(); if (k === 'Backspace') startEdit(''); else clearSel(); }
      else if (k === 'F2') { ev.preventDefault(); startEdit(); }
      else if (k === 'F8') { ev.preventDefault(); ext8 = !ext8; recalc(); }
      else if (k === 'F9') { ev.preventDefault(); recalc(); }
      else if (k === 'F5') { ev.preventDefault(); goDlg(); }
      else if (c && k.toLowerCase() === 'c') { ev.preventDefault(); copy(); }
      else if (c && k.toLowerCase() === 'x') { ev.preventDefault(); copy(); clearSel(); }
      else if (c && k.toLowerCase() === 'v') { ev.preventDefault(); paste(); }
      else if (c && k.toLowerCase() === 'z') { ev.preventDefault(); doUndo(); }
      else if (c && k.toLowerCase() === 'y') { ev.preventDefault(); doRedo(); }
      else if (c && k.toLowerCase() === 'b') { ev.preventDefault(); toggleF('b'); }
      else if (c && k.toLowerCase() === 'i') { ev.preventDefault(); toggleF('i'); }
      else if (c && k.toLowerCase() === 'u') { ev.preventDefault(); toggleF('u'); }
      else if (c && k.toLowerCase() === 's') { ev.preventDefault(); save(); }
      else if (c && k.toLowerCase() === 'o') { ev.preventDefault(); openDlg(); }
      else if (c && k.toLowerCase() === 'n') { ev.preventDefault(); newSheet(); }
      else if (c && k.toLowerCase() === 'a') { ev.preventDefault(); ar = 0; ac = 0; er = NR - 1; ec = NC - 1; drawSel(); }
      else if (c && k.toLowerCase() === 'd') { ev.preventDefault(); fill(1); }
      else if (c && k.toLowerCase() === 'r') { ev.preventDefault(); fill(0); }
      else if (c && k === '`') { ev.preventDefault(); showF = !showF; recalc(); }
      else if (k.length === 1 && !c && !ev.altKey) { ev.preventDefault(); startEdit(k); }
    });
    // ---- clipboard, fill, sort, autosum, insert/delete
    function copy() {
      const s = selBox(), cells = {};
      for (let r = s.r0; r <= s.r1; r++) for (let c = s.c0; c <= s.c1; c++) { const id = idOf(r, c); cells[(r - s.r0) + ',' + (c - s.c0)] = { raw: S.cells[id], f: S.fmt[id] }; }
      clip = { cells, h: s.r1 - s.r0 + 1, w: s.c1 - s.c0 + 1, r0: s.r0, c0: s.c0 };
      const tsv = []; for (let r = s.r0; r <= s.r1; r++) { const row = []; for (let c = s.c0; c <= s.c1; c++) row.push(td(r, c).textContent); tsv.push(row.join('\t')); }
      try { navigator.clipboard && navigator.clipboard.writeText(tsv.join('\n')).catch(() => {}); } catch (e) {}
      w.status.textContent = 'Copied. Select where to paste, then press Ctrl+V.';
    }
    function paste() {
      if (!clip) return msg('JackCalc', 'There is nothing to paste. Copy some cells first.', 'info');
      change(() => { Object.entries(clip.cells).forEach(([k, o]) => { const [dr, dc] = k.split(',').map(Number), r = ar + dr, c = ac + dc; if (r >= NR || c >= NC) return; const id = idOf(r, c); if (o.raw == null) delete S.cells[id]; else S.cells[id] = shiftRefs(o.raw, r - (clip.r0 + dr), c - (clip.c0 + dc)); if (o.f) S.fmt[id] = Object.assign({}, o.f); else delete S.fmt[id]; }); });
    }
    function fill(down) { change(() => { const s = selBox(); if (down) { for (let c = s.c0; c <= s.c1; c++) { const src = S.cells[idOf(s.r0, c)]; for (let r = s.r0 + 1; r <= s.r1; r++) { if (src == null) delete S.cells[idOf(r, c)]; else S.cells[idOf(r, c)] = shiftRefs(src, r - s.r0, 0); if (S.fmt[idOf(s.r0, c)]) S.fmt[idOf(r, c)] = Object.assign({}, S.fmt[idOf(s.r0, c)]); } } } else { for (let r = s.r0; r <= s.r1; r++) { const src = S.cells[idOf(r, s.c0)]; for (let c = s.c0 + 1; c <= s.c1; c++) { if (src == null) delete S.cells[idOf(r, c)]; else S.cells[idOf(r, c)] = shiftRefs(src, 0, c - s.c0); } } } }); }
    function sort(dir) {
      let s = selBox();
      if (s.r0 === s.r1) { // whole block around the active cell
        let r0 = ar, r1 = ar; while (r0 > 0 && S.cells[idOf(r0 - 1, ac)] != null) r0--; while (r1 < NR - 1 && S.cells[idOf(r1 + 1, ac)] != null) r1++;
        if (r0 < r1 && isNaN(+(V.vals[idOf(r0, ac)])) && !isNaN(+(V.vals[idOf(r0 + 1, ac)]))) r0++;
        let c0 = ac, c1 = ac; while (c0 > 0 && S.cells[idOf(r0, c0 - 1)] != null) c0--; while (c1 < NC - 1 && S.cells[idOf(r0, c1 + 1)] != null) c1++;
        s = { r0, r1, c0, c1 };
      }
      change(() => {
        const rows = []; for (let r = s.r0; r <= s.r1; r++) { const row = []; for (let c = s.c0; c <= s.c1; c++) row.push([S.cells[idOf(r, c)], S.fmt[idOf(r, c)], V.vals[idOf(r, c)]]); rows.push(row); }
        const k = ac - s.c0; rows.sort((x, y) => { const a = x[k][2], bb = y[k][2]; if (typeof a === 'number' && typeof bb === 'number') return (a - bb) * dir; return String(a == null ? '' : a).localeCompare(String(bb == null ? '' : bb)) * dir; });
        rows.forEach((row, i) => row.forEach(([raw, f], j) => { const id = idOf(s.r0 + i, s.c0 + j); if (raw == null) delete S.cells[id]; else S.cells[id] = /^[=@]/.test(raw) ? raw : raw; if (f) S.fmt[id] = f; else delete S.fmt[id]; }));
      });
      w.status.textContent = `Sorted rows ${s.r0 + 1} to ${s.r1 + 1} by column ${COLL(ac)}.`;
    }
    function autoSum() {
      const isNum = (r, c) => typeof V.vals[idOf(r, c)] === 'number';
      let r = ar - 1; while (r >= 0 && isNum(r, ac)) r--;
      let range = null;
      if (r < ar - 1) range = `${idOf(r + 1, ac)}:${idOf(ar - 1, ac)}`;
      else { let c = ac - 1; while (c >= 0 && isNum(ar, c)) c--; if (c < ac - 1) range = `${idOf(ar, c + 1)}:${idOf(ar, ac - 1)}`; }
      if (!range) return startEdit('=SUM(');
      change(() => setCell(idOf(ar, ac), `=SUM(${range})`)); K.secret('calcsum');
    }
    function insertAt(axis, del) {
      change(() => {
        const at = axis === 'r' ? ar : ac, d = del ? -1 : 1, nc = {}, nf = {};
        const move = (id, val, map) => { const p = parseId(id), pos = axis === 'r' ? p.r : p.c; if (del && pos === at) return; const np = pos >= at + (del ? 1 : 0) ? pos + d : pos; const nid = axis === 'r' ? idOf(np, p.c) : idOf(p.r, np); if (np >= 0 && np < (axis === 'r' ? NR : NC)) map[nid] = val; };
        Object.entries(S.cells).forEach(([id, raw]) => move(id, shiftRefs(raw, axis === 'r' ? d : 0, axis === 'c' ? d : 0, (r, c) => (axis === 'r' ? r : c) >= at + (del ? 1 : 0)), nc));
        Object.entries(S.fmt).forEach(([id, f]) => move(id, f, nf));
        S.cells = nc; S.fmt = nf;
      });
    }
    // ---- file ops
    const data = () => ({ cells: Object.assign({}, S.cells), fmt: Object.assign({}, S.fmt), colW: Object.assign({}, S.colW), chart: S.chart });
    function load(d) { S = Sheet(d && d.cells ? d : null); undo = []; redo = []; build(); shown = new Set(); ar = ac = er = ec = 0; recalc(); drawSel(); saved = snap(); grid.scrollTop = grid.scrollLeft = 0; }
    function loadNode(n) { K.readDoc(n).then(d => { node = n; name = n.name; w.setTitle(name + ' - JackCalc'); load(d); if (n.secret) A.secret(n.secret); }); }
    const dirty = () => snap() !== saved;
    function newSheet() { confirm(() => { node = null; name = 'Untitled.wks'; w.setTitle(name + ' - JackCalc'); load(null); if (jcSv) jcSv.save(); }); }
    const confirm = next => dirty() ? K.askSave('JackCalc', name, save, next) : next();
    K.guardClose(w, 'JackCalc', () => name, dirty, save);
    const TYPES = [['JackCalc Spreadsheet (*.wks)', ['wks']], ['Spreadsheet (*.xls)', ['xls']], ['Text, tab separated (*.txt)', ['txt']]];
    function openDlg() { K.fileDlg({ mode: 'open', title: 'Open', types: [['Spreadsheets (*.wks; *.xls)', ['wks', 'xls']], ['All Files (*.*)', ['*']]], dir: node ? K.pathOf(node) : K.MD + '/Spreadsheets', icon: I.calc }, n => confirm(() => { if (!/^(wks|xls)$/.test(ext(n.name))) return msg('JackCalc', `${n.name}\n\nThis isn't a spreadsheet. JackCalc only does numbers. (And words in boxes.)`, 'warn'); loadNode(n); })); }
    function save(then) {
      if (node && node.user) return write(K.pathOf(node), node.name, then);
      if (node && !node.user) return msg('JackCalc', `${name}\n\nThis file is read-only. (It's one of Jack's.)\n\nSave a copy with a different name?`, 'warn', [['Save As...', () => saveAs(then)], ['Cancel']]);
      saveAs(then);
    }
    function saveAs(then) { K.fileDlg({ mode: 'save', title: 'Save As', types: TYPES, name: name.startsWith('Untitled') ? '' : name, dir: node ? K.pathOf(node) : K.MD + '/Spreadsheets', typeIndex: ext(name) === 'xls' ? 1 : 0, icon: I.calc }, t => write(t.dir, t.name, then)); }
    function write(dir, fname, then) {
      let n;
      if (ext(fname) === 'txt') { const rows = []; let maxR = 0, maxC = 0; Object.keys(S.cells).forEach(id => { const p = parseId(id); maxR = Math.max(maxR, p.r); maxC = Math.max(maxC, p.c); }); for (let r = 0; r <= maxR; r++) { const row = []; for (let c = 0; c <= maxC; c++) row.push(td(r, c).textContent); rows.push(row.join('\t')); } n = K.saveUser(dir, fname, 'txt', rows.join('\n')); if (n) toast('JackCalc', 'Saved as text. The formulas have been turned into plain numbers. (Jotpad can open it.)', 3500); return; }
      n = K.saveUser(dir, fname, ext(fname), data()); if (!n) return;
      node = n; name = fname; saved = snap(); if (jcSv) jcSv.save(); w.setTitle(name + ' - JackCalc'); toast('JackCalc', `Saved to ${dir.replace(/\//g, '\\')}\\${fname}`, 2500); if (then) then();
    }
    function print() { const used = Object.keys(S.cells).length; msg('Print', `Printing ${name} (${used} cells, ${Math.max(1, Math.ceil(used / 200))} page${used > 200 ? 's' : ''})...\n\nThe printer is out of cyan. Your numbers came out in red. Dad says that's "very accountant".`, 'warn'); }
    function goDlg() { const d = K.dialog('Go To', `<div class="of-grid2"><label>Reference:</label><input type="text" class="gr" value="${idOf(ar, ac)}"></div>`, [['OK', bb => { const p = parseId(qs(bb, '.gr').value.trim()); if (!p || p.r >= NR || p.c >= NC) { msg('Go To', 'Reference is not valid.', 'warn'); return false; } go(p.r, p.c); }], ['Cancel']], { w: 260, icon: I.calc }); return d; }
    function findDlg() { K.dialog('Find', `<div class="of-grid2"><label>Find what:</label><input type="text" class="fq"></div>`, [['Find Next', bb => { const q = qs(bb, '.fq').value.toLowerCase(); if (!q) return false; const start = ar * NC + ac + 1; for (let i = 0; i < NR * NC; i++) { const j = (start + i) % (NR * NC), r = Math.floor(j / NC), c = j % NC; const id = idOf(r, c); if (((S.cells[id] || '') + ' ' + td(r, c).textContent).toLowerCase().includes(q)) { go(r, c); return false; } } msg('Find', `Cannot find "${q}".`, 'info'); return false; }], ['Close']], { w: 320, side: true, icon: I.calc }); }
    function numDlg() {
      const f = S.fmt[idOf(ar, ac)] || {}, opts = [['gen', 'General', '1234.5'], ['num', 'Number (2 decimal places)', '1,234.50'], ['num0', 'Whole number', '1,235'], ['cur', 'Currency (£)', '£1,234.50'], ['pct', 'Percent', '50%'], ['date', 'Date (dd/mm/yy)', '16/07/99']];
      K.dialog('Number Format', `<p>Format for ${esc(nameBox.value)}:</p><div class="field of-list" style="height:118px">${opts.map(o => `<div class="it${(f.nf || 'gen') === o[0] ? ' sel' : ''}" data-v="${o[0]}">${o[1]} <span style="color:#808080;float:right">${o[2]}</span></div>`).join('')}</div>`,
        [['OK', bb => { const s = qs(bb, '.it.sel'); if (s) setF({ nf: s.dataset.v === 'gen' ? null : s.dataset.v }); }], ['Cancel']], { w: 340, side: true, icon: I.calc }).b.addEventListener('click', ev => { const it = ev.target.closest('.it'); if (it) qsa(it.parentNode, '.it').forEach(x => x.classList.toggle('sel', x === it)); });
    }
    function widthDlg() { K.dialog('Column Width', `<div class="of-grid2"><label>Column width (pixels):</label><input type="number" class="cw" min="16" max="400" value="${colw(ac)}"></div>`, [['OK', bb => { const v = K.clamp(+qs(bb, '.cw').value || 72, 16, 400); change(() => { const s = selBox(); for (let c = s.c0; c <= s.c1; c++) S.colW[COLL(c)] = v; build(); shown = new Set(Object.keys(S.fmt)); }); }], ['Cancel'], ['AutoFit', () => autoFit(ac)]], { w: 300, icon: I.calc }); }
    function fnDlg() {
      const help = { SUM: 'Adds numbers up', AVERAGE: 'The mean (add up, divide by how many)', MIN: 'The smallest', MAX: 'The biggest', COUNT: 'How many numbers', COUNTIF: 'How many match, e.g. COUNTIF(A1:A9,"YES")', SUMIF: 'Adds the ones that match', IF: 'IF(test, yes, no)', ROUND: 'ROUND(number, places)', DATE: 'DATE(1999,7,16) - a date', TODAY: 'Today (it\'s 1999)', MEDIAN: 'The middle one', CONCATENATE: 'Sticks words together', LEN: 'How many letters', SQRT: 'Square root', MOD: 'The remainder', PRODUCT: 'Multiplies them all' };
      K.dialog('Paste Function', `<p>Function name:</p><div class="field of-list" style="height:150px">${FNAMES.filter(f => f !== 'AVG').map((f, i) => `<div class="it${i ? '' : ' sel'}" data-f="${f}"><b>${f}</b> <span class="of-small" style="color:#808080">${esc(help[f] || '')}</span></div>`).join('')}</div>`,
        [['OK', bb => { const s = qs(bb, '.it.sel'); if (s) { if (editing) { const t = editing.inp || fx; t.value += s.dataset.f + '('; t.focus(); } else startEdit('=' + s.dataset.f + '('); } }], ['Cancel']], { w: 380, side: true, icon: I.calc }).b.addEventListener('click', ev => { const it = ev.target.closest('.it'); if (it) qsa(it.parentNode, '.it').forEach(x => x.classList.toggle('sel', x === it)); });
    }
    const swatches = (key) => Object.entries(K.COLS).map(([n, c]) => ({ label: n[0].toUpperCase() + n.slice(1), icon: `<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="${c}" stroke="#000"/></svg>`, act: () => setF({ [key]: key === 'bg' && c === '#ffffff' ? null : c }) }));
    // ---- charts
    function chartData(range, vals) {
      const s = range ? (() => { const [a, b2] = range.split(':'); const p = parseId(a), q = parseId(b2); return { r0: p.r, c0: p.c, r1: q.r, c1: q.c }; })() : selBox();
      const labels = [], series = [];
      const vcol = vals ? parseId(vals.split(':')[0]).c : s.c1;
      const multi = !vals && s.c1 - s.c0 >= 2;
      const cols = multi ? Array.from({ length: s.c1 - s.c0 }, (_, i) => s.c0 + 1 + i) : [vcol];
      let r0 = s.r0;
      const hdr = cols.every(c => typeof V.vals[idOf(r0, c)] !== 'number') && s.r1 > s.r0;
      cols.forEach(c => series.push({ name: hdr ? String(V.vals[idOf(r0, c)] || COLL(c)) : 'Column ' + COLL(c), v: [] }));
      if (hdr) r0++;
      for (let r = r0; r <= s.r1; r++) {
        const lab = s.c0 === vcol && !vals ? String(r + 1) : show(V.vals[idOf(r, s.c0)] || '', S.fmt[idOf(r, s.c0)]);
        const nums = cols.map(c => V.vals[idOf(r, c)]); if (nums.every(v => typeof v !== 'number')) continue;
        labels.push(lab || String(r + 1)); nums.forEach((v, i) => series[i].v.push(typeof v === 'number' ? v : 0));
      }
      return { labels, series };
    }
    function chartDlg() {
      const s = selBox(), single = s.r0 === s.r1 && s.c0 === s.c1;
      if (single && !S.chart) return msg('Chart Wizard', 'Select the numbers you want in the chart first (drag across the cells, or hold Shift and use the arrow keys).\n\nTip: put the names in the first column and the numbers next to them.', 'info');
      const d = K.dialog('Chart Wizard - Step 1 of 1', `<p>What kind of chart would you like?</p><div class="row" style="gap:10px"><label><input type="radio" name="ct" value="bar" checked> Bar</label><label><input type="radio" name="ct" value="bar3"> 3-D Bar</label><label><input type="radio" name="ct" value="pie"> Pie</label><label><input type="radio" name="ct" value="line"> Line</label></div><div class="of-grid2" style="margin-top:8px"><label>Chart title:</label><input type="text" class="ctt" value="${esc(name.replace(/\.[a-z]+$/i, ''))}"><label>Data:</label><span class="of-small">${single ? 'the chart saved with this sheet (' + esc(S.chart.range) + ')' : esc(nameBox.value)}</span></div>`,
        [['Finish', bb => { const cd = single ? chartData(S.chart.range, S.chart.vals) : chartData(); if (!cd.labels.length) { msg('Chart Wizard', 'There are no numbers in that selection to draw.', 'warn'); return false; } showChart(qs(bb, 'input[name=ct]:checked').value, qs(bb, '.ctt').value, cd); }], ['Cancel']], { w: 360, icon: I.calc });
      if (single && S.chart && S.chart.type) { const r = qs(d.b, `input[value="${S.chart.type}"]`); if (r) r.checked = true; }
    }
    function showChart(type, title, cd) {
      K.secret('calcchart'); sfx('pet');
      const cb = h('', 'jc-chart');
      const cw = K.win(title + ' - Chart', cb, { w: 460, h: 360, menubar: true, icon: I.calc, minW: 220, minH: 180 });
      const PAL = ['#0028c8', '#e10600', '#ffd400', '#008000', '#800080', '#00a0a0', '#ff8000', '#808080', '#ff40a0', '#00c000', '#8a4a1a', '#000080'];
      const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = x => Math.max(0, Math.min(255, Math.round(x * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
      let legend = true;
      function draw() {
        const W = 460, H = 320, L = cd.labels, Sr = cd.series;
        let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"><rect width="${W}" height="${H}" fill="#fff"/><text x="${W / 2}" y="18" text-anchor="middle" class="ttl">${esc(title)}</text>`;
        const lw = legend ? 110 : 0;
        if (type === 'pie') {
          const v = Sr[0].v.map(x => Math.max(0, x)), tot = v.reduce((a, b2) => a + b2, 0) || 1, cx = (W - lw) / 2, cy = H / 2 + 12, R = Math.min(cx - 20, cy - 34);
          let a0 = -Math.PI / 2;
          s += `<ellipse cx="${cx}" cy="${cy + 10}" rx="${R}" ry="${R * 0.62}" fill="#808080"/>`;
          v.forEach((x, i) => { const a1 = a0 + x / tot * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0, p = (a, rr) => `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr * 0.62).toFixed(1)}`; if (x > 0) s += `<path d="M${cx},${cy} L${p(a0, R)} A${R},${R * 0.62} 0 ${big} 1 ${p(a1, R)} Z" fill="${PAL[i % PAL.length]}" stroke="#000" stroke-width=".8"/>`; const am = (a0 + a1) / 2; if (x / tot > 0.04) s += `<text x="${(cx + Math.cos(am) * R * 0.66).toFixed(1)}" y="${(cy + Math.sin(am) * R * 0.66 * 0.62 + 4).toFixed(1)}" text-anchor="middle" fill="#fff" style="font-weight:bold;paint-order:stroke" stroke="#000" stroke-width="2">${Math.round(x / tot * 100)}%</text>`; a0 = a1; });
          if (legend) L.forEach((l, i) => { if (i < 14) s += `<rect x="${W - lw + 4}" y="${34 + i * 18}" width="10" height="10" fill="${PAL[i % PAL.length]}" stroke="#000"/><text x="${W - lw + 18}" y="${43 + i * 18}">${esc(String(l).slice(0, 16))}</text>`; });
        } else {
          const all = Sr.flatMap(x => x.v), mx = Math.max(0, ...all), mn = Math.min(0, ...all), span = (mx - mn) || 1;
          const px = 48, py = 30, gw = W - px - 14 - lw, gh = H - py - 40;
          const step = Math.pow(10, Math.floor(Math.log10(span / 4 || 1))), nice = [1, 2, 5, 10].map(k => k * step).find(k => span / k <= 6) || step * 10;
          const top = Math.ceil(mx / nice) * nice, bot = Math.floor(mn / nice) * nice, rng = (top - bot) || 1, Y = v => py + gh - (v - bot) / rng * gh;
          s += `<rect x="${px}" y="${py}" width="${gw}" height="${gh}" fill="#f4f4f4" stroke="#000"/>`;
          for (let v = bot; v <= top + 1e-9; v += nice) s += `<path d="M${px} ${Y(v).toFixed(1)}h${gw}" stroke="#c0c0c0"/><text x="${px - 4}" y="${(Y(v) + 3).toFixed(1)}" text-anchor="end">${show(+v.toPrecision(6), { nf: Math.abs(v) >= 10000 ? 'num0' : '' })}</text>`;
          const n = L.length, gw1 = gw / n, bw = Math.max(3, gw1 * 0.7 / Sr.length);
          Sr.forEach((sr, si) => {
            const col = PAL[si % PAL.length];
            if (type === 'line') { s += `<polyline fill="none" stroke="${col}" stroke-width="2.5" points="${sr.v.map((v, i) => `${(px + gw1 * (i + 0.5)).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}"/>`; sr.v.forEach((v, i) => { s += `<rect x="${(px + gw1 * (i + 0.5) - 3).toFixed(1)}" y="${(Y(v) - 3).toFixed(1)}" width="6" height="6" fill="${col}" stroke="#000"/>`; }); }
            else sr.v.forEach((v, i) => { const x = px + gw1 * i + gw1 * 0.15 + si * bw, y0 = Y(Math.max(0, v)), hh = Math.abs(Y(v) - Y(0)), c = Sr.length === 1 ? PAL[i % PAL.length] : col; if (type === 'bar3') s += `<path d="M${(x + bw).toFixed(1)} ${y0.toFixed(1)}l5 -5v${hh.toFixed(1)}l-5 5z" fill="${shade(c, 0.6)}" stroke="#000" stroke-width=".5"/><path d="M${x.toFixed(1)} ${y0.toFixed(1)}l5 -5h${bw.toFixed(1)}l-5 5z" fill="${shade(c, 1.3)}" stroke="#000" stroke-width=".5"/>`; s += `<rect x="${x.toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5, hh).toFixed(1)}" fill="${c}" stroke="#000" stroke-width=".6"/>`; });
          });
          L.forEach((l, i) => { if (n <= 16 || i % Math.ceil(n / 16) === 0) s += `<text x="${(px + gw1 * (i + 0.5)).toFixed(1)}" y="${py + gh + 13}" text-anchor="middle">${esc(String(l).slice(0, n > 8 ? 8 : 14))}</text>`; });
          if (legend) (Sr.length > 1 ? Sr.map((x, i) => [x.name, PAL[i % PAL.length]]) : L.slice(0, 14).map((l, i) => [l, type === 'line' ? PAL[0] : PAL[i % PAL.length]])).forEach(([l, c], i) => { s += `<rect x="${W - lw + 4}" y="${34 + i * 18}" width="10" height="10" fill="${c}" stroke="#000"/><text x="${W - lw + 18}" y="${43 + i * 18}">${esc(String(l).slice(0, 16))}</text>`; });
        }
        cb.innerHTML = s + '</svg>';
      }
      A.menubar(cw, [
        ['File', [{ label: 'Print...', act: () => msg('Print', 'Printing chart... The bars came out in "sunset" colours. The printer is out of cyan. Again.', 'warn') }, '-', { label: 'Close', act: cw.close }]],
        ['Gallery', () => [['bar', 'Bar'], ['bar3', '3-D Bar'], ['pie', 'Pie'], ['line', 'Line']].map(([t, l]) => ({ label: l, rad: type === t, act: () => { type = t; draw(); } }))],
        ['View', () => [{ label: 'Legend', chk: legend, act: () => { legend = !legend; draw(); } }]],
      ]);
      draw();
    }
    // ---- menus
    A.menubar(w, [
      ['File', () => [{ label: 'New', key: 'Ctrl+N', act: newSheet }, { label: 'Open...', key: 'Ctrl+O', act: openDlg }, { label: 'Save', key: 'Ctrl+S', act: () => save() }, { label: 'Save As...', act: () => saveAs() }, '-', { label: 'Print...', key: 'Ctrl+P', act: print }, { label: 'Page Setup...', act: () => msg('Page Setup', 'Paper: A4\nOrientation: Landscape (spreadsheets are wide)\nGridlines: printed\nHeaders: "JackCalc - top secret numbers"', 'info') }, '-', { label: 'Exit', act: () => confirm(() => { saved = snap(); w.close(); }) }]],
      ['Edit', () => [{ label: 'Undo', key: 'Ctrl+Z', dis: !undo.length, act: doUndo }, { label: 'Redo', key: 'Ctrl+Y', dis: !redo.length, act: doRedo }, '-', { label: 'Cut', key: 'Ctrl+X', act: () => { copy(); clearSel(); } }, { label: 'Copy', key: 'Ctrl+C', act: copy }, { label: 'Paste', key: 'Ctrl+V', dis: !clip, act: paste }, { label: 'Clear', key: 'Del', act: clearSel }, '-', { label: 'Fill Down', key: 'Ctrl+D', act: () => fill(1) }, { label: 'Fill Right', key: 'Ctrl+R', act: () => fill(0) }, '-', { label: 'Select All', key: 'Ctrl+A', act: () => { ar = 0; ac = 0; er = NR - 1; ec = NC - 1; drawSel(); } }, { label: 'Extend Selection', key: 'F8', chk: ext8, act: () => { ext8 = !ext8; recalc(); } }, { label: 'Go To...', key: 'F5', act: goDlg }, { label: 'Find...', key: 'Ctrl+F', act: findDlg }]],
      ['View', () => [{ label: 'Toolbar', chk: tb.style.display !== 'none', act: () => { tb.style.display = tb.style.display === 'none' ? '' : 'none'; } }, { label: 'Formula Bar', chk: fb.style.display !== 'none', act: () => { fb.style.display = fb.style.display === 'none' ? '' : 'none'; } }, { label: 'Gridlines', chk: !grid.classList.contains('nogrid'), act: () => { grid.classList.toggle('nogrid'); qsa(grid, 'td').forEach(t => { t.style.borderColor = grid.classList.contains('nogrid') ? 'transparent' : ''; }); } }, '-', { label: 'Formulas', key: 'Ctrl+`', chk: showF, act: () => { showF = !showF; recalc(); } }]],
      ['Insert', () => [{ label: 'Row', act: () => insertAt('r') }, { label: 'Column', act: () => insertAt('c') }, { label: 'Delete Row', act: () => insertAt('r', true) }, { label: 'Delete Column', act: () => insertAt('c', true) }, '-', { label: 'Function...', act: fnDlg }, { label: 'Today\'s Date', act: () => change(() => { S.cells[idOf(ar, ac)] = '=TODAY()'; S.fmt[idOf(ar, ac)] = Object.assign({}, S.fmt[idOf(ar, ac)], { nf: 'date' }); }) }, '-', { label: 'Chart...', act: chartDlg }]],
      ['Format', () => [{ label: 'Number...', act: numDlg }, { label: 'Alignment', sub: [{ label: 'Left', act: () => setF({ al: 'l' }) }, { label: 'Center', act: () => setF({ al: 'c' }) }, { label: 'Right', act: () => setF({ al: 'r' }) }, { label: 'General', act: () => setF({ al: null }) }] }, { label: 'Font', sub: [{ label: 'Bold', key: 'Ctrl+B', act: () => toggleF('b') }, { label: 'Italic', key: 'Ctrl+I', act: () => toggleF('i') }, { label: 'Underline', key: 'Ctrl+U', act: () => toggleF('u') }, '-', { label: 'Colour', sub: () => swatches('c') }] }, { label: 'Fill Colour', sub: () => swatches('bg') }, '-', { label: 'Column Width...', act: widthDlg }, { label: 'AutoFit Column', act: () => autoFit(ac) }]],
      ['Tools', () => [{ label: 'Sort Ascending', act: () => sort(1) }, { label: 'Sort Descending', act: () => sort(-1) }, { label: 'AutoSum', act: autoSum }, '-', { label: 'Recalculate Now', key: 'F9', act: recalc }, { label: 'Y2K Check...', act: () => msg('Y2K Check', 'JackCalc stores years as four digits. It is Year 2000 compliant.\n\n(Dad\'s old spreadsheet stored them as two. That\'s why his accounts think 1900 was a very cheap year.)\n\nTry =DATE(2000,1,1) and see what happens.', 'info') }]],
      ['Help', () => [{ label: 'Help Topics', act: () => A.openFile({ name: 'JackCalc Help.txt', type: 'txt', text: CALC_HELP }) }, '-', { label: 'About JackCalc', act: () => msg('About JackCalc', 'JackCalc 99\nVersion 1.0 (Lotas-ish, Works-ish, Jack-ish)\n\n26 columns. 120 rows. Enough for all of Jack\'s pocket money, ever.\n\nLicensed to: Jack (and his Mom)', 'info') }]],
    ]);
    // ---- start
    load(null);
    if (node) loadNode(node);
    // unsaved cells are autosaved (js/gamesave.js, one for JackCalc): they come back in the next blank JackCalc.
    // Saving forgets it; so does closing the window and saying No. (A window that never had changes leaves it alone.)
    if (A.gameSaver) {
      let owned = false; const blank = saved;
      jcSv = A.gameSaver('jackcalc', () => { const d = dirty(); if (d) owned = true; return !owned ? undefined : d ? { data: data(), name, path: node ? A.fs.pathOf(node) : '', ar, ac } : null; }, { v: 1, delay: 800 });
      const close0 = w.close; w.close = function () { if (!w.closed && jcSv) { if (owned) jcSv.clear(); jcSv.stop(); } return close0.apply(this, arguments); };
      const kept = !node ? jcSv.load() : null;
      if (kept && kept.data && kept.data.cells) {
        const nd = kept.path ? A.fs.get(kept.path) : null; if (nd) node = nd;
        name = String(kept.name || name); w.setTitle(name + ' - JackCalc');
        load(kept.data); saved = nd ? '' : blank; owned = true; go(+kept.ar || 0, +kept.ac || 0);
      }
    }
    grid.focus({ preventScroll: true });
    return w;
  }
  const CALC_HELP = `JACKCALC HELP
=============

CELLS
  Each box is a cell. Columns are letters (A to Z), rows are numbers (1 to 120). So the top-left box is A1.
  Click a cell and start typing. Press Enter to go down, Tab to go right. F2 (or double-click) edits a cell.

FORMULAS
  Start with = and JackCalc does the maths.
    =A1+A2           adds two cells
    =SUM(A1:A10)     adds everything from A1 to A10
    =AVERAGE(B2:B9)  the average
    =MIN(...) =MAX(...)  the smallest / biggest
    =IF(C3<0.25,"BUY MORE","ok")   decides things
    =COUNTIF(D3:D12,"YES")  counts the matches
    =DATE(1999,7,16)-TODAY()  days until something good
  While you type a formula, click a cell to put its name in. Ooh.
  Dad's old computer used @SUM(A1..A10). JackCalc understands that too.

FORMATTING
  Bold/Italic/Underline, alignment, £, % and commas are on the toolbar. Format > Number has more.
  Drag the edge of a column letter to make it wider. Double-click the edge to fit.

CHARTS
  Select the names and the numbers next to them, then press the chart button. Bar, 3-D bar, pie or line.

ERRORS
  #DIV/0!  you divided by zero. Mr Bell says don't.
  #CIRC!   a cell depends on itself. It's going round in circles.
  #NAME?   JackCalc doesn't know that word.
  #Y2K!    you asked for a date in the year 2000. It isn't 2000. It's 1999.
`;
  K.apps.calc = arg => openCalc(arg);
})();
