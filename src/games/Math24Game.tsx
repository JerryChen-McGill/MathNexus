import { useGameClock } from '@/hooks/use-game-clock';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number | string | boolean> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

type Card = { id: number; value: number; expression: string };
type Operator = '+' | '−' | '×' | '÷';
const operators: Operator[] = ['+', '−', '×', '÷'];

function canMakeTarget(values: number[], target: number): boolean {
  const solve = (nums: number[]): boolean => {
    if (nums.length === 1) return Math.abs(nums[0] - target) < 1e-7;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const a = nums[i], b = nums[j];
        const rest = nums.filter((_, k) => k !== i && k !== j);
        const candidates = [a + b, a - b, b - a, a * b];
        if (Math.abs(b) > 1e-9) candidates.push(a / b);
        if (Math.abs(a) > 1e-9) candidates.push(b / a);
        if (candidates.some(value => solve([...rest, value]))) return true;
      }
    }
    return false;
  };
  return solve(values);
}

function generateNumbers(maxNum: number, target: number, cardCount: number): number[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const values = Array.from({ length: cardCount }, () => Math.floor(Math.random() * maxNum) + 1);
    if (canMakeTarget(values, target)) return values;
  }
  return cardCount === 2 ? [1, target - 1] : [3, 3, 8, 8];
}

function calculate(a: number, op: Operator, b: number): number | null {
  if (op === '+') return a + b;
  if (op === '−') return a - b;
  if (op === '×') return a * b;
  if (Math.abs(b) < 1e-9) return null;
  return a / b;
}

function format(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(4)));
}

export default function Math24Game({ level, config, onComplete, onFail }: Props) {
  const { setTimeout, setInterval, clearInterval } = useGameClock();
  const maxNum = Number(config.params.maxNum ?? 9);
  const questions = Number(config.params.questions ?? 5);
  const timeLimit = Number(config.params.timeLimit ?? 0);
  const target = Number(config.params.target ?? 24);
  const cardCount = Number(config.params.cardCount ?? 4);
  const cardSet = String(config.params.cards ?? '');
  const [cards, setCards] = useState<Card[]>([]);
  const [history, setHistory] = useState<Card[][]>([]);
  const [firstId, setFirstId] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [message, setMessage] = useState('先选一个数字，再选运算符和另一个数字');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const [solved, setSolved] = useState(false);
  const nextId = useRef(0);
  const questionIndexRef = useRef(0);
  const correctRef = useRef(0);
  const gameOverRef = useRef(false);
  const finishRef = useRef<(correct: number) => void>(() => {});

  const createQuestion = useCallback(() => {
    const presets = typeof cardSet === 'string' ? cardSet.split('|').filter(Boolean) : [];
    const preset = presets[questionIndexRef.current % Math.max(presets.length, 1)];
    const values = preset
      ? preset.split(',').map(value => Number(value.trim()))
      : generateNumbers(maxNum, target, cardCount);
    setCards(values.map(value => ({ id: nextId.current++, value, expression: String(value) })));
    setHistory([]);
    setFirstId(null);
    setOperator(null);
    setSolved(false);
    setMessage('先选一个数字，再选运算符和另一个数字');
  }, [maxNum, target, cardCount, cardSet]);

  const finishGame = useCallback((correct: number) => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameOver(true);
    const required = level <= 2 ? 1 : level <= 4 ? Math.ceil(questions * 0.6) : questions;
    if (correct >= required) {
      const stars = correct === questions ? 3 : correct >= questions * 0.8 ? 2 : 1;
      onComplete(correct * 200 + (timeLimit > 0 ? timeLeft * 10 : 0), stars);
    } else {
      onFail(`只完成了 ${correct}/${questions} 题`);
    }
  }, [level, onComplete, onFail, questions, timeLeft, timeLimit]);

  finishRef.current = finishGame;

  useEffect(() => {
    correctRef.current = 0;
    gameOverRef.current = false;
    questionIndexRef.current = 0;
    setCurrentQ(0);
    setCorrectCount(0);
    setTimeLeft(timeLimit);
    setGameOver(false);
    createQuestion();
  }, [level, timeLimit, createQuestion]);

  useEffect(() => {
    if (timeLimit <= 0 || gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(previous => {
        if (previous <= 1) {
          clearInterval(timer);
          finishRef.current(correctRef.current);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit, gameOver, setInterval, clearInterval]);

  const pickCard = (id: number) => {
    if (gameOver || solved) return;
    if (firstId === null) {
      setFirstId(id);
      setOperator(null);
      setMessage('现在选一个运算符');
      return;
    }
    if (!operator) {
      setFirstId(id === firstId ? null : id);
      setMessage(id === firstId ? '已取消选择，请先选一个数字' : '现在选一个运算符');
      return;
    }
    if (id === firstId) return;

    const first = cards.find(card => card.id === firstId);
    const second = cards.find(card => card.id === id);
    if (!first || !second) return;
    const value = calculate(first.value, operator, second.value);
    if (value === null || !Number.isFinite(value)) {
      setMessage('不能除以 0，请换个运算');
      setOperator(null);
      return;
    }
    const expression = `(${first.expression} ${operator} ${second.expression})`;
    const merged: Card = { id: nextId.current++, value: Math.abs(value) < 1e-9 ? 0 : value, expression };
    const nextCards = cards.filter(card => card.id !== first.id && card.id !== second.id);
    nextCards.splice(Math.min(cards.findIndex(card => card.id === first.id), cards.findIndex(card => card.id === second.id)), 0, merged);
    setHistory(previous => [...previous, cards]);
    setCards(nextCards);
    setFirstId(null);
    setOperator(null);

    if (nextCards.length === 1) {
      if (Math.abs(nextCards[0].value - target) < 1e-7) {
        const newCorrect = correctRef.current + 1;
        correctRef.current = newCorrect;
        setCorrectCount(newCorrect);
        setSolved(true);
        setMessage(`答对了！你算出了 ${target}`);
        if (currentQ + 1 >= questions) {
          setGameOver(true);
          gameOverRef.current = true;
          const stars = newCorrect === questions ? 3 : newCorrect >= questions * 0.8 ? 2 : 1;
          setTimeout(() => onComplete(newCorrect * 200 + (timeLimit > 0 ? timeLeft * 10 : 0), stars), 700);
        } else {
          questionIndexRef.current = currentQ + 1;
          setCurrentQ(previous => previous + 1);
          setTimeout(() => createQuestion(), 900);
        }
      } else {
        setMessage(`结果是 ${format(nextCards[0].value)}，不是 24。可以撤销上一步再试。`);
      }
    } else {
      setMessage(`${format(value)} 已合并出来，继续组合剩下的数字`);
    }
  };

  const undo = () => {
    if (gameOver || solved || history.length === 0) return;
    setCards(history[history.length - 1]);
    setHistory(previous => previous.slice(0, -1));
    setFirstId(null);
    setOperator(null);
    setMessage('已撤销上一步，继续尝试');
  };

  return (
    <section className="math24-game" aria-label="二十四点">
      <div className="math24-topline">
        <div><span>本轮题目</span><strong>{currentQ + 1}<small> / {questions}</small></strong></div>
        <div><span>已答对</span><strong>{correctCount}</strong></div>
        {timeLimit > 0 && <div className="math24-clock"><span>剩余时间</span><strong>{timeLeft}<small> 秒</small></strong></div>}
      </div>

      <div className="math24-heading"><span className="math24-spark">✳</span><div><h2>合成 {target}</h2><p>每一步都用两个数，算出一个新结果</p></div></div>

      <div className="math24-workbench">
        <div className="math24-step-label"><span>当前数字</span><span>{cards.length} 个待组合</span></div>
        <div className="math24-cards" aria-live="polite">
          {cards.map(card => {
            const selected = firstId === card.id;
            return <button key={card.id} className={`math24-card${selected ? ' selected' : ''}${card.expression.includes('(') ? ' result' : ''}`} onClick={() => pickCard(card.id)} disabled={gameOver || solved} aria-pressed={selected}>
              <strong>{format(card.value)}</strong>
              {card.expression.includes('(') && <small>{card.expression}</small>}
              {selected && <span className="math24-selected-tag">已选</span>}
            </button>;
          })}
          {cards.length === 0 && <span className="math24-empty">准备数字中…</span>}
        </div>

        <div className="math24-operation-row">
          <span>运算符</span>
          <div className="math24-operators">
            {operators.map(op => <button key={op} className={operator === op ? 'active' : ''} onClick={() => { if (firstId !== null && !gameOver && !solved) { setOperator(op); setMessage('再选另一个数字，完成这一步'); } }} disabled={firstId === null || gameOver || solved} aria-pressed={operator === op}>{op}</button>)}
          </div>
        </div>

        <div className={`math24-message${solved ? ' success' : ''}`} role="status">{message}</div>
      <div className="math24-actions"><button className="math24-undo" onClick={undo} disabled={history.length === 0 || gameOver || solved}>↶ <span>撤销一步</span></button><span>目标 <strong>{target}</strong></span></div>
      </div>

      <p className="math24-help">点击数字 → 选择 + − × ÷ → 点击另一个数字，算出 {target}</p>
      {history.length > 0 && <details className="math24-history"><summary>查看计算过程</summary><ol>{history.map((step, index) => <li key={index}>{step.filter(card => card.expression.includes('(')).slice(-1)[0]?.expression ?? '初始数字'}</li>)}</ol></details>}
    </section>
  );
}
