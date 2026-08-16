---
title: "#82"
date: 2026-07-20T00:00:00.000+08:00
description: 0.2.4 的 verifier 先查 shell 低级错误。grep 以 - 开头却没写 --，管道末尾没有 pipefail。
duration: 3min
lang: zh
tags: [taskflow, verifier, 成本]
---

[taskflow](https://github.com/heggria/taskflow) 0.2.4 把可插拔 verifier 做成一等公民。`script` 阶段的命令可以在不跑模型的情况下被静态检查：`grep` 模式以 `-` 开头却没写 `--`，管道末尾是 filter 却没有 `pipefail`。这些是我自己踩过、后来记在 issue [#82](https://github.com/heggria/taskflow/issues/82) 里的。

发现规则走约定。项目目录和用户目录里的 verifiers，坏掉的模块跳过并警告。另有 MCP 工具 `taskflow_lint`，宿主在执行前可以先查一遍。

低级错误请模型来发现，又慢又贵。同一版还让事件核在拓扑层内并发，彼此独立的 phase 不再被迫走命令式运行时。结构上已经知道的事，不必再推理一遍。
