---
title: TanStack Query 思想
date: 2022-10-21T16:00:00.000+00:00
duration: 10min
---

前端的本质是将某些状态呈现给用户，而状态可以分为客户端端状态与服务器端状态。其中，服务器端状态通俗地说就是存储在远程的一些状态，我们只能通过发送请求来获取这些状态。

# 我们之前怎么做的

[Why useEffect is a bad place to make API calls](https://articles.wesionary.team/why-useeffect-is-a-bad-place-to-make-api-calls-98a606735c1c)

```tsx
useEffect(() => {
  api.post('/view', {})
}, [])
```

虽然代码看上去很简单，但是 `useEffect` 存在一些烦人的问题。

### React 严格模式导致的组件二次刷新问题

这会导致多余的请求和一些未知问题。虽然我们可以使用 `useRef` 解决这个问题，但是绝对是一个不太优雅的解决方案。

```tsx
export default function useEffectOnce(fn: () => void) {
  const ref = useRef(false)
  useEffect(() => {
    if (ref.current) {
      fn()
    }
    return () => {
      ref.current = true
    }
  }, [fn])
}
```

### `useEffect` 机制导致的性能问题。

`useEffect` 钩子在整个 UI 或组件的渲染完成后运行。因此，当我们在其中放入一个 API 调用时，API 调用将在整个UI渲染完成后开始。

最理想的肯定是 API 调用和 UI 渲染并行。

# **TanStack Query** 解决了什么问题

TanStack Query 在解决了 `useEffect` 的问题的同时，还带来了：

1. 在hooks内部封装loading，error等方便直接使用
2. 多个组件请求同一个query时只发出一个请求
3. 缓存数据失效/更新策略（判断缓存合适失效，失效后自动请求数据）

# 生命周期

![截屏2022-10-21 16.37.19.png](/images/tanstack-query-workflow.png)

在react-query获取数据的过程中，主要会经历以下三种状态：

- `loading`
- `error`
- `success`

当react-query进行后端请求查询时，会有以下三个状态：

- `idle`：空闲，表示当前不需要从后端获取数据
- `fetching`: 获取数据，表示当前正在从后端获取数据
- `paused`：暂停，表示原本尝试从后端获取数据，但是通常由于未联网的原因导致暂停

在react-query中`status`为`loading`状态(或者`isLoading`为`true`)指的是第一次从后端获取成功之前的状态，而`fetchStatus`为`fetching`状态(或者`isFetching`为`true`)指的是每次从后端获取数据的加载状态（包含第一次获取数据）。

# 相关三方库

### query-key-factory

[Query Key Factory | TanStack Query Docs](https://tanstack.com/query/v4/docs/community/lukemorales-query-key-factory)

这个库用来管理 query 的 key，我们在编写 query 的时候，会发现大量离散或者可读性差的 key group，这时候我们可以引入这个库来统一管理这些 key。

```tsx
import { createQueryKeys, mergeQueryKeys } from '@lukemorales/query-key-factory'

// my-api/users.ts
export const usersKeys = createQueryKeys('users')

// my-api/todos.ts
export const todosKeys = createQueryKeys('todos', {
  completed: null,
  search: (query: string, limit = 15) => [query, limit],
  byId: (todoId: string) => ({ todoId }),
})

// my-api/index.ts
export const queryKeys = mergeQueryKeys(usersKeys, todosKeys)
```

```tsx
import { completeTodo, fetchSingleTodo, queryKeys } from '../my-api'

export function Todo({ todoId }) {
  const queryClient = useQueryClient()

  const query = useQuery(queryKeys.todos.byId(todoId), fetchSingleTodo)

  const mutation = useMutation(completeTodo, {
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(queryKeys.todos.completed)
    },
  })

  return (
    <div>
      <h1>
        {query.data?.title}
      </h1>

      <p>
        {query.data?.description}
      </p>

      <button
        onClick={() => {
          mutation.mutate({ todoId })
        }}
      >
        Complete Todo
      </button>
    </div>
  )
}
```

# 我的最佳实践

TanStack Query 本身并不复杂，难点在于如何用好他。不正确的使用姿势反而会增加开发成本。

下面是一个 useXXXList hook，它并不复杂。但难点在于，一般list是配合表格组件使用，那如何在其他地方调用到这个hook的refetch方法呢？

```tsx
import { useQuery } from 'react-query'
import { isNil } from 'lodash'
import { IGetSearchResultParams, getSearchResult } from './path/to/api'

export function useXXXList(params?: Partial<IGetSearchResultParams>) {
  const key = 'useXXXList'
  return useQuery(
    [key, params],
    async () => {
      const data = await getSearchResult(params as any)
      // 你可能有一些其他固定逻辑在这里
      // ...
      return data
    },
    {
      enabled: !isNil(params), // 更严格的 case：!isNil(params) && !isNil(params?.xxx)
      initialData: { data: [], total: 0 }
    }
  )
}
```

我的思路是，将这个query传入表格组件内部，类似于 TableList。这样我们把table的状态和这个hook绑定在一起，然后，再利用表格hook将`resetTable`或者`refetchTable` return出来，并做变量提升，或者context，这样我们的表格既利用到了react query，又可以在任意地方使用。

![Untitled](/images/tanstack-query-page.png)
