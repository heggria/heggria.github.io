---
title: 谈谈 React 事件系统
date: 2022-07-15T16:00:00.000+00:00
duration: 10min
---

# React 事件系统

我们都知道三种浏览器的事件模型：

- **DOM0级事件模型**：这种模型不会传播，所以没有事件流的概念，所有浏览器都兼容这种方式。直接在dom对象上注册事件名称，就是DOM0写法
- **DOM2级事件模型**：这种模型分为三个阶段：捕获阶段、目标阶段、冒泡阶段。当事件触发时，Document节点接收事件一直向下捕获至目标节点，又从目标节点向上冒泡至Document节点的顺序。使用addEventListener方法添加事件监听器，可以指定在捕获阶段或冒泡阶段执行回调函数
- **IE事件模型**：这种模型只有冒泡阶段，没有捕获阶段。使用attachEvent方法添加事件监听器，不支持useCapture参数，只能在冒泡阶段执行回调函数

但我们对日常编写的React代码中的事件系统了解的似乎并不多，我们只知道React的事件封装了浏览器的各种事件并暴露出来，并不知道这些事件之间的联系以及其中的一些坑，今天我带大家来了解一下，React的事件系统。

# 事件

我们先来回顾一下经典的DOM2事件流

![image.png](/images/react-event/1.png)

回顾完之后，我们来看看DOM的两个关键定义

**事件**是某事发生的信号。所有的 DOM 节点都生成这样的信号（但事件不仅限于 DOM）。常见的事件有 click、keydown 等。

通过**事件捕获器**我们可以分配一个处理程序给对应的信号，使得浏览器和 JS 可以进行交互。当事件发生时，浏览器会创建一个**事件对象**，将详细信息放入其中，并将其作为参数传递给处理程序。

- **Event：Event 接口表示发生在 DOM 中的事件，下面列了几个有意思的属性**
  - [`Event.isTrusted`](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted)：是浏览器触发（用户操作或者API）还是脚本触发（编程调用、自定义事件）
  - [`Event.composed`](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed)：是否可以跨越 `shadow dom` 的边界进行冒泡
  - [`Event.currentTarget`](https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget)：对事件的当前注册目标的引用
  - [`Event.target`](https://developer.mozilla.org/en-US/docs/Web/API/Event/target)：对事件的原始注册目标的引用
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

了解完这些之后，让我们来看看react的事件系统：

React 的事件不是普通的事件，一个事件对应着一个或者多个原生事件，也被称为合成事件。同时React 贯彻了事件委托的理念，将所有事件统一绑定在 `container` 上面。

> 原生事件（阻止冒泡）会阻止合成事件的执行，合成事件（阻止冒泡）不会阻止原生事件的执行。

**为什么要这样做**

- 抹平不同浏览器之间的差异，提高兼容性
- 避免频繁的对 DOM 进行事件的绑定和解绑，提高性能

# 避坑

尽量避免在 React 中混用合成事件和原生 DOM 事件。另外，用 reactEvent.nativeEvent. stopPropagation() 来阻止冒泡是不行的。**阻止 React 事件冒泡的行为只能用于 React 合成事件系统中，且没办法阻止原生事件的冒泡。反之，在原生事件中的阻止冒泡行为，却可以阻止 React 合成事件的传播。**

实际上，React 的合成事件系统只是原生 DOM 事件系统的一个子集。它仅仅实现了 DOM Level 3 的事件接口，并且**统一了浏览器间的兼容问题**。有些事件 React 并没有实现，或者受某些限制没办法去实现，比如 window 的 resize 事件。

# 实现机制

**事件委托，React 并不会把事件处理函数直接绑定到真实的节点上，而是把所有事件绑定到结构的最外层，使用一个统一的事件监听器（利用事件冒泡原理，任何节点触发的事件都能冒泡到最外层元素）** 。

这个事件监听器上维持了一个映射来保存所有组件内部的事件监听和处理函数。当组件挂载或卸载时，只是在这个统一的事件监听器上插入或删除一些对象；当事件发生时，首先被这个统一的事件监听器处理，然后在映射里找到真正的事件处理函数并调用。这样做简化了事件处理和回收机制，效率也有很大提升。

## 批量更新

在我们用合成事件调用`setState`时，实际上React会通过`batchedEventUpdates`函数包一层我们的`onBtnClick`函数，这个过程会暂时改变`executionContext`的值，让React以异步的方式进行更新。这就是为什么在合成事件里连续调用`setState`，React只会进行一次更新的原因。

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

React17引入了`unstable_batchedUpdates` API，允许我们在异步任务中也能使用批量更新的特性。

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

在React控制的场景下，比如合成事件，`setState`操作是批量更新的。比如在一个按钮点击事件中，虽然调用了两次`setCount`，但在控制台只会看到一次更新的打印。

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

而在异步任务，如`setTimeout`或Promise回调中，`setState`是同步更新的，所以点击按钮后，控制台会打印两次更新。

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
