这个页面用 docker compose 在几分钟内跑起一台邮件服务器。DNS 记录、25 端口的问题，以及
邮件没有到达时该怎么办，之后请读[开始使用](/doc/getting-started)。

## 你需要什么

- 一个域名，以及编辑它的 DNS 记录的能力。
- 一台有稳定公网地址的主机，从互联网可以访问 25、80、443 和 587 端口；如果你想用邮件程序
  读邮件，还需要 993 端口。
- 带 compose 插件的 Docker。compose 文件会替你启动 PostgreSQL。

## 1. 启动服务器

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
    docker run --rm ghcr.io/ziyan/teanode:latest config env --output - \
      --hostname mail.example.com --domain example.com > .env
    chmod 600 .env
    docker compose up -d

把 `mail.example.com` 换成你服务器的名字，把 `example.com` 换成你想要收邮件的域名。主机名
就是你的 MX 记录要指向的名字，所以它必须是一个你能添加 DNS 记录的名字。

启动之前，打开 `.env` 并把 `TEANODE_TLS_ACME_EMAIL` 设为证书机构能联系到你的地址。其余
都有可用的默认值。这个文件里有数据库密码，所以要 `chmod 600`。服务器在第一次启动时通过
HTTP-01 获取证书，这需要 80 端口能从互联网访问。

compose 文件还会启动 ClamAV，它是可选的；不想要就从文件里删掉，光是它就要大约 2GB 内存。
垃圾邮件由服务器内部的过滤器打分，这件事不需要别的程序。

## 2. 认领仪表盘

打开 `https://mail.example.com/`。第一个访问的人会创建唯一的账户，而这个账户是管理员，
并且有自己的邮箱，所以请立刻这么做。如果你不想抢，也可以从 shell 里创建账户：

    docker compose exec teanode teanode user create you

## 3. 发布 DNS 记录

仪表盘会列出你的域名需要的每一条 DNS 记录，定期检查它们，并显示哪些还缺失。到你的 DNS
服务商那里发布这些记录。MX 记录让邮件到达；SPF、DKIM 和 DMARC 记录让邮件被信任。

## 4. 把一个地址指向你的邮箱

邮箱在有地址指向它之前收不到任何东西。在域名的 **别名** 标签页上添加一个，种类选
**投递进一个邮箱** 并选中你的：模式 `^you$` 让 `you@example.com` 成为你的。从另一个账户
给它发一封邮件，看着它到达你的收件箱，未读。

应该去别处的地址就改为转发：像 `^hello$` 这样的模式把 `hello@example.com` 送到你已经在读的
邮箱、一个 webhook，或另一台邮件服务器；空的模式是兜底别名，接收其他别名都没有匹配到的邮件。
同一个域名两种都能用。

## 5. 用邮件程序读它

在 **邮箱设置 → 邮件程序** 里创建一份应用专用密码，按设备命名，然后连同你的地址一起填进
Apple Mail、Thunderbird 或你的手机。程序通过 993 端口的 IMAP 读取，通过 587 发信，而且
大多数程序会从地址自己找到这两项。密码只显示一次。

## 接下来

- [开始使用](/doc/getting-started)逐条解释 DNS 记录，以及邮件没有到达时该检查什么。
- [部署](/doc/deploying)介绍容器镜像、升级和需要备份的内容。
- [配置](/doc/configuration)记录了每一项设置。
