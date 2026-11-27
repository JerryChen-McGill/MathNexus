import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
let base = process.env.TEST_URL || process.argv[3] || 'http://127.0.0.1:3000/MathNexus';
const production = process.argv.includes('--production');
let server;
if (production) {
  const root = resolve('dist');
  server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname.startsWith('/MathNexus/') ? pathname.slice('/MathNexus/'.length) : 'missing';
    const file = resolve(root, relative || 'index.html');
    try {
      if (!file.startsWith(root + sep)) throw new Error('Outside build directory');
      const data = await readFile(file);
      response.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' })[extname(file)] || 'application/octet-stream' });
      response.end(data);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(await readFile(resolve(root, '404.html')));
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/MathNexus`;
}
const output = 'node_modules/.cache/mathnexus';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(e.stack || e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('net::ERR')) errors.push(`${page.url()}: ${m.text()}`); });
const ids = ['bloxorz','lighthouse','sudoku','math24','magic-square','sliding-puzzle','nim','number-race','number-bomb','number-pyramid','tangram','hanoi','minesweeper','tic-tac-toe','gomoku','einstein','river-crossing','bash-game','hundred-chicken','chicken-rabbit','sunzi','konigsberg','water-pipes','shikaku','skyscraper','nonogram','killer-sudoku','kakuro','hashi','parking-lot','water-sort','sliding-maze','queens','water-jug','one-stroke','paradox-garden','escape-room','tango','lucky-draw','pinecone-battle','logic-fill','puzzle-challenge'];
const goto = async path => { await page.goto(base + path, { waitUntil: 'domcontentloaded' }); await page.locator('main').waitFor(); await page.evaluate(() => new Promise(requestAnimationFrame)); };
const overflow = async label => {
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
  assert.ok(size.scroll <= size.width + 1, `${label}: document overflow ${size.scroll}/${size.width}`);
};
try {
  if (production) {
    for (const route of ['/program/sudoku', '/program/sudoku/play/1', '/rewards', '/profile', '/game/sudoku']) {
      await goto(route);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('main').waitFor();
      assert.ok(!(await page.locator('body').innerText()).includes('技能树'));
    }
    await goto('/program/sudoku/play/1');
    assert.equal(await page.locator('.first-hint').count(), 0, 'hint only shown for first session');
    await page.setViewportSize({ width: 360, height: 740 });
    await overflow('production-phone-header');
    for (const control of await page.locator('.game-header .icon-button').all()) {
      const box = await control.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
    }
    await page.evaluate(() => localStorage.setItem('mathnexus-save', JSON.stringify({ version: 3, state: {
      playerName: '原来的探险家', totalScore: 1234, totalSkillPointsEarned: 120, skillPoints: 80,
      settings: { theme: 'dark' }, gameProgress: { sudoku: { highestLevel: 11, levels: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`level-${i + 1}`, { completed: true, bestScore: 99, bestTime: 20, stars: 2, attempts: 1 }])) } },
    } })));
    await goto('/program/sudoku');
    await page.getByRole('heading', { name: '这一程，真棒！' }).waitFor();
    const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('mathnexus-save')));
    assert.equal(migrated.version, 5); assert.equal(migrated.state.rewards.xp, 120);
    assert.equal(migrated.state.gameProgress.sudoku.highestLevel, 10);
    assert.equal(migrated.state.rewards.badges.length, 2);
    assert.equal(migrated.state.playerName, '原来的探险家');
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.locator('main').waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mathnexus-save')).state.rewards.xp), 120);
    assert.equal(errors.filter(e => !e.includes('404')).length, 0);
    console.log('Production GitHub Pages 404 fallback, deep links, refresh, first-session hint and v3 save migration passed');
  } else {
  await goto('/');
  await page.screenshot({ path: `${output}/landing-desktop.png`, fullPage: true });
  await page.getByRole('link', { name: '开始冒险', exact: true }).click();
  await page.getByRole('heading', { name: '下一小步，就从这里开始' }).waitFor();
  assert.match(page.url(), /program\/sudoku$/);
  await page.screenshot({ path: `${output}/program-desktop.png`, fullPage: true });
  await page.getByRole('link', { name: '开始冒险', exact: true }).click();
  await page.locator('.sudoku-board').waitFor();
  assert.match(page.url(), /play\/1$/);
  const blank = page.locator('.sudoku-board button').filter({ hasText: /^$/ }).first();
  await blank.click(); await page.locator('.game-content').getByRole('button', { name: '1', exact: true }).last().click();
  const board = await page.locator('.sudoku-board').innerText();
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const time = await page.locator('.game-time').innerText();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('.game-time').innerText(), time);
  await page.keyboard.press('2');
  assert.equal(await page.locator('.sudoku-board').innerText(), board);
  await page.getByRole('button', { name: '继续游戏', exact: true }).click();
  assert.equal(await page.locator('.sudoku-board').innerText(), board);
  await page.getByRole('link', { name: '返回关卡路径' }).click();
  await page.getByRole('button', { name: /切换 program/ }).click();
  await page.getByRole('textbox', { name: '搜索 program' }).fill('七巧板');
  await page.locator('.program-option').click();
  await page.getByRole('link', { name: '开始冒险', exact: true }).click();
  for (let n = 0; n < 7; n++) await page.getByRole('button', { name: /^放置/ }).nth(n).click();
  await page.getByRole('heading', { name: '又一个小小胜利！' }).waitFor();
  assert.equal(await page.locator('.earned-xp').innerText(), '+20 XP');
  await page.getByRole('button', { name: '下一关', exact: true }).click();
  assert.match(page.url(), /tangram\/play\/2$/);
  assert.match(await page.locator('.game-tangram').innerText(), /进度: 0 \/ 7/);
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const timer = await page.locator('.game-tangram').innerText();
  await page.waitForTimeout(1200); assert.equal(await page.locator('.game-tangram').innerText(), timer);
  await goto('/game/tangram'); assert.match(page.url(), /tangram\/play\/2$/);
  await goto('/program/tangram/play/10'); assert.match(page.url(), /program\/tangram$/);
  await goto('/skilltree'); assert.match(page.url(), /rewards$/);
  await goto('/profile#skills'); assert.match(page.url(), /rewards$/);
  await goto('/games'); assert.match(page.url(), /program\/tangram$/);
  console.log('Core flow: start, input, pause/resume, picker, completion, next level, legacy routes passed');

  for (const token of ['Jerry Chen', 'JerryChen', 'Jenny Wang', 'JennyWang']) {
    await goto('/profile');
    await page.getByRole('textbox', { name: '用户令牌', exact: true }).fill(token);
    await page.getByRole('button', { name: '应用', exact: true }).click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByText('管理员权限已开启 · 全部关卡可玩', { exact: true }).waitFor();
    await goto('/program/lighthouse/play/10');
    await page.getByRole('group', { name: '11乘11灯塔棋盘' }).waitFor();
  }
  await page.getByTestId('cell-0-0').click();
  await page.getByTestId('cell-0-1').click();
  await page.getByText('有灯塔互相照射，请调整位置。', { exact: true }).waitFor();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  assert.match(await page.getByTestId('cell-0-1').getAttribute('aria-label'), /空格/);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await page.getByText('有灯塔互相照射，请调整位置。', { exact: true }).waitFor();
  await page.getByRole('button', { name: '重置', exact: true }).click();
  await page.getByRole('button', { name: '禁放标记', exact: true }).click();
  await page.getByTestId('cell-0-0').click();
  assert.match(await page.getByTestId('cell-0-0').getAttribute('aria-label'), /禁放标记/);
  await page.getByTestId('cell-0-0').click({ button: 'right' });
  assert.match(await page.getByTestId('cell-0-0').getAttribute('aria-label'), /空格/);
  await goto('/profile');
  await page.getByRole('button', { name: '清除令牌', exact: true }).click();
  await goto('/program/lighthouse/play/10');
  await page.getByRole('heading', { name: '下一小步，就从这里开始' }).waitFor();
  assert.match(page.url(), /program\/lighthouse$/);
  await goto('/program/lighthouse/play/1');
  await page.getByTestId('cell-1-0').click();
  await page.getByRole('heading', { name: '又一个小小胜利！' }).waitFor();
  await page.getByRole('button', { name: '下一关', exact: true }).click();
  await page.getByText('第 2 关 · 小试牛刀', { exact: true }).waitFor();
  console.log('Four developer tokens, persistence, revocation and lighthouse interactions passed');

  // Representative UI at every required viewport, using a fresh program.
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const path of ['/', '/program/sudoku', '/rewards', '/profile']) {
      await goto(path); await overflow(`${width}${path}`);
      if (width === 390 || width === 768) await page.screenshot({ path: `${output}/${path.replaceAll('/', '-') || 'landing'}-${width}.png`, fullPage: true });
    }
    await goto('/program/sudoku');
    await page.getByRole('button', { name: /切换 program/ }).click();
    await page.getByRole('dialog').evaluate(async el => { await Promise.all(el.getAnimations().map(a => a.finished.catch(() => {}))); });
    await overflow(`picker-${width}`);
    const rect = await page.getByRole('dialog').boundingBox();
    assert.ok(rect.x >= -1 && rect.x + rect.width <= width + 1, `picker ${width}: ${JSON.stringify(rect)}`);
    await page.keyboard.press('Escape');
  }
  // Seed completed records to inspect existing maximum-size levels, without altering production data.
  await page.evaluate(ids => {
    const saved = JSON.parse(localStorage.getItem('mathnexus-save'));
    saved.state.gameProgress = Object.fromEntries(ids.map(id => [id, { highestLevel: 10, levels: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`level-${i + 1}`, { completed: true, bestScore: 100, bestTime: 30, stars: 3, attempts: 1 }])) }]));
    saved.state.seenHints = ids;
    localStorage.setItem('mathnexus-save', JSON.stringify(saved));
  }, ids);
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const id of ids) for (const level of [1, 10]) {
      await goto(`/program/${id}/play/${level}`);
      await page.locator(`.game-${id}`).waitFor();
      await overflow(`${id}-${level}-${width}`);
      const bounds = await page.locator('.game-content').evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth }));
      assert.ok(bounds.scroll <= bounds.width + 1, `${id}-${level}-${width}: controls must fit, only board region may scroll ${JSON.stringify(bounds)}`);
      if (width === 390 && level === 10) await page.screenshot({ path: `${output}/game-${id}.png`, fullPage: true });
    }
    console.log(`${ids.length} games × first/final level verified at ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await goto('/program/minesweeper/play/10');
  await page.getByRole('button', { name: '插旗', exact: true }).click();
  await page.getByRole('button', { name: '第1行第1列，未翻开', exact: true }).click();
  await page.getByRole('button', { name: '第1行第1列，已插旗', exact: true }).waitFor();
  await page.getByRole('button', { name: '第1行第1列，已插旗', exact: true }).click({ button: 'right' });
  await page.getByRole('button', { name: '第1行第1列，未翻开', exact: true }).waitFor();
  await page.getByRole('button', { name: '翻开', exact: true }).click();
  await page.getByRole('button', { name: '第1行第1列，未翻开', exact: true }).click();
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const mineState = await page.locator('.game-minesweeper').innerText();
  await page.waitForTimeout(1200); assert.equal(await page.locator('.game-minesweeper').innerText(), mineState);
  await page.getByRole('button', { name: '继续游戏', exact: true }).click();
  await page.setViewportSize({ width: 844, height: 390 }); await overflow('phone-landscape');
  await goto('/program/tic-tac-toe/play/1');
  await page.locator('.game-content .grid button').first().click();
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const aiBoard = await page.locator('.game-content .grid').innerText();
  await page.waitForTimeout(1200); assert.equal(await page.locator('.game-content .grid').innerText(), aiBoard);
  await page.getByRole('button', { name: '继续游戏', exact: true }).click();
  await page.waitForFunction(old => document.querySelector('.game-content .grid').innerText !== old, aiBoard);
  await goto('/profile');
  await page.getByRole('button', { name: '明亮', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await goto('/program/sudoku');
  await page.screenshot({ path: `${output}/program-dark.png`, fullPage: true });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.clock.install();
  await goto('/program/chicken-rabbit/play/2');
  await page.getByRole('button', { name: '提交答案', exact: true }).waitFor();
  await page.clock.runFor(181000);
  await page.getByRole('heading', { name: '换个思路，再试一次' }).waitFor();
  await page.getByRole('button', { name: '再试一次', exact: true }).click();
  await page.getByRole('button', { name: '提交答案', exact: true }).waitFor();
  assert.match(page.url(), /chicken-rabbit\/play\/2$/);
  assert.deepEqual(errors, []);
  await writeFile(`${output}/ui-results.json`, JSON.stringify({ passed: true, gameViewportChecks: ids.length * 2 * 5, errors }, null, 2));
  console.log('Touch flagging, local scrolling, orientation, AI pause, runtime errors: passed');
  }
} catch (error) {
  console.error('Browser errors:', errors, 'URL:', page.url());
  console.error((await page.locator('body').innerText()).slice(0, 3000));
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
  throw error;
} finally { await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); }
