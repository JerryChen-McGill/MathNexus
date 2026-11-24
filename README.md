# MathNexus

[English](#english) | [中文](#中文)

## English
Welcome to **MathNexus**, the ultimate platform where mathematics meets gaming! Dive into a collection of fun, interactive challenges designed to sharpen your mind while you play. Whether you are a math enthusiast or just looking for a fun way to train your brain, MathNexus has something for everyone.

## 中文
欢迎来到 **MathNexus**！这是一个将数学与游戏完美融合的趣味平台。在这里，你可以沉浸在各种充满挑战且引人入胜的数学游戏中，在游戏的同时磨练思维、锻炼大脑。无论你是数学爱好者，还是仅仅想寻找一种有趣的方式来放松和挑战自己，MathNexus 都能满足你的需求。

## 本地运行

需要 Node.js 22.18+（测试直接读取 TypeScript）或 Node.js 24。

```sh
npm ci
npm run dev
npm test
npm run build
```

访问终端显示的 `/MathNexus/` 地址。保留原有 GitHub Pages 部署：推送到 `main` 后由现有 workflow 构建 `dist`，本次改版不更换托管平台。

## 页面与进度

- `/` 是产品介绍；`/program/:gameId` 是单个游戏的关卡路径；`/program/:gameId/play/:level` 直接开始一局。
- `/rewards` 查看每日目标和章节徽章，`/profile` 管理昵称、外观和记录。旧游戏大厅、游戏和技能树链接仍可访问并自动跳转。
- 一种游戏一个 program；每五关组成一个章节。切换 program 保留独立进度，XP 和每日目标跨 program 累计。
- 首次通关 20 XP，重玩 5 XP，每日完成三局额外获得 10 XP（每日一次）。完成任意一局即可延续连续练习，按当前浏览器的本地日期统计。
- 存档仍使用 `localStorage` 的 `mathnexus-save`，版本升级为 4。保留旧关卡、最佳成绩、星级、昵称和主题；旧累计技能点按 1:1 转换为 XP。旧数据无法还原每日历史，因此不补造连续练习记录。
- 暂停会保留棋盘并冻结倒计时、AI 和延迟结算；离开或刷新后从该关重新开始，不保存未完成棋盘。
- 原有 19 款游戏的关卡规则保持不变；补齐此前缺失的数塔十关配置，并修正数塔答案与可见底层数字不一致的问题。

## 验证

`npm test` 覆盖存档迁移、关卡边界、每日奖励、跨日连续练习、重复结算、过期回调和暂停时钟。

浏览器验收脚本可使用本机 Playwright 模块和 Edge。先启动开发服务器，再执行：

```sh
node tests/ui.mjs <playwright模块路径> http://127.0.0.1:3000/MathNexus
```

脚本覆盖 360、390、768、1024、1440px 下全部 20 种游戏的首关与末关，共 200 组布局检查；另检查输入、切换 program、暂停恢复、下一关、扫雷插旗、横屏、深色主题和超时重试。截图及结果保存在忽略提交的 `node_modules/.cache/mathnexus/`。

构建后可模拟 GitHub Pages 的真实 404 跳转，检查深层链接、刷新和旧存档升级：

```sh
node tests/ui.mjs <playwright模块路径> --production
```

测试使用独立浏览器上下文，测试存档不会影响日常浏览器中的进度。
