import { Flame, Sparkles, Trophy, Check } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { visibleStreak } from '@/lib/progress';
import { useLocalDate } from '@/hooks/use-local-date';
import { games } from '@/data/games';
export default function Rewards() {
  const rewards = useGameStore(s => s.rewards);
  const date = useLocalDate();
  const today = rewards.daily[date];
  const done = Math.min(3, today?.completed ?? 0);
  return <main className="page-width rewards-page"><p className="eyebrow">小小进步，大大值得</p><h1>为自己喝彩</h1><p className="muted">每一次尝试，都在让你走得更远。</p>
    <section className="reward-totals"><div><Sparkles/><strong>{rewards.xp}</strong><span>累计 XP</span></div><div><Flame/><strong>{visibleStreak(rewards, date)}</strong><span>连续练习天数</span></div></section>
    <section className="surface daily-card"><span className="reward-symbol">✦</span><div><p className="eyebrow">今日小目标</p><h2>{done === 3 ? '今天的小目标完成啦！' : '玩上三局，收集一点快乐'}</h2><p>任何 program 都算，重玩也可以。完成后额外获得 10 XP。</p><div className="daily-steps" aria-label={`今日完成 ${done} / 3 局`}>{[1,2,3].map(i => <span key={i} className={done >= i ? 'filled' : ''}>{done >= i ? <Check size={20}/> : i}</span>)}</div></div></section>
    <section className="badges-section"><h2>一路收集的纪念</h2><p className="muted">完成一个章节，就能留下一枚专属徽章。</p><div className="badge-grid">
      {rewards.badges.map(badge => { const [id, chapter] = badge.split(':'); return <div className="badge-card" key={badge}><Trophy size={36}/><strong>{games.find(g => g.id === id)?.name}</strong><span>第 {chapter} 章 · 已完成</span></div>; })}
      {rewards.badges.length === 0 && <div className="badge-empty"><Trophy size={40}/><h3>第一枚纪念，正在路上</h3><p>从一关开始，慢慢收集属于你的故事。</p></div>}
    </div></section>
  </main>;
}
