运维者设置的一切都存放在数据库里，和邮件放在一起。服务器启动时读取它，之后每隔几秒重新读取，所以在仪表盘里做的改动——或者另一个实例做的改动——不用重启就会生效。

没有配置文件。服务器过去由 `teanode.yaml` 描述，把它搬进数据库，正是让多个实例能一起运行、而不会在哪些域名存在或哪些凭据有效上产生分歧的原因。

有两样东西不能放在那里，改从环境变量来：如何访问数据库，以及这个进程是哪个实例。

## 环境变量

用这条命令写出一个起点：

    teanode-server config env --output .env \
      --hostname mail.example.com --domain example.com

有一个变量是必需的：

**`TEANODE_DATABASE_URL`**——配置、邮件和计数器存放的地方，例如 `postgres://teanode:password@postgres:5432/teanode?sslmode=disable`。零散的 `TEANODE_DATABASE_HOST`、`TEANODE_DATABASE_PORT`、`TEANODE_DATABASE_USER`、`TEANODE_DATABASE_PASSWORD`、`TEANODE_DATABASE_NAME`、`TEANODE_DATABASE_SSL_MODE` 和 `TEANODE_DATABASE_LOG_QUERIES` 逐个字段覆盖它。没有默认主机：否则一个缺少该变量的实例会连上一个空的本地数据库，认定自己是一台全新的服务器，然后把自己配置起来——看起来就像成功了。

三个是可选的。第一个在有了多个实例之后才要紧：

**`TEANODE_INSTANCE_ID`**——把这个进程和共享同一个数据库的其他进程区分开。它是用量计数器累加时键的一部分，而计数是靠读出一行再写回去累加的，所以两个共用一个名字的实例会互相丢掉对方的计数。默认为主机名，容器本来就有一个；超过 32 个字符时截取最后 32 个。

**`TEANODE_UPGRADE_DIRECTORY`**——从仪表盘安装的升级在无法覆盖正在运行的二进制文件时把新文件放在哪里，也是下一次启动去找它的地方。设置了 `TEANODE_SERVER_DATA_DIRECTORY` 时默认为它下面的 `upgrade`，否则为空——这时无法替换自身可执行文件的部署会被告知它不能自我升级。它必须是绝对路径，相对路径会被拒绝而不是解析：暂存的二进制文件必须能被从任何工作目录发起的启动再次找到。

它是变量而不是设置，只有一个原因：暂存的二进制文件必须在任何东西打开数据库之前被找到并运行，因为这个程序会回退它不认识的迁移，一个先碰到数据库的旧二进制文件会撤销新版本的 schema。设置在数据库里。这个不能在。

对容器来说，它应当是挂载卷上的一个目录——随附的 `docker-compose.yml` 指定 `/var/lib/teanode/upgrade`。镜像内部的目录在容器被重建之前能用，之后就悄悄变回旧的二进制文件。这个目录会被创建为只有服务器运行用户可访问，而一个别人也可能写过的暂存二进制文件会在下次启动时被拒绝而不是运行。

**`TEANODE_ALLOW_MIGRATION_REVERT`**——允许旧的二进制文件撤销新版本应用过的迁移。默认关闭，而默认值才是有意思的那一半：一次启动发现了它不认识的迁移时，会拒绝运行而不是回退它们，因为回退会删掉那些迁移添加的列以及列里的一切，而走到这一步的三种常见方式都是意外。见 [`docs/coding/database-migrations.md`](https://github.com/ziyan/teanode/blob/main/docs/coding/database-migrations.md)。要有意降级时把它设为 `true`。

### 仅首次运行

其余变量描述数据库里还没有配置时要创建的服务器。之后数据库就是答案，这些变量被忽略——服务器发现它们被设置时会在日志里说明。

| 变量 | 设置 |
| --- | --- |
| `TEANODE_SERVER_NAME` | `server.name` |
| `TEANODE_SERVER_DOMAIN` | 要服务的域名；首次运行时创建，带自己的签名密钥 |
| `TEANODE_SERVER_DATA_DIRECTORY` | `server.dataDirectory` |
| `TEANODE_SERVER_LOG_LEVEL` | `server.logLevel` |
| `TEANODE_SERVER_MAIL_SERVERS` | `server.mailServers`，逗号分隔 |
| `TEANODE_LISTEN_SMTP_INCOMING` | `listen.smtpIncoming` |
| `TEANODE_LISTEN_SMTP_OUTGOING` | `listen.smtpOutgoing` |
| `TEANODE_LISTEN_HTTP` | `listen.http` |
| `TEANODE_LISTEN_HTTPS` | `listen.https` |
| `TEANODE_TLS_HOSTS` | `tls.hosts`，逗号分隔；默认为服务器名 |
| `TEANODE_TLS_ACME_ENABLED` | `tls.acme.enabled` |
| `TEANODE_TLS_ACME_EMAIL` | `tls.acme.email` |
| `TEANODE_SMTP_REQUIRE_REVERSE_DNS` | `smtp.requireReverseDns` |
| `TEANODE_SMTP_DISABLE_SEND` | `smtp.disableSend` |
| `TEANODE_S3_ENABLED` | `storage.s3.enabled` |
| `TEANODE_S3_ENDPOINT` | `storage.s3.endpoint` |
| `TEANODE_S3_BUCKET` | `storage.s3.bucket` |
| `TEANODE_S3_REGION` | `storage.s3.region` |
| `TEANODE_S3_PATH_STYLE` | `storage.s3.pathStyle` |
| `TEANODE_S3_ACCESS_KEY_ID` | `storage.s3.accessKeyId` |
| `TEANODE_S3_SECRET_ACCESS_KEY` | `storage.s3.secretAccessKey` |
| `TEANODE_PASSKEY_ENABLED` | `passkey.enabled` |
| `TEANODE_PASSKEY_RELYING_PARTY_ID` | `passkey.relyingPartyId`；默认为服务器名 |
| `TEANODE_PASSKEY_ORIGINS` | `passkey.origins`，逗号分隔；默认为 https:// 加依赖方 |
| `TEANODE_PASSKEY_REDIS_ADDRESS` | `passkey.redis.address`；只有多个实例时才需要 |
| `TEANODE_PASSKEY_REDIS_PASSWORD` | `passkey.redis.password` |

设置了但为空的变量意味着空，而不是缺失——其中一些是关闭某样东西而不是改变它，而没有值的 `TEANODE_LISTEN_HTTPS` 就是表达"没有 HTTPS 监听器"的方式。所以除非你有意清空设置，否则把键注释掉而不是留空。

首次运行至少需要一个服务器名和一个域名。域名会带着自己的签名密钥被创建，所以在任何人听说它之前 DKIM 就已就绪。之后添加的每个域名都以同样方式获得自己的密钥。不会创建任何账户：第一个打开仪表盘的人自己选择用户名和密码。

## 迁移一台已有的服务器

原本运行在 `teanode.yaml` 上的部署把它加载一次：

    teanode-server config import --file /opt/teanode/teanode.yaml

一切原样带过来——域名和别名的标识符、签名密钥、服务器密钥、会话密钥——因为改动其中任何一个都会破坏正在工作的东西。先停掉服务器，免得它采用一份你还在审阅的配置的一半。`--dry-run` 说明会加载什么，不写任何东西。

反过来则是做一份同样格式的备份：

    teanode-server config export --file backup.yaml

## 需要重启的设置

监听器、TLS、对象存储、数据目录和可选的集成只在进程构建它需要的东西时读取一次。改动其中一项只会保存改动，在实例重启之前不会有别的效果。

每个实例都会注意到并说明——在它的日志里，以及仪表盘的 **设置 → 服务器** 页面，那里列出已过期的设置并提供重启。重启意味着进程退出，由监管它的东西启动一个新的；没有原地重启，因为重点就是把那些东西重新构建一遍。已接收的邮件在磁盘上，之后会被投递；在那几秒钟内连接进来的发件方会重试。

那个页面也会说它认为什么会再次启动进程——容器、systemd，或它看不到的什么。这是猜测：容器的重启策略和 unit 的 `Restart=` 都无法从进程内部读到，所以它说出监管者是谁而不是承诺一定回来，并倾向于给出警告。

重启也是一条命令，所以部署不用浏览器也能做：

    teanode server restart

## 读取和检查

    teanode-server config show                 # 密钥已脱敏
    teanode-server config show --show-secrets
    teanode-server config validate

这些读取服务器读取的同一份环境变量，所以它们在服务器运行的地方运行——在它的容器里，或带着它的 env 文件。在其他任何地方，客户端通过 API 读取和改变同一份配置：`teanode settings show` 看集成，`teanode domain list` 看域名，依此类推。见 [`docs/reference/command-line.md`](/doc/command-line)。

## 会话和令牌

两者都不是配置。两者都是数据库里的行，和邮件放在一起：`session` 是已登录的浏览器，`token` 是让这个工具从别处管理服务器的 API 令牌。

cookie 和令牌是同一种形状——一个标识符、一个密钥、对两者的一个签名——而且只存储密钥的哈希，所以一份数据库的副本并不是一组可用的登录。它们用不同的密钥签名：会话用 `session.key`，令牌用 `server.secret`。因此轮换 `session.key` 仍然会结束服务器上每个账户的每个会话，这是它一直以来的紧急手段；它不影响令牌。

两者都记录最后一次使用的时间和来源，每分钟至多一次，这样仪表盘可以展示它而不用每个请求都写一次数据库。被吊销的会保留三十天并标记为已吊销，好让列表说明它发生了什么；每小时的清理会移除这些以及早已过期的。

每个账户管理自己的。`teanode auth login` 通过仪表盘签发一个，并在发起请求的机器上作为配置档案保存。控制台是例外——它用从服务器密钥铸造的令牌认证，根本不是一个账户，所以 `teanode token create --user ziyan laptop` 是某人不用浏览器得到第一个令牌的方式。

## 密钥

`server.secret`、`session.key`、DKIM 私钥、ACME 账户密钥和任何 AWS 凭据都和其他一切一起存储。搬迁服务器之前，其中两个值得弄明白：

- **`server.secret`** 为每一份 SMTP 凭据的密码签名。把它带到新数据库，否则你配置过的每台设备都不能再发信。
- **`session.key`** 为仪表盘 cookie 签名。丢了它所有人都会被登出，仅此而已。

两者都在第一次启动时生成，永不重新生成。对着同一个数据库启动的第二个实例会采用它们而不是自己生成。

API 从不返回其中任何一个。携带密钥的字段在输出时被脱敏，所以拥有完全权限的令牌也读不回它们。`config export` 会明文写出它们，因为漏掉它们的备份无法恢复出可用的服务器；它写出的文件只有你能读。

## 路径

相对路径相对于 `server.dataDirectory` 解析，后者必须是绝对路径。它过去允许是相对的，相对于存放 `teanode.yaml` 的目录解析；没有文件就没有东西可以相对，相对路径会落在每个进程碰巧启动的任何地方。

## 参考

### `server`

**`name`**——在 SMTP 问候中宣告的名字，也用作发信时的 HELO 名，例如 "mail.example.com"。它必须解析到这台主机，其反向 DNS 也应当匹配，否则接收方服务器会不信任来自这里的邮件。

**`dataDirectory`**——DataDirectory 保存服务器写入的、不在数据库里的一切：密钥、证书、邮件缓冲区和服务器密钥。本文件中其他地方的相对路径相对于它解析。

**`logLevel`**——LogLevel 是 DEBUG、INFO、NOTICE、WARNING、ERROR、CRITICAL 之一。

**`logDirectory`**——LogDirectory 设置后，会收到每封收到邮件的一份 .eml 副本。调试时有用；它会无限增长。

**`secret`**——Secret 为外发邮件的退信返回路径以及由 SMTP 凭据密钥派生的密码签名。首次运行时生成。改变它会让每个 SMTP 密码失效，并让在途邮件的退信无处可归，所以把服务器搬到新机器时它必须一起带走。

**`mailServers`**——MailServers 是要发布在每个域名 MX 记录中的主机，按优先顺序排列。可选；为空时 MX 记录指向这台服务器，这对大多数人运行的单主机部署是对的。当这些域名的邮件到达多个名字时设置它——一对指向同一台主机的 mx1 和 mx2 很常见，它提供了一个可以迁移的目标，不必让每个域名都改 DNS。仪表盘随后会要求每个域名为每个名字发布一条 MX 记录，按给定顺序分别使用优先级 10、20 等等。这些是邮件到达的名字。它们与 tls.hosts 无关，后者是这台服务器持有证书的名字。

### `listen`

**`smtpIncoming`**——SMTPIncoming 从互联网接收邮件。生产环境为 25 端口。

**`smtpOutgoing`**——SMTPOutgoing 从你自己的设备接收经过认证的邮件用于中继。生产环境为 587 端口。

**`http`**——HTTP 提供仪表盘并回答 ACME http-01 挑战。当 tls.acme.challenge 为 http-01 时，80 端口必须能从互联网访问。

**`https`**——HTTPS 通过 TLS 提供仪表盘。

**`debug`**——Debug 设置后提供 Go 的 pprof 端点。只绑定到 localhost。

### `tls`

**`hosts`**——要获取证书的主机名。第一个是主名字。

**`certificateFile`**——CertificateFile 和 PrivateKeyFile 指向你自己管理的 PEM 文件。两者都设置时，不使用 ACME。

**`privateKeyFile`**——见上一个字段；两者一起设置。

**`acme`**——ACME 从 Let's Encrypt 或其他 ACME 提供商自动获取证书。

### `tls.acme`

**`enabled`**——见上一个字段；两者一起设置。

**`email`**——Email 是在 ACME 提供商处注册的联系地址；它会收到到期警告。

**`directoryUrl`**——DirectoryURL 是 ACME 提供商。测试时把它指向 Let's Encrypt 的 staging 目录以避免触发速率限制。

**`challenge`**——Challenge 是证明域名控制权的方式："http-01" 需要 80 端口可达，"tls-alpn-01" 需要 443 端口，"dns-01" 需要下面的 DNS 提供商，并且是获取通配符证书的唯一方式。

**`perDomain`**——PerDomain 为每个域名自己的邮件服务器名以及服务器自己的名字分别获取证书。不开启时，每个域名都被提供服务器的证书，它写着一个发件方没有请求的域名。默认关闭，这样升级服务器不会在没有人决定的情况下，让它为它服务的每个域名向证书机构申请一张证书。

**`accountKey`**——AccountKey 向证书机构标识这台服务器。首次使用时生成，和其他密钥一起保存在这里；丢了它意味着重新注册，能用，但会消耗速率限制。

**`certificate`**——Certificate 和 PrivateKey 保存签发的证书，PEM 格式。它们由续期写在这里，所以一份导出的配置就是一台完整可用的服务器：在别处恢复它会保留证书，而不是再向机构申请一张、消耗速率限制。这与上面的 tls.certificateFile 是相反的选择，理由是：这些由这台服务器写入、别的什么都不读，而你自己管理的证书由别的东西写入，必须留在那个东西放它的地方。

**`privateKey`**——见上一个字段；两者一起设置。

**`route53`**——Route53 用 AWS 托管区域解决 dns-01 挑战。

### `tls.acme.route53`

**`enabled`**——见上一个字段；两者一起设置。

**`zoneId`**——ZoneID 是包含 tls.hosts 记录的托管区域。

**`region`**——见上一个字段；两者一起设置。

**`endpoint`**——Endpoint 指向一个不是 AWS 的 S3 兼容服务，例如 `http://minio:9000`。空表示 AWS。自托管对象存储让多个实例不用共享文件系统、不用在任何地方开账户就能共享一个缓冲区。

**`pathStyle`**——PathStyle 以 `endpoint/bucket` 的形式寻址 bucket。设置了 endpoint 时隐含为真，只值得为了明确而写出。

**`accessKeyId`**——AccessKeyID 和 SecretAccessKey 是和其他密钥一起保存在这里的 AWS 凭据，这样一个文件就是一台完整可用的服务器。两者都留空则改用默认的 AWS 凭据链：环境变量、共享凭据文件，或实例角色。在 EC2 上实例角色是更好的答案，因为没有可泄露的长期密钥。

**`secretAccessKey`**——见上一个字段；两者一起设置。

**`credentialsFile`**——CredentialsFile 是一个 AWS 共享凭据文件，作为上面两个字段的替代。

**`nameservers`**——检查挑战记录是否已传播时要查询的域名服务器，例如 "ns-1.example.net:53"。

### `database`

不和其他设置一起存储——数据库的连接方式不能存在数据库里。它来自 `TEANODE_DATABASE_URL` 及其旁边的变量，上面已有描述。这里列出这些字段，是因为它们是那些变量所设置的东西，也因为 `config show` 会打印它们。

**`host`**——见上一个字段；两者一起设置。

**`port`**——见上一个字段；两者一起设置。

**`user`**——见上一个字段；两者一起设置。

**`password`**——见上一个字段；两者一起设置。

**`name`**——见上一个字段；两者一起设置。

**`sslMode`**——SSLMode 传给 PostgreSQL 驱动：disable、allow、prefer、require、verify-ca 或 verify-full。`require` 加密连接，但相信端口上任何应答者；`verify-full` 还会检查证书由 `sslRootCertificate` 签发并且写着被连接的主机名，这就是阻止网络上别的东西冒充数据库应答的东西。

**`sslRootCertificate`**——SSLRootCertificate 是用来核对服务器证书的 PEM 文件，用于两种 verify 模式。compose 文件会生成一张并挂载在 `/certs/server.crt`；托管的 PostgreSQL 会公布自己的。空表示系统信任库，而自签名证书不在里面。

**`logQueries`**——LogQueries 把每条 SQL 语句回显到日志。非常吵。

### `smtp`

**`trustedSenders`**——TrustedSenders 是其邮件跳过对未知发件方灰名单延迟的域名。

**`maxMessageSize`**——MaxMessageSize 是接受的最大邮件，例如 "70MB"。

**`maxRecipientsIncoming`**——MaxRecipientsIncoming 限制每封入站邮件的收件人数；一个低的值能挫败地址收割。

**`maxRecipientsOutgoing`**——MaxRecipientsOutgoing 限制每封中继邮件的收件人数。

**`greylistDelay`**——GreylistDelay 是未知发件方在邮件被接受前被拖延多久。零表示不延迟。

**`requireReverseDns`**——RequireReverseDNS 拒绝来自没有能解析回自身的反向 DNS 记录的地址的入站邮件。默认开启：它便宜，而且大多数垃圾邮件来自没有反向记录的主机。当这台服务器看不到真实的客户端地址时关闭它——在负载均衡器后面、在私有网络中，或在测试时的容器网络中——因为那里这项检查会拒绝一切。

**`socks5Proxy`**——SOCKS5Proxy 设置后，把外发 SMTP 经由代理路由。当主机自己的 IP 地址信誉不佳或 25 端口外发被封锁时有用。

**`disableSend`**——DisableSend 让服务器不再真正投递邮件。投递会被记录并保持未投递状态。在开发机器上使用。

**`authRateLimit`**——AuthRateLimit 是一个地址每分钟在提交端口上可以做多少次认证尝试，AuthRateBurst 是在该速率生效之前可以一次做多少次。验证凭据是一次 HMAC 和一次比较，很快，所以没有限制的话一个地址可以以网络允许的任何速率猜测。默认值允许邮件客户端把打错的密码重试几次，并阻止一个程序遍历列表。任一为零则禁用限制。

**`authRateBurst`**——在 `authRateLimit` 开始生效之前，一个地址可以一次做多少次尝试。重试打错密码的邮件客户端永远不该碰到它；遍历列表的程序应当在第一秒就碰到。

### `smtp.submission`

应该告诉邮件客户端连接的地址，也就是仪表盘在新凭据旁边显示的内容。

通常它跟随服务器——`server.name`，以及 `listen.smtpOutgoing` 里的端口——两者都可以留空。当有东西转发了不同的端口时设置它们：一个发布 10587 的容器，或一个在外面接管 587 的防火墙。不设的话，仪表盘会把进程碰巧绑定的端口交给别人，而那不是他们的手机能连上的端口。

它不改变服务器做什么。只改变它说什么。

**`host`**——连接到什么。空表示 `server.name`。

**`port`**——连接到哪个端口。空表示 `listen.smtpOutgoing` 里的端口。

### `smtp.relay`

把外发邮件交给一台邮件服务器，而不是查询收件人的 MX 并在 25 端口上连接投递。

大多数人需要它是因为他们的网络封锁了外发 25 端口——几乎每家家用 ISP 和许多托管服务商都这样做，因为那是被入侵的机器发垃圾邮件的方式。中继通过提交端口访问。

它也是这台服务器通过服务商发信的方式。Amazon SES、Postmark 和 Resend 都提供 SMTP 端点，所以没有服务商特定的东西要配置，而且邮件到达时带着这台服务器已经加上的 DKIM 签名。它们的 HTTP API 则是另一回事：只有 SES 接受原样构建好的邮件，Postmark 和 Resend 接收拆开的字段，这意味着由它们重新签名，无法保留你的签名。用它们的 SMTP 端点。

| 服务商 | 主机 | 端口 | 安全 |
| --- | --- | --- | --- |
| Gmail | `smtp.gmail.com` | 587 | `starttls` |
| Amazon SES | `email-smtp.<region>.amazonaws.com` | 587 或 2587 | `starttls` |
| | | 465 或 2465 | `tls` |
| Postmark | `smtp.postmarkapp.com` | 587、2525 或 25 | `starttls` |
| Resend | `smtp.resend.com` | 587 或 2587 | `starttls` |
| | | 465 或 2465 | `tls` |

SES 需要从 IAM 用户派生的 SMTP 凭据，而不是访问密钥本身，而且它们是按区域的。Resend 的用户名是字面字符串 `resend`，密码是你的 API 密钥。Postmark 两者都用它的服务器令牌。

关于 SES 有一点要知道：它会覆盖 `Message-ID` 和 `Date`，所以覆盖这两个头的签名会失效。这台服务器不为它们签名。

由 `mailServer` 类型别名转发的邮件不受影响——它指定自己的目的地，这正是它的意义。

**`enabled`**——外发邮件是否经过中继。

**`host`**——把邮件交给哪台邮件服务器。

**`port`**——通常是 587、465 或 2525。

**`security`**——如何使用 TLS：587 和 2525 用 `starttls`，465 用 `tls`，或者 `none`。

与向陌生人的 MX 投递不同，两种加密模式都会对照主机名检查证书。这里有一个名字可以核对，并且即将发送一个密码，所以接受任何证书就意味着把密码交给任何应答者。`none` 不坚持——提供 STARTTLS 时仍然使用它——但设置了密码时会被直接拒绝。

**`username`** 和 **`password`**——它以什么身份认证。对按地址授权的中继，两者都留空。

### `dkim`

**`selector`**——给新创建域名的密钥的选择器。它在 DNS 中表现为 `<selector>._domainkey.<domain>`，所以只需在域名内唯一，在这里改变它不影响已创建的域名。

### `domains[]`

**`id`**——ID 在存储的邮件、投递记录和用量行中，以及仪表盘 URL 中标识域名。它就是域名本身：已经唯一，在域名被配置的期间保持稳定，并且出现在哪里都可读。更早的配置在这里带着一个生成的标识符，也仍然能用——引用它的行依然匹配。改变它意味着也要更新那些行，所以没有任何东西会自动重写它。

**`domain`**——Domain 是邮件域名本身，例如 "example.com"。

**`subdomain`**——Subdomain 是 CNAME 指向这台服务器的标签，好让退信和 DMARC 报告有地方到达。通常是 "mail"，使 mail.example.com 成为指向 server.name 的 CNAME。

**`linkHost`**——LinkHost 是这台服务器写进它发出的邮件里的地址中的名字——目前是模板里的图片，每张都是属于单封邮件的一个地址。空表示域名的第一个邮件服务器名，当这台服务器在该名字上应答 HTTPS 时这是对的。它常常不是：邮件服务器名解析到的主机，443 端口属于完全不同的东西，于是每封邮件里的每张图片都是坏的，而邮件本身没问题。这里的名字是一种说明这个域名的 HTTPS 究竟在哪里的方式——CDN 后面的顶级域名站点、为此指向这台服务器的一个名字——而不用挪动邮件到达的地方。它必须是一个能通过 HTTPS、带着邮件程序会接受的证书到达这台服务器的名字，并且必须在这个域名之下：别人域名下的地址会告诉读者谁在运行服务器，而这正是按域名区分名字要防止的事。

**`comment`**——Comment 是给运维者的备注；邮件处理从不使用它。

**`dkim`**——DKIM 是为从这个域名发出的邮件签名的密钥。它在创建域名时生成；对应的公钥必须发布到 DNS，仪表盘会展示给你。

**`spamFilterScoreThreshold`**——SpamFilterScoreThreshold 是达到或超过就拒绝邮件的 SpamAssassin 分数。只有启用了 antispam 才有意义。

**`aliases`**——Aliases 决定这个域名的邮件去哪里。每个模式匹配的别名都产生一次投递，所以一个地址可以转发到多个地方；模式为空的别名是兜底别名，只接收其他别名都没有匹配到的邮件。

**`credentials`**——Credentials 可以在提交端口上认证，并以这个域名发信。

### `domains[].dkim`

**`selector`**——这个密钥发布时使用的选择器。

**`privateKey`**——PrivateKey 是 PEM 形式的 PKCS#8 RSA 密钥。

### `domains[].aliases[]`

**`id`**——ID 生成一次后永不改变；存储的投递记录引用它。

**`pattern`**——Pattern 是一个 Go 正则表达式，对收件地址的本地部分——"@" 前面的部分——不区分大小写地匹配。要加锚：“^hello$” 只匹配 hello@，而 "hello" 也匹配 say-hello-now@。空模式使它成为兜底别名。兜底别名是后备：它们只接收没有任何模式匹配的地址的邮件，所以添加一个不会让已经有去处的邮件重复。

**`comment`**——Comment 是给运维者的备注。

**`kind`**——Kind 是 null、email、webhook 或 mailServer 之一。

**`email`**——Email 是 kind 为 email 时的目标地址。

**`webhook`**——Webhook 是 kind 为 webhook 时的目标 URL。

**`mailServer`**——MailServer 是 kind 为 mailServer 时的目标服务器。

**`disabled`**——Disabled 让别名停止匹配而不删除它。

### `domains[].aliases[].mailServer`

**`host`**——见上一个字段；两者一起设置。

**`port`**——见上一个字段；两者一起设置。

**`username`**——见上一个字段；两者一起设置。

**`password`**——见上一个字段；两者一起设置。

### `domains[].credentials[]`

**`id`**——ID 在存储的邮件、投递记录和用量行中，以及仪表盘 URL 中标识域名。它就是域名本身：已经唯一，在域名被配置的期间保持稳定，并且出现在哪里都可读。更早的配置在这里带着一个生成的标识符，也仍然能用——引用它的行依然匹配。改变它意味着也要更新那些行，所以没有任何东西会自动重写它。

**`key`**——Key 是凭据的秘密那一半。

**`alias`**——Alias 设置后，把这份凭据限制为只能以域名的这一个本地部分发信。"noreply" 的凭据就不能以其他任何人的身份发信，这限制了它泄露时的损害。

**`comment`**——Comment 写明持有这份凭据的设备或服务。

**`disabled`**——Disabled 拒绝认证而不删除凭据。

### `users[]`

**`username`**——见上一个字段；两者一起设置。

**`passwordHash`**——PasswordHash 是 bcrypt 哈希。用 "teanode password" 生成一个。

**`email`**——Email 接收通知，例如某个域名的 DNS 记录不再解析。可选。

**`tokens`**——Tokens 认证这个人的命令行客户端，并以他们的身份行动。删除账户会连同它们一起删除。

### `session`

**`key`**——Key 为会话 cookie 签名。首次运行时生成；替换它会让所有人登出，这是有意这么做的方式。

**`lifetime`**——Lifetime 是一次登录持续多久。

### `dns`

**`nameserver`**——要查询的域名服务器，形式为 host:port。公共解析器是合理的默认值，因为这些都是公开记录。

**`checkInterval`**——CheckInterval 是每个已配置域名被重新检查的频率。

**`externalAddressServices`**——ExternalAddressServices 被问及这台服务器看起来来自哪个地址，也就是它的 DNS 记录必须指向的地址。服务器自己弄不清这一点：它接口上的地址通常是私有的，只有外面的东西才能说出发信邮件服务器看到的是什么。依次尝试每一个直到有一个应答。空则禁用查询，仪表盘转而向运维者询问地址。

### `antivirus`

**`enabled`**——见上一个字段；两者一起设置。

**`host`**——见上一个字段；两者一起设置。

**`port`**——见上一个字段；两者一起设置。

### `antispam`

**`enabled`**——见上一个字段；两者一起设置。

**`host`**——见上一个字段；两者一起设置。

**`port`**——见上一个字段；两者一起设置。

### `geoip`

**`enabled`**——见上一个字段；两者一起设置。

**`databaseFile`**——DatabaseFile 是一个 MaxMind .mmdb 文件。

### `storage`

**`directory`**——Directory 保存原始邮件，相对于 server.dataDirectory。它们不放在数据库里，因为它们很大、从不被查询，而且会让备份变得昂贵。

**`spoolRetention`**——SpoolRetention 是一封邮件保留多久，也就是仪表盘能回溯多远显示内容、以及一次停滞的投递还能重试多久。零表示永久保留，最终会填满磁盘。

**`s3`**——见上一个字段；两者一起设置。

### `storage.s3`

**`enabled`**——见上一个字段；两者一起设置。

**`bucket`**——见上一个字段；两者一起设置。

**`region`**——见上一个字段；两者一起设置。

**`endpoint`**——Endpoint 指向一个不是 AWS 的 S3 兼容服务，例如 `http://minio:9000`。空表示 AWS。自托管对象存储让多个实例不用共享文件系统、不用在任何地方开账户就能共享一个缓冲区。

**`pathStyle`**——PathStyle 以 `endpoint/bucket` 的形式寻址 bucket。设置了 endpoint 时隐含为真，只值得为了明确而写出。

**`accessKeyId`**——AccessKeyID 和 SecretAccessKey 是和其他密钥一起保存在这里的 AWS 凭据，这样一个文件就是一台完整可用的服务器。两者都留空则改用默认的 AWS 凭据链：环境变量、共享凭据文件，或实例角色。在 EC2 上实例角色是更好的答案，因为没有可泄露的长期密钥。

**`secretAccessKey`**——见上一个字段；两者一起设置。

**`credentialsFile`**——CredentialsFile 是一个 AWS 共享凭据文件，作为上面两个字段的替代。

### `passkey`

**`enabled`**——Enabled 在登录表单和账户设置中提供通行密钥。默认关闭：一台通过明文 HTTP 访问的服务器，或者名字即将改变的服务器，在上面注册通行密钥会创造出以后无法使用的东西。

**`relyingPartyId`**——RelyingPartyID 是凭据绑定的域名，不带 scheme 和端口——`mail.example.com`，或者用 `example.com` 让同一个通行密钥在每个子域名上都能用。空表示 `server.name`。WebAuthn 永久绑定凭据，所以对着错误名字注册的通行密钥永远不能再用，也无法修复，只能删除。

**`displayName`**——DisplayName 是浏览器请求某人创建或使用通行密钥时显示的名字。空表示 `server.name`。

**`origins`**——Origins 是仪表盘的来源，各自带 scheme 和任何非默认端口：`https://mail.example.com`。来自未列出来源的断言会被拒绝，这就是阻止另一个站点上的页面使用这些凭据的东西。空表示 `https://` 加依赖方。

**`maximumPerUser`**——MaximumPerUser 限制一个账户可以注册多少个。零表示五个，也就是一部手机、一台笔记本、一把安全密钥，以及在删除一个之前替换它的余量。

### `passkey.redis`

进行到一半的通行密钥登录等待的地方。WebAuthn 登录是两个请求，在负载均衡器后面，浏览器没有理由回到它开始的那个实例，所以第一个请求铸造的挑战必须放在第二个请求能找到的地方。只有一个实例时把地址留空，挑战留在进程里；无论哪种方式这里都不保存持久的东西，全部丢失只损失一次重试。

**`address`**——Address，形式为 host:port，例如 `redis:6379`。空表示禁用。

**`username`**——Username，服务器需要时。

**`password`**——Password，服务器需要时。

**`database`**——Database 编号，除非有别的东西共享这台服务器，否则为零。

### `upgrade`

**`enabled`**——Enabled 按 CheckInterval 向发布列表询问最新版本是什么，并在仪表盘里显示。一次到公共端点的 HTTPS 请求，不携带关于这套部署的任何信息。默认开启：知道一个版本存在和安装它不是一回事，而从不被告知的运维者就是在运行去年 bug 的运维者。

**`automatic`**——Automatic 不经询问就安装它找到的东西：下载、对照发布版本的校验和验证、替换这个二进制文件、重启。默认关闭，因为一个发布版本可能改变邮件的处理方式，没有人安装邮件服务器是为了让它在脚下悄悄改变。它接受任何更新的版本，次版本和主版本都一样——一条在次版本处停下的规则，是一条会悄悄停止升级的规则。

在没有地方放新二进制文件的情况下，它会被拒绝，原因显示在仪表盘里：一套无法覆盖自身可执行文件、又没有在 `TEANODE_UPGRADE_DIRECTORY` 中被给予可写暂存目录的部署。容器不会被拒绝——它暂存到自己的数据卷上，下次启动时运行那个，所以升级能在容器重建后存活——但一个从未被给予这样一个数据卷的容器会被拒绝，那时 `docker compose pull` 才是答案。

重启不需要监管者。进程在排空并关闭一切之后用新的二进制文件替换自己的镜像，保持同样的参数和环境——所以手工启动的服务器和 systemd 下的一样能自我升级。

**有一个限制，而且它对最容易为之开启自动升级的那种部署影响最大。** 一个在完成启动前崩溃的版本，只有在新二进制文件是暂存而不是覆盖旧文件的地方才会被自动恢复——容器会再次运行镜像里的二进制文件并说明原因。而二进制文件被原地替换的地方，自己没有任何东西可以退回：监管者会一直重启坏掉的二进制文件，直到有人阻止它。被替换的二进制文件保留在它旁边，所以恢复是一条命令，

    mv /usr/local/bin/teanode.previous /usr/local/bin/teanode

然后重启。自动升级在会暂存的部署上更有价值，在不会暂存的部署上则值得三思。

**`checkInterval`**——CheckInterval 是多久查看一次。默认六小时：足够频繁，让安全发布当天就被注意到；足够稀疏，不至于成为任何人会注意到的请求。启动时读取一次，所以改变它需要重启——仪表盘会这样说。`enabled`、`automatic` 和 `window` 在循环每次醒来时重新读取，无需重启即可生效。

循环本身醒来的频率高于这个值，大多数时候什么也不问。这正是让 `window` 起作用的原因：每六小时一次检查发生在一天中四个固定的时刻，而两小时的窗口会根据进程启动的时间被命中或错过。

**`window`**——Window 把自动升级限制在一天中的某个时段，按本地时间，形式如 `02:00-04:00`。可以跨越午夜。空表示任何时间。升级会重启服务器，其间几秒钟不接收邮件——发件方会重试，但繁忙的时段仍然比安静的时段更糟。

明白地说清验证在这里意味着什么：二进制文件和发布版本的 `SHA256SUMS` 通过 HTTPS 从这台服务器构建自的仓库获取，哈希必须匹配。这证明这些字节是 GitHub 为那个版本提供的字节，并且下载没有损坏。它不证明有人有意发布了它们：任何能向那个仓库发布版本的人都能发布一个二进制文件，而这会安装它。仓库是编译进去的而不是配置的，所以被盗的仪表盘会话不能把服务器指向别人的构建。

### `users[].tokens[]`

**`id`**——ID 标识令牌，是令牌字符串中不保密的那一半。它出现在日志里，所以令牌可以追溯到这里的一个条目并被吊销。

**`name`**——Name 说明持有它的是什么，例如 "laptop"。不唯一。

**`hash`**——Hash 是秘密那一半的 SHA-256，十六进制编码。令牌是 32 个随机字节，所以没有什么需要慢哈希来防护——和密码不同，它无法被猜出。

**`created`**——Created 记录它何时签发，为了运维者方便。

**`expires`**——Expires 设置后，是它停止工作的时间。
