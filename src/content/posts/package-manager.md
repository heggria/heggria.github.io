---
title: npm、Yarn、pnpm 的依赖管理笔记
date: 2022-08-03T16:00:00.000+00:00
---

这篇是 2022 年整理的包管理笔记，主要参考 npm v8 文档，并回顾 npm 早期版本、Yarn Classic 和 pnpm 的依赖布局。例子里的 lockfile 结构与安装机制保留当时语境。

我想弄清楚的不是安装命令怎么写，而是依赖装在哪里、版本如何固定，以及项目为什么能访问到没声明的包。最后也记了一点 Monorepo。

# NPM

npm 是 Node.js 默认附带的包管理器。先从 `package.json` 和依赖布局看起。

## `package.json`

`package.json` 描述项目、依赖和脚本等配置。

[package.json | npm Docs](https://docs.npmjs.com/cli/v8/configuring-npm/package-json)

### `dependencies`

https://github.com/npm/node-semver

[语义化版本 2.0.0](https://semver.org/lang/zh-CN/)

### `peerDependencies`

`peerDependencies` 声明包对宿主依赖版本的要求。下面是当时记录的安装关系；第一条容易被理解成忽略所有约束，不能按这个字面意思配置项目。具体安装和冲突处理需结合 npm 版本与参数。

- 如果用户显式依赖了核心库，则可以忽略各插件的 `peerDependency` 声明
- 如果用户没有显式依赖核心库，则按照插件 `peerDependencies` 中声明的版本将库安装到项目根目录中
- 当用户依赖的版本、各插件依赖的版本之间不相互兼容，会报错让用户自行修复

编写插件或组件库时，需要区分哪些依赖由宿主提供，哪些属于包自己的实现，不能把所有依赖都放到这里。

### `devDependencies`

测试、文档和开发工具通常属于 `devDependencies`。使用这个包的项目，不需要把这些开发依赖一起装进来。

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

- `description` `keywords` `homepage` `bugs` `license` `author` `contributors` `funding` 项目信息
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

在 `npm` 的**早期版本**，`npm` 处理依赖的方式简单粗暴，以递归的形式严格按照 `package.json` 结构以及子依赖包的 `package.json` 结构将依赖安装到他们各自的 `node_modules` 中。直到某个依赖不再依赖其他模块。

这样的方式优点很明显， `node_modules` 的结构和 `package.json` 结构一一对应，层级结构明显，并且保证了每次安装目录结构都是相同的。

依赖多起来之后，重复文件和很深的路径就成了问题。

![截屏2022-08-05 13.51.23.png](/images/package-management-0-0.png#pic_center)

- 在不同层级的依赖中，可能引用了同一个模块，导致大量冗余。
- 当时笔记关注 Windows 的传统 260 字符路径限制，嵌套层级过深可能遇到问题。这里不能把 260 字符当成所有 Windows 配置的统一上限。

### 扁平结构

![截屏2022-08-05 13.54.13.png](/images/package-management-0-1.png#pic_center)

若在模块中又依赖了 `m1@^0.1.5` 版本，当安装到相同模块时，判断已安装的模块版本是否符合新模块的版本范围，如果符合则跳过，不符合则在当前模块的 `node_modules` 下安装该模块。

对应的，如果我们在项目代码中引用了一个模块，模块查找流程如下：

- 在当前模块路径下搜索
- 在当前模块 `node_modules` 路径下搜索
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

`package-lock.json` 记录解析后的依赖，用来提高安装结果的可重复性。环境和安装参数仍可能影响结果，不能把 lockfile 当成任何情况下目录都完全相同的保证。下面看一个早期格式的例子。

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

应用项目可以把 `package-lock.json` 提交到仓库，供团队和 CI 复现依赖。包自身的 lockfile 与消费者安装这个包时的版本选择是两件事，不能据此断言发布包带 lockfile 就无法共享依赖。

## 缓存

在执行 `npm install` 或 `npm update`命令下载依赖后，除了将依赖包安装在`node_modules` 目录下外，还会在本地的缓存目录缓存一份。

通过 `npm config get cache` 命令可以查询到：在 `Linux` 或 `Mac` 默认是用户主目录下的 `.npm/_cacache` 目录。

在这个目录下又存在两个目录：`content-v2`、`index-v5`，`content-v2` 目录用于存储 `tar`包的缓存，而`index-v5`目录用于存储`tar`包的 `hash`。

`npm` 在执行安装时，可以根据 `package-lock.json` 中存储的 `integrityversion、name` 生成一个唯一的 `key` 对应到 `index-v5` 目录下的缓存记录，从而找到 `tar`包的 `hash`，然后根据 `hash` 再去找缓存的 `tar` 包直接使用。

# YARN

下面保留 Yarn 早期与旧版 npm 的比较。它们是当时整理的说法，不宜直接套到后续版本，尤其缓存并非 Yarn 独有：

- 并行安装：无论 npm 还是 Yarn 在执行包的安装时，都会执行一系列任务。npm 是按照队列执行每个 package，也就是说必须要等到当前 package 安装完成之后，才能继续后面的安装。而 Yarn 会并行安排安装任务。
- 离线模式：如果之前已经安装过一个软件包，用 Yarn 再次安装时直接从缓存中获取，就不用像npm那样再从网络下载了。
- 版本锁定：为了防止拉取到不同的版本，Yarn 有一个锁定文件 (lock file) 记录了被确切安装上的模块的版本号。
- 多注册来源处理：所有的依赖包，不管他被不同的库间接关联引用多少次，安装这个包时，只会从一个注册来源去装，要么是 npm 要么是 bower, 防止出现混乱不一致。
- 更好的语义化： yarn改变了一些npm命令的名称，比如 yarn add/remove，感觉上比 npm 原本的 install/uninstall 要更清晰。

### **手动修改 package.json 依赖版本**

npm 生成 package-lock.json 后，重复执行 npm install 时将会以其记录的版本来安装。这时如果手动修改 package.json 中的版本，重新安装也不会生效，只能手动执行 npm install 命令指定依赖版本来进行修改。

当时记录的 Yarn 行为是对比 `yarn.lock` 与 `package.json`，再更新 lockfile。上面关于 npm 修改版本“不生效”的说法缺少版本与复现条件，不作为通用区别。

`yarn.lock` 固定已解析的依赖版本，但不会把所有包统一成同一个版本。项目仍可能同时安装多个版本，兼容性和磁盘占用需要分别处理。

### 关于项目和依赖库引用不同版本的包的情况

以 `webpack` 为例，会先找当前目录的 `node_modules` 中是否有这个模块，然后再找上一级目录的`node_modules`，一直找到根目录。这么做，就能保证 `webpack` 能顺利找到模块了。

那么，如果我们的依赖库有已经依赖了 A，而我们的项目也要依赖 A 的话，需要在项目的`package.json` 重新依赖 A，而不是去依赖依赖库的 A。

![Untitled](/images/package-management-1.png)

在 `package.json` 中我们只声明了 `nui`，A 是因为扁平化处理才放到和 `nui` 同级的 `node_modules`下，理论上在项目中写代码时只可以使用 `nui`，但实际上B~F也可以使用，由于扁平化将没有直接依赖的包提升到node_modules一级目录，Node.js没有校验是否有直接依赖，所以项目中可以访问没有声明过依赖的包。

这会产生两个问题：

- A 中的包升级后，项目可能出问题
- 额外的管理成本(比如协作时别人运行一次 `npm install` 后项目依旧跑不起来)

[pnpm's strictness helps to avoid silly bugs](https://medium.com/pnpm/pnpms-strictness-helps-to-avoid-silly-bugs-9a15fb306308)

# PNPM

接着看 pnpm。这里重点是它如何共享依赖文件，以及如何保持依赖之间的隔离。

![alotta-files.svg](/images/package-management-2.svg)

[Benchmarks of JavaScript Package Managers | pnpm](https://pnpm.io/benchmarks)

### 中心化的依赖管理

当使用 npm 或 Yarn 时，如果你有 100 个项目使用了某个依赖（dependency），就会有 100 份该依赖的副本保存在硬盘上。 而在使用 pnpm 时，依赖会被存储在内容可寻址的存储中，所以：

1. 如果你用到了某依赖项的不同版本，只会将不同版本间有差异的文件添加到仓库。 例如，如果某个包有100个文件，而它的新版本只改变了其中1个文件。那么 `pnpm update` 时只会向存储中心额外添加1个新文件，而不会因为仅仅一个文件的改变复制整新版本包的内容。
2. 所有文件都会存储在硬盘上的某一位置。 当软件包被被安装时，包里的文件会硬链接到这一位置，而不会占用额外的磁盘空间。 这允许你跨项目地共享同一版本的依赖。

依赖文件能够跨项目复用时，就可以减少重复存储。具体节省多少空间、安装快多少，仍要看项目和环境。

![Untitled](/images/package-management-3.png)

### **非扁平化的 node_modules**

npm 或 Yarn Classic 的依赖提升，会让部分间接依赖出现在根目录的 `node_modules` 中。项目于是可能访问到自己没有声明的包，但并不是所有版本都能一起提升。

pnpm 的 `node_modules` 保留了依赖之间的关系，避免了这个问题，同时将依赖链接至依赖中心，中心使用扁平化结构。这个平铺的结构避免了 npm v2 创建的嵌套 `node_modules` 引起的长路径问题，但与 npm v3,4,5,6 或 yarn v1 创建的平铺的 `node_modules` 不同的是，它保留了包之间的相互隔离。

![node-modules-structure-8ab301ddaed3b7530858b233f5b3be57.jpg](/images/package-management-4.jpg)

[平铺的结构不是 node_modules 的唯一实现方式 | pnpm](https://pnpm.io/zh/blog/2020/05/27/flat-node-modules-is-not-the-only-way)

[基于符号链接的 node_modules 结构 | pnpm](https://pnpm.io/zh/symlinked-node-modules-structure)

[peers 是如何被处理的 | pnpm](https://pnpm.io/zh/how-peers-are-resolved)

# Monorepo

Monorepo 把多个工程放进同一个仓库管理。这里想强调的是工程之间仍有自己的边界，可以分别开发和维护，并通过工具共享代码。范围可以按业务或职能组织；规模越大，对仓库工具的要求也越高。

![modb_20220221_42d7330c-92df-11ec-97a2-fa163eb4f6be.png](/images/package-management-5.png)

从图中我们来分析三种策略在架构模式上核心的不同点：

- Monorepo：只有一个仓库，并且把项目拆分多个独立的代码工程进行管理，而代码工程之间可以通过相应的工具简单的进行代码共享。
- Single-repo Monolith：同样也只有一个仓库，而它并不会独立的分割每个代码工程，而是让他们成为一体来进行开发管理，模块的拆分取决于代码工程的设计。
- Multi-repo：则是通过建立多个仓库，每个仓库包含拆分好的代码工程，而仓库间的调用共享则是通过NPM或者其他代码引用的方式进行。

Yarn 和 pnpm 都有 workspace 能力，可以用于组织这类仓库。
