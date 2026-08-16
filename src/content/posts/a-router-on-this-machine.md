---
title: 本机路由
date: 2026-04-03T00:00:00.000+08:00
description: 把模型别名、密钥门禁和供应商拆成单独服务。第一家接上的是智谱 Coding Plan。
duration: 2min
lang: zh
tags: [路由, 工具]
---

四月三号，本机多了一个叫 Switchboard 的小服务。OpenAI 兼容的 `/v1/chat/completions`，别名转到具体模型，按 key 做允许列表。第一家供应商是智谱 Coding Plan：`glm-5.1`、`glm-5`、`glm-5-turbo` 都走同一条 coding 通道。

它是从本机那堆路由配置里拆出来的。继续堆在安装脚本里，下次换一家供应商又要改一圈。单独成服务之后，至少配置文件和客户端是分开的。

仓是私有的，后来进了厨房。对外没有安装入口。当天能用的就是：本机起一个 8080，coding 请求有地方可去。
