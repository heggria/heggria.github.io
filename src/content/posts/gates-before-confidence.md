---
title: "taskflow 0.1.5：评分、重试和副作用分类"
date: 2026-07-03T00:00:00.000+08:00
description: "0.1.5 加入 scoring gate、reflexion 循环和副作用分类，区分读取与对外修改的默认处理。"
lang: zh
tags: [taskflow, 门禁, 副作用]
---

0.1.5 给 [taskflow](https://github.com/heggria/taskflow) 加了 scoring gate、reflexion 循环和副作用分类。流程按规则评分，分数不足时再执行一轮；读取文件和修改外部状态采用不同的默认处理。

评分的用途取决于规则能检查什么。模型给出「完成了」的回答，还需要核对实际结果。对可以重试的步骤和会产生外部影响的步骤，也需要分别安排失败后的处理。

同一天，技能编译改成维护一份源，再分别生成 Pi 和 Codex 的适配。
