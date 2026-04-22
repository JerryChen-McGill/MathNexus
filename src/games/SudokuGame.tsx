import { useState, useEffect, useCallback } from 'react';

interface SudokuGameProps {
  level: number;
  config: { params: Record<string, number | string | boolean> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
  elapsedTime: number;
}

function generateSudoku(size: number, prefill: number): { puzzle: number[][]; solution: number[][] } {
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  function isValid(grid: number[][], row: number, col: number, num: number): boolean {
    for (let i = 0; i < size; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false;
    }
    if (size === 9) {
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let i = boxRow; i < boxRow + 3; i++) {
        for (let j = boxCol; j < boxCol + 3; j++) {
          if (grid[i][j] === num) return false;
        }
      }
    } else if (size === 6) {
      const boxRow = Math.floor(row / 2) * 2;
      const boxCol = Math.floor(col / 3) * 3;
      for (let i = boxRow; i < boxRow + 2; i++) {
        for (let j = boxCol; j < boxCol + 3; j++) {
          if (grid[i][j] === num) return false;
        }
      }
    } else if (size === 4) {
      const boxRow = Math.floor(row / 2) * 2;
      const boxCol = Math.floor(col / 2) * 2;
      for (let i = boxRow; i < boxRow + 2; i++) {
        for (let j = boxCol; j < boxCol + 2; j++) {
          if (grid[i][j] === num) return false;
        }
      }
    }
    return true;
  }

  function solve(grid: number[][]): boolean {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col] === 0) {
          const nums = Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              if (solve(grid)) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve(grid);
  const solution = grid.map(row => [...row]);

  const puzzle = grid.map(row => [...row]);
  let removed = 0;
  const maxRemove = size * size - prefill;
  const positions = Array.from({ length: size * size }, (_, i) => i).sort(() => Math.random() - 0.5);

  for (const pos of positions) {
    if (removed >= maxRemove) break;
    const row = Math.floor(pos / size);
    const col = pos % size;
    puzzle[row][col] = 0;
    removed++;
  }

  return { puzzle, solution };
}

export default function SudokuGame({ level, config, onComplete, onFail, elapsedTime }: SudokuGameProps) {
  const size = Number(config.params.size || 9);
  const prefill = Number(config.params.prefill || 40);
  const timeLimit = Number(config.params.timeLimit || 0);

  const [, setPuzzle] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [userGrid, setUserGrid] = useState<number[][]>([]);
  const [fixedCells, setFixedCells] = useState<boolean[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const s = size || 9;
    const p = prefill || 40;
    const { puzzle: newPuzzle, solution: newSolution } = generateSudoku(s, p);
    setPuzzle(newPuzzle);
    setSolution(newSolution);
    setUserGrid(newPuzzle.map(row => [...row]));
    setFixedCells(newPuzzle.map(row => row.map(cell => cell !== 0)));
    setSelectedCell(null);
    setErrors(0);
    setIsComplete(false);
  }, [level, size, prefill]);

  useEffect(() => {
    if (timeLimit > 0 && elapsedTime >= timeLimit && !isComplete) {
      onFail('时间耗尽');
    }
  }, [elapsedTime, timeLimit, isComplete, onFail]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (fixedCells[row]?.[col]) return;
    setSelectedCell([row, col]);
  }, [fixedCells]);

  const handleNumberInput = useCallback((num: number) => {
    if (!selectedCell || isComplete) return;
    const [row, col] = selectedCell;
    if (fixedCells[row]?.[col]) return;

    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = num;
    setUserGrid(newGrid);

    if (num !== 0 && num !== solution[row][col]) {
      setErrors(prev => prev + 1);
    }

    const isFull = newGrid.every((r, i) => r.every((cell, j) => cell === solution[i][j]));
    if (isFull) {
      setIsComplete(true);
      const baseScore = 1000;
      const timeBonus = timeLimit > 0 ? Math.max(0, (timeLimit - elapsedTime) * 10) : 500;
      const errorPenalty = errors * 50;
      const totalScore = Math.max(0, baseScore + timeBonus - errorPenalty);
      const stars = errors === 0 ? 3 : errors <= 3 ? 2 : 1;
      setTimeout(() => onComplete(totalScore, stars), 300);
    }
  }, [selectedCell, isComplete, fixedCells, userGrid, solution, errors, timeLimit, elapsedTime, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= size) {
        handleNumberInput(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleNumberInput(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumberInput, size, isComplete]);

  const cellSize = size === 4 ? 'w-14 h-14 sm:w-16 sm:h-16 text-xl' :
    size === 6 ? 'w-12 h-12 sm:w-14 sm:h-14 text-lg' :
    'w-9 h-9 sm:w-11 sm:h-11 text-base';

  const getBorderClass = (row: number, col: number) => {
    const borders: string[] = [];
    borders.push('border-[var(--black-3)]');
    if (size === 9) {
      if (row % 3 === 0) borders.push('border-t-2 border-t-[var(--black-4)]');
      if (col % 3 === 0) borders.push('border-l-2 border-l-[var(--black-4)]');
      if (row === 8) borders.push('border-b-2 border-b-[var(--black-4)]');
      if (col === 8) borders.push('border-r-2 border-r-[var(--black-4)]');
    }
    return borders.join(' ');
  };

  return (
    <div className="flex flex-col items-center h-full">
      <div className="flex items-center gap-6 mb-4">
        <div className="text-sm text-[var(--black-6)]">
          错误: <span className="font-mono-data text-[var(--danger)]">{errors}</span>
        </div>
        {timeLimit > 0 && (
          <div className="text-sm text-[var(--black-6)]">
            限时: <span className="font-mono-data">{timeLimit}s</span>
          </div>
        )}
      </div>

      <div
        className="grid gap-0 border-2 border-[var(--black-4)] rounded-lg overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {userGrid.map((row, ri) =>
          row.map((cell, ci) => {
            const isFixed = fixedCells[ri]?.[ci];
            const isSelected = selectedCell?.[0] === ri && selectedCell?.[1] === ci;
            const isError = cell !== 0 && cell !== solution[ri]?.[ci];

            return (
              <button
                key={`${ri}-${ci}`}
                onClick={() => handleCellClick(ri, ci)}
                className={`${cellSize} border flex items-center justify-center font-mono-data font-semibold transition-all duration-150 ${getBorderClass(ri, ci)} ${
                  isSelected
                    ? 'bg-[rgba(59,130,246,0.15)] border-[var(--accent)]'
                    : isError
                    ? 'bg-[rgba(239,68,68,0.2)] text-[var(--danger)]'
                    : isFixed
                    ? 'bg-[var(--black-2)] text-white cursor-default'
                    : 'bg-[var(--black-1)] text-[var(--accent)] hover:bg-[rgba(59,130,246,0.08)]'
                }`}
              >
                {cell !== 0 ? cell : ''}
              </button>
            );
          })
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {Array.from({ length: size }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            className="w-11 h-11 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] font-mono-data text-white hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all duration-200"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handleNumberInput(0)}
          className="w-11 h-11 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] text-xs text-[var(--black-6)] hover:bg-[var(--danger)]/20 hover:border-[var(--danger)] hover:text-[var(--danger)] transition-all duration-200"
        >
          清除
        </button>
      </div>
    </div>
  );
}
