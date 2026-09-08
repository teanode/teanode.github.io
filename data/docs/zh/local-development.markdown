如何得到一个可用的 TeaNode 构建和一个指向它的数据库。关于各个部分是什么、如何组合，见仓库根目录的 [`AGENTS.md`](https://github.com/ziyan/teanode/blob/main/AGENTS.md)。关于你的改动必须遵循的约定，见 [`docs/coding/coding-standards.md`](https://github.com/ziyan/teanode/blob/main/docs/coding/coding-standards.md)。

## 前提

- Go 1.25 或更新
- Node 20 或更新，用于仪表盘
- Docker，用于测试使用的 PostgreSQL
- 可选：`make lint` 运行的本地命名检查；未安装时 `make lint` 会跳过它们并给出提示

## 构建与测试

    make build          # build/teanode-server 和 build/teanode（客户端）
    make web            # 把仪表盘构建到 internal/frontend/static
    make                # 格式化、构建、测试
    make test           # 测试；自动启动一个 PostgreSQL 容器
    make lint           # golangci-lint 加本地命名检查
    make lint-ci        # 只运行 CI 运行的那些

运行单个包的测试：

    go test -mod=vendor -v ./internal/util/dkim -run TestVerify

依赖是 vendor 进来的。修改 `go.mod` 之后，运行 `go mod tidy && go mod vendor`，并把 `vendor/` 的改动一起提交。

## 最短路径

    make dev

它会启动 PostgreSQL 和 MinIO，在 `dev/.env` 缺失时写一份，据此设置数据库，生成一张自签名证书，然后运行服务器。`make dev-frontend` 在旁边运行仪表盘自己的开发服务器。

下面的一切是同样的事情手工来做。

## PostgreSQL

`make dev-up` 会启动一个，测试也会启动自己的。完全手工运行的服务器需要一个：

    docker run --restart always --name teanode-postgres \
      --env POSTGRES_DB=teanode \
      --env POSTGRES_USER=teanode \
      --env POSTGRES_PASSWORD=teanode \
      --publish 127.0.0.1:5432:5432 \
      -d postgres

在它上面开一个 shell：

    docker exec -it teanode-postgres psql -U teanode teanode

清空 schema，让服务器从迁移重建它：

    docker exec -it teanode-postgres psql -U teanode teanode \
      -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'

## 运行开发服务器

配置存放在数据库里，环境变量说明数据库在哪里。`scripts/dev-config.bash` 写出一份在笔记本上安全的 `dev/.env`：

- `TEANODE_LISTEN_SMTP_INCOMING=127.0.0.1:10025` 和 `TEANODE_LISTEN_SMTP_OUTGOING=127.0.0.1:10587`，这样你不需要 root 就能绑定 25 和 587 端口
- `TEANODE_LISTEN_HTTP=127.0.0.1:10081`，`TEANODE_LISTEN_HTTPS=`（空，即关闭 HTTPS 监听器）
- `TEANODE_TLS_ACME_ENABLED=false`，因为开发机器没有公开的名字
- `TEANODE_SMTP_DISABLE_SEND=true`，这样别名里的一个错误不会给陌生人发邮件
- `TEANODE_S3_*` 指向 `make dev-up` 启动的 MinIO

这些只在第一次对着空数据库运行时描述服务器。之后数据库保存答案，服务器会对其中任何不一致的变量发出警告。要重新开始，`make dev-clean`。

    set -a; . ./dev/.env; set +a
    ./build/teanode-server config init
    ./build/teanode-server tls self-signed
    ./build/teanode-server run --log-level DEBUG

有了这些环境变量，客户端不需要任何额外设置就能通过回环接口访问那台服务器：`teanode domain list`、`teanode dkim show example.com`、`teanode user list`。在另一个 shell 里，则用 `teanode auth login --url http://127.0.0.1:10081` 登录。

用 `swaks` 给它发一封邮件：

    swaks --to hello@example.com --from someone@webmail.example --server 127.0.0.1:10025

发件人必须在一个真实存在、发布了邮件服务器、并且没有要求拒绝失败邮件的域名下：现在每一个保留的示例域名都发布了 `reject` 的 DMARC 策略，所以一封"来自" `someone@example.net` 的邮件会在门口就被挡回去——这是正确的，也帮不上忙——上面的 `webmail.example` 代表一个你自己选的域名。策略是 `none` 的域名（大多数大型网页邮箱都是）会被打分并接受。服务器同样会拒绝域名完全没有 MX 记录的发件人。

要投递进一个邮箱而不是转发，就在域名的别名标签页上把一个种类为"邮箱"的别名指向你的邮箱，然后发到那个地址。想看一封邮件同时落在两处，最简单的办法是再开一个本地账户的邮箱：用 **新邮件** 从一个发给另一个。

## 可选服务

两者默认都关闭。只有在你处理那条代码路径时，才在仪表盘里打开它们，或者在用 `teanode-server config import` 加载回来的导出配置里打开。

### SpamAssassin

    docker run --restart always --name spamassassin \
      --publish 127.0.0.1:783:783 \
      --env 'UPDATE_PERIOD=*/15 * * * *' \
      -d tiredofit/spamassassin

手工给一封邮件评分，这正是 `internal/util/spamc` 做的事：

    (echo -en 'SYMBOLS SPAMC/1.5\r\n\r\n'; cat message.eml) | nc -q0 localhost 783

    SPAMD/1.1 0 EX_OK
    Content-length: 154
    Spam: False ; -0.2 / 5.0

    DKIM_SIGNED,DKIM_VALID,FREEMAIL_FROM,HTML_MESSAGE,SPF_PASS,URIBL_BLOCKED

设置 `antispam.enabled: true` 和某个域名的 `spamFilterScoreThreshold` 来使用它。得分达到或超过阈值的邮件会被拒绝。

### ClamAV

    docker run --restart always --name clamav \
      --publish 127.0.0.1:3310:3310 \
      --volume /var/lib/clamav \
      -d clamav/clamav

确认它活着，并喂给它 EICAR 测试字符串——每个扫描器都会把它报告为病毒，而它并不是：

    echo 'nSTATS' | nc -q0 localhost 3310

    (echo -en 'nINSTREAM\n\0\0\0\x44'; \
     echo -n 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'; \
     echo -en '\0\0\0\0') | nc -q0 localhost 3310

设置 `antivirus.enabled: true` 来使用它。

## 不用 root 绑定真正的邮件端口

在生产环境中，compose 文件授予 `CAP_NET_BIND_SERVICE`，所以服务器以 uid 65532 而不是 root 绑定 25、80、443 和 587。如果你更愿意在高端口运行并重定向，这样也行：

    iptables  -t nat -A PREROUTING -i eth0 -p tcp --dport 25  -j REDIRECT --to-port 10025
    iptables  -t nat -A PREROUTING -i eth0 -p tcp --dport 587 -j REDIRECT --to-port 10587
    ip6tables -t nat -A PREROUTING -i eth0 -p tcp --dport 25  -j REDIRECT --to-port 10025
    ip6tables -t nat -A PREROUTING -i eth0 -p tcp --dport 587 -j REDIRECT --to-port 10587
