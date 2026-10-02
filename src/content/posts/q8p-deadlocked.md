---
title: "Wan 2.2 图生视频在本机的运行参数"
date: 2026-04-23T00:00:00.000+08:00
description: "当时 macOS 26 上 q8p 死锁，改用 q6p_svd，14B 降到 832×448、41 帧、12 step。"
lang: zh
tags: [工房, 踩坑]
---

四月二十三号，家里的 Telegram 工房接入了 Wan 2.2 图生视频，后端从 gRPC 换成 `draw-things-cli` 子进程。进度条也加了心跳，长时间没有输出时仍能看到任务在运行。

当时试 q8p，在 macOS 26 上出现死锁，提交记录里的处理是退回 `q6p_svd`。14B 使用 832×448、41 帧、12 step，一次大约二十五分钟。尺寸需要对齐 64：448×832 可以，480×832 不行。

Telegram 通过代理连接时，还处理过 SSL 校验和 `ProxyConnector` 的问题。这些参数与修法对应这台机器、当时的 DrawThings 版本，仓库没有公开。
