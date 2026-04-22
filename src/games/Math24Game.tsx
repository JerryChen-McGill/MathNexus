import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

function generate24Numbers(maxNum: number): number[] {
  let nums: number[];
  let attempts = 0;
  do {
    nums = Array.from({ length: 4 }, () => Math.floor(Math.random() * maxNum) + 1);
    attempts++;
  } while (!canMake24(nums) && attempts < 100);
  if (attempts >= 100) return [3, 3, 8, 8]; // classic solvable
  return nums;
}

function canMake24(nums: number[]): boolean {
  const ops = ['+', '-', '*', '/'];
  const perms = permutations(nums);
  for (const p of perms) {
    for (const op1 of ops) {
      for (const op2 of ops) {
        for (const op3 of ops) {
          // Different parenthesizations
          const patterns = [
            `(${p[0]}${op1}${p[1]})${op2}(${p[2]}${op3}${p[3]})`,
            `((${p[0]}${op1}${p[1]})${op2}${p[2]})${op3}${p[3]}`,
            `${p[0]}${op1}((${p[1]}${op2}${p[2]})${op3}${p[3]})`,
            `${p[0]}${op1}(${p[1]}${op2}(${p[2]}${op3}${p[3]}))`,
          ];
          for (const expr of patterns) {
            try {
              // eslint-disable-next-line no-eval
              const result = eval(expr);
              if (Math.abs(result - 24) < 0.0001) return true;
            } catch { /* ignore */ }
          }
        }
      }
    }
  }
  return false;
}

function permutations(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr];
  const result: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

export default function Math24Game({ level, config, onComplete, onFail }: Props) {
  const { maxNum = 9, questions = 5, timeLimit = 0 } = config.params;
  const [numbers, setNumbers] = useState<number[]>([]);
  const [expression, setExpression] = useState('');
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [currentQ, setCurrentQ] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    startNewQuestion();
    setTimeLeft(timeLimit);
    setCurrentQ(0);
    setCorrectCount(0);
    setGameOver(false);
  }, [level]);

  useEffect(() => {
    if (timeLimit <= 0 || gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame(correctCount);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit, gameOver, correctCount]);

  const startNewQuestion = () => {
    const nums = generate24Numbers(maxNum);
    setNumbers(nums);
    setExpression('');
    setUsedIndices(new Set());
    setMessage('');
  };

  const endGame = (correct: number) => {
    setGameOver(true);
    const requiredCorrect = level <= 2 ? 1 : level <= 4 ? Math.ceil(questions * 0.6) : questions;
    if (correct >= requiredCorrect) {
      const baseScore = correct * 200;
      const timeBonus = timeLimit > 0 ? timeLeft * 10 : 0;
      const stars = correct === questions ? 3 : correct >= questions * 0.8 ? 2 : 1;
      onComplete(baseScore + timeBonus, stars);
    } else {
      onFail(`只完成了 ${correct}/${questions} 题`);
    }
  };

  const handleNumberClick = (num: number, index: number) => {
    if (usedIndices.has(index) || gameOver) return;
    setExpression(prev => prev + num);
    setUsedIndices(prev => new Set(prev).add(index));
  };

  const handleOpClick = (op: string) => {
    if (gameOver) return;
    setExpression(prev => prev + ' ' + op + ' ');
  };

  const handleSubmit = () => {
    if (gameOver) return;
    try {
      // eslint-disable-next-line no-eval
      const result = eval(expression.replace(/×/g, '*').replace(/÷/g, '/'));
      if (Math.abs(result - 24) < 0.001 && usedIndices.size === 4) {
        setMessage('正确!');
        const newCorrect = correctCount + 1;
        setCorrectCount(newCorrect);
        if (currentQ + 1 >= questions) {
          endGame(newCorrect);
        } else {
          setCurrentQ(prev => prev + 1);
          setTimeout(startNewQuestion, 500);
        }
      } else {
        setMessage(result !== 24 ? `=${result}, 需要24` : '必须使用所有4个数字');
      }
    } catch {
      setMessage('算式有误');
    }
  };

  const handleClear = () => {
    setExpression('');
    setUsedIndices(new Set());
    setMessage('');
  };

  if (gameOver) return null;

  return (
    <div className="flex flex-col items-center h-full max-w-lg mx-auto">
      {/* Progress */}
      <div className="w-full flex items-center justify-between mb-4">
        <span className="text-sm text-[var(--black-6)]">题 {currentQ + 1}/{questions}</span>
        <span className="text-sm text-[var(--black-6)]">正确 {correctCount}</span>
        {timeLimit > 0 && (
          <span className="font-mono-data text-sm text-[var(--accent)]">{timeLeft}s</span>
        )}
      </div>

      {/* Number Cards */}
      <div className="flex gap-4 mb-8">
        {numbers.map((num, i) => (
          <button
            key={i}
            onClick={() => handleNumberClick(num, i)}
            disabled={usedIndices.has(i)}
            className={`w-16 h-20 sm:w-20 sm:h-24 rounded-xl border-2 flex items-center justify-center font-mono-data text-2xl sm:text-3xl font-bold transition-all duration-200 ${
              usedIndices.has(i)
                ? 'border-[var(--black-4)] bg-[var(--black-3)] text-[var(--black-5)] opacity-40'
                : 'border-[var(--accent)] bg-[var(--black-2)] text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:scale-105'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Expression */}
      <div className="w-full p-4 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)] mb-6 min-h-[60px] flex items-center justify-center">
        <span className="font-mono-data text-xl text-white">
          {expression || '点击数字和运算符'}
        </span>
      </div>

      {/* Operators */}
      <div className="flex gap-3 mb-6">
        {['+', '-', '*', '/'].map(op => (
          <button
            key={op}
            onClick={() => handleOpClick(op)}
            className="w-14 h-14 rounded-full bg-[var(--black-2)] border border-[var(--black-3)] font-mono-data text-xl text-white hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all duration-200"
          >
            {op === '*' ? '×' : op === '/' ? '÷' : op}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleClear}
          className="px-6 py-2.5 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] text-[var(--black-6)] hover:text-white transition-all"
        >
          清除
        </button>
        <button
          onClick={handleSubmit}
          className="px-8 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-dark)] transition-all"
        >
          提交
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mt-4 text-sm font-medium ${message === '正确!' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
