export type Direction = 'up' | 'down' | 'left' | 'right';
export type BlockPose = { row: number; col: number; orientation: 'standing' | 'horizontal' | 'vertical' };
export type BloxorzPuzzle = { name: string; rows: string[]; start: [number, number] };

/** Coordinates always identify the top/left occupied cell. */
export function rollBlock(block: BlockPose, direction: Direction): BlockPose {
  const { row, col, orientation } = block;
  if (orientation === 'standing') {
    if (direction === 'up') return { row: row - 2, col, orientation: 'vertical' };
    if (direction === 'down') return { row: row + 1, col, orientation: 'vertical' };
    if (direction === 'left') return { row, col: col - 2, orientation: 'horizontal' };
    return { row, col: col + 1, orientation: 'horizontal' };
  }
  if (orientation === 'horizontal') {
    if (direction === 'left') return { row, col: col - 1, orientation: 'standing' };
    if (direction === 'right') return { row, col: col + 2, orientation: 'standing' };
    return { row: row + (direction === 'up' ? -1 : 1), col, orientation };
  }
  if (direction === 'up') return { row: row - 1, col, orientation: 'standing' };
  if (direction === 'down') return { row: row + 2, col, orientation: 'standing' };
  return { row, col: col + (direction === 'left' ? -1 : 1), orientation };
}

export function occupiedCells(block: BlockPose): [number, number][] {
  const cells: [number, number][] = [[block.row, block.col]];
  if (block.orientation === 'horizontal') cells.push([block.row, block.col + 1]);
  if (block.orientation === 'vertical') cells.push([block.row + 1, block.col]);
  return cells;
}

export function inspectBlock(rows: string[], block: BlockPose): 'playing' | 'fell' | 'won' {
  const cells = occupiedCells(block);
  if (cells.some(([r, c]) => !rows[r]?.[c] || rows[r][c] === '.')) return 'fell';
  if (block.orientation === 'standing') {
    if (rows[block.row][block.col] === 'F') return 'fell';
    if (rows[block.row][block.col] === 'G') return 'won';
  }
  return 'playing';
}

/** Breadth-first search gives the exact shortest route, also used for optional hints. */
export function solveBloxorz(puzzle: BloxorzPuzzle, start: BlockPose = { row: puzzle.start[0], col: puzzle.start[1], orientation: 'standing' }): Direction[] | null {
  const key = (b: BlockPose) => `${b.row},${b.col},${b.orientation}`;
  const queue: { block: BlockPose; path: Direction[] }[] = [{ block: start, path: [] }];
  const seen = new Set([key(start)]);
  for (let i = 0; i < queue.length; i++) {
    const { block, path } = queue[i];
    if (inspectBlock(puzzle.rows, block) === 'won') return path;
    if (inspectBlock(puzzle.rows, block) === 'fell') continue;
    for (const direction of ['up', 'down', 'left', 'right'] as const) {
      const next = rollBlock(block, direction);
      if (seen.has(key(next)) || inspectBlock(puzzle.rows, next) === 'fell') continue;
      seen.add(key(next));
      queue.push({ block: next, path: [...path, direction] });
    }
  }
  return null;
}
