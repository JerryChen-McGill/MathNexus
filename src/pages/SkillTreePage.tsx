import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { useGameStore } from '@/store/gameStore';
import { games, skillBranches } from '@/data/games';
import type { SkillNode } from '@/data/games';
import { Star, Lock, X } from 'lucide-react';
import gsap from 'gsap';

const SKILL_LEVEL_GAME_REQUIREMENTS = [1, 3, 5, 7, 10] as const;
const SKILL_LEVEL_POINT_FACTORS = [1, 3, 6, 10, 15] as const;
const SKILL_POINT_REQUIREMENT_BASE = 20;

const gameNameMap = new Map(games.map(game => [game.id, game.name]));

type ProgressLookup = Record<string, { highestLevel: number }>;
type HoverPosition = { x: number; y: number };

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

function SkillDetailContent({
  node,
  gameProgress,
  totalSkillPointsEarned,
  compact = false,
}: {
  node: SkillNode;
  gameProgress: ProgressLookup;
  totalSkillPointsEarned: number;
  compact?: boolean;
}) {
  const nextRequirement = getNextRequirement(node, gameProgress);
  const parentRequirementMet = node.unlockable;
  const gameRequirementMet = nextRequirement
    ? nextRequirement.highestCompletedLevel >= nextRequirement.requiredGameLevel
    : false;
  const pointRequirementMet = nextRequirement
    ? totalSkillPointsEarned >= nextRequirement.requiredSkillPoints
    : false;

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: node.branchColor }}>
          <Star size={20} className="text-white fill-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{node.name}</h3>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: node.branchColor }} />
            <span className="text-xs text-[var(--black-6)]">{node.branch}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-[var(--black-6)] mb-1">等级</div>
        <div className="font-mono-data text-2xl text-white">
          Lv.{node.level}<span className="text-[var(--black-6)]">/{node.maxLevel}</span>
        </div>
      </div>

      <p className={`text-sm text-[var(--black-5)] ${compact ? 'line-clamp-2 mb-4' : 'mb-4'}`}>
        {node.description}
      </p>

      <div className="mb-4 p-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)]">
        <div className="text-xs text-[var(--black-6)] mb-1">绑定游戏</div>
        <div className={`text-sm text-white leading-relaxed ${compact ? 'line-clamp-2' : ''}`}>
          {node.gameIds.length > 0
            ? node.gameIds.map(gameId => gameNameMap.get(gameId) ?? gameId).join('、')
            : '未绑定'}
        </div>
      </div>

      {nextRequirement ? (
        <div className="space-y-3">
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

          {!compact && (
            <div className="w-full px-4 py-3 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/40 text-[var(--accent)] text-sm text-center">
              技能等级会在达成条件后自动解锁/升级
            </div>
          )}
        </div>
      ) : (
        <div className="w-full px-4 py-3 bg-[var(--gold)]/20 border border-[var(--gold)] rounded-lg text-[var(--gold)] font-medium text-center">
          已满级
        </div>
      )}
    </>
  );
}

export default function SkillTreePage() {
  const {
    skillNodes: nodes,
    skillPoints,
    totalSkillPointsEarned,
    gameProgress,
  } = useGameStore();
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<HoverPosition>({ x: 0, y: 0 });
  const [filter, setFilter] = useState<string>('all');
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const treeRef = useRef<HTMLDivElement>(null);

  const activeNode = nodes.find(n => n.id === activeNodeId);
  const hoverNode = nodes.find(n => n.id === hoverNodeId);

  useEffect(() => {
    if (!treeRef.current) return;
    const els = treeRef.current.querySelectorAll('.skill-node');
    gsap.fromTo(els,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, stagger: 0.03, ease: 'back.out(1.7)' }
    );
  }, [filter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(min-width: 1024px)');
    const update = (event?: MediaQueryListEvent) => {
      setIsDesktop(event ? event.matches : media.matches);
    };

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!activeNodeId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveNodeId(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeNodeId]);

  useEffect(() => {
    if (!activeNodeId) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [activeNodeId]);

  const filteredNodes = filter === 'all'
    ? nodes
    : nodes.filter(n => n.branch === skillBranches.find(b => b.id === filter)?.name);

  const getNodeStatus = (node: SkillNode) => {
    if (node.unlocked) return 'unlocked';
    if (node.unlockable) return 'unlockable';
    return 'locked';
  };

  const updateHoverPosition = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const cardWidth = 340;
    const margin = 16;
    const preferredLeft = rect.right + margin;
    const fallbackLeft = rect.left - cardWidth - margin;
    const left = preferredLeft + cardWidth > window.innerWidth - margin
      ? Math.max(margin, fallbackLeft)
      : preferredLeft;
    const top = Math.min(
      window.innerHeight - margin,
      Math.max(margin, rect.top + rect.height / 2)
    );

    setHoverPosition({ x: left, y: top });
  };

  const handleNodeMouseEnter = (event: MouseEvent<HTMLButtonElement>, nodeId: string) => {
    if (!isDesktop || activeNodeId) return;
    updateHoverPosition(event);
    setHoverNodeId(nodeId);
  };

  const handleNodeMouseMove = (event: MouseEvent<HTMLButtonElement>, nodeId: string) => {
    if (!isDesktop || activeNodeId || hoverNodeId !== nodeId) return;
    updateHoverPosition(event);
  };

  const handleNodeMouseLeave = () => {
    setHoverNodeId(null);
  };

  const handleNodeClick = (nodeId: string) => {
    setActiveNodeId(nodeId);
    setHoverNodeId(null);
  };

  return (
    <div className="pt-14 min-h-screen">
      {/* Header */}
      <section className="pt-8 pb-4 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-[clamp(2rem,5vw,3rem)] text-white mb-2">
                数学技能树
              </h1>
              <p className="text-[var(--black-6)]">通关绑定游戏关卡并累计技能点，技能会自动解锁与升级</p>
            </div>
            <div className="liquid-glass px-4 py-2.5 rounded-lg">
              <span className="text-sm text-[var(--black-6)]">累计技能点: </span>
              <span className="font-mono-data text-lg text-[var(--gold)]">{totalSkillPointsEarned}</span>
              <span className="text-xs text-[var(--black-6)] ml-2">(当前可用: {skillPoints})</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter */}
      <section className="pb-6 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                filter === 'all' ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--black-3)] text-[var(--black-6)] hover:text-white'
              }`}
            >
              全部
            </button>
            {skillBranches.map(b => (
              <button
                key={b.id}
                onClick={() => setFilter(b.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-2 ${
                  filter === b.id ? 'border-[var(--accent)] text-white' : 'border-[var(--black-3)] text-[var(--black-6)] hover:text-white'
                }`}
                style={filter === b.id ? { backgroundColor: `${b.color}20`, borderColor: b.color } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Tree */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-[1440px] mx-auto" ref={treeRef}>
          {skillBranches.map(branch => {
            if (filter !== 'all' && filter !== branch.id) return null;
            const branchNodes = filteredNodes.filter(n => n.branch === branch.name);
            if (branchNodes.length === 0) return null;

            return (
              <div key={branch.id} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: branch.color }} />
                  <h3 className="font-semibold text-white">{branch.name}</h3>
                  <span className="text-xs text-[var(--black-6)]">
                    {branchNodes.filter(n => n.unlocked).length}/{branchNodes.length} 已解锁
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {branchNodes.map(node => {
                    const status = getNodeStatus(node);
                    const nextRequirement = getNextRequirement(node, gameProgress as ProgressLookup);

                    return (
                      <button
                        key={node.id}
                        data-node={node.id}
                        onClick={() => handleNodeClick(node.id)}
                        onMouseEnter={(event) => handleNodeMouseEnter(event, node.id)}
                        onMouseMove={(event) => handleNodeMouseMove(event, node.id)}
                        onMouseLeave={handleNodeMouseLeave}
                        className={`skill-node relative p-4 rounded-xl border text-left transition-all duration-300 hover:scale-105 ${
                          status === 'unlocked'
                            ? 'border-[var(--success)]/30 bg-[var(--success)]/5'
                            : status === 'unlockable'
                              ? 'border-[var(--accent)]/50 bg-[var(--accent)]/5 animation-pulse-glow'
                              : 'border-[var(--black-3)] bg-[var(--black-2)] opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: status === 'unlocked' ? branch.color : 'var(--black-3)' }}
                          >
                            {status === 'unlocked' ? (
                              <Star size={14} className="text-white fill-white" />
                            ) : status === 'unlockable' ? (
                              <Lock size={14} className="text-[var(--accent)]" />
                            ) : (
                              <Lock size={14} className="text-[var(--black-5)]" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{node.name}</div>
                            <div className="text-[10px] text-[var(--black-6)]">Lv.{node.level}/{node.maxLevel}</div>
                          </div>
                        </div>
                        <div className="text-xs text-[var(--black-6)] line-clamp-2">{node.description}</div>
                        {nextRequirement && (
                          <div className="mt-2 text-[10px] text-[var(--black-6)]">
                            下一等级: 关卡≥{nextRequirement.requiredGameLevel} · 技能点≥{nextRequirement.requiredSkillPoints}
                          </div>
                        )}
                        {!nextRequirement && (
                          <div className="mt-2 text-[10px] text-[var(--gold)]">
                            已满级
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Desktop hover preview */}
      {isDesktop && hoverNode && !activeNodeId && (
        <div
          className="hidden lg:block fixed z-40 pointer-events-none"
          style={{ left: `${hoverPosition.x}px`, top: `${hoverPosition.y}px`, transform: 'translateY(-50%)' }}
        >
          <div className="w-[320px] liquid-glass rounded-2xl p-5 border border-[var(--accent)]/25 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <SkillDetailContent
              node={hoverNode}
              gameProgress={gameProgress as ProgressLookup}
              totalSkillPointsEarned={totalSkillPointsEarned}
              compact
            />
          </div>
        </div>
      )}

      {/* Click modal (all devices) */}
      {activeNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setActiveNodeId(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-y-auto liquid-glass rounded-2xl p-5 sm:p-6 border border-[var(--accent)]/30"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setActiveNodeId(null)}
              className="absolute top-4 right-4 text-[var(--black-6)] hover:text-white"
              aria-label="关闭详情"
            >
              <X size={18} />
            </button>
            <SkillDetailContent
              node={activeNode}
              gameProgress={gameProgress as ProgressLookup}
              totalSkillPointsEarned={totalSkillPointsEarned}
            />
          </div>
        </div>
      )}
    </div>
  );
}
