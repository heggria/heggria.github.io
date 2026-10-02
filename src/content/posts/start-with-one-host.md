---
title: "taskflow 从 Pi 上的多步流程开始"
date: 2026-06-04T00:00:00.000+08:00
description: "六月四号的 pi-taskflow 只支持 Pi，当天修了进度显示，并加入可以暂停流程的 gate。"
lang: zh
tags: [taskflow, Pi, 编排]
---

[taskflow](https://github.com/heggria/taskflow) 六月四号的第一版叫 pi-taskflow，只支持 Pi。我想先在已经使用的 agent 里，把多步工作写成可执行的流程。那时还没有多宿主支持、文档站和 TypeScript DSL。

当天修了几处进度显示：进度条不对齐、心跳丢失、spinner 状态不对，扇出任务完成后界面仍显示 0。流程的执行结果和界面显示需要一致。

晚上加了 gate，可以在指定条件处暂停流程。之后接入更多宿主，项目才改名为 taskflow。
