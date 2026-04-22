import { useState, useEffect, useCallback } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

type CellState = 'hidden' | 'revealed' | 'flagged';

interface Cell {
  value: number; // -1 = mine, 0-8 = count
  state: CellState;
}

function generateBoard(width: number, height: number, mines: number, firstClickR: number, firstClickC: number): Cell[][] {
  const board: Cell[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ value: 0, state: 'hidden' as CellState }))
  );

  // Place mines avoiding first click
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * height);
    const c = Math.floor(Math.random() * width);
    if (board[r][c].value === -1) continue;
    if (Math.abs(r - firstClickR) <= 1 && Math.abs(c - firstClickC) <= 1) continue;
    board[r][c].value = -1;
    placed++;
  }

  // Calculate numbers
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (board[r][c].value === -1) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < height && nc >= 0 && nc < width && board[nr][nc].value === -1) {
            count++;
          }
        }
      }
      board[r][c].value = count;
    }
  }

  return board;
}

const numberColors: Record<number, string> = {
  1: '#3B82F6', 2: '#10B981', 3: '#EF4444', 4: '#8B5CF6',
  5: '#991B1B', 6: '#06B6D4', 7: '#FFFFFF', 8: '#777777',
};

export default function MinesweeperGame({ level, config, onComplete, onFail }: Props) {
  const { width = 9, height = 9, mines = 10, timeLimit = 0 } = config.params;
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready');
  const [flags, setFlags] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [revealedCount, setRevealedCount] = useState(0);

  const w = Number(width) || 9;
  const h = Number(height) || 9;
  const m = Number(mines) || 10;

  useEffect(() => {
    setBoard(Array.from({ length: h }, () =>
      Array.from({ length: w }, () => ({ value: 0, state: 'hidden' as CellState }))
    ));
    setGameState('ready');
    setFlags(0);
    setTimeLeft(timeLimit);
    setRevealedCount(0);
  }, [level, w, h, timeLimit]);

  useEffect(() => {
    if (timeLimit <= 0 || gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('lost');
          onFail('时间耗尽');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit, gameState, onFail]);

  const revealCell = useCallback((board: Cell[][], r: number, c: number): [Cell[][], number] => {
    if (r < 0 || r >= h || c < 0 || c >= w) return [board, 0];
    const cell = board[r][c];
    if (cell.state !== 'hidden') return [board, 0];

    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[r][c].state = 'revealed';
    let revealed = 1;

    if (cell.value === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const [b, count] = revealCell(newBoard, r + dr, c + dc);
          // Update newBoard with revealed cells from recursion
          for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
              if (b[i][j].state === 'revealed') newBoard[i][j].state = 'revealed';
            }
          }
          revealed += count;
        }
      }
    }

    return [newBoard, revealed];
  }, [h, w]);

  const handleClick = (r: number, c: number) => {
    if (gameState === 'won' || gameState === 'lost') return;
    if (board[r][c].state === 'flagged') return;

    let newBoard = board;

    if (gameState === 'ready') {
      newBoard = generateBoard(w, h, m, r, c);
      setGameState('playing');
    }

    if (newBoard[r][c].value === -1) {
      // Hit mine
      const revealedBoard = newBoard.map(row => row.map(cell => ({ ...cell, state: cell.value === -1 ? 'revealed' as CellState : cell.state })));
      setBoard(revealedBoard);
      setGameState('lost');
      onFail('踩到地雷');
      return;
    }

    const [updatedBoard, newRevealed] = revealCell(newBoard, r, c);
    const totalRevealed = revealedCount + newRevealed;
    setBoard(updatedBoard);
    setRevealedCount(totalRevealed);

    // Check win
    if (totalRevealed >= w * h - m) {
      setGameState('won');
      const baseScore = m * 50;
      const timeBonus = timeLimit > 0 ? timeLeft * 10 : 0;
      const totalScore = baseScore + timeBonus;
      const stars = timeLimit > 0 && timeLeft > timeLimit * 0.5 ? 3 : 2;
      setTimeout(() => onComplete(totalScore, stars), 300);
    }
  };

  const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState === 'won' || gameState === 'lost') return;
    if (board[r][c].state === 'revealed') return;

    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    if (newBoard[r][c].state === 'hidden') {
      newBoard[r][c].state = 'flagged';
      setFlags(prev => prev + 1);
    } else {
      newBoard[r][c].state = 'hidden';
      setFlags(prev => prev - 1);
    }
    setBoard(newBoard);
  };

  const cellSize = w <= 8 ? 'w-9 h-9 sm:w-10 sm:h-10 text-sm' :
    w <= 16 ? 'w-7 h-7 sm:w-8 sm:h-8 text-xs' :
    'w-5 h-5 sm:w-6 sm:h-6 text-[10px]';

  return (
    <div className="flex flex-col items-center h-full">
      <div className="flex items-center gap-6 mb-4">
        <div className="text-sm text-[var(--black-6)]">
          地雷: <span className="font-mono-data text-[var(--danger)]">{m - flags}</span>
        </div>
        {timeLimit > 0 && (
          <div className="text-sm text-[var(--black-6)]">
            剩余: <span className="font-mono-data text-[var(--accent)]">{timeLeft}s</span>
          </div>
        )}
      </div>

      <div
        className="grid gap-0.5 p-2 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)]"
        style={{ gridTemplateColumns: `repeat(${w}, 1fr)` }}
      >
        {board.map((row, ri) =>
          row.map((cell, ci) => (
            <button
              key={`${ri}-${ci}`}
              onClick={() => handleClick(ri, ci)}
              onContextMenu={(e) => handleRightClick(e, ri, ci)}
              className={`${cellSize} rounded font-mono-data font-bold flex items-center justify-center transition-all duration-150 ${
                cell.state === 'hidden'
                  ? 'bg-[var(--black-3)] border-2 border-[var(--black-2)] border-b-[var(--black-5)] border-r-[var(--black-5)] hover:bg-[var(--black-4)] active:border-none'
                  : cell.state === 'flagged'
                  ? 'bg-[var(--black-3)] border-2 border-[var(--black-2)]'
                  : cell.value === -1
                  ? 'bg-[var(--danger)] text-white'
                  : 'bg-[var(--black-1)] border border-[var(--black-3)]'
              }`}
            >
              {cell.state === 'flagged' ? '🚩' :
                cell.state === 'revealed' && cell.value === -1 ? '💥' :
                cell.state === 'revealed' && cell.value > 0 ? (
                  <span style={{ color: numberColors[cell.value] }}>{cell.value}</span>
                ) : ''}
            </button>
          ))
        )}
      </div>

      <div className="mt-3 text-xs text-[var(--black-6)]">
        左键揭开 · 右键标记旗帜
      </div>
    </div>
  );
}
