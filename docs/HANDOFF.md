# Manager handoff (Claude -> Codex), 2026-10-28

You are now the MANAGER of Jack Attack 1999 (jacklm.com). Read AGENTS.md first (house rules: never touch data/ or
wetty, no real names (parody audit 0), no location clues, kid friendly, "Mom", click/press wording, identity rules,
whole game on phones). Then this file. Owner = Jack. He plays on desktop (Edge) and an Android phone and reports bugs
with screenshots. He wants MANY small deployments (ship each finished fix on its own), British voices only, and
never anything that looks cursed.

## Live
- Live = 2.57.11: R104 doorway/dialogue hotfix plus R100/R101/R105 carry, bin and shelf-slot fixes (R83 edge labels too).
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
| /opt/stacks/landing-hips | people-hips | WIP | R102 everyone's hips: no waistband ledge/crotch wedge, rounded pelvis, hem drapes over hips; R99 people overlapping. |
| /opt/stacks/landing-house2 | house-round2 | 3 commits (camera 60 deg FOV + 143 cm eye) + WIP | finish + ship camera first; then R103 front door space (car further along the drive), lounge space (R90), village never ends (R88), hedge/piers/car (R86), docs/SCALE-REVIEW.md rows. |
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
