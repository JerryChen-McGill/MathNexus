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

const SKILL_LEVEL_GAME_REQUIREMENTS = [1, 3, 5, 7, 10] as const;
const SKILL_LEVEL_POINT_FACTORS = [1, 3, 6, 10, 15] as const;
const SKILL_POINT_REQUIREMENT_BASE = 20;

const createDefaultProgress = (): Record<string, GameProgress> => {
  const progress: Record<string, GameProgress> = {};
  defaultGames.forEach(g => {
    progress[g.id] = {
      highestLevel: 1,
      levels: {},
    };
  });
  return progress;
};

const getRequiredGameLevel = (skillLevel: number): number => (
  SKILL_LEVEL_GAME_REQUIREMENTS[
    Math.min(skillLevel - 1, SKILL_LEVEL_GAME_REQUIREMENTS.length - 1)
  ]
);

const getRequiredSkillPoints = (node: SkillNode, skillLevel: number): number => (
  node.cost
  * SKILL_POINT_REQUIREMENT_BASE
  * SKILL_LEVEL_POINT_FACTORS[
    Math.min(skillLevel - 1, SKILL_LEVEL_POINT_FACTORS.length - 1)
  ]
);

const getHighestCompletedLevelForNode = (
  node: SkillNode,
  gameProgress: Record<string, GameProgress>
): number => {
  if (node.gameIds.length === 0) return 0;

  return node.gameIds.reduce((highest, gameId) => {
    const unlockedLevel = gameProgress[gameId]?.highestLevel ?? 1;
    return Math.max(highest, Math.max(0, unlockedLevel - 1));
  }, 0);
};

const calculateAutoSkillNodes = (
  skillNodes: SkillNode[],
  gameProgress: Record<string, GameProgress>,
  totalSkillPointsEarned: number
): SkillNode[] => {
  const nextNodes = skillNodes.map(node => ({ ...node }));
  let hasChanges = true;

  while (hasChanges) {
    hasChanges = false;
    const nodeMap = new Map(nextNodes.map(node => [node.id, node]));

    for (let i = 0; i < nextNodes.length; i += 1) {
      const node = nextNodes[i];
      const parentsUnlocked = node.parentIds.every(
        parentId => (nodeMap.get(parentId)?.level ?? 0) > 0
      );
      const highestCompletedLevel = getHighestCompletedLevelForNode(node, gameProgress);

      let targetLevel = node.level;
      if (parentsUnlocked) {
        for (let nextLevel = node.level + 1; nextLevel <= node.maxLevel; nextLevel += 1) {
          const requiredGameLevel = getRequiredGameLevel(nextLevel);
          const requiredSkillPoints = getRequiredSkillPoints(node, nextLevel);

          if (
            highestCompletedLevel >= requiredGameLevel
            && totalSkillPointsEarned >= requiredSkillPoints
          ) {
            targetLevel = nextLevel;
          } else {
            break;
          }
        }
      }

      const unlocked = targetLevel > 0;
      const unlockable = parentsUnlocked;

      if (
        targetLevel !== node.level
        || unlocked !== node.unlocked
        || unlockable !== node.unlockable
      ) {
        nextNodes[i] = { ...node, level: targetLevel, unlocked, unlockable };
        hasChanges = true;
      }
    }
  }

  return nextNodes;
};

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
      games: defaultGames.map(game => ({ ...game })),
      skillNodes: defaultSkillNodes.map(node => ({ ...node })),
      gameProgress: createDefaultProgress(),
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
        const newTotalSkillPointsEarned = state.totalSkillPointsEarned + skillPointsEarned;
        const newSkillNodes = calculateAutoSkillNodes(
          state.skillNodes,
          progress,
          newTotalSkillPointsEarned
        );

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
          totalSkillPointsEarned: newTotalSkillPointsEarned,
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
        void skillId;
        const state = get();
        set({
          skillNodes: calculateAutoSkillNodes(
            state.skillNodes,
            state.gameProgress,
            state.totalSkillPointsEarned
          ),
        });
      },

      upgradeSkill: (skillId) => {
        void skillId;
        const state = get();

        set({
          skillNodes: calculateAutoSkillNodes(
            state.skillNodes,
            state.gameProgress,
            state.totalSkillPointsEarned
          ),
        });
      },

      updateSettings: (newSettings) => set({
        settings: { ...get().settings, ...newSettings },
      }),

      resetProgress: () => set({
        totalScore: 0,
        skillPoints: 0,
        totalSkillPointsEarned: 0,
        gameProgress: createDefaultProgress(),
        stats: defaultStats,
        skillNodes: defaultSkillNodes.map(node => ({ ...node })),
        games: defaultGames.map(game => ({ ...game })),
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
      version: 2,
      migrate: (persistedState) => {
        const savedState = persistedState as Partial<GameState> | undefined;
        if (!savedState) return persistedState;

        const savedProgress = savedState.gameProgress ?? createDefaultProgress();
        const totalSkillPointsEarned = savedState.totalSkillPointsEarned ?? savedState.skillPoints ?? 0;
        const normalizedSkillPoints = Math.max(savedState.skillPoints ?? 0, totalSkillPointsEarned);
        const baseSkillNodes = savedState.skillNodes ?? defaultSkillNodes.map(node => ({ ...node }));
        const syncedSkillNodes = calculateAutoSkillNodes(
          baseSkillNodes,
          savedProgress,
          totalSkillPointsEarned
        );

        return {
          ...savedState,
          skillPoints: normalizedSkillPoints,
          totalSkillPointsEarned,
          gameProgress: savedProgress,
          skillNodes: syncedSkillNodes,
        };
      },
    }
  )
);
