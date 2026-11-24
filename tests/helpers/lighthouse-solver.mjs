export function solveLighthouse(rows, limit = Infinity) {
  const size = rows.length;
  const white = [], clues = [];
  const adjacent = i => [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([r, c]) => [Math.floor(i / size) + r, i % size + c]).filter(([r, c]) => rows[r]?.[c] === '.').map(([r, c]) => r * size + c);
  for (let i = 0; i < size * size; i++) {
    const cell = rows[Math.floor(i / size)][i % size];
    if (cell === '.') white.push(i);
    else if (/[0-4]/.test(cell)) clues.push({ required: Number(cell), adjacent: adjacent(i) });
  }
  const rays = new Map(white.map(i => {
    const cells = new Set([i]);
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      let r = Math.floor(i / size) + dr, c = i % size + dc;
      while (rows[r]?.[c] === '.') { cells.add(r * size + c); r += dr; c += dc; }
    }
    return [i, cells];
  }));
  const seen = new Set();
  function search(lights, lit) {
    const key = [...lights].sort((a, b) => a - b).join(',');
    if (seen.has(key)) return null;
    seen.add(key);
    const candidate = white.filter(i => !lit.has(i) && clues.every(clue => !clue.adjacent.includes(i) || clue.adjacent.filter(j => lights.includes(j)).length < clue.required));
    const constraints = [];
    for (const clue of clues) {
      const remaining = clue.required - clue.adjacent.filter(i => lights.includes(i)).length;
      if (remaining < 0) return null;
      if (remaining) {
        const options = candidate.filter(i => clue.adjacent.includes(i));
        if (options.length < remaining) return null;
        constraints.push(options);
      }
    }
    for (const i of white) if (!lit.has(i)) constraints.push(candidate.filter(j => rays.get(j).has(i)));
    if (!constraints.length) return lights;
    if (lights.length >= limit) return null;
    constraints.sort((a, b) => a.length - b.length);
    for (const i of constraints[0]) {
      const found = search([...lights, i], new Set([...lit, ...rays.get(i)]));
      if (found) return found;
    }
    return null;
  }
  return search([], new Set());
}
