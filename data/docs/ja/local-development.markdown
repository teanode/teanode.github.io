動く TeaNode のビルドと、それが向くデータベースを用意する方法です。部品が何で、どう組み合わさるかはリポジトリ直下の [`AGENTS.md`](https://github.com/ziyan/teanode/blob/main/AGENTS.md) を、変更が従うべき規約は [`docs/coding/coding-standards.md`](https://github.com/ziyan/teanode/blob/main/docs/coding/coding-standards.md) を参照してください。

## 前提

- Go 1.25 以降
- Node 20 以降。ダッシュボードのため
- Docker。テストが使う PostgreSQL のため
- 任意: `make lint` が実行するローカルの命名チェック。入っていなければ `make lint` は注記を出してスキップします

## ビルドとテスト

    make build          # build/teanode-server と build/teanode（クライアント）
    make web            # ダッシュボードを internal/frontend/static にビルドする
    make                # 整形、ビルド、テスト
    make test           # テスト。PostgreSQL のコンテナを自動で起動する
    make lint           # golangci-lint とローカルの命名チェック
    make lint-ci        # CI が実行するものだけ

ひとつのパッケージのテストを実行するには、

    go test -mod=vendor -v ./internal/util/dkim -run TestVerify

依存は vendor に入っています。`go.mod` を変えたら `go mod tidy && go mod vendor` を実行し、`vendor/` の変更を一緒にコミットしてください。

## 近道

    make dev

これは PostgreSQL と MinIO を起動し、`dev/.env` がなければ書き、それでデータベースを用意し、自己署名証明書を生成して、サーバーを動かします。`make dev-frontend` はその隣でダッシュボード自身の開発サーバーを動かします。

以下はすべて、同じことを手でやる手順です。

## PostgreSQL

`make dev-up` がひとつ起動し、テストは自分のものを起動します。完全に手で動かすサーバーにはひとつ必要です。

    docker run --restart always --name teanode-postgres \
      --env POSTGRES_DB=teanode \
      --env POSTGRES_USER=teanode \
      --env POSTGRES_PASSWORD=teanode \
      --publish 127.0.0.1:5432:5432 \
      -d postgres

その上でシェルを開くには、

    docker exec -it teanode-postgres psql -U teanode teanode

スキーマを消して、サーバーにマイグレーションから作り直させるには、

    docker exec -it teanode-postgres psql -U teanode teanode \
      -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'

## 開発サーバーを動かす

設定はデータベースにあり、環境変数がその場所を告げます。`scripts/dev-config.bash` はノート PC で安全な `dev/.env` を書きます。

- `TEANODE_LISTEN_SMTP_INCOMING=127.0.0.1:10025` と `TEANODE_LISTEN_SMTP_OUTGOING=127.0.0.1:10587`。ポート 25 と 587 を bind するのに root が要らないように
- `TEANODE_LISTEN_HTTP=127.0.0.1:10081`、`TEANODE_LISTEN_HTTPS=`（空。HTTPS リスナーをオフにする）
- `TEANODE_TLS_ACME_ENABLED=false`。開発機には公開の名前がないので
- `TEANODE_SMTP_DISABLE_SEND=true`。エイリアスの間違いが見知らぬ人にメールを送らないように
- `TEANODE_S3_*` は `make dev-up` が起動する MinIO を指す

これらが サーバーを記述するのは、空のデータベースに対する初回起動のときだけです。以降はデータベースが答えを持ち、食い違うものがあればサーバーが警告します。やり直すには `make dev-clean`。

    set -a; . ./dev/.env; set +a
    ./build/teanode-server config init
    ./build/teanode-server tls self-signed
    ./build/teanode-server run --log-level DEBUG

その環境変数がシェルにあれば、クライアントは他に何も設定せずにループバック経由でそのサーバーに届きます。`teanode domain list`、`teanode dkim show example.com`、`teanode user list`。別のシェルからは、代わりに `teanode auth login --url http://127.0.0.1:10081` でサインインします。

`swaks` でメッセージを送るには、

    swaks --to hello@example.com --from someone@webmail.example --server 127.0.0.1:10025

送信者は、実在してメールサーバーを公開しており、失敗を拒否せよと求めていないドメインの下にある必要があります。予約された example ドメインはいまどれも DMARC ポリシー `reject` を公開しているので、`someone@example.net`「から」のメールは入口で追い返されます。正しいけれど役には立ちません。上の `webmail.example` は自分で選んだドメインの代わりです。ポリシーが `none` のもの——大手のウェブメールはたいていそうです——は採点されて受け入れられます。サーバーは、ドメインに MX レコードがまったくない送信者も拒否します。

転送ではなくメールボックスへ受け取るには、ドメインのエイリアスタブで種類「メールボックス」のエイリアスを自分のものに向け、そのアドレス宛に送ります。一通が両方に落ちるのを見る一番簡単な方法は、ローカルにもうひとつアカウントを作ってそのメールボックスへ、**新しいメッセージ** で送ることです。

## 任意のサービス

どちらも既定でオフです。そのコードパスに取り組むときにだけ、ダッシュボードで、または `teanode-server config import` で読み戻すエクスポート済み設定でオンにしてください。

### SpamAssassin

    docker run --restart always --name spamassassin \
      --publish 127.0.0.1:783:783 \
      --env 'UPDATE_PERIOD=*/15 * * * *' \
      -d tiredofit/spamassassin

手でメッセージを採点するには。`internal/util/spamc` がしているのはこれです。

    (echo -en 'SYMBOLS SPAMC/1.5\r\n\r\n'; cat message.eml) | nc -q0 localhost 783

    SPAMD/1.1 0 EX_OK
    Content-length: 154
    Spam: False ; -0.2 / 5.0

    DKIM_SIGNED,DKIM_VALID,FREEMAIL_FROM,HTML_MESSAGE,SPF_PASS,URIBL_BLOCKED

`antispam.enabled: true` とドメインの `spamFilterScoreThreshold` を設定して使います。しきい値以上のスコアのメールは拒否されます。

### ClamAV

    docker run --restart always --name clamav \
      --publish 127.0.0.1:3310:3310 \
      --volume /var/lib/clamav \
      -d clamav/clamav

生きているか確かめ、EICAR のテスト文字列を与えます。どのスキャナーもウイルスとして報告しますが、ウイルスではありません。

    echo 'nSTATS' | nc -q0 localhost 3310

    (echo -en 'nINSTREAM\n\0\0\0\x44'; \
     echo -n 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'; \
     echo -en '\0\0\0\0') | nc -q0 localhost 3310

`antivirus.enabled: true` を設定して使います。

## root なしで本物のメールポートを bind する

本番では compose ファイルが `CAP_NET_BIND_SERVICE` を与えるので、サーバーは root ではなく uid 65532 として 25、80、443、587 を bind します。高いポートで動かしてリダイレクトしたいなら、これでも動きます。

    iptables  -t nat -A PREROUTING -i eth0 -p tcp --dport 25  -j REDIRECT --to-port 10025
    iptables  -t nat -A PREROUTING -i eth0 -p tcp --dport 587 -j REDIRECT --to-port 10587
    ip6tables -t nat -A PREROUTING -i eth0 -p tcp --dport 25  -j REDIRECT --to-port 10025
    ip6tables -t nat -A PREROUTING -i eth0 -p tcp --dport 587 -j REDIRECT --to-port 10587
