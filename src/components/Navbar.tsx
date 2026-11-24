import { Link, NavLink } from 'react-router-dom';
import { Flag, Gift, UserRound, Flame, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { visibleStreak } from '@/lib/progress';
import { useLocalDate } from '@/hooks/use-local-date';
export default function Navbar() {
  const recent = useGameStore(s => s.recentProgram);
  const rewards = useGameStore(s => s.rewards);
  const today = useLocalDate();
  return <>
    <nav className="app-nav" aria-label="主要导航">
      <Link className="brand" to="/" aria-label="MathNexus 介绍"><span className="brand-mark">m<span>✦</span></span><span className="brand-name">MathNexus</span></Link>
      <div className="nav-links">
        {[{ to: `/program/${recent}`, label: '闯关', Icon: Flag }, { to: '/rewards', label: '奖励', Icon: Gift }, { to: '/profile', label: '我的', Icon: UserRound }].map(({ to, label, Icon }) =>
          <NavLink key={label} to={to} className={({ isActive }) => isActive ? 'nav-item selected' : 'nav-item'}><Icon size={24}/><span>{label}</span></NavLink>)}
      </div>
      <p className="nav-note">让好奇心<br/>带你再走一步。</p>
    </nav>
    <header className="app-topbar"><span className="topbar-message">一点好奇，无限可能。</span><div className="compact-stats"><Link to="/rewards" aria-label={`连续练习 ${visibleStreak(rewards, today)} 天`}><Flame size={21}/>{visibleStreak(rewards, today)}</Link><Link to="/rewards" aria-label={`累计 ${rewards.xp} XP`}><Sparkles size={21}/>{rewards.xp} <small>XP</small></Link></div></header>
  </>;
}
