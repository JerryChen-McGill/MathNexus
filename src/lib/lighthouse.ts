export type LighthouseMark = 'light' | 'cross' | null;
const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function inspectLighthouse(rows: string[], marks: LighthouseMark[]) {
  const size = rows.length;
  const lit = new Set<number>();
  const conflicts = new Set<number>();
  const clues = new Map<number, { actual: number; required: number }>();
  let whiteCount = 0;
  let lightCount = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    const index = r * size + c;
    if (rows[r][c] === '.') {
      whiteCount++;
      if (marks[index] !== 'light') continue;
      lightCount++;
      lit.add(index);
      for (const [dr, dc] of directions) {
        let y = r + dr, x = c + dc;
        while (y >= 0 && y < size && x >= 0 && x < size && rows[y][x] === '.') {
          const other = y * size + x;
          lit.add(other);
          if (marks[other] === 'light') { conflicts.add(index); conflicts.add(other); }
          y += dr; x += dc;
        }
      }
    } else if (/^[0-4]$/.test(rows[r][c])) {
      const actual = directions.filter(([dr, dc]) => rows[r + dr]?.[c + dc] === '.' && marks[(r + dr) * size + c + dc] === 'light').length;
      clues.set(index, { actual, required: Number(rows[r][c]) });
    }
  }
  const matchedClues = [...clues.values()].filter(c => c.actual === c.required).length;
  return { lit, conflicts, clues, whiteCount, lightCount, matchedClues,
    solved: lit.size === whiteCount && conflicts.size === 0 && matchedClues === clues.size };
}
