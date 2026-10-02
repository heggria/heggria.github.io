---
title: "检索 CLI 里区分搜索摘要和正文"
date: 2026-04-24T00:00:00.000+08:00
description: "web-surfing-cli 的 verify 抓取正文并记录 sha256 与 fetched_at，避免把搜索结果当成已读来源。"
lang: zh
tags: [检索, 证据, cli]
---

四月二十四号，[web-surfing-cli](https://github.com/heggria/web-surfing-cli) 做了 TypeScript 实现、缓存、交叉验证和 MCP，命令叫 `wsc`。文档检索用 Context7，发现用 Exa，网页用 Tavily，正文抓取用 Firecrawl，DuckDuckGo 作为兜底。

当天 DuckDuckGo 的 POST 接口返回反爬的 202，改为 GET 并加上浏览器头后才搜到结果。

另一个问题是，agent 会引用 `wsc search` 返回的 URL，但实际上只拿到了搜索摘要。于是加了 `verify`：抓取正文，记录 sha256 和 `fetched_at`，让回执能说明抓取了哪份内容。

`--corroborate` 并行查询几家服务、按 URL 去重，回执标记 `multi_source_evidence`。这个标记描述检索结果，引用时仍需查看原文，不能把多个服务返回同一个 URL 当成已经读过正文。

同一天也做了看板 CLI 和 MCP 工具 CLI。检索仓后来归档，收进个人工具仓。
