这一页用 docker compose 在几分钟内把邮件服务器跑起来。关于 DNS 记录、25 端口的问题，以及邮件没有到达时该怎么办，之后再读[开始使用](/doc/getting-started)。

## 你需要什么

- 一个域名，以及编辑它的 DNS 记录的权限。
- 一台有稳定公网地址的主机，从互联网可以访问它的 25、80、443 和 587 端口。
- 带 compose 插件的 Docker。compose 文件会替你启动 PostgreSQL。

## 1. 启动服务器

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
    docker run --rm ghcr.io/ziyan/teanode:latest config env --output - \
      --hostname mail.example.com --domain example.com \
      --database-url 'postgres://teanode:teanode@127.0.0.1:5432/teanode?sslmode=disable' > .env
    docker compose up -d

把 `mail.example.com` 换成你服务器的名字，把 `example.com` 换成你想接收邮件的域名。主机名是你的 MX 记录将要指向的名字，所以必须是一个你能为其添加 DNS 记录的名字。

启动之前，打开 `.env`，把 `TEANODE_TLS_ACME_EMAIL` 设为一个证书机构能联系到你的地址。其余设置都有可用的默认值。服务器在第一次启动时通过 HTTP-01 获取证书，这需要 80 端口能从互联网访问。

compose 文件也会启动 ClamAV 和 SpamAssassin。两者都是可选的。不想要就从文件里删掉；单是 ClamAV 就需要大约 2GB 内存。

## 2. 认领仪表盘

打开 `https://mail.example.com/`。第一个访问者创建唯一的账户，所以要马上去做。如果你不想赌这个先后，可以从 shell 创建账户：

    docker compose exec teanode teanode user create you

## 3. 发布 DNS 记录

仪表盘列出你的域名需要的每一条 DNS 记录，定期检查它们，并显示哪些还缺失。到你的 DNS 服务商那里发布这些记录。MX 记录让邮件到达；SPF、DKIM 和 DMARC 记录让邮件被信任。

## 4. 转发一个地址

在域名的页面上添加一个别名。像 `^hello$` 这样的模式把 `hello@example.com` 转发到你的一个地址，空的模式则是接收其余一切的兜底别名。从另一个账户给这个地址发一封邮件，看着它出现在邮件列表里。

## 接下来

- [开始使用](/doc/getting-started)逐条解释 DNS 记录，以及邮件没有到达时该检查什么。
- [部署](/doc/deploying)介绍容器镜像、升级和需要备份的内容。
- [配置](/doc/configuration)记录了每一项设置。
