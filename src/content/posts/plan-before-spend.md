---
title: "/tf plan"
date: 2026-08-06T00:00:00.000+08:00
description: 0.2.7 的零 token 干跑。循环用 maxIterations，动态 map 老实报 unbounded。
duration: 3min
lang: zh
tags: [taskflow, 成本, 计划]
---

[taskflow](https://github.com/heggria/taskflow) 0.2.7 加了 `/tf plan`。零 token 干跑：绑定参数，做结构校验，可选跑 lint，按拓扑排出 phase，并给出最坏情况下的 agent 调用上界。循环用 `maxIterations`。动态 map 老实报 `unbounded`。这一步不派子 agent。

跑起来就是在花钱，而且花完才知道图是歪的。plan 把成本从运行时挪到编译期。

同一版还把重算和缓存的节省写成能看见的一行。跑完得能对照：少叫了几次，命中了什么，哪些仍然无界。plan 会被打脸，打脸才有用。
