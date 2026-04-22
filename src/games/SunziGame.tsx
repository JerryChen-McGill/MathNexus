import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

export default function SunziGame({ level, config, onComplete, onFail }: Props) {
  const { mod3 = 2, mod5 = 3, mod7 = 2, mod11 = 0, timeLimit = 0 } = config.params;
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    setAnswer(''); setTimeLeft(timeLimit); setMessage(''); setAttempts(0);
  }, [level, timeLimit]);

  useEffect(() => {
    if (timeLimit <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); onFail('时间耗尽'); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit, onFail]);

  const mods = [
    { mod: 3, rem: mod3 },
    { mod: 5, rem: mod5 },
    { mod: 7, rem: mod7 },
    ...(mod11 > 0 ? [{ mod: 11, rem: mod11 }] : []),
  ];

  const handleSubmit = () => {
    const ans = parseInt(answer);
    if (isNaN(ans) || ans < 1) { setMessage('请输入正整数'); return; }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    for (const { mod, rem } of mods) {
      if (ans % mod !== rem) {
        setMessage(`${ans} % ${mod} = ${ans % mod} ≠ ${rem}`);
        return;
      }
    }

    const score = 500 + (mods.length > 3 ? 200 : 0) + (timeLimit > 0 ? timeLeft * 5 : 0);
    const stars = newAttempts <= 2 ? 3 : newAttempts <= 5 ? 2 : 1;
    onComplete(score, stars);
  };

  return (
    <div className="flex flex-col items-center h-full max-w-md mx-auto">
      {timeLimit > 0 && <div className="text-sm text-[var(--black-6)] mb-2">剩余: <span className="font-mono-data text-[var(--accent)]">{timeLeft}s</span></div>}

      <div className="text-center mb-6 p-4 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)]">
        <p className="text-lg text-white font-medium mb-2">今有物不知其数</p>
        {mods.map(({ mod, rem }, i) => (
          <p key={i} className="text-sm text-[var(--black-5)]">
            <span className="text-[var(--accent)]">{mod}</span>三数之剩<span className="text-[var(--accent)]">{rem}</span>
            {i < mods.length - 1 && '，'}
          </p>
        ))}
        <p className="text-sm text-[var(--black-6)] mt-2">问物几何？</p>
      </div>

      {message && <div className="text-sm text-[var(--danger)] mb-4">{message}</div>}

      <input type="number" value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        className="w-full px-4 py-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] font-mono-data text-white text-center text-xl focus:border-[var(--accent)] focus:outline-none mb-4" placeholder="?" />

      <button onClick={handleSubmit} className="px-8 py-3 bg-[var(--accent)] rounded-lg text-white font-medium hover:bg-[var(--accent-dark)] transition-all w-full">
        提交答案
      </button>

      <div className="mt-4 text-xs text-[var(--black-6)]">
        提示: 寻找同时满足所有条件的最小正整数
      </div>
    </div>
  );
}
