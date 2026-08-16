---
title: 拆 monorepo
date: 2026-06-29T00:00:00.000+08:00
description: taskflow-core 不再依赖任何宿主 SDK。当时只有 Pi 和 Codex。
duration: 3min
lang: zh
tags: [taskflow, 多宿主, 架构]
---

六月底 [taskflow](https://github.com/heggria/taskflow) 拆成 monorepo。`taskflow-core` 不再依赖任何宿主 SDK。Pi 和 Codex 各自挂自己的 runner。对外名字也从 pi-taskflow 改掉了。

拆的理由很具体。detached 阶段曾经注入不到真正的 runner，崩溃的 run 还会被标成别的状态。宿主逻辑和引擎缠在一起时，这种 bug 会在每个新宿主上复制一遍。

当时只有两个宿主。Claude Code、OpenCode、Grok 是七月才接上的。引擎负责图、缓存、校验、恢复；宿主只负责把一个 phase 跑起来。同一周还修过一件小事：Codex 路径上不能继续塞 Pi 的模型 ID。每个宿主有自己的配置，抄一份通用的会漏。
