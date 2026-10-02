---
title: "Atlas 0.3 处理不同格式的日志时间"
date: 2026-03-19T00:00:00.000+08:00
description: "兼容 Unix 秒与 git 日期字符串，并处理缺失的 result_code 字段；费用仍按日志估算。"
lang: zh
tags: [atlas, 日志, 踩坑]
---

[agent-usage-atlas](https://github.com/heggria/agent-usage-atlas) 0.3 处理了几种日志格式差异。`_ts()` 需要同时解析 Unix 秒和 git 日期字符串；部分日志没有 `result_code` 列，不能因缺字段让整页显示失败。

同一版开始按模型、日期、会话估算费用，并查看缓存命中节省的用量。日志字段不齐，费用只能估算，需要说明哪些数字用了假设。

随后两天发布了 0.3.1 和 0.3.2。演示页是 [heggria.github.io/agent-usage-atlas/demo](https://heggria.github.io/agent-usage-atlas/demo/)。仓库后来归档，本机用量统计也换了其他入口。这篇记录的是当时的版本。
