import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

function checkFive(board: (string | null)[], size: number, win: number, player: string): boolean {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r * size + c] !== player) continue;
      for (const [dr, dc] of dirs) {
        let count = 1;
        for (let i = 1; i < win; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
          if (board[nr * size + nc] === player) count++;
          else break;
        }
        if (count >= win) return true;
      }
    }
  }
  return false;
}

function evaluatePos(board: (string | null)[], size: number, pos: number, player: string): number {
  const r = Math.floor(pos / size), c = pos % size;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  let score = 0;
  for (const [dr, dc] of dirs) {
    let count = 1, open = 0;
    for (let step = 1; step <= 4; step++) {
      const nr = r + dr * step, nc = c + dc * step;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
      const cell = board[nr * size + nc];
      if (cell === player) count++;
      else if (cell === null) { open++; break; }
      else break;
    }
    for (let step = 1; step <= 4; step++) {
      const nr = r - dr * step, nc = c - dc * step;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
      const cell = board[nr * size + nc];
      if (cell === player) count++;
      else if (cell === null) { open++; break; }
      else break;
    }
    if (count >= 5) score += 100000;
    else if (count === 4 && open >= 1) score += 10000;
    else if (count === 3 && open >= 2) score += 1000;
    else if (count === 3 && open >= 1) score += 100;
    else if (count === 2 && open >= 2) score += 50;
  }
  return score;
}

function getGomokuAIMove(board: (string | null)[], size: number, win: number, _depth: number): number {
  void _depth;
  const empty = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
  if (empty.length === 0) return -1;

  // Check immediate win
  for (const i of empty) {
    const test = [...board]; test[i] = 'O';
    if (checkFive(test, size, win, 'O')) return i;
  }
  // Block immediate loss
  for (const i of empty) {
    const test = [...board]; test[i] = 'X';
    if (checkFive(test, size, win, 'X')) return i;
  }

  // Evaluate positions
  let bestMove = empty[0];
  let bestScore = -Infinity;
  for (const i of empty) {
    const attackScore = evaluatePos(board, size, i, 'O');
    const defenseScore = evaluatePos(board, size, i, 'X');
    const score = attackScore * 1.1 + defenseScore;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

export default function GomokuGame({ level, config, onComplete, onFail }: Props) {
  const { size = 15, win = 5 } = config.params;
  const [board, setBoard] = useState<(string | null)[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [gameOver, setGameOver] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);

  const s = Number(size) || 15;
  const w = Number(win) || 5;

  useEffect(() => {
    setBoard(Array(s * s).fill(null));
    setCurrentPlayer('X');
    setGameOver(false);
    setMoveCount(0);
    setAiThinking(false);
  }, [level, s]);

  useEffect(() => {
    if (currentPlayer === 'O' && !gameOver) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        const move = getGomokuAIMove(board, s, w, 2);
        if (move >= 0) {
          const newBoard = [...board];
          newBoard[move] = 'O';
          const newCount = moveCount + 1;
          setBoard(newBoard);
          setCurrentPlayer('X');
          setMoveCount(newCount);
          setAiThinking(false);

          if (checkFive(newBoard, s, w, 'O')) {
            setGameOver(true);
            setTimeout(() => onFail('AI连成五子'), 500);
          } else if (newBoard.every(c => c !== null)) {
            setGameOver(true);
            setTimeout(() => onFail('平局'), 500);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameOver, board, s, w, moveCount, onFail]);

  const handleClick = (index: number) => {
    if (board[index] !== null || currentPlayer !== 'X' || gameOver || aiThinking) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    const newCount = moveCount + 1;
    setBoard(newBoard);
    setCurrentPlayer('O');
    setMoveCount(newCount);

    if (checkFive(newBoard, s, w, 'X')) {
      setGameOver(true);
      const score = 1000 + (s * s - newCount) * 5;
      const stars = newCount <= 20 ? 3 : newCount <= 40 ? 2 : 1;
      setTimeout(() => onComplete(score, stars), 500);
    } else if (newBoard.every(c => c !== null)) {
      setGameOver(true);
      setTimeout(() => onFail('平局'), 500);
    }
  };

  const cellSize = 'w-6 h-6 sm:w-7 sm:h-7 text-xs';

  return (
    <div className="flex flex-col items-center h-full overflow-auto">
      <div className="flex items-center gap-4 mb-2 shrink-0">
        <div className={`text-sm ${currentPlayer === 'X' ? 'text-[var(--accent)]' : 'text-[var(--black-6)]'}`}>
          玩家
        </div>
        <div className="text-sm text-[var(--black-6)]">
          {aiThinking ? 'AI思考中...' : `第 ${moveCount + 1} 步`}
        </div>
      </div>

      <div
        className="grid gap-0 p-2 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)] shrink-0"
        style={{ gridTemplateColumns: `repeat(${s}, 1fr)` }}
      >
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={cell !== null || aiThinking}
            className={`${cellSize} border border-[var(--black-3)] flex items-center justify-center font-bold transition-all duration-150 ${
              cell === 'X' ? 'text-[var(--accent)]' :
              cell === 'O' ? 'text-[var(--success)]' :
              'hover:bg-[rgba(59,130,246,0.05)]'
            }`}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="mt-2 text-xs text-[var(--black-6)] shrink-0">
        先连成 {w} 子者获胜
      </div>
    </div>
  );
}
