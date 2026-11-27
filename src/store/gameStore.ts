import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { levelConfigs } from '@/data/games';
import { chapterBadges, earnRewards, emptyRewards, localDate, migrateProgress, normalizeProgress } from '@/lib/progress';
import type { GameProgress, Rewards, SavedProgress } from '@/lib/progress';
import { canPlayLevel, isAdminToken } from '@/lib/access';

export const levelCounts = Object.fromEntries(Object.entries(levelConfigs).map(([id, levels]) => [id, levels.length]));
interface Settings { soundEnabled: boolean; musicEnabled: boolean; difficulty: 'easy' | 'normal' | 'hard'; theme: 'dark' | 'light' }
interface Stats { totalGamesPlayed: number; totalTimePlayed: number; totalWins: number; totalLosses: number }
interface State {
  playerName: string; userToken: string; totalScore: number; gameProgress: Record<string, GameProgress>;
  rewards: Rewards; recentProgram: string; settings: Settings; stats: Stats;
  seenHints: string[]; activeSession: string | null; settledSession: string | null;
  setPlayerName: (name: string) => void;
  setUserToken: (token: string) => boolean;
  selectProgram: (id: string) => void;
  dismissHint: (id: string) => void;
  startGame: (session: string, gameId: string) => void;
  completeLevel: (session: string, id: string, level: number, score: number, time: number, stars: number) => number;
  failLevel: (session: string, id: string, level: number) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  resetProgress: () => void;
}
const defaultSettings: Settings = { soundEnabled: true, musicEnabled: true, difficulty: 'normal', theme: 'light' };
const defaultStats = (): Stats => ({ totalGamesPlayed: 0, totalTimePlayed: 0, totalWins: 0, totalLosses: 0 });
export const useGameStore = create<State>()(persist((set, get) => ({
  playerName: '数学探险家', userToken: '', totalScore: 0, gameProgress: normalizeProgress({}, levelCounts),
  rewards: emptyRewards(), recentProgram: 'sudoku', settings: defaultSettings, stats: defaultStats(),
  seenHints: [], activeSession: null, settledSession: null,
  setPlayerName: name => set({ playerName: name.trim().slice(0, 24) || '数学探险家' }),
  setUserToken: token => { const valid = isAdminToken(token); set({ userToken: valid ? token.trim() : '' }); return valid; },
  selectProgram: id => { if (levelCounts[id]) set({ recentProgram: id }); },
  dismissHint: id => set({ seenHints: [...new Set([...get().seenHints, id])] }),
  startGame: (session, gameId) => {
    const state = get();
    if (state.activeSession === session) return;
    set({ activeSession: session, recentProgram: gameId, stats: { ...state.stats, totalGamesPlayed: state.stats.totalGamesPlayed + 1 } });
  },
  completeLevel: (session, id, level, score, time, stars) => {
    const state = get();
    if (state.activeSession !== session || state.settledSession === session || !canPlayLevel(level, levelCounts[id] ?? 0, state.gameProgress[id]?.highestLevel ?? 1, state.userToken)) return 0;
    const existing = state.gameProgress[id].levels[`level-${level}`];
    const levels = { ...state.gameProgress[id].levels, [`level-${level}`]: {
      completed: true, bestScore: Math.max(existing?.bestScore ?? 0, score),
      bestTime: existing?.completed ? Math.min(existing.bestTime, time) : time,
      stars: Math.max(existing?.stars ?? 0, stars), attempts: (existing?.attempts ?? 0) + 1,
    } };
    const gameProgress = normalizeProgress({ ...state.gameProgress, [id]: { highestLevel: level, levels } }, levelCounts);
    const { earned, rewards } = earnRewards(state.rewards, !existing?.completed, localDate(), chapterBadges(gameProgress, levelCounts));
    set({ gameProgress, rewards, settledSession: session, totalScore: state.totalScore + score,
      stats: { ...state.stats, totalWins: state.stats.totalWins + 1, totalTimePlayed: state.stats.totalTimePlayed + time } });
    return earned;
  },
  failLevel: (session, id, level) => {
    const state = get();
    if (state.activeSession !== session || state.settledSession === session || !canPlayLevel(level, levelCounts[id] ?? 0, state.gameProgress[id]?.highestLevel ?? 1, state.userToken)) return;
    const progress = state.gameProgress[id];
    const existing = progress.levels[`level-${level}`];
    set({ settledSession: session, gameProgress: { ...state.gameProgress, [id]: { ...progress, levels: {
      ...progress.levels, [`level-${level}`]: { completed: existing?.completed ?? false, bestScore: existing?.bestScore ?? 0, bestTime: existing?.bestTime ?? 0, stars: existing?.stars ?? 0, attempts: (existing?.attempts ?? 0) + 1 },
    } } }, stats: { ...state.stats, totalLosses: state.stats.totalLosses + 1 } });
  },
  updateSettings: settings => set({ settings: { ...get().settings, ...settings } }),
  resetProgress: () => set({ totalScore: 0, gameProgress: normalizeProgress({}, levelCounts), rewards: emptyRewards(),
    recentProgram: 'sudoku', stats: defaultStats(), seenHints: [], activeSession: null, settledSession: null }),
}), {
  name: 'mathnexus-save', version: 5,
  // Same-version saves also need entries for games added after they were written.
  merge: (persisted, current) => {
    const saved = (persisted ?? {}) as Partial<State>;
    return { ...current, ...saved, gameProgress: normalizeProgress(saved.gameProgress ?? {}, levelCounts) };
  },
  partialize: state => ({ playerName: state.playerName, userToken: state.userToken, totalScore: state.totalScore, gameProgress: state.gameProgress,
    rewards: state.rewards, recentProgram: state.recentProgram, settings: state.settings, stats: state.stats, seenHints: state.seenHints }),
  migrate: persisted => {
    const saved = (persisted ?? {}) as Partial<State> & SavedProgress;
    const migrated = migrateProgress(saved, levelCounts);
    return { playerName: saved.playerName ?? '数学探险家', userToken: typeof saved.userToken === 'string' && isAdminToken(saved.userToken) ? saved.userToken : '', totalScore: saved.totalScore ?? 0,
      ...migrated, settings: { ...defaultSettings, ...migrated.settings },
      stats: { ...defaultStats(), ...saved.stats }, seenHints: saved.seenHints ?? [] };
  },
}));
