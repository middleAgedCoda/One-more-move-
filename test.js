'use strict';
const assert = require('assert');
const { step, play, solve, isDead, stars, makeState, gridKey } = require('./engine');
const rows = g => g.map(r => r.join(''));
const run = (lv, seq) => seq.split('').reduce((s, d) => play(s, d).state, makeState(lv));
let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('  PASS', name); } catch (e) { fail++; console.log('  FAIL', name, '\n      ', e.message); } };
const mv = (r, d) => rows(step(makeState(r).grid, d).grid);

console.log('Movement');
t('all four directions move one cell', () => {
  assert.deepStrictEqual(mv(['...', '.A.', '...', 'B..'], 'U'), ['.A.', '...', 'B..', '...']);
  assert.deepStrictEqual(mv(['...', '.A.', '...'], 'D'), ['...', '...', '.A.']);
  assert.deepStrictEqual(mv(['.A.'], 'L'), ['A..']);
  assert.deepStrictEqual(mv(['.A.'], 'R'), ['..A']);
});
t('wall blocks', () => assert.deepStrictEqual(mv(['A..'], 'L'), ['A..']));
t('obstacle blocks', () => assert.deepStrictEqual(mv(['A#.'], 'R'), ['A#.']));
t('chain moves together into vacated cell', () => assert.deepStrictEqual(mv(['AB.'], 'R'), ['.AB']));
t('chain blocked by wall at head stays put', () => assert.deepStrictEqual(mv(['.AB'], 'R'), ['.AB']));
console.log('Matching');
t('non-matching tiles never vanish', () => assert.deepStrictEqual(mv(['AB'], 'R'), ['AB']));
t('same-colour blocked pair matches', () => assert.deepStrictEqual(mv(['.AA'], 'R'), ['...']));
t('lockstep same-colour tiles do NOT match', () => assert.deepStrictEqual(mv(['AA.'], 'R'), ['.AA']));
t('multiple simultaneous pairs', () => assert.deepStrictEqual(mv(['AA', 'BB'], 'R'), ['..', '..']));
t('pair against obstacle matches', () => assert.deepStrictEqual(mv(['A#', 'AA'], 'R'), ['A#', '..']));
t('vacated cells cause no same-step movement', () => assert.deepStrictEqual(mv(['CAA'], 'R'), ['C..']));
t('step is pure (input not mutated)', () => { const g = makeState(['.AA']).grid; step(g, 'R'); assert.deepStrictEqual(rows(g), ['.AA']); });
console.log('Echo, first move, no-ops');
t('first input has no Echo', () => { const s = run(['....', '....', '....', 'A..B'], 'U'); assert.deepStrictEqual(rows(s.grid), ['....', '....', 'A..B', '....']); });
t('echo repeats previous input (R then U => extra R)', () => {
  const s = run(['....', '....', '....', 'A..B'], 'UR');
  assert.deepStrictEqual(rows(s.grid), ['....', '.A.B', '....', '....']);
});
t('echo uses PREVIOUS input: full board after R,U,L', () => {
  // R: A->(3,3), no echo. U: A(2,3),B(2,4); echo R blocked. L: A(2,2),B(2,3); echo U: A(1,2),B(1,3).
  const s = run(['.....', '.....', '.....', '..A.B'], 'RUL');
  assert.deepStrictEqual(rows(s.grid), ['.....', '..AB.', '.....', '.....']);
  assert.strictEqual(s.last, 'L'); assert.strictEqual(s.moves, 3);
});
t('no-op input: no move consumed, stored direction unchanged', () => {
  let s = run(['A.B', '...'], 'R'); assert.strictEqual(s.last, 'R'); assert.strictEqual(s.moves, 1);
  const r = play(s, 'U'); assert.ok(r.noop); assert.strictEqual(r.state.last, 'R'); assert.strictEqual(r.state.moves, 1);
  assert.deepStrictEqual(rows(r.state.grid), rows(s.grid));
});
t('no-op on first input leaves no stored direction', () => { const r = play(makeState(['A.B', '...']), 'U'); assert.ok(r.noop); assert.strictEqual(r.state.last, null); });
t('Echo can complete a match (R then D => echo R matches)', () => {
  const r1 = play(makeState(['A..', '..A']), 'R'); const r2 = play(r1.state, 'D');
  assert.deepStrictEqual(r2.events.map(e => e.type + ':' + e.dir + ':' + (e.matches || 0)), ['player:D:0', 'echo:R:1']);
  assert.ok(r2.state.won);
});
t('Echo skipped when player move clears board', () => {
  const r = play(play(makeState(['A.A']), 'L').state, 'L'); assert.ok(r.state.won); assert.strictEqual(r.events.length, 1);
});
t('echo no-op does not break the turn', () => { const s = run(['A.', '.A'], 'RD'); assert.strictEqual(s.moves, 2); });
console.log('Restart / purity');
t('restart yields fresh state; play never mutates old state', () => {
  const lv = ['A..', '..A']; const s0 = makeState(lv); const k0 = gridKey(s0.grid); play(s0, 'R');
  assert.strictEqual(gridKey(s0.grid), k0); assert.strictEqual(s0.last, null); assert.strictEqual(s0.moves, 0);
});
t('no actions after win', () => { const s = run(['A.A'], 'LL'); assert.ok(play(s, 'R').noop); });
console.log('Solver / failure / completion');
const L = { a: ['A.A'], b: ['A..', '..A'], c: ['A..B', '....', 'B..A'], d: ['A..#.', '..B..', '.#..A', 'B....'] };
t('solver replay through live engine wins in exactly `optimal` moves (shared transition code)', () => {
  for (const [n, lv] of Object.entries(L)) {
    const r = solve(makeState(lv)); if (!r.solvable) { console.log('      (level', n, 'unsolvable)'); continue; }
    const s = run(lv, r.solution.join('')); assert.ok(s.won, 'level ' + n); assert.strictEqual(s.moves, r.optimal);
    console.log('      level', n, 'optimal', r.optimal, r.solution.join(''));
  }
});
t('known solvable boards are solvable', () => { assert.ok(solve(makeState(L.a)).solvable); assert.ok(solve(makeState(L.b)).solvable); });
t('optimal is truly minimal on trivial board', () => assert.strictEqual(solve(makeState(L.a)).optimal, 2));
t('dead board detected', () => { assert.ok(isDead(makeState(['A#A']))); assert.ok(isDead(makeState(['AB', 'BA']))); });
t('mid-game dead state: solvable at start, dead after U,L', () => {
  const lv = ['A..', '.B.', '..A', 'B..'];
  assert.ok(solve(makeState(lv)).solvable);
  const s = run(lv, 'UL');
  assert.deepStrictEqual(rows(s.grid), ['AB.', 'BA.', '...', '...']); assert.strictEqual(s.last, 'L');
  assert.ok(!s.won); assert.ok(isDead(s)); assert.strictEqual(solve(s).solvable, false);
});
t('solved board is not dead; star thresholds', () => { assert.ok(!isDead(run(['A.A'], 'LL'))); assert.deepStrictEqual([stars(4, 4), stars(6, 4), stars(7, 4)], [3, 2, 1]); });
t('determinism: same inputs, same result x100', () => { const a = gridKey(run(L.c, 'RDLURDLU').grid); for (let i = 0; i < 100; i++) assert.strictEqual(gridKey(run(L.c, 'RDLURDLU').grid), a); });
console.log('Candidate levels 1-5');
const cand = require('./levels');
for (const lv of cand) t('level ' + lv.id + ': solvable, recorded solution wins, recorded solution is optimal', () => {
  const r = solve(makeState(lv.rows)); assert.ok(r.solvable); assert.strictEqual(r.optimal, lv.solution.length);
  const s = run(lv.rows, lv.solution); assert.ok(s.won); assert.strictEqual(s.moves, lv.solution.length);
  const tiles = lv.rows.join('').replace(/[.#]/g, ''); [...new Set(tiles)].forEach(c => assert.strictEqual(tiles.split(c).length - 1, 2));
});
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
