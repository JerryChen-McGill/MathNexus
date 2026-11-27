import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, previousDate, emptyRewards, earnRewards, visibleStreak, normalizeProgress, chapterBadges, migrateProgress } from '../src/lib/progress.ts';
import { GameClock } from '../src/lib/gameClock.ts';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

const completed = { completed: true, bestScore: 80, bestTime: 10, stars: 2, attempts: 1 };
test('local calendar date and previous day survive month/year and DST boundaries', () => {
  assert.equal(localDate(new Date(2026, 0, 1, 0, 15)), '2026-01-01');
  assert.equal(previousDate('2026-01-01'), '2025-12-31');
  assert.equal(previousDate('2026-03-09'), '2026-03-08');
  assert.equal(previousDate('2026-11-02'), '2026-11-01');
});
test('first completion, replay and daily bonus have distinct rewards', () => {
  let r = emptyRewards();
  for (const [first, expected] of [[true, 20], [false, 5], [true, 30], [false, 5]]) {
    const next = earnRewards(r, first, '2026-11-23', []);
    assert.equal(next.earned, expected); r = next.rewards;
  }
  assert.equal(r.xp, 60); assert.equal(r.streakDays, 1);
  assert.deepEqual(r.daily['2026-11-23'], { completed: 4, bonusAwarded: true });
  const tomorrow = earnRewards(r, false, '2026-11-24', []).rewards;
  assert.equal(tomorrow.streakDays, 2);
  assert.equal(visibleStreak(tomorrow, '2026-11-25'), 2);
  assert.equal(visibleStreak(tomorrow, '2026-11-26'), 0);
  assert.equal(earnRewards(tomorrow, false, '2026-11-26', []).rewards.streakDays, 1);
});
test('migration preserves records, converts legacy XP once, clamps final level, awards badges', () => {
  const levels = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`level-${i + 1}`, completed]));
  const result = migrateProgress({ gameProgress: { sudoku: { highestLevel: 11, levels } }, skillPoints: 5, totalSkillPointsEarned: 120, settings: { theme: 'dark' } }, { sudoku: 10 });
  assert.equal(result.gameProgress.sudoku.highestLevel, 10);
  assert.deepEqual(result.gameProgress.sudoku.levels['level-10'], completed);
  assert.equal(result.rewards.xp, 120); assert.equal(result.rewards.streakDays, 0);
  assert.equal(result.settings.theme, 'dark');
  assert.deepEqual(result.rewards.badges, ['sudoku:1', 'sudoku:2']);
  assert.deepEqual(migrateProgress(result, { sudoku: 10 }), result);
  assert.equal(migrateProgress({}, { sudoku: 10 }).settings.theme, 'light');
});
test('unlocking is contiguous and chapter badge needs every level', () => {
  const progress = normalizeProgress({ sudoku: { highestLevel: 99, levels: { 'level-1': completed, 'level-3': completed, 'level-11': completed } } }, { sudoku: 10 });
  assert.equal(progress.sudoku.highestLevel, 2);
  assert.equal(progress.sudoku.levels['level-11'], undefined);
  assert.deepEqual(chapterBadges(progress, { sudoku: 10 }), []);
});
test('session clock freezes timers and AI delays, resumes remaining time and discards stale callbacks', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const clock = new GameClock(); let ticks = 0; let ai = 0;
  clock.setInterval(() => ticks++, 1000); clock.setTimeout(() => ai++, 500);
  t.mock.timers.tick(200); clock.setPaused(true); t.mock.timers.tick(10000);
  assert.equal(ai, 0); assert.equal(ticks, 0);
  clock.setPaused(false); t.mock.timers.tick(299); assert.equal(ai, 0);
  t.mock.timers.tick(1); assert.equal(ai, 1);
  t.mock.timers.tick(500); assert.equal(ticks, 1);
  clock.dispose(); t.mock.timers.tick(5000); assert.equal(ticks, 1);
  t.mock.timers.reset();
});

test('store ignores duplicate and stale session settlements across programs', async () => {
  await mkdir('node_modules/.cache/mathnexus', { recursive: true });
  await build({ entryPoints: ['src/store/gameStore.ts'], outfile: 'node_modules/.cache/mathnexus/store.mjs', bundle: true, platform: 'node', format: 'esm', packages: 'external', define: { 'import.meta.env.BASE_URL': '"/"' } });
  const memory = new Map();
  globalThis.localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: k => memory.delete(k) };
  globalThis.window = { localStorage: globalThis.localStorage };
  const { useGameStore: store, levelCounts } = await import('../node_modules/.cache/mathnexus/store.mjs');
  assert.equal(Object.keys(levelCounts).length, 42);
  assert.ok(Object.values(levelCounts).every(count => count === 65));
  store.getState().resetProgress();
  store.getState().startGame('a', 'sudoku'); store.getState().startGame('a', 'sudoku');
  assert.equal(store.getState().stats.totalGamesPlayed, 1);
  assert.equal(store.getState().completeLevel('a', 'sudoku', 1, 100, 30, 3), 20);
  assert.equal(store.getState().completeLevel('a', 'sudoku', 1, 100, 30, 3), 0);
  store.getState().failLevel('a', 'sudoku', 1);
  assert.equal(store.getState().stats.totalLosses, 0);
  assert.equal(store.getState().gameProgress.sudoku.highestLevel, 2);
  store.getState().startGame('b', 'tangram');
  assert.equal(store.getState().completeLevel('a', 'sudoku', 2, 100, 30, 3), 0);
  store.getState().completeLevel('b', 'tangram', 1, 100, 30, 3);
  store.getState().startGame('c', 'sudoku');
  assert.equal(store.getState().completeLevel('c', 'sudoku', 1, 90, 40, 1), 15);
  assert.equal(store.getState().rewards.xp, 55);
  assert.equal(store.getState().rewards.daily[localDate()].completed, 3);
  assert.equal(store.getState().gameProgress.sudoku.levels['level-1'].bestScore, 100);
  assert.equal(store.getState().gameProgress.sudoku.levels['level-1'].stars, 3);
  store.getState().startGame('d', 'sudoku'); store.getState().failLevel('d', 'sudoku', 2);
  assert.equal(store.getState().rewards.xp, 55);
  assert.equal(store.getState().gameProgress.sudoku.highestLevel, 2);
  store.getState().resetProgress(); assert.equal(store.getState().rewards.xp, 0);
  assert.ok(memory.has('mathnexus-save'));

  // A v4 save must gain the new program without losing existing records.
  memory.set('mathnexus-save', JSON.stringify({ version: 4, state: {
    playerName: '旧存档', totalScore: 123, gameProgress: { sudoku: { highestLevel: 2, levels: { 'level-1': completed } } },
    rewards: { ...emptyRewards(), xp: 80 }, settings: { theme: 'dark' },
  } }));
  await store.persist.rehydrate();
  assert.equal(store.getState().gameProgress.lighthouse.highestLevel, 1);
  assert.equal(store.getState().gameProgress.sudoku.levels['level-1'].bestScore, 80);
  assert.equal(store.getState().rewards.xp, 80);
  assert.equal(store.getState().playerName, '旧存档');
  assert.equal(store.getState().settings.theme, 'dark');
  assert.equal(JSON.parse(memory.get('mathnexus-save')).version, 5);

  // Existing v5 saves predate Bloxorz: hydrate and settle the new game safely.
  const oldSave = JSON.parse(memory.get('mathnexus-save'));
  delete oldSave.state.gameProgress.bloxorz;
  memory.set('mathnexus-save', JSON.stringify(oldSave));
  await store.persist.rehydrate();
  assert.equal(store.getState().gameProgress.bloxorz.highestLevel, 1);
  assert.equal(store.getState().gameProgress.sudoku.levels['level-1'].bestScore, 80);
  assert.equal(store.getState().rewards.xp, 80);
  store.getState().startGame('new-game', 'bloxorz');
  assert.equal(store.getState().completeLevel('new-game', 'bloxorz', 1, 1000, 15, 3), 20);
  assert.equal(store.getState().gameProgress.bloxorz.highestLevel, 2);

  for (const token of ['Jerry Chen', 'JerryChen', 'Jenny Wang', 'JennyWang']) {
    store.getState().resetProgress();
    assert.equal(store.getState().setUserToken(token), true);
    const before = store.getState().gameProgress;
    await store.persist.rehydrate();
    assert.equal(store.getState().userToken, token);
    assert.deepEqual(store.getState().gameProgress, before, 'granting access does not fabricate completion');
    store.getState().startGame(token, 'lighthouse');
    assert.equal(store.getState().completeLevel(token, 'lighthouse', 10, 100, 30, 3), 20);
    assert.equal(store.getState().gameProgress.lighthouse.levels['level-10'].completed, true);
    assert.equal(store.getState().gameProgress.lighthouse.highestLevel, 1);
    assert.equal(store.getState().setUserToken('wrong'), false);
    store.getState().startGame('locked', 'lighthouse');
    assert.equal(store.getState().completeLevel('locked', 'lighthouse', 9, 100, 30, 3), 0);
    store.getState().setUserToken(token);
    for (const badLevel of [0, 66, 1.5, NaN]) {
      assert.equal(store.getState().completeLevel('locked', 'lighthouse', badLevel, 100, 30, 3), 0);
    }
    store.getState().setUserToken('');
    assert.equal(store.getState().userToken, '');
  }
});
