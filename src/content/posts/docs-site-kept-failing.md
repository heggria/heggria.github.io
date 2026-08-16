---
title: 文档站红了一天
date: 2026-07-06T00:00:00.000+08:00
description: 同日接上了 Claude 和 OpenCode。记得更清楚的是 npm ci 崩了，按钮被代码窗挡住。
duration: 3min
lang: zh
tags: [taskflow, 文档, 踩坑]
---

七月六号的提交记录不太好看。文档站从 npm 迁到 pnpm，CI 报 `Exit handler never called`，postinstall 和 `npm ci` 打架，移动端横着滑，hero 里的代码窗把按钮挡住。favicon、sitemap、hreflang 也是同一天补上的。

功能其实不少。Claude Code 和 OpenCode 两个宿主进来了，可复用 flow 库有了第一层，可以从磁盘上的定义做 verify。这些更像「今天做成了什么」。

我记得更清楚的是部署红了又红。编排引擎的文档站打不开，对外就不存在。那天首先是让页面能活着发布。后来看自己的发版，会把「网站是否跟这个 commit 一起绿」算进去。
