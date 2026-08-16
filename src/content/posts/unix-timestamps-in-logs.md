---
title: 日志里的时间
date: 2026-03-19T00:00:00.000+08:00
description: Atlas 0.3。_ts() 要同时吃 Unix 时间戳和 git 日期。缺 result_code 列也不能把整页打空白。
duration: 3min
lang: zh
tags: [atlas, 日志, 踩坑]
---

[agent-usage-atlas](https://github.com/heggria/agent-usage-atlas) 0.3 修的是脏数据。`_ts()` 里既有 Unix 秒，也有 git 那种日期字符串。`result_code` 这一列，有的日志根本没有。缺一列就把整页打空白，看板比没有还糟。

同一版开始认真估费用：按模型、按天、按会话，再看缓存命中省了多少。数字仍然是估算。各家日志字段不齐，只能容忍，并写清楚哪里是猜的。

后面两天连发 0.3.1、0.3.2。演示页还在 [heggria.github.io/agent-usage-atlas/demo](https://heggria.github.io/agent-usage-atlas/demo/)。仓后来归档了。本机用量后来换了别的入口。这一周把它做成了能安装的东西。
