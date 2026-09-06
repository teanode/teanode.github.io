运行 TeaNode 有两种方式：把两个二进制文件放到一台主机上，或者使用容器镜像。两者都由每个发布版本构建，都内含仪表盘，所以没有别的东西需要部署。

[开始使用](/doc/getting-started)介绍二进制文件的方式。这一页讲容器，以及任何部署都要考虑的事：与服务器一起运行的组件、它如何升级，以及需要备份什么。

## 镜像

    docker pull ghcr.io/ziyan/teanode:latest

镜像里有服务器、客户端和仪表盘，没有别的：没有 shell，没有包管理器。它以 uid 65532 运行，不是 root，只保留 `CAP_NET_BIND_SERVICE` 以便绑定 25、80、443 和 587 端口。

在有人依赖的邮件服务器上，请锁定版本号，而不是跟随 `latest`。升级应当是你在自己选定的日子里主动做的事。

## compose 文件

仓库里的 [`deploy/docker-compose.yml`](https://github.com/ziyan/teanode/blob/main/deploy/docker-compose.yml) 是一套完整的部署：服务器、PostgreSQL，以及它可以选用的各项服务。把它和 `.env` 复制到某处，描述服务器，然后启动：

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
    docker run --rm ghcr.io/ziyan/teanode:latest \
      teanode-server config env \
        --hostname mail.example.com --domain example.com > .env
    docker compose up -d

第一次启动前先编辑 `.env`：它需要一个可访问的 PostgreSQL（compose 文件在 `postgres:5432` 提供了一个），以及一个证书机构可以发送到期提醒的邮件地址。

服务器使用宿主机网络，这样它才能看到来连接的邮件服务器的真实地址。SPF 检查的是连接方的地址，在桥接网络后面，每个发件方看起来都来自 Docker 网关，SPF 就没有意义了。

### 与它一起运行的组件

- **PostgreSQL** 保存配置、服务器处理过的邮件、投递记录、DMARC 报告、用量计数器和模板。它是需要备份的东西。
- **ClamAV** 和 **SpamAssassin** 是可选的扫描器，在 compose 文件里默认启动，但在服务器设置里默认关闭。不想要哪一个，就删掉对应的服务并让设置保持关闭；ClamAV 的特征库需要约 2GB 内存。
- **MinIO** 和 **Redis** 只在运行多个实例时才需要，放在 `cluster` 配置组里。对象存储是原始邮件的去处，让每个实例都能读到任何一个实例处理过的邮件；Redis 用来存放进行到一半的通行密钥登录，因为在负载均衡器后面，浏览器没有理由回到它开始时的那个实例。

### 数据目录

`./data/teanode` 挂载在 `/var/lib/teanode`，保存服务器写入的、不在数据库里的一切：邮件缓冲区、你使用的 GeoIP 数据库，以及暂存的升级文件。它必须对 uid 65532 可读可写。在曾以 root 运行过旧版本的服务器上，它不会是这样：

    chown -R 65532:65532 ./data/teanode

## 升级

仪表盘每六小时检查一次发布列表，并在 **设置 → 服务器** 页面显示最新版本及其发布说明。从那里安装会下载二进制文件，用发布版本的校验和验证，替换正在运行的文件并重启。

在容器里，新的二进制文件不能覆盖镜像里的那一个，因为下一次 `docker compose up` 就会把镜像丢弃。所以它被暂存到数据卷上——`TEANODE_UPGRADE_DIRECTORY`，compose 文件把它设为 `/var/lib/teanode/upgrade`——下一次启动时从那里运行。一个在启动完成前就崩溃的版本会被自动恢复：容器重新运行镜像里的二进制文件，并说明原因。

删掉这个变量不会破坏任何东西。它只是关闭了从仪表盘升级的功能，`docker compose pull` 仍然是升级的方式。

自动升级默认关闭，因为一个发布版本可能改变邮件的处理方式，没有人安装邮件服务器是为了让它在自己脚下悄悄改变。`upgrade.automatic` 打开自动升级，`upgrade.window` 把它限制在一天中的某个时段。见[配置](/doc/configuration#upgrade)。

## 需要重启的设置

监听器、TLS、对象存储、数据目录和可选的集成只在进程启动时读取一次。改动其中任何一项，只会保存改动，在实例重启之前不会有别的效果。仪表盘会这样说，列出已过期的设置，并提供重启；`teanode server restart` 也一样。

重启意味着进程退出，由监管它的东西——容器的重启策略，或 systemd——启动一个新的。已接收的邮件在磁盘上，之后会被投递；在那几秒钟内连接进来的发件方会重试。

## 需要备份什么

数据库。它保存着配置，包括 DKIM 签名密钥、每一份 SMTP 凭据的密码由之派生的服务器密钥、会话密钥，以及 ACME 账户密钥和证书，和邮件放在一起。

一份漏掉这些密钥的备份无法恢复出可用的服务器，所以还有第二种形式：

    teanode-server config export --file backup.yaml

写出完整的配置，包括密钥，格式与 `config import` 读取的相同。这个文件只有你能读。把它放在服务器以外的地方。

磁盘上的邮件缓冲区按 `storage.spoolRetention` 保留一段时间后删除；除非你会想念最近几天的邮件正文，否则不值得备份。

## 多个实例

多个实例可以对着同一个数据库运行。它们通过 PostgreSQL 共享配置，通过对象存储共享存储的邮件，通过 Redis 共享进行到一半的通行密钥登录。给每个实例一个自己的 `TEANODE_INSTANCE_ID`：它是用量计数器累加时键的一部分，两个实例共用一个名字会互相丢掉对方的计数。

    docker compose --profile cluster up -d

会一并启动 MinIO 和 Redis。同时取消 `.env` 中 `TEANODE_S3_*` 块的注释；那里的凭据与 MinIO 启动时用的是同一份，因为服务器就是来连接的那一方。
