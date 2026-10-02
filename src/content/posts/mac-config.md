---
title: 新 Mac 到手后的开发配置
date: 2023-01-01T16:00:00.000+00:00
---

新 Mac mini 到手后，我一边配置开发环境，一边记下安装步骤。下面保留的是这次配置用到的软件、命令和机器选择，价格及下载链接都属于当时的记录。

## 机器选择

下面按移动办公和固定办公列出当时的选择：

|        | Macbook - 移动办公需求                                                      | Mac mini - 固定办公需求                                                                     |
| ------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| M1     | 老模具，轻，性价比高                                                        | 最有性价比，二手 2.5k 可以拿下，不确定自己是否需要 Mac 但对 Mac 感兴趣的，可以先入一个玩玩  |
| M1 Pro | 新模具，非常重，周边配置up，续航一般                                        | \                                                                                           |
| M2     | 新模具，重，周边配置up，可以选 15 寸，续航最强                              | 比 M1 贵个几百，省心一些（毕竟 M1 停产了），但是默认配置才8+256，过渡使用可以，长期使用不佳 |
| M2 Pro | 有钱的可以上，不过我是觉得前端用不到这么多花里胡哨的周边配置，M2 air 足够了 | 默认配置 16+512+四个雷电口，可以不用买拓展坞了，当时希望能用 5 年，价格也高一些               |

我这台 M2 Pro 是在某鱼买的二手，99 新，硬盘读写量约 3 TB，价格大概是原价的 75 折。

# 基本应用安装

激活并登录 Apple ID 后，我先用 Safari 下载下面这些应用。Apple Silicon 机器需要选择对应的芯片版本。

直接下载：

- [Chrome](https://www.google.cn/intl/zh-CN/chrome/)：登录 Google 账号同步
- [Edge](https://www.microsoft.com/zh-cn/edge?form=MA13FJ&a807)：登录 Microsoft 帐户同步，开启 Bing
- [Clash for windows](https://github.com/Fndroid/clash_for_windows_pkg/releases) [github.com](https://github.com/Fndroid/clash_for_windows_pkg/releases/download/0.20.36/Clash.for.Windows-0.20.36-arm64.dmg)：自行搜索了解
- [VSCode](https://code.visualstudio.com/)：拖放到应用程序里面，登录 Github 帐户同步
- [Figma](https://www.figma.com/downloads/)：注意登录的账号
- [Motrix](https://motrix.app/download)：用来下载东西，配合[脚本](https://greasyfork.org/zh-CN/scripts/465078-tt%E5%8A%A9%E6%89%8B-%E7%99%BE%E5%BA%A6%E7%BD%91%E7%9B%98%E5%B7%A5%E5%85%B7%E7%AE%B1%E7%9B%B4%E9%93%BE%E8%A7%A3%E6%9E%90-%E6%8C%81%E7%BB%AD%E6%9B%B4%E6%96%B0)使用
- [Cisco AnyConnect Secure Mobility Client](https://sysin.org/blog/cisco-anyconnect-4/)：有些公司会要用
- iHosts：改 host 工具

其他：

- Office 365 三件套
- [飞书](https://www.feishu.cn/download)
- [微信](https://mac.weixin.qq.com/?t=mac&lang=zh_CN)
- 网易云音乐
- Notion
- 微信输入法：主要还是系统自己的输入法经常抽风

# 配置 SSH Key

1. 打开终端，替换为自己的邮箱地址，运行命令生成 SSH 密钥对。公司邮箱和个人邮箱注意区分。

```shell
ssh-keygen -t ed25519 -C "your_email@example.com"

```

2. 将公钥复制到剪贴板。这里复制的是 `.pub` 文件：

```shell
pbcopy < ~/.ssh/id_ed25519.pub

```

3. 在 GitHub 或 GitLab 的 SSH Key 设置里添加这个公钥。

# Brew 安装 - Mac 软件包管理器

```shell
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"

```

- 中间 Mac 会提示安装 Git，确认即可，然后重新运行命令
- 安装过程中按提示选择源

# Warp 安装 - AI 终端

```shell
brew install --cask warp

```

# Oh-my-zsh 安装 - zsh 配置

```shell
sh -c "$(curl -fsSL https://gitee.com/shmhlsy/oh-my-zsh-install.sh/raw/master/install.sh)"

```

# Nvm 安装 - Node 版本控制

```shell
brew install nvm

```

安装后，更改 zsh 配置

```shell
mkdir ~/.nvm
vim ~/.zshrc

```

vim 添加以下配置

```shell
export NVM_DIR="$HOME/.nvm"
  [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"  # This loads nvm
  [ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion

export NVM_DIR="$HOME/.nvm"
  [ -s "/usr/local/opt/nvm/nvm.sh" ] && \. "/usr/local/opt/nvm/nvm.sh"  # This loads nvm
  [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/usr/local/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion

    export NVM_DIR="$HOME/.nvm"
  [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"  # This loads nvm
  [ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion

```

这个历史片段同时列了 `/opt/homebrew` 和 `/usr/local` 两个路径，还重复了一组配置。实际配置时只取自己安装路径对应的一组；nvm 配置以安装时的提示为准。

然后执行以下命令刷新 zsh 配置

```shell
source ~/.zshrc

```

# Node 安装 - 前端工具运行环境

参考以下命令，安装合适你项目的 Node 版本

```shell
nvm install stable # 安装最新稳定版
nvm install <version> # 安装指定版
nvm uninstall <version> # 卸载指定版
nvm use <version> # 临时使用版本
nvm alias default <version> # 切换默认使用版本
nvm ls # 列出全部版本
nvm current # 查看当前版本

```

# 包管理工具安装 - yarn & pnpm

```shell
npm install -g yarn
npm install -g pnpm

```

# nrm 安装 - npm 源控制

```shell
npm i -g nrm

nrm add <registry> <url> # 自定义源

```
