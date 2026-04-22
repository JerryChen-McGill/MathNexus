import { Link } from 'react-router-dom';
import { Calculator, Shapes, Brain, Swords, Scroll, ChevronDown, Star, Gamepad2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { games, skillNodes } from '@/data/games';
import { useGameStore } from '@/store/gameStore';

const mathTerms = [
  'SUDOKU', 'PRIME', 'LOGIC', 'GRAPH', 'ALGEBRA',
  'TOPOLOGY', 'FIBONACCI', 'GEOMETRY', 'NIM', 'COMBINATORICS',
  'PROBABILITY', 'ALGORITHM', 'SET', 'GROUP', 'MATRIX',
  'EQUATION', 'PROOF', 'NUMBER', 'SPACE', 'GAME',
  'THEORY', 'EUCLID', 'PASCAL', 'GAUSS', 'EULER',
  'KONIGSBERG', 'TANGRAM', 'MAGIC', 'SQUARE', 'PENTOMINO',
];

const features = [
  { icon: Calculator, title: '数字运算', desc: '数独、24点、幻方等，训练你的数感与运算能力', color: '#3B82F6' },
  { icon: Shapes, title: '几何拼图', desc: '七巧板、河内塔等，培养空间想象力', color: '#10B981' },
  { icon: Brain, title: '逻辑推理', desc: '扫雷、爱因斯坦谜题等，锻炼逻辑思维', color: '#8B5CF6' },
  { icon: Swords, title: '博弈策略', desc: '井字棋、五子棋、Nim等，学习博弈论', color: '#F59E0B' },
  { icon: Scroll, title: '古老经典', desc: '百鸡问题、孙子算经等，探索数学历史', color: '#EC4899' },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { skillPoints, totalScore } = useGameStore();
  const unlockedSkills = skillNodes.filter(s => s.unlocked).length;

  useEffect(() => {
    // Hero entrance animations
    const tl = gsap.timeline({ delay: 0.3 });

    if (titleRef.current) {
      tl.from(titleRef.current, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
      });
    }

    if (subtitleRef.current) {
      tl.from(subtitleRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      }, '-=0.6');
    }

    if (ctaRef.current) {
      tl.from(ctaRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      }, '-=0.4');
    }

    if (orbRef.current) {
      tl.from(orbRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 1.5,
        ease: 'power2.out',
      }, '-=1');
    }

    // 3D orb rotation
    if (orbRef.current) {
      gsap.to(orbRef.current, {
        rotationY: 360,
        duration: 60,
        repeat: -1,
        ease: 'none',
      });
    }

    return () => {
      tl.kill();
    };
  }, []);

  // Feature cards scroll animation
  useEffect(() => {
    if (!featuresRef.current) return;
    const cards = featuresRef.current.querySelectorAll('.feature-card');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              cards,
              { y: 60, opacity: 0, scale: 0.95 },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out',
              }
            );
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  // Hot games scroll animation
  useEffect(() => {
    if (!cardsRef.current) return;
    const cards = cardsRef.current.querySelectorAll('.game-card');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              cards,
              { y: 40, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power3.out',
              }
            );
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(cardsRef.current);
    return () => observer.disconnect();
  }, []);

  const hotGames = games.slice(0, 6);

  return (
    <div className="pt-14">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden"
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
          }}
        />

        {/* 3D Cylinder Orb */}
        <div
          ref={orbRef}
          className="absolute w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px]"
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1200px',
          }}
        >
          {mathTerms.map((term, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 text-[10px] sm:text-xs font-mono-data tracking-widest"
              style={{
                color: 'var(--black-5)',
                opacity: 0.6,
                transform: `translate(-50%, -50%) rotateY(${i * 12}deg) translateZ(200px)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {term}
            </span>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1
            ref={titleRef}
            className="font-display text-[clamp(2.5rem,8vw,5rem)] text-white mb-6"
          >
            探索数学的
            <br />
            <span className="text-[var(--accent)]">无限宇宙</span>
          </h1>

          <p
            ref={subtitleRef}
            className="text-[var(--black-6)] text-lg sm:text-xl mb-10 max-w-2xl mx-auto"
          >
            30+ 经典数学游戏 | 8大技能分支 | 从入门到大师
          </p>

          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/games"
              className="group relative px-10 py-4 bg-[var(--accent)] rounded-lg font-semibold text-white overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Gamepad2 size={20} />
                开始游戏
              </span>
            </Link>
            <Link
              to="/skilltree"
              className="px-10 py-4 border border-[var(--black-4)] rounded-lg font-medium text-[var(--black-6)] hover:text-white hover:border-[var(--accent)]/50 transition-all duration-300"
            >
              查看技能树
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 flex items-center justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <div className="font-mono-data text-2xl sm:text-3xl text-[var(--accent)]">{games.length}</div>
              <div className="text-xs text-[var(--black-6)] mt-1">经典游戏</div>
            </div>
            <div className="w-px h-10 bg-[var(--black-3)]" />
            <div className="text-center">
              <div className="font-mono-data text-2xl sm:text-3xl text-[var(--accent)]">8</div>
              <div className="text-xs text-[var(--black-6)] mt-1">技能分支</div>
            </div>
            <div className="w-px h-10 bg-[var(--black-3)]" />
            <div className="text-center">
              <div className="font-mono-data text-2xl sm:text-3xl text-[var(--accent)]">40+</div>
              <div className="text-xs text-[var(--black-6)] mt-1">技能节点</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs text-[var(--black-6)]">向下滚动</span>
          <ChevronDown size={20} className="text-[var(--black-6)] animation-float" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-[clamp(1.5rem,4vw,2.5rem)] text-white mb-4">
              五大类别，一座数学乐园
            </h2>
            <p className="text-[var(--black-6)] max-w-xl mx-auto">
              从基础运算到高级博弈论，覆盖数学的各个分支领域
            </p>
          </div>

          <div
            ref={featuresRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {features.map((feat, i) => (
              <div
                key={i}
                className="feature-card p-6 rounded-xl bg-[var(--black-2)] border border-[var(--black-3)] hover:border-[var(--accent)]/30 transition-all duration-300 group"
                style={{ opacity: 0 }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${feat.color}15` }}
                >
                  <feat.icon size={24} style={{ color: feat.color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-[var(--black-6)] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Games Section */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 xl:px-12 bg-[var(--black-0)]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-display text-[clamp(1.5rem,4vw,2.5rem)] text-white mb-2">
                热门挑战
              </h2>
              <p className="text-[var(--black-6)]">精选最受欢迎的游戏</p>
            </div>
            <Link
              to="/games"
              className="hidden sm:flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-glow)] transition-colors"
            >
              查看全部
              <ChevronDown size={16} className="-rotate-90" />
            </Link>
          </div>

          <div
            ref={cardsRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {hotGames.map((game) => (
              <Link
                key={game.id}
                to={`/game/${game.id}`}
                className="game-card group relative rounded-xl overflow-hidden bg-[var(--black-2)] border border-[var(--black-3)] hover:border-[var(--accent)]/30 transition-all duration-300 hover:glow-blue"
                style={{ opacity: 0 }}
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--black-2)] via-transparent to-transparent" />
                </div>

                <div className="absolute top-3 right-3">
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: `${game.difficulty === 'easy' ? '#10B981' : game.difficulty === 'normal' ? '#F59E0B' : '#EF4444'}20`,
                      color: game.difficulty === 'easy' ? '#10B981' : game.difficulty === 'normal' ? '#F59E0B' : '#EF4444',
                    }}
                  >
                    {game.difficulty === 'easy' ? '简单' : game.difficulty === 'normal' ? '中等' : '困难'}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: game.category === 'number' ? '#3B82F6' : game.category === 'geometry' ? '#10B981' : game.category === 'logic' ? '#8B5CF6' : game.category === 'strategy' ? '#F59E0B' : '#EC4899' }}
                    />
                    <span className="text-xs text-[var(--black-6)]">{game.categoryLabel}</span>
                  </div>
                  <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-[var(--accent)] transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-sm text-[var(--black-6)] line-clamp-2">{game.description}</p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[var(--black-3)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                        style={{ width: `${(game.completedLevels / game.levels) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-[var(--gold)] fill-[var(--gold)]" />
                      <span className="text-xs text-[var(--black-6)] font-mono-data">{game.totalStars}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Tree Overview */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-[clamp(1.5rem,4vw,2.5rem)] text-white mb-4">
                点亮你的数学技能
              </h2>
              <p className="text-[var(--black-6)] mb-8 leading-relaxed">
                完成游戏关卡，解锁40+数学技能节点。从基础运算到博弈论，构建属于你的数学能力图谱。
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)]">
                  <span className="text-sm text-[var(--black-6)]">已解锁技能</span>
                  <span className="font-mono-data text-[var(--accent)]">{unlockedSkills} / {skillNodes.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)]">
                  <span className="text-sm text-[var(--black-6)]">可用技能点</span>
                  <span className="font-mono-data text-[var(--gold)]">{skillPoints}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)]">
                  <span className="text-sm text-[var(--black-6)]">总积分</span>
                  <span className="font-mono-data text-white">{totalScore.toLocaleString()}</span>
                </div>
              </div>

              <Link
                to="/skilltree"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--accent)] rounded-lg font-medium text-white hover:bg-[var(--accent-dark)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                <Star size={18} />
                探索技能树
              </Link>
            </div>

            <div className="flex justify-center">
              <img
                src="images/skilltree.jpg"
                alt="Skill Tree"
                className="w-full max-w-md rounded-2xl border border-[var(--black-3)] opacity-80 hover:opacity-100 transition-opacity duration-500"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
