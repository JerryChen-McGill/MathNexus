import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

export default function NumberRaceGame({ level, config, onComplete, onFail }: Props) {
  const { target = 30, maxStep = 3, variant = 0 } = config.params;
  const [current, setCurrent] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<'human' | 'ai'>('human');
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState(`目标: 先报到 ${target} 者${variant === 1 ? '输' : '赢'}`);

  useEffect(() => {
    setCurrent(0);
    setCurrentPlayer('human');
    setGameOver(false);
    setMessage(`目标: ${target}，每次报 1-${maxStep} 个数，先报到${target}者${variant === 1 ? '输' : '赢'}`);
  }, [level, target, maxStep, variant]);

  useEffect(() => {
    if (currentPlayer === 'ai' && !gameOver) {
      const timer = setTimeout(() => {
        const misere = variant === 1;
        const winningTarget = misere ? target - 1 : target;
        const mod = maxStep + 1;
        let aiMove: number;

        if (current === 0) {
          aiMove = misere ? 1 : (winningTarget % mod) || Math.floor(Math.random() * maxStep) + 1;
        } else {
          const desired = Math.floor((current) / mod) * mod;
          aiMove = current - desired;
          if (aiMove <= 0 || aiMove > maxStep) {
            aiMove = Math.floor(Math.random() * maxStep) + 1;
          }
        }

        aiMove = Math.min(aiMove, maxStep, target - current);
        if (aiMove < 1) aiMove = 1;

        const newCurrent = current + aiMove;
        setCurrent(newCurrent);

        if (newCurrent >= target) {
          setGameOver(true);
          if (variant === 1) {
            const score = 400 + (target > 50 ? 200 : 0);
            setTimeout(() => onComplete(score, 2), 500);
          } else {
            setTimeout(() => onFail('AI先报到了目标'), 500);
          }
        } else {
          setMessage(`AI报了 ${aiMove} 个，当前: ${newCurrent}`);
          setCurrentPlayer('human');
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameOver, current, target, maxStep, variant, onComplete, onFail]);

  const handleMove = (step: number) => {
    if (currentPlayer !== 'human' || gameOver || step < 1 || step > maxStep) return;
    const newCurrent = current + step;
    if (newCurrent > target) return;
    setCurrent(newCurrent);

    if (newCurrent >= target) {
      setGameOver(true);
      if (variant === 1) {
        setTimeout(() => onFail('你被迫报到了目标'), 500);
      } else {
        const score = 500 + (target > 50 ? 200 : 0);
        const stars = step === (target - current) ? 3 : 2;
        setTimeout(() => onComplete(score, stars), 500);
      }
    } else {
      setMessage(`你报了 ${step} 个，当前: ${newCurrent}`);
      setCurrentPlayer('ai');
    }
  };

  const progress = (current / target) * 100;

  return (
    <div className="flex flex-col items-center h-full max-w-lg mx-auto">
      <div className="text-center mb-4">
        <div className="text-sm text-[var(--black-6)]">{message}</div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-6 bg-[var(--black-2)] rounded-full border border-[var(--black-3)] mb-2 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-glow)] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono-data text-white">{current} / {target}</span>
        </div>
      </div>

      {/* Player positions */}
      <div className="w-full flex justify-between text-xs text-[var(--black-6)] mb-8">
        <span>0</span>
        <span>目标: {target}</span>
      </div>

      {currentPlayer === 'human' && !gameOver && (
        <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)] w-full">
          <div className="text-sm text-[var(--black-6)]">报几个数? (1-{maxStep})</div>
          <div className="flex gap-2">
            {Array.from({ length: maxStep }, (_, i) => i + 1).map(step => (
              <button
                key={step}
                onClick={() => handleMove(step)}
                disabled={current + step > target}
                className="w-12 h-12 rounded-lg bg-[var(--black-3)] font-mono-data text-white hover:bg-[var(--accent)] disabled:opacity-30 disabled:hover:bg-[var(--black-3)] transition-all"
              >
                {step}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentPlayer === 'ai' && !gameOver && (
        <div className="text-sm text-[var(--black-6)] animation-pulse">AI 思考中...</div>
      )}
    </div>
  );
}
