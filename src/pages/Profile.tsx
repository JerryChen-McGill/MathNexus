import { Link } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { skillBranches } from '@/data/games';
import type { SkillNode } from '@/data/games';
import {
  Star,
  Trophy,
  Clock,
  Gamepad2,
  TrendingUp,
  Settings,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Lock,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

const SKILL_LEVEL_GAME_REQUIREMENTS = [1, 3, 5, 7, 10] as const;
const SKILL_LEVEL_POINT_FACTORS = [1, 3, 6, 10, 15] as const;
const SKILL_POINT_REQUIREMENT_BASE = 20;

type ProgressLookup = Record<string, { highestLevel: number }>;
type SkillPanelView = 'list' | 'radar';
type BranchProgress = {
  branchNodes: SkillNode[];
  totalCells: number;
  earnedCells: number;
  percent: number;
};

const getRequiredGameLevel = (skillLevel: number): number => (
  SKILL_LEVEL_GAME_REQUIREMENTS[
    Math.min(skillLevel - 1, SKILL_LEVEL_GAME_REQUIREMENTS.length - 1)
  ]
);

const getRequiredSkillPoints = (node: SkillNode, skillLevel: number): number => (
  node.cost
  * SKILL_POINT_REQUIREMENT_BASE
  * SKILL_LEVEL_POINT_FACTORS[
    Math.min(skillLevel - 1, SKILL_LEVEL_POINT_FACTORS.length - 1)
  ]
);

const getHighestCompletedLevel = (node: SkillNode, gameProgress: ProgressLookup): number => {
  if (node.gameIds.length === 0) return 0;

  return node.gameIds.reduce((highest, gameId) => {
    const unlockedLevel = gameProgress[gameId]?.highestLevel ?? 1;
    return Math.max(highest, Math.max(0, unlockedLevel - 1));
  }, 0);
};

const getNextRequirement = (node: SkillNode, gameProgress: ProgressLookup) => {
  if (node.level >= node.maxLevel) return null;

  const nextLevel = node.level + 1;
  const requiredGameLevel = getRequiredGameLevel(nextLevel);
  const requiredSkillPoints = getRequiredSkillPoints(node, nextLevel);
  const highestCompletedLevel = getHighestCompletedLevel(node, gameProgress);

  return {
    nextLevel,
    requiredGameLevel,
    requiredSkillPoints,
    highestCompletedLevel,
  };
};

const renderLevelCells = (level: number, maxLevel: number) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: maxLevel }, (_, index) => {
      const active = index < level;
      return (
        <span
          key={index}
          className={`w-2.5 h-2.5 rounded-[3px] border ${
            active
              ? 'bg-[#FFD60A] border-[#FFD60A] shadow-[0_0_6px_rgba(255,214,10,0.8)]'
              : 'bg-transparent border-[var(--black-4)]'
          }`}
        />
      );
    })}
  </div>
);

export default function Profile() {
  const {
    playerName,
    totalScore,
    skillPoints,
    totalSkillPointsEarned,
    gameProgress,
    stats,
    settings,
    updateSettings,
    resetProgress,
    skillNodes: nodes,
    games,
  } = useGameStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [skillPanelView, setSkillPanelView] = useState<SkillPanelView>('list');

  const activeSkill = nodes.find(node => node.id === activeSkillId);
  const gameNameMap = useMemo(() => new Map(games.map(game => [game.id, game.name])), [games]);

  const unlockedSkills = nodes.filter(n => n.unlocked).length;
  const totalGames = games.length;
  const completedGames = games.filter(g => g.completedLevels > 0).length;
  const totalStars = games.reduce((sum, g) => sum + g.totalStars, 0);
  const maxStars = totalGames * 30;

  const branchProgressById = useMemo<Record<string, BranchProgress>>(() => {
    return skillBranches.reduce<Record<string, BranchProgress>>((acc, branch) => {
      const branchNodes = nodes.filter(node => node.branch === branch.name);
      const totalCells = branchNodes.reduce((sum, node) => sum + node.maxLevel, 0);
      const earnedCells = branchNodes.reduce((sum, node) => sum + Math.min(node.level, node.maxLevel), 0);
      const percent = totalCells > 0 ? (earnedCells / totalCells) * 100 : 0;

      acc[branch.id] = {
        branchNodes,
        totalCells,
        earnedCells,
        percent,
      };

      return acc;
    }, {});
  }, [nodes]);

  const visibleBranches = branchFilter === 'all'
    ? skillBranches
    : skillBranches.filter(branch => branch.id === branchFilter);

  const radarData = useMemo(
    () => skillBranches.map(branch => {
      const progress = branchProgressById[branch.id];
      return {
        name: branch.name,
        current: progress?.earnedCells ?? 0,
        total: progress?.totalCells ?? 0,
        color: branch.color,
      };
    }),
    [branchProgressById]
  );

  const radarMax = useMemo(
    () => Math.max(5, ...radarData.map(item => item.total)),
    [radarData]
  );

  const closeSettingsModal = () => {
    setShowSettingsModal(false);
    setShowResetConfirm(false);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const toggleBranch = (branchId: string) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branchId]: !prev[branchId],
    }));
  };

  useEffect(() => {
    if (!activeSkillId && !showSettingsModal) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (activeSkillId) {
        setActiveSkillId(null);
        return;
      }

      closeSettingsModal();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSkillId, showSettingsModal]);

  useEffect(() => {
    if (!activeSkillId && !showSettingsModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [activeSkillId, showSettingsModal]);

  return (
    <div className="pt-14 min-h-screen">
      {/* Header */}
      <section className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-[1440px] mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(2rem,5vw,3rem)] text-white mb-2">
              我的数学之旅
            </h1>
            <p className="text-[var(--black-6)]">追踪你的数学冒险进度</p>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="liquid-glass h-11 w-11 rounded-xl flex items-center justify-center text-[var(--black-6)] hover:text-white transition-all"
            aria-label="打开设置"
            title="设置"
          >
            <Settings size={18} />
          </button>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Profile + Overall Stats */}
          <div className="space-y-6">
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

            <div className="liquid-glass rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">总体战绩</h3>
              <div className="grid grid-cols-2 gap-4">
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
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                    <Clock size={18} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="font-mono-data text-lg text-white">{stats.totalGamesPlayed}</div>
                    <div className="text-xs text-[var(--black-6)]">总场次</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Skill Tree */}
          <div className="lg:col-span-2">
            <section className="liquid-glass rounded-2xl p-6" id="skills">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h3 className="font-semibold text-white">技能分支与技能树</h3>
                <div className="flex items-center rounded-lg p-1 bg-[var(--black-2)] border border-[var(--black-3)]">
                  <button
                    onClick={() => setSkillPanelView('list')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                      skillPanelView === 'list'
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--black-6)] hover:text-white'
                    }`}
                  >
                    技能树
                  </button>
                  <button
                    onClick={() => setSkillPanelView('radar')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                      skillPanelView === 'radar'
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--black-6)] hover:text-white'
                    }`}
                  >
                    雷达图
                  </button>
                </div>
              </div>

              {skillPanelView === 'list' ? (
                <>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
                    <button
                      onClick={() => setBranchFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                        branchFilter === 'all'
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                          : 'border-[var(--black-3)] text-[var(--black-6)] hover:text-white'
                      }`}
                    >
                      全部
                    </button>
                    {skillBranches.map(branch => (
                      <button
                        key={branch.id}
                        onClick={() => setBranchFilter(branch.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-2 ${
                          branchFilter === branch.id
                            ? 'text-white'
                            : 'border-[var(--black-3)] text-[var(--black-6)] hover:text-white'
                        }`}
                        style={branchFilter === branch.id ? { backgroundColor: `${branch.color}20`, borderColor: branch.color } : {}}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: branch.color }} />
                        {branch.name}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {visibleBranches.map(branch => {
                      const branchProgress = branchProgressById[branch.id];
                      if (!branchProgress) return null;

                      const { branchNodes, earnedCells, totalCells, percent } = branchProgress;
                      const expanded = !!expandedBranches[branch.id];

                      return (
                        <div key={branch.id} className="rounded-xl border border-[var(--black-3)] bg-[var(--black-2)] overflow-hidden">
                          <button
                            onClick={() => toggleBranch(branch.id)}
                            className="w-full p-4 text-left hover:bg-white/5 transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: branch.color }} />
                                <span className="text-sm font-medium text-white">{branch.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-[var(--black-6)]">{earnedCells}/{totalCells} 格</span>
                                {expanded ? (
                                  <ChevronUp size={14} className="text-[var(--black-6)]" />
                                ) : (
                                  <ChevronDown size={14} className="text-[var(--black-6)]" />
                                )}
                              </div>
                            </div>
                            <div className="h-2 bg-[var(--black-3)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${percent}%`, backgroundColor: branch.color }}
                              />
                            </div>
                          </button>

                          {expanded && (
                            <div className="px-4 pb-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {branchNodes.map(node => {
                                  const nextRequirement = getNextRequirement(node, gameProgress as ProgressLookup);
                                  const hasAnyLevel = node.level > 0;

                                  return (
                                    <button
                                      key={node.id}
                                      onClick={() => setActiveSkillId(node.id)}
                                      className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.01] ${
                                        hasAnyLevel
                                          ? 'border-[var(--success)]/40 bg-[var(--success)]/8'
                                          : 'border-[var(--black-3)] bg-[var(--black-1)]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        {hasAnyLevel ? (
                                          <Star size={14} className="text-[var(--gold)] fill-[var(--gold)]" />
                                        ) : (
                                          <Lock size={14} className="text-[var(--black-6)]" />
                                        )}
                                        <span className="text-sm font-medium text-white">{node.name}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="text-[11px] text-[var(--black-6)]">
                                          Lv.{node.level}/{node.maxLevel}
                                        </div>
                                        {renderLevelCells(node.level, node.maxLevel)}
                                      </div>
                                      <div className="text-xs text-[var(--black-6)] line-clamp-2 mb-2">
                                        {node.description}
                                      </div>
                                      {nextRequirement ? (
                                        <div className="text-[11px] text-[var(--black-6)]">
                                          下一等级: 关卡≥{nextRequirement.requiredGameLevel} · 技能点≥{nextRequirement.requiredSkillPoints}
                                        </div>
                                      ) : (
                                        <div className="text-[11px] text-[var(--gold)]">已满级</div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[var(--black-3)] bg-[var(--black-2)] p-4 sm:p-6">
                    <div className="h-[320px] sm:h-[380px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} outerRadius="72%">
                          <PolarGrid stroke="var(--black-4)" />
                          <PolarAngleAxis
                            dataKey="name"
                            tick={{ fill: 'var(--black-6)', fontSize: 12 }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, radarMax]}
                            tickCount={5}
                            tick={{ fill: 'var(--black-6)', fontSize: 10 }}
                          />
                          <Radar
                            name="分支总值"
                            dataKey="total"
                            stroke="var(--black-5)"
                            fill="transparent"
                            strokeDasharray="6 4"
                          />
                          <Radar
                            name="当前值"
                            dataKey="current"
                            stroke="var(--accent)"
                            fill="var(--accent)"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {radarData.map(item => {
                      const percent = item.total > 0 ? (item.current / item.total) * 100 : 0;

                      return (
                        <div key={item.name} className="rounded-lg border border-[var(--black-3)] bg-[var(--black-2)] p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm text-white">{item.name}</span>
                            </div>
                            <span className="text-xs text-[var(--black-6)]">{item.current}/{item.total} 格</span>
                          </div>
                          <div className="h-2 bg-[var(--black-3)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Skill Modal */}
      {activeSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setActiveSkillId(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-y-auto liquid-glass rounded-2xl p-5 sm:p-6 border border-[var(--accent)]/30"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setActiveSkillId(null)}
              className="absolute top-4 right-4 text-[var(--black-6)] hover:text-white"
              aria-label="关闭技能详情"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: activeSkill.branchColor }}>
                <Star size={20} className="text-white fill-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{activeSkill.name}</h3>
                <div className="text-xs text-[var(--black-6)]">{activeSkill.branch}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-[var(--black-6)] mb-1">等级</div>
              <div className="font-mono-data text-2xl text-white">
                Lv.{activeSkill.level}<span className="text-[var(--black-6)]">/{activeSkill.maxLevel}</span>
              </div>
              <div className="mt-2">
                {renderLevelCells(activeSkill.level, activeSkill.maxLevel)}
              </div>
            </div>

            <p className="text-sm text-[var(--black-5)] mb-4">{activeSkill.description}</p>

            <div className="mb-4 p-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)]">
              <div className="text-xs text-[var(--black-6)] mb-2">绑定游戏</div>
              <div className="flex flex-wrap gap-2">
                {activeSkill.gameIds.length > 0 ? (
                  activeSkill.gameIds.map(gameId => (
                    <Link
                      key={gameId}
                      to={`/game/${gameId}`}
                      onClick={() => setActiveSkillId(null)}
                      className="px-2.5 py-1 rounded-md text-xs border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all"
                    >
                      {gameNameMap.get(gameId) ?? gameId}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-[var(--black-6)]">未绑定</span>
                )}
              </div>
            </div>

            {(() => {
              const nextRequirement = getNextRequirement(activeSkill, gameProgress as ProgressLookup);
              if (!nextRequirement) {
                return (
                  <div className="w-full px-4 py-3 bg-[var(--gold)]/20 border border-[var(--gold)] rounded-lg text-[var(--gold)] font-medium text-center">
                    已满级
                  </div>
                );
              }

              const parentRequirementMet = activeSkill.unlockable;
              const gameRequirementMet = nextRequirement.highestCompletedLevel >= nextRequirement.requiredGameLevel;
              const pointRequirementMet = totalSkillPointsEarned >= nextRequirement.requiredSkillPoints;

              return (
                <div className="p-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)]">
                  <div className="text-xs text-[var(--black-6)] mb-1">
                    下一等级目标: Lv.{nextRequirement.nextLevel}
                  </div>
                  <div className={`text-sm ${parentRequirementMet ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {parentRequirementMet ? '✓' : '✗'} 前置技能已满足
                  </div>
                  <div className={`text-sm ${gameRequirementMet ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {gameRequirementMet ? '✓' : '✗'} 绑定游戏关卡: {nextRequirement.highestCompletedLevel}/{nextRequirement.requiredGameLevel}
                  </div>
                  <div className={`text-sm ${pointRequirementMet ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {pointRequirementMet ? '✓' : '✗'} 累计技能点: {totalSkillPointsEarned}/{nextRequirement.requiredSkillPoints}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={closeSettingsModal}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-lg liquid-glass rounded-2xl p-5 sm:p-6 border border-[var(--accent)]/30"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={closeSettingsModal}
              className="absolute top-4 right-4 text-[var(--black-6)] hover:text-white"
              aria-label="关闭设置"
            >
              <X size={18} />
            </button>

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
                      onClick={() => {
                        resetProgress();
                        setShowResetConfirm(false);
                      }}
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
      )}
    </div>
  );
}
