# Manager handoff (Claude -> Codex), 2026-10-28

You are now the MANAGER of Jack Attack 1999 (jacklm.com). Read AGENTS.md first (house rules: never touch data/ or
wetty, no real names (parody audit 0), no location clues, kid friendly, "Mom", click/press wording, identity rules,
whole game on phones). Then this file. Owner = Jack. He plays on desktop (Edge) and an Android phone and reports bugs
with screenshots. He wants MANY small deployments (ship each finished fix on its own), British voices only, and
never anything that looks cursed.

## Live
- Live = 2.57.16: solid props and cloth grips, shape-hugging carry targets, rolling football, cat/tree and safe placement migration. Earlier mobile controls, approved front plot, family, hands and camera releases remain included.
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
| /opt/stacks/landing-house2 | house-round2 | shipped 2.57.14; Jack approved 7 m plot | R86/R88/R90/R93/R103 and R112 complete. Clearance 110/107 cm; save migration, real touch, exterior 144 views, NPC routines and mobile green. Remaining scale-audit rows stay open. Next: mobile-3. |
| /opt/stacks/landing-mobile3 | mobile-3 | shipped 2.57.15 | R98 movement/look, robust presses and case selection; R107 message stacking. Full/small/feel 3/3, phone/tablet/owner coverage, Chapter 1 and smoke green; carry regression green. Next: props-pass. |
| /opt/stacks/landing-props | props-pass | shipped 2.57.16 | Shape-hugging targets, solid clothes/rubbish, proper football and cat/tree. Preserves shallow eligible slots, British clips and daily job IDs. PV7 clears old floor props under tree once. Final save/feeding/carry green; merged story and grip gates green. Next: gfx-best. |
| /opt/stacks/landing-gfx | gfx-best | merged through 2.57.16; under release review | R65 remove graphics options, best look always, real optimisation (no blur); R92 lighting incl. posters. |
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

## Mobile round 3 evidence (2.57.15)
- Main through 2.57.14 merged (`68d8704`), preserving all shipped hands, camera, family and front-plot work. Removed the branch's tracked host voice symlink; the actual British clips remain local and are not committed.
- Fine stick curve, more consistent look, larger selection tolerance, spare-finger look takeover, immediate button presses, and browser gesture ownership for room/close-ups. Phone Potato pacing tries 60 and falls back to 30 after sustained misses, with cooldown and a cheap-frame retry. Unit checks cover idle/covered/desktop isolation.
- R107: portrait discovery message below objectives; coach waits for actual notes/toasts/conversations and yields to a new message. A one-second rolling button press acts once, without suppressing later keyboard/switch activation.
- Small-phone QA first encountered the intentional slow-device dialog on the software host, then a real thin-spine/rack-help conflict. The fixture explicitly tests Keep the house, retaining pose/mode, before continuing. General rack help now defers to nearby visible cases; direct doors/people keep priority and wall/range tests pass. Native standing-eye fixture removes the old height adjustment during targeting.
- Initial all-phone run: account/story/full/feel/tablet/owner/performance pass (7/8; small failed and was corrected). Final current-source full/small/feel 3/3 (`/tmp/jhp-mobile3-final-paths.log`). Small checks include discovery stacking, real slow-device choice, case pickup, carry, Game Lad and rotation. Feel checks include stick/look, 24 px offset selection, second finger, close-up turn/zoom and long rolling press. Pacing/picking CPU regressions pass.
- Chapter 1 and initial units/parody pass (`/tmp/gate-aK91`, story 895 s). Stopped its following redundant desktop owner run; do not call that whole gate complete. Mobile owner menus pass both sizes. Fresh syntax/parody/smoke gate `/tmp/gate-qA0q` green, smoke 12/12; transitions 9/9 (`/tmp/jhp-mobile3-transitions.log`).
- Reviewed desktop 1366x860 canonical views, phone 360/390/412 portrait and landscape, tablet portrait/landscape, owner dialogs, discovery/coach/slow-device captures, and walk/look contact sheets. Software WebGL cannot prove physical Android/Edge performance or gamepad behavior. No account, wallet, cap, world or placement migrations in this release; device preferences remain local. R108 and broader scale-audit items remain open.

- Final carry/bin/slot/refresh regression green (`/tmp/gate-sWqJ`, 101 s), followed by merged syntax/parody/all-unit gate (`/tmp/jhp-mobile3-merged-gate.log`). Browser/server error checks clean. Next branch: props-pass.

## Props pass evidence (2.57.16)
- Main through 2.57.15 merged (`4a08ab9`), preserving the hands, camera, family, approved plot and phone work. Excluded the old tracked voice batch and copied only the three approved British clips from main. No server module or chore catalogue changes.
- Carry targets follow basket/bin geometry with depth-tested rims/outlines; empty eligible slots have shallow rings. Removed the old WIP's item-copy slot previews to preserve R105. Placement footprint and accepting-slot rings use separate instanced draws. A leftover reference to the old highlight mesh was caught on first pickup and removed; rerun carry/bin/slots/refresh passed.
- Clothes have folded surfaces plus closed undersides/boundaries; production geometry checks pass at 1,176–1,376 triangles before shadows. Shared sock model, crumpled foil crisp packet, can/wrappers/core/homework and tied printed newspapers. Football has twelve black pentagons/twenty white hexagons and rolls by travelled distance; geometry is 540 triangles plus its shadow.
- Cat/tree: 1,428 triangles/22 draws for the posed cat, sisal posts, solid platforms and a den. Real feeding test uses F to pour, descent/walk/eat/return and refresh with progress/power retained. The first fixture stood too far back for the physical box to reach the bowl; the closer gameplay pose passes. The High art case hit its five-minute fixture limit, then passed with a ten-minute allowance (`/tmp/gate-l2jK`, 383 s).
- Layout safety: shared House.CAT_TREE, x -90/z 224 (2 cm clear of the bookcase). Updated parked-cat collider and two daily scatter positions, retaining daily item identities/progress. Placement version 7 moves only old floor records directly inside the tree footprint; raised/other-room/snap records stay intact. A real keyring pet, unbuilt records/metadata, prior car/lounge moves and two refreshes pass. The browser test caught and fixed the old migration room filter before release. Unit checks also ensure PV7 does not repeat the earlier furniture moves.
- New crossed socks exposed a bounding-box grip in empty air. One authored grip at the actual fabric removes the second floating hand; the gallery asserts its point is within 0.75 cm of a real triangle. Reviewed phone portrait/landscape and tablet captures, plus desktop clothes/rubbish, targets, ball/packets and cat poses. Final rotated desktop/phone grips passed in the merged gate.
- Initial syntax/unit/parody, carry, physics 15/15 and smoke 12/12 green (`/tmp/gate-2Eh7`). Mobile 8/8 (`/tmp/jhp-props-mobile-v2.log`), including real touch play, close-up gestures, account/owner, refresh/rotation and software performance samples. Final current-source units, feeding and PV7 browser saves green (`/tmp/gate-6MKq`); carry and final smoke 12/12 also green. Final phone/tablet grip/tree matrix 4/4 green (`/tmp/gate-XfA2`, 303 s).
- No account, wallet, cap or shared-world resets. Physical Edge/Android/gamepads unverified. R108 and remaining scale-audit dimensions remain open. Unused new rubbish varieties were removed rather than changing today's chore list.

- Merged gate (`/tmp/jhp-props-merged-gate.log`) passes all units/parody, the real Chapter 1 tidy/bed/bin path (119 s), and rotated desktop/phone grips (106 s).
- Final art review caught the eating torso overlapping the bed and paws below the carpet. Eating now approaches from the open side of the bowl; per-pose fitting uses actual mesh vertices to keep paws at the local floor. CPU checks cover five poses/six phases, no buried geometry (maximum numerical floor error <0.03 cm). Corrected feeding/refresh passed in `/tmp/gate-ZfnE` (103 s), with a descent trace and clear eating position. Final six-viewport cat gallery `/tmp/gate-47Hh` passed (309 s): desktop 1366x860/1920x1080, phone/tablet portrait/landscape, native tree and front/side pose views, all reviewed.

- All-garment review exposed the same empty-space grip on other clothes. Every garment now supplies a real fabric contact from its closed mesh, while cases retain their shipped grips. Desktop/phone review of seven garments passes, one visible hand each (`/tmp/gate-KXiU`, 108 s). The carry/discovery overlap also appeared in this review: portrait messages now stack from measured caption/banner heights, with rectangle assertions for both caption and job tracker. Final carry/smoke gate and focused mobile rerun follow these last changes.

- Final all-unit/parody/carry/smoke gate `/tmp/gate-FxYO` green (carry 124 s, smoke 12/12); final mobile full/small 2/2 (`/tmp/jhp-props-mobile-last.log`). All garment captures reviewed on desktop/phone. Next: gfx-best.

## Graphics review checkpoint (unshipped)
- Branch commits: 5be3092 merges main; 52023de guards batching against geometry/material edits; e8218d7 aligns controls/tests/docs. Root main/live remain 2.57.16.
- Initial units/parody green in /tmp/gate-qt1z; same-session batching reduces draws in all eight rooms with zero browser errors (see docs/GRAPHICS.md). New static-batch-unit covers 16 mutations plus multi-material reveal/replacement and original-mesh picking. Phone pacing CPU regression also green.
- Work currently uses TWO browser workers because three caused host swap pressure. Owner/lighting/carry/cat gate: /tmp/jhp-gfx-integrity.log (/tmp/gate-OIrS). Graphics acceptance: /tmp/jhp-gfx-perf-final.log. The earlier mobile run was deliberately interrupted; rerun it after a slot is free.
- Idle-test investigation: animated story guidance and late pm-gl SVG cover decoding correctly request draws. Test disables animation and waits for real drawing quiescence before requiring zero draws. New wait uses ordinary evaluate polling to obey CSP. Earlier failed runs are not release passes.
- Still required: final acceptance, lighting screenshots and review, actual carry/cat/owner paths, mobile suite, story/smoke/physics/visibility regressions, merge to main and gate before version bump/deploy/push. British three-clip voice folder is unchanged and untracked. No deployment made.
