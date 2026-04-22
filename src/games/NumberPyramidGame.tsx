import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
  elapsedTime: number;
}

function generatePyramid(rows: number): { bottom: number[]; target: number } {
  // Generate from top to bottom, then reveal only bottom
  const pyramid: number[][] = [];
  const top = Math.floor(Math.random() * 20) + 5;
  pyramid[0] = [top];

  for (let r = 1; r < rows; r++) {
    pyramid[r] = [];
    for (let c = 0; c <= r; c++) {
      const parent1 = c < r ? pyramid[r - 1][c] : pyramid[r - 1][c - 1];
      const parent2 = c > 0 ? pyramid[r - 1][c - 1] : pyramid[r - 1][c];
      const diff = Math.floor(Math.random() * 15) - 7;
      pyramid[r].push((parent1 + parent2) / 2 + diff);
    }
  }

  // Round all values
  for (let r = 0; r < rows; r++) {
    pyramid[r] = pyramid[r].map(v => Math.round(v));
  }

  return { bottom: pyramid[rows - 1], target: pyramid[0][0] };
}

export default function NumberPyramidGame({ level, config, onComplete, onFail }: Props) {
  const { size = 5, timeLimit = 0 } = config.params;
  const rows = Math.min(Number(size) || 5, 8);
  const [bottom, setBottom] = useState<number[]>([]);
  const [target, setTarget] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const { bottom: b, target: t } = generatePyramid(rows);
    setBottom(b);
    setTarget(t);
    setUserAnswer('');
    setTimeLeft(timeLimit);
    setMessage('根据底层数字，推断出顶层的数字');
    setAttempts(0);
  }, [level, rows, timeLimit]);

  useEffect(() => {
    if (timeLimit <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); onFail('时间耗尽'); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit, onFail]);

  const handleSubmit = () => {
    const ans = parseInt(userAnswer);
    if (isNaN(ans)) { setMessage('请输入数字'); return; }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (ans === target) {
      const score = 400 + rows * 50 + (timeLimit > 0 ? timeLeft * 5 : 0);
      const stars = newAttempts <= 2 ? 3 : newAttempts <= 4 ? 2 : 1;
      onComplete(score, stars);
    } else {
      setMessage(`不对，再试一次 (你的答案: ${ans})`);
    }
  };

  // Build pyramid display from bottom
  const pyramidRows: number[][] = [];
  let currentRow = [...bottom];
  pyramidRows.push(currentRow);

  for (let r = rows - 2; r >= 0; r--) {
    const nextRow: number[] = [];
    for (let c = 0; c <= r; c++) {
      const left = currentRow[c];
      const right = currentRow[c + 1];
      nextRow.push(Math.round((left + right) / 2));
    }
    pyramidRows.push(nextRow);
    currentRow = nextRow;
  }

  return (
    <div className="flex flex-col items-center h-full max-w-md mx-auto">
      {timeLimit > 0 && <div className="text-sm text-[var(--black-6)] mb-2">剩余: <span className="font-mono-data text-[var(--accent)]">{timeLeft}s</span></div>}

      <div className="text-sm text-[var(--black-5)] mb-4 text-center">{message}</div>

      {/* Pyramid */}
      <div className="flex flex-col items-center gap-2 mb-6">
        {/* Target (hidden) */}
        <div className="w-16 h-12 rounded-lg bg-[var(--accent)]/20 border-2 border-[var(--accent)] flex items-center justify-center mb-2">
          <span className="font-mono-data text-lg text-[var(--accent)]">?</span>
        </div>

        {/* Middle rows (computed) */}
        {pyramidRows.slice(1).reverse().map((row, ri) => (
          <div key={ri} className="flex gap-2">
            {row.map((num, ci) => (
              <div key={ci} className="w-12 h-10 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] flex items-center justify-center">
                <span className="font-mono-data text-sm text-[var(--black-5)]">{num}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Bottom row (given) */}
        <div className="flex gap-2">
          {bottom.map((num, i) => (
            <div key={i} className="w-12 h-10 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center">
              <span className="font-mono-data text-sm text-[var(--accent)]">{num}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex gap-3">
        <input
          type="number"
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="顶层数字?"
          className="flex-1 px-4 py-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] font-mono-data text-white text-center focus:border-[var(--accent)] focus:outline-none"
        />
        <button onClick={handleSubmit} className="px-6 py-3 bg-[var(--accent)] rounded-lg text-white font-medium hover:bg-[var(--accent-dark)] transition-all">
          提交
        </button>
      </div>

      <div className="mt-4 text-xs text-[var(--black-6)]">
        每一层的数字 = 下层相邻两数的平均值（取整）
      </div>
    </div>
  );
}
