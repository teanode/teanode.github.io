TeaNode は二つのプログラムです。`teanode-server` はメールサーバーと、そのホストにしかできない少数のこと。`teanode` はクライアントで、API を通じてどこからでもサーバーを管理する、運用者が開いているものです。

クライアントが変えるものはすべて、データベースに直接ではなく、動いているサーバーを通ります。だからシェルからの変更は、ダッシュボードからの同じ変更とまったく同じに振る舞います。同じ検証、同じ副作用です。理由は [`docs/decisions/20260818-the-cli-goes-through-the-api.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260818-the-cli-goes-through-the-api.md) を、なぜ二つのプログラムなのかは [`docs/decisions/20260903-two-binaries.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260903-two-binaries.md) を参照してください。

## teanode-server

| コマンド | すること |
| --- | --- |
| `teanode-server run` | サーバーを動かす |
| `teanode-server config env` | 出発点となる環境ファイルを書く |
| `teanode-server config init` | データベースをマイグレーションし、環境変数が記述するものを保存する |
| `teanode-server config show\|validate` | 保存された設定を見る、確かめる |
| `teanode-server config import\|export` | `teanode.yaml` をデータベースに読み込む、または書き出す |
| `teanode-server tls self-signed` | ローカル開発用の証明書 |
| `teanode-server user list\|add\|password\|remove\|reset` | サーバーを通さずにアカウントを回復する |
| `teanode-server password` | エクスポートした設定のためにパスワードをハッシュする |

これらはサーバーが読む環境変数（`TEANODE_DATABASE_URL` など）を読むので、サーバーが動く場所で実行します。そのコンテナの中か、env ファイルをシェルに読み込んで。`teanode-server user` は保存された設定を直接編集し、起動しないサーバーや誰もログインできないサーバーのためにあります。日常のアカウント管理は、サーバーを通す `teanode user` で行います。

## teanode

### サインイン

どこからでも、一度サインインします。

    teanode auth login --url https://mail.example.com

これはブラウザーでダッシュボードを開きます。まだならそこでサインインし、「承認」を押すと、トークンは自分のマシン上のループバック接続でコマンドに戻ってきます。クリップボードにもシェルの履歴にも何も通りません。トークンは*プロファイル*として `~/.config/teanode/profiles.json` に、あなただけが読める形で保存され、以後のすべてのコマンドが話す相手になります。

ブラウザーがコマンドに届かないなら（リモートデスクトップ、制限されたブラウザー）、ページは代わりに貼り付けるコマンド全体を表示します。別の方法で発行したトークンは直接貼り付けられます。

    teanode auth login --url https://mail.example.com --token -

複数のサーバーは複数のプロファイルです。`auth list` が一覧し、`auth switch` が有効なものを切り替え、`--profile NAME`（または `TEANODE_PROFILE`）が一回のコマンドのために別のものを選び、`auth logout` がプロファイルのトークンをサーバー上で失効させて忘れます。

    teanode auth login --url https://staging.example.com --name staging
    teanode --profile staging domain list
    teanode auth switch staging
    teanode auth status

ファイルを持ちたくないスクリプトは `TEANODE_URL` と `TEANODE_TOKEN` を設定します。プロファイルを迂回します。`--url` があってトークンがなければ、そのサーバーの保存済みプロファイルがトークンを貸します。

**サーバー自身の上では**、何も設定する必要はありません。サーバーの環境変数がシェルにあれば（コンテナにはすでにあります）、クライアントは保存された設定からサーバーシークレットを読み、それで署名したトークンを作り、ループバックで接続します。

    docker compose exec teanode teanode user list

    set -a; . /opt/teanode/.env; set +a
    teanode domain list

これが*コンソール*です。アカウントではないので、アカウントに属する操作（トークン、セッション、パスキー）は、受け付ける場所では `--user` が要るか、本当のサインインが要ります。プロファイルもあるシェルからは `--profile local` でコンソールに届きます。

コマンドがどのサーバーと話すかはこの順で決まります。`--url`、次に `--profile`、次に有効なプロファイル、次にコンソール。明示が保存済みに勝ち、保存済みが環境に勝つので、変数を設定したスクリプトが、誰かが最後にログインしたサーバーに驚かされることはありません。

### コマンド

リソースごとにひとつのグループで、API にあるものは `list`、`get`、`create`、`update`、`delete` を持ち、そのリソース固有の動詞が加わります。既定は表で、どのコマンドにもある `--json` が同じものを JSON で出力するので、ひとつのコマンドが人にもスクリプトにも仕えます。

| グループ | 扱うもの |
| --- | --- |
| `auth` | サインインと、保存されたプロファイル |
| `domain` | このサーバーがメールを受け取るドメインと、その DNS レコード |
| `alias` | ドメインのメールがどこへ行くか。`alias match` はあるアドレスが何に当たるかを言う |
| `credential` | このサーバーを通して送るための SMTP 資格情報 |
| `dkim` | 送信メールに署名する鍵と、公開するレコード |
| `user` | このサーバーを管理するアカウント |
| `token` | API トークン。コンソールでの `token create --user` が誰かの最初のトークンを発行する |
| `session` | ダッシュボードにサインインしているブラウザー |
| `passkey` | あなたのアカウントに登録されたパスキー。登録にはダッシュボードが要る |
| `settings` | 任意の連携。`settings set <section> key=value` |
| `server` | 動いているインスタンス。`status`、`restart`、`addresses`、`identity` |
| `upgrade` | 最新のリリースと、そのインストール。`status [--check]`、`apply` |
| `mail` | 扱ったメール。フィルター付きの `list`、`get`、`content`、`download`、`opens`、`count`、`send` |
| `delivery` | 送る途中で何が起きたか、そしてキューである `delivery pending` |
| `report` | ドメインについて受け取った DMARC 集計レポート |
| `template` | ドメインのメールテンプレート。`render` 付き |
| `layout` | テンプレートを描画するときに包む枠 |
| `api` | それ以外のすべて。スキーマから直接 |

いくつかの例。

    teanode domain create example.com
    teanode alias create example.com --pattern '^hello$' --kind email --email me@example.org
    teanode alias match example.com hello
    teanode settings set antispam enabled=true host=127.0.0.1 port=783
    teanode server status
    teanode mail list --domain example.com --status rejected --first 20
    teanode mail send example.com --from hello@example.com --to ann@example.org \
        --template welcome --variable name=Ann
    teanode template render example.com welcome --variable name=Ann
    teanode delivery pending

ものは人が呼ぶように名指しします。ドメインはその名前で、テンプレートはドメインと名前で、エイリアスや資格情報は一覧が印字する識別子で。取り消せないことは先に尋ねます。`--force` は質問を飛ばします。

`settings set` は汎用です。キーと型はサーバー自身のスキーマから来て、`settings describe <section>` がそれを一覧します。値の `-` は端末からエコーなしに読む、シークレットのためのものです。

### API 全体に届く

上のグループはサーバーが今日提供するものを扱います。`teanode api` はすべての操作を扱い、後から加わったものも含みます。手書きの一覧ではなく、サーバーが報告するスキーマで動くからです。

    teanode api list                    # すべての操作
    teanode api list domain             # ドメインに関するもの
    teanode api describe CreateDomain   # 引数、入力の形、戻り値の項目

    teanode api call ListDomains
    teanode api call GetDomain domainId=example.com
    teanode api call CreateDomain domainParameters:='{"domain":"example.com","subdomain":"mail"}'

引数は `name=value` です。数値、真偽値、リスト、オブジェクトには `name:=<json>` を使います。スキーマが数値や真偽値と宣言する型の値は変換されるので、`first=10` は `10` として届きます。

応答は、引数なしで求められるすべての項目を三段の深さまで持ちます。`--depth` がそれを変え、`--select` は生成される選択を丸ごと置き換えます。

    teanode api call ListDomains --select "{ id domain }"

生成されるクエリで表せないものは、クエリを書きます。

    teanode api graphql '{ ListDomains { id domain records { records { type name verified } } } }'
    teanode api graphql --file query.graphql --variables '{"domainId":"example.com"}'

`teanode api` は常に JSON を出力します。

### サーバーが動いていないときに使う

コンソールでは、サーバーが動いていないとき読み取りは保存された設定に戻ります。読み取りは誰の変更も失わず、保存された設定はどのみち最新だからです。初回起動が動くのはこのおかげです。`teanode dkim show example.com` は、サーバーが一度も起動する前に公開すべき DNS レコードを出力します。

書き込みは戻りません。サーバーが止まっているとコマンドは失敗してそう告げます。ダッシュボードから次に保存したときにサーバーが上書きしてしまう変更をするよりは。例外はサーバー自身のプログラムにあります。アカウントの `teanode-server user` と、設定全体の `teanode-server config import` です。
