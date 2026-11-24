import test from 'node:test';
import assert from 'node:assert/strict';
import { lighthouseLevels } from '../src/data/lighthouse.ts';
import { inspectLighthouse } from '../src/lib/lighthouse.ts';
import { canPlayLevel, isAdminToken } from '../src/lib/access.ts';
import { solveLighthouse } from './helpers/lighthouse-solver.mjs';

test('developer access accepts all four tokens and always respects level bounds', () => {
  for (const token of ['Jerry Chen', 'JerryChen', 'Jenny Wang', 'JennyWang', ' Jerry Chen ']) {
    assert.equal(isAdminToken(token), true);
    assert.equal(canPlayLevel(10, 10, 1, token), true);
    for (const level of [0, 11, 1.1, NaN, Infinity]) assert.equal(canPlayLevel(level, 10, 1, token), false);
  }
  for (const token of ['', 'Jerry', 'Jenny Wang!', 'Someone']) {
    assert.equal(isAdminToken(token), false);
    assert.equal(canPlayLevel(10, 10, 1, token), false);
    assert.equal(canPlayLevel(1, 10, 1, token), true);
  }
});

test('light rays stop at walls, pass marks, and detect mutual illumination', () => {
  const rows = ['.#.', '...', '.#.'];
  const marks = Array(9).fill(null); marks[0] = 'light'; marks[3] = 'cross';
  let board = inspectLighthouse(rows, marks);
  assert.deepEqual([...board.lit].sort(), [0, 3, 6]);
  assert.equal(board.solved, false);
  marks[6] = 'light'; board = inspectLighthouse(rows, marks);
  assert.deepEqual([...board.conflicts].sort(), [0, 6]);
  marks[6] = null; marks[2] = 'light';
  assert.equal(inspectLighthouse(rows, marks).conflicts.size, 0);
});

test('all white cells lit is insufficient when a clue or non-interference rule fails', () => {
  const rows = ['.0', '..'];
  assert.equal(inspectLighthouse(rows, ['light', null, null, 'light']).lit.size, 3);
  assert.equal(inspectLighthouse(rows, ['light', null, null, 'light']).solved, false);
  assert.equal(inspectLighthouse(rows, [null, null, 'light', null]).solved, true);
  const numbered = inspectLighthouse(['.1', '..'], [null, null, 'light', null]);
  assert.equal(numbered.lit.size, 3);
  assert.equal(numbered.solved, false);
});

// Independent constraint search verifies that the transcribed boards are playable.

test('all ten reference boards have a valid solution', () => {
  for (const [index, puzzle] of lighthouseLevels.entries()) {
    assert.equal(puzzle.rows.length, index + 2);
    assert.ok(puzzle.rows.every(row => row.length === index + 2));
    const solution = solveLighthouse(puzzle.rows, puzzle.target);
    assert.ok(solution, `${puzzle.name} must be solvable`);
    const marks = Array(puzzle.rows.length ** 2).fill(null);
    solution.forEach(i => { marks[i] = 'light'; });
    assert.equal(inspectLighthouse(puzzle.rows, marks).solved, true, puzzle.name);
    assert.equal(solveLighthouse(puzzle.rows, puzzle.target - 1), null, `${puzzle.name}: target is optimal`);
  }
});
