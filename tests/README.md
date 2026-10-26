# Jack Attack 1999 - browser tests

## Start here

Run **`cd tests && node smoke.mjs`** before each deploy (or `node tests/smoke.mjs` from the repo root).
It starts and stops its own server on a free port in 18080–18099, creates fresh accounts/state under
`/tmp`, and uses installed Playwright with `/usr/bin/chromium`. No hand-started server or new dependencies.
Expect under three minutes on software WebGL; exit 0 means every selected check passed.
Each check has a timeout and failures do not stop later checks. Console errors/pageerrors and fatal server
log messages fail the gate. The final line records the unmasked GPU renderer and per-view draw calls.

`--only=<name>` selects one check (including its authenticated room setup when needed):
`account-house`, `walk-refresh`, `pc-controls`, `console-game`, `phone-typing`, `prop-refresh`,
`escape-menu`, `canonical-views`, `mobile-desktop`, `browser-errors`, `server-log`.
A selected run is diagnostic; only the full suite is a deploy gate. Error/log checks alone have no gameplay coverage.
`--keep-shots` preserves previous images and adds failure/mobile portrait/landscape captures.
By default the runner replaces `tests/shots/smoke/`; the full run always writes six canonical PNGs:
`bedroom-door`, `desk-pc`, `tv-consoles`, `landing-stairs`, `kitchen`, `front-garden`.
Views use fixed camera coordinates, 1366×860, low graphics and 14:00 daylight through the shared fixture.
Temporary secret/toast balloons are hidden in canonical captures to keep comparisons consistent.
Compare art and draw counts on the same renderer; these are software-rendering diagnostics, not hardware FPS claims.
Scene APIs position the player; real keys exercise interactions. The exterior art camera uses the existing
regression’s street observer pose beyond the walkable boundary. This does not test walking a complete house route.
On SIGINT/SIGTERM, failure or timeout it closes Chromium, kills only its own server PID and removes its temporary data.

The inventory below classifies every existing `.mjs`/`.cjs` script. “Smoke-covered” means the
short deploy gate; focused regressions still cover deeper paths. “Obsolete” means historical setup/control
assumptions or one-off probes, requiring migration before reuse, not permission to delete.
No legacy script is silently executed by the smoke runner.

| Classification | Scripts | When to use |
| --- | --- | --- |
| smoke-covered | `smoke.mjs` | Signup/WebGL, WASD/pose refresh, PC/app/Q/F2/T, physical console, phone typing, E placement/refresh, Esc, mobile-only desktop, errors/logs, six art views. |
| still-useful-regression (units) | `audio-routing-unit.cjs`, `bedroom-hifi-unit.cjs`, `family-phone-private-unit.cjs`, `hs-input-unit.cjs`, `magazine-catalogue-unit.cjs`, `mobile-phone-unit.cjs`, `neighbourhood-geometry.cjs`, `parody-audit.cjs`, `pc-game-coordinates-unit.cjs`, `reading-turn-unit.cjs`, `sms-private-unit.cjs`, `starter-unit.cjs`, `wallet-unit.cjs` | Run selectively for the changed area; read the script’s arguments first. Live scripts are read-only post-deploy checks only. |
| still-useful-regression (accounts/devices/live) | `account-form.mjs`, `accounts-bank.mjs`, `accounts-profile.mjs`, `accounts-sockets.mjs`, `house-model-geometry.mjs`, `live-pc-only.mjs`, `live-readonly.mjs`, `mobile-desktop.mjs` | Run selectively for the changed area; read the script’s arguments first. Live scripts are read-only post-deploy checks only. |
| still-useful-regression (room/control/art) | `adaptive-render.mjs`, `ao-geometry.mjs`, `audio-settings.mjs`, `bedroom-hifi.mjs`, `box-art.mjs`, `chair-pc-menu.mjs`, `chair-placement.mjs`, `console-case-play.mjs`, `console-cases.mjs`, `console-switch-hud.mjs`, `controls-media.mjs`, `controls-qt.mjs`, `desk-render-controls.mjs`, `disc-shortcuts.mjs`, `door-editor-state.mjs`, `door-interaction-review.mjs`, `door-seal.mjs`, `doorway-lighting.mjs` | Run selectively for the changed area; read the script’s arguments first. Live scripts are read-only post-deploy checks only. |
| still-useful-regression (room/control/art) | `doorway-walk-drop.mjs`, `editor-layout-safety.mjs`, `exterior-art-final.mjs`, `exterior-rebuild.mjs`, `frame-budget.mjs`, `game-ui.mjs`, `golden-movement.mjs`, `graphics-menu-ui.mjs`, `house-lights.mjs`, `house-save-startup.mjs`, `inspect-free-rotation.mjs`, `kart-recording.mjs`, `kart-ui.mjs`, `lawn-completion.mjs`, `lighting.mjs`, `lock-in-handheld.mjs`, `login-seat.mjs`, `lounge-art.mjs` | Run selectively for the changed area; read the script’s arguments first. Live scripts are read-only post-deploy checks only. |
| still-useful-regression (room/control/art) | `magazine-covers.mjs`, `magazine-turning.mjs`, `media-touch.mjs`, `menu-catalogue.mjs`, `model-followup.mjs`, `object-audit.mjs`, `pc-access-and-layout.mjs`, `pc-console-controls.mjs`, `pc-game-monitor-input.mjs`, `pc-lock-in-fill.mjs`, `pc-surface-budget.mjs`, `pc-view-performance.mjs`, `physical-phone-use.mjs`, `posters-v3.mjs`, `print-light-marker.mjs`, `printed-art.mjs`, `prop-interaction-models.mjs`, `prop-placement-final.mjs` | Run selectively for the changed area; read the script’s arguments first. Live scripts are read-only post-deploy checks only. |
| still-useful-regression (room/control/art) | `reading-cd-shelf.mjs`, `reading-motion-recording.mjs`, `reading-pages.mjs`, `reading-phone.mjs`, `release-room-pc.mjs`, `render-perf.mjs`, `review-models.mjs`, `room-props-closeups.mjs`, `room-props-controls.mjs`, `room-props-seats.mjs`, `room-render-lifecycle.mjs`, `room-render-soak.mjs`, `screen-effort.mjs`, `seated-pc-transition.mjs`, `shelf-print-polish.mjs`, `sms-private-browser.mjs`, `stand-crouch.mjs`, `starter-account.mjs` | Run selectively for the changed area; read the script’s arguments first. Live scripts are read-only post-deploy checks only. |
| still-useful-regression (room/control/art) | `surface-audit.mjs`, `unified-interaction.mjs`, `vhs-physical.mjs`, `window-artifacts.mjs`, `window-views.mjs` | Run selectively for the changed area; read the script’s arguments first. Live scripts are read-only post-deploy checks only. |
| still-useful-regression (models) | `desk-lamp.mjs`, `room-models.mjs` | Authenticated model/lamp geometry and persistence checks. |
| obsolete | `art-loading.mjs`, `artcheck.mjs`, `bookcase.mjs`, `cur3.mjs`, `discs3.mjs`, `egg.mjs`, `fps.mjs`, `fresh.mjs`, `handheld.mjs`, `house-entry.mjs`, `house-resume.mjs`, `house-review.mjs`, `house-save.mjs`, `inspect.mjs`, `integ.mjs`, `jsnt.mjs`, `lean-edges.mjs`, `lean-power.mjs`, `lean-qa.mjs`, `loot.mjs`, `n99.mjs`, `newpacks.mjs`, `newsites.mjs`, `pc-recovery.mjs`, `pc-restart.mjs`, `pcmouse.mjs`, `pwrbtn.mjs`, `resetinst.mjs`, `resetpc.mjs`, `rotate.mjs`, `shelf-layout.mjs`, `smoke3.mjs`, `standwake.mjs`, `trayprobe.mjs`, `tv-background.mjs`, `tw2.mjs`, `zrc.mjs` | Historical probes: account gate, fullscreen/mobile room, hard-coded paths or old exit controls; do not use as a deploy gate. |
| support utilities (not tests) | `create-approved-test.mjs`, `prepare-box-art.mjs`, `prepare-posters.mjs`, `prepare-print-art.mjs`, `replicate-kart-trial.mjs`, `room-fixture.mjs` | Fixture/art preparation/account provisioning/external audio trial. Never auto-run provisioning or asset mutation. |


Exterior/grass/door checks (disposable localhost data only):

    node exterior-rebuild.mjs http://localhost:18080
    node exterior-art-final.mjs http://localhost:18080
    node lawn-completion.mjs http://localhost:18080
    node seated-pc-transition.mjs http://localhost:18080
    node neighbourhood-geometry.cjs

Review `shots/exterior/` captures from `tests/`: front/back/town, day/night, high-quality views, mowing and saved progress.

Unified object interaction/seating (disposable localhost data only):

    node unified-interaction.mjs http://localhost:18080
    node prop-interaction-models.mjs http://localhost:18080

Checks F/I entry, real controls, keyboard rotation/zoom, seated reading/pet/phone/held Game Lad, return/refresh, and prop model views.

Room interface regression (disposable localhost data only):

    node game-ui.mjs http://localhost:18080

Checks contextual carry actions, Q/right-click return, inspection, stable idle HUD,
pause-menu layout, audio/graphics navigation, tooltip bounds, subtitle/job spacing and typing guards.
Review `tests/shots/game-ui/` after running from `tests/`.

Current device-policy and room-layout regression (disposable localhost data only):

    node mobile-desktop.mjs http://localhost:18080
    node pc-access-and-layout.mjs http://localhost:18080
    node pc-console-controls.mjs http://localhost:18080

Phones/tablets use fullscreen JackOS only, behind the same account gate. The room remains
desktop-only. Verify touch desktop launching/reading, saved room/power preservation and no room renderer.

Current physical-room regressions (disposable localhost data only):

    node bedroom-hifi-unit.cjs
    node house-model-geometry.mjs
    node bedroom-hifi.mjs http://localhost:18478
    node door-interaction-review.mjs http://localhost:18478
    node desk-render-controls.mjs http://localhost:18478
    node model-followup.mjs http://localhost:18478
    node pc-view-performance.mjs http://localhost:18478 review

Inspect the generated `tests/shots/` images. Software-WebGL frame times do not predict
hardware FPS; the desk test also guards draw counts and physical controls. The hi-fi
uses owned audio CDs; it does not grant media or invoke PC/console autorun.

Room review regressions (disposable localhost data only):

    node review-models.mjs http://localhost:18476 # factory/custom magazine poses, square tiles, car washing and six desktop/narrow views
    node editor-layout-safety.mjs http://localhost:18476 # reject stale line-key edits; recover unique legacy/stable-target edits
    node window-views.mjs http://localhost:18476 # permanent sight lines, clear kitchen glass from both sides, door states and refresh
    node print-light-marker.mjs http://localhost:18476 # matte poster distance checks and shelf marker lifecycle/occlusion
    node room-render-soak.mjs http://localhost:18476 43 # background TV, room/door/light cycles, reload and context recovery

The software-WebGL fixture allows 60 seconds for initial navigation and 90 for refresh when a soak
runs beside one focused regression. Run hardware performance comparisons alone.

Printed reading matter (throwaway localhost accounts only):

    node magazine-catalogue-unit.cjs
    node magazine-turning.mjs http://localhost:18475 # closed front -> every page -> closed back; reverse, resize, refresh and interrupted turns
    node door-editor-state.mjs http://localhost:18475 # saved editor transforms cannot open a logically shut door; --before reproduces on an unpatched copy
    node reading-pages.mjs http://localhost:18474 # 108 fitted pages; twelve issues, paperbacks, directory, TV guide, comic; bookmarks/refresh
    node shelf-print-polish.mjs http://localhost:18474 # Pixel Post orientation; held layers; keyboard/touch; cover CD; directory shelf support

Current F/E media and account regressions (localhost throwaway servers only):

    node posters-v3.mjs http://localhost:18466 # complete poster prints, real clicks/zoom, Q, resize, Esc and refresh
    node controls-qt.mjs http://localhost:18466 # Q lean-back, T LOCK IN, typing guards and reserved game keys
    node disc-shortcuts.mjs http://localhost:18466 # four PC-game modules and remapped key-help dialogs
    node printed-art.mjs http://localhost:18464
    node golden-movement.mjs http://localhost:18464
    node door-seal.mjs http://localhost:18464
    node account-form.mjs # frontend 18464; starts/stops its own isolated authentication backend

    node chair-placement.mjs http://localhost:18463
    node reading-phone.mjs http://localhost:18463
    node box-art.mjs http://localhost:18463
    node --expose-internals parody-audit.cjs # dry-run authored-text audit; --write is an explicit bulk rewrite

    node controls-media.mjs http://localhost:18461
    node console-case-play.mjs http://localhost:18461
    node login-seat.mjs http://localhost:18461
    node media-touch.mjs http://localhost:18461
    node starter-account.mjs http://localhost:18461 # requires an unused test account in disposable data
    node starter-unit.cjs
    node wallet-unit.cjs

`create-approved-test.mjs` is NOT a test: it creates the specifically owner-approved
account through signup, never replaces an existing user, and requires `--approved-live`
for the production URL. Do not include it in an automated test run.

Playwright scripts that drive the real site in Chromium (uses the system browser at `/usr/bin/chromium`, no download).

    cd tests && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install

Start a throwaway dev server (never point tests at live data you care about):

    cd app && npm install && PORT=18080 DATA_DIR=/tmp/jhp-test ADMIN_TOKEN=testtoken node server.js

Then run a script with the base URL (or port) it expects, e.g.

    node smoke3.mjs http://localhost:18080     # main areas, desktop + phone
    node integ.mjs 18080                       # the big all-in-one (boot, logon, many programs, fake web)
    node standwake.mjs                         # refresh at the PC then stand up (edit the URL inside)
    node pcmouse.mjs                           # the desktop keeps the mouse after switching on from the room

The in-room monitor regressions accept a throwaway base URL:

    node lean-qa.mjs http://localhost:18080 1366x768
    node lean-qa.mjs http://localhost:18080 1920x1080
    node lean-qa.mjs http://localhost:18080 2560x1080
    node lean-qa.mjs http://localhost:18080 1366x860
    node lean-power.mjs http://localhost:18080  # real power button, guest logon, shutdown, off refresh
    node lean-edges.mjs http://localhost:18080  # pointer-lock ownership, rapid seating, Esc during shutdown
    node bookcase.mjs http://localhost:18080    # isolated media collection, slot returns, disc/case, tidy and refresh
    node shelf-layout.mjs http://localhost:18080 # rearrange, rapid grabs/drops, mid-slide refresh, tidy and separate roaming test profiles
    node tv-background.mjs http://localhost:18080 # Esc continuation, re-entry, background refresh, true stop
    node lighting.mjs http://localhost:18080 review # eight spaces, day/dusk/night, ceiling switch and off-light budget
    node inspect.mjs http://localhost:18080     # same-model inspection, mouse face turns, rotation, refresh
    node handheld.mjs http://localhost:18080    # rear cartridge, stable play pose, Esc and interrupted lift
    node house-review.mjs http://localhost:18080 # eight spaces, stable light sources and aligned car mud
    node art-loading.mjs http://localhost:18080 # cold artwork preparation and transition into the room
    node house-resume.mjs http://localhost:18080 bedroom,landing,hall,cupboard # refresh, saved doors and carry/jump/inspect controls
    node house-resume.mjs http://localhost:18080 lounge,kitchen,garden,drive # downstairs/outdoors, narrow view and powered-off resume
    node house-save.mjs http://localhost:18080 # deferred props, unbuilt room saves, old poses and invalid-camera recovery
    node pc-restart.mjs http://localhost:18080 # same-scene restart, duplicate requests, repeat guest logoff, resize/input and BIOS refresh
    node pc-recovery.mjs http://localhost:18080 # two simulated crashes, ScanDisk and the same background TV game
    node house-entry.mjs http://localhost:18080 # no legacy intro flash, direct room entry, desktop/touch refresh, manual PC and simulated WebGL failure

Omit the last argument to `lean-qa.mjs` to run all five sizes, including 390x844. Screenshots are saved in `tests/shots/` when run from this directory. These scripts keep the real CSP enabled and use isolated browser storage.
The two `house-resume.mjs` batches avoid long-running software-WebGL sessions; omit the room list to run all eight together. Its room placement uses collision-valid cells rather than claiming to exercise a complete walked route through every doorway. Both new house regression scripts reject non-localhost targets.
Account and cash-wallet regressions (localhost only):

    node wallet-unit.cjs                         # additive wallet, wages, exchange/replay, caps and rollover
    node accounts-sockets.mjs http://localhost:18080 # server-side anonymous blocking and account lifecycle
    node accounts-bank.mjs http://localhost:18080 # signup, real job wages, bank exchange and narrow screenshots
    node accounts-profile.mjs http://localhost:18080 # cross-browser saves, wrong password and member logoff
    node room-models.mjs http://localhost:18080      # beanbag/pads, sampled cable clearances, walking collision and refresh; desktop/narrow captures
    node desk-lamp.mjs http://localhost:18080        # bulb alignment, cable clearances, repeated switching, on/off refresh and multi-angle day/night captures

Historical room scripts above which assume anonymous gameplay or a Guest button need authenticated setup before use with mandatory accounts. They are not claimed as current account-gate regressions.
Authenticated lighting/render/save regressions (localhost only; screenshots in `shots/`):

    node doorway-lighting.mjs http://localhost:18080 final 14 low # identical view across room ownership, day/night and graphics tier arguments
    node doorway-walk-drop.mjs http://localhost:18080 # actual WASD doorway crossing and immediate dropped-object refresh
    node house-lights.mjs http://localhost:18080 # physical switches, keyboard/mouse, rapid toggles and persistent lamp/fire state
    node house-save-startup.mjs http://localhost:18080 # modern, newer local-large and legacy fallback saves before Apps loads
    node ao-geometry.mjs http://localhost:18080 # inward wall shading, fade UVs and stair/door screenshots
    node lounge-art.mjs http://localhost:18080 # cabinet sliding doors/refresh, bowl, lamp and cable clearances
    node room-render-lifecycle.mjs http://localhost:18080 # PC pointer ownership, front props, inspection, background console and glass
    node room-render-soak.mjs http://localhost:18080 18 # minutes of room/door/light cycles, reload and forced WebGL context recovery
    node render-perf.mjs http://localhost:18080 after # software-WebGL frame/render timings; compare against an isolated baseline copy

`room-fixture.mjs` creates disposable accounts and rejects non-localhost URLs. Run these sequentially on software WebGL; several simultaneous room browsers can exhaust CPU and time out loading. A long soak may run beside one focused test, but performance comparisons must run alone.

For a post-deploy visual check only, `node live-readonly.mjs https://jacklm.com` checks the mandatory account screen and browser errors. It does not log on, create an account or change game state.

Authenticated object/control regressions (localhost only; run from `tests/`):

    node controls-qt.mjs http://localhost:18080 # Q/T shortcuts, typing/delete/modifier guards, console conflicts, desktop/phone captures
    node chair-pc-menu.mjs http://localhost:18080 # chair angles, Esc menu, first-person PC and 4:3 LOCK IN/refresh
    node chair-placement.mjs http://localhost:18080 # F/E/click furniture drops near feet, rotated clearance, PC safety and refresh
    node console-cases.mjs http://localhost:18080 # real F pickup/open, custom slots, media return, tidy/refresh and full nineteen-box rack
    node console-case-play.mjs http://localhost:18080 # physical box-to-console play, Q/background refresh, eject and own-box return
    node console-switch-hud.mjs http://localhost:18080 # paused Daydream/kart → Goldenballs, actual compiled HUD bindings and LOCK IN captures
    node room-props-controls.mjs http://localhost:18080 # F repeats, furniture collision, safe placement, inspection and pillow refresh
    node vhs-physical.mjs http://localhost:18080 # physical insertion, playback away/refresh/eject, reusable return slots and TV LOCK IN
    node release-room-pc.mjs http://localhost:18080 # Goldenballs, T/typing guard, same-scene shutdown, off refresh and power-on
    node lock-in-handheld.mjs http://localhost:18080 # same-instance Game Lad LOCK IN, 10:9 aspect and desktop/narrow resizing
    node object-audit.mjs http://localhost:18080 final # multi-angle desktop/narrow views and finite geometry
    node surface-audit.mjs http://localhost:18080 final # candidate coplanar overlaps and exterior/threshold captures

Esc now opens the game menu; historical scripts expecting immediate Esc exit need updating. Candidate overlap counts include hidden model joins, not just visible z-fighting. These tests use Chromium/software WebGL, not physical-hardware performance measurements.

Most print `no errors` / `NO ERRORS` when they pass. Screenshots go in `shots/` (git-ignored).
Some scripts have a hard-coded URL or port near the top: check before running. On the server they are run under
`systemd-run --user --scope -p MemoryMax=3G -p MemorySwapMax=0 -q node <script>` to cap memory.


PC screen-performance and current-input checks (authenticated disposable localhost; run serially):

    node hs-input-unit.cjs
    node mobile-phone-unit.cjs
    node reading-turn-unit.cjs
    node graphics-menu-ui.mjs http://localhost:18080
    node physical-phone-use.mjs http://localhost:18080
    node reading-cd-shelf.mjs http://localhost:18080
    node inspect-free-rotation.mjs http://localhost:18080
    node window-artifacts.mjs http://localhost:18080
    node screen-effort.mjs http://localhost:18080
    node adaptive-render.mjs http://localhost:18080
    node pc-game-coordinates-unit.cjs
    node pc-game-monitor-input.mjs http://localhost:18080
    node frame-budget.mjs http://localhost:18080
    node pc-surface-budget.mjs http://localhost:18080
    node reading-motion-recording.mjs http://localhost:18080 after desktop

Record the baseline on an isolated checkout using `before` in place of `after`.
Videos, timelines and extracted frames stay in ignored `tests/recordings/`; actually inspect motion as well as stills.
Recording needs the Playwright FFmpeg binary to pass its own `-version` preflight.
Frame timings use software Chromium and are comparative diagnostics, not a hardware FPS promise.
`window-artifacts.mjs --source-only` checks generated drainpipe/glazing clearance without a browser.

Read-only post-deploy checks (no logon or game actions):

    node live-readonly.mjs https://jacklm.com 2.42.0
    node live-pc-only.mjs https://jacklm.com

Bedroom prop/seating and neighbourhood review (disposable localhost; serial browser runs):

    node neighbourhood-geometry.cjs
    node room-props-seats.mjs http://localhost:18080
    node room-props-closeups.mjs http://localhost:18080
    node prop-placement-final.mjs http://localhost:18080
    node pc-lock-in-fill.mjs http://localhost:18080

The full-size JackOS desktop fills the browser viewport; the in-world monitor remains 4:3.
Console and handheld LOCK IN keep their original aspect ratios. Outdoor observer captures
include views beyond the playable boundary; they do not imply a new walkable town.

Sparse registration / Pixel Post pack (disposable localhost data only):

    PORT=18081 DATA_DIR=/tmp/jhp-shop-sparse ADMIN_TOKEN=testtoken node tests/shop-sparse-server.cjs
    cd tests
    node starter-unit.cjs
    node shop-sparse-unit.cjs
    node shop-sparse.mjs http://localhost:18081
    node shop-sparse-legacy.mjs http://localhost:18081

`shop-sparse-server.cjs` refuses non-test ports/data/token and adds an authenticated
`/admin/qa-credit` fixture solely in the test process. The production server has
no credit endpoint. The browser tests cover fresh signup, sparse inventory,
console/magazine/game orders, physical F/E controls, upstairs carry, reading slots,
play/background refresh, old full-room migration and phone JackOS-only entry.
Captures are under `shots/shop-sparse/`. Stop only the server PID listening on the
chosen test port. These tests never deploy or read production data.
