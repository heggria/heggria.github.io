---
title: "从本机日志生成 agent 用量看板"
date: 2026-03-17T00:00:00.000+08:00
description: "Agent Usage Atlas 读取 Codex、Claude 和 Cursor 日志，生成可离线打开的 HTML 用量报告。"
lang: zh
tags: [atlas, 用量, 工具]
---

三月十七号，[agent-usage-atlas](https://github.com/heggria/agent-usage-atlas) 从空仓做到了可以 `pip install`，并把 formula 推到 [homebrew-tap](https://github.com/heggria/homebrew-tap)。当天也做了 GitHub Pages 落地页、中文 README，以及 pytest、ruff、mypy 检查。

它读取 `~/.codex/`、`~/.claude/`、`~/.cursor/` 的本机日志，统计 token、费用和工具调用，生成可以离线打开的 HTML。使用时不需要 API key，也不上传日志。Cursor 当时只统计活动，无法估算费用。

我同时用几套 coding agent，想把分散的用量放到一起看。这个工具先解决本机日志里能拿到的部分。
