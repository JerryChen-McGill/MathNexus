import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

export default function ChickenRabbitGame({ level, config, onComplete, onFail }: Props) {
  const { heads = 35, legs = 94, timeLimit = 0 } = config.params;
  const [chicken, setChicken] = useState('');
  const [rabbit, setRabbit] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    setChicken(''); setRabbit('');
    setTimeLeft(timeLimit); setMessage(''); setAttempts(0);
  }, [level, timeLimit]);

  useEffect(() => {
    if (timeLimit <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); onFail('时间耗尽'); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit, onFail]);

  const handleSubmit = () => {
    const c = parseInt(chicken) || 0;
    const r = parseInt(rabbit) || 0;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (c + r !== heads) {
      setMessage(`头数不对，应为 ${heads}`);
      return;
    }
    if (c * 2 + r * 4 !== legs) {
      setMessage(`脚数不对，应为 ${legs}`);
      return;
    }

    const score = 400 + (timeLimit > 0 ? timeLeft * 5 : 0);
    const stars = newAttempts <= 2 ? 3 : newAttempts <= 4 ? 2 : 1;
    onComplete(score, stars);
  };

  return (
    <div className="flex flex-col items-center h-full max-w-md mx-auto">
      {timeLimit > 0 && <div className="text-sm text-[var(--black-6)] mb-2">剩余: <span className="font-mono-data text-[var(--accent)]">{timeLeft}s</span></div>}

      <div className="text-center mb-6 p-4 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)]">
        <p className="text-lg text-white font-medium">今有鸡兔同笼</p>
        <p className="text-sm text-[var(--black-5)] mt-2">
          上有 <span className="text-[var(--accent)] font-mono-data">{heads}</span> 头，
          下有 <span className="text-[var(--accent)] font-mono-data">{legs}</span> 足
        </p>
        <p className="text-sm text-[var(--black-6)] mt-1">问鸡兔各几何？</p>
      </div>

      {message && <div className="text-sm text-[var(--danger)] mb-4">{message}</div>}

      <div className="w-full space-y-4">
        <div>
          <label className="text-sm text-[var(--black-6)] mb-1 block">鸡 (2脚)</label>
          <input type="number" value={chicken} onChange={e => setChicken(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] font-mono-data text-white focus:border-[var(--accent)] focus:outline-none" placeholder="?" />
        </div>
        <div>
          <label className="text-sm text-[var(--black-6)] mb-1 block">兔 (4脚)</label>
          <input type="number" value={rabbit} onChange={e => setRabbit(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] font-mono-data text-white focus:border-[var(--accent)] focus:outline-none" placeholder="?" />
        </div>
      </div>

      <button onClick={handleSubmit} className="mt-6 px-8 py-3 bg-[var(--accent)] rounded-lg text-white font-medium hover:bg-[var(--accent-dark)] transition-all w-full">
        提交答案
      </button>
    </div>
  );
}
