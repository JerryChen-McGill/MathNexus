import { Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { games, levelConfigs } from '@/data/games';
import { quickRules } from '@/data/programs';
import { useGameStore } from '@/store/gameStore';
import { GameClock } from '@/lib/gameClock';
import { GameClockContext } from '@/hooks/use-game-clock';
import { localDate } from '@/lib/progress';
import { ArrowLeft, Pause, BookOpen, X, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SudokuGame from '@/games/SudokuGame';
import Math24Game from '@/games/Math24Game';
import MagicSquareGame from '@/games/MagicSquareGame';
import SlidingPuzzleGame from '@/games/SlidingPuzzleGame';
import MinesweeperGame from '@/games/MinesweeperGame';
import TicTacToeGame from '@/games/TicTacToeGame';
import GomokuGame from '@/games/GomokuGame';
import NimGame from '@/games/NimGame';
import HanoiGame from '@/games/HanoiGame';
import NumberBombGame from '@/games/NumberBombGame';
import BashGame from '@/games/BashGame';
import NumberRaceGame from '@/games/NumberRaceGame';
import TangramGame from '@/games/TangramGame';
import EinsteinGame from '@/games/EinsteinGame';
import RiverCrossingGame from '@/games/RiverCrossingGame';
import HundredChickenGame from '@/games/HundredChickenGame';
import ChickenRabbitGame from '@/games/ChickenRabbitGame';
import SunziGame from '@/games/SunziGame';
import KonigsbergGame from '@/games/KonigsbergGame';
import NumberPyramidGame from '@/games/NumberPyramidGame';
import LighthouseGame from '@/games/LighthouseGame';
import BloxorzGame from '@/games/BloxorzGame';
import PuzzlePackGame from '@/games/PuzzlePackGame';
import { canPlayLevel } from '@/lib/access';
const gameComponents: Record<string, React.FC<any>> = {
'bloxorz': BloxorzGame,
'lighthouse': LighthouseGame,
'sudoku': SudokuGame,
'math24': Math24Game,
'magic-square': MagicSquareGame,
'sliding-puzzle': SlidingPuzzleGame,
'minesweeper': MinesweeperGame,
'tic-tac-toe': TicTacToeGame,
'gomoku': GomokuGame,
'nim': NimGame,
'hanoi': HanoiGame,
'number-bomb': NumberBombGame,
'bash-game': BashGame,
'number-race': NumberRaceGame,
'tangram': TangramGame,
'einstein': EinsteinGame,
'river-crossing': RiverCrossingGame,
'hundred-chicken': HundredChickenGame,
'chicken-rabbit': ChickenRabbitGame,
'sunzi': SunziGame,
'konigsberg': KonigsbergGame,
'number-pyramid': NumberPyramidGame,
...Object.fromEntries(['water-pipes','shikaku','skyscraper','nonogram','killer-sudoku','kakuro','hashi','parking-lot','water-sort','sliding-maze','queens','water-jug','one-stroke','paradox-garden','escape-room','tango','lucky-draw','pinecone-battle','logic-fill','puzzle-challenge'].map(id => [id, PuzzlePackGame])),
};
export default function GameArena() {
  const { gameId = '', level: rawLevel = '' } = useParams();
  const [attempt, setAttempt] = useState(0);
  const unlocked = useGameStore(s => s.gameProgress[gameId]?.highestLevel ?? 1);
  const token = useGameStore(s => s.userToken);
  const level = Number(rawLevel);
  if (!levelConfigs[gameId]) return <Navigate to="/games" replace/>;
  if (!canPlayLevel(level, levelConfigs[gameId].length, unlocked, token)) return <Navigate to={`/program/${gameId}`} replace/>;
  return <GameSession key={`${gameId}:${level}:${attempt}`} gameId={gameId} level={level} onRestart={() => setAttempt(n => n + 1)}/>;
}
function GameSession({ gameId, level, onRestart }: { gameId: string; level: number; onRestart: () => void }) {
  const game = games.find(g => g.id === gameId)!;
  const config = levelConfigs[gameId][level - 1];
  const GameComponent = gameComponents[gameId];
  const [clock] = useState(() => new GameClock());
  const [session] = useState(() => crypto.randomUUID());
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const settled = useRef(false);
  const live = useRef(true);
  const [panel, setPanel] = useState<'pause' | 'rules' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ won: boolean; score: number; stars: number; xp: number; reason?: string } | null>(null);
  const [showHint, setShowHint] = useState(() => !useGameStore.getState().seenHints.includes(gameId));
  const dismissHint = useGameStore(s => s.dismissHint);
  const rewards = useGameStore(s => s.rewards);
  const navigate = useNavigate();
  const back = `/program/${gameId}`;
  const changePanel = useCallback((next: 'pause' | 'rules' | null) => { clock.setPaused(next !== null || settled.current); setPanel(next); }, [clock]);
  useEffect(() => { if (showHint) dismissHint(gameId); }, [dismissHint, gameId, showHint]);
  useLayoutEffect(() => {
    live.current = true;
    clock.activate();
    useGameStore.getState().startGame(session, gameId);
    return () => { live.current = false; clock.dispose(); };
  }, [clock, session, gameId]);
  useEffect(() => {
    const timer = clock.setInterval(() => { elapsedRef.current += 1; setElapsed(elapsedRef.current); }, 1000);
    return () => clock.clearInterval(timer);
  }, [clock]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !settled.current) changePanel('pause'); };
    const visibility = () => { if (document.hidden && !settled.current) changePanel('pause'); };
    window.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', visibility); };
  }, [changePanel]);
  const onComplete = useCallback((score: number, stars: number) => {
    if (settled.current) return;
    settled.current = true; clock.setPaused(true);
    queueMicrotask(() => {
      if (!live.current) return;
      const xp = useGameStore.getState().completeLevel(session, gameId, level, score, elapsedRef.current, stars);
      setResult({ won: true, score, stars, xp });
      clock.setTimeout(() => { if (live.current) setShowResult(true); }, 1400);
    });
  }, [clock, session, gameId, level]);
  const onFail = useCallback((reason: string) => {
    if (settled.current) return;
    settled.current = true; clock.setPaused(true);
    queueMicrotask(() => {
      if (!live.current) return;
      useGameStore.getState().failLevel(session, gameId, level);
      setResult({ won: false, score: 0, stars: 0, xp: 0, reason });
      clock.setTimeout(() => { if (live.current) setShowResult(true); }, 1400);
    });
  }, [clock, session, gameId, level]);
  const frozen = panel !== null || result !== null;
  return <div className="game-screen">
    <header className="game-header"><Link className="icon-button" to={back} aria-label="返回关卡路径"><ArrowLeft size={22}/></Link><div className="game-title"><strong>{game.name}</strong><span>第 {level} 关 · {config.name}</span></div><span className="game-time" aria-label="本局用时">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span><button className="icon-button" onClick={() => changePanel('rules')} aria-label="玩法"><BookOpen size={21}/></button><button className="icon-button" onClick={() => changePanel('pause')} aria-label="暂停"><Pause size={21}/></button></header>
    <div className="session-progress" aria-hidden="true"><span style={{ width: `${level / levelConfigs[gameId].length * 100}%` }}/></div>
    {showHint && <div className="first-hint"><BookOpen size={20}/><p>{quickRules[gameId]}</p><button className="icon-button" onClick={() => setShowHint(false)} aria-label="关闭玩法提示"><X size={18}/></button></div>}
    <main className={`game-content game-${gameId}`} inert={frozen} aria-hidden={frozen || undefined}>
      <GameClockContext.Provider value={clock}><GameComponent gameId={gameId} level={level} config={config} onComplete={onComplete} onFail={onFail} elapsedTime={elapsed}/></GameClockContext.Provider>
    </main>
    <Dialog open={panel !== null && result === null} onOpenChange={open => { if (!open) changePanel(null); }}>
      <DialogContent className="session-dialog"><DialogTitle>{panel === 'rules' ? '怎么玩' : '休息一下，也很好'}</DialogTitle><DialogDescription>{panel === 'rules' ? quickRules[gameId] : '棋盘和时间都在等你，准备好了就继续。'}</DialogDescription><button className="primary-button" onClick={() => changePanel(null)}>继续游戏</button><button className="secondary-button" onClick={onRestart}><RotateCcw size={18}/>重新开始</button><Link className="text-button" to={back}>回到关卡路径</Link></DialogContent>
    </Dialog>
    <Dialog open={result !== null && showResult}>
      <DialogContent className="session-dialog result-dialog" showCloseButton={false} onEscapeKeyDown={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()}>
        <span className={`result-symbol ${result?.won ? '' : 'retry'}`}>{result?.won ? <Trophy size={42}/> : <RotateCcw size={42}/>}</span>
        <DialogTitle>{result?.won ? '又一个小小胜利！' : '换个思路，再试一次'}</DialogTitle>
        <DialogDescription>{result?.won ? config.name : result?.reason}</DialogDescription>
        {result?.won && <><div className="earned-xp"><Sparkles/>+{result.xp} XP</div><p className="muted">今日完成 {Math.min(3, rewards.daily[localDate()]?.completed ?? 0)} / 3 局{rewards.daily[localDate()]?.bonusAwarded ? ' · 今日奖励已获得' : ''}</p><details><summary>本局记录</summary><p>{result.score} 分 · {'★'.repeat(result.stars)} · {elapsed} 秒</p></details></>}
        {result?.won && level < levelConfigs[gameId].length ? <button className="primary-button" onClick={() => navigate(`/program/${gameId}/play/${level + 1}`)}>下一关</button> : result?.won ? <Link className="primary-button" to={back}>完成旅程，回到路线</Link> : <button className="primary-button" onClick={onRestart}>再试一次</button>}
        <Link className="text-button" to={back}>回到关卡路径</Link>
      </DialogContent>
    </Dialog>
  </div>;
}
