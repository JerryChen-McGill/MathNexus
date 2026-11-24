import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search, Check } from 'lucide-react';
import { games } from '@/data/games';
import { programIcons } from '@/data/programs';
import { useGameStore } from '@/store/gameStore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function ProgramPicker({ gameId }: { gameId: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const selectProgram = useGameStore(s => s.selectProgram);
  const progress = useGameStore(s => s.gameProgress);
  const current = games.find(g => g.id === gameId)!;
  return <>
    <button className="program-picker" onClick={() => { setSearch(''); setOpen(true); }} aria-label={`切换 program，当前${current.name}`}>
      <span className="program-icon small">{programIcons[gameId]}</span><span>{current.name}</span><ChevronDown size={18} />
    </button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="program-dialog">
        <DialogTitle>换一种冒险</DialogTitle>
        <DialogDescription>每个 program 都有自己的路线，随时切换，进度一直在。</DialogDescription>
        <label className="search-field"><Search size={20}/><input aria-label="搜索 program" placeholder="搜索游戏" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <div className="program-options">
          {games.filter(g => `${g.name} ${g.categoryLabel}`.includes(search.trim())).map(game => <button key={game.id} className={`program-option ${gameId === game.id ? 'selected' : ''}`} onClick={() => {
            selectProgram(game.id); setOpen(false); navigate(`/program/${game.id}`);
          }}>
            <span className="program-icon small">{programIcons[game.id]}</span>
            <span><strong>{game.name}</strong><small>{Object.values(progress[game.id]?.levels ?? {}).some(l => l.completed) ? '继续你的旅程' : '开始新的冒险'}</small></span>
            {gameId === game.id && <Check size={20}/>}
          </button>)}
          {!games.some(g => `${g.name} ${g.categoryLabel}`.includes(search.trim())) && <p className="muted">没有找到，换个关键词试试。</p>}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
