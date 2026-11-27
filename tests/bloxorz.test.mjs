import test from 'node:test';
import assert from 'node:assert/strict';
import { bloxorzLevels } from '../src/data/bloxorz.ts';
import { rollBlock, inspectBlock, occupiedCells, solveBloxorz } from '../src/lib/bloxorz.ts';

test('all twelve orientation/direction rolls land on the correct cells and are reversible', () => {
  const expected = {
    standing: [[1, 3, 'vertical'], [4, 3, 'vertical'], [3, 1, 'horizontal'], [3, 4, 'horizontal']],
    horizontal: [[2, 3, 'horizontal'], [4, 3, 'horizontal'], [3, 2, 'standing'], [3, 5, 'standing']],
    vertical: [[2, 3, 'standing'], [5, 3, 'standing'], [3, 2, 'vertical'], [3, 4, 'vertical']],
  };
  const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
  for (const [orientation, outcomes] of Object.entries(expected)) {
    const start = { row: 3, col: 3, orientation };
    for (const [i, direction] of ['up', 'down', 'left', 'right'].entries()) {
      const next = rollBlock(start, direction);
      assert.deepEqual([next.row, next.col, next.orientation], outcomes[i]);
      assert.deepEqual(rollBlock(next, opposite[direction]), start);
      assert.equal(occupiedCells(next).length, next.orientation === 'standing' ? 1 : 2);
    }
  }
});

test('both occupied cells need support; fragile tiles and goals depend on orientation', () => {
  const rows = ['###.', '#FG#', '####'];
  assert.equal(inspectBlock(rows, { row: 0, col: 2, orientation: 'horizontal' }), 'fell');
  assert.equal(inspectBlock(rows, { row: -1, col: 1, orientation: 'vertical' }), 'fell');
  assert.equal(inspectBlock(rows, { row: 2, col: 1, orientation: 'vertical' }), 'fell');
  assert.equal(inspectBlock(rows, { row: 1, col: 1, orientation: 'standing' }), 'fell');
  assert.equal(inspectBlock(rows, { row: 1, col: 1, orientation: 'horizontal' }), 'playing');
  assert.equal(inspectBlock(rows, { row: 0, col: 1, orientation: 'vertical' }), 'playing');
  assert.equal(inspectBlock(rows, { row: 1, col: 2, orientation: 'standing' }), 'won');
  assert.equal(inspectBlock(rows, { row: 1, col: 2, orientation: 'horizontal' }), 'playing');
});

test('all ten original boards have legal routes with verified shortest lengths', () => {
  const lengths = [6, 7, 8, 8, 7, 9, 4, 9, 11, 12];
  assert.equal(bloxorzLevels.length, 10);
  for (const [i, puzzle] of bloxorzLevels.entries()) {
    assert.ok(puzzle.rows.every(row => row.length === puzzle.rows[0].length && /^[.#FG]+$/.test(row)));
    assert.equal(puzzle.rows.join('').split('G').length - 1, 1);
    const path = solveBloxorz(puzzle);
    assert.equal(path?.length, lengths[i], puzzle.name);
    let block = { row: puzzle.start[0], col: puzzle.start[1], orientation: 'standing' };
    for (const [j, direction] of path.entries()) {
      block = rollBlock(block, direction);
      assert.equal(inspectBlock(puzzle.rows, block), j === path.length - 1 ? 'won' : 'playing');
    }
  }
  assert.equal(solveBloxorz({ name: 'isolated', rows: ['#..G'], start: [0, 0] }), null);
});
