Claude Code 和 Codex 每开始一个会话，对它所在的检出，除了里面的文件之外一无所知。你的代理却可能
知道很多：这个项目是什么、定下了什么以及为什么、以前什么失败过、你昨天停在了哪里。它们可以通过
MCP 去问它，但一个模型很少会为了一样它不知道自己缺的东西去调用工具。所以 TeaNode 把它知道的
东西直接摆到它们面前，用的是这两个工具在一个会话的生命周期里几个时间点上会运行的钩子。

## 设置

在你写代码用的每一台电脑上：

1. 用 `teanode auth login` 登录，这样钩子用的是你保存的配置档案，而不是工具环境里的一个令牌。
2. 运行 `teanode hook install claude-code`，或者 `teanode hook install codex`，或者两个都运行。
   钩子会加进 `~/.claude/settings.json` 或 `~/.codex/hooks.json`，和那里已有的每一个钩子放在一起。
3. 对 Codex，要在 `~/.codex/config.toml` 的 `[features]` 下写上 `hooks = true` 来打开钩子。
   一个新钩子第一次运行之前，Codex 会请你信任它。

会话看到的东西来自你代理的记忆，所以它好不好，取决于记忆读到过多少关于这个检出的东西。把一个
[知识来源](/doc/memory#它还会去哪里读)指向放着你那些检出的文件夹，并在那台电脑上也加上
Claude Code 或 Codex 的来源，这样你过去的会话也会被读到。

`teanode hook uninstall claude-code`（或者 `codex`）会拿掉 TeaNode 的钩子，文件里其余的都不动。

## 一个会话会看到什么

### 开始时

一个会话开始、恢复或者被压缩时，会看到这个检出的项目页面：概要、页面上最常用到的事实，以及这个
检出归档到的其他项目页面上的同样内容。会话自己能从文件里读到的（远程地址、语言、检出在哪里）
不会放进去。

它还会看到在这个目录、或者这个检出里任何地方开过的上一个会话：哪个工具、它的标题、最后活跃的
时间、你最后三次的请求，以及它最后一个回答的开头。这些不是哪个模型写的，而是从存下来的对话记录
里读出来的原话，所以对话记录一读到，它就在了。你恢复的会话不会看到它自己。

对一个虚构的检出，一个会话的开头是这样的：

    <teanode-memory>
    TeaNode, the person's agent, remembers this about the checkout at
    ~/src/greenfinch-site (page projects/greenfinch-site). Facts are cited
    as page#number; its memory tool reads a page whole.

    projects/greenfinch-site: The marketing site for Greenfinch, built
    with Astro and deployed from main.
    - projects/greenfinch-site#4 The pricing page must render without
      JavaScript, because the partner portal embeds it.
    - projects/greenfinch-site#9 Images go through the CDN's resizer,
      never into the repository.

    The last session in this directory (claude-code, "Pricing table on
    phones", last active 2 hours ago):
    The person's last requests:
    - make the pricing table scroll sideways on a phone
    - keep the first column pinned
    Its last answer: The table now scrolls inside its card and the plan
    names stay in view…
    </teanode-memory>

### 每次提示之前

你输入的每一条提示，都会得到和你代理的一轮一样的想起，只有一点不同：能带进去的只限这个检出的
项目。也就是项目页面、它下面的页面、由有人明确说过的连线连到的项目、东西和文件夹，以及它连到的
话题；绝不包括一个人、一个月份，或者只是提到了它的宽泛话题。所以一个关于构建的问题，不会把你的
邮件、你的钱或者你的同事带进第三方的模型，被排除在外的页面也不会占用预算。

和页面一起来的，是离这条提示很近的经验。一条经验是你代理自己的工作教给它的东西（什么时候适用、
什么管用、该避开什么），而且只有它提到的一条命令成功过才会留下，所以代理只是说说自己的工作，
永远不够。只有意思上和这条提示足够接近的经验才会出现。

没有什么可补充的时候，想起就保持安静：

- 在这个会话最近五次提示里出现过的页面，不会再出现；
- 少于三个词的提示、斜杠命令，以及工具自己发出的文本（比如一个已经完成的后台任务）什么也不会
  想起；
- 从这个项目里什么也没想起的提示，什么也不显示。

安装时加上 `--everywhere`，就改为从整个记忆里想起。

### 每个回答之后

一个回答结束、会话被压缩或者结束时，那台电脑上 Claude Code 或 Codex 的来源会被要求现在就把对话
记录再读一遍，而不是等到下一次排定的时间。它会排到那台电脑上其他等着的来源前面，所以这个会话大约
一分钟内就能搜到，这个目录里的下一个会话也知道这一个停在了哪里。电脑上没有这样的来源时，下一个
会话仍然能看到之前归档过的东西。

## 哪个检出

一个检出的资料记录着它在哪里、在哪台电脑上，钩子会在它运行的那台电脑上，找出包含会话目录的最深
的那个检出。

这台电脑的来源从没读过的检出，会改按它的 git 远程地址来匹配，因为另一台电脑上的同一条路径说明
不了什么。这时会话会被告知，记忆是在哪里、在哪个提交上读的这个项目；如果是在读它的那台电脑上、
但在另一个提交上，还会被告知记忆可能已经过时。不在任何一个记忆知道的检出里的目录，什么也看不到。

## 看看一个会话会看到什么

有三个地方会原样显示一个会话会看到的东西，既不用真开一个会话，也不会把任何东西标成用过：

- `teanode agent memory checkout [directory]` 打印会话开始时看到的内容；加上
  `--prompt "<words>"`，打印那条提示会想起什么，`--everywhere` 把范围放宽。
- 知识页面上的「想起」对话框有一个检出目录栏，做的是同一件事。
- 你代理的 `memory` 工具有一个 `checkout` 动作，所以你可以直接问它。

## 什么也没显示的时候

钩子从不挡工具的路。一个连不上你服务器、或者因为别的原因失败的钩子，什么也不显示，干净地退出，
出了什么问题会写进你缓存目录下的 `hook.log`（Linux 上是 `~/.cache/teanode/hooks`）。如果一个
会话本该看到什么却没看到，检查一下：

- 这个检出已经被读过：在那个目录里运行 `teanode agent memory checkout`，它会说找到了哪个页面；
- 你在那台电脑上用钩子指明的那个配置档案登录了；
- 对 Codex，钩子已经打开，而且这个钩子已经被信任。

## 它要花多少

每条提示花一次嵌入和几次查询；会话开始时再多几次。不会请任何模型写任何东西，也没有任何东西被
标成用过，所以忙着写代码的一天，不会改变你的代理认为什么重要。

## 接下来读什么

- [编程会话](/doc/coding-sessions)是另一个方向：你的代理通过 herdr 看到这些会话，并给它们输入
  提示。
- [记忆](/doc/memory)就是这些会话看到的东西。
- [命令行](/doc/command-line#teanode-hook)列出了 `teanode hook` 的命令。
- [`docs/subsystems/memory.md`](https://github.com/ziyan/teanode/blob/main/docs/subsystems/memory.md#in-the-persons-coding-sessions)
  详细讲了它是怎么工作的。
