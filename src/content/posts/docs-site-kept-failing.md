---
title: "文档站的安装与页面问题"
date: 2026-07-06T00:00:00.000+08:00
description: "七月六号修了包管理、CI 和移动端布局，也接入了 Claude Code 与 OpenCode。"
lang: zh
tags: [taskflow, 文档, 踩坑]
---

七月六号，文档站从 npm 迁到 pnpm。当天记录了 CI 的 `Exit handler never called`、postinstall 与 `npm ci` 的冲突，还有移动端横向溢出、hero 代码窗遮住按钮的问题。favicon、sitemap 和 hreflang 也在这一天补上。

同日还接入了 Claude Code 和 OpenCode，加入可复用 flow 库的第一层，并支持从磁盘上的定义做 verify。

功能和文档站需要一起检查。功能提交了，部署仍可能失败；部署通过了，页面也可能无法正常操作。后来检查发版时，我会一起看对应 commit 的网站构建结果。
