import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

function nimSum(piles: number[]): number {
  return piles.reduce((a, b) => a ^ b, 0);
}

function getOptimalMove(piles: number[], misere: boolean): [number, number] {
  const sum = nimSum(piles);
  if (sum === 0) {
    // Losing position, take 1 from first non-empty pile
    for (let i = 0; i < piles.length; i++) {
      if (piles[i] > 0) return [i, 1];
    }
    return [-1, 0];
  }

  for (let i = 0; i < piles.length; i++) {
    const target = piles[i] ^ sum;
    if (target < piles[i]) {
      const take = piles[i] - target;
      if (misere) {
        const nonEmpty = piles.filter(p => p > 0).length;
        if (nonEmpty === 1 && piles[i] === take) continue;
      }
      return [i, take];
    }
  }
  // Fallback
  for (let i = 0; i < piles.length; i++) {
    if (piles[i] > 0) return [i, 1];
  }
  return [-1, 0];
}

export default function NimGame({ level, config, onComplete, onFail }: Props) {
  const { piles = 3, maxStones = 10, variant = 0 } = config.params;
  const [pileList, setPileList] = useState<number[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'human' | 'ai'>('human');
  const [selectedPile, setSelectedPile] = useState<number | null>(null);
  const [takeAmount, setTakeAmount] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [moveCount, setMoveCount] = useState(0);

  const p = Number(piles) || 3;
  const ms = Number(maxStones) || 10;
  const v = Number(variant) || 0; // 0=normal, 1=misere

  useEffect(() => {
    const newPiles = Array.from({ length: p }, () => Math.floor(Math.random() * (ms - 2)) + 3);
    setPileList(newPiles);
    setCurrentPlayer('human');
    setSelectedPile(null);
    setTakeAmount(1);
    setGameOver(false);
    setMessage('从一堆中取走任意数量的石子');
    setMoveCount(0);
  }, [level, p, ms]);

  // AI move
  useEffect(() => {
    if (currentPlayer === 'ai' && !gameOver) {
      const timer = setTimeout(() => {
        const misere = v === 1;
        const [pileIdx, take] = getOptimalMove([...pileList], misere);
        if (pileIdx >= 0) {
          const newPiles = [...pileList];
          newPiles[pileIdx] -= take;
          const newCount = moveCount + 1;
          setPileList(newPiles);
          setCurrentPlayer('human');
          setMoveCount(newCount);
          setMessage(`AI从第${pileIdx + 1}堆取走了${take}个石子`);

          // Check if game over
          if (newPiles.every(p => p === 0)) {
            setGameOver(true);
            const normalWin = v === 0 || v === 2;
            if (normalWin) {
              setTimeout(() => onFail('AI取走了最后一个石子'), 500);
            } else {
              const score = 500 + (10 - newCount) * 30;
              setTimeout(() => onComplete(score, 2), 500);
            }
          }
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameOver, pileList, v, moveCount, onComplete, onFail]);

  const handlePileSelect = (index: number) => {
    if (currentPlayer !== 'human' || gameOver || pileList[index] === 0) return;
    setSelectedPile(index);
    setTakeAmount(1);
  };

  const handleTake = () => {
    if (selectedPile === null || currentPlayer !== 'human' || gameOver) return;
    if (takeAmount > pileList[selectedPile] || takeAmount < 1) {
      setMessage('取的石子数无效');
      return;
    }

    const newPiles = [...pileList];
    newPiles[selectedPile] -= takeAmount;
    const newCount = moveCount + 1;
    setPileList(newPiles);
    setCurrentPlayer('ai');
    setMoveCount(newCount);
    setMessage(`你从第${selectedPile + 1}堆取走了${takeAmount}个石子`);
    setSelectedPile(null);

    if (newPiles.every(p => p === 0)) {
      setGameOver(true);
      const normalWin = v === 0 || v === 2;
      if (normalWin) {
        const score = 500 + (10 - newCount) * 30;
        const stars = newCount <= 3 ? 3 : newCount <= 6 ? 2 : 1;
        setTimeout(() => onComplete(score, stars), 500);
      } else {
        setTimeout(() => onFail('你被迫取走了最后一个石子'), 500);
      }
    }
  };

  return (
    <div className="flex flex-col items-center h-full max-w-lg mx-auto">
      <div className="text-center mb-4">
        <div className="text-sm text-[var(--black-6)] mb-2">
          {v === 1 ? 'Misère规则: 取最后一个者输' : '普通规则: 取最后一个者赢'}
        </div>
        <div className="text-sm text-[var(--black-5)]">{message}</div>
      </div>

      {/* Piles */}
      <div className="flex gap-6 mb-6">
        {pileList.map((count, i) => (
          <button
            key={i}
            onClick={() => handlePileSelect(i)}
            disabled={currentPlayer !== 'human' || count === 0}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedPile === i
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--black-3)] bg-[var(--black-2)] hover:border-[var(--black-4)]'
            } ${count === 0 ? 'opacity-40' : ''}`}
          >
            <span className="text-xs text-[var(--black-6)]">堆 {i + 1}</span>
            <div className="flex flex-wrap gap-1 justify-center max-w-[80px]">
              {Array.from({ length: Math.min(count, 20) }, (_, j) => (
                <div
                  key={j}
                  className="w-3 h-3 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)]"
                />
              ))}
              {count > 20 && <span className="text-xs text-[var(--black-6)]">+{count - 20}</span>}
            </div>
            <span className="font-mono-data text-lg text-white">{count}</span>
          </button>
        ))}
      </div>

      {/* Take controls */}
      {selectedPile !== null && (
        <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)]">
          <div className="text-sm text-[var(--black-6)]">
            第{selectedPile + 1}堆, 取走:
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTakeAmount(Math.max(1, takeAmount - 1))}
              className="w-8 h-8 rounded-lg bg-[var(--black-3)] text-white hover:bg-[var(--black-4)]"
            >
              -
            </button>
            <span className="font-mono-data text-xl text-white w-12 text-center">{takeAmount}</span>
            <button
              onClick={() => setTakeAmount(Math.min(pileList[selectedPile], takeAmount + 1))}
              className="w-8 h-8 rounded-lg bg-[var(--black-3)] text-white hover:bg-[var(--black-4)]"
            >
              +
            </button>
          </div>
          <button
            onClick={handleTake}
            className="px-6 py-2 bg-[var(--accent)] rounded-lg text-white font-medium hover:bg-[var(--accent-dark)] transition-all"
          >
            确认取走
          </button>
        </div>
      )}

      {currentPlayer === 'ai' && !gameOver && (
        <div className="mt-4 text-sm text-[var(--black-6)] animation-pulse">
          AI 思考中...
        </div>
      )}
    </div>
  );
}
