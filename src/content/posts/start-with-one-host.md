---
title: taskflow 第一天
date: 2026-06-04T00:00:00.000+08:00
description: 只服务 Pi。没有五宿主，没有文档站。进度条、心跳、spinner 当天都修过。
duration: 3min
lang: zh
tags: [taskflow, Pi, 编排]
---

[taskflow](https://github.com/heggria/taskflow) 第一天只服务 Pi。没有五个宿主，没有文档站，没有 TypeScript DSL。我想在一个已经在用的 agent 里，把多步工作写成能跑完的流程。

当天版本跳得很快。进度条对不齐，心跳丢，spinner 转错，扇出完成了界面却显示 0。这些都不体面。它们比「先设计平台」靠近真实使用。

晚上才有真正能停住的 gate：流程可以在某个条件上挂住，而不是一路聊到看起来像结束。名字当时叫 pi-taskflow。这个名字后来不够用。第一天够用。
