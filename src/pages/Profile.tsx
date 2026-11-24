import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { UserRound, Check, Moon, Sun } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { isAdminToken } from '@/lib/access';
export default function Profile() {
  const state = useGameStore();
  const [name, setName] = useState(state.playerName);
  const [saved, setSaved] = useState(false);
  const [token, setToken] = useState(state.userToken);
  const [tokenMessage, setTokenMessage] = useState('');
  const admin = isAdminToken(state.userToken);
  const [reset, setReset] = useState(false);
  const location = useLocation();
  if (location.hash === '#skills') return <Navigate to="/rewards" replace/>;
  return <main className="page-width profile-page"><p className="eyebrow">每个人都有自己的节奏</p><h1>我的小天地</h1>
    <section className="surface profile-card"><div className="avatar"><UserRound size={36}/></div><div><h2>{state.playerName}</h2><p className="muted">保持好奇，就是很好的开始。</p></div></section>
    <section className="surface"><h2>一路上的足迹</h2><div className="profile-stats"><div><strong>{state.stats.totalWins}</strong><span>完成局数</span></div><div><strong>{Object.values(state.gameProgress).reduce((sum, p) => sum + Object.values(p.levels).filter(l => l.completed).length, 0)}</strong><span>已通过关卡</span></div><div><strong>{Math.floor(state.stats.totalTimePlayed / 60)}</strong><span>累计完成分钟</span></div></div><details><summary>更多记录</summary><p>历史总分 {state.totalScore.toLocaleString()} · 尝试 {state.stats.totalGamesPlayed} 局</p><p>关卡最佳成绩可在各 program 的“我的关卡记录”中查看。</p></details></section>
    <section className="surface" id="settings"><h2>设置</h2>
      <form onSubmit={e => { e.preventDefault(); state.setPlayerName(name); setSaved(true); }}>
        <label htmlFor="player-name">怎么称呼你</label><div className="name-form"><input id="player-name" value={name} maxLength={24} onChange={e => { setName(e.target.value); setSaved(false); }}/><button className="secondary-button" type="submit">{saved ? <><Check size={18}/>已保存</> : '保存'}</button></div><span role="status" className="sr-only">{saved ? '昵称已保存' : ''}</span>
      </form>
      <form className="token-form" onSubmit={e => {
        e.preventDefault();
        const valid = state.setUserToken(token);
        setTokenMessage(valid ? '管理员权限已开启，可以直接玩任意游戏和关卡。' : token.trim() ? '令牌无效，当前使用普通权限。' : '用户令牌已清除，已恢复普通权限。');
      }}>
        <label htmlFor="user-token">用户令牌</label>
        <div className="name-form"><input id="user-token" value={token} maxLength={64} autoComplete="off" spellCheck={false} placeholder="输入用户令牌" aria-describedby="token-status" onChange={e => { setToken(e.target.value); setTokenMessage(''); }}/><button className="secondary-button" type="submit">应用</button></div>
        <p id="token-status" role="status" className={admin ? 'admin-status' : 'muted small-copy'}>{tokenMessage || (admin ? '管理员权限已开启 · 全部关卡可玩' : '开发者可使用令牌开启全部关卡。')}</p>
        {admin && <button className="text-button" type="button" onClick={() => { state.setUserToken(''); setToken(''); setTokenMessage('用户令牌已清除，已恢复普通权限。'); }}>清除令牌</button>}
      </form>
      <div className="setting-row"><span>外观</span><button className="secondary-button" onClick={() => state.updateSettings({ theme: state.settings.theme === 'light' ? 'dark' : 'light' })}>{state.settings.theme === 'light' ? <Sun size={19}/> : <Moon size={19}/>}{state.settings.theme === 'light' ? '明亮' : '深色'}</button></div><p className="muted small-copy">进度和用户令牌保存在当前浏览器中。</p>
    </section>
    <div className="profile-footer"><Link className="text-button" to="/">了解 MathNexus</Link><button className="text-button danger-text" onClick={() => setReset(true)}>重置进度</button></div>
    <Dialog open={reset} onOpenChange={setReset}><DialogContent><DialogTitle>重新开始这段冒险？</DialogTitle><DialogDescription>这会清除当前浏览器中的关卡、XP、徽章和练习记录。昵称和外观设置会保留。</DialogDescription><button className="primary-button" onClick={() => setReset(false)}>保留我的进度</button><button className="text-button danger-text" onClick={() => { state.resetProgress(); setReset(false); }}>确认重置</button></DialogContent></Dialog>
  </main>;
}
