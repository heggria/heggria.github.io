---
title: q8p 卡死了
date: 2026-04-23T00:00:00.000+08:00
description: 家庭工房接 Wan 2.2 I2V。macOS 26 上 q8p 会死锁，退回 q6p_svd，再把 14B 收到 832×448。
duration: 3min
lang: zh
tags: [工房, 踩坑]
---

四月二十三号，家里的 Telegram 工房接上了 Wan 2.2 图生视频。后端从 gRPC 改成 `draw-things-cli` 子进程。进度条加了心跳，不然十分钟没输出会以为死了。

量化档试过 q8p。在当时的 macOS 26 上会直接死锁。提交记录是退回 `q6p_svd`。14B 再往下收到 832×448、41 帧、12 step，一次大约二十五分钟，还能交互着玩。尺寸还得对齐 64，448×832 可以，480×832 不行。

Telegram 走代理时，SSL 校验和 `ProxyConnector` 也踩过一层。这些修法只对这台机器和当时那个 DrawThings 版本成立。仓留在私有目录。
