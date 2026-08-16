---
title: 0.1.5
date: 2026-07-03T00:00:00.000+08:00
description: scoring gate、reflexion、副作用分类。读文件和改外部世界，默认路径分开。
duration: 3min
lang: zh
tags: [taskflow, 门禁, 副作用]
---

0.1.5 给 [taskflow](https://github.com/heggria/taskflow) 加了三样东西：scoring gate、reflexion 循环、副作用分类。流程可以按规则给自己打分；分不够就再想一轮；读文件和改外部世界，走不同的默认路径。

分数可以很低级，规则可以很笨。笨的好处是你知道它在笨什么。模型说「完成了」，外面还得有东西能核对。

能重来的失败，和不能重来的失败，聊天里常常长得一样：都是一段很有把握的话。副作用分类就是为了把它们拆开。

同一天技能编译收成一份源，再分别给 Pi 和 Codex。判断放在一处，适配放在边上。
