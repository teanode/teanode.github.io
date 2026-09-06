このページでは、docker compose で数分のうちにメールサーバーを動かします。DNS レコード、ポート 25 の問題、メールが届かないときにすることは、そのあとで[はじめる](/doc/getting-started)を読んでください。

## 必要なもの

- ドメインと、その DNS レコードを編集できること。
- 固定の公開アドレスを持ち、インターネットからポート 25、80、443、587 に到達できるホスト。
- compose プラグイン付きの Docker。compose ファイルが PostgreSQL を起動します。

## 1. サーバーを起動する

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
    docker run --rm ghcr.io/ziyan/teanode:latest config env --output - \
      --hostname mail.example.com --domain example.com > .env
    chmod 600 .env
    docker compose up -d

`mail.example.com` をサーバーの名前に、`example.com` をメールを受け取りたいドメインに置き換えます。ホスト名は MX レコードが指す名前なので、DNS レコードを追加できる名前でなければなりません。

起動する前に `.env` を開き、`TEANODE_TLS_ACME_EMAIL` に認証局から連絡を受けられるアドレスを設定します。それ以外は既定値のままで動きます。このファイルにはデータベースのパスワードが入っているので、`chmod 600` にしておきます。サーバーは最初の起動で HTTP-01 により証明書を取得します。これにはインターネットからポート 80 に到達できることが必要です。

compose ファイルは ClamAV と SpamAssassin も起動します。どちらも任意です。要らなければファイルから削除してください。ClamAV だけで約 2GB のメモリを使います。

## 2. ダッシュボードを取得する

`https://mail.example.com/` を開きます。最初の訪問者が唯一のアカウントを作るので、すぐにやってください。競争したくなければ、シェルからアカウントを作ることもできます。

    docker compose exec teanode teanode user create you

## 3. DNS レコードを公開する

ダッシュボードはドメインに必要な DNS レコードをすべて列挙し、定期的に確認して、まだ足りないものを示します。DNS プロバイダーでそれらを公開してください。MX レコードがメールを届かせ、SPF、DKIM、DMARC のレコードがそれを信頼されるものにします。

## 4. アドレスを転送する

ドメインのページでエイリアスを追加します。`^hello$` のようなパターンは `hello@example.com` を自分のアドレスへ転送し、空のパターンは残りすべてを受け取るキャッチオールです。別のアカウントからそのアドレスにメッセージを送り、メール一覧に現れるのを確かめてください。

## 次に読むもの

- [はじめる](/doc/getting-started)は DNS レコードをひとつずつ説明し、メールが届かないときに何を確かめるかを書いています。
- [配備する](/doc/deploying)は、コンテナイメージ、アップグレード、バックアップの対象について。
- [設定](/doc/configuration)にはすべての設定項目があります。
