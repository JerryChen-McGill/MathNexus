import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
  elapsedTime: number;
}

export default function NumberBombGame({ level, config, onComplete, onFail }: Props) {
  const { max = 100, guesses: maxGuesses = 0, timeLimit = 0 } = config.params;
  const [target, setTarget] = useState(0);
  const [guess, setGuess] = useState('');
  const [low, setLow] = useState(1);
  const [high, setHigh] = useState(max);
  const [guesses, setGuesses] = useState(0);
  const [history, setHistory] = useState<Array<{ num: number; result: string }>>([]);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    const t = Math.floor(Math.random() * max) + 1;
    setTarget(t);
    setGuess('');
    setLow(1);
    setHigh(max);
    setGuesses(0);
    setHistory([]);
    setGameOver(false);
    setMessage(`范围: 1 - ${max}`);
    setTimeLeft(timeLimit);
  }, [level, max]);

  useEffect(() => {
    if (timeLimit <= 0 || gameOver) return;
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
  }, [timeLimit, gameOver, onFail]);

  const handleGuess = () => {
    if (gameOver) return;
    const num = parseInt(guess);
    if (isNaN(num) || num < low || num > high) {
      setMessage(`请输入 ${low} 到 ${high} 之间的数字`);
      return;
    }

    const newGuesses = guesses + 1;
    setGuesses(newGuesses);

    if (num === target) {
      setGameOver(true);
      setMessage('恭喜!你猜中了!');
      const baseScore = 500;
      const guessBonus = maxGuesses > 0 ? Math.max(0, (maxGuesses - newGuesses) * 50) : 0;
      const timeBonus = timeLimit > 0 ? timeLeft * 10 : 0;
      const totalScore = baseScore + guessBonus + timeBonus;
      const optimalGuesses = Math.ceil(Math.log2(max));
      const stars = newGuesses <= optimalGuesses ? 3 : newGuesses <= optimalGuesses * 1.5 ? 2 : 1;
      setTimeout(() => onComplete(totalScore, stars), 500);
    } else {
      const newHistory = [...history, { num, result: num < target ? '太小' : '太大' }];
      setHistory(newHistory);
      if (num < target) {
        setLow(num + 1);
        setMessage(`${num} 太小了! 范围: ${num + 1} - ${high}`);
      } else {
        setHigh(num - 1);
        setMessage(`${num} 太大了! 范围: ${low} - ${num - 1}`);
      }

      if (maxGuesses > 0 && newGuesses >= maxGuesses) {
        setGameOver(true);
        setTimeout(() => onFail(`用完${maxGuesses}次机会,答案是${target}`), 500);
      }
    }
    setGuess('');
  };

  return (
    <div className="flex flex-col items-center h-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-sm text-[var(--black-6)] mb-2">
          范围: <span className="font-mono-data text-[var(--accent)]">1 - {max}</span>
          {maxGuesses > 0 && <span className="ml-4">剩余次数: <span className="font-mono-data">{maxGuesses - guesses}</span></span>}
        </div>
        <div className={`text-lg font-medium ${message.includes('恭喜') ? 'text-[var(--success)]' : 'text-white'}`}>
          {message}
        </div>
      </div>

      {/* Visual range bar */}
      <div className="w-full h-8 bg-[var(--black-2)] rounded-full border border-[var(--black-3)] mb-6 relative overflow-hidden">
        <div
          className="absolute h-full bg-[var(--accent)]/30 rounded-full transition-all duration-500"
          style={{
            left: `${((low - 1) / max) * 100}%`,
            width: `${((high - low + 1) / max) * 100}%`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono-data text-white">{low} - {high}</span>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-3 mb-6 w-full">
        <input
          type="number"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
          placeholder={`${low}-${high}`}
          disabled={gameOver}
          className="flex-1 px-4 py-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] font-mono-data text-white placeholder-[var(--black-5)] focus:border-[var(--accent)] focus:outline-none transition-all"
        />
        <button
          onClick={handleGuess}
          disabled={gameOver}
          className="px-6 py-3 bg-[var(--accent)] rounded-lg text-white font-medium hover:bg-[var(--accent-dark)] transition-all disabled:opacity-50"
        >
          猜测
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="w-full">
          <h4 className="text-sm text-[var(--black-6)] mb-2">猜测历史</h4>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <span
                key={i}
                className={`px-3 py-1 rounded-lg text-sm font-mono-data ${
                  h.result === '太小' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                }`}
              >
                {h.num} {h.result}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
