---
title: Vue 原理：响应式编程（二）
date: 2024-10-17T16:00:00.000+00:00
duration: 15min
---

接下来我们继续深入了解 Vue 的响应式编程原理。下文皆以 [`@vue/reactivity@3.5.12`](https://github.com/vuejs/core/tree/main/packages/reactivity/src) 包源码作为参考。

# 文件结构

下面列出 `packages/reactivity/src` 的文件列表，，并对这些文件进行简单的分类，可以看到组成非常简单，一共就 13 files + 2539 codes：

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

在本篇文章，我们重点研究响应式基础部分的源码。

# effectScope.ts

> 在Vue的响应式系统中，副作用是指那些根据响应式状态变化而自动执行的函数，如计算属性（computed）和侦听器（watchers）。

**`EffectScope`** 类是 vue 响应式的基石，提供了一种方式来组织响应式副作用。**`EffectScope`** 让你能够批量控制副作用的激活和停止。这对于在组件卸载时清理副作用特别有用，防止内存泄漏。

下面我们来详细看看 **`EffectScope`** 类的设计：

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

> 💡 接收一个 **`detached`** 参数，用于决定新建的EffectScope是否独立于当前激活的EffectScope。如果不是独立的，将当前的 **`EffectScope`** 实例（即 **`this`** ）添加到父作用域（**`activeEffectScope`**）的子作用域列表（**`scopes`**）中，并记录当前实例在父作用域子作用域列表中的位置（索引）。

我们先来了解什么是作用域：当我们谈论活动作用域（activeEffectScope）和子作用域（sub-scopes）时，我们实际上是在讨论一种层级结构或**作用域树**，这在Vue的响应式系统中用于管理副作用（如计算属性和侦听器）。

1. **活动作用域（Active Effect Scope）**：
   活动作用域是当前正在被Vue响应式系统跟踪的作用域。**在任何给定时间点，只有一个活动作用域（全局唯一实例，使用 let 声明）。**这个概念类似于当前正在执行的代码块或环境。当你创建新的响应式副作用时（例如，一个计算属性或侦听器），它会自动**注册**到当前的活动作用域。这意味着这个副作用的生命周期（比如，它的激活和停止）受到所属作用域的控制。
2. **子作用域（Sub-scopes）**：
   子作用域是从另一个作用域（父作用域）中创建的作用域。它继承了父作用域的一些特性，比如副作用的管理和生命周期控制，但同时也可以独立于父作用域进行操作。子作用域允许将副作用按逻辑或功能组织成不同的组，每个组可以单独管理。

![截屏2024-03-19 15.40.45.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b1d9c552afc64699a7cef49ff3da4520~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=842&h=424&s=158036&e=png&b=f9f9f9)

这种设计使得Vue的响应式系统能够按照一种结构化的方式来管理副作用，提高了副作用管理的灵活性和效率。具体来说：

- **层级管理**：通过活动作用域和子作用域的层级结构，可以精细地控制副作用的激活和停止。例如，当一个组件被销毁时，所有属于该组件（及其子组件）的副作用可以通过停止相应的作用域来一次性清理，从而避免内存泄露。
- **作用域隔离**：在某些情况下，可能需要创建与当前活动作用域独立的作用域（通过传递 **`detached`** 参数）。这种隔离可以用于特殊场景，比如跨组件共享的响应式状态，或者在某些需要长期存在的副作用中，它们的生命周期不应该被当前组件的销毁所影响。

允许开发者在需要的时候创建一个与当前活动作用域（activeEffectScope）独立的新作用域（EffectScope），或者将新作用域作为当前活动作用域的子作用域。这种设计有几个关键好处：

1. **模块化和组织性**：通过允许新的EffectScope作为当前活动EffectScope的子作用域，Vue提供了一种自然的方式来模块化和组织副作用。这对于维护大型应用的状态和副作用特别有用，可以清晰地将副作用组织在不同的作用域中，便于管理和理解。
2. **灵活的副作用控制**：有时，你可能希望创建一个副作用作用域，但不希望它与当前的活动作用域有直接关联。例如，在一些独立的库或工具函数中使用副作用时，可能不希望它们的生命周期与当前组件的生命周期直接绑定。通过 **`detached`** 参数，你可以灵活地控制这个作用域的独立性，避免不必要的依赖。
3. **细粒度的生命周期管理**：在Vue应用中，组件的挂载和卸载可能导致大量副作用的创建和销毁。将EffectScope与组件的生命周期紧密绑定，可以在组件卸载时自动停止其所有副作用，防止内存泄露。对于那些需要跨组件共享或者在组件卸载后仍需继续存在的副作用，**`detached`** 参数提供了一种方式来防止这些副作用被自动停止。
4. **更好的性能优化**：在某些情况下，避免创建不必要的子作用域可以减少内存使用和垃圾回收的压力，尤其是在这些作用域会频繁创建和销毁的场景下。**`detached`** 参数允许开发者根据具体情况决定是否需要这样的子作用域。

整个机制提供了一种灵活的方式来管理Vue应用中的响应式副作用，特别是在组件生命周期结束时自动清理副作用，避免内存泄露的问题。

## `active` 激活状态

> 💡 控制副作用是否可以被执行，方法分别用于激活和停止EffectScope，改变当前激活的Scope。

**`active`** 属性标识EffectScope是否激活，只有激活状态的Scope才能运行其中的副作用。为了管理和控制Vue中响应式副作用（如计算属性和侦听器）的生命周期。例如，当响应式数据变化时自动更新DOM的渲染函数。通过EffectScope的激活状态，Vue可以精确地控制这些副作用的激活和停止。

在组件卸载或不需要响应式更新的场景下，可以通过停用EffectScope来停止其中所有副作用的执行。这有助于避免不必要的计算和监听，从而节省资源，提高应用性能。组件卸载时，相关的响应式副作用如果不被适当停止和清理，可能会因为闭包等原因持续占用内存。

通过EffectScope的停用操作，可以确保这些副作用被正确清理，防止内存泄漏。EffectScope允许开发者在更细粒度上管理副作用。例如，你可以在特定的场景下临时停用某个EffectScope，而不影响其他副作用的执行。这在处理复杂的响应式逻辑时非常有用。

## `pause` 暂停状态

> 💡 暂停和恢复EffectScope，暂停后的Scope不会执行副作用。

**`pause`** 和 **`resume`** 方法用于暂停和恢复EffectScope，暂停后的Scope不会执行副作用。这对于一些特殊场景非常有用，比如在某些情况下暂时禁用某个副作用，或者在组件卸载时暂停所有副作用的执行。

通过暂停EffectScope，可以避免不必要的计算和监听，节省资源，提高应用性能。暂停后的EffectScope不会执行其中的副作用，直到恢复为止。这种机制允许开发者在需要的时候暂停和恢复副作用，从而更灵活地控制副作用的执行。

## **`on`、`off`、`pause`、`resume`、`run`、`stop`** 生命周期控制

> 💡 在当前激活的 **`EffectScope`** 中安全地执行一个函数 **`fn`**，同时确保函数执行期间，**`this`** 所代表的 **`EffectScope`** 成为当前激活的作用域。

![截屏2024-03-19 15.39.27.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c6646e03773d4226ac7e1a2233f95202~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=958&h=578&s=242451&e=png&b=fbfafa)

- **`on`** 和 **`off`** 方法分别用于激活和停止EffectScope，改变当前激活的Scope。
- **`pause`** 和 **`resume`** 方法用于暂停和恢复EffectScope，暂停后的Scope不会执行副作用。
- **`run`**：在当前激活的 **`EffectScope`** 中安全地执行一个函数 **`fn`**，同时确保函数执行期间，**`this`** 所代表的 **`EffectScope`** 成为当前激活的作用域。
- **`stop`**：停止 **`EffectScope`** 及其所有的副作用（effects），执行所有注册的清理（cleanup）函数，并递归地停止所有子作用域（scopes）。这个方法主要在需要停用某个作用域时使用，比如当一个Vue组件卸载时，可以通过停用与之关联的作用域来防止内存泄露。
  - **停止所有副作用、执行清理函数、递归停止子作用域**
  - **作用域移除**：如果当前作用域不是一个独立的（detached）作用域，并且有父作用域（**`this.parent`**存在），且这次停止操作不是由父作用域发起的（**`!fromParent`**），则需要从父作用域的 **`scopes`** 数组中移除当前作用域，以避免内存泄露。

**优化的移除方法（时间复杂度 O(1)）：将父作用域的`scopes`数组的最后一个元素弹出，如果弹出的不是当前作用域，则将它放到当前作用域在数组中的位置，** 这样可以保持数组的连续性并且避免遍历整个数组来查找并移除当前作用域。

![截屏2024-03-19 15.49.20.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6eadff93a27544c298ac3847e08a363f~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1138&h=418&s=63517&e=png&b=fdfcfc)

- [源码地址](https://github.com/vuejs/core/blob/main/packages/reactivity/src/effectScope.ts#L2)
- [RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0041-reactivity-effect-scope.md)
