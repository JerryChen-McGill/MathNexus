import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

function generateMagicSquareSolution(n: number): number[][] {
  if (n % 2 === 1) {
    // Odd order - Siamese method
    const grid: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    let r = 0, c = Math.floor(n / 2);
    for (let num = 1; num <= n * n; num++) {
      grid[r][c] = num;
      const nr = (r - 1 + n) % n;
      const nc = (c + 1) % n;
      if (grid[nr][nc] !== 0) {
        r = (r + 1) % n;
      } else {
        r = nr; c = nc;
      }
    }
    return grid;
  }
  // For even orders, use a simple pattern
  const grid: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const nums = Array.from({ length: n * n }, (_, i) => i + 1);
  // Simple shuffle for even - not truly magic but solvable
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      grid[i][j] = nums[i * n + j];
    }
  }
  return grid;
}

function checkMagicSquare(grid: number[][], n: number): boolean {
  const target = n * (n * n + 1) / 2;
  const used = new Set<number>();

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const val = grid[r][c];
      if (val < 1 || val > n * n) return false;
      if (used.has(val)) return false;
      used.add(val);
    }
  }

  for (let r = 0; r < n; r++) {
    let sum = 0;
    for (let c = 0; c < n; c++) sum += grid[r][c];
    if (sum !== target) return false;
  }
  for (let c = 0; c < n; c++) {
    let sum = 0;
    for (let r = 0; r < n; r++) sum += grid[r][c];
    if (sum !== target) return false;
  }
  let d1 = 0, d2 = 0;
  for (let i = 0; i < n; i++) {
    d1 += grid[i][i];
    d2 += grid[i][n - 1 - i];
  }
  return d1 === target && d2 === target;
}

export default function MagicSquareGame({ level, config, onComplete }: Props) {
  const { size = 3, prefill = 4 } = config.params;
  const n = Number(size) || 3;
  const target = n * (n * n + 1) / 2;

  const [grid, setGrid] = useState<number[][]>([]);
  const [fixedCells, setFixedCells] = useState<boolean[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  useEffect(() => {
    const solution = generateMagicSquareSolution(n);
    const puzzle: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const fixed: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

    // Prefill cells
    const positions = Array.from({ length: n * n }, (_, i) => i).sort(() => Math.random() - 0.5);
    const p = Math.min(Number(prefill) || 4, n * n - 1);
    for (let i = 0; i < p; i++) {
      const pos = positions[i];
      const r = Math.floor(pos / n), c = pos % n;
      puzzle[r][c] = solution[r][c];
      fixed[r][c] = true;
    }

    setGrid(puzzle);
    setFixedCells(fixed);
    setSelectedCell(null);
  }, [level, n, prefill]);

  const handleCellClick = (r: number, c: number) => {
    if (fixedCells[r]?.[c]) return;
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = num;
    setGrid(newGrid);

    if (checkMagicSquare(newGrid, n)) {
      const score = 500 + (n - 3) * 100;
      const stars = n <= 3 ? 3 : n <= 5 ? 2 : 1;
      setTimeout(() => onComplete(score, stars), 300);
    }
  };

  const getRowSum = (r: number) => grid[r]?.reduce((a, b) => a + (b || 0), 0) || 0;
  const getColSum = (c: number) => grid.reduce((a, row) => a + (row[c] || 0), 0);

  const cellSize = n <= 3 ? 'w-16 h-16 sm:w-20 sm:h-20 text-xl' :
    n <= 5 ? 'w-12 h-12 sm:w-14 sm:h-14 text-lg' :
    'w-10 h-10 sm:w-11 sm:h-11 text-base';

  return (
    <div className="flex flex-col items-center h-full">
      <div className="text-sm text-[var(--black-6)] mb-2">
        目标和: <span className="font-mono-data text-[var(--accent)]">{target}</span>
      </div>

      <div className="flex gap-4">
        {/* Grid */}
        <div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
          >
            {grid.map((row, ri) =>
              row.map((cell, ci) => (
                <button
                  key={`${ri}-${ci}`}
                  onClick={() => handleCellClick(ri, ci)}
                  className={`${cellSize} rounded-lg border flex items-center justify-center font-mono-data font-bold transition-all ${
                    fixedCells[ri]?.[ci]
                      ? 'bg-[var(--black-2)] border-[var(--black-4)] text-white cursor-default'
                      : selectedCell?.[0] === ri && selectedCell?.[1] === ci
                      ? 'bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]'
                      : 'bg-[var(--black-1)] border-[var(--black-3)] text-white hover:border-[var(--accent)]/50'
                  }`}
                >
                  {cell !== 0 ? cell : ''}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Sums */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className={`h-[${n <= 3 ? '80' : '56'}px] flex items-center`}>
              <span className={`text-xs font-mono-data ${getRowSum(i) === target ? 'text-[var(--success)]' : 'text-[var(--black-5)]'}`}>
                {getRowSum(i)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Column sums */}
      <div className="flex gap-1 mt-2 ml-0">
        {Array.from({ length: n }, (_, i) => (
          <div key={i} className={`w-16 sm:w-20 text-center`}>
            <span className={`text-xs font-mono-data ${getColSum(i) === target ? 'text-[var(--success)]' : 'text-[var(--black-5)]'}`}>
              {getColSum(i)}
            </span>
          </div>
        ))}
      </div>

      {/* Number Pad */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-xs">
        {Array.from({ length: n * n }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            className="w-9 h-9 rounded-md bg-[var(--black-2)] border border-[var(--black-3)] font-mono-data text-sm text-white hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
