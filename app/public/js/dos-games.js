/* dos-games: the DOS shareware folder. JACKCRAWL (roguelike), DAKKA = Flak Attack! (paratrooper-style), SQUIGPIE =
 * Chip Van Tycoon (business game), SQUIGHUNT = Alien Hunt (20 caves), TRUKKRACE = Turbo Racer (text-mode road racer), INTRO (a demoscene
 * intro: plasma, copper bars, sine scroller, chiptune), TPAINT (text-mode paint, saves .ANS), JACKTRAK (a tiny
 * music tracker) and TEEFWARS (a BBS door game). All original. Loaded lazily. */
(function () {
  'use strict';
  const DOS = window.DOS, K = DOS.core, A = window.Apps, P = DOS.progs;
  const S = id => { try { return A.secret('dos.' + id); } catch (e) { return false; } };
  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  const lpad = (s, n) => String(s).padStart(n).slice(-n);
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const isEsc = e => e && (e.key === 'Escape' || (e.ctrl && /^[cC]$/.test(e.key)));
  // saved games (js/gamesave.js): a refresh or a closed window never loses a game. Run it again and it carries on.
  const GS = {
    load: (k, v) => { try { return A.loadGame ? A.loadGame('dos.' + k, v) : null; } catch (e) { return null; } },
    save: (k, st, v) => { try { if (A.saveGame) A.saveGame('dos.' + k, st, { v }); } catch (e) {} },
    clear: k => { try { if (A.clearGame) A.clearGame('dos.' + k); } catch (e) {} },
  };
  async function pressAny(host, s, msg, a) { const W = s.cols, H = s.rows; s.fill(0, H - 1, W, 1, ' ', a == null ? 0x70 : a); s.print(Math.max(0, Math.floor((W - msg.length) / 2)), H - 1, msg, a == null ? 0x70 : a); host.flush(); return host.readKey(); }

  const RP = n => n + (n === 1 ? ' Rupee' : ' Rupees'); // money text
  // ================================================================ JACKCRAWL: a roguelike
  P.grotcrawl = (sh) => DOS.screenProg(sh, async (host, s) => {
    host.setMouse(false); s.cur.on = false;
    const W = s.cols, H = s.rows, MW = Math.min(W, 78), MH = H - 4;
    let level = 1, hp = 20, maxhp = 20, atk = 3, def = 0, teef = 0, turns = 0, msg = 'Welcome to JACKCRAWL. Arrows move. Bump into things to hit them. > goes down.';
    let map, mons, items, px, py, sx, sy;
    const T = { wall: '#', floor: '.', stairs: '>' };
    function gen() {
      map = []; for (let y = 0; y < MH; y++) map.push(new Array(MW).fill(T.wall));
      const rooms = []; let tries = 0;
      while (rooms.length < 7 && tries++ < 200) { const w = 5 + rnd(10), h = 3 + rnd(4), x = 1 + rnd(MW - w - 2), y = 1 + rnd(MH - h - 2); if (rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y)) continue; rooms.push({ x, y, w, h }); for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) map[yy][xx] = T.floor; }
      const c = r => [r.x + (r.w >> 1), r.y + (r.h >> 1)];
      for (let i = 1; i < rooms.length; i++) { let [x1, y1] = c(rooms[i - 1]); const [x2, y2] = c(rooms[i]); while (x1 !== x2) { map[y1][x1] = T.floor; x1 += Math.sign(x2 - x1); } while (y1 !== y2) { map[y1][x1] = T.floor; y1 += Math.sign(y2 - y1); } }
      [px, py] = c(rooms[0]); [sx, sy] = c(rooms[rooms.length - 1]); map[sy][sx] = T.stairs;
      mons = []; items = [];
      const free = () => { for (;;) { const r = pick(rooms.slice(1)); const x = r.x + rnd(r.w), y = r.y + rnd(r.h); if (map[y][x] === T.floor && !(x === px && y === py) && !mons.some(m => m.x === x && m.y === y) && !items.some(it => it.x === x && it.y === y)) return [x, y]; } };
      for (let i = 0; i < 4 + level * 2; i++) { const [x, y] = free(); const kind = rnd(10) < 6 ? 'g' : 's'; mons.push({ x, y, ch: kind, hp: kind === 'g' ? 3 + level : 6 + level * 2, atk: kind === 'g' ? 1 + (level >> 1) : 2 + level, name: kind === 'g' ? 'goblin' : 'slime', col: kind === 'g' ? 0x0a : 0x0c }); }
      if (level === 5) { const [x, y] = [sx, sy - 1 >= 0 && map[sy - 1][sx] === T.floor ? sy - 1 : sy + 1]; mons.push({ x, y, ch: 'W', hp: 24, atk: 4, name: 'the Wizard Gorzag', col: 0x0e, boss: true }); }
      for (let i = 0; i < 3 + rnd(3); i++) { const [x, y] = free(); items.push({ x, y, ch: '$', name: 'teef' }); }
      for (let i = 0; i < 2; i++) { const [x, y] = free(); items.push({ x, y, ch: '!', name: 'potion' }); }
      if (level === 2 || level === 4) { const [x, y] = free(); items.push({ x, y, ch: '/', name: 'sword' }); }
      if (level === 3) { const [x, y] = free(); items.push({ x, y, ch: ']', name: 'saucepan lid (armour)' }); }
    }
    function draw() {
      s.clear(0);
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const c = map[y][x]; s.set(x, y + 1, c, c === T.wall ? 0x08 : c === T.stairs ? 0x0f : 0x07); }
      items.forEach(it => s.set(it.x, it.y + 1, it.ch, it.ch === '$' ? 0x0e : it.ch === '!' ? 0x0d : 0x0b));
      mons.forEach(m => s.set(m.x, m.y + 1, m.ch, m.col));
      s.set(px, py + 1, '@', 0x0f);
      s.fill(0, 0, W, 1, ' ', 0x00); s.print(0, 0, msg.slice(0, W), 0x07);
      s.fill(0, H - 2, W, 1, ' ', 0x70); s.print(1, H - 2, `Level ${level}   HP ${hp}/${maxhp}   Atk ${atk}   Def ${def}   Rupees ${teef}   Turns ${turns}`, 0x70);
      s.fill(0, H - 1, W, 1, ' ', 0x00); s.print(1, H - 1, 'Arrows/HJKL move  .=wait  Q=quit   @ you  g goblin  s slime  W wizard  $ rupees  ! potion  / sword', 0x08);
    }
    const dirs = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], k: [0, -1], j: [0, 1], h: [-1, 0], l: [1, 0], y: [-1, -1], u: [1, -1], b: [-1, 1], n: [1, 1], Home: [-1, -1], PageUp: [1, -1], End: [-1, 1], PageDown: [1, 1] };
    const keep = () => GS.save('crawl', { level, hp, maxhp, atk, def, teef, turns, msg, map: map.map(r => r.join('')), mons, items, px, py, sx, sy, MW, MH }, 1);
    const old = GS.load('crawl', 1);
    if (old && old.MW === MW && old.MH === MH && Array.isArray(old.map) && old.map.length === MH && Array.isArray(old.mons) && Array.isArray(old.items)) {
      ({ level, hp, maxhp, atk, def, teef, turns, px, py, sx, sy } = old); map = old.map.map(r => String(r).split('')); mons = old.mons; items = old.items;
      mons.forEach(m => { m.name = m.boss ? 'the Wizard Gorzag' : m.ch === 'g' ? 'goblin' : m.ch === 's' ? 'slime' : m.name; }); // old saves had the old names
      msg = 'Saved game loaded. Level ' + level + '. Carry on!';
    } else gen();
    draw();
    for (;;) {
      const e = await host.readKey();
      if (isEsc(e) || /^[qQ]$/.test(e.key)) { const q = await K.msgBox(host, 'Leave the dungeon? (Your Rupees stay here.)', ['&Yes', '&No'], { attr: 0x70 }); if (q === 0) return; draw(); continue; }
      const d = dirs[e.key] || (e.ch && dirs[e.ch]); let acted = false;
      if (d) {
        const nx = px + d[0], ny = py + d[1];
        if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
        const m = mons.find(m2 => m2.x === nx && m2.y === ny);
        if (m) { const dmg = Math.max(1, atk + rnd(3) - 1); m.hp -= dmg; msg = `You hit the ${m.name} for ${dmg}.`; if (m.hp <= 0) { mons = mons.filter(x => x !== m); msg = `You defeat the ${m.name}!` + (m.boss ? ' The Wizard is down! The stairs are yours.' : ''); teef += m.boss ? 50 : m.ch === 's' ? 3 : 1; DOS.tone(220, 0.05); } acted = true; }
        else if (map[ny][nx] !== T.wall) { px = nx; py = ny; acted = true; msg = '';
          const it = items.find(i2 => i2.x === px && i2.y === py);
          if (it) { items = items.filter(x => x !== it); if (it.ch === '$') { const n = 2 + rnd(5) + level; teef += n; msg = `You pick up ${n} Rupees.`; } else if (it.ch === '!') { hp = Math.min(maxhp, hp + 8); msg = 'You drink the potion. It tastes of Ribena. HP +8.'; } else if (it.ch === '/') { atk += 2; msg = 'A SWORD! Atk +2. It is big and it is rusty and it is yours.'; } else { def += 1; msg = 'You strap a saucepan lid to your front. Def +1. Mom will want that back.'; } DOS.tone(880, 0.04); }
          if (map[py][px] === T.stairs) { if (level === 5) { if (mons.some(m2 => m2.boss)) { msg = 'The Wizard stands by the stairs. "NONE SHALL PASS." Fair.'; } else { S('crawl.win'); GS.clear('crawl'); draw(); await K.msgBox(host, `YOU WIN!\n\nYou went down five levels, beat the Wizard Gorzag and came out with ${RP(teef)} in ${turns} turns.\n\nThe goblins make you their King. It mostly means more admin.`, ['OK'], { attr: 0x70 }); return; } } else { level++; msg = `You go down the stairs. Level ${level}. It smells worse.`; gen(); keep(); draw(); continue; } }
        } else msg = 'Ouch. Wall.';
      } else if (e.key === '.' || e.ch === '.' || e.key === ' ' || e.ch === 's') { acted = true; msg = 'You wait. Something giggles.'; }
      if (!acted) { draw(); continue; }
      turns++;
      // monsters move
      for (const m of mons) {
        const dx = px - m.x, dy = py - m.y, dist = Math.abs(dx) + Math.abs(dy);
        if (dist === 1 || (dist === 2 && Math.abs(dx) === 1 && Math.abs(dy) === 1 && m.ch !== 'g')) { const dmg = Math.max(0, m.atk + rnd(2) - def); hp -= dmg; msg += ` The ${m.name} ${dmg ? 'bites you for ' + dmg + '.' : 'misses.'}`; if (dmg) DOS.tone(120, 0.06); continue; }
        if (dist > 9 || (m.ch === 'g' && rnd(4) === 0)) continue;
        const steps = m.ch === 's' && rnd(3) === 0 ? 2 : 1;
        for (let k = 0; k < steps; k++) { const cand = Math.abs(px - m.x) >= Math.abs(py - m.y) ? [[Math.sign(px - m.x), 0], [0, Math.sign(py - m.y)]] : [[0, Math.sign(py - m.y)], [Math.sign(px - m.x), 0]]; for (const [cx, cy] of cand) { const nx = m.x + cx, ny = m.y + cy; if ((cx || cy) && map[ny] && map[ny][nx] !== T.wall && !(nx === px && ny === py) && !mons.some(o => o !== m && o.x === nx && o.y === ny)) { m.x = nx; m.y = ny; break; } } }
      }
      if (hp <= 0) { S('crawl.die'); GS.clear('crawl'); draw(); await K.msgBox(host, `You have been eaten.\n\nLevel ${level}, ${RP(teef)}, ${turns} turns.\n\nThe goblins divide up your stuff. They argue about the sword. They always argue about the sword.`, ['OK'], { attr: 0x4f }); return; }
      keep(); draw();
    }
  });

  // ================================================================ DAKKA (Flak Attack!): saucers drop little green men; shoot them
  P.dakka = (sh) => DOS.screenProg(sh, async (host, s) => {
    host.setMouse(false); s.cur.on = false;
    const W = s.cols, H = s.rows, gx = Math.floor(W / 2), gy = H - 3;
    let angle = 0, score = 0, shots = 0, hits = 0, landedL = 0, landedR = 0, copters = [], grots = [], bullets = [], t = 0, over = false;
    const AIM = ['\\', '|', '/'], AX = [-1, 0, 1];
    const draw = () => {
      s.clear(0);
      s.fill(0, H - 2, W, 1, '\u2580', 0x02); // ground
      s.print(gx - 2, gy, 'd' + '\u2588' + 'b', 0x07); s.set(gx + AX[angle + 1], gy - 1, AIM[angle + 1], 0x0f);
      for (let i = 0; i < landedL; i++) s.set(2 + i * 2, gy, 'g', 0x0a); for (let i = 0; i < landedR; i++) s.set(W - 3 - i * 2, gy, 'g', 0x0a);
      copters.forEach(c => { s.print(Math.round(c.x) - 2, c.y, c.dir > 0 ? '=<o>=' : '=<o>=', 0x0c); s.set(Math.round(c.x), c.y - 1, t % 2 ? '-' : '+', 0x07); });
      grots.forEach(g => { if (g.chute) s.set(Math.round(g.x), Math.round(g.y) - 1, '^', 0x0e); s.set(Math.round(g.x), Math.round(g.y), 'g', 0x0a); });
      bullets.forEach(b => s.set(Math.round(b.x), Math.round(b.y), '*', 0x0e));
      s.fill(0, 0, W, 1, ' ', 0x70); s.print(1, 0, `FLAK ATTACK!   score ${score}   aliens shot ${hits}   left/right = aim   space = FIRE   Esc = quit`, 0x70);
    };
    const keep = () => GS.save('dakka', { score, shots, hits, landedL, landedR }, 1);
    const old = GS.load('dakka', 1);
    if (old && typeof old.score === 'number') { ({ score, shots, hits, landedL, landedR } = old); draw(); const m = W < 60 ? ` Saved game: ${score}. Press a key ` : ` Your saved game: score ${score}. Press any key to carry on `; s.print(Math.max(0, Math.floor((W - m.length) / 2)), Math.floor(H / 2), m, 0x1f); host.flush(); const k0 = await host.readKey(); if (isEsc(k0)) return; }
    draw();
    while (!over) {
      t++; if (t % 15 === 0) keep();
      let e; while ((e = host.pollKey())) { if (isEsc(e)) over = true; else if (e.key === 'ArrowLeft') angle = Math.max(-1, angle - 1); else if (e.key === 'ArrowRight') angle = Math.min(1, angle + 1); else if (e.key === ' ' || e.ch === ' ' || e.key === 'ArrowUp') { bullets.push({ x: gx + AX[angle + 1], y: gy - 1, dx: AX[angle + 1] * 0.7, dy: -1 }); shots++; DOS.tone(1500, 0.02); } }
      if (over) { keep(); break; }
      if (rnd(100) < 4 + Math.min(10, score / 60) && copters.length < 3) { const dir = rnd(2) ? 1 : -1; copters.push({ x: dir > 0 ? -3 : W + 3, y: 2 + rnd(3), dir, drop: 8 + rnd(20) }); }
      copters.forEach(c => { c.x += c.dir * 0.6; if (--c.drop <= 0 && c.x > 4 && c.x < W - 5 && Math.abs(c.x - gx) > 6) { c.drop = 20 + rnd(30); grots.push({ x: c.x, y: c.y + 1, chute: true }); } });
      copters = copters.filter(c => c.x > -5 && c.x < W + 5);
      grots.forEach(g => { g.y += g.chute ? 0.25 : 1; if (g.y >= gy) { g.done = true; if (g.x < gx) landedL++; else landedR++; DOS.tone(200, 0.05); } });
      grots = grots.filter(g => !g.done);
      bullets.forEach(b => { b.x += b.dx; b.y += b.dy; const c = copters.find(c2 => Math.abs(c2.x - b.x) <= 2 && c2.y === Math.round(b.y)); if (c) { copters = copters.filter(x => x !== c); score += 10; b.hit = true; DOS.tone(300, 0.08); } const g = grots.find(g2 => Math.abs(g2.x - b.x) < 1 && Math.abs(g2.y - b.y) <= 1); if (g) { if (g.chute && Math.round(g.y) - 1 === Math.round(b.y)) { g.chute = false; score += 2; } else { grots = grots.filter(x => x !== g); score += 5; hits++; if (hits === 20) S('dakka'); } b.hit = true; DOS.tone(600, 0.05); } });
      bullets = bullets.filter(b => !b.hit && b.y > 0 && b.x > 0 && b.x < W);
      if (landedL >= 4 || landedR >= 4) { GS.clear('dakka'); draw(); const side = landedL >= 4 ? 'left' : 'right'; for (let i = 0; i < 3; i++) { s.print(gx - 6, gy - 1 - i, '* BOOM *'.slice(0, 8), 0x0c); DOS.tone(100 - i * 20, 0.2); await host.sleep(250); } await K.msgBox(host, `Four little green men landed on the ${side}. They climbed on each other, reached the gun, and sat on it.\n\nScore: ${score}. Aliens shot: ${hits} of ${shots} shots.\n\n"Take us to your leader" - the aliens, leaving with your gun.`, ['OK'], { attr: 0x70 }); return; }
      draw();
      await host.sleep(70);
    }
  });

  // ================================================================ SQUIGPIE (Chip Van Tycoon): run a chip van for a week
  P.squigpie = async (sh) => {
    const host = sh.host, say = t => sh.println(t), ask = async (q, def) => { sh.print(q); const l = await K.readLine(host, { max: 8 }); if (l == null) throw K.KILL; const v = parseFloat(l); return isNaN(v) ? def : v; };
    say('\nCHIP VAN TYCOON  (C) 1999 Jack.  Like the lemonade one on Dad\'s old PC, but chips.');
    say('You have 7 days and 20 Rupees. Chips cost 1 Rupee a portion to make. Signs cost 2 Rupees and bring people in.');
    say('Everyone wants chips on a sunny day out. Nobody goes out in the rain (they\'d melt. Well, they say they would.)\n');
    let teef = 20, total = 0, day0 = 1;
    const old = GS.load('squigpie', 1);
    if (old && old.day >= 1 && old.day <= 7 && typeof old.teef === 'number') { teef = old.teef; total = +old.total || 0; day0 = old.day; say(`(Your saved game: carrying on from day ${day0}, with ${RP(teef)}.)\n`); }
    const WX = [['SUNNY', 1.0], ['HOT AND SUNNY', 1.5], ['CLOUDY', 0.7], ['RAIN', 0.3], ['FOOTBALL (big match in town)', 2.0]];
    for (let day = day0; day <= 7; day++) {
      GS.save('squigpie', { day, teef, total }, 1);
      const wi = rnd(WX.length), fc = rnd(10) < 7 ? wi : rnd(WX.length);
      say(`--- DAY ${day} ---   Rupees: ${teef}`); say(`Forecast: ${WX[fc][0]}`);
      if (teef < 1) { say('You can\'t afford a single portion. The van closes. Dave laughs (Dave went bust on day 2 last time, he can\'t talk).'); break; }
      const pies = Math.max(0, Math.min(teef, Math.floor(await ask('How many portions of chips to make? ', 0))));
      teef -= pies;
      const signs = Math.max(0, Math.min(Math.floor(teef / 2), Math.floor(await ask('How many signs (2 Rupees each)? ', 0))));
      teef -= signs * 2;
      const price = Math.max(0.1, await ask('Price per portion (Rupees)? ', 2));
      const weather = WX[wi]; say(`\nThe day comes. It is ${weather[0]}.`);
      let demand = 12 * weather[1] * (1 + signs * 0.3) * Math.max(0, 1.8 - price * 0.4) + rnd(4);
      if (weather[0].startsWith('FOOTBALL')) say('The whole crowd comes past after the match. They are HUNGRY. They are singing.');
      if (rnd(10) === 0) { demand *= 0.3; say('A seagull gets in the van and eats half the chips. (There is always a seagull. Always.)'); }
      const sold = Math.min(pies, Math.round(demand));
      const income = Math.round(sold * price * 10) / 10;
      teef = Math.round((teef + income) * 10) / 10;
      say(`You sold ${sold} of ${pies} portions at ${RP(price)}. Income: ${RP(income)}.  You now have ${RP(teef)}.`);
      if (pies - sold > 0) say(`${pies - sold} portions left over. Gubbinz has them. Gubbinz has ALL of them. With vinegar.`);
      say('');
      total = teef;
    }
    GS.clear('squigpie');
    const profit = Math.round((total - 20) * 10) / 10;
    say(`END OF THE WEEK. You finished with ${RP(total)}: a ${profit >= 0 ? 'PROFIT' : 'LOSS'} of ${RP(Math.abs(profit))}.`);
    say(profit > 10 ? 'The man from the chippy offers to buy the van. You say no. It\'s a family business now.' : profit >= 0 ? 'Not bad. Dave went bust on day 2. You are officially better at chips than Dave.' : 'Mom says it\'s "a learning experience". Dad says "so was my pension".');
    if (profit > 0) S('squigpie');
  };

  // ================================================================ SQUIGHUNT (Alien Hunt): 20 caves, one Big Alien, 5 stun darts
  P.squighunt = async (sh) => { if (await squighunt(sh) !== 'keep') GS.clear('squighunt'); };
  const squighunt = async (sh) => {
    const host = sh.host, say = t => sh.println(t);
    const CAVE = [[1, 4, 7], [0, 2, 9], [1, 3, 11], [2, 4, 13], [0, 3, 5], [4, 6, 14], [5, 7, 16], [0, 6, 8], [7, 9, 17], [1, 8, 10], [9, 11, 18], [2, 10, 12], [11, 13, 19], [3, 12, 14], [5, 13, 15], [14, 16, 19], [6, 15, 17], [8, 16, 18], [10, 17, 19], [12, 15, 18]];
    say('\nALIEN HUNT  (C) 1999 Jack.  20 caves. One Big Alien. Two pits (bottomless). Two giant space bats.');
    say('You have 5 stun darts. Type M to move, S to shoot, Q to quit. Caves are numbered 1-20.\n');
    const taken = new Set(); const place = () => { for (;;) { const c = rnd(20); if (!taken.has(c)) { taken.add(c); return c; } } };
    let me = place(); const squig = { at: place() }, holes = [place(), place()], bats = [place(), place()]; let sticks = 5, turns = 0;
    const old = GS.load('squighunt', 1);
    if (old && old.me >= 0 && old.me < 20 && Array.isArray(old.holes) && Array.isArray(old.bats)) { me = old.me; squig.at = old.squig; holes.splice(0, 2, ...old.holes); bats.splice(0, 2, ...old.bats); sticks = old.sticks; turns = old.turns; say('(Your saved game: carrying on the hunt. ' + sticks + ' stun darts left.)\n'); }
    for (;;) {
      GS.save('squighunt', { me, squig: squig.at, holes, bats, sticks, turns }, 1);
      turns++;
      say(`You are in cave ${me + 1}. Tunnels lead to ${CAVE[me].map(c => c + 1).join(', ')}.`);
      if (CAVE[me].includes(squig.at)) say('  You smell ALIEN. Slime and burnt toast. Nearby.');
      if (CAVE[me].some(c => holes.includes(c))) say('  You feel a draught. (A pit. Bottomless. Probably comes out in Australia.)');
      if (CAVE[me].some(c => bats.includes(c))) say('  You hear flapping. Space bats. They carry you off.');
      sh.print('(M)ove, (S)hoot or (Q)uit? '); const k = await sh.key('MSQ'); say(k);
      if (k === 'Q') { say('You leave the caves. The Big Alien waves (with all six hands). It knows you\'ll be back.'); return 'keep'; }
      if (k === 'M') {
        sh.print('Where to? '); const l = await K.readLine(host, { max: 3 }); if (l == null) return 'keep'; const to = parseInt(l, 10) - 1;
        if (!CAVE[me].includes(to)) { say('There\'s no tunnel to there. You walk into a wall. The wall is also a bit slimy.'); continue; }
        me = to;
        if (me === squig.at) { say('\nThe Big Alien is HERE. It is the size of a sofa. It has a mouth inside its mouth. It eats you. Then your darts.\n(Turns: ' + turns + ')'); return; }
        if (holes.includes(me)) { say('\nYou fall down a pit. It is bottomless. You are still falling. You will be falling in the year 2000.\n(Turns: ' + turns + ')'); return; }
        if (bats.includes(me)) { me = rnd(20); say('Space bats! They grab you, flap about, and drop you somewhere else. (Cave ' + (me + 1) + '.)'); if (me === squig.at || holes.includes(me)) { say(me === squig.at ? '\n...right on top of the Big Alien. Eaten.' : '\n...down a pit. Falling. Forever.'); return; } }
        continue;
      }
      sh.print('Shoot through which caves (up to 3, like 4 7 8)? '); const l = await K.readLine(host, { max: 12 }); if (l == null) return 'keep';
      const path = l.split(/[\s,]+/).map(v => parseInt(v, 10) - 1).filter(v => v >= 0 && v < 20).slice(0, 3);
      if (!path.length) { say('You fire the dart at nothing. It lands at your feet. You pick it up again. That cost you nothing but dignity.'); continue; }
      sticks--; let at = me, hit = false;
      for (const c of path) { at = CAVE[at].includes(c) ? c : pick(CAVE[at]); if (at === squig.at) { hit = true; break; } if (at === me) { say('The dart comes back round and hits YOU. (The caves are a dodecahedron. Don\'t ask.)'); return; } }
      if (hit) { say(`\nZAP. The stun dart hits the Big Alien in cave ${at + 1}. It goes "EEEP", phones home, and gets beamed up, sulking. YOU WIN. (${turns} turns, ${5 - sticks} darts.)`); S('squighunt'); return; }
      say(`Miss. The dart clatters into cave ${at + 1}. Darts left: ${sticks}.`);
      if (rnd(4) < 3) { squig.at = pick(CAVE[squig.at]); say('Something big shifts in the dark. The alien has moved.'); if (squig.at === me) { say('\nIt moved HERE. Eaten.'); return; } }
      if (!sticks) { say('\nOut of darts. You go home. The Big Alien keeps the caves. And the darts.'); return; }
    }
  };

  // ================================================================ TRUKKRACE (Turbo Racer): a road that bends
  P.trukkrace = (sh) => DOS.screenProg(sh, async (host, s) => {
    host.setMouse(false); s.cur.on = false;
    const W = s.cols, H = s.rows, half = Math.min(10, Math.floor(W / 6));
    const rows = []; let cx = W / 2, phase = 0, freq = 0.03, dist = 0, speed = 110, tx = Math.round(W / 2), over = false, obst = [];
    const mk = () => { phase += freq; if (rnd(40) === 0) freq = 0.02 + Math.random() * 0.05; cx = W / 2 + Math.sin(phase) * (W / 2 - half - 3) * 0.8; return { c: Math.round(cx), ob: dist > 60 && rnd(9) === 0 ? { x: Math.round(cx) + rnd(half * 2 - 2) - half + 1, ch: pick(['M', 'o', 'g']) } : null }; };
    const keep = () => GS.save('trukk', { dist, speed, phase, freq }, 1);
    const old = GS.load('trukk', 1);
    if (old && typeof old.dist === 'number') ({ dist, speed, phase, freq } = old);
    for (let i = 0; i < H; i++) rows.unshift(mk());
    if (old) tx = rows[H - 3].c;
    const draw = () => {
      s.clear(0);
      rows.forEach((r, y) => { s.set(r.c - half, y, '\u2551', 0x08); s.set(r.c + half, y, '\u2551', 0x08); for (let x = 0; x < W; x++) if (x < r.c - half || x > r.c + half) s.set(x, y, '\u2591', 0x02); if (y % 2 === 0) s.set(r.c, y, '\u00a6', 0x08); if (r.ob) s.set(r.ob.x, y, r.ob.ch, r.ob.ch === 'M' ? 0x0d : r.ob.ch === 'o' ? 0x0c : 0x0a); });
      s.print(tx - 1, H - 3, 'd' + '\u2588' + 'b', 0x0c); s.set(tx, H - 4, '\u2580', 0x0c);
      s.fill(0, 0, W, 1, ' ', 0x70); s.print(1, 0, `TURBO RACER   ${dist}m   speed ${Math.round(1000 / speed) * 10} mph   left/right   Esc=quit`, 0x70);
    };
    draw();
    if (old) { const m = W < 60 ? ` Saved race: ${dist}m. Press a key ` : ` Your saved race: ${dist}m. Press any key to carry on `; s.print(Math.max(0, Math.floor((W - m.length) / 2)), Math.floor(H / 2), m, 0x1f); host.flush(); const k0 = await host.readKey(); if (isEsc(k0)) return; }
    while (!over) {
      if (dist % 50 === 0) keep();
      let e; while ((e = host.pollKey())) { if (isEsc(e)) { keep(); return; } if (e.key === 'ArrowLeft' || e.ch === 'a') tx -= 1; if (e.key === 'ArrowRight' || e.ch === 'd') tx += 1; }
      rows.pop(); rows.unshift(mk()); dist += 5; if (speed > 45 && dist % 50 === 0) speed -= 3;
      if (dist === 1000) S('trukkrace');
      const r = rows[H - 3];
      if (tx - 1 <= r.c - half || tx + 1 >= r.c + half) over = 'You drive off the road into a field. The car is fine. The cows are confused.';
      else if (r.ob && Math.abs(r.ob.x - tx) <= 1) over = r.ob.ch === 'M' ? 'You hit a Mini. It was parked in the middle of the road. Nobody knows why. It wins.' : r.ob.ch === 'o' ? 'You hit a traffic cone. It goes under the car, comes out the back, and follows you home.' : 'You hit a garden gnome. The gnome is FURIOUS. He is also fine. He is made of concrete.';
      if (over) { GS.clear('trukk'); draw(); for (let i = 0; i < 3; i++) { DOS.tone(90 + i * 30, 0.15); await host.sleep(200); } await K.msgBox(host, `CRASH!\n\n${over}\n\nDistance: ${dist}m.  ${dist > 1870 ? 'A NEW RECORD. Jack had 1870.' : dist > 40 ? 'Further than Dave (40m).' : 'Dave did 40m. You did ' + dist + '. Dave will hear about this.'}`, ['OK'], { attr: 0x70 }); return; }
      draw();
      await host.sleep(speed);
    }
  });

  // ================================================================ INTRO: a demoscene intro (plasma, copper bars, sine scroller, chiptune)
  P.intro = (sh) => DOS.screenProg(sh, async (host, s) => {
    host.setMouse(false);
    const W = 320, H = 200, g = { w: W, h: H, pix: new Uint8Array(W * H), pal: new Uint32Array(256), dirty: true };
    for (let i = 0; i < 256; i++) { const r = 128 + 127 * Math.sin(i * Math.PI / 32), gg = 128 + 127 * Math.sin(i * Math.PI / 64 + 2), b = 128 + 127 * Math.sin(i * Math.PI / 128 + 4); g.pal[i] = (r << 16) | (gg << 8) | b; }
    for (let i = 240; i < 256; i++) g.pal[i] = 0xffffff; g.pal[0] = 0;
    s.setGfx(g); s.cur.on = false;
    const TEXT = '   WELCOME TO THE JACK ATTACK! INTRO  ...  CODE: JACK   MATHS: ' + Cast.n('cousin2').toUpperCase() + '   TUNE: THE PC SPEAKER (SORRY)   ...   GREETINGS TO DAVE, ' + Cast.n('teacher').toUpperCase() + ', GUBBINZ, MOM (FOR THE TEA) AND EVERYONE ON THE FORUMS   ...   THIS WAS MEANT TO BE 4K. IT IS 64K. SORRY ' + Cast.n('cousin2').toUpperCase() + '   ...   RED ONES GO FASTER   ...   COWABUNGA!   ...   PRESS ESC TO GO BACK TO DOS. OR DON\'T. STAY. IT LOOPS.   ...   ';
    const stars = []; for (let i = 0; i < 80; i++) stars.push({ x: Math.random() * W, y: Math.random() * 110, sp: 0.5 + Math.random() * 2 });
    const sinT = []; for (let i = 0; i < 256; i++) sinT.push(Math.sin(i * Math.PI / 128));
    let t = 0, scroll = 0, musicAt = 0, done = false;
    const NOTES = [262, 330, 392, 523, 392, 330, 262, 196, 220, 262, 330, 440, 330, 262, 220, 165, 247, 294, 370, 494, 370, 294, 247, 185, 262, 330, 392, 523, 659, 523, 392, 330];
    const BASS = [131, 110, 123, 131];
    const music = () => { const now = performance.now() / 1000; if (now < musicAt) return; const step = 0.11; for (let i = 0; i < 32; i++) { DOS.tone(NOTES[i], step * 0.8, i * step); if (i % 2 === 0) DOS.tone(BASS[(i >> 3) % 4] * (i % 4 === 0 ? 1 : 1.5), step * 0.5, i * step + step * 0.5); } musicAt = now + 32 * step - 0.05; };
    while (!done) {
      const e = host.pollKey(); if (e) { if (isEsc(e) || e.key === 'Enter' || e.ch) done = true; }
      music();
      const p = g.pix;
      // plasma, computed at half resolution
      for (let y = 0; y < 110; y += 2) for (let x = 0; x < W; x += 2) { const v = 128 + 40 * (sinT[(x + t * 2) & 255] + sinT[(y * 2 + t * 3) & 255] + sinT[((x + y) + t) & 255] + sinT[(Math.hypot(x - 160, y - 55) * 2 + t * 4) & 255]); const c = Math.max(1, Math.min(239, v | 0)); const i = y * W + x; p[i] = c; p[i + 1] = c; p[i + W] = c; p[i + W + 1] = c; }
      stars.forEach(st => { st.x += st.sp; if (st.x >= W) { st.x = 0; st.y = Math.random() * 110; } p[(st.y | 0) * W + (st.x | 0)] = 255; });
      // copper bars
      p.fill(0, 110 * W);
      for (let b = 0; b < 5; b++) { const cy = 150 + Math.sin(t / 20 + b * 1.2) * 32; for (let dy = -6; dy <= 6; dy++) { const y = Math.round(cy + dy); if (y < 110 || y >= H) continue; const c = 1 + ((b * 48 + 24 - Math.abs(dy) * 4) & 255); p.fill(Math.max(1, c), y * W, y * W + W); } }
      // sine scroller (2x glyphs)
      for (let x = 0; x < W; x++) { const tp = scroll + x; const ci = Math.floor(tp / 16), col = tp % 16; const ch = TEXT[ci % TEXT.length]; const bits = K.bits8(ch); const yo = 150 + Math.sin((x + t * 3) / 25) * 22; for (let r = 0; r < 8; r++) if (bits[r * 8 + (col >> 1)]) { for (let k = 0; k < 2; k++) { const y = Math.round(yo) + r * 2 + k; if (y >= 110 && y < H) p[y * W + x] = 250; } } }
      scroll += 2; if (scroll >= TEXT.length * 16) { scroll = 0; S('intro'); }
      t++; g.dirty = true;
      await host.sleep(33);
    }
    s.setGfx(null); s.clear(7);
  });

  // ================================================================ TPAINT: text-mode paint
  P.tpaint = (sh, args) => DOS.screenProg(sh, async (host, s) => {
    const W = s.cols, H = s.rows, CH = H - 2;
    const CHARS = ['\u2588', '\u2593', '\u2592', '\u2591', '\u2584', '\u2580', '\u258c', '\u2590', '\u25a0', '\u25b2', '\u25bc', '\u25ba', '\u25c4', '\u263a', '\u2665', '\u2666', '\u2663', '\u2660', '\u00b7', '*', '#', '@', 'o', '/', '\\', '-', '|', '+', '='];
    let ci = 0, fg = 14, bg = 0, cx = 10, cy = 5, name = (sh.args(args || '')[0] || '').trim(), dirty = false;
    const grid = []; for (let y = 0; y < CH; y++) { grid.push([]); for (let x = 0; x < W; x++) grid[y].push([' ', 7]); }
    const attr = () => fg | (bg << 4);
    const packPic = () => ({ W, CH, ci, fg, bg, cx, cy, name, ch: grid.map(r => r.map(c => c[0]).join('')), at: grid.map(r => r.map(c => (c[1] & 255).toString(16).padStart(2, '0')).join('')) });
    const sv = A.gameSaver ? A.gameSaver('dos.tpaint', () => dirty ? packPic() : null, { v: 1, delay: 400 }) : null;
    const kept = sv && sv.load();
    if (kept && kept.W === W && kept.CH === CH && Array.isArray(kept.ch) && kept.ch.length === CH && (!name || name === kept.name)) {
      for (let y = 0; y < CH; y++) { const cs = [...String(kept.ch[y])], as = String(kept.at[y] || ''); for (let x = 0; x < W; x++) grid[y][x] = [cs[x] || ' ', parseInt(as.substr(x * 2, 2), 16) || 7]; }
      ({ ci, fg, bg, cx, cy } = kept); name = kept.name || name; dirty = true;
    }
    const draw = () => {
      if (sv && dirty) sv.save();
      s.fill(0, 0, W, 1, ' ', 0x70); s.print(1, 0, `TPAINT  char:`, 0x70); s.set(14, 0, CHARS[ci], attr()); s.print(16, 0, ` fg:${fg} bg:${bg}  F1=help F2=save F4=char F5=fg F6=bg F7=fill F8=clear Del=erase Esc=quit`, 0x70);
      for (let y = 0; y < CH; y++) for (let x = 0; x < W; x++) s.set(x, y + 1, grid[y][x][0], grid[y][x][1]);
      s.fill(0, H - 1, W, 1, ' ', 0x70); s.print(1, H - 1, `${name || 'untitled'}${dirty ? ' *' : ''}   (${cx},${cy})   arrows move, SPACE paints, type a letter to paint it, mouse drags`, 0x70);
      s.cur.x = cx; s.cur.y = cy + 1; s.cur.on = true;
    };
    const paint = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= CH) return; grid[y][x] = [c == null ? CHARS[ci] : c, attr()]; dirty = true; };
    const fill = (x, y) => { const [tc, ta] = grid[y][x]; const nc = CHARS[ci], na = attr(); if (tc === nc && ta === na) return; const st = [[x, y]]; let n = 0; while (st.length && n++ < 20000) { const [px, py] = st.pop(); if (px < 0 || py < 0 || px >= W || py >= CH) continue; const g = grid[py][px]; if (g[0] !== tc || g[1] !== ta) continue; grid[py][px] = [nc, na]; st.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]); } dirty = true; };
    async function save() {
      const r = await K.form(host, 'Save as .ANS', [{ type: 'text', label: '&Name:', value: name || 'MYART.ANS', max: 40, focus: true }, { type: 'label', text: 'Saved into C:\\ANSI (TYPE it at the prompt afterwards!)', rows: 1 }, { type: 'btns', items: ['Save', 'Cancel'] }], { w: 56 });
      if (!r || r.btn !== 'Save' || !r.values[0].trim()) return;
      let n = r.values[0].trim().toUpperCase(); if (!/\./.test(n)) n += '.ANS';
      let out = '\x1b[0m', last = -1;
      for (let y = 0; y < CH; y++) { let line = ''; let end = W - 1; while (end >= 0 && grid[y][end][0] === ' ' && (grid[y][end][1] >> 4) === 0) end--; for (let x = 0; x <= end; x++) { const [c, a] = grid[y][x]; if (a !== last) { const f = a & 15, b = a >> 4 & 7; const M = [0, 4, 2, 6, 1, 5, 3, 7]; line += `\x1b[${f > 7 ? 1 : 0};${30 + M[f & 7]};${40 + M[b]}m`; last = a; } line += c; } out += line + '\x1b[0m\n'; last = -1; }
      const e = sh.writeFile(sh.resolve(/[\\:]/.test(n) ? n : 'C:\\ANSI\\' + n), out);
      if (e) { await K.msgBox(host, e, ['OK']); return; }
      name = n.split('\\').pop(); dirty = false; S('tpaint'); if (sv) sv.clear();
      await K.msgBox(host, `Saved as C:\\ANSI\\${name}.\nTYPE C:\\ANSI\\${name} at the prompt to see it in all its glory.`, ['OK']);
    }
    draw();
    for (;;) {
      const e = await host.readEvent();
      if (e.type === 'mouse') { if ((e.act === 'down' || e.act === 'drag') && e.y >= 1 && e.y <= CH) { cx = e.x; cy = e.y - 1; paint(cx, cy); } else if (e.act === 'down' && e.y === 0) { if (e.x === 14) ci = (ci + 1) % CHARS.length; else if (e.x >= 16 && e.x < 22) fg = (fg + 1) % 16; else if (e.x >= 22 && e.x < 27) bg = (bg + 1) % 8; } draw(); continue; }
      const k = e.key;
      if (k === 'Escape') { if (dirty) { const q = await K.msgBox(host, 'Picture not saved. Save it?', ['&Yes', '&No', '&Cancel']); if (q === 2) { draw(); continue; } if (q === 0) await save(); } if (sv) { sv.clear(); sv.stop(); } return; }
      if (k === 'F1') { await K.msgBox(host, 'TPAINT\n\nArrows move the cursor. SPACE paints the current character in the current colours.\nType any letter to paint it. Del erases. F4 next character, F5 next foreground, F6 next background,\nShift+F5/F6 go backwards. F7 fills an area (bucket). F8 clears. F2 saves as .ANS into C:\\ANSI.\nMouse: click or drag to paint. Click the char/fg/bg on the top bar to change them.\n(' + Cast.n('cousin2') + ' has TheDraw. This is better, because it is MINE.)', ['OK'], { left: true, width: 76 }); draw(); continue; }
      if (k === 'F2') { await save(); draw(); continue; }
      if (k === 'F4') ci = (ci + (e.shift ? CHARS.length - 1 : 1)) % CHARS.length;
      else if (k === 'F5') fg = (fg + (e.shift ? 15 : 1)) % 16;
      else if (k === 'F6') bg = (bg + (e.shift ? 7 : 1)) % 8;
      else if (k === 'F7') fill(cx, cy);
      else if (k === 'F8') { const q = await K.msgBox(host, 'Clear the whole picture?', ['&Yes', '&No']); if (q === 0) { for (let y = 0; y < CH; y++) for (let x = 0; x < W; x++) grid[y][x] = [' ', 7]; dirty = true; } }
      else if (k === 'ArrowUp') cy = Math.max(0, cy - 1); else if (k === 'ArrowDown') cy = Math.min(CH - 1, cy + 1);
      else if (k === 'ArrowLeft') cx = Math.max(0, cx - 1); else if (k === 'ArrowRight') cx = Math.min(W - 1, cx + 1);
      else if (k === 'Home') cx = 0; else if (k === 'End') cx = W - 1;
      else if (k === ' ' || e.ch === ' ') { paint(cx, cy); cx = Math.min(W - 1, cx + 1); }
      else if (k === 'Delete' || k === 'Backspace') { if (k === 'Backspace') cx = Math.max(0, cx - 1); grid[cy][cx] = [' ', 7]; dirty = true; }
      else if (k === 'Enter') { cy = Math.min(CH - 1, cy + 1); }
      else if (e.ch) { paint(cx, cy, e.ch); cx = Math.min(W - 1, cx + 1); }
      draw();
    }
  });

  // ================================================================ JACKTRAK: a tiny music tracker
  P.grottrak = (sh, args) => DOS.screenProg(sh, async (host, s) => {
    const W = s.cols, H = s.rows, ROWS = 32, CHN = 2;
    const NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
    const KEYS = { z: 0, s: 1, x: 2, d: 3, c: 4, v: 5, g: 6, b: 7, h: 8, n: 9, j: 10, m: 11, q: 12, 2: 13, w: 14, 3: 15, e: 16, r: 17, 5: 18, t: 19, 6: 20, y: 21, 7: 22, u: 23, i: 24 };
    let pat = []; for (let r = 0; r < ROWS; r++) pat.push(new Array(CHN).fill(null));
    let row = 0, ch = 0, oct = 3, tempo = 125, name = 'ORKMARCH.TRK', dirty = false, playing = false;
    // a demo tune: an original robot march (the file name is still ORKMARCH)
    const DEMO = [[48, 36], [null, null], [48, null], [55, 43], [52, null], [null, null], [48, 36], [null, null], [50, 38], [null, null], [52, null], [53, 41], [52, null], [null, null], [48, 36], [null, null], [43, 31], [null, null], [43, null], [50, 38], [47, null], [null, null], [43, 31], [null, null], [45, 33], [null, null], [47, null], [48, 36], [50, null], [48, null], [43, 31], [null, null]];
    DEMO.forEach((r, i) => { pat[i] = r.slice(); });
    const fname = (sh.args(args || '')[0] || '').trim();
    if (fname) { const r = sh.resolve(fname); if (r.node && /^TRK1/.test(String(r.node.text || ''))) { const lines = String(r.node.text).split('\n').slice(1); pat = []; for (let i = 0; i < ROWS; i++) pat.push((lines[i] || '').split(',').map(v => v.trim() === '' || v.trim() === '-' ? null : +v).concat([null, null]).slice(0, CHN)); name = r.node.name; } }
    const sv = A.gameSaver ? A.gameSaver('dos.jacktrak', () => dirty ? { pat, tempo, oct, name, row, ch } : null, { v: 1, delay: 400 }) : null;
    const kept = !fname && sv && sv.load();
    if (kept && Array.isArray(kept.pat) && kept.pat.length === ROWS) { pat = kept.pat.map(r => [0, 1].map(c => (r && typeof r[c] === 'number') ? r[c] : null)); tempo = +kept.tempo || tempo; oct = +kept.oct || oct; name = kept.name || name; row = Math.min(ROWS - 1, +kept.row || 0); ch = kept.ch ? 1 : 0; dirty = true; }
    const freq = n => 440 * Math.pow(2, (n + 12 - 69) / 12);
    const nname = n => n == null ? '---' : NAMES[n % 12] + Math.floor(n / 12);
    const draw = () => {
      if (sv && dirty) sv.save();
      s.clear(0x17); s.fill(0, 0, W, 1, ' ', 0x70); s.print(1, 0, `JACKTRAK 1.0   ${name}${dirty ? ' *' : ''}   oct ${oct}   tempo ${tempo}`, 0x70);
      s.print(1, 1, 'Keys: Z S X D C V G B H N J M = low octave   Q 2 W 3 E R 5 T 6 Y 7 U I = high   Del clears   +/- octave', 0x1b);
      s.print(1, 2, 'Up/Down rows, Left/Right channel, F5 play, F2 save, F8 clear, Esc quit', 0x1b);
      const top = Math.max(0, Math.min(ROWS - (H - 5), row - Math.floor((H - 5) / 2)));
      for (let i = 0; i < H - 5; i++) { const r = top + i; if (r >= ROWS) break; const y = 4 + i; const cur = r === row; s.fill(0, y, W, 1, ' ', cur ? 0x30 : 0x17); s.print(1, y, lpad(r, 2), cur ? 0x30 : 0x1b); for (let c = 0; c < CHN; c++) { const sel = cur && c === ch; s.print(5 + c * 10, y, nname(pat[r][c]), sel ? 0x4f : cur ? 0x30 : pat[r][c] == null ? 0x18 : 0x1f); } if (playing && r === row) s.print(28, y, '\u25ba', 0x3e); }
      s.print(5, 3, 'LEAD      BASS', 0x1e);
      s.cur.on = false;
    };
    async function play() {
      playing = true; const step = 15 / tempo; const t0 = performance.now();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < CHN; c++) if (pat[r][c] != null) DOS.tone(freq(pat[r][c]) * (c === 1 ? 0.5 : 1), step * 0.9, r * step);
      S('grottrak');
      for (let r = 0; r < ROWS; r++) { row = r; draw(); const k = host.pollKey(); if (k && isEsc(k)) break; const wait = t0 + (r + 1) * step * 1000 - performance.now(); if (wait > 0) await host.sleep(wait); }
      playing = false; row = 0;
    }
    draw();
    for (;;) {
      const e = await host.readEvent();
      if (e.type === 'mouse') { if (e.act === 'down' && e.y >= 4) { const top = Math.max(0, Math.min(ROWS - (H - 5), row - Math.floor((H - 5) / 2))); const r = top + e.y - 4; if (r < ROWS) { row = r; ch = e.x >= 15 ? 1 : 0; } } draw(); continue; }
      const k = e.key;
      if (k === 'Escape') { if (dirty) { const q = await K.msgBox(host, 'Tune not saved. Save it?', ['&Yes', '&No', '&Cancel']); if (q === 2) { draw(); continue; } if (q === 0) await save(); } if (sv) { sv.clear(); sv.stop(); } return; }
      if (k === 'F5' || k === 'Enter') { await play(); draw(); continue; }
      if (k === 'F2') { await save(); draw(); continue; }
      if (k === 'F8') { pat = pat.map(() => new Array(CHN).fill(null)); dirty = true; }
      else if (k === 'ArrowUp') row = (row + ROWS - 1) % ROWS; else if (k === 'ArrowDown') row = (row + 1) % ROWS;
      else if (k === 'ArrowLeft') ch = Math.max(0, ch - 1); else if (k === 'ArrowRight') ch = Math.min(CHN - 1, ch + 1);
      else if (k === 'PageUp') row = Math.max(0, row - 8); else if (k === 'PageDown') row = Math.min(ROWS - 1, row + 8);
      else if (k === 'Delete' || k === ' ') { pat[row][ch] = null; row = (row + 1) % ROWS; dirty = true; }
      else if (e.ch === '+' || e.ch === '=') oct = Math.min(6, oct + 1); else if (e.ch === '-') oct = Math.max(1, oct - 1);
      else if (e.ch === '[') tempo = Math.max(60, tempo - 5); else if (e.ch === ']') tempo = Math.min(250, tempo + 5);
      else if (e.ch && KEYS[e.ch.toLowerCase()] != null) { const n = oct * 12 + KEYS[e.ch.toLowerCase()]; pat[row][ch] = n; DOS.tone(freq(n) * (ch === 1 ? 0.5 : 1), 0.12); row = (row + 1) % ROWS; dirty = true; }
      draw();
    }
    async function save() {
      const r = await K.form(host, 'Save tune', [{ type: 'text', label: '&Name:', value: name, max: 40, focus: true }, { type: 'label', text: 'Saved in the current directory as a .TRK file (JACKTRAK name.TRK loads it)', rows: 1 }, { type: 'btns', items: ['Save', 'Cancel'] }], { w: 60 });
      if (!r || r.btn !== 'Save' || !r.values[0].trim()) return;
      let n = r.values[0].trim().toUpperCase(); if (!/\./.test(n)) n += '.TRK';
      const text = 'TRK1 ' + tempo + '\n' + pat.map(rw => rw.map(v => v == null ? '-' : v).join(',')).join('\n') + '\n';
      const e = sh.writeFile(sh.resolve(n), text); if (e) { await K.msgBox(host, e, ['OK']); return; }
      name = n.split('\\').pop(); dirty = false; if (sv) sv.clear();
    }
  });

  // ================================================================ TEEFWARS: a BBS door game
  P.teefwars = async (sh) => {
    const host = sh.host, say = t => sh.println(t);
    say('\n\x1b[1;36m\u2554' + '\u2550'.repeat(50) + '\u2557\n\u2551   GEM WARS v1.2  -  a door game on JACK\'S BBS      \u2551\n\u255a' + '\u2550'.repeat(50) + '\u255d\x1b[0m');
    say('You and Dave each run a gem mine on an asteroid. 10 turns. Most Rupees at the end wins.');
    say('Miners earn 1 Rupee a turn. Robots defend. Lasers attack. Raids steal Rupees.\n');
    const me = { teef: 30, grots: 5, squigs: 2, dakka: 1 }, dave = { teef: 30, grots: 5, squigs: 2, dakka: 1 };
    const show = () => say(`  YOU:  ${RP(me.teef)}, ${me.grots} miners, ${me.squigs} robots, ${me.dakka} lasers     DAVE: ${RP(dave.teef)}, ${dave.grots} miners, ${dave.squigs} robots, ${dave.dakka} lasers`);
    const power = c => c.dakka * 3 + c.squigs * 1.5 + c.grots * 0.5;
    const raid = (a, d, who) => { const ap = power(a) + rnd(6), dp = d.squigs * 2.5 + d.grots * 0.5 + d.dakka + rnd(6); if (ap > dp) { const loot = Math.min(d.teef, Math.round(d.teef * 0.4) + 3); d.teef -= loot; a.teef += loot; const lost = Math.min(d.grots, 1 + rnd(2)); d.grots -= lost; return `${who} RAID: success! ${RP(loot)} nicked, ${lost} miners scattered.`; } const lost = Math.min(a.grots, 1 + rnd(3)); a.grots -= lost; return `${who} RAID: beaten back. ${lost} miners lost. (The robots got them.)`; };
    let turn0 = 1;
    const old = GS.load('teefwars', 1);
    if (old && old.turn >= 1 && old.turn <= 10 && old.me && old.dave) { Object.assign(me, old.me); Object.assign(dave, old.dave); turn0 = old.turn; say(`(Your saved game: carrying on from turn ${turn0}.)\n`); }
    for (let turn = turn0; turn <= 10; turn++) {
      GS.save('teefwars', { turn, me, dave }, 1);
      say(`\x1b[1;33m--- TURN ${turn} of 10 ---\x1b[0m`); show();
      let acting = true;
      while (acting) {
        say('  1) Buy miner (2 Rupees)   2) Buy robot (3)   3) Buy laser (4)   4) RAID DAVE   5) End turn');
        sh.print('  > '); const k = await sh.key('12345'); say(k);
        if (k === '1') { if (me.teef >= 2) { me.teef -= 2; me.grots++; say('  A miner joins. She has a hard hat and a flask of tea.'); } else say('  Not enough Rupees.'); }
        else if (k === '2') { if (me.teef >= 3) { me.teef -= 3; me.squigs++; say('  A robot. It beeps at the miners. That is its job.'); } else say('  Not enough Rupees.'); }
        else if (k === '3') { if (me.teef >= 4) { me.teef -= 4; me.dakka++; say('  MORE LASERS. Pew pew.'); } else say('  Not enough Rupees.'); }
        else if (k === '4') { say('  ' + raid(me, dave, 'YOUR')); acting = false; }
        else acting = false;
      }
      // Dave's go: a simple, slightly dim AI
      const buys = 1 + rnd(3); for (let i = 0; i < buys; i++) { const c = rnd(3); if (c === 0 && dave.teef >= 2) { dave.teef -= 2; dave.grots++; } else if (c === 1 && dave.teef >= 3) { dave.teef -= 3; dave.squigs++; } else if (dave.teef >= 4) { dave.teef -= 4; dave.dakka++; } }
      if (rnd(10) < 4 + (turn > 6 ? 3 : 0)) say('  ' + raid(dave, me, 'DAVE\'S')); else say('  Dave spends his turn naming his robots. (They are all called Dave.)');
      me.teef += me.grots; dave.teef += dave.grots;
      say(`  Income: you +${me.grots}, Dave +${dave.grots}.\n`);
    }
    GS.clear('teefwars');
    show();
    if (me.teef > dave.teef) { say('\n\x1b[1;32mYOU WIN GEM WARS!\x1b[0m Dave says the game is rigged. Dave says that about Monopoly too.'); S('teefwars'); }
    else if (me.teef < dave.teef) say('\n\x1b[1;31mDAVE WINS.\x1b[0m He will mention this every day until the year 2000. Possibly after.');
    else say('\nA DRAW. Dave suggests "sudden death". You suggest tea.');
    say('\n[Door game ended. Returning to JACK\'S BBS main menu. (There is no main menu. There is DOS.)]');
  };
})();
