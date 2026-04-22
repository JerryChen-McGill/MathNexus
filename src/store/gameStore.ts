import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameInfo, SkillNode } from '@/data/games';
import { games as defaultGames, skillNodes as defaultSkillNodes } from '@/data/games';

interface LevelProgress {
  completed: boolean;
  bestScore: number;
  bestTime: number;
  stars: number;
  attempts: number;
}

interface GameProgress {
  highestLevel: number;
  levels: Record<string, LevelProgress>;
}

interface PlayerStats {
  totalGamesPlayed: number;
  totalTimePlayed: number;
  totalWins: number;
  totalLosses: number;
  streakDays: number;
  lastPlayDate: string;
}

interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}

interface GameState {
  playerName: string;
  totalScore: number;
  skillPoints: number;
  totalSkillPointsEarned: number;
  games: GameInfo[];
  skillNodes: SkillNode[];
  gameProgress: Record<string, GameProgress>;
  stats: PlayerStats;
  settings: GameSettings;
  currentGame: string | null;
  currentLevel: number;

  // Actions
  setPlayerName: (name: string) => void;
  startGame: (gameId: string, level: number) => void;
  completeLevel: (gameId: string, level: number, score: number, time: number, stars: number) => void;
  failLevel: (gameId: string, level: number) => void;
  unlockSkill: (skillId: string) => void;
  upgradeSkill: (skillId: string) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  resetProgress: () => void;
  getGameProgress: (gameId: string) => GameProgress | undefined;
  getLevelProgress: (gameId: string, level: number) => LevelProgress | undefined;
  calculateScore: (baseScore: number, timeLeft: number, stars: number, difficulty: string) => number;
}

const defaultProgress: Record<string, GameProgress> = {};
defaultGames.forEach(g => {
  defaultProgress[g.id] = {
    highestLevel: 1,
    levels: {},
  };
});

const defaultStats: PlayerStats = {
  totalGamesPlayed: 0,
  totalTimePlayed: 0,
  totalWins: 0,
  totalLosses: 0,
  streakDays: 0,
  lastPlayDate: '',
};

const defaultSettings: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  difficulty: 'normal',
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerName: '数学探险家',
      totalScore: 0,
      skillPoints: 0,
      totalSkillPointsEarned: 0,
      games: defaultGames,
      skillNodes: defaultSkillNodes,
      gameProgress: defaultProgress,
      stats: defaultStats,
      settings: defaultSettings,
      currentGame: null,
      currentLevel: 1,

      setPlayerName: (name) => set({ playerName: name }),

      startGame: (gameId, level) => set({
        currentGame: gameId,
        currentLevel: level,
        stats: {
          ...get().stats,
          totalGamesPlayed: get().stats.totalGamesPlayed + 1,
        },
      }),

      completeLevel: (gameId, level, score, time, stars) => {
        const state = get();
        const progress = { ...state.gameProgress };
        const gameProg = progress[gameId] || { highestLevel: 1, levels: {} };
        const levelKey = `level-${level}`;
        const existing = gameProg.levels[levelKey];

        const newLevelProgress: LevelProgress = {
          completed: true,
          bestScore: existing ? Math.max(existing.bestScore, score) : score,
          bestTime: existing ? (existing.bestTime === 0 ? time : Math.min(existing.bestTime, time)) : time,
          stars: existing ? Math.max(existing.stars, stars) : stars,
          attempts: existing ? existing.attempts + 1 : 1,
        };

        gameProg.levels[levelKey] = newLevelProgress;
        gameProg.highestLevel = Math.max(gameProg.highestLevel, level + 1);
        progress[gameId] = gameProg;

        // Calculate skill points earned
        const skillPointsEarned = stars * 10 + Math.floor(score / 100);

        // Unlock related skills
        const game = state.games.find(g => g.id === gameId);
        const newSkillNodes = state.skillNodes.map(node => {
          if (game?.skills.includes(node.id) && !node.unlocked) {
            return { ...node, unlockable: true };
          }
          return node;
        });

        // Update game stats
        const newGames = state.games.map(g => {
          if (g.id === gameId) {
            const completedLevels = Object.values(gameProg.levels).filter(l => l.completed).length;
            const totalStars = Object.values(gameProg.levels).reduce((sum, l) => sum + l.stars, 0);
            return {
              ...g,
              completedLevels,
              totalStars,
              unlockedLevel: gameProg.highestLevel,
            };
          }
          return g;
        });

        set({
          gameProgress: progress,
          totalScore: state.totalScore + score,
          skillPoints: state.skillPoints + skillPointsEarned,
          totalSkillPointsEarned: state.totalSkillPointsEarned + skillPointsEarned,
          skillNodes: newSkillNodes,
          games: newGames,
          stats: {
            ...state.stats,
            totalWins: state.stats.totalWins + 1,
            totalTimePlayed: state.stats.totalTimePlayed + time,
            lastPlayDate: new Date().toISOString().split('T')[0],
          },
        });
      },

      failLevel: (gameId, level) => {
        const state = get();
        const progress = { ...state.gameProgress };
        const gameProg = progress[gameId] || { highestLevel: 1, levels: {} };
        const levelKey = `level-${level}`;
        const existing = gameProg.levels[levelKey];

        gameProg.levels[levelKey] = {
          completed: existing?.completed || false,
          bestScore: existing?.bestScore || 0,
          bestTime: existing?.bestTime || 0,
          stars: existing?.stars || 0,
          attempts: (existing?.attempts || 0) + 1,
        };
        progress[gameId] = gameProg;

        set({
          gameProgress: progress,
          stats: {
            ...state.stats,
            totalLosses: state.stats.totalLosses + 1,
            lastPlayDate: new Date().toISOString().split('T')[0],
          },
        });
      },

      unlockSkill: (skillId) => {
        const state = get();
        const node = state.skillNodes.find(n => n.id === skillId);
        if (!node || node.unlocked || !node.unlockable || state.skillPoints < node.cost) return;

        const newSkillNodes = state.skillNodes.map(n => {
          if (n.id === skillId) {
            return { ...n, unlocked: true, level: 1 };
          }
          // Check if children should become unlockable
          if (n.parentIds.includes(skillId)) {
            const allParentsUnlocked = n.parentIds.every(pid =>
              state.skillNodes.find(sn => sn.id === pid)?.unlocked
            );
            if (allParentsUnlocked) {
              return { ...n, unlockable: true };
            }
          }
          return n;
        });

        set({
          skillNodes: newSkillNodes,
          skillPoints: state.skillPoints - node.cost,
        });
      },

      upgradeSkill: (skillId) => {
        const state = get();
        const node = state.skillNodes.find(n => n.id === skillId);
        if (!node || !node.unlocked || node.level >= node.maxLevel) return;

        const cost = node.cost + node.level;
        if (state.skillPoints < cost) return;

        const newSkillNodes = state.skillNodes.map(n =>
          n.id === skillId ? { ...n, level: n.level + 1 } : n
        );

        set({
          skillNodes: newSkillNodes,
          skillPoints: state.skillPoints - cost,
        });
      },

      updateSettings: (newSettings) => set({
        settings: { ...get().settings, ...newSettings },
      }),

      resetProgress: () => set({
        totalScore: 0,
        skillPoints: 0,
        totalSkillPointsEarned: 0,
        gameProgress: defaultProgress,
        stats: defaultStats,
        skillNodes: defaultSkillNodes,
        games: defaultGames,
      }),

      getGameProgress: (gameId) => get().gameProgress[gameId],

      getLevelProgress: (gameId, level) => {
        const prog = get().gameProgress[gameId];
        return prog?.levels[`level-${level}`];
      },

      calculateScore: (baseScore, timeLeft, stars, difficulty) => {
        const diffMultiplier = difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 1.3 : 1;
        const starMultiplier = stars === 3 ? 2 : stars === 2 ? 1.5 : 1;
        return Math.floor((baseScore + timeLeft * 10) * starMultiplier * diffMultiplier);
      },
    }),
    {
      name: 'mathnexus-save',
      version: 1,
    }
  )
);
