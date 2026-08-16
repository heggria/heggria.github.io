---
title: 结果页是空白
date: 2026-04-11T00:00:00.000+08:00
description: SBTI Lab 上线第二天。handleAnswer 里过期的 Zustand 闭包，答完题结果页空白。
duration: 3min
lang: zh
tags: [SelfField, 踩坑]
---

四月十号，[SBTI Lab](https://heggria.github.io/selffield/) 第一版上了 GitHub Pages：测评流、CI、SEO、分包。第二天，答完题，结果页空白。

原因写在提交里：`handleAnswer` 抓了一份过期的 Zustand 闭包。状态已经改了，页面还在看旧的那一份。答案在内存里走了一圈，渲染的时候丢掉了。

一面声称要留证据的镜子，第一夜就把证据弄丢。那种 bug 很丢脸，也很好修。修完才敢让别人打开。七月改名 SelfField。空白页这件事还是四月十一号的。
