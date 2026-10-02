---
title: React 事件系统阅读笔记
date: 2022-07-15T16:00:00.000+00:00
---

这篇是 2022 年整理的 React 事件系统笔记。后半部分保留了旧版批量更新机制的源码摘录与示意代码，读的时候要区分它们和项目实际使用的 React 版本。

## 浏览器事件模型

先列出当时笔记里的三种事件模型：

- **DOM0 级事件处理**：直接在 DOM 对象的 `onclick` 等属性上设置处理函数。事件传播需要另看事件本身，不能由这个写法推断“不会传播”
- **DOM2级事件模型**：这种模型分为三个阶段：捕获阶段、目标阶段、冒泡阶段。当事件触发时，Document节点接收事件一直向下捕获至目标节点，又从目标节点向上冒泡至Document节点的顺序。使用addEventListener方法添加事件监听器，可以指定在捕获阶段或冒泡阶段执行回调函数
- **IE事件模型**：这种模型只有冒泡阶段，没有捕获阶段。使用attachEvent方法添加事件监听器，不支持useCapture参数，只能在冒泡阶段执行回调函数

平时写 React 事件处理函数，不太需要直接接触这些差异。但混用原生事件时，监听位置、执行顺序和传播行为就会影响结果。

# 事件

先看 DOM2 事件流：

![image.png](/images/react-event/1.png)

与后面的例子有关的两个接口是 `Event` 和 `EventTarget`。

**事件**是某事发生的信号。所有的 DOM 节点都生成这样的信号（但事件不仅限于 DOM）。常见的事件有 click、keydown 等。

通过**事件处理函数**响应这些信号。当事件发生时，浏览器会创建一个**事件对象**，将详细信息放入其中，并将其作为参数传递给处理程序。

- **Event：Event 接口表示发生在 DOM 中的事件，下面列了几个有意思的属性**
  - [`Event.isTrusted`](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted)：是浏览器触发（用户操作或者API）还是脚本触发（编程调用、自定义事件）
  - [`Event.composed`](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed)：是否可以跨越 `shadow dom` 的边界进行冒泡
  - [`Event.currentTarget`](https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget)：对事件的当前注册目标的引用
  - [`Event.target`](https://developer.mozilla.org/en-US/docs/Web/API/Event/target)：事件最初派发到的目标
- **EventTarget：事件目标，是任意一个可以接收事件并可能具有事件侦听器的对象（** [`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element), and its children, as well as [`Document`](https://developer.mozilla.org/en-US/docs/Web/API/Document) and [`Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) **），一些事件目标也支持通过一个** `onevent` **属性设置事件处理程序**
  - **EventTarget** 具有以下几个方法
    - [`EventTarget.addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
    - [`EventTarget.removeEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener)
    - [`EventTarget.dispatchEvent()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent)
  - 其中的 `dispatchEvent()` 我们用的比较少，这个是用来触发一个我们构建的 Event 事件的方法，创建完事件后调用 `dispatchEvent(event)` 将事件提交至 **EventTarget 即可触发事件**

看一个例子，如何清空一个 input 的内容：

> Object.getOwnPropertyDescriptor() 静态方法返回一个对象，该对象描述给定对象上特定属性的配置（即，直接出现在对象上而不是对象的原型链中）。返回的对象是可变的，但改变它对原始属性的配置没有影响。

```tsx
<ActionIcon
  onClick={(e) => {
    e.stopPropagation()
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set
    // inputRef.current.value = ''
    nativeInputValueSetter?.call(inputRef.current, '')
    const event = new Event('input', { bubbles: true })
    inputRef.current?.dispatchEvent(event)
    onChange?.(event)
  }}
>
  <IconX color="gray" />
</ActionIcon>
```

接下来是 React 的合成事件与事件委托。

React 暴露给处理函数的是合成事件，对应底层的原生事件。原笔记用 `container` 上的事件委托来理解它，但“所有事件都绑定在同一个位置”只能作为简化模型。

原生与合成事件混用时，阻止传播的结果要结合监听位置和执行顺序判断。原笔记把它概括成单向的阻止关系，容易漏掉这些条件。

**为什么要这样做**

- 抹平不同浏览器之间的差异，提高兼容性
- 避免频繁的对 DOM 进行事件的绑定和解绑，提高性能

# 避坑

我倾向于少混用合成事件和原生 DOM 事件。确实需要混用时，先确认处理函数挂在哪个节点，再看 `stopPropagation()` 发生在传播的哪一步，不能把一次观察的结果直接套到其他监听位置。

React 的合成事件提供了相近的事件接口，并处理浏览器差异，但不是任意原生事件都能按同一方式绑定到组件上。例如监听 window 的 `resize`，就需要按原生事件的目标来处理。

# 实现机制

事件委托的思路是：由外层监听器处理传播到这里的事件，再找到对应组件的处理函数。下面沿着这个简化模型整理流程，具体事件仍要看源码中的监听策略。

这个事件监听器上维持了一个映射来保存所有组件内部的事件监听和处理函数。当组件挂载或卸载时，只是在这个统一的事件监听器上插入或删除一些对象；当事件发生时，首先被这个统一的事件监听器处理，然后在映射里找到真正的事件处理函数并调用。这样把事件分发和处理函数的管理集中起来。

## 旧版批量更新机制

下面的旧版机制通过 `batchedEventUpdates` 包裹事件处理函数，并暂时改变 `executionContext`。连续调用状态更新时，React 可以先收集任务再一起处理。这里关注的是批量更新，不能把它简单等同于所有更新都是异步的。

```tsx
function handleButtonClick() {
  updateCount(1)
  updateCount(2)
}
<button onClick={handleButtonClick}>{count}</button>

// React batchedEventUpdates
function batchedEventUpdates(action, arg) {
  const oldExecutionContext = executionContext // 保留当前执行上下文
  executionContext |= EventContext // 设置新的执行上下文
  try {
    return action(arg) // 执行按钮点击事件中的逻辑
  }
  finally {
    executionContext = oldExecutionContext // 恢复执行上下文到原始状态

    if (executionContext === NoContext) {
      // 如果当前执行上下文为空，则清理并执行批量更新中的回调
      clearRenderTimer()
      processSyncCallbackQueue()
    }
  }
}

const handleBatchedEventUpdates = wrapBatchedUpdates
```

一旦函数执行完毕，`executionContext`会恢复原状。但如果我们的`setState`操作在如`setTimeout`这样的异步函数中执行，由于合成事件已经执行完毕，`executionContext`已经恢复，所以`setTimeout`中的`setState`会立即执行更新。

旧笔记还记录了 `unstable_batchedUpdates`，用于手动包裹需要批量处理的更新。下面保留导出的示意：

    exports.unstable_batchedUpdates = batchedUpdates;

React内部有个`syncQueue`更新队列来存储更新任务。如果`syncQueue`为空，会初始化这个队列并开启一个微任务来执行更新；如果不为空，就直接加入队列，不需要再开启新的微任务。当`executionContext`为`NoContext`时，会立即执行队列中的更新任务。

```tsx
function scheduleSyncCallback(task) {
  if (!syncQueue) {
    syncQueue = [task] // 如果队列为空，初始化队列并添加任务

    // 直接安排一个微任务来处理同步队列，相当于立即执行的队列处理
    nextQueueTaskNode = scheduleImmediateTask(
      executeSyncQueueTasks
    )
  }
  else {
    // 如果队列已经存在，只需将任务添加到队列中
    syncQueue.push(task)
  }

  return placeholderTaskNode // 返回一个任务节点占位符
}

// 执行同步队列中的所有任务并清空队列
function flushSyncCallbackQueueImpl() {
  syncQueue.forEach(task => task())
  syncQueue = null // 完成后清空队列，等待下一次任务
}

// 确保了在没有其他优先级更高或特定上下文的任务时，更新能够及时被处理
function scheduleUpdateOnFiber(fiber, lane, eventTime) {
  // ...
  if (executionContext === NoContext) {
    resetRenderTimer()
    flushSyncCallbackQueue()
  }
  // ...
}
```

## 批量更新&同步更新

继续看事件处理中连续更新的意图。下面两个例子的变量名没有完全对齐，也没有运行验证，因此不能据此确定控制台会打印几次。

```tsx
function ClickCounter() {
  const [value, changeValue] = useReducer(reducerFunction, 0)
  console.log('Current count is:', number)
  return (
    <button
      onClick={() => {
        updateNumber(1)
        updateNumber(2)
      }}
    >
      {number}
    </button>
  )
}
```

下面继续用原笔记里的旧版机制对比 `setTimeout` 中的更新。示例没有经过运行验证，变量名也没有完全对齐，适合看意图，不适合直接复制。

```tsx
function ClickCounter() {
  const [value, changeValue] = useReducer(reducerFunction, 0)
  console.log('Current count is:', number)
  return (
    <button
      onClick={() => {
        setTimeout(() => {
          updateNumber(1)
          updateNumber(2)
        }, 0)
      }}
    >
      {value}
    </button>
  )
}
```
