import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { categoryColors } from '@/data/games';
import type { GameCategory } from '@/data/games';
import { useGameStore } from '@/store/gameStore';
import { Star, ChevronRight } from 'lucide-react';
import gsap from 'gsap';

const categories: Array<{ id: GameCategory | 'all'; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'number', label: '数字运算' },
  { id: 'geometry', label: '几何拼图' },
  { id: 'logic', label: '逻辑推理' },
  { id: 'strategy', label: '博弈策略' },
  { id: 'classic', label: '古老经典' },
];

export default function GameHub() {
  const [activeCategory, setActiveCategory] = useState<GameCategory | 'all'>('all');
  const games = useGameStore(state => state.games);
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredGames = activeCategory === 'all'
    ? games
    : games.filter(g => g.category === activeCategory);

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('.hub-card');

    gsap.fromTo(
      cards,
      { y: 60, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: 0.06,
        ease: 'power3.out',
      }
    );
  }, [activeCategory]);

  return (
    <div className="pt-14 min-h-screen">
      {/* Header */}
      <section className="pt-12 sm:pt-16 pb-8 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-[1440px] mx-auto">
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-white mb-3">
            游戏大厅
          </h1>
          <p className="text-[var(--black-6)] text-lg">
            选择你的挑战，开启数学之旅
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="pb-8 px-4 sm:px-6 lg:px-8 xl:px-12 sticky top-14 z-40 bg-[var(--black-1)]/95 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 border ${
                  activeCategory === cat.id
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                    : 'border-[var(--black-3)] text-[var(--black-6)] hover:text-white hover:border-[var(--black-4)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Game Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filteredGames.map((game) => (
              <Link
                key={game.id}
                to={`/game/${game.id}`}
                className="hub-card group relative rounded-xl overflow-hidden bg-[var(--black-2)] border border-[var(--black-3)] hover:border-[var(--accent)]/30 transition-all duration-300"
                style={{ opacity: 0 }}
              >
                {/* Image */}
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--black-2)] via-transparent to-transparent" />

                  {/* Difficulty Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className="liquid-glass px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{
                        color: game.difficulty === 'easy' ? '#10B981' : game.difficulty === 'normal' ? '#F59E0B' : '#EF4444',
                      }}
                    >
                      {game.difficulty === 'easy' ? '简单' : game.difficulty === 'normal' ? '中等' : '困难'}
                    </span>
                  </div>

                  {/* Level Progress */}
                  <div className="absolute top-3 right-3">
                    <span className="liquid-glass px-2.5 py-1 rounded-md text-xs font-mono-data text-white">
                      {game.completedLevels}/{game.levels} 关
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: categoryColors[game.category] }}
                    />
                    <span className="text-xs text-[var(--black-6)]">{game.categoryLabel}</span>
                  </div>

                  <h3 className="font-semibold text-white mb-1.5 group-hover:text-[var(--accent)] transition-colors flex items-center gap-2">
                    {game.name}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>

                  <p className="text-sm text-[var(--black-6)] line-clamp-2 mb-3">
                    {game.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[var(--black-3)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(game.completedLevels / game.levels) * 100}%`,
                          backgroundColor: categoryColors[game.category],
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star size={12} className="text-[var(--gold)] fill-[var(--gold)]" />
                      <span className="text-xs text-[var(--black-6)] font-mono-data">{game.totalStars}</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {game.skills.slice(0, 2).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded text-[10px] bg-[var(--black-3)] text-[var(--black-5)]"
                      >
                        {skill.split('-').slice(0, -1).join('-')}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
