---
title: "网关安装器从 LiteLLM 换到 claude-code-router"
date: 2026-04-27T00:00:00.000+08:00
description: "四月二十七号，LiteLLM 在本机 Python 3.14 上启动失败，安装器当天改用 claude-code-router。"
lang: zh
tags: [网关, 安装, 踩坑]
---

四月二十七号写了一个网关安装器，希望给本机 coding agent 提供统一入口，减少在不同工具里重复配置密钥和路由。

第一版用 LiteLLM，在当时本机的 Python 3.14 上启动就崩了，文档还有几处与官方内容不一致。当天改用 `claude-code-router`，补了 `tests/e2e.sh`，并修了两个 wrapper。

这只是当时本机的安装记录，不能据此判断 LiteLLM 在其他环境里的表现。安装器后来归入私有的 cli-lab，没有发布。
