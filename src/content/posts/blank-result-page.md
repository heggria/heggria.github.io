---
title: "Zustand 旧闭包导致结果页空白"
date: 2026-04-11T00:00:00.000+08:00
description: "SBTI Lab 上线第二天，handleAnswer 使用过期的 Zustand 闭包，答完题仍显示空白结果页。"
lang: zh
tags: [SelfField, 踩坑]
---

四月十号，[SBTI Lab](https://heggria.github.io/selffield/) 第一版上了 GitHub Pages，包含测评流程、CI、SEO 和分包。第二天就修了一处结果页空白的问题。

提交记录里的原因是 `handleAnswer` 使用了过期的 Zustand 闭包。状态已经更新，处理函数读的还是旧状态，答完题后没有正确显示结果。

这处修复发生在四月十一号。七月项目改名为 SelfField。
