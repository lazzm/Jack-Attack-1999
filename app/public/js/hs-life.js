/* hs-life: LIFE IN JACK'S HOUSE, 1999. Jack is 16; it's the same day and time as the visitor's, in 1999 (school days, half
 * terms, tea time, bedtime). Mom shouts up the stairs, the landline rings (Gran, Dave asking if you're coming out, wrong
 * numbers; and you can't use it while the PC's on the Internet: there's only one phone line), Mom's jobs on the fridge pay
 * pocket money, there's a biscuit tin, a microwave flashing 12:00, a newspaper with today's 1999 headline, and late at night
 * everyone's asleep so keep it down. Rupees only through the server (mods/hs.js: biscuit tin, chores, Saturday pocket money).
 * Loaded by js/hs-house.js once you're out of your room. */
(function () {
  'use strict';
  const H = window.House, R = window.Room, HR = window.HouseRooms, C = window.HouseCat;
  if (!H || !H.ok || !R || !HR || window.HouseLife) return;
  const K = H.K, T = H.T, A = window.HouseArt, D2R = Math.PI / 180, GY = 353;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const say = (t, x, ms) => H.say(t, x, ms), toast = (t, x) => H.toast(t, x);
  const secret = id => { try { R._.secret(id); } catch (e) {} };
  const cast = s => { try { return window.Cast ? Cast.t(s) : s; } catch (e) { return s; } };
  const sis = () => { try { return Cast.n('sister'); } catch (e) { return 'my sister'; } };
  const KEY = 'jhp_hs_life';
  const S = (() => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch (e) { return {}; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const net = () => window.Net && Net.me && Net.me.member;
  const send = m => { try { if (window.Net) Net.send(m); } catch (e) {} };

  // ================================================================ 1999 time: the day, school days, the bit of the day
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function now99() {
    let t; try { t = Desk.today99(); } catch (e) { const d = new Date(); t = { m: d.getMonth() + 1, d: d.getDate() }; }
    const d = new Date(), day = t.m === 2 && t.d === 29 ? 28 : t.d;
    return { m: t.m, d: t.d, md: t.m * 100 + t.d, dow: new Date(1999, t.m - 1, day).getDay(), h: d.getHours(), min: d.getMinutes(), t: d.getHours() + d.getMinutes() / 60 };
  }
  // English school holidays, 1999 (roughly: they varied a little by county), and the bank holidays
  const HOLS = [[101, 104], [215, 219], [329, 416], [503, 503], [531, 604], [722, 907], [825, 830], [1025, 1029], [1218, 1231]];
  function schoolDay(n) { n = n || now99(); if (n.dow === 0 || n.dow === 6) return false; return !HOLS.some(([a, b]) => n.md >= a && n.md <= b); }
  function part(n) {
    n = n || now99(); const t = n.t;
    if (t >= 23.5 || t < 6.5) return 'night';
    if (t < 8.5) return 'morning';
    if (t < 15.5) return schoolDay(n) ? 'school' : 'day';
    if (t < 17.5) return 'after';
    if (t < 18.5) return 'tea';
    if (t < 22.5) return 'evening';
    return 'late';
  }
  const quiet = () => { const p = part(); return p === 'night' || p === 'late'; };

  // ================================================================ voices: Mom shouting up the stairs (and Dad, and the little sister)
  const ui = H.ui.el;
  const voiceEl = document.createElement('div'); voiceEl.className = 'hs-voice'; voiceEl.innerHTML = '<b></b><p></p>'; ui.appendChild(voiceEl);
  let voiceT = 0, lastVoice = 0;
  function voice(who, text, ms) {
    voiceEl.querySelector('b').textContent = who; voiceEl.querySelector('p').textContent = text;
    voiceEl.classList.add('on'); clearTimeout(voiceT); voiceT = setTimeout(() => voiceEl.classList.remove('on'), ms || Math.max(4200, text.length * 75));
    lastVoice = Date.now();
    // a muffled shout from somewhere else in the house (just the shape of it)
    const c = H.sfx.ac && H.sfx.ac(); if (c) { const n = Math.min(10, Math.ceil(text.length / 7)); for (let i = 0; i < n; i++) H.sfx.tone(180 + Math.random() * 90, 0.09, 'sawtooth', 0.015, i * 0.11, 150); }
  }
  const where = () => H.here || 'bedroom';
  const away = () => where() === 'bedroom' || where() === 'landing' ? ' (shouting up the stairs)' : '';
  function moments() { // what someone might shout right now
    const p = part(), n = now99(), L = [], pcOn = H.stood, hifi = !!(R && R._ && R._.S && false);
    const M = 'MOM' + away(), Dd = 'DAD' + away(), Sis = sis().toUpperCase();
    if (p === 'morning') L.push([M, schoolDay(n) ? 'JACK! You\'ll be late for school! Have you had any breakfast?' : 'Jack, are you up? It\'s gone eight! Lazybones!'], [M, 'Jack, have you seen my car keys?']);
    if (p === 'school') L.push([M, 'Jack? Why aren\'t you at school? ...Oh, it\'s an INSET day. Right. Well don\'t sit on that computer all day.']);
    if (p === 'after' || p === 'day') L.push([M, 'Jack, have you done your homework?'], [M, 'Jack! Come and get your washing, it\'s on the stairs!'], [Sis, 'MOOOOOM! Jack\'s being annoying!'], [M, 'Jack, Dave\'s Mom rang. Are you going round there?']);
    if (p === 'tea') L.push([M, 'JACK! TEA\'S READY! It\'ll go cold!'], [M, 'Jack, set the table please, love!'], [M, 'Tea in five minutes! Wash your hands!']);
    if (p === 'evening') L.push([M, 'Jack, it\'s a school night. Not too late, eh?'], [Dd, 'Jack! Have you been using the phone? The bill came.'], [M, 'Jack, do you want a cup of tea?'], [Sis, 'Jack, can I have a go on the Game Lad? Pleeeeease?']);
    if (p === 'late') L.push([Dd, 'Jack! Bed! Now!'], [M, 'Jack, turn that light off, love, it\'s late.']);
    if (p === 'night') L.push([Dd + ' (half asleep)', 'Jack... it\'s gone midnight. What are you doing? Go to bed.']);
    if (pcOn) L.push([M, 'Jack, are you on that computer AGAIN?'], [M, 'Jack! Get off the Internet! I need to ring your Nan!'], [Dd, 'Is that the Internet on? Do you know how much those phone calls cost?']);
    if (n.dow === 6) L.push([M, 'Jack, I\'m popping to the shops. Do you want anything? ...Besides a Daydream.']);
    if (n.dow === 0) L.push([M, 'Jack, we\'re going to Gran\'s for Sunday dinner at one! Wear something clean!']);
    return L;
  }
  function shoutLoop() {
    const wait = (quiet() ? 7 : 3.5) * 60000 + Math.random() * 5 * 60000;
    setTimeout(() => {
      if (H.live && !H.busy && !document.hidden && Date.now() - lastVoice > 120000 && !ringing()) { const L = moments(); if (L.length) { const [w, t] = pick(L); voice(w, cast(t)); } }
      shoutLoop();
    }, wait);
  }

  // ================================================================ the landline (cream, push-button, in the lounge)
  const lounge = () => HR.rooms.lounge;
  let ring = null; // { who, t0, timer }
  const ringing = () => !!ring;
  const CALLS = [
    { who: 'Gran', from: 'Gran', lines: () => ['Hello love! It\'s Gran. Is your Mom there? ...No? Never mind.', 'Are you eating properly? You\'re a growing lad. I\'ve knitted you a jumper. It\'s got a reindeer on it.', 'Are you still playing on that computer? Your Grandad says it\'ll make your eyes go square.'], replies: [['Yes Gran. Thanks Gran.', 'Lovely. I\'ll send it in the post. Bye love! Bye! Bye bye! Bye!'], ['The computer\'s brilliant, Gran!', 'Ooh. Well, as long as you\'re happy. Love to your Mom. Bye love! Bye bye!']] },
    { who: 'Dave', from: 'Dave', lines: () => ['Alright Jack! It\'s Dave. You coming out? We\'re going down the rec.', 'Luke\'s got a new football. And I\'ve got a whole tube of Crunchtubes. Well, half a tube.'], replies: [['Can\'t, I\'m grounded (sort of).', 'Gutted. Come round tomorrow then, I\'ve got the new ULTRA 64 mag with the cheats in.'], ['Yeah, give me ten minutes!', 'Sorted. If you\'re not there in ten we\'re playing three-and-in without you. Later!']] },
    { who: 'a wrong number', from: '???', lines: () => ['Hello? Is that the Golden Dragon? I want to order a number 27 and a 42 with egg fried rice.'], replies: [['Sorry, wrong number!', 'Oh! Sorry love. Bye.'], ['Yes. That will be one million pounds.', '...What? Who IS this? (click)']] },
    { who: 'a man selling double glazing', from: '???', lines: () => ['Good evening sir, I\'m calling about your windows. Are you the homeowner?', 'Have you ever thought about a conservatory?'], replies: [['I\'m sixteen.', 'Ah. Could you put your father on? ...No? Right. Thank you for your time.'], ['Our windows are already double glazed.', 'Ah. Have you considered TRIPLE gla- (you put the phone down)']] },
    { who: 'JackK', from: 'JackK', lines: () => ['Jack. It\'s Jack. The other... no, it\'s JackK. Is your Internet on? I sent you an e-mail.', 'Also, have you finished Acorn Quest yet? Don\'t tell me the ending.'], replies: [['The phone line\'s free, so the Internet\'s off!', 'Oh yeah. Ha. Well, check your mail later then. Laters!'], ['I finished it on Sunday.', 'NO WAY. Don\'t tell me. DON\'T TELL ME. (he hangs up)']] },
    { who: 'Callum', from: 'Callum', lines: () => ['It\'s Callum. Quick question: what\'s the cheat for all the weapons? I\'m on the third level and I\'ve got nothing.'], replies: [['IDKFA. Obviously.', 'Legend. Owe you one. Actually I\'ll owe you nothing, everyone knows that one.'], ['Look it up on the Internet.', 'I can\'t! My sister\'s on the phone. Well, she was. Now I am. (click)']] },
    { who: 'Nan', from: 'Nan', lines: () => ['Hello duck, it\'s your Nan. Did you get the card? There\'s a postal order in it. Don\'t lose it.'], replies: [['Thanks Nan!', 'You\'re welcome, love. Spend it on something nice. Not sweets. Bye bye now!']] },
    { who: 'a recorded voice', from: '???', lines: () => ['CONGRATULATIONS! You have been selected to receive a FREE holiday! To claim, call this premium-rate number. Calls cost a pound a minute.'], replies: [['(Put the phone down. Mom says never ring those.)', '(click)']] },
  ];
  function ringLoop() {
    const wait = (5 + Math.random() * 9) * 60000;
    setTimeout(() => { if (H.live && !H.busy && !document.hidden && !quiet() && !ring && !H.stood) startRing(); ringLoop(); }, wait);
  }
  function startRing(call) {
    if (ring || !lounge() || !lounge().built) return;
    const c = call || pick(CALLS.filter(x => x.who !== 'Nan' || now99().dow === 0 || Math.random() < 0.3));
    ring = { call: c, t0: Date.now() };
    const r = lounge();
    const burst = () => { if (!ring) return; const c2 = H.sfx.ac && H.sfx.ac(); if (c2) for (let i = 0; i < 2; i++) { H.sfx.tone(440, 0.4, 'square', where() === 'lounge' ? 0.05 : 0.02, i * 0.6, 0); H.sfx.tone(480, 0.4, 'square', where() === 'lounge' ? 0.05 : 0.02, i * 0.6, 0); } };
    burst(); ring.timer = setInterval(() => { burst(); if (Date.now() - ring.t0 > 32000) stopRing(true); }, 3000);
    H.anims.set('ring', n => { if (!ring) { r.handset.rotation.z = 0; return false; } r.handset.rotation.z = Math.sin(n / 30) * 0.05 * (Math.floor(n / 600) % 5 < 2 ? 1 : 0); return true; });
    if (where() !== 'lounge') toast('Ring ring!', where() === 'bedroom' ? 'The phone\'s ringing downstairs! (It\'s in the lounge.)' : 'The phone\'s ringing in the lounge!');
    else say('Ring ring!', 'The phone\'s ringing! Answer it before ' + sis() + ' does.', 3500);
  }
  function stopRing(missed) {
    if (!ring) return; clearInterval(ring.timer); const c = ring.call; ring = null; H.dirty();
    if (missed) setTimeout(() => voice('MOM', cast(c.who === 'Dave' ? 'Jack! That was Dave! He says are you coming out?' : c.who === 'Gran' ? 'Jack, that was your Gran. She says you never ring her.' : c.who === 'a wrong number' ? 'Wrong number. AGAIN. Someone wanting a Chinese.' : 'Was that the phone? Did you not hear it?!')), 1500);
  }
  // picking up: answering a call, or dialling out (the keypad, the phone book's numbers, 1471, the speaking clock)
  const phonePose = () => ({ x: 128, y: GY - 150, z: 604, rx: -8, ry: 90, lvl: 'G', seat: 1 }); // (standing by the phone table, the handset in your hand)
  function phone() {
    if (ring) return answer();
    if (H.stood) { secret('hs.phone'); return say('The phone', 'KSSSHHHHHHHH-BEEEEEEEE-KRRRRR. That\'s the Internet on the line! The PC upstairs is using it. (One phone line, one family, many arguments.)', 7000); }
    H.focus(phonePose(), { label: 'Put it down', enter: dial, exit: hangUp, esc: () => { hangUp(); } });
  }
  let callEl = null;
  function card(title, html, btns) {
    if (!callEl) { callEl = document.createElement('div'); callEl.className = 'hs-call hs-modal'; ui.appendChild(callEl); }
    callEl.innerHTML = `<b>${esc(title)}</b><div class="hs-callt">${html}</div><div class="hs-callb"></div>`;
    const bb = callEl.querySelector('.hs-callb');
    (btns || []).forEach(([label, fn]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', fn); bb.appendChild(b); });
    callEl.classList.add('on');
  }
  function cardOff() { if (callEl) callEl.classList.remove('on'); }
  function answer() {
    const c = ring.call; clearInterval(ring.timer); ring = null; secret('hs.phone');
    H.sfx.tone(300, 0.05, 'square', 0.05);
    H.focus(phonePose(), { label: 'Put it down', enter: () => { const r = lounge(); if (r.handset) r.handset.visible = false; talk(c, 0); }, exit: () => { const r = lounge(); if (r && r.handset) r.handset.visible = true; cardOff(); H.dirty(); } });
  }
  function talk(c, i) {
    const lines = c.lines();
    if (i < lines.length) return card(c.from === '???' ? 'On the phone' : c.from + ' (on the phone)', '<p>' + esc(cast(lines[i])) + '</p>', [['...', () => talk(c, i + 1)]]);
    card(c.from === '???' ? 'On the phone' : c.from + ' (on the phone)', '<p><i>What do you say?</i></p>', c.replies.map(([you, them]) => [you, () => card(c.from === '???' ? 'On the phone' : c.from, `<p class="hs-you">"${esc(cast(you))}"</p><p>${esc(cast(them))}</p>`, [['Put the phone down', () => H.unfocus()]])]));
    S.calls = (S.calls | 0) + 1; save();
  }
  // dialling
  const BOOK = () => [['Gran', '01632 960213'], ['Nan', '01632 960584'], ['Dave', '01632 960117'], ['Luke', '01632 960342'], ['Callum', '01632 960776'], ['JackK', '01632 960908'], ['The Golden Dragon (Chinese)', '01632 960888'], ['Odyssey Pictures (film times)', '01632 960400'], ['Doctors', '01632 960500'], ['Speaking clock', '123'], ['Who rang last?', '1471']];
  let dialled = '', padSurf = null;
  function dial() {
    dialled = '';
    const el = document.createElement('div'); el.className = 'hs-pad';
    el.innerHTML = '<div class="hs-padd">&nbsp;</div><div class="hs-padk">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(k => `<button type="button" data-k="${k}">${k}</button>`).join('') + '</div><button type="button" class="hs-padgo">CALL</button>';
    const r = lounge(); if (r.handset) r.handset.visible = false; // (it's in your hand now)
    padSurf = H.surface(el, H.faceQuad(7, 6.8, 30, 2, 0), { w: 300, h: 290 });
    el.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.classList.contains('hs-padgo')) return call(dialled);
      if (dialled.length < 14) { dialled += b.dataset.k; H.sfx.tone([697, 770, 852, 941][Math.floor('123456789*0#'.indexOf(b.dataset.k) / 3)] || 700, 0.12, 'sine', 0.05); H.sfx.tone([1209, 1336, 1477][('123456789*0#'.indexOf(b.dataset.k)) % 3] || 1300, 0.12, 'sine', 0.05); }
      el.querySelector('.hs-padd').textContent = dialled || ' ';
    });
    card('The phone', '<p>Dial tone: <i>bzzzzzzzzz</i>. Press the numbers on the phone, then CALL. (The phone book\'s on the table: Gran, Dave, the speaking clock...)</p>', [['Phone book', () => book()]]);
  }
  function hangUp() { if (padSurf) { padSurf.close(); padSurf = null; } const r = lounge(); if (r && r.handset) r.handset.visible = true; cardOff(); H.sfx.tone(260, 0.05, 'square', 0.04); H.dirty(); }
  function book() { card('The phone book (Mom\'s writing)', '<table class="hs-book">' + BOOK().map(([n, num]) => `<tr><td>${esc(n)}</td><td>${esc(num)}</td></tr>`).join('') + '</table>', [['Back', () => dial2()]]); }
  function dial2() { card('The phone', '<p>Press the numbers, then CALL.</p>', [['Phone book', () => book()]]); }
  function call(num) {
    const n = num.replace(/\s/g, ''), clock = () => { const d = new Date(); return `At the third stroke, it will be ${d.getHours() % 12 || 12} ${String(d.getMinutes()).padStart(2, '0')} and ${Math.ceil(d.getSeconds() / 10) * 10} seconds. Beep. Beep. Beep.`; };
    const ANS = {
      '123': ['The speaking clock', clock()],
      '1471': ['1471', S.calls ? 'Telephone number 0 1 6 3 2, 9 6 0, 1 1 7 called today at ' + (new Date().getHours()) + ' 0 4 hours. To return the call, press 3.' : 'You were called today. The caller withheld their number.'],
      '01632960213': ['Gran', 'Hello? Who is it? JACK! Ooh, you never ring! Is everything all right? Are you eating? Your Grandad says hello. HE SAYS HELLO. Bye love! Bye! Bye bye!'],
      '01632960584': ['Nan', 'Hello duck! Oh how lovely. I\'ve just put the kettle on. Did you get my card? There\'s a postal order in it. Don\'t lose it.'],
      '01632960117': ['Dave', '"Dave\'s house." It\'s Dave\'s Mom. "He\'s out on his bike, love. I\'ll tell him you rang."'],
      '01632960342': ['Luke', 'Luke: "Jack! Have you got the Acorn Quest guide still? I need it back. I KNOW you have it."'],
      '01632960776': ['Callum', 'Engaged. Callum is on the Internet. Of course he is.'],
      '01632960908': ['JackK', 'JackK\'s answering machine: "You\'ve reached JackK. Leave a message after the beep. Unless you\'re selling something." BEEEP.'],
      '01632960888': ['The Golden Dragon', '"Golden Dragon, can I help you?" ...You panic and order prawn crackers to be delivered to Dave\'s house. Then you put the phone down.'],
      '01632960400': ['The Odyssey Pictures', 'Recorded message: "Welcome to the Odyssey Pictures. For this week\'s films, press 1. To book, hold the line. You are caller number... forty... seven."'],
      '01632960500': ['The doctors', '"Surgery. The next appointment is in three weeks." You\'re not even ill. You put the phone down.'],
      '999': ['999', '(You put the phone down before it rings. That\'s for emergencies only. Mom would go spare.)'],
    };
    if (n === '1471') secret('hs.1471');
    const quiz = window.HouseTelly && HouseTelly.phoneLine && HouseTelly.phoneLine(n);
    const a = quiz || ANS[n] || (n.length < 3 ? null : ['Nobody', n.length < 11 ? 'Beep beep beep. "The number you have dialled has not been recognised. Please check and try again."' : 'It rings and rings. Nobody answers.']);
    if (!a) return;
    if (padSurf) { padSurf.el.querySelector('.hs-padd').textContent = 'CALLING...'; }
    H.sfx.tone(400, 0.4, 'sine', 0.03, 0.2); H.sfx.tone(450, 0.4, 'sine', 0.03, 0.2);
    setTimeout(() => card(a[0], '<p>' + esc(cast(a[1])) + '</p>', [['Put the phone down', () => H.unfocus()], ['Dial again', () => { dialled = ''; if (padSurf) padSurf.el.querySelector('.hs-padd').textContent = ' '; dial2(); }]]), 900);
    S.calls = (S.calls | 0) + 1; save();
  }

  // ================================================================ Mom's jobs, pocket money, the biscuit tin (the server pays)
  const ukDay = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const srv = { member: false, chores: null, done: [], tin: false, pocket: false };
  const todays = () => srv.chores || C.choresFor(ukDay());
  const doneLocal = () => { if (S.cday !== ukDay()) { S.cday = ukDay(); S.cdone = []; save(); } return S.cdone; };
  function chore(id) {
    if (window.Chores && Chores.take) return Chores.take(id); // (js/ch.js owns the real chores: 3D jobs in the rooms)
    const c = C.CHORE[id];
    const list = todays();
    if (!list.includes(id)) {
      const fallback = { hoover: 'The hoover. It eats socks. (Not on Mom\'s list today.)', washup: 'The sink. Not my job today. (Check the list on the fridge.)', bin: 'The kitchen bin. Not my job today.', table: 'The kitchen table. Not my job today.', washing: 'Full. Not my job today. Not touching it.', cat: '', tidy: '' }[id];
      if (fallback) say(c.n.split(' (')[0], fallback);
      return false;
    }
    if (doneLocal().includes(id) || srv.done.includes(id)) { say('Already done', 'I\'ve already done that one today. Mom can check.'); return false; }
    // a little bit of time passing (a fade), the sound of it, then it's done
    H.ui.fade(true, 250); H.sfx.noise(0.9, 0.04, id === 'hoover' ? 300 : 1200, 0.1, 'bandpass', id === 'hoover' ? 260 : 900);
    setTimeout(() => {
      H.ui.fade(false, 400);
      doneLocal().push(id); save();
      say('Job done: ' + c.n.split(' (')[0], c.done + (net() ? '' : ' <small>(Log on to JackNet and Mom pays pocket money for jobs.)</small>'), 6000);
      if (net()) send({ t: 'hsChore', id });
      if (todays().every(x => doneLocal().includes(x))) setTimeout(() => voice('MOM', 'Ooh, have you done ALL your jobs? Who are you and what have you done with Jack?'), 2500);
    }, 900);
    return true;
  }
  function tin() {
    const r = HR.rooms.kitchen; if (!r || !r.tinLid) return;
    const lid = r.tinLid, t0 = performance.now();
    H.anims.set('tin', n => { const k = Math.min(1, (n - t0) / 400); lid.rotation.x = -k * 1.2; if (k < 1) return true; setTimeout(() => { const t1 = performance.now(); H.anims.set('tin2', m => { const kk = Math.min(1, (m - t1) / 400); lid.rotation.x = -1.2 * (1 - kk); return kk < 1; }); }, 2200); return false; });
    H.sfx.tone(800, 0.05, 'triangle', 0.04); H.sfx.noise(0.3, 0.05, 2000, 0.05);
    secret('hs.tin');
    const BISC = ['a custard cream', 'a bourbon', 'a pink wafer', 'a Rich Tea (the worst one)', 'a chocolate digestive (JACKPOT)', 'a jammy dodger', 'a shortbread finger', 'a ginger nut (it could break a tooth)'];
    const b = BISC[(new Date().getDate() + new Date().getMonth()) % BISC.length];
    if (S.tday === ukDay() || srv.tin) return say('The biscuit tin', 'Just crumbs. And a fruit shortcake nobody wants. Mom has counted them anyway. (One a day!)');
    S.tday = ukDay(); save();
    say('The biscuit tin', `You sneak ${b}. Mom says one a day.` + (net() ? '' : ' <small>(Log on to JackNet: members find Rupees in here too, once a day.)</small>'), 5000);
    if (net()) send({ t: 'hsTin' });
  }
  function bin() { if (!chore('bin')) say('The kitchen bin', 'The pedal bin. It smells of last night\'s fish fingers.'); }
  if (window.Net) {
    Net.on('hsMe', m => { srv.member = !!m.member; srv.chores = m.chores || null; srv.done = m.done || []; srv.tin = !!m.tin; srv.pocket = !!m.pocket; if (m.member && m.saturday && !m.pocket) setTimeout(pocket, 4000); });
    Net.on('hsTin', m => { if (m.amt > 0) toast('+' + m.amt + ' Rupees', 'Found in the biscuit tin, under the biscuits!'); srv.tin = true; });
    Net.on('hsChore', m => { if (m.amt > 0) toast('+' + m.amt + ' Rupees', 'Mom paid you for doing a job!'); if (m.done) srv.done = m.done; });
    Net.on('hsPocket', m => { if (m.cashPence > 0) { srv.pocket = true; voice('MOM', 'Jack! Here\'s your pocket money. Five pounds. Don\'t spend it all on games magazines.'); setTimeout(() => toast('+£'+(m.cashPence/100).toFixed(2), 'Saturday pocket money! Exchange it at JackNet Bank.'), 2500); } });
    const ask = () => send({ t: 'hsMe' });
    Net.on('welcome', ask); Net.on('loginOk', ask); try { if (Net.me && Net.me.id) ask(); } catch (e) {}
  }
  function pocket() { if (net() && !srv.pocket) send({ t: 'hsPocket' }); }

  // ================================================================ the fridge door: Mom's notes, the jobs list, magnets you can move
  const fridgePose = () => ({ x: HR.rooms.kitchen.fridgeFrame.x, y: GY - 120, z: 165, rx: -3, ry: 0, lvl: 'G', seat: 1 });
  function fridge() {
    const el = document.createElement('div'); el.className = 'hs-fridge';
    const n = now99(), list = todays(), done = doneLocal().concat(srv.done);
    const notes = [];
    const jobs = window.Chores && Chores.fridgeHTML ? Chores.fridgeHTML() : `<ol>${list.map(id => `<li class="${done.includes(id) ? 'done' : ''}">${esc(C.CHORE[id].n)}</li>`).join('')}</ol>`;
    if (!window.Chores || jobs) notes.push(`<div class="hs-fn hs-fn-jobs" style="--r:-2deg;left:7%;top:5%"><b>JOBS FOR JACK</b>${jobs}<i>Love Mom x<br>(Pocket money on SATURDAY if they're done!)</i></div>`);
    notes.push(`<div class="hs-fn hs-fn-mom" style="--r:3deg;left:52%;top:7%">${esc(cast(momNote(n)))}</div>`);
    notes.push(`<div class="hs-fn hs-fn-menu" style="--r:-4deg;left:56%;top:40%"><b>GOLDEN DRAGON</b><small>Chinese takeaway</small><br>27. Sweet &amp; sour chicken<br>42. Beef in black bean<br>55. Egg fried rice<br><b>01632 960888</b></div>`);
    notes.push(`<div class="hs-fn hs-fn-draw" style="--r:5deg;left:8%;top:43%"><i class="hs-drawing"></i><span>${esc(cast('by {sister} age 9'))}</span></div>`);
    notes.push(`<div class="hs-fn hs-fn-card" style="--r:-2deg;left:10%;top:72%">DENTIST<br>${n.dow === 2 ? 'TODAY!' : 'Tuesday'} 4.15pm<br><small>Jack</small></div>`);
    const mags = S.mags || null;
    const letters = 'JACKORKSWAAGH1999TELYMOD'.split('');
    const mm = letters.map((l, i) => { const p = mags && mags[i] ? mags[i] : [10 + (i % 8) * 10 + (i * 7) % 4, 86 - Math.floor(i / 8) * 6 + ((i * 13) % 3)]; return `<i class="hs-mag" data-i="${i}" style="left:${p[0]}%;top:${p[1]}%;--c:${['#d02a2a', '#2a5ad0', '#e8b020', '#2a9a4a', '#a02ab0'][i % 5]}">${l}</i>`; }).join('');
    el.innerHTML = `<div class="hs-fdoor">${notes.join('')}${mm}<i class="hs-fhandle"></i></div>`;
    H.focus(fridgePose(), { label: 'Shut the fridge', enter: () => {
      const r = HR.rooms.kitchen;
      const f=r.fridgeFrame,x0=f.x-f.w/2+.8,x1=f.x+f.w/2-.8,z=f.z+f.d/2+.3;
      const quad=[[x0,GY-168,z],[x1,GY-168,z],[x1,GY-4,z],[x0,GY-4,z]];
      const sf = H.surface(el, quad, { w: 360, h: 984 }); fr = sf; void r;
      magnets(el);
    }, exit: () => { if (fr) { fr.close(); fr = null; } } });
  }
  let fr = null;
  function momNote(n) {
    const p = part(n);
    if (n.md === 1224 || n.md === 1225) return 'Jack - Happy Christmas, love! Mince pies are in the tin, NOT for breakfast. Mom x';
    if (n.md === 1231) return 'Jack - Millennium party at Auntie\'s tonight! Be ready by 7. NO computers at midnight in case they blow up. Mom x';
    if (n.dow === 6) return 'Gone to the shops. Back by 12. Your pocket money is in the tin if you\'ve done your jobs. Mom x';
    if (n.dow === 0) return 'Sunday dinner at Gran\'s at 1. Clean jeans please. Mom x';
    if (p === 'tea' || p === 'evening') return 'Jack - tea is in the oven (fish fingers, chips, beans). Don\'t let ' + '{sister}' + ' have all the ketchup. Mom x';
    return schoolDay(n) ? 'Jack - Packed lunch in the fridge. Don\'t forget your PE kit. Ring me at work if you need anything. Mom x' : 'Jack - Popped out. Back soon. Don\'t eat all the biscuits. I HAVE COUNTED THEM. Mom x';
  }
  function magnets(el) {
    const door = el.querySelector('.hs-fdoor');
    let drag = null;
    door.addEventListener('pointerdown', ev => { const m = ev.target.closest('.hs-mag'); if (!m) return; ev.preventDefault(); ev.stopPropagation(); drag = { m, id: ev.pointerId }; try { door.setPointerCapture(ev.pointerId); } catch (e) {} m.classList.add('drag'); });
    door.addEventListener('pointermove', ev => {
      if (!drag || ev.pointerId !== drag.id) return;
      // (the door is transformed in 3D: ask where the pointer is in its own coordinates)
      const p = local(door, ev.clientX, ev.clientY); if (!p) return;
      drag.m.style.left = Math.max(0, Math.min(94, p.x * 100)) + '%'; drag.m.style.top = Math.max(0, Math.min(97, p.y * 100)) + '%';
    });
    const up = ev => { if (!drag || ev.pointerId !== drag.id) return; drag.m.classList.remove('drag'); drag = null; H.sfx.tone(220, 0.04, 'square', 0.04); saveMags(door); readMags(door); };
    door.addEventListener('pointerup', up); door.addEventListener('pointercancel', up);
  }
  // where a screen point is on a transformed element (0..1 across and down): the inverse of its matrix3d
  function local(el, sx, sy) {
    const m = new DOMMatrix(getComputedStyle(el.parentNode).transform || 'none'); const inv = m.inverse();
    // un-project: find the point on the element's plane (z = 0) under the screen point
    const p0 = inv.transformPoint(new DOMPoint(sx, sy, 0, 1)), p1 = inv.transformPoint(new DOMPoint(sx, sy, 1, 1));
    const a = { x: p0.x / p0.w, y: p0.y / p0.w, z: p0.z / p0.w }, b = { x: p1.x / p1.w, y: p1.y / p1.w, z: p1.z / p1.w };
    const t = Math.abs(b.z - a.z) < 1e-9 ? 0 : -a.z / (b.z - a.z);
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    return { x: x / el.offsetWidth, y: y / el.offsetHeight };
  }
  function saveMags(door) { S.mags = [...door.querySelectorAll('.hs-mag')].map(m => [parseFloat(m.style.left), parseFloat(m.style.top)]); save(); }
  function readMags(door) { // letters in a row, close together, spell words
    const ms = [...door.querySelectorAll('.hs-mag')].map(m => ({ l: m.textContent, x: parseFloat(m.style.left), y: parseFloat(m.style.top) }));
    const rows = []; for (const m of ms) { let r = rows.find(q => Math.abs(q.y - m.y) < 1.6); if (!r) rows.push(r = { y: m.y, a: [] }); r.a.push(m); }
    const words = [];
    for (const r of rows) { r.a.sort((p, q) => p.x - q.x); let w = r.a[0].l; for (let i = 1; i < r.a.length; i++) { if (r.a[i].x - r.a[i - 1].x < 11) w += r.a[i].l; else { words.push(w); w = r.a[i].l; } } words.push(w); }
    const GOOD = { ORKS: 'Mom wrote under it: "What is an ORK?"', WAAAGH: 'Mom wrote under it: "Please stop shouting that."', WAAGH: 'Mom wrote under it: "Please stop shouting that."', JACK: 'Your name. Classic.', 1999: 'Party like it\'s... this year.', MODEM: 'Beep bop connect.', HOME: 'Aww.', TEA: 'Mom: "Yes, it\'s nearly ready."', COOL: 'Everything is cool in 1999.', GAME: 'GAME. Obviously.' };
    const hit = words.find(w => GOOD[w]);
    if (hit) { secret('hs.fridge'); say('Fridge poetry', `You spelled <b>${esc(hit)}</b>. ${esc(GOOD[hit])}`); }
  }

  // ================================================================ the microwave: 12:00, flashing, forever (unless you set it)
  const mwPose = () => {const g=HR.rooms.kitchen.mw;return{x:g.position.x,y:g.position.y-17,z:g.position.z+100,rx:0,ry:0,lvl:'G',seat:1}};
  let mwS = null;
  function micro() {
    const el = document.createElement('div'); el.className = 'hs-micro';
    let mode = 0, hh = 12, mm = 0;
    el.innerHTML = '<div class="hs-mwd">12:00</div><div class="hs-mwk"><button type="button" data-k="clock">CLOCK</button><button type="button" data-k="h">HOUR</button><button type="button" data-k="m">MIN</button><button type="button" data-k="start">START</button><button type="button" data-k="stop">STOP</button><button type="button" data-k="pop">POPCORN</button></div>';
    const disp = el.querySelector('.hs-mwd'), show = () => { disp.textContent = (mode ? (hh + ':' + String(mm).padStart(2, '0')) : (S.mw != null ? clockMw() : '12:00')); };
    el.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return; H.sfx.tone(2200, 0.06, 'square', 0.05);
      const k = b.dataset.k;
      if (k === 'clock') { mode = 1; hh = 12; mm = 0; }
      else if (k === 'h' && mode) hh = hh % 12 + 1;
      else if (k === 'm' && mode) mm = (mm + 1) % 60;
      else if (k === 'start' && mode) { const d = new Date(); const want = d.getHours() % 12 || 12; const diff = ((hh % 12) * 60 + mm) - ((want % 12) * 60 + d.getMinutes()); S.mw = diff; save(); mode = 0; if (Math.abs(diff) <= 2) { secret('hs.micro'); say('Microwave', 'Set! The microwave knows what time it is for the first time since 1994. Until the next power cut.'); } else say('Microwave', 'Set... to the wrong time. It\'s ' + (diff > 0 ? 'fast' : 'slow') + ' by ' + Math.abs(diff) + ' minutes. Still better than 12:00. Isn\'t it?'); }
      else if (k === 'stop') mode = 0;
      else if (k === 'pop') say('Microwave', 'POPCORN. You have no popcorn. The button looks at you, disappointed.');
      show();
    });
    show();
    H.focus(mwPose(), { label: 'Done', enter: () => {
      const g = HR.rooms.kitchen.mw;
      const q = () => { const out = []; for (const [x, y] of [[10.5, -30], [21.5, -30], [21.5, -4], [10.5, -4]]) { const v = new T.Vector3(x, y, 17.4); g.localToWorld(v); out.push([v.x, -v.y, v.z]); } return out; };
      mwS = H.surface(el, q, { w: 220, h: 520 });
    }, exit: () => { if (mwS) { mwS.close(); mwS = null; } } });
  }
  function clockMw() { const d = new Date(Date.now() + (S.mw | 0) * 60000); return (d.getHours() % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0'); }

  // ================================================================ the newspaper (today's 1999 headline, from the TELLY-TEXT news)
  function paper() {
    const show = () => {
      const D = window.TTXData, n = now99();
      const news = D ? D.news.filter(x => D.md(x[0]) <= n.md).slice(-3).reverse() : [];
      const h = news[0];
      say('The paper (' + n.d + ' ' + MON[n.m - 1] + ' 1999)', h ? `<b>${esc(h[1])}</b><br>${esc(h[2])}` + (news[1] ? `<br><small>Also: ${esc(news[1][1])}</small>` : '') : 'The usual. Dad\'s done the crossword in pen. Two answers are just "FISH".', 9000);
    };
    if (window.TTXData) show(); else (window.Apps && Apps.load ? Apps.load('js/hs-ttx-data.js') : Promise.reject()).then(show, () => say('The paper', 'Dad\'s got it. He\'s doing the crossword.'));
  }

  // ================================================================ Mom tidies your room (if you've left things all over the place)
  H.on('room', (id, old) => {
    if (id !== 'bedroom' || !old || old === 'bedroom' || !R.tidy) return;
    const moved = Object.values(H.THINGS).filter(t => t.home && t.home.room === 'bedroom' && t.st === 'rest' && (Math.abs(t.at.x - t.home.x) > 25 || Math.abs(t.at.z - t.home.z) > 25 || t.at.room !== 'bedroom')).length;
    if (moved >= 3 && S.tidied !== ukDay() && Math.random() < 0.4) { S.tidied = ukDay(); save(); R.tidy('bedroom'); setTimeout(() => say('Mom tidied your room!', 'Everything\'s been put "back where it lives". Including things that didn\'t live anywhere. Mom: "Your room was a TIP."', 7000), 300); }
  });
  H.on('place', () => { // the tidy chore: everything in your room back home
    if (window.Chores || !todays().includes('tidy') || doneLocal().includes('tidy')) return;
    const all = Object.values(H.THINGS).filter(t => t.home && t.home.room === 'bedroom');
    if (all.length && all.every(t => t.st !== 'held' && t.at.room === 'bedroom' && Math.abs(t.at.x - t.home.x) < 30 && Math.abs(t.at.z - t.home.z) < 30)) setTimeout(() => chore('tidy'), 600);
  });

  // ================================================================ hooking things up: the sink, the table, the washing, the cat
  function hook(id, fn) { const s = H.SPOTS[id]; if (!s) return; const old = s.act; s.act = () => { if (!fn()) old && old(); }; }
  hook('washing', () => chore('washing')); hook('cat', () => (window.Chores ? false : todays().includes('cat') && !doneLocal().includes('cat')) && chore('cat'));
  const sinkSpot = () => { const r = HR.rooms.kitchen; if (!r || H.SPOTS['hs.sink']) return; const m = new T.Mesh(new T.BoxGeometry(50, 14, 40), new T.MeshBasicMaterial({ visible: false })); m.position.set(-80, GY - 98, -26); r.group.add(m); H.spot('hs.sink', { label: 'The sink', obj: m, act: () => { if (!chore('washup')) say('The sink', 'The sink. There\'s a teaspoon in it. There\'s always a teaspoon in it.'); } }); };
  const tableSpot = () => { const r = HR.rooms.kitchen; if (!r || H.SPOTS['hs.ktable']) return; const m = new T.Mesh(new T.BoxGeometry(120, 6, 80), new T.MeshBasicMaterial({ visible: false })); m.position.set(-60, GY - 74, 170); r.group.add(m); H.spot('hs.ktable', { label: 'Kitchen table', obj: m, act: () => { if (!chore('table')) say('The kitchen table', 'The kitchen table. Sticky. There\'s a fruit bowl with one sad banana in it.'); } }); };
  H.on('built', id => { if (id === 'kitchen') { sinkSpot(); tableSpot(); } });
  if (HR.rooms.kitchen && HR.rooms.kitchen.built) { sinkSpot(); tableSpot(); }

  // ================================================================ the API
  const USE = { tin, micro, fridge, paper, phone, bin, pbook: () => { if (ring) return answer(); H.focus(phonePose(), { label: 'Put it down', enter: () => { dial(); book(); }, exit: hangUp }); } };
  window.HouseLife = {
    use(what) { const f = USE[what]; if (f) f(); },
    chore, voice, ringing, ring: c => startRing(c), quiet, part, now99, schoolDay,
    vcrSet: () => S.vcr != null, mwSet: () => S.mw != null, mwClock: clockMw,
    get S() { return S; }, save,
  };
  // the life starts: a welcome, then the shouting and the phone
  setTimeout(() => { if (!S.hello) { S.hello = 1; save(); voice('MOM', cast(part() === 'tea' ? 'Jack! Is that you? Tea\'s nearly ready!' : 'Jack? Is that you coming down? Put the kettle on, love!')); } }, 2500);
  shoutLoop(); ringLoop();
  if (now99().dow === 6) setTimeout(pocket, 6000);
})();
