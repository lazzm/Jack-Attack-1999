# Jack Attack 1999 - browser tests

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
