---
title: React Hook Form 的字段路径类型
date: 2022-08-10T16:00:00.000+00:00
---

这篇记录 2022 年读 `react-hook-form` 类型源码时关注的两个类型：`FieldPath` 约束字段路径，`FieldPathValue` 获取路径对应的值类型。类似的路径构造方法也可以用来理解 `i18n` 的 key 类型。

### 什么是 `FieldPath` ？

`FieldPath` 是一个泛型类型，它接受一个 `TFieldValues` 类型作为参数，表示对象中所有字段的路径。`FieldPath` 的返回值是一个联合类型，表示表单中某个字段或者嵌套字段的路径，用点号分隔。例如，如果我们有一个表单数据对象如下：

```ts
interface FormValues {
  name: string
  address: {
    city: string
    country: string
  }
  tuple: [number, string]
  array: string[]
}
```

那么，`FieldPath<FormValues>` 的可能值有：

- "name"
- "address"
- "tuple"
- "array"
- "address.city"
- "address.country"
- "tuple.0"
- "tuple.1"
- \`array.\${number}\`

这些路径可以用于描述 `useController`、`useWatch`、`setValue` 等 API 操作的字段。字段名写错，或嵌套路径不存在时，就能在类型检查阶段发现。

#### `FieldPath` 的构造过程

![FieldPath的构造过程.png](/images/react-hook-form-type/1.webp)

### 什么是 `FieldPathValue`？

`FieldPathValue` 也是一个泛型类型，它接受两个参数：`TFieldValues` 和 `TFieldPath`。`TFieldValues` 表示表单中所有字段的值的类型，`TFieldPath` 表示某个字段或者嵌套字段的路径。结果表示 `TFieldPath` 对应字段的值类型。例如，如果我们还是使用上面的 `FormValues` 类型，那么：

- `FieldPathValue<FormValues, "name">` 的返回值是 `string`
- `FieldPathValue<FormValues, "address">` 的返回值是 `{ city: string; country: string; }`
- `FieldPathValue<FormValues, "address.city">` 的返回值是 `string`
- `FieldPathValue<FormValues, "tuple.0">` 的返回值是 `number`
- `FieldPathValue<FormValues, "array">` 的返回值是 `string[]`

重点是把字段路径和字段值联系起来。例如 `tuple.0` 对应 `number`，而 `address` 对应整个地址对象。

#### `FieldPathValue` 的构造过程

![FieldPathValue的构造过程.png](/images/react-hook-form-type/2.webp)

![FieldPathValue的构造过程-2.png](/images/react-hook-form-type/3.webp)

读图里的类型定义，可以按路径拆分来理解：

1. `P` 先受 `T` 的 `Path` 或 `ArrayPath` 约束。外层的 `T extends any` 不能按“排除非 any 类型”理解；这里先沿着路径拆分分支往下看。
2. 若 `P` 能拆成 `K.R`，先判断 `K` 是否为 `T` 的键，再对 `T[K]` 和剩余路径 `R` 递归调用 `PathValue`。
3. 若 `K` 匹配 `${ArrayKey}`，则走数组索引分支，继续判断 `T` 是否为数组。
4. 若 `P` 不能继续按点号拆分，先判断它是不是 `T` 的键，是则得到 `T[P]`。
5. 否则检查它是不是数组索引字符串；匹配数组时取得元素类型，不匹配则得到 `never`。

这两个类型把字符串路径变成了对象结构上的约束。构造路径时用到泛型、条件类型和字符串模板字面量；取值时则沿着路径递归查找。以后读类似的类型定义，可以先看它在处理“路径生成”还是“路径取值”。

参考：[react-hook-form](https://github.com/react-hook-form/react-hook-form/blob/274d8fb950f9944547921849fb6b3ee6e879e358/src/types/utils.ts#L86)
