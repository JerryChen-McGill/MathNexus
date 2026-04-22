import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

export default function HundredChickenGame({ level, config, onComplete, onFail }: Props) {
  const { rooster = 5, hen = 3, chick3 = 1, total = 100, money = 100, timeLimit = 0 } = config.params;
  const [roosters, setRoosters] = useState('');
  const [hens, setHens] = useState('');
  const [chicks, setChicks] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    setRoosters(''); setHens(''); setChicks('');
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
    const r = parseInt(roosters) || 0;
    const h = parseInt(hens) || 0;
    const c = parseInt(chicks) || 0;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (r + h + c !== total) {
      setMessage(`总数应为 ${total}，你的答案: ${r + h + c}`);
      return;
    }
    if (r * rooster + h * hen + (c / 3) * chick3 !== money) {
      setMessage(`总价错误，应为 ${money}`);
      return;
    }
    if (c % 3 !== 0) {
      setMessage('小鸡必须是3的倍数');
      return;
    }

    const score = 500 + (timeLimit > 0 ? timeLeft * 5 : 0);
    const stars = newAttempts <= 3 ? 3 : newAttempts <= 6 ? 2 : 1;
    onComplete(score, stars);
  };

  return (
    <div className="flex flex-col items-center h-full max-w-md mx-auto">
      {timeLimit > 0 && <div className="text-sm text-[var(--black-6)] mb-2">剩余: <span className="font-mono-data text-[var(--accent)]">{timeLeft}s</span></div>}

      <div className="text-center mb-6 p-4 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)]">
        <p className="text-sm text-[var(--black-5)] leading-relaxed">
          鸡翁一，值钱<span className="text-[var(--accent)]">{rooster}</span>；
          鸡母一，值钱<span className="text-[var(--accent)]">{hen}</span>；
          鸡雏三，值钱<span className="text-[var(--accent)]">{chick3}</span>。
          <br />
          百钱买百鸡，问鸡翁、母、雏各几何？
        </p>
        <p className="text-xs text-[var(--black-6)] mt-2">
          {total}钱买{total}只鸡
        </p>
      </div>

      {message && <div className="text-sm text-[var(--danger)] mb-4">{message}</div>}

      <div className="w-full space-y-4">
        <div>
          <label className="text-sm text-[var(--black-6)] mb-1 block">公鸡 ({rooster}钱/只)</label>
          <input type="number" value={roosters} onChange={e => setRoosters(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] font-mono-data text-white focus:border-[var(--accent)] focus:outline-none" placeholder="0" />
        </div>
        <div>
          <label className="text-sm text-[var(--black-6)] mb-1 block">母鸡 ({hen}钱/只)</label>
          <input type="number" value={hens} onChange={e => setHens(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] font-mono-data text-white focus:border-[var(--accent)] focus:outline-none" placeholder="0" />
        </div>
        <div>
          <label className="text-sm text-[var(--black-6)] mb-1 block">小鸡 ({chick3}钱/3只)</label>
          <input type="number" value={chicks} onChange={e => setChicks(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] font-mono-data text-white focus:border-[var(--accent)] focus:outline-none" placeholder="0 (需为3的倍数)" />
        </div>
      </div>

      <button onClick={handleSubmit} className="mt-6 px-8 py-3 bg-[var(--accent)] rounded-lg text-white font-medium hover:bg-[var(--accent-dark)] transition-all w-full">
        提交答案
      </button>
    </div>
  );
}
