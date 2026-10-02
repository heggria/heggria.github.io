---
title: TanStack Query：服务端状态与表格封装
date: 2022-10-21T16:00:00.000+00:00
---

这篇是 2022 年使用 React Query / TanStack Query 时的笔记，状态名与 API 示例保留当时的写法。

前端状态可以先分成客户端状态和服务端状态。前者在本地管理；后者存储在远程，需要通过请求获取，还要考虑缓存与更新。

# 我们之前怎么做的

[Why useEffect is a bad place to make API calls](https://articles.wesionary.team/why-useeffect-is-a-bad-place-to-make-api-calls-98a606735c1c)

```tsx
useEffect(() => {
  api.post('/view', {})
}, [])
```

把请求放进 `useEffect` 很直接，但请求的生命周期与组件挂载绑定后，还有一些事要处理。

### 严格模式下的重复执行

当时关注的是严格模式下 effect 重复执行带来的请求问题。下面是原笔记记录的 `useRef` 尝试，保留它用于回看这条思路；这段代码本身没有验证，不能直接当成只执行一次的通用实现。

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

### 请求开始的时机

`useEffect` 钩子在整个 UI 或组件的渲染完成后运行。因此，当我们在其中放入一个 API 调用时，API 调用将在整个UI渲染完成后开始。

如果数据请求能够和 UI 渲染并行，就有机会减少等待。

# **TanStack Query** 解决了什么问题

TanStack Query 把请求状态和缓存管理集中到 query 上。我主要看中了三件事：

1. hook 返回 loading、error 等状态，组件可以直接使用。
2. 相同 query 的请求与数据可以共享，减少重复处理。
3. 可以配置缓存的失效与更新策略。

# 生命周期

![截屏2022-10-21 16.37.19.png](/images/tanstack-query-workflow.png)

在 React Query 获取数据的过程中，主要会经历以下三种状态：

- `loading`
- `error`
- `success`

当 React Query 进行后端请求查询时，会有以下三个状态：

- `idle`：空闲，表示当前不需要从后端获取数据
- `fetching`: 获取数据，表示当前正在从后端获取数据
- `paused`：暂停，表示原本尝试从后端获取数据，但是通常由于未联网的原因导致暂停

在 React Query 中`status`为`loading`状态(或者`isLoading`为`true`)指的是第一次从后端获取成功之前的状态，而`fetchStatus`为`fetching`状态(或者`isFetching`为`true`)指的是每次从后端获取数据的加载状态（包含第一次获取数据）。

# 相关三方库

### query-key-factory

[Query Key Factory | TanStack Query Docs](https://tanstack.com/query/v4/docs/community/lukemorales-query-key-factory)

query key 多起来之后，散落在各处的字符串和数组不太好管理。这个库用来集中构造和组合 key。

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

## 表格场景里的封装

我在表格场景里遇到的主要问题，是如何把 query 的刷新能力暴露给其他地方。

下面的 `useXXXList` 返回一个列表 query。列表通常配合表格使用，但表格外的操作也可能需要调用它的 `refetch`。

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

我的思路是将 query 传入 `TableList` 这样的表格组件，把表格状态和 query 绑定，再由表格 hook 返回 `resetTable` 或 `refetchTable`。需要在其他位置调用时，可以提升这些方法，或者通过 context 传递。这样刷新操作就有了统一入口。

![Untitled](/images/tanstack-query-page.png)
