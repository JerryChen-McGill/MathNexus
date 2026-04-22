import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { skillBranches } from '@/data/games';
import { Star, Lock, X } from 'lucide-react';
import gsap from 'gsap';

export default function SkillTreePage() {
  const { skillNodes: nodes, skillPoints, unlockSkill } = useGameStore();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const treeRef = useRef<HTMLDivElement>(null);

  const selected = nodes.find(n => n.id === selectedNode);

  useEffect(() => {
    if (!treeRef.current) return;
    const els = treeRef.current.querySelectorAll('.skill-node');
    gsap.fromTo(els,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, stagger: 0.03, ease: 'back.out(1.7)' }
    );
  }, [filter]);

  const filteredNodes = filter === 'all' ? nodes : nodes.filter(n => n.branch === skillBranches.find(b => b.id === filter)?.name);

  const getNodeStatus = (node: typeof nodes[0]) => {
    if (node.unlocked) return 'unlocked';
    if (node.unlockable) return 'unlockable';
    return 'locked';
  };

  const handleUnlock = (nodeId: string) => {
    unlockSkill(nodeId);
    // Animate
    const el = document.querySelector(`[data-node="${nodeId}"]`);
    if (el) {
      gsap.fromTo(el,
        { scale: 0 },
        { scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
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
              <p className="text-[var(--black-6)]">完成游戏关卡，解锁数学技能</p>
            </div>
            <div className="liquid-glass px-4 py-2.5 rounded-lg">
              <span className="text-sm text-[var(--black-6)]">可用技能点: </span>
              <span className="font-mono-data text-lg text-[var(--gold)]">{skillPoints}</span>
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
        <div className="max-w-[1440px] mx-auto flex gap-8">
          {/* Tree Grid */}
          <div ref={treeRef} className="flex-1">
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
                      return (
                        <button
                          key={node.id}
                          data-node={node.id}
                          onClick={() => setSelectedNode(node.id)}
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
                          {status === 'unlockable' && (
                            <div className="mt-2 text-xs text-[var(--accent)] font-medium">
              需要 {node.cost} 技能点
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

          {/* Detail Panel */}
          {selected && (
            <div className="hidden lg:block w-80 shrink-0">
              <div className="sticky top-20 liquid-glass rounded-2xl p-6">
                <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 text-[var(--black-6)] hover:text-white">
                  <X size={16} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: selected.branchColor }}>
                    <Star size={20} className="text-white fill-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{selected.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selected.branchColor }} />
                      <span className="text-xs text-[var(--black-6)]">{selected.branch}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-[var(--black-6)] mb-1">等级</div>
                  <div className="font-mono-data text-2xl text-white">
                    Lv.{selected.level}<span className="text-[var(--black-6)]">/{selected.maxLevel}</span>
                  </div>
                </div>

                <p className="text-sm text-[var(--black-5)] mb-6">{selected.description}</p>

                {!selected.unlocked && selected.unlockable && (
                  <button
                    onClick={() => handleUnlock(selected.id)}
                    disabled={skillPoints < selected.cost}
                    className="w-full px-6 py-3 bg-[var(--accent)] rounded-lg text-white font-medium hover:bg-[var(--accent-dark)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    解锁 ({selected.cost} 技能点)
                  </button>
                )}

                {selected.unlocked && selected.level < selected.maxLevel && (
                  <button
                    onClick={() => {}}
                    className="w-full px-6 py-3 bg-[var(--success)]/20 border border-[var(--success)] rounded-lg text-[var(--success)] font-medium"
                  >
                    已解锁 (Lv.{selected.level})
                  </button>
                )}

                {selected.unlocked && selected.level >= selected.maxLevel && (
                  <div className="w-full px-6 py-3 bg-[var(--gold)]/20 border border-[var(--gold)] rounded-lg text-[var(--gold)] font-medium text-center">
                    已满级
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
