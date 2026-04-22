import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

function shufflePuzzle(size: number, moves: number): number[][] {
  const grid = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => r * size + c + 1)
  );
  grid[size - 1][size - 1] = 0;

  let emptyR = size - 1, emptyC = size - 1;
  let lastMove = -1;

  for (let i = 0; i < moves; i++) {
    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ];
    const validDirs = dirs.map((d, idx) => ({ d, idx })).filter(({ d, idx }) => {
      if (idx === lastMove) return false;
      const nr = emptyR + d[0], nc = emptyC + d[1];
      return nr >= 0 && nr < size && nc >= 0 && nc < size;
    });

    if (validDirs.length === 0) continue;
    const { d, idx } = validDirs[Math.floor(Math.random() * validDirs.length)];
    const nr = emptyR + d[0], nc = emptyC + d[1];
    [grid[emptyR][emptyC], grid[nr][nc]] = [grid[nr][nc], grid[emptyR][emptyC]];
    emptyR = nr; emptyC = nc;
    lastMove = idx < 2 ? 1 - idx : 5 - idx;
  }

  return grid;
}

function isSolved(grid: number[][]): boolean {
  const size = grid.length;
  let expected = 1;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (r === size - 1 && c === size - 1) return grid[r][c] === 0;
      if (grid[r][c] !== expected) return false;
      expected++;
    }
  }
  return true;
}

export default function SlidingPuzzleGame({ level, config, onComplete, onFail }: Props) {
  const { size = 4, shuffle = 200, timeLimit = 0 } = config.params;
  const [grid, setGrid] = useState<number[][]>([]);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    const s = Number(size) || 4;
    const sh = Number(shuffle) || 200;
    setGrid(shufflePuzzle(s, sh));
    setMoves(0);
    setSolved(false);
    setTimeLeft(timeLimit);
  }, [level, size, shuffle, timeLimit]);

  useEffect(() => {
    if (timeLimit <= 0 || solved) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onFail('时间耗尽');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit, solved, onFail]);

  const handleClick = (r: number, c: number) => {
    if (solved) return;
    const s = grid.length;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < s && nc >= 0 && nc < s && grid[nr][nc] === 0) {
        const newGrid = grid.map(row => [...row]);
        [newGrid[r][c], newGrid[nr][nc]] = [newGrid[nr][nc], newGrid[r][c]];
        const newMoves = moves + 1;
        setGrid(newGrid);
        setMoves(newMoves);

        if (isSolved(newGrid)) {
          setSolved(true);
          const baseScore = 1000;
          const optimalMoves = shuffle;
          const movePenalty = Math.max(0, (newMoves - optimalMoves) * 5);
          const timeBonus = timeLimit > 0 ? timeLeft * 5 : 0;
          const totalScore = Math.max(100, baseScore - movePenalty + timeBonus);
          const stars = newMoves <= optimalMoves * 1.2 ? 3 : newMoves <= optimalMoves * 1.5 ? 2 : 1;
          setTimeout(() => onComplete(totalScore, stars), 300);
        }
        return;
      }
    }
  };

  const s = grid.length || size;
  const cellSize = s <= 3 ? 'w-20 h-20 sm:w-24 sm:h-24 text-2xl' :
    s <= 4 ? 'w-16 h-16 sm:w-20 sm:h-20 text-xl' :
    'w-14 h-14 sm:w-16 sm:h-16 text-lg';

  return (
    <div className="flex flex-col items-center h-full">
      <div className="flex items-center gap-6 mb-4">
        <div className="text-sm text-[var(--black-6)]">步数: <span className="font-mono-data text-white">{moves}</span></div>
        {timeLimit > 0 && (
          <div className="text-sm text-[var(--black-6)]">剩余: <span className="font-mono-data text-[var(--accent)]">{timeLeft}s</span></div>
        )}
      </div>

      <div
        className="grid gap-1.5 p-3 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)]"
        style={{ gridTemplateColumns: `repeat(${s}, 1fr)` }}
      >
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <button
              key={`${ri}-${ci}`}
              onClick={() => handleClick(ri, ci)}
              disabled={cell === 0}
              className={`${cellSize} rounded-lg font-mono-data font-bold transition-all duration-200 ${
                cell === 0
                  ? 'bg-transparent cursor-default'
                  : 'bg-gradient-to-br from-[var(--black-2)] to-[var(--black-3)] border border-[var(--black-4)] text-white hover:border-[var(--accent)] hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] active:scale-95'
              }`}
            >
              {cell !== 0 ? cell : ''}
            </button>
          ))
        )}
      </div>

      {/* Target reference */}
      <div className="mt-4 text-xs text-[var(--black-6)]">
        目标: 按顺序排列数字，右下角留空
      </div>
    </div>
  );
}
