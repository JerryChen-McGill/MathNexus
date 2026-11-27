import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Undo2 } from 'lucide-react';
import { bloxorzLevels } from '@/data/bloxorz';
import { inspectBlock, rollBlock, solveBloxorz } from '@/lib/bloxorz';
import type { BlockPose, Direction } from '@/lib/bloxorz';
import { useGameClock } from '@/hooks/use-game-clock';
import './BloxorzGame.css';

const controls = [
  { direction: 'up', label: '向上翻转', Icon: ArrowUp },
  { direction: 'left', label: '向左翻转', Icon: ArrowLeft },
  { direction: 'down', label: '向下翻转', Icon: ArrowDown },
  { direction: 'right', label: '向右翻转', Icon: ArrowRight },
] as const;
const keyDirections: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
const poseNames = { standing: '竖直', horizontal: '横躺', vertical: '纵躺' };

// A projected cuboid keeps the board crisp without a WebGL dependency.
function point(col: number, row: number, height: number) { return [col * 42 - row * 7, row * 29 - height * 32]; }
function face(points: number[][]) { return points.map(p => p.join(',')).join(' '); }
function Cuboid({ col, row, width = 1, depth = 1, height, kind }: { col: number; row: number; width?: number; depth?: number; height: number; kind: string }) {
  const a = point(col, row, height), b = point(col + width, row, height);
  const c = point(col + width, row + depth, height), d = point(col, row + depth, height);
  return <g className={kind}>
    <polygon className="front" points={face([d, c, point(col + width, row + depth, 0), point(col, row + depth, 0)])}/>
    <polygon className="side" points={face([b, c, point(col + width, row + depth, 0), point(col + width, row, 0)])}/>
    <polygon className="top" points={face([a, b, c, d])}/>
  </g>;
}

interface Props { level: number; config: { params: Record<string, number | string | boolean> }; elapsedTime: number; onComplete: (score: number, stars: number) => void; onFail: (reason: string) => void }
export default function BloxorzGame({ level, config, elapsedTime, onComplete, onFail }: Props) {
  const puzzleIndex = Number(config.params.puzzleIndex ?? level - 1);
  const puzzle = bloxorzLevels[Math.min(Math.max(0, puzzleIndex), bloxorzLevels.length - 1)];
  const start: BlockPose = { row: puzzle.start[0], col: puzzle.start[1], orientation: 'standing' };
  const [history, setHistory] = useState<BlockPose[]>([start]);
  const historyRef = useRef(history);
  const finished = useRef(false);
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const clock = useGameClock();
  const block = history[history.length - 1];
  const steps = history.length - 1;
  const target = useMemo(() => solveBloxorz(puzzle)?.length ?? 0, [puzzle]);
  const move = useCallback((direction: Direction) => {
    if (clock.isPaused() || finished.current) return;
    const previous = historyRef.current;
    const next = rollBlock(previous[previous.length - 1], direction);
    const outcome = inspectBlock(puzzle.rows, next);
    if (outcome === 'fell') {
      finished.current = true;
      onFail(next.orientation === 'standing' && puzzle.rows[next.row]?.[next.col] === 'F' ? '脆弱地砖无法承受竖直方块，请躺着通过。' : '方块翻出了平台。留意躺下时需要两个格子的支撑。');
      return;
    }
    const updated = [...previous, next];
    historyRef.current = updated;
    setHistory(updated);
    if (outcome === 'won') {
      finished.current = true;
      const moves = updated.length - 1;
      const stars = moves <= target ? 3 : moves <= target + 4 ? 2 : 1;
      onComplete(Math.max(100, 1000 + level * 100 - moves * 10 - Math.floor(elapsedTime / 3)), stars);
    }
  }, [clock, puzzle, level, elapsedTime, onComplete, onFail, target]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || clock.isPaused()) return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))) return;
      const direction = keyDirections[event.key] ?? keyDirections[event.key.toLowerCase()];
      if (direction) { event.preventDefault(); move(direction); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clock, move]);

  const width = puzzle.rows[0].length, depth = puzzle.rows.length;
  const position = `第${block.row + 1}行第${block.col + 1}列，${poseNames[block.orientation]}`;
  const updateHistory = (next: BlockPose[]) => {
    if (clock.isPaused() || finished.current) return;
    historyRef.current = next; setHistory(next); gesture.current = null;
  };
  return <section className="bloxorz-game" aria-label="Bloxorz 块推游戏">
    <div className="bloxorz-heading"><span>空间推理 · BLOXORZ</span><h2>翻转之间，找到出口</h2><p>让橙色方块竖直落入绿色终点</p></div>
    <div className="bloxorz-stats"><span><strong data-testid="bloxorz-steps">{steps}</strong> 步</span><span>最短路线 <strong>{target}</strong> 步</span><span className="bloxorz-pose">{poseNames[block.orientation]}</span></div>
    <div className="bloxorz-board" tabIndex={0} role="group" aria-label={`块推棋盘，${position}。方向键或 WASD 翻转。`}
      onPointerDown={e => {
        if (e.button !== 0 || !e.isPrimary || clock.isPaused()) return;
        e.currentTarget.focus({ preventScroll: true });
        gesture.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerCancel={() => { gesture.current = null; }}
      onLostPointerCapture={() => { gesture.current = null; }}
      onPointerUp={e => {
        const origin = gesture.current; gesture.current = null;
        if (!origin || origin.id !== e.pointerId || clock.isPaused()) return;
        const dx = e.clientX - origin.x, dy = e.clientY - origin.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
      }}>
      <svg viewBox={`${-depth * 7 - 8} -76 ${width * 42 + depth * 7 + 16} ${depth * 29 + 90}`} role="img" aria-label={`蓝色平台、红色脆弱地砖与绿色终点。方块位于${position}`}>
        {puzzle.rows.flatMap((row, r) => [...row].map((cell, c) => {
          if (cell === '.') return null;
          const [x, y] = point(c + .5, r + .5, .18);
          return <g key={`${r}-${c}`}><Cuboid col={c + .025} row={r + .025} width={.95} depth={.95} height={.18} kind={`bloxorz-tile ${cell === 'F' ? 'fragile' : cell === 'G' ? 'goal' : ''}`}/>
            {cell === 'G' && <polygon className="bloxorz-hole" points={face([point(c + .16, r + .16, .19), point(c + .84, r + .16, .19), point(c + .84, r + .84, .19), point(c + .16, r + .84, .19)])}/>}
            {cell === 'F' && <text x={x} y={y + 5} className="bloxorz-crack">×</text>}
          </g>;
        }))}
        <Cuboid col={block.col + .06} row={block.row + .06} width={block.orientation === 'horizontal' ? 1.88 : .88} depth={block.orientation === 'vertical' ? 1.88 : .88} height={block.orientation === 'standing' ? 2 : 1} kind="bloxorz-block"/>
      </svg>
    </div>
    <div className="bloxorz-legend"><span><i className="solid"/>平台</span><span><i className="fragile"/>脆弱地砖 ×</span><span><i className="goal"/>终点洞</span></div>
    <div className="bloxorz-pad" role="group" aria-label="方向控制">{controls.map(({ direction, label, Icon }) => <button key={direction} type="button" className={`move-${direction}`} aria-label={label} onClick={() => move(direction)}><Icon size={23}/></button>)}</div>
    <div className="bloxorz-actions"><button type="button" disabled={steps === 0} onClick={() => updateHistory(historyRef.current.slice(0, -1))}><Undo2 size={18}/>撤销</button><button type="button" onClick={() => updateHistory([start])}><RotateCcw size={18}/>重置棋盘</button></div>
    <p className="bloxorz-position" role="status">{position} · {steps} 步</p>
    <p className="bloxorz-help">方向键 / WASD · 滑动棋盘 · 点击方向按钮</p>
    <details className="bloxorz-rules"><summary>翻转小提示</summary><ul><li>方块竖直占 1 格，躺下占 2 格。每一格都必须有地砖支撑。</li><li>红色 × 地砖只能躺着通过，竖直站立会掉落。</li><li>躺着经过绿色终点不会通关，必须竖直落入洞中。</li><li>达到最短步数可获三星，多走几步也能通关。撤销会退回上一步。</li></ul></details>
  </section>;
}
