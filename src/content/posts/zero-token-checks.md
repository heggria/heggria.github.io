---
title: "执行前用 verifier 检查 shell 命令"
date: 2026-07-20T00:00:00.000+08:00
description: "taskflow 0.2.4 支持可插拔 verifier，在不调用模型的情况下静态检查部分 script 问题。"
lang: zh
tags: [taskflow, verifier, 成本]
---

[taskflow](https://github.com/heggria/taskflow) 0.2.4 加强了可插拔 verifier。`script` 阶段的命令可以先做静态检查，不必调用模型。

issue [#82](https://github.com/heggria/taskflow/issues/82) 记了两类问题：`grep` 的模式以 `-` 开头却没写 `--`；管道末尾是 filter，但没有 `pipefail`。这些规则检查的是特定写法，不能替代实际执行验证。

verifier 从项目目录和用户目录按约定发现，无法加载的模块会跳过并警告。MCP 工具 `taskflow_lint` 也让宿主可以在执行前检查。

同一版还支持在拓扑层内并发执行事件核中的独立 phase，减少原有命令式运行时对独立步骤的串行限制。
