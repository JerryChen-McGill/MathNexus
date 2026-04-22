import { useGameStore } from '@/store/gameStore';
import { games, skillBranches } from '@/data/games';
import { Star, Trophy, Clock, Gamepad2, TrendingUp, Settings, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export default function Profile() {
  const {
    playerName, totalScore, skillPoints, totalSkillPointsEarned,
    gameProgress, stats, settings, updateSettings, resetProgress,
    skillNodes: nodes,
  } = useGameStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const unlockedSkills = nodes.filter(n => n.unlocked).length;
  const totalGames = games.length;
  const completedGames = games.filter(g => g.completedLevels > 0).length;
  const totalStars = games.reduce((sum, g) => sum + g.totalStars, 0);
  const maxStars = totalGames * 30; // 10 levels * 3 stars per game

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="pt-14 min-h-screen">
      {/* Header */}
      <section className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-[1440px] mx-auto">
          <h1 className="font-display text-[clamp(2rem,5vw,3rem)] text-white mb-2">
            我的数学之旅
          </h1>
          <p className="text-[var(--black-6)]">追踪你的数学冒险进度</p>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Player Info */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="liquid-glass rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-2xl font-bold text-white">
                  {playerName[0]}
                </div>
                <div>
                  <h2 className="font-semibold text-white text-lg">{playerName}</h2>
                  <div className="text-xs text-[var(--gold)] flex items-center gap-1">
                    <Trophy size={12} />
                    数学探险家 Lv.{Math.floor(totalSkillPointsEarned / 100) + 1}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] text-center">
                  <div className="font-mono-data text-xl text-[var(--accent)]">{totalScore.toLocaleString()}</div>
                  <div className="text-xs text-[var(--black-6)]">总积分</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] text-center">
                  <div className="font-mono-data text-xl text-[var(--gold)]">{skillPoints}</div>
                  <div className="text-xs text-[var(--black-6)]">技能点</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] text-center">
                  <div className="font-mono-data text-xl text-[var(--success)]">{unlockedSkills}</div>
                  <div className="text-xs text-[var(--black-6)]">已解锁技能</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] text-center">
                  <div className="font-mono-data text-xl text-white">{formatTime(stats.totalTimePlayed)}</div>
                  <div className="text-xs text-[var(--black-6)]">游戏时间</div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="liquid-glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings size={16} className="text-[var(--black-6)]" />
                <h3 className="font-semibold text-white">设置</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--black-5)]">音效</span>
                  <button
                    onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`w-12 h-6 rounded-full transition-all ${settings.soundEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--black-3)]'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--black-5)]">音乐</span>
                  <button
                    onClick={() => updateSettings({ musicEnabled: !settings.musicEnabled })}
                    className={`w-12 h-6 rounded-full transition-all ${settings.musicEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--black-3)]'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.musicEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--black-5)]">难度</span>
                  <div className="flex gap-1">
                    {(['easy', 'normal', 'hard'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => updateSettings({ difficulty: d })}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          settings.difficulty === d
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--black-3)] text-[var(--black-6)] hover:text-white'
                        }`}
                      >
                        {d === 'easy' ? '简单' : d === 'normal' ? '普通' : '困难'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--black-3)]">
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-2 text-sm text-[var(--danger)] hover:text-[var(--danger)]/80 transition-all"
                  >
                    <RotateCcw size={14} />
                    重置所有进度
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--danger)]">确定要重置所有进度吗？此操作不可撤销。</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { resetProgress(); setShowResetConfirm(false); }}
                        className="px-4 py-2 bg-[var(--danger)] rounded-lg text-white text-sm"
                      >
                        确认重置
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-4 py-2 bg-[var(--black-3)] rounded-lg text-[var(--black-6)] text-sm"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle - Game Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Stats */}
            <div className="liquid-glass rounded-2xl p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                    <Gamepad2 size={18} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="font-mono-data text-lg text-white">{completedGames}/{totalGames}</div>
                    <div className="text-xs text-[var(--black-6)]">已玩游戏</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center">
                    <Star size={18} className="text-[var(--gold)]" />
                  </div>
                  <div>
                    <div className="font-mono-data text-lg text-white">{totalStars}/{maxStars}</div>
                    <div className="text-xs text-[var(--black-6)]">获得星数</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--success)]/10 flex items-center justify-center">
                    <TrendingUp size={18} className="text-[var(--success)]" />
                  </div>
                  <div>
                    <div className="font-mono-data text-lg text-white">{stats.totalWins}</div>
                    <div className="text-xs text-[var(--black-6)]">胜利次数</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center">
                    <Clock size={18} className="text-[var(--purple)]" />
                  </div>
                  <div>
                    <div className="font-mono-data text-lg text-white">{stats.totalGamesPlayed}</div>
                    <div className="text-xs text-[var(--black-6)]">总场次</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Branch Progress */}
            <div className="liquid-glass rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">技能分支进度</h3>
              <div className="space-y-3">
                {skillBranches.map(branch => {
                  const branchNodes = nodes.filter(n => n.branch === branch.name);
                  const unlocked = branchNodes.filter(n => n.unlocked).length;
                  const percent = (unlocked / branchNodes.length) * 100;
                  return (
                    <div key={branch.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: branch.color }} />
                          <span className="text-sm text-[var(--black-5)]">{branch.name}</span>
                        </div>
                        <span className="text-xs text-[var(--black-6)]">{unlocked}/{branchNodes.length}</span>
                      </div>
                      <div className="h-2 bg-[var(--black-3)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%`, backgroundColor: branch.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Game Progress List */}
            <div className="liquid-glass rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">游戏进度</h3>
              <div className="space-y-3">
                {games.map(game => {
                  const prog = gameProgress[game.id];
                  const completed = prog ? Object.values(prog.levels).filter(l => l.completed).length : 0;
                  const stars = prog ? Object.values(prog.levels).reduce((sum, l) => sum + l.stars, 0) : 0;
                  return (
                    <div key={game.id} className="flex items-center gap-4 p-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)]">
                      <img src={game.image} alt={game.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{game.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                            backgroundColor: `${game.category === 'number' ? '#3B82F6' : game.category === 'geometry' ? '#10B981' : game.category === 'logic' ? '#8B5CF6' : game.category === 'strategy' ? '#F59E0B' : '#EC4899'}20`,
                            color: game.category === 'number' ? '#3B82F6' : game.category === 'geometry' ? '#10B981' : game.category === 'logic' ? '#8B5CF6' : game.category === 'strategy' ? '#F59E0B' : '#EC4899',
                          }}>
                            {game.categoryLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-[var(--black-3)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent)] rounded-full transition-all" style={{ width: `${(completed / game.levels) * 100}%` }} />
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Star size={10} className="text-[var(--gold)] fill-[var(--gold)]" />
                            <span className="text-[10px] text-[var(--black-6)] font-mono-data">{stars}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-[var(--black-6)] font-mono-data shrink-0">
                        {completed}/{game.levels}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
