TeaNode 是一个邮件服务器。邮件不宽容：一个错误不会抛出异常，它会悄悄丢掉某人的邮件，或者把一个域名的信誉烧掉。下面的大部分内容都由此而来。

先看 [`docs/reference/local-development.md`](/doc/local-development)，得到一个构建和一个数据库。

## 提交改动之前

    make format        # gofmt
    make lint          # golangci-lint，然后是命名检查（如果你装了）
    make test          # 自动启动一个 PostgreSQL 容器
    make build

CI 运行 `make lint-ci`，也就是只有 golangci-lint。一个本地检查强制执行本项目的命名约定，它只在本地运行，所以没有安装它的贡献者不会被卡住；如果你有，还是运行一下。

## 命名

这些没有商量余地，`make lint` 会检查其中大部分。

- **缩写词跟随首字母。** 标识符以大写开头时，缩写词全部大写：`ReferenceURI`、`SessionID`、`GetFTPID`、`DKIMResult`。以小写开头时，缩写词只有第一个字母大写：`referenceUri`、`sessionId`、`getFtpId`。新的缩写词要在 lint 配置里登记，并注释说明它代表什么。
- **不要缩写。** 用 `command`，不用 `cmd`。用 `response`，不用 `resp`。用 `request`，不用 `req`。Go 包名是例外，应当简短。
- **不用单字母变量。** `err` 是唯一被认可的短名字，Go 的错误值只要可能都应叫 `err`。
- **结构体接收者叫 `self`。** 整个代码库保持一致。`.golangci.yml` 关掉了会反对这一点的 linter。
- **同一个东西在所有地方叫同一个名字。** 数据库里叫 `delivery` 的东西，在 API 里就不能叫 `send`。

## 注释

解释**为什么**，而不是做了什么。做了什么写在下面的代码里。

一条注释值得存在，是因为它记录了读者无法从代码中恢复的东西：一条协议要求、一次在生产环境观察到的故障、在几个合理选项中的一次有意选择。`counter++` 上面写 `// increment the counter` 是噪音。`// Reject before the DATA command so a spammer pays for the connection` 值得写下。

导出的标识符要有以其名字开头的文档注释。

## 不变量

破坏其中任何一条，下游就会以难以追溯的方式出错。

- **每个迁移都附带对应的 `.reverse.sql`。** `internal/db/database_migrate.go` 中的迁移执行器用应用迁移时记录的反向 SQL 来回退未知的迁移，缺失时会 panic。见 [`docs/coding/database-migrations.md`](https://github.com/ziyan/teanode/blob/main/docs/coding/database-migrations.md)。
- **配置标识符是稳定的。** 配置中域名、别名或凭据的 `id` 生成一次后永不改变，因为存储的邮件和投递记录引用它。编辑一个模式绝不能重新生成 id。
- **存储的配置是唯一的事实来源。** 它作为一份文档存放在数据库里，`internal/config` 定义它的形状。不要添加你自己的设置表，也不要在使用处读取环境变量：环境变量只说明数据库在哪里并为第一次运行提供种子，运维者能设置的其他一切都属于 `internal/config`。
- **默认代码路径中不依赖云服务。** S3、Route53 和 GeoIP 是可选的，默认关闭。被 `if settings.Enabled` 保护的代码在关闭时不得构造客户端、打开文件或拨号连接任何东西。
- **ACME `http-01` 处理器排在最前。** 证书机构通过明文 HTTP、不带任何凭据获取 `/.well-known/acme-challenge/`。它不能遇到身份认证、到 HTTPS 的重定向或兜底路由。
- **服务器密钥只生成一次。** 它为退信返回路径和每一份 SMTP 凭据的密码签名。轮换它会让所有这些失效。
- **绝不提交密钥或真实地址。** `make check-secrets` 扫描被跟踪的文件。测试夹具使用 `example.com` 和 `example.net`。

## 测试

写那个本可以抓住这个 bug 的测试。只证明代码能跑的测试不值得维护。

需要 PostgreSQL 的测试从 `internal/db/dbtest` 获取它，未设置 `TEANODE_TEST_DATABASE_HOST` 时跳过，所以没有 Docker 时 `go test` 仍然可用。

**单元测试不得访问网络。** 这是付出代价学到的：早期版本的 `autoacme.Open` 在构造时就启动续期循环，所以在测试里仅仅构造一个 manager 就联系了 Let's Encrypt 的生产环境。正因为此，构造和启动现在是分开的。

## 提交

为一年后试图理解这次改动、却对产生它的那段对话毫无记忆的人写提交信息。

- 主题用祈使语气，大约 72 个字符以内："Obtain certificates without a cloud account"。
- 正文解释为什么需要这个改动以及它的代价。描述 diff 做了什么是多余的；diff 就在那里。
- 记下对运维者而言改变了的行为，以及升级时必须手工做的事。

## 变更日志

用户可见的改动需要一条变更日志条目，有两个地方可以写。pull request 描述中的 Changelog 块是大多数条目该去的地方：它和它描述的改动一起被审阅，发布机器人会收集它。直接写进 `CHANGELOG.md` 的 Unreleased 下面是另一种方式，是直接向 main 提交的人的做法。运维者观察不到的内部重构两者都不需要；在描述里说明，并给 pull request 打上 `no changelog` 标签。

这条条目也是发布这次改动的东西。每一次向 `main` 的推送，只要在 Unreleased 下留下了内容，就会被切成一个发布版本：版本号来自条目——`Added` 或 `Removed` 意味着新的次版本，其他意味着新的补丁版本——它推送的标签就是构建二进制文件和容器镜像的东西。Unreleased 下什么都没有的推送不发布任何东西，大多数推送都是这样。

推送前想看看会发生什么：

    .github/scripts/cut-release.sh          # 说出版本号，不写任何东西
    .github/scripts/changelog.sh 0.2.0      # 那个版本会带的说明

在笔记本上它只读 `CHANGELOG.md`；它会这样说，并说明原因。读取 pull request 需要 `GITHUB_REPOSITORY` 和一个 token，工作流会传给它。

主版本从不被推断。判定一次改动会破坏正在运行它的人，是一个判断，所以它是"Major release"工作流，手工运行，并输入 MAJOR 这个词。

## 决策

如果你的改动做出了未来读者会质疑的选择，在 `docs/decisions/` 写一条决策记录——见那里的 README。更大的工作先在 `docs/planning/active/` 写设计文档，落地后移到 `done/`。

## 报告安全问题

不要为邮件处理、身份认证或证书签发中任何可被利用的问题开公开的 issue。[`SECURITY.md`](/doc/security) 说明了它该去哪里：GitHub 的私密漏洞报告，在 Security 标签页。
