---
title: "把 taskflow 引擎与宿主 SDK 分开"
date: 2026-06-29T00:00:00.000+08:00
description: "六月底拆成 monorepo，taskflow-core 不再依赖宿主 SDK，Pi 和 Codex 各自提供 runner。"
lang: zh
tags: [taskflow, 多宿主, 架构]
---

六月底，[taskflow](https://github.com/heggria/taskflow) 拆成 monorepo。`taskflow-core` 不再依赖宿主 SDK，Pi 和 Codex 各自提供 runner，项目也从 pi-taskflow 改名。

拆分前遇到过两个问题：detached 阶段没有注入真正的 runner，崩溃的 run 被标成了其他状态。把宿主实现留在引擎里，会增加排查和接入新宿主的难度。

拆分后，引擎负责图、缓存、校验和恢复，宿主负责执行 phase。当时只有 Pi 和 Codex；Claude Code、OpenCode、Grok 是七月接入的。同一周还修过 Codex 路径误用 Pi 模型 ID 的问题，模型配置也要按宿主处理。
