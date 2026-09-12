TeaNode 是两个程序。`teanode-server` 是邮件服务器，加上只有它所在主机才能做的几件事。`teanode` 是客户端：它通过 API 从任何地方管理一台服务器，是运维者开着的那个。

客户端改动的一切都经过正在运行的服务器，而不是直接写进数据库，所以在 shell 里做的改动和在仪表盘里做的同一个改动表现完全一样——同样的校验，同样的副作用。见 [`docs/decisions/20260818-the-cli-goes-through-the-api.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260818-the-cli-goes-through-the-api.md) 了解原因，以及 [`docs/decisions/20260903-two-binaries.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260903-two-binaries.md) 了解为什么是两个程序。

## teanode-server

| 命令 | 作用 |
| --- | --- |
| `teanode-server run` | 运行服务器 |
| `teanode-server config env` | 写出一份起步用的环境文件 |
| `teanode-server config init` | 迁移数据库，并存储环境变量描述的配置 |
| `teanode-server config show\|validate` | 查看和检查存储的配置 |
| `teanode-server config import\|export` | 把 `teanode.yaml` 加载进数据库，或写出一份 |
| `teanode-server tls self-signed` | 用于本地开发的证书 |
| `teanode-server user list\|add\|password\|remove\|reset` | 不经过服务器恢复账户 |
| `teanode-server password` | 为导出的配置哈希一个密码 |

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
| `mailbox` | 一个邮箱及其中的一切：`folder`、`rule`、`contact`、`subscription`、`device`、`autoreply`、`programs` |
| `token` | API 令牌；控制台上的 `token create --user` 签发某人的第一个 |
| `session` | 登录仪表盘的浏览器 |
| `passkey` | 注册到你账户的通行密钥；注册需要仪表盘 |
| `settings` | 可选的集成；`settings set <section> key=value` |
| `server` | 运行中的实例：`status`、`restart`、`addresses`、`identity` |
| `upgrade` | 最新的发布版本，以及安装它：`status [--check]`、`apply` |
| `mail` | 处理过的邮件：带筛选的 `list`、`get`、`content`、`download`、`opens`、`count`、`send` |
| `delivery` | 外发时发生了什么，以及 `delivery pending`，即队列 |
| `report` | 收到的关于你的域名的 DMARC 汇总报告 |
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
| `teanode agent conversation list\|show\|new\|rename\|main\|delete` | 主对话和那些具名的；`list --query` 按标题里或者说过的话里的词找一个；`main` 把一个具名对话变成主对话，或者开一个新的主对话并把旧的留成具名的；`delete` 会先问，并且带走随它而来的文件 |
| `teanode agent run list\|show` | 代理自己做过什么：它分类、摘要和回信的记录 |
| `teanode agent tools` | 你的代理有哪些工具，按你可以使用的样子，带上风险等级以及它是否会先问 |
| `teanode agent memory list\|add\|remove` | 你的代理记着关于你的什么；`add "会计" "Maria 管账" --applies-to triage,reply` 把一条记忆指给会读它的那些运行 |
| `teanode agent schedule list\|add\|remove\|run` | 它在设定的时间自己做的事：`add Morning "0 8 * * 1-5" "今天有什么需要我？" --deliver mail`，一行你所在时区的 cron；或者一个单独的时刻，`"@at 2026-09-12 09:00"`，或者从现在起的一段距离，`"@in 20m"`，那会被存成它所指的那个时刻并只运行一次 |
| `teanode agent feedback` | 从你的所作所为记录下来的更正，代理会把它们当例子看 |
| `teanode agent channel list\|set\|unlink\|remove` | 你用来和代理说话的聊天应用：你自己的 Telegram 或者 Discord 机器人。`set telegram --token -` 从标准输入读机器人的令牌；`list` 显示某个聊天要发给机器人的 `/link CODE` 里的那个码，以及机器人是否在跑；`unlink` 会画一个新码 |
| `teanode agent skill list\|search\|install\|update\|remove\|enable\|disable\|scope\|secret` | 从技能注册表安装的工具，给这台服务器上的所有人：`search` 说有些什么，`install weather` 在保留任何东西之前先检查签名和哈希，`update` 不带名字就把有更新的都装上。`scope <name> operator\|person\|skill` 决定这里由谁来填这个技能的秘密——整台服务器一套值、每个人自己的，或者技能自己声明的那样。安装和划定范围需要 `server:manage`。会运行命令的技能，命令跑在你接上的电脑上，会先问，而且无人看着的运行永远用不到它。`secret list\|set\|clear` 是给技能向 *你* 而不是向服务器索要的那些值用的：`secret set news NEWSAPI_KEY` 从终端读取而不回显，没有终端时从标准输入读 |
| `teanode agent mcp list\|connect\|disconnect` | 运维者声明的那些连接的服务器，以及你到它们的连接；`connect tracker --credential -` 从标准输入读你的凭据，需要授权的服务器会打印要打开的地址；`--loopback` 则把授权带回这个终端，给只应答环回地址的服务用 |
| `teanode agent settings show\|set` | 你的代理：`set enabled=true name=Bertie instructions=-` 从标准输入读那个长值；键由 `set --help` 列出 |
| `teanode agent settings categories add\|remove` | 固定的那些之外，你自己的类别 |
| `teanode agent settings forget` | 删掉这个代理和它学到的一切；会先问 |
| `teanode agent source list\|grant\|revoke\|set` | 代理可以够到的邮箱，以及它在每一个里做什么：`set --mailbox work triage=true auto-reply=true auto-reply.scope=known` |
| `teanode agent usage [--since] [--by day\|kind\|mailbox\|model]` | 你的 token |
| `teanode agent draft <item-id> [--say "…"]` | 让代理给一封邮件写一封回信，打印出来给你用；什么都不保存也不寄出 |
| `teanode agent replies [--status held\|sent\|cancelled\|refused\|failed] [--mailbox]` | 代理替你写的那些回信，以及每一封后来怎么样了，还有它放过某封邮件时的原因 |
| `teanode agent replies cancel <reply-id>` | 取消一封扣住的回信；草稿会消失，什么也不会寄出 |
| `teanode agent admin usage\|list\|limit\|disable\|enable\|dead-letters\|retry` | 所有人的代理，需要 `agent:audit`：按天、种类、邮箱、模型或者代理算的 token；每个人的来源和今天的花费；给某一个人的限额，用 token 或者带 `--cost` 用钱；关掉的开关；worker 放弃了的那些任务 |

每一条命令都会把 shell 的时区和语言随请求一起送出，就像仪表盘送浏览器的那样，所以活在
终端里的人和活在浏览器里的人一样被安放好。

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

运维者可以用 `agent.features.computer` 为整台服务器关掉电脑这件事。
