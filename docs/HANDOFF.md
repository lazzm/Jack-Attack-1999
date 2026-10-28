# Manager handoff (Claude -> Codex), 2026-10-28

You are now the MANAGER of Jack Attack 1999 (jacklm.com). Read AGENTS.md first (house rules: never touch data/ or
wetty, no real names (parody audit 0), no location clues, kid friendly, "Mom", click/press wording, identity rules,
whole game on phones). Then this file. Owner = Jack. He plays on desktop (Edge) and an Android phone and reports bugs
with screenshots. He wants MANY small deployments (ship each finished fix on its own), British voices only, and
never anything that looks cursed.

## Live
- Live = 2.57.9 (main = e4563a5+ : one unreleased fix on main, "Mom's carry remarks play once each").
- Release flow per fix: merge branch into main -> `~/bin/gate /opt/stacks/landing [extra tests]` (ONLY="a b"/SKIP="a b"
  filters; e.g. `ONLY="check parody smoke" ~/bin/gate /opt/stacks/landing`) -> bump app/package.json + CHANGELOG.md entry
  -> `./deploy.sh` -> `curl -s https://jacklm.com/ | grep -o "v=2\.[0-9.]*-[0-9]*"` -> git commit (attribution) + `git push origin main`.
- Host is shared: run at most 3 heavy browser-testing workers at once (6-7 hit load 74 and every test timed out).
  Every throwaway server on a free port (`~/bin/freeport`). After stopping a worker, kill its leftover `node server.js`
  processes by PID (cwd under /opt/stacks/landing-*) — never pattern-kill node, never kill a shell.

## Open branches (worktree -> state -> what's left)  [all committed; WIP commits marked "WIP:"]
| worktree | branch | state | next |
|---|---|---|---|
| /opt/stacks/landing-loopfix | people-loopfix | WIP | URGENT R104: Dad parks in the bedroom doorway + Dad/Mom repeat scene lines forever. Once-per-step lines, bark cooldowns, never block a doorway, soft-hold releases <=10 s, regression test. Ship alone ASAP. |
| /opt/stacks/landing-arms | carry-arms | WIP | R100 hold the REAL object at real size close+low with short forearms (no shrink/grow, no long arms), R101 bin glitch, R105 shelf shows ghost copies of a box for slots that don't accept the carried item (only accepting slots, as subtle glows). |
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
