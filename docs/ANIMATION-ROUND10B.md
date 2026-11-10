# Models round 10b — release blockers

Base: `models` / `f8ba5cf`. Working-tree changes only; no commit, deployment, version, changelog, AGENTS, `site/` or live-data changes. The pre-existing voice-media symlink is preserved. All browsers run serially against their own `/tmp` data and local servers.

The release candidate's `np-life.js`, `np-rig.js`, `np-beats.js`, `social-irc.js` and `st-voice.js` byte-match HEAD before these fixes. Its voice manifest also matches this worktree, so the reproductions use the relevant release-candidate code and recordings.

Final result: **89/89 unit scripts; day/space/bump 3/3 on each of three runs; full UI HUD twice, 20 states each; voices 9/9; smoke 12/12; 24 recorded exchange turns; all selected round-10 contact, paper, drawing, mouth, intent and house checks passed.** The house run captured 72 native frames. Syntax/whitespace checks passed 12/12. Every final ledger stage had stable runtime source hashes; no local test listeners remain. The deliberately broken HEAD controller failed its staged route reproduction as expected.

## Mom's phone route

Avoidance can choose a checked `c.aside` and clear `c.goal` before the next planning tick. `dialogueHeld()` allowed an unrequested remark to recover a null goal only when `!c.aside`. With an aside pending, `talk.mom.context.chapter.2` therefore held the null goal: no route was planned and no movement step existed to finish/release the aside. This is a planning deadlock, not a saved-account reset or a relay acquiring a conversation hold.

The fix lets that pending checked aside become a route during an unrequested, non-story remark. Existing explicit player holds, requested dialogue and Chapter 1/opening instructions retain their hold. Speech is neither stopped nor selected again. Returning from the aside can then recover the phone goal.

`debug.sim()` fast-forwards movement while deliberately leaving speech/audio on their real clock. Thus a remark that remains current can strand the goal for the entire 60-second simulated test, even though normal playback would eventually finish the line. The fix makes route recovery independent of ending that passing remark; the regression keeps the actual line and voice handle rather than clearing `talking` to make the test pass.

The new assertion in `people-pass-unit.cjs` fails against unmodified HEAD and passes after the one-condition fix. It also checks that the same speech record survives and explicit conversation/story holds remain held. The browser reproducer stages a real navigation-checked aside while the actual chapter-2 line is current, then checks arrival and voice/line identity. Its before/after results are recorded below.

The initial unmodified `characters.mjs --only=bump` run passed here (exit 0, 38 seconds). That timing-dependent result is retained; it is not presented as a negative reproduction. The deliberately staged regression and repeated final whole cases provide the stronger evidence.

## UI page error

The unmodified full UI test reproduced the reported error. With page-error stacks enabled, the exact source was:

```
TypeError: Cannot read properties of null (reading 'connected')
    at join (.../js/social-irc.js:344:12)
    at .../js/social-irc.js:310:37
```

JackIRC finishes connecting, schedules auto-join 400 ms later, and the UI test closes its window during that interval. Its close handler clears `C`; the delayed callback still calls `join()`, which reads `C.connected`. Closing and immediately reopening also lets old connection callbacks affect the replacement client.

The fix binds connection progress, completion and delayed auto-join to their originating client **and connection attempt**. Closing, reopening, disconnecting or retrying invalidates old callbacks. `join()` also returns harmlessly when the client has closed. A deterministic test exercises ordinary connection, no auto-join, both close boundaries, reopen, disconnect, retry and a direct stale join. It fails against HEAD and passes with the fix.

Both defective conditions are also present in the parent 2.87.0 code: `social-irc.js` was unchanged by round 10, and the `!c.aside` condition was already present. These are timing-sensitive failures exposed in the release checks. I have not isolated which round-10 rendering/asset timing change makes the normal tests enter those windows more often; the failed states and callback lifetime are directly tested rather than inferred from that correlation.

## Preserving round 10

No changes to the rig, painted paper/drawing, work surfaces, authored exchange directions, phoneme tracks or voice playback. Only the planning hold guard and IRC callback lifetime change at runtime. Speech selection, eligibility, heard history, account data and save formats remain intact. The worktree and release candidate's voice manifests both contain 763 entries and have SHA-256 `2e800c2fddf40d56e3a4ebdf101d275bd4aaa791145c8fa9194e2822fe2c9dad`.

## Exact results and evidence

<!-- R10B_RESULTS -->
Before/diagnostic runs (including expected failures):

| Exact command | Exit | Evidence / meaning |
|---|---:|---|
| `FIXTURE_DEBUG=1 node tests/ui-hud.mjs` | 1 | [ui-before.log](../tests/shots/models/r10b/ui-before.log). Original application: exact null-client stack reproduced. |
| `node tests/characters.mjs --only=bump` | 0 | [bump-before.log](../tests/shots/models/r10b/bump-before.log). Original application: timing-dependent normal run passed. |
| `node tests/people-pass-unit.cjs` | 1 | [route-before.log](../tests/shots/models/r10b/route-before.log). Added regression before the planning fix: expected failure. |
| `node tests/people-pass-unit.cjs` | 0 | [route-after.log](../tests/shots/models/r10b/route-after.log). After the planning fix. |
| `IRC_LIFECYCLE_REF=HEAD node tests/irc-lifecycle-unit.cjs` | 1 | [irc-before.log](../tests/shots/models/r10b/irc-before.log). Original callbacks: expected lifecycle failure. |
| `node tests/irc-lifecycle-unit.cjs` | 0 | [irc-after.log](../tests/shots/models/r10b/irc-after.log). After the callback-lifetime fix. |
| `UI_HUD_CAPTURE=pause UI_HUD_RUN=r10b-1 FIXTURE_DEBUG=1 node tests/ui-hud.mjs` | 0 | [ui-after-diagnostic.log](../tests/shots/models/r10b/ui-after-diagnostic.log). Additional native-raster diagnostic UI pass; started before the planning-guard edit, so final proof uses the two frozen-source repeats below. |

Final unit sweep: **89/89 pass**. Every per-file command and exit is below.

| Exact command | Exit / signal | Seconds | Source stable |
|---|---:|---:|---|
| `node tests/models-route-recovery-r10b.mjs --baseline` | 1 (expected baseline failure) | 37.896 | True |
| `node tests/models-route-recovery-r10b.mjs` | 0 | 39.067 | True |
| `node tests/characters.mjs --only=day,space,bump` | 0 | 99.951 | True |
| `node tests/characters.mjs --only=day,space,bump` | 0 | 98.634 | True |
| `node tests/characters.mjs --only=day,space,bump` | 0 | 99.179 | True |
| `UI_HUD_CAPTURE=pause UI_HUD_RUN=r10b-final-1 FIXTURE_DEBUG=1 UI_HUD_PROGRESS=1 FIXTURE_RASTER_RATIO=.35 node tests/ui-hud.mjs` | 0 | 243.535 | True |
| `UI_HUD_CAPTURE=pause UI_HUD_RUN=r10b-final-2 FIXTURE_DEBUG=1 UI_HUD_PROGRESS=1 FIXTURE_RASTER_RATIO=.35 node tests/ui-hud.mjs` | 0 | 243.529 | True |
| `FIXTURE_RASTER_RATIO=.5 node tests/models-round10-gate.mjs --only=voices` | 0 | 430.332 | True |
| `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 FIXTURE_RASTER_RATIO=.5 node smoke.mjs` | 0 | 180.799 | True |
| `MODELS_EXCHANGE_LABEL=r10b node tests/models-exchanges-r8.mjs` | 0 | 237.46 | True |
| `node tests/models-paper-r10.mjs` | 0 | 6.871 | True |
| `node tests/models-drawing-r10.mjs` | 0 | 5.389 | True |
| `node tests/models-mouths-r10.mjs` | 0 | 37.959 | True |
| `node tests/models-intent-r10.mjs` | 0 | 78.558 | True |
| `node tests/models-round10.mjs --folder=r10b-house` | 0 | 159.052 | True |
| `cd tests && node announcements-unit.cjs` | 0 | 0.065 | True |
| `cd tests && node art-gallery-unit.cjs` | 0 | 0.154 | True |
| `cd tests && node art-return-unit.cjs` | 0 | 0.102 | True |
| `cd tests && node audio-routing-unit.cjs` | 0 | 0.15 | True |
| `cd tests && node beanbag-grip-unit.cjs` | 0 | 0.058 | True |
| `cd tests && node bedroom-hifi-unit.cjs` | 0 | 2.716 | True |
| `cd tests && node board-art-unit.cjs` | 0 | 0.148 | True |
| `cd tests && node bonfire-geometry-unit.cjs` | 0 | 0.619 | True |
| `cd tests && node bonfire-unit.cjs` | 0 | 0.105 | True |
| `cd tests && node case-actions-frame-unit.cjs` | 0 | 0.05 | True |
| `cd tests && node case-eject-unit.cjs` | 0 | 0.054 | True |
| `cd tests && node cat-pose-unit.cjs` | 0 | 0.206 | True |
| `cd tests && node console-surface-unit.cjs` | 0 | 0.051 | True |
| `cd tests && node cupboard-geometry-unit.cjs` | 0 | 2.009 | True |
| `cd tests && node dialogue-pools-unit.cjs` | 0 | 0.209 | True |
| `cd tests && node dialogue-requests-unit.cjs` | 0 | 0.068 | True |
| `cd tests && node family-phone-private-unit.cjs` | 0 | 0.132 | True |
| `cd tests && node fix-1102-unit.cjs` | 0 | 0.062 | True |
| `cd tests && node fixes2-1102-unit.cjs` | 0 | 0.074 | True |
| `cd tests && node fixes3-unit.cjs` | 0 | 0.087 | True |
| `cd tests && node fixes4-geometry-unit.cjs` | 0 | 0.334 | True |
| `cd tests && node fixes4-unit.cjs` | 0 | 0.065 | True |
| `cd tests && node fixes5-unit.cjs` | 0 | 0.057 | True |
| `cd tests && node fixture-predicate-unit.cjs` | 0 | 0.045 | True |
| `cd tests && node ghost-commit-unit.cjs` | 0 | 0.056 | True |
| `cd tests && node graphics-device-unit.cjs` | 0 | 0.058 | True |
| `cd tests && node grass-state-unit.cjs` | 0 | 0.053 | True |
| `cd tests && node house-readback-unit.cjs` | 0 | 0.036 | True |
| `cd tests && node hover-prompt-unit.cjs` | 0 | 0.058 | True |
| `cd tests && node hs-input-unit.cjs` | 0 | 0.067 | True |
| `cd tests && node identity-unit.cjs` | 0 | 0.559 | True |
| `cd tests && node interior-adapt-unit.cjs` | 0 | 0.092 | True |
| `cd tests && node interior-light-unit.cjs` | 0 | 3.43 | True |
| `cd tests && node irc-lifecycle-unit.cjs` | 0 | 0.037 | True |
| `cd tests && node jw-furni-unit.cjs` | 0 | 0.068 | True |
| `cd tests && node magazine-catalogue-unit.cjs` | 0 | 0.063 | True |
| `cd tests && node material-reflection-unit.cjs` | 0 | 0.06 | True |
| `cd tests && node mobile-frame-unit.cjs` | 0 | 0.041 | True |
| `cd tests && node mobile-phone-unit.cjs` | 0 | 0.685 | True |
| `cd tests && node models-appeal-unit.cjs` | 0 | 0.523 | True |
| `cd tests && node models-closeup-unit.cjs` | 0 | 2.085 | True |
| `cd tests && node models-face-unit.cjs` | 0 | 0.691 | True |
| `cd tests && node models-grips-unit.cjs` | 0 | 0.527 | True |
| `cd tests && node models-name-cues-unit.cjs` | 0 | 0.136 | True |
| `cd tests && node models-rig-unit.cjs` | 0 | 2.046 | True |
| `cd tests && node models-round10-unit.cjs` | 0 | 1.935 | True |
| `cd tests && node models-round7-unit.cjs` | 0 | 0.514 | True |
| `cd tests && node models-round8-unit.cjs` | 0 | 6.332 | True |
| `cd tests && node models-round9-unit.cjs` | 0 | 1.311 | True |
| `cd tests && node models-stair-interrupt-unit.cjs` | 0 | 5.728 | True |
| `cd tests && node models-weight-unit.cjs` | 0 | 0.989 | True |
| `cd tests && node movement-unit.cjs` | 0 | 0.713 | True |
| `cd tests && node norepeat-unit.cjs` | 0 | 0.153 | True |
| `cd tests && node onboard-layout-unit.cjs` | 0 | 0.04 | True |
| `cd tests && node owner-tools-unit.cjs` | 0 | 0.113 | True |
| `cd tests && node pause-pan-unit.cjs` | 0 | 0.06 | True |
| `cd tests && node pc-game-coordinates-unit.cjs` | 0 | 0.102 | True |
| `cd tests && node people-loop-unit.cjs` | 0 | 0.081 | True |
| `cd tests && node people-motion-unit.cjs` | 0 | 0.04 | True |
| `cd tests && node people-pass-unit.cjs` | 0 | 0.137 | True |
| `cd tests && node physics-unit.cjs` | 0 | 0.087 | True |
| `cd tests && node placement-migration-unit.cjs` | 0 | 0.064 | True |
| `cd tests && node pointer-release-unit.cjs` | 0 | 0.058 | True |
| `cd tests && node print-art-unit.cjs` | 0 | 0.142 | True |
| `cd tests && node props-geometry-unit.cjs` | 0 | 0.309 | True |
| `cd tests && node qa6-recovery-unit.cjs` | 0 | 0.055 | True |
| `cd tests && node qa7-unit.cjs` | 0 | 0.366 | True |
| `cd tests && node reading-turn-unit.cjs` | 0 | 2.845 | True |
| `cd tests && node roam-sync-unit.cjs` | 0 | 0.09 | True |
| `cd tests && node rupee-ledger-unit.cjs` | 0 | 0.063 | True |
| `cd tests && node season-cat-unit.cjs` | 0 | 0.067 | True |
| `cd tests && node seated-talk-unit.cjs` | 0 | 1.384 | True |
| `cd tests && node shop-sparse-unit.cjs` | 0 | 0.067 | True |
| `cd tests && node sms-private-unit.cjs` | 0 | 0.074 | True |
| `cd tests && node sound-meter-unit.cjs` | 0 | 0.051 | True |
| `cd tests && node sound-scheduler-unit.cjs` | 0 | 0.073 | True |
| `cd tests && node sound-space-unit.cjs` | 0 | 0.095 | True |
| `cd tests && node starter-unit.cjs` | 0 | 0.063 | True |
| `cd tests && node static-batch-unit.cjs` | 0 | 0.147 | True |
| `cd tests && node story-order-unit.cjs` | 0 | 0.108 | True |
| `cd tests && node story-unit.cjs` | 0 | 0.072 | True |
| `cd tests && node touch-picking-unit.cjs` | 0 | 0.052 | True |
| `cd tests && node ui-hud-unit.cjs` | 0 | 0.133 | True |
| `cd tests && node vfx-unit.cjs` | 0 | 0.175 | True |
| `cd tests && node voices-unit.cjs` | 0 | 0.665 | True |
| `cd tests && node wallet-unit.cjs` | 0 | 0.125 | True |
| `cd tests && node welcome-unit.cjs` | 0 | 0.066 | True |
| `cd tests && node world-pose-unit.cjs` | 0 | 0.063 | True |
| `cd tests && node world-sound-unit.cjs` | 0 | 0.057 | True |

Nested voices invocation and real per-case output:

`FIXTURE_RASTER_RATIO=.5 node tests/voices.mjs http://127.0.0.1:18080` → exit **0**, 430.021 seconds. Log: `/tmp/r10-gate-voices-1794314808365.log`.

| Voices case | Actual result |
|---|---|
| audio | PASS audio (2s) |
| layout | PASS layout (31s) |
| speak | PASS speak (57s) |
| muted | PASS muted (39s) |
| names | PASS names (139s) |
| edge | PASS edge (41s) |
| two | PASS two (35s) |
| prompt | PASS prompt (38s) |
| phone | PASS phone (47s) |

Syntax/whitespace: **12/12 pass**.

`node --check app/public/js/np-life.js` → exit **0**.

`node --check app/public/js/social-irc.js` → exit **0**.

`node --check tests/characters.mjs` → exit **0**.

`node --check tests/irc-lifecycle-unit.cjs` → exit **0**.

`node --check tests/models-round10-gate.mjs` → exit **0**.

`Python compile: tests/models-round10b-report.py` → exit **0**.

`node --check tests/models-round10b-review.mjs` → exit **0**.

`node --check tests/models-route-recovery-r10b.mjs` → exit **0**.

`node --check tests/people-pass-unit.cjs` → exit **0**.

`node --check tests/room-fixture.mjs` → exit **0**.

`node --check tests/ui-hud.mjs` → exit **0**.

`git diff --check` → exit **0**.

Full source hashes, log paths and exits: [results.json](../tests/shots/models/r10b/results.json).

Pending-aside browser before:
```json
{
  "before": {
    "x": 237.13711895421704,
    "z": 430.5899037436999,
    "room": "hall",
    "aside": true,
    "hold": 0,
    "talking": true
  },
  "aside": {
    "x": 237.13711895421704,
    "z": 430.5899037436999,
    "room": "hall",
    "aside": true,
    "hold": 0,
    "talking": true
  },
  "after": {
    "x": 237.13711895421704,
    "z": 430.5899037436999,
    "room": "hall",
    "aside": true,
    "hold": 0,
    "talking": true
  },
  "sameLine": true,
  "sameVoice": true,
  "line": "talk.mom.context.chapter.2",
  "talk": false,
  "requested": false
}
```

Pending-aside browser after:
```json
{
  "before": {
    "x": 237.13711895421704,
    "z": 430.5899037436999,
    "room": "hall",
    "aside": true,
    "hold": 0,
    "talking": true
  },
  "aside": {
    "x": 279.9670372952633,
    "z": 420.0081439199087,
    "room": "hall",
    "goal": "aside",
    "step": "act",
    "aside": true,
    "hold": 0,
    "talking": true
  },
  "after": {
    "x": 117,
    "z": 611,
    "room": "lounge",
    "goal": "debug.phone",
    "step": "act",
    "aside": false,
    "hold": 0,
    "talking": true
  },
  "sameLine": true,
  "sameVoice": true,
  "line": "talk.mom.context.chapter.2",
  "talk": false,
  "requested": false
}
```
<!-- /R10B_RESULTS -->

## Screenshot review

- [Native washing contact](../tests/shots/models/r10b-house/after/washup-110-3.png), [stirring contact](../tests/shots/models/r10b-house/after/cook-110-3.png), [turned newspaper](../tests/shots/models/r10b-house/after/paper-35-6.png), [phone portrait watering](../tests/shots/models/r10b-house/after/portrait-water.png).
- [Developing crayon picture](../tests/shots/models/r10-drawing/after/close-7.png); the dedicated paper/drawing fixtures also retain side/reverse and Low/Potato/standard captures.
- UI repeat captures: `tests/shots/ui-hud/after/r10b-final-{1,2}/`; five viewport sizes each. I reviewed phone portrait/landscape, tablet and desktop pause captures, and the fresh native work, page-turn, watering and drawing views. The approved round-10 appearance is retained.
- Unchanged rig, work-surface, exchange-direction, voice-player and phoneme source hashes are recorded in [preserved.json](../tests/shots/models/r10b/preserved.json).

## Verification limits

The first long combined runner was terminated with exit 143 during an unfinished frozen-source UI repeat, after all three character sweeps had completed. No test exit is invented for that unfinished child. Its local listeners were confirmed gone before restarting shorter serial commands. The interrupted log is `/tmp/r10b-browser-gate.log`.

- UI repeat runs retain every section, viewport, native-input and layout assertion; `UI_HUD_CAPTURE=pause` limits redundant screenshots. Any raster cap is explicit in the exact command. CSS viewport sizes and input assertions remain unchanged.
- The voices helper now inherits the test's normal automatic host scaling (or the caller's explicit `SMOKE_SCALE`) instead of forcing scale 3. The full voices assertions are unchanged. Smoke still receives the requested `SMOKE_SCALE=3 STORY_SCALE=3`.
- Physical devices and every possible asynchronous window/input interleaving are not certified by these software-browser checks. The deterministic lifecycle tests cover the reported stale callback and close/reopen/disconnect boundaries.
