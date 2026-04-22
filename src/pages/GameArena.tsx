import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { games, levelConfigs } from '@/data/games';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft, Pause, RotateCcw, Home, Star, Play, ChevronRight } from 'lucide-react';

// Game components
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

type GameState = 'ready' | 'playing' | 'paused' | 'level_complete' | 'game_over';

const gameComponents: Record<string, React.FC<any>> = {
  sudoku: SudokuGame,
  math24: Math24Game,
  'magic-square': MagicSquareGame,
  'sliding-puzzle': SlidingPuzzleGame,
  minesweeper: MinesweeperGame,
  'tic-tac-toe': TicTacToeGame,
  gomoku: GomokuGame,
  nim: NimGame,
  hanoi: HanoiGame,
  'number-bomb': NumberBombGame,
  'bash-game': BashGame,
  'number-race': NumberRaceGame,
  tangram: TangramGame,
  einstein: EinsteinGame,
  'river-crossing': RiverCrossingGame,
  'hundred-chicken': HundredChickenGame,
  'chicken-rabbit': ChickenRabbitGame,
  sunzi: SunziGame,
  konigsberg: KonigsbergGame,
  'number-pyramid': NumberPyramidGame,
};

export default function GameArena() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { completeLevel, failLevel, getGameProgress } = useGameStore();

  const game = games.find(g => g.id === gameId);
  const savedProgress = gameId ? getGameProgress(gameId) : undefined;

  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stars, setStars] = useState(0);
  const [failReason, setFailReason] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

  const levels = gameId ? levelConfigs[gameId] || [] : [];
  const currentConfig = levels[currentLevel - 1];

  useEffect(() => {
    if (gameId && savedProgress) {
      setCurrentLevel(savedProgress.highestLevel || 1);
    }
  }, [gameId, savedProgress]);

  useEffect(() => {
    let timer: number;
    if (gameState === 'playing') {
      timer = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  // Keyboard shortcut for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('paused');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const handleStart = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setElapsedTime(0);
    setStars(0);
  }, []);

  const handleComplete = useCallback((finalScore: number, finalStars: number) => {
    setScore(finalScore);
    setStars(finalStars);
    setGameState('level_complete');
    if (gameId) {
      completeLevel(gameId, currentLevel, finalScore, elapsedTime, finalStars);
    }
  }, [gameId, currentLevel, elapsedTime, completeLevel]);

  const handleFail = useCallback((reason: string) => {
    setFailReason(reason);
    setGameState('game_over');
    if (gameId) {
      failLevel(gameId, currentLevel);
    }
  }, [gameId, currentLevel, failLevel]);

  const handleNextLevel = useCallback(() => {
    if (currentLevel < levels.length) {
      setCurrentLevel(prev => prev + 1);
      setGameState('ready');
      setScore(0);
      setElapsedTime(0);
      setStars(0);
    } else {
      navigate('/games');
    }
  }, [currentLevel, levels.length, navigate]);

  const handleRestart = useCallback(() => {
    setGameState('ready');
    setScore(0);
    setElapsedTime(0);
    setStars(0);
  }, []);

  const handleSelectLevel = useCallback((level: number) => {
    const progress = gameId ? getGameProgress(gameId) : undefined;
    if (progress && level <= progress.highestLevel) {
      setCurrentLevel(level);
      setGameState('ready');
      setScore(0);
      setElapsedTime(0);
      setStars(0);
      setShowSidebar(false);
    }
  }, [gameId, getGameProgress]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!game || !gameId) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--black-6)] mb-4">游戏不存在</p>
          <button
            onClick={() => navigate('/games')}
            className="px-6 py-2 bg-[var(--accent)] rounded-lg text-white"
          >
            返回大厅
          </button>
        </div>
      </div>
    );
  }

  const GameComponent = gameComponents[gameId];
  const levelProgress = gameId ? getGameProgress(gameId)?.levels[`level-${currentLevel}`] : undefined;

  return (
    <div className="pt-14 min-h-screen flex flex-col">
      {/* Top Info Bar */}
      <div className="liquid-glass px-4 sm:px-6 h-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/games')}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} className="text-[var(--black-6)]" />
          </button>
          <span className="font-semibold text-white text-sm hidden sm:block">{game.name}</span>
          <span className="text-[var(--black-5)] text-xs font-mono-data">
            Lv.{currentLevel}/{levels.length}
          </span>
          {currentConfig && (
            <span className="text-[var(--black-6)] text-xs hidden md:block">{currentConfig.name}</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--black-6)]">⏱</span>
            <span className="font-mono-data text-sm text-white">{formatTime(elapsedTime)}</span>
          </div>

          {/* Score */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-xs text-[var(--black-6)]">得分</span>
            <span className="font-mono-data text-sm text-[var(--accent)]">{score}</span>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map(i => (
              <Star
                key={i}
                size={14}
                className={i <= stars ? 'text-[var(--gold)] fill-[var(--gold)]' : 'text-[var(--black-4)]'}
              />
            ))}
          </div>

          {/* Pause */}
          <button
            onClick={() => gameState === 'playing' && setGameState('paused')}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Pause size={18} className="text-[var(--black-6)]" />
          </button>

          {/* Level Select Toggle */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors md:hidden"
          >
            <span className="text-xs text-[var(--black-6)]">关卡</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Level List */}
        <aside
          className={`absolute md:relative z-30 w-56 h-full bg-[var(--black-2)] border-r border-[var(--black-3)] overflow-y-auto transition-transform duration-300 ${
            showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-white mb-4">关卡选择</h3>
            <div className="space-y-1.5">
              {levels.map((level, i) => {
                const levelNum = i + 1;
                const isUnlocked = savedProgress ? levelNum <= savedProgress.highestLevel : levelNum === 1;
                const isCurrent = levelNum === currentLevel;
                const prog = savedProgress?.levels[`level-${levelNum}`];

                return (
                  <button
                    key={levelNum}
                    onClick={() => isUnlocked && handleSelectLevel(levelNum)}
                    disabled={!isUnlocked}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                      isCurrent
                        ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30'
                        : isUnlocked
                        ? 'hover:bg-white/5 border border-transparent'
                        : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className={`font-mono-data text-xs ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--black-6)]'}`}>
                      {levelNum.toString().padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs truncate ${isCurrent ? 'text-white' : 'text-[var(--black-5)]'}`}>
                        {level.name}
                      </div>
                      {prog && (
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3].map(s => (
                            <Star
                              key={s}
                              size={8}
                              className={s <= prog.stars ? 'text-[var(--gold)] fill-[var(--gold)]' : 'text-[var(--black-4)]'}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {!isUnlocked && <span className="text-[var(--black-5)]">🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Game Area */}
        <main className="flex-1 relative overflow-auto">
          {/* Overlay for sidebar on mobile */}
          {showSidebar && (
            <div
              className="absolute inset-0 z-20 bg-black/50 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* READY state */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--black-1)]">
              <div className="liquid-glass rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                <div className="mb-2">
                  <span className="text-xs text-[var(--black-6)] font-mono-data">LEVEL {currentLevel}</span>
                </div>
                <h2 className="font-display text-2xl text-white mb-2">
                  {currentConfig?.name || '开始挑战'}
                </h2>
                <p className="text-sm text-[var(--black-6)] mb-6">
                  {game.description}
                </p>

                {/* Level params */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {currentConfig && Object.entries(currentConfig.params).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)] text-left">
                      <div className="text-[10px] text-[var(--black-6)] uppercase">{key}</div>
                      <div className="font-mono-data text-sm text-white">{value === 0 ? '无限制' : String(value)}</div>
                    </div>
                  ))}
                </div>

                {levelProgress && (
                  <div className="mb-6 p-3 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)]">
                    <div className="text-xs text-[var(--black-6)] mb-1">最佳记录</div>
                    <div className="flex items-center justify-center gap-4">
                      <div>
                        <span className="text-xs text-[var(--black-6)]">分数 </span>
                        <span className="font-mono-data text-sm text-[var(--accent)]">{levelProgress.bestScore}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map(s => (
                          <Star
                            key={s}
                            size={12}
                            className={s <= levelProgress.stars ? 'text-[var(--gold)] fill-[var(--gold)]' : 'text-[var(--black-4)]'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStart}
                  className="w-full px-8 py-3.5 bg-[var(--accent)] rounded-lg font-semibold text-white hover:bg-[var(--accent-dark)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  开始挑战
                </button>
              </div>
            </div>
          )}

          {/* PLAYING state */}
          {gameState === 'playing' && GameComponent && (
            <div className="w-full h-full p-4">
              <GameComponent
                level={currentLevel}
                config={currentConfig}
                onComplete={handleComplete}
                onFail={handleFail}
                elapsedTime={elapsedTime}
              />
            </div>
          )}

          {/* PAUSED state */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
              <div className="liquid-glass rounded-2xl p-8 max-w-sm w-full mx-4">
                <h2 className="font-display text-2xl text-white text-center mb-8">游戏暂停</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setGameState('playing')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] rounded-lg font-medium text-white hover:bg-[var(--accent-dark)] transition-all"
                  >
                    <Play size={18} />
                    继续游戏
                  </button>
                  <button
                    onClick={handleRestart}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--black-2)] border border-[var(--black-3)] rounded-lg font-medium text-[var(--black-5)] hover:text-white hover:border-[var(--black-4)] transition-all"
                  >
                    <RotateCcw size={18} />
                    重新开始
                  </button>
                  <button
                    onClick={() => navigate('/games')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--black-2)] border border-[var(--black-3)] rounded-lg font-medium text-[var(--black-5)] hover:text-white hover:border-[var(--black-4)] transition-all"
                  >
                    <Home size={18} />
                    返回大厅
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LEVEL COMPLETE state */}
          {gameState === 'level_complete' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
              <div className="liquid-glass rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                <h2 className="font-display text-3xl text-gradient-gold mb-2">关卡完成!</h2>
                <p className="text-sm text-[var(--black-6)] mb-6">{currentConfig?.name}</p>

                {/* Stars */}
                <div className="flex items-center justify-center gap-3 mb-8">
                  {[1, 2, 3].map(i => (
                    <Star
                      key={i}
                      size={36}
                      className={`transition-all duration-500 ${
                        i <= stars ? 'text-[var(--gold)] fill-[var(--gold)] scale-100' : 'text-[var(--black-4)] scale-75'
                      }`}
                      style={{ transitionDelay: `${i * 300}ms` }}
                    />
                  ))}
                </div>

                {/* Score breakdown */}
                <div className="space-y-2 mb-8 text-left p-4 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)]">
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--black-6)]">得分</span>
                    <span className="font-mono-data text-sm text-white">{score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--black-6)]">用时</span>
                    <span className="font-mono-data text-sm text-white">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--black-6)]">星级倍率</span>
                    <span className="font-mono-data text-sm text-[var(--gold)]">×{stars === 3 ? 2 : stars === 2 ? 1.5 : 1}</span>
                  </div>
                  <div className="border-t border-[var(--black-3)] pt-2 flex justify-between">
                    <span className="text-sm font-medium text-white">总分</span>
                    <span className="font-mono-data text-lg text-[var(--accent)]">{score}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {currentLevel < levels.length ? (
                    <button
                      onClick={handleNextLevel}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] rounded-lg font-medium text-white hover:bg-[var(--accent-dark)] transition-all"
                    >
                      下一关
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/games')}
                      className="flex-1 px-6 py-3 bg-[var(--gold)] rounded-lg font-medium text-black hover:bg-[var(--gold)]/90 transition-all"
                    >
                      全部通关!
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/games')}
                    className="px-6 py-3 bg-[var(--black-2)] border border-[var(--black-3)] rounded-lg font-medium text-[var(--black-5)] hover:text-white transition-all"
                  >
                    大厅
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GAME OVER state */}
          {gameState === 'game_over' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
              <div className="liquid-glass rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
                <h2 className="font-display text-2xl text-[var(--danger)] mb-2">挑战失败</h2>
                <p className="text-sm text-[var(--black-6)] mb-8">{failReason}</p>

                <div className="space-y-3">
                  <button
                    onClick={handleRestart}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] rounded-lg font-medium text-white hover:bg-[var(--accent-dark)] transition-all"
                  >
                    <RotateCcw size={18} />
                    再试一次
                  </button>
                  <button
                    onClick={() => navigate('/games')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--black-2)] border border-[var(--black-3)] rounded-lg font-medium text-[var(--black-5)] hover:text-white hover:border-[var(--black-4)] transition-all"
                  >
                    <Home size={18} />
                    返回大厅
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
