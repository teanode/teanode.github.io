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

プロファイルは*読み取り専用*にできます。このマシンでは、変更はすべて送られる前に拒否され、読み取りは普段どおり通ります。見てよいが触ってはいけないスクリプトやエージェントに渡すのは、このプロファイルです。トークン自体は変わりません。サーバーは変更を受け付けるはずで、このプロファイルがそれを頼まないだけです。

    teanode auth login --url https://mail.example.com --read-only
    teanode auth set-read-only mail.example.com true
    teanode auth set-read-only mail.example.com false

どのコマンドにも付けられる `--read-only`、または環境変数の `TEANODE_READ_ONLY=1` が、プロファイルが何と言っていようと、ひとつのコマンドやひとつのシェルに同じことをします。逆向きのフラグはありません。この変数を渡されたものが、口先で抜け出すことはできません。拒否された変更は終了コード 3 で終わり、三つのスイッチのどれを戻せばよいかを告げます。`auth logout` は今も変わらずプロファイルのトークンを失効させます。プロファイルを忘れてトークンを生かしたままにするほうが、悪い結末だからです。

保存したプロファイルにもう一度サインインすると——`--url` なしの `auth login`（`--profile` が指すもの、なければ有効なもの）や、どれかの `--url` または `--name` を付けたもの——トークンが差し替えられ、古いものはサーバー上で失効させられ、そう告げられます。読み取り専用と証明書の設定は、別に指示しない限り保たれます。読み取り専用のプロファイルでは、古いトークンはそのまま残され、手で失効させるために名前が示されます。

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
| `domain` | このサーバーがメールを受け取るドメイン、その DNS レコード、そして公開する `logo` |
| `alias` | ドメインのメールがどこへ行くか。`alias match` はあるアドレスが何に当たるかを言う |
| `credential` | このサーバーを通して送るための SMTP 資格情報 |
| `dkim` | 送信メールに署名する鍵と、公開するレコード |
| `user` | このサーバーのアカウント。`teanode-server` の `user rescue` はひとつを管理者にする |
| `group` | 誰が何をしてよいか、どのドメインの上でか。メンバー、ロール、ドメイン |
| `role` | グループが持つ、名前の付いた権限の集まり。`role permissions` が与えられるものを列挙する |
| `audit` | 管理上の変更の記録。絞り込みつき |
| `mailbox` | メールボックスとその中のすべて。`folder`、`rule`、`contact`、`subscription`、`device`、`autoreply`、`programs` |
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
    teanode alias create example.com --pattern '^you$' --kind mailbox --mailbox <メールボックス id>
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

### スクリプトから、エージェントから

同じコマンドがスクリプトにも仕えます。誰も見ていないときに効いてくる違いが三つあります。

質問は、答えられる相手にしかしません。標準入力が端末でないとき、確認を求めるはずのコマンドは、誰も見ないプロンプトを出す代わりに `--force` の案内を添えてその場で断ります。`TEANODE_FORCE=1` は、すでに決めているシェルのために、その種の質問すべてに答えます。

`--json` は成功だけでなく失敗にも効きます。エラーは `{"error": "...", "exitCode": N}` として標準エラーに出るので、呼び出し側は両方を同じように解析できます。`teanode api` は常に JSON を出力し、そのエラーも同じです。

終了コードは、どの種類の問題が起きたかを言います。

| コード | 意味 |
| --- | --- |
| `0` | うまくいった |
| `1` | ほかの何かが起きた。メッセージが何かを言う |
| `2` | コマンドの呼び方が違う。引数が足りない、存在しないフラグ、尋ねる相手のいない確認、選択肢にない値 |
| `3` | 読み取り専用のプロファイル、`--read-only`、`TEANODE_READ_ONLY` に拒否された変更。何も送られていない |
| `4` | サーバーにそんなものはない |
| `5` | サーバーがトークンを拒否した。もう一度サインインする |
| `6` | サーバーにまったく届かなかった |

シェル補完はバイナリ自身から出てきます。

    source <(teanode completion bash)
    source <(teanode completion zsh)

### シェルからメールボックスを使う

`teanode mailbox` は、ダッシュボードのメールボックスからダッシュボードを取り除いたものです。たいていの人はメールボックスをひとつしか持たないので、`--mailbox` が要るのは複数あるときだけで、フォルダーは識別子ではなく名前で指します。

    teanode mailbox folder create GitHub
    teanode mailbox rule add GitHub --when from:contains:@github.com --move GitHub --stop
    teanode mailbox rule apply

条件は `フィールド:演算子:値` で、繰り返せて、すべてが一致しなければなりません。フィールドは `from`、`to`、`subject`、`header`、`score`、`sender-known`、`any`。演算子は `contains`、`equals`、`matches`（正規表現）、`above`、`below`。header の条件はヘッダー名を書きます。`--when header:List-Id:contains:golang`。二つのフィールドは値を求めず、単独で書きます。`--when sender-known` と `--when any` です。アクションはフラグで、`--move`、`--mark-read`、`--flag`、`--forward`、`--delete`、そして `--stop` はこのルールで実行を終えます。

ルールが振り分けるのは、それが書かれた後に届いたメールです。`rule apply` は、保存されたルールをフォルダーにすでにあるものの上に走らせ、到着時と同じように移動、マーク、フラグ、削除を行います。転送は繰り返しません。古いメールをもう一度送ることはしないからです。`rule test` は何が起きるかを告げるだけで、何も変えません。

このグループの残りは、メールボックスの残りです。`mailbox list` は開けるメールボックスを、`--all` はサーバー上のすべてのメールボックスを所有者とともに並べます。`show` と `update` はメールボックスの名前と署名を読み書きします。`folder list|create|rename|move|pin|unpin|delete` は左欄のツリー、`rule list|add|remove|enable|disable|test|apply` は振り分け、`subscription list|show|mail|unsubscribe` は受け取っているメーリングリスト、`contact list|add|remove` は覚えたアドレス、`device list|add|remove` はメールプログラムがサインインに使うアプリパスワード、`autoreply show|set|off` は不在時の自動返信、`programs` はメールプログラムに入力するホストとポートです。

### メーリングリストと、そこから抜けること

サブスクリプションは保存されたひとつのものではなく、保存されたものの集まりです。同じ
リストを名指したメールすべてを、リストが自分のために公開している識別子か、送ってくる
アドレスでまとめたものです。ですから作るものは何もなく、鍵は `subscription list` が
印字するものです。

    teanode mailbox subscription list
    teanode mailbox subscription mail <key>
    teanode mailbox subscription unsubscribe <key>

抜けることは誰か他人への依頼で、三つのやり方のうちコマンドラインで終わるのはひとつだけ
です。ワンクリックの依頼は送られ、メールは送信者が指定したアドレスへ送られ、ページしか
用意していない送信者については、人が開くためにそのページが印字されます。どちらにしても
すでにメールボックスにあるメールは残ります。止まるのは、まだ送られていないほうです。

### ドメインが公開する印

`teanode domain logo show|publish|remove` は、このサーバーが自分のドメインのために
ホストする BIMI のロゴです。

    teanode domain logo publish example.com mark.svg
    teanode domain check example.com          # 公開すべきレコードを印字する
    teanode domain logo remove example.com

ファイルは保存される前に、印が満たさなければならない制限付きのプロファイルに対して検査
されます。スクリプトなし、アニメーションなし、他所から取ってくるものなし、正方形。拒否は
どの規則が拒否したかを名指します。受信側は同じファイルを黙って拒否し、送信者は理由を
知ることがないからです。指し示すロゴができれば `domain check` が公開すべきレコードを
印字し、公開されたレコードを無効にしてしまうものがあればその下に書きます。多くの場合は
DMARC のポリシーが none であることです。

取り除くと、そのファイルの提供が止まります。レコードも下ろしてください。さもないと受信側
は何も答えないアドレスを取りに行き続けます。

### スキーマに載っていないものがふたつ

JSON ではなくバイト列だからです。ひとつめ、下書きのファイルは `multipart/form-data` で、ファイルごとに `file` パートひとつとして `PUT /api/v1/mailbox/drafts/{itemId}/attachments` へ（まだ存在しない下書きなら `POST /api/v1/mailbox/{mailboxId}/drafts/attachments` へ）、同じ bearer トークンを添えて送ります。`curl -F file=@report.pdf` でできます。返ってくるのは保存された下書きで、各パートの番号が入っています。

ふたつめはドメインのロゴです。`POST /api/v1/domains/{domainId}/logo` に `file` パートを
ひとつ添えて送るもので、`domain logo publish` が送っているのがこれです。読むことと取り除く
ことはスキーマの中の普通の操作で、送ることだけがそうではありません。

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

### teanode agent

あなた自身のエージェント、そして運用者にとっては全員のもの。どのコマンドも API を通る
ので、ここでの変更はエージェントのページがしたはずの変更と同じです。

| コマンド | 何をするか |
| --- | --- |
| `teanode agent ask <message \| ->` | エージェントに何か言い、答えを印字します。`--new` は名前のある会話を始め、`--conversation` はひとつを続け、`--attach FILE`（繰り返せます）はファイルを渡します――画像は見せられ、テキストファイルは読まれ、それ以外は名前だけ告げられます。`--json` はすべての出来事を流し、`--quiet` は答えだけを印字します。あなたの承諾が要るツールは端末で y か n を尋ねます。フラグにはしません |
| `teanode agent chat` | 同じことを、空行が来るまで一往復ずつ |
| `teanode agent conversation list\|show\|new\|rename\|main\|delete` | 主な会話と、名前のある会話。`list --query` は題名や話された言葉から探します。`main` は名前のある会話を主にするか、新しい主な会話を始めて古いほうを名前つきで残します。`delete` は先に尋ね、その会話に付いてきたファイルも持っていきます |
| `teanode agent run list\|show` | エージェントが自分でしたこと。仕分け、要約、返信の記録 |
| `teanode agent tools` | あなたのエージェントが持つツール。あなたが使える形で、リスク区分と、先に尋ねるかどうかとともに |
| `teanode agent memory list\|add\|remove` | エージェントがあなたについて憶えていること。`add "会計" "帳簿は Maria" --applies-to triage,reply` は、その記憶を読む実行を指定します |
| `teanode agent schedule list\|add\|remove\|run` | 決まった時刻に自分ですること。`add Morning "0 8 * * 1-5" "今日わたしを待っているものは？" --deliver mail`。あなたの時間帯の cron 行です。あるいは単一の時刻 `"@at 2026-09-12 09:00"`、あるいは今からの隔たり `"@in 20m"`。後者はそれが指す時刻として保存され、一度だけ走ります |
| `teanode agent feedback` | あなたのしたことから記録された訂正。エージェントは例として見せられます |
| `teanode agent channel list\|set\|unlink\|remove` | エージェントと話すチャットアプリ。あなた自身の Telegram か Discord のボットです。`set telegram --token -` はボットのトークンを標準入力から読みます。`list` は、あるチャットが `/link CODE` としてボットに送ることで結び付くコードと、ボットが動いているかどうかを示します。`unlink` は新しいコードを引きます |
| `teanode agent skill list\|search\|install\|update\|remove\|enable\|disable\|scope\|secret` | スキルレジストリからインストールしたツール。このサーバーの全員のためのものです。`search` は何があるかを言い、`install weather` は何かを保つ前に署名とハッシュを確かめ、`update` は名前なしなら新しいものをすべて入れます。`scope <name> operator\|person\|skill` は、そのスキルの秘密をここで誰が埋めるかを決めます――サーバー全体でひと組の値か、各人のものか、スキルが宣言したとおりか。インストールと scope には `server:manage` が要ります。コマンドを走らせるスキルは、あなたが接続したコンピューターで走らせ、先に尋ね、誰も見ていない実行からは決して使われません。`secret list\|set\|clear` は、スキルがサーバーではなく *あなた* に求める値のためのものです。`secret set news NEWSAPI_KEY` は端末からエコーなしで読み、端末がなければ標準入力から読みます |
| `teanode agent mcp list\|connect\|disconnect` | 運用者が宣言した接続先のサーバーと、あなたのそこへの接続。`connect tracker --credential -` はあなたの資格情報を標準入力から読み、認可するサーバーは開くべきアドレスを印字します。`--loopback` は認可をこの端末に返します。ループバックアドレスにしか答えないサービスのためです |
| `teanode agent settings show\|set` | あなたのエージェント。`set enabled=true name=Bertie instructions=-` は長い値を標準入力から読みます。キーは `set --help` が並べます |
| `teanode agent settings categories add\|remove` | 決まったものの隣に置く、あなた自身の分類 |
| `teanode agent settings forget` | エージェントと、それが学んだすべてを削除します。先に尋ねます |
| `teanode agent source list\|grant\|revoke\|set` | エージェントが届いてよいメールボックスと、それぞれで何をするか。`set --mailbox work triage=true auto-reply=true auto-reply.scope=known` |
| `teanode agent usage [--since] [--by day\|kind\|mailbox\|model]` | あなたのトークン |
| `teanode agent draft <item-id> [--say "…"]` | メールへの返信をエージェントに書かせ、あなたが使えるように印字します。何も保存されず、送られません |
| `teanode agent replies [--status held\|sent\|cancelled\|refused\|failed] [--mailbox]` | エージェントがあなたのために書いた返信と、それぞれがどうなったか。メールをそのままにした場合はその理由も |
| `teanode agent replies cancel <reply-id>` | 留め置かれた返信を取り消します。下書きは消え、何も送られません |
| `teanode agent admin usage\|list\|limit\|disable\|enable\|dead-letters\|retry` | 全員のエージェント。`agent:audit` が要ります。日、種類、メールボックス、モデル、エージェントごとのトークン。各人のソースと今日の支出。一人だけの上限を、トークンで、あるいは `--cost` で金額で。停止のスイッチ。ワーカーが諦めた仕事 |

どのコマンドもシェルの時間帯と言語をリクエストとともに送ります。ダッシュボードがブラウザー
のものを送るのと同じで、端末に住む人も、ブラウザーに住む人と同じように位置づけられます。

### teanode computer

あなた自身のコンピューターを、あなたのエージェントに接続します。このプログラムが走って
いるあいだ、エージェントにはツールが二つ増えます。`shell` はここでコマンドを走らせ、
`filesystem` はあなたのファイルを読み、編集し、書き、複製し、並べ、検索し、grep します。
あなたとして、このマシンのどこででも、あなたの端末がするのと同じように。使えるのはあなたが
居合わせている会話だけです。定時の実行、仕分けの実行、誰も見ていないものは、決してあなたの
コンピューターを見ません。マシンを変えるコマンド、あるいはマシンの外へ届くコマンド（削除、
移動、インストール、sudo、push、ssh、そしてより重い形のもの）は先にあなたに尋ねます。
引き出しのカードの上か、端末の上で。移動または削除されるファイル、そしてマシンが自分で
走らせるもの（シェルの起動ファイル、鍵、自動起動）への書き込みも同じです。あなたに代わって
拒まれるものは何もありません。最後の言葉はあなたの「はい」です。カードはサーバーのもの
です。プログラムはサーバーが送るものを走らせるので、端末が前に座る人を信頼するのと同じ
ようにサーバーを信頼します。プログラムはあなたとしてサインインし、使うのは有効なプロ
ファイルのトークンで、サーバーとしてではありません。コンピューターは同時に何台も接続でき、
名前で見分けられます。コマンドは `/bin/sh -c`（Windows では `cmd /C`）の下で走り、ログイン
シェルではないので、あなたのエイリアスは効きません。プログラムは四つの要求に同時に答え、
五つめは待たせずに断ります。

| コマンド | 何をするか |
| --- | --- |
| `teanode computer start [--name NAME]` | プログラムをバックグラウンドで走らせます。`--name` はこのコンピューターの呼び名（既定はホスト名）。ログは `~/.config/teanode/computer.log` |
| `teanode computer status` | プログラムがここで走っているか、そしてサーバーがあなたのどのコンピューターを見ているか |
| `teanode computer stop` | プログラムを終えます |
| `teanode computer daemon [--name NAME]` | 同じプログラムを前面で。接続が切れれば繋ぎ直し、中断されるまで走ります。端末のため、あるいはサービスマネージャーのため |

運用者は `agent.features.computer` で、サーバー全体についてコンピューターを止められます。
