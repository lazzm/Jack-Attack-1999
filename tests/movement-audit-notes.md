Run `node tests/movement-audit.mjs after --account=full` and then
`node tests/movement-audit.mjs after-sparse --account=sparse` from the repository root.
Each runner starts and stops its own server on a free port in 18080–18099, with a
fresh `/tmp/jhp-movement-*` directory. The full profile is admin-registered as an
existing account; the sparse profile follows real signup. Production saves are
never read or copied. No dependencies are added.

The controller keeps its 22 cm body radius and existing input/speed settings. It
sweeps in at most 3 cm increments, resolves up to three contact planes, and uses a
0.05 cm contact skin. Room boundaries are the exact union of walk rectangles;
finite wall ends, doors and furniture have circular clearance. The old grid is
retained for diagnostics. Movement accepts floor changes up to 8 cm; stair height
is a continuous ramp. Invalid body positions recover after 0.25 controller seconds
to the nearest same-floor clear point within 60 cm. An ordinary stop against a
solid never triggers recovery. Floor furniture drops preserve reachable passages.

The default run walks all 56 ordered pairs of eight representative room stations.
It then walks a forward/reverse house circuit, including the cupboard, in each of
jogging, crouching, small-parcel and 50 cm console-carton carry modes: 120 route
legs per profile. `--quick` runs the 16-leg walking circuit. `--matrix` expands
every mode to all ordered pairs (280 legs per profile); it is a longer optional
stress run. This is representative station coverage, not every authored camera
preset or every possible furniture arrangement.

`--fast` is a software-WebGL diagnostic option: a browser-only source override
draws the complete world once per ten requested draws. Physics, animation-frame
sampling, real keyboard/mouse input, collision and the server remain unchanged;
screenshots force normal draws. Pair it with a normally rendered `--quick` run.
It measures route/controller correctness, not rendering performance.

Planning builds on world-audit's collision-valid sampling, with a 10 cm graph,
midpoint clearance and separate floor/stair surfaces. A missing sampled path is
reported as such; it is not proof that no narrower continuous path exists. The bot
uses real Playwright W/A/S/D, Shift/C and pointer-lock mouse movement. It stops to
turn, rather than circling tiny waypoints. Shortcuts are checked through the real
floor query. The body controller is never called directly by the browser bot.

Positions are sampled for no-progress windows of at least 0.4 seconds while a
movement key is held, including at least 0.4 seconds of actual controller updates.
Host pauses with no animation-frame updates are retained in frame-timing data;
they cannot establish a collision snag. Per-animation-frame samples check jumps, stair height
against the continuous ramp, and camera/bob consistency. Frame sampling matters:
a slow browser automation round trip can span several valid rendered frames and
must not be mistaken for a teleport. Door tests push against each closed leaf,
use F to open it, then cross; the cupboard uses C. Intentional closed-door stops
are recorded separately from movement failures.

Reports, raw frame/position traces, plans, ranked findings and screenshots go to
`tests/shots/movement/<tag>/`. Intermediate failed captures are retained as
diagnostic history. Tags beginning with `after` fail on remaining findings. A
quick circuit preserves the endpoint between consecutive route legs, providing
a full-house lap frame sequence. Software WebGL captures are not hardware FPS
measurements or physical gamepad/touch-controller verification.

`--retry` replays the failed route names for the same tag/profile and combines
those results with its earlier successful legs. It preserves the original report
as `<profile>-before-retry.json` and keeps retry progress separate until completion.
Use it only while the production controller is unchanged; after a controller edit,
start a fresh full audit. `--resume` also runs the missing legs of an interrupted
matrix. Reports include a controller-source SHA-256; resuming a hashed report
against a different controller is rejected. `--details` adds real E/Q chair placement checks and
1366×860 / 1920×1080 hinge, hall and stair views.

To compare against an earlier controller without changing the checkout, copy its
`hs-world.js` and `hs-house.js` into a temporary directory, then set
`MOVEMENT_SOURCE_DIR=/tmp/<directory>` for a `before` run. Only those browser
responses are overridden; the account, input, renderer and server remain real.

`node tests/movement-unit.cjs` exercises production functions without WebGL. It
covers round-corner clearance, union seams, sweeping a thin wall, preserving
wall-tangent speed, the captured front/bedroom corner regressions, bounded invalid
pose recovery, furniture that seals a passage, normalized diagonals, crouch/jog
speed and the continuous stair-height function. Browser route tests remain
necessary to catch integration and input failures.

Final matrix captures are `shots/movement/after-final-full/` and
`shots/movement/after-final-sparse/`: 120/120 legs per profile, zero controller
stuck events, zero movement findings, six shut/open/F door checks per profile and
matching controller hashes. The original 10 cm graph lacked 32 of 56 ordered
connections per profile; the revised graph lacks none. This is sampled
connectivity improvement, not proof every old narrow path was impassable. The
original quick baseline walked 20 legs without a confirmed no-progress event;
12 requested circuit legs lacked sampled paths. Reviewed baseline findings and
nearest captured context are retained in `before-controlled/reviewed-ranked.json`.

The matrices sampled 45,278 animation frames. Parallel software WebGL also had
573 host frame gaps above 400 ms, with a maximum near 983 ms; these are retained
as performance diagnostics and are not counted as collision snags. Hardware frame
performance remains unverified. See `shots/movement/summary.json` for counts and
the exact controller hash. Earlier prototype/fault-detector failures are retained
under their diagnostic tags; they are not the final gate results.

Outstanding at the worker time limit: the initial smoke gate passed 11/12 checks
and timed out on mobile; a heavily loaded-host rerun stalled in account actions.
The existing `SMOKE_SCALE` now also scales Playwright action/navigation timeouts;
that rerun passed sparse signup and account/house setup but was stopped before
completion. Chapter 1 exited 1 at `ch.m.tshirt -> ch.s.basket` (physical snap).
Investigate its forced camera pose versus invalid-position recovery; this is not
confirmed as either a controller regression or a fixture defect. These required
release gates are not green.

The normal-render `after-lap` run passed 16 routes and captured both desktop sizes.
Doorway chair rejection/snap-back was visually verified. Its original clear-floor
assertion also accepted a snap-back; the test was tightened afterward to compare
final coordinates with the preview at the original chair position. That stricter
accepted-placement check still needs a browser rerun. Hardware FPS, physical
touch/gamepads, all legacy furniture arrangements and the optional full per-mode
ordered-pair matrix remain unverified. No deployment or commit was performed.
