---
title: "taskflow 0.2.6 的角色配置兼容"
date: 2026-07-27T00:00:00.000+08:00
description: "内置 agent 优先使用语义角色配置，缺省时回落到 fast、strong、thinker 等旧键。"
lang: zh
tags: [taskflow, 模型, 角色]
---

0.2.6 前后，[taskflow](https://github.com/heggria/taskflow) 的内置 agent 开始按语义角色选择配置。0.2.4 的 `fast` / `strong` / `thinker` 键继续保留：新角色优先，未配置时回落到旧键，用户自定义的 agent 也仍能解析旧名字。

扫描、修改、推理和评审的工作要求不同，用一个默认模型不容易表达这些区别。角色配置让职责和模型选择可以分别调整，也方便考虑调用成本。

同一版还限制了 Pi 的终端历史长度，避免长会话持续占用上下文；接近容量限制时，需要压缩历史。
