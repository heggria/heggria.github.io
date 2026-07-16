---
title: React hook form 的类型体操：FieldPath & FieldPathValue
date: 2022-08-10T16:00:00.000+00:00
duration: 15min
---

`react-hook-form` 库中有两个重要的类型：**`FieldPath`** 和 **`FieldPathValue`**。这两个类型用来描述表单中的字段路径和字段对应值的类型，它们可以帮助我们更规范的编写 `react-hook-form` 的代码。`i18n` 用的是和 `FieldPath` 相似的构造方法。

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

这些值就可以作为 `react-hook-form` 中一些 hook 和方法的参数，比如 `useController`、`useWatch`、`setValue`、`getError` 等。这样可以让我们更灵活地操作表单中的不同字段。

#### `FieldPath` 的构造过程

![FieldPath的构造过程.png](/images/react-hook-form-type/1.webp)

### 什么是 `FieldPathValue`？

`FieldPathValue` 也是一个泛型类型，它接受两个参数：`TFieldValues` 和 `TFieldPath`。`TFieldValues` 表示表单中所有字段的值的类型，`TFieldPath` 表示某个字段或者嵌套字段的路径。`FieldPathValue` 的返回值是一个联合类型，表示 `TFieldPath` 对应的字段的值的类型。例如，如果我们还是使用上面的 `FormValues` 类型，那么：

- `FieldPathValue<FormValues, “name”>` 的返回值是 `string`
- `FieldPathValue<FormValues, “address”>` 的返回值是 `{ city: string; country: string; }`
- `FieldPathValue<FormValues, “address.city”>` 的返回值是 `string`
- `FieldPathValue<FormValues, “tuple.0”>` 的返回值是 `number`
- `FieldPathValue<FormValues, “array”>` 的返回值是 `string[]`

这些值就可以作为 `react-hook-form` 中一些 hook 和方法的泛型参数，比如 `useForm`、`useFormContext`、`useFormState` 等等。这样可以让我们更准确地获取和设置表单中不同字段的值。

#### FieldPathValue的构造过程

![FieldPathValue的构造过程.png](/images/react-hook-form-type/2.webp)

![FieldPathValue的构造过程-2.png](/images/react-hook-form-type/3.webp)

> 1. 首先P类型约束为T的path或者T的arrayPath，然后T extends any 是为了排除any之外的类型，比如、void等 让他们都变成never。满足的话就到P extends……，<br/>
> 2. 如果P是一个由两部分组成的字符串模板字面量，那么就把第一部分推断为K，把第二部分推断为R，然后去判断K是否为T的键。如果是的话就判断R是否为K的路径，就得到PathValue<T[k],R>.也就是获取T[K]和R对应的属性值类型。它会不断地拆分，并且查找T[K]中相应的属性值。<br/>
> 3. K extends ${ArrayKey}：表示如果K是一个数组索引字符串（ArrayKey），即0或者1或者2等等（注意不包括数字本身），那么就继续执行后面的逻辑，否则就返回never。<br/>
> 4. 符合的话，判断T是不是数组，是的话就输出Path……，不符合就到never。<br/>
> 5. P……不满足的话就判断P是不是T的键，是的话就返回T[P]，不是的话就判断P是不是1个数组索引字符串，是的话就判断T是不是数组，是的话就返回这个元素类型，不是的话就到never。

### 总结

TypeScript 的一大优点是支持一些高级的类型系统特性，这些特性可以让我们用更有表达力和灵活性的方式来定义和使用类型。 例如，我们可以使用条件类型来根据某些条件创建不同的类型，使用映射类型来根据已有的类型生成新的类型，使用泛型类型来抽象出通用的模式，以及使用类型变量来捕获动态的类型信息。 这些技术不仅可以帮助我们更好地控制和约束我们的代码，还可以让我们利用 TypeScript 的强大的类型推断能力，从而减少重复和冗余的代码。

参考：[react-hook-form](https://github.com/react-hook-form/react-hook-form/blob/274d8fb950f9944547921849fb6b3ee6e879e358/src/types/utils.ts#L86)
