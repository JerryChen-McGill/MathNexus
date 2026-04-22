import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

function checkWinner(board: (string | null)[], size: number, winLen: number): string | null {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = board[r * size + c];
      if (!cell) continue;
      for (const [dr, dc] of dirs) {
        let count = 1;
        for (let i = 1; i < winLen; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
          if (board[nr * size + nc] === cell) count++;
          else break;
        }
        if (count >= winLen) return cell;
      }
    }
  }
  return null;
}

function minimax(board: (string | null)[], size: number, winLen: number, depth: number, isMax: boolean, alpha: number, beta: number): number {
  const winner = checkWinner(board, size, winLen);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (board.every(c => c !== null) || depth === 0) return 0;

  if (isMax) {
    let maxEval = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const eval_ = minimax(board, size, winLen, depth - 1, false, alpha, beta);
        board[i] = null;
        maxEval = Math.max(maxEval, eval_);
        alpha = Math.max(alpha, eval_);
        if (beta <= alpha) break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        const eval_ = minimax(board, size, winLen, depth - 1, true, alpha, beta);
        board[i] = null;
        minEval = Math.min(minEval, eval_);
        beta = Math.min(beta, eval_);
        if (beta <= alpha) break;
      }
    }
    return minEval;
  }
}

function getAIMove(board: (string | null)[], size: number, winLen: number, depth: number): number {
  let bestMove = -1;
  let bestEval = -Infinity;

  // Try winning move first
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      board[i] = 'O';
      if (checkWinner(board, size, winLen) === 'O') { board[i] = null; return i; }
      board[i] = null;
    }
  }
  // Block player win
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      board[i] = 'X';
      if (checkWinner(board, size, winLen) === 'X') { board[i] = null; return i; }
      board[i] = null;
    }
  }

  const moves = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1).sort(() => Math.random() - 0.5);

  for (const i of moves) {
    board[i] = 'O';
    const eval_ = minimax(board, size, winLen, depth, false, -Infinity, Infinity);
    board[i] = null;
    if (eval_ > bestEval) {
      bestEval = eval_;
      bestMove = i;
    }
  }

  return bestMove;
}

export default function TicTacToeGame({ level, config, onComplete, onFail }: Props) {
  const { size = 3, win = 3, depth = 3 } = config.params;
  const [board, setBoard] = useState<(string | null)[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);

  const s = Number(size) || 3;
  const w = Number(win) || 3;
  const d = Number(depth) || 3;

  useEffect(() => {
    setBoard(Array(s * s).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setIsDraw(false);
    setMoveCount(0);
    setAiThinking(false);
  }, [level, s]);

  // AI move
  useEffect(() => {
    if (currentPlayer === 'O' && !winner && !isDraw) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        const boardCopy = [...board];
        const move = getAIMove(boardCopy, s, w, d);
        if (move >= 0) {
          const newBoard = [...board];
          newBoard[move] = 'O';
          const newMoveCount = moveCount + 1;
          setBoard(newBoard);
          setCurrentPlayer('X');
          setMoveCount(newMoveCount);
          setAiThinking(false);

          const win = checkWinner(newBoard, s, w);
          if (win) {
            setWinner(win);
            if (win === 'X') {
              const score = 500 + (s * s - newMoveCount) * 20;
              const stars = newMoveCount <= s * s * 0.5 ? 3 : 2;
              setTimeout(() => onComplete(score, stars), 500);
            } else {
              setTimeout(() => onFail('AI获胜'), 500);
            }
          } else if (newBoard.every(c => c !== null)) {
            setIsDraw(true);
            setTimeout(() => onFail('平局'), 500);
          }
        }
      }, d > 4 ? 800 : 400);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, winner, isDraw, board, s, w, d, moveCount, onComplete, onFail]);

  const handleCellClick = (index: number) => {
    if (board[index] !== null || currentPlayer !== 'X' || winner || aiThinking) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    const newMoveCount = moveCount + 1;
    setBoard(newBoard);
    setCurrentPlayer('O');
    setMoveCount(newMoveCount);

    const win = checkWinner(newBoard, s, w);
    if (win) {
      setWinner(win);
      const score = 500 + (s * s - newMoveCount) * 20;
      const stars = newMoveCount <= s * s * 0.5 ? 3 : 2;
      setTimeout(() => onComplete(score, stars), 500);
    } else if (newBoard.every(c => c !== null)) {
      setIsDraw(true);
      setTimeout(() => onFail('平局'), 500);
    }
  };

  const cellSize = s <= 3 ? 'w-20 h-20 sm:w-24 sm:h-24 text-3xl' :
    s <= 4 ? 'w-16 h-16 sm:w-18 sm:h-18 text-2xl' :
    'w-10 h-10 sm:w-12 sm:h-12 text-xl';

  return (
    <div className="flex flex-col items-center h-full">
      <div className="flex items-center gap-4 mb-4">
        <div className={`text-sm font-medium ${currentPlayer === 'X' ? 'text-[var(--accent)]' : 'text-[var(--black-6)]'}`}>
          玩家 (X)
        </div>
        <div className="text-sm text-[var(--black-6)]">
          {aiThinking ? 'AI思考中...' : winner ? (winner === 'X' ? '你赢了!' : 'AI赢了') : isDraw ? '平局' : `第 ${moveCount + 1} 步`}
        </div>
        <div className={`text-sm font-medium ${currentPlayer === 'O' ? 'text-[var(--success)]' : 'text-[var(--black-6)]'}`}>
          AI (O)
        </div>
      </div>

      <div
        className="grid gap-1 p-2 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)]"
        style={{ gridTemplateColumns: `repeat(${s}, 1fr)` }}
      >
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleCellClick(i)}
            disabled={cell !== null || aiThinking}
            className={`${cellSize} rounded-lg border-2 flex items-center justify-center font-bold transition-all duration-200 ${
              cell === 'X'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : cell === 'O'
                ? 'border-[var(--success)] text-[var(--success)]'
                : 'border-[var(--black-3)] hover:border-[var(--accent)]/50 hover:bg-[rgba(59,130,246,0.05)]'
            }`}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="mt-4 text-xs text-[var(--black-6)]">
        连成 {w} 个获胜
      </div>
    </div>
  );
}
