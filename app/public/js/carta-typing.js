/* Gubbinz Teaches Typing (carta pack, lazy-loaded by apps-carta.js).
 * Lessons with an on-screen keyboard and finger hints, live WPM/accuracy, the Squig Drop falling-words game,
 * and certificates you "print" on the family inkjet. */
(function () {
  const C = window.Carta, A = window.Apps;
  if (!C || !A) return;
  const { h, esc, store } = C;
  const note = (f, d, t) => { try { Sound.note(f, d, t); } catch (e) {} };
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const today = () => { const t = Desk.today99(); return { long: `${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}/1999`, short: `${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}/99` }; };

  // ================================================================ pixel art: Gubbinz and a squig
  const PAL = { k: '#000', w: '#fff', g: '#3a9a2a', G: '#1f5e14', l: '#8ad84a', r: '#e10600', R: '#8a0000', y: '#ffd400', n: '#7a4a1a', o: '#ff8000', b: '#7a5a3a', B: '#4a3420', h: '#b8946a' };
  function drawRows(ctx, rows, x, y, s) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = PAL[r[i]]; if (c) { ctx.fillStyle = c; ctx.fillRect(x + i * s, y + j * s, s, s); } } }); }
  const GUB = [
    'G..............G', 'gG............Gg', 'ggG..GGGGGG..Ggg', '.ggGGggggggGGgg.', '..gggggggggggg..', '..gwwwggggwwwg..', '..gwrrggggrrwg..', '..ggwwggggwwgg..',
    '..gggggllggggg..', '..gkkkkkkkkkkg..', '..gkwkwkwkwkkg..', '...gkkkkkkkkg...', '....gggggggg....', '.....GGGGGG.....', '....nnnnnnnn....', '...gnnnnnnnng...'];
  const GUB_TALK = GUB.map((r, i) => i === 10 ? '..gkkkkkkkkkkg..' : i === 11 ? '...gkrrrrrrkg...' : r);
  const GUB_BLINK = GUB.map((r, i) => i === 5 || i === 7 ? '..gggggggggggg..' : i === 6 ? '..gkkkggggkkkg..' : r);
  const SQUIG = ['..y....r...y..', '..o..y.o..yo..', '.ryo.oyro.oyr.', '.royoyoyooyor.', '..ryyyyyyyyr..', '...kkkkkkkk...', '..khhhbbbbbk..', '.khhbbbbBbbbk.', '.khbbBbbbbbBk.', '.kbbbbbbhbbBk.', '.kbBbbbbbbBBk.', '..kbbbBbbBBk..', '...kBBBBBBk...', '....kkkkkk....']; // a flaming meteor (Meteor Typer)

  // one ticker animates every Gubbinz on screen (talking mouth, blinking)
  const gubs = new Set();
  let gubTimer = 0;
  function makeGub(size) {
    const cv = h('canvas', 'ct-t-gub ct-px'); cv.width = 16; cv.height = 16; cv.style.width = cv.style.height = (size || 64) + 'px';
    const g = { cv, talk: 0, blink: 0, frame: 0 };
    g.draw = () => { const x = cv.getContext('2d'); x.clearRect(0, 0, 16, 16); drawRows(x, g.talk > 0 && (g.frame & 1) ? GUB_TALK : g.blink > 0 ? GUB_BLINK : GUB, 0, 0, 1); };
    g.draw(); gubs.add(g);
    if (!gubTimer) gubTimer = setInterval(() => {
      gubs.forEach(q => { if (!q.cv.isConnected) { gubs.delete(q); return; } q.frame++; if (q.talk > 0) q.talk--; if (q.blink > 0) q.blink--; else if (Math.random() < 0.03) q.blink = 2; q.draw(); });
      if (!gubs.size) { clearInterval(gubTimer); gubTimer = 0; }
    }, 150);
    return g;
  }
  function gubWithBubble(text, size) {
    const wrap = h('div', 'ct-t-hello'); const g = makeGub(size); const bub = h('div', 'ct-t-bubble');
    wrap.append(g.cv, bub);
    const say = t => { bub.textContent = t; g.talk = Math.min(18, 4 + Math.round(t.length / 6)); };
    say(text);
    return { el: wrap, say, gub: g };
  }

  // ================================================================ lessons (all original text)
  const drill = (keys, n) => Array.from({ length: n }, () => Array.from({ length: 2 + rnd(3) }, () => keys[rnd(keys.length)]).join('')).join(' ');
  const words = (list, n) => { const out = []; while (out.length < n) { const w = pick(list); if (w !== out[out.length - 1]) out.push(w); } return out.join(' '); };
  const pickN = (list, n, sep) => shuffle(list.slice()).slice(0, n).join(sep || ' ');
  const HOME_WORDS = ['a', 'as', 'ad', 'add', 'all', 'ask', 'asks', 'sad', 'lad', 'dad', 'fad', 'gas', 'has', 'had', 'hall', 'fall', 'flask', 'salad', 'glass', 'lass', 'ash', 'dash', 'lash', 'sash', 'flag', 'flags', 'shall', 'half', 'jag', 'gal', 'alas', 'lads', 'dads', 'gash', 'flash'];
  const TOP_WORDS = ['type', 'typewriter', 'quiet', 'write', 'tree', 'pour', 'route', 'rope', 'power', 'pretty', 'quite', 'tire', 'trip', 'wipe', 'yeti', 'poetry', 'tower', 'pipe', 'your', 'were', 'rotor', 'quest', 'request', 'great', 'after', 'jokes', 'salty', 'tea', 'toast', 'hero', 'pirate', 'weird', 'fridge', 'kettle', 'puppet'];
  const BOTTOM_WORDS = ['zap', 'zoom', 'buzz', 'fizz', 'van', 'cab', 'black', 'box', 'mix', 'comb', 'climb', 'bank', 'snack', 'zebra', 'cobweb', 'vacuum', 'maximum', 'command', 'combo', 'nimble', 'zinc', 'oxen', 'convex', 'backbone', 'jumbo', 'bubble', 'mammoth', 'cabin'];
  const NUMS = ['1999', '56', '1.44', '650', '32', '64', '128', '256', '486', '98', '3.5', '640', '480', '800', '600', '1024', '768', '2', '4', '8', '16', '386', '33', '28.8', '14.4', '9600', '101', '42', '10', '75'];
  const CAPS = ["Dave's floppy is full.", 'Is it 1999? Yes!', 'Gubbinz says: Need help?', 'Hello, World!', "Mom's on the phone.", 'Press Ctrl, Alt and Del.', 'Do a barrel roll!', 'The CD-ROM is 32x.', 'Save your work often!', 'Wait... is that a UFO?', 'Turn it off and on again.', "Don't feed the Furby!", 'Is the modem on? No.', 'Click OK. Then click OK.'];
  const COMMON = ['the', 'and', 'you', 'that', 'was', 'for', 'are', 'with', 'they', 'one', 'have', 'this', 'from', 'had', 'not', 'but', 'what', 'all', 'were', 'when', 'we', 'there', 'can', 'your', 'which', 'said', 'if', 'do', 'will', 'each', 'about', 'how', 'up', 'out', 'them', 'then', 'many', 'some', 'so', 'would', 'other', 'into', 'more', 'two', 'like', 'see', 'time', 'could', 'make', 'than', 'first', 'been', 'who', 'now', 'people', 'made', 'over', 'down', 'only', 'way', 'find', 'use', 'water', 'long', 'little', 'very', 'after', 'just', 'where', 'most', 'know'];
  const SENTENCES = [
    'My modem screams like a robot falling down the stairs.',
    'Never eat a Pot Noodle that is bigger than your head.',
    'Dave borrowed my floppy disk and gave back a sandwich.',
    'The Y2K bug will not get my video recorder.',
    'My Game Lad needs four new batteries. Again.',
    'Please do not use the CD-ROM tray as a cup holder.',
    'Mom needs the phone, so the Internet has to wait.',
    'Gubbinz ate the mouse. It was the computer mouse.',
    'A floppy disk holds a whole megabyte and a bit.',
    'The screen saver has pipes in it. I could watch it for hours.',
    'If you can read this, your typing is getting good.',
    'My cube is solved on five sides. The sixth side is a secret.',
  ];
  const SPEED = [
    'My computer has a 350 MHz processor, 64 MB of RAM and a 32x CD-ROM drive. It can play games, surf the web and print homework. It cannot make toast. I have checked.',
    'Every night the modem dials up and screams. Mom says it sounds like a robot gargling gravel. Then the web pages load, one picture at a time, slowly, from the top down.',
    'Gubbinz the desktop helper learned to type with two fingers. He is very fast with those two fingers. He is even faster at eating jelly babies. Nobody has taught him to stop doing that.',
  ];
  const LESSONS = [
    { id: 'home', name: 'Home Row Keys', keys: 'A S D F  J K L ;', min: 8, tip: 'It looks like you\'re learning to type! Fingers on the home row: A S D F for the left hand, J K L ; for the right.', gen: () => drill('asdfjkl;', 12) },
    { id: 'homew', name: 'Home Row Words', keys: 'A S D F G H J K L', min: 10, tip: 'G and H are in the middle. Stretch your pointy fingers for them, then come back home.', gen: () => words(HOME_WORDS, 13) },
    { id: 'top', name: 'Top Row', keys: 'Q W E R T Y U I O P', min: 10, tip: 'Reach UP for the top row, then back to the home row. Fun fact: "typewriter" is all top row!', gen: () => drill('qwertyuiop', 4) + ' ' + words(TOP_WORDS, 9) },
    { id: 'bottom', name: 'Bottom Row', keys: 'Z X C V B N M , .', min: 10, tip: 'Curl your fingers DOWN for the bottom row. Zap! Buzz! Fizz!', gen: () => drill('zxcvbnm', 3) + ' ' + words(BOTTOM_WORDS, 9) },
    { id: 'num', name: 'Numbers', keys: '1 2 3 4 5 6 7 8 9 0', min: 8, tip: 'Numbers are a long way up. Keep your wrists still and reach!', gen: () => pickN(NUMS, 14) },
    { id: 'caps', name: 'Capitals & Punctuation', keys: 'Shift  ,  .  !  ?  \'', min: 10, tip: 'For a BIG letter, hold Shift with the OTHER hand. That\'s the rule.', gen: () => pickN(CAPS, 4) },
    { id: 'common', name: 'Common Words', keys: 'the and you that...', min: 12, tip: 'These are the words everybody types all the time. Learn them and you fly.', gen: () => words(COMMON, 15) },
    { id: 'sent', name: 'Sentences', keys: 'everything!', min: 12, tip: 'Proper sentences now. Don\'t look at the keys! I\'m watching you.', gen: () => pickN(SENTENCES, 2) },
    { id: 'speed', name: 'Speed Test', keys: 'a whole paragraph', min: 15, tip: 'The big one. Slow and right beats fast and wrong. GO!', gen: () => pick(SPEED) },
  ];
  const TIPS = ["Feel the little bumps on F and J? That's where your pointy fingers live.", "Don't look at the keys! Look at the screen.", 'Thumbs on the space bar. What else are thumbs for?', 'Sit up straight! You look like a question mark.', 'Slow and right beats fast and wrong.', 'Zip types fast. You are not a hedgehog. Practise!', 'Take a break every 20 minutes. Go and annoy Mom.'];

  // ================================================================ keyboard: UK-ish layout, finger zones
  const FINGER_COL = ['#ff9ec4', '#ffc078', '#fff07a', '#9be37a', '#d8d8d8', '#86e0e0', '#8fb8ff', '#c7a3ff', '#ff9ec4'];
  const FINGER_NAME = ['left little finger', 'left ring finger', 'left middle finger', 'left pointing finger', 'thumb', 'right pointing finger', 'right middle finger', 'right ring finger', 'right little finger'];
  const FINGER = {};
  [['`1qaz\\', 0], ['2wsx', 1], ['3edc', 2], ['45rtfgvb', 3], ['67yuhjnm', 5], ['8ik,', 6], ['9ol.', 7], ["0-=p[];'#/", 8]].forEach(([s, f]) => [...s].forEach(c => { FINGER[c] = f; }));
  Object.assign(FINGER, { Tab: 0, Caps: 0, ShiftL: 0, Space: 4, Backspace: 8, Enter: 8, ShiftR: 8 });
  const KB_ROWS = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', ['Backspace', 2, '\u2190']],
    [['Tab', 1.5, 'Tab'], 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', ['Enter', 1.5, '\u21b5']],
    [['Caps', 1.75, 'Caps'], 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", '#', ['Enter', 1.25, '']],
    [['ShiftL', 1.25, 'Shift'], '\\', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', ['ShiftR', 2.75, 'Shift']],
    [['_pad', 4, ''], ['Space', 7, ''], ['_pad', 4, '']],
  ];
  const SHIFTED = { '!': '1', '"': '2', '\u00a3': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=', '{': '[', '}': ']', ':': ';', '@': "'", '~': '#', '<': ',', '>': '.', '?': '/', '|': '\\', '\u00ac': '`' };
  function keysFor(ch) { // -> [key ids], finger of the main key
    if (ch === ' ') return { keys: ['Space'], f: 4 };
    let k = ch, shift = false;
    if (/[A-Z]/.test(ch)) { k = ch.toLowerCase(); shift = true; } else if (SHIFTED[ch]) { k = SHIFTED[ch]; shift = true; }
    const f = FINGER[k] != null ? FINGER[k] : 4;
    return { keys: shift ? [k, f < 4 ? 'ShiftR' : 'ShiftL'] : [k], f, shift };
  }
  function buildKeyboard() {
    const kb = h('div', 'ct-t-kb');
    KB_ROWS.forEach(row => {
      const r = h('div', 'ct-t-kbr');
      row.forEach(k => {
        const [id, u, label] = Array.isArray(k) ? k : [k, 1, k];
        const b = h('span', 'ct-t-key' + (id === '_pad' ? ' pad' : ''));
        b.style.flexGrow = u; b.dataset.k = id;
        if (id !== '_pad') { b.style.background = FINGER_COL[FINGER[id] != null ? FINGER[id] : 4]; b.textContent = label; if (id === 'f' || id === 'j') b.classList.add('bump'); }
        r.appendChild(b);
      });
      kb.appendChild(r);
    });
    return kb;
  }
  const HANDS = `<svg viewBox="0 0 200 72" class="ct-t-hands" aria-hidden="true">
    <g><rect x="10" y="40" width="66" height="30" rx="12" fill="#f2c79a" stroke="#7a4a1a"/><rect data-f="0" x="10" y="22" width="14" height="30" rx="7"/><rect data-f="1" x="27" y="12" width="14" height="40" rx="7"/><rect data-f="2" x="44" y="8" width="14" height="44" rx="7"/><rect data-f="3" x="61" y="14" width="14" height="38" rx="7"/><rect data-f="4" x="74" y="38" width="12" height="26" rx="6" transform="rotate(-40 80 52)"/></g>
    <g transform="translate(200 0) scale(-1 1)"><rect x="10" y="40" width="66" height="30" rx="12" fill="#f2c79a" stroke="#7a4a1a"/><rect data-f="8" x="10" y="22" width="14" height="30" rx="7"/><rect data-f="7" x="27" y="12" width="14" height="40" rx="7"/><rect data-f="6" x="44" y="8" width="14" height="44" rx="7"/><rect data-f="5" x="61" y="14" width="14" height="38" rx="7"/><rect data-f="4" x="74" y="38" width="12" height="26" rx="6" transform="rotate(-40 80 52)"/></g></svg>`;

  // ================================================================ certificates
  function certEl(c) {
    const el = h('div', 'ct-t-cert');
    el.innerHTML = `<div class="ct-t-cert-in"><div class="ct-t-cert-k">GUBBINZ TEACHES TYPING</div><div class="ct-t-cert-t">Certificate of Typing</div><div class="ct-t-cert-s">This is to certify that</div><div class="ct-t-cert-n">${esc(c.name)}</div>
      <div class="ct-t-cert-s">has passed <b>${esc(c.lesson)}</b><br>at <b>${c.wpm} words per minute</b> with <b>${c.acc}% accuracy</b></div>
      <div class="ct-t-cert-stars">${'\u2605'.repeat(c.stars)}${'\u2606'.repeat(3 - c.stars)}</div>
      <div class="ct-t-cert-f"><div class="ct-t-cert-sig"><span class="ct-t-sigtxt">Gubbinz</span><span>Gubbinz, Head Teacher</span></div><div class="ct-t-seal"><span>TOP<br>TYPIST</span></div><div class="ct-t-cert-sig"><span class="ct-t-sigdate">${esc(c.date)}</span><span>Date</span></div></div></div>`;
    return el;
  }
  const certFileName = c => `Typing Certificate - ${c.lesson.replace(/[\\/:*?"<>|]/g, '')}.cert`;
  function fileCert(c) { A.fs.add('C:/My Documents', { name: certFileName(c), type: 'cert', cert: c, date: c.date.slice(0, 6) + '99', size: '4 KB' }); }
  // re-file certificates saved in an earlier visit
  store.get('typing_certs', []).forEach(c => { try { if (!A.fs.get('C:/My Documents/' + certFileName(c))) fileCert(c); } catch (e) {} });

  function viewCert(c) {
    const b = h('div', 'ct-t-certwin');
    b.appendChild(certEl(c));
    const row = h('div', 'row ct-t-certbtns'); row.innerHTML = '<button class="btn" type="button" data-a="print">Print...</button><button class="btn" type="button" data-a="close">Close</button>';
    b.appendChild(row);
    const w = A.win(certFileName(c).replace(/\.cert$/, ''), b, { w: 460, icon: C.ICON.cert, noMax: true, escClose: true });
    row.querySelector('[data-a=close]').addEventListener('click', w.close);
    row.querySelector('[data-a=print]').addEventListener('click', () => printDialog(c));
    return w;
  }
  function printDialog(c, after) {
    const b = h('form', 'ct-t-print');
    b.innerHTML = `<div class="group"><span class="lg">Printer</span>
        <div class="ct-t-pr"><label for="ctPrSel">Name:</label><select class="ct-t-prsel" id="ctPrSel"><option>Inkjet 440 Colour</option><option>Fax (it's just the phone)</option></select><button class="btn" type="button" data-p="props">Properties</button></div>
        <div class="ct-t-pr"><span>Status:</span><span>Default printer; Ready</span></div><div class="ct-t-pr"><span>Type:</span><span class="ct-t-prtype">Inkjet 440 Colour</span></div>
        <div class="ct-t-pr"><span>Where:</span><span class="ct-t-prwhere">LPT1:</span></div><div class="ct-t-pr"><span>Comment:</span><span>Low on cyan. (Always.)</span><label class="ct-t-ptf"><input type="checkbox"> Print to file</label></div></div>
      <div class="ct-t-prrow"><div class="group"><span class="lg">Print range</span><label><input type="radio" name="ctprr" checked> All</label><label><input type="radio" name="ctprr"> Pages <u>f</u>rom: 1 to: 1</label><label class="dis"><input type="radio" name="ctprr" disabled> Selection</label></div>
        <div class="group"><span class="lg">Copies</span><label class="ct-t-pr">Number of copies: <input type="number" class="ct-t-copies" min="1" max="9" value="1"></label><label><input type="checkbox" checked> Collate</label></div></div>
      <div class="ct-t-pr ct-t-prname"><label for="ctPrName">Name on certificate:</label><input type="text" id="ctPrName" maxlength="24"></div>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="submit" style="min-width:72px">OK</button><button class="btn" type="button" data-p="cancel" style="min-width:72px">Cancel</button></div>`;
    const w = A.win('Print', b, { w: 420, noResize: true, noMax: true, noMin: true, escClose: true, icon: '<svg viewBox="0 0 32 32"><rect x="4" y="12" width="24" height="12" fill="#c0c0c0" stroke="#000"/><rect x="8" y="4" width="16" height="9" fill="#fff" stroke="#000"/><rect x="8" y="22" width="16" height="7" fill="#fff" stroke="#000"/><rect x="22" y="15" width="3" height="2" fill="#0c0"/></svg>' });
    const nameIn = b.querySelector('#ctPrName');
    nameIn.value = c.name || store.get('typing_name', '') || (window.Net && Net.me && Net.me.nick) || 'Jack';
    const sel = b.querySelector('.ct-t-prsel');
    sel.addEventListener('change', () => { const fax = sel.selectedIndex === 1; b.querySelector('.ct-t-prtype').textContent = fax ? 'Fax modem' : 'Inkjet 440 Colour'; b.querySelector('.ct-t-prwhere').textContent = fax ? 'COM2: (the phone line)' : 'LPT1:'; });
    b.querySelector('[data-p=props]').addEventListener('click', () => Desk.msgbox('Inkjet 440 Colour Properties', 'Paper: A4 (or the back of Mom\'s letters)\nQuality: Best (takes 20 minutes a page)\nColour: Yes\nCyan level: 0%\nCyan level since 1997: 0%\n\nTip: give the printer a shake. It doesn\'t help, but it feels good.', 'info'));
    b.querySelector('[data-p=cancel]').addEventListener('click', w.close);
    setTimeout(() => nameIn.focus(), 30);
    b.addEventListener('submit', ev => {
      ev.preventDefault();
      if (sel.selectedIndex === 1) { w.close(); Desk.msgbox('Fax', 'Dialling...\n\nThe fax IS the phone. Mom is on the phone. The certificate will be faxed to nobody, never.\n\nPick the inkjet instead!', 'warn'); return; }
      const nm = nameIn.value.trim().slice(0, 24) || 'Jack';
      store.set('typing_name', nm);
      const copies = Math.max(1, Math.min(9, +b.querySelector('.ct-t-copies').value || 1));
      w.close();
      printing(Object.assign({}, c, { name: nm }), copies, after);
    });
  }
  function printing(c, copies, after) {
    const b = h('div', 'ct-t-printing');
    b.innerHTML = `<div class="ct-t-printer"><div class="ct-t-plight"></div><div class="ct-t-pslot"></div><span class="ct-t-pbrand">INKJET 440</span></div><div class="ct-t-paper"><div class="ct-t-paperin"></div></div><div class="ct-t-pstat">Printing page 1 of 1 to Inkjet 440 Colour on LPT1:</div><div class="row ct-t-pbtns" style="justify-content:flex-end"><button class="btn" type="button" data-a="cancel">Cancel</button></div>`;
    const cert = certEl(c); b.querySelector('.ct-t-paperin').appendChild(cert);
    const w = A.win('Printing...', b, { w: 440, noMax: true, icon: C.ICON.cert });
    const paper = b.querySelector('.ct-t-paper'), stat = b.querySelector('.ct-t-pstat');
    let shown = 0, step = 0, copy = 1;
    const full = () => cert.offsetHeight + 4;
    const iv = setInterval(() => {
      if (w.closed) return clearInterval(iv);
      step++; shown = Math.min(full(), shown + 9);
      paper.style.height = shown + 'px';
      note(260 + rnd(5) * 60, 0.05, 'sawtooth'); if (step % 6 === 0) note(70, 0.12, 'square');
      if (shown >= full()) {
        if (copy < copies) { copy++; shown = 0; stat.textContent = `Printing copy ${copy} of ${copies}...`; note(120, 0.2, 'square'); return; }
        clearInterval(iv);
        paper.style.height = 'auto';
        stat.textContent = copies > 1 ? `Printed ${copies} copies. (The fridge isn't big enough.)` : 'Printed! Put it on the fridge.';
        w.setTitle('Certificate - ' + c.name);
        const certs = store.get('typing_certs', []).filter(x => x.lesson !== c.lesson); certs.push(c); store.set('typing_certs', certs.slice(-12));
        fileCert(c);
        C.secret('cert');
        Desk.toast('Certificate saved', `"${certFileName(c)}" is in My Documents.`, 4500);
        const btns = b.querySelector('.ct-t-pbtns'); btns.innerHTML = '<button class="btn" type="button" data-a="again">Print Again...</button><button class="btn" type="button" data-a="close">Close</button>';
        btns.querySelector('[data-a=again]').addEventListener('click', () => { w.close(); printDialog(c, after); });
        btns.querySelector('[data-a=close]').addEventListener('click', w.close);
        b.classList.add('done');
        if (after) after(c);
      }
    }, 110);
    b.querySelector('[data-a=cancel]').addEventListener('click', () => { clearInterval(iv); w.close(); Desk.msgbox('Printer', 'Printing cancelled. Half a certificate came out. It says "Certificate of Ty".', 'info'); });
    note(500, 0.1, 'square');
  }
  function certsWindow() {
    const list = store.get('typing_certs', []);
    const b = h('div', 'ct-t-certlist');
    b.innerHTML = list.length ? `<p>Your certificates (also in My Documents):</p><div class="field ct-t-clist">${list.map((c, i) => `<button type="button" class="ct-t-crow" data-i="${i}"><span class="ct-t-cico">${C.ICON.cert}</span><span>${esc(c.lesson)}<small>${c.wpm} WPM, ${c.acc}% - ${esc(c.date)}</small></span></button>`).join('')}</div>` : '<p>No certificates yet!</p><p>Pass a lesson and click <b>Print Certificate</b> on the results screen. Gubbinz will sign it. (He can write his own name. Just about.)</p>';
    const w = A.win('My Certificates', b, { w: 340, noMax: true, escClose: true, icon: C.ICON.cert });
    b.querySelectorAll('.ct-t-crow').forEach(r => r.addEventListener('click', () => viewCert(list[+r.dataset.i])));
  }

  // ================================================================ the program
  C.mods.typing = (w, arg) => {
    const root = h('div', 'ct-t');
    root.innerHTML = `<div class="ct-t-banner"><span class="ct-t-logo"><b>Gubbinz</b> Teaches <i>Typing</i></span><span class="ct-t-nav"><button class="btn" type="button" data-n="menu">Lessons</button><button class="btn" type="button" data-n="game">Meteor Typer</button><button class="btn" type="button" data-n="certs">Certificates</button></span></div><div class="ct-t-view"></div>`;
    const inp = h('textarea', 'ct-t-inp');
    ['autocapitalize', 'autocomplete', 'autocorrect'].forEach(a => inp.setAttribute(a, 'off')); inp.spellcheck = false; inp.setAttribute('aria-label', 'Typing input'); inp.rows = 1;
    root.appendChild(inp);
    w.body.appendChild(root);
    const view = root.querySelector('.ct-t-view');
    const opts = Object.assign({ kb: true, tips: true, clicks: true }, store.get('typing_opts', {}));
    const saveOpts = () => store.set('typing_opts', opts);
    let prog = store.get('typing_prog', {});
    let cur = null; // the active view: { onChar, onBack, onKey, stop }
    const status = t => { w.status.textContent = t; };

    // ---- typed input: a hidden textarea with a sentinel, so phone keyboards (and backspace) work too
    const SENT = '\u200b';
    const resetInp = () => { inp.value = SENT; try { inp.setSelectionRange(1, 1); } catch (e) {} };
    resetInp();
    inp.addEventListener('input', () => {
      const v = inp.value;
      if (!v.startsWith(SENT)) { if (cur && cur.onBack) cur.onBack(); for (const ch of v.replace(SENT, '')) if (cur && cur.onChar) cur.onChar(ch); }
      else for (const ch of v.slice(1)) if (cur && cur.onChar) cur.onChar(ch === '\u2019' || ch === '\u2018' ? "'" : ch === '\u201c' || ch === '\u201d' ? '"' : ch === '\n' ? '' : ch);
      resetInp();
    });
    inp.addEventListener('keydown', ev => { if (cur && cur.onKey && cur.onKey(ev)) ev.preventDefault(); });
    const focusIn = () => { try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } };
    root.addEventListener('keydown', ev => { if (ev.target !== inp && cur && cur.onChar && !ev.ctrlKey && !ev.altKey && !ev.metaKey && (ev.key.length === 1 || ev.key === 'Backspace') && !/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) focusIn(); }, true);

    function show(fn, ...args) { if (cur && cur.stop) cur.stop(); cur = null; view.innerHTML = ''; view.scrollTop = 0; cur = fn(...args) || {}; }

    // ---------------------------------------------------------------- lesson menu
    function menu() {
      const el = h('div', 'ct-t-menu');
      const passed = LESSONS.filter(L => prog[L.id] && prog[L.id].passed).length;
      const hello = gubWithBubble(passed === LESSONS.length ? 'You passed EVERYTHING! You type like a proper hacker in a film. Go play Meteor Typer!' : passed ? pick(TIPS) : 'Hi! I\'m Gubbinz. It looks like you want to learn to TYPE! Pick lesson 1. Go on.', 64);
      el.appendChild(hello.el);
      const grid = h('div', 'ct-t-lessons');
      LESSONS.forEach((L, i) => {
        const p = prog[L.id];
        const b = h('button', 'ct-t-card' + (p && p.passed ? ' passed' : ''));
        b.type = 'button';
        b.innerHTML = `<span class="ct-t-num">${i + 1}</span><span class="ct-t-cname">${esc(L.name)}<small>${esc(L.keys)}</small></span><span class="ct-t-cstat">${p ? (p.passed ? `<span class="ct-t-stars">${'\u2605'.repeat(p.stars)}${'\u2606'.repeat(3 - p.stars)}</span>${p.wpm} WPM` : `Best: ${p.wpm} WPM`) : 'Not tried'}</span>`;
        b.addEventListener('click', () => { sfx('click'); show(lesson, i); });
        grid.appendChild(b);
      });
      el.appendChild(grid);
      const foot = h('div', 'ct-t-menufoot');
      foot.innerHTML = `<span>Lessons passed: <b>${passed}</b> of ${LESSONS.length}</span><button class="btn big" type="button">Play Meteor Typer!</button>`;
      foot.querySelector('button').addEventListener('click', () => show(game));
      el.appendChild(foot);
      view.appendChild(el);
      status(`${passed} of ${LESSONS.length} lessons passed. Pick a lesson to start.`);
      return {};
    }

    // ---------------------------------------------------------------- a lesson
    function lesson(idx, saved) {
      const L = LESSONS[idx], text = saved && typeof saved.text === 'string' && saved.text.length ? saved.text : L.gen();
      const el = h('div', 'ct-t-lesson');
      el.innerHTML = `<div class="ct-t-stats"><span class="ct-t-lname">Lesson ${idx + 1}: ${esc(L.name)}</span><span>WPM <b class="ct-t-wpm">0</b></span><span>Accuracy <b class="ct-t-acc">100%</b></span><span>Time <b class="ct-t-time">0:00</b></span></div>
        <div class="prog ct-t-prog"><span style="display:flex;gap:2px"></span></div>
        <div class="ct-t-texthost"><div class="ct-t-text field" tabindex="-1"></div><div class="ct-t-tap">Click here and start typing!</div></div>
        <div class="ct-t-hint">${HANDS}<span class="ct-t-hinttxt"></span></div>
        <div class="ct-t-kbhost"></div>
        <div class="ct-t-lfoot"></div>`;
      const hello = gubWithBubble(L.tip, 48);
      el.querySelector('.ct-t-lfoot').appendChild(hello.el);
      const btns = h('span', 'ct-t-lbtns'); btns.innerHTML = '<button class="btn" type="button" data-a="restart">Restart</button><button class="btn" type="button" data-a="menu">Lessons</button>';
      el.querySelector('.ct-t-lfoot').appendChild(btns);
      const box = el.querySelector('.ct-t-text');
      box.innerHTML = [...text].map(c => `<span>${c === ' ' ? ' ' : esc(c)}</span>`).join('');
      const spans = [...box.children];
      const kb = buildKeyboard(); el.querySelector('.ct-t-kbhost').appendChild(kb);
      if (!opts.kb) el.classList.add('nokb');
      view.appendChild(el);
      const st = { pos: 0, keys: 0, good: 0, marks: [], t0: 0, done: false, streak: 0, base: 0 };
      if (saved && saved.pos > 0 && saved.pos < text.length) { st.pos = saved.pos | 0; st.keys = saved.keys | 0; st.good = saved.good | 0; st.marks = Array.isArray(saved.marks) ? saved.marks.map(Boolean) : []; st.base = +saved.el || 0; }
      const $ = s => el.querySelector(s);
      let timer = 0;
      const elapsed = () => st.base + (st.t0 ? (performance.now() - st.t0) / 1000 : 0);
      const wpm = () => { const t = elapsed(); const ok = st.marks.filter(Boolean).length; return t > 1 ? Math.round(ok / 5 / (t / 60)) : 0; };
      const acc = () => st.keys ? Math.round(st.good / st.keys * 100) : 100;
      const pbar = $('.ct-t-prog span');
      function stats() {
        $('.ct-t-wpm').textContent = wpm(); $('.ct-t-acc').textContent = acc() + '%'; $('.ct-t-time').textContent = mmss(elapsed());
        const n = Math.max(1, Math.floor((pbar.parentNode.clientWidth - 6) / 11));
        pbar.innerHTML = '<i></i>'.repeat(Math.round(st.pos / text.length * n));
      }
      function mark() {
        spans.forEach((s, i) => { s.className = i < st.pos ? (st.marks[i] ? 'ok' : 'bad') + (text[i] === ' ' ? ' sp' : '') : i === st.pos ? 'cur' : ''; });
        const curSpan = spans[st.pos];
        if (curSpan) { const top = curSpan.offsetTop - box.offsetTop; if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 30) box.scrollTop = top - 8; }
        // keyboard + finger hint for the next character
        kb.querySelectorAll('.on').forEach(k => k.classList.remove('on'));
        const ch = text[st.pos];
        if (ch != null) {
          const kf = keysFor(ch);
          kf.keys.forEach(k => kb.querySelectorAll(`[data-k="${CSS.escape(k)}"]`).forEach(e => e.classList.add('on')));
          el.querySelectorAll('.ct-t-hands rect[data-f]').forEach(r => { r.setAttribute('fill', +r.dataset.f === kf.f ? FINGER_COL[kf.f] : '#f2c79a'); r.setAttribute('stroke', +r.dataset.f === kf.f ? '#000' : '#7a4a1a'); r.setAttribute('stroke-width', +r.dataset.f === kf.f ? 2 : 1); });
          $('.ct-t-hinttxt').innerHTML = `Next: <b class="ct-t-nk">${ch === ' ' ? 'Space' : esc(ch)}</b> Use your <b style="background:${FINGER_COL[kf.f]}">${FINGER_NAME[kf.f]}</b>${kf.shift ? ' + <b>Shift</b> (other hand)' : ''}`;
        }
      }
      function finish() {
        st.done = true; clearInterval(timer); stats();
        const res = { wpm: wpm(), acc: acc(), time: elapsed() };
        const passed = res.acc >= 90 && res.wpm >= L.min;
        const stars = !passed ? 0 : res.wpm >= L.min * 2 && res.acc >= 98 ? 3 : res.wpm >= L.min * 1.5 && res.acc >= 95 ? 2 : 1;
        const old = prog[L.id] || {};
        prog[L.id] = { passed: !!(old.passed || passed), wpm: Math.max(old.wpm || 0, res.wpm), acc: Math.max(old.acc || 0, res.acc), stars: Math.max(old.stars || 0, stars) };
        store.set('typing_prog', prog);
        if (res.wpm >= 40 && res.acc >= 90) C.secret('speedy');
        if (passed) sfx('solve'); else sfx('uhoh');
        setTimeout(() => { if (!w.closed && cur === api) show(results, idx, res, passed, stars); }, 450);
      }
      const api = {
        onChar(ch) {
          if (st.done || !ch) return;
          $('.ct-t-tap').classList.add('gone');
          if (!st.t0) { st.t0 = performance.now(); timer = setInterval(stats, 250); status('Typing... (Backspace goes back one)'); }
          const ok = ch === text[st.pos];
          st.keys++; if (ok) { st.good++; st.streak = 0; if (opts.clicks) note(1300 + rnd(200), 0.015, 'square'); }
          else { st.streak++; note(140, 0.09, 'sawtooth'); if (opts.tips && (st.streak === 3 || Math.random() < 0.08)) hello.say(pick(['Oops! That isn\'t it.', 'Wrong key! Eyes on the screen!', 'Slow down, speedy!', 'Find the home row again. F and J have the bumps!'])); }
          st.marks[st.pos] = ok; st.pos++;
          if (opts.tips && st.pos % 40 === 0 && st.pos < text.length) hello.say(pick(['Proper typing!', 'Keep going!', 'Your fingers are on FIRE! (Not really. Mom would be cross.)', 'That\'s the way!', pick(TIPS)]));
          mark(); stats();
          if (st.pos >= text.length) finish();
        },
        onBack() { if (st.done || st.pos <= 0) return; st.pos--; st.marks[st.pos] = undefined; mark(); stats(); },
        onKey(ev) { if (ev.key === 'Escape') { show(menu); return true; } return false; },
        stop() { clearInterval(timer); },
        // saved game (js/gamesave.js): the same text, how far you got, every right and wrong key and the clock
        save: () => (st.done || !st.pos ? null : { view: 'lesson', idx, text, pos: st.pos, keys: st.keys, good: st.good, marks: st.marks.map(m => (m ? 1 : 0)), el: Math.round(elapsed() * 10) / 10 }),
      };
      $('.ct-t-texthost').addEventListener('click', focusIn);
      btns.querySelector('[data-a=restart]').addEventListener('click', () => show(lesson, idx));
      btns.querySelector('[data-a=menu]').addEventListener('click', () => show(menu));
      mark(); stats();
      status(saved && st.pos ? `Lesson ${idx + 1}: carried on from where you were. Type the next letter to keep going.` : `Lesson ${idx + 1}: ${L.name}. Pass mark: ${L.min} WPM and 90% accuracy. Start typing!`);
      if (!matchMedia('(hover:none)').matches) setTimeout(focusIn, 50); else $('.ct-t-tap').classList.add('show');
      return api;
    }

    // ---------------------------------------------------------------- results
    function results(idx, res, passed, stars) {
      const L = LESSONS[idx];
      const el = h('div', 'ct-t-results');
      const hello = gubWithBubble(passed ? pick(stars === 3 ? ['THREE STARS! You type faster than Zip!', 'WAAAGH! That was PROPER fast!'] : ['You passed! Not bad for a human.', 'Good typing! Now print a certificate and show Mom.']) : res.acc < 90 ? 'Too many wrong keys! Slow down and get them right. Try again!' : `Nearly! You need ${L.min} WPM. Practise and try again.`, 72);
      el.appendChild(hello.el);
      const card = h('div', 'ct-t-rcard');
      card.innerHTML = `<div class="ct-t-rtitle">${passed ? 'LESSON PASSED!' : 'Not quite!'}</div><div class="ct-t-rstars">${'\u2605'.repeat(stars)}<span>${'\u2606'.repeat(3 - stars)}</span></div>
        <table class="ct-t-rtab"><tr><td>Lesson</td><td>${idx + 1}. ${esc(L.name)}</td></tr><tr><td>Speed</td><td><b>${res.wpm}</b> words per minute (need ${L.min})</td></tr><tr><td>Accuracy</td><td><b>${res.acc}%</b> (need 90%)</td></tr><tr><td>Time</td><td>${mmss(res.time)}</td></tr></table>
        <div class="row ct-t-rbtns">${passed ? '<button class="btn big" type="button" data-a="cert">Print Certificate...</button>' : ''}<button class="btn" type="button" data-a="again">Try Again</button>${idx < LESSONS.length - 1 ? '<button class="btn" type="button" data-a="next">Next Lesson</button>' : ''}<button class="btn" type="button" data-a="menu">Lessons</button></div>`;
      el.appendChild(card);
      view.appendChild(el);
      const on = (a, f) => { const b = card.querySelector(`[data-a=${a}]`); if (b) b.addEventListener('click', f); };
      on('again', () => show(lesson, idx)); on('next', () => show(lesson, idx + 1)); on('menu', () => show(menu));
      on('cert', () => printDialog({ name: '', lesson: `Lesson ${idx + 1}: ${L.name}`, wpm: res.wpm, acc: res.acc, stars, date: today().long }));
      status(passed ? `Passed with ${res.wpm} WPM and ${res.acc}% accuracy!` : `${res.wpm} WPM, ${res.acc}% accuracy. Have another go!`);
      return {};
    }

    // ---------------------------------------------------------------- Squig Drop
    const GAME_WORDS = ['meteor', 'orbit', 'byte', 'disk', 'ram', 'cpu', 'web', 'chip', 'mega', 'beep', 'zap', 'rupee', 'nasa', 'pixel', 'mouse', 'modem', 'boot', 'bug', 'code', 'game', 'cube', 'star', 'moon', 'ufo', 'robot', 'laser', 'floppy', 'turbo', 'click', 'scroll', 'email', 'chat', 'font', 'icon', 'menu', 'save', 'load', 'print', 'gif', 'html', 'net', 'link', 'page', 'joystick', 'megabyte', 'keyboard', 'computer', 'internet', 'download', 'password', 'cartridge', 'spaceship', 'asteroid', 'millennium', 'dinosaur', 'gigabyte', 'pokemon', 'cdrom', 'processor', 'soundcard', 'desktop', 'printer', 'scanner', 'webpage', 'hyperlink', 'screensaver', 'megahertz', 'pentium', 'baud', 'tetris', 'rubik', 'comet', 'rocket', 'planet', 'galaxy', 'warp', 'alien', 'sprite', 'level', 'bonus', 'combo', 'turbo', 'shuttle', 'lego', 'yoshi', 'boss', 'zelda', 'dragon', 'wizard', 'potion', 'quest'];
    function game(saved) {
      const el = h('div', 'ct-t-game');
      el.innerHTML = `<div class="ct-t-hud"><span>Score <b class="g-score">0</b></span><span>Level <b class="g-level">1</b></span><span class="g-lives"></span><span class="ct-t-buf">&gt; <b class="g-buf"></b><i class="blink">_</i></span></div><div class="ct-t-stage"><canvas class="ct-t-cv" width="640" height="400"></canvas><div class="ct-t-over"></div></div>`;
      view.appendChild(el);
      const cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), stage = el.querySelector('.ct-t-stage'), over = el.querySelector('.ct-t-over');
      const W = 640, H = 400, GROUND = 360;
      // background drawn once
      const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
      { const b = bg.getContext('2d'); const gr = b.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#05051e'); gr.addColorStop(0.7, '#1b2a6b'); gr.addColorStop(1, '#3a4a9a'); b.fillStyle = gr; b.fillRect(0, 0, W, H);
        for (let i = 0; i < 70; i++) { b.fillStyle = Math.random() < 0.2 ? '#ffd400' : '#fff'; const s = Math.random() < 0.15 ? 2 : 1; b.fillRect(rnd(W), rnd(GROUND - 40), s, s); }
        b.fillStyle = '#e8e8d0'; b.beginPath(); b.arc(560, 60, 22, 0, 7); b.fill(); b.fillStyle = '#c8c8b0'; b.fillRect(548, 52, 6, 6); b.fillRect(566, 66, 8, 5); b.fillRect(556, 70, 4, 4);
        b.fillStyle = '#1f5e14'; b.fillRect(0, GROUND, W, H - GROUND); b.fillStyle = '#3a9a2a'; for (let x = 0; x < W; x += 4) b.fillRect(x, GROUND - (x % 12 === 0 ? 4 : 2), 4, 6);
        b.fillStyle = '#4a2a0a'; for (let x = 6; x < W; x += 28) b.fillRect(x, GROUND + 14 + (x % 3) * 6, 6, 3); }
      const hs = () => store.get('typing_hs', []);
      const g = { words: [], parts: [], zaps: [], score: 0, level: 1, lives: 5, zapped: 0, buf: '', spawnT: 0.5, running: false, over: false, paused: false, banner: '', bannerT: 0, flash: 0, t: 0 };
      if (saved && saved.g && Array.isArray(saved.g.words) && saved.g.lives > 0) { // a saved Squig Drop: paused, press any key to carry on
        const sg = saved.g; Object.assign(g, { words: sg.words.filter(x => x && typeof x.text === 'string' && isFinite(x.y)), score: sg.score | 0, level: sg.level || 1, lives: sg.lives | 0, zapped: sg.zapped | 0, spawnT: +sg.spawnT || 1, running: true, paused: true, carry: true });
      }
      let raf = 0, last = 0;
      const $ = s => el.querySelector(s);
      const hud = () => { $('.g-score').textContent = g.score; $('.g-level').textContent = g.level; $('.g-lives').innerHTML = '<span class="ct-t-heart">\u2665</span>'.repeat(g.lives) + '<span class="ct-t-heart off">\u2665</span>'.repeat(Math.max(0, 5 - g.lives)); $('.g-buf').textContent = g.buf; };
      function fit() { const r = stage.getBoundingClientRect(); if (!r.width) return; const s = Math.min(r.width / W, r.height / H); cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px'; }
      const ro = new ResizeObserver(fit); ro.observe(stage); fit();
      function spawn() {
        const maxLen = 3 + g.level * 2, minLen = g.level > 3 ? 4 : 2;
        const onScreen = new Set(g.words.map(x => x.text[0]));
        let pool = GAME_WORDS.filter(x => x.length <= maxLen && x.length >= minLen && !onScreen.has(x[0]));
        if (!pool.length) pool = GAME_WORDS.filter(x => x.length <= maxLen);
        const text = pick(pool);
        ctx.font = 'bold 15px "Courier New", monospace';
        const tw = ctx.measureText(text).width;
        g.words.push({ text, x: 30 + tw / 2 + Math.random() * (W - 60 - tw), y: -16, vy: 16 + g.level * 8 + Math.random() * 10, ph: Math.random() * 6 });
      }
      const target = () => { if (!g.buf) return null; let best = null; g.words.forEach(x => { if (x.text.startsWith(g.buf) && (!best || x.y > best.y)) best = x; }); return best; };
      function boom(x, y, cols) { for (let i = 0; i < 26; i++) { const a = Math.random() * 6.3, s = 40 + Math.random() * 140; g.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.6 + Math.random() * 0.5, c: pick(cols) }); } }
      function zap(word) {
        g.words.splice(g.words.indexOf(word), 1);
        g.zaps.push({ x: word.x, y: word.y, life: 0.18 });
        boom(word.x, word.y, ['#e10600', '#ffd400', '#fff', '#ff8000']);
        g.score += word.text.length * 10 * g.level; g.zapped++; g.buf = '';
        sfx('zap'); note(880, 0.05, 'square'); setTimeout(() => note(1320, 0.07, 'square'), 50);
        if (g.zapped >= g.level * 8) {
          g.level++; g.zapped = 0; g.banner = `LEVEL ${g.level}!`; g.bannerT = 1.6; sfx('solve');
          if (g.level >= 5) C.secret('wordboss');
        }
        hud();
      }
      function lose(word) {
        g.words.splice(g.words.indexOf(word), 1); g.lives--; g.flash = 0.35;
        boom(word.x, GROUND, ['#3a9a2a', '#8ad84a', '#7a4a1a']);
        sfx('thud'); note(110, 0.2, 'sawtooth');
        if (g.buf && !target()) g.buf = '';
        hud();
        if (g.lives <= 0) gameOver();
      }
      function gameOver() {
        g.running = false; g.over = true;
        const name = store.get('typing_name', '') || (window.Net && Net.me && Net.me.nick) || 'YOU';
        const list = hs(); const entry = { name: name.slice(0, 14), score: g.score, level: g.level, date: today().short };
        list.push(entry); list.sort((a, b) => b.score - a.score); const top = list.slice(0, 5); store.set('typing_hs', top);
        const rank = top.indexOf(entry);
        over.innerHTML = `<div class="ct-t-ovbox"><div class="ct-t-ovt">GAME OVER</div><p>The meteors got you! Score: <b>${g.score}</b> (level ${g.level})</p><table class="ct-t-hs"><tr><th>#</th><th>Name</th><th>Score</th><th>Lvl</th></tr>${top.map((e, i) => `<tr${i === rank ? ' class="me"' : ''}><td>${i + 1}</td><td>${esc(e.name)}</td><td>${e.score}</td><td>${e.level}</td></tr>`).join('')}</table><div class="row" style="justify-content:center"><button class="btn big" type="button" data-a="play">Play Again</button><button class="btn" type="button" data-a="menu">Lessons</button></div></div>`;
        over.classList.add('show');
        over.querySelector('[data-a=play]').addEventListener('click', () => show(game));
        over.querySelector('[data-a=menu]').addEventListener('click', () => show(menu));
        sfx('uhoh');
        status(rank >= 0 ? `Game over! You're number ${rank + 1} on the high score table.` : 'Game over! Have another go.');
      }
      function start() {
        if (g.running || g.over) return;
        g.running = true; over.classList.remove('show'); over.innerHTML = '';
        status('Type the words on the meteors before they land! Esc pauses.');
        sfx('join');
      }
      function draw() {
        ctx.drawImage(bg, 0, 0);
        const tg = target();
        ctx.font = 'bold 15px "Courier New", monospace'; ctx.textBaseline = 'middle';
        g.words.forEach(x => {
          const wob = Math.sin(g.t * 4 + x.ph) * 3;
          drawRows(ctx, SQUIG, Math.round(x.x - 14 + wob), Math.round(x.y - 14), 2);
          const tw = ctx.measureText(x.text).width, bx = Math.round(x.x - tw / 2 - 5), by = Math.round(x.y + 16);
          ctx.fillStyle = x === tg ? '#000080' : 'rgba(0,0,0,.7)'; ctx.fillRect(bx, by, tw + 10, 19);
          ctx.strokeStyle = x === tg ? '#ffd400' : '#808080'; ctx.strokeRect(bx + 0.5, by + 0.5, tw + 9, 18);
          ctx.fillStyle = '#fff'; ctx.fillText(x.text, bx + 5, by + 10);
          if (x === tg) { ctx.fillStyle = '#ffd400'; ctx.fillText(g.buf, bx + 5, by + 10); }
        });
        // Gubbinz with his zapper
        drawRows(ctx, GUB, W / 2 - 24, GROUND - 46, 3);
        ctx.fillStyle = '#555'; ctx.fillRect(W / 2 + 18, GROUND - 22, 14, 5); ctx.fillStyle = '#e10600'; ctx.fillRect(W / 2 + 30, GROUND - 23, 3, 7);
        g.zaps.forEach(z => { ctx.strokeStyle = `rgba(255,${200 + rnd(55)},0,${z.life / 0.18})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W / 2 + 32, GROUND - 20); ctx.lineTo(z.x, z.y); ctx.stroke(); ctx.lineWidth = 1; });
        g.parts.forEach(p => { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 4, 4); });
        if (g.flash > 0) { ctx.fillStyle = `rgba(255,0,0,${g.flash})`; ctx.fillRect(0, 0, W, H); }
        if (g.bannerT > 0) { ctx.font = '40px Bangers, Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(g.banner, W / 2 + 3, 153); ctx.fillStyle = '#ffd400'; ctx.fillText(g.banner, W / 2, 150); ctx.textAlign = 'left'; }
        if (g.paused) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); ctx.font = '40px Bangers, Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('PAUSED', W / 2, H / 2 - 10); ctx.font = '14px Tahoma, sans-serif'; ctx.fillText(g.carry ? 'Press any key to carry on' : 'Press Esc (or click) to carry on', W / 2, H / 2 + 22); ctx.textAlign = 'left'; }
      }
      function frame(ts) {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0); last = ts;
        if (w.el.style.display === 'none') return;
        g.t += dt;
        if (g.running && !g.paused) {
          g.spawnT -= dt;
          if (g.spawnT <= 0) { spawn(); g.spawnT = Math.max(0.7, 2.5 - g.level * 0.25) * (0.8 + Math.random() * 0.4); }
          g.words.slice().forEach(x => { x.y += x.vy * dt; if (x.y >= GROUND - 6) lose(x); });
        }
        g.parts = g.parts.filter(p => (p.life -= dt) > 0); g.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; });
        g.zaps = g.zaps.filter(z => (z.life -= dt) > 0);
        if (g.flash > 0) g.flash = Math.max(0, g.flash - dt);
        if (g.bannerT > 0) g.bannerT -= dt;
        draw();
      }
      over.innerHTML = `<div class="ct-t-ovbox"><div class="ct-t-ovt">METEOR TYPER</div><p>Meteors are falling from the sky with WORDS on them!<br>Type a word to zap that meteor before it lands.</p><p class="small">Esc pauses. Backspace fixes mistakes. Every 8 meteors: next level.</p><button class="btn big" type="button" data-a="go">Start!</button><p class="small ct-t-hsline">${hs().length ? `High score: <b>${hs()[0].score}</b> by ${esc(hs()[0].name)}` : 'No high scores yet!'}</p></div>`;
      if (!g.running) over.classList.add('show');
      over.querySelector('[data-a=go]').addEventListener('click', () => { focusIn(); start(); });
      stage.addEventListener('click', ev => { focusIn(); if (g.paused) { g.paused = false; g.carry = false; } });
      hud();
      raf = requestAnimationFrame(frame);
      status(g.carry ? 'Meteor Typer: your saved game! Press any key to carry on.' : 'Meteor Typer! Press any key or click Start.');
      if (!matchMedia('(hover:none)').matches) setTimeout(focusIn, 50);
      return {
        onChar(ch) {
          if (!g.running) { if (!g.over && ch) start(); return; }
          if (g.paused) { if (g.carry) { g.paused = false; g.carry = false; status('Go go go!'); } return; }
          ch = ch.toLowerCase(); if (!/[a-z]/.test(ch)) { if (ch === ' ') g.buf = ''; hud(); return; }
          const nb = g.buf + ch;
          if (g.words.some(x => x.text.startsWith(nb))) { g.buf = nb; note(700 + nb.length * 60, 0.02, 'square'); const done = g.words.find(x => x.text === nb); if (done) zap(done); }
          else { note(120, 0.08, 'sawtooth'); g.buf = g.words.some(x => x.text.startsWith(ch)) ? ch : ''; }
          hud();
        },
        onBack() { g.buf = g.buf.slice(0, -1); hud(); },
        onKey(ev) {
          if (ev.key === 'Escape') { if (g.running) { g.paused = !g.paused; g.carry = false; status(g.paused ? 'Paused.' : 'Go go go!'); } return true; }
          if (ev.key === 'Enter') { g.buf = ''; hud(); return true; }
          return false;
        },
        stop() { cancelAnimationFrame(raf); ro.disconnect(); },
        save: () => (g.over || !g.running ? null : { view: 'game', g: { words: g.words.map(x => ({ text: x.text, x: x.x, y: x.y, vy: x.vy, ph: x.ph })), score: g.score, level: g.level, lives: g.lives, zapped: g.zapped, spawnT: g.spawnT } }),
      };
    }

    // ---------------------------------------------------------------- menus, navigation, API
    root.querySelector('[data-n=menu]').addEventListener('click', () => show(menu));
    root.querySelector('[data-n=game]').addEventListener('click', () => show(game));
    root.querySelector('[data-n=certs]').addEventListener('click', certsWindow);
    A.menubar(w, [
      ['File', () => [{ label: 'Lesson Menu', act: () => show(menu) }, { label: 'Meteor Typer', act: () => show(game) }, { label: 'My Certificates...', act: certsWindow }, '-', { label: 'Reset Progress...', act: () => Desk.msgbox('Reset Progress', 'Forget all your lesson scores? Gubbinz will pretend he never met you.', 'q', [['Reset', () => { prog = {}; store.set('typing_prog', prog); show(menu); }], ['Cancel']]) }, '-', { label: 'Exit', act: w.close }]],
      ['Lessons', () => LESSONS.map((L, i) => ({ label: `${i + 1}. ${L.name}`, chk: !!(prog[L.id] && prog[L.id].passed), act: () => show(lesson, i) }))],
      ['Options', () => [
        { label: 'Show Keyboard', chk: opts.kb, act: () => { opts.kb = !opts.kb; saveOpts(); view.querySelectorAll('.ct-t-lesson').forEach(e => e.classList.toggle('nokb', !opts.kb)); } },
        { label: 'Gubbinz Tips', chk: opts.tips, act: () => { opts.tips = !opts.tips; saveOpts(); } },
        { label: 'Key Clicks', chk: opts.clicks, act: () => { opts.clicks = !opts.clicks; saveOpts(); } },
      ]],
      ['Help', [
        { label: 'How to Type...', act: () => A.openFile({ name: 'How to Type.txt', type: 'txt', text: `HOW TO TYPE (by Gubbinz)\n========================\n\n1. Sit up straight. Feet on the floor. Not on the desk. MOM.\n2. Put your fingers on the HOME ROW:\n     left hand:  A S D F\n     right hand: J K L ;\n   Feel the little bumps on F and J? That's home.\n3. Each finger has its own keys. The coloured keys on the screen\n   show which finger is which.\n4. Thumbs go on the space bar.\n5. For a capital letter, hold Shift with the OTHER hand.\n6. DON'T LOOK AT THE KEYS. Look at the screen.\n7. Go slow first. Fast comes later. Like Tetris on level 1.\n\nWPM means "words per minute". A word is 5 letters (that's the rule).\nPass mark: 90% right, and the speed it says on the lesson.\n` }) },
        { label: 'About Gubbinz Teaches Typing...', act: () => Desk.msgbox('About Gubbinz Teaches Typing', 'Gubbinz Teaches Typing  version 1.0\n\nTeacher: Gubbinz (types 2 words per minute with 2 fingers)\nLessons: 9\nMeteors zapped in the making of Meteor Typer: loads\n\nThis program is licensed to: the family computer', 'info') },
      ]],
    ]);
    // saved game (js/gamesave.js): a lesson half typed or a Squig Drop game in progress comes back after a refresh or a
    // closed window (lessons passed are kept in typing_prog as before)
    const tsv = A.gameSaver ? A.gameSaver('carta.typing', () => (!cur ? undefined : cur.save ? cur.save() : null), { v: 1, live: true, every: 5000 }).watch(w) : null;
    const tsd = tsv ? tsv.load() : null;
    function take(a) {
      if (!cur && !a && tsd && tsd.view === 'lesson' && LESSONS[tsd.idx]) show(lesson, tsd.idx, tsd);
      else if (!cur && (!a || a === 'game') && tsd && tsd.view === 'game') show(game, tsd);
      else if (a === 'game') show(game);
      else if (a && a.type === 'cert' && a.cert) { if (!cur) show(menu); viewCert(a.cert); }
      else if (!cur) show(menu);
    }
    C.api.typing = { alive: () => !w.closed, take(a) { w.restore(); take(a); } };
    w.cleanup.push(() => { if (cur && cur.stop) cur.stop(); cur = null; });
    take(arg);
  };
})();
