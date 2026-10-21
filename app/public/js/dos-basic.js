/* dos-basic: JBASIC, Jack's QBasic-style BASIC. A tokenizer, a recursive-descent parser, a compiler to a flat
 * list of ops (so GOTO works), a time-sliced interpreter (an infinite loop can't freeze the browser) with text
 * and SCREEN 13 graphics, PC-speaker PLAY/SOUND, and the blue IDE with menus, dialogs and F5. */
(function () {
  'use strict';
  const DOS = window.DOS, K = DOS.core, A = window.Apps, P = DOS.progs;
  const S = id => { try { return A.secret('dos.' + id); } catch (e) { return false; } };
  class BasicError extends Error { constructor(msg, line) { super(msg); this.basic = true; this.line = line; } }
  const BREAK = { brk: true };
  const err = (m, l) => { throw new BasicError(m, l); };

  // ================================================================ tokenizer
  const OPS2 = ['<=', '>=', '<>', '=<', '=>', '><'];
  function tokenize(src) {
    const t = []; let i = 0; const n = src.length;
    while (i < n) {
      const c = src[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === "'") break;
      if (c === '"') { let j = i + 1, s = ''; while (j < n && src[j] !== '"') s += src[j++]; t.push({ t: 's', v: s, p: i }); i = j + 1; continue; }
      if (/[0-9.]/.test(c) && (c !== '.' || /[0-9]/.test(src[i + 1] || ''))) { const m = /^(\d+\.?\d*|\.\d+)([eEdD][-+]?\d+)?[%&!#]?/.exec(src.slice(i)); t.push({ t: 'n', v: parseFloat(m[0].replace(/[dD]/, 'e').replace(/[%&!#]$/, '')), p: i }); i += m[0].length; continue; }
      if (c === '&' && /[hHoObB]/.test(src[i + 1] || '')) { const m = /^&([hH][0-9a-fA-F]+|[oO][0-7]+|[bB][01]+)/.exec(src.slice(i)); if (m) { const b = /h/i.test(m[1][0]) ? 16 : /o/i.test(m[1][0]) ? 8 : 2; t.push({ t: 'n', v: parseInt(m[1].slice(1), b), p: i }); i += m[0].length; continue; } }
      if (/[A-Za-z_]/.test(c)) { const m = /^[A-Za-z_][A-Za-z0-9_.]*[$%&!#]?/.exec(src.slice(i)); const v = m[0].toUpperCase(); if (v === 'REM') break; t.push({ t: 'i', v, p: i }); i += m[0].length; continue; }
      const two = src.substr(i, 2); if (OPS2.includes(two)) { t.push({ t: 'o', v: two === '=<' ? '<=' : two === '=>' ? '>=' : two === '><' ? '<>' : two, p: i }); i += 2; continue; }
      if ('+-*/\\^()=<>,;:#?'.includes(c)) { t.push({ t: 'o', v: c, p: i }); i++; continue; }
      throw new BasicError('Syntax error');
    }
    return t;
  }
  const STMT_KW = new Set('PRINT INPUT LET IF THEN ELSE ELSEIF END FOR TO STEP NEXT WHILE WEND DO LOOP UNTIL EXIT GOTO GOSUB RETURN ON SUB FUNCTION DECLARE CALL DIM REDIM SHARED STATIC CONST COMMON OPTION BASE DATA READ RESTORE SELECT CASE IS CLS COLOR LOCATE SCREEN PSET PRESET LINE CIRCLE PAINT SLEEP BEEP SOUND PLAY RANDOMIZE STOP SYSTEM SWAP WIDTH KEY DEF SEG POKE OUT WAIT DEFINT DEFSNG DEFDBL DEFLNG DEFSTR ERROR RESUME SHELL FILES CHAIN RUN LPRINT PALETTE VIEW WINDOW DRAW GET PUT OPEN CLOSE TYPE AS INTEGER LONG SINGLE DOUBLE STRING AND OR NOT XOR EQV IMP MOD TAB SPC USING OFF LIST CHDIR MKDIR RMDIR NAME KILL CLEAR ERASE LSET RSET FIELD SEEK'.split(' '));
  const FN_KW = new Set('ABS ASC ATN CHR$ CINT CDBL CSNG CLNG COS CSRLIN DATE$ EXP FIX HEX$ INKEY$ INPUT$ INSTR INT LCASE$ LEFT$ LEN LOG LTRIM$ MID$ OCT$ PEEK POINT POS RIGHT$ RND RTRIM$ SGN SIN SPACE$ SQR STR$ STRING$ TAN TIME$ TIMER UCASE$ VAL VARPTR FRE LBOUND UBOUND ERR ERL SCREEN'.split(' '));
  DOS.BASIC_KW = new Set([...STMT_KW, ...FN_KW]);

  // ================================================================ parser (one line -> statements)
  class Parser {
    constructor(toks, line, ctx) { this.t = toks; this.i = 0; this.line = line; this.ctx = ctx; }
    peek(o) { return this.t[this.i + (o || 0)]; }
    next() { return this.t[this.i++]; }
    is(v, o) { const p = this.peek(o); return p && (p.t === 'i' || p.t === 'o') && p.v === v; }
    accept(v) { if (this.is(v)) { this.i++; return true; } return false; }
    expect(v) { if (!this.accept(v)) err('Syntax error', this.line); }
    end() { return this.i >= this.t.length; }
    atStmtEnd() { return this.end() || this.is(':') || this.is('ELSE'); }
    ident() { const p = this.next(); if (!p || p.t !== 'i') err('Syntax error', this.line); return p.v; }
    // ---- expressions (precedence climbing)
    expr() { return this.imp(); }
    imp() { let l = this.eqv(); while (this.is('IMP')) { this.i++; const r = this.eqv(); const a = l; l = rt => (~num(a(rt)) | num(r(rt))) | 0; } return l; }
    eqv() { let l = this.xor(); while (this.is('EQV')) { this.i++; const r = this.xor(); const a = l; l = rt => ~(num(a(rt)) ^ num(r(rt))) | 0; } return l; }
    xor() { let l = this.or(); while (this.is('XOR')) { this.i++; const r = this.or(); const a = l; l = rt => (num(a(rt)) ^ num(r(rt))) | 0; } return l; }
    or() { let l = this.and(); while (this.is('OR')) { this.i++; const r = this.and(); const a = l; l = rt => (num(a(rt)) | num(r(rt))) | 0; } return l; }
    and() { let l = this.not(); while (this.is('AND')) { this.i++; const r = this.not(); const a = l; l = rt => (num(a(rt)) & num(r(rt))) | 0; } return l; }
    not() { if (this.is('NOT')) { this.i++; const a = this.not(); return rt => ~num(a(rt)) | 0; } return this.cmp(); }
    cmp() {
      let l = this.add();
      for (;;) {
        const p = this.peek(); if (!p || p.t !== 'o' || !['=', '<>', '<', '>', '<=', '>='].includes(p.v)) return l;
        this.i++; const r = this.add(), a = l, op = p.v;
        l = rt => { let x = a(rt), y = r(rt); if ((typeof x === 'string') !== (typeof y === 'string')) err('Type mismatch', rt.line); let res; switch (op) { case '=': res = x === y; break; case '<>': res = x !== y; break; case '<': res = x < y; break; case '>': res = x > y; break; case '<=': res = x <= y; break; default: res = x >= y; } return res ? -1 : 0; };
      }
    }
    add() { let l = this.mod(); for (;;) { if (this.is('+')) { this.i++; const r = this.mod(), a = l; l = rt => { const x = a(rt), y = r(rt); if (typeof x === 'string' && typeof y === 'string') return x + y; if (typeof x === 'string' || typeof y === 'string') err('Type mismatch', rt.line); return x + y; }; } else if (this.is('-')) { this.i++; const r = this.mod(), a = l; l = rt => num(a(rt), rt) - num(r(rt), rt); } else return l; } }
    mod() { let l = this.idiv(); while (this.is('MOD')) { this.i++; const r = this.idiv(), a = l; l = rt => { const y = Math.trunc(num(r(rt), rt)); if (y === 0) err('Division by zero', rt.line); return Math.trunc(num(a(rt), rt)) % y; }; } return l; }
    idiv() { let l = this.mul(); while (this.is('\\')) { this.i++; const r = this.mul(), a = l; l = rt => { const y = Math.trunc(num(r(rt), rt)); if (y === 0) err('Division by zero', rt.line); return Math.trunc(Math.trunc(num(a(rt), rt)) / y); }; } return l; }
    mul() { let l = this.unary(); for (;;) { if (this.is('*')) { this.i++; const r = this.unary(), a = l; l = rt => num(a(rt), rt) * num(r(rt), rt); } else if (this.is('/')) { this.i++; const r = this.unary(), a = l; l = rt => { const y = num(r(rt), rt); if (y === 0) err('Division by zero', rt.line); return num(a(rt), rt) / y; }; } else return l; } }
    unary() { if (this.is('-')) { this.i++; const a = this.unary(); return rt => -num(a(rt), rt); } if (this.is('+')) { this.i++; return this.unary(); } return this.pow(); }
    pow() { const l = this.atom(); if (this.is('^')) { this.i++; const r = this.unary(); return rt => { const v = Math.pow(num(l(rt), rt), num(r(rt), rt)); if (!isFinite(v)) err('Overflow', rt.line); return v; }; } return l; }
    args() { const a = []; this.expect('('); if (!this.is(')')) { do { a.push(this.expr()); } while (this.accept(',')); } this.expect(')'); return a; }
    atom() {
      const p = this.next(); if (!p) err('Syntax error', this.line);
      if (p.t === 'n') { const v = p.v; return () => v; }
      if (p.t === 's') { const v = p.v; return () => v; }
      if (p.t === 'o' && p.v === '(') { const e = this.expr(); this.expect(')'); return e; }
      if (p.t !== 'i') err('Syntax error', this.line);
      const name = p.v;
      if (name === 'TAB' || name === 'SPC') err('Syntax error', this.line);
      if (FN_KW.has(name)) {
        const f = BUILTIN[name]; if (!f) err('Syntax error', this.line);
        let a = [];
        if (this.is('(')) a = this.args();
        if (a.length < f.min || a.length > f.max) err('Syntax error', this.line);
        return rt => f.fn(a.map(x => x(rt)), rt);
      }
      if (this.ctx.funcs.has(name)) { const a = this.is('(') ? this.args() : []; return rt => rt.callFunction(name, a, rt); }
      if (this.is('(')) { const a = this.args(); return rt => rt.aget(name, a.map(x => num(x(rt), rt))); }
      if (STMT_KW.has(name)) err('Syntax error', this.line);
      return rt => rt.vget(name);
    }
    // ---- statements
    statements() { const out = []; while (!this.end()) { if (this.accept(':')) continue; const s = this.statement(); if (s) out.push(s); if (!this.end() && !this.is(':') && !this.is('ELSE')) err('Syntax error', this.line); if (this.is('ELSE')) break; } return out; }
    lvalue() {
      const name = this.ident();
      if (FN_KW.has(name) || STMT_KW.has(name) && !/^(LINE|NAME|KEY|SCREEN|DATE\$|TIME\$)$/.test(name)) err('Syntax error', this.line);
      if (this.is('(')) { const a = this.args(); return { name, subs: a }; }
      return { name };
    }
    statement() {
      const p = this.peek(); if (!p) return null;
      const L = this.line;
      if (p.t === 'o' && p.v === '?') { this.i++; return this.print(); }
      if (p.t !== 'i') err('Syntax error', L);
      const kw = p.v;
      const fnCall = this.ctx.subs.has(kw);
      if (fnCall) { this.i++; const a = []; if (!this.atStmtEnd()) { const par = this.accept('('); do { a.push(this.argExpr()); } while (this.accept(',')); if (par) this.expect(')'); } return { k: 'call', name: kw, args: a, line: L }; }
      if (!STMT_KW.has(kw) || kw === 'DATE$' || kw === 'TIME$') { // assignment
        const lv = this.lvalue(); this.expect('=');
        if (kw === 'DATE$' || kw === 'TIME$') { this.expr(); return { k: 'x', f: () => err('Access denied - MOM.SYS owns the clock', L), line: L }; }
        const e = this.expr();
        return { k: 'assign', lv, e, line: L };
      }
      this.i++;
      switch (kw) {
        case 'LET': { const lv = this.lvalue(); this.expect('='); const e = this.expr(); return { k: 'assign', lv, e, line: L }; }
        case 'PRINT': case 'LPRINT': return this.print();
        case 'INPUT': {
          if (this.is('#')) err('Feature unavailable', L);
          const o = { k: 'input', prompt: null, q: true, vars: [], line: L };
          if (this.accept(';')) o.keep = true;
          if (this.peek() && this.peek().t === 's') { o.prompt = this.next().v; if (this.accept(',')) o.q = false; else this.expect(';'); }
          do { o.vars.push(this.lvalue()); } while (this.accept(','));
          return o;
        }
        case 'LINE': {
          if (this.accept('INPUT')) { const o = { k: 'input', prompt: null, q: false, vars: [], lineInput: true, line: L }; if (this.accept(';')) o.keep = true; if (this.peek() && this.peek().t === 's') { o.prompt = this.next().v; if (!this.accept(';')) this.expect(','); } o.vars.push(this.lvalue()); return o; }
          const o = { k: 'line', line: L };
          if (this.accept('STEP')) o.step1 = true;
          if (this.is('(')) { this.expect('('); o.x1 = this.expr(); this.expect(','); o.y1 = this.expr(); this.expect(')'); }
          this.expect('-'); if (this.accept('STEP')) o.step2 = true; this.expect('('); o.x2 = this.expr(); this.expect(','); o.y2 = this.expr(); this.expect(')');
          if (this.accept(',')) { if (!this.is(',')) o.c = this.expr(); if (this.accept(',')) { const b = this.ident(); if (b === 'B') o.box = 1; else if (b === 'BF') o.box = 2; else err('Syntax error', L); if (this.accept(',')) this.expr(); } }
          return o;
        }
        case 'IF': {
          const cond = this.expr();
          if (this.accept('GOTO')) { const tgt = this.target(); return { k: 'if1', cond, then: [{ k: 'goto', target: tgt, line: L }], else: [], line: L }; }
          this.expect('THEN');
          if (this.end()) return { k: 'ifblock', cond, line: L };
          let thenS;
          if (this.peek().t === 'n') { const tgt = String(this.next().v); thenS = [{ k: 'goto', target: tgt, line: L }]; } else thenS = this.statements();
          let elseS = [];
          if (this.accept('ELSE')) { if (this.peek() && this.peek().t === 'n') elseS = [{ k: 'goto', target: String(this.next().v), line: L }]; else elseS = this.statements(); }
          return { k: 'if1', cond, then: thenS, else: elseS, line: L };
        }
        case 'ELSEIF': { const cond = this.expr(); this.expect('THEN'); return { k: 'elseif', cond, line: L }; }
        case 'ELSE': return { k: 'else', line: L };
        case 'END': {
          if (this.accept('IF')) return { k: 'endif', line: L };
          if (this.accept('SELECT')) return { k: 'endselect', line: L };
          if (this.accept('SUB')) return { k: 'endsub', line: L };
          if (this.accept('FUNCTION')) return { k: 'endfunction', line: L };
          if (this.accept('TYPE') || this.accept('DEF')) return null;
          return { k: 'end', line: L };
        }
        case 'ENDIF': return { k: 'endif', line: L };
        case 'FOR': { const v = this.ident(); this.expect('='); const a = this.expr(); this.expect('TO'); const b = this.expr(); let s = null; if (this.accept('STEP')) s = this.expr(); return { k: 'for', v, a, b, s, line: L }; }
        case 'NEXT': { const vs = []; if (!this.atStmtEnd()) { do { vs.push(this.ident()); } while (this.accept(',')); } return vs.length > 1 ? { k: 'multi', list: vs.map(v => ({ k: 'next', v, line: L })) } : { k: 'next', v: vs[0] || null, line: L }; }
        case 'WHILE': return { k: 'while', cond: this.expr(), line: L };
        case 'WEND': return { k: 'wend', line: L };
        case 'DO': { const o = { k: 'do', line: L }; if (this.accept('WHILE')) { o.cond = this.expr(); o.until = false; } else if (this.accept('UNTIL')) { o.cond = this.expr(); o.until = true; } return o; }
        case 'LOOP': { const o = { k: 'loop', line: L }; if (this.accept('WHILE')) { o.cond = this.expr(); o.until = false; } else if (this.accept('UNTIL')) { o.cond = this.expr(); o.until = true; } return o; }
        case 'EXIT': { const w = this.ident(); if (!['FOR', 'DO', 'SUB', 'FUNCTION', 'WHILE'].includes(w)) err('Syntax error', L); return { k: 'exit', what: w, line: L }; }
        case 'GOTO': return { k: 'goto', target: this.target(), line: L };
        case 'GOSUB': return { k: 'gosub', target: this.target(), line: L };
        case 'RETURN': return { k: 'return', target: this.atStmtEnd() ? null : this.target(), line: L };
        case 'ON': {
          if (this.accept('ERROR')) { while (!this.atStmtEnd()) this.i++; return null; }
          const e = this.expr(); const g = this.ident(); if (g !== 'GOTO' && g !== 'GOSUB') err('Syntax error', L);
          const ts = []; do { ts.push(this.target()); } while (this.accept(','));
          return { k: 'on', e, gosub: g === 'GOSUB', targets: ts, line: L };
        }
        case 'SUB': case 'FUNCTION': {
          const name = this.ident(); const params = [];
          if (this.accept('(')) { if (!this.is(')')) do { const n = this.ident(); const arr = this.accept('(') ? (this.expect(')'), true) : false; if (this.accept('AS')) this.ident(); params.push({ n, arr }); } while (this.accept(',')); this.expect(')'); }
          this.accept('STATIC');
          return { k: kw === 'SUB' ? 'sub' : 'function', name, params, line: L };
        }
        case 'DECLARE': case 'DEFINT': case 'DEFSNG': case 'DEFDBL': case 'DEFLNG': case 'DEFSTR': case 'COMMON': case 'STATIC': case 'KEY': case 'WIDTH': case 'DEF': case 'POKE': case 'OUT': case 'WAIT': case 'RESUME': case 'PALETTE': case 'VIEW': case 'WINDOW': case 'OPTION': case 'CLEAR': case 'LSET': case 'RSET': case 'FIELD': case 'SEEK':
          while (!this.atStmtEnd()) this.i++; return null;
        case 'TYPE': case 'OPEN': case 'CLOSE': case 'GET': case 'PUT': case 'DRAW': case 'CHAIN': case 'RUN': case 'LIST': case 'ERASE': case 'KILL': case 'NAME': case 'CHDIR': case 'MKDIR': case 'RMDIR': case 'ERROR':
          if (kw === 'ERROR') { const e = this.expr(); return { k: 'x', f: rt => err('Error ' + num(e(rt), rt), L), line: L }; }
          return { k: 'x', f: () => err('Feature unavailable (' + kw + ')', L), line: L };
        case 'CALL': { const name = this.ident(); if (!this.ctx.subs.has(name)) err('Subprogram not defined', L); const a = []; if (this.accept('(')) { if (!this.is(')')) do { a.push(this.argExpr()); } while (this.accept(',')); this.expect(')'); } return { k: 'call', name, args: a, line: L }; }
        case 'DIM': case 'REDIM': {
          const shared = this.accept('SHARED'); const list = [];
          do { const name = this.ident(); let dims = null; if (this.accept('(')) { dims = []; do { const a = this.expr(); if (this.accept('TO')) { const b = this.expr(); dims.push([a, b]); } else dims.push([null, a]); } while (this.accept(',')); this.expect(')'); } if (this.accept('AS')) this.ident(); list.push({ name, dims }); } while (this.accept(','));
          return { k: 'dim', list, shared, redim: kw === 'REDIM', line: L };
        }
        case 'SHARED': { const list = []; do { const n = this.ident(); if (this.accept('(')) this.expect(')'); if (this.accept('AS')) this.ident(); list.push(n); } while (this.accept(',')); return { k: 'shared', list, line: L }; }
        case 'CONST': { const list = []; do { const n = this.ident(); this.expect('='); list.push({ name: n, e: this.expr() }); } while (this.accept(',')); return { k: 'const', list, line: L }; }
        case 'DATA': { const items = []; for (;;) { const t = this.peek(); if (!t || t.t === 'o' && t.v === ':') break; if (t.t === 's') { items.push(this.next().v); } else { let s = ''; let neg = false; if (this.is('-')) { this.i++; neg = true; } const q = this.next(); if (q.t === 'n') s = (neg ? '-' : '') + q.v; else s = q.v; items.push(/^-?[\d.]/.test(s) ? parseFloat(s) : s); } if (!this.accept(',')) break; } return { k: 'data', items, line: L }; }
        case 'READ': { const vs = []; do { vs.push(this.lvalue()); } while (this.accept(',')); return { k: 'read', vars: vs, line: L }; }
        case 'RESTORE': return { k: 'restore', target: this.atStmtEnd() ? null : this.target(), line: L };
        case 'SELECT': { this.expect('CASE'); return { k: 'select', e: this.expr(), line: L }; }
        case 'CASE': {
          if (this.accept('ELSE')) return { k: 'caseelse', line: L };
          const tests = [];
          do { if (this.accept('IS')) { const op = this.next(); if (!op || op.t !== 'o') err('Syntax error', L); const e = this.expr(); tests.push({ op: op.v, e }); } else { const a = this.expr(); if (this.accept('TO')) { const b = this.expr(); tests.push({ range: [a, b] }); } else tests.push({ eq: a }); } } while (this.accept(','));
          return { k: 'case', tests, line: L };
        }
        case 'CLS': { if (!this.atStmtEnd()) this.expr(); return { k: 'x', f: rt => rt.cls(), line: L }; }
        case 'COLOR': { let fg = null, bg = null; if (!this.atStmtEnd() && !this.is(',')) fg = this.expr(); if (this.accept(',')) { if (!this.atStmtEnd() && !this.is(',')) bg = this.expr(); if (this.accept(',')) this.expr(); } return { k: 'x', f: rt => rt.color(fg ? num(fg(rt), rt) : null, bg ? num(bg(rt), rt) : null), line: L }; }
        case 'LOCATE': { let r = null, c = null, cur = null; if (!this.atStmtEnd() && !this.is(',')) r = this.expr(); if (this.accept(',')) { if (!this.atStmtEnd() && !this.is(',')) c = this.expr(); if (this.accept(',')) { if (!this.atStmtEnd()) cur = this.expr(); } } return { k: 'x', f: rt => rt.locate(r ? num(r(rt), rt) : null, c ? num(c(rt), rt) : null, cur ? num(cur(rt), rt) : null), line: L }; }
        case 'SCREEN': { const m = this.expr(); while (this.accept(',')) if (!this.atStmtEnd() && !this.is(',')) this.expr(); return { k: 'x', f: rt => rt.setScreen(num(m(rt), rt)), line: L }; }
        case 'PSET': case 'PRESET': { const step = this.accept('STEP'); this.expect('('); const x = this.expr(); this.expect(','); const y = this.expr(); this.expect(')'); let c = null; if (this.accept(',')) c = this.expr(); return { k: 'x', f: rt => { const g = rt.needGfx(); const px = num(x(rt), rt) + (step ? rt.lastX : 0), py = num(y(rt), rt) + (step ? rt.lastY : 0); rt.lastX = px; rt.lastY = py; g.pset(px, py, c ? num(c(rt), rt) : kw === 'PSET' ? rt.fg : rt.bgc); }, line: L }; }
        case 'CIRCLE': { this.accept('STEP'); this.expect('('); const x = this.expr(); this.expect(','); const y = this.expr(); this.expect(')'); this.expect(','); const r = this.expr(); let c = null; const extra = []; while (this.accept(',')) { if (this.atStmtEnd() || this.is(',')) { extra.push(null); continue; } if (c === null && extra.length === 0) c = this.expr(); else extra.push(this.expr()); } return { k: 'x', f: rt => { const g = rt.needGfx(); const cx = num(x(rt), rt), cy = num(y(rt), rt); rt.lastX = cx; rt.lastY = cy; g.circle(cx, cy, num(r(rt), rt), c ? num(c(rt), rt) : rt.fg, extra[0] ? num(extra[0](rt), rt) : null, extra[1] ? num(extra[1](rt), rt) : null); }, line: L }; }
        case 'PAINT': { this.accept('STEP'); this.expect('('); const x = this.expr(); this.expect(','); const y = this.expr(); this.expect(')'); let c = null, b = null; if (this.accept(',')) { if (!this.is(',') && !this.atStmtEnd()) c = this.expr(); if (this.accept(',')) b = this.expr(); } return { k: 'x', f: rt => { const g = rt.needGfx(); g.paint(num(x(rt), rt), num(y(rt), rt), c ? num(c(rt), rt) : rt.fg, b ? num(b(rt), rt) : null); }, line: L }; }
        case 'SLEEP': { let e = null; if (!this.atStmtEnd()) e = this.expr(); return { k: 'x', f: rt => rt.sleep(e ? num(e(rt), rt) : 0), line: L }; }
        case 'BEEP': return { k: 'x', f: rt => rt.sound(800, 4), line: L };
        case 'SOUND': { const f = this.expr(); this.expect(','); const d = this.expr(); return { k: 'x', f: rt => rt.sound(num(f(rt), rt), num(d(rt), rt)), line: L }; }
        case 'PLAY': { const s = this.expr(); return { k: 'x', f: rt => rt.play(str(s(rt), rt)), line: L }; }
        case 'RANDOMIZE': { let e = null; if (!this.atStmtEnd()) e = this.expr(); return { k: 'x', f: rt => { rt.seed(e ? num(e(rt), rt) : Date.now() % 100000); }, line: L }; }
        case 'STOP': case 'SYSTEM': return { k: 'end', line: L };
        case 'SWAP': { const a = this.lvalue(); this.expect(','); const b = this.lvalue(); return { k: 'x', f: rt => { const x = rt.lvget(a), y = rt.lvget(b); if ((typeof x === 'string') !== (typeof y === 'string')) err('Type mismatch', L); rt.lvset(a, y); rt.lvset(b, x); }, line: L }; }
        case 'SHELL': { let e = null; if (!this.atStmtEnd()) e = this.expr(); return { k: 'x', f: rt => rt.shell(e ? str(e(rt), rt) : ''), line: L }; }
        case 'FILES': { let e = null; if (!this.atStmtEnd()) e = this.expr(); return { k: 'x', f: rt => rt.shell('DIR /W ' + (e ? str(e(rt), rt) : '')), line: L }; }
        default: err('Syntax error', L);
      }
    }
    argExpr() { // an argument: a plain variable is passed by reference
      const p = this.peek(), q = this.peek(1);
      if (p && p.t === 'i' && !FN_KW.has(p.v) && !STMT_KW.has(p.v) && !this.ctx.funcs.has(p.v) && (!q || (q.t === 'o' && (q.v === ',' || q.v === ')' || q.v === ':')) || (q.t === 'i' && q.v === 'ELSE'))) { this.i++; const name = p.v; return { ref: name }; }
      if (p && p.t === 'i' && q && q.t === 'o' && q.v === '(' && this.peek(2) && this.peek(2).t === 'o' && this.peek(2).v === ')') { this.i += 3; return { aref: p.v }; }
      return { e: this.expr() };
    }
    target() { const p = this.next(); if (!p) err('Syntax error', this.line); if (p.t === 'n') return String(p.v); if (p.t === 'i') return p.v; err('Syntax error', this.line); }
    print() {
      const items = [];
      if (this.is('#')) err('Feature unavailable', this.line);
      if (this.accept('USING')) { const fmt = this.expr(); this.expect(';'); const vals = []; do { vals.push(this.expr()); } while (this.accept(',') || this.accept(';')); return { k: 'print', using: fmt, items: vals.map(e => ({ e })), line: this.line }; }
      let last = 'nl';
      while (!this.atStmtEnd()) {
        if (this.accept(';')) { last = ';'; continue; }
        if (this.accept(',')) { items.push({ tabz: true }); last = ','; continue; }
        if (this.is('TAB') || this.is('SPC')) { const w = this.next().v; this.expect('('); const e = this.expr(); this.expect(')'); items.push(w === 'TAB' ? { tab: e } : { spc: e }); last = ';'; continue; }
        items.push({ e: this.expr() }); last = 'e';
      }
      return { k: 'print', items, nl: last === 'e' || last === 'nl', line: this.line };
    }
  }
  const num = (v, rt) => { if (typeof v === 'string') err('Type mismatch', rt && rt.line); return v; };
  const str = (v, rt) => { if (typeof v !== 'string') err('Type mismatch', rt && rt.line); return v; };

  // ================================================================ number formatting the way QBasic does it
  function fmtNum(n) {
    if (!isFinite(n)) return n > 0 ? '1.#INF' : n < 0 ? '-1.#INF' : '-1.#IND';
    if (Number.isInteger(n) && Math.abs(n) < 2147483648) return String(n);
    let s;
    if (Math.abs(n) >= 1e7 || (Math.abs(n) < 1e-4 && n !== 0)) { const m = /^(-?)(\d(?:\.\d+)?)e([+-])(\d+)$/.exec(n.toExponential(6)); s = `${m[1]}${m[2].replace(/\.?0+$/, '')}E${m[3]}${m[4].padStart(2, '0')}`; }
    else { s = parseFloat(n.toPrecision(7)).toString(); if (/^-?0\./.test(s)) s = s.replace(/^(-?)0\./, '$1.'); }
    return s;
  }
  const printNum = n => (n < 0 ? '' : ' ') + fmtNum(n) + ' ';

  // ================================================================ builtin functions
  const BUILTIN = {};
  const def = (name, min, max, fn) => { BUILTIN[name] = { min, max, fn }; };
  def('ABS', 1, 1, ([a], rt) => Math.abs(num(a, rt)));
  def('ASC', 1, 1, ([a], rt) => { const s = str(a, rt); if (!s.length) err('Illegal function call', rt.line); return K.asc(s[0]); });
  def('ATN', 1, 1, ([a], rt) => Math.atan(num(a, rt)));
  def('CHR$', 1, 1, ([a], rt) => { const n = Math.round(num(a, rt)); if (n < 0 || n > 255) err('Illegal function call', rt.line); return K.chr(n); });
  const rint = v => { const f = Math.floor(v), d = v - f; return d === 0.5 ? (f % 2 === 0 ? f : f + 1) : Math.round(v); };
  def('CINT', 1, 1, ([a], rt) => { const v = num(a, rt); if (Math.abs(v) > 32767.5) err('Overflow', rt.line); return rint(v); });
  def('CLNG', 1, 1, ([a], rt) => rint(num(a, rt)));
  def('CDBL', 1, 1, ([a], rt) => num(a, rt)); def('CSNG', 1, 1, ([a], rt) => parseFloat(num(a, rt).toPrecision(7)));
  def('COS', 1, 1, ([a], rt) => Math.cos(num(a, rt))); def('SIN', 1, 1, ([a], rt) => Math.sin(num(a, rt))); def('TAN', 1, 1, ([a], rt) => Math.tan(num(a, rt)));
  def('CSRLIN', 0, 0, (a, rt) => rt.curRow());
  def('POS', 0, 1, (a, rt) => rt.curCol());
  def('DATE$', 0, 0, () => { const t = Desk.today99(); return `${String(t.m).padStart(2, '0')}-${String(t.d).padStart(2, '0')}-1999`; });
  def('TIME$', 0, 0, () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`; });
  def('EXP', 1, 1, ([a], rt) => { const v = Math.exp(num(a, rt)); if (!isFinite(v)) err('Overflow', rt.line); return v; });
  def('FIX', 1, 1, ([a], rt) => Math.trunc(num(a, rt)));
  def('INT', 1, 1, ([a], rt) => Math.floor(num(a, rt)));
  def('HEX$', 1, 1, ([a], rt) => (Math.trunc(num(a, rt)) >>> 0).toString(16).toUpperCase().replace(/^FFFF(?=[0-9A-F]{4}$)/, ''));
  def('OCT$', 1, 1, ([a], rt) => (Math.trunc(num(a, rt)) >>> 0).toString(8));
  def('INKEY$', 0, 0, (a, rt) => rt.inkey());
  def('INPUT$', 1, 2, ([n], rt) => rt.inputN(num(n, rt)));
  def('INSTR', 2, 3, (a, rt) => { let start = 1, s, q; if (a.length === 3) { start = Math.trunc(num(a[0], rt)); s = str(a[1], rt); q = str(a[2], rt); } else { s = str(a[0], rt); q = str(a[1], rt); } if (start < 1) err('Illegal function call', rt.line); if (start > s.length) return 0; const i = s.indexOf(q, start - 1); return i < 0 ? 0 : i + 1; });
  def('LCASE$', 1, 1, ([a], rt) => str(a, rt).toLowerCase()); def('UCASE$', 1, 1, ([a], rt) => str(a, rt).toUpperCase());
  def('LEFT$', 2, 2, ([s, n], rt) => { n = Math.trunc(num(n, rt)); if (n < 0) err('Illegal function call', rt.line); return str(s, rt).slice(0, n); });
  def('RIGHT$', 2, 2, ([s, n], rt) => { n = Math.trunc(num(n, rt)); if (n < 0) err('Illegal function call', rt.line); s = str(s, rt); return n === 0 ? '' : s.slice(-n); });
  def('MID$', 2, 3, ([s, i, n], rt) => { s = str(s, rt); i = Math.trunc(num(i, rt)); if (i < 1) err('Illegal function call', rt.line); if (n == null) return s.slice(i - 1); n = Math.trunc(num(n, rt)); if (n < 0) err('Illegal function call', rt.line); return s.substr(i - 1, n); });
  def('LEN', 1, 1, ([a], rt) => typeof a === 'string' ? a.length : 4);
  def('LOG', 1, 1, ([a], rt) => { const v = num(a, rt); if (v <= 0) err('Illegal function call', rt.line); return Math.log(v); });
  def('LTRIM$', 1, 1, ([a], rt) => str(a, rt).replace(/^ +/, '')); def('RTRIM$', 1, 1, ([a], rt) => str(a, rt).replace(/ +$/, ''));
  def('PEEK', 1, 1, ([a], rt) => (Math.trunc(num(a, rt)) * 7 + 3) & 255);
  def('POINT', 1, 2, (a, rt) => { const g = rt.gfx; if (!g) err('Illegal function call', rt.line); if (a.length === 1) return num(a[0], rt) === 0 ? rt.lastX : rt.lastY; const x = Math.trunc(num(a[0], rt)), y = Math.trunc(num(a[1], rt)); if (x < 0 || y < 0 || x >= g.w || y >= g.h) return -1; return g.pix[y * g.w + x]; });
  def('RND', 0, 1, (a, rt) => rt.rnd(a.length ? num(a[0], rt) : 1));
  def('SGN', 1, 1, ([a], rt) => Math.sign(num(a, rt)));
  def('SPACE$', 1, 1, ([a], rt) => { const n = Math.trunc(num(a, rt)); if (n < 0 || n > 32767) err('Illegal function call', rt.line); return ' '.repeat(n); });
  def('SQR', 1, 1, ([a], rt) => { const v = num(a, rt); if (v < 0) err('Illegal function call', rt.line); return Math.sqrt(v); });
  def('STR$', 1, 1, ([a], rt) => { const n = num(a, rt); return (n < 0 ? '' : ' ') + fmtNum(n); });
  def('STRING$', 2, 2, ([n, c], rt) => { n = Math.trunc(num(n, rt)); if (n < 0 || n > 32767) err('Illegal function call', rt.line); const ch = typeof c === 'string' ? (c[0] || ' ') : K.chr(Math.trunc(c)); return ch.repeat(n); });
  def('TIMER', 0, 0, () => { const d = new Date(); return Math.round(((d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) + d.getMilliseconds() / 1000) * 100) / 100; });
  def('VAL', 1, 1, ([a], rt) => { const s = str(a, rt).trim(); const m = /^[-+]?(\d+\.?\d*|\.\d+)([eEdD][-+]?\d+)?/.exec(s); if (m) return parseFloat(m[0].replace(/[dD]/, 'e')); const h = /^&[hH]([0-9a-fA-F]+)/.exec(s); if (h) return parseInt(h[1], 16); return 0; });
  def('VARPTR', 1, 1, () => 1999); def('FRE', 0, 1, () => 63664); def('ERR', 0, 0, () => 0); def('ERL', 0, 0, () => 0);
  def('LBOUND', 1, 2, () => 0); def('UBOUND', 1, 2, (a, rt) => 10 /* good enough */);
  def('SCREEN', 2, 3, ([r, c], rt) => { const s = rt.host.screen; if (rt.gfx) return 0; const g = s.get(Math.max(0, Math.min(s.rows - 1, Math.trunc(num(r, rt)) - 1)), Math.max(0, Math.min(s.cols - 1, Math.trunc(num(c, rt)) - 1))); return K.asc(g ? g.c : ' '); });

  // ================================================================ compiler: statements -> flat ops
  function compile(lines, ctx) {
    const ops = [], labels = {}, stack = [], data = [], dataLabels = {}, subs = {}, funcs = {};
    let inProc = null;
    const emit = op => { ops.push(op); return ops.length - 1; };
    const top = t => { for (let i = stack.length - 1; i >= 0; i--) if (!t || stack[i].t === t) return stack[i]; return null; };
    const popT = (t, msg) => { const s = stack.pop(); if (!s || s.t !== t) err(msg, cur); return s; };
    let cur = 0;
    for (const ln of lines) {
      cur = ln.line;
      let toks; try { toks = tokenize(ln.text); } catch (e) { if (e.basic) e.line = cur; throw e; }
      if (toks.length && toks[0].t === 'n' && toks[0].p === 0) { labels[String(toks[0].v)] = ops.length; dataLabels[String(toks[0].v)] = data.length; toks.shift(); }
      else if (toks.length >= 2 && toks[0].t === 'i' && toks[1].t === 'o' && toks[1].v === ':' && !STMT_KW.has(toks[0].v) && !FN_KW.has(toks[0].v) && !ctx.subs.has(toks[0].v)) { labels[toks[0].v] = ops.length; dataLabels[toks[0].v] = data.length; toks.splice(0, 2); }
      const p = new Parser(toks, cur, ctx);
      let stmts; try { stmts = p.statements(); } catch (e) { if (e.basic && !e.line) e.line = cur; throw e; }
      if (p.is('ELSE')) err('Syntax error', cur);
      const gen = st => {
        const L = st.line;
        switch (st.k) {
          case 'multi': st.list.forEach(gen); break;
          case 'x': emit({ k: 'x', f: st.f, line: L }); break;
          case 'assign': { const lv = st.lv, e = st.e; if (inProc && inProc.fn && lv.name === inProc.name && !lv.subs) emit({ k: 'x', f: rt => { rt.frame.fnValue = e(rt); }, line: L }); else emit({ k: 'x', f: rt => rt.lvset(lv, e(rt)), line: L }); break; }
          case 'print': emit({ k: 'x', f: rt => rt.printStmt(st), line: L }); break;
          case 'input': emit({ k: 'x', f: rt => rt.inputStmt(st), line: L }); break;
          case 'line': emit({ k: 'x', f: rt => rt.lineStmt(st), line: L }); break;
          case 'call': emit({ k: 'call', name: st.name, args: st.args, line: L }); break;
          case 'if1': { const jf = emit({ k: 'jf', cond: st.cond, line: L }); st.then.forEach(gen); if (st.else.length) { const jmp = emit({ k: 'jmp', line: L }); ops[jf].to = ops.length; st.else.forEach(gen); ops[jmp].to = ops.length; } else ops[jf].to = ops.length; break; }
          case 'ifblock': stack.push({ t: 'if', jf: emit({ k: 'jf', cond: st.cond, line: L }), ends: [] }); break;
          case 'elseif': { const s = top(); if (!s || s.t !== 'if') err('ELSEIF without IF', L); s.ends.push(emit({ k: 'jmp', line: L })); ops[s.jf].to = ops.length; s.jf = emit({ k: 'jf', cond: st.cond, line: L }); break; }
          case 'else': { const s = top(); if (!s || s.t !== 'if') err('ELSE without IF', L); s.ends.push(emit({ k: 'jmp', line: L })); ops[s.jf].to = ops.length; s.jf = -1; break; }
          case 'endif': { const s = popT('if', 'END IF without block IF'); if (s.jf >= 0) ops[s.jf].to = ops.length; s.ends.forEach(i => { ops[i].to = ops.length; }); break; }
          case 'for': { const i = emit({ k: 'for', v: st.v, a: st.a, b: st.b, s: st.s, line: L }); stack.push({ t: 'for', at: i, v: st.v, exits: [] }); break; }
          case 'next': { const s = stack.pop(); if (!s || s.t !== 'for') err('NEXT without FOR', L); if (st.v && st.v !== s.v) err('NEXT without FOR', L); emit({ k: 'next', at: s.at, line: L }); ops[s.at].end = ops.length; s.exits.forEach(i => { ops[i].to = ops.length; }); break; }
          case 'while': { const at = emit({ k: 'jf', cond: st.cond, line: L }); stack.push({ t: 'while', at, exits: [] }); break; }
          case 'wend': { const s = stack.pop(); if (!s || s.t !== 'while') err('WEND without WHILE', L); emit({ k: 'jmp', to: s.at, line: L }); ops[s.at].to = ops.length; s.exits.forEach(i => { ops[i].to = ops.length; }); break; }
          case 'do': { const at = ops.length; const s = { t: 'do', at, exits: [] }; if (st.cond) s.jf = emit({ k: st.until ? 'jt' : 'jf', cond: st.cond, line: L }); stack.push(s); break; }
          case 'loop': { const s = stack.pop(); if (!s || s.t !== 'do') err('LOOP without DO', L); if (st.cond) emit({ k: st.until ? 'jf' : 'jt', cond: st.cond, to: s.at, line: L }); else emit({ k: 'jmp', to: s.at, line: L }); if (s.jf != null) ops[s.jf].to = ops.length; s.exits.forEach(i => { ops[i].to = ops.length; }); break; }
          case 'exit': { if (st.what === 'SUB' || st.what === 'FUNCTION') { if (!inProc) err('EXIT ' + st.what + ' not within ' + st.what, L); emit({ k: 'ret', line: L }); break; } const want = st.what === 'WHILE' ? 'while' : st.what === 'FOR' ? 'for' : 'do'; const s = top(want); if (!s) err('EXIT ' + st.what + ' not within ' + st.what, L); s.exits.push(emit({ k: 'jmp', line: L })); break; }
          case 'goto': emit({ k: 'goto', target: st.target, line: L }); break;
          case 'gosub': emit({ k: 'gosub', target: st.target, line: L }); break;
          case 'return': emit({ k: 'return', target: st.target, line: L }); break;
          case 'on': emit({ k: 'on', e: st.e, gosub: st.gosub, targets: st.targets, line: L }); break;
          case 'sub': case 'function': { if (inProc) err('SUB/FUNCTION inside SUB/FUNCTION', L); const jmp = emit({ k: 'jmp', line: L }); inProc = { name: st.name, fn: st.k === 'function', jmp, params: st.params, start: ops.length }; (st.k === 'function' ? funcs : subs)[st.name] = inProc; break; }
          case 'endsub': case 'endfunction': { if (!inProc || inProc.fn !== (st.k === 'endfunction')) err(st.k === 'endsub' ? 'END SUB without SUB' : 'END FUNCTION without FUNCTION', L); emit({ k: 'ret', line: L }); ops[inProc.jmp].to = ops.length; inProc = null; break; }
          case 'dim': emit({ k: 'x', f: rt => rt.dim(st), line: L }); break;
          case 'shared': emit({ k: 'x', f: rt => st.list.forEach(n => rt.frame.shared.add(n)), line: L }); break;
          case 'const': emit({ k: 'x', f: rt => st.list.forEach(c => rt.vset(c.name, c.e(rt), true)), line: L }); break;
          case 'data': data.push(...st.items); break;
          case 'read': emit({ k: 'x', f: rt => rt.read(st.vars), line: L }); break;
          case 'restore': emit({ k: 'x', f: rt => { if (st.target == null) rt.dp = 0; else { if (dataLabels[st.target] == null) err('Label not defined', L); rt.dp = dataLabels[st.target]; } }, line: L }); break;
          case 'select': { const e = st.e; emit({ k: 'x', f: rt => { rt.selStack.push(e(rt)); }, line: L }); stack.push({ t: 'select', jf: -1, ends: [], first: true }); break; }
          case 'case': { const s = top(); if (!s || s.t !== 'select') err('CASE without SELECT', L); if (!s.first) s.ends.push(emit({ k: 'jmp', line: L })); if (s.jf >= 0) ops[s.jf].to = ops.length; s.first = false; const tests = st.tests; s.jf = emit({ k: 'jf', cond: rt => { const v = rt.selStack[rt.selStack.length - 1]; for (const t of tests) { if (t.eq) { if (v === t.eq(rt)) return -1; } else if (t.range) { if (v >= t.range[0](rt) && v <= t.range[1](rt)) return -1; } else { const w = t.e(rt); const ok = t.op === '=' ? v === w : t.op === '<>' ? v !== w : t.op === '<' ? v < w : t.op === '>' ? v > w : t.op === '<=' ? v <= w : v >= w; if (ok) return -1; } } return 0; }, line: L }); break; }
          case 'caseelse': { const s = top(); if (!s || s.t !== 'select') err('CASE ELSE without SELECT', L); if (!s.first) s.ends.push(emit({ k: 'jmp', line: L })); if (s.jf >= 0) ops[s.jf].to = ops.length; s.first = false; s.jf = -1; break; }
          case 'endselect': { const s = popT('select', 'END SELECT without SELECT'); if (s.jf >= 0) ops[s.jf].to = ops.length; s.ends.forEach(i => { ops[i].to = ops.length; }); emit({ k: 'x', f: rt => { rt.selStack.pop(); }, line: L }); break; }
          case 'end': emit({ k: 'end', line: L }); break;
          default: err('Syntax error', L);
        }
      };
      stmts.forEach(gen);
    }
    if (stack.length) { const s = stack[stack.length - 1]; err(s.t === 'for' ? 'FOR without NEXT' : s.t === 'if' ? 'Block IF without END IF' : s.t === 'while' ? 'WHILE without WEND' : s.t === 'do' ? 'DO without LOOP' : 'SELECT without END SELECT', ops[s.at != null ? s.at : s.jf] ? ops[s.at != null ? s.at : s.jf].line : cur); }
    if (inProc) err(inProc.fn ? 'FUNCTION without END FUNCTION' : 'SUB without END SUB', cur);
    for (const op of ops) if ((op.k === 'goto' || op.k === 'gosub' || op.k === 'return' && op.target) && labels[op.target] == null) err('Label not defined', op.line);
    for (const op of ops) if (op.k === 'on') for (const t of op.targets) if (labels[t] == null) err('Label not defined', op.line);
    return { ops, labels, data, subs, funcs };
  }
  function prescan(lines) { const subs = new Set(), funcs = new Set(); for (const l of lines) { const m = /^\s*(SUB|FUNCTION)\s+([A-Za-z_][A-Za-z0-9_.]*[$%&!#]?)/i.exec(l.text); if (m) (m[1].toUpperCase() === 'SUB' ? subs : funcs).add(m[2].toUpperCase()); } return { subs, funcs }; }

  // ================================================================ graphics (SCREEN 13 and friends)
  function vgaPalette() {
    const pal = new Uint32Array(256);
    const cga = K.PALRGB.map(([r, g, b]) => r << 16 | g << 8 | b);
    for (let i = 0; i < 16; i++) pal[i] = cga[i];
    for (let i = 0; i < 16; i++) { const v = Math.round(i * 255 / 15); pal[16 + i] = v << 16 | v << 8 | v; }
    // 216 colours: 3 brightness groups x 3 saturation levels x 24 hues (the classic VGA layout, near enough)
    let k = 32;
    const ramps = [[255, 0], [255, 128], [255, 180]], bright = [1, 0.45, 0.25];
    for (const b of bright) for (const [hi, lo] of ramps) for (let h = 0; h < 24; h++) {
      const t = h / 24 * 6, seg = Math.floor(t), f = t - seg; const up = Math.round(lo + (hi - lo) * f), dn = Math.round(hi - (hi - lo) * f);
      let r, g, bl; switch (seg) { case 0: r = hi; g = lo; bl = up; break; case 1: r = dn; g = lo; bl = hi; break; case 2: r = lo; g = up; bl = hi; break; case 3: r = lo; g = hi; bl = dn; break; case 4: r = up; g = hi; bl = lo; break; default: r = hi; g = dn; bl = lo; }
      // hue order starting from blue as VGA does: rotate so 32 is blue-ish
      pal[k++] = Math.round(r * b) << 16 | Math.round(g * b) << 8 | Math.round(bl * b);
    }
    return pal;
  }
  class Gfx {
    constructor(w, h, colors) { this.w = w; this.h = h; this.pix = new Uint8Array(w * h); this.colors = colors; this.pal = colors === 256 ? vgaPalette() : colors === 4 ? new Uint32Array([0, 0x55ffff, 0xff55ff, 0xffffff]) : new Uint32Array(K.PALRGB.map(([r, g, b]) => r << 16 | g << 8 | b)); this.dirty = true; this.cols = w / 8 | 0; this.rows = h / 8 | 0; this.fontH = 8; }
    pset(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.pix[y * this.w + x] = c & (this.colors - 1); this.dirty = true; }
    line(x1, y1, x2, y2, c) { x1 = Math.round(x1); y1 = Math.round(y1); x2 = Math.round(x2); y2 = Math.round(y2); const dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1), sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1; let e = dx + dy, n = 0; for (;;) { this.pset(x1, y1, c); if (x1 === x2 && y1 === y2) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x1 += sx; } if (e2 <= dx) { e += dx; y1 += sy; } if (++n > 5000) break; } }
    box(x1, y1, x2, y2, c, fill) { if (fill) { const a = Math.max(0, Math.min(y1, y2)), b = Math.min(this.h - 1, Math.max(y1, y2)); for (let y = Math.round(a); y <= Math.round(b); y++) this.line(x1, y, x2, y, c); } else { this.line(x1, y1, x2, y1, c); this.line(x2, y1, x2, y2, c); this.line(x2, y2, x1, y2, c); this.line(x1, y2, x1, y1, c); } }
    circle(cx, cy, r, c, a0, a1) {
      cx = Math.round(cx); cy = Math.round(cy); r = Math.round(Math.abs(r)); if (r > 2000) err('Illegal function call');
      const asp = this.h / this.w * (this.w === 320 ? 1.0 : 1); void asp;
      if (a0 != null || a1 != null) { const s = a0 || 0, e = a1 == null ? Math.PI * 2 : a1; const steps = Math.max(8, r * 2); for (let i = 0; i <= steps; i++) { const t = s + (e - s) * i / steps; this.pset(cx + Math.cos(t) * r, cy - Math.sin(t) * r, c); } return; }
      let x = r, y = 0, e = 1 - r;
      while (x >= y) { this.pset(cx + x, cy + y, c); this.pset(cx - x, cy + y, c); this.pset(cx + x, cy - y, c); this.pset(cx - x, cy - y, c); this.pset(cx + y, cy + x, c); this.pset(cx - y, cy + x, c); this.pset(cx + y, cy - x, c); this.pset(cx - y, cy - x, c); y++; if (e < 0) e += 2 * y + 1; else { x--; e += 2 * (y - x) + 1; } }
    }
    paint(x, y, c, border) {
      x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const W = this.w, H = this.h, p = this.pix, target = p[y * W + x], fill = c & (this.colors - 1);
      const stop = border == null ? v => v !== target : v => v === (border & (this.colors - 1)) || v === fill && border !== fill && false;
      if (border == null && target === fill) return;
      const stack = [[x, y]]; let n = 0;
      while (stack.length && n++ < 200000) {
        const [sx, sy] = stack.pop(); let x1 = sx; while (x1 >= 0 && !stop(p[sy * W + x1]) && p[sy * W + x1] !== fill) x1--; x1++;
        let x2 = sx; while (x2 < W && !stop(p[sy * W + x2]) && p[sy * W + x2] !== fill) x2++; x2--;
        if (x2 < x1) continue;
        for (let i = x1; i <= x2; i++) p[sy * W + i] = fill;
        for (const ny of [sy - 1, sy + 1]) { if (ny < 0 || ny >= H) continue; let inside = false; for (let i = x1; i <= x2; i++) { const v = p[ny * W + i]; const ok = !stop(v) && v !== fill; if (ok && !inside) { stack.push([i, ny]); inside = true; } else if (!ok) inside = false; } }
      }
      this.dirty = true;
    }
    cls(bg) { this.pix.fill(bg || 0); this.dirty = true; }
    glyph(ch, col, row, fg, bg) { const b = K.bits8(ch), x0 = col * 8, y0 = row * 8; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const px = x0 + x, py = y0 + y; if (px >= this.w || py >= this.h) continue; this.pix[py * this.w + px] = b[y * 8 + x] ? fg : bg; } this.dirty = true; }
    scrollUp() { this.pix.copyWithin(0, 8 * this.w); this.pix.fill(0, (this.h - 8) * this.w); this.dirty = true; }
  }

  // ================================================================ the runtime
  class Runtime {
    constructor(prog, host, sh) {
      this.ops = prog.ops; this.labels = prog.labels; this.data = prog.data; this.subs = prog.subs; this.funcs = prog.funcs;
      this.host = host; this.term = host.term; this.sh = sh;
      this.globals = { vars: new Map(), arrays: new Map(), shared: new Set(), consts: new Set() };
      this.frame = this.globals; this.callStack = []; this.gosubStack = []; this.selStack = []; this.forState = new Map();
      this.pc = 0; this.dp = 0; this.line = 0; this.gfx = null; this.fg = 7; this.bgc = 0; this.lastX = 0; this.lastY = 0; this.gcur = { r: 0, c: 0 };
      this.rseed = 327680; this.lastRnd = 0.5; this.rnd(1); this.ended = false;
    }
    // ---- variables
    key(name) { return name.replace(/[%&!#]$/, ''); }
    owner(name) { const k = this.key(name); if (this.frame === this.globals) return this.globals; if (this.frame.refs && this.frame.refs.has(k)) return this.frame.refs.get(k); if (this.frame.vars.has(k) || this.frame.arrays.has(k)) return this.frame; if (this.globals.shared.has(k) || this.frame.shared.has(k)) return this.globals; return this.frame; }
    vget(name) { const k = this.key(name), o = this.owner(name); if (o.ref) return o.frame.vars.has(o.key) ? o.frame.vars.get(o.key) : (name.endsWith('$') ? '' : 0); if (o.vars.has(k)) return o.vars.get(k); return name.endsWith('$') ? '' : 0; }
    vset(name, v, isConst) {
      const k = this.key(name), isS = name.endsWith('$');
      if ((typeof v === 'string') !== isS) err('Type mismatch', this.line);
      if (!isS && name.endsWith('%')) v = Math.round(v);
      const o = this.owner(name);
      if (o.ref) { o.frame.vars.set(o.key, v); return; }
      if (o.consts.has(k) && !isConst) err('Duplicate definition', this.line);
      if (isConst) o.consts.add(k);
      o.vars.set(k, v);
    }
    arr(name, create) {
      const k = this.key(name), o = this.owner(name);
      if (o.ref) { const a = o.frame.arrays.get(o.key); if (a) return a; }
      const f = o.ref ? o.frame : o;
      let a = f.arrays.get(k);
      if (!a && create) { a = this.mkArray([[0, 10]], name.endsWith('$')); f.arrays.set(k, a); }
      return a;
    }
    mkArray(dims, isS) { let size = 1; for (const [lo, hi] of dims) { if (hi < lo) err('Subscript out of range', this.line); size *= hi - lo + 1; } if (size > 2000000) err('Out of memory', this.line); return { dims, isS, data: isS ? new Array(size).fill('') : new Float64Array(size) }; }
    aidx(a, subs) { if (subs.length !== a.dims.length) err('Subscript out of range', this.line); let i = 0; for (let d = 0; d < subs.length; d++) { const v = Math.round(subs[d]), [lo, hi] = a.dims[d]; if (v < lo || v > hi) err('Subscript out of range', this.line); i = i * (hi - lo + 1) + (v - lo); } return i; }
    aget(name, subs) { const a = this.arr(name, true); return a.data[this.aidx(a, subs)]; }
    aset(name, subs, v) { const a = this.arr(name, true); if ((typeof v === 'string') !== a.isS) err('Type mismatch', this.line); a.data[this.aidx(a, subs)] = v; }
    lvget(lv) { return lv.subs ? this.aget(lv.name, lv.subs.map(e => num(e(this), this))) : this.vget(lv.name); }
    lvset(lv, v) { if (lv.subs) this.aset(lv.name, lv.subs.map(e => num(e(this), this)), v); else this.vset(lv.name, v); }
    dim(st) {
      for (const d of st.list) {
        const k = this.key(d.name);
        if (!d.dims) { if (st.shared) this.globals.shared.add(k); if (!this.frame.vars.has(k)) this.vset(d.name, d.name.endsWith('$') ? '' : 0); continue; }
        const dims = d.dims.map(([a, b]) => [a ? Math.round(num(a(this), this)) : 0, Math.round(num(b(this), this))]);
        const f = st.shared ? this.globals : (this.frame === this.globals ? this.globals : (this.globals.shared.has(k) || this.frame.shared.has(k) ? this.globals : this.frame));
        if (st.shared) this.globals.shared.add(k);
        if (f.arrays.has(k) && !st.redim) err('Array already dimensioned', this.line);
        f.arrays.set(k, this.mkArray(dims, d.name.endsWith('$')));
      }
    }
    read(vars) { for (const lv of vars) { if (this.dp >= this.data.length) err('Out of DATA', this.line); let v = this.data[this.dp++]; const isS = lv.name.endsWith('$'); if (isS) v = String(v); else if (typeof v === 'string') { const n = parseFloat(v); if (isNaN(n)) err('Syntax error', this.line); v = n; } this.lvset(lv, v); } }
    rnd(n) { if (n < 0) { this.rseed = (Math.abs(Math.round(n * 1000)) ^ 0x50000) & 0xffffff; } if (n === 0) return this.lastRnd; this.rseed = (this.rseed * 16598013 + 12820163) % 16777216; this.lastRnd = this.rseed / 16777216; return this.lastRnd; }
    seed(n) { this.rseed = (Math.round(Math.abs(n) * 7919) + 0x1234) & 0xffffff; }
    // ---- screen
    get cols() { return this.gfx ? this.gfx.cols : this.host.screen.cols; }
    get rows() { return this.gfx ? this.gfx.rows : this.host.screen.rows; }
    curRow() { return (this.gfx ? this.gcur.r : this.term.y) + 1; }
    curCol() { return (this.gfx ? this.gcur.c : this.term.x) + 1; }
    needGfx() { if (!this.gfx) err('Illegal function call', this.line); return this.gfx; }
    setScreen(m) {
      m = Math.round(m); const s = this.host.screen;
      if (m === 0) { if (this.gfx) { this.gfx = null; s.setGfx(null); s.clear(7); this.term.attr = 7; this.term.cls(); this.fg = 7; this.bgc = 0; } return; }
      const spec = { 13: [320, 200, 256], 12: [640, 480, 16], 7: [320, 200, 16], 8: [640, 200, 16], 9: [640, 350, 16], 11: [640, 480, 2], 1: [320, 200, 4], 2: [640, 200, 2] }[m];
      if (!spec) err('Illegal function call', this.line);
      S('basic.graphics');
      this.gfx = new Gfx(spec[0], spec[1], spec[2]); if (spec[2] === 2) this.gfx.pal = new Uint32Array([0, 0xffffff]);
      this.fg = spec[2] === 4 ? 3 : spec[2] === 2 ? 1 : 15; this.bgc = 0; this.gcur = { r: 0, c: 0 };
      s.setGfx(this.gfx); s.cur.on = false;
    }
    cls() { if (this.gfx) { this.gfx.cls(0); this.gcur = { r: 0, c: 0 }; } else { this.term.cls(); } }
    color(fg, bg) {
      if (this.gfx) { if (fg != null) { if (fg < 0 || fg >= this.gfx.colors) err('Illegal function call', this.line); this.fg = Math.round(fg); } if (bg != null) this.bgc = Math.round(bg) & (this.gfx.colors - 1); return; }
      if (fg != null) { if (fg < 0 || fg > 31) err('Illegal function call', this.line); fg = Math.round(fg); this.fg = fg; }
      if (bg != null) { if (bg < 0 || bg > 15) err('Illegal function call', this.line); this.bgc = Math.round(bg) & 7; }
      this.term.attr = (this.fg & 15) | (this.bgc << 4) | (this.fg >= 16 ? 256 : 0);
    }
    locate(r, c, cur) {
      if (r != null) { r = Math.round(r); if (r < 1 || r > this.rows) err('Illegal function call', this.line); }
      if (c != null) { c = Math.round(c); if (c < 1 || c > this.cols) err('Illegal function call', this.line); }
      if (this.gfx) { if (r != null) this.gcur.r = r - 1; if (c != null) this.gcur.c = c - 1; return; }
      if (r != null) this.term.y = r - 1; if (c != null) this.term.x = c - 1; this.term.sync();
      if (cur != null) this.host.screen.cur.on = !!cur;
    }
    write(s) {
      if (!this.gfx) { this.term.write(s); return; }
      const g = this.gfx;
      for (const ch of s) {
        if (ch === '\n') { this.gcur.c = 0; this.gcur.r++; }
        else if (ch === '\r') this.gcur.c = 0;
        else { if (this.gcur.c >= g.cols) { this.gcur.c = 0; this.gcur.r++; } if (this.gcur.r >= g.rows) { g.scrollUp(); this.gcur.r = g.rows - 1; } g.glyph(ch, this.gcur.c, this.gcur.r, this.fg, this.bgc); this.gcur.c++; }
        if (this.gcur.r >= g.rows) { g.scrollUp(); this.gcur.r = g.rows - 1; }
      }
    }
    printStmt(st) {
      if (st.using) { const f = str(st.using(this), this); let out = '', vi = 0; const re = /(#+[.,#]*#*|&|\\ *\\|!)/g; let last = 0, m; while ((m = re.exec(f))) { out += f.slice(last, m.index); last = re.lastIndex; const v = st.items[vi++]; const val = v ? v.e(this) : 0; if (m[0][0] === '#') { const dec = (m[0].split('.')[1] || '').length; const w = m[0].length; const n = num(val, this); let s = dec ? n.toFixed(dec) : String(Math.round(n)); if (m[0].includes(',')) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); out += s.length > w ? '%' + s : s.padStart(w); } else out += String(val); } out += f.slice(last); this.write(out + '\n'); return; }
      let out = '';
      const col = () => (this.gfx ? this.gcur.c : this.term.x) + [...out].length;
      for (const it of st.items) {
        if (it.tabz) { const c = col(); const next = Math.floor(c / 14) * 14 + 14; out += next >= this.cols ? '\n' : ' '.repeat(next - c); continue; }
        if (it.tab) { const t = Math.round(num(it.tab(this), this)); const c = col() % this.cols; if (t - 1 > c) out += ' '.repeat(t - 1 - c); else if (t - 1 < c) out += '\n' + ' '.repeat(Math.max(0, t - 1)); continue; }
        if (it.spc) { out += ' '.repeat(Math.max(0, Math.round(num(it.spc(this), this)))); continue; }
        const v = it.e(this); out += typeof v === 'string' ? v : printNum(v);
      }
      if (st.nl) out += '\n';
      this.write(out);
    }
    async inputStmt(st) {
      const prompt = (st.prompt || '') + (st.q ? '? ' : '');
      for (;;) {
        this.write(prompt);
        const line = await this.readLine();
        if (line == null) throw BREAK;
        if (st.lineInput) { this.lvset(st.vars[0], line); return; }
        const parts = []; let cur = '', q = false; for (const c of line) { if (c === '"') { q = !q; continue; } if (c === ',' && !q) { parts.push(cur); cur = ''; } else cur += c; } parts.push(cur);
        if (parts.length < st.vars.length || parts.length > st.vars.length) { this.write('Redo from start\n'); continue; }
        let ok = true; const vals = [];
        st.vars.forEach((lv, i) => { const p = parts[i].trim(); if (lv.name.endsWith('$')) vals.push(p); else { if (p === '') { vals.push(0); return; } const n = /^[-+]?(\d+\.?\d*|\.\d+)([eEdD][-+]?\d+)?$/.test(p) ? parseFloat(p.replace(/[dD]/, 'e')) : NaN; if (isNaN(n)) ok = false; vals.push(n); } });
        if (!ok) { this.write('Redo from start\n'); continue; }
        st.vars.forEach((lv, i) => this.lvset(lv, vals[i]));
        return;
      }
    }
    async readLine() {
      if (!this.gfx) return K.readLine(this.host, {});
      let buf = ''; const g = this.gfx; const c0 = this.gcur.c, r0 = this.gcur.r;
      for (;;) {
        this.gcur.c = c0; this.gcur.r = r0; this.write(buf + '_ ');
        const e = await this.host.readKey();
        if (e.ctrl && /^[cC]$/.test(e.key)) { this.host.brk = false; return null; }
        if (e.key === 'Enter') { this.gcur.c = c0; this.gcur.r = r0; this.write(buf + '  \n'); return buf; }
        if (e.key === 'Backspace') buf = buf.slice(0, -1); else if (e.ch && buf.length < g.cols - c0 - 3) buf += e.ch;
      }
    }
    inkey() { const e = this.host.pollKey(); if (!e) return ''; if (e.ctrl && /^[cC]$/.test(e.key)) throw BREAK; if (e.ch) return e.ch; const M = { Enter: '\r', Escape: '\x1b', Backspace: '\b', Tab: '\t' }; if (M[e.key]) return M[e.key]; const X = { ArrowUp: 'H', ArrowDown: 'P', ArrowLeft: 'K', ArrowRight: 'M', Home: 'G', End: 'O', PageUp: 'I', PageDown: 'Q', Insert: 'R', Delete: 'S' }; if (X[e.key]) return '\0' + X[e.key]; const f = /^F(\d+)$/.exec(e.key); if (f) return '\0' + K.chr(58 + +f[1]); return ''; }
    async inputN(n) { let s = ''; while (s.length < n) { const e = await this.host.readKey(); if (e.ctrl && /^[cC]$/.test(e.key)) throw BREAK; if (e.ch) s += e.ch; else if (e.key === 'Enter') s += '\r'; } return s; }
    async sleep(sec) {
      const until = sec > 0 ? Date.now() + sec * 1000 : Infinity;
      for (;;) { if (this.host.q.some(e => e.type === 'key')) return; const left = until - Date.now(); if (left <= 0) return; await Promise.race([this.host.sleep(Math.min(left, 100)), this.host.readEvent().then(e => { this.host.q.unshift(e); })]); if (this.host.brk) throw BREAK; }
    }
    async sound(f, d) { if (f < 37 || f > 32767) err('Illegal function call', this.line); const sec = Math.min(3, d / 18.2); if (sec <= 0) return; DOS.tone(f, sec); await this.host.sleep(sec * 1000); }
    async play(s) {
      let oct = 4, len = 4, tempo = 120, t = 0, mode = 7 / 8, bg = false; const NOTES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      const src = s.toUpperCase().replace(/\s+/g, ''); let i = 0;
      const numAt = () => { const m = /^\d+/.exec(src.slice(i)); if (!m) return null; i += m[0].length; return +m[0]; };
      const dur = l => 240 / tempo / l; let notes = 0;
      while (i < src.length && notes < 400) {
        const c = src[i++];
        if (NOTES[c] != null) { let n = NOTES[c]; if (src[i] === '#' || src[i] === '+') { n++; i++; } else if (src[i] === '-') { n--; i++; } const l = numAt() || len; let d = dur(l); while (src[i] === '.') { d *= 1.5; i++; } const f = 440 * Math.pow(2, (12 * (oct + 1) + n - 69) / 12); DOS.tone(f, d * mode, t); t += d; notes++; }
        else if (c === 'N') { const n = numAt() || 0; const d = dur(len); if (n > 0) DOS.tone(440 * Math.pow(2, (n + 11 - 69) / 12), d * mode, t); t += d; notes++; }
        else if (c === 'O') oct = Math.max(0, Math.min(6, numAt() || 4));
        else if (c === '>') oct = Math.min(6, oct + 1); else if (c === '<') oct = Math.max(0, oct - 1);
        else if (c === 'L') len = Math.max(1, Math.min(64, numAt() || 4));
        else if (c === 'T') tempo = Math.max(32, Math.min(255, numAt() || 120));
        else if (c === 'P' || c === 'R') { const l = numAt() || len; t += dur(l); }
        else if (c === 'M') { const m = src[i++]; if (m === 'L') mode = 1; else if (m === 'N') mode = 7 / 8; else if (m === 'S') mode = 3 / 4; else if (m === 'B') bg = true; else if (m === 'F') bg = false; }
        else if (c === 'X') { while (i < src.length && src[i] !== ';') i++; i++; }
        else if (c === ';') continue;
        else err('Illegal function call', this.line);
      }
      if (!bg && t > 0) await this.host.sleep(Math.min(t, 20) * 1000);
    }
    async shell(cmd) {
      const sh = this.sh; if (!sh) return;
      if (this.gfx) err('Illegal function call', this.line);
      if (!cmd.trim()) { this.write('\nType EXIT to return to JBASIC\n'); await P.command(sh, ''); return; }
      await sh.exec(cmd); if (this.term.x) this.write('\n');
    }
    lineStmt(st) {
      const g = this.needGfx();
      let x1 = st.x1 ? num(st.x1(this), this) + (st.step1 ? this.lastX : 0) : this.lastX, y1 = st.y1 ? num(st.y1(this), this) + (st.step1 ? this.lastY : 0) : this.lastY;
      const x2 = num(st.x2(this), this) + (st.step2 ? x1 : 0), y2 = num(st.y2(this), this) + (st.step2 ? y1 : 0);
      const c = st.c ? Math.round(num(st.c(this), this)) : this.fg;
      if (c < 0 || c >= g.colors) err('Illegal function call', this.line);
      if (st.box) g.box(x1, y1, x2, y2, c, st.box === 2); else g.line(x1, y1, x2, y2, c);
      this.lastX = x2; this.lastY = y2;
    }
    // ---- calls
    bindFrame(proc, args, caller) {
      if (args.length !== proc.params.length) err('Argument-count mismatch', this.line);
      const f = { vars: new Map(), arrays: new Map(), shared: new Set(), consts: new Set(), refs: new Map(), fnValue: proc.fn ? (proc.name.endsWith('$') ? '' : 0) : undefined, name: proc.name };
      const prevFrame = this.frame; this.frame = caller;
      proc.params.forEach((p, i) => {
        const a = args[i], k = this.key(p.n);
        if (p.arr) { if (!a.aref) err('Type mismatch', this.line); const o = this.owner(a.aref); const of = o.ref ? o.frame : o; const ok = o.ref ? o.key : this.key(a.aref); if (!of.arrays.has(ok)) of.arrays.set(ok, this.mkArray([[0, 10]], a.aref.endsWith('$'))); f.refs.set(k, { ref: true, frame: of, key: ok }); return; }
        if (a.ref) { const o = this.owner(a.ref); if (o.ref) f.refs.set(k, o); else { const ok = this.key(a.ref); if (!o.vars.has(ok)) o.vars.set(ok, a.ref.endsWith('$') ? '' : 0); if ((a.ref.endsWith('$')) !== p.n.endsWith('$')) err('Type mismatch', this.line); f.refs.set(k, { ref: true, frame: o, key: ok }); } return; }
        const v = a.e(this); if ((typeof v === 'string') !== p.n.endsWith('$')) err('Type mismatch', this.line); f.vars.set(k, v);
      });
      this.frame = prevFrame;
      return f;
    }
    callFunction(name, args) {
      const proc = this.funcs[name]; if (!proc) err('Subprogram not defined', this.line);
      if (this.callStack.length > 200) err('Out of stack space', this.line);
      const f = this.bindFrame(proc, args.map(a => typeof a === 'function' ? { e: a } : a), this.frame);
      const saved = { frame: this.frame, pc: this.pc, line: this.line };
      this.callStack.push({ ret: -1, frame: saved.frame, fn: true }); this.frame = f; this.pc = proc.start;
      let n = 0;
      for (;;) {
        if (this.pc >= this.ops.length) err('FUNCTION ran off the end', this.line);
        const op = this.ops[this.pc]; this.line = op.line;
        if (op.k === 'ret') { this.callStack.pop(); break; }
        const r = this.step(op);
        if (r && r.then) err('Feature unavailable (INPUT/SLEEP inside FUNCTION)', this.line);
        if (++n > 3000000) err('Out of stack space (FUNCTION ran for too long)', this.line);
      }
      const v = f.fnValue; this.frame = saved.frame; this.pc = saved.pc; this.line = saved.line;
      return v;
    }
    step(op) {
      switch (op.k) {
        case 'x': { const r = op.f(this); this.pc++; return r; }
        case 'jmp': this.pc = op.to; return;
        case 'jf': this.pc = op.cond(this) ? this.pc + 1 : op.to; return;
        case 'jt': this.pc = op.cond(this) ? op.to : this.pc + 1; return;
        case 'for': { const a = num(op.a(this), this), b = num(op.b(this), this), s = op.s ? num(op.s(this), this) : 1; this.vset(op.v, a); this.forState.set(op, { b, s }); if (s >= 0 ? a > b : a < b) this.pc = op.end; else this.pc++; return; }
        case 'next': { const f = this.ops[op.at], st = this.forState.get(f); if (!st) err('NEXT without FOR', this.line); const v = this.vget(f.v) + st.s; this.vset(f.v, v); if (st.s >= 0 ? v > st.b : v < st.b) this.pc++; else this.pc = op.at + 1; return; }
        case 'goto': this.pc = this.labels[op.target]; return;
        case 'gosub': if (this.gosubStack.length > 1000) err('Out of stack space', this.line); this.gosubStack.push(this.pc + 1); this.pc = this.labels[op.target]; return;
        case 'return': { if (!this.gosubStack.length) err('RETURN without GOSUB', this.line); const r = this.gosubStack.pop(); this.pc = op.target ? this.labels[op.target] : r; return; }
        case 'on': { const i = Math.round(num(op.e(this), this)); if (i < 1 || i > op.targets.length) { this.pc++; return; } if (op.gosub) this.gosubStack.push(this.pc + 1); this.pc = this.labels[op.targets[i - 1]]; return; }
        case 'call': { const proc = this.subs[op.name]; if (!proc) err('Subprogram not defined', this.line); if (this.callStack.length > 200) err('Out of stack space', this.line); const f = this.bindFrame(proc, op.args, this.frame); this.callStack.push({ ret: this.pc + 1, frame: this.frame, gs: this.gosubStack.length }); this.frame = f; this.pc = proc.start; return; }
        case 'ret': { const c = this.callStack.pop(); if (!c) err('RETURN without GOSUB', this.line); this.frame = c.frame; this.pc = c.ret; return; }
        case 'end': this.ended = true; this.pc = this.ops.length; return;
        default: err('Internal error', this.line);
      }
    }
    async run() {
      let n = 0, t0 = performance.now();
      while (this.pc < this.ops.length && !this.ended) {
        const op = this.ops[this.pc]; this.line = op.line;
        const r = this.step(op);
        if (r && r.then) await r;
        if (++n % 300 === 0 || (r && r.then)) {
          if (this.host.dead) throw K.KILL;
          if (this.host.brk) { this.host.brk = false; throw BREAK; }
          if (performance.now() - t0 > 12) { await new Promise(res => setTimeout(res, 0)); t0 = performance.now(); }
        }
      }
    }
  }

  // ================================================================ running a program on the output screen
  async function runProgram(host, sh, text, o) {
    o = o || {};
    const lines = text.replace(/\r/g, '').split('\n').map((t, i) => ({ text: t, line: i + 1 }));
    const ctx = prescan(lines);
    let prog;
    try { prog = compile(lines, ctx); } catch (e) { if (e.basic) return { error: e.message, line: e.line }; throw e; }
    const s = host.screen, t = host.term;
    s.cur.on = true; s.cur.block = false;
    const rt = new Runtime(prog, host, sh);
    rt.color(7, 0);
    host.flush();
    S('basic.run');
    let result = { ok: true };
    try { await rt.run(); }
    catch (e) {
      if (e === BREAK) { result = { brk: true, line: rt.line }; S('basic.break'); }
      else if (e && e.basic) { result = { error: e.message, line: e.line || rt.line }; }
      else if (e === K.KILL || host.dead) throw e;
      else { console.error(e); result = { error: 'Internal error: ' + (e && e.message), line: rt.line }; }
    }
    if (rt.gfx && !o.keepGfx) { /* leave the picture up until a key, like QBasic does */ }
    result.rt = rt;
    return result;
  }
  async function afterRun(host, rt, msg) {
    const s = host.screen;
    if (rt && rt.gfx) {
      rt.gcur.r = rt.gfx.rows - 1; rt.gcur.c = 0; rt.fg = 15; rt.bgc = 0; rt.write(msg.slice(0, rt.gfx.cols));
      host.flush(); await host.readKey();
      rt.gfx = null; s.setGfx(null); s.clear(7); host.term.attr = 7; host.term.cls();
      return;
    }
    const t = host.term; t.attr = 7; if (t.x) t.line(); t.line(msg);
    s.cur.on = true; host.flush(); await host.readKey();
  }

  // ================================================================ the IDE
  P.jbasic = (sh, args) => DOS.screenProg(sh, async (host, s) => {
    const Ed = new K.Editor(''); Ed.ins = true;
    const [sw, rest] = sh.switches(sh.args(args || ''));
    let name = '', node = null, lastFind = '', matchCase = false, immediate = false, imm = '', runAtStart = !!sw.R, outSnap = null, errMsg = '';
    const BG = 0x17, SEL = 0x71, MENU = 0x70, STAT = 0x30;
    const W = () => s.cols, H = () => s.rows;
    const edH = () => H() - 6;
    const title = () => (name ? name.toUpperCase() : 'Untitled');
    const dirty = () => Ed.dirty;
    async function loadFile(n) {
      const r = sh.resolve(n);
      if (r.err || r.isDir) return r.err === 'notready' ? 'Drive not ready' : 'Path not found: ' + n;
      if (!r.node) { if (!/^[^\\/:*?"<>|]{1,60}$/.test(r.name || '')) return 'Invalid file name'; node = null; name = /\./.test(n.split('\\').pop()) ? n.split('\\').pop() : n.split('\\').pop() + '.BAS'; Ed.setText(''); return ''; }
      if (!/\.(bas|txt)$/i.test(r.node.name) && !(r.node.text != null && r.node.type !== 'exe')) return 'That isn\'t a BASIC program.';
      node = r.node; name = r.node.name; Ed.setText(String(r.node.text || '')); if (r.node.secret) try { A.secret(r.node.secret); } catch (e) {} return '';
    }
    if (rest[0]) { const e = await loadFile(rest[0]); if (e) { await K.msgBox(host, e, ['OK']); runAtStart = false; } }
    // an unsaved program is autosaved (js/gamesave.js, one for JBASIC): JBASIC on its own (or JBASIC that file) brings it back
    const sv = A.gameSaver ? A.gameSaver('dos.jbasic', () => Ed.dirty ? { text: Ed.text().slice(0, 65535), name, r: Ed.r, c: Ed.c } : null, { v: 1, delay: 500 }) : null;
    let svOn = false;
    const kept = sv && sv.load();
    if (kept && typeof kept.text === 'string' && (!rest[0] || String(kept.name || '').toLowerCase() === name.toLowerCase())) {
      if (kept.name && !rest[0]) { const r0 = sh.resolve(kept.name); node = r0 && !r0.err && r0.node ? r0.node : null; }
      name = kept.name || ''; Ed.setText(kept.text); Ed.r = Math.min(Ed.lines.length - 1, +kept.r || 0); Ed.c = Math.min(Ed.lines[Ed.r].length, +kept.c || 0); Ed.dirty = true; svOn = true; runAtStart = false;
    }
    const menus = () => [
      { label: '&File', items: [{ label: '&New Program', act: 'new' }, { label: '&Open Program...', act: 'open' }, { label: '&Save', act: 'save' }, { label: 'Save &As...', act: 'saveas' }, '-', { label: '&Print...', act: 'print' }, '-', { label: 'E&xit', act: 'exit' }] },
      { label: '&Edit', items: [{ label: 'Cu&t', key: 'Shift+Del', act: 'cut', dis: !Ed.selText() }, { label: '&Copy', key: 'Ctrl+Ins', act: 'copy', dis: !Ed.selText() }, { label: '&Paste', key: 'Shift+Ins', act: 'paste', dis: !Ed.clip }, { label: 'Cl&ear', key: 'Del', act: 'clear', dis: !Ed.selText() }, '-', { label: 'New &SUB...', act: 'newsub' }, { label: 'New &FUNCTION...', act: 'newfn' }] },
      { label: '&View', items: [{ label: '&SUBs...', key: 'F2', act: 'subs' }, { label: '&Output Screen', key: 'F4', act: 'output' }, { label: '&Immediate Window', key: 'F6', act: 'imm' }] },
      { label: '&Search', items: [{ label: '&Find...', act: 'find' }, { label: '&Repeat Last Find', key: 'F3', act: 'again' }, { label: '&Change...', act: 'change' }] },
      { label: '&Run', items: [{ label: '&Start', key: 'F5', act: 'run' }, { label: '&Restart', key: 'Shift+F5', act: 'run' }, { label: '&Continue', key: 'F5', act: 'run' }, '-', { label: '&Make EXE File...', act: 'makeexe' }] },
      { label: '&Debug', items: [{ label: '&Step', key: 'F8', act: 'step' }, { label: '&Procedure Step', key: 'F10', act: 'step' }, { label: '&Trace On', act: 'trace' }, { label: 'Toggle &Breakpoint', key: 'F9', act: 'bp' }, { label: '&Clear All Breakpoints', act: 'bp' }] },
      { label: '&Options', items: [{ label: '&Display...', act: 'display' }, { label: '&Help Path...', act: 'helppath' }, { label: '&Syntax Checking', chk: true, act: 'syntax' }] },
      { label: '&Help', items: [{ label: '&Index', act: 'help' }, { label: '&Contents', act: 'help' }, { label: '&Topic', key: 'F1', act: 'help' }, { label: '&Using Help', act: 'help' }, '-', { label: '&About...', act: 'about' }] },
    ];
    function draw() {
      if (sv) { if (Ed.dirty) svOn = true; if (svOn) sv.save(); }
      s.fill(0, 0, W(), 1, ' ', MENU);
      let x = 2; const ms = menus(); ms.forEach((m, i) => { const last = i === ms.length - 1; const mx = last ? W() - K.plain(m.label).length - 3 : x; K.drawHot(s, mx, 0, m.label, MENU, 0x7f); x += K.plain(m.label).length + 2; });
      s.fill(0, 1, W(), H() - 2, ' ', BG);
      // editor window
      s.box(0, 1, W(), edH() + 2, BG, false);
      const t = ' ' + title() + ' '; s.print(Math.floor((W() - t.length) / 2), 1, t, immediate ? BG : SEL);
      s.print(W() - 4, 1, '\u2191', 0x1f);
      Ed.draw(s, 1, 2, W() - 3, edH(), BG, SEL);
      K.vbar(s, W() - 1, 2, edH(), Ed.r, Math.max(1, Ed.lines.length - 1), 0x70);
      // immediate window
      const iy = edH() + 3;
      s.box(0, iy - 1, W(), 3, BG, false); s.set(0, iy - 1, '\u251c', BG); s.set(W() - 1, iy - 1, '\u2524', BG);
      const it = ' Immediate '; s.print(Math.floor((W() - it.length) / 2), iy - 1, it, immediate ? SEL : BG);
      s.print(1, iy, imm.slice(-(W() - 3)), BG);
      // status
      s.fill(0, H() - 1, W(), 1, ' ', STAT);
      const st = W() >= 80 ? ' <Shift+F1=Help> <F6=Window> <F2=Subs> <F5=Run> <F8=Step>' : ' <F1=Help> <F5=Run>';
      s.print(0, H() - 1, st, STAT);
      const pos = `${dirty() ? '*' : ' '}${Ed.ins ? ' ' : 'O'} ${String(Ed.r + 1).padStart(5, '0')}:${String(Ed.c + 1).padStart(3, '0')} `; s.print(W() - pos.length - 1, H() - 1, pos, STAT);
      if (immediate) { s.cur.x = 1 + Math.min(W() - 3, imm.length); s.cur.y = iy; }
      s.cur.on = true;
    }
    function tidyLine(r) { // capitalise keywords the way QBasic does when you leave a line
      const l = Ed.lines[r]; if (l == null || !/[a-z]/.test(l)) return;
      let out = '', i = 0, inStr = false;
      while (i < l.length) {
        const c = l[i];
        if (inStr) { out += c; if (c === '"') inStr = false; i++; continue; }
        if (c === '"') { inStr = true; out += c; i++; continue; }
        if (c === "'") { out += l.slice(i); break; }
        const m = /^[A-Za-z_][A-Za-z0-9_.]*[$%&!#]?/.exec(l.slice(i));
        if (m) { const u = m[0].toUpperCase(); if (u === 'REM') { out += 'REM' + l.slice(i + 3); break; } out += DOS.BASIC_KW.has(u) ? u : m[0]; i += m[0].length; continue; }
        out += c; i++;
      }
      if (out !== l) { Ed.lines[r] = out; if (Ed.r === r) Ed.c = Math.min(Ed.c, out.length); }
    }
    async function doSave(as) {
      let target = name;
      if (as || !name || (node && !(node.dos || node.user))) {
        const r = await K.form(host, 'Save As', [{ type: 'text', label: 'File &Name:', value: node && !(node.dos || node.user) ? 'MY' + name.toUpperCase().slice(0, 6) : (name || 'UNTITLED.BAS'), max: 70, focus: true }, { type: 'label', text: 'Directory: ' + sh.pathStr(), rows: 1 }, { type: 'btns', items: ['OK', 'Cancel'] }], { w: 56 });
        if (!r || r.btn !== 'OK' || !r.values[0].trim()) return false;
        target = r.values[0].trim(); if (!/\./.test(target.split('\\').pop())) target += '.BAS';
        if (node && !(node.dos || node.user) && target.toLowerCase() === name.toLowerCase()) { await K.msgBox(host, 'Access denied. That\'s one of Jack\'s programs. Pick another name.', ['OK']); return false; }
      }
      const r = sh.resolve(target);
      if (r.err || r.isDir) { await K.msgBox(host, r.err === 'notready' ? 'Drive not ready' : 'Path not found', ['OK']); return false; }
      const e = sh.writeFile(r, Ed.text());
      if (e) { await K.msgBox(host, e, ['OK']); return false; }
      node = sh.resolve(target).node; name = node ? node.name : target; Ed.dirty = false; S('basic.save');
      return true;
    }
    async function confirmLose() { if (!dirty()) return true; const r = await K.msgBox(host, `Loaded file is not saved. Save it now?`, ['&Yes', '&No', '&Cancel']); if (r === 0) return doSave(false); return r === 1; }
    async function runIt(textOverride) {
      for (let r = 0; r < Ed.lines.length; r++) tidyLine(r);
      const snapIDE = s.snap();
      host.setMouse(false);
      if (outSnap) s.restore(outSnap); else { s.clear(7); host.term.cls(); }
      host.term.attr = 7; host.term.x = s.cur.x; host.term.y = s.cur.y;
      let res;
      try { res = await runProgram(host, sh, textOverride != null ? textOverride : Ed.text()); }
      catch (e) { if (e === K.KILL) throw e; res = { error: 'Internal error', line: 0 }; }
      if (!res.error) { await afterRun(host, res.rt, res.brk ? 'Break. Press any key to continue' : 'Press any key to continue'); }
      else if (res.rt && res.rt.gfx) { res.rt.gfx = null; s.setGfx(null); s.clear(7); host.term.cls(); }
      if (!res.rt || !res.rt.gfx) outSnap = s.snap();
      s.restore(snapIDE); host.setMouse(true); host.flush();
      if (res.error) {
        S('basic.error');
        if (res.line && textOverride == null) { Ed.r = Math.max(0, Math.min(Ed.lines.length - 1, res.line - 1)); Ed.c = 0; Ed.sel = null; }
        draw();
        await K.msgBox(host, res.error, ['OK', '&Help'], { title: '' });
        errMsg = res.error;
      } else if (res.brk && res.line) { Ed.r = Math.max(0, Math.min(Ed.lines.length - 1, res.line - 1)); Ed.sel = null; }
    }
    async function act(a) {
      if (!a) return true;
      switch (a) {
        case 'exit': return !(await confirmLose());
        case 'new': if (await confirmLose()) { Ed.setText(''); name = ''; node = null; } return true;
        case 'open': {
          if (!await confirmLose()) return true;
          let dirArg = sh.resolve('C:\\JBASIC', { dirOnly: true }).err ? '.' : (sh.pathStr() === 'C:\\' ? 'C:\\JBASIC' : '.');
          for (;;) {
            const r0 = sh.resolve(dirArg, { dirOnly: true }); if (r0.err || !r0.node) { dirArg = '.'; continue; }
            const dir = r0.node, sn = DOS.shellUtil.shortNames(dir);
            const files = (dir.kids || []).filter(k => !k.hidden && (k.type === 'dir' || /\.bas$/i.test(k.name))).sort((a2, b) => (b.type === 'dir') - (a2.type === 'dir') || sn.get(a2).localeCompare(sn.get(b)));
            const items = files.map(k => k.type === 'dir' ? '[' + sn.get(k) + ']' : sn.get(k)); items.push('[..]', '[MYDOCU~1]');
            const r = await K.form(host, 'Open Program', [{ type: 'text', label: 'File &Name:', value: '*.BAS', max: 70, focus: true }, { type: 'label', text: sh.pathStr(r0.dr, r0.dirs), rows: 1 }, { type: 'list', label: '&Files', items, h: Math.min(10, Math.max(3, s.rows - 14)) }, { type: 'btns', items: ['OK', 'Cancel', 'Help'] }], { w: Math.min(s.cols - 2, 60), onListEnter: async () => 'ok', onTextEnter: async c => (c.value === '*.BAS' || /[*?]/.test(c.value)) ? 'list' : 'ok' });
            if (!r || r.btn !== 'OK') return true;
            if (r.btn === 'Help') { await K.msgBox(host, 'Pick a .BAS file and press Enter. The samples are in C:\\JBASIC.', ['OK']); continue; }
            const typed = r.values[0];
            if (typed && typed !== '*.BAS' && !/[*?]/.test(typed)) { const e = await loadFile(sh.pathStr(r0.dr, r0.dirs).replace(/\\$/, '') + '\\' + typed); if (e) await K.msgBox(host, e, ['OK']); return true; }
            const idx = items.indexOf(r.values[2]);
            if (idx === files.length) { dirArg = r0.dirs.length ? sh.pathStr(r0.dr, r0.dirs.slice(0, -1)) : 'C:\\'; continue; }
            if (idx === files.length + 1) { dirArg = 'C:\\My Documents'; continue; }
            const it = files[idx]; if (!it) return true;
            if (it.type === 'dir') { dirArg = sh.pathStr(r0.dr, r0.dirs).replace(/\\$/, '') + '\\' + it.name; continue; }
            const e = await loadFile(sh.pathStr(r0.dr, r0.dirs).replace(/\\$/, '') + '\\' + it.name); if (e) await K.msgBox(host, e, ['OK']);
            return true;
          }
        }
        case 'save': await doSave(false); return true;
        case 'saveas': await doSave(true); return true;
        case 'print': await K.msgBox(host, 'The printer is out of cyan.\n\nIt\'s a BASIC program. It doesn\'t need cyan.\nThe printer disagrees.', ['OK']); return true;
        case 'cut': Ed.snapUndo(); Ed.clip = Ed.selText(); Ed.delSel(); return true;
        case 'copy': Ed.clip = Ed.selText(); return true;
        case 'paste': Ed.snapUndo(); Ed.insert(Ed.clip); return true;
        case 'clear': Ed.snapUndo(); Ed.delSel(); return true;
        case 'newsub': case 'newfn': { const r = await K.form(host, a === 'newsub' ? 'New SUB' : 'New FUNCTION', [{ type: 'text', label: '&Name:', value: '', max: 30, focus: true }, { type: 'btns', items: ['OK', 'Cancel'] }], { w: 44 }); if (!r || r.btn !== 'OK' || !r.values[0].trim()) return true; const n = r.values[0].trim().replace(/[^A-Za-z0-9_$]/g, ''); Ed.snapUndo(); Ed.r = Ed.lines.length - 1; Ed.c = Ed.lines[Ed.r].length; Ed.insert(`\n\n${a === 'newsub' ? 'SUB' : 'FUNCTION'} ${n}\n  \nEND ${a === 'newsub' ? 'SUB' : 'FUNCTION'}`); Ed.r -= 1; Ed.c = 2; return true; }
        case 'subs': { const list = []; Ed.lines.forEach((l, i) => { const m = /^\s*(SUB|FUNCTION)\s+(\S+)/i.exec(l); if (m) list.push([m[2] + (m[1].toUpperCase() === 'FUNCTION' ? '  (FUNCTION)' : ''), i]); }); if (!list.length) { await K.msgBox(host, 'This program has no SUBs or FUNCTIONs.\n(That\'s fine. MYFIRST.BAS hasn\'t either.)', ['OK']); return true; } const r = await K.form(host, 'SUBs', [{ type: 'label', text: title(), rows: 1 }, { type: 'list', items: list.map(x => x[0]), h: Math.min(10, list.length + 1), focus: true }, { type: 'btns', items: ['Edit in Active', 'Cancel'] }], { w: 50, onListEnter: async () => 'ok' }); if (r && r.btn === 'Edit in Active') { const i = list.findIndex(x => x[0] === r.values[1]); if (i >= 0) { Ed.r = list[i][1]; Ed.c = 0; Ed.top = Math.max(0, Ed.r - 2); } } return true; }
        case 'output': { if (!outSnap) { await K.msgBox(host, 'Nothing has run yet. Press F5!', ['OK']); return true; } const snap = s.snap(); s.restore(outSnap); s.cur.on = false; host.setMouse(false); await host.readEvent(); host.setMouse(true); s.restore(snap); return true; }
        case 'imm': immediate = !immediate; return true;
        case 'find': case 'change': {
          const ctrls = [{ type: 'text', label: '&Find What:', value: lastFind || (Ed.selText().split('\n')[0] || ''), max: 60, focus: true }];
          if (a === 'change') ctrls.push({ type: 'text', label: 'C&hange To:', value: '', max: 60 });
          ctrls.push({ type: 'check', label: '&Match Upper/Lowercase', value: matchCase }, { type: 'btns', items: a === 'change' ? ['Change All', 'Cancel'] : ['OK', 'Cancel'] });
          const r = await K.form(host, a === 'change' ? 'Change' : 'Find', ctrls, { w: 56 });
          if (!r || r.btn === 'Cancel' || !r.values[0]) return true;
          lastFind = r.values[0]; matchCase = r.values[a === 'change' ? 2 : 1];
          if (a === 'change') { Ed.snapUndo(); let n = 0; const q = matchCase ? lastFind : lastFind.toLowerCase(); Ed.lines = Ed.lines.map(l => { let out = '', i = 0; const src = matchCase ? l : l.toLowerCase(); for (;;) { const j = src.indexOf(q, i); if (j < 0) { out += l.slice(i); break; } out += l.slice(i, j) + r.values[1]; i = j + q.length; n++; } return out; }); if (n) Ed.dirty = true; await K.msgBox(host, n ? `${n} occurrence${n === 1 ? '' : 's'} changed.` : 'Match not found', ['OK']); return true; }
          return act('again');
        }
        case 'again': { if (!lastFind) return act('find'); const hit = Ed.find(lastFind, Ed.c, matchCase); if (!hit) { await K.msgBox(host, 'Match not found', ['OK']); return true; } Ed.r = hit.r; Ed.c = hit.c; Ed.sel = { r: hit.r, c: hit.c }; Ed.c += lastFind.length; return true; }
        case 'run': await runIt(); return true;
        case 'makeexe': await K.msgBox(host, 'Make EXE File requires the full QuickBASIC compiler (\u00a3129.99).\n\nJack has \u00a34.50 and a book token. Maybe for Christmas.', ['OK']); return true;
        case 'step': await K.msgBox(host, 'Step: runs one line at a time.\n\nJack\'s version runs ALL the lines at once, because that\'s faster. (F5)', ['OK']); return true;
        case 'trace': await K.msgBox(host, 'Trace On: shows every line as it runs.\n\nIt was making the screen very busy. It is now Trace Off. Forever.', ['OK']); return true;
        case 'bp': await K.msgBox(host, 'Breakpoints: none set.\n\n(The only breakpoint Jack uses is Ctrl+Break, when WORM.BAS eats itself.)', ['OK']); return true;
        case 'display': await K.msgBox(host, 'Colours: white on blue. Scroll bars: on. Tab stops: 8.\n\nYes, it\'s the same blue as EDIT. They\'re cousins.', ['OK'], { title: 'Display' }); return true;
        case 'helppath': await K.msgBox(host, 'Help file: C:\\JBASIC\\JBASIC.HLP\n\nTYPE it at the prompt, or press F1 here.', ['OK']); return true;
        case 'syntax': await K.msgBox(host, 'Syntax Checking is ON. It cannot be turned off.\n(JBASIC checks when you press F5. Then it tells you. Loudly.)', ['OK']); return true;
        case 'help': await K.msgBox(host, errMsg ? `Last error: ${errMsg}\n\n` + helpFor(errMsg) : 'JBASIC HELP\n\nF5 runs the program. Esc gets you out of most things. Alt opens the menus.\nFile > Open shows the samples in C:\\JBASIC. Start with MYFIRST.BAS.\nFor the list of statements: TYPE C:\\JBASIC\\JBASIC.HLP at the prompt.\nCtrl+Break stops a program that won\'t stop.', ['OK'], { title: 'Help', left: true, width: 70 }); return true;
        case 'about': await K.msgBox(host, 'JBASIC\nVersion 1.1\n\nJack\'s BASIC, 1999. Written in a bedroom.\n"Very nearly a real programming language" - ' + Cast.n('teacher'), ['OK'], { title: 'About' }); return true;
      }
      return true;
    }
    const helpFor = m => /Syntax/.test(m) ? 'Something on that line isn\'t BASIC. Check the spelling, the brackets, and that strings have both their quotes.' : /Subscript/.test(m) ? 'You used an array index that\'s bigger than the DIM (or less than 0). DIM a(10) gives you a(0) to a(10).' : /Type mismatch/.test(m) ? 'You mixed up words and numbers. Words go in $ variables (n$), numbers in plain ones (n).' : /NEXT without FOR|without/.test(m) ? 'The blocks don\'t match up. Every FOR needs a NEXT, every IF needs an END IF, every DO needs a LOOP.' : /Division/.test(m) ? 'You divided by zero. Even Mr Bell can\'t do that.' : /Label/.test(m) ? 'GOTO or GOSUB points at a label or line number that isn\'t there.' : /Out of DATA/.test(m) ? 'READ ran out of DATA lines. Add more DATA or READ less.' : /Illegal function/.test(m) ? 'A function got a value it can\'t use (negative SQR, LOCATE off the screen, a colour that doesn\'t exist...).' : 'Have a look at the line the cursor is on.';
    if (runAtStart) { draw(); await runIt(); }
    draw();
    for (;;) {
      const e = await host.readEvent();
      if (e.type === 'mouse') {
        if (e.y === 0 && e.act === 'down') { const ms = menus(); let x = 2; let idx = -1; ms.forEach((m, i) => { const last = i === ms.length - 1; const mx = last ? W() - K.plain(m.label).length - 3 : x; if (e.x >= mx - 1 && e.x < mx + K.plain(m.label).length + 1) idx = i; x += K.plain(m.label).length + 2; }); if (idx >= 0) { const it = await K.menuBar(host, ms, idx, true, { rightHelp: true }); if (it && !await act(it.act)) break; } draw(); continue; }
        if (e.act === 'wheel') { Ed.top = Math.max(0, Math.min(Ed.lines.length - 1, Ed.top + e.dy * 3)); Ed.r = Math.max(Ed.top, Math.min(Ed.top + edH() - 1, Ed.r)); draw(); continue; }
        if (e.act === 'down' && e.y === H() - 1) { const m = /<([^>]+)>/g; const line = s.text(H() - 1); let mm; while ((mm = m.exec(line))) { if (e.x >= mm.index && e.x < mm.index + mm[0].length) { const k = mm[1].split('=')[0].replace('Shift+', ''); if (k === 'F5') await act('run'); else if (k === 'F1') await act('help'); else if (k === 'F2') await act('subs'); else if (k === 'F6') await act('imm'); else if (k === 'F8') await act('step'); } } draw(); continue; }
        if ((e.act === 'down' || e.act === 'drag') && e.y >= 2 && e.y < 2 + edH() && e.x >= 1 && e.x < W() - 2) {
          immediate = false;
          const r = Math.min(Ed.lines.length - 1, Ed.top + e.y - 2), c = Ed.left + e.x - 1;
          if (e.act === 'down') { Ed.sel = null; Ed.r = r; Ed.c = Math.min(c, Ed.lines[r].length); } else { if (!Ed.sel) Ed.sel = { r: Ed.r, c: Ed.c }; Ed.r = r; Ed.c = Math.min(c, Ed.lines[r].length); }
        }
        if (e.act === 'down' && e.y === edH() + 3) immediate = true;
        if (e.act === 'down' && e.x === W() - 1 && e.y >= 2 && e.y < 2 + edH()) { Ed.r = e.y === 2 ? Math.max(0, Ed.r - 1) : e.y === edH() + 1 ? Math.min(Ed.lines.length - 1, Ed.r + 1) : Math.round((e.y - 3) / Math.max(1, edH() - 3) * (Ed.lines.length - 1)); Ed.sel = null; }
        draw(); continue;
      }
      const k = e.key;
      if (k === 'AltUp' || k === 'F10' && !e.alt) { const it = await K.menuBar(host, menus(), 0, false, { rightHelp: true }); if (it && !await act(it.act)) break; draw(); continue; }
      if (e.alt && k.length === 1) { const ms = menus(); const i = ms.findIndex(m => K.hot(m.label) === k.toLowerCase()); if (i >= 0) { const it = await K.menuBar(host, ms, i, false, { open: true, rightHelp: true }); if (it && !await act(it.act)) break; } draw(); continue; }
      if (e.alt) { draw(); continue; }
      let handled = true;
      if (k === 'F5') await act('run');
      else if (k === 'F1') await act('help');
      else if (k === 'F2') await act('subs');
      else if (k === 'F3') await act('again');
      else if (k === 'F4') await act('output');
      else if (k === 'F6') immediate = !immediate;
      else if (k === 'F8') await act('step');
      else if (e.ctrl && /^[fF]$/.test(k)) await act('find');
      else if (e.ctrl && /^[sS]$/.test(k)) await act('save');
      else if (e.ctrl && /^[oO]$/.test(k)) await act('open');
      else handled = false;
      if (handled) { draw(); continue; }
      if (immediate) {
        if (k === 'Enter') { if (imm.trim()) { const line = imm; imm = ''; await runIt(line); } }
        else if (k === 'Backspace') imm = imm.slice(0, -1);
        else if (k === 'Escape') imm = '';
        else if (k === 'ArrowUp' || k === 'Tab') immediate = false;
        else if (e.ch && !e.ctrl) imm += e.ch;
        draw(); continue;
      }
      if (k === 'Escape') { Ed.sel = null; draw(); continue; }
      const prevR = Ed.r;
      if (k === 'Enter') { tidyLine(Ed.r); Ed.snapUndo(); Ed.newline(true); }
      else Ed.key(e, { h: edH() });
      if (Ed.r !== prevR && k !== 'Enter') tidyLine(prevR);
      draw();
    }
    if (sv) { sv.clear(); sv.stop(); } // (Exit: saved, or they said not to)
  });
  // JBASIC "/RUN": from the prompt, run first then show the IDE (that's what QBasic did)
  DOS.basic = { runProgram, compile, tokenize, Runtime };
})();
