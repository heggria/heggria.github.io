---
title: CSS 如何组织：从命名约定到组件样式
date: 2023-06-16T16:00:00.000+00:00
---

样式少的时候，直接写选择器和属性就够了。项目变大后，类名冲突、重复规则、样式覆盖顺序才逐渐成为需要处理的问题。

这篇是 2023 年整理的 CSS 组织方式笔记：从样式文件和命名约定，看到预处理器、PostCSS，再比较 CSS Modules、CSS-in-JS 与原子化 CSS。文中的工具状态、调查和图表保留当时的语境，示例用于比较写法，不是一套经过运行验证的配置。

# 脱离 HTML

先看样式如何进入 HTML：

- 行内样式：`style` 属性

  - ```
    <element style="style-name: style-value;" />
    ```

- 内联样式：`<style>` 标签内部编写 CSS

  - ```
    <style>
    element {
        style-name: style-value;
    }
    .class-name {
        style-name: style-value;
    }
    #element-1 {
        style-name: style-value;
    }
    </style>

    <element id="element-1" class="class-name" />
    ```

- 导入样式：`<style>` 标签内部使用 `@import` 引入外部 CSS 文件

  - ```
    <style>
    @import url("style-1.css");
    @import "style-2.css";
    </style>

    <element id="element-1" class="class-name" />
    ```

- 外部样式：通过 `<link>` 引入 CSS 文件。下面是当时留下的结构示例，其中 `<header>`、`<meta>` 的嵌套不能作为正确的文档结构直接使用：

  - ```
    <header>
        <meta>
            <link type="text/css" rel="stylesheet" href="css-herf">
        </meta>
    </header>

    <body>
        <element id="element-1" class="class-name" />
    </body>
    ```

行内样式不方便在多个元素之间共享；外部样式文件更便于集中维护。`@import` 还需要留意加载顺序：浏览器发现被导入文件的时间，可能影响资源并发。下面的表格来自一篇 2009 年的文章，[记录了当时的情况](https://www.stevesouders.com/blog/2009/04/09/dont-use-import/)，其中包含 IE 的行为，不能直接套到所有浏览器。

| 执行顺序     | 内联 @import | 外部 @import     | <link> 标签              |
| ------------ | ------------ | ---------------- | ------------------------ |
| 内联 @import | 并行         | 外部 @import阻塞 | 并行，部分情况阻塞（IE） |
| 外部 @import | /            | 并行             | @import 阻塞             |
| <link> 标签  | /            | /                | 并行                     |

这份记录提醒我关注两个问题：

- 样式何时加载完成，是否造成延迟或闪烁；
- 后加载的规则是否覆盖了先前的样式，包括 JavaScript 修改后的效果。

把 CSS 放进独立文件，可以分别维护内容和表现。不过文件分开之后，样式之间的组织问题仍然存在。

# 组织 CSS 代码

class 可以表达可重复使用的样式。项目里不同模块都写 `.title` 或 `.button` 时，如果没有隔离机制，规则就可能互相影响。命名约定和代码分层主要是在处理这个问题。

下面几种方法关注的层面不同：OOCSS 关注可复用的视觉模式，SMACSS 按职责分类，BEM 规定类名格式，ITCSS 组织规则的层次。

即使用了构建工具，仍然需要给组件和样式划分职责。可以先看这些约定想解决什么，再决定哪些部分适合项目。



## OOCSS - Object Oriented CSS

> OOP 的主要要素：类（方法、变量的集合）、对象（类的一个实例） 类与类的关系有继承（父子关系）、实现（类型-定义关系）、依赖（平等关系）、关联（平等关系）、聚合（弱部分-整体关系）、组合（强部分-整体关系）

OOCSS 借用了面向对象编程的组织思路。笔记中记录的提出者是 Nicole Sullivan，时间为 2008 年。

这里的 CSS“对象”是一种可重复使用的视觉模式。例如侧边栏里的小部件，内容可能分别是订阅、广告或最近文章，但外观结构相近。OOCSS 将这种模式抽成独立的规则，主要有两个原则：

### 结构和皮肤分离

- 结构是指应用于元素（宽度、高度、边距、填充）的不可见样式，而皮肤是可见样式（颜色、字体、阴影）。
- 用可重复的类来定义独特的样式（例如浮动，clearfix，独特的字体堆栈）。

```
// non-OOCSS
.button {
   width: 100px;
   height: 50px;
   background: #000;
   color: #fff;
}

.button-2 {
   width: 100px;
   height: 50px;
   background: #fff;
   color: #333;
}
```

```
// OOCSS
.button {
   background: #000;
   color: #fff;
}

.button-2 {
   background: #fff;
   color: #333;
}

.btn-structure {
   width: 100px;
   height: 50px;
}
```

### 容器和内容分离

- 内容指的是图片、段落、div等元素，它们被嵌套在作为容器的其他元素中。
- 避免使用子选择器和 ID 选择器，用于内容元素的样式应该是独立于容器类的，这样它就可以在其任何地方不受限制地使用。

```
// non-OOCSS
#sidebar {
    padding: 2px;
    left: 0;
    margin: 3px;
    position: absolute;
    width: 140px;
}

#sidebar .list {
    margin: 3px;
}

#sidebar .list .list-header {
    font-size: 16px;
    color: red;
}

#sidebar .list .list-body {
    font-size: 12px;
    color: #FFF;
    background-color: red;
}
```

```
// OOCSS
.sidebar {
    padding: 2px;
    left: 0;
    margin: 3px;
    position: absolute;
    width: 140px;
}

.list {
    margin: 3px;
}

.list-header {
    font-size: 16px;
    color: red
}

.list-body {
    font-size: 12px;
    color: #FFF;
    background-color: red;
}
```

OOCSS 先拆开可复用的规则；接下来的 SMACSS 则进一步给规则分类。

## SMACSS - Scalable and Modular Architecture for CSS

SMACSS 是 Scalable and Modular Architecture for CSS 的缩写。这份笔记记录它由 Jonathan Snook 在 2011 年雅虎时期提出，关注的是样式规则承担的职责。

![](/images/component-library-analysis/1.png)

它把规则分成五类：

### Base（基础）

Base 设置元素的默认样式，例如：

```
body {
    margin-left : 20px;
}

p {
    font-family: xyz;
}
```

这个例子设置了 `body` 的左边距和段落字体，作用范围是整个页面。

Base 也可以使用后代选择器、子选择器和伪类。这里的约定是避免 `!important`，给后续的布局、模块与状态规则留下覆盖空间。

reset 与项目默认样式需要一起考虑。Base 用来放项目自己的默认规则，不必因为用了 reset 就省略这一层。

### Layout（布局）

Layout 管页面的主要区域，例如页头、侧边栏和内容区。

先看一组布局选择器：

```
#header, #features, #sidebar {
    //样式
}
```

需要移动端等不同布局时，可以用带 `l-` 前缀的类区分布局变化：

```
#header {
    //样式
}

#sidebar {
    //样式
}

.l-mobile #sidebar {
    //移动端特定的样式，比如宽度
}
```

`l-mobile` 表示移动端布局。`l-` 是命名约定，帮助读者辨认规则的用途，不是 CSS 语法要求。

我更倾向于在这一层也使用 class，下面是对应的写法：

```
.l-header {
    //样式
}

.l-sidebar {
    //样式
}

.l-mobile-sidebar {
    //移动端特定的样式，比如宽度
}
```

### Module（模块）

Module 管导航、小部件、对话框等可复用部分。与 Layout 分开后，模块放到不同页面区域时，不必把外层布局的约束一并带过去。

例如同一类标题模块的几种形式：

```
.heading {}

.heading-email {}

.heading-news {}
```

### State（状态）

State 表达当前状态。例如错误与成功状态可以分别用 `.is-error` 和 `.is-success` 表示：

```
.is-error {
    //样式
}

.is-success {
    //样式
}
```

### Theme（主题）

Theme 管主题相关的外观规则。项目没有主题切换需求时，可以不单独设置这一层。

```
.button-large {
    width: 60px;
    height: 60px;
}
```

Theme 与 Base 的区别主要在职责：Base 是默认规则，Theme 是特定主题的外观。上面的按钮尺寸示例本身不足以说明主题切换，还要结合项目如何组织主题来看。

## BEM - Block Element Modifier

![](/images/component-library-analysis/2.png)

BEM 规定类名的组成方式：Block、Element、Modifier。这份笔记记录它由 Yandex 团队在 2009 年前提出；与前面按职责拆规则的方法相比，它更直接地约定名称。

### Block

独立的实体，其本身就有着明确意义。比如`header`, `container`, `menu`, `checkbox`, `input`等。

### Element

Element 是 Block 内有语义联系的部分，例如 `menu-item`、`list-item`、`checkbox-caption`、`header-title`。下面的示例还用 `-` 连接了元素名称，重点是能从名称看出归属。

### Modifier

块或元素上的一个标志。用它们来改变外观或行为，类似于 SMACSS 的 State + Theme。比如`disabled`, `highlighted`, `checked`, `fixed`, `size-big`, `color-yellow` 等。

笔记还记下 BEM 在“2020 年 CSS 调查中位居榜首”，但没有留下对应题目和统计口径，不能据此作总体排名。下面只看如何用 SCSS 组织名称：

```
// 配合 SCSS 语法
.card {
  &__head {}
  &__menu {
    &-item {
      &--active {}
      &--disable {}
    }
  }
  &__body {}
  &__foot {}
}
```

## ITCSS - Inverted Triangle CSS

![](/images/component-library-analysis/3.png)

ITCSS 按规则的影响范围和覆盖关系组织 CSS，不单独规定类名，可以与 BEM、SMACSS 或 OOCSS 配合。这里按三个维度理解它的分层：

1.  Reach - 范围：CSS 代码所能影响的范围
1.  Specificity - 特异性：选择器参与覆盖竞争时的权重
1.  Explicitness - 明确性：CSS 代码的名称确定性

根据以上特征的不同，ITCSS 将 CSS 代码分为以下几层：

- **Settings** 设置 -- 与预处理器一起使用，包含字体、颜色定义等。
- **Tools** 工具 -- 全局使用的混合元素和函数。重要的是不要在前两层输出任何CSS。
- **Generic** 通用 -- 重置和/或规范化样式，盒状大小的定义，等等。这是产生实际CSS的第一层。
- **Elements** 元素 -- 裸露的HTML元素的样式（如H1、A等）。这些元素带有浏览器的默认样式，所以我们可以在这里重新定义它们。
- **Objects** 对象 -- 基于类的选择器，它定义了非装饰的设计模式，例如OOCSS中的媒体对象。
- **Components** 组件 -- 特定的UI组件。这是我们大部分工作发生的地方。我们经常将UI组件由Objects和Components组成。
- **Utilities** 实用工具 -- 实用工具和辅助类，能够覆盖三角形中的任何东西，例如，隐藏辅助类。

这些层从基础规则逐渐走向具体组件和覆盖工具。可以按层建立文件夹，再安排编译顺序；规则是否覆盖仍取决于选择器和级联，文件所在层次本身不会强制覆盖。

```
// ITCSS + SCSS
@import 'settings/*';
@import 'tools/*';
@import 'generic/*';
@import 'elements/*';
@import 'vendor/*';
@import 'objects/*';
@import 'components/*';
@import 'utilities/*';
```

```
// BEMIT
.s-name
.t-name
.g-name
.e-name
.v-name
.o-name
.c-name
.u-name
```

ITCSS 管规则放在哪里，BEM 管名称怎么写，两者结合称为 BEMIT。前缀能提示职责，具体放在哪一层仍要根据规则用途判断。

# pre-processor

![](/images/component-library-analysis/4.png)

前面的代码用到了嵌套和变量，接着看负责转换这些语法的预处理器。

预处理器把自己的语法编译成 CSS，例如 mixin、嵌套和继承等。这篇讨论的是当时使用这些工具的理由，不据此判断今天哪些能力仍只能由预处理器提供。

下面整理 Sass、LESS 和 Stylus。它们都生成浏览器可使用的 CSS，但语法和工具支持不同。

## [Sass & SCSS](https://sass-lang.com/): Syntactically Awesome Style Sheets

Sass 是 Syntactically Awesome Style Sheets 的缩写。这份笔记记录它最初发布于 2006 年，Natalie Weizenbaum 和 Hampton Catlin 受到 Haml 模板语言启发，希望给样式编写增加动态能力。

Sass 提供变量、条件、循环、继承、运算、插值和混合器等机制，编译后输出普通 CSS。

Sass 有两种语法。

- .sass 文件扩展名使用基于缩进的旧语法。
- SCSS 是 Sass 3 引入新的语法，是 Sassy CSS 的简写，是更新和更广泛使用的语法，使用 .scss 文件扩展名。

SCSS 保留了更接近 CSS 的括号和分号写法。下面是当时留下的语法对照，格式比较压缩：

```
/* Sass */
$primary-color: seashell $primary-bg: darkslategrey  body
    color: $primary-color     background: $primary-bg

```

```
/* SCSS */ $primary-color: seashell; $primary-bg: darkslategrey;  body {     color: $primary-color;     background: $primary-bg; }
```

mixin 可以集中维护一组规则，再通过参数调整：

```
@mixin card($width, $height, $bg, $border) {       width: $width;       height: $height;       background: $bg;       border: $border; }

.card-1 {
    @include card(300px, 200px, yellow, red 2px solid);
}
.card-2 {
    @include card(400px, 300px, lightblue, black 1px dotted);
}
```

其他机制包括：

- 变量作用域机制

  - ```
    $global-variable: global value;

    .content {
        $local-variable: local value;
        global: $global-variable;
        local: $local-variable;
    }

    .sidebar {
        global: $global-variable;
        // This would fail, because $local-variable isn't in scope:
        // local: $local-variable;
    }
    ```

- @extend -- CSS class 继承

  - ```
    .error {
        border: 1px #f00;
        background-color: #fdd;
        &--serious {
            @extend .error;
            border-width: 3px;
        }
    }

    // equal to
    .error, .error--serious {
        border: 1px #f00;
        background-color: #fdd;
    }
    .error--serious {
        border-width: 3px;
    }
    ```

- 嵌套语法

- `@if` `@else` `@for` `@while` 等条件循环控制语句

  - ```
    $base-color: #036;
    @for $i from 1 through 3 {
        ul:nth-child(3n + #{$i}) {
            background-color: lighten($base-color, $i * 5%);
        }
    }
    ```

- `@import` 模块化

其他语法可查 [Sass 文档](https://sass-lang.com/documentation/syntax)。链接指向现行文档，具体用法需结合项目版本。

## [LESS](https://lesscss.org/): "Leaner Style Sheets"

这份笔记记录 LESS 由 Alexis Sellier 在 2009 年发布，与 Sass、SCSS 的语法演进有联系，也提到 Bootstrap 后来从 LESS 迁向 Sass。仅凭这次迁移，不能判断两者整体使用量的变化原因。

LESS 的写法与 SCSS 有相近之处，具体功能可以查 [LESS 文档](https://lesscss.org/)。

## [Stylus](https://stylus-lang.com/): Expressive, dynamic, and robust CSS

笔记中记录 Stylus 由前 Node.js 开发者 TJ Holowaychuk 在 2010 年推出，尝试结合逻辑能力与灵活的语法。

Stylus 支持不同的语法写法。团队使用时，需要约定统一风格，避免同一项目里出现多种写法。

![](/images/component-library-analysis/5.png)

图里保留了当时对 Sass、LESS 与 Stylus 使用量的比较。这张图不能单独证明增长来自 SCSS 或从 node-sass 转向 dart-sass，也不能代替项目里的工具比较。我的偏好是 SCSS 的写法。

是否引入预处理器，还要看项目需要哪些语法，以及构建链是否方便维护。

# [PostCSS](https://postcss.org/)

![](/images/component-library-analysis/6.png)

预处理器提供了一套语法，但语法转换与后续处理是不同的需求。看 PostCSS 时，我主要关心插件能否独立参与这些步骤：

- 预处理器有自己的语法，使用这些语法不等于已经获得某项新 CSS 标准的兼容转换。
- 内置功能不能满足需求时，可能需要增加独立的处理步骤；具体扩展方式要看工具，不能一概称为不可扩展。

PostCSS 把规则处理交给插件，便于按需求组合转换。

![](/images/component-library-analysis/7.png)

PostCSS 解析 CSS，并提供 API 操作 [抽象语法树](https://zh.wikipedia.org/wiki/%E6%8A%BD%E8%B1%A1%E8%AA%9E%E6%B3%95%E6%A8%B9)。插件通过这套 API 检查或修改规则，例如添加浏览器前缀。可以借 Babel 理解这种插件转换的思路，但 PostCSS 本身不会自动完成所有兼容处理。

![](/images/component-library-analysis/8.png)

图中记录了当时的下载量比较。笔记列出的工具包括 Autoprefixer（前缀添加）、lost（基于 calc 的栅格系统）、Stylelint（样式检查）和 CSSNext（较新 CSS 语法的转换）。这些名称保留当时的使用背景，不表示它们都仍适合新项目。

使用 PostCSS 时，仍要确认插件实际支持哪些语法。它与预处理器可以配合，但不能把安装一个插件视为完整替代任意预处理器。

# 高级模块化

命名约定需要开发者共同遵守，构建工具则可以自动处理部分隔离工作。在组件化开发中，结构、逻辑和样式经常按组件放在一起。React 项目需要选择样式方案；Vue 单文件组件里的 scoped 样式也提供了一种组织方式。下面分别看 CSS Modules 和 CSS-in-JS。

## [CSS Modules](https://github.com/css-modules/css-modules)

CSS Modules 保留独立的 CSS 文件，同时把类名映射提供给 JavaScript 使用。这里将它作为一种局部作用域方案单独讨论。

CSS Modules 以文件为模块，在构建时转换局部类名，组件通过导入的映射引用这些类。下面看局部、全局和组合三种写法。

![](/images/component-library-analysis/9.png)

CSS Modules 有以下几个重要特性：

- 局部作用域：构建时会将类名`style.title`编译成一个哈希字符串。可以在对应的插件配置中定制哈希类名。

  - ```
    // before
    .title {
        color: red;
    }

    // equal to
    :local(.title) {
        color: red;
    }

    // after
    ._3zyde4l1yATCOkgn-DBWEL {
        color: red;
    }
    ```

- 全局作用域

  - `:global(.className)`，使用这种语法的类名不会被编译成哈希字符串。

- 类名组合机制：一个选择器可以继承另一个选择器的规则

  - 编译前：
  - ```
    .className {
        background-color: blue;
    }

    .title {
        composes: className;
        color: red;
    }
    ```

  - ```
    <h1 className={style.title}>
    ```
  - 编译后：
  - ```
    ._2DHwuiHWMnKTOYG45T0x34 {
        color: red;
    }

    ._10B-buq6_BEOTOl9urIjf8 {
        background-color: blue;
    }
    ```

  - ```
    <h1 class="_2DHwuiHWMnKTOYG45T0x34 _10B-buq6_BEOTOl9urIjf8">
    ```

局部类名转换后，不必给每个类手动设计一个全项目唯一的名字。CSS 文件可以跟组件放在一起。模块内部仍然需要易读的命名；是否继续用 BEM，取决于团队约定。

CSS Modules 可以与 PostCSS 配合。需要额外语法转换时，再配置相应的处理步骤。

## CSS-in-JS

CSS-in-JS 在 2014 年由 Facebook 的员工 Vjeux 在 NationJS 会议上提出：可以借用 JS 解决许多 CSS 本身的一些“缺陷”，比如全局作用域、死代码移除、生效顺序依赖于样式加载顺序、常量共享等等问题。

![](/images/component-library-analysis/10.png)

CSS-in-JS 是在 JavaScript 中组织样式的一类方案，具体 API 和处理时机没有统一形式。笔记当时记下“六十多种实现”，但没有列出统计范围；这里主要比较几种具体工具。

![](/images/component-library-analysis/11.png)

这类方案需要考虑额外的依赖、迁移和运行成本：

- 如果现有的 CSS、命名约定和构建处理已经满足需求，引入新方案会增加需要维护的东西。
- 方案之间的 API 不同。选择前需要看维护状态，以及未来迁移时哪些代码要改。
- 在浏览器中动态生成和注入样式的实现会有运行开销。构建时提取样式的方案，则要分别检查生成结果，不能把这项成本套到所有 CSS-in-JS 工具。

先看 styled-components。

#### [styled-components](https://styled-components.com/)

![](/images/component-library-analysis/12.png)

styled-components 通过样式化组件组织 CSS。下面将按钮元素和样式一起定义：

这个写法使用 JavaScript 的标签模板字符串，将样式传给 `styled.button`，由库处理样式生成与注入：

```
import styled from 'styled-components';

const Button = styled.button`
  background: palevioletred;
  color: white;
  border-radius: 4px;
`;
```

返回的 `Button` 可以作为 React 组件使用：

```
<Button>Click me</Button>
```

这个写法提供了几种能力：

- 自动生成类名，减少手动命名的冲突。
- 使用 JavaScript 变量或 props 控制颜色、大小、边距等样式。
- 使用 `ThemeProvider` 传递主题对象，再通过 `props.theme` 读取。

引入项目时，我还会检查这些问题：

- CSS 写在 JavaScript 中后，现有编辑器提示和检查工具是否仍能使用。
- 样式解析和注入的开销，以及当前构建工具能做哪些提取、压缩或缓存处理。
- 生成结果是否有重复规则，最终样式体积多大。
- 与已有 CSS Modules、样式提取和检查工具如何配合。

这些问题需要看具体配置和生成结果，不能仅凭采用 styled-components 就断言无法使用 CSS 的继承、级联或优化。

#### [Emotion](https://emotion.sh/docs/introduction)

![](/images/component-library-analysis/13.png)

Emotion 也提供组件化的样式 API。这里保留当时与 styled-components 的比较：

- 两者都支持通过模板字符串创建样式化组件，在样式中使用 JavaScript 变量和表达式。

- 两者都支持主题和媒体查询，分别用于共享样式变量和按条件调整样式。

- 当时关注的区别：

  - Emotion 的 `css` prop、`@emotion/core`、`@emotion/styled` 等入口提供了不同写法；这里的包名属于当时笔记，不据此断言 styled-components 只有一个 API。
  - Emotion 的 auto-labels 与 source maps 可帮助定位组件名称、样式来源和行号。是否方便还要结合项目的编译配置。
  - 笔记记下了“Emotion 比 styled-components 快约 10%”的说法，但没有保留测试版本、条件和结果出处。这个数字不能用于判断当前项目的性能。

要比较这两个库，我会先看项目需要的 API、主题方式和调试支持。性能差异则需要用同一场景测量。

#### [Stitches](https://stitches.dev/) & [vanilla-extract](https://vanilla-extract.style/)

接着看当时关注的 Stitches 和 vanilla-extract。

![](/images/component-library-analysis/14.png)

Stitches 提供 TypeScript 支持、SSR 和 variants；vanilla-extract 则把自己描述为“CSS Modules-in-TypeScript”，在构建时生成 CSS。笔记还记下 Stitches 约 6 kB gzipped 的体积，没有注明测量版本；不能据此把 Stitches 也理解成没有样式运行时。

> 类似 styled-components 的 CSS-in-JS 库由于需要在运行时动态注入 CSS，性能较差，而新的 CSS-in-JS 库基本都抛弃了运行时的思路，转而在编译阶段生成固定的 CSS 代码。这样有两个好处：
>
> 1.  可以减小 JS 文件的体积
> 1.  可以完美支持 SSR
> 1.  加快客户端运行速度

上面保留的是当时的概括，其中“新的库基本都抛弃运行时”“完美支持 SSR”说得过满。构建时提取样式可以减少客户端处理工作，实际体积、SSR 接入和性能仍需分别检查。

两者的比较资料是 [Vanilla-Extract & Stitches: A Comparison](https://dev.to/nayaabkhan/vanilla-extract-stitches-a-comparison-58c2)。笔记还曾用 FCP 和“TTL”描述体验，但没有测量条件，后一个指标的含义也没写清。这里不保留据此排名的结论，只看下面的 vanilla-extract 示例：

```
import { style } from '@vanilla-extract/css';

export const parentClass = style({
    background: 'red',
    ':hover': {
        background: 'blue',
    },
});

export const childClass = style({
    selectors: {
        '&:nth-child(2n)': {
            background: '#fafafa',
        },
        [`${parentClass} &`]: {
            color: 'pink',
        },
    },
});
```

```
import { childClass, parentClass } from './index.styles.css';
const Demo = () => (
    <div className={parentClass}>
        <div className={childClass}>DEMO1</div>
        <div className={childClass}>DEMO2</div>
        <div className={childClass}>DEMO3</div>
    </div>
);

export default Demo;
```

## Atomic CSS

![](/images/component-library-analysis/15.png)

原子化 CSS 将小的样式规则写成可组合的类，与 utility-first 的思路相近。笔记引用了 Thierry Koblentz 在 2013 年的文章 [挑战 CSS 最佳实践](https://link.juejin.cn?target=https%3A%2F%2Fwww.smashingmagazine.com%2F2013%2F10%2Fchallenging-css-best-practices-atomic-approach%2F)，并把 [Tailwind CSS](https://tailwindcss.com/) 作为工具例子。先看两个简单规则：

```
.m-0 {
    margin: 0;
}

.text-red {
    color: red;
}
```

下图比较组件增加时的样式增长。当多个组件复用相同的工具类，就有机会减少重复规则。图中普通样式近似线性增长、原子类增长变缓，但不能仅凭曲线断言后者一定是对数增长，或所有项目的类数量都有固定上限。

![](/images/component-library-analysis/16.png)

当时我还关注 [Tailwind CSS](https://tailwindcss.com/) 和不依赖 PostCSS 的 [UnoCSS](https://unocss.dev/)。笔记里有“快 100 倍”的数字，对应的阅读资料是 [重新构想原子化 CSS](https://antfu.me/posts/reimagine-atomic-css-zh)；比较时需要看其中的测试对象和条件，不能把生成工具的速度直接当成页面运行速度。笔记没有提供 Tailwind 与 MUI 使用量的可比统计，这里也不据此给工具排名。

原子化 CSS 也有需要处理的成本：

- 修改常用尺寸时，需要考虑类名和含义是否仍一致。例如 `m20` 表示 20px 的 margin，直接改规则会让名称失真，改引用则需要明确影响范围。
- 工具类名称和配置有学习成本。VS Code 插件可以提供提示，具体写法仍需查对应文档。

# 选择时看什么

这些方法没有统一的替换顺序。命名约定处理代码组织，CSS Modules 处理局部类名，预处理器和 PostCSS 处理语法与转换，CSS-in-JS 和原子化 CSS 则改变了样式的编写方式。

我的关注点是：规则放在哪里，作用范围是否清楚，动态样式怎么表达，最终生成什么，以及团队以后如何修改。工具可以一起使用，但每增加一层，都要能解释它解决了哪个具体问题。

# 参考

[don’t use @import | High Performance Web Sites](https://www.stevesouders.com/blog/2009/04/09/dont-use-import/)

[The Basics of Object-Oriented CSS (OOCSS)](https://www.hongkiat.com/blog/basics-of-object-oriented-css/)

https://medium.com/actualize-network/modern-css-explained-for-dinosaurs-5226febe3525

[[译] 什么是模块化 CSS? - 掘金](https://juejin.cn/post/6844903687173701645)

[CSS 模块化方案探讨(BEM、OOCSS、CSS Modules、CSS-in-JS ...) - 掘金](https://juejin.cn/post/6947335144894103583)

[梳理 CSS 模块化 - 掘金](https://juejin.cn/post/6844904034281734151)

[Organize CSS with a Modular Architecture: OOCSS, BEM, SMACSS](https://snipcart.com/blog/organize-css-modular-architecture)

[CSS in JS 简介 - 阮一峰的网络日志](https://www.ruanyifeng.com/blog/2017/04/css_in_js.html)

[State of CSS 2022: CSS-in-JS](https://2022.stateofcss.com/en-US/css-in-js/)
