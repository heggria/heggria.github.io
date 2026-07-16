---
title: 前端 CSS 的演进与创新
date: 2023-06-16T16:00:00.000+00:00
duration: 40min
---

今天我们来聊聊一个我们熟悉又陌生的东西：CSS。可能你会说，CSS，这么简单的东西，不就是一些选择器，一些属性，一些变量放一起，就能给页面加上样式了吗？诶别急，CSS 本身确实没啥好讲的，但是**任何一个东西一旦数量多起来了，就会麻烦起来**。CSS 同样逃脱不了这个定律，今天就让我们来对前端 CSS 体系做一个全面的回顾与展望。

# 脱离 HTML

大家都知道 CSS 在 HTML 里面的几种写法，先稍微回顾一下：

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

- 外部样式：`<meta>` 标签内部使用 `<link>` 标签引入外部 CSS 文件

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

在直接编写 HTML 的时候，我们几乎不会用行内样式与导入样式。行内样式**可复用性、可维护性、性能都很差**，而导入样式看起来虽然挺好的，但是有着致命缺点，我们一般不会使用：**会影响浏览器** **并发** **请求资源的效率，因为它们的加载时机不确定或会被其他资源阻塞。** [具体表现如下：](https://www.stevesouders.com/blog/2009/04/09/dont-use-import/)

| 执行顺序     | 内联 @import | 外部 @import     | <link> 标签              |
| ------------ | ------------ | ---------------- | ------------------------ |
| 内联 @import | 并行         | 外部 @import阻塞 | 并行，部分情况阻塞（IE） |
| 外部 @import | /            | 并行             | @import 阻塞             |
| <link> 标签  | /            | /                | 并行                     |

可以发现其优先级在大部分情况下低于<link>标签，最好的情况也只是并行渲染，这导致：

- 可能会延迟页面样式的渲染，可能会造成页面闪烁的现象；
- 可能会延迟页面样式的应用，可能会和页面中的 javascript 脚本产生冲突，导致 js 修改的样式被后加载的外部样式表覆盖；

在最开始的时候，我们在努力让 CSS 与 HTML 分离，形成独立的两个文件，这样有利于**内容与表现**的分离。

# 组织 CSS 代码

在实际开发中我们发现，使用 class 选择器比使用其他选择器优势更大，因为class选择器是最初的模块化思想。但是随着项目规模的增大，CSS 的一个缺点逐渐浮现出来：全局作用域，这导致我们不得不将这些 class 的命名区别开来。为了解决 CSS 全局作用域和命名冲突的问题，很多大佬、组织提出了一些规范和指南。

如何组织 CSS 代码？这些方法有些是基于面向对象思想的，有些是基于组件化思想的，有些是基于样式规则分类的，有些是基于样式规则分层的，还有些是基于最小化样式规则的。不同的方法论有不同的特点和适用场景。

当然，我们现在已经不会去直接使用这些方法了，但了解这些方法也有助于我们一窥大佬们的思想。

下面我们来具体的看一下每种方法。

## OOCSS - Object Oriented CSS

> OOP 的主要要素：类（方法、变量的集合）、对象（类的一个实例） 类与类的关系有继承（父子关系）、实现（类型-定义关系）、依赖（平等关系）、关联（平等关系）、聚合（弱部分-整体关系）、组合（强部分-整体关系）

我们肯定都听说过 OOP（Object-oriented programming - 面对对象编程），那么 OOCSS 同理，是一种面对对象的 CSS 命名方式，它于 2008 年由 Nicole Sullivan 提出。

CSS 本身是声明式的编程语言，不具备任何的面对对象能力，我们需要构建出自己的一套“约定”。在 OOCSS 中，“对象”指 HTML 元素或相关内容（如 CSS 类或 JavaScript 方法）。比如，侧边栏小部件对象可复制用于不同目的（通讯注册、广告块、最近文章等）。**CSS “对象”是一种重复的视觉模式，可以抽象为独立的代码片段。** OOCSS 主要有以下两个原则：

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

许多开发者认为，OOCSS 易于分享和维护。相比之下，SMACSS 等模块化方法对 CSS 对象有更严格的分类规则。

## SMACSS - Scalable and Modular Architecture for CSS

SMACSS（Scalable and Modular Architecture for CSS）即可伸缩及模块化的 CSS 结构，由 Jonathan Snook 在 2011 年雅虎时提出。与 OOCSS 不同的是，SMACSS 的关注点在于网络元素的所属功能。

![](/images/component-library-analysis/1.png)

SMACSS 将网页的 CSS 分为以下几个组件大类：

### Base（基础）

顾名思义，基本规则需要应用于网页的基本元素。下面的示例可以被认为是 SMACSS 中的一部分基本规则：

```
body {
    margin-left : 20px;
}

p {
    font-family: xyz;
}
```

我们将基本规则应用于**在整个网页中保持一致的元素**。在上面的 SMACSS 示例中，我们希望内容距离左边 20px 显示，段落元素应该有一种特定的字体。

除了直接元素外，Base 类型的 CSS 还可以使用后代选择器、子选择器和伪类。但是，在创建基本规则时，我们不能使用任何 `!important`。这可能是因为当我们的样式从不同的部分或特异性问题（稍后讨论）开始覆盖时，会显示出不希望的行为。

你可能会想到使用 CSS-resets 来代替这些样式，但是这会增加从服务器发送到客户端的代码量。因此，如果你想要创建任何默认设置的 CSS，Base 是一个很好的地方来记下它们。

### Layout（布局）

第二条规则讲的是如何设计网页应用的布局的 CSS。网页的主要部分都属于布局的范畴。为它们设计CSS通常会遇到很多挑战，因为涉及到很多元素，而且用多个 ID 来定义每个布局会让事情变得更复杂。

一个简单的不太成熟的 CSS 设计如下：

```
#header, #features, #sidebar {
    //样式
}
```

但是，当我们需要根据不同的偏好来设计多种布局时，上面的不太成熟的CSS设计就会失效。在这种情况下，可以用前缀“l”来表示这个类选择器是基于一个布局元素的。

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

在上面的示例中，`l-mobile` 类表示它是为了改变与移动端相关的元素的“布局”而构建的。因此，“l”这个名称在 SMACSS 的布局规则中并不是必须使用的。但是，SMACSS 作者建议使用它作为一个标准，以便更好地阅读。

**题外话：我不同意 SMACSS 的这种在 layout 类型里面用 ID 选择器的行为，我们应该从始至终使用 class 选择器。如下示例**

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

模块是布局元素的较小部分，例如导航、小部件、对话框等。将模块视为布局的一部分会增加不必要的复杂性，因为模块在多个地方使用比大型布局更多，可以把**布局看作是主要的布局，模块看作是次要的布局**。

模块的命名很符合我们的直觉：

```
.heading {}

.heading-email {}

.heading-news {}
```

### State（状态）

在我们精心制定了布局和模块规则之后，我们还需要考虑元素状态的设计。当一个元素有多个状态时，就需要应用状态规则。例如，一个模块可以处于错误状态（取决于收到的错误）或成功状态。对于这两种状态，模块都需要渲染不同的样式，这就是状态规则的作用。

```
.is-error {
    //样式
}

.is-success {
    //样式
}
```

### Theme（主题）

主题规则是为 Web 应用程序的主题定义的。例如，每个网站都有一个反映业务或基于其他策略的主题。但很多网站可能不需要更换主题的功能，因此这个规则是可选的。

```
.button-large {
    width: 60px;
    height: 60px;
}
```

这种规则看起来和默认规则很像，但基本规则只针对默认的外观，而且往往是类似于重设为默认的浏览器设置；而主题规则则更像是一种风格设计，它给出了最终的外观，对于这个特定的色彩方案是独一无二的。

## BEM - Block Element Modifier

![](/images/component-library-analysis/2.png)

BEM（Block Element Modifier）是一种典型的 CSS 命名方法论，由 Yandex 团队在 2009 年前提出。BEM 和上面两种方法非常的不一样，他是通过全局统一的格式来命名出独一无二的 class，每一个 class 都由以下部分组成：

### Block

独立的实体，其本身就有着明确意义。比如`header`, `container`, `menu`, `checkbox`, `input`等。

### Element

一个区块的一部分，没有独立的意义，在语义上与它的区块相联系。就是说 Element 不能脱离 Block 存在。比如`menu-item`, `list-item`, `checkbox-caption`, `header-title`等。如果 Element 里面还有 Element，使用 `-` 分割。

### Modifier

块或元素上的一个标志。用它们来改变外观或行为，类似于 SMACSS 的 State + Theme。比如`disabled`, `highlighted`, `checked`, `fixed`, `size-big`, `color-yellow` 等。

BEM 的规则非常清晰易懂，而且可以使用 SCSS 等预处理器来完成，在 2020 年的 CSS 调查里面位居榜首。

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

作为原子化 CSS 的思路来源，ITCSS 是一种比较新的 CSS 代码组织方法。他 CSS 命名无关，可以与 BEM、SMACSS 或 OOCSS 等方法一起使用。ITCSS 把 CSS 代码的特征分成了三个维度，再根据这三个维度进行分层：

1.  Reach - 范围：CSS 代码所能影响的范围
1.  Specificity - 特异性：CSS 代码的普适程度
1.  Explicitness - 明确性：CSS 代码的名称确定性

根据以上特征的不同，ITCSS 将 CSS 代码分为以下几层：

- **Settings** 设置 -- 与预处理器一起使用，包含字体、颜色定义等。
- **Tools** 工具 -- 全局使用的混合元素和函数。重要的是不要在前两层输出任何CSS。
- **Generic** 通用 -- 重置和/或规范化样式，盒状大小的定义，等等。这是产生实际CSS的第一层。
- **Elements** 元素 -- 裸露的HTML元素的样式（如H1、A等）。这些元素带有浏览器的默认样式，所以我们可以在这里重新定义它们。
- **Objects** 对象 -- 基于类的选择器，它定义了非装饰的设计模式，例如OOCSS中的媒体对象。
- **Components** 组件 -- 特定的UI组件。这是我们大部分工作发生的地方。我们经常将UI组件由Objects和Components组成。
- **Utilities** 实用工具 -- 实用工具和辅助类，能够覆盖三角形中的任何东西，例如，隐藏辅助类。

可以看到，ITCSS 的分层较多，每层的样式都可以覆盖前面一层的样式。将 ITCSS 层组织到子文件夹中，并使用 Sass 或其他预处理器编译新添加的文件：

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

ITCSS 只是一种组织结构，这种组织结构清晰易懂，我们可以快速组织并分享我们的 CSS 代码。ITCSS 和 BEM 一起使用的时候，有一个独特的名称：BEMIT，使用的时候无需去思考 CSS 代码存放的位置，只需要在 BEM 前面加上 ITCSS 的前缀即可。

# pre-processor

![](/images/component-library-analysis/4.png)

上面我们提到了“预处理器”，可能你会疑问，预处理器是什么东西？

CSS 预处理器是一种程序，可让您从预处理器自己的独特语法生成 CSS。简单来说，预处理器就是一个编译器，有了这个编译器，我们就可以用很多原生 CSS 不具有的特性，例如 mixin、嵌套选择器、继承选择器等。这些特性使 CSS 结构更具可读性和更易于维护。

每个 CSS 预处理器都有自己的语法，它们编译成常规 CSS，以便浏览器可以在客户端呈现它。CSS 预处理器以或多或少不同的方式做类似的事情，并且每个都有自己的语法和生态系统（工具、框架、库）。现在流行的 CSS 预处理器大概有以下三个：

## [Sass & SCSS](https://sass-lang.com/): Syntactically Awesome Style Sheets

Sass 是最流行和最古老的 CSS 预处理器，最初发布于2006年。它的创造者 Natalie Weizenbaum 和 Hampton Catlin 受到 Haml模板语言的启发，该语言为 HTML 增加了动态功能。他们的目标是在 CSS 中也实现类似的动态功能。因此，他们想出了一个 CSS 预处理器，并将其命名为 Syntactically Awesome Style Sheets。

Sass 预处理器允许我们使用变量、if/else 语句、for/while/each 循环、继承、运算符、插值、混合器和其他动态功能，然后将代码编译成网络浏览器可以解释的普通CSS。

Sass 有两种语法。

- .sass 文件扩展名使用基于缩进的旧语法。
- SCSS 是 Sass 3 引入新的语法，是 Sassy CSS 的简写，是更新和更广泛使用的语法，使用 .scss 文件扩展名。

下面我们来看个例子，可以看到 SCSS 语法更类似 CSS 语法，没有什么上手难度：

```
/* Sass */
$primary-color: seashell $primary-bg: darkslategrey  body
    color: $primary-color     background: $primary-bg

```

```
/* SCSS */ $primary-color: seashell; $primary-bg: darkslategrey;  body {     color: $primary-color;     background: $primary-bg; }
```

Sass 提供了一些很方便我们编写 CSS 的机制，比如 mixin 函数：

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

还有其他很多详细的语法，大家可以去[官方文档](https://sass-lang.com/documentation/syntax)了解阅读，这里不多赘述。

## [LESS](https://lesscss.org/): "Leaner Style Sheets"

LESS 由 Alexis Sellier 在 Sass 之后的 2009 年发布，LESS 受 Sass 影响很多，但其本身也影响了 SCSS。之后 Bootstrap 决定从 LESS 转移到 Sass，这对 LESS 的普及是一个巨大的打击，导致目前来说 SCSS 的普及率高过 LESS 非常多。

LESS 的语法非常像 SCSS，但其逻辑处理能力较弱，有兴趣的小伙伴可以去[官网文档](https://lesscss.org/)了解。

## [Stylus](https://stylus-lang.com/): Expressive, dynamic, and robust CSS

Stylus 的第一个版本是在 LESS 一年后推出的，由前 Node.js 开发者 TJ Holowaychuk 在2010年推出。Stylus 结合了Sass 强大的逻辑能力和 LESS 简单明了的设置，让他在预处理器的市场份额有着一席之地。

当然虽然 Stylus 语法灵活，支持两种不同的语法，但是这也带来了容易导致混乱的缺点，而且大部分人都选择用 Sass，导致目前远不如 Sass 的影响力。

![](/images/component-library-analysis/5.png)

我们可以很清晰的看到，在SCSS 推出 + node-sass 在重构为 dart-sass 之后，爆发式增长，LESS 和 stylus 都没有什么抵抗的力量。如果目前需要选择一个预处理器，这里推荐使用 Sass 的 SCSS 语法。

不过不管这些 CSS 预处理器流行度怎么样，他们都是能帮助我们快速组织编写 CSS 代码的工具，因地制宜即可。甚至后面我们就知道了，我们也不是非要用他们不可。

# [PostCSS](https://postcss.org/)

![](/images/component-library-analysis/6.png)

好了经过上面的部分，我猜你对 Less、Sass 和 Stylus 等预处理程序已经很熟悉。这些工具是当今网络开发生态系统的重要组成部分。但是，传统的预处理器有几个问题：

- 它们不遵循 CSS 标准。每个预处理器都已经有了自己的标准。遗憾的是，它们不以与 W3C 标准兼容为目标，这意味着它们不能把它们的功能作为 polyfills，用于早期测试较新的 W3C 标准。
- 它们是不可扩展的。无论你选择哪种预处理器，你都被限制在它所提供的功能集上。如果你需要在此基础上的任何功能，你需要在构建过程中单独添加。如果你想写你的扩展，你就得靠自己了。

可以看到，尽管传统的预处理器带来了许多很优秀的特性，但他们严格限制了我们的 CSS 编写思路。这就给了 PostCSS 用武之地。

![](/images/component-library-analysis/7.png)

上面这幅图是 PostCSS 的原理，很简单地，你可以把 PostCSS 理解成 Babel 一样的代码转换工具，将我们编写的 CSS 转成可以浏览器可以直接识别的 CSS，而预处理器相当于 Typescript。**PostCSS 接收一个 CSS 文件并提供了一个** **API** **来分析、修改它的规则（通过把 CSS 规则转换成一个** **[抽象语法树](https://zh.wikipedia.org/wiki/%E6%8A%BD%E8%B1%A1%E8%AA%9E%E6%B3%95%E6%A8%B9)** **的方式）。在这之后，这个 API 便可被许多** **插件** **利用来做有用的事情，比如寻错或自动添加 CSS vendor 前缀。**

![](/images/component-library-analysis/8.png)

可以看到，PostCSS 的下载次数远超预处理器之和，这是因为很多很多三方库都基于 PostCSS 的能力来构建。同时 PostCSS 拥有众多插件，比如：Autoprefixer（前缀添加）、lost（基于 calc 的栅格系统）、Stylelint（CSS 格式检查）、CSSNext（使用浏览器未支持的 CSS语法） 等，这些优秀的插件都基于 PostCSS 的能力。

了解完这些之后，我们就会明白，我们其实没有必要纠结使用哪些预处理器了，只需要在 PostCSS 里面安装我们想要的预处理器语法插件就行。

# 高级模块化

其实上面我们介绍的组织 CSS 代码都是具有模块化思想的，但是这些模块化思想都是非自动化的，说白了就是，我们需要时时刻刻记住这些约定，这对于我们的开发效率来说影响甚大。随着 React 框架的火热，前端代码模块不再遵循“关注点分离”原则，而是一个 HTML+CSS+JS 构成的组件为核心。但是 React 并没有像 Vue 一样提供了 scope 等内置机制，因为 React 本身的设计原则决定了其不会提供原生的 CSS 封装方案。旧的代码模块化约定已经不能适应新的开发方式的需求，模块化的两种最强形式呼之欲出。

## [CSS Modules](https://github.com/css-modules/css-modules)

首先是对我们代码编写方式影响较小的 CSS Modules。其实 CSS Modules 在本质上也是 CSS-in-JS 的一种，但其功能比较简单，也类似于关注点分离的写法，所以其从 CSS-in-JS 中独立出来并成为一种独立的思想。

CSS Modules 的核心很简单，就是只管理好 CSS 代码的作用域，让我们可以通过类似 ESM 的方式来组织 CSS 代码。他以 CSS 文件模块为单元，将模块内的选择器附上特殊的哈希字符串，以实现样式的局部作用域。对于大多数 React 项目来说，这种方案已经足够用了。

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

使用 CSS Modules 之后，我们不需要使用任何类似 BEM 的命名约定了，因为我们的 CSS 代码的作用域已经被分隔开了，不要命名一个项目唯一的 CSS 类名。同时我们可以在项目的组件文件夹中直接编写 CSS 文件，这对于我们的开发体验来说是一个质的飞跃。

CSS Modules 可以配合 PostCSS 一起使用，这样我们也可以用各种额外特性，例如 CSS 变量或者预处理器语法等。

## CSS-in-JS

CSS-in-JS 在 2014 年由 Facebook 的员工 Vjeux 在 NationJS 会议上提出：可以借用 JS 解决许多 CSS 本身的一些“缺陷”，比如全局作用域、死代码移除、生效顺序依赖于样式加载顺序、常量共享等等问题。

![](/images/component-library-analysis/10.png)

很明显，CSS-in-JS 是一种没有标准规范的思想，他的主要要义就是在 JS 里面写 CSS。这就导致其实现非常非常多，目前有六十多种 CSS-in-JS 的实现。每隔一段时间，都会有新的语法方案或实现，尝试补充、增强或是修复已有实现。

![](/images/component-library-analysis/11.png)

CSS-in-JS 虽然解决了一些直接编写 CSS 代码的问题，但他也带来了一些问题：

- 使用 CIJ 可能是一种不必要的需求。如果开发者能够充分理解 CSS 的基本概念，比如特异性、级联、继承等，同时运用一些预处理或后处理工具（例如 scss/postcss）和规范化的命名方法（例如 BEM），那么纯 CSS 就可以满足开发需求，无需引入额外的复杂度。
- CIJ 的方案和工具琳琅满目，但是缺乏统一的标准和规范，许多还处于试验性或不稳定的阶段，使用起来存在较大的风险和不确定性。一旦选择了某个方案，就可能面临这个方案被废弃或不兼容的问题，导致代码难以维护或迁移。
- CIJ 会增加运行时的性能开销，因为它需要在浏览器中动态生成和注入 CSS，这会消耗更多的内存和 CPU 资源，影响页面的加载速度和用户体验。

下面我们来看看几种 CIJ 的具体实现。

#### [styled-components](https://styled-components.com/)

![](/images/component-library-analysis/12.png)

styled-components 是一种 CSS-in-JS 的实现方式，它可以让你在 React 组件中直接写 CSS 代码，从而实现组件和样式的一一对应。这样，你就不需要再为每个组件定义一个单独的 CSS 文件或者使用类名来管理样式了，而是可以将样式和组件的逻辑和结构紧密地结合在一起。

styled-components 的原理是利用了 JavaScript 的标签模板字符串（tagged template literals）功能，将 CSS 代码作为一个函数的参数传递，然后在运行时动态生成和注入样式表。例如，你可以这样定义一个按钮组件：

```
import styled from 'styled-components';

const Button = styled.button`
  background: palevioletred;
  color: white;
  border-radius: 4px;
`;
```

这里，styled.button 是一个函数，它接收一个模板字符串作为参数，并返回一个 React 组件。这个组件会渲染一个带有指定样式的按钮元素。你可以像使用任何其他 React 组件一样使用这个 Button 组件：

```
<Button>Click me</Button>
```

styled-components 有以下几个优势：

- 可以避免 CSS 类名的冲突和全局污染，因为它会自动生成唯一的类名。这样，你就不需要担心命名冲突或者覆盖了其他组件的样式了。
- 可以利用 JavaScript 的变量和逻辑来动态地控制样式。例如，你可以根据 props 或者主题来改变组件的颜色、大小、边距等属性。
- 可以支持主题和样式继承等功能，方便实现 UI 的一致性。例如，你可以使用 ThemeProvider 组件来提供一个全局的主题对象，然后在任何组件中通过 props.theme 来访问它。

styled-components 也有以下几个劣势：

- 可能会增加代码的复杂度和可读性，因为需要在 JavaScript 中混合写 CSS 代码。这样，你就不能利用一些专门针对 CSS 的工具或者编辑器功能了，而且也可能降低代码的可维护性和可测试性。
- 可能会影响运行时的性能，因为需要在浏览器中解析和注入样式表。这样，你就不能利用一些针对 CSS 的优化技术了，比如 CSS 提取、压缩、缓存等。
- 可能会导致样式的重复或冗余，因为每个组件都会生成一个独立的样式表。这样，你就不能利用 CSS 的继承和级联机制了，而且也可能增加最终打包后的文件大小。
- 可能会与一些第三方库或工具不兼容，比如 CSS 模块、CSS 提取、CSS Lint 等。这样，你就不能使用这些库或工具来提高你的开发效率和代码质量了。

总之，styled-components 可以让你在 React 组件中直接写 CSS 代码，从而实现组件和样式的一一对应。如果你想使用 styled-components 来开发你的 React 应用，你需要根据你的具体需求和场景来权衡它的利弊，选择适合你的方案。

#### [Emotion](https://emotion.sh/docs/introduction)

![](/images/component-library-analysis/13.png)

Emotion 是另外一个流行的 CSS-in-JS 库，由于这两个库比较类似，我们主要就针对这两个库做一些对比：

- styled-components 和 emotion 都使用了模板字符串（template literals）来创建样式化的组件，这样可以保持CSS的语法和高亮，同时也可以使用JavaScript的变量和表达式。

- styled-components 和 emotion 都支持主题（themes），即一组全局的样式变量，可以在不同的组件中共享和使用。它们也都支持媒体查询（media queries），即根据不同的设备或屏幕尺寸来调整样式。

- styled-components和emotion的主要区别在于：

  - emotion支持更多的API，例如css prop，@emotion/core，@emotion/styled等，而styled-components只支持styled API。可以说这点是差距最大的一点。
  - emotion提供了更好的开发者体验，例如支持自动标签（auto-labels），即在开发者工具中显示组件的名称，以及支持源映射（source maps），即在开发者工具中显示样式的来源文件和行数。
  - emotion具有更高的渲染速度，即在浏览器中将样式应用到组件上所需的时间。根据测试结果，emotion比styled-components 快了约10%。

最终我们还是需要根据自己的项目需求和偏好来选择合适的库。如果项目需要更多的灵活性和性能，可以选择 emotion。如果项目需要更简单和一致的API，可以选择 styled-components。

#### [Stitches](https://stitches.dev/) & [vanilla-extract](https://vanilla-extract.style/)

下面介绍的是两个比较新且评价较好的的 CSS-in-JS 库。

![](/images/component-library-analysis/14.png)

Stitches \*\*是一个 TypeScript 友好的 CSS-in-JS 库，具有接近零运行时，服务器端渲染，多变量支持和一流的开发人员体验。vanilla-extract 是一个 Stitches 的竞争对手，称自己为“CSS Modules-in-TypeScript”，vanilla-extract 是真正的零运行时（Stitches 6 kB gzipped）。

> 类似 styled-components 的 CSS-in-JS 库由于需要在运行时动态注入 CSS，性能较差，而新的 CSS-in-JS 库基本都抛弃了运行时的思路，转而在编译阶段生成固定的 CSS 代码。这样有两个好处：
>
> 1.  可以减小 JS 文件的体积
> 1.  可以完美支持 SSR
> 1.  加快客户端运行速度

具体到他们的区别，可以看看这篇文章：[Vanilla-Extract & Stitches: A Comparison](https://dev.to/nayaabkhan/vanilla-extract-stitches-a-comparison-58c2)，总之，vanilla-extract 是最为先进、迅猛的 CSS-in-JS 库，因为他是真正的零运行时库，**FCP 可能稍大，但** **TTL** **很小，用户体验很棒，适合开发大型应用。** 我们来简单看个 vanilla-extract 的 demo：

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

原子 CSS 就像是实用工具优先（utility-first）CSS 的一个极端版本: 所有 CSS 类都有一个唯一的 CSS 规则。原子 CSS 最初是由 Thierry Koblentz (Yahoo!)在 2013 年[挑战 CSS 最佳实践](https://link.juejin.cn?target=https%3A%2F%2Fwww.smashingmagazine.com%2F2013%2F10%2Fchallenging-css-best-practices-atomic-approach%2F)时使用的。在前端构建工具没有成熟的时候，这种思想基本很难实现，但是现在借助 PostCSS 的力量，有一些原子化 CSS 库例如 [Tailwind CSS](https://tailwindcss.com/) 开始被广泛使用。

```
.m-0 {
    margin: 0;
}

.text-red {
    color: red;
}
```

下面这个在组件数量膨胀的情况下，使用原子化和不使用原子化的性能图。可以看到不使用原子化 CSS 的时候是线性增长，而使用之后是对数增长。因为原子化 CSS 的上限是固定的，而普通 class 的上限是不确定的，随着组件数量的增加，使用的原子化 CSS class 数量趋于稳定，而普通 class 数量依旧在一路狂奔。

![](/images/component-library-analysis/16.png)

[Tailwind CSS](https://tailwindcss.com/) 这里就不多介绍了，其流行程度完全超过了流行程度最高的组件库 MUI（人们都喜欢自己造轮子）。而 Tailwind CSS 的最新竞对 [UnoCSS](https://unocss.dev/)，由 Vite 核心团队打造，不使用 PostCSS，性能比 Tailwind CSS 快 100 倍。具体快的来龙去脉可以参考这篇文章：[重新构想原子化 CSS](https://antfu.me/posts/reimagine-atomic-css-zh)。

当然原子化 CSS 也有缺点：

- 不易维护。如果要修改常用的原子类，如 m20（表示 margin 20px ），要么改变它的定义（违背它的命名），要么批量替换它的引用（费时费力）。如果只要修改部分引用，就更麻烦了。
- 学习成本。影响开发效率，解决方案安装对应的vscode插件，语法提示能够帮助我们，但是仍然无法完全避免去翻官方文档。

# 总结

希望你能通过以上，了解 CSS 的发展脉络，在开发过程选择合适的 CSS 技术提高我们的开发效率。随着前端的发展，CSS 技术仍然在不断进化，我们也要时刻保持学习的心态，去接触最前沿的知识。

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
