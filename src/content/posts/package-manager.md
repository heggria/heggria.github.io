---
title: 前端工程之包管理 - npm/yarn/pnpm
date: 2022-08-03T16:00:00.000+00:00
duration: 20min
---

程序员实现某个功能，不会从零开始开发，都要基于大量第三方已经写好的功能模块，进行组装、扩展。借助开源力量，大量重复的有用的功能，被分成一个个单独的小模块（包），程序员之间可以进行共享，共同维护，测试、更新、添加更多新的功能。

这篇文章将主要介绍 `npm`、`yarn`、`pnpm` 三种包管理器，以及 `monorepo`。

# NPM

任何现代化的前端工程，都需要借助 npm 来管理项目中大量的依赖包。npm 作为 node.js 的默认包管理器，使用人数最多。

## `package.json`

首先，我们来认识一下 `package.json`。`package.json` 作为前端工程的配置文件，描述了项目和依赖包信息，是至关重要的存在。

[package.json | npm Docs](https://docs.npmjs.com/cli/v8/configuring-npm/package-json)

### `dependencies`

https://github.com/npm/node-semver

[语义化版本 2.0.0](https://semver.org/lang/zh-CN/)

### `peerDependencies`

`peerDependencies` 标识其依赖于宿主环境的依赖，其安装的依赖树是扁平的

- 如果用户显式依赖了核心库，则可以忽略各插件的 `peerDependency` 声明
- 如果用户没有显式依赖核心库，则按照插件 `peerDependencies` 中声明的版本将库安装到项目根目录中
- 当用户依赖的版本、各插件依赖的版本之间不相互兼容，会报错让用户自行修复

我们在编写开源包的时候，要尽量把依赖写在这里面，防止宿主环境和依赖包依赖不同出现的各种问题。

### `devDependencies`

如果有人计划在他们的工程中使用你的模块，那么他们可能不希望或不需要下载和构建您使用的外部测试或文档框架。在这种情况下，最好将这些附加项映射到 `devDependencies` 对象中。

这些东西将在从包的根目录执行 `npm link` 或 `npm install` 时安装，并且可以像任何其他 npm 配置参数一样进行管理。对于不特定于平台的构建步骤，例如将 CoffeeScript 或其他语言编译为 JavaScript，请使用 prepare 脚本来执行此操作，并将所需的包设置为 `devDependency`。

### `bundleDependencies`

定义了在发布包时将捆绑的包名称数组，可以指定包名称并执行 npm pack 将包捆绑在一个 tarball 文件中。

### **`optionalDependencies`**

可选的依赖项，npm 会尝试进行安装，如果安装失败不会中断 `npm install`

### **`overrides`**

全局依赖树版本覆盖，遵循父子级匹配。详见 [package.json | npm Docs](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#overrides)

### 其他属性

- `name`、`version` 共同构成一个假定完全唯一的标识符。

  - `name`

    - 名称必须少于或等于 214 个字符。
    - 新包的名称中不得包含大写字母。
    - 该名称最终成为 URL、命令行参数和文件夹名称的一部分。因此，名称不能包含任何非 URL 安全字符。
    - 范围包的名称可以以点或下划线开头，没有范围则不允许。[scope | npm Docs](https://docs.npmjs.com/cli/v8/using-npm/scope)

    - `version` 版本必须可由 `node-semver` 解析

- `description` `keywords` `homepage` `bugs` `license` `author` \*\*\*\*`contributors` `funding` 项目信息
- `engines` 环境版本、`os` 运行系统、`cpu` 运行 CPU
- `files` 作为依赖包时安装的必须具有的文件
- `publishConfig` 发布时使用的 `npm` 配置值 [config | npm Docs](https://docs.npmjs.com/cli/v8/using-npm/config)

- `private` 私有包标识
- `workspaces` **工作空间，后面会详细说明**
- `man` 指定单个文件或文件名数组以供 man 程序查找。
- `directories` 目录
- `repository` 代码仓库
- `scripts` npm 生命周期运行的脚本 [scripts | npm Docs](https://docs.npmjs.com/cli/v8/using-npm/scripts)

- `config` 配置参数

## `node_modules`

### **嵌套结构**

在 `npm` 的**早期版本**，`npm` 处理依赖的方式简单粗暴，以递归的形式严格按照 `package.json` 结构以及子依赖包的 `package.json` 结构将依赖安装到他们各自的 `node_modules` 中。直到有子依赖包不在依赖其他模块。

这样的方式优点很明显， `node_modules` 的结构和 `package.json` 结构一一对应，层级结构明显，并且保证了每次安装目录结构都是相同的。

但是，试想一下，如果你依赖的模块非常之多，你的 `node_modules` 将非常庞大，嵌套层级非常之深。

![截屏2022-08-05 13.51.23.png](/images/package-management-0-0.png#pic_center)

- 在不同层级的依赖中，可能引用了同一个模块，导致大量冗余。
- 在 `Windows` 系统中，文件路径最大长度为260个字符，嵌套层级过深可能导致不可预知的问题。

### 扁平结构

![截屏2022-08-05 13.54.13.png](/images/package-management-0-1.png#pic_center)

若在模块中又依赖了 `m1@^0.1.5` 版本，当安装到相同模块时，判断已安装的模块版本是否符合新模块的版本范围，如果符合则跳过，不符合则在当前模块的 `node_modules` 下安装该模块。

对应的，如果我们在项目代码中引用了一个模块，模块查找流程如下：

- 在当前模块路径下搜索
- 在当前模块 `node_modules` 路径下搜素
- 在上级模块的 `node_modules` 路径下搜索
- ...
- 直到搜索到全局路径中的 `node_modules`

为了解决以上问题，`NPM` 在 `3.x` 版本做了一次较大更新。其将早期的嵌套结构改为扁平结构。

安装模块时，不管其是直接依赖还是子依赖的依赖，优先将其安装在 `node_modules` 根目录。

![截屏2022-08-05 14.06.18.png](/images/package-management-0-2.png)

`npm 3.x` 版本并未完全解决老版本的模块冗余问题。`package.json` 内依赖的顺序决定了其安装的顺序，导致相同的依赖可能会出现不同的 `node_modules` 安装结果。

下图展示了不同依赖安装顺序导致的 `node_modules` 结构的不同。

![截屏2022-08-05 14.19.20.png](/images/package-management-0-3.png)

## `package-lock.json`

为了解决 `npm install` 的不确定性问题，在 `npm 5.x` 版本新增了 `package-lock.json` 文件，而安装方式还沿用了 `npm 3.x` 的扁平化的方式。

`package-lock.json` 的作用是锁定依赖结构，即只要你目录下有 `package-lock.json` 文件，那么你每次执行 `npm install` 后生成的 `node_modules` 目录结构一定是完全相同的。

```json
// package.json
{
  "name": "my-app",
  "dependencies": {
    "buffer": "^5.4.3",
    "ignore": "^5.1.4",
    "base64-js": "1.0.1"
  }
}
```

```json
// package-lock.json
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "base64-js": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.0.1.tgz",
      "integrity": "sha1-aSbRsZT7xze47tUTdW3i/Np+pAg="
    },
    "buffer": {
      "version": "5.4.3",
      "resolved": "https://registry.npmjs.org/buffer/-/buffer-5.4.3.tgz",
      "integrity": "sha512-zvj65TkFeIt3i6aj5bIvJDzjjQQGs4o/sNoezg1F1kYap9Nu2jcUdpwzRSJTHMMzG0H7bZkn4rNQpImhuxWX2A==",
      "requires": {
        "base64-js": "^1.0.2",
        "ieee754": "^1.1.4"
      },
      "dependencies": {
        "base64-js": {
          "version": "1.3.1",
          "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.3.1.tgz",
          "integrity": "sha512-mLQ4i2QO1ytvGWFWmcngKO//JXAQueZvwEKtjgQFM4jIK0kU+ytMfplL8j+n5mspOfjHwoAg+9yhb7BwAHm36g=="
        }
      }
    },
    "ieee754": {
      "version": "1.1.13",
      "resolved": "https://registry.npmjs.org/ieee754/-/ieee754-1.1.13.tgz",
      "integrity": "sha512-4vf7I2LYV/HaWerSo3XmlMkp5eZ83i+/CDluXi/IGTs/O1sejBNhTtnxzmRZfvOUqj7lZjqHkeTvpgSFDlWZTg=="
    },
    "ignore": {
      "version": "5.1.4",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-5.1.4.tgz",
      "integrity": "sha512-MzbUSahkTW1u7JpKKjY7LCARd1fU5W2rLdxlM4kdkayuCwZImjkpluF9CM1aLewYJguPDqewLam18Y6AU69A8A=="
    }
  }
}
```

最外面的两个属性 `name` 、`version` 同 `package.json` 中的 `name` 和 `version` ，用于描述当前包名称和版本。

`dependencies` 是一个对象，对象和 `node_modules` 中的包结构一一对应，对象的 `key` 为包名称，值为包的一些描述信息：

- `version`：包版本 —— 这个包当前安装在 `node_modules` 中的版本
- `resolved`：包具体的安装来源
- `integrity`：包 `hash` 值，基于 `Subresource Integrity` 来验证已安装的软件包是否被改动过、是否已失效。
- `requires`：对应子依赖的依赖，与子依赖的 `package.json` 中 `dependencies` 的依赖项相同。
- `dependencies`：结构和外层的 `dependencies` 结构相同，存储安装在子依赖`node_modules` 中的依赖包。

这里注意，并不是所有的子依赖都有 `dependencies` 属性，只有子依赖的依赖和当前已安装在根目录的 `node_modules` 中的依赖冲突之后，才会有这个属性。

<aside>
👉 把 `package-lock.json` 文件提交到代码版本仓库，保证所有团队开发者以及 `CI` 环节可以在执行 `npm install` 时安装的依赖版本都是一致的。
在开发一个 `npm` 包时，你的 `npm` 包是需要被其他仓库依赖的，由于上面我们讲到的扁平安装机制，如果你锁定了依赖包版本，你的依赖包就不能和其他依赖包共享同一 `semver` 范围内的依赖包，这样会造成不必要的冗余。

</aside>

## 缓存

在执行 `npm install` 或 `npm update`命令下载依赖后，除了将依赖包安装在`node_modules` 目录下外，还会在本地的缓存目录缓存一份。

通过 `npm config get cache` 命令可以查询到：在 `Linux` 或 `Mac` 默认是用户主目录下的 `.npm/_cacache` 目录。

在这个目录下又存在两个目录：`content-v2`、`index-v5`，`content-v2` 目录用于存储 `tar`包的缓存，而`index-v5`目录用于存储`tar`包的 `hash`。

`npm` 在执行安装时，可以根据 `package-lock.json` 中存储的 `integrityversion、name` 生成一个唯一的 `key` 对应到 `index-v5` 目录下的缓存记录，从而找到 `tar`包的 `hash`，然后根据 `hash` 再去找缓存的 `tar` 包直接使用。

# YARN

Yarn 是为了弥补 npm 的一些缺陷而出现的。在 NPM v5 没出之前，Yarn 对 npm 有碾压性的优势：

- 并行安装：无论 npm 还是 Yarn 在执行包的安装时，都会执行一系列任务。npm 是按照队列执行每个 package，也就是说必须要等到当前 package 安装完成之后，才能继续后面的安装。而 Yarn 是同步执行所有任务，提高了性能。
- 离线模式：如果之前已经安装过一个软件包，用Yarn再次安装时之间从缓存中获取，就不用像npm那样再从网络下载了。
- 版本锁定：为了防止拉取到不同的版本，Yarn 有一个锁定文件 (lock file) 记录了被确切安装上的模块的版本号。
- 多注册来源处理：所有的依赖包，不管他被不同的库间接关联引用多少次，安装这个包时，只会从一个注册来源去装，要么是 npm 要么是 bower, 防止出现混乱不一致。
- 更好的语义化： yarn改变了一些npm命令的名称，比如 yarn add/remove，感觉上比 npm 原本的 install/uninstall 要更清晰。

### **手动修改 package.json 依赖版本**

npm 生成 package-lock.json 后，重复执行 npm install 时将会以其记录的版本来安装。这时如果手动修改 package.json 中的版本，重新安装也不会生效，只能手动执行 npm install 命令指定依赖版本来进行修改。

yarn 则会将对比 yarn.lock 和 package.json 进比，更新 yarn.lock 文件。

yarn.lock 保证install后产生确定的依赖结构。但这并不能完全解决问题，node_modules中依然存在各种不同版本的F，而这可能导致各种情况的编译报错，以及安装占磁盘空间。

### 关于项目和依赖库引用不同版本的包的情况

以 `webpack` 为例，会先找当前目录的 `node_modules` 中是否有这个模块，然后再找上一级目录的`node_modules`，一直找到根目录。这么做，就能保证 `webpack` 能顺利找到模块了。

那么，如果我们的依赖库有已经依赖了 A，而我们的项目也要依赖 A 的话，需要在项目的`package.json` 重新依赖 A，而不是去依赖依赖库的 A。

![Untitled](/images/package-management-1.png)

在 `package.json` 中我们只声明了 `nui`，A 是因为扁平化处理才放到和 `nui` 同级的 `node_modules`下，理论上在项目中写代码时只可以使用 `nui`，但实际上B~F也可以使用，由于扁平化将没有直接依赖的包提升到node_modules一级目录，Node.js没有校验是否有直接依赖，所以项目中可以**非法访问**没有声明过依赖的包。

这会产生两个问题：

- A 中的包升级后，项目可能出问题
- 额外的管理成本(比如协作时别人运行一次 `npm install` 后项目依旧跑不起来)

[pnpm's strictness helps to avoid silly bugs](https://medium.com/pnpm/pnpms-strictness-helps-to-avoid-silly-bugs-9a15fb306308)

# PNPM

pnpm(Performance npm) 的作者 Zoltan Kochan 发现 yarn 并没有打算去解决上述的这些问题，于是另起炉灶，写了全新的包管理器。

![alotta-files.svg](/images/package-management-2.svg)

[Benchmarks of JavaScript Package Managers | pnpm](https://pnpm.io/benchmarks)

### 中心化的依赖管理

当使用 npm 或 Yarn 时，如果你有 100 个项目使用了某个依赖（dependency），就会有 100 份该依赖的副本保存在硬盘上。 而在使用 pnpm 时，依赖会被存储在内容可寻址的存储中，所以：

1. 如果你用到了某依赖项的不同版本，只会将不同版本间有差异的文件添加到仓库。 例如，如果某个包有100个文件，而它的新版本只改变了其中1个文件。那么 `pnpm update` 时只会向存储中心额外添加1个新文件，而不会因为仅仅一个文件的改变复制整新版本包的内容。
2. 所有文件都会存储在硬盘上的某一位置。 当软件包被被安装时，包里的文件会硬链接到这一位置，而不会占用额外的磁盘空间。 这允许你跨项目地共享同一版本的依赖。

因此，您在磁盘上节省了大量空间，这与项目和依赖项的数量成正比，并且安装速度要快得多！

![Untitled](/images/package-management-3.png)

### **非扁平化的 node_modules**

使用 npm 或 Yarn Classic 安装依赖项时，所有包都被提升到模块目录的根目录。 因此，项目可以访问到未被添加进当前项目的依赖。

而 pnpm 的 node_modules \*\*\*\*使用回了嵌套结构，避免了这个问题，同时将依赖链接至依赖中心，中心使用扁平化结构。这个平铺的结构避免了 npm v2 创建的嵌套 `node_modules` 引起的长路径问题，但与 npm v3,4,5,6 或 yarn v1 创建的平铺的 `node_modules` 不同的是，它保留了包之间的相互隔离。

![node-modules-structure-8ab301ddaed3b7530858b233f5b3be57.jpg](/images/package-management-4.jpg)

[平铺的结构不是 node_modules 的唯一实现方式 | pnpm](https://pnpm.io/zh/blog/2020/05/27/flat-node-modules-is-not-the-only-way)

[基于符号链接的 node_modules 结构 | pnpm](https://pnpm.io/zh/symlinked-node-modules-structure)

[peers 是如何被处理的 | pnpm](https://pnpm.io/zh/how-peers-are-resolved)

# Monorepo

Monorepo 可以理解为一种基于仓库的代码管理策略，它提出将多个代码工程“独立”的放在一个仓库里的管理模式，其中“独立”这个词非常重要，每个代码工程在逻辑上是可以独立运行开发以及维护管理的。Monorepo在实际场景中的运用可以非常宽泛，甚至有企业将它所有业务和不同方向语言的代码放在同一个仓库中管理，当然，这样的运用方式对企业的仓库底层能力要求相当高。因此，更多的Monorepo 实践会根据业务和职能范围来进行组织。

![modb_20220221_42d7330c-92df-11ec-97a2-fa163eb4f6be.png](/images/package-management-5.png)

从图中我们来分析三种策略在架构模式上核心的不同点：

- Monorepo：只有一个仓库，并且把项目拆分多个独立的代码工程进行管理，而代码工程之间可以通过相应的工具简单的进行代码共享。
- Single-repo Monolith：同样也只有一个仓库，而它并不会独立的分割每个代码工程，而是让他们成为一体来进行开发管理，模块的拆分取决于代码工程的设计。
- Multi-repo：则是通过建立多个仓库，每个仓库包含拆分好的代码工程，而仓库间的调用共享则是通过NPM或者其他代码引用的方式进行。

yarn 和 pnpm 都天生支持 Monorepo。
