/* cx-web-a: THE CLASS OF '99 pages, part 1 (lazy, from js/cx.js): the ring hub, ONE SMALL STEP (Apollo 11 at 30),
 * RED PLANET 99 (Mars), THE SPIRAL ZONE (Dreamcast), THE OWL POST (book club), SATURDAY MORNING TELLY, MEGAHERTZ WARS and
 * NEXT GEN WATCH. Every page follows the 1999 date (CXWeb.phase / past): nothing shows before it happened.
 * Facts (checked): Apollo 11 launch 16 Jul 1969, landing 20 Jul, first step ~3:56am UK 21 Jul, splashdown 24 Jul, ~21.5kg of
 * rock; Lunar Prospector crashed on purpose 31 Jul 1999 (Shoemaker crater, no plume seen, carried Gene Shoemaker's ashes);
 * Apollo 12 launch 14 Nov 1969 (lightning). Mars Climate Orbiter launched 11 Dec 1998, lost 23 Sep 1999 (pound-force s vs
 * newton s); Mars Polar Lander launched 3 Jan 1999, lost 3 Dec 1999 with the Deep Space 2 probes Amundsen and Scott; it
 * carried a microphone. Dreamcast: Japan 27 Nov 1998, US 9 Sep 1999, Europe 14 Oct 1999 at £199.99, SH-4 200MHz, PowerVR2,
 * 16MB RAM, GD-ROM, modem, VMU. Harry Potter: books 26 Jun 1997, 2 Jul 1998, 8 Jul 1999 (Bloomsbury), US 8 Sep 1999.
 * SM:TV Live from 29 Aug 1998 (Ant & Dec, Cat Deeley). Pentium III 26 Feb 1999 (450/500MHz), Athlon 23 Jun (500-650),
 * Coppermine 25 Oct (up to 733). PlayStation 2 shown 2 Mar 1999 (Emotion Engine, DVD, plays PS games), named + Japan date
 * 13 Sep; Nintendo "Dolphin" announced 12 May (with IBM and Matsushita). */
(function () {
  'use strict';
  const W = window.CXWeb; if (!W) return;
  const { def, css, esc, foot, nav, mates, phase, past, nice, mdOf, daysTo } = W;
  const S = W.secret, sfx = W.sfx;

  // ================================================================ THE CLASS OF '99 RING (hub)
  const RH = 'www.classof99ring.homepagez';
  css('cx-ring', `.cxr{background:#fff8d8 repeating-linear-gradient(0deg,transparent 0 23px,#e8dca8 23px 24px);padding:16px 18px;font:14px/1.45 "Comic Sans MS","Trebuchet MS",sans-serif}
.cxr h1{font:bold 30px "Arial Black",Arial;color:#000080;text-align:center;margin:4px 0;text-shadow:2px 2px #ffd400}
.cxr .cxr-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin:14px 0}
.cxr .cxr-s{background:#fff;border:3px ridge #c0c0c0;padding:8px}.cxr .cxr-s b{display:block;color:#000080}.cxr .cxr-s small{display:block;color:#555}`);
  def(RH, '/', c => {
    const L = W.RING();
    return `<div class="cxr"><h1>THE CLASS OF '99 RING</h1><p style="text-align:center"><b>${L.length}</b> member sites (and counting!) about the stuff everyone is talking about this year. Click a site to visit, or use the ring bar at the bottom of any member site to hop from one to the next.</p>
      <div class="cxr-l">${L.filter(h => h !== RH).map(h => { const r = window.CXSiteList.find(x => x[0] === h); return `<div class="cxr-s"><a href="http://${h}/"><b>${esc(r[2].replace(/ [-:].*$/, ''))}</b></a><small>${esc(h)}</small>${esc(r[4])}</div>`; }).join('')}</div>
      <p><b>HOW TO JOIN:</b> your site must be about something that happened in 1999, be nice, and have a hit counter. Sign the guestbook with your site address and the RingMaster will check it out. (The RingMaster is very busy. He has a paper round.)</p>
      ${c.gb([['RingMaster99', '02/01/99', 'Ring is OPEN! First member sites going up this week.'], ['webkid', '14/01/99', 'Can my site about my cat join? It happened in 1999. (The cat.)']], { title: 'Ring Guestbook / Join Requests', ph: 'Your site address and why it should join...' })}
      ${foot(c, { webmaster: 'RingMaster99' })}</div>`;
  });

  // ================================================================ ONE SMALL STEP (Apollo 11 at 30)
  const AH = 'www.onesmallstep.infobahn';
  css('cx-apollo', `.cxa{background:#05050f radial-gradient(circle at 80% 10%,#202040,transparent 50%);color:#e8e8ff;padding:14px 18px;font:14px/1.5 Verdana,Arial,sans-serif;min-height:inherit}
.cxa a{color:#ffd400}.cxa h1{font:bold 34px/1 "Arial Black",Arial;letter-spacing:2px;color:#fff;margin:8px 0;text-align:center}.cxa h1 small{display:block;font:bold 13px Verdana,Arial;letter-spacing:6px;color:#9fd0ff;margin-top:6px}
.cxa .cxw-nav{text-align:center}.cxa .big{font:bold 54px/1 "Courier New",monospace;color:#ffd400;text-align:center;text-shadow:0 0 12px #a07000}
.cxa .box{border:1px solid #445;background:rgba(255,255,255,.05);padding:10px 12px;margin:12px 0}.cxa .tl p{margin:6px 0}.cxa .tl b{color:#ffd400}
.cxa .es-ctr i{color:#ffd400}.cxa .es-gb{color:#e8e8ff}.cxa .es-gb textarea{background:#111;color:#fff}
.cxa canvas.lander{display:block;width:100%;max-width:520px;aspect-ratio:13/10;margin:0 auto;background:#000;border:2px solid #445;touch-action:none}
.cxa .ctl{display:flex;gap:8px;justify-content:center;margin:8px 0;flex-wrap:wrap}.cxa .ctl button{min-height:40px;min-width:120px}`);
  const AN = [['/', 'Home'], ['/story.html', 'The Story'], ['/land.html', 'Land the Eagle'], ['/news.html', 'Moon News']];
  const AMATES = [['01-05', 'Jack', 'I have a book about Apollo with fold-out pictures. The fold-out pictures are falling out. That\'s how much I\'ve read it.'], ['07-16', 'JackK', 'My grandad says he watched it on a tiny black and white telly at 4 in the morning. He says it was worth staying up for.'], ['07-21', 'Callum', 'Landed the Eagle on this site with 12% fuel left. Neil Armstrong had about 25 seconds of fuel left. I am basically Neil Armstrong.'], ['08-01', 'Luke', 'They crashed a probe into the Moon on purpose. My mom says that\'s what I do with my bike.']];
  def(AH, '/', c => {
    const toLaunch = daysTo(c, '07-16'), toLand = daysTo(c, '07-20');
    const head = c.md < 716 ? `<div class="box" style="text-align:center">The 30th anniversary of the first Moon landing is in<div class="big">${toLand} DAYS</div>Apollo 11 launched on <b>16 July 1969</b> and landed on <b>20 July 1969</b>. ${toLaunch > 0 ? `${toLaunch} days to go until the launch anniversary.` : ''}</div>`
      : c.md <= 720 ? `<div class="box" style="text-align:center"><div class="big">30 YEARS AGO ${c.md === 720 ? 'TODAY' : 'THIS WEEK'}</div>${c.md === 716 ? 'On this day in 1969 a giant Saturn V rocket launched three men from Florida towards the Moon.' : c.md === 720 ? 'On this day in 1969 the Eagle landed on the Moon. A few hours later Neil Armstrong stepped out. In Britain it was nearly 4 in the morning, and people stayed up to watch on the telly.' : 'Apollo 11 is on its way to the Moon (in 1969).'}</div>`
      : `<div class="box" style="text-align:center"><div class="big">30 YEARS!</div>On 20 July 1969, people walked on the Moon for the first time. Twelve people have walked on it so far, all between 1969 and 1972. Who's next?</div>`;
    return `<div class="cxa"><h1>ONE SMALL STEP<small>APOLLO 11 &middot; 1969-1999</small></h1>${nav(c, AN)}${head}
      <p>Welcome to my Moon page! In 1969 three astronauts went to the Moon in Apollo 11: <b>Neil Armstrong</b>, <b>Buzz Aldrin</b> and <b>Michael Collins</b>. Armstrong and Aldrin landed in a spidery little craft called the <b>Eagle</b>, while Collins stayed in orbit in the command module, <b>Columbia</b>. This year is the 30th anniversary, so I made this site. Read <a href="http://${AH}/story.html">the story</a>, then try to <a href="http://${AH}/land.html">land the Eagle</a> yourself. It's harder than it looks.</p>
      ${mates(c, AMATES)}${c.gb([['MoonKid', '04/01/99', 'Brilliant site! I want to be an astronaut.'], ['Mrs T', '22/02/99', 'My class is doing a project on space. Thank you for the facts.']], { title: 'Sign the Moon Log' })}${foot(c, { webmaster: Cast.n('club2') + ' (aged nearly an astronaut)' })}</div>`;
  });
  def(AH, '/story.html', c => `<div class="cxa"><h1>THE STORY<small>APOLLO 11, JULY 1969</small></h1>${nav(c, AN)}<div class="box tl">
    <p><b>16 July 1969:</b> A Saturn V rocket, as tall as a 36-storey building, launches from Florida with Armstrong, Aldrin and Collins on top.</p>
    <p><b>19 July:</b> Apollo 11 goes into orbit round the Moon.</p>
    <p><b>20 July:</b> Armstrong and Aldrin climb into the Eagle and fly down to the Sea of Tranquility. The computer flashes alarms on the way down and the planned spot is covered in boulders, so Armstrong flies it by hand to a safe place. They land with very little fuel left.</p>
    <p><b>21 July (UK time):</b> Just before 4am in Britain, Neil Armstrong steps onto the Moon. Buzz Aldrin follows. They walk around for about two and a half hours, collect rocks, set up experiments, plant a flag and leave a plaque.</p>
    <p><b>21 July:</b> The Eagle blasts off and docks with Collins in Columbia.</p>
    <p><b>24 July:</b> They splash down in the Pacific Ocean, safe. They bring back about 21 kilograms of Moon rock and dust.</p></div>
    <p>Their footprints are still up there, because there's no wind on the Moon to blow them away.</p>${foot(c)}</div>`);
  def(AH, '/news.html', c => {
    const N = past(c, [['01-01', 'Happy New Year from the Moon page! 1999 is the 30th anniversary of Apollo 11. Countdown on the home page.'],
      ['07-16', '<b>30 years</b> since Apollo 11 launched. Happy anniversary, Saturn V!'],
      ['07-20', '<b>30 years</b> since the Eagle landed. Lots of anniversary programmes on the telly tonight.'],
      ['07-31', '<b>NASA CRASHED A PROBE INTO THE MOON ON PURPOSE!</b> Lunar Prospector, which has been going round the Moon for a year and a half, was steered into a crater near the south pole to see if it would kick up any water from ice hiding in the shadows. Telescopes watched, but nobody saw a splash. The probe also carried some of the ashes of Gene Shoemaker, a famous scientist who studied craters, so he is the first person to be laid to rest on the Moon.'],
      ['11-14', '<b>30 years</b> since Apollo 12 launched. It was hit by lightning TWICE just after take-off, and still made it to the Moon. Tough rocket.']]);
    return `<div class="cxa"><h1>MOON NEWS</h1>${nav(c, AN)}${N.map(([k, t]) => `<div class="box"><b style="color:#ffd400">${nice(k)} 1999</b><br>${t}</div>`).join('')}${foot(c)}</div>`;
  });
  def(AH, '/land.html', c => {
    c.after.push(() => lander(c));
    return `<div class="cxa"><h1>LAND THE EAGLE<small>CAN YOU DO WHAT NEIL DID?</small></h1>${nav(c, AN)}<p style="text-align:center">Hold <b>FIRE</b> (or the space bar) to fire the engine and slow down. Land at <b>under 2 m/s</b> or it's a crunch. Don't run out of fuel!</p>
      <canvas class="lander" width="520" height="400" aria-label="Lunar lander game"></canvas><div class="ctl"><button class="es-btn" data-l="fire">FIRE ENGINE (hold)</button><button class="es-btn" data-l="go">START / AGAIN</button></div>${foot(c)}</div>`;
  });
  function lander(c) {
    const cv = c.q('canvas.lander'); if (!cv) return; const g = cv.getContext('2d'), Wd = 520, Ht = 400;
    let st = null, fire = false;
    const reset = () => { st = { y: 40, v: 0, fuel: 100, run: true, msg: '', alarm: 0, t: 0 }; };
    const ground = 360;
    const hills = Array.from({ length: 27 }, (_, i) => 350 + Math.sin(i * 1.7) * 6 + (i % 3) * 2);
    reset(); st.run = false; st.msg = 'Press START';
    const fb = c.q('[data-l=fire]'), gb = c.q('[data-l=go]');
    const on = v => ev => { ev.preventDefault(); fire = v; };
    ['pointerdown'].forEach(e => fb.addEventListener(e, on(true))); ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => fb.addEventListener(e, on(false)));
    gb.addEventListener('click', () => { reset(); sfx('click'); });
    const kd = ev => { if (!c.el.isConnected) return; if (ev.code === 'Space' && c.q('canvas.lander')) { ev.preventDefault(); fire = ev.type === 'keydown'; } };
    document.addEventListener('keydown', kd); document.addEventListener('keyup', kd); c.off(() => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', kd); });
    c.anim(dt => {
      if (st.run) {
        st.t += dt; const burn = fire && st.fuel > 0;
        st.v += (1.62 - (burn ? 4.2 : 0)) * dt; if (burn) st.fuel = Math.max(0, st.fuel - 9 * dt);
        st.y += st.v * dt * 6;
        if (st.t > 4 && st.t < 6.5) st.alarm = 1; else st.alarm = 0;
        if (st.y >= ground - 30) {
          st.y = ground - 30; st.run = false;
          if (st.v < 2) { st.msg = `THE EAGLE HAS LANDED! ${st.v.toFixed(1)} m/s, ${Math.round(st.fuel)}% fuel left.`; sfx('solve'); S('cx.eagle'); }
          else { st.msg = `CRUNCH! ${st.v.toFixed(1)} m/s is too fast. Try again!`; sfx('thud'); }
        }
      }
      g.fillStyle = '#000'; g.fillRect(0, 0, Wd, Ht);
      g.fillStyle = '#fff'; for (let i = 0; i < 60; i++) g.fillRect((i * 97) % Wd, (i * 53) % 300, 1, 1);
      g.fillStyle = '#2a7ad8'; g.beginPath(); g.arc(450, 60, 18, 0, 7); g.fill(); g.fillStyle = '#3a9a3a'; g.fillRect(440, 54, 10, 6);
      g.fillStyle = '#8a8a8a'; g.beginPath(); g.moveTo(0, Ht); hills.forEach((h, i) => g.lineTo(i * 20, h)); g.lineTo(Wd, Ht); g.fill();
      g.fillStyle = '#aaa'; g.fillRect(220, ground - 6, 80, 6);
      const x = 260, y = st.y;
      g.fillStyle = '#d8b040'; g.fillRect(x - 14, y + 4, 28, 14); g.fillStyle = '#ccc'; g.fillRect(x - 10, y - 10, 20, 14);
      g.strokeStyle = '#ccc'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 14, y + 18); g.lineTo(x - 22, y + 30); g.moveTo(x + 14, y + 18); g.lineTo(x + 22, y + 30); g.stroke();
      if (st.run && fire && st.fuel > 0) { g.fillStyle = Math.random() < 0.5 ? '#ff9a00' : '#ffd400'; g.beginPath(); g.moveTo(x - 6, y + 18); g.lineTo(x + 6, y + 18); g.lineTo(x, y + 30 + Math.random() * 10); g.fill(); }
      g.font = 'bold 14px Courier New, monospace'; g.fillStyle = '#3f3';
      g.fillText(`ALT ${Math.max(0, Math.round((ground - 30 - st.y) * 1.2))} m`, 12, 22); g.fillText(`SPEED ${st.v.toFixed(1)} m/s`, 12, 40);
      g.fillStyle = st.fuel < 20 ? '#f33' : '#3f3'; g.fillText(`FUEL ${Math.round(st.fuel)}%`, 12, 58);
      if (st.alarm) { g.fillStyle = '#f33'; g.fillText('PROGRAM ALARM 1202 (keep going!)', 12, 78); }
      if (st.msg) { g.font = 'bold 16px Verdana, Arial'; g.fillStyle = '#ffd400'; g.textAlign = 'center'; g.fillText(st.msg, Wd / 2, 200); g.textAlign = 'left'; }
    });
  }

  // ================================================================ RED PLANET 99 (Mars)
  const MH = 'www.redplanet99.cyb';
  css('cx-mars', `.cxm{background:#2a0a04 linear-gradient(#3a0e06,#1a0602);color:#ffe0c8;padding:14px 18px;font:14px/1.5 Tahoma,Arial,sans-serif;min-height:inherit}
.cxm a{color:#ffb070}.cxm h1{font:400 36px var(--mag);color:#ff6a2a;letter-spacing:3px;text-align:center;margin:6px 0;text-shadow:0 0 10px #a02000}
.cxm .cxw-nav{text-align:center}.cxm .probe{border:2px solid #a0401a;background:rgba(0,0,0,.35);padding:10px;margin:10px 0}.cxm .probe h3{margin:0 0 4px;color:#ffd0a0}
.cxm .stat{display:inline-block;font:bold 12px "Courier New",monospace;padding:2px 8px;border:1px solid}.cxm .ok{color:#3f3}.cxm .lost{color:#f55}.cxm .wait{color:#ffd400}
.cxm .uq{font:bold 18px Tahoma,Arial;margin:12px 0}.cxm .uo{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.cxm .uo button{min-height:40px;font:bold 14px Tahoma,Arial}
.cxm .es-gb{color:#ffe0c8}.cxm .es-gb textarea{background:#200;color:#fff}`);
  const MN = [['/', 'Mission Control'], ['/probes.html', 'The Probes'], ['/units.html', 'Units Patrol']];
  function marsStatus(c) {
    const mco = c.md < 923 ? `<span class="stat wait">CRUISING TO MARS</span> Arrives <b>23 September</b> (${daysTo(c, '09-23')} days).` : `<span class="stat lost">LOST</span> On 23 September it reached Mars, fired its engine to go into orbit, went behind the planet... and never came back out. It flew in far too low. The reason: one team's computer program worked in American units (pounds) and the other team expected metric (newtons). Nobody spotted it.`;
    const mpl = c.md < 1203 ? `<span class="stat wait">CRUISING TO MARS</span> Launched 3 January. Lands near the south pole on <b>3 December</b> (${daysTo(c, '12-03')} days).` : `<span class="stat lost">NO SIGNAL</span> On 3 December it went in to land near the south pole of Mars. NASA waited for it to call home. It never did. The two little Deep Space 2 probes riding with it (called <b>Amundsen</b> and <b>Scott</b>, after the South Pole explorers) were lost too. Nobody knows exactly what happened.`;
    return `<div class="probe"><h3>MARS CLIMATE ORBITER</h3>${mco}</div><div class="probe"><h3>MARS POLAR LANDER</h3>${mpl}</div>`;
  }
  def(MH, '/', c => `<div class="cxm"><h1>RED PLANET 99</h1>${nav(c, MN)}<p style="text-align:center">MISSION CONTROL (my bedroom) &middot; ${W.DAYS[c.t.date.getDay()]} ${nice(c.key)} 1999</p>${marsStatus(c)}
    <p>Two NASA probes are flying to Mars this year. The <b>Mars Climate Orbiter</b> (launched 11 December 1998) will go round and round Mars studying its weather, and the <b>Mars Polar Lander</b> will land near the icy south pole and dig in the soil. ${c.md >= 1203 ? 'This year has been a sad one for Mars fans. But NASA will try again. Mars isn\'t going anywhere.' : 'Fingers crossed for both of them!'}</p>
    ${c.md >= 923 ? '<p><b>LESSON OF THE YEAR:</b> always check your units! Try <a href="http://' + MH + '/units.html">Units Patrol</a> and see if you\'d have spotted it.</p>' : ''}
    ${mates(c, [['01-04', 'Jack', 'Written the landing date on my calendar in red pen: 3 December. That\'s 11 months away. I can wait. (I can\'t wait.)'], ['09-24', 'Callum', 'NASA lost a probe because of inches and centimetres. My maths teacher is going to bring this up FOREVER.'], ['12-04', 'Jack', 'Still listening. Still nothing. Mars is cursed.']])}
    ${c.gb([['RedRover', '05/01/99', 'Great site! Go Polar Lander!'], ['astro_amy', '11/02/99', 'Mars is my favourite planet. It has the biggest volcano in the solar system!']], { title: 'Mission Log (Guestbook)' })}${foot(c, { webmaster: 'Mission Controller ' + Cast.n('club2') })}</div>`);
  def(MH, '/probes.html', c => `<div class="cxm"><h1>THE PROBES</h1>${nav(c, MN)}${marsStatus(c)}
    <div class="probe"><h3>FUN FACTS</h3><p>Mars is about half the size of Earth and a day there is about 40 minutes longer than ours. It's red because of rusty dust.</p><p>The Polar Lander carries a tiny <b>microphone</b>, so we might hear what Mars sounds like for the very first time. Probably wind. Maybe a Martian saying "who's there?".</p><p>The two Deep Space 2 probes are the size of basketballs. They drop off the lander, smash into the ground and send back what's under the surface.</p></div>${foot(c)}</div>`);
  const UNITS = [['inches', 'centimetres', 2.54], ['miles', 'kilometres', 1.609], ['pounds (weight)', 'kilograms', 0.4536], ['feet', 'metres', 0.3048], ['pounds of force', 'newtons', 4.448], ['UK gallons', 'litres', 4.546], ['ounces', 'grams', 28.35], ['yards', 'metres', 0.9144]];
  def(MH, '/units.html', c => {
    c.after.push(() => {
      const box = c.q('.uq-box'); let n = 0, right = 0;
      const ask = () => {
        if (n >= 10) { box.innerHTML = `<p class="uq">You got <b>${right} out of 10</b>. ${right === 10 ? 'PERFECT! NASA should hire you. (Not yet. Finish school first.)' : 'Have another go. NASA wishes it had.'}</p><button class="es-btn" data-u="again">Play again</button>`; if (right === 10) { S('cx.units'); sfx('solve'); } box.querySelector('button').onclick = () => { n = 0; right = 0; ask(); }; return; }
        const [a, b, f] = UNITS[Math.floor(Math.random() * UNITS.length)], q = 2 + Math.floor(Math.random() * 18), ans = q * f;
        const fmt = v => (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10).toLocaleString('en-GB');
        const opts = [ans, ans / f / f, q, ans * 3].map(fmt).filter((v, i, x) => x.indexOf(v) === i); while (opts.length < 4) opts.push(fmt(ans * (opts.length + 1.7)));
        const shuffled = opts.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
        box.innerHTML = `<p>Question ${n + 1} of 10 &middot; Score: ${right}</p><p class="uq">${q} ${a} is about how many ${b}?</p><div class="uo">${shuffled.map(v => `<button class="es-btn" data-v="${v}">${v}</button>`).join('')}</div>`;
        box.querySelectorAll('[data-v]').forEach(bt => bt.onclick = () => { n++; if (bt.dataset.v === fmt(ans)) { right++; sfx('pet'); } else sfx('uhoh'); ask(); });
      };
      ask();
    });
    return `<div class="cxm"><h1>UNITS PATROL</h1>${nav(c, MN)}<p>${c.md >= 923 ? 'NASA lost a whole Mars probe because one lot of people used American units and the other lot used metric. Could you have caught it?' : 'Space engineers have to get their units right. Inches or centimetres? Pounds or kilograms? One mistake and your probe misses a whole planet. Practise here!'} Ten questions. Get all ten right.</p><div class="probe uq-box"></div>${foot(c)}</div>`;
  });

  // ================================================================ THE SPIRAL ZONE (Dreamcast)
  const DH = 'www.spiralzone.zyne';
  css('cx-dc', `.cxd{background:#f4f4f4;color:#222;padding:14px 18px;font:14px/1.5 Verdana,Arial,sans-serif;min-height:inherit}
.cxd a{color:#d04a00}.cxd .hd{display:flex;align-items:center;gap:12px;justify-content:center;flex-wrap:wrap}.cxd h1{font:bold 30px/1 "Arial Black",Arial;color:#e05a00;margin:0;letter-spacing:1px}.cxd h1 small{display:block;font:bold 12px Verdana;color:#888;letter-spacing:4px}
.cxd .sw{width:64px;height:64px;cursor:pointer}.cxd .sw:active{transform:rotate(40deg)}
.cxd .cxw-nav{text-align:center}.cxd .box{background:#fff;border:1px solid #ccc;border-left:6px solid #ff7a00;padding:10px 12px;margin:12px 0}
.cxd .cd{font:bold 40px "Courier New",monospace;color:#e05a00;text-align:center}.cxd table{border-collapse:collapse;width:100%}.cxd td,.cxd th{border:1px solid #ccc;padding:5px 8px;text-align:left;font-size:13px}
.cxd .vmu{width:160px;margin:10px auto;background:#e8e8e8;border:3px solid #999;border-radius:18px 18px 24px 24px;padding:10px;text-align:center}.cxd .vmu canvas{width:120px;height:80px;background:#9fb090;image-rendering:pixelated;border:2px inset #666}.cxd .vmu button{margin:4px 2px;min-height:28px}`);
  const DN = [['/', 'News'], ['/specs.html', 'Specs'], ['/games.html', 'Games']];
  const SWIRL = '<svg class="sw" viewBox="0 0 64 64" role="img" aria-label="The swirl" data-cxswirl="1"><circle cx="32" cy="32" r="30" fill="#fff" stroke="#ddd" stroke-width="2"/><path d="M32 32 m0-4 a4 4 0 1 1-4 4 a8 8 0 0 1 8-8 a12 12 0 0 1 12 12 a16 16 0 0 1-16 16 a20 20 0 0 1-20-20 a24 24 0 0 1 24-24" fill="none" stroke="#ff7a00" stroke-width="5" stroke-linecap="round"/></svg>';
  def(DH, '/', c => {
    let swirls = 0;
    c.after.push(() => { c.on('[data-cxswirl]', 'click', () => { swirls++; sfx('click'); if (swirls === 9) { S('cx.swirl'); sfx('solve'); c.toast('THE SPIRAL ZONE', '9 swirls for 9/9/99! You found the secret VMU toy at the bottom of the page.', 5000); const v = c.q('.vmu'); if (v) { v.hidden = false; vmu(c); } } }); });
    const cd = c.md < 901 ? `<div class="box"><b>WHEN DO WE GET IT?</b> It's been out in Japan since 27 November 1998. Segue say Europe gets it <b>this autumn</b>. America gets it on <b>9 September</b> (9/9/99, get it?). We will post the date the second we know.</div>`
      : c.md < 1014 ? `<div class="box" style="text-align:center"><b>UK LAUNCH: THURSDAY 14 OCTOBER 1999</b><div class="cd">${daysTo(c, '10-14')} DAYS</div>${c.md >= 909 ? 'It\'s out in America now (9/9/99) and it\'s selling like mad!' : 'America gets it first, on 9/9/99.'}</div>`
      : `<div class="box" style="text-align:center"><b>IT'S OUT!!!</b> The Daydream launched in the UK on <b>14 October 1999</b> for <b>&pound;199.99</b>, with a modem in the box so you can go online through your telly.</div>`;
    const news = past(c, [['01-01', 'Happy New Year, Daydream fans! Japan has had it since November. Our import friend says the graphics are "like the arcade at the seaside, but at home".'],
      ['09-09', '<b>9/9/99:</b> launched in America today! Huge queues, they say.'], ['10-14', '<b>UK LAUNCH DAY!</b> The shops opened and people went home with big boxes. Zip Adventure, Power Stone, Segue Rally 2 and more on day one.'], ['11-26', '<b>Soulcalibur</b> is out. The best-looking fighting game anyone has ever seen.']]);
    return `<div class="cxd"><div class="hd">${SWIRL}<h1>THE SPIRAL ZONE<small>UK DAYDREAM FANS</small></h1></div>${nav(c, DN)}${cd}${news.map(([k, t]) => `<p><b>${nice(k)}:</b> ${t}</p>`).join('')}
      ${mates(c, [['10-15', 'Callum', 'Got one. On the day. My dad queued. I said thank you about 40 times.'], ['10-16', 'Jack', 'Played Zip Adventure at Callum\'s. The whale. THE WHALE.'], ['12-01', 'Luke', 'Still an ULTRA 64 man. But I would not say no.']])}
      ${c.gb([['SegaSam', '03/01/99', 'Can\'t wait!!!'], ['blue_blur', '09/02/99', 'Does it play Mega Glide games? (No. I checked.)']], { title: 'Sign the Spiral Guestbook' })}<div class="vmu" hidden><b>SECRET VMU PET</b><br><canvas width="48" height="32"></canvas><br><button class="es-btn" data-vm="feed">Feed</button><button class="es-btn" data-vm="play">Play</button></div>${foot(c)}</div>`;
  });
  function vmu(c) {
    const cv = c.q('.vmu canvas'); if (!cv) return; const g = cv.getContext('2d'); let mood = 0, t = 0;
    c.qa('[data-vm]').forEach(b => b.onclick = () => { mood = 30; sfx('pet'); });
    c.every(() => { t++; if (mood > 0) mood--; g.fillStyle = '#9fb090'; g.fillRect(0, 0, 48, 32); g.fillStyle = '#203018'; const bx = 18 + Math.round(Math.sin(t / 3) * (mood ? 8 : 3)), by = mood ? 10 + (t % 2) * 2 : 12;
      g.fillRect(bx, by, 12, 10); g.fillRect(bx + 2, by - 3, 3, 3); g.fillRect(bx + 7, by - 3, 3, 3); g.fillStyle = '#9fb090'; g.fillRect(bx + 3, by + 3, 2, 2); g.fillRect(bx + 7, by + 3, 2, 2); g.fillStyle = '#203018'; g.fillRect(0, 26, 48, 1); if (mood) g.fillText('♥', bx + 14, by); }, 250);
  }
  def(DH, '/specs.html', c => `<div class="cxd"><div class="hd">${SWIRL}<h1>SPECS<small>WHAT'S INSIDE</small></h1></div>${nav(c, DN)}<table><tr><th>Bits</th><td>128-bit</td></tr><tr><th>Main chip</th><td>Hitachi SH-4, 200MHz</td></tr><tr><th>Graphics</th><td>PowerVR2 (made by NEC)</td></tr><tr><th>Memory</th><td>16MB main + 8MB for graphics</td></tr><tr><th>Discs</th><td>GD-ROM (about 1GB, more than a CD)</td></tr><tr><th>Modem</th><td>Built in! Go online through your telly</td></tr><tr><th>Controller ports</th><td>Four</td></tr><tr><th>Memory card</th><td>The VMU, with its own tiny screen and buttons: take a mini-game to school</td></tr></table>
    <p>Compare: Jack's PC is a Pentium II at 350MHz. Callum says "the Daydream destroys it". Jack says "my PC can do my homework". Callum says "so can my dad".</p>${foot(c)}</div>`);
  def(DH, '/games.html', c => {
    const L = c.md >= 1014 ? ['Zip Adventure', 'Power Stone', 'Segue Rally 2', 'Virtua Fighter 3tb', 'TrickStyle', 'Blue Stinger', 'Pen Pen TriIcelon', 'Incoming', 'Speed Devils', 'Monaco Grand Prix', 'Toy Commander', 'Ready 2 Rumble Boxing', 'Millennium Soldier: Expendable'] : null;
    return `<div class="cxd"><div class="hd">${SWIRL}<h1>GAMES<small>LAUNCH LINE-UP</small></h1></div>${nav(c, DN)}${L ? `<div class="box"><b>Out on UK launch day, 14 October 1999:</b><ul>${L.map(g => `<li>${g}</li>`).join('')}</ul>${c.md >= 1105 ? '<p><b>Since then:</b> The House of the Dead 2 (5 November)' + (c.md >= 1126 ? ', Soulcalibur (26 November)' : '') + '.</p>' : ''}</div>` : '<div class="box">The UK launch games haven\'t been announced yet. In Japan the big ones are a new Zip and some arcade conversions. Watch this space!</div>'}${foot(c)}</div>`;
  });

  // ================================================================ THE OWL POST (book club)
  const OH = 'www.owlpostfans.kidz';
  css('cx-owl', `.cxo{background:#f2e6c8 radial-gradient(circle at 20% 0,#fff8e0,transparent 60%);color:#3a2410;padding:14px 18px;font:15px/1.5 Georgia,"Times New Roman",serif;min-height:inherit}
.cxo a{color:#7a1010}.cxo h1{font:italic bold 34px Georgia,serif;color:#5a0a2a;text-align:center;margin:6px 0}.cxo .cxw-nav{text-align:center;font-family:Georgia}
.cxo .scroll{background:#fffaf0;border:2px solid #b08a50;border-radius:4px;padding:12px 14px;margin:12px 0;box-shadow:3px 3px 0 rgba(90,50,10,.25)}
.cxo .cd{font:bold 32px Georgia,serif;text-align:center;color:#5a0a2a}.cxo .qq{margin:10px 0}.cxo .qq label{display:block;padding:4px 0;cursor:pointer}
.cxo .house{font:bold 28px Georgia,serif;text-align:center;padding:10px;border:3px double #5a0a2a}`);
  const ON = [['/', 'The Owlery'], ['/books.html', 'The Books'], ['/quiz.html', 'The House Quiz']];
  def(OH, '/', c => {
    const top = c.md < 708 ? `<div class="scroll" style="text-align:center">Book three, <b>Harry Potter and the Prisoner of Azkaban</b>, comes out on <b>8 July 1999</b>.<div class="cd">${daysTo(c, '07-08')} days to go</div>Start re-reading the first two NOW.</div>`
      : c.md < 801 ? `<div class="scroll" style="text-align:center"><b>BOOK THREE IS OUT!</b> Prisoner of Azkaban came out on 8 July. <b>NO SPOILERS on this site until 1 August</b>, so everyone has time to finish it. That includes YOU, Dave.</div>`
      : `<div class="scroll" style="text-align:center"><b>Book three is out</b> (8 July) and it\'s the best one yet. ${c.md >= 908 ? 'It\'s out in America now too (8 September). ' : ''}The author is planning <b>seven</b> books in total, one for each year at the school. That means four more. FOUR.</div>`;
    return `<div class="cxo"><h1>The Owl Post</h1>${nav(c, ON)}${top}<p>Welcome to the Owl Post, a fan club for the <b>Harry Potter</b> books by J.K. Rowling. Everyone at school is reading them, even people who say they don't like reading. Our club rule: <b>no spoilers</b> for anyone who hasn't finished a book yet. Take the <a href="http://${OH}/quiz.html">House Quiz</a> to find out where you belong!</p>
      ${mates(c, [['02-11', 'JackK', 'My teacher read the first one to our class and stopped every day at the best bit. ON PURPOSE.'], ['07-09', 'Jack', 'Mom got it for me. Read it in two days. I had to hide it from Dave so he couldn\'t tell me the end.'], ['07-12', 'Luke', 'Finished it. Not telling. My lips are sealed.']])}
      ${c.gb([['bookworm99', '07/01/99', 'Best books EVER.'], ['Hedwig_fan', '01/03/99', 'I wish I got a letter by owl. I got a letter from the dentist.']], { title: 'Send an Owl (Guestbook)', ph: 'No spoilers please!' })}${foot(c, { webmaster: 'The Head Owl' })}</div>`;
  });
  def(OH, '/books.html', c => `<div class="cxo"><h1>The Books</h1>${nav(c, ON)}${[['Harry Potter and the Philosopher\'s Stone', '26 June 1997', 'Book one. A boy who lives in a cupboard under the stairs finds out he\'s a wizard and goes to a school for magic.'], ['Harry Potter and the Chamber of Secrets', '2 July 1998', 'Book two. Year two at school, and something is hiding in the castle.'], ['Harry Potter and the Prisoner of Azkaban', '8 July 1999', c.md < 708 ? 'Book three. Coming soon! Nobody knows much about it yet.' : c.md < 801 ? 'Book three. OUT NOW! No spoilers until 1 August.' : 'Book three. Out now, and everyone says it\'s the best yet. (Still no big spoilers here. Read it!)']].map(([t, d, x]) => `<div class="scroll"><b>${t}</b><br><i>UK: ${d}</i><br>${x}</div>`).join('')}${foot(c)}</div>`);
  def(OH, '/quiz.html', c => {
    const Q = [['It\'s the weekend. You...', ['go on an adventure', 'help out a friend', 'read a good book', 'plan how to win at something']], ['Your favourite lesson is...', ['PE', 'Art', 'Science', 'Anything I\'m top of']], ['Pick a pet:', ['a lion (it\'s allowed)', 'a badger', 'an eagle', 'a snake']], ['Someone takes your seat. You...', ['say "OI!"', 'sit somewhere else, it\'s fine', 'point out the seating plan', 'remember it. Forever.']], ['Your best quality:', ['bravery', 'loyalty', 'cleverness', 'ambition']]];
    c.after.push(() => c.on('form', 'submit', ev => {
      ev.preventDefault(); const sc = [0, 0, 0, 0]; let n = 0;
      Q.forEach((q, i) => { const x = c.q(`input[name=hq${i}]:checked`); if (x) { sc[+x.value]++; n++; } });
      const out = c.q('.house'); if (n < Q.length) { out.textContent = 'Answer all five questions first!'; return; }
      const H = ['GRYFFINDOR', 'HUFFLEPUFF', 'RAVENCLAW', 'SLYTHERIN'], best = sc.indexOf(Math.max(...sc));
      out.innerHTML = `You belong in... <br>${H[best]}!`; sfx('solve'); S('cx.sorted');
    }));
    return `<div class="cxo"><h1>The House Quiz</h1>${nav(c, ON)}<p>At the school in the books, every new pupil is sorted into one of four houses. Answer five questions to find out which one is yours. (Just for fun! This is not official. Nothing here is official. We are a fan club.)</p><form class="scroll">${Q.map((q, i) => `<div class="qq"><b>${i + 1}. ${q[0]}</b>${q[1].map((o, j) => `<label><input type="radio" name="hq${i}" value="${j}"> ${o}</label>`).join('')}</div>`).join('')}<button class="es-btn" type="submit">Sort me!</button></form><div class="house" aria-live="polite">?</div>${foot(c)}</div>`;
  });

  // ================================================================ SATURDAY MORNING TELLY
  const TH = 'www.saturdaytelly.toonz';
  css('cx-telly', `.cxt{background:#1a0a5a repeating-linear-gradient(90deg,#1a0a5a 0 40px,#220e6a 40px 80px);color:#fff;padding:14px 18px;font:14px/1.45 "Trebuchet MS",Arial,sans-serif;min-height:inherit}
.cxt a{color:#ffd400}.cxt h1{font:400 38px/1 var(--mag);text-align:center;color:#ff4aa8;text-shadow:3px 3px #000;margin:6px 0;transform:rotate(-2deg)}.cxt .cxw-nav{text-align:center}
.cxt .tv{background:#000;border:6px solid #555;border-radius:14px;padding:10px 12px;margin:12px 0}.cxt .tv h3{margin:0 0 4px;color:#3affff}
.cxt .pad{display:grid;grid-template-columns:repeat(3,60px);gap:6px;justify-content:center;margin:10px 0}.cxt .pad button{min-height:44px;font:bold 18px Arial}
.cxt .word{font:bold 30px "Courier New",monospace;letter-spacing:6px;text-align:center;color:#ffd400}.cxt .ab{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}.cxt .ab button{width:34px;min-height:34px;font:bold 14px Arial}
.cxt .es-gb{color:#fff}.cxt .es-gb textarea{background:#000;color:#fff}`);
  const TN = [['/', 'The Guide'], ['/phonein.html', 'The Phone-In']];
  def(TH, '/', c => {
    const LK = phase(c, [['01-01', 'BBC One\'s Saturday morning show with games, cartoons, bands and phone-ins.'], ['04-01', 'BBC One\'s Saturday morning show with games, cartoons, bands and phone-ins. Big news this year: the two main presenters are leaving, and new ones take over in the autumn.'], ['10-01', 'BBC One\'s Saturday morning show has new presenters for the autumn after the old pair left. Same cartoons, same bands, new faces.']]);
    return `<div class="cxt"><h1>SATURDAY MORNING TELLY!</h1>${nav(c, TN)}<p style="text-align:center">The best two hours of the week. Get your cereal, get the good spot on the sofa, and DON'T let your little brother have the remote.</p>
      <div class="tv"><h3>SM:TV LIVE (ITV)</h3>Ant &amp; Dec and Cat Deeley, live every Saturday morning since August 1998. Cartoons, silly sketches like <b>Chums</b> (a spoof of a certain American programme about friends in a flat), and daft phone-in games. Followed by <b>CD:UK</b> with all the bands.</div>
      <div class="tv"><h3>LIVE &amp; KICKING (BBC ONE)</h3>${LK}</div>
      <div class="tv"><h3>CARTOONS</h3>${c.md >= 329 ? 'The Pocket Critters cartoon started on satellite telly on 29 March. Everyone who has satellite is suddenly very popular.' : 'Loads, all morning. And the new Japanese monster cartoon everyone in America is talking about? Fingers crossed it comes here soon.'}</div>
      <p><b>VOTE:</b> which is the best Saturday show? Write it in the guestbook! Then try our own <a href="http://${TH}/phonein.html">Phone-In</a>.</p>
      ${c.gb([['sofa_king', '09/01/99', 'SM:TV forever!!!'], ['cartoon_carl', '16/01/99', 'I get up at 7 for the cartoons. On a SATURDAY. My mom thinks I am ill.']], { title: 'The Big Vote (Guestbook)' })}${foot(c)}</div>`;
  });
  def(TH, '/phonein.html', c => {
    const WORDS = ['COMPUTER', 'DINOSAUR', 'SPACESHIP', 'ROBOT', 'CHOCOLATE', 'PENGUIN', 'SKATEBOARD', 'VOLCANO', 'TELESCOPE', 'HAMSTER'];
    c.after.push(() => {
      const box = c.q('.game'); let dialled = '';
      const dial = () => {
        box.innerHTML = `<p style="text-align:center">Dial the number on the screen to get through: <b>1999 1999</b></p><div class="word">${dialled.padEnd(8, '_')}</div><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map(k => `<button class="es-btn" data-k="${k}">${k}</button>`).join('')}</div>`;
        box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { sfx('beep'); dialled += b.dataset.k; if (dialled.length >= 8) { if (dialled === '19991999') { sfx('modem'); game(); } else { dialled = ''; c.toast('Phone-In', 'Wrong number! You got through to a man called Derek. Try again.', 3000); dial(); } } else dial(); });
      };
      const game = () => {
        const w = WORDS[Math.floor(Math.random() * WORDS.length)], got = new Set(); let miss = 0;
        const draw = () => {
          const shown = w.split('').map(ch => got.has(ch) ? ch : '_').join(''), won = !shown.includes('_');
          box.innerHTML = `<p style="text-align:center">YOU'RE ON AIR! Guess the hidden word, one letter at a time. ${6 - miss} wrong guesses left.</p><div class="word">${shown}</div>${won ? '<p style="text-align:center;font-size:18px"><b>YOU WIN!!!</b> A signed photo and a T-shirt are in the post (they are not).</p><button class="es-btn" data-again="1">Ring again</button>' : miss >= 6 ? `<p style="text-align:center">OH NO! It was <b>${w}</b>. Thanks for calling!</p><button class="es-btn" data-again="1">Ring again</button>` : `<div class="ab">${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => `<button class="es-btn" data-l="${l}"${got.has(l) ? ' disabled' : ''}>${l}</button>`).join('')}</div>`}`;
          if (won) { S('cx.wonkey'); sfx('solve'); }
          box.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { const l = b.dataset.l; got.add(l); if (!w.includes(l)) { miss++; sfx('uhoh'); } else sfx('pet'); draw(); });
          const ag = box.querySelector('[data-again]'); if (ag) ag.onclick = () => { dialled = ''; dial(); };
        };
        draw();
      };
      dial();
    });
    return `<div class="cxt"><h1>THE PHONE-IN!</h1>${nav(c, TN)}<p style="text-align:center">Get through on the phone, guess the word, win a prize! (Ask the bill-payer first. Calls cost 50p a minute. They don't really. It's a website.)</p><div class="tv game"></div>${foot(c)}</div>`;
  });

  // ================================================================ MEGAHERTZ WARS (chips)
  const CH = 'www.mhzwars.cyb';
  css('cx-chip', `.cxc2{background:#000;color:#3f3;padding:14px 18px;font:14px/1.45 "Courier New",monospace;min-height:inherit}
.cxc2 a{color:#9f9}.cxc2 h1{font:bold 30px "Courier New",monospace;text-align:center;color:#3f3;text-shadow:0 0 8px #0a0;margin:6px 0}.cxc2 .cxw-nav{text-align:center}
.cxc2 table{width:100%;border-collapse:collapse;margin:10px 0}.cxc2 td,.cxc2 th{border:1px solid #0a0;padding:5px;text-align:left}.cxc2 .bar{height:12px;background:#3f3}
.cxc2 .oc{border:2px solid #0a0;padding:12px;margin:12px 0;text-align:center}.cxc2 .temp{height:16px;background:#030;border:1px solid #0a0;position:relative}.cxc2 .temp i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#3f3,#ff0,#f30)}
.cxc2 .chipart{width:120px;height:120px;margin:10px auto;display:block}.cxc2 .melt{animation:cxmelt 1.2s forwards}@keyframes cxmelt{to{transform:scaleY(.2) translateY(200px);filter:hue-rotate(90deg)}}
.cxc2 input[type=range]{width:100%;max-width:360px}.cxc2 .es-gb{color:#3f3}.cxc2 .es-gb textarea{background:#020;color:#3f3}`);
  const CN = [['/', 'The Chip Race'], ['/oc.html', 'Overclock-o-Matic']];
  def(CH, '/', c => {
    const rows = [['1998', 'Pentium II', 450, 'The fastest Pentium II. Our PC is a Pentium II 350.'], ['02-26', 'Pentium III', 500, 'Launched 26 Feb at 450 and 500MHz, with new instructions for 3D and video.'], ['06-23', 'AMD Athlon', 650, 'Launched 23 June at 500 to 650MHz. AMD takes the speed crown!'], ['10-25', 'Pentium III "Coppermine"', 733, 'Launched 25 Oct, up to 733MHz, with the cache built into the chip.']]
      .filter(r => r[0] === '1998' || mdOf(r[0]) <= c.md);
    const top = Math.max(...rows.map(r => r[2]));
    return `<div class="cxc2"><h1>&gt; MEGAHERTZ WARS_</h1>${nav(c, CN)}<p>WHO MAKES THE FASTEST CHIP? The race is on between Intel and AMD, and the megahertz keep going up. Here is the fastest chip you can buy, as of ${nice(c.key)} 1999:</p>
      <table><tr><th>When</th><th>Chip</th><th>Top speed</th><th></th></tr>${rows.map(r => `<tr><td>${r[0] === '1998' ? '1998' : nice(r[0])}</td><td>${r[1]}</td><td>${r[2]}MHz</td><td style="width:35%"><div class="bar" style="width:${Math.round(r[2] / 1000 * 100)}%"></div></td></tr>`).join('')}</table>
      <p>Current record: <b>${top}MHz</b>. People say someone will make a <b>1,000MHz</b> chip (that's 1 GIGAHERTZ) soon. My dad says "what would you even DO with that?" I would play Jaquake. Very fast.</p>
      ${mates(c, [['02-27', 'Callum', 'Pentium III 500. I want it. I need it. I am writing to Father Christmas early.'], ['06-24', 'Jack', 'The Athlon is out. My cousin says it\'s faster. My cousin is RIGHT for once.'], ['10-26', 'Callum', '733MHz. My PC is now officially old. It is ten months old.']])}
      ${c.gb([['MhzMad', '01/03/99', 'Overclocked my Celeron. It works! (It smells a bit.)'], ['bytehead', '24/06/99', 'GO AMD!!!']], { title: 'The Benchmark Board (Guestbook)' })}${foot(c, { best: 'Best viewed on a Pentium III 500 (we wish)' })}</div>`;
  });
  def(CH, '/oc.html', c => {
    c.after.push(() => {
      const r = c.q('input'), out = c.q('.mhz'), tp = c.q('.temp i'), chip = c.q('.chipart'), msg = c.q('.ocmsg'); let melted = false;
      r.addEventListener('input', () => {
        if (melted) return; const v = +r.value, heat = Math.min(100, Math.max(0, (v - 350) / 2.2));
        out.textContent = v + 'MHz'; tp.style.width = heat + '%';
        msg.textContent = v < 400 ? 'Nice and cool. Boring, but cool.' : v < 450 ? 'Getting warm. Fan is spinning faster.' : v < 520 ? 'HOT. The fan sounds like a hairdryer.' : v < 560 ? 'SMOKE! STOP! STOP!' : '';
        if (v >= 570) { melted = true; chip.classList.add('melt'); msg.textContent = 'IT MELTED. You have made a very expensive puddle. (This is why you don\'t overclock Dad\'s computer.)'; sfx('zap'); S('cx.melt'); }
      });
      c.on('[data-reset]', 'click', () => { melted = false; chip.classList.remove('melt'); r.value = 350; r.dispatchEvent(new Event('input')); });
    });
    return `<div class="cxc2"><h1>&gt; OVERCLOCK-O-MATIC_</h1>${nav(c, CN)}<p>"Overclocking" means making a chip run faster than it says on the box. It makes it HOT. Try it here on our pretend Pentium II 350, so you never try it on a real one.</p>
      <div class="oc"><svg class="chipart" viewBox="0 0 60 60" aria-hidden="true"><rect x="10" y="10" width="40" height="40" fill="#222" stroke="#3f3"/><rect x="20" y="20" width="20" height="20" fill="#555"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${14 + i * 6} 10v-6M${14 + i * 6} 50v6M10 ${14 + i * 6}h-6M50 ${14 + i * 6}h6" stroke="#ccc"/>`).join('')}</svg>
      <div class="mhz" style="font-size:28px">350MHz</div><input type="range" min="350" max="600" step="10" value="350" aria-label="Clock speed"><div class="temp"><i style="width:0"></i></div><p class="ocmsg">Nice and cool. Boring, but cool.</p><button class="es-btn" data-reset="1">Buy a new chip</button></div>${foot(c)}</div>`;
  });

  // ================================================================ NEXT GEN WATCH (consoles)
  const NH = 'www.nextgenwatch.netz';
  css('cx-ng', `.cxn{background:#101820;color:#dde;padding:14px 18px;font:14px/1.45 Verdana,Arial,sans-serif;min-height:inherit}
.cxn a{color:#7cf}.cxn h1{font:bold 30px "Arial Black",Arial;text-align:center;color:#fff;margin:6px 0;letter-spacing:2px}.cxn h1 b{color:#f33}.cxn .cxw-nav{text-align:center}
.cxn .rm{border:1px solid #345;background:#18242e;padding:10px 12px;margin:10px 0;position:relative}.cxn .rm .st{position:absolute;right:8px;top:8px;font:bold 13px "Arial Black",Arial;padding:2px 8px;transform:rotate(6deg);border:3px solid}
.cxn .true{color:#3f3;border-color:#3f3}.cxn .false{color:#f44;border-color:#f44}.cxn .tbc{color:#fd0;border-color:#fd0}.cxn .rm .b{margin-top:6px}.cxn .rm .b button{min-height:30px}`);
  const NN = [['/', 'News'], ['/rumours.html', 'Rumour Mill']];
  const RUMS = [['01-01', 'Somy are making a new PlaySpace that will be as powerful as a film studio\'s computer.', '03-02', 'true', 'Sort of TRUE! On 2 March Somy showed off the next PlaySpace and its new "Emotion Engine" chip. Very powerful. Film-studio-ish.'],
    ['01-01', 'The next PlaySpace will play DVD films.', '03-02', 'true', 'TRUE! Announced on 2 March.'],
    ['01-01', 'The next PlaySpace will play your old PlaySpace games.', '03-02', 'true', 'TRUE! Your old games will still work.'],
    ['01-01', 'The next PlaySpace will be called the PlaySpace 9000.', '09-13', 'false', 'FALSE. On 13 September it got its real name: PlaySpace 2. (Boring, but sensible.)'],
    ['03-02', 'Ultra Entertainment are making a new console and its codename is a sea animal.', '05-12', 'true', 'TRUE! On 12 May Ultra Entertainment said its next console is codenamed "Dolphin", with chips from IBM and discs made with Matsushita.'],
    ['05-12', 'The Dolphin console comes with a real dolphin.', '05-12', 'false', 'FALSE. Obviously. Where would you keep it?'],
    ['05-12', 'You will be able to plug your toaster into the next consoles.', '05-12', 'false', 'FALSE. Please do not plug your toaster into anything except the wall.'],
    ['09-13', 'PlaySpace 2 comes out in Japan in March 2000.', '09-13', 'true', 'TRUE! 4 March 2000 in Japan. No date for us yet.']];
  def(NH, '/', c => {
    const N = past(c, [['01-01', 'Welcome to NEXT GEN WATCH! The Daydream is out in Japan. What are Somy and Ultra Entertainment doing? Nobody knows. That\'s where we come in.'], ['03-02', '<b>SOMY SHOWS ITS NEXT PLAYSPACE!</b> A new chip called the Emotion Engine, it plays DVDs, and your old PlaySpace games will work on it. No name yet, no date yet.'], ['05-12', '<b>ULTRA ENTERTAINMENT\'S "DOLPHIN"!</b> At the big games show in America, Ultra Entertainment said its next console is codenamed Dolphin. It\'ll use discs, not cartridges!'], ['09-13', '<b>IT\'S CALLED PLAYSPACE 2</b> and it comes out in Japan on 4 March 2000.']]);
    return `<div class="cxn"><h1>NEXT GEN <b>WATCH</b></h1>${nav(c, NN)}${N.map(([k, t]) => `<div class="rm"><b>${nice(k)}:</b> ${t}</div>`).join('')}<p>Got a rumour? Post it in the guestbook. We check every one. (We don't. We just put TRUE or FALSE on them when we find out.)</p>${c.gb([['insider_ian', '04/01/99', 'My uncle works at a games shop and says the next PlaySpace will have 4 discs at once.'], ['n64kid', '13/05/99', 'DOLPHIN!!! Best name ever.']], { title: 'Rumour Box (Guestbook)' })}${foot(c)}</div>`;
  });
  def(NH, '/rumours.html', c => {
    const L = RUMS.filter(r => mdOf(r[0]) <= c.md);
    c.after.push(() => {
      const believed = new Set();
      c.qa('[data-bel]').forEach(b => b.onclick = () => { believed.add(b.dataset.bel); b.disabled = true; b.textContent = 'You believe it!'; sfx('click'); if (believed.size >= L.length && L.length >= 4) { S('cx.rumour'); c.toast('NEXT GEN WATCH', 'You believed EVERY rumour. Now check which ones turned out true...', 4500); } });
    });
    return `<div class="cxn"><h1>RUMOUR <b>MILL</b></h1>${nav(c, NN)}<p>Every rumour going round the playground. When we find out the truth, it gets stamped.</p>${L.map((r, i) => { const known = mdOf(r[2]) <= c.md; return `<div class="rm"><span class="st ${known ? r[3] : 'tbc'}">${known ? r[3].toUpperCase() : '???'}</span>${r[1]}${known ? `<div class="b"><small>${r[4]}</small></div>` : ''}<div class="b"><button class="es-btn" data-bel="${i}">I believe it</button></div></div>`; }).join('')}${foot(c)}</div>`;
  });
})();
