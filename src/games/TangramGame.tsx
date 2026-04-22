import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

const shapes = [
  { id: 0, name: '大三角1', points: [[0,0],[100,0],[50,50]] },
  { id: 1, name: '大三角2', points: [[0,0],[100,0],[50,50]] },
  { id: 2, name: '中三角', points: [[0,0],[70,0],[35,35]] },
  { id: 3, name: '小三角1', points: [[0,0],[50,0],[25,25]] },
  { id: 4, name: '小三角2', points: [[0,0],[50,0],[25,25]] },
  { id: 5, name: '正方形', points: [[0,0],[35,0],[35,35],[0,35]] },
  { id: 6, name: '平行四边形', points: [[0,0],[50,0],[65,25],[15,25]] },
];

const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#F97316'];

export default function TangramGame({ level, config, onComplete }: Props) {
  const { timeLimit = 0 } = config.params;
  const [placed, setPlaced] = useState<Set<number>>(new Set());
  const [selectedShape, setSelectedShape] = useState<number | null>(null);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    setPlaced(new Set());
    setSelectedShape(null);
    setRotations({});
    setTimeLeft(timeLimit);
  }, [level, timeLimit]);

  useEffect(() => {
    if (timeLimit <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit]);

  const handlePlaceShape = (shapeId: number) => {
    if (placed.has(shapeId)) return;
    const newPlaced = new Set(placed);
    newPlaced.add(shapeId);
    setPlaced(newPlaced);
    setSelectedShape(null);

    if (newPlaced.size === 7) {
      const score = 500 + (timeLimit > 0 ? timeLeft * 5 : 0);
      setTimeout(() => onComplete(score, 3), 300);
    }
  };

  const handleRotate = (shapeId: number) => {
    setRotations(prev => ({ ...prev, [shapeId]: ((prev[shapeId] || 0) + 45) % 360 }));
  };

  const toSvgPoints = (pts: number[][]) => pts.map(p => p.join(',')).join(' ');

  return (
    <div className="flex flex-col items-center h-full">
      {timeLimit > 0 && (
        <div className="text-sm text-[var(--black-6)] mb-2">剩余: <span className="font-mono-data text-[var(--accent)]">{timeLeft}s</span></div>
      )}

      {/* Target area */}
      <div className="mb-4 text-sm text-[var(--black-6)]">将7块拼图放入目标区域</div>

      <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-xl border-2 border-dashed border-[var(--black-4)] bg-[var(--black-2)]/50 flex items-center justify-center mb-6 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
          <polygon points="0,0 100,0 50,50" fill="none" stroke="white" strokeWidth="0.5" />
          <polygon points="50,0 100,0 100,50 50,50" fill="none" stroke="white" strokeWidth="0.5" />
          <polygon points="0,50 50,50 25,75" fill="none" stroke="white" strokeWidth="0.5" />
          <polygon points="25,75 75,75 50,100 0,100" fill="none" stroke="white" strokeWidth="0.5" />
          <polygon points="50,50 100,50 75,75" fill="none" stroke="white" strokeWidth="0.5" />
          <polygon points="75,25 100,0 100,50 75,75" fill="none" stroke="white" strokeWidth="0.5" />
          <polygon points="0,0 50,0 25,25" fill="none" stroke="white" strokeWidth="0.5" />
        </svg>

        {/* Placed shapes */}
        {Array.from(placed).map(id => (
          <div key={id} className="absolute" style={{ left: `${10 + id * 10}%`, top: `${10 + (id % 3) * 25}%` }}>
            <svg viewBox="0 0 100 100" width="60" height="60" style={{ transform: `rotate(${rotations[id] || 0}deg)` }}>
              <polygon points={toSvgPoints(shapes[id].points)} fill={colors[id]} fillOpacity="0.7" stroke="white" strokeWidth="1" />
            </svg>
          </div>
        ))}

        {placed.size === 0 && <span className="absolute text-[var(--black-5)] text-sm">点击拼图放置</span>}
      </div>

      {/* Shape palette */}
      <div className="flex flex-wrap justify-center gap-3">
        {shapes.map(shape => (
          <button
            key={shape.id}
            onClick={() => !placed.has(shape.id) && handlePlaceShape(shape.id)}
            disabled={placed.has(shape.id)}
            className={`relative p-2 rounded-lg border transition-all ${
              placed.has(shape.id)
                ? 'border-[var(--success)]/30 bg-[var(--success)]/5 opacity-50'
                : selectedShape === shape.id
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--black-3)] bg-[var(--black-2)] hover:border-[var(--accent)]/30'
            }`}
          >
            <svg viewBox="0 0 100 100" width="50" height="50" style={{ transform: `rotate(${rotations[shape.id] || 0}deg)` }}>
              <polygon points={toSvgPoints(shape.points)} fill={colors[shape.id]} fillOpacity="0.6" stroke="white" strokeWidth="1" />
            </svg>
            {!placed.has(shape.id) && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRotate(shape.id); }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--black-3)] text-[10px] text-white hover:bg-[var(--accent)]"
              >
                ↻
              </button>
            )}
            {placed.has(shape.id) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[var(--success)] text-lg">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 text-sm text-[var(--black-6)]">
        进度: {placed.size} / 7
      </div>
    </div>
  );
}
