---
title: 角色和旧键
date: 2026-07-27T00:00:00.000+08:00
description: 0.2.6 内置 agent 按语义角色走。fast / strong / thinker 还在，没配就回落。
duration: 3min
lang: zh
tags: [taskflow, 模型, 角色]
---

0.2.6 前后，[taskflow](https://github.com/heggria/taskflow) 里的内置 agent 开始按语义角色走。0.2.4 留下的 `fast` / `strong` / `thinker` 那些键还在。新角色优先，没配就回落到旧键。用户自己的 agent 继续能解析老名字。

扫、改、想、当裁判，账单和结果差很多。写成同一个默认模型，用久了会对不上预期。角色在这里是预算和职责，没有人设。

同一版给 Pi 的终端历史加了边界。长会话里，后面的输出会把前面的判断挤掉。上下文有限，得承认这一点，并在溢出之前压一截。
