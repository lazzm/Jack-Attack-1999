/* Jack's Mobile: a Talkbrik T-99 pay-as-you-go pocket phone (1999). A 96x64 green-backlit LCD drawn pixel by pixel with its
 * own 3x5 font, rubber keys, a menu, Snake, a ringtone composer (WebAudio), multi-tap AND predictive (T9-style) text, an Inbox
 * of texts from mates and Mom on their 1999 dates, and real texts to other visitors (app/mods/sms.js). Loaded by js/family.js. */
(function () {
  const F = window.Family, A = window.Apps; if (!F || !A) return;
  const store = A.store, esc = A.esc;
  const KEY = 'jhp_family_phone';
  const st = Object.assign({ batt: 100, credit: 50, charging: false, tone: 'classic', keyBeep: true, tones: {}, hi: 0, lvl: 3, tops: {}, dad: false, readS: {}, delS: {}, mode: 'Abc', flat: false }, store.get(KEY, {}));
  const save = () => store.set(KEY, st);
  const pad2 = n => String(n).padStart(2, '0');
  const money = p => '£' + (p / 100).toFixed(2);
  const phoneNumber = v => typeof v === 'string' && /^1999\d{16}$/.test(v);
  const groups = n => String(n).match(/.{1,4}/g) || []; // 1999 8668 1335 / 7239 2969
  let phone = null, phoneRef = '', phoneSerial = 0;
  const phoneOwner = () => window.Net && Net.me.member ? String(Net.me.nick).toLowerCase() : '';
  const privatePhone = () => phone && phone.owner === phoneOwner() ? phone : null;
  function requestPhone() {
    if (!phoneOwner() || !Net.connected) return false;
    phoneRef = 'phone' + (++phoneSerial);
    return Net.send({ t: 'smsPhoneGet', ref: phoneRef });
  }
  function restoreReplies(replies) {
    const sm = F.sms(); let changed = false;
    for (const r of replies || []) {
      const item = sm.inbox.find(x => x.id === r.id);
      if (item && phoneNumber(r.fromPhone) && item.fromPhone !== r.fromPhone) { item.fromPhone = r.fromPhone; changed = true; }
    }
    if (changed) F.saveSms(sm);
  }

  // ================================================================ the 3x5 font (rows as octal digits: 4 = left, 2 = middle, 1 = right)
  const GL = {
    '0': '75557', '1': '26227', '2': '71747', '3': '71317', '4': '55711', '5': '74717', '6': '74757', '7': '71222', '8': '75757', '9': '75717',
    A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57755',
    N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55775', X: '55255', Y: '55222', Z: '71247',
    a: '06357', b: '46556', c: '03443', d: '13553', e: '03743', f: '12722', g: '03536', h: '46555', i: '20222', j: '10152', k: '45665', l: '62227', m: '07775',
    n: '06555', o: '02552', p: '06564', q: '03531', r: '03444', s: '03636', t: '27223', u: '05553', v: '05572', w: '05777', x: '05225', y: '05536', z: '07367',
    ' ': '00000', '.': '00002', ',': '00024', '!': '22202', '?': '71202', "'": '22000', '"': '55000', '-': '00700', '+': '02720', '=': '07070', '/': '11244',
    '(': '24442', ')': '42224', ':': '02020', ';': '02024', '*': '05250', '#': '57575', '£': '34647', '&': '25253', '@': '75747', '%': '51245', '<': '12421',
    '>': '42124', '_': '00007', '[': '64446', ']': '31113', '$': '36236', '^': '25000', '~': '03600', '|': '22222',
  };
  const W = 96, H = 64;

  // ================================================================ sound (own WebAudio context; silent unless the visitor has SFX on)
  let actx = null, master = null;
  function ac() {
    if (!window.Sound || !Sound.on || !Sound.ready) return null;
    if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; actx = new AC(); master = actx.createGain(); master.gain.value = 0.12; master.connect(Sound.output(actx)); }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function beep(f, dur, when, vol) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol || 0.5, t + 0.005); g.gain.setValueAtTime(vol || 0.5, t + Math.max(0.01, dur - 0.02)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  const keyTone = () => { if (st.keyBeep) beep(1400, 0.04, 0, 0.25); };

  // ================================================================ ringtones (classic composer notation: 4c2 = quarter note C octave 2, 8#f1, 4- = rest)
  const PRESETS = {
    classic: ['Talkbrik Classic', 140, '8g1 8b1 8d2 4g2 8f2 8d2 4b1 8c2 8e2 4g2 8- 8g2 8f2 8d2 2g2'],
    tea: ['Tea\'s Ready (Mom)', 120, '4g1 4e2 4c2 2g1 4- 4a1 4f2 4d2 2b1 4- 4g1 4c2 4e2 2.c2'],
    waaagh: ['Wake-Up Alarm', 180, '8c2 8c2 8- 8c2 8#d2 4f2 8- 8f2 8#d2 8c2 4c2 8- 8c2 8#d2 8f2 8g2 2#a2'],
    ode: ['Ode to Joy', 140, '4e2 4e2 4f2 4g2 4g2 4f2 4e2 4d2 4c2 4c2 4d2 4e2 4.e2 8d2 2d2'],
    elise: ['Fur Elise', 125, '8e3 8#d3 8e3 8#d3 8e3 8b2 8d3 8c3 4a2 8- 8c2 8e2 8a2 4b2 8- 8e2 8#g2 8b2 4c3'],
    rag: ['The Entertainer', 160, '16d2 16#d2 16e2 8c3 16e2 8c3 16e2 4.c3 16c3 16d3 16#d3 16e3 16c3 16d3 8e3 16b2 8d3 4c3'],
  };
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const TOK = /^(1|2|4|8|16|32)(\.?)(-|#?[a-g])([1-3]?)$/;
  const parseTune = s => String(s || '').trim().split(/\s+/).filter(t => TOK.test(t));
  const tuneOf = id => PRESETS[id] ? { name: PRESETS[id][0], bpm: PRESETS[id][1], toks: parseTune(PRESETS[id][2]) } : (st.tones[id] ? { name: st.tones[id].name, bpm: st.tones[id].bpm || 125, toks: parseTune(st.tones[id].s) } : null);
  let tuneTimer = null;
  function stopTune() { clearTimeout(tuneTimer); tuneTimer = null; if (actx) { try { master.disconnect(); } catch (e) {} master = actx.createGain(); master.gain.value = 0.12; master.connect(Sound.output(actx)); } }
  function playTune(t, maxSec, onEnd) {
    stopTune();
    if (!t || !t.toks.length) { if (onEnd) onEnd(); return 0; }
    const c = ac(); const beat = 60 / (t.bpm || 125); let at = 0;
    for (const tok of t.toks) {
      const m = TOK.exec(tok); const dur = beat * 4 / +m[1] * (m[2] ? 1.5 : 1);
      if (maxSec && at + dur > maxSec) break;
      if (c && m[3] !== '-') { const semi = NOTE[m[3].replace('#', '')] + (m[3][0] === '#' ? 1 : 0) + 12 * ((+m[4] || 1) - 1); beep(261.63 * Math.pow(2, (semi + 12) / 12), dur * 0.85, at, 0.5); }
      at += dur;
    }
    tuneTimer = setTimeout(() => { tuneTimer = null; if (onEnd) onEnd(); }, at * 1000 + 50);
    return at;
  }

  // ================================================================ predictive text (a small T9-style dictionary)
  const KEYS = { 2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl', 6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz' };
  const L2K = {}; for (const k in KEYS) for (const ch of KEYS[k]) L2K[ch] = k;
  const WORDS = (`i a the to you and it is in of me my be for on at that have not this are with so but do go we get got if can was what all no just your up out there
now he she they like know will see good one time when how love day back well yes yeah ok okay soon home tea ready late come coming going school tonight tomorrow today later call
text phone mobile message please thanks cool wicked brill brilliant great fun game games play playing won win lost hi hello bye night morning mate mates where wer u r ur cu
lol luv pls thx wot dunno gonna wanna sorry miss help mom dad ${['me','mate1','mate2','mate3','mate4','sister'].map(Cast.slug).join(' ')} gran nan bonnie gubbinz ork gorks waaagh grot squig snake pocket critters ultra entertainment
goldenballs kart kaos computer internet website site email cheat cheats level boss best worst ever never always maybe still really very much more some any here who why
which then than them their our us his her him its been had has did does done doing make made take took give gave say said tell told think thought want need look looking
find found keep let put run walk talk bring buy bought pay paid money quid pound pence pocket shop shops town bus car lift pick picking wait waiting meet meeting outside
inside house round park pitch football match goal score team club practice training ready dinner lunch breakfast chips pizza sweets crisps pop drink hungry tired bored busy
free about after again also another away bad big came cant dont wont isnt im ive youre thats whats lets first last long little lot lots man new next nice off old only other
over own right same should something sure though through too under use way while work world year years everyone everything nothing anything someone people thing things
mad mental crazy awesome rubbish boring funny joke laugh laughing happy sad angry scared tired hurt ill sick better worse fine alright amazing epic massive tiny huge
monday tuesday wednesday thursday friday saturday sunday weekend week holiday holidays christmas easter birthday party film video tape telly tv watch watching channel
homework teacher class lesson lessons exam exams test maths english science french history geography art music pe break bell detention trouble
game lad ultra 64 playspace daydream pc disk disc floppy cd modem online offline log logon password secret secrets hidden page pages download upload
dog cat goat horse fish bird pet feed fed clean dirty hungry
red blue green yellow black white pink purple orange brown gold silver
one two three four five six seven eight nine ten hundred thousand million first second third
on in at by up from into onto with without before behind between
intergalactic battles space cadet lightspatula force maul droid pod racer episode
ring rang ringing texted texting sent send sending reply replied answer phone credit top battery charger charge snake ringtone tune
wer r u tea is ready mom gr8 l8r 2nite b4 cya hiya ta ace sound safe skint gutted chuffed knackered`).split(/\s+/).filter(w => /^[a-z]+$/.test(w));
  const T9 = {};
  WORDS.forEach(w => { const k = [...w].map(c => L2K[c]).join(''); (T9[k] = T9[k] || []); if (!T9[k].includes(w)) T9[k].push(w); });
  function t9Words(seq) {
    if (T9[seq]) return T9[seq].slice();
    const pre = Object.keys(T9).filter(k => k.startsWith(seq)).sort((a, b) => a.length - b.length).flatMap(k => T9[k].map(w => w.slice(0, seq.length)));
    const out = [...new Set(pre)];
    return out.length ? out : [[...seq].map(d => KEYS[d] ? KEYS[d][0] : d).join('')];
  }

  // ================================================================ texts from 1999 (scripted; you can't reply to these, they're people in Jack's past)
  const SCRIPT = [
    ['01-01', '{mate1}', 'HAPPY NEW YEAR!!!!! 1999!!!! this is the last 1 before the millenium. we better make it a good 1. {mate1.slug}'],
    ['01-02', 'Mom', 'Is this working? Its Mom. How do I know if you got it. Mom'],
    ['01-02', 'Mom', '{me} ignore the last one I was testing. Love Mom x'],
    ['01-09', '{mate2}', 'u coming footy 2moro? 10am. bring ur ball mine went over the fence AGAIN'],
    ['01-21', 'Mom', 'wer r u? tea is ready - mom'],
    ['02-14', '{mate1}', 'did u get a valentine. i got 1. its from my nan. dont tell anyone'],
    ['02-27', '{mate4}', 'can i borrow 2 quid. ill pay u back monday. {mate4.slug}'],
    ['03-14', 'Mom', 'Thank you for the card and the toast sweetheart. Grey dots are lovely. Love Mom xxx'],
    ['03-20', '{mate3}', 'r u in? i need 2 tell u about my new PC. its a pentium 3. FIVE HUNDRED MEGAHERTZ'],
    ['03-20', '{mate3}', 'u didnt reply. im ringing u'],
    ['04-04', 'Mom', Cast.t('Happy Easter! {sister} has found 9 eggs and says she won. Let her win. Mom x')],
    ['04-10', '{mate1}', 'no oddjob is NOT a rule. u cant make rules up after u lose. {mate1.slug}'],
    ['05-03', 'Mom', 'Your Dad has seen the phone bill. Come home the long way. Mom'],
    ['05-21', 'Mom', Cast.t('{sister.slug} here!!!!! on moms fone. i stroked a GOAT called gerald!!!! {sister.slug}')],
    ['06-04', '{mate2}', '{me.slug} ur goalie 2day. sorry. {mate3.slug} wont do it {mate3.he} says {mate3.he} has 2 save {mate3.his} hands 4 the keyboard'],
    ['06-20', 'Dad', 'THANK YOU FOR THE TOFFEES. HOW DO YOU MAKE IT NOT CAPITALS. DAD'],
    ['06-20', 'Mom', 'Dad has borrowed my phone. Sorry about the shouting. Mom x'],
    ['07-16', '{mate1}', 'EPISODE 1 2NITE!!!!!! 7.15!!!! my dad is driving. bring ur lightspatula (the toy 1)'],
    ['07-16', '{mate1}', 'BEST FILM EVER. podrace!!!!!! dark mole!!!!!! jar jar jams ok maybe not jar jar jams'],
    ['07-24', '{mate4}', 'ive got 20p 4 u. its in 1ps. dont say i never give u anything'],
    ['08-01', '{mate2}', 'hows the caravan. is it raining. its raining here 2'],
    ['08-11', 'Mom', 'DONT look at the sun. Use the glasses. I mean it. Love Mom'],
    ['08-11', '{mate2}', 'did u see it!!!! it went dark at 11 in the MORNING. my cat went mad'],
    ['09-07', 'Mom', Cast.t('Can you pick {sister} up from school at 3.15? Ill be late. Thank you, owe you one. Mom x')],
    ['10-05', '{mate2}', 'POCKET CRITTERS IS OUT!!!!!!! got RED. u got blue yeah? we need 2 trade. link cable at break'],
    ['10-05', '{mate1}', 'i havent got pocket critters. i dont care. its for babys. (wat level is ur zapachu)'],
    ['10-16', '{mate2}', 'u can have ur alakabam back. i was just looking at it. 4 20 mins'],
    ['10-31', 'Mom', 'Remember 9pm at {mate1}s. Your dad will pick you up. Have fun you little Y2K bug x'],
    ['11-05', '{mate3}', 'r u watching the fireworks. my dad set the hedge on fire. its fine. its out now'],
    ['11-27', '{mate2}', 'smash bros at mine. zapachu is unbeatable. bring {mate1.slug}s pad {mate1.he} says {mate1.he}s ill'],
    ['12-01', 'Mom', 'Can you print {sister}s letter to Father Christmas on the computer? She wants it "official". Mom x'],
    ['12-18', 'Mom', 'Stay OUT of the wardrobe. I know it was you. Father Christmas knows too.'],
    ['12-25', '{mate1}', 'MERRY XMAS!!!!! got DK64!!!! wat u get. dont say dk64 aswell'],
    ['12-25', '{mate2}', 'merry xmas {me.slug}. got a link cable 4 xmas so now we have 2. trade 2moro?'],
    ['12-28', '{mate4}', 'merry xmas. we r square now yeah. the keyring was 2 quid. ok we r nearly square'],
    ['12-31', '{mate1}', 'PARTY 7PM!!!! bring ur torch. if the world ends we can see. {mate1.slug}'],
    ['12-31', 'Mom', 'Leaving at half past twelve. AT THE LATEST. Happy New Year love, it\'s been a good one. Mom xxx'],
  ];
  // texts dated since you last looked at the phone (in 1999 days) are new; older ones you've "already read"
  let since = 0;
  const scriptMsgs = () => {
    const md = F.today().md;
    if (!since) { since = Math.min(md, st.seen || md); st.seen = md; save(); }
    return SCRIPT.map((s, i) => ({ id: 's' + i, md: +s[0].replace('-', ''), from: Cast.t(s[1]), text: Cast.t(s[2]), script: true, time: `${8 + (i * 7) % 13}:${pad2((i * 23) % 60)}` }))
      .filter(m => m.md <= md && !st.delS[m.id]).map(m => Object.assign(m, { read: !!st.readS[m.id] || m.md < since }));
  };
  function inbox() {
    const real = F.sms().inbox.map(m => ({ id: m.id, from: m.from, fromNo: m.fromNo, fromPhone: m.fromPhone, text: m.text, real: true, read: m.read, ts: m.ts, time: `${new Date(m.ts).getHours()}:${pad2(new Date(m.ts).getMinutes())}` }));
    const t = F.today();
    return real.sort((a, b) => b.ts - a.ts).map(m => Object.assign(m, { day: `${pad2(t.d)}/${pad2(t.m)}` })).concat(scriptMsgs().sort((a, b) => b.md - a.md).map(m => Object.assign(m, { day: `${pad2(m.md % 100)}/${pad2(Math.floor(m.md / 100))}` })));
  }
  const unread = () => inbox().filter(m => !m.read).length;
  function markRead(m) {
    if (m.script) { st.readS[m.id] = 1; save(); return; }
    const s = F.sms(), x = s.inbox.find(y => y.id === m.id); if (x && !x.read) { x.read = true; F.saveSms(s); }
  }
  function delMsg(m) {
    if (m.script) { st.delS[m.id] = 1; save(); return; }
    const s = F.sms(); s.inbox = s.inbox.filter(y => y.id !== m.id); F.saveSms(s);
  }

  // ================================================================ CSS
  const css = document.createElement('style');
  css.textContent = `.tb-ph{display:flex;flex-direction:column;align-items:center;padding:10px 6px 8px;background:#c0c0c0;touch-action:manipulation}
.tb-body{position:relative;width:236px;padding:18px 16px 18px;border-radius:38px 38px 46px 46px;background:linear-gradient(90deg,#1d2638 0,#3a4a6a 18%,#4a5c80 50%,#3a4a6a 82%,#1d2638 100%);box-shadow:inset 0 2px 0 rgba(255,255,255,.25),inset 0 -3px 0 rgba(0,0,0,.4),3px 4px 0 rgba(0,0,0,.35);user-select:none;-webkit-user-select:none}
.tb-ant{position:absolute;right:30px;top:-26px;width:16px;height:34px;border-radius:7px 7px 2px 2px;background:linear-gradient(90deg,#111,#3a3a3a,#111);border:1px solid #000}
.tb-ear{display:flex;justify-content:center;gap:4px;margin:0 0 6px}.tb-ear i{width:5px;height:5px;border-radius:50%;background:#0b0f18;box-shadow:inset 0 1px 1px #000}
.tb-brand{text-align:center;font:bold italic 12px Arial,Helvetica,sans-serif;letter-spacing:3px;color:#c8d0e0;text-shadow:0 1px 0 #000;margin-bottom:6px}
.tb-face{padding:7px;border-radius:10px 10px 18px 18px;background:#0e121a;box-shadow:inset 0 2px 4px #000}
.tb-lcd{display:block;width:192px;height:128px;margin:0 auto;image-rendering:pixelated;image-rendering:crisp-edges;border-radius:3px;background:#7ea040;box-shadow:inset 0 0 12px rgba(0,0,0,.45);transition:filter .4s}
.tb-lcd.lit{filter:brightness(1.18) saturate(1.1)}
.tb-model{display:flex;justify-content:space-between;font:9px Arial,sans-serif;color:#7d8aa8;margin:3px 4px 0}
.tb-nav{display:grid;grid-template-columns:44px 1fr 44px;gap:8px;align-items:center;margin:10px 4px 8px}
.tb-k{position:relative;border:0;border-radius:12px;background:radial-gradient(ellipse at 50% 30%,#f2f2f2,#cfcfcf 60%,#9a9a9a);box-shadow:0 3px 0 #2a2a2a,inset 0 -2px 2px rgba(0,0,0,.25);font:bold 15px Arial,Helvetica,sans-serif;color:#1a1a1a;cursor:pointer;padding:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.tb-k:active,.tb-k.dn{transform:translateY(2px);box-shadow:0 1px 0 #2a2a2a,inset 0 2px 3px rgba(0,0,0,.35)}
.tb-k small{display:block;font:bold 8px Arial,sans-serif;color:#555;letter-spacing:1px;margin-top:1px}
.tb-sel{height:36px;border-radius:18px 18px 22px 22px;background:radial-gradient(ellipse at 50% 30%,#ffffff,#d8d8d8 60%,#9a9a9a)}
.tb-sel:after{content:"";position:absolute;left:50%;top:50%;width:26px;height:4px;margin:-2px 0 0 -13px;border-radius:2px;background:#555}
.tb-c{height:30px;border-radius:50%}
.tb-ud{display:flex;flex-direction:column;gap:5px}.tb-ud .tb-k{height:16px;border-radius:9px;font-size:9px;line-height:16px}
.tb-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:7px 9px;margin:0 6px}
.tb-pad .tb-k{height:34px;border-radius:14px 14px 17px 17px;line-height:1}
.tb-mic{width:22px;height:3px;margin:12px auto 0;border-radius:2px;background:#0b0f18}
.tb-side{display:flex;gap:6px;align-items:center;justify-content:center;margin-top:10px;flex-wrap:wrap}
.tb-side .btn{min-width:0}
.tb-plug.on{font-weight:bold}
.tb-help{font:11px Tahoma,sans-serif;color:#333;text-align:center;max-width:250px;margin-top:6px}
@media (max-width:420px){.tb-body{transform-origin:top center}}`;
  document.head.appendChild(css);

  // ================================================================ the phone
  let P = null; // the open phone
  function isOpen() { return !!(P && !P.w.closed); }

  function open(arg) {
    if (isOpen()) { P.w.restore(); return P.w; }
    requestPhone();
    const b = document.createElement('div'); b.className = 'tb-ph';
    const key = (k, big, small, cls) => `<button type="button" class="tb-k${cls ? ' ' + cls : ''}" data-k="${k}" aria-label="${esc(small ? big + ' ' + small : big)}">${big}${small != null ? `<small>${small || '&nbsp;'}</small>` : ''}</button>`;
    b.innerHTML = `<div class="tb-body"><div class="tb-ant"></div><div class="tb-ear"><i></i><i></i><i></i><i></i><i></i></div><div class="tb-brand">TALKBRIK</div>
      <div class="tb-face"><canvas class="tb-lcd" width="${W}" height="${H}" aria-label="Phone screen" role="img"></canvas><div class="tb-model"><span>T-99</span><span>DUAL BAND*</span></div></div>
      <div class="tb-nav">${key('c', 'C', null, 'tb-c')}<button type="button" class="tb-k tb-sel" data-k="sel" aria-label="Menu / Select"></button><div class="tb-ud">${key('up', '&#9650;', null)}${key('down', '&#9660;', null)}</div></div>
      <div class="tb-pad">${key('1', '1', 'o_o')}${key('2', '2', 'ABC')}${key('3', '3', 'DEF')}${key('4', '4', 'GHI')}${key('5', '5', 'JKL')}${key('6', '6', 'MNO')}${key('7', '7', 'PQRS')}${key('8', '8', 'TUV')}${key('9', '9', 'WXYZ')}${key('*', '*', '+')}${key('0', '0', '_')}${key('#', '#', 'aA')}</div>
      <div class="tb-mic"></div></div>
      <div class="tb-side"><button type="button" class="btn tb-plug">Plug in charger</button><button type="button" class="btn tb-hlp">How to use</button></div>`;
    const w = A.win(Cast.t("{me}'s Mobile"), b, { w: 290, noResize: true, noMax: true, icon: F.icons.PHONE32, onClose: () => { stopAll(); } });
    const cv = b.querySelector('canvas'), g = cv.getContext('2d'), img = g.createImageData(W, H), buf = new Uint8Array(W * H);
    P = { w, b, cv, stack: [], timer: null, lit: 0 };
    // ---- drawing
    const clr = () => buf.fill(0);
    const px = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = v === undefined ? 1 : v; };
    const rect = (x, y, w2, h2, v) => { for (let j = 0; j < h2; j++) for (let i = 0; i < w2; i++) px(x + i, y + j, v); };
    const box = (x, y, w2, h2) => { for (let i = 0; i < w2; i++) { px(x + i, y); px(x + i, y + h2 - 1); } for (let j = 0; j < h2; j++) { px(x, y + j); px(x + w2 - 1, y + j); } };
    function text(x, y, s, v, sc) {
      sc = sc || 1; v = v === undefined ? 1 : v;
      for (const ch of String(s)) {
        const gl = GL[ch] || GL['?'];
        for (let r = 0; r < 5; r++) { const bits = +gl[r]; for (let cc = 0; cc < 3; cc++) if (bits & (4 >> cc)) rect(x + cc * sc, y + r * sc, sc, sc, v); }
        x += 4 * sc;
      }
      return x;
    }
    const tw = (s, sc) => String(s).length * 4 * (sc || 1) - (sc || 1);
    const ctext = (y, s, v, sc) => text(Math.floor((W - tw(s, sc)) / 2), y, s, v, sc);
    function wrap(s, n) { const out = []; String(s).split('\n').forEach(par => { let line = ''; par.split(' ').forEach(word => { while (word.length > n) { if (line) { out.push(line); line = ''; } out.push(word.slice(0, n)); word = word.slice(n); } if ((line ? line + ' ' + word : word).length > n) { out.push(line); line = word; } else line = line ? line + ' ' + word : word; }); out.push(line); }); return out; }
    const bmp = (x, y, rows) => rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') px(x + i, y + j); }));
    function flush() {
      const on = [24, 40, 12], off = P.lit ? [160, 204, 92] : [128, 166, 70];
      for (let i = 0; i < W * H; i++) { const c = buf[i] ? on : off, j = i * 4; img.data[j] = c[0]; img.data[j + 1] = c[1]; img.data[j + 2] = c[2]; img.data[j + 3] = 255; }
      g.putImageData(img, 0, 0);
    }
    function battBars(x, y) { const n = st.charging ? (Math.floor(Date.now() / 400) % 5) : Math.ceil(st.batt / 25); for (let i = 0; i < 4; i++) if (i < n) rect(x, y + 12 - i * 4, 3 + i, 3); rect(x + 1, y - 3, 2, 2); }
    function header(title, right) { text(1, 1, title.slice(0, 18)); if (right) text(W - tw(right) - 1, 1, right); for (let i = 0; i < W; i++) px(i, 7); }
    const soft = s => { ctext(H - 6, s); };
    P.draw = () => { if (w.closed) return; clr(); const s = top(); if (st.batt <= 0 && !(s && s.id === 'off')) { offScreen(); } else if (s) s.draw(); if (P.pop) drawPop(); flush(); };
    // ---- screens
    const top = () => P.stack[P.stack.length - 1];
    const push = s => { P.stack.push(s); if (s.enter) s.enter(); P.draw(); };
    const pop = () => { const s = P.stack.pop(); if (s && s.leave) s.leave(); if (!P.stack.length) P.stack.push(idle); P.draw(); };
    const home = () => { while (P.stack.length > 1) { const s = P.stack.pop(); if (s.leave) s.leave(); } P.draw(); };
    function popup(lines, ms, then) { if (P.pop) dismiss(); P.pop = { lines: [].concat(lines), until: Date.now() + (ms || 1600), then }; P.draw(); clearTimeout(P.popT); P.popT = setTimeout(dismiss, ms || 1600); }
    function dismiss() { clearTimeout(P.popT); const p = P.pop; P.pop = null; if (p && p.then) p.then(); if (!w.closed) P.draw(); }
    function drawPop() {
      const L = P.pop.lines.flatMap(l => wrap(l, 20)).slice(0, 5), h = L.length * 7 + 7, y = Math.floor((H - h) / 2);
      rect(3, y, W - 6, h, 0); box(3, y, W - 6, h); box(4, y + 1, W - 8, h - 2);
      L.forEach((l, i) => ctext(y + 4 + i * 7, l));
    }
    // generic list screen: items = [{label, act, right, dis}] (or a function returning them)
    function list(title, items, o) {
      o = o || {};
      const s = { id: o.id || 'list', i: o.start || 0, off: 0 };
      const get = () => typeof items === 'function' ? items() : items;
      s.draw = () => {
        const it = get(); if (s.i >= it.length) s.i = Math.max(0, it.length - 1);
        header(title, it.length ? `${s.i + 1}/${it.length}` : '');
        const rows = 6; if (s.i < s.off) s.off = s.i; if (s.i >= s.off + rows) s.off = s.i - rows + 1;
        if (!it.length) ctext(26, o.empty || '(empty)');
        it.slice(s.off, s.off + rows).forEach((x, j) => {
          const y = 9 + j * 7, sel = s.off + j === s.i;
          if (sel) rect(0, y - 1, W - 4, 7, 1);
          text(2, y, String(x.label).slice(0, x.right ? 22 - String(x.right).length - 1 : 22), sel ? 0 : 1);
          if (x.right) text(W - 5 - tw(x.right), y, x.right, sel ? 0 : 1);
        });
        if (it.length > rows) { const sh = Math.max(4, Math.floor(49 * rows / it.length)), sy = 9 + Math.floor((49 - sh) * s.off / Math.max(1, it.length - rows)); for (let y = 9; y < 58; y++) px(W - 2, y); rect(W - 3, sy, 3, sh); }
        soft(o.soft || 'Select');
      };
      s.key = k => {
        const it = get();
        if (k === 'up') s.i = (s.i - 1 + it.length) % Math.max(1, it.length);
        else if (k === 'down') s.i = (s.i + 1) % Math.max(1, it.length);
        else if (k === 'sel') { const x = it[s.i]; if (x && x.act) x.act(x, s); }
        else if (k === 'c') pop();
        else if (/^[1-9]$/.test(k) && it[+k - 1] && o.numbers !== false) { s.i = +k - 1; const x = it[s.i]; if (x.act) x.act(x, s); }
        P.draw();
      };
      return s;
    }
    // ---- idle screen
    const idle = { id: 'idle' };
    idle.draw = () => {
      for (let i = 0; i < 5; i++) if (i < 4) rect(1, 34 - i * 6, 2 + Math.floor(i / 2), 4); // signal
      battBars(W - 7, 22);
      const d = new Date(); text(W - tw(`${d.getHours()}:${pad2(d.getMinutes())}`) - 1, 1, `${d.getHours()}:${pad2(d.getMinutes())}`);
      const t = F.today(); text(1, 1, `${pad2(t.d)}/${pad2(t.m)}/99`);
      ctext(12, 'JACKNET', 1, 2);
      ctext(25, 'MOBILE');
      const n = unread();
      if (n) { bmp(30, 34, ['#########', '##.....##', '#.#...#.#', '#..#.#..#', '#...#...#', '#########']); text(42, 35, `${n} msg${n > 1 ? 's' : ''}`); }
      else ctext(36, st.credit < 10 ? 'Top up!' : `Credit ${money(st.credit)}`);
      soft(n ? 'Read' : 'Menu');
    };
    idle.key = k => {
      if (k === 'sel') { if (unread()) push(inboxScreen()); else push(menu()); }
      else if (k === 'up') push(inboxScreen());
      else if (k === 'down') push(snakeMenu());
      else if (/^[0-9]$/.test(k)) { push(editor('', k)); }
      P.draw();
    };
    // ---- main menu: one big icon at a time
    const ICONS = {
      msg: ['####################', '##................##', '#.#..............#.#', '#..#............#..#', '#...#..........#...#', '#....#........#....#', '#.....#......#.....#', '#......##..##......#', '#........##........#', '#..................#', '####################'],
      snake: ['..........####......', '.........#.#..#.....', '.........######.....', '..............##....', '.####..........##...', '#....#.........##...', '#.....##......##....', '.#......######......', '..##................', '....###........#....', '.......#######......'],
      tune: ['.......#########', '.......#########', '.......#.......#', '.......#.......#', '.......#.......#', '.......#.......#', '..######...#####', '.#######..######', '.######...#####.', '..####.....###..'],
      credit: ['....######....', '..##......##..', '.#...####...#.', '#...#....#...#', '#...#........#', '#..#####.....#', '#...#........#', '#...#........#', '#..#######...#', '.#..........#.', '..##......##..', '....######....'],
      tools: ['..##........##..', '.#..#......#..#.', '#....#....#....#', '#....#....#....#', '.#..#.####.#..#.', '..##.##..##.##..', '.....#....#.....', '.....#....#.....', '.....#....#.....', '.....##..##.....', '......####......'],
    };
    function menu() {
      const items = [['Messages', 'msg', () => push(msgMenu())], ['Snake', 'snake', () => push(snakeMenu())], ['Composer', 'tune', () => push(composerMenu())], ['Credit', 'credit', () => push(creditMenu())], ['Settings', 'tools', () => push(settingsMenu())]];
      const s = { id: 'menu', i: 0 };
      s.draw = () => {
        const [name, ic] = items[s.i];
        text(1, 1, name); text(W - tw(String(s.i + 1)) - 4, 1, String(s.i + 1));
        for (let y = 8; y < 58; y++) px(W - 2, y); const sh = Math.floor(50 / items.length); rect(W - 3, 8 + s.i * sh, 3, sh);
        const icon = ICONS[ic]; bmp(Math.floor((W - icon[0].length * 2) / 2), 16, icon.flatMap(r => [r.replace(/./g, c => c + c), r.replace(/./g, c => c + c)]).map(r => r));
        soft('Select');
      };
      s.key = k => {
        if (k === 'up') s.i = (s.i - 1 + items.length) % items.length;
        else if (k === 'down') s.i = (s.i + 1) % items.length;
        else if (k === 'sel') items[s.i][2]();
        else if (k === 'c') pop();
        else if (/^[1-5]$/.test(k)) { s.i = +k - 1; items[s.i][2](); }
        P.draw();
      };
      return s;
    }
    // ---- messages
    const msgMenu = () => list('Messages', () => [
      { label: 'Write message', act: () => push(editor('')) },
      { label: 'Inbox', right: unread() ? String(unread()) : '', act: () => push(inboxScreen()) },
      { label: 'Sent items', act: () => push(sentScreen()) },
      { label: 'Phonebook', act: () => push(phonebook()) },
      { label: 'My number', act: () => { requestPhone(); push(myNumber()); } },
    ]);
    const inboxScreen = () => list('Inbox', () => inbox().map(m => ({ label: (m.read ? ' ' : '*') + m.from, right: m.day, m, act: x => push(reader(x.m)) })), { empty: 'No messages', numbers: false });
    const sentScreen = () => list('Sent items', () => F.sms().sent.slice().reverse().map(m => ({ label: m.to, right: m.status === 'delivered' ? 'Dlvd' : 'Sent', m, act: x => push(reader({ from: 'To ' + x.m.to, text: x.m.text, sent: true, time: new Date(x.m.ts).getHours() + ':' + pad2(new Date(x.m.ts).getMinutes()), day: x.m.status === 'delivered' ? 'Delivered' : (x.m.queued ? 'Waiting' : 'Sent') })) })), { empty: 'No sent items', numbers: false });
    function reader(m) {
      markRead(m);
      const s = { id: 'read', off: 0 };
      const lines = () => [m.from, `${m.day || ''} ${m.time || ''}`.trim(), ''].concat(wrap(m.text, 23));
      s.draw = () => {
        const L = lines(); L.slice(s.off, s.off + 8).forEach((l, i) => { if (s.off + i === 0) { rect(0, 0, W, 7, 1); text(1, 1, l.slice(0, 23), 0); } else text(1, 1 + i * 7, l); });
        if (L.length > 8) { for (let y = 0; y < 57; y++) px(W - 1, y); }
        soft(m.sent ? 'Back' : 'Options');
      };
      s.key = k => {
        const L = lines();
        if (k === 'down') s.off = Math.min(Math.max(0, L.length - 8), s.off + 1);
        else if (k === 'up') s.off = Math.max(0, s.off - 1);
        else if (k === 'c' || (k === 'sel' && m.sent)) pop();
        else if (k === 'sel') push(list('Options', () => [
          m.real ? { label: 'Reply', act: () => { const current = F.sms().inbox.find(x => x.id === m.id) || m; if (!phoneNumber(current.fromPhone)) return popup(['Old message.', 'Ask your friend for', 'their JackNet number.'], 2600); pop(); push(editor('', null, { to: current.fromPhone, toName: m.from })); } } : { label: 'Reply', act: () => popup(m.from === 'Mom' ? ['Not allowed!', 'That number is', 'Mom\'s in 1999.', 'Ring her instead.'] : ['Cannot reply.', 'This text is from', '1999. You can only', 'text real people!'], 2600) },
          m.real ? { label: 'Block sender', act: () => { const sm = F.sms(); const n = String(m.from).toLowerCase(); if (!sm.blocked.includes(n)) sm.blocked.push(n); F.saveSms(sm); popup(['Blocked:', m.from], 1600, () => { pop(); }); } } : null,
          { label: 'Delete', act: () => { delMsg(m); popup('Deleted', 1000, () => { pop(); pop(); }); } },
        ].filter(Boolean)));
        P.draw();
      };
      return s;
    }
    function myNumber() {
      return { id: 'myNumber', draw() {
        header('My number');
        const mine = privatePhone();
        if (mine) { const g = groups(mine.number); ctext(13, 'JACKNET ONLY'); ctext(22, g.slice(0, 3).join(' ')); ctext(30, g.slice(3).join(' ')); ctext(39, 'Share with friends.'); ctext(47, 'Keep it private.'); }
        else { ctext(22, 'Waiting for network.'); ctext(34, 'Select to retry.'); }
        soft('Back');
      }, key(k) { if (k === 'c') pop(); else if (k === 'sel') requestPhone(); P.draw(); } };
    }
    function phonebook(body) {
      return list('Phonebook', () => [{ label: 'Add contact', act: () => editContact() }].concat((privatePhone()?.contacts || []).map(c => ({ label: c.name, act: () => {
        if (body != null) { pop(); sendText(body, c.number, c.name); }
        else push(list(c.name, [
          { label: 'Write message', act: () => push(editor('', null, { to: c.number, toName: c.name })) },
          { label: 'View number', act: () => { const g = groups(c.number); popup([c.name, g.slice(0, 3).join(' '), g.slice(3).join(' ')], 4000); } },
          { label: 'Edit contact', act: () => editContact(c) },
          { label: 'Delete contact', act: () => push(list('Delete contact?', [
            { label: 'Keep contact', act: () => pop() },
            { label: 'Delete', act: () => contactAction({ t: 'smsContactDelete', id: c.id }, () => { pop(); pop(); }) },
          ])) },
        ]));
      } }))), { numbers: false });
    }
    function editContact(c) {
      push(editor(c ? c.name : '', null, { title: 'Contact name', max: 22, soft: 'Next', onDone: name => {
        if (!name) return popup('Enter a name', 1200);
        push(editor(c ? c.number : '', null, { title: 'JackNet number', numeric: true, max: 20, soft: 'Save', onDone: number => {
          if (!phoneNumber(number)) return popup(['Enter the shared', '20-digit number.'], 1800);
          contactAction({ t: 'smsContactSave', id: c ? c.id : '', name, number }, () => { pop(); pop(); if (c) pop(); });
        } }));
      } }));
    }
    function contactAction(message, done) {
      if (!privatePhone() || !window.Net || !Net.connected) return popup(['No network.', 'Open My number', 'and try again.'], 2000);
      if (Object.keys(contactWait).length) return;
      const ref = 'contact' + (++phoneSerial), origin = top();
      const timer = setTimeout(() => { if (contactWait[ref]) { delete contactWait[ref]; if (!w.closed) popup('Network busy. Retry.', 1800); } }, 9000);
      contactWait[ref] = m => { clearTimeout(timer); if (w.closed) return; if (!m.ok) return popup(m.err || 'Contact unavailable.', 2200); if (top() === origin) done(); popup('Phonebook saved', 1200); };
      Net.send(Object.assign({ ref }, message));
    }
    const contactWait = {};
    // ---- the text editor: multi-tap, T9 predictive, 123
    const MT = { 1: '.,?!\'-1@:', 2: 'abc2', 3: 'def3', 4: 'ghi4', 5: 'jkl5', 6: 'mno6', 7: 'pqrs7', 8: 'tuv8', 9: 'wxyz9', 0: ' 0' };
    const MODES = ['Abc', 'abc', 'ABC', '123', 'T9'];
    function editor(initial, firstKey, o) {
      o = o || {};
      const s = { id: 'edit', text: initial || '', mt: null, t9: null, max: o.max || 160, mode: o.numeric ? '123' : (o.mode || st.mode || 'Abc') };
      const capNext = () => /(^|[.!?]\s+)$/.test(s.text);
      const casefix = ch => s.mode === 'ABC' ? ch.toUpperCase() : (s.mode === 'Abc' || s.mode === 'T9') && capNext() ? ch.toUpperCase() : ch;
      const commitMT = () => { if (s.mt) { clearTimeout(s.mt.t); s.mt = null; } };
      const t9word = () => s.t9 ? s.t9.words[s.t9.i] : '';
      const commitT9 = () => { if (!s.t9) return; let wd = t9word(); if (capNext()) wd = wd.charAt(0).toUpperCase() + wd.slice(1); s.text += wd; if (s.t9.seq.length >= 3 && T9[s.t9.seq] && T9[s.t9.seq].includes(t9word())) A.secret('fam.t9'); s.t9 = null; };
      const full = () => s.text + (s.t9 ? t9word() : '');
      const room = () => s.max - full().length;
      s.draw = () => {
        text(1, 1, o.title || (s.mode === 'T9' ? 'T9 ' + (capNext() ? 'Abc' : 'abc') : s.mode));
        const r = String(room()); text(W - tw(r) - 1, 1, r);
        if (o.to) { const t = 'To:' + (o.toName || o.to); text(Math.max(22, Math.floor((W - tw(t)) / 2)), 1, t.slice(0, 13)); }
        for (let i = 0; i < W; i++) px(i, 7);
        const body = full(), lines = wrap(body + '\u0001', 23).map(l => l.replace('\u0001', '')), view = lines.slice(-6);
        const cur = Math.floor(Date.now() / 450) % 2 === 0;
        view.forEach((l, i) => { text(1, 9 + i * 7, l); });
        // the word being guessed (T9) or the letter being tapped is underlined, then the cursor
        const lastLine = view[view.length - 1] || '', ly = 9 + (view.length - 1) * 7;
        if (s.t9) { const wl = t9word().length, x0 = 1 + (lastLine.length - wl) * 4; for (let x = x0; x < x0 + wl * 4 - 1; x++) px(x, ly + 6); }
        if (s.mt) { const x0 = 1 + (lastLine.length - 1) * 4; for (let x = x0; x < x0 + 3; x++) px(x, ly + 6); }
        if (cur && !s.mt) rect(1 + lastLine.length * 4, ly, 1, 5);
        soft(o.soft || 'Options');
      };
      s.blink = setInterval(() => { if (top() === s) P.draw(); }, 450);
      s.leave = () => { clearInterval(s.blink); commitMT(); };
      function press(k) {
        if (k === '#') { commitMT(); commitT9(); if (!o.numeric) { s.mode = MODES[(MODES.indexOf(s.mode) + 1) % MODES.length]; if (!o.title) { st.mode = s.mode; save(); } popup(s.mode === 'T9' ? ['Predictive text', 'ON'] : s.mode === '123' ? 'Numbers' : s.mode, 700); } return; }
        if (s.mode === '123' || o.numeric) { commitT9(); if ((o.numeric ? /^[0-9]$/ : /^[0-9*]$/).test(k) && room() > 0) s.text += k === '*' ? '+' : k; return; }
        if (s.mode === 'T9') {
          if (/^[2-9]$/.test(k)) { if (room() <= 0) return; const seq = (s.t9 ? s.t9.seq : '') + k; s.t9 = { seq, words: t9Words(seq), i: 0 }; return; }
          if (k === '*') { if (s.t9) s.t9.i = (s.t9.i + 1) % s.t9.words.length; else s.text += '*'; return; }
          if (k === '0') { commitT9(); if (room() > 0) s.text += ' '; return; }
          if (k === '1') { commitT9(); if (/[.,?!]$/.test(s.text)) { const P1 = '.,?!'; s.text = s.text.slice(0, -1) + P1[(P1.indexOf(s.text.slice(-1)) + 1) % P1.length]; } else if (room() > 0) s.text += '.'; return; }
          return;
        }
        // multi-tap
        if (k === '*') { commitMT(); if (room() > 0) s.text += '*'; return; }
        const set = MT[k]; if (!set) return;
        if (s.mt && s.mt.k === k) { s.mt.i = (s.mt.i + 1) % set.length; s.text = s.text.slice(0, -1) + casefix(set[s.mt.i]); }
        else { commitMT(); if (room() <= 0) return; s.text += casefix(set[0]); s.mt = { k, i: 0 }; }
        clearTimeout(s.mt.t); s.mt.t = setTimeout(() => { s.mt = null; if (top() === s) P.draw(); }, 900);
      }
      s.typed = ch => { // a real keyboard: just type
        commitMT(); commitT9();
        if (o.numeric && !/^[0-9]$/.test(ch)) return;
        if (room() > 0) s.text += ch;
        P.draw();
      };
      s.key = k => {
        if (/^[0-9*#]$/.test(k)) press(k);
        else if (k === 'c') {
          if (s.t9) { s.t9.seq = s.t9.seq.slice(0, -1); if (!s.t9.seq) s.t9 = null; else { s.t9.words = t9Words(s.t9.seq); s.t9.i = 0; } }
          else if (s.mt) { s.text = s.text.slice(0, -1); commitMT(); }
          else if (s.text) s.text = s.text.slice(0, -1);
          else pop();
        }
        else if (k === 'clearall') { s.t9 = null; commitMT(); s.text = ''; }
        else if (k === 'up' && s.t9) { s.t9.i = (s.t9.i - 1 + s.t9.words.length) % s.t9.words.length; }
        else if (k === 'down' && s.t9) { s.t9.i = (s.t9.i + 1) % s.t9.words.length; }
        else if (k === 'sel') {
          commitMT(); commitT9();
          if (o.onDone) return o.onDone(s.text.trim());
          const body = s.text.trim();
          push(list('Options', [
            { label: 'Send', act: () => { if (!body) return popup('Message empty', 1200); pop(); if (o.to) { sendText(body, o.to, o.toName); } else push(recipients(body)); } },
            { label: 'Predictive text', right: s.mode === 'T9' ? 'On' : 'Off', act: () => { s.mode = s.mode === 'T9' ? 'Abc' : 'T9'; st.mode = s.mode; save(); pop(); } },
            { label: 'Clear text', act: () => { s.text = ''; pop(); } },
            { label: 'Exit editor', act: () => { pop(); pop(); } },
          ]));
          return;
        }
        P.draw();
      };
      if (firstKey) press(firstKey);
      return s;
    }
    function recipients(body) {
      return list('Send to', [
        { label: 'Enter shared number', act: () => { pop(); push(editor('', null, { numeric: true, title: 'JackNet number', soft: 'Send', max: 20, onDone: v => { if (!phoneNumber(v)) return popup(['Enter the shared', '20-digit number.'], 1800); pop(); sendText(body, v, v); } })); } },
        { label: 'Phonebook', act: () => { pop(); push(phonebook(body)); } },
      ], { numbers: false });
    }
    // ---- sending (10p a text, pay as you go)
    let ref = 0; const waiting = {};
    function sendText(body, to, toName) {
      if (!phoneNumber(to)) return popup(['Enter a shared', 'JackNet number.'], 1800);
      if (st.credit < 10) { popup(['Insufficient', 'credit. Please', 'top up your phone.', `Balance ${money(st.credit)}`], 2600); return; }
      if (!window.Net || !Net.connected) { popup(['No network', 'coverage.', 'Message failed.'], 2000); return; }
      if (window.Guest && Guest.is()) { Guest.need('Sending text messages', () => sendText(body, to, toName)); return; }
      const id = 'r' + (++ref) + Date.now().toString(36);
      Net.send({ t: 'smsSend', to, text: body, ref: id });
      const s = { id: 'sending', f: 0 };
      s.draw = () => { ctext(10, 'Sending'); ctext(17, 'message'); const x = 10 + (s.f * 5) % 70; bmp(x, 30, ['#########', '##.....##', '#.#...#.#', '#..#.#..#', '#...#...#', '#########']); for (let i = 0; i < 3; i++) if ((s.f + i) % 3 === 0) px(x - 4 - i * 3, 33); };
      s.key = () => {};
      push(s);
      const anim = setInterval(() => { s.f++; if (top() === s) P.draw(); }, 120);
      s.leave = () => clearInterval(anim);
      waiting[id] = m => {
        clearInterval(anim); if (w.closed) return; if (top() === s) pop();
        if (!m) return popup(['Message', 'sending failed.', 'Try again later.'], 2200);
        if (!m.ok) return popup(['Message failed:', m.err || 'Unknown error'], 3200);
        st.credit -= 10; st.batt = Math.max(0, st.batt - 0.5); save();
        const sm = F.sms(); sm.sent.push({ id: m.id, to: toName || m.to, text: body, ts: Date.now(), status: 'sent', queued: !!m.queued }); F.saveSms(sm);
        A.secret('fam.text');
        popup(['Message sent', m.queued ? '(they\'re offline,' : '', m.queued ? 'they\'ll get it later)' : '', `Credit ${money(st.credit)}`].filter(Boolean), 2200, () => home());
      };
      setTimeout(() => { if (waiting[id]) { const f = waiting[id]; delete waiting[id]; f(null); } }, 9000);
    }
    P.net = m => {
      if (m.t === 'smsContactResult' && contactWait[m.ref]) { const f = contactWait[m.ref]; delete contactWait[m.ref]; f(m); }
      if (m.t === 'smsSent' && waiting[m.ref]) { const f = waiting[m.ref]; delete waiting[m.ref]; f(m); }
      if (m.t === 'smsDelivered') { const wait = P.pop ? Math.max(0, P.pop.until - Date.now()) + 150 : 0; setTimeout(() => { if (!w.closed) popup(['Delivered:', m.to || ''], 1800); }, wait); }
    };
    P.resetPrivate = () => { for (const id of Object.keys(contactWait)) delete contactWait[id]; for (const id of Object.keys(waiting)) delete waiting[id]; clearTimeout(P.popT); P.pop = null; home(); P.draw(); };
    P.incoming = it => {
      backlight();
      const t = tuneOf(st.tone) || tuneOf('classic');
      playTune(t, 4);
      popup(['1 message', 'received', 'from ' + it.from], 2600);
      P.draw();
    };
    // ---- Snake
    function snakeMenu() {
      return list('Snake', () => [
        { label: 'New game', act: () => push(snake()) },
        ...(window.MP ? [{ label: '2 players (link)', act: () => MP.pick('phone.snake2') }] : []),
        { label: 'Level', right: String(st.lvl), act: () => { st.lvl = st.lvl % 9 + 1; save(); } },
        { label: 'Top score', right: String(st.hi), act: () => popup(['Top score:', String(st.hi), st.hi >= 211 ? 'Beat the house best!' : 'House best: 211'], 2000) },
        { label: 'Instructions', act: () => popup(['2 4 6 8 or arrows', 'to steer. Eat the', 'dots. Don\'t bite', 'yourself or a wall!'], 3500) },
      ]);
    }
    function snake() {
      const C = 3, X0 = 1, Y0 = 9, CW = 31, CH = 17, SPD = [0, 280, 240, 200, 170, 140, 115, 95, 75, 55];
      const s = { id: 'snake', body: [], dir: [1, 0], q: [], food: null, bug: null, eaten: 0, score: 0, dead: 0, paused: false };
      for (let i = 5; i >= 0; i--) s.body.push([4 + i, 9]);
      const free = () => { for (let n = 0; n < 500; n++) { const p = [Math.floor(Math.random() * CW), Math.floor(Math.random() * CH)]; if (!s.body.some(b => b[0] === p[0] && b[1] === p[1]) && !(s.bug && s.bug.c.some(b => b[0] === p[0] && b[1] === p[1]))) return p; } return [0, 0]; };
      s.food = free();
      const cell = (c, f) => { const x = X0 + 1 + c[0] * C, y = Y0 + 1 + c[1] * C; f(x, y); };
      s.draw = () => {
        text(1, 1, String(s.score).padStart(4, '0')); text(W - tw('L' + st.lvl) - 1, 1, 'L' + st.lvl);
        if (s.bug) text(36, 1, String(s.bug.t).padStart(2, '0'));
        box(X0, Y0, CW * C + 2, CH * C + 2);
        if (!(s.dead && Math.floor(s.dead / 3) % 2)) s.body.forEach((c, i) => cell(c, (x, y) => { rect(x, y, 3, 3); if (i === 0) px(x + 1, y + 1, 0); }));
        cell(s.food, (x, y) => { px(x + 1, y); px(x, y + 1); px(x + 2, y + 1); px(x + 1, y + 2); });
        if (s.bug) cell(s.bug.c[0], (x, y) => { bmp(x, y, ['#.#.#.', '######', '.#..#.']); });
        if (s.paused) { rect(28, 26, 40, 11, 0); box(28, 26, 40, 11); ctext(29, 'PAUSED'); }
      };
      const tick = () => {
        if (top() !== s || s.paused || w.closed) return;
        if (s.dead) { s.dead++; P.draw(); if (s.dead > 14) { clearInterval(s.iv); over(); } return; }
        if (s.q.length) { const d = s.q.shift(); if (d[0] !== -s.dir[0] || d[1] !== -s.dir[1]) s.dir = d; }
        const h = s.body[0], n = [h[0] + s.dir[0], h[1] + s.dir[1]];
        if (n[0] < 0 || n[1] < 0 || n[0] >= CW || n[1] >= CH || s.body.slice(0, -1).some(b => b[0] === n[0] && b[1] === n[1])) { s.dead = 1; beep(220, 0.3); beep(110, 0.45, 0.3); P.draw(); return; }
        s.body.unshift(n);
        if (n[0] === s.food[0] && n[1] === s.food[1]) {
          s.score += st.lvl; s.eaten++; s.food = free(); beep(1800, 0.05);
          if (s.eaten % 5 === 0 && !s.bug) { const p = free(); s.bug = { c: [p, [Math.min(CW - 1, p[0] + 1), p[1]]], t: 20 }; }
        } else s.body.pop();
        if (s.bug) {
          if (s.bug.c.some(b => b[0] === n[0] && b[1] === n[1])) { s.score += st.lvl * 5 + s.bug.t; s.bug = null; beep(1200, 0.06); beep(1800, 0.08, 0.07); }
          else if (--s.bug.t <= 0) s.bug = null;
        }
        if (s.score >= 100) A.secret('fam.snake');
        drain(0.012);
        P.draw();
      };
      function over() {
        const best = s.score > st.hi; if (best) { st.hi = s.score; save(); }
        pop();
        popup(best ? ['Game over!', 'TOP SCORE!', String(s.score)] : ['Game over!', 'Your score:', String(s.score)], 2600);
      }
      s.enter = () => { s.iv = setInterval(tick, SPD[st.lvl]); };
      s.leave = () => clearInterval(s.iv);
      s.key = k => {
        const D = { 2: [0, -1], up: [0, -1], 8: [0, 1], down: [0, 1], 4: [-1, 0], left: [-1, 0], 6: [1, 0], right: [1, 0] }[k];
        if (D) { if (s.q.length < 3) s.q.push(D); return; }
        if (k === 'sel' || k === '5') { s.paused = !s.paused; P.draw(); }
        if (k === 'c') { pop(); }
      };
      return s;
    }
    // ---- Snake Link-up: two snakes on one screen over JackNet (an mp.js session). The host's phone runs the game: it ticks
    // every TICK ms, takes the other phone's turns ({k:'d'}) and sends the whole field back every tick ({k:'v'}). A dropped
    // link pauses the round (3-2-1 when it's back); a reload or a "where are we?" gets the field from the host straight away.
    function snakeLink(s) {
      const C = 3, X0 = 1, Y0 = 9, CW = 31, CH = 17, TICK = 190, WIN = 3;
      const host = s.host, mi = host ? 0 : 1;
      const scr = { id: 'snake', net: true, score: 0, body: [], dir: [1, 0], dead: 0 };
      let G = null, V = null, lastRx = Date.now(), iv = 0, voted = '', said = '';
      const sameC = (a, b) => a[0] === b[0] && a[1] === b[1];
      const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
      const enc = x => ({ h: x.b[0], p: x.b.slice(1).map((c, i) => { const d = [c[0] - x.b[i][0], c[1] - x.b[i][1]]; return d[1] < 0 ? 'U' : d[1] > 0 ? 'D' : d[0] < 0 ? 'L' : 'R'; }).join('') });
      const dec = o => { if (!o || !Array.isArray(o.h) || typeof o.p !== 'string' || o.p.length > CW * CH) return []; const b = [[o.h[0] | 0, o.h[1] | 0]]; for (const ch of o.p) { const d = DIRS[ch]; if (!d) break; const l = b[b.length - 1]; b.push([l[0] + d[0], l[1] + d[1]]); } return b; };
      // ---- the host's game
      function free() { for (let n = 0; n < 600; n++) { const p = [Math.floor(Math.random() * CW), Math.floor(Math.random() * CH)]; if (!G.sn.some(x => x.b.some(c => sameC(c, p)))) return p; } return [15, 8]; }
      function newRound() {
        G.r++; G.ph = 'cd'; G.cdAt = Date.now(); G.res = -1; G.dead = [0, 0];
        G.sn = [{ b: [[7, 4], [6, 4], [5, 4], [4, 4]], d: [1, 0], q: [] }, { b: [[23, 12], [24, 12], [25, 12], [26, 12]], d: [-1, 0], q: [] }];
        G.f = free(); s.save({ sc: G.sc, m: G.m, r: G.r });
      }
      function newMatch() { G.m++; G.sc = [0, 0]; G.rm = [0, 0]; G.r = 0; G.forfeit = 0; newRound(); s.round = G.m; s.announce(); }
      function step() {
        const heads = G.sn.map(x => { if (x.q.length) { const d = x.q.shift(); if (d[0] !== -x.d[0] || d[1] !== -x.d[1]) x.d = d; } const h = x.b[0]; return [h[0] + x.d[0], h[1] + x.d[1]]; });
        const eat = heads.map(h => sameC(h, G.f));
        const hit = c => G.sn.some((x, j) => (eat[j] ? x.b : x.b.slice(0, -1)).some(b => sameC(b, c)));
        const dead = heads.map(h => h[0] < 0 || h[1] < 0 || h[0] >= CW || h[1] >= CH || hit(h));
        if (sameC(heads[0], heads[1])) dead[0] = dead[1] = true;
        if (dead[0] || dead[1]) {
          G.dead = dead.map(x => (x ? 1 : 0)); G.res = dead[0] && dead[1] ? 2 : dead[0] ? 1 : 0;
          if (G.res < 2) G.sc[G.res]++;
          G.ph = G.sc.some(v => v >= WIN) ? 'over' : 'res'; G.resAt = Date.now(); return;
        }
        G.sn.forEach((x, i) => { x.b.unshift(heads[i]); if (!eat[i]) x.b.pop(); });
        if (eat[0] || eat[1]) G.f = free();
      }
      const view = () => ({ m: G.m, r: G.r, ph: G.ph, cd: G.ph === 'cd' ? Math.max(1, 3 - Math.floor((Date.now() - G.cdAt) / 700)) : 0, a: enc(G.sn[0]), b: enc(G.sn[1]), f: G.f, sc: G.sc, res: G.res, dead: G.dead, rm: G.rm, ff: G.forfeit });
      function hostTick() {
        if (P.w.closed || s.ended || !G) return;
        const away = !Net.connected || s.others().some(p => s.lost.has(p.id));
        if (away && (G.ph === 'play' || G.ph === 'cd')) G.ph = 'pause';
        else if (!away && G.ph === 'pause') { G.ph = 'cd'; G.cdAt = Date.now(); }
        if (G.ph === 'cd' && Date.now() - G.cdAt >= 2100) G.ph = 'play';
        else if (G.ph === 'play') { const k = Math.max(1, Math.min(5, Math.round((Date.now() - (G.at || Date.now())) / TICK))); for (let i = 0; i < k && G.ph === 'play'; i++) step(); } // (a hidden tab ticks slowly: catch up)
        else if (G.ph === 'res' && Date.now() - G.resAt > 2400) newRound();
        G.at = Date.now(); G.n = (G.n || 0) + 1;
        V = view();
        if (Net.connected && (G.ph === 'play' || G.ph === 'cd' || G.n % 4 === 0)) s.send({ k: 'v', v: V });
        if (top() === scr) P.draw();
      }
      // ---- both phones
      const okV = v => v && typeof v === 'object' && typeof v.ph === 'string' && Array.isArray(v.sc) && Array.isArray(v.f);
      function seen() { // sounds, the result, the secret: from what's on the screen
        if (!V) return;
        if (!host) s.round = V.m | 0;
        const key = V.m + ':' + V.r + ':' + V.ph;
        if (key === said) return; said = key;
        if (V.ph === 'play') beep(1600, 0.05);
        if (V.ph === 'res' || V.ph === 'over') { const iLost = V.dead && V.dead[mi]; if (iLost) { beep(220, 0.3); beep(110, 0.45, 0.3); } else { beep(1200, 0.06); beep(1800, 0.08, 0.07); } }
        if (V.ph === 'over' && voted !== String(V.m)) {
          voted = String(V.m);
          const w = V.sc[0] > V.sc[1] ? 0 : V.sc[1] > V.sc[0] ? 1 : -1, ids = [s.hostId, (s.others().concat(s.roster).find(p => p.id !== s.hostId) || {}).id || 0];
          if (w === mi) A.secret('mp.snake2');
          Net.send({ t: 'mpResult', sid: s.rsid(), w: w < 0 ? 0 : ids[w] });
        }
      }
      const cell = (c, f) => f(X0 + 1 + c[0] * C, Y0 + 1 + c[1] * C);
      scr.draw = () => {
        const them = s.others()[0], tn = them ? them.nick.replace(/[^\x20-\x7e]/g, '').slice(0, 9) : 'NOBODY';
        if (!V) { header('Link-up'); ctext(24, 'Connecting...'); ctext(34, 'Please wait'); return; }
        text(1, 1, `${V.sc[mi]}-${V.sc[1 - mi]}`); text(W - tw(tn) - 1, 1, tn);
        box(X0, Y0, CW * C + 2, CH * C + 2);
        const mine = dec(mi ? V.b : V.a), theirs = dec(mi ? V.a : V.b), blink = V.ph === 'res' || V.ph === 'over' ? Math.floor(Date.now() / 250) % 2 : 0;
        if (!(blink && V.dead && V.dead[mi])) mine.forEach((c, i) => cell(c, (x, y) => { rect(x, y, 3, 3); if (i === 0) px(x + 1, y + 1, 0); }));
        if (!(blink && V.dead && V.dead[1 - mi])) theirs.forEach((c, i) => cell(c, (x, y) => { if (i === 0) { rect(x, y, 3, 3); return; } px(x, y); px(x + 2, y); px(x + 1, y + 1); px(x, y + 2); px(x + 2, y + 2); })); // theirs: crosses, solid head
        cell(V.f, (x, y) => { px(x + 1, y); px(x, y + 1); px(x + 2, y + 1); px(x + 1, y + 2); });
        const lost = !Net.connected || (!host && Date.now() - lastRx > 2500 && V.ph !== 'over');
        const msg = lost ? ['LINK LOST', Net.connected ? 'Waiting for them...' : 'Reconnecting...'] : V.ph === 'pause' ? ['LINK LOST', 'Waiting for them...'] : V.ph === 'cd' ? null
          : V.ph === 'res' ? [V.res === 2 ? 'BOTH CRASHED!' : V.res === mi ? 'THEY CRASHED!' : 'YOU CRASHED!', `${V.sc[mi]} - ${V.sc[1 - mi]}`]
          : V.ph === 'over' ? [V.sc[mi] > V.sc[1 - mi] ? (V.ff ? 'THEY LEFT. WIN!' : 'YOU WIN!') : V.sc[mi] < V.sc[1 - mi] ? 'YOU LOSE!' : 'DRAW!', V.rm && V.rm[mi] ? 'Waiting for them' : 'Sel=again C=quit'] : null;
        if (V.ph === 'cd' && !lost) { rect(40, 22, 16, 15, 0); box(40, 22, 16, 15); text(45, 25, String(V.cd), 1, 2); }
        if (msg) { rect(6, 22, W - 12, 18, 0); box(6, 22, W - 12, 18); ctext(25, msg[0]); ctext(32, msg[1]); }
        scr.score = V.sc[mi]; scr.body = mine; scr.food = V.f; scr.ph = V.ph;
      };
      scr.key = k => {
        const D = { 2: [0, -1], up: [0, -1], 8: [0, 1], down: [0, 1], 4: [-1, 0], left: [-1, 0], 6: [1, 0], right: [1, 0] }[k];
        if (D) { if (host) { if (G && G.ph === 'play' && G.sn[0].q.length < 3) G.sn[0].q.push(D); } else s.send({ k: 'd', d: D, r: V ? V.r : 0 }); return; }
        if ((k === 'sel' || k === '5') && V && V.ph === 'over') { if (host) { G.rm[0] = 1; rematch(); } else s.send({ k: 'rm', m: V.m }); if (V.rm) V.rm[mi] = 1; P.draw(); return; }
        if (k === 'c') pop();
      };
      function rematch() { if (G && G.rm[0] && G.rm[1] && !G.forfeit) { newMatch(); A.secret('mp.rematch'); } }
      scr.enter = () => { if (host) { clearInterval(iv); iv = setInterval(hostTick, TICK); } else { clearInterval(iv); iv = setInterval(() => { if (top() === scr) P.draw(); if (!s.ended && Date.now() - lastRx > 4000 && Net.connected && Date.now() - (scr.needT || 0) > 4000) { scr.needT = Date.now(); s.need(); } }, 300); } };
      scr.leave = () => { clearInterval(iv); if (!s.ended) s.leave(true); };
      s.on('m', (d, from) => {
        if (!d || typeof d !== 'object') return;
        if (host && G) {
          if (d.k === 'd' && Array.isArray(d.d) && Math.abs(d.d[0]) + Math.abs(d.d[1]) === 1 && G.ph === 'play' && G.sn[1].q.length < 3) G.sn[1].q.push([d.d[0] | 0, d.d[1] | 0]);
          if (d.k === 'rm' && G.ph === 'over' && d.m === G.m) { G.rm[1] = 1; rematch(); }
        } else if (!host && d.k === 'v' && from === s.hostId && okV(d.v)) { V = d.v; lastRx = Date.now(); seen(); if (top() === scr) P.draw(); }
      });
      s.on('state', st2 => { if (!host && okV(st2)) { V = st2; lastRx = Date.now(); seen(); if (top() === scr) P.draw(); } });
      const out = id => { if (id === s.hostId) { s.end(''); return; } if (host && G && G.ph !== 'over') { G.ph = 'over'; G.forfeit = 1; G.sc[0] = Math.max(G.sc[0], WIN); G.res = 0; G.dead = [0, 1]; V = view(); seen(); P.draw(); } };
      s.on('gone', out); s.on('left', out);
      s.on('end', () => { clearInterval(iv); if (P.w.closed) return; const i = P.stack.indexOf(scr); if (i >= 0) { P.stack.splice(i, 1); if (!P.stack.length) P.stack.push(idle); popup(['Link closed.', V && V.ph === 'over' ? 'Good game!' : 'The other phone', V && V.ph === 'over' ? '' : 'hung up.'], 2400); } });
      if (host) {
        G = { m: 0, r: 0, sc: [0, 0], rm: [0, 0], n: 0 };
        s.state(() => (G ? view() : undefined));
        if (s.resumed && s.saved && Array.isArray(s.saved.sc)) { G.m = s.saved.m | 0; G.sc = s.saved.sc.slice(0, 2).map(v => v | 0); G.r = s.saved.r | 0; G.rm = [0, 0]; newRound(); } else newMatch();
        V = view();
      } else setTimeout(() => { if (!s.ended) s.need(); }, 200);
      return scr;
    }
    function startLink(s) {
      while (P.stack.length > 1) { const x = P.stack.pop(); if (x.leave) x.leave(); }
      if (st.batt <= 0) { st.batt = 15; save(); } // (Mom plugged it in for you)
      push(snakeLink(s)); backlight(); P.w.restore();
    }
    if (window.MP) MP.hook('family.phone', w, { session: s => startLink(s) });
    // ---- Composer
    function composerMenu() {
      return list('Composer', () => Object.keys(PRESETS).map(id => ({ label: PRESETS[id][0], right: st.tone === id ? '*' : '', act: () => push(toneOpts(id)) }))
        .concat([1, 2, 3, 4].map(n => { const id = 'my' + n, t = st.tones[id]; return { label: t ? t.name : `My tone ${n}`, right: st.tone === id ? '*' : (t ? '' : 'empty'), act: () => push(t ? toneOpts(id) : composeEditor(id)) }; })), { numbers: false });
    }
    function toneOpts(id) {
      const mine = !PRESETS[id];
      return list(tuneOf(id).name, [
        { label: 'Play', act: () => { const t = tuneOf(id); playTune(t); if (!window.Sound || !Sound.on) popup(['Sound is off!', 'Turn it on with', 'the speaker by', 'the clock.'], 2400); else if (mine && t.toks.filter(x => !/-$/.test(x)).length >= 8) A.secret('fam.tune'); } },
        { label: 'Set as ringtone', act: () => { st.tone = id; save(); popup(['Ringtone set:', tuneOf(id).name], 1600); } },
        { label: mine ? 'Edit' : 'Edit a copy', act: () => { let dest = id; if (!mine) { dest = [1, 2, 3, 4].map(n => 'my' + n).find(k => !st.tones[k]) || 'my4'; st.tones[dest] = { name: 'My ' + PRESETS[id][0].split(' ')[0], bpm: PRESETS[id][1], s: PRESETS[id][2] }; save(); } pop(); push(composeEditor(dest)); } },
        mine ? { label: 'Delete', act: () => { delete st.tones[id]; if (st.tone === id) st.tone = 'classic'; save(); pop(); } } : null,
      ].filter(Boolean));
    }
    function composeEditor(id) {
      const cur = st.tones[id] || { name: 'My tone ' + id.slice(2), bpm: 125, s: '' };
      const s = { id: 'compose', toks: parseTune(cur.s), dur: 4, oct: 1 };
      const BPMS = [63, 80, 100, 125, 160, 200];
      const NOTES = 'cdefgab';
      s.draw = () => {
        header('Composer', `${cur.bpm}bpm`);
        const L = wrap(s.toks.join(' ') + ' |', 23).slice(-5);
        L.forEach((l, i) => text(1, 10 + i * 7, l));
        text(1, 50, `1-7 note 0 rest`); soft('Options');
      };
      const last = () => s.toks.length - 1;
      const edit = f => { const i = last(); if (i < 0) return; const m = TOK.exec(s.toks[i]); if (!m) return; const o = { d: +m[1], dot: m[2], n: m[3], o: +m[4] || 1 }; f(o); s.toks[i] = `${o.d}${o.dot}${o.n}${o.n === '-' ? '' : o.o}`; preview(s.toks[i]); };
      const preview = tok => playTune({ bpm: cur.bpm, toks: [tok] });
      const store2 = () => { st.tones[id] = { name: cur.name, bpm: cur.bpm, s: s.toks.join(' ') }; save(); };
      s.key = k => {
        if (/^[1-7]$/.test(k)) { if (s.toks.length < 60) { const t = `${s.dur}${NOTES[+k - 1]}${s.oct}`; s.toks.push(t); preview(t); } }
        else if (k === '0') { if (s.toks.length < 60) s.toks.push(`${s.dur}-`); }
        else if (k === '8') edit(o => { o.d = Math.min(32, o.d * 2); s.dur = o.d; });
        else if (k === '9') edit(o => { o.d = Math.max(1, o.d / 2); s.dur = o.d; });
        else if (k === '*') edit(o => { o.o = o.o % 3 + 1; s.oct = o.o; });
        else if (k === '#') edit(o => { if (o.n === '-' || /[eb]$/.test(o.n)) return; o.n = o.n[0] === '#' ? o.n.slice(1) : '#' + o.n; });
        else if (k === 'c') { if (s.toks.length) s.toks.pop(); else { pop(); return; } }
        else if (k === 'sel') {
          push(list('Options', [
            { label: 'Play', act: () => { store2(); const t = tuneOf(id); playTune(t); if (!window.Sound || !Sound.on) popup(['Sound is off!', 'Turn it on with', 'the speaker by', 'the clock.'], 2400); else if (t.toks.filter(x => !/-$/.test(x)).length >= 8) A.secret('fam.tune'); } },
            { label: 'Tempo', right: String(cur.bpm), act: () => { cur.bpm = BPMS[(BPMS.indexOf(cur.bpm) + 1) % BPMS.length] || 125; store2(); } },
            { label: 'Save', act: () => { store2(); popup(['Saved:', cur.name], 1200, () => pop()); } },
            { label: 'Set as ringtone', act: () => { store2(); st.tone = id; save(); popup(['Ringtone set:', cur.name], 1400, () => pop()); } },
            { label: 'Clear', act: () => { s.toks = []; pop(); } },
            { label: 'Help', act: () => popup(['1-7 = C D E F G A B', '0 = rest  8 9 =', 'shorter/longer', '* octave  # sharp'], 4000) },
          ]));
          return;
        }
        P.draw();
      };
      return s;
    }
    // ---- Credit (pay as you go)
    function creditMenu() {
      return list('Credit', () => [
        { label: 'Balance', right: money(st.credit), act: () => popup(['Your balance is', money(st.credit), `= ${Math.floor(st.credit / 10)} texts`, '(10p per text)'], 2400) },
        { label: 'Top up', act: () => push(editor('', null, { numeric: true, title: 'Top-up code', soft: 'OK', onDone: v => topUp(v) })) },
        { label: 'Where to buy?', act: () => popup(['Top-up cards from', 'any newsagent or', 'FREE in this week\'s', 'JACK ATTACK! Cheats'], 3500) },
      ]);
    }
    function topUp(v) {
      const code = String(v).replace(/\D/g, '');
      const md = F.today().md;
      pop();
      if (code.length !== 12) return popup(['Code must be', '12 numbers.'], 1800);
      if (code === F.DAD_CODE) {
        if (st.dad) return popup(['This card has', 'already been used.'], 2000);
        st.dad = true; st.credit += 1000; save(); A.secret('fam.topup2');
        return popup(['Top-up OK!', '+£10.00', `Balance ${money(st.credit)}`, '(EMERGENCIES ONLY)'], 2800);
      }
      if (code === F.topupCode(md)) {
        if (st.tops[md]) return popup(['This card has', 'already been used.', 'New code tomorrow!'], 2200);
        st.tops = { [md]: 1 }; st.credit += 200; save(); A.secret('fam.topup');
        return popup(['Top-up OK!', '+£2.00', `Balance ${money(st.credit)}`], 2400);
      }
      popup(['Code not valid.', 'Check the card', 'and try again.'], 2000);
    }
    // ---- Settings
    function settingsMenu() {
      return list('Settings', () => [
        { label: 'Ringtone', right: (tuneOf(st.tone) || { name: '?' }).name.slice(0, 9), act: () => push(list('Ringtone', () => Object.keys(PRESETS).concat(Object.keys(st.tones)).map(id => ({ label: tuneOf(id).name, right: st.tone === id ? '*' : '', act: () => { st.tone = id; save(); playTune(tuneOf(id), 3); } })), { numbers: false })) },
        { label: 'Keypad tones', right: st.keyBeep ? 'On' : 'Off', act: () => { st.keyBeep = !st.keyBeep; save(); } },
        { label: 'Phone info', act: () => popup(['TALKBRIK T-99', 'Software v4.07', 'Made in 1999', 'Battery: ' + Math.round(st.batt) + '%'], 3000) },
        { label: 'Restore settings', act: () => { st.tone = 'classic'; st.keyBeep = true; st.mode = 'Abc'; st.lvl = 3; save(); popup('Settings restored', 1400); } },
      ]);
    }
    // ---- battery
    function offScreen() { if (st.charging) { const n = Math.floor(Date.now() / 400) % 5; box(36, 22, 22, 12); rect(58, 25, 2, 6); for (let i = 0; i < n; i++) rect(38 + i * 5, 24, 4, 8); ctext(42, 'Charging'); } }
    function drain(x) {
      if (st.charging) return;
      const before = st.batt; st.batt = Math.max(0, st.batt - x);
      if (before > 10 && st.batt <= 10) { beep(800, 0.1); beep(800, 0.1, 0.2); popup(['Battery low!', 'Plug the charger in.'], 2200); }
      if (before > 0 && st.batt <= 0) { A.secret('fam.flat'); beep(600, 0.15); beep(400, 0.15, 0.17); beep(250, 0.4, 0.34); P.pop = null; while (P.stack.length > 1) { const s = P.stack.pop(); if (s.leave) s.leave(); } }
    }
    function backlight() { P.lit = 1; cv.classList.add('lit'); clearTimeout(P.litT); P.litT = setTimeout(() => { P.lit = 0; cv.classList.remove('lit'); if (!w.closed) P.draw(); }, 9000); }
    const plug = b.querySelector('.tb-plug');
    const plugUI = () => { plug.textContent = st.charging ? 'Unplug charger' : 'Plug in charger'; plug.classList.toggle('on', st.charging); };
    plug.addEventListener('click', () => { st.charging = !st.charging; save(); plugUI(); beep(1000, 0.06); if (st.charging && st.batt > 0) popup('Charging', 1000); P.draw(); });
    plugUI();
    b.querySelector('.tb-hlp').addEventListener('click', () => { const n = A.fs.find('Talkbrik T-99 manual (the important bits).txt'); if (n) A.openFile(n); else Desk.msgbox('Talkbrik T-99', 'Keys: the big top key is Menu/Select, C goes back. 2/4/6/8 or the arrow keys steer the Snake. # changes the text mode (T9 = predictive). Texts cost 10p each: top up with the code from the JACK ATTACK! Cheats page.', 'info'); });
    P.tick = setInterval(() => {
      if (w.closed) return;
      if (st.charging) { if (st.batt < 100) { st.batt = Math.min(100, st.batt + 2); if (st.batt >= 100) popup('Battery full', 1400); } }
      else drain(top() && top().id === 'snake' ? 0 : (P.lit ? 0.05 : 0.025));
      save(); P.draw();
    }, 1000);
    // ---- keys
    function press(k) {
      backlight();
      if (st.batt <= 0) { if (st.charging && k === 'sel') { popup('Too flat! Wait.', 900); } else popup(['Battery empty.', 'Plug in the', 'charger.'], 1600); P.draw(); return; }
      if (P.pop && k !== 'up' && k !== 'down' && top().id !== 'snake') { dismiss(); return; }
      if (top().id !== 'snake') keyTone();
      const s = top(); if (s && s.key) s.key(k);
      P.draw();
    }
    P.press = press;
    // A real keyboard typing into an editor screen (the in-world handset routes letters here).
    P.type = ch => { const s = top(); if (!s || s.id !== 'edit' || !s.typed) return false; backlight(); s.typed(ch); return true; };
    P.state = () => { const s = top(); return { id: s.id, net: !!s.net, ph: s.ph || null, depth: P.stack.length, text: s.id === 'edit' ? s.text + (s.t9 ? s.t9.words[s.t9.i] : '') : null, mode: s.mode, score: s.score, head: s.body && s.body[0], food: s.food, dir: s.dir, dead: s.dead, pop: P.pop && P.pop.lines.join(' '), batt: st.batt, credit: st.credit }; };
    let holdT = null;
    b.querySelectorAll('[data-k]').forEach(e => {
      e.addEventListener('pointerdown', ev => { ev.preventDefault(); e.classList.add('dn'); const k = e.dataset.k; press(k); if (k === 'c') { clearTimeout(holdT); holdT = setTimeout(() => { const s = top(); if (s && s.id === 'edit') { s.key('clearall'); P.draw(); } else home(); }, 700); } });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => e.addEventListener(t, () => { e.classList.remove('dn'); clearTimeout(holdT); }));
      e.addEventListener('click', ev => ev.preventDefault());
    });
    // swipe on the screen steers the snake on touch screens
    let sw = null;
    cv.addEventListener('pointerdown', ev => { sw = [ev.clientX, ev.clientY]; });
    cv.addEventListener('pointerup', ev => { if (!sw) return; const dx = ev.clientX - sw[0], dy = ev.clientY - sw[1]; sw = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return press('sel'); press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); });
    w.el.tabIndex = -1;
    w.el.addEventListener('keydown', ev => {
      if (ev.target.closest('input,textarea,select')) return;
      const s = top(); const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'sel', Backspace: 'c', Escape: 'c' };
      let k = map[ev.key];
      if (!k && s && s.id === 'snake') k = { w: 'up', a: 'left', s: 'down', d: 'right', ' ': 'sel' }[ev.key.toLowerCase()];
      if (!k && s && s.id === 'edit' && ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { ev.preventDefault(); backlight(); s.typed(ev.key); return; }
      if (!k && /^[0-9*#]$/.test(ev.key)) k = ev.key;
      if (!k) return;
      if (s && s.id === 'edit' && (k === 'left' || k === 'right')) return;
      ev.preventDefault(); press(k);
    });
    setTimeout(() => w.el.focus(), 50);
    function stopAll() { clearInterval(P.tick); clearTimeout(P.popT); clearTimeout(P.litT); stopTune(); P.stack.forEach(s => s.leave && s.leave()); }
    // ---- go
    P.stack = [idle];
    backlight();
    if (arg === 'snake') push(snakeMenu());
    else if (unread()) popup([`${unread()} message${unread() > 1 ? 's' : ''}`, 'received'], 1800);
    P.draw();
    beep(1320, 0.08); beep(1760, 0.12, 0.1);
    return w;
  }

  // This is a private, account-scoped packet; public presence is never a directory.
  if (window.Net) {
    Net.on('smsPhone', m => {
      if (m.ref !== phoneRef || !m.ok || m.owner !== phoneOwner() || !phoneNumber(m.number)) return;
      phone = { owner: m.owner, number: m.number, contacts: m.contacts || [] };
      restoreReplies(m.replies);
      if (isOpen()) P.draw();
    });
    Net.on('smsContactResult', m => {
      if (m.owner !== phoneOwner()) { if (m.ok) return; }
      if (m.ok && privatePhone()) phone.contacts = m.contacts || [];
      if (isOpen()) { P.net(m); P.draw(); }
    });
    Net.on('smsNew', m => { if (m.item) restoreReplies([m.item]); });
    for (const event of ['welcome', 'loginOk', 'you', '_close']) Net.on(event, () => {
      phone = null; phoneRef = '';
      if (isOpen()) { P.resetPrivate(); if (event !== '_close') requestPhone(); }
    });
  }
  window.FamilyPhone = {
    open, isOpen,
    incoming: it => { if (isOpen()) P.incoming(it); },
    net: m => { if (isOpen()) P.net(m); },
    press: k => { if (isOpen()) P.press(k); },
    type: ch => isOpen() ? P.type(ch) : false,
    state: () => isOpen() ? P.state() : null,
    t9: t9Words, parseTune,
  };
})();
