---
title: React Fiber：工作单元与调度
date: 2022-06-27T16:00:00.000+00:00
---

参考：[React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)。

这是 2022 年的阅读笔记，引用了不同时期的源码结构。`pendingWorkPriority`、`expirationTime`、effect list 等字段保留原样，用于理解当时的设计，不是同一份版本的完整实现。

## 概述

React Fiber 随 React 16 引入。这篇关心的是一个调度问题：长时间占用主线程的 JavaScript 工作，会阻塞浏览器渲染。React 如何把协调过程拆成工作单元，以便安排优先级和让出执行时间？

## 准备

阅读时需要一点数据结构和 JavaScript 调用栈基础。下面几篇是原笔记用到的背景资料：

- [React 组件、元素和实例——“组件”通常是一个重载的术语。牢牢掌握这些术语至关重要。](https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html)

- [Reconciliation - React 的协调算法。](https://reactjs.org/docs/reconciliation.html)

- [React 基本理论的概念。](https://github.com/reactjs/react-basic)

- [React 设计原则 - 特别注意调度部分。它很好地解释了 React Fiber 的原因。](https://reactjs.org/docs/design-principles.html)

先看协调与调度分别处理什么。

### Reconciliation

界面状态变化后，需要确定哪些部分要更新。协调过程可以先理解为“找不同”：比较新旧描述，再把需要的变化提交到宿主环境。

![截屏2022-07-07 11.17.57.png](/images/react-fiber/1.png)

写 React 组件时，描述状态对应的界面；哪些宿主节点需要更新，由 React 协调和提交。

这里就有一个**虚拟 DOM** 的概念，React 预先在虚拟 DOM 上操作，之后再提交更改到浏览器。

- 如果某棵子树的组件类型和之前不一样，那么 React 不管里面一不一样，全部替换。
- 遍历生成的列表，差异对比使用 `key` 属性。要求是“稳定的、可预测的和唯一的”，所以不建议使用每个项的 `index` 作为 `key`。

React Native 也使用协调机制，只是宿主环境不是浏览器 DOM。因此这里用 **Reconciliation（协调）** 描述新旧树之间的处理。

### **Scheduling**

在没有多线程的时代，一个单线程 CPU 如何同时运行多个任务？

可以借用时间分片的思路理解：把大任务拆成小单元，再安排这些单元何时执行。

![截屏2022-07-07 11.42.16.png](/images/react-fiber/2.png)

由于计算机的速度很快，我们是不会察觉到任务的实际运行是间断的。那么如果我有些任务很急，想要优先执行，有些任务重 IO，很长时间不会响应，如何对这些任务进行运行调度呢？

操作系统调度可以作为类比。Fiber reconciler 也需要安排工作顺序，但这里的类比不意味着它等同于操作系统调度器。

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

下面是使用 `requestIdleCallback` 拆分工作的示例。`deadline.timeRemaining()` 表示当前剩余空闲时间，时间不足且还有任务时，再安排下一次回调。它用于说明调度思路，不代表 React 的实际调度器就使用这段实现。

```tsx
function lowPriorityWork(deadline) {
  while (deadline.timeRemaining() > 0 && workList.length > 0)
    performUnitOfWork()

  if (workList.length > 0)
    requestIdleCallback(lowPriorityWork)
}
```

如果把 React 的工作保存在自己的数据结构里，就不必完全依赖一次走到底的调用栈。可以把 Fiber 类比为虚拟堆栈帧：记录这个单元的输入、状态和与其他单元的关系。

## Fiber 是什么

用下面这棵组件树来理解 Fiber 的关系：

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

JSX 描述的是 React 元素，Fiber 是 React 内部管理工作时的数据结构，两者不要混为一谈。原笔记摘录的 Fiber 结构如下：

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

这两个属性指向其他 Fiber，`child` 指向孩子结点，`sibling` 指向兄弟结点。这代表着 Fiber 之间的直接关系是单链表树形结构。`return` 就是返回上一个堆栈。

![截屏2022-07-07 17.36.28.png](/images/react-fiber/7.png)

### **`pendingProps` & `memoizedProps`**

`pendingProps` 是这次处理的输入，`memoizedProps` 记录之前处理过的输入。比较它们有助于判断是否能复用之前的工作，但不能把 Fiber 本身当成纯函数，也不能只凭 props 相等就概括所有跳过更新的条件。

### **`pendingWorkPriority`**

一个数字，表示纤程的工作优先级。 ReactPriorityLevel 模块列出了不同的优先级以及它们代表的内容。除了 NoWork 是 0，其他情况下数字越大表示优先级越低。例如，可以使用以下函数来检查纤程的优先级是否至少与给定级别一样高：

```tsx
function matchesPriority(fiber, priority) {
  return fiber.pendingWorkPriority !== 0
    && fiber.pendingWorkPriority <= priority
}
```

### **`alternate`**

`alternate` 连接 Fiber 对应的另一份工作结构。这里用 **current tree** 和 **workInProgress tree** 来理解这对关系。

`current tree` 对应当前已提交的界面；更新时在 `workInProgress tree` 上处理下一次工作，提交完成后再切换。

![截屏2022-07-07 17.57.06.png](/images/react-fiber/8.png)

## Fiber Reconciler **工作原理**

每个 Fiber 结点拥有着自己的生命周期。这就用到我们上面那张流程图了：

![截屏2022-07-07 11.26.51.png](/images/react-fiber/9.png)

### Fiber Tree 构建与更新

最初需要构建 Fiber Tree。遍历可以看成深度遍历的变体：通过 `child` 向下，通过 `sibling` 找兄弟，通过 `return` 回到父节点。

状态变化触发更新后呢？由于这棵树已经存在了，如我们之前说的，React 会生成一个新的 workInProgress tree。看上去没啥特别的，但不同的点在于，这棵树不是完全重新构建的，而是复制 current tree 的各个 fiber 形成一个新的 tree，在更新阶段中的 work 会对每个 fiber 的变化进行合并。

与 React 15 的同步堆栈协调相比，工作单元的拆分给暂停、继续和安排优先级提供了基础。同步遍历一旦开始，就可能长时间占用线程，影响用户更着急看到的更新。

Fiber 把树上的工作拆成可管理的单元。上面的 `requestAnimationFrame` 与 `requestIdleCallback` 是帮助理解时间安排的浏览器 API，不能直接当成 React 调度实现的结论。

### Fiber 渲染

接下来记录工作循环，以及其中函数组件执行的部分。原笔记摘录省略了不少分支，先关注初始化、执行与清理的顺序。

## **`renderWithHooks`**

下面的摘录用 `renderWithHooks` 设置函数组件执行时的 Hook 环境。代码里的部分注释是当时的简化理解，例如 current tree 不会直接“替换成真实 DOM”；实际宿主更新发生在提交阶段。

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

按上面的摘录看，主要有五步：

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
4. 执行组件之后，把 `ReactCurrentDispatcher.current` 设回 `ContextOnlyDispatcher`。从上面的代码顺序可见，组件执行期间用的是 mount 或 update dispatcher，不是 `ContextOnlyDispatcher`。

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

## 工作循环与提交

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

原笔记在这里记录的函数名是 `completeRoot`。workInProgress 树将成为 current 树，因为它将用于呈现 UI。实际的 DOM 更新，如插入、更新、删除和对生命周期方法的调用——或与 refs 相关的更新——发生在效果链表中的节点上。
