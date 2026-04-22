import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

interface Disk {
  id: number;
  size: number;
}

export default function HanoiGame({ level, config, onComplete, onFail }: Props) {
  const { disks = 4, timeLimit = 0 } = config.params;
  const d = Number(disks) || 4;
  const optimalMoves = Math.pow(2, d) - 1;

  const [towers, setTowers] = useState<Disk[][]>([[], [], []]);
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const initial: Disk[] = Array.from({ length: d }, (_, i) => ({ id: i, size: d - i }));
    setTowers([initial, [], []]);
    setSelectedTower(null);
    setMoves(0);
    setTimeLeft(timeLimit);
    setGameOver(false);
  }, [level, d, timeLimit]);

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

  // Check win
  useEffect(() => {
    if (towers[2].length === d && d > 0 && moves > 0 && !gameOver) {
      setGameOver(true);
      const baseScore = d * 200;
      const moveBonus = Math.max(0, optimalMoves * 2 - moves) * 5;
      const timeBonus = timeLimit > 0 ? timeLeft * 5 : 0;
      const totalScore = baseScore + moveBonus + timeBonus;
      const stars = moves <= optimalMoves ? 3 : moves <= optimalMoves * 1.5 ? 2 : 1;
      setTimeout(() => onComplete(totalScore, stars), 300);
    }
  }, [towers, d, moves, gameOver, optimalMoves, timeLimit, timeLeft, onComplete]);

  const handleTowerClick = (towerIdx: number) => {
    if (gameOver) return;

    if (selectedTower === null) {
      if (towers[towerIdx].length > 0) {
        setSelectedTower(towerIdx);
      }
    } else if (selectedTower === towerIdx) {
      setSelectedTower(null);
    } else {
      const fromTower = towers[selectedTower];
      const toTower = towers[towerIdx];
      const disk = fromTower[fromTower.length - 1];

      if (toTower.length === 0 || disk.size < toTower[toTower.length - 1].size) {
        const newTowers = towers.map(t => [...t]);
        newTowers[selectedTower].pop();
        newTowers[towerIdx].push(disk);
        setTowers(newTowers);
        setMoves(prev => prev + 1);
      }
      setSelectedTower(null);
    }
  };

  const diskColors = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="flex flex-col items-center h-full">
      <div className="flex items-center gap-6 mb-6">
        <div className="text-sm text-[var(--black-6)]">步数: <span className="font-mono-data text-white">{moves}</span></div>
        <div className="text-sm text-[var(--black-6)]">最优: <span className="font-mono-data text-[var(--success)]">{optimalMoves}</span></div>
        {timeLimit > 0 && <div className="text-sm text-[var(--black-6)]">剩余: <span className="font-mono-data text-[var(--accent)]">{timeLeft}s</span></div>}
      </div>

      <div className="flex gap-8 sm:gap-16">
        {towers.map((tower, ti) => (
          <button
            key={ti}
            onClick={() => handleTowerClick(ti)}
            className={`relative flex flex-col items-center justify-end w-24 sm:w-32 h-64 sm:h-80 pb-2 ${
              selectedTower === ti ? 'bg-[var(--accent)]/5 rounded-xl' : ''
            }`}
          >
            {/* Pole */}
            <div className="absolute bottom-0 w-1 h-full bg-[var(--black-4)] rounded-full" />

            {/* Disks */}
            <div className="relative z-10 flex flex-col-reverse items-center gap-0.5 w-full">
              {tower.map((disk, di) => (
                <div
                  key={`${disk.id}-${di}`}
                  className="h-6 sm:h-7 rounded-md transition-all duration-300"
                  style={{
                    width: `${40 + disk.size * (80 / d)}%`,
                    backgroundColor: diskColors[disk.size % diskColors.length],
                    boxShadow: di === tower.length - 1 && selectedTower === ti ? `0 0 10px ${diskColors[disk.size % diskColors.length]}` : 'none',
                    transform: di === tower.length - 1 && selectedTower === ti ? 'translateY(-10px)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Base */}
            <div className="absolute -bottom-1 w-full h-2 bg-[var(--black-4)] rounded-full" />

            {/* Label */}
            <div className="absolute -bottom-8 text-xs text-[var(--black-6)]">
              {['A', 'B', 'C'][ti]}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-12 text-sm text-[var(--black-6)]">
        {selectedTower === null ? '点击选择柱子' : '点击目标柱子移动'}
      </div>
    </div>
  );
}
