export interface LevelProgress {
  completed: boolean;
  bestScore: number;
  bestTime: number;
  stars: number;
  attempts: number;
}
export interface GameProgress { highestLevel: number; levels: Record<string, LevelProgress> }
export interface DailyProgress { completed: number; bonusAwarded: boolean }
export interface Rewards {
  xp: number;
  daily: Record<string, DailyProgress>;
  streakDays: number;
  lastCompletionDate: string;
  badges: string[];
}
export const emptyRewards = (): Rewards => ({ xp: 0, daily: {}, streakDays: 0, lastCompletionDate: '', badges: [] });
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function previousDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return localDate(new Date(y, m - 1, d - 1, 12));
}
export function visibleStreak(rewards: Rewards, today = localDate()) {
  return [today, previousDate(today)].includes(rewards.lastCompletionDate) ? rewards.streakDays : 0;
}
export function normalizeProgress(saved: Record<string, GameProgress> = {}, counts: Record<string, number>) {
  return Object.fromEntries(Object.entries(counts).map(([id, count]) => {
    const levels = Object.fromEntries(Object.entries(saved[id]?.levels ?? {}).filter(([key]) => {
      const n = Number(key.replace('level-', ''));
      return Number.isInteger(n) && n >= 1 && n <= count;
    }));
    let highestLevel = 1;
    while (highestLevel < count && levels[`level-${highestLevel}`]?.completed) highestLevel++;
    return [id, { highestLevel, levels }];
  }));
}
export function chapterBadges(progress: Record<string, GameProgress>, counts: Record<string, number>): string[] {
  return Object.entries(counts).flatMap(([id, count]) => {
    const badges: string[] = [];
    for (let start = 1; start <= count; start += 5) {
      const end = Math.min(start + 4, count);
      if (Array.from({ length: end - start + 1 }, (_, i) => start + i).every(n => progress[id]?.levels[`level-${n}`]?.completed)) {
        badges.push(`${id}:${Math.ceil(start / 5)}`);
      }
    }
    return badges;
  });
}
export function earnRewards(rewards: Rewards, firstCompletion: boolean, date: string, badges: string[]) {
  const oldDay = rewards.daily[date] ?? { completed: 0, bonusAwarded: false };
  const completed = oldDay.completed + 1;
  const bonus = completed >= 3 && !oldDay.bonusAwarded ? 10 : 0;
  const earned = (firstCompletion ? 20 : 5) + bonus;
  const streakDays = rewards.lastCompletionDate === date ? rewards.streakDays
    : rewards.lastCompletionDate === previousDate(date) ? rewards.streakDays + 1 : 1;
  return {
    earned,
    rewards: { ...rewards, xp: rewards.xp + earned, streakDays, lastCompletionDate: date,
      daily: { ...rewards.daily, [date]: { completed, bonusAwarded: oldDay.bonusAwarded || bonus > 0 } },
      badges: [...new Set([...rewards.badges, ...badges])],
    },
  };
}
export interface SavedProgress {
  gameProgress?: Record<string, GameProgress>;
  rewards?: Rewards;
  totalSkillPointsEarned?: number;
  skillPoints?: number;
  settings?: { theme?: 'light' | 'dark' };
  recentProgram?: string;
  currentGame?: string | null;
}
export function migrateProgress(saved: SavedProgress, counts: Record<string, number>) {
  const gameProgress = normalizeProgress(saved.gameProgress, counts);
  const rewards = saved.rewards ?? { ...emptyRewards(), xp: Math.max(0, saved.totalSkillPointsEarned ?? saved.skillPoints ?? 0) };
  const candidate = saved.recentProgram ?? saved.currentGame ?? 'sudoku';
  return { gameProgress,
    rewards: { ...rewards, badges: [...new Set([...rewards.badges, ...chapterBadges(gameProgress, counts)])] },
    recentProgram: counts[candidate] ? candidate : 'sudoku',
    settings: { ...saved.settings, theme: saved.settings?.theme ?? 'light' },
  };
}
