TeaNode 是两个程序。`teanode-server` 是邮件服务器，加上只有它所在主机才能做的几件事。`teanode` 是客户端：它通过 API 从任何地方管理一台服务器，是运维者开着的那个。

客户端改动的一切都经过正在运行的服务器，而不是直接写进数据库，所以在 shell 里做的改动和在仪表盘里做的同一个改动表现完全一样——同样的校验，同样的副作用。见 [`docs/decisions/20260818-the-cli-goes-through-the-api.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260818-the-cli-goes-through-the-api.md) 了解原因，以及 [`docs/decisions/20260903-two-binaries.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260903-two-binaries.md) 了解为什么是两个程序。

## teanode-server

| 命令 | 作用 |
| --- | --- |
| `teanode-server run` | 运行服务器 |
| `teanode-server config env` | 写出一份起步用的环境文件 |
| `teanode-server config rules import\|show` | 内置垃圾邮件过滤器的模式规则：导入一套，或者看看存着的是什么 |
| `teanode-server user list\|add\|password\|remove\|reset\|rescue` | 不经过服务器把账号救回来 |
| `teanode-server config init` | 迁移数据库，并存储环境变量描述的配置 |
| `teanode-server config show\|validate` | 查看和检查存储的配置 |
| `teanode-server config import\|export` | 把 `teanode.yaml` 加载进数据库，或写出一份 |
| `teanode-server tls self-signed` | 用于本地开发的证书 |
| `teanode-server password` | 为导出的配置哈希一个密码 |
| `teanode-server evaluate scenario <file>` | 把一个记忆场景在它自己的数据库里走一遍归档和夜间整理，并在每个检查点给它的问题打分；见仓库的 `docs/evaluation/scenarios/` |

这些命令读取服务器读取的环境变量（`TEANODE_DATABASE_URL` 等），所以它们在服务器运行的地方运行：在它的容器里，或者把它的 env 文件加载进 shell。`teanode-server user` 直接编辑存储的配置，是为启动不了或没有人能登录的服务器准备的；日常的账户管理用 `teanode user`，经过服务器。

## teanode

### 登录

在任何地方登录一次：

    teanode auth login --url https://mail.example.com

这会在浏览器里打开仪表盘。如果还没登录就在那里登录，按下"授权"，令牌通过你自己机器上的回环连接回到命令——什么都不经过剪贴板或 shell 历史。令牌以*配置档案*的形式保存在 `~/.config/teanode/profiles.json`，只有你能读，并成为之后每条命令对话的那台服务器。

如果浏览器连不上命令——远程桌面、被锁死的浏览器——页面会改为显示可以粘贴的完整命令。以别的方式签发的令牌可以直接粘贴：

    teanode auth login --url https://mail.example.com --token -

几台服务器就是几份配置档案。`auth list` 列出它们，`auth switch` 切换当前使用的那份，`--profile NAME`（或 `TEANODE_PROFILE`）为单条命令选另一份，`auth logout` 在服务器上吊销该档案的令牌并忘掉它。

    teanode auth login --url https://staging.example.com --name staging
    teanode --profile staging domain list
    teanode auth switch staging
    teanode auth status

一份配置档案可以是*只读*的：在这台机器上，任何改动在发出之前就被拒绝，而读取照常进行。要交给一个只能看不能动的脚本或代理，用的就是这种档案。令牌本身没有变——服务器会接受这个改动，只是这份档案不去请求它。

    teanode auth login --url https://mail.example.com --read-only
    teanode auth set-read-only mail.example.com true
    teanode auth set-read-only mail.example.com false

任何命令上的 `--read-only`，或者环境里的 `TEANODE_READ_ONLY=1`，对一条命令或一个 shell 起同样的作用，不管档案怎么说。没有反方向的开关：被交给这个变量的东西没法给自己解套。被拒绝的改动以退出码 3 结束，并说明要撤销三个开关中的哪一个。`auth logout` 仍然会吊销档案的令牌，因为忘掉一份档案却让它的令牌继续有效是更糟的结果。

重新登录一份已保存的档案——不带 `--url` 的 `auth login`，意思是 `--profile` 指定的那份或者当前那份，或者带上某份的 `--url` 或 `--name`——会替换它的令牌并在服务器上吊销旧的，并且会说出来。除非另行指定，它保留这份档案的只读设置和证书设置。在只读档案上，旧令牌会被留着并报出名字，供手工吊销。

不想要文件的脚本可以设置 `TEANODE_URL` 和 `TEANODE_TOKEN`，它们绕过配置档案。给了 `--url` 而没给令牌时，该服务器已保存的档案会借出它的令牌。

**在服务器本身上**，什么都不用设置。把服务器的环境变量放进 shell——容器里本来就有——客户端会从存储的配置读取服务器密钥，用它铸造一个令牌，并通过回环接口连接：

    docker compose exec teanode teanode user list

    set -a; . /opt/teanode/.env; set +a
    teanode domain list

这就是*控制台*：它不是一个账户，所以属于账户的操作——令牌、会话、通行密钥——在需要的地方要加 `--user`，或者真正登录。`--profile local` 让同时也有配置档案的 shell 访问控制台。

一条命令和哪台服务器对话，按这个顺序决定：`--url`，然后 `--profile`，然后当前档案，然后控制台。显式的优先于保存的，保存的优先于环境里的，所以设置了变量的脚本永远不会被某人最近登录的那台服务器弄糊涂。

### 命令

每种资源一组，各有 `list`、`get`、`create`、`update` 和 `delete`（API 有的话），加上该资源特有的动词。默认输出表格；每条命令都有 `--json`，把同样的内容打印成 JSON，所以一条命令既服务人也服务脚本。

| 组 | 覆盖内容 |
| --- | --- |
| `auth` | 登录，以及保存的配置档案 |
| `domain` | 这台服务器接收邮件的域名、它们的 DNS 记录，以及它们发布的 `logo` |
| `alias` | 一个域名的邮件去哪里；`alias match` 说明一个地址会命中什么 |
| `credential` | 通过这台服务器发信的 SMTP 凭据 |
| `dkim` | 为外发邮件签名的密钥，以及要发布的记录 |
| `user` | 这台服务器上的账户；`teanode-server` 上的 `user rescue` 可以把某个账户设为管理员 |
| `group` | 谁可以做什么，以及在哪些域名上：成员、角色、域名 |
| `role` | 一个群组持有的、有名字的权限集合；`role permissions` 列出可以授予什么 |
| `audit` | 管理性改动的日志，带筛选 |
| `mailbox` | 一个邮箱及其中的一切：`folder`、`rule`、`subscription`、`device`、`autoreply`、`programs` |
| `token` | API 令牌；控制台上的 `token create --user` 签发某人的第一个 |
| `session` | 登录仪表盘的浏览器 |
| `passkey` | 注册到你账户的通行密钥；注册需要仪表盘 |
| `settings` | 可选的集成；`settings set <section> key=value` |
| `server` | 运行中的实例：`status`、`restart`、`addresses`、`identity` |
| `upgrade` | 最新的发布版本，以及安装它：`status [--check]`、`apply` |
| `mail` | 处理过的邮件：带筛选的 `list`、`get`、`content`、`download`、`opens`、`count`、`send` |
| `delivery` | 外发时发生了什么，以及 `delivery pending`，即队列 |
| `report` | 收到的关于你的域名的 DMARC 汇总报告 |
| `contact` | 你的通讯录：你保存的人，你的手机和电脑通过 CardDAV 同步它。`add --name "Ada Lovelace" --email ada@example.com` 保存一个；`edit <id> --name "Ada King"` 只改你给出的部分，卡片的其余部分原样留着，所以改一个名字不会扔掉手机放上去的照片；`--card -` 从标准输入读一整张 vCard。这和 `mailbox contact` 不是一回事，后者是一个邮箱通信过的那些地址 |
| `calendar` | 你的日历，你的手机和电脑通过 CalDAV 同步它 |
| `template` | 一个域名的邮件模板，含 `render` |
| `layout` | 模板渲染时外面套的框架 |
| `api` | 其余一切，直接来自 schema |

一些例子：

    teanode domain create example.com
    teanode alias create example.com --pattern '^hello$' --kind email --email me@example.org
    teanode alias create example.com --pattern '^you$' --kind mailbox --mailbox <邮箱 id>
    teanode alias match example.com hello
    teanode settings set antispam enabled=true host=127.0.0.1 port=783
    teanode server status
    teanode mail list --domain example.com --status rejected --first 20
    teanode mail send example.com --from hello@example.com --to ann@example.org \
        --template welcome --variable name=Ann
    teanode template render example.com welcome --variable name=Ann
    teanode delivery pending

事物按人的叫法命名：域名按它的名字，模板按域名和名字，别名或凭据按它的列表打印的标识符。任何不可撤销的操作都会先问一下；`--force` 跳过询问。

`settings set` 是通用的：键和类型来自服务器自己的 schema，`settings describe <section>` 列出它们。值为 `-` 表示从终端不回显地读取，用于密钥。

### 从脚本或代理调用

同样的命令也服务脚本，只是有三处差别在没人盯着的时候要紧。

只有能回答的人才会被问问题。当标准输入不是终端时，本来要确认的命令会立刻拒绝并提示 `--force`，而不是打印一个没人看得见的提问。`TEANODE_FORCE=1` 替一个已经拿定主意的 shell 回答所有这类问题。

`--json` 对失败和成功一样有效：错误以 `{"error": "...", "exitCode": N}` 的形式写到标准错误，这样调用方可以用同一种方式解析两者。`teanode api` 总是打印 JSON，它的错误也是。

退出码说明出了哪一类问题：

| 码 | 含义 |
| --- | --- |
| `0` | 成功 |
| `1` | 出了别的问题；消息会说明是什么 |
| `2` | 命令用错了：缺少参数、不存在的标志、没有人可问的确认，或者一个不在选项之内的值 |
| `3` | 一个被只读档案、`--read-only` 或 `TEANODE_READ_ONLY` 拒绝的改动；什么都没有发出去 |
| `4` | 服务器上没有这个东西 |
| `5` | 服务器拒绝了令牌；请重新登录 |
| `6` | 完全联系不上服务器 |

Shell 补全由二进制文件自己提供：

    source <(teanode completion bash)
    source <(teanode completion zsh)

### 从 shell 使用邮箱

`teanode mailbox` 就是仪表盘里的邮箱，只是没有仪表盘。大多数人只有一个邮箱，所以只有在有多个时才需要 `--mailbox`，而文件夹是按名字而不是按标识符指定的：

    teanode mailbox folder create GitHub
    teanode mailbox rule add GitHub --when from:contains:@github.com --move GitHub --stop
    teanode mailbox rule apply

一个条件写作 `字段:操作符:值`，可以重复，而且每一条都必须匹配。字段有 `from`、`to`、`subject`、`header`、`score`、`sender-known` 和 `any`；操作符有 `contains`、`equals`、`matches`（正则表达式）、`above` 和 `below`。header 条件要写出头的名字：`--when header:List-Id:contains:golang`。其中两个字段不需要值，单独写就行：`--when sender-known` 和 `--when any`。动作是一些标志：`--move`、`--mark-read`、`--flag`、`--forward`、`--delete`，而 `--stop` 让这一条规则之后不再继续。

一条规则归档的是它写下之后到达的邮件。`rule apply` 把已存的规则跑在某个文件夹里已经有的邮件上，像到达时那样移动、标记、加旗和删除；转发不会重复，因为旧邮件不会再发一次。`rule test` 说明会发生什么，但什么也不改。

这一组里其余的就是邮箱的其余部分。`mailbox list` 列出你能打开的邮箱，`--all` 列出服务器上每一个邮箱及其所有者；`show` 和 `update` 读取和修改一个邮箱的名字和签名。`folder list|create|rename|move|pin|unpin|delete` 是左栏里的那棵树。`rule list|add|remove|enable|disable|test|apply` 是归档。`subscription list|show|mail|unsubscribe` 是它收到的邮件列表，`contact list|add|remove` 是它学到的地址，`device list|add|remove` 是邮件程序用来登录的应用专用密码，`autoreply show|set|off` 是外出自动回复，`programs` 是要填进邮件程序的主机和端口。

### 邮件列表，以及离开它们

订阅不是一个存起来的东西，而是一组存起来的东西：所有指名同一个列表的邮件，按列表为自己
公布的标识符、或者它发信的地址来归拢。所以没有什么可以创建，键就是 `subscription list`
打印出来的东西：

    teanode mailbox subscription list
    teanode mailbox subscription mail <key>
    teanode mailbox subscription unsubscribe <key>

离开是一个向别人提出的请求，三种方式里只有一种在命令行上就结束：一次性请求会被送出，
一封邮件会送到发信人指定的地址，而只给出一个页面的发信人，页面会被打印出来让人去打开。
无论哪一种，已经在邮箱里的邮件都留着；停下来的是还没有寄出的那些。

### 一个域名发布的标志

`teanode domain logo show|publish|remove` 是这台服务器为自己的域名托管的 BIMI 标志：

    teanode domain logo publish example.com mark.svg
    teanode domain check example.com          # 打印要发布的记录
    teanode domain logo remove example.com

文件在存下之前会先对照标志必须满足的受限规格检查——不能有脚本，不能有动画，不能从别处
取任何东西，必须是正方形——而拒绝会指出是哪一条规则拒绝了它，因为接收方拒绝同一个文件
时是不作声的，发信人永远不会知道为什么。一旦有了可以指向的标志，`domain check` 就会打印
要发布的记录，并在下面说明什么会让已发布的记录不起作用，最常见的是 DMARC 策略为 none。

移除会停止提供这个文件。记得把记录也撤下来，否则接收方会一直去取一个什么都不回答的地址。

### 有两样东西不在 schema 里

因为它们是字节而不是 JSON。草稿的文件以 `multipart/form-data` 上传，每个文件一个 `file` 部分，发到 `PUT /api/v1/mailbox/drafts/{itemId}/attachments`（或者对还不存在的草稿用 `POST /api/v1/mailbox/{mailboxId}/drafts/attachments`），带同一个 bearer 令牌。`curl -F file=@report.pdf` 就能做到；回复是存储后的草稿，带每一部分的序号。

域名的标志是另一样：`POST /api/v1/domains/{domainId}/logo` 带一个 `file` 部分，这正是
`domain logo publish` 发送的东西。读取和移除标志都是 schema 里的普通操作；只有发送不是。

### 访问整个 API

上面的组覆盖服务器今天提供的东西。`teanode api` 覆盖每一个操作，包括之后新增的，因为它基于服务器报告的 schema 工作，而不是手写的列表：

    teanode api list                    # 每一个操作
    teanode api list domain             # 与域名有关的那些
    teanode api describe CreateDomain   # 参数、输入形状、返回字段

    teanode api call ListDomains
    teanode api call GetDomain domainId=example.com
    teanode api call CreateDomain domainParameters:='{"domain":"example.com","subdomain":"mail"}'

参数是 `name=value`。数字、布尔、列表或对象用 `name:=<json>`。schema 声明为数字或布尔类型的值会替你转换，所以 `first=10` 到达时是 `10`。

回复带有每一个不需要参数就能请求的字段，深三层。`--depth` 可以改，`--select` 完全替换生成的选择：

    teanode api call ListDomains --select "{ id domain }"

生成的查询表达不了的，就自己写查询：

    teanode api graphql '{ ListDomains { id domain records { records { type name verified } } } }'
    teanode api graphql --file query.graphql --variables '{"domainId":"example.com"}'

`teanode api` 总是打印 JSON。

### 在服务器没有运行时工作

在控制台上，服务器没有运行时读取会退回到存储的配置，因为读取不会丢掉任何人的改动，而存储的配置无论如何都是当前的。这就是第一次运行能工作的原因：`teanode dkim show example.com` 在服务器从未启动过之前就打印出要发布的 DNS 记录。

写入不会退回。服务器停着的时候，命令会失败并说明原因，而不是做出一个下次从仪表盘保存时会被覆盖的改动。例外在服务器自己的程序里：`teanode-server user` 管账户，`teanode-server config import` 管整份配置。

### teanode agent

你自己的代理，而对运维者来说，还有所有人的。每一条命令都走 API，所以在这里做的改动，就是
代理页面本会做的那个改动。

| 命令 | 它做什么 |
| --- | --- |
| `teanode agent ask <message \| ->` | 对你的代理说点什么，并打印它的回答；`--new` 开一个具名对话，`--conversation` 接着某一个，`--attach FILE`（可重复）递给它一个文件——图片给它看，文本文件念给它听，其他的报个名字——`--json` 流式输出每一个事件，`--quiet` 只打印答案。需要你点头的工具会在终端上问，y 或者 n——绝不做成一个开关 |
| `teanode agent chat` | 同样的事，一轮一轮来，直到一个空行 |
| `teanode agent brief on\|off\|now` | 每天早上一封简报，以邮件寄来：这一天有什么、什么在等回复、什么被扣着。`on --at 07:30 --days 1-5` 说什么时候；`now` 立刻寄一封。它会写一个名叫「Daily brief」的普通日程，所以 `agent schedule list` 看得到它，任何人都可以改写它问的是什么 |
| `teanode agent conversation list\|show\|new\|rename\|goal\|main\|archive\|unarchive\|delete` | 主对话和那些命名的对话；`list --query` 按标题或者说过的话里的词找一个，`list --archived` 列出收起来的那些而不是还开着的；`show` 在消息上方打印目标（如果有的话），在下方打印任务清单、做完的打勾，并用 `--first` 和 `--offset` 往回翻长对话；`main` 把一个命名对话变成主对话，或者开一个新的主对话、把旧的留成命名的；`archive <id>` 把一个连同里面的一切收起来，`unarchive <id>` 再拿回来，两个都不会先问，因为两个都不丢东西；`delete` 会先问，并且会带走随它一起来的文件 |
| `teanode agent conversation goal [<conversation-id>] [<goal>]` | 代理在一个对话里一直朝着做的事，跨它自己的多个回合，直到它说做到了、或者你把它清掉：`goal <id> "这周回复房东的每一封邮件；发出去之前先问我"` 设一个，`goal <id> --clear` 撤掉它并停下正在进行的那一轮，单独一个 `goal` 会列出还在进行的目标及其状态——进行中，或者在等你——以及代理对每一个的最后一句话，和代理页面的「目标」页是同一份清单；`goal <id> --met` 说明一个已经做完，如果它正在执行某条想法，那条想法也随之完成。`conversation new --goal` 开一个一上来就带目标的对话 |
| `teanode agent idea list\|propose\|start\|done\|dismiss\|reopen` | 你的代理提出要为你做的事，以及每一条提议后来怎样了：和「想法」页、代理的 `idea` 工具是同一份清单。`list` 列出还开着的，`--status dismissed` 或 `--all` 列出其余的；`start <id>` 开一个以这条想法命名的对话，并打印要在里面说的话，加 `--send` 就直接说出去；`done`、`dismiss` 和 `reopen` 说明一条的结果。`propose` 保存一条你自己写的，并像代理的那样核对：它只能用到你的代理有的工具，在工具要代表你对别人做事时必须说明会先问，并用 `--evidence message:<item-id>:<它是什么>` 说明是什么引出了它 |
| `teanode agent conversation todo list` | 一个对话保存的任务清单：代理自己的，它在分好几步做一件事时写下，并且每一轮都拿给自己看。`todo list <conversation-id>` 把它打印出来；只有代理会改它 |
| `teanode agent run list\|show\|stop` | 代理自己做过什么：每一次模型调用都是一次运行，`list` 用 `--first` 和 `--offset` 翻页；`--kind triage --kind reply` 或者 `--kind triage,reply` 把范围缩到某几类运行，`--query` 缩到它们是关于什么的；有 `agent:act` 的运维者可以用 `--all` 或者 `--agent <id>` 列出所有人的；`stop <run-id>` 就地停下一个，已经做完的那些算数 |
| `teanode agent tools` | 你的代理有哪些工具，按你可以使用的样子，带上风险等级以及它是否会先问 |
| `teanode agent memory index\|get\|search\|note\|page\|merge\|link\|unlink\|move\|forget\|history\|recall\|learned` | 你的代理关于你知道些什么，作为一个个带编号事实的页面：`get people/alice-chen`、`note people/alice-chen "管账" --applies-to triage,reply`、`link people/alice-chen projects/greenfinch --relation works_on`、`move notes/marigold things`；`move --number 3 people/alice-chen projects/greenfinch` 是把其中一条事实挪到另一个页面上，而不是挪整个页面，并且保留它所依据的原话；`forget people/alice-chen --number 2`；不带编号的 `forget people/alice-chen` 会连同它下面的一切一起拿掉，并且先问一句，`--force` 跳过这个询问；`merge work/old-portal projects/greenfinch` 把一个页面折进另一个；还有 `history projects/greenfinch`。`search "<words>"` 按词找页面和事实，每次 `--first` 条（默认 40）；找到更多时会说明还有多少页面和事实（数不完的地方写「至少」），以及打印下一页的 `--offset` |
| `teanode agent memory recall "<question>"` | 一个问题会往一轮对话里带进什么：召回会展开的那些页面，每一个连同上面的事实，按页面自己的编号，用 `memory get` 打印页面的样子打印出来。它就是一轮真实对话做的那个召回，所以它能回答「它当时为什么不知道那件事？」，而不用再问它一遍——而且它不花钱：没有任何东西问过模型，也没有任何东西被标成用过，所以同一张图问两遍答案一样。`--json` 把页面和事实按原样打印出来。`--search "<words>"`（最多两个）和 `--broad` 按一份检索计划来走，就像一轮真实对话按它的深度判断来走；`--explain` 还会说明原因：检索方式和计划、跑过的每一个查询（消息本身、每个计划中的搜索、连线页面的那一跳、宽泛的那一遍），每个搜索找到了多少，以及什么被留在了外面 |
| `teanode agent memory overview <path>` | 一个页面所讲的那样东西是怎么运作的，由最近一夜根据这个页面以及它下面和旁边的页面写成：它是什么、有哪些部分、跟它连着的东西是什么关系、最近在发生什么、有什么突出的地方。`--rewrite` 请下一夜重写；`memory get` 也会把它打印在开头下面，主题的话还会带上它的反思。最后会说明这份概览覆盖了多少，由服务器来数：它的提示词展示了下面多少个页面、一个主题的多少个页面和多少条连线（总共有多少），其中多少没有自己的概览，以及写它所依据的东西之后有没有变过 |
| `teanode agent survey "<question>"` | 根据概览回答一个关于整体的问题：范围内每个页面一次只读的运行，几个同时跑，然后一次把它们合成一份带引用的报告。`--scope themes/<one>` 或者任何一个页面可以缩小范围；不给的话覆盖每一个顶层主题。运行的种类是 survey，要几分钟。它在服务器上开始这次调查，然后每隔几秒问一下完成了没有，所以不会有一个请求开那么久。因为一时的原因失败的读取（服务器在它的代理后面重启、网络断了、超时）会再试，间隔越来越长；三十分钟之后命令就不再等了。不管怎么结束，它都会说出这次调查的 id，供 `teanode agent background show <id>` 使用；`--no-wait` 打印 id 就返回，中途停掉命令也会让它接着跑。`--json` 给出完成的结果，连同报告和那些运行 |
| `teanode agent background list\|show\|stop` | 你的代理没等结果就开始的那些调查和子代理，以及 `agent survey` 开始的调查：`list` 按从新到旧说明哪些在排队、在跑、或者刚结束；`show <id>` 打印一个的报告或回答，并在标准错误上说明它的状态和它做过的运行；`stop <id>` 停下一个还在排队或在跑的，它之后什么也不会唤醒 |
| `teanode agent memory evaluate <file>` | 把一组问题重新跑一遍召回，然后逐题说明它需要的那些事实会不会被带上：一题一行——`direct 03 hit`、`changed 12 miss: carried people/alice-chen saying "berlin"`——然后是分类和总计，只要有一题没中，退出码就不是零。没有任何东西问过模型，图里也没有任何东西被标成用过，所以同一张图问两遍答案一样，而这一组题可以在一夜之前和之后各跑一次，看看这一夜值多少。文件的格式，以及一组可以拿你自己图里的问题替换掉的起始题目，在仓库的 `docs/evaluation/` 里。`--mode planned` 按每个问题所带的计划来走（见 `memory plan`），就像一轮真实对话那样 |
| `teanode agent memory answers <file>` | 回答一组问题里每一个带 `expectedAnswer` 的问题，分别只凭记忆、只凭来源，或者两者一起（`--from memory,sources,both`），再拿预期的答案给每一个回答打分：每个问题和来源一行——`memory changed-01 stale gave the old address`——然后是按来源分的得分、各项裁定、花费，以及一个回答用了多长时间。每个问题和来源调用两次模型，作为 `evaluate` 类的运行；不会往任何对话或者图里写东西。`--json` 打印每一个回答。见仓库的 `docs/evaluation/`。`memory@planned` 和 `both@planned` 会按每个问题的 `plan` 来走 |
| `teanode agent memory plan <file>` | 问深度判断，一轮真实对话会为每个问题走哪份检索计划；用 `--output <file>` 把这组问题连同每个问题的 `plan` 写回去，供 `evaluate --mode planned` 和 `answers --from memory@planned` 使用。每个问题调用一次快速模型，作为 `evaluate` 类的运行。`--stored` 改为给记忆检查里已确认和已更正的问题做计划，而不是给一个文件里的 |
| `teanode agent knowledge list\|add\|set\|pause\|resume\|sync\|remove` | 你的代理读取的那些地方：`add "work" ~/work --computer laptop --under work`；`set work --cron "0 4 * * *" --under projects` 改一个已经存在的来源——它的名字、它的路径、它找到的东西归到哪里、多久读一次、格式、邮箱、它下面每一个代码检出是不是都要读——你没给的都原样不动，所以只是改个钟点，不会让你付出「删掉再加一遍」的代价。`--read-every-checkout` 会读这条路径底下每一个检出的文件——默认情况下，一个几乎没有你的工作在里面的检出只保留它的简介，页面会说明它是什么、在哪儿，而它的源码不被索引，来源那一行会说明这样的检出有多少个、涉及多少文件；`--own-commits-at-least` 说明一个检出要有多少你自己的提交，它的文件才会被读，不管它的历史有多长（不去管它，程序会自己算：两个提交，或者日志的五十分之一，取大的那个，上限二十五——并且永远不会超过整段历史，所以一个你只提交过一次、别人一次都没提交过的仓库就算你的；`1` 是旧规则，有任何一个提交就算）；`--commits-per-pass` 说明对这棵树的一遍扫描要带上多少历史，由里面的那些检出分摊，从新到旧（程序自己的节奏是两千）；`sync` 现在就再读一遍；`pause` 会把已经找到的都留着；`remove` 会忘掉它找到的一切，所以先问一句，`--force` 跳过这个询问。`--format` 说明那里的东西该怎么读：`files`（一棵文件树，认得 git）、`journal`（按日期记的笔记），或者 `records`（一个装 JSON 行的文件夹，任何脚本都能写，旁边放一个 `refresh` 脚本，守护进程会在每次扫描前运行它——可以让你的代理来写） |
| `teanode agent knowledge search "<words>"` | 在已经索引过的东西里找段落——你的代码、你的聊天、你的笔记——不用请你的代理替你去找。它跟你代理的知识工具跑的是同一个搜索，所以你看到的就是它看到的：从日志里抄出来的一个标识符（`ComputeShippingQuote`）会被精确查出来，并打印成定义它的那个文件和行号，然后才是那些段落，每一段都列在它所来自的文档下面，带着可以把那份文档读回来的标识符。`--first` 说要几条，`--source <id-or-name>` 把范围缩到一个来源，`--json` 按原样打印每一行，带着各自的分数。如果这套部署没有配嵌入模型，它会说明——只按词找到的，会漏掉一句一个词都不重合的同义改写。`--offset` 说明跳过排名里的多少条；一次找到的比打印出来的多的搜索，结尾会说明还有多少段落（数不完的地方写「至少」），以及打印下一页的 `--offset`；一页接一页地读，每一段只会出现一次，顺序和第一次一样 |
| `teanode agent knowledge read <document-id>` | 按搜索打印出来的标识符读其中一份文档；从引用里抄出来的 `<id>#<passage>` 也认。`--from` 是从正文的哪里开始，按字符数算，`--first` 是打印多少；一次没读到结尾的读取会说明还剩多少，并打印出接着往下读的那条命令 |
| `teanode agent source-type list\|search\|install\|update\|add-local\|show\|remove` | 这台服务器能读的那些知识来源类型，从签过名的来源类型仓库里装：`search` 说明仓库里有什么，`install rss` 在保存之前先核对签名，`update` 装一个更新的版本，`add-local <source.md>` 加一个你自己的类型，没有签名、标成本地，`show` 说明一种类型会运行什么、要哪些设置。某种类型的来源用 `teanode agent knowledge add <name> --type rss --setting url=https://example.com/feed.xml` 来加 |
| `teanode agent knowledge secret list\|set` | 一个来源的类型所要的密钥，比如某个服务的令牌：是你的，每个来源一套。`secret list <source>` 说明它要什么、每一项有没有填；`secret set <source> <key>` 不带值时会不回显地读入 |
| `teanode agent dream log\|runs\|now\|bootstrap\|reread` | 那些梦：负责读取、归档和自测的运行；`runs <id>` 列出某一趟梦做过的每一次模型调用，每一次都是一个可以用 `agent run show` 打开的运行；`now` 会在下一分钟开始一趟，不管代理的时段是什么；`bootstrap on` 会用更宽的限额一直跑下去，直到没有东西等着被读，用于第一次全量读取；`reread --minutes 60` 把某一夜在那段时间里标成已读的东西放回去 |
| `teanode agent schedule list\|add\|set\|enable\|disable\|remove\|run` | 它在设定的时间自己做的那些事：`add Morning "0 8 * * 1-5" "今天有什么需要我？" --deliver mail`，一行你所在时区的 cron；或者一个单独的时刻 `"@at 2026-09-12 09:00"`，又或者一个从现在起的间隔 `"@in 20m"`——它会被存成它所指的那个时刻，并且只跑一次。`set <id> --cron "0 7 * * 1-5"` 就地改一个——`--name`、`--cron`、`--prompt`（`-` 从标准输入读）和 `--deliver`，你给什么才改什么——而 `disable <id>` 让它不再运行但不拿掉它，`enable <id>` 再让它跑起来 |
| `teanode agent feedback` | 从你的所作所为记录下来的更正，代理会把它们当例子看 |
| `teanode agent channel list\|set\|unlink\|remove` | 你用来和代理说话的聊天应用：你自己的 Telegram 或者 Discord 机器人。`set telegram --token -` 从标准输入读机器人的令牌；`list` 显示某个聊天要发给机器人的 `/link CODE` 里的那个码，以及机器人是否在跑；`unlink` 会画一个新码 |
| `teanode contact list\|show\|add\|edit\|remove` | 你的通讯录：你留着的那些人，你的手机和电脑通过 CardDAV 同步它们。`add --name "Ada Lovelace" --email ada@example.com` 留下一个；`edit <id> --name "Ada King"` 只改你给的那部分，名片上其余的原样不动，所以改个名字不会把手机放上去的那张照片扔掉；`--card -` 从标准输入读一整张 vCard |
| `teanode agent skill list\|search\|install\|update\|remove\|enable\|disable\|scope\|secret` | 从技能注册表安装的工具，给这台服务器上的所有人：`search` 说有些什么，`install weather` 在保留任何东西之前先检查签名和哈希，`update` 不带名字就把有更新的都装上。`scope <name> operator\|person\|skill` 决定这里由谁来填这个技能的秘密——整台服务器一套值、每个人自己的，或者技能自己声明的那样。安装和划定范围需要 `server:manage`。会运行命令的技能，命令跑在你接上的电脑上，会先问，而且无人看着的运行永远用不到它。`secret list\|set\|clear` 是给技能向 *你* 而不是向服务器索要的那些值用的：`secret set news NEWSAPI_KEY` 从终端读取而不回显，没有终端时从标准输入读 |
| `teanode agent mcp list\|connect\|disconnect\|serve` | 运维者声明的那些连接的服务器，以及你到它们的连接；`connect tracker --credential -` 从标准输入读你的凭据，需要授权的服务器会打印要打开的地址；`--loopback` 则把授权带回这个终端，给只应答环回地址的服务用; `serve` 在这个终端上应答这套协议，所以这台机器上的一个程序可以用你代理的那些工具，而且哪里都不用粘令牌——`claude mcp add teanode -- teanode agent mcp serve` |
| `teanode app list\|rename\|disconnect` | 通过在浏览器里批准而获准以你的身份使用代理工具的那些程序：`rename <client-id> <name>` 让名字在续期时保留，`disconnect <client-id>` 吊销它持有的每一个令牌，于是它得重新获得批准 |
| `teanode agent settings show\|set` | 你的代理：`set enabled=true name=Bertie instructions=-` 从标准输入读那个长值；键由 `set --help` 列出。`set alerts=false` 让它不再主动告诉你邮件里的事；`alert-quiet-start=22:00 alert-quiet-end=07:00` 是只说等不得的事的那段夜里，`alert-daily-most=5` 是一天最多几条 |
| `teanode agent alert list\|mute\|mutes\|unmute` | 你的代理主动告诉过你什么，以及你请它别再说的：和代理页面上的「主动通知」卡片是同一份清单。`list` 列出每一条提醒以及它关于的那些邮件；`mute <alert-id>` 停掉关于它所涵盖内容的提醒（那一阵，或者一封邮件的发件人），`--scope subjectKey`、`sender`、`domain` 或 `kind` 按它的主题、发件人、他们的域名或它的种类（一阵，或者像 `notification` 这样的类别）；`mute --target offers@shop.example.com` 由你自己点名一个，范围从它本身读出，除非 `--scope` 另说；`mutes` 列出这些，`unmute <mute-id>` 收回一个 |
| `teanode agent settings categories add\|remove` | 固定的那些之外，你自己的类别 |
| `teanode agent settings forget` | 删掉这个代理和它学到的一切；会先问 |
| `teanode agent source list\|grant\|revoke\|set\|allow\|deny` | 代理可以够到什么，以及它在每一个里做什么：对邮箱用 `set --mailbox work triage=true auto-reply=true auto-reply.scope=known`；对另外两种来源用 `allow calendar` 和 `deny addressbook`，它们只有一个开关而没有策略。你没有授予的来源，任何东西都不会被送到模型那里。在一个邮箱上用 `alerts=false`，就不会主动听到关于到达那里的东西的任何事 |
| `teanode agent usage [--since] [--by day\|kind\|mailbox\|model]` | 你的 token |
| `teanode agent draft <item-id> [--say "…"]` | 让代理给一封邮件写一封回信，打印出来给你用；什么都不保存也不寄出 |
| `teanode agent replies [--status held\|sent\|cancelled\|refused\|failed] [--mailbox]` | 代理替你写的那些回信，以及每一封后来怎么样了，还有它放过某封邮件时的原因 |
| `teanode agent replies cancel <reply-id>` | 取消一封扣住的回信；草稿会消失，什么也不会寄出 |
| `teanode agent admin usage\|list\|limit\|disable\|enable\|dead-letters\|retry` | 所有人的代理，需要 `agent:audit`：按天、种类、邮箱、模型或者代理算的 token；每个人的来源和今天的花费；给某一个人的限额，用 token 或者带 `--cost` 用钱；关掉的开关；worker 放弃了的那些任务 |


每一条命令都会把 shell 的时区和语言随请求一起送出，就像仪表盘送浏览器的那样，所以活在
终端里的人和活在浏览器里的人一样被安放好。

### teanode finance

你接入的那些机构、它们的账户和交易、净资产、支出类别、预算和储蓄目标：和仪表盘上的「财务」
页面（以及代理页面「财务」标签里的设置）、代理的 `finance` 工具是同一组操作，名字也照着它们
起（工具的 `spending_summary` 就是 `teanode finance spending-summary`）。金额带着币种打印，
`--json` 保留完整精度。[`docs/subsystems/finance.md`](https://github.com/ziyan/teanode/blob/main/docs/subsystems/finance.md)
讲了它是怎么工作的。

| 命令 | 它做什么 |
| --- | --- |
| `teanode finance providers` | 这台服务器提供哪些服务商，以及各自怎么接入 |
| `teanode finance link-plaid` | 打印打开 Plaid 窗口的那个页面的地址，给浏览器用，然后一直等到新的财务来源出现；`--no-wait` 立刻返回 |
| `teanode finance link-simplefin [<setup-token> \| -]` | 向 SimpleFIN Bridge 兑换一个设置令牌；`-` 或者不带参数时不回显地读取它。一个令牌只能兑换一次 |
| `teanode finance import-credential --provider plaid\|simplefin [--institution-name NAME] [- \| <file>]` | 把在别处建好的连接作为财务来源带进来，而不是再接入一次：一个用这台服务器的 Plaid 密钥建立的连接的 Plaid 访问令牌（这样省下一个 Plaid 名额），或者一个已经兑换过的 SimpleFIN 访问地址。凭据从文件、标准输入或者不回显的提示里读，从不从命令行读；建任何东西之前先问一遍服务商，第一次同步在一分钟内开始 |
| `teanode finance repair <source-id>` | 再打开一次 Plaid 页面，在机构要求时重新登录同一个财务来源；一直等到它再次同步 |
| `teanode finance sources\|sync\|disable-source\|enable-source\|delete-source` | 你的财务来源，立刻同步一个、关掉或打开，或者连同它带进来的一切一起删除（先问）；每一条都拒绝不是财务来源的来源 |
| `teanode finance accounts\|transactions\|spending-summary` | 财务账户和它们的余额；交易，可用 `--from`、`--to`、`--since 30d`、`--month 2026-09`、`--text`、`--finance-account`、`--is-uncategorized`，以及取下一页的 `--after`；按 `--group-by spendingCategory\|merchant\|month\|financeAccount\|providerCategory` 分组的支出和收入 |
| `teanode finance trades` | 投资账户里的买入、卖出和转入转出的证券，最新的在前，带着证券、数量、单价、金额和手续费；`--from`、`--to`、`--since`、`--month`、`--finance-account`、`--finance-security`，以及取下一页的 `--after`。交易买卖从不算支出；股息、利息和手续费是交易记录 |
| `teanode finance exchange-rate\|convert-currency\|reporting-currency\|set-reporting-currency` | 某一天两种货币之间的欧洲央行汇率（遇到周末取之前最近的一天，并说明是哪天），换算一笔金额，以及你的合计用哪种货币显示；`set-reporting-currency --clear` 回到默认 |
| `teanode finance net-worth\|assets\|asset-history\|create-asset\|update-asset\|close-asset\|delete-asset\|record-valuation\|delete-valuation` | 每天的净资产；你拥有和欠下的一切及其最新价值，持仓还有它的证券、数量、单价和成本（`asset-history` 里按天也有）；`create-asset "Car" --kind vehicle --currency USD --value 18000` 加一项并给出第一个价值；`record-valuation <asset-id> 16500 --on 2026-09-30` 记下它值多少；`--is-estimate-allowed` 让代理从网上估它的价，这只有你能允许 |
| `teanode finance spending-categories\|create-spending-category\|update-spending-category\|delete-spending-category` | 你自己的一份钱花在哪里的清单 |
| `teanode finance spending-rules\|create-spending-rule\|update-spending-rule\|delete-spending-rule` | 把商户或描述里含有某些词的交易归类的规则；新规则也作用于以前的交易，除了你自己选过的 |
| `teanode finance categorize-transaction\|mark-transfer` | 改一笔交易的支出类别（`--create-spending-rule` 让这个商户从此都这样归类），或者把在你自己账户之间挪动的钱标成转账 |
| `teanode finance budgets\|set-budget\|budget-status\|spending-by-day\|cash-flow` | 每个支出类别的月度预算，以及收入类别上你每月预期的收入（`budgets` 会说明每一项是哪种）；`budget-status` 是本月对照每项预算，带着这个月的走向和节奏（低于、正常、有风险、超出），再是每个收入类别对照到今天为止的预期（落后、正常、领先）；逐日的支出对照上个月；按月的收入和支出 |
| `teanode finance saving-summary` | 本月用汇总货币算的储蓄：收入预算减去支出预算，对照到目前为止的收入减支出和这个月的走向，带着差额和节奏（落后、正常、领先）；`--month` 看别的月份，`--currency` 换算成另一种货币 |
| `teanode finance savings-targets\|create-savings-target\|update-savings-target\|close-savings-target` | 在某一天之前要存下的金额，以及从现在起每月需要多少，用 `--measure cash_flow`（没花掉的钱，默认）、`net_worth`（自 `--started-on` 以来增加的净资产，除非 `--starting-amount` 另说，起点会替你记下）或 `asset_value`（`--finance-account` 和 `--asset` 值多少；整个财务账户算上它的现金和每一项持仓，以后买的也算）来衡量 |

### teanode computer

你自己的电脑，接到你的代理上。这个程序跑着的时候，代理就多了两个工具——`shell`，在这里
运行一条命令；`filesystem`，读、改、写、复制、列出、搜索和 grep 你的文件——以你的身份，在
这台机器的任何地方，就像你自己的一个终端那样。只有你在场的对话可以使用它们：定时的运行、
分类的运行，任何没有人看着的东西，永远看不见你的电脑。会改变这台机器或者伸到它外面去的
命令（删除、移动、安装、sudo、push、ssh，以及更重的那些形状）会先问你，在抽屉里的卡片上
或者在终端上；一个被移动或者删除的文件，以及往这台机器自己会运行的东西里写入（shell 的
启动文件、密钥、开机自启），也一样。没有什么是替你拒绝的——你的点头是最后一句话。那张卡片
是服务器的：程序运行服务器送来的东西，所以它信任服务器，就像一个终端信任坐在它前面的人。
程序以你的身份登录，用的是活动配置档案的令牌，绝不是服务器的身份。可以同时接上好几台电脑，
按名字分辨。命令在 `/bin/sh -c`（Windows 上是 `cmd /C`）下运行，不是你的登录 shell，所以
你的别名不在作用域里。程序同时应答四个请求，第五个会被拒绝而不是排队。

| 命令 | 它做什么 |
| --- | --- |
| `teanode computer start [--name NAME]` | 在后台运行这个程序；`--name` 是这台电脑叫什么（默认是主机名）。它的日志在 `~/.config/teanode/computer.log` |
| `teanode computer status` | 这个程序是否在这里跑着，以及服务器看得见你的哪几台电脑 |
| `teanode computer stop` | 结束这个程序 |
| `teanode computer daemon [--name NAME]` | 同一个程序，但在前台，连接断了会重连，直到被中断——给终端用，或者给一个服务管理器用 |
| `teanode computer background list [--conversation ID]` | 代理的 shell 在你各台电脑上留在后台跑的那些命令，以及最近结束的那些，从新到旧：每个一行，带着它的 id、电脑、它的状态（`running`、`exit N`、`stopped`，或者跑满一个后台命令所能跑的时长后的 `stopped after 24 hours`）、按你本地时间的开始时刻，以及那条命令。`--conversation` 只看某一个对话开的那些 |
| `teanode computer background read <computer> <id> [--tail BYTES]` | 其中一个最后写下的东西：先是它在标准输出上的输出，再是它在标准错误上的错误，有一行说明哪一个被截断过，最后一行说明它的状态。`--tail` 是每个流的末尾要打印多少，默认 64 KiB，最多 256 KiB |
| `teanode computer background stop <computer> <id>` | 结束其中一个。开它的那个代理会听说它结束了，就跟听说任何一个它没要求的结束一样 |

运维者可以用 `agent.features.computer` 为整台服务器关掉电脑这件事。

### teanode calendar

| 命令 | 它做什么 |
| --- | --- |
| `teanode calendar list\|show\|add\|edit\|remove` | 你的日历，你的手机和电脑通过 CalDAV 同步它。`list --from 2026-09-14 --until 2026-09-21` 为每一次发生的事印一行，重复的事件按每一次出现各印一行；`add --title Standup --starts 2026-09-14T09:30 --repeat FREQ=WEEKLY;BYDAY=MO` 往里放一件事；`--invite ada@example.com` 用邮件把邀请寄出去，而移动或者删除这个事件会告诉所有被邀请的人；`--all-day` 属于那一天而不是某个时刻，它的 `--ends` 是它所在的最后一天，所以两端同一个日期就是一天；`--file -` 从标准输入读一整个 iCalendar 文件。时间按日历自己的时区读写，除非它们自带偏移 |
| `teanode calendar free` | 你什么时候有空：工作日里没有安排的那些时段，一天一天地列。`--earliest 08:00 --latest 18:00` 移动一天的两端；整天的条目不会让一天变忙，取消了的也不会。用的是回答手机 free-busy 请求的同两个函数，所以这里印出来的和同事的客户端被告知的不可能不一致 |
| `teanode calendar calendars\|set` | 日历本身：它们叫什么、客户端把它们画成什么颜色、新事件写在哪个时区，以及一周从哪一天画起——`set --timezone Europe/Berlin`、`set --week-start monday`。除非某个日历另有说法，周从星期日开始；而五天视图无论如何都是周一到周五，因为一个工作周就是那样 |
| `teanode reminder list\|add\|edit\|done\|reopen\|remove` | 你的提醒事项清单，就是日历旁边那份，手机上的「提醒事项」通过 CalDAV 同步它。`add "买邮票" --due 2026-09-29` 在那一天到期，`--due 2026-09-29T15:00` 按日历的时区在那个时刻到期；`list --done` 列出已经勾掉的，`list --all` 两种都列；`done` 勾掉一条，`reopen` 把它放回去 |
| `teanode note list\|show\|add\|edit\|remove` | 你的备忘录：手机的「备忘录」存在你邮件账户里、通过 IMAP 同步的那些。`add "行李清单"` 写一条，第一行就是它的标题，`--file -` 从标准输入读正文，`edit <id>` 替换一条的正文；手机下次同步时会看到改动。有不止一个邮箱时，用 `--mailbox` 选一个 |
| `teanode calendar request <request-id>` | 查一次日历保存有没有完成，即使它的事件或者日历已经被删掉。`add`、`edit` 和 `remove` 在改动一个事件之前会打印一个请求 ID；得到一个不确定的回应之后，在这里查它，或者用 `--request-id` 带着同样的操作和字段重试。重试一次删除，会在加载那个已删除的事件之前先核对它是否完成。查不到回执，可能意味着原来的请求还在进行。字段变了就需要一个新的 ID |
| `teanode calendar stop <request-id>` | 在丢掉一个不确定请求的字段之前先把它了结。还没提交的请求会被持久地停下；已经完成的改动会被报告出来，而不会被撤销。停止的回应失败了，那仍然是不确定的，所以用同一个请求 ID 重试 |
