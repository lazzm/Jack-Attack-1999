/* cx-web-b: THE CLASS OF '99 pages, part 2 (lazy, from js/cx.js): PIT LANE 99 (F1), THE WEB TURNS 10, BUG ALERT! (viruses),
 * NUL POINTS! (Eurovision), BIG WHEEL WATCH, COME ON TIM! (Wimbledon), THE WORLD'S MOVE (Kasparov vs the World),
 * TOY STORY 2 WATCH and SHOOTING STAR WATCH (Leonids). Every page follows the 1999 date: nothing shows before it happened.
 * Facts (checked): F1 1999 winners race by race; Hakkinen champion at Suzuka 31 Oct by 2 points from Irvine; Schumacher broke
 * his leg at Silverstone 11 Jul. Berners-Lee's proposal at CERN, March 1989; ARPANET's first message 29 Oct 1969 ("LO",
 * then a crash). Melissa 26 Mar 1999 (first 50 address-book names), author arrested 1 Apr; CIH went off 26 Apr.
 * Eurovision 29 May 1999 in Jerusalem: Sweden won (Charlotte Nilsson), Iceland 2nd, UK (Precious) 12th with 38 points, first
 * year with no live orchestra and any language allowed. The Millennium Wheel: 135m, 32 capsules, built flat on the
 * Thames, first lift stopped 10 Sep, raised in October. Wimbledon 21 Jun - 4 Jul: Sampras beat Agassi, Davenport beat Graf,
 * Henman lost the semi to Sampras. Kasparov vs the World: 21 Jun - 22 Oct, World resigned at move 62, 50,000+ voters
 * from 75+ countries. Toy Story 2: US 24 Nov 1999, UK February 2000. Leonids: comet Tempel-Tuttle, peak ~02:00 GMT 18 Nov. */
(function () {
  'use strict';
  const W = window.CXWeb; if (!W) return;
  const { def, css, esc, foot, nav, mates, phase, past, nice, mdOf, daysTo, dayNo } = W;
  const S = W.secret, sfx = W.sfx;

  // ================================================================ PIT LANE 99 (Formula One)
  const PH = 'www.pitlane99.cyb';
  css('cx-f1', `.cxf{background:#e8e8e8 repeating-linear-gradient(45deg,#e8e8e8 0 20px,#dcdcdc 20px 40px);color:#111;padding:14px 18px;font:14px/1.45 Arial,sans-serif;min-height:inherit}
.cxf a{color:#c00}.cxf h1{font:italic bold 34px/1 "Arial Black",Arial;text-align:center;margin:6px 0;color:#c00;letter-spacing:-1px}.cxf h1 span{background:#000;color:#fff;padding:0 8px}.cxf .cxw-nav{text-align:center}
.cxf table{width:100%;border-collapse:collapse;background:#fff;margin:10px 0}.cxf td,.cxf th{border:1px solid #999;padding:4px 6px;font-size:13px;text-align:left}.cxf th{background:#111;color:#fff}
.cxf .box{background:#fff;border:3px solid #111;padding:10px;margin:10px 0}.cxf .car{position:relative;width:300px;max-width:100%;height:172px;margin:10px auto}
.cxf .car .w{position:absolute;width:56px;height:56px;border-radius:50%;background:#111;border:6px solid #444;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font:bold 11px Arial}
.cxf .car .w.off{background:#fff;border-color:#c00;color:#c00}.cxf .car .w.new{background:#222;border-color:#ffd400}
.cxf .car .body{position:absolute;left:56px;top:34px;width:188px;height:104px;background:#c00;border-radius:20px 50px 50px 20px;border:3px solid #000}`);
  const PN = [['/', 'The Season'], ['/pitstop.html', 'Pit Stop Challenge']];
  const RACES = [['03-07', 'Australia', 'Eddie Ervine (Ferrazzi)', 'Ervine\'s first ever win!'], ['04-11', 'Brazil', 'Mika Hackinen (McLaran)', ''], ['05-02', 'San Marino', 'Michael Shoemaker (Ferrazzi)', ''], ['05-16', 'Monaco', 'Michael Shoemaker (Ferrazzi)', ''],
    ['05-30', 'Spain', 'Mika Hackinen (McLaran)', ''], ['06-13', 'Canada', 'Mika Hackinen (McLaran)', ''], ['06-27', 'France', 'Heinz-Harald Frenzen (Jordon)', 'In the rain!'], ['07-11', 'Britain', 'David Coalhard (McLaran)', 'Shoemaker crashed on the first lap and broke his leg.'],
    ['07-25', 'Austria', 'Eddie Ervine (Ferrazzi)', ''], ['08-01', 'Germany', 'Eddie Ervine (Ferrazzi)', ''], ['08-15', 'Hungary', 'Mika Hackinen (McLaran)', ''], ['08-29', 'Belgium', 'David Coalhard (McLaran)', ''],
    ['09-12', 'Italy', 'Heinz-Harald Frenzen (Jordon)', 'Hackinen spun off while leading.'], ['09-26', 'Europe (Germany)', 'Johnny Hurbert (Steward)', 'A British winner!'], ['10-17', 'Malaysia', 'Eddie Ervine (Ferrazzi)', 'Shoemaker came back and helped him.'], ['10-31', 'Japan', 'Mika Hackinen (McLaran)', 'HACKINEN IS WORLD CHAMPION!']];
  def(PH, '/', c => {
    const done = RACES.filter(r => mdOf(r[0]) <= c.md), next = RACES.find(r => mdOf(r[0]) > c.md);
    const head = c.md < 307 ? 'The new season starts in <b>Australia on 7 March</b>. Can Mika Hackinen win the championship again? Can Ferrazzi stop him?'
      : c.md < 711 ? 'The title fight is on: Hackinen\'s McLaran against Shoemaker\'s Ferrazzi.'
      : c.md < 1031 ? 'Shoemaker broke his leg at Silverstone, so it\'s Hackinen against Shoemaker\'s team-mate, <b>Eddie Ervine</b> from Northern Ireland! Go Eddie!'
      : '<b>MIKA HACKINEN IS WORLD CHAMPION AGAIN!</b> He won the last race in Japan on 31 October and beat Eddie Ervine by just two points. Ferrazzi won the teams\' championship. What a season.';
    return `<div class="cxf"><h1><span>PIT LANE</span> 99</h1>${nav(c, PN)}<div class="box">${head}${next ? ` <b>Next race:</b> ${next[1]}, ${nice(next[0])} (${daysTo(c, next[0])} days).` : ''}</div>
      ${done.length ? `<table><tr><th>Date</th><th>Grand Prix</th><th>Winner</th><th></th></tr>${done.map(r => `<tr><td>${nice(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</table>` : '<p>No races yet! The cars are being tested in Spain. Probably.</p>'}
      ${mates(c, [['03-08', 'Jack', 'Got up early to watch Australia. Dad made bacon. Eddie Ervine won. Best Sunday.'], ['07-12', 'Callum', 'Shoemaker broke his leg. Hope he\'s OK. Also: this means Ervine could win it!'], ['11-01', 'Jack', 'Hackinen did it. Two points! TWO! I played F1 on the PlaySpace to celebrate and crashed on the first corner.']])}
      ${c.gb([['flyingfinn', '08/03/99', 'Hackinen will win AGAIN.'], ['tifosi_tom', '12/04/99', 'Forza Ferrazzi!!!']], { title: 'Pit Wall (Guestbook)' })}${foot(c)}</div>`;
  });
  def(PH, '/pitstop.html', c => {
    c.after.push(() => {
      const car = c.q('.car'), out = c.q('.res'); let t0 = 0, state = {}, running = false, best = +(W.E.store.get('jhp_cx_pit', 0)) || 0;
      const reset = () => { state = { fl: 0, fr: 0, rl: 0, rr: 0 }; c.qa('.w').forEach(w => { w.className = 'w'; w.textContent = 'TYRE'; }); };
      c.on('[data-go]', 'click', () => { reset(); running = true; t0 = performance.now(); out.textContent = 'GO GO GO! Click each wheel twice: OFF, then NEW TYRE ON.'; sfx('beep'); });
      c.qa('.w').forEach(w => w.addEventListener('click', () => {
        if (!running) return; const k = w.dataset.w; if (state[k] >= 2) return; state[k]++; sfx('click');
        w.className = 'w ' + (state[k] === 1 ? 'off' : 'new'); w.textContent = state[k] === 1 ? 'OFF!' : 'NEW';
        if (Object.values(state).every(v => v >= 2)) {
          running = false; const s = (performance.now() - t0) / 1000;
          if (!best || s < best) { best = s; W.E.store.set('jhp_cx_pit', +s.toFixed(2)); }
          out.innerHTML = `LOLLIPOP UP! GO! Your stop: <b>${s.toFixed(2)} seconds</b>. Your best: ${best.toFixed(2)}s. ${s < 4 ? 'FASTER THAN McLaran!' : 'Keep practising.'}`;
          if (s < 4) { S('cx.pitstop'); sfx('solve'); } else sfx('boing');
        }
      }));
      reset();
    });
    const pos = [['fl', 30, 8], ['fr', 214, 8], ['rl', 30, 108], ['rr', 214, 108]];
    return `<div class="cxf"><h1><span>PIT STOP</span> CHALLENGE</h1>${nav(c, PN)}<p>The car is in! Change all four tyres as fast as you can. Under <b>4 seconds</b> and you're hired.</p><div class="car"><div class="body"></div>${pos.map(([k, x, y]) => `<div class="w" data-w="${k}" style="left:${x}px;top:${y}px">TYRE</div>`).join('')}</div><p style="text-align:center"><button class="es-btn" data-go="1">START THE STOP</button></p><p class="res" style="text-align:center" aria-live="polite">Press START when the car comes in.</p>${foot(c)}</div>`;
  });

  // ================================================================ THE WEB TURNS 10
  const WH = 'www.webturns10.jnet';
  css('cx-web10', `.cxw10{background:#fff;color:#000;padding:14px 18px;font:15px/1.5 "Times New Roman",serif;min-height:inherit}
.cxw10 h1{font:bold 32px "Times New Roman",serif;margin:6px 0;text-align:center}.cxw10 h1 tt{background:#000;color:#3f3;padding:0 6px;font-size:26px}.cxw10 .cxw-nav{text-align:center;font-family:Arial}
.cxw10 .tl{border-left:4px solid #00a;margin:10px 0 10px 8px;padding-left:12px}.cxw10 .tl p{margin:8px 0}.cxw10 .tl b{color:#00a}
.cxw10 .term{background:#000;color:#3f3;font:14px/1.4 "Courier New",monospace;padding:10px;min-height:160px;white-space:pre-wrap;border:3px inset #888}
.cxw10 .term input{background:#000;color:#3f3;border:0;font:inherit;outline:0;width:60%}`);
  const WN = [['/', 'Home'], ['/history.html', 'History'], ['/lo.html', 'The First Message']];
  def(WH, '/', c => `<div class="cxw10"><h1>THE WEB TURNS <tt>10</tt></h1>${nav(c, WN)}
    <p>In <b>March 1989</b>, a British scientist called <b>Tim Burners-Lea</b>, working at a physics lab called CERN in Switzerland, wrote a proposal about linking documents together across computers. His boss wrote "vague, but exciting" on it. That idea turned into the <b>World Wide Web</b>. Ten years later, here we all are, with our hit counters and our animated GIFs.</p>
    ${c.md >= 1029 ? '<p><b>ANOTHER BIRTHDAY!</b> On 29 October 1969, thirty years ago, the very first message was sent between two computers on the ARPANET, the great-great-grandad of the Internet. It crashed halfway through. <a href="http://' + WH + '/lo.html">Try sending it yourself.</a></p>' : '<p>And in October it\'s 30 years since the very first message on the ARPANET, the great-great-grandad of the Internet. <a href="http://' + WH + '/lo.html">Find out what it said.</a></p>'}
    <p><b>Internet or Web?</b> The <b>Internet</b> is the network: computers all over the world joined together. The <b>Web</b> is the pages and links you look at on it. E-mail goes over the Internet too, but it isn't the Web. Now you can correct your dad.</p>
    ${c.gb([['oldsurfer', '12/03/99', 'Happy birthday Web!'], ['html_hannah', '19/04/99', 'I made my first web page in Jotpad! It has a blink tag!']], { title: 'Birthday Card (Guestbook)' })}${foot(c)}</div>`);
  def(WH, '/history.html', c => `<div class="cxw10"><h1>A SHORT HISTORY OF THE INTERNET</h1>${nav(c, WN)}<div class="tl">
    <p><b>1969</b> ARPANET connects its first computers in America. The first message is sent on 29 October.</p>
    <p><b>1971</b> The first e-mail between two computers on a network. The @ sign gets its big job.</p>
    <p><b>1983</b> The ARPANET switches to TCP/IP, the "language" the Internet still speaks today.</p>
    <p><b>1989</b> Tim Burners-Lea writes his proposal at CERN (March).</p>
    <p><b>1990</b> The first web browser and the first web server, at CERN.</p>
    <p><b>1991</b> The Web is opened up for anyone to use.</p>
    <p><b>1993</b> Mosaique, a browser that shows pictures right in the page. Everyone wants one.</p>
    <p><b>1999</b> You, reading this, at 3.6 kilobytes a second, while Mom waits to use the phone.</p></div>${foot(c)}</div>`);
  def(WH, '/lo.html', c => {
    c.after.push(() => {
      const term = c.q('.term'), inp = c.q('.term input'); let busy = false;
      c.on('form', 'submit', ev => {
        ev.preventDefault(); if (busy) return; const msg = (inp.value || '').trim().toUpperCase(); if (!msg) return; busy = true; inp.disabled = true;
        const out = c.q('.out'); out.textContent = '';
        const send = msg.slice(0, 2), steps = [...send.split('').map(ch => `SENDING "${ch}"... OK. They got it!\n`), msg.length > 2 ? `SENDING "${msg[2]}"...\n\n*** SYSTEM CRASH ***\n\nThe computer at the other end fell over. Only "${send}" got through.\n` : '\nMESSAGE SENT.\n'];
        steps.forEach((s, i) => c.later(() => { out.textContent += s; sfx(i === steps.length - 1 && msg.length > 2 ? 'uhoh' : 'beep'); if (i === steps.length - 1) { busy = false; inp.disabled = false; if (msg.startsWith('LO')) { out.textContent += '\nThat\'s EXACTLY what happened in 1969! They were typing LOGIN, and the first message ever sent on the ARPANET was "LO". As in "lo and behold".\n'; S('cx.lo'); } } }, 900 * (i + 1)));
      });
    });
    return `<div class="cxw10"><h1>THE FIRST MESSAGE</h1>${nav(c, WN)}<p>On <b>29 October 1969</b>, a student at a university in Los Angeles tried to log in to a computer 350 miles away at Stanford, over the brand new ARPANET. He was going to type <b>LOGIN</b>. Type it below and see what happens.</p>
      <form class="term">ARPANET IMP 1 &gt; UCLA TO SRI\nREADY.\n<span class="out"></span>\n&gt; <input type="text" maxlength="12" aria-label="Your message" autocomplete="off" placeholder="type here"></form>${foot(c)}</div>`;
  });

  // ================================================================ BUG ALERT! (viruses)
  const BH = 'www.bugalert.netz';
  css('cx-bug', `.cxb{background:#ffffe8;color:#000;padding:14px 18px;font:14px/1.45 Verdana,Arial,sans-serif;min-height:inherit}
.cxb a{color:#a00}.cxb h1{font:bold 30px "Arial Black",Arial;text-align:center;color:#c00;margin:6px 0}.cxb h1 b{background:#ffd400;color:#000;padding:0 6px;border:3px solid #000}.cxb .cxw-nav{text-align:center}
.cxb .alert{border:4px solid #c00;background:#fff;padding:10px 12px;margin:10px 0}.cxb .alert h3{margin:0 0 4px;color:#c00}.cxb .tip{background:#e8ffe8;border:2px solid #0a0;padding:8px 12px;margin:10px 0}
.cxb .qz{background:#fff;border:2px solid #000;padding:10px;margin:10px 0}.cxb .qz .b{display:flex;gap:8px;justify-content:center;margin-top:8px}.cxb .qz .b button{min-height:40px;min-width:110px;font:bold 14px Verdana}`);
  const BN = [['/', 'Virus News'], ['/quiz.html', 'Safe or Not?']];
  def(BH, '/', c => {
    const A1 = past(c, [['03-26', ['MELISSA', 'A virus called <b>Melissa</b> is spreading by e-mail. It comes as a Word document attachment. If someone opens it, it secretly e-mails itself to the first 50 people in their address book. So many e-mails are flying around that some big companies have had to switch their e-mail off!']],
      ['04-01', ['MELISSA: CAUGHT!', 'The police in America have caught the man they say made Melissa. Not an April Fool.']],
      ['04-15', ['WARNING: CIH ON 26 APRIL', 'A nasty virus called <b>CIH</b> hides on some computers and is set to go off on <b>26 April</b>. It can wipe your hard disk. Make sure your virus scanner is up to date, and back up your homework!']],
      ['04-26', ['CIH WENT OFF', 'CIH woke up today and hit hundreds of thousands of computers around the world, mostly in Asia. It wipes the start of the hard disk, and on some computers it even scrambles the chip that starts the computer up, so it won\'t switch on at all. Keep that virus scanner updated!']]]);
    return `<div class="cxb"><h1><b>BUG ALERT!</b></h1>${nav(c, BN)}<p>Real virus news, explained for kids (and confused parents). A computer <b>virus</b> is a sneaky program that copies itself onto other computers, a bit like a cold going round school. Some are just annoying. Some break things.</p>
      ${A1.map(([k, [h, t]]) => `<div class="alert"><h3>&#9888; ${h} <small>(${nice(k)})</small></h3>${t}</div>`).join('')}
      <div class="tip"><b>THE BUG ALERT RULES:</b><br>1. Don't open e-mail attachments you weren't expecting, even from people you know.<br>2. Keep a virus scanner and update it.<br>3. Back up your important stuff onto floppy disks.<br>4. If a message says "FORWARD THIS TO EVERYONE", it's probably a hoax.<br>5. If in doubt, ask a grown-up who knows about computers.</div>
      <p>Test yourself: <a href="http://${BH}/quiz.html">Safe or Not?</a></p>${c.gb([['PCdoctor', '27/03/99', 'Good advice! Our office got Melissa. Nobody could work.'], ['floppyfan', '02/04/99', 'I back up on 14 floppies. It takes all evening.']], { title: 'Report a Bug (Guestbook)' })}${foot(c)}</div>`;
  });
  def(BH, '/quiz.html', c => {
    const Q = [['An e-mail from someone you don\'t know with an attachment called FUNNY.EXE.', 0], ['A floppy disk your teacher gave you for homework, after your virus scanner checks it.', 1], ['An e-mail saying "FORWARD THIS TO 10 PEOPLE OR YOUR COMPUTER WILL EXPLODE".', 0], ['Updating your virus scanner.', 1], ['A Word document from your friend that you weren\'t expecting, with a strange message.', 0], ['Backing up your homework on a floppy disk.', 1], ['A pop-up saying "YOUR PC HAS 1,000 VIRUSES! CLICK HERE!"', 0], ['Asking a grown-up before you download a program.', 1]];
    c.after.push(() => {
      const box = c.q('.qz'); let i = 0, right = 0;
      const ask = () => {
        if (i >= Q.length) { box.innerHTML = `<p style="font-size:18px;text-align:center">You got <b>${right} out of ${Q.length}</b>! ${right === Q.length ? 'PERFECT. You are virus-proof!' : 'Read the rules on the front page and try again.'}</p><div class="b"><button class="es-btn">Try again</button></div>`; if (right === Q.length) { S('cx.bugsafe'); sfx('solve'); } box.querySelector('button').onclick = () => { i = 0; right = 0; ask(); }; return; }
        box.innerHTML = `<p>Question ${i + 1} of ${Q.length}:</p><p style="font-size:17px"><b>${Q[i][0]}</b></p><div class="b"><button class="es-btn" data-a="1">SAFE</button><button class="es-btn" data-a="0">NOT SAFE</button></div>`;
        box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { if (+b.dataset.a === Q[i][1]) { right++; sfx('pet'); } else sfx('uhoh'); i++; ask(); });
      };
      ask();
    });
    return `<div class="cxb"><h1><b>SAFE OR NOT?</b></h1>${nav(c, BN)}<div class="qz"></div>${foot(c)}</div>`;
  });

  // ================================================================ NUL POINTS! (Eurovision)
  const EH = 'www.nulpoints.wubwub';
  css('cx-euro', `.cxe{background:#1a0a4a radial-gradient(circle at 50% 0,#6a1aa0,transparent 70%);color:#fff;padding:14px 18px;font:14px/1.45 "Trebuchet MS",Arial,sans-serif;min-height:inherit}
.cxe a{color:#ffd400}.cxe h1{font:400 44px/1 var(--mag);text-align:center;margin:6px 0;color:#ffd400;text-shadow:0 0 14px #ff00c8,3px 3px #000}.cxe .cxw-nav{text-align:center}
.cxe .box{background:rgba(0,0,0,.35);border:2px solid #ffd400;padding:10px 12px;margin:10px 0}.cxe table{width:100%;border-collapse:collapse}.cxe td{padding:5px;border-bottom:1px solid #6a4aa0}
.cxe select{font:bold 14px Arial;min-height:30px}.cxe .es-gb{color:#fff}.cxe .es-gb textarea{background:#110030;color:#fff}`);
  const EN = [['/', 'Party Pack'], ['/scores.html', 'Score Card']];
  def(EH, '/', c => {
    const pre = c.md < 529, today = c.md === 529;
    return `<div class="cxe"><h1>NUL POINTS!</h1>${nav(c, EN)}<div class="box">${pre ? `<b>EUROVIZZION 1999</b> is on <b>Saturday 29 May</b>, live from <b>Jerusalem</b>. ${daysTo(c, '05-29')} days to go! The UK is sending a girl group called <b>Precious</b>. Two big changes this year: there's no live orchestra any more, and countries can sing in any language they like.` : today ? '<b>IT\'S TONIGHT!</b> Get the snacks, get the score cards, and get Mom\'s special Eurovizzion voice ready.' : '<b>RESULTS:</b> <b>Sweden</b> won! Charlotte Nilssen sang "Take Me to Your Haven". <b>Iceland</b> came second. The UK\'s Precious came <b>12th</b> with 38 points. Not nul points, so: a success!'}</div>
      <div class="box"><b>HOW THE VOTING WORKS:</b> each country gives <b>12</b> points to its favourite, then 10, then 8, 7, 6, 5, 4, 3, 2 and 1. You can't vote for yourself. Somebody always gets "nul points" (zero). The voting takes LONGER than the songs. That is the best bit.</div>
      <div class="box"><b>PARTY PACK:</b> a bowl of crisps for every country, a score card for everyone (<a href="http://${EH}/scores.html">print ours!</a>), and one person whose job is to shout "DOUZE POINTS!" in a French accent.</div>
      ${mates(c, [['05-30', 'Jack', 'Mom gave every song a mark out of ten. Gubbinz gave Sweden douze points.'], ['05-30', 'JackK', 'I liked the one from Iceland. Don\'t tell anyone.']])}
      ${c.gb([['eurofan', '02/05/99', 'Come on Precious!'], ['douze_dave', '29/05/99', 'BEST NIGHT OF THE YEAR']], { title: 'Phone Votes (Guestbook)' })}${foot(c)}</div>`;
  });
  def(EH, '/scores.html', c => {
    const C = ['United Kingdom', 'Ireland', 'France', 'Germany', 'Spain', 'Sweden', 'Iceland', 'Netherlands', 'Belgium', 'Israel'], PTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
    c.after.push(() => {
      const sels = c.qa('select'), msg = c.q('.msg');
      const check = () => { const used = sels.map(s => s.value).filter(Boolean); sels.forEach(s => [...s.options].forEach(o => { o.disabled = !!o.value && o.value !== s.value && used.includes(o.value); }));
        if (used.length === PTS.length) { const top = sels.find(s => s.value === '12'); msg.innerHTML = `Your DOUZE POINTS go to... <b>${esc(top ? top.dataset.c : '?')}</b>!`; S('cx.douze'); sfx('solve'); } else msg.textContent = `${PTS.length - used.length} sets of points left to give.`; };
      sels.forEach(s => s.addEventListener('change', () => { sfx('click'); check(); }));
    });
    return `<div class="cxe"><h1>SCORE CARD</h1>${nav(c, EN)}<p>Give every country a different score. Your 12 goes to your favourite. (These are some of the countries in this year's contest.)</p><div class="box"><table>${C.map(n => `<tr><td>${n}</td><td><select data-c="${esc(n)}" aria-label="Points for ${esc(n)}"><option value="">-</option>${PTS.map(p => `<option value="${p}">${p}</option>`).join('')}</select></td></tr>`).join('')}</table></div><p class="msg" style="text-align:center;font-size:18px" aria-live="polite">10 sets of points left to give.</p>${foot(c)}</div>`;
  });

  // ================================================================ BIG WHEEL WATCH
  const GH = 'www.bigwheelwatch.jnet';
  css('cx-wheel', `.cxwh{background:#cfe6f6 linear-gradient(#9fd0ff,#e8f4ff 60%,#5a8ab0 60%,#3a6a90);color:#000;padding:14px 18px;font:14px/1.45 Arial,sans-serif;min-height:inherit}
.cxwh h1{font:bold 32px "Arial Black",Arial;text-align:center;color:#003080;margin:6px 0}.cxwh .box{background:#fff;border:2px solid #003080;padding:10px 12px;margin:10px 0}
.cxwh svg.wheel{display:block;width:260px;max-width:80%;margin:6px auto;cursor:grab;touch-action:none}.cxwh .es-gb{background:#fff;padding:6px}`);
  def(GH, '/', c => {
    const up = c.md >= 1031;
    const status = phase(c, [['06-01', 'The giant wheel is being put together <b>lying down</b>, on platforms floating on the River Thames. When it\'s finished it will be pulled up to stand upright.'], ['09-10', 'They started pulling the wheel upright on <b>10 September</b>, but had to stop because of a problem. The engineers are fixing it.'], ['10-01', 'This month the engineers are pulling the wheel up off the river, slowly, bit by bit. Watch the skyline!'], ['10-31', '<b>IT\'S UP!</b> In October the wheel was pulled up to stand upright over the river. Now the capsules go on.'], ['12-31', 'Tonight the wheel is officially opened for the Millennium! You won\'t be able to ride it until next year, though.']]);
    c.after.push(() => {
      const sv = c.q('svg.wheel'), g = c.q('svg.wheel .rot'); if (!sv || !g) return; let ang = 0, total = 0, last = null, done = false;
      const at = ev => { const r = sv.getBoundingClientRect(); return Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
      sv.addEventListener('pointerdown', ev => { last = at(ev); sv.setPointerCapture(ev.pointerId); });
      sv.addEventListener('pointermove', ev => { if (last == null) return; const a = at(ev); let d = a - last; if (d > 180) d -= 360; if (d < -180) d += 360; last = a; ang += d; total += Math.abs(d) < 60 ? d : 0; g.setAttribute('transform', `rotate(${ang} 100 100)`); if (!done && Math.abs(total) >= 360) { done = true; S('cx.wheel'); sfx('solve'); c.toast('BIG WHEEL WATCH', 'One whole turn! (The real one takes about half an hour.)', 4000); } });
      ['pointerup', 'pointercancel'].forEach(e => sv.addEventListener(e, () => { last = null; }));
    });
    const spokes = Array.from({ length: 32 }, (_, i) => { const a = i * Math.PI / 16, x = 100 + Math.cos(a) * 80, y = 100 + Math.sin(a) * 80; return `<path d="M100 100L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#bbb" stroke-width=".8"/>${up ? `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="3" fill="#9fd0ff" stroke="#335"/>` : ''}`; }).join('');
    return `<div class="cxwh"><h1>BIG WHEEL WATCH</h1><div class="box">${status}</div>
      <svg class="wheel" viewBox="0 0 200 200" role="img" aria-label="Drag to turn the wheel"><g transform="${up ? '' : 'translate(0 70) scale(1 .3)'}"><g class="rot"><circle cx="100" cy="100" r="80" fill="none" stroke="#fff" stroke-width="4"/>${spokes}<circle cx="100" cy="100" r="6" fill="#335"/></g></g>${up ? '<path d="M100 100 L60 196 M100 100 L84 196" stroke="#fff" stroke-width="4"/>' : ''}</svg>
      <p style="text-align:center"><small>Drag round the wheel to spin it.</small></p>
      <div class="box"><b>WHEEL FACTS:</b> 135 metres tall (the biggest wheel of its kind in the world), with <b>32</b> glass capsules, one for each London borough. One trip all the way round will take about half an hour, very slowly, so you can see for miles.</div>
      ${c.gb([['thames_tim', '02/06/99', 'Saw it from a boat! It\'s HUGE lying down.'], ['skyline_sue', '12/09/99', 'They\'ll get it up. Have faith.']], { title: 'Sign the Wheel Watch' })}${foot(c)}</div>`;
  });

  // ================================================================ COME ON TIM! (Wimbledon)
  const TH = 'www.comeontim.kidz';
  css('cx-tennis', `.cxte{background:#e8ffe0;color:#1a3a0a;padding:14px 18px;font:14px/1.45 Georgia,serif;min-height:inherit}
.cxte a{color:#5a1a8a}.cxte h1{font:bold italic 34px Georgia,serif;text-align:center;color:#1a6a1a;margin:6px 0}.cxte h1 b{color:#5a1a8a}.cxte .cxw-nav{text-align:center}
.cxte .box{background:#fff;border:2px solid #5a1a8a;padding:10px 12px;margin:10px 0}.cxte canvas{display:block;width:100%;max-width:480px;margin:0 auto;aspect-ratio:3/2;background:#2a8a2a;border:3px solid #fff;touch-action:none}
.cxte .sb{font:bold 18px Georgia;text-align:center}`);
  const TN = [['/', 'Centre Court'], ['/play.html', 'Play Tennis']];
  def(TH, '/', c => {
    const st = phase(c, [['06-01', `Wimbledon starts on <b>Monday 21 June</b> (${daysTo(c, '06-21')} days!). Can Tim Hen-man be the first British man to win it since 1936? Everyone says THIS is the year. (Everyone said that last year too.)`], ['06-21', '<b>WIMBLEDON IS ON!</b> Tim is still in! Every match, the whole country holds its breath. Mom has stopped cooking. We are living on sandwiches.'], ['07-02', 'Tim got to the <b>semi-finals</b> again, but lost to Pete Samprass. So close. Next year, Tim. NEXT YEAR.'], ['07-04', 'Tim got to the semi-finals again, but lost to Pete Samprass. The finals: <b>Pete Samprass</b> beat Andre Agassy for his sixth Wimbledon, and <b>Lindsay Davenham</b> beat Steffi Graph in the women\'s final. Next year, Tim!']]);
    return `<div class="cxte"><h1>COME ON <b>TIM!</b></h1>${nav(c, TN)}<div class="box">${st}</div><p>Welcome to my Wimbledon page! I love Wimbledon because it means strawberries and cream, rain delays, and Mom shouting at the telly. Fun fact: they get through thousands and thousands of tennis balls, and the balls are kept at the same temperature so they all bounce the same. Try my <a href="http://${TH}/play.html">tennis game</a>!</p>
      ${c.gb([['strawberry_sam', '21/06/99', 'COME ON TIM!!!'], ['ballgirl_bea', '25/06/99', 'I want to be a ball girl when I\'m older.']], { title: 'Sign the Scoreboard' })}${foot(c, { webmaster: 'Bea' })}</div>`;
  });
  def(TH, '/play.html', c => {
    c.after.push(() => {
      const cv = c.q('canvas'), g = cv.getContext('2d'), Wd = 480, Ht = 320, sb = c.q('.sb');
      let me = 160, cpu = 160, b = { x: 240, y: 160, vx: 180, vy: 90 }, sc = [0, 0], won = false;
      const move = ev => { const r = cv.getBoundingClientRect(); me = Math.max(30, Math.min(Ht - 30, (ev.clientY - r.top) / r.height * Ht)); };
      cv.addEventListener('pointermove', move); cv.addEventListener('pointerdown', move);
      const serve = d => { b = { x: 240, y: 160, vx: 180 * d, vy: (Math.random() - 0.5) * 160 }; };
      c.anim(dt => {
        b.x += b.vx * dt; b.y += b.vy * dt; if (b.y < 6 || b.y > Ht - 6) b.vy *= -1;
        cpu += Math.max(-130 * dt, Math.min(130 * dt, b.y - cpu));
        if (b.x < 30 && b.x > 18 && Math.abs(b.y - me) < 32) { b.vx = Math.abs(b.vx) * 1.05; b.vy += (b.y - me) * 3; sfx('click'); }
        if (b.x > Wd - 30 && b.x < Wd - 18 && Math.abs(b.y - cpu) < 32) { b.vx = -Math.abs(b.vx) * 1.05; b.vy += (b.y - cpu) * 3; sfx('click'); }
        if (b.x < 0) { sc[1]++; serve(1); sfx('uhoh'); } if (b.x > Wd) { sc[0]++; serve(-1); sfx('pet'); if (!won) { won = true; S('cx.ace'); c.toast('COME ON TIM!', 'You won a point! The crowd goes wild (politely).', 3500); } }
        const N = ['LOVE', '15', '30', '40', 'GAME'];
        sb.textContent = `YOU ${N[Math.min(4, sc[0])]} - ${N[Math.min(4, sc[1])]} COMPUTER`; if (sc[0] >= 4 || sc[1] >= 4) { sb.textContent = sc[0] >= 4 ? 'GAME TO YOU! New game...' : 'GAME TO THE COMPUTER. New game...'; sc = [0, 0]; }
        g.fillStyle = '#2a8a2a'; g.fillRect(0, 0, Wd, Ht); g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(10, 10, Wd - 20, Ht - 20); g.beginPath(); g.moveTo(Wd / 2, 10); g.lineTo(Wd / 2, Ht - 10); g.stroke();
        g.fillStyle = '#fff'; g.fillRect(16, me - 28, 8, 56); g.fillRect(Wd - 24, cpu - 28, 8, 56); g.fillStyle = '#e8ff3a'; g.beginPath(); g.arc(b.x, b.y, 6, 0, 7); g.fill();
      });
    });
    return `<div class="cxte"><h1>PLAY <b>TENNIS</b></h1>${nav(c, TN)}<p style="text-align:center">Move your mouse (or your finger) up and down over the court to move your racket. Win a point off the computer!</p><canvas width="480" height="320" aria-label="Tennis game"></canvas><p class="sb" aria-live="polite">YOU LOVE - LOVE COMPUTER</p>${foot(c)}</div>`;
  });

  // ================================================================ THE WORLD'S MOVE (Kasparov vs the World)
  const KH = 'www.worldsmove.cyb';
  css('cx-chess', `.cxk{background:#2a1a0a linear-gradient(#3a2410,#1a0e04);color:#f4e4c4;padding:14px 18px;font:14px/1.5 Georgia,serif;min-height:inherit}
.cxk a{color:#ffd400}.cxk h1{font:bold 30px Georgia,serif;text-align:center;color:#ffd400;margin:6px 0}.cxk .cxw-nav{text-align:center}.cxk .box{border:2px solid #8a6a3a;background:rgba(0,0,0,.3);padding:10px 12px;margin:10px 0}
.cxk .board{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));width:320px;max-width:100%;margin:10px auto;border:4px solid #8a6a3a}.cxk .sq{display:flex;align-items:center;justify-content:center;aspect-ratio:1;font-size:min(30px,7vw);cursor:pointer;user-select:none;line-height:1}
.cxk .sq.l{background:#f0d9b5}.cxk .sq.d{background:#b58863}.cxk .sq.sel{outline:3px solid #3a9aff;outline-offset:-3px}.cxk .sq .w{color:#fff;text-shadow:0 0 2px #000,0 0 2px #000}.cxk .sq .b{color:#000}`);
  const KN = [['/', 'The Game'], ['/puzzle.html', 'Checkmate Puzzle']];
  def(KH, '/', c => {
    const over = c.md >= 1022, n = Math.max(1, Math.min(61, 1 + Math.round((dayNo(c.key) - dayNo('06-21')) * 61 / 123)));
    return `<div class="cxk"><h1>THE WORLD'S MOVE</h1>${nav(c, KN)}<div class="box">${over ? '<b>IT\'S OVER.</b> On 22 October, after <b>62 moves</b> and four months, the World team resigned. <b>Gary Chasparov won.</b> But the World made him work really hard for it, and everyone agrees it was one of the most amazing games ever played.' : c.md === 621 ? '<b>IT STARTS TODAY!</b> The world chess champion, <b>Gary Chasparov</b>, is playing one game against... everyone. Anyone on the Internet can vote for the World\'s next move. The most popular move gets played.' : `<b>THE GAME IS ON!</b> Gary Chasparov (the world champion) against the World (everyone on the Internet who wants to vote). The World is somewhere around <b>move ${n}</b>. One move about every day or two, decided by votes.`}</div>
      <p>How it works: chess experts (including a 15-year-old champion called Irina Crush) suggest moves, then everyone votes, and the move with the most votes gets played. More than <b>50,000</b> people from over <b>75 countries</b> have taken part. Chasparov plays on his own. It's one brain against fifty thousand!</p>
      <p>I'm not good enough to vote yet. So I made a <a href="http://${KH}/puzzle.html">checkmate puzzle</a> to practise.</p>
      ${mates(c, [['06-22', 'JackK', 'I voted! I don\'t know if my move was any good. It didn\'t win the vote.'], ['08-10', 'Callum', 'Fifty thousand people and they still can\'t beat one man. That man is a computer. (He isn\'t. But STILL.)'], ['10-23', 'Jack', 'Chasparov won. But the World nearly had him. Teamwork!']])}
      ${c.gb([['pawnstar', '22/06/99', 'Go World!!!'], ['knight_rider', '15/07/99', 'Chasparov is a genius.']], { title: 'Sign the Scoresheet' })}${foot(c)}</div>`;
  });
  def(KH, '/puzzle.html', c => {
    // White: King g1, Rook a1, pawns f2 g2 h2. Black: King g8, pawns f7 g7 h7. White to move: Ra8 is checkmate.
    const P = { g1: ['w', '♔'], a1: ['w', '♖'], f2: ['w', '♙'], g2: ['w', '♙'], h2: ['w', '♙'], g8: ['b', '♚'], f7: ['b', '♟'], g7: ['b', '♟'], h7: ['b', '♟'] };
    c.after.push(() => {
      let sel = null; const msg = c.q('.msg');
      c.qa('.sq').forEach(s => s.addEventListener('click', () => {
        const id = s.dataset.s;
        if (!sel) { if (P[id] && P[id][0] === 'w') { sel = id; s.classList.add('sel'); sfx('click'); } return; }
        const from = sel; sel = null; c.qa('.sq.sel').forEach(x => x.classList.remove('sel'));
        if (from === id) return;
        if (from === 'a1' && id === 'a8') { msg.innerHTML = '<b>CHECKMATE!</b> The rook goes all the way up the board, and the black king is trapped behind his own pawns. It\'s called a back-rank mate.'; const t = c.q('[data-s=a8]'); if (t) t.innerHTML = '<span class="w">♖</span>'; const f = c.q('[data-s=a1]'); if (f) f.innerHTML = ''; S('cx.chess'); sfx('solve'); }
        else { msg.textContent = 'Not checkmate! Black can escape. Look at the black king: can he move anywhere if something attacks him along the back row?'; sfx('uhoh'); }
      }));
    });
    const sq = []; for (let r = 8; r >= 1; r--) for (let f = 0; f < 8; f++) { const id = 'abcdefgh'[f] + r, p = P[id]; sq.push(`<div class="sq ${(r + f) % 2 ? 'd' : 'l'}" data-s="${id}" aria-label="${id}">${p ? `<span class="${p[0]}">${p[1]}</span>` : ''}</div>`); }
    return `<div class="cxk"><h1>CHECKMATE PUZZLE</h1>${nav(c, KN)}<p style="text-align:center">White to move and checkmate in ONE. Click a white piece, then click where it should go.</p><div class="board">${sq.join('')}</div><p class="msg" style="text-align:center" aria-live="polite">Hint: kings don't like being stuck behind their own pawns.</p>${foot(c)}</div>`;
  });

  // ================================================================ TOY STORY 2 WATCH
  const YH = 'www.toystory2watch.flick';
  css('cx-toys', `.cxy{background:#8ad0ff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Cellipse cx='30' cy='30' rx='26' ry='12' fill='%23fff'/%3E%3Cellipse cx='92' cy='18' rx='20' ry='9' fill='%23fff'/%3E%3C/svg%3E");color:#000;padding:14px 18px;font:14px/1.5 "Comic Sans MS","Trebuchet MS",sans-serif;min-height:inherit;position:relative}
.cxy a{color:#c00}.cxy h1{font:bold 34px "Arial Black",Arial;text-align:center;color:#ffd400;-webkit-text-stroke:2px #c00;margin:6px 0}.cxy .cxw-nav{text-align:center}.cxy .box{background:#fff;border:4px solid #ffd400;border-radius:10px;padding:10px 12px;margin:10px 0}
.cxy .toy{display:inline-block;width:30px;height:30px;cursor:pointer;vertical-align:middle}.cxy .toy.got{opacity:.25;cursor:default}`);
  const YN = [['/', 'News'], ['/hunt.html', 'Toy Hunt']];
  const TOYS = [['rocket', '<path d="M15 2c6 6 6 16 3 22h-6c-3-6-3-16 3-22z" fill="#e10600" stroke="#000"/><circle cx="15" cy="12" r="3" fill="#9ff"/>'], ['ball', '<circle cx="15" cy="15" r="12" fill="#ffd400" stroke="#000"/><path d="M3 15h24M15 3v24" stroke="#c00" stroke-width="2"/>'], ['dino', '<path d="M4 24 L8 12 Q12 4 20 6 L26 10 L22 12 L22 24 L18 24 L18 18 L10 18 L10 24 Z" fill="#3c3" stroke="#000"/>'], ['robot', '<rect x="8" y="8" width="14" height="16" fill="#aaa" stroke="#000"/><rect x="11" y="12" width="3" height="3" fill="#f00"/><rect x="16" y="12" width="3" height="3" fill="#f00"/><path d="M15 8V3" stroke="#000"/>'], ['blocks', '<rect x="4" y="14" width="10" height="10" fill="#2a7ad8" stroke="#000"/><rect x="14" y="14" width="10" height="10" fill="#e10600" stroke="#000"/><rect x="9" y="4" width="10" height="10" fill="#ffd400" stroke="#000"/>'], ['yoyo', '<circle cx="15" cy="17" r="10" fill="#c040c0" stroke="#000"/><path d="M15 7V1" stroke="#000"/>']];
  const toy = (i, extra) => `<svg class="toy" viewBox="0 0 30 30" data-toy="${i}" role="img" aria-label="a hidden toy" style="${extra || ''}">${TOYS[i][1]}</svg>`;
  def(YH, '/', c => {
    const st = c.md < 1124 ? `<b>TOY STOREY 2</b> comes out in America on <b>24 November</b> (${daysTo(c, '11-24')} days!) and here in <b>February 2000</b>. Everything good comes out in America first.` : '<b>IT\'S OUT IN AMERICA!</b> (24 November.) Everyone over there says it\'s even better than the first one. We have to wait until <b>February 2000</b>. ARGH.';
    return `<div class="cxy"><h1>TOY STOREY 2 WATCH</h1>${nav(c, YN)}<div class="box">${st}</div>
      <div class="box"><b>DID YOU KNOW?</b> The first Toy Storey (1995) was the first film ever made entirely on computers. Every toy, every room and every blade of grass was built as a 3D model and then lit like a real film set. Toy Storey 2 was first going to come out straight onto video, but it turned out so good they made it a proper cinema film!</div>
      <p>Some toys have escaped onto this website ${toy(2, 'width:18px;height:18px')}. Help round them up on the <a href="http://${YH}/hunt.html">Toy Hunt</a>!</p>
      ${c.gb([['buzzfan', '02/10/99', 'To infinity and beyond!'], ['woody_w', '25/11/99', 'My cousin in America saw it. He won\'t tell me ANYTHING. Good cousin.']], { title: 'Toy Box (Guestbook)' })}${foot(c)}</div>`;
  });
  def(YH, '/hunt.html', c => {
    c.after.push(() => {
      const got = new Set(), out = c.q('.out');
      c.qa('[data-toy]').forEach(t => t.addEventListener('click', () => { const i = t.dataset.toy; if (got.has(i)) return; got.add(i); t.classList.add('got'); sfx('pet'); out.textContent = `Toys found: ${got.size} of ${TOYS.length}`; if (got.size === TOYS.length) { out.textContent = 'ALL TOYS FOUND! Back in the toy box, everyone.'; S('cx.toys'); sfx('solve'); } }));
    });
    return `<div class="cxy"><h1>TOY HUNT</h1>${nav(c, YN)}<div class="box">Six toys are hiding on this page. Click each one to put it back in the toy box. Look carefully ${toy(0, 'width:14px;height:14px')}: some of them are very small, and one is hiding in a sentence.</div>
      <div class="box" style="min-height:160px;position:relative">The bedroom is a mess. There's a bed, a wardrobe, a box of crayons ${toy(2, 'width:14px;height:14px')} and a lot of socks.${toy(1, 'position:absolute;right:16px;bottom:10px;width:20px;height:20px')} Under the bed there is dust. Lots of dust. ${toy(3, 'width:12px;height:12px')} On the shelf there's a lamp and a piggy bank.<div style="position:absolute;left:30%;top:70%">${toy(4, 'width:16px;height:16px;opacity:.85')}</div></div>
      <p class="out" style="text-align:center;font-size:18px" aria-live="polite">Toys found: 0 of ${TOYS.length}</p><p style="text-align:right">${toy(5, 'width:13px;height:13px')}</p>${foot(c)}</div>`;
  });

  // ================================================================ SHOOTING STAR WATCH (Leonids)
  const LH = 'www.shootingstars.infobahn';
  css('cx-leo', `.cxl{background:#02021a;color:#dde;padding:14px 18px;font:14px/1.5 Verdana,Arial,sans-serif;min-height:inherit}
.cxl a{color:#9fd0ff}.cxl h1{font:bold 30px "Arial Black",Arial;text-align:center;color:#fff;margin:6px 0;text-shadow:0 0 10px #9fd0ff}.cxl .cxw-nav{text-align:center}
.cxl .box{border:1px solid #335;background:rgba(255,255,255,.04);padding:10px 12px;margin:10px 0}.cxl canvas{display:block;width:100%;max-width:520px;aspect-ratio:13/9;margin:0 auto;background:#000;border:2px solid #335;cursor:crosshair;touch-action:none}
.cxl .cnt{font:bold 22px "Courier New",monospace;text-align:center;color:#ffd400}.cxl .es-gb{color:#dde}.cxl .es-gb textarea{background:#000;color:#fff}`);
  const LN = [['/', 'Meteor News'], ['/count.html', 'Meteor Counter']];
  def(LH, '/', c => {
    const st = c.md < 1117 ? `<b>THE LEONIDS</b> are due on the night of <b>17-18 November</b> (${daysTo(c, '11-17')} days). The best time to look is in the early hours of the 18th, around 2am. Experts think Europe could get a meteor <b>STORM</b>: thousands of shooting stars an hour!`
      : c.md === 1117 ? '<b>IT\'S TONIGHT!</b> Wrap up warm, go somewhere dark, lie back and look up after midnight. Peak is around 2am. Ask a grown-up first!'
      : '<b>EUROPE GOT A STORM!</b> In the early hours of 18 November, at the peak (just after 2am), people in Spain and the Middle East saw dozens of meteors every MINUTE. In Britain it all depended on the clouds. If yours was cloudy... well, there\'s always 2000.';
    return `<div class="cxl"><h1>SHOOTING STAR WATCH</h1>${nav(c, LN)}<div class="box">${st}</div>
      <div class="box"><b>WHAT ARE THE LEONIDS?</b> A comet called <b>Tempel-Tuttle</b> goes round the Sun every 33 years and leaves a trail of dust behind it. Every November the Earth flies through the trail, and the dust burns up in the sky as shooting stars. They seem to come from the constellation Leo, which is why they're called the Leonids. When the comet has just been past (it came by last year), you can get a storm. In 1966, people in America saw thousands a minute!</div>
      <div class="box"><b>HOW TO WATCH:</b> no telescope needed. Get away from street lights, let your eyes get used to the dark for 20 minutes, lie on a camping mat, and look up. Bring a flask of hot chocolate. Bring a grown-up.</div>
      ${mates(c, [['11-18', 'Luke', 'I stayed up and saw SEVEN. Then I fell asleep on the sofa.'], ['11-18', 'Jack', 'Wasn\'t allowed to stay up. Counted them on this site instead.']])}
      ${c.gb([['stargazer_sal', '02/10/99', 'Can\'t wait!'], ['owl_al', '18/11/99', 'Saw a fireball! It was green!']], { title: 'Sightings Log (Guestbook)' })}${foot(c)}</div>`;
  });
  def(LH, '/count.html', c => {
    c.after.push(() => {
      const cv = c.q('canvas'), g = cv.getContext('2d'), Wd = 520, Ht = 360, out = c.q('.cnt'); let n = 0, ms = [];
      const stars = Array.from({ length: 90 }, (_, i) => [(i * 97) % Wd, (i * 61) % Ht, i % 9 ? 1 : 2]);
      cv.addEventListener('pointerdown', ev => {
        const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * Wd, y = (ev.clientY - r.top) / r.height * Ht;
        const hit = ms.find(m => !m.got && Math.hypot(m.x - x, m.y - y) < 34); if (!hit) return; hit.got = 1; n++; sfx('pet');
        out.textContent = `METEORS COUNTED: ${n}`; if (n === 50) { S('cx.meteors'); sfx('solve'); out.textContent = 'FIFTY! You are an official meteor counter!'; }
      });
      c.anim(dt => {
        if (Math.random() < dt * 2.2) ms.push({ x: 200 + Math.random() * 320, y: Math.random() * 120, vx: -260 - Math.random() * 120, vy: 140 + Math.random() * 80, life: 1 });
        g.fillStyle = '#000'; g.fillRect(0, 0, Wd, Ht); g.fillStyle = '#fff'; stars.forEach(([x, y, s]) => g.fillRect(x, y, s, s));
        ms.forEach(m => { m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt * 0.8; g.strokeStyle = m.got ? 'rgba(255,212,0,' + m.life + ')' : 'rgba(255,255,255,' + m.life + ')'; g.lineWidth = 2; g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m.x - m.vx * 0.12, m.y - m.vy * 0.12); g.stroke(); });
        ms = ms.filter(m => m.life > 0 && m.x > -40 && m.y < Ht + 40);
      });
    });
    return `<div class="cxl"><h1>METEOR COUNTER</h1>${nav(c, LN)}<p style="text-align:center">Click each shooting star as it zooms across the sky to count it. Can you count fifty?</p><canvas width="520" height="360" aria-label="Meteor counter"></canvas><p class="cnt" aria-live="polite">METEORS COUNTED: 0</p>${foot(c)}</div>`;
  });
})();
