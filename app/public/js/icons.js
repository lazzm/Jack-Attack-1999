/* JackOS 98 official icon set + brand. Every icon is pixel art on an exact 32x32 or 16x16 grid, drawn with a tiny
 * raster toolkit (rects, lines, ellipses, polygons, stamped pixel strings, auto outline + bevel shading), then rendered
 * to an SVG with one crisp <path> per colour (horizontal runs merged).
 *   JICON.get(name, size, {lnk, noShadow}) -> '<svg ...>'      JICON.img(name, size) -> data: URI
 *   JICON.icon(name, {lnk}) -> one SVG holding both the 32px and 16px art (CSS picks the 16px art in 16px places)
 *   JICON.logo(size) -> the JackOS cube (16/32 pixel art, bigger sizes are a smooth vector, mid-twist)
 *   JICON.wordmark() -> big "JackOS 98" splash/about art   JICON.banner() -> Start menu side banner   JICON.names */
(function () {
  'use strict';
  const PAL = {
    k: '#000000', K: '#404040', g: '#808080', s: '#c0c0c0', S: '#e0e0e0', w: '#ffffff',
    n: '#000080', b: '#0000ff', B: '#3c78f0', i: '#a8d0ff', t: '#008080', a: '#00ffff',
    G: '#008000', l: '#00ff00', m: '#800000', r: '#ff0000', R: '#ff9a9a', o: '#808000', y: '#ffff00', Y: '#fff6c0',
    p: '#800080', f: '#ff00ff', P: '#c080e0', O: '#ff8000', u: '#f4d26a', U: '#c49a2a', h: '#7a5a00',
    e: '#8a4a1a', E: '#c88848', T: '#ecc890', z: '#f8d0a8', Z: '#d89868',
    c: '#ece8d8', C: '#b4ae98', q: '#7c7660',
    v: '#3fa52c', V: '#7ad850', d: '#2a7a1a', D: '#14300c',
    1: '#00a83a', 2: '#0a4ad8', 3: '#ff7a00', 4: '#ffe010', 5: '#e01010', 6: '#6a3a10', 7: '#ffc8e8', 8: '#40e0d0', 9: '#202060',
  };

  // ================================================================ raster toolkit
  function ctx(n) {
    const a = new Array(n * n).fill('');
    const ok = (x, y) => x >= 0 && y >= 0 && x < n && y < n;
    const set = (x, y, k) => { x = Math.floor(x); y = Math.floor(y); if (k && k !== '.' && ok(x, y)) a[y * n + x] = k === '_' ? '' : k; };
    const c = { n, a };
    c.get = (x, y) => ok(x, y) ? a[y * n + x] : '';
    c.p = (x, y, k) => { if (Array.isArray(x)) x.forEach(q => set(q[0], q[1], q[2] || y)); else set(x, y, k); return c; };
    c.r = (x, y, w, h, k) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, k); return c; };
    c.h = (x, y, w, k) => c.r(x, y, w, 1, k);
    c.v = (x, y, h, k) => c.r(x, y, 1, h, k);
    c.x = (x, y, w, h) => c.r(x, y, w, h, '_'); // clear
    // outlined box (outline o, fill f)
    c.b = (x, y, w, h, f, o) => { c.r(x, y, w, h, o || 'k'); if (f) c.r(x + 1, y + 1, w - 2, h - 2, f); return c; };
    // raised JackOS 98 box: black outline, white top-left, grey bottom-right inside it
    c.bv = (x, y, w, h, f, hi, lo, o) => { c.b(x, y, w, h, f || 's', o); c.h(x + 1, y + 1, w - 2, hi || 'w'); c.v(x + 1, y + 1, h - 2, hi || 'w'); c.h(x + 1, y + h - 2, w - 2, lo || 'g'); c.v(x + w - 2, y + 1, h - 2, lo || 'g'); return c; };
    // sunken well
    c.sk = (x, y, w, h, f) => { c.r(x, y, w, h, f); c.h(x, y, w, 'g'); c.v(x, y, h, 'g'); c.h(x, y + h - 1, w, 'w'); c.v(x + w - 1, y, h, 'w'); return c; };
    c.l = (x0, y0, x1, y1, k) => { // bresenham
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, er = dx + dy;
      for (;;) { set(x0, y0, k); if (x0 === x1 && y0 === y1) break; const e2 = 2 * er; if (e2 >= dy) { er += dy; x0 += sx; } if (e2 <= dx) { er += dx; y0 += sy; } }
      return c;
    };
    c.pl = (pts, k) => { for (let i = 1; i < pts.length; i++) c.l(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], k); return c; };
    // filled ellipse, centre (cx, cy) in grid units (16,16 = middle of a 32 grid)
    c.e = (cx, cy, rx, ry, k) => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const u = (x + 0.5 - cx) / rx, w = (y + 0.5 - cy) / ry; if (u * u + w * w <= 1.0001) set(x, y, k); } return c; };
    // filled polygon (pixel centres inside)
    c.poly = (pts, k) => {
      for (let y = 0; y < n; y++) {
        const yy = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) {
          const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
          if ((y1 <= yy && y2 > yy) || (y2 <= yy && y1 > yy)) xs.push(x1 + (yy - y1) * (x2 - x1) / (y2 - y1));
        }
        xs.sort((p, q) => p - q);
        for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i] - 0.5); x + 0.5 <= xs[i + 1]; x++) set(x, y, k);
      }
      return c;
    };
    // stamp pixel strings: rows separated by '|' (or an array); '.' is transparent; optional char remap
    c.s = (x, y, rows, map) => { (Array.isArray(rows) ? rows : rows.split('|')).forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; set(x + i, y + j, map && map[ch] !== undefined ? map[ch] : ch); } }); return c; };
    c.d = (x, y, w, h, k1, k2) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, ((x + i + y + j) & 1) ? k2 : k1); return c; };
    c.rep = (from, to, x, y, w, h) => { x = x || 0; y = y || 0; w = w || n; h = h || n; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (ok(i, j) && from.indexOf(a[j * n + i]) >= 0 && a[j * n + i]) a[j * n + i] = to; return c; };
    c.mir = (from) => { from = from || n / 2; for (let y = 0; y < n; y++) for (let x = 0; x < from; x++) a[y * n + (n - 1 - x)] = a[y * n + x]; return c; };
    // draw into a fresh layer, auto-bevel its edge pixels (hi top-left, lo bottom-right), outline it, then paste.
    // o may be one colour or [topLeftColour, bottomRightColour]. opts.in: inner outline only on these sides.
    c.L = (fn, o, hi, lo) => {
      const L = ctx(n); fn(L);
      const m = (x, y) => !!L.get(x, y);
      const out = L.a.slice();
      if (hi || lo) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (!m(x, y)) continue;
        if (hi && (!m(x - 1, y) || !m(x, y - 1))) out[y * n + x] = hi;
        else if (lo && (!m(x + 1, y) || !m(x, y + 1))) out[y * n + x] = lo;
      }
      if (o) {
        const [oa, ob] = Array.isArray(o) ? o : [o, o];
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          if (m(x, y)) continue;
          if (m(x + 1, y) || m(x, y + 1)) out[y * n + x] = oa;
          else if (m(x - 1, y) || m(x, y - 1)) out[y * n + x] = ob;
        }
      }
      out.forEach((k, i) => { if (k) a[i] = k; });
      return c;
    };
    // 50% black drop shadow one pixel down-right of the whole silhouette
    c.shadow = () => {
      const src = a.slice();
      for (let y = 1; y < n; y++) for (let x = 1; x < n; x++) if (!src[y * n + x] && src[(y - 1) * n + x - 1] && src[(y - 1) * n + x - 1] !== '#') a[y * n + x] = '#';
      return c;
    };
    return c;
  }

  // ---- render a finished grid to SVG: one <path> per colour, horizontal runs merged
  function toSvg(a, n, size) {
    const runs = {};
    for (let y = 0; y < n; y++) {
      let x = 0;
      while (x < n) {
        const k = a[y * n + x];
        if (!k) { x++; continue; }
        let w = 1; while (x + w < n && a[y * n + x + w] === k) w++;
        (runs[k] = runs[k] || []).push(`M${x} ${y}h${w}v1H${x}z`);
        x += w;
      }
    }
    let body = '';
    for (const k in runs) body += k === '#' ? `<path fill="#000" fill-opacity=".5" d="${runs[k].join('')}"/>` : `<path fill="${PAL[k] || k}" d="${runs[k].join('')}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
  }

  // ================================================================ shared builders
  const D = {}; // name -> { 32: fn, 16: fn, ns: no drop shadow }
  const I = (name, f32, f16, o) => { D[name] = Object.assign({ 32: f32, 16: f16 }, o || {}); };

  // a sheet of paper with a folded top-right corner. Outline box x0..x1, y0..y1 inclusive, ear size e
  function page(c, x0, y0, x1, y1, e, fill, flap) {
    c.b(x0, y0, x1 - x0 + 1, y1 - y0 + 1, fill || 'w');
    for (let y = y0; y < y0 + e + 1; y++) for (let x = x1 - e; x <= x1; x++) {
      const dx = x - (x1 - e), dy = y - y0;
      if (dx > dy) c.p(x, y, '_');
      else if (dx === dy) c.p(x, y, 'k');
      else if (x === x1 - e || y === y0 + e) c.p(x, y, 'k');
      else c.p(x, y, dx === dy - 1 ? 'w' : (flap || 's'));
    }
    c.v(x0 + 1, y0 + 1, y1 - y0 - 1, fill || 'w');
    return c;
  }
  const doc32 = (c, fill) => page(c, 6, 1, 25, 30, 6, fill);
  const doc16 = (c, fill) => page(c, 2, 0, 13, 15, 3, fill);
  // text lines on a document
  const lines = (c, x, y, w, rows, k, gap, ragged) => { for (let j = 0; j < rows; j++) c.h(x, y + j * (gap || 2), w - (ragged && j % 3 === 2 ? ragged : 0) - (j === rows - 1 ? Math.floor(w / 3) : 0), k || 'g'); };

  // a program window: navy title bar, grey frame, client area fill
  function win32(c, x, y, w, h, client, title) {
    c.bv(x, y, w, h, 's');
    c.r(x + 2, y + 2, w - 4, 3, title || 'n');
    c.p(x + w - 4, y + 3, 's');
    if (client) c.r(x + 2, y + 6, w - 4, h - 8, client);
    return c;
  }
  function win16(c, x, y, w, h, client, title) {
    c.b(x, y, w, h, 's');
    c.r(x + 1, y + 1, w - 2, 2, title || 'n');
    if (client) c.r(x + 1, y + 3, w - 2, h - 4, client);
    return c;
  }

  // folders
  function folder32(c, open, fill) {
    c.L(L => { L.r(2, 8, 26, 20, 'U'); L.r(3, 5, 9, 3, 'U'); L.p(12, 6, 'U'); L.p(12, 7, 'U'); L.p(13, 7, 'U'); }, ['h', 'k'], 'u', 'h');
    if (!open) {
      c.L(L => L.r(2, 11, 27, 17, fill || 'u'), ['h', 'k'], 'Y', 'U');
    } else {
      c.L(L => { L.r(5, 9, 21, 6, 'w'); }, 'k');
      lines(c, 7, 11, 16, 2, 'g');
      c.L(L => L.poly([[7, 14], [31, 14], [26, 28], [2, 28]], fill || 'u'), ['h', 'k'], 'Y', 'U');
    }
    return c;
  }
  function folder16(c, open, fill) {
    c.L(L => { L.r(1, 4, 13, 10, 'U'); L.r(2, 3, 5, 1, 'U'); }, ['h', 'k'], 'u');
    if (!open) c.L(L => L.r(1, 6, 13, 8, fill || 'u'), ['h', 'k'], 'Y', 'U');
    else { c.b(3, 4, 10, 4, 'w'); c.L(L => L.poly([[4, 7], [16, 7], [13, 14], [1, 14]], fill || 'u'), ['h', 'k'], 'Y'); }
    return c;
  }

  // globe (used by JackNet + webpages). r = radius
  // ---- a real little Earth: simplified continent outlines (lon, lat), rendered as a lit, dithered sphere
  const LANDS = [
    [[-168, 66], [-156, 71], [-125, 70], [-95, 72], [-80, 68], [-62, 58], [-56, 50], [-66, 44], [-76, 35], [-81, 25], [-82, 30], [-90, 29], [-97, 26], [-97, 19], [-87, 21], [-83, 10], [-78, 8], [-92, 15], [-105, 20], [-112, 30], [-118, 34], [-124, 40], [-124, 48], [-133, 56], [-148, 60], [-165, 59], [-162, 64]], // North America
    [[-55, 60], [-43, 59], [-20, 70], [-18, 78], [-30, 83], [-60, 82], [-72, 77], [-58, 68]], // Greenland
    [[-79, 8], [-72, 12], [-62, 10], [-50, 3], [-35, -6], [-39, -15], [-41, -23], [-48, -27], [-58, -35], [-63, -41], [-66, -48], [-69, -54], [-73, -50], [-74, -40], [-71, -25], [-76, -14], [-81, -5]], // South America
    [[-10, 36], [-9, 43], [-2, 44], [-4, 48], [3, 51], [8, 54], [10, 58], [6, 62], [14, 68], [22, 71], [32, 70], [42, 67], [55, 68], [60, 55], [52, 44], [40, 42], [28, 41], [26, 37], [20, 39], [16, 38], [12, 44], [8, 44], [3, 42], [-2, 37]], // Europe
    [[-6, 50], [1, 51], [0, 53], [-3, 56], [-5, 58], [-7, 56], [-5, 54], [-3, 52]], [[-10, 52], [-6, 52], [-6, 55], [-10, 54]], // Britain + Ireland
    [[-17, 15], [-17, 21], [-13, 27], [-9, 32], [-6, 36], [3, 37], [11, 37], [20, 32], [32, 31], [35, 28], [39, 18], [43, 12], [51, 12], [47, 6], [40, -3], [39, -15], [35, -24], [32, -29], [27, -34], [19, -35], [16, -28], [12, -17], [13, -6], [9, 4], [4, 6], [-8, 4], [-14, 9]], // Africa
    [[47, -13], [50, -15], [49, -25], [44, -24], [44, -17]], // Madagascar
    [[35, 30], [44, 30], [48, 29], [56, 26], [59, 22], [52, 16], [44, 12], [39, 20]], // Arabia
    [[42, 67], [70, 73], [100, 77], [140, 72], [170, 70], [180, 66], [175, 62], [162, 58], [156, 51], [142, 54], [135, 44], [128, 38], [122, 31], [120, 24], [109, 21], [106, 10], [100, 13], [100, 3], [96, 16], [90, 22], [80, 15], [77, 8], [72, 20], [66, 25], [57, 26], [48, 30], [44, 38], [52, 44], [60, 55], [55, 68]], // Asia
    [[130, 31], [135, 34], [141, 37], [142, 42], [140, 41], [136, 36], [131, 34]], [[141, 42], [145, 44], [142, 46]], // Japan
    [[95, 5], [105, -6], [114, -8], [118, -9], [110, -2], [104, 2]], [[109, 1], [118, 7], [119, -1], [116, -4], [110, -3]], [[131, -1], [141, -3], [150, -10], [141, -9], [134, -4]], // Indonesia + New Guinea
    [[114, -22], [122, -18], [130, -12], [136, -12], [137, -16], [142, -11], [146, -19], [153, -26], [151, -34], [146, -39], [140, -38], [135, -34], [129, -32], [116, -35], [114, -28]], // Australia
    [[166, -46], [174, -41], [178, -38], [174, -37], [169, -44]], // New Zealand
  ];
  const DESERTS = [[[-14, 17], [-10, 30], [10, 33], [30, 30], [37, 20], [30, 14], [10, 15]], [[38, 28], [55, 25], [52, 16], [44, 14]], [[120, -20], [138, -18], [140, -28], [124, -30]], [[-118, 34], [-105, 32], [-104, 40], [-118, 40]], [[55, 40], [80, 42], [100, 44], [110, 40], [85, 36], [60, 34]]];
  const inPoly = (pts, x, y) => { let r = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) r = !r; } return r; };
  let MAP = null; // 360 x 180 terrain lookup at 2 degree steps
  function terrain(lon, lat) {
    if (!MAP) {
      MAP = [];
      for (let j = 0; j < 90; j++) for (let i = 0; i < 180; i++) {
        const lo = i * 2 - 179, la = 89 - j * 2;
        let t = 0; // 0 sea, 1 land, 2 desert, 3 ice
        if (la < -66) t = 3;
        else if (LANDS.some(p => inPoly(p, lo, la))) t = DESERTS.some(p => inPoly(p, lo, la)) ? 2 : (la > 72 || inPoly(LANDS[1], lo, la) ? 3 : 1);
        else if (la > 80) t = 3;
        MAP.push(t);
      }
    }
    lon = ((lon + 180) % 360 + 360) % 360 - 180;
    const i = Math.max(0, Math.min(179, Math.floor((lon + 180) / 2))), j = Math.max(0, Math.min(89, Math.floor((90 - lat) / 2)));
    return MAP[j * 180 + i];
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const GPAL = [
    ['#061c58', '#0c3290', '#1650c0', '#2a74e0', '#58a0f8', '#9cccff'], // sea
    ['#0a3a0c', '#14601a', '#238a26', '#3cac34', '#6cd050', '#a8ec80'], // land
    ['#5a3c0c', '#86621e', '#b08a38', '#d0ac58', '#ecd08c', '#fff0c0'], // desert
    ['#6a7a90', '#98a8bc', '#c0ccdc', '#e0e8f0', '#ffffff', '#ffffff'], // ice
  ];
  // draws the globe into c. o: { rot: longitude facing us, tilt: degrees of north tilted towards us, dither, levels, spec, outline }
  function earth(c, cx, cy, r, o) {
    o = o || {};
    const rot = (o.rot == null ? -15 : o.rot) * Math.PI / 180, tl = (o.tilt == null ? 22 : o.tilt) * Math.PI / 180;
    const Lx = -0.5, Ly = -0.62, Lz = 0.6, ln = Math.hypot(Lx, Ly, Lz), lv = [Lx / ln, Ly / ln, Lz / ln];
    const lev = o.levels || 6, L = ctx(c.n);
    for (let py = 0; py < c.n; py++) for (let px = 0; px < c.n; px++) {
      const dx = (px + 0.5 - cx) / r, dy = (py + 0.5 - cy) / r, d2 = dx * dx + dy * dy;
      if (d2 > 1) continue;
      const z = Math.sqrt(1 - d2);
      const y2 = dy * Math.cos(tl) - z * Math.sin(tl), z2 = dy * Math.sin(tl) + z * Math.cos(tl);
      const lat = Math.asin(Math.max(-1, Math.min(1, -y2))) * 180 / Math.PI, lon = (Math.atan2(dx, z2) + rot) * 180 / Math.PI;
      const t = terrain(lon, lat);
      let li = dx * lv[0] + dy * lv[1] + z * lv[2]; // -1..1
      let v = Math.max(0, Math.min(1, 0.12 + li * 0.74)) * (lev - 1);
      if (o.dither !== false) v += (BAYER[(py & 3) * 4 + (px & 3)] / 16 - 0.47) * 0.9;
      let k = Math.max(0, Math.min(lev - 1, Math.round(v)));
      if (d2 > 0.86 && k > 1 && dx + dy > -0.2) k--; // atmosphere rim darkening on the shadow side
      L.p(px, py, GPAL[t][Math.min(5, k + (6 - lev))]);
    }
    if (o.spec !== false) { // glossy highlight, top left
      const sx = cx - r * 0.4, sy = cy - r * 0.45, sr = Math.max(0.7, r * 0.12);
      for (let py = 0; py < c.n; py++) for (let px = 0; px < c.n; px++) {
        const dd = Math.hypot(px + 0.5 - sx, (py + 0.5 - sy) * 1.3);
        if (L.get(px, py) && dd < sr) L.p(px, py, '#ffffff'); else if (L.get(px, py) && dd < sr * 2 && ((px + py) & 1) && r > 6) L.p(px, py, '#c8e4ff');
      }
    }
    c.L(LL => { for (let i = 0; i < c.n * c.n; i++) if (L.a[i]) LL.a[i] = L.a[i]; }, o.outline === undefined ? '#001040' : o.outline);
    return c;
  }
  // the golden orbit ring: an ellipse tilted by `ang`, drawn in two halves around the globe
  function ring(c, cx, cy, rx, ry, ang, th, front, small) {
    const ca = Math.cos(ang), sa = Math.sin(ang), RC = ['#fff6b0', '#ffe040', '#ffc000', '#e08800', '#a05400'];
    c.L(L => {
      for (let py = 0; py < c.n; py++) for (let px = 0; px < c.n; px++) {
        const dx = px + 0.5 - cx, dy = py + 0.5 - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
        const e = Math.sqrt((u / rx) ** 2 + (v / ry) ** 2), gm = Math.hypot(u / (rx * rx), v / (ry * ry)) / Math.max(e, 1e-6), dist = (e - 1) / Math.max(gm, 1e-6);
        if (Math.abs(dist) > th / 2) continue;
        if ((v > 0) !== front) continue;
        const f = (dist / th + 0.5); // 0 inner .. 1 outer
        const lit = v < 0 ? f : 1 - f; // the upper edge catches the light
        const far = u > rx * 0.6 ? 1 : 0; // the right-hand end turns away from the light
        L.p(px, py, small ? (lit > 0.5 && !far ? '#fff070' : far || v < 0 ? '#d88a00' : '#ffc000') : RC[Math.max(0, Math.min(4, (lit > 0.66 ? 0 : lit > 0.33 ? 1 : 2) + far + (v < 0 ? 1 : 0)))]);
      }
    }, small ? [null, '#6a3a00'] : '#5a2c00');
  }
  const spark = (c, x, y, big) => { if (big) { c.p([[x, y - 3, '#ffe040'], [x, y + 3, '#ffe040'], [x - 3, y, '#ffe040'], [x + 3, y, '#ffe040'], [x, y - 2, '#fff6b0'], [x, y + 2, '#fff6b0'], [x - 2, y, '#fff6b0'], [x + 2, y, '#fff6b0'], [x, y - 1, '#ffffff'], [x, y + 1, '#ffffff'], [x - 1, y, '#ffffff'], [x + 1, y, '#ffffff'], [x, y, '#ffffff'], [x - 1, y - 1, '#ffe040'], [x + 1, y + 1, '#ffe040'], [x + 1, y - 1, '#ffe040'], [x - 1, y + 1, '#ffe040']]); } else c.p([[x, y - 1, '#ffe040'], [x, y + 1, '#ffe040'], [x - 1, y, '#ffe040'], [x + 1, y, '#ffe040'], [x, y, '#ffffff']]); };
  // JackNet: globe + orbit ring + spark. s = scale preset
  function jacknetArt(c, P) {
    ring(c, P.cx, P.cy, P.rx, P.ry, P.ang, P.th, false, P.small);
    earth(c, P.cx, P.cy, P.r, { rot: P.rot, levels: P.lev, dither: P.dither, spec: P.spec });
    ring(c, P.cx, P.cy, P.rx, P.ry, P.ang, P.th, true, P.small);
    if (P.sp) spark(c, P.sp[0], P.sp[1], P.big);
  }
  // simple globe used inside other icons (web page, update, encyclopedia, zone...)
  function globe(c, cx, cy, r) { return earth(c, cx, cy, r, { rot: -20, levels: r > 5 ? 6 : 4, dither: r > 5, spec: r > 4 }); }

  // ================================================================ THE ICONS
  // ---- documents
  I('txt', c => { doc32(c); lines(c, 9, 10, 13, 9, 'g', 2, 3); }, c => { doc16(c); lines(c, 4, 5, 7, 5, 'g', 2); });
  I('notepad', c => {
    c.L(L => L.r(5, 3, 21, 27, 'w'), 'k', null, 'S');
    for (let x = 7; x < 25; x += 2) { c.p(x, 1, 'g'); c.p(x, 2, 'k'); c.p(x, 3, 'g'); }
    c.h(5, 4, 21, 'B'); c.h(5, 5, 21, 'i');
    for (let y = 9; y < 28; y += 3) c.h(7, y, 17, 'i');
    c.v(9, 6, 23, 'R');
    lines(c, 10, 8, 12, 5, 'n', 3);
  }, c => {
    c.b(2, 1, 12, 15, 'w'); for (let x = 3; x < 13; x += 2) c.p(x, 0, 'k');
    c.h(3, 2, 10, 'B'); c.v(4, 3, 12, 'R');
    lines(c, 5, 5, 7, 5, 'n', 2);
  });
  I('folder', c => folder32(c), c => folder16(c));
  I('folderOpen', c => folder32(c, true), c => folder16(c, true));

  // ---- computer
  I('computer', c => {
    // desktop case (front face + top face + right side)
    c.L(L => { L.poly([[2, 21], [5, 18], [31, 18], [28, 21]], 'S'); }, 'k');
    c.L(L => L.r(2, 21, 26, 8, 'c'), 'k', 'w', 'C');
    c.L(L => L.poly([[28, 21], [31, 18], [31, 26], [28, 29]], 'C'), 'k');
    c.h(15, 24, 9, 'k'); c.h(15, 25, 9, 'w'); c.r(4, 25, 2, 1, 'l'); c.r(7, 25, 2, 1, 'G');
    // monitor
    c.L(L => L.r(11, 16, 9, 3, 'C'), 'k');
    c.L(L => L.r(4, 1, 22, 16, 'c'), 'k', 'w', 'C');
    c.L(L => L.poly([[26, 1], [28, 3], [28, 15], [26, 17]], 'C'), 'k');
    c.r(7, 4, 16, 10, 't');
    c.h(7, 4, 16, 'g'); c.v(7, 4, 10, 'g'); c.h(7, 14, 17, 'w'); c.v(23, 4, 11, 'w');
    c.r(8, 5, 4, 1, 'a'); c.r(8, 6, 2, 1, 'a');
    c.r(15, 8, 5, 4, 's'); c.h(15, 8, 5, 'n');
  }, c => {
    c.L(L => L.r(1, 11, 13, 4, 'c'), 'k', 'w', 'C');
    c.h(8, 12, 4, 'k'); c.p(3, 13, 'l');
    c.L(L => L.r(6, 9, 4, 1, 'C'), 'k');
    c.L(L => L.r(2, 0, 11, 9, 'c'), 'k', 'w', 'C');
    c.r(4, 2, 7, 5, 't'); c.p(4, 2, 'a'); c.p(5, 2, 'a');
  });

  // ---- message box icons (original, classic style)
  I('error', c => {
    c.L(L => L.e(15.5, 15.5, 14, 14, 'r'), 'k', null, 'm');
    c.p([[9, 6], [10, 6], [8, 7], [7, 8], [6, 9], [6, 10]], 'R');
    for (let i = 0; i < 12; i++) { c.r(10 + i, 9 + i, 2, 2, 'w'); c.r(20 - i, 9 + i, 2, 2, 'w'); }
  }, c => {
    c.L(L => L.e(7.5, 7.5, 7, 7, 'r'), 'k', null, 'm');
    for (let i = 0; i < 7; i++) { c.p(4 + i, 4 + i, 'w'); c.p(10 - i, 4 + i, 'w'); }
    c.p([[4, 5], [5, 4], [10, 5], [9, 4], [4, 9], [5, 10], [10, 9], [9, 10]], 'w');
  });
  I('warning', c => {
    c.L(L => L.poly([[15.5, 1], [30.5, 28], [0.5, 28]], 'y'), 'k', null, 'o');
    c.r(14, 9, 3, 11, 'k'); c.r(14, 22, 3, 3, 'k'); c.v(13, 10, 9, 'k'); c.v(17, 10, 9, 'k');
  }, c => {
    c.L(L => L.poly([[7.5, 0.5], [15, 14], [0, 14]], 'y'), 'k', null, 'o');
    c.r(7, 4, 2, 6, 'k'); c.r(7, 11, 2, 2, 'k');
  });
  const balloon32 = (c, inner) => {
    c.L(L => { L.e(16, 13, 14, 11.5, 'w'); L.poly([[8, 21], [14, 23], [7, 30]], 'w'); }, 'k', null, 'S');
    inner(c);
  };
  I('info', c => balloon32(c, c => { c.r(14, 6, 4, 3, 'b'); c.r(13, 10, 5, 2, 'b'); c.r(14, 12, 4, 7, 'b'); c.r(12, 19, 8, 2, 'b'); c.p(14, 6, 'B'); }),
    c => { c.L(L => { L.e(8, 6.5, 7, 6, 'w'); L.poly([[3, 10], [8, 11], [3, 15]], 'w'); }, 'k'); c.r(7, 2, 2, 2, 'b'); c.r(7, 5, 2, 4, 'b'); c.h(6, 9, 4, 'b'); });
  I('question', c => balloon32(c, c => { c.s(10, 4, ['..bbbbbb..', '.bbBBBBbb.', 'bbB....bbb', 'bbb....bbb', '.......bbb', '......bbb.', '....bbbb..', '....bbb...', '....bbb...', '..........', '....bbb...', '....bbb...']); }),
    c => { c.L(L => { L.e(8, 6.5, 7, 6, 'w'); L.poly([[3, 10], [8, 11], [3, 15]], 'w'); }, 'k'); c.s(5, 2, ['.bbbb.', 'bb..bb', '...bb.', '..bb..', '......', '..bb..']); });

  // ---- JackNet Explorer: an original globe with a gold orbit ring and a comet-like satellite
  I('jacknet',
    c => jacknetArt(c, { cx: 15.5, cy: 15.8, r: 11, rx: 15, ry: 5.6, ang: -0.4, th: 3, rot: -15, lev: 5, sp: [26, 6], big: true }),
    c => jacknetArt(c, { cx: 7.7, cy: 7.5, r: 5.6, rx: 7.3, ry: 2.6, ang: -0.38, th: 1.7, rot: -15, lev: 4, dither: false, spec: true, small: true }),
    { 48: c => jacknetArt(c, { cx: 23.5, cy: 23.8, r: 16.5, rx: 22.6, ry: 8.4, ang: -0.4, th: 4.4, rot: -15, lev: 6, sp: [40, 8], big: true }) });

  // ---- Gubbinz the grot (matches the desktop pet sprite)
  const GUB = ['......kkkkkk......', 'kk...kgGggGgk...kk', 'kgkk.kggggggk.kkgk', '.kggkggggggggkggk.', '..kggggggggggggk..', '...kkkggggggkkk...', '.....krwggwrk.....', '.....krpggrpk.....', '.....kggddggk.....', '.....kgmwwmgk.....', '......kggggk......', '....kkbbbbbbkk....', '...kgkbBbbBbkgk...', '...kgkbbbbbbkgk...', '...kgkyyyyyykgk...', '....kkbbbbbbkk....', '.....kgk..kgk.....', '....kkkk..kkkk....'];
  const GMAP = { k: 'D', g: 'v', G: 'V', d: 'd', r: 'k', w: 'w', m: 'm', b: 'e', B: '6', y: 'E', p: 'k' };
  I('gubbinz', c => {
    // 32: the sprite redrawn at a larger size with proper shading
    c.L(L => {
      L.e(16, 10, 8, 7.5, 'v');                 // head
      L.poly([[9, 8], [0.5, 2], [2, 7], [8, 12]], 'v'); L.poly([[23, 8], [31.5, 2], [30, 7], [24, 12]], 'v'); // ears
      L.r(11, 17, 10, 9, 'e'); L.r(13, 26, 2, 3, 'v'); L.r(17, 26, 2, 3, 'v'); // body, legs
      L.r(8, 18, 3, 6, 'v'); L.r(21, 18, 3, 6, 'v'); // arms
    }, 'D');
    c.p([[2, 3], [3, 4], [4, 5], [29, 3], [28, 4], [27, 5]], 'V'); c.p([[3, 5], [4, 6], [28, 6], [27, 7]], 'd');
    c.r(11, 4, 3, 1, 'V'); c.r(18, 4, 3, 1, 'V'); c.r(13, 3, 6, 1, 'V');
    c.r(11, 8, 4, 3, 'w'); c.r(17, 8, 4, 3, 'w'); c.r(12, 9, 2, 2, 'k'); c.r(18, 9, 2, 2, 'k'); c.p(12, 9, 'w'); c.p(18, 9, 'w');
    c.h(10, 7, 5, 'D'); c.h(17, 7, 5, 'D');
    c.r(15, 11, 2, 2, 'd');
    c.p([[11, 13], [20, 13]], 'D'); c.h(12, 14, 8, 'D'); c.h(13, 15, 6, 'm'); c.h(14, 16, 4, 'D'); c.p([[13, 14], [18, 14]], 'w'); c.r(15, 15, 2, 1, 'R');
    c.r(11, 17, 10, 1, '6'); c.h(11, 22, 10, 'E'); c.p(13, 19, '6'); c.p(18, 20, '6'); c.v(11, 18, 8, '6');
    c.v(8, 18, 6, 'V'); c.h(13, 28, 2, 'd'); c.h(17, 28, 2, 'd');
    c.h(12, 29, 4, 'D'); c.h(16, 29, 4, 'D');
  }, c => {
    // 16: the desktop-pet sprite itself, cropped to fit
    const rows = GUB.map(r => r.slice(1, 17)).slice(0, 16);
    rows[15] = rows[15].replace(/k/g, 'k');
    c.s(0, 0, rows, GMAP);
  });


  I('url', c => { D.webpage[32](c); D.lnkArrow[32](c); }, c => { D.webpage[16](c); D.lnkArrow[16](c); });
  I('camera', c => {
    c.L(L => { L.r(2, 10, 28, 17, 'K'); L.r(6, 7, 8, 3, 'K'); }, 'k', 'g', 'k'); c.r(3, 12, 26, 2, 'g'); c.r(3, 24, 26, 2, 'k');
    c.L(L => L.e(17, 18.5, 7, 7, 'g'), 'k', 'S'); c.L(L => L.e(17, 18.5, 4.5, 4.5, 'n'), 'k'); c.L(L => L.e(17, 18.5, 2, 2, 'B'), null); c.p(15, 16, 'w'); c.p(16, 16, 'i');
    c.L(L => L.r(23, 7, 5, 3, 'S'), 'k', 'w'); c.r(5, 15, 3, 2, 'r'); c.r(25, 14, 2, 1, 'y');
  }, c => { c.L(L => { L.r(1, 5, 14, 9, 'K'); L.r(3, 3, 4, 2, 'K'); }, 'k', 'g'); c.L(L => L.e(8.5, 9.5, 3.5, 3.5, 'g'), 'k'); c.L(L => L.e(8.5, 9.5, 1.6, 1.6, 'n'), null); c.p(8, 9, 'i'); c.r(11, 3, 3, 2, 'S'); c.p(3, 7, 'r'); });

  // ================================================================ brand: the JackOS cube-flag
  const HEX = { r: '#e8141c', 4: '#ffd200', 2: '#1650e0', 1: '#00a83a', w: '#ffffff', 3: '#ff7a00' };
  // The JackOS logo: a Rubik's cube caught mid-twist (top layer turned), seen isometrically.
  // cubeTwist() emits polygons in painter's order: [[x,y]...], colourKey ('k' = the black plastic body)
  const LOGO_T = ['w', 'w', '4', 'w', 'w', 'w', '3', 'w', 'w'];
  const LOGO_L = ['1', '1', '1', 'r', 'r', 'r', 'r', '4', 'r'], LOGO_R = ['r', 'r', 'r', '2', '2', '2', '2', '2', '3'];
  function cubeTwist(k, ox, oy, th, gap, shift, pix) {
    const C = pix ? 1 : Math.cos(Math.PI / 6), S = 0.5, out = [];
    const pr = (x, y, z) => [ox + (x - z) * C * k, oy + ((x + z) * S - y) * k]; // x,z centred on 0, y up from 0..3
    const rot = (x, z, a) => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];
    const P = (x, y, z, a) => { const [rx, rz] = rot(x, z, a || 0), q = pr(rx, y, rz); if (shift && y > 2) { q[0] += shift[0]; q[1] += shift[1]; } return q; };
    const shrink = (q, g) => { const cx = q.reduce((s2, p) => s2 + p[0], 0) / 4, cy = q.reduce((s2, p) => s2 + p[1], 0) / 4; return q.map(([x, y]) => [cx + (x - cx) * (1 - g), cy + (y - cy) * (1 - g)]); };
    // one block of layers y0..y1 turned by a; stickers only on the rows given
    const block = (y0, y1, a, rows, top) => {
      const h = 1.5;
      out.push([[P(-h, y1, -h, a), P(h, y1, -h, a), P(h, y1, h, a), P(-h, y1, h, a)], 'k']);           // top body
      out.push([[P(-h, y1, h, a), P(h, y1, h, a), P(h, y0, h, a), P(-h, y0, h, a)], 'k']);             // left (+z) body
      out.push([[P(h, y1, h, a), P(h, y1, -h, a), P(h, y0, -h, a), P(h, y0, h, a)], 'k']);             // right (+x) body
      if (top) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out.push([shrink([P(-h + i, y1, -h + j, a), P(-h + i + 1, y1, -h + j, a), P(-h + i + 1, y1, -h + j + 1, a), P(-h + i, y1, -h + j + 1, a)], gap), LOGO_T[j * 3 + i]]);
      rows.forEach(r => { const yt = 3 - r, yb = 2 - r; for (let i = 0; i < 3; i++) {
        out.push([shrink([P(-h + i, yt, h, a), P(-h + i + 1, yt, h, a), P(-h + i + 1, yb, h, a), P(-h + i, yb, h, a)], gap), LOGO_L[r * 3 + i]]);
        out.push([shrink([P(h, yt, h - i, a), P(h, yt, h - i - 1, a), P(h, yb, h - i - 1, a), P(h, yb, h - i, a)], gap), LOGO_R[r * 3 + i]]);
      } });
    };
    block(0, 2, 0, [1, 2], false);
    block(2.06, 3, th, [0], true);
    return out;
  }
  // clean pixel cube for the logo: solid faces, sticker lines in a darker shade, black edges between faces.
  // 2:1 isometric. ox = x of the front-bottom corner's vertical edge, oy = y of the top vertex. k = px per sticker.
  function isoCube(c, ox, oy, k, faces, acc) {
    const L = ctx(c.n);
    for (let py = 0; py < c.n; py++) for (let px = 0; px < c.n; px++) {
      const X = (px + 0.5 - ox) / k, Y = (py + 0.5 - oy) / k; // top vertex at (0,0)
      let f = -1, a = 0, b = 0;
      const tx = Y + X / 2, tz = Y - X / 2; // top face: x,z in [0,3]
      if (tx >= 0 && tz >= 0 && tx <= 3 && tz <= 3) { f = 0; a = tx; b = tz; }
      else if (X <= 0 && X >= -3) { const zz = 3, xx = X + zz; const y = (xx + zz) / 2 - Y + 3; if (y >= 0 && y <= 3) { f = 1; a = xx; b = 3 - y; } }
      else if (X > 0 && X <= 3) { const xx = 3, zz = xx - X; const y = (xx + zz) / 2 - Y + 3; if (y >= 0 && y <= 3) { f = 2; a = 3 - zz; b = 3 - y; } }
      if (f < 0) continue;
      const [base, line, hi] = faces[f];
      const ia = Math.min(2, Math.floor(a)), ib = Math.min(2, Math.floor(b));
      let col = (acc && acc[f] && acc[f][0] === ia && acc[f][1] === ib) ? acc[f][2] : base;
      const da = Math.abs(a - Math.round(a)) * k, db = Math.abs(b - Math.round(b)) * k, th = f === 0 ? 0.55 : 0.5;
      const ra = Math.round(a), rb = Math.round(b);
      if (da < th && ra > 0 && ra < 3) col = line;
      else if (db < th && rb > 0 && rb < 3) col = line;
      else if (f === 0 && ((a < 0.55 && b > 0.4) || (b < 0.55 && a > 0.4))) col = hi; // top face: lit far edges
      L.p(px, py, col);
    }
    // black edges where faces meet
    for (let py = 0; py < c.n; py++) for (let px = 0; px < c.n; px++) {
      const X = (px + 0.5 - ox) / k, Y = (py + 0.5 - oy) / k;
      if (L.get(px, py) && Math.abs(X) * k < 0.5 && Y > 3 - 0.01) L.p(px, py, 'k');
    }
    c.L(LL => { for (let i = 0; i < c.n * c.n; i++) if (L.a[i]) LL.a[i] = L.a[i]; }, 'k');
    return c;
  }
  const LOGO_FACES = [['w', 's', 'w'], ['r', 'm', 'R'], ['2', 'n', 'B']];
  I('logo', c => {
    isoCube(c, 15, 1.5, 4.6, LOGO_FACES, [null, [0, 0, '1'], [2, 2, '3']]);
    // the top-face/side seam: a black zigzag row
    c.p([[27, 2, 'w'], [27, 1, 'y'], [27, 3, 'y'], [26, 2, 'y'], [28, 2, 'y']]); // a little sparkle
  }, c => { isoCube(c, 7.5, 0.6, 2.4, LOGO_FACES); });


  // ================================================================ more builders
  const FONT = {'0':31599, '1':11415, '2':29671, '3':29391, '4':23497, '5':31183, '6':31215, '7':29330, '8':31727, '9':31695, 'A':11245, 'B':27566, 'C':14627, 'D':27502, 'E':31143, 'F':31140, 'G':14699, 'H':23533, 'I':29847, 'J':4714, 'K':23469, 'L':18727, 'M':24557, 'N':27501, 'O':11114, 'P':27556, 'Q':11123, 'R':27565, 'S':14478, 'T':29842, 'U':23407, 'V':23402, 'W':23549, 'X':23213, 'Y':23186, 'Z':29351, ':':1040, '\\':18569, '>':17492, '.':2, '-':448, '?':29378, '!':9346, '/':4772, '=':3640, '+':1488};
  // tiny 3x5 pixel font (upper case), 4px advance
  const text = (c, x, y, str, k) => { String(str).toUpperCase().split('').forEach((ch, i) => { const v = FONT[ch]; if (!v) return; for (let b = 0; b < 15; b++) if (v & (1 << (14 - b))) c.p(x + i * 4 + b % 3, y + Math.floor(b / 3), k); }); };
  // the arrow mouse pointer (11x16)
  const cursor = (c, x, y) => c.s(x, y, ['k..........', 'kk.........', 'kwk........', 'kwwk.......', 'kwwwk......', 'kwwwwk.....', 'kwwwwwk....', 'kwwwwwwk...', 'kwwwwwwwk..', 'kwwwwwwwwk.', 'kwwwwwkkkkk', 'kwwkwwk....', 'kwk.kwwk...', 'kk..kwwk...', 'k....kwwk..', '.....kkk...']);
  // beige monitor with base; returns the screen rect. w,h = bezel size
  function mon(c, x, y, w, h, scr) {
    const big = c.n === 32, mid = x + (w >> 1);
    if (big) { c.L(L => L.r(mid - 3, y + h, 6, 2, 'C'), 'k'); c.L(L => L.r(mid - 6, y + h + 2, 12, 2, 'c'), 'k', 'w', 'C'); }
    else { c.L(L => L.r(mid - 2, y + h, 4, 1, 'C'), 'k'); c.L(L => L.r(mid - 4, y + h + 1, 8, 1, 'c'), 'k', 'w'); }
    c.L(L => L.r(x, y, w, h, 'c'), 'k', 'w', 'C');
    const i = big ? 3 : 2, s = { x: x + i, y: y + i, w: w - 2 * i, h: h - 2 * i - (big ? 1 : 0) };
    c.r(s.x, s.y, s.w, s.h, scr || 't'); c.h(s.x, s.y, s.w, 'g'); c.v(s.x, s.y, s.h, 'g'); c.h(s.x, s.y + s.h - 1, s.w, 'w'); c.v(s.x + s.w - 1, s.y, s.h, 'w');
    if (big) c.p(x + w - 4, y + h - 3, 'l');
    return s;
  }
  function gear(c, cx, cy, r, k, hole) {
    c.L(L => { L.e(cx, cy, r - 1.2, r - 1.2, k); for (let t = 0; t < 8; t++) { const a = t * Math.PI / 4, x = cx + Math.cos(a) * (r - 1), y = cy + Math.sin(a) * (r - 1); L.r(Math.round(x - 1), Math.round(y - 1), 2, 2, k); } }, 'k');
    if (hole) c.L(L => L.e(cx, cy, hole, hole, 's'), 'k');
  }
  // a compact disc, centre cx,cy radius r
  function disc(c, cx, cy, r) {
    c.L(L => L.e(cx, cy, r, r, 'S'), 'k');
    const big = r > 5;
    for (let y = 0; y < c.n; y++) for (let x = 0; x < c.n; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.sqrt(dx * dx + dy * dy); if (d > r - 0.5) continue;
      const a = Math.atan2(dy, dx);
      if (a > -2.4 && a < -1.2 && d > r * 0.45) c.p(x, y, ['i', 'P', '7', 'Y'][Math.floor((a + 2.4) / 0.3) % 4]);
      else if (a > 0.6 && a < 1.9 && d > r * 0.45) c.p(x, y, ['Y', '8', 'P'][Math.floor((a - 0.6) / 0.44) % 3]);
      else if (dx + dy > r * 0.9) c.p(x, y, 's');
    }
    c.L(L => L.e(cx, cy, big ? r * 0.3 : 1.5, big ? r * 0.3 : 1.5, 'w'), 'g');
    if (big) c.L(L => L.e(cx, cy, r * 0.14, r * 0.14, 's'), 'g');
  }
  // the four playing-card suit pips
  const PIP = { heart: ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], spade: ['...k...', '..kkk..', '.kkkkk.', 'kkkkkkk', 'kk.k.kk', '...k...', '..kkk..'] };
  const key = (c, x, y, big) => { // a gold key, horizontal
    if (big) { c.L(L => { L.e(x + 4, y + 4, 4, 4, 'y'); L.r(x + 7, y + 3, 14, 3, 'y'); L.r(x + 14, y + 6, 2, 3, 'y'); L.r(x + 18, y + 6, 2, 4, 'y'); }, 'k', 'Y', 'o'); c.L(L => L.e(x + 4, y + 4, 1.6, 1.6, 's'), 'k'); }
    else { c.L(L => { L.e(x + 2, y + 2, 2, 2, 'y'); L.r(x + 3, y + 1, 8, 2, 'y'); L.r(x + 7, y + 3, 1, 1, 'y'); L.r(x + 9, y + 3, 1, 2, 'y'); }, 'k', 'Y', 'o'); c.p(x + 1, y + 1, 's'); c.p(x + 2, y + 2, 's'); }
  };
  const bolt32 = [[16, 2], [22, 2], [17, 12], [23, 12], [11, 29], [13, 17], [8, 17]];
  const bolt16 = [[8, 1], [11, 1], [8, 6], [11, 6], [5, 15], [6, 9], [4, 9]];

  // ---- the file types
  I('webpage', c => { doc32(c); lines(c, 9, 9, 13, 2, 'g'); globe(c, 16, 21, 6); c.L(L => L.r(9, 13, 14, 1, 'B'), null); }, c => { doc16(c); globe(c, 8, 9.5, 3.8); });
  I('lnkArrow', c => { c.b(2, 20, 10, 10, 'w'); c.s(4, 22, ['kkkkkk', '.kkkkk', '..kkkk', '.kk.kk', 'kk..k.', 'k.....'].map(r => r.replace(/k/g, 'k'))); c.p([[8, 23], [7, 24]], 'k'); }, c => { c.b(0, 10, 6, 6, 'w'); c.s(1, 11, ['kkkk', '.kkk', 'kkkk', 'k.k.']); }, { ns: true });
  I('exe', c => { win32(c, 3, 4, 26, 24, 'w'); c.b(7, 12, 9, 7, 's'); c.h(8, 13, 7, 'w'); c.v(8, 13, 5, 'w'); c.h(18, 13, 7, 'g'); c.h(18, 15, 7, 'g'); c.h(18, 17, 5, 'g'); c.r(7, 21, 18, 3, 's'); c.h(7, 21, 18, 'w'); c.v(7, 21, 3, 'w'); c.h(7, 23, 18, 'g'); c.v(24, 21, 3, 'g'); }, c => { win16(c, 1, 2, 14, 12, 'w'); c.b(3, 6, 4, 3, 's'); c.h(8, 6, 5, 'g'); c.h(8, 8, 4, 'g'); c.r(3, 10, 10, 2, 's'); c.h(3, 11, 10, 'g'); });
  I('app', c => win32(c, 3, 4, 26, 24, 's'), c => win16(c, 1, 2, 14, 12, 's'));
  I('bat', c => { doc32(c); lines(c, 9, 9, 13, 3, 'g'); gear(c, 16, 22, 6, 'g', 1.6); }, c => { doc16(c); lines(c, 4, 4, 7, 2, 'g'); gear(c, 8, 10, 3.5, 'g', 1); });
  I('ini', c => { doc32(c); for (let j = 0; j < 4; j++) { c.h(9, 10 + j * 5, 14, 'g'); c.bv(11 + (j * 5) % 11, 9 + j * 5, 4, 3, 's'); } }, c => { doc16(c); for (let j = 0; j < 3; j++) { c.h(4, 5 + j * 3, 8, 'g'); c.b(5 + (j * 3) % 6, 4 + j * 3, 3, 3, 's'); } });
  I('dll', c => { doc32(c); gear(c, 13, 14, 5, 'y', 1.4); gear(c, 20, 21, 5, 'y', 1.4); }, c => { doc16(c); gear(c, 6, 7, 3, 'y'); gear(c, 10, 11, 3, 'y'); });
  I('zip', c => { folder32(c); c.L(L => L.r(14, 11, 4, 17, 'K'), 'k'); for (let y = 12; y < 27; y += 2) { c.p(14 + (y & 2 ? 1 : 0), y, 's'); c.p(16 + (y & 2 ? 0 : 1), y, 's'); } c.L(L => L.r(13, 24, 6, 3, 'g'), 'k'); c.p(15, 25, 'w'); }, c => { folder16(c); c.v(7, 6, 8, 'K'); c.v(8, 6, 8, 'K'); for (let y = 6; y < 13; y += 2) c.p(7 + ((y >> 1) & 1), y, 's'); c.r(6, 12, 4, 2, 'g'); });
  const speaker = (c, x, y, big) => { if (big) { c.L(L => { L.r(x, y + 4, 4, 6, 's'); L.poly([[x + 4, y + 4], [x + 10, y], [x + 10, y + 14], [x + 4, y + 10]], 's'); }, 'k', 'w', 'g'); c.pl([[x + 12, y + 3], [x + 13, y + 5], [x + 13, y + 9], [x + 12, y + 11]], 'k'); c.pl([[x + 14, y + 1], [x + 16, y + 4], [x + 16, y + 10], [x + 14, y + 13]], 'k'); } else { c.L(L => { L.r(x, y + 2, 2, 3, 's'); L.poly([[x + 2, y + 2], [x + 5, y], [x + 5, y + 7], [x + 2, y + 5]], 's'); }, 'k'); c.pl([[x + 6, y + 1], [x + 7, y + 3], [x + 6, y + 5]], 'k'); } };
  I('wav', c => { doc32(c); speaker(c, 8, 11, true); }, c => { doc16(c); speaker(c, 4, 5); });
  const note = (c, x, y, big) => { if (big) { c.L(L => { L.e(x + 3, y + 12, 3, 2.2, 'k'); L.e(x + 11, y + 10, 3, 2.2, 'k'); L.r(x + 5, y + 1, 2, 11, 'k'); L.r(x + 13, y, 2, 10, 'k'); L.r(x + 5, y, 10, 3, 'k'); }); } else { c.s(x, y, ['..kkkkk', '..k...k', '..k...k', '..k..kk', 'kkk..kk', 'kkk....']); } };
  I('mid', c => { doc32(c); note(c, 9, 10, true); c.p(13, 13, 'g'); }, c => { doc16(c); note(c, 4, 4); });
  const film = (c, x, y, w, h) => { c.b(x, y, w, h, 'K'); for (let i = x + 1; i < x + w - 1; i += 2) { c.p(i, y + 1, 'w'); c.p(i, y + h - 2, 'w'); } c.r(x + 1, y + 3, w - 2, h - 6, 'B'); };
  I('avi', c => { doc32(c); film(c, 8, 11, 16, 12); c.r(9, 14, 14, 6, 'i'); c.r(11, 15, 3, 4, 'B'); c.r(18, 15, 4, 4, 'y'); }, c => { doc16(c); film(c, 3, 6, 10, 7); });
  I('bmp', c => { doc32(c); c.b(8, 10, 16, 13, 'i'); c.r(9, 11, 14, 11, 'i'); c.poly([[9, 22], [13, 14], [17, 20], [19, 17], [23, 22]], 'G'); c.r(18, 12, 3, 3, 'y'); c.h(9, 21, 14, 'd'); }, c => { doc16(c); c.b(3, 6, 10, 8, 'i'); c.poly([[4, 13], [7, 8], [9, 11], [10, 10], [12, 13]], 'G'); c.r(9, 7, 2, 2, 'y'); });
  I('doc', c => { doc32(c); c.r(9, 9, 10, 3, 'n'); lines(c, 9, 14, 13, 7, 'B', 2, 3); }, c => { doc16(c); c.r(4, 4, 5, 2, 'n'); lines(c, 4, 8, 7, 3, 'B', 2); });
  I('img', c => D.bmp[32](c), c => D.bmp[16](c));
  I('lock', c => { folder32(c); c.L(L => { L.r(11, 17, 12, 9, 'y'); }, 'k', 'Y', 'o'); c.pl([[13, 17], [13, 13], [14, 12], [19, 12], [20, 13], [20, 17]], 'k'); c.pl([[14, 17], [14, 14], [15, 13], [18, 13], [19, 14], [19, 17]], 'K'); c.r(16, 20, 2, 3, 'k'); }, c => { folder16(c); c.b(5, 8, 7, 5, 'y'); c.pl([[6, 8], [6, 6], [7, 5], [9, 5], [10, 6], [10, 8]], 'k'); c.p(8, 10, 'k'); });

  // ---- shell: My Documents, Network, Recycle Bin, Briefcase
  I('documents', c => {
    c.L(L => { L.r(2, 8, 26, 20, 'U'); L.r(3, 5, 9, 3, 'U'); L.p(12, 7, 'U'); }, ['h', 'k'], 'u', 'h');
    page(c, 9, 2, 25, 20, 5); lines(c, 12, 10, 10, 4, 'g');
    c.L(L => L.poly([[6, 14], [31, 14], [26, 28], [2, 28]], 'u'), ['h', 'k'], 'Y', 'U');
  }, c => { c.L(L => { L.r(1, 4, 13, 10, 'U'); L.r(2, 3, 5, 1, 'U'); }, ['h', 'k'], 'u'); page(c, 5, 1, 13, 10, 2); lines(c, 7, 5, 4, 2, 'g'); c.L(L => L.poly([[3, 7], [16, 7], [13, 14], [1, 14]], 'u'), ['h', 'k'], 'Y'); });
  I('network', c => {
    const s1 = mon(c, 1, 1, 15, 12, 't'); c.r(s1.x + 1, s1.y + 1, 3, 1, 'a');
    const s2 = mon(c, 15, 13, 15, 12, 't'); c.r(s2.x + 1, s2.y + 1, 3, 1, 'a');
    c.pl([[8, 17], [8, 28], [22, 28], [22, 29]], 'k'); c.pl([[9, 18], [9, 29]], 'g');
    c.r(6, 27, 5, 3, 'k'); c.r(20, 27, 5, 3, 'k'); c.p(7, 28, 'g'); c.p(21, 28, 'g');
  }, c => { mon(c, 0, 0, 8, 6, 't'); mon(c, 8, 7, 8, 6, 't'); c.pl([[3, 8], [3, 14], [11, 14], [11, 14]], 'k'); c.r(2, 13, 3, 2, 'k'); c.r(10, 13, 3, 2, 'k'); });
  function bin(c, full) {
    c.L(L => L.poly([[5, 9], [27, 9], [24, 30], [8, 30]], 's'), 'k', 'S', 'g');
    for (let x = 9; x <= 23; x += 2) c.l(x, 10, x - Math.round((x - 16) / 7), 29, (x - 9) % 4 ? 'g' : 'K');
    c.h(9, 10, 14, 'w'); c.h(7, 27, 18, 'g');
    c.L(L => L.r(4, 6, 24, 4, 's'), 'k', 'w', 'g'); c.L(L => L.r(11, 3, 10, 3, 's'), 'k', 'w', 'g');
    if (full) { c.L(L => { L.e(10, 5, 4, 3, 'w'); L.e(18, 4, 5, 3.5, 'w'); L.e(25, 6, 3, 2.5, 'w'); }, 'k', null, 'S'); c.p([[9, 4], [17, 3], [16, 4]], 'g'); c.l(12, 6, 15, 3, 'g'); c.l(19, 2, 22, 5, 'g'); }
  }
  I('recycle', c => bin(c), c => { c.L(L => L.poly([[3, 5], [13, 5], [11, 15], [5, 15]], 's'), 'k', 'S', 'g'); c.v(6, 6, 8, 'g'); c.v(8, 6, 8, 'K'); c.v(10, 6, 8, 'g'); c.L(L => L.r(2, 3, 12, 2, 's'), 'k', 'w'); c.r(6, 1, 4, 2, 's'); c.h(6, 1, 4, 'k'); });
  I('recycleFull', c => bin(c, true), c => { D.recycle[16](c); c.L(L => { L.e(5, 2.5, 3, 2, 'w'); L.e(10.5, 2, 3.5, 2.2, 'w'); }, 'k'); });
  I('briefcase', c => {
    c.L(L => L.r(11, 5, 10, 4, 'e'), 'k'); c.r(12, 6, 8, 2, 'E'); c.r(13, 6, 6, 2, 'e');
    c.L(L => L.r(2, 8, 28, 20, 'e'), 'k', 'E', '6');
    c.h(3, 15, 26, '6'); c.h(3, 16, 26, 'E');
    c.L(L => L.r(13, 14, 6, 4, 'y'), 'k', 'Y', 'o'); c.p(15, 16, 'k'); c.p(16, 16, 'k');
    c.r(5, 10, 2, 4, 'E'); c.r(25, 10, 2, 4, 'E');
  }, c => { c.b(5, 2, 6, 3, 'e'); c.p(6, 3, 'E'); c.L(L => L.r(1, 4, 14, 10, 'e'), 'k', 'E', '6'); c.h(2, 8, 12, '6'); c.b(6, 7, 4, 3, 'y'); });
  I('games', c => { folder32(c); c.L(L => { L.r(13, 18, 8, 5, 'K'); L.r(16, 11, 2, 7, 'K'); }, 'k', 'g'); c.L(L => L.e(17, 10.5, 2.5, 2.5, 'r'), 'k', 'R'); c.r(14, 19, 2, 2, 'r'); c.p(14, 19, 'R'); c.r(18, 19, 2, 2, 'y'); }, c => { folder16(c); c.L(L => { L.r(6, 10, 5, 3, 'K'); L.r(8, 7, 1, 3, 'K'); }, 'k'); c.r(7, 5, 3, 2, 'r'); c.p(7, 5, 'R'); });

  // ---- programs: Accessories
  I('mail', c => {
    c.L(L => L.r(2, 8, 28, 19, 'w'), 'k', null, 'S');
    c.pl([[3, 9], [16, 20], [29, 9]], 'g'); c.pl([[3, 25], [12, 17]], 'g'); c.pl([[29, 25], [20, 17]], 'g');
    c.pl([[3, 10], [16, 21], [29, 10]], 'S');
    c.b(21, 2, 9, 9, 'w'); for (let i = 22; i < 30; i += 2) { c.p(i, 2, '_'); c.p(i, 10, '_'); } for (let j = 3; j < 10; j += 2) { c.p(21, j, '_'); c.p(29, j, '_'); }
    c.r(23, 4, 5, 5, 'r'); c.p(24, 5, 'y'); c.p(25, 5, 'y'); c.p(24, 6, 'y');
  }, c => { c.b(1, 4, 14, 9, 'w'); c.pl([[2, 5], [8, 10], [13, 5]], 'g'); c.pl([[2, 11], [6, 8]], 'g'); c.pl([[13, 11], [9, 8]], 'g'); c.b(10, 1, 5, 5, 'w'); c.r(11, 2, 3, 3, 'r'); c.p(12, 3, 'y'); });
  I('paint', c => {
    c.L(L => { L.e(14, 17, 12, 10, 'z'); L.e(23, 23, 3.2, 3.2, '_'); }, 'k', null, 'Z');
    c.L(L => L.e(23, 23, 3, 3, 'w'), 'k'); c.p(9, 10, 'w'); c.p(8, 11, 'w');
    [[7, 15, 'r', 'R'], [10, 9, 'y', 'Y'], [16, 8, 'G', 'V'], [21, 12, 'b', 'B'], [8, 22, 'k', 'K'], [14, 24, 'O', 'y']].forEach(([x, y, k, h]) => { c.L(L => L.e(x + 1.5, y + 1.5, 2.2, 2.2, k), null); c.p(x, y, h); });
    c.l(20, 28, 29, 6, 'k'); c.l(21, 28, 30, 6, 'e'); c.l(22, 28, 31, 7, 'k'); c.L(L => L.poly([[18, 31], [20, 26], [23, 26], [23, 30]], 'K'), 'k'); c.r(20, 27, 2, 1, 'g');
  }, c => { c.L(L => L.e(7, 9, 6.5, 5.5, 'z'), 'k', null, 'Z'); c.p(2, 7, 'r'); c.p(3, 6, 'r'); c.r(5, 4, 2, 2, 'y'); c.r(9, 5, 2, 2, 'G'); c.r(10, 9, 2, 2, 'b'); c.r(4, 11, 2, 2, 'k'); c.L(L => L.e(9, 12, 1.5, 1.5, 'w'), 'g'); c.l(11, 14, 15, 2, 'k'); c.l(12, 14, 15, 3, 'e'); c.r(11, 12, 2, 3, 'K'); });
  I('calc', c => {
    c.L(L => L.r(5, 1, 22, 30, 's'), 'k', 'w', 'g');
    c.sk(8, 4, 16, 6, 'w'); text(c, 9, 6, '1999', 'k');
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = 8 + i * 4, y = 12 + j * 4; c.b(x, y, 4, 4, i === 3 ? 'g' : 's'); c.p(x + 1, y + 1, i === 3 ? 's' : 'w'); }
    c.r(21, 25, 2, 3, 'k'); c.r(8, 29, 12, 1, 'K');
  }, c => { c.L(L => L.r(2, 0, 12, 16, 's'), 'k', 'w', 'g'); c.sk(4, 2, 8, 3, 'w'); c.h(6, 3, 4, 'k'); for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { c.b(4 + i * 3, 7 + j * 3, 2, 2, i === 2 ? 'g' : 'k'); } });
  I('control', c => {
    c.L(L => L.r(2, 4, 28, 22, 's'), 'k', 'w', 'g');
    c.sk(5, 7, 12, 8, 'k'); c.r(6, 8, 10, 6, 'K'); c.pl([[7, 13], [11, 9], [15, 13]], 'l'); c.p(11, 9, 'r');
    c.b(20, 7, 7, 7, 'S'); c.L(L => L.e(23.5, 10.5, 2, 2, 'K'), 'k'); c.p(23, 9, 'w');
    c.sk(5, 18, 22, 4, 'g'); c.bv(9, 17, 4, 6, 's'); c.bv(19, 17, 4, 6, 's');
    c.r(4, 24, 2, 1, 'l'); c.r(7, 24, 2, 1, 'r'); c.r(10, 24, 2, 1, 'y');
    c.L(L => L.r(9, 26, 14, 3, 'g'), 'k');
  }, c => { c.L(L => L.r(1, 2, 14, 11, 's'), 'k', 'w', 'g'); c.sk(3, 4, 5, 4, 'k'); c.pl([[3, 7], [5, 5], [7, 7]], 'l'); c.b(10, 4, 3, 3, 'S'); c.sk(3, 9, 10, 2, 'g'); c.b(5, 8, 2, 3, 's'); c.b(10, 8, 2, 3, 's'); });
  I('settings', c => { win32(c, 2, 2, 28, 26, 'w'); gear(c, 14, 17, 7.5, 's', 2.2); c.p([[11, 13], [12, 12]], 'w'); gear(c, 23, 11, 4.5, 'y', 1.2); }, c => { win16(c, 1, 1, 14, 13, 'w'); gear(c, 7, 9, 3.5, 's', 1); gear(c, 11, 5, 2.5, 'y'); });
  const magnifier = (c, cx, cy, r, hx, hy) => { c.L(L => L.e(cx, cy, r, r, 'i'), 'k'); c.r(cx - r + 1, cy - r + 1, r, r, 'i'); c.L(L => L.e(cx, cy, r - 1, r - 1, 'i'), 'g'); c.p([[cx - r + 2, cy - 1], [cx - r + 2, cy - 2], [cx - r + 3, cy - 3], [cx - 2, cy - r + 2], [cx - 1, cy - r + 2]], 'w'); c.L(L => L.poly([[cx + r - 2, cy + r - 1], [cx + r - 1, cy + r - 2], [hx + 1, hy], [hx, hy + 1]], 'e'), 'k', 'E', '6'); };
  I('find', c => { doc32(c); lines(c, 9, 8, 13, 8, 'g', 2, 3); magnifier(c, 12, 14, 7, 27, 29); }, c => { doc16(c); lines(c, 4, 4, 7, 4, 'g', 2); magnifier(c, 6, 7, 4, 14, 15); });
  I('magnifier', c => { magnifier(c, 13, 13, 10, 29, 29); c.p(13, 13, 'B'); }, c => { magnifier(c, 6, 6, 5.5, 14, 14); }, { ns: false });
  I('help', c => {
    c.L(L => { L.e(16, 13, 13, 12, 'w'); L.poly([[9, 23], [15, 25], [6, 31]], 'w'); }, 'k', null, 'S');
    c.s(10, 4, ['..bbbbbb..', '.bbBBBBbb.', 'bbB....bbb', 'bbb....bbb', '.......bbb', '......bbb.', '....bbbb..', '....bbb...', '....bbb...', '..........', '....bbb...', '....bbb...']);
    cursor(c, 21, 19);
  }, c => D.question[16](c));
  I('run', c => { win32(c, 2, 4, 28, 22, 'w'); c.s(5, 12, ['kk......', '.kk.....', '..kk....', '...kk...', '..kk....', '.kk.....', 'kk......']); c.sk(13, 12, 12, 7, 'w'); c.h(14, 13, 11, 'g'); c.h(15, 15, 4, 'k'); c.v(21, 14, 4, 'k'); }, c => { win16(c, 1, 2, 14, 12, 'w'); c.s(3, 6, ['k...', '.k..', '..k.', '.k..', 'k...']); c.sk(8, 6, 5, 4, 'w'); c.v(10, 7, 2, 'k'); });
  I('shutdown', c => { const s = mon(c, 4, 2, 24, 20, 'k'); c.r(s.x + 1, s.y + 1, s.w - 2, s.h - 2, 'K'); c.L(L => L.e(16, 12, 3.5, 3.5, 'r'), 'k'); c.r(15, 9, 2, 4, 'K'); c.r(15, 8, 2, 4, 'y'); c.p(15, 10, 'R'); c.r(26, 18, 2, 2, 'r'); c.L(L => L.r(20, 26, 8, 4, 'c'), 'k', 'w', 'C'); c.pl([[21, 25], [21, 23]], 'K'); c.p(21, 27, 'l'); }, c => { const s = mon(c, 2, 1, 12, 10, 'k'); c.r(s.x + 2, s.y + 1, 4, 4, 'K'); c.p(s.x + 3, s.y + 2, 'y'); c.p(s.x + 4, s.y + 2, 'y'); c.p(s.x + 3, s.y + 3, 'r'); c.p(s.x + 4, s.y + 3, 'r'); c.p(12, 10, 'r'); });
  I('logoff', c => { key(c, 3, 6, true); c.L(L => L.r(4, 17, 10, 13, 'e'), 'k', 'E', '6'); c.p(12, 24, 'y'); c.L(L => L.poly([[14, 17], [24, 14], [24, 30], [14, 30]], 'E'), 'k'); c.v(15, 18, 12, 'T'); c.pl([[19, 16], [19, 29]], 'e'); }, c => { key(c, 2, 2, false); c.b(2, 8, 5, 8, 'e'); c.p(5, 12, 'y'); c.poly([[7, 8], [13, 6], [13, 16], [7, 16]], 'E'); c.pl([[7, 8], [13, 6], [13, 15], [7, 15]], 'k'); });
  I('printer', c => {
    page(c, 9, 1, 24, 13, 3); lines(c, 11, 4, 10, 3, 'g');
    c.L(L => L.r(2, 12, 28, 10, 'c'), 'k', 'w', 'C'); c.L(L => L.poly([[2, 12], [6, 8], [27, 8], [30, 12]], 'c'), 'k', 'w'); c.r(7, 9, 19, 3, 'c'); c.h(7, 9, 19, 'w');
    c.r(9, 9, 15, 2, 'k'); page(c, 10, 10, 23, 13, 2);
    c.r(4, 16, 3, 2, 'l'); c.r(8, 16, 3, 2, 'g'); c.r(24, 15, 4, 3, 's'); c.h(24, 15, 4, 'k');
    c.L(L => L.r(5, 21, 22, 8, 'S'), 'k', 'w', 'C'); c.r(7, 23, 18, 2, 'k'); page(c, 8, 24, 24, 30, 3); lines(c, 10, 26, 10, 2, 'g');
  }, c => { page(c, 4, 0, 11, 5, 1); c.L(L => L.r(1, 5, 14, 6, 'c'), 'k', 'w', 'C'); c.p(3, 7, 'l'); c.r(4, 6, 8, 1, 'k'); c.r(3, 11, 10, 4, 'k'); c.r(4, 12, 8, 3, 'w'); c.h(5, 13, 6, 'g'); });
  I('floppy', c => {
    c.L(L => { L.r(3, 2, 26, 28, '9'); L.p(28, 2, '_'); }, 'k', 'B', 'n');
    c.r(8, 3, 15, 10, 'k'); c.L(L => L.r(9, 3, 13, 9, 's'), null, 'w', 'g'); c.r(11, 4, 3, 7, 'k'); c.p(12, 5, 'K');
    c.r(7, 17, 18, 12, 'w'); c.h(7, 17, 18, 'g'); c.v(7, 17, 12, 'g'); c.r(7, 28, 18, 2, 'r'); lines(c, 10, 20, 12, 3, 'g', 2);
    c.r(4, 26, 2, 3, 'S'); c.r(26, 26, 2, 3, 'S');
  }, c => { c.L(L => L.r(1, 1, 14, 14, '9'), 'k', 'B', 'n'); c.r(4, 2, 8, 5, 'k'); c.r(5, 2, 6, 4, 's'); c.r(6, 3, 2, 3, 'k'); c.r(4, 9, 8, 6, 'w'); c.h(4, 14, 8, 'r'); c.h(5, 11, 6, 'g'); });
  I('hdd', c => { c.L(L => L.r(2, 10, 28, 12, 'c'), 'k', 'w', 'C'); c.r(5, 13, 22, 1, 'C'); c.r(5, 18, 14, 1, 'k'); c.r(5, 19, 14, 1, 'w'); c.r(23, 18, 3, 2, 'l'); c.p(23, 18, 'V'); c.L(L => L.r(4, 22, 24, 3, 'C'), 'k'); c.r(2, 23, 2, 2, 'S'); c.r(28, 23, 2, 2, 'S'); }, c => { c.L(L => L.r(1, 4, 14, 7, 'c'), 'k', 'w', 'C'); c.r(3, 8, 7, 1, 'k'); c.r(11, 8, 2, 1, 'l'); c.h(2, 11, 12, 'C'); });
  I('cdrom', c => { D.hdd[32](c); c.r(5, 15, 22, 2, 'K'); disc(c, 16, 6, 6); c.r(8, 10, 16, 1, 'k'); c.r(6, 16, 20, 1, 'C'); }, c => { D.hdd[16](c); c.r(3, 5, 10, 1, 'K'); disc(c, 8, 2, 3); });
  I('cd', c => disc(c, 16, 16, 14), c => disc(c, 8, 8, 7));
  I('cards', c => {
    c.L(L => L.poly([[15, 4], [29, 7], [24, 29], [10, 26]], 'w'), 'k', null, 'S'); c.poly([[17, 7], [27, 9], [23, 26], [13, 24]], 'r'); c.s(18, 12, ['.ww.ww.', 'wwwwwww', 'wwwwwww', '.wwwww.', '..www..', '...w...']);
    c.L(L => L.r(3, 3, 14, 21, 'w'), 'k', null, 'S'); c.s(5, 5, ['k.', 'kk']); c.s(7, 9, PIP.spade); c.s(5, 17, PIP.spade.slice().reverse().map(r => r.split('').reverse().join(''))); c.s(13, 20, ['kk', 'kk']);
  }, c => { c.b(6, 2, 8, 12, 'r'); c.r(7, 3, 6, 10, 'w'); c.p(9, 7, 'r'); c.p(10, 7, 'r'); c.b(1, 1, 8, 12, 'w'); c.s(3, 4, ['..k..', '.kkk.', 'kkkkk', 'k.k.k', '.kkk.']); });
  I('freecell', c => {
    c.L(L => L.r(2, 8, 12, 17, 'w'), 'k', null, 'S'); c.s(4, 11, PIP.heart); c.L(L => L.r(18, 8, 12, 17, 'w'), 'k', null, 'S'); c.s(20, 11, PIP.spade);
    c.L(L => L.r(10, 2, 12, 17, 'w'), 'k', null, 'S'); c.s(12, 4, ['k...', 'kk..']); c.s(12, 7, ['y...y...y', 'yy..y..yy', 'yyy.y.yyy', 'yyyyyyyyy', 'yyyyyyyyy', 'yyyyyyyyy'], { y: 'y', '.': '.' }); c.p([[12, 10, 'r'], [16, 10, 'b'], [20, 10, 'G'], [14, 12, 'r'], [18, 12, 'r']]); c.h(12, 13, 9, 'o');
    c.poly([[6, 30], [10, 26], [26, 26], [30, 30]], 'G'); c.h(6, 29, 24, 'd');
  }, c => { c.b(1, 3, 6, 9, 'w'); c.s(2, 6, ['.r.r', 'rrrr', '.rr.', '..r.']); c.b(9, 3, 6, 9, 'w'); c.s(10, 5, ['.k.', 'kkk', 'k.k', '.k.']); c.b(5, 0, 6, 9, 'w'); c.r(6, 4, 4, 2, 'y'); c.s(6, 2, ['y.y.', 'yyyy']); });
  I('jackamp', c => { c.L(L => L.r(3, 3, 26, 26, 'K'), 'k', 'g', 'k'); c.r(5, 5, 22, 22, 'k'); c.L(L => L.poly(bolt32, 'y'), 'o', 'Y', 'O'); c.h(5, 5, 22, 'K'); c.v(5, 5, 22, 'K'); }, c => { c.b(1, 1, 14, 14, 'k'); c.p(2, 2, 'K'); c.L(L => L.poly(bolt16, 'y'), 'o', 'Y', 'O'); });
  I('media', c => { win32(c, 2, 2, 28, 26, 'k'); film(c, 5, 9, 22, 11); c.r(6, 12, 20, 5, 'B'); c.poly([[13, 12], [13, 17], [19, 14.5]], 'w'); c.bv(5, 22, 5, 4, 's'); c.poly([[7, 23], [7, 25], [9, 24]], 'k'); c.bv(11, 22, 5, 4, 's'); c.r(13, 23, 1, 2, 'k'); c.r(15, 23, 1, 2, 'k'); c.bv(17, 22, 5, 4, 's'); c.r(19, 23, 2, 2, 'k'); c.sk(23, 23, 4, 2, 'g'); }, c => { win16(c, 1, 1, 14, 13, 'k'); film(c, 3, 5, 10, 5); c.poly([[7, 6], [7, 9], [10, 7.5]], 'w'); c.b(3, 11, 3, 2, 's'); c.b(7, 11, 3, 2, 's'); });
  I('cdplayer', c => { disc(c, 16, 15, 13); c.L(L => L.r(19, 19, 10, 10, 's'), 'k', 'w', 'g'); c.poly([[22, 21], [22, 27], [27, 24]], 'G'); c.p(22, 21, 'l'); }, c => { disc(c, 7, 7, 6.5); c.L(L => L.r(9, 9, 7, 7, 's'), 'k', 'w', 'g'); c.poly([[11, 10], [11, 14], [14, 12]], 'G'); });
  I('dos', c => { c.L(L => L.r(2, 2, 28, 26, 's'), 'k', 'w', 'g'); c.r(4, 4, 24, 3, 's'); c.p(5, 5, 'k'); c.r(25, 5, 2, 1, 'k'); c.r(4, 7, 24, 19, 'k'); text(c, 6, 9, 'C:\\>', 's'); c.r(22, 9, 3, 5, 'S'); text(c, 6, 16, 'DIR', 'w'); c.r(6, 23, 4, 1, 'S'); }, c => { c.b(1, 1, 14, 14, 'k'); c.h(2, 2, 12, 's'); c.p(3, 2, 'k'); c.s(3, 5, ['ww.w.', 'w....', 'w..w.', 'w....', 'ww.w.']); c.s(9, 5, ['k.', '.k', 'k.'].map(r => r.replace(/k/g, 'w'))); c.r(10, 7, 2, 1, 'w'); c.r(4, 11, 3, 1, 'S'); });
  I('jbasic', c => { c.L(L => L.r(2, 2, 28, 26, 's'), 'k', 'w', 'g'); c.r(4, 4, 24, 22, 'b'); c.r(4, 4, 24, 2, 's'); c.p(5, 4, 'k'); c.p(5, 5, 'k'); c.s(6, 8, ['yy..ssss.sss.y.sss.ss', 'y.y.s.s..s...y.s.s.s.', 'yy..ssss.sss.y.s.s.s.']); c.s(6, 13, ['yy..sss.sss.sss', 'y.y.s...s.s.s..', 'yy..s.s.s.s.s.s']); c.s(6, 18, ['yy..sss.s.s.s.s', 'y.y.s...s.s.s..', 'yy..sss.s.s.s..']); c.r(6, 23, 3, 1, 'y'); c.h(4, 25, 24, 'a'); }, c => { c.b(1, 1, 14, 14, 'b'); c.h(2, 2, 12, 's'); c.s(3, 4, ['y.sss.ss', 'y.s.s...', 'y.sss.ss']); c.s(3, 8, ['y.s.s.s', 'y.ss..s', 'y.s.s.s']); c.r(3, 12, 2, 1, 'y'); });
  I('adventure', c => {
    c.L(L => L.r(5, 3, 22, 26, 'T'), 'h', 'Y', 'E'); c.r(5, 3, 22, 1, 'E'); c.r(5, 28, 22, 1, 'E'); c.L(L => L.r(3, 2, 26, 3, 'E'), 'h', 'T'); c.L(L => L.r(3, 27, 26, 3, 'E'), 'h', 'T');
    c.s(8, 8, ['..k.', '...k', '..k.']); c.s(13, 8, ['kkkkkkkkkk']); c.h(9, 12, 14, 'e'); c.h(9, 14, 10, 'e'); c.h(9, 16, 13, 'e'); c.h(9, 18, 8, 'e');
    c.s(8, 21, ['..k.', '...k', '..k.']); c.r(13, 22, 5, 1, 'k'); c.r(19, 21, 1, 3, 'k');
  }, c => { c.L(L => L.r(3, 1, 10, 14, 'T'), 'h', 'Y', 'E'); c.r(2, 1, 12, 1, 'E'); c.r(2, 14, 12, 1, 'E'); c.s(5, 4, ['k.', '.k', 'k.']); c.h(8, 5, 4, 'k'); c.h(5, 8, 6, 'e'); c.h(5, 10, 4, 'e'); c.p(5, 12, 'k'); });
  I('pinball', c => {
    c.L(L => L.r(3, 1, 26, 30, 'n'), 'k', 'B', 'n'); c.r(5, 3, 22, 26, 'G'); c.r(6, 4, 20, 2, 'd'); c.r(6, 4, 20, 1, 'V');
    [[8, 8, 'r'], [16, 7, 'y'], [22, 10, 'r'], [12, 13, 'a']].forEach(([x, y, k]) => { c.L(L => L.e(x + 1.5, y + 1.5, 2.5, 2.5, k), 'k'); c.p(x, y, 'w'); });
    c.L(L => L.e(16, 17.5, 2.5, 2.5, 'S'), 'k'); c.p(15, 16, 'w');
    c.pl([[7, 22], [13, 26]], 'k'); c.pl([[7, 23], [13, 27]], 'r'); c.pl([[25, 22], [19, 26]], 'k'); c.pl([[25, 23], [19, 27]], 'r');
    c.r(26, 6, 2, 22, 'K'); c.r(27, 24, 1, 4, 'r');
  }, c => { c.b(1, 0, 14, 16, 'n'); c.r(2, 1, 12, 14, 'G'); c.r(4, 3, 2, 2, 'r'); c.r(9, 2, 2, 2, 'y'); c.r(10, 6, 2, 2, 'r'); c.r(7, 8, 2, 2, 'w'); c.pl([[3, 11], [6, 13]], 'r'); c.pl([[12, 11], [9, 13]], 'r'); c.v(13, 2, 12, 'K'); });
  I('chess', c => {
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) c.r(2 + i * 7, 2 + j * 7, 7, 7, (i + j) & 1 ? 'e' : 'T'); c.pl([[2, 2], [29, 2], [29, 29], [2, 29], [2, 2]], 'k');
    c.s(8, 4, ['......kk.......', '.....kkkk......', '....kkkkkkk....', '...kkkkkkkkk...', '..kkkkkkkkkkk..', '..kkkkkkkkkkkk.', '..kkkkk.kkkkkkk', '...kkk....kkkkk', '..........kkkkk', '.........kkkkk.', '........kkkkk..', '.......kkkkkk..', '.......kkkkkk..', '......kkkkkkkk.', '.....kkkkkkkkkk', '....kkkkkkkkkkk']);
    c.r(10, 20, 13, 1, 'K'); c.p([[9, 7], [10, 6], [8, 8]], 'g'); c.p(13, 8, 'w'); c.r(10, 27, 15, 2, 'k'); c.h(11, 28, 13, 'K');
  }, c => { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) c.r(i * 4, j * 4, 4, 4, (i + j) & 1 ? 'e' : 'T'); c.s(4, 2, ['..kk...', '.kkkkk.', 'kkkkkkk', 'kkk.kkk', '....kkk', '...kkk.', '..kkkk.', '.kkkkkk', 'kkkkkkk']); });
  I('reversi', c => {
    c.L(L => L.r(2, 2, 28, 28, 'G'), 'k'); for (let i = 9; i < 30; i += 7) { c.v(i, 3, 26, 'd'); c.h(3, i, 26, 'd'); }
    const d = (x, y, k, h) => { c.L(L => L.e(x + 3.5, y + 3.5, 3, 3, k), 'k'); if (k === 'k') { c.p(x + 2, y + 2, h); c.p(x + 3, y + 2, h); } else { c.p(x + 4, y + 5, 'S'); c.p(x + 5, y + 4, 'S'); } };
    d(3, 3, 'k', 'g'); d(10, 3, 'w', 'w'); d(17, 10, 'k', 'g'); d(10, 10, 'w', 'w'); d(17, 17, 'w', 'w'); d(24, 17, 'k', 'g'); d(10, 17, 'k', 'g'); d(3, 24, 'w', 'w');
  }, c => { c.b(0, 0, 16, 16, 'G'); c.v(5, 1, 14, 'd'); c.v(10, 1, 14, 'd'); c.h(1, 5, 14, 'd'); c.h(1, 10, 14, 'd'); const d = (x, y, k) => { c.L(L => L.e(x + 2.5, y + 2.5, 2, 2, k), 'k'); }; d(1, 1, 'k'); d(6, 1, 'w'); d(6, 6, 'k'); d(11, 6, 'w'); d(1, 11, 'w'); d(11, 11, 'k'); });
  I('carta', c => {
    c.L(L => L.r(3, 2, 20, 27, 'n'), 'k', 'B', 'n'); c.r(5, 2, 2, 27, 'y'); c.p(5, 2, 'Y'); c.r(5, 29, 2, 1, 'o');
    c.L(L => L.poly([[23, 2], [27, 5], [27, 32], [23, 29]], 'B'), 'k'); c.r(9, 7, 11, 3, 'y'); c.r(9, 12, 11, 1, 'y'); c.r(9, 14, 8, 1, 'y');
    globe(c, 16, 22, 5.5);
  }, c => { c.L(L => L.r(1, 1, 11, 14, 'n'), 'k', 'B', 'n'); c.r(2, 1, 1, 14, 'y'); c.poly([[12, 1], [14, 3], [14, 16], [12, 15]], 'B'); c.r(5, 4, 5, 2, 'y'); globe(c, 7.5, 10.5, 3.2); });


  // ---- more programs
  const kbd = (c, x, y, w, h) => { c.L(L => L.r(x, y, w, h, 'c'), 'k', 'w', 'C'); for (let j = y + 2; j < y + h - 2; j += 2) for (let i = x + 2 + ((j - y) % 4 ? 1 : 0); i < x + w - 3; i += 2) c.p(i, j, 'q'); c.h(x + 6, y + h - 3, w - 12, 'q'); };
  I('typing', c => {
    page(c, 6, 1, 26, 18, 4); text(c, 9, 6, 'ASDF', 'n'); text(c, 9, 12, 'JKL', 'n'); c.v(21, 12, 5, 'k');
    c.L(L => L.poly([[1, 21], [31, 21], [31, 30], [1, 30]], 'c'), 'k', 'w', 'C');
    for (let j = 23; j < 29; j += 2) for (let i = 3 + ((j - 23) % 4 ? 1 : 0); i < 29; i += 2) c.p(i, j, 'q'); c.h(9, 28, 14, 'q');
    c.r(9, 25, 2, 1, 'r'); c.r(21, 25, 2, 1, 'r');
  }, c => { page(c, 3, 0, 12, 8, 2); text(c, 4, 2, 'AS', 'n'); kbd(c, 0, 9, 16, 7); c.p(4, 12, 'r'); c.p(11, 12, 'r'); });
  I('whiteboard', c => {
    c.L(L => L.r(1, 2, 30, 22, 's'), 'k', 'w', 'g'); c.r(3, 4, 26, 18, 'w'); c.h(3, 4, 26, 'g'); c.v(3, 4, 18, 'g');
    c.pl([[4, 15], [7, 9], [10, 13], [14, 7]], 'r'); c.pl([[17, 8], [26, 8]], 'b'); c.pl([[17, 11], [24, 11]], 'b'); c.pl([[17, 14], [26, 14]], 'b');
    c.L(L => L.e(9, 19, 3, 2.5, 'w'), 'G'); c.pl([[18, 19], [21, 17], [24, 20], [27, 17]], 'f');
    c.L(L => L.r(4, 24, 24, 2, 's'), 'k', 'w'); c.L(L => L.r(8, 22, 9, 2, 'b'), 'k'); c.r(17, 22, 2, 2, 'K'); c.v(9, 26, 5, 'k'); c.v(23, 26, 5, 'k');
  }, c => { c.b(0, 1, 16, 11, 'w'); c.pl([[0, 1], [15, 1], [15, 11], [0, 11], [0, 1]], 'g'); c.pl([[2, 8], [4, 4], [6, 7], [8, 3]], 'r'); c.h(9, 4, 5, 'b'); c.h(9, 6, 4, 'b'); c.h(9, 8, 5, 'b'); c.h(2, 12, 12, 's'); c.r(4, 11, 4, 1, 'b'); c.v(3, 13, 3, 'k'); c.v(12, 13, 3, 'k'); });
  I('magnets', c => {
    c.L(L => L.r(5, 1, 22, 30, 'w'), 'k', null, 'S'); c.h(6, 11, 20, 'k'); c.h(6, 12, 20, 's'); c.r(23, 4, 2, 5, 'g'); c.r(23, 14, 2, 8, 'g'); c.p(23, 4, 's'); c.p(23, 14, 's');
    c.s(8, 3, ['.rr.', 'r..r', 'rrrr', 'r..r', 'r..r']); c.s(13, 5, ['bbb', 'b..', 'bb.', 'b..', 'bbb']);
    c.s(8, 15, ['GG.', 'G.G', 'GG.', 'G.G', 'GG.']); c.s(13, 18, ['.OO', 'O..', 'O..', 'O..', '.OO']); c.s(17, 15, ['p.p', 'ppp', 'p.p', 'p.p']); c.L(L => L.e(11, 25, 2, 2, 'y'), 'o'); c.r(16, 24, 4, 3, 'f'); c.v(6, 30, 1, 'k');
  }, c => { c.b(2, 0, 12, 16, 'w'); c.h(3, 5, 10, 'k'); c.r(11, 2, 1, 2, 'g'); c.r(11, 7, 1, 4, 'g'); c.s(4, 1, ['.r.', 'r.r', 'rrr']); c.s(5, 7, ['bb', 'b.', 'bb']); c.s(7, 10, ['GG', 'G.', 'GG']); c.r(4, 12, 2, 2, 'O'); });
  I('radio', c => {
    c.l(20, 1, 28, 9, 's'); c.l(21, 1, 29, 9, 'g'); c.p(20, 1, 'k'); c.p(21, 0, 'k');
    c.L(L => L.r(2, 9, 28, 19, 'm'), 'k', 'r', '6'); c.r(4, 11, 24, 15, 'm');
    c.L(L => L.e(10, 18.5, 6, 6, 'K'), 'k'); for (let y = 13; y < 25; y += 2) for (let x = 5; x < 16; x += 2) if ((x + 0.5 - 10) ** 2 + (y + 0.5 - 18.5) ** 2 < 30) c.p(x, y, 's');
    c.L(L => L.r(19, 12, 9, 6, 'Y'), 'k'); for (let x = 20; x < 27; x += 2) c.p(x, 13, 'k'); c.v(23, 13, 4, 'r');
    c.L(L => L.e(23.5, 22.5, 2.5, 2.5, 's'), 'k', 'w'); c.p(23, 21, 'k'); c.h(4, 28, 3, 'k'); c.h(25, 28, 3, 'k');
  }, c => { c.l(10, 0, 14, 4, 'g'); c.L(L => L.r(1, 5, 14, 9, 'm'), 'k', 'r'); c.L(L => L.e(5, 9.5, 3, 3, 'K'), 'k'); c.p(4, 8, 's'); c.p(6, 10, 's'); c.p(4, 10, 's'); c.p(6, 8, 's'); c.r(9, 7, 4, 2, 'Y'); c.p(11, 7, 'r'); c.r(10, 10, 2, 2, 's'); });
  I('zone', c => {
    globe(c, 13, 13, 11);
    c.L(L => L.r(17, 16, 12, 12, 'w'), 'k', null, 'S'); [[19, 18], [25, 18], [22, 21], [19, 24], [25, 24]].forEach(([x, y]) => c.r(x, y, 2, 2, 'k'));
    c.L(L => { L.e(5.5, 24, 3, 3, 'r'); L.r(4, 26, 3, 3, 'r'); L.r(2, 28, 7, 2, 'r'); }, 'k', 'R', 'm');
  }, c => { globe(c, 6.5, 6.5, 5.5); c.L(L => L.r(8, 8, 7, 7, 'w'), 'k'); c.p(9, 9, 'k'); c.p(13, 9, 'k'); c.p(11, 11, 'k'); c.p(9, 13, 'k'); c.p(13, 13, 'k'); });
  I('wordpad', c => {
    doc32(c); c.r(9, 7, 7, 2, 'n'); lines(c, 9, 11, 13, 8, 'g', 2, 4);
    c.L(L => L.poly([[27, 3], [30, 6], [17, 21], [14, 18]], 'n'), 'k'); c.l(27, 4, 16, 17, 'B'); c.L(L => L.poly([[14, 18], [17, 21], [12, 25], [11, 22]], 'y'), 'k'); c.p(13, 22, 'k'); c.p(12, 23, 'o');
  }, c => { doc16(c); lines(c, 4, 4, 7, 5, 'g', 2); c.l(14, 2, 8, 9, 'n'); c.l(13, 2, 7, 9, 'k'); c.l(15, 3, 9, 10, 'k'); c.r(6, 10, 2, 2, 'y'); c.p(5, 12, 'k'); });
  I('spreadsheet', c => {
    page(c, 4, 1, 27, 30, 5); c.r(6, 6, 20, 3, '1'); c.h(6, 6, 20, 'V');
    for (let y = 10; y < 29; y += 3) c.h(6, y, 20, 's'); for (let x = 11; x < 26; x += 5) c.v(x, 6, 23, 's');
    c.r(14, 22, 3, 6, 'b'); c.r(18, 18, 3, 10, 'r'); c.r(22, 14, 3, 14, 'y'); c.h(13, 28, 13, 'k'); c.v(13, 13, 15, 'k');
    text(c, 6, 12, '1', 'k'); text(c, 6, 18, '2', 'k');
  }, c => { page(c, 1, 0, 14, 15, 3); c.r(2, 3, 9, 2, '1'); for (let y = 6; y < 15; y += 2) c.h(2, y, 11, 's'); c.v(5, 3, 12, 's'); c.r(7, 10, 2, 4, 'r'); c.r(10, 8, 2, 6, 'b'); c.h(6, 14, 7, 'k'); });
  I('cardfile', c => {
    c.L(L => L.poly([[2, 18], [30, 18], [28, 30], [4, 30]], 'E'), 'k', 'T', 'e');
    [[4, 6, 'w', 6], [7, 4, 'Y', 12], [10, 2, 'w', 18]].forEach(([x, y, k, tx]) => { c.b(x, y, 20, 16, k); c.L(L => L.r(x + tx - 4, y - 2, 5, 3, k), 'k'); lines(c, x + 2, y + 5, 15, 4, k === 'w' ? 'B' : 'g', 2); c.h(x + 1, y + 3, 18, 'r'); });
    c.L(L => L.poly([[2, 18], [30, 18], [28, 30], [4, 30]], 'E'), 'k', 'T', 'e'); c.r(13, 22, 6, 2, '6');
  }, c => { [[1, 3, 'w'], [3, 1, 'Y'], [5, 0, 'w']].forEach(([x, y, k]) => c.b(x, y, 10, 9, k)); c.h(6, 3, 8, 'r'); c.h(6, 5, 7, 'B'); c.L(L => L.poly([[0, 9], [16, 9], [15, 16], [1, 16]], 'E'), 'k', 'T'); });
  I('addressbook', c => {
    c.L(L => L.r(5, 2, 21, 28, 'n'), 'k', 'B', 'n'); c.r(5, 2, 3, 28, '9'); c.r(26, 4, 4, 5, 'r'); c.r(26, 10, 4, 5, 'y'); c.r(26, 16, 4, 5, '1'); c.b(25, 4, 5, 5, 'r'); c.b(25, 10, 5, 5, 'y'); c.b(25, 16, 5, 5, '1');
    c.L(L => L.r(10, 6, 13, 18, 'w'), 'k'); c.L(L => L.e(16.5, 12, 3, 3.2, 'z'), 'k'); c.L(L => L.poly([[11, 22], [12, 17], [21, 17], [22, 22]], 'B'), 'k');
  }, c => { c.L(L => L.r(2, 1, 11, 14, 'n'), 'k', 'B'); c.r(13, 2, 2, 3, 'r'); c.r(13, 6, 2, 3, 'y'); c.r(13, 10, 2, 3, '1'); c.b(5, 3, 7, 9, 'w'); c.r(7, 4, 3, 3, 'z'); c.r(6, 8, 5, 3, 'B'); });
  I('hyperterm', c => {
    const sc = mon(c, 8, 1, 22, 18, 'k'); text(c, sc.x + 2, sc.y + 2, 'ATDT', 'l'); c.r(sc.x + 2, sc.y + 8, 3, 1, 'l');
    c.L(L => { L.poly([[2, 21], [6, 19], [8, 23], [5, 25], [9, 29], [11, 27], [14, 29], [11, 31], [6, 30], [2, 25]], 'r'); }, 'k', 'R', 'm');
    c.pl([[14, 29], [18, 28], [20, 30], [23, 28]], 'K');
  }, c => { const sc = mon(c, 4, 0, 12, 10, 'k'); c.h(sc.x + 1, sc.y + 1, 4, 'l'); c.h(sc.x + 1, sc.y + 3, 2, 'l'); c.L(L => L.poly([[0, 10], [3, 9], [4, 11], [3, 12], [5, 14], [6, 13], [8, 14], [6, 16], [3, 15], [0, 12]], 'r'), 'k', 'R'); });
  I('calendar', c => {
    c.L(L => L.r(3, 4, 26, 26, 'w'), 'k', null, 'S'); c.r(4, 5, 24, 6, 'r'); c.h(4, 5, 24, 'R'); c.h(4, 10, 24, 'm');
    [6, 24].forEach(x => { c.r(x, 1, 2, 6, 's'); c.v(x, 1, 6, 'k'); c.p(x + 1, 1, 'k'); c.p(x + 1, 6, 'g'); });
    text(c, 11, 6, 'JAN', 'w');
    for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) c.r(5 + i * 4, 13 + j * 4, 3, 3, (i === 2 && j === 1) ? 'r' : (i === 5 ? 'R' : 's'));
  }, c => { c.b(1, 2, 14, 14, 'w'); c.r(2, 3, 12, 3, 'r'); c.v(4, 0, 4, 'k'); c.v(11, 0, 4, 'k'); for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) c.r(3 + i * 3, 7 + j * 3, 2, 2, i === 1 && j === 1 ? 'r' : 's'); });
  const clockFace = (c, cx, cy, r, big) => {
    c.L(L => L.e(cx, cy, r, r, 'n'), 'k', 'B', '9'); c.L(L => L.e(cx, cy, r - (big ? 3 : 1.5), r - (big ? 3 : 1.5), 'w'), 'g');
    const tick = big ? 12 : 4; for (let t = 0; t < tick; t++) { const a = t * Math.PI * 2 / tick; c.p(cx - 0.5 + Math.cos(a) * (r - (big ? 5 : 3)), cy - 0.5 + Math.sin(a) * (r - (big ? 5 : 3)), t % 3 ? 'g' : 'k'); }
    c.l(Math.floor(cx), Math.floor(cy), Math.floor(cx), Math.floor(cy - r * (big ? 0.6 : 0.55)), 'k'); c.l(Math.floor(cx), Math.floor(cy), Math.floor(cx + r * 0.42), Math.floor(cy + r * 0.12), 'k');
    if (big) c.l(Math.floor(cx), Math.floor(cy), Math.floor(cx - r * 0.35), Math.floor(cy + r * 0.5), 'r');
  };
  I('clock', c => clockFace(c, 16, 16, 14, true), c => clockFace(c, 8, 8, 7.5));
  I('datetime', c => { D.calendar[32](c); clockFace(c, 22, 22, 9, true); }, c => { D.calendar[16](c); clockFace(c, 11, 11, 5); });
  I('devmgr', c => { D.computer[32](c); c.L(L => L.r(16, 17, 14, 12, '1'), 'k', 'V', 'G'); for (let x = 18; x < 29; x += 3) { c.p(x, 16, 's'); c.p(x, 29, 's'); } c.r(19, 20, 8, 6, 'K'); c.h(19, 20, 8, 'g'); text(c, 20, 21, 'J', 'y'); }, c => { D.computer[16](c); c.L(L => L.r(8, 8, 7, 7, '1'), 'k', 'V'); c.r(10, 10, 3, 3, 'K'); });
  I('taskmgr', c => { win32(c, 2, 3, 28, 25, 'w'); for (let j = 0; j < 5; j++) { c.r(5, 9 + j * 3, 2, 2, ['B', 'y', 'r', '1', 'g'][j]); c.h(9, 10 + j * 3, 12 - (j * 5) % 7, 'g'); } c.r(4, 15, 24, 3, 'n'); c.r(5, 15, 2, 2, 'y'); c.h(9, 16, 13, 'w'); c.bv(19, 23, 9, 4, 's'); c.h(21, 25, 5, 'k'); }, c => { win16(c, 1, 1, 14, 13, 'w'); c.h(3, 5, 8, 'g'); c.r(2, 7, 12, 2, 'n'); c.h(3, 7, 8, 'w'); c.h(3, 10, 6, 'g'); });
  I('sysmon', c => { win32(c, 2, 3, 28, 25, 'k'); for (let x = 4; x < 28; x += 4) c.v(x, 9, 17, 't'); for (let y = 10; y < 26; y += 4) c.h(4, y, 24, 't'); c.pl([[4, 22], [7, 20], [10, 21], [13, 14], [16, 17], [19, 11], [22, 15], [25, 12], [27, 13]], 'l'); c.pl([[4, 24], [9, 23], [14, 24], [19, 21], [27, 22]], 'y'); }, c => { win16(c, 1, 1, 14, 13, 'k'); c.pl([[2, 11], [4, 9], [6, 10], [8, 5], [10, 7], [13, 4]], 'l'); });
  I('defrag', c => {
    c.L(L => L.r(2, 3, 28, 20, 's'), 'k', 'w', 'g');
    const cols = 'BBBrBBwBBBrrBwBBBBrBBBBwwBrBBBBBBrwwBBBwBBBrBBBBBBwBBB';
    for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) { const k = cols[(i * 7 + j * 5) % cols.length]; c.b(4 + i * 4, 5 + j * 4, 4, 4, k === 'B' ? 'b' : k === 'r' ? 'r' : 'w', 'k'); if (k !== 'w') c.p(5 + i * 4, 6 + j * 4, k === 'B' ? 'B' : 'R'); }
    D.hdd[32] && (() => { const L = ctx(32); D.hdd[32](L); for (let y = 10; y < 26; y++) for (let x = 0; x < 32; x++) { const k = L.get(x, y); if (k) c.p(x, y + 6, k); } })();
  }, c => { c.b(0, 0, 16, 10, 's'); for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) c.r(1 + i * 4 - (i ? 0 : 0), 1 + j * 4, 3, 3, (i + j * 2) % 3 === 1 ? 'r' : 'b'); c.L(L => L.r(1, 11, 14, 4, 'c'), 'k', 'w', 'C'); c.h(3, 13, 6, 'k'); c.p(12, 13, 'l'); });
  I('scandisk', c => { D.hdd[32](c); magnifier(c, 20, 10, 7.5, 29, 26); c.p(20, 10, 'B'); c.l(15, 10, 18, 13, 'G'); c.l(18, 13, 24, 7, 'G'); }, c => { D.hdd[16](c); magnifier(c, 10, 5, 4.2, 15, 12); });
  const cube = (c, x, y, s, top, left, right) => { const h = s >> 1; c.L(L => { L.poly([[x, y + h], [x + s, y], [x + 2 * s, y + h], [x + s, y + s]], top); }, 'k'); c.L(L => L.poly([[x, y + h], [x + s, y + s], [x + s, y + 2 * s], [x, y + s + h]], left), 'k'); c.L(L => L.poly([[x + s, y + s], [x + 2 * s, y + h], [x + 2 * s, y + s + h], [x + s, y + 2 * s]], right), 'k'); };
  I('regedit', c => {
    c.pl([[8, 18], [8, 26], [16, 26]], 'g'); c.pl([[8, 15], [16, 15]], 'g');
    cube(c, 2, 1, 6, 'i', 'B', 'b'); cube(c, 16, 10, 4, 'i', 'B', 'b'); cube(c, 16, 21, 4, 'i', 'B', 'b');
  }, c => { c.pl([[4, 7], [4, 13], [8, 13]], 'g'); c.pl([[4, 10], [8, 10]], 'g'); cube(c, 0, 0, 4, 'i', 'B', 'b'); cube(c, 8, 7, 3, 'i', 'B', 'b'); cube(c, 8, 11, 2, 'i', 'B', 'b'); });
  I('helpbook', c => {
    c.L(L => L.poly([[6, 4], [27, 2], [27, 26], [6, 29]], 'p'), 'k', 'P', 'p'); c.L(L => L.poly([[6, 29], [27, 26], [27, 28], [7, 31]], 'w'), 'k'); c.h(8, 30, 18, 's');
    c.r(4, 4, 3, 26, '9'); c.v(4, 4, 26, 'k');
    c.s(12, 8, ['..yyyy..', '.yy..yy.', '.....yy.', '....yy..', '...yy...', '...yy...', '........', '...yy...', '...yy...']); c.h(10, 20, 13, 'y');
  }, c => { c.L(L => L.poly([[3, 2], [14, 1], [14, 13], [3, 14]], 'p'), 'k', 'P'); c.r(2, 2, 2, 13, '9'); c.s(7, 4, ['yyy.', '..y.', '.y..', '....', '.y..']); c.h(4, 15, 9, 'w'); });
  I('themes', c => {
    const sc = mon(c, 2, 1, 26, 20, 'i'); c.r(sc.x, sc.y + 9, sc.w, sc.h - 9, '1'); c.poly([[sc.x, sc.y + 11], [sc.x + 7, sc.y + 6], [sc.x + 13, sc.y + 11]], 'G'); c.L(L => L.e(sc.x + 15, sc.y + 4, 2.5, 2.5, 'y'), 'O');
    c.L(L => L.e(25, 24, 6, 5, 'z'), 'k', null, 'Z'); c.r(22, 22, 2, 2, 'r'); c.r(25, 21, 2, 2, 'b'); c.r(28, 23, 2, 2, '1'); c.r(24, 26, 2, 2, 'y');
  }, c => { const sc = mon(c, 0, 0, 13, 10, 'i'); c.r(sc.x, sc.y + 3, sc.w, 3, '1'); c.p(sc.x + 6, sc.y + 1, 'y'); c.L(L => L.e(12.5, 12, 3.5, 3, 'z'), 'k'); c.p(11, 11, 'r'); c.p(13, 11, 'b'); c.p(12, 13, '1'); });
  I('welcome', c => { const sc = mon(c, 2, 1, 26, 20, 'n'); c.r(sc.x, sc.y, sc.w, sc.h, 'n'); c.r(sc.x, sc.y + sc.h - 3, sc.w, 3, 'B'); isoCube(c, 15, 4.5, 1.8, LOGO_FACES); c.p([[23, 5, 'y'], [22, 6, 'y'], [24, 6, 'y'], [23, 7, 'y'], [23, 6, 'w']]); }, c => { const sc = mon(c, 0, 0, 15, 12, 'n'); c.s(sc.x + 3, sc.y + 1, ['.ww.', 'rw22', 'rr22', '.r2.']); c.p(sc.x + sc.w - 2, sc.y + 1, 'y'); });
  const joy = (c, big) => { if (big) { c.L(L => L.poly([[3, 22], [29, 22], [31, 29], [1, 29]], 's'), 'k', 'w', 'g'); c.L(L => L.e(16, 22.5, 6, 2.2, 'K'), 'k'); c.L(L => L.r(15, 7, 3, 15, 'K'), 'k', 'g'); c.L(L => L.e(16.5, 6.5, 5, 5, 'r'), 'k', 'R', 'm'); c.p(14, 4, 'w'); c.L(L => L.e(25, 24.5, 2, 1.5, 'r'), 'k'); c.L(L => L.e(6, 24.5, 2, 1.5, 'y'), 'k'); } else { c.L(L => L.poly([[1, 11], [15, 11], [16, 15], [0, 15]], 's'), 'k', 'w'); c.L(L => L.r(7, 4, 2, 7, 'K'), 'k'); c.L(L => L.e(8, 3.5, 3, 3, 'r'), 'k', 'R'); c.r(12, 12, 2, 1, 'r'); } };
  I('joystick', c => joy(c, true), c => joy(c));
  I('sound', c => { speaker(c, 3, 8, true); c.pl([[23, 6], [26, 10], [26, 20], [23, 24]], 'k'); c.pl([[27, 3], [30, 9], [30, 21], [27, 27]], 'k'); c.l(3, 12, 3, 17, 'w'); }, c => { speaker(c, 1, 4); c.pl([[11, 3], [13, 6], [13, 10], [11, 13]], 'k'); });
  I('mouse', c => {
    c.pl([[16, 1], [12, 4], [20, 8], [16, 11]], 'k'); c.pl([[17, 1], [13, 4], [21, 8], [17, 11]], 'g');
    c.L(L => { L.e(16, 21, 9, 10, 's'); L.r(7, 13, 18, 8, 's'); }, 'k', 'w', 'g'); c.v(16, 12, 8, 'k'); c.h(7, 19, 18, 'k'); c.r(11, 15, 3, 2, 'w'); c.r(13, 14, 2, 4, 'S');
  }, c => { c.l(8, 0, 8, 3, 'k'); c.L(L => L.e(8, 10, 5, 5.5, 's'), 'k', 'w', 'g'); c.v(8, 5, 4, 'k'); c.h(3, 8, 10, 'k'); });
  I('keyboard', c => { c.L(L => L.poly([[3, 12], [29, 12], [31, 26], [1, 26]], 'c'), 'k', 'w', 'C'); for (let j = 14; j < 24; j += 3) for (let i = 4 - (j - 14) / 3 + ((j / 3) % 2); i < 28 + (j - 14) / 3; i += 3) { c.r(Math.floor(i), j, 2, 2, 'S'); c.h(Math.floor(i), j + 1, 2, 'q'); } c.r(9, 23, 14, 2, 'S'); c.h(9, 24, 14, 'q'); c.pl([[16, 12], [16, 8], [22, 4], [28, 4]], 'k'); c.r(27, 15, 1, 1, 'l'); }, c => kbd(c, 0, 4, 16, 9));
  I('display', c => { const sc = mon(c, 2, 1, 28, 21, 't'); win16(c, sc.x + 5, sc.y + 3, 12, 9, 'w'); c.r(sc.x + 1, sc.y + 2, 2, 2, 'y'); c.r(sc.x + 1, sc.y + 6, 2, 2, 'S'); c.r(sc.x, sc.y + sc.h - 2, sc.w, 1, 's'); c.r(sc.x, sc.y + sc.h - 2, 3, 1, '1'); }, c => { const sc = mon(c, 0, 0, 15, 12, 't'); c.b(sc.x + 3, sc.y + 1, 6, 5, 'w'); c.h(sc.x + 4, sc.y + 2, 4, 'n'); });
  I('modem', c => { c.L(L => L.r(2, 13, 28, 10, 'c'), 'k', 'w', 'C'); c.L(L => L.poly([[2, 13], [5, 10], [27, 10], [30, 13]], 'S'), 'k'); ['l', 'l', 'g', 'r', 'l', 'y', 'g'].forEach((k, i) => c.r(5 + i * 3, 18, 2, 2, k)); c.h(5, 15, 22, 'C'); c.pl([[25, 23], [25, 27], [29, 30], [31, 30]], 'K'); c.r(23, 18, 4, 2, 'C'); }, c => { c.L(L => L.r(0, 6, 16, 6, 'c'), 'k', 'w', 'C'); ['l', 'r', 'l', 'y', 'l'].forEach((k, i) => c.p(2 + i * 2, 9, k)); c.h(1, 5, 14, 'S'); c.h(1, 4, 14, 'k'); c.p(0, 5, 'k'); c.p(15, 5, 'k'); c.pl([[13, 12], [13, 14], [15, 15]], 'K'); });
  I('fonts', c => { folder32(c); c.s(9, 13, ['....kk....', '...kwwk...', '...kwwk...', '..kwwwwk..', '..kwkkwk..', '.kwwwwwwk.', '.kwkkkkwk.', 'kwwk..kwwk', 'kkkk..kkkk']); c.s(19, 17, ['..BB.', '.B..B', '.....', '.BBBB', 'B...B', '.BBBB'].map(r => r.replace(/B/g, 'b'))); }, c => { folder16(c); c.s(3, 7, ['..k..', '.kwk.', '.kkk.', 'kw.wk']); c.s(9, 8, ['.bb', 'b.b', '.bb']); });
  I('scanner', c => {
    c.L(L => L.poly([[3, 9], [26, 4], [28, 6], [5, 12]], 's'), 'k', 'w', 'g');
    c.L(L => L.r(2, 14, 28, 12, 'S'), 'k', 'w', 'g'); c.L(L => L.poly([[2, 14], [5, 11], [29, 11], [30, 14]], 'g'), 'k'); c.r(6, 12, 22, 1, 'a'); c.h(6, 12, 22, 'i');
    c.r(4, 22, 3, 2, 'l'); c.h(9, 22, 10, 'g');
    c.L(L => L.r(17, 17, 13, 9, 'K'), 'k', 'g'); c.L(L => L.r(20, 15, 4, 2, 'K'), 'k'); c.L(L => L.e(23.5, 21.5, 3.2, 3.2, 'g'), 'k'); c.L(L => L.e(23.5, 21.5, 1.6, 1.6, 'n'), 'k'); c.p(23, 21, 'i'); c.r(27, 18, 2, 1, 'y');
  }, c => { c.L(L => L.r(0, 7, 13, 6, 'S'), 'k', 'w'); c.l(1, 6, 12, 4, 'g'); c.h(1, 5, 11, 'k'); c.L(L => L.r(8, 8, 8, 6, 'K'), 'k'); c.L(L => L.e(12, 11, 2, 2, 'g'), 'k'); c.p(12, 11, 'n'); });
  I('screensaver', c => { const sc = mon(c, 2, 1, 28, 22, 'k'); c.r(sc.x, sc.y, sc.w, sc.h, 'k'); [[3, 3, 'w'], [9, 7, 's'], [16, 2, 'w'], [19, 10, 'y'], [5, 12, 's'], [13, 13, 'w'], [20, 5, 'g'], [11, 4, 'g']].forEach(([x, y, k]) => c.p(sc.x + x, sc.y + y, k)); c.p([[sc.x + 11, sc.y + 8], [sc.x + 10, sc.y + 9], [sc.x + 12, sc.y + 9], [sc.x + 11, sc.y + 10]], 'w'); c.L(L => L.e(sc.x + 17, sc.y + 12, 1.6, 1.6, 'a'), null); }, c => { const sc = mon(c, 0, 0, 15, 12, 'k'); c.r(sc.x, sc.y, sc.w, sc.h, 'k'); c.p(sc.x + 2, sc.y + 1, 'w'); c.p(sc.x + 7, sc.y + 3, 'y'); c.p(sc.x + 4, sc.y + 5, 'w'); c.p(sc.x + 9, sc.y + 1, 's'); });
  // a proper Rubik's cube, three faces, stickers on a black body
  function rubik(c, x, y, s, g, cols) { // isometric, s = sticker size, g = gap shrink factor
    const P = (u, v) => [x + 3 * s + (u - v) * s, y + (u + v) * s / 2];
    const dn = (q, d) => [q[0], q[1] + d * s];
    const st = (q, k) => { const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4; c.poly(q.map(([px, py]) => [cx + (px - cx) * (1 - g), cy + (py - cy) * (1 - g)]), k); };
    c.L(L => L.poly([P(0, 0), P(3, 0), dn(P(3, 0), 3), dn(P(3, 3), 3), dn(P(0, 3), 3), P(0, 3)], 'k'), 'k');
    const [T, Lf, R] = cols || [['w', 'w', '4', 'w', 'w', 'w', 'r', 'w', 'w'], ['r', 'r', '1', 'r', 'r', 'r', 'r', '2', 'r'], ['2', '2', '2', '3', '2', '2', '2', '2', 'w']];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      st([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], T[j * 3 + i]);
      st([dn(P(i, 3), j), dn(P(i + 1, 3), j), dn(P(i + 1, 3), j + 1), dn(P(i, 3), j + 1)], Lf[j * 3 + i]);
      st([dn(P(3, 3 - i), j), dn(P(3, 2 - i), j), dn(P(3, 2 - i), j + 1), dn(P(3, 3 - i), j + 1)], R[j * 3 + i]);
    }
  }
  I('cube', c => rubik(c, 1.5, 1, 4.6, 0.22), c => rubik(c, 0.5, 0.5, 2.4, 0.12));
  const blk = (c, x, y, k, hi, lo, sz) => { c.r(x, y, sz, sz, k); c.h(x, y, sz, hi); c.v(x, y, sz, hi); c.h(x, y + sz - 1, sz, lo); c.v(x + sz - 1, y, sz, lo); };
  I('blocks', c => {
    const B = (cells, k, hi, lo) => cells.forEach(([x, y]) => blk(c, 2 + x * 7, 3 + y * 7, k, hi, lo, 7));
    B([[0, 3], [1, 3], [2, 3], [1, 2]], 'p', 'P', '9'); B([[3, 3], [3, 2], [2, 2], [2, 1]], 'r', 'R', 'm'); B([[0, 2], [0, 1], [0, 0], [1, 1]], '3', 'y', 'e');
  }, c => { const B = (cells, k, hi, lo) => cells.forEach(([x, y]) => blk(c, x * 4, y * 4, k, hi, lo, 4)); B([[0, 3], [1, 3], [2, 3], [1, 2]], 'p', 'P', '9'); B([[3, 3], [3, 2], [2, 2], [2, 1]], 'r', 'R', 'm'); B([[0, 2], [0, 1], [0, 0], [1, 1]], '3', 'y', 'e'); });
  I('ork', c => {
    c.L(L => { L.e(16, 12, 12, 10.5, 'T'); L.r(8, 18, 16, 6, 'T'); L.poly([[5, 20], [27, 20], [25, 29], [7, 29]], 'T'); }, 'k', 'Y', 'E');
    c.poly([[6, 11], [14, 13], [14, 17], [7, 16]], 'k'); c.poly([[26, 11], [18, 13], [18, 17], [25, 16]], 'k'); c.r(9, 13, 3, 2, 'r'); c.r(20, 13, 3, 2, 'r'); c.p(10, 13, 'y'); c.p(21, 13, 'y');
    c.l(5, 9, 14, 12, 'k'); c.l(27, 9, 18, 12, 'k'); c.l(5, 8, 13, 11, 'k'); c.l(27, 8, 19, 11, 'k');
    c.poly([[14.5, 18], [17.5, 18], [16, 21]], 'k');
    c.h(8, 23, 16, 'k'); c.r(8, 24, 16, 4, 'k'); for (let x = 9; x < 23; x += 3) c.r(x, 25, 2, 3, 'w');
    c.L(L => { L.poly([[8, 25], [11, 25], [8, 17]], 'w'); L.poly([[21, 25], [24, 25], [24, 17]], 'w'); }, 'k'); c.h(9, 28, 14, 'k');
    c.p([[10, 4], [11, 3], [12, 3], [8, 6]], 'w');
  }, c => {
    c.L(L => { L.e(8, 6, 6.5, 5.5, 'T'); L.r(3, 9, 10, 5, 'T'); }, 'k', 'Y', 'E'); c.r(3, 5, 4, 3, 'k'); c.r(9, 5, 4, 3, 'k'); c.p(4, 6, 'r'); c.p(11, 6, 'r'); c.p(8, 9, 'k');
    c.r(4, 11, 8, 3, 'k'); c.p(5, 12, 'w'); c.p(7, 12, 'w'); c.p(9, 12, 'w'); c.p(4, 10, 'w'); c.p(11, 10, 'w'); c.p(4, 9, 'w'); c.p(11, 9, 'w');
  });
  // ---- a few extra shell bits
  I('user', c => { c.L(L => L.e(16, 10, 6.5, 7, 'z'), 'k', null, 'Z'); c.r(11, 4, 11, 3, 'e'); c.p(10, 7, 'e'); c.p(22, 7, 'e'); c.r(13, 10, 2, 2, 'k'); c.r(18, 10, 2, 2, 'k'); c.h(14, 14, 4, 'm'); c.L(L => { L.e(16, 29, 12, 9, 'B'); }, 'k', 'i', 'n'); c.x(0, 31, 32, 1); c.h(4, 30, 24, 'k'); c.L(L => L.poly([[13, 20], [19, 20], [16, 24]], 'w'), null); }, c => { c.L(L => L.e(8, 5, 3.5, 4, 'z'), 'k'); c.h(6, 2, 4, 'e'); c.p(7, 5, 'k'); c.p(9, 5, 'k'); c.L(L => L.e(8, 15, 6.5, 5, 'B'), 'k', 'i'); c.x(0, 15, 16, 1); c.h(2, 15, 12, 'k'); });
  I('update', c => { globe(c, 15, 15, 13); c.L(L => { L.poly([[16, 12], [28, 12], [22, 20]], 'l'); L.r(19, 4, 6, 8, 'l'); }, 'k', 'V', 'G'); }, c => { globe(c, 7.5, 7.5, 6.5); c.L(L => { L.poly([[8, 7], [15, 7], [11.5, 11]], 'l'); L.r(10, 2, 3, 5, 'l'); }, 'k'); });
  I('key', c => key(c, 4, 10, true), c => key(c, 2, 5));
  I('programs', c => { folder32(c); win16(c, 13, 14, 15, 12, 'w'); c.r(15, 19, 4, 3, 's'); c.h(20, 19, 6, 'g'); c.h(20, 21, 5, 'g'); }, c => { folder16(c); c.b(7, 7, 8, 7, 'w'); c.h(8, 8, 6, 'n'); c.p(9, 10, 'g'); c.p(11, 10, 'g'); });
  I('favorites', c => { folder32(c); c.L(L => L.poly([[18, 11], [20.5, 17], [27, 17], [22, 21], [24, 28], [18, 24], [12, 28], [14, 21], [9, 17], [15.5, 17]], 'y'), 'o', 'Y', 'O'); }, c => { folder16(c); c.L(L => L.poly([[10, 5], [11.5, 8], [15, 8], [12.5, 10.5], [13.5, 14], [10, 12], [6.5, 14], [7.5, 10.5], [5, 8], [8.5, 8]], 'y'), 'o'); });
  I('desktop', c => { const sc = mon(c, 2, 1, 28, 21, 't'); c.r(sc.x + 2, sc.y + 2, 2, 2, 'w'); c.r(sc.x + 2, sc.y + 6, 2, 2, 'y'); c.r(sc.x, sc.y + sc.h - 2, sc.w, 1, 's'); }, c => { const sc = mon(c, 0, 0, 15, 12, 't'); c.p(sc.x + 1, sc.y + 1, 'w'); c.p(sc.x + 1, sc.y + 3, 'y'); c.h(sc.x, sc.y + sc.h - 2, sc.w, 's'); });


  // ================================================================ phase 3: more system/program icons
  const bulb = (c, big) => { if (big) { c.L(L => { L.e(16, 11, 8.5, 8.5, 'y'); L.r(12, 17, 8, 5, 'y'); }, 'k', 'Y', 'O'); c.p([[12, 6], [11, 7], [11, 8], [13, 5]], 'w'); c.pl([[13, 17], [15, 12], [17, 14], [19, 12], [19, 17]], 'O');
    c.L(L => L.r(12, 22, 8, 6, 's'), 'k', 'w', 'g'); c.h(12, 24, 8, 'g'); c.h(12, 26, 8, 'g'); c.L(L => L.r(14, 28, 4, 2, 'K'), 'k'); [[4, 3], [27, 3], [2, 12], [29, 12]].forEach(([x, y]) => c.p(x, y, 'y')); c.l(5, 4, 7, 6, 'y'); c.l(26, 4, 24, 6, 'y'); }
    else { c.L(L => { L.e(8, 5.5, 4.5, 4.5, 'y'); L.r(6, 9, 4, 2, 'y'); }, 'k', 'Y'); c.p(6, 3, 'w'); c.L(L => L.r(6, 11, 4, 3, 's'), 'k'); c.h(6, 12, 4, 'g'); } };
  I('tip', c => bulb(c, true), c => bulb(c));
  I('access', c => { c.L(L => L.e(16, 16, 14, 14, 'b'), 'n', 'B', 'n'); c.L(L => { L.e(16, 7.5, 2.6, 2.6, 'w'); L.r(7, 11, 18, 3, 'w'); L.r(14, 13, 4, 7, 'w'); L.poly([[14, 19], [18, 19], [13, 28], [10, 27]], 'w'); L.poly([[14, 19], [18, 19], [22, 27], [19, 28]], 'w'); }, null); },
    c => { c.L(L => L.e(8, 8, 7, 7, 'b'), 'n', 'B'); c.p(8, 3, 'w'); c.p(7, 3, 'w'); c.h(4, 6, 8, 'w'); c.v(7, 6, 4, 'w'); c.v(8, 6, 4, 'w'); c.p([[6, 10], [5, 11], [5, 12], [9, 10], [10, 11], [10, 12]], 'w'); });
  I('channels', c => { c.L(L => L.poly([[3, 5], [12, 4], [22, 14], [23, 23], [13, 22], [4, 13]], 's'), 'k', 'w', 'g'); c.l(9, 16, 18, 8, 'g'); c.l(13, 18, 22, 10, 'K'); c.l(13, 14, 22, 5, 'k'); c.L(L => L.e(23.5, 5, 2.4, 2.4, 'r'), 'k', 'R'); c.L(L => { L.r(13, 23, 4, 4, 'g'); L.r(8, 27, 14, 3, 's'); }, 'k', 'w', 'K'); [[26, 10], [28, 12], [27, 15]].forEach(([x, y]) => c.p(x, y, 'y')); },
    c => { c.L(L => L.poly([[1, 3], [6, 2], [11, 7], [11, 12], [6, 11], [2, 7]], 's'), 'k', 'w'); c.l(6, 7, 10, 3, 'k'); c.r(11, 1, 3, 3, 'r'); c.L(L => L.r(4, 13, 8, 2, 's'), 'k'); });
  I('icw', c => { const sc = mon(c, 1, 3, 22, 18, 't'); c.r(sc.x + 1, sc.y + 1, 4, 1, 'a'); globe(c, 23, 21, 7.5); c.L(L => L.poly([[22, 1], [30, 1], [30, 8], [27, 6], [22, 11], [20, 9], [25, 4], [22, 1]], 'l'), 'k', 'V', 'G'); },
    c => { mon(c, 0, 1, 11, 9, 't'); globe(c, 11.5, 10.5, 4.3); });
  const handset = (c, x, y, big, col) => { col = col || 'r'; if (big) c.L(L => { L.poly([[x, y + 5], [x + 4, y], [x + 8, y + 3], [x + 6, y + 6], [x + 12, y + 12], [x + 15, y + 10], [x + 18, y + 14], [x + 13, y + 18], [x, y + 8]], col); }, 'k', col === 'r' ? 'R' : 'g', col === 'r' ? 'm' : 'K');
    else c.L(L => L.poly([[x, y + 2], [x + 2, y], [x + 4, y + 2], [x + 3, y + 3], [x + 5, y + 5], [x + 6, y + 4], [x + 8, y + 6], [x + 6, y + 8], [x, y + 3]], col), 'k', col === 'r' ? 'R' : null); };
  I('phone', c => { c.L(L => { L.poly([[4, 18], [9, 12], [23, 12], [28, 18], [28, 28], [4, 28]], 'c'); }, 'k', 'w', 'C'); for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) c.bv(9 + i * 5, 16 + j * 4, 4, 3, 'S'); c.L(L => { L.r(3, 6, 26, 5, 'K'); L.r(3, 4, 6, 4, 'K'); L.r(23, 4, 6, 4, 'K'); }, 'k', 'g'); c.r(5, 26, 22, 1, 'C'); },
    c => { c.L(L => L.poly([[2, 9], [4, 6], [12, 6], [14, 9], [14, 14], [2, 14]], 'c'), 'k', 'w', 'C'); c.p([[5, 9], [8, 9], [11, 9], [5, 11], [8, 11], [11, 11]], 'g'); c.L(L => { L.r(1, 2, 14, 3, 'K'); L.r(1, 1, 3, 2, 'K'); L.r(12, 1, 3, 2, 'K'); }, 'k'); });
  I('popup', c => { D.mail[32](c); c.L(L => L.poly([[21, 2], [30, 2], [30, 11], [21, 11]], 'y'), 'k', 'Y', 'O'); c.x(22, 3, 1, 1); c.r(25, 3, 2, 5, 'k'); c.r(25, 9, 2, 1, 'k'); c.r(23, 3, 7, 0, 'y'); }, c => { D.mail[16](c); c.L(L => L.r(10, 0, 5, 6, 'y'), 'k'); c.v(12, 1, 3, 'k'); c.p(12, 5, 'k'); });
  I('mic', c => { c.L(L => { L.e(16, 7, 5, 5, 'g'); L.r(11, 7, 10, 10, 'g'); L.e(16, 16, 5, 4, 'g'); }, 'k', 's', 'K'); for (let y = 4; y < 18; y += 2) c.h(13, y, 6, 'K'); c.pl([[8, 13], [8, 17], [11, 21], [21, 21], [24, 17], [24, 13]], 'k'); c.L(L => { L.r(15, 22, 2, 5, 'K'); L.r(9, 27, 14, 3, 'K'); }, 'k', 'g'); },
    c => { c.L(L => L.r(6, 1, 4, 8, 'g'), 'k', 's'); c.pl([[4, 6], [4, 9], [6, 11], [10, 11], [12, 9], [12, 6]], 'k'); c.v(8, 11, 3, 'k'); c.h(5, 14, 7, 'k'); });
  const box3d = (c, x, y, s, top, left, right) => { // an isometric cardboard box, s = half width
    c.L(L => L.poly([[x, y + s / 2], [x + s, y], [x + 2 * s, y + s / 2], [x + s, y + s]], top), 'k'); c.L(L => L.poly([[x, y + s / 2], [x + s, y + s], [x + s, y + 2 * s], [x, y + 1.5 * s]], left), 'k'); c.L(L => L.poly([[x + s, y + s], [x + 2 * s, y + s / 2], [x + 2 * s, y + 1.5 * s], [x + s, y + 2 * s]], right), 'k'); };
  I('package', c => { box3d(c, 2, 4, 13, 'T', 'E', 'e'); c.l(9, 7, 21, 13, 'e'); c.l(10, 7, 22, 13, 'h'); c.p([[15, 4], [16, 4]], 'Y'); c.L(L => L.r(18, 18, 8, 3, 'w'), 'g'); },
    c => { box3d(c, 1, 2, 6.5, 'T', 'E', 'e'); c.l(4, 4, 10, 7, 'h'); });
  I('backup', c => { c.L(L => L.r(2, 16, 28, 11, 'c'), 'k', 'w', 'C'); c.r(6, 21, 12, 2, 'k'); c.r(22, 20, 4, 2, 'l'); [[4, 2, '2'], [11, 5, 'r'], [18, 8, 'G']].forEach(([x, y, k]) => { c.L(L => L.r(x, y, 11, 11, k === '2' ? 'n' : k === 'r' ? 'm' : 'G'), 'k'); c.r(x + 2, y, 6, 4, 's'); c.r(x + 5, y + 1, 2, 2, 'k'); c.r(x + 2, y + 6, 7, 5, 'w'); }); c.L(L => L.poly([[26, 6], [30, 10], [27, 10], [27, 15], [25, 15], [25, 10], [22, 10]], 'l'), 'k'); },
    c => { c.L(L => L.r(0, 9, 16, 6, 'c'), 'k', 'w'); c.r(2, 12, 6, 1, 'k'); c.L(L => L.r(2, 1, 7, 7, 'n'), 'k'); c.r(3, 1, 4, 2, 's'); c.r(3, 5, 5, 3, 'w'); c.L(L => L.r(8, 3, 6, 6, 'm'), 'k'); c.r(9, 6, 4, 2, 'w'); });
  I('charmap', c => { c.L(L => L.r(2, 3, 28, 25, 'w'), 'k', null, 'S'); for (let i = 1; i < 4; i++) c.v(2 + i * 7, 4, 23, 's'); for (let j = 1; j < 4; j++) c.h(3, 3 + j * 6, 26, 's');
    text(c, 4, 5, 'A', 'k'); text(c, 11, 5, 'Z', 'k'); text(c, 18, 5, '?', 'k'); text(c, 25, 5, '!', 'k'); text(c, 4, 11, '1', 'k'); text(c, 11, 11, '$', 'k'); text(c, 4, 17, '%', 'k'); text(c, 4, 23, '+', 'k');
    c.L(L => L.r(13, 12, 17, 18, 'w'), 'k', null, 's'); c.s(16, 14, ['....kk....', '....kk....', '...kkkk...', '...k.kk...', '..kk..kk..', '..kk..kk..', '.kkkkkkkk.', '.kk....kk.', 'kk......kk', 'kkk....kkk'], { k: 'n' }); c.h(15, 26, 13, 'g'); },
    c => { c.b(0, 1, 16, 14, 'w'); c.v(5, 2, 12, 's'); c.v(10, 2, 12, 's'); c.h(1, 7, 14, 's'); text(c, 1, 2, 'A', 'k'); text(c, 6, 2, 'Z', 'k'); text(c, 11, 2, '?', 'k'); text(c, 1, 9, '1', 'k'); c.b(6, 6, 10, 10, 'w'); c.s(8, 8, ['..k..', '.k.k.', '.kkk.', 'k...k', 'k...k'], { k: 'n' }); });
  I('clipboard', c => { c.L(L => L.r(5, 4, 22, 27, 'E'), 'k', 'T', 'e'); c.L(L => L.r(8, 8, 16, 20, 'w'), 'k'); lines(c, 10, 12, 12, 6, 'g', 2); c.L(L => L.r(11, 2, 10, 5, 's'), 'k', 'w', 'g'); c.r(14, 1, 4, 2, 's'); c.h(14, 0, 4, 'k'); c.p([[13, 1], [18, 1]], 'k'); },
    c => { c.L(L => L.r(2, 2, 12, 14, 'E'), 'k', 'T'); c.b(4, 4, 8, 10, 'w'); c.h(5, 7, 6, 'g'); c.h(5, 9, 6, 'g'); c.h(5, 11, 4, 'g'); c.L(L => L.r(5, 1, 6, 2, 's'), 'k'); });
  I('cleanup', c => { D.hdd[32](c); c.l(30, 0, 18, 18, 'e'); c.l(29, 0, 17, 18, 'E'); c.l(31, 1, 19, 19, 'k'); c.L(L => L.poly([[14, 16], [20, 18], [17, 24], [9, 25]], 'y'), 'k', 'Y', 'O'); for (let i = 0; i < 4; i++) c.l(11 + i * 2, 24, 13 + i * 2, 19, 'o'); },
    c => { D.hdd[16](c); c.l(15, 0, 9, 7, 'e'); c.L(L => L.poly([[7, 6], [11, 7], [9, 11], [5, 11]], 'y'), 'k'); });
  I('tuneup', c => { D.computer[32](c); c.L(L => { L.poly([[16, 21], [26, 11], [28, 13], [18, 23]], 's'); L.e(27.5, 9.5, 3.5, 3.5, 's'); }, 'k', 'w', 'g'); c.r(27, 7, 2, 3, '_'); c.p([[27, 6], [28, 6], [29, 7], [26, 7]], 'k'); c.L(L => L.e(18.5, 22.5, 2, 2, 's'), 'k'); },
    c => { D.computer[16](c); c.l(8, 14, 14, 8, 'k'); c.l(9, 14, 15, 8, 's'); c.r(13, 6, 3, 3, 's'); c.p(14, 6, '_'); });
  I('rsrc', c => { c.L(L => L.r(4, 2, 24, 28, 's'), 'k', 'w', 'g'); [[7, 10, '1'], [14, 6, 'y'], [21, 16, 'r']].forEach(([x, h, k]) => { c.sk(x, 5, 5, 21, 'k'); c.r(x + 1, 25 - h, 3, h, k); c.h(x + 1, 25 - h, 3, k === '1' ? 'V' : k === 'y' ? 'Y' : 'R'); }); c.h(6, 28, 20, 'g'); },
    c => { c.L(L => L.r(1, 0, 14, 16, 's'), 'k', 'w'); c.r(3, 2, 2, 12, 'k'); c.r(7, 2, 2, 12, 'k'); c.r(11, 2, 2, 12, 'k'); c.r(3, 6, 2, 8, '1'); c.r(7, 9, 2, 5, 'y'); c.r(11, 4, 2, 10, 'r'); });
  I('sched', c => { folder32(c); clockFace(c, 21, 20, 8, true); }, c => { folder16(c); clockFace(c, 10.5, 10, 4.5); });
  I('dialup', c => { folder32(c); c.L(L => L.r(9, 16, 17, 8, 'c'), 'k', 'w', 'C'); ['l', 'l', 'r', 'l'].forEach((k, i) => c.p(12 + i * 3, 21, k)); c.pl([[25, 24], [25, 27], [29, 27]], 'K'); handset(c, 2, 11, false); }, c => { folder16(c); c.L(L => L.r(5, 8, 9, 4, 'c'), 'k', 'w'); c.p(7, 10, 'l'); c.p(9, 10, 'r'); c.p(11, 10, 'l'); });
  I('online', c => { folder32(c); globe(c, 20, 20, 7); }, c => { folder16(c); globe(c, 10, 10, 3.6); });
  I('sysinfo', c => { D.computer[32](c); c.L(L => L.e(24, 23, 6.5, 6.5, 'b'), 'n', 'B'); c.r(23, 19, 2, 2, 'w'); c.r(23, 22, 2, 5, 'w'); c.h(22, 22, 2, 'w'); c.h(22, 26, 4, 'w'); }, c => { D.computer[16](c); c.L(L => L.e(11.5, 11.5, 3.6, 3.6, 'b'), 'n'); c.p(11, 9, 'w'); c.v(11, 11, 3, 'w'); });
  I('y2k', c => { clockFace(c, 16, 13, 12, true); c.L(L => L.r(3, 21, 26, 9, 'r'), 'k', 'R', 'm'); text(c, 10, 23, 'Y2K', 'w'); c.p([[9, 23], [9, 24], [9, 25], [9, 26], [9, 27]], 'r'); }, c => { clockFace(c, 7.5, 7.5, 7); c.L(L => L.r(9, 9, 6, 6, 'r'), 'k', 'R'); c.v(11, 10, 2, 'w'); c.v(12, 10, 2, 'w'); c.p(11, 13, 'w'); c.p(12, 13, 'w'); });
  I('picture', c => { c.L(L => L.r(2, 4, 28, 24, 'E'), 'k', 'T', '6'); c.sk(5, 7, 22, 18, 'i'); c.poly([[6, 24], [13, 13], [18, 20], [21, 17], [26, 24]], '1'); c.pl([[6, 24], [13, 13], [18, 20]], 'G'); c.L(L => L.e(21, 11.5, 2.5, 2.5, 'y'), 'O'); c.r(6, 23, 20, 1, 'G'); },
    c => { c.L(L => L.r(0, 2, 16, 12, 'E'), 'k', 'T'); c.r(2, 4, 12, 8, 'i'); c.poly([[2, 12], [6, 6], [9, 10], [11, 8], [14, 12]], '1'); c.r(10, 5, 2, 2, 'y'); });
  I('edit', c => { win32(c, 2, 3, 28, 25, 'b'); c.r(4, 8, 24, 2, 's'); c.p([[5, 8], [6, 8], [10, 8], [11, 8], [15, 8], [16, 8]], 'k'); c.h(5, 13, 18, 's'); c.h(5, 15, 14, 's'); c.h(5, 17, 20, 's'); c.h(5, 19, 9, 's'); c.r(14, 19, 2, 1, 'y'); c.r(4, 24, 24, 2, 'a'); c.p([[6, 24], [12, 24]], 'k'); },
    c => { win16(c, 1, 1, 14, 13, 'b'); c.h(2, 3, 12, 's'); c.h(3, 6, 8, 's'); c.h(3, 8, 6, 's'); c.h(3, 10, 9, 's'); c.p(9, 8, 'y'); c.h(2, 12, 12, 'a'); });
  I('oldpc', c => { c.L(L => L.r(3, 22, 26, 8, 'c'), 'k', 'w', 'C'); c.h(16, 25, 10, 'k'); c.h(16, 27, 10, 'k'); c.r(6, 26, 3, 2, 'r'); const sc = mon(c, 5, 1, 22, 17, 'S'); c.r(sc.x, sc.y, sc.w, 2, 'n'); c.r(sc.x + 2, sc.y + 4, 3, 3, 'y'); c.r(sc.x + 7, sc.y + 4, 3, 3, 'r'); c.r(sc.x + 12, sc.y + 4, 3, 3, 'l'); c.h(sc.x + 1, sc.y + 8, 14, 'g'); },
    c => { c.L(L => L.r(1, 12, 14, 4, 'c'), 'k', 'w'); c.h(8, 13, 5, 'k'); const sc = mon(c, 2, 0, 12, 9, 'S'); c.h(sc.x, sc.y, sc.w, 'n'); c.p(sc.x + 1, sc.y + 2, 'y'); c.p(sc.x + 3, sc.y + 2, 'r'); c.p(sc.x + 5, sc.y + 2, 'l'); });


  // control panel extras + help
  const chipCard = (c, x, y, w, h) => { c.L(L => L.r(x, y, w, h, '1'), 'k', 'V', 'G'); for (let i = x + 2; i < x + w - 1; i += 2) c.p(i, y + h, 'y'); c.L(L => L.r(x + 3, y + 2, 6, 5, 'K'), 'k'); c.r(x + w - 6, y + 3, 3, 2, 's'); };
  I('addhw', c => { D.computer[32](c); chipCard(c, 15, 16, 15, 9); c.L(L => { L.r(4, 22, 9, 3, 'l'); L.r(7, 19, 3, 9, 'l'); }, 'k', 'V', 'G'); }, c => { D.computer[16](c); c.L(L => L.r(8, 9, 7, 5, '1'), 'k'); c.r(9, 10, 2, 2, 'K'); });
  I('addrem', c => { box3d(c, 1, 8, 12, 'T', 'E', 'e'); disc(c, 22, 10, 8.5); }, c => { box3d(c, 0, 5, 6, 'T', 'E', 'e'); disc(c, 11, 5, 4.4); });
  I('multimedia', c => { disc(c, 20, 13, 10.5); speaker(c, 2, 11, true); }, c => { disc(c, 10, 6, 5.5); speaker(c, 0, 7); });
  I('power', c => { c.L(L => { L.r(3, 9, 22, 14, 's'); L.r(25, 13, 3, 6, 's'); }, 'k', 'w', 'g'); c.r(6, 12, 9, 8, 'l'); c.h(6, 12, 9, 'V'); c.r(15, 12, 7, 8, 'K'); c.L(L => L.poly([[17, 3], [12, 16], [16, 16], [13, 29], [21, 13], [17, 13], [21, 3]], 'y'), 'k', 'Y', 'O'); },
    c => { c.L(L => { L.r(1, 4, 12, 8, 's'); L.r(13, 6, 2, 4, 's'); }, 'k', 'w'); c.r(3, 6, 5, 4, 'l'); c.L(L => L.poly([[9, 1], [6, 8], [8, 8], [6, 15], [11, 6], [9, 6], [11, 1]], 'y'), 'k'); });
  I('regional', c => { globe(c, 13, 14, 11.5); c.L(L => L.r(18, 18, 13, 11, 'w'), 'k'); c.r(19, 19, 11, 9, 'n'); c.l(19, 19, 29, 27, 'w'); c.l(29, 19, 19, 27, 'w'); c.r(19, 22, 11, 3, 'w'); c.r(23, 19, 3, 9, 'w'); c.h(19, 23, 11, 'r'); c.v(24, 19, 9, 'r'); },
    c => { globe(c, 6.5, 7, 6); c.L(L => L.r(9, 9, 7, 6, 'n'), 'k'); c.h(9, 11, 7, 'r'); c.v(12, 9, 6, 'r'); });
  I('helptopic', c => { doc32(c); c.L(L => L.e(16, 18, 7, 7, 'y'), 'k', 'Y', 'O'); c.s(13, 13, ['.kkkk.', 'kk..kk', '....kk', '...kk.', '..kk..', '......', '..kk..']); },
    c => { doc16(c); c.s(5, 4, ['.nnn.', 'n...n', '...n.', '..n..', '.....', '..n..'], { n: 'n' }); });
  I('chip', c => { c.L(L => L.r(5, 7, 22, 18, 'K'), 'k', 'g', 'k'); for (let i = 7; i < 26; i += 3) { c.r(i, 3, 2, 4, 's'); c.r(i, 25, 2, 4, 's'); } c.r(9, 11, 14, 10, 'k'); c.p(7, 9, 's'); text(c, 11, 14, 'JK', 'g'); },
    c => { c.L(L => L.r(3, 4, 10, 8, 'K'), 'k'); for (let i = 4; i < 13; i += 2) { c.p(i, 2, 's'); c.p(i, 3, 's'); c.p(i, 12, 's'); c.p(i, 13, 's'); } c.p(4, 5, 's'); });

  // ---- games pack
  const card = (c, x, y, w, h, fill) => c.L(L => L.r(x, y, w, h, fill || 'w'), 'k', null, 'S');
  I('hearts', c => { card(c, 3, 3, 16, 22); c.s(5, 5, ['k.', 'kk']); c.s(7, 10, PIP.heart); card(c, 13, 7, 16, 22); c.s(15, 9, ['r.', 'rr']); c.s(17, 15, PIP.heart); c.s(25, 25, ['.r', 'rr'].map(r => r)); },
    c => { c.b(1, 1, 9, 12, 'w'); c.b(6, 3, 9, 12, 'w'); c.s(8, 6, ['.r.r.', 'rrrrr', '.rrr.', '..r..']); c.p(2, 2, 'k'); });
  I('spider', c => { card(c, 2, 2, 14, 19); card(c, 8, 5, 14, 19); card(c, 14, 8, 15, 21); c.s(4, 4, ['k', 'k']); c.s(10, 7, ['k', 'k']);
    c.L(L => { L.e(21.5, 17, 3, 3.5, 'K'); L.e(21.5, 22.5, 3.5, 4, 'K'); }, 'k', 'g'); c.pl([[18, 15], [15, 12]], 'k'); c.pl([[25, 15], [28, 12]], 'k'); c.pl([[18, 19], [14, 19]], 'k'); c.pl([[25, 19], [29, 19]], 'k'); c.pl([[18, 23], [15, 26]], 'k'); c.pl([[25, 23], [28, 26]], 'k'); c.p(20, 16, 'r'); c.p(23, 16, 'r'); },
    c => { c.b(1, 1, 8, 11, 'w'); c.b(6, 4, 9, 11, 'w'); c.r(9, 8, 3, 5, 'k'); c.p([[8, 7], [12, 7], [8, 10], [12, 10], [8, 13], [12, 13]], 'k'); c.p(10, 8, 'r'); });
  const jig = (c, x, y, s, k, hi, lo) => { c.L(L => { L.r(x, y, s, s, k); L.e(x + s + 1, y + s / 2, s * 0.22, s * 0.22, k); L.e(x + s / 2, y + s + 1, s * 0.22, s * 0.22, k); }, 'k', hi, lo); };
  I('jigsaw', c => {
    // four interlocking pieces on a 2x2 grid of 13px cells; tabs are round knobs, blanks are the matching holes; the last piece is lifted out
    const S = 13, O = 2, cell = (i, j) => [O + i * S, O + j * S];
    const E = [[0, 0, 1, 0, 1], [0, 0, 0, 1, -1], [1, 0, 1, 1, 1], [0, 1, 1, 1, -1]]; // edges: a(i,j) -> b(i,j), sign +1 = knob from a into b
    const piece = (pi, pj, dx, dy, k, hi, lo) => c.L(L => {
      const [x, y] = cell(pi, pj); L.r(x + dx, y + dy, S, S, k);
      for (const [ai, aj, bi, bj, sg] of E) {
        const mine = ai === pi && aj === pj ? 1 : bi === pi && bj === pj ? -1 : 0; if (!mine) continue;
        const [ax, ay] = cell(ai, aj), cx = (bi > ai ? ax + S : ax + S / 2) + dx, cy = (bj > aj ? ay + S : ay + S / 2) + dy;
        if (sg * mine > 0) L.e(cx, cy, 2.7, 2.7, k); else L.e(cx, cy, 2.7, 2.7, '_');
      }
    }, 'k', hi, lo);
    piece(0, 0, 0, 0, 'b', 'B', 'n'); piece(1, 0, 0, 0, 'r', 'R', 'm'); piece(0, 1, 0, 0, '1', 'V', 'G');
    piece(1, 1, 2, 2, 'y', 'Y', 'O');
    c.p([[5, 5, 'i'], [18, 5, 'w'], [5, 18, 'V']]);
  }, c => {
    c.L(L => { L.r(1, 1, 7, 7, 'b'); L.e(8, 4.5, 1.6, 1.6, 'b'); }, 'k', 'B'); c.L(L => { L.r(8, 1, 7, 7, 'r'); L.e(8, 4.5, 1.6, 1.6, '_'); L.e(11.5, 8, 1.6, 1.6, 'r'); }, 'k', 'R');
    c.L(L => { L.r(1, 8, 7, 7, '1'); L.e(4.5, 8, 1.6, 1.6, '1'); }, 'k', 'V'); c.L(L => { L.r(9, 9, 7, 7, 'y'); L.e(12.5, 9, 1.6, 1.6, '_'); }, 'k', 'Y');
  });
  I('pipe', c => { c.L(L => L.r(1, 1, 30, 30, 'g'), 'k'); for (let i = 1; i < 30; i += 10) { c.h(1, i, 30, 'K'); c.v(i, 1, 30, 'K'); } c.L(L => { L.r(4, 14, 16, 5, 's'); L.r(15, 4, 5, 15, 's'); L.r(15, 4, 13, 5, 's'); }, 'k', 'w', 'K'); c.r(5, 15, 10, 3, 'l'); c.r(16, 5, 3, 13, 'l'); c.h(5, 15, 10, 'V'); c.L(L => L.e(6, 26, 3.5, 3.5, 'y'), 'k'); },
    c => { c.b(0, 0, 16, 16, 'g'); c.L(L => { L.r(1, 7, 9, 3, 's'); L.r(7, 2, 3, 8, 's'); L.r(7, 2, 8, 3, 's'); }, 'k'); c.h(2, 8, 6, 'l'); c.v(8, 3, 6, 'l'); });
  I('slider', c => { c.L(L => L.r(2, 2, 28, 28, 'g'), 'k', 'K', 'w'); for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { if (i === 2 && j === 2) continue; c.bv(4 + i * 8, 4 + j * 8, 8, 8, 'S'); text(c, 7 + i * 8, 6 + j * 8, String(1 + i + j * 3), 'n'); } },
    c => { c.b(0, 0, 16, 16, 'g'); for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { if (i === 2 && j === 2) continue; c.b(1 + i * 5, 1 + j * 5, 5, 5, 'S'); c.p(3 + i * 5, 3 + j * 5, 'n'); } });
  I('ski', c => { c.L(L => L.r(1, 1, 30, 30, 'w'), 'i'); c.L(L => L.poly([[6, 2], [11, 12], [1, 12]], '1'), 'G'); c.r(5, 12, 2, 2, 'e'); c.L(L => L.poly([[26, 14], [31, 24], [21, 24]], '1'), 'G'); c.r(25, 24, 2, 2, 'e');
    c.L(L => { L.e(16, 9, 3, 3, 'z'); L.r(14, 12, 5, 6, 'r'); L.r(13, 17, 3, 4, 'b'); L.r(17, 17, 3, 4, 'b'); }, 'k', null, null); c.L(L => { L.e(16, 7.5, 3.2, 2.2, '2'); L.r(13, 7, 7, 1, '2'); }, null); c.p(16, 4, 'w'); c.p(15, 10, 'k'); c.p(17, 10, 'k'); c.h(14, 13, 5, 'y'); c.l(8, 23, 22, 18, 'k'); c.l(9, 25, 23, 20, 'k'); c.pl([[12, 13], [9, 22]], 'K'); c.pl([[20, 13], [24, 21]], 'K'); c.p([[4, 27], [7, 29], [12, 28]], 'i'); },
    c => { c.b(0, 0, 16, 16, 'w'); c.poly([[3, 1], [6, 6], [0, 6]], '1'); c.L(L => { L.r(7, 3, 3, 3, 'z'); L.r(7, 6, 3, 4, 'r'); }, 'k'); c.h(7, 3, 3, '2'); c.l(3, 13, 13, 10, 'k'); c.l(4, 14, 14, 11, 'k'); });
  I('podracer', c => { c.L(L => L.r(1, 1, 30, 30, 'T'), 'E'); c.r(2, 22, 28, 8, 'E'); c.L(L => { L.r(3, 9, 12, 5, 's'); L.r(3, 17, 12, 5, 's'); L.poly([[15, 10], [18, 11.5], [15, 13]], 's'); L.poly([[15, 18], [18, 19.5], [15, 21]], 's'); }, 'k', 'w', 'g'); c.r(1, 10, 2, 3, 'O'); c.r(1, 18, 2, 3, 'O'); c.p([[0, 11, 'y'], [0, 19, 'y']]);
    c.pl([[16, 12], [22, 15]], 'K'); c.pl([[16, 20], [22, 16]], 'K'); c.L(L => { L.r(21, 13, 8, 5, '3'); L.poly([[29, 14], [31, 15.5], [29, 17]], '3'); }, 'k', 'y', 'm'); c.L(L => L.e(24.5, 13, 2, 1.6, 'i'), 'k'); c.p(24, 12, 'w'); },
    c => { c.b(0, 0, 16, 16, 'T'); c.L(L => { L.r(1, 4, 6, 3, 's'); L.r(1, 9, 6, 3, 's'); }, 'k'); c.l(7, 5, 10, 7, 'K'); c.l(7, 10, 10, 8, 'K'); c.L(L => L.r(10, 6, 5, 3, '3'), 'k'); c.p(11, 6, 'i'); });
  I('stamp', c => { c.L(L => { L.e(16, 6, 5, 5, 'r'); L.r(13, 9, 6, 8, 'm'); }, 'k', 'R', 'm'); c.L(L => L.r(6, 16, 20, 6, 'e'), 'k', 'E', '6'); c.L(L => L.r(5, 22, 22, 3, 'K'), 'k'); c.r(4, 27, 24, 4, 'w'); c.b(4, 26, 24, 5, null, 'k'); c.r(5, 27, 22, 3, 'w'); c.r(8, 28, 16, 1, 'r'); },
    c => { c.L(L => { L.e(8, 3, 2.5, 2.5, 'r'); L.r(7, 5, 2, 4, 'm'); }, 'k'); c.L(L => L.r(3, 9, 10, 3, 'e'), 'k', 'E'); c.r(2, 13, 12, 2, 'w'); c.h(4, 13, 8, 'r'); });


  I('bookOpen', c => { c.L(L => { L.poly([[2, 8], [15, 10], [15, 28], [2, 26]], 'w'); L.poly([[17, 10], [30, 8], [30, 26], [17, 28]], 'w'); }, 'k', null, 'S'); c.r(15, 10, 2, 19, 'p'); c.pl([[2, 27], [15, 29], [17, 29], [30, 27]], 'p'); c.pl([[1, 9], [1, 28], [15, 30], [17, 30], [31, 28], [31, 9]], 'p');
    for (let j = 0; j < 6; j++) { c.l(4, 12 + j * 2 + 1, 13, 14 + j * 2, 'g'); c.l(19, 14 + j * 2, 28, 12 + j * 2 + 1, 'g'); } },
    c => { c.L(L => { L.poly([[1, 4], [7, 5], [7, 14], [1, 13]], 'w'); L.poly([[9, 5], [15, 4], [15, 13], [9, 14]], 'w'); }, 'k'); c.r(7, 5, 2, 10, 'p'); c.p([[2, 7], [3, 7], [5, 8], [2, 9], [4, 10], [10, 8], [12, 7], [10, 10], [13, 9]], 'g'); });


  // ================================================================ toolbar buttons (24x24, no drop shadow): JICON.get('tb-back', 24)
  const T = (name, fn) => I(name, null, null, { 24: fn, ns: true });
  const roundBtn = (c, k, hi, lo, o) => c.L(L => L.e(11.5, 11.5, 10, 10, k), o, hi, lo);
  const arrowL = [[5, 11.5], [11.5, 5], [11.5, 9], [18, 9], [18, 14], [11.5, 14], [11.5, 18]];
  T('tb-back', c => { roundBtn(c, '#2a9a2a', '#7ad870', '#146014', '#063806'); c.L(L => L.poly(arrowL, 'w'), null, null, '#c0e8c0'); c.p(6, 6, '#c8f0c0'); c.p(7, 5, '#c8f0c0'); });
  T('tb-fwd', c => { roundBtn(c, '#2a9a2a', '#7ad870', '#146014', '#063806'); c.L(L => L.poly(arrowL.map(([x, y]) => [23 - x, y]), 'w'), null, null, '#c0e8c0'); c.p(6, 6, '#c8f0c0'); c.p(7, 5, '#c8f0c0'); });
  T('tb-up', c => { c.L(L => { L.r(1, 9, 21, 13, 'U'); L.r(2, 7, 7, 2, 'U'); }, ['h', 'k'], 'u'); c.L(L => L.r(1, 11, 22, 11, 'u'), ['h', 'k'], 'Y', 'U'); c.L(L => L.poly([[12, 1], [18, 7], [14, 7], [14, 18], [10, 18], [10, 7], [6, 7]], 'k'), null); });
  T('tb-props', c => { c.L(L => L.r(3, 2, 18, 20, 'w'), 'k', null, 'S'); c.r(4, 3, 16, 3, 'n'); c.p(18, 4, 's'); [8, 12, 16].forEach(y => { c.b(5, y, 3, 3, 'w'); c.h(10, y + 1, 8, 'g'); }); c.p(6, 9, 'k'); c.p(6, 13, 'k'); });
  T('tb-views', c => { [[2, 2], [12, 2]].forEach(([x, y]) => { c.L(L => L.r(x, y, 8, 7, 'u'), 'k', 'Y', 'U'); }); [13, 16, 19].forEach(y => { c.r(2, y, 2, 2, 'n'); c.h(6, y, 15, 'n'); c.h(6, y + 1, 11, 'n'); }); });
  T('tb-del', c => { c.L(L => { for (let i = 0; i < 14; i++) { L.r(4 + i, 4 + i, 3, 3, 'r'); L.r(17 - i, 4 + i, 3, 3, 'r'); } }, 'm', 'R'); });
  T('tb-restore', c => { page(c, 3, 1, 18, 22, 4); c.L(L => { L.e(13, 14, 6, 6, '#2a9a2a'); L.e(13, 14, 3.4, 3.4, '_'); L.r(13, 7, 7, 7, '_'); }, '#063806'); c.L(L => L.poly([[13, 5], [18, 9.5], [13, 13]], '#2a9a2a'), '#063806'); });
  T('tb-empty', c => { c.L(L => L.poly([[5, 7], [19, 7], [17, 22], [7, 22]], 's'), 'k', 'S', 'g'); c.v(9, 8, 13, 'g'); c.v(12, 8, 13, 'K'); c.v(15, 8, 13, 'g'); c.L(L => L.r(4, 4, 16, 3, 's'), 'k', 'w'); c.r(9, 2, 6, 2, 's'); c.h(9, 1, 6, 'k'); });
  T('tb-stop', c => { page(c, 2, 1, 18, 22, 4); c.L(L => L.e(13, 14, 7.5, 7.5, 'r'), 'm', 'R', 'm'); for (let i = 0; i < 7; i++) { c.p(10 + i, 11 + i, 'w'); c.p(16 - i, 11 + i, 'w'); c.p(10 + i + 1, 11 + i, 'w'); c.p(16 - i - 1, 11 + i, 'w'); } });
  T('tb-refresh', c => { page(c, 2, 1, 18, 22, 4); c.L(L => { L.e(12, 13, 7, 7, '#2a9a2a'); L.e(12, 13, 4, 4, '_'); L.r(12, 5, 8, 8, '_'); }, '#063806', '#7ad870'); c.L(L => L.poly([[11, 4], [17, 8.5], [11, 12]], '#2a9a2a'), '#063806'); });
  T('tb-home', c => { c.L(L => L.poly([[11.5, 2], [22, 11], [1, 11]], 'r'), 'm', 'R', 'm'); c.L(L => L.r(16, 3, 3, 5, 'e'), 'k'); c.L(L => L.r(4, 11, 15, 11, 'u'), 'k', 'Y', 'U'); c.L(L => L.r(9, 14, 5, 8, 'e'), 'k', 'E'); c.p(12, 18, 'y'); c.b(5, 13, 3, 3, 'i'); c.b(15, 13, 3, 3, 'i'); });
  T('tb-search', c => { globe(c, 9, 9, 7.5); c.L(L => { L.e(15.5, 15.5, 4.5, 4.5, '#cfe8ff'); }, 'k'); c.L(L => L.poly([[18, 20], [20, 18], [23, 21], [21, 23]], 'K'), 'k'); c.p(14, 14, 'w'); });
  T('tb-favs', c => { c.L(L => { L.r(1, 7, 21, 14, 'U'); L.r(2, 5, 7, 2, 'U'); }, ['h', 'k'], 'u'); c.L(L => L.r(1, 9, 22, 12, 'u'), ['h', 'k'], 'Y', 'U'); c.L(L => L.poly([[13, 5], [15, 11], [21, 11], [16, 15], [18, 21], [13, 17], [8, 21], [10, 15], [5, 11], [11, 11]], 'y'), 'o', 'Y', 'O'); });
  T('tb-hist', c => { clockFace(c, 12.5, 12.5, 10, true); c.L(L => L.poly([[1, 6], [7, 6], [4, 10]], '#2a9a2a'), '#063806'); });
  T('tb-mail', c => { c.L(L => L.r(1, 6, 21, 14, 'w'), 'k', null, 'S'); c.pl([[2, 7], [11, 14], [20, 7]], 'g'); c.pl([[2, 18], [8, 12]], 's'); c.pl([[20, 18], [14, 12]], 's'); c.L(L => L.r(15, 1, 7, 7, 'r'), 'm', 'R'); c.p(18, 4, 'y'); });
  T('tb-print', c => { c.L(L => L.r(6, 1, 12, 8, 'w'), 'k'); c.h(8, 4, 8, 'g'); c.L(L => L.r(1, 8, 22, 9, 's'), 'k', 'w', 'g'); c.r(4, 11, 2, 1, 'l'); c.L(L => L.r(5, 15, 14, 7, 'w'), 'k'); c.h(7, 18, 10, 'g'); c.h(7, 20, 7, 'g'); });
  T('tb-edit', c => { page(c, 2, 1, 16, 22, 4); lines(c, 4, 8, 9, 6, 'g', 2); c.L(L => L.poly([[20, 6], [23, 9], [12, 20], [9, 17]], 'y'), 'k', 'Y', 'O'); c.L(L => L.poly([[9, 17], [12, 20], [8, 21]], 'T'), 'k'); c.p(8, 21, 'k'); c.L(L => L.poly([[20, 6], [23, 9], [22, 10], [19, 7]], 'R'), 'k'); });
  T('tb-newmail', c => { D['tb-mail'][24](c); c.x(14, 0, 10, 9); c.p([[19, 0], [19, 1], [19, 2], [16, 3], [17, 3], [18, 3], [20, 3], [21, 3], [22, 3], [19, 4], [19, 5], [19, 6], [18, 2], [20, 2], [18, 4], [20, 4]], 'y'); c.p(19, 3, 'w'); });
  T('tb-reply', c => { c.L(L => L.r(5, 8, 18, 13, 'w'), 'k', null, 'S'); c.pl([[6, 9], [14, 15], [22, 9]], 'g'); c.L(L => L.poly([[0, 7], [6, 1], [6, 4], [12, 4], [12, 10], [6, 10], [6, 13]], 'B'), 'n', 'i'); });
  T('tb-forward', c => { c.L(L => L.r(1, 8, 18, 13, 'w'), 'k', null, 'S'); c.pl([[2, 9], [10, 15], [18, 9]], 'g'); c.L(L => L.poly([[23, 7], [17, 1], [17, 4], [11, 4], [11, 10], [17, 10], [17, 13]], '#2a9a2a'), '#063806', '#7ad870'); });
  T('tb-sendrecv', c => { c.L(L => L.r(3, 10, 18, 12, 'w'), 'k', null, 'S'); c.pl([[4, 11], [12, 17], [20, 11]], 'g'); c.L(L => L.poly([[7, 0], [12, 5], [9, 5], [9, 9], [5, 9], [5, 5], [2, 5]], 'r'), 'm', 'R'); c.L(L => L.poly([[17, 9], [22, 4], [19, 4], [19, 0], [15, 0], [15, 4], [12, 4]], '#2a9a2a'), '#063806', '#7ad870'); });
  T('tb-addr', c => { c.L(L => L.r(3, 1, 16, 21, 'n'), 'k', 'B', '9'); c.r(19, 3, 3, 4, 'r'); c.r(19, 8, 3, 4, 'y'); c.r(19, 13, 3, 4, '1'); c.L(L => L.r(6, 4, 10, 14, 'w'), 'k'); c.L(L => L.e(11, 8.5, 2.5, 2.5, 'z'), 'k'); c.L(L => L.poly([[7, 16], [8, 12], [14, 12], [15, 16]], 'B'), 'k'); });


  // tray icons (16 only)
  I('tray-spk', null, c => c.s(0, 2, ['......k.', '.....kk.', '....kwk.', 'kkkkwsk.', 'kwwkssk.', 'kwskssk.', 'kwskssk.', 'kwskssk.', 'kggkgsk.', 'kkkkkgk.', '.....kk.', '......k.']), { ns: true });
  I('tray-net', null, c => { c.s(0, 1, ['kkkkkkkk', 'kaaaaatk', 'kaaaattk', 'kattttgk', 'kkkkkkkk', '..kggk..', '.kkkkkk.']); c.s(7, 7, ['kkkkkkkk', 'kaaaaatk', 'kaaaattk', 'kattttgk', 'kkkkkkkk', '..kggk..', '.kkkkkk.']); }, { ns: true });


  I('entirenet', c => { globe(c, 16, 11, 10.5); mon(c, 0, 14, 14, 12, 't'); mon(c, 18, 14, 14, 12, 't'); c.pl([[7, 30], [7, 31], [25, 31], [25, 30]], 'k'); },
    c => { globe(c, 8, 6, 5.5); c.s(0, 9, ['kkkkkk', 'kaatk.', 'kattk.', 'kkkkk.', '.kkk..']); c.s(10, 9, ['kkkkkk', 'kaaatk', 'kaattk', 'kkkkkk', '.kkkk.']); c.h(3, 15, 10, 'k'); });


  // a key at any angle: bow centred on (bx, by), pointing along `ang`, size s
  function keyR(c, bx, by, ang, s, col) {
    const ca = Math.cos(ang), sa = Math.sin(ang), T = (u, v) => [bx + u * ca - v * sa, by + u * sa + v * ca];
    c.L(L => { L.e(bx, by, 4 * s, 4 * s, col || 'y'); L.poly([T(3 * s, -1.1 * s), T(15 * s, -1.1 * s), T(15 * s, 1.1 * s), T(3 * s, 1.1 * s)], col || 'y'); L.poly([T(10 * s, 1), T(11.6 * s, 1), T(11.6 * s, 3.4 * s), T(10 * s, 3.4 * s)], col || 'y'); L.poly([T(13 * s, 1), T(15 * s, 1), T(15 * s, 4 * s), T(13 * s, 4 * s)], col || 'y'); }, 'k', 'Y', 'o');
    c.L(L => L.e(bx, by, 1.6 * s, 1.6 * s, 'S'), 'k');
  }
  const silverKey = (c, x, y, big) => { const L = ctx(c.n); key(L, x, y, big); L.rep('y', 's'); L.rep('Y', 'w'); L.rep('o', 'g'); for (let i = 0; i < c.n * c.n; i++) if (L.a[i]) c.a[i] = L.a[i]; };
  I('keys', c => { key(c, 2, 3, true); silverKey(c, 8, 15, true); }, c => { key(c, 0, 2, false); silverKey(c, 4, 9, false); },
    { 48: c => { keyR(c, 9, 12, 0.18, 1.55, 'y'); keyR(c, 17, 30, -0.12, 1.55, 's'); } });

  // ================================================================ more programs (art pack 2): every Start menu / desktop program
  // gets proper 32 + 16 pixel art in the house style (light from top-left, dark outline, 98 palette)
  const rotP = (cx, cy, ang, pts) => { const ca = Math.cos(ang), sa = Math.sin(ang); return pts.map(([u, v]) => [cx + u * ca - v * sa, cy + u * sa + v * ca]); };
  // a kid's head and shoulders: centre x, head top y, hair colour, shirt colour (32 grid) / small variant
  function kid(c, cx, y, hair, shirt, skin) {
    skin = skin || 'z';
    c.L(L => { L.e(cx, y + 17, 7, 6, shirt); L.r(cx - 7, y + 17, 14, 32, shirt); }, 'k');
    c.L(L => L.e(cx, y + 6.5, 5, 5.5, skin), 'k', null, 'Z');
    c.L(L => { L.e(cx, y + 3.5, 5.2, 3.6, hair); L.r(cx - 5, y + 3, 2, 4, hair); }, null);
    c.p(cx - 2, y + 7, 'k'); c.p(cx + 1, y + 7, 'k'); c.h(cx - 2, y + 10, 4, 'm'); c.p(cx - 3, y + 9, 'm'); c.p(cx + 2, y + 9, 'm');
  }
  I('snowball', c => {
    for (const [x, y, w] of [[0, 13, 5], [1, 17, 4], [2, 21, 3], [17, 3, 3], [18, 6, 2]]) c.h(x, y, w, 'i');
    ball(c, 24.5, 7.5, 4.6, 'S', 'w', 'i', '9');
    ball(c, 16, 18, 10, 'S', 'w', 'i', '9');
    for (const [x, y, k] of [[12, 15, 'S'], [19, 13, 'w'], [9, 20, 'w'], [14, 22, 'w'], [21, 19, 'S'], [17, 25, 'S'], [23, 16, 'S'], [11, 24, 'i']]) c.p(x, y, k);
    for (const [x, y] of [[5, 6], [9, 2], [30, 15], [29, 25], [3, 27], [31, 1]]) { c.p(x, y, 'w'); c.p(x + 1, y, 'i'); }
  }, c => {
    c.h(0, 7, 3, 'i'); c.h(0, 10, 2, 'i'); ball(c, 9, 9, 6, 'S', 'w', 'i', '9'); c.p(14, 1, 'w'); c.p(2, 2, 'w');
  });
  I('hangout', c => {
    kid(c, 21, 9, 'h', 'B'); kid(c, 10, 11, 'e', 'r');
    c.L(L => { L.r(1, 1, 13, 7, 'w'); L.poly([[4, 8], [8, 8], [4, 11]], 'w'); }, 'k'); c.h(3, 4, 2, 'k'); c.h(6, 4, 2, 'k'); c.h(9, 4, 2, 'k');
    c.L(L => { L.r(20, 0, 11, 6, 'y'); L.poly([[26, 6], [29, 6], [29, 8]], 'y'); }, 'k'); c.p([[23, 2], [25, 2], [27, 2]], 'r'); c.h(22, 3, 7, 'r'); c.x(24, 3, 1, 1);
  }, c => {
    c.L(L => { L.e(11, 14, 4, 3, 'B'); L.e(11, 6, 3, 3.2, 'z'); }, 'k'); c.L(L => L.e(11, 4.5, 3, 1.8, 'h'), null); c.p(10, 6, 'k'); c.p(12, 6, 'k');
    c.L(L => { L.e(5, 15, 4, 3, 'r'); L.e(5, 8, 3, 3.2, 'z'); }, 'k'); c.L(L => L.e(5, 6.4, 3, 1.8, 'e'), null); c.p(4, 8, 'k'); c.p(6, 8, 'k'); c.h(4, 10, 3, 'm');
    c.L(L => L.r(0, 0, 7, 4, 'w'), 'k'); c.p([[1, 2], [3, 2], [5, 2]], 'k');
  });
  I('corkboard', c => {
    c.L(L => L.r(2, 4, 28, 24, 'E'), 'k', 'T', 'e'); c.r(4, 6, 24, 20, '#c8945a'); c.h(4, 6, 24, 'e'); c.v(4, 6, 20, 'e');
    for (let y = 7; y < 26; y++) for (let x = 5; x < 28; x++) if (((x * 7 + y * 13) % 11) === 0) c.p(x, y, '#a8743a'); else if (((x * 5 + y * 3) % 17) === 0) c.p(x, y, '#e0b078');
    c.L(L => L.r(6, 8, 9, 8, 'y'), 'k', 'Y', 'u'); c.h(7, 11, 6, 'g'); c.h(7, 13, 5, 'g');
    c.L(L => L.poly([[17, 9], [26, 8], [27, 17], [18, 18]], '7'), 'k', 'w'); c.h(19, 12, 6, 'f'); c.h(19, 14, 4, 'f');
    c.L(L => L.r(9, 17, 10, 7, 'i'), 'k', 'w', 'B'); c.h(10, 19, 7, 'n'); c.h(10, 21, 5, 'n');
    c.L(L => L.r(21, 19, 5, 6, 'w'), 'k'); c.r(22, 21, 3, 2, 'r');
    for (const [x, y, k] of [[10, 7, 'r'], [21, 7, '2'], [13, 16, '1'], [23, 18, 'r']]) { c.L(L => L.r(x, y, 2, 2, k), 'k'); c.p(x, y, 'w'); }
  }, c => {
    c.L(L => L.r(0, 2, 16, 13, 'E'), 'k', 'T', 'e'); c.r(2, 4, 12, 9, '#c8945a'); c.r(3, 5, 5, 4, 'y'); c.r(9, 4, 4, 5, '7'); c.r(5, 9, 5, 3, 'i'); c.p(5, 5, 'r'); c.p(11, 4, '2'); c.p(7, 9, 'r');
  });
  I('capsule', c => {
    c.L(L => L.e(14, 27, 14, 5, 'e'), 'k', 'E', 'h'); c.L(L => L.e(13, 27, 10, 3, 'h'), null); c.d(4, 29, 20, 1, 'e', 'h');
    const ang = -0.42, P = pts => rotP(14, 18, ang, pts);
    c.L(L => { L.poly(P([[-9, -5], [9, -5], [9, 5], [-9, 5]]), 's'); for (const ex of [-9, 9]) L.e(...rotP(14, 18, ang, [[ex, 0]])[0], 4.9, 4.9, 's'); }, 'k', 'w', 'g');
    for (const u of [-6, 6]) c.pl(P([[u, -5], [u, 5]]).map(q => q.map(Math.round)), 'K');
    c.L(L => L.poly(P([[-3.5, -3.5], [3.5, -3.5], [3.5, 3.5], [-3.5, 3.5]]), 'y'), 'k', 'Y', 'U'); c.p([[13, 18, 'm'], [14, 17, 'm'], [15, 17, 'm'], [13, 19, 'm']]);
    c.pl(P([[-8, -3], [8, -3]]).map(q => q.map(Math.round)), 'w');
    c.L(L => L.r(27, 2, 2, 18, 'E'), 'k', 'T'); c.L(L => L.r(25, 1, 6, 2, 'E'), 'k'); c.L(L => L.poly([[25, 20], [31, 20], [31, 26], [28, 29], [25, 26]], 's'), 'k', 'w', 'g');
    c.p([[3, 25, 'E'], [8, 23, 'E'], [20, 31, 'E'], [24, 24, 'E']]);
  }, c => {
    c.L(L => L.e(7, 13, 7, 3, 'e'), 'k', 'E'); c.L(L => { L.poly([[2, 9], [10, 5], [12, 9], [4, 13]], 's'); }, 'k', 'w', 'g'); c.L(L => L.r(6, 7, 3, 3, 'y'), null);
    c.v(13, 1, 9, 'E'); c.r(12, 9, 3, 4, 's'); c.p(12, 12, 'k');
  });
  I('parcel', c => {
    c.L(L => L.r(4, 15, 24, 15, 'r'), 'k', 'R', 'm'); c.L(L => L.r(2, 10, 28, 6, 'r'), 'k', 'R', 'm');
    for (let y = 17; y < 29; y += 4) for (let x = 6 + (y % 8 ? 2 : 0); x < 27; x += 5) c.p(x, y, 'w');
    c.r(14, 10, 5, 20, 'y'); c.v(14, 10, 20, 'Y'); c.v(18, 10, 20, 'O'); c.h(2, 15, 28, 'k'); c.h(14, 15, 5, 'o');
    c.L(L => { L.poly([[16, 10], [8, 3], [6, 8], [10, 10]], 'y'); L.poly([[17, 10], [25, 3], [27, 8], [23, 10]], 'y'); }, 'o', 'Y', 'O');
    c.p([[9, 6, 'O'], [10, 7, 'O'], [23, 6, 'O'], [22, 7, 'O']]); c.L(L => L.r(14, 7, 5, 4, 'y'), 'o', 'Y', 'O');
  }, c => {
    c.L(L => L.r(2, 7, 12, 8, 'r'), 'k', 'R', 'm'); c.L(L => L.r(1, 5, 14, 3, 'r'), 'k', 'R'); c.r(7, 5, 2, 10, 'y'); c.L(L => { L.poly([[8, 5], [3, 1], [3, 4]], 'y'); L.poly([[8, 5], [13, 1], [13, 4]], 'y'); }, 'o');
  });
  I('bottle', c => {
    const ang = -Math.PI / 4.6;
    c.L(L => { L.poly(rotP(15, 17, ang, [[-12, -4.5], [3, -4.5], [6, -2], [10, -2], [10, 2], [6, 2], [3, 4.5], [-12, 4.5]]), 'V'); }, 'd', 'w', 'v');
    c.L(L => L.poly(rotP(15, 17, ang, [[10, -2], [14, -2], [14, 2], [10, 2]]), 'E'), 'h', 'T');
    c.L(L => L.poly(rotP(15, 17, ang, [[-9, -2.5], [1, -2.5], [1, 2.5], [-9, 2.5]]), 'Y'), 'e'); c.pl(rotP(15, 17, ang, [[-7, 0], [-1, 0]]).map(p => p.map(Math.round)), 'E');
    for (let x = 0; x < 32; x++) { const y = 24 + Math.round(Math.sin(x / 2.6) * 1.2); c.r(x, y, 1, 32 - y, '2'); c.p(x, y, 'i'); if ((x + 1) % 6 === 0) c.p(x, y - 1, 'w'); }
    for (let x = 0; x < 32; x++) { const y = 28 + Math.round(Math.sin(x / 2.6 + 2) * 1); c.p(x, y, 'B'); c.r(x, y + 1, 1, 3, 'n'); }
  }, c => {
    const ang = -Math.PI / 4.6;
    c.L(L => L.poly(rotP(7.5, 8, ang, [[-6, -2.5], [2, -2.5], [3, -1], [6, -1], [6, 1], [3, 1], [2, 2.5], [-6, 2.5]]), 'V'), 'd', 'w'); c.p(13, 2, 'E'); c.p(12, 2, 'E');
    c.L(L => L.poly(rotP(7.5, 8, ang, [[-4, -1], [0, -1], [0, 1], [-4, 1]]), 'Y'), null);
    for (let x = 0; x < 16; x++) { const y = 12 + (x % 5 < 2 ? 0 : 1); c.r(x, y, 1, 16 - y, '2'); c.p(x, y, 'i'); }
  });
  I('irc', c => {
    c.L(L => { L.r(10, 1, 21, 15, 'a'); L.poly([[25, 16], [29, 16], [29, 20]], 'a'); }, 'k', 'w', 't');
    c.h(13, 5, 14, 't'); c.h(13, 8, 11, 't'); c.h(13, 11, 13, 't');
    c.L(L => { L.r(1, 9, 20, 15, 'y'); L.poly([[4, 24], [9, 24], [4, 29]], 'y'); }, 'k', 'Y', 'U');
    c.s(5, 11, ['..k.k..', '.kkkkkk', '..k.k..', '..k.k..', '.kkkkkk', '..k.k..', '..k.k..'].map(r => r.slice(0, 7))); c.h(14, 13, 4, 'k'); c.h(14, 16, 4, 'k'); c.h(14, 19, 3, 'k');
  }, c => {
    c.L(L => L.r(5, 0, 11, 8, 'a'), 'k', 'w', 't'); c.h(7, 3, 6, 't');
    c.L(L => { L.r(0, 5, 11, 8, 'y'); L.poly([[2, 13], [5, 13], [2, 15]], 'y'); }, 'k', 'Y'); c.s(2, 6, ['.k.k', 'kkkk', '.k.k', 'kkkk', '.k.k']); c.h(7, 8, 2, 'k');
  });
  I('getsoft', c => {
    c.L(L => L.poly([[3, 15], [16, 20], [16, 31], [3, 26]], 'E'), 'k', 'T', 'e'); c.L(L => L.poly([[16, 20], [29, 15], [29, 26], [16, 31]], 'e'), 'k', null, 'h');
    c.L(L => L.poly([[3, 15], [16, 10], [29, 15], [16, 20]], 'h'), 'k');
    c.L(L => L.poly([[3, 15], [0, 11], [13, 6], [16, 10]], 'T'), 'k', 'w', 'E'); c.L(L => L.poly([[29, 15], [32, 11], [19, 6], [16, 10]], 'E'), 'k', 'T', 'e');
    c.r(6, 21, 6, 2, 'w'); c.h(6, 23, 4, 'C');
    globe(c, 23, 6, 5.5);
    c.L(L => L.poly([[12, 0], [17, 0], [17, 6], [20, 6], [14.5, 13], [9, 6], [12, 6]], 'l'), 'D', 'V', 'G');
  }, c => {
    c.L(L => L.poly([[1, 8], [8, 11], [8, 16], [1, 13]], 'E'), 'k', 'T'); c.L(L => L.poly([[8, 11], [15, 8], [15, 13], [8, 16]], 'e'), 'k'); c.L(L => L.poly([[1, 8], [8, 5], [15, 8], [8, 11]], 'h'), 'k');
    globe(c, 12, 3.5, 3.3); c.L(L => L.poly([[6, 0], [9, 0], [9, 3], [11, 3], [7.5, 8], [4, 3], [6, 3]], 'l'), 'D');
  });
  I('town', c => {
    c.L(L => L.poly([[16, 13], [31, 21], [16, 29], [1, 21]], 'v'), null); c.L(L => { L.poly([[1, 21], [16, 29], [16, 32], [1, 24]], 'e'); }, null); c.L(L => L.poly([[16, 29], [31, 21], [31, 24], [16, 32]], 'h'), null);
    c.pl([[1, 21], [16, 13], [31, 21], [31, 24], [16, 32], [1, 24], [1, 21]], 'k'); c.pl([[2, 21], [16, 28], [30, 21]], 'd'); c.pl([[2, 20], [16, 13]], 'V');
    c.pl([[8, 21], [16, 25], [25, 20]], 's'); c.pl([[9, 21], [17, 25]], 'g');
    // big house
    c.L(L => { L.poly([[8, 12], [14, 15], [14, 22], [8, 19]], 'c'); L.poly([[14, 15], [19, 12], [19, 19], [14, 22]], 'C'); }, 'k');
    c.L(L => { L.poly([[5, 11], [11, 4], [17, 7], [14, 15], [8, 12]], 'r'); L.poly([[17, 7], [21, 11], [19, 12], [14, 15]], 'm'); }, 'k'); c.pl([[11, 4], [17, 7]], 'R'); c.pl([[6, 11], [11, 5]], 'R');
    c.r(10, 15, 2, 3, 'n'); c.r(16, 16, 2, 4, 'e'); c.v(12, 2, 3, 'g'); c.r(12, 1, 2, 2, 'K');
    // little house + tree
    c.L(L => { L.poly([[20, 16], [24, 18], [24, 22], [20, 20]], 'c'); L.poly([[24, 18], [27, 16], [27, 20], [24, 22]], 'C'); L.poly([[19, 16], [22, 12], [25, 14], [24, 18]], '2'); L.poly([[25, 14], [28, 16], [24, 18]], 'n'); }, 'k'); c.r(21, 18, 1, 2, 'y');
    c.L(L => L.e(26.5, 9, 3.5, 4, 'v'), 'D', 'V', 'd'); c.v(26, 13, 3, 'e'); c.p(26, 15, 'h');
  }, c => {
    c.L(L => L.poly([[8, 7], [16, 11.5], [8, 16], [0, 11.5]], 'v'), 'D'); c.r(0, 12, 1, 1, 'e');
    c.L(L => { L.r(3, 7, 7, 5, 'c'); }, 'k'); c.L(L => L.poly([[2, 7], [6.5, 2], [11, 7]], 'r'), 'k'); c.r(5, 9, 2, 3, 'e'); c.L(L => L.e(13, 6, 2.5, 3, 'v'), 'D'); c.v(13, 8, 3, 'e');
  });
  I('chest', c => {
    c.L(L => { L.r(3, 14, 26, 15, 'e'); }, 'k', 'E', 'h'); c.L(L => { L.r(3, 7, 26, 8, 'e'); L.e(16, 8, 13, 4, 'e'); }, 'k', 'E', 'h');
    c.r(4, 14, 24, 1, 'k'); for (const y of [19, 24]) c.h(5, y, 22, 'h'); c.h(5, 10, 22, 'h');
    for (const x of [6, 23]) { c.L(L => L.r(x, 6, 3, 23, 'u'), 'k', 'Y', 'U'); }
    c.L(L => L.r(3, 26, 26, 3, 'u'), 'k', 'Y', 'U'); c.L(L => L.r(3, 13, 26, 2, 'u'), 'k', 'Y', 'U');
    c.L(L => L.r(13, 12, 6, 7, 'u'), 'k', 'Y', 'U'); c.r(15, 14, 2, 2, 'k'); c.p(15, 16, 'k'); c.p(16, 16, 'k'); c.v(15, 16, 2, 'k');
    c.p([[27, 2, 'y'], [26, 3, 'y'], [28, 3, 'y'], [27, 4, 'y'], [27, 3, 'w'], [4, 3, 'y'], [4, 4, 'w']]);
  }, c => {
    c.L(L => L.r(1, 7, 14, 8, 'e'), 'k', 'E', 'h'); c.L(L => { L.r(1, 4, 14, 4, 'e'); L.e(8, 4, 7, 2, 'e'); }, 'k', 'E');
    c.r(3, 3, 2, 12, 'u'); c.r(11, 3, 2, 12, 'u'); c.h(1, 7, 14, 'u'); c.L(L => L.r(6, 6, 4, 4, 'u'), 'k'); c.p(7, 7, 'k'); c.p(8, 8, 'k');
  });
  I('cupboard', c => {
    c.L(L => L.r(2, 1, 28, 30, 'E'), 'k', 'T', 'e'); c.r(4, 3, 24, 12, 'h'); c.r(4, 17, 24, 12, 'h'); c.h(4, 15, 24, 'E'); c.h(4, 16, 24, 'e'); c.h(4, 3, 24, '6');
    [['5', 4], ['2', 3], ['4', 4], ['1', 3], ['f', 4], ['n', 3]].reduce((x, [k, w], i) => { const top = 5 + (i % 3); c.L(L => L.r(x, top, w, 15 - top, k), 'k', i % 2 ? null : 'w'); c.h(x + 1, top + 3, w - 2, 'w'); return x + w + 1; }, 5);
    c.L(L => L.poly([[23, 14], [27, 6], [29, 7], [26, 14]], '3'), 'k', 'Y');
    disc(c, 9, 23, 5.5); c.L(L => { L.r(17, 21, 10, 6, 's'); }, 'k', 'w', 'g'); c.r(18, 23, 3, 1, 'k'); c.r(19, 22, 1, 3, 'k'); c.p(24, 23, 'r'); c.p(25, 24, '2');
  }, c => {
    c.L(L => L.r(1, 0, 14, 16, 'E'), 'k', 'T', 'e'); c.r(2, 1, 12, 6, 'h'); c.r(2, 8, 12, 6, 'h'); c.h(2, 7, 12, 'E');
    [['5', 3], ['2', 5], ['4', 7], ['1', 9]].forEach(([k, x], i) => c.r(x, 2 + (i % 2), 2, 5 - (i % 2), k)); c.r(11, 2, 2, 5, 'f');
    c.L(L => L.e(5, 11, 2.5, 2.5, 'S'), 'k'); c.p(5, 11, 'k'); c.r(9, 10, 4, 3, 's');
  });
  I('mobile', c => {
    c.L(L => L.r(19, 0, 3, 5, 'K'), 'k'); c.p(20, 0, 'g');
    c.L(L => { L.r(9, 4, 14, 27, '9'); L.e(16, 5, 7, 2, '9'); L.e(16, 30, 7, 2, '9'); }, 'k', '2', 'n');
    c.h(13, 5, 6, 'k'); c.p([[14, 5, 'g'], [16, 5, 'g'], [18, 5, 'g']]);
    c.L(L => L.r(11, 8, 10, 9, '#9cc04a'), 'k'); c.r(12, 9, 8, 1, '#c8e078'); c.p([[12, 12], [13, 11], [13, 12], [14, 10], [14, 11], [14, 12]].map(q => [...q, '#3a5a10'])); c.r(17, 10, 3, 3, '#3a5a10'); c.p(20, 11, '#3a5a10'); c.h(12, 14, 8, '#3a5a10'); c.h(12, 16, 5, '#3a5a10');
    c.L(L => L.r(14, 18, 4, 2, 's'), 'k', 'w');
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { c.r(11 + i * 4, 21 + j * 2, 3, 1, 'S'); }
    c.r(11, 19, 2, 1, 'l'); c.r(19, 19, 2, 1, 'r');
  }, c => {
    c.r(10, 0, 2, 3, 'K'); c.L(L => L.r(4, 2, 8, 14, '9'), 'k', '2'); c.r(5, 4, 6, 4, '#9cc04a'); c.h(6, 5, 3, '#3a5a10');
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) c.p(5 + i * 2, 10 + j * 2, 'S');
  });
  I('pagebuilder', c => {
    win32(c, 1, 2, 26, 26, 'w'); c.r(4, 9, 20, 4, 'O'); text(c, 5, 8 + 1 - 1, '', 'w'); c.h(5, 10, 10, 'Y'); c.h(5, 11, 7, 'Y');
    c.r(4, 15, 7, 8, 'i'); c.p(6, 17, 'y'); c.pl([[4, 22], [7, 19], [10, 22]], 'G'); c.h(13, 15, 10, 'g'); c.h(13, 17, 8, 'g'); c.h(13, 19, 10, 'g'); c.h(4, 25, 9, 'b'); c.h(4, 24, 9, 'B');
    globe(c, 25, 24, 6.5);
    c.L(L => L.poly([[27, 1], [31, 5], [21, 15], [17, 11]], 'y'), 'k', 'Y', 'O'); c.L(L => L.poly([[17, 11], [21, 15], [15, 17]], 'T'), 'k'); c.p(16, 16, 'k'); c.L(L => L.poly([[27, 1], [31, 5], [29, 7], [25, 3]], 'R'), 'k');
  }, c => {
    win16(c, 0, 1, 13, 13, 'w'); c.r(2, 5, 9, 2, 'O'); c.h(2, 9, 6, 'g'); c.h(2, 11, 5, 'g'); globe(c, 12, 12, 3.5);
    c.L(L => L.poly([[13, 0], [15, 2], [9, 8], [7, 6]], 'y'), 'k'); c.p(6, 8, 'k');
  });
  I('coverdisc', c => {
    disc(c, 16, 16, 14);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const dx = x + .5 - 16, dy = y + .5 - 16, d = Math.hypot(dx, dy); if (d < 12.6 && d > 4.6) c.p(x, y, dy < 0 ? (d > 11.4 ? 'O' : 'y') : (d > 11.4 ? 'm' : 'r')); }
    text(c, 8, 6, 'JACK', 'm'); c.r(24, 6, 1, 3, 'm'); c.p(24, 10, 'm'); text(c, 9, 20, 'CD', 'w'); text(c, 18, 20, '7', 'y');
    c.L(L => L.e(16, 16, 4, 4, 'S'), 'g'); c.L(L => L.e(16, 16, 1.8, 1.8, 'w'), 'g'); c.p([[6, 9, 'w'], [7, 8, 'w']]);
  }, c => {
    disc(c, 8, 8, 7); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x + .5 - 8, y + .5 - 8); if (d < 6.2 && d > 2.2) c.p(x, y, y < 8 ? 'y' : 'r'); }
    c.h(5, 4, 6, 'm'); c.L(L => L.e(8, 8, 1.6, 1.6, 'w'), 'g');
  });
  I('commander', c => {
    win32(c, 1, 2, 30, 27, 'n');
    for (const x of [3, 17]) { c.pl([[x, 8], [x + 11, 8], [x + 11, 24], [x, 24], [x, 8]], 'a'); c.h(x + 3, 8, 6, 'n'); c.h(x + 4, 8, 4, 'w'); for (let j = 0; j < 6; j++) c.h(x + 2, 10 + j * 2, 4 + ((j * 5 + x) % 5), j === 1 && x === 3 ? 'k' : 'a'); }
    c.r(4, 11, 9, 1, 'a'); c.h(5, 11, 5, 'k'); c.r(3, 25, 26, 2, 'k'); for (let i = 0; i < 6; i++) c.r(4 + i * 4, 25, 3, 2, 'a');
  }, c => {
    win16(c, 0, 1, 16, 14, 'n'); c.pl([[1, 4], [7, 4], [7, 12], [1, 12], [1, 4]], 'a'); c.pl([[8, 4], [14, 4], [14, 12], [8, 12], [8, 4]], 'a'); c.h(2, 6, 3, 'a'); c.h(2, 8, 4, 'w'); c.h(9, 6, 4, 'a'); c.h(9, 8, 3, 'a'); c.h(1, 13, 14, 'a');
  });
  I('castle', c => {
    c.L(L => { L.r(4, 10, 8, 20, 's'); L.r(20, 10, 8, 20, 's'); L.r(10, 15, 12, 15, 's'); for (const x of [4, 7, 10, 20, 23, 26]) L.r(x, 8, 2, 2, 's'); for (const x of [12, 15, 18]) L.r(x, 13, 2, 2, 's'); }, 'k', 'w', 'g');
    for (let y = 13; y < 29; y += 3) for (let x = 5 + (y % 2 ? 1 : 0); x < 27; x += 4) c.h(x, y, 2, 'g');
    c.L(L => { L.r(13, 21, 6, 9, 'e'); L.e(16, 21, 3, 3, 'e'); }, 'k', 'E', 'h'); c.v(16, 19, 11, 'h');
    c.r(7, 15, 2, 3, 'k'); c.r(23, 15, 2, 3, 'k');
    c.v(24, 1, 8, 'K'); c.L(L => L.poly([[25, 1], [31, 3], [25, 5]], 'r'), 'm');
    c.L(L => L.r(5, 1, 7, 7, 'y'), 'k', 'Y', 'U'); c.s(7, 2, ['kk.', '..k', '.k.', '...', '.k.']);
  }, c => {
    c.L(L => { L.r(1, 5, 4, 10, 's'); L.r(11, 5, 4, 10, 's'); L.r(4, 8, 8, 7, 's'); L.r(1, 4, 1, 1, 's'); L.r(3, 4, 1, 1, 's'); L.r(11, 4, 1, 1, 's'); L.r(13, 4, 1, 1, 's'); }, 'k', 'w', 'g');
    c.r(7, 10, 2, 5, 'e'); c.v(12, 0, 4, 'K'); c.r(13, 0, 3, 2, 'r');
  });
  I('regwiz', c => {
    page(c, 3, 1, 23, 29, 5); c.r(6, 4, 9, 2, 'n');
    for (let j = 0; j < 4; j++) { c.b(6, 9 + j * 4, 3, 3, 'w'); c.h(10, 10 + j * 4, 9 - (j % 2) * 3, 'g'); if (j !== 2) c.p([[6, 9 + j * 4], [7, 10 + j * 4], [8, 9 + j * 4], [9, 8 + j * 4]].map(p => [...p, 'G'])); }
    c.pl([[6, 26], [8, 24], [10, 26], [12, 24], [14, 26]], 'b');
    c.L(L => L.poly([[27, 8], [30, 11], [18, 25], [15, 22]], 'r'), 'k', 'R', 'm'); c.L(L => L.poly([[15, 22], [18, 25], [13, 27]], 'T'), 'k'); c.p(13, 27, 'k');
    c.p([[27, 2, 'y'], [26, 3, 'y'], [28, 3, 'y'], [27, 4, 'y'], [27, 3, 'w'], [30, 15, 'y'], [29, 16, 'y'], [31, 16, 'y'], [30, 17, 'y']]);
  }, c => {
    page(c, 1, 0, 11, 15, 3); for (let j = 0; j < 3; j++) { c.b(3, 4 + j * 3, 2, 2, 'w'); c.h(6, 4 + j * 3, 4, 'g'); } c.p(3, 4, 'G'); c.p(3, 7, 'G');
    c.L(L => L.poly([[14, 5], [15, 6], [9, 13], [8, 12]], 'r'), 'k'); c.p(7, 14, 'k');
  });
  I('write', c => {
    page(c, 4, 1, 25, 30, 5); lines(c, 7, 8, 13, 9, 'g', 2);
    c.L(L => L.poly([[28, 6], [31, 9], [17, 23], [14, 20]], '9'), 'k', '2'); c.L(L => L.poly([[14, 20], [17, 23], [12, 28], [10, 26], [11, 24]], 'u'), 'k', 'Y', 'U'); c.p(12, 25, 'k'); c.p(13, 24, 'k'); c.p(10, 28, 'k');
    c.pl([[6, 28], [8, 27], [9, 28]], 'n');
  }, c => {
    page(c, 1, 0, 12, 15, 3); lines(c, 3, 4, 7, 5, 'g', 2); c.L(L => L.poly([[14, 3], [15, 4], [9, 11], [8, 10]], '9'), 'k'); c.p(7, 12, 'u'); c.p(6, 13, 'k');
  });
  // a lit, dithered sphere (glossy ball): base k, light kl, dark kd
  function ball(c, cx, cy, r, k, kl, kd, o) {
    c.L(L => L.e(cx, cy, r, r, k), o || 'k');
    for (let y = 0; y < c.n; y++) for (let x = 0; x < c.n; x++) {
      const dx = (x + .5 - cx) / r, dy = (y + .5 - cy) / r, d = dx * dx + dy * dy; if (d > .98) continue;
      const lt = -dx * .6 - dy * .7 + (1 - d) * .5;
      if (lt > .75) c.p(x, y, kl); else if (lt > .55 && (x + y) & 1) c.p(x, y, kl); else if (lt < -.45) c.p(x, y, kd); else if (lt < -.25 && (x + y) & 1) c.p(x, y, kd);
    }
    if (r > 3) { c.p(Math.round(cx - r * .45), Math.round(cy - r * .5), 'w'); if (r > 6) c.p(Math.round(cx - r * .45) + 1, Math.round(cy - r * .5), 'w'); }
  }
  I('quake', c => {
    c.L(L => L.r(2, 2, 28, 28, '6'), 'k', 'E', 'h'); c.d(3, 3, 26, 26, '6', 'e');
    for (const [x, y] of [[4, 4], [26, 4], [4, 26], [26, 26]]) { c.r(x, y, 2, 2, 'g'); c.p(x, y, 'S'); c.p(x + 1, y + 1, 'K'); }
    c.L(L => { L.r(14, 6, 6, 15, 'E'); L.r(10, 6, 14, 3, 'E'); L.e(13, 21, 7, 5, 'E'); L.x(10, 14, 8, 6); }, 'h', 'T', 'e');
    c.L(L => L.e(13, 21, 3, 1.6, '6'), null); c.r(11, 14, 3, 6, '_'); c.L(L => L.r(7, 15, 3, 4, 'E'), 'h', 'T', 'e');
    c.p([[8, 9, 'm'], [22, 25, 'm'], [6, 22, 'h'], [25, 12, 'm'], [24, 13, 'h']]);
  }, c => {
    c.L(L => L.r(0, 0, 16, 16, '6'), 'k', 'E', 'h'); c.d(1, 1, 14, 14, '6', 'e');
    c.L(L => { L.r(7, 3, 3, 8, 'E'); L.r(5, 3, 7, 2, 'E'); L.r(3, 10, 6, 3, 'E'); L.r(3, 8, 2, 3, 'E'); }, 'h', 'T');
  });
  I('jrt', c => {
    c.L(L => L.poly([[3, 3], [29, 3], [29, 15], [25, 23], [16, 30], [7, 23], [3, 15]], 'u'), 'k', 'Y', 'h');
    c.L(L => L.poly([[6, 6], [26, 6], [26, 15], [23, 21], [16, 26.5], [9, 21], [6, 15]], 'n'), 'U', null, '9');
    c.pl([[6, 6], [26, 6]], 'B'); text(c, 10, 9, 'JRT', 'u'); c.h(9, 16, 15, 'U'); c.p([[16, 19, 'r'], [15, 20, 'r'], [17, 20, 'r'], [16, 21, 'r'], [16, 20, 'y']]);
  }, c => {
    c.L(L => L.poly([[1, 1], [15, 1], [15, 8], [8, 15], [1, 8]], 'u'), 'k', 'Y', 'h'); c.L(L => L.poly([[3, 3], [13, 3], [13, 8], [8, 12.5], [3, 8]], 'n'), null); c.s(5, 4, ['.y.yy', '.y.y.', 'yy.y.']);
  });
  I('coaster', c => {
    c.r(0, 26, 32, 5, 'v'); c.h(0, 26, 32, 'V'); c.h(0, 30, 32, 'd'); c.L(L => L.r(0, 26, 32, 5, 'v'), 'D');
    for (const x of [5, 12, 20, 27]) c.v(x, 14, 12, 's');
    for (let i = 0; i <= 64; i++) { const t = i / 64 * Math.PI * 2, x = 17 + Math.sin(t) * 7.5, y = 12 - Math.cos(t) * 8.5; c.p(Math.round(x), Math.round(y), 'r'); c.p(Math.round(x) + 1, Math.round(y), 'm'); }
    c.pl([[0, 22], [6, 16], [10, 20], [17, 20]], 'r'); c.pl([[0, 23], [6, 17], [10, 21], [17, 21]], 'm'); c.pl([[24, 17], [28, 13], [31, 15]], 'r'); c.pl([[24, 18], [28, 14], [31, 16]], 'm');
    c.L(L => { L.r(14, 1, 7, 3, 'y'); }, 'k', 'Y', 'O'); c.p(15, 4, 'k'); c.p(19, 4, 'k'); c.p([[16, 0, 'z'], [18, 0, 'z']]);
    c.p([[3, 5, 'w'], [4, 4, 'w'], [5, 5, 'w'], [26, 3, 'w'], [27, 2, 'w'], [28, 3, 'w']]);
  }, c => {
    c.r(0, 13, 16, 3, 'v'); c.h(0, 13, 16, 'V');
    for (let i = 0; i <= 40; i++) { const t = i / 40 * Math.PI * 2; c.p(Math.round(9 + Math.sin(t) * 4), Math.round(6 - Math.cos(t) * 4.5), 'r'); }
    c.pl([[0, 11], [3, 8], [5, 11], [9, 11]], 'r'); c.v(3, 9, 4, 's'); c.v(12, 8, 5, 's'); c.r(7, 1, 4, 2, 'y');
  });
  I('city', c => {
    const B = [[1, 15, 7, 'g', 's'], [7, 6, 7, '2', 'i'], [13, 11, 6, '3', 'Y'], [18, 2, 7, 'n', 'a'], [24, 13, 7, 'm', 'y']];
    for (const [x, y, w, k, win] of B) { c.L(L => L.r(x, y, w, 30 - y, k), 'k', win === 'a' ? 'B' : null, null); for (let j = y + 2; j < 28; j += 3) for (let i = x + 1; i < x + w - 1; i += 2) c.p(i, j, ((i * 3 + j * 7) % 5) ? win : 'k'); }
    c.v(21, 0, 3, 'K'); c.p(21, 0, 'r'); c.L(L => L.r(0, 30, 32, 2, 'K'), null); c.h(1, 30, 30, 'g'); c.h(2, 31, 3, 'y'); c.h(10, 31, 3, 'y'); c.h(18, 31, 3, 'y'); c.h(26, 31, 3, 'y');
  }, c => {
    c.L(L => { L.r(0, 8, 4, 8, 'g'); L.r(4, 3, 4, 13, '2'); L.r(8, 6, 4, 10, '3'); L.r(12, 1, 4, 15, 'n'); }, 'k'); for (let j = 4; j < 15; j += 2) { c.p(5, j, 'i'); c.p(13, j - 1, 'a'); c.p(9, j + 2, 'Y'); }
  });
  I('grenade', c => {
    c.p([[25, 3, 'y'], [27, 1, 'y'], [29, 4, 'O'], [24, 6, 'y'], [28, 7, 'O'], [30, 1, 'y']]); c.pl([[20, 7], [23, 4], [25, 3]], 'K');
    c.L(L => { L.r(16, 6, 6, 4, 'g'); }, 'k', 'S', 'K'); c.L(L => L.e(25, 10, 3, 3, '_'), null);
    c.L(L => L.e(14, 20, 10, 10.5, 'v'), 'k', null, null);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const dx = x + .5 - 14, dy = y + .5 - 20; if (dx * dx / 100 + dy * dy / 110 > .95) continue; const cell = ((Math.floor((x - 4) / 4) + Math.floor((y - 10) / 4)) & 1); const ex = (x - 4) % 4 === 0 || (y - 10) % 4 === 0; c.p(x, y, ex ? 'D' : (dx + dy < -4 ? 'V' : dx + dy > 6 ? 'd' : 'v')); }
    c.L(L => L.r(11, 8, 8, 3, 'g'), 'k', 'S', 'K'); c.L(L => L.r(18, 9, 6, 3, 'g'), 'k', 'S'); c.L(L => { L.e(26, 12, 3, 3, 's'); L.e(26, 12, 1.6, 1.6, '_'); }, 'k');
    c.p([[9, 15, 'w'], [8, 16, 'w'], [9, 16, 'V']]);
  }, c => {
    c.L(L => L.e(7, 10, 5.5, 5.5, 'v'), 'k', 'V', 'd'); c.h(3, 10, 9, 'D'); c.v(7, 5, 10, 'D'); c.L(L => L.r(5, 3, 5, 2, 'g'), 'k'); c.L(L => L.r(9, 3, 4, 2, 'g'), 'k'); c.p(14, 1, 'y'); c.p(13, 0, 'O'); c.p(15, 2, 'O');
  });
  I('helmet', c => {
    c.L(L => L.poly([[17, 3], [23, 0], [30, 2], [27, 6], [22, 8], [18, 7]], 'r'), 'm', 'R', 'm'); c.pl([[19, 5], [27, 3]], 'm');
    c.L(L => { L.e(16, 13, 10, 9, 's'); L.r(6, 13, 20, 15, 's'); L.poly([[6, 27], [26, 27], [24, 30], [8, 30]], 's'); }, 'k', 'w', 'g');
    for (let y = 5; y < 30; y++) for (let x = 7; x < 26; x++) if (x > 19 && c.get(x, y) === 's' && ((x + y) & 1 || x > 22)) c.p(x, y, 'g');
    c.L(L => L.r(7, 15, 18, 2, 'k'), null); c.h(8, 14, 16, 'w'); c.h(8, 17, 16, 'K');
    c.L(L => L.r(15, 6, 2, 22, 'S'), null); c.v(17, 6, 22, 'g'); c.r(15, 15, 2, 2, 'k');
    for (const [x, y] of [[10, 21], [12, 23], [10, 25], [21, 21], [19, 23], [21, 25]]) c.p(x, y, 'k');
    c.p([[9, 8, 'w'], [10, 7, 'w'], [11, 6, 'w']]);
  }, c => {
    c.L(L => L.poly([[9, 1], [13, 0], [15, 1], [11, 3]], 'r'), 'm');
    c.L(L => { L.e(8, 7, 6, 5.5, 's'); L.r(2, 7, 12, 8, 's'); }, 'k', 'w', 'g'); c.r(3, 7, 10, 1, 'k'); c.v(8, 3, 11, 'S'); c.p(8, 7, 'k'); c.p(5, 11, 'k'); c.p(11, 11, 'k');
  });
  I('football', c => {
    c.L(L => L.r(9, 2, 21, 25, 'E'), 'k', 'T', 'e'); c.L(L => L.r(11, 5, 17, 20, 'v'), 'D', 'V'); c.L(L => L.r(15, 0, 9, 4, 's'), 'k', 'w', 'g');
    c.pl([[11, 15], [27, 15]], 'w'); c.L(L => L.e(19.5, 15.5, 3, 3, '_'), null); c.pl([[16, 15], [17, 13], [19, 12], [21, 12], [23, 14], [23, 16], [21, 19], [18, 19], [16, 17]], 'w');
    c.p([[14, 8, 'r'], [24, 9, 'r'], [19, 10, 'r'], [14, 21, '2'], [23, 21, '2'], [19, 22, '2']]); c.pl([[14, 8], [19, 10]], 'y');
    c.L(L => L.e(9, 22, 8, 8, 'w'), 'k'); 
    const pent = (x, y, r) => c.poly([0, 1, 2, 3, 4].map(i => [x + Math.sin(i * 1.2566) * r, y - Math.cos(i * 1.2566) * r]), 'k');
    pent(9, 22, 3); pent(3, 18, 2.3); pent(15, 18, 2.3); pent(4, 28, 2.3); pent(14, 28, 2.3); c.p([[5, 17, 'w'], [6, 16, 'S']]);
    for (let y = 14; y < 31; y++) for (let x = 1; x < 18; x++) { const dx = x + .5 - 9, dy = y + .5 - 22; if (dx * dx + dy * dy < 62 && dx + dy > 6 && c.get(x, y) === 'w') c.p(x, y, 's'); }
  }, c => {
    c.L(L => L.r(5, 1, 11, 13, 'E'), 'k'); c.r(6, 3, 9, 10, 'v'); c.h(6, 7, 9, 'w'); c.p(9, 5, 'r'); c.p(12, 10, '2');
    c.L(L => L.e(5, 11, 4.5, 4.5, 'w'), 'k'); c.r(4, 10, 2, 2, 'k'); c.p(2, 8, 'k'); c.p(8, 13, 'k'); c.p(2, 13, 'k');
  });
  I('claw', c => {
    c.L(L => L.r(1, 1, 30, 30, '#3a1010'), 'k', 'm', '#200808'); for (let y = 2; y < 30; y++) for (let x = 2; x < 30; x++) if (((x * 3 + y * 5) % 13) === 0) c.p(x, y, 'm');
    c.L(L => {
      L.e(16, 22, 8, 7, 'v'); L.r(9, 24, 14, 7, 'v');
      const f = (x0, y0, x1, y1) => { L.poly([[x0 - 1.6, y0], [x0 + 1.6, y0], [x1 + 1, y1], [x1 - 1, y1]], 'v'); };
      f(10, 18, 7, 8); f(14, 16, 13, 4); f(18, 16, 19, 4); f(22, 18, 25, 8); f(9, 24, 3, 18);
    }, 'D', 'V', 'd');
    c.p([[7, 7, 'y'], [7, 6, 'w'], [13, 3, 'y'], [13, 2, 'w'], [19, 3, 'y'], [19, 2, 'w'], [25, 7, 'y'], [25, 6, 'w'], [3, 17, 'y'], [2, 16, 'w']]);
    c.h(12, 27, 8, 'd'); c.p([[14, 21, 'd'], [18, 21, 'd']]);
  }, c => {
    c.L(L => L.r(0, 0, 16, 16, '#3a1010'), 'k'); c.L(L => { L.e(8, 12, 4.5, 3.5, 'v'); L.r(4, 12, 8, 4, 'v'); L.r(4, 4, 2, 7, 'v'); L.r(7, 2, 2, 8, 'v'); L.r(10, 3, 2, 7, 'v'); L.r(1, 9, 3, 2, 'v'); }, 'D', 'V');
    c.p([[4, 3, 'y'], [7, 1, 'y'], [10, 2, 'y']]);
  });
  I('jezz', c => {
    c.L(L => L.r(1, 1, 30, 30, 's'), 'k', 'w', 'g'); c.r(3, 3, 26, 26, 'S');
    for (let y = 3; y < 29; y += 3) c.h(3, y, 26, 's'); for (let x = 3; x < 29; x += 3) c.v(x, 3, 26, 's');
    c.r(3, 3, 9, 26, 'K'); c.d(3, 3, 9, 26, 'K', 'g'); c.r(12, 3, 1, 26, 'k');
    c.r(13, 18, 16, 2, '2'); c.r(13, 18, 6, 2, 'r'); c.r(19, 18, 1, 2, 'k');
    ball(c, 22, 10, 3.5, 'r', 'R', 'm'); ball(c, 18, 25, 3, 'v', 'V', 'd'); c.p([[25, 6, 'K'], [27, 4, 'g']]);
  }, c => {
    c.L(L => L.r(0, 0, 16, 16, 'S'), 'k'); c.r(1, 1, 5, 14, 'g'); c.r(6, 10, 9, 1, '2'); c.r(6, 10, 3, 1, 'r'); c.L(L => L.e(11, 5, 2.2, 2.2, 'r'), 'k'); c.L(L => L.e(10, 13, 1.6, 1.6, 'v'), 'k');
  });
  I('sweeper', c => {
    c.bv(1, 1, 30, 30, 's', 'w', 'g'); c.p(2, 29, 'g');
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, x = 16 + Math.cos(a) * 11, y = 16 + Math.sin(a) * 11; c.l(16, 16, Math.round(x), Math.round(y), 'k'); }
    c.r(15, 4, 2, 24, 'k'); c.r(4, 15, 24, 2, 'k');
    ball(c, 16, 16, 7.5, 'K', 'g', 'k'); c.r(12, 12, 3, 3, 'w'); c.p(12, 12, 'S');
  }, c => {
    c.bv(0, 0, 16, 16, 's', 'w', 'g'); c.v(8, 2, 12, 'k'); c.h(2, 8, 12, 'k'); c.p([[3, 3], [13, 3], [3, 13], [13, 13], [4, 4], [12, 4], [4, 12], [12, 12]].map(p => [...p, 'k']));
    c.L(L => L.e(8.5, 8.5, 4, 4, 'k'), null); c.r(6, 6, 2, 2, 'w');
  });
  I('seti', c => {
    c.L(L => L.r(1, 18, 30, 13, 'k'), 'g'); c.pl([[2, 28], [5, 27], [7, 24], [9, 27], [11, 26], [13, 20], [15, 27], [17, 28], [20, 26], [23, 27], [26, 25], [29, 28]], 'l'); c.h(2, 29, 28, 'G');
    for (let x = 3; x < 30; x += 4) c.p(x, 20, 'G');
    c.L(L => L.poly([[5, 2], [23, 2], [24, 4], [18, 12], [10, 12], [4, 4]], 'S'), 'k', 'w', 'g'); c.pl([[7, 4], [11, 10]], 's'); c.pl([[21, 4], [17, 10]], 's'); c.h(6, 3, 17, 'w');
    c.L(L => { L.r(13, 12, 3, 5, 's'); L.r(9, 16, 11, 2, 's'); }, 'k', 'w', 'g'); c.pl([[14, 3], [14, 8]], 'K'); c.p(14, 2, 'r');
    c.pl([[24, 6], [26, 4]], 'y'); c.pl([[25, 8], [28, 6]], 'y'); c.pl([[23, 9], [26, 10]], 'O'); c.p([[29, 2, 'w'], [3, 9, 'w'], [30, 11, 'w']]);
  }, c => {
    c.r(0, 10, 16, 6, 'k'); c.pl([[1, 14], [3, 13], [5, 11], [7, 14], [9, 13], [11, 12], [14, 14]], 'l');
    c.L(L => L.poly([[2, 1], [12, 1], [9, 6], [5, 6]], 'S'), 'k', 'w'); c.r(6, 6, 2, 3, 's'); c.h(4, 9, 6, 's'); c.p(13, 2, 'y'); c.p(14, 4, 'y');
  });
  I('realjack', c => {
    c.L(L => L.e(16, 16, 14.5, 14.5, 'n'), 'k'); c.L(L => L.e(16, 16, 12, 12, 'B'), '9', null, 'n'); c.L(L => L.e(16, 16, 9, 9, '2'), 'n', 'B', 'n');
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const dx = x + .5 - 16, dy = y + .5 - 16, d = Math.hypot(dx, dy); if (d < 12 && d > 9.6 && dx + dy < -6) c.p(x, y, 'i'); }
    c.L(L => L.poly([[13, 10], [13, 22], [23, 16]], 'u'), 'h', 'Y', 'O'); c.p([[6, 9, 'w'], [7, 8, 'w'], [8, 7, 'w']]);
  }, c => {
    c.L(L => L.e(8, 8, 7.5, 7.5, 'n'), 'k'); c.L(L => L.e(8, 8, 5.5, 5.5, '2'), 'n', 'B'); c.L(L => L.poly([[6, 5], [6, 11], [11, 8]], 'u'), 'h', 'Y');
  });
  I('jackster', c => {
    c.L(L => { for (let i = 0; i <= 40; i++) { const t = Math.PI + i / 40 * Math.PI; L.r(Math.round(16 + Math.cos(t) * 12) - 1, Math.round(17 + Math.sin(t) * 13), 3, 3, 'K'); } }, 'k', 'g');
    c.L(L => { L.r(2, 15, 6, 12, 'r'); L.r(24, 15, 6, 12, 'r'); }, 'k', 'R', 'm'); c.L(L => { L.r(6, 17, 2, 8, 'K'); L.r(24, 17, 2, 8, 'K'); }, null);
    c.L(L => { L.e(14, 22, 3.6, 2.8, 'y'); L.r(16, 8, 2, 14, 'y'); L.poly([[16, 8], [22, 11], [22, 14], [18, 11]], 'y'); }, 'k', 'Y', 'O');
  }, c => {
    c.L(L => { for (let i = 0; i <= 20; i++) { const t = Math.PI + i / 20 * Math.PI; L.r(Math.round(8 + Math.cos(t) * 6), Math.round(9 + Math.sin(t) * 7), 2, 2, 'K'); } }, 'k');
    c.L(L => { L.r(0, 8, 4, 7, 'r'); L.r(12, 8, 4, 7, 'r'); }, 'k', 'R'); c.L(L => { L.r(7, 5, 1, 7, 'y'); L.r(5, 11, 3, 2, 'y'); L.r(8, 5, 2, 1, 'y'); }, 'k');
  });
  I('staples', c => {
    c.L(L => L.poly([[3, 6], [25, 3], [28, 27], [6, 29]], 'Y'), 'C', 'w', 'u'); for (let y = 9; y < 27; y += 3) c.pl([[5, y + 1], [26, y - 2]], 'i');
    c.L(L => { L.r(9, 9, 3, 18, 's'); L.r(20, 9, 3, 18, 's'); L.r(9, 7, 14, 3, 's'); }, 'k', 'w', 'g');
    c.L(L => { L.e(13, 14, 3.2, 3.6, 'w'); L.e(20, 14, 3.2, 3.6, 'w'); }, 'k'); c.r(14, 14, 2, 2, 'k'); c.r(20, 14, 2, 2, 'k');
    c.pl([[9, 9], [12, 8], [15, 9]], 'k'); c.pl([[18, 9], [21, 8], [24, 9]], 'k'); c.p([[13, 13, 'w'], [19, 13, 'w']]);
  }, c => {
    c.L(L => L.r(1, 1, 14, 14, 'Y'), 'C', 'w'); c.L(L => { L.r(3, 4, 2, 10, 's'); L.r(11, 4, 2, 10, 's'); L.r(3, 3, 10, 2, 's'); }, 'k'); c.L(L => { L.r(5, 6, 3, 3, 'w'); L.r(9, 6, 3, 3, 'w'); }, 'k'); c.p(6, 7, 'k'); c.p(10, 7, 'k');
  });
  I('fireworks', c => {
    c.r(0, 0, 32, 32, '9'); c.L(L => L.r(0, 0, 32, 32, '9'), null);
    const burst = (cx, cy, r, k, k2) => { for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; for (let s = 2; s <= r; s++) if (s % 2 === 0 || s === r) c.p(Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s), s > r - 2 ? k2 : k); } c.p(cx, cy, 'w'); };
    burst(10, 9, 7, 'f', 'w'); burst(23, 13, 6, 'y', 'O'); burst(9, 21, 4, 'l', 'a');
    c.L(L => L.poly([[22, 22], [24, 20], [27, 29], [25, 30]], 'r'), 'k', 'R'); c.pl([[25, 30], [28, 31]], 'e'); c.p([[22, 19, 'y'], [21, 18, 'O'], [20, 16, 'y']]);
  }, c => {
    c.r(0, 0, 16, 16, '9'); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.p(Math.round(6 + Math.cos(a) * 4), Math.round(6 + Math.sin(a) * 4), 'f'); c.p(Math.round(6 + Math.cos(a) * 2), Math.round(6 + Math.sin(a) * 2), 'y'); } c.p(6, 6, 'w'); c.r(12, 10, 2, 5, 'r'); c.p(12, 9, 'y');
  });
  I('purplepal', c => {
    c.L(L => { L.e(16, 26, 9, 7, 'p'); }, 'k', 'P');
    c.L(L => { L.e(6, 9, 3.5, 4, 'p'); L.e(26, 9, 3.5, 4, 'p'); L.e(16, 14, 10, 9.5, 'p'); }, 'k', 'P', '9'); c.L(L => { L.e(6, 9, 1.6, 2, '7'); L.e(26, 9, 1.6, 2, '7'); }, null);
    c.L(L => L.e(16, 18, 6.5, 4.5, 'P'), null);
    c.L(L => { L.e(12, 11, 3, 3.4, 'w'); L.e(20, 11, 3, 3.4, 'w'); }, 'k'); c.r(12, 11, 2, 3, 'k'); c.r(20, 11, 2, 3, 'k'); c.p(12, 11, 'w'); c.p(20, 11, 'w');
    c.pl([[12, 18], [14, 20], [18, 20], [20, 18]], 'k'); c.h(14, 19, 5, 'r'); c.r(15, 15, 2, 2, '9');
    c.L(L => L.r(18, 23, 11, 8, 'w'), 'k'); c.h(20, 25, 7, 'g'); c.h(20, 27, 5, 'g');
  }, c => {
    c.L(L => { L.e(3, 5, 2, 2.5, 'p'); L.e(13, 5, 2, 2.5, 'p'); L.e(8, 8, 6, 6.5, 'p'); L.e(8, 15, 5, 3, 'p'); }, 'k', 'P'); c.r(5, 6, 2, 2, 'w'); c.r(9, 6, 2, 2, 'w'); c.p(6, 7, 'k'); c.p(10, 7, 'k'); c.h(6, 11, 4, 'k');
  });
  I('ramdbl', c => {
    c.L(L => L.r(1, 10, 30, 14, 'G'), 'k', 'v', 'D'); c.d(2, 11, 28, 12, 'G', 'G');
    for (const x of [3, 10, 17]) { c.L(L => L.r(x, 13, 6, 6, 'K'), 'k'); c.h(x + 1, 14, 4, 'g'); }
    c.r(2, 21, 28, 2, 'u'); for (let x = 3; x < 30; x += 2) c.p(x, 22, 'U'); c.x(14, 21, 1, 2);
        c.L(L => L.e(25, 6, 6, 5.5, 'r'), 'k', 'R', 'm'); text(c, 22, 4, 'X2', 'w');
  }, c => {
    c.L(L => L.r(0, 6, 16, 8, 'G'), 'k', 'v'); c.r(2, 8, 3, 3, 'K'); c.r(6, 8, 3, 3, 'K'); c.h(1, 12, 14, 'u'); c.L(L => L.e(12.5, 4, 3.5, 3.5, 'r'), 'k'); c.s(11, 2, ['w.w', '.w.', 'w.w']);
  });
  I('modemturbo', c => {
    for (const [y, w] of [[13, 8], [17, 10], [21, 7]]) c.h(0, y, w, (y === 17) ? 'O' : 'y');
    c.L(L => L.poly([[8, 12], [29, 12], [31, 16], [31, 24], [6, 24], [6, 16]], 'c'), 'k', 'w', 'C'); c.h(7, 16, 24, 'C');
    for (let i = 0; i < 6; i++) c.r(10 + i * 3, 19, 2, 2, i < 4 ? 'l' : 'r'); c.r(10, 19, 2, 2, 'G');
    c.L(L => L.poly([[12, 1], [26, 1], [30, 5], [26, 9], [12, 9], [16, 5]], 'r'), 'm', 'R', 'm'); text(c, 18, 3, 'GO', 'w');
    c.L(L => L.r(8, 24, 22, 2, 'C'), 'k');
  }, c => {
    c.h(0, 7, 3, 'y'); c.h(0, 10, 4, 'O'); c.L(L => L.r(3, 6, 13, 7, 'c'), 'k', 'w', 'C'); c.r(5, 9, 1, 1, 'l'); c.r(7, 9, 1, 1, 'l'); c.r(9, 9, 1, 1, 'r'); c.L(L => L.poly([[6, 0], [12, 0], [15, 2.5], [12, 5], [6, 5], [8, 2.5]], 'r'), 'm');
  });
  I('regfix', c => {
    const cube = (x, y, k, kl, kd) => { c.L(L => L.poly([[x, y + 3], [x + 6, y], [x + 12, y + 3], [x + 12, y + 10], [x + 6, y + 13], [x, y + 10]], k), 'k'); c.poly([[x + 1, y + 3], [x + 6, y + 1], [x + 11, y + 3], [x + 6, y + 5.5]], kl); c.poly([[x + 6, y + 6], [x + 11.5, y + 3.5], [x + 11.5, y + 10], [x + 6, y + 12.5]], kd); c.pl([[x + 6, y + 6], [x + 6, y + 12]], 'k'); };
    c.pl([[8, 13], [8, 24], [14, 24]], 'g'); c.pl([[14, 9], [20, 9]], 'g');
    cube(1, 1, 'B', 'i', 'n'); cube(17, 3, 'B', 'i', 'n'); cube(13, 17, 'B', 'i', 'n');
    c.L(L => { L.poly([[20, 31], [31, 20], [31, 24], [24, 31]], 's'); L.e(27, 27, 0.1, 0.1, 's'); }, null);
    c.L(L => L.e(26, 26, 5, 5, 'r'), 'm', 'R', 'm'); c.r(25, 23, 2, 7, 'w'); c.r(23, 25, 7, 2, 'w');
  }, c => {
    const cube = (x, y) => { c.L(L => L.r(x, y, 6, 6, 'B'), 'k', 'i', 'n'); };
    cube(0, 0); cube(8, 2); cube(4, 8); c.L(L => L.e(12.5, 12.5, 3.5, 3.5, 'r'), 'm'); c.r(12, 10, 1, 5, 'w'); c.r(10, 12, 5, 1, 'w');
  });
  I('y2ksuite', c => {
    c.L(L => { L.r(4, 9, 15, 21, 's'); L.e(11.5, 9, 7.5, 2.5, 's'); L.e(11.5, 30, 7.5, 2, 's'); }, 'k', 'w', 'g');
    c.L(L => L.e(11.5, 9, 6, 1.6, 'S'), 'g'); c.r(5, 14, 14, 11, 'r'); c.h(5, 14, 14, 'm'); c.h(5, 24, 14, 'm'); c.v(5, 14, 11, 'R');
    text(c, 6, 16, 'Y2K', 'y'); c.h(6, 22, 11, 'w'); for (let y = 11; y < 29; y += 2) c.p(17, y, 'g');
    c.L(L => { L.r(22, 18, 7, 12, 'Y'); L.e(25.5, 30, 3.5, 1.4, 'Y'); }, 'k', 'w', 'C'); c.v(25, 15, 3, 'k');
    c.L(L => L.poly([[25.5, 8], [28, 13], [25.5, 16], [23, 13]], 'y'), 'O', 'w'); c.p(25, 13, 'O');
  }, c => {
    c.L(L => L.r(1, 3, 9, 12, 's'), 'k', 'w', 'g'); c.r(2, 6, 7, 6, 'r'); c.s(2, 7, ['y.y.y', '.y.yy', '.y.y.']);
    c.L(L => L.r(12, 8, 3, 7, 'Y'), 'k'); c.L(L => L.e(13.5, 5, 1.5, 2.5, 'y'), 'O');
  });
  I('winjack', c => {
    const fl = (x, y, k) => { c.L(L => L.r(x, y, 12, 5, k), 'k'); c.r(x + 2, y + 1, 5, 2, 's'); c.r(x + 8, y + 1, 2, 3, 'w'); };
    fl(10, 9, '2'); fl(10, 14, 'r'); fl(10, 19, '1');
    c.L(L => { L.r(3, 6, 6, 22, 's'); L.r(23, 6, 6, 22, 's'); L.r(1, 26, 30, 4, 's'); }, 'k', 'w', 'g'); c.h(4, 7, 4, 'w'); c.r(4, 22, 4, 1, 'g'); c.r(24, 22, 4, 1, 'g');
    c.L(L => L.r(28, 15, 4, 3, 'K'), 'k', 'g'); c.L(L => L.r(30, 8, 2, 17, 'K'), 'k', 'g'); c.L(L => { L.e(31, 7, 1.5, 1.5, 'r'); L.e(31, 25, 1.5, 1.5, 'r'); }, 'k');
    c.p([[3, 2, 'y'], [2, 3, 'y'], [4, 3, 'y'], [3, 4, 'y'], [3, 3, 'w']]);
  }, c => {
    c.L(L => L.r(5, 3, 7, 3, '2'), 'k'); c.L(L => L.r(5, 6, 7, 3, 'r'), 'k'); c.L(L => L.r(5, 9, 7, 3, '1'), 'k');
    c.L(L => { L.r(1, 2, 3, 11, 's'); L.r(12, 2, 3, 11, 's'); L.r(0, 12, 16, 3, 's'); }, 'k', 'w', 'g'); c.r(15, 7, 1, 3, 'K');
  });
  I('prank', c => {
    c.L(L => L.r(5, 18, 22, 13, 'r'), 'k', 'R', 'm'); c.L(L => L.poly([[5, 18], [1, 13], [3, 12], [7, 17]], 'r'), 'k', 'R');
    c.s(9, 21, ['..y..', '.yyy.', 'yyyyy', '.yyy.', '..y..']); c.s(18, 23, ['..2..', '.222.', '22222', '.222.', '..2..']);
    for (let y = 11; y < 19; y += 2) c.pl([[12, y], [20, y + 1]], 's');
    c.L(L => L.e(16, 8, 6.5, 6.5, 'w'), 'k', null, 'S'); c.L(L => L.e(16, 10, 2, 2, 'r'), 'm');
    c.L(L => { L.poly([[10, 3], [16, -3], [22, 3]], 'f'); }, 'k'); c.p(16, 0, 'y'); c.p([[13, 6, 'k'], [19, 6, 'k'], [12, 5, 'k'], [20, 5, 'k']]); c.pl([[12, 11], [14, 13], [18, 13], [20, 11]], 'k');
    c.L(L => { L.e(8, 8, 2.2, 2.2, '3'); L.e(24, 8, 2.2, 2.2, '3'); }, 'k');
  }, c => {
    c.L(L => L.r(2, 9, 12, 7, 'r'), 'k', 'R'); c.p(5, 12, 'y'); c.p(10, 12, '2'); c.v(8, 6, 3, 'g'); c.L(L => L.e(8, 4, 3.5, 3.5, 'w'), 'k'); c.p(7, 3, 'k'); c.p(9, 3, 'k'); c.p(8, 5, 'r'); c.r(5, 0, 6, 1, 'f');
  });
  I('weather', c => {
    ball(c, 11, 10, 7, 'y', 'Y', 'O', 'O'); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.pl([[Math.round(11 + Math.cos(a) * 8.5), Math.round(10 + Math.sin(a) * 8.5)], [Math.round(11 + Math.cos(a) * 10), Math.round(10 + Math.sin(a) * 10)]], 'O'); }
    c.L(L => { L.e(13, 18, 6, 5, 'w'); L.e(21, 15, 7, 6.5, 'w'); L.e(27, 19, 4.5, 4, 'w'); L.r(9, 18, 21, 5, 'w'); }, 'g', null, 'S');
    for (const [x, y] of [[11, 25], [17, 26], [23, 25], [14, 29], [20, 29], [26, 28]]) { c.p(x, y, '2'); c.p(x - 1, y + 1, 'B'); }
  }, c => {
    c.L(L => L.e(5.5, 5.5, 4, 4, 'y'), 'O', 'Y'); c.L(L => { L.e(7, 10, 3.5, 3, 'w'); L.e(11, 8.5, 4, 3.5, 'w'); L.r(5, 10, 10, 3, 'w'); }, 'g'); c.p(7, 15, '2'); c.p(11, 15, '2'); c.p(14, 14, '2');
  });
  const cursorArrow = ['k...........', 'kk..........', 'kwk.........', 'kwwk........', 'kwwwk.......', 'kwwwwk......', 'kwwwwwk.....', 'kwwwwwwk....', 'kwwwwwwwk...', 'kwwwwwwwwk..', 'kwwwwwkkkkk.', 'kwwkwwk.....', 'kwk.kwwk....', 'kk..kwwk....', 'k....kwwk...', '.....kwwk...', '......kk....'];
  I('cursors', c => {
    c.s(17, 2, cursorArrow, { w: 'l' }); c.s(10, 9, cursorArrow, { w: 'O' }); c.s(2, 14, cursorArrow);
    c.p([[27, 4, 'y'], [26, 5, 'y'], [28, 5, 'y'], [27, 6, 'y'], [27, 5, 'w'], [25, 20, 'f'], [24, 21, 'f'], [26, 21, 'f'], [25, 22, 'f'], [25, 21, 'w']]);
  }, c => {
    c.s(7, 0, ['k.....', 'kk....', 'klk...', 'kllk..', 'klllk.', 'kllkkk', 'kk.k..'].map(r => r)); c.s(1, 6, ['k.....', 'kk....', 'kwk...', 'kwwk..', 'kwwwk.', 'kwwwwk', 'kwwkkk', 'kk.kk.', 'k...kk']);
  });
  I('jackshots', c => {
    c.L(L => L.poly([[3, 9], [21, 4], [25, 20], [7, 25]], 'w'), 'k', null, 'S');
    c.L(L => L.r(8, 8, 22, 19, 'w'), 'k', null, 'S'); c.r(10, 10, 18, 13, 'O');
    for (let y = 10; y < 23; y++) c.h(10, y, 18, y < 13 ? '9' : y < 15 ? 'p' : y < 17 ? 'r' : y < 19 ? '3' : 'y');
    c.L(L => L.e(19, 18, 3.5, 3.5, 'y'), null); c.r(10, 19, 18, 4, '2'); c.h(14, 20, 10, 'y'); c.h(16, 21, 6, 'O'); c.h(12, 22, 4, 'i');
    c.L(L => L.r(19, 0, 12, 6, 'r'), 'm'); text(c, 20, 1, 'NEW', 'w');
  }, c => {
    c.L(L => L.r(1, 3, 14, 12, 'w'), 'k'); c.r(2, 4, 12, 9, 'p'); c.r(2, 7, 12, 2, 'r'); c.r(2, 9, 12, 1, 'O'); c.r(2, 10, 12, 3, '2'); c.r(7, 8, 3, 2, 'y'); c.h(5, 11, 6, 'y');
  });
  I('kpt', c => {
    c.L(L => L.r(1, 1, 30, 30, 'K'), 'k', 'g', 'k'); c.d(2, 2, 28, 28, 'K', 'k');
    ball(c, 13, 16, 9.5, 'r', 'R', 'm'); ball(c, 24, 9, 5, '2', 'i', 'n'); ball(c, 25, 24, 4, 'p', 'P', '9'); ball(c, 6, 6, 3, 'y', 'Y', 'O');
  }, c => {
    c.L(L => L.r(0, 0, 16, 16, 'K'), 'k'); ball(c, 7, 9, 5, 'r', 'R', 'm'); ball(c, 12, 4, 2.6, '2', 'i', 'n');
  });
  I('drsquigso', c => {
    const s = mon(c, 1, 1, 30, 22, 'n'); text(c, s.x + 2, s.y + 2, 'DR', 'y'); c.h(s.x + 2, s.y + 9, 16, 'w'); c.h(s.x + 2, s.y + 12, 10, 'w'); c.r(s.x + 13, s.y + 12, 2, 1, 'w');
    c.pl([[23, 23], [26, 26], [27, 30]], 'K'); c.pl([[20, 23], [17, 27], [12, 29]], 'K'); c.L(L => L.e(10, 29, 2.5, 2.5, 's'), 'k', 'w', 'g'); c.r(26, 29, 3, 2, 'K');
    c.L(L => L.e(23, 6, 3.5, 3.5, 's'), 'k', 'w', 'g'); c.L(L => L.e(23, 6, 1.5, 1.5, 'i'), null);
  }, c => {
    mon(c, 0, 0, 16, 12, 'n'); c.h(3, 4, 4, 'y'); c.h(3, 6, 7, 'w'); c.L(L => L.e(10, 13, 2, 2, 's'), 'k');
  });
  I('dotmatrix', c => {
    c.L(L => L.r(7, 0, 18, 12, 'w'), 'k'); for (let y = 1; y < 12; y += 2) { c.p(8, y, 'g'); c.p(23, y, 'g'); } lines(c, 10, 3, 12, 4, 'n', 2);
    c.L(L => L.r(1, 10, 30, 12, 'c'), 'k', 'w', 'C'); c.r(5, 12, 22, 2, 'K'); c.r(7, 12, 4, 2, 'q'); c.h(4, 17, 4, 'q'); c.r(24, 16, 2, 2, 'l'); c.r(27, 16, 2, 2, 'O');
    c.L(L => L.poly([[4, 22], [28, 22], [30, 31], [2, 31]], 'w'), 'k'); for (let y = 23; y < 31; y += 2) { c.p(5, y, 'g'); c.p(26, y, 'g'); } c.h(3, 26, 26, 'S'); lines(c, 8, 24, 16, 3, 'K', 2);
  }, c => {
    c.L(L => L.r(4, 0, 8, 5, 'w'), 'k'); c.L(L => L.r(0, 5, 16, 6, 'c'), 'k', 'w', 'C'); c.r(2, 6, 9, 1, 'K'); c.p(13, 8, 'l'); c.L(L => L.r(2, 11, 12, 5, 'w'), 'k'); c.p(3, 12, 'g'); c.p(12, 12, 'g'); c.p(3, 14, 'g'); c.p(12, 14, 'g'); c.h(5, 13, 6, 'K');
  });
  I('jsn', c => {
    c.L(L => { L.e(13, 27, 10, 7, '2'); }, 'k', 'B', 'n'); c.L(L => L.e(13, 14, 6, 6.5, 'z'), 'k', null, 'Z'); c.L(L => { L.e(13, 10, 6.2, 3.8, 'e'); L.r(7, 9, 2, 5, 'e'); }, null);
    c.p(11, 15, 'k'); c.p(15, 15, 'k'); c.pl([[11, 18], [12, 19], [14, 19], [15, 18]], 'm');
    c.L(L => { L.r(19, 1, 12, 9, 'y'); L.poly([[21, 10], [24, 10], [20, 13]], 'y'); }, 'k', 'Y', 'U'); text(c, 21, 3, 'HI', 'n'); c.p(29, 3, 'r'); c.p(29, 5, 'r'); c.p(29, 7, 'r');
  }, c => {
    c.L(L => L.e(6, 14, 5.5, 3.5, '2'), 'k'); c.L(L => L.e(6, 7.5, 3.4, 3.6, 'z'), 'k'); c.L(L => L.e(6, 5.4, 3.4, 1.8, 'e'), null); c.p(5, 8, 'k'); c.p(7, 8, 'k');
    c.L(L => L.r(10, 0, 6, 5, 'y'), 'k'); c.p(12, 2, 'n'); c.p(14, 2, 'n');
  });
  I('ringnet', c => {
    const ring = (front) => { for (let t = 0; t < 360; t += 2) { const a = t * Math.PI / 180, x = 16 + Math.cos(a) * 15, y = 17 + Math.sin(a) * 5.2; const isFront = Math.sin(a) > 0; if (isFront !== front) continue; const R = (x0, y0) => [x0 * .94 + y0 * .34 - 4.6, -x0 * .34 + y0 * .94 + 6.4]; const [px, py] = R(x, y); c.p(Math.round(px), Math.round(py), t % 6 ? 'y' : 'O'); c.p(Math.round(px), Math.round(py) + 1, 'O'); } };
    ring(false); ball(c, 16, 16, 9.5, 'p', 'P', '9'); ring(true);
    c.p([[27, 3, 'w'], [26, 4, 'y'], [28, 4, 'y'], [27, 5, 'y'], [4, 26, 'w']]);
  }, c => {
    ball(c, 8, 8, 5, 'p', 'P', '9'); c.pl([[0, 11], [4, 9], [12, 6], [15, 4]], 'y'); c.p(13, 5, 'O'); c.p(1, 11, 'O');
  });
  // a round bouncy Blobbit (Jack's own critter): centre, radius, body colour, light, dark
  function blobbit(c, cx, cy, r, k, kl, kd) {
    ball(c, cx, cy, r, k, kl, kd);
    const ew = Math.max(1, Math.round(r * .28)), eh = Math.max(2, Math.round(r * .42));
    for (const sx of [-1, 1]) { const ex = Math.round(cx + sx * r * .36 - ew / 2), ey = Math.round(cy - r * .32); c.r(ex, ey, ew + 1, eh, 'w'); c.r(ex + (sx < 0 ? ew - Math.max(0, ew - 1) : 0) + (sx > 0 ? 1 : 0), ey + eh - Math.max(1, eh - 2), Math.max(1, ew), Math.max(1, eh - 2), 'k'); }
    if (r > 4) { c.pl([[Math.round(cx - r * .3), Math.round(cy + r * .3)], [Math.round(cx - r * .15), Math.round(cy + r * .45)], [Math.round(cx + r * .15), Math.round(cy + r * .45)], [Math.round(cx + r * .3), Math.round(cy + r * .3)]], 'k'); }
  }
  I('bugsweeper', c => {
    c.bv(1, 1, 30, 30, 's', 'w', 'g'); c.p(2, 29, 'g');
    for (const [y, dx] of [[13, 1], [17, 0], [21, 1]]) { c.pl([[10 - dx, y], [6 - dx, y - 2], [4 - dx, y]], 'k'); c.pl([[22 + dx, y], [26 + dx, y - 2], [28 + dx, y]], 'k'); }
    c.pl([[13, 8], [10, 4], [8, 4]], 'k'); c.pl([[19, 8], [22, 4], [24, 4]], 'k');
    c.L(L => L.e(16, 10, 4.5, 3.5, 'K'), 'k'); c.p(14, 9, 'r'); c.p(18, 9, 'r');
    c.L(L => L.e(16, 19, 7.5, 9, 'r'), 'k', 'R', 'm'); c.v(16, 11, 17, 'k');
    for (const [x, y] of [[12, 15], [20, 15], [11, 21], [21, 21], [14, 25], [18, 25]]) c.r(x, y, 2, 2, 'k');
    c.p([[12, 13, 'w'], [13, 12, 'w']]);
  }, c => {
    c.bv(0, 0, 16, 16, 's', 'w', 'g'); c.pl([[4, 7], [2, 6]], 'k'); c.pl([[11, 7], [13, 6]], 'k'); c.pl([[4, 10], [2, 11]], 'k'); c.pl([[11, 10], [13, 11]], 'k');
    c.L(L => L.e(8, 5, 2.5, 2, 'K'), 'k'); c.L(L => L.e(8, 10, 3.5, 4, 'r'), 'k', 'R', 'm'); c.v(8, 7, 7, 'k'); c.p(6, 9, 'k'); c.p(10, 11, 'k'); c.pl([[6, 3], [5, 1]], 'k'); c.pl([[10, 3], [11, 1]], 'k');
  });
  I('messenger', c => {
    c.l(16, 20, 15, 30, 'd'); c.l(17, 20, 16, 30, 'G'); c.L(L => { L.e(22, 26, 5, 2.5, 'v'); }, 'D', 'V'); c.L(L => { L.e(9, 25, 4, 2, 'v'); }, 'D', 'V');
    [[16, 4], [25.5, 10.5], [22, 21], [10, 21], [6.5, 10.5]].forEach(([x, y], i) => c.L(L => L.e(x, y, 5.2, 5.2, i ? '3' : 'r'), 'm', i ? 'y' : 'R', i ? 'O' : 'm'));
    ball(c, 16, 13, 6.5, 'y', 'Y', 'O', 'h');
    c.r(13, 10, 2, 3, 'k'); c.r(18, 10, 2, 3, 'k'); c.p(13, 10, 'w'); c.p(18, 10, 'w'); c.pl([[12, 15], [14, 17], [18, 17], [20, 15]], 'k'); c.p(12, 14, 'k'); c.p(20, 14, 'k');
  }, c => {
    c.v(8, 11, 5, 'd'); c.p(6, 14, 'v'); c.p(10, 13, 'v');
    [[8, 2.5], [13, 6], [11, 11], [5, 11], [3, 6]].forEach(([x, y], i) => c.L(L => L.e(x, y, 2.6, 2.6, i ? '3' : 'r'), 'm', i ? 'y' : 'R'));
    c.L(L => L.e(8, 7, 3.5, 3.2, 'y'), 'h', 'Y'); c.p(7, 6, 'k'); c.p(9, 6, 'k'); c.h(7, 8, 3, 'k');
  });
  I('mahjong', c => {
    const t = (x, y) => { c.L(L => L.r(x, y, 12, 16, 'c'), 'k', 'w', 'C'); c.r(x + 1, y + 13, 11, 3, '1'); c.h(x + 1, y + 13, 11, 'v'); };
    t(2, 12); c.L(L => L.e(8, 17.5, 3.5, 3.5, 'r'), 'm', 'R'); c.L(L => L.e(8, 17.5, 1.6, 1.6, 'b'), null); c.p(8, 17, 'w');
    t(10, 8); for (const x of [13, 17]) { c.L(L => L.r(x, 10, 2, 9, 'v'), 'D', 'V'); c.h(x, 13, 2, 'D'); c.h(x, 16, 2, 'D'); }
    t(18, 3); c.s(20, 5, ['..rrr...', '.....r..', '.rrrrrr.', '...r....', '..r.r...', '.r...rr.', 'r.....r.'].map(r => r.replace(/r/g, 'k'))); c.r(21, 13, 5, 1, 'r');
  }, c => {
    c.L(L => L.r(1, 5, 7, 10, 'c'), 'k', 'w'); c.r(2, 12, 6, 2, '1'); c.L(L => L.e(4.5, 8.5, 2, 2, 'r'), 'm');
    c.L(L => L.r(7, 1, 8, 11, 'c'), 'k', 'w'); c.r(8, 9, 7, 2, '1'); c.v(9, 3, 5, 'v'); c.v(12, 3, 5, 'v'); c.h(9, 5, 4, 'D');
  });
  I('grotlings', c => {
    c.L(L => L.r(1, 23, 30, 8, 'e'), 'k', 'E', '6'); c.h(2, 23, 28, 'V'); c.h(2, 24, 28, 'v'); c.p([[6, 27, 'E'], [14, 29, 'E'], [24, 28, 'E']]);
    const man = (x, y, shirt, tool) => {
      c.L(L => { L.r(x + 1, y + 6, 5, 6, shirt); L.r(x + 1, y + 12, 2, 3, 'n'); L.r(x + 4, y + 12, 2, 3, 'n'); L.e(x + 3.5, y + 4.5, 2.6, 2.4, 'z'); L.e(x + 3.5, y + 2.5, 3.2, 2.3, 'y'); L.r(x, y + 3, 7, 1, 'y'); }, 'k');
      c.p(x + 2, y + 4, 'w'); c.p(x + 4, y + 2, 'Y'); c.h(x + 1, y + 6, 5, shirt === 'B' ? 'i' : 'V'); c.p(x + 3, y + 5, 'k'); c.p(x + 5, y + 5, 'k'); c.h(x + 1, y + 15, 2, 'k'); c.h(x + 4, y + 15, 2, 'k');
      if (tool) { c.pl([[x + 7, y + 7], [x + 10, y + 13]], 'e'); c.L(L => L.r(x + 9, y + 13, 3, 3, 's'), 'k'); }
    };
    man(2, 8, 'B'); man(12, 6, 'v', 1); man(23, 8, 'B');
    c.L(L => L.r(26, 3, 4, 4, 'r'), 'k'); c.v(25, 3, 20, 'K');
  }, c => {
    c.r(0, 13, 16, 3, 'e'); c.h(0, 13, 16, 'v');
    [[1, 3, 'B'], [9, 2, 'v']].forEach(([x, y, k]) => { c.L(L => { L.r(x + 1, y + 4, 4, 4, k); L.r(x + 1, y + 8, 4, 3, 'n'); L.e(x + 3, y + 3, 2, 2, 'z'); L.e(x + 3, y + 1.5, 2.6, 1.6, 'y'); }, 'k'); c.p(x + 2, y + 3, 'k'); c.p(x + 4, y + 3, 'k'); });
  });
  I('grotchi', c => {
    c.L(L => { L.e(16, 17, 12.5, 14, '7'); }, 'm', 'w', 'P'); c.sk(9, 8, 14, 12, 'o'); c.r(10, 9, 12, 10, '#9bbc0f');
    c.s(12, 10, ['...kkk...', '..kkkkk..', '.kk.k.kk.', '.kkkkkkk.', '.kk...kk.', '..kkkkk..', '..k...k..', '.........'], { k: '#0f380f', '.': '.' }); c.p(15, 11, '#9bbc0f');
    [[11, 24, 'r'], [16, 26, 'y'], [21, 24, '1']].forEach(([x, y, k]) => c.L(L => L.e(x, y, 1.8, 1.8, k), 'k')); c.L(L => L.r(14, 1, 4, 3, 's'), 'k');
  }, c => { c.L(L => L.e(8, 8.5, 6.5, 7.5, '7'), 'm', 'w'); c.r(4, 4, 8, 6, '#9bbc0f'); c.s(5, 5, ['.kkkk.', 'k.kk.k', 'kkkkkk', '.k..k.'], { k: '#0f380f', '.': '.' }); c.p(5, 12, 'r'); c.p(8, 13, 'y'); c.p(11, 12, '1'); });
  I('mates', c => {
    win32(c, 1, 12, 30, 19, 'w'); c.h(4, 21, 18, 'g'); c.h(4, 24, 14, 'g'); c.h(4, 27, 20, 'g');
    blobbit(c, 15, 8, 7.5, 'f', '7', 'p'); c.L(L => { L.e(10, 15, 2.5, 1.6, 'f'); L.e(20, 15, 2.5, 1.6, 'f'); }, 'k', '7');
    c.pl([[11, 1], [9, 0]], 'p'); c.pl([[19, 1], [21, 0]], 'p');
  }, c => {
    win16(c, 0, 7, 16, 9, 'w'); c.h(2, 12, 9, 'g'); blobbit(c, 8, 5, 4.5, 'f', '7', 'p');
  });
  I('freesurfa', c => {
    for (let x = 0; x < 32; x++) { const y = 22 + Math.round(Math.sin(x / 3) * 1.5); c.r(x, y, 1, 32 - y, '2'); c.p(x, y, 'i'); if (x % 5 === 0) c.p(x, y - 1, 'w'); }
    globe(c, 13, 13, 9.5);
    c.L(L => L.poly([[3, 27], [26, 20], [29, 21], [8, 29]], 'O'), 'k', 'y', '3'); c.pl([[7, 27], [25, 21]], 'r');
  }, c => {
    c.r(0, 11, 16, 5, '2'); c.h(0, 11, 16, 'i'); globe(c, 7, 7, 5.5); c.L(L => L.poly([[1, 14], [13, 10], [15, 11], [4, 15]], 'O'), 'k');
  });
  I('stocks', c => {
    const s = mon(c, 1, 1, 30, 22, 'k'); for (let x = s.x + 3; x < s.x + s.w; x += 4) for (let y = s.y + 1; y < s.y + s.h; y += 2) c.p(x, y, 'G');
    c.pl([[s.x + 1, s.y + 12], [s.x + 5, s.y + 9], [s.x + 8, s.y + 11], [s.x + 12, s.y + 6], [s.x + 15, s.y + 8], [s.x + 19, s.y + 3], [s.x + 22, s.y + 2]], 'l');
    c.pl([[s.x + 1, s.y + 13], [s.x + 5, s.y + 10], [s.x + 8, s.y + 12], [s.x + 12, s.y + 7], [s.x + 15, s.y + 9], [s.x + 19, s.y + 4]], 'G');
    c.L(L => L.poly([[s.x + 20, s.y + 1], [s.x + 23, s.y + 1], [s.x + 23, s.y + 4]], 'l'), null);
  }, c => {
    mon(c, 0, 0, 16, 12, 'k'); c.pl([[3, 8], [5, 6], [7, 7], [10, 4], [12, 3]], 'l');
  });
  I('bank', c => {
    c.L(L => L.poly([[16, 1], [30, 9], [2, 9]], 's'), 'k', 'w', 'g'); c.L(L => L.e(16, 6, 2, 2, 'u'), 'h');
    c.L(L => L.r(3, 9, 26, 3, 's'), 'k', 'w', 'g');
    for (const x of [5, 11, 18, 24]) { c.L(L => L.r(x, 12, 3, 13, 'S'), 'k', 'w', 'g'); }
    c.L(L => L.r(2, 25, 28, 3, 's'), 'k', 'w', 'g'); c.L(L => L.r(1, 28, 30, 3, 's'), 'k', 'w', 'g');
    c.L(L => L.r(14, 16, 4, 9, 'n'), 'k');
  }, c => {
    c.L(L => L.poly([[8, 0], [15, 4], [1, 4]], 's'), 'k', 'w'); c.r(1, 4, 14, 2, 's'); for (const x of [2, 6, 10, 13]) c.L(L => L.r(x, 6, 1, 6, 'S'), 'k'); c.L(L => L.r(0, 12, 16, 3, 's'), 'k', 'w');
  });
  I('lotto', c => {
    ball(c, 14, 15, 12.5, 'y', 'Y', 'O', 'h'); c.L(L => L.e(14, 15, 7.5, 7.5, 'w'), 'k'); text(c, 9, 13, '49', 'k'); c.r(9, 13, 3, 5, '_'); c.s(9, 13, ['k.k', 'k.k', 'kkk', '..k', '..k']); c.s(14, 13, ['kkk', 'k.k', 'kkk', '..k', 'kkk']);
    ball(c, 26, 26, 5, 'r', 'R', 'm'); ball(c, 27, 7, 3.5, '2', 'i', 'n');
  }, c => {
    ball(c, 7, 8, 6.5, 'y', 'Y', 'O', 'h'); c.L(L => L.e(7, 8, 3.5, 3.5, 'w'), 'k'); c.s(5, 6, ['k.k', 'kkk', '..k', '..k']); ball(c, 13.5, 13, 2.4, 'r', 'R', 'm');
  });
  I('kart', c => {
    c.r(0, 25, 32, 6, 'K'); c.h(0, 25, 32, 'g'); for (let x = 0; x < 32; x += 6) c.r(x, 28, 3, 1, 'w');
    c.L(L => { L.poly([[3, 20], [8, 15], [24, 15], [29, 19], [29, 22], [3, 22]], 'r'); }, 'k', 'R', 'm'); c.L(L => L.r(24, 12, 6, 3, 'K'), 'k');
    c.L(L => L.e(15, 11, 4, 4, 'y'), 'k', 'Y', 'O'); c.r(15, 10, 4, 2, 'i'); c.h(15, 10, 4, 'w');
    for (const x of [7, 24]) { c.L(L => L.e(x, 23, 3.4, 3.4, 'k'), null); c.L(L => L.e(x, 23, 1.4, 1.4, 's'), null); }
    c.h(0, 17, 3, 's'); c.h(0, 20, 2, 's'); c.r(10, 18, 4, 2, 'w'); text(c, 10, 17, '7', 'k');
  }, c => {
    c.r(0, 13, 16, 3, 'K'); c.L(L => L.poly([[1, 10], [4, 7], [12, 7], [15, 9], [15, 11], [1, 11]], 'r'), 'k', 'R'); c.L(L => L.e(8, 5, 2.4, 2.4, 'y'), 'k'); c.L(L => { L.e(4, 12, 2, 2, 'k'); L.e(12, 12, 2, 2, 'k'); }, null);
  });
  I('farm', c => {
    c.r(0, 26, 32, 6, 'v'); c.h(0, 26, 32, 'V'); c.L(L => L.r(0, 26, 32, 6, 'v'), 'D');
    c.L(L => L.poly([[4, 13], [14, 4], [24, 13], [24, 28], [4, 28]], 'r'), 'k', 'R', 'm'); c.L(L => L.poly([[2, 14], [14, 2], [26, 14], [24, 15], [14, 6], [4, 15]], 'w'), 'k');
    c.L(L => L.r(9, 17, 10, 11, 'm'), 'k'); c.pl([[9, 17], [18, 27]], 'w'); c.pl([[18, 17], [9, 27]], 'w'); c.v(14, 17, 11, 'k'); c.L(L => L.r(12, 9, 4, 4, 'k'), 'w');
    c.L(L => { L.r(26, 9, 5, 19, 's'); L.e(28.5, 9, 2.5, 2, 's'); }, 'k', 'w', 'g'); c.h(26, 14, 5, 'g'); c.h(26, 20, 5, 'g');
    blobbit(c, 29, 27, 2.6, 'f', '7', 'p');
  }, c => {
    c.r(0, 13, 16, 3, 'v'); c.L(L => L.poly([[1, 7], [7, 2], [13, 7], [13, 14], [1, 14]], 'r'), 'k', 'R'); c.L(L => L.r(4, 9, 6, 5, 'm'), 'k'); c.pl([[4, 9], [9, 13]], 'w'); c.pl([[9, 9], [4, 13]], 'w');
  });
  I('ticker', c => {
    c.L(L => L.r(1, 9, 30, 14, 'K'), 'k', 'g', 'k'); c.r(3, 11, 26, 10, 'k');
    for (let y = 12; y < 20; y += 2) for (let x = 4; x < 28; x += 2) c.p(x, y, '#2a1a00');
    c.s(4, 12, ['O.O.OOO.O...O.O..', 'O.O.O.O.OO..O.OO.', '.O..O.O.O.O.O.O.O', '.O..OOO.O..OO.O..'].map(r => r), { O: 'O', '.': '.' });
    c.L(L => L.poly([[24, 12], [27, 15], [21, 15]], 'l'), null); c.r(23, 15, 2, 4, 'l');
    c.L(L => L.r(13, 23, 6, 4, 's'), 'k', 'w', 'g'); c.L(L => L.r(9, 27, 14, 2, 's'), 'k', 'w');
  }, c => {
    c.L(L => L.r(0, 4, 16, 8, 'k'), 'g'); c.s(2, 6, ['O.O.OO', '.O..O.', '.O..OO'], { O: 'O', '.': '.' }); c.p(12, 6, 'l'); c.r(11, 7, 3, 1, 'l'); c.v(12, 8, 2, 'l'); c.r(6, 12, 4, 2, 's');
  });

  // ================================================================ public API
  const cache = {};
  function grid(name, size, o) {
    const d = D[name] || D.exe || D.txt; const n = o && o.art && d[o.art] ? o.art : d[24] && !d[32] ? 24 : size >= 40 && d[48] ? 48 : size > 20 ? 32 : 16;
    const c = ctx(n); (d[n] || d[32] || d[16] || d[24])(c);
    if (o && o.lnk && D.lnkArrow && D.lnkArrow[n]) D.lnkArrow[n](c);
    if (!(o && o.noShadow) && !d.ns) c.shadow();
    return c;
  }
  function get(name, size, o) {
    size = size || 32;
    const key = name + '|' + size + '|' + (o ? JSON.stringify(o) : '');
    if (!cache[key]) { const c = grid(name, size, o); cache[key] = toSvg(c.a, c.n, size); }
    return cache[key];
  }
  const img = (name, size, o) => 'data:image/svg+xml,' + encodeURIComponent(get(name, size, o));
  // dual-size icon: carries the 32px art AND the hand-tuned 16px art; CSS (below) shows the 16px art in 16px places
  // (title bars, taskbar, menus, small-icon views) and the 32px art everywhere else.
  function icon(name, o) {
    const key = name + '|dual|' + (o ? JSON.stringify(o) : '');
    if (!cache[key]) {
      const inner = s => s.replace(/^<svg[^>]*>|<\/svg>$/g, '');
      const d = D[name] || {}, big = d[48] ? `<g class="j48" transform="scale(.66667)">${inner(get(name, 48, o))}</g>` : '';
      cache[key] = `<svg xmlns="http://www.w3.org/2000/svg" class="jd${big ? ' h48' : ''}" viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges" aria-hidden="true"><g class="j32">${inner(get(name, 32, o))}</g><g class="j16" transform="scale(2)">${inner(get(name, 16, o))}</g>${big}</svg>`;
    }
    return cache[key];
  }
  const SMALL = ['.tb .ico', '.tbtn .tico', '.menu .mico', '.fx-i16', '.ff-i16', '.of-i16', '.xbody .xi', '.xi', '.ff-exp.list .ff-ic', '.pgk-small .pgk-ic', '.quick', '#tray', '.fm-row', '.pga-open .xi', '.np-up', '.so-rico', '.so-imico', '.fx-aico', '.fx-list .fx-ic', '.fx-details .fx-ic', '.fx-small .fx-ic', '.fx-tree', '.adin', '.links', '.j16ctx', '#startMenu .smi16', '.ct-m-b', '.of-tb', '.dos-tb'];
  try {
    const st = document.createElement('style'); st.id = 'jicon-css';
    st.textContent = `svg.jd>.j16,svg.jd>.j48{display:none}body.pg-bigicons .dicon svg.jd.h48>.j32{display:none}body.pg-bigicons .dicon svg.jd.h48>.j48{display:inline}${SMALL.map(q => q + ' svg.jd>.j32').join(',')}{display:none}${SMALL.map(q => q + ' svg.jd>.j16').join(',')}{display:inline}` ;
    (document.head || document.documentElement).appendChild(st);
  } catch (e) { /* no DOM (tests) */ }
  const ALIAS = { mycomputer: 'computer', mydocs: 'documents', mydocuments: 'documents', ie: 'jacknet', internet: 'jacknet', browser: 'jacknet', outlook: 'mail', email: 'mail', explorer: 'folderOpen', dir: 'folder', calculator: 'calc', solitaire: 'cards', minesweeper: 'sweeper', winamp: 'jackamp', msdos: 'dos', basic: 'jbasic', encyclopedia: 'carta', grot: 'gubbinz', rubik: 'cube', tetris: 'blocks', skull: 'ork', warn: 'warning', q: 'question', recyclebin: 'recycle', trash: 'recycle', hd: 'hdd', disk: 'hdd', cdrom: 'cdrom', lnk: 'url', html: 'webpage', htm: 'webpage', text: 'txt', bitmap: 'bmp', image: 'bmp', exefile: 'exe', program: 'exe', printers: 'printer', people: 'user', profile: 'user', star: 'favorites' };
  const real = name => D[name] ? name : (ALIAS[name] || ALIAS[String(name).toLowerCase()] || name);

  // ---- the JackOS logo. <= 32: pixel art. Larger: a smooth waving cube-face flag with speed streaks
  let uid = Math.floor(Math.random() * 1e6); // gradient ids must be unique per page
  function bigLogo(size) {
    const gid = 'jsheen' + (++uid);
    const k = 13, polys = cubeTwist(k, 52, 70, 0.33, 0.12), f = n => n.toFixed(1);
    const path = q => 'M' + q.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
    const body = polys.filter(p => p[1] === 'k'), st = polys.filter(p => p[1] !== 'k');
    let o = '';
    o += `<g transform="translate(2.5 3)" opacity=".3">${body.map(p => `<path d="${path(p[0])}"/>`).join('')}</g>`;
    o += body.map(p => `<path d="${path(p[0])}" fill="#141414" stroke="#141414" stroke-width="1.6" stroke-linejoin="round"/>`).join('');
    o += st.map(p => `<path d="${path(p[0])}" fill="${HEX[p[1]]}" stroke="${HEX[p[1]]}" stroke-width="1.4" stroke-linejoin="round"/><path d="${path(p[0])}" fill="url(#${gid})"/>`).join('');
    // twist arrows round the top layer + a sparkle
    o += `<path d="M14 26 Q20 14 34 10" fill="none" stroke="#ff7a00" stroke-width="3" stroke-linecap="round"/><path d="M31 5 L38 9 L31 14 Z" fill="#ff7a00"/>`;
    o += `<path d="M86 6 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" fill="#fff" stroke="#ffd200" stroke-width="1"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>${o}</svg>`;
  }
  // ---- the browser's animated "busy" throbber: the JackNet globe spinning, a spark orbiting on the ring.
  // Returns a horizontal sprite strip (data: URI) of `frames` frames, each `n` px square.
  function throbber(n, frames) {
    n = n || 28; frames = frames || 12;
    const key = 'throb|' + n + '|' + frames; if (cache[key]) return cache[key];
    const cx = n / 2 - 0.2, cy = n / 2, r = n * 0.33, rx = n * 0.47, ry = n * 0.155, ang = -0.4, th = n * 0.08;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    let body = '';
    for (let f = 0; f < frames; f++) {
      const c = ctx(n), t = f / frames, sp = t * Math.PI * 2;
      const sx = cx + (Math.cos(sp) * rx) * ca - (Math.sin(sp) * ry) * sa, sy = cy + (Math.cos(sp) * rx) * sa + (Math.sin(sp) * ry) * ca;
      const front = Math.sin(sp) > 0;
      ring(c, cx, cy, rx, ry, ang, th, false);
      if (!front) spark(c, Math.round(sx), Math.round(sy), false);
      earth(c, cx, cy, r, { rot: -15 - t * 360, levels: 5, dither: true, spec: true });
      ring(c, cx, cy, rx, ry, ang, th, true);
      if (front) spark(c, Math.round(sx), Math.round(sy), true);
      body += `<g transform="translate(${f * n} 0)">${toSvg(c.a, n, n).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n * frames} ${n}" width="${n * frames}" height="${n}" shape-rendering="crispEdges">${body}</svg>`;
    return (cache[key] = { url: 'data:image/svg+xml,' + encodeURIComponent(svg), n, frames });
  }
  function logo(size) { size = size || 32; return size <= 32 ? get('logo', size) : bigLogo(size); }
  // "JackOS 98" wordmark for splash / About boxes. o.light = white text (for dark or sky backgrounds)
  function wordmark(o) {
    o = o || {}; const fg = o.light ? '#fff' : '#000', sh = o.light ? '#000' : '#9a9a9a', w = o.width || 420;
    const font = "'Franklin Gothic Medium','Franklin Gothic','Arial Narrow',Arial,Helvetica,sans-serif";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="${w}" height="${Math.round(w * 120 / 420)}" role="img" aria-label="JackOS 98">` +
      `<g transform="translate(4 6) scale(1.1)">${bigLogo(100).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>` +
      `<text x="138" y="30" font-family="${font}" font-size="15" font-weight="bold" letter-spacing="3" fill="${fg}" opacity=".8">JACKSOFT&#174;</text>` +
      `<text x="134" y="88" font-family="${font}" font-size="62" fill="${sh}" opacity=".5" transform="translate(3 3)">Jack<tspan font-weight="bold">OS</tspan></text>` +
      `<text x="134" y="88" font-family="${font}" font-size="62" fill="${fg}">Jack<tspan font-weight="bold">OS</tspan></text>` +
      `<text x="350" y="56" font-family="${font}" font-size="34" font-weight="bold" font-style="italic" fill="#ff7a00" stroke="#7a2a00" stroke-width="1">98</text>` +
      `<rect x="138" y="98" width="270" height="3" fill="${fg}" opacity=".35"/></svg>`;
  }
  // the Start menu's vertical side banner (21px wide), text reads bottom-to-top
  function banner(h) {
    h = h || 320;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 ${h}" width="21" height="${h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs><linearGradient id="jban${++uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#000080"/><stop offset="1" stop-color="#1084d0"/></linearGradient></defs><rect width="21" height="${h}" fill="url(#jban${uid})"/>` +
      `<text transform="translate(16 ${h - 6}) rotate(-90)" font-family="'Arial Black','Franklin Gothic Medium',Arial,sans-serif" font-size="17" fill="#c0c0c0">Jack<tspan font-weight="bold" fill="#fff">OS</tspan><tspan font-size="13" fill="#ff9a40" dx="2" font-style="italic">98</tspan></text></svg>`;
  }
  // JackOS 98-style wizard side panel (100x160): dithered navy->teal sky, a spotlight, the subject icon drawn big, a magic wand.
  // main/extra are icon names. Used by every wizard in apps-system.js / system-progs.js / system-welcome.js
  function wizArt(main, extra) {
    const W = 100, H = 300, SKY = 220, cols = ['#000050', '#000068', '#000080', '#0a2a9a', '#1048b0', '#1468c0', '#107ab8', '#0a8aa8', '#008a98', '#008080'];
    let r = '';
    const band = SKY / cols.length;
    cols.forEach((k, i) => { r += `<rect y="${Math.floor(i * band)}" width="${W}" height="${Math.ceil(band) + 1}" fill="${k}"/>`; });
    for (let i = 1; i < cols.length; i++) { const y = Math.floor(i * band) - 2; for (let x = (i & 1) * 2; x < W; x += 4) r += `<rect x="${x}" y="${y}" width="2" height="2" fill="${cols[i]}"/><rect x="${x + 2}" y="${y + 2}" width="2" height="2" fill="${cols[i - 1]}"/>`; }
    for (let i = 0; i < 40; i++) { const x = (i * 37 + 11) % 96, y = (i * 53 + 7) % 130; r += `<rect x="${x}" y="${y}" width="${i % 5 ? 1 : 2}" height="${i % 5 ? 1 : 2}" fill="#fff" opacity="${i % 3 ? .45 : .9}"/>`; }
    r += `<rect y="${SKY}" width="${W}" height="${H - SKY}" fill="#007474"/>`;
    for (let j = 0; j < 7; j++) r += `<ellipse cx="50" cy="196" rx="${44 - j * 5}" ry="${Math.max(2, 13 - j * 1.6)}" fill="#fff" opacity=".07"/>`;
    r += `<ellipse cx="50" cy="194" rx="30" ry="6" fill="#000" opacity=".28"/>`;
    const inner = svg => svg.replace(/^<svg[^>]*>|<\/svg>$/g, '');
    r += `<g transform="translate(16 127) scale(2)">${inner(get(real(main), 32))}</g>`;
    if (extra) r += `<g transform="translate(56 169)">${inner(get(real(extra), 32))}</g>`;
    r += `<path d="M66 113l14-14" stroke="#000" stroke-width="3"/><path d="M66 113l14-14" stroke="#404040" stroke-width="1.4"/><path d="M78 101l3-3" stroke="#fff" stroke-width="3"/>`;
    const star = (x, y, s, k) => `<path d="M${x} ${y - s}h1v${s * 2 + 1}h-1zM${x - s} ${y}h${s * 2 + 1}v1h-${s * 2 + 1}z" fill="${k}"/><rect x="${x - 1}" y="${y - 1}" width="3" height="3" fill="${k}" opacity=".6"/>`;
    r += star(86, 91, 5, '#ffff80') + star(74, 85, 3, '#fff') + star(92, 105, 3, '#fff') + star(62, 95, 2, '#ffff80') + star(88, 79, 2, '#fff');
    r += `<g transform="translate(6 212)">${inner(logo(16))}</g><text x="25" y="224" font-family="Tahoma,Arial,sans-serif" font-size="9" font-weight="bold" fill="#c0e8ff">JackOS</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
  }
  window.JICON = { throbber, wizArt, get: (n, s, o) => get(real(n), s, o), img: (n, s, o) => img(real(n), s, o), icon: (n, o) => icon(real(n), o), logo, wordmark, banner, PAL, has: n => !!D[real(n)], get names() { return Object.keys(D).filter(n => n !== 'lnkArrow'); }, _D: D, _ctx: ctx, _svg: toSvg };

  // ---- the hidden icon library page: jacklm.com/icons
  function libraryPage() {
    const names = window.JICON.names, card = (n, bg) => `<div style="width:84px;padding:6px 2px;text-align:center;font:11px Tahoma,sans-serif;color:${bg === 't' ? '#fff' : '#000'}"><div style="display:flex;gap:6px;justify-content:center;align-items:flex-end;height:34px">${get(n, 32)}${get(n, 16)}</div><div style="margin-top:3px">${n.replace('drsquigso', 'drchatso')}</div></div>`;
    const sect = bg => `<div style="display:flex;flex-wrap:wrap;background:${bg === 't' ? '#008080' : '#fff'};border:2px inset #fff;padding:6px;margin:6px 0">${names.map(n => card(n, bg)).join('')}</div>`;
    return `<div style="padding:12px;font:12px Tahoma,sans-serif;background:#c0c0c0;color:#000">` +
      `<div style="background:#fff;border:2px inset #fff;padding:10px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">${wordmark({ width: 340 })}<div style="flex:1;min-width:200px"><b style="font-size:16px">JackOS 98 Icon Library</b><br>Official icons for JackOS 98, drawn one pixel at a time in 256 glorious colours. ${names.length} icons, each hand-made at 32x32 and 16x16.<br><br><i>JACKSOFT Design Team, Building 1 (Jack's bedroom). Do not copy, or Mom will be told.</i></div></div>` +
      `<div style="display:flex;gap:10px;align-items:flex-end;margin:10px 0;flex-wrap:wrap"><div style="background:#008080;padding:8px;border:2px inset #fff">${logo(16)} ${logo(32)} ${logo(96)}</div><div style="background:#000;padding:8px;border:2px inset #fff">${wordmark({ light: true, width: 260 })}</div><div style="border:2px inset #fff;line-height:0">${banner(150)}</div></div>` +
      `<h3 style="margin:10px 0 2px">On the desktop</h3>${sect('t')}<h3 style="margin:10px 0 2px">On white</h3>${sect('w')}</div>`;
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (window.IE && IE.addPage) IE.addPage('icons', 'JackOS Icon Library', libraryPage);
    // the magazine's 88x31 buttons get a little pixel icon each, like proper 1999 buttons
    const B88 = { 'b-ie': 'jacknet', 'b-np': 'notepad', 'b-y2k': 'y2k', 'b-wa': 'blocks', 'b-n64': 'joystick', 'b-800': 'display', 'b-tris': 'blocks', 'b-cube': 'cube', 'b-sw': 'screensaver', 'b-quiz': 'question', 'b-pp': 'corkboard', 'b-com': 'irc' };
    document.querySelectorAll('.badges88 .b88').forEach(b => { const k = Object.keys(B88).find(c => b.classList.contains(c)); if (k && D[B88[k]]) { b.style.setProperty('--ic', `url("${img(B88[k], 24)}")`); b.classList.add('ic'); } });
    // the browser's throbber box becomes the animated JackNet globe (still when idle, spinning while a page loads)
    const g = document.querySelector('#throbber .globe');
    if (g) {
      const T = throbber(28, 12), st = document.createElement('style');
      st.textContent = `.throbber .globe.jt{width:28px;height:28px;border-radius:0;background:url("${T.url}") 0 0/${28 * 12}px 28px no-repeat;overflow:visible}.throbber .globe.jt::before,.throbber .globe.jt::after{content:none;display:none}.throbber.busy .globe.jt{animation:jthrob 1.2s steps(12) infinite}@keyframes jthrob{to{background-position:-${28 * 12}px 0}}`;
      document.head.appendChild(st); g.classList.add('jt');
    }
  });
})();
