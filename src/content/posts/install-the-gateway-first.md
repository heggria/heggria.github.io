---
title: 先装网关
date: 2026-04-27T00:00:00.000+08:00
description: coding-gateway-installer 第一版用 LiteLLM，Python 3.14 启动就崩。当天改成 claude-code-router，并补了 e2e.sh。
duration: 3min
lang: zh
tags: [网关, 安装, 踩坑]
---

四月二十七号写了一个一层网关安装器。目标很具体：本机 coding agent 要有统一入口，别每个工具自己填一遍密钥和路由。

第一版绑的是 LiteLLM。在当时的 Python 3.14 上，进程起来就崩。文档里还有几处和官方对不上。当天把 LiteLLM 整段换成 `claude-code-router`，再补 `tests/e2e.sh`，顺手修了两个 wrapper。

它后来进了私有的 cli-lab，发布列表是空的。五月那篇厨房写的是归档。这一天写的是：安装脚本如果不能在自己的机器上跑完，后面的路由策略都还没开始。
