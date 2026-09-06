这一页带你为一个域名搭起邮件服务器，从零开始到邮件到达并被转发。大约需要二十分钟，其中大部分是在等 DNS。

## 开始之前

你需要三样东西：

- **一个域名**，以及编辑它的 DNS 记录的权限。
- **一台地址稳定的主机**，从互联网可以访问它的 25、80、443 和 587 端口。
- **PostgreSQL**，用来保存服务器处理过的邮件和配置。

### 25 端口的问题

租主机之前先读这一段。大多数家用 ISP 和相当多的云服务商默认封锁**外发**的 25 端口——DigitalOcean、Google Cloud、Azure 和 Oracle Cloud 都是如此，Amazon EC2 在你申请之前也是。

入站的 25 端口通常没问题。被封的是外发，而没有它，这台服务器能收到邮件却无法投递——转发会失败，而一切看起来都正常。

在下决定之前先检查：

    nc -vz gmail-smtp-in.l.google.com 25

如果它挂住或被拒绝，你有三个选择：请服务商解除封锁、换一家没有封锁的，或者设置 `smtp.socks5Proxy`，把外发邮件经由一台能访问 25 端口的主机送出。

## 1. 安装

    curl -L -o /usr/local/bin/teanode-server \
      https://github.com/ziyan/teanode/releases/latest/download/teanode-server-linux-amd64
    curl -L -o /usr/local/bin/teanode \
      https://github.com/ziyan/teanode/releases/latest/download/teanode-linux-amd64
    chmod +x /usr/local/bin/teanode-server /usr/local/bin/teanode

`teanode-server` 是服务器，仪表盘就在它里面，所以没有别的东西需要安装或提供服务。`teanode` 是管理它的客户端，服务器上和你自己的电脑上都应该有一份；它有 macOS 构建。也有一个容器镜像，两者都在里面，`deploy/` 目录里有 compose 文件。

## 2. 描述服务器

配置存放在 PostgreSQL 里。环境变量说明如何访问它，以及——服务器第一次对着空数据库启动时——要创建什么样的服务器。

    mkdir -p /opt/teanode && cd /opt/teanode
    teanode-server config env --output .env \
      --hostname mail.example.com \
      --domain example.com

`--hostname` 是这台服务器的名字。它是服务器在 SMTP 中宣告的名字，也是你的 MX 记录要指向的名字，所以必须是一个你能为其添加 DNS 记录的名字。

`--domain` 是你想接收邮件的域名。它成为这台服务器服务的第一个域名。

打开 `.env`，把 `TEANODE_DATABASE_URL` 设为你的 PostgreSQL，把 `TEANODE_TLS_ACME_EMAIL` 设为一个证书机构可以发送到期提醒的地址。然后初始化数据库：

    set -a; . ./.env; set +a
    teanode-server config init

这会运行迁移并存储配置。它为域名生成一个 DKIM 签名密钥和一个服务器密钥，从此都存放在数据库里——所以数据库才是需要备份的东西。

此后 `.env` 只用来读取数据库在哪里：设置在仪表盘里修改，服务器会在日志里记下任何与存储值不一致的首次运行变量。

### 迁移一台已有的服务器

如果这套部署原本运行在 `teanode.yaml` 上，就加载它，而不是新建。标识符、签名密钥、服务器密钥和会话密钥都会原样带过来，所以存储的邮件仍然能对应上，SMTP 密码仍然有效，没有人会被登出：

    teanode-server config import --file /opt/teanode/teanode.yaml

## 3. 发布 DNS

问服务器要发布什么：

    teanode dkim show example.com

你需要四条记录。第一条是唯一决定邮件能否到达的；其余的决定邮件是否被信任。

| 类型 | 名称 | 值 |
| --- | --- | --- |
| A | `mail.example.com` | 你服务器的地址 |
| MX | `example.com` | `10 mail.example.com` |
| TXT | `example.com` | `v=spf1 mx -all` |
| TXT | `teanode1._domainkey.example.com` | `dkim show` 打印的内容 |

逐条说明：

- **A**——MX 里的名字必须能解析，而且要解析到*这台*主机。如果服务商允许，把该地址的反向 DNS 也设置成一致；接收方服务器会检查。
- **MX**——没有它，无论其他配置多正确，都不会有邮件到达。一条指向你服务器的记录就够了。如果你希望邮件到达一对名字——`mx1` 和 `mx2`，这样以后迁移服务器时不用每个域名都改 DNS——把它们列在 `server.mailServers` 下，仪表盘会要求每个域名同时发布两条。
- **SPF**——`v=spf1 mx -all` 的意思是"我的 MX 记录里的主机发送我的邮件，别人都不行"。如果有别的东西以这个域名发信——新闻邮件服务、CRM——把它加进来，否则那些邮件会开始失败。
- **DKIM**——为你的外发邮件签名，让接收方能确认邮件没有被篡改，而且确实来自你。

邮件跑通之后，再加第五条：

    TXT   _dmarc.example.com   v=DMARC1; p=none; rua=mailto:rua@mail.example.com

`p=none` 不要求任何人拒绝任何邮件；它只索要报告，服务器会解析并展示给你。等报告显示你自己的邮件都能通过，再改为 `p=quarantine`，然后 `p=reject`。

## 4. 检查并启动

    teanode-server config validate
    teanode-server run

第一次启动时，服务器通过 HTTP-01 获取证书，这需要 80 端口能从互联网访问。如果不能，日志会第一个告诉你。

### 升级一个曾以 root 运行的容器

镜像现在以 uid 65532 运行，不是 root，只保留 `CAP_NET_BIND_SERVICE` 来绑定低端口。如果你的数据目录是旧版本创建的，它属于 root，服务器会读不了。在启动新镜像之前做一次：

    chown -R 65532:65532 /opt/teanode/data/teanode

## 5. 认领仪表盘

打开 `https://mail.example.com/`。第一个访问者创建唯一的账户，所以要立刻去做——赶在服务器暴露在外的时间长到足以被别人发现之前。如果你不想赌这个先后：

    teanode user add you

仪表盘会按域名准确列出哪些 DNS 记录还缺失或有误，让你看到还剩什么，而不是靠猜。它会定期检查，不需要刷新页面。

## 6. 给自己发一封

从别处的账户给 `hello@example.com` 发一封邮件。几秒钟内它应该出现在仪表盘的邮件列表里，显示发件方的 SPF、DKIM 和 DMARC 判定，以及一次投递到你用 `--forward-to` 设置的地址的尝试。

如果它没有到达，队列页面会说明原因。常见原因，按出现频率排序：

1. MX 记录还没有传播开。用 `dig MX example.com` 检查。
2. 25 端口无法从外部访问。从别处用 `nc -vz mail.example.com 25` 检查。
3. 转发目标拒绝了它，这时队列会显示对方服务器自己的原话。

## 接下来

- **更多地址。** 别名用正则表达式匹配，所以 `^(sales|support)$` 是一个别名。空的模式是兜底别名，接收其他别名都没有匹配到的邮件。
- **从你自己的设备发信。** 在域名的设置页为每台设备添加一份凭据；每份都可以限制为一个发件地址。它们在 587 端口上认证。
- **更多域名。** 每个域名默认有自己的签名密钥。如果你希望它们共用一个，用 CNAME 把 `<selector>._domainkey` 指向主域名，仪表盘会显示要发布的记录。
- **[配置](/doc/configuration)** 记录了每一个字段。
- **[命令行](/doc/command-line)** 介绍 CLI，它可以访问整个 API，做重复性的事情时是更好的工具。
