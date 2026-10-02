---
title: "第三个接入方暴露了未写清的约定"
date: 2026-08-03T00:00:00.000+08:00
description: "CharterArc 接入 taskflow 时，检查了 schema 字段、拒绝策略和声明式路由，也处理了发版问题。"
lang: zh
tags: [taskflow, CharterArc, 契约]
---

CharterArc 是 [taskflow](https://github.com/heggria/taskflow) 里实验性的项目维护层，用声明式配置选择流程，治理变更采用 fail-closed 策略，没有单独的开源仓。八月三号的记录写着「第三个消费者激活」。

这次接入暴露了此前没有写进 schema 的约定：缺少哪些字段，没有读到 deny 时如何处理，路由是否能用声明式配置表达。接入方无法依靠原作者脑中的约定，需要把这些规则写清楚。

同一天还处理了 npm 首次发布时 `latest` 标签的不变量，以及回放对应发版 commit 的要求。检查版本时，也要检查回放使用的是不是同一份代码。
