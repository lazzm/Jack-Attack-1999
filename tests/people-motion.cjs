'use strict';
// Compare poses submitted by the person's mesh, not unrelated browser frames.
exports.personJump = function personJump(draws) {
  for (let i = 1; i < draws.length; i++) {
    const a = draws[i - 1], b = draws[i];
    if (a.capture || b.capture) continue;
    const dt = b.t - a.t, distance = Math.hypot(b.cx - a.cx, b.cz - a.cz);
    if (!(dt >= 0 && distance < 130 * dt / 1000 + 1)) return { i, dt, distance, from:a, to:b };
  }
  return null;
};
