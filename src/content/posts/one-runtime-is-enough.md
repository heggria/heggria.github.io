---
title: "overstory 实验后来并入 taskflow"
date: 2026-06-13T00:00:00.000+08:00
description: "overstory 试过 driver、scheduler、扇出和循环，后续迭代归到 taskflow，没有单独维护运行时。"
lang: zh
tags: [overstory, taskflow, 取舍]
---

六月十三号，[overstory](https://github.com/heggria/overstory) 做了 driver、scheduler、map 扇出、loop、子流程和 Pi 扩展，尝试提供一套独立的编排运行时。

继续做下去，就需要另行维护安装、文档、版本和宿主适配。后来相关迭代并入 [taskflow](https://github.com/heggria/taskflow)，扇出、循环和子流程的思路也保留下来。

overstory 留作实验记录，对外提供的运行时集中在 taskflow。
