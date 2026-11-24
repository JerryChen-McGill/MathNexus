import { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, X, Undo2, Redo2, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { lighthouseLevels } from '@/data/lighthouse';
import { inspectLighthouse } from '@/lib/lighthouse';
import type { LighthouseMark } from '@/lib/lighthouse';
import { useGameClock } from '@/hooks/use-game-clock';
import './LighthouseGame.css';

interface Props { level: number; elapsedTime: number; onComplete: (score: number, stars: number) => void }
export default function LighthouseGame({ level, elapsedTime, onComplete }: Props) {
  const puzzle = lighthouseLevels[level - 1];
  const size = puzzle.rows.length;
  const [history, setHistory] = useState<LighthouseMark[][]>(() => [Array(size * size).fill(null)]);
  const [cursor, setCursor] = useState(0);
  const [mode, setMode] = useState<'light' | 'cross'>('light');
  const [hints, setHints] = useState(true);
  const marks = history[cursor];
  const board = useMemo(() => inspectLighthouse(puzzle.rows, marks), [puzzle, marks]);
  const clock = useGameClock();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  const skipClick = useRef(false);
  const complete = useRef(false);

  useEffect(() => {
    if (board.solved && !complete.current) {
      complete.current = true;
      // Valid solutions are accepted even when they use more than the target count.
      const stars = board.lightCount <= puzzle.target ? 3 : board.lightCount <= puzzle.target + 2 ? 2 : 1;
      onComplete(Math.max(100, 500 + level * 100 - Math.floor(elapsedTime / 3)), stars);
    }
  }, [board, elapsedTime, level, onComplete, puzzle.target]);
  useEffect(() => () => { if (pressTimer.current) clock.clearTimeout(pressTimer.current); }, [clock]);

  function cancelPress() {
    if (pressTimer.current) clock.clearTimeout(pressTimer.current);
    pressTimer.current = null;
    pressOrigin.current = null;
  }
  function toggle(index: number, next: 'light' | 'cross') {
    if (complete.current) return;
    const updated = [...marks];
    updated[index] = updated[index] === next ? null : next;
    setHistory(previous => [...previous.slice(0, cursor + 1), updated]);
    setCursor(cursor + 1);
  }
  return <div className="lighthouse-game">
    <div className="lighthouse-intro"><span className="lighthouse-emblem"><Lightbulb size={25}/></span><h2>点亮黑暗，照亮智慧之路</h2><p>让每一格都遇见光</p></div>
    <div className="lighthouse-stats"><span><Lightbulb size={18}/><strong>{board.lightCount}</strong> / {puzzle.target}<small>参考灯塔数</small></span><span><strong>{board.lit.size}</strong> / {board.whiteCount}<small>已照亮</small></span></div>
    <div className="lighthouse-board-wrap">
      <div className="lighthouse-board" role="group" aria-label={`${size}乘${size}灯塔棋盘`} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, width: `min(100%, ${size * 54}px)` }}>
        {puzzle.rows.flatMap((row, r) => [...row].map((cell, c) => {
          const index = r * size + c;
          const clue = board.clues.get(index);
          const place = `第${r + 1}行第${c + 1}列`;
          if (cell !== '.') return <div key={index} className={`lighthouse-cell wall ${hints && clue ? clue.actual === clue.required ? 'matched' : clue.actual > clue.required ? 'overfilled' : '' : ''}`} aria-label={`${place}黑格${clue ? `，需要${clue.required}盏灯，已有${clue.actual}盏` : ''}`}>
            {clue && <span>{hints ? <><small>{clue.actual}/</small>{clue.required}</> : clue.required}</span>}
          </div>;
          const light = marks[index] === 'light';
          const cross = marks[index] === 'cross';
          const conflict = board.conflicts.has(index);
          return <button key={index} type="button" data-testid={`cell-${r}-${c}`} aria-label={`${place}，${light ? '灯塔' : cross ? '禁放标记' : '空格'}，${board.lit.has(index) ? '已照亮' : '未照亮'}${hints && conflict ? '，灯塔互相照射' : ''}`} aria-pressed={light || cross}
            className={`lighthouse-cell ${board.lit.has(index) ? 'lit' : ''} ${light ? 'has-light' : ''} ${hints && conflict ? 'conflict' : ''}`}
            onClick={() => { if (skipClick.current) { skipClick.current = false; return; } toggle(index, mode); }}
            onContextMenu={e => { e.preventDefault(); cancelPress(); if (!skipClick.current) toggle(index, 'cross'); }}
            onPointerDown={e => {
              if (e.button !== 0) return;
              cancelPress(); skipClick.current = false;
              pressOrigin.current = { x: e.clientX, y: e.clientY };
              pressTimer.current = clock.setTimeout(() => { skipClick.current = true; toggle(index, 'cross'); pressTimer.current = null; }, 500);
            }}
            onPointerMove={e => { if (pressOrigin.current && Math.hypot(e.clientX - pressOrigin.current.x, e.clientY - pressOrigin.current.y) > 10) cancelPress(); }}
            onPointerUp={cancelPress} onPointerLeave={cancelPress} onPointerCancel={cancelPress}>
            {light ? <Lightbulb aria-hidden="true"/> : cross ? <X aria-hidden="true"/> : null}
          </button>;
        }))}
      </div>
    </div>
    <div className="lighthouse-mode" role="group" aria-label="落子模式"><button type="button" aria-pressed={mode === 'light'} onClick={() => setMode('light')}><Lightbulb size={18}/>放置灯塔</button><button type="button" aria-pressed={mode === 'cross'} onClick={() => setMode('cross')}><X size={18}/>禁放标记</button></div>
    <div className="lighthouse-controls">
      <button type="button" disabled={cursor === 0} onClick={() => setCursor(cursor - 1)}><Undo2 size={19}/>撤销</button>
      <button type="button" disabled={cursor === history.length - 1} onClick={() => setCursor(cursor + 1)}><Redo2 size={19}/>重做</button>
      <button type="button" aria-pressed={hints} onClick={() => setHints(!hints)}>{hints ? <Eye size={19}/> : <EyeOff size={19}/>}提示</button>
      <button type="button" onClick={() => { cancelPress(); setHistory([Array(size * size).fill(null)]); setCursor(0); }}><RotateCcw size={19}/>重置</button>
    </div>
    <p className="lighthouse-feedback" role="status">{hints ? board.conflicts.size ? '有灯塔互相照射，请调整位置。' : [...board.clues.values()].some(clue => clue.actual > clue.required) ? '有数字格周围的灯塔过多，请调整位置。' : `数字条件满足 ${board.matchedClues} / ${board.clues.size} · 还有 ${board.whiteCount - board.lit.size} 格等待点亮` : '提示已关闭，试着独立完成推理。'}</p>
    <details className="lighthouse-rules"><summary>游戏规则</summary><ul><li>点击白格放置或移除灯塔；长按、右键或切换模式可标记禁放格。</li><li>灯塔沿上下左右照亮白格，光线遇到黑格停止。</li><li>数字表示黑格上下左右相邻的灯塔数量，0 表示周围不能放灯。</li><li>灯塔之间不能互相照射。禁放标记不会挡住光线。</li><li>照亮所有白格并满足所有数字即可通关；参考灯塔数不限制通关。</li></ul></details>
  </div>;
}
