---
title: 摘要不是引用
date: 2026-04-24T00:00:00.000+08:00
description: web-surfing-cli 一天里从脚手架走到 v0.4。DuckDuckGo 的 POST 接口回 202。search 拿到的 URL，很多没读过。
duration: 4min
lang: zh
tags: [检索, 证据, cli]
---

四月二十四号，[web-surfing-cli](https://github.com/heggria/web-surfing-cli) 从脚手架写到 TypeScript、缓存、交叉验证、MCP。命令叫 `wsc`。文档走 Context7，发现走 Exa，网页走 Tavily，抓正文走 Firecrawl，兜底是 DuckDuckGo。

DuckDuckGo 的 POST 接口当天回的是反爬的 202。改成 GET，加上浏览器头，才能搜。

更烦的是引用。agent 会把 `wsc search` 返回的 URL 写成「读过」。很多只是搜索摘要。于是有了 `verify`：抓正文，打 sha256 和 `fetched_at`。`--corroborate` 会并行问几家，按 URL 去重，回执里标 `multi_source_evidence`。技能文件里写了一句：摘要不是引用。

同一天还有看板 CLI、MCP 工具 CLI。能留下来反复打开的，是这条检索命令。仓后来归档，收进厨房。
