import { Link } from 'react-router-dom';
import { Flag, Heart, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { games } from '@/data/games';
export default function Home() {
  const recent = useGameStore(s => s.recentProgram);
  const hasPlayed = useGameStore(s => s.stats.totalGamesPlayed > 0);
  const target = `/program/${recent}`;
  return <div className="landing">
    <header className="landing-header"><Link className="brand" to="/"><span className="brand-mark">m<span>✦</span></span><span>MathNexus</span></Link><Link className="text-button" to={target}>进入冒险</Link></header>
    <main>
      <section className="landing-hero">
        <div className="hero-copy"><p className="eyebrow">给好奇心，一个游乐场</p><h1>数学，<br/>也可以<span>玩着发现。</span></h1><p className="hero-description">把复杂留给谜题，把轻松留给你。<br/>每天一小关，在玩耍中遇见新的可能。</p><Link className="primary-button" to={target}>{hasPlayed ? '继续冒险' : '开始冒险'}</Link><small className="hero-footnote">免费开玩 · 无需注册 · 按自己的节奏</small></div>
        <div className="hero-illustration" aria-hidden="true"><span className="floating-spark spark-one">✦</span><span className="floating-spark spark-two">✧</span><div className="math-card"><span className="card-eyebrow">今天，也发现一点点</span><div className="mini-grid">{[1, '', 3, '', '', 4, '', 2, 2, '', 4, '', '', 3, '', 1].map((n, i) => <span key={i} className={n ? '' : 'blank'}>{n || '·'}</span>)}</div><span className="card-caption">好奇心 + 一点尝试 = 新发现</span></div><div className="hero-sticker">很好！<Sparkles size={24}/></div><div className="hero-orbit">+</div></div>
      </section>
      <section className="landing-features"><div className="section-intro"><p className="eyebrow">不赶路，也能走很远</p><h2>下一步，总是简单一点。</h2></div><div className="feature-grid">
        <article><span><Flag/></span><h3>选一个，慢慢玩</h3><p>{games.length} 种数学游戏，各有自己的冒险路线。从第一小关开始，好奇心会带路。</p></article>
        <article><span><Heart/></span><h3>试错，也是发现</h3><p>卡住了就再试一次。没有体力限制，没有排名压力，你决定自己的节奏。</p></article>
        <article><span><Sparkles/></span><h3>每一步，都算数</h3><p>收集 XP、完成每日小目标，用章节徽章记录那些“原来如此”的瞬间。</p></article>
      </div></section>
      <section className="landing-cta"><span aria-hidden="true">✦</span><h2>今天的第一个发现，<br/>从这里开始。</h2><Link className="primary-button" to={target}>去玩一关</Link></section>
    </main><footer className="landing-footer"><strong>MathNexus</strong><span>为每一份好奇心而造。</span></footer>
  </div>;
}
