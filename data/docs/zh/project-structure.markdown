每个包是做什么的，以及依赖指向哪个方向。关于一封邮件如何在系统中流动，见 [`AGENTS.md`](https://github.com/ziyan/teanode/blob/main/AGENTS.md)。

## 布局

    cmd/teanode-server/     服务器的入口
    cmd/teanode/            客户端的入口
    internal/               全部实际代码，包括两个程序的子命令
    web/                    仪表盘源码，构建到 internal/frontend/static
    deploy/                 docker compose 文件和镜像的 Dockerfile
    docs/                   见 docs/decisions/20260818-documentation-layout.md
    vendor/                 已提交的第三方依赖

## 包

**`internal/config`**——配置本身。带类型的结构体、一个能一次报告所有问题并附带每个问题路径的校验器，以及 `Store` 接口，它交出不可变的快照，并把改动作为整体应用。运维者能设置的一切都在这里。它只依赖工具包，所以任何包都可以引入它——这也是把配置持久化到 PostgreSQL 的存储不放在这里的原因。

**`internal/configdb`**——由 PostgreSQL 支撑的 `config.Store`。把配置映射到表再映射回来，用一个版本行解决并发写入，并轮询它，让一个实例注意到另一个实例做的改动。它自成一包，因为它同时引入 `config` 和 `db`，而 `db` 引入 `config`。

**`internal/bootstrap`**——环境变量说明的内容：如何访问数据库、这个进程是哪个实例，以及——第一次对着空数据库运行时——要创建什么样的服务器。刻意做得很小。这里的一切都是每进程一份、需要重启才能改变的；而数据库里的一切是共享的，不需要重启。

**`internal/mx`**——邮件路径，也是唯一决定一封邮件命运的包。

    exchange.go             接线，以及选择路径的 HandleEnvelope
    exchange_incoming.go    入站：验证、存储、匹配别名
    exchange_outgoing.go    来自已认证凭据的提交
    exchange_delivery.go    一次投递尝试、重试、失败时的退信
    exchange_bounce.go      返回的投递状态通知
    exchange_dmarc.go       返回的 DMARC 汇总报告
    exchange_usage.go       内存中的计数器，定期写入数据库
    exchange_utils.go       邮件头格式化、并行验证器

**`internal/db`**——通过 GORM 访问 PostgreSQL。只保存会无限增长的数据：邮件、投递记录、DMARC 报告、用量计数器、模板和版式。每个实体一个文件，各自定义与 `internal/models` 中共享结构体分离的 GORM 模型，这样存储形态可以改变而不改变 API。

**`internal/api`**——每个 API 版本共享的东西：错误值、请求上下文和路径。刻意几乎不依赖任何东西，这样各版本的包和 `internal/web` 都可以引入它。

**`internal/api/v1api`**——第 1 版，挂载在 `/api/v1`。由三部分组成：

    apigraph/   GraphQL 端点，也就是整个管理 API。
                由 internal/util/graphapi 通过反射从 Go 类型生成。
                查询读取数据库；修改配置的 mutation 经过 config.Store，
                最终落在配置表里，每个实例都能看到。
    apisend/    POST /api/v1/send/{domain}/{template}，用 SMTP 凭据认证，
                供不想说 SMTP 的应用程序使用。除了 "variables" 还接受 "locale"，
                渲染模板拥有的最接近的翻译。
    apimail/    存储邮件的原始 .eml 及其附件，它们是文件而不是 JSON，
                所以不走 GraphQL。

**`internal/client`**——那套 API 的另一端，供命令行客户端使用：每种资源一个文件，写明查询；以及 `introspect.go`，它从服务器读取 schema，为任何操作构造查询——这就是 `teanode api` 不用为每个操作手写命令就能覆盖全部操作的方式。

**`internal/cmd`**——客户端的子命令，每组一个文件，以及两个程序共用的辅助代码：连接服务器（`client.go`）、保存的配置档案（`profile.go`）、浏览器登录（`loopback.go`）、表格和提示。`internal/cmd/server` 是服务器自己的子命令：`run`，以及少数直接写数据库的操作。见 [`docs/reference/command-line.md`](/doc/command-line)，以及 [`docs/decisions/20260903-two-binaries.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260903-two-binaries.md) 了解为什么是两个程序。

**`internal/web`**——HTTP 服务器、路由和中间件。对邮件一无所知。

**`internal/dns`**——定期检查每个已配置域名的 DNS 记录是否已发布，并报告缺失的部分。仅供参考；见 [`docs/decisions/20260818-dns-verification-is-advisory.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260818-dns-verification-is-advisory.md)。

**`internal/mailer`**——渲染模板，并以服务器自己的名义发送邮件：在仪表盘里撰写的邮件、为发送端点渲染的模板。`Render` 按 locale 选择翻译并填充模板；`Send` 由文本、HTML 和附件组装出一封邮件，交给 `mx` 作为该域名的外发邮件。

**`internal/models`**——在 `db`、`api` 和 `mx` 之间共享的普通结构体。除了枚举辅助方法之外没有行为。

**`internal/util`**——协议实现，每个都可以独立测试，不含项目特定的假设：

    smtpd       SMTP 服务器：会话、STARTTLS、AUTH、限制
    smtpc       用于投递的 SMTP 客户端
    mailparse   拆分、邮件头解码、地址签名
    dkim        DomainKeys Identified Mail 签名与验证
    spf         Sender Policy Framework 评估
    dmarc       DMARC 策略查询与汇总报告解析
    arc         Authenticated Received Chain，可以经受转发
    authres     Authentication-Results 头的格式化与解析
    dsn         投递状态通知解析
    autoacme    ACME 客户端，支持 http-01、tls-alpn-01 和 dns-01
    resolver    带缓存的 DNS 解析器
    clamav      可选的病毒扫描
    spamc       可选的 SpamAssassin 评分
    geoip       可选的发件方地理定位
    dropper     连接丢弃列表
    graphapi    从 Go 类型生成 GraphQL schema
    atomicfile  先写临时文件再重命名，用于每一个敏感文件
    security    标识符、凭据编码、签名
    periodic    按间隔运行一个函数的循环

## 依赖方向

`internal/cmd/server` 依赖一切。`configdb` 依赖 `config` 和 `db`；除了 `internal/cmd`，没有别的包依赖 `configdb`，这就是让"配置存在哪里"这个选择远离所有读取配置的代码的方式。`api`、`mx`、`dns` 和 `mailer` 依赖 `config`、`db`、`models` 和 `util`。`util` 下的包只依赖彼此和标准库。`util` 中的任何包都不得引入 `config`、`db` 或 `models`：它们的设计目标是能被提取成独立的库，其中好几个正是这个项目值得发布的原因。
