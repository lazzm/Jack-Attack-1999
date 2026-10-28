# Graphics measurements

Since 2026-10-27 there is one look (docs/GRAPHICS.md, "One look"): `--tiers` takes `best` (rung 0, the default)
and `floor` (the last invisible-adaptation rung). MSAA is forced on for SwiftShader runs (`jhp_hs_msaa`) so numbers
compare with the old High tier; pass `--no-msaa` to measure what a software renderer really draws. The Stage 0 text
below describes the original tiered matrix.

From the repository root, one command starts its own disposable server on a free
18080–18099 port, runs the matrix serially, prints a compact table, saves six
1366×860 canonical PNGs per tier in `tests/shots/perf/<tag>/`, and writes JSON:

```
node tests/perf/matrix.mjs --tag=after
node tests/perf/compare.mjs docs/perf-stage0-before-swiftshader.json docs/perf-stage0-after-swiftshader.json
```

No live URLs, data, dependencies or deployment commands. Only the child server's
PID is killed, including on interruption. The account is created through the
existing admin registration fixture; it does not replace an account. Compare on
an idle host, run alone, and retain the logged renderer/configuration/load.
Software timings are comparative diagnostics, not hardware FPS predictions.

Options (use identical options for a comparison):

```
node tests/perf/matrix.mjs --tag=throttled --cpu-rates=4,6 --tiers=best,floor
node tests/perf/matrix.mjs --tag=mesa --backend=llvmpipe --mesa-threads=2
node tests/perf/matrix.mjs --tag=quick --tiers=low --frames=30 --fill-frames=10 --walk-frames=100
node tests/perf/backends.mjs
node tests/perf/check.mjs
```

`--backend=llvmpipe` uses ANGLE GL/EGL, `LIBGL_ALWAYS_SOFTWARE=1` and two Mesa
threads. `--mesa-angle=gl` selects the alternate desktop GL route. A wrong GPU
string fails the run; it never silently compares a different backend. The probe
prints UNAVAILABLE when this Chromium/Mesa build cannot create that context.
Optional CPU rates use CDP; they slow the renderer main thread, not SwiftShader's
GPU threads. There is no CPU throttle on the fill or walk tests.

The three measurements deliberately have separate timing paths:

* Submit: 300 complete house submissions at each fixed camera, 64×48 drawing
  buffer, no compositor waits or GPU readback. The renderer wrapper sums all
  room passes. `submitMs` additionally includes house visibility/material work.
* Fill: 30 submissions at 1366×860 and 683×430. A 1-pixel readback after each
  complete house render synchronises GPU completion. `frameMs` is the inclusive
  render/readback cost, not a browser rAF measurement. Submit/fill hide DOM/HUD
  presentation; screenshots are taken with the ordinary presentation first.
* Whole frame: 600 **rendered** frames on a deterministic camera rail at 854×536,
  normal presentation, fixed daylight and random seed, dynamic scale disabled.
  It includes bedroom, landing, stairs, hall, lounge, cupboard, kitchen, garden,
  drive and a street view. This is a camera rail through the rooms, not a
  movement/collision acceptance test. No movement code is replaced.

The rail records p50/p95/p99, >33/>50 ms percentages, long tasks, heap samples
at 30-frame intervals, and a sampled CDP allocation profile. GC occurs only
before/after the rail, never during measured frames. Retained growth over 16 MB
fails; the raw heap sawtooth is retained as a diagnostic because the browser and
three.js allocate too. Nine framebuffer luminance samples check each fixed view
and every 60 rendered rail frames; a sample at or below 8/255 luminance (above the clear colour) fails. Readbacks happen
only in the benchmark. They are diagnostic samples, not proof of every pixel in
every frame. The app's existing black-frame/context watchdog remains active.

`budgets.json` has per-tier, per-canonical-view and per-room whole-visible-scene
ceilings for calls, triangles, programs, textures, geometries and referenced RGBA
texture MB (including mip levels/cube faces). Renderer resource counts are global
resident counts, not room-local ownership. Every metric fails above its ceiling
plus 10%. Stage 0 ceilings preserve the measured unmerged scene; section 4's
120/200/350/600 draw targets are Stage 1 goals, not falsely claimed Stage 0 wins.
`--no-gates` is only for recording/research; normal runs enforce budgets.

For a baseline from an isolated original app snapshot, `--app=/tmp/<snapshot>`
serves that directory. Its only required instrumentation is the same
`House._.renderForBenchmark` render entry point. Keep the renderer/configuration
identical. The first release has no Potato baseline; compare that new tier with
Low, explicitly as a different visual/pixel budget.

`--counts-only` runs resource gates and canonical captures without timed probes.
`--reuse` may be combined with it to exercise preset cycling in one warmed scene;
resident resource counts and build-time grass density then reflect that cycle.
Capture runs start at 640×480 for loading, then use 1366×860 for every measurement
and PNG. Static texture samplers are normalised to the requested preset.
`--resume` retains completed matching probe checkpoints after interruption; remove
invalidated rows before resuming a changed rendering path. This run retains the
original three indoor Potato views and repeats grass-visible views after the
grass-tier compatibility fix. The recorded heap profile samples live allocations
at stop; transient garbage is represented only by the heap samples/source audit.

Reused-scene gates use the largest tier ceiling for that view: build-time geometry
and cached resources can survive a preset change. Ordinary fresh-tier runs use
the individual tier ceilings. The worker-time-limit run left full smoke, story
and Medium/High after-view inspection incomplete; rerun these before shipping.
