运行 TeaNode 有两种方式：容器镜像，或者把两个二进制文件放到一台主机上。两者都由每个发布版本构建，都包含仪表盘，所以没有别的东西需要部署。

[快速开始](/doc/quick-start)用四条命令把容器跑起来。这一页讲 compose 文件里有什么、服务器如何升级，以及需要备份什么。[开始使用](/doc/getting-started)介绍二进制文件的方式。

## 镜像

    docker pull ghcr.io/ziyan/teanode:latest

镜像里有服务器、客户端和仪表盘，没有别的：没有 shell，没有包管理器。它以用户 65532 运行，不是 root，只保留 `CAP_NET_BIND_SERVICE` 这一项能力，用来绑定 25、80、443 和 587 端口。

在有人依赖的服务器上，请锁定版本号，而不是跟随 `latest`。升级应当是你自己决定去做的事。

## compose 文件

仓库里的 [`deploy/docker-compose.yml`](https://github.com/ziyan/teanode/blob/main/deploy/docker-compose.yml) 是一套完整的部署：服务器、PostgreSQL 和可选的服务。把它和 `.env` 放在一起，描述服务器，然后启动：

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
    docker run --rm ghcr.io/ziyan/teanode:latest config env --output - \
      --hostname mail.example.com --domain example.com > .env
    chmod 600 .env
    docker compose up -d

第一次启动前在 `.env` 里设置 `TEANODE_TLS_ACME_EMAIL`：证书机构会用这个地址提醒你证书即将到期。

80 端口必须能从互联网访问，因为证书机构把它的质询放在那里。它回答这些质询，并把其他一切都送到 HTTPS：仪表盘绝不会以明文提供，而且回答里带着 `Strict-Transport-Security`，所以来过一次的浏览器不会再尝试明文 HTTP。

服务器使用宿主机的网络，而不是 Docker 网络。SPF 检查的是邮件服务器连接进来时的地址，在 Docker 网桥后面，每个发件方看起来都来自 Docker 网关。

到 PostgreSQL 的连接是加密并经过验证的。官方的 PostgreSQL 镜像不提供 TLS，所以 compose 文件会生成一张证书并用它启动 PostgreSQL，`config env` 写出的 `TEANODE_DATABASE_URL` 要求 `sslmode=verify-full`，对照这张证书检查。如果指向你自己的 PostgreSQL，就把 `sslrootcert` 指向那台服务器的证书机构，或者降到 `sslmode=require`，只加密而不检查是谁在应答。

### 与它一起运行的组件

- **PostgreSQL** 保存配置和服务器处理过的一切：邮件、投递记录、DMARC 报告、用量计数器、模板。它是你要备份的东西。
- **ClamAV** 和 **SpamAssassin** 扫描邮件中的病毒和垃圾邮件。compose 文件会启动它们，但在设置里打开之前服务器不会使用它们。不想要就从文件里删掉对应的服务；ClamAV 需要大约 2GB 内存。
- **MinIO** 和 **Redis** 只用于运行多个实例，放在 `cluster` 配置组里。MinIO 保存原始邮件，让每个实例都能读到任何一个实例收到的邮件。Redis 保存进行到一半的通行密钥登录，因为在负载均衡器后面，第二个请求可能落到与第一个不同的实例上。

### 数据目录

`./data/teanode` 挂载在 `/var/lib/teanode`，保存服务器写到数据库之外的东西：邮件缓冲区、你使用的 GeoIP 数据库，以及暂存的升级文件。它必须对用户 65532 可读可写。如果旧版本曾以 root 运行，这个目录属于 root，服务器读不了；修一次即可：

    chown -R 65532:65532 ./data/teanode

## 升级

仪表盘每六小时检查一次新版本，并在 **设置 → 服务器** 页面显示最新版本及其发布说明。从那里安装会下载二进制文件，用发布版本的校验和核对，替换正在运行的文件并重启。

在容器里，新的二进制文件不能替换镜像里的那一个，因为下一次 `docker compose up` 就会丢弃镜像。所以它被保存在数据卷上，也就是 `TEANODE_UPGRADE_DIRECTORY` 指定的目录，下一次启动从那里运行。如果新版本启动失败，容器会退回到镜像里的二进制文件，并报告原因。

你可以删掉这个变量。那样从仪表盘升级就不再可用，`docker compose pull` 就是升级的方式。

自动升级默认关闭。一个发布版本可能改变邮件的处理方式，而邮件服务器不应该在你不知情的情况下改变。用 `upgrade.automatic` 打开它，用 `upgrade.window` 把它限制在一天中的某个时段。见[配置](/doc/configuration#upgrade)。

## 需要重启的设置

监听器、TLS、对象存储、数据目录和可选的服务只在进程启动时读取一次。改动其中一项会保存改动，但在实例重启之前不会生效。仪表盘会告诉你哪些设置在等待，并提供重启；`teanode server restart` 也一样。

重启意味着进程退出，由监管它的东西——容器的重启策略或 systemd——启动一个新的。已经接收的邮件在磁盘上，之后会被投递。在中间那几秒钟连接进来的发件方会重试。

## 需要备份什么

数据库。除了邮件，它还保存着配置和密钥：DKIM 签名密钥、每个 SMTP 密码由之派生的服务器密钥、会话密钥，以及 ACME 账户密钥和证书。

也有文件形式：

    teanode-server config export --file backup.yaml

这会写出完整的配置，包括密钥，格式与 `config import` 读取的相同。这个文件只有你能读。把它放在服务器以外的地方。

磁盘上的邮件缓冲区按 `storage.spoolRetention` 保留一段时间后删除。它只保存最近几天的邮件正文，通常不值得备份。

## 多个实例

多个实例可以对着同一个数据库运行。它们通过 PostgreSQL 共享配置，通过对象存储共享存储的邮件，通过 Redis 共享通行密钥登录。给每个实例一个自己的 `TEANODE_INSTANCE_ID`。它是用量计数器存储时键的一部分，两个同名的实例会互相覆盖对方的计数。

    docker compose --profile cluster up -d

会一并启动 MinIO 和 Redis。同时取消 `.env` 中 `TEANODE_S3_*` 块的注释。那里的凭据就是 MinIO 启动时用的凭据。
