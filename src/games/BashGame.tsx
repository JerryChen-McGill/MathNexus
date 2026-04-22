import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

export default function BashGame({ level, config, onComplete, onFail }: Props) {
  const { total = 21, maxTake = 3 } = config.params;
  const [stones, setStones] = useState(total);
  const [currentPlayer, setCurrentPlayer] = useState<'human' | 'ai'>('human');
  const [take, setTake] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState(`共 ${total} 个石子，每次可取 1-${maxTake} 个`);

  useEffect(() => {
    setStones(total);
    setCurrentPlayer('human');
    setTake(1);
    setGameOver(false);
    setMessage(`共 ${total} 个石子，每次可取 1-${maxTake} 个，取最后一个者获胜`);
  }, [level, total, maxTake]);

  useEffect(() => {
    if (currentPlayer === 'ai' && !gameOver) {
      const timer = setTimeout(() => {
        // Optimal: leave multiple of (maxTake+1)
        const optimal = stones % (maxTake + 1);
        const aiTake = optimal === 0 ? Math.floor(Math.random() * Math.min(maxTake, stones)) + 1 : optimal;
        const remaining = stones - aiTake;
        setStones(remaining);
        setMessage(`AI取走了 ${aiTake} 个，剩余 ${remaining} 个`);

        if (remaining === 0) {
          setGameOver(true);
          setTimeout(() => onFail('AI取走了最后一个石子'), 500);
        } else {
          setCurrentPlayer('human');
          setTake(1);
        }
      }, 800);
      return () => clearInterval(timer);
    }
  }, [currentPlayer, gameOver, stones, maxTake, onFail]);

  const handleTake = () => {
    if (currentPlayer !== 'human' || gameOver || take < 1 || take > maxTake || take > stones) return;
    const remaining = stones - take;
    setStones(remaining);
    setMessage(`你取走了 ${take} 个，剩余 ${remaining} 个`);

    if (remaining === 0) {
      setGameOver(true);
      const score = 400 + (total > 50 ? 200 : 0);
      setTimeout(() => onComplete(score, 3), 500);
    } else {
      setCurrentPlayer('ai');
    }
  };

  return (
    <div className="flex flex-col items-center h-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-sm text-[var(--black-6)] mb-2">剩余石子</div>
        <div className="font-mono-data text-4xl text-[var(--accent)]">{stones}</div>
        <div className="text-sm text-[var(--black-5)] mt-2">{message}</div>
      </div>

      {/* Stones visualization */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-8 max-w-xs">
        {Array.from({ length: Math.min(stones, 50) }, (_, i) => (
          <div key={i} className="w-4 h-4 rounded-full bg-[var(--accent)]/60" />
        ))}
        {stones > 50 && <span className="text-xs text-[var(--black-6)] ml-2">+{stones - 50}</span>}
      </div>

      {currentPlayer === 'human' && !gameOver && (
        <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)] w-full">
          <div className="text-sm text-[var(--black-6)]">取走多少个?</div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTake(Math.max(1, take - 1))} className="w-8 h-8 rounded-lg bg-[var(--black-3)] text-white">-</button>
            <span className="font-mono-data text-xl text-white w-12 text-center">{take}</span>
            <button onClick={() => setTake(Math.min(maxTake, stones, take + 1))} className="w-8 h-8 rounded-lg bg-[var(--black-3)] text-white">+</button>
          </div>
          <button onClick={handleTake} className="w-full px-6 py-2.5 bg-[var(--accent)] rounded-lg text-white font-medium hover:bg-[var(--accent-dark)] transition-all">
            确认取走
          </button>
        </div>
      )}

      {currentPlayer === 'ai' && !gameOver && (
        <div className="text-sm text-[var(--black-6)] animation-pulse">AI 思考中...</div>
      )}
    </div>
  );
}
