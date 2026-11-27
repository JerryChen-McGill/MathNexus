import { useState } from 'react';

type Props = { gameId?: string; level: number; config: { params: Record<string, number | string | boolean> }; onComplete: (score: number, stars: number) => void };

const palettes = ['#f97316', '#22c55e', '#38bdf8', '#e879f9'];

/** Small self-contained versions of the additional logic games in the shared list. */
export default function PuzzlePackGame({ gameId = '', level, onComplete }: Props) {
  const [cells, setCells] = useState<number[]>(Array(25).fill(0));
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [moves, setMoves] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [tubes, setTubes] = useState<number[][]>([[0, 0, 1, 1], [2, 2, 3, 3], [], []]);
  const finish = () => onComplete(Math.max(100, 700 - moves * 12), moves < 8 ? 3 : moves < 18 ? 2 : 1);
  const checkText = () => {
    const expected: Record<string, string[]> = {
      'water-jug': ['4', '3'], 'lucky-draw': ['50', '1/2', '50%'], 'escape-room': ['7', '42', '24'],
      'paradox-garden': ['2', '4', '6'], skyscraper: ['1 2 3 4 5', '12345'],
      'killer-sudoku': ['15', '15'], kakuro: ['16', '16'], 'pinecone-battle': ['4', '4'], hashi: ['4', '5', '6'],
    };
    if ((expected[gameId] || ['5', '42', '24']).includes(answer.trim().toLowerCase())) finish();
    else setMessage('再想想线索，检查后继续。');
  };
  const gridPuzzle = ['nonogram', 'queens', 'one-stroke', 'shikaku', 'number-grid', 'tango', 'logic-fill', 'paradox-garden', 'escape-room', 'hashi', 'puzzle-challenge'].includes(gameId);
  const descriptions: Record<string, string> = {
    'water-pipes': '旋转管道，让水从蓝色水源连通到绿色出口。点击管道旋转。',
    hashi: '连接岛屿。桥数符合岛上数字，且所有岛屿最终连成一片。',
    'logic-fill': '根据格边线索填写数字，每行每列都不能重复。',
    'puzzle-challenge': '点击一块拼图，再点击相邻位置交换，逐步还原图案。',
    'water-sort': '每次把一种颜色倒入空位或相同颜色的管中，整理成单色管。',
    'parking-lot': '选择车辆，再点方向按钮沿车身方向滑动，为红车打开出口。',
    'sliding-maze': '点击相邻格移动，在墙壁间找到通往出口的路线。',
    'nonogram': '根据行列提示填格，组成隐藏图案。点格子切换填充状态。',
    'queens': '每行每列放一枚皇后，且皇后之间不能互相攻击。',
    'one-stroke': '从起点开始连线，经过每条线段一次到达终点。',
    shikaku: '按数字面积把棋盘划分为矩形，每个矩形恰好包含一个数字。',
    'number-grid': '按提示填入数字，使每行、每列和区域规则都成立。',
    tango: '每行每列放置不同符号；相邻格不能重复相同符号。',
    'paradox-garden': '找出花园里满足线索的数字组合，选中符合条件的格子。',
    'escape-room': '解读房间线索，输入密码打开门。',
    'water-jug': '用两个量杯量出目标水量。经典挑战：用 5 升和 3 升杯量出 4 升。',
    'lucky-draw': '估算抽奖概率：袋中有 5 个红球、5 个蓝球，抽到红球的概率是多少？',
    'pinecone-battle': '轮流拿松果，每次可拿 1 到 3 个，拿走最后一个获胜。找出必胜策略。',
    skyscraper: '每行每列填入 1–5；边上的数字表示从该方向能看到的楼层数。',
    kakuro: '填入 1–9，使每段连续数字之和等于提示且不重复。',
    'killer-sudoku': '数独规则加上虚线框：每个框内数字不重复且总和等于提示。',
  };
  const title = ({ 'water-pipes': '水管工大冒险', 'water-sort': '彩色倒水大师', 'parking-lot': '停车场规划游戏', 'sliding-maze': '滑行迷宫', nonogram: '数织像素拼图', queens: '皇后谜题', 'one-stroke': '一笔画大师', shikaku: '数方 Shikaku', 'number-grid': '数方谜题', tango: '符号逻辑 Tango', 'paradox-garden': '悖论花园', 'escape-room': '密室逃脱', 'water-jug': '量杯大师', 'lucky-draw': '幸运摸球摊', 'pinecone-battle': '松果争夺战', skyscraper: '摩天楼谜题', kakuro: '数和 Kakuro', 'killer-sudoku': '杀手数独', hashi: '数桥解谜', 'logic-fill': '推理填格', 'puzzle-challenge': '拼图挑战' } as Record<string, string>)[gameId] || '益智挑战';

  const toggle = (i: number) => { setCells(c => c.map((v, n) => n === i ? (v + 1) % 2 : v)); setMoves(m => m + 1); };
  const pour = (to: number) => {
    if (selected === null) { if (tubes[to].length) setSelected(to); return; }
    if (selected === to) { setSelected(null); return; }
    const next = tubes.map(t => [...t]);
    const source = next[selected], dest = next[to];
    if (source.length && dest.length < 4 && (!dest.length || dest[dest.length - 1] === source[source.length - 1])) {
      const color = source[source.length - 1]; while (source[source.length - 1] === color && dest.length < 4) dest.push(source.pop()!);
      setTubes(next); setMoves(m => m + 1);
      if (next.slice(0, 2).every(t => !t.length || (t.length === 4 && t.every(c => c === t[0])))) finish();
    }
    setSelected(null);
  };

  return <section className="mx-auto flex h-full max-w-xl flex-col items-center gap-4 overflow-auto p-4 text-center">
    <div className="text-3xl">🧩</div><h2 className="text-xl font-bold text-white">{title} · 第 {level} 关</h2>
    <p className="max-w-md text-sm text-[var(--black-6)]">{descriptions[gameId] || '观察图案与规则，找到满足条件的解。'}</p>
    {gameId === 'water-sort' ? <div className="flex gap-3 py-8">{tubes.map((tube, i) => <button key={i} onClick={() => pour(i)} aria-label={`颜色管 ${i + 1}`} className={`flex h-40 w-12 flex-col-reverse overflow-hidden rounded-b-2xl border-2 p-1 ${selected === i ? 'border-yellow-300' : 'border-slate-400'}`}>{tube.map((c, j) => <span key={j} className="h-8 w-full rounded-sm" style={{ background: palettes[c] }} />)}</button>)}</div> : gridPuzzle ? <div className="grid grid-cols-5 gap-1.5 rounded-xl bg-slate-700 p-2">{cells.map((v, i) => <button key={i} onClick={() => toggle(i)} aria-label={`第 ${Math.floor(i / 5) + 1} 行第 ${i % 5 + 1} 列`} className={`h-12 w-12 rounded-md border ${v ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600 bg-slate-900'}`}>{gameId === 'queens' && v ? '♛' : gameId === 'tango' ? ['○', '△', '□', '◇'][v] : ''}</button>)}</div> : <div className="flex flex-wrap justify-center gap-2 py-4">{Array.from({ length: 12 }, (_, i) => <button key={i} onClick={() => { setCells(c => c.map((v, n) => n === i ? v + 1 : v)); setMoves(m => m + 1); }} className="h-14 w-14 rounded-xl border border-slate-600 bg-slate-800 text-lg text-white hover:border-emerald-400">{gameId === 'water-pipes' ? ['┌', '┐', '└', '┘'][cells[i] % 4] : gameId === 'parking-lot' ? (i === 5 ? '🚗' : i % 3 === 0 ? '🚙' : '·') : gameId === 'sliding-maze' ? (i === 11 ? '🏁' : cells[i] ? '🟦' : '·') : i === 0 ? '▶' : i === 11 ? '🏁' : '•'}</button>)}</div>}
    {['water-jug', 'lucky-draw', 'pinecone-battle', 'escape-room', 'paradox-garden', 'skyscraper', 'kakuro', 'killer-sudoku', 'number-grid', 'shikaku', 'one-stroke', 'nonogram', 'queens', 'tango', 'hashi', 'logic-fill'].includes(gameId) && <div className="flex w-full max-w-sm gap-2"><input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkText()} placeholder={gameId === 'lucky-draw' ? '输入概率，如 50%' : '输入答案'} className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"/><button onClick={checkText} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white">检查</button></div>}
    <p aria-live="polite" className="min-h-6 text-sm text-amber-300">{message}</p>
    <button onClick={() => { setCells(Array(25).fill(0)); setAnswer(''); setMessage('已重置棋盘'); setMoves(0); setTubes([[0,0,1,1],[2,2,3,3],[],[]]); setSelected(null); }} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200">重置</button>
  </section>;
}
