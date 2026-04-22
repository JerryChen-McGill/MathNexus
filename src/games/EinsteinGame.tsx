import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

interface Clue {
  text: string;
  used: boolean;
}

export default function EinsteinGame({ level, config, onComplete, onFail }: Props) {
  const { clues = 5, timeLimit = 0 } = config.params;
  const [, setGrid] = useState<string[][]>([]);
  const [clueList, setClueList] = useState<Clue[]>([]);
  const [_selectedCell] = useState<[number, number] | null>(null);
  void _selectedCell;
  const [marks, setMarks] = useState<Record<string, 'x' | 'o' | ''>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  const attrs = ['颜色', '国籍', '饮料', '烟', '宠物'];
  const vals = [
    ['红', '绿', '白', '黄', '蓝'],
    ['英', '瑞', '丹', '德', '挪'],
    ['茶', '咖', '奶', '啤', '水'],
    ['宝', '本', '登', '布', '混合'],
    ['狗', '鸟', '猫', '马', '鱼'],
  ];

  useEffect(() => {
    const c = Array.from({ length: clues }, (_, i) => ({
      text: `线索 ${i + 1}: ${getClueText(i)}`,
      used: false,
    }));
    setClueList(c);
    setGrid(vals);
    setMarks({});
    setTimeLeft(timeLimit);
  }, [level, clues]);

  useEffect(() => {
    if (timeLimit <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); onFail('时间耗尽'); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit, onFail]);

  function getClueText(i: number): string {
    const texts = [
      '英国人住红房子',
      '瑞典人养狗',
      '丹麦人喝茶',
      '绿房子在白房子左边',
      '绿房子主人喝咖啡',
      '抽Pall Mall的人养鸟',
      '黄房子主人抽Dunhill',
      '中间房子的人喝牛奶',
      '挪威人住第一间',
      '抽Blends的人住在养猫的人隔壁',
      '养马的人住在抽Dunhill的人隔壁',
      '抽Blue Master的人喝啤酒',
      '德国人抽Prince',
      '挪威人住蓝房子隔壁',
      '抽Blends的人有一个喝水的邻居',
    ];
    return texts[i % texts.length];
  }

  const handleCellClick = (row: number, col: number) => {
    const key = `${row}-${col}`;
    const current = marks[key] || '';
    const next = current === '' ? 'x' : current === 'x' ? 'o' : '';
    setMarks(prev => ({ ...prev, [key]: next }));
  };

  const handleSubmit = () => {
    const oCount = Object.values(marks).filter(v => v === 'o').length;
    if (oCount >= clues) {
      const score = 500 + oCount * 50;
      const stars = oCount >= clues * 0.8 ? 3 : 2;
      onComplete(score, stars);
    } else {
      onFail('推理不够完整');
    }
  };

  return (
    <div className="flex flex-col items-center h-full max-w-2xl mx-auto">
      {timeLimit > 0 && <div className="text-sm text-[var(--black-6)] mb-2">剩余: <span className="font-mono-data text-[var(--accent)]">{timeLeft}s</span></div>}

      <div className="text-sm text-[var(--black-6)] mb-4">点击单元格标记 ✓ / ✗，根据线索推理出正确组合</div>

      {/* Grid */}
      <div className="w-full overflow-auto mb-4">
        <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(5, 1fr)` }}>
          <div className="text-xs text-[var(--black-6)] p-2"></div>
          {Array.from({ length: 5 }, (_, h) => (
            <div key={h} className="text-xs text-[var(--black-6)] text-center p-2">房屋{h + 1}</div>
          ))}

          {attrs.map((attr, ri) => (
            <div key={ri} className="contents">
              <div className="text-xs text-[var(--accent)] p-2 font-medium">{attr}</div>
              {vals[ri].map((val, ci) => (
                <button
                  key={ci}
                  onClick={() => handleCellClick(ri, ci)}
                  className={`p-2 rounded text-xs text-center transition-all border ${
                    marks[`${ri}-${ci}`] === 'o'
                      ? 'bg-[var(--success)]/20 border-[var(--success)] text-[var(--success)]'
                      : marks[`${ri}-${ci}`] === 'x'
                      ? 'bg-[var(--danger)]/10 border-[var(--danger)]/30 text-[var(--danger)]'
                      : 'bg-[var(--black-2)] border-[var(--black-3)] text-[var(--black-5)] hover:border-[var(--black-4)]'
                  }`}
                >
                  {val}
                  {marks[`${ri}-${ci}`] === 'o' && ' ✓'}
                  {marks[`${ri}-${ci}`] === 'x' && ' ✗'}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Clues */}
      <div className="w-full mb-4">
        <h4 className="text-sm text-[var(--black-6)] mb-2">线索</h4>
        <div className="space-y-1">
          {clueList.map((clue, i) => (
            <button
              key={i}
              onClick={() => {
                const newClues = [...clueList];
                newClues[i].used = !newClues[i].used;
                setClueList(newClues);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                clue.used ? 'bg-[var(--accent)]/10 text-[var(--accent)] line-through' : 'bg-[var(--black-2)] text-[var(--black-5)] hover:bg-[var(--black-3)]'
              }`}
            >
              {clue.text}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSubmit} className="px-8 py-3 bg-[var(--accent)] rounded-lg text-white font-medium hover:bg-[var(--accent-dark)] transition-all">
        提交答案
      </button>
    </div>
  );
}
