---
title: "用 /tf plan 先检查流程与调用上界"
date: 2026-08-06T00:00:00.000+08:00
description: "taskflow 0.2.7 的 plan 不调用子 agent，可校验流程并估算最坏情况下的 agent 调用次数。"
lang: zh
tags: [taskflow, 成本, 计划]
---

[taskflow](https://github.com/heggria/taskflow) 0.2.7 加了 `/tf plan`。它先绑定参数、做结构校验，可选跑 lint，再按拓扑列出 phase，并估算最坏情况下的 agent 调用上界。这一步不派子 agent，不消耗模型 token。

循环按 `maxIterations` 计算；动态 map 无法给出有限上界时，显示 `unbounded`。先看这份计划，可以在执行前发现部分流程问题，也能知道调用次数是否有上限。它还不能给出精确账单。

同一版还显示重算和缓存节省的调用情况。运行后可以对照计划，检查哪些调用省下了、哪些缓存命中了。
