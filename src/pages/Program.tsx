import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BookOpen, Check, ChevronDown, Flag, Lock, Sparkles, Trophy } from 'lucide-react';
import { games, levelConfigs } from '@/data/games';
import { quickRules } from '@/data/programs';
import { useGameStore } from '@/store/gameStore';
import ProgramPicker from '@/components/ProgramPicker';
import { isAdminToken } from '@/lib/access';

export default function Program() {
  const { gameId = '' } = useParams();
  if (!levelConfigs[gameId]) return <Navigate to="/games" replace/>;
  return <ProgramPath key={gameId} gameId={gameId}/>;
}
function ProgramPath({ gameId }: { gameId: string }) {
  const game = games.find(g => g.id === gameId)!;
  const levels = levelConfigs[gameId];
  const progress = useGameStore(s => s.gameProgress[gameId]);
  const admin = useGameStore(s => isAdminToken(s.userToken));
  const selectProgram = useGameStore(s => s.selectProgram);
  const current = progress.highestLevel;
  const complete = levels.every((_, i) => progress.levels[`level-${i + 1}`]?.completed);
  const [chapter, setChapter] = useState(Math.ceil(current / 5));
  const currentNode = useRef<HTMLAnchorElement>(null);
  useEffect(() => { selectProgram(gameId); }, [gameId, selectProgram]);
  useEffect(() => {
    if (current > 2) currentNode.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, [current]);
  return <main className="program-page page-width">
    <div className="program-heading"><ProgramPicker gameId={gameId}/><span className="eyebrow">每天一点新发现</span></div>
    <section className="journey-banner">
      <div><p className="eyebrow">你的数学冒险</p><h1>{complete ? '这一程，真棒！' : '下一小步，就从这里开始'}</h1>
        <p>{complete ? '所有关卡已完成，挑一关再玩一次吧。' : `${game.name} · 第 ${current} 关 · ${levels[current - 1].name}`}</p>
        <Link className="primary-button" to={`/program/${gameId}/play/${current}`}>{complete ? '再玩一关' : current === 1 ? '开始冒险' : '继续冒险'}</Link>
      </div><div className="journey-art" aria-hidden="true"><span>✦</span><Flag size={54}/><i>✧</i></div>
    </section>
    <div className="path-and-note">
      <div className="chapters">
        {Array.from({ length: Math.ceil(levels.length / 5) }, (_, i) => i + 1).map(ch => <section className="chapter" key={ch}>
          <button className="chapter-title" aria-expanded={chapter === ch} onClick={() => setChapter(chapter === ch ? 0 : ch)}>
            <span><small>第 {ch} 章</small><strong>{ch === 1 ? '好奇心出发' : '发现更多可能'}</strong></span>
            {hasBadge(progress.levels, ch, levels.length) ? <Trophy size={22}/> : <ChevronDown className={chapter === ch ? 'rotate-180' : ''} size={22}/>}
          </button>
          {chapter === ch && <div className="level-path">
            {levels.slice((ch - 1) * 5, ch * 5).map((config, i) => {
              const n = (ch - 1) * 5 + i + 1;
              const done = progress.levels[`level-${n}`]?.completed;
              const unlocked = admin || n <= current;
              const active = n === current && !complete;
              return <div className={`path-stop stop-${i} ${active ? 'current-stop' : ''}`} key={n}>
                {active && <span className="start-bubble">从这里继续</span>}
                {unlocked ? <Link ref={active ? currentNode : undefined} className={`level-node ${done ? 'done' : 'active'}`} to={`/program/${gameId}/play/${n}`} aria-label={`第${n}关 ${config.name}${done ? '，重玩' : '，开始'}`} aria-current={active ? 'step' : undefined}>{done ? <Check size={30}/> : <Flag size={28}/>}</Link>
                  : <button className="level-node locked" disabled aria-label={`第${n}关 ${config.name}，完成上一关后解锁`}><Lock size={24}/></button>}
                <span className="node-label">{n}. {config.name}</span>
              </div>;
            })}
            <div className="chapter-finish"><Trophy size={30}/><span>每一步，都值得庆祝</span></div>
          </div>}
        </section>)}
      </div>
      <aside className="journey-note">
        {admin && <p className="admin-status">管理员模式 · 全部关卡可玩</p>}
        <div className="little-star" aria-hidden="true">✦</div><h2>按你的节奏来</h2><p>一关也很好。遇到难题，休息一下，再试一次。</p>
        <details><summary><BookOpen size={18}/>怎么玩</summary><p>{quickRules[gameId]}</p></details>
        <details><summary><Sparkles size={18}/>我的关卡记录</summary>
          {levels.map((l, i) => { const result = progress.levels[`level-${i + 1}`]; return result?.completed ? <p className="record-row" key={l.name}><span>{l.name}</span><strong>{'★'.repeat(result.stars)} · {result.bestScore} 分</strong></p> : null; })}
          {!Object.values(progress.levels).some(l => l.completed) && <p>完成第一关，你的记录就会出现在这里。</p>}
        </details>
      </aside>
    </div>
  </main>;
}
function hasBadge(levels: Record<string, { completed: boolean }>, chapter: number, count: number) {
  return Array.from({ length: Math.min(5, count - (chapter - 1) * 5) }, (_, i) => (chapter - 1) * 5 + i + 1).every(n => levels[`level-${n}`]?.completed);
}
