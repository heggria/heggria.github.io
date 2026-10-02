---
title: Vue 原理：响应式编程（二）
date: 2024-10-17T16:00:00.000+00:00
---

接着上一篇看源码。这篇以 `@vue/reactivity@3.5.12` 为阅读语境，先整理文件分工，再看 `EffectScope`。保留的[源码链接](https://github.com/vuejs/core/tree/main/packages/reactivity/src)指向 main 分支，打开时的内容可能与当时版本不同。

# 文件结构

当时统计 `packages/reactivity/src` 有 13 个文件、2539 行代码。我按下面几类整理：

- 响应式基础

  - `baseHandlers.ts`：基础的响应式处理
  - `dep.ts`：依赖的处理
  - `effect.ts`：副作用的处理
  - `effectScope.ts`：副作用的作用域

- 特殊响应式对象处理

  - `arrayInstrumentations.ts`：数组的响应式处理
  - `collectionHandlers.ts`：集合的响应式处理

- 响应式 API

  - `reactive.ts`：响应式的处理
  - `ref.ts`：引用的处理
  - `computed.ts`：计算属性的处理
  - `watch.ts`：监听的处理

- 工具文件

  - `constants.ts`：常量
  - `index.ts`：入口文件
  - `warning.ts`：警告的处理

这篇先看响应式基础里的 `effectScope.ts`。

# effectScope.ts

> 在Vue的响应式系统中，副作用是指那些根据响应式状态变化而自动执行的函数，如计算属性（computed）和侦听器（watchers）。

`EffectScope` 用来组织一组响应式副作用与清理函数，让它们可以一起停止。读它时，重点看父子作用域如何关联，以及退出作用域时如何清理。下面保留类的结构提纲，方法体省略：

```tsx
// 全局唯一的活动作用域
let activeEffectScope: EffectScope | undefined

export class EffectScope {
  // 是否为激活态
  private _active = true
  // 副作用
  effects: ReactiveEffect[] = []
  // 清理函数
  cleanups: (() => void)[] = []
  // 是否暂停
  private _isPaused = false
  // 父作用域
  parent: EffectScope | undefined
  // 子作用域
  scopes: EffectScope[] | undefined
  // 在父作用域的 scopes 的 index
  private index: number | undefined

  // 构造函数，可以声明是否独立于 activeEffectScope
  constructor(public detached = false) {}
  get active()
  pause()
  resume()
  run<T>(fn: () => T): T | undefined
  on()
  off()
  stop(fromParent?: boolean)
}

// 工厂函数，返回一个新的 effectScope 实例
export function effectScope(detached?: boolean)

// 获取 activeEffectScope
export function getCurrentScope()

// 在当前激活的EffectScope上注册一个清理回调，该回调会在Scope停止时被调用
export function onScopeDispose(fn: () => void)
```

## constructor 构造函数

构造函数接收 `detached`，决定新作用域是否加入当前活动作用域的子作用域列表。非独立作用域会记录父作用域，以及自己在父级 `scopes` 数组里的索引。

这里有两个概念要分开：

- `activeEffectScope` 是当前活动作用域的引用，创建副作用时用来确定归属。它只有一个当前值，不代表系统只能有一个作用域实例。
- `scopes` 保存子作用域。子作用域可以按功能分别管理，父作用域停止时也能递归清理它们。

![截屏2024-03-19 15.40.45.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b1d9c552afc64699a7cef49ff3da4520~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=842&h=424&s=158036&e=png&b=f9f9f9)

`detached` 适用于不希望和当前作用域一起结束的副作用。例如跨组件共享的状态，或者组件卸载后仍需存在的工具逻辑。这里的重点是生命周期边界，而不是把所有副作用都放进同一个作用域。

## `active` 激活状态

`active` 表示作用域是否仍处于激活状态。停止作用域时，需要停止其副作用、执行清理回调。否则，监听和闭包可能在组件卸载后继续占用资源。

## `pause` 与 `resume`

`pause`、`resume` 用来暂停和恢复作用域中的副作用，和彻底 `stop` 是不同的控制。需要暂时停用一组响应式逻辑时，可以关注这两个方法。

## **`on`、`off`、`pause`、`resume`、`run`、`stop`** 生命周期控制

> 💡 在当前激活的 **`EffectScope`** 中安全地执行一个函数 **`fn`**，同时确保函数执行期间，**`this`** 所代表的 **`EffectScope`** 成为当前激活的作用域。

![截屏2024-03-19 15.39.27.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c6646e03773d4226ac7e1a2233f95202~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=958&h=578&s=242451&e=png&b=fbfafa)

- **`on`、`off`**：切换当前活动作用域。这里的 `off` 不要和清理副作用的 `stop` 混为一谈。
- **`pause`、`resume`**：暂停和恢复作用域中副作用的响应，不等同于永久清理。
- **`run`**：执行 `fn` 时，让这个 `EffectScope` 成为当前活动作用域。这里的“安全”只是在说作用域切换，不能理解为函数本身不会报错或产生副作用。
- **`stop`**：停止 **`EffectScope`** 及其所有的副作用（effects），执行所有注册的清理（cleanup）函数，并递归地停止所有子作用域（scopes）。这个方法主要在需要停用某个作用域时使用，比如当一个Vue组件卸载时，可以通过停用与之关联的作用域来防止内存泄露。
  - **停止所有副作用、执行清理函数、递归停止子作用域**
  - **作用域移除**：如果当前作用域不是一个独立的（detached）作用域，并且有父作用域（**`this.parent`**存在），且这次停止操作不是由父作用域发起的（**`!fromParent`**），则需要从父作用域的 **`scopes`** 数组中移除当前作用域，以避免内存泄露。

移除时使用 O(1) 的交换方式：弹出父作用域 `scopes` 的最后一个元素；如果它不是当前作用域，就把它放进当前作用域原来的位置。这样不需要遍历查找，也不需要移动后面的整段数组。

![截屏2024-03-19 15.49.20.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6eadff93a27544c298ac3847e08a363f~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1138&h=418&s=63517&e=png&b=fdfcfc)

- [源码地址](https://github.com/vuejs/core/blob/main/packages/reactivity/src/effectScope.ts#L2)
- [RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0041-reactivity-effect-scope.md)
