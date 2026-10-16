先只运行助手，它不需要域名，也不需要邮件端口；以后再加上你自己域名的邮件，已有的东西都会保留。

## 你需要什么

- 一台一直开着的电脑：Linux 服务器、闲置的电脑，或装了 Docker Desktop 的 Mac。在 Linux 上缺 Docker 时安装命令会替你装上，PostgreSQL 也一起带上。
- 一个用来思考的模型：OpenAI、Anthropic 或 Gemini 的 API 密钥，一个你已经在付费的 ChatGPT 套餐，或者你自己的 Ollama 或 vLLM。
- 要用 iPhone 应用，或者离开那台电脑时使用，需要在它前面放一个 HTTPS 地址，任何反向代理都行。

## 1. 启动服务器

    curl -fsSL https://teanode.com/install.sh | sh

它把 compose 文件和新生成的数据库密码放在 `/opt/teanode`（不是 root 时放在 `~/teanode`），启动容器，等仪表盘能打开为止。再运行一次会保留密码和数据。想先看看脚本，打开 [teanode.com/install.sh](https://teanode.com/install.sh)。手动做是这样：

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.assistant.yml
    echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" > .env
    chmod 600 .env
    docker compose -f docker-compose.assistant.yml up -d

它只在这台电脑自己的回环地址的 8080 端口上监听，别处都不监听。

## 2. 认领仪表盘

打开 http://127.0.0.1:8080/。如果 TeaNode 跑在服务器上，而不是你面前的这台电脑上，先用 SSH 隧道连过去：

    ssh -L 8080:127.0.0.1:8080 you@your-server

第一个访问的人创建唯一的账户，也就是管理员，所以请马上做这一步。

## 3. 启动助手

账户创建好后，TeaNode 只问一件事：你的助手用来思考的模型服务。选择 OpenAI、Anthropic 或 Gemini 并粘贴它的 API 密钥，或者选择**你自己的服务器**，填上这台服务器访问你的 Ollama 或 vLLM 所用的地址。按**启动我的助手**。它会检查密钥、选好模型（OpenAI 上是最新的 `sol`，快速回答用 `luna`）、自己重启，然后打开你的对话，助手会先介绍自己。

它选的东西可以在**管理 → 助手 → 模型**里更改；邮件、日历和联系人在**管理 → 服务器 → 初始设置**里。服务器上的其他人在**设置项 → 你的助手**里开启自己的助手。

## 4. 从手机访问

把 8080 端口放到一个带 HTTPS 地址的反向代理后面，把代理的地址加进服务器设置里的受信任代理，然后从那个地址打开仪表盘。iPhone 应用连接的就是这个地址。

## 带上你自己的邮件

要在你自己的域名上收发邮件，改用邮件的 compose 文件，或者以后在**管理 → 服务器 → 初始设置**里给这台服务器加上邮件。

### 邮件需要什么

- 一个域名，以及编辑它的 DNS 记录的能力。
- 一台有稳定公网地址的主机，从互联网可以访问 25、80、443 和 587 端口；如果你想用邮件程序
  读邮件，还需要 993 端口。
- 带 compose 插件的 Docker，同上。

### 带邮件启动

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

### 创建账户

打开 `https://mail.example.com/`。第一个访问的人会创建唯一的账户，而这个账户是管理员，
并且有自己的邮箱，所以请立刻这么做。如果你不想抢，也可以从 shell 里创建账户：

    docker compose exec teanode teanode user create you

### 发布 DNS 记录

仪表盘会列出你的域名需要的每一条 DNS 记录，定期检查它们，并显示哪些还缺失。到你的 DNS
服务商那里发布这些记录。MX 记录让邮件到达；SPF、DKIM 和 DMARC 记录让邮件被信任。

### 把一个地址指向你的邮箱

邮箱在有地址指向它之前收不到任何东西。在域名的 **别名** 标签页上添加一个，种类选
**投递进一个邮箱** 并选中你的：模式 `^you$` 让 `you@example.com` 成为你的。从另一个账户
给它发一封邮件，看着它到达你的收件箱，未读。

应该去别处的地址就改为转发：像 `^hello$` 这样的模式把 `hello@example.com` 送到你已经在读的
邮箱、一个 webhook，或另一台邮件服务器；空的模式是兜底别名，接收其他别名都没有匹配到的邮件。
同一个域名两种都能用。

### 用邮件程序读它

在 **邮箱设置 → 邮件程序** 里创建一份应用专用密码，按设备命名，然后连同你的地址一起填进
Apple Mail、Thunderbird 或你的手机。程序通过 993 端口的 IMAP 读取，通过 587 发信，而且
大多数程序会从地址自己找到这两项。密码只显示一次。

## 接下来

- [部署](/doc/deploying)介绍容器镜像、升级和需要备份的内容。
- [代理](/doc/agents)说明助手做什么，以及打开它之前要考虑什么。
- [开始使用](/doc/getting-started)逐条解释邮件的 DNS 记录，以及邮件没有到达时该检查什么。
- [配置](/doc/configuration)记录了每一项设置。
