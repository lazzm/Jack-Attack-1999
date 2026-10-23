# AGENTS.md - Jack Attack 1999 (jacklm.com)

You are working on **Jack Attack 1999**: a "16-year-old kid in 1999" simulator. A 3D family house (WebGL, three.js r128)
with Jack's bedroom, consoles and a beige family PC; sit at the PC and you get "JackOS 98" (a fake Windows-98-style OS)
with "JackNet Explorer" browsing a huge fake 1999 web, the JACK ATTACK! games magazine, games, an economy (Rupees),
multiplayer bits (JackWorld, JackMUD, arenas) and hundreds of secrets. Live at https://jacklm.com. Owner: Jack (GitHub lazzm).

## Layout
- `app/` - the site. `server.js` (Node, WebSocket at /ws, admin endpoints), `mods/*.js` (server modules, state in
  `DATA_DIR/state.json` under `state.mods.<name>`), `public/` (index.html, `js/*.js` ~250 files, `css/`).
  Packs by prefix: `hs-*` house/world (hs-world.js = camera, walking, collision, picking, doors, quality tiers, watchdog;
  hs-house.js = downstairs models; hs-edit.js = owner-only layout editor), `rm-*` bedroom + consoles (rm-room.js bedroom,
  rm-tv.js/rm-cat.js console + cartridge registry, rm-g-*.js the console games), `pm-*` physical media (discs, floppies,
  Pixel Post mail order), `ex-*` economy, `cx-*` magazine back issues, `sx-*` secrets/Great Hunt, `jw-*` JackWorld, `md-*`
  JackMUD, `ch-*` chores, `pcgames*` FPS games, `cast.js` (per-visitor random names + pronouns), `boot.js` (power-on fly-in).
- `deploy.sh` - snapshots data, rsyncs `app/` to `site/` (served read-only by the `landing` container), stamps `?v=`, restarts.
- `tests/` - Playwright scripts (system Chromium at /usr/bin/chromium). See tests/README.md.
- NOT in git (never commit, never print): `.env` (ADMIN_TOKEN), `data/` (real users, passwords, town, backups), `site/`.

## Workflow (follow exactly)
1. Edit in `app/`. Run `node --check` on every JS file you touch.
2. Test on a throwaway server, never on live data:
   `cd app && PORT=18080 DATA_DIR=/tmp/jhp-test ADMIN_TOKEN=testtoken node server.js` then run tests from `tests/`
   (e.g. `node smoke3.mjs http://localhost:18080`, `node integ.mjs 18080`). Check the server log has no "mod failed to load".
   Stop your server by its PID (`ss -ltnp`). NEVER `pkill node` / `killall node`: the live site's node is visible on the host.
3. Bump `app/package.json` version AND add a `CHANGELOG.md` entry before every deploy.
4. Deploy: `./deploy.sh` (or copy only the changed files into `site/`, restamp `?v=` in site/public/index.html, and
   `docker restart landing` if server/mod files changed). Then check https://jacklm.com and `docker logs landing`.
5. Commit and push to `origin main` after every deploy, so GitHub always matches live.

## Hard rules
- THE DATABASE IS SACRED: never reset, delete or overwrite `data/`; migrate state in place; deploy.sh snapshots first.
- Never touch other stacks in /opt/stacks (especially `wetty` = the owner's remote shell). Never `docker compose down` here
  without checking what runs.
- 1999 forever: the site's "today" is the same day/month in 1999; nothing after 31/12/1999; facts and dates must be accurate.
- "Need to feel 1999": period hardware and UI, no modern overlays/fonts; it's a game, not a modern app with a 1999 skin.
- Nothing 2D in the 3D world: every model solid from every walkable angle (thickness, all faces, contact shadows);
  no z-fighting; doors start shut and are solid from both sides; never let anything stand between camera and PC.
- A refresh must never change state (standing stays standing, PC stays on) and never show black.
- Kid friendly. "Mom" not "mum". No location clues, no Jack's birthday, never mention "No Scrubs".
- No real brands/logos/copied assets or code. Fake TLDs only (.jnet .webcom .kidz .grot ...), never real domains or
  subdomains of jacklm.com. Consoles in the house use fake names (Ultra 64, PlaySpace, Game Lad, Segue, Daydream,
  Super Ultra). The PC is JackOS: never "Windows" (C:\JACKOS, SYSTEM32 inside it).
- ALL authored pop-culture references and brands must be recognisable, funny fictional parodies, including dialogue,
  fake web pages, magazines, TV listings, VHS labels, box artwork and game titles. Examples: Galaxy Walk;
  Intergalactic Battles: An Old Hope. Audit source and inspect the rendered lettering; never silently truncate titles.
  Preserve internal IDs/save keys, technical API/font names, third-party licence notices and players' own posts/data.
- Every player needs a JackNet account before playing; no guest/cancel bypass. Existing account names, saves and balances must survive.
- Explicit signup/logon enters the PC; ordinary refresh/token resume preserves the saved standing/seated state.
  The owner-approved account `test` has a sparse personal-media starter and a confirmed, backed-up test-only save reset.
  Never convert/reset another account, overwrite an existing registration, or clear daily earning/exchange caps or shared-world records.
- Pocket money and job wages are server-held cash in integer pence. JackNet Bank exchanges £1 for 20 Rupees (5p increments, £20/day, one-way, no real money); new cash wallets start at £0, without converting old Rupees. Rupees still use capped server earn paths; the browser never mints either currency. Persist exchange-slip nonces so retries never debit twice.
- People: Jack, Dave, Luke, Callum, JackK, Crystal (Jack's little sister), Mom, Dad, Gran, Grandad, Nan and Gubbinz are fixed;
  everyone else comes from `Cast` (`Cast.n('cousin')`, `Cast.t('{teacher} ... {teacher.his}')`). Never hardcode them.
  Files that server mods `require` (e.g. `public/js/*-cat.js`) must guard browser globals: `typeof Cast !== 'undefined'`.
- PC ONLY (owner instruction): desktop/laptop play with keyboard, mouse and PC gamepads. Phones and tablets get the PC-required page before logon/gameplay; do not add mobile/touch controls, phone layouts or a PC trackpad. Do not identify a PC by viewport width or touch capability alone. The physical in-game phone and Game Lad are ordinary playable 3D props. Use click/press/drag wording.
- Browser tab title is always "Jack Attack 1999" (js/title.js); it's shown nowhere else.
- The site's CSP is `script-src 'self'`: no inline scripts or inline event handlers; put code in files.
- Controls in the house: WASD/arrows walk, Shift jog, C crouch (never Ctrl: Ctrl+W closes the tab), Space jump,
  F uses/plays/opens; E/click picks up, removes or places (including insertion at highlighted slots).
  Console cases must be placed off the shelf before F opens them; E takes the visible medium and returns it to its case.
  Only filled cases go back onto the console rack. I inspects, R turns, Q leans back from screens/inspection (not while typing),
  Esc opens the game menu (including return/leave actions). F2 stands up from the PC,
  T toggles LOCK IN for the active in-game screen (never while typing), G graphics, F9 god mode (owner "Jack" only).
  Keep on-screen prompts consistent; never intercept Ctrl+F. LOCK IN preserves the screen's native aspect ratio and running state.
  Q/T stay house controls during games. Console shoulder L uses U; PC shooters use Z for previous weapon and Y for chat. Family TV text uses Shift+T.

## Owner's layout edits
Jack exports `layout-edits.json` from god mode (name, room, file:line, original and new x/y/z/rotation). Apply each entry
by changing the matching `B.at(...)`/position call in the named file to the new values, then test and deploy.

## Open to-do (owner agreed)
1. "Lean into the screen": console games render onto the 3D telly's screen as a live texture (no 2D TV overlay or
   AV-switch pop-up); cartridges picked from the real shelf and inserted via the grab API; the camera glides in to frame
   the screen. Same for the PC: the desktop stays on the 3D monitor in its bezel (4:3), no full-screen hand-over.
   Owner-approved exception: LOCK IN (T or the Esc menu) makes the active PC, console, Game Lad or family-TV screen
   full-screen at its native aspect ratio without restarting it. Default remains in-world.
2. Put-things-back / tidy-up option for grabbed objects; room notes must not cover the view; texture and lighting pass.
3. Remaining "Windows"/"Microsoft" strings (md-rooms.js, hs-*.js, mods/roam.js); kitchen/bedroom furniture rotation audit;
   z-fighting at wall bottoms; front-door-open picking; patio table collision.

## Quality bar (the owner's standing rules - apply to EVERY task)
- Everything must be polished to a professional standard. "Works" is not done;
  "looks and feels like a finished, shipped 1999 game" is done.
- Artwork must look PROFESSIONAL: cohesive palette, believable materials, proper
  proportions, clean edges, no placeholder boxes or flat painted cards. Every 3D model
  is solid from every walkable angle (thickness, all faces, no gaps, contact shadows,
  no z-fighting, correct rotation, sitting ON surfaces not floating or intersecting).
- It must FEEL 1999: period hardware, print, fonts and UI; minimal in-world UI;
  no modern overlays.
- Intuitive within seconds: clear affordances, hover labels, smooth transitions,
  nothing confusing, nothing that traps the player.
- CHECK EVERYTHING YOU TOUCH, AND AROUND IT:
  1. After each change, take screenshots (tests/, Playwright) from several angles and
     distances at desktop 1366x860 and other relevant PC sizes; check that phones/tablets
     receive the PC-required screen (390x844), and actually look at the captures like a
     harsh art director.
  2. Test every path: rapid clicks, Esc mid-animation, refresh in every state
     (a refresh must never change state or go black), rotate/resize, walk into
     everything, open/close everything, keyboard/mouse and PC gamepads where supported.
  3. Zero console errors or warnings you caused; no "mod failed to load" on the server.
- IMPROVE WHAT YOU FIND: if while working you notice anything nearby that is broken,
  ugly, flat, misaligned, confusing or un-1999, fix it too (within the same files),
  then re-check. Iterate on each model and screen several times, comparing against
  how the real 1999 thing looked, until it is genuinely good.
- Never ship half-finished work: if something can't be finished, leave it working and
  list exactly what's left in the CHANGELOG entry and your report.
- At the end of every task, report honestly: what changed, what you verified with
  screenshots, and what you could not verify.
