'use strict';
// ONE MORE MOVE — core engine + exact BFS solver. UI-independent, pure functions.
// Cells: '.' empty, '#' obstacle, any other char = tile colour (exactly 2 per colour).
const DIRS = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
const isTile = ch => ch !== '.' && ch !== '#';
const parse = rows => rows.map(r => r.split(''));
const clone = g => g.map(r => r.slice());
const gridKey = g => g.map(r => r.join('')).join('/');
const tileCount = g => g.reduce((n, r) => n + r.filter(isTile).length, 0);

// One resolution step (the single source of truth for movement).
// 1) Every tile is a mover. 2) Iteratively block movers whose target is out of bounds,
// an obstacle, or a non-moving tile. Repeat to fixpoint (chains move together; vacated cells OK).
// 3) From that snapshot, a blocked tile whose target holds a blocked same-colour tile matches;
//    all matches are decided simultaneously. 4) Movers shift one cell; matched tiles vanish.
//    Vacated cells trigger NO further movement in this step.
function step(g, d) {
  const [dr, dc] = DIRS[d], H = g.length, W = g[0].length;
  const mv = new Set();
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (isTile(g[r][c])) mv.add(r * W + c);
  for (let changed = true; changed;) {
    changed = false;
    for (const k of [...mv]) {
      const nr = ((k / W) | 0) + dr, nc = (k % W) + dc;
      const blocked = nr < 0 || nr >= H || nc < 0 || nc >= W || g[nr][nc] === '#' ||
        (isTile(g[nr][nc]) && !mv.has(nr * W + nc));
      if (blocked) { mv.delete(k); changed = true; }
    }
  }
  const matched = new Set();
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    if (!isTile(g[r][c]) || mv.has(r * W + c)) continue;
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
    if (g[nr][nc] === g[r][c] && !mv.has(nr * W + nc)) { matched.add(r * W + c); matched.add(nr * W + nc); }
  }
  const out = g.map(r => r.map(ch => (isTile(ch) ? '.' : ch)));
  const tiles = []; // presentation trace only (does not affect rules): where each tile came from / went
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const k = r * W + c;
    if (!isTile(g[r][c])) continue;
    if (matched.has(k)) { tiles.push({ from: [r, c], to: [r, c], ch: g[r][c], matched: true }); continue; }
    const m = mv.has(k), to = m ? [r + dr, c + dc] : [r, c];
    out[to[0]][to[1]] = g[r][c]; tiles.push({ from: [r, c], to, ch: g[r][c], matched: false });
  }
  return { grid: out, changed: mv.size > 0 || matched.size > 0, matches: matched.size / 2, tiles };
}

const makeState = rows => ({ grid: parse(rows), last: null, moves: 0, won: false });

// A full player turn: player step, then Echo of the PREVIOUS input (skipped if board cleared).
// No-op player inputs are ignored entirely (no move, no change to stored direction).
function play(state, d, opts) {
  const echoOn = !(opts && opts.echo === false); // analysis only: lets the solver measure Echo's contribution
  if (state.won) return { state, noop: true, events: [] };
  const a = step(state.grid, d);
  if (!a.changed) return { state, noop: true, events: [] };
  const events = [{ type: 'player', dir: d, matches: a.matches, tiles: a.tiles }];
  let grid = a.grid;
  if (echoOn && tileCount(grid) > 0 && state.last) {
    const e = step(grid, state.last);
    events.push({ type: 'echo', dir: state.last, matches: e.matches, moved: e.changed, tiles: e.tiles });
    grid = e.grid;
  }
  return { state: { grid, last: d, moves: state.moves + 1, won: tileCount(grid) === 0 }, noop: false, events };
}

// Exact BFS over (board, stored direction), using play() itself — no separate solver logic.
function solve(state, opts) {
  if (state.won) return { solvable: true, solution: [], optimal: 0 };
  const seen = new Set([gridKey(state.grid) + state.last]);
  let frontier = [{ s: state, path: [] }];
  while (frontier.length) {
    const next = [];
    for (const { s, path } of frontier) for (const d of 'UDLR') {
      const r = play(s, d, opts);
      if (r.noop) continue;
      const p = path.concat(d);
      if (r.state.won) return { solvable: true, solution: p, optimal: p.length };
      const k = gridKey(r.state.grid) + r.state.last;
      if (!seen.has(k)) { seen.add(k); next.push({ s: r.state, path: p }); }
    }
    frontier = next;
  }
  return { solvable: false, solution: null, optimal: null, statesExplored: seen.size };
}
const isDead = s => !s.won && !solve(s).solvable;
const stars = (moves, optimal) => (moves <= optimal ? 3 : moves <= optimal + 2 ? 2 : 1);

module.exports = { step, play, solve, isDead, stars, makeState, parse, gridKey, tileCount };
