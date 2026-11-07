'use strict';
// Level-design tooling (not shipped to players). Uses the real engine for every judgement.
const { step, play, solve, makeState, isDead, tileCount } = require('../engine');
const isT = c => c !== '.' && c !== '#';
const pd = g => { const p = {}; g.forEach((r, i) => [...r].forEach((c, j) => { if (isT(c)) (p[c] = p[c] || []).push([i, j]); }));
  return Object.values(p).reduce((s, [a, b]) => s + Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]), 0); };
function countOpt(s0, n, cap) { let layer = new Map([[JSON.stringify(s0.grid) + s0.last, { s: s0, c: 1 }]]);
  for (let d = 0; d < n; d++) { const nx = new Map();
    for (const { s, c } of layer.values()) for (const m of 'UDLR') { const r = play(s, m); if (r.noop) continue;
      const k = r.state.won ? 'WIN' : JSON.stringify(r.state.grid) + r.state.last; const e = nx.get(k); if (e) e.c += c; else nx.set(k, { s: r.state, c }); }
    layer = nx; if (layer.size > cap) return 99; }
  return layer.get('WIN') ? layer.get('WIN').c : 0; }
function analyze(rows, lo, hi) {
  const s0 = makeState(rows), E = solve(s0); if (!E.solvable || E.optimal < lo || E.optimal > hi) return null;
  const nOpt = countOpt(s0, E.optimal, 60000); if (nOpt > 2) return null;
  const N = solve(s0, { echo: false }); let ns = s0; if (N.solvable) for (const d of N.solution) ns = play(ns, d).state;
  let s = s0, echoMatches = 0, counter = false;
  for (const d of E.solution) { const a = step(s.grid, d); if (tileCount(a.grid) && s.last) { const e = step(a.grid, s.last); echoMatches += e.matches; if (tileCount(e.grid) && pd(e.grid) > pd(a.grid)) counter = true; } s = play(s, d).state; }
  let bad = 0, dead = 0, noop = 0;
  for (const d of 'UDLR') { const r = play(s0, d); if (r.noop) { noop++; continue; } if (isDead(r.state)) dead++; else if (solve(r.state).optimal + 1 > E.optimal) bad++; }
  return { rows, E: E.optimal, sol: E.solution.join(''), nOpt, naiveFails: N.solvable && !ns.won, echoMatches, counter, bad, dead, noop,
    pairs: new Set(rows.join('').replace(/[.#]/g, '')).size, obs: (rows.join('').match(/#/g) || []).length, R: rows.length, C: rows[0].length };
}
// canonical form under the 8 board symmetries + colour renaming (the rules are rotation/reflection symmetric)
function canon(rows) { let g = rows.map(r => [...r]), best = null;
  const rot = m => m[0].map((_, j) => m.map(r => r[j]).reverse()), flip = m => m.map(r => [...r].reverse());
  for (let f = 0; f < 2; f++) { for (let k = 0; k < 4; k++) { const map = {}; let n = 0;
      const s = g.map(r => r.map(ch => (isT(ch) ? (map[ch] = map[ch] || 'ABC'[n++]) : ch)).join('')).join('/'); if (!best || s < best) best = s; g = rot(g); } g = flip(g); }
  return best; }
module.exports = { analyze, canon };
