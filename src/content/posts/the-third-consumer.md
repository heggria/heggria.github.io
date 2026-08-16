---
title: 第三家
date: 2026-08-03T00:00:00.000+08:00
description: CharterArc 接进 taskflow 那天，缺的字段和 fail-closed 都爆出来。npm latest 也在同一天。
duration: 3min
lang: zh
tags: [taskflow, CharterArc, 契约]
---

CharterArc 是 [taskflow](https://github.com/heggria/taskflow) 里一层实验性的项目维护：声明式地选流程，治理变更上 fail-closed。它没有单独的开源仓。八月三日记下「第三个消费者激活」。

前两个消费者知道你没写进 schema 的 implicit 约定。第三家不知道。缺的字段、没读到 deny 时该不该拒绝、路由够不够声明式，都会在这里爆出来。

同日还修了两件发版上的事。npm 首次发布时 `latest` 标签的不变量，以及回放必须对着发版那个 commit。发版也按字面消费你写出的版本，不听口头补充。
