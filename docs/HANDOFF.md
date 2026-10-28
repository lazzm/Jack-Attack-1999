# Manager handoff (Claude -> Codex), 2026-10-28

You are now the MANAGER of Jack Attack 1999 (jacklm.com). Read AGENTS.md first (house rules: never touch data/ or
wetty, no real names (parody audit 0), no location clues, kid friendly, "Mom", click/press wording, identity rules,
whole game on phones). Then this file. Owner = Jack. He plays on desktop (Edge) and an Android phone and reports bugs
with screenshots. He wants MANY small deployments (ship each finished fix on its own), British voices only, and
never anything that looks cursed.

## Live
- Live = 2.57.13: wider walking camera and teenager eye height, CRT projection aligned during lens changes; 2.57.12 also included doorway/dialogue and carry/bin/slot fixes, rounded hips, person-person clearance, corrected family wrists and rebuilt first-person grips.
- Release flow per fix: merge branch into main -> `~/bin/gate /opt/stacks/landing [extra tests]` (ONLY="a b"/SKIP="a b"
  filters; e.g. `ONLY="check parody smoke" ~/bin/gate /opt/stacks/landing`) -> bump app/package.json + CHANGELOG.md entry
  -> `./deploy.sh` -> `curl -s https://jacklm.com/ | grep -o "v=2\.[0-9.]*-[0-9]*"` -> git commit (attribution) + `git push origin main`.
- Host is shared: run at most 3 heavy browser-testing workers at once (6-7 hit load 74 and every test timed out).
  Every throwaway server on a free port (`~/bin/freeport`). After stopping a worker, kill its leftover `node server.js`
  processes by PID (cwd under /opt/stacks/landing-*) — never pattern-kill node, never kill a shell.

## Open branches (worktree -> state -> what's left)  [all committed; WIP commits marked "WIP:"]
| worktree | branch | state | next |
|---|---|---|---|
| /opt/stacks/landing-loopfix | people-loopfix | shipped 2.57.10 | R104 complete. Focused gate 7/7, smoke 12/12, mobile 7/7; doorway/entrance regressions and desktop/phone/tablet screenshot review passed. Next: carry-arms. |
| /opt/stacks/landing-arms | carry-arms | shipped 2.57.11 | R100/R101/R105 complete; R83 edge-label fix and touch carry polish included. Next: people-hips. |
| /opt/stacks/landing-hips | people-hips | shipped 2.57.12 | R97/R99/R102 complete; R109 first-person grip rebuild and R110 wrist-side fix included. Camera shipped separately in 2.57.13; next: the rest of house-round2. |
| /opt/stacks/landing-camera | house-camera | shipped 2.57.13 | Camera G1/G2/G5 and R111 complete; native-lens and CRT corner capture review passed. |
| /opt/stacks/landing-house2 | house-round2 | gated for 2.57.14; Jack approved 7 m plot | R86/R88/R90/R93/R103 and R112 complete. Clearance 110/107 cm; save migration, real touch, exterior 144 views, NPC routines and mobile green. Remaining scale-audit rows stay open. Next: mobile-3. |
| /opt/stacks/landing-mobile3 | mobile-3 | 3 commits + WIP | R98 research-led mobile controls polish (docs/MOBILE-CONTROLS.md); mobile.mjs "Finger label on Mom" needs updating for personal space. |
| /opt/stacks/landing-props | props-pass | 4 commits + WIP | shape-hugging target glows, clothes/rubbish models, crisp packet, pentagon/hexagon football, cat + cat tree (R40/R68/R74/R77/R81). |
| /opt/stacks/landing-gfx | gfx-best | WIP (28 files) | R65 remove graphics options, best look always, real optimisation (no blur); R92 lighting incl. posters. |
| /opt/stacks/landing-voices | voices | merged (2.57.8) + WIP | nothing urgent. |
| (brief) ~/codex-runs/chores-polish.prompt.md | — | not started | R106 washing-up plate stays dirty/oversized; R80 bed-making hands-on; every chore visibly changes the world. |
| (brief) ~/codex-runs/console-flow.prompt.md | — | not started | R84 Game Lad fills the screen when playing (keyboard), T = full screen with mouse; R85 case system (cart/disc out of case into machine, case parked, put back on eject). |
Each branch: `git -C <worktree> merge main` before final tests; docs/BACKLOG.md has every R-item with details.

## Voices (British only!)
- Gemini TTS; key in ~/.secrets/gemini.env (never print/commit). 100 TTS requests/day.
- Every TTS tag now names a British speaker (tools/audio/gen-lines.mjs `WHO`, names/gen-names.mjs tags). The old
  American clips are archived in ~/jack-audio/lines/american-*/ — never ship them.
- Timers (linger enabled): jack-voice-lines-2 (29 Oct 08:15, 90 req) and -3 (30 Oct 08:15) re-record all 313 lines in
  ~/jack-audio/lines; jack-names-callouts-3 (31 Oct 07:15). After each run: check accent with
  `node ~/bin/accent-check.mjs <clips>` (expects British),
  then `node tools/audio/gen-lines.mjs --out ~/jack-audio/lines/voice --report ~/jack-audio/lines/lines-report.json --install app/public/audio/voice`
  and ship as a small release. Live has 3 British Mom clips.

## Owner preferences learned
- Many small releases; quality over speed; review every screenshot for bugs and log them in docs/BACKLOG.md.
- Stylised appealing characters (docs/PEOPLE.md), no uncanny realism. British everything. No real names (parody).
- Mobile matters a lot; he tests on Android Chrome.

## Manager release evidence, 28 October
- 2.57.10: focused gate `/tmp/gate-MFlT`, mobile `/tmp/jhp-loop-mobile-final.log`; both green. Dad walkthrough/entrance captures: `/opt/stacks/landing-loopfix/tests/shots/characters/loop-*`. Main smoke/mobile captures reviewed.
- The first broad gate was interrupted by SIGTERM; the focused gate reran Chapter 1, owner tools, identity and full smoke successfully. All unit checks had passed in the interrupted run too.
- R107 records the existing phone secret-banner/objective overlap for mobile-3. R83 labels still appear through some objects (seen again in mobile/small-20-house-landscape.png); retain for the carry/label work.
- No player data migrations or account resets in this release. Tests used disposable data. Physical Edge/Android hardware and gamepads remain unverified.
- Live 2.57.10 startup: all mods loaded; the existing `jw: furni check` hit uninitialised loot data before loot init (R108). No furniture/data repair attempted. Public health and build stamp checked after the normal 30-second container-health delay.

## Carry release evidence (2.57.11)
- Source/unit/parody gate `/tmp/gate-RA8f` green; physics `/tmp/jhp-arms-physics-final.log` 15/15. Chapter 1 and console-case tests passed in `/tmp/gate-fDE0`; its smoke run hit a one-shot profile-sync race. Updated smoke waits for real save confirmation without changing server limits; repeat gate `/tmp/gate-TpLZ` green, smoke 12/12.
- Mobile `/tmp/jhp-arms-mobile-final.log` 7/7; after touch polish `/tmp/jhp-arms-mobile-polish.log` 4/4. Focused regression `/tmp/jhp-arms-focused-v9.log` green: unchanged real model/scale, actual grip retained in every touch orientation, shallow eligible glows, rapid item switch, moved-bin refresh and tied-bag return/refresh (bin stays at its exact position, correct render layer).
- Final captures reviewed in `tests/shots/carry-arms/`, `tests/shots/physics/`, `tests/shots/mobile/`, `tests/shots/smoke/`. Early rotation captures without a held object were replaced by assertions and real thumb-drag activation.
- No server modules changed. Chore visual state adds binBagDocked/binRubbishAtRemoval; no cash, earning, account or shared-world records reset. Physical Edge/Android hardware and gamepads remain unverified. R107 remains for mobile-3; R108 remains pending a safe populated-state fixture and owner approval before any furniture repair.

## People and hand release evidence (2.57.12)
- Main has the people-hips merge (`cb8d38c`). R99 and R102 are complete. Three routine-day sweeps plus kitchen/hall crossings passed (`/tmp/jhp-hips-space-v14.log`): no standing-body overlap, wall/shut-door crossing or long doorway wait. Longest movement wait 0.8 s.
- Geometry: rounded covered waists, corrected left/right wrist targets (R110). Every Low/Potato outfit, near/far, includes its six shadow triangles in the strict 3,000 limit; maximum 2,998 (`/tmp/jhp-hips-budget-final.log`). Family adds six draw calls / 8,366 triangles. Static gallery reviewed in landing-hips/tests/shots/characters; walking/seated and job captures in main's tests/shots/characters. Latest fresh-conversation animation + seated own-side hand assertion passed (`/tmp/jhp-hips-arms-final.log`, 2/2).
- Gates: units/parody `/tmp/gate-Clwo` green. `/tmp/gate-bFn7` owner tools, identity and smoke green (12/12); its Chapter 1 hit a fresh-page 30-second timeout. `/tmp/gate-26OV` Halloween green; Chapter 1 caught the phone profile-import reload racing a bare assertion. Both fixture races corrected; final Chapter 1 `/tmp/gate-IwF3` green. Mobile six scenarios passed in `/tmp/jhp-hips-mobile.log`; its early mid-walk sample raced navigation. The revised test measures the actual pagehide position within 2 cm and passed in `/tmp/jhp-hips-mobile-story.log`.
- Jack then rejected the shipped first-person claws (R109). Rebuilt rounded grips in hs-world.js, one hand for small items, fingers behind the object, shorter sleeves. Early carry captures were reviewed and refined. Final front-face thumb contact and real-scale carry/bin/slot/refresh checks passed (`/tmp/jhp-hands-carry-final.log`); final captures in tests/shots/carry-arms reviewed. Physics `/tmp/jhp-hands-physics.log` 15/15. Final unit/parody/smoke gate `/tmp/jhp-hands-final-gate.log` green, smoke 12/12. Mobile `/tmp/jhp-hands-mobile-final.log` passed six scenarios; owner menu caught the same profile-import race. Waiting for the real handshake passed owner and account-gate reruns 2/2 (`/tmp/jhp-hands-mobile-owner.log`).
- Static release; no player-data migration/reset in this release. Physical Edge/Android/gamepads remain unverified. Then house-round2 camera as its own small release before front/living-room geometry.

## Camera release evidence (2.57.13)
- Camera isolated from house-round2 and merged before final gates. Syntax/unit/parody and Chapter 1 passed (`/tmp/gate-Xf9N`); its first smoke run was stopped after finding the CRT cache defect, then final source passed smoke 12/12 and focused syntax/parody (`/tmp/gate-sxjn`, `/tmp/gate-e7kL`).
- Physics 15/15; transitions 9/9; carry/bin/slots/refresh pass; mobile 7/7, then full/tablet 2/2 after the screen fix. Six viewport lens/CSS measurements and legacy standing resume pass. Four live desktop corners agree with the actual WebGL glass within 0.06 px; the regression fails the old cache at 72 px.
- Movement: 32 routes complete, zero stuck players. The initial audit flagged a 3 mm door-distance shortfall despite crossing the open plane; door waits now consume actual controller time. All twelve furnished/sparse shut/open door checks pass, zero findings (`/tmp/jhp-camera-doors.log`).
- Reviewed `landing-camera/tests/shots/camera-lens/`, CRT before/after, transition sheets, mobile phone/tablet portrait/landscape and carry captures. R107/R108 remain open; physical Edge/Android/gamepad testing unavailable. No item migrations or account/wallet/cap/shared-world changes.

## House-round2 release evidence (2.57.14)
- Jack approved extending the front plot by one metre on 28 October. Pavement is now z 1400, shared through House.FRONT; car x 500/z 1075 gives 109.8 cm doorstep/boot and 106.8 cm nose/gateway clearance. Street, neighbours, chores, seasonal props and family destinations follow the shared frame. Both walking and NPC grids include the whole pavement.
- Placement version 6 migrates old car/roof and raised lounge props once, including saved chair rotation; preserves metadata, hidden/snap and unbuilt records. Real saved roof contact and two refreshes pass (`/tmp/gate-kUhQ`). New mowing rows preserve old cut cells and extend already completed strips without changing progress or payments; incomplete strips stay uncut.
- Coffee table 90 x 50 cm, matching support/collision and 83 cm sofa gap. Re-laid sofa/chair/lamp and seating targets; brass coal-effect gas fire. Hedge is one closed rounded leafy volume, replacing the rejected separate blobs. Two A2 hero posters; restored the old WIP's commented-out poster interaction label.
- Scenery geometry: 81 static meshes / 84,674 triangles, closed volumes/grounding/phase stability pass. Final exterior 144 desktop/phone views have zero holes; both gable flank walls are present. Village streets, junction, shop and opaque moving horizon prevent the bare world edge.
- R112: the new lounge routes exposed a three-person hall queue. A blocked yielding person now requests room from the person behind, guarding cycles and seated/talking actors. Day and crossing checks pass with both expanded grids (`/tmp/jhp-house2-approved-people-grid.log`); maximum wait 1.7 s, no overlaps. Entrance, interruption across eighteen jobs, dialogue loop and crossings passed (`/tmp/jhp-house2-people-final.log`). Four lounge routes and six shut/open door checks have zero findings.
- Final gate `/tmp/gate-kUhQ`: syntax/unit/parody, Halloween, placement browser fixture, exterior and smoke green (12/12). Earlier core Chapter 1, identity and physics 15/15 green; owner+Halloween rerun green (`/tmp/gate-Uzyt`) after replacing a fixed 30 s test reload timeout. No application owner-flow changes. Mobile 7/7; approved-layout full/tablet/performance rerun 3/3 green. Real phone-finger input crosses behind the open boot and ahead of the car, then preserves standing pose, PC power and boot through refresh and three rotations (`/tmp/gate-wf6e`).
- Reviewed native-eye desktop 1366x860, phone 390x844/844x390, tablet 768x1024/1024x768 captures in `shots/house-scale/round2-approved-*`, plus `shots/front-plot/`, save-contact and exterior views. Broader open scale rows remain listed in SCALE-REVIEW. Physical Edge/Android hardware and gamepads unavailable. No account, wallet, earning-cap or shared-world resets; deploy performs its standard backup.
