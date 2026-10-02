---
title: "jcode 停下后，仍想解决的会话问题"
date: 2026-05-18T00:00:00.000+08:00
description: "模型切换和会话命名方便交互，但要继续一项工作，仍得从聊天记录里整理修改理由。"
lang: zh
tags: [agent, 工程判断, taskflow]
---

那年春天，我试过几种 coding agent 界面，[jcode](https://github.com/heggria/jcode) 是其中一个。它支持切换模型提供方、修改会话名，也把路由遥测放进选择器。

这些功能方便当前的操作，但继续一项工作时，仍要从聊天记录里整理此前为什么修改。多次修正都保存下来了，不代表修改理由已经容易找到。

五月八号我把 jcode 归档了，代码还能跑。六月开始写 [taskflow](https://github.com/heggria/taskflow) 时，想试着把多步工作写成可以验证、暂停和重新打开的流程。这是后续的尝试，当时还没有完整方案。
