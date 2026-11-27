import { useState } from 'react';
import { useGameClock } from '@/hooks/use-game-clock';

type Props = {
  gameId?: string;
  level: number;
  config: { params: Record<string, number | string | boolean> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
};

const names: Record<string, string> = {
  'water-pipes': '水管工大冒险', shikaku: '数方 Shikaku', skyscraper: '摩天楼谜题', nonogram: '数织像素拼图',
  'killer-sudoku': '杀手数独', kakuro: '数和 Kakuro', hashi: '数桥解谜', 'parking-lot': '停车场规划游戏',
  'water-sort': '彩色倒水大师', 'sliding-maze': '滑行迷宫', queens: '皇后谜题', 'water-jug': '量杯大师',
  'one-stroke': '一笔画大师', 'paradox-garden': '悖论花园', 'escape-room': '密室逃脱', tango: '符号逻辑 Tango',
  'lucky-draw': '幸运摸球摊', 'pinecone-battle': '松果争夺战', 'logic-fill': '推理填格', 'puzzle-challenge': '拼图挑战',
};

const patterns = ['00100', '01110', '11111', '01110', '00100'];
const nonogramHints = Array.from({ length: 5 }, (_, column) => {
  const runs: number[] = [];
  let run = 0;
  for (const row of patterns) {
    if (row[column] === '1') run++;
    else if (run) { runs.push(run); run = 0; }
  }
  if (run) runs.push(run);
  return runs;
});
const latin = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]];
const palettes = ['#fb7185', '#38bdf8', '#facc15'];

/** Standalone playable versions of the smaller puzzle families. */
export default function PuzzlePackGame({ gameId = '', level, onComplete, onFail }: Props) {
  const { setTimeout } = useGameClock();
  const [cells, setCells] = useState<number[]>(Array(25).fill(0));
  const [values, setValues] = useState<number[]>(Array(16).fill(0));
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [moves, setMoves] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [tubes, setTubes] = useState<number[][]>([[0, 1, 0, 1], [1, 0, 1, 0], [], []]);
  const [water, setWater] = useState([0, 0]);
  const [stones, setStones] = useState(7);
  const [turn, setTurn] = useState<'you' | 'cpu'>('you');
  const [player, setPlayer] = useState(0);
  const [path, setPath] = useState<number[]>([0]);
  const [bridges, setBridges] = useState<Record<string, number>>({});
  const [board, setBoard] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15]);
  const [carsMoved, setCarsMoved] = useState(0);
  const finish = () => onComplete(Math.max(100, 700 - moves * 12), moves < 8 ? 3 : moves < 18 ? 2 : 1);
  const move = () => setMoves(n => n + 1);
  const say = (text: string) => setMessage(text);
  const setCell = (i: number, value: number) => setCells(prev => prev.map((v, n) => n === i ? value : v));
  const toggle = (i: number) => { setCell(i, (cells[i] + 1) % 2); move(); };
  const title = names[gameId] || '益智挑战';
  const restart = () => {
    setCells(Array(25).fill(0)); setValues(Array(16).fill(0)); setAnswer(''); setMessage(''); setMoves(0);
    setSelected(null); setTubes([[0, 1, 0, 1], [1, 0, 1, 0], [], []]); setWater([0, 0]); setStones(7);
    setTurn('you'); setPlayer(0); setPath([0]); setBridges({}); setCarsMoved(0);
    setBoard([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15]);
  };
  const check = () => {
    const text = answer.trim().toLowerCase().replace(/\s/g, '');
    let ok = false;
    if (gameId === 'water-jug') ok = water.includes(4);
    else if (gameId === 'lucky-draw') ok = ['50%', '50', '1/2', '0.5'].includes(text);
    else if (gameId === 'escape-room') ok = text === '2413';
    else if (gameId === 'paradox-garden') ok = text === '2,4' || text === '2、4' || text === '24';
    else if (gameId === 'pinecone-battle') ok = stones === 0;
    else if (gameId === 'nonogram') ok = patterns.every((row, r) => [...row].every((v, c) => cells[r * 5 + c] === Number(v)));
    else if (gameId === 'queens') {
      const qs = cells.map((v, i) => v ? i : -1).filter(i => i >= 0);
      ok = qs.length === 5 && new Set(qs.map(i => Math.floor(i / 5))).size === 5 && new Set(qs.map(i => i % 5)).size === 5 && new Set(qs.map(i => Math.floor(i / 5) - i % 5)).size === 5 && new Set(qs.map(i => Math.floor(i / 5) + i % 5)).size === 5;
    } else if (gameId === 'skyscraper' || gameId === 'tango' || gameId === 'logic-fill' || gameId === 'killer-sudoku' || gameId === 'kakuro') {
      ok = latin.every((row, r) => row.every((v, c) => values[r * 4 + c] === v));
    } else if (gameId === 'shikaku') ok = cells.slice(0, 10).every(v => v === 1) && cells.slice(10).every(v => !v);
    else if (gameId === 'one-stroke') ok = path.length >= 7 && path.at(-1) === 6;
    else if (gameId === 'water-pipes') ok = cells[0] === 1 && cells[1] === 1 && cells[2] === 1 && cells[3] === 1;
    else if (gameId === 'hashi') ok = Object.values(bridges).reduce((a, b) => a + b, 0) >= 4;
    else if (gameId === 'parking-lot') ok = carsMoved >= 2;
    else if (gameId === 'sliding-maze') ok = player === 24;
    else if (gameId === 'puzzle-challenge') ok = board.every((v, i) => v === (i === 15 ? 0 : i + 1));
    else if (gameId === 'water-sort') ok = tubes.slice(0, 2).every(t => t.length === 4 && t.every(v => v === t[0]));
    if (ok) finish(); else say('还没完成，再检查一次线索或规则。');
  };
  const pour = (to: number) => {
    if (selected === null) { if (tubes[to].length) setSelected(to); return; }
    if (selected === to) { setSelected(null); return; }
    const next = tubes.map(t => [...t]); const src = next[selected]; const dst = next[to];
    if (src.length && dst.length < 4 && (!dst.length || dst.at(-1) === src.at(-1))) {
      dst.push(src.pop()!); setTubes(next); move();
      if (next.slice(0, 2).every(t => t.length === 4 && t.every(v => v === t[0]))) finish();
    }
    setSelected(null);
  };
  const playStone = (n: number) => {
    if (turn !== 'you' || n > stones) return;
    const left = stones - n; setStones(left); move();
    if (!left) { finish(); return; }
    setTurn('cpu'); const take = left % 4 || Math.min(3, left); const rest = left - take;
    setTimeout(() => {
      setStones(rest); setTurn('you');
      if (!rest) onFail('电脑拿走了最后一颗松果。重新开局，试着每轮合计取走 4 颗。');
    }, 450);
  };
  const jugAction = (action: 'fill5' | 'fill3' | 'empty5' | 'empty3' | 'pour53' | 'pour35') => {
    const next = [...water];
    if (action === 'fill5') next[0] = 5;
    if (action === 'fill3') next[1] = 3;
    if (action === 'empty5') next[0] = 0;
    if (action === 'empty3') next[1] = 0;
    if (action === 'pour53' || action === 'pour35') {
      const from = action === 'pour53' ? 0 : 1, to = 1 - from, capacity = to === 0 ? 5 : 3;
      const amount = Math.min(next[from], capacity - next[to]); next[from] -= amount; next[to] += amount;
    }
    setWater(next); move(); if (next.includes(4)) finish();
  };
  const moveTile = (i: number) => {
    const blank = board.indexOf(0); if (Math.abs(Math.floor(i / 4) - Math.floor(blank / 4)) + Math.abs(i % 4 - blank % 4) !== 1) return;
    const next = [...board]; [next[i], next[blank]] = [next[blank], next[i]]; setBoard(next); move();
    if (next.every((v, n) => v === (n === 15 ? 0 : n + 1))) finish();
  };
  const moveMaze = (i: number) => {
    const blocked = [6, 7, 12, 17, 18]; if (blocked.includes(i)) return;
    if (Math.abs(Math.floor(i / 5) - Math.floor(player / 5)) + Math.abs(i % 5 - player % 5) !== 1) return;
    setPlayer(i); move(); if (i === 24) finish();
  };

  return <section className="mx-auto flex h-full max-w-xl flex-col items-center gap-3 overflow-auto p-4 text-center text-white">
    <div className="text-3xl" aria-hidden="true">🧩</div><h2 className="text-xl font-bold">{title} · 第 {level} 关</h2>
    <p className="max-w-md text-sm text-[var(--black-6)]">{descriptions[gameId] || '观察规则，操作棋盘并检查答案。'} <span className="whitespace-nowrap">步数 {moves}</span></p>

    {gameId === 'water-sort' && <div className="flex gap-3 py-4">{tubes.map((tube, i) => <button key={i} onClick={() => pour(i)} aria-label={`颜色管 ${i + 1}`} className={`flex h-40 w-14 flex-col-reverse overflow-hidden rounded-b-2xl border-2 p-1 ${selected === i ? 'border-yellow-300' : 'border-slate-400'}`}>{tube.map((c, j) => <span key={j} className="h-8 w-full rounded-sm" style={{ background: palettes[c] ?? palettes[0] }} />)}</button>)}</div>}
    {gameId === 'water-jug' && <><div className="flex items-end gap-4 py-4">{water.map((n, i) => <div key={i} className="flex flex-col items-center gap-2"><span>{n} / {i === 0 ? 5 : 3} L</span><div className="flex h-36 w-20 items-end overflow-hidden rounded-b-xl border-2 border-sky-300"><div className="w-full bg-sky-500/80" style={{ height: `${n / (i === 0 ? 5 : 3) * 100}%` }}/></div></div>)}</div><div className="grid grid-cols-3 gap-2">{[['fill5','装满 5L'],['fill3','装满 3L'],['pour53','5L 倒入 3L'],['pour35','3L 倒入 5L'],['empty5','倒空 5L'],['empty3','倒空 3L']].map(([a,l]) => <button key={a} onClick={() => jugAction(a as Parameters<typeof jugAction>[0])} className="rounded-lg border border-slate-600 px-2 py-2">{l}</button>)}</div></>}
    {gameId === 'lucky-draw' && <div className="flex gap-3 py-4">{['25%','50%','75%'].map(v => <button key={v} onClick={() => setAnswer(v)} className={`rounded-xl border px-5 py-4 text-xl ${answer === v ? 'border-emerald-400 bg-emerald-700' : 'border-slate-600 bg-slate-800'}`}>{v}</button>)}</div>}
    {gameId === 'pinecone-battle' && <><p className="text-2xl">🌰 {stones} 颗松果</p><div className="flex gap-3">{[1,2,3].map(n => <button key={n} onClick={() => playStone(n)} disabled={turn !== 'you' || n > stones} className="rounded-lg bg-amber-700 px-5 py-3 disabled:opacity-40">拿 {n} 颗</button>)}</div><p>{turn === 'you' ? '轮到你' : '电脑思考中…'}</p></>}
    {gameId === 'nonogram' && <><div className="mb-1 grid grid-cols-5 gap-1 text-xs text-slate-300">{nonogramHints.map((h,c) => <span key={c}>{h.join(' ') || '—'}</span>)}</div><div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-700 p-2">{cells.map((v,i) => <button key={i} onClick={() => toggle(i)} aria-label={`第${Math.floor(i/5)+1}行第${i%5+1}列`} className={`h-11 w-11 rounded-md border ${v ? 'border-sky-300 bg-sky-500' : 'border-slate-500 bg-slate-900'}`}/>)}</div><p className="text-xs text-slate-300">每行提示（从上到下）：1、3、5、3、1</p></>}
    {gameId === 'queens' && <><p>每行放一枚皇后，列与两条斜线都不能冲突。</p><div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-700 p-2">{cells.map((v,i) => <button key={i} onClick={() => toggle(i)} aria-label={`第${Math.floor(i/5)+1}行第${i%5+1}列`} className={`h-11 w-11 rounded-md border ${v ? 'border-yellow-300 bg-yellow-700 text-xl' : 'border-slate-500 bg-slate-900'}`}>{v ? '♛' : ''}</button>)}</div></>}
    {['skyscraper','tango','logic-fill','killer-sudoku','kakuro'].includes(gameId) && <><p>点击格子循环填写数字；完成每行与每列后检查。示范盘使用 1–4 不重复。</p><div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-700 p-2">{values.map((v,i) => <button key={i} onClick={() => { setValues(prev => prev.map((x,n) => n === i ? x % 4 + 1 : x)); move(); }} aria-label={`第${Math.floor(i/4)+1}行第${i%4+1}列，${v || '空'}`} className="h-12 w-12 rounded-md border border-slate-500 bg-slate-900 text-lg">{gameId === 'tango' && v ? ['','○','△','□','◇'][v] : v || '·'}</button>)}</div></>}
    {gameId === 'shikaku' && <><p>把左侧数字所在的 2×5 矩形完整涂满；每格只能属于一个矩形。</p><div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-700 p-2">{cells.map((v,i) => <button key={i} onClick={() => toggle(i)} aria-label={`第${Math.floor(i/5)+1}行第${i%5+1}列`} className={`h-12 w-12 rounded-md border ${v ? 'border-emerald-300 bg-emerald-600' : 'border-slate-500 bg-slate-900'}`}>{i === 0 ? '10' : ''}</button>)}</div></>}
    {gameId === 'water-pipes' && <><p>旋转管道，让水从左侧水源沿直线抵达右侧出口。</p><div className="flex items-center gap-1 text-2xl"><span>💧</span>{[0,1,2,3].map(i => <button key={i} onClick={() => { setCell(i, ((cells[i] ?? 0) + 1) % 2); move(); }} className="h-14 w-14 rounded-lg border border-slate-600 bg-slate-800">{['└','─'][(cells[i] ?? 0) % 2]}</button>)}<span>🏁</span></div></>}
    {gameId === 'hashi' && <><p>连接相邻岛屿，每对岛间最多两座桥；总数需满足岛上的数字。</p><div className="flex gap-3">{[2,2,2,2].map((n,i) => <button key={i} onClick={() => { const k = `${i}-${(i+1)%4}`; setBridges(b => ({...b,[k]:((b[k]||0)+1)%3})); move(); }} className="rounded-full border-2 border-amber-300 bg-amber-800 px-4 py-3">{n} {bridges[`${i}-${(i+1)%4}`] ? '—'.repeat(bridges[`${i}-${(i+1)%4}`]) : '·'}</button>)}</div></>}
    {gameId === 'one-stroke' && <><p>从 1 开始，沿相邻点走到 7，不可重复经过点。</p><div className="grid grid-cols-4 gap-2">{Array.from({length:8},(_,i)=><button key={i} onClick={()=>{ if(i===(path.at(-1) ?? 0)+1){const p=[...path,i];setPath(p);move();if(i===6)finish();}else say('沿相连的下一个点继续。'); }} className={`h-12 w-12 rounded-full border ${path.includes(i)?'border-emerald-300 bg-emerald-700':'border-slate-500 bg-slate-800'}`}>{i+1}</button>)}</div></>}
    {gameId === 'sliding-maze' && <><p>从左上角走到右下角，深色格是墙。</p><div className="grid grid-cols-5 gap-1">{Array.from({length:25},(_,i)=><button key={i} onClick={()=>moveMaze(i)} aria-label={`迷宫第${Math.floor(i/5)+1}行第${i%5+1}列`} className={`h-10 w-10 rounded ${player===i?'bg-emerald-500':[6,7,12,17,18].includes(i)?'bg-slate-950':'bg-slate-700'}`}>{player===i?'●':i===24?'⚑':''}</button>)}</div><div className="grid grid-cols-3 gap-1">{[['↑',-5],['←',-1],['↓',5],['→',1]].map(([label,d])=><button key={String(label)} onClick={()=>moveMaze(player+Number(d))} className="rounded border border-slate-600 px-4 py-2">{label}</button>)}</div></>}
    {gameId === 'puzzle-challenge' && <><p>点击空格旁的数字，按 1 到 15 排列。</p><div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-700 p-2">{board.map((v,i)=><button key={i} onClick={()=>moveTile(i)} className={`h-12 w-12 rounded-lg ${v?'bg-indigo-600':'bg-slate-900'}`}>{v||''}</button>)}</div></>}
    {gameId === 'water-sort' && null}
    {gameId === 'parking-lot' && <><p>先把挡住出口的两辆车向上移开，再让红车驶出。</p><div className="grid grid-cols-3 gap-2">{[0,1].map(i=><button key={i} disabled={carsMoved>i} onClick={()=>{setCarsMoved(n=>n+1);move();say('挡路车辆已移开。');}} className="h-14 rounded-lg border border-slate-600 bg-slate-800 disabled:opacity-40">{carsMoved>i?'✓ 🚙':'🚙 ↑'}</button>)}<span className="flex items-center justify-center text-2xl">🚪</span></div><button disabled={carsMoved<2} onClick={()=>{move();finish();}} className="rounded-lg bg-emerald-700 px-4 py-2 disabled:opacity-40">🚗 目标车驶出 →</button></>}
    {gameId === 'water-sort' && <p>每次移动一颗顶层球；只可倒入空管或同色球上方。整理成两支单色管。</p>}
    {gameId === 'water-jug' && <p>目标：量出 4 升。</p>}
    {gameId === 'lucky-draw' && <><p>袋里有 5 个红球和 5 个蓝球，随机摸 1 个红球的概率是多少？</p><button onClick={check} className="rounded-lg bg-emerald-700 px-4 py-2">确认概率</button></>}
    {gameId === 'escape-room' && <><p>密码线索：门牌是 2；房间里有 4 面镜子；桌上有 1 本书和 3 支笔。依次输入门牌、镜子、书、笔数量。</p><input aria-label="房间密码" value={answer} onChange={e=>setAnswer(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"/><button onClick={check} className="ml-2 rounded-lg bg-emerald-700 px-4 py-2">输入密码</button></>}
    {gameId === 'paradox-garden' && <><p>花朵编号 1–6。选出的两朵花之和为 6，且编号都是偶数。输入编号。</p><input aria-label="花朵编号" value={answer} onChange={e=>setAnswer(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"/><button onClick={check} className="ml-2 rounded-lg bg-emerald-700 px-4 py-2">检查</button></>}
    {gameId === 'shikaku' && <button onClick={check} className="rounded-lg bg-emerald-700 px-4 py-2">检查矩形</button>}
    {gameId === 'nonogram' && <button onClick={check} className="rounded-lg bg-emerald-700 px-4 py-2">检查图案</button>}
    {gameId === 'queens' && <button onClick={check} className="rounded-lg bg-emerald-700 px-4 py-2">检查皇后位置</button>}
    {['skyscraper','tango','logic-fill','killer-sudoku','kakuro'].includes(gameId) && <button onClick={check} className="rounded-lg bg-emerald-700 px-4 py-2">检查棋盘</button>}
    {['water-pipes','hashi','one-stroke','sliding-maze','puzzle-challenge'].includes(gameId) && <button onClick={check} className="rounded-lg bg-emerald-700 px-4 py-2">检查完成状态</button>}
    {gameId === 'pinecone-battle' && <p className="text-xs text-slate-300">策略提示：每次取 1–3 颗；把剩余数量留成 4 的倍数，轮到对手时更有优势。</p>}
    <p aria-live="polite" className="min-h-6 text-sm text-amber-300">{message}</p>
    <button onClick={restart} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200">重新开始</button>
  </section>;
}

const descriptions: Record<string, string> = {
  'water-pipes': '旋转管道连接水源与出口。', shikaku: '点击格子涂色，按数字面积覆盖矩形。',
  skyscraper: '每行每列填写不同楼层高度。', nonogram: '根据行列提示填格，还原隐藏图案。',
  'killer-sudoku': '数独规则加上虚线框求和提示。', kakuro: '填数使每段连续格的和符合提示。',
  hashi: '点击相邻岛屿添加桥梁。', 'parking-lot': '移动车辆，为目标车打开出口。',
  'water-sort': '将颜色整理到各自的单色管中。', 'sliding-maze': '在迷宫通道中找到出口路线。',
  queens: '每行每列放一枚皇后，互不攻击。', 'water-jug': '用 5 升和 3 升量杯量出 4 升。',
  'one-stroke': '沿连线从起点走到终点。', 'paradox-garden': '根据线索找出符合条件的花朵组合。',
  'escape-room': '解读线索并输入房间密码。', tango: '完成行列符号排列。',
  'lucky-draw': '分析摸到指定颜色球的概率。', 'pinecone-battle': '轮流拿取松果，想办法拿到最后一颗。',
  'logic-fill': '根据规则填入符合條件的数字。', 'puzzle-challenge': '移动数字滑块，按顺序还原棋盘。',
};
