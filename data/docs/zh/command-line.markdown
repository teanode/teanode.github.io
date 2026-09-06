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
| `domain` | 这台服务器接收邮件的域名，以及它们的 DNS 记录 |
| `alias` | 一个域名的邮件去哪里；`alias match` 说明一个地址会命中什么 |
| `credential` | 通过这台服务器发信的 SMTP 凭据 |
| `dkim` | 为外发邮件签名的密钥，以及要发布的记录 |
| `user` | 管理这台服务器的账户 |
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
