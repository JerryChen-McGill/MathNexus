import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

interface Entity {
  id: string;
  name: string;
  emoji: string;
  eats?: string[];
}

export default function RiverCrossingGame({ level, config, onComplete, onFail }: Props) {
  const { timeLimit = 0 } = config.params;
  const [leftBank, setLeftBank] = useState<Entity[]>([]);
  const [rightBank, setRightBank] = useState<Entity[]>([]);
  const [boatSide, setBoatSide] = useState<'left' | 'right'>('left');
  const [boat, setBoat] = useState<Entity[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [message, setMessage] = useState('');

  const entities: Entity[] = [
    { id: 'farmer', name: '农夫', emoji: '👨‍🌾' },
    { id: 'wolf', name: '狼', emoji: '🐺', eats: ['sheep'] },
    { id: 'sheep', name: '羊', emoji: '🐑', eats: ['cabbage'] },
    { id: 'cabbage', name: '菜', emoji: '🥬' },
  ];

  useEffect(() => {
    setLeftBank([...entities]);
    setRightBank([]);
    setBoatSide('left');
    setBoat([]);
    setMoves(0);
    setTimeLeft(timeLimit);
    setMessage('农夫必须每次带一样东西过河');
  }, [level, timeLimit]);

  useEffect(() => {
    if (timeLimit <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); onFail('时间耗尽'); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit, onFail]);

  const checkConflict = (bank: Entity[]): boolean => {
    const farmerPresent = bank.some(e => e.id === 'farmer');
    if (farmerPresent) return false;
    for (const e of bank) {
      if (e.eats) {
        for (const target of e.eats) {
          if (bank.some(b => b.id === target)) return true;
        }
      }
    }
    return false;
  };

  const handleEntityClick = (entity: Entity, location: 'left' | 'right' | 'boat') => {
    if (message.includes('冲突')) setMessage('');

    if (location === 'left' && boatSide === 'left') {
      if (boat.length >= 2 && entity.id !== 'farmer') return;
      if (entity.id !== 'farmer' && !boat.some(b => b.id === 'farmer')) return;
      setLeftBank(prev => prev.filter(e => e.id !== entity.id));
      setBoat(prev => [...prev, entity]);
    } else if (location === 'right' && boatSide === 'right') {
      if (boat.length >= 2 && entity.id !== 'farmer') return;
      if (entity.id !== 'farmer' && !boat.some(b => b.id === 'farmer')) return;
      setRightBank(prev => prev.filter(e => e.id !== entity.id));
      setBoat(prev => [...prev, entity]);
    } else if (location === 'boat') {
      if (boatSide === 'left') {
        setBoat(prev => prev.filter(e => e.id !== entity.id));
        setLeftBank(prev => [...prev, entity]);
      } else {
        setBoat(prev => prev.filter(e => e.id !== entity.id));
        setRightBank(prev => [...prev, entity]);
      }
    }
  };

  const handleCross = () => {
    if (!boat.some(b => b.id === 'farmer')) {
      setMessage('农夫必须在船上');
      return;
    }

    const newMoves = moves + 1;
    setMoves(newMoves);
    const newSide = boatSide === 'left' ? 'right' : 'left';
    setBoatSide(newSide);

    // Unload boat
    if (newSide === 'right') {
      setRightBank(prev => [...prev, ...boat]);
    } else {
      setLeftBank(prev => [...prev, ...boat]);
    }
    setBoat([]);

    // Check conflicts after crossing
    setTimeout(() => {
      const currentBank = newSide === 'right' ? rightBank : leftBank;
      if (checkConflict(currentBank)) {
        setMessage('冲突!有些东西被吃了!');
        setTimeout(() => onFail('发生吃食冲突'), 500);
        return;
      }

      // Check win
      if (newSide === 'right' && rightBank.length + boat.length >= 4) {
        const score = 500 + Math.max(0, (15 - newMoves) * 20);
        const stars = newMoves <= 7 ? 3 : newMoves <= 10 ? 2 : 1;
        onComplete(score, stars);
      }
    }, 100);
  };

  const renderEntity = (entity: Entity, location: 'left' | 'right' | 'boat') => (
    <button
      key={entity.id}
      onClick={() => handleEntityClick(entity, location)}
      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] hover:border-[var(--accent)] transition-all"
    >
      <span className="text-2xl">{entity.emoji}</span>
      <span className="text-[10px] text-[var(--black-6)]">{entity.name}</span>
    </button>
  );

  return (
    <div className="flex flex-col items-center h-full max-w-lg mx-auto">
      {timeLimit > 0 && <div className="text-sm text-[var(--black-6)] mb-2">剩余: <span className="font-mono-data text-[var(--accent)]">{timeLeft}s</span></div>}
      <div className="text-sm text-[var(--black-5)] mb-4">步数: {moves} | {message}</div>

      {/* Left Bank */}
      <div className="w-full p-4 rounded-xl bg-green-900/20 border border-green-800/30 mb-4">
        <div className="text-xs text-green-400 mb-2">左岸</div>
        <div className="flex flex-wrap gap-2">
          {leftBank.map(e => renderEntity(e, 'left'))}
        </div>
      </div>

      {/* River */}
      <div className="w-full flex items-center justify-center gap-4 py-4">
        {/* Boat */}
        <div className={`p-3 rounded-xl border-2 ${boatSide === 'left' ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--black-4)] bg-[var(--black-2)]'} min-w-[100px]`}>
          <div className="text-[10px] text-[var(--black-6)] mb-1">船 ({boatSide === 'left' ? '左岸' : '右岸'})</div>
          <div className="flex gap-1">
            {boat.map(e => renderEntity(e, 'boat'))}
          </div>
        </div>

        <button
          onClick={handleCross}
          disabled={!boat.some(b => b.id === 'farmer')}
          className="px-4 py-2 bg-[var(--accent)] rounded-lg text-white text-sm hover:bg-[var(--accent-dark)] disabled:opacity-30 transition-all"
        >
          过河 →
        </button>
      </div>

      {/* Right Bank */}
      <div className="w-full p-4 rounded-xl bg-blue-900/20 border border-blue-800/30">
        <div className="text-xs text-blue-400 mb-2">右岸</div>
        <div className="flex flex-wrap gap-2">
          {rightBank.map(e => renderEntity(e, 'right'))}
        </div>
      </div>
    </div>
  );
}
