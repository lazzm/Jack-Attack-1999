/* Rubik's cube model shared by the browser and the server.
 * Each of the 26 cubies has an integer position p = [x,y,z] in {-1,0,1}
 * and a sticker map s: world-normal key ('px','nx','py','ny','pz','nz') -> colour letter.
 * A move is {a: axis 0|1|2, l: layer -1|0|1, d: +1|-1} = a right-handed quarter turn. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CubeModel = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const KEYS = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
  const VEC = { px: [1, 0, 0], nx: [-1, 0, 0], py: [0, 1, 0], ny: [0, -1, 0], pz: [0, 0, 1], nz: [0, 0, -1] };
  // +y up = white, -y down = yellow, +x right = red, -x left = orange, +z front = green, -z back = blue
  const SOLVED_COLOURS = { px: 'R', nx: 'O', py: 'W', ny: 'Y', pz: 'G', nz: 'B' };

  function keyOf(v) {
    if (v[0] === 1) return 'px'; if (v[0] === -1) return 'nx';
    if (v[1] === 1) return 'py'; if (v[1] === -1) return 'ny';
    if (v[2] === 1) return 'pz'; return 'nz';
  }

  function rot(v, a, d) {
    const [x, y, z] = v;
    if (a === 0) return d > 0 ? [x, -z, y] : [x, z, -y];
    if (a === 1) return d > 0 ? [z, y, -x] : [-z, y, x];
    return d > 0 ? [-y, x, z] : [y, -x, z];
  }

  function solved() {
    const cubies = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      if (!x && !y && !z) continue;
      const s = {};
      if (x === 1) s.px = SOLVED_COLOURS.px; if (x === -1) s.nx = SOLVED_COLOURS.nx;
      if (y === 1) s.py = SOLVED_COLOURS.py; if (y === -1) s.ny = SOLVED_COLOURS.ny;
      if (z === 1) s.pz = SOLVED_COLOURS.pz; if (z === -1) s.nz = SOLVED_COLOURS.nz;
      cubies.push({ p: [x, y, z], s });
    }
    return cubies;
  }

  function validMove(m) {
    return m && (m.a === 0 || m.a === 1 || m.a === 2) && (m.l === -1 || m.l === 0 || m.l === 1) && (m.d === 1 || m.d === -1);
  }

  function apply(cubies, m) {
    for (const c of cubies) {
      if (c.p[m.a] !== m.l) continue;
      c.p = rot(c.p, m.a, m.d);
      const s = {};
      for (const k in c.s) s[keyOf(rot(VEC[k], m.a, m.d))] = c.s[k];
      c.s = s;
    }
    return cubies;
  }

  function isSolved(cubies) {
    for (const k of KEYS) {
      let col = null;
      for (const c of cubies) {
        const v = c.s[k];
        if (v === undefined) continue;
        if (col === null) col = v; else if (v !== col) return false;
      }
    }
    return true;
  }

  function randomMove(rng) {
    rng = rng || Math.random;
    return { a: Math.floor(rng() * 3), l: [-1, 1][Math.floor(rng() * 2)], d: rng() < 0.5 ? 1 : -1 };
  }

  // Name a move in Singmaster-ish notation for the "last move" ticker.
  function name(m) {
    const faces = [['L', 'M', 'R'], ['D', 'E', 'U'], ['B', 'S', 'F']];
    const f = faces[m.a][m.l + 1];
    // R/U/F (and slices) turn clockwise for the negative right-handed direction when viewed from +axis
    const posFace = m.l > 0 || (m.l === 0 && m.a === 2); // M follows L, E follows D, S follows F
    const cw = posFace ? m.d < 0 : m.d > 0;
    return f + (cw ? '' : "'");
  }

  function clone(cubies) { return cubies.map(c => ({ p: c.p.slice(), s: Object.assign({}, c.s) })); }

  return { KEYS, VEC, solved, apply, isSolved, validMove, randomMove, name, clone, keyOf };
});
