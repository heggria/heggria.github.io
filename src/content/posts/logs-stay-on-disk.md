---
title: 用量看板
date: 2026-03-17T00:00:00.000+08:00
description: Agent Usage Atlas 第一天。读本机 Codex / Claude / Cursor 日志，吐一份离线 HTML。当天接上了 PyPI 和 Homebrew。
duration: 3min
lang: zh
tags: [atlas, 用量, 工具]
---

三月十七号，[agent-usage-atlas](https://github.com/heggria/agent-usage-atlas) 从空仓走到能 `pip install`，再推一份 formula 到 [homebrew-tap](https://github.com/heggria/homebrew-tap)。同日还有 GitHub Pages 落地页、中文 README、pytest / ruff / mypy。

它做的事很窄：读 `~/.codex/`、`~/.claude/`、`~/.cursor/`，算出 token、费用、工具调用，吐一份能离线打开的 HTML。没有 API key，也不上传。Cursor 当时只能记活动，算不出钱。

我自己同时开着好几套 coding agent。账单散在各家后台里，对不上「今晚到底烧在哪」。数字先回到磁盘上。
