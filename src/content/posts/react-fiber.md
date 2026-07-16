---
title: 谈谈 React Fiber
date: 2022-06-27T16:00:00.000+00:00
duration: 30min
---

Reference: https://github.com/acdlite/react-fiber-architecture

## 概述

React Fiber 是 React 16 的一个 Feature。我们都知道 React 本质是一个 UI 框架，其主要解决的是数据到 UI 的映射问题。其中一个问题是，如果有一段不能被打断的 JS 代码正在运行，那么由于 JS 本身是单线程的，浏览器的渲染就会被阻塞。因此，Fiber reconciler 应运而生。

## 准备

我们假定你对数据结构、操作系统、JavaScript等已经有了一定的了解。

建议你先了解以下知识：

- [React 组件、元素和实例——“组件”通常是一个重载的术语。牢牢掌握这些术语至关重要。](https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html)

- [Reconciliation - React 的协调算法。](https://reactjs.org/docs/reconciliation.html)

- [React 基本理论的概念。](https://github.com/reactjs/react-basic)

- [React 设计原则 - 特别注意调度部分。它很好地解释了 React Fiber 的原因。](https://reactjs.org/docs/design-principles.html)

好了，让我们总结一下：

### Reconciliation

众所周知，要想让 HTML 页面发生 CSS 做不到的变化，就只能用 JS 更新 DOM。

但 DOM 全部重新渲染一遍太慢了。我们需要“**找不同”**：将需要渲染的 DOM 和之前的 DOM 进行对比，提交那些不一样的地方，这样不是快很多嘛。

![截屏2022-07-07 11.17.57.png](/images/react-fiber/1.png)

React 就是这么一个框架，你写代码时可以把整个应用当做每次都重新渲染来编写，剩下的脏活（包括哪部分重新渲染，哪部分不重新渲染），它帮你处理。

这里就有一个**虚拟 DOM** 的概念，React 预先在虚拟 DOM 上操作，之后再提交更改到浏览器。

- 如果某棵子树的组件类型和之前不一样，那么 React 不管里面一不一样，全部替换。
- 遍历生成的列表，差异对比使用 `key` 属性。要求是“稳定的、可预测的和唯一的”，所以不建议使用每个项的 `index` 作为 `key`。

当然需要指出的是，由于 React Nactive (可以在 iOS & Android 原生运行的 React)也是这么一套机制，使用虚拟 DOM 称呼就不恰当了，所以我们用 **Reconciliation** 来称呼。

### **Scheduling**

在没有多线程的时代，一个单线程 CPU 如何同时运行多个任务？

我们可以运用通讯理论里面的**时间分片**的理念，将一个大任务细分为不同的子任务，然后将时间线分割成等长的一段段，这样我们就可以往里面塞不同任务的任务片。

![截屏2022-07-07 11.42.16.png](/images/react-fiber/2.png)

由于计算机的速度很快，我们是不会察觉到任务的实际运行是间断的。那么如果我有些任务很急，想要优先执行，有些任务重 IO，很长时间不会响应，如何对这些任务进行运行调度呢？

操作系统就是一个解决方案，而 Fiber reconciler 本身实现了部分现代操作系统的核心调度器，从而对各种情况的渲染进行自动安排、优化。

![截屏2022-07-07 11.53.54.png](/images/react-fiber/3.png)

## 我们需要什么

为了防止执行时间长的任务长时间阻塞线程，我们需要实现一个机制达成以下目标：

- 可以暂时放下手中的工作，稍后继续。
- 手中的工作有缓有急，可以分配不同的优先级。
- 之前已经执行完的工作，就不需要重复执行了，重用。
- 不需要执行的工作，直接中止。

![截屏2022-07-07 11.26.51.png](/images/react-fiber/4.png)

为了实现这个机制，我们首先需要一种将工作分解为单元的方法。从某种意义上说，这就是 Fiber，中文译名为纤程，一个纤程就是一个工作单元。

我们先回到起点，渲染一个 React 应用程序类似于调用一个函数，该函数的主体又包含对其他函数的调用，最后会形成一个调用堆栈。

![截屏2022-07-07 12.04.48.png](/images/react-fiber/5.png)

而我们都知道，JS 是单线程的，如果这个堆栈一次执行太多的工作，可能会导致浏览器自己的渲染掉帧，看起来不流畅。更重要的是，有些工作可能是不必要的，比如它被最近的更新所取代了。

### [**`requestIdleCallback`**](https://developers.google.com/web/updates/2015/08/using-requestidlecallback)

为了解决这个问题，浏览器们提供了一个叫 `requestIdleCallback` 的 API，与 `requestAnimationFrame` 一起使用可以实现调度。`requestIdleCallback` 安排一个低优先级的回调函数在浏览器渲染帧结束后的**空闲期**被调用，`requestAnimationFrame` 安排一个高优先级的函数在**下一个动画帧**被调用。

![截屏2022-07-07 17.19.35.png](/images/react-fiber/6.png)

看看下面这段代码，我们通过`requestIdleCallback` 调用一个低优先的任务，这个任务入参是一个 `deadline` ，它有 `timeRemaining` 这么一个获取剩余空余时间的函数，如果这个任务会持续执行至 `timeRemaining()` 等于0，如果任务没执行完，会进入下一个空余时间回调队列。

```tsx
function lowPriorityWork(deadline) {
  while (deadline.timeRemaining() > 0 && workList.length > 0)
    performUnitOfWork()

  if (workList.length > 0)
    requestIdleCallback(lowPriorityWork)
}
```

如果我们可以自定义调用堆栈的行为以优化渲染 UI，那不是很好吗？如果我们可以随意中断调用堆栈并手动操作堆栈帧，那不是很好吗？

这就是 React Fiber 的目的。 Fiber 是 JS 堆栈的重新实现，专门用于 React 组件。你可以将一个纤程视为一个虚拟的堆栈帧。

## Fiber 是什么

好吧，下面代码中每一个 DOM 或者 ReactNode 都是一个 Fiber。

```tsx
function App() {
  return (
    <div className="wrapper">
      <div className="list">
        <div className="list_item">List item A</div>
        <div className="list_item">List item B</div>
      </div>
      <div className="section">
        <button>Add</button>
        <span>No. of items: 2</span>
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
```

当然，这里并不是说我们能直接写一大堆 Fiber 出来，我们写出的 JSX 代码会通过 React 的 JSX 编译器转成一个个的 Fiber 结点。Fiber 的数据结构如下：

```tsx
export interface Fiber {
  // Tag identifying the type of fiber.
  tag: TypeOfWork

  // Unique identifier of this child.
  key: null | string

  // The value of element.type which is used to preserve the identity during
  // reconciliation of this child.
  elementType: any

  // The resolved function/class/ associated with this fiber.
  type: any

  // The local state associated with this fiber.
  stateNode: any

  // Remaining fields belong to Fiber

  // The Fiber to return to after finishing processing this one.
  // This is effectively the parent.
  // It is conceptually the same as the return address of a stack frame.
  return: Fiber | null

  // Singly Linked List Tree Structure.
  child: Fiber | null
  sibling: Fiber | null
  index: number

  // The ref last used to attach this node.
  ref: null | (((handle: mixed) => void) & { _stringRef: string }) | RefObject

  // Input is the data coming into process this fiber. Arguments. Props.
  pendingProps: any // This type will be more specific once we overload the tag.
  memoizedProps: any // The props used to create the output.

  // A queue of state updates and callbacks.
  updateQueue: mixed

  // The state used to create the output
  memoizedState: any

  mode: TypeOfMode

  // Effect
  effectTag: SideEffectTag
  subtreeTag: SubtreeTag
  deletions: Array<Fiber> | null

  // Singly linked list fast path to the next fiber with side-effects.
  nextEffect: Fiber | null

  // The first and last fiber with side-effect within this subtree. This allows
  // us to reuse a slice of the linked list when we reuse the work done within
  // this fiber.
  firstEffect: Fiber | null
  lastEffect: Fiber | null

  // This is a pooled version of a Fiber. Every fiber that gets updated will
  // eventually have a pair. There are cases when we can clean up pairs to save
  // memory if we need to.
  alternate: Fiber | null
}
```

属性很多，我们取几个重要的出来详细说明。

### **`type` & `key`**

这两个属性是直接从我们创建的 React 组件复制过来的，`type` 描述了一个 Fiber 的类型，如果是复合组件（<App />），那么 `type` 就是组件本身，如果是宿主组件（div、span），`type` 就是一个字符串。`type` 与 `key` 一起作为判断 Fiber 是否可重用的依据。

### **`child` & `sibling`**

这两个属性指向其他 Filber，`child` 指向孩子结点，`sibling` 指向兄弟结点。这代表着 Filber 之间的直接关系是单链表树形结构。`return` 就是返回上一个堆栈。

![截屏2022-07-07 17.36.28.png](/images/react-fiber/7.png)

### **`pendingProps` & `memoizedProps`**

每个 Fiber 都是一个纯函数，所以我们可以通过判断之前的输入 `memoizedProps` 是否等于当前输入`pendingProps` 来判断函数输出是否可以重用。

### **`pendingWorkPriority`**

一个数字，表示纤程的工作优先级。 ReactPriorityLevel 模块列出了不同的优先级以及它们代表的内容。除了 NoWork 是 0，其他情况下数字越大表示优先级越低。例如，可以使用以下函数来检查纤程的优先级是否至少与给定级别一样高：

```tsx
function matchesPriority(fiber, priority) {
  return fiber.pendingWorkPriority !== 0
    && fiber.pendingWorkPriority <= priority
}
```

### **`alternate`**

`alternate` 就是 Fiber 要渲染的东西的缓存，在 React 中就是 **current tree** 和 **workInProgress tree**。

我们区分一下**，**当前 UI 正在渲染的就是 current tree，当 存在更新的时候，React 会先生成一个 workInProgress tree 并在上面工作、进行下一次渲染，一旦 UI 完成 workInProgress tree 渲染，它就会变成 current tree。

![截屏2022-07-07 17.57.06.png](/images/react-fiber/8.png)

## Fiber Reconciler **工作原理**

每个 Fiber 结点拥有着自己的生命周期。这就用到我们上面那张流程图了：

![截屏2022-07-07 11.26.51.png](/images/react-fiber/9.png)

### Fiber Tree 构建与更新

一开始可是没有什么树的，我们要先构建一颗 Fiber Tree 出来。算法其实就是深度遍历的变体，不同之处在于这里进入一个结点完成处理后并不会直接返回上层结点，而是从自己的Sibling属性中拿到兄弟结点。

好了，那当我们改变某些 Fiber 的属性触发了更新呢？由于这棵树已经存在了，如我们之前说的，React 会生成一个新的 workInProgress tree。看上去没啥特别的，但不同的点在于，这棵树不是完全重新构建的，而是复制 current tree 的各个 fiber 形成一个新的 tree，在更新阶段中的 work 会对每个 fiber 的变化进行合并。

重点来了，那么这个 Fiber Reconciler 和之前的 Reconciler 有什么区别呢？React 15 的 Reconciler 很笨，堆栈调度是同步的，你这个树开始遍历就必须一条路走到黑，不能停下来。这就导致了如果其他更新的优先级更高的话，没有可能去暂停当前正在执行的更新。于是你会发现，用户更容易感知的更新如样式等很容易就被阻塞住了，就很难受。

Fiber Reconciler 就不一样了，虽然我还是一颗树，但我这个树是可以异步更新的，因为我每个结点都进化成一个子任务了，然后我还可以结合`requestAnimationFrame`和`requestIdleCallback` 达到安排优先级的效果。

### Fiber 渲染

实际的 Fiber 渲染调度发生在这一阶段， React 开始递归调用每一个 Fiber 的 workLoop 函数，这个workLoop 函数中间的执行阶段即函数组件是如何执行的我们先跳过，着重描述 workLoop 的开始和完成干了什么。

有兴趣可以看看，函数组件执行更新

## **`renderWithHooks`**

这个是函数组件执行时，调用的第一个函数，它的作用是将 `function` 组件初始化。

```tsx
function renderWithHooks(
  // current Fiber
  // 当完成一次渲染之后，会产生一个current树, current会在commit阶段替换成真实的Dom树。
  current,
  // 即将调和渲染的 fiber 树，组件更新过程中，会从current复制一份作为workInProgress,更新完毕后，将当前的workInProgress树赋值给current树，看成 current 的临时缓存即可
  // 还有个属性 expirationTime ，确定更新的优先级
  workInProgress,
  // 函数组件本身
  Component,
  props,
  secondArg,
  nextRenderExpirationTime,
) {
  renderExpirationTime = nextRenderExpirationTime
  currentlyRenderingFiber = workInProgress
  // -------------------------------------
  // 1、初始化
  workInProgress.memoizedState = null
  // Fiber 上有个属性 memoizedState，以链表的形式存放 hooks 信息
  // 通过 current 树上是否有 memoizedState（hook信息）来判断是否是第一次渲染函数组件
  workInProgress.updateQueue = null
  workInProgress.expirationTime = NoWork

  // -------------------------------------
  // 2、根据 ReactCurrentDispatcher.current 存放不同的值
  ReactCurrentDispatcher.current
    = current === null || current.memoizedState === null
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate

  // -------------------------------------
  // 3、执行我们的函数组件
  const children = Component(props, secondArg)

  if (workInProgress.expirationTime === renderExpirationTime) {
    // 在这里，我们写的hooks被依次执行，把hooks信息依次保存到workInProgress树上
  }

  // -------------------------------------
  // 4、ContextOnlyDispatcher 判断 hook 是否在函数组件内
  ReactCurrentDispatcher.current = ContextOnlyDispatcher

  // -------------------------------------
  // 5、清空刚才操作的一些变量
  renderExpirationTime = NoWork
  currentlyRenderingFiber = null

  currentHook = null // current树上的指向的当前调度的 hooks 节点
  workInProgressHook = null // workInProgress树上指向的当前调度的 hooks 节点。

  didScheduleRenderPhaseUpdate = false

  return children
}
```

那这个函数具体干了些什么呢，分析一下上面的源码：

1.  先置空即将调和渲染的 `workInProgress` 树的 `memoizedState` 和 `updateQueue` ，之后我们就可以把新的 `hooks` 信息挂载到这两个属性上
2.  根据当前函数组件是否是第一次渲染，赋予 `ReactCurrentDispatcher.current` 不同的`hooks`

#### `HooksDispatcherOnMount` 第一次渲染

```tsx
const HooksDispatcherOnMount = {
  useCallback: mountCallback,
  useEffect: mountEffect,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
}
```

#### `HooksDispatcherOnUpdate` 更新渲染

```tsx
const HooksDispatcherOnUpdate = {
  useCallback: updateCallback,
  useEffect: updateEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState
}
```

3.  调用 `Component(props, secondArg)` 执行我们的函数组件
4.  将 `ContextOnlyDispatcher` 赋值给 `ReactCurrentDispatcher.current`，由于`js`是单线程的，也就是说我们在函数组件中调用的`hooks`，都是`ContextOnlyDispatcher`对象上的`hooks`。

> `ContextOnlyDispatcher` ：执行赋值不同的`hooks`对象，判断在`hooks`执行是否在函数组件内部，捕获并抛出异常。

```tsx
const ContextOnlyDispatcher = {
  useState: throwInvalidHookError
}
function throwInvalidHookError() {
  invariant(
    false,
    'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' + ' one of the following reasons:\n' + '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' + '2. You might be breaking the Rules of Hooks\n' + '3. You might have more than one copy of React in the same app\n' + 'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
  )
}
```

5.  清空刚才操作的一些变量

### 流程图

![截屏2022-04-22 下午3.15.28.png](/images/react-fiber/11.png)

## 总结

![截屏2022-07-07 18.30.30.png](/images/react-fiber/10.png)

我们参考 workloop 的源码，它会调用 performUnitOfWork。performUnitOfWork 将 nextUnitOfWork 作为参数。nextUnitOfWork 只是将要执行的工作单元。 performUnitOfWork 函数在内部调用 beginWork 函数。这是纤程上实际工作发生的地方，而 performUnitOfWork 正是迭代发生的地方。

在 beginWork 函数中，如果 Fiber 没有任何待处理的工作，它只会退出（跳过）纤程而不进入开始阶段。这就是在遍历纤程树时，Fiber 跳过已处理的纤程并直接跳转到有待处理工作的纤程的方式。如果你看到大的 beginWork 函数代码块，我们会发现一个 switch 块调用相应的纤程更新函数，具体取决于纤程标签。就像主机组件的 updateHostComponent 一样。这些函数更新纤程。

如果有任何子节点，则 beginWork 函数返回子节点；如果没有子节点，则返回 null。 performUnitOfWork 函数不断迭代并调用子 Fiber 直到叶子节点到达。在叶节点的情况下，beginWork 返回 null，因为没有任何子节点，并且 performUnitOfWork 函数调用了 completeUnitOfWork 函数。

这个 completeUnitOfWork 函数通过调用一个 completeWork 函数来完成当前的工作单元。 completeUnitOfWork 如果有任何要执行下一个工作单元的同级纤程，则返回一个兄弟纤程，否则如果没有工作，则完成返回（父）纤程。这一直持续到返回为空，即，直到它到达根节点。与 beginWork 一样，completeWork 也是一个发生实际工作的函数，而 completeUnitOfWork 用于迭代。

渲染阶段的结果创建一个效果列表（副作用）。这些效果就像插入、更新或删除宿主组件的节点，或者调用类组件节点的生命周期方法。

在渲染阶段之后，Fiber 将准备好提交更新。

### Fiber 提交更新

这是完成的工作将用于在 UI 上呈现它的阶段。由于此阶段的结果将对用户可见，因此不能将其划分为部分渲染。该阶段是同步阶段。

在这个阶段的开始，Fiber 拥有已经在 UI 上渲染的当前树、finishedWork 或 workInProgress 树，它是在渲染阶段和效果列表中构建的。

效果列表是纤维的链表，有副作用。因此，它是渲染阶段 workInProgress 树的节点子集，具有副作用（更新）。效果列表节点使用 nextEffect 指针链接。

这个阶段调用的函数是completeRoot。workInProgress 树将成为 current 树，因为它将用于呈现 UI。实际的 DOM 更新，如插入、更新、删除和对生命周期方法的调用——或与 refs 相关的更新——发生在效果链表中的节点上。
